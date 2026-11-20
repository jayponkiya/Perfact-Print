"""Perfect Print product catalog (A4 PDF), built from js/config.js + js/images.js.

Rebuild after changing products, photos or contact details (see README → "Catalog PDF"):

    python tools/build_catalog.py

Needs Node.js (to read config.js) and the Python packages reportlab, pymupdf and pillow.
Writes assets/catalog/perfect-print-catalog.pdf and the page previews in assets/catalog/pages/
(catalog-page-N.jpg + catalog-page-N-600w.jpg) that the website's catalog page shows.
Fonts (Sora, Inter — SIL Open Font License) are in tools/fonts/.
"""
import json, subprocess, sys, tempfile, urllib.parse
from datetime import date
from pathlib import Path

from PIL import Image
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import mm
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "tools" / "fonts"
WORK = Path(tempfile.mkdtemp(prefix="pp-catalog-"))

# Read the same data the website uses (config.js + images.js) through Node.
_js = ("global.window={};require('./js/config.js');require('./js/images.js');"
       "process.stdout.write(JSON.stringify({config:window.CONFIG,images:window.IMAGES}))")
site = json.loads(subprocess.run(["node", "-e", _js], cwd=ROOT, capture_output=True, text=True, check=True).stdout)
CFG, IMG = site["config"], site["images"]

for name, file in [("Sora-Bold", "Sora-Bold.ttf"), ("Sora-XB", "Sora-ExtraBold.ttf"),
                   ("Inter", "Inter-Regular.ttf"), ("Inter-SB", "Inter-SemiBold.ttf")]:
    pdfmetrics.registerFont(TTFont(name, str(FONTS / file)))

W, H = 210 * mm, 297 * mm
M = 16 * mm  # page margin

# Brand tokens (css/variables.css)
INK, INK2, PAPER2, LINE = HexColor("#0b0b0f"), HexColor("#17171d"), HexColor("#f6f6f8"), HexColor("#e4e4ea")
MUTED = HexColor("#5d5d69")
MAGENTA, MAG_DEEP, VIOLET, BLUE = HexColor("#e5008a"), HexColor("#d1007e"), HexColor("#681eb3"), HexColor("#0045bc")
CYAN, YELLOW, GREEN, ORANGE, AMBER = HexColor("#00a7ec"), HexColor("#fdeb01"), HexColor("#02b03f"), HexColor("#fe6100"), HexColor("#f39704")
CMYK = [HexColor("#00a7ec"), HexColor("#ec0680"), HexColor("#fadc00"), INK]
WA = HexColor("#0d7a41")
ACCENT = {"cyan": CYAN, "magenta": MAGENTA, "orange": ORANGE, "green": GREEN, "yellow": AMBER, "violet": VIOLET}
HERO_GRAD = [HexColor("#ff4fb4"), HexColor("#c77dff"), HexColor("#3cc8ff")]  # readable on ink

digits = "".join(ch for ch in CFG["whatsappNumber"] if ch.isdigit())
PHONE = "+91 " + CFG["displayPhone"]
EMAIL = CFG["email"]
A = CFG["address"]
ADDRESS = [A["line1"], A["line2"], f'{A["city"]}, {A["state"]} {A["postcode"]}']
MAP = CFG.get("mapLink", "")
SITE = CFG.get("siteUrl", "")
SHOW_SITE = SITE and "example.com" not in SITE


def wa(text):
    return f"https://wa.me/{digits}?text=" + urllib.parse.quote(text)


def top(y_mm_from_top):
    """Convert a distance from the top edge (pt) into a reportlab y coordinate."""
    return H - y_mm_from_top


# ------------------------------------------------------------------ helpers

