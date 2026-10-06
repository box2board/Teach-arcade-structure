(function(){
  /* A single coherent fictional continent. Territory borders share the same
     vertices so the board reads as a political map instead of a tile grid. */
  const names=[
    'North Cape','Frost Coast','Highland Reach','Pine March','Storm Coast','Eastwatch',
    'Westhaven','Silver Vale','Crownlands','Rivermeet','Redwood','Sun Coast',
    'Mist Bay','Iron Hills','Heartland','King\'s Crossing','Amber Plains','Dawnshore',
    'Southwest Reach','Lake Country','Greenfields','Gold Ridge','Southmarch','Cape Ember'
  ];
  const specials={3:'shield',6:'double',9:'challenge',14:'stronghold',17:'shield',20:'double'};

  // Five shared border lines create one recognizable landmass with a north
  // peninsula, broad central basin and narrowing southern cape.
  const borders=[
    {y:58, xs:[168,252,348,452,556,660,748]},
    {y:178,xs:[104,218,338,458,578,700,816]},
    {y:300,xs:[66,194,326,458,590,722,850]},
    {y:422,xs:[112,226,344,462,580,698,812]},
    {y:542,xs:[190,278,370,462,554,646,730]}
  ];
  const shapes=[],labels=[];
  for(let r=0;r<4;r++){
    const a=borders[r],b=borders[r+1];
    for(let c=0;c<6;c++){
      // Small deterministic bends make internal borders feel hand-drawn while
      // preserving exact shared edges between neighboring provinces.
      const p1=[a.xs[c],a.y],p2=[a.xs[c+1],a.y],p3=[b.xs[c+1],b.y],p4=[b.xs[c],b.y];
      shapes.push(`${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]} ${p4[0]},${p4[1]}`);
      labels.push([Math.round((p1[0]+p2[0]+p3[0]+p4[0])/4),Math.round((a.y+b.y)/2)]);
    }
  }
  const adjacency=Array.from({length:24},(_,i)=>{
    const r=Math.floor(i/6),c=i%6,a=[];
    if(c)a.push(i-1);if(c<5)a.push(i+1);if(r)a.push(i-6);if(r<3)a.push(i+6);
    return a;
  });
  window.TT_BOARD={
    mapName:'The Crown Continent',
    territories:names.map((name,i)=>({
      id:`t${i+1}`,name,shape:shapes[i],label:labels[i],
      adjacent:adjacency[i].map(j=>`t${j+1}`),special:specials[i]||null
    }))
  };
})();
