/* =====================================================================
   DEFENSA ALGEBRAICA · 5) Fuera de la batalla: Catálogo, Mejoras y Mazo
   - Catálogo: cartas (disponibles / por desbloquear), armas, tácticos y
     entidades (soldados y enemigos) con vista previa animada y estadísticas.
     Lo no descubierto aparece como silueta «Desconocido».
   - Mejoras: árbol de mejoras permanentes por categoría (🔬 puntos).
   - Mazo: combinaciones de cartas guardadas para todas las partidas,
     una lista por área; se arman arrastrando cartas a un recuadro.
   ===================================================================== */
const INFO_ENEMIGO = {
  explorador:{name:'Alien explorador', desc:'Cae en cápsula y avanza a pelear cuerpo a cuerpo.'},
  blindado:  {name:'Alien blindado', desc:'Su armadura reduce a la mitad el daño físico.'},
  saltador:  {name:'Saltador', desc:'Rápido: brinca por encima de tus soldados hasta la base.'},
  acido:     {name:'Escupeácido', desc:'Se queda lejos y escupe ácido a tus soldados.'},
  escudero:  {name:'Escudero', desc:'Su escudo reduce el daño de energía.'},
  excavador: {name:'Excavador', desc:'Avanza bajo tierra (no se le puede apuntar) y emerge cerca.'},
  nave:      {name:'Nave nodriza', desc:'Vuela y suelta exploradores lejos de la base.'},
  dron:      {name:'Dron', desc:'Vuela directo a la base y explota.'},
  bombardero:{name:'Bombardero', desc:'Suelta bombas sobre tus soldados.'},
  caza:      {name:'Caza', desc:'Se queda a distancia disparando láser a la base.'},
  portadrones:{name:'Portadrones', desc:'Nave grande que lanza drones.'},
  coloso:    {name:'Coloso', desc:'Jefe de la misión 1: aplasta soldados y lanza rocas.'},
  reina:     {name:'Reina del enjambre', desc:'Jefe de la misión 2: invoca aliens y escupe ácido.'},
  acorazado: {name:'Acorazado orbital', desc:'Jefe de la misión 3: láser a la base y lanza cazas.'},
  mente:     {name:'Mente maestra', desc:'Jefe final: solo es vulnerable unos segundos después de resolver un problema.'},
};
Object.assign(INFO_ENEMIGO, INFO_EXTRA);   // Comandantes, Soberanos y alienígenas de cada mundo
const ARMA_ENEMIGA = {acido:'🟢 Ácido', laser:'🔴 Láser', rayo:'🟣 Rayo mental', roca:'🪨 Roca', bomba:'💣 Bombas', invocar:'👾 Invoca', lluvia:'☄️ Lluvia de rocas', pulso:'💢 Onda', drenar:'🔋 Roba energía', blindar:'🛡 Se blinda', curar:'💚 Cura aliados'};
const ETIQUETA_STAT = {dmg:'Daño', cd:'Recarga (s)', costo:'Costo ⚡', area:'Radio', saltos:'Saltos', vel:'Velocidad', energia:'Energía ×', vida:'Vida base +', regen:'Regenera /s',
  lentitud:'Velocidad enemiga ×', soldados:'Soldados +', reclutar:'Reclutar ×', perforacion:'Perforación', ventana:'Segundos de rapidez +', vidaSoldado:'Vida de soldado +', curar:'Curación /s'};
const EJEMPLO_CARTA = {
  dist:['3(x+2)', '3x+6'], seme:['2x+5x+1', '7x+1'], mover:['x+4=9', 'x=9-4'], div:['3(x-1)=12', 'x-1=\\tfrac{12}{3}'], oper:['\\tfrac{12}{3}', '4'], libre:['2x+4=10', 'x=3'],
  'd-suma':["(x^2+x)'", "(x^2)'+(x)'"], 'd-kf':["(5x^3)'", "5(x^3)'"], 'd-cte':["(7)'", '0'], 'd-pot':["(x^4)'", '4x^3'], 'd-tabla':["(\\sin x)'", '\\cos x'],
  'd-prod':["(x\\sin x)'", '\\sin x+x\\cos x'], 'd-cad':["(\\sin 3x)'", '3\\cos 3x'],
  'i-suma':['\\int(x+1)', '\\int x+\\int 1'], 'i-kf':['\\int 4x', '4\\int x'], 'i-cte':['\\int 5\\,dx', '5x'], 'i-pot':['\\int x^2', '\\tfrac{x^3}{3}'],
  'i-ln':['\\int\\tfrac{1}{x}', '\\ln|x|'], 'i-tabla':['\\int\\cos x', '\\sin x'], 'i-sust':['\\int e^{2x}', '\\tfrac{1}{2}e^{2x}'], 'i-c':['x^2', 'x^2+C'],
};
const btnVolver = `<button data-a="volver" class="${UI.btn} !min-h-10 !px-3">◂ Volver</button>`;
const tabs = (lista, actual) => `<div class="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">${lista.map(([id, ic, n]) =>
  `<button data-tab="${id}" class="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 py-2 text-sm touch-manipulation ${actual === id ? 'border-emerald-400 bg-emerald-400/15 text-emerald-200' : 'border-zinc-700 bg-zinc-900'}">${ic} ${n}</button>`).join('')}</div>`;
const tablaStats = filas => `<div class="overflow-x-auto"><table class="w-full text-xs [&_td]:border-b [&_td]:border-zinc-800 [&_td]:px-2 [&_td]:py-1 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:text-zinc-400">${filas}</table></div>`;

/** Animación de fusión: dos energías orbitan, chocan y aparece el resultado (o ❔ si no se ha descubierto). */
const fusionAnim = (icon, oculto) => `<div class="relative flex h-[4.4rem] items-center justify-center overflow-hidden">
  <span class="absolute h-2.5 w-2.5 rounded-full bg-sky-300 shadow-[0_0_10px_3px_rgba(125,211,252,.8)] [animation:orbe-a_2.6s_ease-in-out_infinite]"></span>
  <span class="absolute h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_10px_3px_rgba(252,211,77,.8)] [animation:orbe-b_2.6s_ease-in-out_infinite]"></span>
  <span class="absolute h-12 w-12 rounded-full bg-fuchsia-400/30 [animation:destello_2.6s_ease-out_infinite]"></span>
  <span class="relative text-4xl [animation:fusion-pop_2.6s_ease-in-out_infinite] ${oculto ? 'brightness-0 opacity-60' : ''}">${icon}</span></div>`;

