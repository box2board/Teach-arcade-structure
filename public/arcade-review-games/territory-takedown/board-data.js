(function(){
const raw=[
['Westwatch Isle'],['Frostwood'],['White Peaks'],['Northmere'],['Pine Crown'],['Storm Cape'],['Westwood'],['Crown Village'],['Crown Lake'],['Amber Fields'],['Dawn Harbor'],['Mist Coast'],['Iron Hills'],['Green March'],['East Farms'],['Lake Country'],['Sunscar Desert'],['South Crown'],['Ember Coast'],['Northstar Isle'],['Seabreak Isle']
];
const adj=[[1,6],[0,2,6,7],[1,3,7,8],[2,4,8,9],[3,5,9,19],[4,9,10,19],[0,1,7,11],[1,2,6,8,12],[2,3,7,9,12,13],[3,4,5,8,10,13,14],[5,9,14],[6,12,16],[7,8,11,13,15],[8,9,12,14,15,17],[9,10,13,18,20],[12,13,16,17],[11,15],[13,15,18],[14,17,20],[4,5],[14,18]];
const specials={2:'shield',4:'double',7:'challenge',12:'stronghold',14:'shield',16:'double',18:'challenge',19:'shield',20:'double'};
// Coordinates are percentages of the uncropped artwork. IDs, edges and specials
// are gameplay contracts: alternate maps can relocate pieces without changing them.
const positions=[[11,12.5],[28,14],[45,12.5],[62,16],[78,14],[90,30],[16,35],[33,35],[50,36],[70,36],[90,53],[12,58],[32,56],[57,53],[78,67],[36,73],[14,77],[57,77],[74,86],[91.5,12.5],[91.5,86]];
const assetBase=new URL('.',document.currentScript?.src||'https://teacharcade.com/arcade-review-games/territory-takedown/');
window.TT_BOARD={mapName:'The Crownlands',image:new URL('assets/crownlands.webp',assetBase).href,width:1536,height:1024,territories:raw.map((r,i)=>({id:`t${i+1}`,name:r[0],x:positions[i][0],y:positions[i][1],adjacent:adj[i].map(j=>`t${j+1}`),special:specials[i]||null}))};
})();
