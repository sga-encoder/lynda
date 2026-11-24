/* =====================================================================
   DEFENSA ALGEBRAICA · 6) Ruta (pase de batalla), dificultades,
   gestor de partidas y práctica de propiedades
   - Ruta: línea de tiempo de niveles. La XP sale de Aprender (ejercicios y
     propiedades practicadas) y del juego (problemas, oleadas, misiones).
     Cada nivel desbloquea tipos de problema (y con ellos sus cartas),
     dificultades y bonificadores. En modo desarrollo todo está abierto.
   - GestorPartidas (Repository + Memento): guarda la partida en curso con
     su proceso paso a paso; se exporta/importa como JSON.
   - PracticaPropiedades: 3 ejercicios por carta, fuera de la batalla.
   ===================================================================== */

/* ---------- Dificultades ---------- */
const DIFICULTADES = [
  {id:'recluta', icon:'🌱', nombre:'Recluta', desc:'Enemigos lentos y con poca vida.', vel:0.85, vida:0.8, cantidad:0.85, tier:0},
  {id:'soldado', icon:'⚔️', nombre:'Soldado', desc:'La experiencia normal.', vel:1, vida:1, cantidad:1, tier:0},
  {id:'veterano', icon:'🔥', nombre:'Veterano', desc:'Más rápidos, más resistentes y problemas más largos.', vel:1.15, vida:1.25, cantidad:1.2, tier:1},
  {id:'leyenda', icon:'💀', nombre:'Leyenda', desc:'Solo para quien domina todas las propiedades.', vel:1.3, vida:1.55, cantidad:1.4, tier:2},
];
const dificultad = id => DIFICULTADES.find(d => d.id === id) ?? DIFICULTADES[1];

/** Cartas que necesita cada tipo de problema (calculado con el solucionador): al desbloquear el tipo se desbloquean sus cartas. */
const CARTAS_DE_TIPO = {
  lin1:['mover', 'seme', 'div', 'oper'], simp1:['seme'], lin2:['mover', 'seme', 'div', 'oper'], simp2:['dist', 'seme'], dist:['dist', 'mover', 'seme', 'div', 'oper'],
  apot0:['p-cero', 'p-uno', 'a-oper'], apot1:['p-prod', 'p-coc', 'p-uno', 'a-oper'], apot2:['p-pot', 'p-prod'], apot3:['p-prodpot', 'p-cocpot', 'p-pot', 'a-oper'],
  araiz1:['r-prod', 'r-pot', 'r-exacta'], araiz2:['r-coc', 'r-pot', 'r-exacta'], alog1:['l-prod', 'l-pot'], alog2:['l-coc', 'l-pot', 'l-inv', 'a-oper'], alog3:['l-inv'],
  atrig1:['t-pit', 'a-oper'], atrig2:['t-par', 't-tan', 'a-oper'], atrig3:['t-doble', 't-cos2'], atrig4:['t-tan', 't-par', 't-pit'],
  dpoli:['d-suma', 'd-kf', 'd-cte', 'd-pot'], dtrig:['d-suma', 'd-kf', 'd-tabla'], dprod:['d-prod', 'd-pot', 'd-tabla'], dcad:['d-cad', 'd-suma', 'd-kf', 'd-cte', 'd-pot'],
  dtan:['d-suma', 'd-kf', 'd-pot', 'd-tabla'], dsqrt:['d-suma', 'd-kf', 'd-pot'], dneg:['d-suma', 'd-kf', 'd-pot'], dcoc:['d-prod', 'd-suma', 'd-cte', 'd-pot', 'd-cad'],
  dln:['d-kf', 'd-cad', 'd-suma', 'd-cte', 'd-pot'], dexp2:['d-cad', 'd-kf', 'd-pot'], dsincos:['d-kf', 'd-prod', 'd-tabla'],
  ipoli:['i-suma', 'i-kf', 'i-cte', 'i-pot', 'i-c'], itrig:['i-suma', 'i-kf', 'i-tabla', 'i-c', 'i-ln'], isqrt:['i-suma', 'i-kf', 'i-cte', 'i-pot', 'i-c'],
  ineg:['i-suma', 'i-kf', 'i-pot', 'i-c'], irecip:['i-kf', 'i-sust', 'i-c'], ilin:['i-sust', 'i-c'],
};

/* ---------- Ruta: un nivel por cada hito de aprendizaje ----------
   La ruta se construye a partir de los temas de la guía: el tutorial (en
   dos niveles), cada tema de Fundamentos, Diferencial e Integral, la
   práctica de las cartas de propiedades y algunos logros del juego.
   Cada hito cumplido entrega sus premios (tipos de problema y con ellos
   sus cartas, bonificadores, dificultades o 🔬). */
/* Orden lógico de aprendizaje: cada nivel se alcanza solo si los anteriores están
   cumplidos (como un pase de batalla). Nadie empieza con derivadas ni integrales. */
