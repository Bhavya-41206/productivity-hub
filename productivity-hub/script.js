document.addEventListener('DOMContentLoaded', () => {

    const card = document.getElementById('card');
    const toast = document.getElementById('toast');
  
    /* -----------------------------------------------------
       Sign In / Sign Up toggle
    ----------------------------------------------------- */
    const goSignUp = document.getElementById('goSignUp');
    const goSignIn = document.getElementById('goSignIn');
    const switchLinks = document.querySelectorAll('.switch-link');
  
    const activate = () => card.classList.add('active');
    const deactivate = () => card.classList.remove('active');
  
    goSignUp?.addEventListener('click', activate);
    goSignIn?.addEventListener('click', deactivate);
  
    switchLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        link.dataset.target === 'signup' ? activate() : deactivate();
      });
    });
  
    /* -----------------------------------------------------
       Password show / hide toggle
    ----------------------------------------------------- */
    document.querySelectorAll('.field-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const isVisible = input.type === 'text';
        input.type = isVisible ? 'password' : 'text';
        btn.classList.toggle('is-visible', !isVisible);
        btn.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
      });
    });
  
    /* -----------------------------------------------------
       Ripple effect on buttons
    ----------------------------------------------------- */
    document.querySelectorAll('.btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    });
  
    /* -----------------------------------------------------
       Toast notifications
    ----------------------------------------------------- */
    let toastTimer;
    function showToast(message) {
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
    }
  
    /* -----------------------------------------------------
       Field validation helpers
    ----------------------------------------------------- */
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    function setFieldState(input, valid, message) {
      const field = input.closest('.field');
      const error = field.querySelector('.field-error');
  
      if (valid) {
        field.classList.remove('invalid');
        if (error) error.textContent = '';
      } else {
        field.classList.remove('shake');
        // restart shake animation
        void field.offsetWidth;
        field.classList.add('invalid', 'shake');
        if (error) error.textContent = message;
      }
      return valid;
    }
  
    // remove shake class once the animation finishes so it can replay
    document.querySelectorAll('.field').forEach((field) => {
      field.addEventListener('animationend', (e) => {
        if (e.animationName === 'shake') field.classList.remove('shake');
      });
    });
  
    /* -----------------------------------------------------
       Submit handling (front-end demo only)
    ----------------------------------------------------- */
    function runSubmit(button, onDone) {
      button.classList.add('loading');
      button.disabled = true;
  
      setTimeout(() => {
        button.classList.remove('loading');
        button.classList.add('success');
  
        setTimeout(() => {
          button.classList.remove('success');
          button.disabled = false;
          onDone();
        }, 1600);
      }, 1100);
    }
  
    /* Sign In form */
    const signInForm = document.getElementById('signInForm');
    signInForm.addEventListener('submit', (e) => {
      e.preventDefault();
  
      const username = document.getElementById('siUsername');
      const password = document.getElementById('siPassword');
  
      const validUsername = setFieldState(
        username,
        username.value.trim().length > 0,
        'Enter your username'
      );
      const validPassword = setFieldState(
        password,
        password.value.trim().length >= 6,
        'Password must be at least 6 characters'
      );
  
      if (!validUsername || !validPassword) return;
  
      const button = signInForm.querySelector('.btn');
      runSubmit(button, () => {
        showToast(`Welcome back, ${username.value.trim()}! 🔥`);
        signInForm.reset();
        // reset floating labels for inputs with values cleared programmatically
        signInForm.querySelectorAll('input').forEach((i) => i.blur());
      });
    });
  
    /* Sign Up form */
    const signUpForm = document.getElementById('signUpForm');
    signUpForm.addEventListener('submit', (e) => {
      e.preventDefault();
  
      const name = document.getElementById('suName');
      const email = document.getElementById('suEmail');
      const password = document.getElementById('suPassword');
  
      const validName = setFieldState(
        name,
        name.value.trim().length > 1,
        'Tell us your name'
      );
      const validEmail = setFieldState(
        email,
        EMAIL_RE.test(email.value.trim()),
        'Enter a valid email address'
      );
      const validPassword = setFieldState(
        password,
        password.value.trim().length >= 6,
        'Password must be at least 6 characters'
      );
  
      if (!validName || !validEmail || !validPassword) return;
  
      const button = signUpForm.querySelector('.btn');
      runSubmit(button, () => {
        showToast(`Welcome to Productivity Hub, ${name.value.trim()}! Let's start that streak. ✨`);
        signUpForm.reset();
        signUpForm.querySelectorAll('input').forEach((i) => i.blur());
        deactivate();
      });
    });
  
    /* -----------------------------------------------------
       Subtle parallax for background orbs
    ----------------------------------------------------- */
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) {
      const wraps = document.querySelectorAll('.orb-wrap');
      document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        wraps.forEach((wrap, i) => {
          const depth = (i + 1) * 10;
          wrap.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
        });
      });
    }
  });