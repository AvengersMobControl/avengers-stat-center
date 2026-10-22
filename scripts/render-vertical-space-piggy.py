#!/usr/bin/env python3
"""Source-backed, vertically reflowing review layouts for Space and Big Piggy.

The existing approved renderers remain unchanged. These are REVIEW PREVIEWS:
never set readyToPost, and do not claim a generated graphic has approved artwork.

Usage:
  python scripts/render-vertical-space-piggy.py reports/summary.json reports/space.png \
    --kind space --clan AVENGERS --event-id 'space|2026-10-16'
  python scripts/render-vertical-space-piggy.py reports/summary.json reports/piggy.png \
    --kind piggy --clan AV-2 --event-id 'piggy|2026-10-18'
"""
import argparse
import datetime as dt
import hashlib
import importlib.util
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
WIDTH = 1440
MARGIN = 54
GAP = 18
COLORS = {
    "bg": "#061528", "panel": "#0e233c", "stripe": "#12314e",
    "line": "#2b628e", "fg": "#eef6ff", "muted": "#a7bdd4",
    "cyan": "#1bdcf1", "purple": "#9a6bff", "green": "#36e7b5",
    "gold": "#ffe46d", "magenta": "#ff68da", "red": "#ff7878",
}
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def number(value):
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) else None


def score_text(v, kind):
    if number(v) is None:
        return "UNKNOWN"
    return f"{v:,.1f}B" if kind == "space" else f"{v:,.0f}"


def quantity(v):
    return f"{v:,.0f}" if number(v) is not None else "UNKNOWN"


def date_text(date):
    return dt.date.fromisoformat(date).strftime("%b %d, %Y").replace(" 0", " ")


def name_text(name):
    return name[3:] if isinstance(name, str) and name.startswith("AV-") else str(name or "UNASSIGNED")


def match_date(hist, event_id):
    return next((e.get("date") for e in hist if e.get("id") == event_id), None)


def build_space(release, clan, event_id):
    projection = release["projection"]
    all_events = sorted((e for e in projection["events"] if e.get("kind") == "space" and e.get("status") != "revoked"),
                        key=lambda e: (e["date"], e["id"]))
    eligible = [e for e in all_events if e.get("status") in ("partial", "final") and any(r.get("clan") == clan for r in e.get("rows", []))]
    if event_id:
        eligible = [e for e in eligible if e.get("id") == event_id]
    if not eligible:
        raise ValueError("Selected clan/event has no Space results")
    e = eligible[-1]
    if e.get("unit") != "billion-lightyears":
        raise ValueError("Expected Space scores in billion-lightyears")
    raw = [r for r in e.get("rows", []) if r.get("clan") == clan and number(r.get("score")) is not None]
    rows = sorted(raw, key=lambda r: (-r["score"], str(r.get("player") or "")))
    if not rows:
        raise ValueError("No source-backed Space scores")
    prior = next((p for p in reversed(all_events) if p.get("status") == "final" and (p["date"],p["id"]) < (e["date"],e["id"])
                  and any(r.get("clan") == clan and number(r.get("score")) is not None for r in p.get("rows", []))), None)
    prior_rows = [r for r in prior.get("rows",[]) if r.get("clan") == clan and number(r.get("score")) is not None] if prior else []
    people = {p["name"]:p for p in projection.get("people",[])}
    pbs, first = [], []
    for row in rows:
        player = row.get("player")
        transitions = people.get(player,{}).get("kinds",{}).get("space",{}).get("pbs",[])
        trans = next((t for t in transitions if t.get("eventId") == e["id"] and number(t.get("score")) == row["score"]),None)
        if not trans:
            continue
        item = {"player":player,"score":row["score"],"previous":number(trans.get("previousPB")),
                "previousDate":trans.get("previousDate"),"improvement":number(trans.get("improvement"))}
        if trans.get("firstRecorded"):
            first.append(item)
        elif trans.get("newPB") and item["previous"] is not None:
            pbs.append(item)
    pbs.sort(key=lambda x: (-(x["improvement"] or 0),x["player"] or ""))
    first.sort(key=lambda x: -x["score"])
    complete = e.get("status") == "final" and e.get("metadata",{}).get("complete") is True and e.get("metadata",{}).get("coverageComplete") is True
    known_stars = [r["stars"] for r in rows if number(r.get("stars")) is not None]
    known_sparks = [r["sparks"] for r in rows if number(r.get("sparks")) is not None]
    prior_total = sum(r["score"] for r in prior_rows) if prior_rows else None
    total = sum(r["score"] for r in rows)
    avg = total / len(rows)
    prior_avg = prior_total / len(prior_rows) if prior_rows else None
    effort = sorted((r for r in rows if r["score"]>=100 and number(r.get("sparks")) is not None),
                    key=lambda x:x["sparks"]/x["score"])[:3]
    return {
        "kind":"space","clan":clan,"date":e["date"],"eventId":e["id"],"status":e.get("status"),
        "projectionVersion":projection["version"],"coverageComplete":complete,
        "rows":rows,"pbs":pbs,"first":first,"effort":effort,
        "total":total,"average":avg,"participants":len(rows),
        "stars":sum(known_stars),"sparks":sum(known_sparks),
        "unknownStars":len(rows)-len(known_stars),"unknownSparks":len(rows)-len(known_sparks),
        "priorDate":prior.get("date") if prior else None,"priorTotal":prior_total,"priorAverage":prior_avg,
        "knownLobbyCount":len({str((r.get("metadata") or {}).get("group")) for r in rows if (r.get("metadata") or {}).get("group")}),
        "recordedAllClanRanksVerified":e.get("metadata",{}).get("verifiedAllLobbyClans",{}).get(clan) is True,
    }


