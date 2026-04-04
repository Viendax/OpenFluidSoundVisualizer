
(() => {
  const LS_KEY = 'restart_step2_smoke_v1';

  const fluidCanvas = document.getElementById('fluidCanvas');
  const pointsCanvas = document.getElementById('pointsCanvas');
  const ctx = pointsCanvas.getContext('2d', { alpha: true });

  const audio = document.getElementById('audio');
  const audioFile = document.getElementById('audioFile');
  const bgFile = document.getElementById('bgFile');
  const clearBgBtn = document.getElementById('clearBg');
  const useMicEl = document.getElementById('useMic');
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
    sensBass: $('sensBass'), sensMid: $('sensMid'), sensTre: $('sensTre'), hueBass: $('hueBass'), hueMid: $('hueMid'), hueTre: $('hueTre'),
    life: $('life'), lifePct: $('lifePct'), lifeThr: $('lifeThr'), size: $('size'), sizei: $('sizei'), sizeSlope: $('sizeSlope'), jitter: $('jitter'), jitPct: $('jitPct'), jitThr: $('jitThr'),
    motion: $('motion'), thr: $('thr'), speed: $('speed'), swirl: $('swirl'), bpmRot: $('bpmRot'), bpmThr: $('bpmThr'), flipBeats: $('flipBeats'), flipBlend: $('flipBlend'),
    springK: $('springK'), damp: $('damp'), eqBlend: $('eqBlend'), trail: $('trail'), smokeOpacity: $('smokeOpacity'), zoom: $('zoom'),
  };
  const vals = {
    gain: $('v_gain'), spawn: $('v_spawn'), maxPoints: $('v_maxPoints'), centerBias: $('v_centerBias'), centerPin: $('v_centerPin'), bandRadius: $('v_bandRadius'), band: $('v_band'),
    sensBass: $('v_sensBass'), sensMid: $('v_sensMid'), sensTre: $('v_sensTre'), hueBass: $('v_hueBass'), hueMid: $('v_hueMid'), hueTre: $('v_hueTre'),
    life: $('v_life'), lifePct: $('v_lifePct'), lifeThr: $('v_lifeThr'), size: $('v_size'), sizei: $('v_sizei'), sizeSlope: $('v_sizeSlope'), jitter: $('v_jitter'), jitPct: $('v_jitPct'), jitThr: $('v_jitThr'),
    motion: $('v_motion'), thr: $('v_thr'), speed: $('v_speed'), swirl: $('v_swirl'), bpmRot: $('v_bpmRot'), bpmThr: $('v_bpmThr'), flipBeats: $('v_flipBeats'), flipBlend: $('v_flipBlend'),
    springK: $('v_springK'), damp: $('v_damp'), eqBlend: $('v_eqBlend'), trail: $('v_trail'), smokeOpacity: $('v_smokeOpacity'), zoom: $('v_zoom'),
  };

  function safeParseJSON(s){ try { return JSON.parse(s); } catch { return null; } }
  function loadSettings(){
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const obj = safeParseJSON(raw);
    if (!obj || typeof obj !== 'object') return;
    for (const [id, val] of Object.entries(obj)) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.type === 'checkbox') el.checked = !!val;
      else el.value = String(val);
    }
  }
  function saveSettings(){
    const ids = ['useMic','showPoints','gain','spawn','maxPoints','centerBias','centerPin','bandRadius','band','sensBass','sensMid','sensTre','hueBass','hueMid','hueTre','life','lifePct','lifeThr','size','sizei','sizeSlope','jitter','jitPct','jitThr','motion','thr','speed','swirl','bpmRot','bpmThr','flipBeats','flipBlend','springK','damp','eqBlend','trail','smokeOpacity','zoom'];
    const out = {};
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      out[id] = el.type === 'checkbox' ? !!el.checked : el.value;
    }
    localStorage.setItem(LS_KEY, JSON.stringify(out));
  }

  loadSettings();
  if (+ui.sensTre.value === 0) ui.sensTre.value = '1.35';

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

  function syncUI(){
    vals.gain.textContent = (+ui.gain.value).toFixed(2);
    vals.spawn.textContent = (+ui.spawn.value).toFixed(0);
    vals.maxPoints.textContent = (+ui.maxPoints.value).toFixed(0);
    vals.centerBias.textContent = (+ui.centerBias.value).toFixed(2);
    vals.centerPin.textContent = (+ui.centerPin.value).toFixed(0) + '%';
    vals.bandRadius.textContent = (+ui.bandRadius.value).toFixed(2);
    vals.band.textContent = ['bass','mid','aigu'][+ui.band.value] ?? ui.band.value;
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
    vals.zoom.textContent = (+ui.zoom.value).toFixed(0) + '%';
    applySmokeOpacity();
  }
  Object.values(ui).forEach(el => {
    if (!el) return;
    el.addEventListener('input', () => { syncUI(); saveSettings(); });
    el.addEventListener('change', () => { syncUI(); saveSettings(); });
  });
  useMicEl.addEventListener('change', saveSettings);
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
  let audioCtx = null, analyser = null, freqData = null, fileNode = null, micNode = null, micStream = null, objectUrl = null, bpm = 0;

  function ensureAudio(){
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.78;
    freqData = new Uint8Array(analyser.frequencyBinCount);
    fileNode = audioCtx.createMediaElementSource(audio);
  }
  function safeDisconnect(node){ if (!node) return; try { node.disconnect(); } catch {} }
  async function useFileMode(){
    ensureAudio();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    if (micNode){ safeDisconnect(micNode); micNode = null; }
    if (micStream){ try { micStream.getTracks().forEach(t => t.stop()); } catch {} micStream = null; }
    safeDisconnect(fileNode);
    safeDisconnect(analyser);
    fileNode.connect(analyser);
    analyser.connect(audioCtx.destination);
  }
  async function useMicMode(){
    ensureAudio();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    audio.pause();
    safeDisconnect(fileNode);
    safeDisconnect(analyser);
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      micNode = audioCtx.createMediaStreamSource(micStream);
      safeDisconnect(micNode);
      micNode.connect(analyser);
      bpm = 0;
      statusEl.textContent = 'Micro actif';
    } catch (e) {
      useMicEl.checked = false;
      saveSettings();
      statusEl.textContent = 'Micro refusé / indisponible';
    }
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
  useMicEl.addEventListener('change', async () => {
    if (useMicEl.checked) await useMicMode();
    else { if (audio.src) await useFileMode(); else statusEl.textContent = 'Prêt'; }
  });

  function bandEnergy(a, b){
    const n = freqData.length;
    const i0 = Math.max(0, Math.floor(a * n));
    const i1 = Math.min(n, Math.floor(b * n));
    if (i1 <= i0) return 0;
    let s = 0;
    for (let i = i0; i < i1; i++) s += freqData[i];
    return s / (i1 - i0);
  }
  function bandPeakish(a, b, p = 3.0){
    const n = freqData.length;
    const i0 = Math.max(0, Math.floor(a * n));
    const i1 = Math.min(n, Math.floor(b * n));
    if (i1 <= i0) return 0;
    let s = 0;
    for (let i = i0; i < i1; i++) s += Math.pow(freqData[i], p);
    return Math.pow(s / (i1 - i0), 1 / p);
  }
  function spectralCentroidNorm(){
    let num = 0, den = 0;
    const n = freqData.length;
    const step = 4;
    for (let i = 0; i < n; i += step) {
      const v = freqData[i] / 255;
      den += v;
      num += v * i;
    }
    if (den <= 1e-6) return 0.5;
    return (num / den) / Math.max(1, n - 1);
  }
  function pickBand(b, m, t){
    const wb = Math.pow(Math.max(0, (b / 255) * (+ui.sensBass.value)), 3.2);
    const wm = Math.pow(Math.max(0, (m / 255) * (+ui.sensMid.value)), 3.2);
    const wt = Math.pow(Math.max(0, (t / 255) * (+ui.sensTre.value)), 3.2);
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
  function sceneZoom(){ return Math.max(0.45, Math.min(2.2, Math.exp((+ui.zoom.value || 0) / 120))); }
  function scenePosFromPolar(cx, cy, theta, rNorm, minDim){
    const rPx = rNorm * minDim * 0.42 * sceneZoom();
    return { x: cx + Math.cos(theta) * rPx, y: cy + Math.sin(theta) * rPx };
  }
  function effectiveEmitterSize(baseSize){ return Math.max(1.5, baseSize); }
  function pickBinIndexWeighted(data, aFrac, bFrac){
    const n = data.length;
    const ia = Math.max(0, Math.floor(aFrac * n));
    const ib = Math.min(n, Math.floor(bFrac * n));
    const span = Math.max(1, ib - ia);
    for (let k = 0; k < 12; k++) {
      const idx = ia + (Math.random() * span) | 0;
      const w = data[idx] / 255;
      if (Math.random() < w) return idx;
    }
    return ia + (Math.random() * span) | 0;
  }
  function focusRange(focus){
    if (focus === 0) return [0.00, 0.10];
    if (focus === 1) return [0.10, 0.40];
    return [0.40, 1.00];
  }

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

  function addEmitter(intensity, colorBand, geomBand, bassNorm, globalMeanR, nowSec){
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

    const [aFrac, bFrac] = focusRange(colorBand);
    const idx = pickBinIndexWeighted(freqData, aFrac, bFrac);
    const normF = idx / Math.max(1, freqData.length - 1);
    const bassness = 1 - normF;

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

    const freqEq = 0.10 + 0.90 * normF;
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

    // démarrage immédiat: 2 splats pour lancer la fumée au top musique
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

    const activeMic = !!micStream && useMicEl.checked;
    const activeFile = !activeMic && analyser && !audio.paused && !audio.ended;
    const canAnalyse = analyser && (activeMic || activeFile);
    const nowSec = activeMic ? performance.now() / 1000 : (audio.currentTime || 0);

    let bass = 0, mid = 0, tre = 0;
    let bassNorm = 0;
    let globalMeanR = 0.55;

    if (canAnalyse) {
      analyser.getByteFrequencyData(freqData);
      bass = bandEnergy(0.00, 0.10);
      mid  = bandEnergy(0.10, 0.40);
      tre  = bandPeakish(0.40, 1.00, 3.2);

      const bN = (bass / 255) * (+ui.sensBass.value);
      const mN = (mid  / 255) * (+ui.sensMid.value);
      const tN = (tre  / 255) * (+ui.sensTre.value);
      const peak = Math.max(bN, mN, tN);
      const intensity = clamp01(Math.pow(clamp01(peak), 1.05) * (+ui.gain.value));

      bassNorm = clamp01(bass / 255);
      const c = spectralCentroidNorm();
      centroidSm += (c - centroidSm) * (1 - Math.exp(-dt / 0.35));
      globalMeanR = 0.12 + 0.88 * centroidSm;

      spawnAcc += intensity * (+ui.spawn.value) * dt;
      const n = Math.floor(spawnAcc);
      spawnAcc -= n;
      const geomBand = +ui.band.value;

      for (let i = 0; i < n; i++) {
        const colorBand = pickBand(bass, mid, tre);
        addEmitter(intensity, colorBand, geomBand, bassNorm, globalMeanR, nowSec);
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
