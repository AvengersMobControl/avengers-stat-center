# Mob Control loadout image catalog

**42 individual card images** extracted from four armory screenshots on November 2, 2026.

This is a 42-card image inventory with a **leader-selected two-row starter matrix** in `recommended-loadouts.json`. Do not infer any additional strategies or endorsements.
All images are direct crops of the user-provided in-game card artwork; no AI re-creations.
The visible card levels and rarity badges are snapshot details, not a source of current player levels.

Use `catalog.json` for machine-readable IDs, names, image paths, screenshot coordinates, and slot categories.
Use `catalog.csv` for spreadsheet imports. Categories are `cannons`, `mobs`, `champions`, `ultimates`.

## Inventory

### Cannons (11)

| Image | Name | ID |
| --- | --- | --- |
| ![Single Shot](cannons/single-shot.png) | Single Shot | `cannon:single-shot` |
| ![Rapid Fire](cannons/rapid-fire.png) | Rapid Fire | `cannon:rapid-fire` |
| ![Shotgun](cannons/shotgun.png) | Shotgun | `cannon:shotgun` |
| ![Lucky Shot](cannons/lucky-shot.png) | Lucky Shot | `cannon:lucky-shot` |
| ![Big Bertha](cannons/big-bertha.png) | Big Bertha | `cannon:big-bertha` |
| ![Double](cannons/double.png) | Double | `cannon:double` |
| ![Sniper](cannons/sniper.png) | Sniper | `cannon:sniper` |
| ![Flamethrower](cannons/flamethrower.png) | Flamethrower | `cannon:flamethrower` |
| ![Railshot](cannons/railshot.png) | Railshot | `cannon:railshot` |
| ![Blinky](cannons/blinky.png) | Blinky | `cannon:blinky` |
| ![Triple](cannons/triple.png) | Triple | `cannon:triple` |

### Mobs (12)

| Image | Name | ID |
| --- | --- | --- |
| ![Normie](mobs/normie.png) | Normie | `mob:normie` |
| ![Ninja](mobs/ninja.png) | Ninja | `mob:ninja` |
| ![Chicken](mobs/chicken.png) | Chicken | `mob:chicken` |
| ![Bear](mobs/bear.png) | Bear | `mob:bear` |
| ![Alien](mobs/alien.png) | Alien | `mob:alien` |
| ![Paper Bag](mobs/paper-bag.png) | Paper Bag | `mob:paper-bag` |
| ![Soldier](mobs/soldier.png) | Soldier | `mob:soldier` |
| ![Knight](mobs/knight.png) | Knight | `mob:knight` |
| ![Bat](mobs/bat.png) | Bat | `mob:bat` |
| ![Caveman](mobs/caveman.png) | Caveman | `mob:caveman` |
| ![Mini Blob](mobs/mini-blob.png) | Mini Blob | `mob:mini-blob` |
| ![Raccoon](mobs/raccoon.png) | Raccoon | `mob:raccoon` |

### Champions (10)

| Image | Name | ID |
| --- | --- | --- |
| ![Great Normie](champions/great-normie.png) | Great Normie | `champion:great-normie` |
| ![Nexus](champions/nexus.png) | Nexus | `champion:nexus` |
| ![Sirion](champions/sirion.png) | Sirion | `champion:sirion` |
| ![Explodon](champions/explodon.png) | Explodon | `champion:explodon` |
| ![Big Blob](champions/big-blob.png) | Big Blob | `champion:big-blob` |
| ![Captain Kaboom](champions/captain-kaboom.png) | Captain Kaboom | `champion:captain-kaboom` |
| ![Mobzilla](champions/mobzilla.png) | Mobzilla | `champion:mobzilla` |
| ![Lootboxer](champions/lootboxer.png) | Lootboxer | `champion:lootboxer` |
| ![Stack Troopers](champions/stack-troopers.png) | Stack Troopers | `champion:stack-troopers` |
| ![Giga Chicken](champions/giga-chicken.png) | Giga Chicken | `champion:giga-chicken` |

### Ultimates (9)

| Image | Name | ID |
| --- | --- | --- |
| ![Rocket Barrage](ultimates/rocket-barrage.png) | Rocket Barrage | `ultimate:rocket-barrage` |
| ![Mass Abduction](ultimates/mass-abduction.png) | Mass Abduction | `ultimate:mass-abduction` |
| ![Rainbow Rage](ultimates/rainbow-rage.png) | Rainbow Rage | `ultimate:rainbow-rage` |
| ![Summon Gate](ultimates/summon-gate.png) | Summon Gate | `ultimate:summon-gate` |
| ![MobCopter](ultimates/mobcopter.png) | MobCopter | `ultimate:mobcopter` |
| ![Champion Overdrive](ultimates/champion-overdrive.png) | Champion Overdrive | `ultimate:champion-overdrive` |
| ![Rainbow1](ultimates/rainbow1.png) | Rainbow1 | `ultimate:rainbow1` |
| ![Piñata Party](ultimates/pinata-party.png) | Piñata Party | `ultimate:pinata-party` |
| ![Lucky Roll](ultimates/lucky-roll.png) | Lucky Roll | `ultimate:lucky-roll` |

## Source and use notes

- The four source screenshots were supplied directly by the AVENGERS commissioner.
- The crop rectangle and source screenshot filename for each card are recorded in `catalog.json`.
- `Rainbow1` is transcribed as displayed on its screenshot; confirm the game label if used as a public-facing recommendation.
- For loadout recommendations, reference the stable IDs rather than hardcoding filenames.
- No strategy ratings, recommended pairings, account upgrades, or event-specific rules have been assigned yet.

## Leader-selected matrix starter

| INTENDED PURPOSE | CANNON | MOB | CHAMPION | ULTIMATE |
|---|---|---|---|---|
| Piggy with GigaChicken | Single Shot (7.3 s) | Chicken | Giga Chicken | Champion Overdrive |
| Space Race | Big Bertha (9.0 s) | Raccoon | Explodon | Summon Gate |

## Cannon timings (seconds, one decimal)

| Cannon | Time |
|---|---:|
| Single Shot | 7.3 |
| Rapid Fire | 7.9 |
| Shotgun | 8.5 |
| Lucky Shot | 9.6 |
| Big Bertha | 9.0 |
| Double | 9.5 |
| Sniper | 9.3 |
| Railshot | 9.7 |
| Flamethrower | 11.1 |
| Triple | 10.5 |
| Blinky | 10.5 |

The leader explicitly overrode Big Bertha, Triple, and Blinky; original timing screenshot otherwise rounded to one decimal place. Machine-readable values live in `catalog.json` and the selected rows are in `recommended-loadouts.json`.
