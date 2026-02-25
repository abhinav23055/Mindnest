    // Theme
    function toggleTheme() {
      const root = document.documentElement;
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    }
    document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');

    const quizData = {
      'Depression': ["In the past two weeks, how often have you felt sad, low, or empty?","How often have you lost interest or pleasure in things you usually enjoy?","How often do you feel tired or low on energy, even without much physical work?","How often do you have trouble sleeping (sleeping too much or too little)?","How often do you feel hopeless about the future?","How often do you feel bad about yourself or feel like you are a failure?","How often do you find it hard to concentrate on studies, work, or tasks?","How often do you feel slow, unmotivated, or mentally heavy?","How often do you feel lonely or disconnected from people?","How often do negative thoughts interfere with your daily life?"],
      'Anxiety': ["How often have you felt nervous, anxious, or on edge?","How often do you worry too much about different things, even small ones?","How often do you find it hard to control your worrying?","How often do you feel restless or unable to relax?","How often do you feel tired or exhausted because of worrying?","How often do you have trouble concentrating because your mind is full of worries?","How often do you feel irritated or easily annoyed due to stress?","How often do you feel afraid that something bad might happen?","How often do you experience physical signs of anxiety (fast heartbeat, etc.)?","How often does anxiety interfere with your studies, work, or daily life?"],
      'ADHD': ["How often do you find it hard to stay focused on tasks?","How often do you get easily distracted by sounds or notifications?","How often do you start tasks but struggle to finish them?","How often do you forget important things like deadlines or appointments?","How often do you feel restless or unable to sit still?","How often do you rush into things without thinking?","How often do you have trouble organizing your work or routine?","How often do you avoid tasks that need long mental effort?","How often do you feel your mind is always racing?","How often do these focus problems affect your relationships?"],
      'OCD': ["How often do you get unwanted thoughts or images that keep coming back?","How often do these thoughts make you feel anxious or stressed?","How often do you feel the need to check things repeatedly (locks, switches)?","How often do you wash or clean more than necessary?","How often do you feel you must do actions in a specific way to feel calm?","How often do you repeat actions or words to reduce anxiety?","How often do you feel uncomfortable if things are not perfectly arranged?","How often do you avoid objects because they trigger stressful thoughts?","How often do you spend a lot of time on these habits?","How often do these behaviors interfere with your work or life?"],
      'Bipolar': ["How often do you experience big mood changes (high and low)?","How often do you feel unusually happy or excited for days?","How often do you feel very sad, empty, or hopeless for days?","How often do you notice your energy level changes a lot?","How often do you need very little sleep but still feel full of energy?","How often do your thoughts race or you talk much more than usual?","How often do you do things impulsively during high-energy moods?","How often do you feel too unmotivated to do simple tasks?","How often do these mood changes affect your relationships?","How often do people comment that your behavior changes a lot?"],
      'Psychosis': ["How often do you see or sense things others do not notice?","How often do you feel your thoughts are confused or mixed up?","How often do you believe others are watching you without proof?","How often do you find it hard to tell what is real?","How often do your thoughts feel disconnected?","How often do you feel your mind is not working the way it used to?","How often do you lose interest in people and prefer to stay isolated?","How often do you feel emotionally 'flat' or empty?","How often do these experiences make it hard to manage daily life?","How often do other people notice changes in your speech or behavior?"],
      'Eating': ["How often do you worry a lot about your body shape or weight?","How often do you feel guilty or ashamed after eating?","How often do you skip meals to control your weight?","How often do you feel out of control while eating?","How often do you try to 'make up for eating' with fasting or over-exercise?","How often do you think about calories or dieting for a large part of the day?","How often do your eating habits affect your social life?","How often do you avoid eating in front of others?","How often do you feel unhappy with your body regardless of what others say?","How often does your relationship with food feel stressful?"],
      'PTSD': ["How often do you have unwanted memories or nightmares about a scary experience?","How often do you feel upset when something reminds you of that experience?","How often do you try to avoid thinking about a painful event from your past?","How often do you avoid places or people that remind you of it?","How often do you feel constantly on edge or easily startled?","How often do you have trouble staying asleep?","How often do you feel irritable or have sudden emotional reactions?","How often do you feel distant from people you used to enjoy?","How often do you have difficulty concentrating because of stressful thoughts?","How often do these experiences interfere with your daily life?"],
      'Addiction': ["How often do you feel a strong urge to use a substance or repeat a habit?","How often do you use more or for longer than you planned?","How often do you try to cut down but find it difficult?","How often do you plan your day around it?","How often do you continue even knowing it's harming your health or work?","How often do you feel restless when you can't do it?","How often do you neglect responsibilities because of it?","How often do you hide how much you use or do it?","How often do you need more than before to feel the same satisfaction?","How often does this habit cause problems with people around you?"],
      'SocialAnxiety': ["How often do you feel nervous in social situations like group talks?","How often do you worry that others will judge or criticize you?","How often do you avoid social events to avoid embarrassment?","How often do you feel your heart race or hands shake around others?","How often do you replay social interactions and worry about what you said?","How often do you find it hard to speak up even when you want to?","How often do you feel self-conscious about how you look or sound?","How often do you prefer to stay invisible to avoid attention?","How often do you avoid presentations or calls because of fear?","How often does this fear affect your work or relationships?"],
      'Postpartum': ["How often have you felt sad or empty since the baby was born?","How often do you cry easily or feel overwhelmed for no clear reason?","How often do you feel exhausted even when you get some rest?","How often do you feel hopeless?","How often do you lose interest in things you used to enjoy?","How often do you feel guilty or feel like you are not a good enough mother?","How often do you feel panicky about yourself or your baby?","How often do you have trouble sleeping even when the baby is resting?","How often do you feel emotionally distant from your baby?","How often do these feelings make it hard to take care of yourself?"],
      'Child': ["How often does your child seem sad or unhappy for long periods?","How often does your child get very anxious about normal situations?","How often does your child have tantrums that are hard to control?","How often does your child have trouble concentrating on homework?","How often does your child avoid school or friends they used to enjoy?","How often does your child have sleep or appetite problems?","How often does your child complain of pain without a clear medical reason?","How often does your child seem very irritable or overly sensitive?","How often do your child's emotions cause problems at school or home?","How often do you feel your child is not coping well for their age?"]
    };

    let responseValues = {};

    function openQuiz(type) {
      responseValues = {};
      document.getElementById('quizTitle').innerText = type + " Assessment";
      const content = document.getElementById('quizContent');
      content.innerHTML = '';

      quizData[type].forEach((q, i) => {
        content.innerHTML += `
          <div class="question-block">
            <p class="question-text">${i + 1}. ${q}</p>
            <div class="options-group" data-q="${i}">
              <button class="opt-btn" onclick="recordScore(${i}, 0, this)">Not at all</button>
              <button class="opt-btn" onclick="recordScore(${i}, 1, this)">Sometimes</button>
              <button class="opt-btn" onclick="recordScore(${i}, 2, this)">Often</button>
              <button class="opt-btn" onclick="recordScore(${i}, 3, this)">Very often</button>
            </div>
          </div>`;
      });

      content.innerHTML += `
        <button class="btn-submit-quiz" onclick="processResults('${type}')">Submit Assessment →</button>
        <div id="innerResult" style="display:none; margin-top:20px;"></div>`;

      document.getElementById('quizOverlay').style.display = 'flex';
      document.querySelector('.quiz-modal').scrollTop = 0;
    }

    function recordScore(questionIndex, value, btn) {
      const group = btn.parentElement;
      group.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      responseValues[questionIndex] = value;
    }

    function closeQuiz() {
      document.getElementById('quizOverlay').style.display = 'none';
    }

    function processResults(type) {
      const resDiv = document.getElementById('innerResult');
      const totalQuestions = quizData[type].length;
      const answeredCount = Object.keys(responseValues).length;

      if (answeredCount < totalQuestions) {
        resDiv.style.display = 'block';
        resDiv.innerHTML = `<p style="color:var(--danger); font-weight:700; text-align:center; font-size:0.88rem;">Please answer all ${totalQuestions} questions before submitting.</p>`;
        return;
      }

      let totalScore = 0;
      for (let key in responseValues) totalScore += responseValues[key];

      const solutions = {
        'Anxiety': "Try the 4-7-8 breathing technique, limit caffeine, and practice 'grounding' by naming 5 things you see.",
        'Depression': "Focus on 'Behavioral Activation' — try to do one small task today, like a 5-minute walk or making your bed.",
        'ADHD': "Break big tasks into 10-minute chunks, use visual timers, and keep a 'distraction pad' for random thoughts.",
        'OCD': "Practice 'Exposure and Response Prevention' by delaying a ritual by just one minute at first.",
        'Postpartum': "Reach out to your doctor or a local support group. Prioritize rest when possible and accept help from loved ones.",
        'Child': "Ensure a consistent routine, use positive reinforcement, and create a 'calm-down corner' with soft textures."
      };

      const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      let level = '', color = '#3a5a40';
      if (totalScore <= 7)       { level = 'Low Signs';      color = '#3a5a40'; }
      else if (totalScore <= 14) { level = 'Mild Signs';     color = '#7a9e6a'; }
      else if (totalScore <= 21) { level = 'Moderate Signs'; color = '#c89640'; }
      else                       { level = 'High Signs';     color = '#c0392b'; }

      resDiv.style.display = 'block';
      resDiv.innerHTML = `
        <div id="pdfContent" class="report-box">
          <p class="report-title">MindNest Wellness Report</p>
          <p class="report-date">${today} &nbsp;·&nbsp; ${type}</p>

          <div class="score-row">
            <div class="chart-wrap"><canvas id="resultChart"></canvas></div>
            <div class="score-detail">
              <div class="lbl">Total Score</div>
              <div class="val" style="color:${color}">${totalScore}<span style="font-size:1rem; font-weight:400; color:var(--text-muted)"> / 30</span></div>
              <div class="level" style="color:${color}">${level}</div>
            </div>
          </div>

          <div class="coping-box">
            <h4>💡 Coping Strategy</h4>
            <p>${solutions[type] || "Focus on self-care, consistent sleep, and reaching out to a trusted professional for a full evaluation."}</p>
          </div>

          <p class="disclaimer-text">* This is a screening tool, not a medical diagnosis. If you are in crisis, please visit your nearest emergency room.</p>

          <button class="btn-pdf no-print" onclick="window.print()">📥 Download Report (PDF)</button>
        </div>`;

      setTimeout(() => {
        const ctx = document.getElementById('resultChart').getContext('2d');
        new Chart(ctx, {
          type: 'doughnut',
          data: {
            datasets: [{
              data: [totalScore, 30 - totalScore],
              backgroundColor: [color, 'rgba(0,0,0,0.05)'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: { tooltip: { enabled: false } }
          }
        });
        document.querySelector('.quiz-modal').scrollTo({ top: 9999, behavior: 'smooth' });
      }, 100);
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