/** ¿Se usan las vitrinas 3D del catálogo? (gráficos 3D activos y Three.js disponible) */
const vitrina3D = () => Graficos.ui3d && !!Kit3D && Lienzos3D.autoprueba();
/* ---------- Vista previa animada (keyframes en canvas) ---------- */
class VistaPrevia extends Renderer {
  constructor(cv, item){ super(cv); this.item = item; }
  dibujar(t){
    const c = this.ctx, s = this.cv.width / 120, {suelo} = MUNDO, it = this.item;
    c.setTransform(s, 0, 0, s, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, 70); g.addColorStop(0, '#0b1023'); g.addColorStop(1, '#312e81'); c.fillStyle = g; c.fillRect(0, 0, 120, 70);
    c.fillStyle = '#1c1917'; c.fillRect(0, 58, 120, 12);
    c.setTransform(s, 0, 0, s, 0, s * (58 - suelo));                  // coordenadas del mundo con el suelo en y = 58
    if (it.kind === 'potarma') return this.armaSoldado(c, it, t);
    if (it.kind === 'arma') return this.arma(c, it.id, t);
    if (it.kind === 'soldado') return this.soldadoAnim(c, it.id, t, it.uid);
    return this.enemigoAnim(c, it.id, t);
  }
  soldadoAnim(c, tipo, t, uid = null){
    const s = new Soldado(0, tipo), R = uid ? RASGOS_SOLDADO[uid] : null, y = MUNDO.suelo, bala = R?.bala ?? '#fde047';
    if (R) s.perfil = {cuerpo:R.cuerpo, casco:R.casco, bala:R.bala};      // aspecto propio del soldado
    s.x = 26;
    c.save(); c.translate(26, y); c.scale(2.4, 2.4); c.translate(-26, -y); this.soldado(c, s); c.restore();   // más grande para que se vean sus colores
    if (SOLDADOS[tipo].ataque || tipo === 'fusilero'){                    // bala con su color y estela
      const u = t % 1, x0 = 42, by = (k) => y - 22 - (tipo === 'granadero' ? 22 * Math.sin(Math.PI * k) : 0);
      for (let k = 6; k >= 0; k--){ const v = Math.max(0, u - k * 0.04); c.globalAlpha = k ? 0.12 * (7 - k) / 2 : 1; c.fillStyle = bala;
        c.beginPath(); c.arc(x0 + v * 70, by(v), k ? 2 : 3, 0, 6.28); c.fill(); }
      c.globalAlpha = 1;
    }
    if (SOLDADOS[tipo].apoyo){ c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4); c.font = 'bold 11px system-ui'; c.textAlign = 'center'; c.fillStyle = bala; c.fillText(tipo === 'medico' ? '+❤' : '+🔧', 60, y - 30 - (t * 10 % 8)); c.globalAlpha = 1; }
  }
  enemigoAnim(c, id, t){
    const e = ENEMIGOS[id](60, {vida:1, velocidad:1});
    e.x = 60; e.fase = t * 8; e.escala = Math.min(e.escala, 1.5); e.estado = 'camina';
    if (e.vuela){ e.y = MUNDO.suelo - 30 + Math.sin(t * 2) * 3; if (e.escudoMental) e.escudoT = (t % 4) < 1.5 ? 1 : 0; }
    else { e.y = MUNDO.suelo; if (id === 'saltador'){ const u = t % 2; if (u < 0.7) e.y -= 18 * Math.sin(Math.PI * u / 0.7); } if (id === 'excavador') e.bajoTierra = (t % 3) < 1.5; }
    this.enemigo(c, e, t);
  }
  /** Un soldado dispara su arma: se ven sus partículas (y cómo las cambia el potenciador). */
  armaSoldado(c, it, t){
    const s = new Soldado(0, it.tipo); s.x = 18; this.soldado(c, s);
    const e = ENEMIGOS.explorador(100, {vida:1, velocidad:1}); e.x = 100; e.y = MUNDO.suelo; e.estado = 'camina'; e.fase = t * 6; this.enemigo(c, e, t);
    const fx = fxDisparo({potenciadores:potenciadoresMuestra(it)}, it.arma), granada = fx.forma === 'granada' || fx.forma === 'orbe' && it.tipo === 'granadero';
    for (let k = 0; k < 3; k++){
      const u = ((t * 0.9 + k / 3) % 1), x = 24 + 72 * u, y = MUNDO.suelo - 12 - (granada ? 26 * Math.sin(Math.PI * u) : 0);
      const hist = fx.estela ? Array.from({length:3 + 2 * fx.estela}, (_, j) => [x - (j + 1) * 3, y]).reverse().flat() : null;
      this.bala(c, {x, y, tx:100, ty:MUNDO.suelo - 12, fx, hist, color:fx.color, r:fx.r * 1.2}, t);
      if (u > 0.93 && fx.anillo){ c.strokeStyle = fx.color; c.globalAlpha = 0.6; c.beginPath(); c.arc(100, MUNDO.suelo - 10, 4 + fx.anillo * 2, 0, 6.28); c.stroke(); c.globalAlpha = 1; }
    }
  }
  arma(c, id, t){
    const d = BONUS_DEFS[id], p = d.props, {suelo} = MUNDO, u = (t % 1.4) / 1.4;
    c.fillStyle = '#475569'; c.fillRect(4, suelo - 14, 16, 14);
    const aire = p.prioridad === 'aire' || p.alcance === 'aire';
    const objs = p.objetivo === 'cadena' ? [[70, suelo], [90, suelo], [108, suelo]] : [[100, aire ? suelo - 34 : suelo]];
    objs.forEach(([x, y]) => { const e = aire && objs.length === 1 ? ENEMIGOS.nave(y, {vida:1, velocidad:1}) : ENEMIGOS.explorador(x, {vida:1, velocidad:1}); e.x = x; e.y = y; e.estado = 'camina'; e.fase = t * 6; this.enemigo(c, e, t); });
    const color = {fisico:'#fde047', energia:'#c4b5fd', explosivo:p.efecto === 'congelar' ? '#7dd3fc' : '#fb923c'}[p.dano];
    const x0 = 20, y0 = suelo - 14, [tx, ty0] = objs[0], ty = ty0 - (aire ? 0 : 8);
    if (p.movimiento === 'rayo'){
      if (u < 0.35){ c.strokeStyle = id === 'tesla' ? '#93c5fd' : id === 'foton' ? '#a5f3fc' : '#f87171'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y0); objs.forEach(([x, y]) => c.lineTo(x, y - 8)); c.stroke(); }
      return;
    }
    const x = x0 + (tx - x0) * u;
    const y = p.movimiento === 'parabola' ? y0 + (ty - y0) * u - 30 * Math.sin(Math.PI * u) : p.movimiento === 'guiado' ? y0 + (ty - y0) * u - 14 * Math.sin(Math.PI * u) * (1 - u) : y0 + (ty - y0) * u;
    c.fillStyle = color; c.beginPath(); c.arc(x, y, p.objetivo === 'area' ? 2.2 : 1.4, 0, 6.28); c.fill();
    if (p.objetivo === 'area' && u > 0.8){ c.strokeStyle = color; c.globalAlpha = (1 - u) * 5; c.beginPath(); c.arc(tx, ty, 4 + (u - 0.8) * 60, 0, 6.28); c.stroke(); c.globalAlpha = 1; }
  }
}

