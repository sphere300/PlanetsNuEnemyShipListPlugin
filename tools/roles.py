"""Share of fighters, sweepers, scouts and utility ships each race built per phase. Saves reports/roles.tsv. Usage: python roles.py"""
import json, collections, re
from common import true_builds, load, data_path, write_tsv
d = load('data.json'); S = load('seen.json')
tot = {(r['game'], r['turn']): r['totalships'] for r in d['records']}
H = {}
for T in S['tables'].values():
    for h in T['hulls']: H[h['id']] = h
def role(h):
    if re.search('alchemy|refinery|tanker', h['name'], re.I): return 'utility'
    if h['launchers'] == 0 and h['fighterbays'] == 0:
        if h['mass'] < 60 and h['beams'] <= 2: return 'scout'
        if h['beams'] >= 3 and h['mass'] < 300: return 'sweep'
    return 'fight'
def ph(r):
    f = tot.get((r['game'], r['turn'] - 1), 0) / r['shiplimit']
    return 'opening' if f < .25 else 'early' if f < .5 else 'near' if f < 1 else 'after'
RN = {1:'Fed',2:'Lizard',3:'Bird',4:'Fascist',5:'Privateer',6:'Cyborg',7:'Crystal',8:'Empire',9:'Robot',10:'Rebel',11:'Colonies'}
C = collections.defaultdict(collections.Counter)
for r in d['records']:
    for b in true_builds(r) or []:
        C[(r['raceid'], ph(r))][role(H[b['hullid']])] += 1; C[(0, ph(r))][role(H[b['hullid']])] += 1
for race in [0] + sorted(RN):
    print('%-9s' % RN.get(race, 'ALL'), '  '.join('%s: %s' % (p, ' '.join('%s %2d%%' % (k[:5], 100 * C[(race, p)][k] / max(1, sum(C[(race, p)].values()))) for k in ('fight', 'sweep', 'scout', 'utility'))) for p in ('opening', 'early', 'near', 'after')))
write_tsv('roles', ['race', 'phase', 'builds', 'fighter %', 'sweeper %', 'scout %', 'utility %'],
          [[RN.get(race, 'ALL'), p, sum(C[(race, p)].values())] + [round(100 * C[(race, p)][k] / max(1, sum(C[(race, p)].values())), 1) for k in ('fight', 'sweep', 'scout', 'utility')]
           for race in [0] + sorted(RN) for p in ('opening', 'early', 'near', 'after')])
