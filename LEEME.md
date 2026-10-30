# Práctica de C

Consignas de sintaxis de C para los ingresantes: se responden escribiendo
código, y se corrigen **sin ejecutarlo**, mirando lo que el código declara.
Las consignas van en series, y cada una se resuelve sobre lo que el alumno
escribió en las anteriores.

## Probarlo

```
node servidor.js
```

y abrir <http://localhost:8080> (con `HOST=0.0.0.0 node servidor.js` se ve
también desde otros equipos de la red). Las pruebas del corrector están en
<http://localhost:8080/pruebas/>: una línea OK o FALLA por caso.

Hace falta el servidor porque el navegador no carga módulos ni el analizador
abriendo `index.html` con doble clic. Para publicarlo alcanza con cualquier
hosting de archivos estáticos: no hay nada que corra del lado del servidor.

## Qué hay

| Archivo | Para qué |
|---|---|
| `consignas/indice.json` | Qué series se muestran y en qué orden. |
| `consignas/*.json` | Las series: enunciado, reglas y una solución de referencia. |
| `js/analizador.js` | Carga el analizador de C (tree-sitter en WebAssembly). |
| `js/modelo.js` | Del árbol del analizador a "qué estructuras, alias, variables y llamadas hay". |
| `js/corrector.js` | Aplica las reglas de una consigna y arma los mensajes. |
| `js/serie.js` | Qué código tiene delante cada consigna de una serie, y cómo queda al resolverla. |
| `js/enunciado.js` | Pone en el enunciado los nombres que eligió el alumno (`{S}`). |
| `js/editor.js` | El editor de la respuesta: colores, números de línea y sangría. |
| `js/app.js` | La pantalla y el avance del alumno. |
| `pruebas/casos.js`, `pruebas/casos-cadenas.js` | Respuestas de ejemplo con el resultado que tienen que dar. |
| `vendor/tree-sitter/` | El analizador, copiado de terceros. No se edita: ver su `LEEME.md`. |

`modelo.js` y `corrector.js` no saben nada de la pantalla: si un día la
interfaz se rehace con otra herramienta, esos dos quedan como están.

## Agregar una serie

Una serie es un archivo en `consignas/`:

```json
{
  "id": "estructuras",
  "titulo": "Declarar, usar y dar un alias",
  "descripcion": "Lo que se lee debajo del título en la lista.",
  "consignas": [ ... ]
}
```

y se muestra recién cuando está anotada en `consignas/indice.json`, que
además fija el orden de la lista. Sacarla de ahí la esconde sin borrarla; para
dejarla anotada pero sin listarla, ver "Ocultar series y grupos" más abajo.

El índice agrupa las series:

```json
{
  "grupos": [
    { "id": "cadenas", "titulo": "Cadenas",
      "descripcion": "Textos en C: el carácter de fin, la biblioteca…",
      "series": ["cadenas-fin.json", "cadenas-vacia.json"] }
  ]
}
```

En la lista cada grupo es una sección, con su descripción y cuántas de sus
series están completas. **La serie no lleva el grupo ni el número en su
título**: el número es la posición que ocupa en el grupo, así que agregar o
mover una serie renumera las demás sin tocar sus archivos. Una serie está en
un solo grupo, y las pruebas lo verifican. Las direcciones `#/serie/<id>`
no cambian, y `#/grupo/<id>` lleva a la lista, en ese grupo.

Un grupo con `"agrupar": true` (hoy Arreglos y Cadenas) aparece en la lista como una
sola tarjeta; al hacer clic, `#/grupo/<id>` muestra sus series. Los demás grupos
muestran sus series directamente.

**Ocultar series y grupos** (para ir habilitando los temas a medida que se
ven en clase): en el índice, `"oculto": true` en un grupo, o `"ocultas":
["archivo.json"]` con las series que no se listan. Una serie oculta **no
aparece en la lista de los alumnos, pero se abre por su dirección**
(`#/serie/<id>`, `#/grupo/<id>`), y el número de las demás no tiene huecos.
Para habilitarla se saca la marca del índice. No es un secreto: los archivos
de la serie siguen siendo públicos.

**Modo docente**: con `?docente` en la dirección (por ejemplo
`https://.../?docente`) la lista muestra también las ocultas, marcadas como
tales, **y no se envía ninguna estadística ni informe**. El modo queda guardado
en ese navegador (`practica-c:docente`), así que sigue activo aunque se entre
después sin el parámetro; una franja arriba lo avisa y tiene un enlace "Salir".
`?docente=no` lo apaga (para probar lo que ve un alumno, con envío incluido).
En este modo **los pasos del encabezado son enlaces**: al hacer clic en uno se
salta a esa consigna hacia adelante, completando las anteriores
con sus soluciones de referencia, como hacen las pruebas, así que una consigna
encadenada se ve con el código que le corresponde (y un aviso lo dice). El
avance del modo docente se guarda **aparte** (`practica-c:avance-docente:<id>`),
sin mezclarse con el de un alumno.
Abriendo la página en esta PC (`localhost`) pasa lo mismo sin hacer nada.

**Repasar y releer mensajes (alumnos y docente).** Las consignas ya resueltas
son enlaces en los pasos del encabezado: al hacer clic se vuelve a resolver
esa consigna, con el código y los nombres que había antes de ella. Es un
repaso: no cambia lo guardado (ni la respuesta ni la estrella), no cuenta como
intento ni se envía a las estadísticas, y un aviso con un botón lleva de
vuelta a la consigna en la que estaba (lo que había escrito en su editor se
conserva), y un botón trae al editor la respuesta que había dado. También se repasa desde la pantalla final de la serie. En un
cuestionario, el mensaje de cada opción queda debajo de ella, los de las
equivocadas se acumulan, y al acertar se explican también las que no probó.

**El `id` de una serie no se cambia** una vez que los alumnos la usaron: el
avance de cada uno está guardado con ese nombre, y con otro arrancan de cero.
Vale lo mismo para el `id` de cada consigna, que es con lo que se anotan los
intentos. El título y la descripción sí se pueden cambiar cuando haga falta.

Cambiar las reglas de una consigna no rompe el avance: al abrir, las
respuestas guardadas se corrigen de nuevo, y el alumno retoma desde la primera
que ya no vale.

## La ficha de datos

Una consigna puede llevar una ficha: una tarjeta con el nombre de cada campo,
como una ficha en papel. **Muestra cómo tiene que quedar** lo que la consigna
pide cargar, igual que "Así tiene que quedar la tabla" en Arreglos:

```json
"enunciado": "Escriba el código que guarde en `alumno` el número de legajo `20431`.",
"ficha": {
  "leyenda": "Así tiene que quedar la ficha:",
  "titulo": "Ficha de alumno",
  "resaltar": ["legajo"],
  "campos": [
    { "nombre": "legajo", "ejemplo": "20431" },
    { "nombre": "promedio" }
  ]
}
```

- **Cada campo** lleva su `nombre` (resaltado, en una columna) y, si ya tiene
  valor, un `ejemplo`. Sin `ejemplo` lleva una línea donde iría el dato: todavía
  no está cargado. Donde se pide **declarar** la estructura no hay ejemplos,
  porque un valor insinúa el tipo.
- **`resaltar`** es la lista de campos que se cargan en esta consigna (o
  `"todos"`): se ven con un fondo suave, y lo ya cargado se ve sin resaltar.
- **`leyenda`** va arriba de la ficha. `titulo` lo escribe el docente.
- **La consigna dice los valores** que hay que cargar, tal como se escriben en
  el código (`'T'`, `"Perez, Ana"`). Las pruebas verifican que cada campo
  resaltado con ejemplo tenga su valor en el enunciado.
- **Una estructura de adentro** (un campo que es otra estructura) lleva sus
  campos: `{ "nombre": "nacimiento", "campos": [{ "nombre": "dia" }, …] }`. Se
  ve como una subficha, a la derecha del nombre. `resaltar` y `marcar` nombran
  sus campos con el camino (`"nacimiento.anio"`). Con `"marcar": ["ingreso"]`
  (el nombre de la estructura de adentro) se marca la subficha entera, con
  borde y fondo, y también todos sus valores: para la fecha que se copia o se
  pide.
- **`ficha` puede ser una lista**, para mostrar más de una variable (`alumno` y
  `copia`), cada una con su título.
- **Un arreglo de estructuras** se escribe de una vez y se abre en una ficha
  por elemento, con el título `alumnos[0]`, `alumnos[1]`…, una al lado de la
  otra (apiladas si no entran). Un elemento `null` es uno todavía sin cargar:
  sus campos llevan la línea. `destacar` marca los elementos (borde y título:
  el que cumple, el mayor) y `resaltar`, los campos que se marcan en todas
  porque la consigna los carga (las pruebas piden que su valor esté en el
  enunciado). `marcar` se ve igual, para señalar el campo sobre el que se
  trabaja (el que se suma), sin esa exigencia.
  Los valores van como texto cuando importa cómo se ven (`"9.10"`):

  ```json
  "ficha": {
    "arreglo": "alumnos",
    "leyenda": "Así tiene que quedar el arreglo:",
    "campos": ["legajo", "apellidoNombre", "promedio", "turno"],
    "elementos": [
      [20431, "Perez, Ana", "8.45", "T"],
      [30872, "Lopez, Juan", "9.10", "M"],
      null
    ],
    "destacar": [1],
    "resaltar": ["promedio"]
  }
  ```
- **`"marcarDestacado": ["legajo", "promedio"]`** marca esos campos solo en los
  elementos de `destacar` (en "el mayor promedio" y "buscar un legajo": lo que
  se compara y lo que se guarda, y no los de todos), con el mismo aspecto que
  `marcar`.
- **La descripción de cada dato** la dice el enunciado, en prosa y en el orden
  de la ficha, cuando hace falta (en "Declarar la estructura"). Si el enunciado
  tiene una línea que solo dice `[ficha]`, la ficha va ahí; si no, después de
  todo el texto.
- Las pruebas verifican que los nombres de la ficha sean los de la regla
  `struct`, y que una regla `campo` corrija valores que la ficha muestra.

## Qué código ve cada consigna

**Por defecto, cada consigna es un programa nuevo**: no ve el código de las
anteriores, ni los nombres que capturaron, y puede repetir sus nombres. La que
depende de lo anterior lo dice:

```json
{ "id": "estructuras-2", "continua": true, ... }
```

Una serie que se resuelve toda de corrido lo dice una sola vez, arriba, y la
excepción se marca consigna por consigna con `"continua": false`:

```json
{ "id": "estructuras", "continua": true, "consignas": [ ... ] }
```

`continua` es de **quien recibe**: "esta consigna sigue el código de la
anterior". Una consigna que no continúa corta la cadena: la siguiente, si
continúa, arranca desde ella. (Lo que no se puede expresar es una respuesta
descartable que la siguiente no deba ver, con las anteriores todavía visibles;
no hizo falta.)

Es por defecto así a propósito. Si se olvida marcar una consigna que continúa,
su solución de referencia no pasa y **las pruebas lo avisan**. Si fuera al
revés, el que se olvidara de cortar le daría al alumno un error por un nombre
repetido —lo más natural del mundo— y nada lo detectaría.

Lo que depende de esto:

- **Repetir un nombre** es un error solo contra el código que la consigna
  recibe (y contra lo que ya escribió en la misma respuesta). Una variable
  repetida es `VARIABLE_REDEFINIDA`; una constante con otro valor,
  `CONSTANTE_REDEFINIDA`. Una constante repetida **con el mismo valor**
  compila, así que no es un error sino una mejora (`CONSTANTE_REPETIDA`, solo
  con la práctica `constantes`).
- **Los nombres capturados** (`$S`, `{S}`) se heredan solo si continúa.
- **El dibujo y el código de arriba** ("El código hasta acá") muestran solo lo
  que la consigna recibe. Si no continúa y no trae `dado`, no hay recuadro.
- **La pantalla final** lista las respuestas de cada consigna, no un código
  acumulado.
- **`"persiste": true`** en una consigna (el `#include` de una biblioteca):
  su respuesta pasa a verse en "El código hasta acá" de **todas** las que
  siguen, continúen o no. No se mezcla con el código acumulado de las que
  continúan, así que no repite declaraciones.

## Escribir una consigna

```json
{
  "id": "estructuras-2",
  "titulo": "Declarar una variable",
  "enunciado": "Declare una variable usando la estructura {S}.",
  "requiere": [{ "variable": { "tipo": "$S" } }],
  "referencia": "struct Puesto unPuesto;"
}
```

Las reglas de `requiere`:

- `{ "struct": { "campos": [...], "capturar": "S" } }` — una estructura con
  esos campos, en cualquier orden y con cualquier nombre. Cada campo es
  `{ "nombre", "tipo" }`, y el tipo es `cadena` (arreglo de `char` de cualquier
  dimensión), `entero`, `real` o `caracter`. Un campo de más avisa pero no
  invalida.
- `{ "variable": { "tipo": "$S" } }` — una variable de ese tipo, global o
  local. El tipo es una captura (`$S`), un tipo de C (`int`) o una categoría
  (`entero`, `real`, `caracter`). Opcionales:
  - `"conAlias": true`: tiene que estar declarada con un alias.
  - `"nombre": "notas"`: tiene que llamarse así.
  - `"arreglo": 20`: tiene que ser un arreglo de 20 elementos, escritos como
    número o con una constante que valga 20. Con `"arreglo": true` vale
    cualquier tamaño. Sin esto, un arreglo no se acepta.
  - `"valores": [3, 6, 0, 7, 1, 5]`: tiene que ser un arreglo definido con
    esos valores, en ese orden, en la misma sentencia. Ver más abajo.
  - `"capturar": "V"`: guarda el nombre de la variable para las consignas que
    siguen.
- `{ "alias": { "de": "$S", "capturar": "A" } }` — un `typedef` de ese tipo.
- `{ "llamada": { "funcion": "strcpy", "argumentos": ["cadena2", "cadena1"] } }`
  — una llamada a esa función con esas variables, en ese orden. Opcionales:
  - `"alternativas": ["strncpy"]`: otras funciones que también valen. Tienen
    que empezar con los mismos argumentos y pueden llevar alguno más al final.
    Sin esto, solo vale la función pedida.
  - `"orden": "primero va el destino y después el origen"`: lo que se le
    explica al que los puso al revés.
  - Un argumento `"*"` acepta cualquier cosa en ese lugar.

  Si en vez de la llamada hay un ciclo, se le dice que la consigna pide la
  función de la biblioteca: **la copia "a mano" no se acepta**, porque sin
  ejecutar el código no hay forma de saber si copia bien.

