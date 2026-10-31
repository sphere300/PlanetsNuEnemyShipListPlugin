"""Write the final model from data/ranker.json into the plugin (estimateRanker). Usage: python writeranker.py [EnemyShips.js]"""
import json, re, sys
from common import load, PLUGIN
path = sys.argv[1] if len(sys.argv) > 1 else PLUGIN
R = load('ranker.json')
line = "\t\testimateRanker: %s,\n" % json.dumps(R['final'], separators=(',', ':'))
s = open(path, encoding='utf-8', newline='').read()
if '\r\n' in s:
    line = line.replace('\n', '\r\n')
pat = re.compile(r"\t\testimateRanker: [^\n]*\n")
assert len(pat.findall(s)) == 1
s = pat.sub(lambda m: line, s)
open(path, 'w', encoding='utf-8', newline='').write(s)
print('written', len(line), 'chars,', len(R['final']['trees']), 'trees')
