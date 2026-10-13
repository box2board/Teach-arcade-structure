const $ = id => document.getElementById(id);
const {PDFDocument, degrees, StandardFonts, rgb} = window.PDFLib;
window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
let pages = [], selected = null, busy = false, history = [], nextId = 0, dragged = null;
const notify = message => $('status').textContent = message;
function remember(){ history.push(pages.map(p => ({...p}))); if(history.length > 20) history.shift(); }
function refresh(){
  const index = pages.findIndex(p => p.id === selected);
  $('count').textContent = pages.length;
  $('selection').textContent = index < 0 ? 'Select a page to edit' : `Page ${index + 1} selected`;
  $('empty').hidden = pages.length > 0;
  for(const id of ['add','browse']) $(id).disabled = busy;
  for(const id of ['rotate','remove','extract']) $(id).disabled = busy || index < 0;
  $('left').disabled = busy || index <= 0;
  $('right').disabled = busy || index < 0 || index === pages.length - 1;
  $('undo').disabled = busy || !history.length;
  $('download').disabled = busy || !pages.length;
  $('clear').disabled = busy || !pages.length;
  const grid = $('pages'); grid.replaceChildren();
  pages.forEach((p,i) => {
    const card = document.createElement('button');
    card.className = 'page' + (p.id === selected ? ' selected' : '');
    card.draggable = !busy; card.disabled = busy;
    card.setAttribute('aria-pressed', p.id === selected ? 'true' : 'false');
    card.setAttribute('aria-label', `Page ${i+1}, ${p.name}, source page ${p.index+1}`);
    const img = document.createElement('img'); img.src = p.thumb; img.alt = '';
    img.style.transform = `rotate(${p.rotation}deg)`;
    if(p.rotation % 180) img.style.scale = '.72';
    const label = document.createElement('strong'); label.textContent = `Page ${i+1}`;
    const sub = document.createElement('small'); sub.textContent = `${p.name} · ${p.index+1}`; sub.title = sub.textContent;
    card.append(img,label,sub); card.onclick = () => {selected = p.id; refresh();};
    card.ondragstart = e => {dragged = p.id; e.dataTransfer.setData('text/plain',String(p.id)); e.dataTransfer.effectAllowed = 'move';};
    card.ondragover = e => { if(dragged !== null) e.preventDefault(); };
    card.ondrop = e => {
      if(busy || dragged === null) return;
      e.preventDefault(); e.stopPropagation();
      const from = pages.findIndex(x => x.id === dragged), to = pages.findIndex(x => x.id === p.id);
      if(from >= 0 && to >= 0 && from !== to){remember(); const [moved] = pages.splice(from,1); pages.splice(to,0,moved); selected = moved.id; refresh(); notify('Page order updated.');}
      dragged = null;
    };
    card.ondragend = () => dragged = null;
    grid.append(card);
  });
}
async function imageDocument(bytes,type){
  const doc = await PDFDocument.create();
  const image = type === 'png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
  const page = doc.addPage([612,792]);
  const fit = image.scale(Math.min(576/image.width,756/image.height));
  page.drawImage(image,{x:(612-fit.width)/2,y:(792-fit.height)/2,width:fit.width,height:fit.height});
  return {doc,bytes:await doc.save()};
}
async function addFiles(files){
  if(busy) return; busy = true; refresh();
  let added = 0; const errors = []; remember();
  for(const file of files){
    let view;
    try {
      notify(`Reading ${file.name}…`);
      if(file.size > 25*1024*1024) throw new Error('exceeds the 25 MB limit');
      const ext = file.name.split('.').pop().toLowerCase();
      if(!['pdf','jpg','jpeg','png'].includes(ext)) throw new Error('use a PDF, JPG, or PNG');
      const original = new Uint8Array(await file.arrayBuffer());
      let doc, bytes;
      if(ext === 'pdf'){bytes = original; doc = await PDFDocument.load(bytes);}
      else ({doc,bytes} = await imageDocument(original, ext === 'png' ? 'png' : 'jpg'));
      if(pages.length + doc.getPageCount() > 150) throw new Error('would exceed the 150-page workspace limit');
      view = await window.pdfjsLib.getDocument({data:bytes.slice(),isEvalSupported:false,enableXfa:false}).promise;
      const incoming = [];
      for(let i=0;i<doc.getPageCount();i++){
        const page = await view.getPage(i+1), base = page.getViewport({scale:1});
        const viewport = page.getViewport({scale:Math.min(1,300/base.width)});
        const canvas = document.createElement('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
        incoming.push({id:++nextId,doc,index:i,name:file.name,rotation:0,thumb:canvas.toDataURL('image/jpeg',.8)});
      }
      pages.push(...incoming); added += incoming.length;
    } catch(error){errors.push(`${file.name}: ${/encrypt|password/i.test(error.message) ? 'password-protected PDFs are not supported' : error.message}`);}
    finally {if(view) await view.destroy();}
  }
  if(!added) history.pop();
  if(selected === null && pages.length) selected = pages[0].id;
  busy = false; $('files').value = ''; refresh();
  notify(`${added} page${added === 1 ? '' : 's'} added.${errors.length ? ' '+errors.join(' · ') : ' Select a page or drag pages into order.'}`);
}
async function buildPacket(items,numbers){
  const out = await PDFDocument.create();
  for(const item of items){
    const [page] = await out.copyPages(item.doc,[item.index]);
    page.setRotation(degrees((page.getRotation().angle + item.rotation) % 360)); out.addPage(page);
  }
  if(numbers){
    const font = await out.embedFont(StandardFonts.Helvetica);
    out.getPages().forEach((p,i) => {
      // Use a visual-coordinate overlay so numbering stays upright on rotated pages.
      const {width:w,height:h} = p.getSize(), angle = p.getRotation().angle;
      const visualWidth = angle % 180 ? h : w;
      const label = `${i+1} / ${items.length}`, tw = font.widthOfTextAtSize(label,10), vx = (visualWidth-tw)/2, vy = 14;
      const position = angle === 90 ? {x:w-vy,y:vx} : angle === 180 ? {x:w-vx,y:h-vy} : angle === 270 ? {x:vy,y:h-vx} : {x:vx,y:vy};
      p.drawText(label,{...position,size:10,font,color:rgb(.2,.25,.35),rotate:degrees(angle)});
    });
  }
  out.setTitle($('filename').value.trim() || 'Classroom packet');
  out.setCreator('Teach Arcade PDF Workspace');
  return out.save();
}
async function download(single){
  if(busy) return;
  const items = single ? pages.filter(p => p.id === selected) : pages;
  if(!items.length) return;
  busy = true; refresh(); notify('Preparing your PDF…');
  try {
    const bytes = await buildPacket(items,$('numbers').checked);
    const url = URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
    const a = document.createElement('a'); a.href = url;
    const name = ($('filename').value.trim().replace(/\.pdf$/i,'').replace(/[^a-zA-Z0-9 _-]/g,'').trim() || 'classroom-packet');
    a.download = name + (single ? '-selected-page' : '') + '.pdf'; a.click();
    setTimeout(() => URL.revokeObjectURL(url),60000); notify('Your PDF is ready. Check your downloads.');
  } catch(error){notify(`Could not create the PDF: ${error.message}`);}
  finally {busy = false; refresh();}
}
$('add').onclick = $('browse').onclick = () => $('files').click();
$('files').onchange = e => addFiles(Array.from(e.target.files));
$('rotate').onclick = () => {remember(); const p = pages.find(p => p.id === selected); p.rotation = (p.rotation + 90)%360; refresh();};
$('remove').onclick = () => {remember(); const i = pages.findIndex(p => p.id === selected); pages.splice(i,1); selected = pages[Math.min(i,pages.length-1)]?.id ?? null; refresh(); notify('Page removed. Undo to restore it.');};
function move(delta){const i=pages.findIndex(p => p.id === selected); if(i<0 || i+delta<0 || i+delta>=pages.length) return; remember(); [pages[i],pages[i+delta]]=[pages[i+delta],pages[i]]; refresh();}
$('left').onclick = () => move(-1); $('right').onclick = () => move(1);
$('undo').onclick = () => {pages=history.pop(); if(!pages.some(p => p.id===selected)) selected=pages[0]?.id ?? null; refresh(); notify('Last change undone.');};
$('clear').onclick = () => {remember(); pages=[]; selected=null; refresh(); notify('Workspace cleared. Undo to restore your pages.');};
$('download').onclick = () => download(false); $('extract').onclick = () => download(true);
$('drop').ondragover = e => {e.preventDefault(); if(dragged === null) $('drop').classList.add('dragover');};
$('drop').ondragleave = e => {if(!$('drop').contains(e.relatedTarget)) $('drop').classList.remove('dragover');};
$('drop').ondrop = e => {e.preventDefault(); $('drop').classList.remove('dragover'); if(e.dataTransfer.files.length) addFiles(Array.from(e.dataTransfer.files));};
refresh();