/* ---------- Catálogo ---------- */
class CatalogoScene extends Scene {
  enter(){ this.tab ??= 'cartas'; this.todo = !!this.app.progreso.data.todo; this.pintar(); }   // «ver todo» solo existe con el modo desarrollador   // en modo desarrollo se ve todo
  exit(){ cancelAnimationFrame(this.raf); this.soltarVisores(); if (this.tecla) document.removeEventListener('keydown', this.tecla); this.tecla = null; }
  soltarVisores(){ this.obs?.disconnect(); (this.visores ?? []).forEach(v => v.dispose()); this.visores = []; }
  conocido(cat, id){ return this.todo || this.app.progreso.conocido(cat, id); }
  dominioDisponible(dom){ const d = this.app.progreso.data; return this.todo || dom.tipos.some(t => d.todo || this.app.tipoDesbloqueado(t)); }
  items(){
    if (this.tab === 'cartas') return Object.values(DOMINIOS).flatMap(dom => dom.cartas.all().map(c => ({kind:'carta', id:c.id, c, dom, ok:this.todo || c.free && this.dominioDisponible(dom) || this.app.cartaDesbloqueada(c.id), name:c.name})));
    // Armas = las de los soldados (3 por tipo) y, debajo de cada una, sus 6 potenciadores
    if (this.tab === 'armas') return TIPOS_TROPA.flatMap(tipo => ARMAS_TROPA[tipo].flatMap(([id, name, icon, st, desc], k) => [
      {kind:'potarma', grupo:id, tipo, arma:id, pot:null, id, x:{icon, nombre:name, desc}, ok:this.todo || tropaDesbloqueada(this.app, tipo, 'arma', k), name},
      ...PLANTILLAS_POT.map(p => { const pid = `${id}:${p.k}`; return {kind:'potarma', grupo:id, tipo, arma:id, pot:pid, id:pid, x:POTENCIADORES[pid], ok:this.conocido('potenciadores', pid), name:POTENCIADORES[pid].nombre}; }),
      {kind:'potarma', grupo:id, tipo, arma:id, pot:'todos', id:`${id}:todos`, ok:this.todo || tropaDesbloqueada(this.app, tipo, 'arma', k), name:`Todos a la vez · ${name}`,   // muestra cómo se mezclan los 6 potenciadores
        x:{icon:'🌈', nombre:`Todos a la vez · ${name}`, armaNombre:name, desc:'Así dispara con los 6 potenciadores al nivel máximo: los efectos se suman en el mismo disparo.'}}]));
    if (this.tab === 'tacticos') return Object.entries(BONUS_DEFS).filter(([, d]) => d.tipo === 'tactico' && !d.fusion).map(([id, d]) => ({kind:'tactico', id, d, ok:this.conocido('tacticos', id), name:d.name}));
    // Fusiones: se sabe que existen, pero no cómo se consiguen (se descubren jugando)
    // ⚡ Potenciadores: 6 superpotenciadores + 6 por cada una de las 15 armas de los soldados
    // Fusiones = superpotenciadores (3 de arma y 3 con táctica) + fusiones entre tácticos
    if (this.tab === 'fusiones') return [...Object.values(FUSIONES_ARMA).map(F => ({kind:'pot', id:F.id, d:{icon:F.icon}, x:{...F, fusionArma:true}, grupo:'fa-' + F.arma, tipo:F.tipo, ok:this.conocido('fusiones', F.id), name:F.nombre})),   // 45: 3 por cada arma
      ...Object.entries(SUPERPOTENCIADORES).map(([id, x]) => ({kind:'pot', id, d:{icon:x.icon}, x, grupo:'super', ok:this.conocido('potenciadores', id), name:x.nombre})),
      ...FUSIONES.filter(f => BONUS_DEFS[f.a].tipo === 'tactico' && BONUS_DEFS[f.b].tipo === 'tactico').map(f => ({kind:'fusion', grupo:'fus', id:f.resultado, d:BONUS_DEFS[f.resultado], ok:this.conocido('fusiones', f.resultado), name:BONUS_DEFS[f.resultado].name}))];
    // Entidades en dos grupos: 🪖 Soldados y 👽 Alienígenas (comunes, Comandantes y Soberanos)
    const g = id => INFO_ENEMIGO[id].grupo ?? (ENEMIGOS[id](0, {vida:1, velocidad:1}).jefe ? 'soberano' : 'comun');
    const orden = {comun:0, comandante:1, soberano:2};
    return [...TIPOS_TROPA.flatMap(tipo => SOLDADOS_UNICOS[tipo].map((x, k) => ({kind:'soldado', grupo:'soldados', id:tipo, uid:x[0], x, ok:this.todo || tropaDesbloqueada(this.app, tipo, 'soldado', k), name:x[1]}))),   // los 20 soldados (4 por tipo), también los aún desconocidos
            ...Object.keys(ENEMIGOS).map(id => ({kind:'enemigo', grupo:g(id), id, ok:this.conocido('enemigos', id), name:INFO_ENEMIGO[id].name})).sort((a, b) => orden[a.grupo] - orden[b.grupo])];
  }
  tile(it, i){
    const desconocido = !it.ok, nombre = desconocido ? (it.kind === 'carta' ? '🔒 ' + it.name : 'Desconocido') : it.name;
    const vista = vitrina3D() && it.kind !== 'carta' ? `<canvas data-prev="${i}" class="block aspect-[120/70] w-full rounded-lg bg-gradient-to-b from-[#0b1023] to-[#312e81] ${desconocido ? 'brightness-0 opacity-60' : ''}"></canvas>`   // vitrina 3D animada
      : it.kind === 'fusion' ? fusionAnim(it.d.icon, desconocido)
      : it.kind === 'carta' ? `<div class="flex justify-center py-1 ${desconocido ? 'grayscale opacity-40' : ''}">${cartaHTML(it.c, it.dom, {attr:'', chica:true})}</div>`
      : (it.kind === 'tactico' || it.kind === 'pot') ? `<div class="flex h-[4.4rem] items-center justify-center text-4xl ${desconocido ? 'brightness-0 opacity-50' : '[animation:flotar_2s_ease-in-out_infinite]'}">${it.d.icon}</div>`
      : `<canvas data-prev="${i}" class="block aspect-[120/70] w-full rounded-lg ${desconocido ? 'brightness-0 opacity-60' : ''}"></canvas>`;
    return `<button data-item="${i}" class="rounded-2xl border border-zinc-800 bg-zinc-900 p-1.5 text-left touch-manipulation active:scale-[0.98] transition-transform">${vista}<div class="mt-1 truncate px-1 text-xs font-semibold ${desconocido ? 'text-zinc-500' : ''}">${nombre}</div></button>`;
  }
  pintar(){
    cancelAnimationFrame(this.raf);
    const items = this.items(), ok = items.filter(x => x.ok).length;
    this.lista = items;
    this.app.html(`
    <div class="mx-auto flex h-full max-w-2xl flex-col px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div class="flex items-center justify-between">${btnVolver}${this.app.progreso.data.todo ? '<span class="text-xs text-amber-300">🧪 Modo desarrollador: todo visible</span>' : ''}</div>
      <h2 class="mt-3 text-2xl font-black">📚 Catálogo</h2>
      ${tabs([['cartas', '🃏', 'Cartas'], ['armas', '🔫', 'Armas'], ['tacticos', '🧠', 'Tácticos'], ['fusiones', '⚗️', 'Fusiones'], ['entidades', '👽', 'Entidades']], this.tab)}
      <p class="mt-1 text-xs text-zinc-400">${this.tab === 'cartas' ? `${ok}/${items.length} cartas disponibles · las demás se desbloquean en la 🗺️ Ruta o avanzando en Aprender`
        : this.tab === 'fusiones' ? `${ok}/${items.length} fusiones descubiertas · existen fusiones entre armas, entre tácticos y entre armas y tácticos. ¿Cuáles? Descúbrelo jugando.`
        : `${ok}/${items.length} descubiertos · se descubren al obtenerlos o verlos en una partida`}</p>
      <div class="mt-2 grid flex-1 grid-cols-2 content-start gap-2 overflow-y-auto pb-4 sm:grid-cols-3">${items.map((it, i) => (it.grupo && it.grupo !== items[i - 1]?.grupo ? `<div class="col-span-full mt-2 text-sm font-black text-zinc-300">${it.kind === 'potarma' ? `${SOLDADOS[it.tipo].icon} ${it.x.nombre ?? it.name} · ${SOLDADOS[it.tipo].name}` : it.kind === 'pot' ? (it.x.fusionArma ? `⚗️ ${it.x.armaIcon} ${it.x.armaNombre} · ${SOLDADOS[it.tipo].name} (${Object.values(FUSIONES_ARMA).filter(F => F.arma === it.x.arma).length} fusiones)` : '🌟 Superpotenciadores') : it.kind === 'fusion' ? '⚗️ Fusiones de tácticos' : {soldados:'🪖 Soldados', comun:'👽 Alienígenas · comunes y de cada mundo', comandante:'🎖️ Alienígenas · Comandantes (subjefes)', soberano:'👑 Alienígenas · Soberanos (jefes)'}[it.grupo]}</div>` : '') + this.tile(it, i)).join('')}</div>
      <div data-h="detalle" class="absolute inset-0 z-20 hidden"></div>
    </div>`).onclick = e => this.click(e);
    this.animar();
  }
  animar(){
    this.soltarVisores();
    // Solo se dibujan las fichas visibles (y, con la ficha grande abierta, solo esa)
    this.obs = new IntersectionObserver(es => es.forEach(e => { const v = this.visores.find(v => v.cv === e.target); if (v) v.visible = e.isIntersecting; }));
    const vistas = [...this.app.root.querySelectorAll('canvas[data-prev], canvas[data-grande]')].map(cv => {
      const grande = cv.dataset.grande != null, it = grande ? this.detalle : this.lista[+cv.dataset.prev];
      if (vitrina3D()){
        try { const v = new Vitrina3D(cv, it, grande); this.visores.push(v); this.obs.observe(cv); return v; } catch (err){ console.warn('Vitrina 3D no disponible:', err); }
      }
      return new VistaPrevia(cv, it.kind === 'potarma' ? it : {kind:it.kind === 'enemigo' ? 'enemigo' : it.kind === 'fusion' ? 'arma' : it.kind, id:it.id, uid:it.uid});   // uid: el soldado concreto (sus colores)
    });
    const t0 = performance.now(); let n = 0;
    const paso = now => { const t = Math.max(0, (now - t0) / 1000), conDetalle = !!this.detalle; n++;   // el primer cuadro puede traer una marca anterior
      for (const v of vistas){ if (v.visible === false) continue; if (v.grande === false && (conDetalle || n % 2)) continue; v.dibujar(t); }   // fichas pequeñas a 30 cuadros/s
      this.raf = requestAnimationFrame(paso); };
    this.raf = requestAnimationFrame(paso);
  }
  click(e){
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'volver') return this.detalle ? this.cerrarDetalle() : this.app.go(new MenuScene(this.app));
    if (a === 'vertodo'){ this.todo = e.target.checked; return this.pintar(); }
    const tab = e.target.closest('[data-tab]')?.dataset.tab; if (tab){ this.tab = tab; return this.pintar(); }
    const it = e.target.closest('[data-item]')?.dataset.item; if (it != null) return this.abrirDetalle(this.lista[+it]);
    if (e.target.closest('[data-a="detprev"]')) return this.moverDetalle(-1);
    if (e.target.closest('[data-a="detnext"]')) return this.moverDetalle(1);
    if (e.target.closest('[data-a="cerrar"]')) this.cerrarDetalle();
  }
  cerrarDetalle(){ this.detalle = null; this.pintar(); }
  /** Pasa al elemento anterior (−1) o siguiente (+1) sin salir de la pantalla completa. */
  moverDetalle(d){ const L = this.lista, i = L.indexOf(this.detalle); if (i < 0) return; this.abrirDetalle(L[(i + d + L.length) % L.length]); }
  abrirDetalle(it){
    this.detalle = it;
    const P = this.app.progreso, cont = this.app.root.querySelector('[data-h="detalle"]');
    let vista = '', cuerpo = '';
    if (!it.ok){
      vista = it.kind === 'carta' ? `<div class="flex justify-center grayscale opacity-40">${cartaHTML(it.c, it.dom, {attr:''})}</div>` : `<div class="flex h-40 items-center justify-center text-7xl">❔</div>`;
      if (it.kind === 'fusion') vista = `<div class="pointer-events-none overflow-hidden py-6"><div class="scale-150">${fusionAnim('❔', true)}</div></div>`;
      cuerpo = `<p class="text-zinc-400">${it.kind === 'carta' ? `Se desbloquea en la 🗺️ Ruta o al avanzar en <b>${it.dom.nombre}</b> en Aprender (o con 🧪 Todo desbloqueado).`
        : it.kind === 'fusion' ? 'Existe una fusión secreta aquí. Lleva bonificadores al nivel máximo durante una partida y prueba combinaciones para descubrirla.'
        : 'Aún no lo has encontrado. Juega partidas para descubrirlo.'}</p>`;
    } else if (it.kind === 'carta'){
      const [antes, despues] = EJEMPLO_CARTA[it.id] ?? ['', ''];
      vista = `<div class="flex justify-center">${cartaHTML(it.c, it.dom, {attr:''})}</div>`;
      cuerpo = `<p class="text-sm text-zinc-300">${it.c.desc}. ${it.c.pista ?? ''}</p>
        <div class="relative mt-3 flex h-16 items-center justify-center rounded-2xl bg-zinc-900 text-xl">
          <span class="absolute [animation:cat-a_4s_ease-in-out_infinite]">${texJuego(antes, false)}</span>
          <span class="absolute text-emerald-300 [animation:cat-b_4s_ease-in-out_infinite]">${texJuego(despues, false)}</span></div>
        <p class="mt-1 text-center text-xs text-zinc-500">Ejemplo animado: antes → después</p>
        <p class="mt-2 text-xs text-zinc-400">Área: ${it.dom.icon} ${it.dom.nombre} · usada en partidas: ${P.conocido('cartas', it.id) ? 'sí' : 'todavía no'}</p>`;
    } else if (it.kind === 'potarma'){
      const x = it.x;
      vista = `<canvas data-grande class="block aspect-[120/70] w-full rounded-2xl bg-gradient-to-b from-[#0b1023] to-[#312e81]"></canvas>`;
      cuerpo = `<p class="text-sm text-zinc-300">${x.desc}</p><p class="mt-2 text-xs text-zinc-400">${it.pot === 'todos' ? `💥 Carga reforzada: bala más grande · ⏩ Mecanismo rápido + 📏 Mira extendida: estela más larga · 🌀 Onda expansiva: anillo alrededor · 🔩 Punta perforante: raya cian delante · 🎯 Golpe certero: chispas. Las fusiones del arma además cambian su color.`
        : it.pot ? `Potenciador de <b>${x.armaNombre}</b> (${SOLDADOS[it.tipo].name}): se elige al subir de nivel en la partida, hasta nivel ${MAX_POT}. Mira cómo cambia el disparo.` : `Arma de ${SOLDADOS[it.tipo].name}: se equipa y mejora en 🪖 Pelotón. Tiene 6 potenciadores.`}</p>`;
    } else if (it.kind === 'pot'){
      const x = it.x;
      vista = vitrina3D() ? `<canvas data-grande class="block aspect-[120/70] w-full rounded-2xl bg-gradient-to-b from-[#0b1023] to-[#312e81]"></canvas>` : `<div class="flex h-36 items-center justify-center"><span class="text-7xl [animation:flotar_2s_ease-in-out_infinite]">${x.icon}</span></div>`;
      cuerpo = x.fusionArma ? `<p class="text-sm text-zinc-300">${x.desc}</p><p class="mt-2 text-xs text-zinc-400">Fusión de ${x.armaIcon} <b>${x.armaNombre}</b> (${SOLDADOS[x.tipo].name}) con el táctico ${BONUS_DEFS[x.tactico].icon} <b>${BONUS_DEFS[x.tactico].name}</b>. Aparece al final de una oleada, cuando esa arma tiene 3 niveles de potenciadores y el táctico está en tu equipo. También cambia sus partículas.</p>`
        : `<p class="text-sm text-zinc-300">${x.desc}</p><p class="mt-2 text-xs text-zinc-400">${x.arma ? `${x.armaIcon} Potencia el arma <b>${x.armaNombre}</b> (${SOLDADOS[x.tipo].name}). Se elige al final de una oleada, cuando su tipo de soldado sube de nivel; hasta nivel ${MAX_POT}.`
        : `${x.clase === 'arma' ? 'Superpotenciador de arma: aparece cuando tienes 2 potenciadores al máximo.' : 'Superpotenciador con táctica: aparece con 1 potenciador y 1 táctico al máximo.'} Sirve para todas las armas.`}</p>`;
    } else if (it.kind === 'arma' || it.kind === 'tactico' || it.kind === 'fusion'){
      const d = it.d, niveles = d.niveles.map((n, i) => n && [i + 1, n]).filter(Boolean), claves = Object.keys(niveles[0][1]);
      const esArma = d.tipo === 'arma';
      const mejora = P.nivel((esArma ? 'arma-' : 'tac-') + (esArma ? armaBase(it.id) : it.id));
      vista = vitrina3D() ? `<canvas data-grande class="block aspect-[120/70] w-full rounded-2xl bg-gradient-to-b from-[#0b1023] to-[#312e81]"></canvas>`
        : it.kind === 'fusion' ? `<div class="grid gap-2">${esArma ? `<canvas data-grande class="block aspect-[120/70] w-full rounded-2xl bg-gradient-to-b from-[#0b1023] to-[#312e81]"></canvas>` : ''}<div class="pointer-events-none overflow-hidden ${esArma ? '' : 'py-6'}"><div class="${esArma ? '' : 'scale-150'}">${fusionAnim(d.icon, false)}</div></div></div>`
        : it.kind === 'arma' ? `<canvas data-grande class="block aspect-[120/70] w-full rounded-2xl bg-gradient-to-b from-[#0b1023] to-[#312e81]"></canvas>` : `<div class="flex h-36 items-center justify-center"><span class="relative text-7xl [animation:flotar_2s_ease-in-out_infinite]">${d.icon}<span class="absolute inset-0 animate-ping rounded-full bg-emerald-400/10"></span></span></div>`;
      cuerpo = `<p class="text-sm text-zinc-300">${d.desc}</p>
        ${d.fusion ? `<p class="mt-1 text-xs text-amber-300">⚗️ Fusión de nivel 4 · ${esArma ? 'arma' : 'táctico'}. Libera un espacio al crearse.</p>` : ''}
        <div class="mt-2 flex flex-wrap gap-1">${chipsProps(d.props)}</div>
        <div class="mt-3">${tablaStats(`<tr><th>Nv</th>${claves.map(k => `<th>${ETIQUETA_STAT[k] ?? k}</th>`).join('')}</tr>${niveles.map(([n, st]) => `<tr><td>${pips(n, n > 3 ? 4 : 3)}</td>${claves.map(k => `<td>${st[k]}</td>`).join('')}</tr>`).join('')}`)}</div>
        ${d.fusion && !esArma ? '' : `<p class="mt-2 text-xs text-zinc-400">Mejora permanente: ${mejora}/3 ${esArma ? '(+10 % de daño por nivel)' : '(+10 % de potencia por nivel)'}</p>`}`;
    } else if (it.kind === 'soldado'){
      const d = SOLDADOS[it.id], m = P.nivel('sold-' + it.id), k = 1 + 0.15 * m;
      vista = `<canvas data-grande class="block aspect-[120/70] w-full rounded-2xl bg-gradient-to-b from-[#0b1023] to-[#312e81]"></canvas>`;
      const [, , icU, modU = {}, descU] = it.x ?? [], ETQ = {cd:'Recarga', dmg:'Daño', rango:'Alcance', vida:'Vida'};
      const rasgos = Object.entries(modU).map(([kk, v]) => `${ETQ[kk] ?? kk} ×${v}`).join(' · ');
      const RS = it.uid ? RASGOS_SOLDADO[it.uid] : null;
      const habil = RS ? `<div class="mt-2 grid gap-1.5 text-sm">
          <div class="rounded-xl border border-zinc-700 p-2"><span class="inline-block h-3 w-3 rounded-full align-middle" style="background:${RS.bala}"></span> <b>Pasiva · ${RS.pasiva.nombre}</b><br><span class="text-xs text-zinc-400">${RS.pasiva.desc} Siempre activa.</span></div>
          ${RS.activas.map((a, k) => `<div class="rounded-xl border border-zinc-700 p-2"><b>${a.icon} Activa ${k + 1} · ${a.nombre}</b> <span class="text-xs text-zinc-400">(cada ${a.cd} s)</span><br><span class="text-xs text-zinc-400">${a.desc} Se enciende con ${k + 1} fusión${k ? 'es' : ''} activa${k ? 's' : ''} de su arma.</span></div>`).join('')}</div>` : '';
      cuerpo = `${it.x ? `<p class="text-sm"><b>${icU} ${it.name}</b> · ${d.icon} ${d.name}</p><p class="text-sm text-zinc-300">${descU}${rasgos ? ` <span class="text-xs text-zinc-400">(${rasgos})</span>` : ''}</p>${habil}` : ''}<p class="text-sm text-zinc-300">${d.icon} ${d.desc}</p><div class="mt-2">${tablaStats(`
        <tr><td>Vida</td><td>${Math.round(d.vida * k)}</td></tr>
        ${d.ataque ? `<tr><td>Ataque</td><td>${(d.ataque.dmg * k).toFixed(1)} de daño ${d.ataque.dano} · recarga ${d.ataque.cd} s · alcance ${d.ataque.rango}${d.ataque.area ? ' · área ' + d.ataque.area : ''}</td></tr><tr><td>Costo</td><td>${d.ataque.costo} ⚡ por disparo</td></tr>` : ''}
        ${d.apoyo ? `<tr><td>Apoyo</td><td>${d.apoyo.curar ? `cura ${(d.apoyo.curar * k).toFixed(1)}` : `repara ${(d.apoyo.reparar * k).toFixed(1)}`} cada ${d.apoyo.cd} s</td></tr><tr><td>Costo</td><td>${d.apoyo.costo} ⚡</td></tr>` : ''}
        ${it.id === 'fusilero' ? '<tr><td>Arma</td><td>Usa tus armas de pelotón (rifle o su fusión)</td></tr>' : ''}
        <tr><td>Mejora</td><td>${m}/3 (+15 % por nivel)</td></tr>`)}</div>`;
    } else {
      const e = ENEMIGOS[it.id](0, {vida:1, velocidad:1}), info = INFO_ENEMIGO[it.id];
      const hab = [e.salta && '🦘 Salta sobre los soldados', e.bajoTierra && '⛏️ Avanza bajo tierra', e.kamikaze && '💥 Kamikaze', e.escudoMental && '🧠 Escudo mental', e.armadura && `🛡 Armadura física −${e.armadura * 100} %`, e.escudo && `🔵 Escudo de energía −${e.escudo * 100} %`].filter(Boolean);
      vista = `<canvas data-grande class="block aspect-[120/70] w-full rounded-2xl bg-gradient-to-b from-[#0b1023] to-[#312e81]"></canvas>`;
      cuerpo = `<p class="text-sm text-zinc-300">${e.jefe ? '👹 <b>Jefe.</b> ' : ''}${info.desc}</p><div class="mt-2">${tablaStats(`
        <tr><td>Terreno</td><td>${e.vuela ? '✈️ Aire' : '🟫 Tierra'}</td></tr>
        <tr><td>Vida base</td><td>${Math.round(e.vida)}</td></tr><tr><td>Velocidad</td><td>${e.vel}</td></tr>
        <tr><td>Armas</td><td>${e.armas.length ? e.armas.map(a => `${ARMA_ENEMIGA[a.tipo]}${a.dmg ? ` (${+a.dmg.toFixed(1)} de daño${a.rango ? `, alcance ${a.rango}` : ''})` : a.invoca ? ` ${INFO_ENEMIGO[a.invoca].name}` : ''}`).join(' · ') : e.dps ? `Cuerpo a cuerpo (${e.dps}/s)` : '—'}</td></tr>
        ${hab.length ? `<tr><td>Habilidades</td><td>${hab.join('<br>')}</td></tr>` : ''}
        ${DEBILIDAD[it.id] ? `<tr><td>Débil a</td><td>${EQUIPO[DEBILIDAD[it.id]].icon} ${EQUIPO[DEBILIDAD[it.id]].name} (×${MULT_DEBIL} de daño)</td></tr>` : ''}
        <tr><td>XP</td><td>${e.xp}</td></tr>`)}</div>`;
    }
    cont.classList.remove('hidden');
    cont.innerHTML = `<div class="flex h-full flex-col overflow-y-auto bg-zinc-950 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div class="mx-auto w-full max-w-md"><div class="flex items-center justify-between gap-2"><b class="min-w-0 truncate text-lg">${it.ok ? it.name : 'Desconocido'}</b><button data-a="cerrar" class="${UI.btn} !min-h-10 !px-3">✕</button></div>
      <div class="mt-2 flex items-center justify-between gap-2"><button data-a="detprev" class="${UI.btn} !min-h-10 !px-4" aria-label="Anterior">◀</button><span class="text-xs text-zinc-400">${this.lista.indexOf(it) + 1} de ${this.lista.length} · desliza o usa las flechas${vitrina3D() && vista.includes('data-grande') ? ' · arrastra la escena para girarla' : ''}</span><button data-a="detnext" class="${UI.btn} !min-h-10 !px-4" aria-label="Siguiente">▶</button></div>
      <div class="mt-3">${vista}</div><div class="mt-3">${cuerpo}</div></div></div>`;
    cancelAnimationFrame(this.raf); this.animar();
    // Deslizar a los lados (o ← → en el teclado) pasa al elemento anterior/siguiente del catálogo
    let ini = null;
    cont.onpointerdown = e => { ini = vitrina3D() && e.target.closest('canvas[data-grande]') ? null : {x:e.clientX, y:e.clientY, t:performance.now()}; };   // sobre la escena 3D, arrastrar la gira
    cont.onpointerup = e => { if (!ini) return; const dx = e.clientX - ini.x, dy = e.clientY - ini.y, rapido = performance.now() - ini.t < 700; ini = null;
      if (rapido && Math.abs(dx) > 60 && Math.abs(dx) > 1.5 * Math.abs(dy)) this.moverDetalle(dx < 0 ? 1 : -1); };
    cont.onpointercancel = () => { ini = null; };
    if (!this.tecla){ this.tecla = e => { if (!this.detalle) return; if (e.key === 'ArrowRight') this.moverDetalle(1); if (e.key === 'ArrowLeft') this.moverDetalle(-1); if (e.key === 'Escape') this.cerrarDetalle(); }; document.addEventListener('keydown', this.tecla); }
  }
}

