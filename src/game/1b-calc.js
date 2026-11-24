/* =====================================================================
   DEFENSA ALGEBRAICA · 1b) Dominios de Cálculo diferencial e integral
   Cada carta reconoce un patrón dentro de d/dx[·] o ∫·dx y lo transforma
   (Strategy). Se reutiliza el árbol general de src/expr.js (Calc).
   ===================================================================== */
const K = Calc;
const esConstante = e => !K.dependeDeX(e) && !K.contiene(e, 'D') && !K.contiene(e, 'I');
const separarConstante = a => {                     // k·resto con k constante
  if (a.k !== '*') return null;
  const ks = a.a.filter(esConstante), resto = a.a.filter(f => !esConstante(f));
  if (!ks.length || !resto.length) return null;
  return [ks.length === 1 ? ks[0] : K.mul(ks), resto.length === 1 ? resto[0] : K.mul(resto)];
};
const potenciaDeX = a => K.isX(a) ? Q.of(1) : (a.k === '^' && K.isX(a.b) && K.isNum(a.e)) ? a.e.q : null;
/** Si u = k·x + b (u ≠ x) devuelve k; si no, null. */
function coefLineal(u){
  if (K.isX(u)) return null;
  const termX = t => K.isX(t) ? Q.of(1) : (t.k === '*' && t.a.length === 2 && K.isNum(t.a[0]) && K.isX(t.a[1])) ? t.a[0].q : null;
  if (u.k === '*') return termX(u);
  if (u.k === '+' && u.a.length === 2){
    const [a, b] = u.a;
    if (termX(a) && K.isNum(b)) return termX(a);
    if (termX(b) && K.isNum(a)) return termX(b);
  }
  return null;
}

/** Carta que actúa sobre nodos D (derivada) o I (integral) cuyo contenido cumple un patrón. */
class CartaPatron extends Card {
  constructor(info, nodo, coincide, transformar){ super(info); Object.assign(this, {nodo, coincide, transformar}); }
  targets(root){ return [...K.recorrer(root)].filter(([e]) => e.k === this.nodo && this.coincide(e.a)).map(([, p]) => p); }
  apply(root, p){ return K.simp(K.reemplazar(root, p, this.transformar(K.en(root, p).a))); }
}

/* ---------- Cartas de derivadas ---------- */
const TABLA_D = {sin:u => K.fn('cos', u), cos:u => K.mul([K.n(-1), K.fn('sin', u)]), exp:u => K.fn('exp', u), ln:u => K.pow(u, -1), lnabs:u => K.pow(u, -1), tan:u => K.pow(K.fn('cos', u), -2)};
const cartasDerivada = () => new CardRegistry()
  .register(new CartaPatron({id:'d-suma', name:'Derivada de una suma', icon:'➕', desc:'Deriva término a término', formula:String.raw`(f+g)'=f'+g'`}, 'D', a => a.k === '+', a => K.add(a.a.map(K.D))))
  .register(new CartaPatron({id:'d-kf', name:'Constante por función', icon:'✖️', desc:'La constante sale', formula:String.raw`(kf)'=k\,f'`}, 'D', a => !!separarConstante(a), a => { const [k, r] = separarConstante(a); return K.mul([k, K.D(r)]); }))
  .register(new CartaPatron({id:'d-cte', name:'Derivada de constante', icon:'0️⃣', desc:'Una constante no cambia', formula:String.raw`(c)'=0`}, 'D', esConstante, () => K.n(0)))
  .register(new CartaPatron({id:'d-pot', name:'Regla de la potencia', icon:'⬇️', desc:'Baja el exponente', formula:String.raw`(x^n)'=nx^{n-1}`}, 'D', a => potenciaDeX(a) !== null, a => { const n = potenciaDeX(a); return K.mul([K.n(n), K.pow(K.X, n.sub(1))]); }))
  .register(new CartaPatron({id:'d-tabla', name:'Tabla de derivadas', icon:'📋', desc:'sin, cos, tan, eˣ, ln', formula:String.raw`(\sin x)'=\cos x`}, 'D', a => a.k === 'f' && K.isX(a.a) && !!TABLA_D[a.f], a => TABLA_D[a.f](a.a)))
  .register(new CartaPatron({id:'d-prod', name:'Regla del producto', icon:'🤝', desc:'Derivada de un producto', formula:String.raw`(uv)'=u'v+uv'`}, 'D',
    a => a.k === '*' && !separarConstante(a) && a.a.filter(f => !esConstante(f)).length >= 2,
    a => { const [u, ...r] = a.a, v = r.length === 1 ? r[0] : K.mul(r); return K.add([K.mul([K.D(u), v]), K.mul([u, K.D(v)])]); }))
  .register(new CartaPatron({id:'d-cad', name:'Regla de la cadena', icon:'⛓️', desc:'Afuera por adentro', formula:String.raw`f(u)'=f'(u)\,u'`}, 'D',
    a => (a.k === 'f' && !K.isX(a.a) && K.dependeDeX(a.a) && !!TABLA_D[a.f]) || (a.k === '^' && !K.isX(a.b) && K.dependeDeX(a.b) && K.isNum(a.e)),
    a => a.k === 'f' ? K.mul([TABLA_D[a.f](a.a), K.D(a.a)]) : K.mul([a.e, K.pow(a.b, a.e.q.sub(1)), K.D(a.b)])))
  .register(new PasoLibreCard());

