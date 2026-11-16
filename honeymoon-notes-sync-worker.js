const OWNER = "johnson88022";
const REPO = "honeymoon";
const BRANCH = "main";
const ALLOWED_LOGIN = "johnson88022";
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const MAX_HTML_BYTES = 20 * 1024 * 1024;

const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
});

function cookieValue(request, name) {
  const part = (request.headers.get("Cookie") || "").split(";").map(x => x.trim()).find(x => x.startsWith(name + "="));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : "";
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function base64url(bytes) {
  return bytesToBase64(bytes).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function sign(value, keyText) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(keyText), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}

function embeddedNotes(html) {
  const match = html.match(/<script\b[^>]*\bid=["']embedded-notes-data["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return {};
  try { return JSON.parse(match[1]); } catch { return {}; }
}

function mergeNotesIntoHtml(incomingHtml, currentHtml) {
  const incoming = embeddedNotes(incomingHtml);
  const current = embeddedNotes(currentHtml);
  const merged = { ...incoming };
  for (const [key, oldNote] of Object.entries(current)) {
    const newNote = incoming[key];
    if (!newNote) { merged[key] = oldNote; continue; }
    const oldTime = Number(oldNote?.updatedAt) || 0;
    const newTime = Number(newNote?.updatedAt) || 0;
    const oldHasContent = !!(oldNote?.text || oldNote?.photos?.length);
    const newHasContent = !!(newNote?.text || newNote?.photos?.length);
    if (oldTime > newTime || (!oldTime && !newTime && oldHasContent && !newHasContent)) merged[key] = oldNote;
  }
  const data = JSON.stringify(merged).replace(/</g, "\\u003c");
  const tag = `<script id="embedded-notes-data" type="application/json">${data}</script>`;
  if (/<script\b[^>]*\bid=["']embedded-notes-data["'][^>]*>[\s\S]*?<\/script>/i.test(incomingHtml)) {
    return incomingHtml.replace(/<script\b[^>]*\bid=["']embedded-notes-data["'][^>]*>[\s\S]*?<\/script>/i, tag);
  }
  return incomingHtml.replace(/<\/head>/i, `${tag}</head>`);
}

function decodeBase64Text(value) {
  const binary = atob(value.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(binary, character => character.charCodeAt(0)));
}

async function hasSession(request, env) {
  const token = cookieValue(request, "notes_session");
  if (!token || !env.GH_TOKEN) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  let decoded;
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    decoded = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  } catch { return false; }
  const [login, expiryText] = decoded.split("|");
  const expiry = Number(expiryText);
  if (login !== ALLOWED_LOGIN || !Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) return false;
  return signature === await sign(decoded, env.GH_TOKEN);
}

function clearCookie(name, path = "/") {
  return `${name}=; Path=${path}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

async function saveToGitHub(html, env) {
  const api = `https://api.github.com/repos/${OWNER}/${REPO}/contents/index.html`;
  const headers = {
    "authorization": `Bearer ${env.GH_TOKEN}`,
    "accept": "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "honeymoon-notes-sync"
  };
  const current = await fetch(`${api}?ref=${BRANCH}`, { headers });
  if (!current.ok) throw new Error(`GitHub could not read index.html (${current.status}).`);
  const currentFile = await current.json();
  const currentHtml = currentFile.encoding === "base64" && typeof currentFile.content === "string"
    ? decodeBase64Text(currentFile.content) : "";
  const safeHtml = currentHtml ? mergeNotesIntoHtml(html, currentHtml) : html;
  const bytes = new TextEncoder().encode(safeHtml);
  if (bytes.length > MAX_HTML_BYTES) throw new Error("HTML exceeds the 20 MB save limit.");
  const body = {
    message: "Save travel notes",
    branch: BRANCH,
    sha: currentFile.sha,
    content: bytesToBase64(bytes)
  };
  const updated = await fetch(api, { method: "PUT", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!updated.ok) throw new Error(`GitHub could not update index.html (${updated.status}).`);
  return await updated.json();
}

async function loadLatestHtmlFromGitHub(env) {
  const api = `https://api.github.com/repos/${OWNER}/${REPO}/contents/index.html?ref=${BRANCH}`;
  const response = await fetch(api, { headers: {
    "authorization": `Bearer ${env.GH_TOKEN}`,
    "accept": "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "honeymoon-notes-sync"
  }});
  if (!response.ok) return null;
  const file = await response.json();
  if (file.encoding !== "base64" || typeof file.content !== "string") return null;
  const binary = atob(file.content.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  return new Response(bytes, { headers: {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store"
  }});
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get("Origin") || "";
    const cors = origin === url.origin ? {
      "access-control-allow-origin": url.origin,
      "access-control-allow-credentials": "true",
      "vary": "Origin"
    } : {};

    if (path === "/health") {
      return json({ service: "honeymoon-notes-sync", githubTokenConfigured: !!env.GH_TOKEN,
        oauthConfigured: !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) });
    }

    if (path.startsWith("/auth/")) {
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.GH_TOKEN) {
        return new Response("GitHub sync is not configured yet.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
      }
      if (path === "/auth/start" && request.method === "GET") {
        const state = base64url(crypto.getRandomValues(new Uint8Array(32)));
        const authorize = new URL("https://github.com/login/oauth/authorize");
        authorize.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
        authorize.searchParams.set("redirect_uri", `${url.origin}/auth/callback`);
        authorize.searchParams.set("scope", "read:user");
        authorize.searchParams.set("state", state);
        return new Response(null, { status: 302, headers: {
          location: authorize.toString(),
          "set-cookie": `notes_oauth_state=${state}; Path=/auth/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`
        }});
      }
      if (path === "/auth/callback" && request.method === "GET") {
        const state = url.searchParams.get("state") || "";
        const savedState = cookieValue(request, "notes_oauth_state");
        const code = url.searchParams.get("code") || "";
        if (!code || !state || state !== savedState) return new Response("GitHub login could not be verified.", { status: 403 });
        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST", headers: { "accept": "application/json", "content-type": "application/json" },
          body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code })
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok || !tokenData.access_token) return new Response("GitHub login failed.", { status: 401 });
        const profileResponse = await fetch("https://api.github.com/user", { headers: {
          "authorization": `Bearer ${tokenData.access_token}`, "accept": "application/vnd.github+json", "user-agent": "honeymoon-notes-sync"
        }});
        if (!profileResponse.ok) return new Response("Could not verify the GitHub account.", { status: 401 });
        const profile = await profileResponse.json();
        if (profile.login !== ALLOWED_LOGIN) return new Response("This GitHub account is not allowed to save these notes.", { status: 403 });
        const payload = `${profile.login}|${Math.floor(Date.now() / 1000) + SESSION_SECONDS}`;
        const encoded = btoa(payload).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
        const session = `${encoded}.${await sign(payload, env.GH_TOKEN)}`;
        const response = new Response(null, { status: 302, headers: { location: `${url.origin}/?notes_sync=authorized` } });
        response.headers.append("set-cookie", `notes_session=${encodeURIComponent(session)}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Lax`);
        response.headers.append("set-cookie", clearCookie("notes_oauth_state", "/auth/"));
        return response;
      }
      if (path === "/auth/logout" && request.method === "POST") return new Response(null, { status: 204, headers: { "set-cookie": clearCookie("notes_session") } });
      return new Response("Not found", { status: 404 });
    }

    if (path.startsWith("/api/")) {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: {
        ...cors, "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type", "access-control-max-age": "86400"
      }});
      if (origin && origin !== url.origin) return json({ error: "Origin not allowed." }, 403);
      if (path === "/api/status" && request.method === "GET") return json({
        authenticated: await hasSession(request, env),
        configured: !!(env.GH_TOKEN && env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET)
      }, 200, cors);
      if (path === "/api/save" && request.method === "POST") {
        if (!(await hasSession(request, env))) return json({ error: "GitHub sign-in required." }, 401, cors);
        let data;
        try { data = await request.json(); } catch { return json({ error: "Invalid request." }, 400, cors); }
        if (typeof data.html !== "string" || !data.html.trimStart().toLowerCase().startsWith("<!doctype html")) return json({ error: "A full HTML document is required." }, 400, cors);
        if (new TextEncoder().encode(data.html).length > MAX_HTML_BYTES) return json({ error: "HTML exceeds the 20 MB save limit." }, 413, cors);
        try {
          const result = await saveToGitHub(data.html, env);
          return json({ ok: true, commit: result.commit?.sha || null }, 200, cors);
        } catch (error) {
          return json({ error: error.message || "GitHub save failed." }, 502, cors);
        }
      }
      return json({ error: "Not found." }, 404, cors);
    }

    if ((path === "/" || path === "/index.html") && request.method === "GET") {
      try {
        const latestHtml = await loadLatestHtmlFromGitHub(env);
        if (latestHtml) return latestHtml;
      } catch {}
    }

    return env.ASSETS.fetch(request);
  }
};
