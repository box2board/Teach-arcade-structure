/* Reads saved evidence only. Never grades writing or changes lab storage. */
const LabReport=(()=>{
const labs={
 rate:{key:'science-lab-temperature-rate-v1',page:'rate-investigation.html',title:'Race to the same color',total:9,field:'rows'},
 density:{key:'science-lab-density-v1',page:'density-investigation.html',title:'Identify the metal',total:3,field:'rows'},
 pendulum:{key:'science-lab-pendulum-v1',page:'pendulum-investigation.html',title:'What sets the swing?',total:9,field:'rows'},
 circuit:{key:'science-lab-circuit-intro-v1',page:'circuit-investigation.html',title:'Which resistor works best?',total:9,field:'trials'},
 chemistry:{key:'science-lab-titration-v1',page:'chemistry-investigation.html',title:'Identify the unknown acid',total:3,field:'trials'},
 biology:{key:'science-lab-tissue-osmosis-v1',page:'biology-investigation.html',title:'Where does the water go?',total:9,field:'rows'},
 earth:{key:'science-lab-erosion-v1',page:'earth-investigation.html',title:'Keep the soil in place',total:9,field:'rows'}
};
const f=(v,n=2)=>Number.isFinite(v)?v.toFixed(n):'—';
const answer=v=>v===undefined||v===null||String(v).trim()===''?'Not provided':String(v);
const option=(v,map)=>map[v]||answer(v);
function build(kind,state){
 const config=labs[kind];if(!config)throw Error('Unknown lab');
 const rows=state[config.field]??[];if(!Array.isArray(rows))throw Error('Invalid saved measurements');
 const report={...config,count:rows.length,fields:[],tables:[],limits:'',conditions:''};
 const add=(title,headers,data)=>report.tables.push({title,headers,rows:data});
 const trends={decrease:'More resistance → less current.',increase:'More resistance → more current.',same:'Resistance does not affect current.'};
 if(kind==='rate'){
  report.conditions='Three fresh mixtures at each bath target (20, 30, 40°C). Both 5.0 mL aliquots A/B and the flask equilibrated before mixing. Same formulations, volumes, mixing method, apparatus, and color threshold. Automatic timer starts on B contacting A and stops at 80% modeled conversion, not complete reaction. Animation is compressed.';
  add('Raw endpoint measurements',['Trial','Target (°C)','Measured (°C)','Endpoint time (s)','1/time (s⁻¹)'],rows.map(r=>[r.trial,r.target,f(r.temperature,1),f(r.time,1),f(r.index,4)]));
  add('Group comparison',['Bath target (°C)','n','Mean time (s)','Observed range (s)','Mean 1/time (s⁻¹)'],RateCore.groups(rows).filter(g=>g.n).map(g=>[g.target,g.n,f(g.mean,1),`${f(g.min,1)}–${f(g.max,1)}`,f(g.meanIndex,4)]));
  report.fields=[['Prediction',option(state.prediction,{faster:'Less time to the same endpoint when warmer.',slower:'More time to the same endpoint when warmer.',same:'Temperature does not change time.'})],['Shortest-time target',state.choice?state.choice+'°C':'Not provided'],['Energy explanation',option(state.reason,{energy:'A greater fraction of particles can overcome the activation barrier.',barrier:'Warming removes the activation barrier.',concentration:'Warming automatically doubles concentration.'})],['Optional trial-1 relative index',state.calculation?state.calculation+' s⁻¹':'Not provided']];
  report.limits='Generic prescribed color-change model, not a named chemical recipe or empirical data. Effective first-order conversion p=1−exp(−kt); threshold p=0.80. k=k30 exp[−40000/8.314 × (1/(T+273.15)−1/303.15)], k30=ln(5)/45 s⁻¹. Chosen activation parameter 40 kJ/mol is not inferred from student data. Actual temperature varies ±0.2°C; probe noise ±0.1°C rounded to 0.1°C; trial rate factor ±2%; endpoint timing offset ±0.2 s rounded to 0.1 s. Ideal mixing/thermal control; no heat release, probe lag, or subjective endpoint. 1/time is an endpoint comparison index, not mol/L/s or independently measured k. This model does not justify a universal rate multiplier per 10°C.';
 }
 if(kind==='density'){
  report.conditions='Three repeat measurements of the same dry, nonporous, insoluble model sample at 20°C. Zero balance, weigh dry sample, read initial water, fully submerge without bubbles, read final water. Volume = final − initial; density = dry mass ÷ displaced volume. Recover/dry sample and reset cylinder between repeats.';
  add('Raw measurements',['Trial','Dry mass (g)','Initial (mL)','Final (mL)','Displaced (mL)','Density (g/cm³)'],rows.map(r=>[r.trial,f(r.mass),f(r.initial,1),f(r.final,1),f(r.volume,1),f(r.density)]));
  const s=DensityCore.summary(rows);if(s)add('Summary of one sample’s repeated measurements',['n','Mean density (g/cm³)','Observed range (g/cm³)'],[[s.n,f(s.mean),`${f(s.min)}–${f(s.max)}`]]);
  add('Fixed reference values for model candidates',['Candidate','Density (g/cm³)'],Object.values(DensityCore.MATERIALS).map(m=>[m.name,f(m.density)]));
  report.fields=[['Prediction',option(state.prediction,{shape:'Displacement measures volume even with an irregular shape.',mass:'Water level directly tells us mass.',color:'Water changes the metal’s identity.'})],['Recommended candidate',option(state.choice,Object.fromEntries(Object.entries(DensityCore.MATERIALS).map(([id,m])=>[id,m.name])))],['Why subtract initial water?',option(state.reason,{object:'To find the water rise caused by the sample alone.',total:'To measure water mass.',zero:'Every sample has zero volume initially.'})],['Optional trial-1 density calculation',state.calculation?state.calculation+' g/cm³':'Not provided']];
  report.limits='Homogeneous sample; true volume 8–12 mL; candidate densities fixed at aluminum 2.70, steel 7.85, copper 8.96 g/cm³. Balance noise ±0.005 g rounded to 0.01 g. True initial water volume 30 ±1 mL; independent initial/final reading noise ±0.05 mL rounded to 0.1 mL. No bubbles, absorption, dissolution, water loss, residual surface water, or thermal expansion. Drying and immersion are guided/automatic. These are repeated readings of one sample, not independent specimens. Density supports identification among candidates; it does not prove a real composition or alloy.';
 }
 if(kind==='pendulum'){
  report.conditions='Change prepared pivot-to-bob-center length (25, 50, 100 cm); keep bob mass 100 g, release angle 10° without a push, gravity 9.81 m/s². Three repeats per length; ten complete cycles per trial. Short time-lapse, not real-time animation.';
  add('Raw timing evidence',['Trial','Length (cm)','Full cycles','Total time (s)','Period (s)'],rows.map((r,i)=>[i+1,r.length*100,r.cycles,f(r.elapsed),f(r.period,3)]));
  add('Group summary',['Length (cm)','n','Mean period (s)','Observed range (s)'],PendulumCore.groups(rows).filter(g=>g.n).map(g=>[g.length*100,g.n,f(g.mean,3),`${f(g.min,3)}–${f(g.max,3)}`]));
  report.fields=[['Prediction',option(state.prediction,{longer:'Each swing takes longer.',shorter:'Each swing takes less time.',same:'Each swing takes the same time.'})],['Longest-period choice',state.choice?Number(state.choice)*100+' cm':'Not provided'],['100 cm versus 25 cm period',option(state.reason,{double:'Twice as long.',quadruple:'Four times as long.',half:'Half as long.'})],['Optional gravity estimate',state.calculation?state.calculation+' m/s²':'Not provided']];
  report.limits='Small-angle ideal model: T = 2π√(L/g). Exact prepared lengths; massless inextensible string; point-mass bob; no drag, damping, friction, or amplitude correction. Start/stop reaction offsets independently vary within ±0.15 s; elapsed time rounds to 0.01 s. Period = elapsed time/10. Reaction variation is simulated, not measured from student clicks. Display precision does not remove timing uncertainty. Only length was tested: these trials cannot establish mass or angle effects.';
 }
 if(kind==='circuit'){
  report.conditions='Change nominal resistance (40, 70, 100 Ω); hold supply at 3 V. Three readings per resistor. Design target: 35–55 mA and load power ≤0.250 W.';
  add('Raw measurements',['Reading','Resistance (Ω)','Voltage (V)','Current (mA)'],rows.map((r,i)=>[i+1,r.resistance,f(r.voltage),r.currentMA]));
  add('Group summary',['Resistance (Ω)','n','Mean current (mA)','Current range (mA)','Power (W)'],CircuitCore.groups(rows).map(g=>[g.resistance,g.n,f(g.meanMA,1),`${g.minMA}–${g.maxMA}`,f(g.meanV*g.meanMA/1000,3)]));
  report.fields=[['Prediction',option(state.prediction,trends)],['Recommended resistor',state.choice?state.choice+' Ω':'Not provided'],['Observed relationship',option(state.reason,trends)]];
  report.limits='Ideal wires and meters; fixed +2% resistor tolerance; supply variation ±0.2%; voltage noise ±0.005 V (0.01 V resolution), current noise ±0.5 mA (1 mA resolution). Instruments zero automatically. Heating and a real warning module are not modeled.';
 }
 if(kind==='chemistry'){
  report.conditions='Strong monoprotic acid / strong base, 25°C ideal model. Fresh nominal 20.0 mL acid aliquot each trial; 0.100 M NaOH. Doses decrease from 5.0 mL to 0.2 mL after 10.0 mL.';
  rows.forEach((t,i)=>add('Trial '+(i+1)+' · pH observations',['Base added (mL)','pH'],t.points.map(p=>[f(p.volume,1),f(p.ph)])));
  add('Completed trial endpoints',['Trial','Lower bound (mL)','Upper bound (mL)','Midpoint (mL)','Estimated acid (M)'],rows.map((t,i)=>[i+1,f(t.bracket.lower,1),f(t.bracket.upper,1),f(t.bracket.estimate),f(TitrationCore.concentration(t.bracket.estimate),3)]));
  const s=TitrationCore.summary(rows);if(s)add('Summary of completed trials',['n','Mean endpoint (mL)','Endpoint range (mL)','Estimated acid (M)'],[[rows.length,f(s.meanVolume),`${f(s.min)}–${f(s.max)}`,f(s.concentration,3)]]);
  if(rows.length<3&&state.run?.points?.length)add('Current trial · not yet saved as a completed trial',['Base added (mL)','pH'],state.run.points.map(p=>[f(p.volume,1),f(p.ph)]));
  report.fields=[['Prediction',option(state.prediction,{more:'More base to reach the neutral point.',less:'Less base to reach the neutral point.',same:'The same amount of base.'})],['Why smaller doses?',option(state.precision,{precision:'To narrow the interval containing the neutral point.',concentration:'To change the concentration of the base.',color:'To make the indicator brighter.'})],['Optional calculated acid concentration',state.calculation?state.calculation+' M':'Not provided']];
  report.limits='Endpoint midpoint is an estimate, not an exact equivalence-volume measurement. Sample aliquot varies ±0.03 mL; trial-specific delivery factor ±0.2%; pH noise ±0.02 (0.01 resolution). Nominal base-volume display resolves 0.1 mL. Mixing and calibration are automatic. Complete dissociation and additive volumes assumed; activity effects, indicator volume, carbonate, and temperature changes omitted.';
 }
 if(kind==='biology'){
  report.conditions='Change sucrose concentration (0.0, 0.3, 0.6 M). Three fresh similar-sized potato cylinders per solution; 100 mL fresh bath, 20°C, modeled 30-minute soak, consistent gentle blotting before final weighing.';
  add('Raw measurements',['Sample','Sucrose (M)','Initial mass (g)','Final mass (g)','Mass change (%)'],rows.map(r=>[r.sample,f(r.concentration,1),f(r.initial),f(r.final),f(r.change,1)]));
  add('Group summary',['Sucrose (M)','n','Mean change (%)','Observed range (%)'],OsmosisCore.groups(rows).filter(g=>g.n).map(g=>[f(g.concentration,1),g.n,f(g.mean,1),`${f(g.min,1)}–${f(g.max,1)}`]));
  report.fields=[['Prediction',option(state.prediction,{lose:'Tissue may lose water and mass.',gain:'Tissue will always gain mass.',unchanged:'Solution concentration cannot affect mass.'})],['Least-change solution',state.choice!==''&&state.choice!=null?state.choice+' M':'Not provided'],['Why mass decreased',option(state.reason,{water:'Net water movement was out of the tissue.',sugar:'All the tissue’s sugar dissolved away.',none:'Water molecules stopped moving.'})],['Optional sample-1 mass-change calculation',state.calculation?state.calculation+'%':'Not provided']];
  report.limits='Prescribed response, not empirical potato data: expected mass change = 40 × (0.3 − concentration in M) percent, plus ±0.8 percentage points sample variation. Initial true mass 5.00 ±0.04 g; weighing noise ±0.005 g, rounded to 0.01 g. Transport kinetics, solute entry, turgor, and metabolism are not calculated. Near-zero change at 0.3 M is a model feature, not universal for potatoes.';
 }
 if(kind==='earth'){
  report.conditions='Change cover (bare, straw-mulched, planted). Three fresh trays each. Same soil type, preparation and moisture, 500 g soil, tray area, 10° slope, 100 mL rain over two modeled minutes from 20 cm. Weigh clean dry filter and dry loaded filter.';
  add('Raw measurements',['Trial','Cover','Dry filter (g)','Dry filter + sediment (g)','Sediment (g)'],rows.map(r=>[r.trial,ErosionCore.NAMES[r.cover],f(r.empty),f(r.loaded),f(r.sediment)]));
  add('Group summary',['Cover','n','Mean sediment (g)','Observed range (g)'],ErosionCore.groups(rows).filter(g=>g.n).map(g=>[g.name,g.n,f(g.mean),`${f(g.min)}–${f(g.max)}`]));
  report.fields=[['Predicted least sediment transport',option(state.prediction,ErosionCore.NAMES)],['Recommended cover',option(state.choice,ErosionCore.NAMES)],['Why dry the filter?',option(state.reason,{water:'To avoid counting remaining water as sediment.',color:'To make the sediment look darker.',soil:'To remove all sediment from the filter.'})],['Optional bare-to-planted reduction calculation',state.calculation?state.calculation+'%':'Not provided']];
  report.limits='Prescribed sediment yields, not field data: bare 2.5 g, mulch 1.0 g, planted 0.3 g, each ±10%. Filter true mass 0.50 ±0.02 g; weighing noise ±0.005 g, rounded to 0.01 g. All transported soil is captured and water removed completely. Splash outside the collector, dissolved solids, cover fragments, infiltration, runoff volume, and real drying kinetics are not modeled.';
 }
 report.fields.push(['Student explanation — teacher review required',answer(state.explanation)]);return report;
}
function element(tag,text){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;}
function render(report){
 document.getElementById('reportTitle').textContent=report.title;
 document.title=report.title+' · Lab Report';document.getElementById('returnLab').href=report.page;
 document.getElementById('reportStatus').textContent=`${report.count}/${report.total} completed measurements or trials. ${report.count<report.total?'Partial investigation — collection is incomplete.':'Data collection complete.'} Written explanation has not been graded.`;
 document.getElementById('reportIdentity').hidden=false;
 const host=document.getElementById('reportContent');
 const conditions=element('section');conditions.append(element('h2','Question and controlled conditions'),element('p',report.conditions));host.append(conditions);
 for(const t of report.tables){const wrap=element('div');wrap.className='scroll';const table=element('table');table.append(element('caption',t.title));const head=element('thead'),hr=element('tr');t.headers.forEach(h=>{const th=element('th',h);th.scope='col';hr.append(th)});head.append(hr);table.append(head);const body=element('tbody');if(!t.rows.length){const tr=element('tr'),td=element('td','No completed measurements yet.');td.colSpan=t.headers.length;tr.append(td);body.append(tr)}for(const row of t.rows){const tr=element('tr');row.forEach(value=>tr.append(element('td',String(value))));body.append(tr)}table.append(body);wrap.append(table);host.append(wrap)}
 const section=element('section'),dl=element('dl');section.append(element('h2','Student responses'));for(const [label,value]of report.fields)dl.append(element('dt',label),element('dd',answer(value)));section.append(dl);host.append(section);
 const limits=element('section');limits.append(element('h2','Model limitations'),element('p',report.limits),element('p','Observed minimum–maximum ranges describe these repeats; they are not confidence intervals.'));host.append(limits);
 const note=element('p','Teacher review: Check whether the claim answers the question, numerical evidence supports it, the reasoning explains the science, and the student identifies an appropriate limit. No automatic writing score is assigned.');note.className='notice';host.append(note);
 document.getElementById('printReport').disabled=false;
}
function init(){const kind=new URLSearchParams(location.search).get('lab'),config=labs[kind];if(!config){document.getElementById('reportStatus').textContent='Choose a printable report from a guided lab.';return}document.getElementById('returnLab').href=config.page;try{const saved=localStorage.getItem(config.key);if(!saved){document.getElementById('reportStatus').textContent='No saved investigation was found in this browser. Return to the lab to begin.';return}const state=JSON.parse(saved);if(!state||typeof state!=='object')throw Error('Invalid saved data');render(build(kind,state));}catch{document.getElementById('reportStatus').textContent='The saved report could not be read. Return to the lab; your saved progress has not been changed.';}document.getElementById('printReport').onclick=()=>window.print();}
return{build,labs,init};
})();
if(typeof module!=='undefined')module.exports=LabReport;else LabReport.init();
