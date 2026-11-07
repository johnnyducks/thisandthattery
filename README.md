# This & Thattery

An affiliate magazine that pairs two unrelated things and tells the story between them.
Each issue is one long scrolling page. Product images sit in 3D "boxed" frames, and every
pictured item is for sale. The story works real product details (specs, shipping, return
terms) into the text.

**Issue 01: Hammers & Mirrors**

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000   # static only; the Swap Meet uses sample data
npx vercel dev                # static + /api functions, reads env vars from Vercel
```

## Deploy (Vercel)

1. Import the repo in Vercel. Framework Preset **Other**, no build command, output directory empty.
2. Add environment variables (Settings → Environment Variables):

   | Name | Value |
   | --- | --- |
   | `EBAY_CLIENT_ID` | App ID (Client ID) from developer.ebay.com, production keyset |
   | `EBAY_CLIENT_SECRET` | Cert ID (Client Secret) |
   | `EPN_CAMPAIGN_ID` | optional: eBay Partner Network campaign ID, so links earn commission |
   | `EBAY_ENV` | optional: `sandbox` to test against eBay's sandbox |

3. Redeploy. The Swap Meet's status label changes from "Sample data · feed offline" to "On air".

Without the keys the function returns 503 and the module quietly uses sample listings.
Identical searches are cached at Vercel's edge for 2 minutes to save eBay API quota.

## How it's put together

| File | What it does |
| --- | --- |
| `js/issue.js` | **The issue.** Products, retailers and story chapters as data. This is the shape the AI product-analysis step should output. |
| `js/render.js` | Turns the issue data into the page. Also runs the "kit" (cart-like tray grouped by retailer, with free-shipping progress). |
| `js/art.js` | Placeholder 1940s-poster product illustrations. Replace with real product images when the feeds are connected. |
| `js/market.js` | **Marketplace interstitial**: a reusable, searchable carousel micro-app that works with any store through adapters. |
| `api/ebay/search.js` | Vercel serverless function that proxies eBay's Browse API (keeps credentials off the page). Client code is in `api/_lib/ebay.js`. |
| `css/styles.css` | 1940s picture-magazine styling and the extruded 3D box frames. |

### Story tokens

You can use these inside any story text in `issue.js`:

- `[[productId]]` or `[[productId|custom label]]` renders an inline product chip with its price that jumps to the product.
- `{{productId.field}}` inserts a product field, e.g. `{{m-orbit.returns}}`, `{{h-claw.price}}`, `{{m-orbit.specs.Weight}}`.

### Block layouts

`prose`, `feature` (frame + deep-dive spec sheet), `specimen` (annotated plate with numbered
callouts), `duel` (side-by-side comparison), `pair`, `ticket` (shipping/returns fine print),
`pullquote`, `collage`.

## Marketplace interstitial (`js/market.js`)

A full-width "Intermission" band placed between chapters. It's styled as a 1940s radio console:
search field, zip code and radius, preset buttons, Buy It Now / Auction toggle, local-pickup
switch, and sorting. Results show in a swipeable, draggable, keyboard-friendly carousel with
live auction countdowns. Listings can be added to the page's kit, where they show up in the
receipt grouped under the platform.

Add one to an issue as an entry in `chapters`:

```js
{ id: "swapmeet", module: {
    platform: "ebay",                       // any registered adapter
    adapter: { endpoint: "/api/ebay/search" },   // leave "" to use sample data
    kicker: "Intermission", title: "The Swap Meet", dek: "…",
    defaultQuery: "vintage hammer",
    presets: ["vintage hammer", "sunburst mirror"]
} }
```

**Adding another store or platform:** register an adapter that returns normalized items
(the format is documented at the top of `market.js`). The controls hide themselves based on the
adapter's `capabilities`. For example, a store with no auctions or local pickup won't show
those controls.

```js
TT_MARKET.register("etsy", opts => ({
  id: "etsy", label: "Etsy",
  capabilities: { zip: false, radius: false, pickup: false, auction: false, sorts: ["best", "priceAsc", "priceDesc"] },
  async search({ q, sort }) { const r = await fetch(`${opts.endpoint}?q=${encodeURIComponent(q)}&sort=${sort}`); return { ...(await r.json()), live: true }; }
}));
```

**eBay:** the Browse API needs an OAuth app token, so requests go through a Vercel function
(`api/ebay/search.js`). It also passes the eBay Partner Network campaign ID so links
come back as affiliate links, and the buyer's zip code for shipping estimates. Note that eBay's
radius search works through local pickup: it finds listings offering pickup within N miles. If
the endpoint is unset or fails, the module falls back to sample data and its status light says so.

## Status

Design and format only. All product data is **sample content**: invented brands, prices and
terms. Affiliate links point to `#`. Integrations (product feeds, affiliate links, real
imagery, AI analysis) come later.
