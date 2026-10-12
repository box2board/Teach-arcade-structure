/* Import helpers. A V1.4 level must use the opt-in creator runtime. */
window.TALoadCreatorDocument=async function(url){
 const response=await fetch(url,{credentials:'same-origin'});if(!response.ok)throw Error('Level download failed: '+response.status);
 const doc=window.TALevelFile.parse(await response.text());
 if(doc.engine==='side-scroller-v1.4'&&!window.TASideScroller?.CreatorEngine)throw Error('Load the V1.4 creator runtime before importing this level.');
 return doc;
};
window.TALoadLevel=async url=>(await window.TALoadCreatorDocument(url)).level;
