/* =====================================================================
   DEFENSA ALGEBRAICA · 3e) Gráficos 3D (Three.js)
   - Renderer3D: misma interfaz que Renderer (resize, draw(mundo, t)); lee el
     estado del World y lo dibuja en 3D. La simulación no cambia.
   - Modelos low-poly: base, 5 tipos de soldado con su arma, 15 formas de
     alienígena (y los de cada mundo con su color), jefes con escala.
   - Efectos: proyectiles con brillo y estela, rayos, relámpagos, luces de
     explosión, fogonazos, partículas, textos flotantes y clima en 3D.
   - Las vitrinas del Catálogo están en 3f-vitrina.js.
   - crearRenderer(): 3D si está activo en ⚙️ Configuración y hay WebGL; si
     no, el dibujo 2D de siempre.
   ===================================================================== */

/** Elige el dibujo de la batalla. Si el 3D falla, cambia el lienzo por uno nuevo y usa el 2D. */
function crearRenderer(canvas){
  if (Graficos.es3D && Kit3D){
    try { return new Renderer3D(canvas); }
    catch (err){ console.warn('3D no disponible, se usa 2D:', err); const nuevo = canvas.cloneNode(false); canvas.replaceWith(nuevo); return new Renderer(nuevo); }
  }
  return new Renderer(canvas);
}

/* ---------- Piezas de construcción compartidas (geometrías y materiales) ---------- */
const M3 = (() => {
  const geos = {}, mats = new Map();
  const T = () => THREE;
  const geo = (k, f) => geos[k] ??= f();
  const G = {
    caja:() => geo('caja', () => new (T().BoxGeometry)(1, 1, 1)),
    bola:() => geo('bola', () => new (T().IcosahedronGeometry)(1, 1)),
    esfera:() => geo('esfera', () => new (T().SphereGeometry)(1, 18, 12)),
    cupula:() => geo('cupula', () => new (T().SphereGeometry)(1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2)),
    cil:() => geo('cil', () => new (T().CylinderGeometry)(1, 1, 1, 10)),
    cono:() => geo('cono', () => new (T().ConeGeometry)(1, 1, 10)),
    roca:() => geo('roca', () => new (T().DodecahedronGeometry)(1, 0)),
    disco:() => geo('disco', () => new (T().CylinderGeometry)(1, 1, 0.12, 20)),
    aro:() => geo('aro', () => new (T().TorusGeometry)(1, 0.12, 6, 24)),
    plano:() => geo('plano', () => new (T().PlaneGeometry)(1, 1)),
    barra:() => geo('barra', () => { const g = new (T().PlaneGeometry)(1, 1); g.translate(0.5, 0, 0); return g; }),   // crece desde la izquierda
    cerebro:() => geo('cerebro', () => { const g = new (T().IcosahedronGeometry)(1, 3), p = g.attributes.position;
      for (let i = 0; i < p.count; i++){ const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + 0.08 * Math.sin(x * 9 + y * 7) * Math.cos(z * 8 - y * 5) + (Math.abs(z) < 0.08 ? -0.08 : 0); p.setXYZ(i, x * n, y * n, z * n); }
      g.computeVertexNormals(); return g; }),
  };
  /** Material compartido por color y opciones: r rugosidad, m metal, e emisivo, ei intensidad, op opacidad, liso, ad aditivo, ds doble cara. */
  const mat = (c, o = {}) => {
    const k = c + '|' + JSON.stringify(o);
    let m = mats.get(k);
    if (!m){
      const t = T(), base = {color:Kit3D.color(c), transparent:o.op != null || !!o.ad, opacity:o.op ?? 1, depthWrite:o.op == null && !o.ad, side:o.ds ? t.DoubleSide : t.FrontSide};
      m = o.basico || o.ad ? new t.MeshBasicMaterial({...base, blending:o.ad ? t.AdditiveBlending : t.NormalBlending, toneMapped:false})
        : new t.MeshStandardMaterial({...base, roughness:o.r ?? 0.75, metalness:o.m ?? 0.05, flatShading:!o.liso, emissive:o.e ? Kit3D.color(o.e) : new t.Color(0), emissiveIntensity:o.ei ?? 1});
      mats.set(k, m);
    }
    return m;
  };
  /** Malla con posición, escala y giro; proyecta sombra. */
  const pieza = (g, m, p = [0, 0, 0], s = [1, 1, 1], r = null, padre = null) => {
    const x = new (T().Mesh)(g, m); x.position.set(p[0], p[1], p[2]); x.scale.set(s[0], s[1], s[2]); if (r) x.rotation.set(r[0], r[1], r[2]);
    x.castShadow = !m.transparent; if (padre) padre.add(x); return x;
  };
  const grupo = (p = [0, 0, 0], padre = null) => { const g = new (T().Group)(); g.position.set(p[0], p[1], p[2]); if (padre) padre.add(g); return g; };
  /** Copia propia de un material (para teñir al congelar o destellar al recibir daño). */
  const propio = (lista, m) => { const c = m.clone(); lista.push(c); return c; };
  return {G, mat, pieza, grupo, propio};
})();

/* ---------- Armas de los soldados (mallas) ---------- */
function armaSoldado3D(tipo, padre){
  const {G, mat, pieza, grupo} = M3, g = grupo([2.1, 8.4, 1.6], padre), metal = mat('#1f2937', {m:0.6, r:0.35}), acero = mat('#64748b', {m:0.7, r:0.3});
  let boca = [7.5, 0.3, 0];
  if (tipo === 'pesado'){                         // escopeta pesada y corta
    pieza(G.caja(), metal, [2.6, 0, 0], [5.6, 1.7, 1.3], null, g);
    pieza(G.cil(), acero, [5.8, 0.25, 0], [0.55, 2.4, 0.55], [0, 0, Math.PI / 2], g);
    pieza(G.caja(), mat('#78350f'), [-0.4, -0.4, 0], [2, 1.2, 1], null, g);
    boca = [7, 0.25, 0];
  } else if (tipo === 'granadero'){               // lanzagranadas con tambor
    pieza(G.cil(), metal, [3.2, 0.2, 0], [1.05, 5.2, 1.05], [0, 0, Math.PI / 2], g);
    pieza(G.cil(), mat('#3f3f46', {m:0.4}), [1.2, -0.5, 0], [1.5, 1.6, 1.5], [Math.PI / 2, 0, 0], g);
    pieza(G.aro(), mat('#f59e0b', {e:'#f59e0b', ei:0.4}), [5.8, 0.2, 0], [1.05, 1.05, 1.6], [0, Math.PI / 2, 0], g);
    boca = [6.4, 0.2, 0];
  } else if (tipo === 'medico'){                   // pistola de curación con depósito luminoso
    pieza(G.caja(), mat('#e5e7eb', {r:0.4}), [1.8, 0, 0], [3.6, 1.2, 1], null, g);
    pieza(G.esfera(), mat('#f87171', {e:'#ef4444', ei:1.2, liso:true}), [0.8, 1.1, 0], [0.8, 0.8, 0.8], null, g);
    boca = [3.8, 0, 0];
  } else if (tipo === 'ingeniero'){                // llave inglesa
    pieza(G.caja(), acero, [2.2, 0, 0], [4.4, 0.7, 0.6], null, g);
    pieza(G.aro(), acero, [4.8, 0, 0], [1.1, 1.1, 2.2], null, g);
    boca = [4.8, 0, 0];
  } else {                                         // fusil con mira
    pieza(G.caja(), metal, [2.8, 0, 0], [6.6, 1.05, 0.9], null, g);
    pieza(G.cil(), metal, [6.9, 0.2, 0], [0.32, 2.2, 0.32], [0, 0, Math.PI / 2], g);
    pieza(G.cil(), mat('#0ea5e9', {e:'#38bdf8', ei:0.8}), [2.8, 1, 0], [0.45, 2, 0.45], [0, 0, Math.PI / 2], g);
    pieza(G.caja(), mat('#78350f'), [-0.6, -0.3, 0], [1.8, 1.3, 0.8], null, g);
  }
  return {g, boca};
}

