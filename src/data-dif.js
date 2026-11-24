/* =====================================================================
   SECCIÓN CÁLCULO DIFERENCIAL
   Igual que Fundamentos. En los ejercicios con piezas se acepta cualquier
   forma equivalente (se evalúa en varios puntos), salvo los pasos con
   exact:true, donde se pide una forma concreta (p. ej. «factoriza»).
   ===================================================================== */
const DIF = [
{ id:'limites', t:'Límites: idea y sustitución directa', short:'Límites', dict:'Límites',
  intro:R`
  <p><b>Lo más básico.</b> \(\displaystyle\lim_{x\to a}f(x)=L\) significa que, cuando \(x\) se acerca a \(a\) (sin llegar), \(f(x)\) se acerca a \(L\).</p>
  <p>Si \(f\) es un polinomio, una raíz o una fracción cuyo denominador no se anula en \(a\), basta <b>sustituir</b>: \(\displaystyle\lim_{x\to2}(x+5)=7\).</p>
  <p><b>Propiedades:</b> el límite de una suma, producto o cociente es la suma, producto o cociente de los límites (si existen y el denominador no es 0).</p>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`\lim_{x\to2}\left(3x^2-x+1\right)`, steps:[
     [R`\(3(2)^2-2+1\)`, R`Es un polinomio: es continuo, se sustituye \(x=2\).`],
     [R`\(12-2+1=11\)`, R`Jerarquía: primero la potencia.`]], r:R`11`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`\lim_{x\to1}\frac{x^2+3}{2x+1}`, steps:[
     [R`Denominador en \(x=1\): \(2(1)+1=3\ne0\)`, R`Antes de sustituir en una fracción, revisa que el denominador no sea 0.`],
     [R`\(\frac{1+3}{3}=\frac43\)`, R`Límite de un cociente = cociente de los límites.`]], r:R`\frac43`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`\lim_{x\to3}\left(2x^2-5x\right)`, steps:[
     {q:'Primero escribe la fórmula: usa la pieza ƒ lím (variable, hacia dónde tiende y la expresión).', k:['lim','x','3','2','pot','-','5','+'], a:['lim_{x→3}(2x^{2}-5x)'], w:'Escribir el límite completo deja claro qué variable se mueve y hacia dónde.', h:'En el primer espacio x, en el segundo 3 y dentro del paréntesis 2x² − 5x (usa la pieza de potencia).'},
     {q:'Reemplaza: arrastra el 3 encima de cada x de tu fórmula.', copia:true, reemplazar:'3', valor:3, k:['3','2','5'], a:['lim_{x→3}(2(3)^{2}-5(3))'], w:'Es un polinomio: es continuo, así que el límite se obtiene sustituyendo x = 3.', h:'Hay dos x: una dentro de la potencia y otra en 5x.'},
     {q:'Calcula el valor del límite.', k:['3','33','15','18'], a:['3'], w:R`\(2(9)-15=18-15=3\).`, h:'Primero la potencia: 3² = 9.'}]},
   {src:'Ejercicio de práctica', p:R`\lim_{x\to2}\left(x^3+2x+5\right)`, steps:[
     {q:'Escribe la fórmula del límite.', k:['lim','x','2','3','pot','+','5'], a:['lim_{x→2}(x^{3}+2x+5)'], w:'Primero se plantea el límite completo.', h:'lím, x → 2 y adentro x³ + 2x + 5.'},
     {q:'Reemplaza: arrastra el 2 sobre cada x.', copia:true, reemplazar:'2', valor:17, k:['2','3','5'], a:['lim_{x→2}((2)^{3}+2(2)+5)'], w:'Polinomio → sustitución directa.', h:'Dos x: en la potencia y en 2x.'},
     {q:'Calcula el límite.', k:['17','13','9','8'], a:['17'], w:R`\(8+4+5=17\).`, h:'2³ = 8.'}]},
   {src:'Ejercicio de práctica', p:R`\lim_{x\to1}\frac{x^2+3}{2x+1}`, steps:[
     {q:'Escribe la fórmula del límite (la fracción va dentro del paréntesis).', k:['lim','x','1','frac','pot','2','3','+'], a:['lim_{x→1}(frac{x^{2}+3}{2x+1})'], w:'La expresión completa va dentro del límite.', h:'Pon la pieza de fracción en el espacio de la expresión.'},
     {q:'Reemplaza: arrastra el 1 sobre cada x.', copia:true, reemplazar:'1', valor:4/3, k:['1','2','3'], a:['lim_{x→1}(frac{(1)^{2}+3}{2(1)+1})'], w:R`El denominador vale \(2(1)+1=3\ne0\), así que se puede sustituir.`, h:'Una x arriba y otra abajo.'},
     {q:'Calcula el límite.', k:['frac','4','3','1','2'], a:['frac{4}{3}'], w:R`\(\frac{1+3}{3}=\frac43\).`, h:'Arriba 1 + 3, abajo 3.'}]},
  ]},

{ id:'indeterminadas', t:'Límites indeterminados 0/0', short:'Límites 0/0', dict:'Límites',
  intro:R`
  <p><b>Lo más básico.</b> Si al sustituir obtienes \(\frac00\), el límite <b>no</b> es 0 ni "no existe": es una <b>indeterminación</b>. Hay que transformar la expresión.</p>
  <ul><li><b>Factorizar y cancelar</b> el factor que se anula.</li><li><b>Racionalizar</b> (multiplicar por el conjugado) cuando hay raíces.</li></ul>
  <p>Se puede cancelar porque en el límite \(x\ne a\).</p>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`\lim_{x\to3}\frac{x^2-9}{x-3}`, steps:[
     [R`Sustituir da \(\frac{0}{0}\)`, R`Indeterminación: hay que trabajar la expresión.`],
     [R`\(\frac{(x-3)(x+3)}{x-3}=x+3\)`, R`Diferencia de cuadrados y se cancela \(x-3\).`],
     [R`\(\lim_{x\to3}(x+3)=6\)`, R`Ahora sí se sustituye.`]], r:R`6`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`\lim_{x\to0}\frac{\sqrt{x+4}-2}{x}`, steps:[
     [R`Multiplicar por \(\frac{\sqrt{x+4}+2}{\sqrt{x+4}+2}\)`, R`Conjugado: elimina la raíz del numerador.`],
     [R`\(\frac{(x+4)-4}{x(\sqrt{x+4}+2)}=\frac{1}{\sqrt{x+4}+2}\)`, R`\((a-b)(a+b)=a^2-b^2\); se cancela \(x\).`],
     [R`\(\frac{1}{2+2}=\frac14\)`, R`Sustituir \(x=0\).`]], r:R`\frac14`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`\lim_{x\to2}\frac{x^2-4}{x-2}`, steps:[
     {q:'Factoriza el numerador.', k:['(',')','x','-','+','2','4'], a:['(x-2)(x+2)','(x+2)(x-2)'], exact:true, w:'Diferencia de cuadrados.', h:'a² − b² = (a − b)(a + b)'},
     {q:'Cancela el factor común y escribe lo que queda.', k:['x','+','-','2','4'], a:['x+2'], w:'Se cancela (x − 2) arriba y abajo.', h:'Lo que sobra del numerador.'},
     {q:'Calcula el límite.', k:['4','0','2','8'], a:['4'], w:R`\(2+2=4\).`, h:'Sustituye x = 2.'}]},
   {src:'Ejercicio de práctica', p:R`\lim_{x\to1}\frac{x^2+x-2}{x-1}`, steps:[
     {q:'Factoriza el numerador.', k:['(',')','x','-','+','1','2'], a:['(x-1)(x+2)','(x+2)(x-1)'], exact:true, w:'Números que multiplican −2 y suman 1: 2 y −1.', h:'x² + x − 2 = (x − 1)(x + …)'},
     {q:'Calcula el límite.', k:['3','1','0','2'], a:['3'], w:R`Queda \(x+2\to3\).`, h:'Cancela y sustituye.'}]},
  ]},

