import {selectionPath} from './image-selection.js';
import {imageSourceSize} from './state.js';
export function imageMaskMarkup(o,id){
 if(!o.maskStrokes?.length)return '';
 const full=imageSourceSize(o),ratio=full.h/full.w;
 const strokes=o.maskStrokes.map((s,i)=>{const soft=s.softness||0,filterId=id+'soft'+i;
  if(s.kind==='region'){const expand=s.expand||0,filtered=!!(expand||s.feather),operation=(expand>0)!==s.outside?'dilate':'erode';const d=(s.outside?`M-30 ${-30*ratio}H130V${130*ratio}H-30Z `:'')+selectionPath(s.points,ratio,s.smooth||false);return `${filtered?`<filter id="${filterId}" filterUnits="userSpaceOnUse" x="-30" y="${-30*ratio}" width="160" height="${160*ratio}">${expand?`<feMorphology operator="${operation}" radius="${Math.abs(expand)}"/>`:""}${s.feather?`<feGaussianBlur stdDeviation="${s.feather/2}"/>`:""}</filter>`:''}<path transform="scale(1 ${1/ratio})" d="${d}" fill="${s.restore?'white':'black'}" fill-rule="evenodd" ${filtered?`filter="url(#${filterId})"`:''}/>`;}
  return `${soft?`<filter id="${filterId}" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="${s.size*soft*.16}"/></filter>`:''}<path transform="scale(1 ${1/ratio})" d="${s.points.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]*ratio).join(' ')}" fill="none" stroke="${s.restore?'white':'black'}" stroke-width="${s.size}" stroke-linecap="round" stroke-linejoin="round" ${soft?`filter="url(#${filterId})"`:''}/>`;}).join('');
 return `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100" style="mask-type:luminance"><rect width="100" height="100" fill="white"/>${strokes}</mask></defs>`;
}
