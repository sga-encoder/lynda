/* =====================================================================
   DEFENSA ALGEBRAICA · 3) Mundo 2D (simulación + dibujo en canvas)
   - Entidades con propiedades (terreno, armadura, vuela…).
   - UNA sola clase Arma: su comportamiento sale de las propiedades del
     bonificador (origen, objetivo, alcance, daño, movimiento, prioridad, efecto).
   - Object Pool para proyectiles y partículas.
   - WaveDirector decide qué y cuándo aparece según la oleada.
   - Renderer solo dibuja (Single Responsibility).
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
  constructor(vidaMax){ this.vidaMax = vidaMax; this.vida = vidaMax; this.cd = 0; this.cds = {}; }
  get x(){ return MUNDO.base.x; } get derecha(){ return MUNDO.base.x + MUNDO.base.w; }
  get cx(){ return MUNDO.base.x + MUNDO.base.w / 2; } get cy(){ return MUNDO.suelo - 30; }
  dañar(n){ this.vida = Math.max(0, this.vida - n); }
}
/** Enemigo genérico: sus propiedades definen cómo se mueve y cómo se defiende. */
class Enemigo {
  constructor(props){ Object.assign(this, {congelado:0, fase:Math.random() * 6, vidaMax:props.vida}, props); }
  get cy(){ return this.vuela ? this.y : this.y - 8; }
}
const ENEMIGOS = {
  explorador:(x, cfg) => new Enemigo({tipo:'explorador', x, y:-10, vida:3 * cfg.vida, vel:11 * cfg.velocidad, estado:'cae', dps:1.4, xp:4}),
  blindado:  (x, cfg) => new Enemigo({tipo:'blindado', x, y:-10, vida:6 * cfg.vida, vel:8 * cfg.velocidad, estado:'cae', dps:2.2, armadura:0.5, xp:8}),
  nave:      (x, cfg) => new Enemigo({tipo:'nave', vuela:true, x:MUNDO.W + 20, y:x, vida:7 * cfg.vida, vel:16 * cfg.velocidad, soltar:2.5, xp:12}),
  dron:      (x, cfg) => new Enemigo({tipo:'dron', vuela:true, kamikaze:true, x:MUNDO.W + 10, y:x, vida:2 * cfg.vida, vel:34 * cfg.velocidad, dano:8, xp:6}),
};
class Soldado {
  constructor(i, vida){ Object.assign(this, {i, x:MUNDO.base.x + MUNDO.base.w + 10 + i * 10, vida, vidaMax:vida, cds:{}}); }
  get cy(){ return MUNDO.suelo - 9; }
}

/* ---------- Arma única guiada por propiedades ---------- */
class Arma {
  constructor(bonus){ this.bonus = bonus; this.id = bonus.id + Math.random(); }
  get p(){ return this.bonus.props; }
  get s(){ return this.bonus.stats; }
  update(dt, m){
    const origenes = this.p.origen === 'soldados' ? m.soldados : [m.base];
    for (const o of origenes){
      o.cds[this.id] = (o.cds[this.id] ?? Math.random() * 0.4) - dt;
      if (o.cds[this.id] > 0) continue;
      const desde = {x:o === m.base ? m.base.cx : o.x + 4, y:o === m.base ? m.base.cy - 14 : o.cy - 2};
      const primero = m.elegir({alcance:this.p.alcance, prioridad:this.p.prioridad, desde});
      if (!primero){ o.cds[this.id] = 0.2; continue; }
      if (!m.energia.gastar(this.s.costo)){ o.cds[this.id] = 0.35; m.sinEnergia = true; continue; }
      o.cds[this.id] = this.s.cd;
      const golpe = {dmg:this.s.dmg, dano:this.p.dano, efecto:this.p.efecto, alcance:this.p.alcance, area:this.p.objetivo === 'area' ? this.s.area : 0};
      if (this.p.movimiento === 'rayo'){
        const objs = this.p.objetivo === 'cadena' ? m.cadena(primero, this.s.saltos ?? 3, this.p.alcance) : [primero];
        m.rayo(desde, objs, this.bonus.id === 'tesla' ? '#93c5fd' : this.bonus.id === 'foton' ? '#a5f3fc' : '#f87171');
        objs.forEach(e => m.golpear(e, golpe));
      } else {
        m.disparar({x:desde.x, y:desde.y, obj:primero, golpe, guiado:this.p.movimiento === 'guiado', parabola:this.p.movimiento === 'parabola',
          vel:this.s.vel ?? (this.p.movimiento === 'bala' ? 240 : this.p.movimiento === 'parabola' ? 110 : 130),
          color:{fisico:'#fde047', explosivo:this.p.efecto === 'congelar' ? '#7dd3fc' : '#fb923c', energia:'#c4b5fd'}[this.p.dano], r:this.p.objetivo === 'area' ? 2.2 : 1.3});
      }
    }
  }
}

