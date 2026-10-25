"""Shared locations and helpers for the build predictor tuning scripts."""
import json, os, collections

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'data')                                   # generated files, not in git
GAMES = os.path.join(HERE, '..', 'CompleteGames')                    # one folder of player<id>-turn<n>.trn files per game
PLUGIN = os.path.join(HERE, '..', 'EnemyShips.js')

def data_path(name):
    os.makedirs(DATA, exist_ok=True)
    return os.path.join(DATA, name)

def load(name):
    with open(data_path(name)) as f:
        return json.load(f)

def true_builds(r):
    """new warships at turn t that match a starbase build order of turn t-1 (excludes captures, gifts and unfilled orders)"""
    if 'prevorders' not in r:
        return None
    orders = collections.Counter((o['hullid'], o['engineid'], o['beamid'] if o['beams'] else 0, o['beams'], o['torpedoid'] if o['torps'] else 0, o['torps'])
                                 for o in r['prevorders'] if o['warship'])
    built = []
    for b in r['new']:
        if not b['warship']:
            continue
        key = (b['hullid'], b['engineid'], b['beamid'] if b['beams'] else 0, b['beams'], b['torpedoid'] if b['torps'] else 0, b['torps'])
        if orders[key] > 0:
            orders[key] -= 1
            built.append(b)
    return built

def q(L, p):
    L = sorted(L)
    return L[int(p * (len(L) - 1))]