/* ---------- Soldado ---------- */
/** @param {string} tipo  @param {{cuerpo?:string, casco?:string, bala?:string}} [R]  rasgos del soldado concreto (sus colores) */
function soldado3D(tipo, R = null){
  const {G, mat, pieza, grupo, propio} = M3, d = SOLDADOS[tipo], raiz = grupo(), mats = [];
  const a = tipo === 'pesado' ? 1.28 : 1, cuerpo = propio(mats, mat(R?.cuerpo ?? d.cuerpo)), casco = mat(R?.casco ?? d.casco, {m:0.25, r:0.5}), piel = mat('#f2c79b');
  const pant = mat(tipo === 'medico' ? '#cbd5e1' : tipo === 'ingeniero' ? '#4b5563' : '#1f3b2a'), bota = mat('#111827');
  const piernas = [1.15, -1.15].map(z => { const p = grupo([0, 5, z * a], raiz); pieza(G.caja(), pant, [0, -2.3, 0], [1.7 * a, 4.6, 1.6 * a], null, p); pieza(G.caja(), bota, [0.3, -4.6, 0], [2.3 * a, 0.9, 1.7 * a], null, p); return p; });
  const torso = grupo([0, 5.6, 0], raiz);
  pieza(G.caja(), cuerpo, [0, 2.6, 0], [3.6 * a, 5.2, 3.5 * a], null, torso);
  pieza(G.caja(), mat('#111827', {m:0.3}), [0, 0.3, 0], [3.8 * a, 0.7, 3.7 * a], null, torso);                       // cinturón
  pieza(G.caja(), tipo === 'medico' ? mat('#f8fafc') : mat('#3f3f2e'), [-2.3 * a, 2.8, 0], [1.4, 3.8, 2.8 * a], null, torso);   // mochila
  if (tipo === 'pesado') [1.9, -1.9].forEach(z => pieza(G.bola(), mat('#94a3b8', {m:0.6, r:0.35}), [0, 5, z * a], [1.5, 1.1, 1.4], null, torso));   // hombreras
  if (tipo === 'medico'){ const cruz = mat('#dc2626', {e:'#dc2626', ei:0.5}); pieza(G.caja(), cruz, [-3.05, 2.8, 0], [0.1, 2.4, 0.7], null, torso); pieza(G.caja(), cruz, [-3.05, 2.8, 0], [0.1, 0.7, 2.4], null, torso); }
  if (tipo === 'granadero') for (let i = 0; i < 4; i++) pieza(G.esfera(), mat('#3f6212', {liso:true}), [1.85 * a, 3.9 - i * 0.9, -1.2 + i * 0.8], [0.45, 0.45, 0.45], null, torso);   // granadas al pecho
  if (tipo === 'ingeniero') pieza(G.caja(), mat('#a16207'), [0.2, 0.2, 0], [4 * a, 1, 3.9 * a], null, torso);   // cinturón de herramientas
  const cabeza = grupo([0.2, 12.5, 0], raiz);
  pieza(G.esfera(), piel, [0, 0, 0], [1.75, 1.85, 1.75], null, cabeza);
  pieza(G.cupula(), casco, [0, 0.35, 0], [2.15, 1.75, 2.15], null, cabeza);
  pieza(G.caja(), casco, [0.6, 0.35, 0], [3.4, 0.3, 3.2], null, cabeza);                                            // ala del casco
  if (R?.bala) pieza(G.aro(), mat(R.bala, {e:R.bala, ei:0.9}), [0, 0.75, 0], [2.05, 2.05, 2.4], [Math.PI / 2, 0, 0], cabeza);   // franja con su color de bala
  pieza(G.caja(), mat('#0f172a', {e:tipo === 'medico' ? '#f87171' : '#38bdf8', ei:0.9, m:0.6}), [1.55, -0.1, 0], [0.35, 0.6, 2.4], null, cabeza);   // visor luminoso
  if (tipo === 'medico'){ const cr = mat('#dc2626', {e:'#ef4444', ei:0.7}); pieza(G.caja(), cr, [0.4, 2.05, 0], [1.2, 0.12, 0.35], null, cabeza); pieza(G.caja(), cr, [0.4, 2.05, 0], [0.35, 0.12, 1.2], null, cabeza); }
  if (tipo === 'ingeniero') pieza(G.cil(), mat('#facc15', {e:'#fde047', ei:0.6}), [1.6, 1.2, 0], [0.4, 0.4, 0.4], [0, 0, Math.PI / 2], cabeza);   // linterna
  const arma = armaSoldado3D(tipo, raiz);
  pieza(G.caja(), cuerpo, [1.2, 8.6, 1.5 * a], [3, 1.1, 1.1], [0, 0, -0.15], raiz);                                  // brazo que sostiene el arma
  pieza(G.caja(), cuerpo, [1.4, 8.4, -1.5 * a], [3.2, 1.1, 1.1], [0, 0.5, -0.2], raiz);
  const escudo = pieza(G.esfera(), mat('#93c5fd', {ad:true, op:0.3}), [0.5, 8, 0], [7, 10, 6], null, raiz); escudo.visible = false;   // activa «Escudo»
  return {raiz, mats, piernas, torso, cabeza, arma, escudo, retroceso:0, dano:0, vidaPrev:null};
}

