/* Familietavlen – hovedprogram */
(() => {
  'use strict';

  /* ================= hjælpere ================= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const S = () => Store.state;
  const cfg = () => Store.state.settings;
  const pad = n => String(n).padStart(2, '0');
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const timers = {};
  const debounce = (key, fn, ms) => { clearTimeout(timers[key]); timers[key] = setTimeout(fn, ms); };
  const fmtTime = sec => `${Math.floor(sec / 60)}:${pad(Math.floor(sec % 60))}`;

  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
    tv: '<rect x="3" y="5" width="18" height="12" rx="2.5"/><path d="M8 21h8"/><path d="m10.5 8.5 4 2.5-4 2.5z" fill="currentColor"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
    car: '<path d="m5 11 1.6-4.3A2.5 2.5 0 0 1 9 5h6a2.5 2.5 0 0 1 2.4 1.7L19 11"/><rect x="3" y="11" width="18" height="6" rx="2"/><path d="M6 17v2M18 17v2"/><circle cx="7.5" cy="14" r=".6" fill="currentColor"/><circle cx="16.5" cy="14" r=".6" fill="currentColor"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
    unlock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 7.8-1.2"/>',
    check: '<path d="M5 12.5 9.5 17 19 7"/>',
    play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none"/>',
    next: '<path d="M5 5v14l10-7z" fill="currentColor" stroke="none"/><path d="M18.5 5v14"/>',
    prev: '<path d="M19 5v14L9 12z" fill="currentColor" stroke="none"/><path d="M5.5 5v14"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    vol: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
    speaker: '<rect x="5" y="2.5" width="14" height="19" rx="3"/><circle cx="12" cy="14" r="3.5"/><circle cx="12" cy="7" r="1"/>',
    bolt: '<path d="M13 2 4.5 13.5h6.5L10 22l8.5-11.5H12z"/>',
    plug: '<path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0zM12 17v5"/>',
    route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H16a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h7.5"/>',
    thermo: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/>',
    power: '<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.8 0"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    plug2: '<path d="M12 22v-5M9 8V2M15 8V2M7 8h10v4a5 5 0 0 1-10 0z"/>',
    shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="8.5" cy="14.5" r=".9" fill="currentColor"/><circle cx="12" cy="14.5" r=".9" fill="currentColor"/>',
    cart: '<path d="M3 4h2.2l2.3 11h10.8l2-8H6.3"/><circle cx="9.5" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    truck: '<path d="M2 6h11v10H2zM13 9h4.5l3.5 3.5V16h-8"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  };
  const ic = (n, c = '') => `<svg class="ic ${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

  const KID_EMOJI = ['🦄', '🦖', '🐼', '🦊', '🐯', '🐸', '🐵', '🦁', '🐰', '🐨', '🐙', '🦋', '🐶', '🐱', '🚀', '⚽', '🎨', '🌟'];
  const TASK_EMOJI = ['⭐', '🛏️', '🪥', '🎒', '🍽️', '🧺', '📚', '🌱', '🗑️', '🧹', '🐶', '🐱', '🧸', '👕', '🚿', '🎹', '⚽', '🥦', '🧽', '🍳', '💧', '🧦', '📝', '🚲'];
  const REWARD_EMOJI = ['🎁', '📱', '🍦', '🎬', '🎮', '🍕', '🎟️', '🛝', '🧁', '🏊', '🌙', '💰'];
  const COLORS = ['#ff6fae', '#4cc9ff', '#ffb547', '#30e3a0', '#a78bfa', '#ff7a59', '#f9e04b', '#60a5fa', '#f472b6', '#2dd4bf'];
  const DAYS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
  const PRAISE = ['Godt gået!', 'Sådan!', 'Wow, flot!', 'Du er sej!', 'Mega godt!', 'Yes!', 'Stjernestærkt!', 'Fedt!', 'Superflot!', 'Helt vildt!'];

  const PAGES = [
    { id: 'home', label: 'Overblik', icon: 'home' },
    { id: 'kids', label: 'Opgaver', icon: 'star' },
    { id: 'plan', label: 'Kalender', icon: 'cal' },
    { id: 'shop', label: 'Indkøb', icon: 'cart' },
    { id: 'media', label: 'Musik & TV', icon: 'tv' },
    { id: 'house', label: 'Hjemmet', icon: 'bulb' },
    { id: 'cars', label: 'Biler', icon: 'car' },
  ];

  const App = {
    page: 'home', kid: null, parentTab: 'kids', parentUntil: 0,
    shown: {}, ha: null, weather: null, pointerDown: false, pendingRender: false, day: Store.dkey(),
  };

  /* ================= Home Assistant ================= */
  let lastStatus = null;
  // Tailscale-adresser (*.ts.net) svarer kun på https – og en https-side må ikke bruge http
  const fixHaUrl = u => (/^http:\/\/[^/]+\.ts\.net/i.test(u || '') ? u.replace(/^http:/i, 'https:') : u);
  function connectHA() {
    App.ha?.close();
    const { token } = cfg().ha, url = fixHaUrl(cfg().ha.url);
    App.ha = url && token ? new HAClient(url, token) : new DemoHA();
    lastStatus = null;
    App.ha.on(onHA);
    App.ha.connect();
  }
  function onHA(ha) {
    const stKey = ha.status + '|' + (ha.phase || '');
    if (stKey !== lastStatus) {
      lastStatus = stKey;
      renderTopbar();
      if (App.page === 'parent' && App.parentTab === 'integrations' && !isEditing()) render();
    }
    softRender();
  }
  const isEditing = () => document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);

  async function call(domain, service, data) {
    try { await App.ha.callService(domain, service, data); return true; }
    catch (e) { toast('⚠️ ' + (e.message || 'Noget gik galt'), 'bad'); FX.sound('error'); return false; }
  }

  // Hold styr på hvilke enheder den viste side bruger, så vi kun tegner forfra når netop de ændrer sig
  function trackUsage(fn) {
    const ha = App.ha, used = new Set();
    const g = ha.get, l = ha.list;
    ha.get = id => { if (id) used.add(id); return g.call(ha, id); };
    ha.list = d => { used.add('@' + d); return l.call(ha, d); };
    try { return fn(); }
    finally { ha.get = g; ha.list = l; App.used = used; App.sig = sigOf(used); }
  }
  function sigOf(used) {
    const ha = App.ha;
    let s = '';
    (used || []).forEach(k => {
      if (k[0] === '@') s += k + ':' + ha.list(k.slice(1)).map(x => x.entity_id + '=' + x.state + '@' + x.last_updated).join(',') + ';';
      else { const x = ha.states[k]; s += k + '=' + (x ? x.state + '@' + x.last_updated : '-') + ';'; }
    });
    return s;
  }

  let rt;
  function softRender() {
    watchPlanData();
    if (!['home', 'plan', 'shop', 'media', 'house', 'cars'].includes(App.page)) return;
    if (!App.pendingRender && App.used && sigOf(App.used) === App.sig) return; // intet relevant er ændret
    // vent med at tegne forfra mens man trykker, har en dialog åben eller skriver i indkøbslisten
    const typing = () => document.activeElement?.id === 'shop-input' && document.activeElement.value;
    if (App.pointerDown || $('.modal-back') || typing()) { App.pendingRender = true; return; }
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (typing()) { App.pendingRender = true; return; }
      const refocus = document.activeElement?.id === 'shop-input';
      render();
      if (refocus) $('#shop-input')?.focus({ preventScroll: true });
    }, 250);
  }

  /* ================= navigation & render ================= */
  function renderRail() {
    $('#rail').innerHTML = `
      <div class="rail-logo" aria-hidden="true">${ic('home')}</div>
      ${PAGES.map(p => `<button data-act="nav" data-page="${p.id}">${ic(p.icon)}<span>${p.label}</span></button>`).join('')}
      <div class="rail-spacer"></div>
      <button data-act="nav" data-page="parent">${ic('shield')}<span>Forældre</span></button>`;
  }

  function nav(page) {
    if (page === 'parent' && !parentOk()) {
      askPin('Forældre-adgang').then(ok => {
        if (ok) { App.parentUntil = Date.now() + 5 * 60e3; nav('parent'); }
      });
      return;
    }
    if (App.page === 'parent' && page !== 'parent') App.parentUntil = 0;
    App.page = page;
    FX.sound('tap');
    render();
    const el = $('#page-' + page);
    el.classList.remove('enter');
    void el.offsetWidth;
    el.classList.add('enter');
    el.scrollTop = 0;
  }

  const RENDER = {
    home: pageHome, kids: pageKids, plan: pagePlan, shop: pageShop, media: pageMedia, house: pageHouse, cars: pageCars, parent: pageParent,
  };

  function render() {
    const p = App.page;
    $$('.page').forEach(x => x.classList.toggle('active', x.id === 'page-' + p));
    $$('#rail [data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === p));
    const el = $('#page-' + p);
    const top = el.scrollTop;
    el.innerHTML = trackUsage(() => RENDER[p]());
    el.scrollTop = top;
    postRender(el);
    renderTopbar();
    App.pendingRender = false;
  }

  function postRender(root) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $$('[data-ring]', root).forEach(c => {
        c.style.strokeDashoffset = (+c.dataset.c) * (1 - +c.dataset.p);
        App.shown[c.dataset.ring] = +c.dataset.p;
      });
      $$('[data-count]', root).forEach(el => {
        const to = +el.dataset.to, from = +el.textContent;
        App.shown[el.dataset.count] = to;
        if (from !== to) tweenNum(el, from, to);
      });
    }));
    tickProgress();
  }

  function tweenNum(el, from, to, ms = 900) {
    const t0 = performance.now();
    const step = t => {
      const k = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
      else { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    };
    requestAnimationFrame(step);
  }

  /* ================= topbar, ur & vejr ================= */
  function greeting(d) {
    const h = d.getHours();
    if (h < 5) return 'Godnat';
    if (h < 10) return 'Godmorgen';
    if (h < 12) return 'God formiddag';
    if (h < 18) return 'God eftermiddag';
    if (h < 23) return 'God aften';
    return 'Godnat';
  }
  const clockText = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const dateText = d => cap(d.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' }));

  const WMO = c => {
    if (c === 0) return ['☀️', 'Klart vejr'];
    if (c === 1) return ['🌤️', 'Overvejende klart'];
    if (c === 2) return ['⛅', 'Let skyet'];
    if (c === 3) return ['☁️', 'Overskyet'];
    if (c === 45 || c === 48) return ['🌫️', 'Tåge'];
    if (c >= 51 && c <= 57) return ['🌦️', 'Støvregn'];
    if (c >= 61 && c <= 67) return ['🌧️', 'Regn'];
    if (c >= 71 && c <= 77) return ['🌨️', 'Sne'];
    if (c >= 80 && c <= 82) return ['🌦️', 'Byger'];
    if (c === 85 || c === 86) return ['🌨️', 'Snebyger'];
    if (c >= 95) return ['⛈️', 'Torden'];
    return ['🌡️', ''];
  };

  function renderTopbar() {
    const now = new Date();
    $('#greet').textContent = greeting(now) + ' 👋';
    $('#date').textContent = dateText(now);
    $('#clock').textContent = clockText(now);
    const w = App.weather;
    if (w?.current) {
      let [emo, txt] = WMO(w.current.weather_code);
      if (!w.current.is_day && w.current.weather_code <= 1) emo = '🌙';
      $('#weather').innerHTML = `<span class="w-emo">${emo}</span><div><div class="w-temp">${Math.round(w.current.temperature_2m)}°</div>
        <div class="w-sub">${txt} · ${Math.round(w.daily.temperature_2m_max[0])}° / ${Math.round(w.daily.temperature_2m_min[0])}°</div></div>`;
    } else $('#weather').innerHTML = '';
    const ha = App.ha;
    const st = {
      demo: ['demo', 'Demo-data'], connected: ['ok', 'Home Assistant'], connecting: ['wait', 'Forbinder…'],
      disconnected: ['bad', 'Afbrudt'], auth_invalid: ['bad', 'Forkert token'], error: ['bad', 'Fejl'],
    }[ha?.status] || ['wait', '…'];
    $('#ha-pill').className = 'ha-pill ' + st[0];
    $('#ha-pill').innerHTML = `<i></i>${st[1]}`;
  }

  async function loadWeather() {
    const w = cfg().weather;
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${w.lat}&longitude=${w.lon}` +
        '&current=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5');
      if (!r.ok) throw new Error(r.status);
      App.weather = await r.json();
      renderTopbar();
      if ($('#saver').classList.contains('on')) renderSaver();
    } catch (e) { console.warn('Vejr kunne ikke hentes', e); }
  }

  function tick() {
    const now = new Date();
    $('#clock').textContent = clockText(now);
    if (Store.dkey(now) !== App.day) { App.day = Store.dkey(now); render(); } // ny dag = nye opgaver
    if ($('#saver').classList.contains('on')) { $('#sv-clock').textContent = clockText(now); }
    tickProgress();
  }

  function tickProgress() {
    $$('[data-prog]').forEach(el => {
      const dur = +el.dataset.dur;
      let pos = +el.dataset.pos;
      if (el.dataset.playing === '1') pos += (Date.now() - new Date(el.dataset.upd)) / 1000;
      pos = Math.max(0, Math.min(dur, pos));
      el.querySelector('i').style.width = (pos / dur) * 100 + '%';
      const cur = el.parentElement.querySelector('[data-prog-cur]');
      if (cur) cur.textContent = fmtTime(pos);
    });
  }

  /* ================= fælles byggeklodser ================= */
  const cardHead = (icon, title, extra = '') => `<div class="card-head"><h3>${ic(icon)}${title}</h3>${extra}</div>`;
  const notLinked = (txt) => `<div class="not-linked">${ic('plug2')}<span>${txt}</span></div>`;

  function avatar(kid) {
    return kid.avatar?.type === 'photo'
      ? `<img class="av-img" src="${kid.avatar.value}" alt="">`
      : `<span class="av-emoji">${esc(kid.avatar?.value || '🙂')}</span>`;
  }

  function ring(key, p, size, color, inner) {
    const r = 52, C = +(2 * Math.PI * r).toFixed(2);
    const from = App.shown[key] ?? p;
    return `<div class="ring" style="--size:${size};--rc:${color}">
      <svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="${r}"/>
      <circle class="ring-fg" cx="60" cy="60" r="${r}" stroke-dasharray="${C}" style="stroke-dashoffset:${C * (1 - from)}"
        data-ring="${key}" data-p="${p}" data-c="${C}"/></svg>
      <div class="ring-in">${inner}</div></div>`;
  }

  function count(key, val) {
    const from = App.shown[key] ?? val;
    return `<span class="count" data-count="${key}" data-to="${val}">${from}</span>`;
  }

  /* ================= OVERBLIK ================= */
  function pageHome() {
    const kids = S().kids;
    return `<div class="home-grid">
      <section class="card w-kids">
        ${cardHead('star', 'Dagens opgaver', `<button class="link" data-act="nav" data-page="kids">Åbn ›</button>`)}
        <div class="kid-row">${kids.map(kidCard).join('') || `<div class="empty">Tilføj børn under Forældre 🔒</div>`}</div>
      </section>
      <section class="card w-music">${musicWidget(true)}</section>
      <div class="home-row2">
        ${homePlanCard()}
        ${cfg().cars.map(c => `<section class="card w-car">${carWidget(c, true)}</section>`).join('')}
        <section class="card w-lights">${lightsWidget()}</section>
        <section class="card w-stream">${cardHead('tv', 'Streaming', `<button class="link" data-act="nav" data-page="media">Alle ›</button>`)}
          <div class="stream-grid mini">${streams().slice(0, 6).map(streamTile).join('')}</div></section>
      </div>
    </div>`;
  }

  function kidCard(kid) {
    const pr = Store.progress(kid.id), st = Store.streak(kid.id);
    const sub = pr.total ? (pr.all ? 'Alt klaret i dag! 🎉' : `${pr.done} af ${pr.total} opgaver`) : 'Fri i dag 😎';
    return `<button class="kid-card ${pr.all ? 'all' : ''}" style="--kc:${kid.color}" data-act="open-kid" data-id="${kid.id}">
      ${ring('home-' + kid.id, pr.p, '8.5rem', kid.color, avatar(kid))}
      ${pr.all ? '<span class="crown">👑</span>' : ''}
      <div class="kc-name">${esc(kid.name)}</div>
      <div class="kc-sub">${sub}</div>
      <div class="kc-stats"><span class="chip">⭐ ${count('stars-' + kid.id, kid.stars)}</span>
        <span class="chip ${st ? 'fire' : 'dim'}">🔥 ${st}</span></div>
    </button>`;
  }

  /* ================= KALENDER & INDKØB ================= */
  const CAL_COLORS = ['#5ad1ff', '#ff6fae', '#ffb547', '#30e3a0', '#a78bfa', '#ff7a59'];
  const listOf = s => String(s || '').split(/[\s,]+/).filter(Boolean);
  function calEntities() {
    // spring kalendere over der ikke findes (længere) – fx slettet i Google
    const ok = id => App.ha.states[id] && App.ha.states[id].state !== 'unavailable';
    const set = listOf(cfg().calendars).filter(ok);
    return set.length ? set : Object.keys(App.ha.states).filter(id => id.startsWith('calendar.') && ok(id)).sort();
  }
  const calColor = id => CAL_COLORS[Math.max(0, calEntities().indexOf(id)) % CAL_COLORS.length];

  // Farver efter navn i aftalens titel, fx "Emma svømning" → grøn.
  // Home Assistant sender ikke Google-farven med, så tavlen genkender navnene i stedet.
  const GCOLORS = {
    rød: '#d50000', tomat: '#d50000', lyserød: '#e67c73', flamingo: '#e67c73', orange: '#f4511e', mandarin: '#f4511e',
    gul: '#f6bf26', banan: '#f6bf26', grøn: '#0b8043', basilikum: '#0b8043', lysegrøn: '#33b679', salvie: '#33b679',
    blå: '#039be5', påfugl: '#039be5', mørkeblå: '#3f51b5', blåbær: '#3f51b5', lavendel: '#7986cb',
    lilla: '#8e24aa', drue: '#8e24aa', grå: '#616161', grafit: '#616161',
  };
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function calRules() {
    const rules = String(cfg().calColors || '').split('\n').map(l => l.split('=').map(x => x.trim())).filter(([w, c]) => w && c)
      .map(([word, c]) => ({ word, color: GCOLORS[c.toLowerCase()] || (/^#[0-9a-f]{3,8}$/i.test(c) ? c : null) }))
      .filter(r => r.color);
    // børn uden egen linje får deres farve fra tavlen
    S().kids.forEach(k => { if (k.name && !rules.some(r => r.word.toLowerCase() === k.name.toLowerCase())) rules.push({ word: k.name, color: k.color }); });
    return rules.map(r => ({ ...r, kid: S().kids.find(k => k.name && k.name.toLowerCase() === r.word.toLowerCase()),
      re: new RegExp(`(^|[^\\p{L}])${reEsc(r.word)}s?(?![\\p{L}])`, 'iu') }));
  }
  function evMatch(ev) {
    const rules = calRules(), title = ev.summary || '', desc = ev.description || '';
    let best = null;
    rules.forEach(r => { const m = r.re.exec(title); if (m && (!best || m.index < best.i)) best = { ...r, i: m.index }; });
    return best || rules.find(r => r.re.test(desc)) || null;
  }
  function shopEntity() {
    if (cfg().shopping && App.ha.states[cfg().shopping]) return cfg().shopping;
    const todos = Object.keys(App.ha.states).filter(id => id.startsWith('todo.'));
    return todos.find(id => /indk|shop|bring|handle|grocer/i.test(id)) || todos[0] || '';
  }
  const localISO = d => {
    const z = n => String(n).padStart(2, '0'), o = -d.getTimezoneOffset();
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}:00${o >= 0 ? '+' : '-'}${z(Math.floor(Math.abs(o) / 60))}:${z(Math.abs(o) % 60)}`;
  };
  // "2026-11-27" (heldagsbegivenhed) skal læses som lokal dato – ikke UTC
  const parseWhen = s => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00') : new Date(s));

  async function loadEvents(force) {
    const ids = calEntities();
    if (!ids.length) { App.events = []; return; }
    if (!force && App.evAt && Date.now() - App.evAt < 5 * 60e3) return;
    if (!App.ha.callServiceResponse) return;
    App.evAt = Date.now();
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 8);
    try {
      const r = await App.ha.callServiceResponse('calendar', 'get_events',
        { start_date_time: localISO(start), end_date_time: localISO(end) }, { entity_id: ids });
      App.events = Object.entries(r || {}).flatMap(([cal, v]) => (v.events || []).map(e => ({ ...e, cal })))
        .sort((a, b) => parseWhen(a.start) - parseWhen(b.start));
      if (['plan', 'shop', 'home'].includes(App.page)) { App.pendingRender = true; softRender(); }
    } catch (e) { App.evAt = 0; console.warn('Kalender kunne ikke hentes', e); }
  }

  async function loadShop() {
    const id = shopEntity();
    if (!id || !App.ha.callServiceResponse) { App.shop = []; return; }
    try {
      const r = await App.ha.callServiceResponse('todo', 'get_items', {}, { entity_id: id });
      App.shop = (r?.[id]?.items || []);
      App.shopAt = Date.now();
      if (['plan', 'shop', 'home'].includes(App.page)) { App.pendingRender = true; softRender(); }
    } catch (e) { console.warn('Indkøbslisten kunne ikke hentes', e); }
  }

  // hent kalender/liste igen når Home Assistant melder ændringer på dem
  function watchPlanData() {
    const ha = App.ha, sid = shopEntity();
    const shopSig = sid ? (ha.states[sid]?.state + '@' + ha.states[sid]?.last_updated) : '';
    if (shopSig !== App.shopSig) { App.shopSig = shopSig; loadShop(); }
    const calSig = calEntities().map(id => id + '@' + ha.states[id]?.last_updated).join(',');
    if (calSig !== App.calSig) { App.calSig = calSig; loadEvents(true); }
  }

  function dayLabel(d) {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - t) / 864e5);
    if (diff === 0) return 'I dag';
    if (diff === 1) return 'I morgen';
    return cap(d.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'short' }));
  }
  const hm = d => `${pad(d.getHours())}.${pad(d.getMinutes())}`;
  function eventsOn(day) {
    const s = new Date(day); s.setHours(0, 0, 0, 0);
    const e = new Date(s); e.setDate(e.getDate() + 1);
    return (App.events || []).filter(ev => parseWhen(ev.start) < e && parseWhen(ev.end || ev.start) > s
      || (+parseWhen(ev.start) === +s));
  }
  function eventRow(ev) {
    const allDay = /^\d{4}-\d{2}-\d{2}$/.test(ev.start);
    const st = parseWhen(ev.start), en = parseWhen(ev.end || ev.start);
    const calName = App.ha.get(ev.cal)?.attributes?.friendly_name || '';
    const who = evMatch(ev);
    return `<div class="ev ${who ? 'tinted' : ''}" style="--ec:${who ? who.color : calColor(ev.cal)}">
      <span class="ev-time">${allDay ? 'Hele dagen' : `${hm(st)}<small>${hm(en)}</small>`}</span>
      ${who?.kid ? `<span class="ev-kid">${avatar(who.kid)}</span>` : ''}
      <span class="ev-body"><b>${esc(ev.summary || '(uden titel)')}</b>
        <small>${[ev.location, calEntities().length > 1 ? calName : ''].filter(Boolean).map(esc).join(' · ')}</small></span>
    </div>`;
  }

  function pagePlan() {
    setTimeout(() => loadEvents(), 0);
    const cals = calEntities();
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d; });
    const calBody = !cals.length
      ? notLinked('Ingen kalender endnu. Tilføj Google Kalender i Home Assistant (se vejledningen), så dukker jeres aftaler op her.')
      : `<div class="agenda wide">${days.map((d, i) => {
          const evs = eventsOn(d);
          if (!evs.length && i > 1) return '';
          return `<div class="ag-day ${i === 0 ? 'today' : ''}"><div class="ag-h">${dayLabel(d)}</div>
            ${evs.length ? evs.map(eventRow).join('') : '<div class="ev empty">Intet planlagt</div>'}</div>`;
        }).join('')}</div>`;
    return `<section class="card cal-card">
        ${cardHead('cal', 'Kalender', cals.length ? `<button class="btn primary sm" data-act="new-event">${ic('plus')}Ny aftale</button>` : '')}
        ${calBody}
      </section>`;
  }

  /* ================= INDKØB ================= */
  function pageShop() {
    setTimeout(() => { if (!App.shopAt || Date.now() - App.shopAt > 60e3) loadShop(); }, 0);
    const nm = nemligCard();
    return `<div class="shop-grid ${nm ? '' : 'solo'}">
      <section class="card shop-card">${shopBlock(false)}</section>
      ${nm}
    </div>`;
  }

  function shopBlock(compact) {
    const id = shopEntity();
    const head = cardHead('cart', 'Indkøbsliste', compact ? `<button class="link" data-act="nav" data-page="shop">Åbn ›</button>` : '');
    if (!id) return head + notLinked('Ingen indkøbsliste fundet i Home Assistant.');
    const items = App.shop || [];
    const open = items.filter(i => i.status !== 'completed'), done = items.filter(i => i.status === 'completed');
    if (compact) {
      return `${head}<div class="shop-sum"><b>${open.length}</b><span>${open.length === 1 ? 'vare' : 'varer'} på listen</span></div>
        <div class="shop-mini">${open.slice(0, 5).map(i => `<span>${esc(i.summary)}</span>`).join('') || '<span class="muted">Listen er tom 🎉</span>'}</div>`;
    }
    const have = new Set(open.map(i => i.summary.toLowerCase()));
    const quick = String(cfg().quickItems || '').split(',').map(q => q.trim()).filter(q => q && !have.has(q.toLowerCase()));
    return `${head}
      <div class="shop-add"><input id="shop-input" placeholder="${nemligIds() ? 'Tilføj vare … fx smør' : 'Tilføj vare …'}" autocomplete="off" enterkeyhint="done">
        <button class="btn primary" data-act="shop-add" aria-label="Tilføj">${ic('plus')}</button></div>
      ${nemligIds() ? '<div class="nm-sugg" id="nm-sugg" hidden></div>' : ''}
      ${quick.length ? `<div class="chips shop-quick">${quick.map(q => `<button class="chip-btn" data-act="shop-quick" data-v="${esc(q)}">${ic('plus')}${esc(q)}</button>`).join('')}</div>` : ''}
      <div class="shop-list">${open.map(i => `
        <button class="shop-item" data-act="shop-toggle" data-id="${esc(i.uid || i.summary)}" data-done="0"><i></i>${nmImgTag(nmItemImg(i.summary), 'nm-img sm')}<span>${esc(i.summary)}</span></button>`).join('')
        || '<div class="empty">Listen er tom 🎉</div>'}
      ${done.length ? `<div class="shop-done-h">Lagt i kurven (${done.length}) <button class="link" data-act="shop-clear">Ryd</button></div>
        ${done.map(i => `<button class="shop-item done" data-act="shop-toggle" data-id="${esc(i.uid || i.summary)}" data-done="1"><i>${ic('check')}</i><span>${esc(i.summary)}</span></button>`).join('')}` : ''}
      </div>
      <p class="hint">💡 Tilføj også med stemmen – se vejledningen i LÆS-MIG.</p>`;
  }

  // Overblik: dagens aftaler + indkøbslisten i ét kort
  function homePlanCard() {
    const cals = calEntities(), sid = shopEntity();
    if (!cals.length && !sid) return '';
    setTimeout(() => { loadEvents(); if (!App.shopAt) loadShop(); }, 0);
    const today = eventsOn(new Date());
    const open = (App.shop || []).filter(i => i.status !== 'completed');
    return `<section class="card w-plan">
      ${cardHead('cal', 'I dag', `<button class="link" data-act="nav" data-page="plan">Kalender ›</button>`)}
      ${cals.length ? (today.length ? `<div class="agenda mini">${today.slice(0, 3).map(eventRow).join('')}</div>` : '<div class="ev empty">Intet i kalenderen i dag</div>') : ''}
      ${sid ? `<button class="shop-line" data-act="nav" data-page="shop">${ic('cart')}<b>${open.length}</b>&nbsp;${open.length === 1 ? 'vare' : 'varer'} på indkøbslisten</button>` : ''}
      ${nemligLine()}
    </section>`;
  }

  async function shopAdd(text) {
    text = String(text || '').trim();
    nmSuggHide();
    if (!text) return;
    if (await call('todo', 'add_item', { entity_id: shopEntity(), item: cap(text) })) { FX.sound('tap'); loadShop(); }
  }

  /* ================= NEMLIG.COM ================= */
  // Bruger Nemlig-integrationen til Home Assistant (HACS: DruonDK/ha-nemlig).
  // Enhederne findes på deres attributter, så det er ligegyldigt hvilket sprog HA navngiver dem på.
  // Tavlen fylder kun kurven – bestilling, betaling og levering sker altid i Nemlig-appen.
  function nemligIds() {
    const all = Object.values(App.ha.states);
    const has = (s, ...k) => k.every(x => s.attributes && x in s.attributes);
    const sensor = s => s.entity_id.startsWith('sensor.');
    const basket = (cfg().nemlig && App.ha.states[cfg().nemlig] ? cfg().nemlig : '')
      || all.find(s => sensor(s) && has(s, 'lines', 'missing_to_minimum'))?.entity_id;
    if (!basket) return null;
    return {
      basket,
      next: all.find(s => sensor(s) && has(s, 'order_number', 'window_end'))?.entity_id,
      status: all.find(s => sensor(s) && has(s, 'nemlig_state'))?.entity_id,
      eta: all.find(s => sensor(s) && has(s, 'window_start', 'window_end') && !has(s, 'order_number'))?.entity_id,
      deadline: all.find(s => sensor(s) && /nemlig/i.test(s.entity_id) && /deadline|frist|ndring|edit/i.test(s.entity_id))?.entity_id,
    };
  }
  const kr = v => (v == null || v === '' || isNaN(+v)) ? '–'
    : (+v).toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kr';
  const okState = s => s && !['unknown', 'unavailable', ''].includes(s.state);

  function nemligDelivery(n) {
    const g = id => id && App.ha.get(id);
    const nx = g(n.next), st = g(n.status), eta = g(n.eta), dl = g(n.deadline);
    if (!okState(nx) || isNaN(new Date(nx.state))) return null;
    const a = new Date(nx.state), b = nx.attributes.window_end ? new Date(nx.attributes.window_end) : null;
    const status = okState(st) ? st.state : '';
    if (status === 'delivered' && Date.now() - (b || a) > 6 * 3600e3) return null;
    const label = { editable: 'Kan stadig ændres', processing: 'Pakkes nu', ready_for_delivery: 'Klar til levering',
      out_for_delivery: 'På vej', delivered: 'Leveret ✓' }[status] || '';
    let sub = '';
    if (status === 'out_for_delivery' && okState(eta)) sub = `forventet kl. ${hm(new Date(eta.state))}`;
    else if (status === 'editable' && okState(dl)) { const d = new Date(dl.state); sub = `ret senest ${dayLabel(d).toLowerCase()} kl. ${hm(d)}`; }
    return { when: `${dayLabel(a).toLowerCase()} kl. ${hm(a)}${b ? '–' + hm(b) : ''}`, label, sub, status };
  }

  function nemligCard() {
    const n = nemligIds();
    if (!n) return '';
    const b = App.ha.get(n.basket), a = b?.attributes || {};
    const items = +a.item_count || 0;
    const head = cardHead('cart', 'Nemlig.com', `<span class="chip">${items} ${items === 1 ? 'vare' : 'varer'}</span>`);
    if (!okState(b)) return `<section class="card nemlig-card">${head}${notLinked('Nemlig svarer ikke lige nu – Home Assistant prøver igen om lidt.')}</section>`;
    const miss = +a.missing_to_minimum || 0, min = +a.minimum_order_total || 0;
    const prog = min ? Math.max(4, Math.min(100, Math.round((1 - miss / min) * 100))) : 100;
    const del = a.delivery_price == null ? '–' : +a.delivery_price ? kr(a.delivery_price) : 'Gratis';
    const d = nemligDelivery(n);
    const open = (App.shop || []).filter(i => i.status !== 'completed').length;
    return `<section class="card nemlig-card">${head}
      <div class="nm-sum">
        <div><small>Varer</small><b>${kr(b.state)}</b></div>
        <div><small>Levering</small><b>${del}</b></div>
        <div class="tot"><small>I alt</small><b>${kr(a.total_price ?? b.state)}</b></div>
      </div>
      ${miss > 0 ? `<div class="nm-min"><div class="nm-bar"><i style="width:${prog}%"></i></div><span>Mangler <b>${kr(miss)}</b> til minimumskøb</span></div>`
        : items ? '<div class="nm-min ok">✓ Over minimumskøb</div>' : ''}
      ${d ? `<div class="nm-del ${d.status}">${ic('truck')}<span><b>Levering ${d.when}</b><small>${[d.label, d.sub].filter(Boolean).join(' · ')}</small></span></div>` : ''}
      <div class="nm-actions">
        <button class="btn primary" data-act="nm-fill" ${open ? '' : 'disabled'}>${ic('cart')}Læg listen i kurven${open ? ` (${open})` : ''}</button>
        <button class="btn ghost" data-act="nm-search">${ic('search')}Find vare</button>
        <button class="btn ghost" data-act="nm-basket" ${items ? '' : 'disabled'}>Se kurven</button>
      </div>
      <p class="hint">Tavlen fylder kun kurven. Bestilling, betaling og leveringstid vælges i Nemlig-appen.</p>
    </section>`;
  }

  // én linje på Overblik
  function nemligLine() {
    const n = nemligIds();
    if (!n) return '';
    const d = nemligDelivery(n), b = App.ha.get(n.basket);
    if (d) return `<button class="shop-line nm-line ${d.status}" data-act="nav" data-page="shop">${ic('truck')}<span>Nemlig ${d.when}${d.label ? ` · ${d.label.toLowerCase()}` : ''}</span></button>`;
    if (okState(b) && +b.attributes.item_count) return `<button class="shop-line" data-act="nav" data-page="shop">${ic('cart')}<span>Nemlig-kurv: <b>${kr(b.attributes.total_price ?? b.state)}</b></span></button>`;
    return '';
  }

  // "2 mælk" / "2x mælk" → 2 stk. mælk
  const nmParse = t => {
    const m = String(t).trim().match(/^(\d{1,2})\s*(?:x|×|stk\.?)?\s+(.+)$/i);
    return m ? { q: m[2], n: Math.max(1, Math.min(50, +m[1])) } : { q: String(t).trim(), n: 1 };
  };
  const nmAdd = async data => (await App.ha.callServiceResponse('nemlig', 'add_product', data)) || {};
  const nmSearch = async q => ((await App.ha.callServiceResponse('nemlig', 'search', { query: q, limit: 12 })) || {}).products || [];

  // Nemlig sætter on_offer på næsten alt – kun et reelt lavere offer_price tæller.
  // offer_min_quantity > 1 er "flerstyks-tilbud" (fx 2 for 178 kr), hvor offer_price er prisen for alle stk.
  const prodOpt = p => {
    const op = p.offer_price == null ? null : +p.offer_price, min = +p.offer_min_quantity || 1;
    const multi = op != null && min > 1 && op < min * p.price;
    const cut = op != null && min <= 1 && op < p.price;
    const lbl = String(p.unit_price_label || '');
    const unit = p.unit_price == null ? '' : /kr/i.test(lbl)
      ? `${(+p.unit_price).toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${lbl}`
      : `${kr(p.unit_price)}${lbl ? '/' + lbl : ''}`;
    // beskrivelsen ender ofte med "/ Mærke" – det står allerede forrest
    const desc = String(p.description || '').split('/').map(s => s.trim()).filter(s => s && s !== p.brand).join(' / ');
    return { id: p.product_id, name: p.name, sub: [p.brand, desc].filter(Boolean).join(' · '), img: p.image_url || NM().known[String(p.product_id)]?.img || '',
      price: cut ? op : p.price, badge: cut ? 'Tilbud' : multi ? `${min} for ${kr(op).replace(',00', '')}` : '', unit, na: p.available === false };
  };
  // varebilleder (kræver at Nemlig-integrationen sender image_url med – se LÆS-MIG)
  const nmThumb = u => !u ? '' : /[?&]w=\d|^data:/.test(u) ? u :`${u}${u.includes('?') ? '&' : '?'}w=160`;
  const nmImgTag = (u, cls = 'nm-img') => u
    ? `<span class="${cls}"><img src="${esc(nmThumb(u))}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('gone');this.remove()"></span>` : '';
  const optsHtml = (opts, attr = 'nm') => opts.length ? opts.map(o => `
    <button class="nm-opt ${o.mine ? 'mine' : ''}" data-${attr}="pick" data-id="${esc(o.id)}" data-name="${esc(o.name)}" data-img="${esc(o.img || '')}" ${o.na ? 'disabled' : ''}>
      ${nmImgTag(o.img)}
      <span class="nm-n"><b>${o.mine ? '<span class="nm-star">★</span>' : ''}${esc(o.name)}</b><small>${esc(o.na ? 'Udsolgt' : o.sub || '')}</small></span>
      ${o.price != null ? `<span class="nm-p">${o.badge ? `<em>${esc(o.badge)}</em>` : ''}<b>${kr(o.price)}</b>${o.unit ? `<small>${esc(o.unit)}</small>` : ''}</span>` : ''}
      <i>${ic('plus')}</i></button>`).join('') : '<div class="empty">Ingen varer fundet – prøv et andet ord.</div>';

  // vælg en vare: fra en liste og/eller ved at søge i hele Nemligs sortiment
  function nmPicker({ title, text = '', opts = [], query = '', close = 'Spring over', onPick }) {
    return new Promise(res => {
      const m = modal(`<h2>${title}</h2>${text ? `<p class="muted">${text}</p>` : ''}
        <div class="shop-add"><input id="nm-q" value="${esc(query)}" placeholder="Søg i Nemlig …" autocomplete="off" enterkeyhint="search">
          <button class="btn primary" data-nm="find" aria-label="Søg">${ic('search')}</button></div>
        <div class="nm-res">${opts.length || !query ? optsHtml(opts) : ''}</div>
        <div class="form-actions"><button class="btn ghost" data-nm="close">${close}</button></div>`, 'nm-modal');
      App.noSaver = true;
      const done = v => { App.noSaver = false; closeModal(m); res(v); };
      const box = $('.nm-res', m), inp = $('#nm-q', m);
      const find = async () => {
        const q = inp.value.trim();
        if (!q) return;
        box.innerHTML = '<div class="empty">Søger …</div>';
        try { box.innerHTML = optsHtml((await nmSearch(q)).map(prodOpt)); }
        catch (e) { box.innerHTML = `<div class="empty">⚠️ ${esc(e.message || 'Søgningen fejlede')}</div>`; }
      };
      if (!opts.length && query) find();
      m.addEventListener('click', async e => {
        if (e.target === m) { App.noSaver = false; return res(null); }
        const b = e.target.closest('[data-nm]');
        if (!b) return;
        const act = b.dataset.nm;
        if (act === 'close') done(null);
        else if (act === 'find') find();
        else if (act === 'pick') {
          if (!onPick) return done({ id: b.dataset.id, name: b.dataset.name, img: b.dataset.img });
          b.disabled = true;
          if (await onPick(b.dataset.id, b.dataset.name, b.dataset.img)) b.classList.add('ok'); else b.disabled = false;
        }
      });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); find(); } });
    });
  }

  async function nemligResolve(o) {
    const r = o.r || {};
    const opts = r.status === 'ambiguous'
      ? (r.candidates || []).map(c => ({ id: c.product_id, name: c.name,
          sub: [c.description, c.times_bought ? `købt ${c.times_bought} ${c.times_bought === 1 ? 'gang' : 'gange'} før` : ''].filter(Boolean).join(' · ') }))
      : (r.suggestions || []).map(prodOpt);
    const q = esc(o.q);
    const text = r.status === 'ambiguous' ? `Der er flere bud på „${q}“ blandt det, I plejer at købe. Vælg den rigtige:`
      : r.status === 'error' ? `„${q}“ kunne ikke lægges i kurven (${esc(r.error || 'fejl')}). Prøv at søge:`
      : `„${q}“ har I ikke købt før. Vælg en vare fra Nemlig:`;
    const pick = await nmPicker({ title: `Hvilken ${q}?${o.n > 1 ? ` (${o.n} stk.)` : ''}`, text, opts, query: o.q });
    if (!pick) return null;
    try {
      const res = await nmAdd({ product_id: pick.id, quantity: o.n });
      if (res.status !== 'added') return null;
      nmRemember({ product_id: pick.id, name: res.name || pick.name, img: pick.img }, [o.it?.summary, o.q]); // næste gang vælges den samme vare
      return res;
    }
    catch (e) { toast('⚠️ ' + (e.message || 'Kunne ikke lægge varen i kurven'), 'bad'); return null; }
  }

  async function nemligFill() {
    const items = (App.shop || []).filter(i => i.status !== 'completed');
    if (!items.length) return;
    const ok = await confirmDialog('Læg i Nemlig-kurven?',
      `${items.length} ${items.length === 1 ? 'vare' : 'varer'} fra indkøbslisten lægges i jeres Nemlig-kurv. Der bliver ikke bestilt noget – det gør I selv i Nemlig-appen.`, 'Læg i kurven');
    if (!ok) return;
    App.noSaver = true;
    const prog = modal(`<h2>Fylder kurven …</h2><p class="muted nm-prog"></p><div class="nm-bar"><i style="width:0%"></i></div>`, 'small');
    const added = [], unsure = [];
    let last = null;
    const bought = it => call('todo', 'update_item', { entity_id: shopEntity(), item: it.uid || it.summary, status: 'completed' });
    for (const [k, it] of items.entries()) {
      $('.nm-prog', prog).textContent = `${k + 1} af ${items.length}: ${it.summary}`;
      $('.nm-bar i', prog).style.width = Math.round(k / items.length * 100) + '%';
      const { q, n } = nmParse(it.summary);
      try {
        // vare valgt fra forslagene, eller valgt før til samme ord → brug præcis den vare
        const pid = nmMapped(it.summary) || nmMapped(q);
        let r = pid ? await nmAdd({ product_id: pid, quantity: n }).catch(() => ({})) : {};
        if (r.status !== 'added') r = await nmAdd({ query: q, quantity: n });
        if (r.status === 'added') {
          last = r; added.push(`${n > 1 ? n + ' × ' : ''}${r.name || q}`);
          nmRemember({ product_id: r.product_id, name: r.name }, [it.summary, q]);
          await bought(it);
        } else unsure.push({ it, q, n, r });
      } catch (e) { unsure.push({ it, q, n, r: { status: 'error', error: e.message } }); }
    }
    closeModal(prog);
    for (const o of unsure) {
      const r = await nemligResolve(o);
      if (r) { last = r; added.push(`${o.n > 1 ? o.n + ' × ' : ''}${r.name || o.q}`); await bought(o.it); }
    }
    App.noSaver = false;
    loadShop();
    const skipped = items.length - added.length;
    if (added.length) FX.sound('ding');
    modal(`<h2>${added.length ? `🛒 ${added.length} ${added.length === 1 ? 'vare' : 'varer'} lagt i kurven` : 'Intet lagt i kurven'}</h2>
      ${added.length ? `<div class="shop-mini nm-added">${added.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
      ${last ? `<div class="nm-sum one"><div class="tot"><small>Kurven i alt (uden levering)</small><b>${kr(last.basket_total)}</b></div></div>
        ${+last.missing_to_minimum > 0 ? `<p class="muted">Mangler ${kr(last.missing_to_minimum)} til minimumskøb.</p>` : ''}` : ''}
      ${skipped ? `<p class="muted">${skipped} ${skipped === 1 ? 'vare blev' : 'varer blev'} sprunget over og står stadig på listen.</p>` : ''}
      <p class="muted">Husk at bestille og vælge levering i Nemlig-appen.</p>
      <div class="form-actions"><button class="btn primary" data-close-modal>OK</button></div>`, 'small')
      .addEventListener('click', e => { if (e.target.closest('[data-close-modal]')) closeModal(e.currentTarget); });
  }

  /* ----- tavlens hukommelse: hvad I plejer at købe, og hvilket ord der hører til hvilken vare ----- */
  const NM = () => (Store.state.nm ||= { known: {}, map: {} });
  const nmKey = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const nmMapped = s => NM().map[nmKey(s)] || '';
  const nmItemImg = s => { const id = nmMapped(s) || nmMapped(nmParse(s).q); return (id && NM().known[id]?.img) || ''; };
  function nmRemember(p, aliases = [], count = true) {
    const id = p && p.product_id != null ? String(p.product_id) : '';
    if (!id || id === 'undefined') return;
    const s = NM(), k = s.known[id] || {};
    s.known[id] = { name: p.name || k.name || '', brand: p.brand ?? k.brand ?? '', desc: p.description ?? k.desc ?? '',
      price: p.price ?? k.price ?? null, img: p.image_url || p.img || k.img || '', n: (k.n || 0) + (count ? 1 : 0), last: Date.now() };
    [].concat(aliases).filter(Boolean).forEach(a => { s.map[nmKey(a)] = id; });
    const ids = Object.keys(s.known);
    if (ids.length > 300) ids.sort((a, b) => s.known[a].last - s.known[b].last).slice(0, ids.length - 300).forEach(x => delete s.known[x]);
    const al = Object.keys(s.map);
    if (al.length > 500) al.slice(0, al.length - 500).forEach(x => delete s.map[x]);
    Store.persist();
  }
  const nmTitle = p => (p.brand && !nmKey(p.name).includes(nmKey(p.brand)) ? `${p.brand} ${p.name}` : p.name);

  /* ----- live-forslag mens man skriver i indkøbslisten ----- */
  let sugT, sugQ = '', sugData = new Map();
  const sugBox = () => $('#nm-sugg');
  function nmSuggHide() { const b = sugBox(); if (b) { b.hidden = true; b.innerHTML = ''; } sugQ = ''; clearTimeout(sugT); }
  function nmSuggestSoon(v) {
    clearTimeout(sugT);
    const q = String(v || '').trim();
    if (!sugBox()) return;
    if (nmParse(q).q.length < 2) return nmSuggHide();
    nmShowSugg(q, null);                       // jeres egne varer med det samme …
    sugT = setTimeout(() => nmFetchSugg(q), 350); // … og live-priser fra Nemlig lidt efter
  }
  async function nmFetchSugg(q) {
    sugQ = q;
    let live;
    try { live = await nmSearch(nmParse(q).q); } catch (e) { live = []; }
    if (sugQ === q) nmShowSugg(q, live);
  }
  function nmShowSugg(q, live) {
    const box = sugBox(), inp = $('#shop-input');
    if (!box || !inp || nmKey(inp.value) !== nmKey(q)) return;
    const term = nmParse(q).q, words = nmKey(term).split(' ');
    const s = NM(), hit = t => words.every(w => nmKey(t).includes(w));
    const liveBy = new Map((live || []).map(p => [String(p.product_id), p]));
    // jeres varer: dem der matcher ordet, eller som ordet før er blevet koblet til
    const mapped = nmMapped(term);
    const mineIds = Object.keys(s.known)
      .filter(id => id === mapped || hit(`${s.known[id].brand} ${s.known[id].name} ${s.known[id].desc}`) || liveBy.has(id))
      .sort((a, b) => (b === mapped) - (a === mapped) || s.known[b].n - s.known[a].n || s.known[b].last - s.known[a].last).slice(0, 4);
    const mine = mineIds.map(id => {
      const p = liveBy.get(id), k = s.known[id];
      const o = p ? prodOpt(p) : { id, name: k.name, sub: [k.brand, k.desc].filter(Boolean).join(' · '), price: null, img: k.img };
      return { ...o, mine: true, sub: [k.n ? `købt ${k.n} ${k.n === 1 ? 'gang' : 'gange'} via tavlen` : 'valgt før', o.sub].filter(Boolean).join(' · ') };
    });
    const rest = (live || []).filter(p => !mineIds.includes(String(p.product_id))).slice(0, 6).map(prodOpt);
    sugData = new Map((live || []).map(p => [String(p.product_id), p]));
    mineIds.forEach(id => { if (!sugData.has(id)) { const k = s.known[id]; sugData.set(id, { product_id: id, name: k.name, brand: k.brand, description: k.desc, price: k.price, image_url: k.img }); } });
    box.innerHTML = `
      ${mine.length ? `<div class="nm-sugg-h">Plejer I at købe</div>${optsHtml(mine, 'sug')}` : ''}
      <div class="nm-sugg-h">Fra Nemlig ${live ? '· live-priser' : ''}</div>
      ${live ? (rest.length ? optsHtml(rest, 'sug') : '<div class="empty sm">Ingen varer fundet hos Nemlig</div>') : '<div class="empty sm">Henter priser …</div>'}
      <button class="nm-sugg-text" data-sug="text">${ic('plus')}Tilføj „${esc(q)}“ som tekst</button>`;
    box.hidden = false;
  }
  async function nmSuggPick(el) {
    const p = sugData.get(el.dataset.id) || { product_id: el.dataset.id, name: el.dataset.name };
    const inp = $('#shop-input'), { n, q } = nmParse(inp?.value || '');
    const title = nmTitle(p), summary = `${n > 1 ? n + ' ' : ''}${title}`;
    // listen får varens rigtige navn, og "Læg listen i kurven" bruger præcis denne vare
    nmRemember({ ...p, price: prodOpt(p).price }, [summary, title, q], false);
    if (inp) inp.value = '';
    nmSuggHide();
    await shopAdd(summary);
  }

  function nemligSearch() {
    nmPicker({ title: 'Find vare hos Nemlig', text: 'Søg i hele sortimentet og tryk + for at lægge varen i kurven.', close: 'Luk',
      onPick: async (id, name, img) => {
        try {
          const r = await nmAdd({ product_id: id, quantity: 1 });
          if (r.status !== 'added') throw new Error('Varen kunne ikke lægges i kurven');
          nmRemember({ product_id: id, name: r.name || name, img });
          FX.sound('tap'); toast(`🛒 ${r.name || name} lagt i kurven`);
          return true;
        } catch (e) { toast('⚠️ ' + (e.message || 'Noget gik galt'), 'bad'); return false; }
      } });
    setTimeout(() => $('#nm-q')?.focus(), 50);
  }

  function nemligBasket() {
    const n = nemligIds(), b = n && App.ha.get(n.basket);
    if (!b) return;
    const a = b.attributes, lines = a.lines || [];
    const m = modal(`<h2>Nemlig-kurven</h2>
      <div class="nm-lines">${lines.map(l => `<div class="nm-line-row"><span class="q">${l.quantity} ×</span>${nmImgTag(l.image_url || NM().known[String(l.product_id)]?.img, 'nm-img sm')}<span class="nm-n">${esc(l.name)}</span><b>${kr(l.price)}</b></div>`).join('')
        || '<div class="empty">Kurven er tom.</div>'}</div>
      <div class="nm-sum">
        <div><small>Varer</small><b>${kr(b.state)}</b></div>
        <div><small>Levering</small><b>${a.delivery_price == null ? '–' : +a.delivery_price ? kr(a.delivery_price) : 'Gratis'}</b></div>
        <div class="tot"><small>I alt</small><b>${kr(a.total_price ?? b.state)}</b></div>
      </div>
      <p class="muted">Vil I rette eller fjerne en vare, så gør det i Nemlig-appen. Den viser den samme kurv.</p>
      <div class="form-actions"><button class="btn primary" data-close-modal>Luk</button></div>`);
    m.addEventListener('click', e => { if (e.target.closest('[data-close-modal]')) closeModal(m); });
  }

  function newEventModal() {
    const cals = calEntities();
    // standardkalender – ellers den første der hedder noget med "familie" og kan oprette aftaler
    const canCreate = id => ((App.ha.get(id)?.attributes?.supported_features || 0) & 1) === 1;
    const def = cfg().calendarDefault && cals.includes(cfg().calendarDefault) ? cfg().calendarDefault
      : cals.find(c => /famil/i.test(c) && canCreate(c)) || cals.find(canCreate) || cals[0];
    const today = Store.dkey();
    modal(`<form class="form" onsubmit="return false">
      <h2>Ny aftale</h2>
      <label class="field"><span>Hvad</span><input name="summary" placeholder="Fx Fodbold" autocomplete="off"></label>
      <div class="form-grid">
        <label class="field"><span>Dato</span><input name="date" type="date" value="${today}"></label>
        <label class="field"><span>Fra</span><input name="from" type="time" value="16:00"></label>
        <label class="field"><span>Til</span><input name="to" type="time" value="17:00"></label>
      </div>
      <label class="toggle-row"><label class="toggle"><input type="checkbox" name="allday"><i></i></label>Hele dagen</label>
      <label class="field"><span>Sted (valgfrit)</span><input name="location" autocomplete="off"></label>
      ${cals.length > 1 ? `<label class="field"><span>Kalender</span><select name="cal">${cals.map(c => `<option value="${c}" ${c === def ? 'selected' : ''}>${esc(App.ha.get(c)?.attributes?.friendly_name || c)}</option>`).join('')}</select></label>`
        : `<input type="hidden" name="cal" value="${def}">`}
      <div class="form-actions"><span class="grow"></span>
        <button type="button" class="btn ghost" data-act="close-modal">Annullér</button>
        <button type="button" class="btn primary" data-act="save-event">Gem aftale</button></div>
    </form>`);
  }

  /* ================= OPGAVER (børnenes side) ================= */
  function pageKids() {
    const kids = S().kids;
    if (!kids.length) return `<div class="card empty big">Der er ingen børn endnu. Tilføj dem under <b>Forældre</b> 🔒</div>`;
    if (!kids.find(k => k.id === App.kid)) App.kid = kids[0].id;
    const kid = Store.kid(App.kid);
    const pr = Store.progress(kid.id), lv = Store.level(kid.lifetime), st = Store.streak(kid.id);
    const tasks = Store.tasksFor(kid.id), dm = Store.doneMap(kid.id);

    return `<div class="kid-page" style="--kc:${kid.color}">
      ${kids.length > 1 ? `<div class="kid-tabs">${kids.map(k => `
        <button class="kid-tab ${k.id === kid.id ? 'active' : ''}" style="--kc:${k.color}" data-act="pick-kid" data-id="${k.id}">
          <span class="mini-av">${avatar(k)}</span>${esc(k.name)}
          ${Store.progress(k.id).all ? '<span class="tab-done">✓</span>' : ''}</button>`).join('')}</div>` : ''}
      <div class="kid-layout">
        <aside class="card kid-profile">
          ${ring('kid-' + kid.id, pr.p, '11rem', kid.color, avatar(kid))}
          <h2 class="kp-name">${esc(kid.name)}</h2>
          <div class="level-badge">${lv.emoji} Niveau ${lv.index + 1} · ${lv.name}</div>
          <div class="big-stars"><span class="star-ico" id="star-target">⭐</span>${count('stars-' + kid.id, kid.stars)}</div>
          <div class="kp-label">stjerner at bruge</div>
          ${lv.next
            ? `<div class="lvl-bar"><i style="width:${(lv.pct * 100).toFixed(1)}%"></i></div>
               <div class="kp-small">${lv.next.min - kid.lifetime} ⭐ mere til ${lv.next.emoji} ${lv.next.name}</div>`
            : `<div class="kp-small">Du har nået det højeste niveau! 👑</div>`}
          <div class="streak ${st ? 'on' : ''}"><span class="flame">🔥</span><b>${st}</b>&nbsp;${st === 1 ? 'dag' : 'dage'} i træk</div>
          <div class="week">${Store.week(kid.id).map(d => `
            <div class="wd ${d.state} ${d.today ? 'today' : ''}"><i>${d.state === 'done' ? '✓' : ''}</i><span>${d.label}</span></div>`).join('')}</div>
        </aside>
        <section class="kid-main">
          <div class="tasks-head"><h2>Dagens opgaver</h2>
            <div class="pill">${pr.total ? `${pr.done} af ${pr.total} klaret` : 'Ingen opgaver i dag'}</div></div>
          <div class="task-grid">${tasks.map(t => taskCard(kid, t, !!dm[t.id])).join('') ||
            `<div class="empty card">Ingen opgaver i dag – nyd fridagen! 🌈</div>`}</div>
          ${rewardsBlock(kid)}
        </section>
      </div>
    </div>`;
  }

  const taskCard = (kid, t, done) => `
    <button class="task ${done ? 'done' : ''}" data-act="task" data-kid="${kid.id}" data-id="${t.id}">
      <span class="t-emoji">${t.emoji}</span>
      <span class="t-title">${esc(t.title)}</span>
      <span class="t-pts">+${t.points} ⭐</span>
      <span class="t-check">${ic('check')}</span>
    </button>`;

  function rewardsBlock(kid) {
    const rs = [...S().rewards].sort((a, b) => a.cost - b.cost);
    if (!rs.length) return '';
    return `<div class="rewards">
      <h3 class="sec-title">${ic('gift')} Spar op til en belønning</h3>
      <div class="reward-row">${rs.map(r => {
        const ok = kid.stars >= r.cost, p = Math.min(1, kid.stars / r.cost);
        return `<button class="reward ${ok ? 'ok' : ''}" data-act="redeem" data-kid="${kid.id}" data-id="${r.id}">
          <span class="rw-emoji">${r.emoji}</span>
          <span class="rw-title">${esc(r.title)}</span>
          <span class="rw-bar"><i style="width:${p * 100}%"></i></span>
          <span class="rw-cost">${ok ? 'Kan indløses! 🎉' : `${kid.stars} / ${r.cost} ⭐`}</span></button>`;
      }).join('')}</div></div>`;
  }

  async function onTask(el) {
    const kid = Store.kid(el.dataset.kid), t = Store.task(el.dataset.id);
    if (!kid || !t) return;
    if (el.classList.contains('done')) {
      const ok = await confirmDialog(`Fortryd “${esc(t.title)}”?`, `${esc(kid.name)} mister ${t.points} ⭐ igen.`, 'Ja, fortryd', 'Nej');
      if (ok) { Store.undo(kid.id, t.id); FX.sound('undo'); render(); }
      return;
    }
    const res = Store.complete(kid.id, t.id);
    if (!res) return;
    el.classList.add('done', 'pop');
    el.dataset.act = '';
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    FX.burst(cx, cy, { colors: [kid.color, '#ffd84d', '#ffffff', '#30e3a0', '#5ad1ff'] });
    FX.sound('ding');
    praise(cx, r.top, res.points);
    flyStar(cx, cy, $('#star-target'));
    setTimeout(() => {
      render();
      if (res.allDone) celebrate(kid, res.levelUp);
      else if (res.levelUp) levelUp(kid, res.levelUp);
    }, 950);
  }

  function praise(x, y, pts) {
    const el = document.createElement('div');
    el.className = 'praise';
    el.innerHTML = `${PRAISE[(Math.random() * PRAISE.length) | 0]}<small>+${pts} ⭐</small>`;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }

  function flyStar(x, y, target) {
    if (!target) return;
    const t = target.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'fly-star';
    el.textContent = '⭐';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    const dx = t.left + t.width / 2 - x, dy = t.top + t.height / 2 - y;
    el.animate([
      { transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 },
      { transform: `translate(calc(-50% + ${dx * 0.3}px), calc(-50% + ${dy * 0.3 - 120}px)) scale(2.2) rotate(90deg)`, opacity: 1, offset: 0.35 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.8) rotate(360deg)`, opacity: 0.9 },
    ], { duration: 850, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => {
      el.remove();
      target.classList.remove('bump'); void target.offsetWidth; target.classList.add('bump');
    };
  }

  function celebrate(kid, lvUp) {
    FX.sound('fanfare');
    FX.rain(3000, [kid.color, '#ffd84d', '#5ad1ff', '#30e3a0', '#ff6fae', '#ffffff']);
    const st = Store.streak(kid.id), earned = Store.earnedToday(kid.id);
    overlay(`<div class="celebrate" style="--kc:${kid.color}">
      <div class="rays"></div>
      <div class="cel-card">
        <div class="cel-av">${avatar(kid)}<span class="cel-trophy">🏆</span></div>
        <h1>Sejt klaret, ${esc(kid.name)}!</h1>
        <p>Alle dagens opgaver er klaret.<br>Du har tjent <b>${earned} ⭐</b> i dag${st > 1 ? ` og har en stime på <b>🔥 ${st} dage</b>` : ''}!</p>
        <button class="btn primary big" data-close>Juhuu! 🎉</button>
      </div></div>`, () => { if (lvUp) levelUp(kid, lvUp); });
  }

  function levelUp(kid, lv) {
    FX.sound('level');
    FX.burst(innerWidth / 2, innerHeight / 2, { count: 160, power: 1.4 });
    overlay(`<div class="celebrate level" style="--kc:${kid.color}">
      <div class="rays"></div>
      <div class="cel-card">
        <div class="lvl-emoji">${lv.emoji}</div>
        <div class="lvl-tag">NYT NIVEAU!</div>
        <h1>${esc(kid.name)} er nu ${lv.name}</h1>
        <p>Niveau ${lv.index + 1} – fortsæt den gode stil!</p>
        <button class="btn primary big" data-close>Fedt! ⭐</button>
      </div></div>`);
  }

  async function onRedeem(el) {
    const kid = Store.kid(el.dataset.kid), r = S().rewards.find(x => x.id === el.dataset.id);
    if (!kid || !r) return;
    if (kid.stars < r.cost) {
      FX.sound('tap');
      toast(`${kid.name} mangler ${r.cost - kid.stars} ⭐ til “${r.title}” – kæmp videre! 💪`);
      return;
    }
    const ok = await confirmDialog(`Indløs ${r.emoji} ${esc(r.title)}?`, `Det koster ${r.cost} ⭐. En voksen skal godkende med PIN-koden.`, 'Indløs', 'Ikke nu');
    if (!ok || !(await askPin('Godkend belønningen'))) return;
    if (Store.redeem(kid.id, r.id)) {
      FX.sound('fanfare');
      FX.burst(innerWidth / 2, innerHeight / 2, { count: 140, colors: [kid.color, '#ffd84d', '#ffffff'] });
      toast(`🎁 ${kid.name} har indløst: ${r.title}`);
      render();
    }
  }

  /* ================= MUSIK & TV ================= */
  function musicWidget(compact) {
    const ha = App.ha, s = ha.get(cfg().spotify);
    const head = cardHead('music', 'Spotify', compact ? `<button class="link" data-act="nav" data-page="media">Mere ›</button>` : '');
    if (!s) return head + notLinked('Vælg jeres Spotify-afspiller under Forældre → Integrationer.');
    const a = s.attributes, playing = s.state === 'playing';
    const pic = ha.picture(a.entity_picture);
    const grad = a.demo_colors ? `background:linear-gradient(135deg,${a.demo_colors[0]},${a.demo_colors[1]})` : '';
    const art = pic ? `<img src="${esc(pic)}" alt="">` : `<div class="art-ph" style="${grad}">${ic('music')}</div>`;
    const prog = a.media_duration ? `
      <div class="prog-wrap"><div class="prog" data-prog data-pos="${a.media_position || 0}" data-upd="${esc(a.media_position_updated_at || '')}"
        data-dur="${a.media_duration}" data-playing="${playing ? 1 : 0}"><i></i></div>
        <div class="prog-t"><span data-prog-cur>0:00</span><span>${fmtTime(a.media_duration)}</span></div></div>` : '';
    // Spotify udelader ofte Google-højttalere fra source_list – tag altid den aktive med
    const speakers = [...new Set([a.source, ...(a.source_list || [])].filter(Boolean))];
    // Med Spotcast: vis alle Google Cast-højttalere fra Home Assistant i stedet
    const casts = castSpeakers();
    const own = !compact ? (App.myPlaylists || []) : [];
    // de håndskrevne hurtig-playlister – udelad pladsholdere når familiens egne playlister kan vises
    const playlists = cfg().playlists.split('\n').map(l => l.split('|').map(x => x.trim()))
      .filter(x => x[0] && x[1] && !(own.length && /INDSÆT_ID/.test(x[1])));
    return `${head}
      <div class="player ${compact ? 'compact' : 'full'} ${playing ? 'playing' : ''}">
        <div class="art">${art}${playing ? '<div class="eq"><i></i><i></i><i></i><i></i></div>' : ''}</div>
        <div class="pl-info">
          <div class="pl-title">${esc(a.media_title || 'Intet afspilles lige nu')}</div>
          <div class="pl-artist">${esc(a.media_artist || '')}${a.source ? ` <span class="pl-src">${ic('speaker')}${esc(a.source)}</span>` : ''}</div>
          ${prog}
          <div class="pl-ctrls">
            ${!compact ? `<button class="ctl sm ${a.shuffle ? 'on' : ''}" data-act="shuffle" aria-label="Bland">${ic('shuffle')}</button>` : ''}
            <button class="ctl" data-act="media" data-svc="media_previous_track" aria-label="Forrige">${ic('prev')}</button>
            <button class="ctl main" data-act="media" data-svc="media_play_pause" aria-label="Afspil/pause">${ic(playing ? 'pause' : 'play')}</button>
            <button class="ctl" data-act="media" data-svc="media_next_track" aria-label="Næste">${ic('next')}</button>
          </div>
          <label class="vol">${ic('vol')}<input type="range" min="0" max="100" value="${Math.round((a.volume_level ?? 0) * 100)}" data-input="volume"></label>
        </div>
      </div>
      ${!compact && casts.length ? `<h4 class="sub-title">Afspil på</h4><div class="chips">${casts.map(c => {
          const n = c.attributes.friendly_name || c.entity_id;
          const on = n === a.source || (!a.source && c.entity_id === cfg().speaker);
          return `<button class="chip-btn ${on ? 'on' : ''}" data-act="speaker" data-id="${c.entity_id}" data-name="${esc(n)}">${ic('speaker')}${esc(n)}</button>`;
        }).join('')}</div>`
      : !compact && speakers.length ? `<h4 class="sub-title">Afspil på</h4><div class="chips">${speakers.map(src =>
        `<button class="chip-btn ${src === a.source ? 'on' : ''}" data-act="source" data-src="${esc(src)}">${ic('speaker')}${esc(src)}</button>`).join('')}</div>` : ''}
      ${!compact && playlists.length ? `<h4 class="sub-title">Hurtig-playlister</h4><div class="playlists">${playlists.map(([n, u], i) =>
        `<button class="playlist" style="--h:${(i * 67 + 200) % 360}" data-act="playlist" data-uri="${esc(u)}" data-name="${esc(n)}">${ic('music')}<span>${esc(n)}</span></button>`).join('')}</div>` : ''}
      ${own.length ? `<h4 class="sub-title">Jeres playlister</h4><div class="my-playlists">${own.map(p =>
        `<button class="my-pl" data-act="playlist" data-uri="${esc(p.uri)}" data-name="${esc(p.name)}">
          ${p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy">` : `<span class="my-pl-ph">${ic('music')}</span>`}
          <span>${esc(p.name)}</span></button>`).join('')}</div>` : ''}`;
  }

  // app-links til Google TV (Android TV Remote). "market://launch?id=<pakke>" virker for alle apps.
  const TV_APP_LINKS = {
    netflix: 'https://www.netflix.com/title',
    prime: 'https://app.primevideo.com',
    disney: 'https://www.disneyplus.com',
    youtube: 'https://www.youtube.com',
    hbo: 'market://launch?id=com.wbd.stream',
    drtv: 'market://launch?id=dk.dr.tvplayer',
    tv2: 'market://launch?id=dk.tv2.play',
    viaplay: 'market://launch?id=com.viaplay.android',
    skyshowtime: 'market://launch?id=com.skyshowtime.skyshowtime.google',
    spotify: 'market://launch?id=com.spotify.tv.android',
  };
  /* ---------- Spotcast: start/flyt Spotify på Google Cast-højttalere ---------- */
  const hasSpotcast = () => Object.keys(App.ha.states).some(id => /^(media_player|sensor)\..*spotcast/.test(id));
  function castSpeakers() {
    if (!hasSpotcast()) return [];
    const tvMp = String(cfg().tv || '').replace(/^remote\./, 'media_player.');
    const seen = new Set();
    return App.ha.list('media_player').filter(s => {
      const n = s.attributes.friendly_name;
      if (!n || /spotify|spotcast/.test(s.entity_id) || s.entity_id === tvMp || s.state === 'unavailable' || seen.has(n)) return false;
      seen.add(n);
      return true;
    });
  }
  // familiens egne Spotify-playlister (via Spotcasts websocket-kommando), hentes højst hver 30. min.
  async function loadPlaylists(force) {
    if (App.ha.isDemo || !App.ha.send || !hasSpotcast()) return;
    if (!force && App.plLoaded && Date.now() - App.plLoaded < 30 * 60e3) return;
    App.plLoaded = Date.now();
    try {
      const r = await App.ha.send({ type: 'spotcast/playlists' });
      const list = Array.isArray(r) ? r : (r?.playlists || []);
      App.myPlaylists = list.filter(p => p?.uri).map(p => {
        const imgs = p.images || [];
        const img = (imgs.find(i => i.width && i.width <= 320) || imgs[imgs.length - 1] || imgs[0] || {}).url || '';
        return { name: p.name, uri: p.uri, img };
      });
      if (App.page === 'media') render();
    } catch (e) { App.plLoaded = 0; console.warn('Playlister kunne ikke hentes', e); }
  }

  // den højttaler playlister skal starte på: den der spiller nu, ellers den sidst valgte, ellers Køkken
  function targetSpeaker() {
    const casts = castSpeakers();
    const src = App.ha.get(cfg().spotify)?.attributes?.source;
    return casts.find(c => c.attributes.friendly_name === src)?.entity_id
      || casts.find(c => c.entity_id === cfg().speaker)?.entity_id
      || casts.find(c => /k.kken|kitchen/i.test(c.entity_id))?.entity_id
      || casts[0]?.entity_id;
  }

  const streams = () => cfg().streaming.filter(s => s.on);
  const streamTile = s => `<button class="stream" style="--sc:${s.color}" data-act="stream" data-id="${s.id}"><span>${esc(s.name)}</span></button>`;

  function pageMedia() {
    setTimeout(() => loadPlaylists(), 0);
    const tv = App.ha.get(cfg().tv);
    return `<div class="media-grid">
      <section class="card media-player">${musicWidget(false)}</section>
      <div class="media-col">
        <section class="card media-stream">
          ${cardHead('tv', 'Streaming')}
          <div class="stream-grid big">${streams().map(streamTile).join('')}</div>
          <p class="hint">${tv ? `Tryk på en tjeneste for at starte den på <b>${esc(tv.attributes.friendly_name || 'TV’et')}</b> eller her på skærmen.` :
            'Tip: Forbind jeres Google TV / Chromecast i Home Assistant, så kan I starte Netflix & co. direkte på TV’et herfra.'}</p>
        </section>
        ${tv && cfg().tv.startsWith('remote.') ? remoteCard(tv) : ''}
      </div>
    </div>`;
  }

  /* ---------- fjernbetjening til Google TV (Android TV Remote) ---------- */
  const APP_NAMES = {
    'com.netflix.ninja': 'Netflix', 'com.amazon.amazonvideo.livingroom': 'Prime Video', 'com.disney.disneyplus': 'Disney+',
    'com.google.android.youtube.tv': 'YouTube', 'com.wbd.stream': 'HBO Max', 'dk.dr.tvplayer': 'DRTV', 'dk.tv2.play': 'TV 2 Play',
    'com.viaplay.android': 'Viaplay', 'com.spotify.tv.android': 'Spotify', 'com.google.android.apps.tv.launcherx': 'Startskærmen',
  };
  function remoteCard(tv) {
    const on = tv.state === 'on';
    const act = tv.attributes.current_activity || '';
    const key = (k, icon, cls = '', label = '') =>
      `<button class="rk ${cls}" data-act="tvkey" data-k="${k}" aria-label="${label || k}">${icon}</button>`;
    return `<section class="card remote-card">
      ${cardHead('tv', `Fjernbetjening · ${esc(tv.attributes.friendly_name || 'TV')}`,
        `<button class="rk power ${on ? 'on' : ''}" data-act="tvkey" data-k="POWER" aria-label="Tænd/sluk">${ic('power')}</button>`)}
      <div class="remote">
        <div class="r-now">${on ? `Kører nu: <b>${esc(APP_NAMES[act] || act || '–')}</b>` : 'TV’et er slukket'}</div>
        <div class="dpad">
          ${key('DPAD_UP', '▲', 'up', 'Op')}${key('DPAD_LEFT', '◀', 'left', 'Venstre')}
          ${key('DPAD_CENTER', 'OK', 'ok', 'OK')}
          ${key('DPAD_RIGHT', '▶', 'right', 'Højre')}${key('DPAD_DOWN', '▼', 'down', 'Ned')}
        </div>
        <div class="r-row">
          ${key('BACK', `${ic('back')}<span>Tilbage</span>`, 'wide', 'Tilbage')}
          ${key('HOME', `${ic('home')}<span>Hjem</span>`, 'wide', 'Hjem')}
          ${key('MEDIA_PLAY_PAUSE', `${ic('play')}<span>Afspil</span>`, 'wide', 'Afspil/pause')}
        </div>
        <div class="r-row">
          ${key('VOLUME_DOWN', '🔉', 'wide', 'Lavere')}${key('VOLUME_MUTE', '🔇', 'wide', 'Lyd fra')}${key('VOLUME_UP', '🔊', 'wide', 'Højere')}
        </div>
      </div>
    </section>`;
  }

  async function onStream(el) {
    const s = cfg().streaming.find(x => x.id === el.dataset.id);
    if (!s) return;
    const tvId = cfg().tv, tv = App.ha.get(tvId);
    if (tv && s.source) {
      const where = await choose(`Hvor vil I se ${esc(s.name)}?`, '', [
        { v: 'tv', label: `📺 På ${esc(tv.attributes.friendly_name || 'TV’et')}`, primary: true },
        { v: 'here', label: '🖥️ Her på skærmen' },
      ]);
      if (where === 'tv') {
        let ok;
        if (tvId.startsWith('remote.')) {
          // Google TV via "Android TV Remote": start appen med et app-link
          const activity = /[:/]/.test(s.source) ? s.source : (TV_APP_LINKS[s.id] || s.source);
          ok = await call('remote', 'turn_on', { entity_id: tvId, activity });
        } else {
          if (tv.state === 'off') await call('media_player', 'turn_on', { entity_id: tvId });
          ok = await call('media_player', 'select_source', { entity_id: tvId, source: s.source });
        }
        if (ok) toast(`📺 Starter ${s.name} på TV’et`);
      } else if (where === 'here') openUrl(s.url);
    } else openUrl(s.url);
  }
  function openUrl(u) {
    const w = window.open(u, '_blank');
    if (w) w.opener = null; else location.href = u;
  }

  /* ================= BILER ================= */
  // stiliserede sidebilleder (fronten til højre): "hatch" = personbil/crossover, "van" = MPV/varebil
  const CAR_SVG = {
    hatch: `<path class="cb" d="M10 62c0-8 2-14 8-16l17-3c11-13 29-21 56-22h27c16 0 28 6 40 17l22 6c8 2 12 7 12 13v5c0 3-2 5-5 5H13c-2 0-3-2-3-5z"/>
      <path class="cw" d="M45 43c10-10 24-16 45-17h14v17zM110 26h8c12 0 22 5 32 15l-40 2z"/>
      <path class="cs" d="M16 53h170"/><path class="cli" d="M180 47l10 3"/><path class="clr" d="M12 48l8-1"/>`,
    van: `<path class="cb" d="M10 64V27c0-8 5-13 14-13l116-1c10 0 16 3 22 10l14 17c10 3 16 8 16 16v7c0 3-2 5-5 5H13c-2 0-3-2-3-4z"/>
      <path class="cw" d="M21 20h40v20H21zM66 19l52-1v22H66zM124 18h16c7 0 11 2 15 8l11 14h-42z"/>
      <path class="cs" d="M14 51h174"/><path class="cli" d="M178 44l12 4"/><path class="clr" d="M11 30v14"/>`,
  };
  const carSvg = shape => `<svg viewBox="0 0 200 82" class="car-svg">${CAR_SVG[shape] || CAR_SVG.hatch}
      <circle class="ct" cx="50" cy="64" r="13"/><circle class="ch" cx="50" cy="64" r="5.5"/>
      <circle class="ct" cx="156" cy="64" r="13"/><circle class="ch" cx="156" cy="64" r="5.5"/></svg>`;

  function carInfo(c) {
    const g = id => App.ha.get(id);
    const bat = parseFloat(g(c.battery)?.state), rng = parseFloat(g(c.range)?.state);
    const ch = String(g(c.charging)?.state || '').toLowerCase();
    const lk = g(c.lock);
    const lockDom = String(c.lock || '').split('.')[0];
    // Renault m.fl. giver kun låsestatus som binary_sensor (on = ulåst) – vis status, men ingen knap
    let lock = lk?.state;
    if (lk && lockDom === 'binary_sensor') lock = lk.state === 'off' ? 'locked' : 'unlocked';
    const upd = g(c.battery)?.last_updated;
    return {
      bat: isNaN(bat) ? null : bat,
      rng: isNaN(rng) ? null : Math.round(rng),
      unit: g(c.range)?.attributes?.unit_of_measurement || 'km',
      charging: ['on', 'charging', 'charge_in_progress', 'true'].includes(ch),
      lock, hasLock: !!lk, lockCtrl: !!lk && lockDom === 'lock', hasClimate: !!g(c.climate),
      linked: !!(g(c.battery) || lk),
      updated: upd ? new Date(upd) : null,
    };
  }

  function carWidget(c, compact) {
    const i = carInfo(c);
    const batCls = i.bat == null ? '' : i.bat < 20 ? 'low' : i.bat < 50 ? 'mid' : 'high';
    const locked = i.lock === 'locked';
    const busy = ['locking', 'unlocking', 'opening'].includes(i.lock);
    const lockTxt = busy ? (i.lock === 'locking' ? 'Låser…' : 'Låser op…') : locked ? 'Låst' : i.lock === 'jammed' ? 'Fejl' : 'Ulåst';
    return `<div class="car ${compact ? 'compact' : 'full'}" style="--car:${c.color}">
      <div class="car-head">
        <div><div class="car-brand">${esc(c.brand || '')}</div><div class="car-name">${esc(c.name)}</div></div>
        ${i.hasLock ? `<span class="lock-pill ${locked ? 'ok' : busy ? 'wait' : 'warn'}">${ic(locked ? 'lock' : 'unlock')}${lockTxt}</span>` : ''}
      </div>
      <div class="car-art ${i.charging ? 'charging' : ''}">${c.photo ? `<img class="car-photo" src="${c.photo}" alt="${esc(c.name)}">` : carSvg(c.shape)}${i.charging ? `<span class="charge-bolt">${ic('bolt')}</span>` : ''}</div>
      ${!i.linked ? notLinked('Vælg bilens enheder under Forældre → Integrationer.') : `
      <div class="battery ${batCls} ${i.charging ? 'charging' : ''}">
        <div class="bat-shell"><i style="width:${i.bat ?? 0}%"></i></div>
        <div class="bat-num">${i.bat != null ? Math.round(i.bat) + '<small>%</small>' : '–'}</div>
      </div>
      <div class="car-meta">
        <span>${ic('route')}${i.rng != null ? `${i.rng} ${esc(i.unit)}` : '–'}</span>
        <span class="${i.charging ? 'chg' : ''}">${ic(i.charging ? 'bolt' : 'plug')}${i.charging ? 'Lader' : 'Lader ikke'}</span>
      </div>
      <div class="car-actions">
        ${i.lockCtrl ? `<button class="btn ${locked ? 'ghost' : 'primary'}" data-act="car-lock" data-id="${c.id}" ${busy ? 'disabled' : ''}>
          ${ic(locked ? 'unlock' : 'lock')}${locked ? 'Lås op' : 'Lås bilen'}</button>` : ''}
        ${i.hasClimate ? `<button class="btn ghost" data-act="car-climate" data-id="${c.id}">${ic('thermo')}Forvarm</button>` : ''}
      </div>
      ${!compact && i.updated ? `<div class="car-upd">Opdateret ${i.updated.toLocaleString('da-DK', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</div>` : ''}`}
    </div>`;
  }

  function pageCars() {
    const cars = cfg().cars;
    if (!cars.length) return `<div class="card empty big">Ingen biler sat op endnu – tilføj dem under Forældre → Integrationer.</div>`;
    return `<div class="cars-grid">${cars.map(c => `<section class="card">${carWidget(c, false)}</section>`).join('')}</div>`;
  }

  async function onCarLock(el) {
    const c = cfg().cars.find(x => x.id === el.dataset.id);
    if (!c) return;
    if (carInfo(c).lock === 'locked') {
      if (!(await askPin(`Lås ${c.name} op`))) return;
      if (await call('lock', 'unlock', { entity_id: c.lock })) toast(`🔓 ${c.name} låses op…`);
    } else {
      FX.sound('tap');
      if (await call('lock', 'lock', { entity_id: c.lock })) toast(`🔒 ${c.name} låses…`);
    }
  }

  async function onClimate(el) {
    const c = cfg().cars.find(x => x.id === el.dataset.id);
    if (!c) return;
    const d = c.climate.split('.')[0];
    const map = { button: 'press', input_button: 'press', script: 'turn_on', switch: 'turn_on', climate: 'turn_on' };
    if (await call(map[d] ? d : 'homeassistant', map[d] || 'turn_on', { entity_id: c.climate })) toast(`♨️ Forvarmning af ${c.name} er startet`);
  }

  /* ================= HJEMMET ================= */
  function lightList() {
    const f = cfg().lights.split(/[\s,]+/).filter(Boolean);
    return f.length ? f.map(id => App.ha.get(id)).filter(Boolean) : App.ha.list('light');
  }
  const SCENE_EMOJI = n => {
    n = n.toLowerCase();
    if (/morgen/.test(n)) return '☀️';
    if (/mad|middag|spis/.test(n)) return '🍽️';
    if (/film|tv|bio/.test(n)) return '🎬';
    if (/nat|sov/.test(n)) return '🌙';
    if (/hygge|stearin/.test(n)) return '🕯️';
    if (/fest|party/.test(n)) return '🎉';
    return '✨';
  };
  const sceneBtn = s => {
    const n = s.attributes.friendly_name || s.entity_id;
    return `<button class="scene" data-act="scene" data-id="${s.entity_id}" data-name="${esc(n)}"><span>${SCENE_EMOJI(n)}</span>${esc(n)}</button>`;
  };

  function lightsWidget() {
    const ls = lightList(), on = ls.filter(l => l.state === 'on');
    const fav = String(cfg().scenes || '').split(/[\s,]+/).filter(Boolean).map(id => App.ha.get(id)).filter(Boolean);
    const scenes = (fav.length ? fav : App.ha.list('scene')).slice(0, 6);
    return `${cardHead('bulb', 'Lys', `<button class="link" data-act="nav" data-page="house">Alle ›</button>`)}
      ${!ls.length && !scenes.length ? notLinked('Ingen lys fundet i Home Assistant endnu.') : `
      <div class="lights-sum"><b>${on.length}</b><span>af ${ls.length} lys tændt</span></div>
      <div class="scene-grid">${scenes.map(sceneBtn).join('')}</div>
      <button class="btn ghost wide" data-act="all-off" ${on.length ? '' : 'disabled'}>${ic('power')}Sluk alle lys</button>`}`;
  }

  function lightTile(l) {
    const on = l.state === 'on', a = l.attributes;
    const pct = Math.round(((a.brightness ?? 255) / 255) * 100);
    const rgb = a.rgb_color ? `rgb(${a.rgb_color.join(',')})` : '#ffd38a';
    const modes = a.supported_color_modes || [];
    const dim = !(modes.length === 1 && modes[0] === 'onoff');
    return `<div class="light ${on ? 'on' : ''}" style="--lc:${rgb}">
      <button class="light-btn" data-act="light" data-id="${l.entity_id}">
        <span class="bulb">${ic('bulb')}</span>
        <span class="l-name">${esc(a.friendly_name || l.entity_id)}</span>
        <span class="l-state">${on ? (dim ? pct + '%' : 'Tændt') : 'Slukket'}</span>
      </button>
      ${on && dim ? `<input class="bri" type="range" min="1" max="100" value="${pct}" data-input="bri" data-id="${l.entity_id}">` : ''}
    </div>`;
  }

  function extraTile(id) {
    const s = App.ha.get(id);
    if (!s) return '';
    const a = s.attributes, d = id.split('.')[0];
    const name = esc(a.friendly_name || id);
    const toggle = ['switch', 'input_boolean', 'fan', 'light'].includes(d);
    let val = esc(s.state);
    if (d === 'sensor') val = `${esc(isNaN(+s.state) ? s.state : (+s.state).toLocaleString('da-DK', { maximumFractionDigits: 1 }))}<small>${esc(a.unit_of_measurement || '')}</small>`;
    else if (toggle || d === 'binary_sensor') val = s.state === 'on' ? 'Tændt' : 'Slukket';
    else if (d === 'climate') val = `${a.current_temperature ?? '–'}<small>°</small>`;
    const emo = a.device_class === 'temperature' ? '🌡️' : d === 'switch' ? '🔌' : d === 'binary_sensor' ? '📟' : d === 'climate' ? '♨️' : '📊';
    return `<button class="extra ${s.state === 'on' ? 'on' : ''} ${toggle ? 'tog' : ''}" ${toggle ? `data-act="toggle" data-id="${id}"` : ''}>
      <span class="ex-emo">${emo}</span><span class="ex-name">${name}</span><span class="ex-val">${val}</span></button>`;
  }

  function pageHouse() {
    const ls = lightList(), scenes = App.ha.list('scene');
    const extras = cfg().extras.split(/[\s,]+/).filter(id => id && App.ha.get(id));
    const on = ls.filter(l => l.state === 'on').length;
    return `<div class="house">
      ${scenes.length ? `<section class="card">${cardHead('sparkle', 'Stemninger')}<div class="scene-grid wide">${scenes.map(sceneBtn).join('')}</div></section>` : ''}
      <section class="card">${cardHead('bulb', `Lys <span class="muted-n">${on} tændt</span>`,
        `<button class="btn ghost sm" data-act="all-off" ${on ? '' : 'disabled'}>${ic('power')}Sluk alle</button>`)}
        ${ls.length ? `<div class="light-grid">${ls.map(lightTile).join('')}</div>` : notLinked('Ingen lys fundet. Tilføj fx WiZ eller Google Home-enheder i Home Assistant.')}
      </section>
      ${extras.length ? `<section class="card">${cardHead('sparkle', 'Andre enheder')}<div class="extra-grid">${extras.map(extraTile).join('')}</div></section>` : ''}
    </div>`;
  }

  /* ================= FORÆLDRE ================= */
  const parentOk = () => Date.now() < App.parentUntil;

  function pageParent() {
    if (!parentOk()) return `<div class="card empty big">🔒 Forældre-delen er låst. <button class="btn primary" data-act="nav" data-page="parent">Lås op</button></div>`;
    const tabs = [['kids', 'Børn'], ['tasks', 'Opgaver'], ['rewards', 'Belønninger'], ['integrations', 'Integrationer'], ['screen', 'Skærm & backup']];
    const body = { kids: pKids, tasks: pTasks, rewards: pRewards, integrations: pIntegrations, screen: pScreen }[App.parentTab]();
    return `<div class="parent">
      <div class="p-head">
        <div class="seg">${tabs.map(([id, l]) => `<button class="${App.parentTab === id ? 'on' : ''}" data-act="ptab" data-tab="${id}">${l}</button>`).join('')}</div>
        <button class="btn ghost sm" data-act="lock-parent">${ic('lock')}Lås</button>
      </div>
      <div class="p-body">${body}</div>
    </div>`;
  }

  function pKids() {
    return `<div class="p-section">
      <div class="p-list">${S().kids.map(k => {
        const lv = Store.level(k.lifetime);
        return `<div class="p-row" style="--kc:${k.color}">
          <span class="p-av">${avatar(k)}</span>
          <div class="p-main"><b>${esc(k.name)}</b><span>⭐ ${k.stars} at bruge · ${k.lifetime} i alt · ${lv.emoji} ${lv.name}</span></div>
          <button class="btn ghost sm" data-act="bonus" data-id="${k.id}">${ic('star')}Stjerner ±</button>
          <button class="btn ghost sm" data-act="edit-kid" data-id="${k.id}">${ic('edit')}Rediger</button>
        </div>
        ${kidToday(k)}`;
      }).join('') || '<p class="muted">Ingen børn endnu.</p>'}</div>
      <button class="btn primary" data-act="edit-kid">${ic('plus')}Tilføj barn</button>
    </div>
    ${historyBlock()}`;
  }

  // forældrenes kontrol af dagens opgaver: fjern det der ikke er gjort, eller marker det der er
  function kidToday(k) {
    const ts = Store.tasksFor(k.id), dm = Store.doneMap(k.id);
    if (!ts.length) return `<div class="p-today"><span class="muted">Ingen opgaver i dag</span></div>`;
    return `<div class="p-today" style="--kc:${k.color}">
      <div class="p-today-h">I dag · ${ts.filter(t => dm[t.id]).length} af ${ts.length} markeret som udført</div>
      ${ts.map(t => {
        const d = !!dm[t.id];
        return `<div class="pt ${d ? 'done' : ''}">
          <span class="pt-e">${t.emoji}</span>
          <span class="pt-t">${esc(t.title)}<small>${d ? `✓ Udført · +${t.points} ⭐` : 'Ikke udført'}</small></span>
          ${d ? `<button class="btn ghost sm danger" data-act="p-undo" data-kid="${k.id}" data-id="${t.id}">${ic('x')}Ikke udført (−${t.points} ⭐)</button>`
              : `<button class="btn ghost sm" data-act="p-done" data-kid="${k.id}" data-id="${t.id}">${ic('check')}Marker udført</button>`}
        </div>`;
      }).join('')}
    </div>`;
  }

  function historyBlock() {
    const h = S().history.filter(x => x.type === 'redeem').slice(-8).reverse();
    if (!h.length) return '';
    return `<div class="p-section"><h3>Seneste indløste belønninger</h3><div class="p-list">${h.map(x => `
      <div class="p-row slim"><div class="p-main"><b>${esc(Store.kid(x.kidId)?.name || '?')} · ${esc(x.title)}</b>
      <span>${x.cost} ⭐ · ${new Date(x.at).toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div></div>`).join('')}</div></div>`;
  }

  function daysText(t) {
    if (t.once) return 'Kun ' + new Date(t.once + 'T12:00').toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'short' });
    const d = [...t.days].sort((a, b) => a - b).join();
    if (d === '0,1,2,3,4,5,6') return 'Hver dag';
    if (d === '0,1,2,3,4') return 'Hverdage';
    if (d === '5,6') return 'Weekend';
    return t.days.slice().sort((a, b) => a - b).map(i => DAYS[i]).join(', ');
  }

  function pTasks() {
    const kids = S().kids;
    return `<div class="p-section">
      <div class="row"><button class="btn primary" data-act="edit-task">${ic('plus')}Ny opgave</button>
      <span class="muted">Opgaver vises for børnene på de valgte dage og nulstilles hver nat.</span></div>
      <div class="p-list">${S().tasks.map(t => `
        <div class="p-row">
          <span class="p-emo">${t.emoji}</span>
          <div class="p-main"><b>${esc(t.title)}</b><span>${daysText(t)} · +${t.points} ⭐</span></div>
          <div class="p-kids">${t.kids.map(id => kids.find(k => k.id === id)).filter(Boolean)
            .map(k => `<span class="mini-av" style="--kc:${k.color}" title="${esc(k.name)}">${avatar(k)}</span>`).join('')}</div>
          <button class="btn ghost sm" data-act="edit-task" data-id="${t.id}">${ic('edit')}Rediger</button>
        </div>`).join('') || '<p class="muted">Ingen opgaver endnu.</p>'}</div>
    </div>`;
  }

  function pRewards() {
    return `<div class="p-section">
      <div class="row"><button class="btn primary" data-act="edit-reward">${ic('plus')}Ny belønning</button>
      <span class="muted">Børnene sparer stjerner op og indløser belønninger – I godkender med PIN.</span></div>
      <div class="p-list">${[...S().rewards].sort((a, b) => a.cost - b.cost).map(r => `
        <div class="p-row"><span class="p-emo">${r.emoji}</span>
          <div class="p-main"><b>${esc(r.title)}</b><span>${r.cost} ⭐</span></div>
          <button class="btn ghost sm" data-act="edit-reward" data-id="${r.id}">${ic('edit')}Rediger</button></div>`).join('') || '<p class="muted">Ingen belønninger endnu.</p>'}</div>
    </div>`;
  }

  function datalists() {
    const ha = App.ha;
    const all = Object.values(ha.states);
    const opt = list => list.map(s => `<option value="${s.entity_id}">${esc(s.attributes.friendly_name || '')}</option>`).join('');
    const by = (...d) => all.filter(s => d.includes(s.entity_id.split('.')[0]));
    return `<datalist id="dl-media_player">${opt(by('media_player'))}</datalist>
      <datalist id="dl-sensor">${opt(by('sensor', 'binary_sensor'))}</datalist>
      <datalist id="dl-lock">${opt([...by('lock'), ...all.filter(s => s.entity_id.startsWith('binary_sensor.') && /lock/.test(s.entity_id))])}</datalist>
      <datalist id="dl-scene">${opt(by('scene'))}</datalist>
      <datalist id="dl-cal">${opt(by('calendar'))}</datalist>
      <datalist id="dl-todo">${opt(by('todo'))}</datalist>
      <datalist id="dl-tv">${opt(by('remote', 'media_player'))}</datalist>
      <datalist id="dl-act">${opt(by('button', 'input_button', 'script', 'switch', 'climate'))}</datalist>`;
  }

  const bindField = (label, path, val, dl, ph = '') =>
    `<label class="field"><span>${label}</span><input data-bind="${path}" value="${esc(val || '')}" ${dl ? `list="dl-${dl}"` : ''} placeholder="${esc(ph)}" autocomplete="off" spellcheck="false"></label>`;

  function pIntegrations() {
    const c = cfg(), ha = App.ha;
    const stTxt = {
      demo: 'Kører med demo-data', connected: `Forbundet ✓ · ${Object.keys(ha.states).length} enheder`, connecting: `Forbinder… (${ha.phase || 'starter'})`,
      disconnected: `Afbrudt – prøver igen…${ha.error ? ' · ' + ha.error : ''}`, auth_invalid: 'Forkert token', error: ha.error || 'Fejl',
    }[ha.status] || ha.status;
    const suggested = !c.ha.url && location.pathname.startsWith('/local/') ? location.origin : '';
    return `
    <div class="p-section">
      <h3>Home Assistant</h3>
      <p class="muted">Home Assistant er “hjernen”, der kobler biler, lys (WiZ / Google Home), Spotify og TV sammen. Se <b>LÆS-MIG.md</b> for opsætning.</p>
      <div class="form-grid">
        <label class="field"><span>Adresse</span><input id="ha-url" value="${esc(c.ha.url || suggested)}" placeholder="http://homeassistant.local:8123" autocomplete="off" spellcheck="false"></label>
        <label class="field"><span>Long-lived access token</span><input id="ha-token" type="password" value="${esc(c.ha.token)}" placeholder="Indsæt token fra din profil i HA" autocomplete="off"></label>
      </div>
      ${location.protocol === 'https:' && /^http:\/\/(localhost|127\.0\.0\.1)/i.test(c.ha.url || '')
        ? `<p class="hint">⚠️ Tavlen kører fra internettet, men adressen peger på <b>localhost</b>, som kun virker på den pc, der kører Home Assistant. Brug jeres Tailscale-adresse, fx <b>https://homeassistant.xxxx.ts.net</b>.</p>`
        : location.protocol === 'https:' && /^http:\/\//i.test(c.ha.url || '')
          ? `<p class="hint">⚠️ Adressen starter med <b>http://</b>. Når tavlen kører fra internettet (https), skal Home Assistant også nås via <b>https://</b>, ellers blokerer browseren forbindelsen.</p>` : ''}
      <div class="row">
        <button class="btn primary" data-act="ha-connect">Gem & forbind</button>
        <button class="btn ghost" data-act="ha-demo">Brug demo-data</button>
        <span class="status ${ha.status}">${esc(stTxt)}</span>
      </div>
      ${ha.error && ha.status !== 'connected' && !ha.isDemo ? `<p class="err">${esc(ha.error)}</p>` : ''}
    </div>

    <div class="p-section">
      <h3>Biler</h3>
      <p class="muted">Bilen skal først kobles på Home Assistant med bilmærkets integration (fx Renault, Tesla Fleet, Kia Uvo / Hyundai Bluelink). Start at skrive i felterne for at se forslag – eller brug opsætningsguiden, der finder bilerne selv.</p>
      ${c.cars.map((car, i) => {
        const p = `settings.cars.${i}`;
        return `<div class="car-form">
          <div class="form-grid g3">
            ${bindField('Navn', p + '.name', car.name)}
            ${bindField('Mærke', p + '.brand', car.brand)}
            <label class="field"><span>Form & farve</span><div class="row tight">
              <select data-bind="${p}.shape"><option value="hatch" ${car.shape === 'hatch' ? 'selected' : ''}>Personbil</option><option value="van" ${car.shape === 'van' ? 'selected' : ''}>Van / MPV</option></select>
              <input type="color" data-bind="${p}.color" value="${esc(car.color)}"></div></label>
            ${bindField('Batteri (%)', p + '.battery', car.battery, 'sensor', 'sensor.…_battery')}
            ${bindField('Rækkevidde', p + '.range', car.range, 'sensor', 'sensor.…_range')}
            ${bindField('Opladning (status)', p + '.charging', car.charging, 'sensor', 'binary_sensor.…_charging')}
            ${bindField('Lås (lås eller låsestatus)', p + '.lock', car.lock, 'lock', 'lock.… eller binary_sensor.…_lock_status')}
            ${bindField('Forvarm (knap / script)', p + '.climate', car.climate, 'act', 'button.… eller script.…')}
          </div>
          <div class="car-photo-row">
            <div class="car-photo-prev" style="--car:${esc(car.color)}">${car.photo ? `<img src="${car.photo}" alt="">` : carSvg(car.shape)}</div>
            <div class="field"><span>Billede af bilen – brug gerne et foto uden baggrund (PNG)</span>
              <div class="row">
                <label class="btn ghost sm">${ic('camera')}${car.photo ? 'Skift billede' : 'Upload billede'}<input type="file" accept="image/*" data-change="car-photo" data-i="${i}" hidden></label>
                ${car.photo ? `<button class="btn ghost sm" data-act="car-photo-del" data-i="${i}">${ic('x')}Brug tegning</button>` : ''}
              </div></div>
          </div>
          <button class="btn ghost sm danger" data-act="del-car" data-i="${i}">${ic('trash')}Fjern bil</button>
        </div>`;
      }).join('')}
      <button class="btn ghost" data-act="add-car">${ic('plus')}Tilføj bil</button>
    </div>

    <div class="p-section">
      <h3>Musik & TV</h3>
      <div class="form-grid">
        ${bindField('Spotify-afspiller', 'settings.spotify', c.spotify, 'media_player', 'media_player.spotify_…')}
        ${bindField('TV til streaming (Google TV: vælg remote.…)', 'settings.tv', c.tv, 'tv', 'remote.stue eller media_player.…')}
      </div>
      <label class="field"><span>Hurtig-playlister – én pr. linje: Navn | Spotify-link (Del → Kopiér link i Spotify)</span>
        <textarea data-bind="settings.playlists" rows="4" spellcheck="false">${esc(c.playlists)}</textarea></label>
    </div>

    <div class="p-section">
      <h3>Kalender & indkøb</h3>
      <p class="muted">Tomt felt = tavlen finder selv jeres kalendere og indkøbslisten i Home Assistant.</p>
      <div class="form-grid">
        ${bindField('Kalendere der vises', 'settings.calendars', c.calendars, 'cal', 'calendar.familie, calendar.arbejde')}
        ${bindField('Kalender til nye aftaler', 'settings.calendarDefault', c.calendarDefault, 'cal', 'calendar.familie')}
        ${bindField('Indkøbsliste', 'settings.shopping', c.shopping, 'todo', 'todo.indkobsliste')}
        ${bindField('Nemlig-kurv (tom = find selv)', 'settings.nemlig', c.nemlig, 'sensor', 'sensor.nemlig_kurv')}
      </div>
      <label class="field"><span>Farver i kalenderen: én pr. linje, fx <b>Emma = grøn</b>. Navnet skal stå i aftalens titel. Farver: blå, grøn, gul, lilla, rød, orange, lyserød, mørkeblå, lysegrøn, lavendel, grå eller #hex. Børn uden linje får deres farve fra tavlen.</span>
        <textarea data-bind="settings.calColors" rows="4" spellcheck="false" placeholder="Emma = grøn&#10;Mor = lilla">${esc(c.calColors || '')}</textarea></label>
      <label class="field"><span>Hurtig-knapper til indkøbslisten (adskil med komma)</span>
        <input data-bind="settings.quickItems" value="${esc(c.quickItems || '')}" autocomplete="off"></label>
    </div>

    <div class="p-section">
      <h3>Hjemmet</h3>
      <div class="form-grid">
        ${bindField('Foretrukne stemninger på Overblik (op til 6)', 'settings.scenes', c.scenes, 'scene', 'scene.stue_klar, scene.spisestue_daempet')}
        ${bindField('Vis kun disse lys (tom = alle)', 'settings.lights', c.lights, '', 'light.kokken, light.stue')}
        ${bindField('Ekstra enheder (sensorer, kontakter …)', 'settings.extras', c.extras, '', 'sensor.stue_temperatur, switch.kaffe')}
      </div>
    </div>

    <div class="p-section">
      <h3>Streamingtjenester</h3>
      <p class="muted">“App på TV”: til Google TV kan feltet stå tomt (tavlen kender de fleste apps) eller indeholde et app-link som <code>market://launch?id=pakkenavn</code>. Til andre TV’er: navnet fra TV’ets kildeliste.</p>
      <div class="stream-rows">${c.streaming.map((s, i) => `
        <div class="stream-row">
          <label class="toggle"><input type="checkbox" data-bind="settings.streaming.${i}.on" ${s.on ? 'checked' : ''}><i></i></label>
          <b style="color:${s.color}">${esc(s.name)}</b>
          <input data-bind="settings.streaming.${i}.url" value="${esc(s.url)}" spellcheck="false">
          <input data-bind="settings.streaming.${i}.source" value="${esc(s.source || '')}" placeholder="App på TV (valgfri)">
        </div>`).join('')}</div>
    </div>
    ${datalists()}`;
  }

  function pScreen() {
    const c = cfg();
    return `
    <div class="p-section">
      <h3>Vejr</h3>
      <div class="row"><input id="city" value="${esc(c.weather.name)}" placeholder="Søg efter by…" autocomplete="off">
        <button class="btn primary" data-act="city-search">Søg</button></div>
      <div class="chips" id="city-res"></div>
    </div>
    <div class="p-section">
      <h3>Skærm</h3>
      <div class="form-grid">
        <label class="field"><span>Pauseskærm (stort ur) efter</span>
          <select data-bind="settings.saverMin" data-num>${[0, 2, 5, 10, 15, 30].map(n =>
            `<option value="${n}" ${+c.saverMin === n ? 'selected' : ''}>${n ? n + ' minutter' : 'Aldrig'}</option>`).join('')}</select></label>
      </div>
      <label class="toggle-row"><label class="toggle"><input type="checkbox" data-bind="settings.sound" ${c.sound ? 'checked' : ''}><i></i></label>Lyd når opgaver klares</label>
      <label class="toggle-row"><label class="toggle"><input type="checkbox" data-bind="settings.lite" ${c.lite ? 'checked' : ''}><i></i></label>Lette effekter (til svagere skærme / Raspberry Pi)</label>
      <div class="row">
        <button class="btn primary" data-act="setup-start">${ic('sparkle')}Start opsætningsguiden</button>
        <button class="btn ghost" data-act="fullscreen">${ic('expand')}Fuld skærm</button>
        <button class="btn ghost" data-act="reload">${ic('refresh')}Genindlæs</button>
      </div>
    </div>
    <div class="p-section">
      <h3>PIN-kode</h3>
      <div class="row"><input id="new-pin" inputmode="numeric" maxlength="6" placeholder="Ny PIN (4–6 cifre)" autocomplete="off">
        <button class="btn primary" data-act="set-pin">Skift PIN</button></div>
      <p class="muted">PIN bruges til forældre-delen, til at låse bilerne op og til at godkende belønninger.${c.pin === '1234' ? ' <b class="warn-t">Standard-PIN er 1234 – skift den!</b>' : ''}</p>
    </div>
    <div class="p-section">
      <h3>Backup</h3>
      <p class="muted">Alt gemmes lokalt på skærmen. Tag en backup en gang imellem – og før du skifter skærm.</p>
      <div class="row">
        <button class="btn ghost" data-act="export">Download backup</button>
        <label class="btn ghost">Indlæs backup<input type="file" accept="application/json,.json" data-change="import" hidden></label>
        <button class="btn ghost danger" data-act="reset">Nulstil alt</button>
      </div>
    </div>`;
  }

  /* ---------- modaler: barn, opgave, belønning ---------- */
  function editKid(id) {
    const k = id ? Store.kid(id) : {
      name: '', color: COLORS[S().kids.length % COLORS.length],
      avatar: { type: 'emoji', value: KID_EMOJI[S().kids.length % KID_EMOJI.length] },
    };
    modal(`<form class="form" data-id="${id || ''}" onsubmit="return false">
      <h2>${id ? 'Rediger barn' : 'Tilføj barn'}</h2>
      <div class="kid-edit-top">
        <div class="av-preview" id="av-prev" style="--kc:${k.color}">${avatar(k)}</div>
        <label class="field grow"><span>Navn</span><input name="name" value="${esc(k.name)}" placeholder="Fx Emma" autocomplete="off"></label>
      </div>
      <input type="hidden" name="avType" value="${k.avatar.type}"><input type="hidden" name="avValue" value="${esc(k.avatar.value)}">
      <div class="field"><span>Billede – vælg en figur eller tag/upload et foto</span>
        <div class="emoji-pick">${KID_EMOJI.map(e => `<button type="button" class="ep" data-act="kid-emoji" data-e="${e}">${e}</button>`).join('')}
          <label class="ep upload">${ic('camera')}<input type="file" accept="image/*" data-change="kid-photo" hidden></label></div></div>
      <div class="field"><span>Farve</span><div class="swatches">${COLORS.map(c =>
        `<label class="sw" style="--c:${c}"><input type="radio" name="color" value="${c}" ${c === k.color ? 'checked' : ''}><i></i></label>`).join('')}</div></div>
      <div class="form-actions">
        ${id ? `<button type="button" class="btn ghost danger" data-act="del-kid" data-id="${id}">${ic('trash')}Slet</button>
          <button type="button" class="btn ghost" data-act="reset-kid" data-id="${id}">${ic('refresh')}Nulstil stjerner</button>` : ''}
        <span class="grow"></span>
        <button type="button" class="btn ghost" data-act="close-modal">Annullér</button>
        <button type="button" class="btn primary" data-act="save-kid">Gem</button>
      </div></form>`);
  }

  function editTask(id) {
    const kids = S().kids;
    const t = id ? Store.task(id) : { emoji: '⭐', title: '', points: 10, kids: kids.map(k => k.id), days: [0, 1, 2, 3, 4, 5, 6], once: null };
    const emojis = TASK_EMOJI.includes(t.emoji) ? TASK_EMOJI : [t.emoji, ...TASK_EMOJI];
    const when = t.once ? 'once' : 'repeat';
    modal(`<form class="form" data-id="${id || ''}" onsubmit="return false">
      <h2>${id ? 'Rediger opgave' : 'Ny opgave'}</h2>
      <label class="field"><span>Opgave</span><input name="title" value="${esc(t.title)}" placeholder="Fx Red din seng" autocomplete="off"></label>
      <div class="field"><span>Ikon</span><div class="emoji-pick">${emojis.map(e =>
        `<label class="ep"><input type="radio" name="emoji" value="${e}" ${e === t.emoji ? 'checked' : ''}><span>${e}</span></label>`).join('')}</div></div>
      <div class="field"><span>Stjerner</span><div class="chips">${[5, 10, 15, 20, 25, 50].map(n =>
        `<label class="chip-opt"><input type="radio" name="points" value="${n}" ${+t.points === n ? 'checked' : ''}><span>${n} ⭐</span></label>`).join('')}</div></div>
      <div class="field"><span>Hvem</span><div class="chips">${kids.map(k =>
        `<label class="chip-opt" style="--kc:${k.color}"><input type="checkbox" name="kids" value="${k.id}" ${t.kids.includes(k.id) ? 'checked' : ''}><span>${esc(k.name)}</span></label>`).join('')}</div></div>
      <div class="field"><span>Hvornår</span><div class="chips">
        <label class="chip-opt"><input type="radio" name="when" value="repeat" ${when === 'repeat' ? 'checked' : ''}><span>Gentages</span></label>
        <label class="chip-opt"><input type="radio" name="when" value="today"><span>Kun i dag</span></label>
        <label class="chip-opt"><input type="radio" name="when" value="tomorrow"><span>Kun i morgen</span></label>
        ${t.once ? `<label class="chip-opt"><input type="radio" name="when" value="once" checked><span>${daysText(t)}</span></label>` : ''}
      </div></div>
      <div class="field days-field"><span>Dage <button type="button" class="link" data-act="days" data-set="all">Hver dag</button>
        <button type="button" class="link" data-act="days" data-set="week">Hverdage</button>
        <button type="button" class="link" data-act="days" data-set="weekend">Weekend</button></span>
        <div class="chips">${DAYS.map((d, i) =>
          `<label class="chip-opt day"><input type="checkbox" name="days" value="${i}" ${t.days.includes(i) ? 'checked' : ''}><span>${d}</span></label>`).join('')}</div></div>
      <div class="form-actions">
        ${id ? `<button type="button" class="btn ghost danger" data-act="del-task" data-id="${id}">${ic('trash')}Slet</button>` : ''}
        <span class="grow"></span>
        <button type="button" class="btn ghost" data-act="close-modal">Annullér</button>
        <button type="button" class="btn primary" data-act="save-task">Gem</button>
      </div></form>`);
  }

  function editReward(id) {
    const r = id ? S().rewards.find(x => x.id === id) : { emoji: '🎁', title: '', cost: 50 };
    const emojis = REWARD_EMOJI.includes(r.emoji) ? REWARD_EMOJI : [r.emoji, ...REWARD_EMOJI];
    modal(`<form class="form" data-id="${id || ''}" onsubmit="return false">
      <h2>${id ? 'Rediger belønning' : 'Ny belønning'}</h2>
      <label class="field"><span>Belønning</span><input name="title" value="${esc(r.title)}" placeholder="Fx Vælg aftenens dessert" autocomplete="off"></label>
      <div class="field"><span>Ikon</span><div class="emoji-pick">${emojis.map(e =>
        `<label class="ep"><input type="radio" name="emoji" value="${e}" ${e === r.emoji ? 'checked' : ''}><span>${e}</span></label>`).join('')}</div></div>
      <label class="field"><span>Pris i stjerner</span><input name="cost" type="number" min="1" inputmode="numeric" value="${r.cost}"></label>
      <div class="form-actions">
        ${id ? `<button type="button" class="btn ghost danger" data-act="del-reward" data-id="${id}">${ic('trash')}Slet</button>` : ''}
        <span class="grow"></span>
        <button type="button" class="btn ghost" data-act="close-modal">Annullér</button>
        <button type="button" class="btn primary" data-act="save-reward">Gem</button>
      </div></form>`);
  }

  function bonusModal(id) {
    const k = Store.kid(id);
    modal(`<h2>Stjerner til ${esc(k.name)}</h2>
      <p class="muted">${esc(k.name)} har ${k.stars} ⭐. Giv ekstra for noget særligt – eller træk fra, hvis der er blevet snydt.</p>
      <h4 class="sub-title">Giv</h4>
      <div class="bonus-grid">${[5, 10, 25, 50].map(n => `<button class="btn primary" data-act="give-bonus" data-id="${id}" data-n="${n}">+${n} ⭐</button>`).join('')}</div>
      <h4 class="sub-title">Træk fra</h4>
      <div class="bonus-grid">${[-5, -10, -25, -50].map(n => `<button class="btn ghost danger" data-act="give-bonus" data-id="${id}" data-n="${n}">${n} ⭐</button>`).join('')}</div>
      <div class="form-actions"><span class="grow"></span><button class="btn ghost" data-act="close-modal">Luk</button></div>`, 'small');
  }

  function resizeImage(file, size = 320) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(img.width, img.height);
        const cv = document.createElement('canvas');
        cv.width = cv.height = size;
        cv.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        URL.revokeObjectURL(img.src);
        res(cv.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = rej;
      img.src = URL.createObjectURL(file);
    });
  }

  // bilfoto: bevar proportioner og gennemsigtighed (WebP), max bredde i px
  function fitImage(file, maxW = 720) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, maxW / img.width);
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * k);
        cv.height = Math.round(img.height * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(img.src);
        let url = cv.toDataURL('image/webp', 0.85);
        if (!url.startsWith('data:image/webp')) url = cv.toDataURL('image/png');
        res(url);
      };
      img.onerror = rej;
      img.src = URL.createObjectURL(file);
    });
  }

  /* ================= overlays, dialoger, PIN, toast ================= */
  function modal(html, cls = '') {
    const m = document.createElement('div');
    m.className = 'modal-back';
    m.innerHTML = `<div class="modal ${cls}">${html}</div>`;
    m.addEventListener('click', e => { if (e.target === m) closeModal(m); });
    $('#overlay-root').appendChild(m);
    return m;
  }
  function closeModal(m) {
    m?.remove();
    if (App.pendingRender && !$('.modal-back')) softRender();
  }

  function overlay(html, onClose) {
    const m = document.createElement('div');
    m.className = 'overlay';
    m.innerHTML = html;
    const opened = Date.now();
    m.addEventListener('click', e => {
      // hele skærmen lukker (efter et øjeblik, så et ekstra tryk ikke lukker den med det samme)
      if (e.target.closest('[data-close]') || Date.now() - opened > 900) {
        m.classList.add('out');
        setTimeout(() => { m.remove(); onClose?.(); }, 250);
      }
    });
    $('#overlay-root').appendChild(m);
  }

  function choose(title, text, options, cls = 'small') {
    return new Promise(res => {
      const m = modal(`<h2>${title}</h2>${text ? `<p class="muted">${text}</p>` : ''}
        <div class="choice">${options.map((o, i) => `<button class="btn ${o.primary ? 'primary' : 'ghost'} big" data-choice="${i}">${o.label}</button>`).join('')}</div>`, cls);
      m.addEventListener('click', e => {
        const b = e.target.closest('[data-choice]');
        if (b) { closeModal(m); res(options[+b.dataset.choice].v); }
        else if (e.target === m) res(null);
      });
    });
  }
  const confirmDialog = (title, text, ok = 'OK', cancel = 'Annullér') =>
    choose(title, text, [{ v: false, label: cancel }, { v: true, label: ok, primary: true }]).then(v => v === true);

  function askPin(title) {
    return new Promise(res => {
      const pin = String(cfg().pin || '1234');
      let val = '';
      const m = document.createElement('div');
      m.className = 'modal-back pin-back';
      m.innerHTML = `<div class="pin">
        <div class="pin-ico">${ic('lock')}</div>
        <div class="pin-title">${esc(title)}</div>
        <div class="pin-dots">${'<i></i>'.repeat(pin.length)}</div>
        <div class="pin-keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join('')}
          <button data-k="x" class="fn">Annullér</button><button data-k="0">0</button><button data-k="del" class="fn">⌫</button></div></div>`;
      const dots = () => $$('.pin-dots i', m).forEach((d, i) => d.classList.toggle('on', i < val.length));
      const done = ok => { m.remove(); res(ok); };
      m.addEventListener('click', e => {
        if (e.target === m) return done(false);
        const b = e.target.closest('[data-k]');
        if (!b) return;
        const k = b.dataset.k;
        FX.sound('tap');
        if (k === 'x') return done(false);
        if (k === 'del') val = val.slice(0, -1);
        else if (val.length < pin.length) val += k;
        dots();
        if (val.length === pin.length) {
          if (val === pin) setTimeout(() => done(true), 120);
          else {
            FX.sound('error');
            const box = $('.pin', m);
            box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
            setTimeout(() => { val = ''; dots(); }, 400);
          }
        }
      });
      $('#overlay-root').appendChild(m);
    });
  }

  function toast(msg, type = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 2800);
    setTimeout(() => t.remove(), 3200);
  }

  /* ================= pauseskærm ================= */
  let idleT, driftT;
  function resetIdle() {
    clearTimeout(idleT);
    const m = +cfg().saverMin;
    if (m > 0) idleT = setTimeout(showSaver, m * 60e3);
  }
  function showSaver() {
    if (App.noSaver) return; // fx mens opsætningsguiden er åben
    $$('#overlay-root > *').forEach(x => x.remove());
    App.parentUntil = 0;
    App.page = 'home';
    render();
    $('#saver').classList.add('on');
    renderSaver();
    clearInterval(driftT);
    driftT = setInterval(() => {
      $('#sv-inner').style.transform = `translate(${(Math.random() - 0.5) * 12}vw, ${(Math.random() - 0.5) * 10}vh)`;
    }, 60e3);
  }
  function renderSaver() {
    const now = new Date(), w = App.weather;
    $('#sv-clock').textContent = clockText(now);
    $('#sv-date').textContent = dateText(now);
    $('#sv-weather').innerHTML = w?.daily ? w.daily.time.slice(0, 4).map((d, i) => {
      const [emo] = WMO(w.daily.weather_code[i]);
      const day = i === 0 ? 'I dag' : cap(new Date(d + 'T12:00').toLocaleDateString('da-DK', { weekday: 'short' }).replace('.', ''));
      return `<div><span>${day}</span><b>${emo}</b><span>${Math.round(w.daily.temperature_2m_max[i])}° / ${Math.round(w.daily.temperature_2m_min[i])}°</span></div>`;
    }).join('') : '';
    $('#sv-kids').innerHTML = S().kids.map(k => {
      const p = Store.progress(k.id);
      return `<div class="sv-kid" style="--kc:${k.color}"><span class="mini-av">${avatar(k)}</span>${esc(k.name)}
        <b>${p.total ? (p.all ? '✓' : `${p.done}/${p.total}`) : '–'}</b></div>`;
    }).join('');
  }
  $('#saver').addEventListener('click', () => {
    $('#saver').classList.remove('on');
    clearInterval(driftT);
    resetIdle();
  });

  /* ================= handlinger ================= */
  const formOf = el => el.closest('form');
  const ACT = {
    nav: el => nav(el.dataset.page),
    'open-kid': el => { App.kid = el.dataset.id; nav('kids'); },
    'pick-kid': el => { App.kid = el.dataset.id; FX.sound('tap'); render(); },
    task: onTask,
    redeem: onRedeem,

    media: el => call('media_player', el.dataset.svc, { entity_id: cfg().spotify }),
    shuffle: () => call('media_player', 'shuffle_set', { entity_id: cfg().spotify, shuffle: !App.ha.get(cfg().spotify)?.attributes?.shuffle }),
    source: el => call('media_player', 'select_source', { entity_id: cfg().spotify, source: el.dataset.src }),
    playlist: async el => {
      if (/INDSÆT_ID/.test(el.dataset.uri) && !App.ha.isDemo) return toast('Indsæt et Spotify-link til playlisten under Forældre → Integrationer');
      // forstå både spotify:playlist:ID og https://open.spotify.com/playlist/ID?si=…
      let uri = el.dataset.uri.trim(), type = 'playlist';
      const m = uri.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|track|artist)\/([A-Za-z0-9]+)/);
      if (m) { type = m[1]; uri = `spotify:${m[1]}:${m[2]}`; }
      else { const t = uri.match(/^spotify:(playlist|album|track|artist):/); if (t) type = t[1]; }
      const spk = targetSpeaker();
      if (spk) {
        const name = App.ha.get(spk)?.attributes?.friendly_name || '';
        if (await call('spotcast', 'play_media', { media_player: { entity_id: spk }, spotify_uri: uri }))
          toast(`🎵 Afspiller ${el.dataset.name} på ${name}`);
      } else if (await call('media_player', 'play_media', { entity_id: cfg().spotify, media_content_id: uri, media_content_type: type === 'track' ? 'music' : type }))
        toast('🎵 Afspiller ' + el.dataset.name);
    },
    speaker: async el => {
      Store.setPath('settings.speaker', el.dataset.id);
      $$('[data-act=speaker]').forEach(b => b.classList.toggle('on', b === el));
      FX.sound('tap');
      if (await call('spotcast', 'transfer_playback', { media_player: { entity_id: el.dataset.id } }))
        toast(`🔈 Musikken flyttes til ${el.dataset.name}`);
    },
    stream: onStream,
    'shop-add': () => { const i = $('#shop-input'); const v = i?.value; if (i) i.value = ''; shopAdd(v); },
    'shop-quick': el => shopAdd(el.dataset.v),
    'shop-toggle': async el => {
      const done = el.dataset.done === '1';
      el.classList.toggle('done', !done);
      if (await call('todo', 'update_item', { entity_id: shopEntity(), item: el.dataset.id, status: done ? 'needs_action' : 'completed' })) {
        FX.sound(done ? 'undo' : 'tap'); loadShop();
      }
    },
    'nm-fill': () => nemligFill(),
    'nm-search': () => nemligSearch(),
    'nm-basket': () => nemligBasket(),
    'shop-clear': async () => { if (await call('todo', 'remove_completed_items', { entity_id: shopEntity() })) loadShop(); },
    'new-event': () => newEventModal(),
    'save-event': async el => {
      const f = formOf(el), fd = new FormData(f);
      const summary = String(fd.get('summary') || '').trim(), date = fd.get('date'), cal = fd.get('cal');
      if (!summary) return toast('Skriv hvad aftalen er', 'bad');
      if (!date) return toast('Vælg en dato', 'bad');
      const data = { entity_id: cal, summary };
      const loc = String(fd.get('location') || '').trim();
      if (loc) data.location = loc;
      if (fd.get('allday')) {
        const end = new Date(date + 'T12:00'); end.setDate(end.getDate() + 1);
        data.start_date = date; data.end_date = Store.dkey(end);
      } else {
        const from = fd.get('from') || '00:00', to = fd.get('to') || from;
        const s = new Date(`${date}T${from}`); let e = new Date(`${date}T${to}`);
        if (e <= s) e = new Date(s.getTime() + 60 * 60e3);
        data.start_date_time = localISO(s); data.end_date_time = localISO(e);
      }
      if (await call('calendar', 'create_event', data)) {
        closeModal(el.closest('.modal-back'));
        toast(`📅 “${summary}” er tilføjet`);
        loadEvents(true);
      }
    },
    tvkey: el => {
      FX.sound('tap');
      el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
      call('remote', 'send_command', { entity_id: cfg().tv, command: el.dataset.k });
    },

    light: el => call('light', 'toggle', { entity_id: el.dataset.id }),
    toggle: el => call('homeassistant', 'toggle', { entity_id: el.dataset.id }),
    scene: async el => { if (await call('scene', 'turn_on', { entity_id: el.dataset.id })) toast(`✨ ${el.dataset.name}`); },
    'all-off': () => {
      const ids = lightList().filter(l => l.state === 'on').map(l => l.entity_id);
      if (ids.length) call('light', 'turn_off', { entity_id: ids });
    },
    'car-lock': onCarLock,
    'car-climate': onClimate,

    'close-modal': el => closeModal(el.closest('.modal-back')),
    ptab: el => { App.parentTab = el.dataset.tab; render(); },
    'lock-parent': () => { App.parentUntil = 0; nav('home'); },

    'edit-kid': el => editKid(el.dataset.id),
    'kid-emoji': el => {
      const f = formOf(el);
      f.avType.value = 'emoji'; f.avValue.value = el.dataset.e;
      $('#av-prev').innerHTML = `<span class="av-emoji">${el.dataset.e}</span>`;
    },
    'save-kid': el => {
      const f = formOf(el), name = f.name.value.trim();
      if (!name) return toast('Skriv et navn', 'bad');
      Store.upsert('kids', {
        id: f.dataset.id || Store.uid(), name, color: f.color.value,
        avatar: { type: f.avType.value, value: f.avValue.value },
        ...(f.dataset.id ? {} : { stars: 0, lifetime: 0 }),
      });
      closeModal(el.closest('.modal-back'));
      render();
    },
    'del-kid': async el => {
      const k = Store.kid(el.dataset.id);
      if (!(await confirmDialog(`Slet ${esc(k.name)}?`, 'Stjerner og historik for barnet forsvinder. Det kan ikke fortrydes.', 'Slet', 'Annullér'))) return;
      Store.deleteKid(k.id);
      closeModal(el.closest('.modal-back'));
      render();
    },
    bonus: el => bonusModal(el.dataset.id),
    'p-undo': async el => {
      const k = Store.kid(el.dataset.kid), t = Store.task(el.dataset.id);
      if (!(await confirmDialog(`Fjern “${esc(t.title)}”?`, `Opgaven markeres som ikke udført, og ${esc(k.name)} mister ${t.points} ⭐.`, 'Fjern', 'Annullér'))) return;
      Store.undo(k.id, t.id); FX.sound('undo');
      toast(`${t.emoji} ${t.title} er fjernet hos ${k.name} (−${t.points} ⭐)`);
      render();
    },
    'p-done': el => {
      const k = Store.kid(el.dataset.kid), t = Store.task(el.dataset.id);
      const res = Store.complete(k.id, t.id);
      if (res) { FX.sound('ding'); toast(`${t.emoji} ${t.title} er markeret udført hos ${k.name} (+${t.points} ⭐)`); }
      render();
    },
    'reset-kid': async el => {
      const k = Store.kid(el.dataset.id);
      if (!(await confirmDialog(`Nulstil ${esc(k.name)}?`, 'Stjerner, niveau, stime og alle markerede opgaver (også tidligere dage) sættes til nul. Opgaverne selv bliver ikke slettet. Det kan ikke fortrydes.', 'Nulstil', 'Annullér'))) return;
      Store.resetKid(k.id);
      closeModal(el.closest('.modal-back'));
      toast(`${k.name} starter forfra med 0 ⭐`);
      render();
    },
    'give-bonus': el => {
      const n = +el.dataset.n, k = Store.kid(el.dataset.id);
      Store.addStars(k.id, n);
      if (n > 0) { FX.sound('ding'); const r = el.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top, { count: 50 }); }
      toast(`${n > 0 ? '+' : ''}${n} ⭐ til ${k.name}`);
      closeModal(el.closest('.modal-back'));
      render();
    },

    'edit-task': el => editTask(el.dataset.id),
    days: el => {
      const set = { all: [0, 1, 2, 3, 4, 5, 6], week: [0, 1, 2, 3, 4], weekend: [5, 6] }[el.dataset.set];
      $$('input[name=days]', formOf(el)).forEach(c => { c.checked = set.includes(+c.value); });
      const rep = $('input[name=when][value=repeat]', formOf(el)); if (rep) rep.checked = true;
    },
    'save-task': el => {
      const f = formOf(el), fd = new FormData(f);
      const title = String(fd.get('title') || '').trim();
      const kids = fd.getAll('kids'), days = fd.getAll('days').map(Number), when = fd.get('when');
      if (!title) return toast('Skriv hvad opgaven er', 'bad');
      if (!kids.length) return toast('Vælg mindst ét barn', 'bad');
      if (when === 'repeat' && !days.length) return toast('Vælg mindst én dag', 'bad');
      const old = f.dataset.id ? Store.task(f.dataset.id) : null;
      const once = when === 'today' ? Store.dkey() : when === 'tomorrow' ? Store.dkey(new Date(Date.now() + 864e5)) : when === 'once' ? old?.once : null;
      Store.upsert('tasks', { id: f.dataset.id || Store.uid(), title, emoji: fd.get('emoji') || '⭐', points: +fd.get('points') || 10, kids, days, once });
      closeModal(el.closest('.modal-back'));
      render();
    },
    'del-task': async el => {
      if (!(await confirmDialog('Slet opgaven?', '', 'Slet', 'Annullér'))) return;
      Store.remove('tasks', el.dataset.id);
      closeModal(el.closest('.modal-back'));
      render();
    },

    'edit-reward': el => editReward(el.dataset.id),
    'save-reward': el => {
      const f = formOf(el), fd = new FormData(f), title = String(fd.get('title') || '').trim();
      if (!title) return toast('Skriv hvad belønningen er', 'bad');
      Store.upsert('rewards', { id: f.dataset.id || Store.uid(), title, emoji: fd.get('emoji') || '🎁', cost: Math.max(1, +fd.get('cost') || 50) });
      closeModal(el.closest('.modal-back'));
      render();
    },
    'del-reward': async el => {
      if (!(await confirmDialog('Slet belønningen?', '', 'Slet', 'Annullér'))) return;
      Store.remove('rewards', el.dataset.id);
      closeModal(el.closest('.modal-back'));
      render();
    },

    'ha-connect': () => {
      let url = $('#ha-url').value.trim();
      const token = $('#ha-token').value.trim();
      if (!url || !token) return toast('Udfyld både adresse og token', 'bad');
      if (!/^https?:\/\//i.test(url)) url = (location.protocol === 'https:' || /\.ts\.net/i.test(url) ? 'https://' : 'http://') + url;
      url = fixHaUrl(url);
      Store.setPath('settings.ha', { url, token });
      connectHA();
      render();
    },
    'ha-demo': () => { Store.setPath('settings.ha', { url: '', token: '' }); connectHA(); render(); toast('Kører nu med demo-data'); },
    'add-car': () => {
      cfg().cars.push({ id: Store.uid(), name: 'Ny bil', brand: '', shape: 'hatch', color: '#cfd8e3', battery: '', range: '', charging: '', lock: '', climate: '' });
      Store.persist(); render();
    },
    'car-photo-del': el => { delete cfg().cars[+el.dataset.i].photo; Store.persist(); render(); },
    'del-car': async el => {
      if (!(await confirmDialog('Fjern bilen fra tavlen?', '', 'Fjern', 'Annullér'))) return;
      cfg().cars.splice(+el.dataset.i, 1); Store.persist(); render();
    },
    'city-search': async () => {
      const q = $('#city').value.trim();
      if (!q) return;
      try {
        const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=da`);
        const d = await r.json();
        $('#city-res').innerHTML = (d.results || []).map(x =>
          `<button class="chip-btn" data-act="pick-city" data-lat="${x.latitude}" data-lon="${x.longitude}" data-name="${esc(x.name)}">${esc(x.name)}<small>${esc([x.admin1, x.country].filter(Boolean).join(', '))}</small></button>`).join('')
          || '<span class="muted">Ingen byer fundet</span>';
      } catch (e) { toast('Kunne ikke søge – er der internet?', 'bad'); }
    },
    'pick-city': el => {
      Store.setPath('settings.weather', { name: el.dataset.name, lat: +el.dataset.lat, lon: +el.dataset.lon });
      loadWeather(); render(); toast(`Vejret vises nu for ${el.dataset.name}`);
    },
    'set-pin': () => {
      const v = $('#new-pin').value.trim();
      if (!/^\d{4,6}$/.test(v)) return toast('PIN skal være 4–6 cifre', 'bad');
      Store.setPath('settings.pin', v); toast('PIN-koden er skiftet ✓'); render();
    },
    export: () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([Store.exportJSON()], { type: 'application/json' }));
      a.download = `familietavle-backup-${Store.dkey()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    },
    reset: async () => {
      if (!(await confirmDialog('Nulstil alt?', 'Alle børn, opgaver, stjerner og indstillinger slettes og erstattes af eksempel-data. Det kan ikke fortrydes.', 'Nulstil', 'Annullér'))) return;
      Store.reset(); applySettings(); connectHA(); render();
    },
    'setup-start': () => window.Setup?.open(),
    fullscreen: () => document.documentElement.requestFullscreen?.().catch(() => toast('Fuld skærm er ikke tilladt her', 'bad')),
    reload: () => location.reload(),
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled || !el.dataset.act) return;
    const fn = ACT[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el, e); }
  });

  document.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.input === 'volume') {
      debounce('vol', () => call('media_player', 'volume_set', { entity_id: cfg().spotify, volume_level: el.value / 100 }), 200);
    } else if (el.dataset.input === 'bri') {
      const st = el.closest('.light')?.querySelector('.l-state');
      if (st) st.textContent = el.value + '%';
      debounce('bri' + el.dataset.id, () => call('light', 'turn_on', { entity_id: el.dataset.id, brightness_pct: +el.value }), 200);
    }
  });

  document.addEventListener('change', async e => {
    const el = e.target;
    if (el.dataset.bind) {
      let v = el.type === 'checkbox' ? el.checked : el.value.trim();
      if (el.dataset.num !== undefined) v = +v;
      Store.setPath(el.dataset.bind, v);
      if (/^settings\.(sound|lite)$/.test(el.dataset.bind)) applySettings();
      if (el.dataset.bind === 'settings.saverMin') resetIdle();
      toast('Gemt ✓');
    } else if (el.name === 'color' && el.closest('form')) {
      $('#av-prev')?.style.setProperty('--kc', el.value);
    } else if (el.dataset.change === 'kid-photo' && el.files[0]) {
      try {
        const url = await resizeImage(el.files[0]);
        const f = formOf(el);
        f.avType.value = 'photo'; f.avValue.value = url;
        $('#av-prev').innerHTML = `<img class="av-img" src="${url}" alt="">`;
      } catch (err) { toast('Billedet kunne ikke læses', 'bad'); }
    } else if (el.dataset.change === 'car-photo' && el.files[0]) {
      try {
        const url = await fitImage(el.files[0], 720);
        Store.setPath(`settings.cars.${el.dataset.i}.photo`, url);
        render(); toast('Billedet er gemt ✓');
      } catch (err) { toast('Billedet kunne ikke gemmes – prøv et mindre billede', 'bad'); }
    } else if (el.dataset.change === 'import' && el.files[0]) {
      try {
        Store.importJSON(await el.files[0].text());
        applySettings(); connectHA(); render(); toast('Backup indlæst ✓');
      } catch (err) { toast('⚠️ ' + err.message, 'bad'); }
    }
  });

  function applySettings() {
    FX.setSound(cfg().sound);
    document.body.classList.toggle('lite', !!cfg().lite);
    resetIdle();
  }

  // Enter i indkøbsfeltet tilføjer varen
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'shop-input') { e.preventDefault(); ACT['shop-add'](); }
    if (e.key === 'Escape' && e.target.id === 'shop-input') nmSuggHide();
  });
  // Nemlig-forslag mens man skriver
  document.addEventListener('input', e => { if (e.target.id === 'shop-input') nmSuggestSoon(e.target.value); });
  // tryk i forslagslisten må ikke tage fokus fra feltet (så tastaturet bliver)
  document.addEventListener('pointerdown', e => { if (e.target.closest('#nm-sugg')) e.preventDefault(); });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-sug]');
    if (!b) return;
    if (b.dataset.sug === 'text') ACT['shop-add']();
    else nmSuggPick(b);
  });
  document.addEventListener('focusout', e => {
    if (e.target.id !== 'shop-input') return;
    // luk forslagene når man går ud af feltet, og tegn evt. udskudte ændringer
    setTimeout(() => { if (document.activeElement?.id !== 'shop-input') { nmSuggHide(); if (App.pendingRender) softRender(); } }, 150);
  });

  // hold flere åbne faner/vinduer i sync (fx en forældre-fane og selve tavlen)
  window.addEventListener('storage', e => {
    if (e.key !== Store.KEY) return;
    Store.reload();
    if (!isEditing() && !$('.modal-back')) render();
  });

  // kiosk-venlig adfærd
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('pointerdown', () => {
    App.pointerDown = true;
    resetIdle();
    if (App.page === 'parent' && parentOk()) App.parentUntil = Date.now() + 5 * 60e3;
  }, true);
  const up = () => { App.pointerDown = false; if (App.pendingRender) softRender(); };
  document.addEventListener('pointerup', up, true);
  document.addEventListener('pointercancel', up, true);

  // hold skærmen vågen hvor browseren tillader det (kræver https eller localhost)
  async function wakeLock() { try { await navigator.wakeLock?.request('screen'); } catch (e) { /* ikke kritisk */ } }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') wakeLock(); });

  /* ================= start ================= */
  // lille API til opsætningsguiden (js/setup.js)
  window.Tavle = { App, cfg, render, nav, connectHA, toast, ic, esc, avatar, loadWeather, applySettings, COLORS, KID_EMOJI, resetIdle };
  applySettings();
  renderRail();
  connectHA();
  render();
  loadWeather();
  wakeLock();
  setInterval(tick, 1000);
  setInterval(loadWeather, 15 * 60e3);
})();
