// Loads the plugin and the complete games once; evaluates the estimator on a list of cases.
// The plugin is EnemyShips.js next to this folder unless PLUGIN names another file; FOCUS names another focus table in data/.
const fs = require('fs');
const path = require('path');
const DATA = path.join(__dirname, 'data');
module.exports = function setup(useLogo) {
  const src = process.env.PLUGIN || path.join(__dirname, '..', 'EnemyShips.js');
  const seen = JSON.parse(fs.readFileSync(path.join(DATA, 'seen.json')));
  const C = JSON.parse(fs.readFileSync(path.join(DATA, 'cases.json')));
  const focus = JSON.parse(fs.readFileSync(path.join(DATA, process.env.FOCUS || 'focus.json')));
  let plugin;
  global.vgapMap = function () {}; global.vgaPlanets = function () {};
  global.vgap = { version: 4, plugins: {}, registerPlugin: (p, n) => { plugin = p; vgap.plugins[n] = p; }, settings: {} };
  const log = console.log; console.log = () => {};
  eval(fs.readFileSync(src, 'utf8').replace(/var script = document[\s\S]*$/, '') + '; wrapper();');
  console.log = log;
  const byTarget = {};
  for (const [game, obs, t, owner, sid, hull, eng, beam, torp] of seen.seen) {
    const ships = byTarget[game + '|' + owner] = byTarget[game + '|' + owner] || {};
    const s = ships[sid] = ships[sid] || { id: sid, ownerid: owner, history: {}, infoturn: t };
    s.history[t] = { x: 0, y: 0 };
    if (t >= s.infoturn) Object.assign(s, { hullid: hull, engineid: eng, beamid: beam, torpedoid: torp, infoturn: t });
  }
  const lists = {}; for (const k in byTarget) lists[k] = Object.values(byTarget[k]);
  const histories = {};
  for (const g in C.totals) { histories[g] = {}; for (const t in C.totals[g]) histories[g][t] = { 1: { c: C.totals[g][t], f: 0 } }; }
  const tables = {};
  for (const g in seen.tables) {
    const T = seen.tables[g], m = (L) => { const M = new Map(L.map(x => [x.id, x])); return id => M.get(+id); };
    tables[g] = { hulls: T.hulls, engines: T.engines, beams: T.beams, torpedos: T.torpedos, getHull: m(T.hulls), getEngine: m(T.engines), getBeam: m(T.beams), getTorpedo: m(T.torpedos),
      getPlayer: (id) => ({ id, raceid: T.raceof[id] }), getRace: (id) => ({ hulls: T.races[id] }), settings: { shiplimit: C.limits[g] } };
  }
  const phaseOf = (c) => { const f = (C.totals[c.game][c.turn - 1] || 0) / C.limits[c.game]; return f < plugin.estimateOpeningFill ? 'opening' : f < plugin.estimateEarlyFill ? 'early' : f < 1 ? 'nearCap' : 'afterCap'; };
  const hk = r => r.ships.map(s => s.hull.id).sort((a, b) => a - b).join(',');
  const fk = r => r.ships.map(s => s.hull.id + '|' + s.engine.id + '|' + (s.beam ? s.beam.id : 0) + '|' + (s.torpedo ? s.torpedo.id : 0)).sort().join(',');
  function run(c) {
    Object.assign(vgap, tables[c.game]);
    plugin.estimateRaceFocus = useLogo ? focus.logo[c.game] : focus.all;
    plugin.scoreHistory = histories[c.game];
    plugin.enemyShipList = lists[c.game + '|' + c.player] || [];
    const out = plugin.estimateBuilds(c.player, c.count, c.target, c.turn);
    const truth = c.hulls.join(','), tf = c.full.slice().sort().join(',');
    // ship level: truth ships whose hull is in the top prediction
    let shipHit = 0;
    if (out.ranked.length) {
      const left = out.ranked[0].ships.map(s => s.hull.id);
      for (const h of c.hulls) { const i = left.indexOf(h); if (i >= 0) { shipHit++; left.splice(i, 1); } }
    }
    return { game: c.game, phase: phaseOf(c), clean: c.clean, race: c.race, hit: out.ranked.some(r => hk(r) == truth) ? 1 : 0, top1: out.ranked.length && hk(out.ranked[0]) == truth ? 1 : 0,
      full: out.ranked.some(r => fk(r) == tf) ? 1 : 0, shipHit: shipHit / c.hulls.length, close: out.closest.some(r => hk(r) == truth) ? 1 : 0 };
  }
  return { plugin, C, phaseOf, run };
};
