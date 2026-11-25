/* =====================================================================
   DEFENSA ALGEBRAICA · 3f) Vitrinas 3D del Catálogo (Three.js)
   - Cada ficha del catálogo (soldados, alienígenas, armas, potenciadores,
     fusiones, tácticos y superpotenciadores) es una pequeña escena 3D con
     su animación de muestra: disparos con la forma y estela del arma,
     impactos, ataques de los alienígenas, fichas que giran…
   - Un solo WebGLRenderer compartido (Escaparate) dibuja cada vitrina
     visible y la copia a su lienzo: así no se agota el límite de contextos
     WebGL aunque haya ~90 fichas en pantalla.
   - En la ficha grande se puede arrastrar para girar la cámara.
   ===================================================================== */

/** Renderer único compartido por todas las vitrinas. */
const Escaparate = {
  R:null, w:0, h:0,
  get(){
    if (this.R) return this.R;
    const T = THREE, cv = document.createElement('canvas');
    this.R = new T.WebGLRenderer({canvas:cv, antialias:true, alpha:true});
    this.R.setPixelRatio(1); this.R.outputColorSpace = T.SRGBColorSpace; this.R.toneMapping = T.ACESFilmicToneMapping; this.R.toneMappingExposure = 1.25;
    this.R.shadowMap.enabled = Graficos.alta; this.R.shadowMap.type = T.PCFSoftShadowMap; this.R.setClearColor(0x000000, 0);
    return this.R;
  },
  /** Dibuja la vitrina en el renderer compartido y copia el resultado a su lienzo 2D. */
  pintar(v){
    const R = this.get(), w = v.cv.width, h = v.cv.height;
    if (w < 2 || h < 2) return;
    if (w > this.w || h > this.h){ this.w = Math.max(w, this.w); this.h = Math.max(h, this.h); R.setSize(this.w, this.h, false); }
    R.setViewport(0, 0, w, h); R.setScissor(0, 0, w, h); R.setScissorTest(true); R.clear();
    v.efx.escala(h, v.cam.fov);
    R.render(v.S, v.cam);
    v.ctx.clearRect(0, 0, w, h); v.ctx.drawImage(R.domElement, 0, this.h - h, w, h, 0, 0, w, h);   // el viewport empieza abajo a la izquierda
  },
};

/* ---------- Texturas y fichas (tokens) con emoji ---------- */
const TEX_EMOJI = new Map();
function texEmoji(icon, fondo){
  const k = icon + fondo; if (TEX_EMOJI.has(k)) return TEX_EMOJI.get(k);
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
  const r = g.createRadialGradient(128, 110, 20, 128, 128, 128); r.addColorStop(0, '#ffffff'); r.addColorStop(0.35, fondo); r.addColorStop(1, '#0f172a');
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 112, 0, 7); g.stroke();
  g.font = '130px system-ui, "Segoe UI Emoji", "Apple Color Emoji", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(icon, 128, 140);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; TEX_EMOJI.set(k, t); return t;
}
/** Ficha hexagonal metálica con el icono en ambas caras. */
function ficha3D(v, icon, color, radio = 14){
  const T = THREE, g = new T.Group(), tex = texEmoji(icon, color);
  const lado = v.mat(new T.MeshStandardMaterial({color:Kit3D.color(color), metalness:0.75, roughness:0.25, emissive:Kit3D.color(color), emissiveIntensity:0.25, flatShading:true}));
  const cara = v.mat(new T.MeshStandardMaterial({map:tex, metalness:0.2, roughness:0.35, emissive:0xffffff, emissiveMap:tex, emissiveIntensity:0.35}));
  const m = new T.Mesh(new T.CylinderGeometry(radio, radio, radio * 0.28, 6, 1), [lado, cara, cara]); v.geos.push(m.geometry);
  m.rotation.x = Math.PI / 2; m.rotation.y = Math.PI / 6; m.castShadow = true; g.add(m);
  const borde = new T.Mesh(M3.G.aro(), M3.mat(color, {e:color, ei:1.4})); borde.scale.set(radio * 1.02, radio * 1.02, radio * 1.6); g.add(borde);
  return g;
}

