/* Optional writing prompts; all evidence comes from the student's saved run. */
const ConclusionGuide=(()=>{
function content(kind,rows){
  const prompts={
    rate:['Which tested temperature reached the same endpoint fastest?','Compare two mean times in seconds and identify their bath temperatures.','Explain the role of particle energies and the fraction able to overcome the activation barrier. Does warming remove that barrier?','Which variables and endpoint were controlled? Could you assume these times or the same temperature multiplier for another real reaction?'],
    density:['Which candidate best matches your measured mean density?','Compare your mean and observed range with a reference density, in g/cm³.','Explain why final minus initial water volume gives sample volume, then why mass divided by volume helps compare materials.','What would a bubble, water on the sample, or another material with similar density do to your conclusion?'],
    pendulum:['How did tested length affect the measured period?','Compare two lengths using mean periods in seconds. What happened when length increased fourfold?','For a small-angle pendulum, period is proportional to the square root of length. Connect that relationship to your measurements.','What did this model assume about the string, drag, and release angle? Does changing only length test whether mass matters?'],
    circuit:['Which tested resistor would you recommend for the stated current and power limits?','Compare two tested resistances using current values, and check power against the limit.','Use the relationship between voltage, resistance, and current to explain the trend.','What could change with a different supply voltage or a real resistor that heats up?'],
    chemistry:['What acid concentration does your average endpoint suggest?','Use your average endpoint and concentration, then compare the three endpoint estimates.','Explain the 1:1 acid–base relationship and how smaller doses narrowed the neutral-point interval.','Why is the interval midpoint an estimate? Would this method apply unchanged to every acid?'],
    biology:['Which tested solution produced the least net mass change in this tissue model?','Compare two concentrations using mean percentage changes. Keep the positive or negative sign.','Explain the net movement of water across selectively permeable membranes. Does near-zero mass change mean water stopped moving?','Why might real tissue or a different soak time produce different results?'],
    earth:['Which tested ground cover would you recommend to reduce transported sediment under these conditions?','Compare the mean captured sediment for two covers, using grams.','Explain how cover can reduce soil detachment or transport, and why the filter had to be dry.','Name a real-slope condition this model did not test. Does captured sediment measure every form of soil loss?']
  };
  let evidence='No completed measurements yet.';
  if(rows.length){
    if(kind==='rate')evidence=RateCore.groups(rows).filter(g=>g.n).map(g=>`${g.target}°C: mean endpoint time ${g.mean.toFixed(1)} s; ${g.n} fresh trials`).join(' · ');
    if(kind==='density'){const s=DensityCore.summary(rows);evidence=`${s.n} repeats of one sample: mean density ${s.mean.toFixed(2)} g/cm³; observed range ${s.min.toFixed(2)}–${s.max.toFixed(2)} g/cm³.`;}
    if(kind==='pendulum')evidence=PendulumCore.groups(rows).filter(g=>g.n).map(g=>`${g.length*100} cm: mean period ${g.mean.toFixed(3)} s; ${g.n} trials`).join(' · ');
    if(kind==='circuit')evidence=CircuitCore.groups(rows).map(g=>`${g.resistance} Ω: mean ${g.meanMA.toFixed(1)} mA; power ${(g.meanV*g.meanMA/1000).toFixed(3)} W; ${g.n} readings`).join(' · ');
    if(kind==='chemistry'){const s=TitrationCore.summary(rows);evidence=`${rows.length} trials: average endpoint ${s.meanVolume.toFixed(2)} mL; estimated acid concentration ${s.concentration.toFixed(3)} M; endpoints ${s.min.toFixed(2)}–${s.max.toFixed(2)} mL.`;}
    if(kind==='biology')evidence=OsmosisCore.groups(rows).filter(g=>g.n).map(g=>`${g.concentration.toFixed(1)} M: mean ${g.mean>=0?'+':''}${g.mean.toFixed(1)}% mass change; ${g.n} samples`).join(' · ');
    if(kind==='earth')evidence=ErosionCore.groups(rows).filter(g=>g.n).map(g=>`${g.name}: mean ${g.mean.toFixed(2)} g captured sediment; ${g.n} trials`).join(' · ');
  }
  return {evidence,prompts:prompts[kind]};
}
function update(kind,rows){const data=content(kind,rows);for(const [id,text]of [['conclusionEvidence',data.evidence],...['Claim','Compare','Reason','Limit'].map((name,i)=>['conclusion'+name,data.prompts[i]])]){const el=document.getElementById(id);if(el)el.textContent=text;}}
return{content,update};
})();
