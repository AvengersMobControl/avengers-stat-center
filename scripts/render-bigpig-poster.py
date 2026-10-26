#!/usr/bin/env python3
"""Weekly Big Pig (Piggy Race) poster, same visual system as render-space-poster.py.

Usage:
  python3 scripts/render-bigpig-poster.py reports/approved-summary-release.json out.png --clan AVENGERS [--event-id 'piggy|2026-10-23']

Reads ONLY the approved canonical export. Rules (leader, 2026-10-25/26):
- Results count for the clan each player raced for in this race (event-time clan).
- Line PBs compare against the player's best anywhere on the site, any clan.
- Lobby pot = a racer's reward / their share %, never the screenshot header.
- Finishing-place PBs are clan-specific (AVENGERS lobby with 30+ AVENGERS; AV-2 5+).
Writes a sidecar JSON with readyToPost:false. Never posts anything.
"""
import argparse, datetime as dt, hashlib, importlib.util, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location('space_poster', ROOT / 'scripts' / 'render-space-poster.py')
SP = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(SP)
Poster, F, C, W, M = SP.Poster, SP.F, SP.C, SP.W, SP.M
fmt, pct, shortdate, longdate, mill, ordinal = SP.fmt, SP.pct, SP.shortdate, SP.longdate, SP.mill, SP.ordinal
TEMPLATE = 'bigpig-poster-v2-20261026-candidate'
ARENA_START = '2026-08-01'  # site meta.arenaStart
SIGNATURE = 'AV-HarryBallsagna'
TIERS = [5000, 10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000]
def lines(v): return fmt(v)
def klines(v): return f'{v/1000:g}K'


def lobby_pot(rows, official=None):
    """Same rule as the site's piggyPotTotal(): official total if recorded, else the
    rank-1 (highest share) racer's exact Sparks x10 (or Stars) / share."""
    if official: return float(official)
    best = None
    for r in rows:
        sh = (r.get('metadata') or {}).get('share')
        try: sh = float(sh)
        except (TypeError, ValueError): continue
        if not sh > 0: continue
        if sh >= 1: sh /= 100
        if best is None or sh > best[0]: best = (sh, r)
    if not best: return None
    sh, r = best
    if isinstance(r.get('sparks'), (int, float)) and r['sparks'] > 0: return r['sparks'] * 10 / sh
    if isinstance(r.get('stars'), (int, float)) and r['stars'] > 0: return r['stars'] / sh
    return None


