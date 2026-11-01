# Nordic Honeymoon Trip 2026

## Deploy to GitHub Pages
1. Extract the ZIP.
2. Upload `index.html` to the root of your GitHub Pages repository (or the folder configured for Pages).
3. Commit and push:

```bash
git add index.html README.md
git commit -m "Update Nordic trip app launch behavior"
git push origin main
```

## iPhone app-launch behavior
- Transport cards now have a **direct app launch attempt** rather than linking straight to the App Store page.
- On iPhone/iPad, the page first tries the app URL scheme (`ruter://`, `vy://`, `reis://`, `svipper://`, `waltti://`, `hsl://`, `vr://`).
- If iOS does not hand off to an installed app, the page falls back to the corresponding App Store page after about 1.2 seconds.
- These schemes are not all published in the operators' public documentation. Therefore this is a best-effort launch attempt, not a verified guarantee for every app. The app provider must register and support the scheme for direct launch to work.
- Public operator materials do not specify a supported URL format to prefill all routes and travel dates. Route prefill is not claimed.
- Airportbus is listed as an official website/service, not represented as an iOS app.

## Navigation
- Google Maps route links keep start/end points and travel mode.
- City transit links remain separate from Google Maps navigation.
- Walking and public transport use the same transport color; alternative routes stay collapsed by default.