/* ---------- Mejoras permanentes ---------- */
class MejorasScene extends Scene {
  enter(){ this.tab ??= 'cientificos'; this.pintar(); }
  pintar(){
    const P = this.app.progreso;
    const lista = Object.entries(MEJORAS).filter(([, m]) => m.cat === this.tab);
    this.app.html(`
    <div class="mx-auto flex h-full max-w-xl flex-col px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div class="flex items-center justify-between">${btnVolver}<span class="text-lg font-bold text-amber-300">${P.data.puntos} 🔬</span></div>
      <h2 class="mt-3 text-2xl font-black">🛠 Mejoras permanentes</h2>
      ${P.data.todo ? '<p class="rounded-xl bg-amber-400/15 px-3 py-1.5 text-xs text-amber-300">🧪 Modo desarrollador: sube o baja cada mejora con − y +, sin costo.</p>' : ''}<p class="text-xs text-zinc-400">Ganas 🔬 al <b>completar cada misión</b> (10 + 5 × número de misión) y con tu XP (1 por cada 10). Se mantienen entre partidas.</p>
      ${tabs(CATEGORIAS_MEJORA, this.tab)}
      <div class="mt-2 flex-1 space-y-2 overflow-y-auto pb-4">${lista.map(([id, m]) => {
        const disp = P.disponible(id), n = P.nivel(id), max = n >= m.max;
        return `<div class="${UI.card} flex items-center gap-3 ${disp ? '' : 'opacity-60'}"><span class="text-3xl ${disp ? '' : 'brightness-0'}">${m.icon}</span>
          <div class="flex-1"><b>${disp ? m.name : 'Desconocido'}</b> <span class="text-xs">${pips(n, m.max)}</span><div class="text-xs text-zinc-400">${disp ? m.desc : '🔒 Descúbrelo en una partida para poder mejorarlo'}</div></div>
          ${P.data.todo ? `<div class="flex gap-1"><button data-dev="${id}|-1" class="${UI.btn} !min-h-11 !px-3" ${n ? '' : 'disabled'} aria-label="Bajar">−</button><button data-dev="${id}|1" class="${UI.btn} !min-h-11 !px-3" ${max ? 'disabled' : ''} aria-label="Subir">+</button></div>`
            : `<button data-buy="${id}" class="${UI.btnP} !min-h-11 !px-3 text-sm" ${P.puedeComprar(id) ? '' : 'disabled'}>${max ? 'Máx.' : `${P.costo(id)} 🔬`}</button>`}</div>`;
      }).join('')}</div></div>`).onclick = e => {
      if (e.target.closest('[data-a="volver"]')) return this.app.go(new MenuScene(this.app));
      const tab = e.target.closest('[data-tab]')?.dataset.tab; if (tab){ this.tab = tab; return this.pintar(); }
      const id = e.target.closest('[data-buy]')?.dataset.buy; if (id && P.comprar(id)) this.pintar();
      const dv = e.target.closest('[data-dev]')?.dataset.dev;                   // 🧪 modo desarrollador: subir o bajar gratis
      if (dv && P.data.todo){ const [mid, d] = dv.split('|'); P.data.mejoras[mid] = Math.max(0, Math.min(MEJORAS[mid].max, P.nivel(mid) + +d)); P.guardar(); this.pintar(); }
    };
  }
}

