import { CLUBCARD_CATEGORIES, DEAL_CONFIG, categoryUrl, fetchTesco, detectTotalPages, extractProductsFromHtml } from "./_common.js";

function uniqueProducts(rows) {
  const seen = new Set();
  const out = [];
  for (const p of rows) {
    const key = `${String(p.title || "").toLowerCase()}|${p.url || ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(p);
    }
  }
  return out;
}

async function loadClubcardCategory(categoryId) {
  const category = CLUBCARD_CATEGORIES.find(c => c.id === categoryId) || CLUBCARD_CATEGORIES[0];
  const firstUrl = categoryUrl(category.url, 1, 48);
  const firstHtml = await fetchTesco(firstUrl);
  const meta = detectTotalPages(firstHtml, 48);

  let products = extractProductsFromHtml(firstHtml, {
    label: "Clubcard Price",
    pattern: DEAL_CONFIG.clubcard.pattern,
    category: category.label,
    sourceUrl: firstUrl
  });

  const pages = Math.min(meta.pages || 1, 8);

  for (let page = 2; page <= pages; page++) {
    const url = categoryUrl(category.url, page, 48);
    try {
      const html = await fetchTesco(url);
      products = products.concat(extractProductsFromHtml(html, {
        label: "Clubcard Price",
        pattern: DEAL_CONFIG.clubcard.pattern,
        category: category.label,
        sourceUrl: url
      }));
    } catch (_) {
      // Keep partial category results if a page fails.
    }
  }

  products = uniqueProducts(products);

  return {
    type: "clubcard",
    category: category.id,
    categoryLabel: category.label,
    sourceUrl: category.url,
    totalItemsShownByTesco: meta.totalItems,
    pagesChecked: pages,
    products
  };
}

async function loadGenericDeal(type) {
  const config = DEAL_CONFIG[type];
  const all = [];

  for (const pageUrl of config.pages || []) {
    try {
      const html = await fetchTesco(pageUrl);
      const products = extractProductsFromHtml(html, {
        label: config.label,
        pattern: config.pattern,
        category: config.label,
        sourceUrl: pageUrl
      });
      all.push(...products);
    } catch (_) {
      // Continue with whatever pages worked.
    }
  }

  return {
    type,
    category: "all",
    categoryLabel: config.label,
    sourceUrl: config.sourceUrl,
    totalItemsShownByTesco: null,
    pagesChecked: (config.pages || []).length,
    products: uniqueProducts(all)
  };
}

export default async function handler(req, res) {
  try {
    const type = String(req.query.type || "clubcard");
    const category = String(req.query.category || "");

    if (type === "categories") {
      return res.status(200).json({ categories: CLUBCARD_CATEGORIES });
    }

    if (type === "clubcard") {
      const result = await loadClubcardCategory(category || "top-picks");
      return res.status(200).json(result);
    }

    if (!DEAL_CONFIG[type]) {
      return res.status(400).json({ error: "Unknown deal type. Use clubcard, aldi, edlp, or categories." });
    }

    const result = await loadGenericDeal(type);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Server error" });
  }
}
