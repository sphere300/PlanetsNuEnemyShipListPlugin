// Accuracy of one phase by number of ships built and by race, saved to reports/breakdown_<phase>.tsv. Usage: node breakdown.js <opening|early|nearCap> [overrides json]
const makePool = require('./pool.js');
const writeTsv = require('./tsv.js');
const core = require('./evalcore.js')(true);
const ph = process.argv[2]; const ov = process.argv[3] ? JSON.parse(process.argv[3]) : {};
const idx = core.C.cases.map((c, i) => i).filter(i => core.phaseOf(core.C.cases[i]) == ph);
const pool = makePool();
pool.evaluate(ov, idx).then(R => {
  const G = {};
  R.forEach((r, j) => { const c = core.C.cases[idx[j]]; for (const k of ['count=' + Math.min(c.count, 4) + (c.clean ? ' clean' : ' unclean'), 'race ' + c.race]) { const g = G[k] = G[k] || { n: 0, top1: 0, ship: 0, hit: 0 }; g.n++; g.top1 += r.top1; g.ship += r.shipHit; g.hit += r.hit; } });
  const top = ov.estimateResults || core.plugin.estimateResults;
  for (const k of Object.keys(G).sort()) { const g = G[k]; console.log(k.padEnd(18), String(g.n).padStart(4), 'top1', (100 * g.top1 / g.n).toFixed(0).padStart(3) + '%', 'ships', (100 * g.ship / g.n).toFixed(0).padStart(3) + '%', 'top' + top, (100 * g.hit / g.n).toFixed(0).padStart(3) + '%'); }
  writeTsv('breakdown_' + ph, [core.phaseLabel(ph) + ' group', 'turns', 'top1 %', 'ships right in top1 %', `hulls in top${top} %`], Object.keys(G).sort().map(k => { const g = G[k]; return [k, g.n, +(100 * g.top1 / g.n).toFixed(1), +(100 * g.ship / g.n).toFixed(1), +(100 * g.hit / g.n).toFixed(1)]; }));
  pool.close();
});
