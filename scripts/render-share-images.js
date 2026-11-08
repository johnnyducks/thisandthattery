#!/usr/bin/env node
/*
 * Renders the social share images in the magazine style:
 *   share/img/<slug>.jpg        1200 x 630   link previews (Facebook, iMessage, Slack, X…)
 *   share/img/<slug>-story.jpg  1080 x 1920  Instagram / TikTok stories and photo posts
 *
 * Needs Playwright and the brand fonts (one-time, outside the site):
 *   npm i --no-save playwright @fontsource/montserrat @fontsource/playfair-display @fontsource/libre-caslon-text @fontsource/courier-prime
 *   node scripts/render-share-images.js            # all
 *   node scripts/render-share-images.js ch-duel    # one
 * Set FONTS_DIR if the @fontsource packages live elsewhere.
 */
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const entries = require("./share-entries")();
const ROOT = path.join(__dirname, "..");
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));
const FONTS = process.env.FONTS_DIR || path.join(ROOT, "node_modules/@fontsource");
const OUT = path.join(ROOT, "share/img");
const only = process.argv.slice(2);
const host = new URL(cfg.url).host.replace(/^www\./, "");
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// fonts are inlined as data URLs: pages rendered from a string can't read local font files
const ff = (fam, pkg, file, weight, style = "normal") => `@font-face{font-family:"${fam}";src:url("data:font/woff2;base64,${fs.readFileSync(path.join(FONTS, pkg, "files", file)).toString("base64")}") format("woff2");font-weight:${weight};font-style:${style}}`;
const fontCss = [
  ff("Montserrat", "montserrat", "montserrat-latin-700-normal.woff2", 700), ff("Montserrat", "montserrat", "montserrat-latin-800-normal.woff2", 800),
  ff("Montserrat", "montserrat", "montserrat-latin-900-italic.woff2", 900, "italic"),
  ff("Playfair Display", "playfair-display", "playfair-display-latin-900-italic.woff2", 900, "italic"), ff("Playfair Display", "playfair-display", "playfair-display-latin-900-normal.woff2", 900),
  ff("Libre Caslon Text", "libre-caslon-text", "libre-caslon-text-latin-400-italic.woff2", 400, "italic"),
  ff("Courier Prime", "courier-prime", "courier-prime-latin-700-normal.woff2", 700)
].join("");

function figure(e) {
  const f = e.figure || {};
  const frame = a => a ? `<div class="frame"><div class="face" data-art='${esc(JSON.stringify(a))}'></div><i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i></div>` : "";
  if (f.type === "pair") return `<div class="fig pair">${frame(f.a)}${frame(f.b)}</div>`;
  if (f.type === "art") return `<div class="fig">${frame(f.a)}</div>`;
  return `<div class="fig"><div class="plate"><span class="figno">Fig.</span><b>${esc(f.text)}</b></div></div>`;
}

