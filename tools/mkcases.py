"""Build turns of all complete games as test cases for the estimator (data/cases.json), plus total ships per turn and the ship limit per game. Usage: python mkcases.py"""
import json, collections
from common import true_builds, load, data_path
d = load('data.json')
cases = []
totals = collections.defaultdict(dict)
for r in d['records']:
    totals[r['game']][r['turn']] = r['totalships']
    built = true_builds(r)
    if not built or not r['militarychange'] or r['militarychange'] <= 0 or not r['shipchange'] or r['shipchange'] <= 0:
        continue
    clean = r['shipchange'] == len(built) and len([x for x in r['new'] if x['warship']]) == len(built)
    cases.append(dict(game=r['game'], player=r['player'], turn=r['turn'], count=r['shipchange'], target=r['militarychange'],
                      hulls=sorted(b['hullid'] for b in built), clean=clean,
                      full=sorted('%d|%d|%d|%d' % (b['hullid'], b['engineid'], b['beamid'] if b['beams'] else 0, b['torpedoid'] if b['torps'] else 0) for b in built)))
limits = {r['game']: r['shiplimit'] for r in d['records']}
races = {}
for r in d['records']: races[(r['game'], r['player'])] = r['raceid']
for c in cases: c['race'] = races[(c['game'], c['player'])]
json.dump(dict(cases=cases, totals=totals, limits=limits), open(data_path('cases.json'), 'w'))
print(len(cases), collections.Counter(c['game'] for c in cases), 'clean', sum(c['clean'] for c in cases))
