"""The plugin's build search (getBuildPriors and estimateBuilds, ranked by the search alone as with RANKER=0)
on the graphics card with PyTorch, for many build turns at once, from what gpuexport.js wrote. Used by gputune.py; gpucheck.py
checks it against the plugin. Settings are a dict like data/gpu_settings.json (estimatePhases, estimateFitEdges, ...).

    from gpusearch import Search
    S = Search()                        # loads data/gpu_cases.json to the graphics card
    R = S.evaluate(settings, cases)     # cases: indices into S.cases (default all); R: dict of numpy arrays per case
"""
import json, math, collections
import numpy as np
import torch
from common import data_path

PARAMS = ['hullSlope', 'beamSlope', 'torpedoSlope', 'bestEngine', 'cheapEngine', 'seenWeight', 'focusWeight', 'focusOutfit', 'outfitWeight', 'fitWeight']
STAGES = ['opening', 'early', 'nearCap', 'afterCap']
NE, NB, NT = 4, 4, 3            # engines, beams and torpedoes estimateBuilds tries on every hull
GRID = NE * NB * NT
BUDGET = 3e7                    # most search candidates (sets x options) held at once
INF = float('inf')

def load_settings():
    return json.load(open(data_path('gpu_settings.json')))

def apply_overrides(settings, overrides):
    """settings with overrides applied as pool.js does: estimatePhases merged per phase, anything else replaced"""
    S = json.loads(json.dumps(settings))
    for k, v in overrides.items():
        if k == 'estimatePhases':
            for p, vals in v.items():
                S[k][p].update(vals)
        else:
            S[k] = v
    return S

class Batch:
    """build turns with the same number of ships, padded to the same number of hulls, as tensors"""
    pass