/* ---------- Cartas de integrales ---------- */
const esSec2 = a => a.k === '^' && a.b.k === 'f' && a.b.f === 'cos' && K.isX(a.b.a) && K.isNum(a.e) && a.e.q.equals(-2);
const TABLA_I = {cos:u => K.fn('sin', u), sin:u => K.mul([K.n(-1), K.fn('cos', u)]), exp:u => K.fn('exp', u)};
const cartaMasC = new (class extends Card {
  constructor(){ super({id:'i-c', name:'+ C', icon:'©️', desc:'Toda antiderivada lleva + C', formula:String.raw`F(x)+C`}); }
  targets(root){ return !K.contiene(root, 'I') && !K.contiene(root, 'C') ? [[]] : []; }
  apply(root){ return K.simp(K.add([root, K.C])); }
})();
const cartasIntegral = () => new CardRegistry()
  .register(new CartaPatron({id:'i-suma', name:'Integral de una suma', icon:'➕', desc:'Integra término a término', formula:String.raw`\int(f+g)=\int f+\int g`}, 'I', a => a.k === '+', a => K.add(a.a.map(K.I))))
  .register(new CartaPatron({id:'i-kf', name:'Constante afuera', icon:'✖️', desc:'La constante sale', formula:String.raw`\int kf=k\int f`}, 'I', a => !!separarConstante(a), a => { const [k, r] = separarConstante(a); return K.mul([k, K.I(r)]); }))
  .register(new CartaPatron({id:'i-cte', name:'Integral de constante', icon:'📏', desc:'Una constante da kx', formula:String.raw`\int k\,dx=kx`}, 'I', esConstante, a => K.mul([a, K.X])))
  .register(new CartaPatron({id:'i-pot', name:'Regla de la potencia', icon:'⬆️', desc:'Sube el exponente', formula:String.raw`\int x^n=\tfrac{x^{n+1}}{n+1}`}, 'I', a => { const n = potenciaDeX(a); return n !== null && !n.equals(-1); },
    a => { const n = potenciaDeX(a).add(1); return K.mul([K.n(Q.of(1).div(n)), K.pow(K.X, n)]); }))
  .register(new CartaPatron({id:'i-ln', name:'Logaritmo', icon:'🪵', desc:'El caso n = −1', formula:String.raw`\int\tfrac{1}{x}=\ln|x|`}, 'I', a => { const n = potenciaDeX(a); return n !== null && n.equals(-1); }, () => K.fn('lnabs', K.X)))
  .register(new CartaPatron({id:'i-tabla', name:'Tabla de integrales', icon:'📋', desc:'cos, sin, eˣ, sec²', formula:String.raw`\int\cos x=\sin x`}, 'I',
    a => (a.k === 'f' && K.isX(a.a) && !!TABLA_I[a.f]) || esSec2(a), a => esSec2(a) ? K.fn('tan', K.X) : TABLA_I[a.f](a.a)))
  .register(new CartaPatron({id:'i-sust', name:'Sustitución u = kx + b', icon:'🔄', desc:'Cambia de variable', formula:String.raw`\int f(kx+b)=\tfrac{F(kx+b)}{k}`}, 'I',
    a => (a.k === 'f' && !!TABLA_I[a.f] && !!coefLineal(a.a)) || (a.k === '^' && !!coefLineal(a.b) && K.isNum(a.e)),
    a => {
      if (a.k === 'f'){ const k = coefLineal(a.a); return K.mul([K.n(Q.of(1).div(k)), TABLA_I[a.f](a.a)]); }
      if (a.e.q.equals(-1)) return K.mul([K.n(Q.of(1).div(coefLineal(a.b))), K.fn('lnabs', a.b)]);
      const k = coefLineal(a.b), m = a.e.q.add(1); return K.mul([K.n(Q.of(1).div(k.mul(m))), K.pow(a.b, m)]);
    }))
  .register(cartaMasC)
  .register(new PasoLibreCard());