const BASE_RUTA = {titulo:'Inicio', icon:'🚩'};
const PRIMER_JUEGO = {difs:['recluta', 'soldado'], bonus:['rifle', 'amplificador', 'escudo'], soldados:['fusilero']};   // llega junto con el nivel mínimo
const PREMIOS_TEMA = {
  // Antes de «Suma y resta de polinomios» (nivel mínimo para jugar) no se entrega nada del juego
  'f-polinomios':{tipos:['simp1'], ...PRIMER_JUEGO}, 'f-lineales':{tipos:['lin1', 'lin2'], bonus:['laser', 'reclutas'], soldados:['pesado']}, 'f-factorizacion':{tipos:['simp2', 'dist'], bonus:['lenta'], soldados:['granadero']},
  'f-potencias':{tipos:['apot0', 'apot1', 'apot2', 'apot3', 'araiz1', 'araiz2'], soldados:['medico']}, 'f-cuadraticas':{bonus:['municion'], soldados:['ingeniero']}, 'f-racionales':{bonus:['concentracion'], puntos:10},
  'f-radicales':{puntos:15}, 'f-polinomicas':{bonus:['misil']}, 'f-exponenciales':{tipos:['alog3'], bonus:['mortero']}, 'f-logaritmicas':{tipos:['alog1', 'alog2']},
  'f-trigonometricas':{tipos:['atrig1', 'atrig2', 'atrig3', 'atrig4'], bonus:['botiquin']}, 'f-inecuaciones':{puntos:20},
  'd-limites':{puntos:10}, 'd-reglas':{tipos:['dpoli', 'dsqrt', 'dneg']}, 'd-producto':{tipos:['dprod']}, 'd-cadena':{tipos:['dcad', 'dexp2']}, 'd-trascendentes':{tipos:['dtrig', 'dtan', 'dln'], bonus:['tesla']},
  'd-implicita':{tipos:['dcoc']}, 'd-extremos':{tipos:['dsincos']}, 'd-optimizacion':{difs:['veterano'], bonus:['franco']}, 'd-lhopital':{puntos:25},
  'l1':{tipos:['ipoli', 'isqrt', 'ineg']}, 'l2':{tipos:['itrig', 'ilin', 'irecip']}, 'l7':{difs:['leyenda'], puntos:40},
};
const prefijos = (keys, pref) => keys.filter(k => k.startsWith(pref)).length;
/** Lista de hitos (se arma al usarla: necesita los temas de la guía). */
function construirRuta(){
  const G = typeof FUND !== 'undefined';
  const hitos = [{...BASE_RUTA, req:[]}];
  const tema = (sec, T) => ({titulo:`${sec === 'f' ? 'Fundamentos' : 'Diferencial'}: ${T.short}`, icon:sec === 'f' ? '🧱' : '📈', href:`#/${sec}/${T.id}`,
    req:[{txt:'ejercicios del tema', pref:`${sec}-${T.id}-`, n:T.lego.length}], ...(PREMIOS_TEMA[`${sec}-${T.id}`] ?? {})});
  const props = (dom, ids, titulo, n) => ({titulo, icon:'🃏', href:`#/p/${dom}`, req:[{txt:'ejercicios de esas cartas', prefs:ids.map(id => `p-${dom}-${id}-`), n}], puntos:10});
  const juego = (titulo, campo, n, extra = {}) => ({titulo, icon:'🎮', href:'#/jugar', req:[{txt:{partidas:'partidas jugadas', misiones:'misiones cumplidas', victorias:'victorias'}[campo], juego:campo, n}], ...extra});
  if (G){
    hitos.push({titulo:'Ver el tutorial de fichas', icon:'🧩', href:'#/tutorial', req:[{txt:'tutorial visto', pref:'t-visto', n:1}], puntos:5});
    hitos.push({titulo:'Primer ejercicio con fichas', icon:'🧱', href:'#/f', req:[{txt:'ejercicio de Fundamentos', pref:'f-', n:1}], puntos:10});
    for (const T of FUND){
      hitos.push(tema('f', T));
      if (T.id === 'polinomios') hitos.push(juego('Primera partida', 'partidas', 1));
      if (T.id === 'lineales') hitos.push(props('fund', ['dist', 'seme', 'mover', 'div', 'oper'], 'Cartas: despejar ecuaciones', 5));
      if (T.id === 'potencias') hitos.push(props('alg', ['p-prod', 'p-coc', 'p-pot', 'p-prodpot', 'p-cocpot', 'p-cero', 'p-uno'], 'Cartas: propiedades de las potencias', 7));
      if (T.id === 'potencias') hitos.push(props('alg', ['r-prod', 'r-coc', 'r-pot', 'r-exacta'], 'Cartas: propiedades de las raíces', 4));
      if (T.id === 'logaritmicas') hitos.push(props('alg', ['l-prod', 'l-coc', 'l-pot', 'l-inv'], 'Cartas: propiedades de los logaritmos', 4));
      if (T.id === 'trigonometricas') hitos.push(props('alg', ['t-pit', 't-tan', 't-doble', 't-cos2', 't-par'], 'Cartas: identidades trigonométricas', 5));
    }
    hitos.push(juego('Primera misión cumplida', 'misiones', 1, {puntos:15, supers:true}));
    for (const T of DIF){
      hitos.push(tema('d', T));
      if (T.id === 'cadena') hitos.push(props('dif', ['d-suma', 'd-kf', 'd-cte', 'd-pot', 'd-tabla', 'd-prod', 'd-cad'], 'Cartas: reglas de derivación', 7));
    }
    hitos.push(juego('Tres misiones cumplidas', 'misiones', 3, {puntos:25, peloton:true}));
    for (const L of LESSONS){
      hitos.push({titulo:`Integral: ${L.short}`, icon:'∫', href:`#/${L.id}`, req:[{txt:'ejercicios de la lección', pref:`${L.id}-`, n:L.exercises.length}], ...(PREMIOS_TEMA[L.id] ?? {})});
      if (L.id === 'l1') hitos.push(props('int', ['i-suma', 'i-kf', 'i-cte', 'i-pot', 'i-ln', 'i-tabla', 'i-sust', 'i-c'], 'Cartas: reglas de integración', 8));
    }
    hitos.push(juego('¡La Tierra está a salvo!', 'victorias', 1, {puntos:60, titulo2:'🏆 Leyenda del cálculo'}));
  }
  return hitos;
}
let RUTA_CACHE = null;
const RUTA_HITOS = () => RUTA_CACHE ??= construirRuta();
const XP_RUTA = {ejercicio:20, problema:4, oleada:12, mision:30};