def build_piggy(release, clan, event_id):
    spec=importlib.util.spec_from_file_location("big_piggy",ROOT/"scripts/render-big-piggy-auto.py")
    mod=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    m=mod.resolve_summary(release,"piggy",clan,event_id)
    e=next(e for e in release["projection"]["events"] if e["id"]==m["eventId"])
    m["coverageComplete"]=(e.get("status")=="final" and e.get("metadata",{}).get("complete") is True
                           and e.get("metadata",{}).get("coverageComplete") is True)
    source=(release.get("piggyBenchmarksByClan") or {}).get(clan,{})
    weekly=next((w for w in source.get("weekly",[]) if w.get("date")==m["date"]),None)
    tiers=[]
    for index,threshold in enumerate(source.get("thresholds",[])):
        count=(weekly.get("counts",[])[index] if weekly and index<len(weekly.get("counts",[])) else None)
        records=next((r for r in source.get("records",[]) if r.get("threshold")==threshold),{})
        is_record=(count is not None and count>0 and records.get("count")==count
                   and m["date"] in (records.get("tiedDates") or []))
        tiers.append({"threshold":threshold,"count":count,"record":is_record})
    m["benchmarkLadder"]=tiers
    return m


def make_model(release,kind,clan,event_id):
    if release.get("source")!="approved-event-ledger" or release.get("schemaVersion")!=1:
        raise ValueError("Only the accepted canonical summary export is supported")
    if len(str(release.get("projection",{}).get("version","")))<16:
        raise ValueError("Missing projection version")
    if clan not in ("AVENGERS","AV-2") or kind not in ("space","piggy"):
        raise ValueError("Unsupported kind or event-time clan")
    model=build_space(release,clan,event_id) if kind=="space" else build_piggy(release,clan,event_id)
    model["individualSpotlights"]=individual_spotlights(release,model)
    return model


def league_window(event_date):
    """Known site league cadence: 35-day leagues ending at a Kraken.

    The website's last certified completed anchor is October 11, 2026.
    For future windows the boundary is cadence-derived, not a separate
    claim that a future Kraken result has been received.
    """
    anchor=dt.date(2026,10,11)
    when=dt.date.fromisoformat(event_date)
    offset=math.ceil((when-anchor).days/35)
    end=anchor+dt.timedelta(days=35*offset)
    start=end-dt.timedelta(days=34)
    return start.isoformat(),end.isoformat(),offset>0


