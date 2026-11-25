/* =====================================================================
   DEFENSA ALGEBRAICA · 4) Interfaz y escenas (patrón State)
   GameApp cambia entre escenas: Menú, Cómo jugar, Mejoras, Batalla, Resultado.
   La batalla coordina (Mediator): problema matemático → energía → mundo 2D.
   Dependencias inyectadas por constructor (DIP): progreso de Aprender, salida, paleta de piezas.
   ===================================================================== */
const UI = {
  btn:  'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-semibold text-zinc-100 touch-manipulation select-none transition-transform active:scale-95 disabled:opacity-40',
  btnP: 'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 font-bold text-zinc-950 touch-manipulation select-none transition-transform active:scale-95 disabled:opacity-40',
  card: 'rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3',
};
/** Chips de colores con las propiedades de un bonificador. */
const TONO_PROP = {objetivo:'bg-rose-900/70 text-rose-200', alcance:'bg-sky-900/70 text-sky-200', dano:'bg-amber-900/70 text-amber-200', movimiento:'bg-violet-900/70 text-violet-200', efecto:'bg-cyan-900/70 text-cyan-200', afecta:'bg-emerald-900/70 text-emerald-200'};
const chipsProps = props => Object.entries(props ?? {}).map(([k, v]) =>
  `<span class="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${TONO_PROP[k] ?? 'bg-zinc-800 text-zinc-300'}">${PROPIEDADES[k].icon} ${PROPIEDADES[k].vals[v]}</span>`).join(' ');
const pips = (n, max = 3) => `<span class="tracking-tight ${n > 3 ? 'text-amber-300' : 'text-emerald-400'}">${'●'.repeat(Math.min(n, 4))}<span class="text-zinc-600">${'●'.repeat(Math.max(0, max - n))}</span></span>`;
const texJuego = (tex, display = true) => window.katex
  ? katex.renderToString(tex, {displayMode:display, throwOnError:false, strict:false, trust:c => c.command === '\\htmlData'})
  : tex;

class Scene { constructor(app){ this.app = app; } enter(){} exit(){} pause(){} resume(){} }

class GameApp {
  /** @param {HTMLElement} root  @param {{doneKeys:()=>string[], onExit:()=>void, piezas:TableroPiezas}} deps */
  constructor(root, deps){
    Object.assign(this, {root, ...deps});
    this.progreso = new Progreso(new SaveRepository());
    this.rng = new Rng();
    this.problemas = new ProblemFactory(DOMINIOS, this.rng);
    this.ruta = new Ruta(this.progreso, () => this.doneKeys());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.scene?.pause(); });
  }
  go(scene){
    this.scene?.exit(); this.scene = scene;
    // La batalla ocupa toda la pantalla; los menús dejan ver la barra superior y la inferior de la app
    this.root.classList.toggle('juego-menu', !(scene instanceof BattleScene));
    scene.enter();
  }
  open(){ this.root.classList.remove('hidden'); if (!this.scene) this.go(new MenuScene(this)); }
  /** Empieza una partida normal en la modalidad indicada (o la última usada). */
  nuevaPartida(modo = this.progreso.data.modo){ this.progreso.data.modo = modo; this.progreso.guardar(); this.go(new BattleScene(this, new Run(this))); }
  /** Abre una sección del menú del juego (la elige la barra de navegación de la app). */
  mostrar(seccion){
    const S = {inicio:MenuScene, catalogo:CatalogoScene, mazo:MazoScene, peloton:PelotonScene, mejoras:MejorasScene, ayuda:HelpScene, config:MenuScene, mas:MejorasScene, partidas:MenuScene}[seccion] ?? MenuScene;
    this.root.classList.remove('hidden');
    if (this.scene instanceof BattleScene && !this.scene.terminado) return;      // no se interrumpe una batalla
    if (!this.ruta.jugable && S !== HelpScene) return this.go(new BloqueoScene(this));   // el juego se abre en el nivel mínimo de la Ruta (el tutorial siempre se ve)
    if (!(this.scene instanceof S) || S === MenuScene) this.go(new S(this));
  }
  close(){ this.scene?.pause(); this.root.classList.add('hidden'); }
  html(s){ this.root.innerHTML = s; return this.root; }
  /* Desbloqueos: modo desarrollo, Ruta o avance en Aprender */
  tipoDesbloqueado(t){ return !!this.progreso.data.todo || this.ruta.tipos().has(t.id); }   // solo la Ruta (en orden) desbloquea
  cartaDesbloqueada(id){
    if (this.progreso.data.todo) return true;
    return Object.values(DOMINIOS).some(d => d.tipos.some(t => (CARTAS_DE_TIPO[t.id] ?? []).includes(id) && this.tipoDesbloqueado(t)));
  }
  soldadoDesbloqueado(id){ return !!this.progreso.data.todo || this.ruta.soldados().has(id); }
  bonusDesbloqueado(id){ return !!this.progreso.data.todo || this.ruta.bonus().has(id); }
  /** El pelotón personalizado se desbloquea en la Ruta (misiones avanzadas) o en modo desarrollo. */
  pelotonDisponible(){ return !!this.progreso.data.todo || this.ruta.hitos().some(h => h.peloton && h.ok); }
  pelotonActivo(){ return this.pelotonDisponible() && !!this.progreso.data.peloton?.orden?.length; }
  dificultadDesbloqueada(id){ return !!this.progreso.data.todo || this.ruta.difs().has(id); }
}

/* ---------- Menú: ver 7-hub.js ---------- */
const MODOS = [['fund', '🧱', 'Fundamentos'], ['alg', '🔺', 'Potencias, log y trig'], ['dif', '📈', 'Diferencial'], ['int', '∫', 'Integral'], ['todo', '🌐', 'Todo junto']];

class Run {
  constructor(app){
    const p = app.progreso;
    this.loadout = new Loadout();
    this.vidaBase = 100 + p.total('vida');
    this.base = new Base(this.vidaBase);
    this.energia = new Energia(30 + p.total('energia'));
    this.extraSoldados = p.total('soldados');
    this.xpMult = 1 + p.total('xp');
    // Cartas compuestas: solo las que armaste en 🃏 Mazo (viajan a todas las partidas y se usan sin límite)
    this.combos = Object.entries(p.data.mazo).flatMap(([dominio, l]) => l.map(c => new Combo({...c, dominio, mazo:true})));
    this.loadout.potencia = id => p.nivel('tac-' + id);
    this.loadout.permitido = id => app.bonusDesbloqueado(id);          // la Ruta decide qué bonificadores aparecen
    this.proceso = [];                                                 // cada paso dado (se guarda con la partida)
    this.energiaPaso = 1 + p.total('energiaPaso'); this.ventanaExtra = p.total('ventana');
    Object.assign(this, {mision:1, oleada:1, nivel:1, xp:0, xpTotal:0, problemas:0, eficientes:0, bajas:0, jefes:0, combosUsados:0, puntosMisiones:0});
  }
  get xpSiguiente(){ return xpParaNivel(this.nivel); }
  combosDe(dom){ return this.combos.filter(c => c.dominio === dom); }
}

