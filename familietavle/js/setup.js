/* Familietavlen – opsætningsguide.
   Starter første gang tavlen åbnes (og kan startes igen under Forældre → Skærm & backup).
   Hvert trin forklarer hvad man skal gøre, tjekker selv om det virker, og guider hvis noget mangler. */
const Setup = (() => {
  'use strict';
  const T = window.Tavle;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = T.esc, ic = T.ic;
  const cfg = () => Store.state.settings;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const STEPS = [
    { id: 'welcome', title: 'Velkommen', icon: 'home' },
    { id: 'family', title: 'Familien', icon: 'star' },
    { id: 'pin', title: 'Forældre-PIN', icon: 'lock' },
    { id: 'ha', title: 'Home Assistant', icon: 'plug2' },
    { id: 'cars', title: 'Biler', icon: 'car' },
    { id: 'music', title: 'Musik', icon: 'music' },
    { id: 'tv', title: 'TV', icon: 'tv' },
    { id: 'lights', title: 'Lys', icon: 'bulb' },
    { id: 'plan', title: 'Kalender & indkøb', icon: 'cal' },
    { id: 'weather', title: 'Vejr', icon: 'sparkle' },
    { id: 'done', title: 'Færdig', icon: 'check' },
  ];

  const W = { i: 0, status: {}, kids: [], reg: null, el: null, busy: false };

  /* ---------- hjælpere ---------- */
  const haOK = () => T.App.ha && !T.App.ha.isDemo && T.App.ha.status === 'connected';
  const box = (type, html) => `<div class="su-box ${type}">${type === 'ok' ? '✅' : type === 'warn' ? '⚠️' : type === 'bad' ? '❌' : '💡'}<div>${html}</div></div>`;
  const steps = arr => `<ol class="su-steps">${arr.map(s => `<li>${s}</li>`).join('')}</ol>`;
  const setStatus = (id, s) => { W.status[id] = s; };

  async function registry(force) {
    if (!haOK()) return null;
    if (W.reg && !force) return W.reg;
    try {
      const [ents, devs] = await Promise.all([
        T.App.ha.send({ type: 'config/entity_registry/list' }),
        T.App.ha.send({ type: 'config/device_registry/list' }),
      ]);
      W.reg = { ents: ents || [], devs: devs || [] };
    } catch (e) {
      W.reg = { ents: [], devs: [] };
    }
    return W.reg;
  }
  const st = id => T.App.ha.states[id];
  const fname = id => st(id)?.attributes?.friendly_name || id;
  const byPlatform = (reg, re, domain) => reg.ents.filter(e => re.test(e.platform) && (!domain || e.entity_id.startsWith(domain + '.')) && !e.disabled_by && st(e.entity_id));

  /* ---------- Home Assistant-test (direkte WebSocket, uden at røre tavlens forbindelse) ---------- */
  function testHA(url, token) {
    return new Promise(res => {
      let ws, done = false;
      const finish = r => { if (done) return; done = true; try { ws?.close(); } catch (e) { /* ok */ } res(r); };
      try { ws = new WebSocket(url.replace(/^http/i, 'ws') + '/api/websocket'); }
      catch (e) { return finish({ reach: false, why: 'Adressen er ikke gyldig.' }); }
      const t = setTimeout(() => finish({ reach: false, why: 'Intet svar inden for 6 sekunder.' }), 6000);
      ws.onerror = () => { clearTimeout(t); finish({ reach: false, why: 'Kan ikke få forbindelse.' }); };
      ws.onmessage = ev => {
        const m = JSON.parse(ev.data);
        if (m.type === 'auth_required') {
          if (!token) { clearTimeout(t); return finish({ reach: true, version: m.ha_version }); }
          ws.send(JSON.stringify({ type: 'auth', access_token: token }));
        } else if (m.type === 'auth_ok') { clearTimeout(t); finish({ reach: true, auth: 'ok', version: m.ha_version }); }
        else if (m.type === 'auth_invalid') { clearTimeout(t); finish({ reach: true, auth: 'invalid' }); }
      };
    });
  }
  function normUrl(u) {
    u = String(u || '').trim().replace(/\/+$/, '').replace(/\/(lovelace|config|dashboard).*$/i, '');
    if (u && !/^https?:\/\//i.test(u)) u = 'http://' + u;
    return u;
  }
  // prøv også de mest almindelige varianter, hvis den indtastede adresse ikke svarer
  function variants(u) {
    const out = [u];
    try {
      const x = new URL(u);
      if (x.port === '8123') { x.port = ''; out.push(x.toString().replace(/\/$/, '')); }
      else if (!x.port) { x.port = '8123'; out.push(x.toString().replace(/\/$/, '')); }
    } catch (e) { /* ok */ }
    ['http://homeassistant.local:8123', 'http://localhost:8123'].forEach(v => { if (!out.includes(v)) out.push(v); });
    if (location.pathname.startsWith('/local/')) out.unshift(location.origin);
    return [...new Set(out)];
  }

  /* ---------- bil-genkendelse ---------- */
  const CAR_PLATFORMS = /renault|kia_uvo|hyundai|tesla|teslemetry|tessie|volkswagen|myskoda|skoda|polestar|bmw|mercedes|volvo|nissan|leaf|mg_|byd|ford|toyota|peugeot|stellantis|psa|audi|cupra|porsche|smart|xpeng|nio/i;
  // prefer kan være én regex eller en liste i prioriteret rækkefølge
  function pick(list, prefer, avoid) {
    const ok = list.filter(id => !(avoid && avoid.test(id)));
    for (const p of [].concat(prefer)) { const hit = ok.find(id => p.test(id)); if (hit) return hit; }
    return ok[0] || '';
  }
  async function detectCars() {
    const reg = await registry(true);
    if (!reg) return [];
    const byDev = {};
    reg.ents.filter(e => CAR_PLATFORMS.test(e.platform) && e.device_id && !e.disabled_by && st(e.entity_id))
      .forEach(e => { (byDev[e.device_id] = byDev[e.device_id] || []).push(e.entity_id); });
    return Object.entries(byDev).map(([devId, ids]) => {
      const dev = reg.devs.find(d => d.id === devId) || {};
      const a = id => st(id)?.attributes || {};
      const sensors = ids.filter(id => id.startsWith('sensor.'));
      const battery = pick(sensors.filter(id => a(id).unit_of_measurement === '%' && (a(id).device_class === 'battery' || /batter|soc/i.test(id))),
        [/ev_batter|ev_battery|hv_batter|state_of_charge|_soc\b/i, /battery_level|batteriniveau|_batteri$|_battery$/i],
        /12v|aux|bilbatteri|car_battery|starter|temp|energy|capacity|health|soh|available/i);
      if (!battery) return null;
      const range = pick(sensors.filter(id => /^(km|mi)$/.test(a(id).unit_of_measurement || '') && /range|autonom|raekkevid|rækkevid/i.test(id)), /ev_|battery_autonomy|ev_range/i, /fuel|total/i);
      const charging = pick(ids.filter(id => id.startsWith('binary_sensor.') && (a(id).device_class === 'battery_charging' || /charg|oplad/i.test(id))), /ev_batter.*charg|batteriopladning|charging|oplader/i, /plug|stik|port|cable|kabel/i);
      const lock = pick(ids.filter(id => id.startsWith('lock.')), /door|dor|lock/i) || pick(ids.filter(id => id.startsWith('binary_sensor.') && a(id).device_class === 'lock'), /lock/i);
      const climate = pick(ids.filter(id => id.startsWith('button.') && /air_condition|climate|klima|preheat|hvac|precondition/i.test(id)), /start/i)
        || pick(ids.filter(id => id.startsWith('switch.') && /klima|climate|hvac|air_condition|precondition/i.test(id)), /klima|climate/i)
        || pick(ids.filter(id => id.startsWith('climate.')), /./);
      const name = dev.name_by_user || dev.name || fname(battery);
      const brand = dev.manufacturer || '';
      const shape = /\bvan\b|transporter|kangoo|berlingo|buzz|multivan|staria|carnival|vito|sprinter|caddy|partner|proace/i.test(`${name} ${dev.model || ''}`) ? 'van' : 'hatch';
      return { id: Store.uid(), name: String(name).replace(new RegExp('^' + brand + '\\s*', 'i'), '') || name, brand, shape, color: '#dfe5ee', battery, range, charging, lock, climate };
    }).filter(Boolean);
  }

  /* ---------- trin ---------- */
  const R = {};

  R.welcome = () => `
    <h1>Velkommen til Familietavlen 👋</h1>
    <p class="su-lead">Guiden tager dig igennem opsætningen trin for trin. Hvert trin tjekker selv, om det virker – og fortæller præcis hvad du skal gøre, hvis noget mangler.</p>
    ${box('info', `<b>Det skal du bruge:</b><br>• <b>Home Assistant</b> kørende på dit netværk (fx en Home Assistant Green)<br>• En computer eller tablet med Chrome til opsætningen<br>• Ca. 30–60 minutter (alt efter hvor mange ting du vil koble på)`)}
    ${box('info', `Du kan altid springe et trin over og tage det senere: <b>Forældre → Skærm & backup → Start opsætningsguiden</b>.`)}
    <div class="su-choice">
      <button class="btn primary big" data-su="next">${ic('sparkle')}Start opsætningen</button>
      <button class="btn ghost big" data-su="demo">Bare se demoen først</button>
    </div>`;

  R.family = () => {
    if (!W.kids.length) {
      const real = Store.state.kids.filter(k => !/^(emma|oliver)$/i.test(k.name));
      W.kids = real.length ? real.map(k => ({ ...k })) : [{ id: Store.uid(), name: '', color: T.COLORS[0], avatar: { type: 'emoji', value: T.KID_EMOJI[0] } }];
      // eksempel-opgaver kun som standard ved første opsætning – ellers rører vi ikke jeres egne opgaver
      W.example = W.example ?? !real.length;
    }
    return `<h1>Hvem bor her? 👨‍👩‍👧‍👦</h1>
      <p class="su-lead">Skriv børnenes navne. Hvert barn får sin egen farve og figur – tryk på figuren eller farven for at skifte. Billeder kan du tilføje senere under Forældre.</p>
      <div class="su-kids">${W.kids.map((k, i) => `
        <div class="su-kid" style="--kc:${k.color}">
          <button class="su-av" data-su="kid-emoji" data-i="${i}" aria-label="Skift figur">${esc(k.avatar.value)}</button>
          <input class="su-in" data-su-kid="${i}" value="${esc(k.name)}" placeholder="Barnets navn" autocomplete="off">
          <button class="su-col" data-su="kid-color" data-i="${i}" aria-label="Skift farve"></button>
          ${W.kids.length > 1 ? `<button class="btn ghost sm" data-su="kid-del" data-i="${i}">${ic('trash')}</button>` : ''}
        </div>`).join('')}</div>
      <button class="btn ghost" data-su="kid-add">${ic('plus')}Tilføj barn</button>
      <label class="toggle-row su-toggle"><label class="toggle"><input type="checkbox" data-su-example ${W.example ? 'checked' : ''}><i></i></label>
        Giv alle børn eksempel-opgaverne (red seng, børst tænder, pak skoletaske …) – de kan rettes bagefter</label>
      <div id="su-msg"></div>`;
  };

  R.pin = () => `<h1>Forældre-PIN 🔒</h1>
    <p class="su-lead">PIN-koden beskytter forældre-delen, oplåsning af bilerne og godkendelse af belønninger. Vælg 4–6 cifre, som børnene ikke kender.</p>
    <div class="form-grid">
      <label class="field"><span>Ny PIN</span><input class="su-in" id="su-pin1" inputmode="numeric" maxlength="6" type="password" autocomplete="new-password"></label>
      <label class="field"><span>Gentag PIN</span><input class="su-in" id="su-pin2" inputmode="numeric" maxlength="6" type="password" autocomplete="new-password"></label>
    </div>
    <div id="su-msg"></div>`;

  R.ha = () => {
    const c = cfg().ha;
    const sugg = c.url || (location.pathname.startsWith('/local/') ? location.origin : 'http://homeassistant.local:8123');
    return `<h1>Forbind Home Assistant 🔌</h1>
      <p class="su-lead">Home Assistant er “hjernen”, der kobler biler, lys, musik og TV sammen. Tavlen skal bruge adressen og en adgangsnøgle (token).</p>
      <h3 class="su-h">1 · Adressen</h3>
      <p class="muted">Det er den adresse, du åbner Home Assistant på i browseren – typisk <code>http://homeassistant.local:8123</code> eller en IP-adresse som <code>http://192.168.1.50:8123</code>.</p>
      <div class="row"><input class="su-in" id="su-url" value="${esc(sugg)}" placeholder="http://homeassistant.local:8123" autocomplete="off" spellcheck="false">
        <button class="btn ghost" data-su="ha-test-url">Test adressen</button></div>
      <div id="su-url-msg"></div>
      <h3 class="su-h">2 · Adgangsnøgle (token)</h3>
      ${steps([
        'Åbn Home Assistant i en ny fane og klik på <b>dit navn</b> nederst i venstre menu.',
        'Vælg fanen <b>Sikkerhed</b> og scroll helt ned til <b>Langtidsholdbare adgangstokens</b>.',
        'Klik <b>Opret token</b>, kald den “Familietavle” og tryk OK.',
        '<b>Kopiér tokenet med det samme</b> – det vises kun én gang – og indsæt det herunder.',
      ])}
      <input class="su-in" id="su-token" type="password" value="${esc(c.token)}" placeholder="Indsæt token her (lang tekst)" autocomplete="off" spellcheck="false">
      ${box('warn', 'Chrome udfylder nogle gange felter med dit Home Assistant-login af sig selv. Tjek at der står et <b>langt token</b> her – ikke dit brugernavn eller din kode.')}
      <div id="su-msg"></div>`;
  };

  R.cars = () => `<h1>Biler 🚗</h1>
    <p class="su-lead">Tavlen viser batteri, rækkevidde, opladning og lås – og kan forvarme bilen. Bilen skal først være koblet på Home Assistant med bilmærkets integration.</p>
    <div id="su-detect">${box('info', 'Leder efter biler i Home Assistant …')}</div>`;

  R.music = () => `<h1>Musik (Spotify) 🎵</h1>
    <p class="su-lead">Tavlen kan vise hvad der spiller, styre afspilningen og starte jeres playlister på Google-højttalerne. Kræver Spotify Premium.</p>
    <div id="su-detect">${box('info', 'Leder efter Spotify i Home Assistant …')}</div>`;

  R.tv = () => `<h1>TV 📺</h1>
    <p class="su-lead">Med en Google TV / Chromecast med Google TV kan tavlen starte Netflix, DRTV osv. direkte på TV’et og fungere som fjernbetjening.</p>
    <div id="su-detect">${box('info', 'Leder efter TV i Home Assistant …')}</div>`;

  R.lights = () => `<h1>Lys 💡</h1>
    <p class="su-lead">Alle lys og stemninger (scener) fra Home Assistant vises automatisk under <b>Hjemmet</b>. Her vælger du de stemninger, der skal ligge på forsiden.</p>
    <div id="su-detect">${box('info', 'Leder efter lys i Home Assistant …')}</div>`;

  R.plan = () => `<h1>Kalender & indkøbsliste 📅</h1>
    <p class="su-lead">Tavlen viser ugens aftaler, kan oprette nye – og har en indkøbsliste med hurtig-knapper.</p>
    <div id="su-detect">${box('info', 'Leder efter kalendere og lister i Home Assistant …')}</div>`;

  R.weather = () => `<h1>Vejr ⛅</h1>
    <p class="su-lead">Hvilken by skal vejret vises for?</p>
    <div class="row"><input class="su-in" id="su-city" value="${esc(cfg().weather.name)}" placeholder="Søg efter by …" autocomplete="off">
      <button class="btn primary" data-su="city">Søg</button></div>
    <div class="chips" id="su-city-res"></div>
    <div id="su-msg">${box('ok', `Nu: <b>${esc(cfg().weather.name)}</b>`)}</div>`;

  R.done = () => {
    const row = (id, label) => {
      const s = W.status[id];
      const icon = s === 'ok' ? '✅' : s === 'skip' ? '⏭️' : s === 'missing' ? '⚠️' : '⚪';
      const txt = s === 'ok' ? 'Klar' : s === 'skip' ? 'Sprunget over' : s === 'missing' ? 'Mangler – kan sættes op senere' : 'Ikke gennemgået';
      return `<div class="su-sum"><span>${icon}</span><b>${label}</b><small>${txt}</small></div>`;
    };
    return `<h1>Færdig! 🎉</h1>
      <p class="su-lead">Tavlen er klar. Her er status:</p>
      <div class="su-summary">${STEPS.slice(1, -1).map(s => row(s.id, s.title)).join('')}</div>
      ${box('info', 'Mangler noget, kan du altid starte guiden igen under <b>Forældre → Skærm & backup</b>.')}
      ${box('warn', 'Tag en <b>backup</b> nu – alt gemmes kun i denne browser. Den kan indlæses igen, hvis skærmen skiftes ud.')}
      <div class="su-choice">
        <button class="btn ghost big" data-su="backup">Download backup</button>
        <button class="btn primary big" data-su="finish">${ic('home')}Gå til tavlen</button>
      </div>`;
  };

  /* ---------- registrerings-trin (asynkrone tjek) ---------- */
  const needHA = () => box('warn', `Home Assistant er ikke forbundet endnu, så tavlen kan ikke lede. Gå et trin tilbage til <b>Home Assistant</b> – eller spring over og tag det senere.`);

  async function runDetect(id) {
    const out = $('#su-detect');
    if (!out) return;
    if (!haOK()) { out.innerHTML = needHA(); setStatus(id, 'missing'); return; }
    const reg = await registry(true);
    const ha = T.App.ha;
    let html = '';

    if (id === 'cars') {
      const cars = await detectCars();
      W.cars = cars;
      if (cars.length) {
        html += box('ok', `Fandt <b>${cars.length} ${cars.length === 1 ? 'bil' : 'biler'}</b>. Tjek at tallene ser rigtige ud:`);
        html += `<div class="su-cars">${cars.map((c, i) => {
          const b = st(c.battery)?.state, r = st(c.range)?.state;
          return `<label class="su-car"><input type="checkbox" data-su-car="${i}" checked>
            <div><b>${esc(c.brand)} ${esc(c.name)}</b>
            <small>🔋 ${esc(b ?? '–')}% · 🛣️ ${esc(r ?? '–')} km · ${c.lock ? '🔒 lås fundet' : 'ingen lås'} · ${c.climate ? '♨️ forvarm fundet' : 'ingen forvarm'}</small></div></label>`;
        }).join('')}</div>`;
        html += box('info', 'Viser en bil forkerte tal, kan felterne rettes bagefter under <b>Forældre → Integrationer → Biler</b>.');
        setStatus(id, 'ok');
      } else {
        html += box('warn', 'Fandt ingen biler i Home Assistant endnu.');
        html += `<p>Sådan kobler du bilen på – vælg dit mærke:</p>
          <div class="su-guides">
            <details><summary>Renault</summary>${steps(['Home Assistant → <b>Indstillinger → Enheder & tjenester → + Tilføj integration → Renault</b>.', 'Vælg dit land og log ind med din <b>My Renault</b>-konto.', 'Kom tilbage hertil og tryk <b>Tjek igen</b>.'])}</details>
            <details><summary>Kia / Hyundai</summary>${steps(['Home Assistant → <b>Indstillinger → Markedsplads</b> → søg <b>Kia Uvo / Hyundai Bluelink</b> → Installér og genstart.', '<b>Enheder & tjenester → + Tilføj integration → Kia Uvo / Hyundai Bluelink</b>: region Europe, mærke, Kia Connect-login og PIN.', 'Siger den “uventet fejl”, kan Home Assistants internet være ustabilt – prøv igen om lidt.'])}</details>
            <details><summary>Tesla</summary>${steps(['Home Assistant → <b>+ Tilføj integration → Tesla Fleet</b> (eller Teslemetry) og følg login.'])}</details>
            <details><summary>VW / Skoda / Cupra / Audi</summary>${steps(['Søg efter dit mærke under <b>+ Tilføj integration</b> – findes det ikke, så prøv <b>Markedsplads</b>.'])}</details>
          </div>`;
        setStatus(id, 'missing');
      }
    }

    if (id === 'music') {
      const sp = byPlatform(reg, /^spotify$/, 'media_player')[0]?.entity_id;
      const spotcast = byPlatform(reg, /spotcast/).length > 0;
      W.spotify = sp;
      if (sp) {
        const a = st(sp).attributes;
        html += box('ok', `Spotify er forbundet: <b>${esc(a.friendly_name)}</b>${a.media_title ? ` – spiller nu “${esc(a.media_title)}”` : ''}.`);
        html += spotcast ? box('ok', '<b>Spotcast</b> er også sat op – tavlen kan starte musik på alle Google-højttalere.')
          : box('info', `<b>Valgfrit:</b> Spotify “glemmer” Google-højttalere, der ikke har spillet for nylig. Med <b>Spotcast</b> kan tavlen altid starte musik på dem:
            ${steps(['<b>Markedsplads</b> → søg <b>Spotcast</b> → Installér → genstart Home Assistant.', '<b>+ Tilføj integration → Spotcast</b>: brug samme Spotify-app (Client ID/secret) som Spotify-integrationen.', 'Ved “Desktop authorization”: vælg <b>Paste the redirect URL</b>, åbn linket, og kopiér hele adressen fra fejlsiden (<code>http://127.0.0.1:8080/login?code=…</code>) ind i feltet.'])}`);
        setStatus(id, 'ok');
      } else {
        html += box('warn', 'Spotify er ikke koblet på Home Assistant endnu.');
        html += steps([
          'Gå til <b>developer.spotify.com/dashboard</b> → <b>Create app</b>. Navn: “Home Assistant”. Redirect URI: <code>https://my.home-assistant.io/redirect/oauth</code> (tryk Add). Sæt flueben i <b>Web API</b> → Save.',
          'Åbn app’en → <b>Settings</b>. Find <b>Client ID</b> og <b>View client secret</b>.',
          'Home Assistant → <b>+ Tilføj integration → Spotify</b>. Indsæt Client ID og secret med <b>kopier-knapperne</b>.',
          '⚠️ Tjek at Chrome ikke har udfyldt felterne med dit Home Assistant-login (dit brugernavn og din kode) – så fejler det med “OAuth authorization error”.',
          'Log ind hos Spotify → Agree. Står der <code>homeassistant.local</code> på my.home-assistant.io-siden, så klik blyanten og ret adressen til den, du åbner Home Assistant på.',
          'Gør det i en <b>almindelig Chrome-fane</b> – ikke i en app’s indbyggede browser.',
        ]);
        setStatus(id, 'missing');
      }
    }

    if (id === 'tv') {
      const remotes = byPlatform(reg, /androidtv_remote/, 'remote').map(e => e.entity_id);
      W.tvs = remotes;
      if (remotes.length) {
        const cur = remotes.includes(cfg().tv) ? cfg().tv : remotes[0];
        W.tv = cur;
        html += box('ok', `Fandt ${remotes.length === 1 ? 'Google TV' : remotes.length + ' Google TV’er'}. Vælg det TV, streaming-knapperne skal starte på:`);
        html += `<div class="chips">${remotes.map(r => `<button class="chip-btn ${r === cur ? 'on' : ''}" data-su="pick-tv" data-v="${r}">📺 ${esc(fname(r))}</button>`).join('')}</div>`;
        setStatus(id, 'ok');
      } else {
        html += box('warn', 'Fandt ingen Google TV i Home Assistant.');
        html += steps([
          'Tænd TV’et, så skærmen kan ses.',
          'Home Assistant → <b>Indstillinger → Enheder & tjenester</b>. Står <b>Android TV Remote</b> under “Fundet”, så tryk <b>Tilføj</b>. Ellers: <b>+ Tilføj integration → Android TV Remote</b> og skriv TV-boksens IP-adresse (findes i Google Home-appen under enhedens indstillinger).',
          'Skriv den 6-tegns kode, der vises på TV’et, ind i Home Assistant.',
        ]);
        html += box('info', 'Har du kun en almindelig Chromecast uden fjernbetjening, kan den ikke starte apps – så spring dette trin over.');
        setStatus(id, 'missing');
      }
    }

    if (id === 'lights') {
      const lights = ha.list('light'), scenes = ha.list('scene');
      if (lights.length || scenes.length) {
        const fav = String(cfg().scenes || '').split(/[\s,]+/).filter(Boolean);
        W.scenes = new Set(fav.length ? fav : scenes.slice(0, 6).map(s => s.entity_id));
        html += box('ok', `Fandt <b>${lights.length} lys</b> og <b>${scenes.length} stemninger</b>. ${lights.filter(l => l.state === 'on').length} lys er tændt lige nu.`);
        if (scenes.length) {
          html += `<p><b>Vælg op til 6 stemninger til forsiden:</b></p><div class="chips su-scenes">${scenes.map(s =>
            `<label class="chip-opt"><input type="checkbox" data-su-scene="${s.entity_id}" ${W.scenes.has(s.entity_id) ? 'checked' : ''}><span>${esc(s.attributes.friendly_name || s.entity_id)}</span></label>`).join('')}</div>`;
        }
        setStatus(id, 'ok');
      } else {
        html += box('warn', 'Fandt ingen lys i Home Assistant endnu.');
        html += `<div class="su-guides">
          <details open><summary>WiZ-pærer</summary>${steps(['Home Assistant → <b>+ Tilføj integration → WiZ</b>, lad IP-feltet stå tomt → Indsend.', 'Finder den ingen, så tilføj hver pære med dens IP-adresse (står i WiZ-appen under pærens indstillinger).'])}</details>
          <details><summary>Philips Hue</summary>${steps(['<b>Indstillinger → Enheder & tjenester</b> → Philips Hue under “Fundet” → Tilføj.', 'Tryk på den runde knap oven på Hue-broen og derefter <b>Send</b> inden for 30 sekunder.'])}</details>
          <details><summary>Google Home-lys (andre mærker)</summary>${steps(['Home Assistant kan ikke hente lys direkte fra Google Home. Tilføj i stedet lysets eget mærke (fx IKEA, Nanoleaf, TP-Link) under <b>+ Tilføj integration</b>.'])}</details>
        </div>`;
        setStatus(id, 'missing');
      }
    }

    if (id === 'plan') {
      const cals = ha.list('calendar').filter(c => c.state !== 'unavailable');
      const todos = ha.list('todo');
      W.cals = new Set(String(cfg().calendars || '').split(/[\s,]+/).filter(x => cals.some(c => c.entity_id === x)));
      if (!W.cals.size) cals.filter(c => !/holiday|helligdag|ugenumre|week/i.test(c.entity_id)).forEach(c => W.cals.add(c.entity_id));
      const canCreate = c => ((c.attributes.supported_features || 0) & 1) === 1;
      W.calDef = cfg().calendarDefault || (cals.find(c => /famil/i.test(c.entity_id) && canCreate(c)) || cals.find(canCreate) || {}).entity_id || '';
      W.shop = cfg().shopping || (todos.find(t => /indk|shop|bring|handle|grocer/i.test(t.entity_id)) || todos[0] || {}).entity_id || '';
      if (cals.length) {
        html += box('ok', `Fandt <b>${cals.length} kalendere</b>. Vælg hvilke der skal vises:`);
        html += `<div class="chips">${cals.map(c => `<label class="chip-opt"><input type="checkbox" data-su-cal="${c.entity_id}" ${W.cals.has(c.entity_id) ? 'checked' : ''}><span>${esc(c.attributes.friendly_name)}</span></label>`).join('')}</div>`;
        const creatable = cals.filter(canCreate);
        if (creatable.length) html += `<p><b>Nye aftaler fra tavlen lægges i:</b></p><div class="chips">${creatable.map(c =>
          `<button class="chip-btn ${c.entity_id === W.calDef ? 'on' : ''}" data-su="pick-caldef" data-v="${c.entity_id}">📅 ${esc(c.attributes.friendly_name)}</button>`).join('')}</div>`;
      } else {
        html += box('warn', 'Fandt ingen kalender. Sådan kobler du Google Kalender på:');
        html += `<div class="su-guides"><details open><summary>Google Kalender (ca. 15 min.)</summary>${steps([
          'I Google Kalender: lav evt. en fælles kalender “Familie” og del den med familien.',
          '<b>console.cloud.google.com</b>: søg <b>Google Calendar API</b> → <b>Enable</b>.',
          'Søg <b>Google Auth Platform</b> → Get started: app-navn “Home Assistant”, din mail, Audience: <b>External</b> → Create.',
          '<b>Audience</b>: tryk <b>Publish app</b>. Er knappen grå, så tilføj dig selv under <b>Test users</b> (så skal login fornyes hver 7. dag).',
          '<b>Clients → + Create client</b> → type <b>TVs and Limited Input devices</b> → Create. Kopiér Client ID og secret.',
          'Home Assistant → <b>+ Tilføj integration → Google Calendar</b> → indsæt ID og secret (pas på Chromes autoudfyldning) → åbn google.com/device og skriv koden.',
          'Ved “Google har ikke bekræftet appen”: <b>Avanceret → Gå til Home Assistant</b> → Fortsæt.',
        ])}</details></div>`;
      }
      if (todos.length) {
        html += box('ok', `Indkøbsliste: <b>${esc(fname(W.shop))}</b>${todos.length > 1 ? ' – eller vælg en anden:' : ''}`);
        if (todos.length > 1) html += `<div class="chips">${todos.map(t => `<button class="chip-btn ${t.entity_id === W.shop ? 'on' : ''}" data-su="pick-shop" data-v="${t.entity_id}">🛒 ${esc(t.attributes.friendly_name)}</button>`).join('')}</div>`;
      } else {
        html += box('warn', 'Fandt ingen indkøbsliste. Home Assistant → <b>+ Tilføj integration → Indkøbsliste</b> (Shopping list) → Send.');
      }
      const nemlig = ha.list('sensor').find(s => s.attributes && 'lines' in s.attributes && 'missing_to_minimum' in s.attributes);
      if (nemlig) html += box('ok', 'Nemlig.com fundet: kurven vises på tavlen, og indkøbslisten kan lægges i kurven med ét tryk.');
      else html += `<div class="su-guides"><details><summary>Valgfrit: Nemlig.com-kurv på tavlen (ca. 5 min.)</summary>${steps([
        'Home Assistant → <b>Markedsplads</b> (HACS) → <b>⋮</b> øverst til højre → <b>Brugerdefinerede repositories</b> (Custom repositories).',
        'Indsæt <b>https://github.com/DruonDK/ha-nemlig</b>, vælg typen <b>Integration</b> → Tilføj. Søg derefter efter <b>Nemlig.com</b> → Download.',
        'Genstart Home Assistant: <b>Indstillinger → ⋮ → Genstart</b>.',
        '<b>Indstillinger → Enheder & tjenester → + Tilføj integration → Nemlig.com</b> → log ind med jeres Nemlig-mail og -adgangskode.',
        'Tryk <b>Tjek igen</b> her. Integrationen er uofficiel. Tavlen fylder kun kurven, så bestilling og betaling sker stadig i Nemlig-appen.',
      ])}</details></div>`;
      setStatus(id, cals.length || todos.length ? 'ok' : 'missing');
    }

    out.innerHTML = html + `<div class="row su-recheck"><button class="btn ghost" data-su="recheck">${ic('refresh')}Tjek igen</button></div>`;
  }

  /* ---------- gem et trin ---------- */
  async function commit(id) {
    const msg = (t, h) => { const m = $('#su-msg'); if (m) m.innerHTML = box(t, h); return false; };

    if (id === 'family') {
      W.kids.forEach((k, i) => { const inp = $(`[data-su-kid="${i}"]`); if (inp) k.name = inp.value.trim(); });
      const kids = W.kids.filter(k => k.name);
      if (!kids.length) return msg('bad', 'Skriv mindst ét navn.');
      const ids = kids.map(k => k.id);
      const old = Store.state.kids;
      Store.state.kids = kids.map(k => ({ stars: 0, lifetime: 0, ...old.find(o => o.id === k.id), ...k }));
      if (old.some(o => /^(emma|oliver)$/i.test(o.name)) || W.example === false) {
        // første opsætning: start helt forfra (ingen eksempel-historik)
        Store.state.done = {};
        Store.state.history = [];
        Store.state.kids.forEach(k => { if (!old.find(o => o.id === k.id && !/^(emma|oliver)$/i.test(o.name))) { k.stars = 0; k.lifetime = 0; } });
      }
      if (W.example) Store.state.tasks.forEach(t => { t.kids = [...ids]; });
      else if (old.some(o => /^(emma|oliver)$/i.test(o.name))) Store.state.tasks = [];
      Store.persist();
      setStatus(id, 'ok');
      return true;
    }

    if (id === 'pin') {
      const a = $('#su-pin1').value.trim(), b = $('#su-pin2').value.trim();
      if (!a && !b && cfg().pin !== '1234') { setStatus(id, 'ok'); return true; }
      if (!/^\d{4,6}$/.test(a)) return msg('bad', 'PIN skal være 4–6 cifre.');
      if (a !== b) return msg('bad', 'De to PIN-koder er ikke ens – prøv igen.');
      if (a === '1234' || a === '0000') return msg('warn', 'Vælg en anden PIN end 1234/0000 – den gætter børnene.');
      Store.setPath('settings.pin', a);
      setStatus(id, 'ok');
      return true;
    }

    if (id === 'ha') {
      if (haOK() && !$('#su-token').value.trim()) { setStatus(id, 'ok'); return true; }
      const url = normUrl($('#su-url').value), token = $('#su-token').value.trim();
      if (!url) return msg('bad', 'Skriv adressen på Home Assistant.');
      if (!token) return msg('bad', 'Indsæt dit token (punkt 2).');
      if (token.length < 100) return msg('bad', `Det indsatte er kun ${token.length} tegn – et rigtigt token er ca. 180 tegn. Har Chrome mon udfyldt feltet med din adgangskode? Opret et nyt token og kopiér det igen.`);
      msg('info', 'Tester forbindelsen …');
      let r = await testHA(url, token), used = url;
      if (!r.reach) {
        for (const v of variants(url).filter(v => v !== url)) {
          const t = await testHA(v, token);
          if (t.reach) { r = t; used = v; break; }
        }
      }
      if (!r.reach) {
        const https = location.protocol === 'https:' && /^http:/i.test(url);
        return msg('bad', `Kan ikke nå Home Assistant på <code>${esc(url)}</code>.
          ${steps([
            'Åbn adressen i en ny fane. Kommer Home Assistant frem dér? Hvis ikke, er adressen forkert.',
            'Prøv IP-adressen i stedet for navnet, fx <code>http://192.168.1.50:8123</code> (findes i Home Assistant under <b>Indstillinger → System → Netværk</b> eller i routeren).',
            'Nogle installationer svarer uden <code>:8123</code> – guiden har allerede prøvet begge varianter.',
            https ? 'Tavlen er åbnet via <b>https</b>, men Home Assistant via <b>http</b> – det blokerer browseren. Åbn tavlen via http, eller læg den ind i Home Assistant (se START-HER).' : 'Er Home Assistant lige blevet genstartet eller opdateret, så vent et par minutter og prøv igen.',
          ])}`);
      }
      if (r.auth === 'invalid') return msg('bad', 'Home Assistant svarer, men <b>afviser tokenet</b>. Opret et nyt token (punkt 2) og kopiér hele teksten – tjek at Chrome ikke har udfyldt feltet med din kode.');
      Store.setPath('settings.ha', { url: used, token });
      T.connectHA();
      for (let i = 0; i < 20 && !haOK(); i++) await sleep(300);
      if (!haOK()) return msg('bad', 'Tokenet virkede, men tavlen kunne ikke forbinde bagefter. Tryk <b>Næste</b> igen om et øjeblik.');
      W.reg = null;
      msg('ok', `Forbundet til Home Assistant ${esc(r.version || '')} på <code>${esc(used)}</code> · ${Object.keys(T.App.ha.states).length} enheder fundet.${used !== url ? ' (Guiden fandt selv den rigtige adresse.)' : ''}`);
      setStatus(id, 'ok');
      await sleep(900);
      return true;
    }

    if (id === 'cars') {
      if (W.cars?.length) {
        const chosen = W.cars.filter((c, i) => $(`[data-su-car="${i}"]`)?.checked);
        if (chosen.length) {
          const pal = ['#f4f6f9', '#3f73c2', '#c0392b', '#2c3e50', '#95a5a6'];
          chosen.forEach((c, i) => { c.color = pal[i % pal.length]; });
          Store.setPath('settings.cars', chosen);
        }
      }
      return true;
    }
    if (id === 'music') { if (W.spotify) Store.setPath('settings.spotify', W.spotify); return true; }
    if (id === 'tv') { if (W.tv) Store.setPath('settings.tv', W.tv); return true; }
    if (id === 'lights') {
      if (W.scenes) {
        const sel = [...document.querySelectorAll('[data-su-scene]')].filter(x => x.checked).map(x => x.dataset.suScene);
        if (sel.length > 6) return msg('warn', `Du har valgt ${sel.length} – vælg højst 6 til forsiden. (Alle stemninger kan stadig bruges under Hjemmet.)`);
        if (document.querySelector('[data-su-scene]')) Store.setPath('settings.scenes', sel.join(', '));
      }
      return true;
    }
    if (id === 'plan') {
      if (document.querySelector('[data-su-cal]')) {
        const sel = [...document.querySelectorAll('[data-su-cal]')].filter(x => x.checked).map(x => x.dataset.suCal);
        Store.setPath('settings.calendars', sel.join(', '));
      }
      if (W.calDef) Store.setPath('settings.calendarDefault', W.calDef);
      if (W.shop) Store.setPath('settings.shopping', W.shop);
      return true;
    }
    if (id === 'weather') { setStatus(id, 'ok'); return true; }
    return true;
  }

  /* ---------- visning ---------- */
  function draw() {
    const s = STEPS[W.i];
    W.el.innerHTML = `<div class="su">
      <aside class="su-nav">
        <div class="su-logo">${ic('home')}<span>Opsætning</span></div>
        ${STEPS.map((x, i) => `<button class="su-step ${i === W.i ? 'on' : ''} ${W.status[x.id] || ''}" data-su="goto" data-i="${i}">
          <span class="su-num">${W.status[x.id] === 'ok' ? '✓' : i + 1}</span>${x.title}</button>`).join('')}
        <button class="su-close" data-su="close">Luk guiden</button>
      </aside>
      <section class="su-main"><div class="su-card">
        ${R[s.id]()}
        ${!['welcome', 'done'].includes(s.id) ? `<div class="su-foot">
          <button class="btn ghost" data-su="back">${ic('back')}Tilbage</button>
          <span class="grow"></span>
          <button class="btn ghost" data-su="skip">Spring over</button>
          <button class="btn primary" data-su="next">Næste ›</button></div>` : ''}
      </div></section></div>`;
    W.el.querySelector('.su-main').scrollTop = 0;
    if (['cars', 'music', 'tv', 'lights', 'plan'].includes(s.id)) runDetect(s.id);
  }

  async function go(i) { W.i = Math.max(0, Math.min(STEPS.length - 1, i)); draw(); }

  async function onClick(e) {
    const b = e.target.closest('[data-su]');
    if (!b || W.busy) return;
    const a = b.dataset.su, id = STEPS[W.i].id;
    if (a === 'next') {
      W.busy = true; b.disabled = true;
      try { if (await commit(id)) go(W.i + 1); } finally { W.busy = false; b.disabled = false; }
    }
    else if (a === 'back') go(W.i - 1);
    else if (a === 'skip') { if (!W.status[id]) setStatus(id, 'skip'); go(W.i + 1); }
    else if (a === 'goto') go(+b.dataset.i);
    else if (a === 'close' || a === 'demo') close(a === 'demo');
    else if (a === 'recheck') runDetect(id);
    else if (a === 'kid-add') { syncKids(); W.kids.push({ id: Store.uid(), name: '', color: T.COLORS[W.kids.length % T.COLORS.length], avatar: { type: 'emoji', value: T.KID_EMOJI[W.kids.length % T.KID_EMOJI.length] } }); draw(); }
    else if (a === 'kid-del') { syncKids(); W.kids.splice(+b.dataset.i, 1); draw(); }
    else if (a === 'kid-emoji') { syncKids(); const k = W.kids[+b.dataset.i]; k.avatar = { type: 'emoji', value: T.KID_EMOJI[(T.KID_EMOJI.indexOf(k.avatar.value) + 1) % T.KID_EMOJI.length] }; draw(); }
    else if (a === 'kid-color') { syncKids(); const k = W.kids[+b.dataset.i]; k.color = T.COLORS[(T.COLORS.indexOf(k.color) + 1) % T.COLORS.length]; draw(); }
    else if (a === 'pick-tv') { W.tv = b.dataset.v; b.parentElement.querySelectorAll('.chip-btn').forEach(x => x.classList.toggle('on', x === b)); }
    else if (a === 'pick-caldef') { W.calDef = b.dataset.v; b.parentElement.querySelectorAll('.chip-btn').forEach(x => x.classList.toggle('on', x === b)); }
    else if (a === 'pick-shop') { W.shop = b.dataset.v; b.parentElement.querySelectorAll('.chip-btn').forEach(x => x.classList.toggle('on', x === b)); }
    else if (a === 'ha-test-url') {
      const m = $('#su-url-msg'), url = normUrl($('#su-url').value);
      m.innerHTML = box('info', 'Tester …');
      let r = await testHA(url), used = url;
      if (!r.reach) for (const v of variants(url).filter(v => v !== url)) { const t = await testHA(v); if (t.reach) { r = t; used = v; break; } }
      if (r.reach && used !== url) $('#su-url').value = used;
      m.innerHTML = r.reach
        ? box('ok', `Home Assistant ${esc(r.version || '')} svarer på <code>${esc(used)}</code>.${used !== url ? ' Guiden har rettet adressen for dig.' : ''}`)
        : box('bad', `Intet svar på <code>${esc(url)}</code> (prøvede også de almindelige varianter). Tjek at du kan åbne adressen i en ny fane, og prøv evt. IP-adressen.`);
    }
    else if (a === 'city') {
      const q = $('#su-city').value.trim(), res = $('#su-city-res');
      if (!q) return;
      try {
        const d = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=da`)).json();
        res.innerHTML = (d.results || []).map(x => `<button class="chip-btn" data-su="city-pick" data-lat="${x.latitude}" data-lon="${x.longitude}" data-name="${esc(x.name)}">${esc(x.name)}<small>${esc([x.admin1, x.country].filter(Boolean).join(', '))}</small></button>`).join('') || '<span class="muted">Ingen byer fundet</span>';
      } catch (err) { res.innerHTML = box('bad', 'Kunne ikke søge – er der internet?'); }
    }
    else if (a === 'city-pick') {
      Store.setPath('settings.weather', { name: b.dataset.name, lat: +b.dataset.lat, lon: +b.dataset.lon });
      T.loadWeather(); setStatus('weather', 'ok');
      $('#su-msg').innerHTML = box('ok', `Vejret vises nu for <b>${esc(b.dataset.name)}</b>.`);
      $('#su-city-res').innerHTML = '';
    }
    else if (a === 'backup') {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([Store.exportJSON()], { type: 'application/json' }));
      link.download = `familietavle-backup-${Store.dkey()}.json`;
      link.click();
    }
    else if (a === 'finish') close(false);
  }
  function syncKids() { W.kids.forEach((k, i) => { const inp = $(`[data-su-kid="${i}"]`); if (inp) k.name = inp.value; }); }
  function onChange(e) { if (e.target.matches('[data-su-example]')) W.example = e.target.checked; }

  /* ---------- åbn / luk ---------- */
  function open() {
    if (W.el) return;
    W.i = 0; W.kids = []; W.reg = null;
    W.el = document.createElement('div');
    W.el.className = 'su-back';
    W.el.addEventListener('click', onClick);
    W.el.addEventListener('change', onChange);
    document.body.appendChild(W.el);
    T.App.noSaver = true;
    draw();
  }
  function close(demo) {
    if (!demo) Store.setPath('settings.setupDone', true);
    else { try { sessionStorage.setItem('su-demo', '1'); } catch (e) { /* ok */ } }
    W.el?.remove(); W.el = null;
    T.App.noSaver = false;
    T.resetIdle();
    T.applySettings();
    T.nav('home');
  }

  // Første start: ingen Home Assistant-forbindelse og guiden ikke gennemført.
  // Valgte man "Bare se demoen", spørger vi ikke igen før næste gang browseren åbnes.
  const skipped = () => { try { return sessionStorage.getItem('su-demo') === '1'; } catch (e) { return false; } };
  const shouldRun = () => !cfg().setupDone && !cfg().ha.token && !skipped();
  if (shouldRun()) setTimeout(open, 400);
  else if (!cfg().setupDone && cfg().ha.token) Store.setPath('settings.setupDone', true);

  return { open, shouldRun, detectCars, markDemo: () => { try { sessionStorage.setItem('su-demo', '1'); } catch (e) { /* ok */ } } };
})();
window.Setup = Setup;
