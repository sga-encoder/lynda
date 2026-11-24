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
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.scene?.pause(); });
  }
  go(scene){ this.scene?.exit(); this.scene = scene; scene.enter(); }
  open(){ this.root.classList.remove('hidden'); if (!this.scene) this.go(new MenuScene(this)); }
  close(){ this.scene?.pause(); this.root.classList.add('hidden'); }
  html(s){ this.root.innerHTML = s; return this.root; }
}

/* ---------- Menú ---------- */
const MODOS = [['fund', '🧱', 'Fundamentos'], ['dif', '📈', 'Diferencial'], ['int', '∫', 'Integral'], ['todo', '🌐', 'Todo junto']];
class MenuScene extends Scene {
  enter(){
    const p = this.app.progreso, d = p.data, hechos = this.app.doneKeys();
    const disp = this.app.problemas.disponibles(d.modo, hechos, d.todo), total = this.app.problemas.tipos(d.modo).length;
    this.app.html(`
    <div class="mx-auto flex h-full max-w-xl flex-col gap-4 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div class="flex items-center justify-between"><span class="text-sm text-zinc-400">🎮 Practicar</span><button data-a="salir" class="${UI.btn} !min-h-10 !px-3">✕ Salir</button></div>
      <div class="text-center"><div class="text-6xl">👽🛸</div><h2 class="mt-2 text-3xl font-black tracking-tight">Defensa Algebraica</h2>
        <p class="mt-2 text-zinc-300">Los soldados solo disparan con la <b class="text-amber-300">energía</b> que generan los científicos… y los científicos eres tú. Cada paso que te acerca a la solución carga energía: más rápido, más creativo y con menos pasos = más XP.</p></div>
      <div><b class="text-sm">¿Qué quieres practicar?</b>
        <div class="mt-2 grid grid-cols-2 gap-2">${MODOS.map(([id, ic, n]) => `<button data-modo="${id}" class="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 px-3 font-semibold touch-manipulation ${d.modo === id ? 'border-emerald-400 bg-emerald-400/15 text-emerald-200' : 'border-zinc-700 bg-zinc-900'}"><span class="text-xl">${ic}</span>${n}</button>`).join('')}</div>
        <p class="mt-2 text-xs text-zinc-400">${disp.length ? `${disp.length} tipo(s) de problema disponibles` : 'Aún no hay problemas: completa ejercicios en Aprender'}${disp.length < total ? ' · más se desbloquean avanzando en Aprender' : ''}.</p></div>
      <button data-a="jugar" class="${UI.btnP} !min-h-14 text-lg" ${disp.length ? '' : 'disabled'}>▶ Jugar</button>
      <div class="grid grid-cols-2 gap-3"><button data-a="mejoras" class="${UI.btn}">🛠 Mejoras <span class="text-amber-300">${d.puntos} 🔬</span></button><button data-a="ayuda" class="${UI.btn}">❓ Cómo jugar</button></div>
      <label class="${UI.card} flex items-center gap-3 text-sm"><input type="checkbox" data-a="todo" class="h-5 w-5 accent-amber-400" ${d.todo ? 'checked' : ''}><span><b>🧪 Todo desbloqueado</b> <span class="text-zinc-400">(modo desarrollo: ignora el avance en Aprender)</span></span></label>
      <p class="text-center text-xs text-zinc-500">Récord: ${d.record} XP · Partidas: ${d.partidas}</p>
    </div>`).onclick = e => {
      const modo = e.target.closest('[data-modo]')?.dataset.modo;
      if (modo){ d.modo = modo; p.guardar(); return this.enter(); }
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'todo'){ d.todo = e.target.checked; p.guardar(); return this.enter(); }
      if (a === 'jugar') this.app.go(new BattleScene(this.app, new Run(this.app)));
      if (a === 'mejoras') this.app.go(new ShopScene(this.app));
      if (a === 'ayuda') this.app.go(new HelpScene(this.app));
      if (a === 'salir') this.app.onExit();
    };
  }
}

