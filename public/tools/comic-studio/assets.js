window.ComicAssets=(()=>{
const cache=new Map();
async function dataUrl(url){if(!cache.has(url))cache.set(url,fetch(url).then(r=>{if(!r.ok)throw new Error('Illustrated background could not load.');return r.blob();}).then(blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Background could not be prepared.'));reader.readAsDataURL(blob);})).catch(e=>{cache.delete(url);throw e;}));return cache.get(url);}
async function inline(svg){for(const bg of window.ComicCatalog.backgrounds.filter(a=>a.image&&svg.includes(a.image)))svg=svg.split('href="'+bg.image+'"').join('href="'+await dataUrl(bg.image)+'"');return svg;}
const previews=new Map();let lastAssets,lastPreview;
function preview(assets){if(assets===lastAssets)return lastPreview;for(const [id,cached] of previews)if(!assets[id]||assets[id].src!==cached.source){URL.revokeObjectURL(cached.url);previews.delete(id);}const result={};for(const [id,a] of Object.entries(assets)){if(!previews.has(id)){const data=atob(a.src.split(',')[1]),bytes=Uint8Array.from(data,c=>c.charCodeAt(0)),mime=a.src.slice(5,a.src.indexOf(';'));previews.set(id,{source:a.src,url:URL.createObjectURL(new Blob([bytes],{type:mime}))});}result[id]={...a,src:previews.get(id).url};}lastAssets=assets;lastPreview=result;return result;}
return {inline,preview};
})();
