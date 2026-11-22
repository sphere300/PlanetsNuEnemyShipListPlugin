// What the build search needs for every build turn before the ship limit that does not depend on the search settings, for the
// GPU search (gpusearch.py): the hulls the player may build with the weight they get from the race and the fleet seen, their share
// of the race's usual builds, cost rank and value, the outfits the race usually puts on them, the components seen in the fleet, the
// military change after the minefields, and what was built. Also the component tables of
// each game and the plugin's search settings. Mirrors getBuildPriors and estimateBuilds: when either changes, change this too and
// check with python gpucheck.py.
// Usage: node gpuexport.js        writes data/gpu_cases.json and data/gpu_settings.json
const fs = require('fs');
const path = require('path');
const core = require('./evalcore.js')(true);
const plugin = core.plugin;
const DATA = path.join(__dirname, 'data');
const t0 = Date.now();

const tables = {};
const tableOf = (game) => {
  if (tables[game]) return tables[game];
  const byId = (L, field) => L.slice().sort((a, b) => a.id - b.id).map(x => [x.id, x.techlevel, plugin.partValue(x, field)]);
  const byTech = (list, best) => { let top = null; for (const x of list) if (!top || (best ? x.techlevel > top.techlevel : x.techlevel < top.techlevel)) top = x; return top ? top.id : 0; };
  return tables[game] = { engines: byId(vgap.engines, 'cost'), beams: byId(vgap.beams, 'cost'), torpedos: byId(vgap.torpedos, 'launchercost'),
    bestEngine: byTech(vgap.engines, true), cheapEngine: byTech(vgap.engines, false), bestBeam: byTech(vgap.beams, true), bestTorpedo: byTech(vgap.torpedos, true) };
};

const out = [];
core.C.cases.forEach((c, i) => {
  const stageEval = core.phaseOf(c);
  if (stageEval == 'afterCap') return;
  const target = core.setCase(c);
  const ownerid = c.player, turn = c.turn;
  const stage = plugin.getBuildPhase(turn).key;
  tableOf(c.game);
  // hull weights without the settings: race hulls, fleet and fresh ships (getBuildPriors)
  const A = {}, F = {};
  const race = vgap.getRace(vgap.getPlayer(ownerid).raceid);
  const raceValues = [];
  for (const id of race.hulls ? race.hulls.split(',') : []) {
    const hull = vgap.getHull(parseInt(id, 10));
    if (hull && !plugin.isFreighterHull(hull)) { A[hull.id] = plugin.estimateRaceHullWeight; raceValues.push(plugin.partValue(hull, 'cost')); }
  }
  const seenE = {}, seenB = {}, seenT = {};
  const count = (map, id) => { map[id] = (map[id] || 0) + 1; };
  for (const ship of plugin.getKnownShips(turn)) {
    if (ship.ownerid != ownerid || ship.id < 0) continue;
    const hull = vgap.getHull(ship.hullid);
    if (!hull || plugin.isFreighterHull(hull)) continue;
    const first = plugin.getSeenTurns(ship).first;
    if (first < turn) {
      A[hull.id] = (A[hull.id] || 0) + 1;
      if (ship.engineid > 0 && vgap.getEngine(ship.engineid)) count(seenE, ship.engineid);
      if (ship.beamid > 0 && vgap.getBeam(ship.beamid)) count(seenB, ship.beamid);
      if (ship.torpedoid > 0 && vgap.getTorpedo(ship.torpedoid)) count(seenT, ship.torpedoid);
    } else if (first < turn + plugin.estimateFreshTurns) {
      A[hull.id] = (A[hull.id] || 0) + plugin.estimateFreshWeight;
    }
  }
  // the race's usual builds: share per hull and outfits (estimateBuilds keeps the last row of a hull)
  const focus = plugin.getRaceFocus(ownerid, stage), outfits = {};
  for (const f of focus) {
    F[f.hull.id] = (F[f.hull.id] || 0) + f.share;
    if (!(f.hull.id in A)) A[f.hull.id] = 0;
    const hull = f.hull, L = [], at = {};
    for (const o of f.outfits.filter(o => (!o.beam || hull.beams > 0) && (!o.torpedo || hull.launchers > 0))) {
      const key = o.engine.id + '|' + (o.beam ? o.beam.id : 0) + '|' + (o.torpedo ? o.torpedo.id : 0);
      if (key in at) L[at[key]][3] += o.share;
      else { at[key] = L.length; L.push([o.engine.id, o.beam ? o.beam.id : 0, o.torpedo ? o.torpedo.id : 0, o.share]); }
    }
    outfits[hull.id] = L;
  }
  const hulls = [];
  for (const id of Object.keys(A)) {
    const hull = vgap.getHull(parseInt(id, 10));
    if (!hull) continue;
    const value = plugin.partValue(hull, 'cost');
    const cheaper = raceValues.filter(v => v < value).length;
    const rank = raceValues.length > 1 ? Math.min(1, cheaper / (raceValues.length - 1)) : 0.5;
    hulls.push([hull.id, A[id], F[id] || 0, rank, value, hull.engines, hull.beams, hull.launchers, outfits[id] || []]);
  }
  out.push({ i, game: c.game, stage, stageEval, count: c.count, target, truth: c.hulls,
    full: c.full.map(s => s.split('|').map(Number)), hulls, seenE, seenB, seenT });
});
const settings = { estimatePhases: plugin.estimatePhases, estimateFitEdges: plugin.estimateFitEdges,
  estimateFitFloor: plugin.estimateFitFloor, estimateMaxOver: plugin.estimateMaxOver, estimateSearchWidth: plugin.estimateSearchWidth,
  estimateResults: plugin.estimateResults };
fs.writeFileSync(path.join(DATA, 'gpu_cases.json'), JSON.stringify({ tables, cases: out }));
fs.writeFileSync(path.join(DATA, 'gpu_settings.json'), JSON.stringify(settings, null, 1));
console.log(out.length, 'build turns,', Object.keys(tables).length, 'games,', ((Date.now() - t0) / 1000).toFixed(0) + 's');
