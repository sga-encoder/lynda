/* =====================================================================
   DEFENSA ALGEBRAICA · 3c) Tropa: 20 soldados, 15 armas y 15 blindajes
   - 5 tipos × 4 soldados con estadísticas propias (suben de nivel).
   - Cada tipo tiene 3 armas (o herramientas, en médicos e ingenieros) y
     3 blindajes; se equipa 1 de cada uno por tipo y también suben de nivel.
   - Todo se compra con ⚙️ chatarra (se gana en cada partida, aunque pierdas)
     y se desbloquea por la Ruta de aprendizaje.
   ===================================================================== */
const MAX_NIVEL_TROPA = 5;
/** Soldados: [id, nombre, icono, multiplicadores {vida, dmg, cd, rango}, descripción]. */
const SOLDADOS_UNICOS = {
  fusilero: [['fus-ana', 'Ana «Vector»', '🎯', {}, 'Equilibrada: la fusilera de siempre.'],
             ['fus-teo', 'Teo «Ráfaga»', '💨', {cd:0.75, dmg:0.85}, 'Dispara más rápido, con menos fuerza.'],
             ['fus-luz', 'Luz «Mira»', '🔭', {rango:1.35, dmg:1.1, cd:1.1}, 'Más alcance y precisión.'],
             ['fus-max', 'Max «Muralla»', '🧱', {vida:1.6, dmg:0.9}, 'Aguanta mucho más en el frente.']],
  pesado:   [['pes-bruno', 'Bruno', '🛡️', {}, 'Escopeta de corto alcance y mucha vida.'],
             ['pes-olga', 'Olga «Tanque»', '🪨', {vida:1.5, cd:1.15}, 'La más resistente del pelotón.'],
             ['pes-iker', 'Iker «Impacto»', '💥', {dmg:1.35, vida:0.9}, 'Golpea fuerte, se arriesga.'],
             ['pes-nora', 'Nora «Barrera»', '🧲', {vida:1.25, rango:1.2}, 'Frena a los enemigos desde más lejos.']],
  granadero:[['gra-rita', 'Rita', '💣', {}, 'Granadas en parábola con área.'],
             ['gra-dani', 'Dani «Lluvia»', '🌧️', {cd:0.8, dmg:0.85}, 'Lanza más seguido.'],
             ['gra-paco', 'Paco «Cráter»', '🌋', {dmg:1.4, cd:1.2}, 'Explosiones enormes.'],
             ['gra-sol', 'Sol «Largo»', '📐', {rango:1.3}, 'Alcanza mucho más lejos.']],
  medico:   [['med-eva', 'Eva', '⛑️', {}, 'Cura al soldado más herido.'],
             ['med-tom', 'Tom «Pulso»', '💓', {cd:0.75}, 'Cura más seguido.'],
             ['med-ines', 'Inés «Vital»', '🌿', {dmg:1.4, cd:1.15}, 'Curaciones grandes.'],
             ['med-raul', 'Raúl «Campo»', '🏕️', {vida:1.5}, 'Resiste en primera línea.']],
  ingeniero:[['ing-hugo', 'Hugo', '🔧', {}, 'Repara la base.'],
             ['ing-vera', 'Vera «Turbo»', '⚙️', {cd:0.75}, 'Repara más rápido.'],
             ['ing-leo', 'Leo «Forja»', '🔩', {dmg:1.4, cd:1.15}, 'Reparaciones grandes.'],
             ['ing-mia', 'Mía «Blindaje»', '🦾', {vida:1.5}, 'Muy difícil de derribar.']],
};
/** Armas por tipo: [id, nombre, icono, {dano, dmg, cd, rango, area, parabola}, desc]. En apoyo: {cura|repara, cd}. */
const ARMAS_TROPA = {
  fusilero: [['rifle-vector', 'Rifle Vector', '🔫', {dano:'fisico', dmg:1, cd:1, rango:130}, 'Balas rectas y fiables.'],
             ['carabina-pi', 'Carabina Pi', '🔆', {dano:'energia', dmg:0.9, cd:0.85, rango:120}, 'Plasma que atraviesa armaduras.'],
             ['fusil-asintota', 'Fusil Asíntota', '🎯', {dano:'fisico', dmg:1.6, cd:1.5, rango:190}, 'Muy largo alcance, lento.']],
  pesado:   [['escopeta-matriz', 'Escopeta Matriz', '💥', {dano:'fisico', dmg:1, cd:1, rango:70}, 'Perdigones a corta distancia.'],
             ['martillo-tensor', 'Martillo Tensor', '🔨', {dano:'explosivo', dmg:1.2, cd:1.2, rango:50, area:14}, 'Golpe con onda en área.'],
             ['lanza-ion', 'Lanza Ion', '⚡', {dano:'energia', dmg:1.1, cd:1, rango:90}, 'Energía de corto alcance.']],
  granadero:[['lanzagranadas-pi', 'Lanzagranadas Pi', '💣', {dano:'explosivo', dmg:1, cd:1, rango:150, area:20, parabola:true}, 'Granadas en parábola.'],
             ['mortero-raiz', 'Mortero Raíz', '🌋', {dano:'explosivo', dmg:1.5, cd:1.5, rango:200, area:28, parabola:true}, 'Área enorme, lento.'],
             ['granada-plasma', 'Granada de plasma', '🟣', {dano:'energia', dmg:0.9, cd:0.9, rango:140, area:16, parabola:true}, 'Explota en energía.']],
  medico:   [['botiquin-suma', 'Botiquín Suma', '🩹', {cura:1, cd:1}, 'Cura normal.'],
             ['nanobots-limite', 'Nanobots Límite', '🦠', {cura:0.6, cd:0.5}, 'Curan poquito, muy seguido.'],
             ['desfibrilador', 'Desfibrilador Derivada', '💓', {cura:2, cd:1.8}, 'Una gran curación de golpe.']],
  ingeniero:[['llave-euler', 'Llave Euler', '🔧', {repara:1, cd:1}, 'Reparación normal.'],
             ['soldador-integral', 'Soldador Integral', '🔥', {repara:0.6, cd:0.5}, 'Repara sin parar.'],
             ['dron-taller', 'Dron taller', '🛸', {repara:2, cd:1.8}, 'Gran reparación de golpe.']],
};
/** Blindajes por tipo: [id, nombre, icono, {vida, reduccion, regen}, desc]. */
const BLINDAJES_TROPA = {
  fusilero: [['chaleco-recta', 'Chaleco Recta', '🦺', {vida:2, reduccion:0.1}, 'Protección ligera.'], ['malla-pi', 'Malla Pi', '🕸️', {reduccion:0.25}, 'Reduce todo el daño.'], ['traje-regen', 'Traje Regenerativo', '🌱', {regen:0.4}, 'Se cura solo con el tiempo.']],
  pesado:   [['coraza-matriz', 'Coraza Matriz', '🛡️', {vida:6, reduccion:0.15}, 'Mucha vida extra.'], ['escudo-tensor', 'Escudo Tensor', '🔰', {reduccion:0.4}, 'Bloquea casi la mitad del daño.'], ['placa-infinito', 'Placa Infinito', '♾️', {vida:4, regen:0.5}, 'Vida y regeneración.']],
  granadero:[['peto-parabola', 'Peto Parábola', '🦺', {vida:2, reduccion:0.1}, 'Protección ligera.'], ['traje-antiexplosion', 'Traje antiexplosión', '🧯', {reduccion:0.3}, 'Aguanta los golpes.'], ['mochila-escudo', 'Mochila escudo', '🎒', {vida:3, regen:0.3}, 'Vida extra que se recupera.']],
  medico:   [['bata-blindada', 'Bata blindada', '🥼', {vida:2, reduccion:0.1}, 'Protección ligera.'], ['campo-curativo', 'Campo curativo', '💚', {regen:0.7}, 'Se cura a sí mismo.'], ['casco-cruz', 'Casco Cruz', '⛑️', {reduccion:0.3}, 'Reduce el daño recibido.']],
  ingeniero:[['overol-acero', 'Overol de acero', '🧥', {vida:3, reduccion:0.1}, 'Resistente.'], ['exotraje', 'Exotraje', '🦾', {reduccion:0.35}, 'Casi indestructible.'], ['escudo-reparador', 'Escudo reparador', '🔩', {vida:2, regen:0.5}, 'Se repara solo.']],
};
const TIPOS_TROPA = Object.keys(SOLDADOS_UNICOS);
const costoTropa = nivel => 6 + nivel * 6;          // ⚙️ chatarra para subir del nivel n al n+1
/** Nivel de la Ruta en que se desbloquea un tipo de soldado (el resto de su equipo llega después). */
function nivelTipoRuta(tipo){ const i = RUTA_HITOS().findIndex(h => (h.soldados ?? []).includes(tipo)); return i < 0 ? 0 : i; }
/** ¿Está desbloqueado este elemento? k = posición (0–3 soldados, 0–2 armas/blindajes). */
function tropaDesbloqueada(app, tipo, clase, k){
  if (app.progreso.data.todo) return true;
  if (!app.soldadoDesbloqueado(tipo)) return false;
  const paso = {soldado:3, arma:4, blindaje:4}[clase], extra = clase === 'blindaje' ? 2 : 0;
  return app.ruta.nivelReal >= nivelTipoRuta(tipo) + k * paso + extra - (k === 0 && clase !== 'blindaje' ? 0 : 0);
}
/** Estado guardado de la tropa: niveles y equipo elegido por tipo. */
function tropaDe(P){
  const t = P.data.tropa ??= {niveles:{}, equipo:{}};
  for (const tipo of TIPOS_TROPA) t.equipo[tipo] ??= {arma:ARMAS_TROPA[tipo][0][0], blindaje:null};
  return t;
}
const nivelTropa = (P, id) => tropaDe(P).niveles[id] ?? 1;
/** Perfil final de un soldado concreto (lo que usa la batalla). */
function perfilSoldado(P, uid){
  const tipo = TIPOS_TROPA.find(t => SOLDADOS_UNICOS[t].some(s => s[0] === uid)) ?? 'fusilero';
  const s = SOLDADOS_UNICOS[tipo].find(x => x[0] === uid) ?? SOLDADOS_UNICOS[tipo][0], m = s[3], base = SOLDADOS[tipo], T = tropaDe(P);
  const ns = nivelTropa(P, s[0]), fs = 1 + 0.12 * (ns - 1);
  const arma = ARMAS_TROPA[tipo].find(a => a[0] === T.equipo[tipo].arma) ?? ARMAS_TROPA[tipo][0], na = nivelTropa(P, arma[0]), fa = 1 + 0.15 * (na - 1), A = arma[3];
  const bl = BLINDAJES_TROPA[tipo].find(b => b[0] === T.equipo[tipo].blindaje), nb = bl ? nivelTropa(P, bl[0]) : 0, B = bl ? bl[3] : {}, fb = 1 + 0.2 * Math.max(0, nb - 1);
  const ataqueBase = base.ataque ?? {dmg:1, cd:0.9, costo:0.5, rango:130, dano:'fisico'};
  const perfil = {uid:s[0], tipo, name:s[1], icon:s[2], vida:base.vida * (m.vida ?? 1) * fs + (B.vida ?? 0) * fb, reduccion:Math.min(0.6, (B.reduccion ?? 0) * fb), regen:(B.regen ?? 0) * fb,
    arma:arma[1], blindaje:bl?.[1] ?? null};
  if (base.apoyo) perfil.apoyo = {...base.apoyo, curar:base.apoyo.curar && base.apoyo.curar * (A.cura ?? 1) * (m.dmg ?? 1) * fs * fa, reparar:base.apoyo.reparar && base.apoyo.reparar * (A.repara ?? 1) * (m.dmg ?? 1) * fs * fa, cd:base.apoyo.cd * (A.cd ?? 1) * (m.cd ?? 1)};
  else perfil.ataque = {...ataqueBase, dano:A.dano ?? ataqueBase.dano, dmg:ataqueBase.dmg * (A.dmg ?? 1) * (m.dmg ?? 1) * fs * fa, cd:ataqueBase.cd * (A.cd ?? 1) * (m.cd ?? 1),
    rango:(A.rango ?? ataqueBase.rango) * (m.rango ?? 1), area:A.area ?? ataqueBase.area ?? 0, parabola:A.parabola ?? !!ataqueBase.parabola};
  return perfil;
}
/** Todos los ítems de un tipo con su estado (para el Pelotón y el catálogo). */
function itemsTropa(app, tipo){
  const P = app.progreso, T = tropaDe(P);
  const it = (clase, lista) => lista.map((x, k) => ({clase, id:x[0], name:x[1], icon:x[2], stats:x[3], desc:x[4], k, libre:tropaDesbloqueada(app, tipo, clase, k), nivel:nivelTropa(P, x[0]),
    equipado:clase === 'arma' ? T.equipo[tipo].arma === x[0] : clase === 'blindaje' ? T.equipo[tipo].blindaje === x[0] : false}));
  return {soldados:it('soldado', SOLDADOS_UNICOS[tipo]), armas:it('arma', ARMAS_TROPA[tipo]), blindajes:it('blindaje', BLINDAJES_TROPA[tipo])};
}

/** Soldado que entra cuando el orden pide solo un tipo: el primero desbloqueado (el de mayor nivel). */
function titularDe(app, tipo){
  const P = app.progreso, l = SOLDADOS_UNICOS[tipo].filter((s, k) => tropaDesbloqueada(app, tipo, 'soldado', k));
  return (l.sort((a, b) => nivelTropa(P, b[0]) - nivelTropa(P, a[0]))[0] ?? SOLDADOS_UNICOS[tipo][0])[0];
}
