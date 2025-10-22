<!-- /assets/scripts/nav.js -->
<script>
document.addEventListener("DOMContentLoaded", () => {
  const host = document.getElementById("site-header");
  if (!host) return; // safety: do nothing if the mount point isn’t present

  host.innerHTML = `
  <style>
    :root{
      --nav-bg:#0f1f33;        /* deep navy */
      --nav-text:#eaf2ff;      /* light text */
      --nav-accent:#4f8cff;    /* link hover / focus */
    }

    header.main-header{
      position:sticky; top:0; z-index:1000;
      display:flex; align-items:center; gap:12px;
      padding:12px 16px; background:var(--nav-bg);
      border-bottom:1px solid rgba(255,255,255,.08);
    }

    .header-left{ display:flex; align-items:center; gap:10px; flex:1 1 auto; min-width:0; }
    .site-logo{ height:32px; width:auto; border-radius:6px; }
    .brand{
      font-family:Poppins,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
      font-weight:700; letter-spacing:.2px; color:var(--nav-text);
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
      font-size:20px;
    }

    /* Hamburger (SVG lines) */
    .menu-toggle{
      margin-left:auto; flex:0 0 auto;
      display:inline-flex; align-items:center; justify-content:center;
      width:40px; height:40px; border-radius:10px;
      background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12);
      cursor:pointer;
    }
    .menu-toggle svg{ width:22px; height:22px; stroke:var(--nav-text); stroke-width:2; }
    .menu-toggle .icon-x{ display:none; }
    .menu-toggle[aria-expanded="true"] .icon-burger{ display:none; }
    .menu-toggle[aria-expanded="true"] .icon-x{ display:block; }

    /* Desktop nav */
    nav.main-nav{ margin-left:8px; }
    .nav-menu{ list-style:none; display:flex; gap:20px; margin:0; padding:0; }
    .nav-menu > li > a{
      color:var(--nav-text); text-decoration:none; font:600 14px/1.2 Nunito,sans-serif;
      opacity:.95;
    }
    .nav-menu > li > a:hover, .nav-menu > li > a:focus{ color:var(--nav-accent); }

    /* Dropdowns (desktop) */
    .dropdown{ position:relative; }
    .dropdown-content, .dropdown-submenu{
      display:none; position:absolute; left:0; top:100%;
      background:#fff; color:#111; min-width:220px; border-radius:10px;
      border:1px solid #e5e7eb; padding:8px 0;
      box-shadow:0 10px 30px rgba(0,0,0,.08);
    }
    .dropdown:hover > .dropdown-content{ display:block; }
    .dropdown-sub{ position:relative; }
    .dropdown-sub:hover > .dropdown-submenu{ display:block; left:100%; top:0; }
    .dropdown-content a, .dropdown-submenu a{
      display:block; padding:8px 14px; color:#111; text-decoration:none; font-weight:600;
    }
    .dropdown-content a:hover, .dropdown-submenu a:hover{ background:#f3f4f6; }

    /* MOBILE */
    @media (max-width: 820px){
      /* brand stretches; hamburger on far right */
      .brand{ font-size:22px; }
      /* hide desktop menu, use slide-in panel */
      nav.main-nav{ position:fixed; inset:0 0 0 auto; width:min(84vw,360px); 
                    transform:translateX(100%); transition:transform .25s ease;
                    background:var(--nav-bg); border-left:1px solid rgba(255,255,255,.08);
                    padding:14px 18px; overflow:auto; }
      .nav-open nav.main-nav{ transform:translateX(0); }
      .nav-menu{ flex-direction:column; gap:12px; }
      .dropdown-content, .dropdown-submenu{ position:static; display:block; background:transparent; color:var(--nav-text); border:none; box-shadow:none; padding:0; }
      .dropdown > a::after{ content:" ▾"; }
      .dropdown-content a, .dropdown-submenu a{ color:var(--nav-text); padding:8px 4px; }
      /* backdrop */
      .nav-backdrop{
        position:fixed; inset:0; background:rgba(0,0,0,.35); opacity:0; pointer-events:none; transition:opacity .25s ease;
      }
      .nav-open .nav-backdrop{ opacity:1; pointer-events:auto; }
    }

    /* Active link highlighting */
    .nav-menu a.active{ color:var(--nav-accent); text-decoration:underline; text-underline-offset:3px; }
  </style>

  <header class="main-header" role="banner">
    <div class="header-left">
      <a href="/" class="logo-link" aria-label="Teach Arcade home">
        <img src="/assets/images/teach-arcade-logo.png" alt="" class="site-logo" />
      </a>
      <span class="brand">Teach Arcade</span>
    </div>

    <button class="menu-toggle" aria-label="Open menu" aria-controls="site-primary-nav" aria-expanded="false">
      <!-- Hamburger -->
      <svg class="icon-burger" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round"/></svg>
      <!-- X -->
      <svg class="icon-x" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
    </button>

    <nav id="site-primary-nav" class="main-nav" role="navigation" aria-label="Primary">
      <ul class="nav-menu">
        <li><a href="/">Home</a></li>

        <li class="dropdown">
          <a href="/subjects/index.html">Subjects</a>
          <ul class="dropdown-content">
            <li class="dropdown-sub">
              <a href="/subjects/social-studies/index.html">Social Studies</a>
              <ul class="dropdown-submenu">
                <li><a href="/subjects/social-studies/us-history/index.html">U.S. History</a></li>
                <li><a href="/subjects/social-studies/world-history/index.html">World History</a></li>
                <li><a href="/subjects/social-studies/government/index.html">Government & Civics</a></li>
                <li><a href="/subjects/social-studies/geography/index.html">Geography</a></li>
                <li><a href="/subjects/social-studies/economics/index.html">Economics</a></li>
              </ul>
            </li>
            <li><a href="/subjects/science/index.html">Science</a></li>
            <li><a href="/subjects/math/index.html">Math</a></li>
            <li><a href="/subjects/english-language-arts/index.html">English / Language Arts</a></li>
            <li><a href="/subjects/fine-arts/index.html">Fine Arts</a></li>
          </ul>
        </li>

        <li><a href="/submit.html">Submit</a></li>
        <li><a href="/about.html">About</a></li>
      </ul>
    </nav>
    <div class="nav-backdrop" hidden></div>
  </header>
  `;

  // --- Behavior ---
  const toggle = host.querySelector(".menu-toggle");
  const nav    = host.querySelector(".main-nav");
  const back   = host.querySelector(".nav-backdrop");

  // open/close helpers
  const setOpen = (open) => {
    document.documentElement.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    back.hidden = !open;
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  // open/close on click
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  back.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  // keyboard access inside menu
  nav.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      const a = e.target.closest("a");
      if (a && a.nextElementSibling && a.nextElementSibling.tagName === "UL") {
        e.preventDefault();
        // simple toggle for nested lists on mobile if you want collapse/expand
      }
    }
  });

  // Active link highlighting
  const here = location.pathname.replace(/\/index\.html$/,'/');
  host.querySelectorAll('.nav-menu a').forEach(a=>{
    const href = a.getAttribute('href').replace(/\/index\.html$/,'/');
    if (href !== '/' && here.startsWith(href)) a.classList.add('active');
    if (here === '/' && href === '/') a.classList.add('active');
  });
});
</script>
