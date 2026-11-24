import {FEATURES,featureForLink,featureForPath} from './feature-registry.js';
// Decorate launch links wherever they appear; no authorization decisions in the browser.
// The request gate is still authoritative. No polling, and no status request until a pilot link exists.
const labels={coming_soon:'Coming Soon',under_improvement:'Under Improvement',unavailable:'Temporarily Unavailable'};
const previous=new WeakMap();
let active=false,statusPromise,observer;
function statuses(){
 if(!statusPromise)statusPromise=fetch('/api/feature-availability',{cache:'no-store',credentials:'same-origin'}).then(async response=>{
  if(response.status!==200&&response.status!==503)throw Error('Unavailable');
  const body=await response.json();
  return body.features??{};
 }).catch(()=>Object.fromEntries(Object.keys(FEATURES).map(id=>[id,'unavailable'])));
 return statusPromise;
}
function stylesheet(){
 if(document.querySelector('link[data-ta-feature-style]'))return;
 const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='/assets/feature-availability.css';sheet.dataset.taFeatureStyle='1';document.head.append(sheet);
}
function resolve(link){
 const parent=link.closest('[data-feature-id],[data-resource-id]');
 return featureForLink({href:link.href,base:location.href,featureId:link.dataset.featureId||parent?.dataset.featureId,resourceId:link.dataset.resourceId||parent?.dataset.resourceId});
}
function clear(link){
 const old=previous.get(link);
 if(!old)return;
 old.badge.remove();
 link.classList.remove('ta-feature-blocked');
 if(old.aria===null)link.removeAttribute('aria-label');else link.setAttribute('aria-label',old.aria);
 previous.delete(link);
}
async function decorate(link){
 const id=resolve(link);
 if(!id){clear(link);return;}
 const data=await statuses();
 if(!link.isConnected||resolve(link)!==id)return;
 const label=labels[data[id]];
 const old=previous.get(link);
 if(old?.id===id&&old.label===label&&old.badge.isConnected)return;
 clear(link);
 if(!label)return;
 stylesheet();
 const badge=document.createElement('span');badge.className='ta-availability-badge';badge.textContent=label;
 previous.set(link,{id,label,badge,aria:link.getAttribute('aria-label')});
 link.classList.add('ta-feature-blocked');
 link.setAttribute('aria-label',FEATURES[id].name+' — '+label);
 link.append(badge);
}
function scan(root){
 if(root.nodeType!==1&&root.nodeType!==9)return;
 if(root.matches?.('a[href]'))void decorate(root);
 for(const link of root.querySelectorAll?.('a[href]')??[])void decorate(link);
}
export function initFeatureAvailability(){
 if(active)return;
 active=true;
 // Gameplay itself never needs tile decoration. No extra request/observer there.
 if(featureForPath(location.pathname))return;
 const start=()=>{
  scan(document);
  observer=new MutationObserver(records=>{
   for(const rec of records){
    if(rec.type==='attributes'){scan(rec.target);continue;}
    for(const node of rec.addedNodes)scan(node);
   }
  });
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['href','data-feature-id','data-resource-id']});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
