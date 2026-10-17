(() => {
  'use strict';

  // The HD panorama is stored in verified binary chunks. Keeping the chunks small
  // prevents repository / deployment transfers from silently truncating the image.
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

  // Known-good lower-resolution source. This is only a safety net so a student
  // never gets trapped on an infinite Loading screen if an HD asset fails.
  const ROOM_ONE_FALLBACK_PARTS = [
    '/escape-v2/rooms/french-revolution/art/bastille-room1.part1',
    '/escape-v2/rooms/french-revolution/art/bastille-room1.part2',
    '/escape-v2/rooms/french-revolution/art/bastille-room1.part3',
    '/escape-v2/rooms/french-revolution/art/bastille-room1.part4'
  ];

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
      image.onerror = () => reject(new Error('Panorama image could not be decoded.'));
      image.src = url;
    });
  }

  async function loadBinaryImage(parts, mimeType, expectedSize = null) {
    const buffers = await Promise.all(parts.map((url) => fetchPart(url)));
    const blob = new Blob(buffers, { type: mimeType });

    if (expectedSize && blob.size !== expectedSize) {
      throw new Error(`Panorama size check failed: expected ${expectedSize}, received ${blob.size}.`);
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

  async function loadBastilleCell() {
    try {
      // Exact byte length of the 1536 × 768 production-prototype WebP.
      return await loadBinaryImage(ROOM_ONE_HD_PARTS, 'image/webp', 93790);
    } catch (error) {
      console.warn('HD Bastille panorama failed; using the safe fallback.', error);
      return loadBinaryImage(ROOM_ONE_FALLBACK_PARTS, 'image/jpeg');
    }
  }

  window.ESCAPE_V2_ART = {
    async frenchRevolution() {
      return {
        bastilleCell: await loadBastilleCell()
      };
    }
  };
})();
