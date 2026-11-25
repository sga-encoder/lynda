/* =====================================================================
   DEFENSA ALGEBRAICA · 2) Modelo del juego
   - Bonificadores: datos (definiciones por nivel) + objeto Bonus cuyas propiedades
     cambian al subir de nivel o fusionarse. Máx. nivel 3; la fusión crea nivel 4.
   - Loadout: 3 espacios de armas + 3 de tácticos; la fusión libera un espacio.
   - Puntuación (Strategy compuesta): velocidad × combo × creatividad × eficiencia.
   - Mejoras permanentes + Repository (guardado en el navegador).
   ===================================================================== */

/** Valores posibles de cada propiedad (las cambia el juego al subir de nivel o fusionar; el jugador no las edita). */
const PROPIEDADES = {
  objetivo:  {icon:'🎯', name:'Objetivo',   vals:{unico:'Único', area:'Área', cadena:'Cadena'}},
  alcance:   {icon:'✈️', name:'Alcance',    vals:{tierra:'Solo tierra', aire:'Solo aire', ambos:'Tierra y aire'}},
  dano:      {icon:'💥', name:'Daño',       vals:{fisico:'Físico', energia:'Energía', explosivo:'Explosivo'}},
  movimiento:{icon:'➰', name:'Movimiento', vals:{bala:'Bala recta', rayo:'Rayo instantáneo', guiado:'Guiado', parabola:'Parábola'}},
  origen:    {icon:'📍', name:'Origen',     vals:{soldados:'Cada soldado', base:'Torreta de la base'}},
  prioridad: {icon:'👁️', name:'Prioridad',  vals:{cercano:'Más cercano', fuerte:'Más vida', aire:'Voladores primero'}},
  efecto:    {icon:'✨', name:'Efecto',     vals:{congelar:'Congela', perforar:'Perfora armadura'}},
  afecta:    {icon:'🧭', name:'Afecta a',   vals:{energia:'Energía', base:'Base', soldados:'Soldados', enemigos:'Enemigos', armas:'Armas', cartas:'Cartas'}},
  modo:      {icon:'🔁', name:'Modo',       vals:{pasivo:'Pasivo', aura:'Aura'}},
};
/** Definiciones de bonificadores: propiedades (props) + números por nivel. Añadir uno = añadir datos. */
const BONUS_DEFS = {
  // ---- Armas ----
  rifle:   {tipo:'arma', icon:'🔫', name:'Rifle de pelotón', desc:'Cada soldado dispara al enemigo más cercano.',
            props:{origen:'soldados', objetivo:'unico', alcance:'ambos', dano:'fisico', movimiento:'bala', prioridad:'cercano'},
            niveles:[{dmg:1, cd:0.9, costo:1.5}, {dmg:1.5, cd:0.75, costo:1.5}, {dmg:2, cd:0.6, costo:1.5}]},
  laser:   {tipo:'arma', icon:'🔴', name:'Láser de la base', desc:'Rayo instantáneo al enemigo con más vida.',
            props:{origen:'base', objetivo:'unico', alcance:'ambos', dano:'energia', movimiento:'rayo', prioridad:'fuerte'},
            niveles:[{dmg:4, cd:2.0, costo:6}, {dmg:6, cd:1.7, costo:6}, {dmg:8, cd:1.4, costo:6}]},
  misil:   {tipo:'arma', icon:'🚀', name:'Misiles', desc:'Persiguen a los voladores y explotan en área.',
            props:{origen:'base', objetivo:'area', alcance:'ambos', dano:'explosivo', movimiento:'guiado', prioridad:'aire'},
            niveles:[{dmg:5, cd:2.6, costo:7.5, area:26}, {dmg:7, cd:2.2, costo:7.5, area:30}, {dmg:9, cd:1.9, costo:7.5, area:34}]},
  mortero: {tipo:'arma', icon:'💣', name:'Mortero', desc:'Proyectil en parábola; gran área, solo enemigos en tierra.',
            props:{origen:'base', objetivo:'area', alcance:'tierra', dano:'explosivo', movimiento:'parabola', prioridad:'cercano'},
            niveles:[{dmg:6, cd:3.0, costo:6, area:30}, {dmg:8, cd:2.6, costo:6, area:34}, {dmg:10, cd:2.2, costo:6, area:40}]},
  tesla:   {tipo:'arma', icon:'⚡', name:'Bobina Tesla', desc:'Descarga que salta entre enemigos cercanos.',
            props:{origen:'base', objetivo:'cadena', alcance:'ambos', dano:'energia', movimiento:'rayo', prioridad:'cercano'},
            niveles:[{dmg:2, cd:1.8, costo:4.5, saltos:3}, {dmg:3, cd:1.5, costo:4.5, saltos:4}, {dmg:4, cd:1.2, costo:4.5, saltos:5}]},
  franco:  {tipo:'arma', icon:'🎯', name:'Francotirador', desc:'Disparo lento y potente; ignora parte de la armadura.',
            props:{origen:'base', objetivo:'unico', alcance:'ambos', dano:'fisico', movimiento:'bala', prioridad:'fuerte', efecto:'perforar'},
            niveles:[{dmg:10, cd:3.5, costo:7.5, vel:420}, {dmg:14, cd:3.0, costo:7.5, vel:420}, {dmg:18, cd:2.5, costo:7.5, vel:420}]},
  // ---- Fusiones (nivel 4) ----
  foton:   {tipo:'arma', fusion:true, icon:'🌟', name:'Rayo de fotones', desc:'Láser + Amplificador: cadena de 3, poca energía, más energía por paso.',
            props:{origen:'base', objetivo:'cadena', alcance:'ambos', dano:'energia', movimiento:'rayo', prioridad:'fuerte'},
            niveles:[null, null, null, {dmg:12, cd:1.0, costo:3, saltos:3, energia:1.6}]},
  escuadron:{tipo:'arma', fusion:true, icon:'🎖️', name:'Escuadrón élite', desc:'Rifle + Reclutamiento: +3 soldados que disparan muy rápido.',
            props:{origen:'soldados', objetivo:'unico', alcance:'ambos', dano:'fisico', movimiento:'bala', prioridad:'cercano'},
            niveles:[null, null, null, {dmg:3, cd:0.45, costo:1.5, soldados:3, reclutar:0.5}]},
  crio:    {tipo:'arma', fusion:true, icon:'❄️', name:'Misiles criogénicos', desc:'Misiles + Cámara lenta: área enorme que congela.',
            props:{origen:'base', objetivo:'area', alcance:'ambos', dano:'explosivo', movimiento:'guiado', prioridad:'aire', efecto:'congelar'},
            niveles:[null, null, null, {dmg:10, cd:1.8, costo:7.5, area:44, lentitud:0.8}]},
  // Fusiones arma + arma (liberan un espacio de arma)
  plasma:  {tipo:'arma', fusion:true, icon:'🌩️', name:'Tormenta de plasma', desc:'Rayos que saltan entre muchos enemigos y los frenan.',
            props:{origen:'base', objetivo:'cadena', alcance:'ambos', dano:'energia', movimiento:'rayo', prioridad:'cercano', efecto:'congelar'},
            niveles:[null, null, null, {dmg:6, cd:1.0, costo:5, saltos:6, lentitud:0.9}]},
  riel:    {tipo:'arma', fusion:true, icon:'☄️', name:'Cañón de riel', desc:'Disparo instantáneo que atraviesa cualquier armadura.',
            props:{origen:'base', objetivo:'unico', alcance:'ambos', dano:'fisico', movimiento:'rayo', prioridad:'fuerte', efecto:'perforar'},
            niveles:[null, null, null, {dmg:24, cd:1.8, costo:6}]},
  // ---- Tácticos ----
  amplificador: {tipo:'tactico', icon:'🔋', name:'Amplificador', desc:'Más energía por cada paso matemático.', props:{afecta:'energia', modo:'pasivo'},
            niveles:[{energia:1.2}, {energia:1.4}, {energia:1.6}]},
  escudo:  {tipo:'tactico', icon:'🛡️', name:'Escudo de la base', desc:'Más vida máxima y regeneración.', props:{afecta:'base', modo:'pasivo'},
            niveles:[{vida:25, regen:0.5}, {vida:50, regen:1}, {vida:75, regen:1.5}]},
  lenta:   {tipo:'tactico', icon:'⏳', name:'Cámara lenta', desc:'Los enemigos avanzan más despacio.', props:{afecta:'enemigos', modo:'aura'},
            niveles:[{lentitud:0.85}, {lentitud:0.72}, {lentitud:0.6}]},
  reclutas:{tipo:'tactico', icon:'🪖', name:'Reclutamiento', desc:'Más soldados y aparecen más rápido.', props:{afecta:'soldados', modo:'pasivo'},
            niveles:[{soldados:1, reclutar:0.85}, {soldados:2, reclutar:0.7}, {soldados:3, reclutar:0.55}]},
  municion:{tipo:'tactico', icon:'🔩', name:'Munición perforante', desc:'El daño físico atraviesa la armadura.', props:{afecta:'armas', modo:'pasivo'},
            niveles:[{perforacion:0.35}, {perforacion:0.65}, {perforacion:1}]},
  concentracion:{tipo:'tactico', icon:'🧘', name:'Concentración', desc:'Más segundos para el bono de rapidez.', props:{afecta:'cartas', modo:'pasivo'},
            niveles:[{ventana:2}, {ventana:4}, {ventana:6}]},
  botiquin:{tipo:'tactico', icon:'⛑️', name:'Botiquín', desc:'Soldados con más vida que se curan.', props:{afecta:'soldados', modo:'pasivo'},
            niveles:[{vidaSoldado:3, curar:0.3}, {vidaSoldado:6, curar:0.6}, {vidaSoldado:9, curar:1}]},
  // Fusiones táctico + táctico (liberan un espacio de táctico)
  fortaleza:{tipo:'tactico', fusion:true, icon:'🏯', name:'Fortaleza', desc:'Base y soldados mucho más resistentes y con curación.', props:{afecta:'base', modo:'aura'},
            niveles:[null, null, null, {vida:110, regen:2.5, vidaSoldado:12, curar:1.4}]},
  precision:{tipo:'tactico', fusion:true, icon:'🎯', name:'Mente precisa', desc:'Mucho tiempo para el bono de rapidez y armas que perforan todo.', props:{afecta:'cartas', modo:'aura'},
            niveles:[null, null, null, {ventana:8, perforacion:1}]},
};
/** Recetas de fusión: ambos en nivel 3 → `a` cambia sus propiedades (nivel 4) y se libera el espacio de `b`.
    Hay tres familias: arma + táctico, arma + arma y táctico + táctico. Las recetas NO se muestran en el
    catálogo: el jugador las descubre jugando. */
