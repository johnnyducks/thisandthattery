#!/usr/bin/env node
/*
 * Catalog crawler: builds a candidate product catalog for a pairing.
 *
 *   node scripts/crawl.js --pairing hammers-mirrors [--sources garrettwade,schoolhouse] [--max-pages 120] [--delay 1200]
 *
 * Reads   catalog/pairings/<pairing>.json  (types, angles, sources)
 * Writes  catalog/data/<pairing>.json      (merged catalog, deduped by URL)
 *         catalog/data/<pairing>.report.json (what each source yielded / why it failed)
 *
 * Per source: robots.txt -> Shopify /products.json feed if the store has one
 *             -> otherwise sitemap.xml, fetch only product URLs whose slug matches urlKeywords,
 *                and read schema.org Product data from each page.
 * Polite by default: one request at a time per site, a delay between requests, robots.txt honoured,
 * and a source is abandoned as soon as it starts blocking (403/429/captcha).
 */
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const { extractProduct, fromShopify, get, robotsRules } = require("../api/_lib/extract");
const { classifier } = require("../api/_lib/classify");

const args = Object.fromEntries(process.argv.slice(2).join(" ").split("--").filter(Boolean).map(s => { const [k, ...v] = s.trim().split(/\s+/); return [k, v.join(" ") || true]; }));
const PAIRING = args.pairing || "hammers-mirrors";
const MAX_PAGES = +args["max-pages"] || 120;          // product pages fetched per sitemap source
const MAX_SHOPIFY_PAGES = +args["max-feed-pages"] || 12; // x250 products
const DELAY = +args.delay || 1200;
const ROOT = path.join(__dirname, "..", "catalog");
const brief = JSON.parse(fs.readFileSync(args.brief || path.join(ROOT, "pairings", `${PAIRING}.json`), "utf8"));
const OUT_DIR = args.out || path.join(ROOT, "data");
const only = args.sources ? String(args.sources).split(",") : null;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

