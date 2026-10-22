// A small ZIP writer using stored entries. PNG data is already compressed.
window.ComicPngBundle=(()=>{
const table=Array.from({length:256},(_,i)=>{let n=i;for(let j=0;j<8;j++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const crc=data=>{let c=0xffffffff;for(const b of data)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
function header(size){const a=new Uint8Array(size);return [a,new DataView(a.buffer)];}
async function zip(files){const local=[],central=[];let offset=0,centralSize=0;for(const file of files){const name=new TextEncoder().encode(file.name),data=new Uint8Array(await file.blob.arrayBuffer()),check=crc(data);let [a,v]=header(30);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(12,33,true);v.setUint32(14,check,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);local.push(a,name,data);let [b,w]=header(46);w.setUint32(0,0x02014b50,true);w.setUint16(4,20,true);w.setUint16(6,20,true);w.setUint16(14,33,true);w.setUint32(16,check,true);w.setUint32(20,data.length,true);w.setUint32(24,data.length,true);w.setUint16(28,name.length,true);w.setUint32(42,offset,true);central.push(b,name);offset+=30+name.length+data.length;centralSize+=46+name.length;}
let [end,e]=header(22);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);return new Blob([...local,...central,end],{type:'application/zip'});}
return {zip};
})();
