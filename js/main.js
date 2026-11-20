/* ==========================================================================
   Perfect Print — main.js
   Header/footer injection, image binding, data-driven sections, catalog
   grid + lightbox, floating WhatsApp button.

   Depends on: js/config.js, js/images.js (load those first).
   Pages opt in to rendered blocks with data-render="…" placeholders.
   ========================================================================== */

(function () {
  "use strict";

  var CFG = window.CONFIG || {};
  var BIZ = CFG; // business fields sit at the top level of CONFIG
  var IMG = window.IMAGES || {};

  /* ==================================================================
     CATALOG — the images shown on catalog.html
     ------------------------------------------------------------------
     Right now these are the 7 pages of the catalog PDF
     (assets/catalog/perfect-print-catalog.pdf, made by tools/build_catalog.py).
     To add an image: put the file in assets/catalog/, then copy one of
     the entries below and change it.

       src       path to the full-size file (opened in the viewer)
       thumb     optional smaller copy shown in the grid
       title     caption shown under the image
       alt       what the image shows, for people using screen readers
       w, h      the full-size file's size in pixels (right-click →
                 Properties → Details in Windows)
       category  which filter button it appears under. One of:
                   "printing"  "stamps-labels"  "sign-display"  "special-items"
                 "general" (shown as "Overview"), or a list when it fits
                 several, e.g. ["printing", "sign-display"]
     ================================================================== */
  function catalogPage(n, title, alt, category) {
    return {
      src: "assets/catalog/pages/catalog-page-" + n + ".jpg",
      thumb: "assets/catalog/pages/catalog-page-" + n + "-600w.jpg",
      title: title, alt: alt, w: 1240, h: 1754, category: category
    };
  }

  var CATALOG = [
    catalogPage(1, "Catalog cover", "Catalog cover: Imagined by you. Printed to perfection, with photos of business cards, sign boards, shopping bags, stamps and T-shirt printing", "general"),
    catalogPage(2, "Welcome & what's inside", "Introduction page listing the four departments and why to choose Perfect Print", "general"),
    catalogPage(3, "Printing", "Printing page: offset printing, business cards, bill books, letterheads, flyers, brochures, envelopes and paper stickers", "printing"),
    catalogPage(4, "Stamps & Labels", "Stamps and labels page: labels, rubber stamps, shopping bags, box printing, food boxes, T-shirt, mug and keychain printing", "stamps-labels"),
    catalogPage(5, "Sign & Display", "Sign and display page: sign boards, lighting boards, name boards, vinyl, frosted and one way vision stickers, acrylic and letter cutting", "sign-display"),
    catalogPage(6, "Special Items", "Special items page: flex printing, banners, UV printing, gift items, office items and screen printing", "special-items"),
    catalogPage(7, "How to order & contact", "How to order in four steps, contact details and a QR code to chat on WhatsApp", "general")
  ];

  /* ------------------------------------------------------------------ */
  /* Icons (inline SVG so they inherit colour and work from file://)    */
  /* Source copies live in assets/icons/.                               */
  /* ------------------------------------------------------------------ */

  var S = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';
  var ICONS = {
    printer: '<svg ' + S + '><path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/><path d="M17 12h.01"/></svg>',
    stamp: '<svg ' + S + '><path d="M9 3h6l-1 7h-4z"/><path d="M5 14a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3H5z"/><path d="M4 21h16"/></svg>',
    sign: '<svg ' + S + '><rect x="3" y="4" width="18" height="11" rx="2"/><path d="M8 9.5h8"/><path d="M8 19l4-4 4 4"/><path d="M12 15v6"/></svg>',
    gift: '<svg ' + S + '><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9"/><path d="M12 8v13"/><path d="M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5"/><path d="M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5"/></svg>',
    palette: '<svg ' + S + '><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.9 1.4-1.9l-.3-1a1.6 1.6 0 0 1 1.6-2.1H17a4 4 0 0 0 4-4c0-5-4-9-9-9Z"/><circle cx="7.5" cy="11.5" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/></svg>',
    badge: '<svg ' + S + '><path d="M12 2l2.4 2.2 3.2-.4.9 3.1 2.8 1.6-1.2 3 1.2 3-2.8 1.6-.9 3.1-3.2-.4L12 22l-2.4-2.2-3.2.4-.9-3.1L2.7 15.5l1.2-3-1.2-3 2.8-1.6.9-3.1 3.2.4z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
    clock: '<svg ' + S + '><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    handshake: '<svg ' + S + '><path d="m11 17 2 2a1.4 1.4 0 0 0 2-2"/><path d="m14 14 2.5 2.5a1.4 1.4 0 0 0 2-2l-3.9-3.9a2 2 0 0 0-2.8 0l-.9.9a1.4 1.4 0 0 1-2-2l2.8-2.8a3.5 3.5 0 0 1 4.3-.5l.6.4a2 2 0 0 0 1.4.3H21"/><path d="M21 4v9h-2"/><path d="M3 4h8"/><path d="M3 4v9h2l4 4a1.4 1.4 0 0 0 2-2"/></svg>',
    layers: '<svg ' + S + '><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/></svg>',
    truck: '<svg ' + S + '><path d="M3 6h11v10H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/></svg>',
    phone: '<svg ' + S + '><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
    mail: '<svg ' + S + '><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>',
    pin: '<svg ' + S + '><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    arrow: '<svg ' + S + '><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
    check: '<svg ' + S + '><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>',
    menu: '<svg ' + S + '><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg ' + S + '><path d="M18 6 6 18M6 6l12 12"/></svg>',
    zoom: '<svg ' + S + '><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/></svg>',
    left: '<svg ' + S + '><path d="m15 18-6-6 6-6"/></svg>',
    right: '<svg ' + S + '><path d="m9 18 6-6-6-6"/></svg>',
    info: '<svg ' + S + '><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>',
    instagram: '<svg ' + S + '><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></svg>',
    facebook: '<svg ' + S + '><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
    youtube: '<svg ' + S + '><path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>',
    whatsapp: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4ZM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8Zm8.4-18.2A11.8 11.8 0 0 0 1.9 17.9L.2 24l6.3-1.7A11.8 11.8 0 0 0 24 12a11.7 11.7 0 0 0-3.6-8.4Z"/></svg>'
  };

  function icon(name) { return ICONS[name] || ""; }

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function getPath(obj, path) {
    return path.split(".").reduce(function (o, k) { return o && o[k]; }, obj);
  }

  function digits(s) { return String(s || "").replace(/\D/g, ""); }

  function hasWhatsApp() { return digits(BIZ.whatsappNumber).length >= 8; }

  function waLink(text) {
    var base = "https://wa.me/" + digits(BIZ.whatsappNumber);
    return text ? base + "?text=" + encodeURIComponent(text) : base;
  }

  // CONFIG.address → display lines, e.g. ["7R32+4V7, …", "Bhakti Nagar", "Rajkot, Gujarat 360002"].
  // (A plain string still works and is shown as one line.) The country code isn't displayed.
  function addressLines() {
    var a = BIZ.address;
    if (!a) return [];
    if (typeof a === "string") return [a];
    var region = [a.state, a.postcode].filter(Boolean).join(" ");
    var cityLine = [a.city, region].filter(Boolean).join(", ");
    return [a.line1, a.line2, cityLine].filter(Boolean);
  }

  function categoryById(id) {
    return (CFG.services || []).filter(function (c) { return c.id === id; })[0];
  }

  var currentPage = document.body.getAttribute("data-page") || "";

  /* ------------------------------------------------------------------ */
  /* Header                                                             */
  /* ------------------------------------------------------------------ */

  var NAV = [
    { id: "home", label: "Home", href: "index.html" },
    { id: "about", label: "About", href: "about.html" },
    { id: "services", label: "Services", href: "services.html" },
    { id: "catalog", label: "Catalog", href: "catalog.html" },
    { id: "contact", label: "Contact", href: "contact.html" }
  ];

  function brandHTML(extraClass) {
    return '<a class="brand ' + (extraClass || "") + '" href="index.html" aria-label="' + esc(BIZ.businessName) + ' — home">' +
      '<img src="' + IMG.logo.src + '" alt="" width="56" height="56">' +
      '<span class="brand-text"><strong>PERFECT</strong><span>Print</span></span>' +
    "</a>";
  }

  function renderHeader() {
    var mount = $("#site-header");
    if (!mount) return;

    function cur(id) { return id === currentPage ? ' aria-current="page"' : ""; }

    var desktopLinks = NAV.map(function (n) {
      return '<li><a class="nav-link" href="' + n.href + '"' + cur(n.id) + ">" + n.label + "</a></li>";
    }).join("");

    var mobileLinks = NAV.map(function (n, i) {
      return '<li><a class="mm-link" href="' + n.href + '"' + cur(n.id) + '><span class="mm-num">0' + (i + 1) + "</span>" + n.label + "</a></li>";
    }).join("");

    var quick = [];
    if (BIZ.displayPhone) quick.push('<a href="tel:+' + digits(BIZ.whatsappNumber) + '">' + icon("phone") + "<span>" + esc(BIZ.displayPhone) + "</span></a>");
    if (hasWhatsApp()) quick.push('<a href="' + waLink(greeting()) + '" target="_blank" rel="noopener">' + icon("whatsapp") + "<span>WhatsApp</span></a>");
    if (BIZ.email) quick.push('<a href="mailto:' + esc(BIZ.email) + '">' + icon("mail") + "<span>" + esc(BIZ.email) + "</span></a>");

    mount.outerHTML =
      '<header class="site-header" id="top">' +
        '<div class="container header-inner">' +
          brandHTML() +
          '<nav class="nav" aria-label="Main">' +
            '<ul class="nav-list">' + desktopLinks + "</ul>" +
          "</nav>" +
          '<div class="header-actions">' +
            '<a class="btn btn--primary btn--sm nav-cta" href="quote.html"' + cur("quote") + ">Get Quote</a>" +
            '<button class="nav-toggle" type="button" aria-controls="mobile-menu" aria-expanded="false" aria-label="Open menu">' + icon("menu") + "</button>" +
          "</div>" +
        "</div>" +
      "</header>" +
      // Full-screen mobile menu lives outside the header: the header's
      // backdrop-filter would otherwise trap position:fixed children.
      '<div class="mobile-menu" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" inert>' +
        '<div class="container mm-top">' +
          brandHTML("brand--light") +
          '<button class="mm-close" type="button" aria-label="Close menu">' + icon("close") + "</button>" +
        "</div>" +
        '<nav class="container mm-body" aria-label="Mobile">' +
          '<ul class="mm-list">' + mobileLinks + "</ul>" +
          '<a class="btn btn--primary btn--lg btn--block mm-cta" href="quote.html">Get Quote ' + icon("arrow") + "</a>" +
          (quick.length ? '<div class="mm-quick">' + quick.join("") + "</div>" : "") +
        "</nav>" +
        '<span class="mm-strip" aria-hidden="true"></span>' +
      "</div>";

    var header = $(".site-header");
    var toggle = $(".nav-toggle");
    var menu = $("#mobile-menu");
    var closeBtn = $(".mm-close", menu);

    function isOpen() { return menu.classList.contains("is-open"); }

    function setOpen(open) {
      if (open === isOpen()) return;
      menu.classList.toggle("is-open", open);
      if (open) menu.removeAttribute("inert"); else menu.setAttribute("inert", "");
      toggle.setAttribute("aria-expanded", String(open));
      document.documentElement.classList.toggle("menu-open", open);
      if (open) closeBtn.focus(); else toggle.focus({ preventScroll: true });
    }

    toggle.addEventListener("click", function () { setOpen(true); });
    closeBtn.addEventListener("click", function () { setOpen(false); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });

    document.addEventListener("keydown", function (e) {
      if (!isOpen()) return;
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key === "Tab") {
        var f = $$("a, button", menu);
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 960 && isOpen()) setOpen(false); });

    // Shrink on scroll (with a little hysteresis so it doesn't flicker at the threshold)
    var shrunk = false;
    var onScroll = function () {
      var y = window.scrollY;
      if (!shrunk && y > 48) { shrunk = true; header.classList.add("is-scrolled"); }
      else if (shrunk && y < 16) { shrunk = false; header.classList.remove("is-scrolled"); }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function greeting() {
    return "Hi " + BIZ.businessName + "! I'd like to ask about a print job.";
  }

  /* ------------------------------------------------------------------ */
  /* Footer                                                             */
  /* ------------------------------------------------------------------ */

  function contactItems() {
    var items = [];
    if (BIZ.displayPhone) {
      items.push({ icon: "phone", label: "Call", html: '<a href="tel:+' + digits(BIZ.whatsappNumber || BIZ.displayPhone) + '">' + esc(BIZ.displayPhone) + "</a>" });
    }
    if (hasWhatsApp()) {
      items.push({ icon: "whatsapp", label: "WhatsApp", html: '<a href="' + waLink("Hi " + BIZ.businessName + "! ") + '" target="_blank" rel="noopener">Chat with us</a>' });
    }
    if (BIZ.email) {
      items.push({ icon: "mail", label: "Email", html: '<a href="mailto:' + esc(BIZ.email) + '">' + esc(BIZ.email) + "</a>" });
    }
    var addr = addressLines();
    if (addr.length) {
      var a = "<address>" + addr.map(esc).join("<br>") + "</address>";
      if (BIZ.mapLink) a = '<a href="' + esc(BIZ.mapLink) + '" target="_blank" rel="noopener" title="Open in Google Maps">' + a + "</a>";
      items.push({ icon: "pin", label: "Visit", html: a });
    }
    return items;
  }

  function socialHTML() {
    var soc = BIZ.social || {};
    var names = { instagram: "Instagram", facebook: "Facebook", youtube: "YouTube" };
    var out = ["instagram", "facebook", "youtube"].filter(function (k) { return soc[k]; }).map(function (k) {
      return '<a href="' + esc(soc[k]) + '" target="_blank" rel="noopener" aria-label="' + esc(BIZ.businessName) + " on " + names[k] + ' (opens in a new tab)">' + icon(k) + "</a>";
    }).join("");
    return out ? '<div class="social">' + out + "</div>" : "";
  }

  function renderFooter() {
    var mount = $("#site-footer");
    if (!mount) return;

    var pages = NAV.concat([{ label: "Get a quote", href: "quote.html" }]).map(function (n) {
      return '<li><a href="' + n.href + '">' + n.label + "</a></li>";
    }).join("");

    var services = (CFG.services || []).map(function (c) {
      return '<li><a href="services.html#' + c.id + '">' + esc(c.name) + "</a></li>";
    }).join("");

    var contact = contactItems().map(function (i) {
      return "<li>" + icon(i.icon) + "<span><small>" + i.label + "</small>" + i.html + "</span></li>";
    }).join("");

    var directions = BIZ.mapLink
      ? '<a class="btn btn--ghost-light btn--sm footer-directions" href="' + esc(BIZ.mapLink) + '" target="_blank" rel="noopener">' + icon("pin") + " Get directions</a>"
      : "";

    var hours = (BIZ.hours || []).map(function (h) {
      return "<li>" + icon("clock") + "<span>" + esc(h.days) + ": " + esc(h.time) + "</span></li>";
    }).join("");

    mount.outerHTML =
      '<footer class="site-footer">' +
        '<div class="spectrum-bar"></div>' +
        '<div class="container footer-main">' +
          '<div class="footer-brand">' +
            '<img src="' + IMG.logo.src + '" alt="' + esc(BIZ.businessName) + '" width="88" height="88" loading="lazy">' +
            "<p>" + esc(BIZ.description) + "</p>" + socialHTML() +
          "</div>" +
          '<nav aria-label="Footer"><h2>Explore</h2><ul class="footer-links">' + pages + "</ul></nav>" +
          '<div><h2>Services</h2><ul class="footer-links">' + services + "</ul></div>" +
          '<div><h2>Get in touch</h2><ul class="footer-contact">' + contact + hours + "</ul>" + directions + "</div>" +
        "</div>" +
        '<div class="container footer-bottom">' +
          "<span>&copy; " + new Date().getFullYear() + " " + esc(BIZ.businessName) + ". All rights reserved.</span>" +
          (BIZ.credit && BIZ.credit.name
            ? '<span class="footer-credit">' + esc(BIZ.credit.text) + " " +
                '<a href="' + esc(BIZ.credit.url) + '" target="_blank" rel="noopener">' + esc(BIZ.credit.name) +
                '<span class="visually-hidden"> (opens in a new tab)</span></a></span>'
            : "") +
        "</div>" +
      "</footer>";
  }

  /* ------------------------------------------------------------------ */
  /* Floating WhatsApp button                                           */
  /* ------------------------------------------------------------------ */

  function renderWhatsAppFloat() {
    if (!hasWhatsApp()) return;
    var a = document.createElement("a");
    a.className = "wa-float";
    a.href = waLink(greeting());
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", "Chat with " + BIZ.businessName + " on WhatsApp");
    a.innerHTML = icon("whatsapp");
    document.body.appendChild(a);
  }

  /* ------------------------------------------------------------------ */
  /* Images: <img data-img="hero.home">                                 */
  /* ------------------------------------------------------------------ */

  /* A file that fails to load becomes a clean brand-gradient block.
     The missing path is logged to the console, not shown to visitors. */
  function placeholderFor(img, path) {
    var ph = document.createElement("div");
    ph.className = "img-missing";
    if (img.alt) { ph.setAttribute("role", "img"); ph.setAttribute("aria-label", img.alt); }
    else ph.setAttribute("aria-hidden", "true");
    img.replaceWith(ph);
    console.warn("[Perfect Print] Image not found:", path);
  }

  function attachFallback(img) {
    var path = img.getAttribute("src");
    function fail() { placeholderFor(img, path); }
    if (img.complete && img.naturalWidth === 0 && path) { fail(); return; }
    img.addEventListener("error", fail, { once: true });
  }

  // "a/b/photo.jpg" + widths [600, 1200] → "a/b/photo-600w.jpg 600w, a/b/photo-1200w.jpg 1200w, a/b/photo.jpg 1920w"
  function srcsetFor(data) {
    if (!data.widths || !data.w) return "";
    var m = data.src.match(/^(.*)(\.[a-z0-9]+)$/i);
    if (!m) return "";
    return data.widths
      .filter(function (w) { return w < data.w; })
      .map(function (w) { return m[1] + "-" + w + "w" + m[2] + " " + w + "w"; })
      .concat(data.src + " " + data.w + "w")
      .join(", ");
  }

  /* Fills src, alt, width/height and srcset from js/images.js.
     Put `sizes` on the <img> in HTML when it isn't full-width; default is 100vw.
     Images inside the hero load straight away; everything else is lazy. */
  function bindImages(ctx) {
    $$("img[data-img]", ctx).forEach(function (img) {
      var key = img.getAttribute("data-img");
      var data = getPath(IMG, key);
      if (!data) { console.warn("[Perfect Print] No image registered for key:", key); return; }
      img.addEventListener("error", function () { placeholderFor(img, data.src); }, { once: true });
      if (!img.hasAttribute("alt")) img.alt = data.alt || "";
      if (data.w && !img.hasAttribute("width")) { img.width = data.w; img.height = data.h; }
      if (!img.hasAttribute("loading") && !img.closest(".home-hero, .page-hero")) img.loading = "lazy";
      img.decoding = "async";
      var set = srcsetFor(data);
      if (set) {
        if (!img.hasAttribute("sizes")) img.sizes = "100vw";
        img.srcset = set;
      }
      img.src = data.src;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Data-driven blocks                                                 */
  /* ------------------------------------------------------------------ */

  // Rendered width of a card image in a 4-up grid (2-up on tablets, 1-up on phones).
  var CARD_SIZES = "(min-width: 1100px) 300px, (min-width: 600px) 50vw, 100vw";

  function serviceCardsHTML() {
    return (CFG.services || []).map(function (c) {
      var tags = c.items.slice(0, 4).map(function (i) { return '<li class="tag">' + esc(i.name) + "</li>"; }).join("");
      var more = c.items.length > 4 ? '<li class="tag">+' + (c.items.length - 4) + " more</li>" : "";
      return (
        '<article class="card service-card accent-' + c.color + '" data-animate-item>' +
          '<div class="img-frame"><img data-img="' + c.image + '" sizes="' + CARD_SIZES + '"></div>' +
          '<div class="service-card-body">' +
            '<span class="service-card-icon">' + icon(c.icon) + "</span>" +
            "<h3>" + esc(c.name) + "</h3>" +
            "<p>" + esc(c.summary) + "</p>" +
            '<ul class="tag-list">' + tags + more + "</ul>" +
            '<a class="link-arrow" href="services.html#' + c.id + '">Explore ' + esc(c.name.toLowerCase()) + " " + icon("arrow") + "</a>" +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  // Product photo from js/images.js, or a gradient card with the product name when it has none.
  function itemMediaHTML(item, cat) {
    if (item.image && getPath(IMG, item.image)) {
      return '<div class="img-frame"><img data-img="' + esc(item.image) + '" sizes="' + CARD_SIZES + '"></div>';
    }
    return (
      '<div class="img-frame item-ph" aria-hidden="true">' +
        '<span class="item-ph-icon">' + icon(cat.icon) + "</span>" +
        '<span class="item-ph-name">' + esc(item.name) + "</span>" +
      "</div>"
    );
  }

  function serviceSectionsHTML() {
    return (CFG.services || []).map(function (c, idx) {
      var cards = c.items.map(function (i) {
        var q = "quote.html?service=" + encodeURIComponent(c.id) + "&item=" + encodeURIComponent(i.name);
        return (
          '<li class="item-card">' +
            itemMediaHTML(i, c) +
            '<div class="item-card-body">' +
              "<h3>" + esc(i.name) + "</h3>" +
              (i.note ? "<p>" + esc(i.note) + "</p>" : "") +
              '<a class="btn btn--outline btn--sm" href="' + q + '" aria-label="Request a quote for ' + esc(i.name) + '">Request Quote ' + icon("arrow") + "</a>" +
            "</div>" +
          "</li>"
        );
      }).join("");
      return (
        '<section class="service-section accent-' + c.color + '" id="' + c.id + '" aria-labelledby="h-' + c.id + '">' +
          '<div class="container">' +
            '<header class="service-section-head">' +
              '<span class="service-section-icon">' + icon(c.icon) + "</span>" +
              "<div>" +
                '<p class="num">0' + (idx + 1) + " / " + esc(c.name.toUpperCase()) + "</p>" +
                '<h2 id="h-' + c.id + '">' + esc(c.name) + "</h2>" +
                '<p class="lead">' + esc(c.intro) + "</p>" +
              "</div>" +
              '<a class="btn btn--primary" href="quote.html?service=' + c.id + '">Quote for ' + esc(c.name.toLowerCase()) + " " + icon("arrow") + "</a>" +
            "</header>" +
            '<ul class="item-grid">' + cards + "</ul>" +
          "</div>" +
        "</section>"
      );
    }).join("");
  }

  function serviceJumpHTML() {
    return (CFG.services || []).map(function (c) {
      return '<a class="accent-' + c.color + '" href="#' + c.id + '">' + esc(c.name) + "</a>";
    }).join("");
  }

  function tickerHTML() {
    var names = [];
    (CFG.services || []).forEach(function (c) { c.items.forEach(function (i) { names.push(i.name); }); });
    var row = names.map(function (n) { return '<span class="ticker-item">' + esc(n) + "</span>"; }).join("");
    return '<div class="ticker-track" aria-hidden="true">' + row + row + "</div>" +
      '<p class="visually-hidden">Services include ' + esc(names.join(", ")) + ".</p>";
  }

  function featuredHTML() {
    return (CFG.featured || []).map(function (f) {
      var cat = categoryById(f.service);
      var q = "quote.html?service=" + encodeURIComponent(f.service) + "&item=" + encodeURIComponent(f.item || f.name);
      return (
        '<article class="product-card' + (cat ? " accent-" + cat.color : "") + '">' +
          '<div class="img-frame"><img data-img="' + esc(f.image) + '" sizes="' + CARD_SIZES + '"></div>' +
          '<div class="product-card-body">' +
            (cat ? '<p class="product-card-cat">' + esc(cat.name) + "</p>" : "") +
            '<h3><a href="' + q + '">' + esc(f.name) + "</a></h3>" +
            (f.note ? "<p>" + esc(f.note) + "</p>" : "") +
            '<span class="link-arrow" aria-hidden="true">Get a quote ' + icon("arrow") + "</span>" +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  function statsHTML() {
    return (BIZ.stats || []).map(function (s) {
      var shown = Number(s.value).toLocaleString("en-IN");
      return '<div class="stat"><strong><span data-count="' + s.value + '">' + shown + "</span>" + esc(s.suffix) + "</strong><span>" + esc(s.label) + "</span></div>";
    }).join("");
  }

  function contactListHTML() {
    var items = contactItems();
    if (!items.length) {
      return '<li><span class="ci">' + icon("info") + "</span><div><strong>Contact details</strong>Coming soon — add them in js/config.js.</div></li>";
    }
    return items.map(function (i) {
      return '<li><span class="ci">' + icon(i.icon) + "</span><div><strong>" + i.label + "</strong>" + i.html + "</div></li>";
    }).join("");
  }

  // Contact page: one tile per way to reach the shop (only those filled in config.js).
  function contactTilesHTML() {
    var t = [];
    if (BIZ.displayPhone) {
      t.push({ icon: "phone", label: "Call us", value: BIZ.displayPhone, href: "tel:+" + digits(BIZ.whatsappNumber || BIZ.displayPhone), action: "Call now" });
    }
    if (hasWhatsApp()) {
      t.push({ icon: "whatsapp", label: "WhatsApp", value: BIZ.displayPhone || "+" + digits(BIZ.whatsappNumber), href: waLink(greeting()), action: "Start a chat", ext: true });
    }
    if (BIZ.email) {
      t.push({ icon: "mail", label: "Email", value: BIZ.email, href: "mailto:" + BIZ.email, action: "Send an email" });
    }
    var addr = addressLines();
    if (addr.length) {
      t.push({ icon: "pin", label: "Visit the shop", value: addr.join(", "), href: BIZ.mapLink || "", action: "Get directions", ext: true });
    }
    return t.map(function (x) {
      var link = x.href
        ? '<a class="link-arrow" href="' + esc(x.href) + '"' + (x.ext ? ' target="_blank" rel="noopener"' : "") + ">" + x.action + " " + icon("arrow") + "</a>"
        : "";
      return (
        '<li class="contact-tile contact-tile--' + x.icon + '">' +
          '<span class="ci">' + icon(x.icon) + "</span>" +
          "<h3>" + x.label + "</h3>" +
          "<p>" + esc(x.value) + "</p>" +
          link +
        "</li>"
      );
    }).join("");
  }

  // Empty hours in config.js → a "to be confirmed" line instead of made-up times.
  function hoursHTML() {
    var hours = BIZ.hours || [];
    if (!hours.length) {
      return '<li class="hours-tbc">Opening hours coming soon. Please call or WhatsApp before you visit.</li>';
    }
    return hours.map(function (h) { return "<li><span>" + esc(h.days) + "</span><strong>" + esc(h.time) + "</strong></li>"; }).join("");
  }

  // Uses CONFIG.mapEmbedUrl, or builds a Google Maps embed from the address.
  function mapHTML() {
    var src = BIZ.mapEmbedUrl;
    var addr = addressLines().join(", ");
    if (!src && addr) {
      src = "https://maps.google.com/maps?q=" + encodeURIComponent(addr) + "&z=16&output=embed";
    }
    if (!src) return "";
    return '<div class="map-wrap"><iframe src="' + esc(src) + '" title="Map showing the ' + esc(BIZ.businessName) + ' shop in Rajkot" width="1200" height="675" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>';
  }

  var RENDERERS = {
    "service-cards": serviceCardsHTML,
    "service-sections": serviceSectionsHTML,
    "service-jump": serviceJumpHTML,
    "ticker": tickerHTML,
    "featured": featuredHTML,
    "stats": statsHTML,
    "contact-list": contactListHTML,
    "contact-tiles": contactTilesHTML,
    "hours": hoursHTML,
    "map": mapHTML
  };

  function renderBlocks() {
    $$("[data-render]").forEach(function (el) {
      var fn = RENDERERS[el.getAttribute("data-render")];
      if (!fn) return;
      var html = fn();
      if (!html && el.hasAttribute("data-hide-empty")) {
        (el.closest("[data-hide-scope]") || el).hidden = true;
        return;
      }
      el.innerHTML = html;
    });
  }

  /* Bind simple text/attr slots: data-biz="name" / data-biz-href="whatsapp" */
  function bindBusinessText() {
    $$("[data-biz]").forEach(function (el) {
      var v = getPath(BIZ, el.getAttribute("data-biz"));
      if (v) el.textContent = v;
    });
    // Catalog PDF links: <a data-catalog-pdf> gets CONFIG.catalogPdf; [data-catalog-size] shows its size.
    $$("[data-catalog-pdf]").forEach(function (el) {
      if (!BIZ.catalogPdf) { el.hidden = true; return; }
      el.href = BIZ.catalogPdf;
    });
    $$("[data-catalog-size]").forEach(function (el) { el.textContent = BIZ.catalogPdfSize || ""; });
    $$("[data-wa-link]").forEach(function (el) {
      if (!hasWhatsApp()) { el.href = "quote.html"; return; }
      el.href = waLink(el.getAttribute("data-wa-link") || "Hi " + BIZ.businessName + "!");
      el.target = "_blank";
      el.rel = "noopener";
    });
    $$("[data-icon]").forEach(function (el) {
      if (!el.innerHTML.trim()) el.innerHTML = icon(el.getAttribute("data-icon"));
    });
  }

  /* ------------------------------------------------------------------ */
  /* Catalog + lightbox                                                 */
  /* ------------------------------------------------------------------ */

  var lightbox = null;
  var lbItems = [];
  var lbIndex = 0;
  var lbReturnFocus = null;

  // An item's category can be one id or a list of ids.
  function catsOf(item) {
    var c = item.category || "general";
    return Array.isArray(c) ? c : [c];
  }

  function catLabel(cat) {
    var ids = Array.isArray(cat) ? cat : [cat];
    if (ids.length >= (CFG.services || []).length && ids.length > 1) return "All departments";
    return ids.map(function (id) { var c = categoryById(id); return c ? c.name : "Overview"; }).join(" · ");
  }

  function catalogItemHTML(item, i) {
    return (
      '<li class="catalog-item-wrap" data-category="' + esc(catsOf(item).join(" ")) + '">' +
        '<figure>' +
          '<button type="button" class="catalog-item" data-lb-index="' + i + '" aria-haspopup="dialog" aria-label="View larger: ' + esc(item.title) + '">' +
            '<img src="' + esc(item.thumb || item.src) + '" alt="' + esc(item.alt || item.title) + '"' +
              (item.w ? ' width="' + item.w + '" height="' + item.h + '"' : "") + ' loading="lazy" decoding="async">' +
            '<span class="zoom-icon">' + icon("zoom") + "</span>" +
          "</button>" +
          "<figcaption>" + esc(item.title) + "<small>" + esc(catLabel(item.category)) + "</small></figcaption>" +
        "</figure>" +
      "</li>"
    );
  }

  function renderCatalog() {
    var grid = $("[data-render-catalog]");
    if (!grid) return;
    lbItems = CATALOG;

    if (!CATALOG.length) {
      grid.outerHTML = '<p class="catalog-empty">Catalog images are on their way.</p>';
      return;
    }
    grid.innerHTML = CATALOG.map(catalogItemHTML).join("");
    $$(".catalog-item img", grid).forEach(attachFallback);
    renderFilters(CATALOG);

    grid.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-lb-index]");
      if (!btn) return;
      openLightbox(parseInt(btn.getAttribute("data-lb-index"), 10), btn);
    });
  }

  function renderFilters(items) {
    var mount = $("[data-render-filters]");
    var status = $("[data-catalog-status]");
    if (!mount) return;
    var used = {};
    items.forEach(function (i) { catsOf(i).forEach(function (c) { used[c] = true; }); });
    var cats = Object.keys(used);
    if (cats.length < 2) { mount.hidden = true; return; }

    var order = (CFG.services || []).map(function (c) { return c.id; }).concat(["general"]);
    cats.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });

    function count(f) {
      return items.filter(function (i) { return f === "all" || catsOf(i).indexOf(f) !== -1; }).length;
    }
    function btn(id, label, pressed) {
      return '<button type="button" class="filter-btn" data-filter="' + esc(id) + '" aria-pressed="' + pressed + '">' +
        esc(label) + ' <span class="filter-count">' + count(id) + "</span></button>";
    }

    mount.innerHTML = [btn("all", "All", true)].concat(cats.map(function (c) {
      var cat = categoryById(c);
      return btn(c, cat ? cat.name : "Overview", false);
    })).join("");

    function setStatus(f, n) {
      if (!status) return;
      var where = f === "all" ? "" : " in " + (categoryById(f) ? categoryById(f).name : "Overview");
      status.textContent = "Showing " + n + " of " + items.length + where + ".";
    }
    setStatus("all", items.length);

    mount.addEventListener("click", function (e) {
      var b = e.target.closest("[data-filter]");
      if (!b) return;
      var f = b.getAttribute("data-filter");
      $$(".filter-btn", mount).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      var wraps = $$(".catalog-item-wrap");
      function isMatch(w) { return f === "all" || w.getAttribute("data-category").split(" ").indexOf(f) !== -1; }
      function apply() {
        var shown = 0;
        wraps.forEach(function (w) { var m = isMatch(w); w.hidden = !m; if (m) shown++; });
        setStatus(f, shown);
      }
      // js/animations.js animates items out and in when it's loaded.
      if (window.PP && window.PP.animateFilter) window.PP.animateFilter(wraps, isMatch, apply);
      else apply();
    });
  }

  function buildLightbox() {
    lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Image viewer");
    lightbox.innerHTML =
      '<div class="lightbox-bar"><span class="lightbox-count" aria-live="polite"></span>' +
        '<button type="button" class="lb-btn lb-close" aria-label="Close">' + icon("close") + "</button></div>" +
      '<div class="lightbox-stage">' +
        '<button type="button" class="lb-btn lb-prev" aria-label="Previous image">' + icon("left") + "</button>" +
        '<img alt="">' +
        '<button type="button" class="lb-btn lb-next" aria-label="Next image">' + icon("right") + "</button>" +
      "</div>" +
      '<div class="lightbox-caption"></div>';
    document.body.appendChild(lightbox);

    $(".lb-close", lightbox).addEventListener("click", closeLightbox);
    $(".lb-prev", lightbox).addEventListener("click", function () { showLightbox(lbIndex - 1); });
    $(".lb-next", lightbox).addEventListener("click", function () { showLightbox(lbIndex + 1); });
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox || e.target.classList.contains("lightbox-stage")) closeLightbox(); });

    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") showLightbox(lbIndex - 1);
      else if (e.key === "ArrowRight") showLightbox(lbIndex + 1);
      else if (e.key === "Tab") {
        var f = $$("button:not([style*='none'])", lightbox).filter(function (b) { return b.offsetParent !== null; });
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // Basic swipe
    var x0 = null;
    lightbox.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) showLightbox(lbIndex + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  function visibleIndexes() {
    var wraps = $$(".catalog-item-wrap");
    if (!wraps.length) return lbItems.map(function (_, i) { return i; });
    return wraps.filter(function (w) { return !w.hidden; }).map(function (w) {
      return parseInt($("[data-lb-index]", w).getAttribute("data-lb-index"), 10);
    }).filter(function (v, i, a) { return a.indexOf(v) === i; });
  }

  function showLightbox(i) {
    var vis = visibleIndexes();
    var pos = vis.indexOf(lbIndex);
    if (i !== lbIndex) {
      pos = (pos + (i > lbIndex ? 1 : -1) + vis.length) % vis.length;
      i = vis[pos];
    }
    lbIndex = i;
    var item = lbItems[i];
    var img = $(".lightbox-stage img", lightbox);
    if (item.w) { img.width = item.w; img.height = item.h; } else { img.removeAttribute("width"); img.removeAttribute("height"); }
    img.src = item.src;
    img.alt = item.alt || item.title;
    $(".lightbox-caption", lightbox).innerHTML = esc(item.title) + "<small>" + esc(catLabel(item.category)) + "</small>";
    $(".lightbox-count", lightbox).textContent = (vis.indexOf(i) + 1) + " / " + vis.length;
    lightbox.classList.toggle("is-single", vis.length < 2);
  }

  function openLightbox(i, trigger) {
    if (!lightbox) buildLightbox();
    lbReturnFocus = trigger || null;
    lbIndex = i;
    showLightbox(i);
    lightbox.classList.add("is-open");
    document.documentElement.style.overflow = "hidden";
    setPageInert(true);
    if (window.PP && window.PP.animateLightbox) window.PP.animateLightbox(lightbox);
    $(".lb-close", lightbox).focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    document.documentElement.style.overflow = "";
    setPageInert(false);
    if (lbReturnFocus) lbReturnFocus.focus();
  }

  // While the viewer is open, everything behind it is hidden from keyboard and screen readers.
  function setPageInert(on) {
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (el === lightbox || el.tagName === "SCRIPT") return;
      if (on) el.setAttribute("inert", ""); else el.removeAttribute("inert");
    });
  }

  /* ------------------------------------------------------------------ */
  /* LocalBusiness structured data (schema.org JSON-LD) from CONFIG     */
  /* Added to Home, About and Contact, so it always matches config.js.  */
  /* Google reads JSON-LD added by JavaScript.                          */
  /* ------------------------------------------------------------------ */

  function addBusinessSchema() {
    if (["home", "about", "contact"].indexOf(currentPage) === -1) return;
    var site = String(BIZ.siteUrl || "").replace(/\/+$/, "");
    function abs(path) { return site + "/" + String(path || "").replace(/^\/+/, ""); }
    var a = typeof BIZ.address === "object" && BIZ.address ? BIZ.address : {};

    var data = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": abs("#business"),
      name: BIZ.businessName,
      description: BIZ.description,
      slogan: BIZ.tagline,
      url: abs(""),
      logo: abs("assets/logo/logo.png"),
      image: abs("assets/images/brand/og-image.jpg"),
      telephone: hasWhatsApp() ? "+" + digits(BIZ.whatsappNumber) : undefined,
      email: BIZ.email || undefined,
      address: a.city ? {
        "@type": "PostalAddress",
        streetAddress: [a.line1, a.line2].filter(Boolean).join(", "),
        addressLocality: a.city,
        addressRegion: a.state,
        postalCode: a.postcode,
        addressCountry: a.country || "IN"
      } : undefined,
      areaServed: a.city ? { "@type": "City", name: a.city } : undefined,
      hasMap: BIZ.mapLink || undefined,
      openingHours: (BIZ.openingHoursSchema || []).length ? BIZ.openingHoursSchema : undefined,
      sameAs: ["instagram", "facebook", "youtube"].map(function (k) { return (BIZ.social || {})[k]; }).filter(Boolean),
      makesOffer: (CFG.services || []).map(function (c) {
        return { "@type": "Offer", itemOffered: { "@type": "Service", name: c.name, description: c.summary } };
      })
    };
    if (!data.sameAs.length) delete data.sameAs;

    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(data); // undefined fields are dropped
    document.head.appendChild(s);
  }

  /* ------------------------------------------------------------------ */
  /* Config sanity check (console only)                                 */
  /* ------------------------------------------------------------------ */

  function warnMissing() {
    var missing = [];
    if (!hasWhatsApp()) missing.push("whatsappNumber");
    if (!BIZ.displayPhone) missing.push("displayPhone");
    if (!BIZ.email) missing.push("email");
    if (!addressLines().length) missing.push("address");
    if (/example\.com/.test(BIZ.siteUrl || "")) missing.push("siteUrl");
    if (missing.length) {
      console.info("[Perfect Print] Fill these in js/config.js to show them on the site: " + missing.join(", "));
    }
    if (CFG.statsArePlaceholders) {
      console.info("[Perfect Print] The stats numbers are placeholders. Edit `stats` in js/config.js, then set statsArePlaceholders: false.");
    }
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                               */
  /* ------------------------------------------------------------------ */

  // 404.html sets <base href="/"> so it works at any missing URL. That would turn
  // in-page links like the skip link (#main) into links to the home page, so pin them here.
  if (document.querySelector("base[href]")) {
    $$('a[href^="#"]').forEach(function (a) {
      a.setAttribute("href", location.pathname + location.search + a.getAttribute("href"));
    });
  }

  renderHeader();
  renderFooter();
  renderBlocks();
  renderCatalog();
  bindBusinessText();
  bindImages(document);
  renderWhatsAppFloat();
  addBusinessSchema();
  warnMissing();

  // Public helpers for quote.js / animations.js
  window.PP = {
    icon: icon,
    esc: esc,
    waLink: waLink,
    hasWhatsApp: hasWhatsApp,
    categoryById: categoryById,
    bindImages: bindImages
  };

  document.documentElement.classList.add("js-ready");
})();
