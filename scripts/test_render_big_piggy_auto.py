import importlib.util
import pathlib
import tempfile
import unittest
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("render_big_piggy_auto", ROOT / "scripts/render-big-piggy-auto.py")
renderer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(renderer)

def fixture():
    event_id = "piggy|2026-10-11"
    rows = [
        {"player":"AV-A","clan":"AV-2","score":900,"stars":10,"sparks":4,"metadata":{"lobby":"av2-main","share":0.4,"rank":2}},
        {"player":"AV-B","clan":"AV-2","score":700,"stars":20,"sparks":2,"metadata":{"lobby":"av2-main","share":0.3,"rank":3}},
        {"player":"AV-C","clan":"AV-2","score":600,"stars":30,"sparks":3,"metadata":{"lobby":"av2-main","share":0.3,"rank":4}},
        {"player":"AV-D","clan":"AV-2","score":500,"stars":40,"sparks":5,"metadata":{"lobby":"av2-main","share":0.2,"rank":5}},
        {"player":"AV-E","clan":"AV-2","score":400,"stars":50,"sparks":6,"metadata":{"lobby":"av2-main","share":0.1,"rank":6}},
        {"player":"AV-F","clan":"AV-2","score":1,"stars":0,"sparks":0,"metadata":{"lobby":"av2-main","share":0.0,"rank":7}},
    ]
    event = {"id":event_id,"date":"2026-10-11","kind":"piggy","status":"final","unit":"lines",
             "metadata":{"av2DisplayedPotStars":"2.0M","av2RakePercentDisplayedShareSum":71.0},"rows":rows}
    people = [{"name":"AV-B","kinds":{"piggy":{"pbs":[{"eventId":event_id,"score":700,"firstRecorded":False,
              "newPB":True,"previousPB":500,"improvement":0.4}]}}}]
    prior = {"id":"piggy|2026-10-04","date":"2026-10-04","kind":"piggy","status":"final","unit":"lines",
             "metadata":{},"rows":[
              {"player":"AV-A","clan":"AV-2","score":800,"stars":8,"sparks":3,"metadata":{"lobby":"av2-main","rank":1}},
              {"player":"AV-B","clan":"AV-2","score":700,"stars":7,"sparks":2,"metadata":{"lobby":"av2-main","rank":2}},
              {"player":"AV-C","clan":"AV-2","score":600,"stars":6,"sparks":1,"metadata":{"lobby":"av2-main","rank":3}},
              {"player":"AV-D","clan":"AV-2","score":500,"stars":5,"sparks":1,"metadata":{"lobby":"av2-main","rank":4}},
              {"player":"AV-E","clan":"AV-2","score":400,"stars":4,"sparks":1,"metadata":{"lobby":"av2-main","rank":5}}]}
    return {"schemaVersion":1,"source":"approved-event-ledger",
            "projection":{"version":"a"*64,"events":[prior,event],"people":people},
            "piggyPlacementPBsByClan":{"AV-2":{event_id:[{"player":"AV-B","previousRank":7,"newRank":2,
              "improved":True,"previousDate":"2026-10-02"}]}},
            "piggyCareerPodiumsByClan":{"AV-2":{"AV-A":{"wins":3,"secondPlaces":1,"thirdPlaces":0,"podiums":4},
              "AV-B":{"wins":1,"secondPlaces":2,"thirdPlaces":1,"podiums":4}}},
            "piggyBenchmarksByClan":{"AV-2":{"thresholds":[5000,10000],
              "weekly":[{"date":"2026-10-11","counts":[2,1]}],
              "records":[{"threshold":5000,"count":2,"tiedDates":["2026-10-11"]},
                         {"threshold":10000,"count":1,"tiedDates":["2026-10-04"]}]}}}

class BigPiggyV2Tests(unittest.TestCase):
    def test_av2_rake_and_rank_pb_metrics_are_explicit_and_separate(self):
        data=fixture()
        model=renderer.resolve_summary(data,"piggy","AV-2")
        self.assertEqual(model["displayedPotStars"],"2.0M")
        self.assertEqual(model["rakePercentDisplayedShareSum"],71.0)
        self.assertEqual([(x["previousRank"],x["newRank"]) for x in model["placementPBs"]],[(7,2)])
        self.assertEqual(model["participantRows"],5,"one-line placeholders are not participants")
        self.assertEqual(model["rows"][0]["careerPodiums"]["wins"],3)
        self.assertEqual(model["rows"][1]["careerPodiums"]["secondPlaces"],2)
        self.assertEqual([(m["threshold"],m["count"],m["record"]) for m in model["milestones"]],
                         [(5000,2,True),(10000,1,False)])
        self.assertEqual(len(model["averageTrend"]),2)
        self.assertIsNotNone(model["weekToWeekGrowthPercent"])
        with tempfile.TemporaryDirectory() as tmp:
            dest=pathlib.Path(tmp)/"av2-piggy-v2.png"
            result=renderer.render(data,"piggy","AV-2","piggy|2026-10-11",str(dest),automatic_piggy_layout=True)
            self.assertEqual(result["templateVersion"],"piggy-auto-v2-20261021")
            self.assertEqual(result["participants"],5)
            self.assertEqual(result["placementPBs"],1)
            self.assertEqual(result["rakePercentDisplayedShareSum"],71.0)
            self.assertTrue(result["previewOnly"])
            self.assertFalse(result["readyToPost"])
            self.assertFalse(result["discordPostingEnabled"])
            self.assertEqual(Image.open(dest).size,(2400,1500))
            preview_sha=result["imageSHA256"]
        with tempfile.TemporaryDirectory() as tmp:
            dest=pathlib.Path(tmp)/"av2-piggy-final.png"
            result=renderer.render(data,"piggy","AV-2","piggy|2026-10-11",str(dest),
                                   automatic_piggy_layout=True,automatic_piggy_publish=True)
            self.assertFalse(result["previewOnly"])
            self.assertTrue(result["readyToPost"])
            self.assertTrue(result["discordPostingEnabled"])
            self.assertNotEqual(result["imageSHA256"],preview_sha)

if __name__=="__main__":
    unittest.main()
