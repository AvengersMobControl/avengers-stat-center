#!/usr/bin/env python3
"""Monthly Kraken poster, same visual system as render-bigpig-poster.py / render-space-poster.py.

DRAFT / under review — no leader approval yet, not wired into docs/AUTOMATIC_DISCORD_POSTING.md,
and Kraken is explicitly excluded from the standing automatic-posting authorization (AGENTS.md).

Usage:
  python3 scripts/render-kraken-poster.py reports/approved-summary-release.json out.png --clan AVENGERS [--event-id 'kraken|nov']

Reads ONLY the approved canonical export (reports/approved-summary-release.json), which carries
Kraken RESULTS only (player, clan, damage score in millions, derived Sparks, rank) — never route,
map, ticket or preset/strategy data. That matches docs/security/kraken-strategy-access.md: event
results/scores/placements/PBs are not strategy and may be shown publicly; this script never reads
or renders anything else. Writes a sidecar JSON with readyToPost:false. Never posts anything.
"""
import argparse, datetime as dt, hashlib, importlib.util, json
from PIL import ImageFont
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location('space_poster', ROOT / 'scripts' / 'render-space-poster.py')
SP = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(SP)
Poster, F, C, W, M = SP.Poster, SP.F, SP.C, SP.W, SP.M
fmt, pct, shortdate, longdate, ordinal = SP.fmt, SP.pct, SP.shortdate, SP.longdate, SP.ordinal
TEMPLATE = 'kraken-poster-v1-20261117-draft'
ARENA_START = '2026-08-01'  # site meta.arenaStart
SIGNATURE = 'AV-HarryBallsagna'
SIG_FONT = ROOT / 'assets' / 'fonts' / 'GreatVibes-Regular.ttf'
ICON = ROOT / 'assets' / 'achievements' / 'kraken.webp'
TIERS = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000]


def dmg(v):
    return f'{v:,.1f}M'


