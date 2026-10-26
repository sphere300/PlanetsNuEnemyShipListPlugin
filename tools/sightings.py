"""Collect what each player saw of other players' ships and minefields, plus the component tables.
Usage: python -I sightings.py <CompleteGames folder> <output json>"""
import json, os, sys, re

root, out = sys.argv[1], sys.argv[2]
seen = []
mines = []        # (game, observer, turn, owner, minefield id, units), the observer's own fields included
tables = {}
for game in [g for g in sorted(os.listdir(root)) if len(sys.argv) < 4 or g == sys.argv[3]]:
    gdir = os.path.join(root, game)
    for name in os.listdir(gdir):
        m = re.match(r'player(\d+)-turn(\d+)\.trn$', name)
        if not m:
            continue
        with open(os.path.join(gdir, name), encoding='utf-8') as f:
            d = json.load(f)
        me = d['player']['id']
        t = int(m.group(2))
        # turn 0 files list every player with race 0
        if game not in tables or not any(tables[game]['raceof'].values()):
            tables[game] = dict(hulls=d['hulls'], engines=d['engines'], beams=d['beams'], torpedos=d['torpedos'],
                                races={r['id']: r['hulls'] for r in d['races']},
                                raceof={p['id']: p['raceid'] for p in d['players']})
        for s in d['ships']:
            if s['ownerid'] != me and s['ownerid'] > 0 and s['infoturn'] == t:
                seen.append((game, me, t, s['ownerid'], s['id'], s['hullid'], s['engineid'], s['beamid'], s['torpedoid']))
        for m in d['minefields']:
            if m['ownerid'] > 0 and m['infoturn'] == t:
                mines.append((game, me, t, m['ownerid'], m['id'], m['units']))
    print(game, len(seen), file=sys.stderr)
json.dump(dict(seen=seen, mines=mines, tables=tables), open(out, 'w'))
