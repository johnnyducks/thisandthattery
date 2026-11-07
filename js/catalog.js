/*
 * The Back Room: catalog browser for editors.
 * Loads catalog/pairings/<id>.json (the brief) and catalog/data/<id>.json (crawler output),
 * plus items pasted in via /api/import (kept in this browser). Shortlist + notes are kept
 * in this browser too; "Export" turns them into issue.js-shaped products.
 */
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = n => n == null ? "—" : "$" + (Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const PAIRING = new URLSearchParams(location.search).get("pairing") || "hammers-mirrors";
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(`tt-br-${PAIRING}-${k}`)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(`tt-br-${PAIRING}-${k}`, JSON.stringify(v)); } catch (e) {} }
  };

  let brief = null, crawled = [], manual = store.get("manual", []), shortlist = store.get("shortlist", {}), report = null;
  const f = { side: "all", types: new Set(), angles: new Set(), q: "", min: "", max: "", source: "", sort: "type" };
  const PAGE = 90; let shown = PAGE;

  const all = () => {
    const seen = new Set();
    return [...manual, ...crawled].filter(i => !seen.has(i.id) && seen.add(i.id));
  };
  const typeOf = id => brief?.types.find(t => t.id === id);
  const angleLabel = id => brief?.angles[id]?.label || id;

  /* ---------------- load ---------------- */
  async function load() {
    const j = async u => { const r = await fetch(u, { cache: "no-store" }); if (!r.ok) throw new Error(r.status); return r.json(); };
    try { brief = await j(`catalog/pairings/${PAIRING}.json`); } catch (e) { $("#grid").innerHTML = `<p class="br-empty">No brief found for “${esc(PAIRING)}”.</p>`; return; }
    $("#br-h1").innerHTML = `${esc(brief.this)} <em>&amp;</em> ${esc(brief.that)}`;
    try { crawled = (await j(`catalog/data/${PAIRING}.json`)).items || []; } catch (e) { crawled = []; }
    try { report = await j(`catalog/data/${PAIRING}.report.json`); } catch (e) { report = null; }
    buildFilters(); render(); renderSources(); syncShortlist();
  }

  /* ---------------- filters ---------------- */
  function buildFilters() {
    const items = all();
    $("#f-side").innerHTML = [["all", "Everything"], ["this", brief.this], ["that", brief.that]]
      .map(([v, l]) => `<button type="button" role="radio" data-side="${v}" aria-checked="${f.side === v}">${esc(l)} <small>${v === "all" ? items.length : items.filter(i => i.side === v).length}</small></button>`).join("");
    const types = brief.types.filter(t => f.side === "all" || t.side === f.side);
    $("#f-type").innerHTML = types.map(t => {
      const n = items.filter(i => i.type === t.id).length;
      return `<button type="button" class="chip ${f.types.has(t.id) ? "on" : ""} ${n ? "" : "zero"}" data-type="${t.id}" title="${esc(t.story)}">${esc(t.label)} <small>${n}</small></button>`;
    }).join("");
    $("#f-angle").innerHTML = Object.entries(brief.angles).map(([id, a]) =>
      `<button type="button" class="chip angle a-${id} ${f.angles.has(id) ? "on" : ""}" data-angle="${id}" title="${esc(a.note)}">${esc(a.label)} <small>${items.filter(i => i.angle === id).length}</small></button>`).join("");
    const srcs = [...new Map(items.map(i => [i.source, i.sourceName || i.source])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
    $("#f-source").innerHTML = `<option value="">All sources</option>` + srcs.map(([id, n]) => `<option value="${esc(id)}" ${f.source === id ? "selected" : ""}>${esc(n)}</option>`).join("");
  }

  function filtered() {
    const q = f.q.trim().toLowerCase(), min = parseFloat(f.min), max = parseFloat(f.max);
    let items = all().filter(i =>
      (f.side === "all" || i.side === f.side) &&
      (!f.types.size || f.types.has(i.type)) &&
      (!f.angles.size || f.angles.has(i.angle)) &&
      (!f.source || i.source === f.source) &&
      (isNaN(min) || (i.price ?? 0) >= min) && (isNaN(max) || (i.price ?? Infinity) <= max) &&
      (!q || `${i.title} ${i.brand || ""} ${i.description || ""} ${i.sourceName || ""}`.toLowerCase().includes(q)));
    const order = Object.fromEntries(brief.types.map((t, n) => [t.id, n]));
    const by = {
      type: (a, b) => (order[a.type] ?? 99) - (order[b.type] ?? 99) || (a.price ?? 1e9) - (b.price ?? 1e9),
      priceAsc: (a, b) => (a.price ?? 1e9) - (b.price ?? 1e9),
      priceDesc: (a, b) => (b.price ?? -1) - (a.price ?? -1),
      new: (a, b) => String(b.firstSeen || b.importedAt || "").localeCompare(String(a.firstSeen || a.importedAt || "")),
      rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
    };
    return items.sort(by[f.sort] || by.type);
  }

  /* ---------------- grid ---------------- */
  function card(i) {
    const t = typeOf(i.type), on = !!shortlist[i.id];
    const avail = /InStock/i.test(i.availability || "") ? "in" : /OutOfStock|SoldOut|Discontinued/i.test(i.availability || "") ? "out" : "";
    return `<article class="ix ${on ? "starred" : ""}" data-id="${esc(i.id)}">
      <div class="ix-img">${i.image ? `<img src="${esc(i.image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : `<span class="ix-noimg">No image</span>`}</div>
      <span class="ix-angle a-${esc(i.angle)}">${esc(angleLabel(i.angle))}</span>
      <div class="ix-body">
        <div class="ix-type">${esc(t?.label || i.type || "Unsorted")}</div>
        <h3>${esc(i.title)}</h3>
        <div class="ix-by">${esc([i.brand, i.sourceName].filter((x, n, a) => x && a.indexOf(x) === n).join(" · "))}</div>
        <div class="ix-price">${money(i.price)}${avail ? `<i class="dot ${avail}" title="${avail === "in" ? "In stock" : "Out of stock"}"></i>` : ""}${i.rating ? `<small>${i.rating}★${i.reviewCount ? ` (${i.reviewCount})` : ""}</small>` : ""}</div>
        ${i.shipping || i.returns ? `<div class="ix-terms">${esc([i.shipping, i.returns].filter(Boolean).join(" · "))}</div>` : ""}
      </div>
      <div class="ix-actions">
        <button type="button" class="ix-star" data-star="${esc(i.id)}" aria-pressed="${on}">${on ? "★ Listed" : "☆ Shortlist"}</button>
        <a href="${esc(i.url)}" target="_blank" rel="noopener sponsored" aria-label="Open product page">Open ↗</a>
      </div>
    </article>`;
  }

  function render() {
    const items = filtered();
    const sl = Object.keys(shortlist).length;
    $("#summary").innerHTML = `<b>${items.length}</b> of ${all().length} products${manual.length ? ` · ${manual.length} pasted by hand` : ""}${sl ? ` · ${sl} shortlisted` : ""}`;
    if (!all().length) {
      $("#grid").innerHTML = `<div class="br-empty"><b>The shelves are empty.</b>
        Run the crawler: on GitHub, open <em>Actions → Build catalog → Run workflow</em>. It visits the sources in
        <code>catalog/pairings/${esc(PAIRING)}.json</code> and saves what it finds here. Meanwhile, paste product links above.</div>`;
      $("#more").hidden = true; return;
    }
    $("#grid").innerHTML = items.length ? items.slice(0, shown).map(card).join("") : `<div class="br-empty"><b>Nothing matches.</b> Loosen a filter.</div>`;
    $("#more").hidden = items.length <= shown;
    $("#more").textContent = `Show more (${items.length - shown} left)`;
  }

  /* ---------------- sources report ---------------- */
  function renderSources() {
    const rows = (report?.sources || []).map(s => {
      const status = s.blocked ? `<b class="bad">Blocked</b>` : s.method === "manual" || s.method === "api" ? `<b class="meh">${s.method === "api" ? "API" : "Paste links"}</b>` : (s.kept ? `<b class="good">${s.kept} kept</b>` : `<b class="meh">0 kept</b>`);
      return `<tr><td>${esc(s.name)}</td><td>${status}</td><td>${esc(s.method || "")}</td><td>${s.fetched ?? ""}</td><td class="err">${esc(s.note || (s.errors || [])[0] || "")}</td></tr>`;
    });
    $("#sources-body").innerHTML = report
      ? `<p>Last crawl: ${new Date(report.ranAt).toLocaleString()}</p><div class="br-table"><table><thead><tr><th>Source</th><th>Result</th><th>Method</th><th>Requests</th><th>Notes</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`
      : `<p>No crawl has run yet. Sources planned in the brief: ${brief.sources.map(s => esc(s.name)).join(", ")}.</p>`;
  }

  /* ---------------- shortlist ---------------- */
  function syncShortlist() {
    store.set("shortlist", shortlist);
    const ids = Object.keys(shortlist);
    $("#sl-count").textContent = ids.length;
    const byId = new Map(all().map(i => [i.id, i]));
    const items = ids.map(id => byId.get(id) || shortlist[id].item).filter(Boolean);
    const groups = {};
    items.forEach(i => (groups[i.type] = groups[i.type] || []).push(i));
    $("#drawer-body").innerHTML = items.length ? Object.entries(groups).map(([t, list]) => `
      <div class="sl-group"><h3>${esc(typeOf(t)?.label || t)} <small>${list.length}</small></h3>
      ${list.map(i => `<div class="sl-item">
        <div class="sl-thumb">${i.image ? `<img src="${esc(i.image)}" alt="" referrerpolicy="no-referrer">` : ""}</div>
        <div class="sl-info"><b>${esc(i.title)}</b><small>${esc(i.sourceName || "")} · ${money(i.price)}</small>
          <textarea data-note="${esc(i.id)}" rows="2" placeholder="Why it's here / which chapter…">${esc(shortlist[i.id].note || "")}</textarea></div>
        <button type="button" class="br-x" data-star="${esc(i.id)}" aria-label="Remove">×</button>
      </div>`).join("")}</div>`).join("")
      : `<p class="br-empty small">Star products to shortlist them. Notes you add here go into the export.</p>`;
  }
  function toggleStar(id) {
    if (shortlist[id]) delete shortlist[id];
    else { const item = all().find(i => i.id === id); shortlist[id] = { note: "", at: Date.now(), item }; }
    syncShortlist(); render();
  }

  /* ---------------- export to issue.js shape ---------------- */
  const slug = (s, n = 40) => String(s).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, n).replace(/-$/, "");
  function exportJSON() {
    const byId = new Map(all().map(i => [i.id, i]));
    const products = {}, retailers = {};
    Object.entries(shortlist).forEach(([id, s]) => {
      const i = byId.get(id) || s.item; if (!i) return;
      const rid = slug(i.sourceName || i.source);
      retailers[rid] = retailers[rid] || { name: i.sourceName || i.source, freeShipOver: 0, returns: i.returns || "Check retailer" };
      const key = `${i.side === "this" ? "h" : "m"}-${slug(i.brand || i.sourceName || "x", 12)}-${slug(i.title).split("-").slice(0, 3).join("-")}`;
      products[key] = {
        kind: i.kind || (i.side === "this" ? "hammer" : "mirror"),
        type: i.type, angle: i.angle,
        brand: i.brand || i.sourceName, name: i.title, short: (typeOf(i.type)?.label || i.title).replace(/s$/, ""),
        price: i.price, retailer: rid, url: i.url, image: i.image,
        shipping: i.shipping || "See retailer for shipping", returns: i.returns || "See retailer for returns",
        rating: i.rating, reviews: i.reviewCount,
        specs: {}, highlights: [],
        aiNote: s.note || "",
        description: i.description
      };
    });
    return JSON.stringify({ retailers, products }, null, 2);
  }

  /* ---------------- paste a link ---------------- */
  $("#import-form").addEventListener("submit", async e => {
    e.preventDefault();
    const url = $("#import-url").value.trim(), out = $("#import-result");
    out.innerHTML = `<p class="br-reading">Reading the page…</p>`;
    try {
      const r = await fetch(`/api/import?pairing=${encodeURIComponent(PAIRING)}&url=${encodeURIComponent(url)}`);
      const j = await r.json().catch(() => ({ error: r.status === 404 ? "The import function isn't deployed here. Open the catalog on your Vercel site." : "Unexpected answer" }));
      if (!r.ok || !j.item) throw new Error(j.error || "Couldn't read that page");
      const it = { ...j.item, id: "m-" + Date.now().toString(36) };
      if (!j.matched) { it.side = it.side || "this"; it.type = it.type || "unsorted"; it.angle = it.angle || "everyday"; }
      out.innerHTML = `<div class="br-preview">${card(it)}<div class="br-preview-side">
          ${j.matched ? `<p>Filed under <b>${esc(typeOf(it.type)?.label)}</b> · ${esc(angleLabel(it.angle))}.</p>` : `<p class="warn">This doesn't look like a ${esc(brief.this.toLowerCase().replace(/s$/, ""))} or ${esc(brief.that.toLowerCase().replace(/s$/, ""))}. Add it anyway?</p>`}
          <button type="button" id="import-add">Add to catalog</button></div></div>`;
      $("#import-add").onclick = () => { manual.unshift(it); store.set("manual", manual); out.innerHTML = `<p class="br-reading">Added: ${esc(it.title)}</p>`; $("#import-url").value = ""; buildFilters(); render(); };
    } catch (err) { out.innerHTML = `<p class="br-error">${esc(err.message)}</p>`; }
  });

  /* ---------------- events ---------------- */
  document.addEventListener("click", e => {
    const t = e.target;
    const side = t.closest("[data-side]"); if (side) { f.side = side.dataset.side; f.types.clear(); shown = PAGE; buildFilters(); render(); return; }
    const ty = t.closest("[data-type]"); if (ty) { const id = ty.dataset.type; f.types.has(id) ? f.types.delete(id) : f.types.add(id); ty.classList.toggle("on"); shown = PAGE; render(); return; }
    const an = t.closest("[data-angle]"); if (an) { const id = an.dataset.angle; f.angles.has(id) ? f.angles.delete(id) : f.angles.add(id); an.classList.toggle("on"); shown = PAGE; render(); return; }
    const st = t.closest("[data-star]"); if (st) { toggleStar(st.dataset.star); return; }
    if (t.closest(".br-shortlist-btn")) { const d = $("#drawer"); d.hidden = !d.hidden; t.closest("button").setAttribute("aria-expanded", !d.hidden); return; }
    if (t.closest("#drawer-close")) { $("#drawer").hidden = true; return; }
  });
  document.addEventListener("input", e => {
    const n = e.target.closest("[data-note]"); if (n) { shortlist[n.dataset.note].note = n.value; store.set("shortlist", shortlist); return; }
    if (e.target.id === "f-q") { f.q = e.target.value; shown = PAGE; render(); }
    if (e.target.id === "f-min") { f.min = e.target.value; render(); }
    if (e.target.id === "f-max") { f.max = e.target.value; render(); }
  });
  $("#f-source").addEventListener("change", e => { f.source = e.target.value; render(); });
  $("#f-sort").addEventListener("change", e => { f.sort = e.target.value; render(); });
  $("#more").addEventListener("click", () => { shown += PAGE; render(); });
  $("#clear").addEventListener("click", () => { if (confirm("Clear the whole shortlist?")) { shortlist = {}; syncShortlist(); render(); } });
  $("#export").addEventListener("click", () => { $("#export-text").value = exportJSON(); $("#export-dlg").showModal(); });
  $("#dlg-close").addEventListener("click", () => $("#export-dlg").close());
  $("#copy").addEventListener("click", async () => { try { await navigator.clipboard.writeText($("#export-text").value); $("#copy").textContent = "Copied ✓"; } catch (e) { $("#export-text").select(); } });
  $("#download").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([$("#export-text").value], { type: "application/json" }));
    a.download = `${PAIRING}-shortlist.json`; a.click(); URL.revokeObjectURL(a.href);
  });

  load();
})();
