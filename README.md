# This & Thattery

An affiliate magazine that pairs two unrelated things and tells the story between them.
Each issue is one long scrolling page. Product images sit in 3D "boxed" frames, and every
pictured item is for sale. The story works real product details (specs, shipping, return
terms) into the text.

**Issue 01: Hammers & Mirrors**

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## How it's put together

| File | What it does |
| --- | --- |
| `js/issue.js` | **The issue.** Products, retailers and story chapters as data. This is the shape the AI product-analysis step should output. |
| `js/render.js` | Turns the issue data into the page. Also runs the "kit" (cart-like tray grouped by retailer, with free-shipping progress). |
| `js/art.js` | Placeholder 1940s-poster product illustrations. Replace with real product images when the feeds are connected. |
| `css/styles.css` | 1940s picture-magazine styling and the extruded 3D box frames. |

### Story tokens

You can use these inside any story text in `issue.js`:

- `[[productId]]` or `[[productId|custom label]]` renders an inline product chip with its price that jumps to the product.
- `{{productId.field}}` inserts a product field, e.g. `{{m-orbit.returns}}`, `{{h-claw.price}}`, `{{m-orbit.specs.Weight}}`.

### Block layouts

`prose`, `feature` (frame + deep-dive spec sheet), `specimen` (annotated plate with numbered
callouts), `duel` (side-by-side comparison), `pair`, `ticket` (shipping/returns fine print),
`pullquote`, `collage`.

## Status

Design and format only. All product data is **sample content**: invented brands, prices and
terms. Affiliate links point to `#`. Integrations (product feeds, affiliate links, real
imagery, AI analysis) come later.
