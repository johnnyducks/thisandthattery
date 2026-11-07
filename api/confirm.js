/*
 * GET /api/confirm?token=…  (the link in the confirmation email)
 * Verifies the signed token, marks the member subscribed in Mailgun,
 * then redirects to /subscribed.html?status=ok|expired|error
 */
const mg = require("./_lib/mailgun");

module.exports = async (req, res) => {
  const go = status => { res.statusCode = 302; res.setHeader("Location", `/subscribed.html?status=${status}`); res.setHeader("Cache-Control", "no-store"); res.end(); };
  if (!mg.configured()) return go("error");
  const email = mg.verify((req.query || {}).token);
  if (!email) return go("expired");
  try { await mg.confirmMember(email); go("ok"); }
  catch (e) { console.error("confirm failed:", e.message); go(e.status === 404 ? "expired" : "error"); }
};
