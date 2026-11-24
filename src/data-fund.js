/* =====================================================================
   SECCIÓN FUNDAMENTOS
   Cada tema: intro (lo más básico), ejemplos (medio / difícil) y
   ejercicios "lego": en cada paso se arma la respuesta con piezas.
   Formato de respuesta (a): piezas unidas, sin espacios.
     frac{num}{den}   sqrt{radicando}   ^{exponente}
   set:true  → el orden de las soluciones separadas por coma no importa.
   ===================================================================== */
const FUND = [
{ id:'signos', t:'Suma y resta (ley de signos)', short:'Suma y resta', dict:'Aritmética',
  intro:R`
  <p><b>Lo más básico.</b> Piensa en la recta numérica: sumar un positivo es avanzar a la derecha y sumar un negativo es avanzar a la izquierda.</p>
  <ul>
   <li><b>Mismo signo:</b> se suman los valores y se conserva el signo. \(-4-9=-13\).</li>
   <li><b>Distinto signo:</b> se restan los valores y queda el signo del de mayor valor. \(-4+9=5\).</li>
   <li><b>Restar es sumar el opuesto:</b> \(a-b=a+(-b)\), y por eso \(-(-b)=+b\).</li>
   <li><b>Términos semejantes:</b> solo se juntan los que tienen la misma letra y exponente: \(3x+5x=8x\), pero \(3x+5\) no se puede juntar.</li>
  </ul>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`-7+12-(-5)`, steps:[
     [R`\(-(-5)=+5\Rightarrow -7+12+5\)`, R`Dos signos menos seguidos se vuelven más: restar un negativo es sumar.`],
     [R`\(-7+12=5\)`, R`Distinto signo: \(12-7=5\) y gana el signo del 12 (positivo).`],
     [R`\(5+5=10\)`, R`Mismo signo: se suman.`]], r:R`10`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`3-\left[4-(6-9)\right]+(-2)`, steps:[
     [R`\(6-9=-3\)`, R`Se resuelve de adentro hacia afuera: primero el paréntesis interior.`],
     [R`\(4-(-3)=4+3=7\)`, R`Restar un negativo es sumar.`],
     [R`\(3-7+(-2)=3-7-2\)`, R`\(+(-2)=-2\): más por menos da menos.`],
     [R`\(3-7=-4;\ -4-2=-6\)`, R`Se opera de izquierda a derecha.`]], r:R`-6`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`-8+3-(-6)`, steps:[
     {q:'Reescribe la expresión quitando el paréntesis.', k:['-8','+','-','3','6','(',')','8'], a:['-8+3+6'], w:R`Restar un negativo es sumar: \(-(-6)=+6\).`, h:'Dos signos menos seguidos se convierten en un más.'},
     {q:'Calcula el resultado final.', k:['1','-1','17','5','-5','+','-'], a:['1'], w:R`\(-8+3=-5\) y luego \(-5+6=1\).`, h:'Primero −8 + 3 (distinto signo), luego suma 6.'}]},
   {src:'Ejercicio de práctica', p:R`5x-3+2x+7`, steps:[
     {q:'Junta los términos que tienen x.', k:['5x','2x','7x','3x','10x','x'], a:['7x'], w:R`Son semejantes: \(5x+2x=7x\).`, h:'Suma solo los coeficientes 5 y 2.'},
     {q:'Junta los números sin letra.', k:['-3','+7','4','-4','10','+','-'], a:['4','+4'], w:R`\(-3+7=4\).`, h:'Distinto signo: resta y deja el signo del mayor.'},
     {q:'Escribe la expresión simplificada.', k:['7x','4','+','-','11x','x'], a:['7x+4','4+7x'], w:R`No se puede juntar \(7x\) con \(4\): no son semejantes.`, h:'Usa los dos resultados anteriores.'}]},
  ]},

{ id:'multdiv', t:'Multiplicación, división y jerarquía', short:'Multiplicación y división', dict:'Aritmética',
  intro:R`
  <p><b>Lo más básico.</b> Ley de signos para multiplicar y dividir: <b>signos iguales dan positivo, signos distintos dan negativo</b>. \((-3)(-4)=12\), \(-20\div5=-4\).</p>
  <p><b>Jerarquía de operaciones</b> (en este orden):</p>
  <ol><li>Paréntesis y agrupaciones.</li><li>Potencias y raíces.</li><li>Multiplicación y división, <b>de izquierda a derecha</b>.</li><li>Suma y resta, de izquierda a derecha.</li></ol>
  <p><b>Propiedad distributiva:</b> \(a(b+c)=ab+ac\). Nunca se divide entre cero.</p>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`8-2\cdot3+12\div4`, steps:[
     [R`\(2\cdot3=6\) y \(12\div4=3\)`, R`Multiplicación y división van antes que suma y resta.`],
     [R`\(8-6+3=5\)`, R`Ahora suma y resta de izquierda a derecha.`]], r:R`5`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`(-3)(-4)\div2-5(2-7)`, steps:[
     [R`\(2-7=-5\)`, R`Primero el paréntesis.`],
     [R`\((-3)(-4)=12\), luego \(12\div2=6\)`, R`Izquierda a derecha; menos por menos da más.`],
     [R`\(-5(-5)=+25\)`, R`Signos iguales: positivo.`],
     [R`\(6+25=31\)`, R`Suma final.`]], r:R`31`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`20\div4\cdot5-3`, steps:[
     {q:'Haz primero 20 ÷ 4 y reescribe la expresión.', k:['5','·','4','-','3','20','1'], a:['5·5-3'], w:'Multiplicación y división tienen la misma prioridad: se hacen de izquierda a derecha.', h:'No multipliques 4·5 primero: va de izquierda a derecha.'},
     {q:'Haz la multiplicación.', k:['25','-','3','10','22'], a:['25-3'], w:R`\(5\cdot5=25\).`, h:'5 por 5.'},
     {q:'Resultado final.', k:['22','28','-22','2'], a:['22'], w:R`\(25-3=22\).`, h:'Resta.'}]},
   {src:'Ejercicio de práctica', p:R`-3(2x-5)`, steps:[
     {q:'Multiplica −3 por 2x.', k:['-6x','6x','-5x','x'], a:['-6x'], w:'Distinto signo: negativo. 3·2 = 6.', h:'(−3)(2x)'},
     {q:'Multiplica −3 por −5.', k:['15','-15','8','-8'], a:['15','+15'], w:'Signos iguales: positivo.', h:'Menos por menos…'},
     {q:'Escribe el resultado completo.', k:['-6x','6x','+','-','15'], a:['-6x+15','15-6x'], w:R`Distributiva: \(-3(2x-5)=-6x+15\).`, h:'Une los dos productos.'}]},
  ]},

