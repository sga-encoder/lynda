/* =====================================================================
   MOTOR "LEGO": lienzo en blanco + banco de piezas
   - Arrastra una pieza del banco al lienzo (o tócala para añadirla al
     espacio activo). Las piezas estructurales (fracción, raíz, exponente)
     tienen espacios internos donde se encajan otras piezas.
   - Toca una pieza del lienzo para quitarla, o arrástrala para moverla.
   ===================================================================== */
/* Piezas contenedoras: nombre → número de espacios internos.
   Todas las funciones son RECUADROS que contienen a otras piezas (no flotan al lado). */
const STRUCT = {frac:2, pot:2, exp:1, sqrt:1, sin:1, cos:1, tan:1, ln:1, log:1, log_3:1, lim:3,
  der:2,    // d/d▢ [ ▢ ]        espacios: variable, expresión
  int:2,    // ∫ ▢ d▢            espacios: integrando, variable
  intd:4};  // ∫_▢^▢ ▢ d▢        espacios: límite inferior, superior, integrando, variable
const FUNC1 = ['sin','cos','tan','ln','log','log_3'];
const TOKTEX = {'·':'\\cdot','÷':'\\div','≤':'\\le','≥':'\\ge','≠':'\\ne','±':'\\pm','ln':'\\ln','log':'\\log','log_3':'\\log_3',
  'y′':"y'",'sin':'\\sin','cos':'\\cos','tan':'\\tan',',':',','(':'(',')':')','[':'[',']':']'};
const tokTex = t => TOKTEX[t] ?? t.replace(/π/g,'\\pi ').replace(/∞/g,'\\infty ');
const kx = (tex, display=false) => window.katex ? katex.renderToString(tex,{throwOnError:false, displayMode:display}) : tex;