const FUSIONES = [
  {a:'laser', b:'amplificador', resultado:'foton'},
  {a:'rifle', b:'reclutas', resultado:'escuadron'},
  {a:'misil', b:'lenta', resultado:'crio'},
  {a:'tesla', b:'mortero', resultado:'plasma'},
  {a:'franco', b:'rifle', resultado:'riel'},
  {a:'escudo', b:'botiquin', resultado:'fortaleza'},
  {a:'concentracion', b:'municion', resultado:'precision'},
];
const familiaFusion = f => `${BONUS_DEFS[f.a].tipo}+${BONUS_DEFS[f.b].tipo}`;
const MAX_NIVEL = 3, ESPACIOS = {arma:3, tactico:3};

class Bonus {
  constructor(id, nivel = 1){ this.id = id; this.nivel = nivel; }
  get def(){ return BONUS_DEFS[this.id]; }
  get tipo(){ return this.def.tipo; }
  get props(){ return this.def.props; }
  get stats(){ return this.def.niveles[this.nivel - 1]; }
  get maximo(){ return this.nivel >= MAX_NIVEL; }
  subir(){ if (this.maximo) throw new Error('Ya está al máximo'); this.nivel++; return this; }
  /** La fusión no crea un objeto nuevo: este mismo bonificador cambia sus propiedades. */
  fusionarEn(id){ this.id = id; this.nivel = MAX_NIVEL + 1; return this; }
}

