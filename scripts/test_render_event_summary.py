"""Regression coverage for approved-source-only event PNG model and rendering."""
import importlib.util
import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("event_renderer", ROOT / "render-event-summary.py")
renderer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(renderer)
VERSION = "a" * 64


def event(kind, eid, date, rows, status="final", unit=None):
    units = {"piggy": "lines", "flash": "lines", "kraken": "million-damage"}
    return {"id": eid, "kind": kind, "date": date, "unit": unit or units[kind],
            "status": status, "metadata": {"flash": 2} if kind == "flash" else {},
            "rows": rows}


def row(player, clan, score, sparks, stars, share=None):
    return {"player": player, "clan": clan, "score": score, "sparks": sparks, "stars": stars,
            "metadata": {"share": share} if share is not None else {}}


def fixture():
    events = [
        event("piggy", "piggy|2026-10-02", "2026-10-02",
              [row("AV-A", "AVENGERS", 4000, 100, 1000),
               row("AV-B", "AV-2", 2000, 50, 500)]),
        event("piggy", "piggy|2026-10-11", "2026-10-11",
              [row("AV-A", "AVENGERS", 7000, 350, 3500, .25),
               row("AV-B", "AV-2", 2500, 200, 2000),
               row("AV-C", "AVENGERS", 5000, None, None)]),
        event("flash", "flash|2026-10-13|2", "2026-10-13",
              [row("AV-A", "AVENGERS", 11000, 100, 1000),
               row("AV-C", "AV-2", 13000, 200, 2000)]),
        event("kraken", "kraken|oct", "2026-10-11",
              [row("AV-A", "AVENGERS", 1250, 9000, None),
               row("AV-B", "AV-2", 780, None, None)]),
    ]
    people = [
        {"name": "AV-A", "kinds": {
            "piggy": {"pbs": [
                {"eventId": "piggy|2026-10-02", "score": 4000, "firstRecorded": True, "newPB": False},
                {"eventId": "piggy|2026-10-11", "score": 7000,
                 "firstRecorded": False, "newPB": True, "previousPB": 4000, "improvement": .75}]},
            "flash": {"pbs": [
                {"eventId": "flash|2026-10-13|2", "score": 11000, "firstRecorded": True, "newPB": False}]},
            "kraken": {"pbs": [{"eventId": "kraken|oct", "score": 1250,
                                   "firstRecorded": True, "newPB": False}]} }},
        {"name": "AV-B", "kinds": {
            "piggy": {"pbs": [
                {"eventId": "piggy|2026-10-11", "score": 2500,
                 "firstRecorded": False, "newPB": True, "previousPB": 2000, "improvement": .25}]},
            "kraken": {"pbs": [{"eventId": "kraken|oct", "score": 780,
                                    "firstRecorded": True, "newPB": False}]} }},
        {"name": "AV-C", "kinds": {
            "piggy": {"pbs": [{"eventId": "piggy|2026-10-11", "score": 5000,
                                    "firstRecorded": True, "newPB": False}]},
            "flash": {"pbs": [{"eventId": "flash|2026-10-13|2", "score": 13000,
                                    "firstRecorded": True, "newPB": False}]}}}
    ]
    return {"schemaVersion": 1, "source": "approved-event-ledger",
            "projection": {"version": VERSION, "events": events, "people": people}}


