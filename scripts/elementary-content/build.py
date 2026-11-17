"""Compile authored elementary items into the existing Review Lab bank format."""
import ast
from collections import Counter, defaultdict
from fractions import Fraction
import hashlib
import json
import operator
from pathlib import Path
import random
import re
import unicodedata

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
BANK = ROOT / 'question-bank'
DEST = BANK / 'elementary'
SUBJECTS = ['Math', 'English Language Arts', 'Science', 'Social Studies', 'General Knowledge and Life Skills']


def normalize(text):
    return ' '.join(unicodedata.normalize('NFKC', text).casefold().split())


def slug(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower().replace('’', '')).strip('-')


def expression_value(expression):
    operations = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
                  ast.Div: operator.truediv, ast.Mod: operator.mod, ast.Pow: operator.pow}
    def visit(node):
        if isinstance(node, ast.Constant) and type(node.value) in (int, float):
            return Fraction(str(node.value))
        if isinstance(node, ast.BinOp):
            return operations[type(node.op)](visit(node.left), visit(node.right))
        raise ValueError(f'Invalid numeric calculation: {expression}')
    return visit(ast.parse(expression, mode='eval').body)


def number_choices(answer):
    value = Fraction(answer)
    yield answer
    if '/' in answer:
        for change in (1, -1, 2, -2, 3, 4):
            if value.numerator + change > 0:
                yield str(Fraction(value.numerator + change, value.denominator))
    elif '.' in answer:
        for change in (1, -1, 10, -10, 20, -20, 30):
            other = value + Fraction(change, 10 ** len(answer.split('.')[1]))
            if other >= 0:
                yield f'{float(other):.{len(answer.split(".")[1])}f}'
    else:
        magnitude = 10 ** max(0, len(answer) - 2)
        for change in (1, -1, 2, -2, 5, 10, 20):
            if value + magnitude * change >= 0:
                yield str(value + magnitude * change)


def item_sets(file):
    groups = file.read_text().strip().split('\n@')
    for group in groups:
        lines = [line.strip() for line in group.splitlines()]
        title = lines.pop(0).lstrip('@').strip()
        chunks = [[]]
        passage = template = ""
        for line in lines:
            if line == '--':
                chunks.append([])
                passage = template = ''
            elif line.startswith('>'):
                passage = line[1:] + ' '
            elif line.startswith('?'):
                template = line[1:]
            elif line:
                prompt, answers = line.split('|', 1)
                prefix = prompt[0] if prompt[0] in '!~' else ''
                prompt = prompt.lstrip('!~')
                if template:
                    prompt = template.replace('{}', prompt)
                chunks[-1].append((prefix or ('~' if passage else '')) + passage + prompt + '|' + answers)
        yield title, chunks


def compile_items(chunks, rng, math):
    rows = []
    for chunk in chunks:
        items = []
        for line in chunk:
            prompt, answer, *options = line.split('|')
            raw_answer, separator, calc = answer.partition('=')
            if math:
                assert separator and expression_value(calc) == Fraction(raw_answer), line
            else:
                assert not separator, line
            items.append((prompt, raw_answer, options, calc))
        for prompt, answer, options, calc in items:
            if options:
                candidates = options
            elif math:
                candidates = list(number_choices(answer))[1:]
            else:
                candidates = list(dict.fromkeys(other[1] for other in items if normalize(other[1]) != normalize(answer)))
                rng.shuffle(candidates)
            choices = [answer]
            for choice in candidates:
                if normalize(choice) not in [normalize(text) for text in choices]:
                    choices.append(choice)
                if len(choices) == 4:
                    break
            assert len(choices) == 4, (prompt, choices)
            skill = {'!': 'reasoning', '~': 'understanding'}.get(prompt[0], 'recall')
            rows.append((prompt.lstrip('!~'), choices, skill))
    assert len(rows) == 20, len(rows)
    distribution = [0, 1, 2, 3] * 5
    rng.shuffle(distribution)
    questions = []
    for i, ((prompt, choices, skill), position) in enumerate(zip(rows, distribution), 1):
        answer, *wrong = choices
        rng.shuffle(wrong)
        wrong.insert(position, answer)
        questions.append(dict(id=i, question=prompt, choices=wrong, correctAnswer=position, skill=skill))
    return questions


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def main():
    subject = None
    metadata = defaultdict(list)
    for line in (HERE / 'catalog.txt').read_text().splitlines():
        if line in SUBJECTS:
            subject = line
            continue
        grade, topic, title, keywords, *standards = line.split('|')
        metadata[(subject, topic)].append((grade, title, keywords.split(', '), standards[0].split(',') if standards else []))
    indexes = []
    for subject, filename in zip(SUBJECTS, ['math.txt', 'ela.txt', 'science.txt', 'social-studies.txt', 'life-skills.txt']):
        file = HERE / filename
        for topic, chunks in item_sets(file):
            grade, title, keywords, standards = metadata[(subject, topic)].pop(0)
            grade_name = 'Kindergarten' if grade == 'K' else f'Grade {grade}'
            subject_label = {'English Language Arts': 'ELA', 'General Knowledge and Life Skills': 'Life Skills'}.get(subject, subject)
            band = {'K': 'K–1', '1': 'K–1', '2': '2–3', '3': '2–3', '4': '4–5', '5': '4–5'}[grade]
            relative = f'{slug(subject)}/{grade.lower()}-{slug(topic)}.json'
            bank_id = 'elementary--' + slug(subject) + '--' + grade.lower() + '--' + slug(topic)
            questions = compile_items(chunks, random.Random(bank_id), subject == 'Math')
            bank = dict(schemaVersion=1, id=bank_id, title=f'{grade_name} {subject_label} — {title}',
                        subject=subject, category=topic, topic=topic, primaryGrade=grade, gradeBand=band,
                        difficulty={'K':'Foundational','1':'Foundational','2':'Developing','3':'Developing','4':'Application','5':'Application'}[grade],
                        questionCount=20, description=f'Practice with questions on {", ".join(keywords)}.',
                        keywords=keywords, creator='Teach Arcade', visibility='public', standards=standards, questions=questions)
            write_json(DEST / relative, bank)
            indexes.append({**{k:v for k,v in bank.items() if k not in ('questions', 'schemaVersion')}, 'file':relative})
    assert not any(metadata.values()), f'Missing sets: {[k for k,v in metadata.items() if v]}'
    assert Counter(s['subject'] for s in indexes) == dict(zip(SUBJECTS, [30,25,20,20,5]))
    write_json(DEST / 'manifest.json', dict(schemaVersion=1, setCount=len(indexes), questionCount=sum(s['questionCount'] for s in indexes), sets=indexes))
    path = BANK / 'source-hashes.json'
    hashes = {k:v for k,v in json.loads(path.read_text()).items() if not k.startswith('question-bank/elementary/')}
    for entry in indexes:
        file = DEST / entry['file']
        hashes[file.relative_to(ROOT).as_posix()] = hashlib.sha256(file.read_bytes()).hexdigest()
    write_json(path, hashes)


if __name__ == '__main__':
    main()
