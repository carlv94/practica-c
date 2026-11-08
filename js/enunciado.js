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
// En una tabla, "nombresFilas" y "nombresColumnas" son los nombres de dos
// enumerados, uno por fila y uno por columna, junto a los indices.
// En un arreglo, "nombres" son los nombres de un enumerado, uno por posicion, que
// se ven bajo cada indice (MANANA, TARDE, NOCHE).
// Una union: "union": { "nombre": "lectura", "miembros": ["entero", "real"],
//   "vigente": "real", "valor": "36.5" } se dibuja como un solo lugar que
// comparten los miembros, con el que tiene el valor marcado. Sin "valor", el
// lugar esta vacio.
// En un arreglo, "resaltar" es la lista de posiciones que se marcan, y un valor
// null es una posicion vacia (todavia sin nada). "dibujo" puede ser una lista de
// estos objetos: se dibujan uno debajo del otro.
//
// La memoria: una fila de casilleros, uno por variable, con su direccion arriba.
//   "dibujo": { "titulo": "La memoria:", "memoria": [
//     { "nombre": "x", "valor": 5 },
//     { "nombre": "p", "puntero": true, "apunta": "x" } ] }
// Las direcciones son inventadas y fijas: empiezan en 1000 y avanzan lo que
// ocupa cada tipo (int y float 4, char 1, double 8, un puntero 8). Un puntero
// que "apunta" a una variable guarda su direccion y lleva una flecha hacia ella;
// sin "apunta" guarda lo que diga "valor" (null: todavia sin nada, "?").
// Un arreglo es una celda con "arreglo": { "nombre": "v", "arreglo": [10, 20, 30] }
// se dibuja como una celda por elemento (v[0], v[1], v[2]), seguidas. Un puntero
// puede apuntar a un elemento ("apunta": "v[1]") o, con el nombre del arreglo
// ("apunta": "v"), al primero.
// Una estructura es una celda con "estructura": { "nombre": "f", "estructura": [
// { "nombre": "dia", "valor": 10 }, { "nombre": "mes", "valor": 5 } ] }: una celda
// por campo (f.dia, f.mes), seguidas, y un puntero que "apunta": "f" llega al primer campo.
const BYTES_DE_MEMORIA = { int: 4, float: 4, char: 1, short: 2, double: 8, long: 8, puntero: 8 };

export function celdasDeMemoria(entrada, desde = 1000) {
  // Un arreglo pasa a una celda por elemento y una estructura a una por campo.
  const lista = entrada.flatMap((c) =>
    c.arreglo
      ? c.arreglo.map((valor, i) => ({ nombre: `${c.nombre}[${i}]`, valor, tipo: c.tipo || 'int', elemento: true }))
      : c.estructura
        ? c.estructura.map((campo) => ({
            nombre: `${c.nombre}.${campo.nombre}`,
            valor: campo.valor,
            tipo: campo.tipo || 'int',
            elemento: true,
            deEstructura: c.nombre,
          }))
        : [c]
  );
  let siguiente = desde;
  const celdas = lista.map((c) => {
    const direccion = c.direccion ?? siguiente;
    siguiente = direccion + (BYTES_DE_MEMORIA[c.puntero ? 'puntero' : c.tipo || 'int'] ?? 4);
    return { tipo: 'int', ...c, direccion };
  });
  for (const c of celdas) {
    if (!c.apunta) continue;
    const destino =
      celdas.find((x) => x.nombre === c.apunta) ||
      celdas.find((x) => x.nombre === `${c.apunta}[0]`) ||
      celdas.find((x) => x.deEstructura === c.apunta);
    if (!destino) throw new Error(`La memoria dibujada: ${c.nombre} apunta a ${c.apunta}, que no esta.`);
    c.valor = destino.direccion;
    c.destino = destino.nombre;
  }
  return celdas;
}

//
// La escalera de acceso: tres escalones, de una copia a todas las variables.
//   "dibujo": { "titulo": "Los escalones de acceso:", "escalera": true }
export const ESCALONES_DE_ACCESO = [
  { nombre: 'Una copia', detalle: 'parámetro por valor y `return`' },
  { nombre: 'Esa variable', detalle: 'parámetro por referencia, solo en esa llamada' },
  { nombre: 'Todas las variables', detalle: 'variable global, desde todas las funciones' },
];

