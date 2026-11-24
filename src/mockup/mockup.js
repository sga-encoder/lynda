/* =====================================================================
   MOCKUP VISUAL (no funcional) · Defensa Algebraica
   Muestra todas las pantallas y todos los objetos con sus propiedades.
   Los dibujos del campo de batalla usan el Renderer del juego.
   ===================================================================== */
const {Renderer, MUNDO, Base, ENEMIGOS, Soldado} = DefensaAlgebraica;
const kt = (tex, d = true) => katex.renderToString(tex, {displayMode:d, throwOnError:false, strict:false, trust:c => c.command === '\\htmlData'});

/* ---------- Propuesta de datos: los bonificadores son objetos de propiedades ---------- */
const PROP = {
  objetivo:  {icon:'🎯', name:'Objetivo',   vals:{unico:'Único', area:'Área', cadena:'Cadena'}},
  alcance:   {icon:'✈️', name:'Alcance',    vals:{tierra:'Solo tierra', aire:'Solo aire', ambos:'Tierra y aire'}},
  dano:      {icon:'💥', name:'Daño',       vals:{fisico:'Físico', energia:'Energía', explosivo:'Explosivo'}},
  movimiento:{icon:'➰', name:'Movimiento', vals:{bala:'Bala recta', rayo:'Rayo instantáneo', guiado:'Guiado', parabola:'Parábola'}},
  origen:    {icon:'📍', name:'Origen',     vals:{soldados:'Cada soldado', base:'Torreta de la base'}},
  prioridad: {icon:'👁️', name:'Prioridad',  vals:{cercano:'Más cercano', fuerte:'Más vida', aire:'Voladores primero'}},
  afecta:    {icon:'🧭', name:'Afecta a',   vals:{energia:'Energía', base:'Base', soldados:'Soldados', enemigos:'Enemigos'}},
  modo:      {icon:'🔁', name:'Modo',       vals:{pasivo:'Pasivo (siempre)', aura:'Aura (zona)'}},
};
const ARMAS = [
  {id:'rifle', icon:'🔫', name:'Rifle de pelotón', p:{objetivo:'unico', alcance:'ambos', dano:'fisico', movimiento:'bala', origen:'soldados', prioridad:'cercano'},
   niveles:[['1', '1.1/s', '1⚡'], ['1.5', '1.3/s', '1⚡'], ['2', '1.7/s', '1⚡']], mvp:true},
  {id:'laser', icon:'🔴', name:'Láser de la base', p:{objetivo:'unico', alcance:'ambos', dano:'energia', movimiento:'rayo', origen:'base', prioridad:'fuerte'},
   niveles:[['4', '0.5/s', '4⚡'], ['6', '0.6/s', '4⚡'], ['8', '0.7/s', '4⚡']], mvp:true},
  {id:'misil', icon:'🚀', name:'Misiles', p:{objetivo:'area', alcance:'ambos', dano:'explosivo', movimiento:'guiado', origen:'base', prioridad:'aire'},
   niveles:[['5 · r26', '0.4/s', '5⚡'], ['7 · r30', '0.45/s', '5⚡'], ['9 · r34', '0.5/s', '5⚡']], mvp:true},
  {id:'mortero', icon:'💣', name:'Mortero', p:{objetivo:'area', alcance:'tierra', dano:'explosivo', movimiento:'parabola', origen:'base', prioridad:'cercano'},
   niveles:[['6 · r30', '0.35/s', '4⚡'], ['8 · r34', '0.4/s', '4⚡'], ['10 · r40', '0.45/s', '4⚡']], mvp:false},
];
const TACTICOS = [
  {id:'amplificador', icon:'⚡', name:'Amplificador', p:{afecta:'energia', modo:'pasivo'}, niveles:['Energía ×1.2', '×1.4', '×1.6'], mvp:true},
  {id:'escudo', icon:'🛡️', name:'Escudo', p:{afecta:'base', modo:'pasivo'}, niveles:['+25 vida · +0.5/s', '+50 · +1/s', '+75 · +1.5/s'], mvp:true},
  {id:'lenta', icon:'⏳', name:'Cámara lenta', p:{afecta:'enemigos', modo:'aura'}, niveles:['Velocidad ×0.85', '×0.72', '×0.6'], mvp:true},
  {id:'reclutas', icon:'🪖', name:'Reclutamiento', p:{afecta:'soldados', modo:'pasivo'}, niveles:['+1 soldado', '+2', '+3'], mvp:true},
];
const FOTON = {icon:'🌟', name:'Rayo de fotones', p:{objetivo:'cadena', alcance:'ambos', dano:'energia', movimiento:'rayo', origen:'base', prioridad:'fuerte'}, nivel:['12 ×3', '1/s', '2⚡']};
const ENEMIGOS = [
  {k:'explorador', name:'Alien explorador', terreno:'Tierra', vida:3, vel:'Media', arm:'—', atk:'Cuerpo a cuerpo (soldados, luego base)', mvp:true},
  {k:'blindado', name:'Alien blindado', terreno:'Tierra', vida:6, vel:'Lenta', arm:'Físico −50 %', atk:'Cuerpo a cuerpo, más daño', mvp:false},
  {k:'nave', name:'Nave nodriza', terreno:'Aire', vida:7, vel:'Lenta', arm:'—', atk:'Suelta exploradores lejos de la base', mvp:true},
  {k:'dron', name:'Dron', terreno:'Aire', vida:2, vel:'Rápida', arm:'—', atk:'Se lanza contra la base', mvp:false},
];
const CARTAS = [
  {icon:'✳️', name:'Distributiva', desc:'k(a+b) = ka + kb'},
  {icon:'🧲', name:'Términos semejantes', desc:'3x + 2x = 5x'},
  {icon:'↔️', name:'Pasar al otro lado', desc:'Lo que suma pasa restando'},
  {icon:'➗', name:'Dividir ambos lados', desc:'ax = b → x = b/a'},
  {icon:'🧮', name:'Operar números', desc:'Calcula divisiones'},
  {icon:'✍️', name:'Paso libre', desc:'Escribe tú el paso'},
];

