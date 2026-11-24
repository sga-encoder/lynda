/* =====================================================================
   DEFENSA ALGEBRAICA · 3) Mundo 2D (simulación + dibujo en canvas)
   - Entidades simples (Alien, Nave, Soldado, Proyectil, Partícula).
   - Object Pool para proyectiles y partículas (sin basura en el celular).
   - Armas = Strategy creadas por una fábrica a partir del bonificador.
   - WaveDirector decide cuándo aparecen enemigos según la oleada.
   - Renderer solo dibuja (no cambia el estado): Single Responsibility.
   ===================================================================== */
const MUNDO = {W:360, H:200, suelo:172, base:{x:8, w:46}};

class Pool {
  #libres = []; #crear;
  constructor(crear){ this.#crear = crear; }
  tomar(props){ return Object.assign(this.#libres.pop() ?? this.#crear(), props); }
  soltar(o){ this.#libres.push(o); }
}

class Energia {
  constructor(valor = 0, max = 100){ this.valor = valor; this.max = max; }
  agregar(n){ this.valor = Math.min(this.max, this.valor + n); }
  gastar(c){ if (this.valor < c) return false; this.valor -= c; return true; }
}

class Base {
  constructor(vidaMax){ this.vidaMax = vidaMax; this.vida = vidaMax; this.cd = 0; this.regen = 0; }
  get x(){ return MUNDO.base.x; } get derecha(){ return MUNDO.base.x + MUNDO.base.w; }
  get cx(){ return MUNDO.base.x + MUNDO.base.w / 2; } get cy(){ return MUNDO.suelo - 30; }
  dañar(n){ this.vida = Math.max(0, this.vida - n); }
}
class Alien {
  constructor(x, vida, vel){ Object.assign(this, {x, y:-10, vida, vidaMax:vida, vel, estado:'cae', tipo:'alien', fase:Math.random() * 6}); }
  get cy(){ return this.y - 8; }
}
class Nave {
  constructor(y, vida, vel){ Object.assign(this, {x:MUNDO.W + 20, y, vida, vidaMax:vida, vel, tipo:'nave', soltar:2.5}); }
  get cy(){ return this.y; }
}
class Soldado {
  constructor(i){ Object.assign(this, {i, x:MUNDO.base.x + MUNDO.base.w + 10 + i * 10, vida:6, cd:Math.random() * 0.5}); }
  get cy(){ return MUNDO.suelo - 9; }
}

/* ---------- Armas (Strategy) ---------- */
class Arma {
  constructor(bonus){ this.bonus = bonus; this.t = 0; }
  get s(){ return this.bonus.stats; }
  update(dt, mundo){}
}
class RifleArma extends Arma {
  update(dt, m){
    for (const sol of m.soldados){
      sol.cd -= dt; if (sol.cd > 0) continue;
      const obj = m.masCercano(sol.x, sol.cy, 220); if (!obj) continue;
      if (!m.energia.gastar(this.s.costo)){ sol.cd = 0.3; m.sinEnergia = true; continue; }
      sol.cd = this.s.cd;
      m.disparar({x:sol.x + 4, y:sol.cy - 2, obj, dmg:this.s.dmg, vel:240, color:'#fde047', r:1.2});
    }
  }
}
class LaserArma extends Arma {
  update(dt, m){
    if ((this.t -= dt) > 0) return;
    const objs = m.masFuertes(this.s.objetivos ?? 1); if (!objs.length) return;
    if (!m.energia.gastar(this.s.costo)){ this.t = 0.4; m.sinEnergia = true; return; }
    this.t = this.s.cd;
    for (const o of objs){ m.rayo(m.base.cx, m.base.cy - 14, o, this.bonus.id === 'foton' ? '#a5f3fc' : '#f87171'); m.dañar(o, this.s.dmg); }
  }
}
class MisilArma extends Arma {
  update(dt, m){
    if ((this.t -= dt) > 0) return;
    const obj = m.naves[0] ?? m.masLejano(); if (!obj) return;
    if (!m.energia.gastar(this.s.costo)){ this.t = 0.4; m.sinEnergia = true; return; }
    this.t = this.s.cd;
    m.disparar({x:m.base.cx, y:m.base.cy - 16, obj, dmg:this.s.dmg, vel:130, color:'#fb923c', r:2.2, area:this.s.area, guiado:true});
  }
}
const FABRICA_ARMAS = {rifle:RifleArma, laser:LaserArma, misil:MisilArma, foton:LaserArma};
const crearArma = bonus => new (FABRICA_ARMAS[bonus.id] ?? Arma)(bonus);

/* ---------- Director de oleadas ---------- */
class WaveDirector {
  constructor(cfg, rng){ this.cfg = cfg; this.rng = rng; this.t = 1.2; this.problemasResueltos = 0; this.generados = 0; }
  get generando(){ return this.problemasResueltos < this.cfg.problemas || this.generados < this.cfg.minimo; }
  update(dt, m){
    if (!this.generando) return;
    if ((this.t -= dt) > 0) return;
    this.t = this.cfg.intervalo * (0.75 + this.rng.next() * 0.5);
    if (m.aliens.length + m.naves.length >= 9) return;              // límite en pantalla
    this.generados++;
    if (this.rng.next() < this.cfg.probNave && m.naves.length < 2) m.naves.push(new Nave(26 + this.rng.int(0, 30), 7 * this.cfg.vida, 16 * this.cfg.velocidad));
    else m.aliens.push(new Alien(this.rng.int(200, MUNDO.W - 12), 3 * this.cfg.vida, 11 * this.cfg.velocidad));
  }
  terminada(m){ return !this.generando && !m.aliens.length && !m.naves.length; }
}

/* ---------- Mundo ---------- */
class World {
  aliens = []; naves = []; soldados = []; balas = []; particulas = []; rayos = []; textos = [];
  #balas = new Pool(() => ({})); #parts = new Pool(() => ({}));
  constructor({bus, loadout, energia, base, extraSoldados = 0}){
    Object.assign(this, {bus, loadout, energia, base, extraSoldados});
    this.reclutarT = 1; this.armas = []; this.sincronizarArmas();
  }
  sincronizarArmas(){ this.armas = this.loadout.armas.map(crearArma); }
  get capacidad(){ return 2 + this.extraSoldados + this.loadout.efecto('soldados', 0); }

  update(dt, director){
    this.sinEnergia = false;
    director.update(dt, this);
    const lento = this.loadout.efecto('lentitud', 1);
    // Base: regeneración y recluta soldados cuando hay espacio
    this.base.vida = Math.min(this.base.vidaMax, this.base.vida + this.loadout.efecto('regen', 0) * dt);
    if (this.soldados.length < this.capacidad && (this.reclutarT -= dt) <= 0){
      this.reclutarT = 5 * this.loadout.efecto('reclutar', 1);
      const libres = [...Array(this.capacidad).keys()].find(i => !this.soldados.some(s => s.i === i));
      this.soldados.push(new Soldado(libres)); this.texto(this.base.derecha + 8, MUNDO.suelo - 24, '+🪖', '#bbf7d0');
    }
    // La base dispara sola (gratis, débil) solo si no hay soldados
    if (!this.soldados.length && (this.base.cd -= dt) <= 0){
      const o = this.masCercano(this.base.cx, this.base.cy, 260);
      if (o){ this.base.cd = 1.3; this.disparar({x:this.base.cx, y:this.base.cy - 14, obj:o, dmg:1, vel:200, color:'#e5e7eb', r:1.4}); }
    }
    this.armas.forEach(a => a.update(dt, this));
    // Aliens: caen, caminan y atacan
    const frente = this.soldados.reduce((mx, s) => Math.max(mx, s.x), -Infinity);
    for (const a of this.aliens){
      a.fase += dt * 8;
      if (a.estado === 'cae'){ a.y += 45 * dt; if (a.y >= MUNDO.suelo){ a.y = MUNDO.suelo; a.estado = 'camina'; this.polvo(a.x, MUNDO.suelo); } continue; }
      const limite = this.soldados.length ? frente + 7 : this.base.derecha + 2;
      if (a.x > limite){ a.x -= a.vel * lento * dt; continue; }
      if (this.soldados.length){                                       // pelea cuerpo a cuerpo con el soldado del frente
        const s = this.soldados.find(s => s.x === frente); s.vida -= 1.4 * dt;
        if (s.vida <= 0){ this.soldados.splice(this.soldados.indexOf(s), 1); this.explosion(s.x, s.cy, '#fca5a5', 8); }
      } else { this.base.dañar(3 * dt); this.bus.emit('base-dañada'); }
    }
    // Naves: cruzan y sueltan aliens
    for (const n of this.naves){
      n.x -= n.vel * lento * dt;
      if (n.x > 150 && n.x < MUNDO.W - 10 && (n.soltar -= dt) <= 0){          // sueltan aliens lejos de la base
        n.soltar = 4; const al = new Alien(n.x, 3 * n.vidaMax / 7, 11 * n.vel / 16); al.y = n.y + 6; this.aliens.push(al);
      }
      if (n.x < -30) n.x = MUNDO.W + 30;
    }
    // Proyectiles
    for (const b of this.balas){
      const o = b.obj, vivo = o.vida > 0;
      const tx = vivo ? o.x : b.tx, ty = vivo ? o.cy : b.ty; b.tx = tx; b.ty = ty;
      const dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy), paso = b.vel * dt;
      if (d <= paso + 3){
        b.muerta = true;
        if (b.area){ this.explosion(tx, ty, '#fdba74', 14); [...this.aliens, ...this.naves].forEach(e => { if (Math.hypot(e.x - tx, e.cy - ty) <= b.area) this.dañar(e, b.dmg); }); }
        else if (vivo) this.dañar(o, b.dmg);
      } else { b.x += dx / d * paso; b.y += dy / d * paso; }
    }
    this.balas = this.balas.filter(b => b.muerta ? (this.#balas.soltar(b), false) : true);
    // Efectos
    for (const p of this.particulas){ p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; p.t -= dt; }
    this.particulas = this.particulas.filter(p => p.t > 0 ? true : (this.#parts.soltar(p), false));
    this.rayos = this.rayos.filter(r => (r.t -= dt) > 0);
    this.textos = this.textos.filter(t => (t.y -= 18 * dt, (t.t -= dt) > 0));
    // Muertes
    for (const lista of [this.aliens, this.naves]) for (const e of lista.filter(e => e.vida <= 0)){
      lista.splice(lista.indexOf(e), 1); this.explosion(e.x, e.cy, e.tipo === 'nave' ? '#c4b5fd' : '#86efac', e.tipo === 'nave' ? 22 : 12);
      this.bus.emit('enemigo-muerto', {tipo:e.tipo, xp:e.tipo === 'nave' ? 12 : 4});
    }
    if (this.base.vida <= 0) this.bus.emit('base-destruida');
  }

  /* ---- Consultas y acciones usadas por las armas ---- */
  enemigos(){ return [...this.aliens.filter(a => a.y > 0), ...this.naves.filter(n => n.x < MUNDO.W - 4)]; }
  masCercano(x, y, rango){ let best = null, bd = rango; for (const e of this.enemigos()){ const d = Math.hypot(e.x - x, e.cy - y); if (d < bd){ bd = d; best = e; } } return best; }
  masLejano(){ return this.enemigos().sort((a, b) => b.x - a.x)[0]; }
  masFuertes(n){ return this.enemigos().sort((a, b) => b.vida - a.vida).slice(0, n); }
  dañar(e, n){ e.vida -= n; this.texto(e.x, e.cy - 10, `-${n}`, '#fecaca', 0.5); }
  disparar(o){ this.balas.push(this.#balas.tomar({muerta:false, area:0, guiado:false, tx:o.obj.x, ty:o.obj.cy, ...o})); }
  rayo(x, y, o, color){ this.rayos.push({x, y, tx:o.x, ty:o.cy, t:0.18, color}); }
  explosion(x, y, color, n){ for (let i = 0; i < n; i++){ const a = Math.random() * 6.28, v = 30 + Math.random() * 60; this.particulas.push(this.#parts.tomar({x, y, vx:Math.cos(a) * v, vy:Math.sin(a) * v - 30, t:0.5 + Math.random() * 0.4, color, r:1 + Math.random() * 1.6})); } }
  polvo(x, y){ this.explosion(x, y - 1, '#a8a29e', 5); }
  texto(x, y, txt, color, t = 0.9){ this.textos.push({x, y, txt, color, t}); }
}

/* ---------- Dibujo (Canvas 2D) ---------- */
class Renderer {
  constructor(canvas){ this.cv = canvas; this.ctx = canvas.getContext('2d'); this.estrellas = Array.from({length:40}, () => [Math.random() * MUNDO.W, Math.random() * 120, Math.random()]); this.resize(); }
  resize(){
    const r = this.cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cv.width = Math.round(r.width * dpr); this.cv.height = Math.round(r.height * dpr);
    this.esc = this.cv.width / MUNDO.W;
  }
  draw(m, t){
    const c = this.ctx, {W, H, suelo} = MUNDO;
    c.setTransform(this.esc, 0, 0, this.esc, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1023'); g.addColorStop(1, '#312e81');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (const [x, y, b] of this.estrellas){ c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * b + x)); c.fillStyle = '#fff'; c.fillRect(x, y, 1, 1); }
    c.globalAlpha = 1;
    c.fillStyle = '#1c1917'; c.fillRect(0, suelo, W, H - suelo); c.fillStyle = '#44403c'; c.fillRect(0, suelo, W, 2);
    this.base(c, m.base);
    m.soldados.forEach(s => this.soldado(c, s, t));
    m.aliens.forEach(a => this.alien(c, a));
    m.naves.forEach(n => this.nave(c, n, t));
    for (const b of m.balas){ c.fillStyle = b.color; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 6.28); c.fill(); }
    for (const r of m.rayos){ c.strokeStyle = r.color; c.lineWidth = 2.2; c.globalAlpha = Math.min(1, r.t * 8); c.beginPath(); c.moveTo(r.x, r.y); c.lineTo(r.tx, r.ty); c.stroke(); }
    c.globalAlpha = 1;
    for (const p of m.particulas){ c.globalAlpha = Math.max(0, p.t * 1.6); c.fillStyle = p.color; c.fillRect(p.x, p.y, p.r, p.r); }
    c.globalAlpha = 1; c.font = 'bold 9px system-ui'; c.textAlign = 'center';
    for (const x of m.textos){ c.globalAlpha = Math.min(1, x.t * 2); c.fillStyle = x.color; c.fillText(x.txt, x.x, x.y); }
    c.globalAlpha = 1;
  }
  barra(c, x, y, w, v, color){ c.fillStyle = '#00000088'; c.fillRect(x, y, w, 2.5); c.fillStyle = color; c.fillRect(x, y, w * Math.max(0, v), 2.5); }
  base(c, b){
    const {suelo} = MUNDO, x = b.x, w = MUNDO.base.w;
    c.fillStyle = '#475569'; c.fillRect(x, suelo - 26, w, 26);
    c.fillStyle = '#64748b'; c.beginPath(); c.arc(x + w / 2, suelo - 26, 15, Math.PI, 0); c.fill();
    c.fillStyle = '#94a3b8'; c.fillRect(x + w / 2 - 2, suelo - 48, 4, 10);
    c.fillStyle = '#0ea5e9'; for (let i = 0; i < 3; i++) c.fillRect(x + 6 + i * 13, suelo - 18, 7, 5);
    this.barra(c, x, suelo - 54, w, b.vida / b.vidaMax, b.vida / b.vidaMax > 0.35 ? '#22c55e' : '#ef4444');
  }
  soldado(c, s, t){
    const y = MUNDO.suelo;
    c.fillStyle = '#15803d'; c.fillRect(s.x - 2, y - 11, 5, 7);
    c.fillStyle = '#fcd34d'; c.fillRect(s.x - 1.5, y - 15, 4, 4);
    c.fillStyle = '#166534'; c.fillRect(s.x - 2.5, y - 16.5, 6, 2);
    c.fillStyle = '#1f2937'; c.fillRect(s.x + 2, y - 10, 6, 1.6);
    c.fillStyle = '#14532d'; c.fillRect(s.x - 2, y - 4, 2, 4); c.fillRect(s.x + 1, y - 4, 2, 4);
  }
  alien(c, a){
    if (a.estado === 'cae'){ c.strokeStyle = '#e5e7eb88'; c.beginPath(); c.moveTo(a.x - 6, a.y - 22); c.lineTo(a.x, a.y - 10); c.lineTo(a.x + 6, a.y - 22); c.stroke(); c.fillStyle = '#f8fafc55'; c.beginPath(); c.arc(a.x, a.y - 22, 8, Math.PI, 0); c.fill(); }
    const y = a.y, paso = Math.sin(a.fase) * 1.5;
    c.fillStyle = '#4ade80'; c.beginPath(); c.ellipse(a.x, y - 8, 6, 7, 0, 0, 6.28); c.fill();
    c.fillStyle = '#052e16'; c.beginPath(); c.arc(a.x - 2.3, y - 10, 1.6, 0, 6.28); c.arc(a.x + 2.3, y - 10, 1.6, 0, 6.28); c.fill();
    c.strokeStyle = '#4ade80'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(a.x - 3, y - 2); c.lineTo(a.x - 3 + paso, y); c.moveTo(a.x + 3, y - 2); c.lineTo(a.x + 3 - paso, y);
    c.moveTo(a.x - 2, y - 15); c.lineTo(a.x - 4, y - 19); c.moveTo(a.x + 2, y - 15); c.lineTo(a.x + 4, y - 19); c.stroke();
    if (a.vida < a.vidaMax) this.barra(c, a.x - 7, y - 23, 14, a.vida / a.vidaMax, '#f87171');
  }
  nave(c, n, t){
    c.fillStyle = '#a78bfa'; c.beginPath(); c.ellipse(n.x, n.y, 15, 4.5, 0, 0, 6.28); c.fill();
    c.fillStyle = '#ddd6fe'; c.beginPath(); c.ellipse(n.x, n.y - 3.5, 6, 4.5, 0, Math.PI, 0); c.fill();
    for (let i = -1; i <= 1; i++){ c.fillStyle = Math.sin(t * 10 + i) > 0 ? '#fde047' : '#78350f'; c.fillRect(n.x + i * 7 - 1, n.y, 2, 2); }
    if (n.vida < n.vidaMax) this.barra(c, n.x - 12, n.y - 13, 24, n.vida / n.vidaMax, '#f87171');
  }
}