const css = `${fontCss}
*{box-sizing:border-box;margin:0}
body{background:#111}
.card{position:relative;overflow:hidden;font-family:"Libre Caslon Text",Georgia,serif;color:#1F1C1A;background:#EEE5D3;display:grid}
.card.dark{background:radial-gradient(ellipse 70% 60% at 25% 0%,rgba(255,240,215,.14),transparent 70%),#2B2826;color:#F6EFE4}
.card.accent{background:radial-gradient(ellipse 70% 60% at 25% 0%,rgba(255,255,255,.14),transparent 70%),var(--accent);color:#F6EFE4}
.crop{position:absolute;width:30px;height:30px;border:3px solid currentColor;opacity:.75}
.crop.tl{top:24px;left:24px;border-width:3px 0 0 3px}.crop.tr{top:24px;right:24px;border-width:3px 3px 0 0}
.crop.bl{bottom:24px;left:24px;border-width:0 0 3px 3px}.crop.br{bottom:24px;right:24px;border-width:0 3px 3px 0}
.brand{display:flex;align-items:baseline;gap:16px}
.tt{font:italic 900 72px/.8 Montserrat;letter-spacing:-.06em;transform:skewX(-6deg);display:inline-block}
.word{font:800 18px/1 Montserrat;letter-spacing:.34em}
.kicker{font:800 18px/1 Montserrat;letter-spacing:.3em;text-transform:uppercase;color:#E2581C}
.dark .kicker,.accent .kicker{color:#F2A27C}
h1{font:italic 900 74px/.98 "Playfair Display";letter-spacing:-.01em}
.desc{font:italic 400 26px/1.4 "Libre Caslon Text";opacity:.85}
.aside{font:italic 400 21px/1.4 "Libre Caslon Text";opacity:.62}
.aside:before{content:"↔ ";font-style:normal;color:#E2581C}
.foot{font:700 18px/1 "Courier Prime";letter-spacing:.06em;opacity:.8}
.fig{display:flex;align-items:center;justify-content:center;gap:28px}
.frame{position:relative;background:#F6EFE4;padding:12px;border:3px solid #1F1C1A;box-shadow:4px 4px 0 #CDBEA2,8px 8px 0 #CDBEA2,12px 12px 0 #A8977A,16px 16px 0 #A8977A,18px 18px 0 #1F1C1A,30px 40px 40px rgba(0,0,0,.35);transform:rotate(-4deg)}
.pair .frame:last-child{transform:rotate(5deg) translateY(30px)}
.dark .frame,.accent .frame{box-shadow:4px 4px 0 #4A4440,8px 8px 0 #4A4440,12px 12px 0 #3A3532,16px 16px 0 #3A3532,18px 18px 0 #111,30px 40px 40px rgba(0,0,0,.5)}
.face{border:3px solid #1F1C1A;overflow:hidden}.face svg{display:block;width:100%;height:100%}
.c{position:absolute;width:28px;height:28px;background:#1F1C1A}
.c.tl{top:-4px;left:-4px;clip-path:polygon(0 0,100% 0,0 100%)}.c.tr{top:-4px;right:-4px;clip-path:polygon(0 0,100% 0,100% 100%)}
.c.bl{bottom:-4px;left:-4px;clip-path:polygon(0 0,0 100%,100% 100%)}.c.br{bottom:-4px;right:-4px;clip-path:polygon(100% 0,100% 100%,0 100%)}
.plate{position:relative;border:2px solid currentColor;outline:2px solid currentColor;outline-offset:8px;padding:44px 40px 40px;text-align:center;max-width:100%}
.plate b{display:block;font:900 70px/1.05 "Playfair Display";color:#E2581C}
.figno{position:absolute;top:-14px;left:22px;padding:0 10px;font:800 16px/1 Montserrat;letter-spacing:.3em;text-transform:uppercase;background:inherit}
.dark .plate,.accent .plate{color:#F6EFE4}.card .plate .figno{background:#EEE5D3;color:#B8410F}.dark .plate .figno{background:#2B2826;color:#F2A27C}.accent .plate .figno{background:var(--accent);color:#F2A27C}
.band{position:absolute;left:0;right:0;bottom:0;height:16px;background:#E2581C}
/* landscape 1200x630 */
.og{width:1200px;height:630px;grid-template-columns:1fr 470px;padding:56px 64px 62px 70px;gap:30px}
.og .text{display:flex;flex-direction:column;justify-content:space-between;min-width:0}
.og .mid{display:flex;flex-direction:column;gap:18px}
.og h1{font-size:72px}.og .fig .face{width:270px;height:338px}.og .pair .face{width:190px;height:238px}
.og .plate b{font-size:62px}
/* story 1080x1920 */
.story{width:1080px;height:1920px;padding:230px 96px 290px;grid-template-rows:auto auto 1fr auto auto;gap:46px;text-align:left}
.story .tt{font-size:120px}.story .word{font-size:26px}.story .kicker{font-size:26px}
.story h1{font-size:118px}.story .desc{font-size:40px}.story .aside{font-size:32px}
.story .fig .face{width:560px;height:700px}.story .pair .face{width:400px;height:500px}.story .plate b{font-size:120px}.story .plate{padding:80px 60px 70px}
.story .foot{font-size:30px}
.story .cta{display:inline-block;background:#E2581C;color:#F6EFE4;font:800 34px/1 Montserrat;letter-spacing:.04em;text-transform:uppercase;padding:26px 44px;border-radius:999px;box-shadow:0 8px 0 #B8410F}
.story .band{height:24px}`;