{ id:'infinito', t:'Límites al infinito', short:'Límites al infinito', dict:'Límites',
  intro:R`
  <p><b>Lo más básico.</b> \(\lim_{x\to\infty}\frac1x=0\): un número dividido por algo enorme se hace muy pequeño.</p>
  <p><b>Fracciones de polinomios:</b> divide arriba y abajo por la mayor potencia de \(x\) del denominador. Atajo según los grados:</p>
  <ul><li>Grado arriba &lt; grado abajo → límite \(0\).</li><li>Grados iguales → cociente de los coeficientes principales.</li><li>Grado arriba &gt; grado abajo → \(\pm\infty\).</li></ul>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`\lim_{x\to\infty}\frac{3x^2+1}{x^2-5}`, steps:[
     [R`\(\frac{3+\frac1{x^2}}{1-\frac5{x^2}}\)`, R`Dividimos todo entre \(x^2\).`],
     [R`\(\frac{3+0}{1-0}=3\)`, R`\(\frac{c}{x^2}\to0\).`]], r:R`3`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`\lim_{x\to\infty}\frac{2x+1}{x^2+3}`, steps:[
     [R`\(\frac{\frac2x+\frac1{x^2}}{1+\frac3{x^2}}\)`, R`Dividimos entre \(x^2\), la mayor potencia del denominador.`],
     [R`\(\frac{0+0}{1+0}=0\)`, R`Grado de arriba (1) menor que el de abajo (2).`]], r:R`0`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`\lim_{x\to\infty}\frac{4x^2-x}{2x^2+3}`, steps:[
     {q:'Escribe el grado del numerador y el del denominador, separados por coma.', k:['1','2','3','4',','], a:['2,2'], set:true, w:'Ambos tienen x² como mayor potencia.', h:'Mira el exponente más alto.'},
     {q:'Calcula el límite.', k:['frac','4','2','0','1','∞'], a:['2'], w:R`Grados iguales: \(\frac42=2\).`, h:'Cociente de coeficientes principales.'}]},
   {src:'Ejercicio de práctica', p:R`\lim_{x\to\infty}\frac{5x+2}{x^2-1}`, steps:[
     {q:'Grado del numerador y del denominador, separados por coma.', k:['1','2','3','5',','], a:['1,2'], set:true, w:'5x es grado 1; x² es grado 2.', h:'Exponentes más altos.'},
     {q:'Calcula el límite.', k:['0','5','1','∞'], a:['0'], w:'Grado de arriba menor: el límite es 0.', h:'Abajo crece más rápido.'}]},
  ]},

{ id:'continuidad', t:'Continuidad', short:'Continuidad', dict:'Límites',
  intro:R`
  <p><b>Lo más básico.</b> \(f\) es continua en \(a\) si se puede dibujar sin levantar el lápiz. Formalmente, se cumplen <b>las tres</b>:</p>
  <ol><li>\(f(a)\) existe.</li><li>\(\lim_{x\to a}f(x)\) existe (los límites laterales son iguales).</li><li>\(\lim_{x\to a}f(x)=f(a)\).</li></ol>
  <p>En funciones por partes, se revisa el punto donde cambia la fórmula.</p>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`f(x)=\begin{cases}x+1 & x<2\\ 3 & x\ge2\end{cases}\ \ \text{¿continua en } x=2?`, steps:[
     [R`Izquierda: \(\lim_{x\to2^-}(x+1)=3\); derecha: \(3\)`, R`Se calculan los dos límites laterales.`],
     [R`\(f(2)=3\) y ambos límites valen 3`, R`Se cumplen las tres condiciones.`]], r:R`\text{Sí es continua}`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`f(x)=\begin{cases}kx+1 & x<2\\ x^2-k & x\ge2\end{cases}\ \ \text{halla } k`, steps:[
     [R`\(2k+1=4-k\)`, R`Igualamos los límites laterales en \(x=2\).`],
     [R`\(3k=3\Rightarrow k=1\)`, R`Ecuación lineal.`]], r:R`k=1`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`f(x)=\begin{cases}2x+a & x<1\\ 5 & x\ge1\end{cases}`, steps:[
     {q:'Iguala los límites laterales en x = 1.', k:['2','+','a','=','5','1','x'], a:['2+a=5','a+2=5','5=2+a'], exact:true, w:R`Izquierda: \(2(1)+a\); derecha: 5.`, h:'Sustituye x = 1 en 2x + a.'},
     {q:'Despeja a.', k:['a','=','3','7','5'], a:['a=3'], exact:true, w:'a = 5 − 2.', h:'Resta 2.'}]},
   {src:'Ejercicio de práctica', p:R`f(x)=\begin{cases}x^2 & x<3\\ kx & x\ge3\end{cases}`, steps:[
     {q:'Iguala los límites laterales en x = 3.', k:['9','=','3k','k','3','6'], a:['9=3k','3k=9'], exact:true, w:R`\(3^2=9\) y \(k\cdot3\).`, h:'Sustituye x = 3 en ambas.'},
     {q:'Despeja k.', k:['k','=','3','6','9'], a:['k=3'], exact:true, w:'9 ÷ 3.', h:'Divide.'}]},
  ]},

