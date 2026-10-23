// Stable IDs identify bookmarks; titles, artwork, and launch URLs may change.
export function validateCatalog(items,label='resources'){
 const ids=new Set(),urls=new Set();
 for(const item of items){
  if(!item||typeof item.id!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,199}$/.test(item.id))throw Error(`Invalid or missing permanent ID in ${label}.`);
  if(typeof item.title!=='string'||!item.title.trim()||typeof item.description!=='string'||!item.description.trim())throw Error(`Missing title or description for ${item.id}.`);
  if(typeof item.url!=='string'||!item.url.startsWith('/')||item.url.startsWith('//')||/[\\\s]/.test(item.url))throw Error(`Use a local launch URL for ${item.id}.`);
  const path=decodeURIComponent(item.url.split(/[?#]/)[0]);
  if(path.split('/').some(part=>part==='.'||part==='..')||path.includes('\\'))throw Error(`Unsafe launch URL for ${item.id}.`);
  if(ids.has(item.id))throw Error(`Duplicate permanent ID in ${label}: ${item.id}`);
  const url=item.url.replace(/index\.html(?=[?#]|$)/,'');
  if(urls.has(url))throw Error(`Duplicate launch URL in ${label}: ${url}`);
  ids.add(item.id);urls.add(url);
 }
 return items;
}
