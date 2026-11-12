export const WIDTH = 3.4;
const ORIGINAL = [
  {
    id: "start",
    name: "Launch deck",
    category: "Essentials",
    length: 7,
    kind: "straight",
    interaction: "start",
  },
  {
    id: "short",
    name: "Short straight",
    category: "Essentials",
    length: 4,
    kind: "straight",
  },
  {
    id: "straight",
    name: "Straight",
    category: "Essentials",
    length: 8,
    kind: "straight",
  },
  {
    id: "long",
    name: "Long straight",
    category: "Essentials",
    length: 14,
    kind: "straight",
  },
  {
    id: "left",
    name: "Left bend",
    category: "Curves",
    radius: 9,
    angle: Math.PI / 2,
    kind: "curve",
  },
  {
    id: "right",
    name: "Right bend",
    category: "Curves",
    radius: 9,
    angle: -Math.PI / 2,
    kind: "curve",
  },
  {
    id: "gentle-left",
    name: "Gentle left",
    category: "Curves",
    radius: 15,
    angle: Math.PI / 4,
    kind: "curve",
  },
  {
    id: "gentle-right",
    name: "Gentle right",
    category: "Curves",
    radius: 15,
    angle: -Math.PI / 4,
    kind: "curve",
  },
  {
    id: "uturn",
    name: "Hairpin",
    category: "Curves",
    radius: 6,
    angle: Math.PI,
    kind: "curve",
  },
  {
    id: "bank",
    name: "Banked bend",
    category: "Curves",
    radius: 11,
    angle: Math.PI / 2,
    bank: 0.24,
    kind: "curve",
  },
  {
    id: "rise",
    name: "Climb +3m",
    category: "Elevation",
    length: 12,
    rise: 3,
    kind: "slope",
  },
  {
    id: "fall",
    name: "Descent −3m",
    category: "Elevation",
    length: 12,
    rise: -3,
    kind: "slope",
  },
  {
    id: "ramp",
    name: "Jump ramp",
    category: "Elevation",
    length: 8,
    rise: 2.5,
    kind: "ramp",
  },
  {
    id: "landing",
    name: "Landing ramp",
    category: "Elevation",
    length: 10,
    rise: -2.5,
    kind: "landing",
  },
  {
    id: "bridge",
    name: "Bridge deck",
    category: "Elevation",
    length: 12,
    kind: "straight",
  },
  {
    id: "boost",
    name: "Pulse booster",
    category: "Essentials",
    length: 7,
    kind: "straight",
    interaction: "boost",
  },
  {
    id: "finish",
    name: "Finish gate",
    category: "Essentials",
    length: 7,
    kind: "straight",
    interaction: "finish",
  },
];
const EXTRA = [];
for (const [label, radius, degrees] of [
  ["Compact 45°", 6, 45],
  ["Sweeper 45°", 18, 45],
  ["Compact 90°", 6, 90],
  ["Sweeper 90°", 18, 90],
  ["Broad 135°", 12, 135],
  ["Wide hairpin", 12, 180],
])
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ])
    EXTRA.push({
      id: `curve-${radius}-${degrees}-${side}`,
      name: `${label} ${side}`,
      category: "Curves",
      kind: "curve",
      radius,
      angle: (sign * degrees * Math.PI) / 180,
    });
for (const [radius, degrees, bank] of [
  [8, 45, 0.3],
  [12, 90, 0.4],
  [16, 135, 0.3],
])
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ])
    EXTRA.push({
      id: `bank-${radius}-${side}`,
      name: `Bank ${degrees}° ${side}`,
      category: "Banked",
      kind: "curve",
      radius,
      angle: (sign * degrees * Math.PI) / 180,
      bank: sign * bank,
    });
for (const [length, rise] of [
  [8, 1],
  [16, 2],
  [18, 5],
  [24, 6],
])
  for (const sign of [1, -1])
    EXTRA.push({
      id: `slope-${length}-${sign}`,
      name: `${sign > 0 ? "Climb" : "Descent"} ${rise}m / ${length}m`,
      category: "Elevation",
      kind: "slope",
      length,
      rise: rise * sign,
    });
for (const [label, length, rise] of [
  ["Mini", 6, 1],
  ["Distance", 14, 3],
  ["Sky", 12, 4],
])
  for (const landing of [false, true])
    EXTRA.push({
      id: `jump-${label.toLowerCase()}-${landing ? "landing" : "launch"}`,
      name: `${label} ${landing ? "landing" : "launch"}`,
      category: "Jumps",
      kind: landing ? "landing" : "ramp",
      length,
      rise: rise * (landing ? -1 : 1),
    });
for (const [label, kind, length, amplitude, waves] of [
  ["Rolling hills", "wave", 24, 1.5, 2],
  ["Camelback", "wave", 18, 3, 1],
  ["Speed humps", "wave", 20, 0.6, 3],
  ["S-bend left", "chicane", 22, 4, 1],
  ["S-bend right", "chicane", 22, -4, 1],
  ["Slalom", "chicane", 30, 2.5, 2],
])
  EXTRA.push({
    id: label.toLowerCase().replaceAll(" ", "-"),
    name: label,
    category: "Stunts",
    kind,
    length,
    amplitude,
    waves,
  });
