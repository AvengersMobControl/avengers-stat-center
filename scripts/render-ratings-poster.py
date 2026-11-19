#!/usr/bin/env python3
"""Weekly Player Power Ratings poster (approved Nov 17 2026 100-player design).

Draws fresh data onto the approved master artwork
(assets/ratings/RATINGS_MASTER_APPROVED_2026-11-17_3600x8000.png): the dated
header line, the three count tiles, THE LEADERS cards, both ranking panels and
the footer count/source lines. Everything else (art, borders, legend) is the
approved master untouched. Input is the poster JSON written by
scripts/export-ratings-poster.cjs; no numbers are typed by hand.

  python3 scripts/render-ratings-poster.py reports/ratings-2026-11-23.json reports/ratings-2026-11-23.png

Writes <out> (1800x4000 Discord edition), <out stem>-FULL.png (3600x8000) and
<out stem>-poster.json sidecar with SHA-256s and templateVersion.
"""
import argparse, datetime, hashlib, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "assets/ratings/RATINGS_MASTER_APPROVED_2026-11-17_3600x8000.png"
FONTS = ROOT / "assets/fonts"
TEMPLATE = "ratings-poster-v1-20261119"

ap = argparse.ArgumentParser()
ap.add_argument("report")
ap.add_argument("out")
a = ap.parse_args()
P = json.loads(Path(a.report).read_text())["poster"]

def font(w, s): return ImageFont.truetype(str(FONTS / f"Inter-{w}.otf"), s)

GOLD = (255, 205, 64); SILVER = (205, 214, 236); CYAN = (52, 226, 255); MAG = (255, 72, 214)
WHITE = (255, 255, 255); LIGHT = (214, 228, 255); HDR = (160, 176, 214); ALUM = (154, 163, 199)
LAV = (140, 120, 240); NAVY_ROW = (15, 30, 69); NAVY_ROW2 = (8, 21, 50); BAR_BG = (43, 52, 96)

im = Image.open(MASTER).convert("RGB")
d = ImageDraw.Draw(im)

def text(xy, s, f, fill, anchor="ls"): d.text(xy, s, font=f, fill=fill, anchor=anchor)

def crown(x, y, h, color):
    """Small crown glyph, (x,y) = bottom-left."""
    w = int(h * 1.25)
    pts = [(x, y), (x, y - h * 0.75), (x + w * 0.25, y - h * 0.4), (x + w * 0.5, y - h),
           (x + w * 0.75, y - h * 0.4), (x + w, y - h * 0.75), (x + w, y)]
    d.polygon(pts, fill=color)
    return x + w

def crowns(x, y, h, c, f, gold_first=True):
    if c["gold"]:
        x = crown(x, y, h, GOLD) + 6
        text((x, y + 2), str(c["gold"]), f, GOLD); x += int(f.getlength(str(c["gold"]))) + 28
    if c["silver"]:
        x = crown(x, y, h, SILVER) + 6
        text((x, y + 2), str(c["silver"]), f, SILVER)

# ---- header date -------------------------------------------------------
date = datetime.date.fromisoformat(P["date"])
d.rectangle((1400, 448, 2200, 508), fill=(4, 11, 34))
text((1800, 492), "UPDATED " + date.strftime("%B ").upper() + str(date.day) + ", " + str(date.year),
     font("SemiBold", 40), MAG, "ms")

# ---- count tiles --------------------------------------------------------
C = P["counts"]; ft = font("Bold", 74)
for (x0, x1), s, col in [((490, 790), str(C["total"]), CYAN), ((1350, 1650), str(C["avengers"]), GOLD),
                         ((2195, 2500), f'{C["av2"]} + {C["alumni"]}', MAG)]:
    d.rectangle((x0, 588, x1, 700), fill=(6, 18, 51))
    text((x0 + 14, 666), s, ft, col)

# ---- THE LEADERS ----------------------------------------------------------
cards = [(384, 1356, GOLD, GOLD), (1404, 2376, SILVER, SILVER), (2424, 3406, CYAN, CYAN)]
for i, (x0, x1, border, scol) in enumerate(cards):
    if i >= len(P["leaders"]): break
    L = P["leaders"][i]; y0, y1 = 866, 1180
    d.rounded_rectangle((x0 + 8, y0 + 8, x1 - 8, y1 - 8), 14, fill=(18, 27, 64))
    d.rounded_rectangle((x0 + 22, y0 + 26, x0 + 172, y0 + 92), 8, fill=(74, 50, 30), outline=border, width=3)
    text((x0 + 97, y0 + 59), f'#{L["posterRank"]}', font("Bold", 44), border, "mm")
    text((x1 - 40, y0 + 92), f'{L["ratingAdjusted"]:.3f}', font("Bold", 66), scol, "rs")
    name = L["canonicalName"]; fn = font("Bold", 60)
    while fn.getlength(name) > (x1 - x0 - 60) and fn.size > 40: fn = font("Bold", fn.size - 2)
    text((x0 + 26, y0 + 180), name, fn, WHITE)
    text((x0 + 26, y0 + 242), f'BASE {L["ratingTotal"]:.3f}  +  BONUS {L["ratingBonus"]:.3f}', font("Medium", 36), HDR)
    cw = (int(font("Bold", 30).getlength(str(L["crowns"]["gold"]))) + 70 if L["crowns"]["gold"] else 0) + \
         (int(font("Bold", 30).getlength(str(L["crowns"]["silver"]))) + 50 if L["crowns"]["silver"] else 0)
    crowns(x1 - 50 - cw, y0 + 270, 34, L["crowns"], font("Bold", 30))