{ id:'fracciones', t:'Fracciones', short:'Fracciones', dict:'Fracciones',
  intro:R`
  <p><b>Lo más básico.</b> En \(\frac ab\), \(a\) es el numerador (partes que tomo) y \(b\) el denominador (partes en que divido). \(b\neq0\).</p>
  <ul>
   <li><b>Simplificar:</b> divide arriba y abajo por el mismo número: \(\frac{6}{8}=\frac34\).</li>
   <li><b>Sumar con igual denominador:</b> se suman numeradores: \(\frac14+\frac24=\frac34\).</li>
   <li><b>Sumar con distinto denominador:</b> busca el mínimo común múltiplo (mcm) y convierte.</li>
   <li><b>Multiplicar:</b> \(\frac ab\cdot\frac cd=\frac{ac}{bd}\).</li>
   <li><b>Dividir:</b> multiplica por el recíproco: \(\frac ab\div\frac cd=\frac ab\cdot\frac dc\).</li>
  </ul>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`\frac23+\frac54`, steps:[
     [R`mcm\((3,4)=12\)`, R`Es el menor número que es múltiplo de ambos denominadores.`],
     [R`\(\frac23=\frac{8}{12},\ \frac54=\frac{15}{12}\)`, R`Multiplicamos arriba y abajo por 4 y por 3.`],
     [R`\(\frac{8+15}{12}=\frac{23}{12}\)`, R`Mismo denominador: se suman numeradores.`]], r:R`\frac{23}{12}`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`\left(\frac34-\frac16\right)\div\frac78`, steps:[
     [R`\(\frac34-\frac16=\frac9{12}-\frac2{12}=\frac7{12}\)`, R`Paréntesis primero; mcm\((4,6)=12\).`],
     [R`\(\frac7{12}\div\frac78=\frac7{12}\cdot\frac87\)`, R`Dividir es multiplicar por el recíproco.`],
     [R`\(\frac{56}{84}=\frac23\)`, R`Simplificamos dividiendo entre 28.`]], r:R`\frac23`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`\frac12+\frac13`, steps:[
     {q:'Convierte las dos fracciones a denominador 6 (el mcm). Usa la pieza de fracción.', k:['frac','3','2','6','5','+','1'], a:['frac{3}{6}+frac{2}{6}'], w:R`\(\frac12=\frac36\) (por 3) y \(\frac13=\frac26\) (por 2).`, h:'Arrastra la pieza ▭/▭ y llena arriba y abajo.'},
     {q:'Suma las fracciones.', k:['frac','5','6','12','2'], a:['frac{5}{6}'], w:'Mismo denominador: se suman los numeradores.', h:'3 + 2 arriba, el 6 se queda.'}]},
   {src:'Ejercicio de práctica', p:R`\frac35\div\frac9{10}`, steps:[
     {q:'Cambia la división por una multiplicación por el recíproco.', k:['frac','3','5','9','10','·','÷'], a:['frac{3}{5}·frac{10}{9}'], w:'El recíproco de 9/10 es 10/9.', h:'La primera fracción no cambia; la segunda se voltea.'},
     {q:'Multiplica y simplifica al máximo.', k:['frac','2','3','30','45','27','50'], a:['frac{2}{3}'], w:R`\(\frac{30}{45}=\frac23\) (dividiendo entre 15).`, h:'3·10 = 30 y 5·9 = 45; luego simplifica.'}]},
  ]},

{ id:'potencias', t:'Potencias y raíces', short:'Potencias y raíces', dict:'Potencias y raíces',
  intro:R`
  <p><b>Lo más básico.</b> \(a^n\) es multiplicar \(a\) por sí mismo \(n\) veces: \(2^3=2\cdot2\cdot2=8\). La raíz deshace la potencia: \(\sqrt9=3\) porque \(3^2=9\).</p>
  <ul>
   <li>\(a^m\cdot a^n=a^{m+n}\) (misma base: se suman exponentes).</li>
   <li>\(\frac{a^m}{a^n}=a^{m-n}\), \((a^m)^n=a^{mn}\), \(a^0=1\), \(a^{-n}=\frac1{a^n}\).</li>
   <li>\(\sqrt{ab}=\sqrt a\sqrt b\): sirve para simplificar raíces: \(\sqrt{12}=\sqrt{4\cdot3}=2\sqrt3\).</li>
  </ul>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`(2x^3)^2\cdot x^{-4}`, steps:[
     [R`\((2x^3)^2=2^2x^6=4x^6\)`, R`La potencia afecta a cada factor; \((x^3)^2=x^{6}\).`],
     [R`\(4x^6\cdot x^{-4}=4x^{6-4}\)`, R`Misma base: se suman exponentes (\(6+(-4)\)).`]], r:R`4x^2`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`\sqrt{50}+\sqrt{18}`, steps:[
     [R`\(\sqrt{50}=\sqrt{25\cdot2}=5\sqrt2\)`, R`Buscamos el cuadrado perfecto más grande que divide a 50.`],
     [R`\(\sqrt{18}=\sqrt{9\cdot2}=3\sqrt2\)`, R`Igual con 18.`],
     [R`\(5\sqrt2+3\sqrt2=8\sqrt2\)`, R`Son "semejantes": como \(5y+3y=8y\).`]], r:R`8\sqrt2`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`\frac{x^5\cdot x^3}{x^2}`, steps:[
     {q:'Resuelve el numerador (usa la pieza de exponente).', k:['x','pot','8','15','2'], a:['x^{8}'], w:R`\(x^5x^3=x^{5+3}\).`, h:'Coloca x y después la pieza ▭ⁿ para el exponente.'},
     {q:'Ahora divide entre x².', k:['x','pot','6','4','10'], a:['x^{6}'], w:R`\(\frac{x^8}{x^2}=x^{8-2}\).`, h:'Al dividir se restan exponentes.'}]},
   {src:'Ejercicio de práctica', p:R`\sqrt{12}+\sqrt{27}`, steps:[
     {q:'Simplifica √12.', k:['2','3','4','sqrt','6'], a:['2sqrt{3}'], w:R`\(\sqrt{12}=\sqrt{4\cdot3}=2\sqrt3\).`, h:'12 = 4·3 y √4 = 2.'},
     {q:'Simplifica √27.', k:['3','9','sqrt','2'], a:['3sqrt{3}'], w:R`\(\sqrt{27}=\sqrt{9\cdot3}=3\sqrt3\).`, h:'27 = 9·3.'},
     {q:'Suma.', k:['5','6','sqrt','3','39'], a:['5sqrt{3}'], w:R`\(2\sqrt3+3\sqrt3=5\sqrt3\).`, h:'Como 2y + 3y.'}]},
  ]},

