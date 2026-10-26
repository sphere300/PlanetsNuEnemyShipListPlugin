// List build turns of one phase where the top prediction is wrong: the true ships and their share of the military
// change, the hull's place in the priors, and what was predicted instead, then the most common mix-ups.
// Saves all of them to reports/misses_<phase>_<ships>.tsv and reports/mixups_<phase>_<ships>.tsv.
// Usage: node misses.js <opening|early|nearCap> [ships built, default 1] [max listed, default 25]
const core = require('./evalcore.js')(true);
const writeTsv = require('./tsv.js');
const p = core.plugin;
const phase = process.argv[2] || 'early', count = +(process.argv[3] || 1), max = +(process.argv[4] || 25);
const name = (x, n) => x ? x.name.slice(0, n) : '-';
let shown = 0, total = 0, missed = 0;
const confusions = {};
const rows = [];
for (const c of core.C.cases) {
  if (core.phaseOf(c) != phase || c.count != count || !c.clean) continue;
  total++;
  if (core.run(c).top1) continue;
  missed++;
  const out = p.estimateBuilds(c.player, c.count, c.target, c.turn);
  const priors = p.getBuildPriors(c.player, c.turn);
  const truth = c.full.map(k => {
    const [h, e, b, t] = k.split('|').map(Number), H = vgap.getHull(h);
    const value = p.shipModelValue(H, vgap.getEngine(e), vgap.getBeam(b), H.beams, vgap.getTorpedo(t), H.launchers);
    const rank = priors.hulls.findIndex(x => x.item.id == h);
    return { H, value, text: `${name(H, 22)} [${name(vgap.getEngine(e), 10)}/${name(vgap.getBeam(b), 10)}/${name(vgap.getTorpedo(t), 10)}] prior #${rank}` };
  });
  const value = truth.reduce((a, x) => a + x.value, 0);
  const top = out.ranked[0];
  const predictedShips = top ? top.ships.map(s => `${name(s.hull, 22)} [${name(s.engine, 10)}/${name(s.beam, 10)}/${name(s.torpedo, 10)}]`).join(', ') : 'nothing fits';
  const predicted = top ? predictedShips + ` worth ${top.value}` : predictedShips;
  rows.push([c.game, c.race, c.turn, c.target, truth.map(x => x.text).join(', '), value, +(value / c.target).toFixed(2), predictedShips, top ? top.value : '']);
  const key = truth.map(x => name(x.H, 20)).join('+') + ' -> ' + (top ? top.ships.map(s => name(s.hull, 20)).join('+') : '-');
  confusions[key] = (confusions[key] || 0) + 1;
  if (shown++ < max)
    console.log(`${c.game} race ${c.race} turn ${c.turn} change ${c.target}: built ${truth.map(x => x.text).join(', ')} worth ${value} (${(value / c.target).toFixed(2)}) | predicted ${predicted}`);
}
console.log(`\n${missed} of ${total} clean ${phase} turns with ${count} ship(s) missed. Most common mix-ups:`);
const mixups = Object.entries(confusions).sort((a, b) => b[1] - a[1]);
console.log(mixups.slice(0, 15).map(x => '  ' + x[1] + ' ' + x[0]).join('\n'));
writeTsv(`misses_${phase}_${count}`, [core.phaseLabel(phase) + ' game', 'race', 'turn', 'military change', 'built', 'built worth', 'share of change', 'predicted', 'predicted worth'], rows);
writeTsv(`mixups_${phase}_${count}`, [core.phaseLabel(phase) + ' turns', 'built -> predicted'], mixups.map(x => [x[1], x[0]]));