# ---- ranking panels ---------------------------------------------------------
TOP, BOTTOM = 1566, 6953
panels = [
    dict(x0=306, rows=P["left"], accent=lambda r: CYAN, sub=f'{C["avengers"]} ACTIVE  //  ALL CURRENT MEMBERS',
         rank_x=345, name_x=457, total_r=1138, cols=[1295, 1445, 1616, 1798], bar=(457, 1158), right_edge=1828),
    dict(x0=1910, rows=P["right"], accent=lambda r: MAG if r["posterPanel"] == "AV-2" else LAV,
         sub=f'{C["av2"]} AV-2   //   {C["alumni"]} SELECTED ALUMNI',
         rank_x=1950, name_x=2061, total_r=2795, cols=[2950, 3101, 3272, 3453], bar=(2061, 2762), right_edge=3484),
]
for pn in panels:
    x0 = pn["x0"]
    # subtitle line
    d.rectangle((x0 + 40, 1425, x0 + 1100, 1475), fill=(6, 26, 64))
    text((x0 + 36, 1470), pn["sub"], font("SemiBold", 32), WHITE)
    # rows
    d.rectangle((x0 + 12, TOP - 4, pn["right_edge"] - 2, BOTTOM + 4), fill=NAVY_ROW2)
    rows = pn["rows"]; pitch = (BOTTOM - TOP) / max(1, len(rows))
    fr, fn0, fttl, fc, fcr = font("SemiBold", 40), font("Bold", 38), font("Bold", 38), font("SemiBold", 33), font("Bold", 21)
    for i, r in enumerate(rows):
        y = TOP + i * pitch; h = pitch - 4
        if i % 2 == 0:
            d.rounded_rectangle((x0 + 18, y, pn["right_edge"] - 8, y + h), 10, fill=NAVY_ROW)
        else:
            d.line((x0 + 40, y - 2, pn["right_edge"] - 20, y - 2), fill=(30, 44, 84), width=2)
        ac = pn["accent"](r)
        d.rectangle((x0 + 16, y + 10, x0 + 26, y + h - 12), fill=ac)
        top3 = r["posterRank"] <= 3
        mid = y + h * 0.42
        text((pn["rank_x"], mid + 14), str(r["posterRank"]), fr, GOLD if top3 else LIGHT)
        cy = y + h - 10
        slot = pn["rank_x"] - 13
        for n, col in ((r["crowns"]["gold"], GOLD), (r["crowns"]["silver"], SILVER)):
            if n:
                cx = crown(slot, cy, 18, col) + 3; text((cx, cy + 1), str(n), fcr, col); slot += 65
        alum = r["posterPanel"] == "ALUMNI"
        name = r["canonicalName"]; fn = fn0
        while fn.getlength(name) > (pn["total_r"] - pn["name_x"] - 230) and fn.size > 30: fn = font("Bold", fn.size - 2)
        text((pn["name_x"], mid + 16), name, fn, ALUM if alum else WHITE)
        text((pn["total_r"], mid + 18), f'{r["ratingAdjusted"]:.3f}', fttl, GOLD if top3 else WHITE, "rs")
        for cx, k in zip(pn["cols"], ["piggy", "space", "kraken", "flash"]):
            text((cx, mid + 16), f'{r["categoryBasePoints"][k]:.2f}', fc, WHITE, "rs")
        bx0, bx1 = pn["bar"]; by = y + h - 14
        d.rectangle((bx0, by, bx1, by + 5), fill=BAR_BG)
        frac = max(0.0, min(1.0, r["ratingAdjusted"] / 11.0))
        d.rectangle((bx0, by, bx0 + int((bx1 - bx0) * frac), by + 5), fill=ac)

# ---- footer -------------------------------------------------------------
d.rectangle((400, 7205, 2600, 7262), fill=(4, 11, 36))
text((414, 7250), f'{C["total"]} RATED ACCOUNTS  //  {C["avengers"]} CURRENT AVENGERS + {C["av2"]} AV-2 + {C["alumni"]} SELECTED ALUMNI',
     font("SemiBold", 40), CYAN)
d.rectangle((400, 7780, 2600, 7826), fill=(4, 11, 36))
sha = (P.get("sourceGitSha") or "unknown")[:10]
text((424, 7815), f'CATEGORY POINTS SHOWN TO 2 DECIMALS  //  TOTAL SHOWN TO 3  //  VERIFIED SOURCE {sha}',
     font("Medium", 30), HDR)

out = Path(a.out); full = out.with_name(out.stem + "-FULL.png")
im.save(full, optimize=True)
im.resize((1800, 4000), Image.LANCZOS).save(out, optimize=True)
sha256 = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
side = dict(file=str(out), fullFile=str(full), sha256=sha256(out), fullSha256=sha256(full), templateVersion=TEMPLATE,
            date=P["date"], counts=C, sourceGitSha=P.get("sourceGitSha"), master=MASTER.name,
            readyToPost=False, discordPostingEnabled=False)
out.with_name(out.stem + "-poster.json").write_text(json.dumps(side, indent=1) + "\n")
print(json.dumps(side))
