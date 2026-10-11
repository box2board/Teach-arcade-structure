/* Use before the production shell boots. Both editor and game share TALevelFile. */
window.TALoadLevel=async function(url){
 const response=await fetch(url,{credentials:'same-origin'});
 if(!response.ok)throw new Error('Level download failed: '+response.status);
 return window.TALevelFile.parse(await response.text()).level;
};
