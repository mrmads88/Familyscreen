/* Familietavlen – data: børn, opgaver, stjerner, belønninger og indstillinger.
   Alt gemmes i browserens localStorage på skærmen. Brug "Download backup" under Forældre. */
const Store = (() => {
  const KEY = 'familietavle.v1';
  const uid = () => Math.random().toString(36).slice(2, 10);
  const pad = n => String(n).padStart(2, '0');
  const dkey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dow = (d = new Date()) => (d.getDay() + 6) % 7; // 0 = mandag
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

  const LEVELS = [
    { min: 0, name: 'Opgave-spire', emoji: '🌱' },
    { min: 50, name: 'Hjælper', emoji: '🧹' },
    { min: 150, name: 'Stjernejæger', emoji: '⭐' },
    { min: 300, name: 'Superhelt', emoji: '🦸' },
    { min: 500, name: 'Mester', emoji: '🏅' },
    { min: 800, name: 'Legende', emoji: '👑' },
    { min: 1200, name: 'Galaksehelt', emoji: '🚀' },
    { min: 1800, name: 'Universets bedste', emoji: '🌌' },
  ];

  const STREAMING = [
    { id: 'netflix', name: 'Netflix', url: 'https://www.netflix.com', color: '#e50914', source: 'Netflix', on: true },
    { id: 'prime', name: 'Prime Video', url: 'https://www.primevideo.com', color: '#1fa5ff', source: 'Prime Video', on: true },
    { id: 'disney', name: 'Disney+', url: 'https://www.disneyplus.com', color: '#4f7bff', source: 'Disney+', on: true },
    { id: 'drtv', name: 'DRTV', url: 'https://www.dr.dk/drtv', color: '#ff3d6e', source: 'DRTV', on: true },
    { id: 'tv2', name: 'TV 2 Play', url: 'https://play.tv2.dk', color: '#5b8cff', source: 'TV 2 Play', on: true },
    { id: 'viaplay', name: 'Viaplay', url: 'https://viaplay.dk', color: '#ff5277', source: 'Viaplay', on: true },
    { id: 'hbo', name: 'HBO Max', url: 'https://www.hbomax.com', color: '#9b6bff', source: 'HBO Max', on: true },
    { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com', color: '#ff4033', source: 'YouTube', on: true },
    { id: 'skyshowtime', name: 'SkyShowtime', url: 'https://www.skyshowtime.com', color: '#19c8c9', source: 'SkyShowtime', on: false },
    { id: 'spotify', name: 'Spotify', url: 'https://open.spotify.com', color: '#1ed760', source: 'Spotify', on: false },
  ];

  function defaults() {
    const emma = uid(), oliver = uid();
    const ALL = [0, 1, 2, 3, 4, 5, 6], WEEK = [0, 1, 2, 3, 4];
    const t = (emoji, title, points, kids, days) => ({ id: uid(), emoji, title, points, kids, days, once: null });
    const s = {
      version: 1,
      kids: [
        { id: emma, name: 'Emma', color: '#ff6fae', avatar: { type: 'emoji', value: '🦄' }, stars: 35, lifetime: 135 },
        { id: oliver, name: 'Oliver', color: '#4cc9ff', avatar: { type: 'emoji', value: '🦖' }, stars: 20, lifetime: 60 },
      ],
      tasks: [
        t('🛏️', 'Red din seng', 5, [emma, oliver], ALL),
        t('🪥', 'Børst tænder morgen og aften', 5, [emma, oliver], ALL),
        t('🎒', 'Pak skoletasken', 10, [emma, oliver], WEEK),
        t('🍽️', 'Dæk bord til aftensmad', 10, [emma], [0, 2, 4, 6]),
        t('🍽️', 'Dæk bord til aftensmad', 10, [oliver], [1, 3, 5]),
        t('📚', 'Læs i 20 minutter', 10, [emma, oliver], ALL),
        t('🧺', 'Læg dit vasketøj på plads', 15, [emma, oliver], [2, 5]),
        t('🗑️', 'Tag skraldet ud', 15, [emma], [1, 4]),
        t('🌱', 'Vand blomsterne', 10, [oliver], [6]),
      ],
      rewards: [
        { id: uid(), emoji: '📱', title: '30 min. ekstra skærmtid', cost: 40 },
        { id: uid(), emoji: '🍦', title: 'Is efter aftensmaden', cost: 60 },
        { id: uid(), emoji: '🎬', title: 'Vælg aftenens film', cost: 80 },
        { id: uid(), emoji: '🎮', title: 'Spilleaften med mor eller far', cost: 120 },
        { id: uid(), emoji: '🎁', title: 'En lille overraskelse', cost: 200 },
      ],
      done: {},
      history: [],
      settings: {
        pin: '1234',
        sound: true,
        lite: false,
        saverMin: 5,
        weather: { name: 'København', lat: 55.6761, lon: 12.5683 },
        ha: { url: '', token: '' },
        cars: [
          { id: uid(), name: 'Model Y', brand: 'Tesla', shape: 'hatch', color: '#dfe5ee',
            battery: 'sensor.model_y_battery', range: 'sensor.model_y_range', charging: 'binary_sensor.model_y_charging',
            lock: 'lock.model_y', climate: 'button.model_y_climate' },
          { id: uid(), name: 'ID. Buzz', brand: 'Volkswagen', shape: 'van', color: '#9fb4c8',
            battery: 'sensor.id_buzz_battery', range: 'sensor.id_buzz_range', charging: 'binary_sensor.id_buzz_charging',
            lock: 'lock.id_buzz', climate: 'button.id_buzz_climate' },
        ],
        spotify: 'media_player.spotify',
        tv: 'media_player.stue_tv',
        playlists: 'Morgenhygge | spotify:playlist:INDSÆT_ID\nFredagsfest | spotify:playlist:INDSÆT_ID\nBørnesange | spotify:playlist:INDSÆT_ID\nMadlavning | spotify:playlist:INDSÆT_ID',
        lights: '',
        extras: 'sensor.stue_temperatur, sensor.udendors_temperatur, switch.kaffemaskine, switch.julelys',
        calendars: '',
        calendarDefault: '',
        shopping: '',
        nemlig: '',
        calColors: '',
        quickItems: 'Mælk, Rugbrød, Franskbrød, Æg, Smør, Ost, Pålæg, Frugt, Grønt, Kaffe, Yoghurt, Toiletpapir',
        streaming: STREAMING.map(x => ({ ...x })),
      },
    };
    // lidt eksempel-historik, så stjerner og stime ser levende ud
    const today = new Date();
    for (let i = 0; i <= 3; i++) {
      const d = addDays(today, -i), k = dkey(d);
      s.done[k] = {};
      for (const kid of s.kids) {
        const ts = s.tasks.filter(x => x.kids.includes(kid.id) && x.days.includes(dow(d)));
        let n = kid.id === emma ? ts.length : (i === 1 ? ts.length : Math.floor(ts.length / 2));
        if (i === 0) n = kid.id === emma ? 2 : 1;
        s.done[k][kid.id] = Object.fromEntries(ts.slice(0, n).map(x => [x.id, d.getTime()]));
      }
    }
    return s;
  }

  let state = load();

  function load() {
    let s = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        const def = defaults();
        d.settings = { ...def.settings, ...(d.settings || {}) };
        d.settings.ha = { ...def.settings.ha, ...(d.settings.ha || {}) };
        d.settings.weather = { ...def.settings.weather, ...(d.settings.weather || {}) };
        s = { ...def, ...d };
      }
    } catch (e) { console.warn('Kunne ikke læse gemte data', e); }
    if (!s) { s = defaults(); persist(s); }
    // ryd op i gammel historik (> 120 dage)
    const cutoff = dkey(addDays(new Date(), -120));
    Object.keys(s.done).forEach(k => { if (k < cutoff) delete s.done[k]; });
    return s;
  }

  function persist(s = state) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); }
    catch (e) { console.warn('Kunne ikke gemme', e); }
  }

  /* ---------- opslag ---------- */
  const kid = id => state.kids.find(k => k.id === id);
  const task = id => state.tasks.find(t => t.id === id);

  function tasksFor(kidId, d = new Date()) {
    const k = dkey(d), w = dow(d);
    return state.tasks.filter(t => t.kids.includes(kidId) && (t.once ? t.once === k : t.days.includes(w)));
  }
  const doneMap = (kidId, k = dkey()) => (state.done[k] || {})[kidId] || {};

  function progress(kidId, d = new Date()) {
    const ts = tasksFor(kidId, d);
    const dm = doneMap(kidId, dkey(d));
    const done = ts.filter(t => dm[t.id]).length;
    return { done, total: ts.length, p: ts.length ? done / ts.length : 0, all: ts.length > 0 && done === ts.length };
  }

  function earnedToday(kidId) {
    const dm = doneMap(kidId);
    return Object.keys(dm).reduce((sum, id) => sum + (task(id)?.points || 0), 0);
  }

  function streak(kidId) {
    let n = 0;
    if (progress(kidId).all) n++;
    for (let i = 1; i < 366; i++) {
      const p = progress(kidId, addDays(new Date(), -i));
      if (p.total === 0) continue;
      if (p.all) n++; else break;
    }
    return n;
  }

  function level(lifetime) {
    let i = 0;
    LEVELS.forEach((L, idx) => { if (lifetime >= L.min) i = idx; });
    const L = LEVELS[i], next = LEVELS[i + 1] || null;
    const pct = next ? (lifetime - L.min) / (next.min - L.min) : 1;
    return { index: i, ...L, next, pct };
  }

  function week(kidId) {
    const now = new Date();
    const monday = addDays(now, -dow(now));
    const labels = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];
    return labels.map((label, i) => {
      const d = addDays(monday, i);
      const k = dkey(d), today = k === dkey(now);
      if (k > dkey(now)) return { label, state: 'future', today };
      const p = progress(kidId, d);
      const st = p.total === 0 ? 'free' : p.all ? 'done' : p.done ? 'partial' : 'none';
      return { label, state: st, today };
    });
  }

  /* ---------- handlinger ---------- */
  function complete(kidId, taskId) {
    const k = dkey(), t = task(taskId), kd = kid(kidId);
    if (!t || !kd) return null;
    state.done[k] = state.done[k] || {};
    state.done[k][kidId] = state.done[k][kidId] || {};
    if (state.done[k][kidId][taskId]) return null;
    const before = level(kd.lifetime).index;
    state.done[k][kidId][taskId] = Date.now();
    kd.stars += t.points;
    kd.lifetime += t.points;
    persist();
    const lv = level(kd.lifetime);
    return { points: t.points, allDone: progress(kidId).all, levelUp: lv.index > before ? lv : null };
  }

  function undo(kidId, taskId) {
    const k = dkey(), t = task(taskId), kd = kid(kidId);
    const dm = (state.done[k] || {})[kidId];
    if (!dm || !dm[taskId] || !kd) return;
    delete dm[taskId];
    kd.stars = Math.max(0, kd.stars - (t?.points || 0));
    kd.lifetime = Math.max(0, kd.lifetime - (t?.points || 0));
    persist();
  }

  function addStars(kidId, n) {
    const kd = kid(kidId);
    if (!kd) return;
    kd.stars = Math.max(0, kd.stars + n);
    if (n > 0) kd.lifetime += n;
    state.history.push({ type: 'bonus', kidId, n, at: Date.now() });
    persist();
  }

  function redeem(kidId, rewardId) {
    const kd = kid(kidId), r = state.rewards.find(x => x.id === rewardId);
    if (!kd || !r || kd.stars < r.cost) return false;
    kd.stars -= r.cost;
    state.history.push({ type: 'redeem', kidId, rewardId, title: r.title, cost: r.cost, at: Date.now() });
    if (state.history.length > 300) state.history = state.history.slice(-300);
    persist();
    return true;
  }

  function upsert(list, item) {
    const arr = state[list];
    const i = arr.findIndex(x => x.id === item.id);
    if (i >= 0) arr[i] = { ...arr[i], ...item }; else arr.push({ ...item, id: item.id || uid() });
    persist();
  }

  function resetKid(id) {
    const kd = kid(id);
    if (!kd) return;
    kd.stars = 0;
    kd.lifetime = 0;
    Object.values(state.done).forEach(day => { delete day[id]; });
    state.history = state.history.filter(h => h.kidId !== id);
    persist();
  }

  function deleteKid(id) {
    state.kids = state.kids.filter(k => k.id !== id);
    state.tasks.forEach(t => { t.kids = t.kids.filter(k => k !== id); });
    state.tasks = state.tasks.filter(t => t.kids.length);
    persist();
  }
  function remove(list, id) { state[list] = state[list].filter(x => x.id !== id); persist(); }

  function setPath(path, value) {
    const parts = path.split('.');
    let o = state;
    for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = value;
    persist();
  }

  function exportJSON() { return JSON.stringify(state, null, 2); }
  function importJSON(text) {
    const d = JSON.parse(text);
    if (!d || !Array.isArray(d.kids) || !Array.isArray(d.tasks)) throw new Error('Ikke en gyldig backup-fil');
    localStorage.setItem(KEY, JSON.stringify(d));
    state = load();
  }
  function reset() { state = defaults(); persist(); }
  // hent igen fra localStorage (når en anden fane har gemt ændringer)
  function reload() { state = load(); }

  return {
    get state() { return state; },
    uid, dkey, dow, LEVELS, STREAMING,
    kid, task, tasksFor, doneMap, progress, earnedToday, streak, level, week,
    complete, undo, addStars, redeem, upsert, remove, deleteKid, resetKid, setPath, persist,
    exportJSON, importJSON, reset, reload, KEY,
  };
})();