class Ruta {
  /** @param {Progreso} progreso  @param {()=>string[]} doneKeys */
  constructor(progreso, doneKeys){ this.progreso = progreso; this.doneKeys = doneKeys; }
  get dev(){ return !!this.progreso.data.todo; }
  get ejercicios(){ return this.doneKeys().filter(k => /^(f|d|p|t)-|^l\d/.test(k)).length; }
  get xp(){ return this.ejercicios * XP_RUTA.ejercicio + (this.progreso.data.rutaXP ?? 0); }
  /** Avance de un requisito: [hecho, total]. */
  avance(r){
    const keys = this.doneKeys(), d = this.progreso.data;
    const v = r.juego ? (d[r.juego] ?? 0) : r.prefs ? r.prefs.reduce((s, p) => s + (prefijos(keys, p) > 0 ? 1 : 0), 0) : prefijos(keys, r.pref);
    return [Math.min(v, r.n), r.n];
  }
  cumplido(h){ return h.req.every(r => { const [a, b] = this.avance(r); return a >= b; }); }
  /** Índice del último nivel alcanzado: los niveles de aprendizaje cuentan EN ORDEN (los logros del juego no bloquean). */
  get nivelReal(){
    const H = RUTA_HITOS(); let ultimo = 0;
    for (let i = 1; i < H.length; i++){ if (H[i].logro) continue; if (!this.cumplido(H[i])) break; ultimo = i; }
    return ultimo;
  }
  alcanzado(h, i){ return h.logro ? this.cumplido(h) : i <= this.nivelReal; }
  hitos(){ const n = this.nivelReal; return RUTA_HITOS().map((h, i) => ({...h, i, ok:this.dev || (h.logro ? this.cumplido(h) : i <= n)})); }
  get nivel(){ return this.dev ? RUTA_HITOS().length - 1 : this.nivelReal; }
  /** Niveles de aprendizaje alcanzados + logros cumplidos (para mostrar «X de N»). */
  get completados(){ return RUTA_HITOS().filter((h, i) => this.alcanzado(h, i)).length; }
  get total(){ return RUTA_HITOS().length; }
  alcanzados(){ return this.hitos().filter(h => h.ok); }
  tipos(){ return new Set(this.alcanzados().flatMap(t => t.tipos ?? [])); }
  difs(){ return new Set(this.alcanzados().flatMap(t => t.difs ?? [])); }
  bonus(){ return new Set(this.alcanzados().flatMap(t => t.bonus ?? [])); }
  soldados(){ return new Set(this.alcanzados().flatMap(t => t.soldados ?? [])); }
  /** ¿Ya se puede jugar? (hay al menos un tipo de problema). */
  get jugable(){ return this.dev || this.tipos().size > 0; }
  /** Primer nivel que desbloquea el juego (para el aviso de bloqueo). */
  get nivelMinimo(){ return RUTA_HITOS().findIndex(h => h.tipos?.length); }
  ganar(n){ this.progreso.data.rutaXP = (this.progreso.data.rutaXP ?? 0) + n; this.progreso.guardar(); }
  /** Logros del juego que cuentan en la ruta. */
  contar(campo){ this.progreso.data[campo] = (this.progreso.data[campo] ?? 0) + 1; this.progreso.guardar(); }
  porReclamar(){ const r = this.progreso.data.rutaReclamados ?? []; return this.hitos().filter(h => h.puntos && h.ok && !r.includes(h.i)).map(h => h.i); }
  reclamar(i){
    if (!this.porReclamar().includes(i)) return 0;
    (this.progreso.data.rutaReclamados ??= []).push(i); this.progreso.ganarPuntos(RUTA_HITOS()[i].puntos); return RUTA_HITOS()[i].puntos;
  }
  resumen(){
    const nombreTipo = Object.fromEntries(Object.values(DOMINIOS).flatMap(d => d.tipos.map(t => [t.id, {name:t.name, icon:d.icon}])));
    const cartaInfo = Object.fromEntries(Object.values(DOMINIOS).flatMap(d => d.cartas.all().map(c => [c.id, {name:c.name, icon:c.icon}])));
    const vistas = new Set(), rec = this.progreso.data.rutaReclamados ?? [];
    return {xp:this.xp, nivel:this.nivel, nivelReal:this.nivelReal, completados:this.completados, dev:this.dev, ejercicios:this.ejercicios, total:this.total,
      tiers:this.hitos().map(h => {
        const cartas = (h.tipos ?? []).flatMap(id => CARTAS_DE_TIPO[id] ?? []).filter(c => !vistas.has(c) && vistas.add(c));
        return {i:h.i, ok:h.ok, real:this.alcanzado(h, h.i), hecho:this.cumplido(h), logro:!!h.logro, titulo:h.titulo, titulo2:h.titulo2, icon:h.icon, href:h.href,
          req:h.req.map(r => { const [a, b] = this.avance(r); return {txt:r.txt, a, b}; }),
          premios:[
            ...(h.tipos ?? []).map(id => ({tipo:'problema', icon:nombreTipo[id]?.icon ?? '🧮', nombre:nombreTipo[id]?.name ?? id})),
            ...cartas.map(id => ({tipo:'carta', icon:cartaInfo[id]?.icon ?? '🃏', nombre:cartaInfo[id]?.name ?? id})),
            ...(h.difs ?? []).map(id => ({tipo:'dificultad', icon:dificultad(id).icon, nombre:`Dificultad ${dificultad(id).nombre}`})),
            ...(h.bonus ?? []).map(id => ({tipo:'bonus', icon:BONUS_DEFS[id].icon, nombre:BONUS_DEFS[id].name})),
            ...(h.soldados ?? []).map(id => ({tipo:'bonus', icon:SOLDADOS[id].icon, nombre:`Soldado: ${SOLDADOS[id].name}`})),
            ...(h.supers ? [{tipo:'bonus', icon:'⚡', nombre:'Superpotenciadores (6)'}] : []),
            ...(h.peloton ? [{tipo:'bonus', icon:'🪖', nombre:'Estrategia de pelotón (tipos de soldado y munición)'}] : []),
            ...(h.puntos ? [{tipo:'puntos', icon:'🔬', nombre:`+${h.puntos} puntos de investigación`, reclamable:h.ok && !rec.includes(h.i), reclamado:rec.includes(h.i)}] : []),
          ]};
      })};
  }
}