/* ---------- Mazo: combinaciones guardadas para todas las partidas ---------- */
/** Carta real en miniatura con su número de orden (y ✕ para quitarla dentro del recuadro). */
const miniCarta = (D, id, i, quitar = false) => `<span ${quitar ? `data-quitar="${i}" data-chip` : ''} class="relative inline-block shrink-0 ${quitar ? 'cursor-pointer' : ''}">
  ${cartaHTML(D.cartas.get(id), D, {attr:'', chica:true})}
  <b class="absolute -bottom-1 -left-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-zinc-950 shadow">${i + 1}</b>
  ${quitar ? '<span class="absolute -right-1 -top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white shadow">✕</span>' : ''}</span>`;
class MazoScene extends Scene {
  enter(){ this.dom ??= 'fund'; this.armando = null; this.pintar(); }
  exit(){ const r = this.app.root; r.onpointerdown = r.onpointermove = r.onpointerup = null; this.fantasma?.remove(); }
  get lista(){ return this.app.progreso.data.mazo[this.dom]; }
  pintar(){
    const D = DOMINIOS[this.dom], lista = this.lista;
    this.app.html(`
    <div class="mx-auto flex h-full max-w-xl flex-col px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div class="flex items-center justify-between">${btnVolver}<span class="text-xs text-zinc-400">${lista.length}/${MAX_MAZO} cartas compuestas</span></div>
      <h2 class="mt-3 text-2xl font-black">🃏 Mazo</h2>
      <p class="text-xs text-zinc-400">Arma <b>cartas compuestas</b> de hasta ${MAX_CARTAS_COMBO} propiedades (se pueden repetir, por ejemplo ↔️ ↔️ 🧲 🧲 🧮). En batalla se aplican una tras otra; en «Pasar al otro lado» tú eliges el término y si pasa positivo o negativo. Te acompañan en <b>todas</b> las partidas y se usan <b>sin límite</b>. Solo se crean aquí, no durante la partida.</p>
      ${tabs([['fund', '🧱', 'Fundamentos'], ['alg', '🔺', 'Álgebra'], ['dif', '📈', 'Diferencial'], ['int', '∫', 'Integral']], this.dom)}
      <div data-lista-mazo class="mt-2 flex-1 space-y-2 overflow-y-auto pb-4">
        ${this.armando ? this.constructor_(D) : `
        ${lista.map((cb, i) => `<div class="${UI.card}"><div class="flex items-center gap-2"><span class="text-2xl">🔗</span><b class="flex-1">${cb.nombre}</b>
            <button data-editar="${i}" class="${UI.btn} !min-h-10 !px-3 text-sm">✏️ Editar</button><button data-borrar="${i}" class="${UI.btn} !min-h-10 !px-3" aria-label="Borrar">🗑</button></div>
          <div class="mt-2 flex gap-1.5 overflow-x-auto pb-1">${cb.cartas.map((id, j) => miniCarta(D, id, j)).join('')}</div></div>`).join('') || '<p class="py-6 text-center text-sm text-zinc-500">Tu mazo está vacío: crea tu primera carta compuesta.</p>'}
        <button data-a="combinar" class="${UI.btnP} w-full" ${lista.length >= MAX_MAZO ? 'disabled' : ''}>🔗 Crear carta compuesta</button>`}
      </div></div>`).onclick = e => this.click(e);
    if (this.armando){ this.activarArrastre(); this.app.root.querySelector('[data-nombre]').oninput = e => this.armando.nombre = e.target.value; }
  }
  constructor_(D){
    const a = this.armando;
    return `<div class="sticky top-0 z-10 -mx-1 rounded-2xl border border-zinc-800 bg-zinc-950/95 p-2.5 shadow-xl shadow-black/40 backdrop-blur">
      <div class="flex items-baseline justify-between gap-2"><b class="text-sm">${a.editar != null ? '✏️ Editando' : '🔗 Nueva'} carta compuesta</b><span class="text-xs text-zinc-400">${a.cartas.length}/${MAX_CARTAS_COMBO} · arrastra o toca cartas · toca una para quitarla</span></div>
      <div data-caja class="mt-2 flex min-h-[8.6rem] items-center gap-1.5 overflow-x-auto rounded-2xl border-2 border-dashed ${a.sobre ? 'border-emerald-400 bg-emerald-400/10' : 'border-zinc-600'} p-2">
        ${a.cartas.length ? a.cartas.map((id, i) => miniCarta(D, id, i, true)).join('') : '<span class="w-full text-center text-sm text-zinc-500">Suelta aquí las cartas, en el orden en que se aplicarán.</span>'}
      </div>
      <div class="mt-2 flex gap-2"><input data-nombre value="${a.nombre}" maxlength="24" class="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" placeholder="Nombre">
        <button data-a="cancelar" class="${UI.btn} !min-h-10 !px-3 text-sm">Cancelar</button><button data-a="guardar" class="${UI.btnP} !min-h-10 !px-3 text-sm" ${a.cartas.length >= 2 ? '' : 'disabled'}>Guardar</button></div></div>
      <div class="mt-3 flex flex-wrap justify-center gap-2">${D.cartas.all().filter(c => !c.free && this.app.cartaDesbloqueada(c.id)).map(c => cartaHTML(c, D, {attr:`data-pick="${c.id}" style="touch-action:none"`, chica:true})).join('')}</div>`;
  }
  click(e){
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'volver') return this.armando ? (this.armando = null, this.pintar()) : this.app.go(new MenuScene(this.app));
    const tab = e.target.closest('[data-tab]')?.dataset.tab; if (tab){ this.dom = tab; this.armando = null; return this.pintar(); }
    const b = e.target.closest('[data-borrar]')?.dataset.borrar; if (b != null){ const l = [...this.lista]; l.splice(+b, 1); this.app.progreso.guardarMazo(this.dom, l); return this.pintar(); }
    if (a === 'combinar'){ this.armando = {cartas:[], nombre:`Carta compuesta ${this.lista.length + 1}`}; return this.pintar(); }
    const ed = e.target.closest('[data-editar]')?.dataset.editar;
    if (ed != null){ const cb = this.lista[+ed]; this.armando = {cartas:[...cb.cartas], nombre:cb.nombre, editar:+ed}; return this.pintar(); }
    if (a === 'cancelar'){ this.armando = null; return this.pintar(); }
    if (a === 'guardar'){
      const nombre = this.app.root.querySelector('[data-nombre]').value.trim() || this.armando.nombre;
      const nueva = {nombre, cartas:[...this.armando.cartas]}, l = [...this.lista];
      if (this.armando.editar != null) l[this.armando.editar] = nueva; else l.push(nueva);   // editar reemplaza la carta compuesta
      this.app.progreso.guardarMazo(this.dom, l);
      this.armando = null; return this.pintar();
    }
    const q = e.target.closest('[data-quitar]')?.dataset.quitar; if (q != null && performance.now() - (this.tSoltar ?? 0) > 450){ this.armando.cartas.splice(+q, 1); return this.pintar(); }   // el «click» que sigue a soltar una carta no quita fichas
  }
  /** Arrastrar cartas al recuadro (puntero: dedo o ratón). Un toque sin mover también la agrega. */
  activarArrastre(){
    const root = this.app.root;
    root.onpointerdown = e => {
      const pick = e.target.closest('[data-pick]'); if (!pick) return;
      e.preventDefault(); this.arr = {id:pick.dataset.pick, el:pick, x0:e.clientX, y0:e.clientY, movido:false};
      try { pick.releasePointerCapture?.(e.pointerId); } catch {}        // en táctil el puntero se queda «pegado» al botón
    };
    root.onpointercancel = () => { this.arr = null; this.fantasma?.remove(); this.fantasma = null; };
    root.onpointermove = e => {
      const d = this.arr; if (!d) return;
      if (!d.movido && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return;
      if (!d.movido){ d.movido = true; this.fantasma = d.el.cloneNode(true); this.fantasma.className += ' pointer-events-none fixed z-[70] opacity-90 rotate-3'; document.body.appendChild(this.fantasma); }
      const r = this.fantasma.getBoundingClientRect();
      this.fantasma.style.left = (e.clientX - r.width / 2) + 'px'; this.fantasma.style.top = (e.clientY - r.height / 2 - (e.pointerType === 'mouse' ? 0 : 40)) + 'px';
      const caja = root.querySelector('[data-caja]'), cr = caja.getBoundingClientRect(), y = e.clientY - (e.pointerType === 'mouse' ? 0 : 40);
      caja.classList.toggle('border-emerald-400', e.clientX >= cr.left && e.clientX <= cr.right && y >= cr.top && y <= cr.bottom);
      const lista = root.querySelector('[data-lista-mazo]');                  // cerca de los bordes la lista se mueve sola
      if (lista){ const lr = lista.getBoundingClientRect(); if (e.clientY < lr.top + 70) lista.scrollTop -= 14; else if (e.clientY > lr.bottom - 70) lista.scrollTop += 14; }
    };
    root.onpointerup = e => {
      const d = this.arr; this.arr = null; if (!d) return;
      this.fantasma?.remove(); this.fantasma = null; this.tSoltar = performance.now();
      const lleno = this.armando.cartas.length >= MAX_CARTAS_COMBO;
      if (!d.movido){ if (!lleno) this.armando.cartas.push(d.id); return this.pintar(); }
      const caja = root.querySelector('[data-caja]'), cr = caja.getBoundingClientRect(), y = e.clientY - (e.pointerType === 'mouse' ? 0 : 40);
      if (lleno || e.clientX < cr.left || e.clientX > cr.right || y < cr.top || y > cr.bottom) return this.pintar();
      const chips = [...caja.querySelectorAll('[data-chip]')];          // insertar según la posición donde se suelta
      let pos = chips.findIndex(ch => { const r = ch.getBoundingClientRect(); return y < r.top || (y <= r.bottom && e.clientX < r.left + r.width / 2); });
      if (pos < 0) pos = chips.length;
      this.armando.nombre = root.querySelector('[data-nombre]').value || this.armando.nombre;
      this.armando.cartas.splice(pos, 0, d.id); this.pintar();
    };
  }
}

