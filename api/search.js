import * as cheerio from "cheerio";

const TESCO_SEARCH = "https://www.tesco.com/groceries/en-GB/search?query=";

const OFFER_PATTERNS = {
  aldi: /\bAldi Price Match\b/i,
  clubcard: /\bClubcard Price\b/i,
  edlp: /\bEveryday Low Price\b/i
};

function cleanItem(input) {
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

function searchUrl(query) {
  return TESCO_SEARCH + encodeURIComponent(query);
}

function priceFloat(text) {
  const m = String(text || "").match(/£\s*(\d+(?:\.\d{1,2})?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function extractProducts(html, query) {
  const $ = cheerio.load(html);
  const products = [];
  const seen = new Set();

  $("li, div, article").each((_, el) => {
    const block = $(el);
    const text = block.text().replace(/\s+/g, " ").trim();

    if (!text || !text.includes("£")) return;
    if (!Object.values(OFFER_PATTERNS).some(rx => rx.test(text))) return;
    if (text.length < 20 || text.length > 1400) return;

    let title = block.find("h2,h3,h4").first().text().replace(/\s+/g, " ").trim();

    if (!title) {
      const beforePrice = text.split(/£\s*\d/)[0] || "";
      title = beforePrice
        .replace(/(Write a review|More like this|Aldi Price Match|Everyday Low Price|Clubcard Price).*/i, "")
        .trim();
    }

    title = title.slice(0, 180).replace(/[-·| ]+$/g, "");
    if (!title || title.length < 3) title = query;

    let href = block.find("a[href]").first().attr("href") || searchUrl(query);
    if (href.startsWith("/")) href = "https://www.tesco.com" + href;
    if (!href.startsWith("http")) href = searchUrl(query);

    const offers = [];
    if (OFFER_PATTERNS.aldi.test(text)) offers.push("Aldi Price Match");
    if (OFFER_PATTERNS.clubcard.test(text)) offers.push("Clubcard Price");
    if (OFFER_PATTERNS.edlp.test(text)) offers.push("Everyday Low Price");

    const price = priceFloat(text);
    const key = `${title.toLowerCase()}|${price}|${offers.join(",")}`;
    if (seen.has(key)) return;
    seen.add(key);

    products.push({
      title,
      price,
      priceText: price === null ? "" : `£${price.toFixed(2)}`,
      offers,
      url: href,
      raw: text.slice(0, 500)
    });
  });

  products.sort((a, b) => {
    if (a.price === null && b.price === null) return a.title.localeCompare(b.title);
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return a.price - b.price || a.title.localeCompare(b.title);
  });

  return products.slice(0, 20);
}

async function fetchTesco(query) {
  const response = await fetch(searchUrl(query), {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "en-GB,en;q=0.9"
    }
  });

  if (!response.ok) {
    throw new Error(`Tesco returned ${response.status}`);
  }

  return await response.text();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }

  try {
    const { list = "", offers = ["aldi", "clubcard", "edlp"] } = req.body || {};
    const selectedOffers = new Set(offers);

    const items = [];
    const seenItems = new Set();

    for (const part of String(list).split(/[\n,]+/)) {
      const item = cleanItem(part);
      const key = item.toLowerCase();
      if (item && !seenItems.has(key)) {
        seenItems.add(key);
        items.push(item);
      }
    }

    const output = [];

    for (const item of items.slice(0, 40)) {
      const url = searchUrl(item);

      try {
        const html = await fetchTesco(item);
        let products = extractProducts(html, item);

        products = products.filter(p =>
          (selectedOffers.has("aldi") && p.offers.includes("Aldi Price Match")) ||
          (selectedOffers.has("clubcard") && p.offers.includes("Clubcard Price")) ||
          (selectedOffers.has("edlp") && p.offers.includes("Everyday Low Price"))
        );

        output.push({
          item,
          searchUrl: url,
          status: products.length ? "ok" : "No tagged offer found in parsed result",
          products: products.slice(0, 10)
        });
      } catch (error) {
        output.push({
          item,
          searchUrl: url,
          status: `Could not read Tesco result: ${error.message}`,
          products: []
        });
      }
    }

    res.status(200).json({ items: output });
  } catch (error) {
    res.status(500).json({ error: error.message || "Server error" });
  }
}
