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

// Y puede llevar una ficha de datos: el nombre de cada campo que se pide, como
// en una ficha en papel. Es una tarjeta, y el enunciado dice donde va con una
// linea que solo dice [ficha]; la descripcion de cada dato la dice el propio
// enunciado, en prosa:
//   "ficha": { "titulo": "Ficha de alumno",
//              "campos": [{ "nombre": "promedio", "ejemplo": "8.45" }] }
// "ejemplo" es opcional (todos los campos o ninguno): un valor cargado, para las
// consignas que usan la estructura. Sin ejemplo, cada campo lleva una linea donde
// iria el dato (todavia sin cargar). Donde se pide declararla no se pone ejemplo,
// porque un valor ya insinua el tipo.
// Para mostrar como tiene que quedar, la ficha puede llevar una "leyenda"
// ("Asi tiene que quedar la ficha:") y "resaltar" los campos que se cargan en
// esa consigna (una lista de nombres, o "todos"). Si el enunciado no trae la linea
// [ficha], la ficha va despues de todo el texto. "ficha" puede ser una lista, para
// mostrar mas de una (alumno y copia).
export const MARCA_DE_FICHA = '\n[ficha]\n';

// Las fichas de una consigna, siempre como lista (puede llevar una o varias).
// Un arreglo de estructuras se escribe en una sola vez, y aca se abre en una
// ficha por elemento, con el titulo "alumnos[0]", "alumnos[1]"...:
//   "ficha": { "arreglo": "alumnos",
//              "campos": ["legajo", "promedio"],
//              "elementos": [[20431, 8.45], null, [18560, 7.2]],
//              "destacar": [0], "resaltar": ["promedio"],
//              "leyenda": "Asi tiene que quedar el arreglo:" }
// Un elemento null es uno todavia sin cargar (sus campos llevan la linea).
// "destacar" son las posiciones que se marcan (el que cumple, el mayor) y
// "resaltar", los campos que se marcan en todas porque la consigna los carga.
// "marcar" se ve igual, para señalar un campo sobre el que se trabaja (el que
// se suma); no hace falta que el enunciado diga sus valores.
// "marcarDestacado" son los campos que se marcan solo en los destacados (el
// legajo y el promedio del que se busca, y no los de todos).
export function fichasDe(consigna) {
  const f = consigna.ficha;
  if (!f) return [];
  if (Array.isArray(f) || !f.arreglo) return [].concat(f);
  return f.elementos.map((fila, i) => ({
    leyenda: i === 0 ? f.leyenda : undefined,
    disposicion: i === 0 ? 'fila' : undefined,
    titulo: `${f.arreglo}[${i}]`,
    destacar: (f.destacar || []).includes(i),
    resaltar: f.resaltar,
    marcar: (f.destacar || []).includes(i) ? [...(f.marcar || []), ...(f.marcarDestacado || [])] : f.marcar,
    // Los que se marcan en todas: sobre estos campos se trabaja siempre.
    marcarEnTodas: f.marcar,
    campos: f.campos.map((nombre, k) =>
      fila && fila[k] != null ? { nombre, ejemplo: String(fila[k]) } : { nombre }
    ),
  }));
}

// El enunciado partido en lo que va antes de la ficha y lo que va despues.
// Sin ficha, todo va antes.
export function enunciadoEnDos(consigna) {
  const enunciado = consigna.enunciado;
  const donde = fichasDe(consigna).length ? enunciado.indexOf(MARCA_DE_FICHA) : -1;
  if (donde < 0) return { antes: enunciado, despues: '' };
  return { antes: enunciado.slice(0, donde), despues: enunciado.slice(donde + MARCA_DE_FICHA.length) };
}

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
// En un arreglo, "nombres" son los nombres de un enumerado, uno por posicion, que
// se ven bajo cada indice (MANANA, TARDE, NOCHE).
// En un arreglo, "resaltar" es la lista de posiciones que se marcan, y un valor
// null es una posicion vacia (todavia sin nada). "dibujo" puede ser una lista de
// estos objetos: se dibujan uno debajo del otro.
export function figuraDe(consigna) {
  // Una letra se dibuja entre comillas simples, como se escribe en el codigo.
  const comoSeEscribe = (v) => (Array.isArray(v) ? v.map(comoSeEscribe) : typeof v === 'string' ? `'${v}'` : v);
  const d = consigna.dibujo;
  const propia = (d) => {
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
      nombres: d.nombres,
      arreglo: d.arreglo,
      salida: consigna.salida,
    };
  };
  // Una lista de dibujos (el arreglo antes y despues): cada uno con su titulo.
  if (Array.isArray(d)) return { clase: 'varias', figuras: d.map(propia), salida: consigna.salida };
  if (d && typeof d === 'object') return propia(d);
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
