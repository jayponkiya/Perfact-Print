# Perfect Print — build plan

Status as of 2026-11-20: **scaffold complete**. Content and photos still needed.

## Goals

1. Show the full product range clearly (4 departments, 30 products).
2. Turn visitors into WhatsApp quote requests with as little friction as possible.
3. Easy for a non-developer to maintain: business data and images each in one file.

## Brand & design system

- Logo: spectrum "P" mark, black wordmark, CMYK strip under "PRINT" (`assets/logo/logo.png`).
- Colours sampled from the logo (`css/variables.css`): magenta #E5008A, purple #892DD6,
  violet #681EB3, indigo #052BAA, blue #0045BC, cyan #00A7EC, green #02B03F, yellow #FDEB01,
  amber #F39704, orange #FE6100, red #F2140F. CMYK strip: #00A7EC / #EC0680 / #FADC00 / ink.
- Neutrals: ink #0B0B0F, white, soft grays (#F6F6F8, #ECECF0, #E4E4EA), muted #5D5D69.
- Gradients: `--grad-brand` (full sweep, thin accents only), `--grad-accent`
  (magenta → violet → blue, for buttons and heading highlights), `--grad-cmyk` (divider motif).
- Type: Sora 600–800 for display/headings, Inter 400–700 for body. Fluid `clamp()` scale.
- Direction: premium and clean. White and ink sections alternate; the gradient is an accent
  (highlights, primary button, rings, glows), never a section background. The CMYK strip
  recurs as a divider (section headings, header on scroll, hero foot, footer top).

## Pages

| Page | Purpose | Key sections |
|---|---|---|
| Home | Overview + route to quote | Hero, service ticker, 4 service cards, why us + stats, 4-step process, catalog teaser, CTA |
| About | Trust | Story (placeholder), values, in-house capabilities, CTA |
| Services | Full product list | Jump nav, one section per department, each product links to a pre-filled quote |
| Catalog | Proof of work | Filterable grid + keyboard/swipe lightbox |
| Quote | Conversion | 2-step form, live WhatsApp message preview, copy fallback |
| Contact | Reach us | Contact details, hours, quick WhatsApp message, optional map |
| 404 | Recovery | Links back to home, services, quote |

## Service categories (from the catalog flyer)

- **Printing** — offset printing, business cards, bill books, letterheads, flyers, brochures, envelopes, paper stickers
- **Stamps & Labels** — labels, rubber stamps, shopping bags, box printing, food boxes, T-shirt, mug and keychain printing
- **Sign & Display** — sign boards, lighting boards, name boards, vinyl, frosted and one-way stickers, acrylic and letter cutting
- **Special Items** — flex, banners, UV printing, gift items, office items, screen printing

## Open items

- [x] Phone, WhatsApp, email and address added → `js/config.js` (single `CONFIG` object)
- [ ] Opening hours → `CONFIG.hours` (hidden until filled)
- [x] Swastik Designs flyer removed from the site (2026-11-20). Replaced by Perfect Print's own catalog PDF (`assets/catalog/perfect-print-catalog.pdf`, built by `tools/build_catalog.py`). The old file `assets/catalog/catelog.jpg` is no longer used anywhere.
- [ ] Source the 15 photos listed in `assets/images/CREDITS.md`
- [ ] Write the real About story
- [ ] Replace stats with real figures (years trading, clients, jobs)
- [ ] Set the live domain (canonical tags, sitemap, robots, `siteUrl`)
- [ ] Add more catalog images with categories so the filter bar appears
- [ ] Optional: self-host fonts (`assets/fonts/README.md`)
- [ ] Optional: LocalBusiness JSON-LD once address and hours are confirmed
