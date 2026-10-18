/* Fixed candidate values for this teaching model, not universal alloy specifications. */
const DensityCore=(()=>{
const MATERIALS={aluminum:{name:'Aluminum',density:2.70},steel:{name:'Steel',density:7.85},copper:{name:'Copper',density:8.96}};
const round=(v,n)=>Number(v.toFixed(n));
function unknown(random=Math.random){const ids=Object.keys(MATERIALS);return{material:ids[Math.min(ids.length-1,Math.floor(random()*ids.length))],volume:8+random()*4}}
function fresh(index){if(!Number.isInteger(index)||index<0||index>2)throw Error('Trial index must be 0–2');return{id:index+1,mass:null,initial:null,final:null,initialTrue:null,immersed:false};}
function weigh(sample,trial,random=Math.random){if(trial.mass!==null)throw Error('Already weighed');trial.mass=round(MATERIALS[sample.material].density*sample.volume+(random()-.5)*.01,2);return trial.mass}
function readInitial(trial,random=Math.random){if(trial.mass===null)throw Error('Weigh the dry sample first');if(trial.initial!==null)throw Error('Initial volume already recorded');trial.initialTrue=30+(random()-.5)*2;trial.initial=round(trial.initialTrue+(random()-.5)*.1,1);return trial.initial}
function immerse(trial){if(trial.initial===null)throw Error('Read initial volume first');if(trial.immersed)throw Error('Already immersed');trial.immersed=true;}
function finish(sample,trial,random=Math.random){if(!trial.immersed)throw Error('Fully submerge first');if(trial.final!==null)throw Error('Final volume already recorded');trial.final=round(trial.initialTrue+sample.volume+(random()-.5)*.1,1);const volume=round(trial.final-trial.initial,1);return{trial:trial.id,mass:trial.mass,initial:trial.initial,final:trial.final,volume,density:trial.mass/volume}}
function summary(rows){if(!rows.length)return null;return{n:rows.length,mean:rows.reduce((s,r)=>s+r.density,0)/rows.length,min:Math.min(...rows.map(r=>r.density)),max:Math.max(...rows.map(r=>r.density))}}
function nearest(rows){const s=summary(rows);return s?Object.entries(MATERIALS).sort((a,b)=>Math.abs(a[1].density-s.mean)-Math.abs(b[1].density-s.mean))[0][0]:null}
return{MATERIALS,unknown,fresh,weigh,readInitial,immerse,finish,summary,nearest};})();
if(typeof module!=='undefined')module.exports=DensityCore;
