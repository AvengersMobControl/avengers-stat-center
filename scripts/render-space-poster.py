#!/usr/bin/env python3
"""Space Race poster in the Piggy Flash visual style (review candidate).

Usage:
  python3 scripts/render-space-poster.py reports/approved-summary-release.json out.png --clan AVENGERS [--event-id 'space|2026-10-25']

Reads ONLY the approved canonical export. Every number, name and date comes from
the projection; characters come from assets/characters (leader-approved 2026-10-25)
and decorate around the data, never over it. Writes a sidecar JSON with
readyToPost:false. Never posts anything.
"""
import argparse, datetime as dt, hashlib, json, random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONTS = ROOT / 'assets' / 'fonts'
CHARS = ROOT / 'assets' / 'characters'
TEMPLATE = 'space-poster-v1-20261025-candidate'
W, M = 2400, 60
C = dict(bg='#070f24', bg2='#1a0f3a', panel='#0d1a36', row='#13244a', row2='#0f1d3d',
         fg='#f2f6ff', mut='#9fb2d6', cyan='#22d8f2', mag='#ff4fd8', gold='#ffd23f',
         green='#2ff0a8', purple='#9b6bff', red='#ff6b7a', white='#ffffff')

_fc = {}
def F(size, w='bold'):
    name = {'black': 'InterDisplay-Black.otf', 'xbold': 'Inter-ExtraBold.otf', 'bold': 'Inter-Bold.otf',
            'semi': 'Inter-SemiBold.otf', 'med': 'Inter-Medium.otf'}[w]
    key = (name, size)
    if key not in _fc:
        try:
            _fc[key] = ImageFont.truetype(str(FONTS / name), size)
        except OSError:
            _fc[key] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', size)
    return _fc[key]

def fmt(v, d=0): return f'{v:,.{d}f}'
def ly(v): return f'{v:,.1f}B'
def mill(v): return f'{v/1e6:.2f}M'
def pct(v): return f'{v*100:+.1f}%'
def shortdate(s): return dt.date.fromisoformat(s).strftime('%b %d').replace(' 0', ' ')
def longdate(s): return dt.date.fromisoformat(s).strftime('%B %d, %Y').replace(' 0', ' ').upper()


