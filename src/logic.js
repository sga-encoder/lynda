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
const fundProgress = T => { const tot=T.lego.length, n=T.lego.filter((_,i)=>done[`f-${T.id}-${i}`]).length; return {n,tot}; };
const dictBtn = (cat, label='📖 Ver propiedades en el diccionario') =>
  `<button class="${C.chip}" data-dict-cat="${cat}">${label}</button>`;

function pageHome(){
  const fAll = FUND.reduce((a,T)=>a+T.lego.length,0), fOk = FUND.reduce((a,T)=>a+fundProgress(T).n,0);
  const iAll = LESSONS.reduce((a,L)=>a+L.exercises.length,0), iOk = LESSONS.reduce((a,L)=>a+lessonProgress(L).n,0);
  const bar = (n,t) => `<div class="my-2 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800"><div class="h-full bg-emerald-500" style="width:${t?100*n/t:0}%"></div></div><small class="text-stone-500 dark:text-zinc-400">${n}/${t} ejercicios</small>`;
  const sec = (href, icon, title, sub, extra) => `<a href="${href}" class="block rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900"><div class="text-3xl">${icon}</div><b class="mt-2 block text-lg">${title}</b><p class="!my-1 text-sm text-stone-600 dark:text-zinc-400">${sub}</p>${extra}</a>`;
  return `
  <h2 class="${C.h2}">Matemáticas para el cálculo, paso a paso</h2>
  <p class="${C.lead}">Empieza por los fundamentos, sigue con cálculo diferencial y termina con cálculo integral. Cada tema explica lo básico, resuelve ejemplos de nivel medio y difícil diciendo <b>qué</b> se hace y <b>por qué</b>, y te deja ejercicios.</p>
  <div class="mt-5 grid gap-4 md:grid-cols-3">
    ${sec('#/f','🧱','1 · Fundamentos','Operaciones, fracciones, factorización, ecuaciones e inecuaciones. Ejercicios con piezas para armar.', bar(fOk,fAll))}
    ${sec('#/diferencial','📈','2 · Cálculo diferencial','Límites, derivadas y sus aplicaciones.', '<span class="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">Próximamente</span>')}
    ${sec('#/integral','∫','3 · Cálculo integral','Técnicas de integración, impropias y la solución del examen.', bar(iOk,iAll))}
  </div>
  <div class="${C.card} mt-6"><b>📖 Diccionario de propiedades</b>
    <p class="!my-1.5">Todas las propiedades y fórmulas en un solo lugar, con buscador. Ábrelo desde cualquier página con el botón <b>📖 Diccionario</b> de la barra superior (o la tecla <kbd class="rounded border border-stone-300 px-1 text-xs dark:border-zinc-600">D</kbd>).</p>
    <button class="${C.btnP}" data-dict-open>Abrir diccionario</button></div>
  <div class="${C.card}"><b>🧩 ¿Cómo funcionan los ejercicios con piezas?</b>
    <ol>
      <li>Cada paso te dice <b>qué hacer</b> y te da un <b>lienzo en blanco</b>.</li>
      <li>Abajo está el <b>banco de piezas</b>: números (azul), variables (ámbar), operaciones (gris), funciones (violeta) y piezas para encajar (verde: fracción, raíz y exponente).</li>
      <li><b>Arrastra</b> las piezas al lienzo, o <b>tócalas</b> y se añaden al espacio marcado en azul. Las piezas verdes tienen espacios internos: toca un espacio para elegirlo y mete piezas dentro.</li>
      <li>Toca una pieza del lienzo para quitarla, o arrástrala para moverla.</li>
      <li>Pulsa <b>Verificar</b>. Si está bien, pasas al siguiente paso; si no, usa la pista o mira la solución.</li>
    </ol></div>`;
}

