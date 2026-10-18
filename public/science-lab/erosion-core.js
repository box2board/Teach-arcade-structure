/* Prescribed sediment-yield teaching model; not a field-erosion forecast. */
const ErosionCore=(()=>{
const COVERS=['bare','mulch','planted'],NAMES={bare:'Bare soil',mulch:'Mulched soil',planted:'Planted soil'},PARAMETERS={soilG:500,rainML:100,rainMinutes:2,slopeDegrees:10,sourceHeightCM:20};
const round=n=>Number((Math.round(n*100)/100).toFixed(2));
function fresh(index,random=Math.random){if(!Number.isInteger(index)||index<0||index>8)throw Error('Trial index must be 0–8');return{id:index+1,cover:COVERS[Math.floor(index/3)],filterTrue:.5+(random()-.5)*.04,empty:null,sedimentTrue:null,loaded:null,rained:false,filtered:false,dried:false};}
function weighEmpty(t,random=Math.random){if(t.empty!==null)throw Error('Filter mass already recorded');t.empty=round(t.filterTrue+(random()-.5)*.01);return t.empty;}
function rain(t,random=Math.random){if(t.empty===null)throw Error('Weigh the dry filter first');if(t.rained)throw Error('Rain trial already complete');t.sedimentTrue={bare:2.5,mulch:1,planted:.3}[t.cover]*(1+(random()-.5)*.2);t.rained=true;}
function filter(t){if(!t.rained)throw Error('Collect runoff first');if(t.filtered)throw Error('Runoff already filtered');t.filtered=true;}
function dry(t){if(!t.filtered)throw Error('Filter the runoff first');t.dried=true;}
function weighLoaded(t,random=Math.random){if(!t.dried)throw Error('Dry the filter before final weighing');if(t.loaded!==null)throw Error('Final mass already recorded');t.loaded=round(t.filterTrue+t.sedimentTrue+(random()-.5)*.01);return{trial:t.id,cover:t.cover,empty:t.empty,loaded:t.loaded,sediment:round(t.loaded-t.empty),...PARAMETERS};}
function groups(rows){return COVERS.map(cover=>{const rs=rows.filter(r=>r.cover===cover);return{cover,name:NAMES[cover],n:rs.length,mean:rs.length?rs.reduce((sum,r)=>sum+r.sediment,0)/rs.length:null,min:rs.length?Math.min(...rs.map(r=>r.sediment)):null,max:rs.length?Math.max(...rs.map(r=>r.sediment)):null};});}
function reduction(bare,covered){if(!(bare>0))throw Error('Positive bare-soil reference required');return(bare-covered)/bare*100;}
function complete(rows){return groups(rows).every(g=>g.n===3);}
return{COVERS,NAMES,PARAMETERS,fresh,weighEmpty,rain,filter,dry,weighLoaded,groups,reduction,complete};})();
if(typeof module!=='undefined')module.exports=ErosionCore;