def build_model(R, clan, event_id=None):
    P = R['projection']
    pig = sorted([e for e in P['events'] if e['kind'] == 'piggy' and e['status'] != 'revoked'], key=lambda e: e['date'])
    event = next(e for e in pig if e['id'] == event_id) if event_id else \
        [e for e in pig if any(r['clan'] == clan for r in e['rows'])][-1]
    rows = sorted([r for r in event['rows'] if r['clan'] == clan and r.get('score') is not None], key=lambda r: -r['score'])
    if not rows: raise SystemExit(f'No {clan} rows in {event["id"]}')
    lobby_rows = [r for r in event['rows'] if (r.get('metadata') or {}).get('lobby') == rows[0]['metadata'].get('lobby')] \
        if rows[0]['metadata'].get('lobby') else rows
    others = [r for r in lobby_rows if r['clan'] != clan]
    earlier = [e for e in pig if e['date'] < event['date']]
    prior = next((e for e in reversed(earlier) if any(r['clan'] == clan for r in e['rows'])), None)
    prior_rows = [r for r in prior['rows'] if r['clan'] == clan and r.get('score') is not None] if prior else []

    hist = {}
    for e in earlier:
        for r in e['rows']:
            if r.get('score') is not None: hist.setdefault(r['player'], []).append((e['date'], r['score']))
    all_scores = sorted([r['score'] for e in pig if ARENA_START <= e['date'] <= event['date'] for r in e['rows'] if r.get('score') is not None], reverse=True)
    def alltime_rank(s): return 1 + sum(1 for x in all_scores if x > s)
    # All-time (not arena-only) 1st-place and podium finishes, any clan, through this race.
    finishes = {}
    for e in pig:
        if e['date'] > event['date']: continue
        for r in e['rows']:
            k = (r.get('metadata') or {}).get('rank')
            if isinstance(k, int) and 1 <= k <= 3:
                w, pdm = finishes.get(r['player'], (0, 0)); finishes[r['player']] = (w + (k == 1), pdm + 1)
    # This race plus the clan's previous four Big Pigs.
    recent = []
    for e in [x for x in pig if x['date'] <= event['date']][::-1]:
        rr = [r['score'] for r in e['rows'] if r['clan'] == clan and r.get('score') is not None]
        if rr: recent.append(dict(date=e['date'], n=len(rr), total=sum(rr), avg=sum(rr) / len(rr),
                                  weekday=dt.date.fromisoformat(e['date']).weekday() < 5))
        if len(recent) == 5: break
    # Milestone counts ranked against every Arena-era Big Pig for this clan (ties share a rank).
    arena_counts = [[r['score'] for r in e['rows'] if r['clan'] == clan and r.get('score') is not None]
                    for e in pig if ARENA_START <= e['date'] <= event['date']]
    arena_counts = [c for c in arena_counts if c]

    pbs, first = [], []
    for r in rows:
        h = hist.get(r['player'], [])
        if not h: first.append(r); continue
        prev = max(s for _, s in h)
        if r['score'] > prev:
            pdate = max(d for d, s in h if s == prev)
            pbs.append(dict(name=r['player'], old=prev, oldDate=pdate, new=r['score'], imp=r['score'] / prev - 1))
    pbs.sort(key=lambda x: -x['imp'])
    place = [x for x in (R.get('piggyPlacementPBs') or {}).get(event['id'], []) if x.get('improved')
             and any(r['player'] == x['player'] for r in rows)]
    place_dates = {}
    for x in place:
        for e in reversed(earlier):
            if any(r['player'] == x['player'] and r['metadata'].get('rank') == x['previousRank'] and r['clan'] == clan for r in e['rows']):
                place_dates[x['player']] = e['date']; break

    above, eligible, bva = 0, 0, None
    for r in rows:
        h = hist.get(r['player'], [])
        if not h: continue
        eligible += 1; avg = sum(s for _, s in h) / len(h)
        if r['score'] > avg: above += 1
        if len(h) >= 3:
            g = r['score'] / avg - 1
            if not bva or g > bva['gain']: bva = dict(name=r['player'], gain=g, avg=avg, score=r['score'], n=len(h))

    # Pot and all-time pot rank among this clan's Big Pig lobbies (lobby split by clan when unlabeled).
    official = (R.get('officialPotTotals') or {})
    pots = []
    for e in pig:
        if e['date'] > event['date']: continue
        crow = [r for r in e['rows'] if r['clan'] == clan]
        if not crow: continue
        lob = crow[0]['metadata'].get('lobby')
        lrows = [r for r in e['rows'] if (r.get('metadata') or {}).get('lobby') == lob] if lob else crow
        p = lobby_pot(lrows, official.get(e['date']) if clan == 'AVENGERS' else None)
        if p: pots.append((p, e['date']))
    pots.sort(key=lambda x: -x[0])
    pot = lobby_pot(lobby_rows, official.get(event['date']) if clan == 'AVENGERS' else None)
    pot_rank = 1 + sum(1 for p, d in pots if p > pot + 0.5) if pot else None
    apots = [(p, d) for p, d in pots if d >= ARENA_START]
    pot_rank_arena = 1 + sum(1 for p, d in apots if p > pot + 0.5) if pot else None
    top_reward = max(rows, key=lambda r: r.get('stars') or 0)
    clan_share = sum((r['metadata'].get('share') or 0) for r in rows)

    anchor = dt.date(2026, 10, 12); d = dt.date.fromisoformat(event['date'])
    lstart = anchor + dt.timedelta(days=35 * ((d - anchor).days // 35)); lend = lstart + dt.timedelta(days=34)
    ldist, lsp = {}, {}
    for e in P['events']:
        if e['status'] == 'revoked' or not (lstart.isoformat() <= e['date'] <= event['date']): continue
        for r in e['rows']:
            if r['clan'] != clan: continue
            if e['kind'] != 'piggy': continue  # Big Pig only: lines and Sparks leaders
            if r.get('score') is not None: ldist[r['player']] = ldist.get(r['player'], 0) + r['score']
            if r.get('sparks') is not None: lsp[r['player']] = lsp.get(r['player'], 0) + r['sparks']

    total = sum(r['score'] for r in rows); ptotal = sum(r['score'] for r in prior_rows)
    return dict(event=event, clan=clan, rows=rows, others=others, lobbySize=len(lobby_rows), prior=prior, priorRows=prior_rows,
                total=total, avg=total / len(rows), ptotal=ptotal, pavg=ptotal / len(prior_rows) if prior_rows else None,
                stars=sum(r['stars'] or 0 for r in rows), sparks=sum(r['sparks'] or 0 for r in rows),
                pot=pot, potRank=pot_rank, potOf=len(pots), potRankArena=pot_rank_arena, potOfArena=len(apots),
                clanShare=clan_share, topReward=top_reward, recent=recent, finishes=finishes,
                pbs=pbs, place=place, placeDates=place_dates, first=sorted(first, key=lambda r: -r['score']),
                above=above, eligible=eligible, bestVsAvg=bva,
                leagueStart=lstart.isoformat(), leagueEnd=lend.isoformat(),
                leagueLines=max(ldist.items(), key=lambda x: x[1]) if ldist else None,
                leagueSparks=max(lsp.items(), key=lambda x: x[1]) if lsp else None,
                tiers=[(t, n, 1 + sum(1 for c in arena_counts if sum(1 for s in c if s >= t) > n), len(arena_counts),
                        sum(1 for c in arena_counts if sum(1 for s in c if s >= t) == n) > 1)
                       for t in TIERS for n in [sum(1 for r in rows if r['score'] >= t)] if n],
                allTimeRank={r['player']: alltime_rank(r['score']) for r in rows[:10]}, allTimeN=len(all_scores),
                projectionVersion=P.get('version'), complete=bool(event.get('metadata', {}).get('complete')))


def plan(m):
    LW = 1010; RW = W - 2 * M - LW - 24
    nf = len(m['first'])
    pb_h = 122 + 50 * max(1, len(m['pbs'])) + (64 + 50 * len(m['place']) if m['place'] else 0) + 20
    boxes = [('new', 140 + max(1, nf) * 118), ('avg', 170), ('miles', 116 + len(m['tiers']) * 48 + 16)]
    # Try every left/right split (New Faces always top-right) and keep the most even one.
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
    H = 370 + 160 + 96 + CH + 24 + 330 + (140 + 54 * L['n10'] + 30) + 30 + L['bottom'] + 30 + 230 + 40
    p = Poster(H); d = p.d

    p.char('AV_ChickenHawkeye.png', (24, 16, 400, 340)); p.char('AV_GNHulk.png', (W - 400, 16, W - 24, 340))
    p.text((W // 2, 46), clan, 112, 'fg', 'black', 'ma')
    p.text((W // 2, 176), 'BIG PIG', 88, 'mag', 'black', 'ma')
    p.text((W // 2, 290), f'{longdate(ev["date"])}  •  FINAL RESULTS', 30, 'fg', 'bold', 'ma')
    d.line((W // 2 - 440, 340, W // 2 + 440, 340), fill=C['mag'], width=3)
    y = 370

    kpis = [('PLAYERS', fmt(len(m['rows'])), 'cyan'), ('TOTAL LINES', lines(m['total']), 'white'),
            ('AVG LINES', lines(round(m['avg'])), 'mag'), ('EARNED STARS', fmt(m['stars']), 'gold'),
            ('EARNED SPARKS', fmt(m['sparks']), 'green')]
    bw = (W - 2 * M - 4 * 18) // 5
    for i, (lab, val, col) in enumerate(kpis):
        x = M + i * (bw + 18); p.neon((x, y, x + bw, y + 136), col)
        p.fit((x + bw // 2, y + 22), val, bw - 30, 58, col if col != 'white' else 'fg', 'black', 'ma')
        p.text((x + bw // 2, y + 96), lab, 22, 'fg', 'semi', 'ma')
    y += 160

    # Pot rank ribbon (one lobby per week, so no lobby panel).
    p.neon((M, y, W - M, y + 72), 'gold', radius=18)
    segs = [('LOBBY POT ', 'mut', 'xbold', 24), (mill(m['pot']) if m['pot'] else '—', 'gold', 'black', 38)]
    if m['potRankArena']:
        segs += [('   #' + str(m['potRankArena']), 'gold', 'black', 38), (f' OF {m["potOfArena"]} IN THE ARENA ERA', 'fg', 'xbold', 24)]
    if m['potRank']:
        segs += [('   ·   ', 'mut', 'xbold', 24), (f'#{m["potRank"]} OF {m["potOf"]} ALL-TIME LOGGED {clan} POTS', 'mut', 'semi', 22)]
    tw = sum(d.textlength(t, font=F(sz, wt)) for t, _, wt, sz in segs); x = W // 2 - tw / 2
    for t, col, wt, sz in segs:
        p.text((x, y + 36), t, sz, col, wt, 'lm'); x += d.textlength(t, font=F(sz, wt))
    y += 96

    # Change vs the previous four Big Pigs.
    rec = m['recent']; cur = rec[0]
    p.neon((M, y, W - M, y + CH), 'cyan')
    p.title(M + 32, y + 22, 'CHANGE VS LAST 4 BIG PIGS', 'WEEKDAY = Friday race', W - M - 32, 34)
    hx = [(M + 40, 'RACE', 'la'), (720, 'RACERS', 'ra'), (980, 'TOTAL LINES', 'ra'), (1170, f'{shortdate(cur["date"]).upper()} VS', 'ra'),
          (1460, 'AVG / PLAYER', 'ra'), (W - M - 40, f'{shortdate(cur["date"]).upper()} VS', 'ra')]
    hy = y + 82; d.rectangle((M + 24, hy - 6, W - M - 24, hy + 30), fill=C['row'])
    for cx, lab, a in hx: p.text((cx, hy), lab, 19, 'mut', 'semi', a)
    prev = rec[1:]
    avgrow = dict(label='4-RACE AVERAGE', n=sum(r['n'] for r in prev) / len(prev), total=sum(r['total'] for r in prev) / len(prev),
                  avg=sum(r['total'] for r in prev) / sum(r['n'] for r in prev)) if prev else None
    rows5 = [dict(r, label=shortdate(r['date']).upper()) for r in rec] + ([avgrow] if avgrow else [])
    for i, r in enumerate(rows5):
        ry = y + 128 + i * 50; this = i == 0; avgr = r is avgrow
        if this: d.rounded_rectangle((M + 24, ry - 8, W - M - 24, ry + 40), 8, fill='#1d1240', outline=C['mag'], width=2)
        elif i % 2 == 0: d.rectangle((M + 24, ry - 8, W - M - 24, ry + 40), fill=C['row2'])
        if avgr: d.line((M + 24, ry - 9, W - M - 24, ry - 9), fill='#2a3f6e', width=2)
        lab = ('THIS RACE · ' if this else '') + r['label']
        p.text((M + 40, ry + 2), lab, 24, 'mag' if this else ('cyan' if avgr else 'fg'), 'black' if this or avgr else 'bold')
        if r.get('weekday'):
            tx = M + 52 + d.textlength(lab, font=F(24, 'black' if this else 'bold'))
            d.rounded_rectangle((tx, ry, tx + 132, ry + 32), 8, fill='#2a2410', outline=C['gold'], width=2)
            p.text((tx + 66, ry + 4), 'WEEKDAY', 18, 'gold', 'xbold', 'ma')
        p.text((720, ry + 2), fmt(round(r['n'])) if not avgr else f'{r["n"]:.1f}', 24, 'fg', 'semi', 'ra')
        p.text((980, ry + 2), lines(round(r['total'])), 26, 'fg', 'black' if this else 'semi', 'ra')
        p.text((1460, ry + 2), lines(round(r['avg'])), 26, 'fg', 'black' if this else 'semi', 'ra')
        if not this:
            for cx, k in ((1170, 'total'), (W - M - 40, 'avg')):
                ch = cur[k] / r[k] - 1; p.text((cx, ry + 2), pct(ch), 26, 'green' if ch >= 0 else 'red', 'xbold', 'ra')
    y += CH + 24

    p.neon((M, y, W - M, y + 306), 'purple')
    p.title(M + 32, y + 22, 'INDIVIDUAL SPOTLIGHTS', f'Clan league {shortdate(m["leagueStart"])} – {shortdate(m["leagueEnd"])}', W - M - 32, 34)
    top = m['rows'][0]; b = m['bestVsAvg']
    spots = [('TOP LINE CONTRIBUTOR', top['player'], lines(top['score']), 'Most lines this race', 'gold'),
             ('BIGGEST JUMP VS OWN AVG', b['name'] if b else '—', pct(b['gain']) if b else '—',
              f'{lines(b["score"])} vs {lines(round(b["avg"]))} avg ({b["n"]} races)' if b else 'Needs 3+ earlier races', 'green'),
             ('LEAGUE BIG PIG LINES LEADER', m['leagueLines'][0] if m['leagueLines'] else '—', lines(m['leagueLines'][1]) if m['leagueLines'] else '—',
              'Big Pig lines only, this league', 'cyan'),
             ('LEAGUE BIG PIG SPARKS LEADER', m['leagueSparks'][0] if m['leagueSparks'] else '—', fmt(m['leagueSparks'][1]) if m['leagueSparks'] else '—',
              'Big Pig Sparks only, this league', 'mag')]
    sw = (W - 2 * M - 64 - 3 * 16) // 4
    for i, (lab, name, val, sub, col) in enumerate(spots):
        x = M + 32 + i * (sw + 16); yy = y + 84
        d.rounded_rectangle((x, yy, x + sw, yy + 196), 16, fill=C['row'])
        p.fit((x + 18, yy + 16), lab, sw - 36, 19, col, 'xbold'); p.fit((x + 18, yy + 48), name, sw - 36, 30, 'fg', 'black')
        p.fit((x + 18, yy + 92), val, sw - 36, 46, col, 'black'); p.fit((x + 18, yy + 158), sub, sw - 36, 18, 'mut', 'med')
    y += 330

    n10 = L['n10']; th = 140 + 54 * n10
    p.neon((M, y, W - M, y + th), 'cyan')
    p.title(M + 32, y + 22, 'TOP 10  /  LINES', f'ALL TIME (ARENA ERA) RANK AMONG {fmt(m["allTimeN"])} BIG PIG RESULTS', W - M - 32, 34)
    cols = [(M + 50, '#', 'ma'), (M + 96, 'PLAYER', 'la'), (800, 'LINES', 'ra'), (1040, 'STARS', 'ra'), (1170, 'SHARE', 'ra'),
            (1330, 'ALL-TIME 1STS', 'ra'), (1530, 'ALL-TIME PODIUMS', 'ra'), (W - M - 36, 'ARENA RANK', 'ra')]
    hy = y + 82; d.rectangle((M + 24, hy - 6, W - M - 24, hy + 32), fill=C['row'])
    for x, lab, a in cols: p.text((x, hy), lab, 19, 'mut', 'semi', a)
    for i, r in enumerate(m['rows'][:10]):
        ry = y + 128 + i * 54
        if i % 2 == 0: d.rectangle((M + 24, ry - 8, W - M - 24, ry + 44), fill=C['row2'])
        badge = {0: 'gold', 1: 'cyan', 2: 'mag'}.get(i)
        if badge:
            d.rounded_rectangle((M + 30, ry - 2, M + 70, ry + 36), 7, fill=C[badge]); p.text((M + 50, ry + 2), i + 1, 26, '#0a1530', 'black', 'ma')
        else: p.text((M + 50, ry + 2), i + 1, 26, 'fg', 'bold', 'ma')
        p.fit((M + 96, ry + 2), r['player'], 500, 28, 'gold' if i == 0 else 'fg', 'bold')
        sh = r['metadata'].get('share'); wins, pods = m['finishes'].get(r['player'], (0, 0))
        vals = [(800, lines(r['score']), 'fg'), (1040, fmt(r['stars']) if r['stars'] is not None else '—', 'gold'),
                (1170, f'{sh*100:g}%' if sh else '—', 'fg'), (1330, str(wins), 'gold' if wins else 'mut'),
                (1530, str(pods), 'mag' if pods else 'mut'),
                (W - M - 36, f'{m["allTimeRank"][r["player"]]} / {fmt(m["allTimeN"])}', 'cyan')]
        for x, v, col in vals: p.text((x, ry + 4), v, 26, col, 'semi', 'ra')
    y += th + 30

    def box_pb(x, y0, w, h):
        p.neon((x, y0, x + w, y0 + h), 'gold'); p.title(x + 28, y0 + 22, 'PERSONAL BESTS', None, None, 34)
        n = str(len(m['pbs'])); p.text((x + w - 28, y0 + 22), n, 40, 'gold', 'black', 'ra')
        p.text((x + w - 40 - d.textlength(n, font=F(40, 'black')), y0 + 34), 'NEW LINE PBs', 22, 'fg', 'xbold', 'ra')
        hdr = [(x + 46, '#', 'ma'), (x + 78, 'PLAYER', 'la'), (x + 560, 'PREVIOUS', 'ra'), (x + 690, 'DATE', 'ra'), (x + 860, 'NEW PB', 'ra'), (x + w - 28, 'GAIN', 'ra')]
        hy = y0 + 78; d.rectangle((x + 20, hy - 6, x + w - 20, hy + 30), fill=C['row'])
        for cx, lab, a in hdr: p.text((cx, hy), lab, 18, 'mut', 'semi', a)
        if not m['pbs']: p.text((x + 40, y0 + 130), 'No new line PBs this race.', 26, 'mut', 'semi')
        for i, b in enumerate(m['pbs']):
            ry = y0 + 122 + i * 50
            if i % 2 == 0: d.rectangle((x + 20, ry - 8, x + w - 20, ry + 40), fill=C['row2'])
            p.text((x + 46, ry + 2), i + 1, 22, 'gold', 'black', 'ma'); p.fit((x + 78, ry + 1), b['name'], 380, 26, 'fg', 'bold')
            p.text((x + 560, ry + 3), lines(b['old']), 24, 'mut', 'semi', 'ra'); p.text((x + 690, ry + 5), shortdate(b['oldDate']), 20, 'mut', 'med', 'ra')
            p.text((x + 860, ry + 1), lines(b['new']), 26, 'gold', 'black', 'ra'); p.text((x + w - 28, ry + 2), pct(b['imp']), 24, 'green', 'xbold', 'ra')
        if m['place']:
            py = y0 + 122 + max(1, len(m['pbs'])) * 50 + 14
            p.text((x + 28, py), 'FINISHING-PLACE PBs', 26, 'cyan', 'black')
            p.text((x + w - 28, py + 6), f'Best place in a {clan} lobby of 30+', 18, 'mut', 'semi', 'ra')
            for i, q in enumerate(m['place']):
                ry = py + 46 + i * 50
                if i % 2 == 0: d.rectangle((x + 20, ry - 8, x + w - 20, ry + 40), fill=C['row2'])
                p.fit((x + 78, ry + 1), q['player'], 380, 26, 'fg', 'bold')
                p.text((x + 560, ry + 3), ordinal(q['previousRank']), 24, 'mut', 'semi', 'ra')
                pd = m['placeDates'].get(q['player']); p.text((x + 690, ry + 5), shortdate(pd) if pd else '—', 20, 'mut', 'med', 'ra')
                p.text((x + 860, ry + 1), ordinal(q['newRank']), 26, 'cyan', 'black', 'ra')

    def box_new(x, y0, w, h):
        nf = m['first']; p.neon((x, y0, x + w, y0 + h), 'mag', width=4)
        p.text((x + 26, y0 + 20), 'NEW FACES', 46, 'mag', 'black'); p.text((x + 26, y0 + 74), 'First tracked Big Pig', 22, 'fg', 'semi')
        p.char('AV_LBCA.png', (x + w - 160, y0 + 10, x + w - 16, y0 + 120))
        if not nf: p.text((x + 26, y0 + 136), 'No first-time racers this week.', 24, 'mut', 'semi'); return
        ch = max(70, min(118, (h - 150) // len(nf) - 14)); cw = w - 52
        for i, r in enumerate(nf):
            cx = x + 26; cy = y0 + 128 + i * (ch + 14)
            d.rounded_rectangle((cx, cy, cx + cw, cy + ch), 14, fill=C['row'], outline=C['mag'], width=3)
            p.fit((cx + 18, cy + 12), r['player'], cw - 220, 34, 'fg', 'black')
            p.text((cx + cw - 18, cy + 10), lines(r['score']), 36, 'cyan', 'black', 'ra')
            if ch >= 90:
                md = r['metadata']
                bits = [f'{ordinal(md["rank"])} place' if md.get('rank') else None, f'{fmt(r["stars"])} Stars' if r.get('stars') is not None else None,
                        f'{fmt(r["sparks"])} Sparks' if r.get('sparks') is not None else None]
                p.fit((cx + 18, cy + ch - 38), '  ·  '.join(b for b in bits if b), cw - 36, 22, 'mut', 'semi')

    def box_avg(x, y0, w, h):
        p.neon((x, y0, x + w, y0 + h), 'cyan'); p.text((x + 26, y0 + 18), 'ABOVE OWN AVERAGE', 30, 'fg', 'black')
        s = f'{m["above"]} / {m["eligible"]}'; p.text((x + 26, y0 + 70), s, 62, 'green', 'black')
        tx = x + 46 + d.textlength(s, font=F(62, 'black'))
        p.text((tx, y0 + 84), 'returning racers beat', 22, 'fg', 'semi'); p.text((tx, y0 + 112), 'their own earlier average', 22, 'fg', 'semi')

    def box_miles(x, y0, w, h):
        p.neon((x, y0, x + w, y0 + h), 'gold'); p.text((x + 26, y0 + 18), 'LINE MILESTONES', 30, 'fg', 'black')
        hy = y0 + 70; d.rectangle((x + 18, hy - 6, x + w - 18, hy + 28), fill=C['row'])
        p.text((x + 30, hy), 'LINES', 18, 'mut', 'semi'); p.text((x + w * 0.55, hy), 'RACERS', 18, 'mut', 'semi', 'ra')
        p.text((x + w - 30, hy), 'ARENA-ERA RANK', 18, 'mut', 'semi', 'ra')
        for i, (t, n, rk, of, tie) in enumerate(m['tiers']):
            ry = y0 + 116 + i * 48
            if i % 2 == 0: d.rectangle((x + 18, ry - 8, x + w - 18, ry + 38), fill=C['row2'])
            p.text((x + 30, ry), f'{klines(t)}+', 26, 'fg', 'xbold')
            p.text((x + w * 0.55, ry - 2), str(n), 30, ['cyan', 'mag', 'gold', 'green'][i % 4], 'black', 'ra')
            p.text((x + w - 30, ry + 1), f'{"T-" if tie else ""}#{rk} of {of}', 26, 'gold' if rk == 1 else 'fg', 'xbold' if rk <= 3 else 'semi', 'ra')

    draw = dict(pb=box_pb, new=box_new, avg=box_avg, miles=box_miles)
    for c, x in (('L', M), ('R', M + L['LW'] + 24)):
        yy = y
        for name, w, h in L['cols'][c]: draw[name](x, yy, w, h); yy += h + 24
    y += L['bottom'] + 30

    p.neon((M, y, W - M, y + 230), 'cyan')
    p.char('AV_MZGroot.png', (M + 24, y + 14, M + 260, y + 216)); p.char('AV_RaccoonRocket.png', (W - M - 260, y + 14, W - M - 24, y + 216))
    cx = W // 2
    p.text((cx, y + 26), f'{clan}  /  BIG PIG', 34, 'mag', 'black', 'ma')
    p.text((cx, y + 74), f'{longdate(ev["date"])}  •  FINAL RESULTS', 22, 'fg', 'bold', 'ma')
    p.text((cx, y + 116), f'— {SIGNATURE}', 34, 'cyan', 'xbold', 'ma')
    p.text((cx, y + 172), 'AVENGERS STAT CENTER', 26, 'gold', 'black', 'ma')
    fh = y + 230 + 30
    im = p.im.crop((0, 0, W, fh)); im.save(out, optimize=True)
    sha = hashlib.sha256(Path(out).read_bytes()).hexdigest()
    side = dict(file=str(out), eventId=ev['id'], clan=clan, projectionVersion=m['projectionVersion'], templateVersion=TEMPLATE,
                imageSHA256=sha, dimensions=[W, fh], players=len(m['rows']), linePBs=len(m['pbs']), placePBs=len(m['place']),
                firstTracked=len(m['first']), readyToPost=False, discordPostingEnabled=False)
    Path(str(out).rsplit('.', 1)[0] + '.json').write_text(json.dumps(side, indent=2))
    return side


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('release'); ap.add_argument('output')
    ap.add_argument('--clan', choices=['AVENGERS', 'AV-2'], required=True); ap.add_argument('--event-id')
    a = ap.parse_args(); R = json.loads(Path(a.release).read_text())
    print(json.dumps(render(build_model(R, a.clan, a.event_id), a.output)))
