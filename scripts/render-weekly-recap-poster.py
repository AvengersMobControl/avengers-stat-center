#!/usr/bin/env python3
"""Render a review-only AVENGERS weekly graphic over the saved, untouched background.

Usage:
  python3 scripts/build-weekly-recap-facts.py reports/approved-summary-release.json \
      reports/weekly-AVENGERS-2026-11-02-FACTS.json --week 2026-11-02 --clan AVENGERS
  python3 scripts/render-weekly-recap-poster.py reports/weekly-AVENGERS-2026-11-02-FACTS.json \
      reports/weekly-AVENGERS-2026-11-02-REVIEW.png

Every week-specific number, name and label below is read from the FACTS json
(built by build-weekly-recap-facts.py straight from the approved event ledger)
-- nothing in this file is hardcoded to a particular week. See that script's
module docstring for the exact PB / average / threshold methodology, including
the Flash Set "combined day" PBs, which reuse piggy-flash-history.js's own
analyze() (the same function the Flash PNG and the site's Flash history view
use) rather than being reinvented here.

Review-only: writes readyToPost:false in the sidecar JSON. Never posts anything.
"""

import argparse
import json
import random
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BACKGROUND = ROOT / "assets" / "weekly" / "AVENGERS_WEEKLY_RECAP_MASTER_BACKGROUND_TEMPLATE_1440w.png"
TEMPLATE_VERSION = "weekly-recap-poster-v1-20261109"

ap = argparse.ArgumentParser()
ap.add_argument("facts", help="FACTS json written by build-weekly-recap-facts.py")
ap.add_argument("out", help="output PNG path")
ap.add_argument("--background", default=str(DEFAULT_BACKGROUND), help="master background template PNG")
args = ap.parse_args()

FACTS = Path(args.facts)
BACKGROUND = Path(args.background)
OUTPUT = Path(args.out)

F = json.loads(FACTS.read_text(encoding="utf-8"))
base = Image.open(BACKGROUND).convert("RGB")
assert base.size == (1440, 2035), base.size
W, H = 1440, 3915
im = Image.new("RGB", (W, H), (4, 12, 33))
im.paste(base, (0, 0))

CYAN = (69, 226, 255)
MINT = (95, 242, 214)
GOLD = (255, 215, 99)
MAGENTA = (249, 116, 247)
WHITE = (243, 250, 255)
PALE = (198, 219, 238)
MUTED = (132, 169, 196)
NAVY = (5, 12, 34)
INSET = (11, 31, 64)
LINE = (38, 94, 143)
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
draw = ImageDraw.Draw(im)


def font(px, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, int(px))


def text_width(text, px, bold=False):
    return draw.textbbox((0, 0), str(text), font=font(px, bold))[2]


def put(x, y, message, size=26, color=WHITE, bold=False, anchor="la", max_width=None, min_size=16):
    msg = str(message)
    chosen = size
    if max_width:
        while chosen > min_size and text_width(msg, chosen, bold) > max_width:
            chosen -= 1
    draw.text((int(x), int(y)), msg, font=font(chosen, bold), fill=color,
              anchor=anchor, stroke_width=1, stroke_fill=(3, 8, 25))
    return chosen


def centered(x, y, message, size, color=WHITE, bold=True, max_width=None):
    return put(x, y, message, size, color, bold, "ma", max_width)


def label_value(cx, y, label, value, value_color=CYAN, val_size=39, label_size=22):
    centered(cx, y, label, label_size, PALE, True)
    centered(cx, y + 35, value, val_size, value_color, True)


def short_date(date):
    return datetime.strptime(date, "%Y-%m-%d").strftime("%b %-d")


def number(v, digits=0):
    return f"{v:,.{digits}f}" if digits else f"{int(v):,}"


def strip_av(name):
    return name[3:] if name.startswith("AV-") else name


def ordinal(n):
    n = int(n)
    if 11 <= (n % 100) <= 13:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


def card(x1, y1, x2, y2, border=CYAN, radius=22, dark=(9, 26, 56, 245)):
    # The extension is deliberately separate from the master raster; the master is not altered.
    draw.rounded_rectangle((x1, y1, x2, y2), radius=radius, fill=dark[:3], outline=border, width=3)
    draw.line((x1 + 18, y1 + 7, x2 - 18, y1 + 7), fill=tuple(int(c * .5) for c in border), width=1)


def row_lr(x1, x2, y, name, value, color=WHITE, px=25):
    right_width = text_width(value, px, True)
    put(x1, y, name, px, color, True, max_width=x2-x1-right_width-18, min_size=17)
    put(x2, y, value, px, GOLD, True, anchor="ra")


