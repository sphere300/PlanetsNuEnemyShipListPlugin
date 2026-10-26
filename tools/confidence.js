// Fit the confidence shown for the listed builds (estimateListed, estimateConfidenceSpread) on the build turns before the
// ship limit, with focus tables learned without the tested game, and show how well the confidence matches the hits.
// Copy the printed lines into EnemyShips.js. Saves reports/confidence_listed.tsv and reports/confidence.tsv (calibration).
// Usage: node confidence.js
const makePool = require('./pool.js');
const writeTsv = require('./tsv.js');
const core = require('./evalcore.js')(true);
const idx = core.C.cases.map((c, i) => i).filter(i => core.phaseOf(core.C.cases[i]) != 'afterCap');
const pool = makePool();
pool.evaluate({}, idx).then(R => {
  // how often the hulls built are listed, by phase, seen and warships built (1, 2, 3+); sparse cells borrow from their phase
  const listed = {};
  for (const phase of ['opening', 'early', 'nearCap']) {
    listed[phase] = {};
    const P = R.filter(r => r.phase == phase);
    for (const seen of [1, 0]) {
      listed[phase][seen ? 'seen' : 'unseen'] = [1, 2, 3].map(n => {
        const cell = P.filter(r => r.seen == seen && Math.min(r.count, 3) == n && r.scores.length);
        const all = P.filter(r => Math.min(r.count, 3) == n && r.scores.length);
        const prior = all.reduce((a, r) => a + r.hit, 0) / all.length, k = 20;
        return +((cell.reduce((a, r) => a + r.hit, 0) + k * prior) / (cell.length + k)).toFixed(2);
      });
    }
  }
  listed.afterCap = listed.nearCap;
  // spread: the one that gives the listed build that was built the highest likelihood among the listed builds
  const logLik = (T) => {
    let ll = 0;
    for (const r of R) {
      if (r.rank < 0) continue;
      const w = r.scores.map(s => Math.exp(-(s - r.scores[0]) / T));
      ll += Math.log(w[r.rank] / w.reduce((a, b) => a + b, 0));
    }
    return ll;
  };
  let spread = 1, best = -Infinity;
  for (let T = 0.25; T <= 20; T *= 1.05) { const ll = logLik(T); if (ll > best) { best = ll; spread = T; } }
  spread = +spread.toFixed(2);
  console.log('\t\testimateListed: {');
  const keys = Object.keys(listed);
  keys.forEach((k, i) => console.log(`\t\t\t${k}: { seen: [${listed[k].seen.join(', ')}], unseen: [${listed[k].unseen.join(', ')}] }${i < keys.length - 1 ? ',' : ''}`));
  console.log('\t\t},');
  console.log(`\t\testimateConfidenceSpread: ${spread},`);
  writeTsv('confidence_listed', ['phase', 'seen', '1 warship', '2 warships', '3+ warships', 'spread'],
    keys.flatMap(k => ['seen', 'unseen'].map(s => [core.phaseLabel(k), s, ...listed[k][s], spread])));
  // calibration: listed builds grouped by the confidence they get with the fitted values, against how often they were built
  const plugin = core.plugin;
  plugin.estimateListed = listed; plugin.estimateConfidenceSpread = spread;
  const bins = [0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.01].map(x => ({ from: x, n: 0, conf: 0, built: 0 }));
  for (const r of R) {
    const ranked = r.scores.map(score => ({ score }));
    plugin.setConfidence(ranked, r.phase, r.seen, r.count);
    ranked.forEach((x, i) => { const b = bins.filter(b => x.confidence >= b.from).pop(); b.n++; b.conf += x.confidence; b.built += i == r.rank ? 1 : 0; });
  }
  console.log('\nconfidence    builds  mean confidence  built');
  for (let i = 0; i < bins.length - 1; i++) {
    const b = bins[i]; if (!b.n) continue;
    console.log(`${(100 * b.from).toFixed(0).padStart(3)}-${(100 * Math.min(1, bins[i + 1].from)).toFixed(0).padEnd(3)}%   ${String(b.n).padStart(6)}  ${(100 * b.conf / b.n).toFixed(1).padStart(14)}%  ${(100 * b.built / b.n).toFixed(1).padStart(5)}%`);
  }
  writeTsv('confidence', ['confidence from %', 'to %', 'builds', 'mean confidence %', 'built %'],
    bins.slice(0, -1).map((b, i) => [b, bins[i + 1]]).filter(([b]) => b.n)
      .map(([b, next]) => [100 * b.from, 100 * Math.min(1, next.from), b.n, +(100 * b.conf / b.n).toFixed(1), +(100 * b.built / b.n).toFixed(1)]));
  const top = R.filter(r => r.scores.length);
  for (const seen of [1, 0]) {
    const S = top.filter(r => r.seen == seen);
    const conf = S.reduce((a, r) => { const x = r.scores.map(score => ({ score })); plugin.setConfidence(x, r.phase, r.seen, r.count); return a + x[0].confidence; }, 0);
    console.log(`${seen ? 'seen  ' : 'unseen'} players: ${S.length} turns, top build confidence ${(100 * conf / S.length).toFixed(1)}%, built ${(100 * S.reduce((a, r) => a + r.top1, 0) / S.length).toFixed(1)}%`);
  }
  pool.close();
});