class HelpScene extends Scene {
  enter(){
    this.app.html(`
    <div class="mx-auto h-full max-w-xl overflow-y-auto px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] text-zinc-200 [&_li]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5">
      <button data-a="volver" class="${UI.btn} !min-h-10">◂ Volver</button>
      <h2 class="mt-4 text-2xl font-black">Cómo jugar</h2>
      <ul>
        <li>Arriba está el campo de batalla; abajo, el <b>problema</b> y tu <b>mano de cartas</b>.</li>
        <li>Cada carta es una <b>propiedad matemática</b>. Tócala: si se puede aplicar en un solo lugar, se aplica; si hay varios, toca en la expresión la parte (resaltada) donde quieres usarla.</li>
        <li><b>✍️ Paso libre</b>: escribe tú el siguiente paso con piezas. Si es correcto y te acerca mucho, la energía vale doble (creatividad).</li>
        <li>Cada paso que te <b>acerca</b> a la solución da ⚡ energía y XP. Bonos: <b>rápido</b> (menos de 6 s), <b>combo</b> (pasos buenos seguidos) y <b>creativo</b>. Terminar con los pasos mínimos da bono de <b>eficiencia</b>.</li>
        <li>Los soldados y las armas gastan energía al disparar. Sin soldados, la base dispara sola (débil). La base recluta soldados cuando hay espacio.</li>
        <li>Elige qué practicar: <b>Fundamentos</b> (ecuaciones y simplificar), <b>Diferencial</b> (derivadas), <b>Integral</b> (integrales) o <b>Todo junto</b>.</li>
        <li>Cada oleada pide resolver 1 o más problemas. Al subir de nivel eliges <b>1 arma y 1 táctico</b> (3 espacios de cada tipo, nivel máximo 3).</li>
        <li>Los bonificadores tienen <b>propiedades</b> (objetivo, alcance, tipo de daño, movimiento…) que cambian al mejorar. Algunas parejas en nivel 3 se <b>fusionan</b> (nivel 4) y liberan un espacio: 🌟 Láser + Amplificador, 🎖️ Rifle + Reclutamiento, ❄️ Misiles + Cámara lenta.</li>
        <li>El <b>alien blindado</b> resiste el daño físico; los <b>drones</b> vuelan directo a la base: no todas las armas alcanzan voladores.</li>
        <li>Al terminar la partida, tu XP se convierte en 🔬 puntos para <b>mejoras permanentes</b>.</li>
        <li>Los tipos de problema se desbloquean avanzando en <b>Aprender</b>.</li>
      </ul></div>`).onclick = e => { if (e.target.closest('[data-a="volver"]')) this.app.go(new MenuScene(this.app)); };
  }
}

class ShopScene extends Scene {
  enter(){
    const p = this.app.progreso;
    this.app.html(`
    <div class="mx-auto h-full max-w-xl overflow-y-auto px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
      <div class="flex items-center justify-between"><button data-a="volver" class="${UI.btn} !min-h-10">◂ Volver</button><span class="text-lg font-bold text-amber-300">${p.data.puntos} 🔬</span></div>
      <h2 class="mt-4 text-2xl font-black">Mejoras permanentes</h2><p class="text-sm text-zinc-400">Se mantienen entre partidas.</p>
      <div class="mt-3 space-y-2">${Object.entries(MEJORAS).map(([id, m]) => `
        <div class="${UI.card} flex items-center gap-3"><span class="text-3xl">${m.icon}</span>
          <div class="flex-1"><b>${m.name}</b> <small class="text-zinc-400">${p.nivel(id)}/${m.max}</small><div class="text-sm text-zinc-400">${m.desc}</div></div>
          <button data-buy="${id}" class="${UI.btnP} !min-h-11 !px-3 text-sm" ${p.puedeComprar(id) ? '' : 'disabled'}>${p.nivel(id) >= m.max ? 'Máx.' : `${p.costo(id)} 🔬`}</button></div>`).join('')}
      </div></div>`).onclick = e => {
      if (e.target.closest('[data-a="volver"]')) return this.app.go(new MenuScene(this.app));
      const id = e.target.closest('[data-buy]')?.dataset.buy; if (id && p.comprar(id)) this.enter();
    };
  }
}

