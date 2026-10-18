/* Explicit teaching response, not an empirical predictor of real potato behavior. */
const OsmosisCore=(()=>{
const CONCENTRATIONS=[0,.3,.6],SOAK_MINUTES=30,TEMPERATURE_C=20;
const roundMass=m=>Number((Math.round(m*100)/100).toFixed(2));
function fresh(index,random=Math.random){if(!Number.isInteger(index)||index<0||index>8)throw Error('Sample index must be 0–8');return{id:index+1,concentration:CONCENTRATIONS[Math.floor(index/3)],initialTrue:5+(random()-.5)*.08,initial:null,finalTrue:null,final:null,blotted:false,soaked:false};}
function weighInitial(s,random=Math.random){if(s.initial!==null)throw Error('Initial mass already recorded');s.initial=roundMass(s.initialTrue+(random()-.5)*.01);return s.initial;}
function soak(s,random=Math.random){if(s.initial===null)throw Error('Weigh the fresh sample first');if(s.soaked)throw Error('Sample already soaked');const modeledPercent=(.3-s.concentration)*40+(random()-.5)*1.6;s.finalTrue=s.initialTrue*(1+modeledPercent/100);s.soaked=true;return s;}
function blot(s){if(!s.soaked)throw Error('Soak the sample first');s.blotted=true;}
function weighFinal(s,random=Math.random){if(!s.soaked||!s.blotted)throw Error('Blot the soaked sample before weighing');if(s.final!==null)throw Error('Final mass already recorded');s.final=roundMass(s.finalTrue+(random()-.5)*.01);return{sample:s.id,concentration:s.concentration,initial:s.initial,final:s.final,change:percent(s.initial,s.final),minutes:SOAK_MINUTES,temperature:TEMPERATURE_C,blotted:true};}
function percent(initial,final){if(!(initial>0)||!Number.isFinite(final))throw Error('Valid masses required');return(final-initial)/initial*100;}
function groups(rows){return CONCENTRATIONS.map(c=>{const rs=rows.filter(r=>Math.abs(r.concentration-c)<1e-8);return{concentration:c,n:rs.length,rows:rs,mean:rs.length?rs.reduce((sum,r)=>sum+r.change,0)/rs.length:null,min:rs.length?Math.min(...rs.map(r=>r.change)):null,max:rs.length?Math.max(...rs.map(r=>r.change)):null};});}
function complete(rows){return groups(rows).every(g=>g.n===3);}
return{CONCENTRATIONS,SOAK_MINUTES,TEMPERATURE_C,fresh,weighInitial,soak,blot,weighFinal,percent,groups,complete};})();
if(typeof module!=='undefined')module.exports=OsmosisCore;
