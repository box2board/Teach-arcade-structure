export function validatePack(pack) {
  const text=value=>typeof value==='string'&&value.trim().length>0;
  if (!pack || pack.schemaVersion !== 1 || !text(pack.id) || !text(pack.title) || !text(pack.finalPrompt) || !Array.isArray(pack.goals) || !pack.goals.length || !pack.goals.every(text) || !Array.isArray(pack.areas) || !pack.areas.length) throw new Error('Unsupported expedition pack');
  const ids=new Set(),areaIds=new Set();
  const validateQuestion=q=>{
    if(!q || !text(q.prompt) || !Array.isArray(q.choices) || q.choices.length<2 || !q.choices.every(text) || !Number.isInteger(q.correctIndex) || q.correctIndex<0 || q.correctIndex>=q.choices.length || !text(q.explanation))throw new Error('Invalid challenge');
  };
  for(const area of pack.areas){
    if(!area || !text(area.id) || areaIds.has(area.id) || !text(area.title) || !Array.isArray(area.discoveries) || !area.discoveries.length || !Array.isArray(area.palette) || area.palette.length!==3 || !area.palette.every(text))throw new Error('Invalid area');
    areaIds.add(area.id);validateQuestion(area.connection);const orders=new Set();
    for(const item of area.discoveries){
      if(!item || !text(item.id) || item.id==='station' || ids.has(item.id) || !Number.isFinite(item.order) || orders.has(item.order) || !Number.isFinite(item.x) || !Number.isFinite(item.y))throw new Error('Invalid discovery');
      ids.add(item.id);orders.add(item.order);validateQuestion(item.question);
      if(!text(item.summary) || !text(item.title) || !text(item.date) || !text(item.theater))throw new Error('Missing discovery information');
      let source;try{source=new URL(item.source);}catch{throw new Error('Invalid discovery source');}
      if(source.protocol!=='https:')throw new Error('Invalid discovery source');
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
  const index = new Map(all.map(item=>[item.id,item]));
  const areaItems = new Map(pack.areas.map(area=>[area.id,new Set(area.discoveries.map(item=>item.id))]));
  const orderedItems = new Map(pack.areas.map(area=>[area.id,[...area.discoveries].sort((a,b)=>a.order-b.order).map(item=>item.id)]));
  return {
    pack, discovered, completed, attempts, timelines, connections,
    get areaIndex() { return areaIndex; },
    get area() { return pack.areas[areaIndex]; },
    get ready() { return this.area.discoveries.every(d => discovered.has(d.id)); },
    get finished() { return completed.size === pack.areas.length; },
    answer(id, choice) {
      const item = areaItems.get(this.area.id).has(id)?index.get(id):null;
      if (!item || discovered.has(id) || !Number.isInteger(choice) || !item.question.choices[choice]) return null;
      const count = (attempts.get(id) || 0) + 1;
      attempts.set(id, count);
      const correct = choice === item.question.correctIndex;
      if (correct) discovered.add(id);
      return {correct, firstTry: correct && count === 1, explanation: item.question.explanation};
    },
    checkTimeline(ids) {
      if (!this.ready || completed.has(this.area.id)) return null;
      const expected = orderedItems.get(this.area.id);
      if(!Array.isArray(ids) || ids.length!==expected.length || new Set(ids).size!==ids.length || !ids.every(id=>areaItems.get(this.area.id).has(id)))return null;
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
