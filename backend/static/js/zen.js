    let audioCtx, gainNode, oscillators = [], audioReady = false, audioMuted = false;

    function initAudio() {
      if (audioReady) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.connect(audioCtx.destination);

      // Layered peaceful drones: root + fifth + soft octave
      const freqs = [110, 165, 220, 275];
      freqs.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        osc.type = i === 0 ? 'sine' : 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        oscGain.gain.setValueAtTime(i === 0 ? 0.18 : 0.06 / (i + 1), audioCtx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(gainNode);
        osc.start();
        oscillators.push(osc);
      });

      audioReady = true;
    }

    function startAudio() {
      initAudio();
      if (!audioMuted) gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 2);
    }

    function stopAudio() {
      if (!audioReady) return;
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);
    }

    function toggleAudio() {
      const btn = document.getElementById('audio-btn');
      audioMuted = !audioMuted;
      if (audioMuted) {
        gainNode && gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
        btn.textContent = '🔇';
      } else {
        gainNode && gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 1);
        btn.textContent = '🔊';
      }
    }
    
    
    // Theme
    function toggleTheme() {
      const root = document.documentElement;
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    }
    document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');

    // Breathing logic
    let isActive = false;
    let sessionTimeout, countdownInterval, elapsedInterval;
    let stage = 0, cycles = 0, elapsed = 0;

    const stages = [
      { msg: "Inhale slowly...",   phase: "Inhale",  bubbleClass: "breathing-bubble inhale", dot: 0 },
      { msg: "Hold your breath...", phase: "Hold",   bubbleClass: "breathing-bubble inhale", dot: 1 },
      { msg: "Exhale gently...",   phase: "Exhale",  bubbleClass: "breathing-bubble exhale", dot: 2 },
      { msg: "Hold and rest...",   phase: "Rest",    bubbleClass: "breathing-bubble exhale", dot: 3 },
    ];

    function toggleSession() {
      const btn = document.getElementById('start-btn');
      if (!isActive) {
        isActive = true;
        stage = 0; cycles = 0; elapsed = 0;
        btn.textContent = "End Session";
        btn.classList.add('stop');
        startAudio();
        runCycle();
        elapsedInterval = setInterval(() => {
          elapsed++;
          document.getElementById('time-elapsed').textContent = elapsed + 's';
        }, 1000);
      } else {
        endSession();
      }
    }

    function endSession() {
      isActive = false;
      clearTimeout(sessionTimeout);
      clearInterval(countdownInterval);
      clearInterval(elapsedInterval);
      stopAudio();

      const btn = document.getElementById('start-btn');
      btn.textContent = "Start Session";
      btn.classList.remove('stop');

      const bubble = document.getElementById('bubble');
      bubble.className = "breathing-bubble";
      bubble.textContent = "";
      document.getElementById('instruction').textContent = "Session complete. Take a moment for yourself.";
      document.getElementById('phase-label').textContent = "";
      document.getElementById('stage-name').textContent = "—";
      clearDots();
    }

    function runCycle() {
      if (!isActive) return;

      const current = stages[stage % 4];
      const bubble = document.getElementById('bubble');

      document.getElementById('instruction').textContent = current.msg;
      document.getElementById('phase-label').textContent = current.phase;
      document.getElementById('stage-name').textContent = current.phase;
      bubble.className = current.bubbleClass;

      // Dot indicator
      clearDots();
      document.getElementById('dot-' + current.dot).classList.add('active');

      // Countdown inside bubble
      let count = 4;
      bubble.textContent = count;
      clearInterval(countdownInterval);
      countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
          bubble.textContent = count;
        } else {
          clearInterval(countdownInterval);
        }
      }, 1000);

      // Cycle counter increments every full 4-stage loop
      if (stage % 4 === 3) {
        cycles++;
        document.getElementById('cycle-count').textContent = cycles;
      }

      stage++;
      sessionTimeout = setTimeout(runCycle, 4000);
    }

    function clearDots() {
      document.querySelectorAll('.dot').forEach(d => d.classList.remove('active'));
    }