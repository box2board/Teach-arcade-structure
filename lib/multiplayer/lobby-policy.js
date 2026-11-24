const aliases = ['Rocket Fox','Pixel Panda','Cosmic Turtle','Turbo Tiger','Nova Otter','Comet Lynx','Orbit Finch','Jade Yak'];
export function lobbyName(input, room, except) {
  const taken = new Set(room.players.filter(player => player.id !== except).map(player => player.name.toLowerCase()));
  const name = typeof input === 'string' ? input.normalize('NFKC').replace(/\s+/gu, ' ').trim() : '';
  const comparison = name.toLowerCase().replace(/[013457@]/g, value => ({'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','@':'a'})[value]).replace(/[^a-z]/g,'');
  const safe = /^[\p{L}\p{M}][\p{L}\p{M}\p{N} _'’.-]{1,23}$/u.test(name)
    && !/(?:www\.|https?|\d{4,})/i.test(name)
    && !/(?:fuck|shit|bitch|bastard|asshole|cunt|whore|slut|nigg|naz[iy])/.test(comparison);
  let candidate = safe ? name : aliases.find(alias => !taken.has(alias.toLowerCase())) ?? 'Arcade Player';
  if (taken.has(candidate.toLowerCase())) {
    const base = candidate.slice(0, 20);
    let suffix = 2;
    while (taken.has((base+' '+suffix).toLowerCase())) suffix++;
    candidate = base+' '+suffix;
  }
  return candidate;
}
