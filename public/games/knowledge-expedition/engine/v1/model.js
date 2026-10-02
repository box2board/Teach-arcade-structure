export function validatePack(pack) {
  if (pack.schemaVersion !== 1 || !pack.id || !pack.areas?.length) throw new Error('Unsupported expedition pack');
  const ids = new Set();
  const validateQuestion = q => {
    if (!q?.prompt || q.choices?.length < 2 || !Number.isInteger(q.correctIndex) || !q.choices[q.correctIndex] || !q.explanation) throw new Error('Invalid challenge');
  };
  for (const area of pack.areas) {
    if (!area.id || !area.discoveries?.length || !area.palette?.length) throw new Error('Invalid area');
    validateQuestion(area.connection);
    for (const item of area.discoveries) {
      if (!item.id || ids.has(item.id) || !Number.isFinite(item.order) || !Number.isFinite(item.x) || !Number.isFinite(item.y)) throw new Error('Invalid discovery');
      ids.add(item.id); validateQuestion(item.question);
      if (!item.summary || !item.title || !item.date || !item.theater || !/^https:\/\//.test(item.source)) throw new Error('Missing discovery information');
    }
  }
  return pack;
}
export function createExpedition(pack) {
  validatePack(pack);
  const discovered = new Set();
  const attempts = new Map();
  const completed = new Set();
  const timelines = new Map();
  const connections = new Map();
  let areaIndex = 0;
  const all = pack.areas.flatMap(a => a.discoveries);
  return {
    pack, discovered, completed, attempts, timelines, connections,
    get areaIndex() { return areaIndex; },
    get area() { return pack.areas[areaIndex]; },
    get ready() { return this.area.discoveries.every(d => discovered.has(d.id)); },
    get finished() { return completed.size === pack.areas.length; },
    answer(id, choice) {
      const item = this.area.discoveries.find(d => d.id === id);
      if (!item || discovered.has(id) || !Number.isInteger(choice) || !item.question.choices[choice]) return null;
      const count = (attempts.get(id) || 0) + 1;
      attempts.set(id, count);
      const correct = choice === item.question.correctIndex;
      if (correct) discovered.add(id);
      return {correct, firstTry: correct && count === 1, explanation: item.question.explanation};
    },
    checkTimeline(ids) {
      if (!this.ready || completed.has(this.area.id)) return null;
      const expected = [...this.area.discoveries].sort((a,b) => a.order-b.order).map(d => d.id);
      const correct = ids.length === expected.length && expected.every((id,i) => id === ids[i]);
      const previous = timelines.get(this.area.id) || {attempts:0, correct:false};
      if (previous.correct) return previous;
      const result = {attempts:previous.attempts+1, correct};
      timelines.set(this.area.id,result); return result;
    },
    checkConnection(choice) {
      if (!this.ready || !timelines.get(this.area.id)?.correct || completed.has(this.area.id)) return null;
      if (!Number.isInteger(choice) || !this.area.connection.choices[choice]) return null;
      const previous = connections.get(this.area.id) || {attempts:0,correct:false};
      const result = {attempts:previous.attempts+1,correct:choice === this.area.connection.correctIndex};
      connections.set(this.area.id,result);
      if (result.correct) completed.add(this.area.id);
      return result;
    },
    travel(index) {
      if (!Number.isInteger(index) || index < 0 || index >= pack.areas.length) return false;
      if (index > 0 && !completed.has(pack.areas[index-1].id)) return false;
      areaIndex = index; return true;
    },
    report() {
      return {discoveries:discovered.size,total:all.length,firstTry:all.filter(d => discovered.has(d.id) && attempts.get(d.id)===1).length,
        timelineFirstTry:[...timelines.values()].filter(v=>v.correct && v.attempts===1).length,
        connectionFirstTry:[...connections.values()].filter(v=>v.correct && v.attempts===1).length,
        review:all.filter(d=>(attempts.get(d.id)||0)>1).map(d=>d.title)};
    }
  };
}
