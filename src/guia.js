/* =====================================================================
   GUÍA INTERACTIVA sobre la interfaz real (tutoriales prácticos)
   - Video corto antes de cada paso: una animación arma la respuesta ficha
     por ficha, con el gesto escrito («Toca 🔢 Números», «Toca el 1»…).
   - Guía en vivo: oscurece la pantalla salvo lo que hay que tocar
     (categoría, ficha, espacio, ✔ Verificar), una mano muestra el gesto y
     una burbuja lo explica. Compara el lienzo con la respuesta cada momento,
     así que se adapta si la persona se equivoca (le señala qué quitar).
   ===================================================================== */

/** Unidades de una zona en orden: fichas sueltas (cifras y partes de monomios separadas) y recuadros. */
function unidadesGuia(zone){
  return zone.flatMap(n => {
    if (n.z) return [n];
    const partes = n.mono ? n.partes : [n.t];
    return partes.flatMap(q => /^\d{2,}$/.test(q) ? q.split('') : [q]).map(t => ({t, hoja:true, nodo:n}));
  });
}
const nombreFicha = t => ({frac:'fracción', par:'paréntesis ( )', pot:'potencia □^□', sqrt:'raíz √', exp:'eᵡ', lim:'límite', der:'derivada', int:'integral', intd:'integral definida', '·':'por ·', '-':'menos −', '+':'más +', '=':'igual ='})[t] ?? t;

/** Qué gesto falta para que la zona del lienzo C llegue a la zona objetivo Tz. null = esta zona ya está. */
function gestoGuia(Tz, Cz, st){
  const T = unidadesGuia(Tz), C = unidadesGuia(Cz), activa = st.active ?? st.root;
  let c = 0;
  for (let i = 0; i < T.length; i++){
    const x = T[i], y = C[c];
    if (y){
      if (x.hoja && y.hoja && x.t === y.t){ c++; continue; }
      if (!x.hoja && !y.hoja && x.t === y.t){                         // mismo recuadro: revisar sus espacios
        for (let k = 0; k < x.z.length; k++){ const g = gestoGuia(x.z[k], y.z[k], st); if (g) return g; }
        c++; continue;
      }
      const sig = T[i + 1];
      if (sig && (sig.hoja ? y.hoja && y.t === sig.t : !y.hoja && y.t === sig.t)) return {tipo:'ficha', t:x.t, zona:Cz, arrastrar:true};   // falta una antes: se arrastra a su lugar
      return {tipo:'quitar', nodo:y.nodo ?? y};
    }
    if (activa !== Cz) return {tipo:'zona', zona:Cz};                   // primero elegir el espacio donde va
    return {tipo:'ficha', t:x.t, zona:Cz};
  }
  if (c < C.length) return {tipo:'quitar', nodo:C[c].nodo ?? C[c]};
  return null;
}

/** Recorta el árbol a las primeras n unidades (para los cuadros del video). */
function podarGuia(zone, cuenta){
  const out = [];
  for (const n of zone){
    if (cuenta.n <= 0) break;
    if (n.z){ cuenta.n--; out.push({...n, z:n.z.map(z => podarGuia(z, cuenta))}); continue; }
    const partes = (n.mono ? n.partes : [n.t]).flatMap(q => /^\d{2,}$/.test(q) ? q.split('') : [q]), k = Math.min(partes.length, cuenta.n);
    cuenta.n -= k;
    out.push(...(k === partes.length ? [n] : treeOf(partes.slice(0, k).join(''))));
  }
  return out;
}
/** Video corto del paso: la respuesta se arma ficha por ficha, con el gesto de cada momento. */
function videoGuia(respuesta){
  const T = treeOf(respuesta), lineal = [];
  (function rec(zone, enEspacio){ unidadesGuia(zone).forEach((u, i) => { lineal.push({u, cambio:enEspacio && i === 0}); if (!u.hoja) u.z.forEach((z, k) => rec(z, k > 0)); }); })(T, false);
  const cat = t => CATS.find(c => c.id === catOf(t));
  const pasos = lineal.map(({u, cambio}) => { const ca = cat(u.t), ficha = nombreFicha(u.t);
    return `${cambio ? 'Toca el espacio de abajo. ' : ''}Abre ${ca ? `${ca.icon} ${ca.name}` : 'su categoría'} y toca ${u.hoja ? `la ficha <b>${ficha}</b>` : `la ficha de <b>${ficha}</b>`}.`; });
  const frames = lineal.map((_, i) => podarGuia(T, {n:i + 1}));
  return escenas([...pasos, 'Toca <b>✔ Verificar</b>.'], [...frames, T]);
}