/* ---------- Estado de una partida ---------- */
class Run {
  constructor(app){
    const p = app.progreso;
    this.loadout = new Loadout();
    this.vidaBase = 100 + p.total('vida');
    this.base = new Base(this.vidaBase);
    this.energia = new Energia(20 + p.total('energia'));
    this.extraSoldados = p.total('soldados');
    this.xpMult = 1 + p.total('xp');
    Object.assign(this, {mision:1, oleada:1, nivel:1, xp:0, xpTotal:0, problemas:0, eficientes:0, bajas:0});
  }
  get xpSiguiente(){ return xpParaNivel(this.nivel); }
}

/* ---------- Batalla ---------- */
class BattleScene extends Scene {
  constructor(app, run){ super(app); this.run = run; this.bus = new EventBus(); this.puntuador = new Puntuador([new ReglaVelocidad(), new ReglaCombo(), new ReglaCreatividad()]); }
  enter(){
    const r = this.run;
    this.app.html(`
    <div class="relative flex h-full flex-col bg-zinc-950 text-zinc-100">
      <div class="flex items-center gap-2 px-3 pb-1.5 pt-[max(0.5rem,env(safe-area-inset-top))] text-xs">
        <button data-a="pausa" class="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700 text-base" aria-label="Pausa">⏸</button>
        <div class="flex-1"><div class="flex justify-between"><b data-h="oleada"></b><span data-h="probs"></span></div>
          <div class="mt-1 flex items-center gap-1.5"><span>Nv <b data-h="nivel"></b></span><div class="h-1.5 flex-1 overflow-hidden rounded bg-zinc-800"><div data-h="xp" class="h-full bg-sky-400"></div></div></div></div>
      </div>
      <div class="relative mx-auto w-full max-w-3xl"><canvas data-h="cv" class="block aspect-[360/200] max-h-[40vh] w-full"></canvas>
        <div data-h="aviso" class="pointer-events-none absolute inset-x-0 top-1/3 text-center text-xl font-black text-white drop-shadow"></div></div>
      <div class="grid grid-cols-2 gap-2 px-3 pt-2 text-xs">
        <div class="flex items-center gap-1.5">❤<div class="h-2.5 flex-1 overflow-hidden rounded bg-zinc-800"><div data-h="vida" class="h-full bg-emerald-500"></div></div></div>
        <div class="flex items-center gap-1.5">⚡<div class="h-2.5 flex-1 overflow-hidden rounded bg-zinc-800"><div data-h="energia" class="h-full bg-amber-400"></div></div><b data-h="energiaN" class="w-6 text-right"></b></div>
      </div>
      <div class="flex min-h-0 flex-1 flex-col px-3 pt-2">
        <div class="flex items-center justify-between text-xs text-zinc-400"><span data-h="tipo"></span><span data-h="pasos"></span></div>
        <div data-h="expr" class="mt-1 flex min-h-20 items-center justify-center overflow-x-auto rounded-2xl bg-zinc-900 px-2 text-xl text-white [&_[data-t]]:cursor-pointer [&_[data-t]]:rounded-md [&_[data-t]]:bg-amber-400/30 [&_[data-t]]:outline [&_[data-t]]:outline-2 [&_[data-t]]:outline-amber-300"></div>
        <div data-h="msg" class="min-h-10 py-1.5 text-center text-sm"></div>
      </div>
      <div data-h="mano" class="flex gap-2 overflow-x-auto px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-1 [scrollbar-width:none]"></div>
      <div data-h="capa" class="absolute inset-0 z-20 hidden"></div>
    </div>`);
    this.$ = n => this.app.root.querySelector(`[data-h="${n}"]`);
    this.renderer = new Renderer(this.$('cv'));
    this.onResize = () => this.renderer.resize(); window.addEventListener('resize', this.onResize);
    this.bus.on('enemigo-muerto', ({xp}) => { r.bajas++; this.ganarXP(xp); });
    this.bus.on('base-destruida', () => this.fin(false));
    this.app.root.onclick = e => this.click(e);
    this.iniciarOleada();
    this.pausado = false; this.ultimo = performance.now(); this.t = 0;
    this.loop = this.loop.bind(this); this.raf = requestAnimationFrame(this.loop);
  }
  exit(){ cancelAnimationFrame(this.raf); window.removeEventListener('resize', this.onResize); this.app.piezas.cerrar(); }
  pause(){ if (!this.terminado && !this.capaAbierta) this.mostrarPausa(); }

