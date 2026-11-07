/*
 * Vercel function: GET /api/import?url=<product page>[&pairing=hammers-mirrors]
 * Reads one product page (schema.org Product data, falling back to meta tags) and returns
 * a catalog item, sorted into the pairing's types/angles. Used by the "Paste a link" box
 * on /catalog.html.
 *
 * Optional env IMPORT_TOKEN: when set, requests must pass ?token=… (keeps it from being a public scraper).
 */
const dns = require("dns").promises;
const net = require("net");
const { extractProduct, get } = require("./_lib/extract");
const { classifier } = require("./_lib/classify");

const BRIEFS = { "hammers-mirrors": require("../catalog/pairings/hammers-mirrors.json") };

// refuse internal addresses so this can't be used to probe private networks
const PRIVATE = [/^10\./, /^127\./, /^169\.254\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^0\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, /^::1$/, /^f[cd]/i, /^fe80/i];
async function isPublic(host) {
  if (/^localhost$|\.local$|\.internal$/i.test(host)) return false;
  const addrs = net.isIP(host) ? [host] : (await dns.lookup(host, { all: true })).map(a => a.address);
  return addrs.length && addrs.every(a => !PRIVATE.some(re => re.test(a.replace(/^::ffff:/, ""))));
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const send = (code, body) => { res.statusCode = code; res.end(JSON.stringify(body)); };
  const q = req.query || {};
  if (process.env.IMPORT_TOKEN && q.token !== process.env.IMPORT_TOKEN) return send(401, { error: "Missing or wrong token" });

  let url;
  try { url = new URL(String(q.url || "")); } catch (e) { return send(400, { error: "Paste a full product link (https://…)" }); }
  if (!/^https?:$/.test(url.protocol)) return send(400, { error: "Only http(s) links" });
  try { if (!(await isPublic(url.hostname))) return send(400, { error: "That address isn't a public website" }); }
  catch (e) { return send(400, { error: "Couldn't find that website" }); }

  try {
    const r = await get(url.href, { timeout: 12000 });
    if ([401, 403, 429, 503].includes(r.status) || /captcha|access denied|are you a robot|px-captcha/i.test(r.body.slice(0, 5000))) {
      return send(422, { error: `${url.hostname} blocks automated reading. Add this one by hand, or use a network/API feed for this shop.`, blocked: true });
    }
    if (!r.ok) return send(502, { error: `The page answered ${r.status}` });
    const item = extractProduct(r.body, r.url);
    if (!item.title) return send(422, { error: "No product found on that page" });
    const brief = BRIEFS[q.pairing] || BRIEFS["hammers-mirrors"];
    const c = classifier(brief)(item);
    const host = new URL(r.url).hostname.replace(/^www\./, "");
    res.setHeader("Cache-Control", "private, max-age=0");
    send(200, { item: { ...item, ...(c || {}), source: "manual:" + host, sourceName: host, importedAt: new Date().toISOString() }, matched: !!c });
  } catch (e) {
    send(502, { error: e.name === "AbortError" ? "That page took too long to answer" : String(e.message || e) });
  }
};
