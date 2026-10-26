# Build predictor tuning

Scripts that tune the Build Predictor in `EnemyShips.js` (`estimatePhases`, `estimateRaceFocus`) on the complete games in `../CompleteGames`.
They run the plugin's own estimator code against every build turn, so the scores show how the plugin itself performs.

Requires Python 3 and Node.js. Generated files go to `data/` (not in git, about 320 MB for 25 games).

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
node confidence.js       # refit the confidence shown for the listed builds; copy the printed lines into EnemyShips.js
node report.js --notes "what changed"   # copy the printed estimateAccuracy line into EnemyShips.js; adds a row to model_history.tsv
```

Every report is also saved as a tab delimited file in `reports/` (not in git), for example `reports/report.tsv`.

Extraction reads several GB of turn files and takes a few minutes; `extract.py --force` re-extracts games already done.

## How scores are measured

- Only build turns before the ship limit count; after it the plugin does not estimate builds automatically.
- Turn 2 is measured as the plugin sees it: from the starting military (`startMilitary`) rather than the empty turn 1
  scoreboard, and from the turn 3 changes when the turn 2 scoreboard still shows turn 1.
- Each game is scored with a focus table learned from the other games only (leave one game out), so the scores show
  how well the plugin predicts a game it has not seen.
- `top1`: the top prediction has exactly the hulls built. `ships right in top1`: share of the built ships whose hull is in the
  top prediction. `hulls in top5`: the hulls built are among the listed predictions (`estimateResults`, 5). `full config`: the same with engine, beams and torpedoes.
- The military change is taken as the plugin takes it: the change from the minefields other players saw in the build turn and
  the turn before (`getMineChange`) is left out first. `MINES=0` keeps the full change, to compare.
- `seen` / `unseen`: build turns where other players had seen a warship of the player by the build turn or the turn after, or not.
- No listed prediction is worth more than 1.25 times the military change left for builds (`estimateMaxOver`).
- `tune.js` changes one value at a time and keeps a change only if it raises the score and improves at least as many games
  as it worsens. Without that rule the tuning overfits to individual games.

## Model version and accuracy table

The Build Predictor shows above the predicted builds how often the estimate was right on the complete games (correct hulls
and loadout among the listed builds, correct hulls in the top build, correct hulls among the listed builds), from
`estimateAccuracy` in `EnemyShips.js`, with the model version: a hash of everything the estimate depends on
(`estimateModelParts`, see `getModelVersion`) and a number that goes up whenever the hash changes. The plugin flags the
table when its code no longer matches the measured hash. `node report.js` (without overrides) prints the hash and, when it
changed, the `estimateAccuracy` line to copy into `EnemyShips.js`. Retuning should raise the scores; have a good reason when
they drop.

`model_history.tsv` (in git) keeps a row for every evaluation of the model: version, model id (the hash), date, games and
turns tested, number of builds listed, the three scores for each phase (titled by the share of the ship limit in use, e.g. `25-50% Ship Limit`, as in the plugin), and notes on what changed.
`report.js` without overrides
adds the row and prints the change against the row before; pass `--notes "..."` with what changed in the model and, if a
score dropped, why. A run of the same model with the same scores is only added with notes.

## Other scripts

| Script | Shows |
|---|---|
| `node breakdown.js <phase>` | accuracy of one phase by number of ships built and by race |
| `node misses.js <phase> [ships]` | wrong top predictions with what was built, and the most common mix-ups |
| `python races.py` | top hulls each race built per phase, with their usual outfit |
| `python roles.py` | share of fighters, sweepers, scouts and utility ships per race and phase |
| `node starbase.js` | how well the starbase builds (`estimateStarbaseBuilds`, `estimateStarbaseItems`) make up the rest of the military change, and which kinds of build they pick |
| `python ratio.py` | how much of the military change the ships built explain (source of the `fit` arrays) |
| `node confidence.js` | fits `estimateListed` and `estimateConfidenceSpread`, and how well the confidence matches what was built |
| `python phases.py` | hull size and component tech of the ships built, by how full the ship limit was |

`report.js`, `tune.js` and `breakdown.js` take parameter overrides as JSON, for example
`node report.js '{"estimatePhases":{"early":{"focusWeight":10}}}'`. Set `PLUGIN` to test another copy of the plugin
and `FOCUS` to use another focus table from `data/` (for example one made with `python focus.py 10 focus_m10.json`).

`analyze.py` and `sightings.py` (ships and minefields seen by other players) extract one game each and are run by `extract.py`; `common.py`, `evalcore.js` and
`pool.js` are shared code.