{ id:'definicion', t:'Definición de derivada', short:'Definición de derivada', dict:'Derivadas',
  intro:R`
  <p><b>Lo más básico.</b> La derivada es la <b>pendiente de la recta tangente</b> o la <b>razón de cambio instantánea</b>:</p>
  \[f'(x)=\lim_{h\to0}\frac{f(x+h)-f(x)}{h}\]
  <p><b>Receta:</b> 1) calcula \(f(x+h)\), 2) resta \(f(x)\), 3) divide entre \(h\) (se cancela), 4) haz \(h\to0\).</p>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`f(x)=x^2`, steps:[
     [R`\(f(x+h)-f(x)=x^2+2xh+h^2-x^2=2xh+h^2\)`, R`Desarrollar \((x+h)^2\).`],
     [R`\(\frac{2xh+h^2}{h}=2x+h\)`, R`Factor común \(h\) y se cancela.`],
     [R`\(\lim_{h\to0}(2x+h)=2x\)`, R`Ahora sí \(h=0\).`]], r:R`f'(x)=2x`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`f(x)=\frac1x`, steps:[
     [R`\(\frac1{x+h}-\frac1x=\frac{x-(x+h)}{x(x+h)}=\frac{-h}{x(x+h)}\)`, R`Restar fracciones con mcm \(x(x+h)\).`],
     [R`\(\frac{-h}{x(x+h)}\cdot\frac1h=\frac{-1}{x(x+h)}\)`, R`Dividir entre \(h\).`],
     [R`\(\lim_{h\to0}\frac{-1}{x(x+h)}=-\frac1{x^2}\)`, R`Sustituir \(h=0\).`]], r:R`f'(x)=-\frac1{x^2}`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`f(x)=3x^2`, steps:[
     {q:'Escribe f(x + h) − f(x) ya simplificado.', k:['6x','h','3','pot','2','+','x','6'], a:['6xh+3h^{2}','3h^{2}+6xh'], exact:true, w:R`\(3(x+h)^2-3x^2=6xh+3h^2\).`, h:'(x + h)² = x² + 2xh + h²'},
     {q:'Divide entre h.', k:['6x','+','3','h','x'], a:['6x+3h','3h+6x'], exact:true, w:'Cada término pierde una h.', h:'6xh ÷ h = 6x'},
     {q:'Haz h → 0: f′(x) =', k:['6x','3h','3','x'], a:['6x'], w:'El término con h desaparece.', h:'h = 0'}]},
   {src:'Ejercicio de práctica', p:R`f(x)=5x-2`, steps:[
     {q:'Escribe f(x + h) − f(x).', k:['5','h','x','-','2'], a:['5h'], exact:true, w:R`\(5(x+h)-2-(5x-2)=5h\).`, h:'Casi todo se cancela.'},
     {q:'Divide entre h y toma el límite: f′(x) =', k:['5','0','x','h'], a:['5'], w:'Una recta tiene pendiente constante.', h:'5h ÷ h'}]},
  ]},

