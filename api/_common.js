import * as cheerio from "cheerio";

export const TESCO = "https://www.tesco.com";

export const CLUBCARD_CATEGORIES = [
  { id: "top-picks", label: "Top picks", url: "https://www.tesco.com/shop/en-GB/buylists/clubcard-prices/top-picks" },
  { id: "fresh", label: "Fresh food", url: "https://www.tesco.com/shop/en-GB/buylists/clubcard-prices/fresh" },
  { id: "frozen", label: "Frozen food", url: "https://www.tesco.com/shop/en-GB/buylists/clubcard-prices/frozen" },
  { id: "beer-wine-spirits", label: "Beer, wine and spirits", url: "https://www.tesco.com/shop/en-GB/buylists/clubcard-prices/beer-wine-spirits" },
  { id: "snacks-and-treats", label: "Snacks and treats", url: "https://www.tesco.com/shop/en-GB/buylists/clubcard-prices/snacks-and-treats" },
  { id: "household", label: "Household and pet care", url: "https://www.tesco.com/shop/en-GB/buylists/clubcard-prices/household" },
  { id: "food-cupboard", label: "Cupboard fillers", url: "https://www.tesco.com/shop/en-GB/buylists/clubcard-prices/food-cupboard" },
  { id: "bakery", label: "Bakery", url: "https://www.tesco.com/shop/en-GB/buylists/clubcard-prices/bakery" },
  { id: "health-beauty-and-baby", label: "Health, beauty and baby", url: "https://www.tesco.com/shop/en-GB/buylists/clubcard-prices/health-beauty-and-baby" },
  { id: "world-foods", label: "World foods", url: "https://www.tesco.com/shop/en-GB/buylists/clubcard-prices/world-foods" }
];

export const DEAL_CONFIG = {
  clubcard: {
    label: "Clubcard Price",
    badge: "Clubcard Price",
    pattern: /\bClubcard Price\b/i,
    sourceUrl: "https://www.tesco.com/shop/en-GB/zone/clubcard-prices"
  },
  aldi: {
    label: "Aldi Price Match",
    badge: "Aldi Price Match",
    pattern: /\bAldi Price Match\b/i,
    sourceUrl: "https://www.tesco.com/groceries/en-GB/search?query=Aldi%20Price%20Match",
    pages: [
      "https://www.tesco.com/groceries/en-GB/search?query=Aldi%20Price%20Match",
      "https://www.tesco.com/groceries/en-GB/promotions/all",
      "https://www.tesco.com/groceries/en-GB/shop/fresh-food/all",
      "https://www.tesco.com/groceries/en-GB/shop/food-cupboard/all",
      "https://www.tesco.com/groceries/en-GB/shop/bakery/all",
      "https://www.tesco.com/groceries/en-GB/shop/frozen-food/all"
    ]
  },
  edlp: {
    label: "Everyday Low Price",
    badge: "Everyday Low Price",
    pattern: /\bEveryday Low Price\b/i,
    sourceUrl: "https://www.tesco.com/groceries/en-GB/search?query=Everyday%20Low%20Price",
    pages: [
      "https://www.tesco.com/groceries/en-GB/search?query=Everyday%20Low%20Price",
      "https://www.tesco.com/groceries/en-GB/promotions/all",
      "https://www.tesco.com/groceries/en-GB/shop/fresh-food/all",
      "https://www.tesco.com/groceries/en-GB/shop/food-cupboard/all",
      "https://www.tesco.com/groceries/en-GB/shop/bakery/all",
      "https://www.tesco.com/groceries/en-GB/shop/frozen-food/all"
    ]
  }
};

export function categoryUrl(baseUrl, page = 1, count = 48) {
  const joiner = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${joiner}count=${count}&page=${page}`;
}

export function searchUrl(query) {
  return `https://www.tesco.com/groceries/en-GB/search?query=${encodeURIComponent(query)}`;
}

export async function fetchTesco(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "en-GB,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Cache-Control": "no-cache"
    }
  });

  if (!response.ok) throw new Error(`Tesco returned HTTP ${response.status}`);
  return await response.text();
}