_img_cache = {}
def prepared(key_or_path, aspect, width_px=720):
    """Crop an image to `aspect` (w/h), centred, and save a JPEG copy for embedding."""
    src = ROOT / (IMG[key_or_path]["src"] if key_or_path in IMG else key_or_path)
    ck = (str(src), round(aspect, 3), width_px)
    if ck in _img_cache:
        return _img_cache[ck]
    im = Image.open(src).convert("RGB")
    if im.width / im.height > aspect:
        nw = int(im.height * aspect); x0 = (im.width - nw) // 2
        im = im.crop((x0, 0, x0 + nw, im.height))
    else:
        nh = int(im.width / aspect); y0 = (im.height - nh) // 2
        im = im.crop((0, y0, im.width, y0 + nh))
    im = im.resize((width_px, int(width_px / aspect)), Image.LANCZOS)
    out = WORK / f"img-{len(_img_cache)}.jpg"
    im.save(out, "JPEG", quality=84, optimize=True)
    _img_cache[ck] = str(out)
    return str(out)


def rrect_path(c, x, y, w, h, r):
    p = c.beginPath()
    p.roundRect(x, y, w, h, r)
    return p


def clipped_image(c, path, x, y, w, h, r):
    c.saveState()
    c.clipPath(rrect_path(c, x, y, w, h, r), stroke=0, fill=0)
    c.drawImage(path, x, y, w, h)
    c.restoreState()


def gradient_box(c, x, y, w, h, r, colors, horizontal=False):
    c.saveState()
    c.clipPath(rrect_path(c, x, y, w, h, r), stroke=0, fill=0)
    if horizontal:
        c.linearGradient(x, y, x + w, y, colors, extend=True)
    else:
        c.linearGradient(x, y + h, x + w, y, colors, extend=True)
    c.restoreState()


def blob(c, cx, cy, r, color, alpha=0.55, steps=18):
    """Soft glow: stacked translucent circles (PDF has no blur)."""
    c.saveState()
    for i in range(steps):
        c.setFillColor(color, alpha=alpha / steps * 1.5)
        c.circle(cx, cy, r * (1 - i / steps), stroke=0, fill=1)
    c.restoreState()


def grad_text(c, text, x, y, font, size, colors):
    """Text filled with a gradient (text used as a clipping path)."""
    w = stringWidth(text, font, size)
    c.saveState()
    c.setFillAlpha(1)
    t = c.beginText(x, y)
    t.setFont(font, size)
    t.setTextRenderMode(7)
    t.textOut(text)
    c.drawText(t)
    c.linearGradient(x, y - size * 0.25, x + w, y + size * 0.9, colors, extend=True)
    c.restoreState()
    return w


def text(c, s, x, y, font="Inter", size=10, color=INK, alpha=1):
    c.setFillColor(color, alpha=alpha)
    c.setFont(font, size)
    c.drawString(x, y, s)


def para(c, s, x, y, width, font="Inter", size=10, leading=None, color=INK, alpha=1, max_lines=None):
    """Wrapped text starting with its first baseline at y. Returns y below the last line."""
    leading = leading or size * 1.45
    lines = simpleSplit(s, font, size, width)
    if max_lines and len(lines) > max_lines:
        lines = lines[:max_lines]
        lines[-1] = lines[-1].rstrip(" .,") + "…"
    c.setFillColor(color, alpha=alpha)
    c.setFont(font, size)
    for i, ln in enumerate(lines):
        c.drawString(x, y - i * leading, ln)
    return y - len(lines) * leading


def cmyk_strip(c, y=0, h=4 * mm, x=0, w=W, on_dark=False):
    for i, col in enumerate(CMYK[:3] + [white if on_dark else INK]):
        c.setFillColor(col)
        c.rect(x + i * w / 4, y, w / 4, h, stroke=0, fill=1)


def mini_cmyk(c, x, y, w=9 * mm, h=1.3 * mm, on_dark=False):
    cols = CMYK[:3] + [white if on_dark else INK]
    for i, col in enumerate(cols):
        c.setFillColor(col)
        c.rect(x + i * w / 4, y, w / 4, h, stroke=0, fill=1)


def eyebrow(c, s, x, y, color=MUTED, on_dark=False):
    mini_cmyk(c, x, y + 1.1 * mm, on_dark=on_dark)
    c.setFillColor(color)
    c.setFont("Inter-SB", 8)
    c.drawString(x + 12 * mm, y, " ".join(s.upper()))  # letter-spaced look


