"""Check the GPU search (gpusearch.py) against the plugin's own search: run python gpuexport.js and RANKER=0 node searchresults.js
first (both with the same EnemyShips.js). Prints the scores of both, the turns where they differ, and the time taken.
Usage: python gpucheck.py [overrides json, the same as given to searchresults.js]"""
import json, sys, time
import numpy as np
from common import data_path
from gpusearch import Search, load_settings, apply_overrides, objective

S = Search()
settings = apply_overrides(load_settings(), json.loads(sys.argv[1]) if len(sys.argv) > 1 else {})
js = json.load(open(data_path('gpu_js.json')))
idx = [n for n, c in enumerate(S.cases)]
J = {k: np.array([js[str(S.cases[n]['i'])][j] for n in idx], dtype=float) for j, k in enumerate(('top1', 'hit', 'full', 'shipHit'))}
for run in range(2):
    t0 = time.time()
    R = S.evaluate(settings, idx, name='all')
    print('run %d: %.1fs%s' % (run + 1, time.time() - t0, ' (includes loading the turns to the graphics card)' if run == 0 else ''))
for k in ('top1', 'hit', 'full', 'shipHit'):
    d = np.abs(R[k] - J[k]) > 1e-9
    print('%-8s plugin %5.1f%%  gpu %5.1f%%  turns differing %d' % (k, 100 * J[k].mean(), 100 * R[k].mean(), d.sum()))
print('objective plugin %.4f gpu %.4f' % (objective(J).mean(), objective(R).mean()))
bad = [n for n in idx if any(abs(R[k][n] - J[k][n]) > 1e-9 for k in J)]
for n in bad[:15]:
    c = S.cases[n]
    print('  case %d %s player turn %d count %d stage %s: plugin %s gpu %s' % (c['i'], c['game'], c['turn'] if 'turn' in c else -1, c['count'], c['stage'],
          [J[k][n] for k in J], [R[k][n] for k in J]))
