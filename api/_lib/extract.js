/*
 * Product extraction shared by the crawler (scripts/crawl.js) and /api/import.
 *
 * Sources of truth, in order:
 *   1. schema.org Product JSON-LD: what retailers publish for Google Shopping
 *   2. Open Graph / product meta tags: fallback
 *   3. Shopify's public /products.json feed: see fromShopify()
 *
 * Output (catalog item):
 *   { url, title, brand, image, images[], price, currency, availability,
 *     description, sku, gtin, rating, reviewCount, shipping, returns }
 */
const UA = "ThisAndThatteryCatalogBot/0.1 (+https://github.com/johnnyducks/thisandthattery)";

/* ---------- small HTML helpers (no dependencies) ---------- */
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'", "#x27": "'", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", trade: "™", reg: "®", deg: "°", frac12: "½", times: "×" };
function decode(s) {
  return String(s ?? "").replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => {
    if (e[0] === "#") { const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
    return ENT[e.toLowerCase()] ?? m;
  });
}
const clean = s => decode(String(s ?? "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const clip = (s, n = 400) => { s = clean(s); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s; };
const abs = (u, base) => { try { return u ? new URL(decode(u), base).href : undefined; } catch (e) { return undefined; } };
const num = v => { if (v == null || v === "") return undefined; const n = parseFloat(String(v).replace(/[^0-9.]/g, "")); return Number.isFinite(n) ? n : undefined; };
const first = v => Array.isArray(v) ? v[0] : v;
const typeIs = (o, t) => o && [].concat(o["@type"] || []).some(x => String(x).toLowerCase() === t.toLowerCase());

function meta(html, key) {
  const re = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${key.replace(/[.:]/g, "\\$&")}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0]; if (!tag) return undefined;
  return decode(tag.match(/content=["']([^"']*)["']/i)?.[1]);
}

/* ---------- JSON-LD ---------- */
function jsonLdBlocks(html) {
  const out = [];
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const raw = m[1].trim().replace(/^<!--|-->$/g, "");
    try { out.push(JSON.parse(raw)); }
    catch (e) { try { out.push(JSON.parse(raw.replace(/[\u0000-\u001f]+/g, " "))); } catch (e2) { /* skip broken block */ } }
  }
  return out;
}
function findProduct(node, depth = 0) {
  if (!node || depth > 6 || typeof node !== "object") return null;
  if (Array.isArray(node)) { for (const n of node) { const p = findProduct(n, depth + 1); if (p) return p; } return null; }
  if (typeIs(node, "Product") || typeIs(node, "ProductGroup")) return node;
  for (const k of ["@graph", "mainEntity", "itemListElement", "item"]) { const p = findProduct(node[k], depth + 1); if (p) return p; }
  return null;
}
function offerOf(p) {
  let o = p.offers ?? first(p.hasVariant)?.offers;
  if (Array.isArray(o)) o = o.find(x => x.price != null || x.lowPrice != null) || o[0];
  return o || {};
}
function images(v, base) {
  return [].concat(v || []).map(i => typeof i === "string" ? i : i?.url || i?.contentUrl).map(u => abs(u, base)).filter(Boolean);
}
function shippingText(o) {
  const s = first(o.shippingDetails); if (!s) return undefined;
  const rate = s.shippingRate?.value ?? s.shippingRate?.price;
  const days = s.deliveryTime?.transitTime; const range = days && days.minValue != null ? ` · ${days.minValue}–${days.maxValue ?? days.minValue} days` : "";
  if (rate == null) return undefined;
  return (+rate === 0 ? "Free shipping" : `Shipping ${rate} ${s.shippingRate?.currency || ""}`.trim()) + range;
}
function returnsText(o, p) {
  const r = first(o.hasMerchantReturnPolicy || p.hasMerchantReturnPolicy); if (!r) return undefined;
  const days = r.merchantReturnDays; const fee = String(r.returnFees || "").split("/").pop();
  if (/NotPermitted/i.test(r.returnPolicyCategory || "")) return "Final sale (no returns)";
  return [days ? `${days}-day returns` : "Returns accepted", /FreeReturn/i.test(fee) ? "free" : /Customer/i.test(fee) ? "buyer pays return shipping" : ""].filter(Boolean).join(", ");
}

