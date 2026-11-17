const simplify = value => String(value).normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const index = new WeakMap();

export function matchesSetSearch(set, search) {
  if (!index.has(set)) {
    index.set(set, simplify([
      set.title, set.subject, set.category, set.topic, set.description,
      set.primaryGrade === 'K' ? 'Kindergarten Grade K' : set.primaryGrade,
      set.gradeBand, set.difficulty, set.creator, ...(set.keywords || []), ...(set.standards || [])
    ].filter(Boolean).join(' ')));
  }
  return simplify(search).trim().split(/\s+/).every(word => index.get(set).includes(word));
}

const grades = ['K','1','2','3','4','5'];
const bands = [
  ['elementary','Elementary (K–5)'], ['K–1','K–1'], ['2–3','2–3'], ['4–5','4–5'], ['7–12','7–12']
];
const byTitle = (a, b) => a.localeCompare(b);
const fields = {
  primaryGrade: ['Grade', () => grades.map(grade => [grade, grade === 'K' ? 'Kindergarten' : 'Grade ' + grade])],
  gradeBand: ['Grade band', () => bands],
  subject: ['Subject', sets => [...new Set(sets.map(set => set.subject))].sort(byTitle).map(value => [value,value])],
  category: ['Topic', sets => [...new Set(sets.map(set => set.category || 'Foundations'))].sort(byTitle).map(value => [value,value])],
  difficulty: ['Difficulty', () => ['Foundational','Developing','Application'].map(value => [value,value])]
};

export function matchesSetFields(set, filters) {
  return Object.entries(filters).every(([key,value]) => {
    if (!value) return true;
    if (key === 'gradeBand' && value === 'elementary') return grades.includes(set.primaryGrade);
    if (key === 'category') return (set.category || 'Foundations') === value;
    return set[key] === value;
  });
}

export function mountSetFilters(container, sets, keys, onChange, initial = {}) {
  const controls = {};
  for (const key of keys) {
    const label = document.createElement('label');
    const select = document.createElement('select');
    select.name = key;
    label.append(fields[key][0], select);
    container.append(label);
    controls[key] = select;
  }
  const values = () => Object.fromEntries(Object.entries(controls).map(([key,select]) => [key,select.value]));
  function updateTopics(extra = {}) {
    if (!controls.category) return;
    const previous = controls.category.value;
    const selected = {...values(),...extra,category:''};
    controls.category.replaceChildren(new Option('All topics',''),
      ...fields.category[1](sets.filter(set => matchesSetFields(set, selected))).map(([value,label]) => new Option(label,value)));
    if ([...controls.category.options].some(option => option.value === previous)) controls.category.value = previous;
  }
  for (const [key,select] of Object.entries(controls)) {
    if (key === 'category') continue;
    const [label,options] = fields[key];
    select.append(new Option('All ' + (key === 'difficulty' ? 'levels' : label.toLowerCase() + 's'), ''),
      ...options(sets).map(([value,title]) => new Option(title,value)));
    if (initial[key] && [...select.options].some(option => option.value === initial[key])) select.value = initial[key];
  }
  updateTopics();
  container.addEventListener('change', event => {
    if (!Object.values(controls).includes(event.target)) return;
    if (event.target !== controls.category) updateTopics();
    onChange();
  });
  return {
    values,
    updateTopics,
    reset() { Object.values(controls).forEach(control => control.value = ''); updateTopics(); },
    setDisabled(disabled) { Object.values(controls).forEach(control => control.disabled = disabled); }
  };
}

export function originalSetLine(set) {
  const grade = set.primaryGrade === 'K' ? 'Kindergarten' : set.primaryGrade ? 'Grade ' + set.primaryGrade : set.gradeBand;
  return [set.subject, grade, set.difficulty, set.questionCount + ' questions'].filter(Boolean).join(' · ');
}