/* ---------- Cartas (diseño) ---------- */
const GRAD = {fund:'from-sky-400 to-indigo-500', alg:'from-orange-400 to-rose-500', dif:'from-emerald-400 to-teal-600', int:'from-fuchsia-400 to-violet-600', libre:'from-amber-300 to-orange-500', combo:'from-rose-400 to-amber-400', nuevo:'from-zinc-500 to-zinc-700'};
const ktMini = tex => window.katex ? katex.renderToString(tex, {throwOnError:false, strict:false}) : tex;
function cartaHTML(c, dom, {sel = false, attr = `data-carta="${c.id}"`, chica = false, marca = null} = {}){
  const tag = attr ? 'button' : 'div';     // sin acción es solo una imagen: un <button> dentro de otro rompe el diseño (catálogo)
  const g = c.free ? GRAD.libre : GRAD[dom.id];
  const ayuda = marca === 'mejor' ? 'ring-4 ring-amber-300 animate-pulse' : marca === 'aplica' ? 'ring-2 ring-emerald-300/80' : '';
  return `<${tag} ${attr} data-arte class="relative ${chica ? 'h-[7.5rem] w-[5.4rem]' : 'h-[9.6rem] w-[6.7rem]'} shrink-0 rounded-2xl bg-gradient-to-br ${g} p-[2px] text-left shadow-lg shadow-black/50 touch-manipulation select-none transition-transform active:scale-95 ${sel ? '-translate-y-2 ring-2 ring-amber-300' : ayuda}">
    ${marca === 'mejor' ? '<span class="absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-amber-300 px-2 text-[9px] font-black text-zinc-950">SIGUIENTE</span>' : ''}
    <span class="flex h-full flex-col rounded-[14px] bg-zinc-950/95 p-1.5">
      <span class="${chica ? 'text-[8px]' : 'text-[9.5px]'} font-black uppercase leading-tight tracking-wide text-white">${c.name}</span>
      ${vitrina3D() ? (Emblemas.vigilar(), `<canvas data-emblema="${c.icon}" data-color="${COLOR_AREA[c.free ? 'libre' : dom.id] ?? '#6366f1'}" aria-label="${c.icon}" class="mx-auto mt-0.5 block ${chica ? 'h-10 w-10' : 'h-14 w-14'} drop-shadow-[0_4px_8px_rgba(0,0,0,.6)]"></canvas>`)   // emblema 3D
        : `<span class="mx-auto mt-1 flex ${chica ? 'h-8 w-8 text-lg' : 'h-11 w-11 text-2xl'} items-center justify-center rounded-full bg-gradient-to-br ${g} shadow-inner shadow-black/40">${c.icon}</span>`}
      <span class="mt-1 flex min-h-6 items-center justify-center overflow-hidden text-center ${chica ? 'text-[8px]' : 'text-[9.5px]'} text-zinc-100">${ktMini(c.formula ?? '')}</span>
      ${chica ? '' : `<span class="mt-auto text-center text-[8px] leading-tight text-zinc-400">${c.desc}</span>`}
    </span></${tag}>`;
}
function comboHTML(cb, dom){
  const iconos = cb.cartas.map(id => dom.cartas.get(id)?.icon ?? '?').join('<span class="text-zinc-500">›</span>');
  return `<button data-combo="${cb.id}" data-arte class="relative h-[9.6rem] w-[6.7rem] shrink-0 rounded-2xl bg-gradient-to-br ${GRAD.combo} p-[2px] text-left shadow-lg shadow-black/50 touch-manipulation select-none transition-transform active:scale-95 ">
    <span class="flex h-full flex-col rounded-[14px] bg-zinc-950/95 p-1.5">
      <span class="text-[9.5px] font-black uppercase leading-tight tracking-wide text-amber-200">🔗 ${cb.nombre}</span>
      ${vitrina3D() ? (Emblemas.vigilar(), `<canvas data-emblema="🔗" data-color="${COLOR_AREA.combo}" aria-hidden="true" class="mx-auto block h-12 w-12"></canvas>`) : ''}
      <span class="mt-1 flex flex-wrap items-center justify-center gap-0.5 text-base leading-none">${iconos}</span>
      <span class="mt-auto text-center text-[8px] leading-tight text-zinc-400">🃏 Carta compuesta · sin límite</span>
    </span></button>`;
}

/* ---------- Batalla ---------- */
class BattleScene extends Scene {
  constructor(app, run){ super(app); this.run = run; this.bus = new EventBus(); this.puntuador = new Puntuador([new ReglaVelocidad(), new ReglaCombo(), new ReglaCadena(), new ReglaCreatividad()]); }
  enter(){
    const r = this.run;
    this.app.progreso.nuevos = [];                                   // novedades de esta partida
    this.app.html(`
    <div class="relative flex h-full flex-col bg-zinc-950 text-zinc-100">
      <div class="flex items-center gap-2 px-3 pb-1.5 pt-[max(0.5rem,env(safe-area-inset-top))] text-xs">
        <button data-a="pausa" class="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700 text-base" aria-label="Pausa">⏸</button>
        <button data-a="vel" data-h="vel" class="flex h-9 min-w-11 items-center justify-center rounded-xl border border-zinc-700 px-1.5 text-sm font-black" aria-label="Velocidad del juego">×1</button>
        <div class="flex-1"><div class="flex justify-between gap-2"><b data-h="oleada"></b><span data-h="probs"></span></div>
          <div class="mt-1 flex items-center gap-1.5"><span>Nv <b data-h="nivel"></b></span><div class="h-1.5 flex-1 overflow-hidden rounded bg-zinc-800"><div data-h="xp" class="h-full bg-sky-400"></div></div><span data-h="clima" class="rounded-full bg-zinc-800 px-2 py-0.5"></span></div>
          <div class="mt-1 flex items-center gap-1.5"><span>🌊</span><div class="h-2 flex-1 overflow-hidden rounded bg-zinc-800"><div data-h="ola" class="h-full rounded bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-[width] duration-300"></div></div><b data-h="olaN" class="w-9 text-right tabular-nums">0 %</b></div></div>
      </div>
      <div class="relative mx-auto w-full max-w-3xl"><canvas data-h="cv" class="block aspect-[360/200] max-h-[38vh] w-full"></canvas>
        <div data-h="jefe" class="pointer-events-none absolute inset-x-3 top-1.5 hidden"><div class="flex justify-between text-[10px] font-bold text-rose-200"><span data-h="jefeN"></span><span data-h="jefeE"></span></div><div class="h-1.5 overflow-hidden rounded bg-black/60"><div data-h="jefeV" class="h-full bg-rose-500"></div></div></div>
        <div data-h="aviso" class="pointer-events-none absolute inset-x-0 top-1/3 px-2 text-center text-lg font-black text-white drop-shadow"></div></div>
      <div data-h="tipos" class="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 pt-1.5 text-[10px]"></div>
      <div class="grid grid-cols-2 gap-2 px-3 pt-1.5 text-xs">
        <div class="flex items-center gap-1.5">❤<div class="h-2.5 flex-1 overflow-hidden rounded bg-zinc-800"><div data-h="vida" class="h-full bg-emerald-500"></div></div></div>
        <div class="flex items-center gap-1.5">⚡<div class="h-2.5 flex-1 overflow-hidden rounded bg-zinc-800"><div data-h="energia" class="h-full bg-amber-400"></div></div><b data-h="energiaN" class="w-6 text-right"></b></div>
      </div>
      <div data-h="zona" class="relative flex min-h-0 flex-1 flex-col">
        <div class="flex min-h-0 flex-1 flex-col px-3 pt-1.5">
          <div class="flex items-center justify-between gap-2 text-xs text-zinc-400"><span data-h="tipo"></span><span class="flex items-center gap-2"><span data-h="pasos"></span><button data-a="pista" data-h="btnPista" class="hidden rounded-full border border-sky-500/60 bg-sky-500/10 px-2 py-1 text-sky-200 touch-manipulation">💡 Pista</button></span></div>
          <div data-h="expr" class="mt-1 flex min-h-16 items-center justify-center overflow-x-auto rounded-2xl bg-zinc-900 px-2 text-xl text-white [&_[data-mejor]]:!bg-emerald-400/40 [&_[data-mejor]]:!outline-emerald-300 [&_[data-t]]:cursor-pointer [&_[data-t]]:rounded-md [&_[data-t]]:bg-amber-400/30 [&_[data-t]]:outline [&_[data-t]]:outline-2 [&_[data-t]]:outline-amber-300 [&_[data-t='1']]:bg-sky-400/30 [&_[data-t='1']]:outline-sky-300 [&_[data-t='2']]:bg-fuchsia-400/30 [&_[data-t='2']]:outline-fuchsia-300 [&_[data-t='3']]:bg-lime-400/30 [&_[data-t='3']]:outline-lime-300"></div>
          <div data-h="msg" class="min-h-9 py-1 text-center text-sm"></div>
        </div>
        <div data-h="quiz" class="hidden px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"></div>
        <div data-h="mano" class="flex gap-2 overflow-x-auto px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-4 [scrollbar-width:none]"></div>
        <div data-h="libre" class="absolute inset-0 z-10 hidden"></div>
      </div>
      <div data-h="capa" class="absolute inset-0 z-20 hidden"></div>
    </div>`);
    this.$ = n => this.app.root.querySelector(`[data-h="${n}"]`);
    this.app.piezas.host = () => this.$('libre');                  // el paso libre vive dentro de la batalla
    this.renderer = crearRenderer(this.$('cv'));                  // 3D (Three.js) o 2D según ⚙️ Configuración
    this.onResize = () => this.renderer.resize(); window.addEventListener('resize', this.onResize);
    this.bus.on('enemigo-muerto', ({xp, jefe, por}) => { r.bajas++; if (jefe) r.jefes++; if (por) this.ganarXPTipo(por, xp); this.ganarXP(xp * 0.25); });   // la baja da XP al tipo de soldado que la hizo
    this.bus.on('xp-tipo', ({tipo, xp}) => this.ganarXPTipo(tipo, xp));
    this.bus.on('base-destruida', () => this.fin(false));
    this.app.root.onclick = e => this.click(e);
    this.iniciarOleada();
    this.pausado = false; this.ultimo = performance.now(); this.t = 0;
    this.loop = this.loop.bind(this); this.raf = requestAnimationFrame(this.loop);
  }
  exit(){ this.terminado = true; cancelAnimationFrame(this.raf); window.removeEventListener('resize', this.onResize); this.app.piezas.cerrar(); this.renderer.dispose?.(); }
  pause(){ if (!this.terminado && !this.capaAbierta) this.mostrarPausa(); }

