import importlib.util
import pathlib
import tempfile
import unittest
from PIL import Image

ROOT=pathlib.Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location("vertical_reports",ROOT/"scripts/render-vertical-space-piggy.py")
vertical=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(vertical)

PIGGY_SPEC=importlib.util.spec_from_file_location("piggy_fixture",ROOT/"scripts/test_render_big_piggy_auto.py")
fixture_mod=importlib.util.module_from_spec(PIGGY_SPEC)
PIGGY_SPEC.loader.exec_module(fixture_mod)


def space_fixture(count=6,partial=False):
    date="2026-10-16"
    rows=[]
    people=[]
    for ix in range(count):
        name=f"AV-SpaceMember-{ix:02d}"
        score=600-ix*10
        rows.append({"player":name,"clan":"AVENGERS","score":score,
                     "stars":1200000+ix,"sparks":120000+ix,
                     "metadata":{"group":f"lobby-{ix//5}","share":0.07,"rank":ix+2}})
        if ix%2:
            tr={"eventId":"space|2026-10-16","score":score,"newPB":True,
                "previousPB":score-40,"previousDate":"2026-10-09","improvement":40/(score-40)}
        else:
            tr={"eventId":"space|2026-10-16","score":score,"firstRecorded":True}
        people.append({"name":name,"kinds":{"space":{"pbs":[tr]}}})
    prev={"id":"space|2026-10-09","date":"2026-10-09","kind":"space","status":"final",
          "unit":"billion-lightyears","metadata":{},"rows":[
              {"player":"AV-Earlier","clan":"AVENGERS","score":500,"stars":800,"sparks":80,"metadata":{"group":"p"}}]}
    event={"id":"space|2026-10-16","date":date,"kind":"space",
           "status":"partial" if partial else "final","unit":"billion-lightyears",
           "metadata":{"complete":not partial,"coverageComplete":not partial,
                       "verifiedAllLobbyClans":{"AVENGERS":not partial}},
           "rows":rows}
    return {"schemaVersion":1,"source":"approved-event-ledger",
            "projection":{"version":"f"*64,"events":[prev,event],"people":people}}


class VerticalSpacePiggyTests(unittest.TestCase):
    def test_space_full_data_and_dynamic_height(self):
        compact=vertical.make_model(space_fixture(6),"space","AVENGERS","space|2026-10-16")
        expanded=vertical.make_model(space_fixture(22),"space","AVENGERS","space|2026-10-16")
        self.assertEqual(len(compact["pbs"]),3)
        self.assertEqual(len(compact["first"]),3)
        self.assertTrue(compact["coverageComplete"])
        self.assertEqual(len(expanded["pbs"]),11)
        self.assertEqual(len(expanded["first"]),11)
        self.assertEqual((compact["individualSpotlights"]["start"],compact["individualSpotlights"]["end"]),
                         ("2026-10-12","2026-11-15"))
        self.assertEqual(compact["individualSpotlights"]["items"][0]["label"],"EVENT SCORE LEADER")
        self.assertTrue(any(item["label"]=="TRACKED LEAGUE SPACE DISTANCE" for item in compact["individualSpotlights"]["items"]))
        with tempfile.TemporaryDirectory() as tmp:
            a=pathlib.Path(tmp)/"space-small.png"
            b=pathlib.Path(tmp)/"space-large.png"
            meta_small=vertical.render(space_fixture(6),"space","AVENGERS","space|2026-10-16",a)
            meta_large=vertical.render(space_fixture(22),"space","AVENGERS","space|2026-10-16",b)
            with Image.open(a) as small, Image.open(b) as large:
                self.assertEqual(small.width,1440)
                self.assertGreater(large.height,small.height)
            self.assertGreater(meta_large["dimensions"][1],meta_small["dimensions"][1])
            self.assertFalse(meta_large["readyToPost"])
            self.assertFalse(meta_large["discordPostingEnabled"])

    def test_space_partial_flag_cannot_become_approval(self):
        with tempfile.TemporaryDirectory() as tmp:
            result=vertical.render(space_fixture(partial=True),"space","AVENGERS",None,pathlib.Path(tmp)/"s.png")
        self.assertFalse(result["coverageComplete"])
        self.assertFalse(result["readyToPost"])

    def test_individual_average_does_not_cross_clans(self):
        release=space_fixture(3)
        earlier=release["projection"]["events"][0]
        earlier["rows"].append({"player":"AV-SpaceMember-01","clan":"AVENGERS","score":400,
                                "stars":200,"sparks":20,"metadata":{"group":"p"}})
        earlier["rows"].append({"player":"AV-SpaceMember-00","clan":"AV-2","score":1,
                                "stars":100000000,"sparks":10000000,"metadata":{"group":"other"}})
        model=vertical.make_model(release,"space","AVENGERS","space|2026-10-16")
        spotlight=model["individualSpotlights"]
        self.assertEqual(spotlight["abovePersonalAverageEligible"],1)
        self.assertEqual(spotlight["abovePersonalAverageCount"],1)
        self.assertTrue(any(x["label"]=="ABOVE OWN PRIOR AVERAGE" and x["player"]=="AV-SpaceMember-01"
                            for x in spotlight["items"]))
        tracked=next(x for x in spotlight["items"] if x["label"]=="TRACKED CLAN-LEAGUE SPARKS LEADER")
        self.assertNotEqual(tracked["value"],"10,000,000")
        league_space=next(x for x in spotlight["items"] if x["label"]=="TRACKED LEAGUE SPACE DISTANCE")
        self.assertEqual(league_space["player"],"AV-SpaceMember-00")
        self.assertEqual(league_space["value"],"600.0B", "October 9 falls outside the new clan league")

    def test_big_piggy_rank_and_rake_are_preserved(self):
        m=vertical.make_model(fixture_mod.fixture(),"piggy","AV-2","piggy|2026-10-11")
        self.assertEqual(len(m["placementPBs"]),1)
        self.assertEqual(m["rakePercentDisplayedShareSum"],71.0)
        self.assertEqual(m["participantRows"],5)
        self.assertEqual(len(m["benchmarkLadder"]),2)
        self.assertFalse(m["coverageComplete"],"Legacy fixture has no explicit coverage proof")
        with tempfile.TemporaryDirectory() as tmp:
            output=pathlib.Path(tmp)/"piggy.png"
            result=vertical.render(fixture_mod.fixture(),"piggy","AV-2","piggy|2026-10-11",output)
            with Image.open(output) as im:
                self.assertGreater(im.height,im.width)
            self.assertTrue(result["previewOnly"])
            self.assertFalse(result["originalCharacterAssetsIncluded"])


if __name__=="__main__":
    unittest.main()
