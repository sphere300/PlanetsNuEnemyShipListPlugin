"""How much of the military change the ships built explain, per phase (source of estimatePhases fit). Saves reports/ratio.tsv. Usage: python ratio.py"""
import json, collections
from common import true_builds, q, load, data_path, write_tsv
d = load('data.json')
tot = {(r['game'], r['turn']): r['totalships'] for r in d['records']}
R = collections.defaultdict(list)
for r in d['records']:
    built = true_builds(r)
    if not built or not r['militarychange'] or r['militarychange'] <= 0 or not r['shipchange'] or r['shipchange'] <= 0: continue
    if r['shipchange'] != len(built) or len([x for x in r['new'] if x['warship']]) != len(built): continue
    f = tot.get((r['game'], r['turn'] - 1), 0) / r['shiplimit']
    p = 'opening' if f < .25 else 'early' if f < .5 else 'nearCap' if f < 1 else 'afterCap'
    R[p].append(sum(b['value'] for b in built) / r['militarychange'])
rows = []
edges = [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, .95, 1.0, 1.02, 1.05, 1.1, 1.25, 1.5]
for p in ('opening', 'early', 'nearCap', 'afterCap'):
    L = R[p]; n = len(L)
    hist = [sum(edges[i] <= x < edges[i + 1] for x in L) / n for i in range(len(edges) - 1)]
    rows.append([p, n, round(q(L, .5), 2)] + [round(100 * h, 1) for h in hist] + [round(100 * sum(x >= 1.5 for x in L) / n, 1)])
    print(p, n, 'median %.2f' % q(L, .5), ' '.join('%.2f-%.2f:%.0f%%' % (edges[i], edges[i+1], 100 * h) for i, h in enumerate(hist)), ' >1.5: %.0f%%' % (100 * sum(x >= 1.5 for x in L) / n))
write_tsv('ratio', ['phase', 'turns', 'median'] + ['%.2f-%.2f %%' % (edges[i], edges[i + 1]) for i in range(len(edges) - 1)] + ['>1.5 %'], rows)
