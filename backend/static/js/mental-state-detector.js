// ── Theme (same as index.js) ──────────────────────────────────────
function toggleTheme() {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
}
document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');

// ── Auth (same as dashboard) ──────────────────────────────────────
const userId = localStorage.getItem('user_id');
if (!userId) window.location.href = '/signup';

document.addEventListener('DOMContentLoaded', () => {
    const name = localStorage.getItem('first_name') || 'Friend';
    document.getElementById('userName').innerHTML = `Hello, ${name} 👋<br/><span>Mental State Scanner</span>`;
    loadHistory();
});

function logout() {
    localStorage.clear();
    window.location.href = '/signup';
}

// ── Save Check-in (/api/checkin) ──────────────────────────────────
async function saveScan() {
    const mood   = document.getElementById('moodSelect').value;
    const stress = document.getElementById('stressSelect').value;
    if (!mood || !stress) { alert('Please rate both your mood and stress level before saving.'); return; }
    try {
        const res = await fetch('/api/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, mood: parseInt(mood), energy: 3, stress: parseInt(stress) })
        });
        if (res.ok) {
            const badge = document.getElementById('saveBadge');
            badge.classList.add('visible');
            setTimeout(() => badge.classList.remove('visible'), 4000);
            loadHistory();
        } else { alert('Failed to save. Please try again.'); }
    } catch { alert('Connection error. Is the Flask server running?'); }
}

