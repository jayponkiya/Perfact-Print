/* ==========================================================================
   Perfect Print — business data
   --------------------------------------------------------------------------
   This is the ONE file to edit for contact details, opening hours and the
   service list. Header, footer, service cards, the services page and the
   quote form all read from here.

   Empty strings are fine: anything left blank is simply hidden on the site,
   and a note is logged to the browser console so you know what's missing.
   ========================================================================== */

window.CONFIG = {
  businessName: "Perfect Print",

  // WhatsApp number that receives quote requests — international format, digits only.
  // Also used for tel: links.
  whatsappNumber: "919974429883",
  displayPhone: "99744 29883",
  email: "perfectprint619@gmail.com",

  // Credit shown in the site footer and the catalog PDF footer.
  credit: {
    text: "Design and development by",
    name: "Letvar Solution",
    url: "https://letvarsolution.com/"
  },

  // Shop address. Shown in the footer and on the contact page, used for the map,
  // and sent to Google as LocalBusiness data. `country` is the 2-letter code.
  address: {
    line1: "7R32+4V7, New Lalbahadur Nagar, Kotharoya",
    line2: "Bhakti Nagar",
    city: "Rajkot",
    state: "Gujarat",
    postcode: "360002",
    country: "IN"
  },

  tagline: "Imagined by you. Printed to perfection.",
  description:
    "Perfect Print is a one-stop print and branding studio in Rajkot — business stationery, stamps and labels, signage, custom merchandise and large-format printing, designed and produced under one roof.",

  // Public website address, no trailing slash. Used for canonical links and the sitemap.
  siteUrl: "https://www.example.com",

  // Opens the address in Google Maps.
  mapLink: "https://www.google.com/maps/search/?api=1&query=7R32%2B4V7%2C%20Bhakti%20Nagar%2C%20Rajkot%2C%20Gujarat%20360002",
  // Map on the contact page. Left empty, the map is built from `address` above.
  // To pin it exactly: Google Maps → Share → "Embed a map" → copy the src="…" link here.
  mapEmbedUrl: "",

  /* OPENING HOURS — PLACEHOLDER. Fill in before going live, e.g.
       hours: [
         { days: "Monday – Saturday", time: "10:00 am – 8:00 pm" },
         { days: "Sunday", time: "Closed" }
       ],
     While empty, the contact page says "Opening hours coming soon" and the
     footer hides the hours. */
  hours: [],

  // The same hours in the format Google reads (LocalBusiness schema), e.g.
  //   openingHoursSchema: ["Mo-Sa 10:00-20:00"]
  // Left out of the schema while empty.
  openingHoursSchema: [],

  social: {
    instagram: "",
    facebook: "",
    youtube: ""
  },

  /* ========================================================================
     STATS — PLACEHOLDER NUMBERS. EDIT BEFORE GOING LIVE.
     ------------------------------------------------------------------------
     Shown on Home (stats band) and About. These are made-up examples, not
     real figures. Change `value` to your real numbers; `suffix` is shown
     after the number ("+", "%", "" …). Set `statsArePlaceholders: false`
     once they're real and the console reminder goes away.
     ======================================================================== */
  statsArePlaceholders: true,
  stats: [
    { value: 10, suffix: "+", label: "Years printing in Rajkot" },
    { value: 2500, suffix: "+", label: "Happy clients" },
    { value: 15000, suffix: "+", label: "Jobs delivered" },
    { value: 30, suffix: "+", label: "Products under one roof" }
  ],

  /* ------------------------------------------------------------------------
     Services. `id` is used in URLs (services.html#printing, quote.html?service=…)
     so keep it lowercase-with-hyphens. `color` is one of:
     cyan | magenta | yellow | green | orange | violet
     `icon` is one of the icon names in js/main.js (printer, stamp, sign, gift, …)
     `image` is a key in js/images.js (IMAGES), e.g. "serviceBanner".
     Each item can have its own `image` too; items without one show a
     gradient card with the product name on the services page.
     ------------------------------------------------------------------------ */
  services: [
    {
      id: "printing",
      name: "Printing",
      color: "cyan",
      icon: "printer",
      image: "serviceBrochure",
      summary: "Offset and digital printing for everyday business stationery and marketing.",
      intro:
        "Crisp, colour-accurate print for the paperwork your business runs on — from a box of business cards to thousands of brochures.",
      items: [
        { name: "Offset Printing", image: "heroMain", note: "Best value for high-volume runs" },
        { name: "Business Cards", image: "serviceBusinessCard", note: "Matte, gloss, textured & premium stocks" },
        { name: "Bill Books", note: "Numbered, duplicate & triplicate sets" },
        { name: "Letterheads", image: "serviceLetterhead", note: "Branded stationery on quality bond paper" },
        { name: "Flyers", note: "Single & double sided, any size" },
        { name: "Brochures", image: "serviceBrochure", note: "Bi-fold, tri-fold & booklets" },
        { name: "Envelopes", image: "serviceStampStationery", note: "Printed office & invitation envelopes" },
        { name: "Paper Stickers", image: "serviceSticker", note: "Sheet & cut-to-shape stickers" }
      ]
    },
    {
      id: "stamps-labels",
      name: "Stamps & Labels",
      color: "magenta",
      icon: "stamp",
      image: "serviceRubberStamp",
      summary: "Rubber stamps, product labels, packaging and custom-printed merchandise.",
      intro:
        "Everything that carries your brand onto a product — stamps, labels, boxes, bags and printed merch.",
      items: [
        { name: "Labels", image: "serviceLabel", note: "Product, barcode & roll labels" },
        { name: "Rubber Stamps", image: "serviceRubberStamp", note: "Self-inking, pre-inked & traditional" },
        { name: "Shopping Bags", image: "serviceShoppingBag", note: "Paper, kraft & non-woven bags" },
        { name: "Box Printing", image: "servicePackagingBox", note: "Custom product & mono cartons" },
        { name: "Food Boxes", note: "Food-safe takeaway & bakery boxes" },
        { name: "T-Shirt Printing", image: "serviceHeatPress", note: "Uniforms, events & merch" },
        { name: "Mug Printing", image: "serviceMug", note: "Photo & logo mugs" },
        { name: "Keychain Printing", note: "Metal, acrylic & photo keychains" }
      ]
    },
    {
      id: "sign-display",
      name: "Sign & Display",
      color: "orange",
      icon: "sign",
      image: "serviceLedSign",
      summary: "Shop signage, lit boards, vinyl graphics and precision acrylic cutting.",
      intro:
        "Get noticed from the street. Indoor and outdoor signage, made and finished to last.",
      items: [
        { name: "Sign Boards", image: "heroContact", note: "Shop fronts & directional signs" },
        { name: "Lighting Boards", image: "serviceLedSign", note: "LED backlit & glow sign boards" },
        { name: "Name Boards", note: "Office, door & desk name plates" },
        { name: "Vinyl Stickers", note: "Wall, window & vehicle graphics" },
        { name: "Frosted Stickers", note: "Glass privacy & etched-look film" },
        { name: "One Way Vision", note: "See-through window graphics" },
        { name: "Acrylic Cutting", image: "serviceAcrylic", note: "Laser-cut acrylic shapes & displays" },
        { name: "Letter Cutting", image: "serviceLetterCutting", note: "3D & cut-out signage letters" }
      ]
    },
    {
      id: "special-items",
      name: "Special Items",
      color: "green",
      icon: "gift",
      image: "serviceBanner",
      summary: "Large-format flex & banners, UV printing, corporate gifts and screen printing.",
      intro:
        "Big formats and special finishes — for events, promotions and gifts people actually keep.",
      items: [
        { name: "Flex Printing", image: "serviceBanner", note: "Hoardings & large-format flex" },
        { name: "Banners", note: "Roll-up, standee & event banners" },
        { name: "UV Printing", note: "Direct print on wood, glass, metal & more" },
        { name: "Gift Items", note: "Personalised & corporate gifting" },
        { name: "Office Items", note: "ID cards, lanyards, diaries & pens" },
        { name: "Screen Printing", image: "serviceTshirt", note: "Bulk printing on fabric & bags" }
      ]
    }
  ],

  /* ------------------------------------------------------------------------
     Featured products on the Home page. `service` is a services id above,
     `item` the product name passed to the quote form, `image` a key in
     js/images.js.
     ------------------------------------------------------------------------ */
  featured: [
    { name: "Business Cards", service: "printing", item: "Business Cards", image: "serviceBusinessCard", note: "Matte, gloss and textured stocks" },
    { name: "Brochures & Flyers", service: "printing", item: "Brochures", image: "serviceBrochure", note: "Folded, stapled or single sheet" },
    { name: "Rubber Stamps", service: "stamps-labels", item: "Rubber Stamps", image: "serviceRubberStamp", note: "Self-inking and traditional" },
    { name: "Product Labels", service: "stamps-labels", item: "Labels", image: "serviceLabel", note: "Rolls, sheets and custom shapes" },
    { name: "Shopping Bags", service: "stamps-labels", item: "Shopping Bags", image: "serviceShoppingBag", note: "Paper, kraft and non-woven" },
    { name: "T-Shirt Printing", service: "stamps-labels", item: "T-Shirt Printing", image: "serviceTshirt", note: "Uniforms, events and merch" },
    { name: "LED Sign Boards", service: "sign-display", item: "Lighting Boards", image: "serviceLedSign", note: "Glow boards for your shop front" },
    { name: "Flex & Banners", service: "special-items", item: "Flex Printing", image: "serviceBanner", note: "Hoardings, standees and events" }
  ],

  /* Product catalog PDF (rebuild with tools/build_catalog.py after changing products).
     Its page previews are listed in js/main.js (CATALOG, near the top). */
  catalogPdf: "assets/catalog/perfect-print-catalog.pdf",
  catalogPdfSize: "1.4 MB",

  /* Quote form: suggestions shown under the Quantity box (visitors can also type their own). */
  quote: {
    quantities: ["100", "250", "500", "1,000", "2,000", "5,000+"]
  }
};