  iniciarOleada(){
    const r = this.run;
    const df = dificultad(this.app.progreso.data.dificultad);
    this.cfg = configOleada(r.mision, r.oleada);
    if (r.mundo){                                                      // misión de un mundo: sus alienígenas y su Comandante/Soberano
      const M = mundoDe(r.mundo), idx = MUNDOS_JUEGO.indexOf(M);
      this.cfg.extra = aparicionMundo(M, r.mm);
      this.cfg.jefe = r.oleada === OLEADAS ? (r.mm < 4 ? M.comandantes[r.mm].id : M.soberano.id) : null;
      this.cfg.velocidad *= 1 + idx * 0.03;                           // cada mundo es un poco más ágil; la dificultad la ponen sus cálculos
    }
    Object.assign(this.cfg, {velocidad:this.cfg.velocidad * df.vel, vida:this.cfg.vida * df.vida, minimo:Math.round(this.cfg.minimo * df.cantidad), intervalo:this.cfg.intervalo / df.cantidad});
    this.director = new WaveDirector(this.cfg, this.app.rng);
    const P = this.app.progreso;
    this.mundo ??= new World({bus:this.bus, loadout:r.loadout, energia:r.energia, base:r.base, extraSoldados:r.extraSoldados, mej:id => P.nivel(id), torreta:P.total('torreta'), soldadosOk:id => this.app.soldadoDesbloqueado(id), perfil:uid => perfilSoldado(P, uid), titular:tipo => titularDe(this.app, tipo), potencia:armaId => efectoPotencia(r, armaId), fx:armaId => fxDisparo(r, armaId), fusionesDe:armaId => (r.fusionesArma ?? []).filter(id => FUSIONES_ARMA[id]?.arma === armaId).length, peloton:this.app.pelotonActivo() ? P.data.peloton : null});
    const clima = r.mision === 1 && r.oleada === 1 ? 'despejado' : this.app.rng.pick(CLIMAS_ROTACION);
    this.mundo.ponerClima(clima);
    const C = CLIMAS[clima];
    this.aviso(`Misión ${r.mision} · Oleada ${r.oleada}${this.cfg.jefe ? ' · 👹 JEFE' : ''}\n${C.icon} ${C.name}: ${C.desc}`);
    if (r.pendiente){ this.retomar(r.pendiente); r.pendiente = null; }  // partida cargada: sigue con su problema
    else if (!this.raiz || this.resuelto) this.nuevoProblema(); else this.dibujarMano();   // el problema en curso se conserva hasta resolverlo
  }
  nuevoProblema(){
    const d = this.app.progreso.data;
    const extra = {recluta:-1, soldado:0, veterano:1, leyenda:2}[d.dificultad ?? 'soldado'] ?? 0;   // la dificultad adelanta los tipos difíciles
    const inf = this.run.infinito, ok = inf ? t => this.run.tipos.has(t.id) : t => this.app.tipoDesbloqueado(t);   // modo infinito: solo las operaciones elegidas
    const {type, dom, root, par, solucion} = this.app.problemas.create({doneKeys:this.app.doneKeys(), mision:Math.max(1, Math.min(3, this.run.mision + extra)), modo:inf ? 'todo' : d.modo, todo:d.todo, ok});
    this.prepararProblema({type, dom, root, par, solucion, pasos:0});
  }
  /** Retoma el problema de una partida guardada. */
  retomar(pd){
    const par = pd.dom.solver.distance(pd.raiz);
    this.prepararProblema({type:pd.tipo, dom:pd.dom, root:pd.raiz, par:pd.par ?? par, solucion:pd.dom.solver.resolver(pd.raiz), pasos:pd.pasos ?? 0, inicio:pd.inicio, dist:par});
  }
  prepararProblema({type, dom, root, par, solucion, pasos, inicio = root, dist = par}){
    Object.assign(this, {tipo:type, dom, solucion, raiz:root, inicio, par, dist, pasos, combo:this.combo ?? 0, carta:null, quiz:null, historial:new Set([dom.key(root)]), tPaso:performance.now(), resuelto:false, pistaMostrada:false, avisoPendiente:false});
    this.$('btnPista').classList.toggle('hidden', !this.ayuda);
    this.dibujarProblema(); this.dibujarMano();
  }

  /* ---- Bucle de juego ---- */
  loop(now){
    const dt = Math.min(0.05, (now - this.ultimo) / 1000); this.ultimo = now;
    if (!this.pausado && !this.terminado){
      const lento = this.app.piezas.abierto ? 0.5 : 1;            // el mundo va más lento mientras escribes un paso libre
      for (let k = 0; k < this.vel && !this.terminado; k++){        // ×2, ×3, ×4: varias actualizaciones por cuadro (estable)
        this.t += dt; this.mundo.update(dt * lento, this.director);
        if (this.director.terminada(this.mundo)) break;
      }
      if (this.mundo.anuncio){ this.aviso(this.mundo.anuncio); this.mundo.anuncio = null; }
      if (this.director.terminada(this.mundo)){
        if (this.resuelto) this.oleadaTerminada();                 // solo se pasa de oleada con el problema resuelto
        else if (!this.avisoPendiente){ this.avisoPendiente = true; this.mensaje('🧮 No quedan enemigos: termina este problema para pasar a la siguiente oleada.', 'amber'); }
      }
      const espera = NIVELES_AYUDA[this.ayuda].espera;
      if (!this.pistaMostrada && !this.resuelto && !this.quiz && !this.capaAbierta && (now - this.tPaso) / 1000 > espera){ this.pistaMostrada = true; this.mostrarPista(); }
    }
    this.renderer.draw(this.mundo, this.t); this.hud();
    this.raf = requestAnimationFrame(this.loop);
  }
  /** Avance de la oleada (0–100): 70 % enemigos eliminados + 30 % problemas resueltos; no llega a 100 con el jefe vivo o el problema sin terminar. */
  progresoOleada(){
    const d = this.director, c = this.cfg, vivos = this.mundo.enemigos.filter(e => !e.jefe).length;
    const total = Math.max(c.minimo, d.generados), eliminados = Math.max(0, d.generados - vivos);
    let p = 0.7 * Math.min(1, eliminados / total) + 0.3 * Math.min(1, d.problemasResueltos / c.problemas);
    if (c.jefe && (d.jefeT !== null || this.mundo.jefe)) p = Math.min(p, 0.9);
    if (!this.resuelto || this.mundo.enemigos.length) p = Math.min(p, 0.98);
    return Math.round(100 * p);
  }
  get vel(){ return this.app.progreso.data.velocidad ?? 1; }
  hud(){
    const r = this.run, b = r.base, j = this.mundo.jefe;
    this.$('oleada').textContent = r.mundo ? `${mundoDe(r.mundo).icon} ${r.mm < 4 ? mundoDe(r.mundo).comandantes[r.mm].name.replace('Comandante ', '') : '👑 ' + mundoDe(r.mundo).soberano.name} · Oleada ${r.oleada}/${OLEADAS}`
      : `${r.infinito ? '♾️ ' : ''}Misión ${r.mision}${r.infinito ? '' : '/' + MISIONES} · Oleada ${r.oleada}/${OLEADAS}`;
    this.$('probs').textContent = `🧮 ${Math.min(this.director.problemasResueltos, this.cfg.problemas)}/${this.cfg.problemas}`;
    const tipos = [...new Set([...this.mundo.tiposSoldado, ...Object.keys(r.xpTipo ?? {})])].filter(t => SOLDADOS[t]);
    const firma = tipos.map(t => `${t}${r.nivelTipo?.[t] ?? 1}`).join();
    if (this.$('tipos').dataset.f !== firma){ this.$('tipos').dataset.f = firma;
      this.$('tipos').innerHTML = tipos.map(t => `<span class="flex items-center gap-1"><span>${SOLDADOS[t].icon}</span><b>${r.nivelTipo?.[t] ?? 1}</b><span class="h-1.5 w-12 overflow-hidden rounded bg-zinc-800"><span data-xt="${t}" class="block h-full bg-emerald-400"></span></span>${r.potPend?.[t] ? `<b class="text-amber-300">+${r.potPend[t]}⚡</b>` : ''}</span>`).join('') + (r.tacPend ? `<b class="text-sky-300">+${r.tacPend} 🧠</b>` : ''); }
    for (const t of tipos){ const el = this.$('tipos').querySelector(`[data-xt="${t}"]`); if (el) el.style.width = `${100 * (r.xpTipo?.[t] ?? 0) / xpTipoSiguiente(r.nivelTipo?.[t] ?? 1)}%`; }
    const pr = this.progresoOleada(); this.$('ola').style.width = `${pr}%`; this.$('olaN').textContent = `${pr} %`;
    this.$('vel').textContent = `×${this.vel}`;
    this.$('nivel').textContent = r.nivel;
    this.$('clima').textContent = `${this.mundo.clima.icon} ${this.mundo.clima.name}`;
    this.$('xp').style.width = `${100 * r.xp / r.xpSiguiente}%`;
    this.$('vida').style.width = `${100 * b.vida / b.vidaMax}%`;
    this.$('energia').style.width = `${r.energia.valor}%`;
    this.$('energiaN').textContent = Math.floor(r.energia.valor);
    this.$('energia').classList.toggle('animate-pulse', this.mundo.sinEnergia);
    this.$('jefe').classList.toggle('hidden', !j);
    if (j){ this.$('jefeN').textContent = `👹 ${j.name}`; this.$('jefeV').style.width = `${100 * Math.max(0, j.vida) / j.vidaMax}%`;
      this.$('jefeE').textContent = j.escudoMental ? (j.escudoT > 0 ? `🧠 escudo abierto ${Math.ceil(j.escudoT)} s` : '🛡 resuelve un problema para abrir su escudo') : ''; }
  }
  aviso(txt){ const el = this.$('aviso'); if (!el) return; /* la batalla ya se cerró */ el.innerHTML = txt.replace('\n', '<br><span class="text-xs font-semibold">') + (txt.includes('\n') ? '</span>' : ''); clearTimeout(this.tAviso); this.tAviso = setTimeout(() => el.textContent = '', 2600); }


