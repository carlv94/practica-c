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

// El nombre del archivo de un ejercicio, o de uno de sus módulos.
export const nombreDePrograma = (examen, ejercicio) => `${examen.id}-${ejercicio.id}.c`;
export const nombreDeModulo = (examen, ejercicio, modulo) => `${examen.id}-${ejercicio.id}-${modulo.id}-${modulo.titulo}.c`;

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
