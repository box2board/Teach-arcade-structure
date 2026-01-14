// /assets/nav.js
(() => {
  const LINKS = [
    { label: "Home", href: "/" },
    { label: "Subjects", href: "/subjects/" },
    { label: "Arcade Games", href: "/arcade-review-games/" },
    { label: "Brain Arcade", href: "/brain-arcade/" },
    { label: "Teacher Tools", href: "/teacher-tools/" },
    { label: "Escape Rooms", href: "/escape-rooms/" },
    { label: "Submit", href: "/submit/" },
    { label: "About", href: "/about/" },
  ];

  const LOGO_SRC = "/assets/images/teach-arcade-logo.png";
  const BRAND_TEXT = "Teach\nArcade";

  // ---- Inject minimal CSS (safe even if you already have styles) ----
  const style = document.createElement("style");
  style.textContent = `
    :root{
      --nav-bg: rgba(2,6,23,.72);
      --nav-border: rgba(255,255,255,.10);
      --nav-text: rgba(255,255,255,.92);
      --nav-muted: rgba(255,255,255,.72);
      --nav-panel: rgba(2,6,23,.92);
      --nav-shadow: 0 20px 60px rgba(0,0,0,.45);
      --nav-radius: 16px;
      --nav-h: 72px;
      --nav-pad: 18px;
    }

    /* Header shell */
    .ta-header{
      position: sticky;
      top: 0;
      z-index: 9999;
      backdrop-filter: blur(10px);
      background: var(--nav-bg);
      border-bottom: 1px solid var(--nav-border);
    }
    .ta-nav{
      height: var(--nav-h);
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 var(--nav-pad);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    /* Brand */
    .ta-brand{
      display:flex;
      align-items:center;
      gap: 12px;
      text-decoration:none;
      color: var(--nav-text);
      min-width: 200px;
    }
    .ta-brand img{
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display:block;
    }
    .ta-brand .ta-brand-text{
      font-weight: 800;
      letter-spacing: .2px;
      line-height: 1.05;
      white-space: pre-line; /* to support Teach\nArcade */
      font-size: 18px;
    }

    /* Desktop links */
    .ta-links{
      display:flex;
      align-items:center;
      gap: 18px;
      list-style:none;
      margin:0;
      padding:0;
    }
    .ta-links a{
      color: var(--nav-muted);
      text-decoration:none;
      font-weight: 700;
      font-size: 14px;
      padding: 10px 10px;
      border-radius: 10px;
      transition: background .15s ease, color .15s ease;
    }
    .ta-links a:hover{
      background: rgba(255,255,255,.08);
      color: var(--nav-text);
    }

    /* Hamburger button (ALWAYS pinned right within nav row) */
    .ta-burger{
      appearance: none;
      border: 1px solid rgba(255,255,255,.14);
      background: rgba(255,255,255,.06);
      width: 46px;
      height: 46px;
      border-radius: 14px;
      display:none; /* shown on mobile */
      align-items:center;
      justify-content:center;
      cursor:pointer;
      position: relative;
      flex: 0 0 auto;
    }
    .ta-burger:focus{
      outline: 2px solid rgba(255,255,255,.25);
      outline-offset: 2px;
    }
    .ta-burger .bar{
      position:absolute;
      width: 22px;
      height: 2px;
      background: rgba(255,255,255,.88);
      border-radius: 2px;
      transition: transform .18s ease, opacity .18s ease;
    }
    .ta-burger .bar:nth-child(1){ transform: translateY(-7px); }
    .ta-burger .bar:nth-child(2){ transform: translateY(0px); }
    .ta-burger .bar:nth-child(3){ transform: translateY(7px); }

    .ta-burger[aria-expanded="true"] .bar:nth-child(1){ transform: translateY(0) rotate(45deg); }
    .ta-burger[aria-expanded="true"] .bar:nth-child(2){ opacity: 0; }
    .ta-burger[aria-expanded="true"] .bar:nth-child(3){ transform: translateY(0) rotate(-45deg); }

    /* Mobile panel overlay */
    .ta-overlay{
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.45);
      opacity: 0;
      pointer-events: none;
      transition: opacity .18s ease;
      z-index: 9998;
    }
    .ta-overlay.is-open{
      opacity: 1;
      pointer-events: auto;
    }

    .ta-panel{
      position: fixed;
      top: 0;
      right: 0;
      height: 100vh;
      width: min(340px, 86vw);
      background: var(--nav-panel);
      border-left: 1px solid rgba(255,255,255,.10);
      box-shadow: var(--nav-shadow);
      transform: translateX(105%);
      transition: transform .22s ease;
      z-index: 9999;
      padding: 18px;
      display:flex;
      flex-direction: column;
      gap: 12px;
    }
    .ta-panel.is-open{
      transform: translateX(0);
    }

    .ta-panel-top{
      display:flex;
      align-items:center;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255,255,255,.10);
    }

    .ta-panel ul{
      list-style:none;
      margin: 6px 0 0;
      padding: 0;
      display:flex;
      flex-direction: column;
      gap: 6px;
    }
    .ta-panel a{
      display:block;
      color: rgba(255,255,255,.92);
      text-decoration:none;
      font-weight: 800;
      padding: 14px 12px;
      border-radius: 12px;
      background: rgba(255,255,255,.05);
      border: 1px solid rgba(255,255,255,.08);
    }
    .ta-panel a:hover{
      background: rgba(255,255,255,.09);
    }

    /* Responsive behavior */
    @media (max-width: 860px){
      .ta-links{ display:none; }
      .ta-burger{ display:flex; }
      .ta-brand{ min-width: 0; }
    }
  `;
  document.head.appendChild(style);

  // ---- Build header HTML ----
  const header = document.createElement("header");
  header.className = "ta-header";
  header.innerHTML = `
    <nav class="ta-nav" aria-label="Primary">
      <a class="ta-brand" href="/">
        <img src="${LOGO_SRC}" alt="Teach Arcade logo" />
        <span class="ta-brand-text">${BRAND_TEXT}</span>
      </a>

      <ul class="ta-links">
        ${LINKS.map(l => `<li><a href="${l.href}">${l.label}</a></li>`).join("")}
      </ul>

      <button class="ta-burger" type="button" aria-label="Open menu" aria-expanded="false">
        <span class="bar"></span><span class="bar"></span><span class="bar"></span>
      </button>
    </nav>

    <div class="ta-overlay" hidden></div>

    <aside class="ta-panel" aria-hidden="true">
      <div class="ta-panel-top">
        <div style="display:flex;align-items:center;gap:10px;">
          <img src="${LOGO_SRC}" alt="" style="width:34px;height:34px;border-radius:10px;display:block;" />
          <div style="color:rgba(255,255,255,.92);font-weight:900;line-height:1.05;white-space:pre-line;">${BRAND_TEXT}</div>
        </div>
        <button class="ta-burger ta-close" type="button" aria-label="Close menu" aria-expanded="true">
          <span class="bar"></span><span class="bar"></span><span class="bar"></span>
        </button>
      </div>

      <ul>
        ${LINKS.map(l => `<li><a href="${l.href}">${l.label}</a></li>`).join("")}
      </ul>
    </aside>
  `;

  // ---- Insert header at top of body ----
  document.body.insertAdjacentElement("afterbegin", header);

  // ---- Menu behavior ----
  const openBtn = header.querySelector(".ta-nav .ta-burger");
  const closeBtn = header.querySelector(".ta-close");
  const overlay = header.querySelector(".ta-overlay");
  const panel = header.querySelector(".ta-panel");

  const setOpen = (isOpen) => {
    openBtn.setAttribute("aria-expanded", String(isOpen));
    openBtn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");

    overlay.hidden = !isOpen;
    overlay.classList.toggle("is-open", isOpen);

    panel.classList.toggle("is-open", isOpen);
    panel.setAttribute("aria-hidden", String(!isOpen));

    // lock scroll when open
    document.documentElement.style.overflow = isOpen ? "hidden" : "";
  };

  openBtn.addEventListener("click", () => {
    const isOpen = openBtn.getAttribute("aria-expanded") === "true";
    setOpen(!isOpen);
  });

  closeBtn.addEventListener("click", () => setOpen(false));
  overlay.addEventListener("click", () => setOpen(false));

  // Close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  // Close after clicking a panel link
  panel.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setOpen(false)));
})();