/* ---------- Componentes visuales ---------- */
const chip = (txt, tone = 'zinc') => `<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${{
  zinc:'bg-zinc-800 text-zinc-200', sky:'bg-sky-900/70 text-sky-200', amber:'bg-amber-900/70 text-amber-200', rose:'bg-rose-900/70 text-rose-200',
  emerald:'bg-emerald-900/70 text-emerald-200', violet:'bg-violet-900/70 text-violet-200'}[tone]}">${txt}</span>`;
const TONO = {objetivo:'rose', alcance:'sky', dano:'amber', movimiento:'violet', origen:'zinc', prioridad:'zinc', afecta:'emerald', modo:'zinc'};
const propChips = p => Object.entries(p).map(([k, v]) => chip(`${PROP[k].icon} ${PROP[k].vals[v]}`, TONO[k])).join(' ');
const pips = (n, max = 3, fusion = false) => `<span class="tracking-tight ${fusion ? 'text-amber-300' : 'text-emerald-400'}">${'●'.repeat(n)}<span class="text-zinc-600">${'●'.repeat(Math.max(0, max - n))}</span></span>`;
const tag = mvp => mvp ? `<span class="rounded bg-emerald-500/20 px-1.5 text-[9px] font-bold text-emerald-300">MVP</span>` : `<span class="rounded bg-amber-500/20 px-1.5 text-[9px] font-bold text-amber-300">PROPUESTA</span>`;
const btn = (t, p = false) => `<div class="flex h-9 items-center justify-center rounded-xl text-[12px] font-bold ${p ? 'bg-emerald-500 text-zinc-950' : 'border border-zinc-700 bg-zinc-900'}">${t}</div>`;
const cardHTML = (c, estado = 'normal') => `<div class="flex h-[100px] w-[78px] shrink-0 flex-col items-center justify-between rounded-xl border-2 p-1.5 text-center
  ${estado === 'sel' ? 'border-amber-300 bg-amber-400/20 -translate-y-1' : estado === 'off' ? 'border-zinc-800 bg-zinc-900 opacity-40' : 'border-zinc-600 bg-gradient-to-b from-zinc-800 to-zinc-900'}">
  <span class="text-2xl leading-none">${c.icon}</span><b class="text-[10px] leading-tight">${c.name}</b><span class="text-[8px] leading-tight text-zinc-400">${c.desc}</span></div>`;
const hud = (m = '1/3', o = '2/3', probs = '1/2', nv = 3, xp = 45) => `
  <div class="flex items-center gap-1.5 px-2.5 pb-1 pt-6 text-[10px]"><div class="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-700">⏸</div>
   <div class="flex-1"><div class="flex justify-between"><b>Misión ${m} · Oleada ${o}</b><span>🧮 ${probs}</span></div>
   <div class="mt-0.5 flex items-center gap-1"><span>Nv <b>${nv}</b></span><div class="h-1 flex-1 rounded bg-zinc-800"><div class="h-full rounded bg-sky-400" style="width:${xp}%"></div></div></div></div></div>`;
const bars = (vida = 78, en = 64, sin = false) => `<div class="grid grid-cols-2 gap-2 px-2.5 pt-1.5 text-[10px]">
  <div class="flex items-center gap-1">❤<div class="h-2 flex-1 rounded bg-zinc-800"><div class="h-full rounded bg-emerald-500" style="width:${vida}%"></div></div></div>
  <div class="flex items-center gap-1">⚡<div class="h-2 flex-1 rounded bg-zinc-800"><div class="h-full rounded bg-amber-400 ${sin ? 'animate-pulse' : ''}" style="width:${en}%"></div></div><b>${en}</b></div></div>`;
const phone = (n, title, note, inner) => `<figure class="w-[300px] shrink-0 snap-start">
  <div class="relative h-[630px] overflow-hidden rounded-[2.4rem] border-[9px] border-zinc-800 bg-zinc-950 text-zinc-100 shadow-xl">
    <div class="absolute left-1/2 top-1.5 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-zinc-800"></div>${inner}</div>
  <figcaption class="mt-3 px-1"><b class="text-sm">${n}. ${title}</b><p class="!m-0 text-xs text-stone-600">${note}</p></figcaption></figure>`;

/* ---------- Pantallas ---------- */
const EQ = String.raw`-2x + 11 = 19`;
const EQ_MARCAS = String.raw`\htmlData{t=0}{-2x} \htmlData{t=1}{+ 11} = 19`;
const exprBox = (tex, marks = false) => `<div class="mx-2.5 mt-1 flex min-h-16 items-center justify-center rounded-xl bg-zinc-900 text-[15px] ${marks ? '[&_[data-t]]:rounded [&_[data-t]]:bg-amber-400/30 [&_[data-t]]:outline [&_[data-t]]:outline-2 [&_[data-t]]:outline-amber-300' : ''}">${kt(tex)}</div>`;
const mano = (sel = -1, off = [0, 4]) => `<div class="absolute inset-x-0 bottom-0 flex gap-1.5 overflow-hidden px-2.5 pb-3 pt-1">${CARTAS.map((c, i) => cardHTML(c, i === sel ? 'sel' : off.includes(i) ? 'off' : 'normal')).join('')}</div>`;

