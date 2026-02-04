const TYPE_ICONS = {
  game: "🎮",
  "escape-room": "🗝️",
  simulation: "🧪",
  activity: "🧩",
};

const TYPE_LABELS = {
  game: "Game",
  "escape-room": "Escape Room",
  simulation: "Simulation",
  activity: "Activity",
};

export default function InteractiveExperienceLink({ experience }) {
  if (!experience) return null;

  const {
    title,
    canonicalUrl,
    type,
    icon,
    blurb,
    duration,
    deviceNotes,
  } = experience;

  const fallbackDescriptor = [TYPE_LABELS[type] || "Interactive experience", duration, deviceNotes]
    .filter(Boolean)
    .join(" • ");

  const iconValue = icon || TYPE_ICONS[type] || "🎮";
  const iconNode = typeof iconValue === "string" && iconValue.includes("/")
    ? <img src={iconValue} alt="" />
    : iconValue;

  return (
    <article className="interactive-feature">
      <div className="interactive-feature-main">
        <span className="interactive-icon" aria-hidden="true">
          {iconNode}
        </span>
        <div className="interactive-feature-content">
          <h3>{title}</h3>
          <p>{blurb || fallbackDescriptor}</p>
        </div>
      </div>
      <a className="interactive-cta" href={canonicalUrl}>
        {["game", "escape-room"].includes(type) ? "Play" : "Open"}
      </a>
    </article>
  );
}
