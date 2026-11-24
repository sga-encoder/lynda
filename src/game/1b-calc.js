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
const TABLA_D = {sin:u => K.fn('cos', u), cos:u => K.mul([K.n(-1), K.fn('sin', u)]), exp:u => K.fn('exp', u), ln:u => K.pow(u, -1), tan:u => K.pow(K.fn('cos', u), -2)};
const cartasDerivada = () => new CardRegistry()
  .register(new CartaPatron({id:'d-suma', name:'Derivada de una suma', icon:'➕', desc:'(f + g)′ = f′ + g′'}, 'D', a => a.k === '+', a => K.add(a.a.map(K.D))))
  .register(new CartaPatron({id:'d-kf', name:'Constante por función', icon:'✖️', desc:'(k·f)′ = k·f′'}, 'D', a => !!separarConstante(a), a => { const [k, r] = separarConstante(a); return K.mul([k, K.D(r)]); }))
  .register(new CartaPatron({id:'d-cte', name:'Derivada de constante', icon:'0️⃣', desc:'(c)′ = 0'}, 'D', esConstante, () => K.n(0)))
  .register(new CartaPatron({id:'d-pot', name:'Regla de la potencia', icon:'⬇️', desc:'(xⁿ)′ = n·xⁿ⁻¹'}, 'D', a => potenciaDeX(a) !== null, a => { const n = potenciaDeX(a); return K.mul([K.n(n), K.pow(K.X, n.sub(1))]); }))
  .register(new CartaPatron({id:'d-tabla', name:'Tabla: sin, cos, eˣ, ln', icon:'📋', desc:'(sin x)′ = cos x · (eˣ)′ = eˣ'}, 'D', a => a.k === 'f' && K.isX(a.a) && !!TABLA_D[a.f], a => TABLA_D[a.f](a.a)))
  .register(new CartaPatron({id:'d-prod', name:'Regla del producto', icon:'🤝', desc:'(uv)′ = u′v + uv′'}, 'D',
    a => a.k === '*' && !separarConstante(a) && a.a.filter(f => !esConstante(f)).length >= 2,
    a => { const [u, ...r] = a.a, v = r.length === 1 ? r[0] : K.mul(r); return K.add([K.mul([K.D(u), v]), K.mul([u, K.D(v)])]); }))
  .register(new CartaPatron({id:'d-cad', name:'Regla de la cadena', icon:'⛓️', desc:'f(u)′ = f′(u)·u′'}, 'D',
    a => (a.k === 'f' && !K.isX(a.a) && K.dependeDeX(a.a) && !!TABLA_D[a.f]) || (a.k === '^' && !K.isX(a.b) && K.dependeDeX(a.b) && K.isNum(a.e)),
    a => a.k === 'f' ? K.mul([TABLA_D[a.f](a.a), K.D(a.a)]) : K.mul([a.e, K.pow(a.b, a.e.q.sub(1)), K.D(a.b)])))
  .register(new PasoLibreCard());

/* ---------- Cartas de integrales ---------- */
const TABLA_I = {cos:u => K.fn('sin', u), sin:u => K.mul([K.n(-1), K.fn('cos', u)]), exp:u => K.fn('exp', u)};
const cartaMasC = new (class extends Card {
  constructor(){ super({id:'i-c', name:'+ C', icon:'©️', desc:'Toda antiderivada lleva + C'}); }
  targets(root){ return !K.contiene(root, 'I') && !K.contiene(root, 'C') ? [[]] : []; }
  apply(root){ return K.simp(K.add([root, K.C])); }
})();
const cartasIntegral = () => new CardRegistry()
  .register(new CartaPatron({id:'i-suma', name:'Integral de una suma', icon:'➕', desc:'∫(f + g) = ∫f + ∫g'}, 'I', a => a.k === '+', a => K.add(a.a.map(K.I))))
  .register(new CartaPatron({id:'i-kf', name:'Constante afuera', icon:'✖️', desc:'∫k·f = k·∫f'}, 'I', a => !!separarConstante(a), a => { const [k, r] = separarConstante(a); return K.mul([k, K.I(r)]); }))
  .register(new CartaPatron({id:'i-cte', name:'Integral de constante', icon:'📏', desc:'∫k dx = kx'}, 'I', esConstante, a => K.mul([a, K.X])))
  .register(new CartaPatron({id:'i-pot', name:'Regla de la potencia', icon:'⬆️', desc:'∫xⁿ = xⁿ⁺¹/(n+1)'}, 'I', a => { const n = potenciaDeX(a); return n !== null && !n.equals(-1); },
    a => { const n = potenciaDeX(a).add(1); return K.mul([K.n(Q.of(1).div(n)), K.pow(K.X, n)]); }))
  .register(new CartaPatron({id:'i-ln', name:'Logaritmo', icon:'🪵', desc:'∫ 1/x dx = ln|x|'}, 'I', a => { const n = potenciaDeX(a); return n !== null && n.equals(-1); }, () => K.fn('lnabs', K.X)))
  .register(new CartaPatron({id:'i-tabla', name:'Tabla: cos, sin, eˣ', icon:'📋', desc:'∫cos x = sin x · ∫eˣ = eˣ'}, 'I', a => a.k === 'f' && K.isX(a.a) && !!TABLA_I[a.f], a => TABLA_I[a.f](a.a)))
  .register(new CartaPatron({id:'i-sust', name:'Sustitución u = kx + b', icon:'🔄', desc:'∫f(kx+b) = F(kx+b)/k'}, 'I',
    a => (a.k === 'f' && !!TABLA_I[a.f] && !!coefLineal(a.a)) || (a.k === '^' && !!coefLineal(a.b) && K.isNum(a.e) && !a.e.q.equals(-1)),
    a => {
      if (a.k === 'f'){ const k = coefLineal(a.a); return K.mul([K.n(Q.of(1).div(k)), TABLA_I[a.f](a.a)]); }
      const k = coefLineal(a.b), m = a.e.q.add(1); return K.mul([K.n(Q.of(1).div(k.mul(m))), K.pow(a.b, m)]);
    }))
  .register(cartaMasC)
  .register(new PasoLibreCard());