def draw_rule(x1, y, x2, color=LINE):
    draw.line((x1, y, x2, y), fill=color, width=1)


# ---- Master background panels: no graphic assets are regenerated. ----

wk = F["weekly"]
sp = F["space"]
fl = F["flashes"]
pg = F["piggy"]
ms = F["milestones"]

# Masthead
centered(719, 35, F["clan"], 60, GOLD, True, 820)
centered(719, 102, "WEEKLY EVENT RECAP", 61, WHITE, True, 900)
centered(719, 173, f"{F['weekLabel']}   •   {F['eventsLine']}", 24, CYAN, True, 915)

# Top KPI and cumulative leaderboard
put(188, 248, "TOTAL VERIFIED SPARKS", 28, CYAN, True)
put(188, 310, number(wk["sparks"]), 66, GOLD, True, max_width=500)
put(187, 405, "FROM SPACE + PIGGY + FOUR FLASHES", 22, WHITE, True, max_width=495)
coverage_word = "partial coverage" if wk["coveragePartial"] else "full coverage"
put(187, 450, f"{wk['rosterCount']} distinct AVENGERS  •  {wk['resultCount']} results  •  {coverage_word}",
    17, PALE, False, max_width=502)

put(833, 249, "TOP 5 SPARK CONTRIBUTORS", 28, GOLD, True, max_width=520)
for idx, player in enumerate(wk["topContributors"][:5]):
    y = 294 + 40*idx
    put(773, y, str(idx+1), 27, GOLD, True, anchor="la")
    put(814, y, strip_av(player["name"]), 25, WHITE, True, max_width=330, min_size=19)
    put(1377, y, number(player["sparks"]), 25, GOLD, True, anchor="ra")
    if idx < 4:
        draw_rule(814, y+34, 1378, (36, 69, 101))

# Space Race region
put(332, 524, "SPACE RACE", 47, CYAN, True)
put(704, 546, f"{sp['dateLabel']}  •  {sp['racerCount']} RACERS / {sp['lobbyCount']} LOBBIES", 21, PALE, True, max_width=450)
label_value(503, 596, "VERIFIED SPARKS", number(sp["verifiedSparks"]), CYAN, 38)
label_value(805, 596, "ABOVE OWN AVG", f"{sp['aboveOwnAvgCount']} / {sp['aboveOwnAvgDenom']}", MINT, 43)
label_value(1071, 596, "DISTANCE PBS", str(sp["distancePBCount"]), GOLD, 52)

put(356, 713, "DISTANCE LEADERS", 25, CYAN, True)
put(764, 713, "SPARK LEADERS", 25, CYAN, True)
for idx, p in enumerate(sp["topDistance"][:4]):
    y = 744 + idx*29
    row_lr(327, 687, y, strip_av(p["name"]), number(p["dist"], 1) + "B", px=21)
for idx, p in enumerate(sp["topSparks"][:4]):
    y = 744 + idx*29
    row_lr(735, 1139, y, strip_av(p["name"]), number(p["sparks"]), px=21)

# Four Flash region
put(320, 897, "FOUR PIGGY FLASHES", 45, MAGENTA, True)
centered(1226, 908, f"{fl['dateLabel']} • {fl['resultCount']} RESULTS", 19, PALE, True, 300)
label_value(490, 981, "SPARKS EARNED", number(fl["sparksEarned"]), MAGENTA, 39)
label_value(860, 981, "UNIQUE RACERS", str(fl["uniqueRacerCount"]), CYAN, 44)
label_value(1222, 981, "ABOVE DAY AVG", f"{fl['aboveDayAvgCount']} / {fl['aboveDayAvgDenom']}", MINT, 40)
for idx, win in enumerate(fl["wins"][:4]):
    cx = 426 + 271*idx
    centered(cx, 1115, f"PF{win['pf']} • {strip_av(win['winner'])}", 19, WHITE, True, 248)
    centered(cx, 1155, number(win["lines"]) + " LINES", 25, GOLD, True, 247)

# Big Pig region
put(326, 1253, "BIG PIG", 49, GOLD, True)
coverage_tag = "ALL MAIN-LOBBY POSITIONS VERIFIED" if pg["complete"] else f"{pg['participantCount']} AVENGERS RESULTS VERIFIED (PARTIAL)"
put(639, 1279, f"{pg['dateLabel']}  •  {coverage_tag}", 18, PALE, True, max_width=520)
label_value(516, 1330, "VERIFIED SPARKS", number(pg["verifiedSparks"]), CYAN, 40)
label_value(874, 1330, "TEAM LINES", number(pg["teamLines"]), GOLD, 40)
label_value(1206, 1330, "ABOVE OWN AVG", f"{pg['aboveOwnAvgCount']} / {pg['aboveOwnAvgDenom']}", MINT, 38)