  /* ---- Problema y cartas ---- */
  get ayuda(){ return this.app.progreso.data.asistido ?? 0; }
  dibujarProblema(){
    const mejor = this.ayuda >= 3 && this.carta ? this.dom.mejorJugada(this.raiz) : null;
    const marcas = this.carta ? new Map(this.objetivos.flatMap((p, i) => this.carta.marcas(this.raiz, p).map(q => [q.join('.'), mejor && mejor.carta === this.carta && mejor.path.join('.') === p.join('.') ? `${i},mejor=1` : i]))) : (this.quiz?.cortas || this.quiz?.lado) ? new Map(this.quiz.carta.marcas(this.raiz, this.quiz.path).map(q => [q.join('.'), 0])) : null;   // en la pregunta se ve el grupo elegido
    this.$('expr').innerHTML = texJuego(this.dom.tex(this.raiz, marcas));
    this.$('tipo').textContent = (this.director.generando ? '' : '⭐ Extra · ') + `${this.dom.icon} ${this.dom.consigna(this.raiz)}`;   // consigna neutra: no revela el método
    this.$('pasos').textContent = `Pasos ${this.pasos} · mínimo ${this.par}`;
  }
  dibujarMano(){
    const quiz = !!this.quiz;
    this.$('quiz').classList.toggle('hidden', !quiz); this.$('mano').classList.toggle('hidden', quiz);
    if (quiz) return this.dibujarQuiz();
    this.$('mano').innerHTML =
      this.manoConAyuda().join('') +
      this.run.combosDe(this.dom.id).map(cb => comboHTML(cb, this.dom)).join('');   // las cartas compuestas se arman solo en 🃏 Mazo
  }
  /** Sin ayuda todas las cartas se ven igual; con ayuda media se iluminan las que sirven y con alta se marca la mejor. */
  manoConAyuda(){
    const aplica = this.ayuda >= 2 ? this.dom.aplicables(this.raiz) : null, mejor = this.ayuda >= 3 ? this.dom.mejorJugada(this.raiz) : null;
    return this.dom.mano(this.raiz).filter(c => c.free || this.app.cartaDesbloqueada(c.id)).map(c => cartaHTML(c, this.dom, {sel:this.carta === c, marca: mejor?.carta === c ? 'mejor' : aplica?.has(c.id) ? 'aplica' : null}));
  }
  mostrarPista(){
    if (!this.ayuda || this.resuelto) return;
    const m = this.dom.mejorJugada(this.raiz);
    if (!m) return this.mensaje('💡 Prueba con el ✍️ Paso libre.', 'amber');
    const c = m.carta, varios = c.targets(this.raiz).length > 1;
    const txt = this.ayuda === 1 ? `💡 ${c.pista}`
      : this.ayuda === 2 ? `💡 ${c.pista} Prueba con <b>${c.icon} ${c.name}</b>.`
      : `💡 Usa <b>${c.icon} ${c.name}</b> ${ktMini(c.formula ?? '')}${varios ? ' en la parte que se marca en verde.' : '.'}`;
    this.mensaje(txt, 'amber');
  }
  mensaje(html, tono = 'zinc'){
    const color = {zinc:'text-zinc-300', rose:'text-rose-300', amber:'text-amber-300', emerald:'text-emerald-300'}[tono];
    const el = this.$('msg'); if (!el) return; el.innerHTML = html; el.className = `min-h-9 py-1 text-center text-sm ${color}`;
  }

