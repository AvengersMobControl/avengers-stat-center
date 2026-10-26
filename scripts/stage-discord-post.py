#!/usr/bin/env python3
"""Stage one event poster + write-up for the standing publisher (api/discord/publish-event.js).

Usage:
  python3 scripts/stage-discord-post.py --kind piggy --event-id 'piggy|2026-10-23' --clan AVENGERS \
      --png reports/bigpig-2026-10-23-AVENGERS.png --body-file /path/body.txt --template bigpig-poster-v3-...

Flash Sets use --kind flash --event-id 'flashset|2026-10-20-A'.
Copies the PNG to assets/reports/<CLAN>_<Event>_<Month>_<D>_<YYYY>.png (commit it with git add -f)
and writes data/discord-posts.json. Refuses to change an existing entry. Never posts anything.
"""
import argparse, datetime as dt, hashlib, json, re, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'data' / 'discord-posts.json'
NAMES = {'space': 'Space_Race', 'piggy': 'Big_Pig', 'flash': 'Piggy_Flashes'}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--kind', choices=sorted(NAMES), required=True)
    ap.add_argument('--event-id', required=True)
    ap.add_argument('--clan', choices=['AVENGERS', 'AV-2'], required=True)
    ap.add_argument('--png', required=True)
    ap.add_argument('--body-file', required=True)
    ap.add_argument('--template', required=True)
    ap.add_argument('--date', help='Event (or first set) date YYYY-MM-DD for the file name; default from event id')
    a = ap.parse_args()

    if a.kind == 'flash' and not a.event_id.startswith('flashset|'): raise SystemExit('Flash event ids look like flashset|<setId>')
    if a.kind != 'flash' and not a.event_id.startswith(a.kind + '|'): raise SystemExit('Event id must start with kind|')
    body = Path(a.body_file).read_text(encoding='utf-8').strip()
    if not body or len(body) > 2000: raise SystemExit(f'Body must be 1-2000 characters (got {len(body)})')
    if not body.startswith('@everyone'): raise SystemExit('Leader rule: event write-ups start with @everyone')
    src = Path(a.png).read_bytes()
    if src[:8] != b'\x89PNG\r\n\x1a\n': raise SystemExit('Not a PNG')
    date = a.date or re.search(r'\d{4}-\d{2}-\d{2}', a.event_id).group(0)
    d = dt.date.fromisoformat(date)
    clan = a.clan.replace('-', '')
    name = f'{clan}_{NAMES[a.kind]}_{d.strftime("%B")}_{d.day}_{d.year}.png'
    key = f'{a.kind}|{a.event_id}|{a.clan}'
    entry = dict(kind=a.kind, eventId=a.event_id, clan=a.clan, file=name, sha256=hashlib.sha256(src).hexdigest(),
                 size=len(src), template=a.template, body=body, approved=True,
                 authorization='leader-standing-auto-discord-2026-10-26',
                 description=f'{a.clan} {NAMES[a.kind].replace("_", " ")} {d.strftime("%B")} {d.day} {d.year} results')

    data = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {'schemaVersion': 1, 'posts': {}}
    old = data['posts'].get(key)
    if old and old != entry: raise SystemExit(f'{key} is already staged with different content; never re-stage a post')
    data['posts'][key] = entry
    dest = ROOT / 'assets' / 'reports' / name
    if dest.exists() and hashlib.sha256(dest.read_bytes()).hexdigest() != entry['sha256']:
        raise SystemExit(f'{dest} exists with different bytes')
    dest.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(a.png, dest)
    MANIFEST.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps(dict(key=key, file=str(dest.relative_to(ROOT)), sha256=entry['sha256'], size=entry['size'], bodyChars=len(body))))


if __name__ == '__main__':
    main()
