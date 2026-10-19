#!/usr/bin/env python3
"""Manual-review weekly composite: deterministic text from approved frozen JSON,
with EXACT user-supplied character originals and SHA-256 integrity checks.
NEVER posts messages, sends Discord pings or authorizes dispatch.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W, H = 2400, 1690
ART = {
 "spider": ("AV_ExplodonSpider.png", "ce7b4b92672c6a0d3793e360435495bae9ca9fcd5b57d9be0290b8ccda6c0124"),
 "terrorist": ("AV_ExplodonTerrorist.png", "aef1372bf0e47ecd98332858a3c3e2952c2298b2716498bbe8a08f514eb7a7bb"),
 "kaboom": ("AV_KaboomStar(1).png", "d62e3e739892e346a9bb4f4fd8d1507bc89ac92369a44ba6ebdcec505f570fb5"),
 "raccoon": ("AV_RaccoonRocket(1).png", "f7ffeb1a091b488bb84e5b868bdbc3975e856997e63d0225dd21d75142909ac8"),
}
C = {"bg":"#061322", "panel":"#0c223a", "panel2":"#102e4a",
     "border":"#2a587b", "white":"#f0f7ff", "muted":"#a2b7d1",
     "cyan":"#1cdbf1", "magenta":"#b980ff", "gold":"#ffdc67",
     "green":"#45e5aa", "red":"#ff7994"}

def known(data):
    if data.get("source")!="approved-event-ledger" or data.get("schemaVersion")!=1 or data.get("reviewType")!="weekly-three-event-recap":
        raise ValueError("Only a canonical approved-ledger weekly-review model can be rendered")
    if not data.get("projectionVersion") or len(data["projectionVersion"])<32:raise ValueError("Missing immutable source version")
    for k in ["readyToPost","discordPostingEnabled","autoDispatchEnabled"]:
        if data.get(k) is not False:raise ValueError("Posting safety hold "+k+" must be false")
    if data.get("clan") not in ["AVENGERS","AV-2"]:raise ValueError("Unapproved clan")
    if len(data.get("events",[]))!=6:raise ValueError("Require all six explicit event slots (missing slots shown as unknown)")
    if not isinstance(data.get("warnings"),list):raise ValueError("Missing source coverage review notes")
    return data

def art(dirpath):
    root=Path(dirpath)
    images={}
    for name,(file,expected) in ART.items():
        p=root/file
        if not p.is_file():raise FileNotFoundError("Original approved Library PNG required: "+str(p))
        b=p.read_bytes()
        if hashlib.sha256(b).hexdigest()!=expected:raise ValueError("Unapproved/substituted artwork: "+file)
        images[name]=Image.open(p).convert("RGBA")
    return images

def compose(data,images):
    known(data)
    if set(images)!=set(ART):raise ValueError("All four original approved characters required")
    im=Image.new("RGB",(W,H),C["bg"]);d=ImageDraw.Draw(im)
    reg="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    bold="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    def font(size,heavy=False):
        return ImageFont.truetype(bold if heavy else reg,size)
    def txt(x,y,s,size=28,color="white",heavy=False,limit=None):
        text=str(s)
        if color in C:color=C[color]
        f=font(size,heavy)
        if limit is not None:
            while d.textlength(text,font=f)>limit and size>16:size-=1;f=font(size,heavy)
            if d.textlength(text,font=f)>limit:
                while text and d.textlength(text+"…",font=f)>limit:text=text[:-1]
                text+="…"
        d.text((x,y),text,font=f,fill=color)
    def right(x,y,s,size=28,color="white",heavy=False):
        t=str(s);x-=d.textlength(t,font=font(size,heavy));txt(x,y,t,size,color,heavy)
    def panel(x1,y1,x2,y2,label=None,outline="border"):
        d.rounded_rectangle((x1,y1,x2,y2),radius=22,fill=C["panel"],outline=C[outline],width=2)
        if label:txt(x1+28,y1+16,label,28,"cyan",True)
    def num(n):return f"{n:,.0f}" if isinstance(n,(int,float)) else "—"
    def short(n):return f"{n/1e6:,.2f}M" if abs(n)>=1e6 else f"{n/1000:,.1f}K" if abs(n)>=1000 else num(n)
    def stage_image(name,x,y,height):
        artwork=images[name]
        bw=round(artwork.width*height/artwork.height)
        layer=artwork.resize((bw,height),Image.Resampling.LANCZOS)
        im.paste(layer,(x,y),layer)
    # Soft rounded geometry and small screened character portraits across the masthead.
    for i,(name,x) in enumerate([("spider",1370),("terrorist",1610),("kaboom",1850),("raccoon",2085)]):
        d.rounded_rectangle((x,25,x+208,190),14,fill="#112d49")
        stage_image(name,x+24,5,205)
    txt(56,32,data["clan"]+" // STAT CENTER",27,"cyan",True)
    txt(56,77,"WEEKLY EVENT RECAP",57,"white",True)
    txt(58,144,data["weekStart"]+"  →  "+data["weekEnd"],28,"muted")
    # Four opening anchors, no duplicate metric panels below.
    tiles=[("KNOWN SPARKS",short(data["totalKnownSparks"]),"flash rewards excluded after Kraken" if data["postKrakenNoSparkFlash"] else "approved, known awards"),
           ("EVENTS CAPTURED",str(data["eventCount"])+"/6","Space + PF1–PF4 + Piggy"),
           ("ABOVE PERSONAL AVG",str(data["aboveAverageTotal"])+"/"+str(data["benchmarkEligibleTotal"]),"with comparable prior history"),
           ("NEW MILESTONES",num(data["newMilestones"]),"Piggy and Space badges")]
    for i,(label,val,note) in enumerate(tiles):
        x=54+i*589;panel(x,218,x+568,398)
        d.rounded_rectangle((x+2,220,x+9,395),4,fill=C["cyan"] if i%2 else C["magenta"])
        txt(x+27,236,label,22,"muted",True)
        txt(x+27,269,val,53,"white",True)
        txt(x+28,359,note,19,"muted",limit=520)
    # Contributors: takes HALF width, unlike sparse prior design.
    panel(54,424,1219,985,"TOP FIVE SPARK CONTRIBUTORS")
    txt(86,468,"Confirmed known awards · summed across Space and Piggy",21,"muted")
    for i,person in enumerate(data["top5Sparks"][:5]):
        y=517+i*81
        if i%2==0:d.rounded_rectangle((81,y-10,1191,y+62),12,fill=C["panel2"])
        txt(96,y,str(i+1).zfill(2),32,"gold" if i==0 else "cyan",True)
        txt(170,y,person["player"],33,"white",True,limit=760)
        right(1167,y,short(person["value"]),34,"green",True)
    # six event rows, including flashes and clearly marked no-spark policy
    panel(1243,424,2345,985,"WEEKLY EVENT SCOREBOARD")
    txt(1273,468,"Ranked by actual recorded result coverage, not guessed totals",20,"muted")
    for i,e in enumerate(data["events"]):
        y=513+i*74
        if i%2==0:d.rounded_rectangle((1268,y-5,2322,y+62),11,fill=C["panel2"])
        label="SPACE" if e["kind"]=="space" else "PIGGY" if e["kind"]=="piggy" else "FLASH "+str(e["flash"])
        txt(1282,y,label,28,"gold" if e["kind"]=="piggy" else "cyan",True)
        if e["missing"]:
            txt(1506,y,"NOT IN APPROVED SOURCE",22,"red",True)
            continue
        txt(1506,y,str(e["participants"])+" recorded",25,"white")
        right(2304,y,str(e["aboveAverage"])+"/"+str(e["benchmarkEligible"])+" > AVG",27,"green",True)
        txt(1510,y+35,e["date"]+(" • PARTIAL" if e["status"]=="partial" else " • reviewed"),17,"muted")
        if e["noSparkAward"]:txt(1860,y+35,"NO SPARKS · AFTER KRAKEN",17,"gold",True)
    # 3 substantial panels for unique specific insights.
    panel(54,1009,814,1482,"PERSONAL BESTS")
    txt(88,1062,str(data["scorePBs"])+" improved returning-player PBs",25,"green",True)
    txt(88,1107,str(data["piggyFinishRankImproved"])+" Piggy place PBs  •  "+str(data["spaceLobbyRankImproved"])+" Space lobby place PBs",20,"muted")
    for i,p in enumerate(data["highlightPBs"][:5]):
        y=1162+i*57
        txt(91,y,p["player"],24,"white",True,limit=445)
        right(781,y,"+"+f"{100*(p.get('improvement') or 0):.1f}%",23,"green",True)
    panel(836,1009,1588,1482,"ACHIEVEMENTS UNLOCKED")
    milestones=data["milestones"]
    groups={}
    for m in milestones:groups[m["category"]]=groups.get(m["category"],0)+1
    txt(867,1062,str(len(milestones))+" verified threshold crossings",25,"gold",True)
    for i,(kind,count) in enumerate(sorted(groups.items())):
        txt(872,1122+i*45,kind.upper()+" · "+num(count),25,"white",True)
    for i,m in enumerate(milestones[:4]):
        txt(872,1248+i*50,m["player"],21,"muted",limit=450)
        right(1548,1248+i*50,str(m["threshold"])+("B" if m["category"]=="space" else ""),22,"gold",True)
    panel(1608,1009,2345,1482,"COVERAGE & CONTEXT")
    txt(1639,1067,"SOURCE STATUS",24,"muted",True)
    flags=[
      str(data["eventCount"])+"/6 event slots have approved results",
      "All ranked figures are recorded-only",
      "Immediately post-Kraken PFs: zero Sparks" if data["postKrakenNoSparkFlash"] else "Normal event payout rules apply",
      "Discord PNG auto-publishing disabled",
      "Source flash Spark ledger needs review" if data["sourceFlashSparkConflict"] else "No flash Spark reconciliation flag",
    ]
    for i,line in enumerate(flags):txt(1642,1126+i*60,"• "+line,21,"gold" if i==4 and data["sourceFlashSparkConflict"] else "white",limit=667)
    # Distinct visual band for source/distribution warnings.
    d.rounded_rectangle((55,1501,2345,1591),radius=15,fill="#182c40",outline=C["border"],width=2)
    txt(83,1520,"REVIEW ONLY  •  SOURCE "+data["projectionVersion"][:12]+"…",22,"cyan",True)
    warning_count=len(data["warnings"])
    txt(85,1554,str(warning_count)+" raw coverage/reconciliation notes in sidecar; incomplete leaderboards are never official totals.",19,"muted",limit=2210)
    txt(60,1615,"DATA: approved canonical event ledger · frozen weekly JSON model",19,"muted")
    right(2340,1615,"PREVIEW — NOT DISCORD-APPROVED",22,"gold",True)
    return im

def render(data_path,output,asset_dir):
    content=json.loads(Path(data_path).read_text(encoding="utf8"))
    img=compose(content,art(asset_dir));out=Path(output)
    if out.suffix.lower()!=".png":raise ValueError("Output must be a PNG")
    out.parent.mkdir(parents=True,exist_ok=True);img.save(out)
    digest=hashlib.sha256(out.read_bytes()).hexdigest()
    sidecar={k:content[k] for k in ["weekStart","weekEnd","clan","projectionVersion","reviewDigest","eventCount",
              "totalKnownSparks","postKrakenNoSparkFlash","sourceFlashSparkConflict","warnings","discordDraft"]}
    sidecar.update(schemaVersion=1,imageSHA256=digest,approvedCharacterOriginals={name:ART[name][1] for name in ART},
        readyToPost=False,discordPostingEnabled=False,automaticDispatchEnabled=False,
        reviewRequired=True,originalArtworkVerified=True)
    out.with_suffix(".json").write_text(json.dumps(sidecar,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
    out.with_suffix(".txt").write_text(content["discordDraft"]+"\n",encoding="utf8")
    return {"png":str(out),"sha256":digest,"size":list(img.size),"readyToPost":False}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("weekly_json");p.add_argument("output_png")
    p.add_argument("--approved-library-art-dir",required=True,
        help="Directory with exactly the original user-uploaded character PNGs (4 files required)")
    a=p.parse_args()
    print(json.dumps(render(a.weekly_json,a.output_png,a.approved_library_art_dir)))
if __name__=="__main__":main()
