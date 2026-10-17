(() => {
  'use strict';

  const ROOM_ONE_PARTS = [
    '/escape-v2/rooms/french-revolution/art/bastille-room1.part1',
    '/escape-v2/rooms/french-revolution/art/bastille-room1.part2',
    '/escape-v2/rooms/french-revolution/art/bastille-room1.part3',
    '/escape-v2/rooms/french-revolution/art/bastille-room1.part4'
  ];

  async function loadBinaryImage(parts) {
    const responses = await Promise.all(parts.map((url) => fetch(url, { cache: 'force-cache' })));
    responses.forEach((response) => {
      if (!response.ok) throw new Error(`Could not load panorama part: ${response.url}`);
    });
    const buffers = await Promise.all(responses.map((response) => response.arrayBuffer()));
    return URL.createObjectURL(new Blob(buffers, { type: 'image/jpeg' }));
  }

  window.ESCAPE_V2_ART = {
    async frenchRevolution() {
      return {
        bastilleCell: await loadBinaryImage(ROOM_ONE_PARTS)
      };
    }
  };
})();
