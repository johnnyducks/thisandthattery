/*
 * Renders sponsor.html?brand=<id> from window.TT_SPONSORS (js/sponsors.js).
 */
(function () {
  const S = window.TT_SPONSORS || { brands: {} };
  const id = new URLSearchParams(location.search).get("brand") || S.active;
  const b = S.brands[id];
  const root = document.getElementById("sponsor");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = n => "$" + (Number.isInteger(n) ? n : n.toFixed(2));

  if (!b) { root.innerHTML = `<main class="sp-missing"><h1>No collection here.</h1><p><a href="index.html">Back to the issue →</a></p></main>`; return; }

  document.title = `${b.title} · This & Thattery`;
  document.documentElement.style.setProperty("--sp-accent", b.accent || "#2F5D50");
  const label = b.paid ? `Sponsored by ${b.name}` : "Featured brand";
  const disclosure = b.paid
    ? `This collection is sponsored by ${b.name}, who paid This & Thattery to feature it. Product selection and descriptions follow our editorial standards. Links may also earn us an affiliate commission.`
    : `${b.name} did not pay for this page. We chose these products editorially. Links may earn us an affiliate commission at no extra cost to you.`;

  const tilt = i => [-4, 3, -2, 5, -3, 2, -5, 4][i % 8];
  const card = (p, i) => `
    <figure class="box sp-item" style="--tilt:${tilt(i)}deg">
      <div class="box-3d">
        <div class="box-face photo"><img src="${esc(p.image)}" alt="${esc(b.name + " " + p.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer"></div>
        <span class="box-corner tl"></span><span class="box-corner tr"></span><span class="box-corner bl"></span><span class="box-corner br"></span>
      </div>
      <div class="tag"><span class="tag-hole"></span><b>${money(p.price)}</b><small>${esc(p.tag || "")}</small></div>
      <figcaption>
        <span class="cap-brand">${esc(b.name)}</span>
        <span class="cap-name">${esc(p.name)}</span>
        <span class="sp-note">${esc(p.note || "")}</span>
        ${p.aside ? `<span class="aside-other">${esc(p.aside)}</span>` : ""}
        <span class="cap-actions"><a class="btn-shop" href="${esc(p.url)}" target="_blank" rel="sponsored noopener">Shop at ${esc(b.name)} <span aria-hidden="true">→</span></a></span>
      </figcaption>
    </figure>`;

  root.innerHTML = `
    <header class="sp-hero" id="top">
      <div class="sp-badge">${esc(label)}</div>
      <div class="sp-kicker">${esc(b.kicker || "The Collection")}</div>
      <h1>${esc(b.title)}</h1>
      <p class="sp-dek">${esc(b.dek || "")}</p>
      <div class="sp-terms">
        <span><small>Ships</small>${esc(b.terms?.shipping || "See retailer")}</span>
        <span><small>Returns</small>${esc(b.terms?.returns || "See retailer")}</span>
        <span><small>Pieces</small>${b.products.length}</span>
      </div>
      ${window.TT_SHARE ? `<p class="sp-share">${TT_SHARE.button("brand-" + id, "share this collection")}</p>` : ""}
    </header>
    <main class="sp-main">
      <section class="sp-intro"><p>${esc(b.intro || "")}</p>
        <a class="sp-visit" href="${esc(b.url)}" target="_blank" rel="sponsored noopener">Visit ${esc(b.name)} →</a></section>
      <section class="sp-grid" aria-label="${esc(b.name)} products">${b.products.map(card).join("")}</section>
      <aside class="sp-disclosure"><b>${b.paid ? "Sponsored content" : "About this page"}</b>${esc(disclosure)}</aside>
      <p class="sp-back"><a href="index.html">← Back to Issue 01: Hammers &amp; Mirrors</a></p>
    </main>
    <section id="newsletter"></section>
    <footer class="foot"><div class="tt">TT</div><p>This &amp; Thattery is reader-supported. When you buy through links on this page we may earn an affiliate commission, at no extra cost to you.</p></footer>`;

  TT_SITE.nav({ alwaysShow: true, links: [{ href: "index.html", label: "← The issue" }, { href: "#top", html: `${esc(b.name)} <em>${b.paid ? "Sponsored" : "Featured"}</em>` }] });
  TT_SITE.newsletter(document.getElementById("newsletter"), { source: "sponsor:" + id });
})();
