"""Top hulls each race built per phase, with the most common outfit. Usage: python races.py"""
import json, collections
from common import true_builds, load, data_path
d = load('data.json'); S = load('seen.json')
tot = {(r['game'], r['turn']): r['totalships'] for r in d['records']}
def ph(r):
    f = tot.get((r['game'], r['turn'] - 1), 0) / r['shiplimit']
    return 'early' if f < .5 else 'near' if f < 1 else 'after'
RN = {1:'Fed',2:'Lizard',3:'Bird',4:'Fascist',5:'Privateer',6:'Cyborg',7:'Crystal',8:'Empire',9:'Robot',10:'Rebel',11:'Colonies',12:'Horwasp'}
C = collections.defaultdict(collections.Counter); cfg = collections.defaultdict(collections.Counter)
H = {}
for g, T in S['tables'].items():
    for h in T['hulls']: H[h['id']] = h
E = {e['id']: e for e in S['tables']['game597079']['engines']}; B = {b['id']: b for b in S['tables']['game597079']['beams']}; TP = {t['id']: t for t in S['tables']['game597079']['torpedos']}
for r in d['records']:
    for b in true_builds(r) or []:
        k = (r['raceid'], ph(r)); C[k][b['hullid']] += 1
        cfg[(k, b['hullid'])][(E[b['engineid']]['name'][:10] if b['engineid'] in E else '?', B[b['beamid']]['name'][:10] if b['beams'] else '-', TP[b['torpedoid']]['name'][:10] if b['torps'] else '-')] += 1
for race in sorted(RN):
    for p in ('early', 'near', 'after'):
        c = C[(race, p)]; n = sum(c.values())
        if not n: continue
        print('%-9s %-5s n=%4d ' % (RN[race], p, n) + '; '.join('%s %d%% [%s]' % (H[h]['name'][:22], 100 * k / n, '/'.join(cfg[((race, p), h)].most_common(1)[0][0])) for h, k in c.most_common(5)))
