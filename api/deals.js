const TESCO = "https://www.tesco.com";

const CLUBCARD_CATEGORIES = [
  { id: "top-picks", label: "Top picks", url: "https://www.tesco.com/shop/en-GB/buylists/clubcard-prices/top-picks" },
  { id: "frozen", label: "Frozen food", url: "https://www.tesco.com/shop/en-GB/buylists/clubcard-prices/frozen" },
  { id: "fresh", label: "Fresh food", url: "https://www.tesco.com/shop/en-GB/buylists/clubcard-prices/fresh" },
  { id: "beer-wine-spirits", label: "Beer, wine and spirits", url: "https://www.tesco.com/shop/en-GB/buylists/clubcard-prices/beer-wine-spirits" },
  { id: "snacks-and-treats", label: "Snacks and treats", url: "https://www.tesco.com/shop/en-GB/buylists/clubcard-prices/snacks-and-treats" },
  { id: "household", label: "Household products and pet care", url: "https://www.tesco.com/shop/en-GB/buylists/clubcard-prices/household" },
  { id: "food-cupboard", label: "Cupboard fillers", url: "https://www.tesco.com/shop/en-GB/buylists/clubcard-prices/food-cupboard" },
  { id: "bakery", label: "Bakery", url: "https://www.tesco.com/shop/en-GB/buylists/clubcard-prices/bakery" },
  { id: "health-beauty-and-baby", label: "Health, beauty and baby", url: "https://www.tesco.com/shop/en-GB/buylists/clubcard-prices/health-beauty-and-baby" }
];

const GENERIC_DEALS = {
  aldi: {
    label: "Aldi Price Match",
    sourceUrl: "https://www.tesco.com/groceries/en-GB/search?query=Aldi%20Price%20Match",
    pattern: /Aldi Price Match/i,
    urls: [
      "https://www.tesco.com/groceries/en-GB/search?query=Aldi%20Price%20Match",
      "https://www.tesco.com/groceries/en-GB/promotions/all",
      "https://www.tesco.com/groceries/en-GB/shop/fresh-food/all",
      "https://www.tesco.com/groceries/en-GB/shop/food-cupboard/all",
      "https://www.tesco.com/groceries/en-GB/shop/bakery/all"
    ]
  },
  edlp: {
    label: "Everyday Low Price",
    sourceUrl: "https://www.tesco.com/groceries/en-GB/search?query=Everyday%20Low%20Price",
    pattern: /Everyday Low Price/i,
    urls: [
      "https://www.tesco.com/groceries/en-GB/search?query=Everyday%20Low%20Price",
      "https://www.tesco.com/groceries/en-GB/promotions/all",
      "https://www.tesco.com/groceries/en-GB/shop/fresh-food/all",
      "https://www.tesco.com/groceries/en-GB/shop/food-cupboard/all",
      "https://www.tesco.com/groceries/en-GB/shop/bakery/all"
    ]
  }
};

function withPage(url, page) {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}count=24&page=${page}`;
}

function decodeHtml(s) {
  return String(s || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&pound;/g, "£")
    .replace(/&#xA3;/g, "£")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function htmlToText(html) {
  return decodeHtml(String(html || ""))
    .replace(/<script[\s\S]*?<\/script>/gi, "\n")
    .replace(/<style[\s\S]*?<\/style>/gi, "\n")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "\n")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "\n")
    .replace(/<(br|hr)\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|article|section|h1|h2|h3|h4|span|a|button)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchTesco(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 13000);

  try {
    const r = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        "Accept-Language": "en-GB,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Cache-Control": "no-cache"
      }
    });

    if (!r.ok) throw new Error(`Tesco HTTP ${r.status}`);
    return await r.text();
  } finally {
    clearTimeout(timer);
  }
}

function detectPages(text) {
  const m = String(text || "").match(/Showing\s+(\d+)\s+to\s+(\d+)\s+of\s+([\d,]+)\s+items/i);
  if (!m) return { totalItems: null, pages: 1 };
  const to = Number(m[2].replace(/,/g, ""));
  const total = Number(m[3].replace(/,/g, ""));
  const perPage = Math.max(1, to);
  return { totalItems: total, pages: Math.max(1, Math.min(8, Math.ceil(total / perPage))) };
}

function priceNumber(s) {
  const m = String(s || "").match(/£\s*(\d+(?:\.\d{1,2})?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function allPrices(s) {
  const out = [];
  const seen = new Set();
  for (const m of String(s || "").matchAll(/£\s*(\d+(?:\.\d{1,2})?)/g)) {
    const n = Number(m[1]);
    if (!Number.isFinite(n)) continue;
    const k = n.toFixed(2);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(n);
    }
  }
  return out;
}

function searchUrl(title) {
  return `https://www.tesco.com/groceries/en-GB/search?query=${encodeURIComponent(title)}`;
}

function segmentProducts(text) {
  const lines = String(text || "").split("\n").map(x => x.trim()).filter(Boolean);
  const starts = [];

  for (let i = 0; i < lines.length; i++) {
    if (/^Image:\s+/i.test(lines[i])) starts.push(i);
  }

  if (!starts.length) {
    for (let i = 0; i < lines.length; i++) {
      if (i > 2 && /£/.test(lines.slice(i, i + 10).join(" ")) && !/^£/.test(lines[i]) && lines[i].length > 6) {
        starts.push(i);
        i += 8;
      }
    }
  }

  const chunks = [];
  for (let j = 0; j < starts.length; j++) {
    const start = starts[j];
    const end = starts[j + 1] || Math.min(lines.length, start + 38);
    chunks.push(lines.slice(start, end));
  }
  return chunks;
}