function extractProduct(html, url) {
  const p = findProduct(jsonLdBlocks(html));
  const item = { url };
  if (p) {
    const o = offerOf(p);
    Object.assign(item, {
      title: clean(p.name),
      brand: clean(typeof p.brand === "string" ? p.brand : first(p.brand)?.name),
      images: images(p.image, url),
      price: num(o.price ?? o.lowPrice ?? o.priceSpecification?.price),
      currency: o.priceCurrency || o.priceSpecification?.priceCurrency,
      availability: String(o.availability || "").split("/").pop() || undefined,
      description: clip(p.description),
      sku: p.sku ? String(p.sku) : undefined,
      gtin: p.gtin13 || p.gtin12 || p.gtin || undefined,
      rating: num(p.aggregateRating?.ratingValue),
      reviewCount: num(p.aggregateRating?.reviewCount ?? p.aggregateRating?.ratingCount),
      shipping: shippingText(o),
      returns: returnsText(o, p)
    });
  }
  // fill gaps from meta tags
  item.title ||= clean(meta(html, "og:title") || html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]);
  item.brand ||= clean(meta(html, "product:brand") || meta(html, "og:site_name")) || undefined;
  if (!item.images?.length) item.images = images(meta(html, "og:image") || meta(html, "twitter:image"), url);
  item.price ??= num(meta(html, "product:price:amount") || meta(html, "og:price:amount"));
  item.currency ||= meta(html, "product:price:currency") || meta(html, "og:price:currency");
  item.description ||= clip(meta(html, "og:description") || meta(html, "description")) || undefined;
  item.image = item.images?.[0];
  item.confidence = p ? "structured" : item.price != null ? "meta" : "weak";
  return prune(item);
}

/* ---------- Shopify /products.json ---------- */
function fromShopify(prod, base) {
  const v = (prod.variants || []).find(x => x.available !== false) || prod.variants?.[0] || {};
  return prune({
    url: `${base.replace(/\/$/, "")}/products/${prod.handle}`,
    title: clean(prod.title), brand: clean(prod.vendor) || undefined,
    images: (prod.images || []).map(i => i.src).filter(Boolean),
    image: prod.images?.[0]?.src,
    price: num(v.price), currency: undefined,
    availability: prod.variants?.some(x => x.available) ? "InStock" : prod.variants?.length && prod.variants.every(x => x.available === false) ? "OutOfStock" : undefined,
    description: clip(prod.body_html),
    sku: v.sku || undefined,
    productType: prod.product_type || undefined,
    tags: Array.isArray(prod.tags) ? prod.tags.slice(0, 20) : typeof prod.tags === "string" ? prod.tags.split(/,\s*/).slice(0, 20) : undefined,
    confidence: "feed"
  });
}

function prune(o) { for (const k of Object.keys(o)) if (o[k] === undefined || o[k] === "" || (Array.isArray(o[k]) && !o[k].length)) delete o[k]; return o; }

/* ---------- polite fetching ---------- */
async function get(url, { accept = "text/html,application/xhtml+xml", timeout = 15000 } = {}) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: accept, "Accept-Language": "en-US,en;q=0.8" }, redirect: "follow", signal: ctl.signal });
    const body = await res.text();
    return { ok: res.ok, status: res.status, url: res.url || url, body, type: res.headers.get("content-type") || "" };
  } finally { clearTimeout(t); }
}

/* minimal robots.txt: honours Disallow/Allow for "*" and our bot name */
function robotsRules(txt) {
  const groups = []; let cur = null;
  for (const line of String(txt).split(/\r?\n/)) {
    const [k, ...rest] = line.replace(/#.*/, "").split(":"); const v = rest.join(":").trim(); const key = k.trim().toLowerCase();
    if (key === "user-agent") { if (!cur || cur.rules.length) groups.push(cur = { agents: [], rules: [] }); cur.agents.push(v.toLowerCase()); }
    else if ((key === "disallow" || key === "allow") && cur) cur.rules.push({ allow: key === "allow", path: v });
  }
  const mine = groups.filter(g => g.agents.some(a => a.includes("thisandthattery")));
  const rules = (mine.length ? mine : groups.filter(g => g.agents.includes("*"))).flatMap(g => g.rules).filter(r => r.path);
  const toRe = p => new RegExp("^" + p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$"));
  return path => {
    let best = null;
    for (const r of rules) if (toRe(r.path).test(path) && (!best || r.path.length > best.path.length)) best = r;
    return !best || best.allow;
  };
}

module.exports = { extractProduct, fromShopify, get, robotsRules, UA, clean };