class Loadout {
  armas = []; tacticos = [];
  constructor(){}   // las armas ahora son las de los soldados (con sus potenciadores); el loadout guarda los tácticos
  lista(tipo){ return tipo === 'arma' ? this.armas : this.tacticos; }
  tiene(id){ return [...this.armas, ...this.tacticos].find(b => b.id === id); }
  /** Opciones para elegir al subir de nivel (nuevos, mejoras o fusiones). */
  opciones(tipo, rng, n = 3){
    const propios = this.lista(tipo);
    const mejoras = propios.filter(b => !b.maximo && !b.def.fusion).map(b => ({accion:'mejorar', bonus:b}));
    const nuevos = propios.length < ESPACIOS[tipo]
      ? Object.entries(BONUS_DEFS).filter(([id, d]) => d.tipo === tipo && !d.fusion && !this.tiene(id) && !this.fusionado(id) && (this.permitido?.(id) ?? true)).map(([id]) => ({accion:'nuevo', id}))
      : [];
    const fusiones = this.fusionesDisponibles().filter(f => BONUS_DEFS[f.resultado].tipo === tipo).map(f => ({accion:'fusionar', receta:f}));
    const todas = [...fusiones, ...rng.shuffle([...mejoras, ...nuevos])];
    return todas.length ? todas.slice(0, n) : [{accion:'reparar'}];
  }
  /** ¿Ese bonificador ya se consumió en una fusión? */
  fusionado(id){ return FUSIONES.some(f => (f.a === id || f.b === id) && this.tiene(f.resultado)); }
  fusionesDisponibles(){ return FUSIONES.filter(f => this.tiene(f.a)?.maximo && !this.tiene(f.a).def.fusion && this.tiene(f.b)?.maximo && !this.tiene(f.b).def.fusion && !this.tiene(f.resultado)); }
  aplicar(op){
    if (op.accion === 'mejorar') op.bonus.subir();
    if (op.accion === 'nuevo'){
      const b = new Bonus(op.id), l = this.lista(b.tipo);
      if (l.length >= ESPACIOS[b.tipo]) throw new Error('No hay espacio');
      l.push(b);
    }
    if (op.accion === 'fusionar'){
      const {a, b, resultado} = op.receta, A = this.tiene(a), B = this.tiene(b);
      A.fusionarEn(resultado);
      const lb = this.lista(B.tipo); lb.splice(lb.indexOf(B), 1);   // libera el espacio de B
    }
  }
  /** Efecto acumulado de una estadística en todo el equipo (los fusionados conservan el efecto del táctico). */
  efecto(stat, neutro){
    return [...this.armas, ...this.tacticos].reduce((acc, b) => {
      let v = b.stats?.[stat]; if (v == null) return acc;
      const k = 1 + 0.1 * (this.potencia?.(b.id) ?? 0);            // mejora permanente del táctico
      if (b.tipo === 'tactico') v = neutro === 1 ? 1 + (v - 1) * k : v * k;
      return neutro === 1 ? acc * v : acc + v;
    }, neutro);
  }
  get energiaMult(){ return this.efecto('energia', 1); }
}

