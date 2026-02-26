    // Theme
    function toggleTheme() {
      const root = document.documentElement;
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    }
    document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');

    // Tabs
    const loginForm  = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginTab   = document.getElementById("loginTab");
    const signupTab  = document.getElementById("signupTab");

    function showLogin() {
      signupForm.classList.add("hidden");
      loginForm.classList.remove("hidden");
      loginTab.classList.add("active");
      signupTab.classList.remove("active");
    }

    function showSignup() {
      loginForm.classList.add("hidden");
      signupForm.classList.remove("hidden");
      signupTab.classList.add("active");
      loginTab.classList.remove("active");
    }

    // Signup API
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const inputs = signupForm.querySelectorAll("input");
      const name = inputs[0].value, email = inputs[1].value, password = inputs[2].value;
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const result = await response.json();
      alert(result.message);
      if (response.ok) showLogin();
    });

    // Login API
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const inputs = loginForm.querySelectorAll("input");
      const email = inputs[0].value, password = inputs[1].value;
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const result = await response.json();
        if (response.ok) {
          localStorage.setItem('user_id', result.user_id);
          localStorage.setItem('first_name', result.first_name);
          window.location.href = "/welcome";
        } else {
          alert(result.error || "Login failed");
        }
      } catch (err) {
        alert("Server is not responding.");
      }
    });

    localStorage.setItem('user_id', data.user_id); // ← must exist after login