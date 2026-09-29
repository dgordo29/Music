/* =========================================================
   Suno Studio — a single-page client for the Suno API
   (https://docs.sunoapi.org). Bring your own API key.
   ========================================================= */
(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const fmtTime = (s) => {
    if (!isFinite(s) || s < 0) return '0:00';
    s = Math.round(s);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  const timeAgo = (t) => {
    const s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const LS = {
    get(k, d) { try { const v = localStorage.getItem('ss.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('ss.' + k, JSON.stringify(v)); } catch { /* quota or disabled */ } },
    del(k) { try { localStorage.removeItem('ss.' + k); } catch { } },
  };

  const ICONS = {
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    sparkles: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    wave: '<path d="M2 12h2l3-7 4 14 4-10 3 6h4"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M17.9 17.9A10.1 10.1 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.1-5.9M9.9 4.2A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2M1 1l22 22"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    prev: '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>',
    next: '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.2"/><circle cx="16" cy="16" r="1.2"/><circle cx="16" cy="8" r="1.2"/><circle cx="8" cy="16" r="1.2"/><circle cx="12" cy="12" r="1.2"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v3"/>',
    split: '<path d="M16 3h5v5M8 3H3v5M21 3l-7 7M3 3l7 7M12 22v-8"/>',
    video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M22 8l-6 4 6 4z"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    alert: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    extend: '<path d="M3 12h14M13 6l6 6-6 6M21 4v16"/>',
    replace: '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    chevron: '<polyline points="6 9 12 15 18 9"/>',
    karaoke: '<path d="M4 6h16M4 12h10M4 18h7"/><circle cx="18" cy="17" r="3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    piano: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M8 4v10M16 4v10M12 14v6M6 14h4M14 14h4"/>',
  };
  const icon = (n, extra = '') => `<svg class="i ${extra}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

  // ---------------------------------------------------------------------------
  // Domain constants (from docs.sunoapi.org)
  // ---------------------------------------------------------------------------
  const MODELS = [
    { id: 'V6', name: 'V6', desc: 'Most natural vocals and richer detail. The recommended default.', tag: 'Best' },
    { id: 'V6_WILD', name: 'V6 Wild', desc: 'Pushes creative boundaries for bolder, more distinctive results.', tag: 'Bold' },
    { id: 'V6_MINI', name: 'V6 Mini', desc: 'Lightweight and fast — balances quality and speed.', tag: 'Fast' },
    { id: 'V5_5', name: 'V5.5', desc: 'Custom-model era release.', legacy: true },
    { id: 'V5', name: 'V5', desc: 'Superior expression, faster generation.', legacy: true },
    { id: 'V4_5PLUS', name: 'V4.5+', desc: 'Richer sound, up to 8 min.', legacy: true },
    { id: 'V4_5ALL', name: 'V4.5 All', desc: 'Better song structure, up to 8 min.', legacy: true },
    { id: 'V4_5', name: 'V4.5', desc: 'Smarter prompts, up to 8 min.', legacy: true },
    { id: 'V4', name: 'V4', desc: 'Improved vocals, up to 4 min.', legacy: true },
  ];
  const modelName = (id) => (MODELS.find((m) => m.id === id) || { name: id || '—' }).name;
  const DURATION_MODELS = ['V5_5', 'V6', 'V6_MINI', 'V6_WILD'];
  const PERSONA_MODEL_MODELS = ['V5', 'V5_5', 'V6', 'V6_MINI', 'V6_WILD'];
  const limits = (model) => ({
    style: model === 'V4' ? 200 : 1000,
    lyrics: model === 'V4' ? 3000 : 5000,
    prompt: 3000,
    title: 80,
  });

  const STEM_NAMES = ['Lead Vocal', 'Backing Vocals', 'Drum Kit', 'Kick', 'Snare', 'Hi-Hat', 'Cymbals', 'Percussion', 'Bass', 'Bass Guitar', 'Synth Bass', '808', 'Piano', 'Electric Piano', 'Rhodes', 'Keyboards', 'Organ', 'Synth', 'Synth Pad', 'Synth Lead', 'Synth Keys', 'Synth Strings', 'Guitar', 'Acoustic Guitar', 'Electric Guitar', 'Lead Electric Guitar', 'Rhythm Electric Guitar', 'Distorted Electric Guitar', 'String Section', 'Violin', 'Viola', 'Cello', 'Double Bass', 'Brass Section', 'Trumpet', 'Trombone', 'French Horn', 'Saxophone', 'Woodwinds', 'Flute', 'Clarinet', 'Choir', 'Harp', 'Bells', 'Sound Effects', 'Risers', 'Orchestra'];
  const SOUND_KEYS = ['Any', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'];

  const CHIPS = {
    Genre: ['Pop', 'Hip-hop', 'Lo-fi', 'Synthwave', 'Indie folk', 'R&B', 'Afrobeats', 'House', 'Drum & bass', 'Jazz', 'Country', 'Rock', 'Metal', 'Reggaeton', 'K-pop', 'Cinematic', 'Ambient', 'Gospel'],
    Mood: ['Uplifting', 'Melancholic', 'Dreamy', 'Energetic', 'Dark', 'Romantic', 'Chill', 'Epic', 'Playful', 'Nostalgic'],
    Sound: ['Piano', 'Acoustic guitar', '808s', 'Strings', 'Saxophone', 'Analog synths', 'Female vocals', 'Male vocals', 'Choir', 'Whispered vocals', 'Duet'],
  };

  const IDEAS = [
    'A sun-soaked summer anthem about driving to the coast with your best friends, windows down',
    'A lo-fi hip-hop beat for late-night studying, rain on the window, warm vinyl crackle',
    'An epic orchestral trailer piece for a dragon rising over a frozen mountain',
    'A heartbreak country ballad about the last dance at a small-town fair',
    'An 80s synthwave track about racing neon streets in a city that never sleeps',
    'A jazzy bossa nova love song sung in a smoky Paris café',
    'A high-energy K-pop chorus about finally believing in yourself',
    'A cozy acoustic folk song about a cat who rules the house',
    'A dark trap banger about grinding in silence until the win comes',
    'A gospel-inspired choir anthem celebrating a hometown hero',
    'A dreamy bedroom-pop song about falling in love over text messages',
    'An Afrobeats party track about dancing until sunrise on the rooftop',
    'A sea shanty about pirates who only steal snacks',
    'A punk rock anthem about hating Monday mornings',
  ];
  const LYRIC_IDEAS = ['A love letter to the city at 3 AM', 'Rising from rock bottom to the top', 'Summer road trip with best friends', 'A breakup that finally feels like freedom', 'A lullaby for a restless robot', 'Grandma\'s kitchen on a Sunday'];
  const SOUND_IDEAS = ['Punchy lo-fi drum loop with vinyl crackle', 'Rain on a tin roof with distant thunder', 'Retro arcade power-up jingle', 'Deep cinematic braam hit', 'Warm analog synth pad swelling slowly', 'Crowd cheering in a stadium'];

  const STRUCTURE_TAGS = ['[Intro]', '[Verse]', '[Pre-Chorus]', '[Chorus]', '[Bridge]', '[Drop]', '[Outro]'];

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const DEFAULT_FORM = {
    mode: 'simple', prompt: '', instrumental: false, simpleStyle: '',
    title: '', style: '', lyrics: '', negativeTags: '', vocalGender: '',
    styleWeight: null, weirdnessConstraint: null, audioWeight: null, variety: '1',
    duration: 120, personaId: '', personaModel: 'style_persona',
    refImages: [], refAudio: '', refVideo: '',
  };

  const state = {
    key: null,
    credits: null,
    view: LS.get('view', 'create'),
    settings: Object.assign({ model: 'V6', showLegacy: false }, LS.get('settings', {})),
    form: Object.assign({}, DEFAULT_FORM, LS.get('form', {})),
    tracks: LS.get('tracks', []),
    tasks: LS.get('tasks', []),
    personas: LS.get('personas', []),
    lyrics: LS.get('lyrics', []),
    lyricPrompt: '',
    remix: { op: 'cover', src: null, src2: null, uploading: false },
    lib: { q: '', filter: 'all', sort: 'new' },
    playingId: null,
    mem: { words: {}, midi: {} },
  };
  const save = {
    settings: () => LS.set('settings', state.settings),
    form: () => LS.set('form', state.form),
    tracks: () => LS.set('tracks', state.tracks),
    tasks: () => LS.set('tasks', state.tasks.slice(0, 60)),
    personas: () => LS.set('personas', state.personas),
    lyrics: () => LS.set('lyrics', state.lyrics.slice(0, 40)),
  };

  // API key storage: localStorage when "remember" is on, otherwise sessionStorage.
  const KeyStore = {
    load() {
      try { return localStorage.getItem('ss.apiKey') || sessionStorage.getItem('ss.apiKey'); } catch { return null; }
    },
    save(k, remember) {
      try {
        this.clear();
        (remember ? localStorage : sessionStorage).setItem('ss.apiKey', k);
      } catch { }
    },
    clear() { try { localStorage.removeItem('ss.apiKey'); sessionStorage.removeItem('ss.apiKey'); } catch { } },
  };

  // ---------------------------------------------------------------------------
  // Theme: light / dark / system
  // ---------------------------------------------------------------------------
  const Theme = {
    get() { try { return localStorage.getItem('ss.theme') || 'system'; } catch { return 'system'; } },
    set(t) {
      try { localStorage.setItem('ss.theme', t); } catch { }
      if (t === 'system') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', t);
      $$('[data-theme-btn]').forEach((b) => b.classList.toggle('active', b.dataset.themeBtn === t));
    },
  };
  const themeSwitch = () => {
    const t = Theme.get();
    return `<div class="segmented" role="group" aria-label="Theme">
      ${[['light', 'sun', 'Light'], ['dark', 'moon', 'Dark'], ['system', 'monitor', 'System']].map(([v, ic, l]) =>
        `<button type="button" data-act="theme" data-theme-btn="${v}" class="${t === v ? 'active' : ''}" title="${l} theme" aria-label="${l} theme">${icon(ic)}</button>`).join('')}
    </div>`;
  };

  // ---------------------------------------------------------------------------
  // API layer
  // ---------------------------------------------------------------------------
  // On Netlify, /suno-api/* and /suno-upload/* are proxied (see netlify.toml) so the
  // browser never hits CORS issues. Anywhere else we fall back to calling the API directly.
  const BASES = {
    api: { proxy: '/suno-api', direct: 'https://api.sunoapi.org' },
    upload: { proxy: '/suno-upload', direct: 'https://sunoapiorg.redpandaai.co' },
  };
  let netMode = location.protocol.startsWith('http') ? LS.get('netMode', 'proxy') : 'direct';

  const CODE_TEXT = {
    400: 'Invalid parameters', 401: 'Your API key was rejected', 402: 'Not enough credits', 404: 'Not found',
    405: 'Rate limit exceeded', 409: 'That already exists', 413: 'Prompt or style is too long', 422: 'Validation failed',
    429: 'Not enough credits (or rate limited)', 430: 'Too many requests — slow down a little', 451: 'Could not fetch the source file',
    455: 'Suno API is under maintenance', 500: 'Suno API server error',
  };
  class ApiError extends Error { constructor(msg, code) { super(msg); this.code = code; } }

  const callbackUrl = () => (location.protocol === 'https:' ? `${location.origin}/.netlify/functions/suno-callback` : 'https://example.com/suno-callback');

  async function api(path, { method = 'GET', body, form, base = 'api', okCodes = [200], key } = {}) {
    const k = key || state.key;
    const doFetch = async (mode) => {
      const headers = { Authorization: `Bearer ${k}` };
      let payload;
      if (form) payload = form;
      else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
      const res = await fetch(BASES[base][mode] + path, { method, headers, body: payload });
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch { }
      return { res, json };
    };

    let r = null;
    let firstErr = null;
    try { r = await doFetch(netMode); } catch (e) { firstErr = e; }

    // Proxy missing (not deployed on Netlify) → try direct once and remember if it works.
    if (netMode === 'proxy' && (!r || !r.json)) {
      try {
        const r2 = await doFetch('direct');
        if (r2.json) { netMode = 'direct'; LS.set('netMode', 'direct'); r = r2; }
      } catch (e) { firstErr = firstErr || e; }
    }
    if (!r) {
      throw new ApiError('Could not reach the Suno API from your browser. Deploy on Netlify (the included proxy avoids CORS) or check your connection.', 0);
    }
    if (!r.json) throw new ApiError(`Unexpected response from the API (HTTP ${r.res.status}).`, r.res.status);
    const j = r.json;
    const code = j.code ?? r.res.status;
    if (!okCodes.includes(code)) {
      const base = CODE_TEXT[code] || `Request failed (${code})`;
      const detail = j.msg && j.msg !== 'success' && j.msg !== base ? `: ${j.msg}` : '';
      throw new ApiError(base + detail, code);
    }
    return j;
  }
  const clean = (o) => {
    const out = {};
    Object.entries(o).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) return;
      out[k] = v;
    });
    return out;
  };

  async function refreshCredits(silent = true) {
    try {
      const j = await api('/api/v1/generate/credit');
      state.credits = typeof j.data === 'number' ? j.data : (j.data?.credits ?? j.data);
      renderCredits();
    } catch (e) { if (!silent) toast(e.message, 'err'); }
  }

  async function uploadFile(file) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('uploadPath', 'suno-studio');
    fd.append('fileName', `${Date.now()}-${file.name.replace(/[^\w.\-]+/g, '_')}`);
    const j = await api('/api/file-stream-upload', { method: 'POST', form: fd, base: 'upload' });
    const url = j.data?.downloadUrl;
    if (!url) throw new ApiError('Upload succeeded but no file URL was returned.', 0);
    return url;
  }

  // ---------------------------------------------------------------------------
  // Tasks + polling
  // ---------------------------------------------------------------------------
  const TASK_KINDS = {
    music: { icon: 'music', path: (id) => `/api/v1/generate/record-info?taskId=${encodeURIComponent(id)}` },
    lyrics: { icon: 'pen', path: (id) => `/api/v1/lyrics/record-info?taskId=${encodeURIComponent(id)}` },
    wav: { icon: 'download', path: (id) => `/api/v1/wav/record-info?taskId=${encodeURIComponent(id)}` },
    stems: { icon: 'split', path: (id) => `/api/v1/vocal-removal/record-info?taskId=${encodeURIComponent(id)}` },
    midi: { icon: 'piano', path: (id) => `/api/v1/midi/record-info?taskId=${encodeURIComponent(id)}` },
    video: { icon: 'video', path: (id) => `/api/v1/mp4/record-info?taskId=${encodeURIComponent(id)}` },
    cover: { icon: 'image', path: (id) => `/api/v1/suno/cover/record-info?taskId=${encodeURIComponent(id)}` },
    recovery: { icon: 'refresh', path: (id) => `/api/v1/suno/recovery/record-info?task_id=${encodeURIComponent(id)}`, okCodes: [200, 201] },
  };
  const MUSIC_STAGES = {
    PENDING: ['Queued — warming up the band', 12],
    TEXT_SUCCESS: ['Lyrics written, composing…', 45],
    FIRST_SUCCESS: ['First take ready — streaming!', 78],
    SUCCESS: ['Done', 100],
  };

  function addTask(t) {
    const task = Object.assign({ status: 'pending', stage: 'Submitted', progress: 6, createdAt: Date.now(), polls: 0 }, t);
    state.tasks.unshift(task);
    save.tasks();
    renderQueue();
    schedulePoll(1500);
    return task;
  }
  function finishTask(task, ok, stage, error) {
    task.status = ok ? 'done' : 'fail';
    task.stage = stage || (ok ? 'Done' : 'Failed');
    task.progress = 100;
    task.error = error || null;
    task.finishedAt = Date.now();
  }

  const isFailFlag = (f) => (typeof f === 'string' && /FAIL|ERROR|EXCEPTION/.test(f)) || f === 2 || f === 3;

  async function pollTask(task) {
    const kind = TASK_KINDS[task.kind];
    const j = await api(kind.path(task.id), { okCodes: kind.okCodes || [200] });
    task.polls = (task.polls || 0) + 1;
    const d = j.data;

    switch (task.kind) {
      case 'music': {
        const st = d?.status || 'PENDING';
        const items = d?.response?.sunoData || d?.response?.data || [];
        items.forEach((it) => upsertTrack(it, task));
        if (items.length) { save.tracks(); renderTrackLists(); }
        // CALLBACK_EXCEPTION only means Suno couldn't reach the webhook; the audio may still be fine.
        const callbackOnly = st === 'CALLBACK_EXCEPTION' && items.length && items.every((i) => i.audio_url);
        if (st === 'SUCCESS' || callbackOnly) {
          finishTask(task, true, `${items.length} track${items.length === 1 ? '' : 's'} ready`);
          task.trackIds = items.map((i) => i.id);
          celebrate(task);
        } else if (isFailFlag(st)) {
          finishTask(task, false, 'Failed', d?.errorMessage || humanStatus(st));
        } else {
          const [label, pct] = MUSIC_STAGES[st] || ['Working…', 30];
          task.stage = label;
          task.progress = Math.max(task.progress, pct);
        }
        break;
      }
      case 'lyrics': {
        const st = d?.status || 'PENDING';
        if (st === 'SUCCESS') {
          const variants = (d.response?.data || []).filter((v) => v.text);
          const entry = { id: task.id, prompt: task.label, createdAt: Date.now(), variants };
          state.lyrics = [entry, ...state.lyrics.filter((l) => l.id !== task.id)];
          save.lyrics();
          finishTask(task, true, `${variants.length} lyric option${variants.length === 1 ? '' : 's'} ready`);
          if (!task.ctx?.pickForCreate) toast(`Lyrics ready: ${task.label}`, 'ok');
          if (state.view === 'lyrics') renderView();
          if (task.ctx?.pickForCreate) openLyricPicker(entry);
        } else if (isFailFlag(st)) {
          finishTask(task, false, 'Failed', d?.errorMessage || humanStatus(st));
        } else {
          task.stage = 'Writing lyrics…';
          task.progress = Math.min(90, task.progress + 15);
        }
        break;
      }
      case 'wav':
      case 'video':
      case 'stems':
      case 'midi':
      case 'cover': {
        const flag = d?.successFlag;
        const resp = d?.response || {};
        const result =
          task.kind === 'wav' ? resp.audioWavUrl :
          task.kind === 'video' ? resp.videoUrl :
          task.kind === 'cover' ? (resp.images && resp.images.length ? resp.images : null) :
          task.kind === 'midi' ? (d?.midiData?.instruments ? d.midiData : null) :
          stemItems(resp);
        if (result && (flag === 'SUCCESS' || flag === 1 || !isFailFlag(flag))) {
          applyExtra(task, result);
          finishTask(task, true, { wav: 'WAV ready', video: 'Video ready', stems: 'Stems ready', midi: 'MIDI ready', cover: 'Cover art ready' }[task.kind]);
          toast(`${task.label}: ${task.stage}`, 'ok');
        } else if (isFailFlag(flag)) {
          finishTask(task, false, 'Failed', d?.errorMessage || String(flag));
        } else {
          task.stage = 'Processing…';
          task.progress = Math.min(90, task.progress + 10);
        }
        break;
      }
      case 'recovery': {
        if (j.code === 200 && Array.isArray(j.data)) {
          let n = 0;
          j.data.forEach((r) => {
            const t = state.tracks.find((x) => x.id === r.id);
            if (t && r.status === 'success' && r.audio_url) { t.audioUrl = r.audio_url; n++; }
          });
          save.tracks();
          renderTrackLists();
          finishTask(task, n > 0, n ? `Recovered ${n} link${n === 1 ? '' : 's'}` : 'Nothing recovered', n ? null : 'No playable links were recovered.');
        } else {
          task.stage = 'Recovering links…';
          task.progress = Math.min(90, task.progress + 15);
        }
        break;
      }
    }
    // Give up after ~25 minutes of polling.
    if (task.status === 'pending' && Date.now() - task.createdAt > 25 * 60 * 1000) {
      finishTask(task, false, 'Timed out', 'Still not finished after 25 minutes. Use "Check again" or import the task ID later.');
    }
  }

  const humanStatus = (s) => ({
    CREATE_TASK_FAILED: 'The task could not be created.',
    GENERATE_AUDIO_FAILED: 'Audio generation failed.',
    GENERATE_LYRICS_FAILED: 'Lyrics generation failed.',
    SENSITIVE_WORD_ERROR: 'Your prompt was flagged by the content filter. Try rephrasing.',
    CALLBACK_EXCEPTION: 'The task finished with a callback error.',
  }[s] || s);

  function stemItems(resp) {
    const items = [];
    if (Array.isArray(resp.originData) && resp.originData.length) {
      resp.originData.forEach((o) => o.audio_url && items.push({ name: o.stem_type_group_name || 'Stem', url: o.audio_url, id: o.id, duration: o.duration }));
    }
    if (!items.length) {
      const map = { vocalUrl: 'Vocals', instrumentalUrl: 'Instrumental', backingVocalsUrl: 'Backing vocals', drumsUrl: 'Drums', bassUrl: 'Bass', guitarUrl: 'Guitar', keyboardUrl: 'Keyboard', percussionUrl: 'Percussion', stringsUrl: 'Strings', synthUrl: 'Synth', fxUrl: 'FX', brassUrl: 'Brass', woodwindsUrl: 'Woodwinds' };
      Object.entries(map).forEach(([k, n]) => resp[k] && items.push({ name: n, url: resp[k] }));
    }
    return items.length ? items : null;
  }

  function applyExtra(task, result) {
    if (task.kind === 'stems' && task.ctx?.upload) {
      // Stems from an uploaded file aren't tied to a library track — show them right away.
      openModal(`${modalHead('Your stems are ready', esc(task.label))}<div class="modal-body"><div class="asset-list">${result.map((s) => `<div class="asset">${icon('split')}<div class="a-name">${esc(s.name)}</div><audio controls preload="none" src="${esc(s.url)}"></audio><a class="btn sm" href="${esc(s.url)}" target="_blank" rel="noopener" download>${icon('download')}</a></div>`).join('')}</div><p class="small faint" style="margin:0">Download what you need — these links are temporary.</p></div>`, { wide: true });
      return;
    }
    const ids = task.ctx?.trackIds || (task.ctx?.trackId ? [task.ctx.trackId] : []);
    ids.forEach((id) => {
      const t = state.tracks.find((x) => x.id === id);
      if (!t) return;
      t.extras = t.extras || {};
      if (task.kind === 'wav') t.extras.wav = result;
      if (task.kind === 'video') t.extras.video = result;
      if (task.kind === 'cover') t.extras.covers = result;
      if (task.kind === 'stems') t.extras.stems = { taskId: task.id, type: task.ctx.type, items: result };
      if (task.kind === 'midi') { state.mem.midi[t.id] = result; t.extras.midiTask = task.id; }
    });
    save.tracks();
    renderTrackLists();
    refreshOpenDetail();
  }

  function upsertTrack(it, task) {
    if (!it || !it.id) return;
    let t = state.tracks.find((x) => x.id === it.id);
    const fresh = !t;
    if (!t) {
      t = { id: it.id, createdAt: Date.now(), extras: {}, fav: false };
      state.tracks.unshift(t);
    }
    Object.assign(t, clean({
      taskId: task.id,
      title: it.title,
      tags: it.tags,
      prompt: it.prompt,
      imageUrl: it.image_url || it.source_image_url,
      audioUrl: it.audio_url || it.source_audio_url,
      streamUrl: it.stream_audio_url || it.source_stream_audio_url,
      duration: it.duration,
      modelName: it.model_name,
      model: task.ctx?.model,
      op: task.ctx?.op,
      parentId: task.ctx?.parentId,
    }));
    if (fresh && !state.playingId && (t.streamUrl || t.audioUrl) && task.ctx?.autoplay) {
      // Nothing is playing — start the first take as soon as it streams.
      task.ctx.autoplay = false;
      playTrack(t.id);
    }
  }

  let pollTimer = null;
  let polling = false;
  function schedulePoll(ms = 5000) {
    clearTimeout(pollTimer);
    pollTimer = setTimeout(pollAll, ms);
  }
  async function pollAll() {
    if (polling || !state.key) return;
    polling = true;
    const pending = state.tasks.filter((t) => t.status === 'pending');
    for (const t of pending) {
      try { await pollTask(t); }
      catch (e) {
        t.errors = (t.errors || 0) + 1;
        if (e.code === 401) { finishTask(t, false, 'Failed', e.message); }
        else if (t.errors > 6) finishTask(t, false, 'Failed', e.message);
      }
      await sleep(250);
    }
    save.tasks();
    renderQueue();
    polling = false;
    const stillPending = state.tasks.some((t) => t.status === 'pending');
    if (stillPending) schedulePoll(5000);
    else refreshCredits();
  }

  // ---------------------------------------------------------------------------
  // UI: toasts, confetti, modals
  // ---------------------------------------------------------------------------
  function toast(msg, kind = 'info', ms = 4200) {
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.innerHTML = `${icon(kind === 'ok' ? 'check' : kind === 'err' ? 'alert' : 'info')}<div>${esc(msg)}</div>`;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, ms);
  }

  function celebrate(task) {
    toast(`🎉 "${task.label}" is ready!`, 'ok');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = document.createElement('div');
    box.className = 'confetti';
    const colors = ['#6d4aff', '#ff4f8b', '#ffb547', '#34d399', '#38bdf8'];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement('i');
      c.style.left = `${Math.random() * 100}%`;
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = `${Math.random() * 0.5}s`;
      c.style.animationDuration = `${1.2 + Math.random() * 1.2}s`;
      box.appendChild(c);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3200);
  }

  let modalOnClose = null;
  function openModal(html, { wide = false, onClose } = {}) {
    closeModal();
    modalOnClose = onClose || null;
    $('#modal-root').innerHTML = `<div class="scrim" data-act="scrim"><div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div></div>`;
    const first = $('#modal-root input:not([type=hidden]), #modal-root textarea, #modal-root select');
    if (first) setTimeout(() => first.focus(), 30);
  }
  function closeModal() {
    if ($('#modal-root').innerHTML) {
      $('#modal-root').innerHTML = '';
      const cb = modalOnClose; modalOnClose = null;
      if (cb) cb();
    }
  }
  const modalHead = (title, sub) => `<div class="modal-head"><div><h3>${esc(title)}</h3>${sub ? `<p>${sub}</p>` : ''}</div><button class="btn ghost icon" data-act="close-modal" aria-label="Close">${icon('x')}</button></div>`;

  // ---------------------------------------------------------------------------
  // Tiny form engine (used by modals, remix studio, and advanced settings)
  // ---------------------------------------------------------------------------
  function fieldHTML(f) {
    const show = f.showIf ? ` data-show="${esc(f.showIf)}"` : '';
    const hint = f.hint ? `<span class="hint">${f.hint}</span>` : '';
    const counter = f.max ? `<span class="counter" data-counter="${f.name}" data-max="${f.max}">${String(f.value ?? '').length}/${f.max}</span>` : '';
    const label = `<span class="field-row"><span>${esc(f.label)}${f.required ? ' <span style="color:var(--accent-2)">*</span>' : ''}</span>${counter}</span>`;
    const v = f.value ?? '';
    switch (f.type) {
      case 'textarea':
        return `<label class="field"${show}>${label}<textarea data-f="${f.name}" rows="${f.rows || 4}" class="${f.cls || ''}" placeholder="${esc(f.placeholder || '')}" ${f.required ? 'data-req="1"' : ''}>${esc(v)}</textarea>${hint}</label>`;
      case 'select':
        return `<label class="field"${show}>${label}<select data-f="${f.name}">${f.options.map((o) => `<option value="${esc(o.v)}" ${String(o.v) === String(v) ? 'selected' : ''}>${esc(o.l)}</option>`).join('')}</select>${hint}</label>`;
      case 'toggle':
        return `<div${show}><label class="toggle"><input type="checkbox" data-f="${f.name}" data-t="bool" ${v ? 'checked' : ''}/><span class="track"></span>${esc(f.label)}</label>${f.hint ? `<div class="hint" style="margin-top:4px">${f.hint}</div>` : ''}</div>`;
      case 'seg':
        return `<div class="field"${show} style="display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:var(--text-muted)">${label}
          <div class="segmented" data-seg="${f.name}">${f.options.map((o) => `<button type="button" data-act="seg" data-v="${esc(o.v)}" class="${String(o.v) === String(v) ? 'active' : ''}">${esc(o.l)}</button>`).join('')}</div>
          <input type="hidden" data-f="${f.name}" value="${esc(v)}"/>${hint}</div>`;
      case 'range': {
        const auto = v === null || v === '' || v === undefined;
        const shown = auto ? 'Auto' : (f.fmt ? f.fmt(v) : v);
        return `<div class="slider"${show}><span class="field-row" style="font-size:13px;font-weight:600;color:var(--text-muted)"><span>${esc(f.label)}${f.optional ? ` <button type="button" class="legacy-toggle" data-act="range-auto" data-for="${f.name}">${auto ? '' : 'reset'}</button>` : ''}</span><span data-range-out="${f.name}">${shown}</span></span>
          <input type="range" data-f="${f.name}" data-t="num" min="${f.min}" max="${f.maxv}" step="${f.step || 1}" value="${auto ? (f.def ?? f.min) : v}" ${auto && f.optional ? 'data-auto="1"' : ''}/>${hint}</div>`;
      }
      case 'number':
        return `<label class="field"${show}>${label}<input type="number" data-f="${f.name}" data-t="num" value="${esc(v)}" ${f.min != null ? `min="${f.min}"` : ''} ${f.maxv != null ? `max="${f.maxv}"` : ''} step="${f.step || 'any'}" placeholder="${esc(f.placeholder || '')}" ${f.required ? 'data-req="1"' : ''}/>${hint}</label>`;
      case 'persona':
        return `<label class="field"${show}>${label}<input type="text" data-f="${f.name}" list="persona-list" value="${esc(v)}" placeholder="Pick a saved persona or paste a Persona / Voice ID"/>
          <datalist id="persona-list">${state.personas.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</datalist>${hint}</label>`;
      case 'html':
        return f.html;
      default:
        return `<label class="field"${show}>${label}<input type="${f.type || 'text'}" data-f="${f.name}" value="${esc(v)}" placeholder="${esc(f.placeholder || '')}" ${f.required ? 'data-req="1"' : ''}/>${hint}</label>`;
    }
  }

  function readForm(scope) {
    const out = {};
    $$('[data-f]', scope).forEach((el) => {
      const n = el.dataset.f;
      if (el.closest('[data-show]') && el.closest('[data-show]').hidden) return;
      if (el.dataset.t === 'bool') out[n] = el.checked;
      else if (el.dataset.t === 'num') out[n] = el.dataset.auto === '1' || el.value === '' ? null : Number(el.value);
      else out[n] = el.value.trim();
    });
    return out;
  }
  function validateForm(scope) {
    for (const el of $$('[data-req="1"]', scope)) {
      if (el.closest('[data-show]')?.hidden) continue;
      if (!el.value.trim()) { el.focus(); return 'Please fill in the required fields.'; }
    }
    for (const c of $$('[data-counter]', scope)) {
      const el = $(`[data-f="${c.dataset.counter}"]`, scope);
      if (el && !el.closest('[data-show]')?.hidden && el.value.length > Number(c.dataset.max)) { el.focus(); return `That text is over the ${c.dataset.max}-character limit.`; }
    }
    return null;
  }
  function evalShows(scope) {
    const vals = {};
    $$('[data-f]', scope).forEach((el) => { vals[el.dataset.f] = el.dataset.t === 'bool' ? String(el.checked) : el.value; });
    $$('[data-show]', scope).forEach((el) => {
      const ok = el.dataset.show.split('&').every((cond) => {
        const [k, v] = cond.split(cond.includes('!=') ? '!=' : '=');
        const eq = v.split('|').includes(vals[k.trim()]);
        return cond.includes('!=') ? !eq : eq;
      });
      el.hidden = !ok;
    });
  }
  function updateCounters(scope) {
    $$('[data-counter]', scope).forEach((c) => {
      const el = $(`[data-f="${c.dataset.counter}"]`, scope);
      if (!el) return;
      const n = el.value.length;
      c.textContent = `${n}/${c.dataset.max}`;
      c.classList.toggle('over', n > Number(c.dataset.max));
    });
  }

  // Shared "fine-tune" fields accepted by most generation endpoints.
  const tuneFields = (v = {}, { persona = true, gender = true } = {}) => [
    gender && { name: 'vocalGender', label: 'Vocal gender', type: 'seg', value: v.vocalGender ?? '', options: [{ v: '', l: 'Any' }, { v: 'm', l: 'Male' }, { v: 'f', l: 'Female' }], hint: 'A preference that nudges the odds — not a guarantee.' },
    { name: 'styleWeight', label: 'Style adherence', type: 'range', min: 0, maxv: 1, step: 0.01, def: 0.5, optional: true, value: v.styleWeight ?? null, fmt: (x) => Number(x).toFixed(2) },
    { name: 'weirdnessConstraint', label: 'Weirdness', type: 'range', min: 0, maxv: 1, step: 0.01, def: 0.5, optional: true, value: v.weirdnessConstraint ?? null, fmt: (x) => Number(x).toFixed(2) },
    { name: 'audioWeight', label: 'Audio weight', type: 'range', min: 0, maxv: 1, step: 0.01, def: 0.5, optional: true, value: v.audioWeight ?? null, fmt: (x) => Number(x).toFixed(2), hint: 'Ignored for instrumentals.' },
    { name: 'variety', label: 'Variety between takes', type: 'seg', value: v.variety ?? '1', options: [{ v: '0', l: 'Off' }, { v: '1', l: 'Normal' }, { v: '2', l: 'High' }, { v: '3', l: 'Extra' }, { v: '4', l: 'Max' }] },
    persona && { name: 'personaId', label: 'Persona / Voice ID', type: 'persona', value: v.personaId ?? '', hint: 'Create personas from any finished track (Library → track → Persona).' },
    persona && { name: 'personaModel', label: 'Persona type', type: 'seg', value: v.personaModel ?? 'style_persona', options: [{ v: 'style_persona', l: 'Style persona' }, { v: 'voice_persona', l: 'Suno Voice ID' }], showIf: 'personaId!=' },
  ].filter(Boolean);

  // Picks tune values, dropping defaults so we only send what the user touched.
  function tunePayload(v, model) {
    const p = {
      vocalGender: v.vocalGender || undefined,
      styleWeight: v.styleWeight ?? undefined,
      weirdnessConstraint: v.weirdnessConstraint ?? undefined,
      audioWeight: v.audioWeight ?? undefined,
      variety: v.variety !== undefined && v.variety !== '' && v.variety !== '1' ? Number(v.variety) : undefined,
      personaId: v.personaId || undefined,
    };
    if (p.personaId && PERSONA_MODEL_MODELS.includes(model)) p.personaModel = v.personaModel || 'style_persona';
    return p;
  }

  // ---------------------------------------------------------------------------
  // Gate (API key entry)
  // ---------------------------------------------------------------------------
  function renderGate(err = '') {
    document.body.classList.remove('has-player');
    $('#player-root').innerHTML = '';
    $('#root').innerHTML = `
      <div class="gate">
        <div class="gate-card">
          <div class="gate-top"><span class="logo"><span class="logo-mark">${icon('music')}</span><span class="word">Suno Studio</span></span>${themeSwitch()}</div>
          <div>
            <h1>Turn ideas into <span class="grad">full songs</span>.</h1>
          </div>
          <p class="lede">Write a vibe, get a track. Cover, extend, split stems, make videos and more — powered by your own Suno API key.</p>
          <ol class="steps">
            <li><span class="step-num">1</span><span><b>Get a key</b> from the <a href="https://sunoapi.org/api-key" target="_blank" rel="noopener">SunoAPI key page</a>.</span></li>
            <li><span class="step-num">2</span><span><b>Paste it below.</b> We check it by reading your credit balance.</span></li>
            <li><span class="step-num">3</span><span><b>Create.</b> Your songs live in this browser's library.</span></li>
          </ol>
          <form class="stack" id="gate-form" autocomplete="off">
            <label class="field"><span>API key</span>
              <div class="key-input">
                <input id="key" type="password" placeholder="Paste your Suno API key" spellcheck="false" autocomplete="off" required />
                <button type="button" class="btn ghost icon sm" data-act="toggle-key" aria-label="Show key">${icon('eye')}</button>
              </div>
            </label>
            <label class="toggle"><input type="checkbox" id="remember" checked /><span class="track"></span>Remember on this device</label>
            ${err ? `<div class="err">${esc(err)}</div>` : ''}
            <button class="btn primary lg block" type="submit" id="gate-btn">${icon('sparkles')} Start creating</button>
          </form>
          <p class="fine">Your key is stored only in this browser (kept on this device when remembered, otherwise only for this tab) and is sent only to the Suno API. Generations use your SunoAPI credits.</p>
        </div>
      </div>`;
    $('#gate-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const k = $('#key').value.trim();
      if (!k) return;
      const btn = $('#gate-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Checking your key…';
      try {
        const j = await api('/api/v1/generate/credit', { key: k });
        state.key = k;
        state.credits = typeof j.data === 'number' ? j.data : j.data?.credits ?? j.data;
        KeyStore.save(k, $('#remember').checked);
        renderApp();
        toast('Connected — let\'s make something!', 'ok');
        schedulePoll(500);
      } catch (e2) {
        renderGate(e2.code === 401 ? 'That key was rejected. Double-check it on the SunoAPI key page.' : e2.message);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // App shell
  // ---------------------------------------------------------------------------
  const VIEWS = [
    { id: 'create', label: 'Create', icon: 'sparkles' },
    { id: 'lyrics', label: 'Lyrics', icon: 'pen' },
    { id: 'remix', label: 'Remix', long: ' Studio', icon: 'layers' },
    { id: 'sounds', label: 'Sounds', icon: 'wave' },
    { id: 'library', label: 'Library', icon: 'grid' },
  ];

  function renderApp() {
    $('#root').innerHTML = `
      <div class="app">
        <header class="topbar">
          <span class="logo"><span class="logo-mark">${icon('music')}</span><span class="word">Suno Studio</span></span>
          <nav class="nav" id="nav" aria-label="Main">${navHTML()}</nav>
          <span class="spacer"></span>
          <button class="credits-pill" data-act="refresh-credits" id="credits" title="Remaining credits — click to refresh"></button>
          ${themeSwitch()}
          <div class="menu">
            <button class="btn ghost icon" data-act="menu" aria-label="Account menu">${icon('more')}</button>
            <div class="menu-pop" id="menu" hidden>
              <div class="label">Account</div>
              <button data-act="change-key">${icon('key')} Change API key</button>
              <button data-act="import-task">${icon('download')} Import by task ID</button>
              <button data-act="export-lib">${icon('file')} Export library (JSON)</button>
              <hr/>
              <button data-act="about">${icon('info')} How it works</button>
              <button data-act="clear-lib" class="danger">${icon('trash')} Clear local library</button>
              <button data-act="logout">${icon('logout')} Sign out &amp; forget key</button>
            </div>
          </div>
        </header>
        <main class="main" id="main"></main>
      </div>`;
    renderCredits();
    renderView();
    renderPlayer();
  }
  function navHTML() {
    const active = state.tasks.filter((t) => t.status === 'pending').length;
    return VIEWS.map((v) => `<button data-act="nav" data-view="${v.id}" class="${state.view === v.id ? 'active' : ''}">${icon(v.icon)}<span>${v.label}<span class="lbl-long">${v.long || ''}</span></span>${v.id === 'library' && state.tracks.length ? `<span class="badge">${state.tracks.length}</span>` : ''}${v.id === 'create' && active ? '<span class="eq" style="color:var(--accent)"><i></i><i></i><i></i></span>' : ''}</button>`).join('');
  }
  function renderNav() { const n = $('#nav'); if (n) n.innerHTML = navHTML(); }
  function renderCredits() {
    const el = $('#credits');
    if (!el) return;
    const c = state.credits;
    el.classList.toggle('low', typeof c === 'number' && c < 20);
    el.innerHTML = `<span class="dot"></span>${c == null ? '—' : esc(typeof c === 'number' ? c.toLocaleString() : c)} credits`;
  }

  function setView(v) {
    state.view = v;
    LS.set('view', v);
    renderNav();
    renderView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderView() {
    const main = $('#main');
    if (!main) return;
    const views = { create: viewCreate, lyrics: viewLyrics, remix: viewRemix, sounds: viewSounds, library: viewLibrary };
    main.innerHTML = `<section>${views[state.view]()}</section><aside class="side">${sideHTML()}</aside>`;
    const scope = $('section', main);
    evalShows(scope);
    updateCounters(scope);
    syncChips();
  }

  // ---------------------------------------------------------------------------
  // Side panel (queue + tips)
  // ---------------------------------------------------------------------------
  function sideHTML() {
    const tips = {
      create: '<b>Tip:</b> Simple mode writes lyrics for you. Switch to <b>Custom</b> to control title, style, exact lyrics and advanced knobs like weirdness and variety.',
      lyrics: '<b>Tip:</b> Be specific — mention the story, the mood, and the structure you want. Pick a result and send it straight into a custom song.',
      remix: '<b>Tip:</b> Uploaded files are temporary (the upload service deletes them after 3 days). Source audio should be 8 minutes or less.',
      sounds: '<b>Tip:</b> Sounds are short effects and loops. Set a BPM and key so loops fit your project.',
      library: '<b>Tip:</b> Open any track for power tools — extend, replace a section, split stems, WAV, video, cover art, karaoke and personas. Generated files are kept by Suno for about 15 days, so download what you love.',
    };
    return `
      <div class="card">
        <div class="row between"><h3>Queue</h3>${state.tasks.some((t) => t.status !== 'pending') ? '<button class="btn ghost sm" data-act="clear-done">Clear finished</button>' : ''}</div>
        <p class="sub">Jobs update automatically every few seconds.</p>
        <div id="queue">${queueHTML()}</div>
      </div>
      <div class="tip">${tips[state.view] || ''}</div>`;
  }
  function queueHTML() {
    if (!state.tasks.length) return `<div class="small faint">Nothing cooking yet. Your jobs will show up here.</div>`;
    return state.tasks.slice(0, 10).map((t) => {
      const cls = t.status === 'done' ? 'done' : t.status === 'fail' ? 'fail' : '';
      const ic = t.status === 'done' ? 'check' : t.status === 'fail' ? 'alert' : TASK_KINDS[t.kind]?.icon || 'music';
      return `<div class="queue-item ${cls}">
        <div class="q-icon">${t.status === 'pending' ? '<span class="eq"><i></i><i></i><i></i><i></i></span>' : icon(ic)}</div>
        <div class="q-body">
          <div class="q-title" title="${esc(t.label)}">${esc(t.label)}</div>
          <div class="q-status">${esc(t.stage)}${t.error ? ` — ${esc(t.error)}` : ''} · <span class="faint">${timeAgo(t.createdAt)}</span></div>
          ${t.status === 'pending' ? `<div class="progress ${t.progress < 15 ? 'indet' : ''}"><i style="width:${t.progress}%"></i></div>` : ''}
          <div class="row" style="margin-top:6px;gap:4px">
            ${t.status === 'done' && t.kind === 'music' && t.trackIds?.length ? `<button class="btn sm" data-act="play" data-id="${esc(t.trackIds[0])}">${icon('play')} Play</button>` : ''}
            ${t.status === 'done' && t.kind === 'lyrics' ? `<button class="btn sm" data-act="nav" data-view="lyrics">View</button>` : ''}
            ${t.status === 'done' && t.ctx?.trackId ? `<button class="btn sm" data-act="open-track" data-id="${esc(t.ctx.trackId)}">Open</button>` : ''}
            ${t.status === 'fail' ? `<button class="btn sm" data-act="retry-poll" data-id="${esc(t.id)}">Check again</button>` : ''}
            <button class="btn ghost sm" data-act="copy" data-text="${esc(t.id)}" title="Copy task ID">${icon('copy')}</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }
  function renderQueue() {
    const q = $('#queue');
    if (q) q.innerHTML = queueHTML();
    renderNav();
  }

  // ---------------------------------------------------------------------------
  // View: Create
  // ---------------------------------------------------------------------------
  function modelPickerHTML() {
    const cur = state.settings.model;
    const list = MODELS.filter((m) => !m.legacy || state.settings.showLegacy || m.id === cur);
    return `<div class="models">${list.map((m) => `
      <button type="button" class="model ${m.id === cur ? 'on' : ''}" data-act="model" data-model="${m.id}">
        <span class="name">${esc(m.name)} ${m.tag ? `<span class="tag">${m.tag}</span>` : '<span class="tag legacy">Legacy</span>'}</span>
        <span class="desc">${esc(m.desc)}</span>
      </button>`).join('')}</div>
      <button type="button" class="legacy-toggle" data-act="legacy">${state.settings.showLegacy ? 'Hide legacy models' : 'Show legacy models (V4 – V5.5, marked discontinued by SunoAPI)'}</button>`;
  }

  function chipGroupsHTML(target) {
    return Object.entries(CHIPS).map(([g, list]) => `
      <div class="row" style="gap:8px;align-items:flex-start"><span class="small faint" style="width:52px;padding-top:5px">${g}</span>
      <div class="chips" style="flex:1">${list.map((c) => `<button type="button" class="chip" data-act="chip" data-target="${target}" data-chip="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>`).join('');
  }

  function viewCreate() {
    const f = state.form;
    const model = state.settings.model;
    const L = limits(model);
    const custom = f.mode === 'custom';
    const durOk = DURATION_MODELS.includes(model);
    return `
      <div class="page-head">
        <div><h2>What should we make today?</h2><p>Describe a vibe or write every word — then hit create.</p></div>
        <div class="segmented" role="tablist">
          <button type="button" data-act="mode" data-mode="simple" class="${!custom ? 'active' : ''}">${icon('zap')} Simple</button>
          <button type="button" data-act="mode" data-mode="custom" class="${custom ? 'active' : ''}">${icon('pen')} Custom</button>
        </div>
      </div>
      <form id="create-form" class="stack" data-autosave="form">
        ${!custom ? `
        <div class="card stack">
          <div class="hero-prompt">
            <label class="field"><span class="field-row"><span>Song description</span><span class="counter" data-counter="prompt" data-max="${L.prompt}">0/${L.prompt}</span></span>
              <textarea data-f="prompt" placeholder="e.g. An upbeat indie-pop song about moving to a new city and finding your people">${esc(f.prompt)}</textarea>
            </label>
          </div>
          <div class="hero-actions">
            <div class="row">
              <button type="button" class="btn sm" data-act="surprise">${icon('dice')} Surprise me</button>
              <label class="toggle"><input type="checkbox" data-f="instrumental" data-t="bool" ${f.instrumental ? 'checked' : ''}/><span class="track"></span>Instrumental</label>
            </div>
            <span class="small faint">Lyrics are written for you from the description.</span>
          </div>
          <details class="advanced">
            <summary>${icon('layers')} Style &amp; references <span class="faint small" style="font-weight:500">optional</span>${icon('chevron', 'chev')}</summary>
            <div class="stack">
              <label class="field"><span class="field-row"><span>Style</span><span class="counter" data-counter="simpleStyle" data-max="${L.style}">0/${L.style}</span></span>
                <input type="text" data-f="simpleStyle" value="${esc(f.simpleStyle)}" placeholder="e.g. indie pop, jangly guitars, female vocals"/></label>
              ${chipGroupsHTML('simpleStyle')}
              <div class="divider"></div>
              <div class="small muted">Reference media steers the song's vibe (up to 5 images, 1 audio clip of 6 s – 30 min, 1 video ≤ 241 s).</div>
              <div class="grid-3">
                ${refSlot('refImages', 'Images', 'image/jpeg,image/png,image/webp,image/bmp', f.refImages.length ? `${f.refImages.length} image${f.refImages.length > 1 ? 's' : ''}` : '')}
                ${refSlot('refAudio', 'Audio', 'audio/*', f.refAudio ? '1 clip' : '')}
                ${refSlot('refVideo', 'Video', 'video/mp4,video/quicktime,video/webm', f.refVideo ? '1 video' : '')}
              </div>
            </div>
          </details>
        </div>` : `
        <div class="card stack">
          <div class="grid-2">
            <label class="field"><span class="field-row"><span>Title</span><span class="counter" data-counter="title" data-max="${L.title}">0/${L.title}</span></span>
              <input type="text" data-f="title" value="${esc(f.title)}" placeholder="Name your song"/></label>
            <div class="field" style="justify-content:flex-end"><label class="toggle"><input type="checkbox" data-f="instrumental" data-t="bool" ${f.instrumental ? 'checked' : ''}/><span class="track"></span>Instrumental (no vocals)</label></div>
          </div>
          <label class="field"><span class="field-row"><span>Style of music</span><span class="row" style="gap:8px"><button type="button" class="btn sm" data-act="boost-style" title="Let AI expand your style description">${icon('zap')} Boost style</button><span class="counter" data-counter="style" data-max="${L.style}">0/${L.style}</span></span></span>
            <textarea data-f="style" rows="2" style="min-height:64px" placeholder="e.g. dreamy synth-pop, 110 bpm, airy female vocals, shimmering pads">${esc(f.style)}</textarea></label>
          ${chipGroupsHTML('style')}
          <div data-show="instrumental=false" class="stack">
            <label class="field"><span class="field-row"><span>Lyrics</span><span class="row" style="gap:8px"><button type="button" class="btn sm" data-act="ai-lyrics">${icon('sparkles')} Write with AI</button><span class="counter" data-counter="lyrics" data-max="${L.lyrics}">0/${L.lyrics}</span></span></span>
              <textarea class="lyrics" data-f="lyrics" placeholder="[Verse]\nWrite your lyrics here…\n\n[Chorus]\n…">${esc(f.lyrics)}</textarea></label>
            <div class="chips">${STRUCTURE_TAGS.map((t) => `<button type="button" class="chip" data-act="insert-tag" data-tag="${t}">${t}</button>`).join('')}</div>
          </div>
          ${durOk ? fieldHTML({ name: 'duration', label: 'Target length', type: 'range', min: 10, maxv: 360, step: 5, value: f.duration ?? 120, fmt: (x) => fmtTime(x), hint: 'Available on V5.5 and the V6 family. SunoAPI\'s own default is 20 seconds when this isn\'t sent.' }) : ''}
          <details class="advanced">
            <summary>${icon('sparkles')} Advanced controls ${icon('chevron', 'chev')}</summary>
            <div class="stack">
              ${fieldHTML({ name: 'negativeTags', label: 'Exclude styles', type: 'text', value: f.negativeTags, placeholder: 'e.g. heavy metal, autotune, spoken word', max: 1000 })}
              ${tuneFields(f).map(fieldHTML).join('')}
            </div>
          </details>
        </div>`}
        <div class="card stack">
          <div><h3>Model</h3><p class="sub" style="margin:0">Pick the engine. You can change it any time.</p></div>
          ${modelPickerHTML()}
        </div>
        <div class="create-cta">
          <span class="small faint">Tracks appear in your library the moment they start streaming.</span>
          <button type="submit" class="btn primary lg" id="create-btn">${icon('sparkles')} Create song</button>
        </div>
      </form>
      ${recentHTML()}`;
  }
  function refSlot(name, label, accept, has) {
    return `<div class="dropzone ${has ? 'has' : ''}" data-act="pick-ref" data-ref="${name}" data-accept="${accept}" style="padding:14px">
      ${icon(name === 'refImages' ? 'image' : name === 'refAudio' ? 'mic' : 'video')}<b>${label}</b><span class="small">${has ? esc(has) + ' attached' : 'Click to upload'}</span>
      ${has ? `<button type="button" class="btn ghost sm" data-act="clear-ref" data-ref="${name}">Remove</button>` : ''}</div>`;
  }
  function recentHTML() {
    const recent = state.tracks.slice(0, 4);
    if (!recent.length) return '';
    return `<div class="card" style="margin-top:16px"><div class="row between"><h3>Fresh off the press</h3><button class="btn ghost sm" data-act="nav" data-view="library">See all</button></div><div class="track-list" data-tracklist="recent" style="margin-top:12px">${recent.map(trackRowHTML).join('')}</div></div>`;
  }

  async function submitCreate(form) {
    const f = readForm(form);
    Object.assign(state.form, f);
    save.form();
    const model = state.settings.model;
    const custom = state.form.mode === 'custom';
    const err = validateForm(form);
    if (err) return toast(err, 'err');
    let body;
    if (!custom) {
      const refs = { imageUrls: state.form.refImages, audioUrls: state.form.refAudio ? [state.form.refAudio] : [], videoUrls: state.form.refVideo ? [state.form.refVideo] : [] };
      if (!f.prompt && !f.simpleStyle && !refs.imageUrls.length && !refs.audioUrls.length && !refs.videoUrls.length) {
        return toast('Describe your song (or add a style or reference) first.', 'err');
      }
      body = clean({ customMode: false, instrumental: !!f.instrumental, model, prompt: f.prompt, style: f.simpleStyle, ...refs, callBackUrl: callbackUrl() });
      body.instrumental = !!f.instrumental;
    } else {
      if (!f.style && !(f.lyrics && !f.instrumental) && !f.negativeTags) return toast('Add a style, some lyrics, or excluded styles to get started.', 'err');
      body = clean({
        customMode: true, instrumental: !!f.instrumental, model, title: f.title, style: f.style,
        prompt: f.instrumental ? undefined : f.lyrics,
        negativeTags: f.negativeTags,
        duration: DURATION_MODELS.includes(model) ? f.duration ?? undefined : undefined,
        ...tunePayload(f, model),
        callBackUrl: callbackUrl(),
      });
      if (f.instrumental) delete body.audioWeight;
      body.instrumental = !!f.instrumental;
    }
    const label = (custom ? f.title : '') || (f.prompt || f.style || f.simpleStyle || 'New song').slice(0, 48);
    await submitJob('/api/v1/generate', body, { kind: 'music', label, ctx: { model, op: 'generate', autoplay: true } }, $('#create-btn'));
  }

  async function submitJob(path, body, taskInfo, btn) {
    const orig = btn?.innerHTML;
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Sending…'; }
    try {
      const j = await api(path, { method: 'POST', body });
      const id = j.data?.taskId || j.data?.task_id;
      if (!id) throw new ApiError('No task ID came back from the API.', 0);
      addTask(Object.assign({ id }, taskInfo));
      toast(`Started: ${taskInfo.label}`, 'info');
      refreshCredits();
      return id;
    } catch (e) {
      toast(e.message, 'err', 7000);
      return null;
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = orig; }
    }
  }

  // ---------------------------------------------------------------------------
  // View: Lyrics
  // ---------------------------------------------------------------------------
  function viewLyrics() {
    return `
      <div class="page-head"><div><h2>Lyric lab</h2><p>Generate lyric ideas without spending time on audio. Send the best one to a custom song.</p></div></div>
      <form id="lyrics-form" class="card stack">
        <label class="field"><span class="field-row"><span>What's the song about?</span><span class="counter" data-counter="lprompt" data-max="200">0/200</span></span>
          <textarea data-f="lprompt" rows="3" data-req="1" placeholder="e.g. A bittersweet goodbye to a hometown, verse–chorus–bridge, hopeful ending">${esc(state.lyricPrompt)}</textarea></label>
        <div class="row between">
          <div class="chips">${LYRIC_IDEAS.map((i) => `<button type="button" class="chip" data-act="lyric-idea" data-idea="${esc(i)}">${esc(i)}</button>`).join('')}</div>
          <button class="btn primary" id="lyrics-btn" type="submit">${icon('pen')} Write lyrics</button>
        </div>
      </form>
      <div class="stack" style="margin-top:16px">
        ${state.lyrics.length ? state.lyrics.map((l) => `
          <div class="card">
            <div class="row between"><div><h3>${esc(l.prompt)}</h3><p class="sub" style="margin:0">${timeAgo(l.createdAt)}</p></div><button class="btn ghost sm" data-act="del-lyrics" data-id="${esc(l.id)}" aria-label="Delete">${icon('trash')}</button></div>
            <div class="grid-2" style="margin-top:12px">${l.variants.map((v, i) => lyricCardHTML(l.id, v, i)).join('')}</div>
          </div>`).join('') : `<div class="empty"><div class="big">✍️</div><h4>No lyrics yet</h4><p>Give the AI a theme above — you'll usually get a couple of options to choose from.</p></div>`}
      </div>`;
  }
  const lyricCardHTML = (lid, v, i) => `
    <div class="lyric-card">
      <h4>${esc(v.title || `Option ${i + 1}`)}</h4>
      <pre>${esc(v.text)}</pre>
      <div class="row"><button class="btn primary sm" data-act="use-lyrics" data-lid="${esc(lid)}" data-i="${i}">${icon('music')} Use in song</button><button class="btn sm" data-act="copy" data-text="${esc(v.text)}">${icon('copy')} Copy</button></div>
    </div>`;

  function useLyrics(lid, i) {
    const l = state.lyrics.find((x) => x.id === lid);
    const v = l?.variants?.[i];
    if (!v) return;
    Object.assign(state.form, { mode: 'custom', lyrics: v.text, title: state.form.title || v.title || '', instrumental: false });
    save.form();
    closeModal();
    setView('create');
    toast('Lyrics loaded into Custom mode — add a style and create!', 'ok');
  }
  function openLyricPicker(entry) {
    openModal(`${modalHead('Pick your lyrics', esc(entry.prompt))}<div class="modal-body"><div class="grid-2">${entry.variants.map((v, i) => lyricCardHTML(entry.id, v, i)).join('')}</div></div>`, { wide: true });
  }

  // ---------------------------------------------------------------------------
  // View: Remix studio (upload-based operations)
  // ---------------------------------------------------------------------------
  const REMIX_OPS = [
    { id: 'cover', emoji: '🎭', name: 'Cover', desc: 'Re-imagine a song in a new style while keeping its melody.' },
    { id: 'extend', emoji: '➡️', name: 'Extend', desc: 'Continue your audio seamlessly in the same style.' },
    { id: 'vocals', emoji: '🎤', name: 'Add vocals', desc: 'Sing AI vocals over your instrumental.' },
    { id: 'instrumental', emoji: '🎸', name: 'Add instrumental', desc: 'Build a backing track around a vocal or melody.' },
    { id: 'mashup', emoji: '🧬', name: 'Mashup', desc: 'Blend two tracks into something new.' },
    { id: 'stems', emoji: '🎚️', name: 'Split stems', desc: 'Separate vocals and instruments from any file.' },
  ];

  function remixFields(op) {
    const model = state.settings.model;
    const L = limits(model);
    const common = [
      { name: 'title', label: 'Title', type: 'text', max: 80, placeholder: 'Name the result' },
      { name: 'style', label: 'Style', type: 'text', max: L.style, placeholder: 'e.g. acoustic jazz trio, brushed drums' },
    ];
    const lyricsF = { name: 'lyrics', label: 'Lyrics', type: 'textarea', cls: 'lyrics', max: L.lyrics, placeholder: '[Verse]\n…', showIf: 'instrumental=false' };
    const instrF = { name: 'instrumental', label: 'Instrumental (no vocals)', type: 'toggle', value: false };
    const neg = { name: 'negativeTags', label: 'Exclude styles', type: 'text', max: 1000, placeholder: 'e.g. heavy metal' };
    const dur = DURATION_MODELS.includes(model) ? [{ name: 'duration', label: 'Target length', type: 'range', min: 10, maxv: 360, step: 5, optional: true, def: 120, value: null, fmt: fmtTime }] : [];
    switch (op) {
      case 'cover': return [...common, instrF, lyricsF, neg, ...dur];
      case 'extend': return [...common, { name: 'continueAt', label: 'Continue from (seconds)', type: 'number', min: 0, placeholder: 'Leave blank to continue from the end', hint: 'Must be less than the length of your audio.' }, instrF, lyricsF, neg];
      case 'vocals': return [
        { name: 'title', label: 'Title', type: 'text', required: true, max: 80 },
        { name: 'style', label: 'Style & vocal approach', type: 'text', required: true, max: L.style, placeholder: 'e.g. soulful R&B, breathy female vocals' },
        { name: 'negativeTags', label: 'Exclude', type: 'text', required: true, max: 1000, placeholder: 'e.g. screaming, autotune', hint: 'Required by this endpoint.' },
        { ...lyricsF, showIf: undefined, label: 'Lyrics to sing' },
      ];
      case 'instrumental': return [
        { name: 'title', label: 'Title', type: 'text', required: true, max: 80 },
        { name: 'tags', label: 'Instrumental style', type: 'text', required: true, max: L.style, placeholder: 'e.g. relaxing piano, ambient, warm strings' },
        { name: 'negativeTags', label: 'Exclude', type: 'text', required: true, max: 1000, placeholder: 'e.g. heavy drums, distortion', hint: 'Required by this endpoint.' },
      ];
      case 'mashup': return [...common, lyricsF.showIf ? { ...lyricsF, showIf: undefined, label: 'Lyrics (optional)' } : lyricsF, ...dur];
      case 'stems': return [
        { name: 'type', label: 'Separation', type: 'seg', value: 'separate_vocal', options: [{ v: 'separate_vocal', l: 'Vocals + instrumental' }, { v: 'split_stem', l: 'All instruments' }, { v: 'split_stem_advanced', l: 'One instrument' }] },
        { name: 'stemName', label: 'Instrument to isolate', type: 'select', value: 'Lead Vocal', options: STEM_NAMES.map((s) => ({ v: s, l: s })), showIf: 'type=split_stem_advanced' },
      ];
      default: return [];
    }
  }

  function viewRemix() {
    const r = state.remix;
    const op = REMIX_OPS.find((o) => o.id === r.op);
    const needsModel = !['stems'].includes(r.op);
    const tune = ['cover', 'extend', 'vocals', 'instrumental', 'mashup'].includes(r.op);
    return `
      <div class="page-head"><div><h2>Remix studio</h2><p>Bring your own audio — cover it, extend it, add vocals or a band, mash it up, or split it into stems.</p></div></div>
      <div class="card stack">
        <h3>1 · Choose what to do</h3>
        <div class="mode-cards">${REMIX_OPS.map((o) => `<button type="button" class="mode-card ${o.id === r.op ? 'on' : ''}" data-act="remix-op" data-op="${o.id}"><span class="emoji">${o.emoji}</span><b>${o.name}</b><span>${o.desc}</span></button>`).join('')}</div>
      </div>
      <form id="remix-form" class="stack" style="margin-top:16px">
        <div class="card stack">
          <h3>2 · Source audio${r.op === 'mashup' ? 's' : ''}</h3>
          <p class="sub" style="margin:0">Upload a file or paste a public URL${r.op === 'stems' ? '' : ' (8 minutes max)'}.</p>
          ${sourceHTML('src', r.op === 'mashup' ? 'Track A' : 'Your audio')}
          ${r.op === 'mashup' ? sourceHTML('src2', 'Track B') : ''}
          <div class="small faint">Want to work on a song you made here? Open it from the Library for extend, replace-section, stems and more.</div>
        </div>
        <div class="card stack">
          <h3>3 · ${esc(op.name)} settings</h3>
          ${remixFields(r.op).map(fieldHTML).join('')}
          ${tune ? `<details class="advanced"><summary>${icon('sparkles')} Advanced controls ${icon('chevron', 'chev')}</summary><div class="stack">${tuneFields({}, { persona: ['cover', 'extend', 'mashup'].includes(r.op) }).map(fieldHTML).join('')}</div></details>` : ''}
        </div>
        ${needsModel ? `<div class="card stack"><h3>Model</h3>${modelPickerHTML()}</div>` : ''}
        <div class="create-cta"><button type="submit" class="btn primary lg" id="remix-btn">${icon('sparkles')} ${esc(op.name)}</button></div>
      </form>`;
  }
  function sourceHTML(slot, label) {
    const s = state.remix[slot];
    return `<div class="stack" style="gap:8px">
      <div class="dropzone ${s ? 'has' : ''}" data-act="pick-src" data-slot="${slot}" data-drop="${slot}">
        ${state.remix.uploading === slot ? '<span class="spinner"></span><b>Uploading…</b>' : s ? `${icon('check')}<b>${esc(label)} ready</b><span class="small mono" style="overflow-wrap:anywhere">${esc(s.name || s.url)}</span><audio controls preload="none" src="${esc(s.url)}"></audio>` : `${icon('upload')}<b>${esc(label)}</b><span class="small">Drop an audio file here or click to browse</span>`}
      </div>
      <div class="row"><input type="url" placeholder="…or paste an audio URL" data-src-url="${slot}" style="flex:1" value="${s && !s.name ? esc(s.url) : ''}"/>${s ? `<button type="button" class="btn ghost sm" data-act="clear-src" data-slot="${slot}">Remove</button>` : ''}</div>
    </div>`;
  }

  async function submitRemix(form) {
    const r = state.remix;
    // Accept a pasted URL if no file was uploaded.
    $$('[data-src-url]', form).forEach((inp) => { const v = inp.value.trim(); if (v && !r[inp.dataset.srcUrl]) r[inp.dataset.srcUrl] = { url: v }; });
    if (!r.src || (r.op === 'mashup' && !r.src2)) return toast(r.op === 'mashup' ? 'Add both tracks for the mashup.' : 'Add your source audio first.', 'err');
    const err = validateForm(form);
    if (err) return toast(err, 'err');
    const v = readForm(form);
    const model = state.settings.model;
    const cb = callbackUrl();
    const tune = tunePayload(v, model);
    const btn = $('#remix-btn');
    const opName = REMIX_OPS.find((o) => o.id === r.op).name;
    const label = `${opName}: ${v.title || r.src.name || 'your audio'}`.slice(0, 60);
    const task = { kind: 'music', label, ctx: { model, op: r.op, autoplay: true } };
    let path, body;
    switch (r.op) {
      case 'cover':
        path = '/api/v1/generate/upload-cover';
        body = clean({ uploadUrl: r.src.url, model, title: v.title, style: v.style, prompt: v.instrumental ? undefined : v.lyrics, negativeTags: v.negativeTags, duration: v.duration ?? undefined, ...tune, callBackUrl: cb });
        body.instrumental = !!v.instrumental;
        break;
      case 'extend':
        path = '/api/v1/generate/upload-extend';
        body = clean({ uploadUrl: r.src.url, model, title: v.title, style: v.style, prompt: v.instrumental ? undefined : v.lyrics, continueAt: v.continueAt ?? undefined, negativeTags: v.negativeTags, ...tune, callBackUrl: cb });
        if (v.instrumental) { body.instrumental = true; delete body.vocalGender; delete body.prompt; } else body.instrumental = false;
        break;
      case 'vocals':
        path = '/api/v1/generate/add-vocals';
        body = clean({ uploadUrl: r.src.url, model, title: v.title, style: v.style, negativeTags: v.negativeTags, prompt: v.lyrics, ...tune, callBackUrl: cb });
        break;
      case 'instrumental':
        path = '/api/v1/generate/add-instrumental';
        body = clean({ uploadUrl: r.src.url, model, title: v.title, tags: v.tags, negativeTags: v.negativeTags, ...tune, callBackUrl: cb });
        break;
      case 'mashup':
        path = '/api/v1/generate/mashup';
        body = clean({ uploadUrlList: [r.src.url, r.src2.url], model, title: v.title, style: v.style, prompt: v.lyrics, duration: v.duration ?? undefined, ...tune, callBackUrl: cb });
        break;
      case 'stems': {
        path = '/api/v1/vocal-removal/generate';
        body = clean({ audioUrl: r.src.url, type: v.type, stemName: v.type === 'split_stem_advanced' ? v.stemName : undefined, callBackUrl: cb });
        // Stems from an upload aren't attached to a library track — show them in a modal when done.
        const id = await submitJob(path, body, { kind: 'stems', label: `Stems: ${r.src.name || 'uploaded audio'}`.slice(0, 60), ctx: { type: v.type, upload: true } }, btn);
        if (id) toast('Stems will appear in the queue when ready.', 'info');
        return;
      }
    }
    await submitJob(path, body, task, btn);
  }

  async function handleSourceFile(slot, file) {
    if (!file) return;
    if (!file.type.startsWith('audio/') && !/\.(mp3|wav|m4a|flac|ogg|aac)$/i.test(file.name)) return toast('Please choose an audio file.', 'err');
    state.remix.uploading = slot;
    renderView();
    try {
      const url = await uploadFile(file);
      state.remix[slot] = { url, name: file.name };
      toast('Upload complete.', 'ok');
    } catch (e) {
      toast(`Upload failed: ${e.message}`, 'err', 7000);
    } finally {
      state.remix.uploading = false;
      if (state.view === 'remix') renderView();
    }
  }

  // ---------------------------------------------------------------------------
  // View: Sounds
  // ---------------------------------------------------------------------------
  function viewSounds() {
    return `
      <div class="page-head"><div><h2>Sound lab</h2><p>Generate effects, loops and textures — with tempo and key control.</p></div></div>
      <form id="sounds-form" class="stack">
        <div class="card stack">
          ${fieldHTML({ name: 'prompt', label: 'Describe the sound', type: 'textarea', rows: 3, max: 500, required: true, placeholder: 'e.g. Warm vinyl crackle with a mellow Rhodes chord loop' })}
          <div class="chips">${SOUND_IDEAS.map((i) => `<button type="button" class="chip" data-act="sound-idea" data-idea="${esc(i)}">${esc(i)}</button>`).join('')}</div>
          <div class="grid-3">
            ${fieldHTML({ name: 'soundTempo', label: 'Tempo (BPM)', type: 'number', min: 1, maxv: 300, placeholder: 'Auto' })}
            ${fieldHTML({ name: 'soundKey', label: 'Key', type: 'select', value: 'Any', options: SOUND_KEYS.map((k) => ({ v: k, l: k })) })}
            <div class="stack" style="gap:10px;justify-content:flex-end">
              ${fieldHTML({ name: 'soundLoop', label: 'Seamless loop', type: 'toggle', value: false })}
              ${fieldHTML({ name: 'grabLyrics', label: 'Capture lyric subtitles', type: 'toggle', value: false })}
            </div>
          </div>
        </div>
        <div class="card stack"><h3>Model</h3>${modelPickerHTML()}</div>
        <div class="create-cta"><button class="btn primary lg" id="sounds-btn" type="submit">${icon('wave')} Generate sound</button></div>
      </form>`;
  }
  async function submitSounds(form) {
    const err = validateForm(form);
    if (err) return toast(err, 'err');
    const v = readForm(form);
    const model = state.settings.model;
    const body = clean({ prompt: v.prompt, model, soundLoop: v.soundLoop || undefined, soundTempo: v.soundTempo ?? undefined, soundKey: v.soundKey !== 'Any' ? v.soundKey : undefined, grabLyrics: v.grabLyrics || undefined, callBackUrl: callbackUrl() });
    await submitJob('/api/v1/generate/sounds', body, { kind: 'music', label: `Sound: ${v.prompt.slice(0, 44)}`, ctx: { model, op: 'sound', autoplay: true } }, $('#sounds-btn'));
  }

  // ---------------------------------------------------------------------------
  // View: Library
  // ---------------------------------------------------------------------------
  function filteredTracks() {
    const { q, filter, sort } = state.lib;
    let list = state.tracks.slice();
    if (filter === 'fav') list = list.filter((t) => t.fav);
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((t) => [t.title, t.tags, t.prompt].some((x) => (x || '').toLowerCase().includes(s)));
    }
    if (sort === 'old') list.reverse();
    if (sort === 'title') list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    if (sort === 'long') list.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    return list;
  }
  function viewLibrary() {
    const list = filteredTracks();
    return `
      <div class="page-head"><div><h2>Your library</h2><p>${state.tracks.length} track${state.tracks.length === 1 ? '' : 's'} saved in this browser.</p></div>
        <button class="btn" data-act="import-task">${icon('download')} Import by task ID</button></div>
      <div class="toolbar">
        <div class="search">${icon('search')}<input type="text" id="lib-q" placeholder="Search titles, styles, lyrics…" value="${esc(state.lib.q)}"/></div>
        <div class="segmented"><button data-act="lib-filter" data-v="all" class="${state.lib.filter === 'all' ? 'active' : ''}">All</button><button data-act="lib-filter" data-v="fav" class="${state.lib.filter === 'fav' ? 'active' : ''}">${icon('heart')} Loved</button></div>
        <select id="lib-sort" style="width:auto;border-radius:999px">
          ${[['new', 'Newest'], ['old', 'Oldest'], ['title', 'Title A–Z'], ['long', 'Longest']].map(([v, l]) => `<option value="${v}" ${state.lib.sort === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="track-list" data-tracklist="library">${list.length ? list.map(trackRowHTML).join('') : libraryEmpty()}</div>`;
  }
  const libraryEmpty = () => state.tracks.length
    ? `<div class="empty"><div class="big">🔎</div><h4>No matches</h4><p>Try a different search or filter.</p></div>`
    : `<div class="empty"><div class="big">🎧</div><h4>Your library is empty</h4><p>Songs you create will land here automatically.</p><button class="btn primary" data-act="nav" data-view="create" style="margin-top:12px">${icon('sparkles')} Create your first song</button></div>`;

  function trackRowHTML(t) {
    const playing = state.playingId === t.id;
    const playable = t.audioUrl || t.streamUrl;
    const badges = [
      t.model && `<span class="badge-s">${esc(modelName(t.model))}</span>`,
      t.op && t.op !== 'generate' && `<span class="badge-s">${esc({ extend: 'Extended', upload_extend: 'Extended', cover: 'Cover', upload_cover: 'Cover', vocals: '+Vocals', instrumental: '+Band', mashup: 'Mashup', replace: 'Edited', sound: 'Sound' }[t.op] || t.op)}</span>`,
      !t.audioUrl && t.streamUrl && '<span class="badge-s warn">Streaming</span>',
      t.extras?.wav && '<span class="badge-s ok">WAV</span>',
      t.extras?.video && '<span class="badge-s ok">Video</span>',
      t.extras?.stems && '<span class="badge-s ok">Stems</span>',
    ].filter(Boolean).join('');
    return `<div class="track ${playing ? 'playing' : ''}" data-track="${esc(t.id)}">
      <button class="art" data-act="play" data-id="${esc(t.id)}" aria-label="Play ${esc(t.title)}" ${playable ? '' : 'disabled'}>
        ${t.imageUrl ? `<img src="${esc(t.imageUrl)}" alt="" loading="lazy"/>` : ''}
        <span class="play-ov">${playing && !audio.paused ? '<span class="eq"><i></i><i></i><i></i><i></i></span>' : icon('play')}</span>
      </button>
      <div class="meta">
        <div class="title" data-act="open-track" data-id="${esc(t.id)}">${esc(t.title || 'Untitled')}</div>
        <div class="tags">${esc(t.tags || '')}</div>
        <div class="badges">${badges}</div>
      </div>
      <div class="actions">
        <span class="dur hide-sm">${t.duration ? fmtTime(t.duration) : ''}</span>
        <button class="btn ghost icon sm fav ${t.fav ? 'on' : ''}" data-act="fav" data-id="${esc(t.id)}" aria-label="Love">${icon('heart')}</button>
        ${t.audioUrl ? `<a class="btn ghost icon sm hide-sm" href="${esc(t.audioUrl)}" target="_blank" rel="noopener" download aria-label="Download MP3">${icon('download')}</a>` : ''}
        <button class="btn ghost icon sm" data-act="open-track" data-id="${esc(t.id)}" aria-label="More">${icon('more')}</button>
      </div>
    </div>`;
  }
  function renderTrackLists() {
    $$('[data-tracklist]').forEach((el) => {
      if (el.dataset.tracklist === 'library') {
        const list = filteredTracks();
        el.innerHTML = list.length ? list.map(trackRowHTML).join('') : libraryEmpty();
      } else {
        el.innerHTML = state.tracks.slice(0, 4).map(trackRowHTML).join('');
      }
    });
    if (state.view === 'create' && !$('[data-tracklist="recent"]') && state.tracks.length) {
      const sec = $('#main > section');
      if (sec) sec.insertAdjacentHTML('beforeend', recentHTML());
    }
    renderNav();
    const pt = currentTrack();
    const sub = $('.player .now .s');
    if (pt && sub) sub.textContent = `${pt.tags || ''}${!pt.audioUrl && pt.streamUrl ? ' · streaming' : ''}`;
  }

  // ---------------------------------------------------------------------------
  // Track detail + power tools
  // ---------------------------------------------------------------------------
  let openTrackId = null;
  function openTrack(id) {
    const t = state.tracks.find((x) => x.id === id);
    if (!t) return;
    openTrackId = id;
    openModal(trackDetailHTML(t), { wide: true, onClose: () => { openTrackId = null; } });
  }
  function refreshOpenDetail() {
    if (!openTrackId) return;
    const t = state.tracks.find((x) => x.id === openTrackId);
    const m = $('#modal-root .modal');
    if (t && m && m.dataset.detail === openTrackId) m.innerHTML = trackDetailHTML(t);
  }
  function trackDetailHTML(t) {
    const x = t.extras || {};
    const tools = [
      ['extend', 'extend', 'Extend', 'Keep the song going from any point.'],
      ['replace', 'replace', 'Replace section', 'Rewrite 10+ seconds of the song.'],
      ['stems', 'split', 'Split stems', 'Vocals, drums, bass and more.'],
      ['karaoke', 'karaoke', 'Karaoke', 'Word-synced lyrics on screen.'],
      ['wav', 'download', 'Get WAV', 'Lossless file for production.'],
      ['video', 'video', 'Music video', 'An MP4 visualizer for sharing.'],
      ['cover', 'image', 'Cover art', 'Generate new artwork options.'],
      ['persona', 'user', 'Make persona', 'Reuse this voice & vibe later.'],
      ['reuse', 'sparkles', 'Use as template', 'Load style & lyrics into Create.'],
      ['recover', 'refresh', 'Recover links', 'Restore playable audio URLs.'],
    ];
    const assets = [];
    if (x.wav) assets.push(`<div class="asset">${icon('download')}<div class="a-name">WAV file<small>Lossless</small></div><a class="btn sm" href="${esc(x.wav)}" target="_blank" rel="noopener" download>Download</a></div>`);
    if (x.stems?.items?.length) assets.push(...x.stems.items.map((s) => `<div class="asset">${icon('split')}<div class="a-name">${esc(s.name)}<small>Stem</small></div><audio controls preload="none" src="${esc(s.url)}"></audio><a class="btn sm" href="${esc(s.url)}" target="_blank" rel="noopener" download>${icon('download')}</a></div>`));
    if (x.stems?.taskId) assets.push(`<div class="asset">${icon('piano')}<div class="a-name">MIDI from stems<small>Note data for each instrument (JSON)</small></div>${state.mem.midi[t.id] ? `<button class="btn sm" data-act="dl-midi" data-id="${esc(t.id)}">Download</button>` : `<button class="btn sm" data-act="tool" data-tool="midi" data-id="${esc(t.id)}">Generate MIDI</button>`}</div>`);
    return `<div data-detail-wrap>
      ${modalHead(t.title || 'Untitled', esc(t.tags || ''))}
      <div class="modal-body">
        <div class="detail-hero">
          <button class="art" data-act="play" data-id="${esc(t.id)}" aria-label="Play">${t.imageUrl ? `<img src="${esc(t.imageUrl)}" alt=""/>` : ''}<span class="play-ov">${icon('play')}</span></button>
          <div class="stack" style="gap:10px">
            <div class="row">
              <button class="btn primary" data-act="play" data-id="${esc(t.id)}">${icon('play')} Play</button>
              ${t.audioUrl ? `<a class="btn" href="${esc(t.audioUrl)}" target="_blank" rel="noopener" download>${icon('download')} MP3</a>` : ''}
              <button class="btn ${t.fav ? 'fav on' : ''}" data-act="fav" data-id="${esc(t.id)}">${icon('heart')} ${t.fav ? 'Loved' : 'Love'}</button>
              <button class="btn ghost danger" data-act="del-track" data-id="${esc(t.id)}">${icon('trash')}</button>
            </div>
            <dl class="kv">
              <dt>Length</dt><dd>${t.duration ? fmtTime(t.duration) : '—'}</dd>
              <dt>Model</dt><dd>${esc(t.model ? modelName(t.model) : t.modelName || '—')}</dd>
              <dt>Task ID</dt><dd>${esc(t.taskId || '—')}</dd>
              <dt>Audio ID</dt><dd>${esc(t.id)}</dd>
              <dt>Created</dt><dd>${new Date(t.createdAt).toLocaleString()}</dd>
            </dl>
          </div>
        </div>
        <div><h3 style="margin:0 0 10px;font-size:15px">Power tools</h3>
          <div class="action-grid">${tools.map(([k, ic, n, d]) => `<button class="action" data-act="tool" data-tool="${k}" data-id="${esc(t.id)}">${icon(ic)}<b>${n}</b><span>${d}</span></button>`).join('')}</div></div>
        ${assets.length ? `<div><h3 style="margin:0 0 10px;font-size:15px">Files</h3><div class="asset-list">${assets.join('')}</div></div>` : ''}
        ${x.video ? `<div><h3 style="margin:0 0 10px;font-size:15px">Music video</h3><video controls preload="none" src="${esc(x.video)}"></video><div class="row" style="margin-top:8px"><a class="btn sm" href="${esc(x.video)}" target="_blank" rel="noopener" download>${icon('download')} Download MP4</a></div></div>` : ''}
        ${x.covers?.length ? `<div><h3 style="margin:0 0 4px;font-size:15px">Cover art options</h3><p class="sub" style="margin:0 0 10px">Click one to use it as this track's artwork.</p><div class="covers">${x.covers.map((u) => `<button data-act="set-cover" data-id="${esc(t.id)}" data-url="${esc(u)}"><img src="${esc(u)}" alt="Cover option" loading="lazy"/></button>`).join('')}</div></div>` : ''}
        ${t.prompt ? `<div><h3 style="margin:0 0 10px;font-size:15px">Lyrics / prompt</h3><div class="lyrics-view">${esc(t.prompt)}</div></div>` : ''}
      </div></div>`;
  }

  async function runTool(tool, id) {
    const t = state.tracks.find((x) => x.id === id);
    if (!t) return;
    const cb = callbackUrl();
    const model = MODELS.some((m) => m.id === t.model) ? t.model : state.settings.model;
    const needTask = () => { if (!t.taskId) { toast('This track has no task ID, so this tool is unavailable.', 'err'); return false; } return true; };

    switch (tool) {
      case 'extend':
        return formModal({
          title: 'Extend track', sub: `Continue “${esc(t.title || 'Untitled')}” from any point.`, submit: 'Extend',
          fields: [
            { name: 'continueAt', label: 'Continue from (seconds)', type: 'number', min: 1, maxv: t.duration ? Math.floor(t.duration) - 1 : undefined, value: t.duration ? Math.max(1, Math.floor(t.duration - 20)) : '', hint: t.duration ? `Track length: ${fmtTime(t.duration)}. Leave blank to continue from the end.` : 'Leave blank to continue from the end.' },
            { name: 'title', label: 'Title', type: 'text', value: t.title ? `${t.title} (Extended)`.slice(0, 100) : '', max: 100 },
            { name: 'style', label: 'Style', type: 'text', value: t.tags || '', max: limits(model).style },
            { name: 'instrumental', label: 'Instrumental continuation', type: 'toggle', value: false },
            { name: 'lyrics', label: 'Lyrics for the new part', type: 'textarea', cls: 'lyrics', max: limits(model).lyrics, placeholder: '[Verse 3]\n…', showIf: 'instrumental=false' },
            { name: 'negativeTags', label: 'Exclude styles', type: 'text', max: 1000 },
            { name: 'model', label: 'Model', type: 'select', value: model, options: MODELS.map((m) => ({ v: m.id, l: m.name + (m.legacy ? ' (legacy)' : '') })) },
            { type: 'html', html: `<details class="advanced"><summary>${icon('sparkles')} Advanced controls ${icon('chevron', 'chev')}</summary><div class="stack">${tuneFields({}).map(fieldHTML).join('')}</div></details>` },
          ],
          onSubmit: (v) => {
            const body = clean({ audioId: t.id, taskId: t.taskId, model: v.model, continueAt: v.continueAt ?? undefined, title: v.title, style: v.style, prompt: v.instrumental ? undefined : v.lyrics, negativeTags: v.negativeTags, ...tunePayload(v, v.model), callBackUrl: cb });
            if (v.instrumental) { body.instrumental = true; delete body.vocalGender; }
            return submitJob('/api/v1/generate/extend', body, { kind: 'music', label: `Extend: ${t.title || 'track'}`, ctx: { model: v.model, op: 'extend', parentId: t.id } });
          },
        });
      case 'replace':
        if (!needTask()) return;
        return formModal({
          title: 'Replace a section', sub: 'Pick a window of at least 10 seconds and rewrite it. The rest of the song stays.', submit: 'Replace section',
          fields: [
            { type: 'html', html: '<div class="grid-2">' },
            { name: 'infillStartS', label: 'Start (seconds)', type: 'number', min: 0, step: 0.01, required: true, value: 30 },
            { name: 'infillEndS', label: 'End (seconds)', type: 'number', min: 0, step: 0.01, required: true, value: 45 },
            { type: 'html', html: '</div>' },
            { name: 'prompt', label: 'New lyrics for this section', type: 'textarea', cls: 'lyrics', required: true, rows: 4, placeholder: '[Chorus]\n…' },
            { name: 'fullLyrics', label: 'Full song lyrics after the change', type: 'textarea', cls: 'lyrics', required: true, value: t.prompt || '', hint: 'Paste the complete lyrics with your edit included.' },
            { name: 'tags', label: 'Style', type: 'text', required: true, value: t.tags || '' },
            { name: 'title', label: 'Title', type: 'text', required: true, value: t.title || '' },
            { name: 'negativeTags', label: 'Exclude styles', type: 'text' },
          ],
          validate: (v) => (v.infillEndS - v.infillStartS < 10 ? 'The section must be at least 10 seconds long.' : null),
          onSubmit: (v) => submitJob('/api/v1/generate/replace-section', clean({ taskId: t.taskId, audioId: t.id, prompt: v.prompt, fullLyrics: v.fullLyrics, tags: v.tags, title: v.title, negativeTags: v.negativeTags, infillStartS: v.infillStartS, infillEndS: v.infillEndS, callBackUrl: cb }),
            { kind: 'music', label: `Edit: ${t.title || 'track'}`, ctx: { model, op: 'replace', parentId: t.id } }),
        });
      case 'stems':
        if (!needTask()) return;
        return formModal({
          title: 'Split into stems', sub: 'Isolate vocals, drums, bass and more.', submit: 'Split stems',
          fields: [
            { name: 'type', label: 'Separation', type: 'seg', value: 'separate_vocal', options: [{ v: 'separate_vocal', l: 'Vocals + instrumental' }, { v: 'split_stem', l: 'All instruments' }, { v: 'split_stem_advanced', l: 'One instrument' }] },
            { name: 'stemName', label: 'Instrument to isolate', type: 'select', value: 'Lead Vocal', options: STEM_NAMES.map((s) => ({ v: s, l: s })), showIf: 'type=split_stem_advanced' },
          ],
          onSubmit: (v) => submitJob('/api/v1/vocal-removal/generate', clean({ taskId: t.taskId, audioId: t.id, type: v.type, stemName: v.type === 'split_stem_advanced' ? v.stemName : undefined, callBackUrl: cb }),
            { kind: 'stems', label: `Stems: ${t.title || 'track'}`, ctx: { trackId: t.id, type: v.type } }),
        });
      case 'midi': {
        const sid = t.extras?.stems?.taskId;
        if (!sid) return toast('Split stems first — MIDI is generated from separated stems.', 'err');
        return submitJob('/api/v1/midi/generate', { taskId: sid, callBackUrl: cb }, { kind: 'midi', label: `MIDI: ${t.title || 'track'}`, ctx: { trackId: t.id } });
      }
      case 'wav':
        if (!needTask()) return;
        return submitJob('/api/v1/wav/generate', { taskId: t.taskId, audioId: t.id, callBackUrl: cb }, { kind: 'wav', label: `WAV: ${t.title || 'track'}`, ctx: { trackId: t.id } });
      case 'video':
        if (!needTask()) return;
        return formModal({
          title: 'Create a music video', sub: 'An MP4 with visuals synced to your track.', submit: 'Create video',
          fields: [
            { name: 'author', label: 'Artist name', type: 'text', max: 50, placeholder: 'Shown at the start of the video' },
            { name: 'domainName', label: 'Watermark / brand', type: 'text', max: 50, placeholder: 'e.g. yourname.com' },
          ],
          onSubmit: (v) => submitJob('/api/v1/mp4/generate', clean({ taskId: t.taskId, audioId: t.id, author: v.author, domainName: v.domainName, callBackUrl: cb }),
            { kind: 'video', label: `Video: ${t.title || 'track'}`, ctx: { trackId: t.id } }),
        });
      case 'cover': {
        if (!needTask()) return;
        const siblings = state.tracks.filter((x) => x.taskId === t.taskId).map((x) => x.id);
        return submitJob('/api/v1/suno/cover/generate', { taskId: t.taskId, callBackUrl: cb }, { kind: 'cover', label: `Cover art: ${t.title || 'track'}`, ctx: { trackIds: siblings, trackId: t.id } });
      }
      case 'persona':
        if (!needTask()) return;
        return formModal({
          title: 'Create a persona', sub: 'Capture this track\'s voice and vibe, then apply it to future songs.', submit: 'Create persona',
          fields: [
            { name: 'name', label: 'Persona name', type: 'text', required: true, placeholder: 'e.g. Midnight Soul Singer' },
            { name: 'description', label: 'Describe the sound', type: 'textarea', required: true, rows: 3, placeholder: 'Genre, mood, instrumentation, vocal qualities…' },
            { name: 'style', label: 'Style label', type: 'text', value: t.tags || '' },
            { type: 'html', html: '<div class="grid-2">' },
            { name: 'vocalStart', label: 'Analyze from (s)', type: 'number', min: 0, value: 0 },
            { name: 'vocalEnd', label: 'Analyze to (s)', type: 'number', min: 1, value: 30 },
            { type: 'html', html: '</div>' },
          ],
          validate: (v) => (v.vocalEnd != null && v.vocalStart != null && v.vocalEnd <= v.vocalStart ? '"Analyze to" must be after "Analyze from".' : null),
          onSubmit: async (v) => {
            try {
              const j = await api('/api/v1/generate/generate-persona', { method: 'POST', body: clean({ taskId: t.taskId, audioId: t.id, name: v.name, description: v.description, style: v.style, vocalStart: v.vocalStart ?? undefined, vocalEnd: v.vocalEnd ?? undefined }) });
              const pid = j.data?.personaId;
              if (!pid) throw new ApiError('No persona ID was returned.', 0);
              state.personas.unshift({ id: pid, name: j.data.name || v.name, from: t.title, createdAt: Date.now() });
              save.personas();
              toast(`Persona “${v.name}” saved. Find it under Advanced controls when creating.`, 'ok', 6000);
              refreshCredits();
              return true;
            } catch (e) { toast(e.message, 'err', 7000); return false; }
          },
        });
      case 'karaoke':
        if (!needTask()) return;
        return openKaraoke(t);
      case 'reuse':
        Object.assign(state.form, { mode: 'custom', style: t.tags || '', lyrics: t.prompt || '', title: t.title ? `${t.title} II` : '', instrumental: false });
        save.form();
        closeModal();
        setView('create');
        return toast('Loaded into Custom mode. Tweak and create!', 'ok');
      case 'recover':
        if (!needTask()) return;
        return submitJob('/api/v1/suno/recovery', { sunoTaskId: t.taskId, callBackUrl: cb }, { kind: 'recovery', label: `Recover: ${t.title || 'track'}`, ctx: { trackId: t.id } });
    }
  }

  function formModal({ title, sub, fields, submit, onSubmit, validate }) {
    openModal(`${modalHead(title, sub)}<form class="modal-form"><div class="modal-body">${fields.map(fieldHTML).join('')}</div>
      <div class="modal-foot"><button type="button" class="btn ghost" data-act="close-modal">Cancel</button><button type="submit" class="btn primary">${icon('sparkles')} ${esc(submit)}</button></div></form>`);
    const form = $('#modal-root form');
    evalShows(form);
    updateCounters(form);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = validateForm(form);
      if (err) return toast(err, 'err');
      const v = readForm(form);
      const vErr = validate && validate(v);
      if (vErr) return toast(vErr, 'err');
      const btn = $('button[type=submit]', form);
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Working…';
      const ok = await onSubmit(v);
      if (ok) closeModal();
      else { btn.disabled = false; btn.innerHTML = `${icon('sparkles')} ${esc(submit)}`; }
    });
  }

  // ---------------------------------------------------------------------------
  // Karaoke (timestamped lyrics)
  // ---------------------------------------------------------------------------
  async function openKaraoke(t) {
    let words = state.mem.words[t.id];
    if (!words) {
      toast('Syncing lyrics…', 'info', 2000);
      try {
        const j = await api('/api/v1/generate/get-timestamped-lyrics', { method: 'POST', body: { taskId: t.taskId, audioId: t.id } });
        words = j.data?.alignedWords || [];
        state.mem.words[t.id] = words;
      } catch (e) { return toast(e.message, 'err', 7000); }
    }
    if (!words.length) return toast('No synced lyrics are available for this track (instrumentals have none).', 'info');
    closeModal();
    if (state.playingId !== t.id) playTrack(t.id);
    const html = words.map((w, i) => {
      let txt = esc(w.word);
      txt = txt.replace(/\[([^\]]+)\]/g, '<span class="sec">$1</span>').replace(/\n/g, '<br/>');
      return `<span class="w" data-i="${i}" data-s="${w.startS}">${txt}</span> `;
    }).join('');
    const el = document.createElement('div');
    el.className = 'karaoke';
    el.id = 'karaoke';
    el.innerHTML = `<div class="k-head"><span class="logo"><span class="logo-mark">${icon('karaoke')}</span></span><div style="flex:1;min-width:0"><div style="font-weight:800;font-size:18px">${esc(t.title || 'Untitled')}</div><div style="opacity:.6;font-size:13px">Karaoke mode · click a word to jump</div></div>
      <button class="btn icon" data-act="toggle-play" aria-label="Play/pause">${icon(audio.paused ? 'play' : 'pause')}</button><button class="btn" data-act="close-karaoke">${icon('x')} Close</button></div>
      <div class="k-body">${html}</div>`;
    document.body.appendChild(el);
    karaoke = { el, words, last: -1 };
  }
  let karaoke = null;
  function updateKaraoke(time) {
    if (!karaoke) return;
    const { words, el } = karaoke;
    let idx = -1;
    for (let i = 0; i < words.length; i++) { if (words[i].startS <= time) idx = i; else break; }
    if (idx === karaoke.last) return;
    karaoke.last = idx;
    $$('.w', el).forEach((w, i) => { w.classList.toggle('past', i < idx); w.classList.toggle('now', i === idx); });
    const cur = $(`.w[data-i="${idx}"]`, el);
    if (cur) {
      const body = $('.k-body', el);
      const top = cur.offsetTop - body.clientHeight * 0.35;
      body.scrollTo({ top, behavior: 'smooth' });
    }
  }
  function closeKaraoke() { if (karaoke) { karaoke.el.remove(); karaoke = null; } }

  // ---------------------------------------------------------------------------
  // Player
  // ---------------------------------------------------------------------------
  const audio = $('#audio');
  function currentTrack() { return state.tracks.find((t) => t.id === state.playingId); }
  function playableList() { return (state.view === 'library' ? filteredTracks() : state.tracks).filter((t) => t.audioUrl || t.streamUrl); }

  function playTrack(id) {
    const t = state.tracks.find((x) => x.id === id);
    if (!t) return;
    const src = t.audioUrl || t.streamUrl;
    if (!src) return toast('This track is still being generated.', 'info');
    if (state.playingId === id && audio.src) {
      audio.paused ? audio.play().catch(() => { }) : audio.pause();
      return;
    }
    state.playingId = id;
    audio.src = src;
    audio.play().catch(() => toast('Press play to start audio (your browser blocked autoplay).', 'info'));
    renderPlayer();
    renderTrackLists();
  }
  function skip(dir) {
    const list = playableList();
    if (!list.length) return;
    const i = list.findIndex((t) => t.id === state.playingId);
    const n = list[(i + dir + list.length) % list.length];
    if (n) { state.playingId = null; playTrack(n.id); }
  }

  function renderPlayer() {
    const t = currentTrack();
    const root = $('#player-root');
    if (!t || !state.key) { root.innerHTML = ''; document.body.classList.remove('has-player'); return; }
    document.body.classList.add('has-player');
    root.innerHTML = `
      <div class="player ${audio.paused ? 'paused' : ''}" role="region" aria-label="Player">
        <div class="now">
          <button class="art" data-act="open-track" data-id="${esc(t.id)}" aria-label="Open track">${t.imageUrl ? `<img src="${esc(t.imageUrl)}" alt=""/>` : ''}</button>
          <div style="min-width:0"><div class="t">${esc(t.title || 'Untitled')}</div><div class="s">${esc(t.tags || '')}${!t.audioUrl && t.streamUrl ? ' · streaming' : ''}</div></div>
        </div>
        <div class="center">
          <div class="controls">
            <button class="btn ghost icon" data-act="prev" aria-label="Previous">${icon('prev')}</button>
            <button class="pp" data-act="toggle-play" aria-label="Play/pause" id="pp">${icon(audio.paused ? 'play' : 'pause')}</button>
            <button class="btn ghost icon" data-act="next" aria-label="Next">${icon('next')}</button>
          </div>
          <div class="seek"><span id="cur">${fmtTime(audio.currentTime)}</span><input type="range" id="seek" min="0" max="1000" value="0" aria-label="Seek"/><span id="dur">${fmtTime(audio.duration || t.duration)}</span></div>
        </div>
        <div class="right">
          <button class="btn ghost icon" data-act="tool" data-tool="karaoke" data-id="${esc(t.id)}" title="Karaoke" aria-label="Karaoke">${icon('karaoke')}</button>
          <button class="btn ghost icon fav ${t.fav ? 'on' : ''}" data-act="fav" data-id="${esc(t.id)}" aria-label="Love">${icon('heart')}</button>
          <button class="btn ghost icon keep" data-act="toggle-play" aria-label="Play/pause" style="display:none" id="pp-sm">${icon(audio.paused ? 'play' : 'pause')}</button>
        </div>
      </div>`;
    if (window.matchMedia('(max-width: 760px)').matches) { const b = $('#pp-sm'); if (b) b.style.display = ''; }
  }
  function syncPlayState() {
    const p = $('.player');
    if (p) p.classList.toggle('paused', audio.paused);
    ['#pp', '#pp-sm'].forEach((s) => { const b = $(s); if (b) b.innerHTML = icon(audio.paused ? 'play' : 'pause'); });
    const kb = $('#karaoke [data-act="toggle-play"]');
    if (kb) kb.innerHTML = icon(audio.paused ? 'play' : 'pause');
    $$('.track').forEach((el) => {
      const on = el.dataset.track === state.playingId;
      el.classList.toggle('playing', on);
      const ov = $('.play-ov', el);
      if (ov) ov.innerHTML = on && !audio.paused ? '<span class="eq"><i></i><i></i><i></i><i></i></span>' : icon('play');
    });
  }
  audio.addEventListener('play', syncPlayState);
  audio.addEventListener('pause', syncPlayState);
  audio.addEventListener('ended', () => skip(1));
  audio.addEventListener('loadedmetadata', () => { const d = $('#dur'); if (d && isFinite(audio.duration)) d.textContent = fmtTime(audio.duration); });
  audio.addEventListener('timeupdate', () => {
    const s = $('#seek');
    const dur = isFinite(audio.duration) ? audio.duration : currentTrack()?.duration;
    if (s && dur && !s.matches(':active')) s.value = String(Math.round((audio.currentTime / dur) * 1000));
    const c = $('#cur');
    if (c) c.textContent = fmtTime(audio.currentTime);
    updateKaraoke(audio.currentTime);
  });
  audio.addEventListener('error', () => {
    if (currentTrack() && audio.getAttribute('src')) toast('Could not play this audio. The link may have expired — try “Recover links” in the track menu.', 'err', 6000);
  });

  // ---------------------------------------------------------------------------
  // Misc actions
  // ---------------------------------------------------------------------------
  function syncChips() {
    $$('.chip[data-chip]').forEach((c) => {
      const el = $(`[data-f="${c.dataset.target}"]`);
      if (!el) return;
      const parts = el.value.split(',').map((s) => s.trim().toLowerCase());
      c.classList.toggle('on', parts.includes(c.dataset.chip.toLowerCase()));
    });
  }
  function toggleChip(target, chip) {
    const el = $(`[data-f="${target}"]`);
    if (!el) return;
    let parts = el.value.split(',').map((s) => s.trim()).filter(Boolean);
    const i = parts.findIndex((p) => p.toLowerCase() === chip.toLowerCase());
    if (i >= 0) parts.splice(i, 1); else parts.push(chip);
    el.value = parts.join(', ');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function insertAtCursor(el, text) {
    const s = el.selectionStart ?? el.value.length;
    const e = el.selectionEnd ?? el.value.length;
    const before = el.value.slice(0, s);
    const pre = before && !before.endsWith('\n') ? '\n\n' : '';
    const ins = `${pre}${text}\n`;
    el.value = before + ins + el.value.slice(e);
    el.focus();
    el.selectionStart = el.selectionEnd = s + ins.length;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function pickFile(accept, multiple = false) {
    return new Promise((resolve) => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = accept;
      inp.multiple = multiple;
      inp.onchange = () => resolve(Array.from(inp.files || []));
      inp.click();
    });
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast('Copied to clipboard.', 'ok', 1800); }
    catch { toast('Could not copy — your browser blocked clipboard access.', 'err'); }
  }

  function downloadJSON(obj, name) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function importTaskModal() {
    formModal({
      title: 'Import by task ID', sub: 'Pull in songs from any music task on your account — handy after clearing your browser.', submit: 'Import',
      fields: [{ name: 'taskId', label: 'Task ID', type: 'text', required: true, placeholder: 'e.g. 5c79…be8e' }],
      onSubmit: async (v) => {
        try {
          const j = await api(TASK_KINDS.music.path(v.taskId));
          const d = j.data || {};
          const items = d.response?.sunoData || d.response?.data || [];
          const fake = { id: v.taskId, ctx: { op: d.operationType === 'generate' ? 'generate' : d.operationType } };
          try { const p = JSON.parse(d.param || '{}'); if (p.model) fake.ctx.model = p.model; } catch { }
          items.forEach((it) => upsertTrack(it, fake));
          save.tracks();
          renderTrackLists();
          if (d.status && d.status !== 'SUCCESS' && !isFailFlag(d.status)) {
            addTask({ id: v.taskId, kind: 'music', label: `Imported task ${v.taskId.slice(0, 8)}…`, ctx: fake.ctx });
          }
          toast(items.length ? `Imported ${items.length} track${items.length === 1 ? '' : 's'}.` : 'No tracks found on that task yet.', items.length ? 'ok' : 'info');
          return true;
        } catch (e) { toast(e.message, 'err', 7000); return false; }
      },
    });
  }

  function aboutModal() {
    openModal(`${modalHead('How Suno Studio works')}
      <div class="modal-body">
        <p style="margin:0">Suno Studio is a client for the <a href="https://docs.sunoapi.org" target="_blank" rel="noopener">SunoAPI</a>. Everything you do here calls the API with <b>your</b> key and spends <b>your</b> credits.</p>
        <ul style="margin:0;padding-left:20px;color:var(--text-muted);line-height:1.8">
          <li><b>Create</b> — Simple (describe it) or Custom (title, style, lyrics, advanced knobs, personas, length).</li>
          <li><b>Lyrics</b> — generate lyric options and send them to a song.</li>
          <li><b>Remix</b> — upload audio to cover, extend, add vocals, add instrumentals, mash up, or split stems.</li>
          <li><b>Sounds</b> — effects and loops with BPM and key.</li>
          <li><b>Library</b> — extend, replace sections, stems → MIDI, WAV, music video, cover art, karaoke, personas.</li>
        </ul>
        <p class="small muted" style="margin:0">Jobs are asynchronous: the app submits a task and polls its status every few seconds. Your library, personas and queue are stored in this browser only. Generated files are kept by Suno for roughly 15 days; uploaded source files for 3 days.</p>
        <p class="small faint" style="margin:0">Connection: ${netMode === 'proxy' ? 'via this site\'s API proxy' : 'direct to api.sunoapi.org'}.</p>
      </div>`);
  }

  // ---------------------------------------------------------------------------
  // Global event delegation
  // ---------------------------------------------------------------------------
  const actions = {
    theme: (el) => Theme.set(el.dataset.themeBtn),
    'toggle-key': (el) => { const k = $('#key'); k.type = k.type === 'password' ? 'text' : 'password'; el.innerHTML = icon(k.type === 'password' ? 'eye' : 'eyeOff'); },
    nav: (el) => { closeModal(); setView(el.dataset.view); },
    menu: () => { const m = $('#menu'); m.hidden = !m.hidden; },
    'refresh-credits': async (el) => { el.innerHTML = '<span class="spinner"></span>'; await refreshCredits(false); renderCredits(); },
    'change-key': () => { if (confirm('Switch to a different API key? Your library stays in this browser.')) { KeyStore.clear(); state.key = null; audio.pause(); renderGate(); } },
    logout: () => { if (confirm('Sign out and forget your API key on this device? Your library stays in this browser.')) { KeyStore.clear(); state.key = null; state.playingId = null; audio.pause(); renderGate(); } },
    'clear-lib': () => { if (confirm('Delete every track, lyric draft, persona and queued job stored in this browser? (Nothing is deleted from your Suno account.)')) { state.tracks = []; state.tasks = []; state.lyrics = []; state.personas = []; ['tracks', 'tasks', 'lyrics', 'personas'].forEach((k) => save[k]()); state.playingId = null; audio.pause(); renderApp(); toast('Local library cleared.', 'ok'); } },
    'export-lib': () => downloadJSON({ exportedAt: new Date().toISOString(), tracks: state.tracks, personas: state.personas, lyrics: state.lyrics }, `suno-studio-library-${Date.now()}.json`),
    'import-task': () => importTaskModal(),
    about: () => aboutModal(),
    scrim: (el, ev) => { if (ev.target === el) closeModal(); },
    'close-modal': () => closeModal(),
    mode: (el) => { const form = $('#create-form'); if (form) Object.assign(state.form, readForm(form)); state.form.mode = el.dataset.mode; save.form(); renderView(); },
    model: (el) => {
      const form = $('#main form');
      if (form && form.id === 'create-form') Object.assign(state.form, readForm(form));
      state.settings.model = el.dataset.model; save.settings(); save.form();
      if (form && form.id !== 'create-form') { const picker = el.closest('.card'); if (picker) { $$('.model', picker).forEach((m) => m.classList.toggle('on', m.dataset.model === el.dataset.model)); } }
      else renderView();
    },
    legacy: () => { const form = $('#create-form'); if (form) Object.assign(state.form, readForm(form)); state.settings.showLegacy = !state.settings.showLegacy; save.settings(); renderView(); },
    surprise: () => { const el = $('[data-f="prompt"]'); let idea; do { idea = IDEAS[Math.floor(Math.random() * IDEAS.length)]; } while (idea === el.value && IDEAS.length > 1); el.value = idea; el.dispatchEvent(new Event('input', { bubbles: true })); el.focus(); },
    chip: (el) => toggleChip(el.dataset.target, el.dataset.chip),
    'insert-tag': (el) => insertAtCursor($('[data-f="lyrics"]'), el.dataset.tag),
    seg: (el) => {
      const wrap = el.closest('[data-seg]');
      $$('button', wrap).forEach((b) => b.classList.toggle('active', b === el));
      const hid = $(`input[data-f="${wrap.dataset.seg}"]`, wrap.parentElement);
      hid.value = el.dataset.v;
      hid.dispatchEvent(new Event('input', { bubbles: true }));
    },
    'range-auto': (el) => {
      const scope = el.closest('form') || document;
      const r = $(`input[data-f="${el.dataset.for}"]`, scope);
      r.dataset.auto = '1';
      $(`[data-range-out="${el.dataset.for}"]`, scope).textContent = 'Auto';
      el.textContent = '';
      r.dispatchEvent(new Event('input', { bubbles: true }));
    },
    'boost-style': async (el) => {
      const inp = $('[data-f="style"]');
      if (!inp.value.trim()) return toast('Type a few style words first, then boost.', 'info');
      const orig = el.innerHTML;
      el.disabled = true; el.innerHTML = '<span class="spinner"></span> Boosting…';
      try {
        const j = await api('/api/v1/style/generate', { method: 'POST', body: { content: inp.value.trim() } });
        const res = j.data?.result;
        if (res) { inp.value = res.slice(0, limits(state.settings.model).style); inp.dispatchEvent(new Event('input', { bubbles: true })); toast('Style boosted ✨', 'ok'); }
        else toast('The boost did not return a result — try again in a moment.', 'info');
        refreshCredits();
      } catch (e) { toast(e.message, 'err', 6000); }
      finally { el.disabled = false; el.innerHTML = orig; }
    },
    'ai-lyrics': () => {
      const f = readForm($('#create-form'));
      const seed = [f.title, f.style].filter(Boolean).join(' — ');
      formModal({
        title: 'Write lyrics with AI', sub: 'Describe the song. Options appear here when they\'re ready (usually under a minute).', submit: 'Write lyrics',
        fields: [{ name: 'p', label: 'Theme, story and mood', type: 'textarea', rows: 3, max: 200, required: true, value: seed.slice(0, 200), placeholder: 'e.g. Dancing alone in the kitchen after a long week, playful and warm' }],
        onSubmit: async (v) => !!(await submitJob('/api/v1/lyrics', { prompt: v.p, callBackUrl: callbackUrl() }, { kind: 'lyrics', label: v.p.slice(0, 60), ctx: { pickForCreate: true } })),
      });
    },
    'lyric-idea': (el) => { const t = $('[data-f="lprompt"]'); t.value = el.dataset.idea; t.dispatchEvent(new Event('input', { bubbles: true })); },
    'sound-idea': (el) => { const t = $('[data-f="prompt"]'); t.value = el.dataset.idea; t.dispatchEvent(new Event('input', { bubbles: true })); },
    'use-lyrics': (el) => useLyrics(el.dataset.lid, Number(el.dataset.i)),
    'del-lyrics': (el) => { state.lyrics = state.lyrics.filter((l) => l.id !== el.dataset.id); save.lyrics(); renderView(); },
    copy: (el) => copyText(el.dataset.text),
    'remix-op': (el) => { state.remix.op = el.dataset.op; renderView(); },
    'pick-src': async (el, ev) => { if (ev.target.closest('audio')) return; const [f] = await pickFile('audio/*'); handleSourceFile(el.dataset.slot, f); },
    'clear-src': (el) => { state.remix[el.dataset.slot] = null; renderView(); },
    'pick-ref': async (el, ev) => {
      if (ev.target.closest('[data-act="clear-ref"]')) return;
      const ref = el.dataset.ref;
      const files = await pickFile(el.dataset.accept, ref === 'refImages');
      if (!files.length) return;
      const form = $('#create-form'); if (form) Object.assign(state.form, readForm(form));
      el.innerHTML = '<span class="spinner"></span><b>Uploading…</b>';
      try {
        const urls = [];
        for (const f of files.slice(0, ref === 'refImages' ? 5 - state.form.refImages.length : 1)) urls.push(await uploadFile(f));
        if (ref === 'refImages') state.form.refImages = [...state.form.refImages, ...urls].slice(0, 5);
        else state.form[ref] = urls[0];
        save.form();
        toast('Reference attached.', 'ok');
      } catch (e) { toast(`Upload failed: ${e.message}`, 'err', 7000); }
      renderView();
      const d = $('details.advanced'); if (d) d.open = true;
    },
    'clear-ref': (el) => { const form = $('#create-form'); if (form) Object.assign(state.form, readForm(form)); state.form[el.dataset.ref] = el.dataset.ref === 'refImages' ? [] : ''; save.form(); renderView(); const d = $('details.advanced'); if (d) d.open = true; },
    play: (el) => playTrack(el.dataset.id),
    'toggle-play': () => { if (!audio.src) return; audio.paused ? audio.play().catch(() => { }) : audio.pause(); },
    prev: () => skip(-1),
    next: () => skip(1),
    fav: (el) => {
      const t = state.tracks.find((x) => x.id === el.dataset.id); if (!t) return;
      t.fav = !t.fav; save.tracks(); renderTrackLists(); renderPlayer(); refreshOpenDetail();
    },
    'open-track': (el) => openTrack(el.dataset.id),
    'del-track': (el) => {
      const t = state.tracks.find((x) => x.id === el.dataset.id);
      if (!t || !confirm(`Remove “${t.title || 'Untitled'}” from your local library?`)) return;
      state.tracks = state.tracks.filter((x) => x.id !== t.id); save.tracks();
      if (state.playingId === t.id) { audio.pause(); state.playingId = null; renderPlayer(); }
      closeModal(); renderTrackLists();
    },
    tool: (el) => runTool(el.dataset.tool, el.dataset.id),
    'set-cover': (el) => { const t = state.tracks.find((x) => x.id === el.dataset.id); if (!t) return; t.imageUrl = el.dataset.url; save.tracks(); renderTrackLists(); renderPlayer(); refreshOpenDetail(); toast('Artwork updated.', 'ok'); },
    'dl-midi': (el) => { const m = state.mem.midi[el.dataset.id]; if (m) downloadJSON(m, `midi-${el.dataset.id}.json`); },
    'lib-filter': (el) => { state.lib.filter = el.dataset.v; renderView(); },
    'clear-done': () => { state.tasks = state.tasks.filter((t) => t.status === 'pending'); save.tasks(); renderView(); },
    'retry-poll': (el) => { const t = state.tasks.find((x) => x.id === el.dataset.id); if (!t) return; Object.assign(t, { status: 'pending', stage: 'Checking again…', error: null, errors: 0, createdAt: Date.now() }); renderQueue(); schedulePoll(200); },
    'close-karaoke': () => closeKaraoke(),
  };

  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]');
    const menu = $('#menu');
    if (menu && !menu.hidden && !ev.target.closest('.menu')) menu.hidden = true;
    if (!el) return;
    const fn = actions[el.dataset.act];
    if (!fn) return;
    if (el.tagName === 'BUTTON' && el.type !== 'submit') ev.preventDefault();
    if (el.closest('#menu')) menu.hidden = true;
    fn(el, ev);
  });

  // Karaoke: click a word to seek.
  document.addEventListener('click', (ev) => {
    const w = ev.target.closest('#karaoke .w');
    if (w) { audio.currentTime = Number(w.dataset.s) || 0; if (audio.paused) audio.play().catch(() => { }); }
  });

  const autosave = debounce(() => {
    const f = $('#create-form');
    if (f) { Object.assign(state.form, readForm(f)); save.form(); }
  }, 300);

  document.addEventListener('input', (ev) => {
    const el = ev.target;
    if (el.id === 'seek') {
      const dur = isFinite(audio.duration) ? audio.duration : currentTrack()?.duration;
      if (dur) audio.currentTime = (Number(el.value) / 1000) * dur;
      return;
    }
    if (el.id === 'lib-q') { state.lib.q = el.value; renderTrackLists(); return; }
    if (el.dataset.f === 'lprompt') state.lyricPrompt = el.value;
    if (el.type === 'range' && el.dataset.f) {
      delete el.dataset.auto;
      const scope = el.closest('form') || document;
      const out = $(`[data-range-out="${el.dataset.f}"]`, scope);
      if (out) out.textContent = el.dataset.f === 'duration' ? fmtTime(Number(el.value)) : Number(el.value).toFixed(Number(el.step) < 1 ? 2 : 0);
      const rb = $(`[data-act="range-auto"][data-for="${el.dataset.f}"]`, scope);
      if (rb && ev.isTrusted) rb.textContent = 'reset';
    }
    const scope = el.closest('form');
    if (scope) { updateCounters(scope); evalShows(scope); }
    if (el.closest('#create-form')) { autosave(); if (el.dataset.f === 'style' || el.dataset.f === 'simpleStyle') syncChips(); }
  });
  document.addEventListener('change', (ev) => {
    if (ev.target.id === 'lib-sort') { state.lib.sort = ev.target.value; renderTrackLists(); }
    const scope = ev.target.closest('form');
    if (scope) evalShows(scope);
  });

  document.addEventListener('submit', (ev) => {
    const f = ev.target;
    if (f.id === 'create-form') { ev.preventDefault(); submitCreate(f); }
    if (f.id === 'remix-form') { ev.preventDefault(); submitRemix(f); }
    if (f.id === 'sounds-form') { ev.preventDefault(); submitSounds(f); }
    if (f.id === 'lyrics-form') {
      ev.preventDefault();
      const err = validateForm(f);
      if (err) return toast(err, 'err');
      const v = readForm(f);
      submitJob('/api/v1/lyrics', { prompt: v.lprompt, callBackUrl: callbackUrl() }, { kind: 'lyrics', label: v.lprompt.slice(0, 60) }, $('#lyrics-btn'));
    }
  });

  // Drag & drop audio into remix dropzones.
  document.addEventListener('dragover', (ev) => { const dz = ev.target.closest('[data-drop]'); if (dz) { ev.preventDefault(); dz.classList.add('drag'); } });
  document.addEventListener('dragleave', (ev) => { const dz = ev.target.closest('[data-drop]'); if (dz) dz.classList.remove('drag'); });
  document.addEventListener('drop', (ev) => {
    const dz = ev.target.closest('[data-drop]');
    if (!dz) return;
    ev.preventDefault();
    dz.classList.remove('drag');
    handleSourceFile(dz.dataset.drop, ev.dataTransfer.files[0]);
  });
  // Pasting a URL into the remix source box selects it.
  document.addEventListener('change', (ev) => {
    const slot = ev.target.dataset?.srcUrl;
    if (!slot) return;
    const v = ev.target.value.trim();
    state.remix[slot] = v ? { url: v } : null;
    renderView();
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') { if (karaoke) closeKaraoke(); else closeModal(); }
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
    if (ev.code === 'Space' && !typing && audio.src && state.key) { ev.preventDefault(); audio.paused ? audio.play().catch(() => { }) : audio.pause(); }
  });

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => Theme.set(Theme.get()));

  async function boot() {
    Theme.set(Theme.get());
    const k = KeyStore.load();
    if (!k) return renderGate();
    state.key = k;
    renderApp();
    refreshCredits();
    schedulePoll(800);
  }
  boot();
})();