/* ---------- Combos de cartas ----------
   Un combo aplica varias cartas en un orden fijo. Cada carta se aplica a todos sus
   objetivos (en orden) antes de pasar a la siguiente. En batalla se ejecuta guiada (ver BattleScene.seguirCombo) y sin límite de usos. */
class Combo {
  constructor({nombre, dominio, cartas, hecho = false, mazo = false}){ Object.assign(this, {nombre, dominio, cartas, hecho, mazo, usado:false, id:'cb' + Math.random().toString(36).slice(2, 8)}); }
  /** Ejecuta el combo; devuelve la lista de estados intermedios. */
  ejecutar(raiz, dom){
    const estados = []; let actual = raiz;
    for (const id of this.cartas){
      const carta = dom.cartas.get(id); if (!carta) continue;
      for (let n = 0; n < 8; n++){
        const objs = carta.targets(actual); if (!objs.length) break;
        actual = carta.apply(actual, objs[0]); estados.push(actual);
        if (dom.resuelto(actual)) return estados;
      }
    }
    return estados;
  }
}
const MAX_CARTAS_COMBO = 5;

/* ---------- Modo asistido (3 niveles) ---------- */
const NIVELES_AYUDA = [
  {icon:'🚫', nombre:'Sin ayuda', desc:'Solo tú y las cartas.', xp:1, espera:Infinity},
  {icon:'🌱', nombre:'Leve', desc:'Pista conceptual si te atascas; ⭐ en el potenciador sugerido.', xp:0.9, espera:14},
  {icon:'🧭', nombre:'Media', desc:'Se iluminan las cartas que sirven; la pista nombra la carta; sugerencias con explicación.', xp:0.8, espera:9},
  {icon:'🦮', nombre:'Alta', desc:'Marca la mejor carta y dónde usarla; quita una opción incorrecta; preselecciona potenciadores.', xp:0.65, espera:5},
];

