/* =====================================================================
   MOTOR "LEGO": lienzo en blanco + banco de piezas
   - Arrastra una pieza del banco al lienzo (o tócala para añadirla al
     espacio activo). Las piezas estructurales (fracción, raíz, exponente)
     tienen espacios internos donde se encajan otras piezas.
   - Toca una pieza del lienzo para quitarla, o arrástrala para moverla.
   ===================================================================== */
const STRUCT = {frac:2, sqrt:1, sup:1};
const TOKTEX = {'·':'\\cdot','÷':'\\div','≤':'\\le','≥':'\\ge','≠':'\\ne','±':'\\pm','ln':'\\ln','log':'\\log','log_3':'\\log_3',
  'sin':'\\sin','cos':'\\cos','tan':'\\tan',',':',','(':'(',')':')','[':'[',']':']'};
const tokTex = t => TOKTEX[t] ?? t.replace(/π/g,'\\pi ').replace(/∞/g,'\\infty ');
const kx = (tex, display=false) => window.katex ? katex.renderToString(tex,{throwOnError:false, displayMode:display}) : tex;

/* Convierte una respuesta serializada (frac{a}{b}, sqrt{x}, ^{n}) en LaTeX */
function ansTex(s){
  return s.replace(/frac\{/g,'\\frac{').replace(/sqrt\{/g,'\\sqrt{').replace(/log_3/g,'\\log_3 ')
    .replace(/\b(ln|log|sin|cos|tan)/g,'\\$1 ').replace(/·/g,'\\cdot ').replace(/±/g,'\\pm ').replace(/≤/g,'\\le ')
    .replace(/≥/g,'\\ge ').replace(/≠/g,'\\ne ').replace(/π/g,'\\pi ').replace(/∞/g,'\\infty ').replace(/,/g,',\\ ');
}

/* ---------- Modelo ---------- */
const LEGO = {};          // estado por ejercicio
/** Otros componentes (p. ej. el Paso libre del juego) pueden reutilizar el lienzo y la paleta registrando su propio render. */
const LEGO_HOOKS = {};
function legoState(key){
  if (!LEGO[key]) LEGO[key] = {step:0, root:[], active:null, hist:[], log:[], tries:0, msg:null, cat:null, pin:false};
  return LEGO[key];
}
const newNode = t => STRUCT[t] ? {t, z:Array.from({length:STRUCT[t]},()=>[])} : {t};
function ser(zone){
  return zone.map(n=> n.t==='frac' ? `frac{${ser(n.z[0])}}{${ser(n.z[1])}}`
                    : n.t==='sqrt' ? `sqrt{${ser(n.z[0])}}`
                    : n.t==='sup'  ? `^{${ser(n.z[0])}}` : n.t).join('');
}
const norm = s => s.replace(/\s+/g,'').replace(/−/g,'-');
function splitTop(s){                      // separa por comas fuera de {} y ()
  const out=[]; let d=0, cur='';
  for (const ch of s){ if('{(['.includes(ch)) d++; if('})]'.includes(ch)) d--; if(ch===','&&d===0){out.push(cur);cur='';} else cur+=ch; }
  out.push(cur); return out;
}
function checkAnswer(step, built){
  const b = norm(built);
  if (step.set){
    const key = s => splitTop(norm(s)).map(x=>x.replace(/^x=/,'')).sort().join('|');
    return step.a.some(a => key(a)===key(b));
  }
  return step.a.some(a => norm(a)===b);
}
function containsZone(node, zone){
  return (node.z||[]).some(z => z===zone || z.some(n=>containsZone(n, zone)));
}

/* ---------- Render ---------- */
const ZREG = {};   // registro de zonas del último render, por ejercicio
function zoneHTML(key, zone, depth, sm=false){
  const st = legoState(key);
  const id = ZREG[key].push(zone)-1;
  const isRoot = depth===0, active = st.active===zone || (!st.active && isRoot);
  const base = isRoot
    ? 'min-h-28 w-full p-2.5 gap-1.5 rounded-xl border-2 border-dashed border-stone-300 bg-white bg-[radial-gradient(circle,#e7e5e4_1px,transparent_1px)] [background-size:18px_18px] dark:border-zinc-700 dark:bg-zinc-950 dark:bg-[radial-gradient(circle,#27272a_1px,transparent_1px)]'
    : sm ? 'min-h-7 min-w-7 p-0.5 gap-0.5 rounded-md border-[1.5px] border-dashed border-stone-300 bg-white/80 dark:border-zinc-600 dark:bg-zinc-900/80'
         : 'min-h-11 min-w-11 p-1 gap-1 rounded-lg border-2 border-dashed border-stone-300 bg-white/80 dark:border-zinc-600 dark:bg-zinc-900/80';
  const ring = active ? ' ring-2 ring-blue-400 dark:ring-blue-500' : '';
  const empty = zone.length ? '' : (isRoot ? `<span class="pointer-events-none select-none text-sm text-stone-400 dark:text-zinc-500">Lienzo vacío: abre una categoría y arrastra o toca piezas…</span>` : '');
  return `<div data-z="${key}|${id}" class="flex flex-wrap items-center ${base}${ring}">${zone.map((n,i)=>nodeHTML(key,n,id,i,depth,sm)).join('')}${empty}</div>`;
}
const RADICAL = '<svg viewBox="0 0 12 30" preserveAspectRatio="none" aria-hidden="true" class="w-3 shrink-0 self-stretch text-emerald-700 dark:text-emerald-300"><path d="M0 17 L3 16 L6.5 28 L11 1 L12 1" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
function nodeHTML(key, n, zid, i, depth, sm){
  const attr = `data-n="${key}|${zid}|${i}"`;
  const grab = 'touch-none select-none cursor-grab';
  const brick = `${grab} rounded-md border ${sm?'border-b-2':'border-b-4'} shadow-sm`;
  const green = 'border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/60';
  if (n.t==='frac') return `<span ${attr} class="${brick} ${green} inline-flex flex-col items-center ${sm?'gap-0.5 p-0.5':'gap-1 px-1.5 py-1'}">${zoneHTML(key,n.z[0],depth+1,sm)}<span class="h-0.5 w-full rounded bg-emerald-700 dark:bg-emerald-300"></span>${zoneHTML(key,n.z[1],depth+1,sm)}</span>`;
  if (n.t==='sqrt') return `<span ${attr} class="${brick} ${green} inline-flex items-stretch ${sm?'p-0.5':'px-1.5 py-1'}">${RADICAL}<span class="border-t-2 border-emerald-700 pt-0.5 dark:border-emerald-300">${zoneHTML(key,n.z[0],depth+1,sm)}</span></span>`;
  // Exponente: pequeño, pegado arriba a la derecha de la pieza anterior; lo de adentro se dibuja a escala reducida
  if (n.t==='sup')  return `<span ${attr} title="Exponente" class="${grab} -ml-1.5 ${sm?'-translate-y-3':'-translate-y-5'} inline-flex self-center rounded-md border border-emerald-500 bg-emerald-50/90 p-0.5 shadow-sm dark:border-emerald-600 dark:bg-emerald-950/70">${zoneHTML(key,n.z[0],depth+1,true)}</span>`;
  const size = sm ? 'min-h-7 min-w-7 px-1 text-sm' : 'min-h-11 min-w-11 px-2.5 text-lg';
  return `<span ${attr} class="${brick} ${pieceColor(n.t)} inline-flex ${size} items-center justify-center">${kx(tokTex(n.t))}</span>`;
}
function pieceColor(t){
  if (/^[-+]?\d+(\.\d+)?$/.test(t)) return 'border-blue-500 bg-blue-50 text-blue-950 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-100';
  if (/^(ln|log|log_3|sin|cos|tan)$/.test(t)) return 'border-violet-500 bg-violet-50 text-violet-950 dark:border-violet-500 dark:bg-violet-950/60 dark:text-violet-100';
  if (/[a-zπ∞]/i.test(t)) return 'border-amber-500 bg-amber-50 text-amber-950 dark:border-amber-500 dark:bg-amber-950/60 dark:text-amber-100';
  return 'border-stone-400 bg-stone-100 text-stone-900 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-100';
}
function bankPiece(key, t){
  const brick = 'touch-none select-none cursor-grab rounded-md border border-b-4 shadow-sm inline-flex min-h-12 min-w-12 items-center justify-center px-3 text-lg touch-manipulation transition-transform active:scale-90 hover:-translate-y-0.5';
  const label = t==='frac' ? kx('\\frac{\\square}{\\square}') : t==='sqrt' ? kx('\\sqrt{\\square}') : t==='sup' ? kx('x^{\\square}') : kx(tokTex(t));
  const cls = STRUCT[t] ? 'border-emerald-500 bg-emerald-50 text-emerald-950 dark:border-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-100' : pieceColor(t);
  const title = {frac:'Fracción: tiene numerador y denominador', sqrt:'Raíz: tiene un espacio dentro', sup:'Exponente: se coloca después de la base'}[t] || 'Pieza';
  return `<button type="button" data-tok="${key}|${encodeURIComponent(t)}" title="${title}" class="${brick} ${cls}">${label}</button>`;
}
/* ---------- Paleta por categorías ----------
   Tocar una categoría  → su menú queda FIJO (📌) hasta tocarla de nuevo o cerrarlo.
   Mantenerla presionada → el menú se ASOMA; desliza el dedo a una pieza y arrástrala
   al lienzo (o suelta sobre la pieza para añadirla). Al soltar, el menú se cierra. */
const CATS = [
  {id:'num', icon:'🔢', name:'Números'},
  {id:'var', icon:'𝑥',  name:'Variables'},
  {id:'sig', icon:'±',  name:'Signos'},
  {id:'fun', icon:'ƒ',  name:'Funciones'},
  {id:'agr', icon:'🧩', name:'Agrupar'},
];
function catOf(t){
  if (STRUCT[t] || /^[()\[\]]$/.test(t)) return 'agr';
  if (/^[-+]?\d+(\.\d+)?$/.test(t)) return 'num';
  if (/^(ln|log|log_3|sin|cos|tan)$/.test(t)) return 'fun';
  if (/[a-zπ∞]/i.test(t)) return 'var';
  return 'sig';
}
function paletteHTML(key, step, st){
  const groups = {}; (step.orden ? step.k : shuffled(step.k, key+st.step)).forEach(t=>(groups[catOf(t)] ||= []).push(t));
  const cats = CATS.filter(c=>groups[c.id]);
  if (st.cat && !groups[st.cat]) { st.cat = null; st.pin = false; }
  const open = st.cat ? CATS.find(c=>c.id===st.cat) : null;
  const tray = open ? `
      <div class="mb-1.5 flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-zinc-400">
        <span>${open.icon} ${open.name} · ${st.pin ? '📌 fijado' : 'suelta para cerrar'}</span>
        ${st.pin ? `<button data-lg="closecat" class="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 bg-white text-sm touch-manipulation dark:border-zinc-600 dark:bg-zinc-900" aria-label="Cerrar menú">✕</button>` : ''}
      </div>
      <div class="flex flex-wrap justify-center gap-2 sm:justify-start">${groups[open.id].map(t=>bankPiece(key,t)).join('')}</div>`
    : `<div class="flex h-full min-h-[5.5rem] items-center justify-center px-2 text-center text-sm text-stone-500 dark:text-zinc-400"><span>Toca una categoría para <b>fijar</b> su menú, o <b>mantenla presionada</b> para asomarlo y arrastrar.</span></div>`;
  const btn = c => { const on = st.cat===c.id;
    return `<button type="button" data-cat="${key}|${c.id}" aria-pressed="${on}" class="flex min-h-14 touch-none select-none flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-1 text-[11px] leading-tight transition-transform active:scale-95 ${on ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-400 dark:text-zinc-950' : 'border-stone-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'}"><span class="text-lg leading-none">${c.icon}</span>${c.name}<span class="opacity-70">${groups[c.id].length}</span></button>`; };
  return `
      <div data-tray class="mt-3 min-h-[7.5rem] rounded-xl bg-stone-100 p-2.5 dark:bg-zinc-800/60">${tray}</div>
      <div class="mt-2 grid gap-1.5" style="grid-template-columns:repeat(${cats.length},minmax(0,1fr))">${cats.map(btn).join('')}</div>`;
}
function shuffled(arr, seed){
  const a=[...new Set(arr)]; let h=0; for(const c of seed) h=(h*31+c.charCodeAt(0))>>>0;
  for(let i=a.length-1;i>0;i--){ h=(h*1103515245+12345)>>>0; const j=h%(i+1); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

function legoCard(ex, key, idx){
  return `<div class="${C.card}" data-lego="${key}">
    <div class="flex flex-wrap items-center gap-2"><b>🧩 Ejercicio ${idx+1}</b><span class="${C.src}">${ex.src}</span>
      <span data-badge class="ml-auto text-sm text-stone-500 dark:text-zinc-400"></span></div>
    <div class="${C.prob}">\\[${ex.p}\\]</div>
    <div data-lego-body></div></div>`;
}
function renderLego(key){
  if (LEGO_HOOKS[key]) return LEGO_HOOKS[key]();
  const card = document.querySelector(`[data-lego="${CSS.escape(key)}"]`);
  if (!card) return;
  const ex = legoEx(key), st = legoState(key), steps = ex.steps;
  ZREG[key] = [];   // reinicia el registro de esta tarjeta
  const finished = st.step >= steps.length;
  const logHTML = st.log.map((l,i)=>`
    <div class="relative rounded-xl border border-emerald-600/60 bg-emerald-50/70 py-2 pl-11 pr-3 dark:border-emerald-700 dark:bg-emerald-950/30">
      <span class="absolute left-3 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">${l.seen?'👁':'✓'}</span>
      <div class="text-sm text-stone-600 dark:text-zinc-400">${steps[i].q}</div>
      <div class="overflow-x-auto py-1">${kx(ansTex(steps[i].a[0]))}</div>
      <div class="why text-sm text-stone-600 dark:text-zinc-400"><b class="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">Por qué</b> ${steps[i].w}</div>
    </div>`).join('');
  let cur = '';
  if (!finished){
    const s = steps[st.step];
    const fb = st.msg ? `<div class="mt-3 rounded-xl px-3 py-2.5 text-sm font-medium ${st.msg.ok?'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200':'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200'}">${st.msg.t}</div>` : '';
    cur = `
    <div class="rounded-xl border border-blue-300 bg-blue-50/40 p-3 dark:border-blue-800 dark:bg-blue-950/20">
      <div class="mb-2 flex flex-wrap items-baseline gap-2"><span class="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white dark:bg-blue-400 dark:text-zinc-950">Paso ${st.step+1} de ${steps.length}</span><b>${s.q}</b></div>
      ${zoneHTML(key, st.root, 0)}
      ${allZones(st.root).length>1 ? `<div class="mt-2 flex items-center justify-between gap-2 text-xs text-stone-500 dark:text-zinc-400"><span>Las piezas tocadas entran en el espacio <b class="text-blue-700 dark:text-blue-300">azul</b>.</span><button class="${C.btn} !min-h-9 shrink-0 !py-1 !text-xs" data-lg="nextzone">⇥ Siguiente espacio</button></div>` : ''}
      ${paletteHTML(key, s, st)}
      ${fb}
      <button class="${C.btnP} mt-3 !min-h-12 w-full !text-base" data-lg="check">✔ Verificar</button>
      <div class="mt-2 grid grid-cols-4 gap-2">
        <button class="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border border-stone-200 bg-white px-1 py-1.5 text-[11px] leading-tight touch-manipulation select-none transition-transform active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 " data-lg="undo"><span class="text-lg leading-none">↶</span>Deshacer</button><button class="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border border-stone-200 bg-white px-1 py-1.5 text-[11px] leading-tight touch-manipulation select-none transition-transform active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 " data-lg="clear"><span class="text-lg leading-none">🗑</span>Limpiar</button><button class="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border border-stone-200 bg-white px-1 py-1.5 text-[11px] leading-tight touch-manipulation select-none transition-transform active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 " data-lg="hint"><span class="text-lg leading-none">💡</span>Pista</button><button class="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border border-stone-200 bg-white px-1 py-1.5 text-[11px] leading-tight touch-manipulation select-none transition-transform active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 ${st.tries>=2?'ring-2 ring-amber-400':''}" data-lg="reveal"><span class="text-lg leading-none">👁</span>Solución</button>
      </div>
    </div>`;
  } else {
    const seen = st.log.filter(l=>l.seen).length;
    cur = `<div class="rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-3 dark:border-emerald-500 dark:bg-emerald-950/40">🎉 <b>¡Ejercicio completo!</b> ${seen?`(${seen} paso(s) con solución vista)`:'Lo armaste todo tú.'}
      <div class="mt-2"><button class="${C.btn}" data-lg="restart">↻ Repetir ejercicio</button></div></div>`;
  }
  card.querySelector('[data-lego-body]').innerHTML = `<div class="mt-2 space-y-2">${logHTML}${cur}</div>`;
  renderMath(card.querySelector('[data-lego-body]'));
  card.querySelector('[data-badge]').textContent = done[key] ? '✅ Resuelto' : `${Math.min(st.step,steps.length)}/${steps.length} pasos`;
}
function legoEx(key){                 // key = f-<tema>-<i>
  const [, tema, i] = key.match(/^f-(.+)-(\d+)$/);
  return FUND.find(t=>t.id===tema).lego[+i];
}
function allZones(zone){ return [zone, ...zone.flatMap(n=>(n.z||[]).flatMap(allZones))]; }
function snapshot(st){ st.hist.push(JSON.stringify(st.root)); if (st.hist.length>50) st.hist.shift(); }
function findZone(ref){ const [key,id] = ref.split('|'); return {key, zone:ZREG[key][+id]}; }

/* ---------- Acciones ---------- */
function legoAction(key, act){
  if (LEGO_HOOKS[key]){                       // lienzo reutilizado: solo acciones de edición
    const st = legoState(key);
    if (act==='undo' && st.hist.length){ st.root = JSON.parse(st.hist.pop()); st.active=null; }
    if (act==='clear'){ snapshot(st); st.root=[]; st.active=null; }
    if (act==='closecat'){ st.cat=null; st.pin=false; }
    if (act==='nextzone'){ const zs = allZones(st.root); st.active = zs[(zs.indexOf(st.active||st.root)+1) % zs.length]; }
    return renderLego(key);
  }
  const st = legoState(key), ex = legoEx(key), s = ex.steps[st.step];
  if (act==='check'){
    if (!st.root.length){ st.msg = {ok:false, t:'El lienzo está vacío. Arrastra piezas del banco.'}; }
    else if (checkAnswer(s, ser(st.root))){
      st.log.push({seen:false}); st.step++; st.root=[]; st.hist=[]; st.active=null; st.tries=0;
      st.msg = {ok:true, t:'¡Correcto! Sigue con el siguiente paso.'};
      if (st.step>=ex.steps.length){ done[key]=true; store.set('done', done); buildNavFromHash(); }
    } else { st.tries++; st.msg = {ok:false, t:`Todavía no. ${st.tries>=2?'Puedes pedir la pista o ver la solución del paso.':'Revisa signos, orden y que cada espacio esté lleno.'}`}; }
  }
  if (act==='undo' && st.hist.length){ st.root = JSON.parse(st.hist.pop()); st.active=null; st.msg=null; }
  if (act==='clear'){ snapshot(st); st.root=[]; st.active=null; st.msg=null; }
  if (act==='hint'){ st.msg = {ok:true, t:'💡 '+s.h}; }
  if (act==='reveal'){ st.log.push({seen:true}); st.step++; st.root=[]; st.hist=[]; st.active=null; st.tries=0; st.msg=null; }
  if (act==='restart'){ delete LEGO[key]; }
  if (act==='closecat'){ st.cat=null; st.pin=false; }
  if (act==='nextzone'){ const zs = allZones(st.root); st.active = zs[(zs.indexOf(st.active||st.root)+1) % zs.length]; }
  if (act==='check' && navigator.vibrate){ try{ navigator.vibrate(st.msg && st.msg.ok ? 30 : [60,40,60]); }catch(e){} }
  renderLego(key);
}
function insertNode(key, zone, idx, node){
  const st = legoState(key); snapshot(st);
  zone.splice(idx ?? zone.length, 0, node);
  st.msg = null;
  st.active = node.z ? node.z[0] : (st.active || null);
}

/* ---------- Arrastrar / tocar (pointer events: mouse y táctil) ---------- */
let DRAG = null;
function dropIndex(zoneEl, x, y){
  const kids = [...zoneEl.children].filter(c=>c.hasAttribute('data-n'));
  for (let i=0;i<kids.length;i++){
    const r = kids[i].getBoundingClientRect();
    if (y < r.top) return i;
    if (y <= r.bottom && x < r.left + r.width/2) return i;
  }
  return kids.length;
}
function zoneAt(x, y, key){
  const el = document.elementFromPoint(x, y);
  const z = el && el.closest('[data-z]');
  return z && z.dataset.z.startsWith(key+'|') ? z : null;
}
document.addEventListener('pointerdown', e=>{
  const tokEl = e.target.closest('[data-tok]');
  const nEl = e.target.closest('[data-n]');
  const zEl = e.target.closest('[data-z]');
  // Un toque sobre el fondo de un espacio (más interno que cualquier pieza) lo vuelve "activo"
  if (!tokEl && zEl && (!nEl || nEl.contains(zEl))){
    const {key, zone} = findZone(zEl.dataset.z); const st = legoState(key);
    if (st.active !== zone){ st.active = zone; renderLego(key); }
    return;
  }
  if (!tokEl && !nEl) return;
  const el = tokEl || nEl;
  e.preventDefault();
  if (tokEl){
    const [key, t] = tokEl.dataset.tok.split('|');
    DRAG = {key, src:'bank', t:decodeURIComponent(t), el, x0:e.clientX, y0:e.clientY, moved:false, lift:e.pointerType==='mouse'?0:48};
  } else {
    const [key, zid, i] = nEl.dataset.n.split('|');
    DRAG = {key, src:'node', zone:ZREG[key][+zid], i:+i, el, x0:e.clientX, y0:e.clientY, moved:false, lift:e.pointerType==='mouse'?0:48};
  }
});
document.addEventListener('pointermove', e=>{
  if (!DRAG) return;
  if (!DRAG.moved && Math.hypot(e.clientX-DRAG.x0, e.clientY-DRAG.y0) < 6) return;
  if (!DRAG.moved){
    DRAG.moved = true;
    const g = DRAG.el.cloneNode(true);
    g.className += ' pointer-events-none fixed z-[60] opacity-90 shadow-xl ring-2 ring-blue-400';
    document.body.appendChild(g); DRAG.ghost = g;
    if (DRAG.src==='node') DRAG.el.classList.add('opacity-30');
  }
  const r = DRAG.ghost.getBoundingClientRect();
  DRAG.ghost.style.left = (e.clientX - r.width/2)+'px';
  DRAG.ghost.style.top  = (e.clientY - DRAG.lift - r.height/2)+'px';
  document.querySelectorAll('[data-z].bg-blue-100').forEach(z=>z.classList.remove('bg-blue-100','dark:bg-blue-900/40'));
  const z = zoneAt(e.clientX, e.clientY - DRAG.lift, DRAG.key);
  if (z) z.classList.add('bg-blue-100','dark:bg-blue-900/40');
});
document.addEventListener('pointerup', e=>{
  if (!DRAG) return;
  const d = DRAG; DRAG = null;
  const st = legoState(d.key);
  if (d.ghost) d.ghost.remove();
  if (!d.moved){                                   // toque
    if (d.src==='bank') insertNode(d.key, st.active || st.root, null, newNode(d.t));
    else { snapshot(st); d.zone.splice(d.i,1); st.active=null; st.msg=null; }
    renderLego(d.key); return;
  }
  const Y = e.clientY - d.lift;
  const zEl = zoneAt(e.clientX, Y, d.key);
  if (d.src==='bank'){
    if (zEl){ const {zone} = findZone(zEl.dataset.z); insertNode(d.key, zone, dropIndex(zEl,e.clientX,Y), newNode(d.t)); }
  } else {
    const node = d.zone[d.i];
    if (!zEl){ snapshot(st); d.zone.splice(d.i,1); st.active=null; }   // soltar fuera = quitar
    else {
      const {zone} = findZone(zEl.dataset.z);
      if (!containsZone(node, zone)){
        let idx = dropIndex(zEl, e.clientX, Y);
        snapshot(st); d.zone.splice(d.i,1);
        if (zone===d.zone && idx>d.i) idx--;
        zone.splice(idx,0,node);
      }
    }
    st.msg = null;
  }
  renderLego(d.key);
});
document.addEventListener('pointercancel', ()=>{ if (DRAG && DRAG.ghost) DRAG.ghost.remove(); DRAG=null; });
// Teclado: Enter/Espacio sobre una pieza del banco la añade
document.addEventListener('click', e=>{
  const tokEl = e.target.closest('[data-tok]');
  if (tokEl && e.detail===0){
    const [key, t] = tokEl.dataset.tok.split('|'); const st = legoState(key);
    insertNode(key, st.active || st.root, null, newNode(decodeURIComponent(t))); renderLego(key);
  }
  const lg = e.target.closest('[data-lg]');
  if (lg) legoAction(lg.closest('[data-lego]').dataset.lego, lg.dataset.lg);
});

/* ---------- Gestos de la paleta: tocar = fijar · mantener = asomar ---------- */
const HOLD_MS = 260;
let CATP = null;
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch(e){} };
const trayOf = key => document.querySelector(`[data-lego="${CSS.escape(key)}"] [data-tray]`);
document.addEventListener('pointerdown', e=>{
  const c = e.target.closest('[data-cat]'); if (!c) return;
  e.preventDefault();
  const [key, cat] = c.dataset.cat.split('|');
  const lift = e.pointerType==='mouse' ? 0 : 48;
  CATP = {key, cat, lift, peeked:false, sel:null, dragged:false};
  CATP.timer = setTimeout(()=>{
    if (!CATP) return;
    const st = legoState(key);
    CATP.peeked = true; CATP.prev = {cat:st.cat, pin:st.pin};
    st.cat = cat; st.pin = false; renderLego(key); buzz(15);
  }, HOLD_MS);
});
document.addEventListener('pointermove', e=>{
  if (!CATP || !CATP.peeked || DRAG) return;
  const tray = trayOf(CATP.key); if (!tray) return;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const tok = el && el.closest('[data-tok]');
  if (tok && tray.contains(tok)){                       // el dedo pasa sobre una pieza: se selecciona
    if (CATP.sel !== tok){ CATP.sel?.classList.remove('ring-4','ring-blue-400'); tok.classList.add('ring-4','ring-blue-400'); CATP.sel = tok; }
    return;
  }
  if (CATP.sel && !tray.contains(el)){                  // sale del menú con una pieza: empieza a arrastrarla
    const [key, t] = CATP.sel.dataset.tok.split('|');
    DRAG = {key, src:'bank', t:decodeURIComponent(t), el:CATP.sel, x0:e.clientX, y0:e.clientY, moved:false, lift:CATP.lift};
    CATP.dragged = true;
  }
});
document.addEventListener('pointerup', e=>{               // se ejecuta después de soltar una pieza arrastrada
  if (!CATP) return;
  const c = CATP; CATP = null; clearTimeout(c.timer);
  const st = legoState(c.key);
  if (!c.peeked){                                        // toque corto: fija o quita el menú
    if (st.cat===c.cat && st.pin){ st.cat = null; st.pin = false; } else { st.cat = c.cat; st.pin = true; }
    renderLego(c.key); return;
  }
  if (!c.dragged){                                       // soltar sobre una pieza del menú asomado la añade
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const tok = el && el.closest('[data-tok]');
    if (tok && trayOf(c.key)?.contains(tok)) insertNode(c.key, st.active || st.root, null, newNode(decodeURIComponent(tok.dataset.tok.split('|')[1])));
  }
  st.cat = c.prev.pin ? c.prev.cat : null; st.pin = c.prev.pin;   // el menú asomado se cierra al soltar
  renderLego(c.key);
});
document.addEventListener('pointercancel', ()=>{ if (CATP){ clearTimeout(CATP.timer); CATP = null; } });
// Teclado: Enter/Espacio sobre una categoría la fija o la quita
document.addEventListener('click', e=>{
  const c = e.target.closest('[data-cat]');
  if (!c || e.detail!==0) return;
  const [key, cat] = c.dataset.cat.split('|'); const st = legoState(key);
  if (st.cat===cat && st.pin){ st.cat=null; st.pin=false; } else { st.cat=cat; st.pin=true; }
  renderLego(key);
});
