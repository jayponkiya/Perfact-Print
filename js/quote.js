/* ==========================================================================
   Perfect Print — WhatsApp forms
   --------------------------------------------------------------------------
   #quote-form   (quote.html)    full quotation request with live preview
   #contact-form (contact.html)  quick message

   Both go through the same steps (initWhatsAppForm):
     1. validate inline (required fields, 10-digit Indian mobile, dates)
     2. build a plain multi-line message
     3. open https://wa.me/<CONFIG.whatsappNumber>?text=<encoded message>
        in a new tab (the link is built by PP.waLink in main.js, which reads
        the number from js/config.js and nowhere else)
     4. show a success panel with a "Didn't open? Click here" fallback link

   No backend and no email service: the customer presses Send in WhatsApp.

   Deep links: quote.html?service=printing&item=Business%20Cards
               quote.html?service=printing   (or a name: ?service=Rubber%20Stamps)
   ========================================================================== */

(function () {
  "use strict";

  var CFG = window.CONFIG || {};
  var PP = window.PP;
  if (!PP) return;

  var BRAND = CFG.businessName || "Perfect Print";

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  // Value of a named control (text, select, textarea or radio group), trimmed.
  function val(form, name) {
    var el = form.elements.namedItem(name);
    return el ? String(el.value || "").trim() : "";
  }

  /* ------------------------------------------------------------------ */
  /* Phone + date helpers                                               */
  /* ------------------------------------------------------------------ */

  // Accepts "98765 43210", "+91 98765-43210", "09876543210", "919876543210".
  // Returns the 10 digits, or "" when it isn't a valid Indian mobile number.
  function normalisePhone(raw) {
    var d = String(raw || "").replace(/\D/g, "");
    if (d.length === 12 && d.indexOf("91") === 0) d = d.slice(2);
    else if (d.length === 11 && d.charAt(0) === "0") d = d.slice(1);
    return /^[6-9]\d{9}$/.test(d) ? d : "";
  }

  function formatPhone(raw) {
    var d = normalisePhone(raw);
    return d ? "+91 " + d.slice(0, 5) + " " + d.slice(5) : raw;
  }

  function todayISO() {
    var t = new Date();
    t.setMinutes(t.getMinutes() - t.getTimezoneOffset()); // local date, not UTC
    return t.toISOString().slice(0, 10);
  }

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return days[d.getDay()] + ", " + d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear(); // "Sat, 5 Dec 2026"
  }

  /* ------------------------------------------------------------------ */
  /* Inline validation                                                  */
  /* ------------------------------------------------------------------ */
  /* Markup hooks on a control:
       data-required               must not be empty   (message: data-error-required)
       data-validate="phone"       10-digit Indian mobile (message: data-error-phone)
       data-validate="future-date" today or later        (message: data-error-date)
     Each control sits in a .field with an empty <span class="field-error">. */

  function errorFor(el) {
    var v = String(el.value || "").trim();
    if (el.hasAttribute("data-required") && !v) {
      return el.getAttribute("data-error-required") || "This field is required.";
    }
    var rule = el.getAttribute("data-validate");
    if (v && rule === "phone" && !normalisePhone(v)) {
      return el.getAttribute("data-error-phone") || "Enter a 10-digit mobile number, e.g. 98765 43210.";
    }
    if (v && rule === "future-date" && v < todayISO()) {
      return el.getAttribute("data-error-date") || "Please choose today or a later date.";
    }
    return "";
  }

  function setError(el, msg) {
    var wrap = el.closest(".field");
    if (!wrap) return;
    var err = $(".field-error", wrap);
    if (err) {
      if (!err.id) err.id = (el.id || el.name) + "-error";
      err.textContent = msg || "";
      var ids = (el.getAttribute("aria-describedby") || "").split(" ").filter(function (x) { return x && x !== err.id; });
      if (msg) ids.push(err.id);
      if (ids.length) el.setAttribute("aria-describedby", ids.join(" ")); else el.removeAttribute("aria-describedby");
    }
    wrap.classList.toggle("has-error", !!msg);
    if (msg) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
  }

  function checkedControls(form) {
    return $$("[data-required], [data-validate]", form);
  }

  function validate(form) {
    var firstBad = null;
    checkedControls(form).forEach(function (el) {
      var msg = errorFor(el);
      setError(el, msg);
      if (msg && !firstBad) firstBad = el;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  /* ------------------------------------------------------------------ */
  /* The shared sender                                                  */
  /* ------------------------------------------------------------------ */

  // Opens WhatsApp with the message in a new tab and returns the link used.
  // Returns "" (and shows the setup notice) if no number is set in config.js.
  function sendViaWhatsApp(message, form) {
    if (!PP.hasWhatsApp()) {
      var notice = $("[data-wa-missing]", form.parentElement) || $("[data-wa-missing]");
      if (notice) { notice.hidden = false; notice.scrollIntoView({ behavior: "smooth", block: "center" }); }
      return { url: "", opened: false };
    }
    var url = PP.waLink(message); // https://wa.me/<CONFIG.whatsappNumber>?text=<encodeURIComponent(message)>
    var win = window.open(url, "_blank");
    if (win) { try { win.opener = null; } catch (e) { /* cross-origin already */ } }
    return { url: url, opened: !!win };
  }

  /* Wires one form: live re-validation, submit → validate → build → send → success panel.
     `build(form)` returns the message text. */
  function initWhatsAppForm(form, build, onChange) {
    var success = $("[data-form-success]", form.parentElement);

    // Re-check a field when the user leaves it, and clear its error as soon as it's fixed.
    checkedControls(form).forEach(function (el) {
      el.addEventListener("blur", function () {
        if (String(el.value || "").trim() || el.closest(".field.has-error")) setError(el, errorFor(el));
      });
      el.addEventListener("input", function () {
        if (el.closest(".field.has-error") && !errorFor(el)) setError(el, "");
      });
      el.addEventListener("change", function () {
        if (el.closest(".field.has-error")) setError(el, errorFor(el));
      });
    });

    if (onChange) {
      form.addEventListener("input", onChange);
      form.addEventListener("change", onChange);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      var result = sendViaWhatsApp(build(form), form);
      if (result.url && success) showSuccess(form, success, result);
    });

    if (!success) return;

    $$("[data-form-edit]", success).forEach(function (b) {
      b.addEventListener("click", function () { hideSuccess(form, success); });
    });
    $$("[data-form-new]", success).forEach(function (b) {
      b.addEventListener("click", function () {
        form.reset();
        checkedControls(form).forEach(function (el) { setError(el, ""); });
        hideSuccess(form, success);
        if (onChange) onChange();
      });
    });
  }

  function showSuccess(form, success, result) {
    $$("[data-wa-fallback]", success).forEach(function (a) { a.href = result.url; });
    var lead = $("[data-success-lead]", success);
    if (lead) {
      lead.textContent = result.opened
        ? "Your message is written and waiting in WhatsApp. Just press Send."
        : "Your browser stopped the new tab from opening. Use the link below to open WhatsApp with your message.";
    }
    success.classList.toggle("is-blocked", !result.opened);
    form.hidden = true;
    success.hidden = false;
    success.focus();
  }

  function hideSuccess(form, success) {
    success.hidden = true;
    form.hidden = false;
    var first = $("input, select, textarea", form);
    if (first) first.focus();
  }

  function copyText(text, btn) {
    var label = btn.textContent;
    function done() { btn.textContent = "Copied!"; setTimeout(function () { btn.textContent = label; }, 1800); }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else { fallbackCopy(text); done(); }
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* ignore */ }
    ta.remove();
  }

  /* ------------------------------------------------------------------ */
  /* Quote form                                                         */
  /* ------------------------------------------------------------------ */
  /* Service option values: "printing" (whole department),
     "printing::Business Cards" (a product), or "other". */

  var SEP = "::";

  function serviceOptionsHTML() {
    var html = '<option value="">Choose a service…</option>';
    (CFG.services || []).forEach(function (c) {
      html += '<optgroup label="' + PP.esc(c.name) + '">';
      c.items.forEach(function (i) {
        html += '<option value="' + PP.esc(c.id + SEP + i.name) + '">' + PP.esc(i.name) + "</option>";
      });
      html += '<option value="' + PP.esc(c.id) + '">Other ' + PP.esc(c.name.toLowerCase()) + " job</option>";
      html += "</optgroup>";
    });
    return html + '<option value="other">Something else / not sure</option>';
  }

  function serviceLabel(value) {
    if (!value) return "";
    if (value === "other") return "Something else / not sure";
    var parts = value.split(SEP);
    var c = PP.categoryById(parts[0]);
    if (!c) return value;
    return parts[1] ? c.name + " › " + parts[1] : c.name + " (other)";
  }

  // ?service=printing&item=Business Cards, ?service=printing, or ?service=Business Cards
  function preselectService(select) {
    var params = new URLSearchParams(window.location.search);
    var svc = (params.get("service") || "").trim();
    var item = (params.get("item") || "").trim();
    if (!svc && !item) return;
    var opts = $$("option", select);
    var lc = function (s) { return String(s).toLowerCase(); };
    var pick =
      opts.filter(function (o) { return item && o.value === svc + SEP + item; })[0] ||
      opts.filter(function (o) { return o.value === svc; })[0] ||
      opts.filter(function (o) { return lc(o.textContent) === lc(item || svc); })[0] ||
      opts.filter(function (o) {
        var c = PP.categoryById(o.value);
        return c && lc(c.name) === lc(svc);
      })[0];
    if (pick) select.value = pick.value;
  }

  function quoteMessage(form) {
    var lines = ["*New Quotation Request - " + BRAND + "*"];
    function add(label, v) { if (v) lines.push(label + ": " + v); }
    add("Name", val(form, "name"));
    add("Phone", val(form, "phone") ? formatPhone(val(form, "phone")) : "");
    add("Service", serviceLabel(val(form, "service")));
    add("Quantity", val(form, "quantity"));
    add("Size / Paper / Material", val(form, "specs"));
    add("Needed by", formatDate(val(form, "needed_by")));
    add("Delivery / Pickup", val(form, "fulfilment"));
    add("Details", val(form, "details"));
    return lines.join("\n");
  }

  function initQuote() {
    var form = $("#quote-form");
    if (!form) return;

    var svc = form.elements.namedItem("service");
    svc.innerHTML = serviceOptionsHTML();
    preselectService(svc);

    var date = form.elements.namedItem("needed_by");
    if (date) date.min = todayISO();

    var qList = $("#q-quantity-list");
    if (qList) {
      qList.innerHTML = ((CFG.quote && CFG.quote.quantities) || []).map(function (q) {
        return '<option value="' + PP.esc(q) + '"></option>';
      }).join("");
    }

    var preview = $("#wa-preview");
    function updatePreview() {
      if (!preview) return;
      var msg = quoteMessage(form);
      preview.textContent = msg.indexOf("\n") === -1 ? "" : msg; // header only → show the empty hint
    }

    initWhatsAppForm(form, quoteMessage, updatePreview);
    updatePreview();

    var copyBtn = $("#copy-message");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var m = quoteMessage(form);
        if (m.indexOf("\n") !== -1) copyText(m, copyBtn);
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Contact form (same sender)                                         */
  /* ------------------------------------------------------------------ */

  function contactMessage(form) {
    var lines = ["*New Message - " + BRAND + "*"];
    function add(label, v) { if (v) lines.push(label + ": " + v); }
    add("Name", val(form, "name"));
    add("Phone", val(form, "phone") ? formatPhone(val(form, "phone")) : "");
    add("Message", val(form, "message"));
    return lines.join("\n");
  }

  function initContact() {
    var form = $("#contact-form");
    if (form) initWhatsAppForm(form, contactMessage);
  }

  /* ------------------------------------------------------------------ */

  if (!PP.hasWhatsApp()) {
    $$("[data-wa-missing]").forEach(function (n) { n.hidden = false; });
  }
  initQuote();
  initContact();

  // For testing in the console.
  window.PPForms = { normalisePhone: normalisePhone, quoteMessage: quoteMessage, contactMessage: contactMessage };
})();
