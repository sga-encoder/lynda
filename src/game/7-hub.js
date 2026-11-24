/* =====================================================================
   DEFENSA ALGEBRAICA · 7) Menú del juego
   - MenuScene (Partidas): botón ▶ Jugar → modalidad → (operaciones, si es
     infinito) → dificultad; abajo, las partidas guardadas.
   - HelpScene: tutorial del juego en diapositivas animadas.
   - ConfigScene: modo asistido, exportar/importar y modo desarrollador
     (con contraseña).
   - MasScene: accesos a Pelotón, Mejoras, Cómo jugar y Configuración.
   La barra de navegación de la app abre estas secciones (GameApp.mostrar).
   ===================================================================== */
const CLAVE_DEV = 'prueba';
/** Conjuntos de operaciones «por defecto» para el modo infinito. */
const SETS_INFINITO = [
  {id:'fund', icon:'🧱', nombre:'Ecuaciones y simplificar', dominios:['fund']},
  {id:'alg', icon:'🔺', nombre:'Potencias, raíces, log y trig', dominios:['alg']},
  {id:'dif', icon:'📈', nombre:'Derivadas', dominios:['dif']},
  {id:'int', icon:'∫', nombre:'Integrales', dominios:['int']},
  {id:'todo', icon:'🌐', nombre:'Todo lo desbloqueado', dominios:['fund', 'alg', 'dif', 'int']},
];
const tarjetaBtn = (attr, icon, titulo, sub, on = false, off = false) => `<button ${attr} ${off ? 'disabled' : ''} class="flex min-h-16 items-center gap-3 rounded-2xl border-2 p-3 text-left touch-manipulation transition-transform active:scale-[0.98] disabled:opacity-40 ${on ? 'border-emerald-400 bg-emerald-400/15' : 'border-zinc-700 bg-zinc-900'}"><span class="text-3xl">${icon}</span><span class="min-w-0 flex-1"><b class="block">${titulo}</b><span class="text-xs text-zinc-400">${sub}</span></span></button>`;

