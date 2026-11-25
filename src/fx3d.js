/* =====================================================================
   KIT 3D (Three.js) · compartido por la guía y el juego
   - Graficos: calidad elegida en ⚙️ Configuración (3D alta, 3D ligera o
     2D clásico). Si el navegador no tiene WebGL se usa siempre 2D.
   - Kit3D: texturas de brillo, partículas aditivas (GlowPoints) y cintas
     de energía (Ribbons) que usan la batalla, el fondo y los efectos.
   - FX3D: capa transparente sobre toda la app con estallidos 3D cuando
     encajas piezas, operas términos o aciertas un paso. Solo dibuja
     mientras hay efectos vivos (no gasta batería en reposo).
   ===================================================================== */
const Graficos = {
  CLAVE: 'calcint:graficos',
  NIVELES: {alta:{icon:'💎', nombre:'3D alta', desc:'Sombras, luces dinámicas y más partículas.'},
            baja:{icon:'🔋', nombre:'3D ligera', desc:'3D sin sombras y con menos resolución: ideal para celulares.'},
            '2d':{icon:'🖼️', nombre:'2D clásico', desc:'El dibujo plano original (sin WebGL).'}},
  _webgl: null,
  get webgl(){
    if (this._webgl === null){
      try { const c = document.createElement('canvas'); this._webgl = !!(window.THREE && window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); }
      catch { this._webgl = false; }
    }
    return this._webgl;
  },
  get nivel(){
    let v = null; try { v = localStorage.getItem(this.CLAVE); } catch {}
    if (!this.NIVELES[v]) v = 'alta';
    return this.webgl ? v : '2d';
  },
  set nivel(v){ try { localStorage.setItem(this.CLAVE, v); } catch {} document.dispatchEvent(new CustomEvent('graficos:cambio', {detail:v})); },
  get es3D(){ return this.nivel !== '2d'; },
  /** Iconos, barras, cartas y vitrinas 3D: además del 3D, que copiar del renderer compartido funcione (autoprueba). */
  ui3dRoto:false,
  get ui3d(){ return this.es3D && !this.ui3dRoto; },
  /** Clase en <html> para el estilo 3D de las cartas (inclinación y brillo holográfico). */
  marcar(){ document.documentElement.classList.toggle('cartas3d', this.ui3d); },
  get alta(){ return this.nivel === 'alta'; },
  /** Resolución de dibujo (la ligera dibuja a menos píxeles). */
  get dpr(){ return Math.min(window.devicePixelRatio || 1, this.alta ? 2 : 1.25); },
};

