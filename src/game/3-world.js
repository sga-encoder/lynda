/* =====================================================================
   DEFENSA ALGEBRAICA · 3) Mundo 2D (simulación + dibujo en canvas)
   - Soldados por tipo (Fusilero, Pesado, Granadero, Médico, Ingeniero).
   - Enemigos con propiedades y ARMAS PROPIAS (ácido, bombas, láser, rocas,
     invocar…); 11 tipos + 4 jefes.
   - Clima que cambia por oleada y afecta la batalla.
   - UNA sola clase Arma (del jugador) guiada por las propiedades del bonificador.
   - Object Pool, WaveDirector y Renderer separados (SRP).
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

/* ---------- Clima (cambia por oleada) ---------- */
const CLIMAS = {
  despejado:{icon:'🌙', name:'Noche despejada', desc:'Sin efectos.'},
  lluvia:   {icon:'🌧️', name:'Lluvia', desc:'Los proyectiles van más lentos.', balas:0.75},
  niebla:   {icon:'🌫️', name:'Niebla', desc:'Las armas ven menos lejos.', rango:0.55},
  nieve:    {icon:'❄️', name:'Nevada', desc:'Todos se mueven más lento.', vel:0.8},
  tormenta: {icon:'⛈️', name:'Tormenta', desc:'Caen rayos al azar (a enemigos y soldados).', rayos:true},
  viento:   {icon:'🌬️', name:'Viento', desc:'Los voladores van más rápido.', voladores:1.35},
};

/* ---------- Soldados ---------- */
const SOLDADOS = {
  fusilero: {icon:'🔫', name:'Fusilero', vida:6, cuerpo:'#15803d', casco:'#166534', desc:'Usa las armas de pelotón (rifle).'},
  pesado:   {icon:'🛡️', name:'Pesado', vida:16, cuerpo:'#475569', casco:'#1e293b', desc:'Aguanta mucho; escopeta de corto alcance.', ataque:{dmg:2.5, cd:1.3, costo:1.5, rango:70, dano:'fisico'}},
  granadero:{icon:'💣', name:'Granadero', vida:6, cuerpo:'#b45309', casco:'#78350f', desc:'Granadas en parábola con área.', ataque:{dmg:3, cd:2.6, costo:2.5, rango:150, dano:'explosivo', area:20, parabola:true}},
  medico:   {icon:'⛑️', name:'Médico', vida:5, cuerpo:'#e5e7eb', casco:'#dc2626', desc:'Cura al soldado más herido.', apoyo:{curar:3, cd:2.5, costo:2}},
  ingeniero:{icon:'🔧', name:'Ingeniero', vida:5, cuerpo:'#ca8a04', casco:'#a16207', desc:'Repara la base.', apoyo:{reparar:4, cd:3, costo:3}},
};
/* ---------- Estrategia del pelotón ----------
   Cada tipo de soldado puede llevar una munición (tipo de daño) y cada enemigo es
   débil a un tipo de daño (×1.6) y puede resistir otro (armadura o escudo). */
const EQUIPO = {
  fisico:   {icon:'🔫', name:'Balas', desc:'Daño físico. Bueno contra escuderos y saltadores; la armadura lo frena.'},
  energia:  {icon:'🔆', name:'Plasma', desc:'Daño de energía. Atraviesa armaduras; los escudos lo frenan.', mult:0.9},
  explosivo:{icon:'💥', name:'Explosivas', desc:'Daño explosivo en un área pequeña. Ideal contra grupos y voladores pesados.', mult:0.8, area:12},
};
const DEBILIDAD = {explorador:'explosivo', blindado:'energia', saltador:'fisico', acido:'explosivo', escudero:'fisico', excavador:'explosivo',
  nave:'explosivo', dron:'energia', bombardero:'explosivo', caza:'energia', portadrones:'explosivo', coloso:'energia', reina:'explosivo', acorazado:'energia', mente:'fisico'};
const MULT_DEBIL = 1.6;
const ORDEN_RECLUTA = ['fusilero', 'pesado', 'fusilero', 'granadero', 'medico', 'fusilero', 'ingeniero', 'granadero', 'fusilero'];
class Soldado {
  constructor(i, tipo, extraVida = 0, perfil = null){
    const d = SOLDADOS[tipo], vida = (perfil?.vida ?? d.vida) + extraVida;
    Object.assign(this, {i, tipo, perfil, x:MUNDO.base.x + MUNDO.base.w + 8 + i * 7, vida, vidaMax:vida, cds:{}, apoyoT:Math.random()});
    // Con perfil (soldado concreto con su arma y blindaje) el ataque o apoyo sale de su equipo
    this._def = perfil ? {...d, ataque:perfil.ataque, apoyo:perfil.apoyo} : d;
  }
  get def(){ return this._def; }
  get cy(){ return MUNDO.suelo - 9; }
}

/* ---------- Enemigos: propiedades + armas propias ---------- */
class Enemigo {
  constructor(props){ Object.assign(this, {congelado:0, fase:Math.random() * 6, vidaMax:props.vida, armas:[], escala:1}, props); this.armas = this.armas.map(a => ({t:a.cd * (0.5 + Math.random() * 0.5), ...a})); }
  get cy(){ return this.vuela ? this.y : this.y - 8 * this.escala; }
}
const E = (tipo, props) => new Enemigo({tipo, ...props});
const jv = c => (1 + (c.vida - 1) * 0.5) * (c.jefeVida ?? 1);   // los jefes escalan la mitad que el resto (y empiezan suaves)
const ENEMIGOS = {
  // ---- Tierra ----
  explorador: (x, c) => E('explorador', {x, y:-10, estado:'cae', vida:3 * c.vida, vel:11 * c.velocidad, dps:1.4, xp:4}),
  blindado:   (x, c) => E('blindado', {x, y:-10, estado:'cae', vida:6 * c.vida, vel:8 * c.velocidad, dps:2.2, armadura:0.5, xp:8}),
  saltador:   (x, c) => E('saltador', {x, y:-10, estado:'cae', vida:3 * c.vida, vel:20 * c.velocidad, dps:1.8, salta:true, xp:6}),
  acido:      (x, c) => E('acido', {x, y:-10, estado:'cae', vida:4 * c.vida, vel:9 * c.velocidad, dps:1, xp:7, armas:[{tipo:'acido', rango:95, cd:2.2, dmg:1.5, objetivo:'soldados'}]}),
  escudero:   (x, c) => E('escudero', {x, y:-10, estado:'cae', vida:5 * c.vida, vel:9 * c.velocidad, dps:1.6, escudo:0.6, xp:7}),
  excavador:  (x, c) => E('excavador', {x, y:MUNDO.suelo, estado:'camina', bajoTierra:true, vida:5 * c.vida, vel:15 * c.velocidad, dps:2.5, xp:8}),
  // ---- Aire ----
  nave:       (y, c) => E('nave', {vuela:true, x:MUNDO.W + 20, y, vida:7 * c.vida, vel:16 * c.velocidad, soltar:2.5, xp:12}),
  dron:       (y, c) => E('dron', {vuela:true, kamikaze:true, x:MUNDO.W + 10, y, vida:2 * c.vida, vel:34 * c.velocidad, dano:8, xp:6}),
  bombardero: (y, c) => E('bombardero', {vuela:true, x:MUNDO.W + 20, y, vida:6 * c.vida, vel:14 * c.velocidad, xp:10, armas:[{tipo:'bomba', cd:2.2, dmg:3, area:16}]}),
  caza:       (y, c) => E('caza', {vuela:true, x:MUNDO.W + 15, y, vida:4 * c.vida, vel:30 * c.velocidad, flota:170, xp:9, armas:[{tipo:'laser', rango:170, cd:1.8, dmg:2, objetivo:'base'}]}),
  portadrones:(y, c) => E('portadrones', {vuela:true, x:MUNDO.W + 25, y, vida:14 * c.vida, vel:7 * c.velocidad, flota:260, xp:18, armas:[{tipo:'invocar', invoca:'dron', cd:6}]}),
  // ---- Jefes (uno al final de cada misión) ----
  coloso:     (x, c) => E('coloso', {jefe:true, name:'Coloso', x:MUNDO.W + 10, y:MUNDO.suelo, estado:'camina', vida:120 * jv(c), vel:5, dps:6, armadura:0.3, escala:2.6, xp:60,
                armas:[{tipo:'roca', rango:230, cd:4, dmg:6, objetivo:'base'}]}),
  reina:      (x, c) => E('reina', {jefe:true, name:'Reina del enjambre', x:MUNDO.W + 10, y:MUNDO.suelo, estado:'camina', vida:100 * jv(c), vel:4, dps:3, escala:2.4, para:230, xp:60,
                armas:[{tipo:'invocar', invoca:'explorador', cd:5}, {tipo:'acido', rango:120, cd:2.5, dmg:2, objetivo:'soldados'}]}),
  acorazado:  (y, c) => E('acorazado', {jefe:true, name:'Acorazado orbital', vuela:true, x:MUNDO.W + 40, y:45, vida:150 * jv(c), vel:6, flota:250, escala:2.4, xp:70,
                armas:[{tipo:'laser', rango:270, cd:2.5, dmg:4, objetivo:'base'}, {tipo:'invocar', invoca:'caza', cd:7}]}),
  mente:      (y, c) => E('mente', {jefe:true, name:'Mente maestra', vuela:true, x:MUNDO.W + 30, y:55, vida:110 * jv(c), vel:5, flota:240, escala:2.2, escudoMental:true, escudoT:0, xp:80,
                armas:[{tipo:'rayo', rango:300, cd:3, dmg:3, objetivo:'soldados'}, {tipo:'invocar', invoca:'dron', cd:8}]}),
};
const JEFES = ['coloso', 'reina', 'acorazado', 'mente'];
/** Qué enemigos aparecen según el avance (t = 0…11) y con qué peso. */
const TABLA_APARICION = [
  ['explorador', 0, 5], ['saltador', 1, 2], ['nave', 1, 1.5], ['blindado', 3, 2], ['acido', 3, 2], ['dron', 3, 1.5],
  ['escudero', 4, 2], ['bombardero', 4, 1.5], ['excavador', 5, 2], ['caza', 6, 1.5], ['portadrones', 8, 1],
];