class MenuScene extends PartidasScene {
  constructor(app, aviso = ''){ super(app); this.aviso = aviso; this.paso = null; this.sel = {}; }
  enter(){ this.pintar(this.aviso); }
  tiposOk(){ return Object.values(DOMINIOS).flatMap(d => d.tipos).filter(t => this.app.tipoDesbloqueado(t)); }
  pintar(msg = ''){
    const d = this.app.progreso.data, paso = this.paso, ok = this.tiposOk();
    let cuerpo;
    if (!paso) cuerpo = `
      <div class="text-center"><div class="text-6xl">👽🛸</div><h2 class="mt-1 text-3xl font-black tracking-tight">Defensa Algebraica</h2>
        <p class="mt-1 text-sm text-zinc-400">Resuelve con cartas de propiedades para dar energía a tus soldados.</p></div>
      <button data-j="jugar" class="${UI.btnP} !min-h-16 text-xl">▶ Jugar</button>`;
    else if (paso === 'modo') cuerpo = `
      <div class="flex items-center gap-2"><button data-j="atras" class="${UI.btn} !min-h-10 !px-3">◂</button><b class="text-lg">1 · Elige la modalidad</b></div>
      <div class="grid gap-2">${MODOS.map(([id, ic, n]) => { const disp = id === 'todo' ? ok.length : ok.filter(t => t.dominio.id === id).length;
        return tarjetaBtn(`data-modo="${id}"`, ic, n, disp ? `${disp} tipo(s) de problema · 4 misiones` : '🔒 Se desbloquea en la Ruta', false, !disp); }).join('')}
        ${tarjetaBtn('data-modo="infinito"', '♾️', 'Modo infinito', 'Misiones sin fin; tú eliges qué operaciones salen.')}</div>`;
    else if (paso === 'ops') { const mazo = new Set(d.mazoInfinito ?? []);
      cuerpo = `
      <div class="flex items-center gap-2"><button data-j="atras" class="${UI.btn} !min-h-10 !px-3">◂</button><b class="text-lg">2 · ¿Qué operaciones salen?</b></div>
      <b class="text-sm text-zinc-300">Por defecto</b>
      <div class="grid gap-2">${SETS_INFINITO.map(s => { const n = ok.filter(t => s.dominios.includes(t.dominio.id)).length;
        return tarjetaBtn(`data-set="${s.id}"`, s.icon, s.nombre, n ? `${n} tipo(s) de problema` : '🔒 Aún no hay tipos desbloqueados', this.sel.set === s.id, !n); }).join('')}</div>
      <b class="mt-2 text-sm text-zinc-300">Mi mazo personalizado</b>
      <p class="text-xs text-zinc-400">Marca los tipos de problema que quieres (se guarda para la próxima vez).</p>
      <div class="grid gap-1.5">${Object.values(DOMINIOS).map(dom => { const ts = ok.filter(t => t.dominio === dom); if (!ts.length) return '';
        return `<div class="${UI.card} !p-2.5"><b class="text-xs text-zinc-400">${dom.icon} ${dom.nombre}</b><div class="mt-1 flex flex-wrap gap-1.5">${ts.map(t => `<button data-tipo="${t.id}" class="rounded-full border px-2.5 py-1.5 text-xs touch-manipulation ${mazo.has(t.id) ? 'border-amber-400 bg-amber-400/15 text-amber-200' : 'border-zinc-700 bg-zinc-950'}">${mazo.has(t.id) ? '✓ ' : ''}${t.name}</button>`).join('')}</div></div>`; }).join('')}</div>
      <button data-set="mazo" class="${UI.btnP}" ${mazo.size ? '' : 'disabled'}>Usar mi mazo (${mazo.size}) ▸</button>`; }
    else cuerpo = `
      <div class="flex items-center gap-2"><button data-j="atras" class="${UI.btn} !min-h-10 !px-3">◂</button><b class="text-lg">${this.sel.infinito ? 3 : 2} · Elige la dificultad</b></div>
      <div class="grid gap-2">${DIFICULTADES.map(df => { const libre = this.app.dificultadDesbloqueada(df.id);
        return tarjetaBtn(`data-dif="${df.id}"`, libre ? df.icon : '🔒', df.nombre, libre ? df.desc : 'Se desbloquea en la Ruta', false, !libre); }).join('')}</div>`;
    const lista = this.gestor.lista();
    this.app.html(`
    <div class="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 pb-6 pt-4">
      ${msg ? `<p class="rounded-xl bg-zinc-900 px-3 py-2 text-sm text-emerald-300">${msg}</p>` : ''}
      ${cuerpo}
      <div class="mt-3 flex items-center justify-between"><b>💾 Partidas guardadas</b><label class="${UI.btn} !min-h-9 !px-3 text-xs">⬆ Importar JSON<input type="file" accept="application/json,.json" data-a="importar" class="hidden"></label></div>
      <div class="grid gap-2">${lista.length ? lista.map(p => this.fila(p)).join('') : '<p class="py-4 text-center text-sm text-zinc-500">Todavía no hay partidas guardadas. Se guardan solas al terminar cada misión.</p>'}</div>
      <div data-h="detalle" class="absolute inset-0 z-20 hidden"></div>
    </div>`).onclick = e => this.clickMenu(e);
    this.app.root.querySelector('[data-a="importar"]').onchange = e => this.importar(e.target.files[0]);
  }
  fila(p){
    const m = MODOS.find(x => x[0] === p.modo);
    return `<div class="${UI.card} flex flex-col gap-2">
      <div><b>${p.nombre}</b>${p.importada ? ' <span class="rounded-full bg-sky-900 px-2 text-[10px] text-sky-200">importada</span>' : ''}
        <div class="text-xs text-zinc-400">${p.run.infinito ? '♾️ Infinito' : `${m?.[1] ?? ''} ${m?.[2] ?? p.modo}`} · ${dificultad(p.dificultad).icon} ${dificultad(p.dificultad).nombre} · Misión ${p.run.mision} · Nv ${p.run.nivel} · ${p.proceso.length} pasos</div>
        <div class="text-[11px] text-zinc-500">${new Date(p.fecha).toLocaleString()}</div></div>
      <div class="grid grid-cols-4 gap-1.5">
        <button data-p="cargar|${p.id}" class="${UI.btnP} !min-h-10 !px-2 text-sm">▶ Seguir</button>
        <button data-p="proceso|${p.id}" class="${UI.btn} !min-h-10 !px-2 text-xs">📜 Proceso</button>
        <button data-p="json|${p.id}" class="${UI.btn} !min-h-10 !px-2 text-xs">⬇ JSON</button>
        <button data-p="borrar|${p.id}" class="${UI.btn} !min-h-10 !px-2 text-sm">🗑</button></div></div>`;
  }
  clickMenu(e){
    const d = this.app.progreso.data, P = this.app.progreso;
    const j = e.target.closest('[data-j]')?.dataset.j;
    if (j === 'jugar'){ this.paso = 'modo'; this.sel = {}; return this.pintar(); }
    if (j === 'atras'){ this.paso = this.paso === 'dif' ? (this.sel.infinito ? 'ops' : 'modo') : this.paso === 'ops' ? 'modo' : null; return this.pintar(); }
    const modo = e.target.closest('[data-modo]')?.dataset.modo;
    if (modo){ if (modo === 'infinito'){ this.sel = {infinito:true}; this.paso = 'ops'; } else { this.sel = {modo}; this.paso = 'dif'; } return this.pintar(); }
    const tipo = e.target.closest('[data-tipo]')?.dataset.tipo;
    if (tipo){ const m = new Set(d.mazoInfinito ?? []); m.has(tipo) ? m.delete(tipo) : m.add(tipo); d.mazoInfinito = [...m]; P.guardar(); return this.pintar(); }
    const set = e.target.closest('[data-set]')?.dataset.set;
    if (set){
      const ok = this.tiposOk();
      const ids = set === 'mazo' ? (d.mazoInfinito ?? []).filter(id => ok.some(t => t.id === id)) : ok.filter(t => SETS_INFINITO.find(s => s.id === set).dominios.includes(t.dominio.id)).map(t => t.id);
      if (!ids.length) return;
      this.sel.set = set; this.sel.tipos = ids; this.paso = 'dif'; return this.pintar();
    }
    const df = e.target.closest('[data-dif]')?.dataset.dif;
    if (df){
      d.dificultad = df; if (this.sel.modo) d.modo = this.sel.modo; P.guardar();
      const run = new Run(this.app);
      if (this.sel.infinito){ run.infinito = true; run.tipos = new Set(this.sel.tipos); }
      return this.app.go(new BattleScene(this.app, run));
    }
    if (e.target.closest('[data-p]') || e.target.closest('[data-a="cerrar"]')) return this.click(e);   // partidas guardadas (heredado)
  }
}

