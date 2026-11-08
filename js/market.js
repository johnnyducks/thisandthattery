/*
 * TT_MARKET: reusable "marketplace interstitial" micro-app
 * ------------------------------------------------------------------
 * A searchable, location-aware carousel of listings from any store or platform.
 * The UI only talks to an ADAPTER, so the same module can front eBay, Etsy,
 * a local-classifieds feed, or a retailer API.
 *
 * Mount:   TT_MARKET.mount(element, config)
 * Config:  see the `module` object on the interstitial in js/issue.js
 *
 * Adapter contract
 *   {
 *     id, label,                       // "ebay", "eBay"
 *     capabilities: { zip, radius, pickup, auction, sorts: [...] },
 *     search({ q, zip, radius, pickupOnly, format, sort }) -> Promise<{ items, total, live }>
 *   }
 *
 * Normalized item (what every adapter returns)
 *   {
 *     id, title, url,
 *     image?            // https URL, or omitted when `art` is supplied (sample data)
 *     art?              // { kind, art } fed to TT_ART for placeholder illustrations
 *     price,            // number
 *     currency,         // "USD"
 *     format,           // "auction" | "fixed"
 *     bids?, endsAt?,   // auction only (endsAt = epoch ms)
 *     bestOffer?,       // boolean
 *     condition,        // "New" | "Used" | "Vintage" | ...
 *     shippingCost,     // number, 0 = free; null = unknown/calculated
 *     location: { city, region, postal, distanceMi? },
 *     localPickup,      // boolean
 *     seller: { name, feedbackPct },
 *     watchers?
 *   }
 */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n, cur = "USD") => n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: cur, minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);

  /* ------------------------------------------------------------------
     Seeded randomness so sample results are stable per query + zip
     ------------------------------------------------------------------ */
  function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

  /* ------------------------------------------------------------------
     SAMPLE ADAPTER: realistic-looking listings for design work
     ------------------------------------------------------------------ */
  const PLACES = [
    ["10001", "New York", "NY", 40.75, -73.99], ["07030", "Hoboken", "NJ", 40.74, -74.03], ["02139", "Cambridge", "MA", 42.36, -71.10],
    ["19103", "Philadelphia", "PA", 39.95, -75.17], ["21201", "Baltimore", "MD", 39.29, -76.62], ["30303", "Atlanta", "GA", 33.75, -84.39],
    ["33101", "Miami", "FL", 25.77, -80.19], ["37203", "Nashville", "TN", 36.15, -86.78], ["44113", "Cleveland", "OH", 41.48, -81.70],
    ["48201", "Detroit", "MI", 42.35, -83.06], ["53202", "Milwaukee", "WI", 43.04, -87.90], ["60601", "Chicago", "IL", 41.88, -87.62],
    ["55401", "Minneapolis", "MN", 44.98, -93.27], ["63101", "St. Louis", "MO", 38.63, -90.19], ["70112", "New Orleans", "LA", 29.95, -90.07],
    ["75201", "Dallas", "TX", 32.78, -96.80], ["78701", "Austin", "TX", 30.27, -97.74], ["80202", "Denver", "CO", 39.75, -104.99],
    ["84101", "Salt Lake City", "UT", 40.76, -111.89], ["85004", "Phoenix", "AZ", 33.45, -112.07], ["87501", "Santa Fe", "NM", 35.69, -105.94],
    ["90012", "Los Angeles", "CA", 34.06, -118.24], ["94103", "San Francisco", "CA", 37.77, -122.41], ["97205", "Portland", "OR", 45.52, -122.68],
    ["98101", "Seattle", "WA", 47.61, -122.33]
  ];
  const nearestPlace = zip => PLACES.reduce((b, p) => Math.abs(+p[0] - +zip) < Math.abs(+b[0] - +zip) ? p : b);
  function miles(a, b) {
    const R = 3959, rad = d => d * Math.PI / 180, dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  const TEMPLATES = [
    ["Vintage Drop-Forged Claw Hammer, Original Hickory Handle", "hammer claw vintage hickory forged tool", "hammer", { type: "claw", handle: "#8E5A2B", head: "#55575B" }, [14, 42], ["Used", "Vintage"]],
    ["Antique Cobbler's Tack Hammer, Magnetic Face, 1940s", "hammer tack antique magnetic upholstery cobbler 1940s", "hammer", { type: "tack", handle: "#B07A45", head: "#2F2F31" }, [12, 36], ["Vintage", "Used"]],
    ["Framing Hammer 22 oz Milled Face, Steel Handle", "hammer framing milled steel 22oz construction", "hammer", { type: "framing", handle: "#2E2E30", head: "#7A7D82" }, [19, 55], ["New", "Used"]],
    ["Dead Blow Mallet 3 lb, Non-Marring, Shot Filled", "mallet dead blow hammer rubber non-marring", "hammer", { type: "mallet", handle: "#1F1C1A", head: "#3E6E8E" }, [11, 30], ["New", "Used"]],
    ["Hand-Forged Blacksmith Cross Peen Hammer, 2.5 lb", "hammer blacksmith forged cross peen anvil", "hammer", { type: "claw", handle: "#6B4226", head: "#2B2B2B" }, [45, 140], ["New", "Used"]],
    ["Lot of 4 Old Hammers, Barn Find, Mixed Sizes", "hammer lot barn find vintage antique bundle", "hammer", { type: "claw", handle: "#9C6B3E", head: "#6E5A48" }, [20, 60], ["Used"]],
    ["Mid-Century Round Walnut Wall Mirror, 28 in", "mirror round walnut mid-century wall wood", "mirror", { type: "round", frame: "#6B4226" }, [60, 240], ["Vintage", "Used"]],
    ["Hollywood Regency Gilt Sunburst Mirror, 1950s", "mirror sunburst gilt gold regency 1950s starburst brass", "mirror", { type: "sunburst", frame: "#C9A24D" }, [85, 420], ["Vintage"]],
    ["Brass Arched Floor Mirror, 64 in, Leaning", "mirror arch arched floor brass leaning full length", "mirror", { type: "arch", frame: "#B08A4A" }, [70, 260], ["Used", "New"]],
    ["Art Deco Beveled Vanity Hand Mirror, Enamel Handle", "mirror hand vanity art deco beveled enamel", "mirror", { type: "hand", frame: "#2F6F6A" }, [14, 65], ["Vintage", "Used"]],
    ["Federal Style Convex Butler's Mirror, Gilt Frame", "mirror convex butler federal gilt antique round", "mirror", { type: "convex", frame: "#B08A4A" }, [120, 560], ["Vintage"]],
    ["Industrial Convex Safety Mirror, 18 in, Wall Arm", "mirror convex safety industrial garage shop", "mirror", { type: "convex", frame: "#1F1C1A" }, [25, 70], ["New", "Used"]],
    ["Pink Enamel Hand Mirror, Vanity Set Piece", "mirror hand vanity pink enamel retro", "mirror", { type: "hand", frame: "#D98C8C" }, [9, 28], ["Used", "Vintage"]],
    ["Large Round Brass Mirror, Thin Frame, 36 in", "mirror round brass gold thin modern large", "mirror", { type: "round", frame: "#C9A24D" }, [90, 300], ["New", "Used"]]
  ];
  const BGS = ["#E9B44C", "#D9D2C3", "#8FA39A", "#E2581C", "#2B2826", "#1F3A3D", "#F2E3C9", "#C9B79C"];
  const SELLERS = ["oldtoolsjoe", "barnfind_betty", "estate.and.co", "rustbeltrelics", "the_glass_attic", "fleamarketfred", "midcentury_mae", "forge_and_file", "sundaysales22", "atticwhisperer"];

  function catalog(seed) {
    const r = rng(seed), out = [];
    TEMPLATES.forEach((t, ti) => {
      const copies = 3 + Math.floor(r() * 2);
      for (let k = 0; k < copies; k++) {
        const [lo, hi] = t[4], price = Math.round((lo + r() * (hi - lo)) * 100) / 100;
        const auction = r() < .42;
        out.push({
          id: `s-${ti}-${k}`, title: t[0], tags: t[1],
          art: { kind: t[2], art: { ...t[3], bg: pick(r, BGS) } },
          price: auction ? Math.round(price * .6) + .99 - 1 : Math.round(price) - .01,
          currency: "USD", format: auction ? "auction" : "fixed",
          bids: auction ? Math.floor(r() * 18) : undefined,
          endsAt: auction ? Date.now() + Math.floor((.05 + r() * 72) * 3600e3) : undefined,
          bestOffer: !auction && r() < .4,
          condition: pick(r, t[5]),
          shippingCost: r() < .4 ? 0 : Math.round((6 + r() * 14) * 100) / 100,
          _place: pick(r, PLACES), _near: r() < .4, _jit: [r() - .5, r() - .5],
          localPickup: r() < .45,
          seller: { name: pick(r, SELLERS), feedbackPct: Math.round((97 + r() * 3) * 10) / 10 },
          watchers: Math.floor(r() * 40)
        });
      }
    });
    return out;
  }

  const SampleAdapter = (opts = {}) => ({
    id: opts.id || "sample", label: opts.label || "Sample",
    capabilities: { zip: true, radius: true, pickup: true, auction: true, sorts: ["best", "ending", "priceAsc", "priceDesc", "distance"] },
    async search({ q = "", zip = "", radius = 0, pickupOnly = false, format = "all", sort = "best" }) {
      await new Promise(res => setTimeout(res, 420 + Math.random() * 300));   // feel like a network call
      const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      const home = zip ? nearestPlace(zip) : null;
      let items = catalog(hash("tt" + zip)).map(it => {
        // ~40% of listings are "near" whatever zip you type, so local search always has something to show
        const base = home && it._near ? home : it._place;
        const pos = [base[3] + (home && it._near ? it._jit[0] * .8 : 0), base[4] + (home && it._near ? it._jit[1] * .8 : 0)];
        const location = { city: base[1], region: base[2], postal: base[0] };
        if (home) location.distanceMi = Math.max(1, Math.round(miles([home[3], home[4]], pos)));
        const hay = (it.title + " " + it.tags).toLowerCase();
        const score = terms.reduce((s, t) => s + (hay.includes(t) ? 2 : hay.includes(t.replace(/s$/, "")) ? 1 : 0), 0);
        const all = terms.every(t => hay.includes(t) || hay.includes(t.replace(/s$/, "")));
        return { ...it, location, url: "#", _score: score, _all: all };
      });
      // prefer listings matching every word; fall back to any-word matches
      if (terms.length) items = items.some(i => i._all) ? items.filter(i => i._all) : items.filter(i => i._score > 0);
      if (format !== "all") items = items.filter(i => i.format === format);
      if (home && radius) items = items.filter(i => i.location.distanceMi <= radius);
      if (pickupOnly) items = items.filter(i => i.localPickup && (!home || i.location.distanceMi <= (radius || 100)));
      const by = {
        best: (a, b) => b._score - a._score || b.watchers - a.watchers,
        ending: (a, b) => (a.endsAt || Infinity) - (b.endsAt || Infinity),
        priceAsc: (a, b) => a.price - b.price,
        priceDesc: (a, b) => b.price - a.price,
        distance: (a, b) => (a.location.distanceMi ?? 1e9) - (b.location.distanceMi ?? 1e9)
      };
      items.sort(by[sort] || by.best);
      return { items: items.slice(0, 24), total: items.length, live: false };
    }
  });

  /* ------------------------------------------------------------------
     EBAY ADAPTER: talks to OUR server proxy (never to eBay directly:
     the Browse API needs an OAuth app token that must stay server-side).
     Proxy contract: GET {endpoint}?q&zip&radius&pickupOnly&format&sort
                     -> { total, items: [normalized item] }
     See api/_lib/ebay.js for the eBay-side mapping (Vercel function).
     Falls back to sample data when no endpoint is configured or it fails.
     ------------------------------------------------------------------ */
  const EbayAdapter = (opts = {}) => {
    const sample = SampleAdapter({ id: "ebay", label: "eBay" });
    return {
      id: "ebay", label: "eBay",
      capabilities: { zip: true, radius: true, pickup: true, auction: true, sorts: ["best", "ending", "priceAsc", "priceDesc", "distance"] },
      async search(params) {
        if (!opts.endpoint || location.protocol === "file:") return sample.search(params);   // no API when opened as a file
        try {
          const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== "" && v != null && v !== false));
          const res = await fetch(`${opts.endpoint}?${qs}`, { headers: { Accept: "application/json" } });
          if (!res.ok) throw new Error(res.status);
          const data = await res.json();
          return { items: data.items || [], total: data.total ?? (data.items || []).length, live: true };
        } catch (e) {
          const r = await sample.search(params);
          return { ...r, fallback: true };
        }
      }
    };
  };

  const ADAPTERS = { sample: SampleAdapter, ebay: EbayAdapter };

  /* ------------------------------------------------------------------
     UI
     ------------------------------------------------------------------ */
  const SORT_LABELS = { best: "Best match", ending: "Ending soonest", priceAsc: "Price: low → high", priceDesc: "Price: high → low", distance: "Nearest first" };
  const RADII = [10, 25, 50, 100, 250];

  function timeLeft(ms) {
    const s = Math.max(0, Math.floor((ms - Date.now()) / 1000));
    if (!s) return "Ended";
    const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m ${String(sec).padStart(2, "0")}s`;
  }

  function mount(root, cfg) {
    const adapter = (ADAPTERS[cfg.platform] || SampleAdapter)(cfg.adapter || {});
    const cap = adapter.capabilities;
    const label = cfg.platformLabel || adapter.label;
    const storeKey = `tt-mkt-${cfg.id || adapter.id}`;
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(storeKey) || "{}"); } catch (e) {}
    const state = {
      q: new URLSearchParams(location.search).get("swap") || cfg.defaultQuery || "", zip: saved.zip || "", radius: saved.radius || 50,
      pickupOnly: false, format: "all", sort: "best", items: [], busy: false, req: 0
    };
    const uid = "m" + Math.random().toString(36).slice(2, 7);

    root.classList.add("mkt-host");
    root.innerHTML = `
      <div class="mkt-intro">
        <div class="mkt-kicker">${esc(cfg.kicker || "Intermission")}</div>
        <h2 class="mkt-title">${esc(cfg.title)}</h2>
        <p class="mkt-dek">${esc(cfg.dek || "")}</p>
      </div>
      <div class="mkt" role="region" aria-label="${esc(cfg.title)}: listings from ${esc(label)}">
        <div class="mkt-bar">
          <span class="mkt-lamp" aria-hidden="true"></span>
          <span class="mkt-name">${esc(cfg.consoleName || "The Swap Meet")}</span>
          <span class="mkt-grille" aria-hidden="true"></span>
          <span class="mkt-source">Live from <b>${esc(label)}</b></span>
          <span class="mkt-status" aria-live="polite"></span>
        </div>

        <form class="mkt-controls" novalidate>
          <label class="mkt-field mkt-q">
            <span>What are you after?</span>
            <input type="search" name="q" value="${esc(state.q)}" placeholder="e.g. brass sunburst mirror" autocomplete="off" enterkeyhint="search">
          </label>
          ${cap.zip ? `
          <label class="mkt-field mkt-zip">
            <span>Near zip</span>
            <input name="zip" value="${esc(state.zip)}" inputmode="numeric" pattern="[0-9]{5}" maxlength="5" placeholder="00000" autocomplete="postal-code">
          </label>` : ""}
          ${cap.radius ? `
          <label class="mkt-field mkt-radius">
            <span>Within</span>
            <select name="radius">${RADII.map(r => `<option value="${r}" ${+state.radius === r ? "selected" : ""}>${r} mi</option>`).join("")}<option value="0" ${+state.radius === 0 ? "selected" : ""}>Anywhere</option></select>
          </label>` : ""}
          <button class="mkt-go" type="submit">Search <span aria-hidden="true">→</span></button>
        </form>

        <div class="mkt-presets" role="group" aria-label="Quick searches">
          ${(cfg.presets || []).map((p, i) => `<button type="button" class="mkt-preset" data-q="${esc(p)}"><i>${i + 1}</i>${esc(p)}</button>`).join("")}
        </div>

        <div class="mkt-filters">
          ${cap.auction ? `<div class="mkt-seg" role="radiogroup" aria-label="Listing format">
            ${[["all", "All"], ["fixed", "Buy It Now"], ["auction", "Auction"]].map(([v, l]) => `<button type="button" role="radio" data-format="${v}" aria-checked="${state.format === v}">${l}</button>`).join("")}
          </div>` : ""}
          ${cap.pickup ? `<label class="mkt-switch"><input type="checkbox" name="pickup"><span class="track"><span class="knob"></span></span>Local pickup only</label>` : ""}
          <label class="mkt-sort"><span>Sort</span>
            <select name="sort">${cap.sorts.map(s => `<option value="${s}">${SORT_LABELS[s]}</option>`).join("")}</select>
          </label>
        </div>

        <div class="mkt-head">
          <p class="mkt-summary" aria-live="polite"></p>
          <div class="mkt-nav">
            <button type="button" class="mkt-arrow" data-dir="-1" aria-label="Scroll back">←</button>
            <button type="button" class="mkt-arrow" data-dir="1" aria-label="Scroll forward">→</button>
          </div>
        </div>
        <div class="mkt-viewport">
          <ol class="mkt-track" id="${uid}" tabindex="0" aria-label="Listings"></ol>
        </div>
        <div class="mkt-progress" aria-hidden="true"><i></i></div>
        <p class="mkt-fine">${esc(cfg.disclosure || `Listings, prices and availability come from ${label} and can change at any time. We may earn a commission when you buy through these links.`)}</p>
      </div>`;

    const form = $(".mkt-controls", root), track = $(".mkt-track", root), summary = $(".mkt-summary", root), status = $(".mkt-status", root);
    const persist = () => { try { localStorage.setItem(storeKey, JSON.stringify({ zip: state.zip, radius: state.radius })); } catch (e) {} };

    function card(it, i) {
      const media = it.image
        ? `<img src="${esc(it.image)}" alt="" loading="lazy" decoding="async">`
        : (window.TT_ART && it.art ? TT_ART.render(it.art) : "");
      const auction = it.format === "auction";
      const ship = it.shippingCost === 0 ? `<b class="free">Free shipping</b>` : it.shippingCost == null ? "Shipping calculated" : `+${money(it.shippingCost, it.currency)} shipping`;
      const loc = it.location || {};
      const kitId = `${adapter.id}:${it.id}`;
      const skim = /[?&]campid=/.test(it.url || "") ? ' class="noskim"' : "";   // already an affiliate link: Skimlinks hands off
      const inKit = window.TT_KIT && TT_KIT.has(kitId);
      return `<li class="mcard" style="--i:${i}">
        <div class="mcard-frame">
          <div class="mcard-img">${media}</div>
          <span class="mcard-badge ${auction ? "auc" : ""}">${auction ? `Auction · <span data-ends="${it.endsAt}">${timeLeft(it.endsAt)}</span>` : it.bestOffer ? "Buy It Now · or Best Offer" : "Buy It Now"}</span>
          <span class="mcard-cond">${esc(it.condition)}</span>
        </div>
        <div class="mcard-body">
          <h3 class="mcard-title"><a href="${esc(it.url)}"${skim} target="_blank" rel="sponsored noopener">${esc(it.title)}</a></h3>
          <div class="mcard-price">${money(it.price, it.currency)}${auction ? `<small>${it.bids || 0} bid${it.bids === 1 ? "" : "s"}</small>` : ""}</div>
          <ul class="mcard-meta">
            <li>${ship}</li>
            <li>${esc([loc.city, loc.region].filter(Boolean).join(", ") || loc.postal || "")}${loc.distanceMi != null ? ` · <b>${loc.distanceMi} mi</b>` : ""}${it.localPickup ? ` <span class="pickup">Pickup</span>` : ""}</li>
            <li class="seller">${esc(it.seller?.name || "")}${it.seller?.feedbackPct ? ` · ${it.seller.feedbackPct}%` : ""}${it.watchers ? ` · ${it.watchers} watching` : ""}</li>
          </ul>
          <div class="mcard-actions">
            <a class="btn-shop${skim ? " noskim" : ""}" href="${esc(it.url)}" target="_blank" rel="sponsored noopener">View on ${esc(label)} <span aria-hidden="true">→</span></a>
            ${window.TT_KIT ? `<button type="button" class="btn-kit mkit ${inKit ? "on" : ""}" data-mkit="${esc(it.id)}" aria-pressed="${!!inKit}" aria-label="${inKit ? "Remove from" : "Add to"} kit">${inKit ? "✓" : "+"}</button>` : ""}
          </div>
        </div>
      </li>`;
    }

    function skeletons() {
      track.innerHTML = Array.from({ length: 5 }, (_, i) => `<li class="mcard skel" style="--i:${i}"><div class="mcard-frame"><div class="mcard-img"></div></div><div class="mcard-body"><span></span><span></span><span></span></div></li>`).join("");
    }

    function describe(res) {
      const n = res.total, q = state.q.trim();
      const where = state.zip && cap.zip ? (+state.radius ? ` within ${state.radius} mi of ${state.zip}` : ` shipping to ${state.zip}`) : "";
      return `<b>${n}</b> ${n === 1 ? "find" : "finds"}${q ? ` for “${esc(q)}”` : ""}${where}${state.pickupOnly ? ", local pickup" : ""}`;
    }

    async function run() {
      const zipOk = !state.zip || /^\d{5}$/.test(state.zip);
      $(".mkt-zip", root)?.classList.toggle("bad", !zipOk);
      if (!zipOk) { summary.innerHTML = `That zip doesn't look right. Five digits, please.`; return; }
      const req = ++state.req;
      root.classList.add("busy"); skeletons();
      status.textContent = "Tuning in…";
      $$(".mkt-preset", root).forEach(b => b.classList.toggle("on", b.dataset.q.toLowerCase() === state.q.trim().toLowerCase()));
      const res = await adapter.search({ q: state.q.trim(), zip: state.zip, radius: +state.radius, pickupOnly: state.pickupOnly, format: state.format, sort: state.sort });
      if (req !== state.req) return;            // a newer search won
      root.classList.remove("busy");
      state.items = res.items;
      status.textContent = res.live ? "On air" : res.fallback ? "Sample data · feed offline" : "Sample data";
      status.dataset.live = !!res.live;
      summary.innerHTML = describe(res);
      track.scrollLeft = 0;
      track.innerHTML = res.items.length ? res.items.map(card).join("") : `<li class="mcard-empty">
          <b>Nothing on the shelf.</b> Try a wider radius, drop “local pickup”, or one of these:
          <span>${(cfg.presets || []).slice(0, 3).map(p => `<button type="button" class="mkt-preset" data-q="${esc(p)}">${esc(p)}</button>`).join("")}</span>
        </li>`;
      progress();
    }

    // ---- interactions -------------------------------------------------
    const readForm = () => { state.q = form.q.value; if (form.zip) state.zip = form.zip.value.trim(); if (form.radius) state.radius = form.radius.value; persist(); };
    form.addEventListener("submit", e => { e.preventDefault(); readForm(); run(); });
    form.zip?.addEventListener("input", () => { form.zip.value = form.zip.value.replace(/\D/g, "").slice(0, 5); });
    form.radius?.addEventListener("change", () => { state.radius = form.radius.value; persist(); if (state.zip) run(); });
    root.addEventListener("click", e => {
      const p = e.target.closest(".mkt-preset");
      if (p) { form.q.value = p.dataset.q; readForm(); run(); return; }
      const f = e.target.closest("[data-format]");
      if (f) { state.format = f.dataset.format; $$("[data-format]", root).forEach(b => b.setAttribute("aria-checked", b === f)); run(); return; }
      const a = e.target.closest(".mkt-arrow");
      if (a) { track.scrollBy({ left: +a.dataset.dir * track.clientWidth * .85, behavior: "smooth" }); return; }
      const k = e.target.closest("[data-mkit]");
      if (k && window.TT_KIT) {
        const it = state.items.find(i => String(i.id) === k.dataset.mkit); if (!it) return;
        TT_KIT.toggleExternal({
          id: `${adapter.id}:${it.id}`, external: true, kind: it.art?.kind || "item", art: it.art?.art,
          brand: label, name: it.title, short: it.title.length > 28 ? it.title.slice(0, 26) + "…" : it.title,
          price: it.price, url: it.url,
          shipping: it.shippingCost === 0 ? "Free shipping" : it.shippingCost == null ? "Shipping calculated" : `+${money(it.shippingCost)} shipping`,
          shippingCost: it.shippingCost, retailer: adapter.id
        }, { name: label, freeShipOver: 0, perItemShipping: true, returns: "Returns set by each seller" });
      }
    });
    $("[name=pickup]", root)?.addEventListener("change", e => { state.pickupOnly = e.target.checked; run(); });
    $("[name=sort]", root).addEventListener("change", e => { state.sort = e.target.value; run(); });
    window.TT_KIT?.onChange(() => $$("[data-mkit]", root).forEach(b => {
      const on = TT_KIT.has(`${adapter.id}:${b.dataset.mkit}`);
      b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); b.textContent = on ? "✓" : "+";
      b.setAttribute("aria-label", `${on ? "Remove from" : "Add to"} kit`);
    }));

    // carousel: progress, keyboard, drag-to-scroll with a mouse
    function progress() {
      const max = track.scrollWidth - track.clientWidth;
      const pct = max > 0 ? track.scrollLeft / max : 0;
      const bar = $(".mkt-progress i", root);
      bar.style.width = max > 0 ? `${Math.max(12, track.clientWidth / track.scrollWidth * 100)}%` : "100%";
      bar.style.left = `${pct * (100 - parseFloat(bar.style.width))}%`;
      $$(".mkt-arrow", root).forEach(b => b.disabled = +b.dataset.dir < 0 ? track.scrollLeft < 4 : track.scrollLeft > max - 4);
    }
    track.addEventListener("scroll", progress, { passive: true });
    addEventListener("resize", progress);
    track.addEventListener("keydown", e => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); track.scrollBy({ left: (e.key === "ArrowRight" ? 1 : -1) * 280, behavior: "smooth" }); }
    });
    let drag = null;
    track.addEventListener("pointerdown", e => {
      if (e.pointerType !== "mouse" || e.target.closest("a,button")) return;
      drag = { x: e.clientX, left: track.scrollLeft, moved: false }; track.classList.add("dragging");
    });
    addEventListener("pointermove", e => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 4) drag.moved = true; track.scrollLeft = drag.left - dx; });
    addEventListener("pointerup", () => { if (drag) { track.classList.remove("dragging"); drag = null; } });

    // live auction clocks
    setInterval(() => $$("[data-ends]", root).forEach(el => { el.textContent = timeLeft(+el.dataset.ends); }), 1000);

    // first search when the module scrolls near view
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { io.disconnect(); run(); } }, { rootMargin: "400px 0px" });
    io.observe(root);
    return { search: q => { state.q = form.q.value = q; return run(); } };
  }

  window.TT_MARKET = { mount, adapters: ADAPTERS, register: (id, factory) => { ADAPTERS[id] = factory; } };
})();
