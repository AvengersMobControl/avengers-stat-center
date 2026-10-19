#!/usr/bin/env python3
"""Opt-in, unapproved Piggy best-finishing-place PNG preview.

Example:
  python3 scripts/render-piggy-finish-pb-preview.py reports/approved-summary-release.json reports/piggy-rank-preview.png

Never alters the frozen temporarily approved renderer, approved event results,
template registry or Discord. All output is review-only and cannot be sent.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

from PIL import Image, ImageDraw


def load_approved_renderer():
    path = Path(__file__).with_name("render-event-summary.py")
    spec = importlib.util.spec_from_file_location("avengers_pinned_renderer", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def preview(release, output, event_id=None):
    renderer = load_approved_renderer()
    model = renderer.resolve_summary(release, "piggy", "AVENGERS", event_id)
    # The pinned default renderer is deliberately immutable. Only the
    # unapproved Piggy preview reclassifies a first result for AVENGERS as
    # NEW, even if that same canonical player has earlier AV-2 results.
    # All-clan historical line PBs and per-event rewards remain unchanged.
    first_clan = [row for row in model["rows"]
                  if row.get("transition", {}).get(
                      "firstClanRecorded", row.get("transition", {}).get("firstRecorded"))]
    model["firstTracked"] = first_clan
    newcomer_ids = {r["player"] for r in first_clan}
    model["pbs"] = [row for row in model["pbs"]
                    if row["player"] not in newcomer_ids]
    dest = Path(output)
    if dest.suffix.lower() != ".png" or not dest.parent.exists():
        raise ValueError("Output must be PNG under an existing review folder")
    event_players = {r["player"] for r in model["rows"] if not r["unassigned"]}
    rank_pbs = (release.get("piggyPlacementPBs") or {}).get(model["eventId"], [])
    if not isinstance(rank_pbs, list):
        raise ValueError("Invalid best-finish PB source rows")
    # Only verified AVENGERS results from this actual event are eligible.
    rank_pbs = [dict(p) for p in rank_pbs
                if p.get("player") in event_players and p.get("eventId") == model["eventId"]
                and isinstance(p.get("newRank"), int) and p["newRank"] > 0
                and (p.get("previousRank") is None or (
                    isinstance(p["previousRank"], int) and p["previousRank"] > p["newRank"]))]
    rank_pbs.sort(key=lambda p: (p["newRank"], p["player"]))
    renderer.draw_png(model, dest)
    img = Image.open(dest).convert("RGB")
    dr = ImageDraw.Draw(img)
    x1, y1, x2, y2 = 45, 1091, 1138, 1376
    palette = renderer.PALETTE
    dr.rounded_rectangle((x1, y1, x2, y2), radius=20, fill=palette["panel"],
                         outline=palette["purple"], width=2)
    def writing(x, y, value, size=26, color="fg", bold=False, anchor=None):
        dr.text((x, y), str(value), font=renderer._fonts(size, bold),
                fill=palette.get(color, color), anchor=anchor)
    writing(75, 1114, "BEST FINISH PBs · 30+ AVENGERS", 32, "fg", True)
    writing(75, 1162, "Actual race placement; independent of lines · PREVIEW", 22, "muted")
    for i, pb in enumerate(rank_pbs[:3]):
        y = 1210 + i * 45
        name = renderer.display_name(pb["player"])
        while dr.textlength(name, font=renderer._fonts(25, True)) > 420 and name:
            name = name[:-1]
        writing(75, y, name, 25, "fg", True)
        previous = pb.get('previousRank')
        previous_text = ('—' if previous is None else str(previous) +
                         ('th' if 11 <= previous % 100 <= 13 else
                          {1:'st',2:'nd',3:'rd'}.get(previous % 10,'th')))
        writing(800, y, previous_text, 25, "muted", anchor="ra")
        writing(860, y, "→", 26, "cyan")
        # Ordinal places: 1st / 2nd / 3rd etc, not highest number of lines.
        place = pb["newRank"]
        suffix = "th" if 11 <= place % 100 <= 13 else {1: "st", 2: "nd", 3: "rd"}.get(place % 10, "th")
        writing(1080, y, f"{place}{suffix}", 27, "green", True, "ra")
    if not rank_pbs:
        writing(75, 1250, "No new qualifying finish PBs in this race", 23, "muted")
    writing(75, 1341, "UNAPPROVED ART · NO DISCORD POSTING", 20, "red")
    img.save(dest, format="PNG", optimize=False)
    sidecar = {
        "eventId": model["eventId"], "kind": "piggy", "clan": "AVENGERS",
        "projectionVersion": model["projectionVersion"],
        "imageSHA256": hashlib.sha256(dest.read_bytes()).hexdigest(),
        "piggyPlacementPBs": rank_pbs, "piggyPlacementPBCount": len(rank_pbs),
        "firstAVENGERSParticipants": [r["player"] for r in first_clan],
        "firstAVENGERSParticipantCount": len(first_clan),
        "templateVersion": "piggy-finish-pb-proposal-unapproved-v1",
        "unapprovedPlacementDesignPreview": True,
        "readyToPost": False, "discordPostingEnabled": False,
        "approvedSourceOnly": True,
    }
    dest.with_suffix(".json").write_text(json.dumps(sidecar, indent=2, sort_keys=True) + "\n")
    return sidecar


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("release")
    ap.add_argument("output")
    ap.add_argument("--event-id", default=None)
    args = ap.parse_args()
    data = json.loads(Path(args.release).read_text(encoding="utf-8"))
    print(json.dumps(preview(data, args.output, args.event_id), sort_keys=True))
