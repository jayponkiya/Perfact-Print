/* ==========================================================================
   Perfect Print — animations (GSAP 3 + ScrollTrigger, free plugins only)
   --------------------------------------------------------------------------
   Load order: config.js → images.js → main.js → gsap → ScrollTrigger → this.

   Rules this file keeps:
   - Only transform and opacity are animated. The heading underline uses a CSS
     variable that feeds transform: scaleX().
   - prefers-reduced-motion: nothing here runs; the page shows as-is.
   - If GSAP fails to load, the page still works (the head script removes
     its cover after 3 s at most, and this file removes it straight away).
   - Looping tweens pause while their section is off screen.
   - ScrollTrigger.refresh() runs after fonts and every image have loaded.

   The <head> of each page sets html.pp-motion (+ html.pp-loading, a cover
   that hides the page until the CMYK wipe takes over).
   ========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;

  function uncover() { root.classList.remove("pp-loading"); }

  if (reduce || !gsap || !ST) {
    uncover();
    root.classList.remove("pp-motion");
    return;
  }

  gsap.registerPlugin(ST);
  gsap.defaults({ ease: "power3.out", duration: 0.8 });

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  var mm = gsap.matchMedia();
  var DESKTOP_POINTER = "(hover: hover) and (pointer: fine) and (min-width: 1024px)";

  /* ======================================================================
     1. Page transitions — CMYK bar wipe (C, M, Y, K)
     ====================================================================== */

  var wipe = document.createElement("div");
  wipe.className = "page-wipe";
  wipe.setAttribute("aria-hidden", "true");
  wipe.innerHTML = "<span></span><span></span><span></span><span></span>";
  document.body.appendChild(wipe);
  var bars = $$("span", wipe);

  // Start covered, drop the head-script cover, then sweep the bars away to the right.
  gsap.set(bars, { scaleX: 1, transformOrigin: "right center" });
  uncover();

  // Built paused; it plays once web fonts are ready (or after 800 ms), so the
  // headline is split into lines using the real font metrics.
  var intro = gsap.timeline({ paused: true });
  intro.to(bars, { scaleX: 0, duration: 0.55, ease: "power3.inOut", stagger: 0.08 }, 0);

  function shouldTransition(a, e) {
    if (!a || e.defaultPrevented || e.button !== 0) return false;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if (a.target && a.target !== "_self") return false;
    if (a.hasAttribute("download") || a.hasAttribute("data-no-transition")) return false;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#") return false;
    var url;
    try { url = new URL(a.href, window.location.href); } catch (err) { return false; }
    if (url.origin !== window.location.origin) return false;               // wa.me, maps, etc.
    if (!/^https?:$/.test(url.protocol)) return false;                     // tel:, mailto:
    if (url.pathname === window.location.pathname && url.search === window.location.search) return false; // same page / hash
    return true;
  }

  var leaving = false;
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (leaving || !shouldTransition(a, e)) return;
    e.preventDefault();
    leaving = true;
    var dest = a.href;
    wipe.classList.add("is-active");
    gsap.killTweensOf(bars);
    gsap.fromTo(bars,
      { scaleX: 0, transformOrigin: "left center" },
      { scaleX: 1, duration: 0.45, ease: "power3.inOut", stagger: 0.07,
        onComplete: function () { window.location.href = dest; } });
  });

  // Back/forward cache: the page comes back with the bars still covering it.
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    leaving = false;
    wipe.classList.remove("is-active");
    gsap.set(bars, { scaleX: 0 });
  });

  /* ======================================================================
     2. Load intro — header, hero copy (headline line by line), collage
     ====================================================================== */

  var header = $(".site-header");
  if (header) {
    intro.from($$(".brand, .nav-list > li, .header-actions", header), {
      y: -18, opacity: 0, duration: 0.6, stagger: 0.06, clearProps: "transform,opacity"
    }, 0.25);
  }

  /* Manual line split (no SplitText): wrap each word, group words by their
     offsetTop, then rebuild as masked lines. The gradient .ink span is kept
     per line. The original markup is restored once the reveal finishes. */
  function splitLines(el) {
    var original = el.innerHTML;
    var words = [];
    Array.prototype.forEach.call(el.childNodes, function (node) {
      var ink = node.nodeType === 1 && node.classList.contains("ink");
      var text = node.textContent || "";
      text.split(/\s+/).forEach(function (w) { if (w) words.push({ text: w, ink: ink }); });
    });
    if (!words.length) return null;

    el.innerHTML = words.map(function (w, i) {
      return '<span class="split-word" data-i="' + i + '">' + escapeHTML(w.text) + "</span>";
    }).join(" ");

    var lines = [];
    var lastTop = null;
    $$(".split-word", el).forEach(function (span, i) {
      var top = span.offsetTop;
      if (lastTop === null || Math.abs(top - lastTop) > 4) { lines.push([]); lastTop = top; }
      lines[lines.length - 1].push(words[i]);
    });

    el.innerHTML = lines.map(function (line) {
      var html = "";
      var inInk = false;
      line.forEach(function (w, i) {
        if (w.ink && !inInk) { html += (i ? " " : "") + '<span class="ink">'; inInk = true; }
        else if (!w.ink && inInk) { html += "</span>"; inInk = false; html += " "; }
        else if (i) html += " ";
        html += escapeHTML(w.text);
      });
      if (inInk) html += "</span>";
      return '<span class="split-line"><span class="split-inner">' + html + "</span></span>";
    }).join(" ");

    return { inners: $$(".split-inner", el), restore: function () { el.innerHTML = original; } };
  }

  function escapeHTML(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Hero copy: the first matching container on the page.
  var heroCopy = $(".home-hero-copy") || $(".page-hero .container") || $(".error-page > div");
  if (heroCopy) {
    var h1 = $("h1", heroCopy);
    var others = Array.prototype.filter.call(heroCopy.children, function (c) { return c !== h1; });
    var before = others.filter(function (c) { return h1 && (c.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING); });
    var after = others.filter(function (c) { return before.indexOf(c) === -1; });

    if (before.length) intro.from(before, { y: 20, opacity: 0, duration: 0.6, stagger: 0.08, clearProps: "transform,opacity" }, 0.35);
    if (after.length) intro.from(after, { y: 24, opacity: 0, duration: 0.7, stagger: 0.1, clearProps: "transform,opacity" }, 0.75);
  }

  function addHeadlineReveal() {
    var h1 = heroCopy && $("h1", heroCopy);
    var split = h1 ? splitLines(h1) : null;
    if (!split) return;
    intro.from(split.inners, {
      yPercent: 110, duration: 0.9, ease: "power4.out", stagger: 0.12,
      onComplete: split.restore
    }, 0.45);
  }

  var started = false;
  function startIntro() {
    if (started) return;
    started = true;
    addHeadlineReveal();
    intro.play();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(startIntro);
  setTimeout(startIntro, 800);

  // Floating product cards: stagger in, then float gently on a loop.
  var collage = $(".hero-collage");
  var floaters = collage ? $$(".float-card, .float-chip", collage) : [];
  var loops = [];

  if (floaters.length) {
    intro.from(floaters, {
      y: 70, opacity: 0, scale: 0.88, duration: 1, ease: "back.out(1.4)", stagger: 0.12,
      onComplete: startFloating
    }, 0.6);
  }

  function startFloating() {
    floaters.forEach(function (el, i) {
      loops.push(gsap.to(el, {
        y: i % 2 ? 12 : -12,
        duration: 2.8 + i * 0.35,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      }));
    });
  }

  // Gradient blobs drift slowly (every page: hero, inner heroes, CTA panels).
  $$(".blob").forEach(function (blob) {
    var tween = gsap.to(blob, {
      x: "random(-60, 60)",
      y: "random(-40, 40)",
      scale: "random(0.85, 1.2)",
      duration: "random(7, 11)",
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      repeatRefresh: true
    });
    pauseOffscreen(blob.parentElement, [tween]);
  });

  if (collage) pauseOffscreen($(".home-hero"), loops, true);

  // Pause looping tweens while their section is out of view.
  function pauseOffscreen(section, tweens, live) {
    if (!section) return;
    ST.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      onToggle: function (self) {
        (live ? loops : tweens).forEach(function (t) { self.isActive ? t.play() : t.pause(); });
      }
    });
  }

  /* ======================================================================
     3. Hero parallax — mouse on the collage (desktop), scroll on the photo
     ====================================================================== */

  mm.add(DESKTOP_POINTER, function () {
    var hero = $(".home-hero");
    if (!hero || !floaters.length) return;
    var depth = [0.6, 1.1, 1.5, 0.9, 1.3];
    var movers = floaters.map(function (el, i) {
      return {
        x: gsap.quickTo(el, "xPercent", { duration: 0.8, ease: "power3.out" }),
        y: gsap.quickTo(el, "yPercent", { duration: 0.8, ease: "power3.out" }),
        d: depth[i % depth.length]
      };
    });
    function onMove(e) {
      var r = hero.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5;
      var ny = (e.clientY - r.top) / r.height - 0.5;
      movers.forEach(function (m) { m.x(nx * 7 * m.d); m.y(ny * 7 * m.d); });
    }
    function onLeave() { movers.forEach(function (m) { m.x(0); m.y(0); }); }
    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseleave", onLeave);
    return function () {
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
      onLeave();
    };
  });

  $$(".home-hero-media img, .page-hero .media-bg img").forEach(function (img) {
    var section = img.closest(".home-hero, .page-hero");
    gsap.set(img, { scale: 1.16 });
    gsap.fromTo(img, { yPercent: -5 }, {
      yPercent: 7,
      ease: "none",
      scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true }
    });
  });

  /* ======================================================================
     4. Marquee — GSAP infinite loop that slows on hover
     ====================================================================== */

  $$(".ticker").forEach(function (ticker) {
    var track = $(".ticker-track", ticker);
    if (!track) return;
    ticker.classList.add("ticker--gsap"); // turns off the CSS fallback animation
    var half = track.scrollWidth / 2;
    var loop = gsap.to(track, { xPercent: -50, duration: Math.max(20, half / 55), ease: "none", repeat: -1 });
    ticker.addEventListener("mouseenter", function () { gsap.to(loop, { timeScale: 0.2, duration: 0.6, ease: "power2.out" }); });
    ticker.addEventListener("mouseleave", function () { gsap.to(loop, { timeScale: 1, duration: 0.6, ease: "power2.in" }); });
    pauseOffscreen(ticker, [loop]);
  });

  /* ======================================================================
     5. Scroll reveals
     ====================================================================== */

  // Single blocks fade up.
  var REVEAL = [
    ".section-head", ".service-section-head", ".cta-gradient", ".split > *",
    ".contact-panel", ".quote-form-wrap", ".quote-aside > *", ".filters",
    ".section .text-center", ".catalog-status"
  ].join(",");

  $$(REVEAL).forEach(function (el) {
    if (el.closest(".home-hero, .page-hero")) return;
    gsap.from(el, {
      y: 40, opacity: 0, duration: 0.9,
      clearProps: "transform,opacity",
      scrollTrigger: { trigger: el, start: "top 88%", once: true }
    });
  });

  // Section headings: the CMYK underline draws left to right.
  $$(".section-head h2").forEach(function (h2) {
    gsap.set(h2, { "--u": 0 });
    gsap.to(h2, {
      "--u": 1, duration: 0.9, ease: "power3.inOut", delay: 0.25,
      scrollTrigger: { trigger: h2, start: "top 88%", once: true }
    });
  });

  // Card grids stagger in, in batches as they enter.
  var GRID_ITEMS = [
    "[data-render='service-cards'] > *", ".featured-grid .catalog-tile", ".featured-items > *",
    ".why-grid > *", ".values-grid > *", ".item-grid > *", ".contact-tiles > *",
    ".catalog-grid > *", ".stats > *"
  ].join(",");

  var gridItems = $$(GRID_ITEMS);
  if (gridItems.length) {
    gsap.set(gridItems, { y: 48, opacity: 0 });
    ST.batch(gridItems, {
      start: "top 90%",
      once: true,
      onEnter: function (els) {
        gsap.to(els, { y: 0, opacity: 1, duration: 0.8, stagger: 0.09, overwrite: true, clearProps: "transform,opacity" });
      }
    });
  }

  // Image reveal: photos scale down into their frame as cards enter.
  var frameMedia = $$(".img-frame > img, .item-ph > *").filter(function (el) {
    return !el.closest(".home-hero, .page-hero, .hero-collage");
  });
  if (frameMedia.length) {
    gsap.set(frameMedia, { scale: 1.22, opacity: 0 });
    ST.batch(frameMedia, {
      start: "top 92%",
      once: true,
      onEnter: function (els) {
        gsap.to(els, { scale: 1, opacity: 1, duration: 1.2, ease: "power3.out", stagger: 0.08, overwrite: true, clearProps: "transform,opacity" });
      }
    });
  }

  // Number counters.
  $$("[data-count]").forEach(function (el) {
    var end = parseFloat(el.getAttribute("data-count")) || 0;
    var state = { v: 0 };
    el.textContent = "0";
    gsap.to(state, {
      v: end,
      duration: 2,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
      onUpdate: function () { el.textContent = Math.round(state.v).toLocaleString("en-IN"); }
    });
  });

  /* ======================================================================
     6. "How it works" — a line draws along the steps (scrub), steps light up
     ====================================================================== */

  $$(".steps").forEach(function (list) {
    var steps = $$(".step", list);
    if (steps.length < 2) return;
    list.classList.add("steps--track");
    var line = document.createElement("li"); // an <ol> may only contain <li>; hidden from screen readers
    line.className = "steps-line";
    line.setAttribute("aria-hidden", "true");
    line.innerHTML = '<span class="steps-line-fill"></span>';
    list.insertBefore(line, list.firstChild);
    var fill = line.firstChild;

    mm.add({ wide: "(min-width: 1000px)", narrow: "(max-width: 999px)" }, function (ctx) {
      var axis = ctx.conditions.wide ? "scaleX" : "scaleY";
      var from = {}; from[axis] = 0;
      var to = { duration: steps.length, ease: "none" }; to[axis] = 1;

      var tl = gsap.timeline({
        scrollTrigger: { trigger: list, start: "top 78%", end: "bottom 55%", scrub: 0.6 }
      });
      tl.fromTo(fill, from, to, 0);
      steps.forEach(function (step, i) {
        tl.fromTo(step, { opacity: 0.35, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, i * 0.9);
      });
      return function () { gsap.set(steps, { clearProps: "opacity,transform" }); };
    });
  });

  /* ======================================================================
     7. Hover: card tilt and magnetic buttons (desktop pointers only)
     ====================================================================== */

  mm.add(DESKTOP_POINTER, function () {
    var cleanups = [];

    $$(".product-card, .service-card, .item-card, .why-card, .value-card, .contact-tile, .catalog-tile").forEach(function (card) {
      card.classList.add("pp-tilt");
      var rx = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3.out" });
      var ry = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3.out" });
      function move(e) {
        var r = card.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - 0.5;
        var ny = (e.clientY - r.top) / r.height - 0.5;
        ry(nx * 8);
        rx(-ny * 8);
      }
      // Perspective is set on each enter: the scroll reveal's clearProps wipes it.
      function enter() { gsap.set(card, { transformPerspective: 900 }); gsap.to(card, { y: -6, duration: 0.4, overwrite: "auto" }); }
      function leave() { rx(0); ry(0); gsap.to(card, { y: 0, duration: 0.5, overwrite: "auto" }); }
      card.addEventListener("mousemove", move);
      card.addEventListener("mouseenter", enter);
      card.addEventListener("mouseleave", leave);
      cleanups.push(function () {
        card.removeEventListener("mousemove", move);
        card.removeEventListener("mouseenter", enter);
        card.removeEventListener("mouseleave", leave);
        card.classList.remove("pp-tilt");
        gsap.set(card, { clearProps: "transform" });
      });
    });

    $$(".btn").forEach(function (btn) {
      btn.classList.add("pp-magnetic");
      var bx = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3.out" });
      var by = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3.out" });
      function move(e) {
        var r = btn.getBoundingClientRect();
        bx(Math.max(-8, Math.min(8, (e.clientX - (r.left + r.width / 2)) * 0.25)));
        by(Math.max(-6, Math.min(6, (e.clientY - (r.top + r.height / 2)) * 0.3)));
      }
      function leave() { gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.45)", overwrite: true }); }
      btn.addEventListener("mousemove", move);
      btn.addEventListener("mouseleave", leave);
      cleanups.push(function () {
        btn.removeEventListener("mousemove", move);
        btn.removeEventListener("mouseleave", leave);
        btn.classList.remove("pp-magnetic");
        gsap.set(btn, { clearProps: "transform" });
      });
    });

    return function () { cleanups.forEach(function (fn) { fn(); }); };
  });

  /* ======================================================================
     8. Catalog — animated filtering and lightbox open (hooks used by main.js)
     ====================================================================== */

  var PP = window.PP || (window.PP = {});
  var filterTl = null;

  // main.js calls this instead of toggling `hidden` straight away.
  PP.animateFilter = function (wraps, isMatch, apply) {
    if (filterTl) filterTl.progress(1).kill();
    var out = wraps.filter(function (w) { return !w.hidden; });
    filterTl = gsap.timeline();
    if (out.length) {
      filterTl.to(out, { opacity: 0, scale: 0.94, y: 12, duration: 0.25, ease: "power2.in", stagger: 0.03 });
    }
    filterTl.add(function () {
      apply();
      var shown = wraps.filter(function (w) { return !w.hidden; });
      gsap.fromTo(shown,
        { opacity: 0, scale: 0.94, y: 24 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.06, clearProps: "transform,opacity",
          onComplete: function () { ST.refresh(); } });
    });
  };

  PP.animateLightbox = function (lb) {
    var img = $(".lightbox-stage img", lb);
    var chrome = $$(".lightbox-bar, .lightbox-caption, .lb-prev, .lb-next", lb);
    gsap.fromTo(img, { scale: 0.88, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: "power3.out", clearProps: "transform,opacity" });
    gsap.fromTo(chrome, { opacity: 0 }, { opacity: 1, duration: 0.4, delay: 0.12, clearProps: "opacity" });
  };

  /* ======================================================================
     9. Header hides on scroll down, shows on scroll up
     ====================================================================== */

  if (header) {
    var shown = true;
    var showHeader = function (on) {
      if (on === shown) return;
      shown = on;
      gsap.to(header, { yPercent: on ? 0 : -110, duration: on ? 0.45 : 0.35, ease: on ? "power3.out" : "power2.in", overwrite: true });
    };
    ST.create({
      start: 0,
      end: "max",
      onUpdate: function (self) {
        if (root.classList.contains("menu-open")) return showHeader(true);
        if (self.scroll() < 160) return showHeader(true);
        showHeader(self.direction < 0);
      }
    });
    // Keyboard users tabbing into the header always see it.
    header.addEventListener("focusin", function () { showHeader(true); });
  }

  /* ======================================================================
     10. Keep trigger positions right as fonts and lazy images arrive
     ====================================================================== */

  var refreshTimer = null;
  function queueRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () { ST.refresh(); }, 150);
  }

  $$("img").forEach(function (img) {
    if (!img.complete) {
      img.addEventListener("load", queueRefresh, { once: true });
      img.addEventListener("error", queueRefresh, { once: true });
    }
  });
  window.addEventListener("load", queueRefresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueRefresh);
})();