{ id:'factorizacion', t:'Factorización', short:'Factorización', dict:'Factorización',
  intro:R`
  <p><b>Lo más básico.</b> Factorizar es escribir una suma como una multiplicación. Siempre empieza por el <b>factor común</b>: \(6x+9=3(2x+3)\).</p>
  <div class="my-3 overflow-x-auto"><table><tr><th>Caso</th><th>Forma</th></tr>
  <tr><td>Factor común</td><td>\(ab+ac=a(b+c)\)</td></tr>
  <tr><td>Diferencia de cuadrados</td><td>\(a^2-b^2=(a-b)(a+b)\)</td></tr>
  <tr><td>Trinomio \(x^2+bx+c\)</td><td>dos números que <b>sumen</b> \(b\) y <b>multipliquen</b> \(c\)</td></tr>
  <tr><td>Trinomio \(ax^2+bx+c\)</td><td>números que multipliquen \(ac\) y sumen \(b\); luego agrupación</td></tr>
  <tr><td>Cubos</td><td>\(a^3\pm b^3=(a\pm b)(a^2\mp ab+b^2)\)</td></tr></table></div>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`x^2-5x+6`, steps:[
     [R`Buscamos dos números que multipliquen \(6\) y sumen \(-5\): \(-2\) y \(-3\)`, R`\((-2)(-3)=6\) y \(-2-3=-5\).`],
     [R`\(x^2-5x+6=(x-2)(x-3)\)`, R`Cada número va en un paréntesis con \(x\).`]], r:R`(x-2)(x-3)`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`6x^2+x-2`, steps:[
     [R`\(ac=6(-2)=-12\); números que multipliquen \(-12\) y sumen \(1\): \(4\) y \(-3\)`, R`Método "ac" para trinomios con \(a\ne1\).`],
     [R`\(6x^2+4x-3x-2\)`, R`Partimos el término del medio: \(x=4x-3x\).`],
     [R`\(2x(3x+2)-1(3x+2)\)`, R`Factor común en cada par (agrupación).`],
     [R`\((3x+2)(2x-1)\)`, R`Factor común \((3x+2)\).`]], r:R`(2x-1)(3x+2)`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`x^2-9`, steps:[
     {q:'Escribe 9 como un cuadrado.', k:['3','pot','2','9','x'], a:['3^{2}'], w:R`\(9=3^2\), así tenemos \(x^2-3^2\).`, h:'¿Qué número al cuadrado da 9?'},
     {q:'Factoriza como diferencia de cuadrados.', k:['(',')','x','3','-','+','9'], a:['(x-3)(x+3)','(x+3)(x-3)'], w:R`\(a^2-b^2=(a-b)(a+b)\).`, h:'Un paréntesis con −, otro con +.'}]},
   {src:'Ejercicio de práctica', p:R`x^2+7x+10`, steps:[
     {q:'Escribe dos números que multiplicados den 10 y sumados den 7, separados por coma.', k:['2','5','10','1','7',','], a:['2,5'], set:true, w:R`\(2\cdot5=10\) y \(2+5=7\).`, h:'Pares que dan 10: 1·10 o 2·5.'},
     {q:'Escribe la factorización.', k:['(',')','x','+','2','5','-'], a:['(x+2)(x+5)','(x+5)(x+2)'], w:'Cada número va con x en un paréntesis.', h:'(x + _)(x + _)'}]},
   {src:'Ejercicio de práctica', p:R`4x^2-12x`, steps:[
     {q:'¿Cuál es el factor común más grande?', k:['4x','4','x','12','2x'], a:['4x'], w:'4 divide a 4 y a 12, y x está en ambos términos.', h:'Busca número y letra comunes.'},
     {q:'Factoriza.', k:['4x','(',')','x','-','3','+','12'], a:['4x(x-3)'], w:R`\(\frac{4x^2}{4x}=x\), \(\frac{-12x}{4x}=-3\).`, h:'Divide cada término entre el factor común.'}]},
  ]},

{ id:'lineales', t:'Ecuaciones lineales', short:'Ecuaciones lineales', dict:'Ecuaciones',
  intro:R`
  <p><b>Lo más básico.</b> Una ecuación es una <b>balanza</b>: lo que hagas a un lado, hazlo al otro. Para despejar \(x\) usa la operación <b>inversa</b>: lo que suma pasa restando, lo que multiplica pasa dividiendo.</p>
  <p>\(x+5=9\Rightarrow x=9-5=4\). &nbsp; \(3x=12\Rightarrow x=\frac{12}{3}=4\).</p>
  <p><b>Receta:</b> 1) quita paréntesis y denominadores, 2) pasa las \(x\) a un lado y los números al otro, 3) divide entre el coeficiente, 4) comprueba.</p>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`3x-7=2x+5`, steps:[
     [R`\(3x-2x=5+7\)`, R`Las \(x\) a la izquierda, los números a la derecha (cambian de signo al pasar).`],
     [R`\(x=12\)`, R`Se simplifica cada lado.`],
     [R`Comprobación: \(3(12)-7=29=2(12)+5\) ✓`, R`Siempre verifica sustituyendo.`]], r:R`x=12`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`\frac{x+1}{3}-\frac{x-2}{4}=1`, steps:[
     [R`Multiplicar todo por 12: \(4(x+1)-3(x-2)=12\)`, R`12 es el mcm de 3 y 4; así desaparecen los denominadores.`],
     [R`\(4x+4-3x+6=12\)`, R`Distributiva; ojo: \(-3\cdot(-2)=+6\).`],
     [R`\(x+10=12\Rightarrow x=2\)`, R`Términos semejantes y despeje.`]], r:R`x=2`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`2x+3=11`, steps:[
     {q:'Resta 3 en ambos lados.', k:['2x','=','8','14','x','11','3','-'], a:['2x=8'], w:'El +3 pasa restando: 11 − 3 = 8.', h:'Deja 2x solo.'},
     {q:'Divide entre 2.', k:['x','=','4','16','6','2'], a:['x=4'], w:'El 2 que multiplica pasa dividiendo.', h:'8 ÷ 2'}]},
   {src:'Ejercicio de práctica', p:R`5(x-2)=3x+4`, steps:[
     {q:'Aplica la propiedad distributiva.', k:['5x','-','10','2','=','3x','+','4','x'], a:['5x-10=3x+4'], w:R`\(5\cdot x-5\cdot2\).`, h:'Multiplica 5 por cada término del paréntesis.'},
     {q:'Pasa las x a un lado y los números al otro, y simplifica.', k:['2x','8x','=','14','6','-6'], a:['2x=14'], w:R`\(5x-3x=4+10\).`, h:'−10 pasa sumando, 3x pasa restando.'},
     {q:'Despeja x.', k:['x','=','7','28','12'], a:['x=7'], w:R`\(14\div2=7\).`, h:'Divide entre 2.'}]},
  ]},

