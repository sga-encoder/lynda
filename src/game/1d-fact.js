/* =====================================================================
   DEFENSA ALGEBRAICA · 1d) Dominio de Factorización (Planeta Ábaco)
   Cinco cartas, una por tipo de factorización. Cada carta reconoce su
   patrón en un polinomio (hasta grado 2) y lo escribe como producto.
   Son las únicas cartas que SIEMPRE preguntan: al usarlas, la mano se
   cambia por 2 tarjetas (factores correctos e incorrectos).
   ===================================================================== */
const F_ = String.raw;
const Q0 = Q.of(0);
/** Monomio c·x^g → [c, g] (o null si no es un monomio en x). */
function monoF(t){
  if (t.k === 'n') return [t.q, 0];
  if (A.isX(t)) return [Q.of(1), 1];
  if (t.k === '^' && A.isX(t.b) && t.e.k === 'n' && t.e.q.isInt && t.e.q.n > 0) return [Q.of(1), t.e.q.n];
  if (t.k === '*' && t.a.length === 2 && t.a[0].k === 'n' && t.a[1].k !== 'n'){ const m = monoF(t.a[1]); return m ? [t.a[0].q.mul(m[0]), m[1]] : null; }
  return null;
}
/** Suma de monomios → coeficientes por grado {0:…, 1:…, 2:…} (enteros), o null. */
function poliF(e){
  if (e.k !== '+') return null;
  const c = {};
  for (const t of e.a){ const m = monoF(t); if (!m || !m[0].isInt || m[1] > 2) return null; c[m[1]] = (c[m[1]] ?? Q0).add(m[0]); }
  return {a:c[2]?.n ?? 0, b:c[1]?.n ?? 0, c:c[0]?.n ?? 0, n:e.a.length};
}
/** Término c·x^g y binomio αx + β, con la forma más limpia. */
function terminoF(q, g){
  q = Q.of(q); if (q.isZero) return null;
  const v = g === 0 ? null : g === 1 ? A.X : A.pow(A.X, g);
  if (!v) return A.n(q);
  return q.isOne ? v : A.mul([A.n(q), v]);
}
const binF = (al, be) => A.add([terminoF(al, 1), terminoF(be, 0)].filter(Boolean));
const raizEntera = v => { const s = Math.round(Math.sqrt(v)); return v > 0 && s * s === v ? s : 0; };
const mcd = (...l) => l.reduce((g, v) => { v = Math.abs(v); while (v){ [g, v] = [v, g % v]; } return g; }, 0) || 1;
/** Pares de enteros con p·q = c y p + q = b. */
function paresF(b, c){
  const out = [];
  for (let p = -Math.abs(c) - 1; p <= Math.abs(c) + 1; p++){ if (p === 0 || c % p) continue; const q = c / p; if (p + q === b && p <= q) out.push([p, q]); }
  return out;
}

/** Carta de factorización: patrón (sobre una suma) + factorización + una respuesta incorrecta creíble. */
class CartaFactor extends Card {
  constructor(info, factorizar, erronea){ super({modes:['expr'], preguntaFactores:true, ...info}); Object.assign(this, {factorizar, erronea}); }
  targets(root){ return [...A.recorrer(root)].filter(([e]) => { try { return !!this.factorizar(e); } catch { return false; } }).map(([, p]) => p); }
  apply(root, p){ return aplanar(A.reemplazar(root, p, this.factorizar(A.en(root, p)))); }
  /** Las 2 tarjetas: el nodo factorizado bien y uno mal (para la pregunta). */
  tarjetas(root, p, rng){
    const e = A.en(root, p), bien = this.factorizar(e);
    let mal = null; try { mal = this.erronea(e, rng); } catch {}
    if (!mal || A.key(aplanar(mal)) === A.key(aplanar(bien))) mal = A.mul([A.n(-1), bien]);   // por si acaso, siempre hay una incorrecta
    return {bien:aplanar(bien), mal:aplanar(mal)};
  }
}