def icon(p, box, flip=False):
    """Place assets/achievements/kraken.webp like Poster.char(), since it lives outside
    assets/characters/ (it's a results icon, not a character)."""
    from PIL import Image
    im = Image.open(ICON).convert('RGBA'); im = im.crop(im.getbbox())
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    x0, y0, x1, y1 = [int(v) for v in box]; im.thumbnail((x1 - x0, y1 - y0), Image.LANCZOS)
    p.im.paste(im, (x0 + (x1 - x0 - im.width) // 2, y0 + (y1 - y0 - im.height) // 2), im)


def build_model(R, clan, event_id=None):
    P = R['projection']
    kr = sorted([e for e in P['events'] if e['kind'] == 'kraken' and e['status'] != 'revoked'], key=lambda e: e['date'])
    event = next(e for e in kr if e['id'] == event_id) if event_id else \
        [e for e in kr if any(r['clan'] == clan for r in e['rows'])][-1]
    rows = sorted([r for r in event['rows'] if r['clan'] == clan and r.get('score') is not None], key=lambda r: -r['score'])
    if not rows: raise SystemExit(f'No {clan} rows in {event["id"]}')
    earlier = [e for e in kr if e['date'] < event['date']]

    hist = {}
    for e in earlier:
        for r in e['rows']:
            if r['clan'] == clan and r.get('score') is not None: hist.setdefault(r['player'], []).append((e['date'], r['score']))
    # True all-time (no date floor) vs Arena-era (since 2026-08-01), both bounded to <= this event.
    ever_scores = [r['score'] for e in kr if e['date'] <= event['date'] for r in e['rows'] if r['clan'] == clan and r.get('score') is not None]
    arena_scores = [r['score'] for e in kr if ARENA_START <= e['date'] <= event['date'] for r in e['rows'] if r['clan'] == clan and r.get('score') is not None]
    def ever_rank(s): return 1 + sum(1 for x in ever_scores if x > s)
    def arena_rank(s): return 1 + sum(1 for x in arena_scores if x > s)

    # All-time 1st/podium finishes for this clan, any month, through this event.
    finishes = {}
    for e in kr:
        if e['date'] > event['date']: continue
        for r in e['rows']:
            if r['clan'] != clan: continue
            k = (r.get('metadata') or {}).get('rank')
            if isinstance(k, int) and 1 <= k <= 3:
                w, pdm = finishes.get(r['player'], (0, 0)); finishes[r['player']] = (w + (k == 1), pdm + 1)

    # This Kraken plus the clan's previous 4 (by date, skipping months with no clan rows).
    recent = []
    for e in [x for x in kr if x['date'] <= event['date']][::-1]:
        rr = [r['score'] for r in e['rows'] if r['clan'] == clan and r.get('score') is not None]
        if rr: recent.append(dict(date=e['date'], label=(e['metadata'] or {}).get('monthLabel', e['date']), n=len(rr), total=sum(rr), avg=sum(rr) / len(rr)))
        if len(recent) == 5: break

    # Clan total damage, ranked among this clan's own Kraken months (pot-equivalent ribbon stat).
    totals = [(sum(r['score'] for r in e['rows'] if r['clan'] == clan and r.get('score') is not None), e['date'])
              for e in kr if e['date'] <= event['date']]
    totals = [(t, d) for t, d in totals if t > 0]
    this_total = sum(r['score'] for r in rows)
    total_rank = 1 + sum(1 for t, d in totals if t > this_total + 0.5)
    atotals = [(t, d) for t, d in totals if d >= ARENA_START]
    total_rank_arena = 1 + sum(1 for t, d in atotals if t > this_total + 0.5)

    # Damage PBs: strictly beat the max of every earlier month (house rule shared with every
    # other event type: PBs compare against the player's own best, any clan they raced for).
    pbs, first = [], []
    for r in rows:
        h = hist.get(r['player'], [])
        if not h: first.append(r); continue
        prev = max(s for _, s in h)
        if r['score'] > prev:
            pdate = max(d for d, s in h if s == prev)
            pbs.append(dict(name=r['player'], old=prev, oldDate=pdate, new=r['score'], imp=r['score'] / prev - 1))
    pbs.sort(key=lambda x: -x['imp'])

    above, eligible, bva = 0, 0, None
    for r in rows:
        h = hist.get(r['player'], [])
        if not h: continue
        eligible += 1; avg = sum(s for _, s in h) / len(h)
        if r['score'] > avg: above += 1
        if len(h) >= 3:
            g = r['score'] / avg - 1
            if not bva or g > bva['gain']: bva = dict(name=r['player'], gain=g, avg=avg, score=r['score'], n=len(h))

    # Biggest rank climb vs the immediately preceding month this clan has rows for (not vs any
    # earlier month — "climb" should mean this month vs last time they played, not vs their worst).
    prior_event = earlier[-1] if earlier else None
    prior_ranks = {r['player']: (r.get('metadata') or {}).get('rank') for r in (prior_event['rows'] if prior_event else []) if r['clan'] == clan}
    climb = None
    for r in rows:
        prk = prior_ranks.get(r['player'])
        nrk = (r.get('metadata') or {}).get('rank')
        if isinstance(prk, int) and isinstance(nrk, int) and prk > nrk:
            gain = prk - nrk
            if not climb or gain > climb['gain']: climb = dict(name=r['player'], prevRank=prk, newRank=nrk, gain=gain)

    # Clan record watch: does this month's leader beat the best score from every STRICTLY
    # earlier month (not this one) — i.e. an actual new record, not just "today's leader".
    prior_ever_scores = [r['score'] for e in earlier for r in e['rows'] if r['clan'] == clan and r.get('score') is not None]
    prior_best = max(prior_ever_scores) if prior_ever_scores else None
    leader_is_record = prior_best is not None and rows[0]['score'] > prior_best

    arena_counts = [[r['score'] for r in e['rows'] if r['clan'] == clan and r.get('score') is not None]
                    for e in kr if ARENA_START <= e['date'] <= event['date']]
    arena_counts = [c for c in arena_counts if c]
    tiers = [(t, n, 1 + sum(1 for c in arena_counts if sum(1 for s in c if s >= t) > n), len(arena_counts),
              sum(1 for c in arena_counts if sum(1 for s in c if s >= t) == n) > 1)
             for t in TIERS for n in [sum(1 for r in rows if r['score'] >= t)] if n]

    rate = next((r['sparks'] / r['score'] for r in rows if r.get('sparks') and r['score']), None)
    total = sum(r['score'] for r in rows)
    return dict(event=event, clan=clan, rows=rows, total=total, avg=total / len(rows),
                sparks=sum(r['sparks'] or 0 for r in rows), rate=rate,
                totalDamageRank=total_rank, totalDamageOf=len(totals), totalDamageRankArena=total_rank_arena, totalDamageOfArena=len(atotals),
                recent=recent, finishes=finishes, pbs=pbs, first=sorted(first, key=lambda r: -r['score']),
                above=above, eligible=eligible, bestVsAvg=bva, climb=climb, priorBest=prior_best, leaderIsRecord=leader_is_record,
                tiers=tiers, everRank={r['player']: ever_rank(r['score']) for r in rows[:10]}, everN=len(ever_scores),
                arenaRank={r['player']: arena_rank(r['score']) for r in rows[:10]}, arenaN=len(arena_scores),
                projectionVersion=P.get('version'), complete=bool(event.get('metadata', {}).get('complete')))


def plan(m):
    LW = 1010; RW = W - 2 * M - LW - 24
    nf = len(m['first'])
    pb_h = 122 + 50 * max(1, len(m['pbs'])) + 20
    boxes = [('new', 140 + max(1, nf) * 118), ('avg', 170), ('miles', 116 + len(m['tiers']) * 48 + 16)]
    best = None
    rest = boxes[1:]
    for mask in range(1 << len(rest)):
        cols = {'L': [('pb', LW, pb_h)], 'R': [('new', RW, boxes[0][1])]}
        h = {'L': pb_h, 'R': boxes[0][1]}
        for i, (name, hh) in enumerate(rest):
            c = 'L' if mask >> i & 1 else 'R'
            cols[c].append((name, LW if c == 'L' else RW, hh)); h[c] += 24 + hh
        key = (max(h.values()), abs(h['L'] - h['R']))
        if best is None or key < best[0]: best = (key, cols, h)
    _, cols, h = best
    bottom = max(h.values())
    for c in cols:
        if cols[c] and h[c] < bottom:
            n, w, hh = cols[c][-1]; cols[c][-1] = (n, w, hh + bottom - h[c])
    return dict(cols=cols, bottom=bottom, LW=LW, RW=RW, n10=min(10, len(m['rows'])))


def render(m, out):
    clan = m['clan']; ev = m['event']; L = plan(m)
    CH = 82 + 40 + 6 * 50 + 24
    H = 370 + 160 + 96 + CH + 24 + 330 + (140 + 54 * L['n10'] + 30) + 30 + L['bottom'] + 30 + 250 + 40
    p = Poster(H); d = p.d

    icon(p, (24, 16, 400, 340)); icon(p, (W - 400, 16, W - 24, 340), flip=True)
    p.text((W // 2, 46), clan, 112, 'fg', 'black', 'ma')
    p.text((W // 2, 176), 'KRAKEN', 88, 'mag', 'black', 'ma')
    p.text((W // 2, 290), f'{longdate(ev["date"])}  •  FINAL RESULTS', 30, 'fg', 'bold', 'ma')
    d.line((W // 2 - 440, 340, W // 2 + 440, 340), fill=C['mag'], width=3)
    y = 370

    kpis = [('PLAYERS', fmt(len(m['rows'])), 'cyan'), ('TOTAL DAMAGE', dmg(m['total']), 'white'),
            ('AVG DAMAGE', dmg(m['avg']), 'mag'), ('EARNED SPARKS', fmt(m['sparks']), 'green'),
            ('SPARKS RATE', (f'{round(m["rate"])}/M' if m['rate'] else '—'), 'gold')]
    bw = (W - 2 * M - 4 * 18) // 5
    for i, (lab, val, col) in enumerate(kpis):
        x = M + i * (bw + 18); p.neon((x, y, x + bw, y + 136), col)
        p.fit((x + bw // 2, y + 22), val, bw - 30, 58, col if col != 'white' else 'fg', 'black', 'ma')
        p.text((x + bw // 2, y + 96), lab, 22, 'fg', 'semi', 'ma')
    y += 160

    # Clan total damage ribbon (pot-equivalent: a collective number with its own history rank).
    p.neon((M, y, W - M, y + 72), 'gold', radius=18)
    segs = [('CLAN TOTAL DAMAGE ', 'mut', 'xbold', 24), (dmg(m['total']), 'gold', 'black', 38)]
    if m['totalDamageRankArena']:
        segs += [('   #' + str(m['totalDamageRankArena']), 'gold', 'black', 38), (f' OF {m["totalDamageOfArena"]} IN THE ARENA ERA', 'fg', 'xbold', 24)]
    if m['totalDamageRank']:
        segs += [('   ·   ', 'mut', 'xbold', 24), (f'#{m["totalDamageRank"]} OF {m["totalDamageOf"]} ALL-TIME LOGGED {clan} KRAKENS', 'mut', 'semi', 22)]
    tw = sum(d.textlength(t, font=F(sz, wt)) for t, _, wt, sz in segs); x = W // 2 - tw / 2
    for t, col, wt, sz in segs:
        p.text((x, y + 36), t, sz, col, wt, 'lm'); x += d.textlength(t, font=F(sz, wt))
    y += 96

    # Change vs the previous four Krakens (monthly cadence, so no weekday distinction).
    rec = m['recent']; cur = rec[0]
    p.neon((M, y, W - M, y + CH), 'cyan')
    p.title(M + 32, y + 22, 'CHANGE VS LAST 4 KRAKENS', None, None, 34)
    hx = [(M + 40, 'KRAKEN', 'la'), (720, 'PLAYERS', 'ra'), (980, 'TOTAL DAMAGE', 'ra'), (1170, f'{cur["label"].upper()} VS', 'ra'),
          (1460, 'AVG DAMAGE', 'ra'), (W - M - 40, f'{cur["label"].upper()} VS', 'ra')]
    hy = y + 82; d.rectangle((M + 24, hy - 6, W - M - 24, hy + 30), fill=C['row'])
    for cx, lab, a in hx: p.text((cx, hy), lab, 19, 'mut', 'semi', a)
    prev = rec[1:]
    avgrow = dict(label='4-KRAKEN AVERAGE', n=sum(r['n'] for r in prev) / len(prev), total=sum(r['total'] for r in prev) / len(prev),
                  avg=sum(r['total'] for r in prev) / sum(r['n'] for r in prev)) if prev else None
    rows5 = [dict(r, label=r['label'].upper()) for r in rec] + ([avgrow] if avgrow else [])
    for i, r in enumerate(rows5):
        ry = y + 128 + i * 50; this = i == 0; avgr = r is avgrow
        if this: d.rounded_rectangle((M + 24, ry - 8, W - M - 24, ry + 40), 8, fill='#1d1240', outline=C['mag'], width=2)
        elif i % 2 == 0: d.rectangle((M + 24, ry - 8, W - M - 24, ry + 40), fill=C['row2'])
        if avgr: d.line((M + 24, ry - 9, W - M - 24, ry - 9), fill='#2a3f6e', width=2)
        lab = ('THIS KRAKEN · ' if this else '') + r['label']
        p.fit((M + 40, ry + 2), lab, 620, 24, 'mag' if this else ('cyan' if avgr else 'fg'), 'black' if this or avgr else 'bold')
        p.text((720, ry + 2), fmt(round(r['n'])) if not avgr else f'{r["n"]:.1f}', 24, 'fg', 'semi', 'ra')
        p.text((980, ry + 2), dmg(r['total']), 26, 'fg', 'black' if this else 'semi', 'ra')
        p.text((1460, ry + 2), dmg(r['avg']), 26, 'fg', 'black' if this else 'semi', 'ra')
        if not this:
            for cx, k in ((1170, 'total'), (W - M - 40, 'avg')):
                ch = cur[k] / r[k] - 1; p.text((cx, ry + 2), pct(ch), 26, 'green' if ch >= 0 else 'red', 'xbold', 'ra')
    y += CH + 24

    p.neon((M, y, W - M, y + 306), 'purple')
    p.title(M + 32, y + 22, 'INDIVIDUAL SPOTLIGHTS', None, None, 34)
    top = m['rows'][0]; b = m['bestVsAvg']; c = m['climb']
    if m['leaderIsRecord']:
        record_val, record_sub = pct(top['score'] / m['priorBest'] - 1), f'New record — previous was {dmg(m["priorBest"])}'
    elif m['priorBest']:
        record_val, record_sub = dmg(m['priorBest']), 'Standing clan record (not broken this Kraken)'
    else:
        record_val, record_sub = '—', 'No prior Kraken to compare'
    spots = [('TOP DAMAGE DEALER', top['player'], dmg(top['score']), 'Most damage this Kraken', 'gold'),
             ('BIGGEST JUMP VS OWN AVG', b['name'] if b else '—', pct(b['gain']) if b else '—',
              f'{dmg(b["score"])} vs {dmg(b["avg"])} avg ({b["n"]} Krakens)' if b else 'Needs 3+ earlier Krakens', 'green'),
             ('CLAN RECORD WATCH', top['player'] if m['leaderIsRecord'] else '—', record_val, record_sub, 'cyan'),
             ('BIGGEST RANK CLIMB', c['name'] if c else '—', f'+{c["gain"]} places' if c else '—',
              f'{ordinal(c["prevRank"])} → {ordinal(c["newRank"])}' if c else 'No returning climbers vs last Kraken', 'mag')]
    sw = (W - 2 * M - 64 - 3 * 16) // 4
    for i, (lab, name, val, sub, col) in enumerate(spots):
        x = M + 32 + i * (sw + 16); yy = y + 84
        d.rounded_rectangle((x, yy, x + sw, yy + 196), 16, fill=C['row'])
        p.fit((x + 18, yy + 16), lab, sw - 36, 19, col, 'xbold'); p.fit((x + 18, yy + 48), name, sw - 36, 30, 'fg', 'black')
        p.fit((x + 18, yy + 92), val, sw - 36, 46, col, 'black'); p.fit((x + 18, yy + 158), sub, sw - 36, 18, 'mut', 'med')
    y += 330

    n10 = L['n10']; th = 140 + 54 * n10
    p.neon((M, y, W - M, y + th), 'cyan')
    p.title(M + 32, y + 22, 'TOP 10  /  DAMAGE', f'ALL TIME (ARENA ERA) RANK AMONG {fmt(m["everN"])} ({fmt(m["arenaN"])}) KRAKEN RESULTS', W - M - 32, 34)
    cols = [(M + 50, '#', 'ma'), (M + 96, 'PLAYER', 'la'), (720, 'DAMAGE', 'ra'), (945, 'SPARKS', 'ra'),
            (1105, 'ALL-TIME 1STS', 'ra'), (1300, 'ALL-TIME PODIUMS', 'ra'), (1515, 'ALL-TIME RANK', 'ra'), (W - M - 36, 'ARENA-ERA RANK', 'ra')]
    hy = y + 82; d.rectangle((M + 24, hy - 6, W - M - 24, hy + 32), fill=C['row'])
    for x, lab, a in cols: p.text((x, hy + 1), lab, 17, 'mut', 'semi', a)
    for i, r in enumerate(m['rows'][:10]):
        ry = y + 128 + i * 54
        if i % 2 == 0: d.rectangle((M + 24, ry - 8, W - M - 24, ry + 44), fill=C['row2'])
        badge = {0: 'gold', 1: 'cyan', 2: 'mag'}.get(i)
        if badge:
            d.rounded_rectangle((M + 30, ry - 2, M + 70, ry + 36), 7, fill=C[badge]); p.text((M + 50, ry + 2), i + 1, 26, '#0a1530', 'black', 'ma')
        else: p.text((M + 50, ry + 2), i + 1, 26, 'fg', 'bold', 'ma')
        p.fit((M + 96, ry + 2), r['player'], 500, 28, 'gold' if i == 0 else 'fg', 'bold')
        wins, pods = m['finishes'].get(r['player'], (0, 0))
        vals = [(720, dmg(r['score']), 'fg'), (945, fmt(r['sparks']) if r['sparks'] is not None else '—', 'green'),
                (1105, str(wins), 'gold' if wins else 'mut'), (1300, str(pods), 'mag' if pods else 'mut'),
                (1515, f'{m["everRank"][r["player"]]} / {fmt(m["everN"])}', 'fg'),
                (W - M - 36, f'{m["arenaRank"][r["player"]]} / {fmt(m["arenaN"])}', 'cyan')]
        for x, v, col in vals: p.text((x, ry + 4), v, 26, col, 'semi', 'ra')
    y += th + 30

    def box_pb(x, y0, w, h):
        p.neon((x, y0, x + w, y0 + h), 'gold'); p.title(x + 28, y0 + 22, 'PERSONAL BESTS', None, None, 34)
        n = str(len(m['pbs'])); p.text((x + w - 28, y0 + 22), n, 40, 'gold', 'black', 'ra')
        p.text((x + w - 40 - d.textlength(n, font=F(40, 'black')), y0 + 34), 'NEW DAMAGE PBs', 22, 'fg', 'xbold', 'ra')
        hdr = [(x + 46, '#', 'ma'), (x + 78, 'PLAYER', 'la'), (x + 560, 'PREVIOUS', 'ra'), (x + 690, 'DATE', 'ra'), (x + 860, 'NEW PB', 'ra'), (x + w - 28, 'GAIN', 'ra')]
        hy = y0 + 78; d.rectangle((x + 20, hy - 6, x + w - 20, hy + 30), fill=C['row'])
        for cx, lab, a in hdr: p.text((cx, hy), lab, 18, 'mut', 'semi', a)
        if not m['pbs']: p.text((x + 40, y0 + 130), 'No new damage PBs this Kraken.', 26, 'mut', 'semi')
        for i, bb in enumerate(m['pbs']):
            ry = y0 + 122 + i * 50
            if i % 2 == 0: d.rectangle((x + 20, ry - 8, x + w - 20, ry + 40), fill=C['row2'])
            p.text((x + 46, ry + 2), i + 1, 22, 'gold', 'black', 'ma'); p.fit((x + 78, ry + 1), bb['name'], 380, 26, 'fg', 'bold')
            p.text((x + 560, ry + 3), dmg(bb['old']), 24, 'mut', 'semi', 'ra'); p.text((x + 690, ry + 5), shortdate(bb['oldDate']), 20, 'mut', 'med', 'ra')
            p.text((x + 860, ry + 1), dmg(bb['new']), 26, 'gold', 'black', 'ra'); p.text((x + w - 28, ry + 2), pct(bb['imp']), 24, 'green', 'xbold', 'ra')

    def box_new(x, y0, w, h):
        nf = m['first']; p.neon((x, y0, x + w, y0 + h), 'mag', width=4)
        p.text((x + 26, y0 + 20), 'NEW FACES', 46, 'mag', 'black'); p.text((x + 26, y0 + 74), 'First tracked Kraken', 22, 'fg', 'semi')
        icon(p, (x + w - 160, y0 + 10, x + w - 16, y0 + 120))
        if not nf: p.text((x + 26, y0 + 136), 'No first-time Kraken results this month.', 24, 'mut', 'semi'); return
        ch = max(70, min(118, (h - 150) // len(nf) - 14)); cw = w - 52
        for i, r in enumerate(nf):
            cx = x + 26; cy = y0 + 128 + i * (ch + 14)
            d.rounded_rectangle((cx, cy, cx + cw, cy + ch), 14, fill=C['row'], outline=C['mag'], width=3)
            p.fit((cx + 18, cy + 12), r['player'], cw - 220, 34, 'fg', 'black')
            p.text((cx + cw - 18, cy + 10), dmg(r['score']), 36, 'cyan', 'black', 'ra')
            if ch >= 90:
                md = r['metadata']
                bits = [f'{ordinal(md["rank"])} place' if md.get('rank') else None, f'{fmt(r["sparks"])} Sparks' if r.get('sparks') is not None else None]
                p.fit((cx + 18, cy + ch - 38), '  ·  '.join(bt for bt in bits if bt), cw - 36, 22, 'mut', 'semi')

    def box_avg(x, y0, w, h):
        p.neon((x, y0, x + w, y0 + h), 'cyan'); p.text((x + 26, y0 + 18), 'ABOVE OWN AVERAGE', 30, 'fg', 'black')
        s = f'{m["above"]} / {m["eligible"]}'; p.text((x + 26, y0 + 70), s, 62, 'green', 'black')
        tx = x + 46 + d.textlength(s, font=F(62, 'black'))
        p.text((tx, y0 + 84), 'returning players beat', 22, 'fg', 'semi'); p.text((tx, y0 + 112), 'their own earlier average', 22, 'fg', 'semi')

    def box_miles(x, y0, w, h):
        p.neon((x, y0, x + w, y0 + h), 'gold'); p.text((x + 26, y0 + 18), 'DAMAGE MILESTONES', 30, 'fg', 'black')
        hy = y0 + 70; d.rectangle((x + 18, hy - 6, x + w - 18, hy + 28), fill=C['row'])
        p.text((x + 30, hy), 'DAMAGE', 18, 'mut', 'semi'); p.text((x + w * 0.55, hy), 'PLAYERS', 18, 'mut', 'semi', 'ra')
        p.text((x + w - 30, hy), 'ARENA-ERA RANK', 18, 'mut', 'semi', 'ra')
        for i, (t, n, rk, of, tie) in enumerate(m['tiers']):
            ry = y0 + 116 + i * 48
            if i % 2 == 0: d.rectangle((x + 18, ry - 8, x + w - 18, ry + 38), fill=C['row2'])
            p.text((x + 30, ry), f'{t:,}M+', 26, 'fg', 'xbold')
            p.text((x + w * 0.55, ry - 2), str(n), 30, ['cyan', 'mag', 'gold', 'green'][i % 4], 'black', 'ra')
            p.text((x + w - 30, ry + 1), f'{"T-" if tie else ""}#{rk} of {of}', 26, 'gold' if rk == 1 else 'fg', 'xbold' if rk <= 3 else 'semi', 'ra')

    draw = dict(pb=box_pb, new=box_new, avg=box_avg, miles=box_miles)
    for col, x in (('L', M), ('R', M + L['LW'] + 24)):
        yy = y
        for name, w, h in L['cols'][col]: draw[name](x, yy, w, h); yy += h + 24
    y += L['bottom'] + 30

    p.neon((M, y, W - M, y + 250), 'cyan')
    icon(p, (M + 24, y + 18, M + 270, y + 232)); icon(p, (W - M - 270, y + 18, W - M - 24, y + 232), flip=True)
    cx = W // 2
    p.text((cx, y + 26), f'{clan}  /  KRAKEN', 34, 'mag', 'black', 'ma')
    p.text((cx, y + 74), f'{longdate(ev["date"])}  •  FINAL RESULTS', 22, 'fg', 'bold', 'ma')
    d.text((cx, y + 104), SIGNATURE, font=ImageFont.truetype(str(SIG_FONT), 72), fill=C['cyan'], anchor='ma')
    p.text((cx, y + 196), 'AVENGERS STAT CENTER', 26, 'gold', 'black', 'ma')
    fh = y + 250 + 30
    im = p.im.crop((0, 0, W, fh)); im.save(out, optimize=True)
    sha = hashlib.sha256(Path(out).read_bytes()).hexdigest()
    side = dict(file=str(out), eventId=ev['id'], clan=clan, projectionVersion=m['projectionVersion'], templateVersion=TEMPLATE,
                imageSHA256=sha, dimensions=[W, fh], players=len(m['rows']), damagePBs=len(m['pbs']),
                firstTracked=len(m['first']), readyToPost=False, discordPostingEnabled=False)
    Path(str(out).rsplit('.', 1)[0] + '.json').write_text(json.dumps(side, indent=2))
    return side


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('release'); ap.add_argument('output')
    ap.add_argument('--clan', choices=['AVENGERS', 'AV-2'], required=True); ap.add_argument('--event-id')
    a = ap.parse_args(); R = json.loads(Path(a.release).read_text())
    print(json.dumps(render(build_model(R, a.clan, a.event_id), a.output)))
