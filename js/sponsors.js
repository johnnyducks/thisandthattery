/*
 * SPONSOR / FEATURED-BRAND COLLECTIONS
 * ------------------------------------------------------------------
 * One brand, one page: sponsor.html?brand=<id>. The issue's nav bar and footer link
 * to `active`.
 *
 * Labelling matters (FTC endorsement guides): set `paid: true` only when there is a
 * real paid relationship. That switches the page to "Sponsored by …" and shows the
 * sponsorship disclosure. With `paid: false` the page says "Featured brand" and states
 * that no payment was received.
 *
 * The example below is UNPAID: Garrett Wade products from our own catalog, chosen
 * editorially, to show the format.
 */
window.TT_SPONSORS = {
  active: "garrett-wade",

  brands: {
    "garrett-wade": {
      paid: false,
      name: "Garrett Wade",
      url: "https://www.garrettwade.com",
      kicker: "The Collection",
      title: "The Garrett Wade Shelf",
      dek: "Mallets, a favorite hammer, and plans for a mirror from 1780: one catalog's answer to this issue's pairing.",
      intro: "Garrett Wade sells tools the way other catalogs sell furniture: with a story attached to each one. Their copy argues that \"the right hammer … can become a part of the user,\" and the mallets come with notes on how they knock apart for storage. It's the shop behind our Chapter Four mallet and the $5 courting-mirror plans in Chapter Five, so here is the rest of the shelf.",
      terms: { shipping: "Shipping calculated at checkout", returns: "90-day returns from ship date" },
      accent: "#2F5D50",
      products: [
        { id: "gw-craft-set", aside: "Four hammers, zero mirrors.", name: "Four Piece Craft Hammer Set", price: 32,
          image: "https://cdn.shopify.com/s/files/1/0970/7107/1600/files/88H0307_11__40675__14059.1593446617.1280.1280.jpg?v=1766155438&width=900",
          url: "https://www.garrettwade.com/products/four-hammer-set",
          note: "Includes a square-head tack hammer and a solid-brass round-face hammer. Garrett Wade pitches it for \"tapping in picture hangers.\"",
          tag: "Picture-hanging set" },
        { id: "gw-carpenter", aside: "Favorite-hammer status does not transfer to mirrors.", name: "Carpenter's Hammer", price: 26.35,
          image: "https://cdn.shopify.com/s/files/1/0970/7107/1600/files/CarpenterHammer-gif500_39B0509__88244.1707253893.1280.1280.gif?v=1766156298&width=900",
          url: "https://www.garrettwade.com/products/italian-carpenters-hammer",
          note: "Drawn from Italy's toolmaking heritage, and sold on the idea that a favorite hammer is worth having.",
          tag: "In Chapter III" },
        { id: "gw-both-mallets", aside: "Two mallets. Neither is a mirror.", name: "Both Mallets (12 oz + 19 oz)", price: 39,
          image: "https://cdn.shopify.com/s/files/1/0970/7107/1600/files/83r0203_1_1__45958__83994.1593446341.1280.1280.jpg?v=1766154641&width=900",
          url: "https://www.garrettwade.com/products/both-mallets",
          note: "A pair of beechwood mallets. Taper-assembled, so the heads knock off the handles for storage.",
          tag: "Pair of two" },
        { id: "gw-mallet-35", aside: "Beech, it turns out, reflects very little.", name: "3-1/2\" Beechwood Mallet", price: 19.95,
          image: "https://cdn.shopify.com/s/files/1/0970/7107/1600/files/83R0203_3-1-2_Inch_BeechwoodMallet_3500A.jpg?v=1784739765&width=900",
          url: "https://www.garrettwade.com/products/3-1-2-beechwood-mallet",
          note: "12 oz of solid beech, the smaller of the pair. Our Chapter Four pick for tapping a hook near glass.",
          tag: "In Chapter IV" },
        { id: "gw-mallet-45", aside: "Heavier, and no better at reflecting.", name: "4-1/2\" Beechwood Mallet", price: 23.5,
          image: "https://cdn.shopify.com/s/files/1/0970/7107/1600/files/Gemini_Generated_Image_cgz053cgz053cgz0.png?v=1784739685&width=900",
          url: "https://www.garrettwade.com/products/4-1-2-beechwood-mallet",
          note: "The 19 oz big sibling, for heavier persuasion.",
          tag: "19 oz" },
        { id: "gw-french-mallet", aside: "France also makes mirrors. This is not one.", name: "2\" Woodworker's Mallet, Made in France", price: 18.5,
          image: "https://cdn.shopify.com/s/files/1/0970/7107/1600/files/2_FrenchMallet_18B0305__67377.1634785741.1280.1280.jpg?v=1766154001&width=900",
          url: "https://www.garrettwade.com/products/2-woodworkers-mallet-made-in-france",
          note: "Made in France with oiled beechwood handles, for coaxing dovetails home without marring the wood.",
          tag: "Made in France" },
        { id: "gw-chisel-set", aside: "Chisels are not mirrors either, though a well-honed back comes close.", name: "Chisels and Wooden Joinery Mallet Set", price: 99,
          image: "https://cdn.shopify.com/s/files/1/0970/7107/1600/files/ChiselSet_Mallet_main_63A0470__62604.1633360626.1280.1280.jpg?v=1766154820&width=900",
          url: "https://www.garrettwade.com/products/chisel-set-roll-mallet",
          note: "Four ash-handled chisels (¼\" to 1\"), a .75 lb beech joinery mallet and a denim roll.",
          tag: "Starter set" },
        { id: "gw-courting", aside: "The one mirror on this shelf. Some assembly required.", name: "Courting Mirror Plans (Stock #12)", price: 5,
          image: "https://cdn.shopify.com/s/files/1/0970/7107/1600/files/12__43229__60396.1593447506.1280.1280.jpg?v=1766154987&width=900",
          url: "https://www.garrettwade.com/products/courting-mirror-stock-12",
          note: "Full-size plans for a mahogany-on-pine mirror made around 1780, drawn by Carlyle Lynch. The plans ship free by First Class mail.",
          tag: "The mirror" }
      ]
    }
  }
};
