// /assets/nav.js
(() => {
  /* =========================
     GLOBAL LOADERS (GA4 + ADSENSE)
     - Loads once
     - Skips localhost
     ========================= */
  const isLocal =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

  const GA4_ID = "G-NBQHSPW9GH";
  const ADSENSE_CLIENT = "ca-pub-7899890641544647";

  const loadScriptOnce = (src, attrs = {}) => {
    if (document.querySelector(`script[src="${src}"]`)) return;
    const s = document.createElement("script");
    s.src = src;
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "crossorigin") s.crossOrigin = v;
      else s.setAttribute(k, v);
    });
    document.head.appendChild(s);
  };

  // GA4 (site-wide)
  if (!isLocal) {
    loadScriptOnce(`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`, { async: "" });

    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function gtag(){ window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", GA4_ID, { anonymize_ip: true });
    }
  }

  // AdSense loader script only (no ad units injected)
  if (!isLocal) {
    loadScriptOnce(
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`,
      { async: "", crossorigin: "anonymous" }
    );
  }

  /* =========================
     SITE LINKS
     ========================= */
  const LINKS = [
    { label: "Home", href: "/" },
    { label: "Subjects", href: "/subjects/" },
    { label: "Arcade Games", href: "/arcade-review-games/" },
    { label: "Brain Arcade", href: "/brain-arcade/" },
    { label: "Icebreakers", href: "/icebreakers/" },
    { label: "Teacher Tools", href: "/tools/" },
    { label: "Escape Rooms", href: "/escape/" },
    { label: "Playbook", href: "/playbook/" },
    { label: "Merch", href: "/store/index.html" },
    { label: "Submit", href: "/submit/" },
    { label: "About", href: "/about.html" },
  ];

  const LOGO_SRC = "/assets/images/teach-arcade-logo.png";
  const BRAND_TEXT = "Teach\nArcade";

  /* =========================
     STYLES (SELF-CONTAINED)
     - Tuned sizing for iPad/mobile
     ========================= */
  const STYLE_ID = "ta-nav-inline-style";
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      :root{
        --nav-bg: rgba(2,6,23,.75);
        --nav-border: rgba(255,255,255,.10);
        --nav-text: rgba(255,255,255,.95);
        --nav-muted: rgba(255,255,255,.75);
        --nav-panel: rgba(2,6,23,.95);
        --nav-shadow: 0 20px 60px rgba(0,0,0,.45);

        /* Sizing tuned */
        --nav-h: 56px;
        --nav-pad: 10px;
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

      /* Full width on all screens */
      .ta-nav{
        width: 100%;
        height: var(--nav-h);
        margin: 0;
        padding-left: calc(var(--nav-pad) + env(safe-area-inset-left));
        padding-right: calc(var(--nav-pad) + env(safe-area-inset-right));
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        box-sizing: border-box;
      }

      /* Brand */
      .ta-brand{
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--nav-text);
        text-decoration: none;
        font-weight: 900;
        letter-spacing: .2px;
        white-space: pre-line;
        min-width: 0;
      }
      .ta-brand img{
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: block;
      }
      .ta-brand span{
        display: inline-block;
        line-height: 1;
        font-size: 14px;
      }

      /* Desktop links */
      .ta-links{
        display: flex;
        gap: 16px;
        list-style: none;
        margin: 0;
        padding: 0;
        flex: 1 1 auto;
        justify-content: center;
        min-width: 0;
      }
      .ta-links a{
        color: var(--nav-muted);
        text-decoration: none;
        font-weight: 700;
        font-size: 12px;
        padding: 8px 8px;
        border-radius: 10px;
        transition: background .15s ease, color .15s ease;
        white-space: nowrap;
      }
      .ta-links a:hover{
        background: rgba(255,255,255,.08);
        color: var(--nav-text);
      }

      /* Hamburger */
      .ta-burger{
        display: none;
        width: 42px;
        height: 42px;
        border-radius: var(--radius);
        border: 1px solid rgba(255,255,255,.15);
        background: rgba(255,255,255,.06);
        cursor: pointer;
        position: relative;
        flex: 0 0 auto;
        margin-left: auto;
      }
      .ta-burger span{
        position: absolute;
        left: 50%;
        width: 20px;
        height: 2px;
        background: #fff;
        border-radius: 2px;
        transform: translateX(-50%);
        transition: transform .18s ease, opacity .18s ease;
      }
      .ta-burger span:nth-child(1){ top: 13px; }
      .ta-burger span:nth-child(2){ top: 20px; }
      .ta-burger span:nth-child(3){ top: 27px; }

      .ta-burger[aria-expanded="true"] span:nth-child(1){
        transform: translateX(-50%) rotate(45deg);
        top: 20px;
      }
      .ta-burger[aria-expanded="true"] span:nth-child(2){
        opacity: 0;
      }
      .ta-burger[aria-expanded="true"] span:nth-child(3){
        transform: translateX(-50%) rotate(-45deg);
        top: 20px;
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
  }

  /* =========================
     PREVENT DUPLICATE HEADERS
     ========================= */
  if (document.querySelector(".ta-header")) return;

  /* =========================
     HEADER MARKUP
     - Mount into #site-header if present
     ========================= */
  const panelId = "ta-mobile-panel";
  const overlayId = "ta-mobile-overlay";

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

      <button
        class="ta-burger"
        aria-label="Menu"
        aria-expanded="false"
        aria-controls="${panelId}"
      >
        <span></span><span></span><span></span>
      </button>
    </nav>

    <div class="ta-overlay" id="${overlayId}"></div>

    <aside class="ta-panel" id="${panelId}" aria-hidden="true">
      <ul>
        ${LINKS.map(l => `<li><a href="${l.href}">${l.label}</a></li>`).join("")}
      </ul>
    </aside>
  `;

  const mount = document.getElementById("site-header");
  if (mount) {
    mount.innerHTML = "";
    mount.appendChild(header);
  } else {
    document.body.prepend(header);
  }

  /* =========================
     INTERACTION
     ========================= */
  const burger = header.querySelector(".ta-burger");
  const panel = header.querySelector(".ta-panel");
  const overlay = header.querySelector(".ta-overlay");

  const setAria = (isOpen) => {
    burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    panel.setAttribute("aria-hidden", isOpen ? "false" : "true");
  };

  const closeMenu = () => {
    setAria(false);
    panel.classList.remove("open");
    overlay.classList.remove("open");
    document.documentElement.style.overflow = "";
  };

  const openMenu = () => {
    setAria(true);
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
