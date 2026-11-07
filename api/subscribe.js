/*
 * POST /api/subscribe  { email, source?, company? (honeypot) }
 * Adds the address to the Mailgun list as pending and emails a confirmation link.
 * Nobody receives the newsletter until they click it (double opt-in).
 */
const mg = require("./_lib/mailgun");

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise(resolve => {
    let raw = ""; req.on("data", c => { raw += c; if (raw.length > 4096) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch (e) { resolve({}); } });
  });
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  const send = (code, body) => { res.statusCode = code; res.end(JSON.stringify(body)); };
  if (req.method !== "POST") return send(405, { error: "POST only" });
  if (!mg.configured()) return send(503, { error: "Signup isn't switched on yet. Please try again soon." });

  const body = await readBody(req);
  const email = String(body.email || "").trim().toLowerCase();
  // bots fill hidden fields; pretend it worked so they move on
  if (body.company) return send(200, { message: "Almost done: check your inbox and click the confirmation link." });
  if (!EMAIL.test(email) || email.length > 254) return send(400, { error: "That email doesn't look right." });

  try {
    const existing = await mg.getMember(email);
    if (existing?.subscribed) return send(200, { message: "You're already on the list. The next issue will find you." });

    const source = String(body.source || "site").slice(0, 40);
    await mg.addPending(email, { source, requestedAt: new Date().toISOString() });

    const site = (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/$/, "");
    const link = `${site}/api/confirm?token=${encodeURIComponent(mg.sign(email))}`;
    await mg.send({
      to: email,
      subject: "Confirm your subscription to This & Thattery",
      text: `One click and you're in.\n\nConfirm your subscription to The Thattery Dispatch:\n${link}\n\nIf you didn't ask for this, ignore this email and you won't hear from us.\n\nThis & Thattery`,
      html: `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:24px;background:#F6EFE4;color:#1F1C1A">
        <div style="font:italic 900 40px/1 Arial,sans-serif;letter-spacing:-2px">TT</div>
        <h1 style="font:900 26px/1.2 Georgia,serif;margin:18px 0 8px">One click and you're in.</h1>
        <p style="font-size:16px;line-height:1.6">Confirm your subscription to <em>The Thattery Dispatch</em>: one odd pairing, whenever a new issue goes to press.</p>
        <p style="margin:26px 0"><a href="${link}" style="background:#E2581C;color:#F6EFE4;text-decoration:none;font:800 15px/1 Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;padding:14px 22px;border-radius:999px;display:inline-block">Confirm my subscription →</a></p>
        <p style="font-size:13px;color:#6E655B">If you didn't ask for this, ignore this email and you won't hear from us. The link expires in 3 days.</p>
      </div>`
    });
    send(200, { message: "Almost done: check your inbox and click the confirmation link." });
  } catch (e) {
    console.error("subscribe failed:", e.message);
    send(502, { error: "We couldn't sign you up just now. Please try again in a minute." });
  }
};
