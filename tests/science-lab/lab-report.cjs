const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const context={module:{exports:{}},URLSearchParams};vm.createContext(context);for(const file of ['rate-core','density-core','pendulum-core','circuit-core','titration-core','osmosis-core','erosion-core','lab-report'])vm.runInContext(fs.readFileSync('public/science-lab/'+file+'.js','utf8'),context);const run=s=>vm.runInContext(s,context);
run(`const circuitRows=[40,70,100].flatMap(r=>Array.from({length:3},()=>CircuitCore.measure(3,r,()=>.5)));
const bioRows=Array.from({length:9},(_,i)=>{const s=OsmosisCore.fresh(i,()=>.5);OsmosisCore.weighInitial(s,()=>.5);OsmosisCore.soak(s,()=>.5);OsmosisCore.blot(s);return OsmosisCore.weighFinal(s,()=>.5)});
const earthRows=Array.from({length:9},(_,i)=>{const t=ErosionCore.fresh(i,()=>.5);ErosionCore.weighEmpty(t,()=>.5);ErosionCore.rain(t,()=>.5);ErosionCore.filter(t);ErosionCore.dry(t);return ErosionCore.weighLoaded(t,()=>.5)});
const trial=()=>({points:[{volume:0,ph:1.1},{volume:14.8,ph:4.2},{volume:15,ph:7}],bracket:{lower:15,upper:15,estimate:15}});
const states={rate:{rows:Array.from({length:9},(_,i)=>{const t=RateCore.fresh(i);RateCore.equilibrate(t,()=>.5);RateCore.addA(t);return RateCore.start(t,()=>.5)}),choice:'40',reason:'energy'},density:{rows:Array.from({length:3},(_,i)=>{const sample={material:'steel',volume:10},t=DensityCore.fresh(i);DensityCore.weigh(sample,t,()=>.5);DensityCore.readInitial(t,()=>.5);DensityCore.immerse(t);return DensityCore.finish(sample,t,()=>.5)}),choice:'steel'},pendulum:{rows:[.25,.5,1].flatMap(length=>Array.from({length:3},()=>PendulumCore.measure(length,()=>.5))),choice:'1',reason:'double',calculation:'9.81'},circuit:{trials:circuitRows,explanation:'<img src=x onerror=alert(1)>',choice:'70'},chemistry:{trials:[trial(),trial(),trial()],run:trial()},biology:{rows:bioRows,choice:'0',calculation:'0'},earth:{rows:earthRows,prediction:'planted'}};`);
for(const kind of ['rate','density','pendulum','circuit','chemistry','biology','earth']){const r=run(`LabReport.build('${kind}',states.${kind})`);assert.equal(r.count,['chemistry','density'].includes(kind)?3:9);assert.ok(r.tables.length>=2);assert.ok(r.limits.length>100);assert.ok(r.fields.at(-1)[0].includes('teacher review'));assert.equal(run(`LabReport.build('${kind}',{}).count`),0);}
assert.equal(run("LabReport.build('rate',states.rate).fields[1][1]"),'40°C');
assert.equal(run("LabReport.build('rate',states.rate).tables[0].rows[3][3]"),'45.0');
assert.equal(run("LabReport.build('density',states.density).tables[0].rows[0][4]"),'10.0');
assert.equal(run("LabReport.build('density',states.density).fields[1][1]"),'Steel');
assert.equal(run("LabReport.build('pendulum',states.pendulum).fields[1][1]"),'100 cm');
assert.equal(run("LabReport.build('pendulum',states.pendulum).tables[0].rows[0][2]"),10);
assert.ok(run("LabReport.build('circuit',states.circuit).tables[1].rows[1].includes('42.0')"));
assert.equal(run("LabReport.build('chemistry',states.chemistry).tables.length"),5,'last saved trial must not be duplicated as current');
assert.equal(run("LabReport.build('chemistry',{trials:[],run:trial()}).tables.at(-1).rows.length"),3);
assert.equal(run("LabReport.build('biology',states.biology).fields[1][1]"),'0 M');
assert.equal(run("LabReport.build('biology',states.biology).fields[3][1]"),'0%');
assert.equal(run("LabReport.build('earth',states.earth).fields[0][1]"),'Planted soil');
assert.throws(()=>run("LabReport.build('biology',{rows:{}})"));
class El{constructor(tag){this.tag=tag;this.children=[];this.textContent='';this.disabled=true;this.hidden=true;}append(...els){this.children.push(...els)}}
let nodes,stored,printCount=0;function setup(value,kind='circuit'){nodes=Object.fromEntries(['reportTitle','returnLab','reportStatus','reportIdentity','reportContent','printReport'].map(id=>[id,new El(id)]));stored=value;context.document={getElementById:id=>nodes[id],createElement:tag=>new El(tag)};context.location={search:'?lab='+kind};context.localStorage={getItem:()=>stored,setItem:()=>assert.fail('report must not mutate storage')};context.window={print:()=>printCount++};run('LabReport.init()')}
setup(run('JSON.stringify(states.circuit)'));assert.equal(nodes.printReport.disabled,false);assert.ok(nodes.reportStatus.textContent.includes('not been graded'));nodes.printReport.onclick();assert.equal(printCount,1);
const textOf=el=>el.textContent+' '+el.children.map(textOf).join(' ');assert.ok(textOf(nodes.reportContent).includes('<img src=x onerror=alert(1)>'));const tags=el=>[el.tag,...el.children.flatMap(tags)];assert.ok(!tags(nodes.reportContent).includes('img'),'student text must never become markup');
setup(null);assert.ok(nodes.reportStatus.textContent.includes('No saved'));assert.equal(nodes.printReport.disabled,true);
setup('{bad');assert.ok(nodes.reportStatus.textContent.includes('could not be read'));assert.equal(nodes.printReport.disabled,true);
setup('{}');assert.ok(nodes.reportStatus.textContent.includes('Partial'));assert.ok(textOf(nodes.reportContent).includes('Not provided'));
setup('{}','invalid');assert.equal(nodes.printReport.disabled,true);
console.log('PASS: seven report models, exact evidence, partial/absent/corrupt storage, zero answers, no duplicate chemistry trial, print action, safe student text, read-only storage.');
