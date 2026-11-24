/* =====================================================================
   EXPRESIONES GENERALES (compartido por Aprender y el juego)
   - Q: racionales exactos.
   - Calc: árbol de expresión con funciones (sin, cos, tan, ln, exp, sqrt),
     potencias, derivadas D[·] e integrales ∫·dx.
       {k:'n',q} número · {k:'v',n} variable x/y · {k:'c',n} constante e/π
       {k:'+',a:[]} · {k:'*',a:[]} · {k:'^',b,e} · {k:'/',n,d} · {k:'f',f,a}
       {k:'D',a} derivada · {k:'I',a} integral · {k:'C'} constante de integración
   - parse(): lee lo armado con piezas (frac{..}{..}, sqrt{..}, ^{..}).
   - equivalentes(): compara evaluando en varios puntos.
   ===================================================================== */
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
  get valor(){ return this.n / this.d; }
  equals(o){ o = Q.of(o); return this.n === o.n && this.d === o.d; }
  toTex(){ return this.d === 1 ? `${this.n}` : `${this.n < 0 ? '-' : ''}\\frac{${Math.abs(this.n)}}{${this.d}}`; }
}

const Calc = (() => {
  /* ---------- Constructores ---------- */
  const n = v => ({k:'n', q:Q.of(v)});
  const X = {k:'v', n:'x'};
  const add = a => ({k:'+', a});
  const mul = a => ({k:'*', a});
  const pow = (b, e) => ({k:'^', b, e: typeof e === 'number' || e instanceof Q ? n(e) : e});
  const div = (nu, d) => ({k:'/', n:nu, d});
  const fn = (f, a) => ({k:'f', f, a});
  const D = a => ({k:'D', a});
  const I = a => ({k:'I', a});
  const C = {k:'C'};
  const isNum = e => e.k === 'n';
  const isX = e => e.k === 'v' && e.n === 'x';
  const hijos = e => e.k === '+' || e.k === '*' ? e.a : e.k === '^' ? [e.b, e.e] : e.k === '/' ? [e.n, e.d] : (e.k === 'f' || e.k === 'D' || e.k === 'I') ? [e.a] : [];
  const conHijos = (e, h) => e.k === '+' ? add(h) : e.k === '*' ? mul(h) : e.k === '^' ? pow(h[0], h[1]) : e.k === '/' ? div(h[0], h[1]) : e.k === 'f' ? fn(e.f, h[0]) : e.k === 'D' ? D(h[0]) : e.k === 'I' ? I(h[0]) : e;
  function* recorrer(e, p = []){ yield [e, p]; for (const [i, h] of hijos(e).entries()) yield* recorrer(h, [...p, i]); }
  const en = (e, p) => p.reduce((x, i) => hijos(x)[i], e);
  const reemplazar = (e, p, r) => { if (!p.length) return r; const [i, ...rest] = p, h = [...hijos(e)]; h[i] = reemplazar(h[i], rest, r); return conHijos(e, h); };
  const contiene = (e, k) => [...recorrer(e)].some(([x]) => x.k === k);
  const dependeDeX = e => [...recorrer(e)].some(([x]) => isX(x));

  /* ---------- Simplificación (forma normal) ---------- */
  function coefYResto(t){                    // 6·x^2 → [6, x^2]
    if (isNum(t)) return [t.q, null];
    if (t.k === '*'){ const nums = t.a.filter(isNum), resto = t.a.filter(x => !isNum(x));
      return [nums.reduce((q, x) => q.mul(x.q), Q.of(1)), resto.length ? (resto.length === 1 ? resto[0] : mul(resto)) : null]; }
    return [Q.of(1), t];
  }
  const baseExp = f => f.k === '^' && isNum(f.e) ? [f.b, f.e.q] : [f, Q.of(1)];
  function simp(e){
    const h = hijos(e).map(simp); e = conHijos(e, h);
    if (e.k === '^'){
      if (isNum(e.e) && e.e.q.isZero) return n(1);
      if (isNum(e.e) && e.e.q.isOne) return e.b;
      if (isNum(e.b) && isNum(e.e) && e.e.q.isInt && e.e.q.n >= 0 && e.e.q.n < 8) return n(Array(e.e.q.n).fill(e.b.q).reduce((a, b) => a.mul(b), Q.of(1)));
      if (e.b.k === '^' && isNum(e.b.e) && isNum(e.e)) return simp(pow(e.b.b, e.b.e.q.mul(e.e.q)));
      return e;
    }
    if (e.k === '/'){
      if (isNum(e.d)) return simp(mul([n(Q.of(1).div(e.d.q)), e.n]));
      return simp(mul([e.n, pow(e.d, -1)]));
    }
    if (e.k === '*'){
      const plano = e.a.flatMap(x => x.k === '*' ? x.a : [x]);
      let q = Q.of(1); const bases = [];
      for (const f of plano){
        if (isNum(f)){ q = q.mul(f.q); continue; }
        const [b, ex] = baseExp(f), kb = key(b), prev = bases.find(x => x.k === kb);
        if (prev) prev.e = prev.e.add(ex); else bases.push({k:kb, b, e:ex});
      }
      if (q.isZero) return n(0);
      const fs = bases.filter(x => !x.e.isZero).map(x => x.e.isOne ? x.b : pow(x.b, x.e));
      const out = q.isOne ? fs : [n(q), ...fs];
      return out.length === 0 ? n(1) : out.length === 1 ? out[0] : mul(out);
    }
    if (e.k === '+'){
      const plano = e.a.flatMap(x => x.k === '+' ? x.a : [x]);
      const grupos = [];
      for (const t of plano){
        if (t.k === 'C'){ if (!grupos.some(g => g.C)) grupos.push({C:true}); continue; }
        const [q, r] = coefYResto(t), kr = r ? key(r) : '#';
        const g = grupos.find(x => x.kr === kr);
        if (g) g.q = g.q.add(q); else grupos.push({kr, q, r});
      }
      const out = grupos.filter(g => g.C || !g.q.isZero).map(g => g.C ? C : !g.r ? n(g.q) : g.q.isOne ? g.r : simp(mul([n(g.q), g.r])));
      return out.length === 0 ? n(0) : out.length === 1 ? out[0] : add(out);
    }
    return e;
  }

  /* ---------- LaTeX (con objetivos tocables) ---------- */
  function tex(e, marcas = null, p = []){
    const w = s => { const id = marcas?.get(p.join('.')); return id == null ? s : `\\htmlData{t=${id}}{${s}}`; };
    const sub = (x, i) => tex(x, marcas, [...p, i]);
    switch (e.k){
      case 'n': return w(e.q.toTex());
      case 'v': return w(e.n);
      case 'c': return w(e.n === 'pi' ? '\\pi' : 'e');
      case 'C': return w('C');
      case 'f': {
        const arg = sub(e.a, 0);
        if (e.f === 'exp') return w(`e^{${arg}}`);
        if (e.f === 'sqrt') return w(`\\sqrt{${arg}}`);
        if (e.f === 'lnabs') return w(`\\ln\\left|${arg}\\right|`);
        const simple = e.a.k === 'v' || (e.a.k === '*' && e.a.a.length === 2 && isNum(e.a.a[0]) && isX(e.a.a[1]));
        return w(`\\${e.f}${simple ? ' ' + arg : `\\left(${arg}\\right)`}`);
      }
      case 'D': return w(`\\dfrac{d}{dx}\\left[${sub(e.a, 0)}\\right]`);
      case 'I': return w(`\\int ${['+'].includes(e.a.k) ? `\\left(${sub(e.a, 0)}\\right)` : sub(e.a, 0)}\\,dx`);
      case '^': {
        if (isNum(e.e) && e.e.q.sign < 0 && !marcas) return w(`\\frac{1}{${tex(simp(pow(e.b, e.e.q.neg())))}}`);
        const b = sub(e.b, 0), needs = !['v', 'c'].includes(e.b.k) && !(isNum(e.b) && e.b.q.sign >= 0 && e.b.q.isInt);
        return w(`${needs ? `\\left(${b}\\right)` : b}^{${sub(e.e, 1)}}`);
      }
      case '/': return w(`\\frac{${sub(e.n, 0)}}{${sub(e.d, 1)}}`);
      case '*': {
        // Factores con exponente negativo van al denominador (si no hay derivadas/integrales dentro)
        const negs = e.a.filter(f => f.k === '^' && isNum(f.e) && f.e.q.sign < 0);
        if (negs.length && !e.a.some(f => f.k === 'D' || f.k === 'I') && !marcas){
          const arriba = e.a.filter(f => !negs.includes(f)), abajo = negs.map(f => simp(pow(f.b, f.e.q.neg())));
          const q = arriba.length && isNum(arriba[0]) ? arriba[0].q : Q.of(1), resto = arriba.filter(f => !isNum(f));
          const num = resto.length ? tex(resto.length === 1 ? resto[0] : mul(resto)) : '1';
          const den = tex(abajo.length === 1 ? abajo[0] : mul(abajo));
          const signo = q.sign < 0 ? '-' : '', an = Math.abs(q.n);
          const arribaS = an === 1 ? (resto.length ? num : '1') : `${an}${resto.length ? num : ''}`;
          return w(`${signo}\\frac{${arribaS}}{${q.d === 1 ? '' : q.d}${den}}`);
        }
        const [first] = e.a;
        const partes = e.a.map((f, i) => { const s = sub(f, i); return f.k === '+' ? `\\left(${s}\\right)` : s; });
        if (isNum(first) && e.a.length > 1){
          const q = first.q, resto = partes.slice(1).join(' \\cdot ');
          const pre = q.isOne ? '' : q.equals(-1) ? '-' : q.toTex();
          const sep = q.isOne || q.equals(-1) || /^[a-z\\]/i.test(resto.replace(/^\\htmlData\{[^}]*\}\{/, '')) ? '' : ' \\cdot ';
          return w(`${pre}${sep}${resto}`);
        }
        return w(partes.join(' \\cdot '));
      }
      case '+': return w(e.a.map((t, i) => {
        let s = sub(t, i);
        if (i === 0) return s;
        return s.startsWith('-') ? `- ${s.slice(1)}` : /^\\htmlData\{[^}]*\}\{-/.test(s) ? s : `+ ${s}`;
      }).join(' '));
    }
    return '?';
  }
  const key = e => tex(e);

  /* ---------- Evaluación numérica ---------- */
  function evaluar(e, env){
    switch (e.k){
      case 'n': return e.q.valor;
      case 'v': return env[e.n] ?? NaN;
      case 'c': return e.n === 'pi' ? Math.PI : Math.E;
      case 'C': return env.C ?? 0;
      case '+': return e.a.reduce((s, t) => s + evaluar(t, env), 0);
      case '*': return e.a.reduce((s, t) => s * evaluar(t, env), 1);
      case '^': return Math.pow(evaluar(e.b, env), evaluar(e.e, env));
      case '/': return evaluar(e.n, env) / evaluar(e.d, env);
      case 'f': { const v = evaluar(e.a, env);
        return {sin:Math.sin, cos:Math.cos, tan:Math.tan, ln:Math.log, lnabs:x => Math.log(Math.abs(x)), log:Math.log10, exp:Math.exp, sqrt:Math.sqrt}[e.f](v); }
    }
    return NaN;
  }
  const PUNTOS = [0.37, 0.81, 1.23, 1.77, 2.41, 2.93, 0.55, 1.49];
  /** ¿Valen lo mismo en varios puntos? `constante`: se acepta una diferencia constante (integrales). */
  function equivalentes(a, b, {constante = false} = {}){
    let ok = 0, dif = null;
    for (const [i, x] of PUNTOS.entries()){
      const env = {x, y:PUNTOS[(i + 3) % PUNTOS.length]};
      const va = evaluar(a, env), vb = evaluar(b, env);
      if (!Number.isFinite(va) || !Number.isFinite(vb)) continue;
      const d = va - vb, tol = 1e-7 * Math.max(1, Math.abs(va), Math.abs(vb));
      if (constante){ if (dif === null) dif = d; else if (Math.abs(d - dif) > tol) return false; }
      else if (Math.abs(d) > tol) return false;
      ok++;
    }
    return ok >= 3;
  }

  /* ---------- Parser de piezas ---------- */
  class ErrorLectura extends Error {}
  const FUNCS = ['sin', 'cos', 'tan', 'ln', 'log'];
  function parse(src){
    const s = src.replace(/\s+/g, '').replace(/−/g, '-');
    let i = 0;
    const eat = t => s.startsWith(t, i) ? (i += t.length, true) : false;
    const empiezaFactor = () => i < s.length && (/[\d(xyeπ]/.test(s[i]) || s.startsWith('frac{', i) || s.startsWith('sqrt{', i) || FUNCS.some(f => s.startsWith(f, i)) || s.startsWith('C', i));
    const llaves = () => { const e = expr(); if (!eat('}')) throw new ErrorLectura('Falta cerrar un espacio.'); return e; };
    function atomo(){
      if (eat('(')){ const e = expr(); if (!eat(')')) throw new ErrorLectura('Falta cerrar un paréntesis.'); return e; }
      if (eat('frac{')){ const a = llaves(); if (!eat('{')) throw new ErrorLectura('Fracción incompleta.'); return div(a, llaves()); }
      if (eat('sqrt{')) return fn('sqrt', llaves());
      for (const f of FUNCS) if (eat(f)){ const arg = potencia(); return fn(f, arg); }
      if (eat('x')) return X;
      if (eat('y')) return {k:'v', n:'y'};
      if (eat('π')) return {k:'c', n:'pi'};
      if (eat('C')) return C;
      if (eat('e')){ if (s.startsWith('^{', i)){ i += 2; return fn('exp', llaves()); } return {k:'c', n:'e'}; }
      const m = /^\d+(\.\d+)?/.exec(s.slice(i));
      if (m){ i += m[0].length; const [ent, dec = ''] = m[0].split('.'); return n(new Q(Number(ent + dec), 10 ** dec.length)); }
      throw new ErrorLectura(`No entiendo "${s.slice(i, i + 6) || 'el final'}".`);
    }
    function potencia(){ let b = atomo(); while (eat('^{')) b = pow(b, llaves()); return b; }
    function termino(){
      const fs = [potencia()];
      for (;;){
        if (eat('·')) fs.push(potencia());
        else if (eat('÷')) fs.push(pow(potencia(), -1));
        else if (empiezaFactor()) fs.push(potencia());
        else break;
      }
      return fs.length === 1 ? fs[0] : mul(fs);
    }
    function expr(){
      const ts = []; let neg = eat('-'); if (!neg) eat('+');
      ts.push(neg ? mul([n(-1), termino()]) : termino());
      for (;;){ if (eat('+')) ts.push(termino()); else if (eat('-')) ts.push(mul([n(-1), termino()])); else break; }
      return ts.length === 1 ? ts[0] : add(ts);
    }
    if (!s) throw new ErrorLectura('El lienzo está vacío.');
    const izq = expr();
    const out = eat('=') ? {k:'=', l:izq, r:expr()} : izq;
    if (i < s.length) throw new ErrorLectura(`Sobra "${s.slice(i)}".`);
    return out;
  }
  /** Compara dos respuestas armadas con piezas: si tienen "=", el lado izquierdo debe coincidir y el derecho valer lo mismo. */
  function mismaRespuesta(a, b){
    try {
      const A = parse(a), B = parse(b);
      if ((A.k === '=') !== (B.k === '=')) return false;
      if (A.k === '=') return key(simp(A.l)) === key(simp(B.l)) && equivalentes(A.r, B.r);
      return equivalentes(A, B);
    } catch { return false; }
  }

  return {n, X, add, mul, pow, div, fn, D, I, C, isNum, isX, hijos, recorrer, en, reemplazar, contiene, dependeDeX,
          coefYResto, simp, tex, key, evaluar, equivalentes, parse, mismaRespuesta, ErrorLectura};
})();