// ── Load History (/api/history/:id) ──────────────────────────────
let wellnessChart = null;
async function loadHistory() {
    try {
        const res = await fetch(`/api/history/${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        const tbody = document.getElementById('historyTableBody');
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="history-empty">No check-ins yet. Save your first scan!</td></tr>';
        } else {
            tbody.innerHTML = data.slice(0, 5).map(e => `
                <tr>
                    <td>${new Date(e.date).toLocaleDateString()}</td>
                    <td>${e.mood}/5</td>
                    <td>${e.stress}/5</td>
                </tr>`).join('');
        }
        updateChart(data);
    } catch(e) {
        document.getElementById('historyTableBody').innerHTML = '<tr><td colspan="3" class="history-empty">Could not load history.</td></tr>';
    }
}

function updateChart(data) {
    const ctx = document.getElementById('wellnessTrendChart').getContext('2d');
    if (wellnessChart) wellnessChart.destroy();
    if (!data || data.length === 0) return;
    const sorted = [...data].reverse();
    wellnessChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sorted.map(e => new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [{
                label: 'Mood',
                data: sorted.map(e => e.mood),
                borderColor: '#3a5a40',
                backgroundColor: 'rgba(58,90,64,0.07)',
                fill: true, tension: 0.4,
                pointBackgroundColor: '#3a5a40',
                pointRadius: 4, pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { min:1, max:5, grid:{ color:'rgba(0,0,0,0.04)' }, ticks:{ font:{family:'Plus Jakarta Sans',size:11}, color:'#588157' } },
                x: { grid:{ display:false }, ticks:{ font:{family:'Plus Jakarta Sans',size:11}, color:'#588157' } }
            },
            plugins: { legend:{ display:false } }
        }
    });
}

// ── Face Detection ────────────────────────────────────────────────
let videoStream=null, detectionInterval=null, isModelLoaded=false;
let currentFaceEmotion=null, currentVoiceSentiment=null;
let recognition=null, micActive=false, transcript='';

const emotionData = {
    happy:     { emoji:'😄', color:'#3a5a40', desc:'You appear to be in a positive, joyful state.',          moodHint:4 },
    sad:       { emoji:'😢', color:'#588157', desc:'You appear to be experiencing low mood or sadness.',      moodHint:2 },
    angry:     { emoji:'😠', color:'#c0392b', desc:'Signs of frustration or anger detected.',                 moodHint:2 },
    fearful:   { emoji:'😨', color:'#7d6b4f', desc:'Your expression suggests anxiety or fear.',               moodHint:2 },
    disgusted: { emoji:'🤢', color:'#6b7c3a', desc:'Your expression shows signs of strong aversion.',         moodHint:2 },
    surprised: { emoji:'😲', color:'#b07d2e', desc:'You appear surprised or startled.',                       moodHint:3 },
    neutral:   { emoji:'😐', color:'#a3b18a', desc:'Your expression is calm and neutral — a balanced state.', moodHint:3 },
};

async function loadModels() {
    const U = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
    setLoading(true, 'Loading face detection model...', 20);
    await faceapi.nets.tinyFaceDetector.loadFromUri(U);
    setLoading(true, 'Loading expression model...', 70);
    await faceapi.nets.faceExpressionNet.loadFromUri(U);
    setLoading(true, 'Models ready!', 100);
    await new Promise(r => setTimeout(r, 400));
    setLoading(false);
    isModelLoaded = true;
}
function setLoading(v, t, p) {
    document.getElementById('loadingBar').classList.toggle('visible', v);
    if (t) document.getElementById('loadingText').textContent = t;
    if (p !== undefined) document.getElementById('loadingFill').style.width = p + '%';
}
function setStatus(w, s, t) {
    const d = document.getElementById(w + 'Dot'), sp = document.getElementById(w + 'Status');
    d.className = 'status-dot' + (s ? ' ' + s : '');
    if (sp) sp.textContent = t;
}

async function startCamera() {
    const btn = document.getElementById('startBtn');
    btn.disabled = true; btn.textContent = 'Starting...';
    setStatus('cam', 'loading', 'Requesting camera access...');
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const v = document.getElementById('video');
        v.srcObject = videoStream;
        document.getElementById('placeholder').style.display = 'none';
        document.getElementById('scanLine').style.display = 'block';
        document.getElementById('stopBtn').disabled = false;
        setStatus('cam', 'active', 'Camera active — loading AI models');
        if (!isModelLoaded) await loadModels();
        setStatus('cam', 'active', 'Camera active — detecting expressions');
        btn.textContent = 'Restart'; btn.disabled = false;
        v.addEventListener('play', startDetection);
        initBars();
    } catch(e) {
        btn.disabled = false; btn.textContent = 'Start Camera';
        setStatus('cam', '', 'Camera access denied — allow permission in browser');
    }
}

function stopCamera() {
    if (videoStream) { videoStream.getTracks().forEach(t => t.stop()); videoStream = null; }
    clearInterval(detectionInterval);
    document.getElementById('video').srcObject = null;
    document.getElementById('placeholder').style.display = 'flex';
    document.getElementById('scanLine').style.display = 'none';
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('startBtn').textContent = 'Start Camera';
    setStatus('cam', '', 'Camera off');
    resetEmotionDisplay();
}

function startDetection() {
    const v = document.getElementById('video'), c = document.getElementById('overlay');
    clearInterval(detectionInterval);
    detectionInterval = setInterval(async () => {
        if (!isModelLoaded || v.paused || v.ended) return;
        const r = await faceapi.detectSingleFace(v, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 })).withFaceExpressions();
        c.width = v.videoWidth; c.height = v.videoHeight;
        const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height);
        if (r) {
            const b = r.detection.box;
            ctx.strokeStyle = '#3a5a40'; ctx.lineWidth = 2;
            ctx.strokeRect(b.x, b.y, b.width, b.height);
            const cs = 14; ctx.lineWidth = 3;
            [[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].forEach(([x,y],i) => {
                ctx.beginPath(); ctx.moveTo(x+(i%2?-cs:cs),y); ctx.lineTo(x,y); ctx.lineTo(x,y+(i<2?cs:-cs)); ctx.stroke();
            });
            updateEmotionDisplay(r.expressions);
        } else {
            document.getElementById('emotionEmoji').textContent = '🔍';
            document.getElementById('emotionName').textContent = 'No face detected';
            document.getElementById('emotionName').style.color = 'var(--text-muted)';
            document.getElementById('emotionDesc').textContent = 'Position your face in front of the camera.';
            currentFaceEmotion = null; updateCombinedState();
        }
    }, 600);
}

function updateEmotionDisplay(ex) {
    const s = Object.entries(ex).sort((a,b) => b[1]-a[1]);
    const [top] = s[0]; currentFaceEmotion = top;
    const d = emotionData[top] || emotionData.neutral;
    document.getElementById('emotionEmoji').textContent = d.emoji;
    document.getElementById('emotionName').textContent = top.charAt(0).toUpperCase() + top.slice(1);
    document.getElementById('emotionName').style.color = d.color;
    document.getElementById('emotionDesc').textContent = d.desc;
    const moodSel = document.getElementById('moodSelect');
    if (moodSel.value === '' && d.moodHint) moodSel.value = d.moodHint;
    s.forEach(([e, v]) => {
        const f = document.getElementById('bar-'+e), p = document.getElementById('pct-'+e);
        if (f) { f.style.width = (v*100).toFixed(1)+'%'; f.style.background = emotionData[e]?.color||'var(--accent)'; }
        if (p) p.textContent = (v*100).toFixed(0)+'%';
    });
    updateCombinedState();
}

function initBars() {
    document.getElementById('barsSection').innerHTML = Object.keys(emotionData).map(e => `
        <div class="bar-row">
            <div class="bar-label">${e}</div>
            <div class="bar-track"><div class="bar-fill" id="bar-${e}"></div></div>
            <div class="bar-pct" id="pct-${e}">0%</div>
        </div>`).join('');
}

function resetEmotionDisplay() {
    document.getElementById('emotionEmoji').textContent = '😶';
    document.getElementById('emotionName').textContent = 'Waiting...';
    document.getElementById('emotionName').style.color = 'var(--text-muted)';
    document.getElementById('emotionDesc').textContent = 'Start the camera to begin facial analysis.';
    currentFaceEmotion = null; updateCombinedState();
}

// ── Voice Analysis ────────────────────────────────────────────────
const positiveWords = ['happy','good','great','love','excited','amazing','wonderful','fantastic','joy','grateful','better','fine','calm','peaceful','confident','hopeful'];
const negativeWords = ['sad','bad','terrible','hate','stressed','anxious','worried','depressed','angry','frustrated','tired','exhausted','lonely','scared','hurt','lost','overwhelmed'];
const anxiousWords  = ['nervous','anxious','panic','scared','worried','afraid','uncertain','overwhelmed','shaking'];

function analyzeSentiment(text) {
    const words = text.toLowerCase().split(/\s+/);
    let pos=0, neg=0, anx=0; const fP=[], fN=[], fA=[];
    words.forEach(w => {
        const c = w.replace(/[^a-z]/g,'');
        if (positiveWords.includes(c)) { pos++; fP.push(c); }
        if (negativeWords.includes(c)) { neg++; fN.push(c); }
        if (anxiousWords.includes(c))  { anx++; fA.push(c); }
    });
    let sentiment, color;
    if (anx > 0)         { sentiment='Anxious/Worried'; color='#7d6b4f'; }
    else if (pos > neg)  { sentiment='Positive';         color='#3a5a40'; }
    else if (neg > pos)  { sentiment='Negative/Sad';     color='#c0392b'; }
    else if (!pos&&!neg) { sentiment='Neutral';           color='#a3b18a'; }
    else                 { sentiment='Mixed';              color='#b07d2e'; }
    return { sentiment, color, foundPos:fP, foundNeg:fN, foundAnx:fA };
}

function toggleMic() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Please use Google Chrome for speech recognition.'); return;
    }
    micActive ? stopMic() : startMic();
}

function startMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR(); recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'en-US';
    recognition.onstart = () => {
        micActive = true;
        document.getElementById('micBtn').textContent = '🔴 Stop Listening';
        document.getElementById('micBtn').className = 'btn btn-stop';
        document.getElementById('transcriptText').className = '';
        setStatus('mic', 'active', 'Microphone active — speak now');
    };
    recognition.onresult = (e) => {
        let interim = '', final = transcript;
        for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
            else interim += e.results[i][0].transcript;
        }
        transcript = final;
        document.getElementById('transcriptText').textContent = (final + interim) || '...';
        if (transcript.trim()) {
            const a = analyzeSentiment(transcript);
            currentVoiceSentiment = a.sentiment;
            document.querySelector('#sentimentDisplay .sentiment-dot').style.background = a.color;
            document.getElementById('sentimentDisplay').querySelector('span').textContent = a.sentiment;
            const kw = [
                ...a.foundPos.map(w => `<span style="color:#3a5a40;font-weight:700">${w}</span>`),
                ...a.foundNeg.map(w => `<span style="color:#c0392b;font-weight:700">${w}</span>`),
                ...a.foundAnx.map(w => `<span style="color:#7d6b4f;font-weight:700">${w}</span>`)
            ];
            document.getElementById('keywordEmotions').innerHTML = kw.length ? kw.join(', ') : 'No strong emotional keywords detected.';
            const stressSel = document.getElementById('stressSelect');
            if (stressSel.value === '') {
                if (a.sentiment === 'Anxious/Worried') stressSel.value = '4';
                else if (a.sentiment === 'Negative/Sad') stressSel.value = '3';
                else if (a.sentiment === 'Positive') stressSel.value = '1';
                else stressSel.value = '2';
            }
            updateCombinedState();
        }
    };
    recognition.onerror = (e) => { if (e.error !== 'no-speech') setStatus('mic', '', 'Mic error: ' + e.error); };
    recognition.onend = () => { if (micActive) recognition.start(); };
    recognition.start();
}

function stopMic() {
    micActive = false; if (recognition) recognition.stop();
    document.getElementById('micBtn').textContent = '🎤 Start Listening';
    document.getElementById('micBtn').className = 'btn btn-go';
    setStatus('mic', '', 'Microphone off');
}

function clearTranscript() {
    transcript = '';
    document.getElementById('transcriptText').innerHTML = '<span class="placeholder-text">Start speaking after clicking "Start Listening"...</span>';
    document.querySelector('#sentimentDisplay .sentiment-dot').style.background = 'var(--accent)';
    document.getElementById('sentimentDisplay').querySelector('span').textContent = 'No speech detected yet';
    document.getElementById('keywordEmotions').textContent = 'Emotional keywords from your speech will appear here.';
    currentVoiceSentiment = null; updateCombinedState();
}

// ── Combined State ────────────────────────────────────────────────
function updateCombinedState() {
    const title = document.getElementById('stateTitle');
    const sub   = document.getElementById('stateSub');
    const icon  = document.querySelector('#stateDisplay .state-icon');
    if (!currentFaceEmotion && !currentVoiceSentiment) {
        icon.textContent='🔍'; title.textContent='Awaiting Data';
        sub.textContent='Start both camera and microphone to get a combined mental state analysis.'; return;
    }
    if (currentFaceEmotion && !currentVoiceSentiment) {
        icon.textContent=emotionData[currentFaceEmotion].emoji;
        title.textContent='Face Only: '+currentFaceEmotion.charAt(0).toUpperCase()+currentFaceEmotion.slice(1);
        sub.textContent='Add voice analysis for a more accurate combined reading.'; return;
    }
    if (!currentFaceEmotion && currentVoiceSentiment) {
        icon.textContent='🎤'; title.textContent='Voice Only: '+currentVoiceSentiment;
        sub.textContent='Add facial analysis for a more accurate combined reading.'; return;
    }
    const c = {
        'happy+Positive':          ['😊','Genuinely Happy & Positive',    'Both your face and voice suggest a confident, joyful state.'],
        'happy+Negative':          ['🤔','Masking Emotions',              'Your face shows happiness but your words suggest underlying negative feelings.'],
        'happy+Anxious/Worried':   ['😬','Nervous Excitement',            'You appear cheerful but your words suggest anxiety underneath.'],
        'sad+Positive':            ['🌤️','Trying to Stay Positive',       'You may be putting on a brave face while feeling sad inside.'],
        'sad+Negative':            ['😞','Feeling Down',                  'Both signals suggest you are experiencing sadness or low mood.'],
        'sad+Anxious/Worried':     ['😰','Stressed & Sad',                'Signs of both sadness and anxiety detected.'],
        'angry+Negative':          ['😤','Frustrated or Upset',           'Strong negative signals in both face and voice.'],
        'angry+Positive':          ['💪','Determined',                    'Intense focus — could reflect determination or drive.'],
        'fearful+Anxious/Worried': ['😟','Anxious & Worried',             'Multiple signs of anxiety detected. Consider taking a moment to breathe.'],
        'fearful+Negative':        ['😨','Scared or Overwhelmed',         'Your signals suggest fear or feeling overwhelmed.'],
        'neutral+Neutral':         ['🧘','Calm & Balanced',               'You appear to be in a relaxed, emotionally stable state.'],
        'neutral+Positive':        ['😌','Content & Calm',                'Quiet positivity — you seem calm and satisfied.'],
        'surprised+Positive':      ['🤩','Pleasantly Surprised',          'You seem excited and surprised by something good!'],
        'surprised+Negative':      ['😳','Shocked or Startled',           'Something may have caught you off guard in a negative way.'],
    };
    const key = `${currentFaceEmotion}+${currentVoiceSentiment}`, m = c[key];
    if (m) { icon.textContent=m[0]; title.textContent=m[1]; sub.textContent=m[2]; }
    else {
        icon.textContent = emotionData[currentFaceEmotion].emoji;
        title.textContent = currentFaceEmotion.charAt(0).toUpperCase()+currentFaceEmotion.slice(1)+' — '+currentVoiceSentiment;
        sub.textContent = 'Mixed reading across face and voice signals. More data may improve accuracy.';
    }
}

// ── Voiceflow (same as dashboard) ────────────────────────────────
(function(d,t){
    var v=d.createElement(t), s=d.getElementsByTagName(t)[0];
    v.onload=function(){
        window.voiceflow.chat.load({
            verify: { projectID: '69980eefdbd1e9eaacdda045' },
            url: 'https://general-runtime.voiceflow.com',
            versionID: 'production',
            voice: { url: 'https://runtime-api.voiceflow.com' }
        });
    };
    v.src='https://cdn.voiceflow.com/widget-next/bundle.mjs'; v.type='text/javascript'; s.parentNode.insertBefore(v,s);
})(document,'script');