const PANTALLAS = [
  ['Menú del juego', 'Entrada desde 🎮 Practicar. Muestra puntos de investigación y qué problemas están desbloqueados por lo hecho en Aprender.', `
    <div class="px-4 pt-8 text-center"><div class="flex justify-between text-[10px] text-zinc-400"><span>🎮 Practicar</span><span class="rounded-lg border border-zinc-700 px-2">✕ Salir</span></div>
    <div class="mt-3 text-4xl">👽🛸</div><h3 class="mt-1 text-xl font-black">Defensa Algebraica</h3>
    <p class="mt-1 text-[11px] leading-snug text-zinc-300">Los soldados solo disparan con la <b class="text-amber-300">energía</b> que generan tus pasos matemáticos.</p>
    <div class="mt-3 space-y-2">${btn('▶ Jugar', true)}<div class="grid grid-cols-2 gap-2">${btn('🛠 Mejoras <span class="ml-1 text-amber-300">42 🔬</span>')}${btn('❓ Cómo jugar')}</div></div>
    <div class="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-left text-[10px]"><b>Problemas desbloqueados</b>
      <div class="mt-1">✅ Ecuaciones ax + b = c</div><div>✅ Simplificar: semejantes</div><div>✅ ax + b = cx + d</div>
      <div>🔒 Simplificar con distributiva<br><span class="text-zinc-500">Completa “multdiv” en Aprender</span></div><div>🔒 k(ax + b) = c</div></div>
    <p class="mt-2 text-[9px] text-zinc-500">Récord 1 830 XP · 4 partidas</p></div>`],
  ['Batalla', 'Arriba el campo; al medio el problema; abajo la mano de cartas. Todos los objetos en escena.', `
    ${hud()}<canvas data-scene="batalla" class="block aspect-[360/200] w-full"></canvas>${bars()}
    <div class="flex justify-between px-2.5 pt-1.5 text-[9px] text-zinc-400"><span>Ecuaciones ax + b = c</span><span>Pasos 1 · mínimo 4</span></div>
    ${exprBox(EQ)}<p class="!m-0 px-2.5 py-1.5 text-center text-[10px] text-emerald-300">+24 ⚡ <span class="text-sky-300">(rápido ×1.5 · combo ×1.1)</span></p>${mano()}`],
  ['Elegir dónde aplicar', 'Si la carta sirve en varios lugares, se resaltan y se toca uno. Tocar la carta otra vez cancela.', `
    ${hud()}<canvas data-scene="calma" class="block aspect-[360/200] w-full"></canvas>${bars(78, 30)}
    <div class="flex justify-between px-2.5 pt-1.5 text-[9px] text-zinc-400"><span>Ecuaciones ax + b = c</span><span>Pasos 1 · mínimo 4</span></div>
    ${exprBox(EQ_MARCAS, true)}<p class="!m-0 px-2.5 py-1.5 text-center text-[10px] text-amber-300">Toca dónde aplicar <b>Pasar al otro lado</b></p>${mano(2)}`],
  ['Paso libre', 'Hoja inferior con el lienzo y la paleta por categorías (tocar = fijar, mantener = asomar). El juego va a media velocidad.', `
    ${hud()}<canvas data-scene="calma" class="block aspect-[360/200] w-full opacity-50"></canvas>
    <div class="absolute inset-x-0 bottom-0 rounded-t-3xl bg-stone-100 p-3 text-zinc-900">
      <div class="flex justify-between"><b class="text-sm">✍️ Paso libre</b><span class="rounded-lg border border-zinc-300 bg-white px-2 text-xs">✕</span></div>
      <div class="text-[9px] text-zinc-500">Tienes:</div><div class="text-[13px]">${kt(EQ)}</div>
      <div class="flex min-h-14 flex-wrap items-center gap-1 rounded-xl border-2 border-dashed border-stone-300 bg-white p-1.5">
        ${['x', '='].map(t => `<span class="flex h-8 min-w-8 items-center justify-center rounded-md border border-b-4 ${t === 'x' ? 'border-amber-500 bg-amber-50' : 'border-stone-400 bg-stone-100'} px-1.5 text-sm">${kt(t, false)}</span>`).join('')}
        <span class="flex h-8 min-w-8 items-center justify-center rounded-md border border-b-4 border-blue-500 bg-blue-50 px-1.5 text-sm">${kt('-4', false)}</span></div>
      <div class="mt-2 rounded-xl bg-stone-200 p-2"><div class="text-[9px] font-semibold text-stone-500">🔢 Números · 📌 fijado</div>
        <div class="mt-1 flex flex-wrap gap-1">${'1234567890'.split('').map(d => `<span class="flex h-8 w-8 items-center justify-center rounded-md border border-b-4 border-blue-500 bg-blue-50 text-sm">${d}</span>`).join('')}</div></div>
      <div class="mt-1.5 grid grid-cols-4 gap-1 text-center text-[9px]">${[['🔢', 'Números', 1], ['𝑥', 'Variables'], ['±', 'Signos'], ['🧩', 'Agrupar']].map(([i, n, on]) => `<div class="rounded-lg border py-1 ${on ? 'border-blue-600 bg-blue-600 text-white' : 'border-stone-200 bg-white'}">${i}<br>${n}</div>`).join('')}</div>
      <div class="mt-2 grid grid-cols-[1fr_auto_auto] gap-1"><div class="flex h-9 items-center justify-center rounded-xl bg-emerald-500 text-xs font-bold">✔ Usar este paso</div><div class="flex h-9 w-9 items-center justify-center rounded-xl border bg-white">↶</div><div class="flex h-9 w-9 items-center justify-center rounded-xl border bg-white">🗑</div></div></div>`],
  ['Subir de nivel', 'Se pausa la batalla. Se elige 1 arma y 1 táctico. Cada opción muestra sus propiedades; la fusión aparece cuando ambos están en nivel 3.', `
    <div class="h-full overflow-hidden bg-zinc-950 px-3 pt-7"><h3 class="text-center text-lg font-black">⬆️ ¡Nivel 5!</h3><p class="!m-0 text-center text-[10px] text-zinc-400">Elige 1 arma y 1 táctico</p>
    <div class="mt-2 flex justify-between text-[11px]"><b>🔫 Armas</b><span>🔫${pips(2)} 🔴${pips(3)} <span class="text-zinc-500">2/3</span></span></div>
    <div class="mt-1 space-y-1.5">
      <div class="rounded-xl border-2 border-amber-300 bg-amber-400/10 p-2"><div class="flex items-center gap-2"><span class="text-2xl">🌟</span><div><b class="text-[11px]">Fusionar: Rayo de fotones</b> ${pips(4, 4, true)}<div class="text-[9px] text-zinc-400">Láser 3 + Amplificador 3 → libera 1 espacio</div></div></div><div class="mt-1 flex flex-wrap gap-1">${propChips({objetivo:'cadena', alcance:'ambos', dano:'energia'})}</div></div>
      <div class="rounded-xl border-2 border-emerald-400 bg-emerald-400/10 p-2"><div class="flex items-center gap-2"><span class="text-2xl">🚀</span><div><b class="text-[11px]">Misiles (nuevo)</b> ${pips(1)}</div></div><div class="mt-1 flex flex-wrap gap-1">${propChips({objetivo:'area', alcance:'ambos', movimiento:'guiado'})}</div></div>
      <div class="rounded-xl border-2 border-zinc-700 bg-zinc-900 p-2"><div class="flex items-center gap-2"><span class="text-2xl">🔫</span><b class="text-[11px]">Rifle → Nv 3</b> ${pips(3)}</div><div class="mt-0.5 text-[9px] text-zinc-400">Daño 1.5 → 2 · cadencia 1.3 → 1.7/s</div></div></div>
    <div class="mt-2 flex justify-between text-[11px]"><b>🧠 Tácticos</b><span>⚡${pips(3)} ⏳${pips(1)} <span class="text-zinc-500">2/3</span></span></div>
    <div class="mt-1 space-y-1.5">
      <div class="rounded-xl border-2 border-emerald-400 bg-emerald-400/10 p-2"><div class="flex items-center gap-2"><span class="text-2xl">🛡️</span><b class="text-[11px]">Escudo (nuevo)</b> ${pips(1)}</div><div class="mt-1 flex flex-wrap gap-1">${propChips({afecta:'base', modo:'pasivo'})}</div></div>
      <div class="rounded-xl border-2 border-zinc-700 bg-zinc-900 p-2"><div class="flex items-center gap-2"><span class="text-2xl">⏳</span><b class="text-[11px]">Cámara lenta → Nv 2</b> ${pips(2)}</div></div></div>
    <div class="mt-2">${btn('Continuar', true)}</div></div>`],
  ['Pausa · tu equipo', '3 espacios de armas + 3 de tácticos con nivel y propiedades actuales. El jugador no las edita: cambian al subir de nivel o fusionar.', `
    <div class="h-full bg-zinc-950 px-3 pt-8"><h3 class="text-center text-lg font-black">⏸ Pausa</h3>
    ${['arma', 'tactico'].map(t => `<div class="mt-3 text-[11px] font-bold">${t === 'arma' ? '🔫 Armas 3/3' : '🧠 Tácticos 2/3'}</div><div class="mt-1 space-y-1.5">${
      (t === 'arma' ? [[FOTON, 4, true], [ARMAS[0], 3], [ARMAS[2], 1]] : [[TACTICOS[2], 2], [TACTICOS[3], 1], [null]]).map(([b, n, f]) => b ? `
        <div class="rounded-xl border ${f ? 'border-amber-400/60' : 'border-zinc-800'} bg-zinc-900 p-2"><div class="flex items-center gap-2"><span class="text-xl">${b.icon}</span><b class="flex-1 text-[11px]">${b.name}</b>${pips(n, f ? 4 : 3, f)}</div>
        <div class="mt-1 flex flex-wrap gap-1">${propChips(b.p)}</div></div>` : `<div class="flex h-12 items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 text-[10px] text-zinc-500">Espacio libre</div>`).join('')}</div>`).join('')}
    <div class="mt-3 space-y-1.5">${btn('▶ Continuar', true)}${btn('Abandonar partida')}</div></div>`],
  ['Resultado', 'Victoria o derrota. La XP se convierte en 🔬 puntos para mejoras permanentes.', `
    <div class="flex h-full flex-col justify-center bg-zinc-950 px-4 text-center"><div class="text-5xl">🏆</div><h3 class="mt-1 text-lg font-black">¡La Tierra está a salvo!</h3>
    <div class="mt-3 grid grid-cols-2 gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-left text-[11px]">
      <span>Misión alcanzada</span><b class="text-right">3 · oleada 3</b><span>Problemas resueltos</span><b class="text-right">18</b>
      <span>Con pasos mínimos</span><b class="text-right">13</b><span>Aliens y naves</span><b class="text-right">57</b>
      <span>Mejor combo</span><b class="text-right">×6</b><span>XP total</span><b class="text-right">1 420</b>
      <span>Investigación</span><b class="text-right text-amber-300">+142 🔬</b></div>
    <div class="mt-3 space-y-1.5">${btn('↻ Jugar otra vez', true)}${btn('🛠 Mejoras')}${btn('Menú')}</div></div>`],
  ['Mejoras permanentes', 'Fuera de la partida; se guardan en el teléfono.', `
    <div class="h-full bg-zinc-950 px-3 pt-8"><div class="flex justify-between"><span class="rounded-lg border border-zinc-700 px-2 text-[11px]">◂ Volver</span><b class="text-amber-300">142 🔬</b></div>
    <h3 class="mt-3 text-lg font-black">Mejoras permanentes</h3>
    <div class="mt-2 space-y-1.5">${[['🧱', 'Blindaje', '+20 vida máxima', 2, 5, '20'], ['🔋', 'Batería', '+15 energía inicial', 1, 5, '11'], ['🎖️', 'Academia', '+1 soldado', 0, 3, '15'], ['🔬', 'Laboratorio', '+10 % XP', 5, 5, 'Máx.']].map(([i, n, d, l, m, c]) => `
      <div class="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-2"><span class="text-2xl">${i}</span><div class="flex-1 text-[11px]"><b>${n}</b> <span class="text-zinc-500">${l}/${m}</span><div class="text-[9px] text-zinc-400">${d}</div></div>
      <span class="rounded-xl px-2.5 py-1.5 text-[11px] font-bold ${c === 'Máx.' ? 'bg-zinc-800 text-zinc-500' : 'bg-emerald-500 text-zinc-950'}">${c === 'Máx.' ? c : c + ' 🔬'}</span></div>`).join('')}</div></div>`],
];

