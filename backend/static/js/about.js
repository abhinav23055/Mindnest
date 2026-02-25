    function toggleTheme() {
      const root = document.documentElement;
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    }
    document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');

    const content = {
      mission: `
        <h2>Our Mission</h2>
        <p>MindNest was founded on the principle that <strong>mental wellness shouldn't be a chore</strong>. We built this for those who feel overwhelmed by traditional journals but still want to see the "big picture" of their life.</p>
        <p>We aim to reduce cognitive load by focusing on simple, visual patterns that help you identify what makes you feel best.</p>
      `,
      privacy: `
        <h2>Privacy First</h2>
        <p>In the age of data mining, we take a different path. MindNest uses <strong>end-to-end local storage</strong> and zero-knowledge architecture.</p>
        <p>This means we don't sell your data, we don't track your identity, and your reflections stay where they belong — with you.</p>
      `,
      tech: `
        <h2>The Science of Small Wins</h2>
        <p>Studies show that the act of "naming your feeling" can reduce the intensity of negative emotions.</p>
        <p>MindNest uses a <strong>Micro-Journaling</strong> framework that lets you log your state in under 5 seconds, making it sustainable for long-term growth.</p>
      `
    };

    function openModal(type) {
      document.getElementById('modalText').innerHTML = content[type];
      document.getElementById('modalOverlay').classList.add('active');
    }

    function closeModal() {
      document.getElementById('modalOverlay').classList.remove('active');
    }

    window.onclick = function(e) {
      if (e.target === document.getElementById('modalOverlay')) closeModal();
    }

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