const cartasFactorizacion = () => new CardRegistry()
  .register(new CartaFactor({id:'f-comun', name:'Factor común', icon:'🧲', desc:'Saca lo que se repite en todos los términos', formula:F_`ab+ac=a(b+c)`, pista:'Todos los términos comparten un número o una x.'},
    e => { const P = poliF(e); if (!P || P.n < 2) return null;
      const g = mcd(P.a, P.b, P.c), m = P.c ? 0 : P.b ? 1 : 2; if (g === 1 && m === 0) return null;
      const div = (q, gr) => terminoF(q / g, gr - m);
      const dentro = [div(P.a, 2), div(P.b, 1), div(P.c, 0)].filter(Boolean); if (dentro.length < 2) return null;
      return A.mul([...(g > 1 ? [A.n(g)] : []), ...(m ? [m === 1 ? A.X : A.pow(A.X, m)] : []), A.add(dentro)]); },
    e => { const P = poliF(e), g = mcd(P.a, P.b, P.c), m = P.c ? 0 : P.b ? 1 : 2;   // error típico: no dividir el último término
      const dentro = [terminoF(P.a / g, 2 - m), terminoF(P.b / g, 1 - m), terminoF(P.c, 0)].filter(Boolean);
      return A.mul([...(g > 1 ? [A.n(g)] : []), ...(m ? [m === 1 ? A.X : A.pow(A.X, m)] : []), A.add(dentro.length > 1 ? dentro : [...dentro, A.n(1)])]); }))
  .register(new CartaFactor({id:'f-difcuad', name:'Diferencia de cuadrados', icon:'⚔️', desc:'a² − b² se abre en suma por diferencia', formula:F_`a^2-b^2=(a+b)(a-b)`, pista:'Dos cuadrados perfectos restándose, sin término en x.'},
    e => { const P = poliF(e); if (!P || P.n !== 2 || P.b || P.c >= 0) return null; const s = raizEntera(P.a), t = raizEntera(-P.c); if (!s || !t) return null;
      return A.mul([binF(s, t), binF(s, -t)]); },
    e => { const P = poliF(e), s = raizEntera(P.a), t = raizEntera(-P.c); return A.pow(binF(s, -t), 2); }))
  .register(new CartaFactor({id:'f-tcp', name:'Trinomio cuadrado perfecto', icon:'🟪', desc:'a² ± 2ab + b² es un binomio al cuadrado', formula:F_`a^2+2ab+b^2=(a+b)^2`, pista:'Primero y último son cuadrados; el del medio es el doble de sus raíces.'},
    e => { const P = poliF(e); if (!P || P.n !== 3) return null; const s = raizEntera(P.a), t = raizEntera(P.c); if (!s || !t || Math.abs(P.b) !== 2 * s * t) return null;
      return A.pow(binF(s, Math.sign(P.b) * t), 2); },
    e => { const P = poliF(e), s = raizEntera(P.a), t = raizEntera(P.c); return A.pow(binF(s, -Math.sign(P.b) * t), 2); }))
  .register(new CartaFactor({id:'f-trin1', name:'Trinomio x² + bx + c', icon:'🔍', desc:'Dos números que multiplicados dan c y sumados dan b', formula:F_`x^2+bx+c=(x+p)(x+q)`, pista:'Busca dos números: su producto es el término independiente y su suma, el de la x.'},
    e => { const P = poliF(e); if (!P || P.n !== 3 || P.a !== 1 || !P.b || !P.c) return null; const [par] = paresF(P.b, P.c); if (!par) return null;
      return A.mul([binF(1, par[0]), binF(1, par[1])]); },
    (e, rng) => { const P = poliF(e), [p, q] = paresF(P.b, P.c)[0];
      const otros = []; for (let k = 1; k <= Math.abs(P.c); k++) if (P.c % k === 0){ const a = k, b = P.c / k; if (a + b !== P.b) otros.push([a, b]); if (-a + -b !== P.b) otros.push([-a, -b]); }
      const [r, s] = otros.length ? rng.pick(otros) : [-p, -q];          // producto correcto pero suma equivocada (o signos al revés)
      return A.mul([binF(1, r), binF(1, s)]); }))
  .register(new CartaFactor({id:'f-trin2', name:'Trinomio ax² + bx + c', icon:'🧠', desc:'Se abre en dos binomios con coeficientes en la x', formula:F_`ax^2+bx+c=(\alpha x+\beta)(\gamma x+\delta)`, pista:'Prueba factores de a y de c hasta que los productos cruzados sumen b.'},
    e => { const P = poliF(e); if (!P || P.n !== 3 || P.a <= 1 || !P.b || !P.c || mcd(P.a, P.b, P.c) > 1) return null;
      for (let al = 1; al <= P.a; al++){ if (P.a % al) continue; const ga = P.a / al;
        for (let be = -Math.abs(P.c); be <= Math.abs(P.c); be++){ if (!be || P.c % be) continue; const de = P.c / be; if (al * de + be * ga === P.b) return A.mul([binF(al, be), binF(ga, de)]); } }
      return null; },
    e => { const f = A.en(e, []), P = poliF(e);
      for (let al = 1; al <= P.a; al++){ if (P.a % al) continue; const ga = P.a / al;
        for (let be = -Math.abs(P.c); be <= Math.abs(P.c); be++){ if (!be || P.c % be) continue; const de = P.c / be; if (al * de + be * ga === P.b) return A.mul([binF(al, de), binF(ga, be)]); } }   // β y δ intercambiados
      return null; }))
  .register(new PasoLibreCard());