/* ---------- Escenas del canvas (estáticas) ---------- */
class MockRenderer extends Renderer {
  /** Dibuja un solo objeto centrado en una tarjeta. */
  tile(draw, cx, cy){
    const c = this.ctx, s = this.cv.width / 120;
    c.setTransform(s, 0, 0, s, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, 70); g.addColorStop(0, '#0b1023'); g.addColorStop(1, '#312e81'); c.fillStyle = g; c.fillRect(0, 0, 120, 70);
    c.fillStyle = '#1c1917'; c.fillRect(0, 58, 120, 12);
    c.setTransform(s, 0, 0, s, s * (60 - cx), s * (58 - cy)); draw(c);
  }
}
const CFG = {vida:1, velocidad:1};
function alien(x, opts = {}){ const a = (opts.blindado ? ENEMIGOS.blindado : ENEMIGOS.explorador)(x, CFG); a.y = opts.y ?? MUNDO.suelo; a.estado = opts.cae ? 'cae' : 'camina'; a.vida = opts.v ?? a.vida; a.fase = x; return a; }
function nave(x, y, opts = {}){ const n = (opts.dron ? ENEMIGOS.dron : ENEMIGOS.nave)(y, CFG); n.x = x; n.y = y; return n; }
function escena(tipo){
  const base = new Base(100); base.vida = 78;
  const sold = [0, 1, 2].map(i => new Soldado(i, 6));
  const m = {base, soldados:sold, enemigos:[], balas:[], particulas:[], rayos:[], textos:[]};
  if (tipo === 'calma'){ m.enemigos = [alien(250), alien(300, {cae:true, y:90}), nave(280, 40)]; return m; }
  m.enemigos = [alien(150, {v:2}), alien(205), alien(118, {blindado:true, v:4}), alien(300, {cae:true, y:80}), nave(265, 38), nave(190, 70, {dron:true})];
  m.balas = [{x:120, y:160, r:1.2, color:'#fde047'}, {x:140, y:159, r:1.2, color:'#fde047'}, {x:220, y:70, r:2.2, color:'#fb923c'}];
  m.rayos = [{puntos:[{x:base.cx, y:base.cy - 14}, {x:150, y:162}], t:1, color:'#f87171'}];
  for (let i = 0; i < 14; i++){ const a = i * 0.45; m.particulas.push({x:205 + Math.cos(a) * (4 + i % 5), y:160 + Math.sin(a) * (3 + i % 4), r:1.5, t:0.6, color:'#86efac'}); }
  m.textos = [{x:31, y:110, txt:'+24⚡', color:'#fde047', t:1}, {x:150, y:145, txt:'-4', color:'#fecaca', t:1}, {x:86, y:150, txt:'+🪖', color:'#bbf7d0', t:1}];
  return m;
}
const OBJETOS = [
  ['Base', 'Vida con barra · recluta soldados cuando hay espacio · dispara sola (gratis, débil) si no quedan soldados', c => R.base(c, Object.assign(new Base(100), {vida:70})), 31, MUNDO.suelo, ['❤ 100 + mejoras', '🪖 Recluta cada 5 s', '🔫 Torreta de emergencia']],
  ['Soldado', 'Dispara con el arma de pelotón; pelea cuerpo a cuerpo si un alien lo alcanza', c => R.soldado(c, {x:60, vida:6, vidaMax:6}), 62, MUNDO.suelo, ['❤ 6', '📍 Frente de la base']],
  ['Alien explorador', 'Cae en cápsula y camina hacia la base', c => R.alien(c, alien(60)), 60, MUNDO.suelo, ['🟫 Tierra', '❤ 3', '🏃 Media'], true],
  ['Alien en cápsula', 'Estado de caída antes de aterrizar', c => R.alien(c, alien(60, {cae:true, y:MUNDO.suelo - 14})), 60, MUNDO.suelo, ['🪂 Cayendo', 'No ataca']],
  ['Alien blindado', 'Resiste el daño físico: conviene energía o explosivo', c => R.alien(c, alien(60, {blindado:true, v:4})), 60, MUNDO.suelo, ['🟫 Tierra', '❤ 6', '🛡 Físico −50 %'], false],
  ['Nave nodriza', 'Vuela y suelta exploradores lejos de la base', c => R.nave(c, nave(60, MUNDO.suelo - 30), 0), 60, MUNDO.suelo, ['✈️ Aire', '❤ 7', '👽 Suelta aliens'], true],
  ['Dron', 'Volador rápido que se lanza contra la base', c => R.dron(c, nave(60, MUNDO.suelo - 26, {dron:true}), 0), 60, MUNDO.suelo, ['✈️ Aire', '❤ 2', '🏃 Rápida'], false],
  ['Bala de rifle', 'Movimiento: bala recta · Daño: físico', c => { c.fillStyle = '#fde047'; for (let i = 0; i < 3; i++){ c.beginPath(); c.arc(40 + i * 18, MUNDO.suelo - 20, 1.6, 0, 6.28); c.fill(); } }, 60, MUNDO.suelo, ['➰ Bala', '💥 Físico']],
  ['Misil guiado', 'Persigue a su objetivo y explota en área', c => { c.fillStyle = '#fb923c'; c.beginPath(); c.arc(55, MUNDO.suelo - 25, 2.4, 0, 6.28); c.fill(); c.strokeStyle = '#fb923c66'; c.beginPath(); c.moveTo(30, MUNDO.suelo - 10); c.quadraticCurveTo(40, MUNDO.suelo - 30, 55, MUNDO.suelo - 25); c.stroke(); }, 60, MUNDO.suelo, ['➰ Guiado', '🎯 Área']],
  ['Rayo láser', 'Instantáneo, un objetivo', c => { c.strokeStyle = '#f87171'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(20, MUNDO.suelo - 30); c.lineTo(100, MUNDO.suelo - 8); c.stroke(); }, 60, MUNDO.suelo, ['➰ Rayo', '💥 Energía']],
  ['Rayo de fotones', 'Fusión: salta en cadena a 3 objetivos', c => { c.strokeStyle = '#a5f3fc'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(12, MUNDO.suelo - 34); c.lineTo(45, MUNDO.suelo - 10); c.lineTo(75, MUNDO.suelo - 22); c.lineTo(104, MUNDO.suelo - 9); c.stroke(); }, 60, MUNDO.suelo, ['🎯 Cadena ×3', '💥 Energía']],
  ['Explosión y números', 'Partículas al morir; textos flotantes de daño, energía y refuerzos', c => { for (let i = 0; i < 18; i++){ const a = i * 0.35; c.fillStyle = i % 2 ? '#fdba74' : '#86efac'; c.fillRect(45 + Math.cos(a) * (4 + i % 6), MUNDO.suelo - 22 + Math.sin(a) * (3 + i % 5), 1.6, 1.6); } c.font = 'bold 9px system-ui'; c.fillStyle = '#fde047'; c.fillText('+24⚡', 72, MUNDO.suelo - 30); c.fillStyle = '#fecaca'; c.fillText('-4', 92, MUNDO.suelo - 12); }, 60, MUNDO.suelo, ['✨ Efecto', 'Sin colisión']],
];
let R;

