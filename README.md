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
- Walking and public-transport cards share the same transport color; alternative routes are collapsed by default and use a separate color.
- Meeting-point badges appear only on group meeting nodes, not on completed activities or return legs.
- Each transport card separates Google Maps navigation, the official App Store listing, and the operator's web planner. If the app is already installed, its App Store page offers the Open action; if not, it offers installation.
- No undocumented iOS deep-link scheme is fabricated. The operators do not publish a verifiable URL format that opens their installed app directly with both future date and stop pair prefilled.

## Remaining source-data gaps
The original itinerary did not include some lodging addresses (Rovaniemi and Helsinki), some precise stop names, and some actual service numbers. Those are visibly marked as requiring confirmation rather than invented.