/* ---------- Disparos de muestra ---------- */
const FORMA_PARABOLA = new Set(['granada']);
/** Posición de un disparo en el punto u ∈ [0,1] de su trayecto. */
function trayecto(forma, mov, u, x0, y0, x1, y1){
  const x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
  if (mov === 'parabola' || FORMA_PARABOLA.has(forma)) return [x, y + 26 * Math.sin(Math.PI * u)];
  if (mov === 'guiado') return [x, y + 16 * Math.sin(Math.PI * u) * (1 - u)];
  return [x, y];
}
/** Dibuja un proyectil con la forma del arma (bala, orbe, rayo, perdigón, onda, granada), su estela y extras. */
function proyectil3D(v, fx, u, x0, y0, x1, y1, z = 0, mov = null){
  const c = fx.color ?? '#fde047', r = (fx.r ?? 1) * 1.7, forma = fx.forma ?? 'bala', [x, y] = trayecto(forma, mov, u, x0, y0, x1, y1);
  const largo = 3 + (fx.estela ?? 0) * 3;                 // la estela crece con los potenciadores de cadencia y alcance
  let px = x, py = y;
  for (let k = 1; k <= largo; k++){ const uu = Math.max(0, u - k * 0.022), [qx, qy] = trayecto(forma, mov, uu, x0, y0, x1, y1);
    v.cin.seg(qx, qy, px, py, r * 1.5 * (1 - k / (largo + 1)), c, 0.6 * (1 - k / (largo + 1)), z); px = qx; py = qy; }
  const ang = Math.atan2(y1 - y0, x1 - x0);
  if (forma === 'orbe'){ v.efx.add(x, y, z, c, r * 9, 0.95); v.efx.add(x, y, z, '#ffffff', r * 3, 1); }
  else if (forma === 'rayo'){ v.cin.seg(x - Math.cos(ang) * 14, y - Math.sin(ang) * 14, x, y, r * 1.4, c, 1, z); v.efx.add(x, y, z, c, r * 6, 0.9); }
  else if (forma === 'perdigon'){ for (let k = -1; k <= 1; k++){ v.efx.add(x - Math.abs(k) * 2, y + k * 3 * (0.4 + u), z, c, r * 4, 0.95); v.efx.add(x - Math.abs(k) * 2, y + k * 3 * (0.4 + u), z, '#ffffff', r * 1.4, 1); } }
  else if (forma === 'onda'){ for (let i = 0; i < 9; i++){ const a1 = ang - 1.1 + i * 0.245, a2 = a1 + 0.245, R = r * 3 + u * 4; v.cin.seg(x + Math.cos(a1) * R, y + Math.sin(a1) * R, x + Math.cos(a2) * R, y + Math.sin(a2) * R, 1.8, c, 0.95, z); } }
  else if (forma === 'granada'){ v.efx.add(x, y, z, '#3f6212', r * 3.5, 1); v.efx.add(x + 1.5, y + 2, z, '#fde047', 4 + Math.random() * 3, 1); }
  else { v.efx.add(x, y, z, c, r * 5, 0.9); v.efx.add(x, y, z, '#ffffff', r * 1.6, 1); }
  if (fx.perfora) v.cin.seg(x - Math.cos(ang) * 10, y - Math.sin(ang) * 10, x + Math.cos(ang) * 3, y + Math.sin(ang) * 3, 1.1, '#67e8f9', 1, z + 0.5);
  if (fx.chispas && Math.random() < 0.6) v.efx.add(x + (Math.random() - 0.5) * 7, y + (Math.random() - 0.5) * 7, z, '#fef08a', 3.5, 1);
  if (fx.anillo) for (let i = 0; i < 12; i++){ const a1 = i / 12 * 6.283 + u * 12, a2 = a1 + 0.5, R = r + 3 + fx.anillo * 1.5; v.cin.seg(x + Math.cos(a1) * R, y + Math.sin(a1) * R, x + Math.cos(a2) * R, y + Math.sin(a2) * R, 0.9, c, 0.7, z); }
}