/* ---------- Arma del jugador guiada por propiedades ---------- */
class Arma {
  constructor(bonus){ this.bonus = bonus; this.id = bonus.id + Math.random(); }
  get p(){ return this.bonus.props; }
  get s(){ return this.bonus.stats; }
  update(dt, m){
    const origenes = this.p.origen === 'soldados' ? m.soldados.filter(s => s.tipo === 'fusilero') : [m.base];
    for (const o of origenes){
      o.cds[this.id] = (o.cds[this.id] ?? Math.random() * 0.4) - dt;
      if (o.cds[this.id] > 0) continue;
      const desde = {x:o === m.base ? m.base.cx : o.x + 4, y:o === m.base ? m.base.cy - 14 : o.cy - 2};
      const primero = m.elegir({alcance:this.p.alcance, prioridad:this.p.prioridad, desde});
      if (!primero){ o.cds[this.id] = 0.2; continue; }
      if (!m.energia.gastar(this.s.costo)){ o.cds[this.id] = 0.35; m.sinEnergia = true; continue; }
      o.cds[this.id] = this.s.cd;
      const golpe = {dmg:this.s.dmg * (1 + 0.1 * m.mej('arma-' + armaBase(this.bonus.id))), dano:o !== m.base && m.peloton?.equipo?.[o.tipo] ? m.peloton.equipo[o.tipo] : this.p.dano, efecto:this.p.efecto, alcance:this.p.alcance, area:this.p.objetivo === 'area' ? this.s.area : 0};   // los fusileros usan la munición equipada
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
  constructor(cfg, rng){ this.cfg = cfg; this.rng = rng; this.t = 1.0; this.problemasResueltos = 0; this.generados = 0; this.jefeT = cfg.jefe ? 4 : null; }
  get generando(){ return this.problemasResueltos < this.cfg.problemas || this.generados < this.cfg.minimo || this.jefeT !== null; }
  update(dt, m){
    if (this.jefeT !== null && (this.jefeT -= dt) <= 0){
      m.enemigos.push(ENEMIGOS[this.cfg.jefe](0, this.cfg)); m.anuncio = `👹 ¡${ENEMIGOS[this.cfg.jefe](0, this.cfg).name}!`; m.sacudir(0.6); this.jefeT = null;
    }
    if (!(this.problemasResueltos < this.cfg.problemas || this.generados < this.cfg.minimo) || (this.t -= dt) > 0) return;
    this.t = this.cfg.intervalo * (0.7 + this.rng.next() * 0.6) * (this.generados >= this.cfg.minimo ? BALANCE.esperaExtra : 1);   // cumplido el mínimo, llegan más espaciados mientras terminas el cálculo
    if (m.enemigos.length >= 24) return;                              // límite en pantalla (batallas más llenas)
    this.generados++;
    const t = this.cfg.t, voladores = m.enemigos.filter(e => e.vuela).length;
    const AIRE = ['nave', 'dron', 'bombardero', 'caza', 'portadrones'], esAire = id => AIRE.includes(FORMA_DE[id] ?? id);
    const opciones = [...TABLA_APARICION, ...(this.cfg.extra ?? [])].filter(([id, desde]) => t >= desde && (voladores < 7 || !esAire(id)));
    let r = this.rng.next() * opciones.reduce((s, o) => s + o[2], 0), id = opciones[0][0];
    for (const [k, , w] of opciones){ if ((r -= w) <= 0){ id = k; break; } }
    const aire = esAire(id), grupo = Math.min(24 - m.enemigos.length, 1 + this.rng.int(0, Math.floor((this.cfg.q ?? t) / 2)));   // llegan en grupos (desde la 2.ª misión)
    for (let g = 0; g < grupo; g++){
      const e = ENEMIGOS[id](aire ? 24 + this.rng.int(0, 50) : this.rng.int(200, MUNDO.W - 12), this.cfg);
      if (!e.armas.length && !e.jefe && this.rng.next() < Math.min(0.65, BALANCE.disparan + 0.05 * (this.cfg.q ?? t)))   // los comunes también disparan (más a medida que avanzas)
        e.armas = [{t:1.5 + this.rng.next() * 2, tipo:'acido', rango:e.vuela ? 170 : 130, cd:2.6 + this.rng.next(), dmg:+(0.9 * Math.sqrt(this.cfg.vida)).toFixed(2), objetivo:this.rng.next() < 0.5 ? 'base' : 'soldados'}];
      e.x += g * 9; m.enemigos.push(e); if (g) this.generados++;
    }
  }
  terminada(m){ return !this.generando && !m.enemigos.length; }
}

/* ---------- Mundo ---------- */
class World {
  enemigos = []; soldados = []; balas = []; balasEnemigas = []; particulas = []; rayos = []; textos = [];
  #balas = new Pool(() => ({})); #parts = new Pool(() => ({}));
  constructor({bus, loadout, energia, base, extraSoldados = 0, mej = () => 0, torreta = 0, peloton = null, soldadosOk = () => true, perfil = null, titular = null, potencia = () => null, fx = () => null}){
    this.fx = fx;
    this.potencia = potencia;                        // efecto de los potenciadores de la partida para un arma
    this.perfil = perfil; this.titular = titular;   // perfil(uid) → estadísticas del soldado concreto; titular(tipo) → soldado por defecto del tipo
    this.soldadosOk = soldadosOk;                  // tipos de soldado desbloqueados en la Ruta
    this.peloton = peloton;                        // {orden:[tipos], equipo:{tipo:dano}} o null (orden por defecto)
    Object.assign(this, {bus, loadout, energia, base, extraSoldados, mej, torreta}); this.tiposSoldado = new Set();
    this.reclutarT = 0.8; this.reclutados = 0; this.vistos = {}; this.tiempoSinEnergia = 0; this.tiempo = 0; this.bajasPropias = 0; this.armas = []; this.clima = CLIMAS.despejado; this.rayoT = 6; this.flash = 0; this.shake = 0; this.anuncio = null;
    this.sincronizarArmas();
  }
  get aliens(){ return this.enemigos.filter(e => !e.vuela); }
  get naves(){ return this.enemigos.filter(e => e.vuela); }
  get jefe(){ return this.enemigos.find(e => e.jefe); }
  sincronizarArmas(){ this.armas = this.loadout.armas.map(b => new Arma(b)); }
  get capacidad(){ return 8 + this.extraSoldados + this.loadout.efecto('soldados', 0); }   // pelotón más grande: batallas más movidas
  ponerClima(id){ this.clima = CLIMAS[id]; }
  /** Resolver un problema abre el escudo de la Mente maestra durante unos segundos. */
  debilitarJefes(){ this.enemigos.filter(e => e.escudoMental).forEach(e => { e.escudoT = 7; this.texto(e.x, e.cy - 30, '🧠 ¡Escudo abierto!', '#f0abfc', 1.5); }); }
  sacudir(s){ this.shake = Math.max(this.shake, s); }

  update(dt, director){
    if (this.sinEnergia) this.tiempoSinEnergia += dt; this.tiempo += dt;
    this.sinEnergia = false;
    director.update(dt, this);
    for (const e of this.enemigos) if (!e.contado){ e.contado = true; this.vistos[e.tipo] = (this.vistos[e.tipo] ?? 0) + 1; }
    const L = this.loadout, C = this.clima, lento = L.efecto('lentitud', 1) * (C.vel ?? 1);
    this.flash = Math.max(0, this.flash - dt * 3); this.shake = Math.max(0, this.shake - dt);
    // Base: regeneración y reclutamiento cuando hay espacio
    this.base.vida = Math.min(this.base.vidaMax, this.base.vida + L.efecto('regen', 0) * dt);
    if (this.soldados.length < this.capacidad && (this.reclutarT -= dt) <= 0){
      if (this.reclutados >= this.capacidad && !this.energia.gastar(BALANCE.costoRecluta)){ this.reclutarT = 0.5; this.sinEnergia = true; }   // el pelotón inicial es gratis; los reemplazos cuestan energía
      else {
      this.reclutarT = 2.2 * L.efecto('reclutar', 1);
      const libre = [...Array(this.capacidad).keys()].find(i => !this.soldados.some(s => s.i === i));
      const orden = this.peloton?.orden?.length ? this.peloton.orden : ORDEN_RECLUTA;
      let quien = orden[this.reclutados++ % orden.length];
      let perfil = this.perfil ? this.perfil(SOLDADOS[quien] ? this.titular(quien) : quien) : null;   // en el orden puede haber un tipo o un soldado concreto
      let tipo = perfil?.tipo ?? quien;
      if (!this.soldadosOk(tipo)){ tipo = 'fusilero'; perfil = this.perfil ? this.perfil(this.titular('fusilero')) : null; }   // tipos aún bloqueados → fusileros
      const nuevo = new Soldado(libre, tipo, L.efecto('vidaSoldado', 0), perfil); nuevo.mult = 1 + 0.15 * this.mej('sold-' + tipo);   // mejora permanente del tipo
      nuevo.vidaMax *= nuevo.mult;
      const ep = perfil && this.potencia(perfil.armaId); if (ep){ nuevo.vidaMax *= 1 + ep.vida; nuevo.regenExtra = ep.regen; }   // Formación Euler
      nuevo.vida = nuevo.vidaMax; this.soldados.push(nuevo); this.tiposSoldado.add(tipo);
      this.texto(this.base.derecha + 8, MUNDO.suelo - 24, `+${SOLDADOS[tipo].icon}`, '#bbf7d0');
    } }
    for (const s of this.soldados){ const rg = (s.perfil?.regen ?? 0) + (s.regenExtra ?? 0); if (rg) s.vida = Math.min(s.vidaMax, s.vida + rg * dt); }   // blindajes regenerativos
    const curar = L.efecto('curar', 0);
    if (curar) this.soldados.forEach(s => s.vida = Math.min(s.vidaMax, s.vida + curar * dt));
    this.apoyoSoldados(dt);
    // La base dispara sola (gratis, débil) solo si no hay soldados
    if (!this.soldados.length && (this.base.cd -= dt) <= 0){
      const o = this.elegir({alcance:'ambos', prioridad:'cercano', desde:{x:this.base.cx, y:this.base.cy}});
      if (o){ this.base.cd = 1.3; this.disparar({x:this.base.cx, y:this.base.cy - 14, obj:o, golpe:{dmg:1 + this.torreta, dano:'fisico'}, vel:200, color:'#e5e7eb', r:1.4}); }
    }
    this.armas.forEach(a => a.update(dt, this));
    // Clima: rayos de tormenta
    if (C.rayos && (this.rayoT -= dt) <= 0){
      this.rayoT = 4 + Math.random() * 4; this.flash = 1;
      const cand = [...this.visibles('ambos'), ...this.soldados.filter(() => Math.random() < 0.25)];
      const v = cand[Math.floor(Math.random() * cand.length)];
      if (v){ this.rayos.push({puntos:[{x:v.x + 10, y:0}, {x:v.x - 6, y:(v.cy ?? MUNDO.suelo) / 2}, {x:v.x, y:v.cy ?? MUNDO.suelo - 9}], t:0.25, color:'#fef9c3'});
        if (v instanceof Soldado) this.dañarSoldado(v, 3); else this.golpear(v, {dmg:4, dano:'energia'}); }
    }
    // Red de seguridad: si ya no llegan más y nadie recibe daño en 20 s, los que quedan avanzan (la oleada nunca se queda trabada)
    if (!director.generando && this.enemigos.length){
      const hp = this.enemigos.reduce((t, e) => t + e.vida, 0);
      if (hp < (this.hpPrevio ?? Infinity) - 0.01){ this.hpPrevio = hp; this.quietoT = 0; }
      else if ((this.quietoT = (this.quietoT ?? 0) + dt) > 20){ this.quietoT = 0; this.hpPrevio = hp;
        for (const e of this.enemigos){ if (e.para) e.para = this.base.derecha + 40; if (e.flota) e.flota = this.base.derecha + 40; e.esperaT = 99; e.bajoTierra = false; } }
    } else { this.hpPrevio = Infinity; this.quietoT = 0; }
    this.moverEnemigos(dt, lento);
    this.moverProyectiles(dt);
    // Efectos
    for (const p of this.particulas){ p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; p.t -= dt; }
    this.particulas = this.particulas.filter(p => p.t > 0 ? true : (this.#parts.soltar(p), false));
    this.rayos = this.rayos.filter(r => (r.t -= dt) > 0);
    this.textos = this.textos.filter(t => (t.y -= 18 * dt, (t.t -= dt) > 0));
    // Muertes
    for (const e of this.enemigos.filter(e => e.vida <= 0)){
      this.enemigos.splice(this.enemigos.indexOf(e), 1);
      this.explosion(e.x, e.cy, COLOR_ENEMIGO[e.tipo] ?? '#86efac', e.jefe ? 60 : e.vuela ? 20 : 12);
      if (e.jefe){ this.sacudir(0.8); this.anuncio = `🏆 ¡${e.name} derrotado!`; }
      if (!e.sinXP) this.bus.emit('enemigo-muerto', {tipo:e.tipo, xp:e.xp, jefe:!!e.jefe});
    }
    for (const s of this.soldados.filter(s => s.vida <= 0)){ this.bajasPropias++; this.soldados.splice(this.soldados.indexOf(s), 1); this.explosion(s.x, s.cy, '#fca5a5', 8); }
    if (this.base.vida <= 0) this.bus.emit('base-destruida');
  }

  apoyoSoldados(dt){
    for (const s of this.soldados){
      const d = s.def;
      const ep = (s.perfil && this.potencia(s.perfil.armaId)) || {dmg:0, cd:0, rango:0, area:0, perf:0, crit:0, extra:0, costo:0};   // potenciadores
      if (d.ataque && (s.apoyoT -= dt) <= 0){
        const alc = d.ataque.parabola ? 'tierra' : 'ambos';             // las armas de disparo recto también derriban naves
        const o = this.elegir({alcance:alc, prioridad:d.ataque.parabola ? 'cercano' : 'aire', desde:{x:s.x, y:s.cy}});
        if (!o || o.x - s.x > d.ataque.rango * (1 + ep.rango) * (this.clima.rango ?? 1)){ s.apoyoT = 0.3; continue; }
        if (!this.energia.gastar(d.ataque.costo * Math.max(0.2, 1 + ep.costo))){ s.apoyoT = 0.4; this.sinEnergia = true; continue; }
        s.apoyoT = d.ataque.cd * Math.max(0.35, 1 + ep.cd);
        const eq = s.perfil ? d.ataque.dano : this.equipoDe(s.tipo), Q = s.perfil ? {} : EQUIPO[eq] ?? {};   // con perfil, el tipo de daño lo da el arma equipada
        const critico = Math.random() < ep.crit, dmg = d.ataque.dmg * (s.mult ?? 1) * (eq === d.ataque.dano ? 1 : Q.mult ?? 1) * (1 + ep.dmg) * (critico ? 2 : 1);
        for (let k = 0; k <= ep.extra; k++)                              // Ráfaga Fibonacci: balas extra
          { const fx = s.perfil ? this.fx(s.perfil.armaId) : null;          // partículas propias del arma (cambian con sus potenciadores)
          if (k === 0 && fx) this.chispas(s.x + 6, s.cy - 3, fx.color, 2);   // fogonazo
          this.disparar({x:s.x + 4, y:s.cy - 3 - k * 2, obj:o, golpe:{dmg, dano:eq, area:Math.max(d.ataque.area ?? 0, Q.area ?? 0) + ep.area, alcance:alc, perf:ep.perf, efecto:ep.congela ? 'congelar' : undefined}, parabola:!!d.ataque.parabola,
            vel:(d.ataque.parabola ? 120 : 260) * (1 - k * 0.08), fx, hist:fx?.estela ? [] : null, color:critico ? '#fde047' : fx?.color ?? (d.ataque.area ? '#fb923c' : '#e5e7eb'), r:(critico ? 1.6 : 1) * (fx?.r ?? 1) * (d.ataque.area ? 1.8 : 1.1)}); }
      }
      if (d.apoyo && (s.apoyoT -= dt) <= 0){
        s.apoyoT = d.apoyo.cd * Math.max(0.35, 1 + ep.cd);
        if (d.apoyo.curar){
          const herido = this.soldados.filter(x => x.vida < x.vidaMax).sort((a, b) => a.vida / a.vidaMax - b.vida / b.vidaMax)[0];
          if (herido && this.energia.gastar(d.apoyo.costo)){ herido.vida = Math.min(herido.vidaMax, herido.vida + d.apoyo.curar * (s.mult ?? 1) * (1 + ep.dmg)); this.texto(herido.x, herido.cy - 14, '+❤', '#86efac'); }
        }
        if (d.apoyo.reparar && this.base.vida < this.base.vidaMax && this.energia.gastar(d.apoyo.costo)){
          this.base.vida = Math.min(this.base.vidaMax, this.base.vida + d.apoyo.reparar * (s.mult ?? 1) * (1 + ep.dmg)); this.texto(this.base.cx, this.base.cy - 22, '+🔧', '#fde68a');
        }
      }
    }
  }

  moverEnemigos(dt, lento){
    const frente = this.soldados.reduce((mx, s) => Math.max(mx, s.x), -Infinity), C = this.clima;
    for (const e of [...this.enemigos]){
      e.fase += dt * 8; if (e.escudoT > 0) e.escudoT -= dt;
      const vel = e.vel * lento * (e.congelado > 0 ? 0.45 : 1) * (e.vuela ? (C.voladores ?? 1) : 1); e.congelado = Math.max(0, e.congelado - dt); if (e.blindadoT > 0) e.blindadoT -= dt;
      this.armasEnemigas(e, dt, frente);
      if (e.vuela){
        if (e.kamikaze){                                                 // dron: se lanza contra la base
          const dx = this.base.cx - e.x, dy = this.base.cy - e.y, d = Math.hypot(dx, dy);
          if (d < 10){ this.base.dañar(e.dano); this.bus.emit('base-dañada'); this.explosion(e.x, e.y, '#f9a8d4', 14); this.sacudir(0.2); e.vida = 0; e.sinXP = true; }
          else { e.x += dx / d * vel * dt; e.y += dy / d * vel * dt * 0.6; }
        } else if (e.flota){                                              // se queda flotando a distancia…
          if (e.x > e.flota) e.x -= vel * dt;
          else { e.y += Math.sin(e.fase / 4) * 0.15;
            if ((e.esperaT = (e.esperaT ?? 0) + dt) > 8){ e.esperaT = 0; e.flota = Math.max(this.base.derecha + 40, e.flota * 0.7); } }   // …pero sin paciencia infinita: se acerca para que siempre se le pueda alcanzar
        }
        else {
          e.x -= vel * dt;
          if ((e.forma ?? e.tipo) === 'nave' && (e.soltados ?? 0) < 3 && e.x > 150 && e.x < MUNDO.W - 10 && (e.soltar -= dt) <= 0){
            e.soltar = 6; e.soltados = (e.soltados ?? 0) + 1;                 // cada nave suelta como máximo 3 exploradores const al = ENEMIGOS.explorador(e.x, {vida:e.vidaMax / 7, velocidad:e.vel / 16}); al.y = e.y + 6; this.enemigos.push(al);
          }
          if (e.x < -30) e.x = MUNDO.W + 30;
        }
        continue;
      }
      if (e.estado === 'cae'){ e.y += 45 * dt; if (e.y >= MUNDO.suelo){ e.y = MUNDO.suelo; e.estado = 'camina'; this.polvo(e.x, MUNDO.suelo); } continue; }
      if (e.saltando != null){                                           // saltador: brinca sobre los soldados
        e.saltando += dt / 0.7; const u = Math.min(1, e.saltando);
        e.x = e.x0 + (e.x1 - e.x0) * u; e.y = MUNDO.suelo - 40 * Math.sin(Math.PI * u);
        if (u >= 1){ e.saltando = null; e.y = MUNDO.suelo; e.paso = true; }
        continue;
      }
      const conSoldados = this.soldados.length && !e.paso;
      const limite = conSoldados ? frente + 7 * e.escala : this.base.derecha + 2 + 4 * e.escala;
      if (e.bajoTierra && e.x <= limite + 30){ e.bajoTierra = false; this.polvo(e.x, MUNDO.suelo); this.explosion(e.x, MUNDO.suelo - 3, '#a16207', 10); }
      if (e.para && e.x <= e.para){                                      // la reina se queda lejos invocando…
        if ((e.esperaT = (e.esperaT ?? 0) + dt) > 8){ e.esperaT = 0; e.para = Math.max(this.base.derecha + 60, e.para * 0.8); }   // …pero se acerca poco a poco (con niebla no se la vería)
        continue;
      }
      if (e.armas.some(a => a.rango && a.objetivo === 'soldados') && conSoldados && e.x - frente <= e.armas.find(a => a.rango).rango * 0.9 * (C.rango ?? 1)
          && (e.esperaT = (e.esperaT ?? 0) + dt) < 6) continue;            // dispara a distancia un rato y luego avanza (si no, la oleada podría no terminar)
      if (e.x > limite){ e.x -= vel * dt; continue; }
      if (e.salta && conSoldados){ e.saltando = 0; e.x0 = e.x; e.x1 = this.base.derecha + 4; continue; }
      if (conSoldados){
        const s = this.soldados.find(s => s.x === frente); this.dañarSoldado(s, e.dps * dt);
        if (e.jefe && Math.random() < dt * 0.5){ this.explosion(frente, MUNDO.suelo - 4, '#a8a29e', 10); this.soldados.filter(x => Math.abs(x.x - frente) < 20).forEach(x => this.dañarSoldado(x, 2)); this.sacudir(0.25); }
      } else { this.base.dañar(e.dps * 2 * dt); this.bus.emit('base-dañada'); }
    }
  }
  armasEnemigas(e, dt, frente){
    if (e.estado === 'cae' || e.bajoTierra || e.x > MUNDO.W - 6) return;
    for (const a of e.armas){
      if ((a.t -= dt) > 0) continue;
      const obj = a.objetivo === 'soldados' && this.soldados.length ? this.soldados.find(s => s.x === frente) : this.base;
      const ox = obj === this.base ? this.base.cx : obj.x, oy = obj === this.base ? this.base.cy : obj.cy;
      if (a.tipo === 'invocar'){ a.t = a.cd; if (this.enemigos.length < 16){ const n = ENEMIGOS[a.invoca](e.vuela ? e.y + 10 : e.x, {vida:1, velocidad:1}); n.x = e.x - 10; if (!n.vuela){ n.y = MUNDO.suelo; n.estado = 'camina'; } this.enemigos.push(n); } continue; }
      if (a.tipo === 'blindar'){ a.t = a.cd; e.blindadoT = a.dur; this.texto(e.x, e.cy - 20 * e.escala, '🛡 se blinda', '#93c5fd', 0.8); continue; }
      if (a.tipo === 'curar'){ a.t = a.cd; for (const o of this.enemigos) if (o !== e && Math.abs(o.x - e.x) < a.rango){ o.vida = Math.min(o.vidaMax, o.vida + a.dmg); this.texto(o.x, o.cy - 12, '+' + a.dmg, '#86efac', 0.5); } continue; }
      if (a.tipo === 'drenar'){ if (e.x - this.base.cx > a.rango){ a.t = 0.3; continue; } a.t = a.cd; this.energia.valor = Math.max(0, this.energia.valor - a.dmg);
        this.rayos.push({puntos:[{x:e.x, y:e.cy}, {x:this.base.cx, y:this.base.cy}], t:0.3, color:'#fde047'}); this.texto(this.base.cx, this.base.cy - 30, `-${a.dmg}⚡`, '#fde047'); continue; }
      if (a.tipo === 'pulso'){ const cerca = this.soldados.filter(s => Math.abs(s.x - e.x) < a.rango); if (!cerca.length){ a.t = 0.3; continue; }
        a.t = a.cd; cerca.forEach(s => this.dañarSoldado(s, a.dmg)); this.explosion(e.x, e.cy, COLOR_ENEMIGO[e.tipo] ?? '#fda4af', a.rango / 3); continue; }
      if (a.tipo === 'lluvia'){ const objs = this.soldados.length ? this.soldados : [this.base]; if (Math.abs(e.x - (objs[0].x ?? this.base.cx)) > a.rango){ a.t = 0.3; continue; }
        a.t = a.cd; for (let k = 0; k < (a.n ?? 3); k++){ const o = objs[Math.floor(Math.random() * objs.length)], tx = (o === this.base ? this.base.cx : o.x) + (Math.random() - 0.5) * 16;
          this.balasEnemigas.push({x:e.x - 5, y:e.cy, tx, ty:MUNDO.suelo - 4, vel:100 + k * 8, dmg:a.dmg, area:12, color:'#a8a29e', r:3, parabola:true, x0:e.x - 5, y0:e.cy, u:0, dist:Math.max(40, Math.abs(e.x - tx))}); }
        continue; }
      if (a.tipo === 'bomba'){
        if (!(e.x < frente + 30 && e.x > this.base.x)) { a.t = 0.3; continue; }
        a.t = a.cd; this.balasEnemigas.push({x:e.x, y:e.y + 4, tx:e.x, ty:MUNDO.suelo - 2, vel:90, dmg:a.dmg, area:a.area, color:'#f97316', r:2});
        continue;
      }
      if (Math.abs(e.x - ox) > a.rango){ a.t = 0.3; continue; }
      a.t = a.cd;
      if (a.tipo === 'laser' || a.tipo === 'rayo'){
        this.rayos.push({puntos:[{x:e.x - 6 * e.escala, y:e.cy}, {x:ox, y:oy}], t:0.18, color:a.tipo === 'rayo' ? '#e879f9' : '#fb7185'});
        if (obj === this.base){ this.base.dañar(a.dmg); this.bus.emit('base-dañada'); if (e.jefe) this.sacudir(0.2); } else this.dañarSoldado(obj, a.dmg);
      } else {                                                           // ácido o roca: proyectil enemigo
        this.balasEnemigas.push({x:e.x - 5, y:e.cy, tx:ox, ty:oy, vel:a.tipo === 'roca' ? 110 : 140, dmg:a.dmg, area:a.tipo === 'roca' ? 14 : 0,
          color:a.tipo === 'roca' ? '#a8a29e' : '#a3e635', r:a.tipo === 'roca' ? 3.5 : 1.8, parabola:a.tipo === 'roca', x0:e.x - 5, y0:e.cy, u:0, dist:Math.max(40, Math.abs(e.x - ox))});
      }
    }
  }
  moverProyectiles(dt){
    const velClima = this.clima.balas ?? 1;
    for (const b of this.balas){
      const o = b.obj, vivo = o.vida > 0 && !o.bajoTierra;
      if (b.guiado && vivo){ b.tx = o.x; b.ty = o.cy; }
      if (b.parabola){
        b.u = Math.min(1, b.u + dt * b.vel * velClima / b.dist);
        b.x = b.x0 + (b.tx - b.x0) * b.u; b.y = b.y0 + (b.ty - b.y0) * b.u - 55 * Math.sin(Math.PI * b.u);
        if (b.u >= 1) this.impacto(b, vivo);
        continue;
      }
      if (b.hist){ b.hist.push(b.x, b.y); if (b.hist.length > 8 + 4 * b.fx.estela) b.hist.splice(0, 2); }   // estela
      if (!b.guiado && vivo){ b.tx = o.x; b.ty = o.cy; }
      const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy), paso = b.vel * velClima * dt;
      if (d <= paso + 3) this.impacto(b, vivo);
      else { b.x += dx / d * paso; b.y += dy / d * paso; }
    }
    this.balas = this.balas.filter(b => b.muerta ? (this.#balas.soltar(b), false) : true);
    for (const b of this.balasEnemigas){
      if (b.parabola){ b.u = Math.min(1, b.u + dt * b.vel / b.dist); b.x = b.x0 + (b.tx - b.x0) * b.u; b.y = b.y0 + (b.ty - b.y0) * b.u - 40 * Math.sin(Math.PI * b.u); if (b.u < 1) continue; }
      else { const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy), paso = b.vel * dt; if (d > paso + 2){ b.x += dx / d * paso; b.y += dy / d * paso; continue; } }
      b.muerta = true;
      this.explosion(b.tx, b.ty, b.color, b.area ? 10 : 4);
      const r = Math.max(b.area, 8);
      this.soldados.filter(s => Math.abs(s.x - b.tx) <= r).forEach(s => this.dañarSoldado(s, b.dmg));
      if (b.tx <= this.base.derecha + r){ this.base.dañar(b.dmg); this.bus.emit('base-dañada'); }
    }
    this.balasEnemigas = this.balasEnemigas.filter(b => !b.muerta);
  }

  /* ---- Consultas y acciones ---- */
  visibles(alcance){
    const maxX = this.base.cx + (MUNDO.W - this.base.cx) * (this.clima.rango ?? 1);
    return this.enemigos.filter(e => !e.bajoTierra && e.x <= maxX && (e.vuela ? alcance !== 'tierra' && e.x < MUNDO.W - 4 : alcance !== 'aire' && e.y > 0));
  }
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
  /** Munición equipada para un tipo de soldado (por defecto, la suya). */
  equipoDe(tipo){ return this.peloton?.equipo?.[tipo] ?? SOLDADOS[tipo].ataque?.dano ?? 'fisico'; }
  golpear(e, {dmg, dano, efecto, perf: perfExtra = 0}){
    if (e.escudoMental && !(e.escudoT > 0)){ this.texto(e.x, e.cy - 14, '🛡 resuelve un problema', '#f0abfc', 0.6); return; }
    let d = dmg;
    if (e.armadura && dano === 'fisico'){ const perf = Math.min(1, this.loadout.efecto('perforacion', 0) + (efecto === 'perforar' ? 0.5 : 0) + perfExtra); d *= 1 - e.armadura * (1 - perf); }
    if (e.escudo && dano === 'energia') d *= 1 - e.escudo * (1 - Math.min(1, perfExtra));
    if ((DEBILIDAD[e.tipo] ?? DEBILIDAD[e.forma]) === dano) d *= MULT_DEBIL;
    if (e.blindadoT > 0) d *= 0.4;                                  // armadura temporal de un Comandante               // debilidad: la estrategia del pelotón importa
    if (efecto === 'congelar' && !e.jefe) e.congelado = 2.5;
    e.vida -= d; this.texto(e.x, e.cy - 10 * e.escala, `-${Math.round(d * 10) / 10}${d > dmg ? '!' : ''}`, d < dmg ? '#cbd5e1' : d > dmg ? '#fde047' : '#fecaca', 0.5);
  }
  dañarSoldado(s, n){ s.vida -= n * (1 - (s.perfil?.reduccion ?? 0)); }   // el blindaje reduce el daño
  impacto(b, vivo){
    b.muerta = true;
    if (b.fx) this.chispas(b.tx, b.ty, b.color, b.fx.anillo ? 6 : 3);   // chispas del impacto con el color del arma
    if (b.golpe.area){
      this.explosion(b.tx, b.ty, b.golpe.efecto === 'congelar' ? '#bae6fd' : '#fdba74', 14);
      for (const e of [...this.enemigos]) if (!e.bajoTierra && Math.hypot(e.x - b.tx, e.cy - b.ty) <= b.golpe.area + 6 * (e.escala - 1) && (!e.vuela || b.golpe.alcance !== 'tierra')) this.golpear(e, b.golpe);
    } else if (vivo) this.golpear(b.obj, b.golpe);
  }
  disparar(o){
    const b = this.#balas.tomar({muerta:false, guiado:false, parabola:false, fx:null, hist:null, tx:o.obj.x, ty:o.obj.cy, ...o});
    if (b.parabola){ b.x0 = b.x; b.y0 = b.y; b.u = 0; b.dist = Math.max(40, Math.hypot(b.tx - b.x, b.ty - b.y)); }
    this.balas.push(b);
  }
  rayo(desde, objs, color){ this.rayos.push({puntos:[desde, ...objs.map(e => ({x:e.x, y:e.cy}))], t:0.2, color}); }
  explosion(x, y, color, n){ for (let i = 0; i < n; i++){ const a = Math.random() * 6.28, v = 30 + Math.random() * 60; this.particulas.push(this.#parts.tomar({x, y, vx:Math.cos(a) * v, vy:Math.sin(a) * v - 30, t:0.5 + Math.random() * 0.4, color, r:1 + Math.random() * 1.6})); } }
  chispas(x, y, color, n){ for (let i = 0; i < n; i++){ const a = Math.random() * 6.28, v = 20 + Math.random() * 40; this.particulas.push(this.#parts.tomar({x, y, vx:Math.cos(a) * v, vy:Math.sin(a) * v - 20, t:0.18 + Math.random() * 0.2, color, r:0.6 + Math.random() * 0.8})); } }
  polvo(x, y){ this.explosion(x, y - 1, '#a8a29e', 5); }
  texto(x, y, txt, color, t = 0.9){ this.textos.push({x, y, txt, color, t}); }
}
const COLOR_ENEMIGO = {explorador:'#86efac', blindado:'#cbd5e1', saltador:'#fdba74', acido:'#d9f99d', escudero:'#93c5fd', excavador:'#d6a35c', nave:'#c4b5fd', dron:'#f9a8d4',
  bombardero:'#a1a1aa', caza:'#fca5a5', portadrones:'#c4b5fd', coloso:'#a8a29e', reina:'#bef264', acorazado:'#a5b4fc', mente:'#f0abfc'};

/* ---------- Dibujo (Canvas 2D) ---------- */
class Renderer {
  constructor(canvas){
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.estrellas = Array.from({length:40}, () => [Math.random() * MUNDO.W, Math.random() * 120, Math.random()]);
    this.gotas = Array.from({length:70}, () => [Math.random() * MUNDO.W, Math.random() * MUNDO.H, 0.5 + Math.random()]);
    this.resize();
  }
  resize(){
    const r = this.cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cv.width = Math.round(r.width * dpr); this.cv.height = Math.round(r.height * dpr);
    this.esc = this.cv.width / MUNDO.W;
  }
  /** Dibuja un disparo con la forma de su arma: bala, orbe, rayo, perdigones, onda o granada, más estela y chispas. */
  bala(c, b, t){
    const f = b.fx;
    if (b.hist && b.hist.length > 2){ c.strokeStyle = b.color; c.globalAlpha = 0.45; c.lineWidth = b.r; c.beginPath(); c.moveTo(b.hist[0], b.hist[1]); for (let i = 2; i < b.hist.length; i += 2) c.lineTo(b.hist[i], b.hist[i + 1]); c.lineTo(b.x, b.y); c.stroke(); c.globalAlpha = 1; }
    c.fillStyle = b.color;
    const forma = f?.forma ?? 'bala';
    if (forma === 'orbe'){ c.globalAlpha = 0.35; c.beginPath(); c.arc(b.x, b.y, b.r * 2.6, 0, 6.28); c.fill(); c.globalAlpha = 1; c.beginPath(); c.arc(b.x, b.y, b.r * 1.2, 0, 6.28); c.fill(); }
    else if (forma === 'rayo'){ const a = Math.atan2(b.ty - b.y, b.tx - b.x); c.strokeStyle = b.color; c.lineWidth = b.r * 1.2; c.beginPath(); c.moveTo(b.x - Math.cos(a) * 7, b.y - Math.sin(a) * 7); c.lineTo(b.x, b.y); c.stroke(); }
    else if (forma === 'perdigon'){ for (let k = -1; k <= 1; k++){ c.beginPath(); c.arc(b.x - 1, b.y + k * 2, b.r * 0.8, 0, 6.28); c.fill(); } }
    else if (forma === 'onda'){ c.strokeStyle = b.color; c.lineWidth = 1.4; c.beginPath(); c.arc(b.x, b.y, b.r * 2.4, -1.1, 1.1); c.stroke(); }
    else if (forma === 'granada'){ c.beginPath(); c.arc(b.x, b.y, b.r * 1.3, 0, 6.28); c.fill(); c.strokeStyle = '#1c1917'; c.lineWidth = 0.6; c.stroke(); }
    else { c.beginPath(); c.arc(b.x, b.y, b.r, 0, 6.28); c.fill(); }
    if (f?.perfora){ c.strokeStyle = '#67e8f9'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(b.x - 5, b.y); c.lineTo(b.x + 2, b.y); c.stroke(); }
    if (f?.chispas && Math.sin(t * 40 + b.x) > 0.3){ c.fillStyle = '#fef08a'; c.fillRect(b.x + 1.5, b.y - 2, 1, 1); c.fillRect(b.x - 2, b.y + 1.5, 1, 1); }
    if (f?.anillo){ c.strokeStyle = b.color; c.globalAlpha = 0.4; c.lineWidth = 0.6; c.beginPath(); c.arc(b.x, b.y, b.r + 2 + f.anillo, 0, 6.28); c.stroke(); c.globalAlpha = 1; }
  }
  draw(m, t){
    const c = this.ctx, {W, H, suelo} = MUNDO, sh = m.shake > 0 ? (Math.random() - 0.5) * 6 * m.shake : 0;
    c.setTransform(this.esc, 0, 0, this.esc, sh * this.esc, sh * 0.6 * this.esc);
    const clima = m.clima ?? CLIMAS.despejado;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, clima === CLIMAS.tormenta ? '#05060f' : clima === CLIMAS.nieve ? '#1e293b' : '#0b1023'); g.addColorStop(1, clima === CLIMAS.niebla ? '#475569' : '#312e81');
    c.fillStyle = g; c.fillRect(-6, -6, W + 12, H + 12);
    if (clima !== CLIMAS.tormenta && clima !== CLIMAS.niebla) for (const [x, y, b] of this.estrellas){ c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * b + x)); c.fillStyle = '#fff'; c.fillRect(x, y, 1, 1); }
    c.globalAlpha = 1;
    // Montañas de fondo (dos capas)
    for (const [col, h, f] of [['#1e1b4b', 55, 0.02], ['#272457', 35, 0.035]]){
      c.fillStyle = col; c.beginPath(); c.moveTo(0, suelo);
      for (let x = 0; x <= W; x += 12) c.lineTo(x, suelo - h * (0.55 + 0.45 * Math.sin(x * f + h)));
      c.lineTo(W, suelo); c.fill();
    }
    c.fillStyle = clima === CLIMAS.nieve ? '#e2e8f0' : '#1c1917'; c.fillRect(-6, suelo, W + 12, H - suelo + 6); c.fillStyle = '#44403c'; c.fillRect(-6, suelo, W + 12, 2);
    this.base(c, m.base);
    m.soldados.forEach(s => this.soldado(c, s, t));
    m.enemigos.forEach(e => this.enemigo(c, e, t));
    for (const b of m.balas) this.bala(c, b, t);
    for (const b of m.balasEnemigas){ c.fillStyle = b.color; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 6.28); c.fill(); }
    for (const r of m.rayos){
      c.strokeStyle = r.color; c.lineWidth = 2.2; c.globalAlpha = Math.min(1, r.t * 8); c.beginPath();
      r.puntos.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke();
    }
    c.globalAlpha = 1;
    for (const p of m.particulas){ c.globalAlpha = Math.max(0, p.t * 1.6); c.fillStyle = p.color; c.fillRect(p.x, p.y, p.r, p.r); }
    c.globalAlpha = 1;
    this.climaFx(c, m, t);
    c.font = 'bold 9px system-ui'; c.textAlign = 'center';
    for (const x of m.textos){ c.globalAlpha = Math.min(1, x.t * 2); c.fillStyle = x.color; c.fillText(x.txt, x.x, x.y); }
    c.globalAlpha = 1;
  }
  climaFx(c, m, t){
    const cl = m.clima ?? CLIMAS.despejado, {W, H} = MUNDO;
    if (cl === CLIMAS.lluvia || cl === CLIMAS.tormenta){ c.strokeStyle = '#93c5fd88'; c.lineWidth = 0.7; c.beginPath();
      for (const g of this.gotas){ const y = (g[1] + t * 260 * g[2]) % H, x = (g[0] - t * 40) % W; c.moveTo((x + W) % W, y); c.lineTo((x + W) % W - 2, y + 6); } c.stroke(); }
    if (cl === CLIMAS.nieve){ c.fillStyle = '#f8fafc'; for (const g of this.gotas){ const y = (g[1] + t * 25 * g[2]) % H, x = (g[0] + Math.sin(t + g[1]) * 6) % W; c.fillRect(x, y, 1.4, 1.4); } }
    if (cl === CLIMAS.viento){ c.strokeStyle = '#e2e8f055'; c.lineWidth = 0.8; c.beginPath(); for (const g of this.gotas.slice(0, 18)){ const x = W - ((g[0] + t * 160 * g[2]) % (W + 40)), y = g[1] % 140; c.moveTo(x, y); c.lineTo(x + 18, y); } c.stroke(); }
    if (cl === CLIMAS.niebla){ const f = c.createLinearGradient(m.base.cx + 80, 0, W, 0); f.addColorStop(0, '#cbd5e100'); f.addColorStop(1, '#cbd5e1cc'); c.fillStyle = f; c.fillRect(0, 0, W, H); }
    if (m.flash > 0){ c.globalAlpha = m.flash * 0.45; c.fillStyle = '#fff'; c.fillRect(-6, -6, W + 12, H + 12); c.globalAlpha = 1; }
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
    const y = MUNDO.suelo, d = s.def;
    c.fillStyle = d.cuerpo; c.fillRect(s.x - 2, y - 11, s.tipo === 'pesado' ? 6 : 5, 7);
    c.fillStyle = '#fcd34d'; c.fillRect(s.x - 1.5, y - 15, 4, 4);
    c.fillStyle = d.casco; c.fillRect(s.x - 2.5, y - 16.5, 6, 2);
    if (s.tipo === 'medico'){ c.fillStyle = '#dc2626'; c.fillRect(s.x - 0.5, y - 10, 2, 5); c.fillRect(s.x - 1.5, y - 9, 4, 2); }
    else if (s.tipo === 'ingeniero'){ c.fillStyle = '#9ca3af'; c.fillRect(s.x + 2, y - 9, 4, 1.4); c.fillRect(s.x + 5, y - 10, 1.4, 3); }
    else if (s.tipo === 'pesado'){ c.fillStyle = '#94a3b8'; c.fillRect(s.x + 3, y - 12, 2.5, 9); }
    else if (s.tipo === 'granadero'){ c.fillStyle = '#3f3f46'; c.beginPath(); c.arc(s.x + 4, y - 8, 1.6, 0, 6.28); c.fill(); }
    else { c.fillStyle = '#1f2937'; c.fillRect(s.x + 2, y - 10, 6, 1.6); }
    c.fillStyle = '#14532d'; c.fillRect(s.x - 2, y - 4, 2, 4); c.fillRect(s.x + 1, y - 4, 2, 4);
    if (s.vida < s.vidaMax) this.barra(c, s.x - 4, y - 21, 9, s.vida / s.vidaMax, '#4ade80');
  }
  enemigo(c, e, t){
    c.save(); c.translate(e.x, e.y); c.scale(e.escala, e.escala); c.translate(-e.x, -e.y);
    if (e.vuela) this.volador(c, e, t); else this.terrestre(c, e, t);
    c.restore();
    if (e.escudoMental && !(e.escudoT > 0)){ c.strokeStyle = '#f0abfcaa'; c.lineWidth = 1.5; c.beginPath(); c.arc(e.x, e.cy, 16 * e.escala, 0, 6.28); c.stroke(); }
    if (e.vida < e.vidaMax && !e.jefe) this.barra(c, e.x - 7, e.cy - 16 * e.escala, 14, e.vida / e.vidaMax, '#f87171');
  }
  terrestre(c, a, t){
    const y = a.y, color = a.congelado > 0 ? '#7dd3fc' : a.color ?? COLOR_ENEMIGO[a.tipo];
    if (a.bajoTierra){ c.fillStyle = '#78350f'; c.beginPath(); c.ellipse(a.x, y - 1, 7, 3, 0, Math.PI, 0); c.fill(); c.fillStyle = '#a16207'; c.fillRect(a.x - 1 + Math.sin(t * 20) * 2, y - 5, 2, 2); return; }
    if (a.estado === 'cae'){ c.strokeStyle = '#e5e7eb88'; c.lineWidth = 1; c.beginPath(); c.moveTo(a.x - 6, a.y - 22); c.lineTo(a.x, a.y - 10); c.lineTo(a.x + 6, a.y - 22); c.stroke(); c.fillStyle = '#f8fafc55'; c.beginPath(); c.arc(a.x, a.y - 22, 8, Math.PI, 0); c.fill(); }
    const paso = Math.sin(a.fase) * 1.5;
    c.fillStyle = color; c.beginPath(); c.ellipse(a.x, y - 8, 6, 7, 0, 0, 6.28); c.fill();
    c.fillStyle = (a.forma ?? a.tipo) === 'reina' ? '#365314' : '#052e16'; c.beginPath(); c.arc(a.x - 2.3, y - 10, 1.6, 0, 6.28); c.arc(a.x + 2.3, y - 10, 1.6, 0, 6.28); c.fill();
    c.strokeStyle = color; c.lineWidth = 1.2; c.beginPath(); c.moveTo(a.x - 3, y - 2); c.lineTo(a.x - 3 + paso, y); c.moveTo(a.x + 3, y - 2); c.lineTo(a.x + 3 - paso, y);
    c.moveTo(a.x - 2, y - 15); c.lineTo(a.x - 4, y - 19); c.moveTo(a.x + 2, y - 15); c.lineTo(a.x + 4, y - 19); c.stroke();
    if (a.armadura){ c.fillStyle = '#94a3b8'; c.fillRect(a.x - 6, y - 9, 12, 4); c.fillRect(a.x - 5, y - 15, 10, 2.5); }
    if (a.escudo){ c.strokeStyle = '#60a5fa'; c.lineWidth = 1; c.beginPath(); c.arc(a.x, y - 8, 9, -1.2, 1.2); c.stroke(); }
    if ((a.forma ?? a.tipo) === 'acido'){ c.fillStyle = '#65a30d'; c.beginPath(); c.arc(a.x + 4, y - 5, 2.5, 0, 6.28); c.fill(); }
    if ((a.forma ?? a.tipo) === 'saltador'){ c.strokeStyle = color; c.beginPath(); c.moveTo(a.x - 5, y - 4); c.lineTo(a.x - 8, y); c.moveTo(a.x + 5, y - 4); c.lineTo(a.x + 8, y); c.stroke(); }
    if ((a.forma ?? a.tipo) === 'coloso'){ c.fillStyle = '#57534e'; c.fillRect(a.x - 7, y - 14, 14, 3); }
    if ((a.forma ?? a.tipo) === 'reina'){ c.fillStyle = '#facc15'; c.beginPath(); c.moveTo(a.x - 4, y - 15); c.lineTo(a.x - 2, y - 18); c.lineTo(a.x, y - 15.5); c.lineTo(a.x + 2, y - 18); c.lineTo(a.x + 4, y - 15); c.fill(); }
  }
  volador(c, n, t){
    const col = n.congelado > 0 ? '#7dd3fc' : n.color ?? COLOR_ENEMIGO[n.tipo];
    if ((n.forma ?? n.tipo) === 'dron'){
      c.fillStyle = col; c.fillRect(n.x - 4, n.y - 2, 8, 4);
      c.strokeStyle = '#fbcfe8'; c.lineWidth = 1; c.beginPath(); const giro = Math.sin(t * 40) * 1.5;
      for (const dx of [-7, 7]){ c.moveTo(n.x + dx - 3 + giro, n.y - 4); c.lineTo(n.x + dx + 3 - giro, n.y - 4); }
      c.stroke(); c.fillStyle = '#fde047'; c.fillRect(n.x - 1, n.y - 1, 2, 2); return;
    }
    if ((n.forma ?? n.tipo) === 'caza'){ c.fillStyle = col; c.beginPath(); c.moveTo(n.x - 9, n.y); c.lineTo(n.x + 7, n.y - 4); c.lineTo(n.x + 4, n.y); c.lineTo(n.x + 7, n.y + 4); c.fill(); c.fillStyle = '#fef08a'; c.fillRect(n.x + 7, n.y - 1, 2 + Math.random() * 2, 2); return; }
    if ((n.forma ?? n.tipo) === 'bombardero'){ c.fillStyle = col; c.fillRect(n.x - 12, n.y - 3, 24, 6); c.fillStyle = '#52525b'; c.fillRect(n.x - 6, n.y + 3, 12, 2); c.fillStyle = '#fde047'; c.fillRect(n.x - 10, n.y - 1, 2, 2); return; }
    if ((n.forma ?? n.tipo) === 'portadrones' || (n.forma ?? n.tipo) === 'acorazado'){
      c.fillStyle = col; c.fillRect(n.x - 16, n.y - 5, 32, 10); c.fillStyle = '#4c1d95'; c.fillRect(n.x - 12, n.y - 9, 10, 4);
      for (let i = -2; i <= 2; i++){ c.fillStyle = Math.sin(t * 8 + i) > 0 ? '#fde047' : '#713f12'; c.fillRect(n.x + i * 6 - 1, n.y + 1, 2, 2); } return;
    }
    if ((n.forma ?? n.tipo) === 'mente'){
      c.fillStyle = col; c.beginPath(); c.ellipse(n.x, n.y, 12, 9, 0, 0, 6.28); c.fill();
      c.strokeStyle = '#a21caf'; c.lineWidth = 1; c.beginPath(); for (let i = -2; i <= 2; i++){ c.moveTo(n.x + i * 4, n.y - 8); c.quadraticCurveTo(n.x + i * 5, n.y, n.x + i * 4, n.y + 7); } c.stroke();
      c.fillStyle = '#fdf4ff'; c.beginPath(); c.arc(n.x - 4, n.y, 2, 0, 6.28); c.arc(n.x + 4, n.y, 2, 0, 6.28); c.fill(); return;
    }
    c.fillStyle = col; c.beginPath(); c.ellipse(n.x, n.y, 15, 4.5, 0, 0, 6.28); c.fill();
    c.fillStyle = '#ddd6fe'; c.beginPath(); c.ellipse(n.x, n.y - 3.5, 6, 4.5, 0, Math.PI, 0); c.fill();
    for (let i = -1; i <= 1; i++){ c.fillStyle = Math.sin(t * 10 + i) > 0 ? '#fde047' : '#78350f'; c.fillRect(n.x + i * 7 - 1, n.y, 2, 2); }
  }
  // Compatibilidad con el mockup
  alien(c, a){ this.terrestre(c, a, 0); } nave(c, n, t){ this.volador(c, n, t); } dron(c, d, t){ this.volador(c, d, t); }
}
