/* =====================================================================
   DEFENSA ALGEBRAICA · 1c) Dominio de Álgebra: potencias, raíces,
   logaritmos e identidades trigonométricas
   Cada propiedad es una carta (Strategy) que reconoce un patrón en
   cualquier parte de la expresión y lo reescribe. NO se simplifica
   automáticamente: cada paso lo da el jugador con una carta.
   ===================================================================== */
const A = Calc;
/** Solo aplana sumas y productos anidados (no simplifica nada más). */
function aplanar(e){
  const h = A.hijos(e).map(aplanar);
  if (e.k === '+' || e.k === '*'){
    const l = h.flatMap(x => x.k === e.k ? x.a : [x]);
    return l.length === 1 ? l[0] : e.k === '+' ? A.add(l) : A.mul(l);
  }
  return e.k === '^' ? A.pow(h[0], h[1]) : e.k === '/' ? A.div(h[0], h[1]) : e.k === 'f' ? A.fn(e.f, h[0]) : e;
}
const num = e => e.k === 'n';
const esN = (e, v) => num(e) && e.q.equals(v);
const baseYExp = f => f.k === '^' ? [f.b, f.e] : [f, A.n(1)];
const sumaExp = (a, b) => num(a) && num(b) ? A.n(a.q.add(b.q)) : A.add([a, b]);
const restaExp = (a, b) => num(a) && num(b) ? A.n(a.q.sub(b.q)) : A.add([a, A.mul([A.n(-1), b])]);
const multExp = (a, b) => num(a) && num(b) ? A.n(a.q.mul(b.q)) : A.mul([a, b]);
const potSimple = (b, e) => esN(e, 1) ? b : A.pow(b, e);
/** Si u es «−algo» devuelve «algo» (−x → x, −3x → 3x, −2 → 2); si no, null. */
function negativo(u){
  if (num(u)) return u.q.sign < 0 ? A.n(u.q.neg()) : null;
  if (u.k !== '*' || !num(u.a[0]) || u.a[0].q.sign >= 0) return null;
  const k = u.a[0].q.neg(), resto = u.a.slice(1);
  const l = k.isOne ? resto : [A.n(k), ...resto];
  return l.length === 1 ? l[0] : A.mul(l);
}
const ln = u => A.fn('ln', u);
const esF = (e, f) => e.k === 'f' && e.f === f;
const cuadradoDe = (e, f) => e.k === '^' && esN(e.e, 2) && esF(e.b, f) ? e.b.a : null;     // sin²u → u

/** Carta de álgebra: patrón sobre cualquier nodo + reescritura de ese nodo. */
class CartaAlg extends Card {
  constructor(info, coincide, transformar){ super({modes:['expr'], ...info}); Object.assign(this, {coincide, transformar}); }
  targets(root){ return [...A.recorrer(root)].filter(([e]) => { try { return this.coincide(e); } catch { return false; } }).map(([, p]) => p); }
  apply(root, p){ return aplanar(A.reemplazar(root, p, this.transformar(A.en(root, p)))); }
}
const R_ = String.raw;
/** Pares de factores con la misma base dentro de un producto. */
function parMismaBase(e){
  if (e.k !== '*') return null;
  for (let i = 0; i < e.a.length; i++) for (let j = i + 1; j < e.a.length; j++){
    const [bi] = baseYExp(e.a[i]), [bj] = baseYExp(e.a[j]);
    if (!num(bi) && A.key(bi) === A.key(bj)) return [i, j];
  }
  return null;
}
/** En una suma: índices de cos²u y de −sen²u (mismo u). */
function parCos2(e){
  if (e.k !== '+') return null;
  const menosSin2 = t => t.k === '*' && t.a.length === 2 && esN(t.a[0], -1) ? cuadradoDe(t.a[1], 'sin') : null;
  for (let i = 0; i < e.a.length; i++){ const u = cuadradoDe(e.a[i], 'cos'); if (!u) continue;
    const j = e.a.findIndex(t => menosSin2(t) && A.key(menosSin2(t)) === A.key(u)); if (j >= 0) return [i, j, u]; }
  return null;
}
const cuadradoPerfecto = q => q.isInt && q.n > 1 && Number.isInteger(Math.sqrt(q.n));

