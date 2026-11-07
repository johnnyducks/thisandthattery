/*
 * ISSUE DATA — "Hammers & Mirrors"
 * ------------------------------------------------------------------
 * This is the shape the AI product-analysis pipeline should eventually emit.
 * Everything on the page is rendered from this object, so a new pairing
 * (e.g. "Kettles & Kites") is just a new issue file.
 *
 * NOTE: products below are SAMPLE / PLACEHOLDER data for design work.
 * Brands, prices, and terms are invented; affiliate URLs are "#".
 *
 * Story tokens (usable in any `html` / `text` string):
 *   [[productId]]          -> inline product chip (name + price, clickable)
 *   [[productId|label]]    -> inline product chip with custom label
 *   {{productId.field}}    -> raw field value, e.g. {{m-orbit.returns}}
 *   {{productId.price}}    -> formatted price
 */
window.TT_ISSUE = {
  id: "hammers-mirrors",
  number: "01",
  volume: "I",
  date: "November 2026",
  this: "Hammers",
  that: "Mirrors",
  coverLine: "One makes the hole. The other shows you what you've done.",
  coverSub: "A field guide to striking and reflecting, in five chapters and one toolbox.",

  retailers: {
    hardline: { name: "Hardline Supply", freeShipOver: 25, returns: "30-day returns" },
    pellworth: { name: "Pellworth & Co.", freeShipOver: 0, returns: "90-day returns" },
    hollis: { name: "Hollis Home", freeShipOver: 0, returns: "30-day returns, free pickup" },
    gilt: { name: "Gilt & Gable", freeShipOver: 75, returns: "14-day returns, buyer pays return shipping" }
  },

  products: {
    "h-tack": {
      kind: "hammer", art: { type: "tack", handle: "#C9874A", head: "#3A3A3C", bg: "#E9B44C" },
      brand: "Pellworth", name: "Magnetic Tack Hammer, 5 oz", short: "Tack Hammer",
      price: 14.5, retailer: "pellworth", url: "#",
      shipping: "Free 2-day shipping", returns: "90-day returns, no questions",
      rating: 4.8, reviews: 1912,
      specs: { Weight: "5 oz", Length: "10.25 in", Head: "Split face, one magnetized", Handle: "Ash, oiled" },
      highlights: ["Magnetized face holds the nail so your fingers don't have to", "Small enough to steer a picture hook without denting plaster"],
      aiNote: "Reviewers repeatedly mention using it for picture hanging and upholstery tacks. A few say the magnet weakens after heavy use."
    },
    "h-claw": {
      kind: "hammer", art: { type: "claw", handle: "#A8642F", head: "#4B4B4F", bg: "#D9D2C3" },
      brand: "Ironhollow", name: "16 oz Curved Claw Hammer", short: "Claw Hammer",
      price: 24.99, retailer: "hardline", url: "#",
      shipping: "Free shipping on orders over $25", returns: "30-day returns + lifetime warranty on the head",
      rating: 4.7, reviews: 2341,
      specs: { Weight: "16 oz", Length: "13 in", Head: "Drop-forged steel, smooth face", Handle: "American hickory", "Nail starter": "Magnetic slot" },
      highlights: ["Smooth face won't waffle-print your trim", "Curved claw gives real leverage when a nail goes in crooked", "Hickory absorbs shock better than fiberglass"],
      aiNote: "One cent short of the free-shipping threshold. Retailers do this on purpose. Pair it with anything and shipping is free."
    },
    "h-framing": {
      kind: "hammer", art: { type: "framing", handle: "#2E2E30", head: "#6B6E73", bg: "#E2581C" },
      brand: "Bulwark", name: "22 oz Milled-Face Framing Hammer", short: "Framing Hammer",
      price: 39, retailer: "hardline", url: "#",
      shipping: "Free shipping on orders over $25", returns: "30-day returns",
      rating: 4.6, reviews: 870,
      specs: { Weight: "22 oz", Length: "16 in", Head: "Milled (waffle) face", Handle: "Steel core, anti-vibe grip", Claw: "Straight rip claw" },
      highlights: ["Milled face bites the nail head so it won't glance off", "Straight claw doubles as a demolition pry", "Anti-vibration grip, according to 140+ reviews about tired forearms"],
      aiNote: "Overkill for hanging a mirror. That milled face leaves a checkered scar on anything it touches."
    },
    "h-deadblow": {
      kind: "hammer", art: { type: "mallet", handle: "#1F1C1A", head: "#E2581C", bg: "#8FA39A" },
      brand: "Softfall", name: "2 lb Dead-Blow Mallet", short: "Dead-Blow Mallet",
      price: 19.95, retailer: "hardline", url: "#",
      shipping: "Free shipping on orders over $25", returns: "30-day returns",
      rating: 4.9, reviews: 655,
      specs: { Weight: "2 lb", Head: "Shot-filled, polyurethane shell", Rebound: "None (that's the point)", Marring: "Non-marring" },
      highlights: ["Steel shot inside the head kills the bounce", "Taps a mirror cleat home without a single spark of glass"],
      aiNote: "Listed under 'automotive', but furniture and mirror people buy it more. Pairs well with nervous hands."
    },

    "m-orbit": {
      kind: "mirror", art: { type: "round", frame: "#6B4226", bg: "#2B2826" },
      brand: "Orbit", name: "30\" Round Walnut Wall Mirror", short: "Round Mirror",
      price: 129, retailer: "hollis", url: "#",
      shipping: "Free shipping, arrives in 3–5 days", returns: "30-day returns, free pickup",
      rating: 4.6, reviews: 1204,
      specs: { Diameter: "30 in", Frame: "1.5 in solid walnut", Glass: "5 mm silver-backed", Weight: "18 lb", Hanging: "French cleat (included)" },
      highlights: ["French cleat means one level line, not two perfectly matched holes", "Silver-backed glass resists the black edge-rot cheaper mirrors get"],
      aiNote: "The listing calls for wall anchors or a stud at 18 lb. Reviews say a picture hook won't hold it, so plan for screws."
    },
    "m-arch": {
      kind: "mirror", art: { type: "arch", frame: "#B08A4A", bg: "#E9DCC6" },
      brand: "Hollis", name: "Arched Floor Mirror, 65\" × 24\"", short: "Arched Floor Mirror",
      price: 189, retailer: "hollis", url: "#",
      shipping: "Free white-glove delivery", returns: "30-day returns, free pickup",
      rating: 4.5, reviews: 3388,
      specs: { Size: "65 × 24 in", Frame: "Iron, brushed-brass finish", Glass: "5 mm, shatter-resistant film", Weight: "38 lb", Mount: "Lean or wall-mount" },
      highlights: ["Shatter-resistant backing film. Even a bad day stays in one sheet", "White-glove delivery means it shows up unboxed and not cracked"],
      aiNote: "Most-photographed item in its category. Several reviewers mention needing a second person, or a very good hammer and a plan."
    },
    "m-soleil": {
      kind: "mirror", art: { type: "sunburst", frame: "#C9A24D", bg: "#1F3A3D" },
      brand: "Gilt & Gable", name: "Soleil 32\" Sunburst Mirror", short: "Sunburst Mirror",
      price: 98, retailer: "gilt", url: "#",
      shipping: "Free shipping over $75", returns: "14-day returns, buyer pays return shipping",
      rating: 4.3, reviews: 412,
      specs: { Diameter: "32 in overall, 12 in glass", Rays: "Hand-gilded metal, 48", Style: "1940s Hollywood Regency", Weight: "9 lb" },
      highlights: ["Forty-eight hand-gilded rays: every one a little different", "Light enough for a single sawtooth hanger and a tack hammer"],
      aiNote: "Short return window and you pay return shipping. Read the fine print before you hang it."
    },
    "m-vanity": {
      kind: "mirror", art: { type: "hand", frame: "#E2581C", bg: "#F2E3C9" },
      brand: "Pellworth", name: "Beveled Vanity Hand Mirror", short: "Hand Mirror",
      price: 22, retailer: "pellworth", url: "#",
      shipping: "Free 2-day shipping", returns: "90-day returns, no questions",
      rating: 4.7, reviews: 760,
      specs: { Glass: "Beveled, 1× / 2× sides", Handle: "Enamelled steel", Length: "11 in" },
      highlights: ["2× side for splinters, 1× side for vanity", "Enamelled handle in a very specific orange"],
      aiNote: "Frequently bought with the tack hammer. Nobody knows why. We have a theory."
    },
    "m-convex": {
      kind: "mirror", art: { type: "convex", frame: "#1F1C1A", bg: "#E9B44C" },
      brand: "Wideangle", name: "12\" Convex Safety Mirror", short: "Convex Mirror",
      price: 34, retailer: "hardline", url: "#",
      shipping: "Free shipping on orders over $25", returns: "30-day returns",
      rating: 4.4, reviews: 289,
      specs: { Diameter: "12 in", Lens: "Acrylic, 160° view", Mount: "Adjustable arm" },
      highlights: ["160° view: see the whole workshop from one corner", "Acrylic lens. Drop it and nothing happens"],
      aiNote: "Built for warehouse corners, bought for hallways. The one mirror in this issue you cannot break with a hammer. We checked the reviews, not the mirror."
    }
  },

  chapters: [
    {
      id: "wall", numeral: "I", kicker: "Chapter One", title: "The Bare Wall",
      dek: "Every mirror starts as a blank wall and a decision.",
      blocks: [
        { type: "prose", dropcap: true, html: "It is a Saturday. The wall in the hallway has been bare since you moved in, and you have finally decided it should show you your own face on the way out the door. This is how it starts: with one small hole. You do not need a big hammer for a small hole. You need the [[h-tack|5-ounce Pellworth tack hammer]]: ten and a quarter inches of oiled ash with a face that is <em>magnetized</em>, so the nail sits on the hammer and not between your fingers." },
        { type: "feature", product: "h-tack", side: "right", tilt: 3, html: "<p>The tack hammer is a 1940s upholsterer's tool that never got a redesign because it never needed one. The split head gives you one magnetic face to start the nail and one plain face to finish it.</p><p>It ships <strong>{{h-tack.shipping}}</strong> with <strong>{{h-tack.returns}}</strong>. If the wall wins, you've lost nothing.</p>" },
        { type: "pullquote", text: "You do not need a big hammer for a small hole.", cite: "This & Thattery house rule No. 1" }
      ]
    },
    {
      id: "glass", numeral: "II", kicker: "Chapter Two", title: "The Object of Reflection",
      dek: "A close look at the mirror you'll be hanging, from the front and from the back.",
      blocks: [
        { type: "prose", html: "Here is the problem with your plan. The mirror you want is the [[m-orbit]], and it weighs <strong>{{m-orbit.specs.Weight}}</strong>. A picture hook will not hold eighteen pounds of walnut and glass, however much you trust it. Look closer." },
        { type: "specimen", product: "m-orbit", callouts: [
          { x: 82, y: 30, side: "right", label: "Frame", text: "1.5\" solid walnut, not veneer. It darkens, slowly, toward the color of the hammer handle." },
          { x: 34, y: 34, side: "left", label: "Glass", text: "5 mm, silver-backed. Cheaper aluminium-backed glass grows black edges in damp hallways." },
          { x: 50, y: 64, side: "left", label: "Hanging", text: "French cleat included. One level line, two screws, no measuring twice." },
          { x: 88, y: 78, side: "right", label: "Fine print", text: "{{m-orbit.shipping}} · {{m-orbit.returns}}." }
        ] },
        { type: "prose", html: "So the tack hammer stays, but it's no longer the hero. The cleat wants screws, the screws want a stud, and finding the stud is the job of a heavier hand." }
      ]
    },
    {
      id: "duel", numeral: "III", kicker: "Chapter Three", title: "The Heavier Hand",
      dek: "Two claw hammers, one wall. Ounces, faces, and a one-cent shipping trick.",
      blocks: [
        { type: "duel", products: ["h-claw", "h-framing"], rows: [
          ["Weight", "specs.Weight", "specs.Weight"],
          ["Face", "specs.Head", "specs.Head"],
          ["Handle", "specs.Handle", "specs.Handle"],
          ["Price", "price", "price"],
          ["Rating", "rating", "rating"],
          ["Ships", "shipping", "shipping"]
        ], verdict: "For a mirror wall, take the <strong>smooth face</strong>. The milled face on the [[h-framing|Bulwark]] grips nails beautifully and leaves a waffle print on everything else, including the drywall you'll be staring at in your new mirror for years." },
        { type: "prose", html: "The [[h-claw]] costs <strong>{{h-claw.price}}</strong>, and {{h-claw.retailer}} ships free on orders over $25. That's one cent short. It is not an accident. Add anything from the same shop, even the [[h-deadblow|dead-blow mallet]] you'll want in Chapter Four, and the shipping is free. Our toolbox (bottom right) keeps track of this for you." }
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
      dek: "On superstition, rebound, and reading return policies before you swing.",
      blocks: [
        { type: "pair", products: ["h-deadblow", "m-soleil"], html: "<p>A hammer near a mirror is a story about luck. The old rule says break one and it's seven years bad. The newer rule says <em>read the return policy first</em>.</p><p>The [[m-soleil]] is the most beautiful thing in this issue: forty-eight hand-gilded rays, very 1946. It also has the strictest terms: <strong>{{m-soleil.returns}}</strong>. That's why the [[h-deadblow]] exists. It's filled with steel shot, so it doesn't bounce. You can tap a cleat into place an inch from the glass and the glass will never know.</p>" },
        { type: "ticket", product: "m-soleil" },
        { type: "pullquote", text: "Break a mirror: seven years. Break a return window: forever.", cite: "Overheard in aisle 9" }
      ]
    },
    {
      id: "lookback", numeral: "V", kicker: "Chapter Five", title: "The Look Back",
      dek: "The wall is done. Now there are mirrors everywhere you look.",
      blocks: [
        { type: "prose", dropcap: true, html: "It's on the wall. It's level, mostly. You stand back, and the mirror shows you a hallway with a person holding a hammer, looking pleased. From here it gets out of hand. You wonder whether the bedroom needs the [[m-arch]] (65 inches, <strong>{{m-arch.shipping}}</strong>, so no hammer required). The [[m-vanity]] turns out to be the best splinter-finder ever made. And there's the [[m-convex]], built for warehouse corners, which lets you see who's coming down the hall before they see you." },
        { type: "collage", products: ["m-arch", "m-vanity", "m-convex", "h-claw"] },
        { type: "prose", html: "Hammers make marks and mirrors show them. Owning both means you get to change the room and then watch yourself in it. Your kit is below, sorted by shop, with every shipping threshold worked out." }
      ]
    }
  ]
};
