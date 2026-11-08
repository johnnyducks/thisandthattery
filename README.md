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
| `catalog/pairings/*.json` | Pairing briefs: product types, angles, sources to crawl. |
| `scripts/crawl.js` | Catalog crawler (run by `.github/workflows/catalog.yml`). |
| `catalog.html`, `js/catalog.js` | The Back Room: private catalog browser, shortlist and export. |
| `api/import.js` | Reads one product page into a catalog item ("Paste a link"). |
| `js/search.js`, `scripts/build-search-index.js` | Site-wide product search and the index it reads. |
| `js/site.js` | Shared site chrome: the thin sticky nav bar and the newsletter form. |
| `api/subscribe.js`, `api/confirm.js` | Newsletter signup with double opt-in through Mailgun (`api/_lib/mailgun.js`). |
| `sponsor.html`, `js/sponsors.js` | One-brand collection pages ("Sponsored by" / "Featured brand"). |
| `css/styles.css` | 1940s picture-magazine styling and the extruded 3D box frames. |

### Story tokens

You can use these inside any story text in `issue.js`:

- `[[productId]]` or `[[productId|custom label]]` renders an inline product chip with its price that jumps to the product.
- `{{productId.field}}` inserts a product field, e.g. `{{m-orbit.returns}}`, `{{h-claw.price}}`, `{{m-orbit.specs.Weight}}`.

### Block layouts

`prose`, `feature` (frame + deep-dive spec sheet), `specimen` (annotated plate with numbered
callouts), `duel` (side-by-side comparison), `pair`, `ticket` (shipping/returns fine print),
`pullquote`, `collage`.

## House voice: cross-talk asides

The running in-joke: now and then, one dry line measures a product against the *other* half of the
pairing, usually to point out they have nothing in common. *"Traditional wall mirrors would weigh
significantly more."*

Where they live: `aside` (under a product in its frame) and `specAside` (end of the spec sheet) on
products in `js/issue.js` and `js/sponsors.js`, and `<p class="aside-other">` in editorial pages.
They render small, muted and italic with a faint ↔, so they never compete with the content.

Rules for writers, and for the AI content prompt:

1. **One sentence, at most ~15 words.** Deadpan. No exclamation marks, no puns that need a wink.
2. **Always true,** usually obviously so. The joke is that it's correct and beside the point.
   Never invent facts, specs or history for a laugh.
3. **About the *other* category,** stated as a sober contrast ("Mirrors make poor levers").
4. **Rare:** at most one per product and one per lesson block. Never in prices, shipping, returns,
   safety notes or disclosures (except as a closing line after the real safety advice).
5. **Placed last,** after the useful information, like a footnote you weren't expecting.

## Site search

Always on screen: a **Search** pill bottom-left on every page, a search button in the sticky nav,
and the shortcuts `/` or Cmd/Ctrl+K. It searches `catalog/search-index.json`, a compact index
(about 120 KB) of every crawled catalog plus the issue's products, sponsor collections and
lessons. Results are grouped: **In this issue**, then **Learn**, then one group per product type
from the pairing briefs, then a "search secondhand on eBay" handoff to the Swap Meet. It tolerates
partial words and one typo, reads "under $25" in the query as a price filter, and lets readers add
results to the kit.

The index is rebuilt by `node scripts/build-search-index.js`, which the **Build catalog**
workflow runs after every crawl. Run it by hand after editing `js/issue.js` or `js/sponsors.js`.

## Newsletter (Mailgun)

The signup form (`#newsletter`, linked from the nav bar's **Subscribe** button) uses **double opt-in**:

1. `POST /api/subscribe` adds the address to the Mailgun list as *not subscribed* and emails a confirmation link.
2. The link (`/api/confirm?token=…`, signed, valid for 3 days) marks them subscribed and lands on `/subscribed.html`.

Bots that fill the hidden field are quietly ignored. Without the env vars below, the form says
signup isn't switched on yet.

| Env var | Value |
| --- | --- |
| `MAILGUN_API_KEY` | Private API key (Mailgun → API Security) |
| `MAILGUN_DOMAIN` | Verified sending domain, e.g. `mg.thisandthattery.com` |
| `MAILGUN_LIST` | Mailing list address, e.g. `dispatch@mg.thisandthattery.com` |
| `MAILGUN_FROM` | e.g. `This & Thattery <dispatch@mg.thisandthattery.com>` |
| `NEWSLETTER_SECRET` | Long random string (signs confirmation links) |
| `SITE_URL` | Your production URL, e.g. `https://thisandthattery.com` |
| `MAILGUN_REGION` | Optional: `eu` if the Mailgun account is in the EU region |

To send an issue, email the list address from Mailgun (or its API). Include `%mailing_list_unsubscribe_url%`
in every newsletter so readers can unsubscribe, which is required by law.

## Sponsor / featured-brand pages

`sponsor.html?brand=<id>` renders one brand's collection from `js/sponsors.js`. The nav bar, cover
nav ("Brands") and footer link to `active`. Set `paid: true` only for a real paid sponsorship: it
switches the label to "Sponsored by …" and shows a sponsorship disclosure (FTC rules). The included
Garrett Wade collection is an **unpaid example**, labelled "Featured brand".

## Catalog pipeline (finding real products)

How a pairing goes from idea to a catalog you pick from:

1. **Brief:** `catalog/pairings/<pairing>.json` describes the pairing. It lists the product **types**
   (claw, tack, genno…; round, sunburst, convex…) with the words that identify them, the editorial
   **angles** (everyday, heirloom, vintage, oddball), and the **sources** (shops) to pull from.
2. **Crawl:** on GitHub, go to **Actions → Build catalog → Run workflow**. For each source,
   `scripts/crawl.js`:
   - checks robots.txt
   - uses the shop's public Shopify product feed if it has one
   - otherwise reads the sitemap and only the product pages whose URLs look relevant
   - reads each page's schema.org product data (name, brand, images, price, stock, shipping, returns)
   - sorts every product into a type and an angle

   Results are committed to `catalog/data/<pairing>.json`, along with a per-source report. It also
   re-runs every Monday to refresh prices.
3. **Narrow down:** open **`/catalog.html`** (not indexed by search engines). Filter by side, type,
   angle, source, price or text. Star products into a shortlist with notes, and paste any product
   link to add it by hand (through `/api/import`).
4. **Export:** the shortlist exports in the same shape as `products` and `retailers` in `js/issue.js`,
   so the chosen products drop straight into a story. Products with an `image` show the real photo
   in the 3D frames instead of the placeholder art.

Links stay as plain retailer URLs, so Skimlinks turns them into affiliate links when clicked.
Some big retailers block crawlers; the report marks them as blocked. Those need an affiliate-network
feed or pasted links.

Run locally: `node scripts/crawl.js --pairing hammers-mirrors --sources schoolhouse --max-pages 20`

Optional env var `IMPORT_TOKEN` locks `/api/import` behind `?token=…`.

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

Issue 01 now features **real products** picked from the catalog. Specs come from retailer listings, and
shipping and return terms from the retailers' policy pages (checked on the date in `asOf`).
Re-check prices and terms before publishing. Links are plain retailer URLs that Skimlinks monetizes.