def credit_line(c, y, dark=False):
    """© line + designer credit (CONFIG.credit), with the designer's name linked."""
    col, alpha = (white, 0.7) if dark else (MUTED, 1)
    copy = f"© {date.today().year} {CFG['businessName']}. All rights reserved."
    text(c, copy, M, y, "Inter", 7, col, alpha)
    cr = CFG.get("credit") or {}
    if not cr.get("name"):
        return
    x = M + stringWidth(copy, "Inter", 7) + 4 * mm
    lead = cr.get("text", "") + " "
    text(c, lead, x, y, "Inter", 7, col, alpha)
    x += stringWidth(lead, "Inter", 7)
    text(c, cr["name"], x, y, "Inter-SB", 7, white if dark else INK, 0.9 if dark else 1)
    nw = stringWidth(cr["name"], "Inter-SB", 7)
    c.setStrokeColor(white if dark else INK, alpha=0.6)
    c.setLineWidth(0.4)
    c.line(x, y - 1.1, x + nw, y - 1.1)
    if cr.get("url"):
        c.linkURL(cr["url"], (x, y - 2, x + nw, y + 7), relative=0)


def footer(c, n, dark=False):
    col = white if dark else MUTED
    credit_line(c, 9 * mm, dark)
    label = f"{n:02d}"
    text(c, label, W - M - stringWidth(label, "Inter-SB", 7), 9 * mm, "Inter-SB", 7, col, 0.7 if dark else 1)
    cmyk_strip(c, 0, 3 * mm, on_dark=dark)


def logo_card(c, x, y_top, size):
    c.setFillColor(white)
    c.roundRect(x, top(y_top) - size, size, size, 3 * mm, stroke=0, fill=1)
    pad = size * 0.06
    c.drawImage(str(ROOT / "assets/logo/logo.png"), x + pad, top(y_top) - size + pad,
                size - 2 * pad, size - 2 * pad, mask="auto")


def photo_card(c, key, cx, cy, w, aspect, angle, caption):
    """White polaroid-style card, rotated, with a soft shadow (like the website hero)."""
    pad = 2.2 * mm
    ih = (w - 2 * pad) / aspect
    cap = 7.5 * mm
    th = pad + ih + cap
    c.saveState()
    c.translate(cx, cy)
    c.rotate(angle)
    c.setFillColor(black, alpha=0.35)
    c.roundRect(-w / 2 + 1.2 * mm, -th / 2 - 2.4 * mm, w, th, 3 * mm, stroke=0, fill=1)
    c.setFillColor(white)
    c.roundRect(-w / 2, -th / 2, w, th, 3 * mm, stroke=0, fill=1)
    clipped_image(c, prepared(key, aspect), -w / 2 + pad, th / 2 - pad - ih, w - 2 * pad, ih, 2 * mm)
    text(c, caption, -w / 2 + pad + 0.6 * mm, -th / 2 + 2.6 * mm, "Sora-Bold", 7.5, INK)
    c.restoreState()


# ------------------------------------------------------------------ document

out_pdf = ROOT / "assets/catalog/perfect-print-catalog.pdf"
c = canvas.Canvas(str(out_pdf), pagesize=(W, H))
c.setTitle("Perfect Print — Product Catalog")
c.setAuthor(CFG["businessName"])
c.setSubject("Printing, stamps & labels, sign & display and special items — Rajkot")
c.setKeywords("Perfect Print, Rajkot, printing, rubber stamps, labels, sign boards, flex banners, catalog")
c.setCreator("Perfect Print website (build_catalog.py)")

services = CFG["services"]
page_no = 0

# ---------------------------------------------------------------- 1. cover
page_no += 1
c.setFillColor(INK)
c.rect(0, 0, W, H, stroke=0, fill=1)
blob(c, W - 20 * mm, H - 40 * mm, 95 * mm, MAGENTA, 0.55)
blob(c, 10 * mm, 70 * mm, 85 * mm, CYAN, 0.45)
blob(c, W - 55 * mm, 120 * mm, 45 * mm, YELLOW, 0.28)