/* ---------- Alienígenas ---------- */
/** Los personajes se ven algo más grandes que en 2D (la cámara 3D los aleja). */
const ESCALA_3D = 1.3;
const AIRE_3D = ['nave', 'dron', 'bombardero', 'caza', 'portadrones', 'acorazado', 'mente'];
function enemigo3D(e){
  const {G, mat, pieza, grupo, propio} = M3, forma = e.forma ?? e.tipo, base = e.color ?? COLOR_ENEMIGO[forma] ?? '#86efac';
  const raiz = grupo(), cuerpoG = grupo([0, 0, 0], raiz), mats = [], r = {raiz, cuerpoG, mats, forma, anim:null, piernas:[], extra:{}};
  const piel = propio(mats, mat(base, {r:0.55})), ojo = mat('#020617', {r:0.15, m:0.3, liso:true}), brillo = mat('#ffffff', {basico:true});
  const luz = c => mat(c, {e:c, ei:1.6, liso:true});
  if (!AIRE_3D.includes(forma) || e.vuela === false){
    // --- Terrestres: cuerpo ovalado, ojos grandes, antenas y patas ---
    pieza(G.bola(), piel, [0, 8.2, 0], [5.8, 7, 5], null, cuerpoG);
    pieza(G.bola(), propio(mats, mat(base, {r:0.4, e:base, ei:0.12})), [1.6, 6.6, 0], [3.6, 3.8, 3.6], null, cuerpoG);   // vientre
    for (const z of [2.3, -2.3]){
      pieza(G.esfera(), ojo, [4.3, 10, z], [1.7, 1.9, 1.5], null, cuerpoG);
      pieza(G.esfera(), brillo, [5.6, 10.6, z * 0.85], [0.45, 0.45, 0.45], null, cuerpoG);
      const ant = grupo([0.4, 14, z * 0.8], cuerpoG); ant.rotation.set(z > 0 ? 0.35 : -0.35, 0, -0.25);
      pieza(G.cil(), piel, [0, 2.3, 0], [0.28, 4.6, 0.28], null, ant);
      pieza(G.esfera(), luz(forma === 'reina' ? '#facc15' : forma === 'acido' ? '#a3e635' : '#f0abfc'), [0, 4.8, 0], [0.75, 0.75, 0.75], null, ant);
    }
    for (const z of [2.8, -2.8]){ const p = grupo([0, 3.2, z], raiz); pieza(G.cil(), piel, [0, -1.6, 0], [0.75, 3.4, 0.75], null, p); pieza(G.bola(), piel, [0.6, -3.3, 0], [1.4, 0.6, 1], null, p); r.piernas.push(p); }
    for (const z of [4.4, -4.4]){ const b = grupo([1.5, 8.5, z], cuerpoG); b.rotation.z = -0.9; pieza(G.cil(), piel, [0, -2, 0], [0.55, 4, 0.55], null, b); pieza(G.cono(), mat('#fef3c7'), [0, -4.3, 0], [0.7, 1.4, 0.7], [Math.PI, 0, 0], b); r.extra.brazos = (r.extra.brazos ?? []).concat(b); }
    if (forma === 'blindado' || e.armadura){ const placa = mat('#94a3b8', {m:0.75, r:0.3});
      pieza(G.caja(), placa, [0.4, 8, 0], [10.5, 3.6, 9.6], null, cuerpoG); pieza(G.caja(), placa, [0.6, 13.4, 0], [8, 1.6, 7.5], null, cuerpoG);
      for (const z of [-3, 0, 3]) pieza(G.cono(), mat('#cbd5e1', {m:0.8, r:0.25}), [-2.6, 14.8, z], [0.8, 2.2, 0.8], null, cuerpoG); }
    if (forma === 'escudero' || e.escudo){ r.extra.escudo = pieza(G.esfera(), mat('#60a5fa', {ad:true, op:0.28}), [5, 8, 0], [3, 9.5, 8.5], null, raiz);
      pieza(G.aro(), mat('#93c5fd', {ad:true, op:0.6}), [7.6, 8, 0], [7, 7, 7], [0, Math.PI / 2, 0], raiz); }
    if (forma === 'acido'){ r.extra.saco = pieza(G.esfera(), mat('#84cc16', {e:'#a3e635', ei:0.9, op:0.82, liso:true}), [-4.6, 9.5, 0], [3.4, 3.8, 3.4], null, cuerpoG);
      for (const [x, y] of [[-6, 6], [-3.5, 13]]) pieza(G.esfera(), luz('#bef264'), [x, y, 1.5], [0.7, 0.7, 0.7], null, cuerpoG); }
    if (forma === 'saltador') for (const z of [3.6, -3.6]){ const p = grupo([-3, 4.6, z], raiz); p.rotation.z = 0.6;
      pieza(G.cil(), piel, [0, -2.4, 0], [0.7, 5, 0.7], null, p); pieza(G.cil(), piel, [1.8, -5, 0], [0.6, 4, 0.6], [0, 0, -1.2], p); r.extra.resortes = (r.extra.resortes ?? []).concat(p); }
    if (forma === 'excavador'){ pieza(G.cono(), mat('#a16207', {m:0.5, r:0.4}), [6.8, 7, 0], [2.6, 5, 2.6], [0, 0, -Math.PI / 2], cuerpoG); r.extra.taladro = cuerpoG.children.at(-1); }
    if (forma === 'coloso'){ const piedra = mat('#57534e', {r:0.95});
      for (const z of [4.8, -4.8]) pieza(G.roca(), piedra, [-0.5, 12.5, z], [3, 2.6, 2.6], [0.3, z, 0.2], cuerpoG);
      pieza(G.caja(), piedra, [2, 13.5, 0], [7, 1.8, 7.8], null, cuerpoG);
      for (let i = 0; i < 5; i++) pieza(G.roca(), piedra, [-5.2, 6 + i * 1.6, (i - 2) * 1.6], [1.2, 1, 1], [i, i, 0], cuerpoG); }
    if (forma === 'reina'){ const oro = mat('#facc15', {m:0.8, r:0.25, e:'#a16207', ei:0.3});
      for (let i = 0; i < 5; i++) pieza(G.cono(), oro, [0.6, 15.8, (i - 2) * 1.4], [0.6, i % 2 ? 2.2 : 3, 0.6], null, cuerpoG);
      pieza(G.aro(), oro, [0.6, 14.6, 0], [3.2, 3.2, 3.2], [Math.PI / 2, 0, 0], cuerpoG);
      r.extra.alas = [1, -1].map(s => { const a = grupo([-2, 11, s * 3], cuerpoG); pieza(G.plano(), mat('#d9f99d', {ad:true, op:0.35, ds:true}), [-4, 3, 0], [9, 6, 1], [0, 0, 0.5], a); a.rotation.x = s * 0.5; return a; }); }
    // Paracaídas (mientras cae)
    const para = grupo([0, 22, 0], raiz); r.extra.para = para;
    pieza(G.cupula(), mat('#f8fafc', {op:0.75, ds:true}), [0, 0, 0], [9, 5, 9], null, para);
    for (const [x, z] of [[6, 6], [-6, 6], [6, -6], [-6, -6]]) pieza(G.cil(), mat('#e5e7eb'), [x / 2, -5, z / 2], [0.12, 10.5, 0.12], [z * 0.08, 0, -x * 0.08], para);
    // Montículo (bajo tierra)
    r.extra.monte = pieza(G.cupula(), mat('#78350f', {r:1}), [0, 0, 0], [8, 3.2, 7], null, raiz);
    r.anim = (e, t, dt) => {
      const cae = e.estado === 'cae', bajo = !!e.bajoTierra;
      para.visible = cae; r.extra.monte.visible = bajo; cuerpoG.visible = !bajo; r.piernas.forEach(p => p.visible = !bajo);
      if (r.extra.escudo) r.extra.escudo.visible = !bajo;
      if (bajo){ r.extra.monte.position.x = Math.sin(t * 25) * 0.4; return; }
      const paso = cae ? 0.15 : Math.sin(e.fase) * 0.55;
      r.piernas[0].rotation.z = paso; r.piernas[1].rotation.z = -paso;
      cuerpoG.position.y = cae ? 0 : Math.abs(Math.cos(e.fase)) * 0.8;
      cuerpoG.rotation.z = cae ? Math.sin(t * 3) * 0.12 : Math.sin(e.fase) * 0.06;
      r.extra.brazos?.forEach((b, i) => b.rotation.x = Math.sin(e.fase + i * 3) * 0.3);
      if (r.extra.alas) r.extra.alas.forEach((a, i) => a.rotation.x = (i ? -1 : 1) * (0.4 + Math.sin(t * 18) * 0.35));
      if (r.extra.saco){ const s = 1 + Math.sin(t * 5) * 0.08; r.extra.saco.scale.set(3.4 * s, 3.8 * s, 3.4 * s); }
      if (r.extra.taladro) r.extra.taladro.rotation.y += dt * 25;
      if (r.extra.resortes) r.extra.resortes.forEach(p => p.rotation.z = 0.6 + Math.sin(e.fase * 2) * 0.25);
      if (cae) para.rotation.z = Math.sin(t * 2) * 0.1;
    };
    return r;
  }
  // --- Voladores ---
  const metal = propio(mats, mat(base, {m:0.55, r:0.35})), oscuro = mat('#1e1b4b', {m:0.5, r:0.4});
  if (forma === 'dron'){
    pieza(G.caja(), metal, [0, 0, 0], [8, 3, 6], null, cuerpoG);
    pieza(G.esfera(), luz('#fde047'), [4.1, 0, 0], [0.9, 0.9, 0.9], null, cuerpoG);
    r.extra.rotores = [[-5, -4], [-5, 4], [5, -4], [5, 4]].map(([x, z]) => { pieza(G.cil(), oscuro, [x / 2, 1, z / 2], [0.3, 0.3, Math.hypot(x, z)], [Math.PI / 2, Math.atan2(x, z), 0], cuerpoG);
      return pieza(G.disco(), mat('#fbcfe8', {op:0.45, ds:true}), [x, 2.2, z], [3.2, 1, 3.2], null, cuerpoG); });
    r.anim = (e, t) => { r.extra.rotores.forEach((p, i) => p.rotation.y = t * 40 + i); cuerpoG.rotation.z = Math.sin(t * 6) * 0.15; };
  } else if (forma === 'caza'){
    pieza(G.cono(), metal, [1, 0, 0], [3, 18, 3], [0, 0, -Math.PI / 2], cuerpoG);
    pieza(G.caja(), metal, [-2, 0, 0], [7, 0.6, 18], null, cuerpoG);
    pieza(G.caja(), metal, [-6.5, 2.5, 0], [3, 5, 0.5], [0, 0, -0.4], cuerpoG);
    pieza(G.esfera(), mat('#a5f3fc', {e:'#22d3ee', ei:0.6, liso:true, op:0.85}), [3, 1.6, 0], [3, 1.2, 1.4], null, cuerpoG);
    r.extra.motor = pieza(G.esfera(), luz('#fb923c'), [-8.6, 0, 0], [1.6, 1.2, 1.2], null, cuerpoG);
    r.anim = (e, t) => { cuerpoG.rotation.x = Math.sin(t * 3) * 0.25; const s = 1.2 + Math.random() * 0.6; r.extra.motor.scale.set(1.6 * s, 1.2, 1.2); };
  } else if (forma === 'bombardero'){
    pieza(G.cil(), metal, [0, 0, 0], [3.2, 24, 3.2], [0, 0, Math.PI / 2], cuerpoG);
    pieza(G.esfera(), metal, [12, 0, 0], [3.2, 3.2, 3.2], null, cuerpoG);
    pieza(G.caja(), metal, [0, 0.5, 0], [8, 0.8, 30], null, cuerpoG);
    pieza(G.caja(), mat('#52525b', {m:0.6}), [0, -3.3, 0], [10, 1.6, 4], null, cuerpoG);
    for (const z of [-9, 9]) pieza(G.cil(), oscuro, [-1, -0.6, z], [1.4, 5, 1.4], [0, 0, Math.PI / 2], cuerpoG);
    r.extra.luces = [-9, 9].map(z => pieza(G.esfera(), luz('#fb923c'), [-3.8, -0.6, z], [1, 1, 1], null, cuerpoG));
    r.anim = (e, t) => { cuerpoG.rotation.x = Math.sin(t * 1.5) * 0.08; r.extra.luces.forEach(l => l.visible = Math.sin(t * 30) > -0.6); };
  } else if (forma === 'portadrones' || forma === 'acorazado'){
    pieza(G.caja(), metal, [0, 0, 0], [34, 8, 16], null, cuerpoG);
    pieza(G.cono(), metal, [19, 0, 0], [6, 6, 4], [0, 0, -Math.PI / 2], cuerpoG);
    pieza(G.caja(), oscuro, [-8, 6, 0], [10, 5, 7], null, cuerpoG);
    pieza(G.caja(), mat('#4c1d95', {e:'#7c3aed', ei:0.8}), [0, -4.1, 0], [16, 0.4, 8], null, cuerpoG);   // hangar luminoso
    r.extra.luces = Array.from({length:6}, (_, i) => pieza(G.esfera(), luz('#fde047'), [-13 + i * 5.4, 0, 8.2], [0.8, 0.8, 0.6], null, cuerpoG));
    for (const z of [-6, 6]) pieza(G.esfera(), luz('#a78bfa'), [-17.5, 0, z], [1.5, 2.4, 2.4], null, cuerpoG);
    if (forma === 'acorazado') for (const x of [-2, 8]){ pieza(G.cupula(), oscuro, [x, 4, 0], [3, 2, 3], null, cuerpoG); pieza(G.cil(), mat('#cbd5e1', {m:0.8}), [x + 3.5, 5.2, 0], [0.6, 6, 0.6], [0, 0, Math.PI / 2 - 0.25], cuerpoG); }
    r.anim = (e, t) => { r.extra.luces.forEach((l, i) => l.visible = Math.sin(t * 8 + i) > 0); cuerpoG.rotation.x = Math.sin(t) * 0.05; };
  } else if (forma === 'mente'){
    pieza(G.cerebro(), propio(mats, mat(base, {r:0.45, liso:true, e:base, ei:0.15})), [0, 0, 0], [12, 9, 10], null, cuerpoG);
    for (const z of [3.8, -3.8]){ pieza(G.esfera(), mat('#fdf4ff', {e:'#f0abfc', ei:1.2, liso:true}), [9.8, -1, z], [2.1, 2.1, 2.1], null, cuerpoG); pieza(G.esfera(), ojo, [11.4, -1, z], [0.9, 1.1, 1.1], null, cuerpoG); }
    r.extra.tent = [-6, -2, 2, 6].flatMap(x => [-3, 3].map(z => { const tg = grupo([x, -7, z], cuerpoG); for (let k = 0; k < 3; k++) pieza(G.esfera(), mat('#a21caf', {liso:true}), [0, -k * 2.4, 0], [1.1 - k * 0.25, 1.4, 1.1 - k * 0.25], null, tg); return tg; }));
    r.extra.escudo = pieza(G.esfera(), mat('#f0abfc', {ad:true, op:0.22}), [0, 0, 0], [17, 15, 15], null, raiz);
    r.anim = (e, t) => { r.extra.tent.forEach((tg, i) => tg.rotation.z = Math.sin(t * 3 + i) * 0.35); cuerpoG.scale.setScalar(1 + Math.sin(t * 2.4) * 0.03);
      r.extra.escudo.visible = !!e.escudoMental && !(e.escudoT > 0); r.extra.escudo.rotation.y = t; };
  } else {
    // Platillo (nave) con cúpula y luces en el borde
    pieza(G.esfera(), metal, [0, 0, 0], [15, 3.4, 13], null, cuerpoG);
    pieza(G.esfera(), oscuro, [0, -1.6, 0], [8, 1.6, 7], null, cuerpoG);
    pieza(G.cupula(), mat('#a5f3fc', {op:0.55, liso:true, e:'#22d3ee', ei:0.35}), [0, 1.8, 0], [6, 5, 6], null, cuerpoG);
    pieza(G.bola(), mat(base, {e:base, ei:0.3}), [0, 2.6, 0], [2.2, 2.6, 2.2], null, cuerpoG);   // piloto
    r.extra.luces = Array.from({length:10}, (_, i) => { const a = i / 10 * Math.PI * 2; return pieza(G.esfera(), luz('#fde047'), [Math.cos(a) * 14, 0, Math.sin(a) * 12], [0.8, 0.8, 0.8], null, cuerpoG); });
    r.extra.haz = pieza(G.cono(), mat('#a5f3fc', {ad:true, op:0.12}), [0, -14, 0], [8, 26, 8], null, raiz);
    r.anim = (e, t) => { cuerpoG.rotation.y = t * 1.6; r.extra.luces.forEach((l, i) => l.visible = Math.sin(t * 10 + i * 0.9) > 0); cuerpoG.rotation.z = Math.sin(t * 2 + e.fase) * 0.08;
      r.extra.haz.visible = Math.sin(t * 1.3 + e.fase) > 0.7; };
  }
  return r;
}