/* ---------- Pistas conceptuales de cada carta (modo asistido leve) ---------- */
const PISTAS = {
  dist:'Hay un número multiplicando un paréntesis.', seme:'Hay términos parecidos que se pueden juntar.', mover:'Deja las x de un lado y los números del otro.',
  div:'La x tiene un número multiplicándola.', oper:'Queda una división de números por calcular.',
  'd-suma':'Es una suma: puedes derivar cada parte por separado.', 'd-kf':'Hay un número multiplicando: puede salir de la derivada.', 'd-cte':'Hay un número solo: su derivada es fácil.',
  'd-pot':'Hay una potencia de x.', 'd-tabla':'Hay una función básica de x (sin, cos, tan, eˣ, ln).', 'd-prod':'Hay dos funciones de x multiplicándose.', 'd-cad':'Hay una función dentro de otra.',
  'i-suma':'Es una suma: integra cada parte por separado.', 'i-kf':'Hay un número multiplicando: sácalo de la integral.', 'i-cte':'Hay un número solo dentro de una integral.',
  'i-pot':'Hay una potencia de x.', 'i-ln':'Aparece 1/x.', 'i-tabla':'Hay una función básica de x (cos, sin, eˣ, sec²).', 'i-sust':'Hay una función de (kx + b).', 'i-c':'Ya no quedan integrales: ¿qué falta al final?',
};

