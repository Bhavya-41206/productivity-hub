document.addEventListener('DOMContentLoaded', () => {

    /* -----------------------------------------------------
       Greet the signed-in user
       (index.html redirects here as dashboard.html?user=NAME)
    ----------------------------------------------------- */
    const params = new URLSearchParams(window.location.search);
    const user = params.get('user');
    const usernameEl = document.getElementById('username');
  
    if (user && usernameEl) {
      const clean = user.trim();
      const formatted = clean.charAt(0).toUpperCase() + clean.slice(1);
      usernameEl.textContent = formatted;
    }
  
    /* -----------------------------------------------------
       Sidebar expand / collapse (hamburger toggle)
    ----------------------------------------------------- */
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const backdrop = document.getElementById('backdrop');
  
    function setSidebar(open) {
      sidebar.classList.toggle('expanded', open);
      sidebarToggle.setAttribute('aria-expanded', String(open));
      backdrop.classList.toggle('show', open);
    }
  
    sidebarToggle.addEventListener('click', () => {
      setSidebar(!sidebar.classList.contains('expanded'));
    });
  
    backdrop.addEventListener('click', () => setSidebar(false));
  
    /* -----------------------------------------------------
       Profile dropdown (Points / Profile / Heatmap / Log Out)
    ----------------------------------------------------- */
    const profile = document.getElementById('profile');
    const profileBtn = document.getElementById('profileBtn');
    const profileMenu = document.getElementById('profileMenu');
  
    function setMenu(open) {
      profileMenu.classList.toggle('open', open);
      profileBtn.setAttribute('aria-expanded', String(open));
    }
  
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setMenu(!profileMenu.classList.contains('open'));
    });
  
    document.addEventListener('click', (e) => {
      if (!profile.contains(e.target)) setMenu(false);
    });
  
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setMenu(false);
        if (window.innerWidth <= 760) setSidebar(false);
      }
    });
  
    /* -----------------------------------------------------
       Subtle parallax for background orbs (same as sign-in)
    ----------------------------------------------------- */
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) {
      const wraps = document.querySelectorAll('.orb-wrap');
      document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        wraps.forEach((wrap, i) => {
          const depth = (i + 1) * 8;
          wrap.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
        });
      });
    }
  
    /* -----------------------------------------------------
       Streak / active days placeholders
       Wire these up to real data when the backend is ready.
    ----------------------------------------------------- */
    // document.getElementById('streakValue').textContent = '7';
    // document.getElementById('activeDaysValue').textContent = '23';
  });