/* ---------- Base ---------- */
function base3D(){
  const {G, mat, pieza, grupo, propio} = M3, raiz = grupo(), mats = [], w = MUNDO.base.w;
  const muro = propio(mats, mat('#475569', {r:0.85})), borde = mat('#334155', {r:0.9}), metal = mat('#94a3b8', {m:0.7, r:0.3});
  pieza(G.caja(), muro, [w / 2, 13, 0], [w, 26, 30], null, raiz);
  pieza(G.caja(), borde, [w / 2, 26.5, 0], [w + 2, 2, 31], null, raiz);
  for (let i = 0; i < 6; i++) pieza(G.caja(), borde, [3 + i * (w - 6) / 5, 28.4, 14], [3.5, 2.5, 2.5], null, raiz);   // almenas
  pieza(G.cupula(), propio(mats, mat('#64748b', {m:0.4, r:0.5})), [w / 2, 27, 0], [15, 15, 14], null, raiz);
  const ventanas = mat('#0ea5e9', {e:'#38bdf8', ei:1.4});
  for (let i = 0; i < 3; i++) pieza(G.caja(), ventanas, [8 + i * 13 + 3.5, 8.5, 15.1], [7, 5, 0.3], null, raiz);
  pieza(G.caja(), mat('#1e293b'), [w - 3, 5, 15.1], [5, 10, 0.4], null, raiz);   // puerta
  for (let i = 0; i < 7; i++) pieza(G.bola(), mat('#a8a29e', {r:1}), [w + 4 + (i % 2) * 2, 1.5 + Math.floor(i / 2) * 2.2, -10 + i * 3.4], [2.4, 1.4, 1.8], null, raiz);   // sacos terreros
  const antena = grupo([w / 2 - 9, 26, -6], raiz); pieza(G.cil(), metal, [0, 9, 0], [0.5, 18, 0.5], null, antena);
  const baliza = pieza(G.esfera(), mat('#ef4444', {e:'#ef4444', ei:2, liso:true}), [0, 18.5, 0], [1.1, 1.1, 1.1], null, antena);
  const plato = grupo([0, 13, 0], antena); pieza(G.cupula(), metal, [0, 0, 0], [3.5, 1.2, 3.5], [Math.PI / 2, 0, 0], plato);
  const torreta = grupo([w / 2, 41, 0], raiz);   // cañón de la base, apunta al enemigo
  pieza(G.esfera(), mat('#475569', {m:0.6, r:0.35}), [0, 0, 0], [4.5, 3.6, 4.5], null, torreta);
  pieza(G.cil(), mat('#cbd5e1', {m:0.8, r:0.25}), [5, 0, 0], [1.1, 9, 1.1], [0, 0, Math.PI / 2], torreta);
  pieza(G.aro(), mat('#38bdf8', {e:'#38bdf8', ei:1.4}), [9.4, 0, 0], [1.2, 1.2, 1.2], [0, Math.PI / 2, 0], torreta);
  const escudo = pieza(G.esfera(), mat('#38bdf8', {ad:true, op:0.08}), [w / 2, 10, 0], [36, 44, 30], null, raiz);   // escudo de energía (late)
  return {raiz, mats, baliza, plato, torreta, escudo, vidaPrev:null, dano:0};
}

/* ---------- Escenario ---------- */
const CIELO_3D = {despejado:['#050816', '#1b1958', '#3b2f7a'], lluvia:['#050a14', '#132238', '#2b3b5c'], niebla:['#1f2937', '#475569', '#7c8798'],
  nieve:['#0b1220', '#1e293b', '#4b5f7a'], tormenta:['#020208', '#0b0b1f', '#1e1b4b'], viento:['#070a1a', '#1f1a4a', '#4c3a73']};
const NIEBLA_3D = {despejado:[600, 1500], lluvia:[300, 1000], niebla:[60, 420], nieve:[260, 1000], tormenta:[300, 1100], viento:[500, 1400]};

