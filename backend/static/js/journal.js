    const affirmations = [
      "You are worthy of the space you take up.",
      "One small step is still progress.",
      "Be gentle with yourself; you're doing your best.",
      "Growth is quiet and slow; trust the process.",
      "Breathe. You are enough exactly as you are."
    ];

    const userId = localStorage.getItem('user_id');
    let allEntries = [];
    let editingEntryId = null;

    function toggleTheme() {
      const root = document.documentElement;
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    }

    window.onload = () => {
      const saved = localStorage.getItem('theme') || 'light';
      document.documentElement.setAttribute('data-theme', saved);

      if (!userId) { window.location.href = "/signup"; return; }

      document.getElementById('quote').innerText =
        `"${affirmations[Math.floor(Math.random() * affirmations.length)]}"`;
      displayEntries();
    };

    function updateFont() {
      document.getElementById('journal-input').style.fontFamily =
        document.getElementById('fontPicker').value;
    }

    async function saveEntry() {
      const input = document.getElementById('journal-input');
      const mood = document.getElementById('moodPicker').value;
      const status = document.getElementById('save-status');
      if (!input.value.trim()) return;

      try {
        let response;
        if (editingEntryId) {
          response = await fetch(`/api/journal/update/${editingEntryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: input.value, mood })
          });
        } else {
          response = await fetch('/api/journal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, content: input.value, mood })
          });
        }

        if (response.ok) {
          input.value = "";
          editingEntryId = null;
          status.innerText = "✓ Saved successfully.";
          displayEntries();
          setTimeout(() => status.innerText = "", 3000);
        } else {
          status.innerText = "Failed to save.";
        }
      } catch (err) {
        status.innerText = "Server error.";
      }
    }

    async function displayEntries() {
      const container = document.getElementById('entries-display');
      try {
        const res = await fetch(`/api/journal/${userId}`);
        const entries = await res.json();
        allEntries = entries;
        renderEntries(entries);
      } catch {
        container.innerHTML = "<p style='color:#c0392b;'>Could not load entries.</p>";
      }
    }

    function renderEntries(entries) {
      const container = document.getElementById('entries-display');
      if (entries.length === 0) {
        container.innerHTML = "<p style='color:var(--text-muted); font-size:0.9rem;'>Your garden is empty. Start writing above.</p>";
        return;
      }
      container.innerHTML = entries.map((e, i) => `
        <div class="entry-item">
          <div class="timestamp">
            ${new Date(e.timestamp).toLocaleDateString()} @ ${new Date(e.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
          </div>
          <div class="mood-tag">${e.mood || "No mood"}</div>
          <div class="entry-text" id="t-${i}">${e.content}</div>
          <div class="action-row">
            <button class="link-btn" onclick="toggle(${i})" id="b-${i}">Read More</button>
            <button class="link-btn" onclick="editEntry(${e.id}, ${i})">Edit</button>
            <button class="link-btn delete-btn" onclick="deleteEntry(${e.id})">Delete</button>
          </div>
        </div>
      `).join("");
    }

    function toggle(i) {
      const t = document.getElementById(`t-${i}`);
      const b = document.getElementById(`b-${i}`);
      t.classList.toggle('expanded');
      b.innerText = t.classList.contains('expanded') ? "Show Less" : "Read More";
    }

    function editEntry(entryId, index) {
      const entry = allEntries[index];
      document.getElementById("journal-input").value = entry.content;
      document.getElementById("moodPicker").value = entry.mood || "Calm";
      editingEntryId = entryId;
      document.getElementById("save-status").innerText = "✏️ Editing past entry...";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function filterEntries() {
      const q = document.getElementById("searchBox").value.toLowerCase();
      renderEntries(allEntries.filter(e => e.content.toLowerCase().includes(q)));
    }

    async function deleteEntry(entryId) {
      if (!confirm("Delete this entry? This cannot be undone.")) return;
      await fetch(`/api/journal/delete/${entryId}`, { method: 'DELETE' });
      displayEntries();
    }

    function exportPDF() {
      const text = document.getElementById("journal-input").value.trim();
      const mood = document.getElementById("moodPicker").value;
      if (!text) { alert("Write something before exporting."); return; }

      const now = new Date();
      const dateStr = now.toLocaleDateString() + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const printWindow = window.open("", "", "width=800,height=600");

      printWindow.document.write(`
        <html><head>
          <title>MindNest Journal Entry</title>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 50px; color: #344e41; line-height: 1.7; }
            h1 { color: #3a5a40; font-size: 1.8rem; margin-bottom: 4px; }
            .meta { font-size: 13px; color: #888; margin-bottom: 20px; }
            .mood { display:inline-block; padding:4px 14px; border-radius:20px; border:1px solid #a3b18a; color:#3a5a40; font-weight:700; font-size:13px; margin-bottom:20px; }
            hr { border:none; border-top:1px solid #e0e8e0; margin-bottom:24px; }
            .entry { white-space: pre-wrap; font-size: 15px; }
          </style>
        </head><body>
          <h1>MindNest — Journal Entry</h1>
          <div class="meta">${dateStr}</div>
          <div class="mood">${mood}</div>
          <hr>
          <div class="entry">${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
        </body></html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    }

    // --- AUTOCORRECT ---
    const corrections = {
      "teh":"the","adn":"and","thier":"their","tehre":"there","recieve":"receive",
      "beleive":"believe","definately":"definitely","seperate":"separate","occuring":"occurring",
      "untill":"until","alot":"a lot","becuase":"because","dont":"don't","cant":"can't",
      "wont":"won't","isnt":"isn't","im":"I'm","ive":"I've","youre":"you're","u":"you",
      "ur":"your","pls":"please","thx":"thanks","coz":"because","cuz":"because","oky":"okay",
      "gud":"good","gr8":"great","luv":"love","ppl":"people","tho":"though","nvr":"never"
    };

    const textarea = document.getElementById("journal-input");
    let typingTimer;

    textarea.addEventListener("input", () => {
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        const pos = textarea.selectionStart;
        const before = textarea.value;
        const words = before.split(/(\s+)/);
        for (let i = 0; i < words.length; i++) {
          if (corrections[words[i].toLowerCase()]) words[i] = corrections[words[i].toLowerCase()];
        }
        let corrected = words.join("");
        corrected = corrected.replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, c => c.toUpperCase());
        corrected = corrected.replace(/\bi\b/g, "I");
        if (corrected !== before) {
          textarea.value = corrected;
          textarea.setSelectionRange(pos, pos);
        }
      }, 500);
    });