put(355, 1447, "TOP 5 BY LINES", 25, GOLD, True)
for idx, p in enumerate(pg["topFinishers"][:5]):
    y = 1488 + idx*32
    put(319, y, str(idx+1) + ".", 23, GOLD, True)
    row_lr(361, 768, y, strip_av(p["name"]), number(p["lines"]), px=23)

put(850, 1447, "LINE THRESHOLDS", 24, GOLD, True)
thresholds = pg["thresholdReached"]
for idx, (lab1, lab2) in enumerate([("50K+", "40K+"), ("30K+", "20K+"), ("10K+", "")]):
    y = 1490 + idx*42
    p1 = lab1 + "  " + str(thresholds.get(str(int(lab1[:-2])*1000), 0))
    put(845, y, p1, 25, WHITE, True)
    if lab2:
        p2 = lab2 + "  " + str(thresholds.get(str(int(lab2[:-2])*1000), 0))
        put(1000, y, p2, 25, WHITE, True)
place_pb_count = 1 if pg["placePB"] else 0
put(845, 1622, f"{len(pg['linePB'])} LINE PBS  •  {place_pb_count} PLACE PB", 20, MINT, True)

# Milestone region
put(130, 1693, "MILESTONES & HIGHLIGHTS", 43, GOLD, True, max_width=1000)
highlights = ms["highlights"] or ["No qualifying highlight this week"]
for idx, s in enumerate(highlights[:4]):
    put(127, 1757+idx*45, s, 23, MINT if idx == len(highlights[:4])-1 else WHITE, True, max_width=479)
    if idx < len(highlights[:4])-1:
        draw_rule(127, 1795+idx*45, 609)

other = ms["other"] or ["No additional milestones this week"]
for idx, s in enumerate(other[:4]):
    put(700, 1757+idx*45, s, 23, GOLD if idx == len(other[:4])-1 else WHITE, True, max_width=431)
    if idx < len(other[:4])-1:
        draw_rule(700, 1795+idx*45, 1131)

centered(720, 1974, "SOURCE: AVENGERS STAT CENTER • VERIFIED RECORDED RESULTS • PARTIAL SOURCE COVERAGE", 19, PALE, True, 1280)
centered(720, 2005, "REVIEW PREVIEW — NOT POSTED — ALL VALUES TYPESET FROM THE FACT MANIFEST", 17, CYAN, False, 1260)


# ---- Additional record-book sections, extending the source background's style. ----
for y in range(2035, H):
    t = (y-2035)/(H-2035)
    draw.line((0, y, W, y), fill=(int(5+4*t), int(13+10*t), int(37+17*t)))
rng = random.Random(1025)
for _ in range(340):
    x, y = rng.randrange(W), rng.randrange(2035, H)
    shade = rng.choice([(36, 78, 118), (61, 115, 151), (61, 75, 142), (69, 50, 123)])
    draw.ellipse((x, y, x+1, y+1), fill=shade)

draw.rounded_rectangle((31, 2065, 1409, 2184), radius=23, fill=(8, 24, 57), outline=GOLD, width=3)
centered(720, 2080, "THE RECORD BOOK", 49, GOLD, True)
centered(720, 2147, "EVERY VERIFIED NEW PERSONAL BEST • PREVIOUS RESULT • PRIOR DATE", 23, PALE, True)


def details_line(x, y, width, p, kind, compact=False):
    if kind == "space":
        before = number(p["prev"], 1)+"B"
        after = number(p["score"], 1)+"B"
        date = short_date(p["prevDate"])
        name = p["name"]
    elif kind == "piggy":
        before = number(p["prev"])
        after = number(p["score"])
        date = short_date(p["prevDate"])
        name = p["name"]
    else:
        before = number(p["prior"])
        after = number(p["current"])
        date = short_date(p["priorDate"]) if p.get("priorDate") else "UNKNOWN"
        fc = p.get("flashCount")
        tag = "" if p.get("complete") else f" ({fc} PF{'s' if fc != 1 else ''})"
        name = f"{p['name']}{tag}"
    put(x, y, strip_av(name), 23 if not compact else 22, WHITE, True, max_width=270, min_size=18)
    put(x+width-8, y, before + " → " + after, 22, CYAN, True, anchor="ra", max_width=330, min_size=18)
    put(x+1, y+31, "PRIOR " + date.upper(), 17, MUTED, True)
    put(x+width-8, y+31, "+" + number(p["pct"], 1) + "%" if p.get("pct") is not None else "", 19, GOLD, True, anchor="ra")