class Search:
    def __init__(self, device='cuda', dtype=torch.float64):
        self.dev, self.dt = torch.device(device), dtype
        d = json.load(open(data_path('gpu_cases.json')))
        self.cases = d['cases']
        self.tables = d['tables']
        self.games = sorted(self.tables)
        self.stage = np.array([STAGES.index(c['stage']) if c['stage'] in STAGES else -1 for c in self.cases])
        self.stage_eval = np.array([c['stageEval'] for c in self.cases])
        self.game = np.array([c['game'] for c in self.cases])
        self.batches = {}
        g = torch.Generator().manual_seed(12345)
        self.R = (torch.randint(1, 2 ** 62, (64,), generator=g) | 1).to(self.dev)      # multipliers of the set hashes

    # ---- tensors of a list of cases --------------------------------------------------------------------------------------------
    def _tables(self, cases):
        """component tables per case (sorted by id as Object.keys orders them): id, tech, value, valid; and best/cheap positions"""
        out = {}
        for name, key in (('E', 'engines'), ('B', 'beams'), ('T', 'torpedos')):
            m = max(len(self.tables[c['game']][key]) for c in cases)
            ids = np.zeros((len(cases), m), np.int64); tech = np.zeros((len(cases), m)); val = np.zeros((len(cases), m)); ok = np.zeros((len(cases), m), bool)
            for n, c in enumerate(cases):
                L = self.tables[c['game']][key]
                ids[n, :len(L)] = [x[0] for x in L]; tech[n, :len(L)] = [x[1] for x in L]; val[n, :len(L)] = [x[2] for x in L]; ok[n, :len(L)] = True
            out[name] = (ids, tech, val, ok)
        pos = lambda c, key, tid: [x[0] for x in self.tables[c['game']][key]].index(self.tables[c['game']][tid])
        out['bestE'] = np.array([pos(c, 'engines', 'bestEngine') for c in cases])
        out['cheapE'] = np.array([pos(c, 'engines', 'cheapEngine') for c in cases])
        out['bestB'] = np.array([pos(c, 'beams', 'bestBeam') for c in cases])
        out['bestT'] = np.array([pos(c, 'torpedos', 'bestTorpedo') for c in cases])
        return out

    def _batch(self, idx):
        cases = [self.cases[i] for i in idx]
        N, H = len(cases), max(1, max(len(c['hulls']) for c in cases))
        K = cases[0]['count']
        F = max(1, max((len(h[8]) for c in cases for h in c['hulls']), default=1))
        T = self._tables(cases)
        hid = np.zeros((N, H), np.int64); hA = np.zeros((N, H)); hF = np.zeros((N, H)); hrank = np.zeros((N, H)); hval = np.zeros((N, H))
        heng = np.zeros((N, H)); hbeam = np.zeros((N, H)); hlaun = np.zeros((N, H)); hok = np.zeros((N, H), bool)
        fo = {k: np.zeros((N, H, F), np.int64) for k in ('e', 'b', 't', 'eid', 'bid', 'tid')}
        fshare = np.zeros((N, H, F)); fok = np.zeros((N, H, F), bool)
        seen = {k: np.zeros((N, T[k][0].shape[1])) for k in 'EBT'}
        target = np.zeros(N); TL = max(K, max(len(c['truth']) for c in cases)); truth = np.zeros((N, TL), np.int64); tsorted = np.zeros(N, bool); tlen = np.zeros(N)
        full = np.zeros((N, K), np.int64); fullok = np.zeros(N, bool)
        for n, c in enumerate(cases):
            ids = {k: list(T[k][0][n]) for k in 'EBT'}
            for h, row in enumerate(c['hulls']):
                hid[n, h], hA[n, h], hF[n, h], hrank[n, h], hval[n, h], heng[n, h], hbeam[n, h], hlaun[n, h] = row[:8]
                hok[n, h] = True
                for f, (e, b, t, s) in enumerate(row[8]):
                    fo['e'][n, h, f] = ids['E'].index(e); fo['b'][n, h, f] = ids['B'].index(b) if b else -1; fo['t'][n, h, f] = ids['T'].index(t) if t else -1
                    fo['eid'][n, h, f], fo['bid'][n, h, f], fo['tid'][n, h, f] = e, b, t
                    fshare[n, h, f] = s; fok[n, h, f] = True
            for k, key in (('E', 'seenE'), ('B', 'seenB'), ('T', 'seenT')):
                for sid, cnt in c[key].items():
                    seen[k][n, ids[k].index(int(sid))] = cnt
            target[n] = c['target']
            tr = c['truth']
            tlen[n] = len(tr)
            tsorted[n] = len(tr) == K and tr == sorted(tr)
            truth[n, :len(tr)] = tr
            if len(c['full']) == K:
                full[n] = [self._key(*x) for x in c['full']]; fullok[n] = True
        t = lambda a, dt=None: torch.as_tensor(a, device=self.dev, dtype=dt if dt is not None else (self.dt if a.dtype == np.float64 else None))
        B = Batch()
        B.idx, B.N, B.H, B.K, B.F = np.array(idx), N, H, K, F
        B.hid, B.hA, B.hF, B.hrank, B.hval, B.heng, B.hbeam, B.hlaun, B.hok = map(t, (hid, hA, hF, hrank, hval, heng, hbeam, hlaun, hok))
        B.fo = {k: t(v) for k, v in fo.items()}; B.fshare, B.fok = t(fshare), t(fok)
        B.tab = {k: tuple(t(a) for a in T[k]) for k in 'EBT'}
        B.bestE, B.cheapE, B.bestB, B.bestT = (t(T[k]) for k in ('bestE', 'cheapE', 'bestB', 'bestT'))
        B.seen = {k: t(v) for k, v in seen.items()}
        B.target, B.tlen = t(target), t(tlen)
        B.truth = t(truth)
        B.thash = self._hash(torch.sort(B.truth[:, :K], dim=1).values)
        B.tsorted = t(tsorted)
        B.fhash = self._hash(torch.sort(t(full), dim=1).values); B.fullok = t(fullok)
        B.stage = t(self.stage[idx])
        return B

    @staticmethod
    def _key(h, e, b, t):
        return ((h * 1000 + e) * 1000 + b) * 1000 + t

    def _hash(self, x):
        """hash of each row of sorted int64 values (the last dimension)"""
        return (x * self.R[:x.shape[-1]]).sum(-1)

    def batches_of(self, idx, name=None):
        """the cases grouped by number of ships, sorted by hulls and cut to fit BUDGET; cached under name"""
        if name is not None and name in self.batches:
            return self.batches[name]
        W = 200
        groups = collections.defaultdict(list)
        for i in idx:
            groups[self.cases[i]['count']].append(i)
        out = []
        for K, L in sorted(groups.items()):
            L.sort(key=lambda i: len(self.cases[i]['hulls']))
            at = 0
            while at < len(L):
                n = 0
                while at + n < len(L):
                    O = len(self.cases[L[at + n]]['hulls']) * (GRID + 4)
                    if ((n + 1) * O * (1 if K == 1 else W) > BUDGET or n >= 4096) and n > 0:
                        break
                    n += 1
                out.append(self._batch(L[at:at + n]))
                at += n
        if name is not None:
            self.batches[name] = out
        return out

    # ---- settings per case -----------------------------------------------------------------------------------------------------
    def _settings(self, B, S):
        """the search settings of each case: estimatePhases of its phase of the game"""
        P = {p: torch.tensor([S['estimatePhases'][s][p] for s in STAGES], device=self.dev, dtype=self.dt)[B.stage] for p in PARAMS}
        P['fit'] = torch.tensor([S['estimatePhases'][s]['fit'] for s in STAGES], device=self.dev, dtype=self.dt)[B.stage]
        return P

    # ---- the search ------------------------------------------------------------------------------------------------------------
    def _options(self, B, P):
        """every ship option of each case in estimateBuilds order: value, logp, hull id and full key, valid"""
        N, H = B.N, B.H
        # hull likelihoods (getBuildPriors)
        w = (B.hA + P['focusWeight'][:, None] * B.hF) * torch.exp(P['hullSlope'][:, None] * (B.hrank - 0.5))
        w = torch.where(B.hok, w, torch.zeros_like(w))
        hullP = w / w.sum(1, keepdim=True)
        # components: weights, then the likeliest few (stable, ties by id)
        def comp(k, slope, extra, n):
            ids, tech, val, ok = B.tab[k]
            L = ok.sum(1, keepdim=True).to(self.dt)
            seen = B.seen[k]; tot = seen.sum(1, keepdim=True)
            term = torch.where(tot > 0, P['seenWeight'][:, None] * L * seen / torch.where(tot > 0, tot, torch.ones_like(tot)), torch.zeros_like(seen))
            wc = (1 + extra + term) * torch.exp(slope[:, None] * (tech - 5.5) / 9)
            wc = torch.where(ok, wc, torch.zeros_like(wc))
            p = wc / wc.sum(1, keepdim=True)
            order = torch.sort(torch.where(ok, -p, torch.full_like(p, INF)), dim=1, stable=True).indices[:, :n]
            return order, torch.gather(p, 1, order), torch.gather(ids, 1, order), torch.gather(val, 1, order)
        rows = torch.arange(N, device=self.dev)
        extraE = torch.zeros_like(B.tab['E'][1])
        extraE[rows, B.bestE] = P['bestEngine']
        extraE[rows, B.cheapE] = P['cheapEngine']
        extraB = torch.zeros_like(B.tab['B'][1]); extraB[rows, B.bestB] = 1
        extraT = torch.zeros_like(B.tab['T'][1]); extraT[rows, B.bestT] = 1
        zero = torch.zeros(N, device=self.dev, dtype=self.dt)
        _, pE, idE, vE = comp('E', zero, extraE, NE)
        _, pB, idB, vB = comp('B', P['beamSlope'], extraB, NB)
        _, pT, idT, vT = comp('T', P['torpedoSlope'], extraT, NT)
        hasB = B.hbeam > 0; hasT = B.hlaun > 0
        fs = torch.where(B.fok.any(2), P['focusOutfit'][:, None], torch.zeros_like(hullP))           # [N,H]
        # grid options, in the engine, beam, torpedo loop order
        ei = torch.arange(NE, device=self.dev).repeat_interleave(NB * NT)
        bi = torch.arange(NB, device=self.dev).repeat_interleave(NT).repeat(NE)
        ti = torch.arange(NT, device=self.dev).repeat(NE * NB)
        gE = lambda a: a[:, None, ei]
        pb = torch.where(hasB[:, :, None], pB[:, None, bi], torch.ones(1, device=self.dev, dtype=self.dt))
        pt = torch.where(hasT[:, :, None], pT[:, None, ti], torch.ones(1, device=self.dev, dtype=self.dt))
        gp = (hullP * (1 - fs))[:, :, None] * gE(pE) * pb * pt
        gok = B.hok[:, :, None] & (hasB[:, :, None] | (bi == 0)) & (hasT[:, :, None] | (ti == 0))
        geid = gE(idE).expand(N, H, GRID)
        gbid = torch.where(hasB[:, :, None], idB[:, None, bi], torch.zeros(1, device=self.dev, dtype=torch.int64))
        gtid = torch.where(hasT[:, :, None], idT[:, None, ti], torch.zeros(1, device=self.dev, dtype=torch.int64))
        gval = B.hval[:, :, None] + B.heng[:, :, None] * gE(vE) + B.hbeam[:, :, None] * torch.where(hasB[:, :, None], vB[:, None, bi], torch.zeros(1, device=self.dev, dtype=self.dt)) \
            + B.hlaun[:, :, None] * torch.where(hasT[:, :, None], vT[:, None, ti], torch.zeros(1, device=self.dev, dtype=self.dt))
        # the race's usual outfits on the hull, first
        fp = (hullP * fs)[:, :, None] * B.fshare
        ids, tech, vEt, okE = B.tab['E']; vBt = B.tab['B'][2]; vTt = B.tab['T'][2]
        tv = lambda tab, pos: torch.where(pos >= 0, torch.gather(tab, 1, pos.clamp(min=0).reshape(N, -1)).reshape(pos.shape), torch.zeros(1, device=self.dev, dtype=self.dt))
        fval = B.hval[:, :, None] + B.heng[:, :, None] * tv(vEt, B.fo['e']) + B.hbeam[:, :, None] * tv(vBt, B.fo['b']) + B.hlaun[:, :, None] * tv(vTt, B.fo['t'])
        # a grid option that is a usual outfit adds its likelihood to it
        match = gok[:, :, :, None] & B.fok[:, :, None, :] & (geid[:, :, :, None] == B.fo['eid'][:, :, None, :]) & \
            (gbid[:, :, :, None] == B.fo['bid'][:, :, None, :]) & (gtid[:, :, :, None] == B.fo['tid'][:, :, None, :])
        fp = fp + (match * gp[:, :, :, None]).sum(2)
        gok = gok & ~match.any(3)
        p = torch.cat([fp, gp], 2); ok = torch.cat([B.fok, gok], 2); val = torch.cat([fval, gval], 2)
        eid = torch.cat([B.fo['eid'], geid], 2); bid = torch.cat([B.fo['bid'], gbid], 2); tid = torch.cat([B.fo['tid'], gtid], 2)
        best = torch.where(ok, p, torch.zeros_like(p)).max(2, keepdim=True).values
        logp = torch.log(hullP)[:, :, None] + P['outfitWeight'][:, None, None] * torch.log(p / best)
        ok = ok & torch.isfinite(logp) & B.hok[:, :, None]
        # hulls likeliest first (stable, ties by id)
        order = torch.sort(torch.where(B.hok, -hullP, torch.full_like(hullP, INF)), dim=1, stable=True).indices
        g = lambda a: torch.gather(a, 1, order[:, :, None].expand(-1, -1, a.shape[2])).reshape(N, -1)
        hidx = B.hid[:, :, None].expand(-1, -1, p.shape[2])
        return dict(value=g(val), logp=g(torch.where(ok, logp, torch.zeros_like(logp))), ok=g(ok), hull=g(hidx),
                    key=g(self._key(hidx, eid, bid, tid)))

    def _penalty(self, B, P, value):
        """fitPenalty of a value against each case's military change: value [N, ...]"""
        S = self.settings
        edges = torch.tensor(S['estimateFitEdges'], device=self.dev, dtype=self.dt)
        dens = torch.maximum(torch.tensor(S['estimateFitFloor'], device=self.dev, dtype=self.dt), P['fit'] / (edges[1:] - edges[:-1]))
        logd = torch.cat([torch.log(dens), torch.full((B.N, 1), math.log(S['estimateFitFloor']), device=self.dev, dtype=self.dt)], 1)
        shape = value.shape
        x = (value / B.target.reshape((-1,) + (1,) * (value.dim() - 1))).reshape(B.N, -1)
        i = torch.bucketize(x, edges, right=True) - 1               # edges[i] <= x < edges[i+1]
        i = torch.where((i < 0) | (i >= len(edges) - 1) | torch.isnan(x), torch.full_like(i, logd.shape[1] - 1), i)
        return (-P['fitWeight'][:, None] * torch.gather(logd, 1, i)).reshape(shape)

    def _search(self, B, S):
        self.settings = S
        P = self._settings(B, S)
        opt = self._options(B, P)
        N, K, O = B.N, B.K, opt['value'].shape[1]
        W = S['estimateSearchWidth']
        dev, dt = self.dev, self.dt
        value = torch.zeros(N, 1, device=dev, dtype=dt); logp = torch.zeros_like(value)
        last = torch.zeros(N, 1, device=dev, dtype=torch.int64); ok = torch.ones(N, 1, device=dev, dtype=torch.bool)
        picks = torch.zeros(N, 1, 0, device=dev, dtype=torch.int64)
        limit = (B.target * S['estimateMaxOver'])[:, None, None]
        oi = torch.arange(O, device=dev)
        for k in range(K):
            cv = value[:, :, None] + opt['value'][:, None, :]
            cl = logp[:, :, None] + opt['logp'][:, None, :]
            cok = ok[:, :, None] & opt['ok'][:, None, :] & (oi[None, None, :] >= last[:, :, None]) & ~(cv > limit)
            score = self._penalty(B, P, cv * K / (k + 1)) - cl * K / (k + 1)
            score = torch.where(cok, score, torch.full_like(score, INF)).reshape(N, -1)
            n = min(W, score.shape[1])
            top = torch.topk(score, n, dim=1, largest=False).indices
            # the order JavaScript's stable sort gives: by score, ties in the order the sets were made
            top = torch.sort(top, dim=1).values
            top = torch.gather(top, 1, torch.sort(torch.gather(score, 1, top), dim=1, stable=True).indices)
            sc = torch.gather(score, 1, top)
            parent, o = top // O, top % O
            value = torch.gather(cv.reshape(N, -1), 1, top); logp = torch.gather(cl.reshape(N, -1), 1, top)
            ok = torch.isfinite(sc); last = o
            picks = torch.cat([torch.gather(picks, 1, parent[:, :, None].expand(-1, -1, picks.shape[2])), o[:, :, None]], 2)
        final = self._penalty(B, P, value) - logp
        final = torch.where(ok, final, torch.full_like(final, INF))
        order = torch.sort(final, dim=1, stable=True).indices
        ok = torch.gather(ok, 1, order); picks = torch.gather(picks, 1, order[:, :, None].expand(-1, -1, K))
        return opt, ok, picks

    def _score(self, B, S, opt, ok, picks):
        N, K, W = B.N, B.K, picks.shape[1]
        hulls = torch.gather(opt['hull'], 1, picks.reshape(N, -1)).reshape(N, W, K)
        keys = torch.gather(opt['key'], 1, picks.reshape(N, -1)).reshape(N, W, K)
        hulls = torch.sort(hulls, dim=2).values
        hh = self._hash(hulls); kh = self._hash(torch.sort(keys, dim=2).values)
        # first set of each hull combination, best first, up to estimateResults
        same = (hh[:, :, None] == hh[:, None, :]) & ok[:, None, :] & torch.ones(W, W, device=self.dev, dtype=torch.bool).tril(-1)
        first = ok & ~same.any(2)
        ranked = first & (torch.cumsum(first.to(torch.int64), 1) <= S['estimateResults'])
        top1 = ranked[:, 0] & B.tsorted & (hh[:, 0] == B.thash)
        hit = (ranked & B.tsorted[:, None] & (hh == B.thash[:, None])).any(1)
        full = (ranked & B.fullok[:, None] & (kh == B.fhash[:, None])).any(1)
        # ships right in the top set: truth hulls found in it, each used once
        T, A = B.truth, hulls[:, 0, :]
        L = T.shape[1]
        occ = ((T[:, :, None] == T[:, None, :]) & torch.ones(L, L, device=self.dev, dtype=torch.bool).tril(-1)).sum(2)
        cnt = (T[:, :, None] == A[:, None, :]).sum(2)
        cnt = torch.where(T > 0, cnt, torch.zeros_like(cnt))
        ship = torch.where(ok[:, 0], (occ < cnt).sum(1) / B.tlen, torch.zeros(N, device=self.dev, dtype=self.dt))
        return top1, hit, full, ship

    def evaluate(self, S, idx=None, name=None):
        """top1, hit, full, shipHit (numpy, per case of idx, in idx order) of the search with settings S"""
        idx = list(range(len(self.cases))) if idx is None else list(idx)
        at = {i: n for n, i in enumerate(idx)}
        out = {k: np.zeros(len(idx)) for k in ('top1', 'hit', 'full', 'shipHit')}
        with torch.no_grad():
            for B in self.batches_of(idx, name):
                opt, ok, picks = self._search(B, S)
                r = self._score(B, S, opt, ok, picks)
                pos = [at[i] for i in B.idx]
                for k, v in zip(('top1', 'hit', 'full', 'shipHit'), r):
                    out[k][pos] = v.double().cpu().numpy()
        out['game'] = self.game[idx]
        return out

def objective(R):
    return R['top1'] + R['shipHit'] + 0.5 * R['hit'] + 0.25 * R['full']
