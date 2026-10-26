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
TEMPLATE = 'space-poster-v4-20261026-candidate'
ARENA_START = '2026-08-01'  # site meta.arenaStart
SIGNATURE = 'AV-HarryBallsagna'
SIG_FONT = Path(__file__).resolve().parents[1] / 'assets' / 'fonts' / 'GreatVibes-Regular.ttf'
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


def lobby_pot_ranks(space, upto, since=None):
    """Python port of event-reward-metrics.js lobbyPots(): pot = Stars / share of the
    highest-share row with known Stars; share >= 1 is a percent. Ranked across every
    logged lobby up to and including `upto`. Returns {(date, group): (rank, of)}."""
    pots = []
    for e in space:
        if e['date'] > upto or (since and e['date'] < since): continue
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
    arena_scores = [r['score'] for e in space if ARENA_START <= e['date'] <= event['date'] for r in e['rows'] if r.get('score') is not None]
    def arena_rank(score): return 1 + sum(1 for s in arena_scores if s > score)
    # All-time lobby wins and podiums (any clan), through this race.
    finishes = {}
    for e in space:
        if e['date'] > event['date']: continue
        for r in e['rows']:
            k = (r.get('metadata') or {}).get('rank')
            if isinstance(k, int) and 1 <= k <= 3:
                w, pd_ = finishes.get(r['player'], (0, 0)); finishes[r['player']] = (w + (k == 1), pd_ + 1)
    # This race plus the clan's previous four Space races.
    recent = []
    for e in [x for x in space if x['date'] <= event['date']][::-1]:
        rr = [r['score'] for r in e['rows'] if r['clan'] == clan and r.get('score') is not None]
        if rr: recent.append(dict(date=e['date'], n=len(rr), total=sum(rr), avg=sum(rr) / len(rr)))
        if len(recent) == 5: break
    arena_counts = [c for c in ([r['score'] for r in e['rows'] if r['clan'] == clan and r.get('score') is not None]
                                for e in space if ARENA_START <= e['date'] <= event['date']) if c]

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
    pot_rank_arena = lobby_pot_ranks(space, event['date'], ARENA_START)
    cards = []
    for L, rs in lobbies.items():
        known = [r for r in rs if r.get('stars') and r['metadata'].get('share')]
        top_share = max(known, key=lambda r: r['metadata']['share']) if known else None
        pot = top_share['stars'] / top_share['metadata']['share'] if top_share else None
        lead = max(rs, key=lambda r: r['score'])
        grp = str(rs[0]['metadata'].get('group'))
        rk = pot_rank.get((event['date'], grp)); ra = pot_rank_arena.get((event['date'], grp))
        cards.append(dict(lobby=grp, potRank=rk[0] if rk else None, potOf=rk[1] if rk else None,
                          potRankArena=ra[0] if ra else None, potOfArena=ra[1] if ra else None, pot=pot, share=sum(r['metadata'].get('share') or 0 for r in rs),
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
            if e['kind'] == 'space' and r.get('sparks') is not None:  # Space only
                league_sparks[r['player']] = league_sparks.get(r['player'], 0) + r['sparks']
    ld = max(league_dist.items(), key=lambda x: x[1]) if league_dist else None
    ls = max(league_sparks.items(), key=lambda x: x[1]) if league_sparks else None

    total = sum(r['score'] for r in rows)
    ptotal = sum(r['score'] for r in prior_rows)
    shout = sorted([r for r in rows if r['score'] >= 100 and r.get('sparks') is not None],
                   key=lambda r: r['sparks'] / r['score'])[:3]
    tiers = []
    # Every 100B, keeping a tier only when it holds more racers than the next one up
    # (leader, 2026-10-26): e.g. 700B+, 800B+, 900B+ drop when they equal 1,000B+.
    cnt = lambda t: sum(1 for r in rows if r['score'] >= t)
    for t in range(100, int(max(r['score'] for r in rows) // 100) * 100 + 1, 100):
        n = cnt(t)
        if not n or n == cnt(t + 100): continue
        cnts = [sum(1 for v in c if v >= t) for c in arena_counts]
        tiers.append((t, n, 1 + sum(1 for c in cnts if c > n), len(arena_counts), sum(1 for c in cnts if c == n) > 1))
    return dict(event=event, clan=clan, rows=rows, prior=prior, priorRows=prior_rows, total=total,
                avg=total / len(rows), ptotal=ptotal, pavg=ptotal / len(prior_rows) if prior_rows else None,
                stars=sum(r['stars'] or 0 for r in rows), sparks=sum(r['sparks'] or 0 for r in rows),
                derived=sum(1 for r in rows if r['metadata'].get('starsDerived')),
                pbs=pbs, first=sorted(first, key=lambda r: -r['score']), above=above, eligible=eligible,
                bestVsAvg=best_vs_avg, cards=cards, leagueStart=lstart.isoformat(), leagueEnd=lend.isoformat(),
                leagueDist=ld, leagueSparks=ls, shout=shout, tiers=tiers, recent=recent, finishes=finishes,
                allTimeRank={r['player']: alltime_rank(r['score']) for r in rows[:10]}, allTimeN=len(all_scores),
                arenaRank={r['player']: arena_rank(r['score']) for r in rows[:10]}, arenaN=len(arena_scores),
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
    boxes = [('pb', LW, 122 + 50 * max(1, len(m['pbs'])) + 20)]
    rest = [('new', None, None), ('avg', None, 170), ('effort', None, 110 + 52 * max(1, len(m['shout']))),
            ('miles', None, 116 + max(1, len(m['tiers'])) * 48 + 16)]
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
    CH = 82 + 40 + 6 * 50 + 24
    H = (370 + 160 + L['cards'] * 282 + 10 + CH + 24 + 330 + (140 + 54 * L['n10'] + 30) + 30
         + L['bottom'] + 30 + 250 + 40)
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
        x = M + (i % 2) * (cw + 22); yy = y + (i // 2) * 282
        if i == len(m['cards']) - 1 and len(m['cards']) % 2 == 1: x = (W - cw) // 2
        p.neon((x, yy, x + cw, yy + 262), col)
        p.text((x + 26, yy + 18), f'LOBBY {c["lobby"]}', 38, col, 'black')
        p.fit((x + 250, yy + 28), f'#1 {c["leader"]}', cw - 280, 26, 'fg', 'bold')
        d.line((x + 22, yy + 74, x + cw - 22, yy + 74), fill='#2a3f6e', width=2)
        rank = (f'#{c["potRank"]} of {fmt(c["potOf"])} all time  ·  #{c["potRankArena"]} of {fmt(c["potOfArena"])} arena era'
                if c.get('potRank') and c.get('potRankArena') else (f'#{c["potRank"]} of {fmt(c["potOf"])} all time' if c.get('potRank') else ''))
        p.text((x + 26, yy + 88), 'POT STARS', 18, 'mut', 'semi')
        p.text((x + 26, yy + 110), mill(c['pot']) if c['pot'] else '—', 44, col, 'black')
        if rank:
            rank = 'POT RANK  ' + rank
            d.rounded_rectangle((x + 24, yy + 214, x + 26 + d.textlength(rank, font=F(19, 'xbold')) + 24, yy + 246), 9,
                                fill='#2a2410', outline=C['gold'], width=2)
            p.text((x + 37, yy + 218), rank, 19, 'gold', 'xbold')
        cells = [(f'{clan} SHARE', f'{c["share"]*100:.0f}%'), ('RACERS', f'{c["n"]} / 9'), ('LIGHTYEARS', ly(c['dist']))]
        for j, (lab, val) in enumerate(cells):
            cx = x + 330 + (j % 2) * 180 if j < 2 else x + 330; cy = yy + 88 + (j // 2) * 70
            p.text((cx, cy), lab, 17, 'mut', 'semi')
            p.text((cx, cy + 21), val, 28, 'fg', 'xbold')
        p.char(lobby_chars[i % len(lobby_chars)], (x + cw - 210, yy + 82, x + cw - 18, yy + 250))
    y += L['cards'] * 282 + 10

    # Change vs the previous four races
    rec = m['recent']; cur = rec[0]
    p.neon((M, y, W - M, y + CH), 'mag')
    p.title(M + 32, y + 22, 'CHANGE VS LAST 4 SPACE RACES', None, None, 34)
    lab = shortdate(cur['date']).upper()
    hx = [(M + 40, 'RACE', 'la'), (720, 'PLAYERS', 'ra'), (980, 'TOTAL LIGHTYEARS', 'ra'), (1170, f'{lab} VS', 'ra'),
          (1460, 'AVG / PLAYER', 'ra'), (W - M - 40, f'{lab} VS', 'ra')]
    hy = y + 82; d.rectangle((M + 24, hy - 6, W - M - 24, hy + 30), fill=C['row'])
    for cx, t, a in hx: p.text((cx, hy), t, 19, 'mut', 'semi', a)
    prev = rec[1:]
    avgrow = dict(label='4-RACE AVERAGE', n=sum(r['n'] for r in prev) / len(prev), total=sum(r['total'] for r in prev) / len(prev),
                  avg=sum(r['total'] for r in prev) / sum(r['n'] for r in prev)) if prev else None
    rows5 = [dict(r, label=shortdate(r['date']).upper()) for r in rec] + ([avgrow] if avgrow else [])
    for i, r in enumerate(rows5):
        ry = y + 128 + i * 50; this = i == 0; avgr = r is avgrow
        if this: d.rounded_rectangle((M + 24, ry - 8, W - M - 24, ry + 40), 8, fill='#1d1240', outline=C['mag'], width=2)
        elif i % 2 == 0: d.rectangle((M + 24, ry - 8, W - M - 24, ry + 40), fill=C['row2'])
        if avgr: d.line((M + 24, ry - 9, W - M - 24, ry - 9), fill='#2a3f6e', width=2)
        p.text((M + 40, ry + 2), ('THIS RACE · ' if this else '') + r['label'], 24, 'mag' if this else ('cyan' if avgr else 'fg'), 'black' if this or avgr else 'bold')
        p.text((720, ry + 2), fmt(round(r['n'])) if not avgr else f'{r["n"]:.1f}', 24, 'fg', 'semi', 'ra')
        p.text((980, ry + 2), ly(r['total']), 26, 'fg', 'black' if this else 'semi', 'ra')
        p.text((1460, ry + 2), ly(r['avg']), 26, 'fg', 'black' if this else 'semi', 'ra')
        if not this:
            for cx, k in ((1170, 'total'), (W - M - 40, 'avg')):
                ch = cur[k] / r[k] - 1; p.text((cx, ry + 2), pct(ch), 26, 'green' if ch >= 0 else 'red', 'xbold', 'ra')
    y += CH + 24

    # Spotlights
    p.neon((M, y, W - M, y + 306), 'purple')
    p.title(M + 32, y + 22, 'INDIVIDUAL SPOTLIGHTS', f'Clan league {shortdate(m["leagueStart"])} – {shortdate(m["leagueEnd"])}', W - M - 32, 34)
    top = m['rows'][0]; bva = m['bestVsAvg']
    spots = [('RACE LEADER', top['player'], ly(top['score']), 'Highest distance this race', 'gold'),
             ('BIGGEST JUMP VS OWN AVG', bva['name'] if bva else '—', pct(bva['gain']) if bva else '—',
              f'{ly(bva["score"])} vs {ly(bva["avg"])} avg ({bva["n"]} races)' if bva else 'Needs 3+ earlier races', 'green'),
             ('LEAGUE SPACE DISTANCE LEADER', m['leagueDist'][0] if m['leagueDist'] else '—',
              ly(m['leagueDist'][1]) if m['leagueDist'] else '—', 'Space distance only, this league', 'cyan'),
             ('LEAGUE SPACE SPARKS LEADER', m['leagueSparks'][0] if m['leagueSparks'] else '—',
              fmt(m['leagueSparks'][1]) if m['leagueSparks'] else '—', 'Space Sparks only, this league', 'mag')]
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
    p.title(M + 32, y + 22, 'TOP 10  /  LIGHTYEARS', f'ALL TIME (ARENA ERA) RANK AMONG {fmt(m["allTimeN"])} ({fmt(m["arenaN"])}) SPACE RESULTS', W - M - 32, 34)
    cols = [(M + 50, '#', 'ma'), (M + 96, 'PLAYER', 'la'), (590, 'LIGHTYEARS', 'ra'), (770, 'STARS', 'ra'), (860, 'SHARE', 'ra'),
            (985, 'SP / B', 'ra'), (1135, 'ALL-TIME 1STS', 'ra'), (1315, 'ALL-TIME PODIUMS', 'ra'), (1515, 'ALL-TIME RANK', 'ra'),
            (W - M - 36, 'ARENA-ERA RANK', 'ra')]
    hy = y + 82
    d.rectangle((M + 24, hy - 6, W - M - 24, hy + 32), fill=C['row'])
    for x, lab, a in cols: p.text((x, hy + 1), lab, 17, 'mut', 'semi', a)
    for i, r in enumerate(m['rows'][:10]):
        ry = y + 128 + i * 54
        if i % 2 == 0: d.rectangle((M + 24, ry - 8, W - M - 24, ry + 44), fill=C['row2'])
        badge = {0: 'gold', 1: 'cyan', 2: 'mag'}.get(i)
        if badge:
            d.rounded_rectangle((M + 30, ry - 2, M + 70, ry + 36), 7, fill=C[badge])
            p.text((M + 50, ry + 2), i + 1, 26, '#0a1530', 'black', 'ma')
        else:
            p.text((M + 50, ry + 2), i + 1, 26, 'fg', 'bold', 'ma')
        p.fit((M + 96, ry + 2), r['player'], 320, 28, 'gold' if i == 0 else 'fg', 'bold')
        sh = r['metadata'].get('share'); wins, pods = m['finishes'].get(r['player'], (0, 0))
        vals = [(590, ly(r['score']), 'fg'), (770, fmt(r['stars']) if r['stars'] is not None else '—', 'gold'),
                (860, f'{sh*100:g}%' if sh else '—', 'fg'),
                (985, fmt(r['sparks'] / r['score'], 1) if r.get('sparks') else '—', 'green'),
                (1135, str(wins), 'gold' if wins else 'mut'), (1315, str(pods), 'mag' if pods else 'mut'),
                (1515, f'{m["allTimeRank"][r["player"]]} / {fmt(m["allTimeN"])}', 'fg'),
                (W - M - 36, f'{m["arenaRank"][r["player"]]} / {fmt(m["arenaN"])}', 'cyan')]
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
        p.neon((x, y0, x + w, y0 + h), 'gold'); p.text((x + 26, y0 + 18), 'DISTANCE MILESTONES', 30, 'fg', 'black')
        hy = y0 + 70; d.rectangle((x + 18, hy - 6, x + w - 18, hy + 28), fill=C['row'])
        p.text((x + 30, hy), 'DISTANCE', 18, 'mut', 'semi'); p.text((x + w * 0.52, hy), 'RACERS', 18, 'mut', 'semi', 'ra')
        p.text((x + w - 30, hy), 'ARENA-ERA RANK', 18, 'mut', 'semi', 'ra')
        if not m['tiers']: p.text((x + 30, y0 + 116), 'No racers at 100B+ this time.', 22, 'mut', 'semi')
        for i, (t, n, r, of, tie) in enumerate(m['tiers']):
            ry = y0 + 116 + i * 48
            if i % 2 == 0: d.rectangle((x + 18, ry - 8, x + w - 18, ry + 38), fill=C['row2'])
            p.text((x + 30, ry), f'{fmt(t)}B+', 26, 'fg', 'xbold')
            p.text((x + w * 0.52, ry - 2), str(n), 30, ['cyan', 'mag', 'gold', 'green'][i % 4], 'black', 'ra')
            p.text((x + w - 30, ry + 1), f'{"T-" if tie else ""}#{r} of {of}', 26, 'gold' if r == 1 else 'fg', 'xbold' if r <= 3 else 'semi', 'ra')

    draw = dict(pb=box_pb, new=box_new, avg=box_avg, effort=box_effort, miles=box_miles)
    for c, x in (('L', M), ('R', M + L['LW'] + 24)):
        yy = y
        for name, w, h in L['cols'][c]:
            draw[name](x, yy, w, h); yy += h + 24
    y += L['bottom'] + 30

    # Footer
    p.neon((M, y, W - M, y + 250), 'cyan')
    p.char('AV_MZGroot.png', (M + 24, y + 18, M + 270, y + 232))
    p.char('AV_RaccoonRocket.png', (W - M - 270, y + 18, W - M - 24, y + 232))
    cx = W // 2
    p.text((cx, y + 26), f'{clan}  /  SPACE RACE', 34, 'cyan', 'black', 'ma')
    p.text((cx, y + 74), f'{longdate(ev["date"])}  •  FINAL RESULTS', 22, 'fg', 'bold', 'ma')
    d.text((cx, y + 104), SIGNATURE, font=ImageFont.truetype(str(SIG_FONT), 72), fill=C['mag'], anchor='ma')
    p.text((cx, y + 196), 'AVENGERS STAT CENTER', 26, 'gold', 'black', 'ma')
    final_h = y + 250 + 30
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
