(() => {
  // ---------- DOM ----------
  const statusEl = document.getElementById('status');
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const wheelSurface = document.getElementById('wheelSurface');
  const wheelApp = document.getElementById('wheelApp');
  const textarea = document.getElementById('items');
  const entryCount = document.getElementById('entryCount');
  const resultEl = document.getElementById('result');
  const spinBtn = document.getElementById('spin');
  const clearBtn = document.getElementById('clear');
  const shuffleBtn = document.getElementById('shuffle');
  const saveBtn = document.getElementById('save');
  const restoreBtn = document.getElementById('restore');
  const shareBtn = document.getElementById('share');
  const fullscreenBtn = document.getElementById('fullscreen');
  const removeAfter = document.getElementById('removeAfter');
  const confettiToggle = document.getElementById('confetti');
  const confettiLayer = document.getElementById('confettiLayer');
  const paletteSel = document.getElementById('palette');
  const darkToggle = document.getElementById('darkToggle');
  const overlay = document.getElementById('overlay');
  const overlayWinner = document.getElementById('overlayWinner');
  const overlayClose = document.getElementById('overlayClose');

  if (!canvas || !ctx || !textarea || !spinBtn) return;

  const SAMPLE_NAMES = ['Steve','Bruce','Peter','Tony','Natasha','Carol','Wanda','Jean'];

  const setStatus = (message) => {
    if (statusEl) statusEl.textContent = `Status: ${message}`;
  };

  // Keep celebration effects above the dimmed winner overlay, including fullscreen mode.
  if (confettiLayer && wheelApp) {
    wheelApp.appendChild(confettiLayer);
    Object.assign(confettiLayer.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '140',
      pointerEvents: 'none',
      overflow: 'hidden'
    });
  }

  // ---------- THEME ----------
  const THEME_KEY = 'ta-wheel-theme';
  const STORAGE_KEY = 'ta-wheel-v2';
  const PALETTE_KEY = 'ta-wheel-palette';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function updateThemeButton() {
    if (!darkToggle) return;
    const dark = document.documentElement.classList.contains('dark');
    darkToggle.textContent = dark ? 'Light Mode' : 'Dark Mode';
    darkToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  const storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme === 'dark' || (!storedTheme && prefersDark.matches)) {
    document.documentElement.classList.add('dark');
  }
  updateThemeButton();

  darkToggle?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem(
      THEME_KEY,
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );
    updateThemeButton();
  });

  // ---------- STATE ----------
  let items = [];
  let startAngle = 0;
  let arc = 0;
  let logicalSize = 600;
  let spinning = false;
  let rafId = 0;
  let lastTickIndex = -1;
  let resizeRaf = 0;
  const TWO_PI = Math.PI * 2;

  const PALETTES = {
    vibrant: (i) => `hsl(${(i * 360 / Math.max(8, items.length))},85%,55%)`,
    pastel: (i) => `hsl(${(i * 360 / Math.max(8, items.length))},70%,75%)`,
    mono: (i) => `hsl(210, ${40 + (i % 8) * 6}%, ${70 - (i % 8) * 5}%)`,
    classroom: (i) => ['#ef4444','#22c55e','#3b82f6','#f59e0b','#a855f7','#06b6d4','#eab308','#10b981'][i % 8]
  };

  function normalizeAngle(value) {
    return ((value % TWO_PI) + TWO_PI) % TWO_PI;
  }

  function center() {
    return logicalSize / 2;
  }

  function radius() {
    return Math.max(100, center() - Math.max(7, logicalSize * 0.015));
  }

  function updateEntryCount() {
    if (!entryCount) return;
    entryCount.textContent = `${items.length} ${items.length === 1 ? 'item' : 'items'}`;
  }

  // ---------- AUDIO ----------
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audio = null;

  function ensureAudio() {
    if (!AudioCtx) return null;
    try {
      if (!audio) audio = new AudioCtx();
      audio.resume?.();
      return audio;
    } catch {
      return null;
    }
  }

  function clickTick() {
    const a = ensureAudio();
    if (!a) return;
    const t = a.currentTime;
    const oscillator = a.createOscillator();
    const gain = a.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1850, t);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
    oscillator.connect(gain).connect(a.destination);
    oscillator.start(t);
    oscillator.stop(t + 0.065);
  }

  function celebrateSound() {
    const a = ensureAudio();
    if (!a) return;
    const t0 = a.currentTime + 0.02;
    [880, 1175, 1568].forEach((frequency, index) => {
      const oscillator = a.createOscillator();
      const gain = a.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, t0 + index * 0.02);
      gain.gain.setValueAtTime(0.0001, t0 + index * 0.02);
      gain.gain.linearRampToValueAtTime(0.24, t0 + 0.07 + index * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.48);
      oscillator.connect(gain).connect(a.destination);
      oscillator.start(t0 + index * 0.02);
      oscillator.stop(t0 + 0.54);
    });
  }

  // ---------- RESPONSIVE CANVAS ----------
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const cssSize = Math.max(260, Math.round(Math.min(rect.width || 600, rect.height || rect.width || 600)));
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const pixelSize = Math.round(cssSize * dpr);

    logicalSize = cssSize;
    if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
      canvas.width = pixelSize;
      canvas.height = pixelSize;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawWheel();
  }

  function scheduleResize() {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(resizeCanvas);
  }

  if ('ResizeObserver' in window && wheelSurface) {
    const observer = new ResizeObserver(scheduleResize);
    observer.observe(wheelSurface);
  } else {
    window.addEventListener('resize', scheduleResize, { passive: true });
  }

  // ---------- LABEL HELPERS ----------
  function sliceUsableWidth(arcRadians, labelRadius, padding = 12) {
    const chord = 2 * labelRadius * Math.tan(Math.min(arcRadians, Math.PI / 2) / 2);
    const radialLimit = radius() * 0.74;
    return Math.max(32, Math.min(radialLimit, chord - padding * 2));
  }

  function layoutSliceText(text, maxWidth) {
    const normalized = String(text).trim();
    const maxFont = Math.max(15, Math.min(26, logicalSize * 0.038));
    const minFont = Math.max(9, Math.min(13, logicalSize * 0.019));
    let size = maxFont;

    while (size >= minFont) {
      ctx.font = `700 ${size}px Nunito, sans-serif`;
      if (ctx.measureText(normalized).width <= maxWidth) {
        return { size, lines: [normalized] };
      }

      const words = normalized.split(/\s+/);
      if (words.length > 1) {
        for (let split = Math.floor(words.length / 2); split >= 1; split -= 1) {
          const first = words.slice(0, split).join(' ');
          const second = words.slice(split).join(' ');
          if (ctx.measureText(first).width <= maxWidth && ctx.measureText(second).width <= maxWidth) {
            return { size, lines: [first, second] };
          }
        }
      }
      size -= 1;
    }

    size = minFont;
    ctx.font = `700 ${size}px Nunito, sans-serif`;
    let shortened = normalized;
    while (shortened && ctx.measureText(`${shortened}…`).width > maxWidth) {
      shortened = shortened.slice(0, -1);
    }
    return { size, lines: [`${shortened || normalized.slice(0, 1)}…`] };
  }

  function drawSliceLabel(angle, sliceArc, text, labelRadius) {
    const maxWidth = sliceUsableWidth(sliceArc, labelRadius);
    const { size, lines } = layoutSliceText(text, maxWidth);
    const middle = angle + sliceArc / 2;
    const x = center() + Math.cos(middle) * labelRadius;
    const y = center() + Math.sin(middle) * labelRadius;
    const useDarkText = paletteSel?.value === 'pastel' || paletteSel?.value === 'mono';

    ctx.save();
    ctx.translate(x, y);
    let rotation = middle;
    if (Math.cos(middle) < 0) rotation += Math.PI;
    ctx.rotate(rotation);
    ctx.fillStyle = useDarkText ? '#0f172a' : '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = useDarkText ? 'rgba(255,255,255,.15)' : 'rgba(15,23,42,.35)';
    ctx.shadowBlur = Math.max(1, logicalSize * 0.003);

    const lineGap = Math.max(2, size * 0.2);
    const totalHeight = lines.length * size + (lines.length - 1) * lineGap;
    let lineY = -totalHeight / 2 + size / 2;
    lines.forEach((line) => {
      ctx.font = `700 ${size}px Nunito, sans-serif`;
      ctx.fillText(line, 0, lineY);
      lineY += size + lineGap;
    });
    ctx.restore();
  }

  // ---------- DRAWING ----------
  function clearCanvas() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function drawPointer() {
    const c = center();
    const baseHalf = Math.max(13, logicalSize * 0.032);
    const baseY = Math.max(4, logicalSize * 0.012);
    const tipY = Math.max(31, logicalSize * 0.078);

    ctx.save();
    ctx.shadowColor = 'rgba(15,23,42,.32)';
    ctx.shadowBlur = Math.max(5, logicalSize * 0.014);
    ctx.shadowOffsetY = Math.max(2, logicalSize * 0.006);
    ctx.beginPath();
    ctx.moveTo(c, tipY);
    ctx.lineTo(c - baseHalf, baseY);
    ctx.lineTo(c + baseHalf, baseY);
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.lineWidth = Math.max(2, logicalSize * 0.004);
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();
  }

  function drawCenterHub() {
    const c = center();
    const hubRadius = Math.max(23, Math.min(48, logicalSize * 0.066));
    ctx.save();
    ctx.shadowColor = 'rgba(15,23,42,.25)';
    ctx.shadowBlur = Math.max(4, logicalSize * 0.012);
    ctx.beginPath();
    ctx.arc(c, c, hubRadius, 0, TWO_PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = Math.max(3, logicalSize * 0.006);
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.max(9, Math.min(14, logicalSize * 0.019))}px Poppins, sans-serif`;
    ctx.fillText('SPIN', c, c + 1);
    ctx.restore();
  }

  function drawWheel() {
    clearCanvas();
    const c = center();
    const r = radius();

    if (!items.length) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(c, c, r, 0, TWO_PI);
      ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#1e293b' : '#e2e8f0';
      ctx.fill();
      ctx.lineWidth = Math.max(3, logicalSize * 0.007);
      ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#475569' : '#cbd5e1';
      ctx.stroke();
      ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#64748b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.max(18, logicalSize * 0.038)}px Poppins, sans-serif`;
      ctx.fillText('Add items to begin', c, c);
      ctx.restore();
      drawPointer();
      return;
    }

    arc = TWO_PI / items.length;
    const palette = PALETTES[paletteSel?.value] || PALETTES.vibrant;

    for (let index = 0; index < items.length; index += 1) {
      const angle = startAngle + index * arc;
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.arc(c, c, r, angle, angle + arc);
      ctx.closePath();
      ctx.fillStyle = palette(index);
      ctx.fill();
      ctx.lineWidth = Math.max(1, logicalSize * 0.0025);
      ctx.strokeStyle = 'rgba(255,255,255,.72)';
      ctx.stroke();
      drawSliceLabel(angle, arc, items[index], r * 0.61);
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(c, c, r, 0, TWO_PI);
    ctx.lineWidth = Math.max(5, logicalSize * 0.012);
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();
    ctx.restore();

    drawCenterHub();
    drawPointer();
  }

  function indexUnderPointer() {
    if (!items.length || !arc) return -1;
    const pointerAngle = -Math.PI / 2;
    const relative = normalizeAngle(pointerAngle - startAngle);
    return Math.min(items.length - 1, Math.floor(relative / arc));
  }

  // ---------- CONFETTI ----------
  function fireConfetti() {
    if (!confettiLayer || prefersReducedMotion.matches) return;
    confettiLayer.innerHTML = '';
    const colors = ['#ff1744','#00e676','#2979ff','#ffea00','#d500f9','#00e5ff','#ff9100','#76ff03','#ffffff'];
    const count = logicalSize > 520 ? 170 : 120;
    const viewportHeight = Math.max(window.innerHeight, logicalSize);
    const viewportWidth = Math.max(window.innerWidth, logicalSize);

    for (let index = 0; index < count; index += 1) {
      const piece = document.createElement('span');
      const size = 9 + Math.random() * 7;
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.top = `${-3 - Math.random() * 8}%`;
      piece.style.width = `${size}px`;
      piece.style.height = `${size * (0.85 + Math.random() * 0.8)}px`;
      piece.style.borderRadius = index % 4 === 0 ? '50%' : '2px';
      piece.style.background = colors[index % colors.length];
      piece.style.border = '1px solid rgba(255,255,255,.85)';
      piece.style.boxShadow = '0 1px 4px rgba(0,0,0,.35)';
      piece.style.animation = 'none';
      confettiLayer.appendChild(piece);

      const horizontal = (Math.random() - 0.5) * viewportWidth * 0.32;
      const rotation = 540 + Math.random() * 900;
      piece.animate(
        [
          { transform: 'translate(0, -20px) rotate(0deg) scale(1)', opacity: 1 },
          { transform: `translate(${horizontal}px, ${viewportHeight * 1.12}px) rotate(${rotation}deg) scale(.85)`, opacity: 0.96 }
        ],
        {
          duration: 1450 + Math.random() * 900,
          delay: Math.random() * 320,
          easing: 'cubic-bezier(.16,.72,.25,1)',
          fill: 'forwards'
        }
      );
    }
    window.setTimeout(() => { confettiLayer.innerHTML = ''; }, 3000);
  }

  // ---------- SPIN ----------
  function setSpinningState(value) {
    spinning = value;
    spinBtn.disabled = value;
    spinBtn.textContent = value ? 'Spinning…' : 'Spin the Wheel';
    wheelSurface?.setAttribute('aria-disabled', value ? 'true' : 'false');
  }

  function triggerSpin() {
    ensureAudio();
    spin();
  }

  function spin() {
    if (spinning) return;
    if (!items.length) {
      setStatus('Add at least one item');
      textarea.focus();
      return;
    }

    setSpinningState(true);
    resultEl.textContent = '';
    setStatus('Spinning…');
    arc = TWO_PI / items.length;

    const targetIndex = Math.floor(Math.random() * items.length);
    const startingAngle = startAngle;
    const targetSliceCenterAtPointer = -Math.PI / 2 - (targetIndex + 0.5) * arc;
    const extraTurns = prefersReducedMotion.matches ? 2 : 6 + Math.floor(Math.random() * 3);
    let endingAngle = targetSliceCenterAtPointer;
    while (endingAngle <= startingAngle) endingAngle += TWO_PI;
    endingAngle += extraTurns * TWO_PI;

    const duration = prefersReducedMotion.matches ? 1300 : 5000 + Math.random() * 900;
    const startedAt = performance.now();
    lastTickIndex = indexUnderPointer();

    function animate(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      startAngle = startingAngle + (endingAngle - startingAngle) * eased;
      drawWheel();

      const currentIndex = indexUnderPointer();
      if (currentIndex !== lastTickIndex) {
        lastTickIndex = currentIndex;
        clickTick();
      }

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        finishSpin(targetIndex, endingAngle);
      }
    }

    rafId = requestAnimationFrame(animate);
  }

  function finishSpin(targetIndex, endingAngle) {
    if (rafId) cancelAnimationFrame(rafId);
    startAngle = normalizeAngle(endingAngle);
    drawWheel();

    const winner = items[targetIndex];
    resultEl.textContent = `🎉 ${winner}`;
    setStatus('Winner selected');
    if (confettiToggle?.checked) fireConfetti();
    celebrateSound();
    showOverlay(winner);

    if (removeAfter?.checked) {
      items.splice(targetIndex, 1);
      textarea.value = items.join('\n');
      updateEntryCount();
      window.setTimeout(drawWheel, 260);
    }

    setSpinningState(false);
  }

  // ---------- WINNER OVERLAY ----------
  function showOverlay(name) {
    if (!overlay || !overlayWinner) return;
    overlayWinner.textContent = name;
    overlay.classList.add('show');
    overlayClose?.focus();
  }

  function closeOverlay() {
    overlay?.classList.remove('show');
    wheelSurface?.focus();
  }

  overlayClose?.addEventListener('click', closeOverlay);
  overlay?.addEventListener('click', (event) => {
    if (event.target === overlay) closeOverlay();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay?.classList.contains('show')) closeOverlay();
  });

  // ---------- FULLSCREEN / PRESENTATION ----------
  function updateFullscreenButton() {
    if (!fullscreenBtn) return;
    const active = document.fullscreenElement === wheelApp;
    fullscreenBtn.textContent = active ? '↙ Exit Presentation' : '⛶ Presentation Mode';
    fullscreenBtn.setAttribute('aria-label', active ? 'Exit presentation mode' : 'Enter presentation mode');
  }

  if (!document.fullscreenEnabled || !wheelApp?.requestFullscreen) {
    if (fullscreenBtn) fullscreenBtn.hidden = true;
  } else {
    fullscreenBtn?.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else {
          await wheelApp.requestFullscreen();
        }
      } catch {
        setStatus('Presentation mode unavailable');
      }
    });
    document.addEventListener('fullscreenchange', () => {
      updateFullscreenButton();
      window.setTimeout(scheduleResize, 80);
    });
  }
  updateFullscreenButton();

  // ---------- LIST / UI ----------
  function readTextarea() {
    items = textarea.value.split('\n').map((value) => value.trim()).filter(Boolean);
    updateEntryCount();
    drawWheel();
  }

  textarea.addEventListener('input', readTextarea);
  paletteSel?.addEventListener('change', () => {
    localStorage.setItem(PALETTE_KEY, paletteSel.value);
    drawWheel();
  });
  spinBtn.addEventListener('click', triggerSpin);
  wheelSurface?.addEventListener('click', triggerSpin);
  wheelSurface?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      triggerSpin();
    }
  });

  clearBtn?.addEventListener('click', () => {
    if (spinning) return;
    textarea.value = '';
    items = [];
    resultEl.textContent = '';
    updateEntryCount();
    drawWheel();
    setStatus('List cleared');
  });

  shuffleBtn?.addEventListener('click', () => {
    if (spinning) return;
    for (let index = items.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
    }
    textarea.value = items.join('\n');
    drawWheel();
    setStatus('List shuffled');
    window.setTimeout(() => setStatus('Ready'), 900);
  });

  saveBtn?.addEventListener('click', () => {
    const payload = {
      items: textarea.value,
      rm: !!removeAfter?.checked,
      confetti: !!confettiToggle?.checked,
      palette: paletteSel?.value || 'vibrant'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setStatus('List saved');
    window.setTimeout(() => setStatus('Ready'), 900);
  });

  restoreBtn?.addEventListener('click', () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setStatus('No saved list found');
      return;
    }
    try {
      const data = JSON.parse(raw);
      textarea.value = data.items || '';
      if (removeAfter) removeAfter.checked = !!data.rm;
      if (confettiToggle) confettiToggle.checked = data.confetti !== false;
      if (paletteSel) paletteSel.value = data.palette || paletteSel.value;
      readTextarea();
      setStatus('Saved list restored');
      window.setTimeout(() => setStatus('Ready'), 900);
    } catch {
      setStatus('Saved list could not be restored');
    }
  });

  shareBtn?.addEventListener('click', async () => {
    const params = new URLSearchParams();
    if (textarea.value.trim()) params.set('items', textarea.value.split('\n').map(encodeURIComponent).join('|'));
    if (removeAfter?.checked) params.set('rm', '1');
    if (confettiToggle?.checked) params.set('confetti', '1');
    params.set('palette', paletteSel?.value || 'vibrant');
    const url = `${location.origin}${location.pathname}?${params.toString()}`;

    try {
      await navigator.clipboard.writeText(url);
      setStatus('Share link copied');
    } catch {
      window.prompt('Copy this link:', url);
    } finally {
      window.setTimeout(() => setStatus('Ready'), 1200);
    }
  });

  // ---------- INIT ----------
  const qs = new URLSearchParams(location.search);
  const queryPalette = qs.get('palette');
  const savedPalette = localStorage.getItem(PALETTE_KEY);
  if (paletteSel) paletteSel.value = queryPalette || savedPalette || 'vibrant';

  // Keep the classroom sample consistent even after the list is cleared.
  textarea.placeholder = SAMPLE_NAMES.join('\n');

  const itemsParam = qs.get('items');
  if (itemsParam) {
    textarea.value = itemsParam.split('|').map(decodeURIComponent).join('\n');
    if (removeAfter) removeAfter.checked = qs.get('rm') === '1';
    if (confettiToggle) confettiToggle.checked = qs.get('confetti') === '1' || confettiToggle.checked;
  } else if (!textarea.value.trim()) {
    textarea.value = SAMPLE_NAMES.join('\n');
  }

  readTextarea();
  setStatus('Ready');
  requestAnimationFrame(resizeCanvas);
})();