/* ---------- Vitrina: una escena por ficha ---------- */
class Vitrina3D {
  constructor(cv, it, grande = false){
    const T = THREE; Object.assign(this, {cv, it, grande, visible:true, ctx:cv.getContext('2d'), mats:[], geos:[], parts:[], anims:[], ondas:[]});
    this.S = new T.Scene(); this.cam = new T.PerspectiveCamera(30, 1.7, 1, 3000);
    this.efx = new Kit3D.GlowPoints(grande ? 1200 : 400); this.cin = new Kit3D.Ribbons(grande ? 900 : 320); this.S.add(this.efx.obj, this.cin.obj);
    this.mirar = new T.Vector3(0, 16, 0); this.dist = 150; this.alto = 0.14; this.giro = 0; this.giroBase = 0; this.vaiven = 0.25; this.auto = false; this.arr = 0;
    this.estudio();
    try { this.montar(it); } catch (err){ console.warn('Vitrina 3D:', it.kind, it.id, err); }
    if (grande){
      cv.style.touchAction = 'pan-y'; cv.style.cursor = 'grab';
      cv.onpointerdown = e => { this.px = e.clientX; cv.setPointerCapture?.(e.pointerId); };
      cv.onpointermove = e => { if (this.px == null) return; this.arr += (e.clientX - this.px) * 0.01; this.px = e.clientX; };
      cv.onpointerup = cv.onpointercancel = () => { this.px = null; };
    }
    this.medir();
  }
  mat(m){ this.mats.push(m); return m; }
  /** Luces, pedestal hexagonal con aro de neón y polvo luminoso. */
  estudio(){
    const T = THREE, S = this.S;
    S.add(new T.HemisphereLight(0xa5b4fc, 0x1c1917, 1.05));
    const key = new T.DirectionalLight(0xfff7ed, 2.4); key.position.set(50, 110, 90); S.add(key, key.target);
    if (Graficos.alta){ key.castShadow = true; key.shadow.mapSize.set(512, 512); Object.assign(key.shadow.camera, {left:-90, right:90, top:90, bottom:-60, near:10, far:400}); key.shadow.camera.updateProjectionMatrix(); }
    const rim = new T.DirectionalLight(0xc084fc, 2.6); rim.position.set(-80, 40, -80); S.add(rim);
    this.suelo = new T.Mesh(new T.CylinderGeometry(70, 76, 3, 6), this.mat(new T.MeshStandardMaterial({color:0x1e1b4b, metalness:0.55, roughness:0.35, flatShading:true}))); this.geos.push(this.suelo.geometry);
    this.suelo.position.y = -1.5; this.suelo.receiveShadow = true; S.add(this.suelo);
    this.aro = new T.Mesh(new T.TorusGeometry(73, 0.7, 6, 6), new T.MeshBasicMaterial({color:0x38bdf8, toneMapped:false})); this.geos.push(this.aro.geometry); this.mat(this.aro.material);
    this.aro.rotation.set(Math.PI / 2, 0, Math.PI / 6); this.aro.position.y = 0.2; S.add(this.aro);
    this.polvo = Array.from({length:this.grande ? 40 : 14}, () => [(Math.random() - 0.5) * 160, Math.random() * 70, (Math.random() - 0.5) * 80, Math.random() * 6]);
  }
  /** Ajusta el pedestal y la cámara a lo que hay en escena. */
  encuadre(ancho, alto, cy = alto / 2){
    const s = Math.max(0.3, ancho / 175); this.suelo.scale.set(s, 1, s); this.aro.scale.set(s, s, 1);
    this.mirar.set(0, cy, 0); this.dist = Math.max(alto / 2 / Math.tan(15 * Math.PI / 180) * 1.35, ancho / 2 / Math.tan(15 * Math.PI / 180) / 1.7 * 1.12);
  }
  medir(){
    const b = this.cv.getBoundingClientRect(), k = Math.min(window.devicePixelRatio || 1, this.grande ? 2 : 1.5) * (Graficos.alta ? 1 : 0.75);
    const w = Math.max(2, Math.round(b.width * k)), h = Math.max(2, Math.round(b.height * k));
    if (this.cv.width !== w || this.cv.height !== h){ this.cv.width = w; this.cv.height = h; }
    this.cam.aspect = (b.width || 120) / (b.height || 70); this.cam.updateProjectionMatrix();
  }
  /** Chispas que salen volando (impactos, explosiones). */
  estallido(x, y, z, c, n = 12, f = 50){
    for (let i = 0; i < n; i++){ const a = Math.random() * 6.283, s = f * (0.3 + Math.random() * 0.7); this.parts.push({x, y, z, vx:Math.cos(a) * s, vy:Math.sin(a) * s + 20, vz:(Math.random() - 0.5) * 30, t:0.4 + Math.random() * 0.35, c, s:2 + Math.random() * 3}); }
    this.ondas.push({x, y, z, t:0.35, t0:0.35, c, r:8 + n * 0.5});
  }
  dibujar(t){
    const dt = this.tp == null ? 0.016 : Math.max(0, Math.min(0.05, t - this.tp)); this.tp = t;
    if ((this.nf = (this.nf ?? 0) + 1) % 30 === 1) this.medir();   // por si cambia el tamaño de la pantalla
    this.efx.begin(); this.cin.begin();
    for (const f of this.anims) f(t, dt);
    this.parts = this.parts.filter(p => (p.t -= dt) > 0);
    for (const p of this.parts){ p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vy -= 90 * dt; this.efx.add(p.x, p.y, p.z, p.c, p.s * 2, Math.min(1, p.t * 2.5)); }
    this.ondas = this.ondas.filter(o => (o.t -= dt) > 0);
    for (const o of this.ondas){ const u = 1 - o.t / o.t0, R = o.r * (0.3 + u); this.efx.add(o.x, o.y, o.z, o.c, R * 3, (1 - u) * 0.8);
      for (let i = 0; i < 18; i++){ const a1 = i / 18 * 6.283, a2 = a1 + 0.35; this.cin.seg(o.x + Math.cos(a1) * R, o.y + Math.sin(a1) * R, o.x + Math.cos(a2) * R, o.y + Math.sin(a2) * R, 2 * (1 - u) + 0.4, o.c, 1 - u, o.z + 1); } }
    for (const d of this.polvo) this.efx.add(d[0], (d[1] + t * 4) % 70, d[2], '#a5b4fc', 1.6, 0.25 + 0.25 * Math.sin(t * 2 + d[3]));
    this.aro.material.color.setHSL(0.55 + 0.05 * Math.sin(t * 0.8), 0.9, 0.55);
    this.efx.end(); this.cin.end();
    this.giro = this.giroBase + this.arr + (this.auto ? t * 0.45 : Math.sin(t * 0.5) * this.vaiven);
    const d = this.dist; this.cam.position.set(Math.sin(this.giro) * d, this.mirar.y + d * this.alto, Math.cos(this.giro) * d); this.cam.lookAt(this.mirar);
    Escaparate.pintar(this);
  }
  dispose(){
    this.mats.forEach(m => m.dispose()); this.geos.forEach(g => g.dispose()); this.efx.dispose(); this.cin.dispose();
    this.S.traverse(o => { if (o.userData.mats) o.userData.mats.forEach(m => m.dispose()); });
    this.cv.onpointerdown = this.cv.onpointermove = this.cv.onpointerup = this.cv.onpointercancel = null;
  }

