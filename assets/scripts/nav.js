// /assets/scripts/nav.js
(function () {
  const headerHTML = `
  <header class="main-header" role="banner">
    <div class="header-left">
      <a href="/" class="logo-link" aria-label="Teach Arcade home">
        <img src="/assets/images/teach-arcade-logo.png" alt="Teach Arcade Logo" class="site-logo" />
        <span class="brand">Teach Arcade</span>
      </a>
    </div>

    <button class="hamburger" aria-controls="main-menu" aria-expanded="false" aria-label="Toggle navigation">
      <span></span><span></span><span></span>
    </button>

    <nav class="main-nav" role="navigation" aria-label="Primary">
      <ul id="main-menu" class="nav-menu">
        <li><a href="/">Home</a></li>
        <li class="dropdown">
          <a href="/subjects/index.html">Subjects ▾</a>
          <ul class="dropdown-content">
            <li class="dropdown-sub">
              <a href="/subjects/social-studies/index.html">Social Studies ▸</a>
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
        <li><a href="/teacher-tools.html">Teacher Tools</a></li>
        <li><a href="/submit.html">Submit</a></li>
        <li><a href="/about.html">About</a></li>
      </ul>
    </nav>
  </header>
  `;

  const style = `
  <style>
    header.main-header {
      display:flex; justify-content:space-between; align-items:center;
      padding:10px 20px; background:#0f172a; border-bottom:1px solid #0b1226;
      position:sticky; top:0; z-index:1000; color:#fff;
    }
    .header-left { display:flex; align-items:center; gap:10px; }
    .logo-link { display:flex; align-items:center; gap:10px; text-decoration:none; color:#fff; }
    .site-logo { height:40px; width:auto; }
    .brand { font-family:'Poppins',sans-serif; font-weight:700; font-size:18px; letter-spacing:.2px; }

    .main-nav .nav-menu { list-style:none; display:flex; gap:20px; align-items:center; margin:0; padding:0; }
    .main-nav a { text-decoration:none; color:#e5e7eb; font-weight:600; font-family:'Nunito',sans-serif; }
    .main-nav a:hover { color:#93c5fd; }

    .dropdown { position:relative; }
    .dropdown-content, .dropdown-submenu {
      display:none; position:absolute; background:#0f172a; border:1px solid #1f2937;
      border-radius:8px; list-style:none; padding:8px 0; margin:0; min-width:220px;
      box-shadow:0 8px 20px rgba(0,0,0,.25);
    }
    .dropdown:hover > .dropdown-content { display:block; top:100%; left:0; }
    .dropdown-sub:hover > .dropdown-submenu { display:block; top:0; left:100%; }
    .dropdown-content li, .dropdown-submenu li { padding:6px 12px; }

    /* Hamburger */
    .hamburger {
      display:none; background:transparent; border:0; width:40px; height:40px; padding:6px; margin-left:auto; cursor:pointer;
    }
    .hamburger span { display:block; height:2px; margin:6px 0; background:#e5e7eb; transition:transform .2s, opacity .2s; }
    .hamburger.is-open span:nth-child(1){ transform:translateY(8px) rotate(45deg); }
    .hamburger.is-open span:nth-child(2){ opacity:0; }
    .hamburger.is-open span:nth-child(3){ transform:translateY(-8px) rotate(-45deg); }

    @media (max-width: 880px) {
      .hamburger { display:block; }
      .main-nav { position:absolute; left:0; right:0; top:60px; background:#0b1226; border-top:1px solid #1f2937; display:none; }
      .main-nav.open { display:block; animation:slideDown .18s ease-out; }
      .main-nav .nav-menu { flex-direction:column; align-items:stretch; padding:10px; gap:8px; }
      .dropdown-content, .dropdown-submenu { position:static; border:none; box-shadow:none; }
    }
    @keyframes slideDown{ from { opacity:0; transform:translateY(-6px);} to{opacity:1; transform:translateY(0);} }
  </style>
  `;

  function mountHeader() {
    // ensure mount exists at top of body
    let mount = document.getElementById('site-header');
    if (!mount) {
      mount = document.createElement('div');
      mount.id = 'site-header';
      document.body.insertBefore(mount, document.body.firstChild);
    }
    mount.innerHTML = style + headerHTML;

    // mobile toggle
    const burger = mount.querySelector('.hamburger');
    const nav = mount.querySelector('.main-nav');
    if (burger && nav) {
      burger.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        burger.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    // highlight active link
    const here = location.pathname.replace(/\/index\.html?$/,'/') || '/';
    mount.querySelectorAll('.main-nav a').forEach(a => {
      const href = a.getAttribute('href').replace(/\/index\.html?$/,'/') || '/';
      if (href === here) a.style.color = '#ffffff';
    });
  }

  // run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountHeader);
  } else {
    mountHeader();
  }
})();