/** Recomienda potenciadores según lo que pasa en la batalla (reglas tipo Strategy). */
class Recomendador {
  constructor(ctx){ this.c = ctx; }         // ctx: {voladores, blindados, escuderos, rapidos, grupo, base, sinEnergia, bajasPropias, pasoLento}
  puntuar(op){
    const c = this.c, r = [];
    const id = op.accion === 'fusionar' ? op.receta.resultado : op.accion === 'mejorar' ? op.bonus.id : op.id;
    const p = BONUS_DEFS[id]?.props ?? {};
    let pts = op.accion === 'mejorar' ? 1.2 : 1;
    if (op.accion === 'fusionar'){ pts += 5; r.push('La fusión es más fuerte y libera un espacio.'); }
    if (op.accion === 'reparar' && c.base < 0.7){ pts += 3; r.push('La base está dañada.'); }
    if (c.voladores > 0.3 && (p.prioridad === 'aire' || id === 'tesla')){ pts += 3; r.push('Hay muchos voladores y esta arma los prioriza.'); }
    if (c.voladores > 0.3 && p.alcance === 'tierra'){ pts -= 2; }
    if (c.blindados > 0.15 && (p.dano === 'energia' || p.efecto === 'perforar' || id === 'municion')){ pts += 2.5; r.push('Hay alienígenas blindados: la energía o la perforación ignoran su armadura.'); }
    if (c.escuderos > 0.15 && (p.dano === 'fisico' || p.dano === 'explosivo')){ pts += 1.5; r.push('Hay escuderos: resisten la energía, no lo físico.'); }
    if (c.grupo && (p.objetivo === 'area' || p.objetivo === 'cadena')){ pts += 2; r.push('Los enemigos llegan en grupo: conviene daño en área o en cadena.'); }
    if (c.rapidos > 0.2 && id === 'lenta'){ pts += 2.5; r.push('Hay enemigos rápidos: la cámara lenta los frena.'); }
    if (c.sinEnergia > 0.15 && id === 'amplificador'){ pts += 3; r.push('Te quedas sin energía a menudo.'); }
    if (c.base < 0.6 && id === 'escudo'){ pts += 3; r.push('La base está dañada.'); }
    if (c.bajasPropias >= 3 && (id === 'botiquin' || id === 'reclutas')){ pts += 2.5; r.push('Estás perdiendo soldados.'); }
    if (c.pasoLento && id === 'concentracion'){ pts += 2.5; r.push('Tus pasos son lentos: tendrás más tiempo para el bono de rapidez.'); }
    return {pts, razon:r[0] ?? (op.accion === 'mejorar' ? 'Mejorar lo que ya tienes es una apuesta segura.' : 'Buena opción general.')};
  }
  mejor(ops){ return ops.map((op, i) => ({i, ...this.puntuar(op)})).sort((a, b) => b.pts - a.pts)[0]; }
}

/* ---------- Puntuación de cada paso (Strategy compuesta) ---------- */
class ReglaVelocidad   { nombre = 'rápido';    mult(c){ const v = c.ventana ?? 0; return c.segundos < 6 + v ? 1.5 : c.segundos < 12 + v ? 1.25 : 1; } }
class ReglaCombo       { nombre = 'combo';     mult(c){ return 1 + Math.min(c.combo, 5) * 0.1; } }
class ReglaCadena      { nombre = 'combo de cartas'; mult(c){ return c.cadena ? 1.25 : 1; } }
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

