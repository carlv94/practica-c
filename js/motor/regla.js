// La regla "memoria": corrige un programa completo ejecutandolo con el motor de
// memoria (interprete.js).
//
//   { "memoria": {
//       "casos": [ { "entrada": "3\n1 2 3", "salida": "6", "contexto": "..." } ],
//       "sinFugas": true,
//       "usa": ["malloc", "free"] } }
//
//   casos     cada uno ejecuta el programa entero con ese texto de entrada y compara
//             lo que muestra (sin los espacios ni saltos del final). Sin casos, se
//             ejecuta una vez sin entrada. "contexto" reemplaza el "Con la entrada ...".
//   sinFugas  el programa tiene que liberar todo lo que reserva (FUGA_DE_MEMORIA).
//   usa       funciones de la biblioteca que la respuesta tiene que llamar (por ejemplo
//             malloc): MALLOC_FALTA, FREE_FALTA...
//
// No depende del corrector: recibe el programa y devuelve diagnosticos
// { nivel, codigo, mensaje, fila, bloques } y la ejecucion de cada caso (con la
// traza, si se pide) para el reproductor.

import { ejecutar } from './interprete.js';
import { mensajeDeError, mensajeDeFugas, mensajeDeFuncionFalta, contextoDeEntrada } from './mensajes.js';

// El codigo sin comentarios ni textos entre comillas.
const sinTextos = (codigo) =>
  codigo
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/"(?:\\.|[^"\\])*"/g, '""');

const sinEspaciosFinales = (texto) =>
  texto
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\s+$/, '');

const plano = (t) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[ \t]+/g, ' ')
    .trim();

// "fuente" es el programa entero; "respuesta", lo que escribio el alumno (para
// ver que llama). "traza" pide la traza de cada ejecucion.
export function corregirMemoria(analizador, fuente, respuesta, regla, { traza = false } = {}) {
  const diagnosticos = [];
  const ejecuciones = [];
  const diag = (nivel, codigo, mensaje, fila = null, bloques = null) =>
    diagnosticos.push({ nivel, codigo, mensaje, fila, ...(bloques ? { bloques } : {}) });

  const codigo = sinTextos(respuesta);
  for (const nombre of regla.usa || []) {
    if (!new RegExp(`\\b${nombre}\\s*\\(`).test(codigo)) {
      diag('error', `${nombre.toUpperCase()}_FALTA`, mensajeDeFuncionFalta(nombre));
      return { diagnosticos, ejecuciones };
    }
  }

  for (const caso of regla.casos || [{}]) {
    const entrada = caso.entrada ?? '';
    const con = caso.contexto != null ? (caso.contexto ? `${caso.contexto}, ` : '') : contextoDeEntrada(entrada);
    const r = ejecutar(analizador, fuente, { entrada, traza });
    ejecuciones.push({ caso, resultado: r });
    if (r.error) {
      const m = mensajeDeError(r.error, con);
      diag(m.nivel, m.codigo, m.mensaje, r.error.fila);
      return { diagnosticos, ejecuciones };
    }
    if (caso.salida != null) {
      const sale = sinEspaciosFinales(r.salida);
      const debe = String(caso.salida).trim();
      if (sale !== debe) {
        const casiIgual = sale && debe && plano(sale) === plano(debe);
        const sujeto = con ? `${con}el programa` : 'El programa';
        diag(
          'error',
          casiIgual ? 'MUESTRA_CASI_IGUAL' : sale ? 'MUESTRA_DISTINTA' : 'MUESTRA_FALTA',
          !sale
            ? `${sujeto} no muestra nada: la consigna pide mostrar el texto con \`printf\`.`
            : casiIgual
              ? `${sujeto} muestra casi lo pedido, pero el texto tiene que ser exactamente el de la consigna, con las mismas mayúsculas, tildes y espacios:`
              : `${sujeto} muestra otro texto:`,
          null,
          !sale
            ? [{ titulo: 'Tiene que mostrar:', lineas: [debe] }]
            : [{ lineas: sale.split('\n') }, { titulo: 'Tiene que mostrar:', lineas: debe.split('\n') }]
        );
        return { diagnosticos, ejecuciones };
      }
    }
    if (regla.sinFugas && r.fugas.length) {
      diag('error', 'FUGA_DE_MEMORIA', mensajeDeFugas(con, r.fugas.length));
      return { diagnosticos, ejecuciones };
    }
  }
  return { diagnosticos, ejecuciones };
}
