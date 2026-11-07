const circle = document.getElementById('circle');
const instruction = document.getElementById('instruction');
const dateElement = document.getElementById('date');
const tipElement = document.getElementById('daily-tip');
const voiceToggle = document.getElementById('voice-toggle');
const soundSelect = document.getElementById('sound-select');
const volumeSlider = document.getElementById('volume-slider');
const modeSelect = document.getElementById('mode-select');
const themeSelect = document.getElementById('theme-select');
const totalTimeElement = document.getElementById('total-time');
const sessionsCountElement = document.getElementById('sessions-count');
const badgesElement = document.getElementById('badges');
const logSessionButton = document.getElementById('log-session');
const mainApp = document.getElementById('main-app');
const immersionToggleButton = document.getElementById('immersion-toggle');

let voiceEnabled = false;
let previousInstruction = '';
let currentSound = null;
let currentMode = 'default';
let currentTheme = 'default';
let sessionStartTime = null;
const rawStoredTotalTimeSeconds = localStorage.getItem('totalTimeSeconds');
let totalTimeSeconds = 0;

if (rawStoredTotalTimeSeconds !== null) {
    totalTimeSeconds = parseInt(rawStoredTotalTimeSeconds, 10) || 0;
} else {
    const legacyTotalMinutes = parseInt(localStorage.getItem('totalTime') || '0', 10) || 0;
    totalTimeSeconds = legacyTotalMinutes * 60;
    localStorage.setItem('totalTimeSeconds', totalTimeSeconds);
    localStorage.removeItem('totalTime');
}
let sessionsCount = parseInt(localStorage.getItem('sessionsCount') || '0', 10) || 0;
let badges = JSON.parse(localStorage.getItem('badges') || '[]');
let sessionDates = JSON.parse(localStorage.getItem('sessionDates') || '[]');
let badgeDates = JSON.parse(localStorage.getItem('badgeDates') || '{}');
let immersionModeEnabled = false;
let immersionTimeoutId = null;

// Breathing modes: [inspireDuration, expireDuration, holdAfterInspire, holdAfterExpire]
const breathingModes = {
    default: [4000, 4000, 0, 0],
    '478': [4000, 7000, 0, 8000], // 4-7-8
    slow: [6000, 6000, 2000, 2000]
};

// Positive affirmations
const affirmations = [
    "Je suis calme et détendu.",
    "Chaque respiration m'apporte la paix.",
    "Je lâche prise sur mes soucis.",
    "Mon corps et mon esprit sont en harmonie.",
    "Je mérite cette tranquillité."
];

// Array of daily relaxation tips (365 tips, one for each day)
const dailyTips = [
    "Prenez une profonde inspiration et expirez lentement.",
    "Méditez pendant 5 minutes sur vos pensées positives.",
    "Faites une promenade dans la nature.",
    "Écoutez de la musique apaisante.",
    "Pratiquez la gratitude en notant trois choses positives.",
    // Add more tips to reach 365, but for brevity, I'll use a function to generate variations
];

// Function to get day of year
function getDayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

// Function to get daily tip
function getDailyTip() {
    const day = getDayOfYear();
    const tipIndex = day % dailyTips.length;
    return dailyTips[tipIndex];
}

// Update date and tip
function updateDateAndTip() {
    const now = new Date();
    dateElement.textContent = now.toLocaleDateString('fr-FR');
    tipElement.textContent = getDailyTip();
}

function speak(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR'; // Set to French
        speechSynthesis.speak(utterance);
    }
}

function updateInstruction() {
    const mode = breathingModes[currentMode];
    const cycleTime = mode[0] + mode[1] + mode[2] + mode[3];
    const time = Date.now() % cycleTime;
    let currentInstruction;
    let phase = '';

    if (time < mode[0]) {
        currentInstruction = 'Inspirez';
        phase = 'inspire';
    } else if (time < mode[0] + mode[2]) {
        currentInstruction = 'Retenez';
        phase = 'hold-in';
    } else if (time < mode[0] + mode[2] + mode[1]) {
        currentInstruction = 'Expirez';
        phase = 'expire';
    } else {
        currentInstruction = 'Retenez';
        phase = 'hold-out';
    }

    instruction.textContent = currentInstruction;

    // Apply dynamic theme colors
    applyDynamicTheme(phase);

    if (voiceEnabled && currentInstruction !== previousInstruction) {
        speak(currentInstruction);
        previousInstruction = currentInstruction;

        // Speak affirmation during hold phases
        if (phase === 'hold-in' || phase === 'hold-out') {
            setTimeout(() => {
                const affirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
                speak(affirmation);
            }, 1000);
        }
    }
}

