# Tesco Deal Radar v4

Vercel/GitHub app with:

- Separate shopping-list search.
- All Aldi Price Match button.
- Smart **All Clubcard Prices** button.
- All Everyday Low Price button.
- Much nicer dashboard UI.
- Search/filter/sort inside results.
- CSV export.

## Why Clubcard is smarter now

Instead of reading only one Tesco Clubcard page, the app calls `/api/deals?type=clubcard&category=...` for every known Clubcard buylist section:

- Top picks
- Fresh food
- Frozen food
- Beer, wine and spirits
- Snacks and treats
- Household and pet care
- Cupboard fillers
- Bakery
- Health, beauty and baby
- World foods

Each category call detects Tesco pagination, for example “Showing 1 to 24 of 55 items”, then loads the additional pages.

## Local test

```bash
npm install
npx vercel dev
```

Open:

```text
http://localhost:3000
```

## Deploy to GitHub + Vercel

```bash
git init
git add .
git commit -m "Tesco Deal Radar v4"
```

Push to GitHub, then import the repository in Vercel.

## Limitations

Tesco does not provide a stable public grocery deals API. This reads Tesco pages server-side and extracts visible products. Results can vary if Tesco changes markup, blocks automated requests, or shows different results by location/account.
