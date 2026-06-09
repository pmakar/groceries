# Tesco Shopping List Offer Finder

Paste a shopping list and find Tesco results with these badges:

- Aldi Price Match
- Clubcard Price
- Everyday Low Price

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

1. Create a new GitHub repository.
2. Upload these files.
3. Go to Vercel.
4. Add New Project.
5. Import the GitHub repo.
6. Deploy.

No build command is needed.

## Notes

This reads Tesco search pages server-side and tries to detect offer badges. Tesco can change markup or block automated reads, so the app always keeps a normal Tesco search link as fallback.