/* ---------- Cómo jugar: diapositivas animadas ---------- */
const DIAPOS = [
  {icon:'👽', titulo:'¡Invasión!', txt:'Los alienígenas atacan la base. Tus soldados solo disparan con <b class="text-amber-300">⚡ energía</b>… y la energía sale de resolver matemáticas.', anim:'[animation:flotar_2s_ease-in-out_infinite]'},
  {icon:'🃏', titulo:'Las cartas son propiedades', txt:'Abajo está el problema y tu mano de cartas. Toca una carta; si sirve en varios lugares, toca en la expresión dónde usarla y elige el resultado correcto.', carta:true},
  {icon:'⚡', titulo:'Cada paso da energía', txt:'Cada paso que te acerca a la solución carga energía y XP. Bonos por ser <b>rápido</b>, hacer <b>combos</b> y ser <b>creativo</b> con el ✍️ Paso libre.', anim:'animate-pulse'},
  {icon:'🪖', titulo:'Soldados y armas', txt:'La base recluta soldados. Al subir de nivel eliges 1 arma y 1 táctico; en nivel 3 algunos se <b>fusionan</b>. Más adelante, en 🪖 Pelotón, eliges tipos de soldado y munición según las debilidades de los enemigos.', anim:'[animation:flotar_2s_ease-in-out_infinite]'},
  {icon:'🌧️', titulo:'Oleadas, clima y jefes', txt:'Cada misión tiene 3 oleadas y un jefe al final. El clima cambia la batalla. Ninguna oleada termina sin resolver su problema.', anim:'animate-bounce'},
  {icon:'🏅', titulo:'Misiones y guardado', txt:'Al cumplir cada misión el juego se detiene: sigues o guardas para después. Las partidas se guardan con todo su proceso y se pueden exportar como JSON.', anim:'[animation:flotar_2s_ease-in-out_infinite]'},
  {icon:'♾️', titulo:'Modo infinito', txt:'Misiones sin fin con las operaciones que tú elijas: un conjunto por defecto o tu mazo personalizado.', anim:'animate-spin [animation-duration:6s]'},
  {icon:'🗺️', titulo:'Todo suma en la Ruta', txt:'Lo que aprendes en la guía y lo que logras aquí avanza tu 🗺️ Ruta, que desbloquea problemas, cartas, dificultades y bonificadores.', anim:'animate-pulse'},
];
class HelpScene extends Scene {
  enter(){ this.i ??= 0; this.pintar(); }
  pintar(){
    const s = DIAPOS[this.i], dom = DOMINIOS.fund, carta = dom.cartas.get('dist');
    this.app.html(`
    <div class="mx-auto flex h-full max-w-md flex-col px-4 pb-4 pt-4">
      <h2 class="text-xl font-black">❓ Cómo jugar</h2>
      <div data-h="diapo" class="mt-3 flex flex-1 touch-pan-y flex-col items-center justify-center gap-4 rounded-3xl border border-zinc-800 bg-gradient-to-b from-indigo-950/60 to-zinc-950 p-5 text-center">
        ${s.carta ? `<div class="[animation:flotar_2s_ease-in-out_infinite]">${cartaHTML(carta, dom, {attr:''})}</div>` : `<div class="text-7xl ${s.anim}">${s.icon}</div>`}
        <b class="text-2xl">${s.titulo}</b><p class="text-sm text-zinc-300">${s.txt}</p></div>
      <div class="mt-3 flex items-center justify-between gap-2">
        <button data-d="-1" class="${UI.btn}" ${this.i ? '' : 'disabled'}>◂ Anterior</button>
        <div class="flex gap-1">${DIAPOS.map((_, k) => `<span class="h-2 w-2 rounded-full ${k === this.i ? 'bg-emerald-400' : 'bg-zinc-700'}"></span>`).join('')}</div>
        ${this.i < DIAPOS.length - 1 ? `<button data-d="1" class="${UI.btnP}">Siguiente ▸</button>` : `<button data-d="jugar" class="${UI.btnP}">▶ Jugar</button>`}</div>
    </div>`).onclick = e => {
      const d = e.target.closest('[data-d]')?.dataset.d; if (!d) return;
      if (d === 'jugar') return this.app.go(new MenuScene(this.app));
      this.i = Math.max(0, Math.min(DIAPOS.length - 1, this.i + +d)); this.pintar();
    };
    // deslizar con el dedo para cambiar de diapositiva
    const el = this.app.root.querySelector('[data-h="diapo"]'); let x0 = null;
    el.onpointerdown = e => { x0 = e.clientX; };
    el.onpointerup = e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40){ this.i = Math.max(0, Math.min(DIAPOS.length - 1, this.i + (dx < 0 ? 1 : -1))); this.pintar(); } };
  }
}