  click(e){
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'pausa') return this.mostrarPausa();
    if (a === 'vel'){ const P = this.app.progreso; P.data.velocidad = this.vel % 4 + 1; P.guardar(); return this.hud(); }   // ×1 → ×2 → ×3 → ×4 → ×1
    if (a === 'pista'){ this.pistaMostrada = true; return this.mostrarPista(); }
    if (a === 'quiz-no'){ this.quiz = null; this.carta = null; this.cadena = null; this.dibujarProblema(); this.dibujarMano(); return this.mensaje(''); }
    const op = e.target.closest('[data-opcion]')?.dataset.opcion;
    if (op != null && this.quiz) return this.elegirOpcion(+op);
    const cb = e.target.closest('[data-combo]')?.dataset.combo;
    if (cb) return this.usarCombo(this.run.combos.find(c => c.id === cb));
    const cid = e.target.closest('[data-carta]')?.dataset.carta;
    if (cid) return this.jugarCarta(this.dom.cartas.get(cid));
    const t = e.target.closest('[data-t]');
    if (t && this.carta){ const path = this.objetivos[+t.dataset.t], c = this.carta; this.carta = null; return this.resultadoDe(c, path); }
  }
  jugarCarta(c){
    this.cadena = null;                                              // tocar otra carta cancela la carta compuesta en curso
    if (this.carta === c){ this.carta = null; this.dibujarProblema(); this.dibujarMano(); return this.mensaje(''); }
    if (c.free) return this.abrirLibre();
    const objs = c.targets(this.raiz);
    if (!objs.length){ this.combo = 0; return this.mensaje(`${c.icon} <b>${c.name}</b> no se puede aplicar aquí.`, 'rose'); }
    if (objs.length === 1) return this.resultadoDe(c, objs[0]);
    this.carta = c; this.objetivos = objs;
    this.dibujarProblema(); this.dibujarMano();
    this.mensaje(c.id === 'seme' ? 'Elige qué grupo juntar: toca uno de sus términos (se resaltan juntos).' : c.id === 'dist' ? 'Toca el <b>polinomio</b> (el paréntesis marcado) al que aplicas la distributiva.' : `Toca en la expresión dónde aplicar <b>${c.name}</b>.`, 'amber');
  }
  /** Semiautomático: el jugador elige cuál es el resultado correcto de aplicar la carta. */
  resultadoDe(c, path){
    if (c.id === 'dist'){ this.aplicar(c.apply(this.raiz, path), {carta:c}); return this.seguirCombo(); }   // distributiva: elegido el polinomio, se aplica sin preguntar
    if (c.id === 'mover' && this.raiz instanceof Eq){   // guiado: ¿el término llega positivo o negativo al otro lado?
      const t = this.raiz.children[path[0]].terms[path[1]], llega = negate(t), opuesto = t;
      const neg = n => this.dom.tex(n).trim().startsWith('-');
      const ops = [llega, opuesto].sort((a, b) => neg(a) - neg(b));     // primero el positivo, luego el negativo
      this.quiz = {lado:true, carta:c, path, correcta:ops.indexOf(llega), opciones:ops.map(n => ({texto:`${neg(n) ? '➖ Pasa negativo' : '➕ Pasa positivo'} &nbsp; ${texJuego(this.dom.tex(n), false)}`}))};
      this.dibujarProblema(); this.dibujarMano();
      return this.mensaje(`🃏 <b>Pasar al otro lado</b>: el término marcado, ¿pasa positivo o negativo?`, 'amber');
    }
    if (c.id === 'div' && this.raiz instanceof Eq){        // guiado: el número pasa a dividir con su mismo signo
      const k = new Num(this.raiz.children[path[0]].k), neg = k.q.n < 0;
      const pos = neg ? negate(k) : k, ops = [pos, negate(pos)];
      this.quiz = {lado:true, carta:c, path, correcta:neg ? 1 : 0, error:'❌ Al pasar a dividir, el número conserva su signo: si multiplica positivo, divide positivo; si multiplica negativo, divide negativo.',
        opciones:ops.map((n, i) => ({texto:`${i ? '➖ Divide negativo' : '➕ Divide positivo'} &nbsp; ${texJuego(this.dom.tex(n), false)}`}))};
      this.dibujarProblema(); this.dibujarMano();
      return this.mensaje(`🃏 <b>Dividir ambos lados</b>: el número que multiplica pasa a dividir. ¿Con qué signo queda?`, 'amber');
    }
    const correcto = c.apply(this.raiz, path);
    if (c.opcionesCortas && this.app.progreso.data.semi){                // solo el resultado del grupo, no toda la expresión
      const o = c.opcionesCortas(this.raiz, path, this.app.rng, this.ayuda >= 3 ? 1 : 2);
      this.quiz = {carta:c, correcto, cortas:true, path, opciones:this.app.rng.shuffle([{vista:o.correcta, ok:true}, ...o.distractores.map(v => ({vista:v}))])};
      this.dibujarProblema(); this.dibujarMano();
      return this.mensaje(`¿Cuánto da juntar los términos marcados con <b>${c.icon} ${c.name}</b>?`, 'amber');
    }
    const distr = this.app.progreso.data.semi ? this.dom.distractores(correcto, this.app.rng, this.ayuda >= 3 ? 1 : 2) : [];
    if (!distr.length) return this.aplicar(correcto, {carta:c});
    this.quiz = {carta:c, correcto, opciones:this.app.rng.shuffle([correcto, ...distr])};
    this.dibujarProblema(); this.dibujarMano();
    this.mensaje(`¿Qué queda al aplicar <b>${c.icon} ${c.name}</b>?${this.ayuda >= 2 ? ` <span class="text-zinc-300">${ktMini(c.formula ?? '')}</span>` : ''}`, 'amber');
  }
  dibujarQuiz(){
    const q = this.quiz;
    this.$('quiz').innerHTML = `<div class="grid gap-2">${q.opciones.map((o, i) => `
      <button data-opcion="${i}" class="flex min-h-14 items-center justify-center overflow-x-auto rounded-2xl border-2 border-zinc-700 bg-zinc-900 px-3 text-lg touch-manipulation active:scale-[0.98] transition-transform">${o.texto ?? texJuego(this.dom.tex(o.vista ?? o), false)}</button>`).join('')}
      <button data-a="quiz-no" class="${UI.btn} !min-h-10 text-sm">Cancelar</button></div>`;
  }
  elegirOpcion(i){
    const q = this.quiz; this.quiz = null;
    if (q.lado){                                                       // elegir el lado: el correcto es el contrario al del término
      if (i === q.correcta){ this.aplicar(q.carta.apply(this.raiz, q.path), {carta:q.carta}); return this.seguirCombo(); }   // el signo decide el resultado: se aplica solo
      this.combo = 0; this.cadena = null; this.dibujarProblema(); this.dibujarMano();
      return this.mensaje(q.error ?? '❌ Al pasar al otro lado el término cambia de signo: lo que suma pasa restando y lo que resta pasa sumando.', 'rose');
    }
    if (q.cortas ? q.opciones[i]?.ok : q.opciones[i] === q.correcto) return this.aplicar(q.correcto, {carta:q.carta});
    this.combo = 0; this.pasos++;
    this.dibujarProblema(); this.dibujarMano();
    this.mensaje(`❌ Ese resultado tiene un error (revisa signos, exponentes y coeficientes). Sin energía.`, 'rose');
  }

  /* ---- Combos ---- */
  /* ---- Cartas compuestas (se arman en 🃏 Mazo, se usan sin límite) ---- */
  usarCombo(cb){
    if (!cb) return;
    cb.cartas.forEach(id => this.app.progreso.descubrir('cartas', id)); this.run.combosUsados++;
    this.cadena = {cb, i:0, hechos:0};
    this.seguirCombo();
  }
  /** Ejecuta la carta compuesta carta por carta; «Pasar al otro lado» se detiene a preguntar (término y signo). */
  seguirCombo(){
    const C = this.cadena; if (!C || this.resuelto) return (this.cadena = null);
    while (C.i < C.cb.cartas.length){
      const carta = this.dom.cartas.get(C.cb.cartas[C.i++]); if (!carta) continue;
      let objs = carta.targets(this.raiz); if (!objs.length) continue;
      if (carta.id === 'div' && this.raiz instanceof Eq){ C.hechos++; return this.resultadoDe(carta, objs[0]); }   // pregunta el signo
      if (carta.id === 'mover' && this.raiz instanceof Eq){
        const conX = n => [...walk(n)].some(([m]) => m instanceof X);
        const utiles = objs.filter(([sd, k]) => { const t = this.raiz.children[sd].terms[k]; return conX(t) ? sd === 1 : conX(this.raiz.children[sd]); });
        if (!utiles.length) continue;                                  // ya no hay nada útil que pasar: se salta este paso
        objs = utiles;
        C.hechos++;
        if (objs.length === 1) return this.resultadoDe(carta, objs[0]);
        this.carta = carta; this.objetivos = objs; this.dibujarProblema(); this.dibujarMano();
        return this.mensaje(`🔗 <b>${C.cb.nombre}</b> · paso ${C.i}/${C.cb.cartas.length}: toca el término que <b>pasa al otro lado</b>.`, 'amber');
      }
      C.hechos++;
      this.aplicar(carta.apply(this.raiz, objs[0]), {carta, cadena:true});
      if (this.resuelto || this.cadena !== C) return (this.cadena = null);
    }
    this.cadena = null;
    if (!C.hechos) this.mensaje(`🔗 <b>${C.cb.nombre}</b> no se pudo aplicar aquí.`, 'rose');
  }
  abrirLibre(){
    this.app.piezas.abrir({
      expr: this.dom.tex(this.raiz), piezas: this.dom.piezas(this.raiz), ayuda: this.dom.ayudaLibre(this.raiz),
      prellenar: this.dom.prellenar(this.raiz), vista: src => this.dom.vista(src),
      confirmar: src => this.pasoLibre(src), cancelar: () => {},
    });
  }
  /** Devuelve un mensaje de error o null si el paso libre fue aceptado. */
  pasoLibre(src){
    const r = this.dom.libre(src, this.raiz, this.solucion);
    if (r.error) return r.error;
    if (!Number.isFinite(this.dom.solver.distance(r.raiz))) return 'Es correcto, pero no puedo seguir desde esa forma. Prueba escribirlo de otra manera.';
    this.aplicar(r.raiz, {libre:true});
    return null;
  }
  aplicar(nueva, {carta = null, libre = false, cadena = false} = {}){
    const r = this.run, k = this.dom.key(nueva), d = this.dom.solver.distance(nueva);
    const repetido = this.historial.has(k), avance = repetido ? 0 : Math.max(0, this.dist - d);
    (r.proceso ??= []).push({m:r.mision, o:r.oleada, dominio:this.dom.id, via:carta ? `${carta.icon} ${carta.name}` : libre ? '✍️ Paso libre' : cadena ? '🔗 Combo' : 'Paso',
      antes:this.dom.tex(this.raiz), despues:this.dom.tex(nueva), avance, ok:this.dom.resuelto(nueva)});
    if (r.proceso.length > 400) r.proceso.shift();
    const segundos = (performance.now() - this.tPaso) / 1000;
    this.raiz = nueva; this.dist = d; this.pasos++; this.historial.add(k); this.tPaso = performance.now(); this.carta = null; this.quiz = null; this.pistaMostrada = false;
    r.tPasos = (r.tPasos ?? 0) + segundos; r.nPasos = (r.nPasos ?? 0) + 1;
    if (avance > 0){
      this.combo++;
      const pts = this.puntuador.puntuar({avance, segundos, combo:this.combo - 1, libre, cadena, ventana:r.loadout.efecto('ventana', 0) + r.ventanaExtra});
      const energia = BALANCE.energiaPaso * pts.energia * r.loadout.energiaMult * r.energiaPaso;
      r.energia.agregar(energia); this.ganarXP(pts.xp * r.xpMult * NIVELES_AYUDA[this.ayuda].xp);
      const extras = pts.detalle.map(d => `${d.nombre} ×${d.mult.toFixed(1)}`).join(' · ');
      this.mensaje(`+${Math.round(energia)} ⚡ ${extras ? `<span class="text-sky-300">(${extras})</span>` : ''}`, 'emerald');
      this.mundo.texto(this.mundo.base.cx, this.mundo.base.cy - 30, `+${Math.round(energia)}⚡`, '#fde047');
      FX3D.en(this.$('expr'), 'acierto');
    } else {
      this.combo = 0;
      this.mensaje(repetido ? '↩️ Volviste a un paso anterior: sin energía.' : 'Paso válido, pero no te acerca al resultado: sin energía.', 'zinc');
    }
    if (carta) this.app.progreso.descubrir('cartas', carta.id);
    if (this.dom.resuelto(this.raiz)) return this.problemaResuelto();
    if (carta?.id === 'seme' && carta.targets(this.raiz).length) this.mensaje(this.$('msg').innerHTML + ' · 🧲 Aún puedes juntar otro grupo o usar otra propiedad.', avance > 0 ? 'emerald' : 'zinc');
    this.dibujarProblema(); this.dibujarMano();
  }
  problemaResuelto(){
    const r = this.run, bono = this.puntuador.bonoProblema(this.pasos, this.par);
    r.problemas++; if (bono.eficiente) r.eficientes++;
    this.app.ruta.ganar(XP_RUTA.problema);
    r.energia.agregar(bono.energia * r.loadout.energiaMult); this.ganarXP(bono.xp * r.xpMult * NIVELES_AYUDA[this.ayuda].xp);
    this.director.problemasResueltos++;
    this.mundo.debilitarJefes();
    this.dibujarProblema(); this.$('mano').innerHTML = ''; this.$('quiz').classList.add('hidden');
    FX3D.en(this.$('expr'), 'resuelto');
    this.mensaje(`✅ ¡Resuelto en ${this.pasos} pasos!${bono.eficiente ? ' <b class="text-sky-300">Eficiencia máxima</b>' : ''} +${bono.xp} XP`, 'emerald');
    this.resuelto = true;
    // Si la oleada ya terminó, la siguiente trae el problema nuevo; si no, llega uno nuevo (nunca reemplaza a uno sin resolver)
    setTimeout(() => { if (!this.terminado && this.resuelto && !this.director.terminada(this.mundo)) this.nuevoProblema(); }, 1100);
  }
  ganarXP(n){
    const r = this.run; r.xp += n; r.xpTotal += n;
    while (r.xp >= r.xpSiguiente){ r.xp -= r.xpSiguiente; r.nivel++; r.tacPend = (r.tacPend ?? 0) + 1; this.aviso(`⬆️ Nivel ${r.nivel}: al terminar la oleada eliges un táctico`); }
  }
  /** XP de un tipo de soldado: todos los de ese tipo llenan la misma barra; cada nivel = 1 potenciador al final de la oleada. */
  ganarXPTipo(tipo, n){
    const r = this.run, xp = r.xpTipo ??= {}, nv = r.nivelTipo ??= {}, pend = r.potPend ??= {};
    xp[tipo] = (xp[tipo] ?? 0) + n;
    while (xp[tipo] >= xpTipoSiguiente(nv[tipo] ?? 1)){ xp[tipo] -= xpTipoSiguiente(nv[tipo] ?? 1); nv[tipo] = (nv[tipo] ?? 1) + 1; pend[tipo] = (pend[tipo] ?? 0) + 1;
      this.aviso(`${SOLDADOS[tipo].icon} ${SOLDADOS[tipo].name}: ¡nivel ${nv[tipo]}!`); }
  }

  /* ---- Capas: subir de nivel, taller, pausa ---- */
  abrirCapa(html, onclick){
    this.capaAbierta = true; this.pausado = true; this.app.piezas.cerrar();
    const capa = this.$('capa'); capa.classList.remove('hidden');
    capa.innerHTML = `<div class="flex h-full flex-col overflow-y-auto bg-zinc-950/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">${html}</div>`;
    capa.onclick = e => { e.stopPropagation(); onclick(e); };
  }
  cerrarCapa(){ this.capaAbierta = false; this.pausado = false; this.$('capa').classList.add('hidden'); this.ultimo = performance.now(); }

  /** Final de la oleada: por cada nivel que subió un tipo de soldado se elige 1 potenciador (uno a uno, tipo por tipo)
      y por cada nivel general, 1 táctico. Después sigue la partida. */
  elegirFinOleada(seguir){
    const r = this.run, cola = [];
    for (const [tipo, n] of Object.entries(r.potPend ?? {})) for (let k = 0; k < n; k++) cola.push({tipo});
    for (let k = 0; k < (r.tacPend ?? 0); k++) cola.push({tactico:true});
    r.potPend = {}; r.tacPend = 0;
    const siguiente = i => {
      if (i >= cola.length){ this.mundo.sincronizarArmas(); if (this.capaAbierta) this.cerrarCapa(); this.dibujarMano(); return seguir(); }
      const paso = cola[i], ops = paso.tactico ? this.opcionesTactico() : this.opcionesTipo(paso.tipo);
      if (!ops.length) return siguiente(i + 1);
      const titulo = paso.tactico ? '🧠 Elige un táctico' : `${SOLDADOS[paso.tipo].icon} ${SOLDADOS[paso.tipo].name}: elige un potenciador`;
      const sub = paso.tactico ? 'Subiste de nivel resolviendo cálculos.' : `Tus ${SOLDADOS[paso.tipo].name.toLowerCase()}s subieron de nivel (nivel ${r.nivelTipo?.[paso.tipo] ?? 1}).`;
      let sel = this.ayuda >= 3 ? ops.findIndex(o => o.sugerido) : -1;
      const pintar = () => this.abrirCapa(`
        <h2 class="text-center text-2xl font-black">🌊 Fin de la oleada ${r.oleada}</h2>
        <p class="text-center text-xs text-zinc-400">Elección ${i + 1} de ${cola.length}</p>
        <h3 class="mt-3 text-center text-lg font-bold">${titulo}</h3><p class="text-center text-sm text-zinc-400">${sub}</p>
        <div class="mt-3 grid gap-2">${ops.map((o, k) => `<button data-op="${k}" class="relative flex items-center gap-3 rounded-2xl border-2 p-3 text-left touch-manipulation ${sel === k ? 'border-emerald-400 bg-emerald-400/10' : o.borde ?? 'border-zinc-700 bg-zinc-900'}">${o.cinta ? `<span class="absolute -top-2 right-3 rounded-full ${o.cintaColor ?? 'bg-amber-400'} px-2 text-[10px] font-black text-zinc-950">${o.cinta}</span>` : ''}${o.sugerido && this.ayuda ? '<span class="absolute -top-2 left-3 rounded-full bg-sky-400 px-2 text-[10px] font-black text-zinc-950">⭐ SUGERIDO</span>' : ''}<span class="text-3xl">${o.icon}</span><span><b>${o.nombre}</b><br><small class="text-zinc-400">${o.desc}</small></span></button>`).join('')}</div>
        <button data-a="ok" class="${UI.btnP} mt-5" ${sel >= 0 ? '' : 'disabled'}>${i + 1 < cola.length ? 'Siguiente ▸' : 'Continuar'}</button>`,
      e => {
        const k = e.target.closest('[data-op]')?.dataset.op; if (k != null){ sel = +k; return pintar(); }
        if (e.target.closest('[data-a="ok"]') && sel >= 0){ ops[sel].aplicar(); siguiente(i + 1); }
      });
      pintar();
    };
    siguiente(0);
  }
  /** Opciones de potenciador para el arma equipada de un tipo: sus 6 potenciadores, sus fusiones disponibles y, a veces, un superpotenciador. */
  opcionesTipo(tipo){
    const r = this.run, rng = this.app.rng, arma = tropaDe(this.app.progreso).equipo[tipo]?.arma; if (!arma) return [];
    const pot = r.potenciadores ??= {}, sup = r.supers ??= [], fus = r.fusionesArma ??= [];
    const normales = rng.shuffle(PLANTILLAS_POT.map(p => `${arma}:${p.k}`).filter(id => (pot[id] ?? 0) < MAX_POT)).map(id => { const P = POTENCIADORES[id], n = pot[id] ?? 0;
      return {icon:P.icon, nombre:`${P.nombre.split(' · ')[0]} ${pips(n + 1)}`, desc:`${P.armaIcon} ${P.armaNombre}: ${P.desc}`, aplicar:() => { pot[id] = n + 1; this.app.progreso.descubrir('potenciadores', id); }}; });
    const fusiones = fusionesDisponibles(r, arma).map(id => { const F = FUSIONES_ARMA[id];
      return {icon:F.icon, nombre:F.nombre, desc:`Fusión de ${F.armaIcon} ${F.armaNombre} + ${BONUS_DEFS[F.tactico].icon} ${BONUS_DEFS[F.tactico].name}: ${F.desc}`, cinta:'FUSIÓN', cintaColor:'bg-fuchsia-400', borde:'border-fuchsia-400/70 bg-zinc-900',
        aplicar:() => { fus.push(id); this.app.progreso.descubrir('fusiones', id); }}; });
    const supers = superDisponibles(this.app, r).slice(0, 1).map(id => { const S = SUPERPOTENCIADORES[id];
      return {icon:S.icon, nombre:S.nombre, desc:S.desc, cinta:'SÚPER', borde:'border-amber-400/70 bg-zinc-900', aplicar:() => { sup.push(id); this.app.progreso.descubrir('potenciadores', id); }}; });
    const ops = [...fusiones.slice(0, 1), ...supers, ...normales].slice(0, 3);
    if (ops.length) ops[0].sugerido = true;
    return ops;
  }
  /** Opciones de táctico (nuevo, mejorar, fusionar tácticos o reparar la base), con la sugerencia del asistente. */
  opcionesTactico(){
    const l = this.run.loadout, rng = this.app.rng, ops = l.opciones('tactico', rng);
    let mejor = -1;
    if (this.ayuda >= 1){
      const w = this.mundo, v = w.vistos, total = Math.max(1, Object.values(v).reduce((a, b) => a + b, 0)), cuenta = ids => ids.reduce((s, id) => s + (v[id] ?? 0), 0) / total;
      mejor = new Recomendador({voladores:cuenta(['nave', 'dron', 'bombardero', 'caza', 'portadrones', 'acorazado', 'mente']), blindados:cuenta(['blindado', 'coloso']), escuderos:cuenta(['escudero']),
        rapidos:cuenta(['saltador', 'dron', 'caza']), grupo:w.enemigos.length >= 6 || total > 20, base:w.base.vida / w.base.vidaMax, sinEnergia:w.tiempoSinEnergia / Math.max(1, w.tiempo),
        bajasPropias:w.bajasPropias, pasoLento:(this.run.tPasos ?? 0) / Math.max(1, this.run.nPasos ?? 1) > 12}).mejor(ops).i;
    }
    return ops.map((op, k) => {
      const [icon, nombre, desc] = op.accion === 'reparar' ? ['🔧', 'Reparar base', '+30 de vida'] :
        op.accion === 'fusionar' ? [BONUS_DEFS[op.receta.resultado].icon, `Fusionar: ${BONUS_DEFS[op.receta.resultado].name}`, `${BONUS_DEFS[op.receta.a].name} + ${BONUS_DEFS[op.receta.b].name} → nivel 4 y libera un espacio`] :
        op.accion === 'mejorar' ? [op.bonus.def.icon, `${op.bonus.def.name} → Nv ${op.bonus.nivel + 1}`, op.bonus.def.desc] :
        [BONUS_DEFS[op.id].icon, `${BONUS_DEFS[op.id].name} (nuevo)`, BONUS_DEFS[op.id].desc];
      return {icon, nombre, desc, sugerido:k === mejor, aplicar:() => {
        if (op.accion === 'reparar') this.run.base.vida = Math.min(this.run.base.vidaMax, this.run.base.vida + 30); else l.aplicar(op);
        const nuevoId = op.accion === 'nuevo' ? op.id : op.accion === 'fusionar' ? op.receta.resultado : null;
        if (nuevoId) this.app.progreso.descubrir(BONUS_DEFS[nuevoId].fusion ? 'fusiones' : 'tacticos', nuevoId);
        const b = this.run.base, nuevaMax = this.run.vidaBase + l.efecto('vida', 0); b.vida += Math.max(0, nuevaMax - b.vidaMax); b.vidaMax = nuevaMax;
      }};
    });
  }
  mostrarPausa(){
    this.abrirCapa(`<div class="m-auto flex w-full max-w-sm flex-col gap-3"><h2 class="text-center text-2xl font-black">⏸ Pausa</h2>
      <div class="text-sm font-bold">⚡ Potenciadores</div><div class="${UI.card} !p-2.5 text-xs">${Object.entries(this.run.potenciadores ?? {}).map(([id, n]) => `${POTENCIADORES[id].icon} ${POTENCIADORES[id].nombre} ${pips(n)}`).join('<br>') || 'Aún ninguno: se eligen al final de cada oleada.'}${(this.run.supers ?? []).map(id => `<br>🌟 ${SUPERPOTENCIADORES[id].nombre}`).join('')}</div>
      ${['tactico'].map(tipo => `<div class="text-sm font-bold">${tipo === 'arma' ? '🔫 Armas' : '🧠 Tácticos'} ${this.run.loadout.lista(tipo).length}/${ESPACIOS[tipo]}</div>
        ${this.run.loadout.lista(tipo).map(b => `<div class="${UI.card} !p-2.5"><div class="flex items-center gap-2"><span class="text-xl">${b.def.icon}</span><b class="flex-1 text-sm">${b.def.name}</b>${pips(b.nivel, b.nivel > 3 ? 4 : 3)}</div><div class="mt-1 flex flex-wrap gap-1">${chipsProps(b.props)}</div></div>`).join('') || '<div class="text-xs text-zinc-500">Sin tácticos todavía</div>'}`).join('')}
      <button data-a="seguir" class="${UI.btnP}">▶ Continuar</button>
      <div class="grid grid-cols-2 gap-2"><button data-a="guardar" class="${UI.btn} text-sm">💾 Guardar</button><button data-a="json" class="${UI.btn} text-sm">⬇ Descargar JSON</button></div>
      <p data-h="guardado" class="min-h-5 text-center text-xs text-emerald-300"></p>
      <button data-a="menu" class="${UI.btn}">Abandonar partida</button></div>`,
    e => {
      if (e.target.closest('[data-a="seguir"]')) this.cerrarCapa();
      if (e.target.closest('[data-a="guardar"]')){ const ok = new GestorPartidas().guardar(fotoPartida(this)); this.$('guardado').textContent = ok ? '✅ Guardada en 💾 Partidas (sigue desde el inicio de esta oleada).' : '❌ No se pudo guardar.'; }
      if (e.target.closest('[data-a="json"]')) GestorPartidas.descargar(fotoPartida(this));
      if (e.target.closest('[data-a="menu"]')) this.fin(false, true);
    });
  }


  /* ---- Progresión ---- */
  /** Lo visto en la batalla pasa al catálogo. */
  sincronizarCatalogo(){
    const P = this.app.progreso, nuevos = [];
    for (const id of Object.keys(this.mundo.vistos)) if (P.descubrir('enemigos', id)) nuevos.push(id);
    for (const id of this.mundo.tiposSoldado) if (P.descubrir('soldados', id)) nuevos.push(id);
    return nuevos;
  }
  oleadaTerminada(){
    const r = this.run, nuevos = this.sincronizarCatalogo();
    if (!r.lab){ this.app.ruta.ganar(XP_RUTA.oleada + (r.oleada === OLEADAS ? XP_RUTA.mision : 0));
    if (r.oleada === OLEADAS) this.app.ruta.contar('misiones'); }   // 🧪 el laboratorio no cuenta para la Ruta
    if (r.oleada === OLEADAS){ const pts = puntosMision(r.mision); this.app.progreso.ganarPuntos(pts); r.puntosMisiones += pts; const m = r.mision; setTimeout(() => this.aviso(`🏅 ¡Misión ${m} cumplida! +${pts} 🔬`), 2700); }
    if (nuevos.length) setTimeout(() => this.aviso(`📚 Nuevo en el catálogo (${nuevos.length})`), 5300);
    if (r.oleada < OLEADAS) return this.elegirFinOleada(() => { r.oleada++; this.iniciarOleada(); });   // primero se eligen potenciadores y tácticos
    if (r.mundo && r.lab){ this.victoriaTexto = '🧪 Prueba de laboratorio superada.'; return this.fin(true); }
    if (r.mundo) return this.misionMundoCumplida();
    if (r.mision < MISIONES || r.infinito){ r.mision++; r.oleada = 1; r.base.vida = Math.min(r.base.vidaMax, r.base.vida + 25); return this.elegirFinOleada(() => this.pausaMision(r.mision - 1)); }
    return this.fin(true);
  }
  /** Misión de un mundo ganada: se marca el Comandante (o el Soberano) como derrotado. */
  misionMundoCumplida(){
    const r = this.run, P = this.app.progreso, M = mundoDe(r.mundo), pm = (P.data.mundos ??= {})[M.id] ??= {vencidos:0, soberano:false};
    if (r.mm < 4) pm.vencidos = Math.max(pm.vencidos, r.mm + 1); else pm.soberano = true;
    P.guardar();
    const quien = r.mm < 4 ? M.comandantes[r.mm].name : M.soberano.name;
    this.victoriaTexto = `${r.mm < 4 ? '🎖️' : '👑'} ¡${quien} derrotado!${r.mm < 3 ? ` Siguiente: ${M.comandantes[r.mm + 1].name}.` : r.mm === 3 ? ` ¡El ${M.soberano.name} te espera!` : ` ¡${M.nombre} liberado!`}`;
    return this.fin(true);
  }
  /** Al terminar cada misión el juego se detiene: seguir o guardar el avance para después. */
  pausaMision(m){
    const g = new GestorPartidas(); if (!this.run.lab) g.guardar(fotoPartida(this, `${this.run.infinito ? '♾️ ' : ''}Misión ${m} cumplida`));   // guardado automático
    this.abrirCapa(`<div class="m-auto flex w-full max-w-sm flex-col gap-3 text-center"><div class="text-6xl">🏅</div>
      <h2 class="text-2xl font-black">¡Misión ${m} cumplida!</h2>
      <p class="text-sm text-zinc-400">El avance quedó guardado en 💾 Partidas. ¿Sigues con la misión ${m + 1} o la dejas para después?</p>
      <button data-a="seguir" class="${UI.btnP} !min-h-14 text-lg">▶ Continuar</button>
      <button data-a="guardar" class="${UI.btn}">💾 Guardar y salir</button></div>`,
    e => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'seguir'){ this.cerrarCapa(); this.iniciarOleada(); }
      if (a === 'guardar'){ this.terminado = true; this.app.go(new MenuScene(this.app, '✅ Partida guardada: búscala abajo en «Partidas guardadas».')); }
    });
  }
  fin(victoria, abandono = false){
    if (this.terminado) return; this.terminado = true;
    this.sincronizarCatalogo();
    this.finArgs = [victoria, abandono];
    if (victoria) this.app.ruta.contar('victorias');
    // ⚙️ Chatarra: se gana en TODAS las partidas (también al perder) para mejorar soldados, armas y blindajes
    const rr = this.run, chat = 4 + Math.floor(rr.problemas * 1.5) + Math.floor(rr.bajas / 4) + (victoria ? 10 : 0);
    this.app.progreso.data.chatarra = (this.app.progreso.data.chatarra ?? 0) + chat; this.chatarraGanada = chat;
    const r = this.run, pts = this.app.progreso.registrarPartida(r.xpTotal);
    const novedades = (this.app.progreso.nuevos ?? []).splice(0);       // lo descubierto en esta partida
    const resumen = () => this.abrirCapa(`<div class="m-auto flex w-full max-w-sm flex-col gap-3 text-center">
      <div class="text-6xl">${victoria ? '🏆' : '💥'}</div><h2 class="text-2xl font-black">${victoria ? (this.victoriaTexto ?? '¡La Tierra está a salvo!') : abandono ? 'Partida abandonada' : 'La base cayó'}</h2>
      <div class="${UI.card} grid grid-cols-2 gap-2 text-left text-sm">
        <span>Misión alcanzada</span><b class="text-right">${r.mision} · oleada ${r.oleada}</b>
        <span>Problemas resueltos</span><b class="text-right">${r.problemas}</b>
        <span>Con pasos mínimos</span><b class="text-right">${r.eficientes}</b>
        <span>Combos usados</span><b class="text-right">${r.combosUsados}</b>
        <span>Enemigos derrotados</span><b class="text-right">${r.bajas}</b>
        <span>Jefes derrotados</span><b class="text-right">${r.jefes}${r.infinito ? '' : '/' + MISIONES}</b>
        <span>XP total</span><b class="text-right">${Math.round(r.xpTotal)}</b>
        <span>🔬 por misiones</span><b class="text-right text-amber-300">+${r.puntosMisiones}</b>
        <span>🔬 por XP</span><b class="text-right text-amber-300">+${pts}</b>
        <span>⚙️ Chatarra</span><b class="text-right text-sky-300">+${this.chatarraGanada ?? 0}</b></div>
      <button data-a="otra" class="${UI.btnP}">↻ Jugar otra vez</button><button data-a="mejoras" class="${UI.btn}">🛠 Mejoras</button><button data-a="menu" class="${UI.btn}">Menú</button></div>`,
    e => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'otra') this.app.go(new BattleScene(this.app, new Run(this.app)));
      if (a === 'mejoras') this.app.go(new MejorasScene(this.app));
      if (a === 'menu') this.app.go(new MenuScene(this.app));
    });
    if (novedades.length) this.mostrarNovedades(novedades, resumen); else resumen();
  }
  /** Una ventana por cada cosa nueva (descubierta, desbloqueada o usada por primera vez) antes del resumen. */
  mostrarNovedades(lista, despues){
    const CAT = {armas:'Arma', tacticos:'Táctico', enemigos:'Alienígena', soldados:'Soldado', cartas:'Carta', fusiones:'Fusión', potenciadores:'Potenciador'};
    const info = ({cat, id}) => {
      if (cat === 'enemigos'){ const e = INFO_ENEMIGO[id]; return {icon:'👽', name:e?.name ?? id, desc:e?.desc ?? ''}; }
      if (cat === 'soldados') return {icon:SOLDADOS[id].icon, name:SOLDADOS[id].name, desc:SOLDADOS[id].desc};
      if (cat === 'cartas'){ const c = Object.values(DOMINIOS).map(d => d.cartas.get(id)).find(Boolean); return {icon:c?.icon ?? '🃏', name:c?.name ?? id, desc:c?.desc ?? ''}; }
      if (cat === 'potenciadores'){ const x = POTENCIADORES[id] ?? SUPERPOTENCIADORES[id]; return {icon:x.icon, name:x.nombre, desc:x.desc}; }
      const d = BONUS_DEFS[id]; return {icon:d?.icon ?? '✨', name:d?.name ?? id, desc:d?.desc ?? ''};
    };
    let i = 0;
    const paso = () => {
      if (i >= lista.length) return despues();
      const n = lista[i], x = info(n);
      this.abrirCapa(`<div class="m-auto flex w-full max-w-sm flex-col items-center gap-3 text-center">
        <span class="rounded-full bg-amber-400 px-3 py-0.5 text-xs font-black text-zinc-950">🆕 NUEVO · ${CAT[n.cat] ?? ''} · ${i + 1}/${lista.length}</span>
        <div class="text-7xl [animation:flotar_2s_ease-in-out_infinite]">${x.icon}</div><h2 class="text-2xl font-black">${x.name}</h2>
        <p class="text-sm text-zinc-300">${x.desc}</p><p class="text-xs text-sky-300">+1 ⚙️ chatarra por descubrirlo · míralo en 📚 Catálogo</p>
        <button data-a="sig" class="${UI.btnP} w-full">${i < lista.length - 1 ? 'Siguiente ▸' : 'Ver resumen ▸'}</button></div>`,
        e => { if (e.target.closest('[data-a="sig"]')){ i++; paso(); } });
    };
    paso();
  }
}

