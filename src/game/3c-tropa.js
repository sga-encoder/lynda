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
/** Rasgos de cada soldado: aspecto (uniforme, casco), color de bala, 1 pasiva (siempre) y 2 activas
    (la 1.ª se enciende con 1 fusión activa de su arma y la 2.ª con 2). Todo ligado a su tipo. */
const A_ = (icon, nombre, tipo, cd, extra = {}, desc = '') => ({icon, nombre, tipo, cd, desc, ...extra});
const RASGOS_SOLDADO = {
  'fus-ana': {cuerpo:'#15803d', casco:'#14532d', bala:'#facc15', pasiva:{nombre:'Puntería estable', desc:'+10 % de daño doble.', ef:{crit:0.1}},
    activas:[A_('🔫', 'Ráfaga triple', 'rafaga', 9, {n:3}, 'Dispara 3 balas seguidas.'), A_('🔥', 'Furia', 'furia', 14, {t:4}, 'Dispara el doble de rápido 4 s.')]},
  'fus-teo': {cuerpo:'#0d9488', casco:'#134e4a', bala:'#5eead4', pasiva:{nombre:'Gatillo ligero', desc:'Dispara 10 % más seguido.', ef:{cd:-0.1}},
    activas:[A_('💨', 'Ráfaga de 5', 'rafaga', 10, {n:5}, 'Dispara 5 balas seguidas.'), A_('🔥', 'Furia', 'furia', 12, {t:4}, 'Dispara el doble de rápido 4 s.')]},
  'fus-luz': {cuerpo:'#4338ca', casco:'#1e1b4b', bala:'#a5b4fc', pasiva:{nombre:'Ojo de halcón', desc:'+15 % de alcance e ignora 20 % de armadura.', ef:{rango:0.15, perf:0.2}},
    activas:[A_('🎯', 'Tiro cargado', 'cargado', 8, {mult:4}, 'Un disparo con 4× daño.'), A_('❄️', 'Marca helada', 'congelar', 15, {t:2.5, radio:150}, 'Congela a los enemigos cercanos.')]},
  'fus-max': {cuerpo:'#57534e', casco:'#292524', bala:'#fdba74', pasiva:{nombre:'Piel dura', desc:'Recibe 15 % menos daño.', ef:{reduccion:0.15}},
    activas:[A_('🛡️', 'Cubrirse', 'escudo', 12, {t:3}, 'Inmune al daño 3 s.'), A_('🔫', 'Ráfaga triple', 'rafaga', 10, {n:3}, 'Dispara 3 balas seguidas.')]},
  'pes-bruno': {cuerpo:'#475569', casco:'#0f172a', bala:'#fbbf24', pasiva:{nombre:'Empuje', desc:'15 % de probabilidad de frenar al enemigo.', ef:{congelaProb:0.15}},
    activas:[A_('💥', 'Onda de choque', 'granada', 10, {dmg:6, area:30}, 'Explosión alrededor del objetivo.'), A_('🛡️', 'Muro', 'escudo', 14, {t:3}, 'Inmune al daño 3 s.')]},
  'pes-olga': {cuerpo:'#78716c', casco:'#44403c', bala:'#e7e5e4', pasiva:{nombre:'Roca', desc:'Regenera vida poco a poco.', ef:{regen:0.4}},
    activas:[A_('🛡️', 'Muro', 'escudo', 11, {t:3}, 'Inmune al daño 3 s.'), A_('📣', 'Grito de ánimo', 'curaGrupo', 15, {v:3}, 'Cura 3 a todo el pelotón.')]},
  'pes-iker': {cuerpo:'#b91c1c', casco:'#450a0a', bala:'#f87171', pasiva:{nombre:'Sin miedo', desc:'+15 % de daño.', ef:{dmg:0.15}},
    activas:[A_('💥', 'Impacto', 'granada', 9, {dmg:8, area:26}, 'Golpe explosivo en área.'), A_('🔥', 'Furia', 'furia', 13, {t:4}, 'Ataca el doble de rápido 4 s.')]},
  'pes-nora': {cuerpo:'#7c3aed', casco:'#2e1065', bala:'#c4b5fd', pasiva:{nombre:'Campo magnético', desc:'25 % de probabilidad de frenar al enemigo.', ef:{congelaProb:0.25}},
    activas:[A_('🧲', 'Atracción helada', 'congelar', 12, {t:2.5, radio:130}, 'Congela a los enemigos cercanos.'), A_('🛡️', 'Barrera', 'escudo', 14, {t:3}, 'Inmune al daño 3 s.')]},
  'gra-rita': {cuerpo:'#b45309', casco:'#78350f', bala:'#fb923c', pasiva:{nombre:'Mecha corta', desc:'+6 de área en sus explosiones.', ef:{area:6}},
    activas:[A_('💣', 'Granada grande', 'granada', 10, {dmg:6, area:34}, 'Explosión grande.'), A_('💣', 'Doble lanzamiento', 'rafaga', 12, {n:2}, 'Lanza 2 granadas.')]},
  'gra-dani': {cuerpo:'#0369a1', casco:'#0c4a6e', bala:'#7dd3fc', pasiva:{nombre:'Bolsillos llenos', desc:'Sus disparos cuestan 20 % menos energía.', ef:{costo:-0.2}},
    activas:[A_('🌧️', 'Lluvia de granadas', 'rafaga', 11, {n:4}, 'Lanza 4 granadas.'), A_('🔥', 'Furia', 'furia', 14, {t:4}, 'Lanza el doble de rápido 4 s.')]},
  'gra-paco': {cuerpo:'#9a3412', casco:'#431407', bala:'#fdba74', pasiva:{nombre:'Pólvora extra', desc:'+20 % de daño.', ef:{dmg:0.2}},
    activas:[A_('🌋', 'Cráter', 'granada', 13, {dmg:12, area:40}, 'Explosión enorme.'), A_('🌫️', 'Humo helado', 'congelar', 15, {t:2, radio:140}, 'Frena a los enemigos cercanos.')]},
  'gra-sol': {cuerpo:'#ca8a04', casco:'#713f12', bala:'#fde047', pasiva:{nombre:'Trayectoria perfecta', desc:'+10 % de alcance y de daño doble.', ef:{rango:0.1, crit:0.1}},
    activas:[A_('📐', 'Granada de precisión', 'granada', 10, {dmg:7, area:28}, 'Explosión certera.'), A_('🔥', 'Furia', 'furia', 14, {t:4}, 'Lanza el doble de rápido 4 s.')]},
  'med-eva': {cuerpo:'#f1f5f9', casco:'#dc2626', bala:'#86efac', pasiva:{nombre:'Manos rápidas', desc:'Cura 10 % más seguido.', ef:{cd:-0.1}},
    activas:[A_('💚', 'Curación en grupo', 'curaGrupo', 12, {v:4}, 'Cura 4 a todo el pelotón.'), A_('🛡️', 'Escudo médico', 'escudoGrupo', 16, {t:2}, 'Todo el pelotón inmune 2 s.')]},
  'med-tom': {cuerpo:'#fce7f3', casco:'#be185d', bala:'#f9a8d4', pasiva:{nombre:'Ritmo', desc:'Se regenera solo.', ef:{regen:0.3}},
    activas:[A_('💓', 'Pulso', 'curaGrupo', 9, {v:3}, 'Cura 3 a todo el pelotón.'), A_('⚡', 'Adrenalina', 'furiaGrupo', 16, {t:3}, 'Todo el pelotón ataca el doble de rápido 3 s.')]},
  'med-ines': {cuerpo:'#ecfccb', casco:'#15803d', bala:'#bef264', pasiva:{nombre:'Herbolaria', desc:'Sus curaciones son 20 % más grandes.', ef:{dmg:0.2}},
    activas:[A_('🌿', 'Gran curación', 'curaGrupo', 14, {v:6}, 'Cura 6 a todo el pelotón.'), A_('🛡️', 'Escudo de hojas', 'escudoGrupo', 16, {t:2}, 'Todo el pelotón inmune 2 s.')]},
  'med-raul': {cuerpo:'#d6d3d1', casco:'#57534e', bala:'#a7f3d0', pasiva:{nombre:'Curtido', desc:'Recibe 15 % menos daño.', ef:{reduccion:0.15}},
    activas:[A_('🏕️', 'Campamento', 'curaGrupo', 12, {v:4}, 'Cura 4 a todo el pelotón.'), A_('🛡️', 'Trinchera', 'escudoGrupo', 15, {t:2}, 'Todo el pelotón inmune 2 s.')]},
  'ing-hugo': {cuerpo:'#ca8a04', casco:'#a16207', bala:'#fde68a', pasiva:{nombre:'Mantenimiento', desc:'Repara 10 % más seguido.', ef:{cd:-0.1}},
    activas:[A_('🔧', 'Reparación rápida', 'reparar', 12, {v:8}, 'Repara 8 de la base.'), A_('🛡️', 'Blindar al pelotón', 'escudoGrupo', 16, {t:2}, 'Todo el pelotón inmune 2 s.')]},
  'ing-vera': {cuerpo:'#ea580c', casco:'#7c2d12', bala:'#fdba74', pasiva:{nombre:'Turbo', desc:'Sus reparaciones cuestan 20 % menos energía.', ef:{costo:-0.2}},
    activas:[A_('⚙️', 'Reparación turbo', 'reparar', 9, {v:6}, 'Repara 6 de la base.'), A_('⚡', 'Sobrecarga', 'furiaGrupo', 16, {t:3}, 'Todo el pelotón ataca el doble de rápido 3 s.')]},
  'ing-leo': {cuerpo:'#525252', casco:'#171717', bala:'#fca5a5', pasiva:{nombre:'Forja', desc:'Sus reparaciones son 20 % más grandes.', ef:{dmg:0.2}},
    activas:[A_('🔩', 'Gran reparación', 'reparar', 14, {v:12}, 'Repara 12 de la base.'), A_('💥', 'Mina', 'granada', 12, {dmg:6, area:30}, 'Una mina explota sobre el enemigo más cercano.')]},
  'ing-mia': {cuerpo:'#0e7490', casco:'#164e63', bala:'#67e8f9', pasiva:{nombre:'Exoesqueleto', desc:'Recibe 20 % menos daño.', ef:{reduccion:0.2}},
    activas:[A_('🦾', 'Refuerzo', 'reparar', 12, {v:7}, 'Repara 7 de la base.'), A_('🛡️', 'Campo de fuerza', 'escudoGrupo', 15, {t:2}, 'Todo el pelotón inmune 2 s.')]},
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
const costoTropa = nivel => Math.round(30 * nivel ** 1.7);   // ⚙️ chatarra para subir del nivel n al n+1: 30, 98, 194, 317
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
  const ataqueBase = base.ataque ? {...base.ataque, costo:base.ataque.costo * 0.9} : {dmg:1, cd:0.9, costo:1.2, rango:130, dano:'fisico'};   // disparar gasta más energía
  const R = RASGOS_SOLDADO[s[0]] ?? {}, pas = R.pasiva?.ef ?? {};
  const perfil = {uid:s[0], tipo, name:s[1], icon:s[2], vida:base.vida * (m.vida ?? 1) * fs + (B.vida ?? 0) * fb, reduccion:Math.min(0.7, (B.reduccion ?? 0) * fb + (pas.reduccion ?? 0)), regen:(B.regen ?? 0) * fb + (pas.regen ?? 0),
    arma:arma[1], armaId:arma[0], blindaje:bl?.[1] ?? null, cuerpo:R.cuerpo, casco:R.casco, bala:R.bala, pasiva:pas, activas:R.activas ?? []};
  if (base.apoyo) perfil.apoyo = {...base.apoyo, costo:base.apoyo.costo * 1.5, curar:base.apoyo.curar && base.apoyo.curar * (A.cura ?? 1) * (m.dmg ?? 1) * fs * fa, reparar:base.apoyo.reparar && base.apoyo.reparar * (A.repara ?? 1) * (m.dmg ?? 1) * fs * fa, cd:base.apoyo.cd * (A.cd ?? 1) * (m.cd ?? 1)};
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