/* ---------- Configuración ---------- */
class ConfigScene extends Scene {
  enter(){ this.pintar(); }
  pintar(msg = ''){
    const P = this.app.progreso, d = P.data;
    this.app.html(`
    <div class="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 pb-6 pt-4">
      <h2 class="text-2xl font-black">⚙️ Configuración</h2>
      ${msg ? `<p class="rounded-xl bg-zinc-900 px-3 py-2 text-sm">${msg}</p>` : ''}
      <div class="${UI.card}"><b>Modo asistido</b>
        <div class="mt-2 grid grid-cols-4 gap-1.5">${NIVELES_AYUDA.map((n, i) => `<button data-ayuda="${i}" class="flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 px-1 text-xs font-semibold touch-manipulation ${(d.asistido ?? 0) === i ? 'border-sky-400 bg-sky-400/15 text-sky-200' : 'border-zinc-700 bg-zinc-900'}"><span class="text-lg">${n.icon}</span>${n.nombre}</button>`).join('')}</div>
        <p class="mt-1.5 text-xs text-zinc-400">${NIVELES_AYUDA[d.asistido ?? 0].desc}${(d.asistido ?? 0) ? ` XP ×${NIVELES_AYUDA[d.asistido].xp}.` : ''}</p></div>
      <div class="${UI.card}"><b>Archivos</b><p class="text-xs text-zinc-400">Exporta todo tu avance (juego, partidas y guía) a un archivo JSON, o impórtalo en otro dispositivo.</p>
        <div class="mt-2 grid grid-cols-2 gap-2"><button data-a="exportar" class="${UI.btn} text-sm">⬇ Exportar</button><label class="${UI.btn} text-sm">⬆ Importar<input type="file" accept="application/json,.json" data-a="importar" class="hidden"></label></div></div>
      <div class="${UI.card}"><b>🧪 Modo desarrollador</b>
        ${d.devDesbloqueado ? `<label class="mt-2 flex items-center gap-3 text-sm"><input type="checkbox" data-a="todo" class="h-6 w-6 accent-amber-400" ${d.todo ? 'checked' : ''}><span>${d.todo ? 'Activado: todo desbloqueado (también el catálogo).' : 'Desactivado: se sigue la Ruta.'}</span></label>`
          : `<p class="text-xs text-zinc-400">Escribe la contraseña para activarlo.</p><div class="mt-2 flex gap-2"><input data-a="clave" type="password" placeholder="Contraseña" class="min-h-11 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm"><button data-a="entrar" class="${UI.btn} text-sm">Activar</button></div>`}</div>
    </div>`).onclick = e => this.click(e);
    const imp = this.app.root.querySelector('[data-a="importar"]'); imp.onchange = () => this.importar(imp.files[0]);
    const clave = this.app.root.querySelector('[data-a="clave"]'); if (clave) clave.onkeydown = e => { if (e.key === 'Enter') this.entrar(clave.value); };
  }
  entrar(v){
    const P = this.app.progreso;
    if (v.trim() !== CLAVE_DEV) return this.pintar('❌ Contraseña incorrecta.');
    P.data.devDesbloqueado = true; P.data.todo = true; P.guardar(); this.pintar('✅ Modo desarrollador activado y guardado.');
  }
  click(e){
    const P = this.app.progreso, d = P.data, a = e.target.closest('[data-a]')?.dataset.a;
    const ay = e.target.closest('[data-ayuda]')?.dataset.ayuda;
    if (ay != null){ d.asistido = +ay; P.guardar(); return this.pintar(); }
    if (a === 'entrar') return this.entrar(this.app.root.querySelector('[data-a="clave"]').value);
    if (a === 'todo'){ d.todo = e.target.checked; P.guardar(); return this.pintar(); }
    if (a === 'exportar'){
      const datos = {}; for (let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if (k.startsWith('calcint:')) datos[k] = localStorage.getItem(k); }
      GestorPartidas.descargar({app:'defensa-algebraica', tipo:'avance', version:1, fecha:new Date().toISOString(), datos, modo:'avance', run:{mision:0, oleada:0}}, 'avance-calculo.json');
    }
  }
  async importar(file){
    if (!file) return;
    try {
      const j = JSON.parse(await file.text());
      if (j.tipo !== 'avance' || !j.datos) throw new Error('Ese archivo no es un avance exportado desde Configuración.');
      for (const [k, v] of Object.entries(j.datos)) if (k.startsWith('calcint:')) localStorage.setItem(k, v);
      this.app.progreso.data = new Progreso(new SaveRepository()).data;
      this.pintar('✅ Avance importado. Recarga la página para ver también tu progreso de la guía.');
    } catch (err){ this.pintar(`❌ ${err.message}`); }
  }
}