/* ---------- Dominios (cada área del juego) ---------- */
class Dominio {
  /** @param {{id,nombre,icon,cartas:CardRegistry,key:Function,tex:Function,resuelto:Function,mano:Function,libre:Function,piezas:Function,tipos:ProblemType[]}} o */
  constructor(o){ Object.assign(this, o); this.solver = new Solver(this.cartas.all().filter(c => !c.free), {key:o.key, resuelto:o.resuelto}); this.tipos.forEach(t => t.dominio = this); }
}
const PIEZAS_CALC = ['1','2','3','4','5','6','7','8','9','0','x','+','-','·','(',')','sin','cos','ln','e','sup','frac'];
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
const tiposIntegral = [
  new ProblemType({id:'ipoli', name:'Integrar polinomios', mode:'I', needs:['l1-'], tier:1,
    make: r => { const n = r.int(1, 4); return K.I(K.simp(K.add([K.mul([K.n(r.nonZero(1, 4) * (n + 1)), K.pow(K.X, n)]), K.mul([K.n(r1(r, -6, 6) * 2), K.X]), K.n(r1(r, -9, 9))]))); }}),
  new ProblemType({id:'itrig', name:'Integrar cos, sin, eˣ, 1/x', mode:'I', needs:['l1-'], tier:2,
    make: r => { const fs = r.shuffle([K.fn('cos', K.X), K.fn('sin', K.X), K.fn('exp', K.X), K.pow(K.X, -1)]).slice(0, 2); return K.I(K.simp(K.add(fs.map(f => K.mul([K.n(r1(r, -5, 6)), f]))))); }}),
  new ProblemType({id:'ilin', name:'Sustitución lineal', mode:'I', needs:['l2-'], tier:3,
    make: r => { const k = r.pick([2, 3, 4, 5, -2, -3]), b = r1(r, -5, 5);
      return K.I(K.simp(r.pick([K.fn('cos', K.mul([K.n(k), K.X])), K.fn('exp', K.mul([K.n(k), K.X])), K.pow(K.add([K.mul([K.n(k), K.X]), K.n(b)]), r.int(2, 4))]))); }}),
];

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
    tipos:PROBLEM_TYPES}),
  dif: new Dominio({id:'dif', nombre:'Cálculo diferencial', icon:'📈', cartas:cartasDerivada(), key:K.key, tex:(r, m) => K.tex(r, m), resuelto:r => !K.contiene(r, 'D'), normalizar:K.simp,
    mano(){ return this.cartas.all(); }, piezas:() => PIEZAS_CALC, ayudaLibre:() => 'Escribe directamente la derivada final.', libre:libreCalc(false), consigna:() => 'Deriva', tipos:tiposDerivada}),
  int: new Dominio({id:'int', nombre:'Cálculo integral', icon:'∫', cartas:cartasIntegral(), key:K.key, tex:(r, m) => K.tex(r, m), resuelto:r => !K.contiene(r, 'I') && K.contiene(r, 'C'), normalizar:K.simp,
    mano(){ return this.cartas.all(); }, piezas:() => [...PIEZAS_CALC, 'C'], ayudaLibre:() => 'Escribe la antiderivada final, con + C.', libre:libreCalc(true), consigna:() => 'Integra', tipos:tiposIntegral}),
};