const cartasAlgebra = () => new CardRegistry()
  /* ---- Potencias ---- */
  .register(new CartaAlg({id:'p-prod', name:'Producto de potencias', icon:'✖️', desc:'Misma base: se suman los exponentes', formula:R_`a^m\cdot a^n=a^{m+n}`, pista:'Hay dos potencias con la misma base multiplicándose.'},
    e => !!parMismaBase(e),
    e => { const [i, j] = parMismaBase(e), [b, m] = baseYExp(e.a[i]), [, n] = baseYExp(e.a[j]);
      const resto = e.a.filter((_, k) => k !== i && k !== j), nueva = potSimple(b, sumaExp(m, n));
      return resto.length ? A.mul([...e.a.slice(0, i), nueva, ...resto.slice(i)]) : nueva; }))
  .register(new CartaAlg({id:'p-coc', name:'Cociente de potencias', icon:'➗', desc:'Misma base: se restan los exponentes', formula:R_`\frac{a^m}{a^n}=a^{m-n}`, pista:'Arriba y abajo está la misma base.'},
    e => e.k === '/' && !num(baseYExp(e.n)[0]) && A.key(baseYExp(e.n)[0]) === A.key(baseYExp(e.d)[0]),
    e => { const [b, m] = baseYExp(e.n), [, n] = baseYExp(e.d); return A.pow(b, restaExp(m, n)); }))
  .register(new CartaAlg({id:'p-pot', name:'Potencia de una potencia', icon:'🔁', desc:'Se multiplican los exponentes', formula:R_`(a^m)^n=a^{m\cdot n}`, pista:'Una potencia está elevada a otro exponente.'},
    e => e.k === '^' && e.b.k === '^', e => A.pow(e.b.b, multExp(e.b.e, e.e))))
  .register(new CartaAlg({id:'p-prodpot', name:'Potencia de un producto', icon:'🧺', desc:'El exponente entra a cada factor', formula:R_`(ab)^n=a^n b^n`, pista:'Un producto entre paréntesis está elevado a un exponente.'},
    e => e.k === '^' && e.b.k === '*', e => A.mul(e.b.a.map(f => A.pow(f, e.e)))))
  .register(new CartaAlg({id:'p-cocpot', name:'Potencia de un cociente', icon:'🍰', desc:'El exponente va arriba y abajo', formula:R_`\left(\frac{a}{b}\right)^n=\frac{a^n}{b^n}`, pista:'Una fracción está elevada a un exponente.'},
    e => e.k === '^' && e.b.k === '/', e => A.div(A.pow(e.b.n, e.e), A.pow(e.b.d, e.e))))
  .register(new CartaAlg({id:'p-cero', name:'Exponente cero', icon:'0️⃣', desc:'Todo número (≠0) a la 0 vale 1', formula:R_`a^0=1`, pista:'Algo está elevado a la 0.'},
    e => e.k === '^' && esN(e.e, 0), () => A.n(1)))
  .register(new CartaAlg({id:'p-uno', name:'Exponente uno', icon:'1️⃣', desc:'Elevar a la 1 no cambia nada', formula:R_`a^1=a`, pista:'Algo está elevado a la 1.'},
    e => e.k === '^' && esN(e.e, 1), e => e.b))
  /* ---- Raíces ---- */
  .register(new CartaAlg({id:'r-prod', name:'Raíz de un producto', icon:'🌿', desc:'Se reparte en cada factor', formula:R_`\sqrt{ab}=\sqrt a\,\sqrt b`, pista:'Dentro de la raíz hay un producto.'},
    e => esF(e, 'sqrt') && e.a.k === '*', e => A.mul(e.a.a.map(f => A.fn('sqrt', f)))))
  .register(new CartaAlg({id:'r-coc', name:'Raíz de un cociente', icon:'🍃', desc:'Raíz arriba y raíz abajo', formula:R_`\sqrt{\frac ab}=\frac{\sqrt a}{\sqrt b}`, pista:'Dentro de la raíz hay una fracción.'},
    e => esF(e, 'sqrt') && e.a.k === '/', e => A.div(A.fn('sqrt', e.a.n), A.fn('sqrt', e.a.d))))
  .register(new CartaAlg({id:'r-pot', name:'Raíz de una potencia', icon:'🌱', desc:'La raíz divide el exponente entre 2', formula:R_`\sqrt{a^{n}}=a^{n/2}`, pista:'Dentro de la raíz hay una potencia.'},
    e => esF(e, 'sqrt') && e.a.k === '^' && num(e.a.e), e => potSimple(e.a.b, A.n(e.a.e.q.mul(new Q(1, 2))))))
  .register(new CartaAlg({id:'r-exacta', name:'Raíz exacta', icon:'🎯', desc:'√ de un cuadrado perfecto', formula:R_`\sqrt{9}=3`, pista:'Hay la raíz de un número que es cuadrado perfecto.'},
    e => esF(e, 'sqrt') && num(e.a) && cuadradoPerfecto(e.a.q), e => A.n(Math.sqrt(e.a.q.n))))
  /* ---- Logaritmos ---- */
  .register(new CartaAlg({id:'l-prod', name:'Logaritmo de un producto', icon:'📗', desc:'Se vuelve una suma', formula:R_`\ln(ab)=\ln a+\ln b`, pista:'Dentro del logaritmo hay un producto.'},
    e => esF(e, 'ln') && e.a.k === '*', e => A.add(e.a.a.map(ln))))
  .register(new CartaAlg({id:'l-coc', name:'Logaritmo de un cociente', icon:'📘', desc:'Se vuelve una resta', formula:R_`\ln\frac ab=\ln a-\ln b`, pista:'Dentro del logaritmo hay una fracción.'},
    e => esF(e, 'ln') && e.a.k === '/', e => A.add([ln(e.a.n), A.mul([A.n(-1), ln(e.a.d)])])))
  .register(new CartaAlg({id:'l-pot', name:'Logaritmo de una potencia', icon:'📙', desc:'El exponente baja a multiplicar', formula:R_`\ln a^n=n\ln a`, pista:'Dentro del logaritmo hay una potencia o una raíz.'},
    e => esF(e, 'ln') && (e.a.k === '^' || esF(e.a, 'sqrt')),
    e => e.a.k === '^' ? A.mul([e.a.e, ln(e.a.b)]) : A.mul([A.n(new Q(1, 2)), ln(e.a.a)])))
  .register(new CartaAlg({id:'l-inv', name:'ln y eˣ se cancelan', icon:'🔄', desc:'Son funciones inversas', formula:R_`\ln e^{u}=u,\ e^{\ln u}=u`, pista:'Hay un ln de una exponencial (o al revés), ln e o ln 1.'},
    e => (esF(e, 'ln') && (esF(e.a, 'exp') || (e.a.k === 'c' && e.a.n === 'e') || esN(e.a, 1))) || (esF(e, 'exp') && esF(e.a, 'ln')),
    e => esF(e, 'exp') ? e.a.a : esF(e.a, 'exp') ? e.a.a : e.a.k === 'c' ? A.n(1) : A.n(0)))
  /* ---- Identidades trigonométricas ---- */
  .register(new CartaAlg({id:'t-pit', name:'Identidad pitagórica', icon:'📐', desc:'sen² + cos² = 1', formula:R_`\sin^2u+\cos^2u=1`, pista:'Aparecen un seno al cuadrado y un coseno al cuadrado del mismo ángulo, sumando.'},
    e => e.k === '+' && e.a.some(s => { const u = cuadradoDe(s, 'sin'); return u && e.a.some(c => { const v = cuadradoDe(c, 'cos'); return v && A.key(u) === A.key(v); }); }),
    e => { const i = e.a.findIndex(s => cuadradoDe(s, 'sin') && e.a.some(c => cuadradoDe(c, 'cos') && A.key(cuadradoDe(c, 'cos')) === A.key(cuadradoDe(s, 'sin'))));
      const u = A.key(cuadradoDe(e.a[i], 'sin')), j = e.a.findIndex(c => cuadradoDe(c, 'cos') && A.key(cuadradoDe(c, 'cos')) === u);
      const resto = e.a.filter((_, k) => k !== i && k !== j); return resto.length ? A.add([...resto, A.n(1)]) : A.n(1); }))
  .register(new CartaAlg({id:'t-tan', name:'Tangente', icon:'📏', desc:'Seno entre coseno', formula:R_`\frac{\sin u}{\cos u}=\tan u`, pista:'Hay un seno dividido entre un coseno del mismo ángulo.'},
    e => e.k === '/' && esF(e.n, 'sin') && esF(e.d, 'cos') && A.key(e.n.a) === A.key(e.d.a), e => A.fn('tan', e.n.a)))
  .register(new CartaAlg({id:'t-doble', name:'Seno del ángulo doble', icon:'✌️', desc:'2 sen u cos u = sen 2u', formula:R_`2\sin u\cos u=\sin 2u`, pista:'Hay un 2 multiplicando a un seno y un coseno del mismo ángulo.'},
    e => e.k === '*' && e.a.length === 3 && esN(e.a[0], 2) && esF(e.a[1], 'sin') && esF(e.a[2], 'cos') && A.key(e.a[1].a) === A.key(e.a[2].a),
    e => A.fn('sin', A.mul([A.n(2), e.a[1].a]))))
  .register(new CartaAlg({id:'t-cos2', name:'Coseno del ángulo doble', icon:'🌗', desc:'cos² − sen² = cos 2u', formula:R_`\cos^2u-\sin^2u=\cos 2u`, pista:'Hay un coseno al cuadrado menos un seno al cuadrado.'},
    e => !!parCos2(e),
    e => { const [i, j, u] = parCos2(e), resto = e.a.filter((_, k) => k !== i && k !== j), c = A.fn('cos', A.mul([A.n(2), u]));
      return resto.length ? A.add([...resto, c]) : c; }))
  .register(new CartaAlg({id:'t-par', name:'Paridad', icon:'🪞', desc:'sen es impar, cos es par', formula:R_`\sin(-u)=-\sin u,\ \cos(-u)=\cos u`, pista:'Hay un seno o coseno de un ángulo negativo.'},
    e => (esF(e, 'sin') || esF(e, 'cos')) && !!negativo(e.a),
    e => esF(e, 'cos') ? A.fn('cos', negativo(e.a)) : A.mul([A.n(-1), A.fn('sin', negativo(e.a))])))
  /* ---- Aritmética ---- */
  .register(new CartaAlg({id:'a-oper', name:'Operar números', icon:'🧮', desc:'Calcula lo que ya son solo números', formula:R_`2\cdot3=6`, pista:'Hay operaciones entre números que puedes calcular.'},
    e => (e.k === '+' && (e.a.filter(num).length >= 2 || e.a.some(t => esN(t, 0)))) || (e.k === '*' && (e.a.filter(num).length >= 2 || e.a.some(t => esN(t, 1))))
      || (e.k === '^' && num(e.b) && num(e.e) && e.e.q.isInt && e.e.q.n >= 0 && e.e.q.n <= 6) || (e.k === '/' && num(e.n) && num(e.d) && !e.d.q.isZero),
    e => {
      if (e.k === '^') return A.n(e.b.q.pow ? e.b.q.pow(e.e.q.n) : Q.of(e.b.q.valor ** e.e.q.n));
      if (e.k === '/') return A.n(e.n.q.div(e.d.q));
      const ns = e.a.filter(num), resto = e.a.filter(t => !num(t));
      const v = e.k === '+' ? ns.reduce((q, t) => q.add(t.q), Q.of(0)) : ns.reduce((q, t) => q.mul(t.q), Q.of(1));
      const neutro = e.k === '+' ? v.isZero : v.isOne;
      const l = neutro && resto.length ? resto : e.k === '+' ? [...resto, A.n(v)] : [A.n(v), ...resto];
      return l.length === 1 ? l[0] : e.k === '+' ? A.add(l) : A.mul(l);
    }))
  .register(new PasoLibreCard());

