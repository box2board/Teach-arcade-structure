/* Generic color-change teaching model, not an empirical chemical-recipe predictor. */
const RateCore=(()=>{
const TEMPERATURES=[20,30,40],R=8.314,EA=40000,TREF=303.15,ENDPOINT=.8,KREF=Math.log(5)/45;
const round=(v,n)=>Number(v.toFixed(n));
function constant(celsius){if(!Number.isFinite(celsius)||celsius<=-273.15)throw Error('Valid temperature required');return KREF*Math.exp(-EA/R*(1/(celsius+273.15)-1/TREF))}
function endpointTime(celsius){return-Math.log(1-ENDPOINT)/constant(celsius)}
function fresh(index){if(!Number.isInteger(index)||index<0||index>8)throw Error('Trial index must be 0–8');return{id:index+1,target:TEMPERATURES[Math.floor(index/3)],equilibrated:false,actualTemp:null,temperature:null,aAdded:false,started:false,measurement:null}}
function equilibrate(t,random=Math.random){if(t.equilibrated)throw Error('Already equilibrated');t.actualTemp=t.target+(random()-.5)*.4;t.temperature=round(t.actualTemp+(random()-.5)*.2,1);t.equilibrated=true;return t.temperature}
function addA(t){if(!t.equilibrated)throw Error('Equilibrate first');if(t.aAdded)throw Error('A already added');t.aAdded=true}
function start(t,random=Math.random){if(!t.equilibrated||!t.aAdded)throw Error('Equilibrate both aliquots and transfer A first');if(t.started)throw Error('Trial already started');t.started=true;const factor=1+(random()-.5)*.04;const time=round(endpointTime(t.actualTemp)/factor+(random()-.5)*.4,1);t.measurement={trial:t.id,target:t.target,temperature:t.temperature,time,index:1/time};return t.measurement}
function groups(rows){return TEMPERATURES.map(target=>{const rs=rows.filter(r=>r.target===target);return{target,n:rs.length,mean:rs.length?rs.reduce((s,r)=>s+r.time,0)/rs.length:null,meanIndex:rs.length?rs.reduce((s,r)=>s+r.index,0)/rs.length:null,min:rs.length?Math.min(...rs.map(r=>r.time)):null,max:rs.length?Math.max(...rs.map(r=>r.time)):null}})}
function complete(rows){return rows.length===9&&groups(rows).every(g=>g.n===3)}
return{TEMPERATURES,R,EA,TREF,ENDPOINT,KREF,constant,endpointTime,fresh,equilibrate,addA,start,groups,complete};})();
if(typeof module!=='undefined')module.exports=RateCore;