/* ---------- Dominios (cada área del juego) ---------- */
class Dominio {
  /** @param {{id,nombre,icon,cartas:CardRegistry,key:Function,tex:Function,resuelto:Function,mano:Function,libre:Function,piezas:Function,tipos:ProblemType[]}} o */
  constructor(o){
    Object.assign(this, o); this.solver = new Solver(this.cartas.all().filter(c => !c.free), {key:o.key, resuelto:o.resuelto}); this.tipos.forEach(t => t.dominio = this);
    this.cartas.all().forEach(c => c.pista ??= PISTAS[c.id]);
  }
  /** Mejor jugada según el solucionador (para el modo asistido). */
  mejorJugada(raiz){
    let mejor = null;
    for (const c of this.cartas.all().filter(c => !c.free)) c.targets(raiz).forEach((p, i) => {
      const d = this.solver.distance(c.apply(raiz, p));
      if (!mejor || d < mejor.d) mejor = {carta:c, path:p, i, d};
    });
    return mejor;
  }
  aplicables(raiz){ return new Set(this.cartas.all().filter(c => !c.free && c.targets(raiz).length).map(c => c.id)); }
}
const PIEZAS_CALC = ['1','2','3','4','5','6','7','8','9','0','x','+','-','·','(',')','sin','cos','tan','ln','e','sup','frac','sqrt'];
function libreCalc(conC){
  return (src, raiz, solucion) => {
    let e; try { e = K.parse(src); } catch (err){ return {error:err.message}; }
    if (e.k === '=') return {error:'Aquí no va “=”: escribe solo el resultado.'};
    if (conC && !K.contiene(e, 'C')) return {error:'Falta la constante de integración + C.'};
    if (!K.equivalentes(e, solucion, {constante:conC})) return {error:'Ese resultado no es correcto.'};
    return {raiz:K.simp(e)};
  };
}
const r1 = (rng, a, b) => rng.nonZero(a, b);
const tiposDerivada = [
  new ProblemType({id:'dpoli', name:'Derivar polinomios', mode:'D', needs:['d-reglas-'], tier:1,
    make: r => { const n = r.int(2, 5), m = r.int(1, n - 1); return K.D(K.simp(K.add([K.mul([K.n(r1(r, -6, 7)), K.pow(K.X, n)]), K.mul([K.n(r1(r, -9, 9)), K.pow(K.X, m)]), K.n(r1(r, -9, 9))]))); }}),
  new ProblemType({id:'dtrig', name:'Derivar sin, cos, eˣ, ln', mode:'D', needs:['d-trascendentes-'], tier:2,
    make: r => { const fs = r.shuffle(['sin', 'cos', 'exp', 'ln']).slice(0, 2); return K.D(K.simp(K.add(fs.map(f => K.mul([K.n(r1(r, -5, 6)), K.fn(f, K.X)]))))); }}),
  new ProblemType({id:'dprod', name:'Regla del producto', mode:'D', needs:['d-producto-'], tier:3,
    make: r => K.D(K.simp(K.mul([K.pow(K.X, r.int(1, 3)), K.fn(r.pick(['sin', 'cos', 'exp']), K.X)])))}),
  new ProblemType({id:'dcad', name:'Regla de la cadena', mode:'D', needs:['d-cadena-'], tier:3,
    make: r => { const k = r1(r, -4, 5), b = r1(r, -6, 6);
      return K.D(K.simp(r.pick([K.fn('sin', K.mul([K.n(k), K.pow(K.X, r.int(2, 3))])), K.fn('exp', K.mul([K.n(k), K.X])), K.pow(K.add([K.mul([K.n(k), K.X]), K.n(b)]), r.int(2, 5))]))); }}),
];
const kx = (k, f) => K.mul([K.n(k), f]);
tiposDerivada.push(
  new ProblemType({id:'dtan', name:'Derivar tangente', mode:'D', needs:['d-trascendentes-'], tier:2, make: r => K.D(K.simp(K.add([kx(r1(r, -4, 5), K.fn('tan', K.X)), kx(r1(r, -5, 5), K.pow(K.X, r.int(2, 4)))])))}),
  new ProblemType({id:'dsqrt', name:'Derivar raíces', mode:'D', needs:['d-reglas-'], tier:2, make: r => K.D(K.simp(K.add([kx(r1(r, 1, 6) * 2, K.fn('sqrt', K.X)), kx(r1(r, -5, 5), K.pow(K.X, 2))])))}),
  new ProblemType({id:'dneg', name:'Derivar potencias negativas', mode:'D', needs:['d-reglas-'], tier:2, make: r => K.D(K.simp(K.add([kx(r1(r, -6, 6), K.pow(K.X, -r.int(1, 3))), kx(r1(r, -5, 5), K.X)])))}),
  new ProblemType({id:'dcoc', name:'Derivar cocientes', mode:'D', needs:['d-producto-'], tier:3, make: r => K.D(K.simp(K.div(K.add([K.X, K.n(r1(r, -5, 5))]), K.add([K.X, K.n(r1(r, -5, 5))]))))}),
  new ProblemType({id:'dln', name:'Derivar ln(kx + b)', mode:'D', needs:['d-cadena-'], tier:3, make: r => K.D(K.simp(kx(r1(r, -3, 4), K.fn('ln', K.add([kx(r.int(2, 5), K.X), K.n(r1(r, -5, 5))])))))}),
  new ProblemType({id:'dexp2', name:'Derivar e elevado a kx²', mode:'D', needs:['d-cadena-'], tier:3, make: r => K.D(K.simp(K.fn('exp', kx(r1(r, -3, 3), K.pow(K.X, 2)))))}),
  new ProblemType({id:'dsincos', name:'Derivar sin x · cos x', mode:'D', needs:['d-producto-'], tier:3, make: r => K.D(K.simp(K.mul([K.n(r1(r, 1, 4)), K.fn('sin', K.X), K.fn('cos', K.X)])))}),
);
const tiposIntegral = [
  new ProblemType({id:'ipoli', name:'Integrar polinomios', mode:'I', needs:['l1-'], tier:1,
    make: r => { const n = r.int(1, 4); return K.I(K.simp(K.add([K.mul([K.n(r.nonZero(1, 4) * (n + 1)), K.pow(K.X, n)]), K.mul([K.n(r1(r, -6, 6) * 2), K.X]), K.n(r1(r, -9, 9))]))); }}),
  new ProblemType({id:'itrig', name:'Integrar cos, sin, eˣ, 1/x', mode:'I', needs:['l1-'], tier:2,
    make: r => { const fs = r.shuffle([K.fn('cos', K.X), K.fn('sin', K.X), K.fn('exp', K.X), K.pow(K.X, -1)]).slice(0, 2); return K.I(K.simp(K.add(fs.map(f => K.mul([K.n(r1(r, -5, 6)), f]))))); }}),
  new ProblemType({id:'isqrt', name:'Integrar raíces', mode:'I', needs:['l1-'], tier:2, make: r => K.I(K.simp(K.add([kx(r.int(1, 4) * 3, K.fn('sqrt', K.X)), K.n(r1(r, -6, 6))])))}),
  new ProblemType({id:'ineg', name:'Integrar 1/xⁿ', mode:'I', needs:['l1-'], tier:2, make: r => { const n = r.int(2, 3); return K.I(K.simp(K.add([kx(r1(r, -3, 3) * (n - 1), K.pow(K.X, -n)), kx(r1(r, -4, 4) * 2, K.X)]))); }}),
  new ProblemType({id:'irecip', name:'Integrar k/(ax + b)', mode:'I', needs:['l2-'], tier:3, make: r => K.I(K.simp(kx(r1(r, -6, 6), K.pow(K.add([kx(r.int(2, 5), K.X), K.n(r1(r, -5, 5))]), -1))))}),
  new ProblemType({id:'ilin', name:'Sustitución lineal', mode:'I', needs:['l2-'], tier:3,
    make: r => { const k = r.pick([2, 3, 4, 5, -2, -3]), b = r1(r, -5, 5);
      return K.I(K.simp(r.pick([K.fn('cos', K.mul([K.n(k), K.X])), K.fn('exp', K.mul([K.n(k), K.X])), K.pow(K.add([K.mul([K.n(k), K.X]), K.n(b)]), r.int(2, 4))]))); }}),
];

