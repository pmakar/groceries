# Tesco Deal Radar v7 Static

This version uses **no fetch, no scraping, no API**.

It is a polished static Vercel app that:

- Builds Tesco search links from your shopping list.
- Shows Tesco Clubcard category links.
- Shows Tesco fallback pages/searches for Aldi Price Match.
- Shows Tesco fallback pages/searches for Everyday Low Price.
- Opens visible links in tabs.
- Copies visible links.

## Local test

```bash
npm install
npx vercel dev
```

Open:

```text
http://localhost:3000
```

You can also open `public/index.html` directly because this version does not need an API.

## Deploy

Push this folder to GitHub and import it in Vercel.

## Why static

Fetching Tesco into Vercel/serverless was unreliable. Tesco blocks or changes responses, so this version only sends you directly to Tesco pages.
