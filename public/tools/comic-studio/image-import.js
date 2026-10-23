window.ComicImageImport=(()=>{
async function read(file){
 if(!file||!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)||file.size>10*1024*1024)throw new Error('Choose a PNG, JPEG, WebP or GIF image under 10 MB.');
 const head=new Uint8Array(await file.slice(0,16).arrayBuffer());const png=head[0]===137&&head[1]===80&&head[2]===78&&head[3]===71,jpg=head[0]===255&&head[1]===216&&head[2]===255,webp=String.fromCharCode(...head.slice(0,4))==='RIFF'&&String.fromCharCode(...head.slice(8,12))==='WEBP',gif=String.fromCharCode(...head.slice(0,3))==='GIF';
 if(!(file.type==='image/png'&&png||file.type==='image/jpeg'&&jpg||file.type==='image/webp'&&webp||file.type==='image/gif'&&gif))throw new Error('The file contents do not match its image type.');
 const url=URL.createObjectURL(file),image=new Image();try{
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('This image could not be opened.'));image.src=url;});
  if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>40000000)throw new Error('Choose an image smaller than 40 megapixels.');
  let ratio=Math.min(1,1600/image.naturalWidth,1600/image.naturalHeight),src,width,height;
  for(let tries=0;tries<5;tries++){width=Math.max(1,Math.round(image.naturalWidth*ratio));height=Math.max(1,Math.round(image.naturalHeight*ratio));const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image importing is unavailable in this browser.');ctx.drawImage(image,0,0,width,height);src=canvas.toDataURL('image/png');if(src.length<1.5*1024*1024)break;ratio*=.7;}
  if(src.length>1.5*1024*1024)throw new Error('This image is too detailed. Try a smaller image.');return {src,width,height,name:(file.name||'Imported image').slice(0,120)};
 }finally{URL.revokeObjectURL(url);}
}
return {read};
})();
