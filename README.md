# Tesco Deal Radar v5

This version is designed so the buttons never fail silently.

## What changed from v4

- Removed `cheerio` dependency.
- Deal buttons immediately show fallback Tesco links.
- API failures are displayed in the UI instead of looking like the button did nothing.
- Added **Test API** button.
- Clubcard still attempts a smart crawl across Tesco Clubcard sections and pagination.

## Run locally

```bash
npm install
npx vercel dev
```

Open:

```text
http://localhost:3000
```

Do **not** open `public/index.html` directly if you want the API-powered buttons to work. Direct file opening can only show fallback links, because `/api/deals` will not exist.

## Deploy to Vercel

Push the whole folder to GitHub, then import the repo into Vercel.

## Important

Tesco does not provide a stable public grocery deals API. This app reads Tesco pages server-side, then parses the visible product text. If Tesco blocks Vercel or changes markup, use the fallback links shown in the app.
