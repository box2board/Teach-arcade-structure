/* Strong monoprotic acid / strong base teaching model at 25°C. */
const TitrationCore=(()=>{
const BASE=.100,SAMPLE=20,CAPACITY=25;
function createRun(random=Math.random){return{sampleActual:SAMPLE+(random()-.5)*.06,deliveryFactor:1+(random()-.5)*.004,volume:0,points:[],bracket:null};}
function ph(acidM,acidML,baseML){const difference=(acidM*acidML-BASE*baseML)/(acidML+baseML);const root=Math.sqrt(difference*difference+4e-14);const h=difference>=0?(difference+root)/2:2e-14/(root-difference);return-Math.log10(h);}
function measure(acidM,run,random=Math.random){const ideal=ph(acidM,run.sampleActual,run.volume*run.deliveryFactor);return{volume:run.volume,ph:Number(Math.max(0,Math.min(14,ideal+(random()-.5)*.04)).toFixed(2))};}
function bracket(points){for(let i=0;i<points.length;i++){const a=points[i];if(a.ph===7)return{lower:a.volume,upper:a.volume,estimate:a.volume};if(i&&points[i-1].ph<7&&a.ph>7){const lower=points[i-1].volume,upper=a.volume;return{lower,upper,estimate:(lower+upper)/2}}}return null;}
function concentration(endpointML){return BASE*endpointML/SAMPLE;}
function doseFor(run){return run.volume<10?5:.2;}
function add(acidM,run,random=Math.random){if(run.bracket)throw Error('Endpoint already bracketed');const dose=doseFor(run);if(run.volume+dose>CAPACITY+.001)throw Error('Burette capacity reached');run.volume=Number((run.volume+dose).toFixed(1));const point=measure(acidM,run,random);run.points.push(point);run.bracket=bracket(run.points);return point;}
function summary(trials){if(!trials.length)return null;const mean=trials.reduce((s,t)=>s+t.bracket.estimate,0)/trials.length;return{meanVolume:mean,concentration:concentration(mean),min:Math.min(...trials.map(t=>t.bracket.estimate)),max:Math.max(...trials.map(t=>t.bracket.estimate))};}
return{BASE,SAMPLE,CAPACITY,createRun,ph,measure,bracket,concentration,doseFor,add,summary};})();
if(typeof module!=='undefined')module.exports=TitrationCore;