/* ---------- Modo semiautomático: resultados casi correctos (errores típicos) ---------- */
function dentroDeDI(e, p){ for (let i = 0; i < p.length; i++){ const a = K.en(e, p.slice(0, i)); if (a.k === 'D' || a.k === 'I') return true; } return false; }
function distractoresCalc(correcto, rng, n = 2){
  const k0 = K.key(correcto), libreDI = !K.contiene(correcto, 'D') && !K.contiene(correcto, 'I');
  const cands = [K.mul([K.n(-1), correcto])];
  for (const [x, p] of K.recorrer(correcto)){
    if (dentroDeDI(correcto, p)) continue;
    if (x.k === 'n' && !x.q.isZero) for (const q of [x.q.neg(), x.q.add(1), x.q.sub(1)].filter(q => !q.isZero)) cands.push(K.reemplazar(correcto, p, K.n(q)));
    if (x.k === 'f' && (x.f === 'sin' || x.f === 'cos')) cands.push(K.reemplazar(correcto, p, K.fn(x.f === 'sin' ? 'cos' : 'sin', x.a)));
  }
  const vistos = new Set([k0]), out = [];
  for (const c of rng.shuffle(cands)){
    let s; try { s = K.simp(c); } catch { continue; }
    const k = K.key(s); if (vistos.has(k)) continue; vistos.add(k);
    if (libreDI && K.equivalentes(s, correcto)) continue;
    out.push(s); if (out.length >= n) break;
  }
  return out;
}
function distractoresFund(correcto, rng, n = 2){
  const k0 = keyOf(correcto), cands = [];
  for (const [x, p] of walk(correcto)){
    if (x instanceof Num && !x.q.isZero) for (const q of [x.q.neg(), x.q.add(1), x.q.sub(1)].filter(q => !q.isZero)) cands.push(replaceAt(correcto, p, new Num(q)));
    if (x instanceof Mul) for (const k of [x.k.neg(), x.k.add(1)]) cands.push(replaceAt(correcto, p, new Mul(k, x.f)));
  }
  const vistos = new Set([k0]), out = [];
  for (const c of rng.shuffle(cands)){
    let s; try { s = normalize(c); } catch { continue; }
    const k = keyOf(s); if (vistos.has(k) || equivalent(s, correcto)) continue; vistos.add(k);
    out.push(s); if (out.length >= n) break;
  }
  return out;
}

