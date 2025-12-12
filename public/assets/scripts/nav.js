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

    <!-- Utility bar (hidden until monetization launch) -->
    <div class="utility-bar is-hidden" aria-hidden="true">
      <!-- Future: Login / Pricing / Premium / Tip Jar / etc -->
    </div>

    <button class="hamburger" aria-controls="main-menu" aria-expanded="false" aria-label="Toggle navigation">
      <span></span><span></span><span></span>
    </button>

    <nav class="main-nav" role="navigation" aria-label="Primary">
      <ul id="main-menu" class="nav-menu">
        <li><a href="/">Home</a></li>

        <!-- SUBJECTS -->
        <li class="dropdown">
          <a href="/#subjects" class="dropdown-toggle" aria-haspopup="true" aria-expanded="false">
            Subjects <span class="caret">▾</span>
          </a>

          <ul class="dropdown-content" role="menu">

            <!-- Social Studies -->
            <li class="dropdown-sub">
              <a href="/subjects/social-studies/index.html" class="dropdown-toggle">
                Social Studies <span class="caret">▸</span>
              </a>
              <ul class="dropdown-submenu">
                <li><a href="/subjects/social-studies/us-history/index.html">U.S. History</a></li>
                <li><a href="/subjects/social-studies/world-history/index.html">World History</a></li>
                <li><a href="/subjects/social-studies/government-political-science/index.html">Government &amp; Civics</a></li>
                <li><a href="/subjects/social-studies/geography/index.html">Geography</a></li>
                <li><a href="/subjects/social-studies/economics/index.html">Economics</a></li>
              </ul>
            </li>

            <!-- Science -->
            <li class="dropdown-sub">
              <a href="/subjects/science/index.html" class="dropdown-toggle">
                Science <span class="caret">▸</span>
              </a>
              <ul class="dropdown-submenu">
                <li><a href="/subjects/science/life-science/index.html">Life Science</a></li>
                <li><a href="/subjects/science/physical-science/index.html">Physical Science</a></li>
                <li><a href="/subjects/science/biology/index.html">Biology</a></li>
                <li><a href="/subjects/science/chemistry/index.html">Chemistry</a></li>
                <li><a href="/subjects/science/physics/index.html">Physics</a></li>
                <li><a href="/subjects/science/earth-space-science/index.html">Earth &amp; Space Science</a></li>
                <li><a href="/subjects/science/environmental-science/index.html">Environmental Science</a></li>
                <li><a href="/subjects/science/astronomy/index.html">Astronomy</a></li>
                <li><a href="/subjects/science/stem-engineering/index.html">STEM &amp; Engineering</a></li>
              </ul>
            </li>

            <!-- Math -->
            <li class="dropdown-sub">
              <a href="/subjects/math/index.html" class="dropdown-toggle">
                Math <span class="caret">▸</span>
              </a>
              <ul class="dropdown-submenu">
                <li><a href="/subjects/math/k-5-math/index.html">K–5 Math</a></li>
                <li><a href="/subjects/math/middle-school-math/index.html">Middle School Math</a></li>
                <li><a href="/subjects/math/high-school-math/index.html">High School Math</a></li>
                <li><a href="/subjects/math/math-games-puzzles/index.html">Math Games &amp; Puzzles</a></li>
              </ul>
            </li>

            <!-- ELA -->
            <li class="dropdown-sub">
              <a href="/subjects/ela/index.html" class="dropdown-toggle">
                English / Language Arts <span class="caret">▸</span>
              </a>
              <ul class="dropdown-submenu">
                <li><a href="/subjects/ela/reading-literature/index.html">Reading Literature</a></li>
                <li><a href="/subjects/ela/reading-informational-text/index.html">Reading Informational Text</a></li>
                <li><a href="/subjects/ela/grammar-language/index.html">Grammar &amp; Language</a></li>
                <li><a href="/subjects/ela/vocabulary-word-study/index.html">Vocabulary &amp; Word Study</a></li>
                <li><a href="/subjects/ela/writing/index.html">Writing</a></li>
                <li><a href="/subjects/ela/poetry/index.html">Poetry</a></li>
                <li><a href="/subjects/ela/speaking-listening/index.html">Speaking &amp; Listening</a></li>
                <li><a href="/subjects/ela/research-media-literacy/index.html">Research &amp; Media Literacy</a></li>
                <li><a href="/subjects/ela/ela-test-prep/index.html">ELA Test Prep</a></li>
              </ul>
            </li>

            <!-- Fine Arts -->
            <li class="dropdown-sub">
              <a href="/subjects/fine-arts/index.html" class="dropdown-toggle">
                Fine Arts <span class="caret">▸</span>
              </a>
              <ul class="dropdown-submenu">
                <li><a href="/subjects/fine-arts/visual-arts/index.html">Visual Arts</a></li>
                <li><a href="/subjects/fine-arts/music/index.html">Music</a></li>
                <li><a href="/subjects/fine-arts/drama-theatre/index.html">Drama &amp; Theatre</a></li>
                <li><a href="/subjects/fine-arts/dance/index.html">Dance</a></li>
                <li><a href="/subjects/fine-arts/media-arts/index.html">Media Arts / Digital Arts</a></li>
                <li><a href="/subjects/fine-arts/art-history/index.html">Art History</a></li>
              </ul>
            </li>

          </ul>
        </li>

        <!-- GAMES -->
        <li class="dropdown">
          <a href="/#games" class="dropdown-toggle">
            Games <span class="caret">▾</span>
          </a>
          <ul class="dropdown-content">
            <li><a href="/games/arcade-games/index.html">Arcade Games</a></li>
            <li><a href="/games/escape-rooms/index.html">Escape Rooms</a></li>
            <li><a href="/games/choose-your-path/index.html">Choose Your Path</a></li>
          </ul>
        </li>

        <li><a href="/tools/">Teacher Tools</a></li>
        <li><a href="/submit.html">Submit</a></li>
        <li><a href="/about.html">About</a></li>
      </ul>
    </nav>
  </header>
  `;

  const style = `
  <style>
    header.main-header {
      display:flex;
      justify-content:space-between;
      align-items:center;
      padding:10px 20px;
      background:#0f172a;
      border-bottom:1px solid #0b1226;
      position:sticky;
      top:0;
      z-index:1000;
      color:#fff;

      /* ✅ FIX: lock height to prior header */
      height:60px;
      box-sizing:border-box;
    }

    .header-left { display:flex; align-items:center; gap:10px; }
    .logo-link { display:flex; align-items:center; gap:10px; text-decoration:none; color:#fff; }
    .site-logo { height:40px; width:auto; border-radius:4px; }
    .brand { font-family:'Poppins',sans-serif; font-weight:700; font-size:18px; }

    .utility-bar.is-hidden { display:none !important; }

    .main-nav .nav-menu {
      list-style:none;
      display:flex;
      gap:20px;
      align-items:center;
      margin:0;
      padding:0;
    }

    .main-nav a {
      text-decoration:none;
      color:#e5e7eb;
      font-weight:600;
      font-family:'Nunito',sans-serif;
      display:inline-flex;
      align-items:center;
      gap:6px;
    }

    .main-nav a:hover { color:#93c5fd; }

    .dropdown, .dropdown-sub { position:relative; }

    .dropdown-content, .dropdown-submenu {
      display:none;
      position:absolute;
      background:#0f172a;
      border:1px solid #1f2937;
      border-radius:10px;
      list-style:none;
      padding:10px 0;
      margin:0;
      min-width:240px;
      box-shadow:0 12px 28px rgba(0,0,0,.35);
    }

    @media (min-width: 881px) {
      .dropdown:hover > .dropdown-content { display:block; top:100%; left:0; }
      .dropdown-sub:hover > .dropdown-submenu { display:block; top:0; left:100%; }
    }

    .hamburger {
      display:none;
      background:transparent;
      border:0;
      width:40px;
      height:40px;
      padding:6px;
      cursor:pointer;
    }

    .hamburger span {
      display:block;
      height:2px;
      margin:6px 0;
      background:#e5e7eb;
    }

    @media (max-width: 880px) {
      .hamburger { display:block; }

      .main-nav {
        position:absolute;
        left:0;
        right:0;
        top:60px;
        background:#0b1226;
        border-top:1px solid #1f2937;
        display:none;
      }

      .main-nav.open { display:block; }

      .main-nav .nav-menu {
        flex-direction:column;
        align-items:stretch;
        padding:12px;
        gap:10px;
      }

      .dropdown.open > .dropdown-content,
      .dropdown-sub.open > .dropdown-submenu {
        display:block;
        position:static;
      }
    }
  </style>
  `;

  function mountHeader() {
    let mount = document.getElementById('site-header');
    if (!mount) {
      mount = document.createElement('div');
      mount.id = 'site-header';
      document.body.insertBefore(mount, document.body.firstChild);
    }
    mount.innerHTML = style + headerHTML;

    const burger = mount.querySelector('.hamburger');
    const nav = mount.querySelector('.main-nav');

    if (burger && nav) {
      burger.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        burger.classList.toggle('is-open', open);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountHeader);
  } else {
    mountHeader();
  }
})();