  iniciarOleada(){
    const r = this.run;
    this.cfg = configOleada(r.mision, r.oleada);
    this.director = new WaveDirector(this.cfg, this.app.rng);
    this.mundo ??= new World({bus:this.bus, loadout:r.loadout, energia:r.energia, base:r.base, extraSoldados:r.extraSoldados});
    this.aviso(`Misión ${r.mision} · Oleada ${r.oleada}`);
    this.nuevoProblema();
  }
  nuevoProblema(){
    const d = this.app.progreso.data;
    const {type, dom, root, par, solucion} = this.app.problemas.create({doneKeys:this.app.doneKeys(), mision:this.run.mision, modo:d.modo, todo:d.todo});
    Object.assign(this, {tipo:type, dom, solucion, raiz:root, par, dist:par, pasos:0, combo:this.combo ?? 0, carta:null, historial:new Set([dom.key(root)]), tPaso:performance.now()});
    this.dibujarProblema(); this.dibujarMano();
  }

  /* ---- Bucle de juego ---- */
  loop(now){
    const dt = Math.min(0.05, (now - this.ultimo) / 1000); this.ultimo = now;
    if (!this.pausado && !this.terminado){
      const lento = this.app.piezas.abierto ? 0.5 : 1;            // el mundo va más lento mientras escribes un paso libre
      this.t += dt; this.mundo.update(dt * lento, this.director);
      if (this.director.terminada(this.mundo)) this.oleadaTerminada();
    }
    this.renderer.draw(this.mundo, this.t); this.hud();
    this.raf = requestAnimationFrame(this.loop);
  }
  hud(){
    const r = this.run, b = r.base;
    this.$('oleada').textContent = `Misión ${r.mision}/${MISIONES} · Oleada ${r.oleada}/${OLEADAS}`;
    this.$('probs').textContent = `🧮 ${Math.min(this.director.problemasResueltos, this.cfg.problemas)}/${this.cfg.problemas}`;
    this.$('nivel').textContent = r.nivel;
    this.$('xp').style.width = `${100 * r.xp / r.xpSiguiente}%`;
    this.$('vida').style.width = `${100 * b.vida / b.vidaMax}%`;
    this.$('energia').style.width = `${r.energia.valor}%`;
    this.$('energiaN').textContent = Math.floor(r.energia.valor);
    this.$('energia').classList.toggle('animate-pulse', this.mundo.sinEnergia);
  }
  aviso(txt){ const el = this.$('aviso'); el.textContent = txt; clearTimeout(this.tAviso); this.tAviso = setTimeout(() => el.textContent = '', 1800); }

