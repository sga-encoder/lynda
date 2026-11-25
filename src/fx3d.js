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
  /** Clase en <html> para el estilo 3D de las cartas (inclinación y brillo holográfico). */
  marcar(){ document.documentElement.classList.toggle('cartas3d', this.es3D); },
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
