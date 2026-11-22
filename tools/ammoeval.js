// How well the plugin tells the torpedoes laid as mines and made for loading in the complete games (ammo.py), from the ships other
// players saw: the type, and the torpedo points the laid mines used up (getMineChange), against the old rule (the torpedo on the
// most ships seen). Saves reports/ammoeval.tsv. Usage: node ammoeval.js
const fs = require('fs');
const path = require('path');
const writeTsv = require('./tsv.js');
const core = require('./evalcore.js')(true);
const plugin = core.plugin;
Object.assign(plugin, JSON.parse(process.argv[2] || '{}'));
const files = fs.readdirSync(path.join(__dirname, 'data', 'games')).filter(f => /^ammo_.*\.json$/.test(f));
const oldRule = (owner, turn) => {
  const counts = {}; let best = 0;
  for (const ship of plugin.getKnownShips(turn)) {
    if (ship.ownerid != owner || !(ship.torpedoid > 0) || !(ship.torps > 0) || plugin.getSeenTurns(ship).first > turn) continue;
    counts[ship.torpedoid] = (counts[ship.torpedoid] || 0) + 1;
    if (!best || counts[ship.torpedoid] > counts[best]) best = ship.torpedoid;
  }
  if (best) return vgap.getTorpedo(best);
  const focus = plugin.getRaceFocus(owner, plugin.getBuildPhase(turn).key), shares = {};
  let top = 0, t = null;
  for (const f of focus) for (const o of f.outfits) if (o.torpedo) shares[o.torpedo.id] = (shares[o.torpedo.id] || 0) + f.share * o.share;
  for (const id in shares) if (shares[id] > top) { top = shares[id]; t = vgap.getTorpedo(+id); }
  return t;
};
const S = {}; const add = (k, v) => { const a = S[k] = S[k] || [0, 0]; a[0] += v; a[1]++; };
for (const f of files) {
  const g = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'games', f)));
  if (!core.C.limits[g.game]) continue;
  let last = null;
  for (const r of g.recs) {
    const laid = Object.entries(r.laid).filter(([k]) => +k > 0).map(([k, u]) => [+k, u]);
    const made = Object.entries(r.gain || {}).map(([k, v]) => [+k, v]).filter(x => x[1] > 0);
    if (!laid.length && !made.length) continue;
    if (last != g.game + r.player) { core.setPlayer(g.game, r.player); last = g.game + r.player; }
    const k = r.raceid == 9 ? 4 : 1, units = laid.reduce((a, x) => a + x[1], 0);
    const pts = (t, u) => t ? u / (t.id * t.id * k) * t.torpedocost : 0;
    if (laid.length) {
      const truth = laid.reduce((a, [t, u]) => a + pts(vgap.getTorpedo(t), u), 0);
      if (!(truth > 0)) continue;
      const used = laid.sort((a, b) => b[1] - a[1])[0][0];
      const o = oldRule(r.player, r.turn - 1), likely = plugin.getLikelyTorpedoes(r.player, r.turn - 1, [], 'laid');
      const n = likely.length ? likely[0].torpedo : null;
      const mix = likely.reduce((a, x) => a + x.p * pts(x.torpedo, units), 0);
      add('laid type: old', o && o.id == used ? 1 : 0); add('laid type: new', n && n.id == used ? 1 : 0);
      add('laid points error %: old', Math.min(500, 100 * Math.abs(pts(o, units) - truth) / truth));
      add('laid points error %: new', Math.min(500, 100 * Math.abs(pts(n, units) - truth) / truth));
      add('laid points error %: new mix', Math.min(500, 100 * Math.abs(mix - truth) / truth));
    }
    if (made.length) {
      const top = made.sort((a, b) => b[1] - a[1])[0][0];
      const o = oldRule(r.player, r.turn - 1), likely = plugin.getLikelyTorpedoes(r.player, r.turn - 1, [], 'made');
      add('made type: old', o && o.id == top ? 1 : 0); add('made type: new', likely.length && likely[0].torpedo.id == top ? 1 : 0);
    }
  }
  process.stderr.write(g.game + '\n');
}
const rows = Object.entries(S).map(([k, [v, n]]) => [k, n, +(v / n * (k.includes('%') ? 1 : 100)).toFixed(1)]);
for (const r of rows) console.log(r[0].padEnd(32), String(r[1]).padStart(7), (r[2] + (k => k)('')).padStart(7), r[0].includes('%') ? 'mean error %' : '% right');
writeTsv('ammoeval', ['measure', 'turns', 'value'], rows);
