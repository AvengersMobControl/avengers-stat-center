#!/usr/bin/env python3
"""Weekly Piggy Flash Set poster, same visual system as the Space and Big Pig posters.

Usage:
  python3 scripts/render-flash-poster.py reports/approved-summary-release.json out.png --clan AVENGERS [--set-id 2026-10-20-A]

Reads ONLY the approved canonical export. Leader rules (2026-10-25/26):
- Results count for the clan each player raced for in that Flash (event-time clan).
- PBs compare with the player's best anywhere on the site, any clan.
- Every rank counts all logged results: all clans, former and current members.
- Ranks show ALL TIME and ARENA ERA (since 2026-08-01). Milestones are listed with an Arena-era rank.
- League leaders count Flash only. No Sparks-per-line. Minimal fine print. Signed AV-HarryBallsagna.
Writes a sidecar JSON with readyToPost:false. Never posts anything.
"""
import argparse, collections, datetime as dt, hashlib, importlib.util, json
from pathlib import Path
from PIL import ImageFont

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location('space_poster', ROOT / 'scripts' / 'render-space-poster.py')
SP = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(SP)
Poster, F, C, W, M = SP.Poster, SP.F, SP.C, SP.W, SP.M
fmt, pct, shortdate, mill, ordinal = SP.fmt, SP.pct, SP.shortdate, SP.mill, SP.ordinal
TEMPLATE = 'flash-poster-v2-20261026-candidate'
ARENA_START = '2026-08-01'  # site meta.arenaStart
SIGNATURE = 'AV-HarryBallsagna'
SIG_FONT = ROOT / 'assets' / 'fonts' / 'GreatVibes-Regular.ttf'
TIERS = [1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000]
PF_COLORS = {1: 'cyan', 2: 'mag', 3: 'green', 4: 'purple'}
PF_CHARS = {1: 'AV_GCIron.png', 2: 'AV_SirionGamora.png', 3: 'AV_ExplodonSpider.png', 4: 'AV_NexusThor.png'}
def lines(v): return fmt(v)
def klines(v): return f'{v/1000:g}K'
def rk(n, of): return f'{n} / {fmt(of)}'


def set_label(dates):
    a, b = dt.date.fromisoformat(min(dates)), dt.date.fromisoformat(max(dates))
    if a == b: return a.strftime('%b %d').replace(' 0', ' ')
    if a.month == b.month: return f'{a.strftime("%b")} {a.day}–{b.day}'
    return f'{a.strftime("%b")} {a.day}–{b.strftime("%b")} {b.day}'


def long_label(dates):
    a, b = dt.date.fromisoformat(min(dates)), dt.date.fromisoformat(max(dates))
    if a == b: return a.strftime('%B %d, %Y').replace(' 0', ' ').upper()
    if a.month == b.month: return f'{a.strftime("%B").upper()} {a.day}–{b.day}, {b.year}'
    return f'{a.strftime("%B").upper()} {a.day}–{b.strftime("%B").upper()} {b.day}, {b.year}'


