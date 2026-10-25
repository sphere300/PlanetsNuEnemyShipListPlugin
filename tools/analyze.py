"""Analyse complete planets.nu games: check the military score formula against each player's
own data and collect what warships were built each turn.
Usage: python -I analyze.py <CompleteGames folder> <output json>"""
import json, os, sys, re, collections

root, out = sys.argv[1], sys.argv[2]

def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)

def part(item, mc):
    if not item:
        return 0
    return item.get(mc, 0) + 5 * (item.get('tritanium', 0) + item.get('duranium', 0) + item.get('molybdenum', 0))

records = []      # one per player-turn
builds = []       # one per newly built warship
formula = []      # (score, model parts)

for game in [g for g in sorted(os.listdir(root)) if len(sys.argv) < 4 or g == sys.argv[3]]:
    gdir = os.path.join(root, game)
    files = collections.defaultdict(dict)
    for name in os.listdir(gdir):
        m = re.match(r'player(\d+)-turn(\d+)\.trn$', name)
        if m:
            files[int(m.group(1))][int(m.group(2))] = os.path.join(gdir, name)
    for pid, turns in sorted(files.items()):
        prev = None
        for t in sorted(turns):
            d = load(turns[t])
            hulls = {h['id']: h for h in d['hulls']}
            engines = {e['id']: e for e in d['engines']}
            beams = {b['id']: b for b in d['beams']}
            torps = {x['id']: x for x in d['torpedos']}
            me = d['player']['id']
            score = next((s for s in d['scores'] if s['ownerid'] == me), None)

            ships = {}
            shipval = ammoval = 0
            for s in d['ships']:
                if s['ownerid'] != me:
                    continue
                h = hulls.get(s['hullid'])
                if not h:
                    continue
                warship = h['beams'] > 0 or h['launchers'] > 0 or h['fighterbays'] > 0
                v = part(h, 'cost') + h['engines'] * part(engines.get(s['engineid']), 'cost') + \
                    s['beams'] * part(beams.get(s['beamid']), 'cost') + s['torps'] * part(torps.get(s['torpedoid']), 'launchercost')
                if h['fighterbays'] > 0:
                    a = s['ammo'] * 125
                elif s['torps'] > 0 and torps.get(s['torpedoid']):
                    a = s['ammo'] * torps[s['torpedoid']]['torpedocost']
                else:
                    a = 0
                ships[s['id']] = dict(hullid=s['hullid'], engineid=s['engineid'], beamid=s['beamid'], beams=s['beams'],
                                      torpedoid=s['torpedoid'], torps=s['torps'], bays=h['fighterbays'], ammo=s['ammo'],
                                      value=v, ammovalue=a, warship=warship, hullname=h['name'], maxbeams=h['beams'],
                                      maxtorps=h['launchers'], name=s['name'])
                if warship:
                    shipval += v
                    ammoval += a
            sb = [b for b in d['starbases'] if any(p['id'] == b['planetid'] and p['ownerid'] == me for p in d['planets'])]
            orders = []
            for b in sb:
                if b['isbuilding'] and b['buildhullid']:
                    h = hulls.get(b['buildhullid'])
                    if not h:
                        continue
                    orders.append(dict(hulltech=b['hulltechlevel'], enginetech=b['enginetechlevel'], beamtech=b['beamtechlevel'], torptech=b['torptechlevel'], hullid=b['buildhullid'], engineid=b['buildengineid'], beamid=b['buildbeamid'], beams=b['buildbeamcount'],
                                       torpedoid=b['buildtorpedoid'], torps=b['buildtorpcount'], warship=h['beams'] > 0 or h['launchers'] > 0 or h['fighterbays'] > 0,
                                       value=part(h, 'cost') + h['engines'] * part(engines.get(b['buildengineid']), 'cost') +
                                       b['buildbeamcount'] * part(beams.get(b['buildbeamid']), 'cost') +
                                       b['buildtorpcount'] * part(torps.get(b['buildtorpedoid']), 'launchercost'),
                                       hullname=h['name'], maxbeams=h['beams'], maxtorps=h['launchers'], bays=h['fighterbays']))
            sbdef = sum(b['defense'] for b in sb) * 7.5
            sbfig = sum(b['fighters'] for b in sb) * 62.5
            pdef = sum(p['defense'] for p in d['planets'] if p['ownerid'] == me) * 5.5
            mines = sum(m['units'] for m in d['minefields'] if m['ownerid'] == me) // 100 * 27
            model = shipval + ammoval + sbdef + sbfig + pdef + mines
            rec = dict(totalships=sum(x['capitalships'] + x['freighters'] for x in d['scores']), shiplimit=d['settings']['shiplimit'],
                       sbtech=[(b['hulltechlevel'], b['enginetechlevel'], b['beamtechlevel'], b['torptechlevel']) for b in sb], game=game, player=pid, turn=t, raceid=d['player']['raceid'], activehulls=d['player']['activehulls'],
                       racehulls=next((r['hulls'] for r in d['races'] if r['id'] == d['player']['raceid']), ''),
                       score=score and score['militaryscore'], militarychange=score and score['militarychange'],
                       capitals=score and score['capitalships'], inventorychange=score and score['inventorychange'], orders=orders, shipchange=score and score['shipchange'],
                       freighterchange=score and score['freighterchange'],
                       model=model, shipval=shipval, ammoval=ammoval, sbdef=sbdef, sbfig=sbfig, pdef=pdef, mines=mines)
            if prev is not None:
                new = [i for i in ships if i not in prev['ships']]
                rec['new'] = [dict(ships[i], id=i) for i in new]
                rec['prevorders'] = prev['rec']['orders']
                for i in new:
                    builds.append(dict(ships[i], id=i, game=game, player=pid, turn=t, raceid=rec['raceid']))
                rec['d'] = {k: rec[k] - prev['rec'][k] for k in ('model', 'shipval', 'ammoval', 'sbdef', 'sbfig', 'pdef', 'mines')}
            records.append(rec)
            prev = dict(ships=ships, rec=rec)
        print(game, 'player', pid, 'turns', len(turns), file=sys.stderr)

with open(out, 'w') as f:
    json.dump(dict(records=records, builds=builds), f)
print('records', len(records), 'builds', len(builds))