/* ---------- Director de oleadas ---------- */
class WaveDirector {
  constructor(cfg, rng){ this.cfg = cfg; this.rng = rng; this.t = 1.2; this.problemasResueltos = 0; this.generados = 0; }
  get generando(){ return this.problemasResueltos < this.cfg.problemas || this.generados < this.cfg.minimo; }
  update(dt, m){
    if (!this.generando || (this.t -= dt) > 0) return;
    this.t = this.cfg.intervalo * (0.75 + this.rng.next() * 0.5);
    if (m.enemigos.length >= 9) return;                              // límite en pantalla
    this.generados++;
    const r = this.rng.next(), c = this.cfg;
    const voladores = m.enemigos.filter(e => e.vuela).length;
    if (r < c.probNave && voladores < 2) m.enemigos.push(ENEMIGOS.nave(26 + this.rng.int(0, 30), c));
    else if (r < c.probNave + c.probDron && voladores < 3) m.enemigos.push(ENEMIGOS.dron(30 + this.rng.int(0, 50), c));
    else if (this.rng.next() < c.probBlindado) m.enemigos.push(ENEMIGOS.blindado(this.rng.int(200, MUNDO.W - 12), c));
    else m.enemigos.push(ENEMIGOS.explorador(this.rng.int(200, MUNDO.W - 12), c));
  }
  terminada(m){ return !this.generando && !m.enemigos.length; }
}

/* ---------- Mundo ---------- */
class World {
  enemigos = []; soldados = []; balas = []; particulas = []; rayos = []; textos = [];
  #balas = new Pool(() => ({})); #parts = new Pool(() => ({}));
  constructor({bus, loadout, energia, base, extraSoldados = 0}){
    Object.assign(this, {bus, loadout, energia, base, extraSoldados});
    this.reclutarT = 1; this.armas = []; this.sincronizarArmas();
  }
  get aliens(){ return this.enemigos.filter(e => !e.vuela); }
  get naves(){ return this.enemigos.filter(e => e.vuela); }
  sincronizarArmas(){ this.armas = this.loadout.armas.map(b => new Arma(b)); }
  get capacidad(){ return 2 + this.extraSoldados + this.loadout.efecto('soldados', 0); }

