"""Keep frozen PNG renderer unchanged; preview Piggy PB finish data separately."""
import importlib.util
import pathlib
import tempfile
import unittest
ROOT = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("piggy_place_preview", ROOT / "render-piggy-finish-pb-preview.py")
preview_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview_mod)
spec_base = importlib.util.spec_from_file_location("pinned_renderer_tests", ROOT / "test_render_event_summary.py")
baseline = importlib.util.module_from_spec(spec_base)
spec_base.loader.exec_module(baseline)

class ReviewOnlyPiggyPlacementPNG(unittest.TestCase):
    def test_preview_shows_review_only_qualified_rank_pb_without_touching_pinned_art(self):
        from PIL import Image
        data = baseline.fixture()
        data["piggyPlacementPBs"] = {"piggy|2026-10-11": [
            {"player": "AV-A", "eventId": "piggy|2026-10-11",
             "previousRank": 5, "newRank": 1, "improved": True},
            {"player": "AV-B", "eventId": "piggy|2026-10-11",
             "previousRank": None, "newRank": 1},
        ]}
        renderer = preview_mod.load_approved_renderer()
        with tempfile.TemporaryDirectory() as td:
            stable = pathlib.Path(td) / "pinned.png"
            newer = pathlib.Path(td) / "preview.png"
            official = renderer.render(data, "piggy", "AVENGERS", None, str(stable))
            art = preview_mod.preview(data, str(newer))
            self.assertNotEqual(art["imageSHA256"], official["imageSHA256"])
            self.assertEqual(art["piggyPlacementPBCount"], 1, "exclude AV-2 player")
            self.assertEqual(art["piggyPlacementPBs"][0]["newRank"], 1)
            self.assertEqual(Image.open(newer).size, (2400, 1500))
            self.assertFalse(art["readyToPost"])
            self.assertFalse(art["discordPostingEnabled"])
            self.assertTrue(art["unapprovedPlacementDesignPreview"])

    def test_previous_av2_record_does_not_block_first_avengers_new_member(self):
        data = baseline.fixture()
        data["projection"]["events"][0]["rows"][0]["clan"] = "AV-2"
        person = next(p for p in data["projection"]["people"] if p["name"] == "AV-A")
        transition = person["kinds"]["piggy"]["pbs"][1]
        transition["firstRecorded"] = False
        transition["firstClanRecorded"] = True
        with tempfile.TemporaryDirectory() as td:
            result = preview_mod.preview(data, str(pathlib.Path(td) / "preview.png"))
            self.assertIn("AV-A", result["firstAVENGERSParticipants"])
            self.assertEqual(result["firstAVENGERSParticipantCount"], 2)
            self.assertFalse(result["readyToPost"])
            self.assertFalse(result["discordPostingEnabled"])

    def test_missing_rank_pb_data_is_safe_and_no_send(self):
        from PIL import Image
        data = baseline.fixture()
        with tempfile.TemporaryDirectory() as td:
            result = preview_mod.preview(data, str(pathlib.Path(td) / "blank.png"))
            self.assertEqual(result["piggyPlacementPBCount"], 0)
            self.assertFalse(result["readyToPost"])
            self.assertFalse(result["discordPostingEnabled"])

if __name__ == "__main__":
    unittest.main()
