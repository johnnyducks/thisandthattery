(function () {
  const I = window.TT_ISSUE, P = I.products, R = I.retailers;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const money = n => "$" + (Number.isInteger(n) ? n : n.toFixed(2));

  /* ---------------- kit state (per-viewer convenience) ---------------- */
  const KEY = "tt-kit-" + I.id;
  let kit = [];
  try {
    const x = JSON.parse(localStorage.getItem(KEY + "-ext") || "{}");   // items from marketplace modules
    Object.assign(R, x.retailers || {}); Object.assign(P, x.products || {});
    kit = JSON.parse(localStorage.getItem(KEY) || "[]").filter(id => P[id]);
  } catch (e) { kit = []; }
  const saveKit = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(kit));
      const ext = { products: {}, retailers: {} };
      kit.filter(id => P[id].external).forEach(id => { ext.products[id] = P[id]; ext.retailers[P[id].retailer] = R[P[id].retailer]; });
      localStorage.setItem(KEY + "-ext", JSON.stringify(ext));
    } catch (e) {}
  };
  const listeners = [];
  // real product photo when we have one, otherwise the placeholder poster art
  const photo = p => `<img src="${p.image}" alt="${(p.brand + " " + p.name).replace(/"/g, "&quot;")}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
  const art = p => p.image ? photo(p) : p.art ? TT_ART.render(p) : `<span class="swatch-x">${p.brand.slice(0, 1)}</span>`;
  const swatch = art;

  /* ---------------- tokens ---------------- */
  function field(id, path) {
    const p = P[id]; if (!p) return "";
    if (path === "price") return money(p.price);
    if (path === "retailer") return R[p.retailer].name;
    if (path === "rating") return p.rating ? `${p.rating}★${p.reviews ? ` <small>(${p.reviews.toLocaleString()})</small>` : ""}` : "Not rated";
    return path.split(".").reduce((o, k) => (o == null ? o : o[k]), p) ?? "";
  }
  function fill(str) {
    return str
      .replace(/\{\{([\w-]+)\.([\w. ]+)\}\}/g, (_, id, path) => field(id, path))
      .replace(/\[\[([\w-]+)(?:\|([^\]]+))?\]\]/g, (_, id, label) => {
        const p = P[id]; if (!p) return label || id;
        return `<a class="chip" href="#p-${id}" data-jump="${id}">${label || p.brand + " " + p.short}<span class="chip-price">${money(p.price)}</span></a>`;
      });
  }

  /* ---------------- components ---------------- */
  const anchored = new Set(); // first appearance of each product gets the #p-id anchor
  const stars = r => "★★★★★".slice(0, Math.round(r)) + "☆☆☆☆☆".slice(0, 5 - Math.round(r));

  function box(id, opts = {}) {
    const p = P[id], tilt = opts.tilt ?? 0, size = opts.size || "";
    const first = !anchored.has(id); anchored.add(id);
    return `<figure class="box ${size} ${p.kind}" ${first ? `id="p-${id}"` : ""} data-id="${id}" style="--tilt:${tilt}deg">
      <div class="box-3d">
        <div class="box-face ${p.image ? "photo" : ""}">${art(p)}</div>
        <span class="box-corner tl"></span><span class="box-corner tr"></span><span class="box-corner bl"></span><span class="box-corner br"></span>
      </div>
      <div class="tag"><span class="tag-hole"></span><b>${money(p.price)}</b><small>${p.tag || p.shipping.split(",")[0]}</small></div>
      <figcaption>
        <span class="cap-brand">${p.brand}</span>
        <span class="cap-name">${p.name}</span>
        ${p.aside ? `<span class="aside-other">${p.aside}</span>` : ""}
        <span class="cap-meta">${p.rating ? `<span class="stars" aria-label="${p.rating} stars">${stars(p.rating)}</span> ${p.rating}${p.reviews ? ` · ${p.reviews.toLocaleString()} reviews` : ""}` : `Sold by ${R[p.retailer].name}`}</span>
        <span class="cap-actions">
          <a class="btn-shop" href="${p.url}" rel="sponsored noopener" target="_blank">Shop at ${R[p.retailer].name} <span aria-hidden="true">→</span></a>
          <button class="btn-kit" data-kit="${id}" aria-pressed="false"><span class="plus">+</span><span class="lbl">Add to kit</span></button>
        </span>
      </figcaption>
    </figure>`;
  }

  function deepDive(id) {
    const p = P[id];
    return `<div class="dive">
      <div class="dive-head">Deep dive · ${p.brand}</div>
      <dl>${Object.entries(p.specs).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
      ${p.specAside ? `<p class="aside-other in-spec">${p.specAside}</p>` : ""}
      <ul class="dive-hi">${p.highlights.map(h => `<li>${h}</li>`).join("")}</ul>
      <p class="ai-note"><span class="label">Analyst's note</span>${p.aiNote}</p>
    </div>`;
  }

  const blocks = {
    prose: b => `<div class="prose ${b.dropcap ? "dropcap" : ""} ${b.html.length > 520 ? "cols" : ""}"><p>${fill(b.html)}</p></div>`,

    feature: b => `<div class="feature side-${b.side}">
        ${box(b.product, { tilt: b.tilt, size: "lg" })}
        <div class="feature-text">${fill(b.html)}${deepDive(b.product)}</div>
      </div>`,

    pullquote: b => `<blockquote class="pull"><p>${fill(b.text)}</p><cite>${b.cite}</cite></blockquote>`,

    specimen: b => {
      const p = P[b.product];
      return `<div class="specimen">
        <div class="specimen-label">Plate ${I.number}-A · Specimen: ${p.brand} ${p.short}</div>
        <div class="specimen-stage"><div class="specimen-anchor">
          ${box(b.product, { size: "xl" })}
          ${b.callouts.map((c, i) => `<div class="callout c-${c.side}" style="--x:${c.x};--y:${c.y}"><span class="pin">${i + 1}</span><div class="callout-card"><b>${c.label}</b>${fill(c.text)}</div></div>`).join("")}
        </div></div>
        ${deepDive(b.product)}
      </div>`;
    },

    duel: b => {
      const [a, c] = b.products;
      return `<div class="duel">
        <div class="duel-corner l">${box(a, { tilt: -4 })}</div>
        <div class="duel-mid">
          <div class="duel-vs">VS.</div>
          <table>
            <thead><tr><th>${P[a].brand}</th><th></th><th>${P[c].brand}</th></tr></thead>
            <tbody>${b.rows.map(([label, fa, fc]) => `<tr><td>${field(a, fa)}</td><th>${label}</th><td>${field(c, fc)}</td></tr>`).join("")}</tbody>
          </table>
          <p class="verdict"><span class="label">The verdict</span>${fill(b.verdict)}</p>
        </div>
        <div class="duel-corner r">${box(c, { tilt: 4 })}</div>
      </div>`;
    },

    pair: b => `<div class="pair">
        <div class="pair-a">${box(b.products[0], { tilt: -6 })}</div>
        <div class="pair-text">${fill(b.html)}</div>
        <div class="pair-b">${box(b.products[1], { tilt: 5, size: "lg" })}</div>
      </div>`,

    ticket: b => {
      const p = P[b.product], r = R[p.retailer];
      return `<div class="ticket">
        <div class="ticket-stub">FINE<br>PRINT</div>
        <div class="ticket-body">
          <div class="ticket-title">${p.brand} ${p.short}, read before you swing</div>
          <div class="ticket-grid">
            <div><small>Ships</small>${p.shipping}</div>
            <div><small>Returns</small>${p.returns}</div>
            <div><small>Sold by</small>${r.name}</div>
            <div><small>Price</small>${money(p.price)}</div>
          </div>
        </div>
        <div class="ticket-punch">No. ${String([...b.product].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 1e6, 7)).padStart(6, "0")}</div>
      </div>`;
    },

    collage: b => `<div class="collage">${b.products.map((id, i) => `<div class="collage-${i}">${box(id, { tilt: [-5, 7, -3, 9][i % 4], size: i === 0 ? "tall" : "" })}</div>`).join("")}
      <div class="collage-stamp">ALWAYS<br>FOR<br>SALE</div></div>`
  };

  /* ---------------- page ---------------- */
  function cover() {
    const hero = I.hero || [Object.keys(P).find(k => P[k].kind === "hammer"), Object.keys(P).find(k => P[k].kind === "mirror")];
    return `<header class="cover" id="top">
      <div class="crop tl"></div><div class="crop tr"></div><div class="crop bl"></div><div class="crop br"></div>
      <div class="masthead">
        <span class="issue">Vol. ${I.volume} · No. ${I.number}</span>
        <a class="logo" href="#top" aria-label="This & Thattery home"><span class="tt">TT</span></a>
        <span class="issue">${I.date} · 10¢</span>
      </div>
      <div class="wordmark">THIS &amp; THATTERY</div>
      <nav class="nav"><a href="#objects">Objects</a><i>/</i><a href="#stories">Stories</a><i>/</i><a href="#kit">Shop</a>${window.TT_SPONSORS?.active ? `<i>/</i><a href="sponsor.html?brand=${TT_SPONSORS.active}">Brands</a>` : ""}</nav>
      <div class="cover-main">
        <div class="cover-box a">${box(hero[0], { tilt: -8, size: "lg" })}</div>
        <div class="cover-title">
          <div class="cover-kicker">This issue's quirky pairing</div>
          <h1><span>${I.this}</span><em>&amp;</em><span>${I.that}</span></h1>
          <p class="cover-line">${I.coverLine}</p>
          <p class="cover-sub">${I.coverSub}</p>
          <a class="cta" href="#stories">Explore TT <span>→</span></a>
        </div>
        <div class="cover-box b">${box(hero[1], { tilt: 7, size: "lg" })}</div>
      </div>
      <div class="cover-lines">
        ${I.chapters.filter(c => !c.module).map(c => `<a href="#ch-${c.id}"><b>${c.numeral}.</b> ${c.title}</a>`).join("")}
      </div>
    </header>`;
  }

  function ticker() {
    const items = Object.values(P).map(p => `<span>${p.brand} ${p.short} <b>${money(p.price)}</b> · ${p.shipping}</span>`);
    return `<div class="ticker" id="objects" aria-label="Everything in this issue"><div class="ticker-track">${items.join("<i>✦</i>")}<i>✦</i>${items.join("<i>✦</i>")}<i>✦</i></div></div>`;
  }

  function chapter(c, i) {
    if (c.module) return `<section class="interstitial" id="ch-${c.id}" data-module="${c.id}"></section>`;
    return `<section class="chapter ${i % 2 ? "alt" : ""}" id="ch-${c.id}" data-ch="${c.id}">
      <header class="chapter-head">
        <div class="chapter-num">${c.numeral}</div>
        <div><div class="chapter-kicker">${c.kicker}</div><h2>${c.title}</h2><p class="dek">${c.dek}</p></div>
      </header>
      ${c.blocks.map(b => blocks[b.type](b)).join("")}
    </section>`;
  }

  function kitSection() {
    return `<section class="kit-final" id="kit">
      <header class="chapter-head">
        <div class="chapter-num">✦</div>
        <div><div class="chapter-kicker">Epilogue</div><h2>The Toolbox</h2><p class="dek">Everything from the story, sorted by shop, with the shipping math done. Tick what you want.</p></div>
      </header>
      <div class="kit-grid">
        <ol class="kit-list">${Object.entries(P).filter(([, p]) => !p.external).map(([id, p]) => `
          <li>
            <label class="kit-row">
              <input type="checkbox" data-kit-check="${id}">
              <span class="kit-swatch">${swatch(p)}</span>
              <span class="kit-info"><b>${p.brand} ${p.name}</b><small>${R[p.retailer].name} · ${p.shipping} · ${p.returns}</small></span>
              <span class="kit-price">${money(p.price)}</span>
            </label>
          </li>`).join("")}
        </ol>
        <aside class="kit-receipt" aria-live="polite"></aside>
      </div>
    </section>`;
  }


  function tray() {
    return `<div class="tray" data-open="false">
      <button class="tray-btn" aria-expanded="false"><span class="tray-icon">⚒</span><span class="tray-label">Your kit</span><span class="tray-count">0</span><span class="tray-total"></span></button>
      <div class="tray-panel" role="region" aria-label="Your kit"></div>
    </div>`;
  }

  const app = $("#app");
  const SP = window.TT_SPONSORS, spon = SP && SP.brands[SP.active];
  const sponsorLink = spon ? { href: `sponsor.html?brand=${SP.active}`, label: spon.name, kicker: spon.paid ? "Sponsor" : "Featured" } : null;
  app.innerHTML = cover() + ticker() + `<main id="stories">${I.chapters.map(chapter).join("")}${kitSection()}</main>` +
    `<section id="newsletter"></section>` +
    `<footer class="foot"><div class="tt">TT</div>${sponsorLink ? `<p class="foot-sponsor"><a href="${sponsorLink.href}">${spon.paid ? "Sponsored by" : "Featured brand:"} <b>${spon.name}</b>. See the collection →</a></p>` : ""}<p class="aside-other foot-aside">No mirrors were struck in the making of this issue.</p><p>This &amp; Thattery is reader-supported. When you buy through links on this page we may earn an affiliate commission, at no extra cost to you. Prices, shipping and return terms were accurate when the issue went to press. Check the retailer before you buy.</p><p class="fine">Issue ${I.number}: ${I.this} &amp; ${I.that}.${I.asOf ? ` Prices and terms checked ${I.asOf}.` : ""}${I.sample ? " Product data shown is sample content." : ""}</p></footer>` +
    tray();

  /* ---------------- kit rendering ---------------- */
  function groups() {
    const g = {};
    kit.forEach(id => { const r = P[id].retailer; (g[r] = g[r] || []).push(id); });
    return Object.entries(g).map(([rid, ids]) => {
      const r = R[rid], sub = ids.reduce((s, id) => s + P[id].price, 0);
      const need = r.freeShipOver ? Math.max(0, r.freeShipOver - sub) : 0;
      return { rid, r, ids, sub, need, pct: r.freeShipOver ? Math.min(100, (sub / r.freeShipOver) * 100) : 100 };
    });
  }

  function receiptHTML(compact) {
    if (!kit.length) return `<p class="empty">Your kit is empty. Tap <b>+ Add to kit</b> on anything in the story. Everything pictured is for sale.</p>`;
    const gs = groups(), total = gs.reduce((s, g) => s + g.sub, 0);
    return gs.map(g => `<div class="rcpt-shop">
        <div class="rcpt-shop-head"><b>${g.r.name}</b><span>${money(+g.sub.toFixed(2))}</span></div>
        ${g.ids.map(id => `<div class="rcpt-item"><span>${P[id].brand} ${P[id].short}</span><span>${money(P[id].price)}</span><button data-kit="${id}" aria-label="Remove ${P[id].short}">×</button></div>`).join("")}
        ${g.r.perItemShipping || !g.r.freeShipOver ? "" : `<div class="ship-bar"><i style="width:${g.pct}%"></i></div>`}
        <div class="ship-note">${g.r.perItemShipping ? `Shipping varies by seller` : !g.r.freeShipOver ? (g.r.shippingNote || "Shipping calculated at checkout") : g.need > 0 ? `Add <b>${money(+g.need.toFixed(2))}</b> more for free shipping` : `✓ Ships free`} · ${g.r.returns}</div>
        ${compact ? "" : `<a class="btn-shop" href="#" rel="sponsored noopener">Check out at ${g.r.name} →</a>`}
      </div>`).join("") + `<div class="rcpt-total"><span>Total</span><b>${money(+total.toFixed(2))}</b></div>
      ${compact ? `<a class="btn-shop wide" href="#kit">Review your toolbox →</a>` : ""}`;
  }

  function syncKit() {
    saveKit();
    $$("[data-kit]").forEach(b => {
      if (!b.classList.contains("btn-kit")) return;
      const on = kit.includes(b.dataset.kit);
      b.setAttribute("aria-pressed", on); b.classList.toggle("on", on);
      $(".lbl", b).textContent = on ? "In your kit" : "Add to kit";
      $(".plus", b).textContent = on ? "✓" : "+";
    });
    $$("[data-kit-check]").forEach(c => c.checked = kit.includes(c.dataset.kitCheck));
    const total = kit.reduce((s, id) => s + P[id].price, 0);
    $(".tray-count").textContent = kit.length;
    $(".tray-total").textContent = kit.length ? money(+total.toFixed(2)) : "";
    $(".tray").classList.toggle("has", kit.length > 0);
    $(".tray-panel").innerHTML = `<div class="tray-head">Your kit <small>${kit.length} item${kit.length === 1 ? "" : "s"}</small></div>` + receiptHTML(true);
    $(".kit-receipt").innerHTML = `<div class="rcpt-head">RECEIPT<small>This &amp; Thattery · No. ${I.number}</small></div>` + receiptHTML(false);
    listeners.forEach(fn => fn(kit));
  }

  function toggle(id, force) {
    const has = kit.includes(id), want = force ?? !has;
    if (want && !has) kit.push(id);
    if (!want && has) kit = kit.filter(k => k !== id);
    syncKit();
    if (want && !has) { const t = $(".tray-btn"); t.classList.remove("bump"); void t.offsetWidth; t.classList.add("bump"); }
  }

  document.addEventListener("click", e => {
    const k = e.target.closest("[data-kit]");
    if (k) { e.preventDefault(); toggle(k.dataset.kit); return; }
    const t = e.target.closest(".tray-btn");
    if (t) { const tr = $(".tray"), open = tr.dataset.open !== "true"; tr.dataset.open = open; t.setAttribute("aria-expanded", open); return; }
    if (!e.target.closest(".tray")) { $(".tray").dataset.open = "false"; $(".tray-btn").setAttribute("aria-expanded", "false"); }
    const j = e.target.closest("[data-jump]");
    if (j) {
      const el = document.getElementById("p-" + j.dataset.jump);
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
    }
  });
  document.addEventListener("change", e => { const c = e.target.closest("[data-kit-check]"); if (c) toggle(c.dataset.kitCheck, c.checked); });

  /* ---------------- 3D tilt: boxes lean toward the cursor ---------------- */
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (fine && !still) {
    $$(".box").forEach(b => {
      const inner = $(".box-3d", b);
      b.addEventListener("pointermove", e => {
        const r = inner.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        inner.style.setProperty("--rx", (-y * 10).toFixed(2) + "deg");
        inner.style.setProperty("--ry", (x * 12).toFixed(2) + "deg");
      });
      b.addEventListener("pointerleave", () => { inner.style.setProperty("--rx", "0deg"); inner.style.setProperty("--ry", "0deg"); });
    });
  }

  /* ---------------- reveal ---------------- */
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -10% 0px" });
  $$(".box, .prose, .pull, .ticket, .dive, .duel-mid, .chapter-head").forEach(el => { el.classList.add("rv"); io.observe(el); });

  const coverIO = new IntersectionObserver(([en]) => document.body.classList.toggle("past-cover", !en.isIntersecting));
  coverIO.observe($(".cover .nav"));   // the thin nav bar appears once the masthead nav scrolls away

  /* ---------------- public kit API (used by marketplace modules) ---------------- */
  window.TT_KIT = {
    has: id => kit.includes(id),
    toggle: id => P[id] && toggle(id),
    onChange: fn => listeners.push(fn),
    toggleExternal(product, retailer) {
      if (!R[product.retailer]) R[product.retailer] = retailer;
      if (!P[product.id]) P[product.id] = product;
      toggle(product.id);
    }
  };

  /* ---------------- interstitial modules ---------------- */
  I.chapters.filter(c => c.module).forEach(c => {
    const el = document.querySelector(`[data-module="${c.id}"]`);
    if (el && window.TT_MARKET) {
      const m = TT_MARKET.mount(el, { id: c.id, ...c.module });
      if (c.module.platform === "ebay") window.TT_SWAP = q => m.search(q);   // site search hands queries to the Swap Meet
    }
  });
  // content is rendered by script, so honour #anchors (e.g. index.html?swap=…#ch-swapmeet) after it exists
  if (location.hash) requestAnimationFrame(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView());

  /* ---------------- site chrome: sticky nav + newsletter ---------------- */
  if (window.TT_SITE) {
    TT_SITE.nav({
      sponsor: sponsorLink,
      links: [
        ...I.chapters.filter(c => !c.module).map(c => ({ href: `#ch-${c.id}`, id: `ch-${c.id}`, html: `<b>${c.numeral}</b><span>${c.title}</span>` })),
        { href: "#kit", id: "kit", html: `<b>✦</b><span>Toolbox</span>` }
      ]
    });
    TT_SITE.newsletter(document.getElementById("newsletter"), { source: "issue-" + I.number });
  }

  syncKit();
})();