{ id:'cuadraticas', t:'Ecuaciones cuadráticas', short:'Ecuaciones cuadráticas', dict:'Ecuaciones',
  intro:R`
  <p><b>Lo más básico.</b> Tienen la forma \(ax^2+bx+c=0\). Pueden tener 2, 1 o 0 soluciones reales. Si se puede, se factoriza y se usa la <b>propiedad del producto cero</b>: si \(AB=0\) entonces \(A=0\) o \(B=0\).</p>
  <p>\(x^2=9\Rightarrow x=\pm3\).</p>
  <p><b>Fórmula general</b> (siempre funciona): \[x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}\]</p>
  <p><b>Discriminante</b> \(\Delta=b^2-4ac\): si \(\Delta>0\) dos soluciones, si \(\Delta=0\) una, si \(\Delta<0\) ninguna real.</p>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`x^2-x-12=0`, steps:[
     [R`\((x-4)(x+3)=0\)`, R`Números que multipliquen \(-12\) y sumen \(-1\): \(-4\) y \(3\).`],
     [R`\(x-4=0\) o \(x+3=0\)`, R`Producto cero.`]], r:R`x=4,\ x=-3`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`2x^2+3x-1=0`, steps:[
     [R`\(a=2,\ b=3,\ c=-1\)`, R`No se factoriza con enteros: usamos la fórmula.`],
     [R`\(\Delta=3^2-4(2)(-1)=9+8=17\)`, R`\(\Delta>0\): dos soluciones.`],
     [R`\(x=\frac{-3\pm\sqrt{17}}{4}\)`, R`Sustituir en la fórmula; \(2a=4\).`]], r:R`x=\frac{-3\pm\sqrt{17}}{4}`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`x^2-5x+6=0`, steps:[
     {q:'Factoriza el lado izquierdo.', k:['(',')','x','-','+','2','3','=','0','6'], a:['(x-2)(x-3)=0','(x-3)(x-2)=0'], w:R`\((-2)(-3)=6\) y \(-2-3=-5\).`, h:'Números que multipliquen 6 y sumen −5.'},
     {q:'Escribe las dos soluciones separadas por coma.', k:['2','3','-2','-3','x','=',','], a:['2,3'], set:true, w:'Producto cero: x − 2 = 0 o x − 3 = 0.', h:'Cada paréntesis igualado a cero.'}]},
   {src:'Ejercicio de práctica', p:R`x^2+2x-4=0`, steps:[
     {q:'Calcula el discriminante b² − 4ac.', k:['20','-12','12','4','16'], a:['20'], w:R`\(2^2-4(1)(-4)=4+16=20\).`, h:'a = 1, b = 2, c = −4.'},
     {q:'Aplica la fórmula general.', k:['x','=','frac','-2','2','±','sqrt','20','4','-4'], a:['x=frac{-2±sqrt{20}}{2}'], w:R`\(x=\frac{-b\pm\sqrt\Delta}{2a}\).`, h:'Arriba −b ± √Δ, abajo 2a.'},
     {q:'Simplifica sabiendo que √20 = 2√5.', k:['x','=','-1','±','sqrt','5','2','1'], a:['x=-1±sqrt{5}'], w:R`\(\frac{-2\pm2\sqrt5}{2}=-1\pm\sqrt5\).`, h:'Divide cada término entre 2.'}]},
  ]},

{ id:'polinomicas', t:'Ecuaciones polinómicas', short:'Ecuaciones polinómicas', dict:'Ecuaciones',
  intro:R`
  <p><b>Lo más básico.</b> Son ecuaciones de grado 3 o más. La estrategia es <b>factorizar</b> hasta tener factores de grado 1 o 2 y usar el producto cero.</p>
  <ul>
   <li>Factor común: \(x^3-4x=x(x^2-4)\).</li>
   <li>Agrupación de a dos términos.</li>
   <li><b>Raíces racionales:</b> prueba divisores del término independiente (\(\pm1,\pm2,\dots\)). Si \(P(r)=0\), entonces \((x-r)\) es factor y se divide (división sintética).</li>
  </ul>
  <p>Ejemplo básico: \(x^3=8\Rightarrow x=2\).</p>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`x^3-4x=0`, steps:[
     [R`\(x(x^2-4)=0\)`, R`Factor común \(x\).`],
     [R`\(x(x-2)(x+2)=0\)`, R`Diferencia de cuadrados.`]], r:R`x=0,\ x=2,\ x=-2`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`x^3-6x^2+11x-6=0`, steps:[
     [R`Probar \(x=1\): \(1-6+11-6=0\) ✓`, R`Divisores de 6: \(\pm1,\pm2,\pm3,\pm6\).`],
     [R`\(x^3-6x^2+11x-6=(x-1)(x^2-5x+6)\)`, R`División sintética entre \((x-1)\): coeficientes \(1,-5,6\).`],
     [R`\((x-1)(x-2)(x-3)=0\)`, R`Factorizar el trinomio.`]], r:R`x=1,\ 2,\ 3`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`x^3+x^2-4x-4=0`, steps:[
     {q:'Agrupa de a dos y saca factor común en cada par.', k:['x','pot','2','(',')','+','1','-','4','=','0'], a:['x^{2}(x+1)-4(x+1)=0'], w:R`\(x^3+x^2=x^2(x+1)\) y \(-4x-4=-4(x+1)\).`, h:'En el primer par sale x², en el segundo −4.'},
     {q:'Saca el factor común (x + 1).', k:['x','pot','2','(',')','+','1','-','4','=','0'], a:['(x+1)(x^{2}-4)=0','(x^{2}-4)(x+1)=0'], w:'Ahora (x + 1) se repite en ambos términos.', h:'(x + 1)(… − …)'},
     {q:'Escribe todas las soluciones separadas por coma.', k:['-1','1','2','-2','4',','], a:['-1,2,-2'], set:true, w:R`\(x+1=0\) y \(x^2-4=0\Rightarrow x=\pm2\).`, h:'Son tres.'}]},
   {src:'Ejercicio de práctica', p:R`x^3-9x=0`, steps:[
     {q:'Saca factor común.', k:['x','(',')','pot','2','-','9','=','0','3'], a:['x(x^{2}-9)=0'], w:'x está en los dos términos.', h:'x(…)'},
     {q:'Escribe todas las soluciones separadas por coma.', k:['0','3','-3','9',','], a:['0,3,-3'], set:true, w:R`\(x=0\) o \(x^2=9\Rightarrow x=\pm3\).`, h:'No olvides el cero.'}]},
  ]},

