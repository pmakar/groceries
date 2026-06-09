import * as cheerio from "cheerio";
import { DEALS, fetchTesco, extractProducts } from "./_common.js";

export default async function handler(req, res) {
  try {
    const type = String(req.query.type || "");
    const config = DEALS[type];

    if (!config) {
      return res.status(400).json({ error: "Unknown deal type. Use aldi, clubcard, or edlp." });
    }

    const all = [];
    const seen = new Set();

    for (const url of config.pages) {
      try {
        const html = await fetchTesco(url);
        const $ = cheerio.load(html);
        const products = extractProducts($, config.label, config.pattern);

        for (const p of products) {
          const key = `${p.title.toLowerCase()}|${p.price}|${p.url}`;
          if (!seen.has(key)) {
            seen.add(key);
            all.push(p);
          }
        }
      } catch (_) {
        // keep going; one Tesco page failing should not kill the whole deal mode
      }
    }

    all.sort((a, b) => {
      if (a.price === null && b.price === null) return a.title.localeCompare(b.title);
      if (a.price === null) return 1;
      if (b.price === null) return -1;
      return a.price - b.price || a.title.localeCompare(b.title);
    });

    res.status(200).json({
      type,
      label: config.label,
      sourceUrl: config.sourceUrl,
      products: all.slice(0, 250),
      note: all.length >= 250 ? "Showing first 250." : ""
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Server error" });
  }
}
