// Accuracy of the estimator on the build turns before the ship limit, with focus tables learned without the tested game.
// Usage: node report.js [overrides json], e.g. '{"estimatePhases":{"early":{"focusWeight":10}}}'
const makePool = require('./pool.js');
const core = require('./evalcore.js')(true);
const overrides = process.argv[2] ? JSON.parse(process.argv[2]) : {};
const idx = core.C.cases.map((c, i) => i).filter(i => core.phaseOf(core.C.cases[i]) != 'afterCap');
const pool = makePool();
const t0 = Date.now();
pool.evaluate(overrides, idx).then(R => {
  const groups = {};
  const add = (k, r) => { const g = groups[k] = groups[k] || { n: 0, top1: 0, hit: 0, full: 0, shipHit: 0, close: 0 }; g.n++; for (const m of ['top1', 'hit', 'full', 'shipHit', 'close']) g[m] += r[m]; };
  for (const r of R) { add('all', r); add(r.phase, r); if (r.clean) add('clean', r); add(r.game, r); }
  const pct = (a, n) => (100 * a / n).toFixed(1).padStart(5) + '%';
  console.log('group        turns   top1  ships right in top1  hulls in top8  full config  in closest');
  for (const k of ['all', 'opening', 'early', 'nearCap', 'clean', ...Object.keys(groups).filter(k => k.startsWith('game')).sort()])
    if (groups[k]) { const g = groups[k]; console.log(`${k.padEnd(12)} ${String(g.n).padStart(5)}  ${pct(g.top1, g.n)}      ${pct(g.shipHit, g.n)}        ${pct(g.hit, g.n)}       ${pct(g.full, g.n)}     ${pct(g.close, g.n)}`); }
  console.log(((Date.now() - t0) / 1000).toFixed(0) + 's');
  pool.close();
});
