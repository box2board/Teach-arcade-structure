// /assets/scripts/nav.js
document.addEventListener("DOMContentLoaded", () => {
  const headerHTML = `
  <header class="main-header">
    <div class="header-left">
      <a href="/" class="logo-link">
        <img src="/assets/images/teach-arcade-logo.png" alt="Teach Arcade Logo" class="site-logo">
      </a>
      <span class="brand">Teach Arcade</span>
    </div>

    <nav class="main-nav">
      <ul class="nav-menu">
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
        <li><a href="/submit.html">Submit</a></li>
        <li><a href="/about.html">About</a></li>
      </ul>
    </nav>
  </header>
  `;

  const style = `
    <style>
      header.main-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 10px 20px; background: #ffffff; border-bottom: 1px solid #e5e7eb;
        position: sticky; top: 0; z-index: 1000;
      }
      .header-left { display: flex; align-items: center; gap: 10px; }
      .site-logo { height: 40px; width: auto; }
      .brand { font-family: 'Poppins', sans-serif; font-weight: 700; color: #111827; }

      .main-nav .nav-menu {
        list-style: none; display: flex; gap: 20px; align-items: center; margin: 0; padding: 0;
      }
      .main-nav a { text-decoration: none; color: #1f2937; font-weight: 600; font-family: 'Nunito', sans-serif; }
      .main-nav a:hover { color: #2563eb; }

      /* Dropdown menus */
      .dropdown { position: relative; }
      .dropdown-content, .dropdown-submenu {
        display: none; position: absolute; background: #fff; border: 1px solid #e5e7eb;
        border-radius: 8px; list-style: none; padding: 8px 0; margin: 0; min-width: 200px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
      }
      .dropdown:hover > .dropdown-content { display: block; top: 100%; left: 0; }
      .dropdown-sub:hover > .dropdown-submenu { display: block; top: 0; left: 100%; }

      .dropdown-content li, .dropdown-submenu li {
        padding: 6px 12px;
      }
      .dropdown-content li a, .dropdown-submenu li a {
        display: block; width: 100%;
      }

      /* Mobile styles */
      @media (max-width: 768px) {
        header.main-header { flex-wrap: wrap; }
        .main-nav .nav-menu { flex-direction: column; gap: 10px; }
        .dropdown-content, .dropdown-submenu { position: static; box-shadow: none; border: none; }
      }
    </style>
  `;

  document.getElementById("site-header").innerHTML = style + headerHTML;
});
