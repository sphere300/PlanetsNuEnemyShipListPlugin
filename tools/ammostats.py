"""Which torpedoes players make and lay as mines in the complete games (ammo.py), next to the launchers they have (source of
estimateTorpedoUse). Usage: python ammostats.py"""
import json, os, glob, collections
from common import data_path, write_tsv

ROBOT = 9

def per_torp(raceid):
    return 4 if raceid == ROBOT else 1

def made_of(r):
    """torpedoes made per type in the turn: gained on ships and in stock, plus the ones laid as mines"""
    made = collections.Counter({int(k): v for k, v in r.get('gain', {}).items()})
    for k, u in r['laid'].items():
        if int(k) > 0:
            made[int(k)] += u / (int(k) ** 2 * per_torp(r['raceid']))
    return made

rows = []
for f in sorted(glob.glob(data_path(os.path.join('games', 'ammo_*.json')))):
    g = json.load(open(f))
    game = g['game']
    for r in g['recs']:
        if 'gain' not in r:
            continue
        rows.append((game, r))

# 1. torpedoes made by type next to launchers of that type, by rank of the type among the player's launchers (0 = best)
byrank = collections.defaultdict(lambda: [0, 0, 0])     # rank -> [launchers, torps made, turns made > 20]
bytype = collections.defaultdict(lambda: [0, 0, 0])     # torp id -> [launchers, made, laid torps]
bulk = collections.Counter()
laid_rule = collections.Counter()
for game, r in rows:
    made = made_of(r)
    types = sorted((int(k) for k in r['launch']), reverse=True)
    for k, L in r['launch'].items():
        rank = types.index(int(k))
        byrank[min(rank, 3)][0] += L[1]
        bytype[int(k)][0] += L[1]
    for k, n in made.items():
        if n <= 0 or k not in types:
            continue
        rank = types.index(k)
        byrank[min(rank, 3)][1] += n
        byrank[min(rank, 3)][2] += n > 20
        bytype[k][1] += n
        if n >= 50:
            bulk[k] += 1
    laid = {int(k): u / (int(k) ** 2 * per_torp(r['raceid'])) for k, u in r['laid'].items() if int(k) > 0}
    for k, n in laid.items():
        bytype[k][2] += n
    # rules for the type laid as mines, judged on the player's own launchers
    if laid and types:
        used = max(laid, key=laid.get)
        most = max(r['launch'], key=lambda k: r['launch'][k][0])
        loaded = max(r['launch'], key=lambda k: r['launch'][k][2])
        laid_rule['turns'] += 1
        laid_rule['best launcher type'] += used == types[0]
        laid_rule['most common launcher type (ships)'] += used == int(most)
        laid_rule['type with the most torpedoes loaded'] += used == int(loaded)

print('torpedoes made, by rank of the type among the player\'s launcher types (0 = best)')
for k in sorted(byrank):
    L = byrank[k]
    print('  rank %d: launchers %8d  torps made %9.0f  per launcher %.2f  turns making > 20: %d' % (k, L[0], L[1], L[1] / max(1, L[0]), L[2]))
print('\nby torpedo type: launchers, torps made, laid as mines, turns making 50 or more')
out = []
for k in sorted(bytype):
    L = bytype[k]
    print('  %2d: launchers %8d  made %9.0f (%.2f per launcher)  laid %8.0f  bulk turns %d' % (k, L[0], L[1], L[1] / max(1, L[0]), L[2], bulk[k]))
    out.append([k, L[0], round(L[1]), round(L[1] / max(1, L[0]), 3), round(L[2]), bulk[k]])
write_tsv('ammo_types', ['torpedo', 'launcher-turns', 'made', 'made per launcher', 'laid', 'turns making 50+'], out)
print('\ntype laid as mines (%d turns) by rule:' % laid_rule['turns'])
for k, v in laid_rule.items():
    if k != 'turns':
        print('  %-36s %5.1f%%' % (k, 100 * v / laid_rule['turns']))
