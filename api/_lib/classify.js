/*
 * Sorts a product into a pairing's product types and editorial angles
 * (see catalog/pairings/<id>.json). Shared by scripts/crawl.js and /api/import.
 */
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function classifier(brief) {
  const EXCL = new RegExp(`\\b(${brief.exclude.map(esc).join("|")})\\b`, "gi");
  const TYPES = brief.types.map(t => ({ ...t, re: new RegExp(`\\b(${t.match.map(esc).join("|")})(s|es)?\\b`, "i") }));
  return item => {
    // strip false friends first ("hammered brass", "mirrored nightstand") so the real noun still matches
    const text = [item.title, item.productType, ...(item.tags || [])].filter(Boolean).join(" · ").replace(EXCL, " ");
    const type = TYPES.find(t => t.re.test(text));
    if (!type) return null;
    const kind = type.side === "this" ? "hammer" : "mirror";
    const hay = `${item.title} ${item.description || ""}`;
    const tier = brief.priceTiers?.[kind]?.heirloom;
    const angle = /\b(vintage|antique|19[0-9]0s|mid[- ]century|victorian|edwardian|art deco|old stock)\b/i.test(hay) ? "vintage"
      : tier && item.price >= tier ? "heirloom"
      : ["specialty", "smithing"].includes(type.id) ? "oddball"
      : "everyday";
    return { type: type.id, side: type.side, kind, angle };
  };
}

module.exports = { classifier };