{ id:'racionales', t:'Ecuaciones racionales', short:'Ecuaciones racionales', dict:'Ecuaciones',
  intro:R`
  <p><b>Lo más básico.</b> La incógnita está en un denominador. Pasos:</p>
  <ol><li>Anota las <b>restricciones</b>: ningún denominador puede ser cero.</li><li>Multiplica toda la ecuación por el mcm de los denominadores.</li><li>Resuelve la ecuación que queda.</li><li>Descarta las soluciones que violen las restricciones.</li></ol>
  <p>\(\frac6x=2\Rightarrow 6=2x\Rightarrow x=3\) (y \(3\ne0\) ✓).</p>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`\frac{3}{x-2}=\frac{5}{x+2}`, steps:[
     [R`Restricciones: \(x\ne2,\ x\ne-2\)`, R`Esos valores anulan un denominador.`],
     [R`\(3(x+2)=5(x-2)\)`, R`Multiplicar en cruz (mcm \((x-2)(x+2)\)).`],
     [R`\(3x+6=5x-10\Rightarrow16=2x\Rightarrow x=8\)`, R`Ecuación lineal. 8 no está prohibido ✓.`]], r:R`x=8`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`\frac{x}{x-1}-\frac{2}{x+1}=\frac{4}{x^2-1}`, steps:[
     [R`\(x^2-1=(x-1)(x+1)\); restricciones \(x\ne\pm1\)`, R`Factorizar muestra el mcm.`],
     [R`\(x(x+1)-2(x-1)=4\)`, R`Multiplicar todo por \((x-1)(x+1)\).`],
     [R`\(x^2-x-2=0\Rightarrow(x-2)(x+1)=0\)`, R`\(x^2+x-2x+2-4=x^2-x-2\).`],
     [R`\(x=2\) ✓, \(x=-1\) ✗`, R`\(-1\) anula un denominador: es una solución <b>extraña</b>.`]], r:R`x=2`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`\frac2x+1=\frac5x`, steps:[
     {q:'Escribe la restricción.', k:['x','≠','=','0','1','5'], a:['x≠0'], w:'x está en el denominador.', h:'¿Qué valor anula el denominador?'},
     {q:'Multiplica toda la ecuación por x.', k:['2','x','+','=','5','2x','1'], a:['2+x=5','x+2=5'], w:R`\(\frac2x\cdot x=2\), \(1\cdot x=x\), \(\frac5x\cdot x=5\).`, h:'Cada término por x.'},
     {q:'Despeja x.', k:['x','=','3','7','-3'], a:['x=3'], w:'3 ≠ 0, así que es válida.', h:'Resta 2.'}]},
   {src:'Ejercicio de práctica', p:R`\frac{4}{x+1}=2`, steps:[
     {q:'Multiplica ambos lados por (x + 1).', k:['4','=','2','(',')','x','+','1','2x'], a:['4=2(x+1)','4=2x+2'], w:'Así el denominador desaparece.', h:'El 2 queda multiplicando a (x + 1).'},
     {q:'Despeja x.', k:['x','=','1','2','3','-1'], a:['x=1'], w:R`\(4=2x+2\Rightarrow2x=2\). Además \(1\ne-1\) ✓.`, h:'Distribuye y despeja.'}]},
  ]},

{ id:'radicales', t:'Ecuaciones con radicales', short:'Ecuaciones radicales', dict:'Ecuaciones',
  intro:R`
  <p><b>Lo más básico.</b> 1) <b>Aísla</b> la raíz, 2) <b>eleva al cuadrado</b> ambos lados, 3) resuelve, 4) <b>comprueba siempre</b>: elevar al cuadrado puede crear soluciones falsas (extrañas).</p>
  <p>\(\sqrt x=4\Rightarrow x=16\).</p>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`\sqrt{x+3}=5`, steps:[
     [R`\(x+3=25\)`, R`Elevar al cuadrado elimina la raíz.`],
     [R`\(x=22\); comprobación: \(\sqrt{25}=5\) ✓`, R`Despejar y verificar.`]], r:R`x=22`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`\sqrt{2x+3}=x`, steps:[
     [R`\(2x+3=x^2\)`, R`Elevar al cuadrado.`],
     [R`\(x^2-2x-3=0\Rightarrow(x-3)(x+1)=0\)`, R`Cuadrática; factorizar.`],
     [R`\(x=3\): \(\sqrt9=3\) ✓. \(x=-1\): \(\sqrt1=1\ne-1\) ✗`, R`La raíz nunca da negativo: \(-1\) es extraña.`]], r:R`x=3`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`\sqrt{x-1}=3`, steps:[
     {q:'Eleva ambos lados al cuadrado.', k:['x','-','1','=','9','3','6'], a:['x-1=9'], w:R`\((\sqrt{x-1})^2=x-1\) y \(3^2=9\).`, h:'La raíz desaparece.'},
     {q:'Despeja x.', k:['x','=','10','8','4'], a:['x=10'], w:R`Comprobación: \(\sqrt{9}=3\) ✓.`, h:'Suma 1.'}]},
   {src:'Ejercicio de práctica', p:R`\sqrt x+2=6`, steps:[
     {q:'Aísla la raíz.', k:['sqrt','x','=','4','8','2','+'], a:['sqrt{x}=4'], w:'El +2 pasa restando.', h:'Primero deja la raíz sola.'},
     {q:'Eleva al cuadrado y escribe x.', k:['x','=','16','4','8','2'], a:['x=16'], w:R`\(4^2=16\); comprobación \(\sqrt{16}+2=6\) ✓.`, h:'4 al cuadrado.'}]},
  ]},