function pageFundIndex(){
  return `<h2 class="${C.h2}">🧱 Fundamentos</h2>
  <p class="${C.lead}">La base de todo el cálculo. Recórrelos en orden: cada tema usa los anteriores.</p>
  <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
   ${FUND.map((T,i)=>{const p=fundProgress(T);return tile('#/f/'+T.id, `${i+1} · ${T.t}`, `${T.examples.length} ejemplos · ${p.n}/${p.tot} ejercicios con piezas`)}).join('')}
  </div>
  <div class="${C.card} mt-6">📖 Las propiedades de esta sección están en el <button class="text-blue-700 underline dark:text-blue-300" data-dict-sec="F">Diccionario de propiedades</button>.</div>`;
}

function pageFundTopic(T){
  const i = FUND.indexOf(T), prev = FUND[i-1], next = FUND[i+1];
  const link = (href, txt) => `<a class="${C.btn}" href="${href}">${txt}</a>`;
  const p = fundProgress(T);
  return `<div class="text-sm text-stone-500 dark:text-zinc-400"><a href="#/f" class="underline">Fundamentos</a> › Tema ${i+1} de ${FUND.length}</div>
  <h2 class="${C.h2}">${i+1}. ${T.t}</h2>
  <div class="my-2.5 flex flex-wrap gap-1.5">${dictBtn(T.dict)}</div>
  <h3 class="${C.h3}">Lo más básico</h3>${T.intro}
  <h3 class="${C.h3}">Ejemplos resueltos</h3>
  <p class="${C.src}">Intenta cada uno antes de revelar los pasos.</p>
  ${T.examples.map(exampleCard).join('')}
  <h3 class="${C.h3}">Ejercicios con piezas <small class="${C.src}">(${p.n}/${p.tot} resueltos)</small></h3>
  <p class="${C.src}">Arma cada paso en el lienzo con las piezas del banco y pulsa Verificar.</p>
  ${T.lego.map((ex,k)=>legoCard(ex, `f-${T.id}-${k}`, k)).join('')}
  <div class="mt-10 flex flex-wrap justify-between gap-2.5">
   ${prev ? link('#/f/'+prev.id, '◂ '+prev.short) : link('#/f','◂ Fundamentos')}
   ${next ? link('#/f/'+next.id, next.short+' ▸') : link('#/diferencial','Cálculo diferencial ▸')}
  </div>`;
}

