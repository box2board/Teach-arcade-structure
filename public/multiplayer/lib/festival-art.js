import {createDistrictProp} from './district-landmarks.js';
import * as T from '../../mini-games/vendor/three.module.js';
import {createArtKit} from './approved-art.js';

// Visual placement manifest: local world units relative to the district center.
// New boards supply their own manifest; they do not edit match rules or asset builders.
export const carnivalRowArt={id:'carnival-row-v1',district:0,assets:[
 {id:'prize-parade',kind:'booth',x:-5,z:2,color:0xe84062,title:'PRIZE PARADE'},
 {id:'midway-treats',kind:'booth',x:5,z:2,color:0x008cbe,title:'MIDWAY TREATS'},
 {id:'row-lamp-west',kind:'lamp',x:-8,z:-3},
 {id:'row-lamp-east',kind:'lamp',x:8,z:-3},
 {id:'row-flowers',kind:'planter',x:4,z:4}
]};
export const districtArtManifests=[carnivalRowArt,
 {id:'skyline-heights-v1',district:1,assets:[
  {id:'skyline-express-tower',kind:'skyline-tower',x:0,z:0},
  {id:'skyline-welcome',kind:'district-sign',x:-5,z:2,title:'SKYLINE HEIGHTS',color:0x146d8a},
  {id:'skyline-blooms',kind:'flowerbed',x:4,z:4}
 ]},
 {id:'splash-harbor-v1',district:2,assets:[
  {id:'harbor-beacon',kind:'harbor-lighthouse',x:0,z:0},
  {id:'harbor-dock',kind:'harbor-dock',x:-5,z:2},
  {id:'harbor-welcome',kind:'district-sign',x:5,z:3,title:'SPLASH HARBOR',color:0x087c9d}
 ]},
 {id:'lantern-gardens-v1',district:3,assets:[
  {id:'garden-fountain',kind:'garden-fountain',x:0,z:0},
  {id:'garden-pergola',kind:'pergola',x:-5,z:2},
  {id:'garden-blooms',kind:'flowerbed',x:4,z:4},
  {id:'garden-welcome',kind:'district-sign',x:4,z:-4,title:'LANTERN GARDENS',color:0x34685e}
 ]}
];
export function buildDistrictArt({scene,center,decorate,manifest=carnivalRowArt}){
 const art=createArtKit(scene);
 for(const asset of manifest.assets)decorate(()=>{
  let g;
  if(asset.kind==='booth'){g=art.booth(center.x+asset.x,center.z+asset.z,asset.color,asset.title);g.position.y=.65}
  else{g=new T.Group();g.position.set(center.x+asset.x,.65,center.z+asset.z);scene.add(g);
   if(asset.kind==='lamp'){art.cube(g,0x154861,0,.13,0,.6,.26,.6,.06);art.rod(g,0x154861,[0,.25,0],[0,3.8,0],.075);art.oval(g,0xffe8a3,0,3.85,0,.23,.32,.23);art.mesh(g,new T.ConeGeometry(.38,.3,12),0x154861,0,4.22,0)}
   else if(asset.kind==='planter'){art.cube(g,0x14764a,0,.25,0,2.3,.5,1,.09);art.cube(g,0x214e40,0,.52,0,2.15,.07,.85,.025);for(let i=0;i<7;i++){const x=-.85+i*.28,z=i%2?.2:-.2;art.rod(g,0x27844d,[x,.52,z],[x,.9,z],.025);for(let j=0;j<5;j++)art.oval(g,[0xff6881,0xffc22f,0xb37cf1][i%3],x+Math.cos(j*1.26)*.12,.96,z+Math.sin(j*1.26)*.12,.11,.06,.11);art.oval(g,0xffda4e,x,1,z,.07,.05,.07)}}
   else{scene.remove(g);g=createDistrictProp(scene,asset);g.position.set(center.x+asset.x,.65,center.z+asset.z);}
  }
  g.name=asset.id;g.userData.visualAssetId=asset.id;g.userData.visualRevision=1;g.userData.visualDistrict=manifest.district;
 });
}
export function createPavingTexture({joint='#c4a77c',colors=['#f5ddb1','#efd2a1','#fae7c1']}={}){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle=joint;x.fillRect(0,0,256,256);for(let row=0;row<8;row++)for(let col=-1;col<5;col++){x.fillStyle=colors[(row+col+6)%colors.length];x.fillRect(col*64+(row%2)*32+1,row*32+1,61,29)}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2,1);return t}

export const districtPavingStyles=[{},
 {joint:'#b08f68',colors:['#e9c89b','#f5d8ad','#e4bc87']},
 {joint:'#8aafb0',colors:['#d3e9df','#b9dbd9','#e5efe0']},
 {joint:'#9c9c74',colors:['#e1d7b2','#f1e4bd','#d8d3a8']}
];
