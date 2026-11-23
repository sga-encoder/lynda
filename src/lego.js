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
function legoState(key){
  if (!LEGO[key]) LEGO[key] = {step:0, root:[], active:null, hist:[], log:[], tries:0, msg:null};
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
function zoneHTML(key, zone, depth){
  const st = legoState(key);
  const id = ZREG[key].push(zone)-1;
  const isRoot = depth===0, active = st.active===zone || (!st.active && isRoot);
  const base = isRoot
    ? 'min-h-24 w-full p-3 gap-1.5 rounded-xl border-2 border-dashed border-stone-300 bg-white bg-[radial-gradient(circle,#e7e5e4_1px,transparent_1px)] [background-size:18px_18px] dark:border-zinc-700 dark:bg-zinc-950 dark:bg-[radial-gradient(circle,#27272a_1px,transparent_1px)]'
    : 'min-h-9 min-w-9 p-1 gap-1 rounded-md border-2 border-dashed border-stone-300 bg-stone-50/80 dark:border-zinc-600 dark:bg-zinc-900/80';
  const ring = active ? ' ring-2 ring-blue-400 dark:ring-blue-500' : '';
  const empty = zone.length ? '' : (isRoot ? `<span class="pointer-events-none select-none text-sm text-stone-400 dark:text-zinc-500">Lienzo vacío: arrastra o toca piezas del banco…</span>` : '');
  return `<div data-z="${key}|${id}" class="flex flex-wrap items-center ${base}${ring}">${zone.map((n,i)=>nodeHTML(key,n,id,i,depth)).join('')}${empty}</div>`;
}
function nodeHTML(key, n, zid, i, depth){
  const attr = `data-n="${key}|${zid}|${i}"`;
  const brick = 'touch-none select-none cursor-grab rounded-md border border-b-4 shadow-sm';
  if (n.t==='frac') return `<span ${attr} class="${brick} inline-flex flex-col items-center gap-1 border-emerald-500 bg-emerald-50 px-1.5 py-1 dark:border-emerald-600 dark:bg-emerald-950/60">${zoneHTML(key,n.z[0],depth+1)}<span class="h-0.5 w-full rounded bg-emerald-700 dark:bg-emerald-300"></span>${zoneHTML(key,n.z[1],depth+1)}</span>`;
  if (n.t==='sqrt') return `<span ${attr} class="${brick} inline-flex items-stretch border-emerald-500 bg-emerald-50 px-1.5 py-1 dark:border-emerald-600 dark:bg-emerald-950/60"><span class="pr-0.5 text-xl leading-none text-emerald-800 dark:text-emerald-200">√</span><span class="border-t-2 border-emerald-700 pt-0.5 dark:border-emerald-300">${zoneHTML(key,n.z[0],depth+1)}</span></span>`;
  if (n.t==='sup')  return `<span ${attr} class="${brick} inline-flex -translate-y-2 scale-90 items-start border-emerald-500 bg-emerald-50 px-1 py-0.5 dark:border-emerald-600 dark:bg-emerald-950/60"><span class="text-[10px] text-emerald-800 dark:text-emerald-200">^</span>${zoneHTML(key,n.z[0],depth+1)}</span>`;
  return `<span ${attr} class="${brick} ${pieceColor(n.t)} inline-flex min-h-9 min-w-9 items-center justify-center px-2 text-[1.05rem]">${kx(tokTex(n.t))}</span>`;
}
function pieceColor(t){
  if (/^[-+]?\d+(\.\d+)?$/.test(t)) return 'border-blue-500 bg-blue-50 text-blue-950 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-100';
  if (/^(ln|log|log_3|sin|cos|tan)$/.test(t)) return 'border-violet-500 bg-violet-50 text-violet-950 dark:border-violet-500 dark:bg-violet-950/60 dark:text-violet-100';
  if (/[a-zπ∞]/i.test(t)) return 'border-amber-500 bg-amber-50 text-amber-950 dark:border-amber-500 dark:bg-amber-950/60 dark:text-amber-100';
  return 'border-stone-400 bg-stone-100 text-stone-900 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-100';
}
function bankPiece(key, t){
  const brick = 'touch-none select-none cursor-grab rounded-md border border-b-4 shadow-sm inline-flex min-h-10 min-w-10 items-center justify-center px-2.5 text-[1.05rem] hover:-translate-y-0.5 transition-transform';
  const label = t==='frac' ? kx('\\frac{\\square}{\\square}') : t==='sqrt' ? kx('\\sqrt{\\square}') : t==='sup' ? kx('\\square^{\\,\\blacksquare}') : kx(tokTex(t));
  const cls = STRUCT[t] ? 'border-emerald-500 bg-emerald-50 text-emerald-950 dark:border-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-100' : pieceColor(t);
  const title = {frac:'Fracción: tiene numerador y denominador', sqrt:'Raíz: tiene un espacio dentro', sup:'Exponente: se coloca después de la base'}[t] || 'Pieza';
  return `<button type="button" data-tok="${key}|${encodeURIComponent(t)}" title="${title}" class="${brick} ${cls}">${label}</button>`;
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
    const fb = st.msg ? `<div class="mt-2 rounded-lg px-3 py-2 text-sm ${st.msg.ok?'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200':'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200'}">${st.msg.t}</div>` : '';
    cur = `
    <div class="rounded-xl border border-blue-300 bg-blue-50/40 p-3 dark:border-blue-800 dark:bg-blue-950/20">
      <div class="mb-2 flex flex-wrap items-baseline gap-2"><span class="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white dark:bg-blue-400 dark:text-zinc-950">Paso ${st.step+1} de ${steps.length}</span><b>${s.q}</b></div>
      ${zoneHTML(key, st.root, 0)}
      <div class="mt-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-zinc-400">Banco de piezas</div>
      <div class="mt-1.5 flex flex-wrap gap-2 rounded-xl bg-stone-100 p-2.5 dark:bg-zinc-800/60">${shuffled(s.k, key+st.step).map(t=>bankPiece(key,t)).join('')}</div>
      <div class="mt-3 flex flex-wrap gap-2">
        <button class="${C.btnP}" data-lg="check">✔ Verificar</button>
        <button class="${C.btn}" data-lg="undo">↶ Deshacer</button>
        <button class="${C.btn}" data-lg="clear">🗑 Limpiar</button>
        <button class="${C.btn}" data-lg="hint">💡 Pista</button>
        <button class="${C.btn} ${st.tries>=2?'ring-2 ring-amber-400':''}" data-lg="reveal">👁 Ver solución del paso</button>
      </div>${fb}
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
function snapshot(st){ st.hist.push(JSON.stringify(st.root)); if (st.hist.length>50) st.hist.shift(); }
function findZone(ref){ const [key,id] = ref.split('|'); return {key, zone:ZREG[key][+id]}; }

/* ---------- Acciones ---------- */
function legoAction(key, act){
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
    DRAG = {key, src:'bank', t:decodeURIComponent(t), el, x0:e.clientX, y0:e.clientY, moved:false};
  } else {
    const [key, zid, i] = nEl.dataset.n.split('|');
    DRAG = {key, src:'node', zone:ZREG[key][+zid], i:+i, el, x0:e.clientX, y0:e.clientY, moved:false};
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
  DRAG.ghost.style.top  = (e.clientY - r.height/2)+'px';
  document.querySelectorAll('[data-z].bg-blue-100').forEach(z=>z.classList.remove('bg-blue-100','dark:bg-blue-900/40'));
  const z = zoneAt(e.clientX, e.clientY, DRAG.key);
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
  const zEl = zoneAt(e.clientX, e.clientY, d.key);
  if (d.src==='bank'){
    if (zEl){ const {zone} = findZone(zEl.dataset.z); insertNode(d.key, zone, dropIndex(zEl,e.clientX,e.clientY), newNode(d.t)); }
  } else {
    const node = d.zone[d.i];
    if (!zEl){ snapshot(st); d.zone.splice(d.i,1); st.active=null; }   // soltar fuera = quitar
    else {
      const {zone} = findZone(zEl.dataset.z);
      if (!containsZone(node, zone)){
        let idx = dropIndex(zEl, e.clientX, e.clientY);
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