/* ---------- Más ---------- */
class MasScene extends Scene {
  enter(){
    const disp = this.app.pelotonDisponible(), d = this.app.progreso.data;
    this.app.html(`
    <div class="mx-auto flex h-full max-w-xl flex-col gap-2 overflow-y-auto px-4 pb-6 pt-4">
      <h2 class="text-2xl font-black">☰ Más</h2>
      ${tarjetaBtn('data-ir="peloton"', '🪖', 'Pelotón', disp ? 'Tipos de soldado y munición contra las debilidades enemigas.' : '🔒 Se desbloquea en la Ruta (3 misiones).', false, !disp)}
      ${tarjetaBtn('data-ir="mejoras"', '🛠', 'Mejoras', `Mejoras permanentes · tienes ${d.puntos} 🔬`)}
      ${tarjetaBtn('data-ir="ayuda"', '❓', 'Cómo jugar', 'Tutorial del juego paso a paso.')}
      ${tarjetaBtn('data-ir="config"', '⚙️', 'Configuración', 'Modo asistido, archivos y modo desarrollador.')}
    </div>`).onclick = e => { const s = e.target.closest('[data-ir]')?.dataset.ir; if (!s) return; if (s === 'config') return abrirAjustes(); location.hash = '#/jugar/' + s; };   // la configuración es la misma de toda la app
  }
}

