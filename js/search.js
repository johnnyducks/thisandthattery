/*
 * Site-wide product search: always one tap or keypress away.
 *
 *   - Launcher pill fixed bottom-left on every page, plus a button in the sticky nav bar
 *   - "/" or Cmd/Ctrl+K opens it; Esc closes; ↑ ↓ to move; Enter to open
 *   - Searches catalog/search-index.json (built by scripts/build-search-index.js):
 *     issue products, sponsor collections, every crawled catalog, and lessons
 *   - Results grouped: In this issue → Learn → one group per product type → "search eBay" fallback
 *   - "+ Kit" adds a result to the page's kit when the page has one (TT_KIT)
 */
(function () {
  const INDEX_URL = "catalog/search-index.json";
  const PER_GROUP = 4;
  const POPULAR = ["claw hammer", "mallet", "round mirror", "convex", "vanity mirror", "blacksmith", "under $25"];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = n => n == null ? "" : "$" + (Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const store = { get(k, d) { try { return JSON.parse(localStorage.getItem("tt-search-" + k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem("tt-search-" + k, JSON.stringify(v)); } catch (e) {} } };

  /* ---------------- text matching ---------------- */
  const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/(\d)([a-z])/g, "$1 $2").replace(/[^a-z0-9.]+/g, " ").trim();
  const stem = w => w.length > 4 && w.endsWith("ies") ? w.slice(0, -3) + "y" : w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w;
  const toks = s => norm(s).split(" ").filter(Boolean).map(stem);
  function lev1(a, b) {               // true when edit distance <= 1
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  }

  let DB = null, loading = null;
  function load() {
    if (DB) return Promise.resolve(DB);
    return loading = loading || fetch(INDEX_URL).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(d => {
      const g = d.groups;
      d.items.forEach(it => {
        const grp = g[it.g] || {};
        it._f = [[toks(it.t), 3], [toks(it.b), 2], [toks(grp.label), 2], [toks(grp.kind), 1], [toks(it.s), 1], [toks(it.a), .5]];
      });
      d.learn.forEach(l => { l._f = [[toks(l.t), 3], [toks(l.kw), 2], [toks(l.d), 1]]; });
      return (DB = d);
    });
  }

  function scoreDoc(fields, qt) {
    let total = 0, hits = 0;
    for (const q of qt) {
      let best = 0;
      for (const [words, w] of fields) for (const t of words) {
        const s = t === q ? w : (q.length >= 2 && t.startsWith(q)) ? w * .8 : (q.length >= 5 && lev1(q, t)) ? w * .5 : 0;
        if (s > best) best = s;
      }
      if (best) hits++; total += best;
    }
    return { total, all: hits === qt.length, hits };
  }

  // "under $25" / "$25-100" / "100+" in the query become price filters
  function priceFromQuery(q) {
    let m, min = null, max = null, rest = q;
    if ((m = q.match(/\bunder\s*\$?\s*(\d+)/i))) { max = +m[1]; rest = q.replace(m[0], " "); }
    else if ((m = q.match(/\$?\s*(\d+)\s*(?:-|to|–)\s*\$?\s*(\d+)/i))) { min = +m[1]; max = +m[2]; rest = q.replace(m[0], " "); }
    else if ((m = q.match(/\$\s*(\d+)\s*\+|\bover\s*\$?\s*(\d+)/i))) { min = +(m[1] || m[2]); rest = q.replace(m[0], " "); }
    return { min, max, rest };
  }

  function search(raw, f) {
    const { min, max, rest } = priceFromQuery(raw);
    const lo = f.min ?? min, hi = f.max ?? max;
    const qt = toks(rest);
    const pass = it => (f.side === "all" || (DB.groups[it.g] || {}).side === f.side) &&
      (lo == null || (it.p != null && it.p >= lo)) && (hi == null || (it.p != null && it.p <= hi)) && (!f.stock || it.in);
    let loose = false;
    const rank = (it, s) => s + (it.st ? 2 : 0) + (it.sp ? .6 : 0) - (it.in ? 0 : 1.5) - (it.p == null ? .8 : 0);   // shoppable first
    let prods = DB.items.filter(pass).map(it => ({ it, r: qt.length ? scoreDoc(it._f, qt) : { total: 1, all: true } }));
    let hits = prods.filter(x => x.r.all && x.r.total > 0);
    if (!hits.length && qt.length > 1) { loose = true; hits = prods.filter(x => x.r.hits > 0); }
    hits.sort((a, b) => rank(b.it, b.r.total) - rank(a.it, a.r.total) || (a.it.p ?? 1e9) - (b.it.p ?? 1e9));
    const learn = qt.length ? DB.learn.map(l => ({ l, r: scoreDoc(l._f, qt) })).filter(x => x.r.all && x.r.total > 2).sort((a, b) => b.r.total - a.r.total).map(x => x.l) : [];
    return { qt, loose, hits: hits.map(x => x.it), learn, price: { lo, hi } };
  }

  /* ---------------- UI ---------------- */
  let root, input, results, chips, sel = -1;
  const filt = { side: "all", min: null, max: null, stock: false };
  const expanded = new Set();

  function build() {
    if (root) return;
    root = document.createElement("div");
    root.className = "ss"; root.hidden = true;
    root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Search products");
    root.innerHTML = `
      <div class="ss-backdrop" data-close></div>
      <div class="ss-panel">
        <div class="ss-bar">
          <span class="ss-icon" aria-hidden="true"></span>
          <input type="search" class="ss-input" placeholder="Search hammers, mirrors, brands…" autocomplete="off" spellcheck="false" aria-label="Search" aria-controls="ss-results">
          <button type="button" class="ss-close" data-close aria-label="Close search">Esc</button>
        </div>
        <div class="ss-chips" role="group" aria-label="Filters">
          <button type="button" data-side="all" class="on">All</button><button type="button" data-side="this">Hammers</button><button type="button" data-side="that">Mirrors</button>
          <i></i>
          <button type="button" data-price="0-25">Under $25</button><button type="button" data-price="25-100">$25–$100</button><button type="button" data-price="100-">$100+</button>
          <i></i>
          <button type="button" data-stock>In stock</button>
        </div>
        <div class="ss-results" id="ss-results" role="listbox" aria-label="Results"></div>
        <div class="ss-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span><span class="ss-count"></span></div>
      </div>`;
    document.body.appendChild(root);
    input = root.querySelector(".ss-input"); results = root.querySelector(".ss-results"); chips = root.querySelector(".ss-chips");
    input.addEventListener("input", () => { expanded.clear(); render(); });
    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKey);
  }

  const hl = (text, qt) => {
    let out = esc(text);
    if (!qt.length) return out;
    const re = new RegExp(`\\b(${qt.filter(q => q.length > 1).map(q => q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
    return qt.some(q => q.length > 1) ? out.replace(re, "<mark>$1</mark>") : out;
  };

  function row(it, qt) {
    const kitId = "search:" + it.id;
    const inKit = window.TT_KIT && (TT_KIT.has(kitId) || (it.ref && TT_KIT.has(it.ref)));
    return `<div class="ss-row" role="option">
      <a class="ss-main" href="${esc(it.u)}" target="_blank" rel="sponsored noopener">
        <span class="ss-thumb">${it.i ? `<img src="${esc(it.i)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}</span>
        <span class="ss-txt"><b>${hl(it.t, qt)}</b><small>${esc([it.b, it.s].filter((x, n, a) => x && a.indexOf(x) === n).join(" · "))}${it.st ? ` <em class="ss-badge">In the story</em>` : it.sp ? ` <em class="ss-badge sp">Featured brand</em>` : ""}${it.in ? "" : ` <em class="ss-badge out">Out of stock</em>`}</small></span>
        <span class="ss-price">${money(it.p) || "<small>See price</small>"}</span>
      </a>
      ${window.TT_KIT && it.p != null ? `<button type="button" class="ss-kit ${inKit ? "on" : ""}" data-kit-add="${esc(it.id)}" aria-label="${inKit ? "In your kit" : "Add to kit"}">${inKit ? "✓" : "+"}</button>` : ""}
    </div>`;
  }

  function render() {
    if (!DB) { results.innerHTML = `<p class="ss-empty">Loading the catalog…</p>`; return; }
    const q = input.value.trim();
    sel = -1;
    if (!q) {
      const recent = store.get("recent", []);
      const story = DB.items.filter(i => i.st).slice(0, 6);
      results.innerHTML = `
        ${recent.length ? `<div class="ss-group"><h3>Recent</h3><div class="ss-pills">${recent.map(r => `<button type="button" data-q="${esc(r)}">${esc(r)}</button>`).join("")}</div></div>` : ""}
        <div class="ss-group"><h3>Popular</h3><div class="ss-pills">${POPULAR.map(p => `<button type="button" data-q="${esc(p)}">${esc(p)}</button>`).join("")}</div></div>
        <div class="ss-group"><h3>In this issue</h3>${story.map(i => row(i, [])).join("")}</div>`;
      root.querySelector(".ss-count").textContent = `${DB.items.length} products indexed`;
      return;
    }
    const r = search(q, filt);
    clearTimeout(render._t);   // log the query once the reader pauses typing
    render._t = setTimeout(() => { if (q.length > 1 && q !== render._last) { render._last = q; window.TT_TRACK?.("Search", { q: q.toLowerCase(), results: r.hits.length }); } }, 1200);
    const html = [];
    const story = r.hits.filter(i => i.st);
    if (story.length) html.push(`<div class="ss-group"><h3>In this issue <small>${story.length}</small></h3>${story.map(i => row(i, r.qt)).join("")}</div>`);
    if (r.learn.length) html.push(`<div class="ss-group learn"><h3>Learn</h3>${r.learn.slice(0, 3).map(l => `<a class="ss-learn" role="option" href="${esc(l.u)}"><em>${esc(l.w)}</em><b>${hl(l.t, r.qt)}</b><small>${esc(l.d || "")}</small></a>`).join("")}</div>`);
    const byGroup = {};
    r.hits.filter(i => !i.st).forEach(i => (byGroup[i.g] = byGroup[i.g] || []).push(i));
    const order = Object.keys(byGroup).sort((a, b) => {
      // a group whose own name matches the query ("round" → Round wall mirrors) outranks incidental title hits
      const labelHit = k => { const lt = toks((DB.groups[k] || {}).label); return r.qt.filter(q => q.length > 2 && lt.some(t => t.startsWith(q))).length * 2.5; };
      const best = k => Math.max(...byGroup[k].slice(0, 3).map(i => scoreDoc(i._f, r.qt).total)) + labelHit(k);
      return best(b) - best(a) || DB.order.indexOf(a) - DB.order.indexOf(b);
    });
    for (const g of order) {
      const list = byGroup[g], open = expanded.has(g), label = (DB.groups[g] || {}).label || "More";
      html.push(`<div class="ss-group"><h3>${esc(label)} <small>${list.length}</small></h3>${list.slice(0, open ? 60 : PER_GROUP).map(i => row(i, r.qt)).join("")}
        ${list.length > PER_GROUP && !open ? `<button type="button" class="ss-more" data-expand="${esc(g)}">Show all ${list.length} ${esc(label.toLowerCase())}</button>` : ""}</div>`);
    }
    const ebay = document.getElementById("ch-swapmeet") ? `#ch-swapmeet` : `index.html?swap=${encodeURIComponent(q)}#ch-swapmeet`;
    html.push(`<a class="ss-ebay" role="option" href="${esc(ebay)}" data-swap="${esc(q)}"><b>Search secondhand on eBay</b><span>“${esc(q)}” in the Swap Meet →</span></a>`);
    if (!r.hits.length && !r.learn.length) html.unshift(`<p class="ss-empty">Nothing in our catalog matches “${esc(q)}” yet. Try a broader word, or check secondhand listings below.</p><p class="aside-other">We also checked behind the mirrors.</p>`);
    else if (r.loose) html.unshift(`<p class="ss-note">No exact match for every word. Showing close matches.</p>`);
    results.innerHTML = html.join("");
    const n = r.hits.length;
    root.querySelector(".ss-count").textContent = `${n} product${n === 1 ? "" : "s"}`;
  }

  function onClick(e) {
    const t = e.target;
    if (t.closest(".ss-backdrop") || t.closest(".ss-close")) return close();
    const qb = t.closest("[data-q]"); if (qb) { input.value = qb.dataset.q; input.focus(); render(); return; }
    const ex = t.closest("[data-expand]"); if (ex) { expanded.add(ex.dataset.expand); render(); return; }
    const side = t.closest("[data-side]");
    if (side) { filt.side = side.dataset.side; chips.querySelectorAll("[data-side]").forEach(b => b.classList.toggle("on", b === side)); render(); return; }
    const pr = t.closest("[data-price]");
    if (pr) {
      const on = !pr.classList.contains("on");
      chips.querySelectorAll("[data-price]").forEach(b => b.classList.remove("on"));
      const [a, b] = pr.dataset.price.split("-");
      filt.min = on && a !== "" ? +a : null; filt.max = on && b !== "" ? +b : null;
      if (on) pr.classList.add("on"); render(); return;
    }
    const st = t.closest("[data-stock]"); if (st) { filt.stock = !filt.stock; st.classList.toggle("on", filt.stock); render(); return; }
    const kit = t.closest("[data-kit-add]");
    if (kit && window.TT_KIT) {
      const it = DB.items.find(i => i.id === kit.dataset.kitAdd); if (!it) return;
      if (it.ref && window.TT_ISSUE?.products?.[it.ref]) TT_KIT.toggle(it.ref);
      else TT_KIT.toggleExternal({ id: "search:" + it.id, external: true, kind: it.k || "item", brand: it.b || it.s, name: it.t, short: it.t.length > 28 ? it.t.slice(0, 26) + "…" : it.t, price: it.p ?? 0, url: it.u, image: it.i, shipping: "See shop for shipping", retailer: "shop:" + (it.s || "other") },
        { name: it.s || "Other shops", freeShipOver: null, shippingNote: "Shipping calculated at checkout", returns: "See shop for returns" });
      remember(); render(); return;
    }
    const sw = t.closest("[data-swap]");
    if (sw) window.TT_TRACK?.("Search to Swap Meet", { q: sw.dataset.swap.toLowerCase() });
    if (sw && document.getElementById("ch-swapmeet")) { e.preventDefault(); remember(); close(); window.TT_SWAP?.(sw.dataset.swap); document.getElementById("ch-swapmeet").scrollIntoView({ behavior: "smooth" }); return; }
    if (t.closest(".ss-learn")) window.TT_TRACK?.("Search learn click", { to: t.closest(".ss-learn").getAttribute("href") });
    if (t.closest(".ss-main, .ss-learn")) remember();
  }

  function onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); return close(); }
    const opts = [...results.querySelectorAll(".ss-main, .ss-learn, .ss-ebay")];
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault(); if (!opts.length) return;
      sel = e.key === "ArrowDown" ? Math.min(opts.length - 1, sel + 1) : Math.max(-1, sel - 1);
      opts.forEach((o, n) => o.classList.toggle("sel", n === sel));
      if (sel < 0) input.focus(); else opts[sel].scrollIntoView({ block: "nearest" });
    }
    if (e.key === "Enter" && sel >= 0 && opts[sel]) { e.preventDefault(); opts[sel].click(); }
    if (e.key === "Enter" && sel < 0 && document.activeElement === input) { e.preventDefault(); remember(); const first = opts[0]; if (first) { sel = 0; first.classList.add("sel"); first.focus(); } }
    if (e.key === "Tab") {  // keep focus inside the dialog
      const f = [...root.querySelectorAll("input, button, a")].filter(x => x.offsetParent);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  }

  function remember() {
    const q = input.value.trim(); if (q.length < 2) return;
    store.set("recent", [q, ...store.get("recent", []).filter(r => r.toLowerCase() !== q.toLowerCase())].slice(0, 6));
  }

  let lastFocus = null;
  function open(q) {
    build(); lastFocus = document.activeElement;
    root.hidden = false; document.documentElement.classList.add("ss-open");
    if (typeof q === "string") input.value = q;
    render(); input.focus(); input.select();
    load().then(render).catch(() => { results.innerHTML = `<p class="ss-empty">Search isn't available right now. Please try again in a moment.</p>`; });
  }
  function close() { if (!root || root.hidden) return; root.hidden = true; document.documentElement.classList.remove("ss-open"); lastFocus?.focus?.(); }

  /* ---------------- launchers ---------------- */
  function launchers() {
    const pill = document.createElement("button");
    pill.type = "button"; pill.className = "ss-launch";
    pill.innerHTML = `<span class="ss-icon" aria-hidden="true"></span><span class="ss-launch-label">Search hammers, mirrors…</span><kbd>/</kbd>`;
    pill.setAttribute("aria-label", "Search products");
    pill.addEventListener("click", () => open());
    document.body.appendChild(pill);
    const addNav = () => {
      const end = document.querySelector(".topnav-end");
      if (!end || end.querySelector(".topnav-search")) return;
      const b = document.createElement("button");
      b.type = "button"; b.className = "topnav-search"; b.setAttribute("aria-label", "Search products");
      b.innerHTML = `<span class="ss-icon" aria-hidden="true"></span><span>Search</span><kbd>/</kbd>`;
      b.addEventListener("click", () => open());
      end.prepend(b);
    };
    addNav(); setTimeout(addNav, 0); setTimeout(addNav, 500);
    document.addEventListener("keydown", e => {
      const typing = /input|textarea|select/i.test(document.activeElement?.tagName || "") || document.activeElement?.isContentEditable;
      if ((e.key === "/" && !typing) || (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey))) { e.preventDefault(); open(); }
    });
    // warm the index once the page is idle so the first search is instant
    if (location.protocol !== "file:") (window.requestIdleCallback || (f => setTimeout(f, 1500)))(() => load().catch(() => {}));
    window.TT_KIT?.onChange?.(() => { if (root && !root.hidden) render(); });
  }

  window.TT_SEARCH = { open, close, search: (q, f) => load().then(() => search(q, { side: "all", min: null, max: null, stock: false, ...f })) };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", launchers); else launchers();
})();
