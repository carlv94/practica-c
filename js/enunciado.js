// El enunciado de una consigna puede nombrar lo que el alumno escribio antes:
//
//   "Defina un alias para la estructura {S}."
//
// {S} se reemplaza por el nombre que capturo una consigna anterior, asi cada
// alumno lee el suyo: "la estructura Alumno", "la estructura Estudiante".
//
// Se muestra solo el nombre, sin la palabra struct aunque la captura la
// tenga: decirle "struct Alumno" seria darle escrita la parte de la respuesta
// que mas se olvida.

//
// Y puede llevar un dibujo: el arreglo que la consigna pide definir, como una
// fila de casilleros con sus indices. El dibujo no se escribe aparte: sale de
// los "valores" de la regla, asi lo que se ve es siempre lo que se corrige.

const MARCA = /\{(\w+)\}/g;

// El dibujo de una consigna, o null si no lleva:
//   { clase: 'arreglo', valores: [3, 6, 0, 7, 1, 5] }
//   { clase: 'tabla', filas: [[5, 8, 1, 4], [0, 2, 9, 6]] }
//
// Una consigna puede no llevar dibujo ("dibujo": false) cuando el enunciado
// describe el arreglo con palabras y se quiere que el alumno lo deduzca.
//
// Un dibujo propio, para una consigna que no define el arreglo (lo recorre, lo
// suma): "dibujo" es un objeto con los valores y como se ve.
//   { "titulo": "La tabla `ventas`", "valores": [[1, 2], [3, 4]],
//     "filas": "sucursales", "columnas": "días", "resaltar": "diagonal",
//     "arreglo": { "nombre": "totales", "valores": [4, 6], "vertical": true } }
// "valores" puede ser una lista de tablas (tres dimensiones): se dibuja cada una
// con su nombre ("planos": "notas" las llama notas[0], notas[1]).
// "arreglo" es el resultado que tiene que quedar, aparte de la tabla.
// Y "salida" es lo que tiene que mostrar el programa, en un recuadro de consola.
export function figuraDe(consigna) {
  // Una letra se dibuja entre comillas simples, como se escribe en el codigo.
  const comoSeEscribe = (v) => (Array.isArray(v) ? v.map(comoSeEscribe) : typeof v === 'string' ? `'${v}'` : v);
  const d = consigna.dibujo;
  if (d && typeof d === 'object') {
    const tresDimensiones = Array.isArray(d.valores[0]) && Array.isArray(d.valores[0][0]);
    return {
      clase: tresDimensiones ? 'planos' : Array.isArray(d.valores[0]) ? 'tabla' : 'arreglo',
      filas: comoSeEscribe(d.valores),
      valores: comoSeEscribe(d.valores),
      titulo: d.titulo,
      planos: d.planos,
      rotuloFilas: d.filas,
      rotuloColumnas: d.columnas,
      resaltar: d.resaltar,
      arreglo: d.arreglo,
      salida: consigna.salida,
    };
  }
  if (consigna.dibujo === false) return null;
  if (!consigna.requiere) return consigna.salida ? { clase: 'salida', salida: consigna.salida } : null;
  const valores = consigna.requiere.find((r) => r.variable?.valores)?.variable.valores;
  if (!valores) return consigna.salida ? { clase: 'salida', salida: consigna.salida } : null;
  const escritos = comoSeEscribe(valores);
  return Array.isArray(valores[0])
    ? { clase: 'tabla', filas: escritos, salida: consigna.salida }
    : { clase: 'arreglo', valores: escritos, salida: consigna.salida };
}

// El texto con los nombres puestos y nada mas: para un codigo o una opcion.
export function sustituir(texto, capturas) {
  return partesDeEnunciado(texto, capturas)
    .map((parte) => parte.nombre ?? parte.texto)
    .join('');
}

// Las capturas que nombra un enunciado: "... {S} ... {A}" -> ['S', 'A']
export function marcasDe(enunciado) {
  return [...enunciado.matchAll(MARCA)].map((m) => m[1]);
}

// El enunciado en pedazos, para armarlo en pantalla:
//   [{ texto: 'Defina un alias para la estructura ' }, { nombre: 'Alumno' }, { texto: '.' }]
// Una marca que nadie capturo queda como esta escrita: las pruebas la avisan.
export function partesDeEnunciado(enunciado, capturas) {
  const partes = [];
  let hasta = 0;
  for (const m of enunciado.matchAll(MARCA)) {
    const valor = capturas[m[1]];
    if (!valor) continue;
    if (m.index > hasta) partes.push({ texto: enunciado.slice(hasta, m.index) });
    partes.push({ nombre: valor.replace(/^struct\s+/, '') });
    hasta = m.index + m[0].length;
  }
  if (hasta < enunciado.length) partes.push({ texto: enunciado.slice(hasta) });
  return partes;
}