  /* ---- Qué se muestra en cada tipo de ficha ---- */
  montar(it){
    const fusionDe = it.kind === 'fusion' ? it.d : null;
    if (it.kind === 'soldado') return this.soldadoDemo(it.id, it.uid ? RASGOS_SOLDADO[it.uid] : null, null);
    if (it.kind === 'enemigo') return this.enemigoDemo(it.id);
    if (it.kind === 'potarma') return this.soldadoDemo(it.tipo, null, fxDisparo({potenciadores:potenciadoresMuestra(it)}, it.arma), it.pot ? POTENCIADORES[it.pot]?.icon ?? it.x?.icon : null, it.arma, it.pot === 'todos' ? '#f59e0b' : '#38bdf8');
    if (it.kind === 'pot' && it.x?.fusionArma) return this.soldadoDemo(it.x.tipo, null, fxDisparo({fusionesArma:[it.id]}, it.x.arma), it.x.icon, it.x.arma, '#d946ef');
    if (it.kind === 'arma' || fusionDe?.tipo === 'arma') return this.torretaDemo(it.id, BONUS_DEFS[it.id] ?? fusionDe);
    if (it.kind === 'fusion') return this.fusionDemo(fusionDe?.icon ?? '❔');
    if (it.kind === 'pot') return this.superDemo(it.x ?? {}, it.d?.icon ?? it.x?.icon ?? '⚡');
    return this.fichaDemo(it.d?.icon ?? '❔', '#10b981');
  }
  /** Agrega un modelo (con sus materiales propios) a la escena. */
  poner(r, x = 0, y = 0, z = 0, esc = 1){
    r.raiz.position.set(x, y, z); r.raiz.scale.setScalar(esc);
    r.raiz.traverse(m => { if (m.isMesh) m.castShadow = Graficos.alta && !m.material.transparent; });
    r.raiz.userData.mats = r.mats; this.S.add(r.raiz); return r;
  }
  /** Un alienígena explorador de blanco que recibe los impactos. */
  blanco(x, z = 0){
    const e = ENEMIGOS.explorador(0, {vida:1, velocidad:1}); e.estado = 'camina'; e.fase = 0;
    const r = this.poner(enemigo3D(e), x, 0, z, ESCALA_3D); r.raiz.rotation.y = Math.PI + 0.5;   // mira a la izquierda, algo hacia la cámara if (r.extra.para) r.extra.para.visible = false;
    r.dano = 0; r.mats.forEach(m => m.userData.e = m.emissive.clone());
    this.anims.push((t, dt) => { e.fase = t * 6; r.anim(e, t, dt); r.dano = Math.max(0, r.dano - dt * 4); r.mats.forEach(m => m.emissive.copy(m.userData.e).add({r:r.dano, g:r.dano, b:r.dano}));
      r.raiz.position.x = x + r.dano * 2.5; });
    return r;
  }
  /** Soldado (con sus colores) disparando su arma a un alienígena; los de apoyo curan o reparan. */
  soldadoDemo(tipo, R, fx = null, icono = null, armaId = null, colorFicha = '#38bdf8'){
    const sold = this.poner(soldado3D(tipo, R), -38, 0, 0, ESCALA_3D * 1.25); sold.raiz.rotation.y = -0.45;   // tres cuartos hacia la cámara
    const apoyo = !!SOLDADOS[tipo].apoyo && !(armaId && FX_ARMA[armaId]);
    fx ??= {color:R?.bala ?? (SOLDADOS[tipo].ataque?.area ? '#fb923c' : '#fde047'), forma:tipo === 'granadero' ? 'granada' : tipo === 'pesado' ? 'perdigon' : 'bala', estela:2, r:1};
    if (apoyo){ fx = {...fx, color:R?.bala ?? (tipo === 'medico' ? '#86efac' : '#fde68a'), forma:'orbe'}; }
    let blanco;
    if (apoyo && tipo === 'medico'){ blanco = this.poner(soldado3D('fusilero'), 36, 0, 0, ESCALA_3D * 1.15); blanco.raiz.rotation.y = Math.PI; }
    else if (apoyo){ blanco = this.poner(base3D(), 24, 0, -4, 0.55); blanco.escudo.visible = false; }
    else blanco = this.blanco(36);
    const periodo = fx.forma === 'granada' ? 1.5 : 1.1, n = fx.forma === 'granada' ? 1 : 2, prev = [];
    const x0 = -38 + 11, y0 = 13, x1 = apoyo ? 34 : 32, y1 = apoyo ? 14 : 12;
    this.anims.push((t, dt) => {
      sold.retroceso = Math.max(0, sold.retroceso - dt * 8); sold.arma.g.position.x = 2.1 - sold.retroceso * 1.6; sold.arma.g.rotation.z = fx.forma === 'granada' ? 0.45 : 0.04;
      sold.torso.scale.y = 1 + Math.sin(t * 2.4) * 0.025;
      for (let k = 0; k < n; k++){
        const u = ((t / periodo) + k / n) % 1;
        if (prev[k] != null && u < prev[k]){ sold.retroceso = 1; this.efx.add(x0 + 2, y0, 2, fx.color, 14, 1); }   // fogonazo al salir
        if (prev[k] != null && prev[k] < 0.96 && u >= 0.96){
          this.estallido(x1, y1, 0, fx.color, fx.forma === 'granada' ? 22 : 10, fx.forma === 'granada' ? 70 : 45);
          if (fx.anillo) this.ondas.push({x:x1, y:y1, z:0, t:0.5, t0:0.5, c:fx.color, r:10 + fx.anillo * 6});
          if (blanco.dano != null && !apoyo) blanco.dano = 1;
          if (apoyo) for (let i = 0; i < 6; i++) this.parts.push({x:x1 + (Math.random() - 0.5) * 12, y:y1 + Math.random() * 6, z:(Math.random() - 0.5) * 8, vx:0, vy:30 + Math.random() * 20, vz:0, t:0.8, c:fx.color, s:3});
        }
        prev[k] = u;
        if (u < 0.97) proyectil3D(this, fx, u, x0, y0, x1, y1, 0);
      }
      if (apoyo) this.efx.add(x1, y1 + 4, 0, fx.color, 26 + Math.sin(t * 4) * 6, 0.25);
    });
    if (icono){ const f = ficha3D(this, icono, colorFicha, 7); f.position.set(-38, 40, 0); this.S.add(f); this.anims.push(t => { f.rotation.y = Math.sin(t * 1.6) * 0.9; f.position.y = 40 + Math.sin(t * 2) * 1.5; }); }
    this.encuadre(120, icono ? 52 : 40, icono ? 24 : 18); this.vaiven = 0.3;
  }
  /** Alienígena con su animación (caminar, saltar, excavar, flotar) y una muestra de sus armas. */
  enemigoDemo(id){
    const e = ENEMIGOS[id](0, {vida:1, velocidad:1}); e.estado = 'camina'; e.fase = 0;
    const r = this.poner(enemigo3D(e), 0, 0, 0, 1); r.raiz.rotation.y = Math.PI + 0.9; if (r.extra.para) r.extra.para.visible = false;
    const caja = new THREE.Box3().setFromObject(r.raiz), tam = caja.getSize(new THREE.Vector3());
    const esc = 34 / Math.max(tam.y, tam.x * 0.55, 1); r.raiz.scale.setScalar(esc);
    const alto = tam.y * esc, ancho = tam.x * esc, vuela = !!e.vuela, base = vuela ? 18 - (caja.min.y * esc) : 0;
    const armas = e.armas.filter(a => a.tipo);
    this.anims.push((t, dt) => {
      e.fase = t * 7;
      if (vuela){ r.raiz.position.y = base + Math.sin(t * 2) * 2.5; if (e.escudoMental) e.escudoT = (t % 4) < 1.5 ? 1 : 0; }
      else { r.raiz.position.y = 0; if (id === 'saltador' || e.forma === 'saltador'){ const u = t % 1.8; if (u < 0.7) r.raiz.position.y = 20 * Math.sin(Math.PI * u / 0.7); } e.bajoTierra = (id === 'excavador' || e.forma === 'excavador') && (t % 3.2) < 1.2; }
      r.anim?.(e, t, dt);
      if (!armas.length) return;
      // Una de sus armas cada 2,2 s, hacia la izquierda (donde estaría tu base)
      const ciclo = Math.floor(t / 2.2), a = armas[ciclo % armas.length], u = (t % 2.2) / 2.2, cy = r.raiz.position.y + alto * 0.5, x0 = -ancho * 0.35;
      this.ataque(a.tipo, u, x0, cy, t);
    });
    this.encuadre(Math.max(110, ancho * 2.2), alto + (vuela ? 26 : 8), (alto + (vuela ? 18 : 0)) / 2 + 2); this.vaiven = 0.35;
  }
  /** Muestra de un arma enemiga. */
  ataque(tipo, u, x0, y0, t){
    const izq = -62;
    if (tipo === 'acido'){ if (u < 0.6){ const k = u / 0.6, x = x0 + (izq - x0) * k, y = y0 - 8 * k + 18 * Math.sin(Math.PI * k); this.efx.add(x, y, 0, '#a3e635', 9, 1); this.cin.seg(x + 4, y + 1, x, y, 3, '#bef264', 0.5); } if (u > 0.6 && u < 0.64) this.estallido(izq, 4, 0, '#84cc16', 10, 40); }
    else if (tipo === 'laser'){ if (u < 0.3){ this.cin.seg(x0, y0, izq, y0 - 8, 3, '#f87171', 1 - u * 2); this.cin.seg(x0, y0, izq, y0 - 8, 9, '#ef4444', (1 - u * 3) * 0.35); this.efx.add(x0, y0, 0, '#fca5a5', 14, 1); } }
    else if (tipo === 'rayo' || tipo === 'drenar'){ const c = tipo === 'rayo' ? '#e879f9' : '#facc15'; if (u < 0.45) this.cin.zigzag(x0, y0, izq, 10, 2, c, 1 - u * 2, 0, 8, 5);
      if (tipo === 'drenar') for (let i = 0; i < 4; i++){ const k = (u * 2 + i / 4) % 1; this.efx.add(izq + (x0 - izq) * k, 10 + (y0 - 10) * k, 0, c, 5, 1); } }
    else if (tipo === 'roca' || tipo === 'lluvia'){ const n = tipo === 'lluvia' ? 3 : 1; for (let i = 0; i < n; i++){ const k = Math.min(1, u * 1.4 - i * 0.12); if (k <= 0 || k >= 1) continue;
        const x = x0 + (izq + i * 10 - x0) * k, y = y0 + (2 - y0) * k + 30 * Math.sin(Math.PI * k); this.efx.add(x, y, 0, '#a8a29e', 10, 0.9); this.efx.add(x, y, 0, '#f97316', 5, 0.6); }
      if (u > 0.7 && u < 0.74) this.estallido(izq, 3, 0, '#d6d3d1', 12, 45); }
    else if (tipo === 'bomba'){ const k = Math.min(1, u * 1.6); if (k < 1){ const y = y0 - k * (y0 - 2); this.efx.add(x0 * 0.2, y, 0, '#f97316', 8, 1); } if (u > 0.62 && u < 0.66) this.estallido(x0 * 0.2, 3, 0, '#fb923c', 18, 60); }
    else if (tipo === 'invocar'){ if (u < 0.5){ const R = 6 + u * 30; for (let i = 0; i < 10; i++){ const a = i / 10 * 6.283 + t * 3; this.efx.add(x0 - 14 + Math.cos(a) * R * 0.4, 6 + Math.sin(a) * R * 0.3, Math.sin(a) * 6, '#c4b5fd', 5, 1 - u * 2); } } }
    else if (tipo === 'pulso'){ if (u < 0.5 && Math.abs(u % 0.25) < 0.02) this.ondas.push({x:0, y:y0, z:0, t:0.6, t0:0.6, c:'#f472b6', r:40}); }
    else if (tipo === 'curar'){ for (let i = 0; i < 3; i++) this.efx.add((Math.random() - 0.5) * 30, (u * 40 + i * 10) % 40, 4, '#86efac', 5, 0.8); }
    else if (tipo === 'blindar'){ if (u < 0.5) this.efx.add(0, y0, 0, '#cbd5e1', 70 * (0.6 + u), 0.25 * (1 - u * 2)); }
  }
  /** Torreta de la base disparando un arma de bonificador (bala, rayo en cadena, parábola, guiado; área). */
  torretaDemo(id, d){
    const p = d?.props ?? {}, base = this.poner(base3D(), -56, 0, -4, 0.5); base.escudo.visible = false;
    const aire = p.prioridad === 'aire' || p.alcance === 'aire', cadena = p.objetivo === 'cadena';
    const color = {fisico:'#fde047', energia:'#c4b5fd', explosivo:p.efecto === 'congelar' ? '#7dd3fc' : '#fb923c'}[p.dano] ?? '#fde047';
    const blancos = cadena ? [10, 30, 48].map(x => [this.blanco(x, (x % 20) - 5), x]) : [[aire ? null : this.blanco(40), 40]];
    let nave = null; if (aire && !cadena){ const e = ENEMIGOS.nave(0, {vida:1, velocidad:1}); nave = this.poner(enemigo3D(e), 40, 34, 0, 0.9); nave.raiz.rotation.y = Math.PI; this.anims.push((t, dt) => { e.fase = t; nave.anim(e, t, dt); nave.raiz.position.y = 34 + Math.sin(t * 2) * 2; }); }
    const x0 = -56 + 23 * 0.5 + 4, y0 = 41 * 0.5, prev = {u:null};
    this.anims.push(t => {
      const u = (t % 1.4) / 1.4, [, tx] = blancos[0], ty = aire && !cadena ? 34 : 12;
      base.torreta.rotation.z = Math.atan2(ty - y0, tx - x0) * 0.8;
      if (p.movimiento === 'rayo'){
        if (u < 0.35){ const c = id === 'tesla' ? '#93c5fd' : id === 'foton' ? '#a5f3fc' : '#f87171'; let px = x0, py = y0;
          for (const [, x] of blancos){ const y = aire && !cadena ? 34 : 12; this.cin.zigzag(px, py, x, y, 2.2, c, 1 - u * 2, 0, 6, 3); this.cin.seg(px, py, x, y, 8, c, (1 - u * 3) * 0.3, 0); this.efx.add(x, y, 0, c, 16, 1 - u * 2); px = x; py = y; }
          if (prev.u != null && prev.u > u) blancos.forEach(([b]) => { if (b) b.dano = 1; }); }
      } else {
        if (u < 0.95) proyectil3D(this, {color, forma:'bala', r:p.objetivo === 'area' ? 1.8 : 1.1, estela:2}, u, x0, y0, tx, ty, 0, p.movimiento);
        if (prev.u != null && prev.u < 0.95 && u >= 0.95){ this.estallido(tx, ty, 0, color, p.objetivo === 'area' ? 20 : 10, 55); if (p.objetivo === 'area') this.ondas.push({x:tx, y:ty, z:0, t:0.5, t0:0.5, c:color, r:26}); blancos.forEach(([b]) => { if (b) b.dano = 1; }); }
      }
      prev.u = u;
    });
    this.encuadre(130, 46, 20); this.vaiven = 0.3;
  }
  /** Ficha que gira y flota con partículas en órbita (tácticos). */
  fichaDemo(icon, color){
    const f = ficha3D(this, icon, color); this.S.add(f);
    this.anims.push(t => { f.rotation.y = Math.sin(t * 1.1) * 1.1 + (t % 6 < 0.8 ? (t % 6) / 0.8 * 6.283 : 0); f.position.y = 22 + Math.sin(t * 2) * 2;
      for (let i = 0; i < 10; i++){ const a = t * 1.4 + i / 10 * 6.283; this.efx.add(Math.cos(a) * 24, 22 + Math.sin(a * 2) * 6, Math.sin(a) * 24, color, 4, 0.9); }
      if ((t % 1.6) < 0.02) this.ondas.push({x:0, y:22, z:0, t:0.7, t0:0.7, c:color, r:26}); });
    this.encuadre(90, 50, 22); this.auto = false; this.vaiven = 0.5;
  }
  /** Fusión de tácticos: dos energías orbitan, chocan y aparece la ficha resultante. */
  fusionDemo(icon){
    const f = ficha3D(this, icon, '#d946ef'); this.S.add(f);
    this.anims.push(t => {
      const u = (t % 2.6) / 2.6, junta = Math.min(1, u / 0.55), R = 30 * (1 - junta), a = t * 5;
      if (u < 0.55){ this.efx.add(Math.cos(a) * R, 22 + Math.sin(a) * R * 0.3, Math.sin(a) * R, '#7dd3fc', 12, 1); this.efx.add(-Math.cos(a) * R, 22 - Math.sin(a) * R * 0.3, -Math.sin(a) * R, '#fcd34d', 12, 1);
        this.cin.seg(Math.cos(a) * R, 22, Math.cos(a - 0.3) * (R + 2), 22, 2, '#7dd3fc', 0.5); f.scale.setScalar(0.001); }
      else { const k = Math.min(1, (u - 0.55) / 0.12); f.scale.setScalar(k < 1 ? k * 1.25 : 1 + 0.25 * Math.max(0, 1 - (u - 0.67) * 6)); f.rotation.y = Math.sin(t * 1.4) * 0.8; }
      if (u >= 0.55 && u < 0.57) this.estallido(0, 22, 0, '#f0abfc', 26, 70);
      f.position.y = 22 + Math.sin(t * 2) * 1.5; });
    this.encuadre(90, 50, 22); this.vaiven = 0.4;
  }
  /** Superpotenciadores: la ficha con un efecto según lo que hace (daño, balas extra, vida, congelar…). */
  superDemo(x, icon){
    const ef = x.ef ?? {}, color = ef.vida || ef.regen ? '#4ade80' : ef.congela ? '#7dd3fc' : ef.costo ? '#facc15' : ef.extra ? '#fb923c' : ef.crit ? '#f87171' : '#f59e0b';
    this.fichaDemo(icon, color);
    this.anims.push(t => {
      if (ef.extra) for (let i = 0; i < 3; i++){ const k = (t * 0.9 + i / 3) % 1; this.efx.add(-40 + 80 * k, 8 + i * 2, 10, color, 6, 1); this.cin.seg(-46 + 80 * k, 8 + i * 2, -40 + 80 * k, 8 + i * 2, 1.6, color, 0.6, 10); }
      if (ef.dmg && !ef.extra) for (let i = 0; i < 2; i++) if (Math.random() < 0.4) this.parts.push({x:(Math.random() - 0.5) * 20, y:22, z:4, vx:(Math.random() - 0.5) * 80, vy:Math.random() * 60, vz:0, t:0.4, c:'#fef08a', s:2.5});
      if (ef.crit){ const R = 30 + Math.sin(t * 4) * 2; for (let i = 0; i < 4; i++){ const a = i * Math.PI / 2 + t; this.cin.seg(Math.cos(a) * R, 22 + Math.sin(a) * R * 0.8, Math.cos(a) * (R + 8), 22 + Math.sin(a) * (R + 8) * 0.8, 1.8, color, 0.9, 6); } }
      if (ef.vida || ef.regen) this.efx.add(0, 22, -6, color, 70 + Math.sin(t * 3) * 6, 0.18);
      if (ef.congela) for (let i = 0; i < 6; i++){ const a = t * 0.8 + i / 6 * 6.283; this.efx.add(Math.cos(a) * 34, 22 + Math.sin(t * 3 + i) * 8, Math.sin(a) * 18, '#e0f2fe', 5, 0.9); }
      if (ef.costo) if ((t % 0.8) < 0.04) this.cin.zigzag(-30, 50, 0, 26, 1.8, color, 1, 6, 6, 4);
    });
  }
}