{ id:'reglas', t:'Reglas básicas de derivación', short:'Reglas básicas', dict:'Derivadas',
  intro:R`
  <p><b>Lo más básico.</b> No hace falta usar el límite cada vez: hay reglas.</p>
  <ul><li><b>Constante:</b> \((c)'=0\).</li><li><b>Potencia:</b> \((x^n)'=nx^{n-1}\): el exponente baja multiplicando y se le resta 1.</li>
  <li><b>Constante por función:</b> \((cf)'=cf'\).</li><li><b>Suma:</b> \((f\pm g)'=f'\pm g'\): se deriva término a término.</li></ul>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`\frac{d}{dx}\left(4x^3-5x+7\right)`, steps:[
     [R`\((4x^3)'=12x^2\)`, R`Potencia: \(4\cdot3x^{2}\).`],
     [R`\((-5x)'=-5\), \((7)'=0\)`, R`\(x'=1\) y la constante se anula.`]], r:R`12x^2-5`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`\frac{d}{dx}\left(\sqrt x+\frac{3}{x^2}\right)`, steps:[
     [R`\(x^{1/2}+3x^{-2}\)`, R`Reescribir como potencias (ver <a href="#/f/potencias">potencias</a>).`],
     [R`\(\frac12x^{-1/2}-6x^{-3}\)`, R`Regla de la potencia en cada término.`],
     [R`\(\frac{1}{2\sqrt x}-\frac{6}{x^3}\)`, R`Volver a raíces y fracciones.`]], r:R`\frac{1}{2\sqrt x}-\frac{6}{x^3}`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`\frac{d}{dx}\left(4x^3-2x\right)`, steps:[
     {q:'Escribe primero lo que se pide con la ficha ƒ d/d□[□]: la variable x y, dentro de los corchetes, la función.', k:['der','x','4','pot','3','-','2'], a:['deriv{x}{4x^{3}-2x}','deriv{x}{-2x+4x^{3}}'], exact:true, w:'Plantear la derivada deja claro qué función se deriva y respecto a qué variable.', h:'En el espacio pequeño x; entre corchetes 4x³ − 2x.'},
     {q:'Resuelve la derivada.', k:['12','x','pot','2','-','6','3'], a:['12x^{2}-2'], w:R`\((4x^3)'=12x^2\) y \((2x)'=2\).`, h:'Baja el exponente y réstale 1.'}]},
   {src:'Ejercicio de práctica', p:R`f(x)=5x^4-3x^2+2x`, steps:[
     {q:'Deriva 5x⁴.', k:['20x','5x','4','3','pot','x','20','5'], a:['20x^{3}'], w:R`\(5\cdot4x^{3}\).`, h:'Baja el 4 y resta 1 al exponente.'},
     {q:'Deriva −3x².', k:['-6x','-3x','6','x','-'], a:['-6x'], w:R`\(-3\cdot2x^{1}\).`, h:'Baja el 2.'},
     {q:'Escribe f′(x) completa.', k:['20x','pot','3','-','6x','+','2','x','20','6'], a:['20x^{3}-6x+2'], w:R`\((2x)'=2\).`, h:'Junta los tres resultados.'}]},
   {src:'Ejercicio de práctica', p:R`f(x)=x^6-4x^3+9`, steps:[
     {q:'Deriva x⁶.', k:['6x','x','pot','5','6'], a:['6x^{5}'], w:'Baja el 6, queda exponente 5.', h:'n·xⁿ⁻¹'},
     {q:'Escribe f′(x) completa.', k:['6x','pot','5','-','12x','2','+','9','6','12','x'], a:['6x^{5}-12x^{2}'], w:R`\((-4x^3)'=-12x^2\) y \((9)'=0\).`, h:'La constante se anula.'}]},
  ]},

