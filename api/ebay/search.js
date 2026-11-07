/*
 * Vercel serverless function: GET /api/ebay/search
 *   ?q=brass+mirror&zip=60614&radius=25&pickupOnly=true&format=auction&sort=ending
 * -> { total, items: [normalized item] }   (consumed by the Swap Meet module, js/market.js)
 *
 * Without EBAY_CLIENT_ID / EBAY_CLIENT_SECRET it answers 503, and the module
 * falls back to sample listings ("Sample data · feed offline").
 */
const { search } = require("../_lib/ebay");

const FORMATS = ["all", "auction", "fixed"];
const SORTS = ["best", "ending", "priceAsc", "priceDesc", "distance"];

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "GET") { res.statusCode = 405; return res.end(JSON.stringify({ error: "GET only" })); }
  if (!process.env.EBAY_CLIENT_ID || !process.env.EBAY_CLIENT_SECRET) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ error: "eBay credentials not configured" }));
  }

  // validate input before it reaches eBay
  const p = req.query || {};
  const params = {
    q: String(p.q || "").slice(0, 100),
    zip: /^\d{5}$/.test(p.zip || "") ? p.zip : "",
    radius: String(Math.min(Math.max(parseInt(p.radius, 10) || 0, 0), 500)),
    pickupOnly: p.pickupOnly === "true" ? "true" : "",
    format: FORMATS.includes(p.format) ? p.format : "all",
    sort: SORTS.includes(p.sort) ? p.sort : "best"
  };

  try {
    const data = await search(params);
    // cache identical searches at Vercel's edge: saves eBay API quota (5,000 calls/day by default)
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    res.end(JSON.stringify(data));
  } catch (e) {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: String(e.message || e) }));
  }
};