{ id:'exponenciales', t:'Ecuaciones exponenciales', short:'Ecuaciones exponenciales', dict:'Exponenciales y logaritmos',
  intro:R`
  <p><b>Lo más básico.</b> La incógnita está en el exponente. Dos caminos:</p>
  <ul><li><b>Igualar bases:</b> si \(a^m=a^n\) entonces \(m=n\). \(2^x=8=2^3\Rightarrow x=3\).</li>
  <li><b>Aplicar logaritmo</b> a ambos lados cuando no se puede igualar la base: \(5^x=12\Rightarrow x=\frac{\ln12}{\ln5}\).</li></ul>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`2^{x+1}=32`, steps:[
     [R`\(2^{x+1}=2^5\)`, R`\(32=2^5\).`],
     [R`\(x+1=5\Rightarrow x=4\)`, R`Bases iguales ⇒ exponentes iguales.`]], r:R`x=4`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`3^{2x}-4\cdot3^x+3=0`, steps:[
     [R`Sea \(u=3^x\); entonces \(3^{2x}=u^2\)`, R`\(3^{2x}=(3^x)^2\): cambio de variable.`],
     [R`\(u^2-4u+3=0\Rightarrow(u-1)(u-3)=0\)`, R`Cuadrática en \(u\).`],
     [R`\(3^x=1\Rightarrow x=0\); \(3^x=3\Rightarrow x=1\)`, R`Regresar a \(x\).`]], r:R`x=0,\ x=1`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`3^x=81`, steps:[
     {q:'Escribe 81 como potencia de 3.', k:['3','pot','x','4','=','9','81','2'], a:['3^{x}=3^{4}'], w:R`\(81=3^4\).`, h:'3·3·3·3'},
     {q:'Iguala los exponentes.', k:['x','=','4','27','3'], a:['x=4'], w:'Misma base ⇒ mismo exponente.', h:'Compara exponentes.'}]},
   {src:'Ejercicio de práctica', p:R`e^{2x}=7`, steps:[
     {q:'Aplica ln a ambos lados.', k:['2x','=','ln','7','(',')','x','e'], a:['2x=ln7','2x=ln(7)'], w:R`\(\ln(e^{2x})=2x\).`, h:'ln y e se cancelan.'},
     {q:'Despeja x.', k:['x','=','frac','ln','7','2','(',')'], a:['x=frac{ln7}{2}','x=frac{ln(7)}{2}'], w:'Divide entre 2.', h:'Usa la pieza de fracción.'}]},
  ]},

{ id:'logaritmicas', t:'Ecuaciones logarítmicas', short:'Ecuaciones logarítmicas', dict:'Exponenciales y logaritmos',
  intro:R`
  <p><b>Lo más básico.</b> \(\log_b x=y\) significa \(b^y=x\). Ejemplo: \(\log_2 8=3\) porque \(2^3=8\).</p>
  <ul><li>Junta logaritmos con las propiedades (producto, cociente, potencia).</li>
  <li>Pasa a forma exponencial, o usa \(\log_b A=\log_b B\Rightarrow A=B\).</li>
  <li><b>Dominio:</b> solo existen logaritmos de números positivos. Comprueba.</li></ul>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`\log_2x=5`, steps:[
     [R`\(x=2^5\)`, R`Definición de logaritmo.`]], r:R`x=32`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`\log x+\log(x-3)=1`, steps:[
     [R`\(\log\big(x(x-3)\big)=1\)`, R`Suma de logaritmos = logaritmo del producto.`],
     [R`\(x(x-3)=10^1\Rightarrow x^2-3x-10=0\)`, R`\(\log\) sin base es base 10.`],
     [R`\((x-5)(x+2)=0\)`, R`Factorizar.`],
     [R`\(x=5\) ✓; \(x=-2\) ✗`, R`\(\log(-2)\) no existe.`]], r:R`x=5`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`\log_3x=2`, steps:[
     {q:'Pasa a forma exponencial.', k:['x','=','3','2','pot','log_3'], a:['x=3^{2}'], w:R`\(\log_b x=y\iff x=b^y\).`, h:'La base 3 se eleva al 2.'},
     {q:'Calcula x.', k:['x','=','9','6','8'], a:['x=9'], w:R`\(3^2=9\).`, h:'3·3'}]},
   {src:'Ejercicio de práctica', p:R`\ln x+\ln2=\ln10`, steps:[
     {q:'Junta el lado izquierdo en un solo logaritmo.', k:['ln','(',')','2x','=','10','x','2','+'], a:['ln(2x)=ln(10)','ln(2x)=ln10'], w:R`\(\ln a+\ln b=\ln(ab)\).`, h:'Suma de ln = ln del producto.'},
     {q:'Iguala los argumentos.', k:['2x','=','10','x','5'], a:['2x=10'], w:R`\(\ln A=\ln B\Rightarrow A=B\).`, h:'Quita los ln.'},
     {q:'Despeja x.', k:['x','=','5','20','8'], a:['x=5'], w:'5 > 0, está en el dominio ✓.', h:'Divide entre 2.'}]},
  ]},

