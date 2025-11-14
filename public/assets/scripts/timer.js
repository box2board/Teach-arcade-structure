/* Teach Arcade — Timer & Stopwatch (no deps) */
(() => {
  // Elements
  const display = document.getElementById('display');
  const startBtn = document.getElementById('btn-start');
  const lapBtn   = document.getElementById('btn-lap');
  const resetBtn = document.getElementById('btn-reset');
  const tabStop  = document.getElementById('tab-stop');
  const tabDown  = document.getElementById('tab-down');
  const countOpts= document.getElementById('count-options');
  const lapsList = document.getElementById('laps');
  const lapsPanel= document.getElementById('laps-panel');
  const minIn    = document.getElementById('min');
  const secIn    = document.getElementById('sec');
  const presets  = document.querySelectorAll('.preset');
  const volIn    = document.getElementById('vol');
  const beepLast3= document.getElementById('beep-last3');
  const autoRepeat = document.getElementById('auto-repeat');
  const fullBtn  = document.getElementById('btn-full');

  // State
  let mode = 'stopwatch'; // or 'countdown'
  let running = false;
  let startTime = 0;
  let elapsed = 0;         // ms (stopwatch)
  let rafId = null;

  // Countdown state
  let targetMs = 0;        // ms remaining (set from inputs)
  let endAt = 0;           // timestamp when will end
  let lastSecond = null;   // for 3-2-1 beeps

  // Audio (WebAudio API simple beep)
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const actx = new AudioCtx();
  function beep(freq=880, dur=0.14, vol=Number(volIn?.value||0.7)) {
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.frequency.value = freq;
    o.type = 'sine';
    g.gain.value = vol;
    o.connect(g); g.connect(actx.destination);
    o.start();
    setTimeout(()=>{ o.stop(); o.disconnect(); g.disconnect(); }, dur*1000);
  }

  // Helpers
  const pad2 = n => String(n).padStart(2,'0');
  function fmtStopwatch(ms) {
    const m = Math.floor(ms/60000);
    const s = Math.floor((ms%60000)/1000);
    const cs = Math.floor((ms%1000)/10);
    return `${pad2(m)}:${pad2(s)}.${pad2(cs)}`;
  }
  function fmtCountdown(ms) {
    ms = Math.max(0, ms);
    const m = Math.floor(ms/60000);
    const s = Math.floor((ms%60000)/1000);
    return `${pad2(m)}:${pad2(s)}`;
  }

  // Rendering loops
  function tickStopwatch() {
    const now = performance.now();
    const ms = elapsed + (running ? now - startTime : 0);
    display.textContent = fmtStopwatch(ms);
    if (running) rafId = requestAnimationFrame(tickStopwatch);
  }

  function tickCountdown() {
    const now = performance.now();
    const remaining = Math.max(0, endAt - now);
    display.textContent = fmtCountdown(remaining);

    // Beep at 3,2,1
    if (beepLast3.checked) {
      const secLeft = Math.ceil(remaining / 1000);
      if (secLeft <= 3 && secLeft !== lastSecond && running && secLeft > 0) {
        lastSecond = secLeft; beep(750, 0.12);
      }
    }

    if (remaining <= 0) {
      running = false;
      display.classList.add('flash','ring');
      beep(880,0.18); setTimeout(()=>beep(660,0.18),200); setTimeout(()=>beep(520,0.22),400);

      if (autoRepeat.checked) {
        // restart another round
        setTimeout(() => {
          display.classList.remove('flash','ring');
          startCountdownFromInputs();
          running = true;
          rafId = requestAnimationFrame(tickCountdown);
          updateButtons();
        }, 700);
      } else {
        updateButtons();
      }
      return;
    }
    if (running) rafId = requestAnimationFrame(tickCountdown);
  }

  // Button state
  function updateButtons() {
    startBtn.textContent = running ? 'Pause (Space)' : 'Start (Space)';
    lapBtn.disabled = (mode !== 'stopwatch') || !running;
    resetBtn.classList.toggle('ghost', running);
  }

  // Stopwatch actions
  function startStopwatch() {
    if (!running) {
      startTime = performance.now();
      running = true;
      rafId = requestAnimationFrame(tickStopwatch);
    } else {
      // pause
      elapsed += performance.now() - startTime;
      running = false;
      cancelAnimationFrame(rafId);
    }
    updateButtons();
  }
  function resetStopwatch() {
    running = false; cancelAnimationFrame(rafId);
    elapsed = 0; startTime = performance.now();
    display.textContent = fmtStopwatch(0);
    lapsList.innerHTML = '';
    updateButtons();
  }
  function addLap() {
    if (mode !== 'stopwatch' || !running) return;
    const ms = elapsed + (performance.now() - startTime);
    const li = document.createElement('li');
    li.innerHTML = `<span>Lap ${lapsList.children.length+1}</span><b>${fmtStopwatch(ms)}</b>`;
    lapsList.prepend(li);
  }

  // Countdown actions
  function startCountdownFromInputs() {
    const mins = Math.max(0, parseInt(minIn.value||0,10));
    const secs = Math.max(0, Math.min(59, parseInt(secIn.value||0,10)));
    targetMs = (mins*60 + secs) * 1000;
    endAt = performance.now() + targetMs;
    lastSecond = null;
    display.classList.remove('flash','ring');
  }
  function startCountdown() {
    if (!running) {
      if (!endAt || display.textContent === '00:00') startCountdownFromInputs();
      running = true;
      rafId = requestAnimationFrame(tickCountdown);
    } else {
      // pause
      const remaining = Math.max(0, endAt - performance.now());
      endAt = performance.now() + remaining;
      running = false;
      cancelAnimationFrame(rafId);
    }
    updateButtons();
  }
  function resetCountdown() {
    running = false; cancelAnimationFrame(rafId);
    endAt = 0; display.textContent = fmtCountdown((Number(minIn.value||0)*60 + Number(secIn.value||0))*1000);
    display.classList.remove('flash','ring');
    updateButtons();
  }

  // Mode switch
  function setMode(m) {
    if (mode === m) return;
    // stop any running loop
    running = false; cancelAnimationFrame(rafId);
    mode = m;
    tabStop.setAttribute('aria-selected', m==='stopwatch');
    tabDown.setAttribute('aria-selected', m==='countdown');
    countOpts.hidden = (m !== 'countdown');
    lapsPanel.hidden = (m !== 'stopwatch');
    if (m === 'stopwatch') {
      elapsed = 0; display.textContent = fmtStopwatch(0);
    } else {
      endAt = 0; display.textContent = fmtCountdown((Number(minIn.value||0)*60 + Number(secIn.value||0))*1000);
    }
    updateButtons();
  }

  // Theme
  const themeMap = {
    default: '#ffffff',
    emerald: '#ecfdf5',
    sky:     '#eff6ff',
    rose:    '#fff1f2',
    slate:   '#f1f5f9'
  };
  document.querySelectorAll('.theme-swatch').forEach(b=>{
    b.addEventListener('click', ()=>{
      document.documentElement.style.setProperty('--page-bg', themeMap[b.dataset.theme] || '#ffffff');
      document.body.style.background = `var(--page-bg)`;
    });
  });

  // Fullscreen
  fullBtn.addEventListener('click', async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(()=>{});
      fullBtn.textContent = 'Exit full screen';
    } else {
      await document.exitFullscreen();
      fullBtn.textContent = 'Full screen';
    }
  });

  // Wire events
  startBtn.addEventListener('click', ()=> mode==='stopwatch' ? startStopwatch() : startCountdown());
  resetBtn.addEventListener('click', ()=> mode==='stopwatch' ? resetStopwatch() : resetCountdown());
  lapBtn  .addEventListener('click', addLap);
  tabStop .addEventListener('click', ()=>setMode('stopwatch'));
  tabDown .addEventListener('click', ()=>setMode('countdown'));
  presets.forEach(p=>p.addEventListener('click', ()=>{
    minIn.value = p.dataset.min; secIn.value = 0; resetCountdown();
  }));
  volIn.addEventListener('input', ()=>beep(660,0.06, Number(volIn.value))); // tiny preview

  // Keyboard
  window.addEventListener('keydown', (e)=>{
    if (['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (e.code === 'Space'){ e.preventDefault(); startBtn.click(); }
    if (e.key.toLowerCase() === 'l'){ addLap(); }
    if (e.key.toLowerCase() === 'r'){ resetBtn.click(); }
    if (e.key.toLowerCase() === 'f'){ fullBtn.click(); }
  });

  // Init
  setMode('stopwatch');
})();
