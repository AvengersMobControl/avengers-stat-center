import importlib.util
import json
import pathlib
import tempfile
import unittest
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("weekly_renderer",ROOT/"render-weekly-event-review.py")
R=importlib.util.module_from_spec(spec);spec.loader.exec_module(R)
def model():
    return {
      "schemaVersion":1,"source":"approved-event-ledger","reviewType":"weekly-three-event-recap",
      "projectionVersion":"a"*64,"weekStart":"2026-10-12","weekEnd":"2026-10-18",
      "clan":"AVENGERS","events":[{"kind":k,"flash":i if k=="flash" else None,"missing":False,
       "date":"2026-10-13","participants":3,"status":"partial","aboveAverage":1,
       "benchmarkEligible":2,"noSparkAward":k=="flash"} for i,k in enumerate(
           ["space","flash","flash","flash","flash","piggy"])],
      "totalKnownSparks":1000000,"eventCount":6,"postKrakenNoSparkFlash":True,
      "top5Sparks":[{"player":"AV-Test"+str(i),"value":100000-i*10000} for i in range(5)],
      "aboveAverageTotal":4,"benchmarkEligibleTotal":15,"newMilestones":2,
      "scorePBs":3,"piggyFinishRankImproved":1,"spaceLobbyRankImproved":2,
      "highlightPBs":[{"player":"AV-Test1","improvement":.32}],
      "milestones":[{"player":"AV-Test2","category":"space","threshold":250}],
      "warnings":["PARTIAL EVENT COVERAGE"],
      "sourceFlashSparkConflict":True,"readyToPost":False,"discordPostingEnabled":False,
      "autoDispatchEnabled":False,"discordDraft":"@everyone this is a draft", "reviewDigest":"b"*64
    }
class WeeklyPngTests(unittest.TestCase):
    def test_model_refuses_unapproved_data_and_unsafe_send_flags(self):
        m=model();self.assertIs(R.known(m),m)
        m["readyToPost"]=True
        with self.assertRaisesRegex(ValueError,"Posting safety"):R.known(m)
        m=model();m["source"]="unreviewed-upload"
        with self.assertRaisesRegex(ValueError,"approved-ledger"):R.known(m)
    def test_original_character_hashes_are_mandatory_no_substitutions(self):
        with tempfile.TemporaryDirectory() as t:
            with self.assertRaises(FileNotFoundError):R.art(t)
            for key,(name,_) in R.ART.items():
                Image.new("RGBA",(8,8),(255,0,0,255)).save(pathlib.Path(t)/name)
            with self.assertRaisesRegex(ValueError,"Unapproved/substituted"):R.art(t)
    def test_render_layout_is_deterministic_and_preserves_companion_sidecar_hold(self):
        sample=model()
        pictures={name:Image.new("RGBA",(100,100),(255,255,255,55)) for name in R.ART}
        a=R.compose(sample,pictures);b=R.compose(sample,pictures)
        self.assertEqual(a.size,(2400,1690))
        self.assertEqual(a.tobytes(),b.tobytes())
        with tempfile.TemporaryDirectory() as td:
            p=pathlib.Path(td)
            # Do not call the external-art-only render() with fabricated assets.
            a.save(p/"preview.png")
            self.assertGreater((p/"preview.png").stat().st_size,10000)
if __name__=="__main__":unittest.main()
