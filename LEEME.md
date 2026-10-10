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
| `js/modelo.js` | Del árbol del analizador a "qué estructuras, alias y variables hay". |
| `js/corrector.js` | Aplica las reglas de una consigna y arma los mensajes. |
| `js/enunciado.js` | Pone en el enunciado los nombres que eligió el alumno (`{S}`). |
| `js/editor.js` | El editor de la respuesta: colores, números de línea y sangría. |
| `js/app.js` | La pantalla y el avance del alumno. |
| `pruebas/casos.js` | Respuestas de ejemplo con el resultado que tienen que dar. |
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
  local. Con `"conAlias": true` tiene que estar declarada con un alias.
- `{ "alias": { "de": "$S", "capturar": "A" } }` — un `typedef` de ese tipo.

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

## Al corregir

- Si la sintaxis está rota, se informa solo eso. Primero se buscan los errores
  de siempre (llave sin cerrar, `Struct` con mayúscula, comas por punto y
  coma), que tienen su explicación; si no es ninguno, lo que diga el
  analizador.
- Cada mensaje lleva un **código fijo** (`CAMPO_FALTA`, `FALTA_PUNTO_Y_COMA`).
  El texto se puede reescribir; el código es lo que sirve para contar errores.
- Cada intento queda anotado en el navegador (`practica-c:intentos`) con sus
  códigos. Hoy no sale de ahí.

Cuando un alumno escriba algo que el corrector entienda mal, se suma el caso a
`pruebas/casos.js` antes de arreglarlo.

## Pendiente

- Exportar e importar el avance, para cambiar de computadora.