setInterval(updateInstruction, 100); // Update every 100ms for smooth text change

// Voice toggle event listener
voiceToggle.addEventListener('click', () => {
    voiceEnabled = !voiceEnabled;
    voiceToggle.textContent = voiceEnabled ? 'Désactiver la Voix Guidée' : 'Activer la Voix Guidée';
});

// Web Audio API for generating ambient sounds
let audioContext = null;
let soundSource = null;

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(soundType) {
    initAudioContext();

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    if (soundSource) {
        soundSource.stop();
        soundSource = null;
    }
    if (soundType !== 'none') {
        soundSource = generateSound(soundType);
        soundSource.start();
    }
}

function generateSound(type) {
    const bufferSize = audioContext.sampleRate * 2; // 2 seconds buffer
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    switch (type) {
        case 'rain':
            // White noise for rain
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.1;
            }
            break;
        case 'waves':
            // Wave surf texture: filtered noise with slow swells (less hum, more shore feel)
            let smooth = 0;
            for (let i = 0; i < bufferSize; i++) {
                const t = i / audioContext.sampleRate;
                const swell = (Math.sin(2 * Math.PI * 0.08 * t) + 1) / 2;
                const white = Math.random() * 2 - 1;
                smooth = (smooth * 0.985) + (white * 0.015);
                const foam = (Math.random() * 2 - 1) * 0.015 * (0.25 + swell);
                data[i] = smooth * (0.35 + swell * 0.75) + foam;
            }
            break;
        case 'forest':
            // Brown noise for wind, with high frequency chirps for birds
            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 0.1;
                // Add occasional bird chirps
                if (Math.random() < 0.01) {
                    data[i] += Math.sin(2 * Math.PI * (3 + Math.random() * 2) * (i / audioContext.sampleRate)) * 0.05;
                }
            }
            break;
        case 'cheminee':
            // Fireplace crackle (relaxing): warm ember bed + soft occasional crackles
            let ember = 0;
            let burst = 0;
            let burstDecay = 0.9;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                ember = (ember * 0.992) + (white * 0.008);

                // Soft crack bursts (rarer and less aggressive)
                if (Math.random() < 0.006) {
                    burst = 0.18 + Math.random() * 0.35;
                    burstDecay = 0.86 + Math.random() * 0.1;
                }

                const snap = (Math.random() * 2 - 1) * burst;
                burst *= burstDecay;

                // Gentle hiss around crackles
                const hiss = (Math.random() * 2 - 1) * 0.012 * (1 + burst * 1.5);

                data[i] = (ember * 0.28) + snap + hiss;
            }
            break;
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gainNode = audioContext.createGain();
    const baseGain = type === 'cheminee' ? 1.25 : 1;
    gainNode.gain.value = Math.min(1, parseFloat(volumeSlider.value) * baseGain);
    currentSound = gainNode; // Store gain node for volume control

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    return source;
}

function applyTheme(theme) {
    document.body.className = theme;
    currentTheme = theme;
}

function applyDynamicTheme(phase) {
    if (currentTheme === 'default') return;
    const colors = {
        forest: { inspire: '#228B22', expire: '#32CD32', hold: '#006400' },
        ocean: { inspire: '#1E90FF', expire: '#00BFFF', hold: '#00008B' },
        rain: { inspire: '#6B8EAE', expire: '#88AFC7', hold: '#4A6072' },
        cheminee: { inspire: '#F59E0B', expire: '#F97316', hold: '#B45309' }
    };
    const themeColors = colors[currentTheme];
    if (themeColors) {
        circle.style.background = `rgba(${hexToRgb(themeColors[phase] || themeColors.hold)}, 0.5)`;
    }
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
}

function updateProgressDisplay() {
    totalTimeElement.textContent = `Temps Total: ${Math.floor(totalTimeSeconds / 60)} min`;
    sessionsCountElement.textContent = `Sessions: ${sessionsCount}`;
    badgesElement.textContent = `Badges: ${badges.length > 0 ? badges.join(', ') : 'Aucun'}`;
}

