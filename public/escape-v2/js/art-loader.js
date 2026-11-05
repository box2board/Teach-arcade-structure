(() => {
  'use strict';

  const ROOM_ONE_HD_PARTS = [
    '/escape-v2/rooms/french-revolution/art/repair/r1a',
    '/escape-v2/rooms/french-revolution/art/repair/r1b',
    '/escape-v2/rooms/french-revolution/art/repair/r2a',
    '/escape-v2/rooms/french-revolution/art/repair/r2b',
    '/escape-v2/rooms/french-revolution/art/bastille-room1-hd.part3',
    '/escape-v2/rooms/french-revolution/art/bastille-room1-hd.part4',
    '/escape-v2/rooms/french-revolution/art/repair/r5-01',
    '/escape-v2/rooms/french-revolution/art/repair/r5-02',
    '/escape-v2/rooms/french-revolution/art/repair/r5-03',
    '/escape-v2/rooms/french-revolution/art/repair/r5-04',
    '/escape-v2/rooms/french-revolution/art/repair/r5-05',
    '/escape-v2/rooms/french-revolution/art/repair/r5-06',
    '/escape-v2/rooms/french-revolution/art/repair/r5-07',
    '/escape-v2/rooms/french-revolution/art/repair/r5-08',
    '/escape-v2/rooms/french-revolution/art/repair/r5-09',
    '/escape-v2/rooms/french-revolution/art/repair/r5-10',
    '/escape-v2/rooms/french-revolution/art/repair/r5-11',
    '/escape-v2/rooms/french-revolution/art/repair/r5-12',
    '/escape-v2/rooms/french-revolution/art/repair/r6-01',
    '/escape-v2/rooms/french-revolution/art/repair/r6-02',
    '/escape-v2/rooms/french-revolution/art/repair/r6-03',
    '/escape-v2/rooms/french-revolution/art/repair/r6-04',
    '/escape-v2/rooms/french-revolution/art/repair/r6-05',
    '/escape-v2/rooms/french-revolution/art/repair/r6-06',
    '/escape-v2/rooms/french-revolution/art/repair/r6-07',
    '/escape-v2/rooms/french-revolution/art/repair/r6-08',
    '/escape-v2/rooms/french-revolution/art/repair/r6-09',
    '/escape-v2/rooms/french-revolution/art/repair/r6-10',
    '/escape-v2/rooms/french-revolution/art/repair/r6-11',
    '/escape-v2/rooms/french-revolution/art/repair/r6-12',
    '/escape-v2/rooms/french-revolution/art/bastille-room1-hd.part7',
    '/escape-v2/rooms/french-revolution/art/bastille-room1-hd.part8'
  ];

  const ROOM_ONE_FALLBACK_PARTS = [
    '/escape-v2/rooms/french-revolution/art/bastille-room1.part1',
    '/escape-v2/rooms/french-revolution/art/bastille-room1.part2',
    '/escape-v2/rooms/french-revolution/art/bastille-room1.part3',
    '/escape-v2/rooms/french-revolution/art/bastille-room1.part4'
  ];

  const generatedUrls = new Set();

  async function fetchPart(url, timeoutMs = 12000) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { cache: 'force-cache', signal: controller.signal });
      if (!response.ok) throw new Error(`Could not load panorama part: ${url}`);
      return await response.arrayBuffer();
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function verifyImageCanDecode(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('Room art could not be decoded.'));
      image.src = url;
    });
  }

  async function loadBinaryImage(parts, mimeType, expectedSize = null) {
    const buffers = await Promise.all(parts.map((url) => fetchPart(url)));
    const blob = new Blob(buffers, { type: mimeType });

    if (expectedSize && blob.size !== expectedSize) {
      throw new Error(`Room art size check failed: expected ${expectedSize}, received ${blob.size}.`);
    }

    const url = URL.createObjectURL(blob);
    try {
      await verifyImageCanDecode(url);
      return url;
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('AI room source could not be loaded for cubemap conversion.'));
      image.src = url;
    });
  }

  function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function makeCanvas(size = 1024) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
  }

  function drawWrappedSquare(ctx, image, centerX, cropSize, outputSize) {
    const sourceY = Math.max(0, Math.round((image.height - cropSize) / 2));
    let startX = Math.round(centerX - cropSize / 2);
    let remaining = cropSize;
    let destinationX = 0;
    const imageWidth = image.width;

    startX = ((startX % imageWidth) + imageWidth) % imageWidth;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    while (remaining > 0) {
      const segment = Math.min(remaining, imageWidth - startX);
      const destinationWidth = (segment / cropSize) * outputSize;
      ctx.drawImage(
        image,
        startX,
        sourceY,
        segment,
        cropSize,
        destinationX,
        0,
        destinationWidth,
        outputSize
      );
      remaining -= segment;
      destinationX += destinationWidth;
      startX = 0;
    }
  }

  function addWallFinish(ctx, size) {
    const edge = ctx.createLinearGradient(0, 0, size, 0);
    edge.addColorStop(0, 'rgba(10,8,6,.34)');
    edge.addColorStop(.13, 'rgba(10,8,6,.05)');
    edge.addColorStop(.5, 'rgba(10,8,6,0)');
    edge.addColorStop(.87, 'rgba(10,8,6,.05)');
    edge.addColorStop(1, 'rgba(10,8,6,.34)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, size, size);

    const vertical = ctx.createLinearGradient(0, 0, 0, size);
    vertical.addColorStop(0, 'rgba(8,7,6,.18)');
    vertical.addColorStop(.22, 'rgba(8,7,6,0)');
    vertical.addColorStop(.76, 'rgba(8,7,6,0)');
    vertical.addColorStop(1, 'rgba(8,7,6,.20)');
    ctx.fillStyle = vertical;
    ctx.fillRect(0, 0, size, size);
  }

  function drawCeiling(size) {
    const canvas = makeCanvas(size);
    const ctx = canvas.getContext('2d');
    const random = seededRandom(17890714);

    const base = ctx.createRadialGradient(size * .5, size * .5, 40, size * .5, size * .5, size * .72);
    base.addColorStop(0, '#5a5043');
    base.addColorStop(.55, '#433b32');
    base.addColorStop(1, '#26221d');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);

    ctx.lineWidth = Math.max(2, size / 300);
    ctx.strokeStyle = 'rgba(26,22,18,.55)';
    const rows = 9;
    const rowH = size / rows;
    for (let row = 0; row <= rows; row += 1) {
      const y = row * rowH + (random() - .5) * 10;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y + (random() - .5) * 7);
      ctx.stroke();
    }
    for (let row = 0; row < rows; row += 1) {
      const columns = 6;
      const colW = size / columns;
      const offset = row % 2 ? colW * .5 : 0;
      for (let col = -1; col <= columns; col += 1) {
        const x = col * colW + offset + (random() - .5) * 12;
        const y1 = row * rowH;
        const y2 = (row + 1) * rowH;
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x + (random() - .5) * 8, y2);
        ctx.stroke();
      }
    }

    // Hairline cracks and faint cobwebs keep the ceiling atmospheric without
    // introducing gameplay-critical detail directly overhead.
    ctx.strokeStyle = 'rgba(20,17,14,.42)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 18; i += 1) {
      const x = random() * size;
      const y = random() * size;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (random() - .5) * 110, y + (random() - .5) * 85);
      ctx.lineTo(x + (random() - .5) * 170, y + (random() - .5) * 150);
      ctx.stroke();
    }

    return canvas;
  }

  function drawFloor(size) {
    const canvas = makeCanvas(size);
    const ctx = canvas.getContext('2d');
    const random = seededRandom(17890715);

    const base = ctx.createRadialGradient(size * .5, size * .42, 50, size * .5, size * .5, size * .75);
    base.addColorStop(0, '#665949');
    base.addColorStop(.58, '#4b4034');
    base.addColorStop(1, '#2b251f');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(31,26,21,.58)';
    ctx.lineWidth = Math.max(2, size / 250);
    const rows = 8;
    for (let row = 0; row <= rows; row += 1) {
      const y = (row / rows) * size + (random() - .5) * 12;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y + (random() - .5) * 8);
      ctx.stroke();
    }
    for (let row = 0; row < rows; row += 1) {
      const columns = 5;
      const offset = row % 2 ? size / (columns * 2) : 0;
      for (let col = -1; col <= columns; col += 1) {
        const x = (col / columns) * size + offset + (random() - .5) * 14;
        const y1 = (row / rows) * size;
        const y2 = ((row + 1) / rows) * size;
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x + (random() - .5) * 10, y2);
        ctx.stroke();
      }
    }

    // Straw and small debris make the dedicated floor face feel like part of the
    // cell rather than a generic cube bottom.
    ctx.lineWidth = 2;
    for (let i = 0; i < 90; i += 1) {
      const x = random() * size;
      const y = random() * size;
      const length = 12 + random() * 42;
      const angle = random() * Math.PI;
      ctx.strokeStyle = `rgba(185,151,86,${.16 + random() * .24})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }

    const grime = ctx.createRadialGradient(size * .62, size * .58, 10, size * .62, size * .58, size * .22);
    grime.addColorStop(0, 'rgba(33,27,21,.28)');
    grime.addColorStop(1, 'rgba(33,27,21,0)');
    ctx.fillStyle = grime;
    ctx.fillRect(0, 0, size, size);

    return canvas;
  }

  function canvasToObjectUrl(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Could not encode cubemap face.'));
          return;
        }
        const url = URL.createObjectURL(blob);
        generatedUrls.add(url);
        resolve(url);
      }, 'image/webp', .93);
    });
  }

  async function buildCubemapFromAiSource(sourceUrl) {
    const image = await loadImage(sourceUrl);
    const outputSize = 1024;
    const cropSize = Math.min(image.height, Math.round(image.width / 2));

    // Pannellum cubemap order: front, right, back, left, up, down.
    // The four wall faces are derived from overlapping high-resolution views of
    // the existing AI Bastille render. Unlike the old implementation, these are
    // rendered as flat cube planes, so looking down no longer collapses the room
    // into an equirectangular pole.
    const centers = [
      image.width * .50,
      image.width * .75,
      0,
      image.width * .25
    ];

    const wallCanvases = centers.map((centerX) => {
      const canvas = makeCanvas(outputSize);
      const ctx = canvas.getContext('2d');
      drawWrappedSquare(ctx, image, centerX, cropSize, outputSize);
      addWallFinish(ctx, outputSize);
      return canvas;
    });

    const ceiling = drawCeiling(outputSize);
    const floor = drawFloor(outputSize);
    const faces = [...wallCanvases, ceiling, floor];
    return Promise.all(faces.map(canvasToObjectUrl));
  }

  async function loadBastilleCellSource() {
    try {
      return await loadBinaryImage(ROOM_ONE_HD_PARTS, 'image/webp', 93790);
    } catch (error) {
      console.warn('HD Bastille source failed; using the safe fallback.', error);
      return loadBinaryImage(ROOM_ONE_FALLBACK_PARTS, 'image/jpeg');
    }
  }

  async function loadBastilleCellCubemap() {
    const sourceUrl = await loadBastilleCellSource();
    try {
      return await buildCubemapFromAiSource(sourceUrl);
    } finally {
      URL.revokeObjectURL(sourceUrl);
    }
  }

  window.addEventListener('pagehide', () => {
    generatedUrls.forEach((url) => URL.revokeObjectURL(url));
    generatedUrls.clear();
  });

  window.ESCAPE_V2_ART = {
    async frenchRevolution() {
      return {
        bastilleCell: await loadBastilleCellCubemap()
      };
    }
  };
})();