/* ---------- Mejoras permanentes (fuera de la partida) ----------
   Se compran con 🔬 puntos de investigación (misiones completadas + XP). */
const CATEGORIAS_MEJORA = [['cientificos', '🧪', 'Científicos'], ['base', '🏰', 'Base'], ['soldados', '🪖', 'Soldados'], ['tacticos', '🧠', 'Tácticos']];   // las armas se mejoran en 🪖 Pelotón
const TIPOS_SOLDADO = [['fusilero', '🔫', 'Fusilero'], ['pesado', '🛡️', 'Pesado'], ['granadero', '💣', 'Granadero'], ['medico', '⛑️', 'Médico'], ['ingeniero', '🔧', 'Ingeniero']];
const MEJORAS = {
  laboratorio:{cat:'cientificos', icon:'🔬', name:'Laboratorio', desc:'+10 % de XP en cada paso', max:5, costo:n => 10 + 8 * n, efecto:{xp:0.1}},
  bateria:    {cat:'cientificos', icon:'🔋', name:'Batería', desc:'+15 de energía al empezar', max:5, costo:n => 6 + 5 * n, efecto:{energia:15}},
  eficiencia: {cat:'cientificos', icon:'⚗️', name:'Eficiencia', desc:'+8 % de energía por cada paso', max:5, costo:n => 10 + 7 * n, efecto:{energiaPaso:0.08}},
  intuicion:  {cat:'cientificos', icon:'🧠', name:'Intuición', desc:'+1 s de margen para el bono de rapidez', max:3, costo:n => 12 + 8 * n, efecto:{ventana:1}},
  blindaje:   {cat:'base', icon:'🧱', name:'Blindaje', desc:'+20 de vida máxima de la base', max:5, costo:n => 8 + 6 * n, efecto:{vida:20}},
  academia:   {cat:'base', icon:'🎖️', name:'Academia', desc:'+1 soldado en el pelotón', max:3, costo:n => 15 + 10 * n, efecto:{soldados:1}},
  torreta:    {cat:'base', icon:'🗼', name:'Torreta', desc:'La torreta de emergencia hace +1 de daño', max:3, costo:n => 8 + 6 * n, efecto:{torreta:1}},
  ...Object.fromEntries(TIPOS_SOLDADO.map(([id, icon, name]) => ['sold-' + id, {cat:'soldados', icon, name, desc:'+15 % de vida y de daño o efecto', max:3, costo:n => 10 + 8 * n, requiere:['soldados', id]}])),
  ...Object.fromEntries(Object.entries(BONUS_DEFS).filter(([, d]) => d.tipo === 'arma' && !d.fusion).map(([id, d]) => ['arma-' + id, {cat:'armas', icon:d.icon, name:d.name, desc:'+10 % de daño (también en su fusión)', max:3, costo:n => 10 + 8 * n, requiere:['armas', id]}])),
  ...Object.fromEntries(Object.entries(BONUS_DEFS).filter(([, d]) => d.tipo === 'tactico').map(([id, d]) => ['tac-' + id, {cat:'tacticos', icon:d.icon, name:d.name, desc:'+10 % de potencia de su efecto', max:3, costo:n => 10 + 8 * n, requiere:['tacticos', id]}])),
};
/** Arma base de una fusión (para aplicar las mejoras del arma original). */
const armaBase = id => FUSIONES.find(f => f.resultado === id)?.a ?? id;
const puntosMision = m => 10 + 5 * m;
const MAX_MAZO = 8;

