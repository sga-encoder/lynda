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
const tile = (href, title, sub) =>
  `<a href="${href}" class="block rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-4 shadow-sm touch-manipulation active:scale-[0.98] transition-transform hover:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900"><b class="mb-1 block">${title}</b><small class="text-stone-500 dark:text-zinc-400">${sub}</small></a>`;

/* =====================================================================
   PÁGINAS
   ===================================================================== */
function pageIntegral(){
  const all = LESSONS.reduce((a,L)=>a+L.exercises.length,0);
  const ok = LESSONS.reduce((a,L)=>a+lessonProgress(L).n,0);
  return `
  <div class="text-sm text-stone-500 dark:text-zinc-400"><a href="#/" class="underline">Inicio</a> › Sección 3</div>
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
  <p>Los ejemplos marcados con <i>Stewart</i> provienen de los ejemplos resueltos de James Stewart, <i>Cálculo de una variable: Trascendentes tempranas</i> (7.ª/8.ª ed., Cengage Learning), secciones 5.4, 5.5, 7.1–7.4 y 7.8, y tienen el mismo resultado que el libro. La numeración de ejemplos puede variar ligeramente entre ediciones. Los ejercicios de práctica son del mismo tipo que los de esas secciones; todas las respuestas se verificaron derivando el resultado.</p>`;
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
  <h3 class="${C.h3}">Ejercicios para ti <small class="${C.src}">(${p.n}/${p.tot} resueltos)</small></h3>
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

/* ---------- Tutorial interactivo de fichas (ejercicios con clave t-fichas-<i>) ---------- */
const TUT = [{id:'fichas', lego:[
  {src:'Tutorial 1 · Tu primera ficha', p:R`5`, steps:[
    {q:'Toca la categoría 🔢 Números y luego toca el 5 (o arrástralo al lienzo). Después pulsa ✔ Verificar.', k:['5','3','8'], a:['5'], w:'Tocar una ficha la pone en el espacio azul; arrastrarla te deja elegir el lugar exacto.', h:'Busca el 5 en 🔢 Números.'}]},
  {src:'Tutorial 2 · El orden importa', p:R`2x+3`, steps:[
    {q:'Arma 2x + 3. Si una ficha queda en otro lugar, arrástrala: la barra azul te muestra dónde caerá. Tócala para quitarla.', k:['2','x','+','3'], a:['2x+3'], w:'Las fichas se leen de izquierda a derecha y de arriba abajo, como un texto.', h:'2, luego x, luego +, luego 3.'}]},
  {src:'Tutorial 3 · Recuadros: la potencia', p:R`x^{2}`, steps:[
    {q:'Abre ƒ Funciones y pon la ficha □^□. Es un recuadro con dos espacios: base (grande) y exponente (pequeño). Toca un espacio para volverlo azul y llénalo.', k:['pot','x','2'], a:['x^{2}'], w:'Todas las funciones son recuadros que CONTIENEN a otras fichas: así nunca queda un exponente flotando.', h:'Base: x. Exponente: 2. Usa ⇥ Siguiente espacio para saltar.'}]},
  {src:'Tutorial 4 · Recuadros dentro de recuadros', p:R`\frac{\sin(x)}{2}`, steps:[
    {q:'Pon la fracción (🧩 Agrupar), dentro del numerador la función sin(□) y dentro de ella la x; abajo el 2. «⤴ Salir» te lleva al espacio de afuera.', k:['frac','sin','x','2'], a:['frac{sin(x)}{2}'], w:'Una función puede ir dentro de una fracción, de una raíz o de otra función.', h:'Fracción → numerador: sin → dentro: x. Denominador: 2.'}]},
  {src:'Tutorial 5 · Límites: escribir y reemplazar', p:R`\lim_{x\to1}(x+4)`, steps:[
    {q:'Primero escribe la fórmula con la ficha lím: en el primer espacio la variable (x), en el segundo hacia dónde tiende (1) y en el paréntesis la expresión.', k:['lim','x','1','+','4'], a:['lim_{x→1}(x+4)'], w:'El primer paso siempre es escribir la fórmula completa.', h:'lím, x, 1 y adentro x + 4.'},
    {q:'¡Reemplaza! Esta es tu fórmula: arrastra el 1 y suéltalo ENCIMA de la x de la expresión (se pone roja).', copia:true, reemplazar:'1', valor:5, k:['1'], a:['lim_{x→1}((1)+4)'], w:'Sustituir es cambiar cada x por el valor al que tiende.', h:'Arrastra (no toques) el 1 hasta la x de adentro.'},
    {q:'Calcula el resultado.', k:['5','4','1'], a:['5'], w:'1 + 4 = 5.', h:'Suma.'}]},
  {src:'Tutorial 6 · Usar propiedades (cartas)', p:R`2(x+3)`, steps:[
    {q:'Arma 2(x + 3) con los paréntesis de 🧩 Agrupar.', k:['2','(',')','x','+','3'], a:['2(x+3)'], w:'Los paréntesis agrupan lo que se multiplica por 2.', h:'2, (, x, +, 3, ).'},
    {q:'Aplica una propiedad: toca 🃏 Propiedades y elige «Distributiva» (o escríbelo tú). Luego verifica.', copia:true, k:['2x','6','+','x','2'], a:['2x+6'], w:'Las cartas del juego son las mismas propiedades: aquí las aplicas directamente sobre tus fichas.', h:'2·x + 2·3.'}]},
]}];

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

/** Pestaña de Inicio: la última elegida; la primera vez, el tutorial de fichas. */
const homeTab = () => { let t = null; try { t = sessionStorage.getItem('calcint:homeTab'); } catch {} return t || (Object.keys(done).some(k=>k.startsWith('t-')) ? 'fund' : 'tut'); };
const HOME_TABS = [['tut','🧩','Fichas'], ['fund','🧱','Fundamentos'], ['dif','📈','Diferencial'], ['int','∫','Integral'], ['juego','🎮','Juego']];
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
function pageHome(){
  const fAll = FUND.reduce((a,T)=>a+T.lego.length,0), fOk = FUND.reduce((a,T)=>a+fundProgress(T).n,0);
  const iAll = LESSONS.reduce((a,L)=>a+L.exercises.length,0), iOk = LESSONS.reduce((a,L)=>a+lessonProgress(L).n,0);
  const bar = (n,t,txt='ejercicios') => `<div class="my-2 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800"><div class="h-full bg-emerald-500" style="width:${t?100*n/t:0}%"></div></div><small class="text-stone-500 dark:text-zinc-400">${n}/${t} ${txt}</small>`;
  const sec = (href, icon, title, sub, extra) => `<a href="${href}" class="block rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900"><div class="text-3xl">${icon}</div><b class="mt-2 block text-lg">${title}</b><p class="!my-1 text-sm text-stone-600 dark:text-zinc-400">${sub}</p>${extra}</a>`;
  const tab = homeTab();
  const tutOk = TUT[0].lego.filter((_,i)=>done[`t-fichas-${i}`]).length;
  const propsBloque = (domId, titulo) => { const pp = propsProgreso(domId);
    return `<h3 class="${C.h3}">🃏 Propiedades del juego · ${titulo}</h3><p class="${C.src}">Las mismas cartas del juego, cada una con 3 ejercicios: toca la carta, elige dónde aplicarla y escoge el resultado. ${pp.n}/${pp.tot} hechos.</p>${propsGrid(domId)}`; };
  const cuerpo = {
    tut: `<h3 class="${C.h3}">🧩 Cómo usar las fichas</h3>
      <p class="${C.src}">Mira la animación y luego practica: cada tarjeta es un mini‑ejercicio real (${tutOk}/${TUT[0].lego.length} hechos).</p>
      ${DEMO_FICHAS}
      <ol class="text-sm">
        <li><b>Categorías:</b> 🔢 Números, 𝑥 Variables, ± Signos, ƒ Funciones (potencia, raíz, eˣ, sin, ln, lím…) y 🧩 Agrupar (fracción y paréntesis). <b>Toca</b> una para fijar su menú 📌 o <b>mantenla</b> para asomarlo y arrastrar.</li>
        <li><b>Recuadros:</b> las funciones son cajas con espacios adentro. El espacio <b class="text-blue-700 dark:text-blue-300">azul</b> recibe las fichas que tocas; ⇥ salta al siguiente y ⤴ sale al de afuera.</li>
        <li><b>Arrastrar:</b> una barra azul muestra dónde caerá la ficha. Para quitarla, tócala o suéltala fuera del lienzo.</li>
        <li><b>Reemplazar:</b> en los límites arrastra el número <b>encima</b> de cada x.</li>
        <li><b>Propiedades:</b> en Fundamentos, 🃏 Propiedades aplica una carta del juego a lo que armaste.</li></ol>
      ${TUT[0].lego.map((ex,k)=>legoCard(ex, `t-fichas-${k}`, k)).join('')}`,
    fund: `<div class="mt-4 grid gap-4 md:grid-cols-2">${sec('#/f','🧱','Temas de Fundamentos','Operaciones, fracciones, factorización, ecuaciones e inecuaciones, con ejercicios de fichas.', bar(fOk,fAll))}
      ${sec('#/p/fund','🃏','Propiedades (cartas)','Distributiva, términos semejantes, transponer, dividir ambos lados y operar.', bar(propsProgreso('fund').n, propsProgreso('fund').tot))}</div>${propsBloque('fund','Fundamentos')}`,
    dif: `<div class="mt-4 grid gap-4 md:grid-cols-2">${sec('#/d','📈','Temas de Cálculo diferencial','Límites (escribir, reemplazar y calcular), continuidad, derivadas, cadena, implícita, optimización y L\'Hôpital.', bar(secTotales('d').n, secTotales('d').tot))}
      ${sec('#/p/dif','🃏','Propiedades de derivadas','Suma, constante, potencia, tabla, producto y cadena.', bar(propsProgreso('dif').n, propsProgreso('dif').tot))}</div>${propsBloque('dif','Diferencial')}`,
    int: `<div class="mt-4 grid gap-4 md:grid-cols-2">${sec('#/integral','∫','Cálculo integral','Técnicas de integración, impropias y la solución del examen.', bar(iOk,iAll))}
      ${sec('#/p/int','🃏','Propiedades de integrales','Suma, constante, potencia, ln, tabla, sustitución y + C.', bar(propsProgreso('int').n, propsProgreso('int').tot))}</div>${propsBloque('int','Integral')}`,
    juego: `<a href="#/jugar" class="mt-4 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-indigo-950 to-violet-900 p-5 text-white shadow-sm touch-manipulation active:scale-[0.98] transition-transform"><span class="text-5xl">👽</span><span><b class="block text-lg">🎮 Defensa Algebraica</b><span class="text-sm text-indigo-200">Resuelve ecuaciones, derivadas e integrales con cartas para dar energía a los soldados. Catálogo, mejoras, mazo y 💾 partidas guardadas dentro del juego.</span></span></a>
      <a href="#/ruta" class="mt-3 flex items-center gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30"><span class="text-4xl">🗺️</span><span><b class="block">Ruta de progreso</b><span class="text-sm text-stone-600 dark:text-zinc-400">Todo lo que haces suma XP y desbloquea problemas, cartas, dificultades y bonificadores del juego.</span></span></a>`,
  }[tab];
  return `
  <h2 class="${C.h2}">Matemáticas para el cálculo, paso a paso</h2>
  <p class="${C.lead}">Aprende con fichas, practica las propiedades como cartas y ponlas a prueba en el juego. Todo suma en tu 🗺️ Ruta.</p>
  <div class="sticky top-[57px] z-10 -mx-3.5 mt-3 flex gap-1.5 overflow-x-auto bg-stone-50/95 px-3.5 py-2 backdrop-blur [scrollbar-width:none] dark:bg-zinc-950/95" role="tablist">
    ${HOME_TABS.map(([id,ic,n])=>`<button role="tab" aria-selected="${tab===id}" data-home-tab="${id}" class="flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold touch-manipulation ${tab===id?'border-blue-600 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-400 dark:text-zinc-950':'border-stone-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'}">${ic} ${n}</button>`).join('')}
  </div>
  ${cuerpo}`;
}

/* ---------- Propiedades: índice por área y práctica de una carta ---------- */
const DOM_NOMBRE = {fund:['🧱','Fundamentos'], dif:['📈','Cálculo diferencial'], int:['∫','Cálculo integral']};
function pagePropsIndex(domId){
  const [ic, n] = DOM_NOMBRE[domId], pp = propsProgreso(domId);
  return `<div class="text-sm text-stone-500 dark:text-zinc-400"><a href="#/" class="underline">Inicio</a> › Propiedades</div>
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
function rutaApp(){ return new DefensaAlgebraica.Ruta(new DefensaAlgebraica.Progreso(new DefensaAlgebraica.SaveRepository()), () => Object.keys(done).filter(k => done[k])); }
function pageRuta(){
  const R = rutaApp().resumen(), sig = R.tiers[R.nivelReal+1];
  const TONO = {problema:'bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200', carta:'bg-violet-100 text-violet-900 dark:bg-violet-950/60 dark:text-violet-200', dificultad:'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200', bonus:'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200', puntos:'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'};
  const ETQ = {problema:'Problema', carta:'Propiedad', dificultad:'Dificultad', bonus:'Bonificador', puntos:'Premio'};
  return `<h2 class="${C.h2}">🗺️ Ruta de progreso</h2>
  <p class="${C.lead}">Como un pase de batalla: todo lo que resuelves suma XP (ejercicios de fichas y de propiedades, problemas, oleadas y misiones del juego) y cada nivel desbloquea contenido nuevo del juego.</p>
  ${R.dev ? `<div class="${C.card} border-amber-400 bg-amber-50 dark:bg-amber-950/30">🧪 <b>Modo desarrollo activo</b>: todo está desbloqueado (también el catálogo). Desactívalo en el menú del juego para seguir la Ruta.</div>` : ''}
  <div class="${C.card} flex items-center gap-4">
    <div class="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 font-black text-white shadow"><span class="text-[10px] uppercase">Nivel</span><span class="text-2xl leading-none">${R.nivelReal+1}</span></div>
    <div class="min-w-0 flex-1"><b>${R.xp} XP</b> <span class="text-sm text-stone-500 dark:text-zinc-400">· ${R.ejercicios} ejercicios de la guía</span>
      <div class="mt-1.5 h-3 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800"><div class="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style="width:${Math.min(100,100*R.xp/R.max)}%"></div></div>
      <small class="text-stone-500 dark:text-zinc-400">${sig ? `Faltan ${sig.xp - R.xp} XP para el nivel ${sig.i+1}` : '¡Ruta completa!'}</small></div></div>
  <ol class="relative mt-6 !list-none border-l-4 border-stone-200 pl-6 dark:border-zinc-800">
    ${R.tiers.map(t=>`<li class="relative mb-5" id="ruta-${t.i}">
      <span class="absolute -left-[2.35rem] top-1 flex h-8 w-8 items-center justify-center rounded-full border-4 text-sm font-black ${t.ok?'border-amber-400 bg-amber-300 text-amber-950':'border-stone-200 bg-white text-stone-400 dark:border-zinc-800 dark:bg-zinc-900'}">${t.ok?'✓':t.i+1}</span>
      <div class="rounded-2xl border p-3 ${t.ok?'border-amber-300 bg-white dark:border-amber-700 dark:bg-zinc-900':'border-stone-200 bg-stone-100/60 opacity-80 dark:border-zinc-800 dark:bg-zinc-900/40'} ${sig && sig.i===t.i?'ring-2 ring-blue-400':''}">
        <div class="flex items-baseline justify-between"><b>Nivel ${t.i+1}${t.titulo?` · ${t.titulo}`:''}</b><span class="text-xs text-stone-500 dark:text-zinc-400">${t.xp} XP ${t.ok?'· desbloqueado':'🔒'}</span></div>
        <div class="mt-2 flex flex-wrap gap-1.5">${t.premios.map(p=>`<span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${TONO[p.tipo]}"><span>${p.icon}</span><span class="opacity-70">${ETQ[p.tipo]}:</span> ${p.nombre}${p.reclamable?` <button data-reclamar="${t.i}" class="ml-1 rounded-full bg-emerald-600 px-2 text-white">Reclamar</button>`:p.reclamado?' ✓':''}</span>`).join('')}</div></div></li>`).join('')}
  </ol>
  <div class="mt-2 flex flex-wrap gap-2"><a class="${C.btnP}" href="#/jugar">🎮 Ir al juego</a><a class="${C.btn}" href="#/">🏠 Seguir aprendiendo</a></div>`;
}

function pageSecIndex(sec){
  const S = SECCIONES_AP[sec], L = S.lista();
  return `<h2 class="${C.h2}">${S.icon} ${S.nombre}</h2>
  <p class="${C.lead}">${S.lead}</p>
  <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
   ${L.map((T,i)=>{const p=temaProgress(T,sec);return tile(`#/${sec}/${T.id}`, `${i+1} · ${T.t}`, `${T.examples.length} ejemplos · ${p.n}/${p.tot} ejercicios con piezas`)}).join('')}
  </div>
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
  <h3 class="${C.h3}">Ejercicios con piezas <small class="${C.src}">(${p.n}/${p.tot} resueltos)</small></h3>
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
  if (!r || r==='inicio') return 'home';
  if (r==='p') return 'p/' + (sub||'') + (sub2 ? '/'+sub2 : '');
  if (r==='f' || r==='d') return sub ? r+'/'+sub : r;
  if (r==='diferencial') return 'd';
  return r;
}
function buildNav(cur){
  const grp = (t, href, open) => `<a href="${href}" class="mx-1 mb-1 mt-4 flex items-center justify-between rounded-lg px-1.5 py-1 text-xs font-bold uppercase tracking-wider ${open?'text-blue-700 dark:text-blue-300':'text-stone-500 dark:text-zinc-400'} hover:bg-blue-50 dark:hover:bg-blue-950/40">${t}<span>${open?'▾':'▸'}</span></a>`;
  const a = (href,label,id,extra='') => `<a href="${href}" class="flex justify-between gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.93rem] hover:bg-blue-50 dark:hover:bg-blue-950/50 ${cur===id?'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300':''}">${label}${extra}</a>`;
  const cnt = (n,t) => `<span class="text-xs font-normal text-stone-500 dark:text-zinc-400">${n}/${t}</span>`;
  const sec = cur==='home' ? 'home' : cur==='jugar' ? 'P' : cur==='ruta' ? 'ruta' : cur.startsWith('p/') ? 'props' : cur.startsWith('f') ? 'F' : cur.startsWith('d') ? 'D' : 'I';
  let h = a('#/','🏠 Inicio','home') + a('#/ruta','🗺️ Ruta','ruta') + a('#/jugar','🎮 Juego: Defensa Algebraica','jugar') + `<button data-dict-open class="mt-1 flex w-full rounded-lg px-2.5 py-1.5 text-left text-[0.93rem] hover:bg-blue-50 dark:hover:bg-blue-950/50">📖 Diccionario</button>`;
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
  document.querySelectorAll('[data-bn]').forEach(el=>{
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
  const L = LESSONS.find(x=>x.id===r);
  const SEC = r==='diferencial' ? 'd' : r;
  const T = SECCIONES_AP[SEC] && sub ? SECCIONES_AP[SEC].lista().find(x=>x.id===sub) : null;
  let html, title;
  if (T){ html = pageSecTopic(SEC, T); title = T.short; }
  else if (SECCIONES_AP[SEC]){ html = pageSecIndex(SEC); title = SECCIONES_AP[SEC].nombre; }
  else if (r==='jugar'){ html = pageHome(); title = 'Juego'; }
  else if (r==='ruta'){ html = pageRuta(); title = 'Ruta'; }
  else if (r==='p' && DOM_NOMBRE[sub]){ html = sub2 ? pageProp(sub, sub2) : pagePropsIndex(sub); title = 'Propiedades'; }
  else if (r==='integral'){ html = pageIntegral(); title = 'Cálculo integral'; }
  else if (L){ html = pageLesson(L); title = L.short; }
  else if (r==='bases'){ html = pageBases(); title = 'Bases para integrar'; }
  else if (r==='examen'){ html = pageExamen(); title = 'Solución del examen'; }
  else if (r==='estrategia'){ html = pageEstrategia(); title = '¿Qué técnica uso?'; }
  else { html = pageHome(); title = 'Inicio'; }
  view.innerHTML = html;
  if (r==='jugar') abrirJuego(); else cerrarJuego();
  buildNavFromHash();
  renderMath(view);
  if (T) T.lego.forEach((_,k)=>renderLego(`${SEC}-${T.id}-${k}`));
  if (!r && homeTab()==='tut') TUT[0].lego.forEach((_,k)=>renderLego(`t-fichas-${k}`));
  if (r==='p' && sub2) montarPractica(sub, sub2);
  toggleMenu(false);
  const target = sub && !T && r!=='p' && document.getElementById('b-'+sub);
  if (target) setTimeout(()=>target.scrollIntoView({behavior:'smooth',block:'start'}),30);
  else window.scrollTo(0,0);
  document.title = title + ' · Guía de Cálculo';
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
document.getElementById('menuBtn').onclick = ()=>toggleMenu(side.classList.contains('-translate-x-full'));
document.getElementById('themeBtn').onclick = ()=>{
  const dark = document.documentElement.classList.toggle('dark');
  store.set('theme', dark ? 'dark' : 'light');
};
window.addEventListener('hashchange', route);
window.addEventListener('load', route);

/* ---------- Practicar: juego (se crea al entrar por primera vez) ---------- */
document.addEventListener('click', e=>{
  const ht = e.target.closest('[data-home-tab]');
  if (ht){ try { sessionStorage.setItem('calcint:homeTab', ht.dataset.homeTab); } catch {} return route(); }
  const rc = e.target.closest('[data-reclamar]');
  if (rc){ const pts = rutaApp().reclamar(+rc.dataset.reclamar); return route(); }
});
let JUEGO = null;
function abrirJuego(){
  JUEGO ??= new DefensaAlgebraica.GameApp(document.getElementById('juego'), {
    doneKeys: () => Object.keys(done).filter(k => done[k]),
    onExit: () => { location.hash = '#/'; },
    piezas: new DefensaAlgebraica.TableroPiezas(() => document.getElementById('juegoPiezas')),
  });
  JUEGO.progreso.data = new DefensaAlgebraica.Progreso(new DefensaAlgebraica.SaveRepository()).data;   // por si la Ruta cambió algo fuera del juego
  JUEGO.open(); document.body.classList.add('overflow-hidden');
}
function cerrarJuego(){ if (JUEGO){ JUEGO.close(); document.body.classList.remove('overflow-hidden'); } }