/* ---------- Problemas de álgebra ---------- */
const xp = n => A.pow(A.X, n), Y = {k:'v', n:'y'};
const angulo = r => { const k = r.int(1, 4); return k === 1 ? A.X : A.mul([A.n(k), A.X]); };   // x, 2x, 3x, 4x
const menos = u => A.mul([A.n(-1), u]);
/** Simplificaciones complejas: combinan raíces, fracciones y exponentes (se desbloquean más adelante en la Ruta). */
const xg = n => n === 1 ? A.X : xp(n);   // x en vez de x¹
const tiposMixtos = [
  new ProblemType({id:'amix1', name:'Mixto: potencia de un producto entre potencia', mode:'expr', needs:['f-inecuaciones-'], tier:3,
    make: r => { const a = r.int(2, 4), b = r.int(1, 3), c = r.int(2, 3); return A.div(A.pow(A.mul([xp(a), xg(b)]), c), xg(r.int(1, (a + b) * c - 1))); }}),
  new ProblemType({id:'amix2', name:'Mixto: raíz por potencia entre potencia', mode:'expr', needs:['f-inecuaciones-'], tier:3,
    make: r => { const k = r.int(2, 5), a = r.int(1, 3), b = r.int(1, 4); return A.div(A.mul([A.fn('sqrt', A.mul([A.n(k * k), xp(2 * a)])), xg(b)]), xg(r.int(1, a + b))); }}),
  new ProblemType({id:'amix3', name:'Mixto: fracción con potencias y coeficientes', mode:'expr', needs:['d-limites-'], tier:3,
    make: r => { const k = r.int(2, 4), m = r.pick([2, 4, k * k].filter(v => (k * k) % v === 0)), a = r.int(2, 3); return A.div(A.pow(A.mul([A.n(k), xp(a)]), 2), A.mul([A.n(m), xg(r.int(1, 2 * a - 1))])); }}),
  new ProblemType({id:'amix4', name:'Mixto: raíz de un cociente por potencia', mode:'expr', needs:['d-implicita-'], tier:3,
    make: r => A.mul([A.fn('sqrt', A.div(xp(2 * r.int(1, 3)), A.n(r.pick([4, 9, 16, 25])))), xg(r.int(1, 4))])}),
  new ProblemType({id:'amix5', name:'Mixto: potencia de un cociente con dos variables', mode:'expr', needs:['d-lhopital-'], tier:3,
    make: r => A.mul([A.pow(A.div(xp(r.int(2, 4)), A.pow(Y, r.int(1, 3))), r.int(2, 3)), A.pow(Y, r.int(2, 6))])}),
];
const tiposAlgebra = [
  new ProblemType({id:'apot1', name:'Potencias: producto y cociente', mode:'expr', needs:['f-potencias-'], tier:1,
    make: r => { const a = r.int(2, 5), b = r.int(2, 4), c = r.int(1, a + b - 1); return A.div(A.mul([xp(a), xp(b)]), xp(c)); }}),
  new ProblemType({id:'apot2', name:'Potencias: potencia de potencia', mode:'expr', needs:['f-potencias-'], tier:2,
    make: r => A.mul([A.pow(xp(r.int(2, 3)), r.int(2, 3)), xp(r.int(1, 4))])}),
  new ProblemType({id:'apot3', name:'Potencias: producto y cociente elevados', mode:'expr', needs:['f-potencias-'], tier:2,
    make: r => r.next() < 0.5 ? A.pow(A.mul([A.n(r.int(2, 3)), xp(r.int(2, 3))]), r.int(2, 3)) : A.pow(A.div(xp(r.int(2, 4)), Y), r.int(2, 3))}),
  new ProblemType({id:'apot0', name:'Potencias: exponentes 0 y 1', mode:'expr', needs:['f-potencias-'], tier:1,
    make: r => A.add([A.mul([A.n(r.int(2, 9)), A.pow(A.X, 0)]), A.pow(Y, 1)])}),
  new ProblemType({id:'araiz1', name:'Raíces: producto y potencias', mode:'expr', needs:['f-radicales-'], tier:2,
    make: r => A.fn('sqrt', A.mul([A.n(r.pick([4, 9, 16, 25])), xp(r.pick([2, 4, 6]))]))}),
  new ProblemType({id:'araiz2', name:'Raíces: cociente', mode:'expr', needs:['f-radicales-'], tier:3,
    make: r => A.fn('sqrt', A.div(xp(r.pick([4, 6])), A.n(r.pick([4, 9, 25]))))}),
  new ProblemType({id:'alog1', name:'Logaritmos: producto y potencia', mode:'expr', needs:['f-logaritmicas-'], tier:2,
    make: r => ln(A.mul([xp(r.int(2, 5)), Y]))}),
  new ProblemType({id:'alog2', name:'Logaritmos: cociente y ln e', mode:'expr', needs:['f-logaritmicas-'], tier:3,
    make: r => ln(A.div(xp(r.int(2, 4)), A.pow({k:'c', n:'e'}, r.int(2, 5))))}),
  new ProblemType({id:'alog3', name:'Logaritmos: inversas', mode:'expr', needs:['f-logaritmicas-'], tier:1,
    make: r => A.add([ln(A.fn('exp', A.mul([A.n(r.int(2, 6)), A.X]))), A.fn('exp', ln(Y))])}),
  new ProblemType({id:'atrig1', name:'Identidad pitagórica', mode:'expr', needs:['f-trigonometricas-'], tier:1,
    make: r => { const u = angulo(r); return A.add([A.pow(A.fn('sin', u), 2), A.n(r.int(1, 9)), A.pow(A.fn('cos', u), 2)]); }}),
  new ProblemType({id:'atrig2', name:'Tangente y paridad', mode:'expr', needs:['f-trigonometricas-'], tier:2,
    make: r => { const u = angulo(r); return r.next() < 0.5 ? A.div(A.fn('sin', u), A.fn('cos', menos(u))) : A.mul([A.n(-1), A.div(A.fn('sin', menos(u)), A.fn('cos', u))]); }}),
  new ProblemType({id:'atrig3', name:'Ángulo doble', mode:'expr', needs:['f-trigonometricas-'], tier:3,
    make: r => { const u = angulo(r), v = angulo(r), c = r.int(1, 3);
      return r.next() < 0.5 ? A.add([A.mul([A.n(2), A.fn('sin', u), A.fn('cos', u)]), A.pow(A.fn('cos', v), 2), A.mul([A.n(-1), A.pow(A.fn('sin', v), 2)])])
        : A.add([A.mul([A.n(2), A.fn('sin', u), A.fn('cos', u)]), A.n(c)]); }}),
  new ProblemType({id:'atrig4', name:'Identidades combinadas', mode:'expr', needs:['f-trigonometricas-'], tier:3,
    make: r => { const u = angulo(r); return A.add([A.div(A.fn('sin', u), A.fn('cos', u)), A.pow(A.fn('sin', u), 2), A.pow(A.fn('cos', menos(u)), 2)]); }}),
];
function distractoresAlg(correcto, rng, n = 2){
  const cands = [A.mul([A.n(2), correcto]), A.pow(correcto, 2), A.add([correcto, A.n(1)])];
  for (const [x, p] of A.recorrer(correcto)){
    if (num(x) && !x.q.isZero) for (const q of [x.q.add(1), x.q.sub(1), x.q.neg(), x.q.mul(2)]) cands.push(A.reemplazar(correcto, p, A.n(q)));
    if (esF(x, 'sin') || esF(x, 'cos')) cands.push(A.reemplazar(correcto, p, A.fn(x.f === 'sin' ? 'cos' : 'sin', x.a)));
    if (x.k === '^') cands.push(A.reemplazar(correcto, p, A.mul([x.b, x.e])));
    if (x.k === '+' && x.a.length >= 2) cands.push(A.reemplazar(correcto, p, A.mul(x.a)));
  }
  const vistos = new Set([A.key(correcto)]), out = [];
  for (const c of rng.shuffle(cands)){
    const k = A.key(c); if (vistos.has(k)) continue; vistos.add(k);
    if (A.equivalentes(c, correcto)) continue;
    out.push(aplanar(c)); if (out.length >= n) break;
  }
  return out;
}
const PIEZAS_ALG = ['1','2','3','4','5','6','7','8','9','0','x','y','e','+','-','·','(',')','frac','pot','sqrt','ln','exp','sin','cos','tan'];
const cartasAlg = cartasAlgebra();
DOMINIOS.alg = new Dominio({id:'alg', nombre:'Potencias, raíces, logaritmos y trigonometría', icon:'🔺', cartas:cartasAlg, key:A.key, tex:(r, m) => A.tex(r, m),
  resuelto: r => cartasAlg.all().every(c => c.free || !c.targets(r).length), normalizar:aplanar,
  mano(){ return this.cartas.all(); }, piezas:() => PIEZAS_ALG, ayudaLibre:() => 'Escribe la expresión del siguiente paso (debe valer lo mismo).',
  libre: (src, raiz) => {
    let e; try { e = A.parse(src); } catch (err){ return {error:err.message}; }
    if (e.k === '=') return {error:'Aquí no va “=”.'};
    if (!A.equivalentes(e, raiz)) return {error:'Ese paso cambia el valor de la expresión.'};
    if (A.key(aplanar(e)) === A.key(raiz)) return {error:'Es igual a lo que ya tienes: escribe el siguiente paso.'};
    return {raiz:aplanar(e)};
  },
  consigna:() => 'Simplifica', distractores:distractoresAlg, prellenar: r => { try { return piezasCalc(r); } catch { return []; } },
  vista: src => A.tex(aplanar(A.parse(src))), tipos:[...tiposAlgebra, ...tiposMixtos]});
