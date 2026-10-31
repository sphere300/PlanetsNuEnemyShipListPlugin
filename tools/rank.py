"""Learn the ranker of the Build Predictor (LightGBM LambdaMART) from the candidate sets of rankdata.js. Trains one model per
fold of games, so each game is scored by a model that did not see it, picks the number of trees on those held out games, then
trains the final model on all games. Writes data/ranker.json (fold of each game, fold models, final model) and reports/ranker_features.tsv.
Usage: python rank.py [folds, default 5] [lightgbm params as json]"""
import json, os, sys, time
import numpy as np
import lightgbm as lgb
from common import data_path, load, write_tsv

FOLDS = int(sys.argv[1]) if len(sys.argv) > 1 else 5
PARAMS = dict(objective='lambdarank', metric='ndcg', label_gain=[0, 1, 3], lambdarank_truncation_level=10, learning_rate=0.05, num_leaves=15,
              min_data_in_leaf=100, feature_fraction=0.7, lambda_l2=5.0, max_bin=255, verbose=-1, seed=1, num_threads=max(1, (os.cpu_count() or 2) - 1))
if len(sys.argv) > 2:
    PARAMS.update(json.loads(sys.argv[2]))
ROUNDS = [50, 100, 150, 200, 300, 400]
LISTED = 5     # estimateResults

meta = load('rank.json')
columns, features = meta['columns'], meta['features']
width = len(columns) + len(features)
X = np.concatenate([np.fromfile(data_path(f)).reshape(-1, width) for f in meta['shards']])
X = X[np.argsort(X[:, 0], kind='stable')]        # the sets of a case stay in order and together
cases, game, phase, label, hullset, shiphit = (X[:, i] for i in range(6))
F = X[:, 6:]
starts = np.flatnonzero(np.r_[True, cases[1:] != cases[:-1]])
ends = np.r_[starts[1:], len(cases)]
print('sets', len(X), 'turns', len(starts), 'of', meta['cases'], 'games', len(meta['games']))

# folds of whole games, the same on every run
order = np.random.default_rng(1).permutation(len(meta['games']))
gamefold = np.zeros(len(meta['games']), dtype=int)
gamefold[order] = np.arange(len(order)) % FOLDS

def metrics(scores):
    """the scores of report.js per phase, on the turns with sets: only the best set of each combination of hulls is listed"""
    totals = {}
    for s, e in zip(starts, ends):
        rank = s + np.argsort(-scores[s:e], kind='stable')
        listed, seen = [], set()
        for i in rank:
            h = hullset[i]
            if h not in seen:
                seen.add(h)
                listed.append(i)
                if len(listed) == LISTED:
                    break
        top = listed[0]
        r = (label[top] > 0, shiphit[top], any(label[i] > 0 for i in listed), any(label[i] == 2 for i in listed))
        for k in ('all', meta['phases'][int(phase[s])]):
            t = totals.setdefault(k, [0, 0, 0, 0, 0])
            t[0] += 1
            for j in range(4):
                t[j + 1] += r[j]
    return {k: dict(n=t[0], top1=100 * t[1] / t[0], ships=100 * t[2] / t[0], listed=100 * t[3] / t[0], loadout=100 * t[4] / t[0]) for k, t in totals.items()}

def show(name, m):
    for k in ('all', *meta['phases']):
        v = m[k]
        print('  %-10s %-8s %6d  top1 %5.1f  ships %5.1f  top%d %5.1f  loadout %5.1f' % (name, k, v['n'], v['top1'], v['ships'], LISTED, v['listed'], v['loadout']))

def objective(m):
    v = m['all']       # the objective of tune.js
    return v['top1'] + v['ships'] + 0.5 * v['listed'] + 0.25 * v['loadout']

def dataset(mask):
    """rows of the masked games, leaving out turns where the sets kept do not hold the build, which have nothing to rank"""
    keep = np.zeros(len(X), dtype=bool)
    groups = []
    for s, e in zip(starts, ends):
        if mask[s] and label[s:e].max() > 0:
            keep[s:e] = True
            groups.append(e - s)
    return lgb.Dataset(F[keep], label=label[keep], group=groups, feature_name=features, free_raw_data=False)