/* ---------- Pelotón y Armería ----------
   Un soldado por tipo: en cada tipo eliges el soldado «en servicio» y su equipo
   (arma y blindaje). En la batalla todos los reclutas de ese tipo son ese soldado:
   la base lo genera las veces que haga falta.
   - 🪖 Pelotón: ver el equipo, elegir soldado, equipar y ordenar el reclutamiento (por tipos).
   - ⚒️ Armería: subir de nivel soldados, armas y blindajes con ⚙️ chatarra. */
const SLOTS_PELOTON = 8;
/** Tipo de un puesto del orden de reclutamiento (las partidas antiguas guardaban soldados concretos). */
const tipoDePuesto = q => SOLDADOS[q] ? q : tipoDeUid(q);

/** Vista 3D animada del soldado en servicio (usa las vitrinas del Catálogo). */
class VistaSoldado3D {
  constructor(cv, uid){
    this.v = null; if (!cv || !vitrina3D()) return;
    try { this.v = new Vitrina3D(cv, {kind:'soldado', id:tipoDeUid(uid), uid}, true); } catch (err){ console.warn('Vista 3D no disponible:', err); return; }
    const t0 = performance.now(), paso = now => { this.v?.dibujar(Math.max(0, (now - t0) / 1000)); this.raf = requestAnimationFrame(paso); };
    this.raf = requestAnimationFrame(paso);
  }
  dispose(){ cancelAnimationFrame(this.raf); this.v?.dispose(); this.v = null; }
}
const icTropa = (t, cls = 'inline-block h-5 w-5') => vitrina3D() ? `<span data-i3d="${ICONO_TROPA[t]}" class="${cls}">${SOLDADOS[t].icon}</span>` : SOLDADOS[t].icon;