{ id:'producto', t:'Regla del producto y del cociente', short:'Producto y cociente', dict:'Derivadas',
  intro:R`
  <p><b>Lo más básico.</b> La derivada de un producto <b>no</b> es el producto de derivadas.</p>
  <ul><li><b>Producto:</b> \((uv)'=u'v+uv'\).</li><li><b>Cociente:</b> \(\left(\frac uv\right)'=\frac{u'v-uv'}{v^2}\) ("la de arriba por la de abajo menos…").</li></ul>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`\frac{d}{dx}\left[x^2\sin x\right]`, steps:[
     [R`\(u=x^2,\ v=\sin x\Rightarrow u'=2x,\ v'=\cos x\)`, R`Identificar los dos factores.`],
     [R`\(2x\sin x+x^2\cos x\)`, R`\(u'v+uv'\).`]], r:R`2x\sin x+x^2\cos x`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`\frac{d}{dx}\left[\frac{x^2+1}{x-3}\right]`, steps:[
     [R`\(\frac{2x(x-3)-(x^2+1)(1)}{(x-3)^2}\)`, R`Regla del cociente.`],
     [R`\(\frac{2x^2-6x-x^2-1}{(x-3)^2}\)`, R`Distributiva.`]], r:R`\frac{x^2-6x-1}{(x-3)^2}`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`\frac{d}{dx}\left[x^3e^x\right]`, steps:[
     {q:'Escribe u′·v (con u = x³, v = eˣ).', k:['3x','x','pot','2','3','exp'], a:['3x^{2}e^{x}'], w:R`\(u'=3x^2\).`, h:'Deriva solo x³.'},
     {q:'Escribe u·v′.', k:['x','pot','3','exp','2'], a:['x^{3}e^{x}'], w:R`\((e^x)'=e^x\).`, h:'eˣ es su propia derivada.'},
     {q:'Escribe la derivada completa.', k:['3x','x','pot','2','3','exp','+'], a:['3x^{2}e^{x}+x^{3}e^{x}'], w:'u′v + uv′.', h:'Suma los dos.'}]},
   {src:'Ejercicio de práctica', p:R`\frac{d}{dx}\left[\frac{2x}{x+1}\right]`, steps:[
     {q:"Escribe el numerador u′v − uv′.", k:['2','(',')','x','+','1','-','2x'], a:['2(x+1)-2x'], w:R`\(u=2x,\ u'=2;\ v=x+1,\ v'=1\).`, h:'2·(x + 1) − 2x·1'},
     {q:'Escribe la derivada simplificada.', k:['frac','2','(',')','x','+','1','pot'], a:['frac{2}{(x+1)^{2}}'], w:'El numerador vale 2.', h:'Abajo va v².'}]},
  ]},

{ id:'cadena', t:'Regla de la cadena', short:'Regla de la cadena', dict:'Derivadas',
  intro:R`
  <p><b>Lo más básico.</b> Para una función "dentro" de otra: <b>deriva la de afuera dejando la de adentro igual, y multiplica por la derivada de la de adentro</b>.</p>
  \[\big(f(g(x))\big)'=f'(g(x))\cdot g'(x)\]
  <p>Ejemplos: \(\big((3x+1)^5\big)'=5(3x+1)^4\cdot3\), \(\ (e^{5x})'=5e^{5x}\).</p>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`\frac{d}{dx}(3x+1)^5`, steps:[
     [R`\(5(3x+1)^4\)`, R`Afuera: potencia 5, se deja \(3x+1\) igual.`],
     [R`\(\cdot\,3\)`, R`Derivada de adentro: \((3x+1)'=3\).`]], r:R`15(3x+1)^4`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`\frac{d}{dx}\sin\left(x^2\right)`, steps:[
     [R`\(\cos\left(x^2\right)\)`, R`Afuera: seno → coseno, adentro igual.`],
     [R`\(\cdot\,2x\)`, R`Derivada de \(x^2\).`]], r:R`2x\cos\left(x^2\right)`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`\frac{d}{dx}(2x-5)^4`, steps:[
     {q:'Deriva la de afuera (deja adentro igual).', k:['4','(',')','2x','-','5','pot','3','2','x'], a:['4(2x-5)^{3}'], exact:true, w:'Baja el 4, exponente 3.', h:'n·(…)ⁿ⁻¹'},
     {q:'Multiplica por la derivada de adentro y simplifica.', k:['8','(',')','2x','-','5','pot','3','4','2','x'], a:['8(2x-5)^{3}'], w:R`\((2x-5)'=2\); \(4\cdot2=8\).`, h:'¿Cuánto vale (2x − 5)′?'}]},
   {src:'Ejercicio de práctica', p:R`\frac{d}{dx}e^{5x}`, steps:[
     {q:'¿Cuál es la derivada de adentro?', k:['5','5x','x','1'], a:['5'], exact:true, w:R`\((5x)'=5\).`, h:'Adentro está 5x.'},
     {q:'Escribe la derivada.', k:['5','exp','pot','5x','x'], a:['5e^{5x}'], w:'eᵘ se queda igual y se multiplica por u′.', h:'5·e^{5x}'}]},
  ]},