  /* ---- Problema y cartas ---- */
  dibujarProblema(){
    const marcas = this.carta ? new Map(this.objetivos.map((p, i) => [p.join('.'), i])) : null;
    this.$('expr').innerHTML = texJuego(this.dom.tex(this.raiz, marcas));
    this.$('tipo').textContent = (this.director.generando ? '' : '⭐ Extra · ') + `${this.dom.icon} ${this.dom.consigna(this.raiz)}`;   // consigna neutra: no revela el método
    this.$('pasos').textContent = `Pasos ${this.pasos} · mínimo ${this.par}`;
  }
  dibujarMano(){
    const mano = this.dom.mano(this.raiz);
    this.$('mano').innerHTML = mano.map(c => {
      const sel = this.carta === c;          // todas las cartas se ven igual: no se revela cuáles sirven
      return `<button data-carta="${c.id}" class="flex h-32 w-[6.75rem] shrink-0 flex-col items-center justify-between rounded-2xl border-2 p-2 text-center touch-manipulation select-none transition-transform active:scale-95
        ${sel ? 'border-amber-300 bg-amber-400/20 -translate-y-1.5' : 'border-zinc-600 bg-gradient-to-b from-zinc-800 to-zinc-900'}">
        <span class="text-3xl leading-none">${c.icon}</span><b class="text-[13px] leading-tight">${c.name}</b><span class="text-[10px] leading-tight text-zinc-400">${c.desc}</span></button>`;
    }).join('');
  }
  mensaje(html, tono = 'zinc'){
    const color = {zinc:'text-zinc-300', rose:'text-rose-300', amber:'text-amber-300', emerald:'text-emerald-300'}[tono];
    const el = this.$('msg'); el.innerHTML = html; el.className = `min-h-10 py-1.5 text-center text-sm ${color}`;
  }