/* ---------- Gestor de partidas (Memento + Repository) ----------
   Se guarda el estado de la partida y el proceso paso a paso; al cargar se
   continúa al inicio de la oleada guardada con el mismo problema. */
const VERSION_PARTIDA = 1;
/** Serializa árboles de Fundamentos (clases) y de Cálculo (objetos con Q). */
function nodoAJSON(n){
  if (n instanceof Q) return {_q:[n.n, n.d]};
  if (n instanceof Num) return {_:'Num', q:nodoAJSON(n.q)};
  if (n instanceof X) return {_:'X'};
  if (n instanceof Add) return {_:'Add', terms:n.terms.map(nodoAJSON)};
  if (n instanceof Mul) return {_:'Mul', k:nodoAJSON(n.k), f:nodoAJSON(n.f)};
  if (n instanceof Div) return {_:'Div', num:nodoAJSON(n.num), den:nodoAJSON(n.den)};
  if (n instanceof Eq) return {_:'Eq', l:nodoAJSON(n.l), r:nodoAJSON(n.r)};
  if (Array.isArray(n)) return n.map(nodoAJSON);
  if (n && typeof n === 'object') return Object.fromEntries(Object.entries(n).map(([k, v]) => [k, nodoAJSON(v)]));
  return n;
}
function nodoDeJSON(j){
  if (Array.isArray(j)) return j.map(nodoDeJSON);
  if (!j || typeof j !== 'object') return j;
  if (j._q) return new Q(j._q[0], j._q[1]);
  switch (j._){
    case 'Num': return new Num(nodoDeJSON(j.q));
    case 'X':   return new X();
    case 'Add': return new Add(j.terms.map(nodoDeJSON));
    case 'Mul': return new Mul(nodoDeJSON(j.k), nodoDeJSON(j.f));
    case 'Div': return new Div(nodoDeJSON(j.num), nodoDeJSON(j.den));
    case 'Eq':  return new Eq(nodoDeJSON(j.l), nodoDeJSON(j.r));
  }
  return Object.fromEntries(Object.entries(j).map(([k, v]) => [k, nodoDeJSON(v)]));
}
class GestorPartidas {
  #key = 'calcint:partidas';
  static MAX = 8;
  lista(){ try { const l = JSON.parse(localStorage.getItem(this.#key)); return Array.isArray(l) ? l : []; } catch { return []; } }
  #escribir(l){ try { localStorage.setItem(this.#key, JSON.stringify(l.slice(0, GestorPartidas.MAX))); return true; } catch { return false; } }
  guardar(p){ const l = this.lista().filter(x => x.id !== p.id); l.unshift(p); return this.#escribir(l); }
  borrar(id){ this.#escribir(this.lista().filter(x => x.id !== id)); }
  obtener(id){ return this.lista().find(x => x.id === id); }
  /** Valida un JSON importado (de un archivo) antes de aceptarlo. */
  importar(texto){
    let p; try { p = JSON.parse(texto); } catch { throw new Error('El archivo no es un JSON válido.'); }
    if (!p || p.app !== 'defensa-algebraica' || !p.run || !Array.isArray(p.proceso)) throw new Error('Ese JSON no es una partida de Defensa Algebraica.');
    if (p.version > VERSION_PARTIDA) throw new Error('La partida es de una versión más nueva.');
    p.id = 'p' + Date.now().toString(36); p.importada = true;
    this.guardar(p); return p;
  }
  static descargar(p, nombre = null){
    const blob = new Blob([JSON.stringify(p, null, 2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = nombre ?? `partida-${p.modo}-m${p.run.mision}o${p.run.oleada}-${(p.fecha ?? '').slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
}
/** Foto de la partida en curso (lo que se descarga como JSON). */
function fotoPartida(escena, nombre){
  const r = escena.run, l = r.loadout, d = escena.app.progreso.data;
  return {
    app:'defensa-algebraica', version:VERSION_PARTIDA, id:r.idPartida ??= 'p' + Date.now().toString(36),
    nombre: nombre || `Misión ${r.mision} · oleada ${r.oleada}`, fecha:new Date().toISOString(), modo:d.modo, dificultad:d.dificultad ?? 'soldado',
    run:{potenciadores:r.potenciadores ?? {}, supers:r.supers ?? [], mundo:r.mundo ?? null, mm:r.mm ?? 0, infinito:!!r.infinito, tipos:r.tipos ? [...r.tipos] : null, mision:r.mision, oleada:r.oleada, nivel:r.nivel, xp:r.xp, xpTotal:r.xpTotal, problemas:r.problemas, eficientes:r.eficientes, bajas:r.bajas, jefes:r.jefes,
      combosUsados:r.combosUsados, puntosMisiones:r.puntosMisiones, vida:r.base.vida, vidaMax:r.base.vidaMax, energia:r.energia.valor,
      armas:l.armas.map(b => [b.id, b.nivel]), tacticos:l.tacticos.map(b => [b.id, b.nivel]),
      combos:r.combos.filter(c => !c.hecho && !c.mazo).map(c => ({nombre:c.nombre, dominio:c.dominio, cartas:c.cartas}))},
    problema: escena.raiz && !escena.resuelto ? {dominio:escena.dom.id, tipo:escena.tipo.id, raiz:nodoAJSON(escena.raiz), inicio:nodoAJSON(escena.inicio ?? escena.raiz), pasos:escena.pasos, par:escena.par, tex:escena.dom.tex(escena.raiz)} : null,
    proceso:r.proceso ?? [],
  };
}
/** Reconstruye un Run a partir de una foto guardada. */
function runDesdeFoto(app, p){
  const r = new Run(app), s = p.run;
  if (s.infinito){ r.infinito = true; r.tipos = new Set(s.tipos ?? []); }
  if (s.mundo){ r.mundo = s.mundo; r.mm = s.mm ?? 0; }
  r.potenciadores = {...(s.potenciadores ?? {})}; r.supers = [...(s.supers ?? [])];
  Object.assign(r, {mision:s.mision, oleada:s.oleada, nivel:s.nivel, xp:s.xp, xpTotal:s.xpTotal, problemas:s.problemas, eficientes:s.eficientes, bajas:s.bajas, jefes:s.jefes,
    combosUsados:s.combosUsados, puntosMisiones:s.puntosMisiones, proceso:[...p.proceso], idPartida:p.id});
  r.loadout.armas = s.armas.filter(([id]) => BONUS_DEFS[id]).map(([id, n]) => new Bonus(id, n));
  r.loadout.tacticos = s.tacticos.filter(([id]) => BONUS_DEFS[id]).map(([id, n]) => new Bonus(id, n));
  r.base.vidaMax = s.vidaMax; r.base.vida = Math.max(1, s.vida); r.energia.valor = s.energia;
  r.combos.push(...(s.combos ?? []).map(c => new Combo(c)));
  if (p.problema && DOMINIOS[p.problema.dominio]){
    const dom = DOMINIOS[p.problema.dominio];
    r.pendiente = {dom, tipo:dom.tipos.find(t => t.id === p.problema.tipo) ?? dom.tipos[0], raiz:nodoDeJSON(p.problema.raiz), inicio:nodoDeJSON(p.problema.inicio), pasos:p.problema.pasos, par:p.problema.par};
  }
  return r;
}

class PartidasScene extends Scene {
  constructor(app, volver){ super(app); this.volver = volver; this.gestor = new GestorPartidas(); }
  enter(){ this.pintar(); }
  pintar(msg = ''){
    const l = this.gestor.lista();
    const fila = p => `<div class="${UI.card} flex flex-col gap-2">
        <div class="flex items-start gap-2"><div class="flex-1"><b>${p.nombre}</b>${p.importada ? ' <span class="rounded-full bg-sky-900 px-2 text-[10px] text-sky-200">importada</span>' : ''}
          <div class="text-xs text-zinc-400">${MODOS.find(m => m[0] === p.modo)?.[1] ?? ''} ${MODOS.find(m => m[0] === p.modo)?.[2] ?? p.modo} · ${dificultad(p.dificultad).icon} ${dificultad(p.dificultad).nombre} · Nv ${p.run.nivel} · ❤ ${Math.round(p.run.vida)}/${p.run.vidaMax} · ${p.proceso.length} pasos registrados</div>
          <div class="text-[11px] text-zinc-500">${new Date(p.fecha).toLocaleString()}</div></div>
          <span class="text-lg">${p.run.armas.map(([id]) => BONUS_DEFS[id]?.icon ?? '').join('')}</span></div>
        ${p.problema ? `<div class="overflow-x-auto rounded-xl bg-zinc-950 px-2 py-1 text-center text-sm">${texJuego(p.problema.tex, false)}</div>` : ''}
        <div class="grid grid-cols-4 gap-1.5">
          <button data-p="cargar|${p.id}" class="${UI.btnP} !min-h-10 !px-2 text-sm">▶ Seguir</button>
          <button data-p="proceso|${p.id}" class="${UI.btn} !min-h-10 !px-2 text-sm">📜 Proceso</button>
          <button data-p="json|${p.id}" class="${UI.btn} !min-h-10 !px-2 text-sm">⬇ JSON</button>
          <button data-p="borrar|${p.id}" class="${UI.btn} !min-h-10 !px-2 text-sm">🗑</button></div></div>`;
    this.app.html(`
    <div class="mx-auto flex h-full max-w-xl flex-col px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div class="flex items-center justify-between">${btnVolver}<label class="${UI.btn} !min-h-10 !px-3 text-sm">⬆ Importar JSON<input type="file" accept="application/json,.json" data-a="importar" class="hidden"></label></div>
      <h2 class="mt-3 text-2xl font-black">💾 Gestor de partidas</h2>
      <p class="mt-1 text-xs text-zinc-400">Guarda desde ⏸ Pausa durante una partida. Cada partida incluye su <b>proceso</b> (cada paso que diste, con la propiedad usada). Descárgala como JSON para pasarla a otro dispositivo e impórtala aquí.</p>
      ${msg ? `<p class="mt-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm">${msg}</p>` : ''}
      <div class="mt-3 grid flex-1 content-start gap-2 overflow-y-auto pb-4">${l.length ? l.map(fila).join('') : '<p class="py-10 text-center text-zinc-500">Todavía no hay partidas guardadas.</p>'}</div>
      <div data-h="detalle" class="absolute inset-0 z-20 hidden"></div>
    </div>`).onclick = e => this.click(e);
    this.app.root.querySelector('[data-a="importar"]').onchange = e => this.importar(e.target.files[0]);
  }
  async importar(file){
    if (!file) return;
    try { const p = this.gestor.importar(await file.text()); this.pintar(`✅ Partida «${p.nombre}» importada.`); }
    catch (err){ this.pintar(`❌ ${err.message}`); }
  }
  click(e){
    if (e.target.closest('[data-a="volver"]')) return this.volver ? this.volver() : this.app.go(new MenuScene(this.app));
    if (e.target.closest('[data-a="cerrar"]')) return this.pintar();
    const [acc, id] = (e.target.closest('[data-p]')?.dataset.p ?? '').split('|'); if (!acc) return;
    const p = this.gestor.obtener(id); if (!p) return;
    if (acc === 'borrar'){ this.gestor.borrar(id); return this.pintar('Partida borrada.'); }
    if (acc === 'json') return GestorPartidas.descargar(p);
    if (acc === 'cargar'){
      const d = this.app.progreso.data; d.modo = p.modo; d.dificultad = p.dificultad; this.app.progreso.guardar();
      return this.app.go(new BattleScene(this.app, runDesdeFoto(this.app, p)));
    }
    if (acc === 'proceso'){
      const cont = this.app.root.querySelector('[data-h="detalle"]'); cont.classList.remove('hidden');
      cont.innerHTML = `<div class="flex h-full flex-col overflow-y-auto bg-zinc-950 px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))]"><div class="mx-auto w-full max-w-md">
        <div class="flex items-center justify-between"><b class="text-lg">📜 Proceso · ${p.nombre}</b><button data-a="cerrar" class="${UI.btn} !min-h-10 !px-3">✕</button></div>
        <ol class="mt-3 grid gap-2">${p.proceso.length ? p.proceso.map((s, i) => `<li class="${UI.card} !p-2.5 text-sm"><div class="flex justify-between text-xs text-zinc-400"><span>#${i + 1} · M${s.m} O${s.o} · ${s.via}</span><span>${s.ok ? '✅' : s.avance > 0 ? `+${s.avance}` : '·'}</span></div>
          <div class="mt-1 overflow-x-auto">${texJuego(s.antes, false)}</div><div class="overflow-x-auto text-emerald-300">⟶ ${texJuego(s.despues, false)}</div></li>`).join('') : '<li class="text-zinc-500">Sin pasos todavía.</li>'}</ol></div></div>`;
    }
  }
}

/* ---------- Práctica de propiedades (fuera de la batalla, en la guía) ----------
   Para cada carta hay 3 ejercicios fijos (semilla por carta). Cada ejercicio:
   1) toca la carta → se marcan los lugares donde aplica; 2) toca dónde aplicarla;
   3) elige el resultado correcto. Al acertar se guarda como hecho (clave p-…). */
function semillaDe(txt){ let h = 2166136261; for (const c of txt) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h || 1; }
const CACHE_PRACTICA = new Map();
/** Genera (y memoriza) 3 situaciones donde la carta se puede aplicar, recorriendo soluciones reales. */
function ejerciciosDeCarta(domId, cartaId){
  const clave = domId + '/' + cartaId;
  if (CACHE_PRACTICA.has(clave)) return CACHE_PRACTICA.get(clave);
  const dom = DOMINIOS[domId], carta = dom.cartas.get(cartaId), rng = new Rng(semillaDe(clave)), out = [], vistos = new Set();
  const tipos = dom.tipos.filter(t => !CARTAS_DE_TIPO[t.id] || CARTAS_DE_TIPO[t.id].includes(cartaId));
  for (let intento = 0; intento < 60 && out.length < 3; intento++){
    let cur; try { cur = dom.normalizar(rng.pick(tipos.length ? tipos : dom.tipos).make(rng)); } catch { continue; }
    for (let paso = 0; paso < 12 && !dom.resuelto(cur); paso++){
      const objs = carta.targets(cur);
      if (objs.length){
        const k = dom.key(cur);
        if (!vistos.has(k)){
          let correcto; try { correcto = carta.apply(cur, objs[0]); } catch { break; }
          const distr = dom.distractores(correcto, rng, 2);
          if (distr.length >= 1 && out.length < 3){ vistos.add(k); out.push({raiz:cur, objetivos:objs, correcto, distractores:distr}); }
        }
        if (rng.next() < 0.6) break;                       // variedad: a veces seguimos el camino para otra situación
      }
      const m = dom.mejorJugada(cur); if (!m) break;
      try { cur = dom.normalizar(m.carta.apply(cur, m.path)); } catch { break; }
    }
  }
  CACHE_PRACTICA.set(clave, out);
  return out;
}
/** Lista de cartas practicables por dominio (para los índices de la guía). */
function cartasPracticables(domId){ return DOMINIOS[domId].cartas.all().filter(c => !c.free).map(c => ({id:c.id, name:c.name, icon:c.icon, formula:c.formula ?? '', desc:c.desc, pista:c.pista ?? ''})); }

class PracticaPropiedades {
  /** @param {HTMLElement} host  @param {{domId:string, cartaId:string, onDone:(key:string)=>void, isDone:(key:string)=>boolean}} o */
  constructor(host, o){ Object.assign(this, {host, ...o}); this.dom = DOMINIOS[o.domId]; this.carta = this.dom.cartas.get(o.cartaId); this.estado = {}; this.lista = ejerciciosDeCarta(o.domId, o.cartaId); host.onclick = e => this.click(e); }
  key(i){ return `p-${this.domId}-${this.cartaId}-${i}`; }
  tex(t, display = true){ return window.katex ? katex.renderToString(t, {displayMode:display, throwOnError:false, strict:false, trust:c => c.command === '\\htmlData'}) : t; }
  render(){
    const c = this.carta;
    this.host.innerHTML = `
      <div class="flex justify-center py-2">${cartaHTML(c, this.dom, {attr:''})}</div>
      ${this.lista.length ? this.lista.map((ex, i) => this.ejercicio(ex, i)).join('') : '<p>No se pudieron generar ejercicios para esta carta.</p>'}`;
  }
  ejercicio(ex, i){
    const st = this.estado[i] ??= {fase:0, opciones:null, msg:null}, hecho = this.isDone(this.key(i));
    const marcas = st.fase >= 1 ? new Map(ex.objetivos.flatMap((p, j) => this.carta.marcas(ex.raiz, p).map(q => [q.join('.'), j]))) : null;
    const pasoTxt = ['Toca la carta para usarla.', ex.objetivos.length > 1 ? 'Toca en la expresión DÓNDE aplicarla (cualquier parte marcada).' : 'Toca la parte marcada.', this.carta.opcionesCortas ? '¿Cuánto da juntar los términos marcados? Elige el resultado.' : '¿Qué queda después de aplicarla? Elige el resultado.', '¡Correcto!'][st.fase];
    return `<div class="mt-4 rounded-2xl border border-stone-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900" data-ex="${i}">
      <div class="flex items-center gap-2 text-sm"><b>🃏 Ejercicio ${i + 1}</b><span class="ml-auto text-stone-500 dark:text-zinc-400">${hecho ? '✅ Resuelto' : `${Math.min(st.fase, 3)}/3`}</span></div>
      <div class="mt-2 flex min-h-16 items-center justify-center overflow-x-auto rounded-xl bg-stone-100 px-2 text-lg dark:bg-zinc-950 [&_[data-t]]:cursor-pointer [&_[data-t]]:rounded-md [&_[data-t]]:bg-amber-300/40 [&_[data-t]]:outline [&_[data-t]]:outline-2 [&_[data-t]]:outline-amber-400 [&_[data-t='1']]:bg-sky-300/40 [&_[data-t='1']]:outline-sky-400 [&_[data-t='2']]:bg-fuchsia-300/40 [&_[data-t='2']]:outline-fuchsia-400" data-expr="${i}">${this.tex(this.dom.tex(st.fase === 3 ? ex.correcto : ex.raiz, st.fase === 1 ? marcas : st.fase === 2 && st.j != null ? new Map(this.carta.marcas(ex.raiz, ex.objetivos[st.j]).map(q => [q.join('.'), 0])) : null))}</div>
      <p class="mt-2 text-sm font-semibold">${st.fase + 1 <= 3 ? `Paso ${st.fase + 1}: ` : ''}${pasoTxt}</p>
      ${st.fase === 0 ? `<button data-usar="${i}" class="mt-2 inline-flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-r ${GRAD[this.dom.id]} px-4 font-bold text-white touch-manipulation active:scale-95">${this.carta.icon} Usar «${this.carta.name}»</button>` : ''}
      ${st.fase === 2 ? `<div class="mt-2 grid gap-2">${st.opciones.map((o, j) => `<button data-op="${i}|${j}" class="flex min-h-14 items-center justify-center overflow-x-auto rounded-xl border-2 border-stone-200 bg-white px-3 text-lg touch-manipulation active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-950">${this.tex(this.dom.tex(o.vista ?? o), false)}</button>`).join('')}</div>` : ''}
      ${st.msg ? `<p class="mt-2 rounded-xl px-3 py-2 text-sm ${st.msg.ok ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200'}">${st.msg.t}</p>` : ''}
      ${st.fase === 3 ? `<button data-otra="${i}" class="mt-2 text-sm text-blue-700 underline dark:text-blue-300">↻ Repetir</button>` : ''}
    </div>`;
  }
  click(e){
    const u = e.target.closest('[data-usar]'), op = e.target.closest('[data-op]'), t = e.target.closest('[data-t]'), otra = e.target.closest('[data-otra]');
    if (u){ const i = +u.dataset.usar, ex = this.lista[i], st = this.estado[i]; st.msg = null;
      if (ex.objetivos.length === 1) return this.elegirLugar(i, 0);
      st.fase = 1; return this.render(); }
    if (t){ const i = +t.closest('[data-expr]').dataset.expr; if (this.estado[i].fase === 1) return this.elegirLugar(i, +t.dataset.t); }
    if (op){ const [i, j] = op.dataset.op.split('|').map(Number), st = this.estado[i], ex = this.lista[i];
      if (st.opciones[j] === st.correcto || st.opciones[j].ok){ st.fase = 3; st.msg = {ok:true, t:`Bien: así funciona <b>${this.carta.name}</b>. ${this.carta.pista ?? ''}`}; this.onDone(this.key(i)); }
      else { st.msg = {ok:false, t:'Ese resultado tiene un error. Revisa signos, coeficientes y exponentes y vuelve a intentarlo.'}; }
      return this.render(); }
    if (otra){ delete this.estado[+otra.dataset.otra]; return this.render(); }
  }
  elegirLugar(i, j){
    const ex = this.lista[i], st = this.estado[i];
    const correcto = this.carta.apply(ex.raiz, ex.objetivos[j]);
    st.correcto = correcto; st.fase = 2; st.msg = null; st.j = j;   // se sigue marcando el grupo elegido
    if (this.carta.opcionesCortas){                                     // semejantes: solo el resultado del grupo
      const o = this.carta.opcionesCortas(ex.raiz, ex.objetivos[j], new Rng(semillaDe(this.key(i) + j)), 2);
      st.opciones = new Rng(semillaDe('o' + i + j)).shuffle([{vista:o.correcta, ok:true}, ...o.distractores.map(v => ({vista:v}))]);
    } else st.opciones = new Rng(semillaDe('o' + i + j)).shuffle([correcto, ...this.dom.distractores(correcto, new Rng(semillaDe(this.key(i) + j)), 2)]);
    this.render();
  }
}
/** Propiedades del juego aplicables a lo armado en el lienzo de Aprender (solo Fundamentos: ecuaciones y expresiones). */
function propiedadesParaLienzo(src){
  let raiz; try { raiz = parsePieces(src); } catch { return []; }
  const dom = DOMINIOS.fund;
  return dom.mano(raiz).filter(c => !c.free).flatMap(c => c.targets(raiz).slice(0, 1).map(p => {
    let nueva; try { nueva = normalize(c.apply(raiz, p)); } catch { return null; }
    return {id:c.id, name:c.name, icon:c.icon, piezas:piezasFund(nueva)};
  }).filter(Boolean));
}
