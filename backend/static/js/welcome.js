        function toggleTheme() {
            const body = document.documentElement;
            const currentTheme = body.getAttribute('data-theme');
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            body.setAttribute('data-theme', nextTheme);
            localStorage.setItem('theme', nextTheme);
        }

        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);

        window.onload = function() {
            const name = localStorage.getItem('first_name') || 'Friend';
            document.getElementById('userGreeting').innerText = `Welcome back, ${name}.`;
        };