class SaveRepository {                               // patrón Repository: el resto del juego no sabe de localStorage
  #key = 'calcint:juego';
  load(){ try { return JSON.parse(localStorage.getItem(this.#key)) ?? {}; } catch { return {}; } }
  save(data){ try { localStorage.setItem(this.#key, JSON.stringify(data)); } catch {} }
}
class Progreso {
  constructor(repo){
    this.repo = repo;
    this.data = {puntos:0, mejoras:{}, record:0, partidas:0, modo:'fund', todo:false, devDesbloqueado:false, mazoInfinito:[], semi:true, asistido:0, dificultad:'soldado', rutaXP:0, ...repo.load()};
    if (!this.data.devDesbloqueado) this.data.todo = false;          // el modo desarrollador exige la contraseña
    this.data.desc = {armas:['rifle'], tacticos:[], enemigos:[], soldados:[], cartas:[], fusiones:[], potenciadores:[], ...(this.data.desc ?? {})};
    this.data.mazo = {fund:[], alg:[], dif:[], int:[], ...(this.data.mazo ?? {})};
  }
  /** Registra algo encontrado por primera vez (para el catálogo). Devuelve true si es nuevo. */
  /** Registra algo nuevo para el catálogo. Descubrir o usar algo por primera vez da ⚙️ chatarra de premio. */
  descubrir(cat, id){ const l = this.data.desc[cat]; if (l.includes(id)) return false; l.push(id); this.data.chatarra = (this.data.chatarra ?? 0) + 1; (this.nuevos ??= []).push({cat, id}); this.guardar(); return true; }
  conocido(cat, id){ return this.data.desc[cat].includes(id); }
  disponible(id){ const r = MEJORAS[id].requiere; return !r || this.conocido(...r); }
  ganarPuntos(n){ this.data.puntos += n; this.guardar(); }
  guardarMazo(dom, lista){ this.data.mazo[dom] = lista.slice(0, MAX_MAZO); this.guardar(); }
  nivel(id){ return this.data.mejoras[id] ?? 0; }
  /** Las mejoras permanentes cuestan bastante y encarecen rápido: se consiguen jugando muchas partidas. */
  costo(id){ const n = this.nivel(id); return Math.round(MEJORAS[id].costo(n) * 3 * (1 + 0.6 * n)); }
  puedeComprar(id){ return this.disponible(id) && this.nivel(id) < MEJORAS[id].max && this.data.puntos >= this.costo(id); }
  comprar(id){ if (!this.puedeComprar(id)) return false; this.data.puntos -= this.costo(id); this.data.mejoras[id] = this.nivel(id) + 1; this.guardar(); return true; }
  total(stat){ return Object.entries(MEJORAS).reduce((s, [id, m]) => s + (m.efecto?.[stat] ?? 0) * this.nivel(id), 0); }
  registrarPartida(xp){ const pts = Math.floor(xp / 10); this.data.puntos += pts; this.data.partidas++; this.data.record = Math.max(this.data.record, Math.round(xp)); this.guardar(); return pts; }
  guardar(){ this.repo.save(this.data); }
}

/* ---------- Oleadas y misiones (dificultad por velocidad y cantidad) ---------- */
const MISIONES = 4, OLEADAS = 5;   // cada misión tiene 5 oleadas; la última trae al Comandante o al Soberano
const CLIMAS_ROTACION = ['despejado', 'lluvia', 'niebla', 'nieve', 'tormenta', 'viento'];
function configOleada(mision, oleada){
  const t = Math.round(((mision - 1) * OLEADAS + (oleada - 1)) * 0.45);    // sube poco a poco: misión 1 → 0..2, misión 2 → 2..4…
  return {
    t,
    problemas: 1 + Math.floor(t / 4) + (oleada === OLEADAS && mision > 1 ? 1 : 0),
    jefeVida: mision === 1 ? 0.55 : mision === 2 ? 0.8 : 1,        // los primeros jefes son más suaves
    minimo: 7 + Math.round(t * 2),                      // la primera misión es suave y luego crece
    intervalo: Math.max(0.6, 3.0 - t * 0.2),            // aparecen más seguido a medida que avanzas
    velocidad: 1 + t * 0.07,
    vida: 1 + t * 0.14,
    jefe: oleada === OLEADAS ? JEFES[(mision - 1) % JEFES.length] : null, // un jefe al final de cada misión (en modo infinito se repiten)
  };
}
const xpParaNivel = n => 60 + n * 45;
