// Accuracy of the estimator on the build turns before the ship limit, with focus tables learned without the tested game.
// Saves reports/report.tsv. Without overrides it also prints the model version and, if it changed, the estimateAccuracy line
// to copy into EnemyShips.js, and adds the evaluation to model_history.tsv (in git) with the notes given.
// Usage: node report.js [overrides json] [--notes "what changed in the model"]
//   e.g. node report.js '{"estimatePhases":{"early":{"focusWeight":10}}}'
const fs = require('fs');
const path = require('path');
const makePool = require('./pool.js');
const writeTsv = require('./tsv.js');
const core = require('./evalcore.js')(true);
const args = process.argv.slice(2);
const notesAt = args.indexOf('--notes');
const notes = notesAt >= 0 ? args.splice(notesAt, 2)[1] || '' : '';
const overrides = args[0] ? JSON.parse(args[0]) : {};
const idx = core.C.cases.map((c, i) => i).filter(i => core.phaseOf(core.C.cases[i]) != 'afterCap');
const top = overrides.estimateResults || core.plugin.estimateResults;
// the hash before any evaluation, which swaps in the focus tables learned without each game
const model = core.plugin.getModelVersion();
const HISTORY = path.join(__dirname, 'model_history.tsv');
const PHASES = ['opening', 'early', 'nearCap'];	// columns of model_history.tsv, after the first six
const METRICS = ['loadout', 'top1', 'listed'];
const pool = makePool();
const t0 = Date.now();
pool.evaluate(overrides, idx).then(R => {
  const groups = {};
  const add = (k, r) => { const g = groups[k] = groups[k] || { n: 0, top1: 0, hit: 0, full: 0, shipHit: 0, close: 0 }; g.n++; for (const m of ['top1', 'hit', 'full', 'shipHit', 'close']) g[m] += r[m]; };
  for (const r of R) { add('all', r); add(r.phase, r); if (r.clean) add('clean', r); add(r.seen ? 'seen' : 'unseen', r); add(r.game, r); }
  const pct = (a, n) => +(100 * a / n).toFixed(1);
  const pad = (a, n) => (pct(a, n).toFixed(1) + '%').padStart(6);
  const keys = ['all', 'opening', 'early', 'nearCap', 'clean', 'seen', 'unseen', ...Object.keys(groups).filter(k => k.startsWith('game')).sort()].filter(k => groups[k]);
  console.log(`${'group'.padEnd(34)} turns   top1  ships right in top1  hulls in top${top}  full config  in closest`);
  for (const k of keys) { const g = groups[k]; console.log(`${core.phaseLabel(k).padEnd(34)} ${String(g.n).padStart(5)}  ${pad(g.top1, g.n)}      ${pad(g.shipHit, g.n)}        ${pad(g.hit, g.n)}      ${pad(g.full, g.n)}     ${pad(g.close, g.n)}`); }
  writeTsv('report', ['group', 'turns', 'top1 %', 'ships right in top1 %', `hulls in top${top} %`, `full config in top${top} %`, 'in closest %'],
    keys.map(k => { const g = groups[k]; return [core.phaseLabel(k), g.n, pct(g.top1, g.n), pct(g.shipHit, g.n), pct(g.hit, g.n), pct(g.full, g.n), pct(g.close, g.n)]; }));
  // the accuracy table shown in the plugin; the version goes up when the model hash differs from the stored one
  if (!args[0]) {
    const stored = core.plugin.estimateAccuracy;
    const phases = {};
    for (const k of ['all', ...PHASES]) { const g = groups[k]; phases[k] = { turns: g.n, loadout: pct(g.full, g.n), top1: pct(g.top1, g.n), listed: pct(g.hit, g.n) }; }
    const accuracy = { version: stored ? stored.version + (stored.model != model ? 1 : 0) : 1, model, date: new Date().toISOString().slice(0, 10),
      games: keys.filter(k => k.startsWith('game')).length, phases };
    console.log(`model ${model}${stored && stored.model == model ? ' (as stored)' : ', copy into EnemyShips.js:'}`);
    if (!stored || stored.model != model) console.log('\t\testimateAccuracy: ' + JSON.stringify(accuracy) + ',');
    // one row per evaluation of the model, with the change against the row before
    if (!fs.existsSync(HISTORY))
      fs.writeFileSync(HISTORY, ['version', 'model id', 'date', 'games', 'turns', 'top results', ...PHASES.flatMap(p => METRICS.map(m => `${core.phaseLabel(p)} ${m} %`)), 'notes'].join('\t') + '\n');
    const rows = fs.readFileSync(HISTORY, 'utf8').trim().split('\n');
    const header = rows[0].split('\t'), last = rows.length > 1 ? rows[rows.length - 1].split('\t') : null;
    const values = PHASES.flatMap(p => METRICS.map(m => phases[p][m]));
    if (last) {
      const before = values.map((v, i) => +last[6 + i]);
      const changes = values.map((v, i) => v - before[i]).map((d, i) => d ? `${header[6 + i]} ${d > 0 ? '+' : ''}${d.toFixed(1)}` : '').filter(x => x);
      console.log(`against version ${last[0]} (${last[1]}): ${changes.length ? changes.join(', ') : 'no change'}`);
    }
    const row = [accuracy.version, model, accuracy.date, accuracy.games, phases.all.turns, top, ...values, notes.replace(/[\t\r\n]+/g, ' ')];
    // the same model measured the same way again is only added with notes
    if (last && !notes && last.slice(1, 2).concat(last.slice(3, 6 + values.length)).join('\t') == [model, ...row.slice(3, 6 + values.length)].join('\t'))
      console.log('model_history.tsv: same as the last row, not added (give --notes to add it anyway)');
    else {
      fs.appendFileSync(HISTORY, row.join('\t') + '\n');
      console.log(`model_history.tsv: added version ${accuracy.version} (${model})` + (notes ? '' : ' without notes; fill in the notes column'));
    }
  }
  console.log(((Date.now() - t0) / 1000).toFixed(0) + 's');
  pool.close();
});
