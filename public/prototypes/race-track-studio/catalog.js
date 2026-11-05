export const WIDTH = 3.4;
export const CATALOG = [
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
].map((a) => ({
  ...a,
  dimensions: {
    width: WIDTH,
    length: a.length || a.radius * Math.abs(a.angle),
  },
  connections: ["entry", "exit"],
  orientations: "yaw; surface pitch from profile",
  performanceCost: Math.ceil((a.length || a.radius * Math.abs(a.angle)) * 5),
  interactions: a.interaction ? [a.interaction] : [],
}));
export const asset = (id) => CATALOG.find((a) => a.id === id);
export function icon(a) {
  let d =
    a.kind === "curve"
      ? "M14 45 Q14 14 66 14"
      : a.rise
        ? "M12 44 L68 16"
        : "M12 42 L68 18";
  return `<svg viewBox="0 0 80 56" aria-hidden="true"><path d="${d}" fill="none" stroke="#c4dcd7" stroke-width="20" transform="translate(0 4)"/><path d="${d}" fill="none" stroke="${a.interaction === "boost" ? "#efb449" : "#35b4a7"}" stroke-width="17"/><path d="${d}" fill="none" stroke="#e4fff5" stroke-dasharray="3 5" stroke-width="1.5"/></svg>`;
}
