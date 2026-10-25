// Coordinate descent on each pre-cap phase's parameters over all games (focus tables learned without the tested game).
// A change is kept if it raises the score and improves at least as many games as it worsens.
// Prints the best values per phase; copy them into estimatePhases in EnemyShips.js.
// Usage: node tune.js [phases, comma separated, default opening,early,nearCap] [start overrides json]
const makePool = require('./pool.js');
const core = require('./evalcore.js')(true);
const phases = (process.argv[2] || 'opening,early,nearCap').split(',');
const start = process.argv[3] ? JSON.parse(process.argv[3]) : { estimatePhases: {} };
const pool = makePool();
const obj = (R) => R.reduce((a, r) => a + r.top1 + r.shipHit + 0.5 * r.hit + 0.25 * r.full, 0) / R.length;
const byGame = (R) => { const g = {}; for (const r of R) (g[r.game] = g[r.game] || []).push(r); const o = {}; for (const k in g) o[k] = obj(g[k]); return o; };
const fmt = (R) => { const m = k => (100 * R.reduce((a, r) => a + r[k], 0) / R.length).toFixed(1); return `top1 ${m('top1')} ships ${m('shipHit')} top8 ${m('hit')} full ${m('full')}`; };
const grid = { outfitWeight: [0, 0.25, 0.5, 1, 1.5], focusWeight: [0, 5, 10, 20, 40, 80, 160], focusOutfit: [0, 0.25, 0.5, 0.75, 0.9], fitWeight: [0.25, 0.5, 0.75, 1, 1.5, 2, 3],
  seenWeight: [0, 0.5, 1, 3, 8], hullSlope: [-2, -1, 0, 1, 2], beamSlope: [-3, -2, -1, 0, 1], torpedoSlope: [-3, -2, -1, 0, 1, 2], bestEngine: [0, 2, 4, 8], cheapEngine: [0, 1, 3, 6] };
(async () => {
  for (const phase of phases) {
    const idx = core.C.cases.map((c, i) => i).filter(i => core.phaseOf(core.C.cases[i]) == phase);
    const P = Object.assign({}, core.plugin.estimatePhases[phase], start.estimatePhases[phase] || {});
    delete P.name; delete P.fit;
    const ov = () => ({ estimatePhases: { [phase]: P } });
    let R = await pool.evaluate(ov(), idx), best = obj(R), bestG = byGame(R);
    console.log(phase, idx.length, 'start', best.toFixed(4), fmt(R));
    for (let round = 0; round < 3; round++) {
      let changed = false;
      for (const k in grid) for (const v of grid[k]) {
        if (v == P[k]) continue;
        const old = P[k]; P[k] = v;
        const R2 = await pool.evaluate(ov(), idx), o = obj(R2), g = byGame(R2);
        let up = 0, down = 0; for (const x in g) { if (g[x] > bestG[x] + 1e-9) up++; else if (g[x] < bestG[x] - 1e-9) down++; }
        if (o > best + 1e-9 && up >= down) { best = o; bestG = g; changed = true; console.log('  ', k, '=', v, o.toFixed(4), fmt(R2), `games +${up} -${down}`); } else P[k] = old;
      }
      if (!changed) break;
    }
    console.log('BEST', phase, JSON.stringify(P));
  }
  pool.close();
})();
