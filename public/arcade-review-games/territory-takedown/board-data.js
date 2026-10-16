(function(){
const raw=[
['Westwatch Isle',[111,166]],
['Frostwood',[362,172]],
['White Peaks',[643,174]],
['Northmere',[913,197]],
['Pine Crown',[1140,218]],
['Storm Cape',[1350,248]],
['Westwood',[277,345]],
['Crown Village',[554,344]],
['Crown Lake',[819,395]],
['Amber Fields',[1048,390]],
['Dawn Harbor',[1325,500]],
['Mist Coast',[224,525]],
['Iron Hills',[514,524]],
['Green March',[923,585]],
['East Farms',[1221,650]],
['Lake Country',[513,689]],
['Sunscar Desert',[251,759]],
['South Crown',[879,765]],
['Ember Coast',[1169,813]],
['Northstar Isle',[1295,66]],
['Seabreak Isle',[1426,804]]
];
const adj=[[1,6],[0,2,6,7],[1,3,7,8],[2,4,8,9],[3,5,9,19],[4,9,10,19],[0,1,7,11],[1,2,6,8,12],[2,3,7,9,12,13],[3,4,5,8,10,13,14],[5,9,14],[6,12,16],[7,8,11,13,15],[8,9,12,14,15,17],[9,10,13,18,20],[12,13,16,17],[11,15],[13,15,18],[14,17,20],[4,5],[14,18]];
const specials={2:'shield',4:'double',7:'challenge',12:'stronghold',14:'shield',16:'double',18:'challenge',19:'shield',20:'double'};
window.TT_BOARD={
 mapName:'The Crownlands',
 viewBox:'0 0 1536 1024',
 mapImage:'territory-takedown-map.png',
 territories:raw.map((r,i)=>({id:`t${i+1}`,name:r[0],label:r[1],adjacent:adj[i].map(j=>`t${j+1}`),special:specials[i]||null}))
};
})();