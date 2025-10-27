(() => {
  const status = document.getElementById('status');
  const setStatus = (m) => status && (status.textContent = `Status: ${m}`);

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

  setStatus('Ready');

  // --- state ---
  let items = [];
  let startAngle = 0;
  let arc = 0;
  let rafId = 0;

  // --- helpers ---
  function drawPointer() {
    // pointer at top, pointing DOWN into the wheel
    ctx.beginPath();
    ctx.moveTo(200, 34);   // tip (down)
    ctx.lineTo(186, 10);   // left of base
    ctx.lineTo(214, 10);   // right of base
    ctx.closePath();
    ctx.fillStyle = 'red';
    ctx.fill();
  }

  function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Empty wheel placeholder
    if (!items.length) {
      ctx.beginPath();
      ctx.arc(200, 200, 200, 0, Math.PI * 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();
      drawPointer();
      return;
    }

    arc = (Math.PI * 2) / items.length;

    for (let i = 0; i < items.length; i++) {
      const angle = startAngle + i * arc;

      // slice
      ctx.beginPath();
      ctx.moveTo(200, 200);
      ctx.arc(200, 200, 200, angle, angle + arc);
      ctx.closePath();
      ctx.fillStyle = `hsl(${(i * 360 / items.length)},80%,60%)`;
      ctx.fill();

      // label
      ctx.save();
      ctx.translate(200, 200);
      ctx.rotate(angle + arc / 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Nunito, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(String(items[i]).slice(0, 18), 90, 6);
      ctx.restore();
    }

    drawPointer();
  }

  function easeOut(t, b, c, d) {
    t /= d; t--;
    return c * (t * t * t + 1) + b;
  }

  function pickIndexFromAngle() {
    // pointer is at 12 o’clock. The slice under the pointer corresponds to this math:
    const degrees = (startAngle * 180 / Math.PI) % 360;
    const normalized = (360 - (degrees + 90) % 360); // align to pointer at top
    const sliceDeg = arc * 180 / Math.PI;
    return Math.floor(normalized / sliceDeg) % items.length;
  }

  function spin() {
    if (!items.length) { alert('Add at least one item.'); return; }
    resultEl.textContent = '';

    let t = 0;
    const total = 4000 + Math.random() * 3000;
    const maxSpeed = 12 + Math.random() * 10;

    (function animate() {
      t += 16;
      if (t >= total) return stop();
      const delta = easeOut(t, 0, maxSpeed, total);
      startAngle += (delta * Math.PI / 180);
      drawWheel();
      rafId = requestAnimationFrame(animate);
    })();

    function stop() {
      if (rafId) cancelAnimationFrame(rafId);
      const idx = pickIndexFromAngle();
      const winner = items[idx];
      resultEl.textContent = `🎉 Result: ${winner}!`;

      if (confettiToggle.checked) fireConfetti();

      if (removeAfter.checked) {
        // remove the chosen slice and re-render
        items.splice(idx, 1);
        textarea.value = items.join('\n');
        setTimeout(drawWheel, 250);
      }
    }
  }

  function fireConfetti() {
    if (!confettiLayer) return;
    confettiLayer.innerHTML = '';
    const colors = ['#ef4444','#22c55e','#3b82f6','#f59e0b','#a855f7','#06b6d4','#eab308'];
    for (let i = 0; i < 80; i++) {
      const s = document.createElement('span');
      const color = colors[i % colors.length];
      s.style.left = (Math.random() * 100) + '%';
      s.style.top = (Math.random() * 10) + '%';
      s.style.background = color;
      s.style.animationDelay = (Math.random() * 0.4) + 's';
      s.style.transform = `translateY(-20px) rotate(${Math.random()*360}deg)`;
      confettiLayer.appendChild(s);
    }
    setTimeout(() => { confettiLayer.innerHTML = ''; }, 1400);
  }

  function readTextarea() {
    items = textarea.value.split('\n').map(s => s.trim()).filter(Boolean);
    drawWheel();
  }

  // --- UI wiring ---
  textarea.addEventListener('input', readTextarea);
  spinBtn.addEventListener('click', spin);
  clearBtn.addEventListener('click', () => {
    textarea.value = '';
    items = [];
    resultEl.textContent = '';
    drawWheel();
  });
  shuffleBtn.addEventListener('click', () => {
    items = items.sort(() => Math.random() - 0.5);
    textarea.value = items.join('\n');
    drawWheel();
  });

  // Save/restore
  const STORAGE_KEY = 'ta-wheel-v1';
  saveBtn.addEventListener('click', () => {
    const payload = {
      items: textarea.value,
      removeAfter: !!removeAfter.checked,
      confetti: !!confettiToggle.checked
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setStatus('Saved!');
    setTimeout(() => setStatus('Ready'), 800);
  });

  restoreBtn.addEventListener('click', () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      textarea.value = data.items || '';
      removeAfter.checked = !!data.removeAfter;
      confettiToggle.checked = !!data.confetti;
      readTextarea();
      setStatus('Restored');
      setTimeout(() => setStatus('Ready'), 800);
    } catch { /* ignore */ }
  });

  // Share link (encodes items & options into query string)
  shareBtn.addEventListener('click', async () => {
    const params = new URLSearchParams();
    if (textarea.value.trim()) params.set('items', textarea.value.split('\n').map(encodeURIComponent).join('|'));
    if (removeAfter.checked) params.set('rm', '1');
    if (confettiToggle.checked) params.set('confetti', '1');
    const url = `${location.origin}${location.pathname}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setStatus('Share link copied!');
    } catch {
      prompt('Copy this link:', url);
    } finally {
      setTimeout(() => setStatus('Ready'), 1200);
    }
  });

  // Read from query string (share links)
  (function hydrateFromQuery() {
    const qs = new URLSearchParams(location.search);
    const itemsParam = qs.get('items');
    if (itemsParam) {
      const decoded = itemsParam.split('|').map(decodeURIComponent).join('\n');
      textarea.value = decoded;
    }
    removeAfter.checked = qs.get('rm') === '1' || removeAfter.checked;
    confettiToggle.checked = qs.get('confetti') === '1' || confettiToggle.checked;
  })();

  // initial content (if empty)
  if (!textarea.value.trim()) {
    textarea.value = ['Ash','Jaime','Teddy','Ami','Dave','Charlie','Gary','Naomi'].join('\n');
  }
  readTextarea();
})();
