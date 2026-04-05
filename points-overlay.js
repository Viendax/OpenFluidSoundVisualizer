
(() => {
  const LS_KEY = 'restart_step2_smoke_v1';
  const UI_VERSION = 2;

  const fluidCanvas = document.getElementById('fluidCanvas');
  const pointsCanvas = document.getElementById('pointsCanvas');
  const ctx = pointsCanvas.getContext('2d', { alpha: true });

  const audio = document.getElementById('audio');
  const audioFile = document.getElementById('audioFile');
  const bgFile = document.getElementById('bgFile');
  const clearBgBtn = document.getElementById('clearBg');
  const useMicEl = document.getElementById('useMic');
  const useSystemAudioEl = document.getElementById('useSystemAudio');
  const showPointsEl = document.getElementById('showPoints');
  const testFluidBtn = document.getElementById('testFluid');
  const statusEl = document.getElementById('status');
  const metaEl = document.getElementById('meta');

  let uiHidden = false;
  let pageClickTimer = null;
  let bgObjectUrl = null;
  function setUIHidden(v){
    uiHidden = !!v;
    document.documentElement.classList.toggle('ui-hidden', uiHidden);
  }
  async function toggleFullscreen(){
    try{
      const target = document.documentElement || document.body;
      if (!document.fullscreenElement) await target.requestFullscreen();
      else await document.exitFullscreen();
    }catch(e){}
  }
  function isSettingsTarget(target){
    if (!(target instanceof Element)) return false;
    return !!target.closest('.bar, .panel, .dg, #audio, input, button, label, select, option');
  }
  function armPageClick(toggleFn){
    if (pageClickTimer) return;
    pageClickTimer = setTimeout(() => {
      pageClickTimer = null;
      toggleFn();
    }, 220);
  }
  document.addEventListener('click', (e) => {
    if (isSettingsTarget(e.target)) return;
    armPageClick(() => setUIHidden(!uiHidden));
  }, true);
  document.addEventListener('dblclick', async (e) => {
    if (isSettingsTarget(e.target)) return;
    if (pageClickTimer) {
      clearTimeout(pageClickTimer);
      pageClickTimer = null;
    }
    e.preventDefault();
    await toggleFullscreen();
  }, { passive:false, capture:true });
  window.addEventListener('keydown', async (e) => {
    if (e.code === 'Escape' && document.fullscreenElement){
      e.preventDefault();
      try { await document.exitFullscreen(); } catch(e){}
    }
  }, { passive:false });

  const $ = (id) => document.getElementById(id);
  const ui = {
    gain: $('gain'), spawn: $('spawn'), maxPoints: $('maxPoints'), centerBias: $('centerBias'), centerPin: $('centerPin'), bandRadius: $('bandRadius'), band: $('band'),
    cutLowMid: $('cutLowMid'), cutMidHigh: $('cutMidHigh'), isolation: $('isolation'),
    sensBass: $('sensBass'), sensMid: $('sensMid'), sensTre: $('sensTre'), hueBass: $('hueBass'), hueMid: $('hueMid'), hueTre: $('hueTre'),
    life: $('life'), lifePct: $('lifePct'), lifeThr: $('lifeThr'), size: $('size'), sizei: $('sizei'), sizeSlope: $('sizeSlope'), jitter: $('jitter'), jitPct: $('jitPct'), jitThr: $('jitThr'),
    motion: $('motion'), thr: $('thr'), speed: $('speed'), swirl: $('swirl'), bpmRot: $('bpmRot'), bpmThr: $('bpmThr'), flipBeats: $('flipBeats'), flipBlend: $('flipBlend'),
    springK: $('springK'), damp: $('damp'), eqBlend: $('eqBlend'), trail: $('trail'), smokeOpacity: $('smokeOpacity'), zoom: $('zoom'),
  };
  const vals = {
    gain: $('v_gain'), spawn: $('v_spawn'), maxPoints: $('v_maxPoints'), centerBias: $('v_centerBias'), centerPin: $('v_centerPin'), bandRadius: $('v_bandRadius'), band: $('v_band'),
    cutLowMid: $('v_cutLowMid'), cutMidHigh: $('v_cutMidHigh'), isolation: $('v_isolation'),
    sensBass: $('v_sensBass'), sensMid: $('v_sensMid'), sensTre: $('v_sensTre'), hueBass: $('v_hueBass'), hueMid: $('v_hueMid'), hueTre: $('v_hueTre'),
    life: $('v_life'), lifePct: $('v_lifePct'), lifeThr: $('v_lifeThr'), size: $('v_size'), sizei: $('v_sizei'), sizeSlope: $('v_sizeSlope'), jitter: $('v_jitter'), jitPct: $('v_jitPct'), jitThr: $('v_jitThr'),
    motion: $('v_motion'), thr: $('v_thr'), speed: $('v_speed'), swirl: $('v_swirl'), bpmRot: $('v_bpmRot'), bpmThr: $('v_bpmThr'), flipBeats: $('v_flipBeats'), flipBlend: $('v_flipBlend'),
    springK: $('v_springK'), damp: $('v_damp'), eqBlend: $('v_eqBlend'), trail: $('v_trail'), smokeOpacity: $('v_smokeOpacity'), zoom: $('v_zoom'),
  };

  function safeParseJSON(s){ try { return JSON.parse(s); } catch { return null; } }
  function legacyZoomRawToPercent(raw){
    const v = Number(raw);
    if (!Number.isFinite(v)) return 100;
    return String(Math.round(Math.max(45, Math.min(220, Math.exp(v / 120) * 100))));
  }
  function loadSettings(){
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const obj = safeParseJSON(raw);
    if (!obj || typeof obj !== 'object') return;
    const savedVersion = Number(obj.__uiVersion) || 0;
    for (const [id, val] of Object.entries(obj)) {
      if (id === '__uiVersion') continue;
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.type === 'checkbox') el.checked = !!val;
      else if (id === 'zoom' && savedVersion < 2) el.value = legacyZoomRawToPercent(val);
      else el.value = String(val);
    }
  }
  function saveSettings(){
    const ids = ['useMic','useSystemAudio','showPoints','gain','spawn','maxPoints','centerBias','centerPin','bandRadius','band','cutLowMid','cutMidHigh','isolation','sensBass','sensMid','sensTre','hueBass','hueMid','hueTre','life','lifePct','lifeThr','size','sizei','sizeSlope','jitter','jitPct','jitThr','motion','thr','speed','swirl','bpmRot','bpmThr','flipBeats','flipBlend','springK','damp','eqBlend','trail','smokeOpacity','zoom'];
    const out = { __uiVersion: UI_VERSION };
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      out[id] = el.type === 'checkbox' ? !!el.checked : el.value;
    }
    localStorage.setItem(LS_KEY, JSON.stringify(out));
  }

  loadSettings();
  if (+ui.sensTre.value === 0) ui.sensTre.value = '1.35';

  function setToggleDisabled(inputEl, disabled){
    if (!inputEl) return;
    inputEl.disabled = !!disabled;
    const label = inputEl.closest('label');
    if (label) label.classList.toggle('is-disabled', !!disabled);
  }
  function normalizeExclusiveAudioToggles(preferred){
    if (!useMicEl || !useSystemAudioEl) return;
    if (useMicEl.checked && useSystemAudioEl.checked) {
      if (preferred === 'mic') useSystemAudioEl.checked = false;
      else useMicEl.checked = false;
    }
    setToggleDisabled(useMicEl, !!useSystemAudioEl.checked);
    setToggleDisabled(useSystemAudioEl, !!useMicEl.checked);
  }
  normalizeExclusiveAudioToggles('system');

  function applySmokeOpacity(){
    const opacity = Math.max(0, Math.min(1, (+ui.smokeOpacity.value || 0) / 100));
    fluidCanvas.style.opacity = String(opacity);
  }
  function setBackgroundImage(url){
    if (bgObjectUrl && bgObjectUrl !== url) {
      try { URL.revokeObjectURL(bgObjectUrl); } catch {}
    }
    bgObjectUrl = url || null;
    if (url) {
      document.body.style.background = `center center / cover no-repeat fixed url("${url}")`;
      statusEl.textContent = 'Image de fond chargée';
    } else {
      document.body.style.background = '';
      statusEl.textContent = 'Fond retiré';
    }
  }

  function enforceCrossoverOrder(){
    if (!ui.cutLowMid || !ui.cutMidHigh) return { lowMid: 180, midHigh: 2400 };
    let lowMid = +ui.cutLowMid.value || 180;
    let midHigh = +ui.cutMidHigh.value || 2400;
    const gap = 250;
    lowMid = Math.max(80, Math.min(400, lowMid));
    midHigh = Math.max(1200, Math.min(6000, midHigh));
    if (lowMid > midHigh - gap) {
      const center = (lowMid + midHigh) * 0.5;
      lowMid = Math.max(80, Math.min(400, center - gap * 0.5));
      midHigh = Math.max(1200, Math.min(6000, center + gap * 0.5));
      if (lowMid > midHigh - gap) lowMid = Math.max(80, Math.min(400, midHigh - gap));
    }
    ui.cutLowMid.value = String(Math.round(lowMid));
    ui.cutMidHigh.value = String(Math.round(midHigh));
    return { lowMid, midHigh };
  }

  function syncUI(){
    vals.gain.textContent = (+ui.gain.value).toFixed(2);
    vals.spawn.textContent = (+ui.spawn.value).toFixed(0);
    vals.maxPoints.textContent = (+ui.maxPoints.value).toFixed(0);
    vals.centerBias.textContent = (+ui.centerBias.value).toFixed(2);
    vals.centerPin.textContent = (+ui.centerPin.value).toFixed(0) + '%';
    vals.bandRadius.textContent = (+ui.bandRadius.value).toFixed(2);
    vals.band.textContent = ['bass','mid','aigu'][+ui.band.value] ?? ui.band.value;
    const xo = enforceCrossoverOrder();
    vals.cutLowMid.textContent = Math.round(xo.lowMid) + ' Hz';
    vals.cutMidHigh.textContent = Math.round(xo.midHigh) + ' Hz';
    vals.isolation.textContent = (+ui.isolation.value).toFixed(2);
    vals.sensBass.textContent = (+ui.sensBass.value).toFixed(2);
    vals.sensMid.textContent  = (+ui.sensMid.value).toFixed(2);
    vals.sensTre.textContent  = (+ui.sensTre.value).toFixed(2);
    vals.hueBass.textContent  = (+ui.hueBass.value).toFixed(0) + '°';
    vals.hueMid.textContent   = (+ui.hueMid.value).toFixed(0) + '°';
    vals.hueTre.textContent   = (+ui.hueTre.value).toFixed(0) + '°';
    vals.life.textContent = (+ui.life.value).toFixed(0);
    vals.lifePct.textContent = (+ui.lifePct.value).toFixed(0) + '%';
    vals.lifeThr.textContent = (+ui.lifeThr.value).toFixed(2);
    vals.size.textContent = (+ui.size.value).toFixed(1);
    vals.sizei.textContent = (+ui.sizei.value).toFixed(1);
    vals.sizeSlope.textContent = (+ui.sizeSlope.value).toFixed(2);
    vals.jitter.textContent = (+ui.jitter.value).toFixed(3);
    vals.jitPct.textContent = (+ui.jitPct.value).toFixed(0) + '%';
    vals.jitThr.textContent = (+ui.jitThr.value).toFixed(2);
    vals.motion.textContent = ['0 statique','1 mix','2 dynamique'][+ui.motion.value] ?? ui.motion.value;
    vals.thr.textContent = (+ui.thr.value).toFixed(2);
    vals.speed.textContent = (+ui.speed.value).toFixed(2);
    vals.swirl.textContent = (+ui.swirl.value).toFixed(2);
    vals.bpmRot.textContent = (+ui.bpmRot.value).toFixed(1) + '%';
    vals.bpmThr.textContent = (+ui.bpmThr.value).toFixed(2);
    vals.flipBeats.textContent = (+ui.flipBeats.value).toFixed(0);
    vals.flipBlend.textContent = (+ui.flipBlend.value).toFixed(0) + '%';
    vals.springK.textContent = (+ui.springK.value).toFixed(1);
    vals.damp.textContent = (+ui.damp.value).toFixed(2);
    vals.eqBlend.textContent = (+ui.eqBlend.value).toFixed(2);
    vals.trail.textContent = (+ui.trail.value).toFixed(2);
    vals.smokeOpacity.textContent = (+ui.smokeOpacity.value).toFixed(0) + '%';
    vals.zoom.textContent = Math.round(sceneZoomFromRaw(ui.zoom.value) * 100) + '%';
    applySmokeOpacity();
  }
  Object.values(ui).forEach(el => {
    if (!el) return;
    const handle = () => {
      syncUI();
      saveSettings();
      if (el.id === 'cutLowMid' || el.id === 'cutMidHigh') rebuildDspGraph();
    };
    el.addEventListener('input', handle);
    el.addEventListener('change', handle);
  });
  useMicEl.addEventListener('change', () => {
    normalizeExclusiveAudioToggles('mic');
    saveSettings();
  });
  useSystemAudioEl?.addEventListener('change', () => {
    normalizeExclusiveAudioToggles('system');
    saveSettings();
  });
  bgFile?.addEventListener('change', () => {
    const file = bgFile.files && bgFile.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setBackgroundImage(url);
  });
  clearBgBtn?.addEventListener('click', () => setBackgroundImage(null));
  syncUI();

  function resize(){
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    pointsCanvas.width = Math.floor(w * dpr);
    pointsCanvas.height = Math.floor(h * dpr);
    pointsCanvas.style.width = w + 'px';
    pointsCanvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  new ResizeObserver(resize).observe(document.body);
  window.addEventListener('resize', resize);
  resize();

  fluidCanvas.style.position = 'fixed';
  pointsCanvas.style.position = 'fixed';

  // Audio
  const BAND_CENTERS = [0.14, 0.50, 0.86];
  let audioCtx = null, fileNode = null, micNode = null, micStream = null, screenNode = null, screenStream = null, objectUrl = null, bpm = 0;
  let outputGain = null, dspInput = null, dspNodes = null;
  const bandState = {
    bass: { env: 0, floor: 0, peak: 0.08, norm: 0, lastAt: 0 },
    mid:  { env: 0, floor: 0, peak: 0.08, norm: 0, lastAt: 0 },
    tre:  { env: 0, floor: 0, peak: 0.08, norm: 0, lastAt: 0 },
  };

  function safeDisconnect(node){ if (!node) return; try { node.disconnect(); } catch {} }
  function resetBandState(){
    const now = performance.now();
    for (const state of Object.values(bandState)) {
      state.env = 0;
      state.floor = 0;
      state.peak = 0.08;
      state.norm = 0;
      state.lastAt = now;
    }
  }
  function currentCrossovers(){
    const xo = enforceCrossoverOrder();
    return { lowMid: xo.lowMid, midHigh: xo.midHigh };
  }
  function buildLR4Filter(type, frequency){
    const a = audioCtx.createBiquadFilter();
    const b = audioCtx.createBiquadFilter();
    a.type = type;
    b.type = type;
    a.frequency.value = frequency;
    b.frequency.value = frequency;
    a.Q.value = Math.SQRT1_2;
    b.Q.value = Math.SQRT1_2;
    a.connect(b);
    return { input: a, output: b, filters: [a, b] };
  }
  function makeBandTap(label, sourceNode){
    const processor = audioCtx.createScriptProcessor(1024, 2, 1);
    const mute = audioCtx.createGain();
    mute.gain.value = 0;
    sourceNode.connect(processor);
    processor.connect(mute);
    mute.connect(audioCtx.destination);

    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer;
      const output = event.outputBuffer;
      const channels = Math.max(1, input.numberOfChannels);
      const len = input.length || 0;
      const state = bandState[label];
      const sr = Math.max(1, audioCtx.sampleRate || 48000);
      const attackCoeff = Math.exp(-1 / (sr * 0.008));
      const releaseCoeff = Math.exp(-1 / (sr * 0.140));
      let env = state.env;
      let sumSq = 0;
      let peakAbs = 0;

      for (let i = 0; i < len; i++) {
        let mono = 0;
        for (let ch = 0; ch < channels; ch++) mono += input.getChannelData(ch)[i] || 0;
        mono /= channels;
        const abs = Math.abs(mono);
        const coeff = abs > env ? attackCoeff : releaseCoeff;
        env = (coeff * env) + ((1 - coeff) * abs);
        sumSq += mono * mono;
        if (abs > peakAbs) peakAbs = abs;
      }

      const rms = len > 0 ? Math.sqrt(sumSq / len) : 0;
      const measured = Math.max(env, rms * 1.45, peakAbs * 0.70);
      state.env = measured;
      if (state.floor <= 1e-6) state.floor = measured;
      const floorRise = measured < state.floor ? 0.08 : 0.004;
      state.floor += (measured - state.floor) * floorRise;
      state.peak = Math.max(measured, state.peak * 0.9955);
      const usable = Math.max(0, measured - state.floor * 0.92);
      const dyn = Math.max(0.03, state.peak - state.floor * 0.55);
      state.norm = Math.max(0, Math.min(1, usable / dyn));
      state.lastAt = performance.now();

      for (let ch = 0; ch < output.numberOfChannels; ch++) output.getChannelData(ch).fill(0);
    };

    return { processor, mute };
  }
  function destroyDspGraph(){
    if (!dspNodes) return;
    for (const tap of dspNodes.taps) {
      if (tap?.processor) tap.processor.onaudioprocess = null;
    }
    for (const node of dspNodes.allNodes) safeDisconnect(node);
    safeDisconnect(dspInput);
    dspNodes = null;
  }
  function rebuildDspGraph(){
    if (!audioCtx || !dspInput) return;
    destroyDspGraph();
    const xo = currentCrossovers();

    const bassLP = buildLR4Filter('lowpass', xo.lowMid);
    const midHP = buildLR4Filter('highpass', xo.lowMid);
    const midLP = buildLR4Filter('lowpass', xo.midHigh);
    const treHP = buildLR4Filter('highpass', xo.midHigh);

    dspInput.connect(bassLP.input);
    dspInput.connect(midHP.input);
    dspInput.connect(treHP.input);
    midHP.output.connect(midLP.input);

    const bassTap = makeBandTap('bass', bassLP.output);
    const midTap = makeBandTap('mid', midLP.output);
    const treTap = makeBandTap('tre', treHP.output);

    dspNodes = {
      crossovers: xo,
      taps: [bassTap, midTap, treTap],
      allNodes: [
        bassLP.input, bassLP.output, midHP.input, midHP.output, midLP.input, midLP.output, treHP.input, treHP.output,
        bassTap.processor, bassTap.mute, midTap.processor, midTap.mute, treTap.processor, treTap.mute
      ]
    };
    resetBandState();
  }
  function ensureAudio(){
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    fileNode = audioCtx.createMediaElementSource(audio);
    outputGain = audioCtx.createGain();
    outputGain.gain.value = 1;
    outputGain.connect(audioCtx.destination);
    dspInput = audioCtx.createGain();
    dspInput.gain.value = 1;
    rebuildDspGraph();
  }
  function stopMic(){
    if (micNode) { safeDisconnect(micNode); micNode = null; }
    if (micStream) {
      try { micStream.getTracks().forEach(t => t.stop()); } catch {}
      micStream = null;
    }
  }
  function stopSystemAudio(){
    if (screenNode) { safeDisconnect(screenNode); screenNode = null; }
    if (screenStream) {
      try { screenStream.getTracks().forEach(t => t.stop()); } catch {}
      screenStream = null;
    }
  }
  function stopLiveInput(){
    stopMic();
    stopSystemAudio();
  }
  async function useFileMode(){
    ensureAudio();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    stopLiveInput();
    safeDisconnect(fileNode);
    fileNode.connect(outputGain);
    fileNode.connect(dspInput);
    const xo = currentCrossovers();
    statusEl.textContent = audio.src ? `DSP fichier actif · ${Math.round(xo.lowMid)} / ${Math.round(xo.midHigh)} Hz` : 'Prêt';
  }
  async function useMicMode(){
    ensureAudio();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    audio.pause();
    safeDisconnect(fileNode);
    stopLiveInput();
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      micNode = audioCtx.createMediaStreamSource(micStream);
      micNode.connect(dspInput);
      bpm = 0;
      const xo = currentCrossovers();
      statusEl.textContent = `Micro DSP actif · ${Math.round(xo.lowMid)} / ${Math.round(xo.midHigh)} Hz`;
    } catch (e) {
      useMicEl.checked = false;
      normalizeExclusiveAudioToggles();
      saveSettings();
      statusEl.textContent = 'Micro refusé / indisponible';
    }
  }
  async function useSystemAudioMode(){
    ensureAudio();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    audio.pause();
    safeDisconnect(fileNode);
    stopLiveInput();
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      const audioTracks = screenStream.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0) {
        stopSystemAudio();
        throw new Error('no-system-audio');
      }
      const audioOnlyStream = new MediaStream(audioTracks);
      screenNode = audioCtx.createMediaStreamSource(audioOnlyStream);
      screenNode.connect(dspInput);
      bpm = 0;

      const stopFromTrack = async () => {
        if (screenStream) stopSystemAudio();
        resetBandState();
        if (useSystemAudioEl) useSystemAudioEl.checked = false;
        normalizeExclusiveAudioToggles();
        saveSettings();
        await syncLiveInputMode();
        if (!useMicEl?.checked) {
          statusEl.textContent = audio.src ? 'Partage arrêté · retour fichier possible' : 'Partage d\'écran arrêté';
        }
      };
      for (const track of screenStream.getTracks()) track.addEventListener('ended', stopFromTrack, { once: true });

      const xo = currentCrossovers();
      statusEl.textContent = `Son de l'appareil DSP actif · ${Math.round(xo.lowMid)} / ${Math.round(xo.midHigh)} Hz`;
    } catch (e) {
      if (useSystemAudioEl) useSystemAudioEl.checked = false;
      normalizeExclusiveAudioToggles();
      saveSettings();
      await syncLiveInputMode();
      if (!useMicEl?.checked) {
        statusEl.textContent = e && e.message === 'no-system-audio'
          ? 'Partage lancé sans audio système'
          : 'Partage audio refusé / indisponible';
      }
    }
  }
  function readBands(){
    const now = performance.now();
    const rawBass = Math.max(0, Math.min(1, bandState.bass.norm));
    const rawMid = Math.max(0, Math.min(1, bandState.mid.norm));
    const rawTre = Math.max(0, Math.min(1, bandState.tre.norm));
    const fade = (lastAt) => Math.max(0, Math.min(1, 1 - Math.max(0, now - lastAt - 80) / 700));

    let b = rawBass * fade(bandState.bass.lastAt) * (+ui.sensBass.value);
    let m = rawMid  * fade(bandState.mid.lastAt)  * (+ui.sensMid.value);
    let t = rawTre  * fade(bandState.tre.lastAt)  * (+ui.sensTre.value);
    b = Math.max(0, Math.min(1.5, b));
    m = Math.max(0, Math.min(1.5, m));
    t = Math.max(0, Math.min(1.5, t));

    const total = Math.max(0, Math.min(1, Math.max(b, m, t)));
    if (total <= 1e-4) return { bassRaw: 0, midRaw: 0, treRaw: 0, bassIso: 0, midIso: 0, treIso: 0, total: 0, centroidNorm: 0.5 };

    const isoExp = Math.max(1, +ui.isolation.value || 2.4);
    const wb = Math.pow(Math.max(0, b), isoExp);
    const wm = Math.pow(Math.max(0, m), isoExp);
    const wt = Math.pow(Math.max(0, t), isoExp);
    const wsum = Math.max(1e-6, wb + wm + wt);

    const bassIso = total * (wb / wsum);
    const midIso = total * (wm / wsum);
    const treIso = total * (wt / wsum);
    const centroidNorm = ((wb * BAND_CENTERS[0]) + (wm * BAND_CENTERS[1]) + (wt * BAND_CENTERS[2])) / wsum;

    return {
      bassRaw: Math.max(0, Math.min(1, b)),
      midRaw: Math.max(0, Math.min(1, m)),
      treRaw: Math.max(0, Math.min(1, t)),
      bassIso: Math.max(0, Math.min(1, bassIso)),
      midIso: Math.max(0, Math.min(1, midIso)),
      treIso: Math.max(0, Math.min(1, treIso)),
      total,
      centroidNorm: Math.max(0, Math.min(1, centroidNorm)),
    };
  }

  async function estimateBPMFromFile(file){
    try {
      ensureAudio();
      const buf = await file.arrayBuffer();
      const ab = await audioCtx.decodeAudioData(buf.slice(0));
      const sr = ab.sampleRate;
      const ch0 = ab.getChannelData(0);
      const ch1 = ab.numberOfChannels > 1 ? ab.getChannelData(1) : null;
      const maxSec = 75;
      const maxLen = Math.min(ab.length, Math.floor(sr * maxSec));
      const targetSr = 8000;
      const ratio = sr / targetSr;
      const outLen = Math.floor(maxLen / ratio);
      const mono = new Float32Array(outLen);
      for (let i = 0; i < outLen; i++) {
        const idx = Math.floor(i * ratio);
        let s = ch0[idx] || 0;
        if (ch1) s = 0.5 * (s + (ch1[idx] || 0));
        mono[i] = s;
      }
      const win = 1024, hop = 512;
      const fps = targetSr / hop;
      const frames = Math.max(1, Math.floor((outLen - win) / hop));
      const env = new Float32Array(frames);
      for (let f = 0; f < frames; f++) {
        const base = f * hop;
        let sum = 0;
        for (let i = 0; i < win; i++) { const x = mono[base + i] || 0; sum += x * x; }
        env[f] = sum / win;
      }
      const onset = new Float32Array(frames);
      for (let i = 1; i < frames; i++) { const d = env[i] - env[i - 1]; onset[i] = d > 0 ? d : 0; }
      let maxv = 0;
      for (let i = 0; i < frames; i++) if (onset[i] > maxv) maxv = onset[i];
      if (maxv <= 1e-9) return 0;
      for (let i = 0; i < frames; i++) onset[i] /= maxv;
      let bestBpm = 0, bestScore = -1;
      for (let cand = 60; cand <= 180; cand++) {
        const lag = Math.round((60 / cand) * fps);
        if (lag < 2 || lag >= frames) continue;
        let s = 0;
        for (let i = lag; i < frames; i++) s += onset[i] * onset[i - lag];
        s *= (1 - 0.002 * (cand - 60));
        if (s > bestScore) { bestScore = s; bestBpm = cand; }
      }
      return bestBpm || 0;
    } catch { return 0; }
  }

  audioFile.addEventListener('change', async () => {
    const f = audioFile.files && audioFile.files[0];
    if (!f) return;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(f);
    audio.src = objectUrl;
    audio.load();
    useMicEl.checked = false;
    if (useSystemAudioEl) useSystemAudioEl.checked = false;
    normalizeExclusiveAudioToggles();
    await useFileMode();
    statusEl.textContent = `Chargé: ${f.name} · analyse BPM…`;
    bpm = await estimateBPMFromFile(f);
    statusEl.textContent = `Chargé: ${f.name}${bpm ? ` · BPM ~${bpm}` : ''}`;
    saveSettings();
  });
  audio.addEventListener('play', async () => {
    if (useMicEl.checked) return;
    await useFileMode();
    statusEl.textContent = 'Lecture audio';
  });
  async function syncLiveInputMode(){
    const wantsMic = !!useMicEl?.checked;
    const wantsSystemAudio = !!useSystemAudioEl?.checked;

    if (wantsSystemAudio) {
      await useSystemAudioMode();
      return;
    }
    if (wantsMic) {
      await useMicMode();
      return;
    }

    stopLiveInput();
    resetBandState();
    if (audio.src) await useFileMode();
    else statusEl.textContent = 'Prêt';
  }

  useMicEl.addEventListener('change', async () => {
    normalizeExclusiveAudioToggles('mic');
    await syncLiveInputMode();
  });
  useSystemAudioEl?.addEventListener('change', async () => {
    normalizeExclusiveAudioToggles('system');
    await syncLiveInputMode();
  });

  function pickBand(b, m, t){
    const wb = Math.pow(Math.max(0, b), 3.2);
    const wm = Math.pow(Math.max(0, m), 3.2);
    const wt = Math.pow(Math.max(0, t), 3.2);
    const sum = wb + wm + wt;
    if (sum <= 1e-9) return 1;
    const maxW = Math.max(wb, wm, wt);
    const rest = sum - maxW;
    if (rest <= 1e-9 || maxW > rest * 1.4) {
      if (maxW === wb) return 0;
      if (maxW === wm) return 1;
      return 2;
    }
    const r = Math.random() * sum;
    if (r < wb) return 0;
    if (r < wb + wm) return 1;
    return 2;
  }
  function bandColor(band){
    if (band === 0) return [255, 0, 0];
    if (band === 1) return [0, 255, 0];
    return [0, 0, 255];
  }
  function rgbToHsl(r,g,b){
    r/=255; g/=255; b/=255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min){
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max){
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h,s,l];
  }
  function hslToRgb(h,s,l){
    let r,g,b;
    if (s === 0){ r=g=b=l; }
    else {
      const hue2rgb = (p,q,t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q-p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q-p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p,q,h + 1/3);
      g = hue2rgb(p,q,h);
      b = hue2rgb(p,q,h - 1/3);
    }
    return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
  }
  function hueShiftRgb(rgb, deg){
    const [h,s,l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    let hh = (h + deg / 360) % 1;
    if (hh < 0) hh += 1;
    return hslToRgb(hh, s, l);
  }
  function colorForBand(band){
    let rgb = bandColor(band);
    const hueDeg = band === 0 ? (+ui.hueBass.value) : band === 1 ? (+ui.hueMid.value) : (+ui.hueTre.value);
    if (hueDeg !== 0) rgb = hueShiftRgb(rgb, hueDeg);
    return rgb;
  }
  function bpmFlipSign(nowSec){
    const fb = +ui.flipBeats.value;
    if (!bpm || fb <= 0) return 1;
    const beat = nowSec * (bpm / 60);
    const seg = Math.floor(beat / fb);
    return (seg % 2 === 0) ? 1 : -1;
  }
  function clamp01(x){ return Math.max(0, Math.min(1, x)); }
  function lerp(a,b,t){ return a + (b - a) * t; }
  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function sceneZoomFromRaw(raw){
    const v = Number(raw);
    if (!Number.isFinite(v)) return 1;
    // Compatibilité avec l'ancien slider stocké en localStorage (-30..400, 0 = neutre)
    if (v < 25 || v > 300) return clamp(Math.exp(v / 120), 0.45, 2.2);
    // Nouveau slider : pourcentage direct, 100 = neutre
    return clamp(v / 100, 0.25, 3.0);
  }
  function sceneZoom(){ return sceneZoomFromRaw(ui.zoom?.value); }
  function scenePosFromPolar(cx, cy, theta, rNorm, minDim){
    const rPx = rNorm * minDim * 0.42 * sceneZoom();
    return { x: cx + Math.cos(theta) * rPx, y: cy + Math.sin(theta) * rPx };
  }
  function effectiveEmitterSize(baseSize){ return Math.max(1.5, baseSize); }

  const emitters = [];
  let spawnAcc = 0;
  let lastT = performance.now();
  let centroidSm = 0.5;
  let splatCount = 0;

  function fluidBridge(){
    return window.fluidAudioBridge || null;
  }

  function injectSmoke(x, y, prevX, prevY, rgb, sizePx, intensity){
    const bridge = fluidBridge();
    if (!bridge || typeof bridge.splat !== 'function') return false;

    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    const tx = clamp01(x / w);
    const ty = clamp01(1 - y / h);
    const dx = ((x - prevX) / w) * bridge.config.SPLAT_FORCE * 0.9;
    const dy = (-(y - prevY) / h) * bridge.config.SPLAT_FORCE * 0.9;

    const color = {
      r: (rgb[0] / 255) * (0.7 + intensity * 0.9),
      g: (rgb[1] / 255) * (0.7 + intensity * 0.9),
      b: (rgb[2] / 255) * (0.7 + intensity * 0.9),
    };

    const minDim = Math.max(1, Math.min(w, h));
    const radius = Math.max(0.02, Math.min(0.42, (sizePx / minDim) * 2.4));
    bridge.splat(tx, ty, dx, dy, color, radius);
    splatCount++;
    return true;
  }

  function addEmitter(intensity, colorBand, geomBand, bassNorm, globalMeanR, nowSec, bandSnapshot){
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const minDim = Math.min(w, h);

    const cb = +ui.centerBias.value;
    const exp = lerp(1.0, 6.0, cb);
    const rCenter = Math.pow(Math.random(), exp);
    const baseR = geomBand === 0 ? 0.18 : (geomBand === 1 ? 0.48 : 0.78);
    const rBand = clamp01(baseR + (Math.random() - 0.5) * 0.25 + intensity * 0.05);
    const rNorm = (Math.random() < (+ui.centerPin.value) / 100) ? 0 : lerp(rCenter, rBand, +ui.bandRadius.value);
    const theta = Math.random() * Math.PI * 2;

    const bandBassness = colorBand === 0 ? 1.0 : (colorBand === 1 ? 0.52 : 0.08);
    const centroidBassness = 1 - (bandSnapshot?.centroidNorm ?? 0.5);
    const bassness = clamp01(0.68 * bandBassness + 0.32 * centroidBassness);

    const baseSize = +ui.size.value;
    const sizeI = +ui.sizei.value;
    const slope = +ui.sizeSlope.value;
    const minScale = Math.max(0.15, 1 - 0.45 * slope);
    const maxScale = 1 + 0.60 * slope;
    const freqScale = lerp(minScale, maxScale, bassness);
    const sizeBase = Math.max(1.5, (baseSize * freqScale) + intensity * sizeI);

    const baseLife = +ui.life.value;
    const lifePct = (+ui.lifePct.value) / 100;
    const lifeThr = +ui.lifeThr.value;
    const lifeT = intensity <= lifeThr ? 0 : (intensity - lifeThr) / Math.max(1e-6, (1 - lifeThr));
    const lifeMult = 1 + lifePct * (1.6 * Math.pow(lifeT, 0.9));
    const lifeMs = Math.max(60, baseLife * lifeMult);

    const mode = +ui.motion.value;
    const thr = +ui.thr.value;
    const staticFactor = intensity < thr ? 0.0 : 1.0;
    const modeScale = mode === 0 ? 0 : (mode === 1 ? 0.55 : 1.0);

    const manualSwirl = +ui.swirl.value;
    const bpmRotPct = (+ui.bpmRot.value) / 100;
    const bpmThr = +ui.bpmThr.value;
    const bpmT = intensity <= bpmThr ? 0 : (intensity - bpmThr) / Math.max(1e-6, (1 - bpmThr));
    const flip = bpmFlipSign(nowSec);
    const flipBlend = (+ui.flipBlend.value) / 100;
    const signedFlip = lerp(1, flip, flipBlend);
    const bpmSwirl = (bpm > 0 ? (2 * Math.PI) * (bpm / 60) * bpmRotPct : 0) * bpmT * signedFlip;

    const speed = +ui.speed.value;
    const dr = speed * modeScale * (0.35 + Math.random() * 0.65) * staticFactor;
    const dtheta = (manualSwirl + bpmSwirl) * modeScale * (0.6 + Math.random() * 0.8) * (0.35 + intensity) * staticFactor;

    const freqEq = BAND_CENTERS[colorBand] ?? 0.5;
    const rEq = lerp(freqEq, globalMeanR, +ui.eqBlend.value);

    const pos0 = scenePosFromPolar(cx, cy, theta, rNorm, minDim);
    const x = pos0.x;
    const y = pos0.y;

    const emitter = {
      x, y, prevX: x, prevY: y, theta,
      rNorm, vr: 0, dr, dtheta, rEq, freqEq,
      life: lifeMs, maxLife: lifeMs, sizeBase,
      rgb: colorForBand(colorBand), alpha: 0.22 + intensity * 0.75,
      spawnIntensity: intensity,
      smokeAge: 0,
      nextSplatAt: 0,
    };
    emitters.push(emitter);

    const eSize = effectiveEmitterSize(emitter.sizeBase);
    injectSmoke(emitter.x, emitter.y, emitter.x - Math.cos(theta) * eSize * 0.7, emitter.y - Math.sin(theta) * eSize * 0.7, emitter.rgb, eSize * 1.25, intensity);
    injectSmoke(emitter.x, emitter.y, emitter.x, emitter.y, emitter.rgb, eSize, intensity * 0.85);

    const maxPoints = +ui.maxPoints.value;
    if (emitters.length > maxPoints) emitters.splice(0, emitters.length - maxPoints);
  }

  function frame(t){
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    splatCount = 0;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const minDim = Math.min(w, h);

    // canvas debug seulement
    ctx.clearRect(0, 0, w, h);

    const activeMic = !!micStream && !!useMicEl?.checked && !useSystemAudioEl?.checked;
    const activeSystemAudio = !!screenStream && !!screenNode && !!useSystemAudioEl?.checked;
    const activeFile = !activeMic && !activeSystemAudio && !!audioCtx && !!audio.src && !audio.paused && !audio.ended;
    const canAnalyse = !!audioCtx && !!dspNodes && (activeMic || activeSystemAudio || activeFile);
    const nowSec = (activeMic || activeSystemAudio) ? performance.now() / 1000 : (audio.currentTime || 0);

    let bass = 0, mid = 0, tre = 0;
    let bassNorm = 0;
    let globalMeanR = 0.55;

    if (canAnalyse) {
      const bands = readBands();
      bass = bands.bassIso;
      mid = bands.midIso;
      tre = bands.treIso;

      const peak = Math.max(bass, mid, tre);
      const intensity = clamp01(Math.pow(clamp01(peak), 1.05) * (+ui.gain.value));

      bassNorm = bands.bassRaw;
      centroidSm += (bands.centroidNorm - centroidSm) * (1 - Math.exp(-dt / 0.35));
      globalMeanR = 0.12 + 0.88 * centroidSm;

      spawnAcc += intensity * (+ui.spawn.value) * dt;
      const n = Math.floor(spawnAcc);
      spawnAcc -= n;
      const geomBand = +ui.band.value;

      for (let i = 0; i < n; i++) {
        const colorBand = pickBand(bass, mid, tre);
        addEmitter(intensity, colorBand, geomBand, bassNorm, globalMeanR, nowSec, bands);
      }
    }

    const jitBase = +ui.jitter.value;
    const jitPct = (+ui.jitPct.value) / 100;
    const jitThr = +ui.jitThr.value;
    const jt = bassNorm <= jitThr ? 0 : (bassNorm - jitThr) / Math.max(1e-6, 1 - jitThr);
    const jitter = jitBase * (1 + jitPct * Math.pow(jt, 0.9)) * minDim;

    const springK = +ui.springK.value;
    const damp = +ui.damp.value;

    // cap global pour éviter d’inonder le GPU en splats
    const maxFrameSplats = 140;

      for (let i = emitters.length - 1; i >= 0; i--) {
        const p = emitters[i];
        p.life -= dt * 1000;
        p.smokeAge += dt;
        if (p.life <= 0) { emitters.splice(i, 1); continue; }

        p.prevX = p.x; p.prevY = p.y;
        p.theta += p.dtheta * dt;
        p.rEq = clamp01(p.rEq + p.dr * dt * 0.10);
        const targetEq = lerp(p.freqEq, globalMeanR, +ui.eqBlend.value);
        p.rEq += (targetEq - p.rEq) * (1 - Math.exp(-dt * 2.2));

        const aSpring = (-springK * (p.rNorm - p.rEq)) - (damp * p.vr);
        p.vr += aSpring * dt;
        p.rNorm += p.vr * dt;
        if (p.rNorm < 0) { p.rNorm = 0; p.vr *= -0.35; }
        if (p.rNorm > 1.08) { p.rNorm = 1.08; p.vr *= -0.25; }

        const pos = scenePosFromPolar(cx, cy, p.theta, p.rNorm, minDim);
        p.x = pos.x;
        p.y = pos.y;

        if (p.smokeAge <= 0.22 && splatCount < maxFrameSplats) {
          const step = p.smokeAge < 0.07 ? 0.018 : (p.smokeAge < 0.14 ? 0.028 : 0.042);
          if (p.smokeAge >= p.nextSplatAt) {
            const x = p.x + (Math.random() - 0.5) * jitter * 0.18;
            const y = p.y + (Math.random() - 0.5) * jitter * 0.18;
            injectSmoke(x, y, p.prevX, p.prevY, p.rgb, effectiveEmitterSize(p.sizeBase) * 1.15, p.spawnIntensity);
            p.nextSplatAt = p.smokeAge + step;
          }
        }
      }


    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
