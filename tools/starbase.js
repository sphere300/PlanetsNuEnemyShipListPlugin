// Accuracy of estimateStarbaseBuilds (the starbase builds that make up the rest of the military change) against complete games: turns where the scoreboard matches the summed values,
// given the true new ships, the player's earlier builds as the known fleet and the real starbase count. Saves reports/starbase.tsv.
const fs = require('fs');
const path = require('path');
const core = require('./evalcore.js')(false);
const writeTsv = require('./tsv.js');
const plugin = core.plugin;
const seen = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'seen.json')));
const d = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'data.json')));
const fleet = {};
for (const b of d.builds) (fleet[b.game + '|' + b.player] = fleet[b.game + '|' + b.player] || []).push(b);
let n = 0, exact = 0, kindsRight = 0, fRight = 0, fTurns = 0; const conf = {}; const show = [];
for (const r of d.records) {
  if (!r.d || r.turn < 2 || r.score == null || !r.militarychange || r.totalships >= r.shiplimit) continue;
  if (Math.abs(r.militarychange - r.d.model) > 1 && r.turn > 2) continue;
  const T = seen.tables[r.game]; if (!T) continue;
  const H = new Map(T.hulls.map(x => [x.id, x])), TP = new Map(T.torpedos.map(x => [x.id, x]));
  vgap.getTorpedo = id => TP.get(+id); vgap.getHull = id => H.get(+id);
  global.getNumForPlayer = () => r.sbtech.length;
  plugin.enemyShipList = (fleet[r.game + "|" + r.player] || []).filter(b => b.turn < r.turn).map(b => ({ ownerid: r.player, hullid: b.hullid, torps: b.torps, torpedoid: b.torpedoid, infoturn: b.turn }));
  const ships = r.new.filter(x => x.warship).map(x => ({ hull: H.get(x.hullid), torpedo: x.torps ? TP.get(x.torpedoid) : null }));
  const parts = { f: Math.max(0, r.d.sbfig), b: Math.max(0, r.d.sbdef), p: Math.max(0, r.d.pdef), a: Math.max(0, r.d.ammoval) };
  const target = parts.f + parts.b + parts.p + parts.a;
  if (!(target > 0)) continue;
  n++;
  const res = plugin.estimateStarbaseBuilds(r.player, ships, target, r.turn);
  if (Math.abs(res.value - target) <= 1) exact++;
  const got = { f: 0, b: 0, p: 0, a: 0 };
  for (const i of res.items) got[/starbase fighters/.test(i.name) ? 'f' : /starbase defense/.test(i.name) ? 'b' : /planetary/.test(i.name) ? 'p' : 'a'] = i.value;
  const tk = Object.keys(parts).filter(k => parts[k] > 0).join(''), gk = Object.keys(got).filter(k => got[k] > 0).join('');
  if (tk == gk) kindsRight++;
  conf[tk + ' -> ' + gk] = (conf[tk + ' -> ' + gk] || 0) + 1;
  if (parts.f > 0) { fTurns++; if (Math.abs(got.f - parts.f) < 1) fRight++; }
}
console.log('turns', n, 'made up within 1 point', exact, 'kinds right', kindsRight, 'starbase fighter turns', fTurns, 'fighter count right', fRight);
const kinds = Object.entries(conf).sort((a, b) => b[1] - a[1]);
console.log(kinds.slice(0, 14).map(e => e[1] + '  ' + e[0]).join('\n'));
// kinds: f starbase fighters, b starbase defense, p planetary defense, a ammo
writeTsv('starbase', ['turns', 'kinds built -> kinds picked'], [[n, 'all: made up within 1 point ' + exact + ', kinds right ' + kindsRight + ', starbase fighter turns ' + fTurns + ', fighter count right ' + fRight], ...kinds.map(e => [e[1], e[0]])]);