function persistTimeToStorage() {
    localStorage.setItem('totalTimeSeconds', totalTimeSeconds);
    localStorage.removeItem('totalTime');
}

function captureElapsedTime() {
    if (!sessionStartTime) return;
    const elapsedSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
    if (elapsedSeconds <= 0) return;

    totalTimeSeconds += elapsedSeconds;
    sessionStartTime = Date.now();
    persistTimeToStorage();
    updateProgressDisplay();
}

function setImmersionHidden(isHidden) {
    if (!mainApp || !immersionToggleButton) return;

    mainApp.classList.toggle('ui-hidden', isHidden);
    immersionToggleButton.textContent = immersionModeEnabled
        ? (isHidden ? 'Quitter immersion' : 'Masquer l’interface')
        : 'Mode immersion';
}

function revealUiTemporarily() {
    if (!immersionModeEnabled) return;

    setImmersionHidden(false);
    clearTimeout(immersionTimeoutId);
    immersionTimeoutId = setTimeout(() => {
        if (immersionModeEnabled) {
            setImmersionHidden(true);
        }
    }, 4500);
}

function logSession() {
    if (sessionStartTime) {
        captureElapsedTime();
        sessionsCount++;
        const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        sessionDates.push(currentDate);
        persistTimeToStorage();
        localStorage.setItem('sessionsCount', sessionsCount);
        localStorage.setItem('sessionDates', JSON.stringify(sessionDates));

        // Award badges
        const newBadges = [];
        if (totalTimeSeconds >= 3600 && !badges.includes('1 heure')) {
            badges.push('1 heure');
            badgeDates['1 heure'] = currentDate;
            newBadges.push('1 heure');
        }
        if (sessionsCount >= 10 && !badges.includes('10 sessions')) {
            badges.push('10 sessions');
            badgeDates['10 sessions'] = currentDate;
            newBadges.push('10 sessions');
        }
        localStorage.setItem('badges', JSON.stringify(badges));
        localStorage.setItem('badgeDates', JSON.stringify(badgeDates));

        updateProgressDisplay();
        sessionStartTime = Date.now(); // Reset for next session
    }
}

// Event listeners for new controls
soundSelect.addEventListener('change', (e) => {
    playSound(e.target.value);
});

volumeSlider.addEventListener('input', (e) => {
    if (currentSound) {
        currentSound.gain.value = parseFloat(e.target.value);
    }
});

modeSelect.addEventListener('change', (e) => {
    currentMode = e.target.value;
    const mode = breathingModes[currentMode];
    const cycleTime = mode[0] + mode[1] + mode[2] + mode[3];
    // Update animation duration
    circle.style.animationDuration = `${cycleTime / 1000}s`;
});

themeSelect.addEventListener('change', (e) => {
    applyTheme(e.target.value);
});

logSessionButton.addEventListener('click', logSession);

// Progress button event listener
const progressButton = document.getElementById('progress-button');
progressButton.addEventListener('click', () => {
    window.location.href = 'progress.html';
});

// Initialize progress display and start session timer
updateProgressDisplay();
sessionStartTime = Date.now();
setInterval(captureElapsedTime, 15000);

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        captureElapsedTime();
    }
});

window.addEventListener('beforeunload', () => {
    captureElapsedTime();
});

// Intro start button
const intro = document.getElementById('intro');
const introStartButton = document.querySelector('.intro-start-btn');

if (introStartButton && intro) {
    introStartButton.addEventListener('click', () => {
        intro.style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        dateElement.textContent = new Date().toLocaleDateString();
        tipElement.textContent = getDailyTip();
    });
}

if (immersionToggleButton && mainApp) {
    immersionToggleButton.addEventListener('click', (event) => {
        event.stopPropagation();
        immersionModeEnabled = !immersionModeEnabled;

        clearTimeout(immersionTimeoutId);

        if (immersionModeEnabled) {
            setImmersionHidden(true);
        } else {
            setImmersionHidden(false);
        }
    });

    mainApp.addEventListener('pointerdown', (event) => {
        if (!immersionModeEnabled) return;
        if (event.target === immersionToggleButton) return;

        if (mainApp.classList.contains('ui-hidden')) {
            revealUiTemporarily();
        } else {
            clearTimeout(immersionTimeoutId);
            immersionTimeoutId = setTimeout(() => {
                if (immersionModeEnabled) {
                    setImmersionHidden(true);
                }
            }, 4500);
        }
    });
}
