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
/** Efecto total de los potenciadores para un tipo de soldado (con su arma equipada). */
function efectoPotencia(run, armaId){
  const e = {dmg:0, cd:0, rango:0, area:0, perf:0, crit:0, extra:0, costo:0, vida:0, regen:0, congela:false};
  for (const [id, n] of Object.entries(run.potenciadores ?? {})){ const p = POTENCIADORES[id]; if (!p || p.arma !== armaId) continue; for (const [k, v] of Object.entries(p.ef)) e[k] += v * n; }
  for (const id of run.supers ?? []){ for (const [k, v] of Object.entries(SUPERPOTENCIADORES[id].ef)) e[k] = typeof v === 'boolean' ? v : e[k] + v; }
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