def individual_spotlights(release,model):
    kind=model["kind"]
    clan=model["clan"]
    event_date=model["date"]
    source=release["projection"].get("events",[])
    start,end,projected=league_window(event_date)
    spotlight={"start":start,"end":end,"projectedFutureBoundary":projected,
               "items":[],"abovePersonalAverageCount":0,"abovePersonalAverageEligible":0}
    rows=model["rows"]
    if rows:
        lead=rows[0]
        spotlight["items"].append({
            "label":"EVENT SCORE LEADER","player":lead["player"],
            "value":score_text(lead["score"],kind),
            "detail":"Highest recorded "+("distance" if kind=="space" else "line total")+" for this clan"})
    # Previous per-person same-kind/same-clan results only. Transfers must not
    # make an AV-2 result a historical AVENGERS personal average or vice versa.
    improvements=[]
    for current in rows:
        player=current.get("player")
        current_score=number(current.get("score"))
        if not player or current_score is None:
            continue
        historical=[r["score"] for e in source if e.get("kind")==kind
                    and e.get("status") in ("partial","final")
                    and (e["date"],e["id"])<(event_date,model["eventId"])
                    for r in e.get("rows",[])
                    if r.get("clan")==clan and r.get("player")==player
                    and number(r.get("score")) is not None and r.get("score")!=1]
        if not historical:
            continue
        baseline=sum(historical)/len(historical)
        spotlight["abovePersonalAverageEligible"]+=1
        if baseline>0 and current_score>baseline:
            spotlight["abovePersonalAverageCount"]+=1
            improvements.append((current_score/baseline-1,player,current_score,baseline,len(historical)))
    if improvements:
        change,player,value,baseline,prior_count=max(improvements,key=lambda x:(x[0],x[1]))
        spotlight["items"].append({
            "label":"ABOVE OWN PRIOR AVERAGE","player":player,
            "value":f"+{change*100:.1f}%",
            "detail":score_text(value,kind)+" now vs "+score_text(baseline,kind)+
                     f" prior average ({prior_count} logged earlier)"})
    # Across event types for the current five-week clan league, as recorded in
    # the accepted projection. It is a tracked/known total, not a complete
    # event-coverage or payout assertion.
    reward_by_player={}
    league_missing={}
    for e in source:
        if e.get("status") not in ("partial","final") or not (start<=e.get("date","")<=event_date):
            continue
        for r in e.get("rows",[]):
            if r.get("clan")!=clan or not r.get("player") or r.get("score")==1:
                continue
            player=r["player"]
            sparks=number(r.get("sparks"))
            if sparks is None:
                league_missing[player]=league_missing.get(player,0)+1
            else:
                reward_by_player[player]=reward_by_player.get(player,0)+sparks
    if reward_by_player:
        leader=max(reward_by_player.items(),key=lambda x:(x[1],x[0]))
        missing=league_missing.get(leader[0],0)
        spotlight["items"].append({
            "label":"TRACKED CLAN-LEAGUE SPARKS LEADER","player":leader[0],
            "value":quantity(leader[1]),
            "detail":"Known Sparks in this five-week league to date"+
                     (f" • {missing} missing reward rows" if missing else "")})
    spotlight["items"]=spotlight["items"][:4]
    return spotlight


def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else FONT,size)


class Poster:
    def __init__(self, w=WIDTH):
        self.w=w
        self.blocks=[]
        self.y=0

    def add(self,title,height,draw_fn,accent="cyan"):
        self.blocks.append((title,self.y,height,draw_fn,accent))
        self.y += height + GAP

    def draw(self,model):
        height=self.y+46
        im=Image.new("RGB",(self.w,height),COLORS["bg"])
        d=ImageDraw.Draw(im)
        for j in range(0,height,175):
            d.arc((-390,j-450,800,j+790),220,70,fill="#0d3752",width=2)
        for title,y,h,fn,accent in self.blocks:
            d.rounded_rectangle((MARGIN,y,self.w-MARGIN,y+h),radius=24,
                                fill=COLORS["panel"],outline=COLORS["line"],width=2)
            d.rounded_rectangle((MARGIN,y,MARGIN+8,y+h),radius=4,fill=COLORS[accent])
            fn(d,y,h)
        return im