  click(e){
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'pausa') return this.mostrarPausa();
    const cid = e.target.closest('[data-carta]')?.dataset.carta;
    if (cid) return this.jugarCarta(this.dom.cartas.get(cid));
    const t = e.target.closest('[data-t]');
    if (t && this.carta){ const path = this.objetivos[+t.dataset.t]; const c = this.carta; this.carta = null; return this.aplicar(c.apply(this.raiz, path), {carta:c}); }
  }
  jugarCarta(c){
    if (this.carta === c){ this.carta = null; this.dibujarProblema(); this.dibujarMano(); return this.mensaje(''); }
    if (c.free) return this.app.piezas.abrir({
      expr: this.dom.tex(this.raiz), piezas: this.dom.piezas(this.raiz), ayuda: this.dom.ayudaLibre(this.raiz),
      confirmar: src => this.pasoLibre(src), cancelar: () => {},
    });
    const objs = c.targets(this.raiz);
    if (!objs.length){ this.combo = 0; return this.mensaje(`${c.icon} <b>${c.name}</b> no se puede aplicar aquí.`, 'rose'); }
    if (objs.length === 1) return this.aplicar(c.apply(this.raiz, objs[0]), {carta:c});
    this.carta = c; this.objetivos = objs;
    this.dibujarProblema(); this.dibujarMano();
    this.mensaje(`Toca en la expresión dónde aplicar <b>${c.name}</b> (resaltado).`, 'amber');
  }
  /** Devuelve un mensaje de error o null si el paso libre fue aceptado. */
  pasoLibre(src){
    const r = this.dom.libre(src, this.raiz, this.solucion);
    if (r.error) return r.error;
    if (!Number.isFinite(this.dom.solver.distance(r.raiz))) return 'Es correcto, pero no puedo seguir desde esa forma. Prueba escribirlo de otra manera.';
    this.aplicar(r.raiz, {libre:true});
    return null;
  }
  aplicar(nueva, {carta = null, libre = false} = {}){
    const r = this.run, k = this.dom.key(nueva), d = this.dom.solver.distance(nueva);
    const repetido = this.historial.has(k), avance = repetido ? 0 : Math.max(0, this.dist - d);
    const segundos = (performance.now() - this.tPaso) / 1000;
    this.raiz = nueva; this.dist = d; this.pasos++; this.historial.add(k); this.tPaso = performance.now(); this.carta = null;
    if (avance > 0){
      this.combo++;
      const pts = this.puntuador.puntuar({avance, segundos, combo:this.combo - 1, libre, ventana:r.loadout.efecto('ventana', 0)});
      const energia = pts.energia * r.loadout.energiaMult;
      r.energia.agregar(energia); this.ganarXP(pts.xp * r.xpMult);
      const extras = pts.detalle.map(d => `${d.nombre} ×${d.mult.toFixed(1)}`).join(' · ');
      this.mensaje(`+${Math.round(energia)} ⚡ ${extras ? `<span class="text-sky-300">(${extras})</span>` : ''}`, 'emerald');
      this.mundo.texto(this.mundo.base.cx, this.mundo.base.cy - 30, `+${Math.round(energia)}⚡`, '#fde047');
    } else {
      this.combo = 0;
      this.mensaje(repetido ? '↩️ Volviste a un paso anterior: sin energía.' : 'Paso válido, pero no te acerca al resultado: sin energía.', 'zinc');
    }
    if (this.dom.resuelto(this.raiz)) return this.problemaResuelto();
    this.dibujarProblema(); this.dibujarMano();
  }
  problemaResuelto(){
    const r = this.run, bono = this.puntuador.bonoProblema(this.pasos, this.par);
    r.problemas++; if (bono.eficiente) r.eficientes++;
    r.energia.agregar(bono.energia * r.loadout.energiaMult); this.ganarXP(bono.xp * r.xpMult);
    this.director.problemasResueltos++;
    this.dibujarProblema(); this.$('mano').innerHTML = '';
    this.mensaje(`✅ ¡Resuelto en ${this.pasos} pasos!${bono.eficiente ? ' <b class="text-sky-300">Eficiencia máxima</b>' : ''} +${bono.xp} XP`, 'emerald');
    setTimeout(() => { if (!this.terminado) this.nuevoProblema(); }, 1100);
  }
  ganarXP(n){
    const r = this.run; r.xp += n; r.xpTotal += n;
    if (r.xp >= r.xpSiguiente && !this.capaAbierta){ r.xp -= r.xpSiguiente; r.nivel++; this.elegirBonificadores(); }
  }

  /* ---- Capas: subir de nivel, pausa ---- */
  abrirCapa(html, onclick){
    this.capaAbierta = true; this.pausado = true; this.app.piezas.cerrar();
    const capa = this.$('capa'); capa.classList.remove('hidden');
    capa.innerHTML = `<div class="flex h-full flex-col overflow-y-auto bg-zinc-950/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">${html}</div>`;
    capa.onclick = e => { e.stopPropagation(); onclick(e); };
  }
  cerrarCapa(){ this.capaAbierta = false; this.pausado = false; this.$('capa').classList.add('hidden'); this.ultimo = performance.now(); }
  elegirBonificadores(){
    const l = this.run.loadout, rng = this.app.rng, elegido = {};
    const ops = {arma: l.opciones('arma', rng), tactico: l.opciones('tactico', rng)};
    const propsDe = op => op.accion === 'fusionar' ? BONUS_DEFS[op.receta.resultado].props : op.accion === 'mejorar' ? op.bonus.props : op.accion === 'nuevo' ? BONUS_DEFS[op.id].props : null;
    const etiqueta = op => op.accion === 'reparar' ? ['🔧', 'Reparar base', '+30 de vida'] :
      op.accion === 'fusionar' ? [BONUS_DEFS[op.receta.resultado].icon, `Fusionar: ${BONUS_DEFS[op.receta.resultado].name}`, `${BONUS_DEFS[op.receta.a].name} + ${BONUS_DEFS[op.receta.b].name} → nivel 4 y libera un espacio`] :
      op.accion === 'mejorar' ? [op.bonus.def.icon, `${op.bonus.def.name} → Nv ${op.bonus.nivel + 1}`, op.bonus.def.desc] :
      [BONUS_DEFS[op.id].icon, `${BONUS_DEFS[op.id].name} (nuevo)`, BONUS_DEFS[op.id].desc];
    const espacios = tipo => `${l.lista(tipo).map(b => `${b.def.icon}<sub>${b.nivel}</sub>`).join(' ')} <span class="text-zinc-500">${l.lista(tipo).length}/${ESPACIOS[tipo]}</span>`;
    const pintar = () => this.abrirCapa(`
      <h2 class="text-center text-2xl font-black">⬆️ ¡Nivel ${this.run.nivel}!</h2><p class="text-center text-sm text-zinc-400">Elige 1 arma y 1 táctico</p>
      ${['arma', 'tactico'].map(tipo => `
        <div class="mt-4 flex items-baseline justify-between"><b>${tipo === 'arma' ? '🔫 Armas' : '🧠 Tácticos'}</b><span class="text-sm">${espacios(tipo)}</span></div>
        <div class="mt-2 grid gap-2">${ops[tipo].map((op, i) => { const [ic, n, d] = etiqueta(op), on = elegido[tipo] === i;
          return `<button data-op="${tipo}|${i}" class="flex items-center gap-3 rounded-2xl border-2 p-3 text-left touch-manipulation ${on ? 'border-emerald-400 bg-emerald-400/10' : 'border-zinc-700 bg-zinc-900'}"><span class="text-3xl">${ic}</span><span><b>${n}</b><br><small class="text-zinc-400">${d}</small><span class="mt-1 flex flex-wrap gap-1">${chipsProps(propsDe(op))}</span></span></button>`; }).join('')}</div>`).join('')}
      <button data-a="ok" class="${UI.btnP} mt-5" ${elegido.arma != null && elegido.tactico != null ? '' : 'disabled'}>Continuar</button>`,
    e => {
      const op = e.target.closest('[data-op]')?.dataset.op;
      if (op){ const [tipo, i] = op.split('|'); elegido[tipo] = +i; return pintar(); }
      if (e.target.closest('[data-a="ok"]')){
        for (const tipo of ['arma', 'tactico']){
          const o = ops[tipo][elegido[tipo]];
          if (o.accion === 'reparar') this.run.base.vida = Math.min(this.run.base.vidaMax, this.run.base.vida + 30); else l.aplicar(o);
        }
        const b = this.run.base, nuevaMax = this.run.vidaBase + l.efecto('vida', 0);
        b.vida += Math.max(0, nuevaMax - b.vidaMax); b.vidaMax = nuevaMax;
        this.mundo.sincronizarArmas(); this.cerrarCapa(); this.dibujarMano();
      }
    });
    pintar();
  }
  mostrarPausa(){
    this.abrirCapa(`<div class="m-auto flex w-full max-w-sm flex-col gap-3"><h2 class="text-center text-2xl font-black">⏸ Pausa</h2>
      ${['arma', 'tactico'].map(tipo => `<div class="text-sm font-bold">${tipo === 'arma' ? '🔫 Armas' : '🧠 Tácticos'} ${this.run.loadout.lista(tipo).length}/${ESPACIOS[tipo]}</div>
        ${this.run.loadout.lista(tipo).map(b => `<div class="${UI.card} !p-2.5"><div class="flex items-center gap-2"><span class="text-xl">${b.def.icon}</span><b class="flex-1 text-sm">${b.def.name}</b>${pips(b.nivel, b.nivel > 3 ? 4 : 3)}</div><div class="mt-1 flex flex-wrap gap-1">${chipsProps(b.props)}</div></div>`).join('') || '<div class="text-xs text-zinc-500">Sin tácticos todavía</div>'}`).join('')}
      <button data-a="seguir" class="${UI.btnP}">▶ Continuar</button><button data-a="menu" class="${UI.btn}">Abandonar partida</button></div>`,
    e => {
      if (e.target.closest('[data-a="seguir"]')) this.cerrarCapa();
      if (e.target.closest('[data-a="menu"]')) this.fin(false, true);
    });
  }

  /* ---- Progresión ---- */
  oleadaTerminada(){
    const r = this.run;
    if (r.oleada < OLEADAS){ r.oleada++; }
    else if (r.mision < MISIONES){ r.mision++; r.oleada = 1; r.base.vida = Math.min(r.base.vidaMax, r.base.vida + 25); this.aviso('¡Misión cumplida! +25 ❤'); }
    else return this.fin(true);
    this.iniciarOleada();
  }
  fin(victoria, abandono = false){
    if (this.terminado) return; this.terminado = true;
    const r = this.run, pts = this.app.progreso.registrarPartida(r.xpTotal);
    this.abrirCapa(`<div class="m-auto flex w-full max-w-sm flex-col gap-3 text-center">
      <div class="text-6xl">${victoria ? '🏆' : '💥'}</div><h2 class="text-2xl font-black">${victoria ? '¡La Tierra está a salvo!' : abandono ? 'Partida abandonada' : 'La base cayó'}</h2>
      <div class="${UI.card} grid grid-cols-2 gap-2 text-left text-sm">
        <span>Misión alcanzada</span><b class="text-right">${r.mision} · oleada ${r.oleada}</b>
        <span>Problemas resueltos</span><b class="text-right">${r.problemas}</b>
        <span>Con pasos mínimos</span><b class="text-right">${r.eficientes}</b>
        <span>Aliens y naves</span><b class="text-right">${r.bajas}</b>
        <span>XP total</span><b class="text-right">${Math.round(r.xpTotal)}</b>
        <span>Puntos de investigación</span><b class="text-right text-amber-300">+${pts} 🔬</b></div>
      <button data-a="otra" class="${UI.btnP}">↻ Jugar otra vez</button><button data-a="mejoras" class="${UI.btn}">🛠 Mejoras</button><button data-a="menu" class="${UI.btn}">Menú</button></div>`,
    e => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'otra') this.app.go(new BattleScene(this.app, new Run(this.app)));
      if (a === 'mejoras') this.app.go(new ShopScene(this.app));
      if (a === 'menu') this.app.go(new MenuScene(this.app));
    });
  }
}