{ id:'trascendentes', t:'Derivadas de exponenciales, logaritmos y trigonométricas', short:'Exp, ln y trig', dict:'Derivadas',
  intro:R`
  <p><b>Lo más básico.</b> Las derivadas que hay que saber de memoria:</p>
  <div class="my-3 overflow-x-auto"><table><tr><th>\(f\)</th><th>\(f'\)</th><th>\(f\)</th><th>\(f'\)</th></tr>
  <tr><td>\(e^x\)</td><td>\(e^x\)</td><td>\(\ln x\)</td><td>\(\frac1x\)</td></tr>
  <tr><td>\(\sin x\)</td><td>\(\cos x\)</td><td>\(\cos x\)</td><td>\(-\sin x\)</td></tr>
  <tr><td>\(\tan x\)</td><td>\(\sec^2x\)</td><td>\(a^x\)</td><td>\(a^x\ln a\)</td></tr></table></div>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`\frac{d}{dx}\left(3e^x-2\ln x\right)`, steps:[
     [R`\(3e^x-2\cdot\frac1x\)`, R`Tabla, término a término.`]], r:R`3e^x-\frac2x`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`\frac{d}{dx}\ln\left(x^2+1\right)`, steps:[
     [R`\(\frac{1}{x^2+1}\)`, R`Derivada de \(\ln u\) es \(\frac1u\).`],
     [R`\(\cdot\,2x\)`, R`Cadena: \((x^2+1)'=2x\).`]], r:R`\frac{2x}{x^2+1}`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`f(x)=4\sin x+3\cos x`, steps:[
     {q:'Deriva 4 sin x.', k:['4','cos','sin','x','-'], a:['4cos(x)'], w:R`\((\sin x)'=\cos x\).`, h:'Tabla.'},
     {q:'Escribe f′(x) completa.', k:['4','cos','sin','x','-','+','3'], a:['4cos(x)-3sin(x)'], w:R`\((\cos x)'=-\sin x\).`, h:'Ojo con el signo.'}]},
   {src:'Ejercicio de práctica', p:R`f(x)=\ln(3x)`, steps:[
     {q:'Aplica la cadena: escribe (1/u)·u′ con u = 3x.', k:['frac','1','3x','·','3','x'], a:['frac{1}{3x}·3'], w:R`\(u'=3\).`, h:'(1/3x)·3'},
     {q:'Simplifica.', k:['frac','1','x','3'], a:['frac{1}{x}'], w:'El 3 se cancela.', h:'3/(3x)'}]},
  ]},

{ id:'implicita', t:'Derivación implícita', short:'Derivación implícita', dict:'Derivadas',
  intro:R`
  <p><b>Lo más básico.</b> Cuando \(y\) no está despejada, se deriva <b>ambos lados</b> respecto a \(x\), tratando \(y\) como función de \(x\): cada vez que derives algo con \(y\), multiplica por \(y'\) (regla de la cadena). Luego se despeja \(y'\).</p>
  <p>Ejemplo: \((y^2)'=2y\,y'\).</p>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`x^2+y^2=25`, steps:[
     [R`\(2x+2y\,y'=0\)`, R`Derivar ambos lados; \((y^2)'=2yy'\) y \((25)'=0\).`],
     [R`\(y'=-\frac{2x}{2y}\)`, R`Despejar \(y'\).`]], r:R`y'=-\frac{x}{y}`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`x^3+y^3=6xy`, steps:[
     [R`\(3x^2+3y^2y'=6y+6xy'\)`, R`A la derecha, regla del producto en \(6xy\).`],
     [R`\(3y^2y'-6xy'=6y-3x^2\)`, R`Pasar los términos con \(y'\) a un lado.`],
     [R`\(y'(3y^2-6x)=6y-3x^2\)`, R`Factor común \(y'\).`]], r:R`y'=\frac{2y-x^2}{y^2-2x}`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`x^2+y^2=16`, steps:[
     {q:'Deriva ambos lados (usa la pieza y′).', k:['2x','+','2y','y′','=','0','16'], a:['2x+2yy′=0','2yy′+2x=0'], exact:true, w:R`\((y^2)'=2yy'\).`, h:'Lo que tiene y se multiplica por y′.'},
     {q:'Despeja y′.', k:['y′','=','-','frac','x','y','2'], a:['y′=-frac{x}{y}','y′=frac{-x}{y}'], exact:true, w:'Se cancelan los 2.', h:'2yy′ = −2x'}]},
   {src:'Ejercicio de práctica', p:R`xy=6`, steps:[
     {q:'Deriva ambos lados (regla del producto).', k:['y','+','x','y′','=','0','6'], a:['y+xy′=0','xy′+y=0'], exact:true, w:R`\((xy)'=1\cdot y+x\,y'\).`, h:'u′v + uv′'},
     {q:'Despeja y′.', k:['y′','=','-','frac','x','y'], a:['y′=-frac{y}{x}','y′=frac{-y}{x}'], exact:true, w:R`\(xy'=-y\).`, h:'Pasa y y divide entre x.'}]},
  ]},

