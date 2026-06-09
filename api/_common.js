export const TESCO = "https://www.tesco.com";

export const DEALS = {
  clubcard: {
    label: "Clubcard Price",
    sourceUrl: "https://www.tesco.com/groceries/en-GB/zone/clubcard-prices",
    pages: ["https://www.tesco.com/groceries/en-GB/zone/clubcard-prices"],
    pattern: /\bClubcard Price\b/i
  },
  aldi: {
    label: "Aldi Price Match",
    sourceUrl: "https://www.tesco.com/groceries/en-GB/promotions",
    pages: [
      "https://www.tesco.com/groceries/en-GB/promotions",
      "https://www.tesco.com/groceries/en-GB/shop/fresh-food/all",
      "https://www.tesco.com/groceries/en-GB/shop/food-cupboard/all",
      "https://www.tesco.com/groceries/en-GB/shop/bakery/all",
      "https://www.tesco.com/groceries/en-GB/shop/frozen-food/all",
      "https://www.tesco.com/groceries/en-GB/shop/drinks/all",
      "https://www.tesco.com/groceries/en-GB/shop/household/all"
    ],
    pattern: /\bAldi Price Match\b/i
  },
  edlp: {
    label: "Everyday Low Price",
    sourceUrl: "https://www.tesco.com/groceries/en-GB/promotions",
    pages: [
      "https://www.tesco.com/groceries/en-GB/promotions",
      "https://www.tesco.com/groceries/en-GB/shop/fresh-food/all",
      "https://www.tesco.com/groceries/en-GB/shop/food-cupboard/all",
      "https://www.tesco.com/groceries/en-GB/shop/bakery/all",
      "https://www.tesco.com/groceries/en-GB/shop/frozen-food/all",
      "https://www.tesco.com/groceries/en-GB/shop/drinks/all",
      "https://www.tesco.com/groceries/en-GB/shop/household/all"
    ],
    pattern: /\bEveryday Low Price\b/i
  }
};

export function searchUrl(query) {
  return `https://www.tesco.com/groceries/en-GB/search?query=${encodeURIComponent(query)}`;
}

export async function fetchTesco(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "en-GB,en;q=0.9",
      "Accept": "text/html"
    }
  });
  if (!response.ok) throw new Error(`Tesco returned ${response.status}`);
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

function priceFloat(text) {
  const m = String(text || "").match(/£\s*(\d+(?:\.\d{1,2})?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export function extractProducts($, queryOrLabel, filterPattern = null) {
  const products = [];
  const seen = new Set();

  $("li, div, article").each((_, el) => {
    const block = $(el);
    const text = block.text().replace(/\s+/g, " ").trim();

    if (!text || !text.includes("£")) return;
    if (filterPattern && !filterPattern.test(text)) return;
    if (!filterPattern && !/(Aldi Price Match|Clubcard Price|Everyday Low Price)/i.test(text)) return;
    if (text.length < 20 || text.length > 1600) return;

    let title = block.find("h2,h3,h4").first().text().replace(/\s+/g, " ").trim();
    if (!title) {
      const beforePrice = text.split(/£\s*\d/)[0] || "";
      title = beforePrice
        .replace(/(Write a review|More like this|Aldi Price Match|Everyday Low Price|Clubcard Price).*/i, "")
        .trim();
    }

    title = title.slice(0, 180).replace(/[-·| ]+$/g, "");
    if (!title || title.length < 3) title = queryOrLabel;

    let href = block.find("a[href]").first().attr("href") || searchUrl(queryOrLabel);
    if (href.startsWith("/")) href = TESCO + href;
    if (!href.startsWith("http")) href = searchUrl(queryOrLabel);

    const offers = [];
    if (/Aldi Price Match/i.test(text)) offers.push("Aldi Price Match");
    if (/Clubcard Price/i.test(text)) offers.push("Clubcard Price");
    if (/Everyday Low Price/i.test(text)) offers.push("Everyday Low Price");

    const price = priceFloat(text);
    const key = `${title.toLowerCase()}|${price}|${offers.join(",")}`;
    if (seen.has(key)) return;
    seen.add(key);

    products.push({
      title,
      price,
      priceText: price === null ? "" : `£${price.toFixed(2)}`,
      offers,
      url: href
    });
  });

  products.sort((a, b) => {
    if (a.price === null && b.price === null) return a.title.localeCompare(b.title);
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return a.price - b.price || a.title.localeCompare(b.title);
  });
  return products;
}