  update(dt, director){
    this.sinEnergia = false;
    director.update(dt, this);
    const L = this.loadout, lento = L.efecto('lentitud', 1);
    // Base: regeneración y recluta soldados cuando hay espacio
    this.base.vida = Math.min(this.base.vidaMax, this.base.vida + L.efecto('regen', 0) * dt);
    if (this.soldados.length < this.capacidad && (this.reclutarT -= dt) <= 0){
      this.reclutarT = 5 * L.efecto('reclutar', 1);
      const libre = [...Array(this.capacidad).keys()].find(i => !this.soldados.some(s => s.i === i));
      this.soldados.push(new Soldado(libre, 6 + L.efecto('vidaSoldado', 0))); this.texto(this.base.derecha + 8, MUNDO.suelo - 24, '+🪖', '#bbf7d0');
    }
    const curar = L.efecto('curar', 0);
    if (curar) this.soldados.forEach(s => s.vida = Math.min(s.vidaMax, s.vida + curar * dt));
    // La base dispara sola (gratis, débil) solo si no hay soldados
    if (!this.soldados.length && (this.base.cd -= dt) <= 0){
      const o = this.elegir({alcance:'ambos', prioridad:'cercano', desde:{x:this.base.cx, y:this.base.cy}});
      if (o){ this.base.cd = 1.3; this.disparar({x:this.base.cx, y:this.base.cy - 14, obj:o, golpe:{dmg:1, dano:'fisico'}, vel:200, color:'#e5e7eb', r:1.4}); }
    }
    this.armas.forEach(a => a.update(dt, this));
    // Enemigos
    const frente = this.soldados.reduce((mx, s) => Math.max(mx, s.x), -Infinity);
    for (const e of this.enemigos){
      e.fase += dt * 8;
      const vel = e.vel * lento * (e.congelado > 0 ? 0.45 : 1); e.congelado = Math.max(0, e.congelado - dt);
      if (e.vuela){
        if (e.kamikaze){                                                // dron: se lanza contra la base
          const dx = this.base.cx - e.x, dy = this.base.cy - e.y, d = Math.hypot(dx, dy);
          if (d < 10){ this.base.dañar(e.dano); this.bus.emit('base-dañada'); this.explosion(e.x, e.y, '#f9a8d4', 14); e.vida = 0; e.sinXP = true; }
          else { e.x += dx / d * vel * dt; e.y += dy / d * vel * dt * 0.6; }
        } else {                                                        // nave: cruza y suelta exploradores
          e.x -= vel * dt;
          if (e.x > 150 && e.x < MUNDO.W - 10 && (e.soltar -= dt) <= 0){
            e.soltar = 4; const al = ENEMIGOS.explorador(e.x, {vida:e.vidaMax / 7, velocidad:e.vel / 16}); al.y = e.y + 6; this.enemigos.push(al);
          }
          if (e.x < -30) e.x = MUNDO.W + 30;
        }
        continue;
      }
      if (e.estado === 'cae'){ e.y += 45 * dt; if (e.y >= MUNDO.suelo){ e.y = MUNDO.suelo; e.estado = 'camina'; this.polvo(e.x, MUNDO.suelo); } continue; }
      const limite = this.soldados.length ? frente + 7 : this.base.derecha + 2;
      if (e.x > limite){ e.x -= vel * dt; continue; }
      if (this.soldados.length){
        const s = this.soldados.find(s => s.x === frente); s.vida -= e.dps * dt;
        if (s.vida <= 0){ this.soldados.splice(this.soldados.indexOf(s), 1); this.explosion(s.x, s.cy, '#fca5a5', 8); }
      } else { this.base.dañar(e.dps * 2 * dt); this.bus.emit('base-dañada'); }
    }
    // Proyectiles
    for (const b of this.balas){
      const o = b.obj, vivo = o.vida > 0;
      if (b.guiado && vivo){ b.tx = o.x; b.ty = o.cy; }
      if (b.parabola){
        b.u = Math.min(1, b.u + dt * b.vel / b.dist);
        b.x = b.x0 + (b.tx - b.x0) * b.u; b.y = b.y0 + (b.ty - b.y0) * b.u - 55 * Math.sin(Math.PI * b.u);
        if (b.u >= 1) this.impacto(b, vivo);
        continue;
      }
      if (!b.guiado && vivo){ b.tx = o.x; b.ty = o.cy; }
      const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy), paso = b.vel * dt;
      if (d <= paso + 3) this.impacto(b, vivo);
      else { b.x += dx / d * paso; b.y += dy / d * paso; }
    }
    this.balas = this.balas.filter(b => b.muerta ? (this.#balas.soltar(b), false) : true);
    // Efectos
    for (const p of this.particulas){ p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; p.t -= dt; }
    this.particulas = this.particulas.filter(p => p.t > 0 ? true : (this.#parts.soltar(p), false));
    this.rayos = this.rayos.filter(r => (r.t -= dt) > 0);
    this.textos = this.textos.filter(t => (t.y -= 18 * dt, (t.t -= dt) > 0));
    // Muertes
    for (const e of this.enemigos.filter(e => e.vida <= 0)){
      this.enemigos.splice(this.enemigos.indexOf(e), 1);
      this.explosion(e.x, e.cy, e.tipo === 'nave' ? '#c4b5fd' : e.tipo === 'dron' ? '#f9a8d4' : e.tipo === 'blindado' ? '#cbd5e1' : '#86efac', e.tipo === 'nave' ? 22 : 12);
      if (!e.sinXP) this.bus.emit('enemigo-muerto', {tipo:e.tipo, xp:e.xp});
    }
    if (this.base.vida <= 0) this.bus.emit('base-destruida');
  }

  /* ---- Consultas y acciones usadas por las armas ---- */
  visibles(alcance){ return this.enemigos.filter(e => (e.vuela ? alcance !== 'tierra' && e.x < MUNDO.W - 4 : alcance !== 'aire' && e.y > 0)); }
  elegir({alcance, prioridad, desde}){
    const c = this.visibles(alcance); if (!c.length) return null;
    if (prioridad === 'fuerte') return c.reduce((a, b) => b.vida > a.vida ? b : a);
    if (prioridad === 'aire'){ const v = c.filter(e => e.vuela); if (v.length) return v[0]; }
    return c.reduce((a, b) => Math.hypot(b.x - desde.x, b.cy - desde.y) < Math.hypot(a.x - desde.x, a.cy - desde.y) ? b : a);
  }
  cadena(primero, saltos, alcance){
    const out = [primero];
    while (out.length < saltos){
      const u = out[out.length - 1], resto = this.visibles(alcance).filter(e => !out.includes(e) && Math.hypot(e.x - u.x, e.cy - u.cy) < 70);
      if (!resto.length) break;
      out.push(resto.reduce((a, b) => Math.hypot(b.x - u.x, b.cy - u.cy) < Math.hypot(a.x - u.x, a.cy - u.cy) ? b : a));
    }
    return out;
  }
  golpear(e, {dmg, dano, efecto}){
    let d = dmg;
    if (e.armadura && dano === 'fisico'){
      const perf = Math.min(1, this.loadout.efecto('perforacion', 0) + (efecto === 'perforar' ? 0.5 : 0));
      d *= 1 - e.armadura * (1 - perf);
    }
    if (efecto === 'congelar') e.congelado = 2.5;
    e.vida -= d; this.texto(e.x, e.cy - 10, `-${Math.round(d * 10) / 10}`, e.armadura && dano === 'fisico' ? '#cbd5e1' : '#fecaca', 0.5);
  }
  impacto(b, vivo){
    b.muerta = true;
    if (b.golpe.area){
      this.explosion(b.tx, b.ty, b.golpe.efecto === 'congelar' ? '#bae6fd' : '#fdba74', 14);
      for (const e of [...this.enemigos]) if (Math.hypot(e.x - b.tx, e.cy - b.ty) <= b.golpe.area && (!e.vuela || b.golpe.alcance !== 'tierra')) this.golpear(e, b.golpe);
    } else if (vivo) this.golpear(b.obj, b.golpe);
  }
  disparar(o){
    const b = this.#balas.tomar({muerta:false, guiado:false, parabola:false, tx:o.obj.x, ty:o.obj.cy, ...o});
    if (b.parabola){ b.x0 = b.x; b.y0 = b.y; b.u = 0; b.dist = Math.max(40, Math.hypot(b.tx - b.x, b.ty - b.y)); }
    this.balas.push(b);
  }
  rayo(desde, objs, color){ this.rayos.push({puntos:[desde, ...objs.map(e => ({x:e.x, y:e.cy}))], t:0.2, color}); }
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
    m.enemigos.forEach(e => e.tipo === 'nave' ? this.nave(c, e, t) : e.tipo === 'dron' ? this.dron(c, e, t) : this.alien(c, e));
    for (const b of m.balas){ c.fillStyle = b.color; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 6.28); c.fill(); }
    for (const r of m.rayos){
      c.strokeStyle = r.color; c.lineWidth = 2.2; c.globalAlpha = Math.min(1, r.t * 8); c.beginPath();
      r.puntos.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke();
    }
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
  soldado(c, s){
    const y = MUNDO.suelo;
    c.fillStyle = '#15803d'; c.fillRect(s.x - 2, y - 11, 5, 7);
    c.fillStyle = '#fcd34d'; c.fillRect(s.x - 1.5, y - 15, 4, 4);
    c.fillStyle = '#166534'; c.fillRect(s.x - 2.5, y - 16.5, 6, 2);
    c.fillStyle = '#1f2937'; c.fillRect(s.x + 2, y - 10, 6, 1.6);
    c.fillStyle = '#14532d'; c.fillRect(s.x - 2, y - 4, 2, 4); c.fillRect(s.x + 1, y - 4, 2, 4);
    if (s.vida < s.vidaMax) this.barra(c, s.x - 4, y - 21, 9, s.vida / s.vidaMax, '#4ade80');
  }
  alien(c, a){
    if (a.estado === 'cae'){ c.strokeStyle = '#e5e7eb88'; c.lineWidth = 1; c.beginPath(); c.moveTo(a.x - 6, a.y - 22); c.lineTo(a.x, a.y - 10); c.lineTo(a.x + 6, a.y - 22); c.stroke(); c.fillStyle = '#f8fafc55'; c.beginPath(); c.arc(a.x, a.y - 22, 8, Math.PI, 0); c.fill(); }
    const y = a.y, paso = Math.sin(a.fase) * 1.5, color = a.congelado > 0 ? '#7dd3fc' : '#4ade80';
    c.fillStyle = color; c.beginPath(); c.ellipse(a.x, y - 8, 6, 7, 0, 0, 6.28); c.fill();
    c.fillStyle = '#052e16'; c.beginPath(); c.arc(a.x - 2.3, y - 10, 1.6, 0, 6.28); c.arc(a.x + 2.3, y - 10, 1.6, 0, 6.28); c.fill();
    c.strokeStyle = color; c.lineWidth = 1.2; c.beginPath(); c.moveTo(a.x - 3, y - 2); c.lineTo(a.x - 3 + paso, y); c.moveTo(a.x + 3, y - 2); c.lineTo(a.x + 3 - paso, y);
    c.moveTo(a.x - 2, y - 15); c.lineTo(a.x - 4, y - 19); c.moveTo(a.x + 2, y - 15); c.lineTo(a.x + 4, y - 19); c.stroke();
    if (a.armadura){ c.fillStyle = '#94a3b8'; c.fillRect(a.x - 6, y - 9, 12, 4); c.fillRect(a.x - 5, y - 15, 10, 2.5); }
    if (a.vida < a.vidaMax) this.barra(c, a.x - 7, y - 23, 14, a.vida / a.vidaMax, '#f87171');
  }
  nave(c, n, t){
    c.fillStyle = n.congelado > 0 ? '#7dd3fc' : '#a78bfa'; c.beginPath(); c.ellipse(n.x, n.y, 15, 4.5, 0, 0, 6.28); c.fill();
    c.fillStyle = '#ddd6fe'; c.beginPath(); c.ellipse(n.x, n.y - 3.5, 6, 4.5, 0, Math.PI, 0); c.fill();
    for (let i = -1; i <= 1; i++){ c.fillStyle = Math.sin(t * 10 + i) > 0 ? '#fde047' : '#78350f'; c.fillRect(n.x + i * 7 - 1, n.y, 2, 2); }
    if (n.vida < n.vidaMax) this.barra(c, n.x - 12, n.y - 13, 24, n.vida / n.vidaMax, '#f87171');
  }
  dron(c, d, t){
    c.fillStyle = d.congelado > 0 ? '#7dd3fc' : '#f472b6'; c.fillRect(d.x - 4, d.y - 2, 8, 4);
    c.strokeStyle = '#fbcfe8'; c.lineWidth = 1; c.beginPath();
    const giro = Math.sin(t * 40) * 1.5;
    for (const dx of [-7, 7]){ c.moveTo(d.x + dx - 3 + giro, d.y - 4); c.lineTo(d.x + dx + 3 - giro, d.y - 4); }
    c.stroke(); c.fillStyle = '#fde047'; c.fillRect(d.x - 1, d.y - 1, 2, 2);
  }
}
