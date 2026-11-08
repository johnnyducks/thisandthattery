#!/usr/bin/env node
/*
 * Builds catalog/search-index.json: the compact index behind the site-wide search.
 *
 *   node scripts/build-search-index.js
 *
 * Pulls together:
 *   - every pairing catalog in catalog/data/*.json (crawler output)
 *   - the products featured in the current issue (js/issue.js)
 *   - sponsor / featured-brand collections (js/sponsors.js)
 *   - "learn" entries: issue chapters and explainer lessons, so a search for
 *     "claw" can also point at the lesson about how claws work
 *
 * Run automatically by the Build catalog workflow after each crawl.
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const browserData = (file, name) => { const ctx = { window: {} }; vm.runInNewContext(read(file), ctx); return ctx.window[name]; };

const issue = browserData("js/issue.js", "TT_ISSUE");
const sponsors = browserData("js/sponsors.js", "TT_SPONSORS");
const short = s => String(s || "").replace(/\s+/g, " ").trim();

// group labels come from each pairing's brief, in the brief's order
const groups = {}, order = [];
for (const f of fs.readdirSync(path.join(ROOT, "catalog/pairings")).filter(f => f.endsWith(".json"))) {
  const brief = JSON.parse(read(`catalog/pairings/${f}`));
  for (const t of brief.types) { const key = `${brief.id}:${t.id}`; groups[key] = { label: t.label, side: t.side, pairing: brief.id, kind: t.side === "this" ? brief.this : brief.that }; order.push(key); }
}

const items = [], seen = new Set();
const add = it => { const k = it.u.replace(/[?#].*$/, ""); if (seen.has(k)) return; seen.add(k); items.push(it); };

// 1) issue products first, so they win dedupe and carry the "in the story" flag
for (const [id, p] of Object.entries(issue.products)) {
  add({ id: "issue:" + id, t: `${p.brand} ${p.name}`, b: p.brand, s: issue.retailers[p.retailer]?.name || p.retailer, p: p.price,
    i: p.image, u: p.url, g: null, k: p.kind, st: 1, ref: id, in: 1 });
}
// 2) sponsor collections
for (const [bid, b] of Object.entries(sponsors.brands)) {
  for (const p of b.products) add({ id: `sp:${bid}:${p.id}`, t: p.name, b: b.name, s: b.name, p: p.price, i: p.image, u: p.url, g: null, k: /mirror/i.test(p.name) ? "mirror" : "hammer", sp: bid, in: 1 });
}
// 3) crawled catalogs
let catalogCount = 0;
for (const f of fs.readdirSync(path.join(ROOT, "catalog/data")).filter(f => f.endsWith(".json") && !f.endsWith(".report.json"))) {
  const cat = JSON.parse(read(`catalog/data/${f}`)); const pairing = cat.pairing || f.replace(/\.json$/, "");
  for (const it of cat.items) {
    if (!it.title || !it.url) continue;
    const before = items.length;
    add({ id: it.id, t: short(it.title), b: it.brand && it.brand !== it.sourceName && !/:/.test(it.brand) ? short(it.brand) : undefined,
      s: it.sourceName, p: it.price ?? undefined, i: it.image, u: it.url, g: `${pairing}:${it.type}`, k: it.kind,
      a: it.angle, in: /OutOfStock|SoldOut|Discontinued/i.test(it.availability || "") ? 0 : 1 });
    if (items.length > before) catalogCount++;
  }
}
// featured/sponsor items: sort them with the same classifier the crawler uses
const { classifier } = require("../api/_lib/classify");
const classifiers = fs.readdirSync(path.join(ROOT, "catalog/pairings")).filter(f => f.endsWith(".json"))
  .map(f => { const b = JSON.parse(read(`catalog/pairings/${f}`)); return [b.id, classifier(b)]; });
for (const it of items) if (!it.g) {
  for (const [pid, c] of classifiers) { const r = c({ title: it.t, price: it.p }); if (r) { it.g = `${pid}:${r.type}`; it.a = it.a || r.angle; break; } }
}

// 4) learn entries
const learn = [
  ...issue.chapters.filter(c => !c.module).map(c => ({ t: `${c.numeral}. ${c.title}`, d: c.dek, u: `index.html#ch-${c.id}`, w: "Story" })),
  { t: "Anatomy of a hammer", d: "Face, neck, cheek, eye, wedge, claw, throat and swell.", u: "explainer.html#anatomy", w: "Lesson", kw: "parts face claw wedge eye handle anatomy" },
  { t: "Why a lighter hammer can hit as hard", d: "Energy = ½ × mass × speed². Try the calculator.", u: "explainer.html#physics", w: "Lesson", kw: "weight ounce oz energy swing speed physics heavy light" },
  { t: "What each hammer face leaves behind", d: "Smooth, milled, belled and dead-blow faces.", u: "explainer.html#faces", w: "Lesson", kw: "milled waffle smooth face dead blow mallet marks" },
  { t: "The claw is a lever", d: "How a 13-inch handle out-pulls your arm.", u: "explainer.html#lever", w: "Lesson", kw: "claw pull nail lever leverage pry" },
  { t: "Wood, fiberglass or steel handles?", d: "What the handle does to your elbow.", u: "explainer.html#handles", w: "Lesson", kw: "handle hickory fiberglass steel wood vibration" },
  { t: "How much does a mirror pull on the wall?", d: "Picture-wire tension, studs and French cleats.", u: "explainer.html#hanging", w: "Lesson", kw: "hang hanging mirror wire hook stud cleat wall anchor weight" },
  { t: "The hammer spectrum", d: "Every hammer in our catalog by head weight.", u: "explainer.html#spectrum", w: "Lesson", kw: "weight size jeweler forging chart" },
  ...Object.entries(sponsors.brands).map(([id, b]) => ({ t: b.title, d: b.dek, u: `sponsor.html?brand=${id}`, w: b.paid ? "Sponsored" : "Featured brand", kw: `${b.name} brand collection` }))
];

const usedGroups = Object.fromEntries(order.filter(k => items.some(i => i.g === k)).map(k => [k, groups[k]]));
const out = { builtAt: new Date().toISOString(), groups: usedGroups, order: order.filter(k => usedGroups[k]), items, learn };
fs.writeFileSync(path.join(ROOT, "catalog/search-index.json"), JSON.stringify(out));
const kb = (fs.statSync(path.join(ROOT, "catalog/search-index.json")).size / 1024).toFixed(0);
console.log(`search index: ${items.length} products (${catalogCount} from catalogs), ${learn.length} learn entries, ${Object.keys(usedGroups).length} groups, ${kb} KB`);
