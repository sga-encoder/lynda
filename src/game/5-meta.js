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
const ARMA_ENEMIGA = {acido:'🟢 Ácido', laser:'🔴 Láser', rayo:'🟣 Rayo mental', roca:'🪨 Roca', bomba:'💣 Bombas', invocar:'👾 Invoca'};
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

/* ---------- Vista previa animada (keyframes en canvas) ---------- */
class VistaPrevia extends Renderer {
  constructor(cv, item){ super(cv); this.item = item; }
  dibujar(t){
    const c = this.ctx, s = this.cv.width / 120, {suelo} = MUNDO, it = this.item;
    c.setTransform(s, 0, 0, s, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, 70); g.addColorStop(0, '#0b1023'); g.addColorStop(1, '#312e81'); c.fillStyle = g; c.fillRect(0, 0, 120, 70);
    c.fillStyle = '#1c1917'; c.fillRect(0, 58, 120, 12);
    c.setTransform(s, 0, 0, s, 0, s * (58 - suelo));                  // coordenadas del mundo con el suelo en y = 58
    if (it.kind === 'arma') return this.arma(c, it.id, t);
    if (it.kind === 'soldado') return this.soldadoAnim(c, it.id, t);
    return this.enemigoAnim(c, it.id, t);
  }
  soldadoAnim(c, tipo, t){
    const s = new Soldado(0, tipo); s.x = 50; this.soldado(c, s);
    if (SOLDADOS[tipo].ataque || tipo === 'fusilero'){ const u = (t % 1) / 1; c.fillStyle = '#fde047'; c.beginPath(); c.arc(56 + u * 60, MUNDO.suelo - 10 - (tipo === 'granadero' ? 25 * Math.sin(Math.PI * u) : 0), 1.3, 0, 6.28); c.fill(); }
    if (SOLDADOS[tipo].apoyo){ c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4); c.font = 'bold 9px system-ui'; c.textAlign = 'center'; c.fillText(tipo === 'medico' ? '+❤' : '+🔧', 50, MUNDO.suelo - 26 - (t * 10 % 8)); c.globalAlpha = 1; }
  }
  enemigoAnim(c, id, t){
    const e = ENEMIGOS[id](60, {vida:1, velocidad:1});
    e.x = 60; e.fase = t * 8; e.escala = Math.min(e.escala, 1.5); e.estado = 'camina';
    if (e.vuela){ e.y = MUNDO.suelo - 30 + Math.sin(t * 2) * 3; if (e.escudoMental) e.escudoT = (t % 4) < 1.5 ? 1 : 0; }
    else { e.y = MUNDO.suelo; if (id === 'saltador'){ const u = t % 2; if (u < 0.7) e.y -= 18 * Math.sin(Math.PI * u / 0.7); } if (id === 'excavador') e.bajoTierra = (t % 3) < 1.5; }
    this.enemigo(c, e, t);
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
  exit(){ cancelAnimationFrame(this.raf); }
  conocido(cat, id){ return this.todo || this.app.progreso.conocido(cat, id); }
  dominioDisponible(dom){ const d = this.app.progreso.data; return this.todo || dom.tipos.some(t => d.todo || this.app.tipoDesbloqueado(t)); }
  items(){
    if (this.tab === 'cartas') return Object.values(DOMINIOS).flatMap(dom => dom.cartas.all().map(c => ({kind:'carta', id:c.id, c, dom, ok:this.todo || c.free && this.dominioDisponible(dom) || this.app.cartaDesbloqueada(c.id), name:c.name})));
    if (this.tab === 'armas') return Object.entries(BONUS_DEFS).filter(([, d]) => d.tipo === 'arma' && !d.fusion).map(([id, d]) => ({kind:'arma', id, d, ok:this.conocido('armas', id), name:d.name}));
    if (this.tab === 'tacticos') return Object.entries(BONUS_DEFS).filter(([, d]) => d.tipo === 'tactico' && !d.fusion).map(([id, d]) => ({kind:'tactico', id, d, ok:this.conocido('tacticos', id), name:d.name}));
    // Fusiones: se sabe que existen, pero no cómo se consiguen (se descubren jugando)
    if (this.tab === 'fusiones') return FUSIONES.map(f => ({kind:'fusion', id:f.resultado, d:BONUS_DEFS[f.resultado], ok:this.conocido('fusiones', f.resultado), name:BONUS_DEFS[f.resultado].name}));
    return [...Object.keys(SOLDADOS).map(id => ({kind:'soldado', id, ok:this.conocido('soldados', id), name:SOLDADOS[id].name})),
            ...Object.keys(ENEMIGOS).map(id => ({kind:'enemigo', id, ok:this.conocido('enemigos', id), name:INFO_ENEMIGO[id].name}))];
  }
  tile(it, i){
    const desconocido = !it.ok, nombre = desconocido ? (it.kind === 'carta' ? '🔒 ' + it.name : 'Desconocido') : it.name;
    const vista = it.kind === 'fusion' ? fusionAnim(it.d.icon, desconocido)
      : it.kind === 'carta' ? `<div class="flex justify-center py-1 ${desconocido ? 'grayscale opacity-40' : ''}">${cartaHTML(it.c, it.dom, {attr:'', chica:true})}</div>`
      : it.kind === 'tactico' ? `<div class="flex h-[4.4rem] items-center justify-center text-4xl ${desconocido ? 'brightness-0 opacity-50' : '[animation:flotar_2s_ease-in-out_infinite]'}">${it.d.icon}</div>`
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
      <div class="mt-2 grid flex-1 grid-cols-2 content-start gap-2 overflow-y-auto pb-4 sm:grid-cols-3">${items.map((it, i) => this.tile(it, i)).join('')}</div>
      <div data-h="detalle" class="absolute inset-0 z-20 hidden"></div>
    </div>`).onclick = e => this.click(e);
    this.animar();
  }
  animar(){
    const vistas = [...this.app.root.querySelectorAll('canvas[data-prev], canvas[data-grande]')].map(cv => {
      const it = cv.dataset.grande != null ? this.detalle : this.lista[+cv.dataset.prev];
      return new VistaPrevia(cv, {kind:it.kind === 'enemigo' ? 'enemigo' : it.kind === 'fusion' ? 'arma' : it.kind, id:it.id});
    });
    const t0 = performance.now();
    const paso = now => { const t = (now - t0) / 1000; vistas.forEach(v => v.dibujar(t)); this.raf = requestAnimationFrame(paso); };
    this.raf = requestAnimationFrame(paso);
  }
  click(e){
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'volver') return this.detalle ? this.cerrarDetalle() : this.app.go(new MenuScene(this.app));
    if (a === 'vertodo'){ this.todo = e.target.checked; return this.pintar(); }
    const tab = e.target.closest('[data-tab]')?.dataset.tab; if (tab){ this.tab = tab; return this.pintar(); }
    const it = e.target.closest('[data-item]')?.dataset.item; if (it != null) return this.abrirDetalle(this.lista[+it]);
    if (e.target.closest('[data-a="cerrar"]')) this.cerrarDetalle();
  }
  cerrarDetalle(){ this.detalle = null; this.pintar(); }
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
    } else if (it.kind === 'arma' || it.kind === 'tactico' || it.kind === 'fusion'){
      const d = it.d, niveles = d.niveles.map((n, i) => n && [i + 1, n]).filter(Boolean), claves = Object.keys(niveles[0][1]);
      const esArma = d.tipo === 'arma';
      const mejora = P.nivel((esArma ? 'arma-' : 'tac-') + (esArma ? armaBase(it.id) : it.id));
      vista = it.kind === 'fusion' ? `<div class="grid gap-2">${esArma ? `<canvas data-grande class="block aspect-[120/70] w-full rounded-2xl"></canvas>` : ''}<div class="pointer-events-none overflow-hidden ${esArma ? '' : 'py-6'}"><div class="${esArma ? '' : 'scale-150'}">${fusionAnim(d.icon, false)}</div></div></div>`
        : it.kind === 'arma' ? `<canvas data-grande class="block aspect-[120/70] w-full rounded-2xl"></canvas>` : `<div class="flex h-36 items-center justify-center"><span class="relative text-7xl [animation:flotar_2s_ease-in-out_infinite]">${d.icon}<span class="absolute inset-0 animate-ping rounded-full bg-emerald-400/10"></span></span></div>`;
      cuerpo = `<p class="text-sm text-zinc-300">${d.desc}</p>
        ${d.fusion ? `<p class="mt-1 text-xs text-amber-300">⚗️ Fusión de nivel 4 · ${esArma ? 'arma' : 'táctico'}. Libera un espacio al crearse.</p>` : ''}
        <div class="mt-2 flex flex-wrap gap-1">${chipsProps(d.props)}</div>
        <div class="mt-3">${tablaStats(`<tr><th>Nv</th>${claves.map(k => `<th>${ETIQUETA_STAT[k] ?? k}</th>`).join('')}</tr>${niveles.map(([n, st]) => `<tr><td>${pips(n, n > 3 ? 4 : 3)}</td>${claves.map(k => `<td>${st[k]}</td>`).join('')}</tr>`).join('')}`)}</div>
        ${d.fusion && !esArma ? '' : `<p class="mt-2 text-xs text-zinc-400">Mejora permanente: ${mejora}/3 ${esArma ? '(+10 % de daño por nivel)' : '(+10 % de potencia por nivel)'}</p>`}`;
    } else if (it.kind === 'soldado'){
      const d = SOLDADOS[it.id], m = P.nivel('sold-' + it.id), k = 1 + 0.15 * m;
      vista = `<canvas data-grande class="block aspect-[120/70] w-full rounded-2xl"></canvas>`;
      cuerpo = `<p class="text-sm text-zinc-300">${d.icon} ${d.desc}</p><div class="mt-2">${tablaStats(`
        <tr><td>Vida</td><td>${Math.round(d.vida * k)}</td></tr>
        ${d.ataque ? `<tr><td>Ataque</td><td>${(d.ataque.dmg * k).toFixed(1)} de daño ${d.ataque.dano} · recarga ${d.ataque.cd} s · alcance ${d.ataque.rango}${d.ataque.area ? ' · área ' + d.ataque.area : ''}</td></tr><tr><td>Costo</td><td>${d.ataque.costo} ⚡ por disparo</td></tr>` : ''}
        ${d.apoyo ? `<tr><td>Apoyo</td><td>${d.apoyo.curar ? `cura ${(d.apoyo.curar * k).toFixed(1)}` : `repara ${(d.apoyo.reparar * k).toFixed(1)}`} cada ${d.apoyo.cd} s</td></tr><tr><td>Costo</td><td>${d.apoyo.costo} ⚡</td></tr>` : ''}
        ${it.id === 'fusilero' ? '<tr><td>Arma</td><td>Usa tus armas de pelotón (rifle o su fusión)</td></tr>' : ''}
        <tr><td>Mejora</td><td>${m}/3 (+15 % por nivel)</td></tr>`)}</div>`;
    } else {
      const e = ENEMIGOS[it.id](0, {vida:1, velocidad:1}), info = INFO_ENEMIGO[it.id];
      const hab = [e.salta && '🦘 Salta sobre los soldados', e.bajoTierra && '⛏️ Avanza bajo tierra', e.kamikaze && '💥 Kamikaze', e.escudoMental && '🧠 Escudo mental', e.armadura && `🛡 Armadura física −${e.armadura * 100} %`, e.escudo && `🔵 Escudo de energía −${e.escudo * 100} %`].filter(Boolean);
      vista = `<canvas data-grande class="block aspect-[120/70] w-full rounded-2xl"></canvas>`;
      cuerpo = `<p class="text-sm text-zinc-300">${e.jefe ? '👹 <b>Jefe.</b> ' : ''}${info.desc}</p><div class="mt-2">${tablaStats(`
        <tr><td>Terreno</td><td>${e.vuela ? '✈️ Aire' : '🟫 Tierra'}</td></tr>
        <tr><td>Vida base</td><td>${Math.round(e.vida)}</td></tr><tr><td>Velocidad</td><td>${e.vel}</td></tr>
        <tr><td>Armas</td><td>${e.armas.length ? e.armas.map(a => `${ARMA_ENEMIGA[a.tipo]}${a.dmg ? ` (${a.dmg} de daño${a.rango ? `, alcance ${a.rango}` : ''})` : a.invoca ? ` ${INFO_ENEMIGO[a.invoca].name}` : ''}`).join(' · ') : e.dps ? `Cuerpo a cuerpo (${e.dps}/s)` : '—'}</td></tr>
        ${hab.length ? `<tr><td>Habilidades</td><td>${hab.join('<br>')}</td></tr>` : ''}
        ${DEBILIDAD[it.id] ? `<tr><td>Débil a</td><td>${EQUIPO[DEBILIDAD[it.id]].icon} ${EQUIPO[DEBILIDAD[it.id]].name} (×${MULT_DEBIL} de daño)</td></tr>` : ''}
        <tr><td>XP</td><td>${e.xp}</td></tr>`)}</div>`;
    }
    cont.classList.remove('hidden');
    cont.innerHTML = `<div class="flex h-full flex-col overflow-y-auto bg-zinc-950 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div class="mx-auto w-full max-w-md"><div class="flex items-center justify-between"><b class="text-lg">${it.ok ? it.name : 'Desconocido'}</b><button data-a="cerrar" class="${UI.btn} !min-h-10 !px-3">✕</button></div>
      <div class="mt-3">${vista}</div><div class="mt-3">${cuerpo}</div></div></div>`;
    cancelAnimationFrame(this.raf); this.animar();
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
      <p class="text-xs text-zinc-400">Ganas 🔬 al <b>completar cada misión</b> (10 + 5 × número de misión) y con tu XP (1 por cada 10). Se mantienen entre partidas.</p>
      ${tabs(CATEGORIAS_MEJORA, this.tab)}
      <div class="mt-2 flex-1 space-y-2 overflow-y-auto pb-4">${lista.map(([id, m]) => {
        const disp = P.disponible(id), n = P.nivel(id), max = n >= m.max;
        return `<div class="${UI.card} flex items-center gap-3 ${disp ? '' : 'opacity-60'}"><span class="text-3xl ${disp ? '' : 'brightness-0'}">${m.icon}</span>
          <div class="flex-1"><b>${disp ? m.name : 'Desconocido'}</b> <span class="text-xs">${pips(n, m.max)}</span><div class="text-xs text-zinc-400">${disp ? m.desc : '🔒 Descúbrelo en una partida para poder mejorarlo'}</div></div>
          <button data-buy="${id}" class="${UI.btnP} !min-h-11 !px-3 text-sm" ${P.puedeComprar(id) ? '' : 'disabled'}>${max ? 'Máx.' : `${P.costo(id)} 🔬`}</button></div>`;
      }).join('')}</div></div>`).onclick = e => {
      if (e.target.closest('[data-a="volver"]')) return this.app.go(new MenuScene(this.app));
      const tab = e.target.closest('[data-tab]')?.dataset.tab; if (tab){ this.tab = tab; return this.pintar(); }
      const id = e.target.closest('[data-buy]')?.dataset.buy; if (id && P.comprar(id)) this.pintar();
    };
  }
}

