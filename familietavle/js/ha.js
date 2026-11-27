/* Familietavlen – forbindelse til Home Assistant (WebSocket API) + demo-tilstand.
   Home Assistant er "hjernen" der samler biler (fx Tesla, Renault, Kia, VW), lys (WiZ / Google Home),
   Spotify og TV (Google TV / Chromecast). Uden opsætning kører tavlen med demo-data. */

class HABase {
  constructor() { this.states = {}; this.subs = new Set(); this.status = 'idle'; this.error = ''; }
  on(fn) { this.subs.add(fn); return () => this.subs.delete(fn); }
  emit() { this.subs.forEach(f => { try { f(this); } catch (e) { console.error(e); } }); }
  get(id) { return id ? this.states[id] : undefined; }
  list(domain) {
    return Object.values(this.states)
      .filter(s => s.entity_id.startsWith(domain + '.'))
      .sort((a, b) => (a.attributes.friendly_name || a.entity_id).localeCompare(b.attributes.friendly_name || b.entity_id, 'da'));
  }
  name(id) { const s = this.get(id); return s?.attributes?.friendly_name || id; }
  picture(u) { return u; }
  close() {}
}

class HAClient extends HABase {
  constructor(url, token) {
    super();
    this.url = url.trim().replace(/\/+$/, '');
    this.token = token.trim();
    this.mid = 1;
    this.pending = new Map();
    this.retry = 0;
    this.isDemo = false;
  }

  connect() {
    this.status = 'connecting';
    this.phase = 'åbner forbindelse';
    this.emit();
    let ws;
    try { ws = new WebSocket(this.url.replace(/^http/i, 'ws') + '/api/websocket'); }
    catch (e) { this.status = 'error'; this.error = 'Ugyldig adresse'; this.emit(); return; }
    this.ws = ws;
    ws.onopen = () => { this.phase = 'venter på Home Assistant'; this.emit(); };
    ws.onmessage = ev => this.onMsg(JSON.parse(ev.data));
    ws.onerror = () => { this.error = 'Kan ikke nå Home Assistant på ' + this.url; };
    ws.onclose = () => {
      clearInterval(this.heartbeat);
      if (this.closed) return;
      this.pending.forEach(p => p.rej(new Error('Forbindelsen blev afbrudt')));
      this.pending.clear();
      if (this.status !== 'auth_invalid') {
        this.status = 'disconnected';
        const delay = Math.min(30000, 2000 * 2 ** this.retry++);
        this.timer = setTimeout(() => this.connect(), delay);
      }
      this.emit();
    };
  }

  async onMsg(m) {
    if (m.type === 'auth_required') {
      this.phase = 'logger ind';
      this.emit();
      this.ws.send(JSON.stringify({ type: 'auth', access_token: this.token }));
    } else if (m.type === 'auth_invalid') {
      this.status = 'auth_invalid';
      this.error = 'Ugyldig adgangsnøgle (token)';
      this.emit();
      this.ws.close();
    } else if (m.type === 'auth_ok') {
      this.retry = 0;
      this.phase = 'henter enheder';
      this.emit();
      try {
        const states = await this.send({ type: 'get_states' });
        this.states = {};
        states.forEach(s => { this.states[s.entity_id] = s; });
        await this.send({ type: 'subscribe_events', event_type: 'state_changed' });
        this.status = 'connected';
        this.error = '';
        // hjerteslag: opdag en "død" forbindelse (fx efter netværksskift) og forbind igen
        clearInterval(this.heartbeat);
        this.heartbeat = setInterval(() => {
          this.send({ type: 'ping' }).catch(() => { try { this.ws.close(); } catch (e) { /* ok */ } });
        }, 30000);
      } catch (e) {
        // logget ind, men kunne ikke hente enheder – vis fejlen i stedet for at hænge på "Forbinder"
        this.status = 'error';
        this.error = 'Logget ind, men kunne ikke hente enheder: ' + e.message;
      }
      this.emit();
    } else if (m.type === 'result') {
      const p = this.pending.get(m.id);
      if (p) {
        this.pending.delete(m.id);
        m.success ? p.res(m.result) : p.rej(new Error(m.error?.message || 'Ukendt fejl fra Home Assistant'));
      }
    } else if (m.type === 'event' && m.event?.event_type === 'state_changed') {
      const { entity_id, new_state } = m.event.data;
      if (new_state) this.states[entity_id] = new_state; else delete this.states[entity_id];
      this.emit();
    }
  }