def draw_text(d,x,y,s,size=28,color="fg",bold=False,anchor=None):
    d.text((x,y),str(s),font=font(size,bold),fill=COLORS.get(color,color),anchor=anchor)


def fitted(d,x,y,s,maxwidth,size=29,color="fg",bold=False):
    txt=str(s)
    while size>=18 and d.textlength(txt,font=font(size,bold))>maxwidth:
        size-=1
    if d.textlength(txt,font=font(size,bold))>maxwidth:
        raise ValueError("Poster text cannot fit without clipping: "+txt)
    draw_text(d,x,y,txt,size,color,bold)


def pct(value,prior):
    if number(value) is None or number(prior) is None or prior==0:
        return "NO COMPARABLE PRIOR"
    return f"{(value/prior-1)*100:+.1f}%"


def section_heading(d,y,label,count=None,accent="cyan"):
    draw_text(d,MARGIN+35,y+25,label,36,accent,True)
    if count is not None:
        draw_text(d,WIDTH-MARGIN-33,y+36,str(count),22,"muted",True,"ra")


def add_header(p,m):
    def paint(d,y,h):
        draw_text(d,MARGIN+35,y+24,m["clan"]+"  /  STAT CENTER",25,"cyan",True)
        draw_text(d,MARGIN+35,y+73,("SPACE RACE" if m["kind"]=="space" else "PIGGY RACE")+"  RESULTS",60,"fg",True)
        draw_text(d,MARGIN+38,y+150,date_text(m["date"]).upper()+"  •  "+m["eventId"],25,"muted")
        draw_text(d,WIDTH-MARGIN-35,y+34,"REVIEW • NOT POSTED",25,"gold",True,"ra")
        state="VERIFIED FULL COVERAGE" if m["coverageComplete"] else "SOURCE COVERAGE UNVERIFIED"
        draw_text(d,WIDTH-MARGIN-35,y+153,state,21,"green" if m["coverageComplete"] else "red",True,"ra")
    p.add("",206,paint)


