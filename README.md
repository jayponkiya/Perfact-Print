# Perfect Print — website

Marketing site for Perfect Print, a print and branding studio in Rajkot. Plain HTML, CSS and
JavaScript: no build step, nothing to install. Quote and contact forms open WhatsApp with the
message already written; there is no backend and no email service. Animations use GSAP from a CDN.

---

## Run it locally

**Quickest:** double-click `index.html`. Every page works straight from disk (`file://`), except
the 404 page, which only matters on a real server.

**Closer to the live site** (recommended before launch), serve the folder with any of these:

```powershell
npx serve .
```

```powershell
py -m http.server 5510
```

Then open the address it prints (for `py`: http://localhost:5510).
Or, in **VS Code**, install the *Live Server* extension, right-click `index.html` → **Open with Live Server**.

> If a change doesn't show up, press **Ctrl + F5** to skip the browser cache.

---

## Before launch — checklist

| What | Where |
|---|---|
| Live domain | Search the project for `example.com` and replace it: `js/config.js` (`siteUrl`), the `<head>` of every `.html` page (canonical + `og:` tags), `sitemap.xml`, `robots.txt` |
| Opening hours | `js/config.js` → `hours` (shown on the site) and `openingHoursSchema` (for Google) |
| Real stats | `js/config.js` → `stats`, then set `statsArePlaceholders: false` |
| About page story | `about.html`, the block marked `PLACEHOLDER COPY` |
| Social links | `js/config.js` → `social` (blank ones are hidden) |
| Catalog PDF | Rebuild it after any product or contact change (see **Catalog PDF** below) |

The browser console (F12 → Console) lists anything in `config.js` that's still missing.

---

## Edit business details — `js/config.js`

This is the one file for everything a non-developer would change. Header, footer, contact page,
quote form, services page and Google's business data all read from it.

```js
businessName: "Perfect Print",
whatsappNumber: "919974429883",   // country code + number, digits only. Every WhatsApp link uses this.
displayPhone: "99744 29883",      // how the number is shown on the site
email: "perfectprint619@gmail.com",
address: { line1: "…", line2: "Bhakti Nagar", city: "Rajkot", state: "Gujarat", postcode: "360002", country: "IN" },
hours: [{ days: "Monday – Saturday", time: "10:00 am – 8:00 pm" }],
```

- **Leave a field empty** (`""` or `[]`) and that part of the site is hidden rather than shown blank.
- **Services and products**: `services` holds the 4 departments, each with its `items`.
  Add, remove or rename products there and the services page, home cards, marquee, footer and
  quote form all update. Give an item an `image` (a key from `js/images.js`) to show a photo;
  items without one get a gradient card with the product name.
- **Home page featured products**: `featured`.
- **Quantity suggestions** on the quote form: `quote.quantities`.

The map on the contact page is built from `address`. To pin it exactly, open the shop in
Google Maps → **Share** → **Embed a map**, copy the `src="…"` link and paste it into `mapEmbedUrl`.

---

## Catalog PDF

`assets/catalog/perfect-print-catalog.pdf` is the product catalog (7 A4 pages: cover, overview,
one page per department, how to order + contact with a WhatsApp QR code). Every product in it
links to WhatsApp with that product already named. It is **generated from `js/config.js` and
`js/images.js`**, so after you change products, photos, the phone number or the address, rebuild it:

```powershell
py -m venv .venv-catalog
```

```powershell
.venv-catalog\Scripts\pip install reportlab pymupdf pillow
```

```powershell
.venv-catalog\Scripts\python tools\build_catalog.py
```

(The first two commands are only needed once. Node.js must be installed, as the script reads
`config.js` through it.) This rewrites the PDF and the page previews in `assets/catalog/pages/`
that the catalog page shows. If the PDF's size changes a lot, update `catalogPdfSize` in
`js/config.js`. The design lives in `tools/build_catalog.py`; fonts are in `tools/fonts/`.

## Add catalog images

The catalog page currently shows the 7 pages of the PDF. You can add other images (photos of
finished jobs, for example) alongside them:

1. Put the image in `assets/catalog/` (JPG, about 1200–1600 px on the long side, under ~250 KB).
2. Open `js/main.js`. Near the top is `var CATALOG = [ … ]`. Copy an entry and change it:

```js
{
  src: "assets/catalog/visiting-cards-gold.jpg",
  title: "Gold foil visiting cards",
  alt: "Black visiting cards with gold foil lettering fanned out on a desk",
  w: 1200,          // the file's width in pixels
  h: 1500,          // the file's height in pixels
  category: "printing"   // or a list: ["printing", "sign-display"]
},
```

Categories are the department ids: `"printing"`, `"stamps-labels"`, `"sign-display"`,
`"special-items"`, or `"general"` (its filter button reads "Overview"). A filter button appears
for every category that has at least one image. Add `thumb:` with a smaller copy (about 600 px
wide) to keep the grid fast.

To find `w` and `h` on Windows: right-click the file → **Properties** → **Details**.

---

## Swap a photo — `js/images.js`

Every photo on the site is listed once in `js/images.js` under a name like `heroMain` or
`serviceBanner`. Pages refer to that name, so changing a photo in this file changes it everywhere.

```js
serviceBanner: {
  src: "assets/images/services/banner-printing.jpg",
  alt: "Large-format printer producing a colourful vinyl banner",
  w: 1200, h: 800,          // the new file's pixel size
  widths: [600]             // smaller copies that exist next to it (banner-printing-600w.jpg)
},
```

To swap one:

1. Put the new file in the right folder under `assets/images/` (heroes ≤ 1920 px wide, everything
   else ≤ 1200 px, JPG at about 80 % quality, ideally under 250 KB).
2. Update `src`, `alt`, `w` and `h`.
3. Either make a 600 px-wide copy named `<name>-600w.jpg` (and `-1200w.jpg` for heroes), or
   **delete the `widths` line**. Otherwise phones will keep loading the old small copy.
4. Record where the photo came from in `assets/images/CREDITS.md`.

If a file is missing, the site shows a clean gradient block instead of a broken image, and the
browser console names the missing path.

---

## Change colours — `css/variables.css`

All colours are variables at the top of `css/variables.css`. Change a value there and it
updates across the site.

| Variable | Used for |
|---|---|
| `--c-magenta`, `--c-cyan`, `--c-yellow`, `--c-green`, `--c-orange`, `--c-violet`, `--c-blue` | Brand colours sampled from the logo: accents, department colours, blobs |
| `--c-magenta-deep`, `--c-magenta-ink` | Magenta for buttons and for magenta text on white (kept dark enough to read) |
| `--c-whatsapp-deep` | WhatsApp buttons and icons with white on them |
| `--c-ink`, `--c-paper`, `--c-paper-2`, `--c-muted` | Near-black, white, soft grey backgrounds, secondary text |
| `--grad-accent`, `--grad-accent-surface` | The magenta → violet → blue gradient (headline highlights, buttons, CTA panel) |
| `--grad-cmyk` | The CMYK strip used as dividers and underlines |
| `--c-focus` | The keyboard focus ring |

**Keep text readable.** Text needs a contrast ratio of at least 4.5 : 1 against its background
(3 : 1 for large headings). If you darken or lighten a colour that has text on it, check it at
<https://webaim.org/resources/contrastchecker/>.

Fonts (Sora for headings, Inter for text) are loaded from Google Fonts in each page's `<head>`
and set by `--font-display` and `--font-body`.

---

## How it fits together

```
index · services · catalog · about · contact · quote · 404   (.html)
  ├─ <div id="site-header"> / <div id="site-footer">   filled in by main.js
  ├─ data-render="…"                                   filled in from config.js
  └─ <img data-img="heroMain">                         src, alt, size and srcset from images.js

js/config.js      business details, services, featured products, stats, quote options
js/images.js      every photo: path, alt text, size, smaller copies
js/main.js        header, footer, icons, rendered sections, CATALOG + gallery + lightbox,
                  WhatsApp button, LocalBusiness data for Google
js/quote.js       quote + contact forms: validation, message, opening WhatsApp
js/animations.js  GSAP + ScrollTrigger animations (see below)

css/variables.css colours, fonts, spacing
css/base.css      reset, typography, layout helpers, focus ring
css/components.css header, buttons, cards, forms, lightbox, footer, motion helpers
css/pages.css     page-specific layouts

assets/images/    stock photos (+ CREDITS.md), brand/logo-176.png, brand/og-image.jpg
assets/favicon/   favicons and app icons generated from the logo
assets/logo/      original logo files (not edited)
assets/catalog/   perfect-print-catalog.pdf + pages/ (its page previews)
tools/            build_catalog.py (makes the catalog PDF) and its fonts
```

### Animations

`js/animations.js` handles the page-load CMYK wipe, hero intro, parallax, scroll reveals, counters,
the "How it works" progress line, card tilt and magnetic buttons, catalog transitions, and the
header that hides on scroll. It does nothing for visitors who have **reduce motion** turned on in
their device settings, and the site still works if the GSAP CDN can't be reached.

### SEO and sharing

- Each page has its own `<title>`, description, canonical link and Open Graph tags (share image:
  `assets/images/brand/og-image.jpg`, 1200 × 630).
- Home, About and Contact add LocalBusiness structured data, built from `config.js`. Check it with
  Google's Rich Results Test once the site is live.
- `sitemap.xml` and `robots.txt` are in the root. Update `<lastmod>` in the sitemap when pages change.

### 404 page

`404.html` uses `<base href="/">` so its links and styles work at any missing address. Most hosts
(Netlify, Vercel, GitHub Pages user sites, Apache/Nginx with `ErrorDocument`) serve it
automatically. If the site lives in a sub-folder (e.g. `example.com/print/`), change that tag to
`<base href="/print/">`.
