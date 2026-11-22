"""Extract what each player did with torpedoes and fighters in the complete games, one game per process: per player and turn the
launchers of its ships by torpedo type (ships, launchers, torpedoes loaded, cargo space), its carriers, the torpedoes made (gained on
ships seen both turns, loaded on new ships, added to starbase stock, and laid as mines) and laid as mines by type, the fighters made on
ships, the minerals on its planets and its best starbase torpedo tech.
Usage: python ammo.py [--force]                   extract every game in parallel into data/games/ammo_<game>.json
       python -I ammo.py <games folder> <output json> <game>   extract one game"""
import json, os, re, sys, collections

def load(path):
    with open(path, encoding='utf-8') as f:
        text = f.read()
    d, end = json.JSONDecoder(strict=False).raw_decode(text)
    return None if text[end:].strip() else d

def extract(root, game):
    gdir = os.path.join(root, game)
    files = collections.defaultdict(dict)
    for name in os.listdir(gdir):
        m = re.match(r'player(\d+)-turn(\d+)\.trn$', name)
        if m:
            files[int(m.group(1))][int(m.group(2))] = os.path.join(gdir, name)
    recs = []
    for pid, turns in sorted(files.items()):
        prev = None
        for t in sorted(turns):
            d = load(turns[t])
            if d is None:
                prev = None
                continue
            me = d['player']['id']
            hulls = {h['id']: h for h in d['hulls']}
            mine = {p['id'] for p in d['planets'] if p['ownerid'] == me}
            ships = {}
            launch = collections.defaultdict(lambda: [0, 0, 0, 0])
            bays = [0, 0, 0]
            for s in d['ships']:
                if s['ownerid'] != me or s['hullid'] not in hulls:
                    continue
                h = hulls[s['hullid']]
                ships[s['id']] = (s['torpedoid'] if s['torps'] > 0 else 0, h['fighterbays'], s['ammo'])
                if s['torps'] > 0 and s['torpedoid'] > 0:
                    L = launch[s['torpedoid']]
                    L[0] += 1; L[1] += s['torps']; L[2] += s['ammo']; L[3] += h['cargo']
                elif h['fighterbays'] > 0:
                    bays[0] += 1; bays[1] += h['fighterbays']; bays[2] += s['ammo']
            bases = [b for b in d['starbases'] if b['planetid'] in mine]
            stock = collections.Counter()
            baseids = {b['id'] for b in bases}
            for s in d['stock']:
                if s['stocktype'] == 5 and s['starbaseid'] in baseids:
                    stock[s['stockid']] += s['amount']
            laid = collections.Counter()
            for m in d['messages']:
                if m['messagetype'] != 3:
                    continue
                u = re.search(r'(\d+) mines were laid', m['body'])
                i = re.search(r'ID#(\d+)', m['headline'])
                if u and i:
                    sid = int(i.group(1))
                    tid = ships[sid][0] if sid in ships else (prev['ships'][sid][0] if prev and sid in prev['ships'] else 0)
                    laid[tid] += int(u.group(1))
            planets = [p for p in d['planets'] if p['ownerid'] == me]
            rec = dict(player=me, turn=t, raceid=d['player']['raceid'], launch={str(k): v for k, v in launch.items()}, bays=bays,
                       stock={str(k): v for k, v in stock.items()}, laid={str(k): v for k, v in laid.items()},
                       minerals=[sum(p[k] for p in planets) for k in ('tritanium', 'duranium', 'molybdenum', 'megacredits')],
                       torptech=max([b['torptechlevel'] for b in bases] or [0]), bases=len(bases), planets=len(planets))
            if prev is not None and prev['turn'] == t - 1:
                gain = collections.Counter()
                fighters = 0
                for sid, (tid, nb, ammo) in ships.items():
                    before = prev['ships'].get(sid)
                    delta = ammo - before[2] if before else ammo
                    if tid:
                        gain[tid] += delta
                    elif nb:
                        fighters += delta
                for k, v in stock.items():
                    gain[k] += v - prev['stock'].get(k, 0)
                for k, v in prev['stock'].items():
                    if k not in stock:
                        gain[k] -= v
                rec.update(gain={str(k): v for k, v in gain.items() if v}, fightergain=fighters)
            recs.append(rec)
            prev = dict(turn=t, ships=ships, stock=stock)
        print(game, 'player', pid, file=sys.stderr)
    return dict(game=game, recs=recs)

if __name__ == '__main__':
    if len(sys.argv) == 4:
        json.dump(extract(sys.argv[1], sys.argv[3]), open(sys.argv[2], 'w'))
        sys.exit()
    import subprocess
    from concurrent.futures import ThreadPoolExecutor
    from common import HERE, GAMES, data_path
    root = os.path.abspath(GAMES)
    games = sorted(g for g in os.listdir(root) if g.startswith('game') and os.path.isdir(os.path.join(root, g)))
    force = '--force' in sys.argv
    jobs = [g for g in games if force or not os.path.exists(data_path(os.path.join('games', 'ammo_%s.json' % g)))]
    def run(game):
        out = data_path(os.path.join('games', 'ammo_%s.json' % game))
        r = subprocess.run([sys.executable, '-I', os.path.join(HERE, 'ammo.py'), root, out + '.tmp', game], capture_output=True, text=True)
        if r.returncode:
            return '%s failed:\n%s' % (game, r.stderr[-2000:])
        os.replace(out + '.tmp', out)
        return game + ' done'
    with ThreadPoolExecutor(max_workers=max(1, (os.cpu_count() or 2) - 1)) as pool:
        for msg in pool.map(run, jobs):
            print(msg, flush=True)