EXTRA.push(
  {
    id: "boost-long",
    name: "Turbo runway",
    category: "Specials",
    kind: "straight",
    length: 14,
    interaction: "boost",
  },
  {
    id: "boost-curve",
    name: "Booster bend",
    category: "Specials",
    kind: "curve",
    radius: 12,
    angle: Math.PI / 2,
    interaction: "boost",
  },
  {
    id: "brake",
    name: "Brake zone",
    category: "Specials",
    kind: "straight",
    length: 10,
    interaction: "brake",
  },
  {
    id: "tunnel-short",
    name: "Portal tunnel",
    category: "Specials",
    kind: "straight",
    length: 8,
    tunnel: true,
  },
  {
    id: "tunnel-long",
    name: "Long tunnel",
    category: "Specials",
    kind: "straight",
    length: 16,
    tunnel: true,
  },
);
EXTRA.push({
  id: "vertical-loop",
  name: "Vertical loop",
  category: "Stunts",
  kind: "loop",
  length: 40,
  radius: 5,
  lead: 8,
});
const SCENERY = [
  ["pine", "Pine Tree", "🌲", "#138b68"],
  ["oak", "Round Tree", "🌳", "#59bc43"],
  ["palm", "Palm Tree", "🌴", "#1ba775"],
  ["boulder", "Boulder Cluster", "🪨", "#777b9e"],
  ["flowers", "Flower Bed", "🌷", "#ff65a5"],
  ["pond", "Pond", "💧", "#29bdff"],
  ["banner", "Race Banner", "🏁", "#ffb900"],
  ["stands", "Grandstand", "🏟️", "#575ce5"],
  ["tent", "Pit Tent", "⛺", "#ff685d"],
  ["fence", "Trackside Fence", "🟨", "#ffbb26"],
  ["willow", "Willow Tree", "🌳", "#65ad65"],
  ["birch", "Birch Grove", "🌳", "#a7ce49"],
  ["cactus", "Desert Cactus", "🌵", "#3fae7a"],
  ["bush", "Berry Bush", "🌿", "#62af43"],
  ["hedge", "Trimmed Hedge", "🌿", "#278c50"],
  ["bamboo", "Bamboo Stand", "🎋", "#a4c552"],
  ["mushrooms", "Mushroom Patch", "🍄", "#ee5a71"],
  ["reeds", "Pond Reeds", "🌾", "#849e4a"],
  ["hill", "Grassy Hill", "⛰️", "#6bc866"],
  ["ridge", "Mountain Ridge", "🏔️", "#7d8ba4"],
  ["cliff", "Layered Cliff", "🪨", "#c98055"],
  ["arch", "Stone Arch", "🪨", "#b88873"],
  ["waterfall", "Waterfall", "💦", "#4bcaff"],
  ["island", "Tiny Island", "🏝️", "#92cc5b"],
  ["sandbank", "Sand Dune", "🏜️", "#efc77f"],
  ["cones", "Traffic Cones", "🚧", "#ff7228"],
  ["tires", "Tire Barrier", "🛞", "#3a3753"],
  ["lamp", "Track Light", "💡", "#ffe07a"],
  ["scoreboard", "Scoreboard", "📋", "#6457db"],
  ["podium", "Winner Podium", "🏆", "#ffca38"],
  ["booth", "Marshal Booth", "🚩", "#ff7366"],
  ["garage", "Pit Garage", "🏠", "#7874da"],
  ["pump", "Fuel Pump", "⛽", "#e94367"],
  ["barn", "Barn", "🏡", "#d84e62"],
  ["warehouse", "Warehouse", "🏭", "#7396c9"],
  ["apartments", "Apartment Block", "🏢", "#b5a0ed"],
  ["skyline", "City Skyline", "🌆", "#7074c0"],
  ["turbine", "Wind Turbine", "🌬️", "#dfe8fa"],
  ["tower", "Water Tower", "💧", "#4ebbd5"],
].map(([id, name, emoji, color]) => ({
  id: `scenery-${id}`, name, emoji, color, kind: "scenery", category: "Scenery", length: 4,
}));
export const isScenery = (piece) => asset(piece.type)?.kind === "scenery";
export const PALETTE = {
  Essentials: "#ff7626",
  Curves: "#008dff",
  Elevation: "#853dff",
  Banked: "#ef299d",
  Jumps: "#ffbe00",
  Stunts: "#00bfa0",
  Specials: "#ff3f66",
};
export const CATALOG = [...ORIGINAL, ...EXTRA, ...SCENERY].map((a) => ({
  color: PALETTE[a.category],
  ...a,
  dimensions: {
    width: WIDTH,
    length: a.length || a.radius * Math.abs(a.angle),
    height: Math.abs(a.rise || a.amplitude || 0),
  },
  connections: a.kind === "scenery" ? [] : ["entry", "exit"],
  orientations: "yaw; surface pitch from profile",
  performanceCost: Math.ceil((a.length || a.radius * Math.abs(a.angle)) * 5),
  interactions: a.interaction ? [a.interaction] : [],
}));
export const asset = (id) => CATALOG.find((a) => a.id === id);
export function icon(a) {
  let d =
    a.kind === "loop"
      ? "M6 43 L28 43 C78 43 73 3 42 8 C12 13 13 43 48 43 L74 43"
      : a.kind === "chicane"
        ? "M8 36 C25 0 52 56 72 16"
        : a.kind === "wave"
          ? "M8 40 Q24 0 40 30 T72 25"
          : a.kind === "curve"
            ? "M14 45 Q14 14 66 14"
            : a.rise
              ? "M12 44 L68 16"
              : "M12 42 L68 18";
  return `<svg viewBox="0 0 80 56" aria-hidden="true"><path d="${d}" fill="none" stroke="#d9e9ff" stroke-width="20" transform="translate(0 4)"/><path d="${d}" fill="none" stroke="${a.color}" stroke-width="17"/><path d="${d}" fill="none" stroke="#e4fff5" stroke-dasharray="3 5" stroke-width="1.5"/></svg>`;
}
