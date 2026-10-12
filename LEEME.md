# Práctica de C

Consignas de sintaxis de C para los ingresantes: se responden escribiendo
código, y se corrigen **sin ejecutarlo**, mirando lo que el código declara.
Las consignas van en series, y cada una se resuelve sobre lo que el alumno
escribió en las anteriores.

## Probarlo

```
node servidor.js
```

y abrir <http://localhost:8080>. Las pruebas del corrector están en
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
  "titulo": "Estructuras: declarar, usar y dar un alias",
  "descripcion": "Lo que se lee debajo del título en la lista.",
  "consignas": [ ... ]
}
```

y se muestra recién cuando está anotada en `consignas/indice.json`, que
además fija el orden de la lista. Sacarla de ahí la esconde sin borrarla.

**El `id` de una serie no se cambia** una vez que los alumnos la usaron: el
avance de cada uno está guardado con ese nombre, y con otro arrancan de cero.
Vale lo mismo para el `id` de cada consigna, que es con lo que se anotan los
intentos. El título y la descripción sí se pueden cambiar cuando haga falta.

Cambiar las reglas de una consigna no rompe el avance: al abrir, las
respuestas guardadas se corrigen de nuevo, y el alumno retoma desde la primera
que ya no vale.

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

### Cadenas de caracteres

Las series `cadenas-*` (el fin de la cadena, la cadena vacía, la biblioteca,
recorrer, tablas de cadenas y typedef) usan estas reglas.

**Una cadena de hasta N letras necesita N + 1 espacios**, y la consigna pide el
tamaño justo. Con un "al menos" un número cualquiera (20) pasaría sin que el
alumno haya pensado en el `\0`, y eso es justo lo que se quiere comprobar:

```json
{ "variable": { "tipo": "caracter", "arreglo": { "tamano": 11, "letras": 10 }, "capturar": "C", "capturarDimension": "N" } }
```

| Respuesta | Resultado |
|---|---|
| `char s[11];`, `char s[10 + 1];`, `char s[MAX + 1];` | Correcta. |
| `char s[10];` | Error `CADENA_SIN_FIN`: no queda espacio para el `\0`. |
| `char s[5];` | Error `ARREGLO_CHICO`. |
| `char s[20];` | Error `ARREGLO_GRANDE`: es más de lo que hace falta. |

`"alMenos"` en lugar de `"tamano"` acepta ese tamaño o más, para una consigna
en la que la dimensión no sea el tema.

Con una tabla, `"tamano": [30, 26]`: la cantidad de textos y el tamaño de cada
uno (la última dimensión es la que lleva el fin). `capturarDimension` guarda lo
que valía la dimensión, para nombrarla en un enunciado o una opción (`{N}`).

Otras formas de pedir una variable de caracteres:

- `"texto": "Hola"`: declarada con ese texto en la misma sentencia. `[]` es
  excelente; `[4]` es el error silencioso de C (`CADENA_SIN_FIN`); más lugar
  que el necesario es correcto con mejora. Con `"como": "lista"` se piden los
  caracteres uno por uno entre llaves (`{'H', 'o', 'l', 'a', '\0'}`).
- `"textos": ["lunes", ...]`: una tabla de textos, uno por fila. Se controla
  cada texto, que la cantidad de filas sea la justa y que el ancho deje lugar
  para el fin del más largo.
- `"caracter": "A"`: una variable de un solo carácter con ese valor (`'A'`, no
  `"A"`).
- `"vacia": true`, junto con `tamano`: tiene que empezar vacía (`""`, `{0}`
  o `{'\0'}`).

Reglas de código:

- `{ "elementos": { "de": "$C", "texto": "Hola" } }`: el texto asignado
  carácter por carácter (`frase[0] = 'H';` ...), con su `'\0'`, en cualquier
  orden. Falta el fin (`CADENA_SIN_FIN`), una posición salteada, todo corrido
  un lugar (`ELEMENTOS_CORRIDOS`), `"H"` en vez de `'H'`, `0` por `'\0'`
  (correcta, con mejora).
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
  `"filasDe": "tabla"` pide recorrer las filas de una tabla, y que dentro se
  vacíe cada una.
- `{ "incluye": "string.h" }`: agregar una biblioteca con `#include`. Con
  comillas (`"string.h"`) vale con mejora; sin el `.h`, otra biblioteca, o con
  `#define` en lugar de `#include`, es error con su mensaje. Se usa con
  `"persiste": true`.
