/* =====================================================================
   DEFENSA ALGEBRAICA · 3d) Potenciadores de las armas de los soldados
   - Cada una de las 15 armas tiene 6 potenciadores propios (90 en total);
     se eligen al subir de nivel durante la partida (máx. nivel 3).
   - 6 superpotenciadores iguales para todas las armas: 3 «de arma» (piden
     2 potenciadores al máximo) y 3 «con táctica» (piden 1 potenciador y 1
     táctico al máximo). Se desbloquean con la Ruta.
   ===================================================================== */
/** Plantillas: cada arma recibe las 6 con un nombre propio. `ef` = efecto por nivel. */
const PLANTILLAS_POT = [
  {k:'dano',   icon:'💥', nombre:'Carga reforzada', desc:'+20 % de daño (o curación/reparación) por nivel.', ef:{dmg:0.2}},
  {k:'cad',    icon:'⏩', nombre:'Mecanismo rápido', desc:'Dispara un 15 % más seguido por nivel.', ef:{cd:-0.15}},
  {k:'alc',    icon:'📏', nombre:'Mira extendida', desc:'+15 % de alcance por nivel.', ef:{rango:0.15}},
  {k:'area',   icon:'🌀', nombre:'Onda expansiva', desc:'+8 de área de impacto por nivel.', ef:{area:8}},
  {k:'perf',   icon:'🔩', nombre:'Punta perforante', desc:'Ignora un 20 % de armadura y escudo por nivel.', ef:{perf:0.2}},
  {k:'crit',   icon:'🎯', nombre:'Golpe certero', desc:'10 % de probabilidad de daño doble por nivel.', ef:{crit:0.1}},
];
const MAX_POT = 3;
const POTENCIADORES = {};          // id → {id, arma, tipo, ...plantilla}
for (const tipo of Object.keys(ARMAS_TROPA)) for (const [armaId, armaNombre, armaIcon] of ARMAS_TROPA[tipo])
  for (const P of PLANTILLAS_POT){ const id = `${armaId}:${P.k}`; POTENCIADORES[id] = {...P, id, arma:armaId, armaNombre, armaIcon, tipo, nombre:`${P.nombre} · ${armaNombre}`}; }
/** Superpotenciadores (iguales para todas las armas). */
const SUPERPOTENCIADORES = {
  sobrecarga:  {icon:'⚡', nombre:'Sobrecarga', clase:'arma', desc:'+40 % de daño en todas las armas de los soldados.', ef:{dmg:0.4}},
  fibonacci:   {icon:'🌻', nombre:'Ráfaga Fibonacci', clase:'arma', desc:'Cada disparo lanza una bala extra.', ef:{extra:1}},
  exacto:      {icon:'🎯', nombre:'Disparo exacto', clase:'arma', desc:'+25 % de probabilidad de daño doble.', ef:{crit:0.25}},
  euler:       {icon:'🛡️', nombre:'Formación Euler', clase:'tactica', desc:'Soldados con +40 % de vida y regeneración.', ef:{vida:0.4, regen:0.6}},
  eco:         {icon:'🔊', nombre:'Eco táctico', clase:'tactica', desc:'Los disparos de los soldados cuestan 40 % menos energía.', ef:{costo:-0.4}},
  convergencia:{icon:'🧲', nombre:'Convergencia', clase:'tactica', desc:'Los golpes frenan a los enemigos y +20 % de alcance.', ef:{congela:true, rango:0.2}},
};
/** Fusiones de arma: cada una de las 15 armas tiene 3, cada una con un táctico distinto (45 en total).
    Aparecen al elegir potenciadores cuando el arma ya tiene 3 niveles de potenciadores y el táctico está en tu equipo. */
const PLANTILLAS_FUSION = {
  amplificador:{icon:'⚡', sufijo:'Sobrecargado', desc:'+35 % de daño y disparos 10 % más baratos.', ef:{dmg:0.35, costo:-0.1}, fx:{color:'#fef08a', chispas:true}},
  escudo:      {icon:'🛡️', sufijo:'Égida',        desc:'Sus soldados: +35 % de vida y regeneración.', ef:{vida:0.35, regen:0.4}, fx:{color:'#93c5fd', anillo:1}},
  lenta:       {icon:'❄️', sufijo:'Criogénico',   desc:'Sus disparos congelan y +10 % de daño.', ef:{congela:true, dmg:0.1}, fx:{color:'#bae6fd', estela:2}},
  reclutas:    {icon:'👥', sufijo:'Enjambre',     desc:'Cada disparo lanza una bala extra.', ef:{extra:1}, fx:{estela:1}},
  municion:    {icon:'🔩', sufijo:'Perforador',   desc:'Ignora 50 % de armadura y escudo; +10 % de daño.', ef:{perf:0.5, dmg:0.1}, fx:{perfora:true, color:'#e2e8f0'}},
  concentracion:{icon:'🎯', sufijo:'Certero',     desc:'+30 % de daño doble y +15 % de alcance.', ef:{crit:0.3, rango:0.15}, fx:{chispas:true, estela:1}},
  botiquin:    {icon:'💚', sufijo:'Vital',        desc:'Sus soldados regeneran mucha vida (+20 % de vida).', ef:{regen:0.8, vida:0.2}, fx:{color:'#86efac', anillo:1}},
};
const FUSIONES_ARMA = {};          // id → {id, arma, tipo, tactico, icon, nombre, desc, ef, fx}
{ const tacs = Object.keys(PLANTILLAS_FUSION); let w = 0;
  for (const tipo of Object.keys(ARMAS_TROPA)) for (const [armaId, armaNombre, armaIcon] of ARMAS_TROPA[tipo]){
    for (let k = 0; k < 3; k++){ const tac = tacs[(w * 3 + k) % tacs.length], P = PLANTILLAS_FUSION[tac], id = `fus:${armaId}:${tac}`;
      FUSIONES_ARMA[id] = {id, arma:armaId, armaNombre, armaIcon, tipo, tactico:tac, icon:P.icon, nombre:`${armaNombre} ${P.sufijo}`, desc:P.desc, ef:P.ef, fx:P.fx}; }
    w++;
  } }
