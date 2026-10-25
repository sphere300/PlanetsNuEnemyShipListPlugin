"""Build turns of all complete games as test cases for the estimator (data/cases.json), plus total ships per turn and the ship limit per game. Usage: python mkcases.py"""
import json, collections, re
from common import true_builds, load, data_path, PLUGIN
d = load('data.json')
# military score every player starts with: the turn 1 scoreboard shows 0, so the plugin counts turn 2 from this
start = int(re.search(r'startMilitary: (\d+)', open(PLUGIN, encoding='utf-8').read()).group(1))
byturn = {(r['game'], r['player'], r['turn']): r for r in d['records']}

def changes(r):
    """warships and military gained this turn, as the plugin sees them"""
    if r['turn'] != 2:
        return r['shipchange'], r['militarychange']
    if r['score'] or r['capitals']:
        return r['shipchange'], r['militarychange'] - start
    # turn 2 often still shows the empty scoreboard of turn 1: the turn 3 changes give the real turn 2
    nxt = byturn.get((r['game'], r['player'], 3))
    if not nxt or nxt['score'] is None:
        return None, None
    return nxt['capitals'] - nxt['shipchange'], nxt['score'] - nxt['militarychange'] - start

cases = []
totals = collections.defaultdict(dict)
for r in d['records']:
    totals[r['game']][r['turn']] = r['totalships']
    built = true_builds(r)
    count, target = changes(r)
    if not built or not target or target <= 0 or not count or count <= 0:
        continue
    clean = count == len(built) and len([x for x in r['new'] if x['warship']]) == len(built)
    cases.append(dict(game=r['game'], player=r['player'], turn=r['turn'], count=count, target=target,
                      hulls=sorted(b['hullid'] for b in built), clean=clean,
                      full=sorted('%d|%d|%d|%d' % (b['hullid'], b['engineid'], b['beamid'] if b['beams'] else 0, b['torpedoid'] if b['torps'] else 0) for b in built)))
limits = {r['game']: r['shiplimit'] for r in d['records']}
races = {}
for r in d['records']: races[(r['game'], r['player'])] = r['raceid']
for c in cases: c['race'] = races[(c['game'], c['player'])]
json.dump(dict(cases=cases, totals=totals, limits=limits), open(data_path('cases.json'), 'w'))
print(len(cases), collections.Counter(c['game'] for c in cases), 'clean', sum(c['clean'] for c in cases))