/* ---------- Paso libre: la expresión actual se convierte en piezas para editarla ---------- */
const pz = t => ({t});
const numPz = q => q.isInt ? [pz(String(Math.abs(q.n)))] : [{t:'frac', z:[[pz(String(Math.abs(q.n)))], [pz(String(q.d))]]}];
function piezasFund(n){
  if (n instanceof Eq) return [...piezasFund(n.l), pz('='), ...piezasFund(n.r)];
  if (n instanceof Add) return n.terms.flatMap((t, i) => {
    const neg = (t instanceof Num && t.q.sign < 0) || (t instanceof Mul && t.k.sign < 0), body = piezasFund(neg ? negate(t) : t);
    return i === 0 ? (neg ? [pz('-'), ...body] : body) : [pz(neg ? '-' : '+'), ...body];
  });
  if (n instanceof Num) return n.q.sign < 0 ? [pz('-'), ...numPz(n.q)] : numPz(n.q);
  if (n instanceof X) return [pz('x')];
  if (n instanceof Mul){
    const k = n.k, pre = k.isOne ? [] : k.equals(-1) ? [pz('-')] : [...(k.sign < 0 ? [pz('-')] : []), ...numPz(k)];
    return n.f instanceof X ? [...pre, pz('x')] : [...pre, pz('('), ...piezasFund(n.f), pz(')')];
  }
  if (n instanceof Div) return [{t:'frac', z:[piezasFund(n.num), numPz(n.den)]}];
  return [];
}
function piezasCalc(e){
  const par = x => x.k === '+' ? [pz('('), ...piezasCalc(x), pz(')')] : piezasCalc(x);
  switch (e.k){
    case 'n': return e.q.sign < 0 ? [pz('-'), ...numPz(e.q)] : numPz(e.q);
    case 'v': return [pz(e.n)];
    case 'C': return [pz('C')];
    case 'c': return [pz(e.n === 'pi' ? 'π' : 'e')];
    case '+': return e.a.flatMap((t, i) => { const L = piezasCalc(t); return i === 0 || L[0]?.t === '-' ? L : [pz('+'), ...L]; });
    case '*': {
      const [f, ...r] = e.a;
      if (K.isNum(f) && r.length) return [...(f.q.isOne ? [] : f.q.equals(-1) ? [pz('-')] : piezasCalc(f)), ...r.flatMap(par)];
      return e.a.flatMap(par);
    }
    case '^':
      if (K.isNum(e.e) && e.e.q.equals(new Q(1, 2))) return [{t:'sqrt', z:[piezasCalc(e.b)]}];
      if (K.isNum(e.e) && e.e.q.sign < 0) return [{t:'frac', z:[[pz('1')], piezasCalc(K.simp(K.pow(e.b, e.e.q.neg())))]}];
      return [...(e.b.k === 'f' ? [pz('('), ...piezasCalc(e.b), pz(')')] : par(e.b)), {t:'sup', z:[piezasCalc(e.e)]}];
    case 'f':
      if (e.f === 'exp') return [pz('e'), {t:'sup', z:[piezasCalc(e.a)]}];
      return [pz(e.f === 'lnabs' ? 'ln' : e.f), pz('('), ...piezasCalc(e.a), pz(')')];
  }
  throw new Error('No se puede convertir');
}
const prellenarCalc = raiz => { try { return K.contiene(raiz, 'D') || K.contiene(raiz, 'I') ? [] : piezasCalc(raiz); } catch { return []; } };