/* ---------- Mazo: combinaciones guardadas para todas las partidas ---------- */
class MazoScene extends Scene {
  enter(){ this.dom ??= 'fund'; this.armando = null; this.pintar(); }
  exit(){ const r = this.app.root; r.onpointerdown = r.onpointermove = r.onpointerup = null; this.fantasma?.remove(); }
  get lista(){ return this.app.progreso.data.mazo[this.dom]; }
  pintar(){
    const D = DOMINIOS[this.dom], lista = this.lista;
    this.app.html(`
    <div class="mx-auto flex h-full max-w-xl flex-col px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div class="flex items-center justify-between">${btnVolver}<span class="text-xs text-zinc-400">${lista.length}/${MAX_MAZO} combinaciones</span></div>
      <h2 class="mt-3 text-2xl font-black">🃏 Mazo</h2>
      <p class="text-xs text-zinc-400">Combinaciones de propiedades que se aplican en orden y te acompañan en <b>todas</b> las partidas (una vez por ronda cada una). Hay un mazo por área.</p>
      ${tabs([['fund', '🧱', 'Fundamentos'], ['alg', '🔺', 'Álgebra'], ['dif', '📈', 'Diferencial'], ['int', '∫', 'Integral']], this.dom)}
      <div class="mt-2 flex-1 space-y-2 overflow-y-auto pb-4">
        ${this.armando ? this.constructor_(D) : `
        ${lista.map((cb, i) => `<div class="${UI.card} flex items-center gap-3"><span class="text-2xl">🔗</span><div class="flex-1"><b>${cb.nombre}</b>
          <div class="mt-1 flex flex-wrap items-center gap-1 text-sm">${cb.cartas.map((id, j) => `${j ? '<span class="text-zinc-500">›</span>' : ''}<span class="rounded-lg bg-zinc-800 px-1.5 py-0.5">${D.cartas.get(id).icon} ${D.cartas.get(id).name}</span>`).join('')}</div></div>
          <button data-borrar="${i}" class="${UI.btn} !min-h-10 !px-3" aria-label="Borrar">🗑</button></div>`).join('') || '<p class="py-6 text-center text-sm text-zinc-500">Tu mazo está vacío.</p>'}
        <button data-a="combinar" class="${UI.btnP} w-full" ${lista.length >= MAX_MAZO ? 'disabled' : ''}>🔗 Combinar propiedades</button>`}
      </div></div>`).onclick = e => this.click(e);
    if (this.armando){ this.activarArrastre(); this.app.root.querySelector('[data-nombre]').oninput = e => this.armando.nombre = e.target.value; }
  }
  constructor_(D){
    const a = this.armando;
    return `<div class="${UI.card}"><b>Arrastra cartas al recuadro</b> <span class="text-xs text-zinc-400">(o tócalas) · máx. ${MAX_CARTAS_COMBO} · toca una del recuadro para quitarla</span>
      <div data-caja class="mt-2 flex min-h-24 flex-wrap items-center gap-1.5 rounded-2xl border-2 border-dashed ${a.sobre ? 'border-emerald-400 bg-emerald-400/10' : 'border-zinc-600'} p-2">
        ${a.cartas.length ? a.cartas.map((id, i) => `<button data-quitar="${i}" data-chip class="flex items-center gap-1 rounded-xl bg-zinc-800 px-2 py-1.5 text-sm"><b class="text-amber-300">${i + 1}</b> ${D.cartas.get(id).icon} ${D.cartas.get(id).name} ✕</button>`).join('') : '<span class="w-full text-center text-sm text-zinc-500">Suelta aquí las cartas, en el orden en que se aplicarán</span>'}
      </div>
      <input data-nombre value="${a.nombre}" maxlength="24" class="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" placeholder="Nombre de la combinación">
      <div class="mt-2 grid grid-cols-2 gap-2"><button data-a="cancelar" class="${UI.btn}">Cancelar</button><button data-a="guardar" class="${UI.btnP}" ${a.cartas.length >= 2 ? '' : 'disabled'}>Guardar en el mazo</button></div></div>
      <div class="mt-2 flex flex-wrap justify-center gap-2">${D.cartas.all().filter(c => !c.free && this.app.cartaDesbloqueada(c.id)).map(c => cartaHTML(c, D, {attr:`data-pick="${c.id}" style="touch-action:none"`, chica:true})).join('')}</div>`;
  }
  click(e){
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'volver') return this.armando ? (this.armando = null, this.pintar()) : this.app.go(new MenuScene(this.app));
    const tab = e.target.closest('[data-tab]')?.dataset.tab; if (tab){ this.dom = tab; this.armando = null; return this.pintar(); }
    const b = e.target.closest('[data-borrar]')?.dataset.borrar; if (b != null){ const l = [...this.lista]; l.splice(+b, 1); this.app.progreso.guardarMazo(this.dom, l); return this.pintar(); }
    if (a === 'combinar'){ this.armando = {cartas:[], nombre:`Combinación ${this.lista.length + 1}`}; return this.pintar(); }
    if (a === 'cancelar'){ this.armando = null; return this.pintar(); }
    if (a === 'guardar'){
      const nombre = this.app.root.querySelector('[data-nombre]').value.trim() || this.armando.nombre;
      this.app.progreso.guardarMazo(this.dom, [...this.lista, {nombre, cartas:[...this.armando.cartas]}]);
      this.armando = null; return this.pintar();
    }
    const q = e.target.closest('[data-quitar]')?.dataset.quitar; if (q != null){ this.armando.cartas.splice(+q, 1); return this.pintar(); }
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
    };
    root.onpointerup = e => {
      const d = this.arr; this.arr = null; if (!d) return;
      this.fantasma?.remove(); this.fantasma = null;
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

/* ---------- Pelotón: estrategia con tipos de soldado y munición ----------
   Se desbloquea en la Ruta. El jugador decide el ORDEN en que la base recluta
   soldados (qué tipos y cuántos) y la MUNICIÓN de cada tipo; los enemigos son
   débiles a un tipo de daño, así que conviene adaptar el pelotón. */
const SLOTS_PELOTON = 8;
class PelotonScene extends Scene {
  enter(){
    const d = this.app.progreso.data;
    d.peloton ??= {orden:ORDEN_RECLUTA.slice(0, SLOTS_PELOTON), equipo:{}};
    this.pintar();
  }
  tipos(){ return Object.keys(SOLDADOS).filter(t => t === 'fusilero' || this.app.soldadoDesbloqueado(t)); }
  pintar(msg = ''){
    const P = this.app.progreso, pl = P.data.peloton, tipos = this.tipos();
    const enemigos = Object.keys(DEBILIDAD).filter(id => P.data.todo || P.conocido('enemigos', id));
    const cuenta = Object.fromEntries(Object.keys(EQUIPO).map(k => [k, enemigos.filter(id => DEBILIDAD[id] === k).length]));
    const usados = new Set(pl.orden);
    this.app.html(`
    <div class="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div class="flex items-center justify-between">${btnVolver}<button data-a="reset" class="${UI.btn} !min-h-10 !px-3 text-sm">↺ Por defecto</button></div>
      <h2 class="text-2xl font-black">🪖 Estrategia del pelotón</h2>
      <p class="text-xs text-zinc-400">Elige qué soldados recluta la base (en este orden, y se repite) y qué munición usa cada tipo. Cada enemigo es <b>débil</b> a un tipo de daño (×${MULT_DEBIL}): arma el pelotón según lo que viene. Los cambios valen desde la próxima partida.</p>
      ${msg ? `<p class="rounded-xl bg-zinc-900 px-3 py-2 text-sm text-emerald-300">${msg}</p>` : ''}
      <div class="${UI.card}"><b class="text-sm">Orden de reclutamiento</b> <span class="text-xs text-zinc-500">(toca un puesto para cambiar el tipo)</span>
        <div class="mt-2 grid grid-cols-4 gap-1.5">${pl.orden.map((t, i) => `<button data-slot="${i}" class="flex min-h-16 flex-col items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 text-xs touch-manipulation active:scale-95"><span class="text-[10px] text-zinc-500">#${i + 1}</span><span class="text-2xl">${SOLDADOS[t].icon}</span>${SOLDADOS[t].name}</button>`).join('')}</div>
        <p class="mt-2 text-[11px] text-zinc-500">Tipos disponibles: ${tipos.map(t => `${SOLDADOS[t].icon} ${SOLDADOS[t].name}`).join(' · ')}${tipos.length < 5 ? ' · los demás aparecen al descubrirlos jugando' : ''}.</p></div>
      <div class="${UI.card}"><b class="text-sm">Munición por tipo de soldado</b>
        ${['fusilero', 'pesado', 'granadero'].filter(t => tipos.includes(t)).map(t => { const actual = pl.equipo[t] ?? SOLDADOS[t].ataque?.dano ?? 'fisico';
          return `<div class="mt-2 flex items-center gap-2"><span class="w-24 text-sm">${SOLDADOS[t].icon} ${SOLDADOS[t].name}${usados.has(t) ? '' : ' <span class="text-[10px] text-zinc-500">(no reclutado)</span>'}</span>
            <div class="grid flex-1 grid-cols-3 gap-1">${Object.entries(EQUIPO).map(([k, q]) => `<button data-eq="${t}|${k}" class="min-h-10 rounded-lg border text-xs touch-manipulation ${actual === k ? 'border-amber-400 bg-amber-400/15 text-amber-200' : 'border-zinc-700 bg-zinc-950'}">${q.icon} ${q.name}</button>`).join('')}</div></div>`; }).join('')}
        <ul class="mt-2 grid gap-0.5 text-[11px] text-zinc-400">${Object.values(EQUIPO).map(q => `<li>${q.icon} <b>${q.name}:</b> ${q.desc}</li>`).join('')}</ul></div>
      <div class="${UI.card}"><b class="text-sm">Debilidades de los enemigos que conoces</b>
        <div class="mt-1 flex gap-2 text-xs">${Object.entries(EQUIPO).map(([k, q]) => `<span class="rounded-full bg-zinc-800 px-2 py-0.5">${q.icon} ${cuenta[k]}</span>`).join('')}</div>
        <div class="mt-2 grid grid-cols-2 gap-1 text-xs">${enemigos.length ? enemigos.map(id => `<span class="rounded-lg bg-zinc-950 px-2 py-1">${INFO_ENEMIGO[id].name} → ${EQUIPO[DEBILIDAD[id]].icon} ${EQUIPO[DEBILIDAD[id]].name}</span>`).join('') : '<span class="text-zinc-500">Juega para descubrir enemigos.</span>'}</div></div>
    </div>`).onclick = e => this.click(e);
  }
  click(e){
    const P = this.app.progreso, pl = P.data.peloton, tipos = this.tipos();
    if (e.target.closest('[data-a="volver"]')) return this.app.go(new MenuScene(this.app));
    if (e.target.closest('[data-a="reset"]')){ P.data.peloton = {orden:ORDEN_RECLUTA.slice(0, SLOTS_PELOTON), equipo:{}}; P.guardar(); return this.pintar('Pelotón restablecido.'); }
    const sl = e.target.closest('[data-slot]');
    if (sl){ const i = +sl.dataset.slot; pl.orden[i] = tipos[(tipos.indexOf(pl.orden[i]) + 1) % tipos.length]; P.guardar(); return this.pintar(); }
    const eq = e.target.closest('[data-eq]');
    if (eq){ const [t, k] = eq.dataset.eq.split('|'); pl.equipo[t] = k; P.guardar(); return this.pintar(); }
  }
}