def build_model(R, clan, event_id=None):
    P = R['projection']
    space = [e for e in P['events'] if e['kind'] == 'space' and e['status'] != 'revoked']
    space.sort(key=lambda e: e['date'])
    if event_id:
        event = next(e for e in space if e['id'] == event_id)
    else:
        event = [e for e in space if any(r['clan'] == clan for r in e['rows'])][-1]
    rows = sorted([r for r in event['rows'] if r['clan'] == clan and r.get('score') is not None],
                  key=lambda r: -r['score'])
    if not rows:
        raise SystemExit(f'No {clan} rows in {event["id"]}')
    earlier = [e for e in space if e['date'] < event['date']]
    prior = next((e for e in reversed(earlier) if any(r['clan'] == clan for r in e['rows'])), None)
    prior_rows = [r for r in prior['rows'] if r['clan'] == clan and r.get('score') is not None] if prior else []

    # Site-wide histories (any clan) for PBs, averages and all-time ranks.
    hist = {}
    for e in earlier:
        for r in e['rows']:
            if r.get('score') is not None:
                hist.setdefault(r['player'], []).append((e['date'], r['score']))
    all_scores = sorted([r['score'] for e in space if e['date'] <= event['date'] for r in e['rows']
                         if r.get('score') is not None], reverse=True)
    def alltime_rank(score): return 1 + sum(1 for s in all_scores if s > score)

    people = {p['name']: p for p in P['people']}
    pbs, first = [], []
    for r in rows:
        t = next((x for x in people[r['player']]['kinds']['space']['pbs'] if x['eventId'] == event['id']), None)
        h = hist.get(r['player'], [])
        if not h:
            first.append(r)
        elif t and t.get('newPB'):
            prev_score, prev_date = max(h, key=lambda x: (x[1], x[0]))[1], None
            prev_date = max((d for d, s in h if s == prev_score))
            pbs.append(dict(name=r['player'], old=prev_score, oldDate=prev_date, new=r['score'],
                            imp=r['score'] / prev_score - 1))
    pbs.sort(key=lambda x: -x['imp'])

    above, eligible, best_vs_avg = 0, 0, None
    for r in rows:
        h = hist.get(r['player'], [])
        if h:
            eligible += 1
            avg = sum(s for _, s in h) / len(h)
            if r['score'] > avg: above += 1
            if len(h) >= 3:
                gain = r['score'] / avg - 1
                if not best_vs_avg or gain > best_vs_avg['gain']:
                    best_vs_avg = dict(name=r['player'], gain=gain, avg=avg, score=r['score'], n=len(h))

    # Lobby cards: pot = individual reward / share (leader rule), never header totals.
    lobbies = {}
    for r in event['rows']:
        if r['clan'] == clan:
            lobbies.setdefault(r['metadata']['lobby'], []).append(r)
    cards = []
    for L, rs in lobbies.items():
        known = [r for r in rs if r.get('stars') and r['metadata'].get('share')]
        top_share = max(known, key=lambda r: r['metadata']['share']) if known else None
        pot = top_share['stars'] / top_share['metadata']['share'] if top_share else None
        lead = max(rs, key=lambda r: r['score'])
        cards.append(dict(lobby=L, pot=pot, share=sum(r['metadata'].get('share') or 0 for r in rs),
                          dist=sum(r['score'] for r in rs), n=len(rs), leader=lead['player'],
                          leadScore=lead['score'], stars=sum(r['stars'] or 0 for r in rs)))
    cards.sort(key=lambda c: -(c['pot'] or 0))

    # Five-week clan league window (35-day cadence anchored to the Oct 12 2026 start).
    anchor = dt.date(2026, 10, 12)
    d = dt.date.fromisoformat(event['date'])
    k = (d - anchor).days // 35
    lstart = anchor + dt.timedelta(days=35 * k); lend = lstart + dt.timedelta(days=34)
    in_league = lambda e: lstart.isoformat() <= e['date'] <= event['date']
    league_dist, league_sparks = {}, {}
    for e in P['events']:
        if e['status'] == 'revoked' or not in_league(e): continue
        for r in e['rows']:
            if r['clan'] != clan: continue
            if e['kind'] == 'space' and r.get('score') is not None:
                league_dist[r['player']] = league_dist.get(r['player'], 0) + r['score']
            if r.get('sparks') is not None:
                league_sparks[r['player']] = league_sparks.get(r['player'], 0) + r['sparks']
    ld = max(league_dist.items(), key=lambda x: x[1]) if league_dist else None
    ls = max(league_sparks.items(), key=lambda x: x[1]) if league_sparks else None

    total = sum(r['score'] for r in rows)
    ptotal = sum(r['score'] for r in prior_rows)
    shout = sorted([r for r in rows if r['score'] >= 100 and r.get('sparks') is not None],
                   key=lambda r: r['sparks'] / r['score'])[:3]
    tiers = [(t, sum(1 for r in rows if r['score'] >= t)) for t in (100, 250, 500, 1000)]
    return dict(event=event, clan=clan, rows=rows, prior=prior, priorRows=prior_rows, total=total,
                avg=total / len(rows), ptotal=ptotal, pavg=ptotal / len(prior_rows) if prior_rows else None,
                stars=sum(r['stars'] or 0 for r in rows), sparks=sum(r['sparks'] or 0 for r in rows),
                derived=sum(1 for r in rows if r['metadata'].get('starsDerived')),
                pbs=pbs, first=sorted(first, key=lambda r: -r['score']), above=above, eligible=eligible,
                bestVsAvg=best_vs_avg, cards=cards, leagueStart=lstart.isoformat(), leagueEnd=lend.isoformat(),
                leagueDist=ld, leagueSparks=ls, shout=shout, tiers=[t for t in tiers if t[1] > 0],
                allTimeRank={r['player']: alltime_rank(r['score']) for r in rows[:10]}, allTimeN=len(all_scores),
                projectionVersion=P.get('version'), complete=bool(event.get('metadata', {}).get('complete')))


