/* =====================================================================
   DEFENSA ALGEBRAICA · 3b) Mundos, Comandantes y Soberanos
   4 mundos (uno por eje). Cada mundo tiene 4 Comandantes (subjefes) con
   un ataque único y 2 alienígenas propios; el Soberano (jefe) solo se
   enfrenta tras vencer a los 4 y usa los 4 ataques. Los alienígenas
   comunes se mezclan en todos los mundos.
   ===================================================================== */
/** Crea un alienígena a partir de una forma base (para dibujarlo) con estadísticas propias. */
const variante = (id, base, extra) => (pos, c) => {
  const e = ENEMIGOS[base](pos, c), x = extra(c);
  if (x.armas) x.armas = x.armas.map(a => ({t:a.cd * (0.4 + Math.random() * 0.5), ...a}));
  return Object.assign(e, {tipo:id, forma:base}, x, {vidaMax:x.vida ?? e.vidaMax});
};
/* Ataques únicos (uno por Comandante). `arma` usa los tipos del mundo: roca, acido, laser, rayo, bomba,
   invocar, y los nuevos lluvia (varias rocas), pulso (onda a los soldados cercanos), drenar (roba ⚡),
   blindar (armadura temporal) y curar (cura a sus aliados). */
const MUNDOS_JUEGO = [
  {id:'abaco', icon:'🧱', nombre:'Planeta Ábaco', eje:'Fundamentos', dominio:'fund', cielo:['#1e1b4b', '#7c2d12'],
    soberano:{id:'cifrador', name:'Rey Cifrador', forma:'coloso', color:'#fbbf24', desc:'Gobierna los números: combina la lluvia de cifras, la onda divisora, sus fracciones y su coraza de factores.'},
    comandantes:[
      {id:'sumador', name:'Comandante Sumador', forma:'blindado', color:'#facc15', ataque:{nombre:'Lluvia de sumandos', desc:'Lanza 3 rocas a la vez sobre tus soldados.', arma:{tipo:'lluvia', rango:200, cd:4.5, dmg:2, n:3, objetivo:'soldados'}},
        enemigos:[['contador', 'Contador', 'explorador', 1, 1.1, {}, 'Avanza en filas; débil y numeroso.'], ['acarreo', 'Acarreo', 'saltador', 1.2, 1, {}, 'Salta llevando cifras de más.']]},
      {id:'divisor', name:'Comandante Divisor', forma:'escudero', color:'#fb923c', ataque:{nombre:'Onda divisora', desc:'Una onda que golpea a todos los soldados cercanos.', arma:{tipo:'pulso', rango:70, cd:5, dmg:2.5}},
        enemigos:[['cociente', 'Cociente', 'escudero', 1.1, 1, {escudo:0.5}, 'Se reparte el daño con su escudo.'], ['residuo', 'Residuo', 'acido', 1, 1.1, {}, 'Lo que sobra: escupe desde lejos.']]},
      {id:'fraccionario', name:'Comandante Fraccionario', forma:'reina', color:'#f472b6', ataque:{nombre:'Partir en partes', desc:'Invoca Numeradores en plena batalla.', arma:{tipo:'invocar', invoca:'numerador', cd:6}},
        enemigos:[['numerador', 'Numerador', 'explorador', 1.2, 1, {}, 'Va arriba de todo: ataca primero.'], ['denominador', 'Denominador', 'blindado', 1.3, 0.9, {armadura:0.4}, 'Sostiene a los demás con su armadura.']]},
      {id:'factor', name:'Comandante Factor', forma:'coloso', color:'#a3e635', ataque:{nombre:'Coraza común', desc:'Se cubre con armadura temporal (factor común).', arma:{tipo:'blindar', cd:9, dur:4}},
        enemigos:[['primo', 'Primo', 'saltador', 1, 1.3, {}, 'Indivisible y muy rápido.'], ['multiplo', 'Múltiplo', 'nave', 1.1, 1, {}, 'Nave que suelta copias de sí misma.']]},
    ]},
  {id:'nebulosa', icon:'🔺', nombre:'Nebulosa Exponencial', eje:'Potencias, raíces, log y trig', dominio:'alg', cielo:['#2e1065', '#be185d'],
    soberano:{id:'potencia', name:'Emperatriz Potencia', forma:'reina', color:'#e879f9', desc:'Eleva todo: láser radical, robo de energía, ondas senoidales y curación exponencial.'},
    comandantes:[
      {id:'radical', name:'Comandante Radical', forma:'acorazado', color:'#c084fc', ataque:{nombre:'Raíz láser', desc:'Láser doble y rápido contra la base.', arma:{tipo:'laser', rango:260, cd:1.6, dmg:2.5, objetivo:'base'}},
        enemigos:[['raiz', 'Raíz', 'excavador', 1.1, 1, {}, 'Crece bajo tierra y emerge.'], ['indice', 'Índice', 'dron', 1, 1.1, {}, 'Pequeño y explosivo.']]},
      {id:'exponente', name:'Comandante Exponente', forma:'coloso', color:'#f0abfc', ataque:{nombre:'Crecimiento exponencial', desc:'Cura a todos sus aliados cercanos.', arma:{tipo:'curar', rango:120, cd:6, dmg:5}},
        enemigos:[['cuadrado', 'Cuadrado', 'blindado', 1.4, 0.9, {armadura:0.5}, 'El doble de resistente.'], ['cubo', 'Cubo', 'portadrones', 1.1, 1, {}, 'Nave que se multiplica en drones.']]},
      {id:'logaritmico', name:'Comandante Logarítmico', forma:'mente', color:'#818cf8', ataque:{nombre:'Escala logarítmica', desc:'Roba energía de tus científicos.', arma:{tipo:'drenar', rango:300, cd:5, dmg:8}},
        enemigos:[['mantisa', 'Mantisa', 'caza', 1.1, 1, {}, 'Dispara desde lejos con precisión.'], ['base-e', 'Base e', 'escudero', 1.3, 0.9, {escudo:0.6}, 'Escudo natural contra la energía.']]},
      {id:'senoidal', name:'Comandante Senoidal', forma:'reina', color:'#22d3ee', ataque:{nombre:'Onda seno', desc:'Escupe ácido en ondas sobre tus soldados.', arma:{tipo:'acido', rango:150, cd:1.6, dmg:1.8, objetivo:'soldados'}},
        enemigos:[['coseno', 'Coseno', 'saltador', 1.1, 1.1, {}, 'Va y viene: salta sobre las filas.'], ['tangente', 'Tangente', 'bombardero', 1.1, 1, {}, 'Se dispara al infinito y bombardea.']]},
    ]},
  {id:'cinturon', icon:'📈', nombre:'Cinturón Tangente', eje:'Cálculo diferencial', dominio:'dif', cielo:['#052e16', '#0e7490'],
    soberano:{id:'derivante', name:'Señor Derivante', forma:'acorazado', color:'#34d399', desc:'Domina el cambio: ondas límite, rocas de pendiente, láser en cadena y lluvia de extremos.'},
    comandantes:[
      {id:'limite', name:'Comandante Límite', forma:'mente', color:'#2dd4bf', ataque:{nombre:'Tender a cero', desc:'Onda que golpea a los soldados que se acercan.', arma:{tipo:'pulso', rango:85, cd:4.5, dmg:3}},
        enemigos:[['epsilon', 'Épsilon', 'dron', 0.8, 1.3, {}, 'Diminuto y veloz.'], ['delta', 'Delta', 'explorador', 1.2, 1.1, {}, 'Siempre un poco más cerca.']]},
      {id:'pendiente', name:'Comandante Pendiente', forma:'coloso', color:'#4ade80', ataque:{nombre:'Roca empinada', desc:'Roca pesada de largo alcance contra la base.', arma:{tipo:'roca', rango:280, cd:3.5, dmg:6, objetivo:'base'}},
        enemigos:[['secante', 'Secante', 'caza', 1.1, 1.1, {}, 'Cruza el cielo disparando.'], ['incremento', 'Incremento', 'saltador', 1.2, 1.1, {}, 'Avanza a saltos crecientes.']]},
      {id:'cadena', name:'Comandante Cadena', forma:'acorazado', color:'#a3e635', ataque:{nombre:'Regla de la cadena', desc:'Láser que encadena golpes a la base.', arma:{tipo:'rayo', rango:280, cd:2.5, dmg:3, objetivo:'base'}},
        enemigos:[['eslabon', 'Eslabón', 'blindado', 1.3, 1, {armadura:0.4}, 'Unido a otros, resiste mucho.'], ['compuesta', 'Compuesta', 'nave', 1.2, 1, {}, 'Una nave dentro de otra.']]},
      {id:'extremo', name:'Comandante Extremo', forma:'reina', color:'#facc15', ataque:{nombre:'Máximo y mínimo', desc:'Lluvia de 4 rocas sobre tus soldados.', arma:{tipo:'lluvia', rango:220, cd:5, dmg:2, n:4, objetivo:'soldados'}},
        enemigos:[['maximo', 'Máximo', 'escudero', 1.4, 0.9, {escudo:0.5}, 'En la cima: difícil de bajar.'], ['minimo', 'Mínimo', 'excavador', 1, 1.2, {}, 'Va por lo más bajo, bajo tierra.']]},
    ]},
  {id:'abismo', icon:'∫', nombre:'Abismo Integral', eje:'Cálculo integral', dominio:'int', cielo:['#0c0a09', '#4c1d95'],
    soberano:{id:'acumulador', name:'Gran Acumulador', forma:'mente', color:'#a78bfa', desc:'Acumula todo: invoca primitivas, se blinda, bombardea particiones y drena la energía.'},
    comandantes:[
      {id:'primitiva', name:'Comandante Primitiva', forma:'reina', color:'#c4b5fd', ataque:{nombre:'Antiderivada', desc:'Invoca Constantes C sin parar.', arma:{tipo:'invocar', invoca:'constante', cd:5}},
        enemigos:[['constante', 'Constante C', 'explorador', 1, 1, {}, 'Aparece en toda antiderivada.'], ['area', 'Área', 'blindado', 1.4, 0.9, {armadura:0.4}, 'Ocupa mucho espacio.']]},
      {id:'sustituto', name:'Comandante Sustituto', forma:'coloso', color:'#93c5fd', ataque:{nombre:'Cambio de variable', desc:'Cambia su armadura por una nueva (blindaje temporal).', arma:{tipo:'blindar', cd:8, dur:5}},
        enemigos:[['variable-u', 'Variable u', 'saltador', 1.1, 1.2, {}, 'Cambia de lugar de un salto.'], ['diferencial', 'Diferencial du', 'dron', 1, 1.2, {}, 'Pequeño pero necesario.']]},
      {id:'particionador', name:'Comandante Particionador', forma:'acorazado', color:'#f9a8d4', ataque:{nombre:'Suma de Riemann', desc:'Bombardea en franjas sobre tus soldados.', arma:{tipo:'lluvia', rango:240, cd:4, dmg:1.6, n:5, objetivo:'soldados'}},
        enemigos:[['rectangulo', 'Rectángulo', 'bombardero', 1.1, 1, {}, 'Bombardea en franjas.'], ['trapecio', 'Trapecio', 'escudero', 1.3, 1, {escudo:0.5}, 'Mejor aproximado: escudo firme.']]},
      {id:'impropio', name:'Comandante Impropio', forma:'mente', color:'#fda4af', ataque:{nombre:'Hasta el infinito', desc:'Drena tu energía desde muy lejos.', arma:{tipo:'drenar', rango:320, cd:4.5, dmg:10}},
        enemigos:[['asintota', 'Asíntota', 'caza', 1.2, 1.1, {}, 'Se acerca sin llegar… y dispara.'], ['divergente', 'Divergente', 'portadrones', 1.2, 1, {}, 'Lanza drones sin fin.']]},
    ]},
];
/** Tema de la Ruta que desbloquea a cada Comandante y Soberano (además de vencer al anterior). */
const RUTA_COMANDANTES = {
  sumador:'#/f/signos', divisor:'#/f/multdiv', fraccionario:'#/f/fracciones', factor:'#/f/factorizacion', cifrador:'#/f/cuadraticas',
  radical:'#/f/radicales', exponente:'#/f/exponenciales', logaritmico:'#/f/logaritmicas', senoidal:'#/f/trigonometricas', potencia:'#/f/inecuaciones',
  limite:'#/d/limites', pendiente:'#/d/definicion', cadena:'#/d/cadena', extremo:'#/d/extremos', derivante:'#/d/lhopital',
  primitiva:'#/l1', sustituto:'#/l2', particionador:'#/l6', impropio:'#/l7', acumulador:'#/l7'};
