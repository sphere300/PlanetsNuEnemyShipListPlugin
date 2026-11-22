"""Coordinate descent on each pre-cap phase's search settings (estimatePhases) on the graphics card (gpusearch.py), the same method
as tune.js: one value at a time, judged on the build turns of the phase by the search alone; a change is kept if it raises the score
and improves at least as many games as it worsens. Retrain the ranker after copying the result into EnemyShips.js.
Run node gpuexport.js first (after any change to EnemyShips.js); python gpucheck.py checks the GPU search still matches the plugin.
Prints the best values per phase to copy into estimatePhases. Saves the accepted steps to reports/tune.tsv.
Usage: python gputune.py [phases, comma separated, default opening,early,nearCap]"""
import sys, time
import numpy as np
from common import write_tsv
from gpusearch import Search, load_settings, objective

GRID = {'outfitWeight': [0, 0.25, 0.5, 1, 1.5], 'focusWeight': [0, 5, 10, 20, 40, 80, 160], 'focusOutfit': [0, 0.25, 0.5, 0.75, 0.9],
        'fitWeight': [0.25, 0.5, 0.75, 1, 1.5, 2, 3], 'seenWeight': [0, 0.5, 1, 3, 8], 'hullSlope': [-2, -1, 0, 1, 2], 'beamSlope': [-3, -2, -1, 0, 1],
        'torpedoSlope': [-3, -2, -1, 0, 1, 2], 'bestEngine': [0, 2, 4, 8], 'cheapEngine': [0, 1, 3, 6]}
stages = (sys.argv[1] if len(sys.argv) > 1 else 'opening,early,nearCap').split(',')

t0 = time.time()
search = Search()
settings = load_settings()

def by_game(R):
    o = objective(R)
    return {g: o[R['game'] == g].mean() for g in np.unique(R['game'])}

def fmt(R):
    return 'top1 %.1f ships %.1f top5 %.1f full %.1f' % tuple(100 * R[k].mean() for k in ('top1', 'shipHit', 'hit', 'full'))

def row(stage, name, value, R, up, down):
    return [stage, name, value, round(objective(R).mean(), 4)] + [round(100 * R[k].mean(), 1) for k in ('top1', 'shipHit', 'hit', 'full')] + [up, down]

steps, evals = [], 0
for stage in stages:
    P = settings['estimatePhases'][stage]
    idx = [n for n in range(len(search.cases)) if search.stage_eval[n] == stage]
    R = search.evaluate(settings, idx, stage); evals += 1
    best, bestG = objective(R).mean(), by_game(R)
    print(stage, len(idx), 'turns, start %.4f' % best, fmt(R), flush=True)
    steps.append(row(stage, 'start', '', R, '', ''))
    for rnd in range(3):
        changed = False
        for k, values in GRID.items():
            for v in values:
                if v == P[k]:
                    continue
                old = P[k]; P[k] = v
                R2 = search.evaluate(settings, idx, stage); evals += 1
                o, g = objective(R2).mean(), by_game(R2)
                up = sum(g[x] > bestG[x] + 1e-9 for x in g); down = sum(g[x] < bestG[x] - 1e-9 for x in g)
                if o > best + 1e-9 and up >= down:
                    best, bestG, changed = o, g, True
                    steps.append(row(stage, k, v, R2, up, down))
                    print('   %s = %s %.4f %s games +%d -%d' % (k, v, o, fmt(R2), up, down), flush=True)
                else:
                    P[k] = old
        if not changed:
            break
    print('BEST', stage, ', '.join('%s: %s' % (k, P[k]) for k in GRID), flush=True)
    steps.append([stage, 'BEST', ', '.join('%s: %s' % (k, P[k]) for k in GRID)])
print('%d evaluations, %.0fs' % (evals, time.time() - t0))
write_tsv('tune', ['phase', 'parameter', 'value', 'objective', 'top1 %', 'ships right in top1 %', 'hulls in top5 %', 'full config in top5 %',
                   'games better', 'games worse'], steps)
