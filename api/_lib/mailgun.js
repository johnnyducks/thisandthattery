/*
 * Mailgun client for the newsletter (double opt-in).
 *
 * Env vars (Vercel → Settings → Environment Variables):
 *   MAILGUN_API_KEY     Private API key (Mailgun → Account → API Security)
 *   MAILGUN_DOMAIN      Verified sending domain, e.g. mg.thisandthattery.com
 *   MAILGUN_LIST        Mailing list address, e.g. dispatch@mg.thisandthattery.com
 *   MAILGUN_FROM        e.g. "This & Thattery <dispatch@mg.thisandthattery.com>"
 *   NEWSLETTER_SECRET   Long random string; signs confirmation links
 *   SITE_URL            e.g. https://thisandthattery.com (used in the confirmation link)
 *   MAILGUN_REGION      optional: "eu" if the Mailgun account is in the EU region
 */
const crypto = require("crypto");

const base = () => process.env.MAILGUN_REGION === "eu" ? "https://api.eu.mailgun.net/v3" : "https://api.mailgun.net/v3";
const auth = () => "Basic " + Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString("base64");

function configured() {
  return ["MAILGUN_API_KEY", "MAILGUN_DOMAIN", "MAILGUN_LIST", "NEWSLETTER_SECRET"].every(k => process.env[k]);
}

async function call(method, path, fields) {
  const res = await fetch(base() + path, {
    method,
    headers: { Authorization: auth(), ...(fields && { "Content-Type": "application/x-www-form-urlencoded" }) },
    body: fields ? new URLSearchParams(fields).toString() : undefined
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch (e) { json = { message: text }; }
  if (!res.ok) { const err = new Error(`Mailgun ${res.status}: ${json.message || "error"}`); err.status = res.status; throw err; }
  return json;
}

const list = () => encodeURIComponent(process.env.MAILGUN_LIST);

// Add (or update) a member as NOT yet subscribed; confirmation flips it.
function addPending(email, vars) {
  return call("POST", `/lists/${list()}/members`, { address: email, subscribed: "no", upsert: "yes", vars: JSON.stringify(vars) });
}
function confirmMember(email) {
  return call("PUT", `/lists/${list()}/members/${encodeURIComponent(email)}`, { subscribed: "yes" });
}
async function getMember(email) {
  try { return (await call("GET", `/lists/${list()}/members/${encodeURIComponent(email)}`)).member; }
  catch (e) { if (e.status === 404) return null; throw e; }
}
function send({ to, subject, text, html }) {
  return call("POST", `/${process.env.MAILGUN_DOMAIN}/messages`, {
    from: process.env.MAILGUN_FROM || `This & Thattery <dispatch@${process.env.MAILGUN_DOMAIN}>`,
    to, subject, text, html, "o:tag": "confirm-subscription"
  });
}

/* signed, expiring confirmation tokens: base64url(email|expires).hmac */
const b64 = s => Buffer.from(s).toString("base64url");
function sign(email, ttlHours = 72) {
  const payload = b64(`${email}|${Date.now() + ttlHours * 3600e3}`);
  const mac = crypto.createHmac("sha256", process.env.NEWSLETTER_SECRET).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}
function verify(token) {
  const [payload, mac] = String(token || "").split(".");
  if (!payload || !mac) return null;
  const good = crypto.createHmac("sha256", process.env.NEWSLETTER_SECRET).update(payload).digest("base64url");
  if (mac.length !== good.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(good))) return null;
  const [email, exp] = Buffer.from(payload, "base64url").toString().split("|");
  if (!email || Date.now() > +exp) return null;
  return email;
}

module.exports = { configured, addPending, confirmMember, getMember, send, sign, verify };
