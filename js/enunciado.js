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
export function figuraDe(consigna) {
  if (consigna.dibujo === false) return null;
  const valores = consigna.requiere.find((r) => r.variable?.valores)?.variable.valores;
  if (!valores) return null;
  return Array.isArray(valores[0]) ? { clase: 'tabla', filas: valores } : { clase: 'arreglo', valores };
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