def add_hero(p,m):
    if m["kind"]=="space":
        cards=[("TOTAL DISTANCE",score_text(m["total"],"space"),f"{m['participants']} scored members"),
               ("AVERAGE / MEMBER",score_text(m["average"],"space"),"Known participants only"),
               ("KNOWN STARS",quantity(m["stars"]),f"{m['unknownStars']} reward rows unknown"),
               ("KNOWN SPARKS",quantity(m["sparks"]),f"{m['unknownSparks']} reward rows unknown")]
    else:
        n=m["knownScoreCount"]
        cards=[("TOTAL LINES",score_text(m["knownScoreSum"],"piggy"),f"{n} scored participants"),
               ("AVERAGE / MEMBER",score_text(m["knownScoreSum"]/n if n else None,"piggy"),"One-line placeholders excluded"),
               ("CLAN EARNED STARS",quantity(m["knownStars"]),f"Whole-lobby pot: {m.get('displayedPotStars') or 'UNKNOWN'}"),
               ("KNOWN SPARKS",quantity(m["knownSparks"]),f"{m['unknownSparkRows']} reward rows unknown")]
    def paint(d,y,h):
        left=MARGIN+30
        cw=(WIDTH-2*MARGIN-84)//2
        for idx,(label,value,sub) in enumerate(cards):
            x=left+(idx%2)*(cw+24)
            cy=y+23+(idx//2)*169
            d.rounded_rectangle((x,cy,x+cw,cy+147),radius=14,fill=COLORS["stripe"])
            draw_text(d,x+23,cy+16,label,22,"muted",True)
            fitted(d,x+23,cy+48,value,cw-46,47,"fg",True)
            fitted(d,x+23,cy+116,sub,cw-46,19,"cyan")
    p.add("",371,paint,"purple")


def add_trends(p,m):
    if m["kind"]=="space":
        total=m["total"]; avg=m["average"]; pt=m["priorTotal"]; pa=m["priorAverage"]; label="DISTANCE"
        series=None
    else:
        total=m["knownScoreSum"];avg=total/m["knownScoreCount"] if m["knownScoreCount"] else None
        pt=m["previousScoreSum"];pa=pt/m["previousKnownCount"] if m["previousKnownCount"] else None
        label="LINES";series=m["averageTrend"]
    def paint(d,y,h):
        section_heading(d,y,"CHANGE VS PRIOR EVENT",None,"magenta")
        draw_text(d,MARGIN+38,y+88,label+" TOTAL",22,"muted",True)
        draw_text(d,MARGIN+550,y+83,pct(total,pt),33,"green" if pt and total>=pt else "red" if pt else "muted",True,"ra")
        draw_text(d,MARGIN+725,y+88,"AVG / MEMBER",22,"muted",True)
        draw_text(d,WIDTH-MARGIN-39,y+83,pct(avg,pa),33,"green" if pa and avg>=pa else "red" if pa else "muted",True,"ra")
        prior=m.get("priorDate") or m.get("previousLabel") or "NO EARLIER ACCEPTED EVENT"
        draw_text(d,MARGIN+38,y+146,"Compared with "+str(prior),21,"muted")
        if series:
            line="LAST "+str(len(series))+" AVG: "+"  /  ".join(score_text(v["average"],"piggy") for v in series)
            fitted(d,MARGIN+38,y+182,line,WIDTH-2*MARGIN-78,19,"cyan")
    p.add("",225 if series else 192,paint)


def add_top_ten(p,m):
    rows=m["rows"][:10]
    rh=68 if m["kind"]=="space" else 65
    title=("TOP 10 — DISTANCE (CLAN SORT)" if m["kind"]=="space" else "TOP 10 — LINES (CLAN SORT)")
    h=117+len(rows)*rh+40
    def paint(d,y,h):
        section_heading(d,y,title,str(len(rows))+" displayed")
        top=y+101
        for i,r in enumerate(rows):
            ry=top+i*rh
            if i%2==0:
                d.rounded_rectangle((MARGIN+25,ry-5,WIDTH-MARGIN-25,ry+rh-9),radius=10,fill=COLORS["stripe"])
            player=r.get("player")
            fitted(d,MARGIN+42,ry+7,f"{i+1:>2}.  {name_text(player)}",465,27,"gold" if i==0 else "fg",True)
            if m["kind"]=="space":
                value=score_text(r.get("score"),"space")
                stars=quantity(r.get("stars"))
                sparks=quantity(r.get("sparks"))
                share=number((r.get("metadata") or {}).get("share"))
                label=f"STARS {stars}  |  SPARKS {sparks}  |  SHARE {share*100:.1f}%" if share is not None else f"STARS {stars}  |  SPARKS {sparks}  |  SHARE UNKNOWN"
                fitted(d,MARGIN+590,ry+5,label,610,20,"muted")
                draw_text(d,WIDTH-MARGIN-38,ry+23,value,30,"cyan",True,"ra")
            else:
                draw_text(d,WIDTH-MARGIN-38,ry+18,score_text(r.get("score"),"piggy")+" LINES",30,"cyan",True,"ra")
                source_rank=(r.get("metadata") or {}).get("rank")
                if source_rank is not None:
                    draw_text(d,MARGIN+500,ry+19,"Source finish #"+str(source_rank),19,"muted")
        draw_text(d,MARGIN+39,y+h-44,"This is a score-sorted clan list, NOT a claim of original game finishing positions.",19,"muted")
    p.add(title,h,paint)


def add_spotlights(p,m):
    data=m["individualSpotlights"]
    items=data["items"]
    rh=101
    h=174+max(1,len(items))*rh+45
    def paint(d,y,h):
        section_heading(d,y,"INDIVIDUAL PERFORMANCE SPOTLIGHTS",m["clan"],"magenta")
        period=f"CLAN LEAGUE {data['start']} TO {data['end']} • event-time clan only"
        if data["projectedFutureBoundary"]:
            period+=" • cycle boundary from 35-day cadence"
        fitted(d,MARGIN+39,y+75,period,WIDTH-2*MARGIN-80,21,"muted")
        for i,item in enumerate(items):
            ry=y+130+i*rh
            if i%2==0:
                d.rounded_rectangle((MARGIN+26,ry-9,WIDTH-MARGIN-26,ry+rh-15),radius=12,fill=COLORS["stripe"])
            draw_text(d,MARGIN+40,ry,item["label"],20,"purple",True)
            fitted(d,MARGIN+40,ry+29,name_text(item["player"]),525,31,"fg",True)
            draw_text(d,WIDTH-MARGIN-42,ry+29,item["value"],32,"gold",True,"ra")
            fitted(d,MARGIN+650,ry+72,item["detail"],610,19,"muted")
        if not items:
            draw_text(d,MARGIN+39,y+139,"No individually verifiable performance callouts.",24,"muted")
        count=data["abovePersonalAverageCount"]
        eligible=data["abovePersonalAverageEligible"]
        draw_text(d,MARGIN+39,y+h-44,
                  f"{count}/{eligible} returning players beat their recorded earlier same-clan {m['kind']} average",
                  20,"cyan")
    p.add("INDIVIDUAL SPOTLIGHTS",h,paint,"magenta")


def add_pbs(p,m):
    rows=m["pbs"]
    rh=68
    h=125+max(1,len(rows))*rh+28
    title=("DISTANCE PERSONAL BESTS" if m["kind"]=="space" else "LINE PERSONAL BESTS")
    def paint(d,y,h):
        section_heading(d,y,title,str(len(rows))+" returning-player improvements","green")
        for i,r in enumerate(rows):
            ry=y+106+i*rh
            if i%2==0:
                d.rounded_rectangle((MARGIN+25,ry-7,WIDTH-MARGIN-25,ry+rh-11),radius=10,fill=COLORS["stripe"])
            prior=r.get("previous") if m["kind"]=="space" else number((r.get("transition") or {}).get("previousPB"))
            current=r["score"]
            previous_date=r.get("previousDate") if m["kind"]=="space" else (r.get("transition") or {}).get("previousDate")
            growth=r.get("improvement") if m["kind"]=="space" else number((r.get("transition") or {}).get("improvement"))
            fitted(d,MARGIN+40,ry+5,name_text(r["player"]),400,27,"fg",True)
            draw_text(d,MARGIN+460,ry+4,score_text(prior,m["kind"])+"  →  "+score_text(current,m["kind"]),27,"cyan",True)
            if growth is not None:
                draw_text(d,WIDTH-MARGIN-45,ry+3,f"+{growth*100:.1f}%",27,"green",True,"ra")
            draw_text(d,MARGIN+465,ry+38,"Previous PB: "+str(previous_date or "date not recorded"),19,"muted")
        if not rows:
            draw_text(d,MARGIN+40,y+112,"No verified returning-player improvements recorded for this event.",25,"muted")
    p.add(title,h,paint,"green")


def add_placement(p,m):
    rows=m["placementPBs"]
    rh=64;h=128+max(1,len(rows))*rh+28
    def paint(d,y,h):
        t="30+ AVENGERS IN SAME LOBBY" if m["clan"]=="AVENGERS" else "5+ AV-2 IN SAME LOBBY"
        section_heading(d,y,"ORIGINAL FINISH-PLACE PBs",str(len(rows))+" verified","purple")
        draw_text(d,MARGIN+40,y+75,"Eligibility: "+t+"; independent of lines",20,"muted")
        for i,r in enumerate(rows):
            ry=y+116+i*rh
            if i%2==0:d.rounded_rectangle((MARGIN+25,ry-5,WIDTH-MARGIN-25,ry+rh-8),radius=10,fill=COLORS["stripe"])
            fitted(d,MARGIN+42,ry+5,name_text(r.get("player")),450,28,"fg",True)
            prior="#"+str(r["previousRank"])
            curr="#"+str(r["newRank"])
            draw_text(d,MARGIN+525,ry+4,prior+"  →  "+curr,31,"cyan",True)
            draw_text(d,WIDTH-MARGIN-42,ry+11,"Prior: "+str(r.get("previousDate") or "date not recorded"),21,"muted",False,"ra")
        if not rows:draw_text(d,MARGIN+42,y+117,"No verified qualifying finishing-place PB improvements.",25,"muted")
    p.add("ORIGINAL FINISH-PLACE PBs",h,paint,"purple")


def add_first(p,m):
    rows=m["first"] if m["kind"]=="space" else m["firstTracked"]
    rh=57;h=111+max(1,len(rows))*rh+30
    title="FIRST TRACKED SPACE RESULTS" if m["kind"]=="space" else "FIRST TRACKED PIGGY RESULTS"
    def paint(d,y,h):
        section_heading(d,y,title,str(len(rows))+" first entries")
        for i,r in enumerate(rows):
            ry=y+101+i*rh
            if i%2==0:d.rounded_rectangle((MARGIN+25,ry-4,WIDTH-MARGIN-25,ry+rh-8),radius=10,fill=COLORS["stripe"])
            fitted(d,MARGIN+40,ry+6,name_text(r["player"]),720,26,"fg",True)
            draw_text(d,WIDTH-MARGIN-42,ry+8,score_text(r["score"],m["kind"]),27,"cyan",True,"ra")
        if not rows:draw_text(d,MARGIN+42,y+105,"No first tracked participants identified from the current accepted history.",23,"muted")
    p.add(title,h,paint)


def add_space_effort(p,m):
    rows=m["effort"];rh=61;h=150+max(1,len(rows))*rh+23
    def paint(d,y,h):
        section_heading(d,y,"EFFORT WORTH A SHOUTOUT",str(len(rows))+" recognized","purple")
        draw_text(d,MARGIN+39,y+79,"Lowest known Sparks per billion LY • at least 100B recorded",22,"muted")
        for i,r in enumerate(rows):
            ry=y+130+i*rh
            if i%2==0:d.rounded_rectangle((MARGIN+25,ry-5,WIDTH-MARGIN-25,ry+rh-8),radius=10,fill=COLORS["stripe"])
            fitted(d,MARGIN+40,ry+5,name_text(r["player"]),570,27,"fg",True)
            draw_text(d,MARGIN+650,ry+5,score_text(r["score"],"space"),28,"cyan",True)
            draw_text(d,WIDTH-MARGIN-38,ry+5,f"{r['sparks']/r['score']:,.1f} Sp/B",28,"gold",True,"ra")
        if not rows:draw_text(d,MARGIN+42,y+130,"Not enough known reward/distance pairs for this recognition.",24,"muted")
    p.add("EFFORT",h,paint,"purple")


def add_benchmarks(p,m):
    tiers=m["benchmarkLadder"]
    rh=61;h=128+max(1,len(tiers))*rh+57
    def paint(d,y,h):
        section_heading(d,y,"BENCHMARK ACHIEVEMENTS",str(sum(t["count"] is not None and t["count"]>0 for t in tiers))+" tiers reached","gold")
        for i,r in enumerate(tiers):
            ry=y+107+i*rh
            if i%2==0:d.rounded_rectangle((MARGIN+25,ry-5,WIDTH-MARGIN-25,ry+rh-8),radius=10,fill=COLORS["stripe"])
            col="gold" if r["record"] else "fg"
            draw_text(d,MARGIN+43,ry+5,f"{r['threshold']/1000:g}K+ LINES",29,col,True)
            draw_text(d,MARGIN+525,ry+5,(str(r["count"])+" MEMBERS" if r["count"] is not None else "UNKNOWN COVERAGE"),29,col,True)
            if r["record"]:draw_text(d,WIDTH-MARGIN-44,ry+7,"CLAN RECORD / TIED",25,"gold",True,"ra")
        if not tiers:draw_text(d,MARGIN+40,y+110,"No benchmark thresholds attained in this recorded event.",23,"muted")
        draw_text(d,MARGIN+40,y+h-47,"GOLD = CLAN RECORD OR TIED RECORD",22,"gold",True)
    p.add("BENCHMARKS",h,paint,"gold")


def add_piggy_rake(p,m):
    if m["clan"]!="AV-2":
        return
    rake=m.get("rakePercentDisplayedShareSum")
    pot=m.get("displayedPotStars")
    def paint(d,y,h):
        section_heading(d,y,"AV-2 SHARE OF POT","Display-share sum","magenta")
        draw_text(d,MARGIN+40,y+86,(f"{rake:.1f}%" if rake is not None else "UNKNOWN"),56,"magenta",True)
        draw_text(d,MARGIN+440,y+105,"Whole-lobby displayed pot: "+str(pot or "UNKNOWN"),28,"fg",True)
        draw_text(d,MARGIN+40,y+172,"All AV-2 rows in this lobby; this is NOT a derived Stars / pot calculation.",21,"muted")
    p.add("AV-2 RAKE",213,paint,"magenta")


def add_footer(p,m):
    def paint(d,y,h):
        draw_text(d,MARGIN+35,y+22,"SOURCE-LOCKED REVIEW  •  NO DISCORD POST",23,"gold",True)
        fitted(d,MARGIN+35,y+66,"Projection "+m["projectionVersion"]+"  •  "+m["eventId"],WIDTH-2*MARGIN-80,19,"muted")
        if m["kind"]=="space":
            note="Clan ranks shown here are by recorded distance; source-game ranks require separate original-lobby proof."
        else:
            note="One-line placeholders excluded • source-game finish ranks are separate from score order."
        fitted(d,MARGIN+35,y+104,note,WIDTH-2*MARGIN-80,20,"muted")
        draw_text(d,MARGIN+35,y+144,"Original approved character art must be integrated before template approval.",19,"cyan")
    p.add("FOOTER",194,paint)


def build_poster(model):
    p=Poster()
    add_header(p,model)
    add_hero(p,model)
    if model["kind"]=="piggy" and model["clan"]=="AV-2":add_piggy_rake(p,model)
    add_trends(p,model)
    add_spotlights(p,model)
    add_top_ten(p,model)
    add_pbs(p,model)
    if model["kind"]=="piggy":add_placement(p,model)
    add_first(p,model)
    if model["kind"]=="piggy":add_benchmarks(p,model)
    else:add_space_effort(p,model)
    add_footer(p,model)
    return p.draw(model)


def render(release,kind,clan,event_id,dest):
    model=make_model(release,kind,clan,event_id)
    dest=Path(dest)
    if dest.suffix.lower()!=".png" or not dest.parent.exists():
        raise ValueError("Output must be a PNG in an existing directory")
    image=build_poster(model)
    image.save(dest)
    record={"kind":kind,"clan":clan,"eventId":model["eventId"],
            "projectionVersion":model["projectionVersion"],
            "imageSHA256":hashlib.sha256(dest.read_bytes()).hexdigest(),
            "dimensions":list(image.size),"participants":model.get("participants",model.get("participantRows")),
            "pbs":len(model["pbs"]),"firstTracked":len(model.get("first",model.get("firstTracked",[]))),
            "individualSpotlights":model["individualSpotlights"],
            "coverageComplete":model["coverageComplete"],
            "templateVersion":"vertical-space-piggy-review-v1-20261022",
            "originalCharacterAssetsIncluded":False,
            "previewOnly":True,"readyToPost":False,"discordPostingEnabled":False}
    dest.with_suffix(".json").write_text(json.dumps(record,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    return record


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("release")
    parser.add_argument("output")
    parser.add_argument("--kind",choices=("space","piggy"),required=True)
    parser.add_argument("--clan",choices=("AVENGERS","AV-2"),required=True)
    parser.add_argument("--event-id",default=None)
    args=parser.parse_args()
    release=json.loads(Path(args.release).read_text(encoding="utf-8"))
    print(json.dumps(render(release,args.kind,args.clan,args.event_id,args.output),sort_keys=True))


if __name__=="__main__":
    main()
