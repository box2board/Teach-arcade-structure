(() => {
  // ---------- DOM ----------
  const statusEl = document.getElementById('status');
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const textarea = document.getElementById('items');
  const resultEl = document.getElementById('result');
  const spinBtn = document.getElementById('spin');
  const clearBtn = document.getElementById('clear');
  const shuffleBtn = document.getElementById('shuffle');
  const saveBtn = document.getElementById('save');
  const restoreBtn = document.getElementById('restore');
  const shareBtn = document.getElementById('share');
  const removeAfter = document.getElementById('removeAfter');
  const confettiToggle = document.getElementById('confetti');
  const confettiLayer = document.getElementById('confettiLayer');
  const paletteSel = document.getElementById('palette');
  const darkToggle = document.getElementById('darkToggle');
  const overlay = document.getElementById('overlay');
  const overlayWinner = document.getElementById('overlayWinner');
  const overlayClose = document.getElementById('overlayClose');

  const setStatus = (m) => (statusEl.textContent = `Status: ${m}`);

  // ---------- DARK MODE ----------
  const THEME_KEY = 'ta-wheel-theme';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const storedTheme = localStorage.getItem(THEME_KEY);
  if ((storedTheme === 'dark') || (!storedTheme && prefersDark)) document.documentElement.classList.add('dark');
  darkToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem(THEME_KEY, document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  });

  // ---------- STATE ----------
  let items = [];
  let startAngle = 0;      // current rotation (radians)
  let arc = 0;             // radians per slice
  let rafId = 0;
  let lastTickIndex = -1;  // to play click when crossing slice

  const STORAGE_KEY = 'ta-wheel-v2';
  const PALETTE_KEY = 'ta-wheel-palette';

  // Color palettes
  const PALETTES = {
    vibrant: i => `hsl(${(i*360/Math.max(8,items.length))},85%,55%)`,
    pastel:  i => `hsl(${(i*360/Math.max(8,items.length))},70%,75%)`,
    mono:    i => `hsl(210, ${40 + (i%8)*6}%, ${70 - (i%8)*5}%)`,
    classroom: i => ['#ef4444','#22c55e','#3b82f6','#f59e0b','#a855f7','#06b6d4','#eab308','#10b981'][i%8]
  };

  // ---------- AUDIO (Web Audio) ----------
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audio = new AudioCtx();

  function clickTick(){
    const t = audio.currentTime;
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(2200, t);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g).connect(audio.destination);
    o.start(t);
    o.stop(t + 0.06);
  }

  function celebrateSound(){
    const t0 = audio.currentTime + 0.02;
    const notes = [880, 1175, 1568]; // A6, D7, G#7-ish (fun blip chord)
    notes.forEach((freq, i) => {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, t0 + i*0.02);
      g.gain.setValueAtTime(0.0001, t0 + i*0.02);
      g.gain.linearRampToValueAtTime(0.18, t0 + 0.08 + i*0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
      o.connect(g).connect(audio.destination);
      o.start(t0 + i*0.02);
      o.stop(t0 + 0.5);
    });
  }

  // ---------- DRAWING ----------
  function drawPointer(){
    // pointer at top, pointing DOWN into wheel
    ctx.beginPath();
    ctx.moveTo(200, 34);   // tip
    ctx.lineTo(186, 10);
    ctx.lineTo(214, 10);
    ctx.closePath();
    ctx.fillStyle = 'red';
    ctx.fill();
  }

  function drawWheel(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if (!items.length){
      ctx.beginPath();
      ctx.arc(200,200,200,0,Math.PI*2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();
      drawPointer();
      return;
    }

    arc = (Math.PI*2) / items.length;

    for (let i=0;i<items.length;i++){
      const angle = startAngle + i*arc;
      ctx.beginPath();
      ctx.moveTo(200,200);
      ctx.arc(200,200,200,angle,angle+arc);
      ctx.closePath();
      const palette = PALETTES[ paletteSel.value ] || PALETTES.vibrant;
      ctx.fillStyle = palette(i);
      ctx.fill();

      // label
      ctx.save();
      ctx.translate(200,200);
      ctx.rotate(angle + arc/2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Nunito, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(String(items[i]).slice(0,18), 90, 6);
      ctx.restore();
    }

    drawPointer();
  }

  // Which slice is under the top pointer
  function indexUnderPointer(){
    const deg = (startAngle * 180/Math.PI) % 360;
    const normalized = (360 - (deg + 90) % 360);
    const sliceDeg = arc * 180/Math.PI;
    return Math.floor(normalized / sliceDeg) % items.length;
  }

  // ---------- CONFETTI ----------
  function fireConfetti(){
    if (!confettiLayer) return;
    confettiLayer.innerHTML = '';
    const colors = ['#ef4444','#22c55e','#3b82f6','#f59e0b','#a855f7','#06b6d4','#eab308','#10b981'];
    for (let i=0;i<120;i++){
      const s = document.createElement('span');
      s.style.left = (Math.random()*100)+'%';
      s.style.top = (Math.random()*8)+'%';
      s.style.background = colors[i%colors.length];
      s.style.animationDelay = (Math.random()*0.5)+'s';
      confettiLayer.appendChild(s);
    }
    setTimeout(()=>confettiLayer.innerHTML='', 1600);
  }

  // ---------- SPIN (ease-in then ease-out + tick sound) ----------
  function spin(){
    if (!items.length){ alert('Add at least one item.'); return; }
    resultEl.textContent = '';
    spinBtn.disabled = true;
    setStatus('Spinning…');

    const totalMs = 5200 + Math.random()*1200;
    const accelMs = Math.min(900, totalMs*0.22);
    const decelMs = totalMs - accelMs;

    const maxSpeed = 18 + Math.random()*8; // degrees per frame (peak)
    let t = 0;
    lastTickIndex = indexUnderPointer(); // start tick reference

    (function animate(){
      t += 16;

      let speedDeg; // current angular speed in degrees/frame
      if (t <= accelMs){
        // ease-in (quadratic)
        const p = t/accelMs;
        speedDeg = maxSpeed * (p*p);
      } else {
        // ease-out (cubic)
        const u = Math.min(1, (t-accelMs)/decelMs);
        speedDeg = maxSpeed * (1 - (u*u*u));
      }

      startAngle += (speedDeg * Math.PI/180);
      drawWheel();

      // TICK when crossing slice boundary under pointer
      const idx = indexUnderPointer();
      if (idx !== lastTickIndex){
        lastTickIndex = idx;
        clickTick();
      }

      if (t < totalMs){
        rafId = requestAnimationFrame(animate);
      } else {
        finish();
      }
    })();

    function finish(){
      if (rafId) cancelAnimationFrame(rafId);
      const idx = indexUnderPointer();
      const winner = items[idx];
      resultEl.textContent = `🎉 Result: ${winner}!`;
      setStatus('Done');

      if (confettiToggle.checked) fireConfetti();
      celebrateSound();
      showOverlay(winner);

      if (removeAfter.checked){
        items.splice(idx,1);
        textarea.value = items.join('\n');
        setTimeout(drawWheel, 250);
      }
      spinBtn.disabled = false;
    }
  }

  function showOverlay(name){
    overlayWinner.textContent = name;
    overlay.classList.add('show');
    overlayClose.focus();
  }
  overlayClose.addEventListener('click', ()=>overlay.classList.remove('show'));
  overlay.addEventListener('click', (e)=>{ if (e.target === overlay) overlay.classList.remove('show'); });

  // ---------- TEXTAREA / UI ----------
  function readTextarea(){
    items = textarea.value.split('\n').map(s=>s.trim()).filter(Boolean);
    drawWheel();
  }

  textarea.addEventListener('input', readTextarea);
  paletteSel.addEventListener('change', () => { localStorage.setItem(PALETTE_KEY, paletteSel.value); drawWheel(); });
  spinBtn.addEventListener('click', () => { audio.resume?.(); spin(); });
  clearBtn.addEventListener('click', () => { textarea.value=''; items=[]; resultEl.textContent=''; drawWheel(); });
  shuffleBtn.addEventListener('click', () => {
    items = items.sort(()=>Math.random()-0.5);
    textarea.value = items.join('\n');
    drawWheel();
  });

  // Save/restore/share
  saveBtn.addEventListener('click', () => {
    const payload = { items: textarea.value, rm: !!removeAfter.checked, confetti: !!confettiToggle.checked, palette: paletteSel.value };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setStatus('Saved'); setTimeout(()=>setStatus('Ready'), 900);
  });
  restoreBtn.addEventListener('click', () => {
    const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return;
    const d = JSON.parse(raw);
    textarea.value = d.items || '';
    removeAfter.checked = !!d.rm;
    confettiToggle.checked = !!d.confetti;
    paletteSel.value = d.palette || paletteSel.value;
    readTextarea();
    setStatus('Restored'); setTimeout(()=>setStatus('Ready'), 900);
  });

  shareBtn.addEventListener('click', async () => {
    const params = new URLSearchParams();
    if (textarea.value.trim()) params.set('items', textarea.value.split('\n').map(encodeURIComponent).join('|'));
    if (removeAfter.checked) params.set('rm','1');
    if (confettiToggle.checked) params.set('confetti','1');
    params.set('palette', paletteSel.value);
    const url = `${location.origin}${location.pathname}?${params.toString()}`;
    try { await navigator.clipboard.writeText(url); setStatus('Share link copied!'); }
    catch { prompt('Copy this link:', url); }
    finally { setTimeout(()=>setStatus('Ready'), 1200); }
  });

  // ---------- INIT ----------
  // palette from storage or query
  const qs = new URLSearchParams(location.search);
  const pQ = qs.get('palette');
  const pS = localStorage.getItem(PALETTE_KEY);
  paletteSel.value = pQ || pS || 'vibrant';

  const itemsParam = qs.get('items');
  if (itemsParam) {
    textarea.value = itemsParam.split('|').map(decodeURIComponent).join('\n');
    removeAfter.checked = qs.get('rm') === '1';
    confettiToggle.checked = qs.get('confetti') === '1' || confettiToggle.checked;
  } else if (!textarea.value.trim()) {
    textarea.value = ['Ash','Jaime','Teddy','Ami','Dave','Charlie','Gary','Naomi'].join('\n');
  }

  readTextarea();
  setStatus('Ready');
})();
