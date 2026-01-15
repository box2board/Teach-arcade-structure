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

  const GA4_ID = "G-13098279648";
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
    loadScriptOnce(
      `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`,
      { async: "" }
    );

    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
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
    { label: "Teacher Tools", href: "/tools/" },
    { label: "Escape Rooms", href: "/escape/" },
    { label: "Playbook", href: "/playbook/" },
    { label: "Submit", href: "/submit/" },
    { label: "About", href: "/about.html" },
  ];

  const LOGO_SRC = "/assets/images/teach-arcade-logo.png";
  const BRAND_TEXT = "Teach\nArcade";

  /* =========================
     STYLES (FULL WIDTH HEADER)
     ========================= */
  if (!document.getElementById("ta-nav-style")) {
    const style = document.createElement("style");
    style.id = "ta-nav-style";
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
        width: 100%;
        height: var(--nav-h);
        padding: 0 var(--nav-pad);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        box-sizing: border-box;
      }

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
      }

      .ta-links{
        display: flex;
        gap: 18px;
        list-style: none;
        margin: 0;
        padding: 0;
        justify-content: center;
        flex: 1;
      }

      .ta-links a{
        color: var(--nav-muted);
        text-decoration: none;
        font-weight: 700;
        font-size: 14px;
        padding: 10px 12px;
        border-radius: 10px;
        transition: background .15s ease, color .15s ease;
        white-space: nowrap;
      }

      .ta-links a:hover{
        background: rgba(255,255,255,.08);
        color: var(--nav-text);
      }

      .ta-burger{
        display: none;
        width: 46px;
        height: 46px;
        border-radius: var(--radius);
        border: 1px solid rgba(255,255,255,.15);
        background: rgba(255,255,255,.06);
        cursor: pointer;
        position: relative;
        margin-left: auto;
      }

      .ta-burger span{
        position: absolute;
        left: 50%;
        width: 22px;
        height: 2px;
        background: #fff;
        transform: translateX(-50%);
      }

      .ta-burger span:nth-child(1){ top: 14px; }
      .ta-burger span:nth-child(2){ top: 22px; }
      .ta-burger span:nth-child(3){ top: 30px; }

      .ta-overlay{
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,.45);
        opacity: 0;
        pointer-events: none;
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
        transform: translateX(105%);
        transition: transform .25s ease;
        padding: 20px;
      }

      .ta-panel.open{
        transform: translateX(0);
      }

      .ta-panel ul{
        list-style: none;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .ta-panel a{
        padding: 14px;
        border-radius: 12px;
        color: #fff;
        text-decoration: none;
        font-weight: 800;
        background: rgba(255,255,255,.06);
      }

      @media (max-width: 860px){
        .ta-links{ display: none; }
        .ta-burger{ display: block; }
      }
    `;
    document.head.appendChild(style);
  }

  /* =========================
     PREVENT DUPLICATE HEADER
     ========================= */
  if (document.querySelector(".ta-header")) return;

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

      <button class="ta-burger" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </nav>

    <div class="ta-overlay"></div>
    <aside class="ta-panel">
      <ul>
        ${LINKS.map(l => `<li><a href="${l.href}">${l.label}</a></li>`).join("")}
      </ul>
    </aside>
  `;

  const mount = document.getElementById("site-header");
  mount ? mount.appendChild(header) : document.body.prepend(header);

  /* =========================
     INTERACTION
     ========================= */
  const burger = header.querySelector(".ta-burger");
  const panel = header.querySelector(".ta-panel");
  const overlay = header.querySelector(".ta-overlay");

  burger.addEventListener("click", () => {
    panel.classList.toggle("open");
    overlay.classList.toggle("open");
  });

  overlay.addEventListener("click", () => {
    panel.classList.remove("open");
    overlay.classList.remove("open");
  });
})();