/* ---------- Juego bloqueado hasta el nivel mínimo de la Ruta ---------- */
class BloqueoScene extends Scene {
  enter(){
    const R = this.app.ruta, H = R.hitos(), min = R.nivelMinimo, faltan = H.slice(1, min + 1).filter(h => !R.cumplido(h));
    this.app.html(`
    <div class="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-4 overflow-y-auto px-5 py-6 text-center">
      <div class="text-6xl">🔒</div>
      <h2 class="text-2xl font-black">El juego se abre en el nivel ${min + 1} de la Ruta</h2>
      <p class="text-sm text-zinc-400">Primero aprende lo básico: al completar estos pasos se desbloquean el primer tipo de problema, los fusileros y las primeras armas.</p>
      <ol class="w-full space-y-1.5 text-left text-sm">${H.slice(1, min + 1).map(h => `<li class="flex items-center gap-2 rounded-xl border px-3 py-2 ${R.cumplido(h) ? 'border-emerald-700 bg-emerald-950/40 text-emerald-200' : 'border-zinc-700 bg-zinc-900'}">${R.cumplido(h) ? '✅' : '⬜'} <span class="flex-1">${h.titulo}</span></li>`).join('')}</ol>
      <a href="${faltan[0]?.href ?? '#/aprender'}" class="${UI.btnP} w-full">📚 ${faltan.length ? 'Seguir aprendiendo' : 'Ir a Aprender'}</a>
      <p class="text-xs text-zinc-500">(Con el modo desarrollador de ⚙️ Configuración todo queda abierto.)</p>
    </div>`);
  }
}
