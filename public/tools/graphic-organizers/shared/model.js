window.GOModel = (() => {
const templates = {
  "kwl-chart": {
    "name": "KWL Chart",
    "layout": "columns",
    "labels": [
      "What I know",
      "What I want to know",
      "What I learned"
    ],
    "fields": [
      "notesKnow",
      "notesWant",
      "notesLearned"
    ],
    "legacyKey": "teacharcade_kwl_chart_v1"
  },
  "venn-diagram": {
    "name": "Venn Diagram",
    "layout": "venn",
    "labels": [
      "Only topic A",
      "Both topics",
      "Only topic B"
    ],
    "fields": [
      "leftText",
      "overlapText",
      "rightText"
    ],
    "legacyKey": "teacharcade_venn_diagram_v1"
  },
  "frayer-model": {
    "name": "Frayer Model",
    "layout": "grid",
    "labels": [
      "Definition",
      "Characteristics",
      "Examples",
      "Non-examples"
    ],
    "fields": [
      "definition",
      "characteristics",
      "examples",
      "nonExamples"
    ],
    "legacyKey": "teacharcade_frayer_model_v1"
  },
  "t-chart": {
    "name": "T-Chart",
    "layout": "table",
    "labels": [
      "Column A",
      "Column B"
    ],
    "fields": [
      "a",
      "b"
    ],
    "legacyKey": "teacharcade_t_chart_v1"
  },
  "pros-cons": {
    "name": "Pros & Cons",
    "layout": "table",
    "labels": [
      "Pros",
      "Cons"
    ],
    "fields": [
      "pros",
      "cons"
    ],
    "legacyKey": "teacharcade_pros_cons_v1"
  },
  "cause-effect": {
    "name": "Cause & Effect",
    "layout": "branch",
    "labels": [
      "Cause",
      "Effect 1",
      "Effect 2",
      "Effect 3"
    ],
    "fields": [
      "cause"
    ],
    "legacyKey": "teacharcade_cause_effect_v1"
  },
  "main-idea-details": {
    "name": "Main Idea & Details",
    "layout": "branch",
    "labels": [
      "Main idea",
      "Detail 1",
      "Detail 2",
      "Detail 3"
    ],
    "fields": [
      "mainIdea"
    ],
    "legacyKey": "teacharcade_main_idea_details_v1"
  },
  "sequence-chart": {
    "name": "Sequence Chart",
    "layout": "sequence",
    "labels": [
      "First",
      "Next",
      "Then",
      "Finally"
    ],
    "fields": [],
    "legacyKey": "teacharcade_sequence_chart_v1"
  },
  "character-map": {
    "name": "Character Map",
    "layout": "grid",
    "labels": [
      "Traits",
      "Motivations",
      "Relationships",
      "Evidence",
      "Changes"
    ],
    "fields": [
      "traits",
      "motivations",
      "relationships",
      "evidence",
      "changes"
    ],
    "legacyKey": "teacharcade_character_map_v1"
  },
  "story-plot-diagram": {
    "name": "Story Plot Diagram",
    "layout": "plot",
    "labels": [
      "Exposition",
      "Rising action",
      "Climax",
      "Falling action",
      "Resolution"
    ],
    "fields": [
      "exposition",
      "rising",
      "climax",
      "falling",
      "resolution"
    ],
    "legacyKey": "teacharcade_story_plot_v1"
  },
  "vocabulary-organizer": {
    "name": "Vocabulary Organizer",
    "layout": "grid",
    "labels": [
      "Definition",
      "Sentence",
      "Example",
      "Non-example",
      "Sketch / visual description"
    ],
    "fields": [
      "definition",
      "sentence",
      "example",
      "nonExample",
      "sketch"
    ],
    "legacyKey": "teacharcade_vocabulary_organizer_v1"
  },
  "timeline-template": {
    "name": "Timeline",
    "layout": "sequence",
    "labels": [
      "Event 1",
      "Event 2",
      "Event 3",
      "Event 4"
    ],
    "fields": [],
    "legacyKey": "teacharcade_timeline_template_v1"
  }
};
const copy = value => JSON.parse(JSON.stringify(value));
const text = value => typeof value === 'string' ? value : '';
function fresh(template) {
 if (!templates[template]) throw new Error('Unknown template');
 const spec = templates[template];
 return {format:'teach-arcade-organizer',version:1,template,title:'',name:'',className:'',date:'',subject:'',accent:'blue',fontSize:16,
 headers:spec.layout==='table' ? [...spec.labels] : [],
 cards:spec.layout==='table' ? Array.from({length:4},()=>({label:'',text:'',cells:['','']})) : spec.labels.map(label=>({label,text:'',cells:[]})),archive:[]};
}
function validate(value) {
 if (!value || value.format!=='teach-arcade-organizer' || value.version!==1 || !templates[value.template]) throw new Error('Choose a Teach Arcade organizer project file.');
 if (!Array.isArray(value.cards) || !value.cards.length || value.cards.length>100) throw new Error('A project needs 1–100 sections.');
 const result=fresh(value.template);
 for(const key of ['title','name','className','date','subject']) {if(typeof value[key]!=='string' || value[key].length>20000) throw new Error('Invalid project text.'); result[key]=value[key];}
 if(!['blue','green','purple','slate'].includes(value.accent) || ![14,16,18,20].includes(value.fontSize)) throw new Error('Invalid project styling.');
 result.accent=value.accent; result.fontSize=value.fontSize;
 const strings = (list,max) => {if(!Array.isArray(list)||list.length>max||list.some(s=>typeof s!=='string'||s.length>20000))throw new Error('Invalid section text.');return [...list];};
 result.headers=strings(value.headers,2);
 if(templates[value.template].layout==='table' && result.headers.length!==2)throw new Error('A table needs two headings.');
 result.cards=value.cards.map(card=>{if(!card||typeof card.label!=='string'||typeof card.text!=='string'||card.label.length>20000||card.text.length>20000)throw new Error('Invalid section.');const cells=strings(card.cells,2);if(templates[value.template].layout==='table'&&cells.length!==2)throw new Error('A row needs two cells.');return {label:card.label,text:card.text,cells};});
 if(value.archive!==undefined) {if(!Array.isArray(value.archive)||value.archive.length>100)throw new Error('Too many saved words.');result.archive=value.archive.map(entry=>{const word={};for(const key of ['term','definition','sentence','example','nonExample','sketch']){word[key]=text(entry?.[key]);if(word[key].length>20000)throw new Error('Invalid saved word.');}return word;});}
 return result;
}
function migrate(template, old) {
 const p=fresh(template), spec=templates[template];
 if(!old || typeof old!=='object') return p;
 p.name=text(old.studentName);p.className=text(old.studentClass);p.date=text(old.studentDate);p.title=text(old.title);
 p.subject=text(old.term || old.characterName);
 if(spec.layout==='table') {
  p.headers=template==='t-chart' ? [text(old.headerA)||'Column A',text(old.headerB)||'Column B'] : [text(old.headerPros)||'Pros',text(old.headerCons)||'Cons'];
  if(Array.isArray(old.rows)&&old.rows.length)p.cards=old.rows.slice(0,100).map(row=>({label:'',text:'',cells:spec.fields.map(k=>text(row[k]))}));
 } else if(template==='sequence-chart'||template==='timeline-template') {
  const entries=old.steps||old.events;
  if(Array.isArray(entries)&&entries.length)p.cards=entries.slice(0,100).map(e=>({label:text(e.label||e.date),text:text(e.text),cells:[]}));
 } else if(spec.layout==='branch') {
  p.cards=[{label:spec.labels[0],text:text(old[spec.fields[0]]),cells:[]},...(Array.isArray(old.effects||old.details)?old.effects||old.details:['','','']).slice(0,99).map((s,i)=>({label:spec.labels[1].split(' ')[0]+' '+(i+1),text:text(s),cells:[]}))];
 } else {
  const data=template==='vocabulary-organizer' ? old.current||old : old;
  p.cards.forEach((c,i)=>c.text=text(data[spec.fields[i]]));
  if(template==='kwl-chart')p.cards.forEach((c,i)=>c.label=text(old[['labelKnow','labelWant','labelLearned'][i]])||c.label);
  if(template==='venn-diagram'){p.cards[0].label=text(old.leftLabel)||p.cards[0].label;p.cards[2].label=text(old.rightLabel)||p.cards[2].label;}
  if(template==='vocabulary-organizer'){p.subject=text(data.term);p.archive=Array.isArray(old.saved)?old.saved.slice(0,100).map(e=>({term:text(e.term),definition:text(e.definition),sentence:text(e.sentence),example:text(e.example),nonExample:text(e.nonExample),sketch:text(e.sketch)})):[];}
 }
 return p;
}
return {templates,fresh,validate,migrate,copy};
})();