const Guia = (() => {
  let G = null;    // {key, timer, accion}
  const capa = () => {
    let c = document.getElementById('guia3d');
    if (!c){ c = document.createElement('div'); c.id = 'guia3d'; c.setAttribute('aria-live', 'polite');
      c.innerHTML = `<svg class="pointer-events-none fixed inset-0 h-full w-full" style="z-index:90"><defs><mask id="guiaHueco"><rect width="100%" height="100%" fill="white"/><rect data-hueco rx="14" fill="black"/></mask></defs>
          <rect width="100%" height="100%" fill="rgba(2,6,23,.58)" mask="url(#guiaHueco)"/><rect data-aro rx="14" fill="none" stroke="#fbbf24" stroke-width="3" class="guia-aro"/></svg>
        <div data-mano class="guia-mano pointer-events-none fixed" style="z-index:92"><svg viewBox="0 0 64 64" width="54" height="54"><path d="M26 6c3 0 5 2 5 5v17l3-1c3 0 5 2 5 4v1l3-1c3 0 4 2 4 4l3-1c3 0 4 2 4 5v11c0 9-6 15-15 15h-6c-5 0-9-2-12-6L11 43c-2-2-2-5 0-7s5-2 7 0l3 3V11c0-3 2-5 5-5z" fill="#fde68a" stroke="#1e293b" stroke-width="3" stroke-linejoin="round"/></svg></div>
        <div data-burbuja class="pointer-events-none fixed max-w-[18rem] rounded-2xl bg-amber-300 px-3 py-2 text-sm font-semibold text-zinc-950 shadow-xl" style="z-index:93"></div>`;
      document.body.appendChild(c); }
    return c;
  };
  /** Elemento de la pantalla que corresponde al gesto. */
  function objetivo(key, st, g){
    if (!g) return {el:document.querySelector(`[data-lego="${CSS.escape(key)}"] [data-lg="check"]`), txt:'¡Listo! Toca <b>✔ Verificar</b>.'};
    if (g.tipo === 'quitar'){
      if (st.borrar === g.nodo){ const bt = document.querySelector(`[data-lego="${CSS.escape(key)}"] [data-lg="borrar"]`); if (bt) return {el:bt, txt:'Toca la ✕ roja para quitar esta ficha.'}; }
      const recuadro = !!g.nodo.z;   // un recuadro se selecciona tocando su símbolo (a la izquierda), no su centro
      return {el:elDeNodo(key, g.nodo), borde:recuadro, txt:recuadro ? 'Este recuadro no va: toca su símbolo (a la izquierda) para seleccionarlo y quitarlo.' : 'Esta ficha no va aquí: tócala para quitarla (o arrástrala fuera del lienzo).'}; }
    if (g.tipo === 'zona'){
      const sig = document.querySelector(`[data-lego="${CSS.escape(key)}"] [data-lg="nextzone"]`);   // ⇥ Siguiente espacio llega a cualquier espacio
      if (sig) return {el:sig, txt:'Toca <b>⇥ Siguiente espacio</b> hasta que quede azul el espacio donde va la ficha.'};
      const id = ZREG[key]?.indexOf(g.zona); return {el:document.querySelector(`[data-z="${CSS.escape(key + '|' + id)}"]`), txt:'Toca este espacio para elegirlo (se pone azul). Ahí entran las fichas que toques.'}; }
    const ca = CATS.find(c => c.id === catOf(g.t)), ficha = nombreFicha(g.t);
    if (st.cat !== ca?.id) return {el:document.querySelector(`[data-cat="${CSS.escape(key + '|' + ca?.id)}"]`), txt:`Toca <b>${ca ? ca.icon + ' ' + ca.name : 'la categoría'}</b> para abrir sus fichas.`};
    return {el:document.querySelector(`[data-tok="${CSS.escape(key + '|' + encodeURIComponent(g.t))}"]`), txt:g.arrastrar ? `Arrastra la ficha <b>${ficha}</b> a su lugar en el lienzo.` : `Toca la ficha <b>${ficha}</b> (o arrástrala al lienzo).`};
  }
  function paso(){
    if (!G) return;
    const card = document.querySelector(`[data-lego="${CSS.escape(G.key)}"]`);
    if (!card || !card.isConnected){ return detener(); }
    const st = legoState(G.key), ex = legoEx(G.key);
    if (st.step >= ex.steps.length){ G.alTerminar?.(); return detener(); }
    if (G.pausa?.()) { capa().style.display = 'none'; return; }
    let g; try { g = gestoGuia(treeOf(ex.steps[st.step].a[0]), st.root, st); } catch { g = undefined; }
    const {el, txt, borde} = objetivo(G.key, st, g), c = capa(); c.style.display = el ? '' : 'none'; if (!el) return;
    const firma = `${st.step}|${txt}`;
    if (firma !== G.firma){ G.firma = firma; const r0 = el.getBoundingClientRect(); if (r0.top < 70 || r0.bottom > innerHeight - 70) el.scrollIntoView({block:'center', behavior:'smooth'}); }
    const r = el.getBoundingClientRect(), pad = 6, hueco = c.querySelector('[data-hueco]'), aro = c.querySelector('[data-aro]');
    for (const n of [hueco, aro]){ n.setAttribute('x', r.left - pad); n.setAttribute('y', r.top - pad); n.setAttribute('width', r.width + pad * 2); n.setAttribute('height', r.height + pad * 2); }
    const mano = c.querySelector('[data-mano]'); mano.style.left = `${borde ? r.left + 2 : r.left + r.width / 2 - 12}px`; mano.style.top = `${r.top + r.height / 2 - 4}px`;
    mano.classList.toggle('guia-arrastra', !!g?.arrastrar);
    const b = c.querySelector('[data-burbuja]'); b.innerHTML = txt;
    const bh = b.offsetHeight || 60, bw = Math.min(288, innerWidth - 24), arriba = r.top - bh - 18 > 8;
    b.style.left = `${Math.max(12, Math.min(innerWidth - bw - 12, r.left + r.width / 2 - bw / 2))}px`; b.style.width = `${bw}px`;
    b.style.top = `${arriba ? r.top - bh - 18 : Math.min(innerHeight - bh - 8, r.bottom + 64)}px`;
  }
  function iniciar(key, opciones = {}){ detener(); G = {key, ...opciones}; G.timer = setInterval(paso, 160); paso(); }
  function detener(){ if (!G) return; clearInterval(G.timer); G = null; document.getElementById('guia3d')?.remove(); }
  return {iniciar, detener, activa:() => G?.key};
})();
