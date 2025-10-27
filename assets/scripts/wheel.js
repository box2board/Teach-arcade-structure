(() => {
  const canvas = document.getElementById('wheelCanvas');
  const textarea = document.getElementById('items');
  const result = document.getElementById('result');
  const spinBtn = document.getElementById('spin');
  const clearBtn = document.getElementById('clear');
  const shuffleBtn = document.getElementById('shuffle');

  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let items = [];
  let startAngle = 0;
  let arc = 0;
  let spinHandle = null;

  function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!items.length) {
      // empty wheel background
      ctx.beginPath();
      ctx.arc(200, 200, 200, 0, Math.PI * 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();
      drawPointer();
      return;
    }
    arc = Math.PI * 2 / items.length;
    for (let i = 0; i < items.length; i++) {
      const angle = startAngle + i * arc;
      ctx.beginPath();
      ctx.moveTo(200, 200);
      ctx.arc(200, 200, 200, angle, angle + arc);
      ctx.closePath();
      ctx.fillStyle = `hsl(${(i * 360 / items.length)},80%,60%)`;
      ctx.fill();

      // labels
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

  function drawPointer() {
    ctx.beginPath();
    ctx.moveTo(200, 4);
    ctx.lineTo(186, 28);
    ctx.lineTo(214, 28);
    ctx.closePath();
    ctx.fillStyle = 'red';
    ctx.fill();
  }

  function easeOut(t, b, c, d) {
    t /= d; t--; return c * (t*t*t + 1) + b;
  }

  function spin() {
    if (!items.length) { alert('Add at least one item.'); return; }

    let spinTime = 0;
    const spinTimeTotal = 4000 + Math.random() * 3000; // 4–7s
    const maxSpeed = 12 + Math.random() * 10;          // deg per tick

    (function animate() {
      spinTime += 16;
      if (spinTime >= spinTimeTotal) return stop();

      const delta = easeOut(spinTime, 0, maxSpeed, spinTimeTotal);
      startAngle += (delta * Math.PI / 180);
      drawWheel();
      spinHandle = requestAnimationFrame(animate);
    })();

    function stop() {
      if (spinHandle) cancelAnimationFrame(spinHandle);
      const degrees = startAngle * 180 / Math.PI + 90;
      const segment = (arc * 180 / Math.PI);
      const index = Math.floor((360 - (degrees % 360)) / segment) % items.length;
      result.textContent = `🎉 Result: ${items[index]}!`;
    }
  }

  function readTextarea() {
    items = textarea.value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    drawWheel();
  }

  // wire up
  textarea.addEventListener('input', readTextarea);
  spinBtn.addEventListener('click', spin);
  clearBtn.addEventListener('click', () => {
    textarea.value = '';
    items = [];
    result.textContent = '';
    drawWheel();
  });
  shuffleBtn.addEventListener('click', () => {
    items = items.sort(() => Math.random() - 0.5);
    textarea.value = items.join('\n');
    drawWheel();
  });

  // First draw (empty wheel), and auto-draw if content exists on load
  drawWheel();
  if (textarea.value.trim()) readTextarea();
})();
