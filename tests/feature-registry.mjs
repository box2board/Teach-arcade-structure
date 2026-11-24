import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {FEATURES,featureForPath,featureForLink,featureForResource} from '../public/assets/scripts/feature-registry.js';
import {availability,defaultFlags} from '../lib/feature-gate/policy.js';
const root='https://teacharcade.com',id='brain-rv-road-trip-mayhem',f=FEATURES[id];
for(const page of ['/','/subjects/social-studies/','/brain-arcade/','/teacher/','/search.html?q=rv','/new-category/']){
 assert.equal(featureForLink({href:f.url,base:root+page}),id,page);
 assert.equal(featureForLink({href:root+f.url+'?ref=home',base:root+page,resourceId:f.resourceId}),id,page+' with resource ID');
}
assert.equal(featureForLink({href:'https://other.example'+f.url,base:root}),null);
assert.equal(featureForLink({href:'/brain-arcade/chess/',base:root,featureId:id}),null);
assert.equal(featureForLink({href:f.url+'alpine-run.js',base:root}),null);
assert.equal(featureForLink({href:f.url+'index.html',base:root}),id);
assert.equal(featureForResource(f.resourceId),id);
assert.equal(featureForResource(id),id);
assert.equal(featureForPath(f.path+'/alpine-run.js'),id);
assert.equal(availability({...defaultFlags(),[id]:'coming_soon'},id),'coming_soon');
const middleware=await readFile(new URL('../middleware.js',import.meta.url),'utf8');
for(const [key,entry] of Object.entries(FEATURES)){
 assert.equal(featureForPath(entry.path),key);
 for(const path of [entry.path,...entry.aliases]){
  assert.ok(middleware.includes("'"+path+"/:path*'"),'Update middleware matcher for '+path);
 }
 await access(new URL('../public'+entry.url+'index.html',import.meta.url));
 await access(new URL('../public'+entry.image,import.meta.url));
}
console.log('Feature registry: placement, stable IDs, route coverage and artwork checks passed');