/* ---------- Página ---------- */
function bonusCard(b){
  const isArma = !!b.p.objetivo;
  return `<div class="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-100">
    <div class="flex items-center gap-2"><span class="text-3xl">${b.icon}</span><div class="flex-1"><b>${b.name}</b> ${tag(b.mvp)}<div class="text-[11px] text-zinc-400">${isArma ? 'Arma' : 'Táctico'} · nivel máx. 3</div></div></div>
    <div class="mt-2 flex flex-wrap gap-1">${propChips(b.p)}</div>
    <table class="mt-2 w-full text-[11px] [&_td]:border-0 [&_td]:px-1 [&_td]:py-0.5 [&_th]:border-0 [&_th]:bg-transparent [&_th]:px-1 [&_th]:py-0.5 [&_th]:text-zinc-500">
      ${isArma ? `<tr><th>Nv</th><th>Daño</th><th>Cadencia</th><th>Costo</th></tr>${b.niveles.map((r, i) => `<tr><td>${pips(i + 1)}</td>${r.map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}`
               : b.niveles.map((v, i) => `<tr><td class="w-12">${pips(i + 1)}</td><td>${v}</td></tr>`).join('')}
    </table></div>`;
}
function render(){
  const pantallas = PANTALLAS.map(([t, n, h], i) => phone(i + 1, t, n, h)).join('');
  document.getElementById('app').innerHTML = `
  <header class="mx-auto max-w-6xl px-4 pt-8">
    <p class="!m-0 text-sm font-semibold uppercase tracking-wide text-violet-700">Mockup visual · no funcional</p>
    <h1 class="mt-1 text-3xl font-black">Defensa Algebraica · interfaz y objetos</h1>
    <p class="max-w-3xl text-stone-600">Propuesta para revisar antes de terminar el juego. Pensada para celular en vertical. Los dibujos del campo de batalla son los reales del juego. Las etiquetas <span class="rounded bg-emerald-100 px-1 text-xs font-bold text-emerald-800">MVP</span> indican lo que entra en la primera versión jugable; <span class="rounded bg-amber-100 px-1 text-xs font-bold text-amber-800">PROPUESTA</span>, ideas para después.</p>
    <nav class="mt-3 flex flex-wrap gap-2 text-sm">${[['pantallas', '1 · Pantallas'], ['objetos', '2 · Objetos del campo'], ['cartas', '3 · Cartas'], ['bonificadores', '4 · Bonificadores y propiedades'], ['enemigos', '5 · Enemigos'], ['hud', '6 · Barras y mensajes']].map(([id, t]) => `<a href="#${id}" class="rounded-full border border-stone-300 bg-white px-3 py-1 hover:border-violet-500">${t}</a>`).join('')}</nav>
  </header>
  <section id="pantallas" class="mx-auto max-w-6xl px-4 pt-8"><h2 class="text-xl font-bold">1 · Pantallas</h2>
    <p class="text-sm text-stone-600">Desliza horizontalmente para ver todas.</p>
    <div class="mt-3 flex snap-x gap-6 overflow-x-auto pb-6">${pantallas}</div></section>

  <section id="objetos" class="mx-auto max-w-6xl px-4 pt-6"><h2 class="text-xl font-bold">2 · Objetos del campo de batalla</h2>
    <div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">${OBJETOS.map(([n, d, , , , chips, mvp], i) => `
      <div class="overflow-hidden rounded-2xl border border-stone-200 bg-white"><canvas data-tile="${i}" class="block aspect-[120/70] w-full"></canvas>
      <div class="p-3"><b>${n}</b> ${mvp === undefined ? '' : mvp ? '<span class="rounded bg-emerald-100 px-1 text-[10px] font-bold text-emerald-800">MVP</span>' : '<span class="rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-800">PROPUESTA</span>'}
      <p class="!my-1 text-xs text-stone-600">${d}</p><div class="flex flex-wrap gap-1">${chips.map(c => `<span class="rounded-full bg-stone-100 px-2 py-0.5 text-[11px]">${c}</span>`).join('')}</div></div></div>`).join('')}</div></section>

  <section id="cartas" class="mx-auto max-w-6xl px-4 pt-8"><h2 class="text-xl font-bold">3 · Cartas (propiedades matemáticas)</h2>
    <div class="mt-3 rounded-2xl bg-zinc-950 p-4 text-zinc-100">
      ${[['Normal: se puede jugar', 'normal'], ['Seleccionada: esperando dónde aplicar', 'sel'], ['Sin objetivo en este problema', 'off']].map(([t, e]) => `<div class="mb-1 text-xs text-zinc-400">${t}</div><div class="mb-4 flex flex-wrap gap-2">${CARTAS.map(c => cardHTML(c, e)).join('')}</div>`).join('')}
    </div></section>

  <section id="bonificadores" class="mx-auto max-w-6xl px-4 pt-8"><h2 class="text-xl font-bold">4 · Bonificadores: objetos con propiedades</h2>
    <p class="max-w-3xl text-sm text-stone-600">Cada bonificador es un <b>objeto de propiedades</b>. El jugador <b>no</b> las edita: el juego las cambia al subir de nivel (1 → 3) o al fusionar (nivel 4). Un solo tipo de arma lee estas propiedades para saber a quién apunta, cómo se mueve el disparo y cómo hace daño.</p>
    <div class="mt-3 overflow-x-auto rounded-2xl border border-stone-200 bg-white"><table class="w-full text-sm [&_td]:border-stone-200 [&_th]:border-stone-200">
      <tr><th>Propiedad</th><th>Valores posibles</th><th>Para qué sirve</th></tr>
      <tr><td>🎯 Objetivo</td><td>Único · Área · Cadena</td><td>Cuántos enemigos recibe el golpe</td></tr>
      <tr><td>✈️ Alcance</td><td>Solo tierra · Solo aire · Tierra y aire</td><td>Si puede apuntar a voladores (naves, drones)</td></tr>
      <tr><td>💥 Daño</td><td>Físico · Energía · Explosivo</td><td>Interactúa con la armadura (el blindado resiste lo físico)</td></tr>
      <tr><td>➰ Movimiento</td><td>Bala recta · Rayo instantáneo · Guiado · Parábola</td><td>Cómo viaja el disparo (velocidad y si persigue)</td></tr>
      <tr><td>📍 Origen</td><td>Cada soldado · Torreta de la base</td><td>Quién dispara (el rifle escala con soldados)</td></tr>
      <tr><td>👁️ Prioridad</td><td>Más cercano · Más vida · Voladores primero</td><td>A quién elige primero</td></tr>
      <tr><td>🧭 Afecta a / 🔁 Modo</td><td>Energía · Base · Soldados · Enemigos / Pasivo · Aura</td><td>Solo tácticos</td></tr>
      <tr><td>Números</td><td>Daño, cadencia, costo ⚡, radio, saltos</td><td>Suben con el nivel</td></tr></table></div>
    <h3 class="mt-5 font-bold">🔫 Armas (3 espacios)</h3><div class="mt-2 grid gap-3 md:grid-cols-2">${ARMAS.map(bonusCard).join('')}</div>
    <h3 class="mt-5 font-bold">🧠 Tácticos (3 espacios)</h3><div class="mt-2 grid gap-3 md:grid-cols-2">${TACTICOS.map(bonusCard).join('')}</div>
    <h3 class="mt-5 font-bold">⚗️ Fusión</h3>
    <div class="mt-2 rounded-2xl bg-zinc-950 p-4 text-zinc-100">
      <div class="flex flex-wrap items-center justify-center gap-3 text-center">
        <div class="rounded-xl border border-zinc-700 p-3">🔴<br><b>Láser</b><br>${pips(3)}</div><span class="text-2xl">+</span>
        <div class="rounded-xl border border-zinc-700 p-3">⚡<br><b>Amplificador</b><br>${pips(3)}</div><span class="text-2xl">→</span>
        <div class="rounded-xl border-2 border-amber-400 p-3">🌟<br><b>Rayo de fotones</b><br>${pips(4, 4, true)}</div></div>
      <table class="mx-auto mt-4 text-sm [&_td]:border-zinc-800 [&_th]:border-zinc-800 [&_th]:bg-zinc-900">
        <tr><th>Propiedad</th><th>Láser Nv3</th><th>Fotones Nv4</th></tr>
        <tr><td>🎯 Objetivo</td><td>Único</td><td class="font-bold text-amber-300">Cadena ×3</td></tr>
        <tr><td>💥 Daño</td><td>Energía · 8</td><td class="font-bold text-amber-300">Energía · 12</td></tr>
        <tr><td>⚡ Costo por disparo</td><td>4</td><td class="font-bold text-amber-300">2</td></tr>
        <tr><td>Espacios usados</td><td>1 arma + 1 táctico</td><td class="font-bold text-amber-300">1 arma (libera el táctico)</td></tr></table>
      <p class="!mb-0 mt-3 text-center text-xs text-zinc-400">La fusión no crea otro objeto: el mismo bonificador cambia sus propiedades y su nivel pasa a 4.</p></div></section>

  <section id="enemigos" class="mx-auto max-w-6xl px-4 pt-8"><h2 class="text-xl font-bold">5 · Enemigos (también objetos con propiedades)</h2>
    <div class="mt-3 overflow-x-auto rounded-2xl border border-stone-200 bg-white"><table class="w-full text-sm [&_td]:border-stone-200 [&_th]:border-stone-200">
      <tr><th>Enemigo</th><th>Terreno</th><th>Vida</th><th>Velocidad</th><th>Armadura</th><th>Ataque</th><th></th></tr>
      ${ENEMIGOS.map(e => `<tr><td><b>${e.name}</b></td><td>${e.terreno}</td><td>${e.vida}</td><td>${e.vel}</td><td>${e.arm}</td><td>${e.atk}</td><td>${e.mvp ? '<span class="rounded bg-emerald-100 px-1 text-[10px] font-bold text-emerald-800">MVP</span>' : '<span class="rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-800">PROPUESTA</span>'}</td></tr>`).join('')}</table></div>
    <p class="text-sm text-stone-600">Ejemplo de cómo se cruzan las propiedades: un arma con <b>✈️ Solo tierra</b> (Mortero) no puede apuntar a naves ni drones; el daño <b>Físico</b> (Rifle) le hace la mitad al Alien blindado.</p></section>

  <section id="hud" class="mx-auto max-w-6xl px-4 pb-16 pt-8"><h2 class="text-xl font-bold">6 · Barras y mensajes</h2>
    <div class="mt-3 grid gap-3 rounded-2xl bg-zinc-950 p-4 text-zinc-100 md:grid-cols-2">
      <div><div class="text-xs text-zinc-400">Barra superior</div>${hud()}</div>
      <div><div class="text-xs text-zinc-400">Vida y energía · normal / sin energía (parpadea)</div>${bars(78, 64)}${bars(22, 3, true)}</div>
      <div class="space-y-1 text-center text-sm"><div class="text-xs text-zinc-400">Mensajes del paso</div>
        <p class="!m-0 text-emerald-300">+24 ⚡ <span class="text-sky-300">(rápido ×1.5 · combo ×1.2)</span></p>
        <p class="!m-0 text-emerald-300">✅ ¡Resuelto en 4 pasos! <b class="text-sky-300">Eficiencia máxima</b> +30 XP</p>
        <p class="!m-0 text-zinc-300">Paso válido, pero no te acerca al resultado: sin energía.</p>
        <p class="!m-0 text-rose-300">✳️ Distributiva no se puede aplicar aquí.</p>
        <p class="!m-0 text-amber-300">Toca dónde aplicar <b>Pasar al otro lado</b></p></div>
      <div class="flex items-center justify-center text-center"><div><div class="text-xs text-zinc-400">Aviso sobre el campo</div><div class="mt-2 text-xl font-black">Misión 2 · Oleada 1</div><div class="text-lg font-black">¡Misión cumplida! +25 ❤</div></div></div>
    </div></section>`;
  // Dibujar canvases
  document.querySelectorAll('canvas[data-scene]').forEach(cv => { const r = new MockRenderer(cv); r.draw(escena(cv.dataset.scene), 1.3); });
  document.querySelectorAll('canvas[data-tile]').forEach(cv => {
    R = new MockRenderer(cv); const [, , draw, cx, cy] = OBJETOS[+cv.dataset.tile];
    R.tile(draw, cx, cy);
  });
}
window.addEventListener('load', render);
