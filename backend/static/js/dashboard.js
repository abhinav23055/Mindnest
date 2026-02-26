    const userId = localStorage.getItem('user_id');
    let wellnessChart = null;

    if (!userId) window.location.href = "/signup";

    document.addEventListener('DOMContentLoaded', () => {
      const name = localStorage.getItem('first_name') || 'Friend';
      document.getElementById('userName').innerText = `Hello, ${name} 😊`;
      document.getElementById('dateDisplay').innerText = new Date().toDateString();
      loadHistory();
    });

    function toggleTheme() {
      const root = document.documentElement;
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    }
    document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');

    function toggleCheckin() {
      const s = document.getElementById('checkinSection');
      s.style.display = s.style.display === 'block' ? 'none' : 'block';
    }

    async function submitCheckin() {
      const mood = document.getElementById('mood').value;
      const stress = document.getElementById('stress').value;
      const energy = 3;

      try {
        const response = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, mood, energy, stress })
        });

        if (response.ok) {
          const badge = document.getElementById('statusBadge');
          badge.innerText = "Check-in Complete!";
          badge.classList.add('done');
          toggleCheckin();
          loadHistory();
          alert("Progress saved successfully!");
        } else {
          alert("Failed to save. Please try again.");
        }
      } catch (err) {
        alert("Connection error. Is the server running?");
      }
    }

    async function loadHistory() {
      try {
        const response = await fetch(`/api/history/${userId}`);
        if (!response.ok) return;
        const data = await response.json();
        updateChart(data);
        const tbody = document.getElementById('historyTableBody');
        tbody.innerHTML = data.slice(0, 5).map(e => `
          <tr>
            <td>${new Date(e.date).toLocaleDateString()}</td>
            <td>${e.mood}/5</td>
            <td>${e.stress}/5</td>
          </tr>
        `).join('');
      } catch (e) {
        console.error("History loading error:", e);
      }
    }
    
    function downloadPDF() {
  const userId = localStorage.getItem('user_id');
  if (!userId) {
    alert('Please log in first.');
    return;
  }
  window.open(`/api/download_pdf/${userId}`, '_blank');
}

    function updateChart(data) {
      const ctx = document.getElementById('wellnessTrendChart').getContext('2d');
      if (wellnessChart) wellnessChart.destroy();
      const sortedData = [...data].reverse();
      wellnessChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: sortedData.map(e => new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
          datasets: [{
            label: 'Mood',
            data: sortedData.map(e => e.mood),
            borderColor: '#3a5a40',
            backgroundColor: 'rgba(58,90,64,0.07)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#3a5a40',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              min: 1, max: 5,
              grid: { color: 'rgba(0,0,0,0.04)' },
              ticks: { font: { family: 'Plus Jakarta Sans', size: 11 }, color: '#588157' }
            },
            x: {
              grid: { display: false },
              ticks: { font: { family: 'Plus Jakarta Sans', size: 11 }, color: '#588157' }
            }
          },
          plugins: { legend: { display: false } }
        }
      });
    }

    function toggleHistory() {
      const s = document.getElementById('historySection');
      s.style.display = s.style.display === 'block' ? 'none' : 'block';
    }

    function logout() {
      localStorage.clear();
      window.location.href = "/signup";
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