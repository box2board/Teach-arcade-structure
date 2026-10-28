export const OPTIONS={face:['Bright','Focused','Easygoing'],hair:['Sweep','Crop','Bob','Ponytail','Mohawk'],graphic:['None','Bolt','Star','Arcade'],top:['Tee','Hoodie','Varsity'],bottom:['Chinos','Joggers','Shorts'],shoes:['Court','Runner','High-top'],animation:['Idle','Walk','Run','Jump','Wave','Celebrate']};
export const PALETTE=['#f1d0b1','#d9a477','#ad714f','#754832','#422b26','#202d39','#f4efe5','#337f79','#f4b544','#f07864','#7476b8','#365a91','#7c3aed','#ff4f9a','#00b8d9','#ff7a30','#b8e637','#ffd43b','#3d73ff','#f63862','#ffffff'];
export const DEFAULT={version:1,rig:'ta-humanoid-1',body:{height:1,torsoWidth:1,legLength:1,headScale:1},face:'Bright',eyeColor:'#355f58',brows:'Soft',skin:'#ad714f',hair:{style:'Sweep',color:'#302625'},top:{style:'Hoodie',primary:'#7c3aed',secondary:'#ffd43b',graphic:'Bolt',graphicColor:'#ffffff'},bottom:{style:'Chinos',color:'#25394b'},shoes:{style:'Court',color:'#f4efe5'},accessories:[],accessoryColor:'#e5ac48',animation:'Idle'};
export function validateRecipe(value){
 if(!value||typeof value!=='object'||value.version!==1||value.rig!=='ta-humanoid-1')throw Error('Use a version 1 Teach Arcade humanoid recipe.');
 const out=structuredClone(DEFAULT);
 const color=(v)=>{if(typeof v!=='string'||!/^#[\da-f]{6}$/i.test(v))throw Error('Colors must use six-digit hex values.');return v;};
 const pick=(key,v)=>{if(!OPTIONS[key].includes(v))throw Error(`Unknown ${key} option.`);return v;};
 for(const k of Object.keys(out.body)){const v=value.body?.[k];if(typeof v!=='number'||!Number.isFinite(v)||v<.85||v>1.15)throw Error(`${k} must be between 0.85 and 1.15.`);out.body[k]=v;}
 out.face=pick('face',value.face);out.animation=pick('animation',value.animation);out.brows=value.brows;if(!['Soft','Bold','Arched'].includes(out.brows))throw Error('Unknown eyebrow style.');
 for(const k of ['skin','eyeColor','accessoryColor'])out[k]=color(value[k]);
 for(const k of ['hair','top','bottom','shoes']){out[k].style=pick(k,value[k]?.style);for(const channel of Object.keys(out[k]).filter(x=>!['style','graphic','graphicColor'].includes(x)))out[k][channel]=color(value[k]?.[channel]);}
 out.top.graphic=pick('graphic',value.top?.graphic??'None');out.top.graphicColor=color(value.top?.graphicColor??'#ffffff');
 if(!Array.isArray(value.accessories)||value.accessories.length>4||value.accessories.some(x=>!['Glasses','Backpack','Headphones','Wristbands'].includes(x)))throw Error('Unknown accessory option.');out.accessories=[...new Set(value.accessories)];return out;
}
export function randomRecipe(){const r=structuredClone(DEFAULT),pick=a=>a[Math.floor(Math.random()*a.length)];const palettes=[['#7c3aed','#ffd43b','#252c3d'],['#00b8d9','#ff4f9a','#223657'],['#ff7a30','#ffffff','#365a91'],['#3d73ff','#b8e637','#202d39'],['#f63862','#ffd43b','#393446']];const p=pick(palettes);r.top.primary=p[0];r.top.secondary=p[1];r.bottom.color=p[2];r.skin=pick(PALETTE.slice(0,5));r.hair.color=pick(['#302625','#5b3727','#c6934e','#252126']);for(const k of ['hair','top','bottom','shoes'])r[k].style=pick(OPTIONS[k]);r.top.graphic=pick(OPTIONS.graphic);r.face=pick(OPTIONS.face);r.brows=pick(['Soft','Bold','Arched']);r.accessories=pick([[],['Glasses'],['Backpack'],['Glasses','Backpack'],['Headphones'],['Wristbands','Backpack']]);for(const k in r.body)r.body[k]=Math.round((.94+Math.random()*.12)*100)/100;return r;}

export const LOOKS=[
 {name:'Electric',colors:['#7c3aed','#ffd43b','#252c3d'],hair:'Mohawk',top:'Hoodie',graphic:'Bolt',extras:['Headphones']},
 {name:'Bubblegum',colors:['#ff4f9a','#00b8d9','#393446'],hair:'Ponytail',top:'Tee',graphic:'Star',extras:['Wristbands']},
 {name:'Sunburst',colors:['#ff7a30','#ffd43b','#365a91'],hair:'Sweep',top:'Varsity',graphic:'None',extras:['Glasses']},
 {name:'Pixel pop',colors:['#00b8d9','#b8e637','#252c3d'],hair:'Crop',top:'Tee',graphic:'Arcade',extras:['Headphones','Backpack']}
];
export function applyLook(recipe,look){const r=structuredClone(recipe);r.top={style:look.top,primary:look.colors[0],secondary:look.colors[1],graphic:look.graphic,graphicColor:'#ffffff'};r.bottom.color=look.colors[2];r.shoes.color=look.colors[1];r.hair.style=look.hair;r.accessories=[...look.extras];r.accessoryColor=look.colors[1];return validateRecipe(r);}
