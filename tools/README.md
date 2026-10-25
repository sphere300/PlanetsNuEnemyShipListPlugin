# Build predictor tuning

Scripts that tune the Build Predictor in `EnemyShips.js` (`estimatePhases`, `estimateRaceFocus`) on the complete games in `../CompleteGames`.
They run the plugin's own estimator code against every build turn, so the scores show how the plugin itself performs.

Requires Python 3 and Node.js. Generated files go to `data/` (not in git, about 100 MB for 9 games).

## Retune after adding games

Add each game as a folder of `player<id>-turn<n>.trn` files in `CompleteGames`, then from this folder:

```
python extract.py        # extract new games (in parallel) and merge everything into data/
python mkcases.py        # build turns to test on
python focus.py          # race focus tables: all games, plus one per left-out game for testing
python writefocus.py     # write the all-games table into EnemyShips.js (estimateRaceFocus)
node report.js           # accuracy per phase and per game
node tune.js             # tune estimatePhases; copy the BEST lines into EnemyShips.js
node report.js           # check the result
```

Extraction reads several GB of turn files and takes a few minutes; `extract.py --force` re-extracts games already done.

## How scores are measured

- Only build turns before the ship limit count; after it the plugin does not estimate builds automatically.
- Turn 2 is measured as the plugin sees it: from the starting military (`startMilitary`) rather than the empty turn 1
  scoreboard, and from the turn 3 changes when the turn 2 scoreboard still shows turn 1.
- Each game is scored with a focus table learned from the other games only (leave one game out), so the scores show
  how well the plugin predicts a game it has not seen.
- `top1`: the top prediction has exactly the hulls built. `ships right in top1`: share of the built ships whose hull is in the
  top prediction. `hulls in top8`: the hulls built are among the listed predictions. `full config`: the same with engine, beams and torpedoes.
- `tune.js` changes one value at a time and keeps a change only if it raises the score and improves at least as many games
  as it worsens. Without that rule the tuning overfits to individual games.

## Other scripts

| Script | Shows |
|---|---|
| `node breakdown.js <phase>` | accuracy of one phase by number of ships built and by race |
| `node misses.js <phase> [ships]` | wrong top predictions with what was built, and the most common mix-ups |
| `python races.py` | top hulls each race built per phase, with their usual outfit |
| `python roles.py` | share of fighters, sweepers, scouts and utility ships per race and phase |
| `python ratio.py` | how much of the military change the ships built explain (source of the `fit` arrays) |
| `python phases.py` | hull size and component tech of the ships built, by how full the ship limit was |

`report.js`, `tune.js` and `breakdown.js` take parameter overrides as JSON, for example
`node report.js '{"estimatePhases":{"early":{"focusWeight":10}}}'`. Set `PLUGIN` to test another copy of the plugin
and `FOCUS` to use another focus table from `data/` (for example one made with `python focus.py 10 focus_m10.json`).

`analyze.py` and `sightings.py` extract one game each and are run by `extract.py`; `common.py`, `evalcore.js` and
`pool.js` are shared code.
