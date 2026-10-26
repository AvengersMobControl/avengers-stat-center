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
TEMPLATE = 'bigpig-poster-v1-20261026-candidate'
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
    all_scores = sorted([r['score'] for e in pig if e['date'] <= event['date'] for r in e['rows'] if r.get('score') is not None], reverse=True)
    def alltime_rank(s): return 1 + sum(1 for x in all_scores if x > s)

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
    pot = lobby_pot(lobby_rows)
    pot_rank = 1 + sum(1 for p, d in pots if p > pot + 0.5) if pot else None
    top_reward = max(rows, key=lambda r: r.get('stars') or 0)
    clan_share = sum((r['metadata'].get('share') or 0) for r in rows)

    anchor = dt.date(2026, 10, 12); d = dt.date.fromisoformat(event['date'])
    lstart = anchor + dt.timedelta(days=35 * ((d - anchor).days // 35)); lend = lstart + dt.timedelta(days=34)
    ldist, lsp = {}, {}
    for e in P['events']:
        if e['status'] == 'revoked' or not (lstart.isoformat() <= e['date'] <= event['date']): continue
        for r in e['rows']:
            if r['clan'] != clan: continue
            if e['kind'] == 'piggy' and r.get('score') is not None: ldist[r['player']] = ldist.get(r['player'], 0) + r['score']
            if r.get('sparks') is not None: lsp[r['player']] = lsp.get(r['player'], 0) + r['sparks']

    total = sum(r['score'] for r in rows); ptotal = sum(r['score'] for r in prior_rows)
    return dict(event=event, clan=clan, rows=rows, others=others, lobbySize=len(lobby_rows), prior=prior, priorRows=prior_rows,
                total=total, avg=total / len(rows), ptotal=ptotal, pavg=ptotal / len(prior_rows) if prior_rows else None,
                stars=sum(r['stars'] or 0 for r in rows), sparks=sum(r['sparks'] or 0 for r in rows),
                pot=pot, potRank=pot_rank, potOf=len(pots), clanShare=clan_share, topReward=top_reward,
                pbs=pbs, place=place, placeDates=place_dates, first=sorted(first, key=lambda r: -r['score']),
                above=above, eligible=eligible, bestVsAvg=bva,
                leagueStart=lstart.isoformat(), leagueEnd=lend.isoformat(),
                leagueLines=max(ldist.items(), key=lambda x: x[1]) if ldist else None,
                leagueSparks=max(lsp.items(), key=lambda x: x[1]) if lsp else None,
                tiers=[(t, sum(1 for r in rows if r['score'] >= t)) for t in TIERS if any(r['score'] >= t for r in rows)],
                allTimeRank={r['player']: alltime_rank(r['score']) for r in rows[:10]}, allTimeN=len(all_scores),
                projectionVersion=P.get('version'), complete=bool(event.get('metadata', {}).get('complete')))


def plan(m):
    LW = 1010; RW = W - 2 * M - LW - 24
    nf = len(m['first'])
    pb_h = 122 + 50 * max(1, len(m['pbs'])) + (64 + 50 * len(m['place']) if m['place'] else 0) + 54
    boxes = [('new', 140 + max(1, nf) * 118), ('avg', 170), ('miles', 70 + ((len(m['tiers']) + 1) // 2) * 56 + 30)]
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
    H = 370 + 160 + 300 + 50 + 160 + 330 + (140 + 54 * L['n10'] + 30) + 30 + L['bottom'] + 30 + 300 + 40
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

    # Lobby pot panel
    p.neon((M, y, W - M, y + 280), 'mag')
    p.text((M + 32, y + 22), 'LOBBY POT', 38, 'mag', 'black')
    d.line((M + 28, y + 80, W - M - 28, y + 80), fill='#2a3f6e', width=2)
    p.text((M + 32, y + 98), 'POT STARS', 20, 'mut', 'semi')
    p.text((M + 32, y + 122), mill(m['pot']) if m['pot'] else '—', 64, 'mag', 'black')
    if m['potRank']:
        rk = f'#{m["potRank"]} of {m["potOf"]} {clan} Big Pig pots'
        d.rounded_rectangle((M + 30, y + 206, M + 56 + d.textlength(rk, font=F(21, 'xbold')), y + 244), 10,
                            fill='#2a2410', outline=C['gold'], width=2)
        p.text((M + 43, y + 212), rk, 21, 'gold', 'xbold')
    tr = m['topReward']
    cells = [(f'{clan} SHARE', f'{m["clanShare"]*100:.0f}%', 'fg'),
             ('RACERS', f'{len(m["rows"])} / {m["lobbySize"]}', 'fg'),
             ('BIGGEST INDIVIDUAL POT', fmt(tr['stars']), 'gold'),
             ('', f'{tr["player"]} · {ordinal(tr["metadata"].get("rank"))} · {tr["metadata"].get("share",0)*100:g}%', 'fg')]
    p.text((M + 520, y + 98), cells[0][0], 20, 'mut', 'semi'); p.text((M + 520, y + 122), cells[0][1], 40, 'fg', 'xbold')
    p.text((M + 760, y + 98), cells[1][0], 20, 'mut', 'semi'); p.text((M + 760, y + 122), cells[1][1], 40, 'fg', 'xbold')
    p.text((M + 520, y + 186), cells[2][0], 20, 'mut', 'semi')
    p.text((M + 520, y + 210), cells[2][1], 36, 'gold', 'black')
    p.fit((M + 520 + d.textlength(cells[2][1], font=F(36, 'black')) + 18, y + 220), cells[3][1], 520, 22, 'fg', 'semi')
    p.char('AV_BBDrax.png', (W - M - 300, y + 90, W - M - 160, y + 270))
    p.char('AV_KaboomStar.png', (W - M - 170, y + 90, W - M - 24, y + 270))
    y += 300
    note = 'Pot = a racer\'s reward ÷ their share %.'
    if m['others']: note += f' {len(m["others"])} racer in this lobby raced for another clan and is not in {clan} totals.'
    p.text((M + 6, y), note, 20, 'mut', 'med'); y += 44

    p.neon((M, y, W - M, y + 136), 'cyan')
    p.text((M + 32, y + 22), 'CHANGE VS LAST BIG PIG', 34, 'fg', 'black')
    if m['prior']:
        p.text((W - M - 32, y + 32), f'vs {shortdate(m["prior"]["date"])} · {len(m["rows"])} raced vs {len(m["priorRows"])}', 22, 'mut', 'semi', 'ra')
        for j, (lab, now, was) in enumerate([('TOTAL LINES', m['total'], m['ptotal']), ('AVG / PLAYER', m['avg'], m['pavg'])]):
            x = M + 32 + j * 860; ch = now / was - 1 if was else 0
            p.text((x, y + 84), lab, 22, 'mut', 'semi'); p.text((x + 300, y + 74), lines(round(now)), 40, 'fg', 'black')
            p.text((x + 790, y + 74), pct(ch), 40, 'green' if ch >= 0 else 'red', 'black', 'ra')
    y += 160

    p.neon((M, y, W - M, y + 306), 'purple')
    p.title(M + 32, y + 22, 'INDIVIDUAL SPOTLIGHTS', f'Clan league {shortdate(m["leagueStart"])} – {shortdate(m["leagueEnd"])}', W - M - 32, 34)
    top = m['rows'][0]; b = m['bestVsAvg']
    spots = [('TOP LINE CONTRIBUTOR', top['player'], lines(top['score']), 'Most lines this race', 'gold'),
             ('BIGGEST JUMP VS OWN AVG', b['name'] if b else '—', pct(b['gain']) if b else '—',
              f'{lines(b["score"])} vs {lines(round(b["avg"]))} avg ({b["n"]} races)' if b else 'Needs 3+ earlier races', 'green'),
             ('LEAGUE LINES LEADER', m['leagueLines'][0] if m['leagueLines'] else '—', lines(m['leagueLines'][1]) if m['leagueLines'] else '—',
              'Big Pig lines this league', 'cyan'),
             ('LEAGUE SPARKS LEADER', m['leagueSparks'][0] if m['leagueSparks'] else '—', fmt(m['leagueSparks'][1]) if m['leagueSparks'] else '—',
              'Sparks, all events this league', 'mag')]
    sw = (W - 2 * M - 64 - 3 * 16) // 4
    for i, (lab, name, val, sub, col) in enumerate(spots):
        x = M + 32 + i * (sw + 16); yy = y + 84
        d.rounded_rectangle((x, yy, x + sw, yy + 196), 16, fill=C['row'])
        p.fit((x + 18, yy + 16), lab, sw - 36, 19, col, 'xbold'); p.fit((x + 18, yy + 48), name, sw - 36, 30, 'fg', 'black')
        p.fit((x + 18, yy + 92), val, sw - 36, 46, col, 'black'); p.fit((x + 18, yy + 158), sub, sw - 36, 18, 'mut', 'med')
    y += 330

    n10 = L['n10']; th = 140 + 54 * n10
    p.neon((M, y, W - M, y + th), 'cyan')
    p.title(M + 32, y + 22, 'TOP 10  /  LINES', f'ALL-TIME RANK AMONG {fmt(m["allTimeN"])} BIG PIG RESULTS', W - M - 32, 34)
    cols = [(M + 50, '#', 'ma'), (M + 96, 'PLAYER', 'la'), (760, 'LINES', 'ra'), (870, 'FINISH', 'ra'), (1080, 'STARS', 'ra'),
            (1250, 'SPARKS', 'ra'), (1370, 'SHARE', 'ra'), (1520, 'SP / LINE', 'ra'), (W - M - 36, 'ALL-TIME', 'ra')]
    hy = y + 82; d.rectangle((M + 24, hy - 6, W - M - 24, hy + 32), fill=C['row'])
    for x, lab, a in cols: p.text((x, hy), lab, 19, 'mut', 'semi', a)
    for i, r in enumerate(m['rows'][:10]):
        ry = y + 128 + i * 54
        if i % 2 == 0: d.rectangle((M + 24, ry - 8, W - M - 24, ry + 44), fill=C['row2'])
        badge = {0: 'gold', 1: 'cyan', 2: 'mag'}.get(i)
        if badge:
            d.rounded_rectangle((M + 30, ry - 2, M + 70, ry + 36), 7, fill=C[badge]); p.text((M + 50, ry + 2), i + 1, 26, '#0a1530', 'black', 'ma')
        else: p.text((M + 50, ry + 2), i + 1, 26, 'fg', 'bold', 'ma')
        p.fit((M + 96, ry + 2), r['player'], 480, 28, 'gold' if i == 0 else 'fg', 'bold')
        md = r['metadata']; sh = md.get('share')
        vals = [(760, lines(r['score']), 'fg'), (870, ordinal(md['rank']) if md.get('rank') else '—', 'mut'),
                (1080, fmt(r['stars']) if r['stars'] is not None else '—', 'gold'), (1250, fmt(r['sparks']) if r['sparks'] is not None else '—', 'green'),
                (1370, f'{sh*100:g}%' if sh else '—', 'fg'), (1520, f'{r["sparks"]/r["score"]:.1f}' if r.get('sparks') else '—', 'cyan'),
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
        p.text((x + 28, y0 + h - 34), "Line PBs compare with each player's best anywhere on the site.", 18, 'mut', 'med')

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
        for i, (t, n) in enumerate(m['tiers']):
            cx = x + 26 + (i % 2) * ((w - 52) // 2); cy = y0 + 70 + (i // 2) * 56
            p.text((cx, cy), str(n), 42, ['cyan', 'mag', 'gold', 'green'][i % 4], 'black')
            p.text((cx + d.textlength(str(n), font=F(42, 'black')) + 14, cy + 14), f'{klines(t)}+ LINES', 22, 'fg', 'semi')

    draw = dict(pb=box_pb, new=box_new, avg=box_avg, miles=box_miles)
    for c, x in (('L', M), ('R', M + L['LW'] + 24)):
        yy = y
        for name, w, h in L['cols'][c]: draw[name](x, yy, w, h); yy += h + 24
    y += L['bottom'] + 30

    p.neon((M, y, W - M, y + 280), 'cyan')
    p.char('AV_MZGroot.png', (M + 24, y + 20, M + 300, y + 262)); p.char('AV_RaccoonRocket.png', (W - M - 300, y + 20, W - M - 24, y + 262))
    cx = W // 2
    p.text((cx, y + 30), f'{clan}  /  BIG PIG', 34, 'mag', 'black', 'ma')
    p.text((cx, y + 78), f'{longdate(ev["date"])}  •  RECORDED RESULTS', 22, 'fg', 'bold', 'ma')
    for i, s in enumerate(['Results count for the clan each player raced for in this race.',
                           'Rounded Star rewards use exact Sparks × 10. One-line entries are not counted.',
                           'Final screenshots only']):
        p.text((cx, y + 126 + i * 32), s, 20, 'mut', 'med', 'ma')
    p.text((cx, y + 232), 'AVENGERS STAT CENTER', 26, 'gold', 'black', 'ma')
    fh = y + 280 + 30
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