/* Convierte una respuesta serializada (frac{a}{b}, sqrt{x}, ^{n}) en LaTeX */
/** Lee los argumentos {…}{…} balanceados que empiezan en i. */
function leerArgs(s, i, n){
  const args = [];
  for (let k = 0; k < n; k++){
    if (s[i] !== '{') return null;
    let d = 0, j = i;
    for (; j < s.length; j++){ if (s[j]==='{') d++; if (s[j]==='}' && !--d) break; }
    args.push(s.slice(i+1, j)); i = j + 1;
  }
  return {args, fin:i};
}
/** deriv{v}{E} → d/dv[E] · integ{v}{E} → ∫E dv · integ_{a}^{b}{v}{E} → ∫_a^b E dv (con marcadores que se cambian al final). */
function macrosTex(s){
  for (let guard = 0; guard < 40; guard++){
    let i = s.indexOf('deriv{');
    if (i >= 0){ const r = leerArgs(s, i+5, 2); if (!r) break; s = s.slice(0, i) + `§D§${r.args[0]}§\\left[${macrosTex(r.args[1])}\\right]` + s.slice(r.fin); continue; }
    i = s.indexOf('integ_{');
    if (i >= 0){ const a = leerArgs(s, i+6, 1); if (!a || s[a.fin] !== '^') break; const r = leerArgs(s, a.fin+1, 3); if (!r) break;
      s = s.slice(0, i) + `\\int_{${a.args[0]}}^{${r.args[0]}} ${macrosTex(r.args[2])}\\;d${r.args[1]}` + s.slice(r.fin); continue; }
    i = s.indexOf('integ{');
    if (i >= 0){ const r = leerArgs(s, i+5, 2); if (!r) break; s = s.slice(0, i) + `\\int ${macrosTex(r.args[1])}\\;d${r.args[0]}` + s.slice(r.fin); continue; }
    break;
  }
  return s;
}
function ansTex(s){
  s = macrosTex(s);
  s = s.replace(/lim_\{(.*?)→(.*?)\}/g, '\\lim\\limits_{$1\\to $2}');
  return finTex(s);
}
function finTex(s){
  return s.replace(/frac\{/g,'\\frac{').replace(/sqrt\{/g,'\\sqrt{').replace(/log_3/g,'\\log_3 ')
    .replace(/\b(ln|log|sin|cos|tan)/g,'\\$1 ').replace(/·/g,'\\cdot ').replace(/±/g,'\\pm ').replace(/≤/g,'\\le ')
    .replace(/′/g,"'").replace(/≥/g,'\\ge ').replace(/≠/g,'\\ne ').replace(/π/g,'\\pi ').replace(/∞/g,'\\infty ').replace(/,/g,',\\ ')
    .replace(/§D§(.*?)§/g, '\\frac{d}{d$1}');
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
/** Base de una potencia: una sola pieza (x, 3, 20x) va tal cual; si tiene varias se encierra en paréntesis. */
function serBase(z){
  const b = ser(z);
  if (z.length === 1 && !z[0].z && !/^\d+[a-zπ]$/i.test(z[0].t)) return b;   // 3x como base sería (3x)
  if (z.length === 1 && z[0].t === 'sqrt') return b;
  return /^\(.*\)$/.test(b) && z[0].t === '(' && z.at(-1).t === ')' ? b : `(${b})`;
}
function ser(zone){
  return zone.map(n=> n.t==='frac' ? `frac{${ser(n.z[0])}}{${ser(n.z[1])}}`
                    : n.t==='sqrt' ? `sqrt{${ser(n.z[0])}}`
                    : n.t==='pot'  ? `${serBase(n.z[0])}^{${ser(n.z[1])}}`
                    : n.t==='exp'  ? `e^{${ser(n.z[0])}}`
                    : n.t==='lim'  ? `lim_{${ser(n.z[0])}→${ser(n.z[1])}}(${ser(n.z[2])})`
                    : n.t==='der'  ? `deriv{${ser(n.z[0])}}{${ser(n.z[1])}}`
                    : n.t==='int'  ? `integ{${ser(n.z[1])}}{${ser(n.z[0])}}`
                    : n.t==='intd' ? `integ_{${ser(n.z[0])}}^{${ser(n.z[1])}}{${ser(n.z[3])}}{${ser(n.z[2])}}`
                    : FUNC1.includes(n.t) ? `${n.t}(${ser(n.z[0])})`
                    : n.sub ? `(${n.t})`                 // número que sustituyó a una x
                    : n.t).join('');
}
const norm = s => s.replace(/\s+/g,'').replace(/−/g,'-');
function splitTop(s){                      // separa por comas fuera de {} y ()
  const out=[]; let d=0, cur='';
  for (const ch of s){ if('{(['.includes(ch)) d++; if('})]'.includes(ch)) d--; if(ch===','&&d===0){out.push(cur);cur='';} else cur+=ch; }
  out.push(cur); return out;
}
/** Las piezas con signo se separan: el número va en 🔢 y el signo en ± (−8 → «−» + «8»). */
/** Una variable es UNA letra (x, y, z, A…; mayúsculas y minúsculas son distintas): «7x» se separa en el número 7 y la letra x. */
const separarCoef = t => { const m = /^(\d+(?:\.\d+)?)([a-zA-Zπ])$/.exec(t); return m ? [m[1], m[2]] : [t]; };
/** En el menú solo hay cifras sueltas (0–9): «12» se arma con 1 y 2, que en el lienzo se juntan en una sola ficha. */
const separarCifras = t => /^\d{2,}$/.test(t) ? t.split('') : [t];
const piezasDe = k => [...new Set(k.flatMap(t => /^[-+]./.test(t) ? [t[0], t.slice(1)] : [t]).flatMap(separarCoef).flatMap(separarCifras))];
/** Cifras seguidas en un mismo espacio se agrupan en UNA ficha (1, 2 → 12). Se modifica el mismo arreglo. */
const esCifras = n => !!n && !n.z && !n.sub && /^\d+$/.test(n.t);
/* Monomios: signo + número + variable se agrupan en UNA ficha (−, 3, x → −3x).
   - El 1 delante de una letra no se ve (1x → x), pero sigue en el editor y se puede sacar.
   - Un monomio positivo pegado detrás de uno negativo recibe su «+» (−3x 5 → −3x + 5).
   - Al inicio del espacio el «+» sobra y desaparece. */
const esSigno = n => n && !n.z && !n.sub && (n.t === '-' || n.t === '+');
const esLetra = n => n && !n.z && !n.sub && /^[a-zA-Zπ]$/.test(n.t);
const partesDe = n => n.mono ? [...n.partes] : /^\d+$/.test(n.t) ? [n.t] : [n.t];
function textoMono(partes){
  const p = [...partes];
  for (let i = 0; i < p.length - 1; i++) if (p[i] === '1' && /^[a-zA-Zπ]$/.test(p[i + 1])) p.splice(i, 1);   // 1x → x
  return p.join('');
}
/** En el editor cada cifra es un bloque aparte: [−, 12, x] ↔ [−, 1, 2, x]. */
const expandir = partes => partes.flatMap(q => /^\d{2,}$/.test(q) ? q.split('') : [q]);
const compactar = l => l.reduce((a, q) => (/^\d$/.test(q) && /^\d+$/.test(a.at(-1) ?? '') ? a[a.length - 1] += q : a.push(q), a), []);
function hacerMono(n, partes){ Object.assign(n, {t:textoMono(partes), mono:true, partes}); delete n.z; return n; }
function fusionarNumeros(zone){
  // 1) cifras seguidas → un número
  for (let i = zone.length - 1; i > 0; i--){
    if (esCifras(zone[i]) && esCifras(zone[i-1])){ zone[i-1].t += zone[i].t; zone.splice(i, 1); continue; }
    const prev = zone[i-1];                                            // −1 y luego 2 → −12 (el monomio aún sin letra sigue creciendo)
    if (esCifras(zone[i]) && prev.mono && /^\d+$/.test(prev.partes.at(-1))){ prev.partes[prev.partes.length - 1] += zone[i].t; prev.t = textoMono(prev.partes); zone.splice(i, 1); }
    else if (esLetra(zone[i]) && prev.mono && /^(\d+|[-+])$/.test(prev.partes.at(-1))){ prev.partes.push(zone[i].t); prev.t = textoMono(prev.partes); zone.splice(i, 1); }   // −3 y luego x → −3x
  }
  // 2) [signo] [número] [letra] → monomio
  for (let i = 0; i < zone.length; i++){
    const n = zone[i]; if (n.z || n.sub) continue;
    let j = i, partes = [];
    if (esSigno(zone[j]) && (esCifras(zone[j+1]) || esLetra(zone[j+1]) || zone[j+1]?.mono && !esSigno({t:zone[j+1].partes[0]}))){ partes.push(zone[j].t); j++; }
    if (zone[j]?.mono && partes.length){ partes.push(...zone[j].partes); j++; }
    else {
      if (esCifras(zone[j])){ partes.push(zone[j].t); j++; }
      if (esLetra(zone[j]) && (partes.length)){ partes.push(zone[j].t); j++; }
    }
    const tieneNum = partes.some(x => /^\d+$/.test(x)), tieneLetra = partes.some(x => /^[a-zA-Zπ]$/.test(x)), tieneSigno = esSigno({t:partes[0]});
    if (j - i >= 2 && (tieneSigno || (tieneNum && tieneLetra))){ zone.splice(i, j - i, hacerMono({}, partes)); }
  }
  // 3) «+» que falta detrás de un monomio negativo; «+» sobrante al inicio; monomios de una sola parte vuelven a ser fichas
  for (let i = 0; i < zone.length; i++){
    const esTermino = m => m && !m.sub && (m.mono || esCifras(m) || esLetra(m));        // término que pide un «+» delante del siguiente
    if (i > 0 && esCifras(zone[i]) && esTermino(zone[i-1])) zone[i] = hacerMono({}, ['+', zone[i].t]);   // 3x 5 → 3x + 5
    const n = zone[i]; if (!n.mono) continue;
    if (i === 0 && n.partes[0] === '+') n.partes.shift();                                  // el de adelante no lleva «+»
    if (i > 0 && esTermino(zone[i-1]) && !esSigno({t:n.partes[0]})) n.partes.unshift('+'); // si pasa atrás, se le genera
    if (n.partes.length === 1){ zone[i] = {t:n.partes[0]}; continue; }
    n.t = textoMono(n.partes);
  }
}
const ABC = [...'abcdefghijklmnopqrstuvwxyz', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
const LIM_RE = /^lim_\{(.+?)→(.+?)\}\((.*)\)$/;
function checkAnswer(step, built, numerico = false){
  const b = norm(built);
  const L = LIM_RE.exec(b);
  if (L && !step.exact) return step.a.some(a => { const A = LIM_RE.exec(norm(a));      // lím: cabeza exacta, cuerpo equivalente
    if (!A) return false; if (A[1]!==L[1] || A[2]!==L[2]) return false;
    if (norm(A[3])===L[3]) return true; try { return Calc.equivalentes(Calc.parse(A[3]), Calc.parse(L[3])); } catch { return false; } });
  if (numerico && !step.set && !step.exact) return step.a.some(a => norm(a)===b || Calc.mismaRespuesta(a, b));
  if (step.set){
    const key = s => splitTop(norm(s)).map(x=>x.replace(/^x=/,'')).sort().join('|');
    return step.a.some(a => key(a)===key(b));
  }
  return step.a.some(a => norm(a)===b);
}
/** Paso de sustitución: el cuerpo (sin el lím) ya no tiene x, los valores puestos son los correctos y vale lo esperado. */
function checkReemplazo(step, root){
  const body = root.length===1 && root[0].t==='lim' ? root[0].z[2] : root;
  const todos = z => z.flatMap(n => [n, ...(n.z||[]).flatMap(todos)]);
  const ns = todos(body);
  if (ns.some(n => n.t==='x')) return {ok:false, t:'Todavía queda alguna x: arrastra el número encima de cada x.'};
  const subs = ns.filter(n => n.sub);
  if (!subs.length) return {ok:false, t:'Arrastra el valor hacia el que tiende x y suéltalo sobre cada x.'};
  if (subs.some(n => n.t !== step.reemplazar)) return {ok:false, t:`Se sustituye por el valor al que tiende x (${step.reemplazar}).`};
  try { const v = Calc.evaluar(Calc.parse(ser(body)), {x:0, y:0});
    if (Math.abs(v - step.valor) > 1e-9 * Math.max(1, Math.abs(v))) return {ok:false, t:'La expresión cambió: solo hay que cambiar las x por el número.'};
  } catch { return {ok:false, t:'No se puede leer la expresión: revisa que no falte nada.'}; }
  return {ok:true};
}
/** Convierte una respuesta serializada en piezas (para copiar la fórmula de un paso al siguiente). */
function treeOf(src){
  const s = norm(src); let i = 0;
  const eat = t => s.startsWith(t, i) ? (i += t.length, true) : false;
  function seq(stop){
    const out = [];
    while (i < s.length && !stop.includes(s[i])){
      if (eat('frac{')){ const a = seq('}'); eat('}'); eat('{'); const b = seq('}'); eat('}'); out.push({t:'frac', z:[a, b]}); continue; }
      if (eat('sqrt{')){ const a = seq('}'); eat('}'); out.push({t:'sqrt', z:[a]}); continue; }
      if (eat('e^{')){ const a = seq('}'); eat('}'); out.push({t:'exp', z:[a]}); continue; }
      if (eat('deriv{')){ const v = seq('}'); eat('}'); eat('{'); const e = seq('}'); eat('}'); out.push({t:'der', z:[v, e]}); continue; }
      if (eat('integ_{')){ const a = seq('}'); eat('}'); eat('^{'); const b = seq('}'); eat('}'); eat('{'); const v = seq('}'); eat('}'); eat('{'); const e = seq('}'); eat('}'); out.push({t:'intd', z:[a, b, e, v]}); continue; }
      if (eat('integ{')){ const v = seq('}'); eat('}'); eat('{'); const e = seq('}'); eat('}'); out.push({t:'int', z:[e, v]}); continue; }
      if (eat('lim_{')){ const v = seq('→'); eat('→'); const a = seq('}'); eat('}'); eat('('); const e = seq(')'); eat(')'); out.push({t:'lim', z:[v, a, e]}); continue; }
      const f = FUNC1.find(f => s.startsWith(f+'(', i));
      if (f){ i += f.length + 1; const a = seq(')'); eat(')'); out.push({t:f, z:[a]}); continue; }
      if (eat('^{')){
        const e = seq('}'); eat('}'); let base;
        if (out.at(-1)?.t === ')'){ let d = 0, j = out.length - 1; for (; j >= 0; j--){ if (out[j].t===')') d++; if (out[j].t==='(' && !--d) break; } base = out.splice(j).slice(1, -1); }
        else base = out.length ? [out.pop()] : [];
        out.push({t:'pot', z:[base, e]}); continue;
      }
      const m = /^\d+(\.\d+)?/.exec(s.slice(i));
      if (m){ i += m[0].length; out.push({t:m[0]}); continue; }
      if (s[i+1] === '′'){ out.push({t:s.slice(i, i+2)}); i += 2; continue; }
      out.push({t:s[i++]});
    }
    return out;
  }
  return seq('');
}
const clonar = z => JSON.parse(JSON.stringify(z));
function containsZone(node, zone){
  return (node.z||[]).some(z => z===zone || z.some(n=>containsZone(n, zone)));
}

/* ---------- Render ---------- */
const ZREG = {};   // registro de zonas del último render, por ejercicio
function zoneHTML(key, zone, depth, sm=false){
  const st = legoState(key);
  fusionarNumeros(zone);
  const id = ZREG[key].push(zone)-1;
  const isRoot = depth===0, active = st.active===zone || (!st.active && isRoot);
  const base = isRoot
    ? 'min-h-28 w-full p-1.5 gap-1 rounded-xl border-2 border-dashed border-stone-300 bg-white bg-[radial-gradient(circle,#e7e5e4_1px,transparent_1px)] [background-size:18px_18px] dark:border-zinc-700 dark:bg-zinc-950 dark:bg-[radial-gradient(circle,#27272a_1px,transparent_1px)]'
    : sm ? 'min-h-6 min-w-6 p-px gap-px rounded-md border-[1.5px] border-dashed border-stone-300 bg-white/80 dark:border-zinc-600 dark:bg-zinc-900/80'
         : 'min-h-9 min-w-9 p-0.5 gap-0.5 rounded-lg border-2 border-dashed border-stone-300 bg-white/80 dark:border-zinc-600 dark:bg-zinc-900/80';
  const ring = active ? ' ring-2 ring-blue-400 dark:ring-blue-500' : '';
  const empty = zone.length ? '' : (isRoot ? `<span class="pointer-events-none select-none text-sm text-stone-400 dark:text-zinc-500">Lienzo vacío: abre una categoría y arrastra o toca piezas…</span>` : '');
  return `<div data-z="${key}|${id}" class="flex ${isRoot ? 'lego-raiz relative min-w-0 max-w-full flex-nowrap overflow-x-auto' : 'shrink-0 flex-nowrap'} items-center ${base}${ring}">${zone.map((n,i)=>conBorrar(st, n, nodeHTML(key,n,id,i,depth,sm))).join('')}${empty}</div>`;
}
const RADICAL = '<svg viewBox="0 0 12 30" preserveAspectRatio="none" aria-hidden="true" class="w-3 shrink-0 self-stretch text-emerald-700 dark:text-emerald-300"><path d="M0 17 L3 16 L6.5 28 L11 1 L12 1" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
/** La ficha tocada muestra un botón flotante 🗑 para eliminarla (un toque ya no borra directamente). */
/** Coeficiente y letra de un término simple (3x, −x, 5, y). null si no lo es. */
function terminoDe(n){
  if (!n || n.z || n.sub) return null;
  const partes = n.mono ? n.partes : [n.t];
  const txt = partes.join('');
  const m = /^([-+]?)(\d*)([a-zA-Zπ]?)$/.exec(txt);
  if (!m || (!m[2] && !m[3])) return null;
  return {c:(m[1] === '-' ? -1 : 1) * (m[2] ? +m[2] : 1), l:m[3]};
}
/** ¿Se pueden operar a y b dentro de la zona? (semejantes y del mismo lado del «=») */
function operables(zone, a, b){
  const A = terminoDe(a), B = terminoDe(b);
  if (!A || !B || A.l !== B.l) return null;
  const ia = zone.indexOf(a), ib = zone.indexOf(b);
  if (ia < 0 || ib < 0) return null;
  if (zone.slice(Math.min(ia, ib), Math.max(ia, ib)).some(x => x.t === '=')) return null;
  return {c:A.c + B.c, l:A.l};
}
function nodoDeTermino({c, l}){
  const abs = Math.abs(c);
  if (!l) return c < 0 ? hacerMono({}, ['-', String(abs)]) : {t:String(abs)};
  if (c === 0) return {t:'0'};
  return hacerMono({}, [c < 0 ? '-' : '+', String(abs), l]);
}
/** Bloques de un monomio con letra: [signo+número] [letra]. */
function bloquesDe(n){
  const T = n && n.mono ? terminoDe(n) : null;
  if (!T || !T.l) return null;
  return [{tipo:'num', txt:String(T.c), c:T.c}, {tipo:'letra', txt:T.l}];
}
/** Panel bajo el lienzo con los bloques de la ficha tocada. */
function bloquesHTML(key, st){
  const n = st.borrar; if (!n || !allZones(st.root).some(z => z.includes(n))) return '';
  const b = 'inline-flex min-h-12 min-w-12 items-center justify-center rounded-lg border-2 border-b-4 px-3 font-serif text-xl touch-manipulation active:scale-95';
  if (potDenominador(st.root, n)) return `<div data-panel class="mt-2 rounded-xl border-2 border-violet-400 bg-violet-50/70 p-2 text-center text-xs dark:bg-violet-950/30">Esta potencia está <b>abajo de una fracción</b>. Arrástrala fuera (por su borde) o tócala aquí: sube con <b>exponente negativo</b>.<div class="mt-1.5"><button data-lg="subirpot" class="${b} !min-h-10 !text-sm border-violet-500 bg-white font-sans font-semibold text-violet-800 dark:bg-zinc-900 dark:text-violet-200">⬆ Subir con exponente negativo</button></div></div>`;
  const bl = bloquesDe(n); if (!bl) return '';
  const eq = st.root.includes(n) && st.root.some(x => x.t === '=');
  return `<div data-panel class="mt-2 rounded-xl border-2 border-amber-400 bg-amber-50/70 p-2 dark:bg-amber-950/30">
    <div class="text-xs font-semibold">🧩 Bloques de <b>${n.t.replace('-', '−')}</b></div>
    <div class="mt-1.5 flex justify-center gap-2">${bl.map((q, i) => `<span data-blq="${key}|${i}" style="touch-action:none" class="${b} ${q.tipo === 'num' ? 'border-blue-500 bg-blue-50 text-blue-950 dark:bg-blue-950/60 dark:text-blue-100' : 'border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-100'}">${q.txt.replace('-', '−')}</span>`).join('')}</div>
    <p class="mt-1 text-center text-[11px] text-stone-600 dark:text-zinc-400">Arrástralo al lienzo para separarlo${eq ? ', o <b>al otro lado del =</b> para que pase a <b>dividir</b>' : ''}.</p></div>`;
}
/** ¿El nodo está en el denominador de alguna fracción? Devuelve {frac, zona padre}. */
function enDenominador(root, n){
  for (const m of root){ if (m.t === 'frac' && m.z[1].includes(n)) return {frac:m, padre:root};
    for (const z of (m.z || [])){ const r = enDenominador(z, n); if (r) return r; } }
  return null;
}
/** Nodo de la raíz que contiene a una zona (o la zona misma si es la raíz). */
function ladoDe(root, zone, idx){
  const eq = root.findIndex(x => x.t === '='); if (eq < 0) return null;
  if (zone === root) return idx <= eq ? 'izq' : 'der';
  const i = root.findIndex(m => containsZone(m, zone)); return i < 0 ? null : i < eq ? 'izq' : 'der';
}
/** a^n → a^(−n), con paréntesis en la base si tiene varias fichas. */
function negarPotencia(pot){
  const [base, ex] = pot.z;
  if (base.length > 1 && !(base[0].t === '(' && base.at(-1).t === ')')) pot.z[0] = [{t:'('}, ...base, {t:')'}];
  if (ex.length === 1 && esCifras(ex[0])) pot.z[1] = [hacerMono({}, ['-', ex[0].t])];
  else if (ex.length === 1 && ex[0].mono && ex[0].partes[0] === '-'){ const p = ex[0].partes.slice(1); pot.z[1] = [p.length === 1 ? {t:p[0]} : hacerMono({}, p)]; }
  else pot.z[1] = [{t:'-'}, {t:'('}, ...ex, {t:')'}];
  return pot;
}
/** Saca una potencia del denominador: a / x² → (a)·x⁻². */
function sacarPotencia(st, node, zone, idx){
  const den = enDenominador(st.root, node); if (!den) return;
  snapshot(st); st.borrar = null; const {frac, padre} = den;
  frac.z[1].splice(frac.z[1].indexOf(node), 1); negarPotencia(node);
  if (!frac.z[1].length){
    const num = frac.z[0], envuelto = num.length > 1 ? [{t:'('}, ...num, {t:')'}] : num;
    padre.splice(padre.indexOf(frac), 1, ...envuelto, node);
  } else (zone || frac.z[0]).splice(Math.min(idx ?? Infinity, (zone || frac.z[0]).length), 0, node);
  st.msg = {ok:true, t:'La potencia salió del denominador: ahora su exponente es negativo.'}; buzz(20);
}
/** Potencia del denominador que contiene a n (n puede ser la potencia o una ficha dentro de ella). */
function potDenominador(root, n){
  if (n.t === 'pot' && enDenominador(root, n)) return n;
  const buscar = zona => { for (const m of zona){ if (m.t === 'pot' && containsNodo(m, n) && enDenominador(root, m)) return m; for (const z of (m.z || [])){ const r = buscar(z); if (r) return r; } } return null; };
  return buscar(root);
}
const containsNodo = (m, n) => (m.z || []).some(z => z.includes(n) || z.some(k => containsNodo(k, n)));
/** Soltar un bloque del panel. */
function soltarBloque(st, d, zEl, x, y){
  const M = st.borrar, bl = bloquesDe(M); if (!bl || !zEl) return;
  const {zone} = findZone(zEl.dataset.z), idx = dropIndex(zEl, x, y), q = bl[d.i], otro = bl[1 - d.i];
  const root = st.root, iM = root.indexOf(M), lado = iM >= 0 ? ladoDe(root, root, iM) : null, destino = ladoDe(root, zone, idx);
  const resto = q.tipo === 'num' ? {t:otro.txt} : nodoDeTermino({c:bl[0].c, l:''});
  const comoNodo = q.tipo === 'num' ? nodoDeTermino({c:q.c, l:''}) : {t:q.txt};
  snapshot(st); st.borrar = null;
  if (lado && destino && lado !== destino){                         // al otro lado del «=»: pasa a dividir
    const eq = root.findIndex(x => x.t === '=');
    const suyo = lado === 'izq' ? root.slice(0, eq) : root.slice(eq + 1);
    if (suyo.length !== 1){ st.msg = {ok:false, t:`Para pasar ${q.txt} a dividir, ${M.t} debe estar solo de su lado del =. Primero pasa los otros términos.`}; st.vibrar = M; return; }
    const otros = lado === 'izq' ? root.splice(eq + 1) : root.splice(0, eq);
    const frac = {t:'frac', z:[otros.length ? otros : [{t:'0'}], [comoNodo]]};
    root.splice(root.indexOf(M), 1, resto);
    if (lado === 'izq') root.push(frac); else root.unshift(frac);
    st.msg = {ok:true, t:`${q.txt.replace('-', '−')} estaba multiplicando: pasó al otro lado a dividir todo.`}; buzz(20); return;
  }
  const z = allZones(root).find(z => z.includes(M)), iz = z.indexOf(M);   // mismo lado: se separa el bloque
  z.splice(iz, 1, resto);
  zone.splice(Math.min(zone === z && idx > iz ? idx : idx, zone.length), 0, comoNodo);
  st.msg = null;
}
/** Elemento DOM de un nodo tras el último render. */
function elDeNodo(key, node){
  const zs = ZREG[key] || [];
  for (let z = 0; z < zs.length; z++){ const i = zs[z].indexOf(node); if (i >= 0) return document.querySelector(`[data-n="${key}|${z}|${i}"]`); }
  return null;
}
function conBorrar(st, n, html){
  if (n.demo) html = html.replace('class="', `class="${n.demo} `);     // marcas de las animaciones del tutorial
  if (st.borrar !== n) return html;
  const badge = '<button data-lg="borrar" aria-label="Eliminar ficha" class="absolute -right-2 -top-6 z-20 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-rose-600 text-xs text-white shadow-lg ring-2 ring-rose-300 [animation:flotar_1.4s_ease-in-out_infinite] dark:border-zinc-900">🗑</button>';
  return html.replace('class="', 'class="relative ring-2 ring-rose-400 ').replace('>', '>' + badge);
}
function nodeHTML(key, n, zid, i, depth, sm){
  const attr = `data-n="${key}|${zid}|${i}"`;
  const grab = 'touch-none select-none cursor-grab';
  const brick = `${grab} rounded-md border ${sm?'border-b-2':'border-b-4'} shadow-sm`;
  const green = 'border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/60';
  const violet = 'border-violet-500 bg-violet-50 text-violet-950 dark:border-violet-500 dark:bg-violet-950/60 dark:text-violet-100';
  const pad = sm ? 'gap-px p-px' : 'gap-0.5 px-1 py-0.5';
  const lbl = t => `<span class="pointer-events-none font-serif ${sm?'text-sm':'text-lg'} italic leading-none">${t}</span>`;
  const sub = (zi, small=sm) => zoneHTML(key, n.z[zi], depth+1, small);
  if (n.t==='frac') return `<span ${attr} title="Fracción" class="${brick} ${green} inline-flex flex-col items-center ${pad}">${sub(0)}<span class="h-0.5 w-full rounded bg-emerald-700 dark:bg-emerald-300"></span>${sub(1)}</span>`;
  if (n.t==='sqrt') return `<span ${attr} title="Raíz" class="${brick} ${violet} inline-flex items-stretch ${sm?'p-0.5':'px-1.5 py-1'}">${RADICAL}<span class="border-t-2 border-violet-700 pt-0.5 dark:border-violet-300">${sub(0)}</span></span>`;
  // Potencia: UN recuadro con dos espacios: base (normal) y exponente (pequeño, arriba a la derecha)
  if (n.t==='pot')  return `<span ${attr} title="Potencia: base y exponente" class="${brick} ${violet} inline-flex items-start ${pad}"><span class="self-end">${sub(0)}</span><span class="-mt-0.5">${sub(1, true)}</span></span>`;
  if (n.t==='exp')  return `<span ${attr} title="Exponencial e^▢" class="${brick} ${violet} inline-flex items-start ${pad}"><span class="self-end pb-1">${lbl('e')}</span><span class="-mt-0.5">${sub(0, true)}</span></span>`;
  if (FUNC1.includes(n.t)) return `<span ${attr} title="Función ${n.t}" class="${brick} ${violet} inline-flex items-center ${pad}">${kx(tokTex(n.t))}<span class="text-xl leading-none opacity-70">(</span>${sub(0)}<span class="text-xl leading-none opacity-70">)</span></span>`;
  if (n.t==='lim')  return `<span ${attr} title="Límite: variable, hacia dónde tiende y expresión" class="${brick} ${violet} inline-flex shrink-0 items-center ${pad}">
      <span class="inline-flex shrink-0 flex-col items-center gap-0.5">${lbl('lim')}<span class="inline-flex items-center gap-0.5">${sub(0, true)}<span class="text-xs">→</span>${sub(1, true)}</span></span>
      <span class="text-2xl leading-none opacity-70">(</span><span>${sub(2)}</span><span class="text-2xl leading-none opacity-70">)</span></span>`;
  // Tamaños: lienzo principal grande, dentro de un recuadro mediano, exponentes pequeños
  // Derivada e integrales: también son recuadros con sus espacios adentro
  const big = t => `<span class="pointer-events-none font-serif ${sm?'text-base':'text-2xl'} leading-none">${t}</span>`;
  if (n.t==='der') return `<span ${attr} title="Derivada: variable y expresión" class="${brick} ${violet} inline-flex shrink-0 items-center ${pad}">
      <span class="inline-flex shrink-0 flex-col items-center"><span class="pointer-events-none font-serif text-sm italic leading-none">d</span><span class="my-0.5 h-px w-full bg-current"></span><span class="inline-flex items-center gap-0.5"><span class="pointer-events-none font-serif text-sm italic">d</span>${sub(0, true)}</span></span>
      ${big('[')}<span>${sub(1)}</span>${big(']')}</span>`;
  if (n.t==='int') return `<span ${attr} title="Integral: integrando y variable" class="${brick} ${violet} inline-flex shrink-0 items-center ${pad}">
      ${big('∫')}<span>${sub(0)}</span><span class="pointer-events-none font-serif italic">d</span>${sub(1, true)}</span>`;
  if (n.t==='intd') return `<span ${attr} title="Integral definida: límites, integrando y variable" class="${brick} ${violet} inline-flex shrink-0 items-center ${pad}">
      <span class="inline-flex shrink-0 flex-col items-center gap-0.5">${sub(1, true)}${big('∫')}${sub(0, true)}</span><span>${sub(2)}</span><span class="pointer-events-none font-serif italic">d</span>${sub(3, true)}</span>`;
  const size = sm ? 'min-h-6 min-w-6 px-0.5 text-sm' : depth>0 ? 'min-h-8 min-w-8 px-1 text-base' : 'min-h-10 min-w-10 px-2 text-lg';
  if (n.sub) return `<span ${attr} title="Valor sustituido" class="${brick} border-blue-600 bg-blue-100 text-blue-950 ring-2 ring-blue-300 dark:bg-blue-900/70 dark:text-blue-50 inline-flex ${size} items-center justify-center">${kx('('+tokTex(n.t)+')')}</span>`;
  return `<span ${attr} class="${brick} ${pieceColor(n.t)} inline-flex ${size} items-center justify-center">${kx(tokTex(n.t))}</span>`;
}
function pieceColor(t){
  if (/^[-+]?\d+(\.\d+)?$/.test(t)) return 'border-blue-500 bg-blue-50 text-blue-950 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-100';
  if (STRUCT[t] && t!=='frac') return 'border-violet-500 bg-violet-50 text-violet-950 dark:border-violet-500 dark:bg-violet-950/60 dark:text-violet-100';
  if (/[a-zπ∞]/i.test(t)) return 'border-amber-500 bg-amber-50 text-amber-950 dark:border-amber-500 dark:bg-amber-950/60 dark:text-amber-100';
  return 'border-stone-400 bg-stone-100 text-stone-900 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-100';
}
const BANK_TEX = {frac:'\\frac{\\square}{\\square}', sqrt:'\\sqrt{\\square}', pot:'\\square^{\\square}', exp:'e^{\\square}',
  sin:'\\sin(\\square)', cos:'\\cos(\\square)', tan:'\\tan(\\square)', ln:'\\ln(\\square)', log:'\\log(\\square)', log_3:'\\log_3(\\square)',
  lim:'\\lim_{\\square\\to\\square}(\\square)', der:'\\tfrac{d}{d\\square}[\\square]', int:'\\int\\square\\,d\\square', intd:'\\int_{\\square}^{\\square}\\square\\,d\\square'};
const BANK_TITLE = {frac:'Fracción: numerador y denominador', sqrt:'Raíz: un espacio dentro', pot:'Potencia: un recuadro con base y exponente',
  exp:'Exponencial: e elevado a lo que pongas dentro', der:'Derivada: la variable y, entre corchetes, lo que se deriva',
  int:'Integral indefinida: el integrando y la variable de dx', intd:'Integral definida: límites inferior y superior, integrando y variable', lim:'Límite: variable, hacia dónde tiende y la expresión entre paréntesis'};
function bankPiece(key, t){
  const brick = 'touch-none select-none cursor-grab rounded-md border border-b-4 shadow-sm inline-flex min-h-12 min-w-12 items-center justify-center px-3 text-lg touch-manipulation transition-transform active:scale-90 hover:-translate-y-0.5';
  const label = kx(BANK_TEX[t] ?? tokTex(t));
  const cls = t==='frac' ? 'border-emerald-500 bg-emerald-50 text-emerald-950 dark:border-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-100' : pieceColor(t);
  const title = BANK_TITLE[t] || 'Pieza';
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
  if (t==='frac' || /^[()\[\]]$/.test(t)) return 'agr';
  if (STRUCT[t]) return 'fun';                       // potencia, raíz, e^▢, sin, ln, lím… son funciones
  if (/^[-+]?\d+(\.\d+)?$/.test(t)) return 'num';
  if (/[a-zπ∞]/i.test(t)) return 'var';
  return 'sig';
}
function paletteHTML(key, step, st){
  const groups = {}; (step.orden ? piezasDe(step.k) : shuffled(piezasDe(step.k), key+st.step)).forEach(t=>(groups[catOf(t)] ||= []).push(t));
  const cats = CATS.filter(c=>groups[c.id]);
  if (st.cat && !groups[st.cat]) { st.cat = null; st.pin = false; }
  const open = st.cat ? CATS.find(c=>c.id===st.cat) : null;
  const tray = open ? `
      <div class="mb-1.5 flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-zinc-400">
        <span>${open.icon} ${open.name} · ${st.pin ? '📌 fijado' : 'suelta para cerrar'}</span>
        ${st.pin ? `<button data-lg="closecat" class="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 bg-white text-sm touch-manipulation dark:border-zinc-600 dark:bg-zinc-900" aria-label="Cerrar menú">✕</button>` : ''}
      </div>
      <div class="flex flex-wrap justify-center gap-2 sm:justify-start">${groups[open.id].map(t=>bankPiece(key,t)).join('')}</div>
      ${open.id==='var' ? `<button data-lg="abc" class="mt-2 inline-flex min-h-9 items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 text-xs touch-manipulation dark:border-zinc-600 dark:bg-zinc-900">🔤 ${st.abc ? 'Ocultar' : 'Más letras (a–z, A–Z)'}</button>
        ${st.abc ? `<p class="mt-1 text-[11px] text-stone-500 dark:text-zinc-400">Cada letra es una variable distinta: <b>a</b> y <b>A</b> no son la misma.</p><div class="mt-1 flex flex-wrap gap-1.5">${ABC.filter(l=>!groups.var.includes(l)).map(l=>bankPiece(key,l).replace('min-h-12 min-w-12','min-h-10 min-w-10')).join('')}</div>` : ''}` : ''}`
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
      <div class="overflow-x-auto py-1">${kx(ansTex(steps[i].reemplazar && l.built ? l.built : steps[i].a[0]))}</div>
      <div class="why text-sm text-stone-600 dark:text-zinc-400"><b class="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">Por qué</b> ${steps[i].w}</div>
    </div>`).join('');
  let cur = '';
  if (!finished){
    const s = steps[st.step];
    const fb = st.msg ? `<div class="mt-3 rounded-xl px-3 py-2.5 text-sm font-medium ${st.msg.ok?'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200':'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200'}">${st.msg.t}</div>` : '';
    const z = st.zoom ?? 1, full = !!st.full;
    const herr = `<div class="mb-2 flex flex-wrap items-center gap-1.5">
        <button class="${C.btn} !min-h-9 !px-2.5 !py-1 !text-xs" data-lg="zoom-" title="Fichas más pequeñas" aria-label="Alejar">🔍−</button>
        <span class="w-10 text-center text-xs text-stone-500 dark:text-zinc-400">${Math.round(z*100)}%</span>
        <button class="${C.btn} !min-h-9 !px-2.5 !py-1 !text-xs" data-lg="zoom+" title="Fichas más grandes" aria-label="Acercar">🔍+</button>
        <button class="${C.btn} !min-h-9 !px-2.5 !py-1 !text-xs ml-auto" data-lg="full">${full ? '✕ Salir' : '⛶ Pantalla completa'}</button>
        ${full ? `<button class="${C.btn} !min-h-9 !px-2.5 !py-1 !text-xs" data-lg="girar">🔄 ${st.orient === 'landscape' ? 'Vertical' : 'Horizontal'}</button>` : ''}</div>`;
    cur = `
    <div class="rounded-xl border border-blue-300 bg-blue-50/40 p-3 dark:border-blue-800 dark:bg-blue-950/20 ${full ? 'landscape:grid landscape:grid-cols-[minmax(0,1fr)_minmax(16rem,42%)] landscape:gap-3' : ''}"><div class="min-w-0">
      ${herr}
      <div class="mb-2 flex flex-wrap items-baseline gap-2"><span class="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white dark:bg-blue-400 dark:text-zinc-950">Paso ${st.step+1} de ${steps.length}</span><b>${s.q}</b></div>
      ${st.log.length ? `<div class="mb-2 rounded-xl border border-emerald-300 bg-emerald-50/70 p-2 dark:border-emerald-800 dark:bg-emerald-950/30">
        <div class="text-[11px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">📝 Tu proceso hasta aquí</div>
        <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 overflow-x-auto text-sm">${st.log.map((l, i) => `<span class="whitespace-nowrap">${i ? '<span class="text-emerald-600">⟶</span> ' : ''}${kx(ansTex(l.built ?? steps[i].a[0]))}</span>`).join('')}</div>
        ${!s.copia && st.prev ? `<button class="${C.btn} mt-1.5 !min-h-9 !py-1 !text-xs" data-lg="usarprev">📋 Empezar desde mi paso anterior</button>` : ''}</div>` : ''}
      ${guiaHTML(st)}
      ${editorNumeroHTML(st)}
      <div data-ajuste style="zoom:${z}">${zoneHTML(key, st.root, 0)}</div>
      ${bloquesHTML(key, st)}
      <div data-desliza class="hidden mt-1.5">
        <div data-barra class="relative h-3 touch-none rounded-full bg-stone-200 dark:bg-zinc-800"><div data-pulgar class="absolute inset-y-0 left-0 rounded-full bg-blue-500 shadow"></div></div>
        <p class="mt-0.5 text-center text-[11px] font-semibold text-blue-700 dark:text-blue-300">↔ Desliza el lienzo o la barra para ver toda la fórmula</p></div>
      <p class="mt-1 text-[11px] text-stone-500 dark:text-zinc-400">Las cifras seguidas forman un solo número. <b>Mantén presionado</b> un número para ver sus cifras y cambiarlas.</p>
      ${allZones(st.root).length>1 ? `<div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-zinc-400"><span>Las piezas tocadas entran en el espacio <b class="text-blue-700 dark:text-blue-300">azul</b>.</span><span class="flex shrink-0 gap-1.5">${st.active && st.active!==st.root ? `<button class="${C.btn} !min-h-9 !py-1 !text-xs" data-lg="outzone" title="Volver al espacio de afuera">⤴ Salir</button>` : ''}<button class="${C.btn} !min-h-9 !py-1 !text-xs" data-lg="nextzone">⇥ Siguiente espacio</button></span></div>` : ''}
      ${s.reemplazar ? `<div class="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">🔁 Esta es <b>tu fórmula</b> del paso anterior. Arrastra el <b>${s.reemplazar}</b> desde 🔢 Números y suéltalo <b>encima de cada x</b> (se marca en rojo).</div>` : ''}
      </div><div class="min-w-0">
      ${paletteHTML(key, s, st)}
      ${/^[ft]-/.test(key) ? propsHTML(key, st) : ''}
      ${fb}
      <button class="${C.btnP} mt-3 !min-h-12 w-full !text-base" data-lg="check">✔ Verificar</button>
      <div class="mt-2 grid grid-cols-4 gap-2">
        <button class="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border border-stone-200 bg-white px-1 py-1.5 text-[11px] leading-tight touch-manipulation select-none transition-transform active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 " data-lg="undo"><span class="text-lg leading-none">↶</span>Deshacer</button><button class="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border border-stone-200 bg-white px-1 py-1.5 text-[11px] leading-tight touch-manipulation select-none transition-transform active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 " data-lg="clear"><span class="text-lg leading-none">🗑</span>Limpiar</button><button class="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border border-stone-200 bg-white px-1 py-1.5 text-[11px] leading-tight touch-manipulation select-none transition-transform active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 " data-lg="hint"><span class="text-lg leading-none">💡</span>Pista</button><button class="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border border-stone-200 bg-white px-1 py-1.5 text-[11px] leading-tight touch-manipulation select-none transition-transform active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 ${st.tries>=2?'ring-2 ring-amber-400':''}" data-lg="reveal"><span class="text-lg leading-none">👁</span>Solución</button>
      </div>
    </div></div>`;
  } else {
    const seen = st.log.filter(l=>l.seen).length;
    cur = `<div class="rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-3 dark:border-emerald-500 dark:bg-emerald-950/40">🎉 <b>¡Ejercicio completo!</b> ${seen?`(${seen} paso(s) con solución vista)`:'Lo armaste todo tú.'}
      <div class="mt-2"><button class="${C.btn}" data-lg="restart">↻ Repetir ejercicio</button></div></div>`;
  }
  // Pantalla completa: la tarjeta ocupa toda la pantalla (y se puede girar)
  const FULL = ['fixed','inset-0','z-[60]','!m-0','overflow-y-auto','!rounded-none','bg-stone-50','dark:bg-zinc-950','p-3'];
  card.classList.toggle('lego-full', !!st.full); FULL.forEach(c => card.classList.toggle(c, !!st.full));
  card.querySelector('[data-lego-body]').innerHTML = `<div class="mt-2 space-y-2">${st.full ? '' : logHTML}${cur}</div>`;
  ajustarLienzo(card.querySelector('[data-ajuste]'), st.zoom ?? 1);
  renderMath(card.querySelector('[data-lego-body]'));
  card.querySelector('[data-badge]').textContent = done[key] ? '✅ Resuelto' : `${Math.min(st.step,steps.length)}/${steps.length} pasos`;
}
/** Botón 🃏 Propiedades: aplica una carta del juego a lo armado (Fundamentos y tutorial). */
/** Aplicación GUIADA de una propiedad en el lienzo: el estudiante elige qué término pasa y a qué lado,
    o qué número pasa a dividir. */
function guiaHTML(st){
  const g = st.guia; if (!g) return '';
  const b = 'inline-flex min-h-10 items-center gap-1 rounded-xl border px-3 text-sm touch-manipulation active:scale-95';
  const sel = g.nodo ? `<b>${kx(tokTex(g.nodo.t))}</b>` : '';
  const txt = g.carta === 'mover'
    ? (!g.nodo ? '1️⃣ Toca en el lienzo el término que vas a <b>pasar al otro lado</b>.' : `2️⃣ Elegiste ${sel}. ¿A qué lado lo pasas? Recuerda que cambia de signo.`)
    : (!g.nodo ? '1️⃣ Toca el término cuyo <b>número</b> pasa a dividir al otro lado.' : `2️⃣ Elegiste ${sel}: su coeficiente pasa a dividir todo el otro lado.`);
  const botones = !g.nodo ? '' : g.carta === 'mover'
    ? `<button class="${b} border-blue-400 bg-white dark:bg-zinc-900" data-lg="lado:0">⬅ A la izquierda</button><button class="${b} border-blue-400 bg-white dark:bg-zinc-900" data-lg="lado:1">A la derecha ➡</button>`
    : `<button class="${b} border-blue-400 bg-white dark:bg-zinc-900" data-lg="dividir">➗ Dividir ambos lados</button>`;
  return `<div class="mb-2 rounded-xl border-2 border-violet-400 bg-violet-50 p-2.5 text-sm dark:bg-violet-950/40">
    <div class="flex items-start justify-between gap-2"><span>🃏 <b>${g.carta === 'mover' ? 'Pasar al otro lado' : 'Dividir ambos lados'}</b> · ${txt}</span><button class="h-8 w-8 shrink-0 rounded-lg" data-lg="guia-no" aria-label="Cancelar">✕</button></div>
    ${botones ? `<div class="mt-2 flex flex-wrap gap-1.5">${botones}</div>` : ''}</div>`;
}
/** Partes de un término (signo, número, letra). */
const partesTermino = n => n.mono ? [...n.partes] : [n.t];
function aplicarGuia(st, act){
  const g = st.guia, raiz = st.root, ig = raiz.findIndex(n => n.t === '=');
  if (act === 'guia-no'){ st.guia = null; return; }
  if (!g?.nodo) return;
  const i = raiz.indexOf(g.nodo), lado = i < ig ? 0 : 1;
  if (act.startsWith('lado:')){
    const destino = +act.slice(5);
    if (destino === lado){ st.msg = {ok:false, t:'Ese término ya está de ese lado: elige el otro lado.'}; return; }
    snapshot(st);
    const p = partesTermino(g.nodo); if (p[0] === '-') p[0] = '+'; else if (p[0] === '+') p[0] = '-'; else p.unshift('-');   // cambia de signo
    raiz.splice(i, 1);
    const ig2 = raiz.findIndex(n => n.t === '=');
    if (lado === 0 && ig2 === 0) raiz.unshift({t:'0'});
    if (lado === 1 && ig2 === raiz.length - 1) raiz.push({t:'0'});
    const nuevo = p.length > 1 ? hacerMono({}, p) : {t:p[0]};
    if (destino === 1) raiz.push(nuevo); else raiz.splice(raiz.findIndex(n => n.t === '='), 0, nuevo);
    st.guia = null; st.msg = {ok:true, t:'🃏 Pasaste el término al otro lado con el signo contrario. Revisa y pulsa Verificar.'};
  }
  if (act === 'dividir'){
    const p = partesTermino(g.nodo), signo = p[0] === '-' ? '-' : '', num = p.find(x => /^\d+$/.test(x)), letra = p.find(x => /^[a-zA-Zπ]$/.test(x));
    if (!num || !letra){ st.msg = {ok:false, t:'Elige un término con número y letra (por ejemplo 3x): ese número es el que pasa a dividir.'}; return; }
    snapshot(st);
    raiz.splice(i, 1, {t:letra});
    const ig2 = raiz.findIndex(n => n.t === '='), otro = lado === 0 ? raiz.splice(ig2 + 1) : raiz.splice(0, ig2);
    const den = signo ? [{t:'-'}, {t:num}] : [{t:num}], frac = {t:'frac', z:[otro, den]};
    if (lado === 0) raiz.push(frac); else raiz.unshift(frac);
    st.guia = null; st.msg = {ok:true, t:`🃏 Dividiste ambos lados entre ${signo}${num}. Revisa y pulsa Verificar.`};
  }
}
function propsHTML(key, st){
  const chip = 'inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-sm touch-manipulation active:scale-95';
  if (!st.verProps) return `<button class="${chip} mt-2 border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-100" data-lg="props">🃏 Propiedades</button>`;
  const D = typeof DefensaAlgebraica !== 'undefined' ? DefensaAlgebraica : null;
  const libres = D ? D.cartasLibres(new D.Progreso(new D.SaveRepository()), () => Object.keys(done).filter(k => done[k])) : null;   // solo las desbloqueadas en la Ruta
  const L = st.root.length && D ? D.propiedadesParaLienzo(ser(st.root), id => !libres || libres.has(id)) : [];
  st.propsLista = L;
  return `<div class="mt-2 rounded-xl border border-violet-300 bg-violet-50 p-2 dark:border-violet-700 dark:bg-violet-950/40">
    <div class="flex items-center justify-between text-xs font-semibold text-violet-900 dark:text-violet-100"><span>🃏 Propiedades que se pueden aplicar a lo que armaste</span><button data-lg="props" class="h-8 w-8 rounded-lg" aria-label="Cerrar">✕</button></div>
    <div class="mt-1.5 flex flex-wrap gap-1.5">${L.length ? L.map(c => `<button class="${chip} border-violet-400 bg-white dark:bg-zinc-900" data-lg="${c.id === 'mover' || c.id === 'div' ? 'guia:' : 'prop:'}${c.id}">${c.icon} ${c.name}</button>`).join('')
      : `<span class="text-sm text-stone-600 dark:text-zinc-300">${st.root.length ? 'Ninguna de tus cartas desbloqueadas aplica aquí (las demás se ganan en la 🗺️ Ruta).' : 'Primero arma algo en el lienzo.'}</span>`}</div></div>`;
}
const SECCION_LEGO = {f:() => FUND, d:() => DIF, z:() => [{id:'demo', lego:ejerciciosProbar()}]};   // z: pruebas del tutorial      // prefijo de la clave → temas
function legoEx(key){                 // key = <f|d>-<tema>-<i>
  const [, sec, tema, i] = key.match(/^([fdz])-(.+)-(\d+)$/);
  const ex = SECCION_LEGO[sec]().find(t=>t.id===tema).lego[+i];
  return sec === 'd' ? {num:true, ...ex} : ex;
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
    if (act==='abc'){ st.abc = !st.abc; }
    if (act==='nextzone'){ const zs = allZones(st.root); st.active = zs[(zs.indexOf(st.active||st.root)+1) % zs.length]; }
    if (act==='outzone'){ st.active = (st.active && parentZone(st.root, st.active)) || null; }
  if (act==='borrar') borrarSeleccion(st);
    if (act==='subirpot'){ const pt = st.borrar && potDenominador(st.root, st.borrar); if (pt) sacarPotencia(st, pt); }
    return renderLego(key);
  }
  const st = legoState(key), ex = legoEx(key), s = ex.steps[st.step];
  if (!act.startsWith('dig') && !/^(zoom|abc|closecat|nextzone|outzone|props)/.test(act)) st.editNum = null;   // el número editado puede desaparecer
  if (act==='check'){
    if (!st.root.length){ st.msg = {ok:false, t:'El lienzo está vacío. Arrastra piezas del banco.'}; }
    else if (s.reemplazar ? (st.rep = checkReemplazo(s, st.root)).ok : checkAnswer(s, ser(st.root), ex.num)){
      st.log.push({seen:false, built:ser(st.root)}); st.prev = clonar(st.root); st.step++; st.root=[]; st.hist=[]; st.active=null; st.tries=0;
      prepararPaso(ex, st);
      st.msg = {ok:true, t:'¡Correcto! Sigue con el siguiente paso.'};
      if (st.step>=ex.steps.length){ done[key]=true; store.set('done', done); buildNavFromHash(); }
    } else if (s.reemplazar){ st.tries++; st.msg = {ok:false, t:st.rep.t}; }
    else { st.tries++; st.msg = {ok:false, t:`Todavía no. ${st.tries>=2?'Puedes pedir la pista o ver la solución del paso.':'Revisa signos, orden y que cada espacio esté lleno.'}`}; }
  }
  if (act==='undo' && st.hist.length){ st.root = JSON.parse(st.hist.pop()); st.active=null; st.msg=null; }
  if (act==='clear'){ snapshot(st); st.root = s.copia && st.prev ? clonar(st.prev) : []; st.active=null; st.msg=null; }
  if (act==='hint'){ st.msg = {ok:true, t:'💡 '+s.h}; }
  if (act==='reveal'){ st.log.push({seen:true, built:s.a[0]}); st.prev = treeOf(s.a[0]); st.step++; st.root=[]; st.hist=[]; st.active=null; st.tries=0; st.msg=null; prepararPaso(ex, st); }
  if (act==='restart'){ delete LEGO[key]; }
  if (act==='closecat'){ st.cat=null; st.pin=false; }
  if (act==='abc'){ st.abc = !st.abc; }
  if (act==='nextzone'){ const zs = allZones(st.root); st.active = zs[(zs.indexOf(st.active||st.root)+1) % zs.length]; }
  if (act==='outzone'){ st.active = (st.active && parentZone(st.root, st.active)) || null; }
  if (act==='props'){ st.verProps = !st.verProps; }
  if (act==='borrar') borrarSeleccion(st);
  if (act==='subirpot'){ const pt = st.borrar && potDenominador(st.root, st.borrar); if (pt) sacarPotencia(st, pt); }
  if (act.startsWith('guia:')){ st.guia = {carta:act.slice(5), nodo:null}; st.verProps = false; st.msg = null; }
  if (act === 'guia-no' || act.startsWith('lado:') || act === 'dividir') aplicarGuia(st, act);
  if (act==='usarprev' && st.prev){ snapshot(st); st.root = clonar(st.prev); st.active = null; st.msg = {ok:true, t:'📋 Copié tu paso anterior al lienzo: modifícalo para escribir el siguiente.'}; }
  if (act.startsWith('dig')) accionCifras(st, act);
  if (act==='zoom+') st.zoom = Math.min(1.6, +((st.zoom ?? 1) + 0.1).toFixed(1));
  if (act==='zoom-') st.zoom = Math.max(0.5, +((st.zoom ?? 1) - 0.1).toFixed(1));
  if (act==='full') pantallaCompleta(key, !st.full);
  if (act==='girar') girar(key);
  if (act.startsWith('prop:')){ const c = (st.propsLista||[]).find(x=>x.id===act.slice(5));
    if (c){ snapshot(st); st.root = clonar(c.piezas); st.active = null; st.verProps = false; st.msg = {ok:true, t:`🃏 Aplicaste «${c.name}». Revisa el resultado y pulsa Verificar.`}; } }
  if (act==='check' && navigator.vibrate){ try{ navigator.vibrate(st.msg && st.msg.ok ? 30 : [60,40,60]); }catch(e){} }
  renderLego(key);
}
/** Panel para editar un número agrupado: sus cifras se despliegan arriba; se pueden reordenar o borrar. */
function editorNumeroHTML(st){
  const ed = st.editNum; if (!ed) return '';
  const cifras = ed.node.mono ? expandir(ed.node.partes) : ed.node.t.split(''), b = 'inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border px-2 text-sm touch-manipulation active:scale-95';
  return `<div data-editor class="mb-2 rounded-xl border-2 border-blue-400 bg-white p-2.5 shadow-lg dark:bg-zinc-900">
    <div class="flex items-center justify-between text-sm"><span>✏️ Fichas de <b>${ed.node.t}</b></span><button data-lg="dig-ok" class="${b} border-blue-600 bg-blue-600 font-semibold text-white">✓ Listo</button></div>
    <div class="mt-2 flex flex-wrap justify-center gap-1.5">${cifras.map((c, i) => `<button data-lg="dig:${i}" data-dig="${i}" style="touch-action:none" class="${b} min-h-12 min-w-12 border-b-4 border-blue-500 bg-blue-50 font-serif text-xl text-blue-950 dark:bg-blue-950/60 dark:text-blue-100 ${ed.sel === i ? 'ring-4 ring-amber-400' : ''}">${c}</button>`).join('')}</div>
    <p class="mt-1.5 text-center text-xs text-stone-500 dark:text-zinc-400">${ed.sel == null ? 'Toca una cifra para moverla o borrarla, o arrástrala al lienzo para sacarla del número.' : `Cifra «${cifras[ed.sel]}» seleccionada:`}</p>
    ${ed.sel == null ? '' : `<div class="mt-1 flex justify-center gap-1.5"><button data-lg="dig-izq" class="${b} border-stone-300 bg-white dark:border-zinc-600 dark:bg-zinc-800" ${ed.sel === 0 ? 'disabled' : ''}>◀ Mover</button><button data-lg="dig-der" class="${b} border-stone-300 bg-white dark:border-zinc-600 dark:bg-zinc-800" ${ed.sel === cifras.length - 1 ? 'disabled' : ''}>Mover ▶</button><button data-lg="dig-del" class="${b} border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">🗑 Borrar</button></div>`}
  </div>`;
}
/** Acciones del editor de cifras. */
function accionCifras(st, act){
  const ed = st.editNum; if (!ed) return;
  const d = ed.node.mono ? expandir(ed.node.partes) : ed.node.t.split('');
  if (act === 'dig-ok'){ st.editNum = null; return; }
  if (act.startsWith('dig:')){ const i = +act.slice(4); ed.sel = ed.sel === i ? null : i; return; }
  if (ed.sel == null) return;
  snapshot(st);
  if (act === 'dig-izq' && ed.sel > 0){ [d[ed.sel-1], d[ed.sel]] = [d[ed.sel], d[ed.sel-1]]; ed.sel--; }
  if (act === 'dig-der' && ed.sel < d.length-1){ [d[ed.sel+1], d[ed.sel]] = [d[ed.sel], d[ed.sel+1]]; ed.sel++; }
  if (act === 'dig-del'){ d.splice(ed.sel, 1); ed.sel = null; }
  if (d.length){ if (ed.node.mono) hacerMono(ed.node, compactar(d)); else ed.node.t = d.join(''); if (d.length === 1) st.editNum = null; }
  else { const z = allZones(st.root).find(z => z.includes(ed.node)); if (z) z.splice(z.indexOf(ed.node), 1); st.editNum = null; }
  st.msg = null;
}
/** Si las fichas no caben a lo ancho, se achican poco a poco (hasta 60 %); si aun así no caben,
    nada baja de renglón: el lienzo muestra una barra de desplazamiento visible y un aviso «desliza». */
function ajustarLienzo(el, zoom){
  if (!el) return;
  const raiz = el.firstElementChild;
  const cabe = () => raiz.scrollWidth <= raiz.clientWidth + 1;
  let f = 1;
  el.style.zoom = zoom; raiz.classList.remove('lego-scroll');
  while (!cabe() && f > 0.6){ f = +(f - 0.08).toFixed(2); el.style.zoom = zoom * f; }
  const desborda = !cabe();
  raiz.classList.toggle('lego-scroll', desborda);
  const aviso = el.parentElement.querySelector('[data-desliza]');
  if (!aviso) return;
  aviso.classList.toggle('hidden', !desborda);
  if (!desborda) return;
  // Barra de desplazamiento propia (siempre visible, también en celulares donde la del sistema se oculta)
  const barra = aviso.querySelector('[data-barra]'), pulgar = aviso.querySelector('[data-pulgar]');
  const pintar = () => { const v = raiz.clientWidth / raiz.scrollWidth, max = raiz.scrollWidth - raiz.clientWidth;
    pulgar.style.width = (v * 100) + '%'; pulgar.style.left = (max ? (raiz.scrollLeft / max) * (1 - v) * 100 : 0) + '%'; };
  raiz.onscroll = pintar; pintar();
  const mover = e => { const r = barra.getBoundingClientRect(), v = raiz.clientWidth / raiz.scrollWidth;
    const t = Math.min(1, Math.max(0, (e.clientX - r.left - v * r.width / 2) / (r.width * (1 - v))));
    raiz.scrollLeft = t * (raiz.scrollWidth - raiz.clientWidth); };
  barra.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); barra.setPointerCapture(e.pointerId); mover(e); barra.onpointermove = mover; };
  barra.onpointerup = barra.onpointercancel = () => { barra.onpointermove = null; };
}
function borrarSeleccion(st){
  const n = st.borrar; st.borrar = null; if (!n) return;
  const z = allZones(st.root).find(z => z.includes(n)); if (!z) return;
  snapshot(st); z.splice(z.indexOf(n), 1); if (st.active && !allZones(st.root).includes(st.active)) st.active = null; st.msg = null;
}
/** Pantalla completa del lienzo: usa la API del navegador si existe; si no, la tarjeta igual ocupa toda la ventana. */
function pantallaCompleta(key, on){
  const st = legoState(key), card = document.querySelector(`[data-lego="${CSS.escape(key)}"]`);
  st.full = on; document.body.classList.toggle('overflow-hidden', on);
  try {
    if (on && card?.requestFullscreen && !document.fullscreenElement) card.requestFullscreen().catch(()=>{});
    if (!on && document.fullscreenElement) document.exitFullscreen().catch(()=>{});
  } catch {}
  if (!on){ st.orient = null; try { screen.orientation?.unlock?.(); } catch {} }
}
/** Cambia entre vertical y horizontal (bloquea la orientación cuando el navegador lo permite). */
function girar(key){
  const st = legoState(key), quiero = st.orient === 'landscape' ? 'portrait' : 'landscape';
  st.orient = quiero;
  const p = screen.orientation?.lock?.(quiero);
  if (p && p.catch) p.catch(() => { st.msg = {ok:true, t:`Tu navegador no permite girar solo: gira el teléfono a ${quiero === 'landscape' ? 'horizontal' : 'vertical'}; el lienzo se acomoda.`}; renderLego(key); });
  else if (!p){ st.msg = {ok:true, t:'Gira el teléfono: el lienzo se acomoda a la orientación.'}; }
}
document.addEventListener('fullscreenchange', () => {                 // si el usuario sale con el botón «atrás», se sincroniza
  if (document.fullscreenElement) return;
  for (const key in LEGO){ if (LEGO[key].full){ LEGO[key].full = false; LEGO[key].orient = null; document.body.classList.remove('overflow-hidden'); renderLego(key); } }
});
/** Pasos con `copia`: el lienzo arranca con la fórmula que el estudiante armó en el paso anterior. */
function prepararPaso(ex, st){
  const s = ex.steps[st.step];
  if (s && s.copia && st.prev){ st.root = clonar(st.prev); st.copiado = true; }
}
function insertNode(key, zone, idx, node){
  const st = legoState(key); snapshot(st);
  zone.splice(idx ?? zone.length, 0, node);
  st.msg = null;
  st.active = node.z ? node.z[0] : (st.active || null);
}

/* ---------- Arrastrar / tocar (pointer events: mouse y táctil) ---------- */
let DRAG = null;
/** Índice de inserción consciente de filas: las piezas se agrupan por renglón (según su franja vertical)
    y dentro del renglón más cercano se decide por la mitad horizontal de cada pieza.
    Antes se comparaba con el borde superior de cada pieza, y una fracción alta adelantaba
    la inserción: por eso a veces las piezas quedaban en otro orden. */
function dropIndex(zoneEl, x, y){
  const kids = [...zoneEl.children].filter(c=>c.hasAttribute('data-n'));
  if (!kids.length) return 0;
  const rows = [];
  kids.forEach((k, i)=>{
    const r = k.getBoundingClientRect(), cy = (r.top + r.bottom)/2;
    const row = rows.find(w => cy >= w.top && cy <= w.bottom);
    if (row){ row.items.push({i, r}); row.top = Math.min(row.top, r.top); row.bottom = Math.max(row.bottom, r.bottom); }
    else rows.push({top:r.top, bottom:r.bottom, items:[{i, r}]});
  });
  let row = rows.find(w => y >= w.top && y <= w.bottom);
  if (!row){
    if (y < rows[0].top) row = rows[0];
    else row = rows.reduce((best, w) => Math.abs((w.top+w.bottom)/2 - y) < Math.abs((best.top+best.bottom)/2 - y) ? w : best);
  }
  for (const it of row.items) if (x < it.r.left + it.r.width/2) return it.i;
  return row.items.at(-1).i + 1;
}
/** Marca visual (barra azul) donde caerá la pieza. */
let CARET = null;
function showCaret(zoneEl, idx){
  if (!CARET){ CARET = document.createElement('div'); CARET.className = 'pointer-events-none fixed z-[61] w-1 rounded-full bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,.35)] transition-[left,top] duration-75'; document.body.appendChild(CARET); }
  const kids = [...zoneEl.children].filter(c=>c.hasAttribute('data-n'));
  const zr = zoneEl.getBoundingClientRect();
  let left, top, h;
  if (!kids.length){ left = zr.left + 6; top = zr.top + 4; h = zr.height - 8; }
  else if (idx < kids.length){ const r = kids[idx].getBoundingClientRect(); left = r.left - 4; top = r.top; h = r.height; }
  else { const r = kids.at(-1).getBoundingClientRect(); left = r.right + 2; top = r.top; h = r.height; }
  Object.assign(CARET.style, {left:left+'px', top:top+'px', height:Math.max(h, 18)+'px', display:'block'});
}
function hideCaret(){ if (CARET) CARET.style.display = 'none'; }
/** Pieza «x» bajo el dedo (para sustituir un valor en los pasos de reemplazo). */
function xAt(x, y, key){
  const el = document.elementFromPoint(x, y);
  const n = el && el.closest('[data-n]');
  if (!n || !n.dataset.n.startsWith(key+'|')) return null;
  const [, zid, i] = n.dataset.n.split('|'), zone = ZREG[key][+zid];
  const esVarLim = z => z.some(m => (m.t==='lim' && m.z[0]===zone) || (m.z||[]).some(esVarLim));
  if (esVarLim(legoState(key).root)) return null;          // la x de «lím x→a» no se sustituye
  const nd = zone && zone[+i];
  return nd && (nd.t === 'x' || nd.mono && nd.partes.includes('x')) ? {el:n, zone, i:+i} : null;   // también la x dentro de un monomio (−5x)
}
const puedeSustituir = key => { const s = LEGO_HOOKS[key] ? null : legoEx(key).steps[legoState(key).step]; return !!(s && s.reemplazar); };
/** Zona que contiene a la pieza dueña de `zone` (para «salir del recuadro»). */
function parentZone(root, zone){
  for (const n of root) for (const z of (n.z||[])){ if (z===zone) return root; const p = parentZone(z, zone); if (p) return p; }
  return null;
}
function zoneAt(x, y, key){
  const el = document.elementFromPoint(x, y);
  const z = el && el.closest('[data-z]');
  return z && z.dataset.z.startsWith(key+'|') ? z : null;
}
document.addEventListener('pointerdown', e=>{
  const cardEl = e.target.closest('[data-lego]'), kEd = cardEl?.dataset.lego;
  if (kEd && LEGO[kEd]?.editNum && !e.target.closest('[data-editor]')){   // tocar fuera cierra el editor
    LEGO[kEd].editNum = null; addEventListener('pointerup', () => renderLego(kEd), {once:true});
  }
  const dg = e.target.closest('[data-dig]');
  if (dg && kEd){                                                    // arrastrar una cifra fuera del número
    DRAG = {key:kEd, src:'cifra', i:+dg.dataset.dig, t:dg.textContent.trim(), el:dg, x0:e.clientX, y0:e.clientY, moved:false, lift:e.pointerType==='mouse'?0:48};
    return;
  }
  const bq = e.target.closest('[data-blq]');
  if (bq){ const [kq, iq] = bq.dataset.blq.split('|'); e.preventDefault();
    DRAG = {key:kq, src:'bloque', i:+iq, el:bq, x0:e.clientX, y0:e.clientY, moved:false, lift:e.pointerType==='mouse'?0:48}; return; }
  const tokEl = e.target.closest('[data-tok]');
  if (e.target.closest('[data-lg="borrar"]')) return;             // el clic del 🗑 lo maneja legoAction
  { const kB = e.target.closest('[data-lego]')?.dataset.lego, stB = kB && LEGO[kB];
    if (stB?.borrar && !e.target.closest('[data-n]') && !e.target.closest('[data-panel]')){ stB.borrar = null; addEventListener('pointerup', () => renderLego(kB), {once:true}); } }
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
    const nodo = DRAG.zone[DRAG.i];
    if (!LEGO_HOOKS[key] && (nodo.mono || esCifras(nodo) && nodo.t.length > 1)){          // mantener presionado un número → editar sus cifras
      const d = DRAG;
      d.timer = setTimeout(() => { if (DRAG !== d || d.moved) return; DRAG = null; legoState(key).editNum = {node:nodo, sel:null}; try { navigator.vibrate?.(20); } catch {} renderLego(key); }, 450);
    }
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
  // Desplazamiento automático: si el dedo llega al borde de la pantalla, la página se mueve
  if (e.clientY < 90) scrollBy(0, -14); else if (e.clientY > innerHeight - 90) scrollBy(0, 14);
  const r = DRAG.ghost.getBoundingClientRect();
  DRAG.ghost.style.left = (e.clientX - r.width/2)+'px';
  DRAG.ghost.style.top  = (e.clientY - DRAG.lift - r.height/2)+'px';
  document.querySelectorAll('[data-z].bg-blue-100').forEach(z=>z.classList.remove('bg-blue-100','dark:bg-blue-900/40'));
  document.querySelectorAll('[data-n].ring-4').forEach(n=>n.classList.remove('ring-4','ring-rose-400'));
  const Y = e.clientY - DRAG.lift;
  const tx = DRAG.src==='bank' && /^\d/.test(DRAG.t) && puedeSustituir(DRAG.key) ? xAt(e.clientX, Y, DRAG.key) : null;
  if (tx){ tx.el.classList.add('ring-4','ring-rose-400'); hideCaret(); return; }
  if (DRAG.src==='node'){                                             // mantener una ficha encima de otra
    const bajo = document.elementFromPoint(e.clientX, Y)?.closest('[data-n]');
    const ok = bajo && bajo !== DRAG.el && !DRAG.el.contains(bajo) && !bajo.contains(DRAG.el) && bajo.dataset.n.startsWith(DRAG.key+'|');
    const sobre = DRAG.sobre;
    if (sobre && (!ok || sobre.el !== bajo)){ sobre.el.classList.remove('lego-sena'); clearTimeout(sobre.timer); DRAG.sobre = null; }
    if (ok && !DRAG.sobre){
      const [, zid, i] = bajo.dataset.n.split('|'), zona = ZREG[DRAG.key][+zid], s = {el:bajo, zona, nodo:zona[+i], listo:false};
      if (terminoDe(s.nodo) && terminoDe(DRAG.zone[DRAG.i])){
        s.timer = setTimeout(() => { s.listo = true; bajo.classList.add('lego-sena'); buzz(15); }, 550);
        DRAG.sobre = s;
      }
    }
    if (DRAG.sobre?.listo){ hideCaret(); return; }
  }
  const z = zoneAt(e.clientX, Y, DRAG.key);
  if (z){ z.classList.add('bg-blue-100','dark:bg-blue-900/40'); showCaret(z, dropIndex(z, e.clientX, Y)); } else hideCaret();
});
document.addEventListener('pointerup', e=>{
  if (!DRAG) return;
  const d = DRAG; DRAG = null; hideCaret();
  const st = legoState(d.key);
  if (d.ghost) d.ghost.remove();
  if (d.src==='cifra'){                                              // cifra sacada del número editado
    if (!d.moved) return;                                            // un toque lo maneja el clic (seleccionar)
    const zEl = zoneAt(e.clientX, e.clientY - d.lift, d.key), ed = st.editNum;
    if (zEl && ed){ const {zone} = findZone(zEl.dataset.z), idx = dropIndex(zEl, e.clientX, e.clientY - d.lift);
      snapshot(st); const cif = ed.node.mono ? expandir(ed.node.partes) : ed.node.t.split(''); const [c] = cif.splice(d.i, 1);
      if (cif.length){ if (ed.node.mono) hacerMono(ed.node, compactar(cif)); else ed.node.t = cif.join(''); } else { const z = allZones(st.root).find(z => z.includes(ed.node)); z?.splice(z.indexOf(ed.node), 1); }
      st.editNum = null;                                             // al sacar una cifra el editor se cierra
      zone.splice(Math.min(idx, zone.length), 0, {t:c});
      st.msg = {ok:true, t:`Sacaste el ${c} del número. Recuerda: si queda pegado a otras cifras, se vuelven a juntar.`};
    }
    return renderLego(d.key);
  }
  if (d.src==='bloque'){
    if (d.moved) soltarBloque(st, d, zoneAt(e.clientX, e.clientY - d.lift, d.key), e.clientX, e.clientY - d.lift);
    renderLego(d.key);
    if (st.vibrar){ const v = elDeNodo(d.key, st.vibrar); st.vibrar = null; if (v){ v.classList.add('lego-vibrar'); setTimeout(() => v.classList.remove('lego-vibrar'), 700); } buzz([30, 40, 30]); }
    return;
  }
  if (!d.moved){                                   // toque
    if (d.src==='node' && st.guia && !st.guia.nodo){                // modo guiado: el toque elige el término
      const n = d.zone[d.i];
      if (d.zone === st.root && n.t !== '=' && !n.z && !esSigno(n)){ st.guia.nodo = n; st.msg = null; }
      else st.msg = {ok:false, t:'Toca un término completo del lienzo (no un signo ni un recuadro).'};
      renderLego(d.key); return;
    }
    if (d.src==='bank') insertNode(d.key, st.active || st.root, null, newNode(d.t));
    else { const n = d.zone[d.i]; st.borrar = st.borrar === n ? null : n; st.msg = null; }   // tocar: aparece el 🗑 flotante
    renderLego(d.key); return;
  }
  const Y = e.clientY - d.lift;
  const tx = d.src==='bank' && /^\d/.test(d.t) && puedeSustituir(d.key) ? xAt(e.clientX, Y, d.key) : null;
  if (tx){ snapshot(st); const nd = tx.zone[tx.i];
    if (nd.mono){ const hojas = nd.partes.map(q => q === 'x' ? {t:d.t, sub:true} : {t:q}); tx.zone.splice(tx.i, 1, ...hojas); }   // −5x → −5(3)
    else tx.zone.splice(tx.i, 1, {t:d.t, sub:true}); st.msg = null; buzz(12); renderLego(d.key); return; }
  if (d.sobre) clearTimeout(d.sobre.timer);
  if (d.src==='node' && d.sobre?.listo){                             // soltar sobre la ficha que hizo la seña
    const node = d.zone[d.i], {zona, nodo:bajo} = d.sobre;
    snapshot(st);
    const r = d.zone === zona ? operables(zona, node, bajo) : null;
    if (r){
      zona.splice(zona.indexOf(bajo), 1, nodoDeTermino(r)); zona.splice(zona.indexOf(node), 1);
      st.msg = {ok:true, t:'¡Operaste dos términos semejantes!'}; buzz(20); renderLego(d.key); return;
    }
    d.zone.splice(d.zone.indexOf(node), 1);                          // no se puede: queda a un lado y la de abajo vibra
    const T = terminoDe(node), aparte = T && !node.mono && T.c > 0 ? hacerMono({}, ['+', node.t]) : node;
    zona.splice(zona.indexOf(bajo) + 1, 0, aparte);
    st.msg = {ok:false, t:'Esos términos no se pueden operar (no son semejantes o están a lados distintos del «=»).'};
    renderLego(d.key);
    const elB = elDeNodo(d.key, bajo); if (elB){ elB.classList.add('lego-vibrar'); setTimeout(() => elB.classList.remove('lego-vibrar'), 700); }
    buzz([30, 40, 30]); return;
  }
  const zEl = zoneAt(e.clientX, Y, d.key);
  if (d.src==='bank'){
    if (zEl){ const {zone} = findZone(zEl.dataset.z); insertNode(d.key, zone, dropIndex(zEl,e.clientX,Y), newNode(d.t)); }
  } else {
    const node = d.zone[d.i];
    if (!zEl){ snapshot(st); d.zone.splice(d.i,1); st.active=null; }   // soltar fuera = quitar
    else {
      const {zone} = findZone(zEl.dataset.z);
      const den = node.t === 'pot' ? enDenominador(st.root, node) : null;
      if (den && zone !== den.frac.z[1] && !containsZone(node, zone)){   // potencia que sale del denominador: exponente negativo
        sacarPotencia(st, node, zone, dropIndex(zEl, e.clientX, Y));
      }
      else if (!containsZone(node, zone)){
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
document.addEventListener('pointercancel', ()=>{ if (DRAG?.sobre){ clearTimeout(DRAG.sobre.timer); DRAG.sobre.el.classList.remove('lego-sena'); } if (DRAG && DRAG.ghost) DRAG.ghost.remove(); DRAG=null; hideCaret(); });
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
// Al girar el teléfono o cambiar el tamaño, se vuelve a ajustar el tamaño de las fichas
addEventListener('resize', () => document.querySelectorAll('[data-lego] [data-ajuste]').forEach(el => { const key = el.closest('[data-lego]').dataset.lego; ajustarLienzo(el, (LEGO[key] && LEGO[key].zoom) || 1); }));

/* Escritorio: Supr / Retroceso eliminan la ficha marcada con 🗑; Esc quita la marca o cierra el editor. */
document.addEventListener('keydown', e => {
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName ?? '') || e.ctrlKey || e.metaKey) return;
  for (const k in LEGO){ const st = LEGO[k]; if (k.startsWith('demo-')) continue;
    if ((e.key === 'Delete' || e.key === 'Backspace') && st.borrar){ e.preventDefault(); borrarSeleccion(st); renderLego(k); return; }
    if (e.key === 'Escape' && (st.borrar || st.editNum)){ st.borrar = null; st.editNum = null; renderLego(k); return; }
  }
});
