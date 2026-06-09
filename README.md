# Tesco Deals + Shopping List Finder

Two separate modes:

1. **Shopping-list search**  
   Paste your shopping list and search those items on Tesco.

2. **Browse ALL Tesco deal sections**  
   These buttons are unrelated to the shopping list:
   - All Aldi Price Match
   - All Clubcard Prices
   - All Everyday Low Price

## Local test

```bash
npm install
npx vercel dev
```

Open:

```text
http://localhost:3000
```

## Deploy with GitHub + Vercel

```bash
git init
git add .
git commit -m "Initial Tesco deals app"
```

Create a GitHub repo, push it, then import that repo in Vercel.

## Important limitation

Tesco does not provide a clean public API for all grocery deal badges. This app reads Tesco pages server-side and extracts products it can see. Clubcard has a dedicated Tesco zone page; Aldi Price Match and Everyday Low Price are gathered from promotions/category pages.
