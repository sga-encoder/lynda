/* =====================================================================
   DEFENSA ALGEBRAICA · 2) Modelo del juego
   - Bonificadores: datos (definiciones por nivel) + objeto Bonus cuyas propiedades
     cambian al subir de nivel o fusionarse. Máx. nivel 3; la fusión crea nivel 4.
   - Loadout: 3 espacios de armas + 3 de tácticos; la fusión libera un espacio.
   - Puntuación (Strategy compuesta): velocidad × combo × creatividad × eficiencia.
   - Mejoras permanentes + Repository (guardado en el navegador).
   ===================================================================== */

/** Definiciones de bonificadores (añadir uno = añadir datos, sin tocar la lógica). */
const BONUS_DEFS = {
  // ---- Armas ----
  rifle:   {tipo:'arma', icon:'🔫', name:'Rifle de pelotón', desc:'Los soldados disparan al enemigo más cercano.',
            niveles:[{dmg:1, cd:0.9, costo:1}, {dmg:1.5, cd:0.75, costo:1}, {dmg:2, cd:0.6, costo:1}]},
  laser:   {tipo:'arma', icon:'🔴', name:'Láser de la base', desc:'Rayo instantáneo al enemigo con más vida.',
            niveles:[{dmg:4, cd:2.0, costo:4}, {dmg:6, cd:1.7, costo:4}, {dmg:8, cd:1.4, costo:4}]},
  misil:   {tipo:'arma', icon:'🚀', name:'Misiles antiaéreos', desc:'Prefieren naves; explotan en área.',
            niveles:[{dmg:5, cd:2.6, costo:5, area:26}, {dmg:7, cd:2.2, costo:5, area:30}, {dmg:9, cd:1.9, costo:5, area:34}]},
  foton:   {tipo:'arma', icon:'🌟', name:'Rayo de fotones', desc:'Fusión: atraviesa hasta 3 enemigos y gasta poca energía.', fusion:true,
            niveles:[null, null, null, {dmg:12, cd:1.0, costo:2, objetivos:3}]},
  // ---- Tácticos ----
  amplificador: {tipo:'tactico', icon:'⚡', name:'Amplificador', desc:'Más energía por cada paso matemático.',
            niveles:[{energia:1.2}, {energia:1.4}, {energia:1.6}]},
  escudo:  {tipo:'tactico', icon:'🛡️', name:'Escudo de la base', desc:'Más vida máxima y regeneración.',
            niveles:[{vida:25, regen:0.5}, {vida:50, regen:1}, {vida:75, regen:1.5}]},
  lenta:   {tipo:'tactico', icon:'⏳', name:'Cámara lenta', desc:'Los aliens avanzan más despacio.',
            niveles:[{lentitud:0.85}, {lentitud:0.72}, {lentitud:0.6}]},
  reclutas:{tipo:'tactico', icon:'🪖', name:'Reclutamiento', desc:'Más soldados y aparecen más rápido.',
            niveles:[{soldados:1, reclutar:0.85}, {soldados:2, reclutar:0.7}, {soldados:3, reclutar:0.55}]},
};
/** Recetas de fusión: ambos en nivel 3 → el resultado ocupa el espacio de `a` y libera el de `b`. */
const FUSIONES = [{a:'laser', b:'amplificador', resultado:'foton'}];
const MAX_NIVEL = 3, ESPACIOS = {arma:3, tactico:3};

class Bonus {
  constructor(id, nivel = 1){ this.id = id; this.nivel = nivel; }
  get def(){ return BONUS_DEFS[this.id]; }
  get tipo(){ return this.def.tipo; }
  get stats(){ return this.def.niveles[this.nivel - 1]; }
  get maximo(){ return this.nivel >= MAX_NIVEL; }
  subir(){ if (this.maximo) throw new Error('Ya está al máximo'); this.nivel++; return this; }
}

class Loadout {
  armas = []; tacticos = [];
  constructor(){ this.armas.push(new Bonus('rifle')); }
  lista(tipo){ return tipo === 'arma' ? this.armas : this.tacticos; }
  tiene(id){ return [...this.armas, ...this.tacticos].find(b => b.id === id); }
  /** Opciones para elegir al subir de nivel (nuevos, mejoras o fusiones). */
  opciones(tipo, rng, n = 3){
    const propios = this.lista(tipo);
    const mejoras = propios.filter(b => !b.maximo && !b.def.fusion).map(b => ({accion:'mejorar', bonus:b}));
    const nuevos = propios.length < ESPACIOS[tipo]
      ? Object.entries(BONUS_DEFS).filter(([id, d]) => d.tipo === tipo && !d.fusion && !this.tiene(id)).map(([id]) => ({accion:'nuevo', id}))
      : [];
    const fusiones = tipo === 'arma' ? this.fusionesDisponibles().map(f => ({accion:'fusionar', receta:f})) : [];
    const todas = [...fusiones, ...rng.shuffle([...mejoras, ...nuevos])];
    return todas.length ? todas.slice(0, n) : [{accion:'reparar'}];
  }
  fusionesDisponibles(){
    return FUSIONES.filter(f => this.tiene(f.a)?.maximo && this.tiene(f.b)?.maximo && !this.tiene(f.resultado));
  }
  aplicar(op){
    if (op.accion === 'mejorar') op.bonus.subir();
    if (op.accion === 'nuevo'){
      const b = new Bonus(op.id), l = this.lista(b.tipo);
      if (l.length >= ESPACIOS[b.tipo]) throw new Error('No hay espacio');
      l.push(b);
    }
    if (op.accion === 'fusionar'){
      const {a, b, resultado} = op.receta, A = this.tiene(a), B = this.tiene(b);
      A.id = resultado; A.nivel = MAX_NIVEL + 1;               // el objeto cambia sus propiedades: cuenta como un nivel más
      const lb = this.lista(B.tipo); lb.splice(lb.indexOf(B), 1); // libera el espacio de B
    }
  }
  /** Multiplicador/suma de un efecto táctico (1 o 0 si no se tiene). */
  efecto(stat, neutro){
    return this.tacticos.reduce((acc, b) => {
      const v = b.stats?.[stat]; if (v == null) return acc;
      return neutro === 1 ? acc * v : acc + v;
    }, neutro);
  }
  /** Los efectos de bonificadores fusionados se conservan (p. ej. el amplificador vive dentro del fotón). */
  get energiaMult(){ return this.efecto('energia', 1) * (this.tiene('foton') ? 1.6 : 1); }
}

