#!/usr/bin/env python3
"""Mutation tests proving grid validation rejects incomplete and corrupted layouts."""
import copy,importlib,json
m=importlib.import_module('build-crosswords');data=m.read_content()
key='us-history--world-war-ii'
puzzle=json.loads((m.BASE/'crosswords/social-studies'/key/'puzzles.json').read_text())['hard']
assert m.validate_grid(puzzle,data[key])
def rejects(label,mutate):
    p=copy.deepcopy(puzzle);mutate(p)
    try:m.validate_grid(p,data[key])
    except (AssertionError,KeyError):print('PASS rejects',label)
    else:raise AssertionError('Validator accepted '+label)
rejects('missing entry',lambda p:p['entries'].pop())
rejects('wrong crossing letter',lambda p:p['cells'][0].__setitem__(2,'Z' if p['cells'][0][2]!='Z' else 'Q'))
rejects('duplicate clue number',lambda p:p['entries'][1].__setitem__('number',p['entries'][0]['number']))
rejects('incorrect clue direction',lambda p:p['entries'][0].__setitem__('direction','down' if p['entries'][0]['direction']=='across' else 'across'))
rejects('accidental extra cell',lambda p:p['cells'].append([p['rows']+1,p['cols']+1,'A']))
rejects('unplaced orphan',lambda p:p['entries'][0].__setitem__('row',p['rows']+2))

# Verify the same corruption checks apply to the newly added ELA library.
key='ela--language-grammar-vocabulary--roots-prefixes-and-suffixes'
puzzle=json.loads((m.BASE/'crosswords/ela'/key/'puzzles.json').read_text())['hard']
assert m.validate_grid(puzzle,data[key])
rejects('ELA missing entry',lambda p:p['entries'].pop())
rejects('ELA wrong letter',lambda p:p['cells'][0].__setitem__(2,'Z' if p['cells'][0][2]!='Z' else 'Q'))
rejects('ELA duplicate number',lambda p:p['entries'][1].__setitem__('number',p['entries'][0]['number']))