logo_card(c, M, 16 * mm, 34 * mm)
eyebrow(c, "Product catalog", M, top(66 * mm), white, on_dark=True)

y = top(86 * mm)
text(c, "Imagined by you.", M, y, "Sora-XB", 38, white)
grad_text(c, "Printed to", M, y - 15 * mm, "Sora-XB", 38, HERO_GRAD)
grad_text(c, "perfection.", M, y - 30 * mm, "Sora-XB", 38, HERO_GRAD)

para(c, "Business stationery, rubber stamps and labels, packaging, shop signage, flex banners and "
        "custom merchandise — designed, printed and finished in-house in Rajkot.",
     M, y - 44 * mm, 112 * mm, "Inter", 11, color=white, alpha=0.85)

# photo collage, lower right
photo_card(c, "serviceBusinessCard", 112 * mm, 126 * mm, 52 * mm, 4 / 3, -4, "Business cards")
photo_card(c, "serviceLedSign", 168 * mm, 132 * mm, 52 * mm, 4 / 3, 5, "LED sign boards")
photo_card(c, "serviceShoppingBag", 56 * mm, 80 * mm, 52 * mm, 4 / 3, 4, "Shopping bags")
photo_card(c, "serviceRubberStamp", 112 * mm, 76 * mm, 52 * mm, 4 / 3, -3, "Rubber stamps")
photo_card(c, "serviceTshirt", 168 * mm, 84 * mm, 52 * mm, 4 / 3, 3, "T-shirt printing")

# departments + contact
x = M
for s in services:
    label = s["name"]
    w = stringWidth(label, "Inter-SB", 8.5) + 9 * mm
    c.setFillColor(white, alpha=0.08)
    c.setStrokeColor(white, alpha=0.25)
    c.roundRect(x, 34 * mm, w, 8 * mm, 4 * mm, stroke=1, fill=1)
    c.setFillColor(ACCENT[s["color"]])
    c.circle(x + 4 * mm, 38 * mm, 1.2 * mm, stroke=0, fill=1)
    text(c, label, x + 6.6 * mm, 36.6 * mm, "Inter-SB", 8.5, white)
    x += w + 2.5 * mm
text(c, f"WhatsApp {PHONE}   ·   {EMAIL}   ·   {A['line2']}, {A['city']}", M, 20 * mm, "Inter-SB", 8.5, white, 0.75)
c.linkURL(wa("Hi Perfect Print! I saw your catalog and I'd like a quote."), (M, 18 * mm, M + 55 * mm, 24 * mm), relative=0)
credit_line(c, 10 * mm, dark=True)
cmyk_strip(c, 0, 5 * mm, on_dark=True)
c.showPage()

# ---------------------------------------------------------------- 2. inside intro
page_no += 1
logo_card(c, M, 14 * mm, 16 * mm)
text(c, "Perfect Print", M + 20 * mm, top(21 * mm), "Sora-Bold", 12, INK)
text(c, "Print & branding studio · Rajkot", M + 20 * mm, top(26.5 * mm), "Inter", 8.5, MUTED)

eyebrow(c, "Welcome", M, top(46 * mm))
y = para(c, "One counter for everything your brand puts on paper, plastic, fabric and walls.",
         M, top(56 * mm), W - 2 * M - 20 * mm, "Sora-Bold", 21, leading=26, color=INK)
y = para(c, CFG["description"] + " Every job gets a proper proof, the right material, and finishing we're happy to put our name to.",
         M, y - 3 * mm, W - 2 * M - 30 * mm, "Inter", 10, color=MUTED)