export function cleanItem(input) {
  let s = String(input || "").trim();
  s = s.replace(/^[-*•\s]+/, "");
  s = s.replace(/^\d+[\).]\s+/, "");
  s = s.replace(/^\[[ xX]\]\s*/, "");
  s = s.replace(/^\d+\s*x\s+/i, "");
  s = s.replace(/^\d+x\s*/i, "");
  s = s.replace(/^\d+(\.\d+)?\s*(kg|g|ml|l|litre|litres|pack|packs|pcs|pieces|tin|tins|can|cans|bottle|bottles)\s+/i, "");
  s = s.replace(/\s+\d+(\.\d+)?\s*(kg|g|ml|l|litre|litres|pack|packs|pcs|pieces|tin|tins|can|cans|bottle|bottles)$/i, "");
  s = s.replace(/\s+[-–—]\s+.*$/, "");
  s = s.replace(/\s+\(.*?\)\s*$/, "");
  return s.replace(/\s+/g, " ").trim();
}

function poundsToNumber(text) {
  if (!text) return null;
  const m = String(text).match(/£\s*(\d+(?:\.\d{1,2})?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function uniquePriceMatches(text) {
  const prices = [];
  const seen = new Set();
  for (const m of String(text || "").matchAll(/£\s*(\d+(?:\.\d{1,2})?)/g)) {
    const value = Number(m[1]);
    if (!Number.isFinite(value)) continue;
    const key = value.toFixed(2);
    if (!seen.has(key)) {
      seen.add(key);
      prices.push(value);
    }
  }
  return prices;
}

function extractOfferText(text, label) {
  const compact = String(text || "").replace(/\s+/g, " ").trim();
  if (!compact) return "";

  if (label === "Clubcard Price") {
    const m = compact.match(/(Clubcard Price\s+.*?)(?:Quantity controls|Add|This product|Important information|$)/i);
    if (m) return m[1].trim();
  }

  if (label === "Aldi Price Match") {
    const m = compact.match(/(Aldi Price Match\s+.*?)(?:Quantity controls|Add|This product|Important information|$)/i);
    if (m) return m[1].trim();
  }

  if (label === "Everyday Low Price") {
    const m = compact.match(/(Everyday Low Price\s+.*?)(?:Quantity controls|Add|This product|Important information|$)/i);
    if (m) return m[1].trim();
  }

  return compact.slice(0, 240);
}

function extractRegularPrice(text, offerText, dealPrice) {
  const compact = String(text || "").replace(/\s+/g, " ").trim();

  const validDateMatch = compact.match(/Offer valid .*? until \d{2}\/\d{2}\/\d{4}\s+(£\s*\d+(?:\.\d{1,2})?)/i);
  if (validDateMatch) return poundsToNumber(validDateMatch[1]);

  const all = uniquePriceMatches(compact);
  if (!all.length) return null;

  if (dealPrice !== null) {
    const after = all.find(p => Math.abs(p - dealPrice) > 0.001 && p > dealPrice);
    if (after !== undefined) return after;
  }

  return all[0];
}

function extractUnitPrice(text) {
  const compact = String(text || "").replace(/\s+/g, " ").trim();
  const matches = [...compact.matchAll(/£\s*\d+(?:\.\d{1,2})?\s*\/\s*([A-Za-z0-9.]+)/g)];
  if (!matches.length) return "";
  const m = matches[matches.length - 1];
  const start = Math.max(0, m.index - 8);
  return compact.slice(start, m.index + m[0].length).trim();
}

function findProductCard($, anchor, title, pattern) {
  let node = $(anchor);
  for (let depth = 0; depth < 8; depth++) {
    node = node.parent();
    const text = node.text().replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (text.length > 2400) continue;
    if (!text.toLowerCase().includes(title.toLowerCase().slice(0, Math.min(18, title.length)))) continue;
    if (pattern.test(text) || /(Aldi Price Match|Clubcard Price|Everyday Low Price)/i.test(text)) return node;
  }
  return null;
}

export function detectTotalPages(html, count = 48) {
  const text = String(html || "").replace(/\s+/g, " ");
  const m = text.match(/Showing\s+(\d+)\s+to\s+(\d+)\s+of\s+([\d,]+)\s+items/i);
  if (!m) return { totalItems: null, pages: 1, shownTo: null };
  const shownTo = Number(m[2].replace(/,/g, ""));
  const totalItems = Number(m[3].replace(/,/g, ""));
  const perPage = shownTo || count;
  const pages = Math.max(1, Math.min(8, Math.ceil(totalItems / perPage)));
  return { totalItems, pages, shownTo };
}

export function extractProductsFromHtml(html, options = {}) {
  const {
    label = "Clubcard Price",
    pattern = /\bClubcard Price\b/i,
    category = "",
    sourceUrl = ""
  } = options;

  const $ = cheerio.load(html);
  const products = [];
  const seen = new Set();

  const candidates = [];
  $("a[href*='/products/']").each((_, anchor) => {
    let title = $(anchor).text().replace(/\s+/g, " ").trim();
    if (!title || /^Image:/i.test(title) || title.length < 4) return;
    candidates.push(anchor);
  });

  for (const anchor of candidates) {
    const title = $(anchor).text().replace(/\s+/g, " ").trim();
    const card = findProductCard($, anchor, title, pattern);
    if (!card) continue;

    const text = card.text().replace(/\s+/g, " ").trim();
    if (!pattern.test(text)) continue;

    let href = $(anchor).attr("href") || searchUrl(title);
    if (href.startsWith("/")) href = TESCO + href;
    if (!href.startsWith("http")) href = searchUrl(title);

    const offerText = extractOfferText(text, label);
    const dealPrice = poundsToNumber(offerText);
    const regularPrice = extractRegularPrice(text, offerText, dealPrice);
    const unitPrice = extractUnitPrice(text);
    const saving = dealPrice !== null && regularPrice !== null && regularPrice > dealPrice
      ? Number((regularPrice - dealPrice).toFixed(2))
      : null;
    const savingPct = saving !== null && regularPrice > 0
      ? Math.round((saving / regularPrice) * 100)
      : null;

    const key = `${title.toLowerCase()}|${href}`;
    if (seen.has(key)) continue;
    seen.add(key);

    products.push({
      title,
      category,
      badge: label,
      offers: [label],
      offerText,
      dealPrice,
      regularPrice,
      priceText: dealPrice === null ? "" : `£${dealPrice.toFixed(2)}`,
      regularPriceText: regularPrice === null ? "" : `£${regularPrice.toFixed(2)}`,
      saving,
      savingText: saving === null ? "" : `£${saving.toFixed(2)}`,
      savingPct,
      unitPrice,
      url: href,
      sourceUrl
    });
  }

  // Fallback for pages where Tesco changes product anchors but leaves text blocks.
  if (products.length === 0) {
    $("li, article, div").each((_, el) => {
      const block = $(el);
      const text = block.text().replace(/\s+/g, " ").trim();
      if (!text || !text.includes("£")) return;
      if (!pattern.test(text)) return;
      if (text.length < 40 || text.length > 1700) return;

      let title = block.find("h2,h3,h4").first().text().replace(/\s+/g, " ").trim();
      if (!title) {
        const firstAnchor = block.find("a").filter((_, a) => {
          const t = $(a).text().replace(/\s+/g, " ").trim();
          return t && !/^Image:/i.test(t) && t.length > 4;
        }).first();
        title = firstAnchor.text().replace(/\s+/g, " ").trim();
      }
      if (!title) return;

      let href = block.find("a[href*='/products/']").first().attr("href") || searchUrl(title);
      if (href.startsWith("/")) href = TESCO + href;
      if (!href.startsWith("http")) href = searchUrl(title);

      const offerText = extractOfferText(text, label);
      const dealPrice = poundsToNumber(offerText);
      const regularPrice = extractRegularPrice(text, offerText, dealPrice);
      const unitPrice = extractUnitPrice(text);
      const saving = dealPrice !== null && regularPrice !== null && regularPrice > dealPrice
        ? Number((regularPrice - dealPrice).toFixed(2))
        : null;
      const savingPct = saving !== null && regularPrice > 0 ? Math.round((saving / regularPrice) * 100) : null;

      const key = `${title.toLowerCase()}|${href}`;
      if (seen.has(key)) return;
      seen.add(key);

      products.push({
        title,
        category,
        badge: label,
        offers: [label],
        offerText,
        dealPrice,
        regularPrice,
        priceText: dealPrice === null ? "" : `£${dealPrice.toFixed(2)}`,
        regularPriceText: regularPrice === null ? "" : `£${regularPrice.toFixed(2)}`,
        saving,
        savingText: saving === null ? "" : `£${saving.toFixed(2)}`,
        savingPct,
        unitPrice,
        url: href,
        sourceUrl
      });
    });
  }

  products.sort((a, b) => {
    if (a.dealPrice === null && b.dealPrice === null) return a.title.localeCompare(b.title);
    if (a.dealPrice === null) return 1;
    if (b.dealPrice === null) return -1;
    return a.dealPrice - b.dealPrice || a.title.localeCompare(b.title);
  });

  return products;
}