function pageDiferencial(){
  const plan = ['Límites: idea intuitiva y propiedades','Límites laterales, al infinito y continuidad','Definición de derivada (límite del cociente de diferencias)','Reglas de derivación: potencia, producto, cociente','Regla de la cadena','Derivadas de exponenciales, logarítmicas y trigonométricas','Derivación implícita','Razones de cambio relacionadas','Máximos, mínimos y trazado de curvas','Optimización',"Regla de L'Hôpital"];
  return `<h2 class="${C.h2}">📈 Cálculo diferencial</h2>
  <p class="${C.lead}">Esta sección se está construyendo con el mismo formato: lo básico, ejemplos medio y difícil paso a paso, y ejercicios con piezas.</p>
  <div class="${C.note}"><b>Mientras tanto:</b> las reglas de derivación ya están en el <button class="underline" data-dict-sec="D">Diccionario (Cálculo diferencial)</button> y en las <a href="#/bases/derivadas" class="underline">bases de derivadas</a>.</div>
  <h3 class="${C.h3}">Temas planeados</h3>
  <ol>${plan.map(t=>`<li>${t} <span class="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">próximamente</span></li>`).join('')}</ol>`;
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
  const [r, sub] = location.hash.replace(/^#\/?/,'').split('/');
  if (!r || r==='inicio') return 'home';
  if (r==='f') return sub ? 'f/'+sub : 'f';
  return r;
}
function buildNav(cur){
  const grp = (t, href, open) => `<a href="${href}" class="mx-1 mb-1 mt-4 flex items-center justify-between rounded-lg px-1.5 py-1 text-xs font-bold uppercase tracking-wider ${open?'text-blue-700 dark:text-blue-300':'text-stone-500 dark:text-zinc-400'} hover:bg-blue-50 dark:hover:bg-blue-950/40">${t}<span>${open?'▾':'▸'}</span></a>`;
  const a = (href,label,id,extra='') => `<a href="${href}" class="flex justify-between gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.93rem] hover:bg-blue-50 dark:hover:bg-blue-950/50 ${cur===id?'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300':''}">${label}${extra}</a>`;
  const cnt = (n,t) => `<span class="text-xs font-normal text-stone-500 dark:text-zinc-400">${n}/${t}</span>`;
  const sec = cur==='home' ? 'home' : cur.startsWith('f') ? 'F' : cur==='diferencial' ? 'D' : 'I';
  let h = a('#/','🏠 Inicio','home') + `<button data-dict-open class="mt-1 flex w-full rounded-lg px-2.5 py-1.5 text-left text-[0.93rem] hover:bg-blue-50 dark:hover:bg-blue-950/50">📖 Diccionario</button>`;
  h += grp('🧱 Fundamentos', '#/f', sec==='F'||sec==='home');
  if (sec==='F'||sec==='home') h += a('#/f','Todos los temas','f') + FUND.map((T,i)=>{const p=fundProgress(T);return a('#/f/'+T.id, `${i+1}. ${T.short}`, 'f/'+T.id, cnt(p.n,p.tot))}).join('');
  h += grp('📈 Cálculo diferencial', '#/diferencial', sec==='D');
  if (sec==='D') h += a('#/diferencial','Temas (próximamente)','diferencial');
  h += grp('∫ Cálculo integral', '#/integral', sec==='I'||sec==='home');
  if (sec==='I'||sec==='home') h += a('#/integral','Inicio de la sección','integral') + a('#/bases','📐 Bases para integrar','bases') +
    LESSONS.map(L=>{const p=lessonProgress(L);return a('#/'+L.id, `${L.n}. ${L.short}`, L.id, cnt(p.n,p.tot))}).join('') +
    a('#/estrategia','🧭 ¿Qué técnica uso?','estrategia') + a('#/examen','📝 Solución del examen','examen');
  side.innerHTML = h;
  // Barra inferior (celular): marca la sección actual
  const ON = ['text-blue-700','dark:text-blue-300','font-semibold'];
  document.querySelectorAll('[data-bn]').forEach(el=>{
    const on = el.dataset.bn===sec; el.classList.remove(...ON); if (on) el.classList.add(...ON);
    el.querySelector('span').classList.toggle('bg-blue-100', on); el.querySelector('span').classList.toggle('dark:bg-blue-950', on);
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
  const [r, sub] = location.hash.replace(/^#\/?/,'').split('/');
  const view = document.getElementById('view');
  const L = LESSONS.find(x=>x.id===r);
  const T = r==='f' && sub ? FUND.find(x=>x.id===sub) : null;
  let html, title;
  if (T){ html = pageFundTopic(T); title = T.short; }
  else if (r==='f'){ html = pageFundIndex(); title = 'Fundamentos'; }
  else if (r==='diferencial'){ html = pageDiferencial(); title = 'Cálculo diferencial'; }
  else if (r==='integral'){ html = pageIntegral(); title = 'Cálculo integral'; }
  else if (L){ html = pageLesson(L); title = L.short; }
  else if (r==='bases'){ html = pageBases(); title = 'Bases para integrar'; }
  else if (r==='examen'){ html = pageExamen(); title = 'Solución del examen'; }
  else if (r==='estrategia'){ html = pageEstrategia(); title = '¿Qué técnica uso?'; }
  else { html = pageHome(); title = 'Inicio'; }
  view.innerHTML = html;
  buildNavFromHash();
  renderMath(view);
  if (T) T.lego.forEach((_,k)=>renderLego(`f-${T.id}-${k}`));
  toggleMenu(false);
  const target = sub && !T && document.getElementById('b-'+sub);
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
