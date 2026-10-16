#!/usr/bin/env python3
"""Generate review-only Piggy, Piggy Flash or Kraken PNGs from an approved release.

Usage:
  python3 scripts/render-event-summary.py reports/summary-release.json reports/piggy.png \
    --kind piggy --clan AVENGERS [--event-id piggy|2026-10-11]

Space uses the *existing approved template* scripts/render-space-summary.py.
This renderer never imports results, modifies ledger sources or sends Discord posts.
"""
import argparse
import datetime as dt
import hashlib
import json
import math
import os
from pathlib import Path

KINDS = {
    "piggy": ("PIGGY RACE", "LINES", "lines"),
    "flash": ("PIGGY FLASH", "LINES", "lines"),
    "kraken": ("KRAKEN", "DAMAGE", "million-damage"),
}
PALETTE = {
    "bg": "#061528", "panel": "#0b2037", "alternate": "#10304c",
    "line": "#285d8a", "fg": "#edf4ff", "muted": "#a5bad6",
    "cyan": "#19d4f0", "purple": "#8b50ff", "green": "#19e8ac",
    "yellow": "#ffdf50", "red": "#ff626f",
}


def numeric(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return float(value) if math.isfinite(value) else None


def format_number(value, decimals=0):
    n = numeric(value)
    return f"{n:,.{decimals}f}" if n is not None else "—"


def format_score(kind, value):
    return format_number(value, 1 if kind == "kraken" else 0) + ("M" if kind == "kraken" and numeric(value) is not None else "")


def display_name(player):
    return player[3:] if player.startswith("AV-") else player


def month_date(s):
    return dt.date.fromisoformat(s).strftime("%b %-d, %Y")


def previous_event_label(event):
    return month_date(event["date"]) + ((" · Flash " + str(event.get("metadata", {}).get("flash", "?")))
                                             if event["kind"] == "flash" else "")


def resolve_summary(release, kind, clan, event_id=None):
    """Pure summary model. All figures come from a canonical approved projection."""
    if release.get("source") != "approved-event-ledger" or release.get("schemaVersion") != 1:
        raise ValueError("Only the approved-ledger summary export is eligible for rendering")
    projection = release.get("projection") or {}
    if not isinstance(projection.get("version"), str) or len(projection["version"]) < 16:
        raise ValueError("Missing canonical projection version")
    if kind not in KINDS or clan not in ("AVENGERS", "AV-2"):
        raise ValueError("Unsupported event kind or event-time clan")
    events = [e for e in projection.get("events", []) if e.get("kind") == kind
              and e.get("status") in ("final", "partial")]
    events.sort(key=lambda e: (e["date"], e["id"]))
    if event_id:
        eligible = [e for e in events if e["id"] == event_id]
        if not eligible:
            raise ValueError("Selected event is not an accepted active " + kind + " event")
        event = eligible[0]
    else:
        eligible = [e for e in events if any(r.get("clan") == clan for r in e.get("rows", []))]
        if not eligible:
            raise ValueError("No accepted " + kind + " results for " + clan)
        event = eligible[-1]
    if not any(r.get("clan") == clan for r in event.get("rows", [])):
        raise ValueError("Selected event has no " + clan + " results")
    if event.get("unit") != KINDS[kind][2]:
        raise ValueError("Event unit mismatch; do not mix damage with lines or Space distance")
    source_rows = [r for r in event["rows"] if r.get("clan") == clan]
    rows = sorted(source_rows, key=lambda r: (numeric(r.get("score")) is None,
                            -(numeric(r.get("score")) or 0), r.get("player") or ""))
    people = {p["name"]: p for p in projection.get("people", [])}
    pbs, first, rank_rows = [], [], []
    for ix, row in enumerate(rows, 1):
        person = row.get("player")
        score = numeric(row.get("score"))
        meta = row.get("metadata") or {}
        item = dict(player=person or "Unassigned account", unassigned=not bool(person),
                    score=score, sparks=numeric(row.get("sparks")),
                    stars=None if kind == "kraken" else numeric(row.get("stars")),
                    estimatedSparks=bool(row.get("estimatedSparks")),
                    share=numeric(meta.get("share")), group=meta.get("group"),
                    rank=ix, transition=None)
        if person and person in people:
            transitions = people[person].get("kinds", {}).get(kind, {}).get("pbs", [])
            match = next((t for t in transitions if t.get("eventId") == event["id"]), None)
            if match and score is not None and numeric(match.get("score")) == score:
                item["transition"] = match
                if match.get("firstRecorded"):
                    first.append(item)
                elif match.get("newPB") and numeric(match.get("previousPB")) is not None:
                    pbs.append(item)
        rank_rows.append(item)
    pbs.sort(key=lambda r: (-(numeric(r["transition"].get("improvement")) or 0),
                             r["player"]))
    first.sort(key=lambda r: (-(r["score"] or 0), r["player"]))
    total_score = sum(r["score"] for r in rank_rows if r["score"] is not None)
    total_sparks = sum(r["sparks"] for r in rank_rows if r["sparks"] is not None)
    total_stars = sum(r["stars"] for r in rank_rows if r["stars"] is not None)
    missing_scores = sum(r["score"] is None for r in rank_rows)
    missing_sparks = sum(r["sparks"] is None for r in rank_rows)
    missing_stars = sum(r["stars"] is None for r in rank_rows) if kind != "kraken" else None
    prior = next((e for e in reversed(events)
                  if (e["date"], e["id"]) < (event["date"], event["id"])
                  and any(r.get("clan") == clan for r in e.get("rows", []))), None)
    prior_rows = [r for r in prior.get("rows", []) if r.get("clan") == clan] if prior else []
    prior_known = [numeric(r.get("score")) for r in prior_rows if numeric(r.get("score")) is not None]
    return {
        "eventId": event["id"], "date": event["date"], "kind": kind, "clan": clan,
        "status": event["status"], "unit": event["unit"], "projectionVersion": projection["version"],
        "rows": rank_rows, "pbs": pbs, "firstTracked": first,
        "participantRows": len(rank_rows), "knownScoreSum": total_score,
        "knownScoreCount": len(rank_rows) - missing_scores, "knownSparks": total_sparks,
        "knownStars": total_stars if kind != "kraken" else None,
        "unknownScoreRows": missing_scores, "unknownSparkRows": missing_sparks,
        "unknownStarRows": missing_stars, "estimatedSparkRows": sum(r["estimatedSparks"] for r in rank_rows),
        "previousEvent": prior["id"] if prior else None,
        "previousLabel": previous_event_label(prior) if prior else None,
        "previousScoreSum": sum(prior_known) if prior else None,
        "previousKnownCount": len(prior_known),
        "coverageComplete": event["status"] == "final",
        "readyToPost": False,
    }


def _fonts(size, bold=False):
    from PIL import ImageFont
    family = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    for fname in ("/usr/share/fonts/truetype/dejavu/" + family, family):
        try:
            return ImageFont.truetype(fname, size)
        except OSError:
            continue
    raise RuntimeError("Pillow DejaVuSans font unavailable; do not substitute an unreviewed graphic")


def draw_png(model, dest):
    from PIL import Image, ImageDraw
    w, h = 2400, 1500
    image = Image.new("RGB", (w, h), PALETTE["bg"])
    dr = ImageDraw.Draw(image)
    def txt(x, y, s, size=25, color="fg", bold=False, anchor=None):
        dr.text((x, y), str(s), font=_fonts(size, bold),
                fill=PALETTE.get(color, color), anchor=anchor)
    def fit(x, y, s, width, size=28, color="fg", bold=False):
        s = str(s)
        while dr.textlength(s, font=_fonts(size, bold)) > width and size > 16:
            size -= 1
        if dr.textlength(s, font=_fonts(size, bold)) > width:
            while s and dr.textlength(s + "…", font=_fonts(size, bold)) > width:
                s = s[:-1]
            s += "…"
        txt(x, y, s, size, color, bold)
    def box(x1, y1, x2, y2, outline="line"):
        dr.rounded_rectangle((x1, y1, x2, y2), radius=20,
                             fill=PALETTE["panel"], outline=PALETTE[outline], width=2)
    def note(x, y, value, width=540):
        fit(x, y, value, width, 21, "muted")
    for shift in (0, 230, 500):
        dr.arc((-550, -70 + shift, 900, 1270 + shift), 235, 55, fill="#10405a", width=2)
    kind = model["kind"]
    heading = KINDS[kind][0]
    if kind == "flash":
        heading += " #" + str(model["eventId"].split("|")[-1])
    if kind == "kraken":
        heading += " · MONTHLY RESULTS"
    else:
        heading += " · RESULTS SUMMARY"
    txt(48, 32, model["clan"] + " // STAT CENTER", 28, "cyan", True)
    fit(45, 82, heading, 1600, 62, "fg", True)
    txt(2352, 41, month_date(model["date"]).upper(), 32, "muted", True, "ra")
    txt(2352, 94, "APPROVED LEDGER · REVIEW PREVIEW", 22, "green", True, "ra")
    score = model["knownScoreSum"]
    count = model["participantRows"]
    prev = model["previousScoreSum"]
    score_title = "KNOWN " + ("DAMAGE" if kind == "kraken" else "LINES")
    top = [
        (score_title, format_score(kind, score),
         str(model["knownScoreCount"]) + " score rows · " + str(model["unknownScoreRows"]) + " unknown"),
        ("AVERAGE / KNOWN", format_score(kind, score / model["knownScoreCount"]) if model["knownScoreCount"] else "—",
         "Recorded participants only · no absent members assumed"),
        ("KNOWN SPARKS", format_number(model["knownSparks"]),
         str(model["unknownSparkRows"]) + " reward rows unknown" +
         (" · estimated: " + str(model["estimatedSparkRows"]) if kind == "kraken" else "")),
        (("PLAYERS LOGGED" if kind == "kraken" else "KNOWN STARS"),
         str(count) if kind == "kraken" else format_number(model["knownStars"]),
         ("Kraken awards no Stars" if kind == "kraken" else str(model["unknownStarRows"]) + " Star rows unknown"))
    ]
    for i, (label, value, subtitle) in enumerate(top):
        x = 45 + i * 588
        box(x, 180, x + 568, 340)
        dr.rounded_rectangle((x, 180, x + 7, 340), 3,
                             fill=PALETTE["cyan" if i % 2 else "purple"])
        fit(x + 28, 200, label, 520, 23, "muted", True)
        fit(x + 28, 238, value, 520, 48, "fg", True)
        note(x + 28, 304, subtitle, 520)
    lx, rx = 45, 1170
    box(lx, 378, 1138, 848, "cyan")
    dr.rounded_rectangle((lx + 17, 395, 1120, 493), 14, fill="#112d49")
    txt(lx + 38, 407, "★ PERSONAL BESTS", 47, "fg", True)
    txt(1095, 421, f'{len(model["pbs"])} NEW PBs', 28, "green", True, "ra")
    fit(lx + 40, 465, "Returning players · ranked by improvement", 950, 22, "muted")
    for x, label, right in [(lx+30,"#",False),(lx+82,"PLAYER",False),
                             (730,"OLD PB",True),(918,"NEW PB",True),(1100,"INCREASE",True)]:
        txt(x, 521, label, 21, "muted", True, "ra" if right else None)
    for i, entry in enumerate(model["pbs"][:4]):
        y = 565 + i * 65
        t = entry["transition"]
        if i % 2 == 0:
            dr.rounded_rectangle((lx+20,y-5,1115,y+53),10,fill=PALETTE["alternate"])
        txt(lx+30, y, i+1, 29, "cyan", True)
        fit(lx+80,y,display_name(entry["player"]),385,30,"yellow" if i==0 else "fg",True)
        txt(730,y,format_score(kind,t["previousPB"]),29,"muted",True,"ra")
        txt(918,y,format_score(kind,entry["score"]),29,"fg",True,"ra")
        improvement=numeric(t.get("improvement"))
        txt(1100,y,f'+{improvement*100:.1f}%' if improvement is not None else "—",
            29,"green",True,"ra")
    if not model["pbs"]:
        note(lx+48,620,"No confirmed returning-player personal bests in this event",1000)
    if len(model["pbs"])>4:
        txt(lx+38,808,f'+ {len(model["pbs"])-4} more verified PBs · see Stat Center event records',21,"cyan")
    else:
        txt(lx+38,810,"Historical PBs from this event type only · no unverified claims",20,"muted")
    box(rx,378,2355,1070)
    txt(rx+30,405,"TOP 10 — "+KINDS[kind][1],38,"fg",True)
    txt(rx+30,458,model["clan"]+" event-time competitors",23,"muted")
    headers=[(rx+27,"#",False),(rx+83,"PLAYER",False),(rx+570,"SCORE",True),
             (rx+765,"STARS",True),(rx+944,"SPARKS",True),(rx+1062,"SHARE",True),
             (rx+1154,"SP / UNIT",True)]
    for x, label, right in headers:
        txt(x,508,label,19,"muted",True,"ra" if right else None)
    for i, entry in enumerate(model["rows"][:10]):
        y=552+i*48
        if i%2==0:dr.rectangle((rx+20,y-3,2335,y+44),fill=PALETTE["alternate"])
        shade="yellow" if i==0 else "fg"
        txt(rx+27,y,i+1,25,shade,True)
        fit(rx+83,y,display_name(entry["player"]),360,26,shade,True)
        txt(rx+570,y,format_score(kind,entry["score"]),23,"fg",True,"ra")
        txt(rx+765,y,"N/A" if kind=="kraken" else format_number(entry["stars"]),22,"muted",False,"ra")
        txt(rx+944,y,format_number(entry["sparks"]),23,"muted",False,"ra")
        share=entry["share"]
        txt(rx+1062,y,f'{share*100:g}%' if share is not None else "—",
            22,"muted",False,"ra")
        effort=entry["sparks"]/entry["score"] if entry["sparks"] is not None and entry["score"] else None
        txt(rx+1154,y,format_number(effort,1) if kind!="kraken" else "—",23,
            "cyan",False,"ra")
    box(lx,869,1138,1070)
    txt(lx+28,893,"FIRST TRACKED "+heading.split(" · ")[0]+" RESULTS",27,"cyan",True)
    for i, entry in enumerate(model["firstTracked"][:4]):
        x=lx+28+(i%2)*535;y=947+(i//2)*50
        fit(x,y,display_name(entry["player"]),310,25,"fg",True)
        txt(x+492,y,format_score(kind,entry["score"]),23,"muted",False,"ra")
    if not model["firstTracked"]:
        note(lx+30,955,"No first-tracked entries in these results",950)
    if len(model["firstTracked"])>4:
        note(lx+30,1034,f'+{len(model["firstTracked"])-4} more first-tracked competitors on the website',980)
    else:
        note(lx+30,1034,"First in our recorded history · not necessarily first-ever",980)
    box(lx,1091,1138,1376,"purple")
    txt(lx+30,1114,"EFFORT & REWARDS",34,"fg",True)
    if kind=="kraken":
        note(lx+30,1170,"Damage and Sparks use separately sourced values",1000)
        note(lx+30,1220,"Estimated or missing payouts stay labeled as such",1000)
        note(lx+30,1270,"No Kraken Stars or mixed-unit Sparks/Effort",1000)
    else:
        note(lx+30,1170,"Lowest known Sparks per line · at least 3,500 lines",1000)
        shouts=sorted((r for r in model["rows"] if r["sparks"] is not None
                        and r["score"] is not None and r["score"] >= 3500),
                      key=lambda r:(r["sparks"]/r["score"],r["player"]))[:3]
        for i, entry in enumerate(shouts):
            y=1205+i*44
            fit(lx+30,y,display_name(entry["player"]),410,26,"fg",True)
            txt(845,y,format_score(kind,entry["score"]),24,"muted",False,"ra")
            txt(1095,y,f'{entry["sparks"]/entry["score"]:.3f} Sp/line',23,"cyan",True,"ra")
        if not shouts:
            note(lx+30,1225,"No known rewards above comparison threshold",1000)
        note(lx+30,1341,"Effort comparison, not a performance ranking",980)
    box(rx,1091,2355,1376)
    txt(rx+30,1113,"EVENT COMPARISON & COVERAGE",32,"fg",True)
    prior_label=model["previousLabel"]
    if prior_label and prev is not None:
        note(rx+30,1170,"Previously recorded event: "+prior_label,1000)
        txt(rx+30,1220,"Known recorded effort",25,"muted")
        txt(1800,1218,format_score(kind,score),30,"fg",True,"ra")
        txt(2045,1222,"vs "+format_score(kind,prev),24,"muted",False,"ra")
        text_change=(f'{(score/prev-1)*100:+.1f}%' if prev>0 else "—")
        txt(2315,1217,text_change,31,"green" if prev and score>=prev else "red",True,"ra")
        note(rx+30,1311,"Recorded participation differs; totals not normalized",1000)
    else:
        note(rx+30,1202,"No prior clan result for this event type in accepted history",1060)
    state="PARTIAL RESULTS" if not model["coverageComplete"] else "MARKED FINAL IN LEDGER"
    footer=(f'{state} · {model["participantRows"]} recorded rows · '
            f'{model["unknownSparkRows"]} missing Sparks · preview only · NOT POSTED')
    fit(45,1410,footer,2300,22,"muted")
    fit(45,1450,"Event "+model["eventId"]+" · source projection "+model["projectionVersion"][:16],
        1900,20,"muted")
    txt(2355,1445,"AVENGERS STAT CENTER",24,"cyan",True,"ra")
    image.save(dest, format="PNG", optimize=False)


def render(release, kind, clan, event_id, output):
    model=resolve_summary(release,kind,clan,event_id)
    dest=Path(output)
    if dest.suffix.lower()!=".png":raise ValueError("Output path must end with .png")
    if not dest.parent.exists():raise ValueError("Output folder must already exist")
    draw_png(model,dest)
    result={
        "eventId":model["eventId"],"clan":clan,"kind":kind,
        "projectionVersion":model["projectionVersion"],
        "imageSHA256":hashlib.sha256(dest.read_bytes()).hexdigest(),
        "participants":model["participantRows"],"pbs":len(model["pbs"]),
        "firstTracked":len(model["firstTracked"]),
        "unknownSparkRows":model["unknownSparkRows"],
        "unknownStarRows":model["unknownStarRows"],
        "eventStatus":model["status"],
        "readyToPost":False,"discordPostingEnabled":False,
        "approvedSourceOnly":True,
        "disclaimer":"Graphic generated for human review; no automated send or source changes.",
    }
    meta=dest.with_suffix(".json")
    meta.write_text(json.dumps(result,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    return result


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("release")
    parser.add_argument("output")
    parser.add_argument("--kind",choices=tuple(KINDS),required=True)
    parser.add_argument("--clan",choices=("AVENGERS","AV-2"),default="AVENGERS")
    parser.add_argument("--event-id",default=None)
    args=parser.parse_args()
    release=json.loads(Path(args.release).read_text(encoding="utf-8"))
    print(json.dumps(render(release,args.kind,args.clan,args.event_id,args.output),sort_keys=True))


if __name__=="__main__":
    main()