### Arreglos con sus valores, y su dibujo

```json
"enunciado": "En la misma sentencia, defina e inicialice el siguiente arreglo:",
"requiere": [{ "variable": { "tipo": "entero", "valores": [3, 6, 0, 7, 1, 5] } }]
```

Debajo del enunciado se dibuja el arreglo como una fila de casilleros, con el
índice arriba de cada uno. **El dibujo no se escribe aparte: sale de los
`valores` de la regla**, así lo que el alumno ve es siempre lo que se le
corrige.

| Respuesta | Resultado |
|---|---|
| `int v[] = {3, 6, 0, 7, 1, 5};` | Correcta (excelente, si la serie pide prácticas). |
| `int v[6] = {…};` | Correcta. Con la práctica `constantes`, mejora: la cantidad ya la dicen los valores (`DIMENSION_REPETIDA`). No se trata como número mágico. |
| `int v[10] = {…};` | Error: sobra lugar. Compila, pero no es el arreglo del dibujo. |
| `int v[4] = {…};` | Error: no entran. |
| `int v[6];` y después `v[0] = 3;` | Error: la consigna pide hacerlo en la misma sentencia. |
| Un valor distinto, de más, de menos o en otro orden | Error, diciendo cuál. |

El nombre es libre. El tipo sigue la categoría pedida: con `entero` vale
`int`, `long` o `short`, y `float` es error.

**Lo que no está en la lista queda en cero**, y el corrector lo tiene en
cuenta: compara lo que el arreglo *termina teniendo*, no solo lo escrito.

| Valores pedidos | Respuesta | Resultado |
|---|---|---|
| `0, 0, 0, 0` | `int l[4] = {0};` | Correcta. Mejora: el `4` es un número suelto (`NUMERO_MAGICO`). |
| `0, 0, 0, 0` | `#define TAM 4` y `int l[TAM] = {0};` | Excelente. |
| `0, 0, 0, 0` | `int l[4] = {0, 0, 0, 0};` | Correcta. Mejora: alcanza con `{0}` (`CERO_ALCANZA`, práctica `claridad`). |
| `2, 2, 2, 2` | `int l[4] = {2};` | Error: lo que la lista no nombra queda en cero, no repite el valor (`VALORES_SIN_NOMBRAR`). |
| `5, 1, 0, 0` | `int l[4] = {5, 1};` | Correcta: es el mismo arreglo. |

Un número es mágico cuando **lleva información que no está escrita en otro
lugar de la misma sentencia**. En `int v[6] = {3, 6, 0, 7, 1, 5};` el 6 se
deduce de los valores (no es mágico, es repetido: ya tiene su mejora de dejar
los corchetes vacíos). En `int l[4] = {0};` no se deduce de nada, y por eso sí.

Para llenar de ceros se le propone `{0}` y no dejar los corchetes vacíos,
porque son dos consejos que no se pueden aplicar juntos.

