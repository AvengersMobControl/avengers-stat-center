#!/usr/bin/env python3
"""Render the approved Space summary design from a canonical release JSON.
Usage: python3 scripts/render-space-summary.py release.json output.png [AVENGERS|AV-2]
No source-image editing or invented data; records and prior PBs come from ledger.
"""
import json,sys,math
from PIL import Image,ImageDraw,ImageFont
R=json.load(open(sys.argv[1]));P=R['projection'];clan=sys.argv[3] if len(sys.argv)>3 else 'AVENGERS'
events=[e for e in P['events'] if e['kind']=='space' and e['status']!='revoked'];event=events[-1]
rows=sorted([r for r in event['rows'] if r['clan']==clan],key=lambda r:-r['score'])
prior=next((e for e in reversed(events[:-1]) if any(r['clan']==clan for r in e['rows'])),None)
old=[r for r in prior['rows'] if r['clan']==clan] if prior else []
people={p['name']:p for p in P['people']}
trans=[dict(name=r['player'],**next(t for t in people[r['player']]['kinds']['space']['pbs'] if t['eventId']==event['id'])) for r in rows]
pbs=sorted([t for t in trans if t['newPB']],key=lambda r:-r['improvement']);first=[t for t in trans if t['firstRecorded']]
W,H=2400,1500;im=Image.new('RGB',(W,H),'#061528');d=ImageDraw.Draw(im)
FG='#edf4ff';MUT='#a5bad6';CYAN='#19d4f0';PURPLE='#8b50ff';GREEN='#19e8ac';YELLOW='#ffdf50'
F='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def font(size,bold=False):return ImageFont.truetype(B if bold else F,size)
def text(x,y,s,size=25,color=FG,bold=False,anchor=None):d.text((x,y),str(s),font=font(size,bold),fill=color,anchor=anchor)
def fit(x,y,s,width,size=27,color=FG,bold=False):
 while d.textlength(s,font=font(size,bold))>width and size>15:size-=1
 text(x,y,s,size,color,bold)
def card(box,outline='#285d8a',fill='#0b2037'):d.rounded_rectangle(box,20,fill=fill,outline=outline,width=2)
def num(v,dec=0):return f'{v:,.{dec}f}'
def ly(v):return f'{v:,.1f}B'
def name(s):return s.replace('AV-','',1) if s.startswith('AV-') else s
# Subtle orbit lines, kept behind the data panels.
for offset in [0,230,500]:d.arc((-550,-70+offset,900,1270+offset),235,55,fill='#10405a',width=2)
text(48,32,clan+' // STAT CENTER',28,CYAN,True);text(45,83,'SPACE RACE WEEKLY SUMMARY',64,FG,True)
text(W-48,40,'OCTOBER 16, 2026',32,MUT,True,'ra');text(W-48,96,'FINAL SCREENSHOTS · LOGGED RESULTS',22,GREEN,True,'ra')
total=sum(r['score'] for r in rows);stars=sum(r['stars'] or 0 for r in rows);sparks=sum(r['sparks'] or 0 for r in rows);avg=total/len(rows)
oldtotal=sum(r['score'] or 0 for r in old);oldavg=oldtotal/len(old) if old else 0
stats=[('TOTAL LIGHTYEARS',ly(total),f'{(total/oldtotal-1)*100:+.1f}% vs Oct 9' if oldtotal else ''),('AVERAGE / PLAYER',ly(avg),f'{(avg/oldavg-1)*100:+.1f}% vs Oct 9' if oldavg else ''),('TRACKED STARS',num(stars),'Full values; derived rewards included*'),('PLAYERS LOGGED',str(len(rows)),f'{len(set(r["metadata"]["group"] for r in rows))} lobbies represented · {num(sparks)} Sparks')]
for i,(label,value,note) in enumerate(stats):
 x=45+i*588;card((x,180,x+568,340));d.rounded_rectangle((x,180,x+7,340),3,fill=CYAN if i%2 else PURPLE)
 text(x+28,200,label,23,MUT,True);text(x+28,238,value,48,FG,True);fit(x+28,305,note,520,22,GREEN if i in [0,1] else MUT)
# Main PB panel is largest and includes only this clan's returning racers.
LX,RX=45,1170;card((LX,378,1138,847),CYAN);card((LX+17,395,1120,492),fill='#112d49')
text(LX+38,407,'★ PERSONAL BESTS',48,FG,True);text(1095,420,f'{len(pbs)} NEW PBs',31,GREEN,True,'ra')
text(LX+40,464,'Returning players · ranked by improvement over prior all-time best',22,MUT)
for x,label in [(LX+28,'#'),(LX+77,'PLAYER'),(730,'OLD PB'),(911,'NEW PB'),(1100,'INCREASE')]:text(x,520,label,21,MUT,True,'ra' if x>700 else None)
for i,r in enumerate(pbs):
 y=564+i*66
 if i%2==0:d.rounded_rectangle((LX+21,y-6,1115,y+51),10,fill='#10304c')
 text(LX+30,y,str(i+1),30,CYAN,True);fit(LX+80,y,r['name'],405,31,YELLOW if i==0 else FG,True)
 text(730,y,ly(r['previousPB']),29,MUT,True,'ra');text(911,y,ly(r['score']),30,FG,True,'ra');text(1100,y,f'+{r["improvement"]*100:.1f}%',32,GREEN,True,'ra')