/* ---------- Puntuación de cada paso (Strategy compuesta) ---------- */
class ReglaVelocidad   { nombre = 'rápido';    mult(c){ return c.segundos < 6 ? 1.5 : c.segundos < 12 ? 1.25 : 1; } }
class ReglaCombo       { nombre = 'combo';     mult(c){ return 1 + Math.min(c.combo, 5) * 0.1; } }
class ReglaCreatividad { nombre = 'creativo';  mult(c){ return c.libre ? (c.avance >= 2 ? 2 : 1.3) : 1; } }
class Puntuador {
  /** @param {{nombre:string, mult:(ctx)=>number}[]} reglas */
  constructor(reglas){ this.reglas = reglas; }
  /** ctx: {avance, segundos, combo, libre} → energía y XP (la "calidad" multiplica ambas). */
  puntuar(ctx){
    const base = 10 * ctx.avance;
    const detalle = this.reglas.map(r => ({nombre:r.nombre, mult:r.mult(ctx)})).filter(d => d.mult > 1);
    const calidad = detalle.reduce((q, d) => q * d.mult, 1);
    return {energia: base * calidad, xp: base * calidad, calidad, detalle};
  }
  /** Bono al terminar un problema: eficiencia (pasos vs. par). */
  bonoProblema(pasos, par){ const eficiente = pasos <= par; return {xp: eficiente ? 30 : 15, energia: 20, eficiente}; }
}

/* ---------- Mejoras permanentes (fuera de la partida) ---------- */
const MEJORAS = {
  blindaje:    {icon:'🧱', name:'Blindaje', desc:'+20 de vida máxima de la base', max:5, costo:n => 8 + 6 * n,  efecto:{vida:20}},
  bateria:     {icon:'🔋', name:'Batería', desc:'+15 de energía al empezar', max:5, costo:n => 6 + 5 * n,  efecto:{energia:15}},
  academia:    {icon:'🎖️', name:'Academia', desc:'+1 soldado en el pelotón', max:3, costo:n => 15 + 10 * n, efecto:{soldados:1}},
  laboratorio: {icon:'🔬', name:'Laboratorio', desc:'+10 % de XP en cada paso', max:5, costo:n => 10 + 8 * n, efecto:{xp:0.1}},
};
class SaveRepository {                               // patrón Repository: el resto del juego no sabe de localStorage
  #key = 'calcint:juego';
  load(){ try { return JSON.parse(localStorage.getItem(this.#key)) ?? {}; } catch { return {}; } }
  save(data){ try { localStorage.setItem(this.#key, JSON.stringify(data)); } catch {} }
}
class Progreso {
  constructor(repo){ this.repo = repo; this.data = {puntos:0, mejoras:{}, record:0, partidas:0, ...repo.load()}; }
  nivel(id){ return this.data.mejoras[id] ?? 0; }
  costo(id){ return MEJORAS[id].costo(this.nivel(id)); }
  puedeComprar(id){ return this.nivel(id) < MEJORAS[id].max && this.data.puntos >= this.costo(id); }
  comprar(id){ if (!this.puedeComprar(id)) return false; this.data.puntos -= this.costo(id); this.data.mejoras[id] = this.nivel(id) + 1; this.guardar(); return true; }
  total(stat){ return Object.entries(MEJORAS).reduce((s, [id, m]) => s + (m.efecto[stat] ?? 0) * this.nivel(id), 0); }
  registrarPartida(xp){ const pts = Math.floor(xp / 10); this.data.puntos += pts; this.data.partidas++; this.data.record = Math.max(this.data.record, Math.round(xp)); this.guardar(); return pts; }
  guardar(){ this.repo.save(this.data); }
}

/* ---------- Oleadas y misiones (dificultad por velocidad) ---------- */
const MISIONES = 3, OLEADAS = 3;
function configOleada(mision, oleada){
  const t = (mision - 1) * OLEADAS + (oleada - 1);     // 0..8
  return {
    problemas: 1 + Math.floor(t / 3) + (oleada === OLEADAS ? 1 : 0),
    minimo: 4 + t,                                       // enemigos mínimos: resolver rápido da energía, no salta la batalla
    intervalo: Math.max(2.2, 5.5 - t * 0.35),          // segundos entre apariciones
    velocidad: 1 + t * 0.08,
    vida: 1 + t * 0.15,
    probNave: Math.min(0.45, 0.1 + t * 0.05),
  };
}
const xpParaNivel = n => 60 + n * 45;