/** Comandantes y Soberanos que desbloquea un tema de la Ruta. */
const jefesDeTema = href => MUNDOS_JUEGO.flatMap(M => [...M.comandantes, M.soberano].filter(C => RUTA_COMANDANTES[C.id] === href).map(C => ({C, M})));
const INFO_EXTRA = {}, FORMA_DE = {};   // se une a INFO_ENEMIGO en el catálogo
/* Registra los alienígenas propios, los Comandantes y los Soberanos en el catálogo de enemigos. */
for (const [mi, M] of MUNDOS_JUEGO.entries()){
  M.comandantes.forEach((C, ci) => {
    for (const [id, name, base, fv, fvel, extra, desc] of C.enemigos){
      ENEMIGOS[id] = variante(id, base, c => ({...extra, name, vida:ENEMIGOS[base](0, {vida:1, velocidad:1}).vida * fv * c.vida, vel:ENEMIGOS[base](0, {vida:1, velocidad:1}).vel * fvel * c.velocidad, color:C.color, xp:Math.round(6 * fv)}));
      INFO_EXTRA[id] = {name, desc, mundo:M.id, grupo:'comun'}; FORMA_DE[id] = base;
      COLOR_ENEMIGO[id] = C.color;
    }
    const nivel = 1 + mi * 0.08 + ci * 0.1;                             // los jefes crecen poco: lo difícil son los cálculos
    ENEMIGOS[C.id] = variante(C.id, C.forma, c => ({jefe:true, comandante:true, name:C.name, color:C.color, vida:90 * nivel * jv(c), escala:2.1, xp:45, armas:[{...C.ataque.arma}, {tipo:'acido', rango:110, cd:3, dmg:1.5 * nivel, objetivo:'soldados'}]}));
    INFO_EXTRA[C.id] = {name:C.name, desc:`${C.ataque.nombre}: ${C.ataque.desc}`, mundo:M.id, grupo:'comandante'};
    COLOR_ENEMIGO[C.id] = C.color;
  });
  const S = M.soberano, nivel = 1.3 + mi * 0.1;
  ENEMIGOS[S.id] = variante(S.id, S.forma, c => ({jefe:true, soberano:true, name:S.name, color:S.color, vida:115 * nivel * jv(c), escala:2.8, xp:120, armas:M.comandantes.map(C => ({...C.ataque.arma, cd:C.ataque.arma.cd * 1.9}))}));
  INFO_EXTRA[S.id] = {name:S.name, desc:S.desc, mundo:M.id, grupo:'soberano'};
  COLOR_ENEMIGO[S.id] = S.color;
}
const mundoDe = id => MUNDOS_JUEGO.find(m => m.id === id);
/** Alienígenas propios que pueden aparecer en la misión `mi` (0–4) del mundo: los de los Comandantes ya enfrentados y el actual. */
function aparicionMundo(M, mi){
  return M.comandantes.slice(0, Math.min(4, mi + 1)).flatMap(C => C.enemigos.map(([id]) => [id, 0, 3]));
}