- `{ "alias": { "arreglo": { "tamano": 26, "letras": 25 }, "capturar": "T" } }`
  y `{ "usaAlias": { "alias": "$T", "arreglo": { "tamano": 30 } } }`: un
  `typedef` de un arreglo de caracteres, y una variable declarada con él. Una
  variable de ese tipo se ve como el arreglo que es.

La regla `llamada` suma, para estas series:

- Un argumento puede ser un texto (`"\"Juan\""`) o una posición de una tabla
  (`"nombres[0]"`).
- `"resultadoEn": "largo"`: lo que devuelve tiene que guardarse en esa variable.
- `"comparar": true` (`strcmp`): tiene que estar en la condición de un `if` y
  mirar el cero. `strcmp(a, b)` sola o con `!= 0` se cumple al revés
  (error); `!strcmp(a, b)` vale, con mejora; `==` entre cadenas es error.
  El orden de las dos cadenas da lo mismo.
- `"aMano": { "variable": "nombre", "texto": "Juan" }`: guardar el texto
  carácter por carácter también llega, pero con mejora.
- `strncpy` con un límite que no deja lugar para el fin es error.
  `scanf("%s", ...)` sin límite es correcto con mejora; un límite que no deja
  lugar para el fin es error.

Un texto entre comillas dobles con el fin escrito de más (`"Hola\0"`) es el mismo
texto: vale, con la mejora `FIN_EN_EL_TEXTO` (el compilador ya lo agrega). Vale
igual en `strcpy`, `strcmp` y en una tabla de textos. Entre comillas simples
(`'Hola'`) es un error con su mensaje (`CADENA_CON_COMILLAS_SIMPLES`).

Para cualquier consigna, y sin pedirlo: una posición que no existe
(`nombres[30]` en una tabla de 30 filas, `INDICE_FUERA_DE_RANGO`) y un texto
asignado a un carácter (`ELEMENTO_ENTRE_COMILLAS_DOBLES`) son errores. Y una
dimensión puede ser una cuenta sencilla (`MAX + 1`, `10 + 1`).

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
    { "valor": "4", "texto": "la cantidad de letras", "correcta": true }
  ]
}
```

- **Una sola correcta**, y cada equivocada con su `codigo` y su
  `explicacion`: cada opción es un error de concepto con nombre, y los
  intentos quedan anotados con ese código. Las pruebas lo verifican.
- `codigo` es el código que se muestra (con `{C}` el nombre que eligió el
  alumno). Las opciones y las explicaciones también pueden usar `{C}`, `{N}`.
- `valor` es lo que la opción vale (`11`, `'\0'`), y `texto` lo que dice de él: se
  muestran separados. Una opción sin valor (`No se puede saber`) lleva solo
  `texto`.
- Las opciones se muestran **mezcladas, con un orden fijo para cada alumno**.
- No agrega código a lo que sigue, salvo que la consigna diga `"queda": true`:
  entonces su `codigo` aparece en "El código hasta acá" de las siguientes (la 3
  deja `int longitud = strlen(frase);` para que la 5 lo use).
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
  códigos. Hoy no sale de ahí.

Cuando un alumno escriba algo que el corrector entienda mal, se suma el caso a
`pruebas/casos.js` antes de arreglarlo.

## Pendiente

- Exportar e importar el avance, para cambiar de computadora.