def export(booster, trees=None):
    """the model as the plugin holds it (getRankerScore); values rounded, so the plugin's scores are what report.js measures"""
    dump = booster.dump_model(num_iteration=trees)
    out = []
    for tree in dump['tree_info']:
        nodes, leaves = [], []
        def walk(t):
            if 'leaf_value' in t or 'split_feature' not in t:
                leaves.append(float('%.5g' % t.get('leaf_value', 0)))
                return ~(len(leaves) - 1)
            assert t['decision_type'] == '<=', t['decision_type']
            at = len(nodes) // 4
            nodes.extend([t['split_feature'], float('%.7g' % t['threshold']), 0, 0])
            nodes[at * 4 + 2] = walk(t['left_child'])
            nodes[at * 4 + 3] = walk(t['right_child'])
            return at
        walk(tree['tree_structure'])
        out.append([nodes, leaves])
    return dict(trees=out)

t0 = time.time()
base = metrics(-F[:, features.index('searchScore')])
print('score of the search alone, on the turns with sets:')
show('search', base)

boosters = []
held = {r: np.zeros(len(X)) for r in ROUNDS}
gain = np.zeros(len(features))
for fold in range(FOLDS):
    test = gamefold[game.astype(int)] == fold
    b = lgb.train(PARAMS, dataset(~test), num_boost_round=max(ROUNDS))
    boosters.append(b)
    for r in ROUNDS:
        held[r][test] = b.predict(F[test], num_iteration=r)
    gain += b.feature_importance('gain')
    print('fold', fold, 'games', int((gamefold == fold).sum()), 'turns', len(np.unique(cases[test])), '%.0fs' % (time.time() - t0), flush=True)

results = {r: metrics(held[r]) for r in ROUNDS}
for r in ROUNDS:
    print('trees', r, 'objective %.2f' % objective(results[r]), 'all top1 %.1f top%d %.1f loadout %.1f' % (results[r]['all']['top1'], LISTED, results[r]['all']['listed'], results[r]['all']['loadout']))
best = max(ROUNDS, key=lambda r: objective(results[r]))
print('held out games with %d trees (search objective %.2f, ranker %.2f):' % (best, objective(base), objective(results[best])))
show('ranker', results[best])

# games improved and worsened, tune.js's rule
g_better = g_worse = 0
def game_score(scores, g):
    hits = n = 0
    for s, e in zip(starts, ends):
        if game[s] == g:
            n += 1
            hits += label[s + int(np.argmax(scores[s:e]))] > 0
    return hits / max(1, n)
search = -F[:, features.index('searchScore')]
for g in range(len(meta['games'])):
    a, b = game_score(search, g), game_score(held[best], g)
    g_better += b > a + 1e-9
    g_worse += b < a - 1e-9
print('games by top1 against the search: better %d, worse %d' % (g_better, g_worse))

final = lgb.train(PARAMS, dataset(np.ones(len(X), dtype=bool)), num_boost_round=best)
out = dict(fold={g: int(gamefold[i]) for i, g in enumerate(meta['games'])}, models=[export(b, best) for b in boosters], final=export(final),
           params={k: v for k, v in PARAMS.items() if k != 'num_threads'}, trees=best, features=features)
with open(data_path('ranker.json'), 'w') as f:
    json.dump(out, f, separators=(',', ':'))
print('final model', len(json.dumps(out['final'], separators=(',', ':'))), 'chars')
idx = np.argsort(-gain)
write_tsv('ranker_features', ['feature', 'share of gain %'], [[features[i], round(100 * gain[i] / gain.sum(), 2)] for i in idx])
for i in idx[:15]:
    print('  %-18s %5.1f%%' % (features[i], 100 * gain[i] / gain.sum()))
print('%.0fs' % (time.time() - t0))
