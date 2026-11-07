(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const KEYS = { sleep: 'zenus.sleep.v1', presets: 'zenus.presets.v1' };
  const soundTypes = ['rain', 'waves', 'fire', 'wind', 'music'];
  const sceneTexts = {
    forest: ['La forêt murmure', 'Laissez la journée s’éloigner.', 'Paysage de forêt'],
    ocean: ['Au rythme des vagues', 'Un horizon ouvert, un souffle léger.', 'Paysage océanique'],
    rain: ['Une douce pluie', 'Quelques gouttes, beaucoup de calme.', 'Paysage de pluie'],
    fire: ['La chaleur du foyer', 'Prenez place au coin du feu.', 'Paysage de cheminée']
  };
  const state = { mode: 'relax', scene: 'forest', status: 'idle', elapsed: 0, runningSince: 0, tick: null, breathingOn: false, breathStart: 0, priorPhase: '', audio: null };

  function readJSON(key, fallback) {
    try { const result = JSON.parse(localStorage.getItem(key)); return result == null ? fallback : result; }
    catch (e) { return fallback; }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { console.warn('Stockage local indisponible', e); return false; }
  }
  function localDate() {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  }
  function timeLabel(totalSeconds) {
    const seconds = Math.max(0, Math.ceil(totalSeconds));
    const minutes = Math.floor(seconds / 60);
    return String(minutes).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }
  function duration() { return Number($('duration').value) * 60; }
  function elapsed() { return state.elapsed + (state.status === 'playing' ? (Date.now() - state.runningSince) / 1000 : 0); }
  function setStatus(label) { $('status-label').textContent = label; $('status-indicator').classList.toggle('playing', state.status === 'playing'); }
  function showPage(name) {
    $$('.page').forEach(page => { page.hidden = page.id !== 'page-' + name; });
    $$('.nav-btn').forEach(button => {
      const selected = button.dataset.page === name;
      button.classList.toggle('active', selected);
      if (selected) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    });
    if (name === 'sleep') renderSleep();
    if (name === 'favorites') renderPresets();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function setMode(mode) {
    if (!['relax', 'sleep'].includes(mode)) return;
    state.mode = mode;
    $('mode-relax').classList.toggle('active', mode === 'relax');
    $('mode-sleep').classList.toggle('active', mode === 'sleep');
    $('mode-relax').setAttribute('aria-pressed', String(mode === 'relax'));
    $('mode-sleep').setAttribute('aria-pressed', String(mode === 'sleep'));
    $('scene-badge').textContent = mode === 'sleep' ? 'Sommeil' : 'Détente';
    $('scene').classList.toggle('sleep-scene', mode === 'sleep');
    if (state.status === 'idle') {
      $('duration').value = mode === 'sleep' ? '45' : '30';
      $('fade').checked = true;
      updateClock();
    }
  }
  function setScene(scene) {
    if (!sceneTexts[scene]) return;
    state.scene = scene;
    $('scene').className = 'scene scene-' + scene + (state.mode === 'sleep' ? ' sleep-scene' : '');
    $('scene').setAttribute('aria-label', sceneTexts[scene][2]);
    $('scene-title').textContent = sceneTexts[scene][0];
    $('scene-caption').textContent = sceneTexts[scene][1];
    $$('.scene-btn').forEach(btn => {
      const active = btn.dataset.scene === scene;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }
  function getVolumes() {
    const values = {};
    $$('.mixer input[data-sound]').forEach(input => { values[input.dataset.sound] = Number(input.value); });
    return values;
  }
  function setVolumes(volumes) {
    soundTypes.forEach(type => {
      const input = document.querySelector('[data-sound="' + type + '"]');
      input.value = Math.min(100, Math.max(0, Number(volumes[type]) || 0));
      updateVolume(type);
    });
  }
  function updateVolume(type) {
    const slider = document.querySelector('input[data-sound="' + type + '"]');
    const amount = Number(slider.value);
    document.querySelector('[data-output="' + type + '"]').textContent = amount + ' %';
    if (state.audio && state.audio.tracks[type]) {
      const node = state.audio.tracks[type];
      const level = Math.pow(amount / 100, 1.25) * (type === 'music' ? 0.16 : 0.53);
      node.gain.setTargetAtTime(level, state.audio.context.currentTime, .12);
    }
  }

  // Tous les sons sont produits localement à l'aide de Web Audio, sans média tiers.
  function noiseBuffer(context, type) {
    const count = context.sampleRate * 4;
    const buffer = context.createBuffer(1, count, context.sampleRate);
    const data = buffer.getChannelData(0);
    let smooth = 0;
    let ember = 0;
    for (let i = 0; i < count; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'rain') data[i] = white * .33;
      else if (type === 'waves') {
        smooth = .993 * smooth + .007 * white;
        const swell = .35 + .65 * (1 + Math.sin(i / context.sampleRate * 2 * Math.PI * .13)) / 2;
        data[i] = smooth * 3.2 * swell + white * .055 * swell;
      } else if (type === 'wind') {
        smooth = .998 * smooth + .002 * white;
        data[i] = smooth * 2.2 + white * .013;
      } else if (type === 'fire') {
        ember = .975 * ember + .025 * white;
        data[i] = ember * .17 + (Math.random() < .003 ? (Math.random() - .5) * .8 : 0) + white * .014;
      }
    }
    return buffer;
  }
  function initAudio() {
    if (state.audio) return state.audio;
    const AudioClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioClass) throw new Error('Audio Web non disponible');
    const context = new AudioClass();
    const master = context.createGain();
    master.gain.value = .52;
    master.connect(context.destination);
    const tracks = {};
    ['rain', 'waves', 'fire', 'wind'].forEach(type => {
      const source = context.createBufferSource();
      source.buffer = noiseBuffer(context, type);
      source.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = type === 'rain' ? 5000 : type === 'fire' ? 3700 : type === 'wind' ? 520 : 1900;
      const gain = context.createGain();
      gain.gain.value = 0;
      source.connect(filter); filter.connect(gain); gain.connect(master);
      source.start();
      tracks[type] = gain;
    });
    const music = context.createGain();
    music.gain.value = 0;
    music.connect(master);
    // Nappe sonore originale, sans mélodie protégée ni fichier externe.
    [196, 261.63, 329.63].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      const channel = context.createGain();
      channel.gain.value = [.22, .15, .09][index];
      oscillator.connect(channel); channel.connect(music); oscillator.start();
    });
    tracks.music = music;
    state.audio = { context, master, tracks };
    soundTypes.forEach(updateVolume);
    return state.audio;
  }
  function applyFade() {
    if (!state.audio) return;
    const total = duration();
    const remaining = total ? Math.max(0, total - elapsed()) : Infinity;
    const fade = $('fade').checked && total > 0 ? Math.min(1, remaining / 90) : 1;
    state.audio.master.gain.setTargetAtTime(.52 * fade, state.audio.context.currentTime, .18);
  }
  async function start() {
    if (state.status === 'playing') return;
    try {
      const audio = initAudio();
      await audio.context.resume();
    } catch (e) {
      setStatus('Le son est indisponible sur ce navigateur.');
      console.error(e);
      return;
    }
    state.runningSince = Date.now();
    state.status = 'playing';
    $('start').disabled = true;
    $('pause').disabled = false;
    $('stop').disabled = false;
    $('duration').disabled = true;
    setStatus('Votre moment de calme a commencé');
    applyFade();
    if (state.tick) clearInterval(state.tick);
    state.tick = setInterval(tick, 500);
    tick();
  }
  function pause() {
    if (state.status !== 'playing') return;
    state.elapsed = elapsed();
    state.status = 'paused';
    if (state.audio) state.audio.context.suspend().catch(() => {});
    $('start').disabled = false;
    $('start').textContent = '▶ Reprendre';
    $('pause').disabled = true;
    setStatus('Séance en pause');
    updateClock();
  }
  function recordLegacySession(seconds) {
    const amount = Math.floor(seconds);
    if (amount < 30) return;
    // Compatibilité avec les sauvegardes Relaxation déjà présentes sur l'appareil.
    try {
      const total = Number(localStorage.getItem('totalTimeSeconds') || Number(localStorage.getItem('totalTime') || 0) * 60) || 0;
      const count = Number(localStorage.getItem('sessionsCount') || 0) || 0;
      const dates = readJSON('sessionDates', []);
      const badges = readJSON('badges', []);
      const badgeDates = readJSON('badgeDates', {});
      const newTotal = total + amount;
      localStorage.setItem('totalTimeSeconds', String(newTotal));
      localStorage.removeItem('totalTime');
      localStorage.setItem('sessionsCount', String(count + 1));
      if (Array.isArray(dates)) { dates.push(localDate()); saveJSON('sessionDates', dates); }
      if (Array.isArray(badges)) {
        if (newTotal >= 3600 && !badges.includes('1 heure')) { badges.push('1 heure'); badgeDates['1 heure'] = localDate(); }
        if (count + 1 >= 10 && !badges.includes('10 sessions')) { badges.push('10 sessions'); badgeDates['10 sessions'] = localDate(); }
        saveJSON('badges', badges); saveJSON('badgeDates', badgeDates);
      }
    } catch (e) { console.warn('Sauvegarde de séance indisponible', e); }
  }
  function stop(autoEnded = false) {
    if (state.status === 'idle') return;
    const played = elapsed();
    state.elapsed = 0;
    state.runningSince = 0;
    state.status = 'idle';
    if (state.tick) { clearInterval(state.tick); state.tick = null; }
    if (state.audio) {
      state.audio.master.gain.value = 0;
      state.audio.context.suspend().catch(() => {});
    }
    $('start').disabled = false;
    $('start').textContent = '▶ Commencer';
    $('pause').disabled = true;
    $('stop').disabled = true;
    $('duration').disabled = false;
    recordLegacySession(played);
    setStatus(autoEnded ? 'Votre séance est terminée. Douce nuit.' : 'Séance terminée. Merci pour ce moment.');
    updateClock();
  }
  function updateClock() {
    const total = duration();
    $('clock').textContent = total ? timeLabel(Math.max(0, total - elapsed())) : timeLabel(elapsed());
  }
  function tick() {
    if (state.status === 'playing') {
      const total = duration();
      if (total > 0 && elapsed() >= total) { stop(true); return; }
      applyFade();
    }
    updateClock();
  }
  function breathing() {
    if (!state.breathingOn) return;
    const timings = {
      normal: [['Inspirez', 4000], ['Expirez', 4000]],
      slow: [['Inspirez', 6000], ['Expirez', 6000]],
      '478': [['Inspirez', 4000], ['Retenez', 7000], ['Expirez', 8000]]
    }[$('breathing-mode').value];
    const cycle = timings.reduce((sum, part) => sum + part[1], 0);
    let position = (Date.now() - state.breathStart) % cycle;
    let phase = timings[0][0];
    for (const item of timings) { if (position < item[1]) { phase = item[0]; break; } position -= item[1]; }
    $('breathing-text').textContent = phase;
    $('breathing-orb').style.transform = phase === 'Inspirez' ? 'scale(1.06)' : phase === 'Retenez' ? 'scale(1.01)' : 'scale(.78)';
    if (state.priorPhase !== phase) {
      state.priorPhase = phase;
      if ($('voice').checked && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = new SpeechSynthesisUtterance(phase);
        text.lang = 'fr-FR'; text.rate = .88; text.volume = .55;
        window.speechSynthesis.speak(text);
      }
    }
  }
  function toggleBreathing() {
    state.breathingOn = !state.breathingOn;
    $('breathing-panel').hidden = !state.breathingOn;
    $('breathing-toggle').setAttribute('aria-expanded', String(state.breathingOn));
    $('breathing-toggle').textContent = state.breathingOn ? '− Masquer la respiration' : '＋ Respiration guidée';
    state.breathStart = Date.now(); state.priorPhase = '';
    if (!state.breathingOn && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    breathing();
  }

  function readSleep() { const data = readJSON(KEYS.sleep, []); return Array.isArray(data) ? data : []; }
  function minutes(time) { const parts = time.split(':').map(Number); return parts[0] * 60 + parts[1]; }
  function bedMinutes(bed, wake) {
    const difference = (minutes(wake) - minutes(bed) + 1440) % 1440;
    return difference;
  }
  function displayMinutes(value) { return Math.floor(value / 60) + ' h ' + String(value % 60).padStart(2, '0'); }
  function safeDateLabel(date) {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function saveNight(event) {
    event.preventDefault();
    const date = $('sleep-date').value;
    const bed = $('sleep-bed').value, wake = $('sleep-wake').value;
    const span = bedMinutes(bed, wake);
    if (!date || !bed || !wake || date > localDate()) { $('sleep-message').textContent = 'Vérifiez les dates et les heures.'; return; }
    if (span === 0 || span > 18 * 60) { $('sleep-message').textContent = 'Vérifiez les heures : la durée doit être comprise entre 1 minute et 18 heures.'; return; }
    const night = {
      date, bed, wake, minutesInBed: span,
      latency: Number($('sleep-latency').value),
      wakings: Number($('sleep-wakings').value),
      quality: Number($('sleep-quality').value),
      note: $('sleep-note').value.trim().slice(0, 200)
    };
    const nights = readSleep().filter(item => item.date !== date);
    nights.push(night);
    nights.sort((a, b) => b.date.localeCompare(a.date));
    if (saveJSON(KEYS.sleep, nights)) {
      $('sleep-message').textContent = 'Nuit enregistrée sur cet appareil.';
      $('sleep-note').value = '';
      renderSleep();
    } else $('sleep-message').textContent = 'Sauvegarde impossible : stockage du navigateur indisponible.';
  }
  function renderSleep() {
    const nights = readSleep().sort((a, b) => b.date.localeCompare(a.date));
    const summary = $('sleep-summary'), history = $('sleep-history');
    summary.replaceChildren(); history.replaceChildren();
    const recent = nights.slice(0, 7);
    const average = recent.length ? Math.round(recent.reduce((sum, n) => sum + n.minutesInBed, 0) / recent.length) : 0;
    const quality = recent.length ? (recent.reduce((sum, n) => sum + n.quality, 0) / recent.length).toFixed(1) : '—';
    [[recent.length ? displayMinutes(average) : '—', 'Temps au lit moyen · 7 nuits saisies max'], [quality + (recent.length ? '/5' : ''), 'Qualité ressentie moyenne']].forEach(pair => {
      const stat = document.createElement('div'); stat.className = 'stat';
      const strong = document.createElement('strong'); strong.textContent = pair[0];
      const small = document.createElement('small'); small.textContent = pair[1];
      stat.append(strong, small); summary.append(stat);
    });
    if (!nights.length) { const p = document.createElement('p'); p.className = 'hint'; p.textContent = 'Aucune nuit enregistrée pour le moment.'; history.append(p); return; }
    const descriptions = ['', 'Très difficile', 'Difficile', 'Correcte', 'Bonne', 'Très bonne'];
    nights.slice(0, 14).forEach(night => {
      const row = document.createElement('div'); row.className = 'night';
      const copy = document.createElement('div');
      const title = document.createElement('strong'); title.textContent = safeDateLabel(night.date) + ' · ' + descriptions[night.quality];
      const detail = document.createElement('small'); detail.textContent = night.bed + ' → ' + night.wake + ' · ' + displayMinutes(night.minutesInBed) + ' au lit';
      copy.append(title, detail);
      if (night.note) { const note = document.createElement('small'); note.textContent = night.note; copy.append(note); }
      const remove = document.createElement('button'); remove.className = 'mini-btn'; remove.type = 'button'; remove.textContent = 'Supprimer'; remove.setAttribute('aria-label', 'Supprimer la nuit du ' + safeDateLabel(night.date));
      remove.addEventListener('click', () => {
        if (window.confirm('Supprimer cette nuit ?')) {
          saveJSON(KEYS.sleep, readSleep().filter(item => item.date !== night.date)); renderSleep();
        }
      });
      row.append(copy, remove); history.append(row);
    });
  }
  function readPresets() { const data = readJSON(KEYS.presets, []); return Array.isArray(data) ? data : []; }
  function savePreset() {
    const name = $('preset-name').value.trim();
    if (!name) { $('preset-message').textContent = 'Donnez un nom à votre ambiance.'; return; }
    const presets = readPresets().filter(item => item.name.toLowerCase() !== name.toLowerCase());
    presets.unshift({ id: Date.now() + '-' + Math.random().toString(36).slice(2, 8), name: name.slice(0, 35), mode: state.mode, scene: state.scene, volumes: getVolumes(), duration: $('duration').value, fade: $('fade').checked });
    if (saveJSON(KEYS.presets, presets)) { $('preset-name').value = ''; $('preset-message').textContent = 'Ambiance enregistrée.'; renderPresets(); }
    else $('preset-message').textContent = 'Sauvegarde indisponible.';
  }
  function renderPresets() {
    const presets = readPresets(), holder = $('presets'); holder.replaceChildren();
    if (!presets.length) { const p = document.createElement('p'); p.className = 'hint'; p.textContent = 'Aucun favori enregistré. Composez une ambiance dans Ambiances, puis revenez ici.'; holder.append(p); return; }
    presets.forEach(preset => {
      const row = document.createElement('div'); row.className = 'preset-item';
      const copy = document.createElement('div'), name = document.createElement('strong'), details = document.createElement('small');
      name.textContent = preset.name;
      details.textContent = (preset.mode === 'sleep' ? 'Sommeil' : 'Détente') + ' · ' + (sceneTexts[preset.scene] ? sceneTexts[preset.scene][2] : 'Forêt');
      copy.append(name, details);
      const controls = document.createElement('div');
      const load = document.createElement('button'); load.type = 'button'; load.className = 'mini-btn'; load.textContent = 'Utiliser';
      load.addEventListener('click', () => {
        if (state.status !== 'idle') { $('preset-message').textContent = 'Terminez la séance en cours avant de changer de favori.'; return; }
        setMode(preset.mode); setScene(preset.scene); setVolumes(preset.volumes || {});
        $('duration').value = String(preset.duration || 0); $('fade').checked = Boolean(preset.fade); updateClock();
        showPage('session');
      });
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'mini-btn'; remove.textContent = 'Supprimer';
      remove.addEventListener('click', () => {
        if (window.confirm('Supprimer cette ambiance ?')) { saveJSON(KEYS.presets, readPresets().filter(item => item.id !== preset.id)); renderPresets(); }
      });
      controls.append(load, document.createTextNode(' '), remove);
      row.append(copy, controls); holder.append(row);
    });
  }

  $$('.nav-btn').forEach(button => button.addEventListener('click', () => showPage(button.dataset.page)));
  $('mode-relax').addEventListener('click', () => setMode('relax'));
  $('mode-sleep').addEventListener('click', () => setMode('sleep'));
  $$('.scene-btn').forEach(button => button.addEventListener('click', () => setScene(button.dataset.scene)));
  $$('.mixer input[data-sound]').forEach(input => input.addEventListener('input', () => updateVolume(input.dataset.sound)));
  $('duration').addEventListener('change', updateClock);
  $('fade').addEventListener('change', applyFade);
  $('start').addEventListener('click', start);
  $('pause').addEventListener('click', pause);
  $('stop').addEventListener('click', () => stop(false));
  $('breathing-toggle').addEventListener('click', toggleBreathing);
  $('breathing-mode').addEventListener('change', () => { state.breathStart = Date.now(); state.priorPhase = ''; breathing(); });
  $('voice').addEventListener('change', () => { state.priorPhase = ''; if (!$('voice').checked && 'speechSynthesis' in window) window.speechSynthesis.cancel(); });
  $('sleep-form').addEventListener('submit', saveNight);
  $('save-preset').addEventListener('click', savePreset);
  $('sleep-date').value = localDate();
  setInterval(breathing, 200);
  soundTypes.forEach(updateVolume);
  renderSleep(); renderPresets(); updateClock();
  // La boucle audio est créée uniquement après une action explicite de l'utilisateur.
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(error => console.warn('Mode hors ligne indisponible', error)));
  }
})();