{ id:'trigonometricas', t:'Ecuaciones trigonométricas', short:'Ecuaciones trigonométricas', dict:'Trigonometría',
  intro:R`
  <p><b>Lo más básico.</b> Aísla la función (\(\sin x\), \(\cos x\)…), encuentra el <b>ángulo de referencia</b> con los valores notables y luego todos los ángulos del intervalo \([0,2\pi)\) que cumplen, según el signo en cada cuadrante.</p>
  <div class="my-3 overflow-x-auto"><table><tr><th>\(x\)</th><th>\(0\)</th><th>\(\frac\pi6\)</th><th>\(\frac\pi4\)</th><th>\(\frac\pi3\)</th><th>\(\frac\pi2\)</th></tr>
  <tr><td>\(\sin x\)</td><td>0</td><td>\(\frac12\)</td><td>\(\frac{\sqrt2}2\)</td><td>\(\frac{\sqrt3}2\)</td><td>1</td></tr>
  <tr><td>\(\cos x\)</td><td>1</td><td>\(\frac{\sqrt3}2\)</td><td>\(\frac{\sqrt2}2\)</td><td>\(\frac12\)</td><td>0</td></tr>
  <tr><td>\(\tan x\)</td><td>0</td><td>\(\frac{\sqrt3}3\)</td><td>1</td><td>\(\sqrt3\)</td><td>—</td></tr></table></div>
  <p><b>Signos por cuadrante:</b> I todas +, II seno +, III tangente +, IV coseno +.</p>
  <p>Ejemplo básico: \(\sin x=1\Rightarrow x=\frac\pi2\).</p>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`2\sin x-1=0,\quad x\in[0,2\pi)`, steps:[
     [R`\(\sin x=\frac12\)`, R`Aislar el seno.`],
     [R`Referencia \(\frac\pi6\); seno positivo en I y II`, R`Tabla de valores notables.`],
     [R`\(x=\frac\pi6,\ x=\pi-\frac\pi6=\frac{5\pi}6\)`, R`En el cuadrante II el ángulo es \(\pi-\text{ref}\).`]], r:R`x=\frac\pi6,\ \frac{5\pi}6`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`2\cos^2x-\cos x-1=0,\quad x\in[0,2\pi)`, steps:[
     [R`\((2\cos x+1)(\cos x-1)=0\)`, R`Es una cuadrática en \(u=\cos x\): \(2u^2-u-1=(2u+1)(u-1)\).`],
     [R`\(\cos x=-\frac12\Rightarrow x=\frac{2\pi}3,\frac{4\pi}3\)`, R`Referencia \(\frac\pi3\); coseno negativo en II y III.`],
     [R`\(\cos x=1\Rightarrow x=0\)`, R`Valor notable.`]], r:R`x=0,\ \frac{2\pi}3,\ \frac{4\pi}3`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`2\cos x=\sqrt3,\quad x\in[0,2\pi)`, steps:[
     {q:'Despeja cos x.', k:['cos','x','=','frac','sqrt','3','2'], a:['cos(x)=frac{sqrt{3}}{2}'], w:'Divide entre 2.', h:'cos x = (…)/2'},
     {q:'Escribe todas las soluciones en [0, 2π), separadas por coma.', k:['frac','π','11π','5π','6','3',','], a:['frac{π}{6},frac{11π}{6}'], set:true, w:R`Referencia \(\frac\pi6\); coseno positivo en I y IV: \(2\pi-\frac\pi6=\frac{11\pi}6\).`, h:'Coseno positivo: cuadrantes I y IV.'}]},
   {src:'Ejercicio de práctica', p:R`\tan x=1,\quad x\in[0,2\pi)`, steps:[
     {q:'Primera solución (cuadrante I).', k:['x','=','frac','π','4','3','2'], a:['x=frac{π}{4}'], w:R`\(\tan\frac\pi4=1\).`, h:'Tabla de valores notables.'},
     {q:'Todas las soluciones en [0, 2π), separadas por coma.', k:['frac','π','5π','3π','4',','], a:['frac{π}{4},frac{5π}{4}'], set:true, w:R`La tangente se repite cada \(\pi\): \(\frac\pi4+\pi=\frac{5\pi}4\).`, h:'Tangente positiva en I y III.'}]},
  ]},

{ id:'inecuaciones', t:'Inecuaciones', short:'Inecuaciones', dict:'Desigualdades',
  intro:R`
  <p><b>Lo más básico.</b> Se resuelven como ecuaciones, con una regla extra: <b>si multiplicas o divides por un número negativo, la desigualdad se invierte</b>. La solución es un intervalo.</p>
  <p>\(x+3<5\Rightarrow x<2\Rightarrow(-\infty,2)\). &nbsp; \(-2x<6\Rightarrow x>-3\).</p>
  <p><b>Intervalos:</b> paréntesis \(( )\) si el extremo no se incluye (\(<,>\), o \(\infty\)); corchete \([ ]\) si se incluye (\(\le,\ge\)).</p>
  <p><b>Cuadráticas:</b> factoriza, marca las raíces en la recta y revisa el signo en cada tramo.</p>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`-3x+5\le11`, steps:[
     [R`\(-3x\le6\)`, R`Restar 5.`],
     [R`\(x\ge-2\)`, R`Dividir entre \(-3\): <b>se invierte</b> el signo.`]], r:R`[-2,\infty)`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`x^2-x-6<0`, steps:[
     [R`\((x-3)(x+2)<0\)`, R`Factorizar.`],
     [R`Raíces \(-2\) y \(3\) dividen la recta en 3 tramos`, R`Ahí el producto puede cambiar de signo.`],
     [R`Prueba \(x=0\): \((-3)(2)=-6<0\) ✓; fuera de \((-2,3)\) es positivo`, R`Un punto de prueba por tramo.`]], r:R`(-2,3)`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`2x-4>6`, steps:[
     {q:'Suma 4 en ambos lados.', k:['2x','>','<','10','2','x'], a:['2x>10'], w:'Sumar no cambia el sentido.', h:'−4 pasa sumando.'},
     {q:'Divide entre 2.', k:['x','>','<','5','20'], a:['x>5'], w:'2 es positivo: el sentido se mantiene.', h:'10 ÷ 2'},
     {q:'Escribe la solución como intervalo.', k:['(',')','[',']','5','∞','-∞',','], a:['(5,∞)'], w:'5 no se incluye (>) e ∞ siempre va con paréntesis.', h:'(inicio, fin)'}]},
   {src:'Ejercicio de práctica', p:R`-2x+1\ge7`, steps:[
     {q:'Resta 1 en ambos lados.', k:['-2x','2x','≥','≤','6','8'], a:['-2x≥6'], w:'Restar no cambia el sentido.', h:'7 − 1'},
     {q:'Divide entre −2 (¡cuidado!).', k:['x','≥','≤','-3','3'], a:['x≤-3'], w:'Dividir por un negativo invierte la desigualdad.', h:'El signo se voltea.'},
     {q:'Escribe la solución como intervalo.', k:['(',')','[',']','-3','∞','-∞',','], a:['(-∞,-3]'], w:'−3 sí se incluye (≤): corchete.', h:'Desde −∞ hasta −3.'}]},
  ]},
];
