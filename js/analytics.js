/*
 * Analytics: Vercel Web Analytics (cookie-free page views) + our own events.
 * Load this before the other site scripts. Enable "Web Analytics" in the Vercel dashboard;
 * custom events need a Pro plan.
 *
 *   TT_TRACK("Event name", { key: "value" })   // flat, short values; no personal data
 *
 * Attribution: the first visit in a session records utm_source / utm_campaign (or the referring
 * site), and every event carries it as `src` / `camp`, so "Shop click" can be split by
 * Instagram vs TikTok vs Facebook.
 *
 * Events sent automatically:
 *   Shop click     any affiliate link (rel="sponsored"): product, shop, where
 *   Read depth     25 / 50 / 75 / 100 % of the page, once each
 * Sent by other scripts: Kit add, Search, Swap Meet search, Newsletter signup, Share, Calculator
 * Debug: localStorage.setItem("tt-debug", "1") logs events to the console.
 */
(function () {
  const ss = { get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  let debug = false; try { debug = localStorage.getItem("tt-debug") === "1"; } catch (e) {}

  // first-touch attribution for this session
  let ctx = ss.get("tt-attr");
  if (!ctx) {
    const q = new URLSearchParams(location.search); ctx = {};
    for (const k of ["source", "medium", "campaign", "content"]) { const v = q.get("utm_" + k); if (v) ctx[k] = v.slice(0, 40).toLowerCase(); }
    if (!ctx.source && document.referrer) {
      try { const h = new URL(document.referrer).hostname.replace(/^(www|m|l|lm)\./, ""); if (h !== location.hostname) ctx.source = h; } catch (e) {}
    }
    ctx.source = ctx.source || "direct";
    ss.set("tt-attr", ctx);
  }

  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };

  function track(name, data = {}) {
    const d = { ...data, src: ctx.source };
    if (ctx.campaign) d.camp = ctx.campaign;
    for (const k of Object.keys(d)) {
      if (d[k] == null || d[k] === "") delete d[k];
      else if (typeof d[k] === "string") d[k] = d[k].replace(/\s+/g, " ").trim().slice(0, 80);
    }
    try { window.va("event", { name, data: d }); } catch (e) {}
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: name, ...d });   // if a tag manager is ever added
    if (debug) console.log("[track]", name, d);
  }
  window.TT_TRACK = track;
  window.TT_ATTRIBUTION = ctx;

  const page = () => (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";

  // affiliate clicks, wherever they happen
  document.addEventListener("click", e => {
    const a = e.target.closest('a[rel~="sponsored"]');
    if (!a) return;
    const box = a.closest("figure, .ss-row, .mcard, .ix, .rcpt-shop, .sp-item, .kit-row");
    const product = box?.querySelector(".cap-name, .ss-txt b, .mcard-title, .rcpt-shop-head b, h3")?.textContent || a.textContent;
    let shop = ""; try { shop = new URL(a.href).hostname.replace(/^www\./, ""); } catch (err) {}
    const where = a.closest(".ss") ? "search" : a.closest(".tray") ? "tray" : a.closest(".kit-final") ? "toolbox"
      : `${page()}#${a.closest("section[id], header[id]")?.id || ""}`;
    track("Shop click", { product, shop, where });
  }, true);

  // read depth milestones
  const hit = new Set();
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight; if (max < 400) return;
    const pct = scrollY / max * 100;
    for (const m of [25, 50, 75, 100]) if (pct >= m - 1 && !hit.has(m)) { hit.add(m); track("Read depth", { page: page(), pct: m }); }
  };
  addEventListener("scroll", () => requestAnimationFrame(onScroll), { passive: true });
})();
