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

    <button class="hamburger"
      aria-controls="main-menu"
      aria-expanded="false"
      aria-label="Toggle navigation">
      <span></span><span></span><span></span>
    </button>

    <nav class="main-nav" role="navigation" aria-label="Primary">
      <ul id="main-menu" class="nav-list">
        <li><a href="/">Home</a></li>
        <li><a href="/subjects/index.html">Subjects</a></li>
        <li><a href="/arcade-review-games/index.html">Arcade Games</a></li>
        <li><a href="/brain-arcade/">Brain Arcade</a></li>
        <li><a href="/tools/">Teacher Tools</a></li>
        <li><a href="/escape/?room=wwi">Escape Rooms</a></li>

        <!-- ✅ FIXED SUBMIT LINK -->
        <li><a href="/submit/">Submit</a></li>

        <li><a href="/about.html">About</a></li>
      </ul>
    </nav>
  </header>
  `;

  const mount = document.getElementById("site-header");
  if (!mount) return;
  mount.innerHTML = headerHTML;

  // Mobile menu toggle
  const btn = mount.querySelector(".hamburger");
  const menu = mount.querySelector("#main-menu");

  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!expanded));
    menu.classList.toggle("open");
  });
})();
