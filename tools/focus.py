"""Race focus tables: per race and phase, the share of builds per hull and the outfits (engine, beam, torpedo) used on it.
Writes data/focus.json with the table from all games and one table per left-out game.
Usage: python focus.py [smoothing, default 3] [output name]"""
import json, collections, sys
from common import true_builds, load, data_path
d = load('data.json')
tot = {(r['game'], r['turn']): r['totalships'] for r in d['records']}
PH = ('opening', 'early', 'nearCap')
def phase(r):
    f = tot.get((r['game'], r['turn'] - 1), 0) / r['shiplimit']
    return 'opening' if f < .25 else 'early' if f < .5 else 'nearCap' if f < 1 else None
builds = []
for r in d['records']:
    p = phase(r)
    if p is None: continue
    for b in true_builds(r) or []:
        builds.append((r['game'], r['raceid'], p, b['hullid'], (b['engineid'], b['beamid'] if b['beams'] else 0, b['torpedoid'] if b['torps'] else 0)))
M = float(sys.argv[1]) if len(sys.argv) > 1 else 3

def table(exclude):
    hulls = collections.defaultdict(collections.Counter); pooled = collections.defaultdict(collections.Counter)
    outfits = collections.defaultdict(collections.Counter)
    for g, race, p, h, o in builds:
        if g == exclude: continue
        hulls[(race, p)][h] += 1; pooled[race][h] += 1; outfits[(race, p, h)][o] += 1; outfits[(race, None, h)][o] += 1
    out = {}
    for race in sorted(pooled):
        pn = sum(pooled[race].values())
        out[race] = {}
        for p in PH:
            c = hulls[(race, p)]; n = sum(c.values())
            share = {h: (c[h] + M * pooled[race][h] / pn) / (n + M) for h in pooled[race]}
            rows = []
            for h, s in sorted(share.items(), key=lambda x: -x[1])[:10]:
                if s < 0.01: continue
                oc = outfits[(race, p, h)] if sum(outfits[(race, p, h)].values()) >= 3 else outfits[(race, None, h)]
                on = sum(oc.values())
                rows.append([h, round(s, 3), [[e, b, t, round(k / on, 2)] for (e, b, t), k in oc.most_common(4) if k / on >= 0.05]])
            out[race][p] = rows
    return out
games = sorted({b[0] for b in builds})
json.dump(dict(all=table(None), logo={g: table(g) for g in games}), open(data_path(sys.argv[2] if len(sys.argv) > 2 else 'focus.json'), 'w'))
print('builds', len(builds), 'races', len(table(None)))