function card(e, kind) {
  const cls = `card ${kind} ${e.accent ? "accent" : e.dark ? "dark" : ""}`;
  const style = e.accent ? ` style="--accent:${e.accent}"` : "";
  const brand = `<div class="brand"><span class="tt">TT</span><span class="word">THIS &amp; THATTERY</span></div>`;
  if (kind === "og") return `<div class="${cls}"${style}><i class="crop tl"></i><i class="crop br"></i>
      <div class="text">${brand}<div class="mid"><div class="kicker">${esc(e.kicker)}</div><h1>${esc(e.title)}</h1><p class="desc">${esc(e.desc)}</p></div>
      <div>${e.aside ? `<p class="aside">${esc(e.aside)}</p>` : ""}<p class="foot" style="margin-top:12px">${esc(host)}</p></div></div>
      ${figure(e)}<i class="band"></i></div>`;
  return `<div class="${cls}"${style}><i class="crop tl"></i><i class="crop tr"></i><i class="crop bl"></i><i class="crop br"></i>
    ${brand}<div><div class="kicker" style="margin-bottom:26px">${esc(e.kicker)}</div><h1>${esc(e.title)}</h1></div>
    ${figure(e)}
    <div><p class="desc">${esc(e.desc)}</p>${e.aside ? `<p class="aside" style="margin-top:22px">${esc(e.aside)}</p>` : ""}</div>
    <div style="display:flex;align-items:center;justify-content:space-between"><span class="cta">Link in bio →</span><span class="foot">${esc(host)}</span></div><i class="band"></i></div>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ deviceScaleFactor: 1 });
  const artJs = fs.readFileSync(path.join(ROOT, "js/art.js"), "utf8");
  for (const e of entries.filter(e => !only.length || only.includes(e.slug))) {
    for (const kind of ["og", "story"]) {
      const [w, h] = kind === "og" ? [1200, 630] : [1080, 1920];
      await p.setViewportSize({ width: w, height: h });
      await p.setContent(`<!doctype html><meta charset="utf-8"><style>${css}</style><body>${card(e, kind)}<script>${artJs}
        document.querySelectorAll("[data-art]").forEach(el => { const a = JSON.parse(el.dataset.art); el.innerHTML = TT_ART.render({ ...a, brand: "", name: "" }); });</script></body>`, { waitUntil: "load" });
      await p.evaluate(() => document.fonts.ready);
      const file = path.join(OUT, `${e.slug}${kind === "story" ? "-story" : ""}.jpg`);
      await p.locator(".card").screenshot({ path: file, type: "jpeg", quality: 86 });
      console.log("✓", path.relative(ROOT, file), Math.round(fs.statSync(file).size / 1024) + " KB");
    }
  }
  // home-screen icon for iPhones (rendered from favicon.svg; run build-share.js first)
  const fav = path.join(ROOT, "favicon.svg");
  if (fs.existsSync(fav) && !only.length) {
    await p.setViewportSize({ width: 180, height: 180 });
    await p.setContent(`<style>${fontCss}*{margin:0}</style>${fs.readFileSync(fav, "utf8").replace("<svg ", '<svg width="180" height="180" ')}`);
    await p.evaluate(() => document.fonts.ready);
    await p.locator("svg").screenshot({ path: path.join(OUT, "apple-touch-icon.png") });
    console.log("✓ share/img/apple-touch-icon.png");
  }
  await b.close();
})();