/* ---------- Emblemas 3D de las cartas de propiedades ----------
   El círculo del icono de cada carta es un lienzo pequeño con una gema
   hexagonal que gira (con el icono en sus caras) y chispas del color del área.
   Una sola escena compartida: para cada carta solo cambia la textura, el color
   y el giro. Se dibujan solo las cartas visibles, a ~25 cuadros/s. */
const COLOR_AREA = {fund:'#6366f1', alg:'#f43f5e', dif:'#14b8a6', int:'#a855f7', libre:'#f59e0b', combo:'#fb7185', nuevo:'#71717a'};
const Emblemas = (() => {
  let listo = false, S, cam, gema, lado, cara, borde, efx, raf = 0, ultimo = 0;
  const vivos = new Set(), visibles = new WeakMap();
  let io = null;
  function preparar(){
    const T = THREE; S = new T.Scene(); cam = new T.PerspectiveCamera(30, 1, 1, 200); cam.position.set(0, 0, 46); cam.lookAt(0, 0, 0);
    S.add(new T.HemisphereLight(0xe0e7ff, 0x1e1b4b, 1.3)); const k = new T.DirectionalLight(0xffffff, 2.6); k.position.set(10, 14, 20); S.add(k);
    const r = new T.DirectionalLight(0xc084fc, 2.2); r.position.set(-14, -6, -10); S.add(r);
    lado = new T.MeshStandardMaterial({metalness:0.8, roughness:0.22, flatShading:true, emissiveIntensity:0.3});
    cara = new T.MeshStandardMaterial({metalness:0.15, roughness:0.3, emissive:0xffffff, emissiveIntensity:0.4});
    gema = new T.Mesh(new T.CylinderGeometry(9, 9, 3.2, 6), [lado, cara, cara]); gema.rotation.x = Math.PI / 2; S.add(gema);
    borde = new T.Mesh(new T.TorusGeometry(9.3, 0.45, 6, 6), new T.MeshBasicMaterial({color:0xffffff, toneMapped:false})); S.add(borde);
    efx = new Kit3D.GlowPoints(80); S.add(efx.obj);
    io = new IntersectionObserver(es => es.forEach(e => visibles.set(e.target, e.isIntersecting)));
    listo = true;
  }
  function registrar(cv){
    if (vivos.has(cv)) return; if (!listo) preparar();
    cv.ctxE = cv.getContext('2d'); cv.faseE = Math.random() * 6.283; vivos.add(cv); io.observe(cv);
    if (!raf){ ultimo = 0; raf = requestAnimationFrame(paso); }
  }
  function paso(now){
    raf = 0;
    if (now - ultimo >= 40){ ultimo = now; const t = now / 1000;
      for (const cv of vivos){
        if (!cv.isConnected){ vivos.delete(cv); io.unobserve(cv); continue; }
        if (visibles.get(cv) === false) continue;
        const b = cv.getBoundingClientRect(); if (!b.width) continue;
        const px = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(b.width * px), h = Math.round(b.height * px);
        if (cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
        const col = Kit3D.color(cv.dataset.color), tex = texEmoji(cv.dataset.emblema, cv.dataset.color);
        if (cara.map !== tex){ cara.map = tex; cara.emissiveMap = tex; cara.needsUpdate = true; }
        lado.color.copy(col); lado.emissive.copy(col); borde.material.color.copy(col);
        const f = t * 1.2 + cv.faseE;
        gema.rotation.y = Math.sin(f) * 0.75 + ((f % 9) < 1 ? (f % 9) * 6.283 : 0);   // se balancea y de vez en cuando da una vuelta completa
        gema.position.y = borde.position.y = Math.sin(f * 1.7) * 0.6;
        borde.rotation.z = f * 0.3;
        efx.begin(); efx.add(0, 0, -4, col, 34, 0.35);
        for (let i = 0; i < 5; i++){ const a = f * 1.6 + i / 5 * 6.283; efx.add(Math.cos(a) * 12, Math.sin(a) * 4, Math.sin(a) * 12, i % 2 ? '#ffffff' : col, 2.6, 0.95); }
        efx.end();
        Escaparate.pintar({cv, ctx:cv.ctxE, S, cam, efx});
      }
    }
    if (vivos.size) raf = requestAnimationFrame(paso);
  }
  /** Busca lienzos de emblema nuevos en la página (las cartas se pintan con innerHTML). */
  function vigilar(){
    if (vigilar.hecho) return; vigilar.hecho = true;
    const buscar = n => { if (n.nodeType !== 1) return; if (n.matches?.('canvas[data-emblema]')) registrar(n); n.querySelectorAll?.('canvas[data-emblema]').forEach(registrar); };
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(buscar))).observe(document.body, {childList:true, subtree:true});
    buscar(document.body);
  }
  return {vigilar};
})();

/* Inclinación 3D de las cartas siguiendo el puntero (y brillo holográfico que se mueve con ella). */
document.addEventListener('pointermove', e => {
  if (!document.documentElement.classList.contains('cartas3d')) return;
  const c = e.target.closest?.('[data-arte]'); if (!c) return;
  const b = c.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5;
  c.style.setProperty('--rx', `${(-y * 22).toFixed(1)}deg`); c.style.setProperty('--ry', `${(x * 26).toFixed(1)}deg`); c.style.setProperty('--brillo', `${Math.round((x + 0.5) * 100)}%`);
}, {passive:true});
document.addEventListener('pointerout', e => { const c = e.target.closest?.('[data-arte]'); if (c && !c.contains(e.relatedTarget)){ c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); c.style.removeProperty('--brillo'); } }, {passive:true});
