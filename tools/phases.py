"""Hull size and component tech of the ships built, by how full the ship limit was. Usage: python phases.py"""
import json, collections, statistics as st
from common import true_builds, q, load, data_path
d = load('data.json'); S = load('seen.json')
prevtot = {}
for r in d['records']:
    prevtot[(r['game'], r['player'], r['turn'])] = r['totalships']
def bucket(f):
    for b in (0.25, 0.5, 0.75, 0.9, 1.0):
        if f < b: return '<%.2f' % b
    return 'cap'
B = collections.defaultdict(list)
for r in d['records']:
    built = true_builds(r)
    if not built: continue
    T = S['tables'][r['game']]
    H = {h['id']: h for h in T['hulls']}; E = {e['id']: e for e in T['engines']}; Bm = {b['id']: b for b in T['beams']}; Tp = {x['id']: x for x in T['torpedos']}
    pt = prevtot.get((r['game'], r['player'], r['turn'] - 1), r['totalships'])
    f = pt / r['shiplimit']
    # max tech available to builder last turn
    prev = [x for x in d['records'] if False]
    race = T['races'][str(r['raceid'])].split(',')
    for b in built:
        h = H[b['hullid']]
        racehulls = [H[int(x)] for x in race if x and int(x) in H and (H[int(x)]['beams'] or H[int(x)]['launchers'] or H[int(x)]['fighterbays'])]
        rank = sorted(racehulls, key=lambda x: x['cost'] + 5*(x['tritanium']+x['duranium']+x['molybdenum'])).index(h) / max(1, len(racehulls)-1) if h in racehulls else None
        B[bucket(f)].append(dict(value=b['value'], hullcost=h['cost'], tech=h['techlevel'], mass=h['mass'], eng=E[b['engineid']]['techlevel'] if b['engineid'] in E else 0,
            beam=Bm[b['beamid']]['techlevel'] if b['beams'] and b['beamid'] in Bm else None, torp=Tp[b['torpedoid']]['techlevel'] if b['torps'] and b['torpedoid'] in Tp else None,
            fullb=(b['beams'] == h['beams']) if h['beams'] else None, fullt=(b['torps'] == h['launchers']) if h['launchers'] else None, rank=rank,
            eid=b['engineid']))
order = ['<0.25','<0.50','<0.75','<0.90','<1.00','cap']
def m(L): L=[x for x in L if x is not None]; return '%6.2f' % (sum(L)/len(L)) if L else '   -  '
print('bucket   n  value(med)  hulltech  hullrank  mass  engtech  beamtech torptech fullbeams fulltorps')
for k in order:
    L = B[k]
    print('%-6s %4d %8d     %s   %s   %5.0f  %s   %s   %s   %s   %s' % (k, len(L), q([x['value'] for x in L], .5), m([x['tech'] for x in L]), m([x['rank'] for x in L]),
        st.mean(x['mass'] for x in L), m([x['eng'] for x in L]), m([x['beam'] for x in L]), m([x['torp'] for x in L]), m([x['fullb'] for x in L]), m([x['fullt'] for x in L])))
print()
for k in order:
    c = collections.Counter(x['eng'] for x in B[k]); n = len(B[k])
    print(k, 'engine tech share:', ' '.join('%d:%.0f%%' % (e, 100*c[e]/n) for e in sorted(c)))
for k in order:
    c = collections.Counter(x['beam'] for x in B[k] if x['beam']); n = sum(c.values())
    print(k, 'beam tech share:', ' '.join('%d:%.0f%%' % (e, 100*c[e]/n) for e in sorted(c)))
for k in order:
    c = collections.Counter(x['torp'] for x in B[k] if x['torp']); n = sum(c.values())
    print(k, 'torp tech share:', ' '.join('%d:%.0f%%' % (e, 100*c[e]/n) for e in sorted(c)))