card(37, 2202, 1404, 2897, CYAN)
put(66, 2215, f"SPACE RACE — {sp['distancePBCount']} NEW DISTANCE PERSONAL BESTS", 33, CYAN, True, max_width=1270)
put(67, 2262, "Verified against all previously tracked Space results • distances in billions", 20, PALE)
spaces = sorted(sp["personalBests"], key=lambda p: -p["pct"])
left, right = spaces[:10], spaces[10:20]
for idx, p in enumerate(left):
    y = 2300+idx*56
    details_line(68, y, 604, p, "space")
    if idx < len(left)-1:
        draw_rule(68, y+54, 671, (24, 65, 106))
for idx, p in enumerate(right):
    y = 2300+idx*56
    details_line(745, y, 614, p, "space")
    if idx < len(right)-1:
        draw_rule(745, y+54, 1359, (24, 65, 106))
if left:
    draw.line((718, 2282, 718, 2865), fill=(36, 105, 141), width=2)
if not left and not right:
    centered(720, 2360, "No new Space distance PBs this week", 24, PALE, True)

card(37, 2921, 706, 3740, GOLD)
put(64, 2933, f"BIG PIG — {len(pg['linePB'])} LINE PBS", 31, GOLD, True)
put(65, 2975, f"{pg['dateLabel']} • PREVIOUS PERSONAL BESTS", 18, PALE, True)
piggy_pbs = sorted(pg["linePB"], key=lambda r: -r["pct"])[:7]
for idx, p in enumerate(piggy_pbs):
    y = 3006+idx*73
    details_line(65, y, 612, p, "piggy")
    if idx < len(piggy_pbs)-1:
        draw_rule(65, y+65, 677, (72, 63, 41))
if not piggy_pbs:
    put(65, 3006, "No new Piggy line PBs this week", 22, PALE, True)
draw_rule(65, 3551, 677, (100, 82, 42))
put(65, 3573, "PLACE PB", 23, GOLD, True)
if pg["placePB"]:
    pb = pg["placePB"]
    put(65, 3612, f"{strip_av(pb['name'])}  •  {ordinal(pb['from'])} → {ordinal(pb['to'])}", 25, WHITE, True, max_width=610)
else:
    put(65, 3612, "No qualified rank-position PB this week", 22, PALE, True, max_width=610)
put(65, 3652, f"{pg['participantCount']} AVENGERS recorded this event", 18, PALE)
if pg["firstTracked"]:
    names = ", ".join(strip_av(n) for n in pg["firstTracked"][:4])
    put(65, 3689, f"FIRST TRACKED: {names}", 18, MINT, True, max_width=610, min_size=14)

card(734, 2921, 1404, 3740, MAGENTA)
put(760, 2933, f"FLASH SET — {len(fl['flashPBs'])} NEW DAY PBS", 31, MAGENTA, True)
put(761, 2975, "COMBINED SCORES FROM THIS SET'S FLASHES", 18, PALE, True)
flash_pbs = sorted(fl["flashPBs"], key=lambda r: -r["current"])[:10]
for idx, p in enumerate(flash_pbs):
    y = 3001+idx*63
    details_line(760, y, 615, p, "flash", compact=True)
    if idx < len(flash_pbs)-1:
        draw_rule(761, y+60, 1373, (73, 44, 101))
if not flash_pbs:
    put(760, 3001, "No new Flash line PBs this week", 22, PALE, True)

card(38, 3760, 1403, 3888, MINT)
put(70, 3770, "COVERAGE & FAIRNESS NOTES", 24, MINT, True)
cov_lines = F["coverageLines"]
put(70, 3807, cov_lines[0] if len(cov_lines) > 0 else "", 19, WHITE, False, max_width=1280)
put(70, 3840, cov_lines[1] if len(cov_lines) > 1 else "", 19, PALE, False, max_width=1270)
put(70, 3868, "Per-event coverage detail is retained in the source ledger, not reproduced here.", 18, MUTED, False, max_width=1270)

im.save(OUTPUT, optimize=True)

import hashlib
sha = hashlib.sha256(OUTPUT.read_bytes()).hexdigest()
side = dict(
    file=str(OUTPUT), clan=F["clan"], weekStart=F["weekStart"], weekEnd=F["weekEnd"],
    projectionVersion=F.get("projectionVersion"), reviewDigest=F.get("reviewDigest"),
    templateVersion=TEMPLATE_VERSION, imageSHA256=sha, dimensions=[im.width, im.height],
    readyToPost=False, discordPostingEnabled=False,
)
Path(str(OUTPUT).rsplit(".", 1)[0] + ".json").write_text(json.dumps(side, indent=2))
print(f"Rendered {OUTPUT} | {im.width}x{im.height} | {OUTPUT.stat().st_size:,} bytes")
