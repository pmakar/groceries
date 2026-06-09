# Tesco Deals + Shopping List Finder v3

This version makes the deal buttons reliable by opening Tesco directly instead of depending on scraping.

## Local test

```bash
npm install
npx vercel dev
```

Open:

```text
http://localhost:3000
```

## Deploy

Push to GitHub, import the repo in Vercel, deploy.

## What changed

- Shopping list section only handles your pasted list.
- Deal buttons are separate and unrelated to the shopping list.
- Deal buttons are direct Tesco links, so they actually open.
- Removed broken dependence on scraping for the main buttons.

## Note

Tesco has a clear Clubcard Prices zone, but “all Aldi Price Match” and “all Everyday Low Price” are not exposed as stable public pages/API. Those buttons use Tesco search/promotion fallback links.