{ id:'tangente', t:'Recta tangente', short:'Recta tangente', dict:'Derivadas',
  intro:R`
  <p><b>Lo más básico.</b> La recta tangente a \(y=f(x)\) en \(x=a\) pasa por el punto \((a,f(a))\) y tiene pendiente \(m=f'(a)\):</p>
  \[y-f(a)=f'(a)(x-a)\]`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`y=x^2\ \text{en}\ x=3`, steps:[
     [R`\(f(3)=9\), \(f'(x)=2x\Rightarrow m=6\)`, R`Punto y pendiente.`],
     [R`\(y-9=6(x-3)\)`, R`Punto-pendiente.`]], r:R`y=6x-9`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`y=e^x\ \text{en}\ x=0`, steps:[
     [R`\(f(0)=1\), \(f'(0)=e^0=1\)`, R`\(e^0=1\).`],
     [R`\(y-1=1(x-0)\)`, R`Punto-pendiente.`]], r:R`y=x+1`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`f(x)=x^2+1\ \text{en}\ x=1`, steps:[
     {q:'Pendiente m = f′(1).', k:['2','1','3','0'], a:['2'], w:R`\(f'(x)=2x\).`, h:'Deriva y sustituye.'},
     {q:'Valor f(1).', k:['2','1','3','0'], a:['2'], w:R`\(1+1=2\).`, h:'Sustituye en f.'},
     {q:'Ecuación de la recta: y = …', k:['y','=','2x','+','-','1','2'], a:['y=2x'], w:R`\(y-2=2(x-1)\Rightarrow y=2x\).`, h:'y − f(1) = m(x − 1)'}]},
   {src:'Ejercicio de práctica', p:R`f(x)=x^3\ \text{en}\ x=2`, steps:[
     {q:'Pendiente m = f′(2).', k:['12','8','6','4'], a:['12'], w:R`\(f'(x)=3x^2=12\).`, h:'3·2²'},
     {q:'Ecuación de la recta: y = …', k:['y','=','12x','-','16','8','+'], a:['y=12x-16'], w:R`\(y-8=12(x-2)\).`, h:'f(2) = 8'}]},
  ]},

{ id:'extremos', t:'Máximos y mínimos', short:'Máximos y mínimos', dict:'Derivadas',
  intro:R`
  <p><b>Lo más básico.</b> En un máximo o mínimo local la tangente es horizontal: \(f'(x)=0\) (<b>punto crítico</b>).</p>
  <ul><li>Si \(f'\) cambia de \(+\) a \(-\): <b>máximo</b>. De \(-\) a \(+\): <b>mínimo</b>.</li>
  <li>Criterio de la segunda derivada: \(f''(c)>0\) mínimo, \(f''(c)<0\) máximo.</li></ul>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`f(x)=x^3-3x`, steps:[
     [R`\(f'(x)=3x^2-3=0\Rightarrow x=\pm1\)`, R`Puntos críticos.`],
     [R`\(f''(x)=6x\): \(f''(1)=6>0\), \(f''(-1)=-6<0\)`, R`Segunda derivada.`],
     [R`Mínimo en \((1,-2)\), máximo en \((-1,2)\)`, R`Evaluar \(f\).`]], r:R`\text{máx } (-1,2),\ \text{mín } (1,-2)`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`f(x)=xe^{-x}`, steps:[
     [R`\(f'(x)=e^{-x}-xe^{-x}=e^{-x}(1-x)\)`, R`Producto y cadena.`],
     [R`\(f'(x)=0\iff x=1\)`, R`\(e^{-x}\) nunca es 0.`],
     [R`\(f'>0\) si \(x<1\), \(f'<0\) si \(x>1\)`, R`Cambia de + a −: máximo.`]], r:R`\text{máx en } x=1,\ f(1)=\frac1e`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`f(x)=x^2-6x+5`, steps:[
     {q:'Calcula f′(x).', k:['2x','-','6','+','5','x'], a:['2x-6'], w:'Reglas básicas.', h:'(x²)′ = 2x'},
     {q:'Punto crítico: x = …', k:['x','=','3','6','-3'], a:['x=3'], w:R`\(2x-6=0\).`, h:'Iguala a 0.'},
     {q:'Valor mínimo f(3).', k:['-4','4','5','-','3'], a:['-4'], w:R`\(9-18+5=-4\).`, h:'Sustituye x = 3.'}]},
   {src:'Ejercicio de práctica', p:R`f(x)=x^3-12x`, steps:[
     {q:'Calcula f′(x).', k:['3x','pot','2','-','12','x','3'], a:['3x^{2}-12'], w:'Reglas básicas.', h:'(x³)′ = 3x²'},
     {q:'Puntos críticos, separados por coma.', k:['2','-2','4','-4',','], a:['2,-2'], set:true, w:R`\(3x^2=12\Rightarrow x^2=4\).`, h:'Dos valores.'},
     {q:'El máximo local está en x = …', k:['x','=','2','-2','0'], a:['x=-2'], w:R`\(f''(x)=6x\); \(f''(-2)<0\).`, h:'Segunda derivada negativa.'}]},
  ]},