text(LX+30,817,'PBs use accepted history before Oct 16; first tracked entries are separate.',20,MUT)
# Top ten: full Stars, screenshot Share and reward/effort visible.
card((RX,378,2355,1070));text(RX+30,403,'TOP 10 — LIGHTYEARS',38,FG,True)
text(RX+30,456,clan+' event-time competitors · Sparks/Effort per B',23,MUT)
cols=[(RX+28,'#',None),(RX+78,'PLAYER',None),(RX+558,'LIGHTYEARS','ra'),(RX+753,'STARS','ra'),(RX+915,'SPARKS','ra'),(RX+1026,'SHARE','ra'),(RX+1155,'SP / B','ra')]
for x,label,anchor in cols:text(x,508,label,20,MUT,True,anchor)
for i,r in enumerate(rows[:10]):
 y=552+i*48
 if i%2==0:d.rectangle((RX+20,y-3,2335,y+43),fill='#10304c')
 color=YELLOW if i==0 else FG
 text(RX+28,y,str(i+1),25,color,True);fit(RX+78,y,r['player'],340,26,color,True)
 text(RX+558,y,ly(r['score']),25,FG,True,'ra');text(RX+753,y,num(r['stars']),24,MUT,False,'ra');text(RX+915,y,num(r['sparks']),24,MUT,False,'ra');text(RX+1026,y,f'{r["metadata"]["share"]*100:g}%',23,MUT,False,'ra');text(RX+1155,y,num(r['sparks']/r['score'],1),24,CYAN,False,'ra')
# First recorded section, no claim of first-ever in-game race.
card((LX,869,1138,1069));text(LX+28,890,'FIRST TRACKED SPACE RESULTS',31,CYAN,True)
for i,r in enumerate(sorted(first,key=lambda r:-r['score'])):
 col=i%2;row=i//2;x=LX+28+col*535;y=946+row*43
 fit(x,y,r['name'],330,25,FG,True);text(x+490,y,ly(r['score']),25,MUT,False,'ra')
text(LX+28,1037,'First entry in our available history; earlier in-game races may exist.',20,MUT)
# Effort recognition highlights: meaningful effort threshold, explicit method.
card((LX,1091,1138,1376),PURPLE);text(LX+28,1110,'EFFORT WORTH A SHOUTOUT',32,FG,True)
text(LX+28,1157,'Lowest Sparks/B among racers with at least 100B recorded',22,MUT)
shout=sorted([r for r in rows if r['score']>=100 and r['sparks'] is not None],key=lambda r:r['sparks']/r['score'])[:3]
for i,r in enumerate(shout):
 y=1204+i*43;fit(LX+28,y,r['player'],460,27,FG,True);text(790,y,ly(r['score']),26,MUT,False,'ra');text(1095,y,f'{num(r["sparks"]/r["score"],1)} Sp/B',27,CYAN,True,'ra')
text(LX+28,1343,'Less personal reward per unit of effort · not a performance ranking',20,MUT)
card((RX,1091,2355,1376));text(RX+30,1110,'WEEK-OVER-WEEK',32,FG,True)
for i,(label,value,prev) in enumerate([('Total lightyears',total,oldtotal),('Average / player',avg,oldavg)]):
 y=1174+i*62;text(RX+30,y,label,27,MUT);text(1805,y,ly(value),30,FG,True,'ra');text(2030,y,'vs '+ly(prev),26,MUT,False,'ra');pct=(value/prev-1)*100 if prev else 0;text(2315,y,f'{pct:+.1f}%',31,GREEN if pct>=0 else '#ff626f',True,'ra')
text(RX+30,1313,f'{len(rows)} logged this race vs {len(old)} last race; coverage can differ.',23,MUT)
text(45,1404,'* Rounded Star displays converted using exact Sparks × 10; directly visible Star values preserved.',22,MUT)
text(45,1440,'Final screenshots only · coverage remains partial · AVENGERS and AV-2 totals kept separate.',22,MUT)
text(2355,1440,'AVENGERS STAT CENTER',24,CYAN,True,'ra')
im.save(sys.argv[2])
print(json.dumps({'file':sys.argv[2],'clan':clan,'players':len(rows),'pbs':len(pbs),'firstTracked':len(first),'stars':stars,'sparks':sparks,'scoreB':total}))