class ApprovedSourceModelTests(unittest.TestCase):
    def test_piggy_uses_event_clan_and_actual_previous_pb(self):
        m = renderer.resolve_summary(fixture(), "piggy", "AVENGERS")
        self.assertEqual(m["eventId"], "piggy|2026-10-11")
        self.assertEqual(m["participantRows"], 2)
        self.assertEqual(m["knownScoreSum"], 12000)
        self.assertEqual(m["knownSparks"], 350)
        self.assertEqual(m["unknownSparkRows"], 1)
        self.assertEqual(m["unknownStarRows"], 1)
        self.assertEqual(len(m["pbs"]), 1)
        self.assertEqual(m["pbs"][0]["transition"]["previousPB"], 4000)
        self.assertAlmostEqual(m["pbs"][0]["transition"]["improvement"], .75)
        self.assertEqual([r["player"] for r in m["firstTracked"]], ["AV-C"])
        self.assertEqual(m["previousEvent"], "piggy|2026-10-02")
        self.assertFalse(m["readyToPost"])

    def test_flash_pb_is_independent_of_piggy_and_respects_event_time_clan(self):
        m = renderer.resolve_summary(fixture(), "flash", "AV-2")
        self.assertEqual(m["eventId"], "flash|2026-10-13|2")
        self.assertEqual(m["flashNumber"], "2")
        self.assertEqual(len(m["pbs"]), 0)
        self.assertEqual([r["player"] for r in m["firstTracked"]], ["AV-C"])
        self.assertEqual(m["knownScoreSum"], 13000)
        self.assertEqual(m["knownStars"], 2000)

    def test_flash_title_parses_reviewed_number_not_internal_event_identifier(self):
        release=fixture()
        e=release["projection"]["events"][2]
        e["id"]="flash|PF4-2026-10-14"
        e["date"]="2026-10-14"
        e["metadata"]={}
        for person in release["projection"]["people"]:
            for transition in person.get("kinds",{}).get("flash",{}).get("pbs",[]):
                transition["eventId"]=e["id"]
        m=renderer.resolve_summary(release,"flash","AVENGERS")
        self.assertEqual(m["flashNumber"],"4")
        self.assertEqual(m["eventId"],"flash|PF4-2026-10-14")

    def test_kraken_never_creates_stars_or_sparks_per_damage(self):
        m = renderer.resolve_summary(fixture(), "kraken", "AV-2")
        self.assertEqual(m["unknownSparkRows"], 1)
        self.assertIsNone(m["knownStars"])
        self.assertIsNone(m["unknownStarRows"])
        self.assertEqual(m["knownScoreSum"], 780)
        self.assertEqual(m["knownSparks"], 0)
        self.assertEqual(len(m["firstTracked"]), 1)

    def test_approved_source_required_and_invalid_identity_rejected(self):
        bad = fixture()
        bad["source"] = "unapproved-screenshot"
        with self.assertRaisesRegex(ValueError, "approved-ledger"):
            renderer.resolve_summary(bad, "piggy", "AVENGERS")
        with self.assertRaisesRegex(ValueError, "clan"):
            renderer.resolve_summary(fixture(), "piggy", "OTHER")
        with self.assertRaisesRegex(ValueError, "not an accepted"):
            renderer.resolve_summary(fixture(), "piggy", "AVENGERS", "piggy|2026-10-18")
        only_avengers = fixture()
        only_avengers["projection"]["events"][2]["rows"] = [row("AV-A","AVENGERS",11000,100,1000)]
        with self.assertRaisesRegex(ValueError, "no AV-2 results"):
            renderer.resolve_summary(only_avengers, "flash", "AV-2", "flash|2026-10-13|2")

    def test_partial_event_and_missing_rows_are_explicit_not_zero_wins(self):
        data = fixture()
        e = data["projection"]["events"][1]
        e["status"] = "partial"
        e["rows"].append(row(None, "AVENGERS", None, 80, 800))
        m = renderer.resolve_summary(data, "piggy", "AVENGERS")
        self.assertFalse(m["coverageComplete"])
        self.assertEqual(m["unknownScoreRows"], 1)
        self.assertEqual(m["participantRows"], 3)
        self.assertEqual(m["knownSparks"], 430)
        self.assertEqual(m["knownScoreSum"], 12000)
        self.assertEqual([r["player"] for r in m["pbs"]], ["AV-A"])

    def test_render_png_is_deterministic_with_source_only_metadata(self):
        try:
            from PIL import Image
        except ImportError:
            self.skipTest("Pillow test runs in CI once dependency installed")
        data = fixture()
        with tempfile.TemporaryDirectory() as tmp:
            dest = pathlib.Path(tmp) / "piggy.png"
            one = renderer.render(data,"piggy","AVENGERS",None,str(dest))
            png_bytes = dest.read_bytes()
            from hashlib import sha256
            self.assertEqual(one["imageSHA256"],sha256(png_bytes).hexdigest())
            self.assertEqual(Image.open(dest).size,(2400,1500))
            self.assertFalse(one["readyToPost"])
            self.assertFalse(one["discordPostingEnabled"])
            self.assertTrue(one["approvedSourceOnly"])
            meta = json.loads(dest.with_suffix(".json").read_text())
            self.assertEqual(meta["eventId"],"piggy|2026-10-11")
            two = renderer.render(data,"piggy","AVENGERS",None,str(dest))
            self.assertEqual(two["imageSHA256"],one["imageSHA256"])
            for kind, clan in (("flash","AV-2"),("kraken","AVENGERS")):
                out=pathlib.Path(tmp)/(kind+".png")
                result=renderer.render(data,kind,clan,None,str(out))
                self.assertEqual(result["kind"],kind)
                self.assertEqual(Image.open(out).size,(2400,1500))


if __name__ == "__main__":
    unittest.main()
