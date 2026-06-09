function cleanItem(input) {
  let s = String(input || "").trim();
  s = s.replace(/^[-*•\s]+/, "");
  s = s.replace(/^\d+[\).]\s+/, "");
  s = s.replace(/^\[[ xX]\]\s*/, "");
  s = s.replace(/^\d+\s*x\s+/i, "");
  s = s.replace(/^\d+x\s*/i, "");
  s = s.replace(/^\d+(\.\d+)?\s*(kg|g|ml|l|litre|litres|pack|packs|pcs|pieces|tin|tins|can|cans|bottle|bottles)\s+/i, "");
  s = s.replace(/\s+\d+(\.\d+)?\s*(kg|g|ml|l|litre|litres|pack|packs|pcs|pieces|tin|tins|can|cans|bottle|bottles)$/i, "");
  return s.replace(/\s+/g, " ").trim();
}

function searchUrl(q) {
  return `https://www.tesco.com/groceries/en-GB/search?query=${encodeURIComponent(q)}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { list = "" } = req.body || {};
    const seen = new Set();
    const items = String(list).split(/[\n,]+/).map(cleanItem).filter(Boolean).filter(x => {
      const k = x.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    return res.status(200).json({
      items: items.map(item => ({
        item,
        searchUrl: searchUrl(item),
        status: "Tesco search link built",
        products: []
      }))
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Server error" });
  }
};