// El plano: puntos, segmentos y una circunferencia sobre ejes con cuadricula.
//   "dibujo": { "titulo": "...", "plano": {
//     "puntos": [[0, 0], { "en": [3, 4], "rotulo": "A", "estilo": "dentro" }],
//     "segmentos": [{ "desde": [0, 0], "hasta": [3, 4], "rotulo": "5", "estilo": "resaltado", "lado": -1 }],
//     "circulo": { "centro": [0, 0], "radio": 5 } } }
// Un punto sin rotulo lleva sus coordenadas. Estilos de punto: normal, dentro, fuera,
// resaltado; su "lado" (donde va el rotulo): derecha, izquierda, abajo. Estilos de
// segmento: normal, resaltado, guia; su "lado": -1 pone el rotulo del otro lado. Devuelve todo en numeros, con el rango que hay que dibujar.
export function planoDe(p) {
  const coordenadas = (c, donde) => {
    if (!Array.isArray(c) || c.length !== 2 || !c.every(Number.isFinite)) {
      throw new Error(`El plano dibujado: ${donde} necesita dos coordenadas numericas.`);
    }
    return { x: c[0], y: c[1] };
  };
  const ESTILOS_PUNTO = ['normal', 'dentro', 'fuera', 'resaltado'];
  const LADOS_PUNTO = ['derecha', 'izquierda', 'abajo'];
  const ESTILOS_SEGMENTO = ['normal', 'resaltado', 'guia'];
  const puntos = (p.puntos || []).map((q, i) => {
    const o = Array.isArray(q) ? { en: q } : q;
    const { x, y } = coordenadas(o.en, `el punto ${i + 1}`);
    const estilo = o.estilo || 'normal';
    if (!ESTILOS_PUNTO.includes(estilo)) throw new Error(`El plano dibujado: el estilo "${estilo}" del punto ${i + 1} no existe.`);
    const lado = o.lado || 'derecha';
    if (!LADOS_PUNTO.includes(lado)) throw new Error(`El plano dibujado: el lado "${lado}" del punto ${i + 1} no existe.`);
    return { x, y, rotulo: o.rotulo ?? `(${x}, ${y})`, estilo, lado };
  });
  const segmentos = (p.segmentos || []).map((s, i) => {
    const desde = coordenadas(s.desde, `el segmento ${i + 1} (desde)`);
    const hasta = coordenadas(s.hasta, `el segmento ${i + 1} (hasta)`);
    const estilo = s.estilo || 'normal';
    if (!ESTILOS_SEGMENTO.includes(estilo)) throw new Error(`El plano dibujado: el estilo "${estilo}" del segmento ${i + 1} no existe.`);
    return { desde, hasta, rotulo: s.rotulo ?? '', estilo, lado: s.lado === -1 ? -1 : 1 };
  });
  let circulo = null;
  if (p.circulo) {
    const centro = coordenadas(p.circulo.centro, 'el centro de la circunferencia');
    if (!(p.circulo.radio > 0)) throw new Error('El plano dibujado: el radio de la circunferencia tiene que ser positivo.');
    circulo = { centro, radio: p.circulo.radio };
  }
  if (!puntos.length && !segmentos.length && !circulo) throw new Error('El plano dibujado esta vacio.');

  // El rango: lo que hay que mostrar, los ejes (el cero) y un margen de una unidad.
  const xs = [0, ...puntos.map((q) => q.x), ...segmentos.flatMap((s) => [s.desde.x, s.hasta.x])];
  const ys = [0, ...puntos.map((q) => q.y), ...segmentos.flatMap((s) => [s.desde.y, s.hasta.y])];
  if (circulo) {
    xs.push(circulo.centro.x - circulo.radio, circulo.centro.x + circulo.radio);
    ys.push(circulo.centro.y - circulo.radio, circulo.centro.y + circulo.radio);
  }
  const xmin = Math.floor(Math.min(...xs)) - 1;
  const xmax = Math.ceil(Math.max(...xs)) + 1;
  const ymin = Math.floor(Math.min(...ys)) - 1;
  const ymax = Math.ceil(Math.max(...ys)) + 1;
  const mayor = Math.max(xmax - xmin, ymax - ymin);
  const paso = mayor <= 10 ? 1 : mayor <= 20 ? 2 : 5;
  return { puntos, segmentos, circulo, xmin, xmax, ymin, ymax, paso };
}

// Un diagrama de Venn de dos conjuntos de numeros, con una region resaltada.
//   "dibujo": { "titulo": "...", "venn": { "a": [1, 2, 3, 4], "b": [3, 4, 5, 6],
//     "nombres": ["a", "b"], "resaltar": "union" } }
// "resaltar": union, interseccion, diferencia (los de a que no estan en b) o
// diferenciaInversa (los de b que no estan en a). Los numeros se acomodan solos en su
// region, asi el dibujo no puede contradecir al ejemplo. Una region lleva a lo sumo 4.
export const REGIONES_DE_VENN = {
  union: 'la unión',
  interseccion: 'la intersección',
  diferencia: 'la diferencia (los de {a} que no están en {b})',
  diferenciaInversa: 'la diferencia (los de {b} que no están en {a})',
};
export function vennDe(v) {
  const conjunto = (c, cual) => {
    if (!Array.isArray(c) || !c.every(Number.isFinite)) throw new Error(`El diagrama de Venn: el conjunto ${cual} tiene que ser una lista de numeros.`);
    if (new Set(c).size !== c.length) throw new Error(`El diagrama de Venn: el conjunto ${cual} repite un numero.`);
    return c;
  };
  const a = conjunto(v.a, 'a');
  const b = conjunto(v.b, 'b');
  const resaltar = v.resaltar;
  if (!Object.hasOwn(REGIONES_DE_VENN, resaltar)) throw new Error(`El diagrama de Venn: no se puede resaltar "${resaltar}".`);
  const nombres = v.nombres || ['a', 'b'];
  if (!Array.isArray(nombres) || nombres.length !== 2) throw new Error('El diagrama de Venn: "nombres" son dos nombres.');
  const soloA = a.filter((x) => !b.includes(x));
  const ambos = a.filter((x) => b.includes(x));
  const soloB = b.filter((x) => !a.includes(x));
  for (const [region, lista] of [['solo de a', soloA], ['de los dos', ambos], ['solo de b', soloB]]) {
    if (lista.length > 4) throw new Error(`El diagrama de Venn: la region "${region}" tiene ${lista.length} numeros y no entran mas de 4.`);
  }
  const resultado = {
    union: [...soloA, ...ambos, ...soloB],
    interseccion: ambos,
    diferencia: soloA,
    diferenciaInversa: soloB,
  }[resaltar];
  return { a, b, nombres, soloA, ambos, soloB, resaltar, resultado: [...resultado].sort((x, y) => x - y) };
}

