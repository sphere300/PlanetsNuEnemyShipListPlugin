"""Extract every complete game in parallel (analyze.py and sightings.py, one process per game and script) and merge
the results into data/data.json and data/seen.json. Games already extracted are skipped unless --force is given.
Usage: python extract.py [--force] [games folder, default ../CompleteGames]"""
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from common import HERE, GAMES, data_path

force = '--force' in sys.argv
args = [a for a in sys.argv[1:] if a != '--force']
root = os.path.abspath(args[0] if args else GAMES)
games = sorted(g for g in os.listdir(root) if os.path.isdir(os.path.join(root, g)))
os.makedirs(data_path('games'), exist_ok=True)

jobs = []
for game in games:
    for script, prefix in (('analyze.py', 'data'), ('sightings.py', 'seen')):
        out = data_path(os.path.join('games', '%s_%s.json' % (prefix, game)))
        if force or not os.path.exists(out):
            jobs.append((script, out, game))

def run(job):
    script, out, game = job
    # -I: the game files are data; nothing from their folder or the current folder is imported
    result = subprocess.run([sys.executable, '-I', os.path.join(HERE, script), root, out + '.tmp', game], capture_output=True, text=True)
    if result.returncode != 0:
        return '%s %s failed:\n%s' % (script, game, result.stderr)
    os.replace(out + '.tmp', out)
    return '%s %s done' % (script, game)

with ThreadPoolExecutor(max_workers=max(1, (os.cpu_count() or 2) - 1)) as pool:
    for message in pool.map(run, jobs):
        print(message)

data = dict(records=[], builds=[])
seen = dict(seen=[], tables={})
for game in games:
    with open(data_path(os.path.join('games', 'data_%s.json' % game))) as f:
        d = json.load(f)
    data['records'] += d['records']
    data['builds'] += d['builds']
    with open(data_path(os.path.join('games', 'seen_%s.json' % game))) as f:
        d = json.load(f)
    seen['seen'] += d['seen']
    seen['tables'].update(d['tables'])
with open(data_path('data.json'), 'w') as f:
    json.dump(data, f)
with open(data_path('seen.json'), 'w') as f:
    json.dump(seen, f)
print('games', len(games), 'player turns', len(data['records']), 'sightings', len(seen['seen']))