function extractFromText(text, opts) {
  const { label, pattern, category, sourceUrl } = opts;
  const chunks = segmentProducts(text);
  const seen = new Set();
  const products = [];

  for (const lines of chunks) {
    const block = lines.join(" ");
    if (!pattern.test(block)) continue;

    let title = lines[0].replace(/^Image:\s*/i, "").trim();
    if (!title || /^New$/i.test(title)) {
      title = (lines.find(l => !/^Image:/i.test(l) && !/^New$/i.test(l) && !/^£/.test(l) && l.length > 5) || "").trim();
    }
    title = title.replace(/^#+\s*/, "").trim();
    if (!title || title.length < 4) continue;

    const offerMatch = block.match(new RegExp(`(${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+.*?)(?:\\s+Quantity controls|\\s+Add\\s*|\\s+This product|\\s+Important information|$)`, "i"));
    const offerText = offerMatch ? offerMatch[1].slice(0, 220).trim() : label;

    let dealPrice = priceNumber(offerText);
    const prices = allPrices(block);
    if (dealPrice === null && prices.length) dealPrice = prices[0];

    let regularPrice = null;
    for (const p of prices) {
      if (dealPrice === null || p > dealPrice) {
        regularPrice = p;
        break;
      }
    }

    const saving = dealPrice !== null && regularPrice !== null && regularPrice > dealPrice
      ? Number((regularPrice - dealPrice).toFixed(2))
      : null;

    const unitMatch = block.match(/£\s*\d+(?:\.\d{1,2})?\s*\/\s*[A-Za-z0-9.]+/g);
    const unitPrice = unitMatch && unitMatch.length ? unitMatch[unitMatch.length - 1] : "";

    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    products.push({
      title,
      category,
      badge: label,
      offerText,
      dealPrice,
      regularPrice,
      priceText: dealPrice === null ? "" : `£${dealPrice.toFixed(2)}`,
      regularPriceText: regularPrice === null ? "" : `£${regularPrice.toFixed(2)}`,
      saving,
      savingText: saving === null ? "" : `£${saving.toFixed(2)}`,
      savingPct: saving !== null && regularPrice ? Math.round((saving / regularPrice) * 100) : null,
      unitPrice,
      url: searchUrl(title),
      sourceUrl
    });
  }

  return products.sort((a,b) => {
    if (a.saving !== null || b.saving !== null) return (b.saving || 0) - (a.saving || 0);
    if (a.dealPrice === null && b.dealPrice === null) return a.title.localeCompare(b.title);
    if (a.dealPrice === null) return 1;
    if (b.dealPrice === null) return -1;
    return a.dealPrice - b.dealPrice;
  });
}

async function loadClubcardCategory(id) {
  const category = CLUBCARD_CATEGORIES.find(c => c.id === id) || CLUBCARD_CATEGORIES[0];

  const firstUrl = withPage(category.url, 1);
  const firstHtml = await fetchTesco(firstUrl);
  const firstText = htmlToText(firstHtml);
  const pageMeta = detectPages(firstText);

  let products = extractFromText(firstText, {
    label: "Clubcard Price",
    pattern: /Clubcard Price/i,
    category: category.label,
    sourceUrl: firstUrl
  });

  const pages = Math.max(1, Math.min(pageMeta.pages || 1, 8));

  for (let page = 2; page <= pages; page++) {
    const url = withPage(category.url, page);
    try {
      const html = await fetchTesco(url);
      const text = htmlToText(html);
      products = products.concat(extractFromText(text, {
        label: "Clubcard Price",
        pattern: /Clubcard Price/i,
        category: category.label,
        sourceUrl: url
      }));
    } catch (_) {}
  }

  const seen = new Set();
  products = products.filter(p => {
    const key = `${p.title.toLowerCase()}|${p.category}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    type: "clubcard",
    category: category.id,
    categoryLabel: category.label,
    sourceUrl: category.url,
    totalItemsShownByTesco: pageMeta.totalItems,
    pagesChecked: pages,
    products
  };
}

async function loadGeneric(type) {
  const config = GENERIC_DEALS[type];
  const products = [];

  for (const url of config.urls) {
    try {
      const html = await fetchTesco(url);
      const text = htmlToText(html);
      products.push(...extractFromText(text, {
        label: config.label,
        pattern: config.pattern,
        category: config.label,
        sourceUrl: url
      }));
    } catch (_) {}
  }

  const seen = new Set();
  return {
    type,
    category: "all",
    categoryLabel: config.label,
    sourceUrl: config.sourceUrl,
    totalItemsShownByTesco: null,
    pagesChecked: config.urls.length,
    products: products.filter(p => {
      const key = p.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");

  try {
    const type = String(req.query.type || "categories");
    const category = String(req.query.category || "top-picks");

    if (type === "ping") {
      return res.status(200).json({ ok: true, time: new Date().toISOString() });
    }

    if (type === "categories") {
      return res.status(200).json({ categories: CLUBCARD_CATEGORIES });
    }

    if (type === "clubcard") {
      return res.status(200).json(await loadClubcardCategory(category));
    }

    if (type === "aldi" || type === "edlp") {
      return res.status(200).json(await loadGeneric(type));
    }

    return res.status(400).json({ error: "Unknown type" });
  } catch (error) {
    return res.status(500).json({
      error: error && error.message ? error.message : "Server error",
      hint: "Tesco may have blocked the serverless request. Use the fallback Tesco links shown in the app."
    });
  }
};
