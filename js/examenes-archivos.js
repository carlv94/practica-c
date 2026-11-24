// Los archivos .c que se bajan de la página de exámenes: el programa completo de un ejercicio (el mismo que se ejecuta paso a paso, con el main
// de demostración si lo tiene) o el código de uno de sus módulos. Cada uno lleva una cabecera, en un comentario, que dice de qué examen y
// ejercicio es, que es la resolución del docente (y que el main de demostración no es parte del examen), la entrada de ejemplo y cómo compilarlo.

// Un texto partido en renglones de hasta "ancho" letras.
export function partirTexto(texto, ancho = 72) {
  const renglones = [];
  let actual = '';
  for (const palabra of String(texto).split(/\s+/).filter(Boolean)) {
    if (actual && (actual + ' ' + palabra).length > ancho) {
      renglones.push(actual);
      actual = palabra;
    } else actual = actual ? actual + ' ' + palabra : palabra;
  }
  if (actual) renglones.push(actual);
  return renglones;
}

const comentario = (lineas) => '/*\n' + lineas.map((l) => (l ? ' * ' + l : ' *')).join('\n') + '\n */\n\n';

// Un texto de la página sin las comillas de código (`x`) que usa el JSON.
const sinMarcas = (t) => String(t).replace(/`/g, '');

const compilar = (nombre, texto) => {
  const matematica = /#include\s*<math\.h>/.test(texto) ? ' -lm' : '';
  return `Para compilarlo y ejecutarlo (con gcc): gcc -Wall -o programa ${nombre}${matematica} && ./programa`;
};

// Un ejercicio con varios archivos (un TAD: el .h, el .c y el main) trae "archivos": [{ nombre, codigo }] en lugar de "programa". Para ejecutarlo
// paso a paso se unen en un solo texto (separados por una línea en blanco; los #include propios los ignora el motor) y se guarda de qué línea
// a qué línea va cada archivo ("tramos"), para mostrarlos por separado.
export const esMultiple = (ejercicio) => Array.isArray(ejercicio.archivos) && ejercicio.archivos.length > 0;

export function unirArchivos(archivos) {
  const tramos = [];
  const partes = [];
  let linea = 1;
  for (const a of archivos) {
    const codigo = a.codigo.replace(/\n+$/, '');
    const cuantas = codigo.split('\n').length;
    tramos.push({ nombre: a.nombre, desde: linea, hasta: linea + cuantas - 1 });
    partes.push(codigo);
    linea += cuantas + 1; // (la línea en blanco que separa a los archivos)
  }
  return { texto: partes.join('\n\n'), tramos };
}

// Deja listo un ejercicio de varios archivos: "programa" (el texto unido que se ejecuta) y "tramos".
export function completarEjercicio(ejercicio) {
  if (esMultiple(ejercicio)) {
    const { texto, tramos } = unirArchivos(ejercicio.archivos);
    ejercicio.programa = texto;
    ejercicio.tramos = tramos;
  }
  return ejercicio;
}

// El archivo al que pertenece un módulo (el que tiene escrita su solución).
export const archivoDelModulo = (ejercicio, modulo) => ejercicio.archivos.find((a) => a.codigo.includes(modulo.solucion)) || ejercicio.archivos.find((a) => a.nombre === modulo.archivo);

// El nombre del archivo de un ejercicio, o de uno de sus módulos (en un ejercicio de varios archivos, el del archivo al que pertenece).
export const nombreDePrograma = (examen, ejercicio) => `${examen.id}-${ejercicio.id}.c`;
export const nombreDeModulo = (examen, ejercicio, modulo) =>
  esMultiple(ejercicio) ? archivoDelModulo(ejercicio, modulo).nombre : `${examen.id}-${ejercicio.id}-${modulo.id}-${modulo.titulo}.c`;

// Los archivos que se bajan de un ejercicio: uno solo, o los de un TAD (cada uno con su cabecera y su nombre de verdad: los #include los usan).
export function archivosDePrograma(examen, ejercicio) {
  if (!esMultiple(ejercicio)) return [{ nombre: nombreDePrograma(examen, ejercicio), texto: archivoDePrograma(examen, ejercicio) }];
  const numero = examen.ejercicios.indexOf(ejercicio) + 1;
  const fuentes = ejercicio.archivos.filter((a) => a.nombre.endsWith('.c'));
  const principal = (fuentes.find((a) => a.nombre === 'main.c') || fuentes[0]).nombre;
  const comando = ['main.c', ...fuentes.map((a) => a.nombre).filter((n) => n !== principal)];
  const matematica = ejercicio.archivos.some((a) => /#include\s*<math\.h>/.test(a.codigo)) ? ' -lm' : '';
  return ejercicio.archivos.map((a) => {
    const lineas = [examen.titulo, `Ejercicio ${numero}: ${ejercicio.titulo}`, `Archivo ${a.nombre}`, '', 'Resolución del docente.'];
    if (a.nombre === principal) {
      if (ejercicio.nota) lineas.push(...partirTexto(sinMarcas(ejercicio.nota)));
      if (ejercicio.entrada) {
        lineas.push('', 'Entrada de ejemplo (lo que se escribe por teclado):');
        for (const l of ejercicio.entrada.replace(/\n+$/, '').split('\n')) lineas.push('  ' + l);
      }
      lineas.push('', `Para compilarlo y ejecutarlo (con gcc, con todos los archivos en la misma carpeta): gcc -Wall -o programa ${[...new Set(comando)].join(' ')}${matematica} && ./programa`);
    } else {
      lineas.push(...partirTexto(`Es parte del programa del ejercicio: se compila junto con ${principal}.`));
    }
    return { nombre: a.nombre, texto: comentario(lineas) + a.codigo.replace(/\n*$/, '\n') };
  });
}

// El programa completo de un ejercicio, con su cabecera.
export function archivoDePrograma(examen, ejercicio) {
  const numero = examen.ejercicios.indexOf(ejercicio) + 1;
  const nombre = nombreDePrograma(examen, ejercicio);
  const lineas = [examen.titulo, `Ejercicio ${numero}: ${ejercicio.titulo}`, '', 'Resolución del docente.'];
  if (ejercicio.nota) lineas.push(...partirTexto(sinMarcas(ejercicio.nota)));
  if (ejercicio.entrada) {
    lineas.push('', 'Entrada de ejemplo (lo que se escribe por teclado):');
    for (const l of ejercicio.entrada.replace(/\n+$/, '').split('\n')) lineas.push('  ' + l);
  }
  lineas.push('', compilar(nombre, ejercicio.programa));
  return comentario(lineas) + ejercicio.programa.replace(/\n*$/, '\n');
}

// El código de un módulo: con los tipos del ejercicio (si los hay) y las bibliotecas que usa, y con la aclaración de que no es un programa
// completo (para ejecutarlo todo, el programa completo del ejercicio).
export function archivoDeModulo(examen, ejercicio, modulo) {
  // En un ejercicio de varios archivos, un módulo es un pedazo de uno de ellos: lo que se baja es el archivo entero.
  if (esMultiple(ejercicio)) return archivosDePrograma(examen, ejercicio).find((a) => a.nombre === archivoDelModulo(ejercicio, modulo).nombre).texto;
  const numero = examen.ejercicios.indexOf(ejercicio) + 1;
  const bibliotecas = [];
  if (/\b(printf|scanf)\b/.test(modulo.solucion)) bibliotecas.push('#include <stdio.h>');
  if (/\b(sqrt|pow)\b/.test(modulo.solucion)) bibliotecas.push('#include <math.h>');
  const lineas = [
    examen.titulo,
    `Ejercicio ${numero}: ${ejercicio.titulo}`,
    `Módulo ${modulo.id}) ${modulo.titulo}`,
    '',
    'Resolución del docente.',
    ...partirTexto('Este archivo es solo el módulo: no es un programa completo. Para ejecutarlo todo, bajar el programa completo del ejercicio.'),
  ];
  const partes = [];
  if (bibliotecas.length) partes.push(bibliotecas.join('\n'));
  if (ejercicio.codigoDado) partes.push(ejercicio.codigoDado.replace(/\n*$/, ''));
  partes.push(modulo.solucion.replace(/\n*$/, ''));
  return comentario(lineas) + partes.join('\n\n') + '\n';
}