/* ---------- Instancias de dominio ---------- */
const PIEZAS_FUND = ['1','2','3','4','5','6','7','8','9','0','x','+','-','=','(',')','·','frac'];
const cartasFund = defaultCards();
const DOMINIOS = {
  fund: new Dominio({id:'fund', nombre:'Fundamentos', icon:'🧱', cartas:cartasFund, key:keyOf, tex:(r, m) => texOf(r, m), resuelto:isSolved, normalizar:normalize,
    mano: r => cartasFund.forMode(r instanceof Eq ? 'eq' : 'expr'),
    piezas: r => r instanceof Eq ? PIEZAS_FUND : PIEZAS_FUND.filter(t => t !== '='),
    ayudaLibre: r => r instanceof Eq ? 'Escribe el siguiente paso (ecuación completa, con =).' : 'Escribe la expresión del siguiente paso.',
    libre: (src, raiz) => {
      let nueva; try { nueva = parsePieces(src); } catch (err){ return {error:err.message}; }
      if (!equivalent(raiz, nueva)) return {error:'Ese paso cambia la solución: no es equivalente.'};
      if (keyOf(nueva) === keyOf(raiz)) return {error:'Es igual a lo que ya tienes: escribe el siguiente paso.'};
      return {raiz:nueva};
    },
    consigna: r => r instanceof Eq ? 'Resuelve para x' : 'Simplifica',
    distractores:distractoresFund, prellenar:piezasFund, vista: src => texOf(parsePieces(src)),
    tipos:PROBLEM_TYPES}),
  dif: new Dominio({id:'dif', nombre:'Cálculo diferencial', icon:'📈', cartas:cartasDerivada(), key:K.key, tex:(r, m) => K.tex(r, m), resuelto:r => !K.contiene(r, 'D'), normalizar:K.simp,
    mano(){ return this.cartas.all(); }, piezas:() => PIEZAS_CALC, ayudaLibre:() => 'Escribe directamente la derivada final.', libre:libreCalc(false), consigna:() => 'Deriva', distractores:distractoresCalc, prellenar:prellenarCalc, vista: src => K.tex(K.simp(K.parse(src))), tipos:tiposDerivada}),
  int: new Dominio({id:'int', nombre:'Cálculo integral', icon:'∫', cartas:cartasIntegral(), key:K.key, tex:(r, m) => K.tex(r, m), resuelto:r => !K.contiene(r, 'I') && K.contiene(r, 'C'), normalizar:K.simp,
    mano(){ return this.cartas.all(); }, piezas:() => [...PIEZAS_CALC, 'C'], ayudaLibre:() => 'Escribe la antiderivada final, con + C.', libre:libreCalc(true), consigna:() => 'Integra', distractores:distractoresCalc, prellenar:prellenarCalc, vista: src => K.tex(K.simp(K.parse(src))), tipos:tiposIntegral}),
};
