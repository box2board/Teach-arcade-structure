window.ComicAssets=(()=>{
const cache=new Map();
async function dataUrl(url){if(!cache.has(url))cache.set(url,fetch(url).then(r=>{if(!r.ok)throw new Error('Illustrated background could not load.');return r.blob();}).then(blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Background could not be prepared.'));reader.readAsDataURL(blob);})).catch(e=>{cache.delete(url);throw e;}));return cache.get(url);}
async function inline(svg){for(const bg of window.ComicCatalog.backgrounds.filter(a=>a.image&&svg.includes(a.image)))svg=svg.split('href="'+bg.image+'"').join('href="'+await dataUrl(bg.image)+'"');return svg;}
return {inline};
})();
