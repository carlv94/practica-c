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
| `consignas/*.json` | Las series: enunciado, reglas y una solución de referencia. |
| `js/analizador.js` | Carga el analizador de C (tree-sitter en WebAssembly). |
| `js/modelo.js` | Del árbol del analizador a "qué estructuras, alias y variables hay". |
| `js/corrector.js` | Aplica las reglas de una consigna y arma los mensajes. |
| `js/editor.js` | El editor de la respuesta: colores, números de línea y sangría. |
| `js/app.js` | La pantalla y el avance del alumno. |
| `pruebas/casos.js` | Respuestas de ejemplo con el resultado que tienen que dar. |
| `vendor/tree-sitter/` | El analizador, copiado de terceros. No se edita: ver su `LEEME.md`. |

`modelo.js` y `corrector.js` no saben nada de la pantalla: si un día la
interfaz se rehace con otra herramienta, esos dos quedan como están.

## Escribir una consigna

```json
{
  "id": "estructuras-2",
  "titulo": "Declarar una variable",
  "enunciado": "Declare una variable usando la estructura anterior.",
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

- Una sola serie, fija en `js/app.js`: falta la lista de series.
- Exportar e importar el avance, para cambiar de computadora.
