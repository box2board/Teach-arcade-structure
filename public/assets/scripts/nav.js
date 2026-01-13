// /assets/scripts/nav.js
(function () {
  // Inject minimal header CSS so it never looks "unstyled"
  const css = `
  .main-header{
    position: sticky; top: 0; z-index: 9999;
    background: #0f172a;
    border-bottom: 1px solid rgba(255,255,255,.10);
    color: #e5e7eb;
  }
  .main-header .inner{
    max-width: 1100px;
    margin: 0 auto;
    padding: 12px 16px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap: 16px;
  }
  .logo-link{
    display:flex;
    align-items:center;
    gap: 10px;
    color:#e5e7eb;
    text-decoration:none;
    font-family: Poppins, system-ui, sans-serif;
    font-weight: 800;
    letter-spacing: -.01em;
  }
  .site-logo{ height: 40px; width: auto; display:block; }
  .brand{ font-size: 18px; }

  /* Nav list — kill bullets no matter what */
  .main-nav ul{
    list-style: none !important;
    margin: 0 !important;
    padding: 0 !important;
    display:flex;
    align-items:center;
    gap: 18px;
  }
  .main-nav a{
    color:#e5e7eb;
    text-decoration:none;
    font-family: Poppins, system-ui, sans-serif;
    font-weight: 700;
    font-size: 14px;
    opacity: .95;
  }
  .main-nav a:hover{ opacity: 1; text-decoration: underline; }

  /* Hamburger */
  .hamburger{
    display:none;
    width: 44px; height: 40px;
    border: 1px solid rgba(255,255,255,.18);
    background: rgba(255,255,255,.06);
    border-radius: 10px;
    cursor:pointer;
    align-items:center;
    justify-content:center;
    padding: 0;
  }
  .hamburger span{
    display:block;
    width: 20px;
    height: 2px;
    background: #e5e7eb;
    margin: 3px 0;
    border-radius: 2px;
  }

  /* Mobile */
  @media (max-width: 860px){
    .hamburger{ display:flex; }
    .main-nav{ display:none; width:100%; }
    .main-header.is-open .main-nav{ display:block; }
    .main-nav ul{
      display:flex;
      flex-direction:column;
      align-items:flex-start;
      gap: 10px;
      padding: 10px 0 4px;
    }
  }
  `;

  function injectStyleOnce() {
    if (document.getElementById("ta-nav-style")) return;
    const style = document.createElement("style");
    style.id = "ta-nav-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  const headerHTML = `
    <header class="main-header" role="banner">
      <div class="inner">
        <a href="/" class="logo-link" aria-label="Teach Arcade home">
          <img src="/assets/images/teach-arcade-logo.png" alt="Teach Arcade Logo" class="site-logo" />
          <span class="brand">Teach Arcade</span>
        </a>

        <button class="hamburger" aria-controls="main-menu" aria-expanded="false" aria-label="Toggle navigation">
          <span></span><span></span><span></span>
        </button>

        <nav class="main-nav" role="navigation" aria-label="Primary">
          <ul id="main-menu">
            <li><a href="/">Home</a></li>
            <li><a href="/subjects/index.html">Subjects</a></li>
            <li><a href="/arcade-review-games/index.html">Arcade Games</a></li>
            <li><a href="/brain-arcade/">Brain Arcade</a></li>
            <li><a href="/tools/">Teacher Tools</a></li>
            <li><a href="/escape/?room=wwi">Escape Rooms</a></li>
            <li><a href="/submit/">Submit</a></li>
            <li><a href="/about.html">About</a></li>
          </ul>
        </nav>
      </div>
    </header>
  `;

  function mount() {
    injectStyleOnce();

    const mountPoint = document.getElementById("site-header");
    if (!mountPoint) return;

    mountPoint.innerHTML = headerHTML;

    const header = mountPoint.querySelector(".main-header");
    const btn = mountPoint.querySelector(".hamburger");

    if (!header || !btn) return;

    btn.addEventListener("click", () => {
      const open = header.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // Close menu when a link is clicked (mobile)
    mountPoint.querySelectorAll(".main-nav a").forEach(a => {
      a.addEventListener("click", () => {
        if (header.classList.contains("is-open")) {
          header.classList.remove("is-open");
          btn.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
