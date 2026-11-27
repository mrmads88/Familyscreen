/* Familietavlen – effekter: konfetti (canvas) og lyde (Web Audio, ingen lydfiler) */
const FX = (() => {
  const cv = document.getElementById('fx');
  const ctx = cv.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let parts = [];
  let raf = null;

  function size() {
    cv.width = innerWidth * dpr;
    cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + 'px';
    cv.style.height = innerHeight + 'px';
  }
  size();
  addEventListener('resize', size);

  const PAL = ['#ffd84d', '#ff6fae', '#5ad1ff', '#30e3a0', '#a78bfa', '#ff8a4c', '#ffffff'];

  function spawn(x, y, vx, vy, color, max) {
    const r = Math.random();
    parts.push({
      x, y, vx, vy, color,
      w: 7 + Math.random() * 8, h: 4 + Math.random() * 6,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
      shape: r < 0.25 ? 'c' : r < 0.4 ? 's' : 'r',
      life: 0, max: max || 120 + Math.random() * 70, wob: Math.random() * 10,
    });
  }

  function burst(x, y, { count = 90, colors = PAL, power = 1 } = {}) {
    for (let i = 0; i < count; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
      const s = (5 + Math.random() * 11) * power;
      spawn(x, y, Math.cos(a) * s, Math.sin(a) * s, colors[i % colors.length]);
    }
    loop();
  }

  function rain(ms = 2600, colors = PAL) {
    const end = performance.now() + ms;
    const tick = () => {
      for (let i = 0; i < 7; i++) {
        spawn(Math.random() * innerWidth, -20, (Math.random() - 0.5) * 3, 2 + Math.random() * 4,
          colors[(Math.random() * colors.length) | 0], 420);
      }
      if (performance.now() < end) setTimeout(tick, 32);
    };
    tick();
    // to sidekanoner
    burst(0, innerHeight * 0.7, { count: 70, colors, power: 1.3 });
    burst(innerWidth, innerHeight * 0.7, { count: 70, colors, power: 1.3 });
    loop();
  }

  function star(c, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath();
    c.fill();
  }

  function loop() {
    if (raf) return;
    const step = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter(p => p.life < p.max && p.y < innerHeight + 40);
      for (const p of parts) {
        p.life++;
        p.vy = Math.min(p.vy + 0.25, 7);
        p.vx *= 0.985;
        p.x += p.vx + Math.sin((p.life + p.wob) / 9) * 0.7;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.globalAlpha = Math.max(0, Math.min(1, (p.max - p.life) / 30));
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.shape === 'c') { ctx.beginPath(); ctx.arc(0, 0, p.h / 1.4, 0, 7); ctx.fill(); }
        else if (p.shape === 's') star(ctx, p.w * 0.8);
        else { ctx.scale(1, Math.cos(p.life / 5)); ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (parts.length) raf = requestAnimationFrame(step);
      else { raf = null; ctx.clearRect(0, 0, innerWidth, innerHeight); }
    };
    raf = requestAnimationFrame(step);
  }

  /* ---------- Lyd ---------- */
  let ac = null;
  let enabled = true;
  const audio = () => ac || (ac = new (window.AudioContext || window.webkitAudioContext)());

  function tone(freq, t0, dur, type = 'sine', vol = 0.2) {
    const a = audio();
    const o = a.createOscillator();
    const g = a.createGain();
    const t = a.currentTime + t0;
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function sound(name) {
    if (!enabled) return;
    try {
      const a = audio();
      if (a.state === 'suspended') a.resume();
      switch (name) {
        case 'ding':
          tone(1046.5, 0, 0.25, 'sine', 0.22);
          tone(1568, 0.09, 0.45, 'sine', 0.2);
          tone(2093, 0.18, 0.5, 'triangle', 0.07);
          break;
        case 'fanfare': {
          const n = [523.25, 659.25, 783.99, 1046.5];
          n.forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.2));
          n.forEach(f => tone(f, 0.55, 1.3, 'triangle', 0.1));
          tone(1318.5, 0.55, 1.3, 'sine', 0.09);
          break;
        }
        case 'level':
          for (let i = 0; i < 9; i++) tone(440 * Math.pow(2, i / 4), i * 0.06, 0.25, 'square', 0.05);
          tone(1760, 0.55, 0.9, 'sine', 0.14);
          break;
        case 'undo':
          tone(520, 0, 0.12, 'sine', 0.12);
          tone(360, 0.09, 0.2, 'sine', 0.12);
          break;
        case 'error':
          tone(220, 0, 0.18, 'square', 0.06);
          tone(180, 0.12, 0.25, 'square', 0.06);
          break;
        default:
          tone(700, 0, 0.06, 'sine', 0.07);
      }
    } catch (e) { /* lyd er ikke kritisk */ }
  }

  return { burst, rain, sound, setSound: v => { enabled = !!v; } };
})();