export function figuraDe(consigna) {
  // Una letra se dibuja entre comillas simples, como se escribe en el codigo.
  const comoSeEscribeLetras = (v) =>
    Array.isArray(v) ? v.map(comoSeEscribeLetras) : typeof v === 'string' ? `'${v}'` : v;
  const comoSeEscribe = comoSeEscribeLetras;
  const d = consigna.dibujo;
  const propia = (d) => {
    // Una union: un solo lugar, con los nombres de sus miembros y el que tiene el valor.
    if (d.union) return { clase: 'union', titulo: d.titulo, union: d.union, salida: consigna.salida };
    if (d.venn) return { clase: 'venn', titulo: d.titulo, venn: vennDe(d.venn), salida: consigna.salida };
    if (d.plano) return { clase: 'plano', titulo: d.titulo, plano: planoDe(d.plano), salida: consigna.salida };
    if (d.escalera) return { clase: 'escalera', titulo: d.titulo, escalones: ESCALONES_DE_ACCESO, salida: consigna.salida };
    if (d.memoria) return { clase: 'memoria', titulo: d.titulo, celdas: celdasDeMemoria(d.memoria, d.desde), salida: consigna.salida };
    // Un dibujo de nombres de un enumerado ("enumerados": true) no lleva comillas.
    const comoSeEscribe = d.enumerados ? (v) => v : comoSeEscribeLetras;
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
      nombresFilas: d.nombresFilas,
      nombresColumnas: d.nombresColumnas,
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
    partes.push({ nombre: valor.replace(/^(struct|union)\s+/, '') });
    hasta = m.index + m[0].length;
  }
  if (hasta < enunciado.length) partes.push({ texto: enunciado.slice(hasta) });
  return partes;
}

// Las lineas que empiezan con "- " forman una lista; las que empiezan con "> " son
// una formula, cada una en su renglon; las que empiezan con "! " son una
// advertencia (varias seguidas, una sola); lo demas es texto. Parte el enunciado en
// bloques [{ texto }, { items: [...] }, { formula }, { advertencia }], sin las
// lineas en blanco que quedan pegadas a una lista, una formula o una advertencia
// (ya se separan del texto por si solas).
export function bloquesDeEnunciado(enunciado) {
  const bloques = [];
  let texto = [];
  let items = [];
  let aviso = [];
  const cerrarTexto = () => {
    if (texto.length) bloques.push({ texto: texto.join('\n') });
    texto = [];
  };
  const cerrarLista = () => {
    if (items.length) bloques.push({ items });
    items = [];
  };
  const cerrarAviso = () => {
    if (aviso.length) bloques.push({ advertencia: aviso.join(' ') });
    aviso = [];
  };
  for (const linea of enunciado.split('\n')) {
    if (/^! /.test(linea)) {
      cerrarTexto();
      cerrarLista();
      aviso.push(linea.slice(2));
    } else if (/^> /.test(linea)) {
      cerrarTexto();
      cerrarLista();
      cerrarAviso();
      bloques.push({ formula: linea.slice(2) });
    } else if (/^- /.test(linea)) {
      cerrarTexto();
      cerrarAviso();
      items.push(linea.slice(2));
    } else {
      cerrarLista();
      cerrarAviso();
      texto.push(linea);
    }
  }
  cerrarTexto();
  cerrarLista();
  cerrarAviso();
  // Una linea en blanco entre el texto y una lista sobra.
  return bloques
    .map((b, i) => {
      if (!b.texto) return b;
      const aparte = (o) => o && (o.items || o.formula || o.advertencia);
      const pegado = aparte(bloques[i - 1]) || aparte(bloques[i + 1]);
      return pegado ? { texto: b.texto.replace(/^\n+|\n+$/g, '') } : b;
    })
    .filter((b) => b.items || b.formula || b.advertencia || b.texto);
}
