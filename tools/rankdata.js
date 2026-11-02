// Candidate sets of the search for every build turn before the ship limit, for rank.py to learn from: for each set the labels
// and the plugin's own features (getBuildFeatures), with focus tables learned without the tested game.
// Writes data/rank.json (columns, games) and data/rank_<worker>.bin (rows of doubles). Usage: node rankdata.js
const fs = require('fs');
const path = require('path');
const makePool = require('./pool.js');
const core = require('./evalcore.js')(true);
const idx = core.C.cases.map((c, i) => i).filter(i => core.phaseOf(core.C.cases[i]) != 'afterCap');
const pool = makePool();
const t0 = Date.now();
const DATA = path.join(__dirname, 'data');
for (const f of fs.readdirSync(DATA)) if (/^rank_\d+\.bin$/.test(f)) fs.unlinkSync(path.join(DATA, f));
pool.dump(idx, path.join(DATA, 'rank_')).then(R => {
  const plugin = core.plugin;
  fs.writeFileSync(path.join(DATA, 'rank.json'), JSON.stringify({ columns: core.rankColumns, features: plugin.estimateRankerFeatures.concat(plugin.estimateOptionStats),
    games: core.games, phases: core.phases, shards: R.map(r => r.file), cases: idx.length }));
  const rows = R.reduce((a, r) => a + r.rows, 0), turns = R.reduce((a, r) => a + r.turns, 0), found = R.reduce((a, r) => a + r.found, 0);
  console.log(`${idx.length} cases, ${turns} with sets, ${rows} sets; hulls built among the kept sets in ${found} (${(100 * found / idx.length).toFixed(1)}%); ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  pool.close();
});
