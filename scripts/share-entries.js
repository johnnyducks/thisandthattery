/*
 * Everything that can be shared, with its card copy. Used by:
 *   scripts/build-share.js          -> share pages (s/*.html), meta tags, js/share-manifest.js
 *   scripts/render-share-images.js  -> share/img/<slug>.jpg (1200x630) and <slug>-story.jpg (1080x1920)
 * Card copy follows the house voice; `aside` is the cross-talk in-joke.
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
const load = (file, name) => { const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(ROOT, file), "utf8"), ctx); return ctx.window[name]; };

module.exports = function entries() {
  const I = load("js/issue.js", "TT_ISSUE"), S = load("js/sponsors.js", "TT_SPONSORS");
  const art = id => I.products[id] && { kind: I.products[id].kind, art: I.products[id].art };
  const chapterArt = { wall: "h-stanley7", glass: "m-laila", duel: "h-stanley16", luck: "m-juliette", lookback: "m-vallie" };
  const chapterAside = {
    wall: "Traditional wall mirrors would weigh significantly more.",
    glass: "Completely unsuitable for driving nails.",
    duel: "Neither will show you your reflection.",
    luck: "Break a mirror: seven years. Break a return window: forever.",
    lookback: "No mirrors were struck in the making of this issue."
  };
  const list = [{
    slug: "issue-01", page: "index.html", target: "index.html", kicker: `Issue ${I.number} · ${I.this} & ${I.that}`,
    title: `${I.this} & ${I.that}`, desc: I.coverLine, aside: "No mirrors were struck in the making of this issue.",
    figure: { type: "pair", a: art("h-stanley16"), b: art("m-laila") }, dark: true
  }];
  for (const c of I.chapters.filter(c => !c.module)) list.push({
    slug: `ch-${c.id}`, target: `index.html#ch-${c.id}`, kicker: `Issue ${I.number} · Chapter ${c.numeral}`,
    title: c.title, desc: c.dek, aside: chapterAside[c.id], figure: { type: "art", a: art(chapterArt[c.id]) }, dark: c.numeral.length % 2 === 1
  });
  const lessons = [
    ["explainer", "", "The Hammer, Explained", "A short course in striking, prying and holding things up.", "And the mirror it hangs.", "Fig. 1–6"],
    ["anatomy", "#anatomy", "What is a hammer, exactly?", "Two parts and a wedge. Every curve on it has a job.", "Mirrors also have a face. Do not strike it.", "2 parts + 1 wedge"],
    ["physics", "#physics", "Why can a lighter hammer hit as hard?", "Energy = ½ × mass × speed². Speed counts twice.", "Mirrors are not rated for swing speed.", "2× speed = 4× energy"],
    ["faces", "#faces", "What does each face leave behind?", "Smooth, milled, belled, mallet: every hammer signs its work.", "None of them will show you your own.", "4 faces · 4 marks"],
    ["lever", "#lever", "How does a claw out-pull your arm?", "The head is the pivot; the handle is the long arm.", "Mirrors make poor levers.", "≈ 10 : 1"],
    ["handles", "#handles", "Wood, fiberglass or steel?", "The handle decides what your elbow feels.", "Most mirrors come without handles.", "Hickory · Fiberglass · Steel"],
    ["hanging", "#hanging", "How much does a mirror really pull on the wall?", "A 30 lb mirror on flat wire pulls 86 lb on each side.", "A hammer can simply be kept in a drawer.", "30 lb → 86 lb"],
    ["spectrum", "#spectrum", "From jeweler's tap to forging blow", "106 hammers from our catalog, by head weight.", "Even the heaviest weighs less than most full-length mirrors.", "100 g → 3 kg"],
    ["fieldcard", "#fieldcard", "Which hammer for which job?", "The field card: one table, every job.", "A mirror: none of the above. Please don't.", "Field card No. 01"]
  ];
  for (const [id, hash, title, desc, aside, stat] of lessons) list.push({
    slug: id === "explainer" ? "explainer" : `learn-${id}`, page: id === "explainer" ? "explainer.html" : undefined,
    target: `explainer.html${hash}`, kicker: id === "explainer" ? "An illustrated explainer" : "The Hammer, Explained",
    title, desc, aside, figure: { type: "stat", text: stat }, dark: ["anatomy", "lever", "hanging", "explainer"].includes(id)
  });
  for (const [id, b] of Object.entries(S.brands)) list.push({
    slug: `brand-${id}`, page: id === S.active ? "sponsor.html" : undefined, target: `sponsor.html?brand=${id}`,
    kicker: b.paid ? `Sponsored by ${b.name}` : "Featured brand", title: b.title, desc: b.dek,
    aside: b.products[0]?.aside || "", figure: { type: "art", a: { kind: "hammer", art: { type: "mallet", handle: "#1F1C1A", head: "#C9874A", bg: "#2F5D50" } } }, dark: true, accent: b.accent
  });
  return list;
};
