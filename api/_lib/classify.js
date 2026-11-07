/*
 * Sorts a product into a pairing's product types and editorial angles
 * (see catalog/pairings/<id>.json). Shared by scripts/crawl.js and /api/import.
 *
 * Works from the product TITLE only. Store tags and product types are too noisy:
 * a shop tags its wallpaper "mirrors & wall decor".
 *   1. drop titles containing a rejectTitle phrase (handles, books, wall art…)
 *   2. strip "false friend" phrases (hammered brass, mirrored nightstand, hammer drill)
 *   3. the title must still contain one of its side's requireInTitle words
 *   4. first matching type wins (specific types are listed before catch-alls)
 */
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const words = list => new RegExp(`\\b(${list.map(esc).join("|")})(s|es|'s)?\\b`, "i");

function classifier(brief) {
  const EXCL = new RegExp(`\\b(${brief.exclude.map(esc).join("|")})\\b`, "gi");
  const REJECT = brief.rejectTitle?.length ? words(brief.rejectTitle) : null;
  const REQUIRE = Object.fromEntries(Object.entries(brief.requireInTitle || {}).map(([side, list]) => [side, words(list)]));
  const TYPES = brief.types.map(t => ({ ...t, re: words(t.match) }));
  return item => {
    const title = String(item.title || "");
    if (!title || (REJECT && REJECT.test(title))) return null;
    const text = title.replace(EXCL, " ");
    const type = TYPES.find(t => t.re.test(text) && (!REQUIRE[t.side] || REQUIRE[t.side].test(text)));
    if (!type) return null;
    const kind = type.side === "this" ? "hammer" : "mirror";
    const tier = brief.priceTiers?.[kind]?.heirloom;
    // vintage only when the TITLE says so, and not "vintage-inspired" / "antique brass finish"
    const vintage = /\b(vintage|antique|19[0-9]0s|mid[- ]century|victorian|edwardian|art deco|old stock)\b(?![- ]?(inspired|style|look|finish|brass|bronze|gold|white|black))/i.test(title);
    const angle = vintage ? "vintage"
      : tier && item.price >= tier ? "heirloom"
      : ["specialty", "smithing"].includes(type.id) ? "oddball"
      : "everyday";
    return { type: type.id, side: type.side, kind, angle };
  };
}

module.exports = { classifier };
