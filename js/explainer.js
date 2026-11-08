/*
 * The Hammer, Explained: prototype of the educational issue format.
 * Figures are drawn in code (SVG) so they can animate with the scroll and stay
 * crisp; product shelves reuse the issue's 3D product frames.
 *
 * Visual rule: anything with a price tag is for sale; anything with "Fig." is for learning.
 */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const P = (window.TT_ISSUE || {}).products || {};
  const R = (window.TT_ISSUE || {}).retailers || {};
  const money = n => "$" + (Number.isInteger(n) ? n : n.toFixed(2));
  const fmt = (n, d = 0) => n.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
  const svg = (w, h, inner, cls = "") => `<svg class="${cls}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img">${inner}</svg>`;
  const mount = (id, html) => { const el = document.getElementById(id); if (el) el.insertAdjacentHTML("afterbegin", html); return el; };

  /* ------------------------------------------------------------------
     Fig. 1: anatomy, exploded → assembled, part highlighted per step
     ------------------------------------------------------------------ */
  const anatomy = svg(560, 600, `
    <defs><pattern id="grain" width="10" height="40" patternUnits="userSpaceOnUse"><path d="M3 0 q3 20 0 40 M7 0 q-2 20 1 40" stroke="currentColor" stroke-opacity=".25" fill="none"/></pattern></defs>
    <g class="part" data-part="handle">
      <path d="M232 160 L268 160 L273 410 Q276 520 263 552 L237 552 Q224 520 227 410 Z" class="fill"/>
      <path d="M232 160 L268 160 L273 410 Q276 520 263 552 L237 552 Q224 520 227 410 Z" fill="url(#grain)"/>
      <path d="M228 470 Q250 462 272 470" class="hint"/>
    </g>
    <g class="part" data-part="wedge"><path d="M244 62 L256 62 L253 98 L247 98 Z" class="fill"/></g>
    <g class="part head" data-part="cheek"><rect x="200" y="80" width="100" height="80" rx="6" class="fill"/><rect x="232" y="80" width="36" height="80" class="hidden-line"/></g>
    <g class="part head" data-part="neck"><path d="M112 96 L200 104 L200 136 L112 144 Z" class="fill"/></g>
    <g class="part head" data-part="face"><path d="M112 86 L86 86 Q70 120 86 154 L112 154 Z" class="fill"/></g>
    <g class="part head" data-part="claw">
      <path d="M300 86 C350 82 402 94 448 132 L437 142 C398 112 352 104 300 108 Z" class="fill"/>
      <path d="M300 130 C344 128 386 140 422 166 L411 174 C378 150 340 144 300 152 Z" class="fill"/>
    </g>
    <g class="labels">
      <g data-label="face"><line x1="78" y1="120" x2="40" y2="210"/><text x="18" y="230">Face</text></g>
      <g data-label="neck"><line x1="156" y1="100" x2="140" y2="40"/><text x="112" y="32">Neck</text></g>
      <g data-label="cheek"><line x1="215" y1="150" x2="150" y2="250"/><text x="96" y="272">Cheek</text></g>
      <g data-label="wedge"><line x1="256" y1="84" x2="300" y2="34"/><text x="304" y="30">Wedge · Eye</text></g>
      <g data-label="claw"><line x1="430" y1="134" x2="470" y2="220"/><text x="446" y="242">Claw</text></g>
      <g data-label="handle"><line x1="272" y1="250" x2="370" y2="300"/><text x="378" y="306">Throat</text><line x1="272" y1="500" x2="370" y2="500"/><text x="378" y="506">Swell</text></g>
    </g>`, "anatomy");

  /* ------------------------------------------------------------------
     Fig. 2: four faces, four marks in pine
     ------------------------------------------------------------------ */
  function woodBlock(x, mark, label, sub) {
    const grain = Array.from({ length: 7 }, (_, i) => `<path d="M${x + 8} ${40 + i * 22} q60 ${i % 2 ? 8 : -8} 124 0" class="grain"/>`).join("");
    return `<g transform="translate(0,0)">
      <rect x="${x}" y="24" width="140" height="160" rx="4" class="pine"/>${grain}${mark}
      <text x="${x + 70}" y="214" class="cap" text-anchor="middle">${label}</text>
      <text x="${x + 70}" y="232" class="sub" text-anchor="middle">${sub}</text></g>`;
  }
  const cx = x => x + 70, cy = 104;
  const faces = svg(640, 250,
    woodBlock(10, `<circle cx="${cx(10)}" cy="${cy}" r="26" class="dent"/><circle cx="${cx(10)}" cy="${cy}" r="8" class="nail"/>`, "Smooth, flat", "a clean round dent") +
    woodBlock(170, `<clipPath id="mill"><circle cx="${cx(170)}" cy="${cy}" r="26"/></clipPath><circle cx="${cx(170)}" cy="${cy}" r="26" class="dent"/><g clip-path="url(#mill)">${Array.from({ length: 9 }, (_, i) => `<line x1="${cx(170) - 30 + i * 7}" y1="${cy - 30}" x2="${cx(170) - 30 + i * 7}" y2="${cy + 30}" class="hatch"/><line x1="${cx(170) - 30}" y1="${cy - 30 + i * 7}" x2="${cx(170) + 30}" y2="${cy - 30 + i * 7}" class="hatch"/>`).join("")}</g><circle cx="${cx(170)}" cy="${cy}" r="8" class="nail"/>`, "Milled (waffle)", "a checkerboard scar") +
    woodBlock(330, `<circle cx="${cx(330)}" cy="${cy}" r="8" class="nail"/><circle cx="${cx(330)}" cy="${cy}" r="12" class="faint"/>`, "Belled", "nail flush, barely a ring") +
    woodBlock(490, `<circle cx="${cx(490)}" cy="${cy}" r="8" class="nail"/>`, "Wood mallet", "no mark at all"), "faces");

  /* Fig. 3: dead-blow cutaway */
  const shot = Array.from({ length: 34 }, (_, i) => `<circle cx="${150 + (i % 9) * 13 + (Math.floor(i / 9) % 2) * 6}" cy="${72 + Math.floor(i / 9) * 12}" r="5" class="shot" style="--i:${i}"/>`).join("");
  const deadblow = svg(420, 220, `
    <rect x="186" y="128" width="30" height="86" rx="6" class="fill"/>
    <rect x="100" y="40" width="220" height="92" rx="22" class="shell"/>
    <rect x="128" y="56" width="164" height="60" rx="12" class="cavity"/>
    <g class="shotgrp">${shot}</g>
    <path d="M60 86 h30 m-10 -10 l10 10 l-10 10" class="arrow"/><text x="30" y="70" class="sub">swing</text>
    <text x="330" y="70" class="sub">shot lands</text><text x="330" y="86" class="sub">a beat late</text>`, "deadblow");

  /* ------------------------------------------------------------------
     Try it: energy (½mv²)
     ------------------------------------------------------------------ */
  function energyWidget(el) {
    el.insertAdjacentHTML("beforeend", `
      <label class="ctl"><span>Head weight <b data-o="oz"></b></span><input type="range" min="5" max="32" step="1" value="16" data-i="oz"></label>
      <label class="ctl"><span>Swing speed <b data-o="v"></b></span><input type="range" min="3" max="20" step="0.5" value="10" data-i="v"></label>
      <div class="readout"><b data-o="e"></b><span>joules delivered</span></div>
      <div class="cmp"><div class="cmp-row"><span>You</span><i data-o="bar"></i></div><div class="cmp-row ref"><span>16 oz at 10 m/s</span><i style="width:${22.7 / 181 * 100}%"></i></div></div>
      <div class="chart" data-o="chart"></div>`);
    const draw = () => {
      const oz = +$("[data-i=oz]", el).value, v = +$("[data-i=v]", el).value;
      const E = oz => v => 0.5 * oz * 0.02835 * v * v;
      const e = E(oz)(v);
      $("[data-o=oz]", el).textContent = `${oz} oz (${fmt(oz * 28.35)} g)`;
      $("[data-o=v]", el).textContent = `${v} m/s · ${fmt(v * 2.237)} mph`;
      $("[data-o=e]", el).textContent = fmt(e, 1);
      $("[data-o=bar]", el).style.width = Math.min(100, e / 181 * 100) + "%";
      const W = 360, H = 190, px = s => 40 + s / 20 * (W - 54), py = j => H - 26 - j / 181 * (H - 40);
      const curve = o => Array.from({ length: 41 }, (_, i) => { const s = i / 2; return `${i ? "L" : "M"}${px(s).toFixed(1)} ${py(E(o)(s)).toFixed(1)}`; }).join("");
      $("[data-o=chart]", el).innerHTML = svg(W, H, `
        ${[0, 50, 100, 150].map(j => `<line x1="40" x2="${W - 14}" y1="${py(j)}" y2="${py(j)}" class="gridl"/><text x="34" y="${py(j) + 4}" class="tick" text-anchor="end">${j}</text>`).join("")}
        ${[0, 5, 10, 15].map(s => `<text x="${px(s)}" y="${H - 8}" class="tick" text-anchor="middle">${s}</text>`).join("")}
        <text x="40" y="12" class="tick">joules</text><text x="${px(20)}" y="${H - 8}" class="tick" text-anchor="end">20 m/s</text>
        ${[[7, "7 oz"], [16, "16 oz"], [28, "28 oz"]].map(([o, l]) => `<path d="${curve(o)}" class="ref-curve"/><text x="${px(20) - 2}" y="${Math.max(14, py(E(o)(20)) - 4)}" class="tick" text-anchor="end">${l}</text>`).join("")}
        <path d="${curve(oz)}" class="cur-curve"/>
        <circle cx="${px(v)}" cy="${py(e)}" r="6" class="cur-dot"/>`, "plot");
    };
    $$("input", el).forEach(i => i.addEventListener("input", draw)); draw();
  }

  /* ------------------------------------------------------------------
     Try it: claw lever
     ------------------------------------------------------------------ */
  function leverWidget(el) {
    el.insertAdjacentHTML("beforeend", `
      <label class="ctl"><span>Handle length <b data-o="L"></b></span><input type="range" min="8" max="18" step="0.5" value="13" data-i="L"></label>
      <label class="ctl"><span>Nail's grip <b data-o="R"></b></span><input type="range" min="50" max="400" step="10" value="200" data-i="R"></label>
      <div class="readout"><b data-o="F"></b><span>lb from your hand</span></div>
      <div class="chart" data-o="fig"></div>
      <p class="tiny">Claw-to-pivot distance fixed at 1¼ in for this mockup.</p>`);
    const d = 1.25;
    const draw = () => {
      const L = +$("[data-i=L]", el).value, Rn = +$("[data-i=R]", el).value, F = Rn * d / L;
      $("[data-o=L]", el).textContent = `${L} in · ${fmt(L / d, 1)} : 1`;
      $("[data-o=R]", el).textContent = `${Rn} lb`;
      $("[data-o=F]", el).textContent = fmt(F, 0);
      const W = 360, H = 170, pivot = 92, unit = 14, claw = pivot - d * unit * 2.2, hand = pivot + L * unit * 1.25;
      const aw = n => Math.max(2, Math.min(18, n / 22));
      $("[data-o=fig]", el).innerHTML = svg(W, H, `
        <line x1="${claw}" y1="90" x2="${Math.min(hand, W - 10)}" y2="90" class="beam"/>
        <path d="M${pivot - 16} 128 L${pivot} 92 L${pivot + 16} 128 Z" class="fulcrum"/><text x="${pivot}" y="146" class="tick" text-anchor="middle">pivot (head)</text>
        <line x1="${claw}" y1="40" x2="${claw}" y2="84" class="force nail" style="stroke-width:${aw(Rn)}"/><path d="M${claw - 8} 50 L${claw} 36 L${claw + 8} 50" class="force-head nail"/>
        <text x="${claw}" y="26" class="tick" text-anchor="middle">nail ${Rn} lb</text>
        <line x1="${Math.min(hand, W - 10)}" y1="96" x2="${Math.min(hand, W - 10)}" y2="${96 + Math.max(16, F * 1.6)}" class="force hand" style="stroke-width:${aw(F * 6)}"/>
        <text x="${Math.min(hand, W - 10)}" y="${118 + Math.max(16, F * 1.6)}" class="tick" text-anchor="end">hand ${fmt(F)} lb</text>
        <text x="${(claw + pivot) / 2}" y="80" class="tick" text-anchor="middle">${d}"</text>
        <text x="${(pivot + Math.min(hand, W - 10)) / 2}" y="80" class="tick" text-anchor="middle">${L}"</text>`, "plot");
    };
    $$("input", el).forEach(i => i.addEventListener("input", draw)); draw();
  }

  /* ------------------------------------------------------------------
     Try it: picture-wire tension  T = W / (2 sin θ)
     ------------------------------------------------------------------ */
  function wireWidget(el) {
    el.insertAdjacentHTML("beforeend", `
      <label class="ctl"><span>Mirror weight <b data-o="W"></b></span><input type="range" min="5" max="60" step="1" value="30" data-i="W"></label>
      <label class="ctl"><span>Wire angle <b data-o="a"></b></span><input type="range" min="5" max="60" step="1" value="10" data-i="a"></label>
      <div class="readout"><b data-o="T"></b><span>lb pulling on each side of the wire</span></div>
      <div class="chart" data-o="fig"></div><div class="chart" data-o="curve"></div>`);
    const draw = () => {
      const Wt = +$("[data-i=W]", el).value, a = +$("[data-i=a]", el).value, rad = a * Math.PI / 180, T = Wt / (2 * Math.sin(rad));
      $("[data-o=W]", el).textContent = `${Wt} lb`; $("[data-o=a]", el).textContent = `${a}°`; $("[data-o=T]", el).textContent = fmt(T, 0);
      const Wd = 360, half = Math.min(120, 110 / Math.tan(rad)), h = half * Math.tan(rad), top = 130 - h, sw = Math.max(1.5, Math.min(12, T / 12));
      $("[data-o=fig]", el).innerHTML = svg(Wd, 220, `
        <line x1="20" y1="${top - 10}" x2="${Wd - 20}" y2="${top - 10}" class="wall"/>
        <path d="M172 ${top - 18} q8 2 8 12 q0 6 -6 8" class="hook"/>
        <line x1="${180 - half}" y1="130" x2="180" y2="${top}" class="wire" style="stroke-width:${sw}"/>
        <line x1="${180 + half}" y1="130" x2="180" y2="${top}" class="wire" style="stroke-width:${sw}"/>
        <rect x="${180 - half - 18}" y="126" width="${2 * half + 36}" height="84" rx="6" class="mirror"/>
        <path d="M${180 - half + 6} 140 l40 0 l-60 60" class="glint"/>
        <text x="${180 + half - 30}" y="122" class="tick" text-anchor="end">${a}°</text>`, "plot");
      const cw = 360, ch = 150, px = d => 36 + (d - 5) / 85 * (cw - 50), py = r => ch - 24 - Math.min(r, 6) / 6 * (ch - 40);
      const pts = Array.from({ length: 86 }, (_, i) => { const d = 5 + i; return `${i ? "L" : "M"}${px(d).toFixed(1)} ${py(1 / (2 * Math.sin(d * Math.PI / 180))).toFixed(1)}`; }).join("");
      $("[data-o=curve]", el).innerHTML = svg(cw, ch, `
        ${[0.5, 1, 2, 4, 6].map(r => `<line x1="36" x2="${cw - 14}" y1="${py(r)}" y2="${py(r)}" class="gridl"/><text x="30" y="${py(r) + 4}" class="tick" text-anchor="end">${r}×</text>`).join("")}
        ${[5, 30, 60, 90].map(d => `<text x="${px(d)}" y="${ch - 6}" class="tick" text-anchor="middle">${d}°</text>`).join("")}
        <line x1="${px(30)}" x2="${px(30)}" y1="${py(6)}" y2="${py(0.5)}" class="mark30"/><text x="${px(30) + 4}" y="${py(5.5)}" class="tick">30°: 1× the weight</text>
        <path d="${pts}" class="cur-curve"/><circle cx="${px(a)}" cy="${py(T / Wt)}" r="6" class="cur-dot"/>`, "plot");
    };
    $$("input", el).forEach(i => i.addEventListener("input", draw)); draw();
  }

  /* Fig. 5: studs + French cleat */
  const wall = svg(640, 290, `
    <text x="20" y="22" class="cap">Top view of a wall</text>
    <rect x="20" y="40" width="600" height="14" class="drywall"/>
    ${[0, 1, 2, 3].map(i => `<rect x="${60 + i * 160}" y="54" width="22" height="56" class="stud"/>`).join("")}
    ${[0, 1, 2].map(i => `<path d="M${71 + i * 160} 122 h160 m-6 -5 l6 5 l-6 5 m-148 -10 l-6 5 l6 5" class="dim"/><text x="${151 + i * 160}" y="140" class="tick" text-anchor="middle">16 in on center</text>`).join("")}
    <text x="20" y="176" class="cap">French cleat, side view</text>
    <g transform="translate(0,46)">
    <line x1="60" y1="150" x2="60" y2="236" class="wallline"/><text x="54" y="232" class="tick" text-anchor="end">wall</text>
    <path d="M62 236 L96 236 L96 218 L62 184 Z" class="wood"/>
    <path d="M64 180 L96 212 L128 212 L128 160 L64 160 Z" class="wood two"/>
    <line x1="130" y1="150" x2="130" y2="236" class="mirrorline"/><text x="136" y="232" class="tick">mirror back</text>
    <text x="230" y="196" class="sub">One strip screws into the wall, its twin to the mirror.</text>
    <text x="230" y="214" class="sub">The 45° bevels hook together, so the weight pulls</text>
    <text x="230" y="232" class="sub">the mirror in against the wall.</text></g>`, "wallfig");

  /* Fig. 4: handle matrix (HTML) */
  const dots = n => `<span class="dots" aria-label="${n} of 4">${"●".repeat(n)}${"○".repeat(4 - n)}</span>`;
  const handles = `<div class="matrix"><table>
    <thead><tr><th></th><th>Shock absorption</th><th>Durability</th><th>Handle replaceable</th><th>Feel</th></tr></thead>
    <tbody>
      <tr><th>Hickory</th><td>${dots(3)}</td><td>${dots(2)}</td><td>Yes</td><td>Warm, traditional</td></tr>
      <tr><th>Fiberglass</th><td>${dots(3)}</td><td>${dots(3)}</td><td>Rarely</td><td>Light, grippy</td></tr>
      <tr><th>Solid steel</th><td>${dots(1)}</td><td>${dots(4)}</td><td>No (one piece)</td><td>Solid, buzzy</td></tr>
    </tbody></table></div>`;

  /* ------------------------------------------------------------------
     Fig. 6: hammer spectrum from the catalog (real data)
     ------------------------------------------------------------------ */
  function grams(t) {
    let m;
    if ((m = t.match(/(\d+(?:\.\d+)?)\s*(?:oz|ounce)\b/i))) return +m[1] * 28.35;
    if ((m = t.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gr|gram|grams)\b/i))) return +m[1].replace(",", ".");
    if ((m = t.match(/(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound)\b/i))) return +m[1] * 453.6;
    return null;
  }
  async function spectrum(el) {
    const ROWS = [["claw", "Claw"], ["hammer", "Other / general"], ["smithing", "Blacksmith & forging"], ["specialty", "Specialty"], ["mallet", "Mallets"]];
    let items = [];
    try { items = (await (await fetch("catalog/data/hammers-mirrors.json")).json()).items; }
    catch (e) { el.insertAdjacentHTML("afterbegin", `<p class="tiny">Open this page from the website to load catalog data.</p>`); return; }
    const featured = Object.values(P).filter(p => p.kind === "hammer").map(p => p.url);
    const pts = items.filter(i => i.side === "this").map(i => ({ ...i, g: grams(i.title) })).filter(i => i.g && i.g > 50 && i.g < 5000);
    const W = 760, rowH = 54, top = 30, H = top + ROWS.length * rowH + 40, x0 = 170, x1 = W - 20;
    const lx = g => x0 + (Math.log10(g) - Math.log10(80)) / (Math.log10(4000) - Math.log10(80)) * (x1 - x0);
    let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const dotsSvg = pts.map(p => {
      const r = ROWS.findIndex(([id]) => id === p.type); if (r < 0) return "";
      const y = top + r * rowH + rowH / 2 + (rnd() - .5) * 26, hot = featured.includes(p.url);
      return `<circle cx="${lx(p.g).toFixed(1)}" cy="${y.toFixed(1)}" r="${hot ? 7 : 5}" class="sdot ${hot ? "hot" : ""}" data-t="${p.title.replace(/"/g, "&quot;")}" data-m="${Math.round(p.g)} g · ${p.price != null ? money(p.price) : "price n/a"} · ${p.sourceName}"/>`;
    }).join("");
    const ticks = [100, 200, 500, 1000, 2000].map(g => `<line x1="${lx(g)}" x2="${lx(g)}" y1="${top - 6}" y2="${H - 34}" class="gridl"/><text x="${lx(g)}" y="${H - 18}" class="tick" text-anchor="middle">${g >= 1000 ? g / 1000 + " kg" : g + " g"}</text>`).join("");
    const rows = ROWS.map(([, l], r) => `<text x="${x0 - 14}" y="${top + r * rowH + rowH / 2 + 4}" class="rowlab" text-anchor="end">${l}</text><line x1="${x0}" x2="${x1}" y1="${top + (r + 1) * rowH}" y2="${top + (r + 1) * rowH}" class="rowsep"/>`).join("");
    const marks = [[198, "7 oz"], [454, "16 oz"]].map(([g, l]) => `<text x="${lx(g)}" y="${top - 12}" class="tick hotlab" text-anchor="middle">${l}</text>`).join("");
    el.insertAdjacentHTML("afterbegin", `<div class="spec-wrap">${svg(W, H, ticks + rows + marks + dotsSvg, "spectrum")}<div class="tip" hidden></div></div>
      <p class="source">Source: This &amp; Thattery catalog, ${pts.length} hammers whose listing states a head weight (crawled Nov 2026). Log scale.</p>`);
    const tip = $(".tip", el), wrap = $(".spec-wrap", el);
    wrap.addEventListener("pointermove", e => {
      const d = e.target.closest(".sdot");
      if (!d) { tip.hidden = true; return; }
      const r = wrap.getBoundingClientRect();
      tip.hidden = false; tip.innerHTML = `<b>${d.dataset.t}</b><span>${d.dataset.m}</span>`;
      tip.style.left = Math.min(r.width - 220, e.clientX - r.left + 12) + "px"; tip.style.top = (e.clientY - r.top + 12) + "px";
    });
    wrap.addEventListener("pointerleave", () => tip.hidden = true);
  }

  /* ------------------------------------------------------------------
     Product shelves (commerce: 3D frames + price tags)
     ------------------------------------------------------------------ */
  function shelf(el) {
    const ids = el.dataset.shelf.split(",").filter(id => P[id]);
    el.innerHTML = `<div class="shelf-label"><span>On the shelf</span>${el.dataset.note || ""}</div><div class="shelf-row">${ids.map((id, i) => {
      const p = P[id];
      return `<figure class="box" style="--tilt:${[-3, 4, -2][i % 3]}deg">
        <div class="box-3d"><div class="box-face photo"><img src="${p.image}" alt="${p.brand} ${p.name}" loading="lazy" referrerpolicy="no-referrer"></div>
          <span class="box-corner tl"></span><span class="box-corner tr"></span><span class="box-corner bl"></span><span class="box-corner br"></span></div>
        <div class="tag"><span class="tag-hole"></span><b>${money(p.price)}</b><small>${p.tag || ""}</small></div>
        <figcaption><span class="cap-brand">${p.brand}</span><span class="cap-name">${p.name}</span>
          <span class="cap-actions"><a class="btn-shop" href="${p.url}" target="_blank" rel="sponsored noopener">Shop at ${(R[p.retailer] || {}).name || "retailer"} →</a></span></figcaption>
      </figure>`;
    }).join("")}</div>`;
  }

  /* ------------------------------------------------------------------
     mount + scrollytelling
     ------------------------------------------------------------------ */
  mount("fig-anatomy", anatomy);
  mount("fig-faces", faces);
  mount("fig-deadblow", deadblow);
  mount("fig-wall", wall);
  mount("fig-handles", handles);
  energyWidget($("#try-energy")); leverWidget($("#try-lever")); wireWidget($("#try-wire"));
  spectrum($("#fig-spectrum"));
  $$("[data-shelf]").forEach(shelf);

  // anatomy: each step sets the figure's state (step 0 = exploded, then highlight a part)
  const PARTS = [null, "face", ["neck", "cheek"], ["wedge", "cheek"], "claw", "handle"];
  const fig = $("#fig-anatomy");
  const setStep = n => {
    fig.dataset.step = n;
    const on = [].concat(PARTS[n] || []);
    $$(".part", fig).forEach(p => p.classList.toggle("on", on.includes(p.dataset.part)));
    $$("[data-label]", fig).forEach(l => l.classList.toggle("on", on.includes(l.dataset.label) || (l.dataset.label === "wedge" && on.includes("wedge"))));
    $$(".step").forEach(s => s.classList.toggle("active", +s.dataset.step === n));
  };
  setStep(0);
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) setStep(+en.target.dataset.step); }), { rootMargin: "-45% 0px -45% 0px" });
  $$(".step").forEach(s => io.observe(s));

  // dead-blow: replay the shot animation whenever it scrolls into view
  const db = $("#fig-deadblow");
  new IntersectionObserver(([en]) => { db.classList.toggle("play", en.isIntersecting); }, { threshold: .6 }).observe(db);

  // reveal plates as they arrive
  const rv = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); rv.unobserve(en.target); } }), { rootMargin: "0px 0px -10% 0px" });
  $$(".plate, .tryit, .fieldnote, .shelf, .fcard").forEach(el => { el.classList.add("rv2"); rv.observe(el); });

  // quiet share links in each lesson header, tracking for the calculators
  if (window.TT_SHARE) {
    $$(".x-ch[id]").forEach(sec => { const box = sec.querySelector(".x-head > div"); if (box) box.insertAdjacentHTML("beforeend", TT_SHARE.button(`learn-${sec.id}`)); });
    $(".x-cover-main")?.insertAdjacentHTML("beforeend", `<p class="x-share">${TT_SHARE.button("explainer", "share the explainer")}</p>`);
  }
  $$(".tryit").forEach(t => t.addEventListener("input", () => window.TT_TRACK?.("Calculator", { name: t.id.replace("try-", "") }), { once: true }));

  // site chrome
  if (window.TT_SITE) {
    TT_SITE.nav({ links: [["anatomy", "I", "Anatomy"], ["physics", "II", "Physics"], ["faces", "III", "Faces"], ["lever", "IV", "Lever"], ["handles", "V", "Handles"], ["hanging", "VI", "Hanging"], ["spectrum", "VII", "Spectrum"]]
      .map(([id, n, l]) => ({ href: "#" + id, id, html: `<b>${n}</b><span>${l}</span>` })) });
    TT_SITE.newsletter($("#newsletter"), { source: "explainer", title: "Get the field card", dek: "Subscribers get each issue's printable field card, plus the next odd pairing when it goes to press." });
    new IntersectionObserver(([en]) => document.body.classList.toggle("past-cover", !en.isIntersecting)).observe($(".x-cover .nav"));
  }
})();