const Kit3D = (() => {
  if (!window.THREE) return null;
  const T = THREE, cache = new Map();
  /** Color de Three a partir de '#rgb', '#rrggbb' o '#rrggbbaa' (ignora la transparencia). */
  const color = s => {
    let c = cache.get(s);
    if (!c){ const h = typeof s === 'string' && s[0] === '#' && s.length === 9 ? s.slice(0, 7) : s; c = new T.Color(); try { c.set(h); } catch { c.set('#ffffff'); } cache.set(s, c); }
    return c;
  };
  /** Textura radial suave (núcleo blanco + halo) para partículas y destellos. */
  let glowTex = null;
  const glow = () => {
    if (glowTex) return glowTex;
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g = cv.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.18, 'rgba(255,255,255,0.85)'); r.addColorStop(0.45, 'rgba(255,255,255,0.28)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    glowTex = new T.CanvasTexture(cv); return glowTex;
  };

  /** Muchas partículas brillantes en un solo dibujo: posición, color, tamaño (en unidades del mundo) y opacidad por punto. */
  class GlowPoints {
    constructor(cap = 2000){
      this.cap = cap; this.n = 0;
      const g = new T.BufferGeometry();
      this.pos = new Float32Array(cap * 3); this.col = new Float32Array(cap * 3); this.size = new Float32Array(cap); this.alpha = new Float32Array(cap);
      g.setAttribute('position', new T.BufferAttribute(this.pos, 3).setUsage(T.DynamicDrawUsage));
      g.setAttribute('aColor', new T.BufferAttribute(this.col, 3).setUsage(T.DynamicDrawUsage));
      g.setAttribute('aSize', new T.BufferAttribute(this.size, 1).setUsage(T.DynamicDrawUsage));
      g.setAttribute('aAlpha', new T.BufferAttribute(this.alpha, 1).setUsage(T.DynamicDrawUsage));
      this.mat = new T.ShaderMaterial({
        uniforms:{map:{value:glow()}, uScale:{value:300}},
        vertexShader:`attribute vec3 aColor; attribute float aSize; attribute float aAlpha; uniform float uScale; varying vec3 vC; varying float vA;
          void main(){ vC = aColor; vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = max(1.0, aSize * uScale / max(1.0, -mv.z)); gl_Position = projectionMatrix * mv; }`,
        fragmentShader:`uniform sampler2D map; varying vec3 vC; varying float vA;
          void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC * t.rgb, t.a * vA);
          #include <colorspace_fragment>
          }`,
        transparent:true, depthWrite:false, blending:T.AdditiveBlending,
      });
      this.obj = new T.Points(g, this.mat); this.obj.frustumCulled = false; this.obj.renderOrder = 10;
    }
    begin(){ this.n = 0; }
    add(x, y, z, c, size, alpha = 1){
      if (this.n >= this.cap) return;
      const i = this.n++, k = i * 3, C = typeof c === 'string' ? color(c) : c;
      this.pos[k] = x; this.pos[k + 1] = y; this.pos[k + 2] = z; this.col[k] = C.r; this.col[k + 1] = C.g; this.col[k + 2] = C.b; this.size[i] = size; this.alpha[i] = alpha;
    }
    end(){
      const g = this.obj.geometry; g.setDrawRange(0, this.n);
      for (const a of ['position', 'aColor', 'aSize', 'aAlpha']){ const at = g.getAttribute(a); at.clearUpdateRanges(); at.addUpdateRange(0, Math.max(1, this.n) * at.itemSize); at.needsUpdate = true; }
    }
    /** Escala de tamaño: alto del lienzo en píxeles y campo de visión de la cámara. */
    escala(alturaPx, fov){ this.mat.uniforms.uScale.value = alturaPx / (2 * Math.tan(fov * Math.PI / 360)); }
    dispose(){ this.obj.geometry.dispose(); this.mat.dispose(); }
  }

  /** Cintas aditivas (rayos, estelas, relámpagos): cada segmento es un cuadrilátero en el plano XY. */
  class Ribbons {
    constructor(cap = 1200){
      this.cap = cap; this.n = 0;
      const g = new T.BufferGeometry();
      this.pos = new Float32Array(cap * 4 * 3); this.col = new Float32Array(cap * 4 * 4); this.uv = new Float32Array(cap * 4 * 2);
      const idx = new Uint32Array(cap * 6);
      for (let i = 0; i < cap; i++){ const v = i * 4, k = i * 6; idx.set([v, v + 1, v + 2, v + 2, v + 1, v + 3], k); this.uv.set([0, 0, 0, 1, 1, 0, 1, 1], i * 8); }
      g.setIndex(new T.BufferAttribute(idx, 1));
      g.setAttribute('position', new T.BufferAttribute(this.pos, 3).setUsage(T.DynamicDrawUsage));
      g.setAttribute('aColor', new T.BufferAttribute(this.col, 4).setUsage(T.DynamicDrawUsage));
      g.setAttribute('uv', new T.BufferAttribute(this.uv, 2));
      this.mat = new T.ShaderMaterial({
        vertexShader:`attribute vec4 aColor; varying vec4 vC; varying vec2 vUv; void main(){ vC = aColor; vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader:`varying vec4 vC; varying vec2 vUv; void main(){ float d = abs(vUv.y - 0.5) * 2.0; float core = smoothstep(1.0, 0.0, d); float hot = smoothstep(0.35, 0.0, d);
          gl_FragColor = vec4(mix(vC.rgb, vec3(1.0), hot * 0.65), vC.a * core);
          #include <colorspace_fragment>
          }`,
        transparent:true, depthWrite:false, blending:T.AdditiveBlending, side:T.DoubleSide,
      });
      this.obj = new T.Mesh(g, this.mat); this.obj.frustumCulled = false; this.obj.renderOrder = 11;
    }
    begin(){ this.n = 0; }
    seg(x1, y1, x2, y2, w, c, a = 1, z = 0, a2 = a){
      if (this.n >= this.cap) return;
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L * w / 2, ny = dx / L * w / 2, C = typeof c === 'string' ? color(c) : c;
      const i = this.n++, p = i * 12, q = i * 16;
      this.pos.set([x1 + nx, y1 + ny, z, x1 - nx, y1 - ny, z, x2 + nx, y2 + ny, z, x2 - nx, y2 - ny, z], p);
      this.col.set([C.r, C.g, C.b, a, C.r, C.g, C.b, a, C.r, C.g, C.b, a2, C.r, C.g, C.b, a2], q);
    }
    /** Relámpago: zigzag entre dos puntos con desvío aleatorio. */
    zigzag(x1, y1, x2, y2, w, c, a, z = 0, partes = 6, desvio = 5){
      let px = x1, py = y1;
      for (let k = 1; k <= partes; k++){
        const u = k / partes, j = k === partes ? 0 : (Math.random() - 0.5) * desvio * 2;
        const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
        const nx = px, ny = py; px = x1 + dx * u - dy / L * j; py = y1 + dy * u + dx / L * j;
        this.seg(nx, ny, px, py, w, c, a, z);
      }
    }
    end(){
      const g = this.obj.geometry; g.setDrawRange(0, this.n * 6);
      for (const a of ['position', 'aColor']){ const at = g.getAttribute(a); at.clearUpdateRanges(); at.addUpdateRange(0, Math.max(1, this.n * 4) * at.itemSize); at.needsUpdate = true; }
    }
    dispose(){ this.obj.geometry.dispose(); this.mat.dispose(); }
  }

  /** Texto flotante (con emojis) como sprite; las texturas se reutilizan. */
  const textos = new Map();
  const texto = (txt, col) => {
    const k = txt + '|' + col;
    let e = textos.get(k);
    if (!e){
      if (textos.size > 160){ const [k0, v0] = textos.entries().next().value; v0.tex.dispose(); v0.mat.dispose(); textos.delete(k0); }
      const cv = document.createElement('canvas'), g = cv.getContext('2d'), f = 'bold 44px system-ui, "Segoe UI Emoji", sans-serif';
      g.font = f; const w = Math.ceil(g.measureText(txt).width) + 24; cv.width = w; cv.height = 64;
      g.font = f; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.strokeText(txt, w / 2, 34); g.fillStyle = col; g.fillText(txt, w / 2, 34);
      const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
      e = {tex, aspect:w / 64, mat:new T.SpriteMaterial({map:tex, transparent:true, depthTest:false, depthWrite:false})};
      textos.set(k, e);
    }
    return e;
  };
  return {T, color, glow, GlowPoints, Ribbons, texto};
})();

/* ---------- Capa de efectos 3D sobre la interfaz (motor de piezas, aciertos) ----------
   Uso: document.dispatchEvent(new CustomEvent('fx3d', {detail:{x, y, tipo}}))
   con x, y en píxeles de pantalla y tipo: 'encaje' | 'opera' | 'error' | 'acierto' | 'resuelto' | 'carta'. */
const FX3D = (() => {
  const PALETA = {encaje:['#7dd3fc', '#a5f3fc'], opera:['#86efac', '#fde047'], error:['#fb7185', '#fda4af'], acierto:['#fde047', '#fbbf24', '#86efac'],
    resuelto:['#fde047', '#f0abfc', '#7dd3fc', '#86efac', '#fb923c'], carta:['#c4b5fd', '#f0abfc']};
  let R = null, scene, cam, pts, rib, anillos = [], parts = [], cubos = [], raf = 0, ultimo = 0;
  function iniciar(){
    if (R || !Kit3D || !Graficos.es3D) return !!R;
    const T = THREE, cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:80';
    document.body.appendChild(cv);
    try { R = new T.WebGLRenderer({canvas:cv, alpha:true, antialias:false, premultipliedAlpha:true}); }
    catch { cv.remove(); return false; }
    R.setClearColor(0x000000, 0); R.outputColorSpace = T.SRGBColorSpace;
    scene = new T.Scene();
    cam = new T.OrthographicCamera(0, 1, 0, 1, -500, 500);
    pts = new Kit3D.GlowPoints(1500); rib = new Kit3D.Ribbons(300); scene.add(pts.obj, rib.obj);
    scene.add(new T.AmbientLight(0xffffff, 0.8)); const d = new T.DirectionalLight(0xffffff, 1.6); d.position.set(0.3, -1, 1); scene.add(d);
    medir(); window.addEventListener('resize', medir);
    return true;
  }
  function medir(){
    if (!R) return;
    const w = innerWidth, h = innerHeight; R.setPixelRatio(Graficos.dpr); R.setSize(w, h, false);
    Object.assign(cam, {left:0, right:w, top:0, bottom:h}); cam.updateProjectionMatrix();   // y hacia abajo, como la pantalla
    pts.mat.uniforms.uScale.value = Graficos.dpr;   // ortográfica: tamaño en píxeles CSS (los puntos están en z = -1)
  }
  /** Cubitos 3D que salen girando (las «piezas» se desarman en luz). */
  function cubo(x, y, col){
    const T = THREE, s = 5 + Math.random() * 6;
    const m = new T.Mesh(new T.BoxGeometry(s, s, s), new T.MeshStandardMaterial({color:col, emissive:col, emissiveIntensity:0.6, roughness:0.35, metalness:0.2, transparent:true, side:T.DoubleSide}));
    m.position.set(x, y, 0); const a = Math.random() * 6.28, v = 120 + Math.random() * 260;
    cubos.push({m, vx:Math.cos(a) * v, vy:Math.sin(a) * v - 160, vr:[Math.random() * 10 - 5, Math.random() * 10 - 5], t:0.9 + Math.random() * 0.4, t0:1.2});
    scene.add(m);
  }
  function estallar({x, y, tipo = 'encaje'}){
    if (!Graficos.es3D || !iniciar()) return;
    const pal = PALETA[tipo] ?? PALETA.encaje, n = {encaje:16, opera:28, error:14, acierto:40, resuelto:110, carta:24}[tipo] ?? 16, fuerza = tipo === 'resuelto' ? 520 : tipo === 'acierto' ? 340 : 220;
    const lim = Graficos.alta ? 1 : 0.6;
    for (let i = 0; i < n * lim; i++){
      const a = Math.random() * 6.28, v = fuerza * (0.25 + Math.random() * 0.75);
      parts.push({x, y, vx:Math.cos(a) * v, vy:Math.sin(a) * v - (tipo === 'error' ? 0 : 80), t:0.5 + Math.random() * 0.6, t0:1.1, c:pal[i % pal.length], s:6 + Math.random() * (tipo === 'resuelto' ? 22 : 12)});
    }
    anillos.push({x, y, t:0.55, t0:0.55, c:pal[0], r:tipo === 'resuelto' ? 260 : tipo === 'acierto' ? 150 : 70});
    if (tipo === 'resuelto') anillos.push({x, y, t:0.8, t0:0.8, c:pal[1], r:420});
    const nc = {opera:4, acierto:6, resuelto:16, carta:4}[tipo] ?? (tipo === 'encaje' ? 2 : 0);
    for (let i = 0; i < nc * lim; i++) cubo(x, y, pal[i % pal.length]);
    if (!raf){ ultimo = performance.now(); raf = requestAnimationFrame(paso); }
  }
  function paso(now){
    const dt = Math.max(0, Math.min(0.05, (now - ultimo) / 1000)); ultimo = now;   // el primer cuadro puede llegar con marca anterior
    pts.begin(); rib.begin();
    parts = parts.filter(p => (p.t -= dt) > 0);
    for (const p of parts){ p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; p.vx *= 0.985; const u = p.t / p.t0; pts.add(p.x, p.y, -1, p.c, p.s * (0.4 + u), Math.min(1, u * 1.6)); }
    anillos = anillos.filter(a => (a.t -= dt) > 0);
    for (const a of anillos){ const u = Math.max(0, 1 - a.t / a.t0), r = a.r * (0.15 + 0.85 * Math.sqrt(u)), k = 28;
      for (let i = 0; i < k; i++){ const a1 = i / k * 6.283, a2 = (i + 1) / k * 6.283; rib.seg(a.x + Math.cos(a1) * r, a.y + Math.sin(a1) * r, a.x + Math.cos(a2) * r, a.y + Math.sin(a2) * r, 10 * (1 - u) + 2, a.c, (1 - u) * 0.9, -1); } }
    cubos = cubos.filter(c => { if ((c.t -= dt) > 0) return true; scene.remove(c.m); c.m.geometry.dispose(); c.m.material.dispose(); return false; });
    for (const c of cubos){ c.m.position.x += c.vx * dt; c.m.position.y += c.vy * dt; c.vy += 700 * dt; c.m.rotation.x += c.vr[0] * dt; c.m.rotation.y += c.vr[1] * dt; c.m.material.opacity = Math.min(1, c.t / c.t0 * 2); }
    pts.end(); rib.end(); R.render(scene, cam);
    if (parts.length || anillos.length || cubos.length) raf = requestAnimationFrame(paso);
    else { raf = 0; R.clear(); }
  }
  document.addEventListener('fx3d', e => estallar(e.detail ?? {}));
  /** Estallido en el centro de un elemento de la página. */
  const en = (el, tipo) => { if (!el) return; const r = el.getBoundingClientRect(); estallar({x:r.left + r.width / 2, y:r.top + r.height / 2, tipo}); };
  return {estallar, en};
})();

Graficos.marcar(); document.addEventListener('graficos:cambio', () => Graficos.marcar());

/* ---------- Iconos 3D (sin emojis) ----------
   Modelos hechos con Three.js: formas extruidas con bisel, tubos y primitivas,
   con acabado brillante (barniz). Cada icono se construye una vez y se reutiliza.
   Uso en el HTML: <span data-i3d="mando">🎮</span> (el emoji solo queda para 2D). */
const Iconos3D = (() => {
  if (!Kit3D) return {crear:() => null, nombres:[]};
  const T = THREE, cache = new Map(), mats = new Map();
  /** Material con barniz (aspecto de juguete de vinilo); m = metal. */
  const mat = (c, o = {}) => { const k = c + JSON.stringify(o); let m = mats.get(k);
    if (!m){ m = new T.MeshPhysicalMaterial({color:Kit3D.color(c), roughness:o.r ?? 0.32, metalness:o.m ?? 0.05, clearcoat:o.m ? 0.4 : 1, clearcoatRoughness:0.15,
      emissive:o.e ? Kit3D.color(o.e) : new T.Color(0), emissiveIntensity:o.ei ?? 1, side:T.DoubleSide}); mats.set(k, m); }
    return m; };
  const malla = (g, m, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => { const x = new T.Mesh(g, m); x.position.set(...p); x.rotation.set(...r); x.scale.set(...s); return x; };
  const extruir = (forma, prof = 0.3, bisel = 0.08) => { const g = new T.ExtrudeGeometry(forma, {depth:prof, bevelEnabled:true, bevelThickness:bisel, bevelSize:bisel, bevelSegments:3, curveSegments:18}); g.center(); return g; };
  const rect = (w, h, r) => { const s = new T.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
  const poli = pts => { const s = new T.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath(); return s; };
  const estrella = (R, r, n = 5) => poli(Array.from({length:n * 2}, (_, i) => { const a = Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; return [Math.cos(a) * q, Math.sin(a) * q]; }));
  const tubo = (pts, r, m, cerrado = false) => new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p => new T.Vector3(...p)), cerrado), 64, r, 10, cerrado), m);
  const box = (w, h, d) => new T.BoxGeometry(w, h, d, 1, 1, 1);
  const esfera = r => new T.SphereGeometry(r, 24, 16);
  const nube = (g, c, y = 0.2) => { const m = mat(c, {r:0.5}); [[-0.55, 0, 0.55], [0.05, 0.25, 0.75], [0.6, 0.02, 0.5], [0.1, -0.15, 0.6]].forEach(([x, yy, r]) => g.add(malla(esfera(1), m, [x, yy + y, 0], [0, 0, 0], [r, r * 0.85, r * 0.7]))); };
  const rayoForma = () => poli([[0.15, 1], [-0.45, -0.05], [-0.02, -0.05], [-0.25, -1], [0.5, 0.15], [0.05, 0.15], [0.35, 1]]);
  const corazonForma = () => { const s = new T.Shape(); s.moveTo(0, -0.9); s.bezierCurveTo(-0.2, -0.6, -1.1, -0.2, -1.1, 0.35); s.bezierCurveTo(-1.1, 0.85, -0.6, 1.05, -0.3, 1.0);
    s.bezierCurveTo(-0.1, 0.95, 0, 0.8, 0, 0.65); s.bezierCurveTo(0, 0.8, 0.1, 0.95, 0.3, 1.0); s.bezierCurveTo(0.6, 1.05, 1.1, 0.85, 1.1, 0.35); s.bezierCurveTo(1.1, -0.2, 0.2, -0.6, 0, -0.9); return s; };
  const llave = (c = '#94a3b8') => { const g = new T.Group(), m = mat(c, {m:0.85, r:0.25});
    g.add(malla(extruir(rect(0.32, 1.7, 0.14), 0.16, 0.05), m, [0, -0.35, 0]));
    g.add(malla(new T.TorusGeometry(0.38, 0.14, 12, 28, Math.PI * 1.55), m, [0, 0.72, 0], [0, 0, -Math.PI * 0.27 + Math.PI / 2]));
    return g; };
  const F = {
    mando(){ const g = new T.Group();
      g.add(malla(extruir(rect(2.4, 1.25, 0.55), 0.45, 0.12), mat('#4f46e5')));
      for (const x of [-0.95, 0.95]) g.add(malla(esfera(1), mat('#4338ca'), [x, -0.45, -0.02], [0, 0, x * 0.4], [0.5, 0.68, 0.38]));
      const cruz = mat('#e0e7ff'); g.add(malla(box(0.55, 0.17, 0.16), cruz, [-0.65, 0.08, 0.33])); g.add(malla(box(0.17, 0.55, 0.16), cruz, [-0.65, 0.08, 0.33]));
      [['#ef4444', 0.65, 0.28], ['#22c55e', 0.85, 0.08], ['#3b82f6', 0.45, 0.08], ['#facc15', 0.65, -0.12]].forEach(([c, x, y]) => g.add(malla(esfera(0.12), mat(c, {e:c, ei:0.25}), [x, y, 0.3])));
      return g; },
    libros(){ const g = new T.Group(), pag = mat('#f8fafc', {r:0.6});
      [['#ef4444', -0.55, 0.06], ['#2563eb', 0, -0.05], ['#16a34a', 0.55, 0.04]].forEach(([c, y, r]) => { const l = new T.Group(); l.position.y = y; l.rotation.z = r;
        l.add(malla(box(2.1, 0.46, 1.3), mat(c))); l.add(malla(box(1.95, 0.36, 1.32), pag, [0.08, 0, 0.01])); l.add(malla(box(0.06, 0.48, 1.32), mat('#fbbf24', {m:0.7}), [-0.7, 0, 0])); g.add(l); });
      return g; },
    cartas(){ const g = new T.Group();
      const atras = malla(extruir(rect(1.25, 1.75, 0.16), 0.05, 0.03), mat('#2563eb'), [-0.35, 0.05, -0.1], [0, 0, 0.28]); g.add(atras);
      const fr = new T.Group(); fr.position.set(0.3, -0.05, 0.1); fr.rotation.z = -0.18; g.add(fr);
      fr.add(malla(extruir(rect(1.25, 1.75, 0.16), 0.05, 0.03), mat('#f8fafc', {r:0.5})));
      fr.add(malla(extruir(poli([[0, 0.5], [0.36, 0], [0, -0.5], [-0.36, 0]]), 0.05, 0.03), mat('#e11d48'), [0, 0, 0.09]));
      return g; },
    casco(){ const g = new T.Group(), v = mat('#4d7c0f', {r:0.45});
      g.add(malla(new T.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), v, [0, -0.25, 0], [0, 0, 0], [1.05, 0.95, 1.05]));
      g.add(malla(new T.CylinderGeometry(1.25, 1.25, 0.08, 40), mat('#3f6212'), [0, -0.27, 0.12]));
      g.add(malla(new T.TorusGeometry(1.04, 0.07, 10, 40), mat('#365314'), [0, -0.15, 0], [Math.PI / 2, 0, 0]));
      g.add(malla(extruir(estrella(0.26, 0.11), 0.05, 0.02), mat('#facc15', {m:0.6}), [0, 0.25, 0.92], [-0.35, 0, 0]));
      g.rotation.x = 0.35; return g; },
    herramientas(){ const g = new T.Group(); const w = llave(); w.rotation.z = -0.75; w.position.set(0.15, 0, 0); g.add(w);
      const h = new T.Group(); h.rotation.z = 0.75; h.position.set(-0.1, 0, 0.18); g.add(h);
      h.add(malla(new T.CylinderGeometry(0.12, 0.14, 1.9, 14), mat('#b45309', {r:0.55}), [0, -0.2, 0]));
      h.add(malla(box(0.95, 0.38, 0.38), mat('#475569', {m:0.8, r:0.3}), [0, 0.78, 0]));
      return g; },
    casa(){ const g = new T.Group();
      g.add(malla(extruir(rect(1.5, 1.1, 0.08), 0.9, 0.06), mat('#f8fafc', {r:0.5}), [0, -0.4, 0]));
      g.add(malla(extruir(poli([[-1, 0], [0, 0.85], [1, 0]]), 1.1, 0.08), mat('#ef4444'), [0, 0.45, 0]));
      g.add(malla(box(0.38, 0.62, 0.1), mat('#92400e'), [0, -0.62, 0.55]));
      g.add(malla(box(0.32, 0.3, 0.1), mat('#7dd3fc', {e:'#38bdf8', ei:0.4}), [0.45, -0.3, 0.55]));
      return g; },
    mapa(){ const g = new T.Group();
      [['#fde68a', -0.7, 0.35], ['#bbf7d0', 0, -0.35], ['#fde68a', 0.7, 0.35]].forEach(([c, x, r]) => g.add(malla(box(0.72, 1.7, 0.06), mat(c, {r:0.6}), [x, 0, 0], [0, r, 0])));
      g.add(tubo([[-0.9, -0.4, 0.2], [-0.3, 0.1, 0.2], [0.2, -0.2, 0.2], [0.8, 0.3, 0.2]], 0.04, mat('#2563eb')));
      g.add(malla(new T.ConeGeometry(0.18, 0.55, 16), mat('#e11d48'), [0.45, 0.35, 0.35], [Math.PI, 0, 0])); g.add(malla(esfera(0.24), mat('#e11d48'), [0.45, 0.72, 0.35]));
      return g; },
    libro(){ const g = new T.Group(), pag = mat('#f8fafc', {r:0.55});
      g.add(malla(box(2.3, 0.12, 1.5), mat('#7c3aed'), [0, -0.12, 0]));
      for (const s of [-1, 1]){ const p = malla(box(1.05, 0.12, 1.4), pag, [s * 0.55, 0.02, 0], [0, 0, -s * 0.12]); g.add(p);
        for (let i = 0; i < 4; i++) g.add(malla(box(0.7, 0.02, 0.06), mat('#94a3b8'), [s * 0.55, 0.12 + 0.002, -0.45 + i * 0.28], [0, 0, -s * 0.12])); }
      g.rotation.x = 0.9; return g; },
    engrane(){ const s = new T.Shape(), n = 10;
      for (let i = 0; i <= n * 4; i++){ const a = i / (n * 4) * Math.PI * 2, R = (i % 4 < 2) ? 1.0 : 0.78; i ? s.lineTo(Math.cos(a) * R, Math.sin(a) * R) : s.moveTo(Math.cos(a) * R, Math.sin(a) * R); }
      const h = new T.Path(); h.absarc(0, 0, 0.32, 0, Math.PI * 2, true); s.holes.push(h);
      const g = new T.Group(); g.add(malla(extruir(s, 0.32, 0.06), mat('#94a3b8', {m:0.9, r:0.22}))); g.add(malla(new T.TorusGeometry(0.32, 0.07, 10, 30), mat('#38bdf8', {e:'#0ea5e9', ei:0.4})));
      return g; },
    menu(){ const g = new T.Group(); for (const y of [-0.55, 0, 0.55]) g.add(malla(extruir(rect(1.8, 0.3, 0.15), 0.16, 0.05), mat('#6366f1'), [0, y, 0])); return g; },
    integral(){ const g = new T.Group();
      g.add(tubo([[0.55, 1.05, 0], [0.35, 1.25, 0], [0.12, 1.05, 0], [0.02, 0.4, 0], [-0.02, -0.4, 0], [-0.12, -1.05, 0], [-0.35, -1.25, 0], [-0.55, -1.05, 0]], 0.15, mat('#ffffff', {e:'#c7d2fe', ei:0.25})));
      return g; },
    pausa(){ const g = new T.Group(); for (const x of [-0.38, 0.38]) g.add(malla(extruir(rect(0.42, 1.6, 0.16), 0.3, 0.07), mat('#f59e0b'), [x, 0, 0])); return g; },
    corazon(){ const g = new T.Group(); g.add(malla(extruir(corazonForma(), 0.45, 0.14), mat('#e11d48'), [0, 0, 0], [0, 0, 0])); return g; },
    rayo(){ const g = new T.Group(); g.add(malla(extruir(rayoForma(), 0.28, 0.07), mat('#facc15', {e:'#f59e0b', ei:0.35}))); return g; },
    ola(){ const g = new T.Group(), m = mat('#06b6d4');
      g.add(tubo([[-1.2, -0.2, 0], [-0.6, 0.3, 0], [0, -0.2, 0], [0.6, 0.3, 0], [1.2, -0.2, 0]], 0.16, m));
      g.add(tubo([[-1.2, -0.75, 0], [-0.6, -0.25, 0], [0, -0.75, 0], [0.6, -0.25, 0], [1.2, -0.75, 0]], 0.13, mat('#22d3ee')));
      [-0.6, 0.6].forEach(x => g.add(malla(esfera(0.12), mat('#f0f9ff'), [x, 0.42, 0])));
      return g; },
    abaco(){ const g = new T.Group(), mad = mat('#92400e', {r:0.5}), cols = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'];
      g.add(malla(box(2, 0.16, 0.25), mad, [0, 0.85, 0])); g.add(malla(box(2, 0.16, 0.25), mad, [0, -0.85, 0]));
      g.add(malla(box(0.16, 1.86, 0.25), mad, [-0.95, 0, 0])); g.add(malla(box(0.16, 1.86, 0.25), mad, [0.95, 0, 0]));
      [-0.45, 0.05, 0.5].forEach((y, k) => { g.add(malla(new T.CylinderGeometry(0.03, 0.03, 1.8, 8), mat('#d6d3d1', {m:0.8}), [0, y, 0], [0, 0, Math.PI / 2]));
        for (let i = 0; i < 3; i++) g.add(malla(esfera(0.17), mat(cols[(i + k) % 4]), [-0.6 + i * 0.36 + (k % 2) * 0.35, y, 0], [0, 0, 0], [1, 0.8, 0.8])); });
      return g; },
    rifle(){ const g = new T.Group(), met = mat('#334155', {m:0.8, r:0.3});
      g.add(malla(box(1.6, 0.32, 0.22), met)); g.add(malla(new T.CylinderGeometry(0.07, 0.07, 1.1, 12), met, [1.3, 0.05, 0], [0, 0, Math.PI / 2]));
      g.add(malla(new T.CylinderGeometry(0.1, 0.1, 0.7, 12), mat('#0ea5e9', {e:'#38bdf8', ei:0.4}), [0.1, 0.3, 0], [0, 0, Math.PI / 2]));
      g.add(malla(extruir(poli([[-0.8, 0.15], [-1.5, 0.05], [-1.5, -0.4], [-0.8, -0.15]]), 0.18, 0.04), mat('#b45309', {r:0.5})));
      g.add(malla(box(0.18, 0.45, 0.18), met, [0.1, -0.3, 0], [0, 0, -0.25]));
      g.rotation.z = 0.25; return g; },
    escudo(){ const g = new T.Group(), s = poli([[-0.9, 1], [0.9, 1], [0.9, 0.1], [0, -1.1], [-0.9, 0.1]]);
      g.add(malla(extruir(s, 0.25, 0.1), mat('#64748b', {m:0.8, r:0.25})));
      g.add(malla(extruir(poli([[-0.55, 0.7], [0.55, 0.7], [0.55, 0.05], [0, -0.65], [-0.55, 0.05]]), 0.1, 0.04), mat('#2563eb'), [0, 0.05, 0.2]));
      return g; },
    bomba(){ const g = new T.Group(); g.add(malla(esfera(0.85), mat('#1f2937', {r:0.25})));
      g.add(malla(new T.CylinderGeometry(0.22, 0.25, 0.3, 16), mat('#94a3b8', {m:0.8}), [0.45, 0.7, 0], [0, 0, -0.55]));
      g.add(tubo([[0.55, 0.85, 0], [0.7, 1.1, 0], [0.95, 1.15, 0]], 0.04, mat('#a16207')));
      g.add(malla(esfera(0.13), mat('#fde047', {e:'#f97316', ei:1.5}), [0.98, 1.16, 0]));
      g.add(malla(esfera(0.2), mat('#ffffff', {r:0.1}), [-0.3, 0.35, 0.65], [0, 0, 0], [1, 0.6, 0.4]));
      return g; },
    cruz(){ const g = new T.Group(); g.add(malla(new T.CylinderGeometry(1, 1, 0.25, 40), mat('#f8fafc', {r:0.4}), [0, 0, -0.1], [Math.PI / 2, 0, 0]));
      const c = poli([[-0.2, 0.65], [0.2, 0.65], [0.2, 0.2], [0.65, 0.2], [0.65, -0.2], [0.2, -0.2], [0.2, -0.65], [-0.2, -0.65], [-0.2, -0.2], [-0.65, -0.2], [-0.65, 0.2], [-0.2, 0.2]]);
      g.add(malla(extruir(c, 0.15, 0.05), mat('#dc2626'), [0, 0, 0.12])); return g; },
    llave(){ return llave('#facc15'); },
    luna(){ const g = new T.Group(), gm = new T.IcosahedronGeometry(1, 3);
      g.add(malla(gm, mat('#fef3c7', {r:0.7, e:'#fde68a', ei:0.25})));
      [[0.35, 0.3, 0.88, 0.2], [-0.4, -0.2, 0.86, 0.16], [0.1, -0.5, 0.85, 0.12]].forEach(([x, y, z, r]) => g.add(malla(esfera(r), mat('#fcd34d', {r:0.9}), [x, y, z], [0, 0, 0], [1, 1, 0.35])));
      g.add(malla(extruir(estrella(0.3, 0.12), 0.06, 0.03), mat('#fde047', {e:'#facc15', ei:0.8}), [1.05, 0.8, 0.2])); return g; },
    lluvia(){ const g = new T.Group(); nube(g, '#cbd5e1', 0.35);
      [-0.5, 0, 0.5].forEach((x, i) => g.add(malla(esfera(0.13), mat('#38bdf8', {e:'#0ea5e9', ei:0.3}), [x, -0.55 - (i % 2) * 0.2, 0.2], [0, 0, 0], [0.8, 1.5, 0.8]))); return g; },
    nieve(){ const g = new T.Group(), m = mat('#bae6fd', {e:'#7dd3fc', ei:0.3, r:0.2});
      for (let i = 0; i < 3; i++){ g.add(malla(box(2.1, 0.16, 0.16), m, [0, 0, 0], [0, 0, i * Math.PI / 3]));
        for (const s of [-1, 1]) for (const k of [0.55, 0.8]){ const a = i * Math.PI / 3; g.add(malla(box(0.4, 0.1, 0.1), m, [Math.cos(a) * k * s, Math.sin(a) * k * s, 0], [0, 0, a + Math.PI / 4])); g.add(malla(box(0.4, 0.1, 0.1), m, [Math.cos(a) * k * s, Math.sin(a) * k * s, 0], [0, 0, a - Math.PI / 4])); } }
      return g; },
    niebla(){ const g = new T.Group(); [[0.5, 1.8, 0], [0, 1.5, 0.25], [-0.5, 1.9, -0.15]].forEach(([y, w, x]) => g.add(malla(new T.CapsuleGeometry(0.2, w, 6, 14), mat('#cbd5e1', {r:0.7}), [x, y, 0], [0, 0, Math.PI / 2]))); return g; },
    tormenta(){ const g = new T.Group(); nube(g, '#64748b', 0.45); g.add(malla(extruir(rayoForma(), 0.18, 0.05), mat('#facc15', {e:'#f59e0b', ei:0.6}), [0.1, -0.5, 0.35], [0, 0, 0], [0.55, 0.55, 0.55])); return g; },
    viento(){ const g = new T.Group(), m = mat('#a5f3fc', {e:'#67e8f9', ei:0.2});
      g.add(tubo([[-1.1, 0.45, 0], [0.4, 0.45, 0], [0.75, 0.7, 0], [0.55, 0.95, 0], [0.35, 0.8, 0]], 0.09, m));
      g.add(tubo([[-1.2, 0, 0], [0.8, 0, 0], [1.1, -0.25, 0], [0.9, -0.5, 0], [0.7, -0.35, 0]], 0.09, m));
      g.add(tubo([[-0.9, -0.5, 0], [0.1, -0.5, 0]], 0.08, m)); return g; },
    puzzle(){ const g = new T.Group(), m = mat('#0ea5e9');
      g.add(malla(extruir(rect(1.5, 1.5, 0.12), 0.4, 0.08), m));
      g.add(malla(new T.CylinderGeometry(0.32, 0.32, 0.56, 28), m, [0, 0.92, 0], [Math.PI / 2, 0, 0]));
      g.add(malla(new T.CylinderGeometry(0.32, 0.32, 0.56, 28), m, [0.92, 0, 0], [Math.PI / 2, 0, 0]));
      g.add(malla(new T.CylinderGeometry(0.3, 0.3, 0.6, 28), mat('#0f172a', {r:0.8}), [-0.75, 0, 0], [Math.PI / 2, 0, 0], [1, 1, 0.2]));
      return g; },
    ladrillos(){ const g = new T.Group(), c = ['#ea580c', '#c2410c', '#f97316'];
      [[-0.55, -0.4], [0.55, -0.4], [0, 0.18], [-1.1, 0.18], [1.1, 0.18], [-0.55, 0.76], [0.55, 0.76]].forEach(([x, y], i) => {
        if (Math.abs(x) > 1) return; g.add(malla(extruir(rect(1.0, 0.5, 0.06), 0.45, 0.04), mat(c[i % 3], {r:0.6}), [x, y, 0])); });
      return g; },
    grafica(){ const g = new T.Group();
      [[-0.75, 0.6, '#34d399'], [-0.15, 1.0, '#10b981'], [0.45, 1.5, '#059669']].forEach(([x, h, c]) => g.add(malla(extruir(rect(0.42, h, 0.06), 0.35, 0.04), mat(c), [x, -0.8 + h / 2, 0])));
      g.add(tubo([[-1.0, -0.2, 0.35], [-0.3, 0.1, 0.35], [0.2, 0.0, 0.35], [0.85, 0.75, 0.35]], 0.07, mat('#facc15', {e:'#f59e0b', ei:0.3})));
      g.add(malla(new T.ConeGeometry(0.17, 0.4, 16), mat('#facc15', {e:'#f59e0b', ei:0.3}), [0.95, 0.88, 0.35], [0, 0, -0.75]));
      return g; },
    bandera(){ const g = new T.Group();
      g.add(malla(new T.CylinderGeometry(0.07, 0.07, 2.4, 12), mat('#cbd5e1', {m:0.8}), [-0.75, 0, 0]));
      g.add(malla(esfera(0.13), mat('#facc15', {m:0.7}), [-0.75, 1.25, 0]));
      const pg = new T.PlaneGeometry(1.4, 0.9, 16, 4), pp = pg.attributes.position;
      for (let i = 0; i < pp.count; i++){ const x = pp.getX(i); pp.setZ(i, Math.sin((x + 0.7) * 3.5) * 0.12 * (x + 0.7)); }
      pg.computeVertexNormals(); g.add(malla(pg, mat('#ef4444'), [0, 0.65, 0]));
      return g; },
    check(){ const g = new T.Group();
      g.add(malla(extruir(poli([[-0.95, 0.1], [-0.55, 0.5], [-0.25, 0.2], [0.6, 1.05], [1.0, 0.65], [-0.25, -0.6]]), 0.35, 0.09), mat('#22c55e', {e:'#16a34a', ei:0.2})));
      return g; },
    candado(){ const g = new T.Group();
      g.add(malla(new T.TorusGeometry(0.45, 0.13, 12, 28, Math.PI), mat('#94a3b8', {m:0.9, r:0.2}), [0, 0.35, 0]));
      for (const x of [-0.45, 0.45]) g.add(malla(new T.CylinderGeometry(0.13, 0.13, 0.35, 14), mat('#94a3b8', {m:0.9, r:0.2}), [x, 0.2, 0]));
      g.add(malla(extruir(rect(1.4, 1.0, 0.18), 0.5, 0.08), mat('#f59e0b', {m:0.6, r:0.3}), [0, -0.45, 0]));
      g.add(malla(esfera(0.13), mat('#1f2937'), [0, -0.35, 0.33])); g.add(malla(box(0.1, 0.3, 0.1), mat('#1f2937'), [0, -0.55, 0.33]));
      return g; },
    medalla(){ const g = new T.Group();
      g.add(malla(extruir(poli([[-0.55, 1.3], [-0.15, 1.3], [0.05, 0.4], [-0.25, 0.4]]), 0.05, 0.02), mat('#2563eb'), [0, 0, -0.2]));
      g.add(malla(extruir(poli([[0.55, 1.3], [0.15, 1.3], [-0.05, 0.4], [0.25, 0.4]]), 0.05, 0.02), mat('#dc2626'), [0, 0, -0.18]));
      g.add(malla(new T.CylinderGeometry(0.75, 0.75, 0.2, 40), mat('#fbbf24', {m:0.85, r:0.2}), [0, -0.25, 0], [Math.PI / 2, 0, 0]));
      g.add(malla(new T.TorusGeometry(0.75, 0.07, 10, 40), mat('#f59e0b', {m:0.9, r:0.2}), [0, -0.25, 0]));
      g.add(malla(extruir(estrella(0.45, 0.19), 0.08, 0.03), mat('#fef3c7', {m:0.6, r:0.25}), [0, -0.25, 0.14]));
      return g; },
    trofeo(){ const g = new T.Group(), oro = mat('#fbbf24', {m:0.9, r:0.18});
      const perfil = [[0, -0.2], [0.55, -0.15], [0.75, 0.3], [0.8, 0.9], [0.7, 0.92], [0.6, 0.35], [0.4, 0.0], [0, -0.05]].map(([x, y]) => new T.Vector2(x, y));
      g.add(malla(new T.LatheGeometry(perfil, 32), oro, [0, 0.15, 0]));
      for (const s of [-1, 1]) g.add(malla(new T.TorusGeometry(0.32, 0.07, 10, 24, Math.PI * 1.2), oro, [s * 0.82, 0.65, 0], [0, s > 0 ? 0 : Math.PI, -Math.PI * 0.6]));
      g.add(malla(new T.CylinderGeometry(0.1, 0.16, 0.5, 14), oro, [0, -0.25, 0]));
      g.add(malla(extruir(rect(1.0, 0.3, 0.06), 0.6, 0.04), mat('#7c2d12', {r:0.5}), [0, -0.65, 0]));
      return g; },
    planta(){ const g = new T.Group();
      g.add(malla(new T.CylinderGeometry(0.55, 0.4, 0.7, 24), mat('#b45309', {r:0.6}), [0, -0.75, 0]));
      g.add(malla(new T.CylinderGeometry(0.05, 0.05, 0.9, 8), mat('#15803d'), [0, -0.05, 0]));
      for (const s of [-1, 1]) g.add(malla(esfera(1), mat('#22c55e'), [s * 0.35, 0.35 + (s > 0 ? 0.15 : 0), 0], [0, 0, s * -0.6], [0.45, 0.2, 0.25]));
      return g; },
    espadas(){ const g = new T.Group();
      for (const s of [-1, 1]){ const e = new T.Group(); e.rotation.z = s * 0.75; g.add(e);
        e.add(malla(extruir(poli([[-0.1, -0.3], [0.1, -0.3], [0.1, 1.1], [0, 1.3], [-0.1, 1.1]]), 0.06, 0.03), mat('#e2e8f0', {m:0.9, r:0.15})));
        e.add(malla(box(0.6, 0.12, 0.14), mat('#fbbf24', {m:0.8}), [0, -0.45, 0]));
        e.add(malla(new T.CylinderGeometry(0.07, 0.07, 0.45, 10), mat('#7c2d12'), [0, -0.75, 0])); }
      return g; },
    fuego(){ const g = new T.Group();
      [['#ef4444', 1, 0, 0], ['#f97316', 0.72, 0.05, 0.15], ['#fde047', 0.45, 0.1, 0.3]].forEach(([c, s, x, z]) => {
        g.add(malla(esfera(0.6 * s), mat(c, {e:c, ei:0.7}), [x, -0.35 * s, z])); g.add(malla(new T.ConeGeometry(0.58 * s, 1.5 * s, 20), mat(c, {e:c, ei:0.7}), [x, 0.4 * s, z])); });
      return g; },
    calavera(){ const g = new T.Group(), hueso = mat('#f5f5f4', {r:0.5});
      g.add(malla(esfera(0.85), hueso, [0, 0.15, 0], [0, 0, 0], [1, 0.95, 0.9])); g.add(malla(extruir(rect(0.9, 0.5, 0.12), 0.5, 0.05), hueso, [0, -0.6, 0.15]));
      for (const x of [-0.32, 0.32]) g.add(malla(esfera(0.22), mat('#0f172a', {r:0.9}), [x, 0.1, 0.66], [0, 0, 0], [1, 1.1, 0.5]));
      g.add(malla(new T.ConeGeometry(0.1, 0.2, 3), mat('#0f172a'), [0, -0.18, 0.75], [0, 0, Math.PI]));
      return g; },
    matraz(){ const g = new T.Group(), vidrio = new T.MeshPhysicalMaterial({color:0xe0f2fe, transparent:true, opacity:0.35, roughness:0.05, clearcoat:1, side:T.DoubleSide});
      g.add(malla(esfera(0.75), vidrio, [0, -0.35, 0])); g.add(malla(new T.CylinderGeometry(0.22, 0.25, 0.9, 20, 1, true), vidrio, [0, 0.65, 0]));
      g.add(malla(esfera(0.62), mat('#a855f7', {e:'#c084fc', ei:0.6}), [0, -0.42, 0], [0, 0, 0], [1, 0.8, 1]));
      g.add(malla(new T.TorusGeometry(0.24, 0.05, 8, 20), mat('#cbd5e1', {m:0.8}), [0, 1.1, 0], [Math.PI / 2, 0, 0]));
      [[0.15, 1.35], [-0.1, 1.6]].forEach(([x, y]) => g.add(malla(esfera(0.09), mat('#e9d5ff', {e:'#c084fc', ei:0.8}), [x, y, 0])));
      return g; },
    alien(){ const g = new T.Group();
      g.add(malla(esfera(1), mat('#4ade80', {r:0.4}), [0, 0, 0], [0, 0, 0], [0.85, 1.05, 0.8]));
      for (const s of [-1, 1]) g.add(malla(esfera(0.32), mat('#020617', {r:0.1}), [s * 0.36, 0.1, 0.62], [0, 0, s * -0.5], [1, 1.5, 0.6]));
      return g; },
    planeta(){ const g = new T.Group();
      g.add(malla(new T.IcosahedronGeometry(0.85, 3), mat('#a855f7', {r:0.5, e:'#581c87', ei:0.3})));
      g.add(malla(new T.TorusGeometry(1.25, 0.09, 10, 48), mat('#f0abfc', {e:'#e879f9', ei:0.3}), [0, 0, 0], [Math.PI / 2 - 0.35, 0.3, 0], [1, 1, 0.25]));
      g.add(malla(esfera(0.18), mat('#e2e8f0', {r:0.8}), [1.15, 0.65, 0.3]));
      return g; },
    infinito(){ const g = new T.Group(), pts = [];
      for (let i = 0; i < 64; i++){ const a = i / 64 * Math.PI * 2, d = 1 + Math.sin(a) ** 2; pts.push([1.1 * Math.cos(a) / d, 1.1 * Math.sin(a) * Math.cos(a) / d, 0.15 * Math.sin(a)]); }
      g.add(tubo(pts, 0.14, mat('#22d3ee', {e:'#06b6d4', ei:0.3}), true)); return g; },
    chincheta(){ const g = new T.Group();
      g.add(malla(new T.CylinderGeometry(0.55, 0.55, 0.25, 32), mat('#ef4444'), [0, 0.65, 0])); g.add(malla(new T.CylinderGeometry(0.25, 0.4, 0.55, 24), mat('#ef4444'), [0, 0.3, 0]));
      g.add(malla(new T.ConeGeometry(0.07, 0.8, 10), mat('#cbd5e1', {m:0.9}), [0, -0.35, 0], [Math.PI, 0, 0])); g.rotation.z = -0.5; return g; },
    varita(){ const g = new T.Group(); g.add(malla(new T.CylinderGeometry(0.08, 0.08, 1.9, 12), mat('#1f2937'), [-0.25, -0.35, 0], [0, 0, 0.6]));
      g.add(malla(new T.CylinderGeometry(0.085, 0.085, 0.3, 12), mat('#f8fafc'), [-0.75, -0.95, 0], [0, 0, 0.6]));
      g.add(malla(extruir(estrella(0.5, 0.21), 0.12, 0.04), mat('#facc15', {e:'#f59e0b', ei:0.6}), [0.35, 0.55, 0]));
      [[0.9, 0.95], [0.75, 0.05], [-0.05, 1.0]].forEach(([x, y]) => g.add(malla(esfera(0.07), mat('#fef08a', {e:'#facc15', ei:1}), [x, y, 0]))); return g; },
    bombilla(){ const g = new T.Group(), vidrio = new T.MeshPhysicalMaterial({color:0xfef9c3, emissive:0xfde047, emissiveIntensity:0.5, transparent:true, opacity:0.85, roughness:0.1, clearcoat:1});
      g.add(malla(esfera(0.75), vidrio, [0, 0.3, 0])); g.add(malla(new T.CylinderGeometry(0.32, 0.38, 0.4, 20), vidrio, [0, -0.35, 0]));
      for (let i = 0; i < 3; i++) g.add(malla(new T.CylinderGeometry(0.33, 0.33, 0.1, 20), mat('#94a3b8', {m:0.8}), [0, -0.62 - i * 0.13, 0]));
      g.add(malla(new T.TorusGeometry(0.18, 0.03, 6, 16, Math.PI), mat('#f59e0b', {e:'#f97316', ei:1}), [0, 0.25, 0])); return g; },
    mano(){ const g = new T.Group(), piel = mat('#fbbf24', {r:0.45});
      g.add(malla(extruir(rect(1.1, 1.0, 0.35), 0.35, 0.1), piel, [0, -0.4, 0]));
      [[-0.4, 0.75], [-0.13, 0.95], [0.14, 0.9], [0.41, 0.72]].forEach(([x, l]) => g.add(malla(new T.CapsuleGeometry(0.13, l, 6, 12), piel, [x, 0.15 + l / 2, 0])));
      g.add(malla(new T.CapsuleGeometry(0.14, 0.55, 6, 12), piel, [-0.7, -0.3, 0], [0, 0, 0.8])); return g; },
    papelera(){ const g = new T.Group(), m = mat('#64748b', {m:0.6, r:0.35});
      g.add(malla(new T.CylinderGeometry(0.65, 0.5, 1.4, 24, 1, true), m, [0, -0.2, 0])); g.add(malla(new T.CylinderGeometry(0.5, 0.5, 0.06, 24), m, [0, -0.9, 0]));
      g.add(malla(new T.CylinderGeometry(0.75, 0.75, 0.15, 24), mat('#475569', {m:0.7}), [0, 0.6, 0])); g.add(malla(new T.TorusGeometry(0.2, 0.05, 8, 16, Math.PI), m, [0, 0.7, 0])); return g; },
  };
  /** Modelo listo para dibujar: centrado y del mismo tamaño (cabe en 2,2 unidades). */
  /** Gema hexagonal con un símbolo matemático grabado (𝑥, ±, ½, √…): para glifos que no son dibujos. */
  function gema(glifo){
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d');
    const gr = c.createRadialGradient(110, 100, 10, 128, 128, 140); gr.addColorStop(0, '#c4b5fd'); gr.addColorStop(1, '#4c1d95'); c.fillStyle = gr; c.fillRect(0, 0, 256, 256);
    const letra = /^[a-zA-Z]$/.test(glifo = glifo.normalize('NFKC'));   // 𝑥 (letra matemática) → x en cursiva
    c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `${letra ? 'italic ' : ''}bold ${glifo.length > 2 ? 92 : 150}px "Times New Roman", serif`;
    c.shadowColor = 'rgba(30,10,60,.6)'; c.shadowBlur = 8; c.fillText(glifo, 128, 138);
    const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
    const lado = mat('#7c3aed', {m:0.6, r:0.25}), cara = new T.MeshPhysicalMaterial({map:tex, roughness:0.3, clearcoat:1, emissive:0xffffff, emissiveMap:tex, emissiveIntensity:0.25});
    const g = new T.Group(); g.add(malla(new T.CylinderGeometry(1, 1, 0.4, 6), [lado, cara, cara], [0, 0, 0], [Math.PI / 2, Math.PI / 6, 0]));
    g.add(malla(new T.TorusGeometry(1.02, 0.06, 6, 6), mat('#e9d5ff', {m:0.8}), [0, 0, 0], [0, 0, Math.PI / 6]));
    return g;
  }
  function crear(nombre){
    if (cache.has(nombre)) return cache.get(nombre);
    const f = nombre.startsWith('glifo:') ? () => gema(decodeURIComponent(nombre.slice(6))) : F[nombre]; if (!f) return null;
    const raiz = new T.Group(), g = f(); raiz.add(g);
    const caja = new T.Box3().setFromObject(raiz), tam = caja.getSize(new T.Vector3()), c = caja.getCenter(new T.Vector3());
    g.position.sub(c); raiz.scale.setScalar(2.2 / Math.max(tam.x, tam.y, tam.z * 0.7));
    cache.set(nombre, raiz); return raiz;
  }
  return {crear, nombres:Object.keys(F)};
})();
/** Emojis de la app que tienen icono 3D modelado. */
const EMOJI_3D = {'🧩':'puzzle', '🧱':'ladrillos', '📈':'grafica', '∫':'integral', '🎮':'mando', '🗺️':'mapa', '🏠':'casa', '📖':'libro', '📚':'libros', '🃏':'cartas',
  '🚩':'bandera', '⚡':'rayo', '🪖':'casco', '🔬':'matraz', '🌱':'planta', '⚔️':'espadas', '🔥':'fuego', '💀':'calavera', '✅':'check', '✓':'check', '🔒':'candado',
  '👽':'alien', '🔫':'rifle', '💣':'bomba', '🛡️':'escudo', '⛑️':'cruz', '🔧':'llave', '❤️':'corazon', '🌊':'ola', '⚙️':'engrane', '🛠':'herramientas', '🏆':'trofeo', '🏅':'medalla', '🧮':'abaco',
  '🪐':'planeta', '♾️':'infinito', '📌':'chincheta', '🪄':'varita', '💡':'bombilla', '✋':'mano', '🗑':'papelera', '✔':'check', '❓':'bombilla', '🎖️':'medalla'};
/** Nombre del modelo de un emoji (con o sin selector de variación U+FE0F). */
const nombreIcono3D = e => { const b = String(e).replace(/\uFE0F/g, ''); return EMOJI_3D[e] ?? EMOJI_3D[b] ?? EMOJI_3D[b + '\uFE0F']; };
/** HTML de un icono: modelo 3D si existe (el emoji queda para 2D), si no el emoji tal cual. */
function icono3D(emoji, clases = 'inline-block h-[1.2em] w-[1.3em] align-[-0.25em]'){
  const glifo = {'🔢':'123', '🔤':'abc', '🔣':'+−'}[emoji], n = glifo ? null : nombreIcono3D(emoji); if (glifo) emoji = glifo;   // categorías de fichas: el símbolo grabado
  if (n) return `<span data-i3d="${n}" class="${clases}">${emoji}</span>`;
  // Símbolos que no son dibujos (𝑥, ±, ½, √, 123…): grabados en una gema 3D
  if (emoji && String(emoji).length <= 4 && !/\p{Extended_Pictographic}/u.test(emoji)) return `<span data-i3d="glifo:${encodeURIComponent(emoji)}" class="${clases}">${emoji}</span>`;
  return emoji;
}
/** Separa un emoji inicial de su texto («🏠 Inicio») y lo vuelve icono 3D. */
const conIcono3D = (txt, clases) => { const m = /^(\S+)\s+([\s\S]*)$/.exec(txt); return m && nombreIcono3D(m[1]) ? `${icono3D(m[1], clases)} ${m[2]}` : txt; };
/** Icono 3D de cada clima y de cada tipo de soldado. */
const ICONO_CLIMA = {despejado:'luna', lluvia:'lluvia', niebla:'niebla', nieve:'nieve', tormenta:'tormenta', viento:'viento'};
const ICONO_TROPA = {fusilero:'rifle', pesado:'escudo', granadero:'bomba', medico:'cruz', ingeniero:'llave'};

/* ---------- Lienzos 3D de la interfaz ----------
   Con un solo renderer compartido convierte en 3D los elementos marcados:
   - data-i3d="nombre": icono 3D modelado (Iconos3D) que flota y se balancea; el emoji
     del HTML queda oculto (solo se ve con gráficos 2D).
   - data-barra3d="#color": barra de progreso como tubo de cristal con energía líquida.
   Se dibujan solo los visibles, a ~30 cuadros/s, y nada con gráficos 2D.
   Las vitrinas del Catálogo y los emblemas de las cartas usan este mismo renderer. */
const Lienzos3D = (() => {
  if (!Kit3D) return {pintarEn:() => {}, vigilar:() => {}, pulso:() => {}};
  const T = THREE;
  let R = null, rw = 0, rh = 0;
  /** Renderer compartido. */
  function renderer(){
    if (R) return R;
    R = new T.WebGLRenderer({canvas:document.createElement('canvas'), antialias:true, alpha:true, preserveDrawingBuffer:true});   // sin esto, algunos navegadores (Safari) copian el lienzo vacío
    R.setPixelRatio(1); R.outputColorSpace = T.SRGBColorSpace; R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 1.25;
    R.shadowMap.enabled = Graficos.alta; R.shadowMap.type = T.PCFSoftShadowMap; R.setClearColor(0x000000, 0);
    return R;
  }
  /** Dibuja {S, cam, cv, ctx, efx?} en el renderer compartido y lo copia al lienzo 2D. */
  function pintarEn(v){
    const r = renderer(), w = v.cv.width, h = v.cv.height;
    if (w < 2 || h < 2) return;
    if (w > rw || h > rh){ rw = Math.max(w, rw); rh = Math.max(h, rh); r.setSize(rw, rh, false); }
    r.setViewport(0, 0, w, h); r.setScissor(0, 0, w, h); r.setScissorTest(true); r.clear();
    v.efx?.escala(h, v.cam.fov ?? 30);
    r.render(v.S, v.cam);
    v.ctx.clearRect(0, 0, w, h); v.ctx.drawImage(r.domElement, 0, rh - h, w, h, 0, 0, w, h);   // el viewport empieza abajo a la izquierda
  }

  /* ---- Barras: un rectángulo que llena el lienzo, con sombreador de tubo ---- */
  const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }`;
  const FRAG_BARRA = `varying vec2 vUv; uniform float t; uniform vec2 res; uniform vec3 c1; uniform vec3 c2; uniform float claro; uniform float frac; uniform float bajo;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float caja(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
    void main(){
      vec2 px = vUv * res, c = res * 0.5; float r = res.y * 0.5 - 1.0;
      float d = caja(px - c, vec2(res.x * 0.5 - 1.0, r), r);
      if (d > 1.0) discard;
      float y = (vUv.y - 0.5) * 2.0, cil = sqrt(max(0.0, 1.0 - y * y));            // sombreado de tubo (cilindro)
      vec3 vidrio = mix(vec3(0.05, 0.06, 0.12), vec3(0.82, 0.85, 0.92), claro) * (0.55 + 0.45 * cil);
      float lleno = step(vUv.x, frac);
      float flujo = 0.5 + 0.5 * sin((vUv.x * res.x * 0.25) - t * 6.0 + y * 2.0);
      float burb = step(0.975, hash(floor(vec2(px.x * 0.3 - t * 14.0, px.y * 0.3)))) * 0.35;
      vec3 liq = c1 * (0.45 + 0.75 * cil) + c2 * flujo * 0.35 + burb;
      liq *= bajo > 0.5 ? 0.75 + 0.25 * sin(t * 10.0) : 1.0;
      vec3 col = mix(vidrio, liq, lleno);
      col += c1 * exp(-abs(vUv.x - frac) * res.x * 0.25) * 1.2 * step(0.01, frac) * step(frac, 0.995);   // frente brillante
      col += vec3(1.0) * pow(max(0.0, 1.0 - abs(y - 0.45) * 3.2), 3.0) * 0.55;                          // reflejo
      col += vec3(0.6, 0.7, 1.0) * (1.0 - smoothstep(0.0, 1.2, abs(d + 0.6))) * 0.35;                    // borde
      gl_FragColor = vec4(col, 1.0 - smoothstep(0.0, 1.0, d));
      #include <colorspace_fragment>
    }`;
  let sB, camB, quadBarra, matBarra, sI, camI, soporte;
  function preparar(){
    sB = new T.Scene(); camB = new T.PerspectiveCamera(40, 3, 1, 10);
    matBarra = new T.ShaderMaterial({vertexShader:VERT, fragmentShader:FRAG_BARRA, transparent:true, depthWrite:false, depthTest:false,
      uniforms:{t:{value:0}, res:{value:new T.Vector2(1, 1)}, c1:{value:new T.Color()}, c2:{value:new T.Color()}, claro:{value:0}, frac:{value:0}, bajo:{value:0}}});
    quadBarra = new T.Mesh(new T.PlaneGeometry(2, 2), matBarra); quadBarra.frustumCulled = false; sB.add(quadBarra);
    // Escena de iconos: luces de estudio y un soporte donde se cuelga el modelo de cada icono
    sI = new T.Scene(); camI = new T.PerspectiveCamera(30, 1, 0.1, 50); soporte = new T.Group(); sI.add(soporte);
    sI.add(new T.HemisphereLight(0xffffff, 0x334155, 1.4));
    const k = new T.DirectionalLight(0xffffff, 2.6); k.position.set(2, 3, 4); sI.add(k);
    const r = new T.DirectionalLight(0xa5b4fc, 1.6); r.position.set(-3, 1, -2); sI.add(r);
  }
  /** Autoprueba: pinta un cuadro rojo con el renderer compartido, lo copia y lee el píxel.
      Si sale vacío, la interfaz 3D se apaga y todo vuelve a verse con iconos y textos normales. */
  let probado = false;
  function autoprueba(){
    if (probado) return !Graficos.ui3dRoto; probado = true;
    try {
      const S = new T.Scene(), cam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 2), m = new T.Mesh(new T.PlaneGeometry(2, 2), new T.MeshBasicMaterial({color:0xff0000, toneMapped:false}));
      S.add(m); cam.position.z = 1;
      const cv = document.createElement('canvas'); cv.width = cv.height = 8; const ctx = cv.getContext('2d', {willReadFrequently:true});
      pintarEn({cv, ctx, S, cam});
      const [r, , , a] = ctx.getImageData(4, 4, 1, 1).data; m.geometry.dispose(); m.material.dispose();
      if (!(r > 150 && a > 150)) throw new Error('copia vacía');
    } catch (err){ console.warn('Interfaz 3D desactivada:', err.message); Graficos.ui3dRoto = true; Graficos.marcar(); }
    return !Graficos.ui3dRoto;
  }
  const lista = new Set(), vis = new WeakMap();
  let io = null, raf = 0, ultimo = 0;
  function registrar(el){
    if (lista.has(el) || !Graficos.ui3d || !autoprueba()) return;
    if (!sB) preparar();
    io ??= new IntersectionObserver(es => es.forEach(e => vis.set(e.target, e.isIntersecting)));
    const cv = document.createElement('canvas'); cv.className = el.dataset.i3d != null ? 't3d' : 'lienzo3d'; cv.setAttribute('aria-hidden', 'true');
    el.l3 = {cv, ctx:cv.getContext('2d'), fase:Math.random() * 10};
    if (el.dataset.i3d != null){
      el.classList.add('t3d-on'); el.append(cv);
      // La app cambia el texto con textContent (eso borra el lienzo): se vuelve a poner antes de pintar la pantalla
      el.l3.mo = new MutationObserver(() => { if (cv.parentNode !== el) el.append(cv); }); el.l3.mo.observe(el, {childList:true});
    } else el.prepend(cv);
    lista.add(el); io.observe(el);
    if (!raf) raf = requestAnimationFrame(paso);
  }
  function soltar(el){ lista.delete(el); io.unobserve(el); el.l3?.mo?.disconnect(); el.l3?.cv.remove(); el.classList.remove('t3d-on'); }
  function paso(now){
    raf = 0;
    if (now - ultimo >= 33){ ultimo = now; const t = now / 1000, claro = document.documentElement.classList.contains('dark') ? 0 : 1;
      for (const el of lista){
        if (!el.isConnected || !Graficos.ui3d){ soltar(el); continue; }
        if (vis.get(el) === false) continue;
        const L = el.l3, b = L.cv.getBoundingClientRect(); if (b.width < 2 || b.height < 2) continue;
        const k = Math.min(window.devicePixelRatio || 1, 2) * (Graficos.alta ? 1 : 0.75), w = Math.round(b.width * k), h = Math.round(b.height * k);
        if (L.cv.width !== w || L.cv.height !== h){ L.cv.width = w; L.cv.height = h; }
        if (el.dataset.barra3d != null){
          const U = matBarra.uniforms, fill = el.querySelector(':scope > :not(canvas)'), f = fill ? (parseFloat(fill.style.width) || (fill.offsetWidth / Math.max(1, el.clientWidth) * 100)) / 100 : 0;
          L.frac = L.frac == null ? f : L.frac + (f - L.frac) * 0.25;   // se llena suave
          const c = el.dataset.barra3d || '#38bdf8';
          U.t.value = t + L.fase; U.res.value.set(w, h); U.claro.value = el.closest('#juego:not(.juego-menu)') ? 0 : claro;   // la batalla siempre es de noche
          U.frac.value = Math.max(0, Math.min(1, L.frac)); U.c1.value.copy(Kit3D.color(c)); U.c2.value.copy(Kit3D.color('#ffffff')).lerp(Kit3D.color(c), 0.4);
          U.bajo.value = fill?.classList.contains('animate-pulse') ? 1 : 0;
          pintarEn({cv:L.cv, ctx:L.ctx, S:sB, cam:camB});
          continue;
        }
        // Icono 3D: se cuelga su modelo en el soporte, se balancea y se dibuja
        const modelo = Iconos3D.crear(el.dataset.i3d); if (!modelo){ L.ctx.clearRect(0, 0, w, h); continue; }
        soporte.clear(); soporte.add(modelo);
        const f = t * 1.1 + L.fase, giro = (f % 9) < 1.2 ? (f % 9) / 1.2 * Math.PI * 2 : 0;   // de vez en cuando da una vuelta
        soporte.rotation.set(0.12 + Math.sin(f * 0.8) * 0.12, Math.sin(f) * 0.45 + giro, Math.sin(f * 0.6) * 0.05); soporte.position.y = Math.sin(f * 1.6) * 0.06;
        const lado = Math.min(w, h) / h;   // el icono ocupa el lado menor del lienzo
        camI.aspect = w / h; camI.position.set(0, 0, 1.55 / Math.tan(15 * Math.PI / 180) / lado); camI.lookAt(0, 0, 0); camI.updateProjectionMatrix();
        pintarEn({cv:L.cv, ctx:L.ctx, S:sI, cam:camI});
      }
    }
    if (lista.size) raf = requestAnimationFrame(paso);
  }
  /** Busca elementos marcados que aparezcan en la página (la app pinta con innerHTML). */
  function vigilar(){
    if (vigilar.hecho) return; vigilar.hecho = true;
    const buscar = n => { if (n.nodeType !== 1) return; if (n.matches('[data-i3d],[data-barra3d]')) registrar(n); n.querySelectorAll('[data-i3d],[data-barra3d]').forEach(registrar); };
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(buscar))).observe(document.body, {childList:true, subtree:true});
    buscar(document.body);
    document.addEventListener('graficos:cambio', () => { if (Graficos.ui3d) buscar(document.body); });
  }
  return {pintarEn, vigilar, renderer, autoprueba, pulso:() => {}};
})();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => Lienzos3D.vigilar()); else Lienzos3D.vigilar();
