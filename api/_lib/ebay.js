/*
 * eBay Browse API client used by the Vercel function at /api/ebay/search.
 * (Files under api/_lib are not routes. Vercel skips underscore-prefixed paths.)
 *
 * Env vars (set in Vercel → Project → Settings → Environment Variables):
 *   EBAY_CLIENT_ID      App ID (Client ID) from developer.ebay.com
 *   EBAY_CLIENT_SECRET  Cert ID (Client Secret)
 *   EPN_CAMPAIGN_ID     optional: eBay Partner Network campaign ID → affiliate links
 *   EBAY_ENV            optional: "sandbox" to use eBay's sandbox; default production
 *
 * Not yet tested against live eBay: verify filter names against the Browse API docs.
 */
const API = process.env.EBAY_ENV === "sandbox" ? "https://api.sandbox.ebay.com" : "https://api.ebay.com";

let token = null, tokenExp = 0;   // reused across warm invocations

async function appToken() {
  if (token && Date.now() < tokenExp - 60e3) return token;
  const { EBAY_CLIENT_ID, EBAY_CLIENT_SECRET } = process.env;
  const res = await fetch(`${API}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString("base64")
    },
    body: "grant_type=client_credentials&scope=" + encodeURIComponent("https://api.ebay.com/oauth/api_scope")
  });
  if (!res.ok) throw new Error(`eBay token request failed (${res.status})`);
  const j = await res.json();
  token = j.access_token; tokenExp = Date.now() + j.expires_in * 1000;
  return token;
}

const SORTS = { best: "", ending: "endingSoonest", priceAsc: "price", priceDesc: "-price", distance: "distance" };

async function search({ q = "", zip = "", radius = "", pickupOnly = "", format = "all", sort = "best" }) {
  const filters = [];
  if (format === "auction") filters.push("buyingOptions:{AUCTION}");
  if (format === "fixed") filters.push("buyingOptions:{FIXED_PRICE|BEST_OFFER}");
  // eBay's radius search is pickup-based: listings that offer pickup near the zip.
  const local = zip && (pickupOnly === "true" || +radius > 0);
  if (local) {
    filters.push("pickupCountry:US", `pickupPostalCode:${zip}`, `pickupRadius:${+radius || 100}`, "pickupRadiusUnit:mi");
    if (pickupOnly === "true") filters.push("deliveryOptions:{SELLER_ARRANGED_LOCAL_PICKUP}");
  }
  const params = new URLSearchParams({ q: q.trim() || "vintage hammer", limit: "24" });
  if (filters.length) params.set("filter", filters.join(","));
  const s = SORTS[sort]; if (s && (s !== "distance" || local)) params.set("sort", s);

  const ctx = [
    process.env.EPN_CAMPAIGN_ID && `affiliateCampaignId=${process.env.EPN_CAMPAIGN_ID}`,
    zip && `contextualLocation=${encodeURIComponent(`country=US,zip=${zip}`)}`
  ].filter(Boolean).join(",");

  const res = await fetch(`${API}/buy/browse/v1/item_summary/search?${params}`, {
    headers: {
      Authorization: `Bearer ${await appToken()}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      ...(ctx && { "X-EBAY-C-ENDUSERCTX": ctx })   // affiliate links + shipping estimates to the buyer's zip
    }
  });
  if (!res.ok) throw new Error(`eBay search failed (${res.status})`);
  const j = await res.json();

  // eBay item summaries -> the module's normalized item shape (documented in js/market.js)
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

module.exports = { search };
