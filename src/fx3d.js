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

/* ---------- Lienzos 3D de la interfaz ----------
   Con un solo renderer compartido convierte en 3D los elementos marcados:
   - data-panel3d="rejilla": lienzo donde se resuelve (suelo holográfico en perspectiva,
     horizonte brillante y figuras de cristal flotando; destella al acertar).
   - data-panel3d="hud" | "nav": barra superior del juego y barra inferior de menús
     (aurora animada, borde de neón y luz bajo la sección activa).
   - data-barra3d="#color": barra de progreso como tubo de cristal con energía líquida.
   Se dibujan solo los visibles, a ~30 cuadros/s, y nada con gráficos 2D. */
const Lienzos3D = (() => {
  if (!Kit3D) return {pintarEn:() => {}, vigilar:() => {}, pulso:() => {}};
  const T = THREE;
  let R = null, rw = 0, rh = 0;
  /** Renderer compartido (también lo usan las vitrinas y emblemas del juego). */
  function renderer(){
    if (R) return R;
    R = new T.WebGLRenderer({canvas:document.createElement('canvas'), antialias:true, alpha:true});
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

  /* ---- Sombreadores: un rectángulo que llena el lienzo ---- */
  const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }`;
  const COMUN = `varying vec2 vUv; uniform float t; uniform vec2 res; uniform vec3 c1; uniform vec3 c2; uniform float claro; uniform float pulso;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float linea(float x, float w){ float f = abs(fract(x) - 0.5); return 1.0 - smoothstep(0.0, w * fwidth(x) * 1.5 + 0.001, 0.5 - f); }`;
  const FRAG_PANEL = COMUN + `uniform float modo; uniform vec4 act;
    void main(){
      vec2 uv = vUv, px = uv * res; vec3 col;
      vec3 fondo0 = mix(vec3(0.015, 0.02, 0.06), vec3(0.97, 0.97, 0.99), claro), fondo1 = mix(vec3(0.06, 0.05, 0.17), vec3(0.92, 0.93, 0.99), claro);
      col = mix(fondo0, fondo1, uv.y);
      if (modo < 0.5){                                   // rejilla holográfica
        float hz = 0.46;
        if (uv.y < hz){ float d = hz - uv.y, z = 0.3 / (d + 0.015);
          float gx = (uv.x - 0.5) * z * 5.0 * res.x / res.y * 0.35, gz = z * 1.6 + t * 0.7;
          float l = max(linea(gx, 1.0), linea(gz, 1.0)), fade = smoothstep(0.0, 0.2, d) * exp(-z * 0.05);
          col += c1 * l * fade * 0.75; }
        col += c2 * exp(-abs(uv.y - hz) * 30.0) * 0.55 + c1 * exp(-abs(uv.y - hz) * 6.0) * 0.12;
        vec2 cel = floor(px / 3.0); float s = hash(cel); col += vec3(0.8, 0.85, 1.0) * step(0.996, s) * (0.5 + 0.5 * sin(t * 2.0 + s * 40.0)) * step(hz, uv.y);
        col *= 0.93 + 0.07 * sin(px.y * 1.4 + t * 6.0);
        col += mix(c2, vec3(0.5, 1.0, 0.6), 0.6) * pulso * 0.35 * (1.0 - abs(uv.y - 0.5));
      } else {                                           // aurora (barra superior y menú inferior)
        for (int i = 0; i < 3; i++){ float fi = float(i);
          float y = 0.5 + 0.28 * sin(uv.x * (2.5 + fi) + t * (0.25 + 0.1 * fi) + fi * 2.1) + 0.1 * sin(uv.x * 9.0 - t * 0.7 + fi);
          vec3 ci = fi < 0.5 ? c1 : fi < 1.5 ? c2 : mix(c1, c2, 0.5);
          float k = exp(-abs(uv.y - y) * 7.0) * (0.22 + 0.12 * sin(uv.x * 14.0 + t * 1.3 + fi));
          col = claro > 0.5 ? col - (vec3(1.0) - ci) * k * 0.6 : col + ci * k; }   // en tema claro tiñe (acuarela) en vez de sumar luz
        float borde = modo < 1.5 ? 1.0 - uv.y : uv.y;          // hud: borde abajo · nav: borde arriba
        col += c1 * exp(-(1.0 - borde) * res.y * 0.45) * 0.9 + c2 * exp(-(1.0 - borde) * res.y * 0.08) * 0.25;
        if (act.z > act.x){ vec2 cen = vec2((act.x + act.z) * 0.5, (act.y + act.w) * 0.5), tam = vec2(act.z - act.x, act.w - act.y) * 0.5;
          vec2 q = abs(uv - cen) / max(tam, vec2(0.001)); float dd = max(q.x, q.y);
          col += c1 * exp(-max(0.0, dd - 0.9) * 7.0) * (0.16 + 0.05 * sin(t * 3.0)) * mix(1.0, 0.7, claro);
          col += mix(vec3(1.0), c1, 0.4) * exp(-abs(uv.y - 0.97) * res.y * 0.5) * step(abs(uv.x - cen.x), tam.x * 0.6) * 0.9; }   // línea de luz en el borde
      }
      vec2 vg = uv - 0.5; col *= 1.0 - dot(vg, vg) * mix(0.55, 0.15, claro);
      gl_FragColor = vec4(col, 1.0);
      #include <colorspace_fragment>
    }`;
  const FRAG_BARRA = COMUN + `uniform float frac; uniform float bajo;
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
      col += c1 * (1.0 - smoothstep(-2.0, 0.0, d)) * 0.0 + vec3(0.6, 0.7, 1.0) * (1.0 - smoothstep(0.0, 1.2, abs(d + 0.6))) * 0.35;   // borde
      float a = 1.0 - smoothstep(0.0, 1.0, d);
      gl_FragColor = vec4(col, a);
      #include <colorspace_fragment>
    }`;
  let S, cam, quadPanel, quadBarra, figuras, matPanel, matBarra;
  function preparar(){
    S = new T.Scene(); cam = new T.PerspectiveCamera(40, 3, 1, 400); cam.position.set(0, 0, 60);
    const u = () => ({t:{value:0}, res:{value:new T.Vector2(1, 1)}, c1:{value:new T.Color()}, c2:{value:new T.Color()}, claro:{value:0}, pulso:{value:0}});
    matPanel = new T.ShaderMaterial({vertexShader:VERT, fragmentShader:FRAG_PANEL, uniforms:{...u(), modo:{value:0}, act:{value:new T.Vector4()}}, depthWrite:false, depthTest:false});
    matBarra = new T.ShaderMaterial({vertexShader:VERT, fragmentShader:FRAG_BARRA, uniforms:{...u(), frac:{value:0}, bajo:{value:0}}, transparent:true, depthWrite:false, depthTest:false});
    const g = new T.PlaneGeometry(2, 2);
    quadPanel = new T.Mesh(g, matPanel); quadBarra = new T.Mesh(g, matBarra);
    for (const q of [quadPanel, quadBarra]){ q.frustumCulled = false; q.renderOrder = -1; S.add(q); }
    // Figuras de cristal que flotan sobre la rejilla (solo en el lienzo de resolver)
    figuras = new T.Group(); S.add(figuras);
    S.add(new T.AmbientLight(0x6366f1, 0.8)); const k = new T.DirectionalLight(0xffffff, 2); k.position.set(20, 30, 40); S.add(k);
    const geos = [new T.IcosahedronGeometry(1, 0), new T.OctahedronGeometry(1, 0), new T.TetrahedronGeometry(1, 0), new T.TorusGeometry(0.8, 0.25, 6, 12)];
    for (let i = 0; i < 9; i++){
      const col = [0x818cf8, 0x22d3ee, 0xf0abfc, 0xfde047][i % 4];
      const m = new T.Mesh(geos[i % geos.length], new T.MeshStandardMaterial({color:col, emissive:col, emissiveIntensity:0.35, metalness:0.3, roughness:0.2, transparent:true, opacity:0.55, flatShading:true}));
      const alambre = new T.LineSegments(new T.EdgesGeometry(m.geometry), new T.LineBasicMaterial({color:col, transparent:true, opacity:0.9})); m.add(alambre);
      m.userData = {x:(i / 8 - 0.5) * 2, y:0.3 + (i % 3) * 0.22, z:-10 - (i % 4) * 8, s:2 + (i % 3), v:0.4 + (i % 5) * 0.15, f:i * 1.7};
      figuras.add(m);
    }
  }
  const lista = new Set(), vis = new WeakMap();
  let io = null, raf = 0, ultimo = 0, pulsoT = 0;
  const COL_PANEL = {rejilla:['#6366f1', '#22d3ee'], hud:['#818cf8', '#c084fc'], nav:['#60a5fa', '#a78bfa']};
  function registrar(el){
    if (lista.has(el) || !Graficos.es3D) return;
    if (!S) preparar();
    io ??= new IntersectionObserver(es => es.forEach(e => vis.set(e.target, e.isIntersecting)));
    let cv = el.querySelector(':scope > canvas.lienzo3d');
    if (!cv){ cv = document.createElement('canvas'); cv.className = 'lienzo3d'; cv.setAttribute('aria-hidden', 'true'); el.prepend(cv); }
    el.l3 = {cv, ctx:cv.getContext('2d'), fase:Math.random() * 10}; lista.add(el); io.observe(el);
    if (!raf){ raf = requestAnimationFrame(paso); }
  }
  function paso(now){
    raf = 0;
    if (now - ultimo >= 33){ ultimo = now; const t = now / 1000, claro = document.documentElement.classList.contains('dark') ? 0 : 1;
      pulsoT = Math.max(0, pulsoT - 0.05);
      for (const el of lista){
        if (!el.isConnected || !Graficos.es3D){ if (!Graficos.es3D) el.l3?.cv.remove(); lista.delete(el); io.unobserve(el); continue; }
        if (vis.get(el) === false) continue;
        const b = el.getBoundingClientRect(); if (b.width < 2 || b.height < 2) continue;
        const k = Math.min(window.devicePixelRatio || 1, 2) * (Graficos.alta ? 1 : 0.7), w = Math.round(b.width * k), h = Math.round(b.height * k), L = el.l3;
        if (L.cv.width !== w || L.cv.height !== h){ L.cv.width = w; L.cv.height = h; }
        const barra = el.dataset.barra3d != null, tipo = el.dataset.panel3d;
        quadPanel.visible = !barra; quadBarra.visible = barra; figuras.visible = tipo === 'rejilla';
        const M = barra ? matBarra : matPanel, U = M.uniforms;
        U.t.value = t + L.fase; U.res.value.set(w, h); U.claro.value = tipo === 'rejilla' || el.closest('#juego:not(.juego-menu)') ? 0 : claro;   // la batalla siempre es de noche
        if (barra){
          const fill = el.querySelector(':scope > :not(canvas)'), f = fill ? (parseFloat(fill.style.width) || (fill.offsetWidth / Math.max(1, el.clientWidth) * 100)) / 100 : 0;
          L.frac = L.frac == null ? f : L.frac + (f - L.frac) * 0.25;   // se llena suave
          const c = el.dataset.barra3d || '#38bdf8'; U.frac.value = Math.max(0, Math.min(1, L.frac)); U.c1.value.copy(Kit3D.color(c)); U.c2.value.copy(Kit3D.color('#ffffff')).lerp(Kit3D.color(c), 0.4);
          U.bajo.value = fill?.classList.contains('animate-pulse') ? 1 : 0;
        } else {
          const [a, bcol] = COL_PANEL[tipo] ?? COL_PANEL.hud; U.c1.value.copy(Kit3D.color(a)); U.c2.value.copy(Kit3D.color(bcol));
          U.modo.value = tipo === 'rejilla' ? 0 : tipo === 'hud' ? 1 : 2; U.pulso.value = tipo === 'rejilla' ? pulsoT : 0;
          U.act.value.set(0, 0, 0, 0);
          if (tipo === 'nav'){ const on = [...el.querySelectorAll('[data-bn].font-semibold')].find(x => x.offsetParent !== null);
            if (on){ const r = on.getBoundingClientRect(); U.act.value.set((r.left - b.left) / b.width, 1 - (r.bottom - b.top) / b.height, (r.right - b.left) / b.width, 1 - (r.top - b.top) / b.height); } }
          if (tipo === 'rejilla'){ cam.aspect = w / h; cam.updateProjectionMatrix(); const ancho = 2 * Math.tan(20 * Math.PI / 180) * 70 * cam.aspect;
            for (const m of figuras.children){ const d = m.userData, tt = t * d.v + d.f; m.position.set(d.x * ancho * 0.5, (d.y - 0.5) * 36 + Math.sin(tt) * 3, d.z); m.scale.setScalar(d.s * (1 + pulsoT * 0.6)); m.rotation.set(tt * 0.6, tt, tt * 0.3); } }
        }
        pintarEn({cv:L.cv, ctx:L.ctx, S, cam});
      }
    }
    if (lista.size) raf = requestAnimationFrame(paso);
  }
  /** Busca elementos marcados que aparezcan en la página (la app pinta con innerHTML). */
  function vigilar(){
    if (vigilar.hecho) return; vigilar.hecho = true;
    const buscar = n => { if (n.nodeType !== 1) return; if (n.matches('[data-panel3d],[data-barra3d]')) registrar(n); n.querySelectorAll('[data-panel3d],[data-barra3d]').forEach(registrar); };
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(buscar))).observe(document.body, {childList:true, subtree:true});
    buscar(document.body);
    document.addEventListener('graficos:cambio', () => { if (Graficos.es3D) buscar(document.body); });
  }
  /** Destello del lienzo de resolver (al acertar un paso). */
  const pulso = () => { pulsoT = 1; };
  return {pintarEn, vigilar, pulso, renderer};
})();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => Lienzos3D.vigilar()); else Lienzos3D.vigilar();
