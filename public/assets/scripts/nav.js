// /assets/nav.js
(() => {
  /* =========================
     SITE LINKS (MATCH /public)
     ========================= */
  const LINKS = [
    { label: "Home", href: "/" },
    { label: "Subjects", href: "/subjects/" },
    { label: "Arcade Games", href: "/arcade-review-games/" },
    { label: "Brain Arcade", href: "/brain-arcade/" },
    { label: "Teacher Tools", href: "/tools/" },
    { label: "Escape Rooms", href: "/escape/" },
    { label: "Submit", href: "/submit/" },
    { label: "About", href: "/about.html" },
  ];

  const LOGO_SRC = "/assets/images/teach-arcade-logo.png";
  const BRAND_TEXT = "Teach\nArcade";

  /* =========================
     STYLES (SELF-CONTAINED)
     ========================= */
  const style = document.createElement("style");
  style.textContent = `
    :root{
      --nav-bg: rgba(2,6,23,.75);
      --nav-border: rgba(255,255,255,.10);
      --nav-text: rgba(255,255,255,.95);
      --nav-muted: rgba(255,255,255,.75);
      --nav-panel: rgba(2,6,23,.95);
      --nav-shadow: 0 20px 60px rgba(0,0,0,.45);
      --nav-h: 72px;
      --nav-pad: 18px;
      --radius: 14px;
    }

    .ta-header{
      position: sticky;
      top: 0;
      z-index: 9999;
      backdrop-filter: blur(10px);
      background: var(--nav-bg);
      border-bottom: 1px solid var(--nav-border);
    }

    .ta-nav{
      max-width: 1100px;
      height: var(--nav-h);
      margin: 0 auto;
      padding: 0 var(--nav-pad);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    /* Brand */
    .ta-brand{
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--nav-text);
      text-decoration: none;
      font-weight: 900;
      letter-spacing: .3px;
      white-space: pre-line;
    }
    .ta-brand img{
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: block;
    }

    /* Desktop links */
    .ta-links{
      display: flex;
      gap: 18px;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .ta-links a{
      color: var(--nav-muted);
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 10px 12px;
      border-radius: 10px;
      transition: background .15s ease, color .15s ease;
    }
    .ta-links a:hover{
      background: rgba(255,255,255,.08);
      color: var(--nav-text);
    }

    /* Hamburger */
    .ta-burger{
      display: none;
      width: 46px;
      height: 46px;
      border-radius: var(--radius);
      border: 1px solid rgba(255,255,255,.15);
      background: rgba(255,255,255,.06);
      cursor: pointer;
      position: relative;
      flex: 0 0 auto;
    }
    .ta-burger span{
      position: absolute;
      left: 50%;
      width: 22px;
      height: 2px;
      background: #fff;
      border-radius: 2px;
      transform: translateX(-50%);
      transition: transform .18s ease, opacity .18s ease;
    }
    .ta-burger span:nth-child(1){ top: 14px; }
    .ta-burger span:nth-child(2){ top: 22px; }
    .ta-burger span:nth-child(3){ top: 30px; }

    .ta-burger[aria-expanded="true"] span:nth-child(1){
      transform: translateX(-50%) rotate(45deg);
      top: 22px;
    }
    .ta-burger[aria-expanded="true"] span:nth-child(2){
      opacity: 0;
    }
    .ta-burger[aria-expanded="true"] span:nth-child(3){
      transform: translateX(-50%) rotate(-45deg);
      top: 22px;
    }

    /* Overlay + panel */
    .ta-overlay{
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.45);
      opacity: 0;
      pointer-events: none;
      transition: opacity .2s ease;
      z-index: 9998;
    }
    .ta-overlay.open{
      opacity: 1;
      pointer-events: auto;
    }

    .ta-panel{
      position: fixed;
      top: 0;
      right: 0;
      width: min(340px, 86vw);
      height: 100vh;
      background: var(--nav-panel);
      box-shadow: var(--nav-shadow);
      transform: translateX(105%);
      transition: transform .25s ease;
      z-index: 9999;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .ta-panel.open{
      transform: translateX(0);
    }

    .ta-panel ul{
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ta-panel a{
      display: block;
      padding: 14px 14px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 800;
      color: #fff;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.10);
    }
    .ta-panel a:hover{
      background: rgba(255,255,255,.10);
    }

    @media (max-width: 860px){
      .ta-links{ display: none; }
      .ta-burger{ display: block; }
    }
  `;
  document.head.appendChild(style);

  /* =========================
     HEADER MARKUP
     ========================= */
  const header = document.createElement("header");
  header.className = "ta-header";
  header.innerHTML = `
    <nav class="ta-nav">
      <a class="ta-brand" href="/">
        <img src="${LOGO_SRC}" alt="Teach Arcade logo">
        <span>${BRAND_TEXT}</span>
      </a>

      <ul class="ta-links">
        ${LINKS.map(l => `<li><a href="${l.href}">${l.label}</a></li>`).join("")}
      </ul>

      <button class="ta-burger" aria-label="Menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </nav>

    <div class="ta-overlay"></div>

    <aside class="ta-panel" aria-hidden="true">
      <ul>
        ${LINKS.map(l => `<li><a href="${l.href}">${l.label}</a></li>`).join("")}
      </ul>
    </aside>
  `;
  document.body.prepend(header);

  /* =========================
     INTERACTION
     ========================= */
  const burger = header.querySelector(".ta-burger");
  const panel = header.querySelector(".ta-panel");
  const overlay = header.querySelector(".ta-overlay");

  const closeMenu = () => {
    burger.setAttribute("aria-expanded", "false");
    panel.classList.remove("open");
    overlay.classList.remove("open");
    document.documentElement.style.overflow = "";
  };

  const openMenu = () => {
    burger.setAttribute("aria-expanded", "true");
    panel.classList.add("open");
    overlay.classList.add("open");
    document.documentElement.style.overflow = "hidden";
  };

  burger.addEventListener("click", () => {
    burger.getAttribute("aria-expanded") === "true" ? closeMenu() : openMenu();
  });

  overlay.addEventListener("click", closeMenu);
  panel.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeMenu();
  });
})();