/* ---------- classification ---------- */
const URLKW = new RegExp(brief.urlKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i");
const classify = classifier(brief);

/* ---------- per-source crawl ---------- */
const blockedBody = b => /captcha|access denied|are you a robot|cf-chl|px-captcha|perimeterx|request unsuccessful/i.test(b.slice(0, 5000));

async function crawlSource(src) {
  const rep = { id: src.id, name: src.name, method: null, fetched: 0, found: 0, kept: 0, errors: [], startedAt: new Date().toISOString() };
  const items = [];
  if (!src.url || (src.kind && src.kind !== "auto")) { rep.method = src.kind || "skip"; rep.note = src.notes; return { rep, items }; }
  const base = src.url.replace(/\/$/, "");
  let allowed = () => true, robotsTxt = "";
  try { const r = await get(`${base}/robots.txt`, { accept: "text/plain" }); if (r.ok) { robotsTxt = r.body; allowed = robotsRules(r.body); } } catch (e) { rep.errors.push("robots: " + e.message); }

  const keep = (it) => {
    rep.found++;
    if (!it.title || !(it.image || it.price != null)) return;
    const c = classify(it); if (!c) return;
    items.push({ ...it, ...c, source: src.id, sourceName: src.name });
    rep.kept++;
  };

  // 1) Shopify feed
  try {
    if (allowed("/products.json")) {
      const r = await get(`${base}/products.json?limit=250&page=1`, { accept: "application/json" });
      rep.fetched++;
      const j = r.ok && /json/.test(r.type) ? JSON.parse(r.body) : null;
      if (j && Array.isArray(j.products)) {
        rep.method = "shopify-feed";
        let page = 1, batch = j.products;
        while (batch.length) {
          batch.forEach(p => keep(fromShopify(p, base)));
          if (++page > MAX_SHOPIFY_PAGES || batch.length < 250) break;
          await sleep(DELAY);
          const n = await get(`${base}/products.json?limit=250&page=${page}`, { accept: "application/json" }); rep.fetched++;
          batch = n.ok ? (JSON.parse(n.body).products || []) : [];
        }
        return { rep, items };
      }
    }
  } catch (e) { rep.errors.push("feed: " + e.message); }

  // 2) Sitemaps -> product pages
  rep.method = "sitemap";
  try {
    const maps = [...robotsTxt.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map(m => m[1]);
    if (!maps.length) maps.push(`${base}/sitemap.xml`);
    const urls = new Set(), seenMaps = new Set();
    const queue = [...maps];
    while (queue.length && seenMaps.size < 25 && urls.size < 5000) {
      const sm = queue.shift(); if (seenMaps.has(sm)) continue; seenMaps.add(sm);
      const r = await get(sm, { accept: "application/xml,text/xml" }); rep.fetched++;
      if (!r.ok) { rep.errors.push(`sitemap ${r.status}: ${sm}`); if ([403, 429].includes(r.status)) { rep.blocked = true; break; } continue; }
      const locs = [...r.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(m => m[1].replace(/&amp;/g, "&"));
      if (/<sitemapindex/i.test(r.body)) {
        // product sitemaps first; skip images/blog/category maps
        locs.sort((a, b) => (/product/i.test(b) ? 1 : 0) - (/product/i.test(a) ? 1 : 0))
          .filter(l => !/image|blog|post|article|categor|collection|page-sitemap|video/i.test(l)).forEach(l => queue.push(l));
      } else locs.filter(l => URLKW.test(new URL(l).pathname)).forEach(l => urls.add(l));
      await sleep(Math.min(DELAY, 600));
    }
    rep.candidates = urls.size;
    let n = 0;
    for (const u of urls) {
      if (n >= MAX_PAGES || rep.blocked) break;
      const p = new URL(u).pathname; if (!allowed(p)) { rep.robotsSkipped = (rep.robotsSkipped || 0) + 1; continue; }
      n++;
      try {
        const r = await get(u); rep.fetched++;
        if ([403, 429, 503].includes(r.status) || blockedBody(r.body)) { rep.blocked = true; rep.errors.push(`blocked (${r.status}) at ${u}`); break; }
        if (r.ok) keep(extractProduct(r.body, r.url));
      } catch (e) { rep.errors.push(`${e.message}: ${u}`); }
      await sleep(DELAY);
    }
  } catch (e) { rep.errors.push("sitemap: " + e.message); }
  rep.errors = rep.errors.slice(0, 15);
  return { rep, items };
}

/* ---------- merge + write ---------- */
(async () => {
  const sources = brief.sources.filter(s => !only || only.includes(s.id));
  log(`Crawling ${sources.length} sources for "${PAIRING}"`);
  const results = [];
  const pool = 4; let i = 0;   // different sites in parallel, each site sequential
  await Promise.all(Array.from({ length: pool }, async () => {
    while (i < sources.length) {
      const s = sources[i++];
      log(`→ ${s.id}`);
      const r = await crawlSource(s).catch(e => ({ rep: { id: s.id, name: s.name, errors: [e.message] }, items: [] }));
      log(`✓ ${s.id}: ${r.rep.method || "-"} · kept ${r.rep.kept || 0}${r.rep.blocked ? " · BLOCKED" : ""}`);
      results.push(r);
    }
  }));

  const outFile = path.join(OUT_DIR, `${PAIRING}.json`);
  let existing = { items: [] };
  try { existing = JSON.parse(fs.readFileSync(outFile, "utf8")); } catch (e) {}
  const now = new Date().toISOString();
  const byId = new Map(existing.items.map(it => [it.id, it]));
  for (const { items } of results) for (const it of items) {
    const id = crypto.createHash("sha1").update(it.url.replace(/[?#].*$/, "")).digest("hex").slice(0, 12);
    const prev = byId.get(id);
    byId.set(id, { ...prev, ...it, id, firstSeen: prev?.firstSeen || now, lastSeen: now });
  }
  const items = [...byId.values()].sort((a, b) => a.side.localeCompare(b.side) || a.type.localeCompare(b.type) || (a.price ?? 1e9) - (b.price ?? 1e9));
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify({ pairing: PAIRING, updatedAt: now, count: items.length, items }, null, 1));
  fs.writeFileSync(outFile.replace(/\.json$/, ".report.json"), JSON.stringify({ pairing: PAIRING, ranAt: now, sources: results.map(r => r.rep) }, null, 2));
  const kept = results.reduce((s, r) => s + (r.rep.kept || 0), 0);
  log(`Done. ${kept} products this run · ${items.length} in catalog → ${path.relative(process.cwd(), outFile)}`);
})();
