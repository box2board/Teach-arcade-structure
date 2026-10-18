/* Small-angle simple pendulum; explicit simulated stopwatch reaction offsets. */
const PendulumCore=(()=>{
const LENGTHS=[.25,.5,1],G=9.81,CYCLES=10;
function period(length){if(!Number.isFinite(length)||length<=0)throw Error('Positive length required');return 2*Math.PI*Math.sqrt(length/G)}
function measure(length,random=Math.random){if(!LENGTHS.includes(length))throw Error('Choose a tested length');const start=(random()-.5)*.3,stop=(random()-.5)*.3;const elapsed=Number((CYCLES*period(length)+stop-start).toFixed(2));return{length,cycles:CYCLES,elapsed,period:elapsed/CYCLES};}
function groups(rows){return LENGTHS.map(length=>{const rs=rows.filter(r=>r.length===length);return{length,n:rs.length,mean:rs.length?rs.reduce((s,r)=>s+r.period,0)/rs.length:null,min:rs.length?Math.min(...rs.map(r=>r.period)):null,max:rs.length?Math.max(...rs.map(r=>r.period)):null}})}
function complete(rows){return groups(rows).every(g=>g.n===3)&&rows.length===9}
function gravity(g){if(!g?.mean)throw Error('Measured group required');return 4*Math.PI*Math.PI*g.length/(g.mean*g.mean)}
return{LENGTHS,G,CYCLES,period,measure,groups,complete,gravity};})();
if(typeof module!=='undefined')module.exports=PendulumCore;
