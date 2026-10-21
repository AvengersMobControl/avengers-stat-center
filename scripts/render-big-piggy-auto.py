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
import re
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
    "yellow": "#ffdf50", "red": "#ff626f", "magenta": "#ff4fd8",
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
    source_rows = [r for r in event["rows"] if r.get("clan") == clan and r.get("score") != 1]
    if not source_rows:
        raise ValueError("Selected event has no participating " + clan + " results")
    rows = sorted(source_rows, key=lambda r: (numeric(r.get("score")) is None,
                            -(numeric(r.get("score")) or 0), r.get("player") or ""))
    people = {p["name"]: p for p in projection.get("people", [])}
    career_counts = (release.get("piggyCareerPodiumsByClan") or {}).get(clan, {})
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
                    rank=ix, transition=None,
                    careerPodiums=(career_counts.get(person) if ix <= 3 and person else None))
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
    placement_source = (release.get("piggyPlacementPBsByClan") or {}).get(clan, {}).get(event["id"], [])
    placement_pbs = [dict(x) for x in placement_source
                     if x.get("improved") is True and numeric(x.get("previousRank")) is not None
                     and numeric(x.get("newRank")) is not None
                     and numeric(x.get("newRank")) < numeric(x.get("previousRank"))]
    placement_pbs.sort(key=lambda x: (numeric(x.get("newRank")), x.get("player", "")))
    event_metadata = event.get("metadata") or {}
    lobby_labels = sorted({str((r.get("metadata") or {}).get("lobbyLabel") or
                               (r.get("metadata") or {}).get("lobbyName") or
                               (r.get("metadata") or {}).get("lobby"))
                           for r in source_rows if ((r.get("metadata") or {}).get("lobbyLabel") or
                               (r.get("metadata") or {}).get("lobbyName") or
                               (r.get("metadata") or {}).get("lobby"))})
    lobby_label = str(event_metadata.get("lobbyLabel") or event_metadata.get("lobbyName") or event_metadata.get("lobby") or
                      (lobby_labels[0] if len(lobby_labels)==1 else ("Multiple lobbies ("+str(len(lobby_labels))+")" if lobby_labels else "Not source-labeled")))
    if clan == "AV-2":
        displayed_pot = event_metadata.get("av2DisplayedPotStars")
        rake_percent = numeric(event_metadata.get("av2RakePercentDisplayedShareSum"))
        if rake_percent is None:
            lobby_ids = {str((r.get("metadata") or {}).get("lobby",
                          (r.get("metadata") or {}).get("group", "unknown"))) for r in source_rows}
            shares = [numeric((r.get("metadata") or {}).get("share")) for r in source_rows]
            if len(lobby_ids) == 1 and shares and all(x is not None for x in shares):
                rake_percent = sum(shares) * 100
    else:
        displayed_pot = event_metadata.get("displayedPotStars")
        rake_percent = None
    total_score = sum(r["score"] for r in rank_rows if r["score"] is not None)
    total_sparks = sum(r["sparks"] for r in rank_rows if r["sparks"] is not None)
    total_stars = sum(r["stars"] for r in rank_rows if r["stars"] is not None)
    missing_scores = sum(r["score"] is None for r in rank_rows)
    missing_sparks = sum(r["sparks"] is None for r in rank_rows)
    missing_stars = sum(r["stars"] is None for r in rank_rows) if kind != "kraken" else None
    prior = next((e for e in reversed(events)
                  if e.get("status") == "final" and (e["date"], e["id"]) < (event["date"], event["id"])
                  and any(r.get("clan") == clan and r.get("score") != 1 for r in e.get("rows", []))), None)
    prior_rows = [r for r in prior.get("rows", []) if r.get("clan") == clan and r.get("score") != 1] if prior else []
    prior_known = [numeric(r.get("score")) for r in prior_rows if numeric(r.get("score")) is not None]
    average_trend = []
    for history_event in projection.get("events", []):
        if history_event.get("kind") != kind or history_event.get("status") != "final" or history_event.get("date") > event["date"]:
            continue
        history_rows = [r for r in history_event.get("rows", []) if r.get("clan") == clan and r.get("score") != 1
                        and numeric(r.get("score")) is not None]
        if history_rows:
            average_trend.append({"date":history_event["date"],
                                  "average":sum(numeric(r.get("score")) for r in history_rows)/len(history_rows),
                                  "total":sum(numeric(r.get("score")) for r in history_rows)})
    average_trend.sort(key=lambda x:x["date"])
    average_trend = average_trend[-5:]
    week_growth = ((total_score-sum(prior_known))/sum(prior_known)*100
                   if prior_known and sum(prior_known)>0 else None)
    benchmark_data = (release.get("piggyBenchmarksByClan") or {}).get(clan, {})
    weekly_benchmark = next((w for w in benchmark_data.get("weekly",[]) if w.get("date")==event["date"]),None)
    milestones = []
    if weekly_benchmark:
        for i, threshold in enumerate(benchmark_data.get("thresholds",[])):
            count = weekly_benchmark.get("counts",[])[i] if i < len(weekly_benchmark.get("counts",[])) else 0
            if count <= 0: continue
            record = next((r for r in benchmark_data.get("records",[]) if r.get("threshold")==threshold),{})
            milestones.append({"threshold":threshold,"count":count,
              "record":record.get("count")==count and event["date"] in (record.get("tiedDates") or [])})
    flash_num = event.get("metadata", {}).get("flash") if kind == "flash" else None
    if kind == "flash" and not flash_num:
        parsed = re.search(r"PF(\d+)", event["id"], re.IGNORECASE)
        flash_num = parsed.group(1) if parsed else None
    return {
        "eventId": event["id"], "date": event["date"], "kind": kind, "clan": clan, "lobbyLabel": lobby_label,
        "flashNumber": str(flash_num) if flash_num else None,
        "status": event["status"], "unit": event["unit"], "projectionVersion": projection["version"],
        "rows": rank_rows, "pbs": pbs, "firstTracked": first,
        "placementPBs": placement_pbs, "displayedPotStars": displayed_pot,
        "rakePercentDisplayedShareSum": rake_percent,
        "participantRows": len(rank_rows), "knownScoreSum": total_score,
        "knownScoreCount": len(rank_rows) - missing_scores, "knownSparks": total_sparks,
        "knownStars": total_stars if kind != "kraken" else None,
        "unknownScoreRows": missing_scores, "unknownSparkRows": missing_sparks,
        "unknownStarRows": missing_stars, "estimatedSparkRows": sum(r["estimatedSparks"] for r in rank_rows),
        "previousEvent": prior["id"] if prior else None,
        "previousLabel": previous_event_label(prior) if prior else None,
        "previousScoreSum": sum(prior_known) if prior else None,
        "previousKnownCount": len(prior_known),
        "weekToWeekGrowthPercent": week_growth,
        "averageTrend": average_trend,
        "milestones": milestones,
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


def draw_png(model, dest, automatic_piggy_layout=False, automatic_piggy_publish=False):
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
    if kind == "flash" and model.get("flashNumber"):
        heading += " #" + str(model["flashNumber"])
    if kind == "kraken":
        heading += " · MONTHLY RESULTS"
    else:
        heading += " · RESULTS SUMMARY"
    txt(48, 32, model["clan"] + " // STAT CENTER", 28, "cyan", True)
    fit(45, 82, heading, 1600, 62, "fg", True)
    txt(2352, 41, month_date(model["date"]).upper(), 32, "muted", True, "ra")
    header_state=("APPROVED LEDGER · FINAL REPORT" if automatic_piggy_publish else "APPROVED LEDGER · REVIEW PREVIEW") if automatic_piggy_layout else "APPROVED LEDGER · REVIEW PREVIEW"
    txt(2352, 94, header_state, 22, "green", True, "ra")
    if automatic_piggy_layout:
        fit(45,137,"Event-time clan: "+model["clan"]+" · Lobby: "+model["lobbyLabel"],1700,15,"muted")
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
        (("PLAYERS LOGGED" if kind == "kraken" else ("AV-2 EARNED STARS" if automatic_piggy_layout and kind == "piggy" and model["clan"] == "AV-2" else "KNOWN STARS")),
         str(count) if kind == "kraken" else format_number(model["knownStars"]),
         ("Kraken awards no Stars" if kind == "kraken" else str(model["unknownStarRows"]) + " Star rows unknown"))
    ]
    if automatic_piggy_layout and kind == "piggy" and model["clan"] == "AV-2":
        pot = model.get("displayedPotStars") or "unknown"
        rake = model.get("rakePercentDisplayedShareSum")
        rake_text = (f"{rake:.1f}% displayed-share sum" if rake is not None else "displayed-share sum unknown")
        top[3] = ("AV-2 EARNED STARS", format_number(model["knownStars"]),
                  f"Whole-lobby pot {pot} · RAKE {rake_text}")
    elif automatic_piggy_layout and kind == "piggy" and model["clan"] == "AVENGERS":
        pot = model.get("displayedPotStars") or "unknown"
        top[3] = ("CLAN EARNED STARS", format_number(model["knownStars"]),
                  f"Whole-lobby pot {pot} · clan Stars shown separately")
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
    if automatic_piggy_layout and kind == "piggy":
        txt(lx+30, 478, "LINE PBs", 23, "cyan", True)
        txt(lx+535, 478, str(len(model["pbs"])), 22, "muted", True, "ra")
        txt(lx+565, 478, "FINISH-PLACE PBs", 23, "purple", True)
        txt(lx+1050, 478, str(len(model["placementPBs"])), 22, "muted", True, "ra")
        for i, entry in enumerate(model["pbs"][:4]):
            y=525+i*65
            t=entry["transition"]
            if i%2==0: dr.rounded_rectangle((lx+20,y-5, lx+525,y+51),10,fill=PALETTE["alternate"])
            fit(lx+30,y,display_name(entry["player"]),190,22,"yellow" if i==0 else "fg",True)
            old_new=format_score(kind,t["previousPB"])+" → "+format_score(kind,entry["score"])
            txt(lx+430,y,old_new,18,"fg",True,"ra")
            improvement=numeric(t.get("improvement"))
            txt(lx+520,y,f'+{improvement*100:.1f}%' if improvement is not None else "—",16,"green",True,"ra")
        for i, entry in enumerate(model["placementPBs"][:4]):
            y=525+i*65
            if i%2==0: dr.rounded_rectangle((lx+550,y-5,1115,y+51),10,fill=PALETTE["alternate"])
            fit(lx+565,y,display_name(entry.get("player","")),205,23,"yellow" if i==0 else "fg",True)
            previous=entry.get("previousRank")
            current=entry.get("newRank")
            txt(1040,y,f'{format_finish(previous)} → {format_finish(current)}',22,"fg",True,"ra")
            old_date=entry.get("previousDate")
            txt(1100,y+26,old_date[5:] if isinstance(old_date,str) and len(old_date)>=10 else "prior",16,"muted",False,"ra")
        if not model["pbs"]:
            note(lx+30,800,"No confirmed line PBs in this event",480)
        if not model["placementPBs"]:
            note(lx+565,800,"No qualifying finish-place improvements",530)
        else:
            note(lx+565,800,"Original ranks · same-lobby threshold met",530)
    else:
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
    if kind == "kraken":
        headers=[(rx+27,"#",False),(rx+83,"PLAYER",False),(rx+570,"DAMAGE",True),
                 (rx+855,"SPARKS",True),(rx+1030,"SHARE",True),(rx+1154,"PAYOUT",True)]
    else:
        headers=[(rx+27,"#",False),(rx+83,"PLAYER",False),
                 (rx+930,"CAREER W / 2 / 3 / P",True),(rx+1154,"LINES",True)]
    for x, label, right in headers:
        txt(x,508,label,19,"muted",True,"ra" if right else None)
    for i, entry in enumerate(model["rows"][:10]):
        y=552+i*48
        if i%2==0:dr.rectangle((rx+20,y-3,2335,y+44),fill=PALETTE["alternate"])
        shade="yellow" if i==0 else "fg"
        txt(rx+27,y,i+1,25,shade,True)
        fit(rx+83,y,display_name(entry["player"]),620,26,shade,True)
        career=entry.get("careerPodiums")
        if i<3 and career:
            career_text=str(career.get("wins",0))+"/"+str(career.get("secondPlaces",0))+"/"+str(career.get("thirdPlaces",0))+"/"+str(career.get("podiums",0))
            txt(rx+930,y,career_text,21,"purple",True,"ra")
        txt(rx+1154,y,format_score(kind,entry["score"]),24,"fg",True,"ra")
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
    if automatic_piggy_layout and kind=="piggy":
        txt(lx+30,1114,"RACE HIGHLIGHTS",34,"fg",True)
        if model["pbs"]:
            best=model["pbs"][0]
            transition=best["transition"]
            improvement=numeric(transition.get("improvement"))
            line_text="Line PB: "+display_name(best["player"])+" · "+format_score(kind,transition["previousPB"])+" → "+format_score(kind,best["score"])
            if improvement is not None: line_text+=" ("+f'{improvement*100:+.1f}%'+")"
            fit(lx+30,1172,line_text,1040,25,"cyan",True)
        else:
            note(lx+30,1172,"No verified returning-player line PB in this event",1040)
        if model["placementPBs"]:
            best_rank=model["placementPBs"][0]
            rank_text="Finish-place PB: "+display_name(best_rank.get("player",""))+" · "+format_finish(best_rank.get("previousRank"))+" → "+format_finish(best_rank.get("newRank"))
            if best_rank.get("previousDate"): rank_text+=" · prior "+best_rank["previousDate"][5:]
            fit(lx+30,1228,rank_text,1040,24,"purple",True)
        else:
            note(lx+30,1228,"No verified qualifying finishing-place PB improvement",1040)
        note(lx+30,1300,str(len(model["firstTracked"]))+" first tracked entries · original finishing ranks are independent of line scores",1040)
    elif kind=="kraken":
        txt(lx+30,1114,"EFFORT & REWARDS",34,"fg",True)
        note(lx+30,1170,"Damage and Sparks use separately sourced values",1000)
        note(lx+30,1220,"Estimated or missing payouts stay labeled as such",1000)
        note(lx+30,1270,"No Kraken Stars or mixed-unit Sparks/Effort",1000)
    else:
        txt(lx+30,1114,"EFFORT & REWARDS",34,"fg",True)
        threshold=3500 if kind=="piggy" else 1
        note(lx+30,1170,"Lowest known Sparks per line · "+("at least 3,500 lines" if kind=="piggy" else "positive Flash results"),1000)
        shouts=sorted((r for r in model["rows"] if r["sparks"] is not None
                        and r["score"] is not None and r["score"] >= threshold),
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
    if automatic_piggy_layout and kind=="piggy":
        txt(rx+30,1113,"MILESTONES & AVG LINES TREND",29,"fg",True)
        growth=model.get("weekToWeekGrowthPercent")
        growth_text=("Total lines vs prior final Piggy: "+f'{growth:+.1f}%' if growth is not None
                     else "Total lines vs prior final Piggy: no comparable prior event")
        fit(rx+30,1145,growth_text+" · last five final events",1080,18,"muted")
        milestones=model.get("milestones",[])
        per_row=5
        for i,m in enumerate(milestones):
            col=i%per_row; row=i//per_row
            x=rx+30+col*218; y=1168+row*39
            is_record=bool(m.get("record"))
            fill=PALETTE["yellow"] if is_record else PALETTE["alternate"]
            dr.rounded_rectangle((x,y,x+206,y+34),8,fill=fill)
            color="bg" if is_record else "fg"
            label=(format_number(m["threshold"]/1000,0)+"K+  ·  "+str(m["count"]))
            fit(x+10,y+7,label,185,18,color,True)
        trend=model.get("averageTrend",[])
        chart_top=min(1322,1170+max(1,(len(milestones)+per_row-1)//per_row)*39+7)
        chart_bottom=chart_top+22
        if trend:
            values=[float(p["average"]) for p in trend]
            low=min(values); high=max(values)
            span=high-low or 1.0
            x_left=rx+260; x_right=rx+1000
            points=[]
            for i,item in enumerate(trend):
                x=x_left+(x_right-x_left)*(i/(len(trend)-1) if len(trend)>1 else 0.5)
                y=chart_bottom-((float(item["average"])-low)/span)*18
                points.append((int(x),int(y)))
            if len(points)>1: dr.line(points,fill=PALETTE["magenta"],width=4)
            for x,y in points: dr.ellipse((x-4,y-4,x+4,y+4),fill=PALETTE["magenta"])
            fit(rx+30,chart_top-4,"AVG LINES / PLAYER",220,15,"muted",True)
            last=trend[-1]
            txt(rx+1090,chart_top-4,format_number(last["average"],1)+" avg",18,"magenta",True,"ra")
        else:
            note(rx+30,chart_top,"No comparable final-event average trend in accepted history",1000)
        txt(rx+30,1345,"GOLD = CLAN RECORD OR TIED RECORD",17,"yellow",True)
    else:
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
    if automatic_piggy_layout and automatic_piggy_publish:
        footer=(f'{state} · {model["participantRows"]} recorded rows · '
                f'{model["unknownSparkRows"]} missing Sparks · FINAL SOURCE-VERIFIED REPORT')
    else:
        footer=(f'{state} · {model["participantRows"]} recorded rows · '
                f'{model["unknownSparkRows"]} missing Sparks · preview only · NOT POSTED')
    fit(45,1410,footer,2300,22,"muted")
    fit(45,1450,"Event "+model["eventId"]+" · source projection "+model["projectionVersion"][:16],
        1900,20,"muted")
    txt(2355,1445,"AVENGERS STAT CENTER",24,"cyan",True,"ra")
    image.save(dest, format="PNG", optimize=False)


def format_finish(place):
    n = numeric(place)
    if n is None or int(n) != n or n <= 0:
        return "—"
    n = int(n)
    suffix = "th" if 10 <= n % 100 <= 20 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


def render(release, kind, clan, event_id, output, automatic_piggy_layout=False, automatic_piggy_publish=False):
    if automatic_piggy_publish and not automatic_piggy_layout:
        raise ValueError("Final Piggy report state requires the dedicated v2 layout")
    if automatic_piggy_layout and kind != "piggy":
        raise ValueError("Automatic Piggy layout is only available for Piggy Race")
    model=resolve_summary(release,kind,clan,event_id)
    dest=Path(output)
    if dest.suffix.lower()!=".png":raise ValueError("Output path must end with .png")
    if not dest.parent.exists():raise ValueError("Output folder must already exist")
    draw_png(model,dest,automatic_piggy_layout=automatic_piggy_layout,automatic_piggy_publish=automatic_piggy_publish)
    result={
        "eventId":model["eventId"],"date":model["date"],"clan":clan,"kind":kind,
        "projectionVersion":model["projectionVersion"],
        "templateVersion":("piggy-auto-v2-20261021" if automatic_piggy_layout else
                           {"piggy":"piggy-temp-v1-20261016","flash":"flash-temp-v1-20261016",
                            "kraken":"kraken-temp-v1-20261016"}[kind]),
        "knownScoreSum":model["knownScoreSum"],"knownStars":model["knownStars"],
        "knownSparks":model["knownSparks"],
        "imageSHA256":hashlib.sha256(dest.read_bytes()).hexdigest(),
        "participants":model["participantRows"],"pbs":len(model["pbs"]),
        "linePBs":len(model["pbs"]),"placementPBs":len(model["placementPBs"]),
        "firstTracked":len(model["firstTracked"]),
        "rakePercentDisplayedShareSum":model["rakePercentDisplayedShareSum"],
        "displayedPotStars":model["displayedPotStars"],
        "weekToWeekGrowthPercent":model["weekToWeekGrowthPercent"],
        "averageTrend":model["averageTrend"],"milestones":model["milestones"],
        "topThreeCareer":[{"player":r["player"],"careerPodiums":r.get("careerPodiums")} for r in model["rows"][:3]],
        "unknownSparkRows":model["unknownSparkRows"],
        "unknownStarRows":model["unknownStarRows"],
        "eventStatus":model["status"],
        "previewOnly":not (automatic_piggy_layout and automatic_piggy_publish),
        "readyToPost":bool(automatic_piggy_layout and automatic_piggy_publish),
        "discordPostingEnabled":bool(automatic_piggy_layout and automatic_piggy_publish),
        "approvedSourceOnly":True,
        "disclaimer":("Final report generated from the accepted canonical source; dispatch is separately gated." if automatic_piggy_layout and automatic_piggy_publish else "Graphic generated for human review; no automated send or source changes."),
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
    parser.add_argument("--automatic-piggy-layout",action="store_true",
                        help="Render the separate Big Piggy v2 template")
    parser.add_argument("--automatic-piggy-publish",action="store_true",
                        help="Render the final, source-verified form; only the guarded dispatcher may send it")
    args=parser.parse_args()
    release=json.loads(Path(args.release).read_text(encoding="utf-8"))
    print(json.dumps(render(release,args.kind,args.clan,args.event_id,args.output,
                            automatic_piggy_layout=args.automatic_piggy_layout,
                            automatic_piggy_publish=args.automatic_piggy_publish),sort_keys=True))


if __name__=="__main__":
    main()