{ id:'optimizacion', t:'Optimización', short:'Optimización', dict:'Derivadas',
  intro:R`
  <p><b>Lo más básico.</b> Para obtener el mejor valor (máximo o mínimo) de algo:</p>
  <ol><li>Escribe la cantidad a optimizar en función de <b>una</b> variable (usa la restricción).</li><li>Deriva e iguala a 0.</li><li>Comprueba que es máximo o mínimo y responde la pregunta.</li></ol>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`\text{Rectángulo de perímetro 40 con área máxima}`, steps:[
     [R`\(2x+2y=40\Rightarrow y=20-x\); \(A=x(20-x)\)`, R`Usar la restricción para dejar una variable.`],
     [R`\(A'=20-2x=0\Rightarrow x=10\)`, R`Derivar e igualar a 0.`],
     [R`\(y=10\), \(A=100\)`, R`\(A''=-2<0\): máximo.`]], r:R`10\times10,\ A=100`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`\text{Caja sin tapa de una lámina } 12\times12 \text{ cortando cuadrados de lado } x`, steps:[
     [R`\(V(x)=x(12-2x)^2\), \(0<x<6\)`, R`Base \((12-2x)^2\), altura \(x\).`],
     [R`\(V'=(12-2x)^2-4x(12-2x)=(12-2x)(12-6x)\)`, R`Producto y cadena; factor común.`],
     [R`\(V'=0\Rightarrow x=2\) (\(x=6\) da volumen 0)`, R`Dentro del intervalo.`]], r:R`x=2,\ V=128`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`\text{Dos números positivos suman 20. Maximiza su producto.}`, steps:[
     {q:'Escribe el producto P(x) si uno de los números es x.', k:['x','(',')','20','-','·'], a:['x(20-x)'], w:'El otro número es 20 − x.', h:'x por el otro.'},
     {q:'Calcula P′(x).', k:['20','-','2x','x','+'], a:['20-2x'], w:R`\(P=20x-x^2\).`, h:'Expande y deriva.'},
     {q:'Producto máximo.', k:['100','10','20','200'], a:['100'], w:R`\(x=10\Rightarrow10\cdot10\).`, h:'P′ = 0 en x = 10.'}]},
   {src:'Ejercicio de práctica', p:R`\text{Rectángulo de área 64 con perímetro mínimo}`, steps:[
     {q:'Perímetro P(x) si un lado mide x.', k:['2x','+','frac','128','x','2','64'], a:['2x+frac{128}{x}'], w:R`El otro lado es \(\frac{64}{x}\).`, h:'2x + 2·(64/x)'},
     {q:'Lado óptimo: x = …', k:['x','=','8','16','64'], a:['x=8'], w:R`\(P'=2-\frac{128}{x^2}=0\).`, h:'x² = 64'},
     {q:'Perímetro mínimo.', k:['32','16','64','8'], a:['32'], w:'Es un cuadrado de lado 8.', h:'4·8'}]},
  ]},

{ id:'lhopital', t:"Regla de L'Hôpital", short:"L'Hôpital", dict:'Límites',
  intro:R`
  <p><b>Lo más básico.</b> Si al sustituir obtienes \(\frac00\) o \(\frac\infty\infty\), puedes derivar <b>arriba y abajo por separado</b> (no es la regla del cociente):</p>
  \[\lim\frac{f(x)}{g(x)}=\lim\frac{f'(x)}{g'(x)}\]
  <p>Se puede repetir si vuelve a salir indeterminado.</p>`,
  examples:[
   {lvl:'medio', src:'Ejemplo de la guía', p:R`\lim_{x\to0}\frac{\sin x}{x}`, steps:[
     [R`Sustituir da \(\frac00\)`, R`Se puede usar L'Hôpital.`],
     [R`\(\lim_{x\to0}\frac{\cos x}{1}=1\)`, R`Derivar arriba y abajo.`]], r:R`1`},
   {lvl:'dificil', src:'Ejemplo de la guía', p:R`\lim_{x\to\infty}\frac{x^2}{e^x}`, steps:[
     [R`\(\frac{\infty}{\infty}\Rightarrow\lim\frac{2x}{e^x}\)`, R`Primera vez.`],
     [R`\(\frac\infty\infty\Rightarrow\lim\frac{2}{e^x}=0\)`, R`Segunda vez: la exponencial gana.`]], r:R`0`},
  ],
  lego:[
   {src:'Ejercicio de práctica', p:R`\lim_{x\to0}\frac{e^x-1}{x}`, steps:[
     {q:'Deriva arriba y abajo.', k:['frac','exp','pot','x','1','0'], a:['frac{e^{x}}{1}'], w:R`\((e^x-1)'=e^x\), \(x'=1\).`, h:'Por separado.'},
     {q:'Calcula el límite.', k:['1','0','e','2'], a:['1'], w:R`\(e^0=1\).`, h:'Sustituye x = 0.'}]},
   {src:'Ejercicio de práctica', p:R`\lim_{x\to2}\frac{x^3-8}{x-2}`, steps:[
     {q:'Deriva arriba y abajo.', k:['frac','3x','pot','2','1','x','3'], a:['frac{3x^{2}}{1}'], w:R`\((x^3-8)'=3x^2\), \((x-2)'=1\).`, h:'Por separado.'},
     {q:'Calcula el límite.', k:['12','8','4','6'], a:['12'], w:R`\(3\cdot2^2=12\).`, h:'Sustituye x = 2.'}]},
  ]},
];