/* ---------- Adaptador de la paleta de piezas de "Aprender" (patrón Adapter) ---------- */
class TableroPiezas {
  static KEY = 'g-libre';
  constructor(host){ this.host = host; this.abierto = false; LEGO_HOOKS[TableroPiezas.KEY] = () => this.render(); }
  abrir({expr, piezas, ayuda, confirmar, cancelar}){
    Object.assign(this, {expr, piezas, ayuda, confirmar, cancelar, error:''});
    LEGO[TableroPiezas.KEY] = undefined;                      // lienzo limpio
    this.abierto = true; this.host().classList.remove('hidden'); this.render();
  }
  cerrar(){ if (!this.abierto) return; this.abierto = false; const h = this.host(); h.classList.add('hidden'); h.innerHTML = ''; }
  render(){
    if (!this.abierto) return;
    const key = TableroPiezas.KEY, st = legoState(key); ZREG[key] = [];
    const piezas = this.piezas;
    const h = this.host();
    h.innerHTML = `<div data-lego="${key}" class="absolute inset-x-0 bottom-0 max-h-[85%] overflow-y-auto rounded-t-3xl border-t border-zinc-700 bg-zinc-100 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-zinc-900 shadow-2xl">
      <div class="flex items-center justify-between"><b>✍️ Paso libre</b><button data-pl="cancelar" class="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-300 bg-white">✕</button></div>
      <div class="mt-1 text-xs text-zinc-500">Tienes:</div><div class="overflow-x-auto text-center text-lg">${texJuego(this.expr)}</div>
      <div class="mb-1 text-xs text-zinc-500">${this.ayuda}</div>
      ${zoneHTML(key, st.root, 0)}
      ${allZones(st.root).length > 1 ? `<div class="mt-2 text-right"><button class="${C.btn} !min-h-9 !py-1 !text-xs" data-lg="nextzone">⇥ Siguiente espacio</button></div>` : ''}
      ${paletteHTML(key, {k:piezas, orden:true}, st)}
      ${this.error ? `<div class="mt-2 rounded-xl bg-rose-100 px-3 py-2 text-sm font-medium text-rose-800">${this.error}</div>` : ''}
      <div class="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
        <button data-pl="ok" class="${UI.btnP}">✔ Usar este paso</button>
        <button data-lg="undo" class="${C.btn}" aria-label="Deshacer">↶</button><button data-lg="clear" class="${C.btn}" aria-label="Limpiar">🗑</button></div></div>`;
    h.onclick = e => {
      const a = e.target.closest('[data-pl]')?.dataset.pl;
      if (a === 'cancelar'){ this.cerrar(); this.cancelar(); }
      if (a === 'ok'){ const err = this.confirmar(ser(st.root)); if (err){ this.error = err; this.render(); } else this.cerrar(); }
    };
  }
}
