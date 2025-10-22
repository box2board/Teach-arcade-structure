// /assets/scripts/nav.js
document.addEventListener("DOMContentLoaded", () => {
  const mount = document.getElementById("site-header");
  if (!mount) return; // Safety: page forgot the mount point

  // ---------- Markup ----------
  const headerHTML = `
  <header class="main-header" role="banner">
    <div class="header-inner">
      <div class="header-left">
        <a href="/" class="logo-link">
          <img src="/assets/images/teach-arcade-logo.png" alt="Teach Arcade Logo" class="site-logo">
        </a>
        <span class="brand">Teach Arcade</span>
      </div>

      <!-- Hamburger (mobile) -->
      <button class="hamburger"
              aria-label="Toggle navigation"
              aria-controls="primary-nav"
              aria-expanded="false">
        <span class="hamburger-box" aria-hidden="true">
          <span class="hamburger-inner"></span>
        </span>
      </button>

      <nav id="primary-nav" class="main-nav" role="navigation" aria-label="Primary">
        <ul class="nav-menu" role="menubar">
          <li role="none"><a role="menuitem" href="/">Home</a></li>

          <li class="dropdown" role="none">
            <a role="menuitem"
               href="/subjects/index.html"
               aria-haspopup="true"
               aria-expanded="false">Subjects ▾</a>

            <ul class="dropdown-content" role="menu" aria-label="Subjects">
              <li class="dropdown-sub" role="none">
                <a role="menuitem"
                   href="/subjects/social-studies/index.html"
                   aria-haspopup="true"
                   aria-expanded="false">Social Studies ▸</a>

                <ul class="dropdown-submenu" role="menu" aria-label="Social Studies">
                  <li role="none"><a role="menuitem" href="/subjects/social-studies/us-history/index.html">U.S. History</a></li>
                  <li role="none"><a role="menuitem" href="/subjects/social-studies/world-history/index.html">World History</a></li>
                  <li role="none"><a role="menuitem" href="/subjects/social-studies/government/index.html">Government &amp; Civics</a></li>
                  <li role="none"><a role="menuitem" href="/subjects/social-studies/geography/index.html">Geography</a></li>
                  <li role="none"><a role="menuitem" href="/subjects/social-studies/economics/index.html">Economics</a></li>
                </ul>
              </li>

              <li role="none"><a role="menuitem" href="/subjects/science/index.html">Science</a></li>
              <li role="none"><a role="menuitem" href="/subjects/math/index.html">Math</a></li>
              <li role="none"><a role="menuitem" href="/subjects/english-language-arts/index.html">English / Language Arts</a></li>
              <li role="none"><a role="menuitem" href="/subjects/fine-arts/index.html">Fine Arts</a></li>
            </ul>
          </li>

          <li role="none"><a role="menuitem" href="/submit.html">Submit</a></li>
          <li role="none"><a role="menuitem" href="/about.html">About</a></li>
        </ul>
      </nav>
    </div>
  </header>
  `;

  // ---------- Styles (includes slide-down mobile menu + improved contrast) ----------
  const style = `
  <style>
    :root {
      --nav-bg: #0f1c2e;         /* dark header */
      --nav-text: #f8fafc;       /* near-white text */
      --nav-text-dim: #cbd5e1;   /* muted */
      --nav-accent: #60a5fa;     /* link hover/active */
      --divider: #233149;
    }

    .main-header {
      position: sticky; top: 0; z-index: 1000;
      background: var(--nav-bg); color: var(--nav-text);
      border-bottom: 1px solid var(--divider);
    }
    .header-inner {
      max-width: 1100px; margin: 0 auto; padding: 12px 20px;
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
    }
    .header-left { display: flex; align-items: center; gap: 10px; }
    .site-logo { height: 40px; width: auto; }
    .brand { font-family: 'Poppins',sans-serif; font-weight: 700; color: var(--nav-text); }

    .main-nav a {
      color: var(--nav-text); text-decoration: none; font-weight: 600;
      font-family: 'Nunito',sans-serif;
    }
    .main-nav a:hover, .main-nav a:focus { color: var(--nav-accent); }

    .nav-menu { list-style: none; display: flex; gap: 20px; margin: 0; padding: 0; align-items: center; }

    /* Active link highlight */
    .main-nav a.active { color: var(--nav-accent); text-decoration: underline; text-underline-offset: 3px; }

    /* Dropdowns (desktop) */
    .dropdown { position: relative; }
    .dropdown-content, .dropdown-submenu {
      display: none; position: absolute; background: #0f1c2e; border: 1px solid var(--divider);
      border-radius: 8px; list-style: none; padding: 8px 0; margin: 0; min-width: 220px;
      box-shadow: 0 6px 16px rgba(0,0,0,.25);
    }
    .dropdown:hover > .dropdown-content { display: block; top: 100%; left: 0; }
    .dropdown-sub:hover > .dropdown-submenu { display: block; top: 0; left: 100%; }
    .dropdown-content a, .dropdown-submenu a { display: block; padding: 8px 12px; color: var(--nav-text); }
    .dropdown-content a:hover, .dropdown-submenu a:hover { background: #12243a; }

    /* Hamburger button */
    .hamburger {
      display: none; border: 1px solid var(--divider); background: transparent;
      padding: 8px 10px; border-radius: 8px; cursor: pointer; color: var(--nav-text);
    }
    .hamburger-box { display: inline-block; position: relative; width: 24px; height: 16px; }
    .hamburger-inner, .hamburger-inner::before, .hamburger-inner::after {
      position: absolute; width: 24px; height: 2px; background: var(--nav-text);
      left: 0; transition: transform .2s ease, opacity .2s ease;
      content: "";
    }
    .hamburger-inner { top: 50%; transform: translateY(-50%); }
    .hamburger-inner::before { top: -8px; }
    .hamburger-inner::after  { top: 8px; }

    /* Mobile layout */
    @media (max-width: 768px) {
      .hamburger { display: inline-flex; align-items: center; gap: 8px; }
      .nav-menu { flex-direction: column; align-items: flex-start; gap: 12px; padding: 12px 0; }

      /* Slide-down container */
      .main-nav {
        overflow: hidden;
        max-height: 0;
        transition: max-height .28s ease;
        width: 100%;
        border-top: 1px solid var(--divider);
      }
      .main-header.nav-open .main-nav {
        max-height: 70vh; /* slide down */
      }

      /* Show dropdown lists inline on mobile */
      .dropdown-content, .dropdown-submenu {
        position: static; display: block; box-shadow: none; border: none; padding: 0;
      }
      .dropdown > a::after { content: ""; } /* remove ▾ on mobile to reduce clutter */
    }

    /* Hamburger animated to "X" when open */
    .main-header.nav-open .hamburger-inner { transform: translateY(-50%) rotate(45deg); }
    .main-header.nav-open .hamburger-inner::before { transform: rotate(90deg) translateX(-8px); top: 0; }
    .main-header.nav-open .hamburger-inner::after { opacity: 0; }
  </style>
  `;

  mount.innerHTML = style + headerHTML;

  // ---------- Behavior ----------
  const headerEl = mount.querySelector('.main-header');
  const hamburger = mount.querySelector('.hamburger');
  const primaryNav = mount.querySelector('#primary-nav');

  // Toggle slide-down on mobile
  function setMenu(open) {
    const isOpen = open != null ? open : !headerEl.classList.contains('nav-open');
    headerEl.classList.toggle('nav-open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  }
  if (hamburger) {
    hamburger.addEventListener('click', () => setMenu());
    document.addEventListener('click', (e) => {
      // close if clicking outside when open (mobile)
      if (headerEl.classList.contains('nav-open') && !headerEl.contains(e.target)) setMenu(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  // Desktop dropdown keyboard support
  const subjectsToggle = mount.querySelector('.dropdown > a[aria-haspopup="true"]');
  const subjectsMenu   = mount.querySelector('.dropdown .dropdown-content');

  function toggleMenuLink(linkEl, menuEl, open) {
    const isOpen = open != null ? open : linkEl.getAttribute('aria-expanded') !== 'true';
    linkEl.setAttribute('aria-expanded', String(isOpen));
    // On desktop, help keyboard users by forcing display
    if (window.matchMedia('(min-width: 769px)').matches) {
      menuEl.style.display = isOpen ? 'block' : 'none';
    }
  }

  if (subjectsToggle && subjectsMenu) {
    subjectsToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenuLink(subjectsToggle, subjectsMenu, true); }
      if (e.key === 'Escape') { toggleMenuLink(subjectsToggle, subjectsMenu, false); subjectsToggle.focus(); }
    });
    // Click to open on desktop keyboard users
    subjectsToggle.addEventListener('click', (e) => {
      if (window.matchMedia('(min-width: 769px)').matches) {
        e.preventDefault(); toggleMenuLink(subjectsToggle, subjectsMenu);
      }
    });
  }

  // Keyboard open for Social Studies submenu
  const subToggle = mount.querySelector('.dropdown-sub > a[aria-haspopup="true"]');
  const subMenu   = mount.querySelector('.dropdown-sub .dropdown-submenu');
  if (subToggle && subMenu) {
    subToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); subToggle.click(); }
      if (e.key === 'Escape') { subToggle.setAttribute('aria-expanded','false'); subMenu.style.display='none'; subToggle.focus(); }
    });
    subToggle.addEventListener('click', (e) => {
      if (window.matchMedia('(min-width: 769px)').matches) {
        e.preventDefault();
        const open = subToggle.getAttribute('aria-expanded') !== 'true';
        subToggle.setAttribute('aria-expanded', String(open));
        subMenu.style.display = open ? 'block' : 'none';
      }
    });
  }

  // Highlight current page link
  const here = location.pathname.replace(/\/index\.html$/, '/');
  mount.querySelectorAll('.main-nav a[href]').forEach(a => {
    try {
      const abs = new URL(a.getAttribute('href'), location.origin).pathname.replace(/\/index\.html$/, '/');
      if (abs === here) a.classList.add('active');
    } catch {}
  });

  // Close slide-down when resizing to desktop to avoid a stuck state
  let lastIsMobile = window.matchMedia('(max-width: 768px)').matches;
  window.addEventListener('resize', () => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile && lastIsMobile) setMenu(false);
    lastIsMobile = isMobile;
  });
});