class Poster:
    def __init__(self, height):
        self.im = Image.new('RGB', (W, height), C['bg'])
        self.d = ImageDraw.Draw(self.im)
        self._background(height)

    def _background(self, h):
        top, bot = Image.new('RGB', (1, 2)), None
        grad = Image.new('RGB', (1, h))
        a, b = Image.new('RGB', (1, 1), C['bg']).getpixel((0, 0)), Image.new('RGB', (1, 1), C['bg2']).getpixel((0, 0))
        for y in range(h):
            t = (y / h) ** 1.4
            grad.putpixel((0, y), tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3)))
        self.im.paste(grad.resize((W, h)))
        rnd = random.Random(25)
        for _ in range(int(h / 6)):
            x, y = rnd.randrange(W), rnd.randrange(h); r = rnd.choice([1, 1, 1, 2])
            c = rnd.choice(['#2a3c6e', '#3b4f86', '#5a3c8c', '#24507a'])
            self.d.ellipse((x, y, x + r, y + r), fill=c)

    def text(self, xy, s, size, color='fg', w='bold', anchor='la'):
        self.d.text(xy, str(s), font=F(size, w), fill=C.get(color, color), anchor=anchor)

    def fit(self, xy, s, maxw, size, color='fg', w='bold', anchor='la', minsize=16):
        while size > minsize and self.d.textlength(str(s), font=F(size, w)) > maxw: size -= 1
        self.text(xy, s, size, color, w, anchor)

    def neon(self, box, color, radius=26, width=4, fill='panel'):
        x0, y0, x1, y1 = box
        glow = Image.new('RGBA', (x1 - x0 + 80, y1 - y0 + 80), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        gd.rounded_rectangle((40, 40, 40 + x1 - x0, 40 + y1 - y0), radius, outline=C[color], width=10)
        glow = glow.filter(ImageFilter.GaussianBlur(14))
        alpha = glow.getchannel('A').point(lambda v: int(v * 0.55)); glow.putalpha(alpha)
        self.im.paste(glow, (x0 - 40, y0 - 40), glow)
        self.d.rounded_rectangle(box, radius, fill=C[fill], outline=C[color], width=width)

    def char(self, name, box, flip=False):
        im = Image.open(CHARS / name).convert('RGBA')
        bb = im.getbbox(); im = im.crop(bb)
        if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
        x0, y0, x1, y1 = box; im.thumbnail((x1 - x0, y1 - y0), Image.LANCZOS)
        x = x0 + (x1 - x0 - im.width) // 2; y = y0 + (y1 - y0 - im.height) // 2
        self.im.paste(im, (x, y), im)

    def section_title(self, y, title, color, right=None):
        self.text((M + 46, y), title, 46, 'fg', 'black')
        if right: self.text((W - M - 46, y + 14), right, 24, 'mut', 'semi', 'ra')


def render(model, out):
    m = model; clan = m['clan']; ev = m['event']
    pb_rows = (len(m['pbs']) + 2) // 3
    first_rows = (len(m['first']) + 4) // 5 if m['first'] else 1
    card_rows = (len(m['cards']) + 1) // 2
    H = (560 + 230 + card_rows * 330 + 60 + 240 + 450 + 170 + 70 * 10 + 120
         + 210 + (pb_rows * 158 + 140 if m['pbs'] else 0) + 230 + 120 + first_rows * 74 + 330 + 230 + 520)
    p = Poster(H); d = p.d
    lobby_chars = ['AV_ExplodonSpider.png', 'AV_KaboomStar.png', 'AV_NexusThor.png', 'AV_SirionGamora.png',
                   'AV_ExplodonTerrorist.png', 'AV_GCIron.png', 'AV_BBDrax.png', 'AV_LBCA.png']

    # Header
    p.char('AV_ChickenHawkeye.png', (40, 20, 560, 520))
    p.char('AV_GNHulk.png', (W - 560, 20, W - 40, 520))
    p.text((W // 2, 70), clan, 150, 'fg', 'black', 'ma')
    p.text((W // 2, 245), 'SPACE RACE', 118, 'cyan', 'black', 'ma')
    p.text((W // 2, 400), f'{longdate(ev["date"])}  •  FINAL RESULTS', 40, 'fg', 'bold', 'ma')
    d.line((W // 2 - 620, 480, W // 2 + 620, 480), fill=C['cyan'], width=4)
    y = 560

    # KPI row
    kpis = [('PLAYERS', fmt(len(m['rows'])), 'cyan'), ('LOBBY' if len(m['cards']) == 1 else 'LOBBIES', fmt(len(m['cards'])), 'mag'),
            ('TOTAL LIGHTYEARS', ly(m['total']), 'white'), ('EARNED STARS', fmt(m['stars']), 'gold'),
            ('EARNED SPARKS', fmt(m['sparks']), 'green')]
    bw = (W - 2 * M - 4 * 26) // 5
    for i, (lab, val, col) in enumerate(kpis):
        x = M + i * (bw + 26)
        p.neon((x, y, x + bw, y + 190), col)
        p.fit((x + bw // 2, y + 30), val, bw - 40, 76, col if col != 'white' else 'fg', 'black', 'ma')
        p.text((x + bw // 2, y + 136), lab, 28, 'fg', 'semi', 'ma')
    y += 230

    # Lobby cards
    cw = (W - 2 * M - 30) // 2
    for i, c in enumerate(m['cards']):
        col = ['cyan', 'mag', 'green', 'purple', 'gold', 'cyan', 'mag', 'green'][i % 8]
        x = M + (i % 2) * (cw + 30); yy = y + (i // 2) * 330
        if i == len(m['cards']) - 1 and len(m['cards']) % 2 == 1: x = (W - cw) // 2
        p.neon((x, yy, x + cw, yy + 300), col)
        p.text((x + 34, yy + 26), f'LOBBY {i + 1}', 50, col, 'black')
        p.fit((x + 330, yy + 38), f'#1 {c["leader"]}', cw - 640, 34, 'fg', 'bold')
        d.line((x + 30, yy + 98, x + cw - 30, yy + 98), fill='#2a3f6e', width=2)
        cells = [('POT STARS', mill(c['pot']) if c['pot'] else '—', col),
                 (f'{clan} SHARE', f'{c["share"]*100:.0f}%', 'fg'),
                 (f'{clan} LIGHTYEARS', ly(c['dist']), 'fg'),
                 ('RACERS', f'{c["n"]} / 9', 'fg')]
        for j, (lab, val, vc) in enumerate(cells):
            cx = x + 34 + (j % 2) * 360; cy = yy + 116 + (j // 2) * 92
            p.text((cx, cy), lab, 22, 'mut', 'semi')
            p.text((cx, cy + 28), val, 46 if j == 0 else 40, vc, 'black' if j == 0 else 'xbold')
        p.char(lobby_chars[i % len(lobby_chars)], (x + cw - 330, yy + 104, x + cw - 30, yy + 290))
    y += card_rows * 330 + 10
    p.text((M + 10, y), 'Pot Stars = a racer\'s reward ÷ their share %; screenshot pot headers can be out of date.',
           24, 'mut', 'med')
    y += 50

    # Change vs prior
    p.neon((M, y, W - M, y + 210), 'mag')
    p.text((M + 46, y + 30), 'CHANGE VS LAST RACE', 46, 'fg', 'black')
    if m['prior']:
        p.text((W - M - 46, y + 44), f'vs {shortdate(m["prior"]["date"])} · {len(m["rows"])} logged vs {len(m["priorRows"])}',
               26, 'mut', 'semi', 'ra')
        for j, (lab, now, was) in enumerate([('TOTAL LIGHTYEARS', m['total'], m['ptotal']),
                                             ('AVERAGE / PLAYER', m['avg'], m['pavg'])]):
            x = M + 46 + j * 1150
            ch = now / was - 1 if was else 0
            p.text((x, y + 112), lab, 26, 'mut', 'semi')
            p.text((x + 420, y + 100), ly(now), 52, 'fg', 'black')
            p.text((x + 1060, y + 100), pct(ch), 52, 'green' if ch >= 0 else 'red', 'black', 'ra')
    else:
        p.text((M + 46, y + 112), 'First tracked race for this clan.', 30, 'mut', 'semi')
    y += 240

    # Spotlights
    p.neon((M, y, W - M, y + 420), 'purple')
    p.text((M + 46, y + 30), 'INDIVIDUAL SPOTLIGHTS', 46, 'fg', 'black')
    p.text((W - M - 46, y + 44), f'Clan league {shortdate(m["leagueStart"])} – {shortdate(m["leagueEnd"])}',
           26, 'mut', 'semi', 'ra')
    top = m['rows'][0]; bva = m['bestVsAvg']
    spots = [('RACE LEADER', top['player'], ly(top['score']), 'Highest distance this race', 'gold'),
             ('BIGGEST JUMP VS OWN AVERAGE', bva['name'] if bva else '—', pct(bva['gain']) if bva else '—',
              f'{ly(bva["score"])} vs {ly(bva["avg"])} avg over {bva["n"]} races' if bva else 'Needs 3+ earlier races', 'green'),
             ('LEAGUE DISTANCE LEADER', m['leagueDist'][0] if m['leagueDist'] else '—',
              ly(m['leagueDist'][1]) if m['leagueDist'] else '—', 'Tracked Space distance this league', 'cyan'),
             ('LEAGUE SPARKS LEADER', m['leagueSparks'][0] if m['leagueSparks'] else '—',
              fmt(m['leagueSparks'][1]) if m['leagueSparks'] else '—', 'Tracked Sparks, all events this league', 'mag')]
    sw = (W - 2 * M - 92 - 3 * 24) // 4
    for i, (lab, name, val, note, col) in enumerate(spots):
        x = M + 46 + i * (sw + 24); yy = y + 116
        d.rounded_rectangle((x, yy, x + sw, yy + 270), 20, fill=C['row'])
        p.fit((x + 26, yy + 24), lab, sw - 52, 24, col, 'xbold')
        p.fit((x + 26, yy + 70), name, sw - 52, 40, 'fg', 'black')
        p.fit((x + 26, yy + 128), val, sw - 52, 62, col, 'black')
        p.fit((x + 26, yy + 214), note, sw - 52, 22, 'mut', 'med')
    y += 450

    # Top 10
    n10 = min(10, len(m['rows']))
    p.neon((M, y, W - M, y + 170 + 70 * n10 + 40), 'cyan')
    p.text((M + 46, y + 30), 'TOP 10  /  LIGHTYEARS', 46, 'fg', 'black')
    p.text((W - M - 46, y + 44), f'ALL-TIME RANK AMONG {fmt(m["allTimeN"])} RECORDED SPACE RESULTS', 22, 'mut', 'semi', 'ra')
    cols = [(M + 60, '#', 'la'), (M + 160, 'PLAYER', 'la'), (1090, 'LIGHTYEARS', 'ra'), (1380, 'STARS', 'ra'),
            (1640, 'SPARKS', 'ra'), (1820, 'SHARE', 'ra'), (2030, 'SP / B', 'ra'), (W - M - 60, 'ALL-TIME', 'ra')]
    hy = y + 116
    d.rectangle((M + 40, hy - 8, W - M - 40, hy + 40), fill=C['row'])
    for x, lab, a in cols: p.text((x, hy), lab, 24, 'mut', 'semi', a)
    for i, r in enumerate(m['rows'][:10]):
        ry = y + 170 + i * 70
        if i % 2 == 0: d.rectangle((M + 40, ry - 10, W - M - 40, ry + 56), fill=C['row2'])
        badge = {0: 'gold', 1: 'cyan', 2: 'mag'}.get(i)
        if badge:
            d.rounded_rectangle((M + 44, ry - 2, M + 100, ry + 46), 8, fill=C[badge])
            p.text((M + 72, ry + 2), i + 1, 32, '#0a1530', 'black', 'ma')
        else:
            p.text((M + 72, ry + 2), i + 1, 32, 'fg', 'bold', 'ma')
        p.fit((M + 160, ry + 2), r['player'], 700, 36, 'gold' if i == 0 else 'fg', 'bold')
        sh = r['metadata'].get('share')
        vals = [(1090, ly(r['score']), 'fg'), (1380, fmt(r['stars']) if r['stars'] is not None else '—', 'gold'),
                (1640, fmt(r['sparks']) if r['sparks'] is not None else '—', 'green'),
                (1820, f'{sh*100:g}%' if sh else '—', 'fg'),
                (2030, fmt(r['sparks'] / r['score'], 1) if r.get('sparks') else '—', 'cyan'),
                (W - M - 60, f'{m["allTimeRank"][r["player"]]} / {fmt(m["allTimeN"])}', 'cyan')]
        for x, v, col in vals: p.text((x, ry + 4), v, 34, col, 'semi', 'ra')
    y += 170 + 70 * n10 + 80

    # PBs
    if m['pbs']:
        p.neon((M, y, W - M, y + 150), 'gold')
        p.text((M + 46, y + 44), 'PERSONAL BESTS', 52, 'fg', 'black')
        d.rounded_rectangle((W - M - 640, y + 34, W - M - 40, y + 116), 16, outline=C['gold'], width=3)
        p.text((W - M - 610, y + 42), str(len(m['pbs'])), 56, 'gold', 'black')
        p.text((W - M - 480, y + 60), 'NEW SPACE DISTANCE PBs', 30, 'fg', 'xbold')
        y += 180
        boxh = 140 + pb_rows * 158
        p.neon((M, y, W - M, y + boxh), 'purple')
        p.text((M + 46, y + 30), f'NEW DISTANCE PERSONAL BESTS  /  {len(m["pbs"])}', 44, 'fg', 'black')
        p.text((W - M - 46, y + 44), 'Best anywhere on the site, any clan → new best', 22, 'mut', 'semi', 'ra')
        gw = (W - 2 * M - 92 - 2 * 24) // 3
        for i, b in enumerate(m['pbs']):
            x = M + 46 + (i % 3) * (gw + 24); yy = y + 116 + (i // 3) * 158
            d.rounded_rectangle((x, yy, x + gw, yy + 136), 16, fill=C['row'], outline='#2c3f73', width=2)
            p.text((x + 22, yy + 18), f'{i+1:02d}', 28, 'gold', 'black')
            p.fit((x + 86, yy + 16), b['name'], gw - 110, 32, 'fg', 'bold')
            p.text((x + 22, yy + 82), ly(b['old']), 30, 'mut', 'semi')
            p.text((x + 210, yy + 78), '→', 36, 'gold', 'black')
            p.text((x + 262, yy + 74), ly(b['new']), 42, 'gold', 'black')
            tag = pct(b['imp'])
            tw = d.textlength(tag, font=F(28, 'xbold')) + 28
            d.rounded_rectangle((x + gw - 22 - tw, yy + 78, x + gw - 22, yy + 120), 10, fill='#0c3a32', outline=C['green'], width=2)
            p.text((x + gw - 22 - tw / 2, yy + 84), tag, 28, 'green', 'xbold', 'ma')
            p.text((x + 22, yy + 60), f'prev. {shortdate(b["oldDate"])}', 18, 'mut', 'med')
        y += boxh + 30

    # Above prior average
    p.neon((M, y, W - M, y + 200), 'cyan')
    p.text((M + 46, y + 30), 'ABOVE OWN PRIOR AVERAGE', 46, 'fg', 'black')
    p.text((M + 46, y + 100), f'{m["above"]} / {m["eligible"]}', 76, 'green', 'black')
    p.text((M + 420, y + 116), 'returning racers beat their own earlier Space average', 32, 'fg', 'semi')
    y += 230

    # First tracked
    rowsn = first_rows
    p.neon((M, y, W - M, y + 120 + rowsn * 74), 'mag')
    p.text((M + 46, y + 30), 'FIRST TRACKED SPACE RESULTS', 46, 'fg', 'black')
    if m['first']:
        chw = (W - 2 * M - 92 - 4 * 20) // 5
        for i, r in enumerate(m['first']):
            x = M + 46 + (i % 5) * (chw + 20); yy = y + 104 + (i // 5) * 74
            d.rounded_rectangle((x, yy, x + chw, yy + 58), 12, fill=C['row'], outline=C['mag'], width=2)
            p.fit((x + 20, yy + 12), r['player'], chw - 190, 30, 'fg', 'bold')
            p.text((x + chw - 20, yy + 12), ly(r['score']), 30, 'cyan', 'xbold', 'ra')
    else:
        p.text((M + 46, y + 110), 'None this race.', 30, 'mut', 'semi')
    y += 120 + rowsn * 74 + 30

    # Effort shoutout
    p.neon((M, y, W - M, y + 300), 'purple')
    p.text((M + 46, y + 30), 'EFFORT WORTH A SHOUTOUT', 46, 'fg', 'black')
    p.text((W - M - 46, y + 44), 'Lowest Sparks per billion LY · at least 100B raced', 24, 'mut', 'semi', 'ra')
    for i, r in enumerate(m['shout']):
        yy = y + 112 + i * 60
        if i % 2 == 0: d.rectangle((M + 40, yy - 8, W - M - 40, yy + 50), fill=C['row2'])
        p.text((M + 60, yy), r['player'], 36, 'fg', 'bold')
        p.text((1500, yy), ly(r['score']), 36, 'cyan', 'semi', 'ra')
        p.text((W - M - 60, yy), f'{fmt(r["sparks"]/r["score"],1)} Sp/B', 36, 'gold', 'black', 'ra')
    if not m['shout']: p.text((M + 60, y + 112), 'No racers at 100B+ this time.', 32, 'mut', 'semi')
    y += 330

    # Milestones
    p.neon((M, y, W - M, y + 200), 'gold')
    p.text((M + 46, y + 30), 'DISTANCE MILESTONES', 46, 'fg', 'black')
    tiers = m['tiers'] or [(100, 0)]
    tw = (W - 2 * M - 92) // len(tiers)
    for i, (t, n) in enumerate(tiers):
        x = M + 46 + i * tw
        p.text((x, y + 100), str(n), 70, ['cyan', 'mag', 'gold', 'green'][i % 4], 'black')
        p.text((x + 30 + d.textlength(str(n), font=F(70, 'black')), y + 128), f'{fmt(t)}B+ RACERS', 28, 'fg', 'semi')
    y += 230

    # Footer
    fy = y; p.neon((M, fy, W - M, fy + 460), 'cyan')
    p.char('AV_MZGroot.png', (M + 40, fy + 40, M + 470, fy + 430))
    p.char('AV_RaccoonRocket.png', (W - M - 470, fy + 40, W - M - 40, fy + 430))
    cx = W // 2
    p.text((cx, fy + 70), f'{clan}  /  SPACE RACE', 44, 'cyan', 'black', 'ma')
    p.text((cx, fy + 134), f'{longdate(ev["date"])}  •  RECORDED RESULTS', 30, 'fg', 'bold', 'ma')
    notes = ['Results count for the clan each player raced for in this race.',
             'Pot Stars derived from reward ÷ share. Rounded Star rewards use exact Sparks × 10.',
             'PBs compare against each player\'s best anywhere on the site.',
             'Final screenshots only · coverage partial' if not m['complete'] else 'Final screenshots · full coverage']
    for i, s in enumerate(notes): p.text((cx, fy + 206 + i * 42), s, 26, 'mut', 'med', 'ma')
    p.text((cx, fy + 390), 'AVENGERS STAT CENTER', 34, 'gold', 'black', 'ma')
    final_h = fy + 460 + 50
    im = p.im.crop((0, 0, W, final_h))
    im.save(out, optimize=True)
    sha = hashlib.sha256(Path(out).read_bytes()).hexdigest()
    side = dict(file=str(out), eventId=ev['id'], clan=clan, projectionVersion=m['projectionVersion'],
                templateVersion=TEMPLATE, imageSHA256=sha, dimensions=[W, final_h], players=len(m['rows']),
                pbs=len(m['pbs']), firstTracked=len(m['first']), readyToPost=False, discordPostingEnabled=False,
                charactersSource='assets/characters (leader-approved 2026-10-25)')
    Path(str(out).rsplit('.', 1)[0] + '.json').write_text(json.dumps(side, indent=2))
    return side


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('release'); ap.add_argument('output')
    ap.add_argument('--clan', choices=['AVENGERS', 'AV-2'], required=True)
    ap.add_argument('--event-id')
    a = ap.parse_args()
    R = json.loads(Path(a.release).read_text())
    print(json.dumps(render(build_model(R, a.clan, a.event_id), a.output)))
