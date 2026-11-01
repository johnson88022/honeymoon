# Nordic Honeymoon Trip 2026 — Revised v2

## Deploy to GitHub Pages
1. Extract the ZIP.
2. Put `index.html` in your repository root (or Pages publishing folder).
3. GitHub → Settings → Pages → Deploy from a branch → `main` → `/ (root)`.
4. Push changes:

```bash
git add index.html
git commit -m "Improve Nordic trip walking and transit navigation"
git push origin main
```

## Navigation behavior
- Walking legs are individual cards with start/end labels and Google Maps walking directions.
- Public bus segments show city-specific operator: Ruter (Oslo), Reis (Nordland/Lofoten), Svipper (Tromsø), Waltti/Linkkari (Rovaniemi), HSL (Helsinki).
- Train, ship and flight remain distinct modes.
- Official route-planner links and Google Maps links are provided. App Store links are only for installation.
- No undocumented iOS deep-link scheme is fabricated. The transit agencies' public pages explain route search in their apps but do not document a stable URL format that pre-fills a future date and stop pair in the installed app.

## Remaining source-data gaps
The original itinerary did not include some lodging addresses (Rovaniemi and Helsinki), some precise stop names, and some actual service numbers. Those are visibly marked as requiring confirmation rather than invented.