function rngSemilla(s){ return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function texturaSuelo(nieve){
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'), r = rngSemilla(nieve ? 7 : 3);
  g.fillStyle = nieve ? '#dfe7f1' : '#2b2420'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++){ const v = r(); g.fillStyle = nieve ? `rgba(${170 + v * 70},${185 + v * 60},${210 + v * 40},.5)` : `rgba(${40 + v * 50},${32 + v * 40},${28 + v * 30},.55)`; const s = 1 + r() * 3; g.fillRect(r() * 256, r() * 256, s, s); }
  for (let i = 0; i < 9; i++){ const x = r() * 256, y = r() * 256, R = 6 + r() * 16; const gr = g.createRadialGradient(x, y, R * 0.2, x, y, R);
    gr.addColorStop(0, nieve ? 'rgba(148,163,184,.35)' : 'rgba(10,8,6,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, 7); g.fill(); }
  g.strokeStyle = nieve ? 'rgba(148,163,184,.4)' : 'rgba(12,10,8,.6)'; g.lineWidth = 1;
  for (let i = 0; i < 14; i++){ let x = r() * 256, y = r() * 256; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++){ x += (r() - 0.5) * 26; y += (r() - 0.5) * 26; g.lineTo(x, y); } g.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 6); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
/** Cordillera low-poly: malla de alturas con cumbres irregulares. */
function cordillera(ancho, fondo, alto, z, color, semilla){
  const T = THREE, g = new T.PlaneGeometry(ancho, fondo, 64, 10); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, r = rngSemilla(semilla);
  const picos = Array.from({length:16}, () => [(r() - 0.5) * ancho, alto * (0.35 + r() * 0.65), 40 + r() * 90]);
  for (let i = 0; i < p.count; i++){
    const x = p.getX(i), zz = p.getZ(i), f = 1 - Math.min(1, Math.abs(zz) / (fondo / 2));
    let h = 0; for (const [px, ph, pw] of picos) h = Math.max(h, ph * Math.max(0, 1 - Math.abs(x - px) / pw));
    p.setY(i, h * Math.pow(f, 1.6) * (0.8 + r() * 0.4) - 4);
  }
  g.computeVertexNormals();
  const m = new T.Mesh(g, new T.MeshStandardMaterial({color:Kit3D.color(color), flatShading:true, roughness:0.95}));
  m.position.set(0, 0, z); m.receiveShadow = false; return m;
}

class Renderer3D {
  constructor(canvas, {vista = 'batalla'} = {}){
    const T = THREE; this.cv = canvas; this.vista = vista; this.alta = Graficos.alta;
    this.R = new T.WebGLRenderer({canvas, antialias:this.alta, powerPreference:'high-performance'});
    this.R.outputColorSpace = T.SRGBColorSpace; this.R.toneMapping = T.ACESFilmicToneMapping; this.R.toneMappingExposure = 1.3;
    this.R.shadowMap.enabled = this.alta; this.R.shadowMap.type = T.PCFSoftShadowMap;
    this.scene = new T.Scene(); this.scene.fog = new T.Fog(0x1b1958, 600, 1500);
    this.cam = new T.PerspectiveCamera(32, 1.8, 1, 3000);
    this.ox = MUNDO.W / 2;   // el centro del campo de batalla en x
    this.entes = new Map(); this.luces = []; this.relampago = 0; this.tPrev = null; this.climaId = null; this.cieloCol = CIELO_3D.despejado.map(c => Kit3D.color(c).clone());
    this.armarEscena();
    this.resize();
  }
  X(x){ return x - this.ox; } Y(y){ return MUNDO.suelo - y; }
  armarEscena(){
    const T = THREE, S = this.scene;
    // Cielo con degradado (cambia con el clima)
    this.cieloMat = new T.ShaderMaterial({side:T.BackSide, depthWrite:false, fog:false,
      uniforms:{c0:{value:new T.Color()}, c1:{value:new T.Color()}, c2:{value:new T.Color()}, flash:{value:0}},
      vertexShader:`varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader:`uniform vec3 c0; uniform vec3 c1; uniform vec3 c2; uniform float flash; varying vec3 vP;
        void main(){ float h = vP.y; vec3 c = mix(c2, c1, smoothstep(-0.02, 0.22, h)); c = mix(c, c0, smoothstep(0.22, 0.75, h)); c += vec3(0.85, 0.9, 1.0) * flash; gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
        }`});
    S.add(new T.Mesh(new T.SphereGeometry(1800, 32, 16), this.cieloMat));
    // Estrellas
    const n = this.alta ? 900 : 450, pos = new Float32Array(n * 3), r = rngSemilla(11);
    for (let i = 0; i < n; i++){ const a = r() * Math.PI * 2, b = 0.08 + r() * 1.3, R = 1600; pos.set([Math.cos(a) * Math.cos(b) * R, Math.sin(b) * R, -Math.abs(Math.sin(a) * Math.cos(b) * R)], i * 3); }
    const gs = new T.BufferGeometry(); gs.setAttribute('position', new T.BufferAttribute(pos, 3));
    this.estrellas = new T.Points(gs, new T.PointsMaterial({color:0xffffff, size:2.2, sizeAttenuation:false, transparent:true, opacity:0.9, fog:false, map:Kit3D.glow(), depthWrite:false, blending:T.AdditiveBlending}));
    S.add(this.estrellas);
    // Luna y planeta con anillos
    const luna = new T.Mesh(new T.IcosahedronGeometry(42, 3), new T.MeshBasicMaterial({color:0xe0e7ff, fog:false})); luna.position.set(-520, 520, -1300); S.add(luna);
    const halo = new T.Sprite(new T.SpriteMaterial({map:Kit3D.glow(), color:0xa5b4fc, transparent:true, opacity:0.55, blending:T.AdditiveBlending, fog:false, depthWrite:false})); halo.scale.set(380, 380, 1); halo.position.copy(luna.position); S.add(halo);
    const planeta = new T.Group(); planeta.position.set(620, 360, -1500); S.add(planeta);
    planeta.add(new T.Mesh(new T.SphereGeometry(110, 32, 16), new T.MeshStandardMaterial({color:0x9d4edd, emissive:0x3b0764, emissiveIntensity:0.6, roughness:0.9, fog:false})));
    const anillo = new T.Mesh(new T.RingGeometry(140, 210, 64), new T.MeshBasicMaterial({color:0xf0abfc, transparent:true, opacity:0.35, side:T.DoubleSide, fog:false, depthWrite:false}));
    anillo.rotation.set(-1.2, 0.3, 0.4); planeta.add(anillo); this.planeta = planeta;
    // Montañas (tres capas) y suelo
    S.add(cordillera(2600, 300, 190, -720, '#221d52', 5), cordillera(2200, 220, 120, -450, '#2a2550', 9), cordillera(1800, 140, 60, -250, '#2b2632', 13));
    this.texTierra = texturaSuelo(false); this.texNieve = texturaSuelo(true);
    this.sueloMat = new T.MeshStandardMaterial({map:this.texTierra, roughness:0.95, metalness:0});
    const suelo = new T.Mesh(new T.PlaneGeometry(2400, 1400, 1, 1), this.sueloMat); suelo.rotation.x = -Math.PI / 2; suelo.position.z = -300; suelo.receiveShadow = true; S.add(suelo);
    // Rocas y cristales alienígenas (decorado)
    const rr = rngSemilla(21), {G, mat} = M3;
    for (let i = 0; i < 26; i++){
      const z = -40 - rr() * 160, x = (rr() - 0.5) * 520, cristal = rr() < 0.35;
      const m = cristal ? new T.Mesh(G.cono(), mat(rr() < 0.5 ? '#22d3ee' : '#c084fc', {e:rr() < 0.5 ? '#0891b2' : '#7e22ce', ei:1.3, r:0.2}))
        : new T.Mesh(G.roca(), mat('#3f3a36', {r:1}));
      const s = cristal ? 3 + rr() * 6 : 4 + rr() * 10; m.scale.set(cristal ? s * 0.4 : s, cristal ? s * 1.6 : s * 0.6, cristal ? s * 0.4 : s);
      m.position.set(x, cristal ? s * 0.6 : s * 0.15, z); m.rotation.set(rr() * 0.4, rr() * 6, rr() * 0.4); m.castShadow = this.alta; S.add(m);
    }
    // Luces
    this.hemi = new T.HemisphereLight(0x8b93e6, 0x1c1917, 0.85); S.add(this.hemi);
    S.add(new T.AmbientLight(0x404060, 0.35));
    const luz = new T.DirectionalLight(0xc7d2fe, 1.5); luz.position.set(-160, 300, 200); luz.target.position.set(0, 0, 0); S.add(luz, luz.target);
    if (this.alta){ luz.castShadow = true; luz.shadow.mapSize.set(1024, 1024); Object.assign(luz.shadow.camera, {left:-230, right:230, top:140, bottom:-140, near:50, far:900}); luz.shadow.bias = -0.0015; luz.shadow.camera.updateProjectionMatrix(); }
    this.luzLuna = luz;
    this.luzBase = new T.PointLight(0x38bdf8, 500, 120, 2); this.luzBase.position.set(this.X(MUNDO.base.x + MUNDO.base.w / 2), 30, 30); S.add(this.luzBase);
    for (let i = 0; i < (this.alta ? 6 : 2); i++){ const L = new T.PointLight(0xffaa55, 0, 90, 2); L.vida = 0; S.add(L); this.luces.push(L); }
    // Base
    this.base = base3D(); this.base.raiz.position.set(this.X(MUNDO.base.x), 0, 0); S.add(this.base.raiz);
    // Proyectiles, partículas, cintas y rocas enemigas
    const cap = this.capBalas = 500;
    this.balasIM = new T.InstancedMesh(new T.SphereGeometry(1, 10, 8), new T.MeshBasicMaterial({color:0xffffff, toneMapped:false}), cap);
    this.balasIM.instanceMatrix.setUsage(T.DynamicDrawUsage); this.balasIM.setColorAt(0, new T.Color()); this.balasIM.frustumCulled = false; S.add(this.balasIM);
    this.rocasIM = new T.InstancedMesh(M3.G.roca(), M3.mat('#a8a29e', {r:1}), 80); this.rocasIM.instanceMatrix.setUsage(T.DynamicDrawUsage); this.rocasIM.castShadow = this.alta; this.rocasIM.frustumCulled = false; S.add(this.rocasIM);
    this.brillos = new Kit3D.GlowPoints(this.alta ? 3500 : 1800); S.add(this.brillos.obj);
    this.cintas = new Kit3D.Ribbons(this.alta ? 2200 : 1200); S.add(this.cintas.obj);
    this.textosG = new T.Group(); S.add(this.textosG); this.sprites = [];
    this.barras = new T.Group(); S.add(this.barras); this.barrasPool = [];
    // Clima: lluvia (segmentos) y nieve (puntos)
    const nG = this.alta ? 700 : 350, gp = new Float32Array(nG * 6); this.gotas = Array.from({length:nG}, () => [(Math.random() - 0.5) * 520, Math.random() * 260, -120 + Math.random() * 260, 0.6 + Math.random() * 0.6]);
    const gl = new T.BufferGeometry(); gl.setAttribute('position', new T.BufferAttribute(gp, 3).setUsage(T.DynamicDrawUsage));
    this.lluvia = new T.LineSegments(gl, new T.LineBasicMaterial({color:0x93c5fd, transparent:true, opacity:0.45, depthWrite:false})); this.lluvia.frustumCulled = false; S.add(this.lluvia);
    const np = new Float32Array(nG * 3), gn = new T.BufferGeometry(); gn.setAttribute('position', new T.BufferAttribute(np, 3).setUsage(T.DynamicDrawUsage));
    this.nieve = new T.Points(gn, new T.PointsMaterial({color:0xf8fafc, size:3, map:Kit3D.glow(), transparent:true, depthWrite:false, opacity:0.95})); this.nieve.frustumCulled = false; S.add(this.nieve);
    this.nubes = Array.from({length:8}, (_, i) => { const s = new T.Sprite(new T.SpriteMaterial({map:Kit3D.glow(), color:0xcbd5e1, transparent:true, opacity:0.0, depthWrite:false}));
      s.scale.set(260, 120, 1); s.position.set(-40 + i * 45, 40 + (i % 3) * 30, 20 - (i % 4) * 30); S.add(s); return s; });
  }
  resize(){
    const r = this.cv.getBoundingClientRect(), w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    this.R.setPixelRatio(Graficos.dpr); this.R.setSize(w, h, false);
    this.cam.aspect = w / h;
    const tf = Math.tan(this.cam.fov * Math.PI / 360), dH = 118 / tf, dW = 196 / (tf * this.cam.aspect);   // que quepan los 360 × 200 del mundo
    this.dist = Math.max(dH, dW); this.cam.updateProjectionMatrix();
    this.brillos.escala(h * Graficos.dpr, this.cam.fov);
    this.esc = w / MUNDO.W;   // compatibilidad con el 2D
  }
  /* ---- Entidades persistentes (soldados y enemigos) ---- */
  ente(o, crear){
    let r = this.entes.get(o);
    if (!r){ r = crear(o); r.mats.forEach(x => { x.userData.c = x.color.clone(); x.userData.e = x.emissive?.clone(); }); r.raiz.traverse(m => { if (m.isMesh) m.castShadow = this.alta && !m.material.transparent; }); this.scene.add(r.raiz); this.entes.set(o, r); r.z = r.z ?? 0; }
    r.visto = this.cuadro; return r;
  }
  barra(x, y, z, w, v, color){
    const T = THREE; let b = this.barrasPool[this.nBarras];
    if (!b){ b = {fondo:new T.Mesh(M3.G.barra(), M3.mat('#000000', {basico:true, op:0.6})), frente:new T.Mesh(M3.G.barra(), new T.MeshBasicMaterial({color:0xffffff, toneMapped:false, transparent:true, depthWrite:false}))};
      b.fondo.renderOrder = 20; b.frente.renderOrder = 21; b.fondo.material.depthTest = false; b.frente.material.depthTest = false; this.barras.add(b.fondo, b.frente); this.barrasPool.push(b); }
    this.nBarras++;
    b.fondo.visible = b.frente.visible = true;
    b.fondo.position.set(x - w / 2, y, z); b.fondo.scale.set(w, 2.6, 1);
    b.frente.position.set(x - w / 2, y, z + 0.1); b.frente.scale.set(Math.max(0.001, w * Math.max(0, Math.min(1, v))), 2.6, 1); b.frente.material.color.copy(Kit3D.color(color));
  }
  draw(m, t){
    const T = THREE, dt = this.tPrev === null ? 0.016 : Math.max(0, Math.min(0.1, t - this.tPrev)); this.tPrev = t; this.cuadro = (this.cuadro ?? 0) + 1; this.nBarras = 0;
    this.climaFx(m, t, dt);
    this.dibujarBase(m, t, dt);
    this.dibujarSoldados(m, t, dt);
    this.dibujarEnemigos(m, t, dt);
    for (const [o, r] of this.entes) if (r.visto !== this.cuadro){ this.scene.remove(r.raiz); r.mats.forEach(x => x.dispose()); this.entes.delete(o); }
    this.brillos.begin(); this.cintas.begin();
    this.eventos(m, dt);
    this.proyectiles(m, t);
    this.particulas(m);
    this.dibujarTextos(m);
    this.lucesFx(dt);
    this.brillos.end(); this.cintas.end();
    for (let i = this.nBarras; i < this.barrasPool.length; i++) this.barrasPool[i].fondo.visible = this.barrasPool[i].frente.visible = false;
    // Cámara: algo elevada, con leve vaivén y sacudida
    const sh = m.shake > 0 ? m.shake : 0, yc = 82;
    this.cam.position.set(Math.sin(t * 0.15) * 6 + (Math.random() - 0.5) * 7 * sh, yc + this.dist * 0.14 + (Math.random() - 0.5) * 4 * sh, this.dist);
    this.cam.lookAt(0, yc - 4, 0);
    this.R.render(this.scene, this.cam);
  }
  climaFx(m, t, dt){
    const id = Object.keys(CLIMAS).find(k => CLIMAS[k] === m.clima) ?? 'despejado', u = this.cieloMat.uniforms;
    const objetivo = (CIELO_3D[id] ?? CIELO_3D.despejado).map(c => Kit3D.color(c)), k = Math.min(1, dt * 2 + (this.climaId === null ? 1 : 0));
    this.cieloCol.forEach((c, i) => c.lerp(objetivo[i], k)); u.c0.value.copy(this.cieloCol[0]); u.c1.value.copy(this.cieloCol[1]); u.c2.value.copy(this.cieloCol[2]);
    this.scene.fog.color.copy(this.cieloCol[2]);
    const [n0, n1] = NIEBLA_3D[id] ?? NIEBLA_3D.despejado; this.scene.fog.near += (n0 - this.scene.fog.near) * k; this.scene.fog.far += (n1 - this.scene.fog.far) * k;
    if (id !== this.climaId){ this.climaId = id; this.sueloMat.map = id === 'nieve' ? this.texNieve : this.texTierra; this.sueloMat.needsUpdate = true; }
    const flash = m.flash ?? 0; u.flash.value = flash * 0.35; this.hemi.intensity = 0.85 + flash * 3;
    this.estrellas.visible = id !== 'tormenta' && id !== 'niebla'; this.estrellas.material.opacity = 0.65 + Math.sin(t * 1.7) * 0.25;
    this.planeta.rotation.y = t * 0.02;
    // Lluvia / tormenta
    const llueve = id === 'lluvia' || id === 'tormenta'; this.lluvia.visible = llueve;
    if (llueve){ const p = this.lluvia.geometry.attributes.position.array;
      this.gotas.forEach((g, i) => { g[1] -= dt * 330 * g[3]; g[0] -= dt * 50; if (g[1] < 0){ g[1] = 260; g[0] = (Math.random() - 0.5) * 520; } if (g[0] < -260) g[0] += 520; p.set([g[0], g[1], g[2], g[0] - 2.5, g[1] + 9, g[2]], i * 6); });
      this.lluvia.geometry.attributes.position.needsUpdate = true; }
    const nieva = id === 'nieve'; this.nieve.visible = nieva;
    if (nieva){ const p = this.nieve.geometry.attributes.position.array;
      this.gotas.forEach((g, i) => { g[1] -= dt * 26 * g[3]; if (g[1] < 0) g[1] = 260; p.set([g[0] + Math.sin(t + g[2]) * 8, g[1], g[2]], i * 3); });
      this.nieve.geometry.attributes.position.needsUpdate = true; }
    const niebla = id === 'niebla';
    this.nubes.forEach((s, i) => { s.material.opacity += ((niebla ? 0.22 + (i % 3) * 0.05 : 0) - s.material.opacity) * k; s.visible = s.material.opacity > 0.01; s.position.x = -40 + i * 45 + Math.sin(t * 0.2 + i) * 20; });
    this.viento = id === 'viento';
    this.tViento = t;
  }
  dibujarBase(m, t, dt){
    const B = this.base, b = m.base, v = b.vida / b.vidaMax;
    if (B.vidaPrev !== null && b.vida < B.vidaPrev - 0.01) B.dano = 1;
    B.vidaPrev = b.vida; B.dano = Math.max(0, B.dano - dt * 3);
    B.mats.forEach(x => { x.emissive.setRGB(B.dano * 0.9, B.dano * 0.12, B.dano * 0.1); });
    B.baliza.visible = Math.sin(t * 5) > 0; B.plato.rotation.y = t * 0.8;
    const obj = m.enemigos.length ? m.enemigos.reduce((a, e) => e.x < a.x ? e : a) : null;
    const ang = obj ? Math.atan2(this.Y(obj.cy) - 41, this.X(obj.x) - this.X(b.cx)) : 0.15;
    B.torreta.rotation.z += (Math.max(-0.2, Math.min(1.3, ang)) - B.torreta.rotation.z) * Math.min(1, dt * 6);
    B.escudo.material.opacity = 0.05 + 0.04 * Math.sin(t * 2) + B.dano * 0.2;
    this.luzBase.intensity = 450 + Math.sin(t * 3) * 80;
    this.barra(this.X(b.cx), 62, 18, MUNDO.base.w, v, v > 0.35 ? '#22c55e' : '#ef4444');
    // Humo y fuego cuando la base está dañada
    if (v < 0.5 && Math.random() < dt * 30) (this.humo ??= []).push({x:this.X(b.x + 10 + Math.random() * (MUNDO.base.w - 20)), y:28, z:5, t:1.6, v:v < 0.25});
    this.humo = (this.humo ?? []).filter(h => (h.t -= dt) > 0);
  }
  dibujarSoldados(m, t, dt){
    for (const s of m.soldados){
      const r = this.ente(s, () => { const x = soldado3D(s.tipo, s.perfil); x.z = ((s.i % 3) - 1) * 5; return x; });
      const obj = m.enemigos.reduce((a, e) => !e.bajoTierra && (!a || e.x < a.x) ? e : a, null);
      r.raiz.position.set(this.X(s.x), 0, r.z); r.raiz.scale.setScalar(ESCALA_3D);
      if (r.vidaPrev !== null && s.vida < r.vidaPrev - 0.01) r.dano = 1; r.vidaPrev = s.vida; r.dano = Math.max(0, r.dano - dt * 4);
      const furia = s.furiaT > 0 ? 0.35 + 0.15 * Math.sin(t * 20) : 0;   // activa «Furia»: brilla naranja
      r.mats.forEach(x => x.emissive.setRGB(r.dano * 0.8 + furia, furia * 0.4, 0));
      r.escudo.visible = s.escudoT > 0; if (r.escudo.visible) r.escudo.rotation.y = t * 2;
      if (furia) this.brillos.add(this.X(s.x), 10, r.z, '#f97316', 26, 0.35);
      r.retroceso = Math.max(0, r.retroceso - dt * 9);
      const ang = obj ? Math.max(-0.25, Math.min(1.1, Math.atan2(this.Y(obj.cy) - 9, this.X(obj.x) - this.X(s.x)))) : 0;
      r.arma.g.rotation.z += (ang - r.arma.g.rotation.z) * Math.min(1, dt * 8);
      r.arma.g.position.x = 2.1 - r.retroceso * 1.4;
      r.torso.scale.y = 1 + Math.sin(t * 2.4 + s.i) * 0.025; r.cabeza.position.y = 12.5 + Math.sin(t * 2.4 + s.i) * 0.12;
      r.raiz.rotation.y = Math.sin(t * 0.7 + s.i) * 0.08;
      if (s.vida < s.vidaMax) this.barra(this.X(s.x), 25, r.z + 4, 10, s.vida / s.vidaMax, '#4ade80');
    }
  }
  dibujarEnemigos(m, t, dt){
    for (const e of m.enemigos){
      const r = this.ente(e, () => { const x = enemigo3D(e); x.z = e.vuela ? -8 + Math.random() * 10 : -5 + Math.random() * 10; return x; });
      const esc = e.escala ?? 1;
      r.raiz.position.set(this.X(e.x), e.vuela ? this.Y(e.y) : this.Y(e.y), r.z);
      r.raiz.scale.setScalar(esc * ESCALA_3D);
      r.raiz.rotation.y = Math.PI;   // miran hacia la base
      const frio = e.congelado > 0; if (r.frio !== frio){ r.frio = frio; r.mats.forEach(x => x.color.copy(frio ? Kit3D.color('#7dd3fc') : x.userData.c)); }
      if (r.vidaPrev !== undefined && e.vida < r.vidaPrev - 0.01) r.dano = 1; r.vidaPrev = e.vida; r.dano = Math.max(0, (r.dano ?? 0) - dt * 5);
      const d = r.dano * 0.9; r.mats.forEach(x => x.emissive && x.emissive.copy(x.userData.e).add({r:d + (frio ? 0.05 : 0), g:d + (frio ? 0.25 : 0), b:d + (frio ? 0.4 : 0)}));   // destello blanco al recibir daño
      r.anim?.(e, t, dt);
      if (e.vida < e.vidaMax && !e.jefe){ const alto = (e.vuela ? 12 : 22) * esc * ESCALA_3D; this.barra(this.X(e.x), this.Y(e.vuela ? e.y : e.y) + alto, r.z + 6, 14, e.vida / e.vidaMax, '#f87171'); }
      if (e.jefe) this.brillos.add(this.X(e.x), this.Y(e.cy), r.z, e.color ?? COLOR_ENEMIGO[r.forma] ?? '#f0abfc', 60 * esc, 0.12 + Math.sin(t * 3) * 0.05);   // aura de jefe
    }
  }
  /* ---- Eventos del mundo: fogonazos y luces ---- */
  eventos(m, dt){
    for (const ev of m.eventos ?? []){
      if (ev.tipo === 'disparo'){
        const s = m.soldados.find(s => Math.abs(s.x + 4 - ev.x) < 3); const r = s && this.entes.get(s);
        if (r){ r.retroceso = 1; r.fogonazo = 0.07; }
        (this.fogonazos ??= []).push({x:this.X(ev.x), y:this.Y(ev.y), z:r?.z ?? 0, t:0.07, c:ev.color});
        if (this.alta) this.luz(this.X(ev.x), this.Y(ev.y), r?.z ?? 0, ev.color, 220, 0.06);
      } else if (ev.tipo === 'boom'){
        this.luz(this.X(ev.x), this.Y(ev.y), 4, ev.color, 700 + ev.n * 45, 0.35);
        (this.ondas ??= []).push({x:this.X(ev.x), y:this.Y(ev.y), t:0.35, t0:0.35, c:ev.color, r:6 + ev.n * 0.9});
      }
    }
    if (m.eventos) m.eventos.length = 0;
    this.fogonazos = (this.fogonazos ?? []).filter(f => (f.t -= dt) > 0);
    for (const f of this.fogonazos) this.brillos.add(f.x + 3, f.y, f.z + 2, f.c, 10, 1);
    this.ondas = (this.ondas ?? []).filter(o => (o.t -= dt) > 0);
    for (const o of this.ondas){ const u = 1 - o.t / o.t0, R = o.r * (0.3 + u * 1.4); this.brillos.add(o.x, o.y, 2, o.c, R * 3.2, (1 - u) * 0.9);
      for (let i = 0; i < 20; i++){ const a1 = i / 20 * 6.283, a2 = (i + 1) / 20 * 6.283; this.cintas.seg(o.x + Math.cos(a1) * R, o.y + Math.sin(a1) * R * 0.8, o.x + Math.cos(a2) * R, o.y + Math.sin(a2) * R * 0.8, 2.4 * (1 - u) + 0.4, o.c, 1 - u, 3); } }
    for (const h of this.humo ?? []) h.v ? this.brillos.add(h.x + Math.sin(h.t * 6) * 2, h.y + (1.6 - h.t) * 14, h.z, h.t > 1 ? '#fb923c' : '#78716c', 10 + (1.6 - h.t) * 8, h.t * 0.35)
      : this.brillos.add(h.x, h.y + (1.6 - h.t) * 16, h.z, '#57534e', 12 + (1.6 - h.t) * 10, h.t * 0.25);
  }
  luz(x, y, z, c, intensidad, vida){
    const L = this.luces.reduce((a, l) => l.vida < a.vida ? l : a, this.luces[0]); if (!L) return;
    L.position.set(x, y + 4, z + 8); L.color.copy(Kit3D.color(c)); L.max = intensidad; L.vida = vida; L.vida0 = vida;
  }
  lucesFx(dt){ for (const L of this.luces){ L.vida = Math.max(0, L.vida - dt); L.intensity = L.vida > 0 ? L.max * (L.vida / L.vida0) : 0; } }
  /* ---- Proyectiles con forma de su arma, brillo y estela ---- */
  proyectiles(m, t){
    const T = THREE, IM = this.balasIM, M = new T.Matrix4(), Q = new T.Quaternion(), P = new T.Vector3(), S = new T.Vector3(), Z = new T.Vector3(0, 0, 1);
    let n = 0;
    const bola = (x, y, z, sx, sy, ang, c) => { if (n >= this.capBalas) return; Q.setFromAxisAngle(Z, ang); P.set(x, y, z); S.set(sx, sy, sy); M.compose(P, Q, S); IM.setMatrixAt(n, M); IM.setColorAt(n++, c); };
    for (const b of m.balas){
      const f = b.fx, forma = f?.forma ?? 'bala', x = this.X(b.x), y = this.Y(b.y), c = Kit3D.color(b.color ?? '#fde047'), r = (b.r ?? 1.3) * 1.15;
      const ang = Math.atan2(-(b.ty - b.y), b.tx - b.x);
      if (b.hist && b.hist.length > 2){ for (let i = 2; i < b.hist.length; i += 2){ const a = i / b.hist.length; this.cintas.seg(this.X(b.hist[i - 2]), this.Y(b.hist[i - 1]), this.X(b.hist[i]), this.Y(b.hist[i + 1]), r * 1.6, c, a * 0.5, 0, (i + 2) / b.hist.length * 0.5); }
        this.cintas.seg(this.X(b.hist.at(-2)), this.Y(b.hist.at(-1)), x, y, r * 1.6, c, 0.5, 0); }
      if (forma === 'orbe'){ bola(x, y, 0, r * 1.4, r * 1.4, 0, c); this.brillos.add(x, y, 0.5, c, r * 11, 0.9); }
      else if (forma === 'rayo'){ bola(x, y, 0, r * 4, r * 0.6, ang, c); this.cintas.seg(x - Math.cos(ang) * 9, y - Math.sin(ang) * 9, x, y, r * 1.6, c, 0.9, 0, 0.2); this.brillos.add(x, y, 0.5, c, r * 6, 0.8); }
      else if (forma === 'perdigon'){ for (let k = -1; k <= 1; k++) bola(x - 1, y + k * 2.2, k, r * 0.8, r * 0.8, 0, c); this.brillos.add(x, y, 0.5, c, r * 7, 0.6); }
      else if (forma === 'onda'){ for (let i = 0; i < 8; i++){ const a1 = ang - 1.1 + i * 0.275, a2 = a1 + 0.275, R = r * 2.6; this.cintas.seg(x + Math.cos(a1) * R, y + Math.sin(a1) * R, x + Math.cos(a2) * R, y + Math.sin(a2) * R, 1.6, c, 0.95, 0); } this.brillos.add(x, y, 0, c, r * 7, 0.5); }
      else if (forma === 'granada'){ bola(x, y, 0, r * 1.5, r * 1.5, t * 8, Kit3D.color('#3f6212')); this.brillos.add(x + 1, y + r * 1.4, 1, '#fde047', 4 + Math.random() * 3, 1); }
      else { bola(x, y, 0, r * 2.4, r * 0.9, ang, c); this.brillos.add(x, y, 0.5, c, r * 7, 0.85); }
      if (f?.perfora) this.cintas.seg(x - Math.cos(ang) * 7, y - Math.sin(ang) * 7, x + Math.cos(ang) * 2, y + Math.sin(ang) * 2, 1, '#67e8f9', 0.9, 0.5);
      if (f?.chispas && Math.sin(t * 40 + b.x) > 0.3) this.brillos.add(x + (Math.random() - 0.5) * 5, y + (Math.random() - 0.5) * 5, 1, '#fef08a', 3, 1);
      if (f?.anillo) for (let i = 0; i < 12; i++){ const a1 = i / 12 * 6.283 + t * 6, a2 = a1 + 0.52, R = r + 2 + f.anillo; this.cintas.seg(x + Math.cos(a1) * R, y + Math.sin(a1) * R, x + Math.cos(a2) * R, y + Math.sin(a2) * R, 0.8, c, 0.6, 0); }
    }
    let nr = 0; const R4 = new T.Matrix4(), E = new T.Euler();
    for (const b of m.balasEnemigas){
      const x = this.X(b.x), y = this.Y(b.y), roca = b.color === '#a8a29e' || (b.r ?? 0) >= 3 && b.parabola;
      if (roca && nr < 80){ E.set(t * 3 + b.x, t * 2, 0); Q.setFromEuler(E); P.set(x, y, 0); const s = (b.r ?? 3) * 1.1; S.set(s, s, s); R4.compose(P, Q, S); this.rocasIM.setMatrixAt(nr++, R4); this.brillos.add(x, y, -1, '#f97316', s * 3, 0.25); }
      else { const c = Kit3D.color(b.color ?? '#f97316'); bola(x, y, 0, (b.r ?? 2) * 1.1, (b.r ?? 2) * 1.1, 0, c); this.brillos.add(x, y, 0.5, c, (b.r ?? 2) * 7, 0.9); }
    }
    IM.count = n; IM.instanceMatrix.needsUpdate = true; if (IM.instanceColor) IM.instanceColor.needsUpdate = true; IM.visible = n > 0;
    this.rocasIM.count = nr; this.rocasIM.instanceMatrix.needsUpdate = true; this.rocasIM.visible = nr > 0;
    // Rayos y relámpagos
    for (const r of m.rayos){
      const a = Math.min(1, r.t * 8), relampago = r.color === '#fef9c3';
      for (let i = 1; i < r.puntos.length; i++){
        const p0 = r.puntos[i - 1], p1 = r.puntos[i], x0 = this.X(p0.x), y0 = this.Y(p0.y), x1 = this.X(p1.x), y1 = this.Y(p1.y);
        this.cintas.zigzag(x0, relampago ? 230 : y0, x1, y1, relampago ? 3.4 : 2.4, r.color, a, 1, relampago ? 9 : 5, relampago ? 9 : 3);
        this.cintas.seg(x0, relampago ? 230 : y0, x1, y1, relampago ? 14 : 7, r.color, a * 0.25, 0.5);
        this.brillos.add(x1, y1, 1, r.color, relampago ? 40 : 14, a);
      }
    }
  }
  particulas(m){
    for (const p of m.particulas) this.brillos.add(this.X(p.x), this.Y(p.y), (p.x * 7.3 % 6) - 3, p.color, (p.r ?? 1.5) * 3.4, Math.max(0, Math.min(1, p.t * 1.6)));
    if (this.viento) for (let i = 0; i < 22; i++){ const g = this.gotas[i], x = 260 - ((g[0] + 260 + this.tViento * 170 * g[3]) % 560), y = 20 + (g[1] % 150); this.cintas.seg(x, y, x + 22, y, 0.6, '#e2e8f0', 0.35, g[2] * 0.3); }
  }
  dibujarTextos(m){
    const vivos = m.textos;
    while (this.sprites.length < vivos.length){ const s = new THREE.Sprite(); s.renderOrder = 30; this.textosG.add(s); this.sprites.push(s); }
    this.sprites.forEach((s, i) => {
      const x = vivos[i]; s.visible = !!x; if (!x) return;
      const e = Kit3D.texto(x.txt, x.color); s.material = e.mat; s.material.opacity = Math.min(1, x.t * 2);
      s.position.set(this.X(x.x), this.Y(x.y), 25); const h = 10; s.scale.set(h * e.aspect, h, 1);
    });
  }
  dispose(){
    for (const [, r] of this.entes){ r.mats.forEach(x => x.dispose()); } this.entes.clear(); this.base.mats.forEach(x => x.dispose());
    this.brillos.dispose(); this.cintas.dispose(); this.texTierra.dispose(); this.texNieve.dispose();
    this.R.dispose(); this.R.forceContextLoss?.();
  }
}
