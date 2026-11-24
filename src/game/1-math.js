/* =====================================================================
   DEFENSA ALGEBRAICA · 1) Núcleo matemático
   - Q: números racionales exactos (sin errores de redondeo).
   - Árbol de expresión inmutable (patrón Composite):
       Num(q) · X · Add([términos]) · Mul(k, f)  (coeficiente k por X o por un grupo Add)
       Div(numerador, k) · Eq(izq, der)
   - Visitantes funcionales: texOf (dibuja LaTeX), evalAt (evalúa), keyOf (clave canónica).
   - Cartas (patrón Strategy): cada propiedad sabe dónde se puede aplicar y cómo transforma.
   - Solver (BFS) mide "qué tan cerca" está del resultado: la energía depende de eso.
   - ProblemFactory (patrón Factory + Registry): genera problemas según lo desbloqueado.
   ===================================================================== */

/* ---------- Utilidades ---------- */
class EventBus {                                   // patrón Observer
  #h = new Map();
  on(type, fn){ (this.#h.get(type) ?? this.#h.set(type, []).get(type)).push(fn); return () => this.off(type, fn); }
  off(type, fn){ const a = this.#h.get(type); if (a) this.#h.set(type, a.filter(f => f !== fn)); }
  emit(type, payload){ (this.#h.get(type) ?? []).forEach(f => f(payload)); }
}
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };

class Q {
  constructor(n, d = 1){
    if (d === 0) throw new RangeError('División entre cero');
    if (d < 0){ n = -n; d = -d; }
    const g = gcd(n, d); this.n = n / g; this.d = d / g; Object.freeze(this);
  }
  static of(v){ return v instanceof Q ? v : new Q(v, 1); }
  add(o){ o = Q.of(o); return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o){ return this.add(Q.of(o).neg()); }
  mul(o){ o = Q.of(o); return new Q(this.n * o.n, this.d * o.d); }
  div(o){ o = Q.of(o); return new Q(this.n * o.d, this.d * o.n); }
  neg(){ return new Q(-this.n, this.d); }
  abs(){ return new Q(Math.abs(this.n), this.d); }
  get isZero(){ return this.n === 0; }
  get isOne(){ return this.n === 1 && this.d === 1; }
  get isInt(){ return this.d === 1; }
  get sign(){ return Math.sign(this.n); }
  equals(o){ o = Q.of(o); return this.n === o.n && this.d === o.d; }
  toTex(){ return this.d === 1 ? `${this.n}` : `${this.n < 0 ? '-' : ''}\\frac{${Math.abs(this.n)}}{${this.d}}`; }
}

class Rng {                                         // xorshift: reproducible si se da semilla
  constructor(seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0){ this.s = seed || 1; }
  next(){ let s = this.s; s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; this.s = s >>> 0; return this.s / 4294967296; }
  int(a, b){ return a + Math.floor(this.next() * (b - a + 1)); }
  nonZero(a, b){ let v; do v = this.int(a, b); while (v === 0); return v; }
  pick(arr){ return arr[Math.floor(this.next() * arr.length)]; }
  shuffle(arr){ const a = [...arr]; for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(this.next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
}

/* ---------- Árbol de expresión (Composite) ---------- */
class Expr { get children(){ return []; } withChildren(){ return this; } }
class Num extends Expr { constructor(q){ super(); this.q = Q.of(q); Object.freeze(this); } }
class X   extends Expr { constructor(){ super(); Object.freeze(this); } }
class Add extends Expr {
  constructor(terms){ super(); this.terms = Object.freeze([...terms]); Object.freeze(this); }
  get children(){ return this.terms; }
  withChildren(ch){ return new Add(ch); }
}
class Mul extends Expr {                            // k · f   (f es X o un grupo Add)
  constructor(k, f){ super(); this.k = Q.of(k); this.f = f; Object.freeze(this); }
  get children(){ return [this.f]; }
  withChildren([f]){ return new Mul(this.k, f); }
}
class Div extends Expr {                            // numerador / k
  constructor(num, den){ super(); this.num = num; this.den = Q.of(den); Object.freeze(this); }
  get children(){ return [this.num]; }
  withChildren([n]){ return new Div(n, this.den); }
}
class Eq extends Expr {
  constructor(l, r){ super(); this.l = l; this.r = r; Object.freeze(this); }
  get children(){ return [this.l, this.r]; }
  withChildren([l, r]){ return new Eq(l, r); }
}

/** Recorre el árbol entregando [nodo, ruta]. La ruta son índices de hijos. */
function* walk(node, path = []){
  yield [node, path];
  for (const [i, c] of node.children.entries()) yield* walk(c, [...path, i]);
}
const nodeAt = (root, path) => path.reduce((n, i) => n.children[i], root);
function replaceAt(root, path, repl){
  if (!path.length) return repl;
  const [i, ...rest] = path, ch = [...root.children];
  ch[i] = replaceAt(ch[i], rest, repl);
  return root.withChildren(ch);
}

/** Multiplica un término por k sin repartir dentro de los grupos. */
function scale(t, k){
  k = Q.of(k);
  if (t instanceof Num) return new Num(t.q.mul(k));
  if (t instanceof X)   return new Mul(k, t);
  if (t instanceof Mul) return new Mul(t.k.mul(k), t.f);
  if (t instanceof Div) return new Div(scale(t.num, k), t.den);
  if (t instanceof Add) return new Mul(k, t);
  throw new TypeError('No se puede escalar');
}
const negate = t => scale(t, -1);

/** Forma normal: aplana sumas, quita coeficientes 1, simplifica signos del denominador. */
function normalize(n){
  if (n instanceof Num || n instanceof X) return n;
  if (n instanceof Eq) return new Eq(normalize(n.l), normalize(n.r));
  if (n instanceof Div){
    let num = normalize(n.num), den = n.den;
    if (den.sign < 0){ num = normalize(negate(num)); den = den.neg(); }
    return den.isOne ? num : new Div(num, den);
  }
  if (n instanceof Mul){
    const f = normalize(n.f);
    if (n.k.isZero) return new Num(0);
    if (f instanceof Num) return new Num(f.q.mul(n.k));
    if (f instanceof Mul) return normalize(new Mul(n.k.mul(f.k), f.f));
    if (n.k.isOne) return f;
    return new Mul(n.k, f);
  }
  if (n instanceof Add){
    const flat = n.terms.map(normalize).flatMap(t => t instanceof Add ? t.terms : [t]);
    if (!flat.length) return new Num(0);
    return flat.length === 1 ? flat[0] : new Add(flat);
  }
  return n;
}

/* ---------- Visitantes: LaTeX, evaluación, clave ---------- */
/** Dibuja en LaTeX. `marks` (Map ruta→id) envuelve los objetivos tocables con \htmlData. */
function texOf(n, marks = null, path = []){
  const wrap = s => { const id = marks?.get(path.join('.')); return id == null ? s : `\\htmlData{t=${id}}{${s}}`; };
  const coef = k => k.isOne ? '' : k.equals(-1) ? '-' : k.toTex();
  if (n instanceof Num) return wrap(n.q.toTex());
  if (n instanceof X)   return wrap('x');
  if (n instanceof Mul){
    const inner = texOf(n.f, marks, [...path, 0]);
    return wrap(n.f instanceof X ? `${coef(n.k)}${inner}` : `${coef(n.k)}\\left(${inner}\\right)`);
  }
  if (n instanceof Div) return wrap(`\\frac{${texOf(n.num, marks, [...path, 0])}}{${n.den.toTex()}}`);
  if (n instanceof Eq)  return `${texOf(n.l, marks, [0])} = ${texOf(n.r, marks, [1])}`;
  if (n instanceof Add){
    const parts = n.terms.map((t, i) => {
      const p = [...path, i], id = marks?.get(p.join('.'));
      const neg = (t instanceof Num && t.q.sign < 0) || (t instanceof Mul && t.k.sign < 0);
      const body = texOf(neg ? negate(t) : t, id == null ? marks : null, p);   // negar conserva la forma del árbol
      const signed = i === 0 ? (neg ? `-${body}` : body) : `${neg ? '-' : '+'} ${body}`;
      return id == null ? signed : `\\htmlData{t=${id}}{${signed}}`;
    });
    return wrap(parts.join(' '));
  }
  return '?';
}
const keyOf = n => texOf(n);

function evalAt(n, x){
  x = Q.of(x);
  if (n instanceof Num) return n.q;
  if (n instanceof X)   return x;
  if (n instanceof Add) return n.terms.reduce((s, t) => s.add(evalAt(t, x)), Q.of(0));
  if (n instanceof Mul) return n.k.mul(evalAt(n.f, x));
  if (n instanceof Div) return evalAt(n.num, x).div(n.den);
  throw new TypeError('No evaluable');
}
/** Forma lineal a·x + b de una expresión (o de izq − der en una ecuación). */
function linearForm(n){
  const f = n instanceof Eq ? (v => evalAt(n.l, v).sub(evalAt(n.r, v))) : (v => evalAt(n, v));
  const b = f(0), a = f(1).sub(b);
  for (const v of [2, -3, 5]) if (!f(v).equals(a.mul(v).add(b))) return null;   // no es lineal
  return {a, b};
}
/** ¿Dos ecuaciones tienen la misma solución? ¿Dos expresiones valen lo mismo para todo x? */
function equivalent(a, b){
  if ((a instanceof Eq) !== (b instanceof Eq)) return false;
  const fa = linearForm(a), fb = linearForm(b);
  if (!fa || !fb) return false;
  if (a instanceof Eq){
    if (fa.a.isZero || fb.a.isZero) return false;
    return fa.b.div(fa.a).equals(fb.b.div(fb.a));
  }
  return fa.a.equals(fb.a) && fa.b.equals(fb.b);
}

/* ---------- Parser: convierte lo armado con piezas en un árbol ---------- */
class ParseError extends Error {}
function parsePieces(src){
  const s = src.replace(/\s+/g, '').replace(/−/g, '-');
  let i = 0;
  const eat = t => s.startsWith(t, i) ? (i += t.length, true) : false;
  const startsFactor = () => /[\d(x]/.test(s[i] ?? '') || s.startsWith('frac{', i);
  function product(a, b){
    if (a instanceof Num) return scale(b, a.q);
    if (b instanceof Num) return scale(a, b.q);
    throw new ParseError('Solo se permiten ecuaciones lineales (no x·x).');
  }
  function factor(){
    if (eat('(')){ const e = expr(); if (!eat(')')) throw new ParseError('Falta cerrar un paréntesis.'); return e; }
    if (eat('x')) return new X();
    if (eat('frac{')){
      const num = expr(); if (!eat('}{')) throw new ParseError('Fracción incompleta.');
      const den = expr(); if (!eat('}')) throw new ParseError('Fracción incompleta.');
      const lf = linearForm(den);
      if (!lf || !lf.a.isZero || lf.b.isZero) throw new ParseError('El denominador debe ser un número distinto de 0.');
      return new Div(num, lf.b);
    }
    const m = /^\d+(\.\d+)?/.exec(s.slice(i));
    if (m){ i += m[0].length; const [ent, dec = ''] = m[0].split('.'); return new Num(new Q(Number(ent + dec), 10 ** dec.length)); }
    throw new ParseError(`No entiendo "${s.slice(i, i + 6) || 'el final'}".`);
  }
  function term(){
    let f = factor();
    while (eat('·') || startsFactor()){ f = product(f, factor()); }
    return f;
  }
  function expr(){
    const terms = [];
    let sign = eat('-') ? -1 : (eat('+'), 1);
    terms.push(sign < 0 ? negate(term()) : term());
    for (;;){
      if (eat('+')) terms.push(term());
      else if (eat('-')) terms.push(negate(term()));
      else break;
    }
    return terms.length === 1 ? terms[0] : new Add(terms);
  }
  if (!s) throw new ParseError('El lienzo está vacío.');
  const left = expr();
  const out = eat('=') ? new Eq(left, expr()) : left;
  if (i < s.length) throw new ParseError(`Sobra "${s.slice(i)}".`);
  return normalize(out);
}

/* ---------- Cartas (Strategy) ---------- */
const likeKey = t => t instanceof Num ? 'c' : (t instanceof X || (t instanceof Mul && t.f instanceof X)) ? 'x' : null;
const coefOf  = t => t instanceof Num ? t.q : t instanceof X ? Q.of(1) : t.k;

class Card {
  /** @param {{id:string,name:string,icon:string,desc:string,free?:boolean}} info */
  constructor(info){ Object.assign(this, {modes:['eq', 'expr']}, info); }
  /** Rutas donde se puede aplicar. */ targets(root){ return []; }
  /** Devuelve el nuevo árbol (normalizado). */ apply(root, path){ return root; }
}
class DistributivaCard extends Card {
  constructor(){ super({id:'dist', name:'Distributiva', icon:'✳️', desc:'k(a+b) = ka + kb'}); }
  targets(root){ return [...walk(root)].filter(([n]) => n instanceof Mul && n.f instanceof Add).map(([, p]) => p); }
  apply(root, path){ const m = nodeAt(root, path); return normalize(replaceAt(root, path, new Add(m.f.terms.map(t => scale(t, m.k))))); }
}
class SemejantesCard extends Card {
  constructor(){ super({id:'seme', name:'Términos semejantes', icon:'🧲', desc:'3x + 2x = 5x · 4 − 1 = 3'}); }
  targets(root){
    return [...walk(root)].filter(([n]) => n instanceof Add && ['x', 'c'].some(k => n.terms.filter(t => likeKey(t) === k).length > 1)).map(([, p]) => p);
  }
  apply(root, path){
    const add = nodeAt(root, path), sums = {x: Q.of(0), c: Q.of(0)}, seen = new Set(), out = [];
    add.terms.forEach(t => { const k = likeKey(t); if (k) sums[k] = sums[k].add(coefOf(t)); });
    add.terms.forEach(t => {
      const k = likeKey(t);
      if (!k){ out.push(t); return; }
      if (seen.has(k)) return; seen.add(k);
      if (!sums[k].isZero) out.push(k === 'x' ? new Mul(sums[k], new X()) : new Num(sums[k]));
    });
    return normalize(replaceAt(root, path, new Add(out)));
  }
}
class MoverCard extends Card {
  constructor(){ super({id:'mover', name:'Pasar al otro lado', icon:'↔️', desc:'Lo que suma pasa restando (y viceversa)', modes:['eq']}); }
  targets(root){
    if (!(root instanceof Eq)) return [];
    return [0, 1].flatMap(s => root.children[s] instanceof Add ? root.children[s].terms.map((_, i) => [s, i]) : []);
  }
  apply(root, [s, i]){
    const side = root.children[s], other = root.children[1 - s], t = side.terms[i];
    const rest = new Add(side.terms.filter((_, j) => j !== i));
    const moved = new Add([...(other instanceof Add ? other.terms : [other]), negate(t)]);
    return normalize(s === 0 ? new Eq(rest, moved) : new Eq(moved, rest));
  }
}
class DividirCard extends Card {
  constructor(){ super({id:'div', name:'Dividir ambos lados', icon:'➗', desc:'ax = b  →  x = b / a', modes:['eq']}); }
  targets(root){
    if (!(root instanceof Eq)) return [];
    return [0, 1].filter(s => { const n = root.children[s]; return n instanceof Mul && n.f instanceof X && !n.k.isOne; }).map(s => [s]);
  }
  apply(root, [s]){
    const k = root.children[s].k, other = root.children[1 - s];
    return normalize(s === 0 ? new Eq(new X(), new Div(other, k)) : new Eq(new Div(other, k), new X()));
  }
}
class OperarCard extends Card {
  constructor(){ super({id:'oper', name:'Operar números', icon:'🧮', desc:'Calcula divisiones entre números'}); }
  targets(root){ return [...walk(root)].filter(([n]) => n instanceof Div && n.num instanceof Num).map(([, p]) => p); }
  apply(root, path){ const d = nodeAt(root, path); return normalize(replaceAt(root, path, new Num(d.num.q.div(d.den)))); }
}
class PasoLibreCard extends Card {
  constructor(){ super({id:'libre', name:'Paso libre', icon:'✍️', desc:'Escribe tú el paso con piezas', free:true}); }
}

/** Registro de cartas (Open/Closed: añadir una carta = registrar una clase nueva). */
class CardRegistry {
  #cards = new Map();
  register(card){ this.#cards.set(card.id, card); return this; }
  get(id){ return this.#cards.get(id); }
  forMode(mode){ return [...this.#cards.values()].filter(c => c.modes.includes(mode)); }
  auto(mode){ return this.forMode(mode).filter(c => !c.free); }
  all(){ return [...this.#cards.values()]; }
}
const defaultCards = () => new CardRegistry()
  .register(new DistributivaCard()).register(new SemejantesCard()).register(new MoverCard())
  .register(new DividirCard()).register(new OperarCard()).register(new PasoLibreCard());

/* ---------- ¿Está resuelto? ¿Qué tan lejos está? ---------- */
const isSolved = root => root instanceof Eq
  ? ((root.l instanceof X && root.r instanceof Num) || (root.r instanceof X && root.l instanceof Num))
  : ![...walk(root)].some(([n]) =>
      (n instanceof Mul && n.f instanceof Add) || (n instanceof Div && n.num instanceof Num) ||
      (n instanceof Add && ['x', 'c'].some(k => n.terms.filter(t => likeKey(t) === k).length > 1)));

class Solver {
  /** @param {Card[]} cards cartas automáticas que puede usar */
  constructor(cards, {maxDepth = 10, cap = 4000} = {}){ this.cards = cards; this.maxDepth = maxDepth; this.cap = cap; this.cache = new Map(); }
  neighbors(root){
    const out = [];
    for (const c of this.cards) for (const p of c.targets(root)){ try { out.push(c.apply(root, p)); } catch {} }
    return out;
  }
  /** Mínimo número de cartas para llegar al resultado (Infinity si no se encuentra). */
  distance(root){
    const k0 = keyOf(root);
    if (this.cache.has(k0)) return this.cache.get(k0);
    let frontier = [root], seen = new Set([k0]), d = 0, count = 0, res = Infinity;
    while (frontier.length && d <= this.maxDepth && count < this.cap){
      if (frontier.some(isSolved)){ res = d; break; }
      const next = [];
      for (const n of frontier) for (const m of this.neighbors(n)){
        const k = keyOf(m); if (seen.has(k)) continue; seen.add(k); next.push(m); count++;
      }
      frontier = next; d++;
    }
    this.cache.set(k0, res);
    return res;
  }
}

/* ---------- Generadores de problemas (Factory + Registry) ---------- */
class ProblemType {
  /** @param {{id,name,mode,needs:string[],tier:number,make:(rng:Rng)=>Expr}} o */
  constructor(o){ Object.assign(this, o); }
  unlocked(doneKeys){ return this.needs.every(prefix => doneKeys.some(k => k.startsWith(prefix))); }
}
const mx = (k, f) => normalize(new Mul(k, f));
const PROBLEM_TYPES = [
  new ProblemType({id:'lin1', name:'Ecuaciones ax + b = c', mode:'eq', needs:[], tier:1,
    make: r => { const x0 = r.nonZero(-9, 9), a = r.pick([2,3,4,5,6,-2,-3]), b = r.nonZero(-12, 12);
      return new Eq(new Add([mx(a, new X()), new Num(b)]), new Num(a * x0 + b)); }}),
  new ProblemType({id:'simp1', name:'Simplificar: términos semejantes', mode:'expr', needs:[], tier:1,
    make: r => { const a = r.nonZero(-6, 7), b = r.nonZero(-9, 9), c = r.nonZero(-6, 7), d = r.nonZero(-9, 9);
      return normalize(new Add(r.shuffle([mx(a, new X()), new Num(b), mx(c, new X()), new Num(d)]))); }}),
  new ProblemType({id:'lin2', name:'Ecuaciones ax + b = cx + d', mode:'eq', needs:['f-lineales-'], tier:2,
    make: r => { const x0 = r.nonZero(-8, 8), a = r.int(3, 8), c = r.int(1, a - 1) * r.pick([1, -1]), b = r.nonZero(-10, 10);
      return new Eq(new Add([mx(a, new X()), new Num(b)]), new Add([mx(c, new X()), new Num(a * x0 + b - c * x0)])); }}),
  new ProblemType({id:'simp2', name:'Simplificar con distributiva', mode:'expr', needs:['f-multdiv-'], tier:2,
    make: r => { const k = r.pick([2,3,4,5,-2,-3]), a = r.int(1, 4), b = r.nonZero(-6, 6), c = r.nonZero(-5, 5), d = r.nonZero(-9, 9);
      return normalize(new Add([new Mul(k, new Add([mx(a, new X()), new Num(b)])), mx(c, new X()), new Num(d)])); }}),
  new ProblemType({id:'dist', name:'Ecuaciones k(ax + b) = c', mode:'eq', needs:['f-multdiv-', 'f-lineales-'], tier:3,
    make: r => { const x0 = r.nonZero(-7, 7), k = r.pick([2,3,4,5,-2,-3]), a = r.int(1, 4), b = r.nonZero(-6, 6);
      return new Eq(new Mul(k, new Add([mx(a, new X()), new Num(b)])), new Num(k * (a * x0 + b))); }}),
];

class ProblemFactory {
  constructor(types, solver, rng){ this.types = types; this.solver = solver; this.rng = rng; }
  available(doneKeys){ return this.types.filter(t => t.unlocked(doneKeys)); }
  /** Problema con dificultad acorde a la misión: preferimos los tipos de mayor nivel desbloqueados. */
  create(doneKeys, mission){
    const pool = this.available(doneKeys);
    const maxTier = Math.max(...pool.map(t => t.tier));
    const weighted = pool.flatMap(t => Array(t.tier >= Math.min(maxTier, mission) ? 3 : 1).fill(t));
    for (let tries = 0; tries < 30; tries++){
      const type = this.rng.pick(weighted), root = normalize(type.make(this.rng));
      if (isSolved(root)) continue;
      const par = this.solver.distance(root);
      if (Number.isFinite(par) && par >= (type.mode === 'eq' ? 2 : 1) && par <= 9) return {type, root, par};
    }
    const root = normalize(new Eq(new Add([new Mul(2, new X()), new Num(3)]), new Num(11)));
    return {type: this.types[0], root, par: this.solver.distance(root)};
  }
}