  send(msg) {
    return new Promise((res, rej) => {
      if (!this.ws || this.ws.readyState !== 1) return rej(new Error('Ikke forbundet til Home Assistant'));
      const id = this.mid++;
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ ...msg, id }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error('Home Assistant svarede ikke')); } }, 15000);
    });
  }

  callService(domain, service, data = {}) {
    return this.send({ type: 'call_service', domain, service, service_data: data });
  }

  // tjenester der svarer med data, fx calendar.get_events og todo.get_items
  async callServiceResponse(domain, service, data = {}, target = {}) {
    const r = await this.send({ type: 'call_service', domain, service, service_data: data, target, return_response: true });
    return r?.response || {};
  }

  picture(u) { return u && u.startsWith('/') ? this.url + u : u; }
  close() { this.closed = true; clearTimeout(this.timer); clearInterval(this.heartbeat); try { this.ws?.close(); } catch (e) { /* ok */ } }
}

/* ---------------- Demo ---------------- */
class DemoHA extends HABase {
  constructor() {
    super();
    this.isDemo = true;
    this.status = 'demo';
    const now = () => new Date().toISOString();
    const S = (id, state, attributes = {}) => {
      this.states[id] = { entity_id: id, state: String(state), attributes, last_changed: now(), last_updated: now() };
    };
    const lightAttrs = (name, bri, rgb) => ({ friendly_name: name, brightness: bri, rgb_color: rgb, supported_color_modes: ['rgb'] });

    // Biler
    S('sensor.model_y_battery', 78, { friendly_name: 'Model Y batteri', unit_of_measurement: '%' });
    S('sensor.model_y_range', 312, { friendly_name: 'Model Y rækkevidde', unit_of_measurement: 'km' });
    S('binary_sensor.model_y_charging', 'on', { friendly_name: 'Model Y lader' });
    S('lock.model_y', 'locked', { friendly_name: 'Model Y lås' });
    S('button.model_y_climate', 'unknown', { friendly_name: 'Model Y start klima' });
    S('sensor.id_buzz_battery', 54, { friendly_name: 'ID. Buzz batteri', unit_of_measurement: '%' });
    S('sensor.id_buzz_range', 198, { friendly_name: 'ID. Buzz rækkevidde', unit_of_measurement: 'km' });
    S('binary_sensor.id_buzz_charging', 'off', { friendly_name: 'ID. Buzz lader' });
    S('lock.id_buzz', 'unlocked', { friendly_name: 'ID. Buzz lås' });
    S('button.id_buzz_climate', 'unknown', { friendly_name: 'ID. Buzz start klima' });

    // Lys (fx WiZ-pærer i Home Assistant)
    S('light.kokken', 'on', lightAttrs('Køkken', 230, [255, 214, 160]));
    S('light.spisebord', 'on', lightAttrs('Spisebord', 150, [255, 190, 120]));
    S('light.stue_loft', 'off', lightAttrs('Stue loft', 255, [255, 230, 200]));
    S('light.stue_stander', 'on', lightAttrs('Stue standerlampe', 90, [255, 170, 90]));
    S('light.emma', 'off', lightAttrs('Emmas værelse', 200, [255, 120, 200]));
    S('light.oliver', 'off', lightAttrs('Olivers værelse', 200, [110, 190, 255]));
    S('light.entre', 'off', lightAttrs('Entré', 200, [255, 220, 180]));
    S('light.terrasse', 'off', lightAttrs('Terrasse', 255, [255, 200, 140]));
    S('scene.morgen', 'unknown', { friendly_name: 'Morgen' });
    S('scene.middag', 'unknown', { friendly_name: 'Aftensmad' });
    S('scene.film', 'unknown', { friendly_name: 'Filmaften' });
    S('scene.godnat', 'unknown', { friendly_name: 'Godnat' });

    // Andre enheder
    S('sensor.stue_temperatur', 21.4, { friendly_name: 'Stue', unit_of_measurement: '°C', device_class: 'temperature' });
    S('sensor.udendors_temperatur', 6.2, { friendly_name: 'Udenfor', unit_of_measurement: '°C', device_class: 'temperature' });
    S('switch.kaffemaskine', 'off', { friendly_name: 'Kaffemaskine' });
    S('switch.julelys', 'on', { friendly_name: 'Julelys' });

    // Musik & TV
    this.tracks = [
      { t: 'Here Comes the Sun', a: 'The Beatles', d: 185, c: ['#f6b73c', '#f05d23'] },
      { t: 'Dancing Queen', a: 'ABBA', d: 231, c: ['#a78bfa', '#ec4899'] },
      { t: 'Kvinde min', a: "Gasolin'", d: 230, c: ['#22d3ee', '#2563eb'] },
      { t: 'Happy', a: 'Pharrell Williams', d: 233, c: ['#facc15', '#16a34a'] },
    ];
    this.ti = 0;
    const tr = this.tracks[0];
    S('media_player.spotify', 'playing', {
      friendly_name: 'Spotify', media_title: tr.t, media_artist: tr.a, media_duration: tr.d,
      media_position: 42, media_position_updated_at: now(), volume_level: 0.35, shuffle: false,
      source: 'Køkken', source_list: ['Køkken', 'Stue', 'Hele huset', 'Børneværelse'], demo_colors: tr.c,
    });
    S('media_player.stue_tv', 'off', { friendly_name: 'Stue-TV', source_list: Store.STREAMING.map(s => s.source) });

    // Kalender og indkøbsliste
    S('calendar.familie', 'off', { friendly_name: 'Familie', supported_features: 7 });
    S('calendar.skole', 'off', { friendly_name: 'Skole' });
    const day = (n, h, m = 0) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, m, 0, 0); return d; };
    const iso = d => { const z = n => String(n).padStart(2, '0'); const o = -d.getTimezoneOffset(); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}:00${o >= 0 ? '+' : '-'}${z(Math.floor(Math.abs(o) / 60))}:${z(Math.abs(o) % 60)}`; };
    const date = n => iso(day(n, 0)).slice(0, 10);
    this.events = [
      { cal: 'calendar.familie', summary: 'Fodbold', start: iso(day(0, 16, 30)), end: iso(day(0, 18)), location: 'Stadion' },
      { cal: 'calendar.familie', summary: 'Aftensmad hos mormor', start: iso(day(1, 17, 30)), end: iso(day(1, 20)) },
      { cal: 'calendar.skole', summary: 'Klippedag', start: date(2), end: date(3) },
      { cal: 'calendar.familie', summary: 'Svømning', start: iso(day(3, 10)), end: iso(day(3, 11)), location: 'Svømmehallen' },
      { cal: 'calendar.familie', summary: 'Tandlæge', start: iso(day(5, 8, 15)), end: iso(day(5, 9)) },
    ];
    this.shop = [
      { uid: 'a', summary: 'Mælk', status: 'needs_action' },
      { uid: 'b', summary: 'Rugbrød', status: 'needs_action' },
      { uid: 'c', summary: 'Bananer', status: 'completed' },
      { uid: 'd', summary: 'Kaffe', status: 'needs_action' },
    ];
    S('todo.indkobsliste', 3, { friendly_name: 'Indkøbsliste', supported_features: 15 });

    // Nemlig.com (som integrationen DruonDK/ha-nemlig viser det)
    const P = (product_id, brand, name, description, price, bought, offer) =>
      ({ product_id, brand, name, description, price, bought, offer_price: offer ?? null, on_offer: offer != null });
    this.nmCat = [
      P('5001', 'Arla', 'Letmælk 1,5 %', '1 l', 13.95, 14), P('5002', 'Arla', 'Minimælk 0,4 %', '1 l', 12.95, 9),
      P('5003', 'Schulstad', 'Rugbrød m. solsikke', '1 kg', 28, 9), P('5004', 'Øko', 'Bananer', '5 stk.', 18, 11),
      P('5005', 'Lurpak', 'Smør', '200 g', 24.95, 7, 19.95), P('5006', 'Hedegaard', 'Æg, frilandsæg', '10 stk.', 32, 8),
      P('5007', 'Ota', 'Havregryn', '1 kg', 17.5, 5), P('5008', 'Barilla', 'Penne', '500 g', 16, 2),
      P('5009', 'Peter Larsen', 'Kaffe, formalet', '400 g', 49.95, 0, 39.95), P('5010', 'Merrild', 'Kaffe, mellemristet', '400 g', 44.95, 0),
      P('5011', 'Øko', 'Æbler, Pink Lady', '6 stk.', 25, 3),
    ];
    this.nmBasket = [{ product_id: '5007', quantity: 1 }, { product_id: '5006', quantity: 1 }];
    this.nmUpdate();
    S('sensor.nemlig_naeste_levering', iso(day(1, 17)), { friendly_name: 'Nemlig Næste levering', device_class: 'timestamp',
      window_end: iso(day(1, 18)), order_number: '10000001', total: 0 });
    S('sensor.nemlig_aendringsfrist', iso(day(0, 23, 59)), { friendly_name: 'Nemlig Ændringsfrist', device_class: 'timestamp' });
    S('sensor.nemlig_ordrestatus', 'editable', { friendly_name: 'Nemlig Ordrestatus', nemlig_state: 'Editable' });
  }

  nmUpdate() {
    const lines = this.nmBasket.map(l => {
      const p = this.nmCat.find(x => x.product_id === l.product_id);
      return { product_id: p.product_id, name: `${p.brand} ${p.name}`, quantity: l.quantity, price: +((p.offer_price ?? p.price) * l.quantity).toFixed(2) };
    });
    const tot = +lines.reduce((s, l) => s + l.price, 0).toFixed(2), min = 400, del = tot >= 800 ? 0 : 29;
    this.states['sensor.nemlig_kurv'] = {
      entity_id: 'sensor.nemlig_kurv', state: String(tot), last_changed: new Date().toISOString(), last_updated: new Date().toISOString(),
      attributes: { friendly_name: 'Nemlig Kurv', device_class: 'monetary', unit_of_measurement: 'DKK',
        item_count: lines.reduce((s, l) => s + l.quantity, 0), total_price: +(tot + del).toFixed(2), delivery_price: del,
        minimum_order_total: min, missing_to_minimum: Math.max(0, +(min - tot).toFixed(2)), lines },
    };
    const n = this.states['sensor.nemlig_naeste_levering'];
    if (n) n.attributes = { ...n.attributes, total: +(tot + del).toFixed(2) };
    return { basket_total: tot, basket_items: lines.reduce((s, l) => s + l.quantity, 0), missing_to_minimum: Math.max(0, +(min - tot).toFixed(2)) };
  }

  nemlig(service, data) {
    const low = s => String(s || '').toLowerCase();
    const card = p => ({ product_id: p.product_id, name: p.name, brand: p.brand, description: p.description, price: p.price,
      unit_price: null, unit_price_label: '', on_offer: true, offer_price: p.offer_price, offer_min_quantity: null, available: true });
    const words = q => low(q).split(/\s+/).filter(Boolean);
    const match = (p, q) => words(q).every(w => low(`${p.brand} ${p.name} ${p.description}`).includes(w));
    if (service === 'search') return { products: this.nmCat.filter(p => match(p, data.query)).slice(0, data.limit || 10).map(card) };
    if (service !== 'add_product') return {};
    let p = data.product_id && this.nmCat.find(x => x.product_id === String(data.product_id));
    if (!p) {
      // som integrationen: kun varer I har købt før, og kun hvis valget er tydeligt
      const hits = this.nmCat.filter(x => x.bought && match(x, data.query)).sort((a, b) => b.bought - a.bought);
      if (hits.length === 1 || (hits.length > 1 && hits[0].bought >= 2 && hits[0].bought >= 2 * hits[1].bought)) p = hits[0];
      else if (hits.length) return { status: 'ambiguous', candidates: hits.slice(0, 5).map(x => ({ product_id: x.product_id, name: `${x.brand} ${x.name}`, description: x.description, times_bought: x.bought, last_bought: null })) };
      else return { status: 'not_found', suggestions: this.nmCat.filter(x => match(x, data.query)).slice(0, 5).map(card) };
    }
    const qty = Math.max(1, +data.quantity || 1);
    let line = this.nmBasket.find(l => l.product_id === p.product_id);
    if (line) line.quantity += qty; else this.nmBasket.push(line = { product_id: p.product_id, quantity: qty });
    const sum = this.nmUpdate();
    this.emit();
    return { status: 'added', product_id: p.product_id, name: `${p.brand} ${p.name}`, quantity: line.quantity, ...sum };
  }

  async callServiceResponse(domain, service, data = {}, target = {}) {
    await new Promise(r => setTimeout(r, 80));
    const ids = [].concat(target.entity_id || data.entity_id || []);
    if (domain === 'calendar' && service === 'get_events') {
      const out = {};
      ids.forEach(id => { out[id] = { events: this.events.filter(e => e.cal === id).map(({ cal, ...e }) => e) }; });
      return out;
    }
    if (domain === 'todo' && service === 'get_items') return { [ids[0]]: { items: this.shop.map(i => ({ ...i })) } };
    if (domain === 'nemlig') return this.nemlig(service, data);
    return {};
  }

  shopChanged() {
    this.set('todo.indkobsliste', this.shop.filter(i => i.status === 'needs_action').length);
  }

  set(id, state, attrs = {}) {
    const s = this.states[id];
    if (!s) return;
    this.states[id] = { ...s, state: String(state), attributes: { ...s.attributes, ...attrs }, last_updated: new Date().toISOString() };
  }

  connect() {
    this.emit();
    this.ticker = setInterval(() => this.simulate(), 15000);
  }
  close() { clearInterval(this.ticker); }

  simulate() {
    [['model_y', 'binary_sensor.model_y_charging'], ['id_buzz', 'binary_sensor.id_buzz_charging']].forEach(([c, ch]) => {
      if (this.get(ch)?.state === 'on') {
        const b = Math.min(100, +this.get(`sensor.${c}_battery`).state + 1);
        this.set(`sensor.${c}_battery`, b);
        this.set(`sensor.${c}_range`, Math.round(b * 4));
        if (b >= 100) this.set(ch, 'off');
      }
    });
    const sp = this.get('media_player.spotify');
    if (sp.state === 'playing') {
      const pos = this.pos(sp);
      if (pos >= sp.attributes.media_duration) this.next();
    }
    this.emit();
  }

  pos(s) {
    const a = s.attributes;
    let p = a.media_position || 0;
    if (s.state === 'playing') p += (Date.now() - new Date(a.media_position_updated_at)) / 1000;
    return p;
  }

  next(dir = 1) {
    this.ti = (this.ti + dir + this.tracks.length) % this.tracks.length;
    const tr = this.tracks[this.ti];
    this.set('media_player.spotify', 'playing', {
      media_title: tr.t, media_artist: tr.a, media_duration: tr.d, media_position: 0,
      media_position_updated_at: new Date().toISOString(), demo_colors: tr.c,
    });
  }

  async callService(domain, service, data = {}) {
    await new Promise(r => setTimeout(r, 120));
    const ids = [].concat(data.entity_id || []);
    if (domain === 'homeassistant' && ids[0]) domain = ids[0].split('.')[0];
    const lightOn = (id, extra = {}) => this.set(id, 'on', extra);
    const lights = this.list('light').map(l => l.entity_id);

    if (domain === 'light') {
      ids.forEach(id => {
        const s = this.get(id);
        if (!s) return;
        if (service === 'toggle') this.set(id, s.state === 'on' ? 'off' : 'on');
        if (service === 'turn_off') this.set(id, 'off');
        if (service === 'turn_on') lightOn(id, data.brightness_pct ? { brightness: Math.round(data.brightness_pct * 2.55) } : {});
      });
    } else if (domain === 'scene') {
      const sc = ids[0];
      const plan = {
        'scene.morgen': { 'light.kokken': 255, 'light.spisebord': 200, 'light.entre': 180 },
        'scene.middag': { 'light.kokken': 180, 'light.spisebord': 140, 'light.stue_stander': 90 },
        'scene.film': { 'light.stue_stander': 40 },
        'scene.godnat': {},
      }[sc] || {};
      lights.forEach(id => (plan[id] ? lightOn(id, { brightness: plan[id] }) : this.set(id, 'off')));
    } else if (domain === 'lock') {
      ids.forEach(id => {
        this.set(id, service === 'lock' ? 'locking' : 'unlocking');
        setTimeout(() => { this.set(id, service === 'lock' ? 'locked' : 'unlocked'); this.emit(); }, 1800);
      });
    } else if (domain === 'switch' || domain === 'input_boolean') {
      ids.forEach(id => {
        const s = this.get(id);
        if (s) this.set(id, service === 'toggle' ? (s.state === 'on' ? 'off' : 'on') : service === 'turn_on' ? 'on' : 'off');
      });
    } else if (domain === 'media_player') {
      const id = ids[0], s = this.get(id);
      if (!s) throw new Error('Ukendt afspiller');
      if (id === 'media_player.stue_tv') {
        if (service === 'turn_on') this.set(id, 'on');
        if (service === 'select_source') this.set(id, 'playing', { source: data.source });
      } else {
        if (service === 'media_play_pause') {
          const playing = s.state === 'playing';
          this.set(id, playing ? 'paused' : 'playing', { media_position: this.pos(s), media_position_updated_at: new Date().toISOString() });
        }
        if (service === 'media_next_track') this.next(1);
        if (service === 'media_previous_track') this.next(-1);
        if (service === 'volume_set') this.set(id, s.state, { volume_level: data.volume_level });
        if (service === 'select_source') this.set(id, s.state, { source: data.source });
        if (service === 'shuffle_set') this.set(id, s.state, { shuffle: data.shuffle });
        if (service === 'play_media') {
          this.next(1);
          this.set(id, 'playing', { media_album_name: 'Playliste' });
        }
      }
    }
    if (domain === 'todo') {
      const find = x => this.shop.find(i => i.uid === x || i.summary === x);
      if (service === 'add_item') this.shop.push({ uid: Math.random().toString(36).slice(2), summary: data.item, status: 'needs_action' });
      if (service === 'update_item') { const it = find(data.item); if (it && data.status) it.status = data.status; }
      if (service === 'remove_item') [].concat(data.item).forEach(x => { this.shop = this.shop.filter(i => i !== find(x)); });
      if (service === 'remove_completed_items') this.shop = this.shop.filter(i => i.status !== 'completed');
      this.shopChanged();
    }
    if (domain === 'calendar' && service === 'create_event') {
      this.events.push({ cal: ids[0], summary: data.summary, start: data.start_date_time || data.start_date, end: data.end_date_time || data.end_date });
      this.set(ids[0], 'off');
    }
    // button.press / script / climate: intet at vise i demo
    this.emit();
    return {};
  }
}