/* ---------- Adaptador de la paleta de piezas de "Aprender" (patrón Adapter) ----------
   El paso libre se abre dentro de la batalla (debajo del campo), con la expresión
   actual ya convertida en piezas para editarla, y una vista previa en vivo. */
class TableroPiezas {
  static KEY = 'g-libre';
  constructor(host){ this.host = host; this.abierto = false; LEGO_HOOKS[TableroPiezas.KEY] = () => this.render(); }
  abrir({expr, piezas, ayuda, prellenar = [], vista = null, confirmar, cancelar}){
    Object.assign(this, {expr, piezas, ayuda, prellenar, vista, confirmar, cancelar, error:''});
    this.cargar();
    this.abierto = true; this.host().classList.remove('hidden'); this.render();
  }
  cargar(){ LEGO[TableroPiezas.KEY] = undefined; legoState(TableroPiezas.KEY).root = JSON.parse(JSON.stringify(this.prellenar)); }
  cerrar(){ if (!this.abierto) return; this.abierto = false; const h = this.host(); h.classList.add('hidden'); h.innerHTML = ''; }
  render(){
    if (!this.abierto) return;
    const key = TableroPiezas.KEY, st = legoState(key); ZREG[key] = [];
    const src = ser(st.root);
    let prev = '<span class="text-zinc-500">…</span>';
    if (src && this.vista){ try { prev = texJuego(this.vista(src), false); } catch { prev = '<span class="text-xs text-amber-300">incompleto</span>'; } }
    const h = this.host();
    h.innerHTML = `<div data-lego="${key}" class="dark flex h-full flex-col overflow-y-auto border-t-2 border-amber-400/70 bg-zinc-950 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 text-zinc-100">
      <div class="flex items-center gap-2"><b class="flex-1 text-sm">✍️ Paso libre <span class="font-normal text-zinc-400">· ${this.ayuda}</span></b>
        <button data-pl="recargar" class="${C.btn} !min-h-9 !px-2 !text-xs" title="Volver a cargar la expresión">↺</button>
        <button data-pl="cancelar" class="${C.btn} !min-h-9 !px-2.5 !text-xs" aria-label="Cerrar">✕</button></div>
      <div class="mt-1.5">${zoneHTML(key, st.root, 0)}</div>${bloquesHTML(key, st)}
      <div class="mt-1 flex min-h-8 items-center gap-2 overflow-x-auto rounded-xl bg-zinc-900 px-2 text-sm"><span class="shrink-0 text-[10px] uppercase text-zinc-500">Se lee</span>${prev}</div>
      ${allZones(st.root).length > 1 ? `<div class="mt-1 text-right">${st.active && st.active !== st.root ? `<button class="${C.btn} !min-h-8 !py-0.5 !text-xs" data-lg="outzone">⤴ Salir</button> ` : ""}<button class="${C.btn} !min-h-8 !py-0.5 !text-xs" data-lg="nextzone">⇥ Siguiente espacio</button></div>` : ''}
      ${paletteHTML(key, {k:this.piezas, orden:true}, st)}
      ${this.error ? `<div class="mt-2 rounded-xl bg-rose-950/60 px-3 py-2 text-sm font-medium text-rose-200">${this.error}</div>` : ''}
      <div class="mt-2 grid grid-cols-[1fr_auto_auto] gap-2">
        <button data-pl="ok" class="${UI.btnP}">✔ Usar este paso</button>
        <button data-lg="undo" class="${C.btn}" aria-label="Deshacer">↶</button><button data-lg="clear" class="${C.btn}" aria-label="Limpiar">🗑</button></div></div>`;
    h.onclick = e => {
      const a = e.target.closest('[data-pl]')?.dataset.pl;
      if (a === 'cancelar'){ this.cerrar(); this.cancelar(); }
      if (a === 'recargar'){ this.cargar(); this.error = ''; this.render(); }
      if (a === 'ok'){ const err = this.confirmar(ser(st.root)); if (err){ this.error = err; this.render(); } else this.cerrar(); }
    };
  }
}