def build_model(R, clan, set_id=None):
    P = R['projection']
    fl = sorted([e for e in P['events'] if e['kind'] == 'flash' and e['status'] != 'revoked'],
                key=lambda e: (e['date'], (e.get('metadata') or {}).get('flash') or 0))
    sid = lambda e: e['metadata']['setId']
    order = []
    for e in fl:
        if sid(e) not in order: order.append(sid(e))
    sets = {s: [e for e in fl if sid(e) == s] for s in order}
    if not set_id: set_id = [s for s in order if any(r['clan'] == clan for e in sets[s] for r in e['rows'])][-1]
    cur = sets[set_id]; pos = order.index(set_id)
    earlier_sets = order[:pos]; upto = max(e['date'] for e in cur)
    set_dates = {s: [e['date'] for e in sets[s]] for s in order}
    first_date = {s: min(set_dates[s]) for s in order}
    arena_sets = [s for s in order[:pos + 1] if first_date[s] >= ARENA_START]

    rows = [(e, r) for e in cur for r in e['rows'] if r['clan'] == clan and r.get('score') is not None]
    if not rows: raise SystemExit(f'No {clan} rows in {set_id}')
    pf = lambda e: e['metadata'].get('flash')

    # Per-player set totals for this set (this clan).
    tot = collections.defaultdict(lambda: dict(score=0, stars=0, sparks=0, pfs=set(), best=None))
    for e, r in rows:
        t = tot[r['player']]; t['score'] += r['score']; t['stars'] += r.get('stars') or 0; t['sparks'] += r.get('sparks') or 0
        t['pfs'].add(pf(e))
        if t['best'] is None or r['score'] > t['best'][0]: t['best'] = (r['score'], pf(e), e['date'])
    players = sorted(tot, key=lambda p: -tot[p]['score'])

    # History through the earlier sets: every clan, every member.
    def set_totals(s):
        d = collections.defaultdict(int)
        for e in sets[s]:
            for r in e['rows']:
                if r.get('score') is not None: d[r['player']] += r['score']
        return d
    hist_set = collections.defaultdict(list); hist_one = collections.defaultdict(list)
    for s in earlier_sets:
        for p, v in set_totals(s).items(): hist_set[p].append((first_date[s], v))
        for e in sets[s]:
            for r in e['rows']:
                if r.get('score') is not None: hist_one[r['player']].append((e['date'], r['score'], pf(e)))

    # All results through this set (any clan) for ranks.
    every_set = [v for s in order[:pos + 1] for v in set_totals(s).values()]
    arena_set = [v for s in arena_sets for v in set_totals(s).values()]
    every_one = [r['score'] for s in order[:pos + 1] for e in sets[s] for r in e['rows'] if r.get('score') is not None]
    arena_one = [r['score'] for s in arena_sets for e in sets[s] for r in e['rows'] if r.get('score') is not None]
    def rank(v, pool): return 1 + sum(1 for x in pool if x > v)

    # All-time Flash finishes (any clan, any lobby) through this set.
    fin = collections.defaultdict(lambda: [0, 0])
    for s in order[:pos + 1]:
        for e in sets[s]:
            for r in e['rows']:
                k = (r.get('metadata') or {}).get('rank')
                if isinstance(k, int) and 1 <= k <= 3:
                    fin[r['player']][1] += 1; fin[r['player']][0] += k == 1

    # PF cards: main-lobby pot, ranks (PF-specific and all-PF), all time and Arena era.
    pots = [(e['metadata']['potStars'], pf(e), e['date']) for s in order[:pos + 1] for e in sets[s] if e['metadata'].get('potStars')]
    cards = []
    for e in cur:
        md = e['metadata']; p = md.get('potStars')
        cr = [r for r in e['rows'] if r['clan'] == clan and r.get('score') is not None]
        main = [r for r in cr if (r.get('metadata') or {}).get('lobby') in (None, 'main')]
        sec = [r for r in cr if (r.get('metadata') or {}).get('lobby') not in (None, 'main')]
        top = min(main, key=lambda r: r['metadata'].get('rank') or 99) if main else None
        stop = min(sec, key=lambda r: r['metadata'].get('rank') or 99) if sec else None
        def prk(pool): return (1 + sum(1 for q in pool if q[0] > p), len(pool)) if p else None
        cards.append(dict(pf=pf(e), date=e['date'], pot=p, lines=sum(r['score'] for r in cr), n=len(cr),
                          share=(sum(r.get('stars') or 0 for r in main) / p) if p else None,
                          top=top['player'] if top else None, sectop=stop['player'] if stop else None,
                          pfAll=prk([q for q in pots if q[1] == pf(e)]), pfArena=prk([q for q in pots if q[1] == pf(e) and q[2] >= ARENA_START]),
                          allAll=prk(pots), allArena=prk([q for q in pots if q[2] >= ARENA_START])))

    # Personal bests (vs best anywhere, any clan), first-tracked players, above own average.
    set_pbs, one_pbs, first = [], [], []
    above_one = elig_one = above_set = elig_set = 0; bva = None
    for p in players:
        t = tot[p]; hs, ho = hist_set.get(p, []), hist_one.get(p, [])
        if not hs and not ho: first.append(p); continue
        if hs:
            prev = max(v for _, v in hs)
            if t['score'] > prev:
                set_pbs.append(dict(name=p, old=prev, oldDate=max(d for d, v in hs if v == prev), new=t['score'], imp=t['score'] / prev - 1))
            avg = sum(v for _, v in hs) / len(hs); elig_set += 1; above_set += t['score'] > avg
            if len(hs) >= 3:
                g = t['score'] / avg - 1
                if not bva or g > bva['gain']: bva = dict(name=p, gain=g, avg=avg, score=t['score'], n=len(hs))
        if ho:
            prev = max(v for _, v, _ in ho)
            if t['best'][0] > prev:
                pd = max(d for d, v, _ in ho if v == prev)
                one_pbs.append(dict(name=p, old=prev, oldDate=pd, new=t['best'][0], pf=t['best'][1], imp=t['best'][0] / prev - 1))
            avg1 = sum(v for _, v, _ in ho) / len(ho)
            for e, r in rows:
                if r['player'] == p: elig_one += 1; above_one += r['score'] > avg1
    set_pbs.sort(key=lambda x: -x['imp']); one_pbs.sort(key=lambda x: -x['imp'])

    # This set plus the previous four sets for this clan.
    recent = []
    for s in reversed(order[:pos + 1]):
        v = collections.defaultdict(int)
        for e in sets[s]:
            for r in e['rows']:
                if r['clan'] == clan and r.get('score') is not None: v[r['player']] += r['score']
        if v: recent.append(dict(label=set_label(set_dates[s]), n=len(v), total=sum(v.values()), avg=sum(v.values()) / len(v)))
        if len(recent) == 5: break

    # Milestones: set totals at each tier, ranked against Arena-era sets for this clan.
    def clan_totals(s):
        v = collections.defaultdict(int)
        for e in sets[s]:
            for r in e['rows']:
                if r['clan'] == clan and r.get('score') is not None: v[r['player']] += r['score']
        return list(v.values())
    arena_counts = [c for c in (clan_totals(s) for s in arena_sets) if c]
    tiers = []
    for t in TIERS:
        n = sum(1 for p in players if tot[p]['score'] >= t)
        if not n: continue
        cnts = [sum(1 for v in c if v >= t) for c in arena_counts]
        tiers.append((t, n, 1 + sum(1 for c in cnts if c > n), len(arena_counts), sum(1 for c in cnts if c == n) > 1))

    # League (35-day cycles from 2026-10-12): Flash-only lines and Sparks leaders.
    anchor = dt.date(2026, 10, 12); d = dt.date.fromisoformat(upto)
    lstart = anchor + dt.timedelta(days=35 * ((d - anchor).days // 35)); lend = lstart + dt.timedelta(days=34)
    ldist, lsp = collections.defaultdict(int), collections.defaultdict(int)
    for e in fl:
        if not (lstart.isoformat() <= e['date'] <= upto): continue
        for r in e['rows']:
            if r['clan'] != clan: continue
            if r.get('score') is not None: ldist[r['player']] += r['score']
            if r.get('sparks') is not None: lsp[r['player']] += r['sparks']

    singles = sorted(rows, key=lambda x: -x[1]['score'])[:10]
    return dict(setId=set_id, clan=clan, dates=set_dates[set_id], cards=sorted(cards, key=lambda c: c['pf']),
                players=players, tot=tot, results=len(rows),
                total=sum(r['score'] for _, r in rows), stars=sum(r.get('stars') or 0 for _, r in rows),
                sparks=sum(r.get('sparks') or 0 for _, r in rows),
                top10=[dict(name=p, **{k: tot[p][k] for k in ('score', 'stars')}, pfs=len(tot[p]['pfs']),
                            wins=fin[p][0], pods=fin[p][1], allR=rank(tot[p]['score'], every_set), arR=rank(tot[p]['score'], arena_set))
                       for p in players[:10]],
                singles=[dict(name=r['player'], pf=pf(e), score=r['score'], stars=r.get('stars'),
                              place=(r.get('metadata') or {}).get('rank'), lobby=(r.get('metadata') or {}).get('lobby'),
                              allR=rank(r['score'], every_one), arR=rank(r['score'], arena_one)) for e, r in singles],
                everySetN=len(every_set), arenaSetN=len(arena_set), everyOneN=len(every_one), arenaOneN=len(arena_one),
                setPbs=set_pbs, onePbs=one_pbs, first=first, recent=recent, tiers=tiers,
                aboveOne=above_one, eligOne=elig_one, aboveSet=above_set, eligSet=elig_set, bestVsAvg=bva,
                leagueStart=lstart.isoformat(), leagueEnd=lend.isoformat(),
                leagueLines=max(ldist.items(), key=lambda x: x[1]) if ldist else None,
                leagueSparks=max(lsp.items(), key=lambda x: x[1]) if lsp else None,
                projectionVersion=P.get('version'))


def render(m, out):
    clan = m['clan']
    npb = max(1, len(m['setPbs']), len(m['onePbs']))
    CH = 82 + 40 + 6 * 50 + 24
    PBH = 132 + 50 * npb + 24
    nf = len(m['first']); NFH = 140 + ((max(1, nf) + 2) // 3) * 124
    MH = 116 + len(m['tiers']) * 48 + 16
    BOT = max(MH, 2 * 190 + 24)
    T10 = 140 + 54 * min(10, len(m['top10'])) + 30
    H = 370 + 160 + 2 * 274 + 20 + CH + 24 + 330 + T10 + 30 + T10 + 30 + PBH + 30 + NFH + 30 + BOT + 30 + 250 + 40
    p = Poster(H); d = p.d

    p.char('AV_ChickenHawkeye.png', (24, 16, 400, 340)); p.char('AV_GNHulk.png', (W - 400, 16, W - 24, 340))
    p.text((W // 2, 46), clan, 112, 'fg', 'black', 'ma')
    p.text((W // 2, 176), 'PIGGY FLASHES', 88, 'cyan', 'black', 'ma')
    p.text((W // 2, 290), f'{long_label(m["dates"])}  •  FLASH SET RESULTS', 30, 'fg', 'bold', 'ma')
    d.line((W // 2 - 460, 340, W // 2 + 460, 340), fill=C['cyan'], width=3)
    y = 370

    kpis = [('PLAYERS', fmt(len(m['players'])), 'cyan'), ('PF RESULTS', fmt(m['results']), 'mag'),
            ('TOTAL LINES', lines(m['total']), 'white'), ('EARNED STARS', fmt(m['stars']), 'gold'),
            ('EARNED SPARKS', fmt(m['sparks']), 'green')]
    bw = (W - 2 * M - 4 * 18) // 5
    for i, (lab, val, col) in enumerate(kpis):
        x = M + i * (bw + 18); p.neon((x, y, x + bw, y + 136), col)
        p.fit((x + bw // 2, y + 22), val, bw - 30, 58, col if col != 'white' else 'fg', 'black', 'ma')
        p.text((x + bw // 2, y + 96), lab, 22, 'fg', 'semi', 'ma')
    y += 160

    # PF cards, 2 x 2.
    cw = (W - 2 * M - 24) // 2
    for i, c in enumerate(m['cards']):
        x = M + (i % 2) * (cw + 24); yy = y + (i // 2) * 274; col = PF_COLORS.get(c['pf'], 'cyan')
        p.neon((x, yy, x + cw, yy + 254), col)
        p.text((x + 26, yy + 18), f'PF{c["pf"]}', 46, col, 'black')
        p.fit((x + 140, yy + 22), f'#1  {c["top"] or "—"}', cw - 340, 30, 'fg', 'xbold')
        p.fit((x + 140, yy + 58), shortdate(c['date']).upper() + (f'   ·   2ND LOBBY #1  {c["sectop"]}' if c['sectop'] else ''), cw - 360, 18, 'mut', 'semi')
        p.char(PF_CHARS.get(c['pf'], 'AV_KaboomStar.png'), (x + cw - 160, yy + 12, x + cw - 16, yy + 140))
        d.line((x + 22, yy + 88, x + cw - 180, yy + 88), fill='#2a3f6e', width=2)
        p.text((x + 26, yy + 102), 'POT STARS', 18, 'mut', 'semi'); p.text((x + 26, yy + 126), mill(c['pot']) if c['pot'] else '—', 50, col, 'black')
        p.text((x + 290, yy + 102), f'{clan} LINES', 18, 'mut', 'semi'); p.text((x + 290, yy + 126), lines(c['lines']), 40, 'fg', 'black')
        p.text((x + 500, yy + 102), f'{clan} SHARE', 18, 'mut', 'semi')
        p.text((x + 500, yy + 126), f'{c["share"]*100:.1f}%' if c['share'] else '—', 40, 'fg', 'black')
        ry = yy + 196
        d.rounded_rectangle((x + 20, ry - 10, x + cw - 20, ry + 40), 10, fill=C['row'])
        if c['pfAll']:
            p.text((x + 34, ry + 4), f'PF{c["pf"]} POT RANK', 18, 'mut', 'semi')
            p.text((x + 200, ry), f'#{c["pfAll"][0]} / {c["pfAll"][1]}', 26, col, 'black')
            p.text((x + 330, ry + 4), f'({c["pfArena"][0]} / {c["pfArena"][1]})', 20, 'fg', 'semi')
            p.text((x + 450, ry + 4), 'ALL-PF RANK', 18, 'mut', 'semi')
            p.text((x + 580, ry), f'#{c["allAll"][0]} / {c["allAll"][1]}', 26, col, 'black')
            p.text((x + 720, ry + 4), f'({c["allArena"][0]} / {c["allArena"][1]})', 20, 'fg', 'semi')
    y += 2 * 274 + 20
    p.text((W - M - 6, y - 16), 'POT RANKS: ALL TIME (ARENA ERA)', 18, 'mut', 'semi', 'ra'); y += 6

    # Change vs last 4 sets.
    rec = m['recent']; cur = rec[0]
    p.neon((M, y, W - M, y + CH), 'cyan')
    p.title(M + 32, y + 22, 'CHANGE VS LAST 4 FLASH SETS', None, None, 34)
    lab = cur['label'].upper()
    hx = [(M + 40, 'SET', 'la'), (720, 'PLAYERS', 'ra'), (980, 'TOTAL LINES', 'ra'), (1170, f'{lab} VS', 'ra'),
          (1460, 'AVG / PLAYER', 'ra'), (W - M - 40, f'{lab} VS', 'ra')]
    hy = y + 82; d.rectangle((M + 24, hy - 6, W - M - 24, hy + 30), fill=C['row'])
    for cx, t, a in hx: p.text((cx, hy), t, 19, 'mut', 'semi', a)
    prev = rec[1:]
    avgrow = dict(label='4-SET AVERAGE', n=sum(r['n'] for r in prev) / len(prev), total=sum(r['total'] for r in prev) / len(prev),
                  avg=sum(r['total'] for r in prev) / sum(r['n'] for r in prev)) if prev else None
    for i, r in enumerate(rec + ([avgrow] if avgrow else [])):
        ry = y + 128 + i * 50; this = i == 0; avgr = r is avgrow
        if this: d.rounded_rectangle((M + 24, ry - 8, W - M - 24, ry + 40), 8, fill='#0e2a3c', outline=C['cyan'], width=2)
        elif i % 2 == 0: d.rectangle((M + 24, ry - 8, W - M - 24, ry + 40), fill=C['row2'])
        if avgr: d.line((M + 24, ry - 9, W - M - 24, ry - 9), fill='#2a3f6e', width=2)
        p.text((M + 40, ry + 2), ('THIS SET · ' if this else '') + r['label'].upper(), 24, 'cyan' if this or avgr else 'fg', 'black' if this or avgr else 'bold')
        p.text((720, ry + 2), fmt(round(r['n'])) if not avgr else f'{r["n"]:.1f}', 24, 'fg', 'semi', 'ra')
        p.text((980, ry + 2), lines(round(r['total'])), 26, 'fg', 'black' if this else 'semi', 'ra')
        p.text((1460, ry + 2), lines(round(r['avg'])), 26, 'fg', 'black' if this else 'semi', 'ra')
        if not this:
            for cx, k in ((1170, 'total'), (W - M - 40, 'avg')):
                ch = cur[k] / r[k] - 1; p.text((cx, ry + 2), pct(ch), 26, 'green' if ch >= 0 else 'red', 'xbold', 'ra')
    y += CH + 24

    # Spotlights.
    p.neon((M, y, W - M, y + 306), 'purple')
    p.title(M + 32, y + 22, 'INDIVIDUAL SPOTLIGHTS', f'Clan league {shortdate(m["leagueStart"])} – {shortdate(m["leagueEnd"])}', W - M - 32, 34)
    t0 = m['top10'][0]; b = m['bestVsAvg']; ll, ls = m['leagueLines'], m['leagueSparks']
    spots = [('TOP SET CONTRIBUTOR', t0['name'], lines(t0['score']), f'Most combined lines · {t0["pfs"]} PFs', 'gold'),
             ('BIGGEST JUMP VS OWN AVG', b['name'] if b else '—', pct(b['gain']) if b else '—',
              f'{lines(b["score"])} vs {lines(round(b["avg"]))} avg ({b["n"]} sets)' if b else 'Needs 3+ earlier sets', 'green'),
             ('LEAGUE FLASH LINES LEADER', ll[0] if ll else '—', lines(ll[1]) if ll else '—', 'Flash lines only, this league', 'cyan'),
             ('LEAGUE FLASH SPARKS LEADER', ls[0] if ls else '—', fmt(ls[1]) if ls else '—', 'Flash Sparks only, this league', 'mag')]
    sw = (W - 2 * M - 64 - 3 * 16) // 4
    for i, (lb, name, val, sub, col) in enumerate(spots):
        x = M + 32 + i * (sw + 16); yy = y + 84
        d.rounded_rectangle((x, yy, x + sw, yy + 196), 16, fill=C['row'])
        p.fit((x + 18, yy + 16), lb, sw - 36, 19, col, 'xbold'); p.fit((x + 18, yy + 48), name, sw - 36, 30, 'fg', 'black')
        p.fit((x + 18, yy + 92), val, sw - 36, 46, col, 'black'); p.fit((x + 18, yy + 158), sub, sw - 36, 18, 'mut', 'med')
    y += 330

    def table(y, title, sub, cols, data, color):
        th = 140 + 54 * len(data)
        p.neon((M, y, W - M, y + th), color); p.title(M + 32, y + 22, title, sub, W - M - 32, 34)
        hy = y + 82; d.rectangle((M + 24, hy - 6, W - M - 24, hy + 32), fill=C['row'])
        for x, t, a in cols: p.text((x, hy + 1), t, 17, 'mut', 'semi', a)
        for i, vals in enumerate(data):
            ry = y + 128 + i * 54
            if i % 2 == 0: d.rectangle((M + 24, ry - 8, W - M - 24, ry + 44), fill=C['row2'])
            badge = {0: 'gold', 1: 'cyan', 2: 'mag'}.get(i)
            if badge:
                d.rounded_rectangle((M + 30, ry - 2, M + 70, ry + 36), 7, fill=C[badge]); p.text((M + 50, ry + 2), i + 1, 26, '#0a1530', 'black', 'ma')
            else: p.text((M + 50, ry + 2), i + 1, 26, 'fg', 'bold', 'ma')
            p.fit((M + 96, ry + 2), vals[0], 400, 28, 'gold' if i == 0 else 'fg', 'bold')
            for x, v, col in vals[1:]: p.text((x, ry + 4), v, 26, col, 'semi', 'ra')
        return y + th + 30

    cols = [(M + 50, '#', 'ma'), (M + 96, 'PLAYER', 'la'), (655, 'SET LINES', 'ra'), (845, 'STARS', 'ra'), (945, 'PFs', 'ra'),
            (1105, 'ALL-TIME 1STS', 'ra'), (1300, 'ALL-TIME PODIUMS', 'ra'), (1515, 'ALL-TIME RANK', 'ra'), (W - M - 36, 'ARENA-ERA RANK', 'ra')]
    data = [[t['name'], (655, lines(t['score']), 'fg'), (845, fmt(t['stars']), 'gold'), (945, f'{t["pfs"]}/4', 'fg'),
             (1105, str(t['wins']), 'gold' if t['wins'] else 'mut'), (1300, str(t['pods']), 'mag' if t['pods'] else 'mut'),
             (1515, rk(t['allR'], m['everySetN']), 'fg'), (W - M - 36, rk(t['arR'], m['arenaSetN']), 'cyan')] for t in m['top10']]
    y = table(y, 'TOP 10  /  FLASH SET TOTALS', f'ALL TIME (ARENA ERA) RANK AMONG {fmt(m["everySetN"])} ({fmt(m["arenaSetN"])}) SET TOTALS', cols, data, 'cyan')

    cols = [(M + 50, '#', 'ma'), (M + 96, 'PLAYER', 'la'), (640, 'PF', 'ra'), (845, 'LINES', 'ra'), (1060, 'STARS', 'ra'),
            (1250, 'FINISH', 'ra'), (1515, 'ALL-TIME RANK', 'ra'), (W - M - 36, 'ARENA-ERA RANK', 'ra')]
    data = [[s['name'], (640, f'PF{s["pf"]}', PF_COLORS.get(s['pf'], 'fg')), (845, lines(s['score']), 'fg'),
             (1060, fmt(s['stars']) if s['stars'] is not None else '—', 'gold'),
             (1250, (ordinal(s['place']) if s['place'] else '—') + (' (2nd lobby)' if s['lobby'] not in (None, 'main') else ''), 'mut'),
             (1515, rk(s['allR'], m['everyOneN']), 'fg'), (W - M - 36, rk(s['arR'], m['arenaOneN']), 'cyan')] for s in m['singles']]
    y = table(y, 'TOP 10  /  SINGLE-FLASH LINES', f'ALL TIME (ARENA ERA) RANK AMONG {fmt(m["everyOneN"])} ({fmt(m["arenaOneN"])}) FLASH RESULTS', cols, data, 'mag')

    # Personal bests: two tables side by side.
    tw = (W - 2 * M - 24) // 2
    for k, (key, title, col, single) in enumerate([('setPbs', 'SET TOTAL LINES', 'gold', False), ('onePbs', 'SINGLE-FLASH LINES', 'cyan', True)]):
        x = M + k * (tw + 24); pbs = m[key]
        p.neon((x, y, x + tw, y + PBH), col)
        p.text((x + 26, y + 20), 'PERSONAL BESTS', 22, 'mut', 'xbold'); p.text((x + 26, y + 48), title, 32, 'fg', 'black')
        p.text((x + tw - 26, y + 26), str(len(pbs)), 56, col, 'black', 'ra')
        hy = y + 98
        d.rectangle((x + 18, hy - 6, x + tw - 18, hy + 28), fill=C['row'])
        hdr = [(x + 30, 'PLAYER', 'la')] + ([(x + 380, 'PF', 'ra')] if single else []) + \
              [(x + 490, 'PREVIOUS', 'ra'), (x + 580, 'DATE', 'ra'), (x + 680, 'NEW PB', 'ra'), (x + tw - 26, 'GAIN', 'ra')]
        for cx, t, a in hdr: p.text((cx, hy), t, 17, 'mut', 'semi', a)
        if not pbs: p.text((x + 30, y + 150), 'No new PBs this set.', 24, 'mut', 'semi')
        for i, b in enumerate(pbs):
            ry = y + 142 + i * 50
            if i % 2 == 0: d.rectangle((x + 18, ry - 8, x + tw - 18, ry + 40), fill=C['row2'])
            p.fit((x + 30, ry + 1), b['name'], 290 if single else 340, 24, 'fg', 'bold')
            if single: p.text((x + 380, ry + 3), f'PF{b["pf"]}', 22, PF_COLORS.get(b['pf'], 'fg'), 'xbold', 'ra')
            p.text((x + 490, ry + 3), lines(b['old']), 22, 'mut', 'semi', 'ra'); p.text((x + 580, ry + 5), shortdate(b['oldDate']), 18, 'mut', 'med', 'ra')
            p.text((x + 680, ry + 1), lines(b['new']), 24, col, 'black', 'ra'); p.text((x + tw - 26, ry + 2), pct(b['imp']), 22, 'green', 'xbold', 'ra')
    y += PBH + 30

    # New faces, full width.
    p.neon((M, y, W - M, y + NFH), 'mag', width=4)
    p.text((M + 30, y + 22), 'NEW FACES', 52, 'mag', 'black'); p.text((M + 32, y + 84), 'First tracked Piggy Flash', 24, 'fg', 'semi')
    p.char('AV_LBCA.png', (W - M - 200, y + 10, W - M - 24, y + 128))
    if not m['first']: p.text((M + 360, y + 40), 'No first-time Flash racers this set.', 26, 'mut', 'semi')
    gw = (W - 2 * M - 60 - 2 * 20) // 3
    for i, name in enumerate(m['first']):
        t = m['tot'][name]; cx = M + 30 + (i % 3) * (gw + 20); cy = y + 132 + (i // 3) * 124
        d.rounded_rectangle((cx, cy, cx + gw, cy + 108), 14, fill=C['row'], outline=C['mag'], width=3)
        p.fit((cx + 18, cy + 12), name, gw - 200, 32, 'fg', 'black')
        p.text((cx + gw - 18, cy + 10), lines(t['score']), 36, 'cyan', 'black', 'ra')
        bits = f'{len(t["pfs"])} PF{"s" if len(t["pfs"]) != 1 else ""}  ·  best PF{t["best"][1]} {lines(t["best"][0])}  ·  {fmt(t["stars"])} Stars'
        p.fit((cx + 18, cy + 66), bits, gw - 36, 20, 'mut', 'semi')
    y += NFH + 30

    # Above own average (left) and milestones (right).
    lw = 800; rw = W - 2 * M - lw - 24
    for j, (a, n, l1, l2) in enumerate([(m['aboveSet'], m['eligSet'], 'set totals beat the player\'s', 'own earlier set average'),
                                        (m['aboveOne'], m['eligOne'], 'single-Flash results beat the', 'player\'s own Flash average')]):
        yy = y + j * (190 + 24); hh = 190 if j == 0 else BOT - 190 - 24
        p.neon((M, yy, M + lw, yy + hh), 'cyan')
        p.text((M + 26, yy + 18), 'ABOVE OWN AVERAGE' if j == 0 else 'ABOVE OWN AVERAGE · SINGLE FLASH', 26, 'fg', 'black')
        s = f'{a} / {n}'; p.text((M + 26, yy + 70), s, 62, 'green', 'black')
        tx = M + 46 + d.textlength(s, font=F(62, 'black'))
        p.text((tx, yy + 84), l1, 22, 'fg', 'semi'); p.text((tx, yy + 112), l2, 22, 'fg', 'semi')
    x = M + lw + 24
    p.neon((x, y, x + rw, y + BOT), 'gold'); p.text((x + 26, y + 18), 'SET TOTAL MILESTONES', 30, 'fg', 'black')
    hy = y + 70; d.rectangle((x + 18, hy - 6, x + rw - 18, hy + 28), fill=C['row'])
    p.text((x + 30, hy), 'LINES', 18, 'mut', 'semi'); p.text((x + rw * 0.52, hy), 'PLAYERS', 18, 'mut', 'semi', 'ra')
    p.text((x + rw - 30, hy), 'ARENA-ERA RANK', 18, 'mut', 'semi', 'ra')
    for i, (t, n, r, of, tie) in enumerate(m['tiers']):
        ry = y + 116 + i * 48
        if i % 2 == 0: d.rectangle((x + 18, ry - 8, x + rw - 18, ry + 38), fill=C['row2'])
        p.text((x + 30, ry), f'{klines(t)}+', 26, 'fg', 'xbold')
        p.text((x + rw * 0.52, ry - 2), str(n), 30, ['cyan', 'mag', 'gold', 'green'][i % 4], 'black', 'ra')
        p.text((x + rw - 30, ry + 1), f'{"T-" if tie else ""}#{r} of {of}', 26, 'gold' if r == 1 else 'fg', 'xbold' if r <= 3 else 'semi', 'ra')
    y += BOT + 30

    p.neon((M, y, W - M, y + 250), 'cyan')
    p.char('AV_MZGroot.png', (M + 24, y + 18, M + 270, y + 232)); p.char('AV_RaccoonRocket.png', (W - M - 270, y + 18, W - M - 24, y + 232))
    cx = W // 2
    p.text((cx, y + 26), f'{clan}  /  PIGGY FLASHES', 34, 'cyan', 'black', 'ma')
    p.text((cx, y + 74), f'{long_label(m["dates"])}  •  FLASH SET RESULTS', 22, 'fg', 'bold', 'ma')
    d.text((cx, y + 104), SIGNATURE, font=ImageFont.truetype(str(SIG_FONT), 72), fill=C['mag'], anchor='ma')
    p.text((cx, y + 196), 'AVENGERS STAT CENTER', 26, 'gold', 'black', 'ma')
    fh = y + 250 + 30
    im = p.im.crop((0, 0, W, fh)); im.save(out, optimize=True)
    sha = hashlib.sha256(Path(out).read_bytes()).hexdigest()
    side = dict(file=str(out), setId=m['setId'], clan=clan, projectionVersion=m['projectionVersion'], templateVersion=TEMPLATE,
                imageSHA256=sha, dimensions=[W, fh], players=len(m['players']), results=m['results'],
                setPBs=len(m['setPbs']), singlePBs=len(m['onePbs']), firstTracked=len(m['first']),
                readyToPost=False, discordPostingEnabled=False)
    Path(str(out).rsplit('.', 1)[0] + '.json').write_text(json.dumps(side, indent=2))
    return side


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('release'); ap.add_argument('output')
    ap.add_argument('--clan', choices=['AVENGERS', 'AV-2'], required=True); ap.add_argument('--set-id')
    a = ap.parse_args(); R = json.loads(Path(a.release).read_text())
    print(json.dumps(render(build_model(R, a.clan, a.set_id), a.output)))
