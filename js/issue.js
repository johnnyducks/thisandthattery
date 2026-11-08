/*
 * ISSUE DATA — "Hammers & Mirrors"
 * ------------------------------------------------------------------
 * Everything on the page is rendered from this object, so a new pairing
 * (e.g. "Kettles & Kites") is just a new issue file.
 *
 * Products are REAL listings chosen from the catalog (catalog/data/hammers-mirrors.json).
 * Specs and claims come from each retailer's own product copy; shipping and return
 * terms from the retailers' policy pages, as checked on `asOf`. Re-check before publishing.
 *
 * Story tokens (usable in any `html` / `text` string):
 *   [[productId]]          -> inline product chip (name + price, clickable)
 *   [[productId|label]]    -> inline product chip with custom label
 *   {{productId.field}}    -> raw field value, e.g. {{m-laila.returns}}
 *   {{productId.price}}    -> formatted price
 */
window.TT_ISSUE = {
  id: "hammers-mirrors",
  number: "01",
  volume: "I",
  date: "November 2026",
  asOf: "November 7, 2026",
  this: "Hammers",
  that: "Mirrors",
  coverLine: "One makes the hole. The other shows you what you've done.",
  coverSub: "A field guide to striking and reflecting, in five chapters and one toolbox.",
  hero: ["h-stanley16", "m-laila"],

  retailers: {
    highland:    { name: "Highland Woodworking", freeShipOver: 99, returns: "60-day returns on stock items" },
    garrettwade: { name: "Garrett Wade", freeShipOver: null, shippingNote: "Shipping calculated at checkout", returns: "90-day returns from ship date" },
    mcgee:       { name: "McGee & Co.", freeShipOver: null, shippingNote: "Shipping calculated at checkout · contiguous US only", returns: "Varies by item: some mirrors are final sale" },
    simplehuman: { name: "simplehuman", freeShipOver: null, shippingNote: "Free standard shipping for members (contiguous US)", returns: "45-day risk-free returns" }
  },

  products: {
    "h-stanley7": {
      specAside: "Traditional wall mirrors would weigh significantly more.",
      tag: "Free shipping $99+",
      kind: "hammer", art: { type: "tack", handle: "#C9874A", head: "#3A3A3C", bg: "#E9B44C" },
      image: "https://cdn.shopify.com/s/files/1/0904/5167/3370/files/8855927_d.jpg?v=1768341201&width=900",
      brand: "Stanley", name: "7 oz Claw Hammer", short: "7 oz Claw Hammer",
      price: 18, retailer: "highland", url: "https://www.highlandwoodworking.com/products/stanley7ozclawhammer",
      shipping: "$8 shipping under $49 · free over $99", returns: "60-day returns",
      specs: { Head: "7 oz", "Total weight": "About 12 oz", Length: "11-1/2 in", Handle: "Wood", Model: "Stanley 51-613" },
      highlights: ["Small enough to drive brads and finishing nails with control", "Full claw, so a bent nail comes back out"],
      aiNote: "Highland notes that listed hammer weights are the head only. The whole hammer is about 12 oz, light enough for one-handed picture work."
    },
    "h-stanley16": {
      aside: "It will not show you your reflection, however hard you look.",
      tag: "Free shipping $99+",
      kind: "hammer", art: { type: "claw", handle: "#A8642F", head: "#4B4B4F", bg: "#D9D2C3" },
      image: "https://cdn.shopify.com/s/files/1/0904/5167/3370/files/171206.jpg?v=1751683446&width=900",
      brand: "Stanley", name: "16 oz Claw Hammer", short: "16 oz Claw Hammer",
      price: 23.5, retailer: "highland", url: "https://www.highlandwoodworking.com/products/stanley16ozclawhammer",
      shipping: "$8 shipping under $49 · free over $99", returns: "60-day returns",
      specs: { Head: "16 oz", Handle: "Wood", "Known for": "The standard weight for everyday carpentry", Sold: "Highland Woodworking" },
      highlights: ["A 16 oz head: the everyday standard", "Wooden handle"],
      aiNote: "The listing is short: 16 oz head, wooden handle. It's the plain answer, which is sometimes the right one."
    },
    "h-italian": {
      aside: "It has, to our knowledge, never reflected anything.",
      tag: "90-day returns",
      kind: "hammer", art: { type: "claw", handle: "#8E5A2B", head: "#55575B", bg: "#E2581C" },
      image: "https://cdn.shopify.com/s/files/1/0970/7107/1600/files/CarpenterHammer-gif500_39B0509__88244.1707253893.1280.1280.gif?v=1766156298&width=900",
      brand: "Garrett Wade", name: "Carpenter's Hammer", short: "Carpenter's Hammer",
      price: 26.35, retailer: "garrettwade", url: "https://www.garrettwade.com/products/italian-carpenters-hammer",
      shipping: "Shipping calculated at checkout", returns: "90-day returns from ship date",
      specs: { Head: "Not listed", "Known for": "Italian toolmaking and crafts heritage", Sold: "Garrett Wade" },
      highlights: ["Garrett Wade's pitch: the right hammer \"can become a part of the user\"", "Draws on Italy's toolmaking and crafts heritage"],
      aiNote: "Garrett Wade's copy opens: \"Some people might find the idea of having a 'favorite hammer' somewhat bizarre.\" They're selling the idea that one is worth having."
    },
    "h-mallet": {
      aside: "Beechwood is also a poor reflective surface.",
      tag: "90-day returns",
      kind: "hammer", art: { type: "mallet", handle: "#1F1C1A", head: "#C9874A", bg: "#8FA39A" },
      image: "https://cdn.shopify.com/s/files/1/0970/7107/1600/files/83R0203_3-1-2_Inch_BeechwoodMallet_3500A.jpg?v=1784739765&width=900",
      brand: "Garrett Wade", name: "3-1/2\" Beechwood Mallet", short: "Beechwood Mallet",
      price: 19.95, retailer: "garrettwade", url: "https://www.garrettwade.com/products/3-1-2-beechwood-mallet",
      shipping: "Shipping calculated at checkout", returns: "90-day returns from ship date",
      specs: { Head: "3-1/2 in", Weight: "12 oz", Material: "Solid beechwood" },
      highlights: ["Wood on wood, not steel on glass", "The smaller of Garrett Wade's two carpenter's mallets"],
      aiNote: "Sold alone or as part of a two-mallet set. Twelve ounces of beech taps a hook home without the ring of steel."
    },
    "h-picard": {
      aside: "The flat peen is not, despite its shape, a very small mirror.",
      tag: "Free shipping $99+",
      kind: "hammer", art: { type: "tack", handle: "#B07A45", head: "#2F2F31", bg: "#D9D2C3" },
      image: "https://cdn.shopify.com/s/files/1/0904/5167/3370/files/161721-01d.jpg?v=1768343530&width=900",
      brand: "Picard", name: "Cross Peen Hammer, 300 g", short: "Cross Peen Hammer",
      price: 38.99, retailer: "highland", url: "https://www.highlandwoodworking.com/products/picard-cross-peen-hammer",
      shipping: "$8 shipping under $49 · free over $99", returns: "60-day returns",
      specs: { Head: "300 g", Faces: "Round face + flat cross peen", Maker: "Picard" },
      highlights: ["\"An old cabinetmaker's favorite\"", "The flat peen slides between your fingers to start a small pin"],
      aiNote: "Highland's tip: hold the pin between your fingers and start it with the flat peen. It won't pinch, it slides between them."
    },

    "m-laila": {
      aside: "Completely unsuitable for driving nails.",
      tag: "Shatterproof glass",
      kind: "mirror", art: { type: "round", frame: "#B08A4A", bg: "#2B2826" },
      image: "https://cdn.shopify.com/s/files/1/1496/0124/products/LailaCircleMirror-MMIR0118-ABR-36-MAIN.jpg?v=1644337628&width=900",
      brand: "McGee & Co.", name: "Laila Circle Mirror", short: "Laila Circle Mirror",
      price: 658, retailer: "mcgee", url: "https://www.mcgeeandco.com/products/laila-circle-mirror",
      shipping: "Shipping calculated at checkout", returns: "Check the product page: McGee marks some mirrors final sale",
      specs: { Frame: "Iron, brass-plated finish", Hanger: "Genuine leather strap", Hardware: "Brass", Glass: "Shatterproof, moisture tolerant" },
      highlights: ["Hangs from a genuine leather strap with brass hardware: one point on the wall, not two", "Shatterproof glass, and moisture tolerance that suits a bathroom"],
      aiNote: "The listing doesn't give a weight. Iron and a big pane of glass are not light, so hang it from a stud or a hook rated well above what you think it weighs."
    },
    "m-juliette": {
      aside: "Convex hammer faces exist too. They reflect nothing.",
      tag: "Convex glass",
      kind: "mirror", art: { type: "convex", frame: "#B08A4A", bg: "#1F3A3D" },
      image: "https://cdn.shopify.com/s/files/1/1496/0124/files/JulietteConvexAntiquedMirror-MMIR0317-VBR-OS-MAIN-T_b5f79ee8-ceaa-4f0b-a2db-6d0a9cf64d1c.jpg?v=1691163196&width=900",
      brand: "McGee & Co.", name: "Juliette Convex Antiqued Mirror", short: "Juliette Convex Mirror",
      price: 98, retailer: "mcgee", url: "https://www.mcgeeandco.com/products/juliette-convex-antiqued-mirror",
      shipping: "Shipping calculated at checkout", returns: "Check the product page: McGee marks some mirrors final sale",
      specs: { Shape: "Convex", Frame: "Vintage brass finish", Style: "Antique-inspired" },
      highlights: ["Convex glass bends the whole room into one small circle", "Vintage-brass frame, antique-inspired"],
      aiNote: "New, not antique: the design \"takes inspiration from antiques.\" Shelf-sized, and the cheapest mirror in this issue apart from a set of plans."
    },
    "m-vallie": {
      aside: "Unlike a hammer, it should never be swung.",
      tag: "No hammer needed",
      kind: "mirror", art: { type: "arch", frame: "#E9DCC6", bg: "#C9B79C" },
      image: "https://cdn.shopify.com/s/files/1/1496/0124/products/VallieArchedFloorMirror-MMIR0322-LIN-32x72-MAIN.jpg?v=1678916092&width=900",
      brand: "McGee & Co.", name: "Vallie Arched Floor Mirror", short: "Vallie Arched Floor Mirror",
      price: 1599, retailer: "mcgee", url: "https://www.mcgeeandco.com/products/vallie-arched-floor-mirror",
      shipping: "Shipping calculated at checkout", returns: "Check the product page: McGee marks some mirrors final sale",
      specs: { Frame: "Ivory painted, linen-wrapped", Shape: "Soft arch", Use: "Floor-standing" },
      highlights: ["A linen-wrapped frame: texture where most mirrors have metal", "Floor-standing, so it needs no hammer at all"],
      aiNote: "The splurge of the issue. It leans, so it's the one mirror here you can own without making a hole."
    },
    "m-fold": {
      aside: "At 10x, even a 7-ounce hammer looks enormous.",
      tag: "45-day returns",
      kind: "mirror", art: { type: "hand", frame: "#9AA0A6", bg: "#F2E3C9" },
      image: "https://cdn.shopify.com/s/files/1/2804/6630/files/front_brushed.png?v=1787378574&width=900",
      brand: "simplehuman", name: "Sensor Mirror Fold, 10x Magnification", short: "Sensor Mirror Fold 10x",
      price: 130, retailer: "simplehuman", url: "https://www.simplehuman.com/products/sensor-mirror-fold",
      shipping: "Free standard shipping for members", returns: "45-day risk-free returns",
      specs: { Magnification: "10x", Light: "600–800 lux, adjustable", LEDs: "\"Surgical-grade\"", Format: "Folds flat for travel" },
      highlights: ["Lights up on its own when your face comes close", "Light meant to simulate natural sunlight, so colors read true"],
      aiNote: "Built for makeup. At 10x it's also the best splinter-finder in the house, and after Chapter One you may need one."
    },
    "m-courting": {
      aside: "The only mirror in this issue that weighs less than the hammers.",
      tag: "Plans ship free",
      kind: "mirror", art: { type: "arch", frame: "#6B4226", bg: "#E9B44C" },
      image: "https://cdn.shopify.com/s/files/1/0970/7107/1600/files/12__43229__60396.1593447506.1280.1280.jpg?v=1766154987&width=900",
      brand: "Garrett Wade", name: "Courting Mirror Plans (Stock #12)", short: "Courting Mirror Plans",
      price: 5, retailer: "garrettwade", url: "https://www.garrettwade.com/products/courting-mirror-stock-12",
      shipping: "Plans ship free by First Class mail", returns: "90-day returns from ship date",
      specs: { Original: "c. 1780, mahogany on white pine", Size: "26-3/8 × 15 in", Plans: "Full size", Drawn: "Carlyle Lynch (1909–1989)" },
      highlights: ["Full-size plans for an exact reproduction of a 1780 mirror", "Drawn by Carlyle Lynch, a teacher of woodwork, drafting and metalwork"],
      aiNote: "Not a mirror, a set of plans for one. You supply the mahogany, the glass and, yes, the hammer."
    }
  },

  chapters: [
    {
      id: "wall", numeral: "I", kicker: "Chapter One", title: "The Bare Wall",
      dek: "Every mirror starts as a blank wall and a decision.",
      blocks: [
        { type: "prose", dropcap: true, html: "It is a Saturday. The wall in the hallway has been bare since you moved in, and you have finally decided it should show you your own face on the way out the door. This is how it starts: with one small hole. You do not need a big hammer for a small hole. You need the [[h-stanley7|7-ounce Stanley]]: eleven and a half inches long and about twelve ounces in the hand, made for the brads and finishing nails a picture hook wants." },
        { type: "feature", product: "h-stanley7", side: "right", tilt: 3, html: "<p>A small claw hammer is the most underrated tool in the drawer. Highland Woodworking's listing says it plainly: its size lets you drive small nails \"with more control and finesse.\"</p><p>It costs <strong>{{h-stanley7.price}}</strong>. Highland charges $8 shipping under $49 and ships free over $99, and takes stock items back within 60 days. Hold that $99 in mind for Chapter Three.</p>" },
        { type: "pullquote", text: "You do not need a big hammer for a small hole.", cite: "This & Thattery house rule No. 1" }
      ]
    },
    {
      id: "glass", numeral: "II", kicker: "Chapter Two", title: "The Object of Reflection",
      dek: "A close look at the mirror you'll be hanging, from the front and from the back.",
      blocks: [
        { type: "prose", html: "Here is the problem with your plan. The mirror you want is the [[m-laila]]: an iron frame, a brass-plated finish, and a big pane of glass. It hangs from a genuine leather strap, which means everything rides on one point in the wall. One point is easy to place and hard to get wrong. It is also where all the weight goes. Look closer." },
        { type: "specimen", product: "m-laila", callouts: [
          { x: 50, y: 10, side: "right", label: "Hanger", text: "Genuine leather strap with brass hardware. One hook, one hole, and the strap does the leveling." },
          { x: 30, y: 36, side: "left", label: "Frame", text: "Iron with a brass-plated finish. Handsome, and not light." },
          { x: 62, y: 58, side: "right", label: "Glass", text: "Shatterproof and moisture tolerant, so a steamy bathroom is fair game." },
          { x: 24, y: 80, side: "left", label: "Fine print", text: "McGee & Co. marks some mirrors final sale and charges return shipping on others. Check the product page before you buy." }
        ] },
        { type: "prose", html: "The listing doesn't give a weight, so assume more than you'd like. The tack-sized nail stays in the drawer. This hook wants a stud or a properly rated anchor, and that is a job for a heavier hand." }
      ]
    },
    {
      id: "duel", numeral: "III", kicker: "Chapter Three", title: "The Heavier Hand",
      dek: "Two claw hammers, one wall, and a shipping threshold.",
      blocks: [
        { type: "duel", products: ["h-stanley16", "h-italian"], rows: [
          ["Price", "price", "price"],
          ["Head", "specs.Head", "specs.Head"],
          ["Known for", "specs.Known for", "specs.Known for"],
          ["Shop", "specs.Sold", "specs.Sold"],
          ["Returns", "returns", "returns"],
          ["Ships", "shipping", "shipping"]
        ], verdict: "Both cost about the same. The [[h-stanley16|Stanley]] is the plain answer: a 16-ounce head and a wooden handle. The [[h-italian|Garrett Wade Carpenter's Hammer]] is the romantic one, built on Italy's toolmaking tradition and sold on the idea of a <em>favorite</em> hammer. For one mirror, either will do. If you'll swing it for twenty years, Garrett Wade's 90-day return window gives you time to find out whether you love it." },
        { type: "prose", cols: true, html: "Now the shipping math, because Highland Woodworking has a ladder. The two Stanleys come to $41.50 and ship for $8. Add the [[h-picard|Picard cross peen]], \"an old cabinetmaker's favorite,\" and you're at $80.49, which moves you into the $12 tier. Free shipping starts at $99, so you'd need $18.51 more. The toolbox in the corner does this sum for you as you go." }
      ]
    },
    {
      id: "swapmeet",
      module: {
        // Reusable marketplace interstitial (js/market.js). Swap `platform` for any registered adapter.
        platform: "ebay",
        adapter: { endpoint: "/api/ebay/search" },   // Vercel function (api/ebay/search.js); falls back to sample data if unavailable
        kicker: "Intermission",
        title: "The Swap Meet",
        consoleName: "TT Swap Meet",
        dek: "Before the superstition chapter, a break. These are secondhand hammers and mirrors that strangers are selling right now. Search, set your zip, and see what's nearby.",
        defaultQuery: "vintage hammer",
        presets: ["vintage hammer", "sunburst mirror", "tack hammer", "round walnut mirror", "convex mirror", "hammer lot"]
      }
    },
    {
      id: "luck", numeral: "IV", kicker: "Chapter Four", title: "Seven Years",
      dek: "On superstition, softer blows, and reading return policies before you swing.",
      blocks: [
        { type: "pair", products: ["h-mallet", "m-juliette"], html: "<p>A hammer near a mirror is a story about luck. The old rule says break one and it's seven years bad. The newer rule says <em>read the return policy first</em>.</p><p>The [[m-juliette]] is the small temptation of this issue: convex glass in a vintage-brass frame, bending the whole room into one circle for {{m-juliette.price}}. It comes from the same shop as the Laila, where some mirrors are final sale. So bring the [[h-mallet]] to the last few taps on the hook: twelve ounces of solid beech, wood on wood instead of steel near glass.</p>" },
        { type: "ticket", product: "m-juliette" },
        { type: "pullquote", text: "Break a mirror: seven years. Break a return window: forever.", cite: "Overheard in aisle 9" }
      ]
    },
    {
      id: "lookback", numeral: "V", kicker: "Chapter Five", title: "The Look Back",
      dek: "The wall is done. Now there are mirrors everywhere you look.",
      blocks: [
        { type: "prose", dropcap: true, html: "It's on the wall. It's level, mostly. You stand back, and the mirror shows you a hallway with a person holding a hammer, looking pleased. From here it gets out of hand. The bedroom could take the [[m-vallie]], a linen-wrapped arch that leans against the wall and needs no hammer at all. The bathroom gets the [[m-fold]], which lights itself when you lean in and, at 10x, finds the splinter Chapter One left you. And for {{m-courting.price}}, Garrett Wade will mail you full-size plans for a mahogany mirror made around 1780. Now the hammer has a second project." },
        { type: "collage", products: ["m-vallie", "m-fold", "m-courting", "h-picard"] },
        { type: "prose", html: "Hammers make marks and mirrors show them. Owning both means you get to change the room and then watch yourself in it. Your kit is below, sorted by shop, with every shipping threshold worked out." }
      ]
    }
  ]
};
