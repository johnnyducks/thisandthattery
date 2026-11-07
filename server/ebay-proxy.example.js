/*
 * Example eBay proxy for the TT_MARKET module (Node 18+, no dependencies).
 * NOT YET TESTED against live eBay: verify parameter names against the
 * Browse API docs when wiring this up.
 *
 * Why a proxy: the eBay Browse API needs an OAuth application token minted with
 * your client secret. That secret must never ship to the browser.
 *
 *   EBAY_CLIENT_ID=... EBAY_CLIENT_SECRET=... EPN_CAMPAIGN_ID=... node server/ebay-proxy.example.js
 *   -> GET http://localhost:8787/api/ebay/search?q=brass+mirror&zip=60614&radius=25&pickupOnly=true&format=auction&sort=ending
 *
 * Then set `adapter: { endpoint: "http://localhost:8787/api/ebay/search" }` on the module in js/issue.js.
 */
const http = require("http");

const { EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, EPN_CAMPAIGN_ID = "", PORT = 8787, ALLOW_ORIGIN = "*" } = process.env;
const API = "https://api.ebay.com";

let token = null, tokenExp = 0;
async function appToken() {
  if (token && Date.now() < tokenExp - 60e3) return token;
  const res = await fetch(`${API}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString("base64")
    },
    body: "grant_type=client_credentials&scope=" + encodeURIComponent("https://api.ebay.com/oauth/api_scope")
  });
  if (!res.ok) throw new Error("token " + res.status);
  const j = await res.json();
  token = j.access_token; tokenExp = Date.now() + j.expires_in * 1000;
  return token;
}

const SORTS = { best: "", ending: "endingSoonest", priceAsc: "price", priceDesc: "-price", distance: "distance" };

async function search({ q = "hammer", zip = "", radius = "", pickupOnly = "", format = "all", sort = "best" }) {
  const filters = [];
  if (format === "auction") filters.push("buyingOptions:{AUCTION}");
  if (format === "fixed") filters.push("buyingOptions:{FIXED_PRICE|BEST_OFFER}");
  // eBay's radius search is pickup-based: it finds listings that offer pickup near the zip.
  const local = zip && (pickupOnly === "true" || +radius > 0);
  if (local) {
    filters.push("pickupCountry:US", `pickupPostalCode:${zip}`, `pickupRadius:${+radius || 100}`, "pickupRadiusUnit:mi");
    if (pickupOnly === "true") filters.push("deliveryOptions:{SELLER_ARRANGED_LOCAL_PICKUP}");
  }
  const params = new URLSearchParams({ q, limit: "24" });
  if (filters.length) params.set("filter", filters.join(","));
  const s = SORTS[sort]; if (s && (s !== "distance" || local)) params.set("sort", s);

  const ctx = [EPN_CAMPAIGN_ID && `affiliateCampaignId=${EPN_CAMPAIGN_ID}`, zip && `contextualLocation=${encodeURIComponent(`country=US,zip=${zip}`)}`].filter(Boolean).join(",");
  const res = await fetch(`${API}/buy/browse/v1/item_summary/search?${params}`, {
    headers: {
      Authorization: `Bearer ${await appToken()}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      ...(ctx && { "X-EBAY-C-ENDUSERCTX": ctx })   // affiliate links + shipping estimates to the buyer's zip
    }
  });
  if (!res.ok) throw new Error("search " + res.status);
  const j = await res.json();

  // Map eBay item summaries -> the module's normalized item shape (see js/market.js)
  const items = (j.itemSummaries || []).map(it => {
    const auction = (it.buyingOptions || []).includes("AUCTION");
    const ship = it.shippingOptions?.[0]?.shippingCost;
    return {
      id: it.itemId,
      title: it.title,
      url: it.itemAffiliateWebUrl || it.itemWebUrl,
      image: it.image?.imageUrl || it.thumbnailImages?.[0]?.imageUrl,
      price: +(auction && it.currentBidPrice ? it.currentBidPrice.value : it.price?.value),
      currency: it.price?.currency || "USD",
      format: auction ? "auction" : "fixed",
      bids: it.bidCount,
      endsAt: it.itemEndDate ? Date.parse(it.itemEndDate) : undefined,
      bestOffer: (it.buyingOptions || []).includes("BEST_OFFER"),
      condition: it.condition,
      shippingCost: ship ? +ship.value : null,
      location: {
        city: it.itemLocation?.city, region: it.itemLocation?.stateOrProvince, postal: it.itemLocation?.postalCode,
        distanceMi: it.distanceFromPickupLocation ? Math.round(+it.distanceFromPickupLocation.value) : undefined
      },
      localPickup: !!(it.pickupOptions && it.pickupOptions.length),
      seller: { name: it.seller?.username, feedbackPct: it.seller?.feedbackPercentage ? +it.seller.feedbackPercentage : undefined }
    };
  });
  return { total: j.total ?? items.length, items };
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  res.setHeader("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  res.setHeader("Content-Type", "application/json");
  if (url.pathname !== "/api/ebay/search") { res.statusCode = 404; return res.end("{}"); }
  try {
    const params = Object.fromEntries(url.searchParams);
    if (params.zip && !/^\d{5}$/.test(params.zip)) delete params.zip;
    res.setHeader("Cache-Control", "public, max-age=120");
    res.end(JSON.stringify(await search(params)));
  } catch (e) {
    res.statusCode = 502; res.end(JSON.stringify({ error: String(e.message || e) }));
  }
}).listen(PORT, () => console.log(`eBay proxy on :${PORT}`));
