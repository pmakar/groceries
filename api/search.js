import * as cheerio from "cheerio";
import { cleanItem, searchUrl, fetchTesco, extractProducts } from "./_common.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { list = "" } = req.body || {};
    const items = [];
    const seen = new Set();

    for (const part of String(list).split(/[\n,]+/)) {
      const item = cleanItem(part);
      const key = item.toLowerCase();
      if (item && !seen.has(key)) {
        seen.add(key);
        items.push(item);
      }
    }

    const output = [];
    for (const item of items.slice(0, 40)) {
      const url = searchUrl(item);
      try {
        const html = await fetchTesco(url);
        const $ = cheerio.load(html);
        const products = extractProducts($, item, null).slice(0, 10);
        output.push({
          item,
          searchUrl: url,
          status: products.length ? "found Tesco offer-tagged products" : "No offer-tagged products found; use Tesco search",
          products
        });
      } catch (error) {
        output.push({ item, searchUrl: url, status: `Could not read Tesco: ${error.message}`, products: [] });
      }
    }
    res.status(200).json({ items: output });
  } catch (error) {
    res.status(500).json({ error: error.message || "Server error" });
  }
}
