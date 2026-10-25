// Worker pool: evaluate the estimator with parameter overrides over cases, in parallel.
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
if (!isMainThread) {
  const core = require('./evalcore.js')(workerData.logo);
  const base = JSON.parse(JSON.stringify(core.plugin.estimatePhases));
  parentPort.on('message', ({ id, overrides, cases }) => {
    core.plugin.estimatePhases = JSON.parse(JSON.stringify(base));
    for (const k in overrides) {
      if (k == 'estimatePhases') for (const p in overrides[k]) Object.assign(core.plugin.estimatePhases[p], overrides[k][p]);
      else core.plugin[k] = overrides[k];
    }
    parentPort.postMessage({ id, results: cases.map(i => core.run(core.C.cases[i])) });
  });
  parentPort.postMessage({ ready: true });
} else {
  module.exports = function makePool(n = Math.max(1, require('os').cpus().length - 1), logo = true) {
    const workers = [], waiting = new Map(); let nextId = 0, ready = 0, readyResolve;
    const readyP = new Promise(r => readyResolve = r);
    for (let i = 0; i < n; i++) {
      const w = new Worker(__filename, { workerData: { logo } });
      w.on('message', (m) => { if (m.ready) { if (++ready == n) readyResolve(); return; } const cb = waiting.get(m.id); waiting.delete(m.id); cb(m.results); });
      w.on('error', e => { console.error(e); process.exit(1); });
      workers.push(w);
    }
    async function evaluate(overrides, caseIdx) {
      await readyP;
      const shards = workers.map((w, i) => caseIdx.filter((_, j) => j % n == i));
      const parts = await Promise.all(workers.map((w, i) => new Promise(res => { const id = nextId++; waiting.set(id, res); w.postMessage({ id, overrides, cases: shards[i] }); })));
      return parts.flat();
    }
    return { evaluate, close: () => workers.forEach(w => w.terminate()) };
  };
}