/** Fusiones de arma que ya se pueden elegir para un arma en esta partida. */
function fusionesDisponibles(run, armaId){
  const pot = run.potenciadores ?? {}, niveles = PLANTILLAS_POT.reduce((t, p) => t + (pot[`${armaId}:${p.k}`] ?? 0), 0);
  const tacs = new Set((run.loadout?.tacticos ?? []).map(b => b.id));
  return Object.values(FUSIONES_ARMA).filter(f => f.arma === armaId && niveles >= 3 && tacs.has(f.tactico) && !(run.fusionesArma ?? []).includes(f.id)).map(f => f.id);
}
/** Efecto total de los potenciadores para un tipo de soldado (con su arma equipada). */
function efectoPotencia(run, armaId){
  const e = {dmg:0, cd:0, rango:0, area:0, perf:0, crit:0, extra:0, costo:0, vida:0, regen:0, congela:false};
  for (const [id, n] of Object.entries(run.potenciadores ?? {})){ const p = POTENCIADORES[id]; if (!p || p.arma !== armaId) continue; for (const [k, v] of Object.entries(p.ef)) e[k] += v * n; }
  for (const id of run.supers ?? []){ for (const [k, v] of Object.entries(SUPERPOTENCIADORES[id].ef)) e[k] = typeof v === 'boolean' ? v : e[k] + v; }
  for (const id of run.fusionesArma ?? []){ const f = FUSIONES_ARMA[id]; if (!f || f.arma !== armaId) continue; for (const [k, v] of Object.entries(f.ef)) e[k] = typeof v === 'boolean' ? v : e[k] + v; }
  return e;
}
/** Opciones de potenciadores al subir de nivel (de las armas equipadas de los tipos desbloqueados). */
function opcionesPotencia(app, run, rng, n = 3){
  const P = app.progreso, T = tropaDe(P);
  const armas = TIPOS_TROPA.filter(t => app.soldadoDesbloqueado(t)).map(t => T.equipo[t].arma);
  const pot = run.potenciadores ??= {}, sup = run.supers ??= [];
  const supers = superDisponibles(app, run).map(id => ({accion:'super', id}));
  const normales = rng.shuffle(armas.flatMap(a => PLANTILLAS_POT.map(p => `${a}:${p.k}`)).filter(id => (pot[id] ?? 0) < MAX_POT)).map(id => ({accion:'pot', id}));
  return [...supers.slice(0, 1), ...normales].slice(0, n);
}
/** Superpotenciadores que ya se pueden tomar (condiciones de la partida + Ruta). */
function superDisponibles(app, run){
  if (!app.progreso.data.todo && !app.ruta.hitos().some(h => h.supers && h.ok)) return [];
  const pot = run.potenciadores ?? {}, maximos = Object.values(pot).filter(n => n >= MAX_POT).length;
  const tacticoMax = (run.loadout?.tacticos ?? []).some(b => b.nivel >= MAX_NIVEL);
  return Object.entries(SUPERPOTENCIADORES).filter(([id, s]) => !(run.supers ?? []).includes(id) && (s.clase === 'arma' ? maximos >= 2 : maximos >= 1 && tacticoMax)).map(([id]) => id);
}

/* ---------- Partículas: cada arma dispara distinto y sus potenciadores lo cambian ---------- */
const FX_ARMA = {
  'rifle-vector':{color:'#fde047', forma:'bala'}, 'carabina-pi':{color:'#c4b5fd', forma:'orbe'}, 'fusil-asintota':{color:'#f8fafc', forma:'rayo'},
  'escopeta-matriz':{color:'#fbbf24', forma:'perdigon'}, 'martillo-tensor':{color:'#fb923c', forma:'onda'}, 'lanza-ion':{color:'#67e8f9', forma:'rayo'},
  'lanzagranadas-pi':{color:'#fb923c', forma:'granada'}, 'mortero-raiz':{color:'#f97316', forma:'granada'}, 'granada-plasma':{color:'#e879f9', forma:'orbe'},
};
/** Aspecto del disparo según el arma y sus potenciadores (tamaño, estela, color, chispas…). */
function fxDisparo(run, armaId){
  const f = {color:'#e5e7eb', forma:'bala', ...(FX_ARMA[armaId] ?? {})}, pot = run?.potenciadores ?? {}, n = k => pot[`${armaId}:${k}`] ?? 0;
  const out = {...f, r:1 + 0.3 * n('dano'), estela:n('cad') + n('alc'), perfora:n('perf') > 0, anillo:n('area'), chispas:n('crit') > 0};
  for (const id of run?.fusionesArma ?? []){ const fu = FUSIONES_ARMA[id]; if (!fu || fu.arma !== armaId) continue;   // las fusiones cambian las partículas
    for (const [k, v] of Object.entries(fu.fx)) out[k] = typeof v === 'number' && k !== 'color' ? (out[k] ?? 0) + v : v; out.r += 0.3; }
  return out;
}
