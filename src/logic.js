/* =====================================================================
   UTILIDADES (clases de Tailwind reutilizadas)
   ===================================================================== */
const C = {
  card:  'my-3 rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none',
  h3:    'mt-8 mb-2.5 border-t border-stone-200 pt-3 text-xl font-bold dark:border-zinc-800',
  chip:  'inline-flex min-h-10 items-center rounded-full border border-transparent bg-blue-50 px-3.5 py-1.5 text-sm touch-manipulation select-none transition-transform active:scale-95 text-blue-700 hover:border-blue-500 dark:bg-blue-950/50 dark:text-blue-300',
  btn:   'inline-flex min-h-11 items-center justify-center gap-1 cursor-pointer rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm touch-manipulation select-none transition-transform active:scale-95 hover:border-blue-500 disabled:cursor-default disabled:opacity-70 dark:border-zinc-700 dark:bg-zinc-900',
  btnP:  'inline-flex min-h-11 items-center justify-center gap-1 cursor-pointer rounded-xl border border-blue-600 bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white touch-manipulation select-none transition-transform active:scale-95 hover:bg-blue-700 disabled:cursor-default disabled:opacity-70 dark:border-blue-400 dark:bg-blue-400 dark:text-zinc-950',
  src:   'text-sm italic text-stone-500 dark:text-zinc-400',
  prob:  'overflow-x-auto py-1 text-lg [&_.katex-display]:my-2',
  lead:  'mt-0 text-base sm:text-lg text-stone-600 dark:text-zinc-400',
  h2:    'mb-1 text-2xl font-bold leading-tight md:text-3xl',
  note:  'my-3 rounded-r-xl border-l-4 border-blue-600 bg-blue-50 px-4 py-2.5 dark:border-blue-400 dark:bg-blue-950/40',
  reveal:'mt-2 overflow-x-auto rounded-xl border border-dashed border-stone-300 px-4 py-2.5 dark:border-zinc-700',
};
const TAG = {
  basico: ['Básico', 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'],
  medio:  ['Medio',  'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'],
  dificil:['Difícil','bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'],
};
const store = {
  get(k){ try{ return JSON.parse(localStorage.getItem('calcint:'+k)); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem('calcint:'+k, JSON.stringify(v)); }catch(e){} }
};
let done = store.get('done') || {};
const baseName = id => (BASES.find(b=>b.id===id)||{}).t || id;

function basesChips(ids){
  return `<div class="my-2.5 flex flex-wrap items-center gap-1.5"><span class="mr-1 text-sm text-stone-500 dark:text-zinc-400">📐 Bases que usa:</span>${ids.map(id=>`<a class="${C.chip}" href="#/bases/${id}">${baseName(id)}</a>`).join('')}</div>`;
}
function stepsBlock(steps, result){
  return `<div data-steps>
   <div class="my-2.5 space-y-2">${steps.map((s,i)=>`
     <div data-step class="hidden relative overflow-x-auto rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-12 pr-3 dark:border-zinc-800 dark:bg-zinc-950">
       <span class="absolute left-3 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white dark:bg-blue-400 dark:text-zinc-950">${i+1}</span>
       <div><b class="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300">Qué hacemos</b><br>${s[0]}</div>
       <div class="why mt-1 text-[0.95rem] text-stone-600 dark:text-zinc-400"><b class="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">Por qué</b> ${s[1]}</div>
     </div>`).join('')}</div>
   <div data-result class="hidden mt-2 overflow-x-auto rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-2.5 dark:border-emerald-500 dark:bg-emerald-950/40">✅ <b>Resultado:</b> \\(\\displaystyle ${result}\\)</div>
   <div class="mt-2 grid grid-cols-[1fr_auto_auto] gap-2 sm:flex">
     <button class="${C.btnP}" data-act="next">Ver paso 1 ▸</button>
     <button class="${C.btn}" data-act="all" aria-label="Mostrar todos los pasos">Todo</button>
     <button class="${C.btn}" data-act="reset" aria-label="Reiniciar">↺</button>
   </div></div>`;
}
function exampleCard(ex){
  const [name, cls] = TAG[ex.lvl];
  return `<div class="${C.card}">
   <div><span class="mr-1.5 rounded-md px-2 py-0.5 align-middle text-xs font-bold uppercase tracking-wide ${cls}">${name}</span><span class="${C.src}">${ex.src}</span></div>
   <div class="${C.prob}">\\[${ex.p}\\]</div>
   ${stepsBlock(ex.steps, ex.r)}</div>`;
}
function exerciseCard(ex, key, i){
  return `<div class="${C.card}" data-card>
   <div class="flex flex-wrap items-center gap-2"><b>Ejercicio ${i+1}</b><span class="${C.src}">${ex.src}</span>
     <label class="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-sm text-stone-500 dark:text-zinc-400"><input type="checkbox" class="accent-emerald-600" data-key="${key}" ${done[key]?'checked':''}> Lo resolví</label></div>
   <div class="${C.prob}">\\[${ex.p}\\]</div>
   <div class="mt-2 grid grid-cols-3 gap-2 sm:flex">
    <button class="${C.btn}" data-toggle="hint">💡 Pista</button>
    <button class="${C.btn}" data-toggle="ans">🎯 Respuesta</button>
    <button class="${C.btn}" data-toggle="sol">🪜 Solución</button>
   </div>
   <div class="hidden ${C.reveal}" data-part="hint">${ex.hint}</div>
   <div class="hidden ${C.reveal}" data-part="ans">\\(\\displaystyle ${ex.r}\\)</div>
   <div class="hidden" data-part="sol">${stepsBlock(ex.steps, ex.r)}</div></div>`;
}
function lessonProgress(L){
  const tot = L.exercises.length;
  const n = L.exercises.filter((_,i)=>done[L.id+'-'+i]).length;
  return {n, tot};
}
const tile = (href, title, sub) => { const b = bloqueoLeccion(href); return b
  ? `<a href="${href}" class="block rounded-2xl border border-dashed border-stone-300 bg-stone-100/70 p-3.5 sm:p-4 opacity-70 dark:border-zinc-700 dark:bg-zinc-900/40"><b class="mb-1 block">${icono3D('🔒')} ${title}</b><small class="text-stone-500 dark:text-zinc-400">Primero termina: ${b.titulo}</small></a>`
  : tileAbierto(href, title, sub); };
const tileAbierto = (href, title, sub) =>
  `<a href="${href}" class="block rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-4 shadow-sm touch-manipulation active:scale-[0.98] transition-transform hover:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900"><b class="mb-1 block">${title}</b><small class="text-stone-500 dark:text-zinc-400">${sub}</small></a>`;

/* =====================================================================
   PÁGINAS
   ===================================================================== */
function pageIntegral(){
  const all = LESSONS.reduce((a,L)=>a+L.exercises.length,0);
  const ok = LESSONS.reduce((a,L)=>a+lessonProgress(L).n,0);
  return `
  <div class="text-sm text-stone-500 dark:text-zinc-400"><a href="#/aprender" class="underline">Inicio</a> › Sección 3</div>
  <h2 class="${C.h2}">∫ Cálculo integral</h2>
  <p class="${C.lead}">Una guía interactiva: cada tema empieza por lo más básico, luego ejemplos de nivel medio y difícil resueltos paso a paso (qué se hace y por qué), y termina con ejercicios para ti.</p>
  <div class="${C.card}"><b>Tu progreso:</b> ${ok} de ${all} ejercicios marcados como resueltos
   <div class="my-1.5 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800"><div class="h-full bg-emerald-500 transition-all" style="width:${all?100*ok/all:0}%"></div></div>
   <small class="${C.src}">Se guarda solo en este navegador.</small></div>

  <h3 class="${C.h3}">¿Cómo usar esta guía?</h3>
  <ol>
   <li>Si una sección menciona algo que no recuerdas, pulsa el botón azul de <b>Bases que usa</b>: te lleva a la <a href="#/bases">página de bases matemáticas</a>.</li>
   <li>En los ejemplos, intenta el problema primero y luego revela <b>un paso a la vez</b> con "Ver paso".</li>
   <li>En los ejercicios usa la pista solo si te atascas; luego compara con la respuesta.</li>
   <li>Al final, practica con la <a href="#/examen">solución del examen</a> y el <a href="#/estrategia">entrenador de estrategia</a>.</li>
  </ol>

  <h3 class="${C.h3}">Ruta de aprendizaje</h3>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
   ${tile('#/bases','0 · Bases matemáticas','Potencias, factorización, logaritmos, trigonometría, derivadas…')}
   ${LESSONS.map(L=>{const p=lessonProgress(L);return tile('#/'+L.id, `${L.n} · ${L.t}`, `${L.examples.length} ejemplos · ${p.n}/${p.tot} ejercicios`)}).join('')}
   ${tile('#/estrategia','8 · ¿Qué técnica uso?','Tabla de decisión y mini-quiz')}
   ${tile('#/examen','9 · Solución del examen','Los 6 ejercicios de la foto, paso a paso')}
  </div>

  <h3 class="${C.h3}">Fuentes</h3>
  <p>Los ejemplos marcados con <i>Stewart</i> provienen de los ejemplos resueltos de James Stewart, <i>Cálculo de una variable: Trascendentes tempranas</i> (7.ª/8.ª ed., Cengage Learning), secciones 5.4, 5.5, 7.1–7.4 y 7.8, y tienen el mismo resultado que el libro. La numeración de ejemplos puede variar ligeramente entre ediciones. Los ejercicios de práctica son del mismo tipo que los de esas secciones; todas las respuestas se verificaron derivando el resultado.</p>
  ${propsBloque('int','integrales')}`;
}

function pageBases(){
  return `<h2 class="${C.h2}">Bases matemáticas</h2>
  <p class="${C.lead}">Lo mínimo que necesitas dominar antes de integrar. Cada lección enlaza aquí directamente al tema que usa.</p>
  <div class="${C.card} flex flex-wrap gap-1.5"><b class="mr-1">Índice:</b> ${BASES.map(b=>`<a class="${C.chip}" href="#/bases/${b.id}">${b.t}</a>`).join(' ')}</div>
  ${BASES.map(b=>`<section id="b-${b.id}" class="scroll-mt-16"><h3 class="${C.h3}">${b.t}</h3>${b.html}
   <p class="${C.src}">Se usa en: ${LESSONS.filter(L=>L.bases.includes(b.id)).map(L=>`<a href="#/${L.id}">${L.short}</a>`).join(', ') || '—'}${EXAM.some(e=>e.bases.includes(b.id))?', <a href="#/examen">Examen</a>':''}</p></section>`).join('')}`;
}

function pageLesson(L){
  const i = LESSONS.indexOf(L), prev = LESSONS[i-1], next = LESSONS[i+1];
  const p = lessonProgress(L);
  const link = (href, txt) => `<a class="${C.btn}" href="${href}">${txt}</a>`;
  return `<h2 class="${C.h2}">${L.n}. ${L.t}</h2>
  ${basesChips(L.bases)}
  <h3 class="${C.h3}">Lo más básico</h3>${L.intro}
  <h3 class="${C.h3}">Ejemplos resueltos</h3>
  <p class="${C.src}">Intenta cada uno antes de revelar los pasos.</p>
  ${L.examples.map(exampleCard).join('')}
  <h3 id="ejercicios" class="${C.h3} scroll-mt-20">Ejercicios para ti <small class="${C.src}">(${p.n}/${p.tot} resueltos)</small></h3>
  ${L.exercises.map((ex,k)=>exerciseCard(ex, L.id+'-'+k, k)).join('')}
  <div class="mt-10 flex flex-wrap justify-between gap-2.5">
   ${prev ? link('#/'+prev.id, '◂ '+prev.short) : link('#/bases','◂ Bases')}
   ${next ? link('#/'+next.id, next.short+' ▸') : link('#/estrategia','¿Qué técnica uso? ▸')}
  </div>`;
}

function pageEstrategia(){
  return `<h2 class="${C.h2}">¿Qué técnica uso?</h2>
  <p class="${C.lead}">Antes de integrar, <b>mira la forma</b> del integrando. Esta tabla resume las pistas.</p>
  <div class="overflow-x-auto"><table>
   <tr><th>Si ves…</th><th>Prueba</th><th>Lección</th></tr>
   <tr><td>Algo que se simplifica a potencias / está en la tabla</td><td>Integral directa</td><td><a href="#/l1">1</a></td></tr>
   <tr><td>Una función "de adentro" cuya derivada aparece afuera</td><td>Sustitución</td><td><a href="#/l2">2</a></td></tr>
   <tr><td>Producto de tipos distintos (poli·exp, poli·trig, \\(\\ln\\), \\(\\arctan\\))</td><td>Por partes (LIATE)</td><td><a href="#/l3">3</a></td></tr>
   <tr><td>Potencias de \\(\\sin,\\cos,\\tan,\\sec\\)</td><td>Identidades + sustitución</td><td><a href="#/l4">4</a></td></tr>
   <tr><td>\\(\\sqrt{a^2-x^2},\\ \\sqrt{a^2+x^2},\\ \\sqrt{x^2-a^2}\\)</td><td>Sustitución trigonométrica</td><td><a href="#/l5">5</a></td></tr>
   <tr><td>Cociente de polinomios</td><td>Fracciones parciales (dividir si es impropia)</td><td><a href="#/l6">6</a></td></tr>
   <tr><td>Límite \\(\\pm\\infty\\) o el integrando explota</td><td>Impropia (límite)</td><td><a href="#/l7">7</a></td></tr>
  </table></div>
  <h3 class="${C.h3}">Mini-quiz: elige la técnica</h3>
  ${QUIZ.map((q,i)=>`<div class="${C.card}" data-q="${i}"><div class="${C.prob}">\\[${q.p}\\]</div>
    <div class="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">${QOPTS.map(o=>`<button class="${C.btn}" data-opt="${o}">${o}</button>`).join('')}</div>
    <div data-fb class="mt-2 text-[0.95rem]"></div></div>`).join('')}`;
}

function pageExamen(){
  return `<h2 class="${C.h2}">Solución del examen: Técnicas de integración</h2>
  <p class="${C.lead}">Enunciado: <i>"Evalúe las siguientes integrales utilizando el método que mejor crea conveniente, de entre aquellos tratados en clase."</i> Nota: hacer 5 de los 6 ejercicios.</p>
  <div class="${C.card}"><b>Resumen</b>
   <div class="mt-2 overflow-x-auto"><table><tr><th>#</th><th>Integral</th><th>Método</th><th>Resultado</th></tr>
   ${EXAM.map(e=>`<tr><td><a href="#/examen/${e.n}">${e.n}</a></td><td>\\(${e.n===6?R`f(x)=\frac{\int[f+xf']dx}{x}`:e.p}\\)</td><td>${e.method}</td><td>\\(${e.n===6?R`\text{demostrado}`:e.r}\\)</td></tr>`).join('')}
   </table></div></div>
  <div class="${C.note}"><b>Consejo para el examen:</b> si debes escoger 5 de 6, los más mecánicos son el 1, 3 y 4; el 2 exige manejar el límite; el 5 requiere el triángulo; el 6 es corto si reconoces la regla del producto.</div>
  ${EXAM.map(e=>`<section id="b-${e.n}" class="${C.card} scroll-mt-16">
   <h4 class="text-lg font-bold">Ejercicio ${e.n} · <span class="text-sm font-normal text-stone-500 dark:text-zinc-400">${e.method}</span></h4>
   <div class="${C.prob}">\\[${e.p}\\]</div>
   ${basesChips(e.bases)}
   <div class="my-2.5 flex flex-wrap items-center gap-1.5"><span class="mr-1 text-sm text-stone-500 dark:text-zinc-400">📘 Lección:</span><a class="${C.chip}" href="#/${e.lesson}">${LESSONS.find(L=>L.id===e.lesson).t}</a></div>
   <div class="${C.note}"><b>¿Cómo reconocer el método?</b> ${e.idea}</div>
   ${stepsBlock(e.steps, e.r)}</section>`).join('')}`;
}

/* =====================================================================
   NAVEGACIÓN / ROUTER (hash: #/pagina/subseccion)
   ===================================================================== */
/* =====================================================================
   PÁGINAS NUEVAS: inicio general, Fundamentos, Cálculo diferencial
   ===================================================================== */
/** Secciones de Aprender con temas y ejercicios de piezas (misma página para ambas). */
const SECCIONES_AP = {
  f: {lista:() => FUND, nombre:'Fundamentos', icon:'🧱', dict:'F', lead:'La base de todo el cálculo. Recórrelos en orden: cada tema usa los anteriores.', sig:['#/d', 'Cálculo diferencial ▸']},
  d: {lista:() => DIF, nombre:'Cálculo diferencial', icon:'📈', dict:'D', lead:'Límites, derivadas y sus aplicaciones. En los ejercicios con piezas se acepta cualquier forma equivalente de la respuesta.', sig:['#/integral', 'Cálculo integral ▸']},
};
const temaProgress = (T, sec = 'f') => { const tot=T.lego.length, n=T.lego.filter((_,i)=>done[`${sec}-${T.id}-${i}`]).length; return {n,tot}; };
const fundProgress = T => temaProgress(T, 'f');
const secTotales = sec => SECCIONES_AP[sec].lista().reduce((a,T)=>{ const p=temaProgress(T,sec); return {n:a.n+p.n, tot:a.tot+p.tot}; }, {n:0, tot:0});
const dictBtn = (cat, label='📖 Ver propiedades en el diccionario') =>
  `<button class="${C.chip}" data-dict-cat="${cat}">${label}</button>`;



/* Demostración animada: una ficha viaja de la bandeja al lienzo */
const DEMO_FICHAS = `
  <div class="relative h-44 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 dark:border-zinc-800 dark:bg-zinc-900" aria-hidden="true">
    <div class="absolute inset-x-3 top-3 flex h-16 items-center gap-1.5 rounded-xl border-2 border-dashed border-blue-400 bg-white px-2 dark:bg-zinc-950">
      <span class="flex h-10 min-w-10 items-center justify-center rounded-md border border-b-4 border-blue-500 bg-blue-50 px-2 font-serif text-lg text-blue-950 dark:bg-blue-950/60 dark:text-blue-100">2</span>
      <span class="flex h-10 items-start gap-0.5 rounded-md border border-b-4 border-violet-500 bg-violet-50 p-1 opacity-0 [animation:demo-aparece_4.5s_ease-in-out_infinite] dark:bg-violet-950/60">
        <span class="flex h-8 min-w-7 items-center justify-center self-end rounded border border-dashed border-stone-300 font-serif italic">x</span><span class="flex h-5 min-w-5 items-center justify-center rounded border border-dashed border-stone-300 text-xs">2</span></span>
      <span class="h-9 w-1 rounded-full bg-blue-500 [animation:demo-caret_4.5s_ease-in-out_infinite]"></span>
    </div>
    <div class="absolute inset-x-3 bottom-3 flex h-14 items-center justify-center gap-2 rounded-xl bg-white/70 dark:bg-zinc-800/70">
      <span class="flex h-11 min-w-11 items-center justify-center rounded-md border border-b-4 border-violet-500 bg-violet-50 px-2 text-sm dark:bg-violet-950/60">□<sup>□</sup></span>
      <span class="flex h-11 min-w-11 items-center justify-center rounded-md border border-b-4 border-emerald-500 bg-emerald-50 px-2 text-sm dark:bg-emerald-950/60">½</span>
      <span class="flex h-11 min-w-11 items-center justify-center rounded-md border border-b-4 border-violet-500 bg-violet-50 px-2 text-sm dark:bg-violet-950/60">sin(□)</span>
    </div>
    <span class="absolute left-[calc(50%-4.6rem)] top-[7.9rem] flex h-11 min-w-11 items-center justify-center rounded-md border border-b-4 border-violet-500 bg-violet-100 px-2 text-sm shadow-xl ring-2 ring-blue-400 [animation:demo-arrastre_4.5s_ease-in-out_infinite] dark:bg-violet-900">□<sup>□</sup></span>
    <span class="absolute left-[calc(50%-3.4rem)] top-[9.2rem] text-2xl [animation:demo-arrastre_4.5s_ease-in-out_infinite]">👆</span>
  </div>`;

/** Progreso de propiedades practicadas (3 ejercicios por carta). */
function propsProgreso(domId){
  const cs = DefensaAlgebraica.cartasPracticables(domId);
  return {cs, n:cs.reduce((a,c)=>a+[0,1,2].filter(i=>done[`p-${domId}-${c.id}-${i}`]).length,0), tot:cs.length*3};
}
function propsGrid(domId){
  const {cs} = propsProgreso(domId);
  return `<div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">${cs.map(c=>{ const n=[0,1,2].filter(i=>done[`p-${domId}-${c.id}-${i}`]).length;
    return `<a href="#/p/${domId}/${c.id}" class="flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-2.5 text-sm hover:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900"><span class="text-2xl">${c.icon}</span><span class="min-w-0 flex-1"><b class="block truncate">${c.name}</b><span class="text-xs text-stone-500 dark:text-zinc-400">${n===3?'✅ 3/3':`${n}/3 ejercicios`}</span></span></a>`; }).join('')}</div>`;
}
/** Bloque de cartas de propiedades de un área (va dentro de cada sección). */
function propsBloque(domId, titulo){
  const pp = propsProgreso(domId);
  return `<h3 class="${C.h3}">🃏 Cartas de propiedades · ${titulo}</h3><p class="${C.src}">Las mismas cartas del juego, con 3 ejercicios cada una: toca la carta, elige dónde aplicarla y escoge el resultado (${pp.n}/${pp.tot} hechos).</p>${propsGrid(domId)}`;
}
/** Portada de toda la aplicación: logo, tu progreso, los dos caminos y accesos rápidos. */
function pageLanding(){
  const R = rutaApp().resumen(), sig = R.tiers.find(t => !t.real), nivel = R.nivelReal + 1;
  const fAll = FUND.reduce((a, T) => a + T.lego.length, 0), fOk = FUND.reduce((a, T) => a + fundProgress(T).n, 0), dT = secTotales('d');
  const iAll = LESSONS.reduce((a, L) => a + L.exercises.length, 0), iOk = LESSONS.reduce((a, L) => a + lessonProgress(L).n, 0);
  const apOk = fOk + dT.n + iOk, apTot = fAll + dT.tot + iAll, pct = apTot ? Math.round(100 * apOk / apTot) : 0;
  const J = progresoJuego().data, partidas = J.partidas ?? 0, misiones = J.misiones ?? 0;
  const ic = (e, c) => icono3D(e, c);
  const acceso = (href, e, t, attr = '') => `<${href ? `a href="${href}"` : 'button'} ${attr} class="flex flex-col items-center gap-1 rounded-2xl border border-stone-200 bg-white/80 px-1 py-2.5 text-xs font-semibold shadow-sm transition-transform active:scale-95 dark:border-zinc-800 dark:bg-zinc-900/80">${ic(e, 'block h-8 w-8')}${t}</${href ? 'a' : 'button'}>`;
  return `<div class="mx-auto flex min-h-[calc(100dvh-9rem)] max-w-md flex-col justify-center gap-5 py-4">
    <div class="flex items-center gap-4">
      <div class="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.8rem] bg-gradient-to-br from-blue-600 via-violet-600 to-fuchsia-500 text-6xl font-black text-white shadow-2xl shadow-violet-500/30 [animation:flotar_3s_ease-in-out_infinite]">${ic('∫', 'block h-16 w-16')}</div>
      <div class="min-w-0"><h2 class="text-4xl font-black tracking-tight">Integrando</h2><p class="font-semibold text-violet-700 dark:text-violet-300">Cálculo paso a paso</p>
        <p class="text-sm text-stone-600 dark:text-zinc-400">Aprende con fichas y ponlo a prueba defendiendo la Tierra.</p></div></div>
    <a href="#/ruta" class="block rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm transition-transform active:scale-[0.98] dark:border-amber-800 dark:from-amber-950/40 dark:to-orange-950/30">
      <div class="flex items-center gap-3">${ic('🏆', 'block h-11 w-11')}<div class="min-w-0 flex-1"><b class="block">Tu ruta · nivel ${nivel} de ${R.total}</b>
        <span class="block truncate text-sm text-stone-600 dark:text-zinc-400">${sig ? `Siguiente: ${sig.titulo}` : '¡Ruta completa!'}</span></div><span class="text-2xl text-amber-600">›</span></div>
      <div data-barra3d="#f59e0b" class="mt-2 h-2.5 overflow-hidden rounded-full bg-amber-200 dark:bg-amber-900"><div class="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style="width:${Math.round(100 * nivel / R.total)}%"></div></div></a>
    <div class="grid grid-cols-2 gap-3">
      <a href="#/jugar" class="group relative flex min-h-48 flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-violet-900 to-fuchsia-800 p-4 text-white shadow-xl shadow-violet-900/30 transition-transform active:scale-[0.97]">
        <span class="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-fuchsia-400/20 blur-2xl"></span>${ic('🎮', 'block h-16 w-16')}
        <span><b class="block text-2xl leading-tight">Jugar</b><span class="block text-xs text-violet-200">Defensa Algebraica</span>
          <span class="mt-1 block text-[11px] text-violet-200/80">${partidas ? `${partidas} partidas · ${misiones} misiones` : 'Resuelve para dar energía'}</span></span></a>
      <a href="#/aprender" class="group relative flex min-h-48 flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-4 text-white shadow-xl shadow-blue-900/30 transition-transform active:scale-[0.97]">
        <span class="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-sky-300/30 blur-2xl"></span>${ic('📚', 'block h-16 w-16')}
        <span><b class="block text-2xl leading-tight">Aprender</b><span class="block text-xs text-sky-100">Fundamentos, derivadas e integrales</span>
          <span class="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/25"><span class="block h-full rounded-full bg-white" style="width:${pct}%"></span></span><span class="mt-0.5 block text-[11px] text-sky-100">${pct} % · ${apOk}/${apTot} ejercicios</span></span></a></div>
    <div class="grid grid-cols-4 gap-2">${acceso('#/ruta', '🗺️', 'Ruta')}${acceso('#/tutorial', '🧩', 'Tutorial')}${acceso(null, '📖', 'Diccionario', 'data-dict-open')}${acceso(null, '⚙️', 'Ajustes', 'data-ajustes')}</div>
  </div>`;
}
function pageHome(){
  const fAll = FUND.reduce((a,T)=>a+T.lego.length,0), fOk = FUND.reduce((a,T)=>a+fundProgress(T).n,0);
  const iAll = LESSONS.reduce((a,L)=>a+L.exercises.length,0), iOk = LESSONS.reduce((a,L)=>a+lessonProgress(L).n,0);
  const dT = secTotales('d');
  const R = rutaApp();
  const btn = (href, icon, title, sub, n, t, tono) => `<a href="${href}" class="group flex items-center gap-4 rounded-2xl border-2 border-stone-200 bg-white p-4 shadow-sm transition-transform hover:border-blue-500 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900">
      <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tono} text-3xl shadow-inner">${icono3D(icon, 'block h-11 w-11')}</span>
      <span class="min-w-0 flex-1"><b class="block text-lg leading-tight">${title}</b><span class="block text-sm text-stone-600 dark:text-zinc-400">${sub}</span>
        ${t != null ? `<span class="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800"><span class="block h-full bg-emerald-500" style="width:${t?100*n/t:0}%"></span></span><span class="text-xs text-stone-500 dark:text-zinc-400">${n}/${t}</span>` : ''}</span>
      <span class="text-2xl text-stone-400 group-hover:text-blue-600">›</span></a>`;
  return `
  <h2 class="${C.h2}">Matemáticas para el cálculo, paso a paso</h2>
  <p class="${C.lead}">Aprende con fichas, practica cada propiedad como carta y ponla a prueba en el juego. Todo avanza tu 🗺️ Ruta.</p>
  <div class="mt-4 grid gap-3 md:grid-cols-2">
    ${btn('#/tutorial','🧩','Tutorial', done['t-visto'] ? '✓ Visto · cómo se usa cada ficha y el menú, con animaciones.' : 'Cómo se usa cada ficha y el menú, con animaciones.', null, null, 'from-sky-200 to-blue-300 dark:from-sky-900 dark:to-blue-900')}
    ${btn('#/f','🧱','Fundamentos','Operaciones, potencias, raíces, logaritmos, trigonometría y ecuaciones.', fOk, fAll, 'from-amber-200 to-orange-300 dark:from-amber-900 dark:to-orange-900')}
    ${btn('#/d','📈','Cálculo diferencial','Límites, derivadas y sus aplicaciones.', dT.n, dT.tot, 'from-emerald-200 to-teal-300 dark:from-emerald-900 dark:to-teal-900')}
    ${btn('#/integral','∫','Cálculo integral','Técnicas de integración, impropias y el examen resuelto.', iOk, iAll, 'from-fuchsia-200 to-violet-300 dark:from-fuchsia-900 dark:to-violet-900')}
    <a href="#/jugar" class="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-indigo-950 to-violet-900 p-4 text-white shadow-sm transition-transform active:scale-[0.98] md:col-span-2">
      <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-3xl">${icono3D('🎮', 'block h-11 w-11')}</span>
      <span class="min-w-0 flex-1"><b class="block text-lg leading-tight">Juego: Defensa Algebraica</b><span class="block text-sm text-indigo-200">Usa las cartas de propiedades para dar energía a los soldados.</span></span><span class="text-2xl">›</span></a>
  </div>
  <a href="#/ruta" class="mt-4 flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-700 dark:bg-amber-950/30"><span class="text-2xl">${icono3D('🗺️', 'block h-9 w-9')}</span>
    <span class="flex-1"><b>Ruta · nivel ${R.nivelReal+1} de ${R.total}</b><span class="mt-1 block h-1.5 overflow-hidden rounded-full bg-amber-200 dark:bg-amber-900"><span class="block h-full bg-amber-500" style="width:${100*(R.nivelReal+1)/R.total}%"></span></span></span><span>›</span></a>`;
}
/* ---------- Tutorial: cómo se usa cada ficha (solo demostración animada, sin ejercicios) ----------
   Cada demostración muestra 3 momentos que se repiten en bucle, dibujados con las MISMAS
   fichas del lienzo real (zoneHTML), para que se vean igual que cuando practicas. */
const nz = (t, ...z) => ({t, z});
const hoja = t => ({t});
const T_ = s => treeOf(s);
/** Se arma al abrir el tutorial (usa treeOf, que se define después). */
const DEMOS = () => [
  {icon:'🔢', titulo:'Números', cat:'🔢 Números', fichas:['1','2','5'], txt:'En el menú solo hay cifras del 0 al 9. Las cifras que pones seguidas se JUNTAN en una sola ficha (1 y 2 → 12). Para cambiar un número, mantenlo presionado: arriba aparecen sus cifras y puedes moverlas o borrarlas. Los negativos llevan el signo − de ± Signos.',
    pasos:['Toca el 1: entra al lienzo.', 'Toca el 2: se junta con el 1 y queda la ficha 12.', 'Mantén presionado el 12 para editar sus cifras; para −5 pon «−» y luego 5.'],
    frames:[[hoja('1')], [hoja('12')], [hoja('12'), hoja('+'), hoja('-'), hoja('5')]]},
  {icon:'𝑥', titulo:'Variables', cat:'𝑥 Variables', fichas:['x','y'], txt:'Una variable es UNA letra. «3x» se arma con el número 3 y la letra x. Mayúsculas y minúsculas son variables distintas (a ≠ A). Con 🔤 Más letras tienes todo el abecedario.',
    pasos:['Toca la x.', 'Para 3x: primero el 3 (🔢) y luego la x.', 'Otras letras: y, A, t… cada una es distinta.'], frames:[T_('x'), T_('3x'), [hoja('3'), hoja('x'), hoja('+'), hoja('A')]]},
  {icon:'±', titulo:'Signos', cat:'± Signos', fichas:['+','-','·','=','≤'], txt:'Suma, resta, multiplicación, división, igual y desigualdades. Se ponen entre las otras fichas.',
    pasos:['Arma 2x.', 'Pon el signo + a la derecha.', 'Completa: 2x + 1 = 7.'], frames:[T_('2x'), T_('2x+'), T_('2x+1=7')]},
  {icon:'🧩', titulo:'Paréntesis', cat:'🧩 Agrupar', fichas:['par'], txt:'Los paréntesis son UN solo bloque (abre y cierra juntos): lo que pones adentro va junto. Si adentro hay varios monomios, mantenlo presionado para sacar uno; si delante hay un «−», al salir cambia de signo.',
    pasos:['Pon el 2 y el bloque ( ).', 'Adentro pon x + 1.', 'Con «−» delante: al sacar el +1 sale como −1.'], frames:[[hoja('2'), nz('par',[])], T_('2(x+1)'), T_('-(x+1)')]},
  {icon:'½', titulo:'Fracción', cat:'🧩 Agrupar', fichas:['frac'], txt:'Es un recuadro con DOS espacios: numerador arriba y denominador abajo. Toca un espacio para volverlo azul y llénalo.',
    pasos:['Toca la ficha de fracción: aparece vacía.', 'El espacio de arriba está azul: pon x + 1.', '⇥ Siguiente espacio y pon el 2 abajo.'],
    frames:[[nz('frac',[],[])], [nz('frac',T_('x+1'),[])], T_('frac{x+1}{2}')]},
  {icon:'xⁿ', titulo:'Potencia', cat:'ƒ Funciones', fichas:['pot'], txt:'Un recuadro con base (grande) y exponente (pequeño). Si la base tiene varias fichas (x + 1), se entiende entre paréntesis.',
    pasos:['Pon la ficha □^□.', 'En la base pon x.', 'En el exponente pon 2: queda x².'], frames:[[nz('pot',[],[])], [nz('pot',[hoja('x')],[])], T_('x^{2}')]},
  {icon:'√', titulo:'Raíz', cat:'ƒ Funciones', fichas:['sqrt'], txt:'Un recuadro con un espacio adentro: todo lo que pongas queda bajo la raíz.',
    pasos:['Pon la ficha √□.', 'Adentro pon x + 1.', 'Puede ir multiplicada: 2√(x + 1).'], frames:[[nz('sqrt',[])], T_('sqrt{x+1}'), T_('2sqrt{x+1}')]},
  {icon:'eˣ', titulo:'Exponencial', cat:'ƒ Funciones', fichas:['exp'], txt:'La base e ya viene puesta; tú llenas el exponente.',
    pasos:['Pon la ficha e^□.', 'En el exponente pon 2x.', 'Resultado: e²ˣ.'], frames:[[nz('exp',[])], [nz('exp',[hoja('2')])], T_('e^{2x}')]},
  {icon:'sin', titulo:'Seno, coseno y tangente', cat:'ƒ Funciones', fichas:['sin','cos','tan'], txt:'Cada función es un recuadro con su argumento adentro, entre paréntesis.',
    pasos:['Pon sin(□).', 'Adentro pon 2x.', 'Se combinan con signos: sin(2x) + cos(x).'], frames:[[nz('sin',[])], T_('sin(2x)'), T_('sin(2x)+cos(x)')]},
  {icon:'ln', titulo:'Logaritmos', cat:'ƒ Funciones', fichas:['ln','log'], txt:'ln(□) y log(□) también contienen a su argumento.',
    pasos:['Pon ln(□).', 'Adentro pon la potencia x².', 'Queda ln(x²).'], frames:[[nz('ln',[])], [nz('ln',[nz('pot',[hoja('x')],[])])], T_('ln(x^{2})')]},
  {icon:'lím', titulo:'Límite', cat:'ƒ Funciones', fichas:['lim'], txt:'Tres espacios: la variable, hacia dónde tiende y la expresión entre paréntesis. En el paso «reemplazar» recibes una copia y arrastras el número ENCIMA de cada x.',
    probar:1, pasos:['Pon lím: llena x y 2.', 'Escribe la expresión: x² + 3x.', 'Reemplazar: suelta el 2 sobre cada x.'],
    frames:[[nz('lim',[hoja('x')],[hoja('2')],[])], T_('lim_{x→2}(x^{2}+3x)'), [nz('lim',[hoja('x')],[hoja('2')],[nz('pot',[{t:'2',sub:true}],[hoja('2')]), hoja('+'), hoja('3'), {t:'2',sub:true}])]]},
  {icon:'d/dx', titulo:'Derivada', cat:'ƒ Funciones', fichas:['der'], txt:'El espacio pequeño es la variable (x) y entre corchetes va lo que se deriva.',
    pasos:['Pon d/d□[□].', 'En el espacio pequeño pon x.', 'Entre corchetes pon x³.'], frames:[[nz('der',[],[])], [nz('der',[hoja('x')],[])], T_('deriv{x}{x^{3}}')]},
  {icon:'∫', titulo:'Integrales', cat:'ƒ Funciones', fichas:['int','intd'], txt:'∫□d□: integrando y variable. La definida además tiene límite inferior (abajo) y superior (arriba).',
    pasos:['Pon ∫□d□.', 'Integrando 3x² y variable x.', 'Definida: abajo 0, arriba 1.'], frames:[[nz('int',[],[])], T_('integ{x}{3x^{2}}'), T_('integ_{0}^{1}{x}{3x^{2}}')]},
];
let DEMO_N = 0;
/** Lienzo de solo lectura dibujado con las fichas reales. */
function lienzoDemo(tree){
  const key = 'demo-' + (DEMO_N++); ZREG[key] = []; legoState(key).active = tree;
  return `<div class="pointer-events-none">${zoneHTML(key, tree, 0)}</div>`;
}
/** Lienzo de demostración con estado: ficha seleccionada (🗑 + bloques), editor de cifras, guía de propiedad o aviso extra. */
function lienzoGesto(tree, o = {}){
  const key = 'demo-' + (DEMO_N++); ZREG[key] = []; const st = legoState(key);
  Object.assign(st, {root:tree, active:tree, borrar:o.borrar ?? null, guia:o.guia ?? null, editNum:o.editar ? {node:o.editar, sel:null} : null});
  const lienzo = zoneHTML(key, tree, 0);
  return `<div class="pointer-events-none">${o.guia ? guiaHTML(st) : ''}${o.editar ? editorNumeroHTML(st) : ''}${lienzo}${o.panel ? bloquesHTML(key, st) : ''}${o.nota ? `<p class="mt-1.5 text-center text-xs font-semibold text-blue-700 dark:text-blue-300">${o.nota}</p>` : ''}</div>`;
}
const marcar = (n, demo) => Object.assign(n, {demo});
/** Demostraciones de los gestos del lienzo (tocar, mantener, juntar, bloques, propiedades). */
function GESTOS(){
  const t = s => { const z = treeOf(s); allZones(z).forEach(fusionarNumeros); return z; };   // ya agrupado en monomios
  const ej1 = t('3x+5'), ej2 = t('3x=12'), ej3 = t('3x+5x'), ej4 = t('3x-7'), ej5 = t('y=frac{5}{x^{2}}'), ej6 = t('3x+5=20');
  return [
    {icon:'🗑', titulo:'Tocar para eliminar', txt:'Un toque NO borra la ficha: aparece un 🗑 flotante encima. Si tocas el 🗑 se elimina; si tocas en otro lado, el 🗑 se va.',
      pasos:['Toca una ficha: se marca en rojo y aparece el 🗑 flotante.', 'Toca el 🗑 para eliminarla…', '…o toca en cualquier otro lado y el 🗑 desaparece.'],
      frames:[lienzoGesto(ej1, {borrar:ej1[0]}), lienzoGesto(t('5'), {nota:'Se eliminó 3x (con ↶ Deshacer vuelve).'}), lienzoGesto(t('3x+5'))]},
    {icon:'✏️', titulo:'Mantener para editar', txt:'Mantén presionado un monomio o un número: arriba aparecen sus fichas, cada cifra por separado. Puedes moverlas, borrarlas o arrastrarlas fuera. El 1 de x no se ve, pero aquí sí aparece.',
      pasos:['Mantén presionado −12x.', 'Arriba aparecen sus fichas: −, 1, 2, x. Toca una para moverla ◀ ▶ o borrarla.', 'Toca fuera del editor para cerrarlo.'],
      frames:[lienzoGesto(t('-12x')), (() => { const z = t('-12x'); return lienzoGesto(z, {editar:z[0]}); })(), lienzoGesto(t('-12x'))]},
    {icon:'＋', titulo:'Signo + automático', txt:'Cada monomio es una sola ficha (signo, número y letra). El de adelante no lleva «+»; si otro término va detrás, el «+» se pone solo, y si lo pasas adelante se quita.',
      pasos:['Arma 3x: el 3 y la x forman una ficha.', 'Pon el 5 detrás: aparece «+5» solo.', 'Arrastra el 5 adelante: queda 5 + 3x sin «+» al inicio.'],
      frames:[lienzoGesto(t('3x')), lienzoGesto(t('3x+5')), lienzoGesto(t('5+3x'))]},
    {icon:'🤝', titulo:'Juntar términos semejantes', txt:'Arrastra un término y MANTENLO encima de otro: el de abajo hace una seña. Al soltar, si son semejantes (misma letra y del mismo lado del =) se operan; si no, el término queda al lado y el de abajo vibra.',
      pasos:['Arrastra 5x y mantenlo sobre 3x: 3x hace una seña ✨.', 'Suelta: se operan → 8x.', 'Con −7 sobre 3x no se puede: queda al lado y 3x vibra.'],
      frames:[lienzoGesto([marcar(ej3[0], 'lego-sena'), marcar(ej3[1], 'demo-arrastre')]), lienzoGesto(t('8x')), lienzoGesto([marcar(ej4[0], 'demo-vibrar'), ej4[1]])]},
    {icon:'🧩', titulo:'Bloques: pasar a dividir', txt:'Al tocar un monomio, abajo aparecen sus bloques: el número con su signo y la letra. Si el monomio está solo de su lado del =, arrastra el número al otro lado y pasa a dividir todo.',
      pasos:['Toca 3x: abajo aparecen los bloques [3] [x].', 'Arrastra el bloque 3 al otro lado del =.', 'El 3 pasa a dividir: x = 12/3.'],
      frames:[lienzoGesto(ej2, {borrar:ej2[0], panel:true}), lienzoGesto(ej2, {borrar:ej2[0], panel:true, nota:'👆 Arrastra el [3] hasta después del 12'}), lienzoGesto(t('x=frac{12}{3}'))]},
    {icon:'xⁿ', titulo:'Potencia fuera de la fracción', txt:'Si una potencia está abajo de una fracción, sácala (arrástrala por su borde o usa el botón del panel): sube con exponente negativo y, si su base tiene varias fichas, entre paréntesis.',
      pasos:['Toca algo dentro de x²: aparece el aviso violeta.', 'Arrástrala fuera de la fracción o toca ⬆ Subir.', 'Resultado: y = 5x⁻².'],
      frames:[lienzoGesto(ej5, {borrar:ej5[2].z[1][0].z[0][0], panel:true}), lienzoGesto(ej5, {nota:'👆 Arrastra x² fuera de la fracción'}), lienzoGesto(t('y=5x^{-2}'))]},
    {icon:'🃏', titulo:'Propiedades guiadas', txt:'En 🃏 Propiedades, «Pasar al otro lado» y «Dividir ambos lados» te guían: primero tocas el término y luego eliges si pasa positivo o negativo (o con qué signo divide el número). Solo aparecen las propiedades que ya desbloqueaste en la Ruta.',
      pasos:['Elige 🃏 Pasar al otro lado y toca el +5.', '¿Pasa positivo o negativo? ➖ negativo: lo que suma pasa restando.', 'Queda 3x = 20 − 5.'],
      frames:[lienzoGesto(ej6, {guia:{carta:'mover', nodo:null}}), lienzoGesto(ej6, {guia:{carta:'mover', nodo:ej6[1]}}), lienzoGesto(t('3x=20-5'))]},
  ];
}
/** Tres momentos que se repiten (animación con keyframes). */
/** Escenas de una demostración: avanzan solas, pero se pueden pasar a mano (◀ ▶, deslizando) o pausar.
    `probar`: id de un mini‑ejercicio interactivo que se despliega debajo. */
function escenas(pasos, frames, probar = null){
  return `<div data-esc data-i="0" data-auto="1" class="touch-pan-y select-none">
    ${frames.map((f, i) => `<div data-f="${i}" class="${i ? 'hidden' : ''}">
      <div class="mb-2 flex items-start gap-2 text-sm"><span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">${i+1}</span><span>${pasos[i]}</span></div>
      ${typeof f === 'string' ? f : lienzoDemo(f)}</div>`).join('')}
    <div class="mt-2 flex items-center justify-center gap-1.5">
      <button data-esc-nav="-1" class="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white touch-manipulation dark:border-zinc-600 dark:bg-zinc-900" aria-label="Anterior">◀</button>
      ${frames.map((_, i) => `<span data-dot="${i}" class="h-1.5 w-7 rounded-full ${i ? 'bg-stone-300 dark:bg-zinc-700' : 'bg-blue-500'}"></span>`).join('')}
      <button data-esc-nav="1" class="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white touch-manipulation dark:border-zinc-600 dark:bg-zinc-900" aria-label="Siguiente">▶</button>
      <button data-esc-nav="pausa" class="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white touch-manipulation dark:border-zinc-600 dark:bg-zinc-900" aria-label="Pausar o reanudar">⏸</button>
    </div>
    ${probar != null ? `<button data-probar="${probar}" class="${C.btnP} mt-3 w-full">🧪 Probar yo</button>` : ''}
  </div>${probar != null ? `<div data-probar-zona="${probar}"></div>` : ''}`;
}
function irEscena(esc, i){
  const n = esc.querySelectorAll(':scope > [data-f]').length; i = (i + n) % n; esc.dataset.i = i;
  esc.querySelectorAll(':scope > [data-f]').forEach(f => f.classList.toggle('hidden', +f.dataset.f !== i));
  esc.querySelectorAll('[data-dot]').forEach(d => { const on = +d.dataset.dot === i; d.classList.toggle('bg-blue-500', on); d.classList.toggle('bg-stone-300', !on); d.classList.toggle('dark:bg-zinc-700', !on); });
}
setInterval(() => document.querySelectorAll('[data-esc][data-auto="1"]').forEach(e => irEscena(e, +e.dataset.i + 1)), 3200);
let ESC_X = null;
document.addEventListener('pointerdown', e => { const esc = e.target.closest('[data-esc]'); ESC_X = esc && !e.target.closest('button') ? {esc, x:e.clientX} : null; });
document.addEventListener('pointerup', e => { if (!ESC_X) return; const dx = e.clientX - ESC_X.x, esc = ESC_X.esc; ESC_X = null;
  if (Math.abs(dx) > 40){ esc.dataset.auto = '0'; esc.querySelector('[data-esc-nav="pausa"]').textContent = '▶︎'; irEscena(esc, +esc.dataset.i + (dx < 0 ? 1 : -1)); } });
/** Mini‑ejercicios «Probar»: exactamente lo que muestra la animación, nada más. Un paso por cada paso
    animado (misma instrucción, solo sus fichas), y cada paso sigue desde lo que armaste en el anterior. */
const piezasDeFrame = z => z.flatMap(n => n.z ? [n.t, ...n.z.flatMap(piezasDeFrame)] : [n.t]);
function practicaDeAnimacion(pasos, frames, hasta = frames.length - 1){
  const usados = frames.slice(0, hasta + 1).map((f, k) => ({f, k})).filter(({f}) => f.length);   // un lienzo vacío no se practica
  return {src:'Igual que la animación', p:ansTex(ser(frames[hasta])), steps:usados.map(({f, k}, j) => ({q:pasos[k], k:[...new Set(piezasDeFrame(f))], a:[ser(f)], orden:true, copia:j > 0,
    w:j === usados.length - 1 ? '¡Hiciste lo mismo que la animación!' : 'Bien: igual que en la animación.', h:pasos[k]}))};
}
function ejerciciosProbar(){
  const tutorial = DEMOS().map(d => practicaDeAnimacion(d.pasos, d.frames, d.probar ?? d.frames.length - 1));
  // Menú «tocar = fijar»: la animación pone □^□ con el menú fijo
  tutorial.push(practicaDeAnimacion(['Toca ƒ Funciones (el menú queda fijo 📌) y pon la ficha □^□.'], [[nz('pot', [], [])]]));
  return tutorial;
}
/** Bienvenida: 5 pasos prácticos la primera vez que se abre la app (después no vuelve a salir). */
function ejerciciosInicio(){
  const P = [['Toca la ficha 5 para ponerla en el lienzo.', '5', ['5']], ['Toca el 1 y luego el 2: las cifras seguidas se juntan en 12.', '12', ['1', '2']],
    ['Arma 3x: primero el número 3 y luego la letra x.', '3x', ['3', 'x']], ['Usa los signos: arma 2x + 1 = 7.', '2x+1=7', ['2', 'x', '+', '1', '=', '7']],
    ['Pon la ficha de fracción y llénala: x arriba y 2 abajo (toca un espacio para elegirlo).', 'frac{x}{2}', ['frac', 'x', '2']]];
  return [{src:'Bienvenida', p:'\\text{5 pasos para empezar}', steps:P.map(([q, a, k], i) => ({q, a:[a], k, orden:true, w:['Las fichas se tocan o se arrastran al lienzo.', 'Cifras seguidas = un solo número.', 'Un número junto a una letra es un coeficiente.', 'Los signos van entre las fichas.', 'Las fichas con espacios guardan otras fichas adentro.'][i], h:q}))}];
}
function mostrarBienvenida(){
  if (store.get('bienvenida-vista')) return;
  const key = 'z-inicio-0', capa = document.createElement('div');
  capa.id = 'bienvenida'; capa.className = 'fixed inset-0 z-[75] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4';
  capa.innerHTML = `<div class="max-h-[100dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-stone-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl dark:bg-zinc-950">
    <div class="flex items-center gap-2"><b class="flex-1 text-xl">${icono3D('🧩')} ¡Bienvenido! 5 pasos prácticos</b><button data-bienvenida="saltar" class="${C.btn} !min-h-9 !px-3 !text-xs">Omitir</button></div>
    <p class="mt-1 text-sm text-stone-600 dark:text-zinc-400">En cada paso primero <b>mira cómo se hace</b> y luego hazlo tú: te iremos señalando qué tocar. Solo se muestra esta vez.</p>
    <div data-video class="mt-2"></div>
    <div class="mt-2">${legoCard(legoEx(key), key, 0)}</div>
    <button data-bienvenida="listo" class="${C.btnP} mt-3 w-full" style="display:none">🎉 ¡Listo! Empezar</button></div>`;
  document.body.appendChild(capa); delete LEGO[key]; renderMath(capa); renderLego(key);
  const video = capa.querySelector('[data-video]'), card = capa.querySelector(`[data-lego="${key}"]`);
  let pasoVisto = -1, viendo = false;
  // Cada paso: primero el video corto (la respuesta armándose ficha por ficha), luego «¡Ahora tú!» y la guía sobre las fichas reales
  const mostrarVideo = i => { const s = legoEx(key).steps[i]; viendo = true; card.classList.add('hidden');
    video.innerHTML = `<div class="rounded-2xl border-2 border-violet-400 bg-violet-50 p-3 dark:border-violet-700 dark:bg-violet-950/40"><b class="text-sm">▶ Paso ${i + 1} de 5 · mira cómo se hace</b><p class="mb-2 text-sm">${s.q}</p>${videoGuia(s.a[0])}
      <button data-ahora class="${C.btnP} mt-3 w-full">¡Ahora tú! ▸</button></div>`; renderMath(video); };
  const cerrar = () => { store.set('bienvenida-vista', true); Guia.detener(); capa.remove(); delete LEGO_HOOKS[key]; };
  const vigilar = setInterval(() => { if (!capa.isConnected) return clearInterval(vigilar);
    const st = legoState(key), total = legoEx(key).steps.length;
    if (st.step >= total){ video.innerHTML = ''; card.classList.remove('hidden'); capa.querySelector('[data-bienvenida="listo"]').style.display = ''; store.set('bienvenida-vista', true); return; }
    if (st.step !== pasoVisto){ pasoVisto = st.step; Guia.detener(); mostrarVideo(st.step); } }, 300);
  capa.addEventListener('click', e => {
    if (e.target.closest('[data-ahora]')){ viendo = false; video.innerHTML = ''; card.classList.remove('hidden'); card.scrollIntoView({block:'start', behavior:'smooth'}); return Guia.iniciar(key); }
    if (e.target.closest('[data-bienvenida]')) cerrar(); });
}
/** Bandeja falsa (igual a la real) para la demostración del menú. */
function menuDemo(modo){
  const cats = [['🔢','Números'],['𝑥','Variables'],['±','Signos'],['ƒ','Funciones'],['🧩','Agrupar']];
  const barra = on => `<div class="mt-2 grid grid-cols-5 gap-1">${cats.map(([ic,n])=>`<span class="relative flex min-h-12 flex-col items-center justify-center rounded-xl border text-[10px] ${n===on?'border-blue-600 bg-blue-600 text-white':'border-stone-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'}"><span class="text-base leading-none">${ic}</span>${n}${n===on&&modo==='mantener'?'<span class="absolute inset-0 animate-ping rounded-xl ring-4 ring-blue-400/60"></span>':''}${n===on?'<span class="absolute -bottom-3 right-1 text-xl">👆</span>':''}</span>`).join('')}</div>`;
  const bandeja = (titulo, fichas, sel) => `<div class="rounded-xl bg-stone-100 p-2 dark:bg-zinc-800/60"><div class="mb-1 text-xs font-semibold text-stone-500 dark:text-zinc-400">${titulo}</div><div class="flex flex-wrap justify-center gap-1.5">${fichas.map(t=>`<span class="${t===sel?'ring-4 ring-blue-400 rounded-md':''}">${bankPiece('demo', t)}</span>`).join('')}</div></div>`;
  const vacia = `<div class="flex min-h-[4.5rem] items-center justify-center rounded-xl bg-stone-100 px-2 text-center text-xs text-stone-500 dark:bg-zinc-800/60 dark:text-zinc-400">Bandeja cerrada</div>`;
  const marco = (lienzo, tray, on) => `<div class="pointer-events-none">${lienzoDemo(lienzo)}<div class="mt-2">${tray}</div>${barra(on)}</div>`;
  return modo === 'fijar'
    ? escenas(['Toque corto en ƒ Funciones.', 'El menú queda FIJO 📌: toca fichas o arrástralas, todas las que quieras.', 'Para cerrarlo toca otra vez la categoría o ✕.'],
        [marco([], vacia, 'Funciones'), marco([nz('pot',[],[])], bandeja('ƒ Funciones · 📌 fijado', ['pot','sqrt','sin','ln'], 'pot'), ''), marco([nz('pot',[],[])], vacia, '')], DEMOS().length)
    : escenas(['MANTÉN presionado 🔢 Números: el menú se asoma.', 'Sin soltar, desliza el dedo a la ficha y llévala al lienzo.', 'Al soltar, la ficha queda en el lienzo y el menú se cierra solo.'],
        [marco([], bandeja('🔢 Números · suelta para cerrar', ['2','5','7'], null), 'Números'), marco([], bandeja('🔢 Números · suelta para cerrar', ['2','5','7'], '5'), 'Números'), marco([hoja('5')], vacia, '')]);
}
function pageTutorial(){
  DEMO_N = 0;
  if (!done['t-visto']){ done['t-visto'] = true; store.set('done', done); }
  const tarjeta = (cab, cuerpo) => `<div class="${C.card} overflow-hidden">${cab}${cuerpo}</div>`;
  const demos = DEMOS(), indice = demos.map((d,i)=>`<a href="#/tutorial" data-ir="demo-${i}" class="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900">${icono3D(d.icon)} ${d.titulo}</a>`).join(' ');
  return (`<div class="text-sm text-stone-500 dark:text-zinc-400"><a href="#/aprender" class="underline">Inicio</a> › Tutorial</div>
  <h2 class="${C.h2}">🧩 Tutorial: cómo se usa cada ficha</h2>
  <p class="${C.lead}">Aquí no hay ejercicios: solo mira cómo funciona cada ficha. Las animaciones se repiten solas. Después practica en <a href="#/f" class="underline">Fundamentos</a>.</p>
  ${DEMO_FICHAS}
  <h3 class="${C.h3}">📌 El menú de categorías: tocar o mantener</h3>
  <div class="grid gap-3 md:grid-cols-2">
    ${tarjeta(`<b>Tocar = fijar el menú</b><p class="${C.src}">Para poner varias fichas seguidas.</p>`, menuDemo('fijar'))}
    ${tarjeta(`<b>Mantener presionado = asomar</b><p class="${C.src}">Para sacar una sola ficha rápido.</p>`, menuDemo('mantener'))}
  </div>
  <h3 class="${C.h3}">✋ Mover, quitar y el espacio azul</h3>
  ${tarjeta('', escenas(['Arrastra una ficha: la barra azul muestra dónde caerá. Para quitarla, tócala y usa el 🗑, o suéltala fuera del lienzo.', 'El espacio con borde azul es el activo: ahí entran las fichas que tocas. Toca otro espacio para elegirlo.', '⇥ Siguiente espacio salta al próximo; ⤴ Salir vuelve al de afuera del recuadro.'],
      [lienzoDemo([hoja('2'), hoja('x'), hoja('+'), hoja('1')]), lienzoDemo([nz('frac',[hoja('x')],[])]), lienzoDemo([nz('frac',[hoja('x')],[hoja('2')]), hoja('+')])]))}
  <h3 class="${C.h3}">🪄 Gestos del lienzo</h3>
  <p class="${C.src}">Tocar, mantener, juntar y pasar al otro lado: lo que puedes hacer con las fichas que ya están en el lienzo.</p>
  <div class="mt-3 grid gap-3 md:grid-cols-2">${GESTOS().map(g=>tarjeta(`<div class="flex items-center gap-2"><span class="flex h-10 min-w-10 items-center justify-center rounded-xl bg-amber-100 px-2 font-serif text-lg dark:bg-amber-950">${icono3D(g.icon, 'block h-8 w-8')}</span><b class="text-lg">${g.titulo}</b></div>
      <p class="!my-2 text-sm">${g.txt}</p>`, escenas(g.pasos, g.frames))).join('')}</div>
  <h3 class="${C.h3}">🧱 Ficha por ficha</h3>
  <div class="flex flex-wrap gap-1.5">${indice}</div>
  <div class="mt-3 grid gap-3 md:grid-cols-2">${demos.map((d,i)=>tarjeta(`<div id="demo-${i}" class="flex items-center gap-2"><span class="flex h-10 min-w-10 items-center justify-center rounded-xl bg-violet-100 px-2 font-serif text-lg dark:bg-violet-950">${icono3D(d.icon, 'block h-8 w-8')}</span><b class="text-lg">${d.titulo}</b><span class="ml-auto text-xs text-stone-500 dark:text-zinc-400">${d.cat}</span></div>
      <p class="!my-2 text-sm">${d.txt}</p><div class="pointer-events-none mb-3 flex flex-wrap gap-1.5">${d.fichas.map(t=>bankPiece('demo', t)).join('')}</div>`, escenas(d.pasos, d.frames, i))).join('')}</div>
  <h3 class="${C.h3}">✔ Verificar, pista y propiedades</h3>
  ${tarjeta('', `<ul class="text-sm"><li><b>✔ Verificar</b> revisa el paso; si está bien pasas al siguiente.</li><li><b>💡 Pista</b> y <b>👁 Solución</b> ayudan si te atascas.</li><li><b>↶ Deshacer</b> y <b>🗑 Limpiar</b> corrigen el lienzo.</li><li><b>🃏 Propiedades</b> (en Fundamentos) aplica una carta del juego a lo que armaste.</li><li><b>💻 En computador</b>: arrastra con el mouse; «mantener presionado» es dejar el clic apretado. <kbd>Supr</kbd> elimina la ficha marcada con 🗑 y <kbd>Esc</kbd> la desmarca o cierra el editor.</li><li><b>📝 Tu proceso hasta aquí</b>: arriba del lienzo ves los pasos que ya verificaste; con <b>📋 Empezar desde mi paso anterior</b> copias el último.</li></ul>`)}
  <h3 class="${C.h3}">🗺️ La Ruta y las lecciones</h3>
  ${tarjeta('', `<ul class="text-sm"><li>Las lecciones se abren <b>en orden</b>: para entrar a la siguiente, termina los ejercicios con piezas de la anterior (🔒 = bloqueada).</li><li>En la 🗺️ Ruta, <b>toca un nivel</b>: si ya puedes, te lleva directo a sus ejercicios; si no, te muestra los módulos que te faltan y el botón <b>📚 Empezar a estudiar</b>.</li><li>Cada tema también desbloquea cosas del juego: problemas, cartas y los <b>Comandantes</b> de cada mundo.</li></ul>`)}
  <div class="mt-8 flex justify-end"><a class="${C.btnP}" href="#/f">Practicar en Fundamentos ▸</a></div>`).replace(/(<h[23] class="[^"]*">)(\S+)\s/g, (m, h, e) => nombreIcono3D(e) || /\p{Extended_Pictographic}/u.test(e) ? `${h}${icono3D(e)} ` : m);   // títulos con icono 3D
}

/* ---------- Propiedades: índice por área y práctica de una carta ---------- */
const DOM_NOMBRE = {fund:['🧱','Fundamentos'], alg:['🔺','Potencias, raíces, logaritmos y trigonometría'], dif:['📈','Cálculo diferencial'], int:['∫','Cálculo integral']};
function pagePropsIndex(domId){
  const [ic, n] = DOM_NOMBRE[domId], pp = propsProgreso(domId);
  return `<div class="text-sm text-stone-500 dark:text-zinc-400"><a href="#/aprender" class="underline">Inicio</a> › Propiedades</div>
  <h2 class="${C.h2}">🃏 Propiedades · ${ic} ${n}</h2>
  <p class="${C.lead}">Cada propiedad es una carta del juego. Hay 3 ejercicios por carta (${pp.n}/${pp.tot} hechos). Cada ejercicio resuelto suma XP en la 🗺️ Ruta.</p>
  ${propsGrid(domId)}
  <div class="mt-4 flex flex-wrap gap-2">${Object.keys(DOM_NOMBRE).filter(d=>d!==domId).map(d=>`<a class="${C.btn}" href="#/p/${d}">${DOM_NOMBRE[d][0]} ${DOM_NOMBRE[d][1]}</a>`).join('')}</div>`;
}
function pageProp(domId, cartaId){
  const c = DefensaAlgebraica.cartasPracticables(domId).find(x=>x.id===cartaId);
  if (!c) return pagePropsIndex(domId);
  const cs = DefensaAlgebraica.cartasPracticables(domId), i = cs.findIndex(x=>x.id===cartaId), prev = cs[i-1], next = cs[i+1];
  return `<div class="text-sm text-stone-500 dark:text-zinc-400"><a href="#/p/${domId}" class="underline">Propiedades · ${DOM_NOMBRE[domId][1]}</a> › ${i+1} de ${cs.length}</div>
  <h2 class="${C.h2}">${c.icon} ${c.name}</h2>
  <p class="${C.lead}">${c.desc}. ${c.pista}</p>
  ${c.formula ? `<div class="${C.prob}">\\[${c.formula}\\]</div>` : ''}
  <div class="${C.card}"><b>¿Cómo se practica?</b><ol class="text-sm"><li>Toca <b>Usar</b> (es como jugar la carta).</li><li>Si la propiedad se puede usar en varias partes, se marcan en colores: toca dónde aplicarla.</li><li>Elige cuál es el resultado correcto.</li></ol></div>
  <div data-practica></div>
  <div class="mt-8 flex flex-wrap justify-between gap-2.5">
    ${prev ? `<a class="${C.btn}" href="#/p/${domId}/${prev.id}">◂ ${prev.name}</a>` : `<a class="${C.btn}" href="#/p/${domId}">◂ Todas</a>`}
    ${next ? `<a class="${C.btn}" href="#/p/${domId}/${next.id}">${next.name} ▸</a>` : `<a class="${C.btn}" href="#/jugar">🎮 Al juego ▸</a>`}
  </div>`;
}
function montarPractica(domId, cartaId){
  const host = document.querySelector('[data-practica]'); if (!host) return;
  new DefensaAlgebraica.PracticaPropiedades(host, {domId, cartaId,
    isDone: k => !!done[k],
    onDone: k => { if (!done[k]){ done[k] = true; store.set('done', done); buildNavFromHash(); } }}).render();
}

/* ---------- Ruta (pase de batalla) ---------- */
/** Lecciones en orden (Fundamentos → Diferencial → Integral): una lección se abre solo si las anteriores están hechas. */
const ES_LECCION = /^#\/(f|d)\/[^/]+$|^#\/l\d+$/;
let BLOQ_CACHE = null;
function bloqueosLecciones(){
  if (BLOQ_CACHE) return BLOQ_CACHE;
  const R = rutaApp(), m = new Map();
  if (!R.dev){
    let pendiente = null;
    for (const h of R.hitos()) if (ES_LECCION.test(h.href ?? '')){ if (pendiente) m.set(h.href, pendiente); else if (!R.cumplido(h)) pendiente = h; }
  }
  setTimeout(() => { BLOQ_CACHE = null; });   // se recalcula en cada navegación / cambio
  return BLOQ_CACHE = m;
}
/** Lección pendiente que bloquea `href` (o null si está abierta). */
const bloqueoLeccion = href => bloqueosLecciones().get(href) ?? null;
/** Módulos de la ruta que faltan antes del nivel `idx` (solo lecciones si `soloLecciones`). */
function pendientesAntes(idx, soloLecciones){
  const R = rutaApp(); if (R.dev) return [];
  return R.hitos().slice(1, idx).filter(h => !h.logro && (!soloLecciones || ES_LECCION.test(h.href ?? '')) && !R.cumplido(h));
}
function pageFaltan(pend, destino){
  const R = rutaApp();
  return `<div class="mx-auto max-w-md py-8 text-center">
    <div class="text-6xl">🔒</div>
    <h2 class="${C.h2}">Aún no puedes ver esto</h2>
    <p class="${C.lead}">${destino ? `Para llegar a <b>${destino}</b>, t` : 'T'}e falta ver ${pend.length === 1 ? 'este módulo' : `estos ${pend.length} módulos`}:</p>
    <div class="mt-4 flex flex-wrap justify-center gap-2"><button data-estudiar="${pend[0].href ?? '#/ruta'}" class="${C.btnP}">📚 Empezar a estudiar</button><a class="${C.btn}" href="#/ruta">🗺️ Ver la ruta</a></div>
    <ol class="mt-4 space-y-2 text-left !list-none !pl-0">${pend.map((h, k) => `<li><button data-estudiar="${h.href ?? '#/ruta'}" class="flex w-full items-center gap-3 rounded-xl border p-2.5 text-left text-inherit ${k ? 'border-stone-200 bg-white dark:border-zinc-800 dark:bg-zinc-900' : 'border-blue-400 bg-blue-50 ring-2 ring-blue-300 dark:bg-blue-950/40'}">
      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-black dark:bg-zinc-800">${h.i + 1}</span>
      <span class="min-w-0 flex-1"><b class="block text-sm">${h.icon} ${h.titulo}</b>${h.req.map(r => { const [a, n] = R.avance(r); return `<small class="text-stone-500 dark:text-zinc-400">${a}/${n} ${r.txt}</small>`; }).join(' ')}</span><span class="text-blue-600">▸</span></button></li>`).join('')}</ol></div>`;
}
const IR_EJ = /^#\/(f|d)\/[^/]+$|^#\/l\d+$/;
/** Ir a un módulo: si es una lección, directo a sus ejercicios. */
function irAModulo(href, reemplazar){ if (IR_EJ.test(href)) PENDIENTE_EJ = true; if (location.hash === href) route(); else if (reemplazar) location.replace(href); else location.hash = href; }
let PENDIENTE_EJ = false;
function rutaApp(){ return new DefensaAlgebraica.Ruta(new DefensaAlgebraica.Progreso(new DefensaAlgebraica.SaveRepository()), () => Object.keys(done).filter(k => done[k])); }
function pageRuta(){
  const R = rutaApp().resumen(), sig = R.tiers.find(t=>!t.real);
  const TONO = {problema:'bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200', carta:'bg-violet-100 text-violet-900 dark:bg-violet-950/60 dark:text-violet-200', dificultad:'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200', bonus:'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200', puntos:'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200', jefe:'bg-orange-100 text-orange-900 dark:bg-orange-950/60 dark:text-orange-200'};
  const ETQ = {problema:'Problema', carta:'Carta', dificultad:'Dificultad', bonus:'Bonificador', puntos:'Premio', jefe:'Enemigo'};
  const hechos = R.nivelReal + 1;
  return `<h2 class="${C.h2}">${icono3D('🗺️')} Ruta de progreso</h2>
  <p class="${C.lead}">Un nivel por cada paso de tu aprendizaje: el tutorial, cada tema de Fundamentos, Diferencial e Integral, las cartas de propiedades y logros del juego. Cada nivel cumplido desbloquea contenido del juego. Las lecciones se abren en orden: para pasar a la siguiente, termina la anterior.</p>
  ${R.dev ? `<div class="${C.card} border-amber-400 bg-amber-50 dark:bg-amber-950/30">🧪 <b>Modo desarrollo activo</b>: en el juego todo está desbloqueado (también el catálogo). Se cambia en ⚙️ Configuración. Abajo ves tu avance real.</div>` : ''}
  <div class="${C.card} flex items-center gap-4">
    <div class="flex h-20 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 font-black text-white shadow">${icono3D('🏆', 'block h-8 w-8')}<span class="text-[10px] uppercase">Nivel</span><span class="text-xl leading-none">${hechos}</span></div>
    <div class="min-w-0 flex-1"><b>${hechos} de ${R.total} niveles</b> <span class="text-sm text-stone-500 dark:text-zinc-400">· ${R.xp} XP</span>
      <div data-barra3d="#f59e0b" class="mt-1.5 h-3 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800"><div class="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style="width:${100*hechos/R.total}%"></div></div>
      <small class="text-stone-500 dark:text-zinc-400">${sig ? `Siguiente: <a class="underline" href="#/ruta/${sig.i}">${sig.titulo}</a>` : '¡Ruta completa!'}</small></div></div>
  <ol class="relative mt-6 !list-none border-l-4 border-stone-200 !pl-6 dark:border-zinc-800">
    ${R.tiers.map(t=>`<li class="relative mb-4" id="ruta-${t.i}">
      <span class="absolute -left-[2.35rem] top-1 flex h-8 w-8 items-center justify-center rounded-full border-4 text-xs font-black ${t.real?'border-amber-400 bg-amber-300 text-amber-950':'border-stone-200 bg-white text-stone-500 dark:border-zinc-800 dark:bg-zinc-900'}">${t.real?icono3D('🏅', 'block h-6 w-6'):t.i+1}</span>
      <div class="rounded-2xl border p-3 ${t.real?'border-amber-300 bg-white dark:border-amber-700 dark:bg-zinc-900':'border-stone-200 bg-stone-100/60 dark:border-zinc-800 dark:bg-zinc-900/40'} ${sig && sig.i===t.i?'ring-2 ring-blue-400':''}">
        <div class="flex items-start justify-between gap-2"><a href="#/ruta/${t.i}" class="font-bold">${icono3D(t.icon)} Nivel ${t.i+1} · ${t.titulo}${t.titulo2?` <span class="text-amber-600">${t.titulo2}</span>`:''}</a><span class="shrink-0 text-xs text-stone-500 dark:text-zinc-400">${icono3D(t.real?'✅':'🔒', 'inline-block h-6 w-6')}</span></div>
        ${t.req.map(r=>`<div class="mt-1.5 flex items-center gap-2 text-xs text-stone-600 dark:text-zinc-400"><span data-barra3d="#10b981" class="h-1.5 w-24 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800"><span class="block h-full bg-emerald-500" style="width:${100*r.a/r.b}%"></span></span>${r.a}/${r.b} ${r.txt}</div>`).join('')}
        ${t.premios.length ? `<div class="mt-2 flex flex-wrap gap-1.5">${t.premios.map(p=>`<span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${TONO[p.tipo]}"><span>${icono3D(p.icon)}</span><span class="opacity-70">${ETQ[p.tipo]}:</span> ${p.nombre}${p.reclamable?` <button data-reclamar="${t.i}" class="ml-1 rounded-full bg-emerald-600 px-2 text-white">Reclamar</button>`:p.reclamado?' ✓':''}</span>`).join('')}</div>` : ''}</div></li>`).join('')}
  </ol>
  <div class="mt-2 flex flex-wrap gap-2"><a class="${C.btnP}" href="#/jugar">🎮 Ir al juego</a><a class="${C.btn}" href="#/aprender">🏠 Inicio</a></div>`;
}

function pageSecIndex(sec){
  const S = SECCIONES_AP[sec], L = S.lista();
  return `<h2 class="${C.h2}">${icono3D(S.icon)} ${S.nombre}</h2>
  <p class="${C.lead}">${S.lead}</p>
  <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
   ${L.map((T,i)=>{const p=temaProgress(T,sec);return tile(`#/${sec}/${T.id}`, `${i+1} · ${T.t}`, `${T.examples.length} ejemplos · ${p.n}/${p.tot} ejercicios con piezas`)}).join('')}
  </div>
  ${sec==='f' ? propsBloque('fund','despejar y simplificar') + propsBloque('alg','potencias, raíces, logaritmos y trigonometría') : propsBloque('dif','derivadas')}
  <div class="${C.card} mt-6">📖 Las propiedades de esta sección están en el <button class="text-blue-700 underline dark:text-blue-300" data-dict-sec="${S.dict}">Diccionario de propiedades</button>.</div>`;
}
function pageSecTopic(sec, T){
  const S = SECCIONES_AP[sec], L = S.lista(), i = L.indexOf(T), prev = L[i-1], next = L[i+1];
  const link = (href, txt) => `<a class="${C.btn}" href="${href}">${txt}</a>`;
  const p = temaProgress(T, sec);
  return `<div class="text-sm text-stone-500 dark:text-zinc-400"><a href="#/${sec}" class="underline">${S.nombre}</a> › Tema ${i+1} de ${L.length}</div>
  <h2 class="${C.h2}">${i+1}. ${T.t}</h2>
  <div class="my-2.5 flex flex-wrap gap-1.5">${dictBtn(T.dict)}</div>
  <h3 class="${C.h3}">Lo más básico</h3>${T.intro}
  <h3 class="${C.h3}">Ejemplos resueltos</h3>
  <p class="${C.src}">Intenta cada uno antes de revelar los pasos.</p>
  ${T.examples.map(exampleCard).join('')}
  <h3 id="ejercicios" class="${C.h3} scroll-mt-20">Ejercicios con piezas <small class="${C.src}">(${p.n}/${p.tot} resueltos)</small></h3>
  <p class="${C.src}">Arma cada paso en el lienzo con las piezas de las categorías y pulsa Verificar.</p>
  ${T.lego.map((ex,k)=>legoCard(ex, `${sec}-${T.id}-${k}`, k)).join('')}
  <div class="mt-10 flex flex-wrap justify-between gap-2.5">
   ${prev ? link(`#/${sec}/${prev.id}`, '◂ '+prev.short) : link(`#/${sec}`, '◂ '+S.nombre)}
   ${next ? link(`#/${sec}/${next.id}`, next.short+' ▸') : link(S.sig[0], S.sig[1])}
  </div>`;
}

/* =====================================================================
   DICCIONARIO (modal)
   ===================================================================== */
const DSTATE = {sec:'all', q:'', cat:null};
const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function openDict(opts={}){
  Object.assign(DSTATE, {sec:'all', q:'', cat:null}, opts);
  const m = document.getElementById('dict');
  m.classList.remove('hidden'); m.classList.add('flex');
  document.body.classList.add('overflow-hidden');
  const inp = document.getElementById('dictQ'); inp.value = DSTATE.q;
  renderDict();
  setTimeout(()=>inp.focus(), 30);
}
function closeDict(){
  const m = document.getElementById('dict');
  m.classList.add('hidden'); m.classList.remove('flex');
  document.body.classList.remove('overflow-hidden');
}
function renderDict(){
  const q = fold(DSTATE.q.trim());
  const items = DICT.filter(d => (DSTATE.sec==='all' || d.s===DSTATE.sec) && (!DSTATE.cat || d.c===DSTATE.cat) &&
    (!q || fold(d.n+' '+d.c+' '+SECCIONES[d.s]).includes(q)));
  const tabs = [['all','Todas'], ...Object.entries(SECCIONES)];
  document.getElementById('dictTabs').innerHTML = tabs.map(([k,l])=>
    `<button data-dsec="${k}" class="shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm touch-manipulation ${DSTATE.sec===k&&!DSTATE.cat?'border-blue-600 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-400 dark:text-zinc-950':'border-stone-300 hover:border-blue-500 dark:border-zinc-700'}">${l}</button>`).join('') +
    (DSTATE.cat ? `<button data-dcat-clear class="shrink-0 whitespace-nowrap rounded-full border border-blue-600 bg-blue-50 px-3 py-1 text-sm text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">${DSTATE.cat} ✕</button>` : '');
  const cats = [...new Set(items.map(d=>d.c))];
  document.getElementById('dictList').innerHTML = items.length ? cats.map(c=>`
    <section><h4 class="sticky top-0 z-10 -mx-1 mb-2 mt-4 bg-white/95 px-1 py-1 text-sm font-bold uppercase tracking-wide text-stone-500 backdrop-blur dark:bg-zinc-900/95 dark:text-zinc-400">${c} <span class="font-normal normal-case">· ${SECCIONES[items.find(d=>d.c===c).s]}</span></h4>
    <div class="grid gap-2 md:grid-cols-2">${items.filter(d=>d.c===c).map(d=>`
      <div class="rounded-xl border border-stone-200 p-3 dark:border-zinc-800">
        <div class="flex items-start justify-between gap-2"><b class="text-[0.95rem]">${d.n}</b><a href="${d.to}" data-dict-go class="shrink-0 text-xs text-blue-700 underline dark:text-blue-300">Ver tema →</a></div>
        <div class="overflow-x-auto py-1.5">${kx(d.f)}</div>
        <div class="overflow-x-auto text-sm text-stone-600 dark:text-zinc-400"><span class="text-xs font-semibold uppercase">Ej.:</span> ${kx(d.e)}</div>
      </div>`).join('')}</div></section>`).join('')
    : `<p class="py-10 text-center text-stone-500">No hay propiedades que coincidan con “${DSTATE.q}”.</p>`;
  document.getElementById('dictCount').textContent = `${items.length} propiedades`;
}
document.addEventListener('click', e=>{
  const t = e.target;
  if (t.closest('[data-dict-open]')) return openDict();
  const sb = t.closest('[data-dict-sec]'); if (sb) return openDict({sec:sb.dataset.dictSec});
  const cb = t.closest('[data-dict-cat]'); if (cb) return openDict({cat:cb.dataset.dictCat});
  if (t.closest('[data-dict-close]') || t.id==='dict') return closeDict();
  if (t.closest('[data-dict-go]')) return closeDict();
  const ds = t.closest('[data-dsec]'); if (ds){ DSTATE.sec = ds.dataset.dsec; DSTATE.cat = null; return renderDict(); }
  if (t.closest('[data-dcat-clear]')){ DSTATE.cat = null; return renderDict(); }
});
document.getElementById('dictQ').addEventListener('input', e=>{ DSTATE.q = e.target.value; renderDict(); });
document.addEventListener('keydown', e=>{
  const open = !document.getElementById('dict').classList.contains('hidden');
  if (e.key==='Escape' && open) closeDict();
  if ((e.key==='d'||e.key==='D') && !open && !/INPUT|TEXTAREA/.test(document.activeElement.tagName) && !e.ctrlKey && !e.metaKey) { e.preventDefault(); openDict(); }
});

/* =====================================================================
   NAVEGACIÓN / ROUTER
   #/                → inicio general
   #/f, #/f/<tema>   → Fundamentos
   #/diferencial     → Cálculo diferencial
   #/integral, #/l1… #/bases, #/estrategia, #/examen → Cálculo integral
   ===================================================================== */
function currentId(){
  const [r, sub, sub2] = location.hash.replace(/^#\/?/,'').split('/');
  if (!r) return 'landing';
  if (r==='aprender' || r==='inicio') return 'home';
  if (r==='p') return 'p/' + (sub||'') + (sub2 ? '/'+sub2 : '');
  if (r==='f' || r==='d') return sub ? r+'/'+sub : r;
  if (r==='diferencial') return 'd';
  return r;
}
function buildNav(cur){
  const grp = (t, href, open) => `<a href="${href}" class="mx-1 mb-1 mt-4 flex items-center justify-between rounded-lg px-1.5 py-1 text-xs font-bold uppercase tracking-wider ${open?'text-blue-700 dark:text-blue-300':'text-stone-500 dark:text-zinc-400'} hover:bg-blue-50 dark:hover:bg-blue-950/40"><span>${conIcono3D(t)}</span><span>${open?'▾':'▸'}</span></a>`;
  const a = (href,label,id,extra='') => { const lk = bloqueoLeccion(href); return `<a href="${href}" class="flex justify-between gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.93rem] hover:bg-blue-50 dark:hover:bg-blue-950/50 ${lk?'text-stone-400 dark:text-zinc-500':''} ${cur===id?'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300':''}"><span>${lk?icono3D('🔒')+' ':''}${conIcono3D(label)}</span>${lk?'':extra}</a>`; };
  const cnt = (n,t) => `<span class="text-xs font-normal text-stone-500 dark:text-zinc-400">${n}/${t}</span>`;
  const sec = cur==='home' ? 'home' : cur==='jugar' ? 'P' : cur==='ruta' ? 'ruta' : cur.startsWith('p/') ? 'props' : cur.startsWith('f') ? 'F' : cur.startsWith('d') ? 'D' : 'I';
  let h = a('#/aprender','🏠 Inicio','home') + a('#/ruta','🗺️ Ruta','ruta') + a('#/jugar','🎮 Juego: Defensa Algebraica','jugar') + `<button data-dict-open class="mt-1 flex w-full rounded-lg px-2.5 py-1.5 text-left text-[0.93rem] hover:bg-blue-50 dark:hover:bg-blue-950/50">📖 Diccionario</button>`;
  h += grp('🃏 Propiedades (cartas)', '#/p/fund', sec==='props');
  if (sec==='props') h += Object.keys(DOM_NOMBRE).map(d => { const pp = propsProgreso(d); return a('#/p/'+d, `${DOM_NOMBRE[d][0]} ${DOM_NOMBRE[d][1]}`, 'p/'+d, cnt(pp.n, pp.tot)); }).join('');
  h += grp('🧱 Fundamentos', '#/f', sec==='F'||sec==='home');
  if (sec==='F'||sec==='home') h += a('#/f','Todos los temas','f') + FUND.map((T,i)=>{const p=fundProgress(T);return a('#/f/'+T.id, `${i+1}. ${T.short}`, 'f/'+T.id, cnt(p.n,p.tot))}).join('');
  h += grp('📈 Cálculo diferencial', '#/d', sec==='D');
  if (sec==='D') h += a('#/d','Todos los temas','d') + DIF.map((T,i)=>{const p=temaProgress(T,'d');return a('#/d/'+T.id, `${i+1}. ${T.short}`, 'd/'+T.id, cnt(p.n,p.tot))}).join('');
  h += grp('∫ Cálculo integral', '#/integral', sec==='I'||sec==='home');
  if (sec==='I'||sec==='home') h += a('#/integral','Inicio de la sección','integral') + a('#/bases','📐 Bases para integrar','bases') +
    LESSONS.map(L=>{const p=lessonProgress(L);return a('#/'+L.id, `${L.n}. ${L.short}`, L.id, cnt(p.n,p.tot))}).join('') +
    a('#/estrategia','🧭 ¿Qué técnica uso?','estrategia') + a('#/examen','📝 Solución del examen','examen');
  side.innerHTML = h;
  // Barra inferior y superior: Inicio · Ruta · Juego · Diccionario (los temas cuentan como Inicio)
  const nav = sec==='ruta' ? 'ruta' : sec==='P' ? 'P' : 'home';
  const ON = ['text-blue-700','dark:text-blue-300','font-semibold'];
  document.querySelectorAll('[data-navset="aprender"] [data-bn]').forEach(el=>{
    const on = el.dataset.bn===nav; el.classList.remove(...ON); if (on) el.classList.add(...ON);
    el.querySelector('span')?.classList.toggle('bg-blue-100', on); el.querySelector('span')?.classList.toggle('dark:bg-blue-950', on);
  });
}
function buildNavFromHash(){ buildNav(currentId()); }
function renderMath(el){
  if (window.renderMathInElement){
    renderMathInElement(el,{delimiters:[{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false}],throwOnError:false});
  }
}
const side = document.getElementById('side');
const scrim = document.getElementById('scrim');
function toggleMenu(open){ side.classList.toggle('-translate-x-full', !open); scrim.classList.toggle('hidden', !open); }
scrim.onclick = ()=>toggleMenu(false);
function route(){
  const [r, sub, sub2] = location.hash.replace(/^#\/?/,'').split('/');
  const view = document.getElementById('view');
  for (const k in LEGO) if (LEGO[k].full){ LEGO[k].full = false; document.body.classList.remove('overflow-hidden'); }   // salir de pantalla completa al navegar
  const L = LESSONS.find(x=>x.id===r);
  const SEC = r==='diferencial' ? 'd' : r;
  const T = SECCIONES_AP[SEC] && sub ? SECCIONES_AP[SEC].lista().find(x=>x.id===sub) : null;
  let html, title;
  const bloq = (T || L) && bloqueoLeccion(T ? `#/${SEC}/${T.id}` : `#/${L.id}`);
  const nivelRuta = r==='ruta' && sub != null && sub !== '' ? +sub : null;
  if (nivelRuta != null){
    const h = rutaApp().hitos()[nivelRuta], pend = h ? pendientesAntes(nivelRuta, ES_LECCION.test(h.href ?? '')) : [];
    if (h && !pend.length){ irAModulo(h.href ?? '#/ruta', true); return; }
    html = pageFaltan(pend.length ? pend : [], h?.titulo); title = 'Ruta';
  }
  else if (bloq){ const i = rutaApp().hitos().findIndex(h => h.href === (T ? `#/${SEC}/${T.id}` : `#/${L.id}`)); html = pageFaltan(pendientesAntes(i, true), T ? T.short : L.short); title = 'Lección bloqueada'; }
  else if (T){ html = pageSecTopic(SEC, T); title = T.short; }
  else if (SECCIONES_AP[SEC]){ html = pageSecIndex(SEC); title = SECCIONES_AP[SEC].nombre; }
  else if (r==='jugar'){ html = ''; title = 'Juego'; }
  else if (!r){ html = pageLanding(); title = 'Inicio'; }
  else if (r==='ruta'){ html = pageRuta(); title = 'Ruta'; }
  else if (r==='tutorial'){ html = pageTutorial(); title = 'Tutorial'; }
  else if (r==='p' && DOM_NOMBRE[sub]){ html = sub2 ? pageProp(sub, sub2) : pagePropsIndex(sub); title = 'Propiedades'; }
  else if (r==='integral'){ html = pageIntegral(); title = 'Cálculo integral'; }
  else if (L){ html = pageLesson(L); title = L.short; }
  else if (r==='bases'){ html = pageBases(); title = 'Bases para integrar'; }
  else if (r==='examen'){ html = pageExamen(); title = 'Solución del examen'; }
  else if (r==='estrategia'){ html = pageEstrategia(); title = '¿Qué técnica uso?'; }
  else { html = pageHome(); title = 'Inicio'; }
  view.innerHTML = html;
  if (r==='jugar') abrirJuego(sub || 'inicio'); else cerrarJuego();
  if (r==='jugar' && sub==='config') abrirAjustes();
  ponerModo(!r ? 'landing' : r==='jugar' ? 'juego' : 'aprender', r==='jugar' ? 'j-' + (sub || 'inicio') : null);
  buildNavFromHash();
  renderMath(view);
  if (T && !bloq) T.lego.forEach((_,k)=>renderLego(`${SEC}-${T.id}-${k}`));
  if (r==='p' && sub2) montarPractica(sub, sub2);
  toggleMenu(false);
  const ej = PENDIENTE_EJ && !bloq && document.getElementById('ejercicios'); PENDIENTE_EJ = false;
  const target = ej || (sub && !T && r!=='p' && document.getElementById('b-'+sub));
  if (target) setTimeout(()=>target.scrollIntoView({behavior:'smooth',block:'start'}),30);
  else window.scrollTo(0,0);
  document.title = title + ' · Integrando';
}
const RIGHT = ['border-emerald-600','bg-emerald-50','text-emerald-700','dark:bg-emerald-950/50','dark:text-emerald-300'];
const WRONG = ['border-rose-600','bg-rose-50','text-rose-700','dark:bg-rose-950/50','dark:text-rose-300'];
document.addEventListener('click', e=>{
  const showLink = e.target.closest('[data-show]');
  if (showLink){
    e.preventDefault();
    const card = showLink.closest('[data-q]'), q = QUIZ[+card.dataset.q], fb = card.querySelector('[data-fb]');
    fb.innerHTML = `👉 <b>${q.a}</b>: ${q.why}`; renderMath(fb);
    return;
  }
  const btn = e.target.closest('button');
  if (!btn) return;

  // Pasos: siguiente / todos / reiniciar
  if (btn.dataset.act){
    const box = btn.closest('[data-steps]');
    const steps = [...box.querySelectorAll('[data-step]')], res = box.querySelector('[data-result]');
    const nextBtn = box.querySelector('[data-act="next"]');
    let shown = steps.filter(s=>!s.classList.contains('hidden')).length;
    if (btn.dataset.act==='next'){ if (shown<steps.length) steps[shown++].classList.remove('hidden'); else res.classList.remove('hidden'); }
    if (btn.dataset.act==='all'){ steps.forEach(s=>s.classList.remove('hidden')); res.classList.remove('hidden'); shown=steps.length; }
    if (btn.dataset.act==='reset'){ steps.forEach(s=>s.classList.add('hidden')); res.classList.add('hidden'); shown=0; }
    const fin = !res.classList.contains('hidden');
    nextBtn.textContent = shown<steps.length ? `Ver paso ${shown+1} ▸` : (fin ? 'Completo ✓' : 'Ver resultado ▸');
    nextBtn.disabled = fin;
    return;
  }
  // Ejercicios: pista / respuesta / solución
  if (btn.dataset.toggle){
    btn.closest('[data-card]').querySelector(`[data-part="${btn.dataset.toggle}"]`).classList.toggle('hidden');
    return;
  }
  // Quiz
  if (btn.dataset.opt){
    const card = btn.closest('[data-q]'), q = QUIZ[+card.dataset.q], fb = card.querySelector('[data-fb]');
    card.querySelectorAll('[data-opt]').forEach(b=>b.classList.remove(...RIGHT, ...WRONG));
    const ok = btn.dataset.opt===q.a;
    btn.classList.add(...(ok?RIGHT:WRONG));
    fb.innerHTML = ok ? `✅ ¡Correcto! ${q.why}` : `❌ No es la mejor opción. Pista: piensa en la forma del integrando. <a href="#" data-show class="text-blue-700 underline dark:text-blue-300">Ver respuesta</a>`;
    renderMath(fb);
  }
});
document.addEventListener('change', e=>{
  const k = e.target.dataset && e.target.dataset.key;
  if (!k) return;
  if (e.target.checked) done[k]=true; else delete done[k];
  store.set('done', done);
  buildNavFromHash();
});
document.getElementById('menuBtn').onclick = ()=>{
  if (matchMedia('(min-width: 768px)').matches) side.classList.toggle('md:hidden');      // escritorio: muestra u oculta la barra lateral
  else toggleMenu(side.classList.contains('-translate-x-full'));
};
/* ---------- Configuración: una sola, la misma en la portada, en Aprender y en Jugar ---------- */
const AJ = {msg:''};
function progresoJuego(){ return new DefensaAlgebraica.Progreso(new DefensaAlgebraica.SaveRepository()); }
function abrirAjustes(){ AJ.msg = ''; AJ.devAntes = !!progresoJuego().data.todo; pintarAjustes(); const m = document.getElementById('ajustes'); m.classList.remove('hidden'); m.classList.add('flex'); }
function cerrarAjustes(){ const m = document.getElementById('ajustes'); m.classList.add('hidden'); m.classList.remove('flex');
  const dev = !!progresoJuego().data.todo, cambio = dev !== AJ.devAntes; AJ.devAntes = dev;
  const enBatalla = !!(JUEGO?.scene?.run && !JUEGO.scene.terminado);
  if (cambio && !enBatalla){ if (JUEGO) JUEGO.progreso.data = progresoJuego().data; return setTimeout(route); }   // cambió el modo desarrollador: se vuelve a pintar la pantalla (desbloqueos)
  if (JUEGO){ JUEGO.progreso.data = progresoJuego().data; if (JUEGO.scene && !(JUEGO.scene.run)) JUEGO.scene.enter(); } }
function pintarAjustes(){
  const P = progresoJuego(), d = P.data, dark = document.documentElement.classList.contains('dark');
  const opt = (attr, on, txt) => `<button ${attr} class="flex min-h-12 flex-1 flex-col items-center justify-center rounded-xl border-2 px-1 text-xs font-semibold touch-manipulation ${on ? 'border-blue-600 bg-blue-50 text-blue-800 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-200' : 'border-stone-200 dark:border-zinc-700'}">${txt}</button>`;
  const AY = [['🚫','Sin ayuda'],['🌱','Leve'],['🧭','Media'],['🦮','Alta']];
  document.getElementById('ajustesCuerpo').innerHTML = `
    <div class="flex items-center justify-between"><b class="text-xl">⚙️ Configuración</b><button data-aj="cerrar" class="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 dark:border-zinc-700" aria-label="Cerrar">✕</button></div>
    ${AJ.msg ? `<p class="mt-2 rounded-xl bg-stone-100 px-3 py-2 text-sm dark:bg-zinc-800">${AJ.msg}</p>` : ''}
    ${window.__almacenamiento === 'memoria' ? `<p class="mt-2 rounded-xl bg-amber-100 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">⚠️ Este navegador no deja guardar datos aquí (por ejemplo, si abriste el archivo dentro de otra app). Todo funciona, pero <b>se perderá al cerrar</b>. Ábrelo en Chrome, Safari o Edge, o usa <b>⬇ Exportar</b> para no perder tu avance.</p>`
      : window.__almacenLleno ? `<p class="mt-2 rounded-xl bg-amber-100 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">⚠️ El almacenamiento del navegador está lleno: borra partidas guardadas viejas o usa <b>⬇ Exportar</b>.</p>` : ''}
    <div class="mt-4"><b class="text-sm">Tema</b><div class="mt-1.5 flex gap-2">${opt('data-aj="claro"', !dark, '☀️ Claro')}${opt('data-aj="oscuro"', dark, '🌙 Oscuro')}</div></div>
    <div class="mt-4"><b class="text-sm">🎮 Juego</b>
      <button data-aj="ayuda" class="mt-1.5 flex min-h-12 w-full items-center gap-3 rounded-xl border-2 border-stone-200 px-3 text-left touch-manipulation active:scale-[0.98] dark:border-zinc-700"><span class="text-2xl">❓</span><span class="flex-1"><b class="block text-sm">Cómo jugar</b><span class="text-xs text-stone-500 dark:text-zinc-400">Tutorial del juego paso a paso</span></span><span>▸</span></button></div>
    <div class="mt-4"><b class="text-sm">Modo asistido (juego)</b><div class="mt-1.5 flex gap-1.5">${AY.map(([ic,n],i)=>opt(`data-aj-ayuda="${i}"`, (d.asistido ?? 0) === i, `<span class="text-lg">${ic}</span>${n}`)).join('')}</div>
      <p class="mt-1 text-xs text-stone-500 dark:text-zinc-400">Más nivel = más pistas y sugerencias, pero menos XP.</p></div>
    <div class="mt-4"><b class="text-sm">Gráficos (juego y piezas)</b><div class="mt-1.5 flex gap-1.5">${Object.entries(Graficos.NIVELES).map(([id, n]) => opt(`data-aj-graf="${id}" ${id !== '2d' && !Graficos.webgl ? 'disabled' : ''}`, Graficos.nivel === id, `<span class="text-lg">${n.icon}</span>${n.nombre}`)).join('')}</div>
      <p class="mt-1 text-xs text-stone-500 dark:text-zinc-400">${Graficos.webgl ? Graficos.NIVELES[Graficos.nivel].desc + ' Batalla, personajes, armas, efectos y catálogo con Three.js.' : 'Este navegador no tiene WebGL: se usa el dibujo 2D.'}</p></div>
    <div class="mt-4"><b class="text-sm">Archivos</b><p class="text-xs text-stone-500 dark:text-zinc-400">Todo tu avance (guía, juego, Ruta y partidas) en un archivo JSON.</p>
      <div class="mt-1.5 flex gap-2"><button data-aj="exportar" class="${C.btn} flex-1">⬇ Exportar</button><label class="${C.btn} flex-1">⬆ Importar<input type="file" accept="application/json,.json" data-aj-importar class="hidden"></label></div></div>
    <div class="mt-4 rounded-2xl border border-amber-300 p-3 dark:border-amber-700"><b class="text-sm">🧪 Modo desarrollador</b>
      ${d.devDesbloqueado ? `<label class="mt-2 flex items-center gap-3 text-sm"><input type="checkbox" data-aj="dev" class="h-6 w-6 accent-amber-500" ${d.todo ? 'checked' : ''}>${d.todo ? 'Activado: todo desbloqueado (juego, Ruta y catálogo).' : 'Desactivado: se sigue la Ruta.'}</label>`
        : `<div class="mt-2 flex gap-2"><input data-aj-clave type="password" placeholder="Contraseña" class="min-h-11 min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"><button data-aj="clave" class="${C.btn}">Activar</button></div>`}</div>`;
  const imp = document.querySelector('[data-aj-importar]'); imp.onchange = () => importarAvance(imp.files[0]);
  const cl = document.querySelector('[data-aj-clave]'); if (cl) cl.onkeydown = e => { if (e.key === 'Enter') claveDev(cl.value); };
}
function claveDev(v){
  const P = progresoJuego();
  if (v.trim() !== 'prueba'){ AJ.msg = '❌ Contraseña incorrecta.'; return pintarAjustes(); }
  P.data.devDesbloqueado = true; P.data.todo = true; P.guardar(); AJ.msg = '✅ Modo desarrollador activado y guardado.'; pintarAjustes();
}
async function importarAvance(file){
  if (!file) return;
  try {
    const j = JSON.parse(await file.text());
    if (j.tipo !== 'avance' || !j.datos) throw new Error('Ese archivo no es un avance exportado desde Configuración.');
    for (const [k, v] of Object.entries(j.datos)) if (k.startsWith('calcint:')) localStorage.setItem(k, v);
    AJ.msg = '✅ Avance importado. Recargando…'; pintarAjustes(); setTimeout(() => location.reload(), 700);
  } catch (err){ AJ.msg = `❌ ${err.message}`; pintarAjustes(); }
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-ajustes]')) return abrirAjustes();
  if (e.target.id === 'ajustes') return cerrarAjustes();
  const gr = e.target.closest('[data-aj-graf]');
  if (gr && !gr.disabled){ Graficos.nivel = gr.dataset.ajGraf; FX3D.en(gr, 'acierto'); return pintarAjustes(); }
  const ay = e.target.closest('[data-aj-ayuda]');
  if (ay){ const P = progresoJuego(); P.data.asistido = +ay.dataset.ajAyuda; P.guardar(); return pintarAjustes(); }
  const a = e.target.closest('[data-aj]')?.dataset.aj; if (!a) return;
  if (a === 'cerrar') return cerrarAjustes();
  if (a === 'ayuda'){ cerrarAjustes(); location.hash = '#/jugar/ayuda'; return; }
  if (a === 'claro' || a === 'oscuro'){ document.documentElement.classList.toggle('dark', a === 'oscuro'); store.set('theme', a === 'oscuro' ? 'dark' : 'light'); return pintarAjustes(); }
  if (a === 'clave') return claveDev(document.querySelector('[data-aj-clave]').value);
  if (a === 'dev'){ const P = progresoJuego(); P.data.todo = e.target.checked; P.guardar(); return pintarAjustes(); }
  if (a === 'exportar'){
    const datos = {}; for (let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if (k.startsWith('calcint:')) datos[k] = localStorage.getItem(k); }
    const blob = new Blob([JSON.stringify({app:'integrando', tipo:'avance', version:1, fecha:new Date().toISOString(), datos}, null, 2)], {type:'application/json'});
    const l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = 'integrando-avance.json'; document.body.appendChild(l); l.click(); l.remove();
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !document.getElementById('ajustes').classList.contains('hidden')) cerrarAjustes(); });   // Esc cierra la configuración
window.addEventListener('hashchange', route);
window.addEventListener('load', route);
window.addEventListener('load', () => setTimeout(mostrarBienvenida, 300));   // primera vez: 5 pasos prácticos

/* ---------- Practicar: juego (se crea al entrar por primera vez) ---------- */
document.addEventListener('click', e=>{
  const nav = e.target.closest('[data-esc-nav]');
  if (nav){ const esc = nav.closest('[data-esc]');
    if (nav.dataset.escNav === 'pausa'){ const on = esc.dataset.auto !== '1'; esc.dataset.auto = on ? '1' : '0'; nav.textContent = on ? '⏸' : '▶︎'; }
    else { esc.dataset.auto = '0'; esc.querySelector('[data-esc-nav="pausa"]').textContent = '▶︎'; irEscena(esc, +esc.dataset.i + +nav.dataset.escNav); }
    return; }
  const pr = e.target.closest('[data-probar]');
  if (pr){ const i = +pr.dataset.probar, key = `z-demo-${i}`, zona = document.querySelector(`[data-probar-zona="${i}"]`);
    if (zona.innerHTML){ zona.innerHTML = ''; pr.textContent = '🧪 Probar yo'; Guia.detener(); return; }
    delete LEGO[key]; zona.innerHTML = legoCard(legoEx(key), key, 0); renderMath(zona); renderLego(key); pr.textContent = '✕ Cerrar prueba';
    Guia.iniciar(key);   // guía sobre las fichas reales: qué tocar en cada momento
    zona.scrollIntoView({behavior:'smooth', block:'start'}); return; }
  const ir = e.target.closest('[data-ir]');
  if (ir){ e.preventDefault(); document.getElementById(ir.dataset.ir)?.scrollIntoView({behavior:'smooth', block:'center'}); return; }
  const est = e.target.closest('[data-estudiar]'); if (est){ irAModulo(est.dataset.estudiar); return; }
  const rc = e.target.closest('[data-reclamar]');
  if (rc){ const pts = rutaApp().reclamar(+rc.dataset.reclamar); return route(); }
});
let JUEGO = null;
/** Modo de la app (portada, aprender o juego): cambia la barra superior y la inferior. */
function ponerModo(modo, navJuego){
  const B = document.body.classList; ['modo-landing','modo-aprender','modo-juego'].forEach(c => B.remove(c)); B.add('modo-' + modo);
  document.querySelectorAll('[data-navset]').forEach(n => n.classList.toggle('hidden', n.dataset.navset !== (modo === 'juego' ? 'juego' : 'aprender')));
  document.querySelectorAll('[data-modo-app]').forEach(a => { const on = a.dataset.modoApp === modo;
    a.classList.toggle('bg-white', on); a.classList.toggle('shadow', on); a.classList.toggle('text-blue-700', on); a.classList.toggle('dark:bg-zinc-950', on); a.classList.toggle('dark:text-blue-300', on); });
  if (navJuego){ const ON = ['text-blue-700','dark:text-blue-300','font-semibold'];
    document.querySelectorAll('[data-navset="juego"] [data-bn]').forEach(el => { const on = el.dataset.bn === navJuego; ON.forEach(c => el.classList.toggle(c, on)); el.querySelector('span').classList.toggle('bg-blue-100', on); el.querySelector('span').classList.toggle('dark:bg-blue-950', on); }); }
  document.documentElement.style.setProperty('--alto-cab', document.getElementById('cabecera').offsetHeight + 'px');
}
function abrirJuego(seccion = 'inicio'){
  JUEGO ??= new DefensaAlgebraica.GameApp(document.getElementById('juego'), {
    doneKeys: () => Object.keys(done).filter(k => done[k]),
    onExit: () => { location.hash = '#/'; },
    piezas: new DefensaAlgebraica.TableroPiezas(() => document.getElementById('juegoPiezas')),
  });
  JUEGO.progreso.data = new DefensaAlgebraica.Progreso(new DefensaAlgebraica.SaveRepository()).data;   // por si la Ruta cambió algo fuera del juego
  JUEGO.mostrar(seccion); document.body.classList.add('overflow-hidden');
}
function cerrarJuego(){ if (JUEGO){ JUEGO.close(); document.body.classList.remove('overflow-hidden'); } }