eyebrow(c, "What's inside", M, y - 10 * mm)
grid_top = H - y + 16 * mm  # distance from top, in pt
tw, th, gap = (W - 2 * M - 6 * mm) / 2, 40 * mm, 6 * mm
for i, s in enumerate(services):
    col, row = i % 2, i // 2
    x = M + col * (tw + gap)
    yb = top(grid_top + row * (th + gap)) - th
    c.setFillColor(PAPER2)
    c.roundRect(x, yb, tw, th, 3.5 * mm, stroke=0, fill=1)
    c.setFillColor(ACCENT[s["color"]])
    c.roundRect(x, yb, 2.4 * mm, th, 1.2 * mm, stroke=0, fill=1)
    text(c, f"0{i + 1}", x + 7 * mm, yb + th - 10 * mm, "Sora-XB", 16, ACCENT[s["color"]])
    text(c, s["name"], x + 19 * mm, yb + th - 10 * mm, "Sora-Bold", 13, INK)
    para(c, s["summary"], x + 7 * mm, yb + th - 18 * mm, tw - 13 * mm, "Inter", 8.8, color=MUTED, max_lines=2)
    text(c, f"{len(s['items'])} products  ·  page {i + 3}  →", x + 7 * mm, yb + 5.5 * mm, "Inter-SB", 8, INK)
    c.linkRect("", f"dept-{s['id']}", (x, yb, x + tw, yb + th), relative=0)

