#!/usr/bin/env python3
"""
Build a fully dynamic FACTS json for render-weekly-recap-poster.py from the
real, approved AVENGERS projection -- nothing in the output is hardcoded to
any particular week.

Usage:
  node scripts/export-event-summary.cjs approved-summary-release.json
  python3 scripts/build-weekly-recap-facts.py reports/approved-summary-release.json \
      out-facts.json --week 2026-11-02 --clan AVENGERS

Sources (all already-approved/accepted data, never edited by this script):
  - <release.json>                          (raw accepted event ledger + per-player PB history + piggy rank-PBs)
  - scripts/export-weekly-review.cjs        (house-approved weekly aggregate: this script
                                              shells out to it for the given week/clan)

Methodology notes / assumptions made explicit here (flag to leader if wrong):
  - "Above own average" / PB detection for space & piggy reuses the exact house
    rule from scripts/export-weekly-review.cjs (same event-time clan, strictly
    prior results, no history = not counted).
  - Flash "combined day" PBs (sum of lines across whichever PFs a player
    attended in one Flash Set, vs. their best prior Flash Set total) reuse
    piggy-flash-history.js's own analyze() -- the same function the Flash PNG
    and the site's Flash history view use -- via scripts/weekly-recap-flash-combined.cjs,
    which re-sources the event list from <release.json> instead of the site's
    static piggy-flash*-data.js files (those are stale, last ~2026-10-13/14).
  - "Place PB" (Big Pig rank improvement) comes straight from
    release.piggyPlacementPBs for the target piggy event; the single biggest
    rank jump is surfaced.
  - Only standard piggy line thresholds [10000,20000,30000,40000,50000] are
    shown, counted from this week's badge crossings.
  - Expects exactly 6 events this week (1 Space, 4 Flash PFs, 1 Big Pig), same
    as docs/WEEKLY_RECAP_PREVIEW.md's "exactly Space, Piggy Flash 1-4, Piggy".
    If that shape ever changes, this script will raise rather than guess.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime, timedelta

ROOT = Path(__file__).resolve().parents[1]
PIGGY_TIERS = [10000, 20000, 30000, 40000, 50000]


def load(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def short(date_s):
    return datetime.strptime(date_s, "%Y-%m-%d").strftime("%b %-d").upper()


def strip_av(name):
    return name[3:] if name.startswith("AV-") else name


def run_weekly_export(week, clan):
    tmp_name = f"weekly-recap-tmp-{week}-{clan.lower().replace('-', '')}.json"
    subprocess.run(
        ["node", "scripts/export-weekly-review.cjs", tmp_name, week, clan],
        cwd=ROOT, check=True, capture_output=True, text=True,
    )
    return load(ROOT / "reports" / tmp_name)


def flash_combined_day_pbs(release_path, set_id):
    proc = subprocess.run(
        ["node", "scripts/weekly-recap-flash-combined.cjs", set_id, str(release_path)],
        cwd=ROOT, capture_output=True, text=True, check=True,
    )
    return json.loads(proc.stdout)["combinedDayPBs"]


def build(release_path, week, clan):
    release = load(release_path)
    weekly = run_weekly_export(week, clan)
    week_end = (datetime.strptime(week, "%Y-%m-%d") + timedelta(days=6)).strftime("%Y-%m-%d")
    assert weekly["weekEnd"] == week_end

    events_by_id = {e["id"]: e for e in release["projection"]["events"]}
    people_by_name = {p["name"]: p for p in release["projection"]["people"]}
    piggy_rank_pbs = release.get("piggyPlacementPBs", {})

    space_cards = [c for c in weekly["events"] if c["kind"] == "space" and not c["missing"]]
    piggy_cards = [c for c in weekly["events"] if c["kind"] == "piggy" and not c["missing"]]
    flash_cards = sorted((c for c in weekly["events"] if c["kind"] == "flash" and not c["missing"]), key=lambda c: c["flash"])
    if len(space_cards) != 1 or len(piggy_cards) != 1 or len(flash_cards) != 4:
        raise SystemExit(
            f"Expected exactly 1 Space + 4 Flash PFs + 1 Big Pig this week; "
            f"got {len(space_cards)} space, {len(flash_cards)} flash, {len(piggy_cards)} piggy. "
            "Review before building a recap for a short/irregular week."
        )
    space_card, piggy_card = space_cards[0], piggy_cards[0]

    space_event = events_by_id[space_card["eventId"]]
    piggy_event = events_by_id[piggy_card["eventId"]]
    flash_events = [events_by_id[c["eventId"]] for c in flash_cards]

    def avengers_rows(ev):
        return [r for r in ev["rows"] if r.get("clan") == clan and r.get("player")
                and isinstance(r.get("score"), (int, float)) and r["score"] > 0]

    space_rows = avengers_rows(space_event)
    piggy_rows = avengers_rows(piggy_event)
    flash_rows_by_pf = [avengers_rows(ev) for ev in flash_events]

    weekly_block = {
        "sparks": weekly["totalKnownSparks"],
        "topContributors": [{"name": c["player"], "sparks": c["value"]} for c in weekly["top5Sparks"]],
        "rosterCount": weekly["uniqueParticipants"],
        "resultCount": sum(c["trackedRows"] for c in weekly["events"] if not c["missing"]),
        "coveragePartial": any(c["status"] == "partial" for c in weekly["events"] if not c["missing"]),
    }

    def pbs_for_event(kind, event_id, rows):
        out = []
        for r in rows:
            person = people_by_name.get(r["player"])
            if not person:
                continue
            timeline = (person.get("kinds", {}).get(kind) or {}).get("pbs", [])
            holder = None
            for entry in timeline:
                if entry["eventId"] == event_id:
                    if entry.get("newPB") and not entry.get("firstRecorded") and holder is not None:
                        out.append({
                            "name": r["player"],
                            "prev": entry["previousPB"],
                            "score": entry["score"],
                            "prevDate": holder["date"],
                            "pct": (entry.get("improvement") or 0) * 100,
                        })
                    break
                if entry.get("newPB") or entry.get("firstRecorded"):
                    holder = entry
        out.sort(key=lambda p: -p["pct"])
        return out

    lobby_vals = {r["metadata"].get("lobby") for r in space_rows if r.get("metadata", {}).get("lobby")}
    top_distance = sorted(space_rows, key=lambda r: -r["score"])[:4]
    top_sparks_space = sorted(space_rows, key=lambda r: -(r.get("sparks") or 0))[:4]
    space_block = {
        "date": space_event["date"],
        "dateLabel": short(space_event["date"]),
        "racerCount": space_card["participants"],
        "lobbyCount": len(lobby_vals),
        "verifiedSparks": space_card["knownSparks"],
        "aboveOwnAvgCount": space_card["aboveAverage"],
        "aboveOwnAvgDenom": space_card["benchmarkEligible"],
        "distancePBCount": space_card["newScorePBs"],
        "topDistance": [{"name": r["player"], "dist": r["score"]} for r in top_distance],
        "topSparks": [{"name": r["player"], "sparks": r.get("sparks") or 0} for r in top_sparks_space],
        "personalBests": pbs_for_event("space", space_event["id"], space_rows),
    }

    flash_dates = sorted({ev["date"] for ev in flash_events})
    if len(flash_dates) == 1:
        flash_date_label = short(flash_dates[0])
    else:
        flash_date_label = short(flash_dates[0]).split()[0] + " " + short(flash_dates[0]).split()[1] + "–" + short(flash_dates[-1]).split()[1]
    unique_flash_players = {r["player"] for rows in flash_rows_by_pf for r in rows}
    wins = []
    for pf_idx, c in enumerate(flash_cards, start=1):
        top = c["topScore"][0] if c["topScore"] else None
        if top:
            wins.append({"pf": pf_idx, "winner": top["player"], "lines": top["score"]})
    flash_set_id = (flash_events[0].get("metadata") or {}).get("setId") or (flash_events[0]["date"] + "-A")
    fpbs = flash_combined_day_pbs(release_path, flash_set_id)
    flashes_block = {
        "dateLabel": flash_date_label,
        "resultCount": sum(c["trackedRows"] for c in flash_cards),
        "uniqueRacerCount": len(unique_flash_players),
        "sparksEarned": sum(c["knownSparks"] for c in flash_cards),
        "aboveDayAvgCount": sum(c["aboveAverage"] for c in flash_cards),
        "aboveDayAvgDenom": sum(c["benchmarkEligible"] for c in flash_cards),
        "wins": wins,
        "flashPBs": fpbs,
    }

    top_finishers = sorted(piggy_rows, key=lambda r: -r["score"])[:5]
    badges_this_event = [b for b in weekly["milestones"] if b["eventId"] == piggy_event["id"]]
    threshold_counts = {str(t): sum(1 for b in badges_this_event if b["threshold"] == t) for t in PIGGY_TIERS}
    rank_pbs = [p for p in piggy_rank_pbs.get(piggy_event["id"], []) if p.get("improved")]
    place_pb = None
    if rank_pbs:
        best = min(rank_pbs, key=lambda p: p["newRank"] - p["previousRank"])
        place_pb = {"name": best["player"], "from": best["previousRank"], "to": best["newRank"]}
    first_tracked = []
    for r in piggy_rows:
        person = people_by_name.get(r["player"])
        if not person:
            continue
        timeline = (person.get("kinds", {}).get("piggy") or {}).get("pbs", [])
        entry = next((e for e in timeline if e["eventId"] == piggy_event["id"]), None)
        if entry and entry.get("firstRecorded"):
            first_tracked.append(r["player"])

    piggy_block = {
        "date": piggy_event["date"],
        "dateLabel": short(piggy_event["date"]),
        "participantCount": piggy_card["participants"],
        "complete": bool(piggy_event.get("metadata", {}).get("complete")),
        "verifiedSparks": piggy_card["knownSparks"],
        "teamLines": piggy_card["knownScore"],
        "aboveOwnAvgCount": piggy_card["aboveAverage"],
        "aboveOwnAvgDenom": piggy_card["benchmarkEligible"],
        "topFinishers": [{"name": r["player"], "lines": r["score"]} for r in top_finishers],
        "thresholdReached": threshold_counts,
        "linePB": pbs_for_event("piggy", piggy_event["id"], piggy_rows),
        "placePB": place_pb,
        "rankPBCount": len(rank_pbs),
        "firstTracked": first_tracked,
    }

    highlights = []
    if space_block["personalBests"]:
        b = space_block["personalBests"][0]
        highlights.append(f"{strip_av(b['name']).upper()}  •  {b['score']:,.1f}B SPACE PB")
    if piggy_block["linePB"]:
        b = piggy_block["linePB"][0]
        highlights.append(f"{strip_av(b['name']).upper()}  •  {int(b['score']):,} PIGGY LINES")
    if flashes_block["flashPBs"]:
        b = flashes_block["flashPBs"][0]
        highlights.append(f"{strip_av(b['name']).upper()}  •  {int(b['current']):,} FLASH SET LINES")
    if place_pb:
        highlights.append(f"{strip_av(place_pb['name']).upper()}  •  {place_pb['from']}→{place_pb['to']}")
    if weekly_block["topContributors"]:
        top_earner = weekly_block["topContributors"][0]
        highlights.append(f"{strip_av(top_earner['name']).upper()}  •  {int(top_earner['sparks']):,} SPARKS THIS WEEK")

    other = [
        f"{space_block['distancePBCount']}  NEW SPACE DISTANCE PBS",
        f"{len(flashes_block['flashPBs'])}  NEW FLASH-SET DAY PBS",
        f"{len(piggy_block['linePB'])}  NEW PIGGY LINE PBS",
        f"{piggy_block['rankPBCount']}  IMPROVED PIGGY RANK PBS",
    ]

    partial_events = sum(1 for c in weekly["events"] if not c["missing"] and c["status"] == "partial")
    coverage_lines = [
        f"{weekly['eventCount']} of {weekly['expectedEventCount']} expected events captured • {partial_events} with partial source coverage • AV-2 excluded",
        ("No unknown Spark payouts this week" if not weekly["hasUnknownSparkPayouts"]
         else "Some Spark payouts this week are unverified and excluded from totals"),
    ]

    return {
        "clan": clan,
        "weekStart": week,
        "weekEnd": week_end,
        "weekLabel": f"{short(week)}–{short(week_end).split()[1]}, {week[:4]}",
        "eventsLine": "SPACE / FOUR FLASHES / BIG PIG",
        "weekly": weekly_block,
        "space": space_block,
        "flashes": flashes_block,
        "piggy": piggy_block,
        "milestones": {"highlights": highlights[:4], "other": other},
        "coverageLines": coverage_lines,
        "warnings": weekly["warnings"],
        "reviewDigest": weekly["reviewDigest"],
        "projectionVersion": weekly["projectionVersion"],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("release", help="path to the approved-summary-release.json export")
    ap.add_argument("out", help="path to write the FACTS json")
    ap.add_argument("--week", required=True, help="ISO Monday of the week, e.g. 2026-11-02")
    ap.add_argument("--clan", default="AVENGERS", choices=["AVENGERS", "AV-2"])
    a = ap.parse_args()

    facts = build(Path(a.release), a.week, a.clan)
    Path(a.out).write_text(json.dumps(facts, indent=2), encoding="utf-8")
    print(f"Wrote {a.out}")


if __name__ == "__main__":
    main()
