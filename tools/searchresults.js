// The plugin's search alone (RANKER=0) on every build turn before the ship limit, per turn, for gpucheck.py: data/gpu_js.json.
// Usage: RANKER=0 node searchresults.js [overrides json]
const fs = require('fs');
const path = require('path');
const pool = require('./pool.js')();
const core = require('./evalcore.js')(true);
(async () => {
  const idx = core.C.cases.map((c, i) => i).filter(i => core.phaseOf(core.C.cases[i]) != 'afterCap');
  const R = await pool.evaluate(process.argv[2] ? JSON.parse(process.argv[2]) : {}, idx);
  const out = {}; for (const r of R) out[r.i] = [r.top1, r.hit, r.full, r.shipHit, r.rank];
  fs.writeFileSync(path.join(__dirname, 'data', 'gpu_js.json'), JSON.stringify(out));
  console.log(R.length, 'turns');
  pool.close();
})();