why_top = grid_top + 2 * th + gap + 14 * mm
eyebrow(c, "Why choose us", M, top(why_top))
WHY = [
    ("Creative Design", "No artwork yet? Bring a sketch, a photo or a few words — our designers turn it into print-ready files.", CYAN),
    ("Premium Quality", "Good paper, accurate colour and clean cutting and finishing, checked before anything leaves the shop.", MAGENTA),
    ("On-time Delivery", "We agree a ready date with you up front and keep to it. Urgent? We'll tell you honestly what's possible.", AMBER),
    ("Your Satisfaction Is Our Priority", "Nothing goes to print until you've seen the proof and said yes.", GREEN),
]
for i, (title, body, col) in enumerate(WHY):
    x = M + (i % 2) * (tw + gap)
    yy = top(why_top + 9 * mm + (i // 2) * 24 * mm)
    c.setFillColor(col)
    c.circle(x + 2 * mm, yy + 1.2 * mm, 1.6 * mm, stroke=0, fill=1)
    text(c, title, x + 6 * mm, yy, "Sora-Bold", 10.5, INK)
    para(c, body, x + 6 * mm, yy - 5.5 * mm, tw - 8 * mm, "Inter", 8.6, color=MUTED, max_lines=3)
footer(c, page_no)
c.showPage()

# ---------------------------------------------------------------- 3–6. departments
CARD_W = (W - 2 * M - 2 * 5 * mm) / 3
IMG_H = CARD_W * 10 / 16
CARD_H = IMG_H + 28 * mm
GRID_TOP = 70 * mm

def placeholder(c, x, y, w, h, name, accent):
    gradient_box(c, x, y, w, h, 3 * mm, [accent, INK2])
    c.saveState()
    c.clipPath(rrect_path(c, x, y, w, h, 3 * mm), stroke=0, fill=0)
    blob(c, x + w * 0.85, y + h * 0.15, w * 0.45, VIOLET, 0.6)
    cmyk_strip(c, y, 1.6 * mm, x, w)
    c.restoreState()
    lines = simpleSplit(name, "Sora-Bold", 13, w - 10 * mm)
    lh = 15
    y0 = y + h / 2 + (len(lines) - 1) * lh / 2 - 4
    for i, ln in enumerate(lines):
        text(c, ln, x + (w - stringWidth(ln, "Sora-Bold", 13)) / 2, y0 - i * lh, "Sora-Bold", 13, white)

for d_i, s in enumerate(services):
    page_no += 1
    accent = ACCENT[s["color"]]
    c.bookmarkPage(f"dept-{s['id']}")
    c.addOutlineEntry(s["name"], f"dept-{s['id']}", level=0)

    # header band
    band = 58 * mm
    c.setFillColor(INK)
    c.rect(0, H - band, W, band, stroke=0, fill=1)
    c.saveState()
    p = c.beginPath(); p.rect(0, H - band, W, band); c.clipPath(p, stroke=0, fill=0)
    blob(c, W - 25 * mm, H - 20 * mm, 70 * mm, accent, 0.6)
    blob(c, W - 80 * mm, H - band, 40 * mm, VIOLET, 0.35)
    c.setFillColor(white, alpha=0.07)
    c.setFont("Sora-XB", 120)
    c.drawRightString(W - 8 * mm, H - band + 6 * mm, f"0{d_i + 1}")
    c.restoreState()
    c.setFillColor(accent)
    c.rect(0, H - band, 4 * mm, band, stroke=0, fill=1)
    text(c, f"0{d_i + 1}  /  {s['name'].upper()}", M, top(20 * mm), "Inter-SB", 8.5, accent)
    text(c, s["name"], M, top(34 * mm), "Sora-XB", 30, white)
    para(c, s["intro"], M, top(44 * mm), 118 * mm, "Inter", 10, color=white, alpha=0.82, max_lines=3)

    # product cards (3 columns)
    slots = list(s["items"])
    if len(slots) % 3:
        slots.append(None)  # "something else?" tile
    for i, item in enumerate(slots):
        col, row = i % 3, i // 3
        x = M + col * (CARD_W + 5 * mm)
        yb = top(GRID_TOP + row * (CARD_H + 5 * mm)) - CARD_H
        if item is None:
            gradient_box(c, x, yb, CARD_W, CARD_H, 3.5 * mm, [MAG_DEEP, VIOLET, BLUE])
            text(c, "Need something", x + 5 * mm, yb + CARD_H - 12 * mm, "Sora-Bold", 13, white)
            text(c, "else?", x + 5 * mm, yb + CARD_H - 18 * mm, "Sora-Bold", 13, white)
            para(c, "Custom sizes, unusual materials and one-off jobs are welcome. Tell us your idea.",
                 x + 5 * mm, yb + CARD_H - 26 * mm, CARD_W - 10 * mm, "Inter", 8.6, color=white, alpha=0.92, max_lines=3)
            bw = CARD_W - 10 * mm
            c.setFillColor(WA)
            c.roundRect(x + 5 * mm, yb + 6 * mm, bw, 8.5 * mm, 4.25 * mm, stroke=0, fill=1)
            lbl = "Chat on WhatsApp"
            text(c, lbl, x + 5 * mm + (bw - stringWidth(lbl, "Inter-SB", 8.5)) / 2, yb + 9 * mm, "Inter-SB", 8.5, white)
            c.linkURL(wa(f"Hi Perfect Print! I have a custom {s['name'].lower()} job in mind."),
                      (x, yb, x + CARD_W, yb + CARD_H), relative=0)
            continue

        c.setFillColor(white)
        c.setStrokeColor(LINE)
        c.setLineWidth(0.6)
        c.roundRect(x, yb, CARD_W, CARD_H, 3.5 * mm, stroke=1, fill=1)
        ix, iy, iw = x + 1.6 * mm, yb + CARD_H - 1.6 * mm - IMG_H, CARD_W - 3.2 * mm
        if item.get("image") and item["image"] in IMG:
            clipped_image(c, prepared(item["image"], iw / IMG_H), ix, iy, iw, IMG_H, 2.6 * mm)
        else:
            placeholder(c, ix, iy, iw, IMG_H, item["name"], accent)
        tx = x + 4 * mm
        text(c, item["name"], tx, iy - 6 * mm, "Sora-Bold", 10.5, INK)
        para(c, item.get("note", ""), tx, iy - 11 * mm, CARD_W - 8 * mm, "Inter", 8.2, color=MUTED, max_lines=2)
        c.setFillColor(accent)
        c.circle(tx + 1 * mm, yb + 5.5 * mm, 1 * mm, stroke=0, fill=1)
        text(c, "Ask for a quote  →", tx + 3.4 * mm, yb + 4.6 * mm, "Inter-SB", 7.8, INK)  # bottom line of the card
        c.linkURL(wa(f"Hi Perfect Print! I'd like a quote for {item['name']} ({s['name']})."),
                  (x, yb, x + CARD_W, yb + CARD_H), relative=0)
    # A department that fills its rows exactly gets a full-width "something else?" banner below.
    rows_used = (len(slots) + 2) // 3
    if None not in slots and rows_used < 3:
        bx, bw = M, W - 2 * M
        bh = 46 * mm
        by = top(GRID_TOP + rows_used * (CARD_H + 5 * mm)) - bh
        gradient_box(c, bx, by, bw, bh, 4 * mm, [MAG_DEEP, VIOLET, BLUE], horizontal=True)
        c.saveState(); c.clipPath(rrect_path(c, bx, by, bw, bh, 4 * mm), stroke=0, fill=0)
        blob(c, bx + bw - 20 * mm, by + bh, 45 * mm, CYAN, 0.45)
        c.restoreState()
        text(c, "Need something else?", bx + 9 * mm, by + bh - 15 * mm, "Sora-XB", 18, white)
        para(c, "Custom sizes, unusual materials and one-off jobs are welcome. Send us a photo or a "
                "sketch on WhatsApp and we'll tell you honestly what's possible.",
             bx + 9 * mm, by + bh - 24 * mm, 105 * mm, "Inter", 9.5, color=white, alpha=0.92, max_lines=3)
        btw = 48 * mm
        c.setFillColor(WA)
        c.roundRect(bx + bw - btw - 9 * mm, by + bh / 2 - 5 * mm, btw, 10 * mm, 5 * mm, stroke=0, fill=1)
        lbl = "Chat on WhatsApp"
        text(c, lbl, bx + bw - btw - 9 * mm + (btw - stringWidth(lbl, "Inter-SB", 10)) / 2, by + bh / 2 - 1.6 * mm, "Inter-SB", 10, white)
        c.linkURL(wa(f"Hi Perfect Print! I have a custom {s['name'].lower()} job in mind."), (bx, by, bx + bw, by + bh), relative=0)
    footer(c, page_no)
    c.showPage()

# ---------------------------------------------------------------- 7. how to order + contact
page_no += 1
c.bookmarkPage("contact")
c.addOutlineEntry("How to order & contact", "contact", level=0)
c.setFillColor(INK)
c.rect(0, 0, W, H, stroke=0, fill=1)
blob(c, W, H - 30 * mm, 90 * mm, MAGENTA, 0.5)
blob(c, 0, 95 * mm, 80 * mm, CYAN, 0.4)

eyebrow(c, "How to order", M, top(26 * mm), white, on_dark=True)
text(c, "Get a quote", M, top(42 * mm), "Sora-XB", 30, white)
grad_text(c, "in minutes.", M, top(55 * mm), "Sora-XB", 30, HERO_GRAD)

STEPS = [
    ("Share your idea", "Tell us the product, size and quantity. A photo, sketch or old sample helps too."),
    ("Get a quote on WhatsApp", "We reply with a clear price and a ready date, before any work starts."),
    ("Approve the design", "We send a digital proof. Ask for changes until it's right, then say go."),
    ("Receive your print", "Your job is printed, finished and checked, then ready to collect."),
]
sw, sg = (W - 2 * M - 3 * 4 * mm) / 4, 4 * mm
for i, (t1, body) in enumerate(STEPS):
    x = M + i * (sw + sg)
    yb = top(68 * mm) - 50 * mm
    c.setFillColor(white, alpha=0.06)
    c.setStrokeColor(white, alpha=0.14)
    c.roundRect(x, yb, sw, 50 * mm, 3.5 * mm, stroke=1, fill=1)
    grad_text(c, f"0{i + 1}", x + 4 * mm, yb + 50 * mm - 12 * mm, "Sora-XB", 18, HERO_GRAD)
    para(c, t1, x + 4 * mm, yb + 50 * mm - 19 * mm, sw - 8 * mm, "Sora-Bold", 10, leading=12.5, color=white)
    para(c, body, x + 4 * mm, yb + 50 * mm - 31 * mm, sw - 8 * mm, "Inter", 7.8, color=white, alpha=0.72, max_lines=5)

# contact block
eyebrow(c, "Contact", M, top(140 * mm), white, on_dark=True)
rows = [
    ("WhatsApp", PHONE, wa("Hi Perfect Print! I'd like a quote.")),
    ("Call", PHONE, f"tel:+{digits}"),
    ("Email", EMAIL, f"mailto:{EMAIL}"),
]
if SHOW_SITE:
    rows.append(("Website", SITE.replace("https://", "").replace("http://", ""), SITE))
y = top(152 * mm)
for label, value, link in rows:
    text(c, label.upper(), M, y, "Inter-SB", 7.5, white, 0.55)
    text(c, value, M, y - 6 * mm, "Sora-Bold", 13, white)
    c.linkURL(link, (M, y - 8 * mm, M + 95 * mm, y + 3 * mm), relative=0)
    y -= 17 * mm
text(c, "VISIT THE SHOP", M, y, "Inter-SB", 7.5, white, 0.55)
yy = y - 6 * mm
for ln in ADDRESS:
    text(c, ln, M, yy, "Inter-SB", 10.5, white)
    yy -= 5.4 * mm
if MAP:
    c.linkURL(MAP, (M, yy, M + 95 * mm, y + 3 * mm), relative=0)
hours = CFG.get("hours") or []
yy -= 4 * mm
if hours:
    for h in hours:
        text(c, f"{h['days']}: {h['time']}", M, yy, "Inter", 9, white, 0.75); yy -= 5 * mm
else:
    text(c, "Please call or WhatsApp before you visit.", M, yy, "Inter", 9, white, 0.75)

# QR card
qx, qsize = W - M - 62 * mm, 62 * mm
qy = top(140 * mm) - 80 * mm
c.setFillColor(white)
c.roundRect(qx, qy, qsize, 80 * mm, 4 * mm, stroke=0, fill=1)
url = wa("Hi Perfect Print! I saw your catalog and I'd like a quote.")
qr = QrCodeWidget(url, barLevel="M")
b = qr.getBounds()
inner = 48 * mm
d = Drawing(inner, inner, transform=[inner / (b[2] - b[0]), 0, 0, inner / (b[3] - b[1]), 0, 0])
d.add(qr)
renderPDF.draw(d, c, qx + (qsize - inner) / 2, qy + 25 * mm)
lbl = "Scan to chat on WhatsApp"
text(c, lbl, qx + (qsize - stringWidth(lbl, "Sora-Bold", 10)) / 2, qy + 16 * mm, "Sora-Bold", 10, INK)
sub = "Then attach your logo or artwork"
text(c, sub, qx + (qsize - stringWidth(sub, "Inter", 8)) / 2, qy + 10 * mm, "Inter", 8, MUTED)
c.linkURL(url, (qx, qy, qx + qsize, qy + 80 * mm), relative=0)

# sign-off
text(c, "Imagined by you.", M, 34 * mm, "Sora-XB", 20, white)
grad_text(c, "Printed to perfection.", M + stringWidth("Imagined by you. ", "Sora-XB", 20), 34 * mm, "Sora-XB", 20, HERO_GRAD)
text(c, "Prices depend on size, quantity and finish. Ask us on WhatsApp for an exact quote.", M, 22 * mm, "Inter", 8, white, 0.6)
footer(c, page_no, dark=True)
c.showPage()
c.save()

print("pages:", page_no, "pdf:", out_pdf.stat().st_size // 1024, "KB")

# ---------------------------------------------------------------- page previews for the website
import fitz  # pymupdf
pages_dir = ROOT / "assets/catalog/pages"
pages_dir.mkdir(parents=True, exist_ok=True)
doc = fitz.open(str(out_pdf))
for i, pg in enumerate(doc, start=1):
    for width, suffix in ((1240, ""), (600, "-600w")):
        pix = pg.get_pixmap(matrix=fitz.Matrix(width / pg.rect.width, width / pg.rect.width), alpha=False)
        tmp = WORK / "page.png"
        pix.save(str(tmp))
        out = pages_dir / f"catalog-page-{i}{suffix}.jpg"
        Image.open(tmp).convert("RGB").save(out, "JPEG", quality=80 if not suffix else 78, optimize=True, progressive=True)
    print(f"page {i}: {(pages_dir / f'catalog-page-{i}.jpg').stat().st_size // 1024} KB, 600w {(pages_dir / f'catalog-page-{i}-600w.jpg').stat().st_size // 1024} KB")
