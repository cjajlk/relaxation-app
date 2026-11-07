(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const KEYS = { sleep: 'zenus.sleep.v1', presets: 'zenus.presets.v1', settings: 'zenus.settings.v2' };
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
    if (name === 'session') refreshDashboard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function setMode(mode) {
    if (!['relax', 'sleep'].includes(mode)) return;
    state.mode = mode;
    document.body.classList.toggle('mode-sleep', mode === 'sleep');
    $('mode-relax').classList.toggle('active', mode === 'relax');
    $('mode-sleep').classList.toggle('active', mode === 'sleep');
    $('mode-relax').setAttribute('aria-pressed', String(mode === 'relax'));
    $('mode-sleep').setAttribute('aria-pressed', String(mode === 'sleep'));
    $('scene-badge').textContent = mode === 'sleep' ? 'Sommeil' : 'Détente';
    $('scene').classList.toggle('sleep-scene', mode === 'sleep');
    refreshPlayerInfo();
    if (state.status === 'idle') {
      $('duration').value = mode === 'sleep' ? '45' : '30';
      $('fade').checked = true;
      updateClock();
    }
  }
  function setScene(scene) {
    if (!sceneTexts[scene]) return;
    state.scene = scene;
    if (state.audio && 'mediaSession' in navigator && 'MediaMetadata' in window) navigator.mediaSession.metadata = new MediaMetadata({title:sceneTexts[scene][0],artist:'zenus',album:'Votre ambiance'});
    $('scene').className = 'scene scene-' + scene + (state.mode === 'sleep' ? ' sleep-scene' : '');
    $('scene').setAttribute('aria-label', sceneTexts[scene][2]);
    $('scene-title').textContent = sceneTexts[scene][0];
    $('scene-caption').textContent = sceneTexts[scene][1];
    refreshPlayerInfo();
    $$('.scene-btn').forEach(btn => {
      const active = btn.dataset.scene === scene;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }
  const scenery = {
    forest: 'assets/scenes/forest.webp', ocean: 'assets/scenes/ocean.webp',
    rain: 'assets/scenes/rain.webp', fire: 'assets/scenes/fire.webp'
  };
  function refreshPlayerInfo() {
    if (!$('playing-title')) return;
    $('playing-title').textContent = sceneTexts[state.scene][0];
    $('playing-detail').textContent = (state.mode === 'sleep' ? 'Sommeil' : 'Détente') + ' · votre ambiance sonore';
    $('playing-art').className = 'playing-art art-' + state.scene;
  }
  function renderDashboardSleep() {
    const nights = readSleep().slice().sort((a, b) => b.date.localeCompare(a.date));
    const last = nights[0];
    $('sleep-dash-latest').textContent = last ? displayMinutes(last.minutesInBed) : '—';
    const descriptions = ['','Très difficile','Difficile','Correcte','Bonne','Très bonne'];
    $('sleep-dash-quality').textContent = last ? descriptions[last.quality] + ' · temps au lit' : 'Aucune nuit saisie';
    const week = nights.slice(0,7);
    $('sleep-dash-average').textContent = week.length ? displayMinutes(Math.round(week.reduce((sum,n) => sum+n.minutesInBed,0)/week.length)) : '—';
    $('sleep-dash-score').textContent = week.length ? (week.reduce((sum,n) => sum+n.quality,0)/week.length).toFixed(1)+'/5' : '—';
    const chart = $('sleep-mini');
    chart.replaceChildren();
    if (!week.length) {
      const p=document.createElement('p');p.className='empty-mini';p.textContent='Ajoutez votre première nuit pour voir l’évolution.';chart.append(p);
      return;
    }
    week.slice().reverse().forEach(night=>{
      const box=document.createElement('div');box.className='mini-bar';
      const bar=document.createElement('b');
      bar.style.height=Math.max(6,Math.min(45,Math.round(night.minutesInBed/660*45)))+'px';
      bar.title=safeDateLabel(night.date)+' : '+displayMinutes(night.minutesInBed)+' au lit';
      const label=document.createElement('small');label.textContent=night.date.slice(8);
      box.append(bar,label);chart.append(box);
    });
  }
  function refreshDashboard() {
    renderDashboardSleep();
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
      const level = Math.pow(amount / 100, 1.1) * (type === 'music' ? 0.7 : 0.65);
      node.gain.setTargetAtTime(level, state.audio.context.currentTime, .12);
    }
  }

  // Des fichiers Ogg originaux avec boucles longues remplacent les bruits de 4 s.
  // Les éléments HTMLAudio permettent une lecture multimédia plus robuste en arrière-plan.
  const audioFiles = {
    rain: './sounds/pluie-douce.ogg',
    waves: './sounds/vagues-calmes.ogg',
    fire: './sounds/feu-doux.ogg',
    wind: './sounds/brise.ogg',
    music: './sounds/musique-ambient.ogg'
  };
  function initAudio() {
    if (state.audio) return state.audio;
    const AudioClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioClass) throw new Error('Audio Web non disponible');
    const context = new AudioClass();
    const master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);
    const tracks = {}, elements = {};
    soundTypes.forEach(type => {
      const element = new Audio(audioFiles[type]);
      element.loop = true;
      element.preload = 'auto';
      element.volume = 1;
      elements[type] = element;
      const source = context.createMediaElementSource(element);
      const gain = context.createGain();
      gain.gain.value = 0;
      source.connect(gain);
      gain.connect(master);
      tracks[type] = gain;
    });
    state.audio = {context, master, tracks, elements, finishTimer: null};
    soundTypes.forEach(updateVolume);
    if ('mediaSession' in navigator && 'MediaMetadata' in window) {
      const ms = navigator.mediaSession;
      ms.metadata = new MediaMetadata({title: sceneTexts[state.scene][0], artist: 'zenus', album: 'Détente & sommeil'});
      try {
        ms.setActionHandler('play', () => start());
        ms.setActionHandler('pause', () => pause());
        ms.setActionHandler('stop', () => stop(false));
      } catch (_) { /* option non prise en charge */ }
    }
    return state.audio;
  }
  function targetMaster() { return .75 * Number($('master-volume').value) / 100; }
  function applyMasterVolume() {
    $('master-output').textContent = $('master-volume').value + ' %';
    applyFade();
  }
  function applyFade() {
    if (!state.audio) return;
    const total = duration();
    const remaining = total ? Math.max(0, total - elapsed()) : Infinity;
    const fade = $('fade').checked && total > 0 ? Math.min(1, remaining / 90) : 1;
    state.audio.master.gain.setTargetAtTime(targetMaster() * fade, state.audio.context.currentTime, .25);
  }
  async function start() {
    if (state.status === 'playing') return;
    let audio;
    try {
      audio = initAudio();
      if (audio.finishTimer) { clearTimeout(audio.finishTimer); audio.finishTimer = null; }
      // Lancer les médias directement depuis le clic utilisateur pour respecter les navigateurs mobiles.
      const attempts = soundTypes.map(type => audio.elements[type].play());
      await audio.context.resume();
      await Promise.all(attempts);
    } catch (e) {
      setStatus('Impossible de lire une piste sonore. Vérifiez les fichiers audio.');
      console.error(e);
      if (audio) soundTypes.forEach(type => audio.elements[type].pause());
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
    if (state.audio) {
      const audio = state.audio;
      audio.master.gain.setTargetAtTime(0, audio.context.currentTime, .13);
      audio.finishTimer = setTimeout(() => {
        if (state.status === 'paused') {
          soundTypes.forEach(type => audio.elements[type].pause());
          audio.context.suspend().catch(() => {});
        }
      }, 450);
    }
    $('start').disabled = false;
    $('start').textContent = '▶';
    $('start').setAttribute('aria-label', 'Reprendre l’ambiance');
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
      const audio = state.audio;
      audio.master.gain.setTargetAtTime(0, audio.context.currentTime, .12);
      if (audio.finishTimer) clearTimeout(audio.finishTimer);
      audio.finishTimer = setTimeout(() => {
        if (state.status === 'idle') {
          soundTypes.forEach(type => { audio.elements[type].pause(); audio.elements[type].currentTime = 0; });
          audio.context.suspend().catch(() => {});
        }
      }, 550);
    }
    $('start').disabled = false;
    $('start').textContent = '▶';
    $('start').setAttribute('aria-label', 'Commencer une ambiance');
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
    $('elapsed-label').textContent = timeLabel(elapsed());
    $('player-progress').value = total ? Math.min(100, (elapsed()/total)*100) : 0;
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
    $('breathing-toggle').textContent = state.breathingOn ? '×' : '▶';
    $('breathing-toggle').setAttribute('aria-label',state.breathingOn ? 'Masquer la respiration' : 'Afficher la respiration guidée');
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
    renderDashboardSleep();
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
    const chart = $('sleep-trend');
    chart.replaceChildren();
    recent.slice().reverse().forEach(night => {
      const el = document.createElement('div'); el.className = 'trend-night';
      const bar = document.createElement('div'); bar.className = 'trend-bar';
      bar.style.height = Math.max(5, Math.min(105, Math.round(night.minutesInBed / 600 * 105))) + 'px';
      bar.title = safeDateLabel(night.date) + ' : ' + displayMinutes(night.minutesInBed) + ' passées au lit';
      const date = document.createElement('small'); date.textContent = night.date.slice(8);
      const text = document.createElement('span'); text.textContent = Math.round(night.minutesInBed/60*10)/10 + ' h';
      el.append(bar,date,text); chart.append(el);
    });
    chart.hidden = !recent.length;
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
    $('favorites-short-title').querySelector('span').textContent = presets.length ? 'Mes ambiances favorites' : 'Ambiances à découvrir';
    const quick=$('saved-favorite-quick');quick.replaceChildren();quick.hidden=!presets.length;
    presets.slice(0,3).forEach(preset=>{
      const button=document.createElement('button');button.type='button';button.textContent='♡ '+preset.name;
      button.addEventListener('click',()=>{
        if(state.status!=='idle'){alert('Terminez la séance avant de changer de favori.');return;}
        setMode(preset.mode);setScene(preset.scene);setVolumes(preset.volumes||{});
        $('duration').value=String(preset.duration||0);$('fade').checked=Boolean(preset.fade);updateClock();showPage('session');
      });quick.append(button);
    });
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

  // Ambiances prêtes à écouter — réglages modifiables ensuite.
  const quickPresets = {
    rain: { scene: 'rain', volumes: { rain: 70, waves: 0, fire: 0, wind: 10, music: 20 } },
    ocean: { scene: 'ocean', volumes: { rain: 0, waves: 70, fire: 0, wind: 20, music: 25 } },
    fire: { scene: 'fire', volumes: { rain: 25, waves: 0, fire: 65, wind: 0, music: 30 } },
    forest: { scene: 'forest', volumes: { rain: 20, waves: 0, fire: 0, wind: 55, music: 25 } }
  };
  $$('.quick-preset').forEach(button => button.addEventListener('click', () => {
    const preset = quickPresets[button.dataset.quick];
    if (!preset) return;
    setScene(preset.scene);
    setVolumes(preset.volumes);
    $$('.quick-preset').forEach(b => b.classList.toggle('selected', b === button));
  }));
  $('master-volume').addEventListener('input', applyMasterVolume);
  $('immersion').addEventListener('click', () => {
    const active = document.body.classList.toggle('is-immersive');
    $('immersion').setAttribute('aria-pressed', String(active));
    $('immersion').innerHTML = active ? '✕ <span>Quitter</span>' : '⛶ <span>Immersion</span>';
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('is-immersive')) $('immersion').click();
  });
  $('motion-toggle').addEventListener('click', () => {
    const off = document.body.classList.toggle('motion-off');
    $('motion-toggle').setAttribute('aria-pressed', String(off));
    $('motion-toggle').textContent = off ? 'Réactiver les animations' : 'Désactiver les animations';
    saveJSON(KEYS.settings, {motionOff: off, masterVolume: Number($('master-volume').value)});
  });
  function validateImportedNights(raw) {
    if (!Array.isArray(raw) || raw.length > 10000) throw new Error('Format de carnet non reconnu');
    return raw.filter(n => n && /^\d{4}-\d{2}-\d{2}$/.test(n.date) && /^\d{2}:\d{2}$/.test(n.bed) && /^\d{2}:\d{2}$/.test(n.wake) &&
      Number.isFinite(n.minutesInBed) && n.minutesInBed > 0 && n.minutesInBed <= 1080 && Number.isInteger(n.quality) && n.quality >= 1 && n.quality <= 5)
      .map(n => ({ date: n.date, bed: n.bed, wake: n.wake, minutesInBed: n.minutesInBed,
        latency: Math.min(120, Math.max(0, Number(n.latency)||0)),
        wakings: Math.min(20, Math.max(0, Number(n.wakings)||0)),
        quality: n.quality, note: String(n.note || '').slice(0,200) }));
  }
  $('export-sleep').addEventListener('click', () => {
    const backup = {application: 'zenus', version: 1, exportedAt: new Date().toISOString(), nights: readSleep()};
    const blob = new Blob([JSON.stringify(backup, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'zenus-sommeil-'+localDate()+'.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
    $('backup-message').textContent = 'Copie de votre carnet préparée.';
  });
  $('import-sleep').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 5e6) throw new Error('Fichier trop volumineux');
      const data = JSON.parse(await file.text());
      if (data.application !== 'zenus') throw new Error('Ce fichier ne vient pas de zenus');
      const nights = validateImportedNights(data.nights);
      const existing = readSleep();
      const merged = new Map(nights.map(n => [n.date, n]));
      existing.forEach(n => merged.set(n.date, n)); // les nuits déjà présentes ont la priorité
      if (!saveJSON(KEYS.sleep, Array.from(merged.values()))) throw new Error('Sauvegarde locale impossible');
      renderSleep();
      $('backup-message').textContent = nights.length + ' nuit(s) trouvée(s) : carnet importé sans écraser vos nuits actuelles.';
    } catch (e) { $('backup-message').textContent = 'Import impossible : '+e.message; }
    event.target.value = '';
  });

  $$('.nav-btn').forEach(button => button.addEventListener('click', () => showPage(button.dataset.page)));
  $$('[data-mode-link]').forEach(button=>button.addEventListener('click',()=>{
    showPage('session');setMode(button.dataset.modeLink);
    document.querySelector('.modes').scrollIntoView({behavior:'smooth',block:'center'});
  }));
  $$('[data-go-mixer]').forEach(button=>button.addEventListener('click',()=>{
    showPage('session');$('mixer-section').scrollIntoView({behavior:'smooth',block:'center'});
  }));
  $$('[data-go-breath]').forEach(button=>button.addEventListener('click',()=>{
    showPage('session');if(!state.breathingOn)toggleBreathing();
    $('breathing-panel').scrollIntoView({behavior:'smooth',block:'center'});
  }));
  ['sleep-detail','go-sleep-stats'].forEach(id=>$(id).addEventListener('click',()=>showPage('sleep')));
  $('view-favorites').addEventListener('click',()=>showPage('favorites'));
  $('go-extras').addEventListener('click',()=>showPage('more'));
  $('save-current').addEventListener('click',()=>{
    if(!$('preset-name').value.trim()) $('preset-name').value = sceneTexts[state.scene][0];
    showPage('favorites');$('preset-name').focus();
  });
  $('reset-mix').addEventListener('click',()=>{
    setVolumes({rain:45,waves:0,fire:0,wind:20,music:20});
    $$('.quick-preset').forEach(b=>b.classList.remove('selected'));
  });
  $('scene-big').addEventListener('click',()=>$('immersion').click());
  $('player-immerse').addEventListener('click',()=>{
    if($('page-session').hidden)showPage('session');$('immersion').click();
  });
  const updateConnection = () => {
    $('network-state').textContent = navigator.onLine ? '● Connexion active' : '● Sans connexion';
  };
  window.addEventListener('online',updateConnection);
  window.addEventListener('offline',updateConnection);
  updateConnection();
  $('today-label').textContent = new Date().toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short',year:'numeric'});

  $('mode-relax').addEventListener('click', () => setMode('relax'));
  $('mode-sleep').addEventListener('click', () => setMode('sleep'));
  $$('.scene-btn').forEach(button => button.addEventListener('click', () => setScene(button.dataset.scene)));
  $$('.mixer input[data-sound]').forEach(input => input.addEventListener('input', () => {
    updateVolume(input.dataset.sound);
    $$('.quick-preset').forEach(button => button.classList.remove('selected'));
  }));
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
  const restored = readJSON(KEYS.settings, {});
  if (restored && restored.motionOff) $('motion-toggle').click();
  if (restored && Number.isFinite(restored.masterVolume)) {
    $('master-volume').value = Math.max(0,Math.min(100, restored.masterVolume));
  }
  applyMasterVolume();
  $('master-volume').addEventListener('change', () => saveJSON(KEYS.settings, {
    motionOff: document.body.classList.contains('motion-off'), masterVolume: Number($('master-volume').value)
  }));
  setInterval(breathing, 200);
  soundTypes.forEach(updateVolume);
  refreshPlayerInfo();
  renderSleep(); renderPresets(); updateClock();
  // La boucle audio est créée uniquement après une action explicite de l'utilisateur.
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(error => console.warn('Mode hors ligne indisponible', error)));
  }
})();