/* ---------- Problemas «Factoriza» ---------- */
const sumaF = (...t) => A.add(t.filter(Boolean));
const tiposFactorizacion = [
  new ProblemType({id:'fac1', name:'Factor común', mode:'expr', needs:['f-factorizacion-'], tier:1,
    make: r => { if (r.next() < 0.5){ const k = r.int(2, 6); let a = r.int(1, 5), b = r.int(1, 9) * r.pick([1, -1]); while (mcd(a, b) > 1) b += b > 0 ? 1 : -1; return sumaF(terminoF(k * a, 1), terminoF(k * b, 0)); }
      const a = r.int(1, 6), b = r.int(1, 9) * r.pick([1, -1]); return sumaF(terminoF(a, 2), terminoF(b, 1)); }}),
  new ProblemType({id:'fac2', name:'Diferencia de cuadrados', mode:'expr', needs:['f-factorizacion-'], tier:1,
    make: r => { const s = r.pick([1, 1, 2, 3]), t = r.int(1, 9); return sumaF(terminoF(s * s, 2), terminoF(-t * t, 0)); }}),
  new ProblemType({id:'fac3', name:'Trinomio cuadrado perfecto', mode:'expr', needs:['f-factorizacion-'], tier:2,
    make: r => { const s = r.pick([1, 1, 2, 3]), t = r.int(1, 7) * r.pick([1, -1]); return sumaF(terminoF(s * s, 2), terminoF(2 * s * t, 1), terminoF(t * t, 0)); }}),
  new ProblemType({id:'fac4', name:'Trinomio x² + bx + c', mode:'expr', needs:['f-cuadraticas-'], tier:2,
    make: r => { let p, q; do { p = r.int(1, 9) * r.pick([1, -1]); q = r.int(1, 9) * r.pick([1, -1]); } while (p === q || p + q === 0); return sumaF(terminoF(1, 2), terminoF(p + q, 1), terminoF(p * q, 0)); }}),
  new ProblemType({id:'fac5', name:'Trinomio ax² + bx + c', mode:'expr', needs:['f-cuadraticas-'], tier:3,
    make: r => { let al, be, ga, de; do { al = r.int(2, 4); ga = 1; be = r.int(1, 5) * r.pick([1, -1]); de = r.int(1, 6) * r.pick([1, -1]); } while (mcd(al, be) > 1 || al * de + be * ga === 0);
      return sumaF(terminoF(al * ga, 2), terminoF(al * de + be * ga, 1), terminoF(be * de, 0)); }}),
];
const cartasFact = cartasFactorizacion();
DOMINIOS.fact = new Dominio({id:'fact', mundo:'fund', nombre:'Factorización', icon:'🧩', cartas:cartasFact, key:A.key, tex:(r, m) => A.tex(r, m),
  resuelto: r => cartasFact.all().every(c => c.free || !c.targets(r).length), normalizar:aplanar,
  mano(){ return this.cartas.all(); }, piezas:() => PIEZAS_ALG, ayudaLibre:() => 'Escribe la expresión factorizada (debe valer lo mismo).',
  libre: (src, raiz) => {
    let e; try { e = A.parse(src); } catch (err){ return {error:err.message}; }
    if (e.k === '=') return {error:'Aquí no va “=”.'};
    if (!A.equivalentes(e, raiz)) return {error:'Ese paso cambia el valor de la expresión.'};
    if (A.key(aplanar(e)) === A.key(raiz)) return {error:'Es igual a lo que ya tienes: escribe el siguiente paso.'};
    return {raiz:aplanar(e)};
  },
  consigna:() => 'Factoriza', distractores:() => [], prellenar: r => { try { return piezasCalc(r); } catch { return []; } },
  vista: src => A.tex(aplanar(A.parse(src))), tipos:tiposFactorizacion});
