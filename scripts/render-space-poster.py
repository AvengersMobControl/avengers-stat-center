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
TEMPLATE = 'space-poster-v2-20261025-candidate'
W, M = 1800, 44
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


def lobby_pot_ranks(space, upto):
    """Python port of event-reward-metrics.js lobbyPots(): pot = Stars / share of the
    highest-share row with known Stars; share >= 1 is a percent. Ranked across every
    logged lobby up to and including `upto`. Returns {(date, group): (rank, of)}."""
    pots = []
    for e in space:
        if e['date'] > upto: continue
        groups = {}
        for r in e['rows']:
            g = (r.get('metadata') or {}).get('group')
            if g is None or g == '': continue
            groups.setdefault(str(g), []).append(r)
        for g, rs in groups.items():
            best = None
            for r in rs:
                sh = (r.get('metadata') or {}).get('share')
                try: sh = float(sh)
                except (TypeError, ValueError): continue
                if not sh > 0: continue
                if sh >= 1: sh /= 100
                if isinstance(r.get('stars'), (int, float)) and r['stars'] > 0 and (best is None or sh > best[0]):
                    best = (sh, r['stars'])
            if best: pots.append((round(best[1] / best[0]), e['date'], g))
    pots.sort(key=lambda x: (-x[0], x[1]))
    out = {}
    for x in pots: out[(x[1], x[2])] = (1 + next(i for i, y in enumerate(pots) if y[0] == x[0]), len(pots))
    return out


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
    pot_rank = lobby_pot_ranks(space, event['date'])
    cards = []
    for L, rs in lobbies.items():
        known = [r for r in rs if r.get('stars') and r['metadata'].get('share')]
        top_share = max(known, key=lambda r: r['metadata']['share']) if known else None
        pot = top_share['stars'] / top_share['metadata']['share'] if top_share else None
        lead = max(rs, key=lambda r: r['score'])
        grp = str(rs[0]['metadata'].get('group'))
        rk = pot_rank.get((event['date'], grp))
        cards.append(dict(lobby=grp, potRank=rk[0] if rk else None, potOf=rk[1] if rk else None, pot=pot, share=sum(r['metadata'].get('share') or 0 for r in rs),
                          dist=sum(r['score'] for r in rs), n=len(rs), leader=lead['player'],
                          leadScore=lead['score'], stars=sum(r['stars'] or 0 for r in rs)))
    cards.sort(key=lambda c: (int(c['lobby']) if str(c['lobby']).isdigit() else 99, c['lobby']))

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
        grad = Image.new('RGB', (1, height))
        a = (7, 15, 36); b = (26, 15, 58)
        for y in range(height):
            t = (y / height) ** 1.4
            grad.putpixel((0, y), tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3)))
        self.im.paste(grad.resize((W, height)))
        rnd = random.Random(25)
        for _ in range(int(height / 7)):
            x, y = rnd.randrange(W), rnd.randrange(height); r = rnd.choice([1, 1, 2])
            self.d.ellipse((x, y, x + r, y + r), fill=rnd.choice(['#2a3c6e', '#3b4f86', '#5a3c8c', '#24507a']))

    def text(self, xy, s, size, color='fg', w='bold', anchor='la'):
        self.d.text(xy, str(s), font=F(size, w), fill=C.get(color, color), anchor=anchor)

    def fit(self, xy, s, maxw, size, color='fg', w='bold', anchor='la', minsize=18):
        while size > minsize and self.d.textlength(str(s), font=F(size, w)) > maxw: size -= 1
        self.text(xy, s, size, color, w, anchor)

    def neon(self, box, color, radius=22, width=3, fill='panel'):
        x0, y0, x1, y1 = [int(v) for v in box]
        glow = Image.new('RGBA', (x1 - x0 + 60, y1 - y0 + 60), (0, 0, 0, 0))
        ImageDraw.Draw(glow).rounded_rectangle((30, 30, 30 + x1 - x0, 30 + y1 - y0), radius, outline=C[color], width=8)
        glow = glow.filter(ImageFilter.GaussianBlur(10))
        glow.putalpha(glow.getchannel('A').point(lambda v: int(v * 0.5)))
        self.im.paste(glow, (x0 - 30, y0 - 30), glow)
        self.d.rounded_rectangle((x0, y0, x1, y1), radius, fill=C[fill], outline=C[color], width=width)

    def char(self, name, box, flip=False):
        im = Image.open(CHARS / name).convert('RGBA'); im = im.crop(im.getbbox())
        if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
        x0, y0, x1, y1 = [int(v) for v in box]; im.thumbnail((x1 - x0, y1 - y0), Image.LANCZOS)
        self.im.paste(im, (x0 + (x1 - x0 - im.width) // 2, y0 + (y1 - y0 - im.height) // 2), im)

    def title(self, x, y, s, right=None, rx=None, size=36):
        self.text((x, y), s, size, 'fg', 'black')
        if right: self.text((rx, y + 10), right, 20, 'mut', 'semi', 'ra')


def ordinal(n): return f'{n}{"th" if 10 <= n % 100 <= 20 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")}'


def plan(m):
    """Lay out the bottom boxes into two columns (PB table first, left), each next box
    going to the shorter column; the last box in the shorter column stretches so both
    columns end level. Returns sizes and placements."""
    cards = (len(m['cards']) + 1) // 2
    n10 = min(10, len(m['rows']))
    LW = 1010; RW = W - 2 * M - LW - 24
    nf = len(m['first'])
    def new_h(w): return 140 + max(1, nf if nf <= 4 or w > 900 else (nf + 1) // 2) * 118
    boxes = [('pb', LW, 122 + 50 * max(1, len(m['pbs'])) + 54)]
    rest = [('new', None, None), ('avg', None, 170), ('effort', None, 110 + 52 * max(1, len(m['shout']))),
            ('miles', None, 190)]
    cols = {'L': [boxes[0]], 'R': []}; height = {'L': boxes[0][2], 'R': -24}
    for name, _, h in rest:
        c = 'R' if height['R'] <= height['L'] else 'L'
        w = LW if c == 'L' else RW
        hh = new_h(w) if name == 'new' else h
        cols[c].append((name, w, hh)); height[c] += 24 + hh
    bottom = max(height.values())
    for c in cols:
        if cols[c] and height[c] < bottom:
            n, w, hh = cols[c][-1]; cols[c][-1] = (n, w, hh + bottom - height[c])
    return dict(cards=cards, n10=n10, cols=cols, bottom=bottom, LW=LW, RW=RW)


def render(model, out):
    m = model; clan = m['clan']; ev = m['event']; L = plan(m)
    H = (360 + 160 + L['cards'] * 252 + 50 + 160 + 330 + (140 + 54 * L['n10'] + 30) + 30
         + L['bottom'] + 30 + 300 + 40)
    p = Poster(H); d = p.d
    lobby_chars = ['AV_ExplodonSpider.png', 'AV_KaboomStar.png', 'AV_NexusThor.png', 'AV_SirionGamora.png',
                   'AV_ExplodonTerrorist.png', 'AV_GCIron.png', 'AV_BBDrax.png', 'AV_LBCA.png']

    # Header
    p.char('AV_ChickenHawkeye.png', (24, 16, 400, 340))
    p.char('AV_GNHulk.png', (W - 400, 16, W - 24, 340))
    p.text((W // 2, 46), clan, 112, 'fg', 'black', 'ma')
    p.text((W // 2, 176), 'SPACE RACE', 88, 'cyan', 'black', 'ma')
    p.text((W // 2, 290), f'{longdate(ev["date"])}  •  FINAL RESULTS', 30, 'fg', 'bold', 'ma')
    d.line((W // 2 - 440, 340, W // 2 + 440, 340), fill=C['cyan'], width=3)
    y = 370

    # KPI row
    kpis = [('PLAYERS', fmt(len(m['rows'])), 'cyan'),
            ('LOBBY' if len(m['cards']) == 1 else 'LOBBIES', fmt(len(m['cards'])), 'mag'),
            ('TOTAL LIGHTYEARS', ly(m['total']), 'white'), ('EARNED STARS', fmt(m['stars']), 'gold'),
            ('EARNED SPARKS', fmt(m['sparks']), 'green')]
    bw = (W - 2 * M - 4 * 18) // 5
    for i, (lab, val, col) in enumerate(kpis):
        x = M + i * (bw + 18)
        p.neon((x, y, x + bw, y + 136), col)
        p.fit((x + bw // 2, y + 22), val, bw - 30, 58, col if col != 'white' else 'fg', 'black', 'ma')
        p.text((x + bw // 2, y + 96), lab, 22, 'fg', 'semi', 'ma')
    y += 160

    # Lobby cards
    cw = (W - 2 * M - 22) // 2
    for i, c in enumerate(m['cards']):
        col = ['cyan', 'mag', 'green', 'purple', 'gold', 'cyan', 'mag', 'green'][i % 8]
        x = M + (i % 2) * (cw + 22); yy = y + (i // 2) * 252
        if i == len(m['cards']) - 1 and len(m['cards']) % 2 == 1: x = (W - cw) // 2
        p.neon((x, yy, x + cw, yy + 232), col)
        p.text((x + 26, yy + 18), f'LOBBY {c["lobby"]}', 38, col, 'black')
        p.fit((x + 250, yy + 28), f'#1 {c["leader"]}', cw - 280, 26, 'fg', 'bold')
        d.line((x + 22, yy + 74, x + cw - 22, yy + 74), fill='#2a3f6e', width=2)
        rank = f'#{c["potRank"]} of {fmt(c["potOf"])} all-time' if c.get('potRank') else ''
        p.text((x + 26, yy + 88), 'POT STARS', 18, 'mut', 'semi')
        p.text((x + 26, yy + 110), mill(c['pot']) if c['pot'] else '—', 44, col, 'black')
        if rank:
            d.rounded_rectangle((x + 24, yy + 166, x + 26 + d.textlength(rank, font=F(19, 'xbold')) + 24, yy + 198), 9,
                                fill='#2a2410', outline=C['gold'], width=2)
            p.text((x + 37, yy + 170), rank, 19, 'gold', 'xbold')
        cells = [(f'{clan} SHARE', f'{c["share"]*100:.0f}%'), ('RACERS', f'{c["n"]} / 9'), ('LIGHTYEARS', ly(c['dist']))]
        for j, (lab, val) in enumerate(cells):
            cx = x + 330 + (j % 2) * 180 if j < 2 else x + 330; cy = yy + 88 + (j // 2) * 70
            p.text((cx, cy), lab, 17, 'mut', 'semi')
            p.text((cx, cy + 21), val, 28, 'fg', 'xbold')
        p.char(lobby_chars[i % len(lobby_chars)], (x + cw - 210, yy + 82, x + cw - 18, yy + 222))
    y += L['cards'] * 252
    p.text((M + 6, y), 'Pot Stars = a racer\'s reward ÷ their share %. All-time rank compares every Space lobby logged on the site.',
           20, 'mut', 'med')
    y += 44

    # Change vs last race
    p.neon((M, y, W - M, y + 136), 'mag')
    p.text((M + 32, y + 22), 'CHANGE VS LAST RACE', 34, 'fg', 'black')
    if m['prior']:
        p.text((W - M - 32, y + 32), f'vs {shortdate(m["prior"]["date"])} · {len(m["rows"])} logged vs {len(m["priorRows"])}',
               22, 'mut', 'semi', 'ra')
        for j, (lab, now, was) in enumerate([('TOTAL LIGHTYEARS', m['total'], m['ptotal']),
                                             ('AVG / PLAYER', m['avg'], m['pavg'])]):
            x = M + 32 + j * 860; ch = now / was - 1 if was else 0
            p.text((x, y + 84), lab, 22, 'mut', 'semi')
            p.text((x + 300, y + 74), ly(now), 40, 'fg', 'black')
            p.text((x + 790, y + 74), pct(ch), 40, 'green' if ch >= 0 else 'red', 'black', 'ra')
    else:
        p.text((M + 32, y + 84), 'First tracked race for this clan.', 26, 'mut', 'semi')
    y += 160

    # Spotlights
    p.neon((M, y, W - M, y + 306), 'purple')
    p.title(M + 32, y + 22, 'INDIVIDUAL SPOTLIGHTS', f'Clan league {shortdate(m["leagueStart"])} – {shortdate(m["leagueEnd"])}', W - M - 32, 34)
    top = m['rows'][0]; bva = m['bestVsAvg']
    spots = [('RACE LEADER', top['player'], ly(top['score']), 'Highest distance this race', 'gold'),
             ('BIGGEST JUMP VS OWN AVG', bva['name'] if bva else '—', pct(bva['gain']) if bva else '—',
              f'{ly(bva["score"])} vs {ly(bva["avg"])} avg ({bva["n"]} races)' if bva else 'Needs 3+ earlier races', 'green'),
             ('LEAGUE DISTANCE LEADER', m['leagueDist'][0] if m['leagueDist'] else '—',
              ly(m['leagueDist'][1]) if m['leagueDist'] else '—', 'Space distance this league', 'cyan'),
             ('LEAGUE SPARKS LEADER', m['leagueSparks'][0] if m['leagueSparks'] else '—',
              fmt(m['leagueSparks'][1]) if m['leagueSparks'] else '—', 'Sparks, all events this league', 'mag')]
    sw = (W - 2 * M - 64 - 3 * 16) // 4
    for i, (lab, name, val, note, col) in enumerate(spots):
        x = M + 32 + i * (sw + 16); yy = y + 84
        d.rounded_rectangle((x, yy, x + sw, yy + 196), 16, fill=C['row'])
        p.fit((x + 18, yy + 16), lab, sw - 36, 19, col, 'xbold')
        p.fit((x + 18, yy + 48), name, sw - 36, 30, 'fg', 'black')
        p.fit((x + 18, yy + 92), val, sw - 36, 46, col, 'black')
        p.fit((x + 18, yy + 158), note, sw - 36, 18, 'mut', 'med')
    y += 330

    # Top 10
    n10 = L['n10']; th = 140 + 54 * n10
    p.neon((M, y, W - M, y + th), 'cyan')
    p.title(M + 32, y + 22, 'TOP 10  /  LIGHTYEARS', f'ALL-TIME RANK AMONG {fmt(m["allTimeN"])} SPACE RESULTS', W - M - 32, 34)
    cols = [(M + 50, '#', 'ma'), (M + 96, 'PLAYER', 'la'), (820, 'LIGHTYEARS', 'ra'), (1030, 'STARS', 'ra'),
            (1220, 'SPARKS', 'ra'), (1350, 'SHARE', 'ra'), (1520, 'SP / B', 'ra'), (W - M - 36, 'ALL-TIME', 'ra')]
    hy = y + 82
    d.rectangle((M + 24, hy - 6, W - M - 24, hy + 32), fill=C['row'])
    for x, lab, a in cols: p.text((x, hy), lab, 19, 'mut', 'semi', a)
    for i, r in enumerate(m['rows'][:10]):
        ry = y + 128 + i * 54
        if i % 2 == 0: d.rectangle((M + 24, ry - 8, W - M - 24, ry + 44), fill=C['row2'])
        badge = {0: 'gold', 1: 'cyan', 2: 'mag'}.get(i)
        if badge:
            d.rounded_rectangle((M + 30, ry - 2, M + 70, ry + 36), 7, fill=C[badge])
            p.text((M + 50, ry + 2), i + 1, 26, '#0a1530', 'black', 'ma')
        else:
            p.text((M + 50, ry + 2), i + 1, 26, 'fg', 'bold', 'ma')
        p.fit((M + 96, ry + 2), r['player'], 560, 28, 'gold' if i == 0 else 'fg', 'bold')
        sh = r['metadata'].get('share')
        vals = [(820, ly(r['score']), 'fg'), (1030, fmt(r['stars']) if r['stars'] is not None else '—', 'gold'),
                (1220, fmt(r['sparks']) if r['sparks'] is not None else '—', 'green'),
                (1350, f'{sh*100:g}%' if sh else '—', 'fg'),
                (1520, fmt(r['sparks'] / r['score'], 1) if r.get('sparks') else '—', 'cyan'),
                (W - M - 36, f'{m["allTimeRank"][r["player"]]} / {fmt(m["allTimeN"])}', 'cyan')]
        for x, v, col in vals: p.text((x, ry + 4), v, 26, col, 'semi', 'ra')
    y += th + 30

    # Bottom: two balanced columns
    def box_pb(x, y0, w, h):
        p.neon((x, y0, x + w, y0 + h), 'gold')
        p.title(x + 28, y0 + 22, 'PERSONAL BESTS', None, None, 34)
        n = str(len(m['pbs']))
        p.text((x + w - 28, y0 + 22), n, 40, 'gold', 'black', 'ra')
        p.text((x + w - 40 - d.textlength(n, font=F(40, 'black')), y0 + 34), 'NEW', 22, 'fg', 'xbold', 'ra')
        cols = [(x + 46, '#', 'ma'), (x + 78, 'PLAYER', 'la'), (x + 560, 'PREVIOUS', 'ra'), (x + 690, 'DATE', 'ra'),
                (x + 860, 'NEW PB', 'ra'), (x + w - 28, 'GAIN', 'ra')]
        hy = y0 + 78
        d.rectangle((x + 20, hy - 6, x + w - 20, hy + 30), fill=C['row'])
        for cx, lab, a in cols: p.text((cx, hy), lab, 18, 'mut', 'semi', a)
        if not m['pbs']: p.text((x + 40, y0 + 130), 'No new PBs this race.', 26, 'mut', 'semi')
        for i, b in enumerate(m['pbs']):
            ry = y0 + 122 + i * 50
            if i % 2 == 0: d.rectangle((x + 20, ry - 8, x + w - 20, ry + 40), fill=C['row2'])
            p.text((x + 46, ry + 2), i + 1, 22, 'gold', 'black', 'ma')
            p.fit((x + 78, ry + 1), b['name'], 380, 26, 'fg', 'bold')
            p.text((x + 560, ry + 3), ly(b['old']), 24, 'mut', 'semi', 'ra')
            p.text((x + 690, ry + 5), shortdate(b['oldDate']), 20, 'mut', 'med', 'ra')
            p.text((x + 860, ry + 1), ly(b['new']), 26, 'gold', 'black', 'ra')
            p.text((x + w - 28, ry + 2), pct(b['imp']), 24, 'green', 'xbold', 'ra')
        p.text((x + 28, y0 + h - 34), "Compared with each player's best anywhere on the site.", 18, 'mut', 'med')

    def box_new(x, y0, w, h):
        nf = m['first']
        p.neon((x, y0, x + w, y0 + h), 'mag', width=4)
        p.text((x + 26, y0 + 20), 'NEW FACES', 46, 'mag', 'black')
        p.text((x + 26, y0 + 74), 'First tracked Space Race', 22, 'fg', 'semi')
        p.char('AV_LBCA.png', (x + w - 160, y0 + 10, x + w - 16, y0 + 120))
        if not nf:
            p.text((x + 26, y0 + 136), 'No first-time racers this week.', 24, 'mut', 'semi'); return
        two = len(nf) > 4 and w < 900
        colw = (w - 52 - (16 if two else 0)) // (2 if two else 1)
        per = (len(nf) + 1) // 2 if two else len(nf)
        ch = max(70, min(118, (h - 150) // max(1, per) - 14))
        for i, r in enumerate(nf):
            cx = x + 26 + ((i % 2) * (colw + 16) if two else 0)
            cy = y0 + 128 + ((i // 2) if two else i) * (ch + 14)
            d.rounded_rectangle((cx, cy, cx + colw, cy + ch), 14, fill=C['row'], outline=C['mag'], width=3)
            p.fit((cx + 18, cy + 12), r['player'], colw - 200, 34 if ch >= 100 else 28, 'fg', 'black')
            p.text((cx + colw - 18, cy + 10), ly(r['score']), 36 if ch >= 100 else 28, 'cyan', 'black', 'ra')
            if ch >= 90:
                md = r['metadata']; grp = md.get('group'); rk = md.get('rank')
                bits = [f'Lobby {grp}' if grp is not None else None, f'{ordinal(rk)} place' if rk else None,
                        f'{fmt(r["stars"])} Stars' if r.get('stars') is not None else None]
                p.fit((cx + 18, cy + ch - 38), '  ·  '.join(b for b in bits if b), colw - 36, 22, 'mut', 'semi')

    def box_avg(x, y0, w, h):
        p.neon((x, y0, x + w, y0 + h), 'cyan')
        p.text((x + 26, y0 + 18), 'ABOVE OWN AVERAGE', 30, 'fg', 'black')
        p.text((x + 26, y0 + 70), f'{m["above"]} / {m["eligible"]}', 62, 'green', 'black')
        tx = x + 46 + d.textlength(f'{m["above"]} / {m["eligible"]}', font=F(62, 'black'))
        p.text((tx, y0 + 84), 'returning racers beat', 22, 'fg', 'semi')
        p.text((tx, y0 + 112), 'their own earlier average', 22, 'fg', 'semi')

    def box_effort(x, y0, w, h):
        p.neon((x, y0, x + w, y0 + h), 'purple')
        p.text((x + 26, y0 + 18), 'EFFORT SHOUTOUT', 30, 'fg', 'black')
        p.text((x + 26, y0 + 58), 'Lowest Sparks per billion LY · 100B+ raced', 18, 'mut', 'semi')
        for i, r in enumerate(m['shout']):
            sy = y0 + 96 + i * 52
            p.fit((x + 26, sy), r['player'], w - 330, 26, 'fg', 'bold')
            p.text((x + w - 190, sy + 2), ly(r['score']), 22, 'cyan', 'semi', 'ra')
            p.text((x + w - 26, sy), f'{fmt(r["sparks"]/r["score"],1)} Sp/B', 24, 'gold', 'black', 'ra')
        if not m['shout']: p.text((x + 26, y0 + 96), 'No racers at 100B+ this time.', 22, 'mut', 'semi')

    def box_miles(x, y0, w, h):
        p.neon((x, y0, x + w, y0 + h), 'gold')
        p.text((x + 26, y0 + 18), 'DISTANCE MILESTONES', 30, 'fg', 'black')
        tiers = m['tiers'] or [(100, 0)]
        for i, (t, n) in enumerate(tiers):
            cx = x + 26 + (i % 2) * ((w - 52) // 2); cy = y0 + 70 + (i // 2) * 56
            p.text((cx, cy), str(n), 42, ['cyan', 'mag', 'gold', 'green'][i % 4], 'black')
            p.text((cx + d.textlength(str(n), font=F(42, 'black')) + 14, cy + 14), f'{fmt(t)}B+', 22, 'fg', 'semi')

    draw = dict(pb=box_pb, new=box_new, avg=box_avg, effort=box_effort, miles=box_miles)
    for c, x in (('L', M), ('R', M + L['LW'] + 24)):
        yy = y
        for name, w, h in L['cols'][c]:
            draw[name](x, yy, w, h); yy += h + 24
    y += L['bottom'] + 30

    # Footer
    p.neon((M, y, W - M, y + 280), 'cyan')
    p.char('AV_MZGroot.png', (M + 24, y + 20, M + 300, y + 262))
    p.char('AV_RaccoonRocket.png', (W - M - 300, y + 20, W - M - 24, y + 262))
    cx = W // 2
    p.text((cx, y + 30), f'{clan}  /  SPACE RACE', 34, 'cyan', 'black', 'ma')
    p.text((cx, y + 78), f'{longdate(ev["date"])}  •  RECORDED RESULTS', 22, 'fg', 'bold', 'ma')
    notes = ['Results count for the clan each player raced for in this race.',
             'Rounded Star rewards use exact Sparks × 10.',
             'Final screenshots only · coverage partial' if not m['complete'] else 'Final screenshots · full coverage']
    for i, s in enumerate(notes): p.text((cx, y + 126 + i * 32), s, 20, 'mut', 'med', 'ma')
    p.text((cx, y + 232), 'AVENGERS STAT CENTER', 26, 'gold', 'black', 'ma')
    final_h = y + 280 + 30
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