class PelotonScene extends Scene {
  enter(){ this.tab ??= 'fusilero'; this.pintar(); }
  exit(){ this.vista?.dispose(); }
  tipos(){ return TIPOS_TROPA.filter(t => t === 'fusilero' || this.app.soldadoDesbloqueado(t)); }
  pintar(msg = ''){
    this.vista?.dispose();
    const app = this.app, P = app.progreso, d = P.data, T = tropaDe(P), tipos = this.tipos(); if (!tipos.includes(this.tab)) this.tab = 'fusilero';
    const I = itemsTropa(app, this.tab), titular = titularDe(app, this.tab), pf = perfilSoldado(P, titular), estrategia = app.pelotonDisponible();
    const pl = d.peloton ??= {orden:ORDEN_RECLUTA.slice(0, SLOTS_PELOTON), equipo:{}};
    pl.orden = pl.orden.map(tipoDePuesto);                                   // el orden se guarda por tipos
    const resumen = TIPOS_TROPA.map(t => { const ok = tipos.includes(t), p = ok ? perfilSoldado(P, titularDe(app, t)) : null;
      return `<button data-tab="${t}" class="flex min-h-24 min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 px-1 py-2 text-center text-[11px] leading-tight touch-manipulation active:scale-95 ${t === this.tab ? 'border-emerald-400 bg-emerald-400/10' : 'border-zinc-800 bg-zinc-900'} ${ok ? '' : 'opacity-40'}">
        ${ok ? icTropa(t, 'block h-8 w-8') : '<span class="text-2xl">🔒</span>'}<b class="mt-0.5 block w-full truncate">${ok ? p.name.split(' ')[0] : SOLDADOS[t].name}</b><span class="block w-full truncate text-[10px] text-zinc-400">${ok ? p.arma : 'Bloqueado'}</span></button>`; }).join('');
    const tarjeta = (it, accion, sel) => `<div class="${UI.card} !p-2.5 ${it.libre ? '' : 'opacity-50'} ${sel ? 'ring-2 ring-emerald-400' : ''}">
      <div class="flex items-center gap-2"><span class="text-2xl">${it.libre ? it.icon : '🔒'}</span><span class="min-w-0 flex-1"><b class="text-sm">${it.libre ? it.name : 'Bloqueado'}</b> ${it.libre ? pips(it.nivel, MAX_NIVEL_TROPA) : ''}
        <span class="block text-[11px] text-zinc-400">${it.libre ? it.desc : 'Se desbloquea más adelante en la 🗺️ Ruta.'}</span>
        ${it.libre && it.clase === 'soldado' && RASGOS_SOLDADO[it.id] ? `<span class="mt-0.5 block text-[11px]"><span class="inline-block h-2.5 w-2.5 rounded-full align-middle" style="background:${RASGOS_SOLDADO[it.id].bala}"></span> <b>${RASGOS_SOLDADO[it.id].pasiva.nombre}</b> · <span class="text-zinc-400">${RASGOS_SOLDADO[it.id].activas.map(a => a.icon + ' ' + a.nombre).join(' · ')}</span></span>` : ''}</span></div>
      ${it.libre && accion ? `<div class="mt-2 flex gap-1.5">${accion}</div>` : ''}</div>`;
    this.app.html(`
    <div class="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 pb-6 pt-4 [&>*]:shrink-0">
      <div class="flex items-center justify-between gap-2"><h2 class="text-2xl font-black">${vitrina3D() ? icono3D('🪖') : '🪖'} Pelotón</h2><a href="#/jugar/armeria" class="${UI.btn} !min-h-10 text-sm">⚒️ Armería</a></div>
      <p class="text-xs text-zinc-400"><b>Un soldado por tipo.</b> Elige quién sirve en cada tipo y su equipo: en la batalla la base lo recluta las veces que haga falta. Para subirlos de nivel ve a la ⚒️ Armería.</p>
      ${msg ? `<p class="rounded-xl bg-zinc-900 px-3 py-2 text-sm text-emerald-300">${msg}</p>` : ''}
      <div class="grid grid-cols-5 gap-1.5">${resumen}</div>
      <div class="${UI.card}">
        <div class="flex items-center gap-2">${icTropa(this.tab, 'inline-block h-6 w-6')}<b class="flex-1">${SOLDADOS[this.tab].name}: ${pf.name}</b><span class="text-xs text-zinc-400">${pf.arma}${pf.blindaje ? ' · ' + pf.blindaje : ''}</span></div>
        ${vitrina3D() ? `<canvas data-soldado3d class="mt-2 block aspect-[120/70] w-full rounded-2xl bg-gradient-to-b from-[#0b1023] to-[#312e81]"></canvas>` : ''}
        <div class="mt-2 grid grid-cols-3 gap-1.5 text-center text-[11px]"><span class="rounded-xl bg-zinc-950 py-1.5">❤️ ${Math.round(pf.vida)} vida</span>
          <span class="rounded-xl bg-zinc-950 py-1.5">${pf.apoyo ? (pf.apoyo.curar ? `💚 cura ${pf.apoyo.curar.toFixed(1)}` : `🔧 repara ${pf.apoyo.reparar.toFixed(1)}`) : `💥 ${pf.ataque.dmg.toFixed(1)} daño`}</span>
          <span class="rounded-xl bg-zinc-950 py-1.5">🛡 ${Math.round(pf.reduccion * 100)} % menos daño</span></div></div>
      <b class="text-sm">Soldado en servicio</b>
      <div class="grid gap-2 sm:grid-cols-2">${I.soldados.map(it => tarjeta(it, it.id === titular ? '<span class="flex items-center px-1 text-xs font-bold text-emerald-300">✓ En servicio</span>' : `<button data-servicio="${it.id}" class="${UI.btnP} !min-h-9 flex-1 !px-2 text-xs">Poner en servicio</button>`, it.id === titular)).join('')}</div>
      <b class="text-sm">${SOLDADOS[this.tab].apoyo ? 'Herramienta' : 'Arma'}</b>
      <div class="grid gap-2 sm:grid-cols-3">${I.armas.map(it => tarjeta(it, it.equipado ? '<span class="flex items-center px-1 text-xs font-bold text-emerald-300">✓ Equipada</span>' : `<button data-equipar="arma|${it.id}" class="${UI.btnP} !min-h-9 flex-1 !px-2 text-xs">Equipar</button>`, it.equipado)).join('')}</div>
      <b class="text-sm">Blindaje</b>
      <div class="grid gap-2 sm:grid-cols-3">${I.blindajes.map(it => tarjeta(it, it.equipado ? `<button data-equipar="blindaje|" class="${UI.btn} !min-h-9 flex-1 !px-2 text-xs">Quitar</button>` : `<button data-equipar="blindaje|${it.id}" class="${UI.btnP} !min-h-9 flex-1 !px-2 text-xs">Equipar</button>`, it.equipado)).join('')}</div>
      <div class="${UI.card}"><b class="text-sm">🧠 Orden de reclutamiento</b>
        ${estrategia ? `<p class="text-xs text-zinc-400">Toca un puesto para cambiar el tipo que recluta la base (el orden se repite). Cada enemigo es débil a un tipo de daño (×${MULT_DEBIL}).</p>
          <div class="mt-2 grid grid-cols-4 gap-1.5">${pl.orden.map((t, i) => `<button data-slot="${i}" class="flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-xl border border-zinc-700 bg-zinc-950 px-1 text-[11px] touch-manipulation active:scale-95"><span class="text-[10px] text-zinc-500">#${i + 1}</span>${icTropa(t)}<span class="truncate">${SOLDADOS[t].name}</span></button>`).join('')}</div>`
          : '<p class="text-xs text-zinc-400">🔒 Se desbloquea en la Ruta al cumplir 3 misiones. Mientras tanto la base recluta en el orden normal con tus soldados en servicio.</p>'}</div>
    </div>`).onclick = e => this.click(e, tipos);
    this.vista = new VistaSoldado3D(this.app.root.querySelector('canvas[data-soldado3d]'), titular);
  }
  click(e, tipos){
    const P = this.app.progreso, d = P.data, T = tropaDe(P);
    const tab = e.target.closest('[data-tab]')?.dataset.tab; if (tab && tipos.includes(tab)){ this.tab = tab; return this.pintar(); }
    const sv = e.target.closest('[data-servicio]')?.dataset.servicio;
    if (sv){ T.titular[this.tab] = sv; P.guardar(); return this.pintar(`✓ ${perfilSoldado(P, sv).name} está en servicio: será el ${SOLDADOS[this.tab].name.toLowerCase()} de tus partidas.`); }
    const eq = e.target.closest('[data-equipar]')?.dataset.equipar;
    if (eq){ const [clase, id] = eq.split('|'); T.equipo[this.tab][clase] = id || null; P.guardar(); return this.pintar(); }
    const sl = e.target.closest('[data-slot]');
    if (sl){ const pl = d.peloton, i = +sl.dataset.slot, k = tipos.indexOf(pl.orden[i]); pl.orden[i] = tipos[(k + 1) % tipos.length]; P.guardar(); return this.pintar(); }
  }
}