**El dibujo se puede apagar** en una consigna con `"dibujo": false`, cuando el
enunciado ya describe el arreglo con palabras ("una lista de 4 elementos
enteros") y se quiere que el alumno lo deduzca. Los `valores` se siguen
usando para corregir.

**Una tabla** se pide con los valores en filas, y se dibuja con los índices de
las columnas arriba y los de las filas a la izquierda:

```json
"valores": [[5, 8, 1, 4], [0, 2, 9, 6], [3, 7, 4, 8]]
```

| Respuesta | Resultado |
|---|---|
| `int t[][4] = {{5, 8, 1, 4}, {0, 2, 9, 6}, {3, 7, 4, 8}};` | Excelente. |
| `int t[3][4] = {…};` | Correcta. Con la práctica `constantes`, mejora: la cantidad de filas ya la dicen los valores (`FILAS_REPETIDAS`), igual que en el arreglo. |
| `int t[3][] = {…};` | Error: la de columnas no. |
| `int t[3][4] = {5, 8, 1, 4, 0, 2, …};` | Correcta. Con la práctica `claridad`, mejora: no se ve dónde termina cada fila (`TABLA_SIN_FILAS`). |
| `int t[4][3] = {…}` con las filas bien | Error: las dimensiones están al revés. |
| Los valores cargados por columnas | Error, con su mensaje (`TABLA_AL_REVES`). En una tabla cuadrada se nota solo por los valores. |
| Una fila de más o de menos, o con otra cantidad de valores | Error, diciendo cuál. |

La cantidad de **columnas** no se marca nunca: C la exige, y se ve en cada fila
de la lista. La de filas sí, como en el arreglo, porque el compilador la
cuenta solo.

**Las tablas también completan con ceros**, con las mismas reglas que el
arreglo:

| Valores pedidos | Respuesta | Resultado |
|---|---|---|
| tabla de ceros | `#define FILAS 3`, `#define COLUMNAS 4` y `int t[FILAS][COLUMNAS] = {0};` | Excelente. |
| tabla de ceros | `int t[3][4] = {0};` | Correcta. Mejora: el `3` y el `4` son números sueltos (cada uno con su mensaje). |
| tabla de ceros | `int t[][4] = {0};` | Error: con las filas vacías es una sola fila. |
| tabla de ceros | `{{0, 0, 0, 0}, {0, 0, 0, 0}, …}` | Correcta. Mejora: alcanza con `{0}` (`CERO_ALCANZA`). |
| `5 8 0 0 / 1 0 0 0 / 0 0 0 0` | `int t[3][4] = {{5, 8}, {1}};` | Correcta: lo que no se nombra queda en cero. |
| `5 8 0 0 / 1 0 0 0 / 0 0 0 0` | `{{5}, {1}}` | Error: a la primera fila le falta un valor que no es cero. |

Una fila o unas filas que no se escriben valen si en el dibujo son de ceros;
si no, es un error que dice que lo que no se nombra queda en cero.

### Arreglos de letras

Un arreglo de `char` que **no es una cadena**: cada posición guarda una letra y
no hay `'\0'` al final. Los `valores` de la regla pueden ser letras, escritas
como textos de un solo carácter, y el dibujo las muestra entre comillas simples:

```json
"requiere": [{ "variable": { "tipo": "caracter", "valores": ["B", "A", "C", "A", "E", "B"] } }]
```

| Respuesta | Resultado |
|---|---|
| `{'B', 'A', …}` | Correcta. |
| `{B, A, …}` | Error: sin comillas se lee como un nombre de variable (`LETRA_SIN_COMILLAS`). |
| `{"B", "A", …}` | Error: comillas dobles son un texto (`LETRA_ENTRE_COMILLAS_DOBLES`). |
| `{66, 65, …}` | Error: es un número, no una letra (`LETRA_ES_NUMERO`). |
| Otra letra, de más, de menos o en otro orden | Los mismos errores que con números (`VALOR_DISTINTO`, `VALORES_DE_MAS`, …). |

Con `"tipo": "caracter"` y `"arreglo": 5` se pide declararlo con 5 posiciones
(una más, para el fin, es `ARREGLO_GRANDE`: acá no hay cadena).

En la regla `ejecuta`, los `casos` pueden traer letras en `datos`, `queda` y
`muestra`. Para el intérprete cada letra vale su número, y los mensajes las
dicen como letras (`calificaciones[0]` termina valiendo `'D'` y debería valer
`'B'`). `printf` usa `%c`; `%d` con una letra es `FORMATO_NO_CORRESPONDE_AL_TIPO`
(el formato que le corresponde es `%c`). Comparar o asignar una letra con
comillas dobles (`== "A"`) es `LETRA_ENTRE_COMILLAS_DOBLES`. Leer una letra con
`scanf` no se sigue (`EJECUCION_NO_VERIFICADA`): corresponde a las series de
tipos simples.

**Dibujos de un arreglo**: `"dibujo"` puede resaltar posiciones
(`"resaltar": [1, 3, 6]`), dejar posiciones vacías (un `null` en `valores`, para
un arreglo cargado a medias) y ser una lista de dibujos con su título cada uno
(el arreglo antes y después). Con `"salida"` se dibuja debajo lo que tiene que
mostrar el programa.

En la regla `ejecuta`, `"separadas": true` pide lo mostrado en una sola línea,
con un espacio entre cada valor y nada más (un espacio o un salto al final se
perdonan); si no, `MUESTRA_SIN_SEPARAR`, con lo que muestra y lo que tiene que
mostrar en bloques de consola. `"cuenta": "cantidad"` agrega la mejora
`LIMITE_SIN_LA_CANTIDAD` si un ciclo llega hasta ese mismo número escrito suelto
(con la práctica `constantes`).

Un cuestionario con `"queda": true` deja su código para la consigna que sigue
(con `"continua": true`); si él no continúa a la anterior, lo que queda arranca
de su propio código.

### Cadenas de caracteres

Las series `cadenas-*` (el fin de la cadena, la cadena vacía, la biblioteca,
largo y tamaño, recorrer, arreglos de cadenas, tablas de cadenas y typedef) usan estas reglas.

**Vocabulario**: en Cadenas, "cadena" es un arreglo de `char` que termina en
`'\0'`, y es la palabra para un texto. "Arreglo de caracteres" queda para
cuando se contrasta con la cadena (el de la serie *Arreglos de caracteres*, que
no tiene fin y lleva su cantidad aparte). Las diferencias se tratan en cuatro
cuestionarios, cada uno donde importa: `cadenas-q-es-cadena` (el fin: cierra la
serie *El carácter de fin*; `strlen` y `sizeof` se ven en la biblioteca y en
*Largo y tamaño de una cadena*), `cadenas-q-strlen-sin-fin` (largo y tamaño), `cadenas-q-dos-formas` (recorrer
hasta `cantidad` o hasta `'\0'`) y `lectura-q-cuantas-letras` (`%s` frente a
`%c`).

**Una cadena de hasta N letras necesita N + 1 espacios**, y la consigna pide el
tamaño justo. Con un "al menos" un número cualquiera (20) pasaría sin que el
alumno haya pensado en el `\0`, y eso es justo lo que se quiere comprobar:

```json
{ "variable": { "tipo": "caracter", "arreglo": { "tamano": 5, "letras": 4 }, "capturar": "C" } }
```

| Respuesta | Resultado |
|---|---|
| `char s[5];`, `char s[4 + 1];`, `char s[LETRAS + 1];` | Correcta. |
| `char s[4];` | Error `CADENA_SIN_FIN`: no queda espacio para el `\0`. |
| `char s[3];` | Error `ARREGLO_CHICO`. |
| `char s[20];` | Error `ARREGLO_GRANDE`: es más de lo que hace falta. |

`"alMenos"` en lugar de `"tamano"` acepta ese tamaño o más, para una consigna
en la que la dimensión no sea el tema.

Con varios textos, `"tamano": [30, 26]`: la cantidad de textos y el tamaño de
cada uno (la última dimensión es la que lleva el fin). `capturarDimension`
guarda lo que valía la dimensión, para nombrarla en un enunciado o una opción
(`{N}`).

**Cómo se llama cada cosa** (en los enunciados y en los mensajes): el último
corchete son siempre las letras de una cadena, y el nombre sale de lo que
guarda cada elemento.

| Declaración | Se dice |
|---|---|
| `char c[26]` | una cadena |
| `char nombres[30][26]` | un **arreglo de cadenas** (30 textos) |
| `char datos[30][3][26]` | una **tabla de cadenas** (30 filas y 3 columnas, con un texto en cada celda) |

"Tabla de caracteres" queda para lo que de verdad guarda caracteres sueltos
(`char tablero[3][3]`). "Lista" no se usa para esto: en estas series es lo que
va entre llaves (`{"lunes", ...}`). Con tres corchetes, `"tamano": [30, 3, 26]`:
las dimensiones al revés (`DIMENSIONES_AL_REVES`) se detectan entre cada par de
corchetes seguidos, y los argumentos como `datos[0]` (que aún tiene varios
textos adentro) tienen su mensaje (`ARGUMENTO_FALTA_INDICE`).

Otras formas de pedir una variable de caracteres:

- `"texto": "Hola"`: declarada con ese texto en la misma sentencia. `[]` es
  excelente; `[4]` es el error silencioso de C (`CADENA_SIN_FIN`); más lugar
  que el necesario es correcto con mejora. Con `"como": "lista"` se piden los
  caracteres uno por uno entre llaves (`{'H', 'o', 'l', 'a', '\0'}`).
- `"textos": ["lunes", ...]`: un arreglo de cadenas con sus textos. Se controla
  cada texto, que la cantidad sea la justa y que el tamaño deje espacio para el
  fin del más largo; los mensajes nombran ese texto tal como el alumno lo
  escribió. `"sinDistinguirMayusculas": true` acepta `"lunes"`, `"Lunes"` o
  `"LUNES"`: es para cuando la consigna no dicta cómo se escribe el texto. Sin
  esa opción, otra mayúscula es un error (`TEXTO_DISTINTO`), que es lo que
  enseñan las consignas donde el texto está escrito en el enunciado.
- `"caracter": "A"`: una variable de un solo carácter con ese valor (`'A'`, no
  `"A"`).
- `"vacia": true`, junto con `tamano`: tiene que empezar vacía (`""`, `{0}`
  o `{'\0'}`).

Reglas de código:

- `{ "elementos": { "de": "$C", "texto": "Hola" } }`: el texto asignado
  carácter por carácter (`frase[0] = 'H';` ...), con su `'\0'`, en cualquier
  orden. Falta el fin (`CADENA_SIN_FIN`), una posición salteada, todo corrido
  un lugar (`ELEMENTOS_CORRIDOS`), `"H"` en vez de `'H'`, `0` por `'\0'`
  (correcta, con mejora). Con `"en": [1]` el texto es un elemento de un
  arreglo de cadenas (`nombres[1][0] = ...`), y con `"en": [1, 0]` una celda
  de una tabla de cadenas (`datos[1][0][0] = ...`); los mensajes nombran
  `nombres[1]` o `datos[1][0]`.
- `{ "vaciar": "nombre" }`: dejar vacía una cadena, con el fin en la primera
  posición. `strcpy(nombre, "")` y vaciarla con un ciclo valen, con mejora.
- `{ "ciclo": { "indice": "i", "hastaElFinDe": "nombre" } }`: un ciclo que
  avanza el índice hasta el final del texto. **Sin ejecutarlo**: se reconocen
  las condiciones de siempre (`nombre[i] != '\0'`, `nombre[i]`,
  `i < strlen(nombre)`) y los errores típicos (`<=`, recorrer todo el
  tamaño, condición al revés, índice que no avanza). Una condición que no se
  reconoce **no es un error**: sale un aviso (`CICLO_NO_VERIFICADO`) y la
  respuesta queda como "Correcto, pero no pude comprobar todo": no es
  excelente, que quiere decir "lo verifiqué y no hay nada que mejorar". Sí es
  un error una condición que **no mira la cadena** (`i != '\0'`, `i != 5`):
  no hay forma de que vea el final.
  `"filasDe": "nombres"` pide recorrer un arreglo de cadenas, y que dentro se
  vacíe cada una. Con `"columnas": { "indice": "j" }` es una tabla de
  cadenas: un ciclo por las filas y, adentro, uno por las columnas, y en cada
  vuelta se vacía `datos[i][j]`. Un solo ciclo es `CICLO_INTERNO_FALTA`; los
  límites de cada uno se controlan por separado (`CICLO_SE_PASA`,
  `CICLO_NO_LLEGA`).
- `{ "incluye": "string.h" }`: agregar una biblioteca con `#include`. Con
  comillas (`"string.h"`) vale con mejora; sin el `.h`, otra biblioteca, o con
  `#define` en lugar de `#include`, es error con su mensaje. Se usa con
  `"persiste": true`.
- `{ "alias": { "arreglo": { "tamano": 26, "letras": 25 }, "capturar": "T" } }`
  y `{ "usaAlias": { "alias": "$T", "arreglo": { "tamano": 30 } } }`: un
  `typedef` de un arreglo de caracteres, y una variable declarada con él. Una
  variable de ese tipo se ve como el arreglo que es. `usaAlias` también acepta
  `"nombre"` (la variable tiene que llamarse así), `"capturar"` (guarda el
  nombre que le puso el alumno, como en las demás reglas) y un `tamano` con
  dos números (`[30, 3]`): una tabla, con sus filas y sus columnas. Solo
  cuentan las dimensiones que el alumno escribe; el tamaño de cada texto ya
  lo trae el tipo.

La regla `llamada` suma, para estas series:

- Un argumento puede ser un texto (`"\"Juan\""`) o una posición de un arreglo o
  de una tabla de cadenas (`"nombres[0]"`, `"datos[0][1]"`). Con el nombre
  que capturó una consigna anterior (`"$N[0]"`, `"$D[0][1]"`), para que se
  use el que escribió el alumno.
- `"resultadoEn": "largo"`: lo que devuelve tiene que guardarse en esa variable.
- `"comparar": true` (`strcmp`): tiene que estar en la condición de un `if` y
  mirar el cero. `strcmp(a, b)` sola o con `!= 0` se cumple al revés
  (error); `!strcmp(a, b)` vale, con mejora; `==` entre cadenas es error.
  El orden de las dos cadenas da lo mismo.
- `"aMano": { "variable": "nombre", "texto": "Juan" }`: guardar el texto
  carácter por carácter también llega, pero con mejora. Con `"en": [0]` o
  `"en": [0, 1]`, para un elemento de un arreglo o una celda de una tabla.
  Con `"prohibida": true` es error (`A_MANO`): en la serie de la biblioteca la
  consigna pide la función, y su enunciado dice "usando una función de la
  biblioteca de cadenas" sin nombrarla.
- `strncpy` con un límite que no deja lugar para el fin es error.

Para guardar un valor en una posición de un arreglo de números (grupo
Arreglos, serie "Elementos e índices"):

- `{ "asigna": { "variable": "notas", "indice": 0, "valor": 8 } }`:
  `notas[0] = 8;`. `"indice"` es un número, y vale una cuenta con constantes
  (`MAX - 1`); `"valor"`, un número o el texto de otra posición (`"notas[0]"`,
  para copiar). Con `"ultimo": true`, el número suelto (`notas[19]`, `notas[10 +
  9]`) vale con la mejora `ULTIMO_CON_NUMERO_SUELTO` (con `constantes`): sugiere
  `MAX - 1`, que sigue siendo el último si cambia la cantidad.

| Respuesta | Código | Mensaje |
|---|---|---|
| `notas[1] = 8;` pidiendo la primera | `ARGUMENTO_OTRA_POSICION` | La posición que sigue: dice que se numeran desde 0. |
| `notas[i] = 8;` | `ARGUMENTO_POSICION_CON_VARIABLE` | `i` no es un número. |
| `notas[20] = 10;`, `notas[MAX_ALUMNOS] = 10;` | `INDICE_FUERA_DE_RANGO` | Dice de qué posición a qué posición va. |
| `notas[0] == 8;` | `ASIGNACION_CON_IGUAL_DOBLE` | `==` pregunta y no guarda. |
| `notas = 8;` | `ASIGNACION_DE_ARREGLO` | Un arreglo no se asigna completo. |
| `notas[0] = notas[1];` copiando al revés | `ASIGNACION_AL_REVES` | Qué va a cada lado del `=`. |
| otro valor | `ASIGNACION_VALOR_DISTINTO` | No es el valor de la consigna. |
| falta una de varias posiciones pedidas | `ASIGNACION_FALTA_POSICION` | Falta una de las posiciones de la consigna. |

Una consigna que pide varias posiciones lleva una regla `asigna` por cada una:
una asignación que es de otra de ellas no se cuenta como "la posición
equivocada".

Para guardar un valor en un campo de una variable de estructura (grupo
Estructuras, serie "Usar los campos"):

- `{ "campo": { "variable": "alumno", "campos": [{ "nombre": "legajo", "tipo":
  "entero" }] } }`: `alumno.legajo = 20431;`. El valor no se escribe en la
  regla: es el `ejemplo` de la **ficha** de la consigna, así que lo que se ve
  es lo que se corrige. `"tipo"` es `entero`, `real` o `letra`. Un texto
  se guarda con una `llamada` a `strcpy` cuyo primer argumento es
  `"alumno.apellidoNombre"` (y `aMano` con la misma variable). La `variable`
  puede ser un elemento de un arreglo de estructuras (`"alumnos[0]"`): un
  índice de otra posición es `ARGUMENTO_OTRA_POSICION`, uno que no existe
  `INDICE_FUERA_DE_RANGO`, y el arreglo sin índice (`alumnos.legajo`)
  `ARREGLO_SIN_INDICE`.
- `"soloEsos": true` en la regla `campo`: la consigna es cerrada, y guardar
  otro campo de la misma estructura es `CAMPO_NO_PEDIDO` ("La consigna pide
  guardar solo `alumno.legajo`, y el programa también guarda en
  `alumno.promedio`"). Es opcional y se pone consigna por consigna; hoy lo
  llevan las que guardan valores con la ficha (usar los campos, un elemento del
  arreglo, las fechas de adentro). No se dice si falta un campo pedido (eso va
  primero), si ya se dijo `ASIGNACION_DE_ARREGLO`, ni cuando el campo de más
  es de otra estructura de adentro (`CAMPO_OTRA_ESTRUCTURA`).

**Estructuras dentro de estructuras** (serie "Estructuras dentro de estructuras"):

- `{ "struct": { "campos": [{ "nombre": "nacimiento", "tipo": "estructura", "de":
  "TFecha" }] } }`: un campo que es otra estructura (por su alias o su
  etiqueta). `CAMPO_TIPO` si es un entero, un arreglo o un puntero. El alias
  puede pedirse por nombre, `{ "alias": { "de": "$S", "nombre": "TAlumno" } }`
  (`ALIAS_NOMBRE`), para que las consignas que siguen lo usen.
- La regla `campo` acepta un camino en `variable`: `"alumno.nacimiento"`,
  `"alumnos[0].nacimiento"`. `copia` y `compara` también.
- **El simulador aplana** también lo anidado: `alumno.nacimiento.anio` es una
  variable con ese nombre y `alumnos[i].nacimiento.anio` un arreglo
  (`"alumnos.nacimiento.anio": [2004, 1998]` en los datos de prueba). Una
  estructura entera donde va un número es `CAMPO_ES_UNA_ESTRUCTURA`.
- **`"sigueDe": "id"`** en una consigna: arranca con lo que **quedó después**
  de esa consigna, con la respuesta del alumno (como `parteDe`, pero después).
  Sirve cuando las que siguen necesitan lo que declaró el alumno y no pueden
  continuar una de la otra (cada una prueba con sus propios datos).

| Respuesta | Código | Mensaje |
|---|---|---|
| `alumno.anio = 2004;` (el año está en `nacimiento`) | `CAMPO_DE_OTRO_NIVEL` | Dice en qué campo está y cómo se llega. |
| `alumno.ingreso.anio = …` pidiendo el de nacimiento | `CAMPO_OTRA_ESTRUCTURA` | Dice cuál se pide. |
| `alumno.nacimiento = 2004;` | `CAMPO_ES_UNA_ESTRUCTURA` | Es una estructura: se guarda en cada campo. |

| Respuesta | Código | Mensaje |
|---|---|---|
| `legajo = 20431;` | `CAMPO_SIN_VARIABLE` | Es un campo: falta decir de qué variable, con un punto. |
| `Alumno.legajo = 20431;` | `TIPO_EN_VEZ_DE_VARIABLE` | `Alumno` es la estructura; los datos van en la variable. |
| `alumno->legajo = 20431;` | `FLECHA_CON_VARIABLE` | La flecha es para punteros; con una variable se usa el punto. |
| `alumno.codigo = 20431;` | `CAMPO_NO_EXISTE` | Nombra los campos que sí tiene (o el parecido). |
| `alumno.legajo == 20431;` | `ASIGNACION_CON_IGUAL_DOBLE` | `==` pregunta y no guarda. |
| `alumno.apellidoNombre = "Ana";` | `ASIGNACION_DE_ARREGLO` | Es una cadena: se usa una función de la biblioteca. |
| `strcpy(alumno, "Ana");` | `ARGUMENTO_SIN_CAMPO` | `alumno` es la variable completa: falta el campo. |
| `strcpy(alumno.promedio, "Ana");` | `ARGUMENTO_OTRO_CAMPO` | Dice en qué campo va. |
| otro valor, una letra entre comillas dobles, etc. | `ASIGNACION_VALOR_DISTINTO`, `LETRA_*`, `VALOR_ENTRE_COMILLAS` | Los de siempre. |
| falta cargar un campo pedido | `CAMPO_SIN_CARGAR` | Dice cuál. |

Para leer y mostrar los campos de una variable de estructura (serie "Leer y
mostrar los campos"):

- `{ "leeCampo": { "variable": "alumno", "campo": "legajo" } }`: leer un número
  o una letra con `scanf` en un campo. El formato es el que corresponde al
  tipo del campo en la estructura (`%d`, `%f`, `%lf`, `%c`). Un `%c` que
  viene después de otro `scanf` toma el Enter que quedó sin leer, así que
  hay que descartarlo antes: con un espacio delante (`" %c"`) o con el ciclo
  `while (getchar() != '\n');`, igual que antes de `gets` (valen las mismas
  formas y se corrigen igual). Con `"variable": "alumnos[*]"` el campo es el
  de cualquier elemento de un arreglo de estructuras (el que marque el
  índice del ciclo); sirve junto con `ejecuta`, para que leer otro campo no
  pase por "correcto" cuando el simulador no sabe seguirlo. Usar el arreglo
  sin índice (`&alumnos.legajo`, `alumnos.legajo[i]`) es `ARREGLO_SIN_INDICE`
  en cualquier consigna.
- Un campo que es una cadena se lee con la regla `lee` y `"destino":
  "alumno.apellidoNombre"` (con `gets`, `fgets` o `scanf`; `gets` vale con
  la nota `USO_DE_GETS`), y con `limpiaEntrada` si viene después de un `scanf`.
- `{ "muestraCampos": { "variable": "alumno", "campos": ["legajo", "promedio"] } }`:
  mostrar cada campo con `printf` (o `puts` para una cadena), en una o en varias
  llamadas, con el formato de su tipo.

| Respuesta | Código | Mensaje |
|---|---|---|
| `scanf("%d", alumno.legajo);` | `AMPERSAND_FALTA` | Falta el `&` adelante. |
| `scanf("%f", &alumno.legajo);` | `FORMATO_NO_CORRESPONDE_AL_TIPO` | Dice cuál le corresponde. |
| `scanf("%f", &alumno.promedio)` pidiendo el legajo | `LECTURA_OTRO_CAMPO` | Dice en qué campo va. |
| `scanf("%c", &alumno.turno);` después de un `scanf` | `LECTURA_LETRA_TOMA_EL_ENTER` | El espacio antes de `%c`. |
| `gets(&alumno.apellidoNombre);` | `ARGUMENTO_CON_AMPERSAND` | Una cadena va sin `&`. |
| un campo sin mostrar | `MUESTRA_CAMPO_FALTA` | Dice cuál y su formato. |
| `printf("%d", alumno);` | `ARGUMENTO_SIN_CAMPO` | Falta indicar el campo. |

Para copiar y comparar variables de estructura (serie "Copiar y comparar"):

- `{ "copia": { "de": "alumno", "en": "copia" } }`: `copia = alumno;`. Copiar
  campo por campo también vale (con `strcpy` en las cadenas) y, con la práctica
  de `claridad`, tiene la mejora `COPIA_CAMPO_POR_CAMPO`; si falta alguno,
  `COPIA_INCOMPLETA`. Al revés es `ASIGNACION_AL_REVES`, y `strcpy` o
  `memcpy` entre las dos variables, `FUNCION_EQUIVOCADA`.
- `{ "compara": { "izquierda": "alumno.legajo", "derecha": "copia.legajo" } }`:
  la comparación de dos campos con `==` dentro de un `if`, en cualquier orden.
  Comparar las estructuras enteras es `COMPARA_ESTRUCTURAS`; un solo `=` en la
  condición, `ASIGNACION_EN_CONDICION`; otro par de campos, `COMPARA_OTRO_CAMPO`.
  Las cadenas se comparan con la regla `llamada` a `strcmp` y `"comparar":
  true`, con los campos como argumentos (`alumno.apellidoNombre`).

Otras dos reglas de la misma serie:

- `{ "suma": { "de": ["notas[0]", "notas[MAX_ALUMNOS - 1]"] } }`: la suma de
  esas posiciones, guardada en una variable (con su tipo, o con una
  asignación). Los términos pueden ir en cualquier orden, y cada posición con
  la constante o con el número. Con `"capturar"` guarda el nombre que eligió
  el alumno. `SUMA_OTRAS_POSICIONES`, `SUMA_OPERADOR` (`-`, `*`),
  `SUMA_EN_UNA_POSICION` (el resultado en el arreglo) y `SUMA_FALTA`.
- `{ "intercambia": { "variable": "notas", "posiciones": [0, 1] } }`: no mira
  la forma sino lo que hace: sigue las sentencias con dos valores cualquiera y
  pide que al final cada posición tenga el de la otra. Vale con una variable
  auxiliar en cualquier orden, o con sumas y restas. Si no anda, dice por qué:
  `INTERCAMBIO_SIN_AUXILIAR` (las dos quedan iguales: el valor se perdió),
  `INTERCAMBIO_INCOMPLETO` (se guardó pero no volvió) e `INTERCAMBIO_FALTA`.
  Con un ciclo o un `if` no se puede seguir: `INTERCAMBIO_NO_VERIFICADO`
  (correcto, pero no excelente).

**Un ciclo se corrige siguiendo lo que hace** (`js/simulador.js`), no mirando
cómo está escrito. Es un intérprete mínimo de C: enteros y decimales, arreglos
de cualquier dimensión, asignaciones, `++` y `--`, la aritmética, las
comparaciones, `if`, `for`, `while` y `do while`, y las funciones `pow`,
`scanf` y `printf`; sin otras llamadas. También sigue **variables de
estructura**, aplanadas: `alumno.legajo` es una variable con ese nombre, y un
arreglo de estructuras (`TAlumno alumnos[MAX];`) es un arreglo por cada campo
numérico (`alumnos.legajo`, `alumnos.promedio`), así que `alumnos[i].promedio`
es la posición `i` de `alumnos.promedio`. Los datos de prueba de una consigna
usan esos nombres (`{ "alumnos.promedio": [7, 9, 5] }`). Un campo cadena, una
estructura entera (`copia = alumno;`) o una estructura con valores iniciales
entre llaves no se siguen: la verificación queda sin hacer. Lo usa la regla:

- `{ "resultado": { "variable": "notas", "valores": "i * i", "conCiclo": true } }`:
  después de ejecutar todo (lo que la consigna da y lo que escribió el
  alumno), el arreglo tiene que tener esos valores. `"valores"` es un número
  (todos iguales), una fórmula con `i` (la posición) o la lista completa. Con
  `"conCiclo": true` tiene que haber un ciclo; con `"orden": "atras"`, las
  posiciones se tienen que escribir de la última a la primera; con
  `"limite": true` (y `constantes`), el número suelto en la condición habiendo
  una constante con ese valor es la mejora `LIMITE_CON_NUMERO_SUELTO`.

Vale cualquier forma que llegue al resultado (`for`, `while`, `i += 2`, un `if`
adentro, una cuenta equivalente). Si no, dice dónde:
`RESULTADO_VALOR_DISTINTO` (qué posición, qué valor tiene y cuál se pide),
`RESULTADO_POSICION_SIN_VALOR` (el ciclo no llega a esa posición),
`INDICE_FUERA_DE_RANGO` (con `<=`, se llega a una posición que no existe),
`VARIABLE_SIN_VALOR` (se usa `i` sin darle valor) y `CICLO_NO_TERMINA`. Si usa
`pow` es correcto y excelente, con la nota `USO_DE_POW` (una vez por serie):
trabaja con decimales, y para un entero multiplicarlo por sí mismo es más
directo. El `#include <math.h>` lo escribe el alumno, al principio de su
respuesta: sin él, `pow` es el error `INCLUDE_FALTA_PARA_FUNCION` (la tabla
`BIBLIOTECA_DE` de `js/corrector.js` dice qué función necesita qué biblioteca;
solo la mira esta regla). Con
algo que no sabe seguir (una llamada, un `scanf`) es `EJECUCION_NO_VERIFICADA`:
correcto, pero no excelente.

**Los datos de la ficha completan los casos.** En `ejecuta` con `casos`, lo que
la ficha de la consigna muestra y el caso no dice (el mes y el día, si el caso
solo trae el año) tiene el valor de la ficha: así un alumno que usa otro campo
no recibe un "todavía no tiene un valor" que contradice lo que ve. Se toman
solo los números, y un arreglo solo si la ficha trae todas sus posiciones. El
caso manda: lo que dice el caso reemplaza a la ficha.

**El campo marcado se tiene que usar** (`CAMPO_MARCADO_SIN_USAR`): en un arreglo
de estructuras, si la ficha marca un campo con `marcar` (el que se suma, el que
se cuenta, el año) y el programa no lo lee en ninguna posición, el error es
"El programa nunca usa `alumnos[i].nacimiento.anio`, que es el dato que la
consigna pide mirar". No cuenta `marcarDestacado` (se lee solo si hay una
coincidencia). Los nombres de los mensajes salen como los escribe el alumno
(`alumnos[0].nacimiento.mes`), no como los guarda el simulador.

**Enumerados y `switch`** (grupo "Enumerados": declarar y usar, leer, mostrar):

- `{ "enum": { "enumeradores": ["MANANA", "TARDE", "NOCHE"], "valores": { "BAJA": 1 },
  "capturar": "E" } }`: los nombres, en orden, y sus valores. Sin `valores`, cada
  uno vale su posición; con ellos, el que se nombra vale eso y los que siguen,
  uno más que el anterior. Errores: `ENUM_FALTA`, `ENUMERADOR_FALTA`,
  `ENUMERADOR_NOMBRE`, `ENUMERADOR_ORDEN`, `ENUMERADOR_VALOR`, `ENUM_SIN_NOMBRE`;
  avisa `ENUMERADOR_DE_MAS`. El alias se pide con la regla `alias` de siempre
  (`"de": "$E"`); `variable` sirve con `"tipo": "TTurno"`. Una regla que usa
  lo que otra no pudo capturar (el enumerado sin nombre) se salta: el error ya
  está dicho.
- Con `"etiqueta": "Turno"` el enumerado tiene que llamarse así, `enum Turno
  {...};` (`ENUM_ETIQUETA`), y no hace falta alias. La serie "Declarar y usar"
  empieza así (enumerado, variable `enum Turno turno;`) y recién después da el
  alias (`typedef enum Turno TTurno;`) y el `typedef enum {...} TEstado;` en
  una sola sentencia. Un nombre de enumerado sin la palabra `enum`
  (`typedef Prioridad TPrioridad;`, `Turno turno;`) dice que falta `enum`, como
  con `struct`.
- **El valor de prueba prevalece sobre el código dado:** en `ejecuta` con
  `casos`, si el código que se le da a la consigna asigna una variable
  (`turno = TARDE;`) y el caso trae un valor de prueba para ella (`"datos":
  { "turno": "NOCHE" }`), esa asignación no la cambia. Las del alumno sí. Así la
  consigna puede mostrar un valor y probar con cualquiera.
- En `ejecuta`: `"conSwitch": true` pide un `switch` (`SWITCH_FALTA`) y
  `"conDefault": true` un `default` (`SWITCH_SIN_DEFAULT`). Un caso puede decir
  `"salida": "Tarde"`, el texto que tiene que mostrar (sin los espacios ni
  saltos del final): `MUESTRA_DISTINTA` o `MUESTRA_FALTA`, con un recuadro de lo
  que sale y lo que se pide. Los valores de `datos` y `queda` pueden ser el
  nombre del enumerador (`"turno": "TARDE"`): pasan a su número y los mensajes
  lo dicen con el nombre. Una letra en `entrada` (`"entrada": ["T"]`) llega
  como su código, y `scanf(" %c", &letra)` la lee.
- El simulador sigue un enumerado como un `int` (también un campo de una
  estructura y un cast `(TTurno) opcion`) y el `switch` con `case`, `default` y
  `break` (sin `break` pasa al caso que sigue).
- En todas las series: un caso con sentencias y sin `break` que no es el último
  es `SWITCH_SIN_BREAK`; un número suelto donde va el nombre del enumerado
  (`turno = 1`, `turno == 2`, `case 0:`) es la mejora `ENUM_CON_NUMERO`; leer con
  `scanf` directo en la variable del enumerado es la nota `SCANF_EN_ENUM` (una
  vez por serie).
- Un `if` o un ciclo que compara la variable del enumerado con un número
  (`turno <= 2`) también es `ENUM_CON_NUMERO`. En `ejecuta`,
  `"indicesConNombre": true` hace lo mismo con un índice escrito como número
  (`ventas[1]` donde va `ventas[TARDE]`): la serie "Arreglos con enumerados".
- Un dibujo de arreglo puede llevar `"nombres": ["MANANA", "TARDE", "NOCHE"]`: el
  nombre de cada posición, bajo su índice. La serie usa `#define TURNOS 3` en la
  cabecera y acepta `TURNOS`, `NOCHE + 1` y `3` (con la mejora de usar la
  constante). Una explicación de una opción equivocada no dice el valor correcto.
- **Un arreglo o una tabla que guarda enumerados** (series "Un arreglo de
  enumerados" y "Una tabla de enumerados"): `{ "variable": { "tipo": "TTurno",
  "nombre": "turnoDelDia", "valores": ["MANANA", "TARDE", ...] } }` pide los
  valores con los nombres de los enumeradores (una lista de listas, para una
  tabla); el corrector los pasa a su número y el alumno puede escribirlos con
  el nombre (correcto) o con el número (`ENUM_CON_NUMERO`). Un nombre de otro
  enumerado donde va uno de este (`LUNES` en un `TTurno`) es
  `ENUMERADOR_DE_OTRO_ENUMERADO`, en las asignaciones, en las listas de valores
  y en los elementos. En `ejecuta`, `datos` y `queda` aceptan nombres en un
  arreglo o en una tabla entera. `"indicesDe": { "agenda": [null, { "tipo":
  "TDia", ... }] }`: un `null` es un índice que no es de un enumerado (el
  empleado). El dibujo lleva `"enumerados": true` para mostrar los nombres sin
  comillas. Las consignas que definen con valores dejan los corchetes vacíos
  (`turnoDelDia[]`, `agenda[][DIAS]`), como en las series de valores.
- **Una tabla indexada con dos enumerados** (serie "Una tabla con enumerados"):
  `"indicesDe": { "ventas": [{ "tipo": "TDia", "uno": "un día", "varios": "los
  días" }, { "tipo": "TTurno", "uno": "un turno", "varios": "los turnos" }] }`
  en `ejecuta`: si un índice escrito es el nombre de otro enumerado (el turno
  donde va el día), es `INDICE_DE_OTRO_ENUMERADO`: "`TARDE` es un turno, pero
  el primer índice de `ventas` elige los días". Solo mira nombres escritos; con
  variables, el ciclo que se pasa da `INDICE_FUERA_DE_RANGO`. `indicesConNombre`
  también mira cada índice de una tabla (`ventas[2][1]`). El dibujo de una tabla
  lleva `"nombresFilas"` y `"nombresColumnas"` junto a los índices. El
  simulador llena una tabla con menos llaves (`= {0}`) en orden, como C.
- **Un enumerado como campo de una estructura** (serie "Un enumerado dentro de
  una estructura"): en la regla `struct`, `{ "nombre": "turno", "tipo":
  "enumerado", "de": "TTurno" }`; en `campo`, `{ "nombre": "turno", "tipo":
  "enumerado" }` (el valor sale de la ficha, que lo muestra con su nombre:
  `NOCHE`; con su número vale y es la mejora `ENUM_CON_NUMERO`; entre comillas,
  `ENUM_COMO_TEXTO`). En `ejecuta`, `"datos": { "alumnos.turno": ["NOCHE",
  "MANANA"] }` y `"queda": { "alumno.turno": "TARDE" }` aceptan los nombres, y
  los valores de la ficha que son nombres completan los datos del caso. El
  valor de prueba prevalece también sobre una asignación a un campo del
  código dado (`alumno.turno = TARDE;`). `SCANF_EN_ENUM` y `ENUM_CON_NUMERO`
  miran también los campos (`&alumno.turno`, `alumnos[i].turno == 2`).
- Con un enumerado en el resultado (`"queda": { "mejor": "NOCHE" }`) no se
  aplica la pista del acumulador que se pisa: el valor distinto se dice tal cual.

**Un `=` en una condición** (`if (x = 1)`, `while (n = 0)`, `for (...; i = MAX; ...)`,
también `+=` y similares): en todas las series, sin configurar nada, es el error
`ASIGNACION_EN_CONDICION` con "se usa `==`". Se deja pasar el idioma
`while ((c = getchar()) != '\n')`: una asignación simple, entre paréntesis y
comparada con algo (`revisarCondiciones` en `js/corrector.js`).

**Si la respuesta ya tiene un error** (uno de los que se ven sin ejecutar: un
arreglo de estructuras sin índice, una posición que no existe escrita, un campo
que no existe…), el código no se sigue: se dice ese error y nada más. Seguirlo
sería agregar un "no pude verificarlo" que no ayuda.

**Leer y mostrar números** (serie "Leer y mostrar un arreglo"): el intérprete
también sigue `scanf` y `printf` con `%d`, `%i`, `%f` y `%lf`, dándole al
programa los datos que "escribe el usuario". La regla es:

- `{ "ejecuta": { "entrada": [8, 5], "queda": { "notas": "entrada" }, "muestra": "entrada", "deArreglo": "notas", "pregunta": "Ingrese la nota %d:", "conCiclo": true, "limite": true } }`.
  `"entrada"` son los datos que se escriben; `"queda"` dice qué tiene que haber
  al final en cada arreglo (una lista, o `"entrada"` para lo escrito, en
  orden); `"muestra"` es la secuencia de números que tiene que mostrar (una
  lista, `"entrada"` o `"alReves"`); con `"deArreglo"` cuentan solo los que
  salen de una posición de ese arreglo, y lo que el alumno agregue (el número
  de alumno, un texto) no importa; `"pregunta"` es el mensaje que tiene que ir
  antes de cada lectura, con `%d` por el número de la que sigue (se compara sin
  mirar los espacios).

| Respuesta | Código | Mensaje |
|---|---|---|
| `scanf("%d", notas[0])` | `AMPERSAND_FALTA` | "A `notas[0]` le falta el `&` adelante": no explica por qué (los punteros vienen después). |
| `printf("%d", &notas[0])` | `AMPERSAND_DE_MAS` | `printf` muestra el valor, no el lugar. |
| `scanf("%d", &notas)`, `printf("%d", notas)` | `ARREGLO_SIN_POSICION` | Hay que decir cuál posición. |
| `%d` con un `float`, `%f` con un `int`, `%lf` con un `float` | `FORMATO_NO_CORRESPONDE_AL_TIPO` | Dice cuál es el formato del tipo. |
| más (o menos) conversiones que valores | `FORMATO_CANTIDAD_DISTINTA` | Tiene que haber uno por cada `%`. |
| no lee, o no muestra | `LECTURA_FALTA`, `MUESTRA_FALTA` | Pide usar `scanf` o `printf`. |
| lee más datos de los que se escriben | `LECTURA_DE_MAS` | Dice cuántos son. |
| muestra otros números, o en otro orden | `MUESTRA_DISTINTA` | Dice lo que muestra "cuando debería mostrar" tal cosa; si es un solo valor, de qué posición salió ("lo que hay en la posición 3 de `notas`"). |
| `notas[6]` en 5 posiciones | `INDICE_FUERA_DE_RANGO` | "`notas` tiene 5 posiciones, numeradas de 0 a 4: la posición 6 no existe." En un ciclo: "se llega a la posición 6, que no existe". |
| el número escrito en el programa | `MUESTRA_SIN_EL_ARREGLO` | Tiene que salir del arreglo. |
| otro mensaje | `TEXTO_DISTINTO` | Dice el mensaje que se pide. |

**Acumular y contar** (serie "Acumular y contar"): la misma regla `ejecuta`
con `"casos"`: el código se ejecuta una vez por cada caso, con otros valores
para los arreglos de una dimensión, y se compara lo que dio.

- `{ "ejecuta": { "casos": [ { "datos": { "ventas": [5, 3, 8] }, "queda": { "total": 16 } }, { "datos": { "notas": [7, 4] }, "muestra": [70] } ], "conCiclo": true, "limite": true } }`.
  `"datos"` reemplaza los valores con que se declara el arreglo (el mismo
  tamaño); `"queda"` es el valor final de cada variable; `"muestra"`, la
  secuencia de números que se muestra. El alumno ve un solo arreglo (el del
  `dado`) y su código se prueba con los otros: no vale escribir el resultado a
  mano. El primer caso lleva los valores del `dado`.
- El intérprete sabe el cambio de tipo (`(float) suma`) y que una cuenta entre
  dos enteros da un entero.

| Respuesta | Código | Mensaje |
|---|---|---|
| el valor distinto | `RESULTADO_VALOR_DISTINTO` | "Con `ventas` valiendo `5`, `3` y `8`, `total` termina valiendo `X` y debería valer `Y`." Todo número que es valor de una variable va entre acentos graves, con "y" antes del último. |
| una variable que no llega a recibir un valor | `RESULTADO_VARIABLE_SIN_VALOR` | Dice cuánto debería valer. |
| se usa sin darle valor antes | `VARIABLE_SIN_VALOR` | Hay que dárselo antes. |
| `total = 0;` adentro del ciclo | `ACUMULADOR_REINICIADO` | Se vuelve a poner en cada vuelta; esa línea va antes del ciclo. |
| `total = ventas[i];` en lugar de sumar | `ACUMULADOR_SE_PISA` | Se reemplaza el valor anterior en lugar de agregarle el nuevo. |
| `suma / cantidad` en un `float` | `DIVISION_ENTERA` | Dividir dos enteros da un entero; alguno tiene que ser decimal. |

**Buscar** (serie "Buscar en un arreglo"): la misma regla con `casos`, y tres
opciones más:

- `"busca": true` en la regla: no es una acumulación, así que no se buscan
  `ACUMULADOR_REINICIADO` ni `ACUMULADOR_SE_PISA`.
- `"extremo": true`: el resultado (el mayor, el menor) tiene que ser uno de los
  valores del arreglo. Si no, `EXTREMO_FUERA_DEL_ARREGLO`: el valor con que se
  empieza tiene que ser uno del arreglo.
- `"sinCortar": 4` en un caso: lo que queda si la búsqueda sigue después de
  encontrarlo (la última posición). Si el resultado es ese,
  `BUSQUEDA_SIN_CORTAR`. El mensaje no nombra `break`: el curso no lo usa, y
  `while (i < n && v[i] != x)` corta igual. `break` se acepta si lo escriben.

Los casos se eligen para pisar los errores típicos: valores repetidos (la
primera y la última posición), todos negativos (el mayor que empieza en cero),
todos positivos (el menor que empieza en cero) y un único elemento que falla,
primero, del medio o último (la bandera que vuelve a subir).

**Tamaño físico y lógico** (serie "Tamaño físico y tamaño lógico"): la misma
regla con `casos`, y estas ampliaciones:

- `"entrada"` en un caso: los datos que escribe el usuario en ese caso (si no,
  vale la de la regla). Sirve para leer hasta un `-1`: un caso con el `-1` al
  medio, uno sin `-1` que llena el arreglo y uno con más datos que lugar.
- `"datos"` también cambia el valor con que empieza una variable suelta
  (`{ "cantidad": 10 }`), y en un arreglo definido sin tamaño
  (`int notas[] = {...}`) la cantidad de valores: así no vale escribir el
  tamaño a mano.
- `"queda"` con una lista compara las primeras posiciones de un arreglo.
- `"centinela": -1` en la regla: el dato que marca el final. Si la cantidad
  termina valiendo una más, `CENTINELA_CONTADO`; si el programa sigue leyendo
  después, `LECTURA_DE_MAS` con un mensaje propio.
- El intérprete sabe `sizeof` de un tipo, de un arreglo y de un elemento
  (`char` 1, `short` 2, `int` y `float` 4, `long` y `double` 8), y una división
  o un resto por cero es `DIVISION_POR_CERO` (el mensaje dice con qué valores).
- Cuando falla un caso, los mensajes de posición que no existe, variable sin
  valor y ciclo que no termina empiezan con "Con `notas` valiendo …".

**Tablas** (serie "Tablas"): la regla `variable` con `valores` matriciales
define la tabla, y `ejecuta` con `casos` corrige el acceso a un elemento:

- `"datos"` y `"queda"` aceptan una lista de listas para una tabla (con la
  misma forma que la tabla declarada). Los mensajes nombran la posición con
  sus dos índices (`notas[2][1]`), y una fila de la tabla se escribe como en el
  código: "Con `notas` valiendo `{5, 8, 1, 4}`, `{0, 2, 9, 6}` y `{3, 7, 4, 8}`".
- Una fila o una columna que no existe dice "`notas` tiene 3 filas, numeradas
  de 0 a 2: la fila 3 no existe" (o "columnas"), igual que la revisión de los
  números escritos.

**Recorrer una tabla** (serie "Recorrer una tabla"): la misma regla `ejecuta`
con `casos`, para ciclos anidados:

- `"muestraEnFilas": [[120, 85], [175, 90]]` en un caso: lo que se muestra,
  fila por fila. El intérprete anota los números que salen en cada renglón
  (cada `\n` cierra uno) y se comparan renglón por renglón, sin mirar
  separadores ni textos agregados. Si los valores son los de la tabla pero no
  van en sus renglones, `TABLA_SIN_RENGLONES` (todo en uno, o uno por renglón);
  si no, `MUESTRA_DISTINTA` con las filas que muestra y las que debería.
- `"acumulado": { "totales": [505, 1125, 1600] }` en un caso: lo que queda en
  un arreglo si el acumulador no vuelve a cero en cada fila
  (`ACUMULADOR_SIN_REINICIAR_POR_FILA`).
- `"cambiadas": { "totales": [505, 620, 475] }` en un caso: lo que queda si la
  fila y la columna están cambiadas (`FILAS_Y_COLUMNAS_CAMBIADAS`). Con
  `[j][i]` en una tabla que no es cuadrada ya es "la fila N no existe".
- `"extremo"` ahora puede ser el nombre de la variable que tiene que ser uno de
  los valores de la tabla (`"extremo": "mayor"`), para que `fila` y `columna`
  no se comparen con los valores del arreglo.
- `sizeof(t[0])` es lo que ocupa una fila y `sizeof(t[0][0])`, un elemento: con
  eso se calculan las filas y las columnas. En `int t[][3]` la cantidad de
  columnas es parte de la declaración, así que las pruebas solo cambian las
  filas.

**Más de dos dimensiones** (serie "Más de dos dimensiones", el paso previo a las
tablas de cadenas): los casos de `ejecuta` aceptan listas anidadas de cualquier
profundidad en `datos`, `queda` y `muestraEnFilas`. Dos cosas propias:

- `{ "variable": { "tipo": "entero", "arreglo": { "tamano": [3, 30, 4], "unidades": ["cursos", "alumnos", "parciales"] } } }`:
  un arreglo numérico de tres dimensiones con el tamaño justo. `"unidades"`
  nombra cada corchete: "`notas` puede guardar 20 alumnos y hay que guardar
  30", "entre los primeros corchetes va la cantidad de cursos". Sin ella, los
  mensajes dicen "filas" y "columnas". Con otra cantidad de dimensiones dice
  cuáles pide: "un arreglo de tres dimensiones: una para los cursos, otra para
  los alumnos y otra para los parciales".
- Un índice que no existe en tres dimensiones dice "la posición N", en
  cualquier nivel: "fila" y "columna" son de las tablas.

**El dibujo y la salida, en las consignas que recorren una tabla.** Una consigna
que no define el arreglo (lo recorre, lo suma) puede llevar su propio dibujo:

```json
"dibujo": {
  "titulo": "La tabla `ventas`:",
  "valores": [[120, 85, 240, 60], [175, 90, 310, 45]],
  "filas": "sucursales", "columnas": "días",
  "resaltar": "diagonal",
  "arreglo": { "nombre": "totales", "valores": [505, 620, 475], "vertical": true }
},
"salida": "120 85 240 60\n175 90 310 45"
```

`filas` es el nombre de las filas, en vertical a la izquierda, y `columnas` el de
las columnas, arriba; `resaltar: "diagonal"` pinta de fondo la diagonal
principal; `arreglo` es el resultado que tiene que quedar, aparte de la tabla
y como cualquier arreglo (índices propios, bordes enteros): vertical, a la
altura de cada fila y con un espacio, con `"vertical": true`, o debajo con su
título. Si `valores` es una lista de tablas (tres dimensiones) se dibuja cada
una como `notas[0]`, `notas[1]`, con `"planos": "notas"`. `salida` es lo que tiene que mostrar el
programa, en un recuadro de consola, con su título "Así tiene que verse la
salida".

**Recorrer toda la tabla** (`"recorre": "tabla"` en la regla `ejecuta`, o
`{ "notas": ["el curso", "el alumno", "el parcial"] }` en tres dimensiones): el
intérprete anota qué filas y columnas se tocaron, y si el ciclo no llega a
todas es `RECORRIDO_INCOMPLETO`: "`tabla` tiene 4 filas y el ciclo no llega a
recorrerlas todas" (sin decir dónde se detiene: con `i = 1` y con `i < 2` el
"dónde" confunde). Se revisa antes que el valor.
Si el ciclo se pasa, "`tabla` tiene 4 filas, numeradas de 0 a 3, y el ciclo
llega hasta la fila 4, que no existe".

`"recorre"` sirve también para un arreglo de una dimensión y para uno de
estructuras (`{ "alumnos.promedio": ["el alumno"] }`: vale tocar cualquiera de
sus campos, y se dice `alumnos`), y se revisa también cuando la consigna corre
el código una sola vez (con `entrada`). Todas las consignas que recorren un
arreglo entero lo llevan, menos las que cortan a propósito (`busca`) y las que
muestran una parte (un solo curso). Si el ciclo ni toca un arreglo de una
dimensión, no es `RECORRIDO_INCOMPLETO`: lo dicen mejor los errores que siguen
(`MUESTRA_FALTA`, `MUESTRA_SIN_EL_ARREGLO`, `RESULTADO_VALOR_DISTINTO`).

**Un arreglo a medio cargar** (`"recorreHasta": { "letras": "cantidad" }`): el
ciclo tiene que leer las primeras `cantidad` posiciones, ni una menos
(`RECORRIDO_INCOMPLETO`) ni una más (`RECORRIDO_SE_PASA`: "el ciclo llega hasta
la posición 9 de `notas`, pero solo hay 4 cargadas"). La cantidad sale de los
datos del caso o del valor de esa variable. Cuenta lo que el programa *lee*, no
lo que escribió el código que da la consigna.

**Un nombre que no está declarado** (`MULTIPLICADOS` por `MULTIPLICANDOS`) es
el error `NOMBRE_NO_DECLARADO`, con "¿Quiso decir…?" si hay uno parecido, en
todas las series que se corrigen siguiendo el código. Los nombres de la
biblioteca (`NULL`, `EOF`, `stdin`…) no lo son.

**Los mensajes con salida de consola**: una tabla que no va en sus renglones o
con otros valores muestra lo que sacó el programa en un recuadro (campo
`bloques` del diagnóstico). Con los valores que el alumno ve en la consigna
(`"visible": true` en el primer caso) no se repite "Con `ventas` valiendo…" ni
lo que debería mostrar, que ya tiene arriba; con otros valores se muestran los
dos recuadros, "El programa muestra" y "Debería mostrar".

Un cuestionario puede agregar una suposición al enunciado ("y suponiendo que
cada `int` ocupa 4 bytes"), como el "si usted escribe" de los que leen.

Los errores de posición que ya existen (`INDICE_FUERA_DE_RANGO`,
`RESULTADO_POSICION_SIN_VALOR`, `RESULTADO_VALOR_DISTINTO`) valen también acá. La
`cabecera` de esa serie trae el `#include <stdio.h>`: no se ve en las consignas
de sentencias, pero sí en los programas de los cuestionarios.

Los nombres de variable de una sola letra se dejan para los índices (`i`, `j`),
los tamaños (`n`) y algún uso particular: en el resto, un nombre que diga qué
guarda (`dato`, `valores`, `resultado`) hace más fácil seguir el código.

Una opción de un cuestionario puede no llevar `valor` (solo `texto`: "No se
puede saber"); no se escribe `"valor": "undefined"`, que no es un valor de C. Un cuestionario
que continúa puede llevar `"codigo": ""`: muestra solo el programa que dejaron
las consignas anteriores, con las respuestas del alumno, y pregunta por él.

Para leer y mostrar una cadena hay tres reglas propias (grupo Cadenas, serie "Leer y mostrar una cadena"):

- `{ "lee": { "destino": "$N", "formato": "palabra" } }`: leer del teclado
  el texto de una variable o de una posición (`"curso[0]"`). `"palabra"` es
  `scanf` con `%s`; `"linea"` es hasta el Enter, con sus espacios: `gets`,
  `fgets` o `scanf` con `%[^\n]`.
- `{ "muestra": { "destino": "$N", "formato": "Hola, %s", "despuesDeLeer": true } }`:
  mostrarla con `printf` (un `%s` por cada valor, con su formato) o `puts`.
  `"formato"` pide ese texto (el `\n` del final no cuenta) y `puts` no vale
  entonces; `"despuesDeLeer"` pide que haya una lectura antes. Con un formato
  de la forma `texto%s` vale también el texto en un `printf` y el nombre en la
  llamada que sigue (`puts(nombre)` o `printf("%s", nombre)`), sin mejora: en
  pantalla es lo mismo. El texto tiene que ser justo ese, sin salto de línea
  en medio, y el saludo va antes que el nombre.
- `{ "limpiaEntrada": true }`: entre un `scanf` y un `gets` o `fgets` tiene
  que haber algo que descarte el Enter que quedó sin leer.

Y un `ciclo` con `"filasDe"` puede llevar `"lee": "palabra"`, que en lugar de
vaciar pide leer en `curso[i]` en cada vuelta.

| Respuesta | Código | Mensaje |
|---|---|---|
| `scanf("%s", &nombre)` | `ARGUMENTO_CON_AMPERSAND` | Le sobra el `&`; no explica por qué. |
| `scanf("%s", nombre)` | `LECTURA_SIN_LIMITE` (mejora, con `claridad`) | Dice el límite justo para esa variable (`%25s`). |
| `scanf("%26s", nombre)` con lugar para 25 letras | `LECTURA_SIN_LUGAR_PARA_FIN` | Falta el lugar del `'\0'`. |
| `scanf("%d", nombre)`, `printf("%d", nombre)` | `FORMATO_NO_ES_TEXTO` | Cada tipo de dato tiene su formato. |
| `scanf("%s", nombre)` donde se pide la línea | `LECTURA_CORTA_EN_ESPACIO` | `%s` se detiene en el espacio; nombra `gets`. |
| `gets(nombre)` | `USO_DE_GETS` (nota, una vez por serie) | "Su respuesta es correcta. Solo una advertencia…": sirve para practicar, no para programas reales; nombra `fgets` sin mostrar cómo. La respuesta sigue siendo excelente. |
| `scanf` en `nombre` y después `strcpy(curso[0], nombre)` | `LECTURA_CON_INTERMEDIA` (mejora, con `claridad`) | Se puede leer directo en la posición. |
| ídem, con `nombre` más grande que cada texto de `curso` | `LECTURA_MAS_GRANDE_QUE_LA_POSICION` | Dice los dos tamaños. |
| ídem, sin copiar | `LECTURA_FALTA_COPIAR` | Lo leído queda en `nombre`. |
| `fgets(nombre, 100, stdin)` con lugar para 26 | `LECTURA_SIN_LUGAR` | Lo que sobra pisa la memoria. |
| `printf("nombre")`, `printf(nombre)` | `MUESTRA_TEXTO_FIJO`, `PRINTF_SIN_FORMATO` | Falta el `%s`; o el primer argumento es el formato. |
| mostrar antes de leer | `MUESTRA_ANTES_DE_LEER` | Todavía no tiene el texto. |
| `scanf("%d", &x); gets(s);` | `FALTA_LIMPIAR_ENTRADA` | Queda el Enter sin leer y `s` queda vacío. |
| `while (getchar() != '\n');` | (nada) | Es la forma que anda en cualquier plataforma. |
| `getchar();` | `GETCHAR_UN_SOLO_CARACTER` (mejora, siempre) | Alcanza si no se escribió nada más antes del Enter. |
| `fflush(stdin);` | `FFLUSH_ENTRADA` (mejora, siempre) | Depende del compilador; propone el ciclo. |
| el ciclo después de `gets`, con `==` o sin mirar el Enter | `LIMPIEZA_DESPUES`, `LIMPIEZA_AL_REVES`, `LIMPIEZA_SIN_ENTER` | Qué falla del ciclo. |

`USO_DE_GETS` es una **nota** y no una mejora (ver "Buenas prácticas"): no quita
lo excelente, porque `gets` es lo simple para quien recién empieza. Por eso la
`referencia` puede usarlo. Si lo que se lee tiene que ir a una posición de un
arreglo, vale leer en una variable y copiarla con `strcpy`, siempre que entre.

Un texto entre comillas dobles con el fin escrito de más (`"Hola\0"`) es el mismo
texto: vale, con la mejora `FIN_EN_EL_TEXTO` (el compilador ya lo agrega). Vale
igual en `strcpy`, `strcmp` y en un arreglo de cadenas. Entre comillas simples
(`'Hola'`) es un error con su mensaje (`CADENA_CON_COMILLAS_SIMPLES`).

Para cualquier consigna, y sin pedirlo: una posición que no existe
(`nombres[30]` en un arreglo de 30 textos, `INDICE_FUERA_DE_RANGO`) y un texto
asignado a un carácter (`ELEMENTO_ENTRE_COMILLAS_DOBLES`) son errores. Y una
dimensión puede ser una cuenta sencilla (`MAX + 1`, `10 + 1`).

**Los mensajes dicen qué parte de la posición está mal**, cuando los índices
son números escritos (si no, queda el mensaje general):

| Respuesta | Código | Mensaje |
|---|---|---|
| `nombres[0] = 'L'; nombres[1] = 'u'; ...` | `ELEMENTOS_COMO_UNA_SOLA_CADENA` | Una vez: `nombres` guarda varias cadenas y hacen falta dos índices. |
| `nombres[i] = '\0';` | `ASIGNACION_CARACTER_A_CADENA` | Una cadena completa no recibe un carácter; con `'\0'`, recuerda que va en la primera posición. |
| el texto en `nombres[2][k]` en lugar de `[1]` | `ELEMENTOS_OTRA_POSICION` | Dice dónde está (y si el texto está bien escrito). |
| `datos[0][0][k]` en lugar de `datos[1][0][k]` | `ELEMENTOS_FILA_DISTINTA`, `_COLUMNA_DISTINTA`, `_FILA_Y_COLUMNA_DISTINTAS` | Cuál de las dos no es. |
| `strcpy(datos[2], ...)` | `ARGUMENTO_FALTA_INDICE` | Es un arreglo de cadenas: falta el segundo índice. |
| `strcpy(datos[2][1], ...)` | `ARGUMENTO_FILA_DISTINTA`, `_COLUMNA_DISTINTA`, `_FILA_Y_COLUMNA_DISTINTAS` (`ARGUMENTO_OTRA_POSICION` con un solo índice) | Cuál no es. Una cuenta (`1 + 1`) o una constante se evalúan. |
| `strcpy(datos[i][1], ...)` | `ARGUMENTO_POSICION_CON_VARIABLE` | `i` no es un número: la consigna pide una posición concreta. |
| `strcpy("Perez", datos[2][1])` | `ARGUMENTOS_EN_OTRO_ORDEN` | El orden se dice primero, aunque la celda tampoco sea la pedida. |

Si la posición escrita es justo la que sigue a la pedida (se contó desde 1),
el mensaje agrega que las posiciones se numeran desde 0. Lo repetido en varias
líneas se dice una vez ("lo mismo ocurre en las otras 4 asignaciones").

### Uniones

Grupo "Uniones" (`uniones-declarar.json`, `uniones-etiqueta.json`).

- **Una unión es una estructura marcada.** El modelo la guarda en
  `modelo.structs` con `union: true`, y el tipo de una variable lleva
  `union: true`: por eso las reglas `variable`, `alias` y `campo` andan sin
  cambios. Lo que se distingue es la palabra: una `struct` donde se pide una
  `union` (o al revés) es `UNION_FALTA` / `STRUCT_FALTA` con el aviso de que
  se declara con la otra palabra.
- **Regla `union`**: igual que `struct`, con `campos` (en los mensajes son
  "miembros"). `UNION_FALTA`, `UNION_SIN_NOMBRE`, y los de los campos
  (`CAMPO_FALTA`, `CAMPO_NOMBRE`, `CAMPO_TIPO`, `CAMPO_DE_MAS`). Un campo de una
  estructura que es una unión se pide con `{ "nombre": "medida", "tipo":
  "union", "de": "TMedida" }`.
- **Nombres**: `Medida unaMedida;` y `struct Medida unaMedida;` (cuando
  `Medida` es una unión) dicen que es una unión y con qué palabra se nombra
  (`TIPO_DESCONOCIDO`). Una unión entera donde va un número es
  `CAMPO_ES_UNA_ESTRUCTURA`, dicho con "unión".
- **`campo` con `valor`**: `{ "nombre": "real", "tipo": "real", "valor": "36.5" }`
  fija el valor que se guarda cuando la consigna no tiene ficha (la unión no
  tiene ficha). El mensaje dice "no es el que pide la consigna". La regla de
  un camino (`lectura.medida`) no se queja de los campos de la variable de
  afuera (`lectura.tipo`), ni al revés.
- **El simulador comparte el lugar**: guardar en un miembro deja sin valor a
  los otros. Leer uno de esos es **`UNION_MIEMBRO_NO_VIGENTE`** ("lo último que
  se guardó fue en `real`"), distinto de `VARIABLE_SIN_VALOR` (nadie guardó
  nada). `sizeof` de una unión (su tipo o una variable) es lo del miembro más
  grande; el de una estructura no se sigue (depende de la máquina).
- **Valores de prueba de una unión en un arreglo**: en cada posición solo uno
  de los miembros trae valor y los demás `null`:
  `"lecturas.medida.real": [36.5, null, 18.5]`,
  `"lecturas.medida.entero": [null, 7, null]`. Con eso se sabe cuál es el
  vigente en cada una, y leer otro es `UNION_MIEMBRO_NO_VIGENTE`. Si la
  prueba da un miembro, el código dado no guarda en los otros del mismo
  grupo (no pisa el valor de prueba).
- **Dibujo de una unión**: `"dibujo": { "titulo": "...", "union": { "nombre":
  "lectura", "miembros": ["entero", "real", "letra"], "vigente": "real",
  "valor": "36.5" } }`. Un solo lugar con los nombres de los miembros arriba y el
  vigente marcado; sin `valor`, el lugar queda vacío.

### Funciones

Grupo "Funciones y ámbito" (oculto hasta habilitarlo). El orden sigue una
cadena de necesidades: cada tema nace de un problema del anterior.

1. `funciones-definir.json`: funciones sin retorno (definir, llamar, prototipo).
2. `funciones-variables.json`: las variables de una función nacen y mueren en
   cada llamada.
3. `funciones-ambito.json`: ámbito de una variable (una función, unas llaves).
4. `funciones-globales.json`: las globales, la salida tentadora, y por qué
   conviene evitarlas.
5. `funciones-parametros.json`: parámetros por valor (la llamada asigna el
   argumento al parámetro, y por eso es una copia).
6. `funciones-parametros-compuestos.json`: estructuras (se copian), y
   arreglos, cadenas y tablas (no se copian), solo para mostrar.
7. `funciones-devolver.json`: funciones con retorno (la llamada vale lo que
   devuelve; mostrar frente a devolver; el tipo de retorno trunca).
8. `funciones-devolver-estructura.json`: devolver una estructura (`leerAlumno`)
   y que un arreglo no se devuelve.
9. `funciones-varios-valores.json`: una función devuelve un solo valor (la coma
   de `return a, b;`), y una estructura agrupa varios.

Los parámetros por referencia están en el grupo Punteros (oculto), en
`punteros-referencia.json` (serie 3). `punteros-arreglos.json` (el cuestionario
del `sizeof` de un arreglo recibido) es por ahora una serie provisoria del mismo
grupo.

El plan de la reestructuración está en la memoria del proyecto
(`funciones-ambito-flujo`).

- **Regla `global`**: `{ "global": { "nombre": "veces", "tipo": "entero" } }`. La
  consigna pide declarar una variable global: `GLOBAL_FALTA`, y
  `GLOBAL_DENTRO_DE_FUNCION` si la declaró adentro de una función (el mensaje
  explica que desaparece al terminar). Si la declaró sin valor inicial es
  correcto (una global empieza en `0`), pero sale una **nota** `GLOBAL_SIN_VALOR_INICIAL`
  que aconseja escribir `= 0`.
- **Parámetros de la regla `funcion`**: además de `entero`, `real` y `caracter`,
  `{ "tipo": "estructura" }` (una estructura por valor, no unión) y
  `{ "tipo": "entero", "arreglo": true, "dimensiones": 2 }` (una tabla; sin
  `dimensiones`, un arreglo cualquiera). Una cadena es un arreglo de `caracter`.
- **Probar una función con datos compuestos**: el caso de `ejecuta` puede traer
  `antes` (declaraciones escritas, p. ej. `"TFecha f;"`, cuyos campos salen de
  `datos` con `"f.dia": 10`), un arreglo o una tabla en `datos` (una lista de
  listas) y un **texto** (`"datos": { "texto": "Ana" }`, que es una cadena con su
  `'\0'`; ojo: un texto de una sola letra se toma como carácter, así que las
  pruebas usan al menos dos).
- **El simulador copia las estructuras** que se pasan por valor, y un arreglo o
  una tabla recibidos son los mismos. También sigue la copia de una estructura en
  otra (`a = b;`), una función que **devuelve** una estructura (`return r;`) y
  declarar con lo que devuelve (`TDivision r = dividir(17, 5);`).
- **Retorno de enumerado**: `"retorna": "enumerado"`, y en los casos
  `"devuelve": "VERDADERO"` se compara con lo que vale ese enumerador en el
  enumerado del alumno.
- **`printf` con `%s`**: el simulador muestra una cadena (un arreglo de
  caracteres, hasta su `' '`) o un texto escrito.
- **`ARGUMENTO_NUMERO`**: la regla `llamada` pide un número escrito en la llamada
  (`"21"`) y el alumno pasó una variable u otro número.
- **Retorno de estructura**: `{ "funcion": { "retorna": "estructura", ... } }` pide
  una estructura (no una unión), y el caso de `ejecuta` lo comprueba **campo por
  campo**: `{ "llama": "$D(17, 5)", "devuelve": { "cociente": 3, "resto": 2 } }`
  (`DEVUELVE_DISTINTO`; `DEVUELVE_CAMPO_FALTA` si la estructura no tiene el campo
  y `DEVUELVE_CAMPO_SIN_VALOR` si no llega a tener valor). Un campo de texto no
  se sigue en el simulador, así que las estructuras de las consignas son de
  números.
- **`DEVUELVE_EN_VEZ_DE_MOSTRAR`** (la consigna pide una función `void` y el
  alumno la declara con `return`) y la pista de la división entera en
  `DEVUELVE_DISTINTO`.
- **Las globales empiezan en `0`** en el simulador, como en C, y un dato de
  prueba (`datos`) sobre una global le da su valor inicial en lugar de declarar
  otra variable adentro de la prueba.
- **La respuesta antes de `main`**: si la consigna trae `dadoEnMain` (o
  `despues`) y su respuesta va afuera, la respuesta se arma **arriba de
  `main`**, como se le muestra, para que `main` pueda usar lo que el alumno
  escribe.

- **`MUESTRA_EN_VEZ_DE_DEVOLVER`**: si la consigna pide que la función devuelva
  un valor y el alumno la declara `void` y la muestra con `printf`, el mensaje
  dice que el resultado se entrega con `return` y lo usa quien llama.
- **Código dado alrededor de la respuesta**: una consigna puede traer
  `archivoDado` (código de afuera de `main` que ve solo ella, por ejemplo una
  función ya hecha, para no depender de cómo resolvió la anterior),
  `dadoEnMain` (código dado dentro de `main` cuando su respuesta va afuera) y
  `despues` (código de afuera que va **después** de `main`). Con `despues`, la
  respuesta va **arriba de todo**, antes de `main`: así se ve por qué hace
  falta un prototipo.
- **Argumentos de la regla `llamada`**: además de nombres, textos y campos,
  aceptan números (`"21"`) y variables con `&` (`"&contador"`).

- **El modelo** (`modelo.funciones`) guarda cada función definida y cada
  prototipo: nombre, tipo que devuelve, parámetros (nombre, tipo, `arreglo`,
  `punteros`) y cada `return` (con o sin valor).
- **Regla `funcion`**: `{ "funcion": { "retorna": "entero" | "real" |
  "caracter" | "void", "parametros": [{ "tipo": "entero", "referencia": true }],
  "capturar": "F" } }`. Acepta **cualquier nombre** (con `nombre` se pide uno) y
  captura el que el alumno puso, para usarlo después como `$F`. Códigos:
  `FUNCION_FALTA`, `FUNCION_TIPO_RETORNO`, `PARAMETROS_CANTIDAD`,
  `PARAMETRO_TIPO`, `PARAMETRO_REFERENCIA_FALTA` (el que modifica lo de afuera
  y no lleva `*`), `PARAMETRO_ASTERISCO_DE_MAS`, `RETORNO_FALTA`,
  `RETORNO_EN_VOID`. Un parámetro `"arreglo": true` es `v[]` o con `*`.
- **Regla `prototipo`**: `{ "prototipo": { "de": "$F" } }`. `PROTOTIPO_FALTA`,
  `PROTOTIPO_NOMBRE`, `PROTOTIPO_NO_COINCIDE` (el tipo o los parámetros).
- **Probar una función**: un caso de `ejecuta` con `llama` y `devuelve`:
  `{ "llama": "$F(3, 4)", "devuelve": 7 }`. El corrector arma una función
  aparte (`__prueba`) que declara las variables de `datos` y hace la llamada;
  el resultado se compara con `devuelve` (`DEVUELVE_DISTINTO`) y las variables
  con `queda`, así que sirve también para los parámetros por referencia:
  `{ "datos": { "a": 3, "b": 8 }, "llama": "$I(&a, &b)", "queda": { "a": 8, "b": 3 } }`.
  Con `salida` se comprueba lo que muestra la función.
- **El simulador** sigue las funciones del programa: ámbito propio, parámetros
  por valor (una copia), `return`, recursión (con tope) y variables globales.
  Un arreglo pasado es el mismo arreglo. Sabe un **subconjunto mínimo de
  punteros**: `&variable` (o `&arreglo[i]`) al llamar, un parámetro declarado con
  `*` y `*x` adentro; nada de aritmética de punteros. Entra por `practica`
  (o `main`); las funciones se conocen aunque estén definidas después.
- **Errores de la receta `&` / `*`**, todos con la fórmula completa
  ("`&` al llamarla, `*` en la declaración del parámetro y `*` cada vez que se
  lo usa adentro"): `LLAMADA_SIN_AMPERSAND`, `LLAMADA_CON_AMPERSAND` (el
  parámetro no lleva `*`), `PARAMETRO_SIN_ASTERISCO_AL_USARLO` (`x = 5;` en vez
  de `*x = 5;`) y `ASTERISCO_DE_MAS`. Los mensajes no nombran el concepto de
  puntero.
- **Otros**: `LLAMADA_ARGUMENTOS_CANTIDAD`, `FUNCION_SIN_RETORNO` (se usa el
  valor de una función que no devuelve nada), `VOID_COMO_VALOR`,
  `FUNCION_NO_DECLARADA` y `LLAMADA_ANTES_DE_DEFINIR` (sin prototipo antes).
  Estos dos solo cuando el programa define funciones propias.
- **La regla `llamada`** acepta `"funcion": "$F"`.

### Ámbito de las variables

Las series de ámbito (2, 3 y 4 de "Funciones y ámbito") son casi todo
cuestionarios (predecir qué muestra o si compila) y unas pocas consignas de
código.

- **El simulador tiene ámbito de bloque**: lo declarado entre llaves, o en el
  encabezado de un `for`, desaparece al terminar el bloque, y una variable de
  adentro con el mismo nombre tapa a la de afuera.
- **`NOMBRE_FUERA_DE_ALCANCE`**: un nombre declarado más arriba pero en un lugar
  que ya no existe. Si es de otra función, el mensaje dice que es local de esa
  función y que lo que otra necesita le llega por parámetros y `return`; si es de
  un bloque que terminó, que hay que declararla antes del bloque.
  **`NOMBRE_USADO_ANTES`**: se usa antes de declararla.
- **Regla `sinGlobales`**: `{ "sinGlobales": true }`. Error `GLOBAL_DE_MAS` si lo
  que escribió el alumno declara una variable afuera de las funciones.
- **Código dado de la consigna**: se usan `archivoDado`, `ejemplo` y `salida`
  (ver las series de funciones).

### Punteros

El grupo Punteros (oculto por ahora) empieza con dos series: "Dónde vive una
variable" (`punteros-direcciones`, solo cuestionarios) y "Variables puntero"
(`punteros-variables`).

- **Figura de memoria**: `"dibujo": { "titulo": "...", "memoria": [...] }`. Cada
  celda es una variable: `{ "nombre": "x", "valor": 5 }`, o un puntero
  `{ "nombre": "p", "puntero": true, "apunta": "x" }`. Las direcciones son
  inventadas y fijas: empiezan en 1000 (`"desde"` las cambia) y avanzan lo que
  ocupa cada tipo (`int` y `float` 4, `char` 1, `double` 8, un puntero 8; con
  `"tipo"` en la celda se cambia, y `"direccion"` fija una). Un puntero que
  `apunta` guarda la dirección de su destino y lleva una flecha. Un `valor` null
  se dibuja como `?` (sin valor todavía). Las direcciones salen de
  `celdasDeMemoria` (`js/enunciado.js`), que se puede probar sola.
- **Regla `puntero`**: `{ "puntero": { "tipo": "entero", "nombre": "p", "capturar": "P" } }`.
  Pide una variable declarada con un `*` (`int *p;`, con o sin valor inicial).
  `PUNTERO_FALTA`, `PUNTERO_FALTA_ASTERISCO` (declaró una variable común),
  `PUNTERO_NOMBRE` y `PUNTERO_TIPO` (apunta a otro tipo del pedido). A quién
  apunta no se mira acá: lo dice el caso de `ejecuta`.
- **Caso `apunta`**: en `ejecuta`, `{ "apunta": { "$P": "n" } }` pide que `P`
  termine apuntando a `n`. `PUNTERO_SIN_APUNTAR` y `PUNTERO_APUNTA_A_OTRO`.
- **Regla `usaContenido`**: `{ "usaContenido": { "de": "p", "para": "mostrar el valor de n" } }`.
  Exige un `*p` (o `*(p + 2)`: cuenta cualquier nombre que esté después del `*`)
  en lo que escribió el alumno (`CONTENIDO_FALTA`), para las consignas que piden
  llegar a la variable "a través del puntero". Va después de `ejecuta`, y no
  dice nada si ya hay otro error.
- **Regla `avanza`**: `{ "avanza": { "de": "p", "para": "recorrer el arreglo" } }`.
  Exige que el puntero avance (`p++`, `p--`, `p += 1`; `AVANCE_FALTA`). Con
  `"de": "*"`, cualquier variable o parámetro puntero.
- **El simulador** sigue variables puntero (`int *p;`, `int *p = &n;`,
  `p = &n;`, `q = p;`, `NULL`), `*p` para leer y escribir, y pasarlas a una
  función. El nombre de un arreglo vale la dirección de su primer elemento
  (`p = v;`) y se siguen `p + k`, `p - k`, `*(p + k)`, `p[k]`, `p++`, `p--`,
  `p += k`, `*p++` y `&v[k]`; un puntero corrido fuera del arreglo da
  `INDICE_FUERA_DE_RANGO` al leerlo o escribirlo (una posición después del
  final se puede tener, no leer). Un arreglo recibido por una función es una
  dirección: `sizeof(v)` da `8`. Quedan "sin verificar" la resta y la
  comparación entre punteros y las cuentas con punteros fuera de un arreglo.
  Errores: `PUNTERO_SIN_ASTERISCO` (`printf("%d", p)`),
  `PUNTERO_SIN_AMPERSAND` (`p = n;`), `PUNTERO_CON_UN_VALOR` (`p = 10;`),
  `PUNTERO_TIPO_DISTINTO` (`int *p = &f;` con `f` float),
  `DIRECCION_EN_UNA_VARIABLE` (`n = &x;`, `*p = &x;`) y `PUNTERO_SIN_DESTINO`
  (`*p` sin haberle dado una dirección, o con `NULL`) y `PUNTERO_EN_SCANF`
  (`scanf("%d", &p)` o `*p` con `p` ya declarado con `*`: se le pasa tal cual).
  Los mensajes de los parámetros por referencia nombran al puntero. Un parámetro declarado
  con `*` sigue con sus mensajes de siempre (`PARAMETRO_SIN_ASTERISCO_AL_USARLO`).

El grupo tiene, en este orden, `punteros-direcciones`, `punteros-variables`,
`punteros-referencia`, `punteros-aritmetica` ("Arreglos y punteros"),
`punteros-arreglos` ("Arreglos que cambian dentro de una función"),
`punteros-estructuras` ("Punteros a estructuras") y, al final,
`punteros-acceso` ("Dar el menor acceso", a rehacer). Están ocultas las dos
últimas.

- **Memoria con arreglos**: una celda `{ "nombre": "v", "arreglo": [10, 20, 30] }`
  se dibuja como una celda por elemento (`v[0]`, `v[1]`, ...) con direcciones
  seguidas. Un puntero apunta a un elemento (`"apunta": "v[1]"`) o, con el nombre
  del arreglo (`"apunta": "v"`), al primero.
- **Memoria con estructuras**: una celda `{ "nombre": "alumno", "estructura": [
  { "nombre": "legajo", "valor": 20431 }, { "nombre": "promedio", "valor": 8.5,
  "tipo": "float" } ] }` se dibuja como una celda por campo (`alumno.legajo`,
  `alumno.promedio`), seguidas. Un puntero con `"apunta": "alumno"` llega al primer
  campo, y `"tipo": "TAlumno"` en el puntero cambia lo que dice su etiqueta.
- **Punteros a estructuras (simulador)**: `TAlumno *p = &alumno;`, `p = &alumno;`,
  `p->campo`, `(*p).campo` y `&p->campo` (también en `scanf`), `p->a.b` con
  estructuras de adentro, y un parámetro `TAlumno *a` al que se le pasa `&alumno`
  (o un puntero que ya apunta a una estructura). Un puntero a una estructura guarda
  `{ nombre, claves }`: el nombre de la variable y sus campos tal como son, no
  copiados. Quedan sin verificar los arreglos de estructuras con punteros, `p++`
  sobre ellos y los campos que son punteros. Errores nuevos: `PUNTO_CON_PUNTERO`
  (`p.edad`, o `*p.edad`, que C lee como `*(p.edad)`) y `FLECHA_CON_VARIABLE` (`alumno->edad`)
  también al ejecutar, además de en las reglas de campo; `LLAMADA_SIN_AMPERSAND`,
  `PUNTERO_SIN_AMPERSAND`, `PUNTERO_TIPO_DISTINTO` y `PUNTERO_SIN_DESTINO` valen igual
  que con números. La regla `funcion` acepta `{ "tipo": "estructura", "referencia": true }`
  para un parámetro puntero a una estructura.
- **`sigueDe` no arrastra el `archivoDado`** de la consigna de la que sigue (por
  ejemplo, una estructura declarada ahí): si la que sigue la necesita, la repite o trae
  todo en su propio `archivoDado`.
- **`"deja": "arreglo"`** en la regla `funcion`: el error de devolver con
  `return` en una función `void` dice que el resultado se deja en el arreglo que
  recibe, no que se muestra con `printf`.

- **Figura `escalera`**: `"dibujo": { "titulo": "...", "escalera": true }`. Tres
  escalones fijos (una copia, esa variable, todas las variables), de menos a más
  acceso. Sin resaltado: en los cuestionarios no puede marcar la respuesta.
- **Parámetro "libre"**: en la regla `funcion`, `"referencia": "libre"` deja que
  el alumno elija entre recibir el dato por valor o por referencia (con un
  arreglo sigue siendo error).
- **Mejora `REFERENCIA_INNECESARIA`**: en `ejecuta`, `"referenciaInnecesaria":
  true`. Si algún parámetro por referencia nunca cambia de valor en los casos, la
  respuesta es correcta pero se avisa que alcanza con recibirlo por valor.
- **Llamadas de prueba con números**: en `llama`, un número donde la función
  recibe un puntero (`$S(3, 4)` con `int *a, int b`) se guarda en una variable
  y se pasa su dirección, así que el mismo caso sirve para una función por valor
  o por referencia.

### Consignas de opciones

En un enunciado, lo que va entre acentos graves (`nombre`, `"Maria"`, `1`) se
muestra en estilo de código, igual que lo que capturó el alumno (`{C}`): que
un nombre no se lea como una palabra más. Va en estilo de código lo que
aparece tal cual en el código (nombres, funciones, índices, valores, textos
con sus comillas) y no las cantidades del problema ("hasta 10 letras").

Las preguntas de cuánto vale algo se escriben siempre igual: "Después de
ejecutar el código de abajo, ¿qué valor tendría `x`?" o "¿qué contendría
`nombre[1]`?". Es un seguimiento mental: el presente ("se ejecuta") se leía
como algo que ocurre ante el alumno.

Una consigna con `"opciones"` se responde eligiendo, no escribiendo. Sirven
para lo que no se puede corregir sin ejecutar: "¿cuánto vale `n` al terminar
el ciclo?".

```json
{
  "id": "cadenas-q-strlen",
  "titulo": "Cuántas letras tiene",
  "continua": true,
  "enunciado": "Con el texto que guardó en {C}, ¿cuál es el valor de longitud?",
  "codigo": "int longitud = strlen({C});",
  "opciones": [
    { "valor": "{N}", "texto": "el tamaño que usted declaró", "codigo": "OPCION_TAMANO_DECLARADO",
      "explicacion": "`strlen` no mira el tamaño con el que se declaró la cadena..." },
    { "valor": "4", "texto": "la cantidad de letras", "correcta": true,
      "explicacion": "`strlen` cuenta las letras hasta el primer `'\\0'`..." }
  ]
}
```

- **Una sola correcta**, y cada equivocada con su `codigo` y su
  `explicacion`: cada opción es un error de concepto con nombre, y los
  intentos quedan anotados con ese código. Las pruebas lo verifican.
- **La correcta también lleva `explicacion`**: por qué es la correcta, para
  que un acierto por azar no deje al alumno sin saber por qué. Se muestra
  siempre debajo del "Correcto.", con el azul de una nota, y no se anota en los
  intentos. Dice la regla y, cuando ayuda, lo que la distingue de la confusión
  que atacan las equivocadas. Las pruebas piden que toda opción la tenga.
- `codigo` es el código que se muestra (con `{C}` el nombre que eligió el
  alumno). Las opciones y las explicaciones también pueden usar `{C}`, `{N}`.
  **Se muestra como un programa completo**: lo de la consigna (y, si
  continúa, lo que dejaron las anteriores) dentro de `int main() {` con su
  `return 0;`, en una sola caja, sin "El código hasta acá" aparte. Lo que va
  fuera de `main` (un `typedef`) se escribe en `"archivo"`; el `#define` se ve
  arriba solo. No lleva el comentario de "su respuesta va aquí": no hay nada
  que escribir.
- `valor` es lo que la opción vale (`11`, `'\0'`), y `texto` lo que dice de él: se
  muestran separados. Una opción sin valor (`No se puede saber`) lleva solo
  `texto`.
- Las opciones se muestran **mezcladas, con un orden fijo para cada alumno**.
- No agrega código a lo que sigue, salvo que la consigna diga `"queda": true`:
  entonces su `codigo` aparece en "El código hasta acá" de las siguientes (la
  de `strlen` deja `int longitud = strlen(frase);` para que otra lo use). Un
  cuestionario puede tener `"codigo": ""` y `"continua": true`: no agrega
  nada y muestra el código del alumno, para preguntar sobre lo que ya declaró
  (`cadenas-q-vacia-cero`).
- El resumen final muestra la opción elegida con los nombres que tenía en esa
  consigna.
- Una consigna de opciones no tiene "Ver una solución".

### Consignas de sentencias

Para pedir código que va dentro de una función ("escriba el código que copia
`cadena1` en `cadena2`"), la **serie** lleva `"dentroDeMain": true`: todo su
código se analiza como si estuviera dentro de `main`, sin que el alumno lo
escriba. Si lo escribe igual, se le avisa que no hace falta.

Y cada consigna puede traer un `"dado"`: código que aparece ya escrito arriba
de la respuesta, como las variables sobre las que se trabaja.

```json
"dado": "char cadena1[30] = \"Hola mundo\";\nchar cadena2[30];"
```

El `dado` de una consigna queda para las siguientes **que continúan**, así que
no hay que repetirlo.

Dos formas de no repetirlo cuando las consignas no continúan unas de otras:

- **`"dado"` de la serie**: código de `main` que ven todas sus consignas,
  continúen o no. Es el arreglo sobre el que trabajan todas (serie "Recorrer
  un arreglo de estructuras": `TAlumno alumnos[MAX_ALUMNOS]; int i;`).
- **`"parteDe": "id-de-una-consigna"`**: la consigna arranca con el código que
  veía esa otra antes de ser respondida (con su `dado`, y sin las respuestas
  que vinieron en el medio), en lugar de seguir la cadena. En "Copiar y
  comparar", la última parte de la consigna de los legajos, así no ve su `if`.
  Las pruebas verifican que `parteDe` nombre una consigna anterior y que no se
  cuele ninguna respuesta del medio.

**Dónde va la respuesta: `"en": "archivo"`.** En una serie de sentencias
(`"dentroDeMain": true`) todo se analiza dentro de una función que el alumno no
escribe. Una consigna que pide una definición de tipo (`typedef`, `struct`,
`union`, `enum`) lleva `"en": "archivo"`: su respuesta, y lo que le siga, se
analiza fuera de esa función, que es donde va en C. Las demás (variables y
sentencias) siguen yendo dentro. El `#include` de una consigna `persiste` va
también afuera.

Solo cuando una serie **mezcla** las dos cosas se le muestra al alumno el
marco, con `int main() {` (los paréntesis quedan vacíos hasta que se vean las
funciones), un comentario donde va su respuesta y `return 0;` al final, y la
consigna dice "esta respuesta va fuera de `main`" o "dentro de `main`". Las
líneas del preprocesador (`#define`) se ven arriba de todo. En las demás series
todo se ve como siempre. Las series de estructuras son de este tipo: sus
variables son locales y no escriben `main` (si lo escriben, `MAIN_DE_MAS`).

**`"cabecera"`** de una serie es un `#include` (`"#include <string.h>"`) que se
ve arriba de todo, fuera de `main`, en el marco y en los programas de los
cuestionarios. Puede traer también una definición ya hecha (la serie "Usar los
campos" trae `struct Alumno`): como no es parte de lo que escribe el alumno,
no cuenta como suyo, y la serie se ve con el marco de `main`. Las series que usan `strcpy` (arreglos, tablas y typedef) la
llevan.

**`"ejemplo"`** de una consigna (`{ "texto": ..., "codigo": ... }`) muestra,
antes del enunciado, un código para comparar: lo que se hacía hasta ahora, por
ejemplo. No es parte del código de arriba, así que no choca con lo que el
alumno escribe.

**`capturar` guarda el nombre que eligió el alumno** para que lo usen las
consignas que siguen con `$S`: así "la estructura anterior" es la suya, se
llame como se llame.

**El enunciado también puede usar una captura, con `{S}`**, y cada alumno lee
el nombre que eligió él: "la estructura `Alumno`", "la estructura
`Estudiante`". Se muestra solo el nombre, sin la palabra `struct`: decirle
`struct Alumno` sería darle escrita la parte de la respuesta que más se
olvida. Ojo que son dos escrituras distintas: `$S` en las reglas, `{S}` en el
enunciado. Las pruebas avisan si un enunciado nombra algo que ninguna consigna
anterior capturó.

La `referencia` tiene que pasar su propia consigna, encadenada con las
referencias anteriores: las pruebas lo verifican.

**La `referencia` también puede nombrar una captura con `{S}`**: "Ver una
solución" la muestra con los nombres que el alumno eligió antes
(`{C}[0] = 'H';` queda `nombre[0] = 'H';` si así llamó a su cadena). Sirve
donde el nombre viene de una consigna anterior; lo que el alumno nombra en la
misma consigna, o lo que fija un `dado`, queda escrito tal cual. Las pruebas
sustituyen igual que la pantalla.

## Buenas prácticas

Una respuesta puede estar bien sin ser la ideal. Una serie que lleva

```json
"buenasPracticas": ["constantes"]
```

distingue **correcto** de **excelente**: lo que no sigue la práctica no
invalida la respuesta, pero se le explica al alumno como una mejora, y puede
corregirlo y comprobar de nuevo o seguir así. La lista de series y el final de
la serie muestran cuántas quedaron excelentes.

Las mejoras se dicen solo cuando la respuesta ya está bien: con un error, se
muestra el error y nada más.

Una **nota** (`nivel: 'nota'`) es algo que conviene saber y no es para corregir:
se ve con el mismo azul que una mejora, pero no cuenta como "se puede mejorar",
así que la respuesta sigue siendo excelente. Como las mejoras, solo se muestra
con la respuesta ya bien, y **se dice una sola vez por serie**: el avance
guarda los códigos ya dados (`avisados`), que se rearman al corregir de nuevo
las respuestas, y el corrector no los repite.

**Va por serie y no para todo** porque no se le puede reclamar a un alumno
algo que todavía no vio: se activa a partir de la unidad donde se enseña.

La práctica `constantes` mira las dimensiones de los arreglos:

| | Resultado |
|---|---|
| `#define MAX 20` y `int lista[MAX];` | Excelente. |
| `int lista[20];` | Correcto. Mejora: un número suelto (`NUMERO_MAGICO`). |
| `int lista[20];` habiendo antes un `#define` que vale 20 | Correcto. Mejora: ya hay una constante con ese valor (`CONSTANTE_SIN_REUTILIZAR`). Se la nombra y se deja a juicio del alumno si es la misma cantidad. |
| `const int MAX = 20;` o una variable como dimensión | Correcto. Mejora: lo ideal es `#define` (`DIMENSION_CON_VARIABLE`). |
| `#define max 20` | Correcto. Mejora: las constantes van en mayúscula (`CONSTANTE_EN_MINUSCULA`). |

La práctica `claridad` es para lo que funciona pero se lee mal: la tabla con
todos los valores seguidos, `{0, 0, 0}` donde alcanza `{0}`, `0` por `'\0'`,
guardar un texto letra por letra habiendo una función, `!strcmp(a, b)` sin el
cero, leer sin un límite.

**Una consigna puede pedir otras prácticas que su serie**:
`"buenasPracticas": ["claridad", "constantes"]` en la consigna reemplaza a la
de la serie.

La solución de `referencia` de una serie con prácticas tiene que ser
excelente: las pruebas lo verifican.

Aparte de las prácticas, y **en todas las series**: una dimensión con un
nombre que nadie definió (`int lista[MAX];` sin `#define`) es un error. El
`#define` tiene que estar en la misma respuesta o en el código hasta acá, y
antes de la línea que lo usa.

## Al corregir

- Si la sintaxis está rota, se informa solo eso. Primero se buscan los errores
  de siempre (llave sin cerrar, `Struct` con mayúscula, comas por punto y
  coma), que tienen su explicación; si no es ninguno, lo que diga el
  analizador.
- **Un mensaje dice qué está mal y nombra el concepto, no el código que hay
  que escribir**: "tiene que ser un número entero", no "tiene que ser `int`"
  (que además dejaría afuera a `long`, que también vale). La respuesta escrita
  está en "Ver una solución", donde la pide el alumno y queda anotado que la
  miró. Dos excepciones: cuando ya mostró que conoce la palabra (`Int`,
  `struc`: es un error de tipeo, y se le dice cómo se escribe), y las mejoras
  de buenas prácticas, que enseñan algo sobre una respuesta que ya está bien.
- Lo que el alumno declaró se describe en palabras ("un arreglo de `float`"),
  nunca como `float[20]`, que no es algo que se escriba en C. Y sin la palabra
  "puntero", que en la materia se ve al final: se dice "le sobra el `*`".
- El `'\0'` se nombra por su símbolo, con comillas simples, igual que como se
  escribe en el código y como lo muestran las opciones. Se lo dice por su
  concepto ("el carácter que marca el final") solo donde nombrarlo le daría al
  alumno la respuesta de una consigna que justamente quiere comprobar que lo
  recuerda: `FIN_DISTINTO`, `FIN_CON_ESPACIO`, `CADENA_SIN_FIN` de una lista.
- Se dice siempre **"biblioteca"** (la de cadenas, la de entrada y salida), no
  "librería": una sola palabra en todos los enunciados y mensajes.
- Cada mensaje lleva un **código fijo** (`CAMPO_FALTA`, `FALTA_PUNTO_Y_COMA`).
  El texto se puede reescribir; el código es lo que sirve para contar errores.
- Cada intento queda anotado en el navegador (`practica-c:intentos`) con sus
  códigos.
- Además, cada intento se puede enviar de forma anónima (serie, consigna,
  resultado, códigos, si pidió la solución y un número al azar por navegador;
  nunca el código escrito) a una hoja de cálculo de Google. Está apagado hasta
  completar `DIRECCION` en `js/estadisticas.js`; los pasos y el script están en
  `estadisticas/LEEME.md`. No envía desde `localhost` ni desde `/pruebas/`, y
  cuando envía, la pantalla muestra un aviso al pie. Un intento igual al
  anterior (misma consigna, resultado y códigos) en menos de 5 segundos no se
  vuelve a enviar, y Ctrl+Enter mantenido apretado cuenta como una sola
  comprobación: así el clic repetido no llena la hoja de filas idénticas.
- "Informar un problema": después de cada comprobación el alumno puede mandar
  un informe (motivo, comentario, mensajes que vio y, solo con su permiso, su
  respuesta y el código anterior). Llega a la hoja `Informes`; ver
  `estadisticas/LEEME.md`.

- **`typedef { ... } Nombre;`** (falta la palabra): `TYPEDEF_SIN_TIPO` dice
  cuál va, según la regla de la consigna (`struct`, `union` o `enum`), en lugar
  del `NO_SE_ENTIENDE` general. Solo cuando la consigna pide una de esas tres
  cosas; si pide solo el alias (`typedef struct Alumno TAlumno;`) sigue el
  mensaje de siempre.

Cuando un alumno escriba algo que el corrector entienda mal, se suma el caso a
`pruebas/casos.js` antes de arreglarlo.

## Pendiente

- Exportar e importar el avance, para cambiar de computadora.
