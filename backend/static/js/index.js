        function toggleTheme() {
            const body = document.documentElement;
            const currentTheme = body.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                body.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            } else {
                body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            }
        }

        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);

        const quotes = [
            "Mindfulness means being awake. It means knowing what you are doing.",
            "The best way to capture moments is to pay attention.",
            "Quiet the mind, and the soul will speak.",
            "Feelings are just visitors, let them come and go.",
            "Peace comes from within. Do not seek it without."
        ];

        window.onload = function() {
            const quoteElement = document.getElementById('daily-quote');
            const randomIndex = Math.floor(Math.random() * quotes.length);
            quoteElement.innerText = `"${quotes[randomIndex]}"`;
        };

        (function(d, t) {
            var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
            v.onload = function() {
                window.voiceflow.chat.load({
                    verify: { projectID: '69980eefdbd1e9eaacdda045' },
                    url: 'https://general-runtime.voiceflow.com',
                    versionID: 'production',
                    voice: { url: "https://runtime-api.voiceflow.com" }
                });
            }
            v.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs"; v.type = "text/javascript"; s.parentNode.insertBefore(v, s);
        })(document, 'script');