class ArmeriaScene extends Scene {
  enter(){ this.tab ??= 'fusilero'; this.pintar(); }
  tipos(){ return TIPOS_TROPA.filter(t => t === 'fusilero' || this.app.soldadoDesbloqueado(t)); }
  pintar(msg = ''){
    const app = this.app, P = app.progreso, d = P.data, tipos = this.tipos(); if (!tipos.includes(this.tab)) this.tab = 'fusilero';
    const I = itemsTropa(app, this.tab), chat = d.chatarra ?? 0, dev = !!d.todo, titular = titularDe(app, this.tab);
    const fila = it => { const max = it.nivel >= MAX_NIVEL_TROPA, costo = costoTropa(it.nivel), usado = it.clase === 'soldado' ? it.id === titular : it.equipado;
      const subir = dev ? `<button data-devniv="${it.id}|-1" class="${UI.btn} !min-h-9 flex-1 !px-2" ${it.nivel <= 1 ? 'disabled' : ''}>− Nivel</button><button data-devniv="${it.id}|1" class="${UI.btn} !min-h-9 flex-1 !px-2" ${max ? 'disabled' : ''}>+ Nivel</button>`
        : `<button data-subir="${it.id}" class="${UI.btnP} !min-h-9 flex-1 !px-2 text-xs" ${max || chat < costo ? 'disabled' : ''}>${max ? 'Nivel máximo' : `⬆ Nivel ${it.nivel + 1} · ⚙️ ${costo}`}</button>`;
      return `<div class="${UI.card} !p-2.5 ${it.libre ? '' : 'opacity-50'}">
        <div class="flex items-center gap-2"><span class="text-2xl">${it.libre ? it.icon : '🔒'}</span><span class="min-w-0 flex-1"><b class="text-sm">${it.libre ? it.name : 'Bloqueado'}</b> ${it.libre ? pips(it.nivel, MAX_NIVEL_TROPA) : ''}
          ${usado ? `<span class="ml-1 rounded-full bg-emerald-400/15 px-1.5 text-[10px] font-bold text-emerald-300">${it.clase === 'soldado' ? 'EN SERVICIO' : 'EQUIPADO'}</span>` : ''}
          <span class="block text-[11px] text-zinc-400">${it.libre ? it.desc : 'Se desbloquea más adelante en la 🗺️ Ruta.'}</span></span></div>
        ${it.libre ? `<div class="mt-2 flex gap-1.5">${subir}</div>` : ''}</div>`; };
    this.app.html(`
    <div class="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 pb-6 pt-4 [&>*]:shrink-0">
      <div class="flex items-center justify-between gap-2"><h2 class="text-2xl font-black">${vitrina3D() ? icono3D('⚒️') : '⚒️'} Armería</h2><span class="rounded-full bg-zinc-900 px-3 py-1 text-sm font-bold text-sky-300">⚙️ ${chat} chatarra</span></div>
      <p class="text-xs text-zinc-400">Mejora tus soldados, armas y blindajes con ⚙️ chatarra (se gana en cada partida, aunque pierdas, y al descubrir algo por primera vez). Para elegir quién sirve y qué equipa, ve al <a href="#/jugar/peloton" class="underline">🪖 Pelotón</a>.</p>
      ${msg ? `<p class="rounded-xl bg-zinc-900 px-3 py-2 text-sm text-emerald-300">${msg}</p>` : ''}
      <div class="shrink-0">${tabs(TIPOS_TROPA.map(t => [t, tipos.includes(t) ? SOLDADOS[t].icon : '🔒', SOLDADOS[t].name]), this.tab)}</div>
      <b class="text-sm">Soldados</b><div class="grid gap-2 sm:grid-cols-2">${I.soldados.map(fila).join('')}</div>
      <b class="text-sm">${SOLDADOS[this.tab].apoyo ? 'Herramientas' : 'Armas'}</b><div class="grid gap-2 sm:grid-cols-3">${I.armas.map(fila).join('')}</div>
      <b class="text-sm">Blindajes</b><div class="grid gap-2 sm:grid-cols-3">${I.blindajes.map(fila).join('')}</div>
    </div>`).onclick = e => this.click(e);
  }
  click(e){
    const P = this.app.progreso, d = P.data, T = tropaDe(P);
    const tab = e.target.closest('[data-tab]')?.dataset.tab; if (tab && this.tipos().includes(tab)){ this.tab = tab; return this.pintar(); }
    const dn = e.target.closest('[data-devniv]')?.dataset.devniv;             // 🧪 modo desarrollador: subir o bajar gratis
    if (dn && d.todo){ const [iid, s] = dn.split('|'); T.niveles[iid] = Math.max(1, Math.min(MAX_NIVEL_TROPA, nivelTropa(P, iid) + +s)); P.guardar(); return this.pintar(); }
    const sub = e.target.closest('[data-subir]')?.dataset.subir;
    if (sub){ const n = nivelTropa(P, sub), c = costoTropa(n); if ((d.chatarra ?? 0) < c || n >= MAX_NIVEL_TROPA) return;
      d.chatarra -= c; T.niveles[sub] = n + 1; P.guardar(); FX3D.en(e.target.closest('[data-subir]'), 'acierto'); return this.pintar(`⬆ Subió al nivel ${n + 1}.`); }
  }
}
