"""Write the race focus table from data/focus.json into the plugin (estimateRaceFocus). Usage: python writefocus.py [EnemyShips.js]"""
import json, re, sys
from common import load, PLUGIN
path = sys.argv[1] if len(sys.argv) > 1 else PLUGIN
F = load('focus.json')['all']
RN = {1: 'Federation', 2: 'Lizard', 3: 'Bird Men', 4: 'Fascist', 5: 'Privateer', 6: 'Cyborg', 7: 'Crystal', 8: 'Evil Empire', 9: 'Robot', 10: 'Rebel', 11: 'Colonies', 12: 'Horwasp'}
lines = ["\t\t//usual builds per race (by race id) and phase, from complete games: [hull id, share of builds,",
         "\t\t//[[engine id, beam id, torpedo id, share of the hull's builds], ...]], beam or torpedo id 0 when built without",
         "\t\testimateRaceFocus: {"]
races = sorted(F, key=int)
for i, race in enumerate(races):
    lines.append("\t\t\t%s: {\t//%s" % (race, RN.get(int(race), '')))
    phases = list(F[race])
    for j, p in enumerate(phases):
        lines.append("\t\t\t\t%s: %s%s" % (p, json.dumps(F[race][p], separators=(',', ':')), ',' if j < len(phases) - 1 else ''))
    lines.append("\t\t\t}" + (',' if i < len(races) - 1 else ''))
lines.append("\t\t},")
block = "\n".join(lines) + "\n"
s = open(path, encoding='utf-8').read()
pat = re.compile(r"\t\t//usual builds per race[\s\S]*?\n\t\t},\n(?=\t\tmanualBuild)")
s = pat.sub(lambda m: block, s) if pat.search(s) else s.replace("\t\tmanualBuild: null,", block + "\t\tmanualBuild: null,", 1)
open(path, 'w', encoding='utf-8', newline='').write(s)
print('written', len(block), 'chars')
