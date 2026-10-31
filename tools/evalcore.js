// Loads the plugin and the complete games once; evaluates the estimator on a list of cases.
// The plugin is EnemyShips.js next to this folder unless PLUGIN names another file; FOCUS names another focus table in data/.
// The minefields other players saw adjust the military change as in the plugin; MINES=0 leaves them out.
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
  // minefields as the plugin records them, from every other player's view
  const mines = {};
  if (process.env.MINES != '0')
    for (const [game, obs, t, owner, id, units] of seen.mines || []) {
      if (obs == owner) continue;
      const g = mines[game] = mines[game] || {};
      (g[t] = g[t] || {})[id] = [owner, units];
    }
  const histories = {};
  for (const g in C.totals) { histories[g] = {}; for (const t in C.totals[g]) histories[g][t] = { 1: { c: C.totals[g][t], f: 0 } }; }
  const tables = {};
  for (const g in seen.tables) {
    const T = seen.tables[g], m = (L) => { const M = new Map(L.map(x => [x.id, x])); return id => M.get(+id); };
    tables[g] = { hulls: T.hulls, engines: T.engines, beams: T.beams, torpedos: T.torpedos, getHull: m(T.hulls), getEngine: m(T.engines), getBeam: m(T.beams), getTorpedo: m(T.torpedos),
      getPlayer: (id) => ({ id, raceid: T.raceof[id] }), getRace: (id) => ({ hulls: T.races[id] }), settings: { shiplimit: C.limits[g] } };
  }
  const phaseOf = (c) => { const f = (C.totals[c.game][c.turn - 1] || 0) / C.limits[c.game]; return f < plugin.estimateOpeningFill ? 'opening' : f < plugin.estimateEarlyFill ? 'early' : f < 1 ? 'nearCap' : 'afterCap'; };
  // report title of a phase: the share of the ship limit in use where it starts and ends, as in the plugin
  const phaseLabel = (p) => plugin.getPhaseLabel(p) || p;
  const hk = r => r.ships.map(s => s.hull.id).sort((a, b) => a - b).join(',');
  const fk = r => r.ships.map(s => s.hull.id + '|' + s.engine.id + '|' + (s.beam ? s.beam.id : 0) + '|' + (s.torpedo ? s.torpedo.id : 0)).sort().join(',');
  // ranker models learned without each game (rank.py); RANKER=0 ranks by the score of the search
  const rankerFile = path.join(DATA, 'ranker.json');
  const ranker = process.env.RANKER != '0' && useLogo && fs.existsSync(rankerFile) ? JSON.parse(fs.readFileSync(rankerFile)) : null;
  const setCase = (c) => {
    Object.assign(vgap, tables[c.game]);
    plugin.estimateRaceFocus = useLogo ? focus.logo[c.game] : focus.all;
    plugin.scoreHistory = histories[c.game];
    plugin.enemyShipList = lists[c.game + '|' + c.player] || [];
    plugin.mineHistory = mines[c.game] || {};
    const mine = plugin.getMineChange(c.player, c.turn, c.turn);
    return c.target - (mine ? mine.value : 0);
  };
  function run(c) {
    const target = setCase(c);
    plugin.estimateRanker = process.env.RANKER == '0' ? null : ranker ? ranker.models[ranker.fold[c.game]] : plugin.estimateRanker;
    const out = plugin.estimateBuilds(c.player, c.count, target, c.turn);
    const truth = c.hulls.join(','), tf = c.full.slice().sort().join(',');
    // ship level: truth ships whose hull is in the top prediction
    let shipHit = 0;
    if (out.ranked.length) {
      const left = out.ranked[0].ships.map(s => s.hull.id);
      for (const h of c.hulls) { const i = left.indexOf(h); if (i >= 0) { shipHit++; left.splice(i, 1); } }
    }
    const rank = out.ranked.findIndex(r => hk(r) == truth);
    return { game: c.game, phase: phaseOf(c), clean: c.clean, race: c.race, hit: rank >= 0 ? 1 : 0, top1: rank == 0 ? 1 : 0,
      full: out.ranked.some(r => fk(r) == tf) ? 1 : 0, shipHit: shipHit / c.hulls.length, close: out.closest.some(r => hk(r) == truth) ? 1 : 0,
      seen: out.seen.fleet + out.seen.fresh > 0 ? 1 : 0, count: c.count, rank, scores: out.ranked.map(r => r.score), confidence: out.ranked.map(r => r.confidence) };
  }
  // the sets the search keeps for each case with their labels (2: hulls and loadout built, 1: hulls built) and features, as doubles
  const games = Object.keys(C.limits).sort(), phases = ['opening', 'early', 'nearCap'];
  const rankColumns = ['case', 'game', 'phase', 'label', 'hullSet', 'shipHit'];
  function dump(cases, file) {
    const fd = fs.openSync(file, 'w');
    plugin.estimateRanker = null;
    plugin.estimateClosestResults = Infinity;
    let rows = 0, turns = 0, found = 0;
    for (const i of cases) {
      const c = C.cases[i], target = setCase(c), sets = plugin.estimateBuilds(c.player, c.count, target, c.turn).closest;
      if (!sets.length) continue;
      const truth = c.hulls.join(','), tf = c.full.slice().sort().join(','), hullSets = new Map();
      const width = rankColumns.length + sets[0].features.length, out = new Float64Array(sets.length * width);
      let any = 0;
      sets.forEach((r, j) => {
        const key = hk(r);
        if (!hullSets.has(key)) hullSets.set(key, hullSets.size);
        const left = r.ships.map(s => s.hull.id);
        let hit = 0;
        for (const h of c.hulls) { const at = left.indexOf(h); if (at >= 0) { hit++; left.splice(at, 1); } }
        const label = key != truth ? 0 : fk(r) == tf ? 2 : 1;
        any = any || label;
        out.set([i, games.indexOf(c.game), phases.indexOf(phaseOf(c)), label, hullSets.get(key), hit / c.hulls.length], j * width);
        out.set(r.features, j * width + rankColumns.length);
      });
      fs.writeSync(fd, Buffer.from(out.buffer));
      rows += sets.length; turns++; found += any ? 1 : 0;
    }
    fs.closeSync(fd);
    return { file: path.basename(file), rows, turns, found };
  }
  return { plugin, C, phaseOf, phaseLabel, run, dump, rankColumns, games, phases };
};
