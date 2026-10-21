(()=>{
  const map = new Map(Object.entries({
    '#071015':'#1b2236',
    '#0b171b':'#eadfc8',
    '#0d1b1f':'#f5ecd9',
    '#23343a':'#28324a',
    '#2e454c':'#3a4660',
    '#18262b':'#1e2638',
    '#8fe8d0':'#78c97b',
    '#d9fff5':'#eff8cf',
    '#164b3b':'#355f3d',
    '#243a43':'#6a4b32',
    '#172126':'#36313a',
    '#65e2a5':'#82c878',
    '#47555b':'#80756b',
    '#baf7dc':'#d9f0b8',
    '#78878c':'#b4a48e',
    '#72e8ff':'#f0a94a',
    '#b58cff':'#c779ad',
    '#ffb45c':'#e8784f',
    '#ffd96a':'#e9c950',
    '#ffe36a':'#f3c74f',
    '#68848b':'#897c70',
    '#63dcff':'#f09b45',
    '#d9f8ff':'#fff1ca',
    '#0b1c22':'#4a3526',
    '#8cefff':'#9ed8cf',
    '#ff6f76':'#d95852',
    'rgba(124,171,174,.055)':'rgba(99,78,47,.12)',
    'rgba(167,213,216,.18)':'rgba(95,71,38,.24)',
    'rgba(255,227,106,.18)':'rgba(243,199,79,.22)',
    'rgba(104,132,139,.1)':'rgba(137,124,112,.13)',
    'rgba(140,239,255,.18)':'rgba(158,216,207,.22)',
    'rgba(255,111,118,.18)':'rgba(217,88,82,.20)',
    'rgba(112,231,255,.28)':'rgba(240,169,74,.32)'
  }));
  function remap(v){
    if(typeof v!=='string') return v;
    const key=v.toLowerCase().replace(/\s+/g,'');
    return map.get(key) || v;
  }
  for(const prop of ['fillStyle','strokeStyle']){
    const d=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,prop);
    if(!d||!d.get||!d.set) continue;
    Object.defineProperty(CanvasRenderingContext2D.prototype,prop,{
      configurable:d.configurable,
      enumerable:d.enumerable,
      get(){return d.get.call(this);},
      set(v){d.set.call(this,remap(v));}
    });
  }
})();