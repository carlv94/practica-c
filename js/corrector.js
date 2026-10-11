// Corrige una respuesta contra las reglas de su consigna.
//
//   corregir(analizador, consigna, { contexto, respuesta, capturas, dentroDeMain, practicas })
//     -> { correcto, mejorable, diagnosticos, capturas }
//
// Un diagnostico es un error (la respuesta no vale), un aviso (vale, pero hay
// algo raro) o una mejora (vale, pero hay una forma mejor: solo en las series
// que piden esa buena practica). "mejorable" es correcta con alguna mejora; si
// la serie pide practicas y no queda ninguna, la respuesta es excelente.
//
// Desde la pantalla y las pruebas se llama por js/serie.js, que sabe armar el
// contexto de cada paso.
//
// "contexto" es el codigo que el alumno ya resolvio en las consignas anteriores
// de la serie: se analiza junto con la respuesta, para que "la estructura
// anterior" sea la que escribio el, se llame como se llame.
//
// Las capturas son los nombres que una consigna deja para las que siguen
// ("S" = "struct Puesto"). Una regla las usa con "$S".
//
// Cada diagnostico lleva un codigo fijo (CAMPO_FALTA, FALTA_PUNTO_Y_COMA...)
// ademas del mensaje: el mensaje se puede reescribir, el codigo es lo que
// sirve para contar cuales son los errores mas comunes.
//
// Reglas que entiende "requiere" (ver LEEME.md):
//   { "struct":   { "campos": [{ "nombre", "tipo" }], "capturar": "S" } }
//   { "variable": { "tipo": "$S", "conAlias": true } }
//   { "variable": { "nombre": "notas", "tipo": "entero", "arreglo": 20 } }
//   { "alias":    { "de": "$S", "capturar": "A" } }
//   { "llamada":  { "funcion": "strcpy", "argumentos": ["cadena2", "cadena1"] } }

import {
  construirModelo,
  erroresDeSintaxis,
  resolver,
  tipoDesdeTexto,
  textoDeTipo,
  enPalabras,
} from './modelo.js';

// Las palabras de un tipo entero van en cualquier orden: "unsigned int", "int unsigned".
const DE_ENTERO = ['unsigned', 'signed', 'short', 'int', 'long'];
const esEntero = (t) => t.split(' ').every((palabra) => DE_ENTERO.includes(palabra));
const esReal = (t) => ['float', 'double', 'double long'].includes(t.split(' ').sort().join(' '));

// Lo que puede pedir una consigna como tipo de un campo, ademas de "cadena".
const CATEGORIAS = {
  entero: { es: esEntero, pide: 'un número entero', pideVarios: 'números enteros' },
  real: { es: esReal, pide: 'un número con decimales', pideVarios: 'números con decimales' },
  caracter: { es: (t) => t === 'char', pide: 'un solo carácter', pideVarios: 'caracteres' },
};

const PALABRAS_DE_C = [
  'struct', 'typedef', 'char', 'int', 'float', 'double', 'long', 'short', 'unsigned', 'signed',
  'void', 'const', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break',
];
const TIPOS_BASICOS = ['char', 'int', 'float', 'double', 'long', 'short', 'unsigned', 'void'];

function distancia(a, b) {
  const fila = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const arriba = fila[j];
      fila[j] = Math.min(arriba + 1, fila[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = arriba;
    }
  }
  return fila[b.length];
}

// El tipo que pide una regla, para un mensaje: "de la estructura `Puesto`".
// De una estructura se dice el nombre y no "struct Puesto", que es justo lo
// que el alumno tiene que saber escribir.
function nombrarPedido(pedido) {
  const partes = pedido.trim().split(/\s+/);
  return partes[0] === 'struct' ? `de la estructura \`${partes[1]}\`` : `del tipo \`${pedido}\``;
}

function mismoTipo(a, b) {
  if (a.clase !== b.clase) return false;
  if (a.clase === 'struct') return a.def === b.def;
  if (a.clase === 'primitivo') return a.nombre === b.nombre;
  return false;
}

// Las funciones de la biblioteca que un alumno puede llegar a escribir: sirve
// para distinguir "se equivoco de funcion" de "la escribio mal".
const DE_LA_BIBLIOTECA = [
  'strcpy', 'strncpy', 'strcat', 'strncat', 'strcmp', 'strncmp', 'strlen', 'strchr', 'strstr',
  'printf', 'scanf', 'puts', 'gets', 'fgets', 'sprintf', 'memcpy',
];

export function corregir(
  analizador,
  consigna,
  { contexto = '', respuesta = '', capturas = {}, dentroDeMain = false, practicas = [] }
) {
  // Una sentencia suelta ("strcpy(a, b);") solo vale dentro de una funcion:
  // en las series de sentencias el codigo se analiza envuelto en una, que el
  // alumno no ve ni escribe.
  const previo =
    (dentroDeMain ? 'void practica(void) {\n' : '') +
    (contexto.trim() ? contexto.replace(/\s+$/, '') + '\n\n' : '');
  const fuente = previo + respuesta + (dentroDeMain ? '\n}' : '');
  const desde = previo.length;
  const filaBase = previo.split('\n').length - 1;

  const diagnosticos = [];
  const nuevas = { ...capturas };

  // "fila" es la del codigo completo; al alumno se le dice la linea de SU respuesta.
  function diag(nivel, codigo, mensaje, fila) {
    diagnosticos.push({
      nivel,
      codigo,
      mensaje,
      linea: fila == null ? null : fila - filaBase + 1,
    });
  }
  const error = (codigo, mensaje, fila) => diag('error', codigo, mensaje, fila);
  const aviso = (codigo, mensaje, fila) => diag('aviso', codigo, mensaje, fila);
  // Una mejora no invalida: la respuesta esta bien, pero hay una forma mejor.
  const mejora = (codigo, mensaje, fila) => diag('mejora', codigo, mensaje, fila);

  function terminar() {
    const correcto = !diagnosticos.some((d) => d.nivel === 'error');
    // Las mejoras son para una respuesta que ya esta bien: con un error, lo
    // unico que importa es el error.
    const informados = correcto ? diagnosticos : diagnosticos.filter((d) => d.nivel !== 'mejora');
    return {
      correcto,
      mejorable: correcto && diagnosticos.some((d) => d.nivel === 'mejora'),
      diagnosticos: informados,
      capturas: correcto ? nuevas : capturas,
    };
  }

  if (!respuesta.trim()) {
    error('VACIO', 'Todavía no hay nada escrito.');
    return terminar();
  }
  if (dentroDeMain && /\bmain\s*\(/.test(respuesta)) {
    error(
      'MAIN_DE_MAS',
      'No hace falta escribir `main`: alcanza con las sentencias que pide la consigna.',
      filaBase + respuesta.slice(0, respuesta.search(/\bmain\s*\(/)).split('\n').length - 1
    );
    return terminar();
  }

  const arbol = analizador.parse(fuente);
  try {
    // Con la sintaxis rota, lo demas saldria de un arbol a medio armar y los
    // mensajes confundirian: primero se arregla esto.
    const rotos = erroresDeSintaxis(arbol, desde);
    if (rotos.length) {
      // Primero los errores que se reconocen, con su explicacion; si no es
      // ninguno de esos, lo que diga el analizador.
      const conocidos = erroresConocidos(respuesta);
      for (const c of conocidos) error(c.codigo, c.mensaje, filaBase + c.fila);
      if (!conocidos.length) for (const roto of rotos) informarSintaxis(roto, fuente, error);
      return terminar();
    }

    const modelo = construirModelo(arbol, desde);
    revisarNombres(modelo, error);
    revisarAsignaciones(modelo, error);
    revisarDimensiones(modelo, error, practicas.includes('constantes') ? mejora : null);
    for (const regla of consigna.requiere) aplicarRegla(regla, modelo);
    return terminar();
  } finally {
    arbol.delete();
  }

  function valorDe(referencia) {
    if (!referencia.startsWith('$')) return referencia;
    const valor = nuevas[referencia.slice(1)];
    if (!valor) {
      throw new Error(
        `La consigna "${consigna.id}" usa ${referencia}, que ninguna consigna anterior capturó.`
      );
    }
    return valor;
  }

  function aplicarRegla(regla, modelo) {
    if (regla.struct) return reglaStruct(regla.struct, modelo);
    if (regla.variable) return reglaVariable(regla.variable, modelo);
    if (regla.alias) return reglaAlias(regla.alias, modelo);
    if (regla.llamada) return reglaLlamada(regla.llamada, modelo);
    throw new Error(`La consigna "${consigna.id}" tiene una regla que no conozco.`);
  }

  // ---- struct ---------------------------------------------------------------

  function reglaStruct(regla, modelo) {
    const candidatos = modelo.structs.filter((s) => s.nuevo);
    if (!candidatos.length) {
      error(
        'STRUCT_FALTA',
        'No encontré la declaración de una estructura.'
      );
      return;
    }

    // Si hay mas de una, la que mas se parece a lo pedido.
    const pedidos = regla.campos.map((c) => c.nombre);
    const aciertos = (s) => s.campos.filter((c) => pedidos.includes(c.nombre)).length;
    const def = candidatos.reduce((mejor, s) => (aciertos(s) > aciertos(mejor) ? s : mejor));

    const sinUsar = new Set(def.campos);
    for (const esperado of regla.campos) {
      const campo = def.campos.find((c) => c.nombre === esperado.nombre);
      if (campo) {
        sinUsar.delete(campo);
        verificarCampo(campo, esperado, modelo);
        continue;
      }

      const parecido = [...sinUsar].find(
        (c) =>
          !pedidos.includes(c.nombre) &&
          (c.nombre.toLowerCase() === esperado.nombre.toLowerCase() ||
            distancia(c.nombre, esperado.nombre) <= 2)
      );
      if (!parecido) {
        error('CAMPO_FALTA', `Falta el campo \`${esperado.nombre}\`.`, def.fila);
        continue;
      }
      sinUsar.delete(parecido);
      const soloMayusculas = parecido.nombre.toLowerCase() === esperado.nombre.toLowerCase();
      error(
        'CAMPO_NOMBRE',
        `El campo \`${parecido.nombre}\` tendría que llamarse \`${esperado.nombre}\`` +
          (soloMayusculas ? ': en C las mayúsculas y las minúsculas son letras distintas.' : '.'),
        parecido.fila
      );
      verificarCampo(parecido, esperado, modelo);
    }

    for (const campo of sinUsar) {
      aviso('CAMPO_DE_MAS', `La consigna no pide el campo \`${campo.nombre}\`.`, campo.fila);
    }

    // Sin etiqueta y sin alias, la estructura no se puede volver a nombrar.
    const alias = modelo.aliases.find(
      (a) => a.tipo.defId === def.id && !a.punteros && !a.arreglo.length
    );
    if (!def.etiqueta && !alias) {
      error(
        'STRUCT_SIN_NOMBRE',
        'La estructura no tiene nombre, así que después no se la va a poder usar. ' +
          'El nombre va entre `struct` y la llave.',
        def.fila
      );
      return;
    }
    if (regla.capturar) {
      nuevas[regla.capturar] = def.etiqueta ? 'struct ' + def.etiqueta : alias.nombre;
    }
  }

  function verificarCampo(campo, esperado, modelo) {
    const real = resolver(campo.tipo, modelo);
    if (real.clase === 'desconocido') return; // ya lo dijo revisarNombres
    const base = real.clase === 'primitivo' ? real.nombre : null;
    const n = campo.nombre;
    const declarado = `Está declarado como ${enPalabras(campo)}.`;

    if (esperado.tipo === 'cadena') {
      if (base !== 'char') {
        error(
          'CAMPO_TIPO',
          `\`${n}\` guarda un texto: tiene que ser una cadena de caracteres. ${declarado}`,
          campo.fila
        );
      } else if (campo.punteros) {
        error(
          'CAMPO_CADENA_PUNTERO',
          `\`${n}\` está declarado con \`*\`: así no reserva lugar para guardar el texto. Tiene que ser un arreglo de caracteres, con su dimensión.`,
          campo.fila
        );
      } else if (campo.arreglo.length === 0) {
        error(
          'CAMPO_CADENA_SIN_DIMENSION',
          `\`${n}\` así guarda un solo carácter. Para un texto hace falta un arreglo de caracteres, con su dimensión.`,
          campo.fila
        );
      } else if (campo.arreglo.length > 1) {
        error(
          'CAMPO_CADENA_DIMENSIONES',
          `\`${n}\` tiene ${campo.arreglo.length} dimensiones: eso es una tabla de caracteres. Para un texto alcanza con una.`,
          campo.fila
        );
      } else if (campo.arreglo[0].trim() === '') {
        error(
          'CAMPO_CADENA_SIN_DIMENSION',
          `A \`${n}\` le falta la dimensión entre los corchetes.`,
          campo.fila
        );
      } else if (/^\d+$/.test(campo.arreglo[0].trim()) && Number(campo.arreglo[0]) < 2) {
        error(
          'CAMPO_CADENA_CORTA',
          `En \`${n}\` no entra ningún texto: una cadena necesita un lugar más que sus letras, para el \`\\0\` del final.`,
          campo.fila
        );
      }
      return;
    }

    const categoria = CATEGORIAS[esperado.tipo];
    if (!categoria) {
      throw new Error(`La consigna "${consigna.id}" pide un tipo que no conozco: ${esperado.tipo}`);
    }
    if (campo.arreglo.length) {
      error(
        'CAMPO_ES_ARREGLO',
        `\`${n}\` tiene que ser ${categoria.pide}, no un arreglo: sobran los corchetes.`,
        campo.fila
      );
    } else if (campo.punteros) {
      error(
        'CAMPO_ES_PUNTERO',
        `\`${n}\` tiene que ser ${categoria.pide}: sobra el \`*\`.`,
        campo.fila
      );
    } else if (!base || !categoria.es(base)) {
      error('CAMPO_TIPO', `\`${n}\` tiene que ser ${categoria.pide}. ${declarado}`, campo.fila);
    }
  }

  // ---- variable -------------------------------------------------------------

  function reglaVariable(regla, modelo) {
    // El tipo pedido es uno concreto ("$S", "int") o una categoria ("entero").
    const pedido = valorDe(regla.tipo);
    const categoria = CATEGORIAS[pedido];
    const objetivo = categoria ? null : resolver(tipoDesdeTexto(pedido), modelo);
    const esDelTipo = (v) => {
      const real = resolver(v.tipo, modelo);
      return categoria
        ? real.clase === 'primitivo' && categoria.es(real.nombre)
        : mismoTipo(real, objetivo);
    };
    const quiereArreglo = regla.arreglo != null && regla.arreglo !== false;
    let candidatas = modelo.variables.filter((v) => v.nuevo);

    if (!candidatas.length) {
      const esAlias = modelo.aliases.some((a) => a.nuevo);
      error(
        'VARIABLE_FALTA',
        (esAlias
          ? 'Eso define un alias (un nombre nuevo para un tipo), no una variable. '
          : 'No encontré la declaración de una variable. ') +
          'Una variable se declara con el tipo y después el nombre: `tipo nombre;`'
      );
      return;
    }

    if (regla.nombre) {
      const conNombre = candidatas.filter((v) => v.nombre === regla.nombre);
      if (!conNombre.length) {
        // Con la palabra del enunciado: sale de lo que pide la consigna, no
        // de lo que escribio el alumno.
        const [que, declarado] = quiereArreglo
          ? ['el arreglo', 'El que está declarado']
          : ['la variable', 'La que está declarada'];
        error(
          'VARIABLE_NOMBRE',
          `La consigna pide que ${que} se llame \`${regla.nombre}\`.` +
            (candidatas.length === 1 ? ` ${declarado} se llama \`${candidatas[0].nombre}\`.` : ''),
          candidatas[0].fila
        );
        return;
      }
      candidatas = conNombre;
    }

    const delTipo = candidatas.filter(esDelTipo);
    const exacta = delTipo.find(
      (v) => !v.punteros && (quiereArreglo ? v.arreglo.length === 1 : !v.arreglo.length)
    );

    if (exacta) {
      if (regla.conAlias && exacta.tipo.clase !== 'nombre') {
        const alias = nuevas.A ? ` (\`${nuevas.A}\`)` : '';
        error(
          'VARIABLE_SIN_ALIAS',
          `\`${exacta.nombre}\` está bien declarada, pero con \`${textoDeTipo(exacta.tipo)}\`. La consigna pide usar el alias${alias}.`,
          exacta.fila
        );
      }
      // Con un numero, el arreglo tiene que tener justo esa cantidad, este
      // escrita como numero o con una constante que valga eso.
      const tiene = typeof regla.arreglo === 'number' ? valorDeDimension(exacta.arreglo[0], modelo) : null;
      // Los dos son error, pero no son el mismo: de menos no entra lo que hay
      // que guardar; de mas entra, y no es lo que pide el problema.
      const elementos = (n) => (n === 1 ? '1 elemento' : `${n} elementos`);
      if (tiene != null && tiene < regla.arreglo) {
        error(
          'ARREGLO_CHICO',
          `\`${exacta.nombre}\` tiene lugar para ${elementos(tiene)} y hay que guardar ${regla.arreglo}: no alcanza.`,
          exacta.fila
        );
      } else if (tiene != null && tiene > regla.arreglo) {
        error(
          'ARREGLO_GRANDE',
          `\`${exacta.nombre}\` tiene lugar para ${elementos(tiene)} y la consigna pide ${regla.arreglo}: sobra lugar.`,
          exacta.fila
        );
      }
      return;
    }

    const v = delTipo[0] || candidatas[0];
    if (!delTipo.length) {
      if (resolver(v.tipo, modelo).clase !== 'desconocido') {
        error(
          'VARIABLE_TIPO',
          `\`${v.nombre}\` es ${enPalabras(v)}. ` +
            (!categoria
              ? `Tiene que ser ${nombrarPedido(pedido)}.`
              : !quiereArreglo
                ? `Tiene que ser ${categoria.pide}.`
                : v.arreglo.length
                  ? `Sus elementos tienen que ser ${categoria.pideVarios}.`
                  : `Tiene que ser un arreglo de ${categoria.pideVarios}.`),
          v.fila
        );
      }
    } else if (v.punteros) {
      error(
        'VARIABLE_PUNTERO',
        `A \`${v.nombre}\` le sobra el \`*\`: la consigna pide ${quiereArreglo ? 'un arreglo' : 'una variable'} común.`,
        v.fila
      );
    } else if (!quiereArreglo) {
      error(
        'VARIABLE_ARREGLO',
        `\`${v.nombre}\` es un arreglo. La consigna pide una sola variable: sobran los corchetes.`,
        v.fila
      );
    } else if (!v.arreglo.length) {
      error(
        'VARIABLE_NO_ES_ARREGLO',
        `\`${v.nombre}\` es una sola variable. La consigna pide un arreglo: falta indicar cuántos elementos tiene.`,
        v.fila
      );
    } else {
      error(
        'ARREGLO_DIMENSIONES',
        `\`${v.nombre}\` tiene ${v.arreglo.length} dimensiones: eso es una tabla. La consigna pide un arreglo de una sola.`,
        v.fila
      );
    }
  }

  // ---- llamada a una funcion -------------------------------------------------

  function reglaLlamada(regla, modelo) {
    const aceptadas = [regla.funcion, ...(regla.alternativas || [])];
    const esperados = (regla.argumentos || []).map(valorDe);
    const llamadas = modelo.llamadas.filter((l) => l.nuevo);
    const llamada = llamadas.find((l) => aceptadas.includes(l.funcion));

    if (!llamada) {
      // Si ya se le dijo que un arreglo no se asigna con "=", con eso alcanza.
      if (diagnosticos.some((d) => d.codigo === 'ASIGNACION_DE_ARREGLO')) return;

      const ciclo = modelo.ciclos.find((c) => c.nuevo);
      const otra = llamadas[0];
      const parecida =
        otra &&
        !DE_LA_BIBLIOTECA.includes(otra.funcion) &&
        aceptadas.find(
          (a) => a.toLowerCase() === otra.funcion.toLowerCase() || distancia(a, otra.funcion) <= 2
        );
      if (ciclo) {
        error(
          'A_MANO',
          'Hacerlo a mano, recorriendo carácter por carácter, puede funcionar, pero la consigna pide usar la función de la biblioteca.',
          ciclo.fila
        );
      } else if (parecida) {
        error(
          'FUNCION_MAL_ESCRITA',
          `No existe ninguna función llamada \`${otra.funcion}\`. ¿Quiso escribir \`${parecida}\`?`,
          otra.fila
        );
      } else if (otra) {
        error('FUNCION_EQUIVOCADA', `\`${otra.funcion}\` no es la función que pide esta consigna.`, otra.fila);
      } else {
        error(
          'LLAMADA_FALTA',
          'No encontré la llamada a una función. Una función se usa con su nombre y, entre paréntesis, sus argumentos: `funcion(a, b);`'
        );
      }
      return;
    }

    // La funcion pedida lleva justo esos argumentos; una alternativa puede
    // llevar alguno mas al final (strncpy y su cantidad).
    const reales = llamada.argumentos;
    const justos = llamada.funcion === regla.funcion;
    if (justos ? reales.length !== esperados.length : reales.length < esperados.length) {
      error(
        'ARGUMENTOS_CANTIDAD',
        `\`${llamada.funcion}\` lleva ${esperados.length} argumentos, separados por coma, y acá hay ${reales.length}.`,
        llamada.fila
      );
      return;
    }

    const libre = (i) => esperados[i] === '*';
    const acierta = (i) => libre(i) || (reales[i].clase === 'nombre' && reales[i].nombre === esperados[i]);
    if (esperados.every((_, i) => acierta(i))) return;

    // Los mismos nombres, en otro lugar.
    const escritos = esperados.map((_, i) => (reales[i].clase === 'nombre' ? reales[i].nombre : null));
    if (!escritos.includes(null) && [...escritos].sort().join() === [...esperados].sort().join()) {
      error(
        'ARGUMENTOS_EN_OTRO_ORDEN',
        'Los argumentos están en otro orden.' +
          (regla.orden ? ` En \`${llamada.funcion}\` ${regla.orden}.` : ''),
        llamada.fila
      );
      return;
    }

    esperados.forEach((esperado, i) => {
      if (acierta(i)) return;
      const real = reales[i];
      if (real.clase === 'cadena' && real.contenido === esperado) {
        error(
          'ARGUMENTO_ENTRE_COMILLAS',
          `\`${real.texto}\` con comillas es un texto, no la variable \`${esperado}\`: el nombre de una variable va sin comillas.`,
          llamada.fila
        );
      } else if (real.clase === 'direccion' && real.nombre === esperado) {
        error(
          'ARGUMENTO_CON_AMPERSAND',
          `A \`${esperado}\` le sobra el \`&\`: una cadena se pasa con su nombre solo.`,
          llamada.fila
        );
      } else if (real.clase === 'indice' && real.nombre === esperado) {
        error(
          'ARGUMENTO_CON_CORCHETES',
          `\`${real.texto}\` es un solo carácter de la cadena. Para pasar la cadena entera va el nombre solo, sin corchetes.`,
          llamada.fila
        );
      } else if (real.clase === 'nombre' && !modelo.variables.some((v) => v.nombre === real.nombre)) {
        const parecida = modelo.variables.find((v) => v.nombre.toLowerCase() === real.nombre.toLowerCase());
        error(
          'VARIABLE_DESCONOCIDA',
          `No hay ninguna variable llamada \`${real.nombre}\`.` +
            (parecida
              ? ` La que está declarada es \`${parecida.nombre}\`: en C las mayúsculas y las minúsculas son letras distintas.`
              : ''),
          llamada.fila
        );
      } else {
        error(
          'ARGUMENTO_EQUIVOCADO',
          `El argumento ${i + 1} de \`${llamada.funcion}\` (\`${real.texto}\`) no es el que corresponde.`,
          llamada.fila
        );
      }
    });
  }

  // ---- alias ----------------------------------------------------------------

  function reglaAlias(regla, modelo) {
    const pedido = valorDe(regla.de);
    const objetivo = resolver(tipoDesdeTexto(pedido), modelo);
    const candidatos = modelo.aliases.filter((a) => a.nuevo);

    if (!candidatos.length) {
      const esVariable = modelo.variables.some((v) => v.nuevo);
      error(
        'ALIAS_FALTA',
        (esVariable
          ? 'Eso declara una variable, no un alias. '
          : 'No encontré la definición de un alias. ') +
          'Un alias es un nombre nuevo para un tipo que ya existe.'
      );
      return;
    }

    const delTipo = candidatos.filter((a) => mismoTipo(resolver(a.tipo, modelo), objetivo));
    const exacto = delTipo.find((a) => !a.punteros && !a.arreglo.length);
    if (exacto) {
      if (regla.capturar) nuevas[regla.capturar] = exacto.nombre;
      return;
    }

    const a = delTipo[0] || candidatos[0];
    if (delTipo.length && a.punteros) {
      error(
        'ALIAS_PUNTERO',
        `A \`${a.nombre}\` le sobra el \`*\`: así no queda como alias de la estructura.`,
        a.fila
      );
    } else if (delTipo.length) {
      error(
        'ALIAS_ARREGLO',
        `\`${a.nombre}\` queda como alias de un arreglo de estructuras: sobran los corchetes.`,
        a.fila
      );
    } else if (resolver(a.tipo, modelo).clase !== 'desconocido') {
      error(
        'ALIAS_TIPO',
        `\`${a.nombre}\` es un alias de ${enPalabras(a)}. Tiene que ser un alias ${nombrarPedido(pedido)}.`,
        a.fila
      );
    }
  }
}

// Lo que vale para cualquier consigna: tipos que no existen y cosas que se
// vuelven a declarar.
function revisarNombres(modelo, error) {
  const usos = [
    ...modelo.variables.filter((v) => v.nuevo),
    ...modelo.aliases.filter((a) => a.nuevo),
    ...modelo.structs.filter((s) => s.nuevo).flatMap((s) => s.campos),
  ];
  const avisados = new Set();

  for (const uso of usos) {
    const real = resolver(uso.tipo, modelo);
    if (real.clase !== 'desconocido' || avisados.has(real.que + real.nombre)) continue;
    avisados.add(real.que + real.nombre);
    const nombre = real.nombre;
    const enMinuscula = nombre.toLowerCase();

    if (real.que === 'etiqueta') {
      let mensaje = `No hay ninguna estructura llamada \`${nombre}\`.`;
      const parecida = modelo.structs.find((s) => s.etiqueta && s.etiqueta.toLowerCase() === enMinuscula);
      if (parecida) {
        mensaje += ` La que está declarada es \`${parecida.etiqueta}\`: en C las mayúsculas y las minúsculas son letras distintas.`;
      } else if (modelo.aliases.some((a) => a.nombre === nombre)) {
        mensaje += ` \`${nombre}\` es un alias: se usa solo, sin la palabra \`struct\`.`;
      }
      error('TIPO_DESCONOCIDO', mensaje, uso.fila);
      continue;
    }

    let mensaje = `\`${nombre}\` no es un tipo que exista.`;
    const alias = modelo.aliases.find((a) => a.nombre.toLowerCase() === enMinuscula);
    const parecido = TIPOS_BASICOS.find((t) => t.length > 3 && distancia(t, enMinuscula) === 1);
    if (TIPOS_BASICOS.includes(enMinuscula)) {
      mensaje += ` Las palabras de C van todas en minúscula: \`${enMinuscula}\`.`;
    } else if (modelo.structs.some((s) => s.etiqueta === nombre)) {
      mensaje = `\`${nombre}\` es el nombre de una estructura, pero así solo no es un tipo: falta indicar que se trata de una estructura.`;
    } else if (alias) {
      mensaje += ` El alias está definido como \`${alias.nombre}\`: en C las mayúsculas y las minúsculas son letras distintas.`;
    } else if (enMinuscula === 'string') {
      mensaje += ' En C no hay un tipo para los textos: se guardan en un arreglo de caracteres.';
    } else if (enMinuscula === 'boolean' || enMinuscula === 'integer' || enMinuscula === 'real') {
      mensaje += ' Ese nombre es de otro lenguaje: en C los tipos básicos se llaman distinto.';
    } else if (parecido) {
      mensaje += ` ¿Quiso escribir \`${parecido}\`?`;
    }
    error('TIPO_DESCONOCIDO', mensaje, uso.fila);
  }

  for (const s of modelo.structs.filter((x) => x.nuevo && x.etiqueta)) {
    if (modelo.structs.some((otro) => otro !== s && otro.id < s.id && otro.etiqueta === s.etiqueta)) {
      error(
        'STRUCT_REDEFINIDA',
        `La estructura \`${s.etiqueta}\` ya está declarada: no hay que escribirla de nuevo, solo lo que pide esta consigna.`,
        s.fila
      );
    }
  }

  const aliasVistos = new Set();
  for (const a of modelo.aliases) {
    if (a.nuevo && aliasVistos.has(a.nombre)) {
      error('ALIAS_REDEFINIDO', `Ya hay un alias llamado \`${a.nombre}\`: hay que elegir otro nombre.`, a.fila);
    }
    aliasVistos.add(a.nombre);
  }
}

// Cuanto vale una dimension: 20 si dice "20", o si dice "MAX" y hay un
// "#define MAX 20". null si no se puede saber sin calcular (MAX + 1).
function valorDeDimension(texto, modelo) {
  const escrito = texto.trim();
  const constante = modelo.constantes.find((c) => c.nombre === escrito);
  const numero = /^\(?\s*(\d+)\s*\)?$/.exec(constante ? constante.valor : escrito);
  return numero ? Number(numero[1]) : null;
}

// Las dimensiones de los arreglos nuevos.
//
// Para cualquier consigna: un nombre como dimension tiene que estar definido,
// y antes. "int lista[MAX];" sin un #define en la respuesta ni en el codigo
// hasta aca es un error, como lo seria al compilar.
//
// Y si la serie pide la practica "constantes" (llega "mejora"): un numero
// suelto vale, pero lo ideal es una constante con nombre. La respuesta queda
// correcta y no excelente.
function revisarDimensiones(modelo, error, mejora) {
  const arreglos = [
    ...modelo.variables.filter((v) => v.nuevo),
    ...modelo.aliases.filter((a) => a.nuevo),
    ...modelo.structs.filter((s) => s.nuevo).flatMap((s) => s.campos),
  ].filter((d) => d.arreglo.length);
  const dichos = new Set();
  const unaVez = (clave) => !dichos.has(clave) && dichos.add(clave);

  for (const declarado of arreglos) {
    for (const dimension of declarado.arreglo) {
      const escrito = dimension.trim();
      if (/^\d+$/.test(escrito)) {
        if (!mejora || !unaVez('numero' + declarado.fila)) continue;
        // Si ya hay una constante con ese valor, lo que falta no es saber que
        // es un #define sino usar el que esta. Que valga lo mismo no asegura
        // que sea la misma cantidad: eso lo decide el alumno.
        const yaDefinidas = modelo.constantes.filter(
          (c) =>
            c.clase === 'define' &&
            c.indice < declarado.indice &&
            valorDeDimension(c.nombre, modelo) === Number(escrito)
        );
        if (yaDefinidas.length) {
          const nombres = yaDefinidas.map((c) => `\`${c.nombre}\``).join(' y ');
          mejora(
            'CONSTANTE_SIN_REUTILIZAR',
            (yaDefinidas.length === 1
              ? `Ya hay una constante que vale \`${escrito}\`: ${nombres}. Si representa esta misma cantidad, conviene usarla en lugar del número.`
              : `Ya hay constantes que valen \`${escrito}\`: ${nombres}. Si alguna representa esta misma cantidad, conviene usarla en lugar del número.`) +
              ' Si es otra cosa que vale lo mismo, conviene darle su propio nombre.',
            declarado.fila
          );
        } else {
          mejora(
            'NUMERO_MAGICO',
            `\`${escrito}\` es un número suelto: no dice qué representa, y si el día de mañana el tamaño cambia hay que buscarlo por todo el programa. Lo ideal es darle un nombre con \`#define\` y usar ese nombre.`,
            declarado.fila
          );
        }
        continue;
      }
      if (!/^[A-Za-z_]\w*$/.test(escrito)) continue;

      const constante = modelo.constantes.find((c) => c.nombre === escrito);
      const variable = modelo.variables.find((v) => v.nombre === escrito);
      if (constante) {
        if (constante.indice > declarado.indice && unaVez('despues' + escrito)) {
          error(
            'CONSTANTE_DEFINIDA_DESPUES',
            `\`${escrito}\` está definida más abajo: tiene que estar antes de la línea que la usa.`,
            declarado.fila
          );
        }
      } else if (variable) {
        if (mejora && unaVez('variable' + escrito)) {
          mejora(
            'DIMENSION_CON_VARIABLE',
            `\`${escrito}\` es una variable${variable.esConst ? ', aunque sea `const`' : ''}, no una constante. Para la dimensión de un arreglo lo ideal es una constante definida con \`#define\`.`,
            declarado.fila
          );
        }
      } else if (unaVez('falta' + escrito)) {
        error(
          'CONSTANTE_SIN_DEFINIR',
          `\`${escrito}\` no está definida: una constante hay que definirla antes de usarla.`,
          declarado.fila
        );
      }
    }
  }

  if (!mejora) return;
  for (const c of modelo.constantes) {
    if (c.nuevo && c.clase === 'define' && c.nombre !== c.nombre.toUpperCase()) {
      mejora(
        'CONSTANTE_EN_MINUSCULA',
        `Por convención, las constantes se escriben en mayúscula, para distinguirlas de las variables: \`${c.nombre.toUpperCase()}\`.`,
        c.fila
      );
    }
  }
}

// Un arreglo no se asigna entero con "=": vale para cualquier consigna, porque
// en C nunca es valido. Con una cadena, es el error de quien todavia no sabe
// que para copiarla hay una funcion.
function revisarAsignaciones(modelo, error) {
  for (const a of modelo.asignaciones) {
    if (!a.nuevo || a.izquierda.clase !== 'nombre') continue;
    const variable = modelo.variables.findLast((v) => v.nombre === a.izquierda.nombre);
    if (!variable || !variable.arreglo.length || variable.punteros) continue;
    const esCadena = variable.tipo.clase === 'primitivo' && variable.tipo.nombre === 'char';
    error(
      'ASIGNACION_DE_ARREGLO',
      `\`${variable.nombre}\` es un arreglo: no se puede asignar completo con \`=\`.` +
        (esCadena ? ' Para copiar una cadena en otra se usa una función de la biblioteca de cadenas.' : ''),
      a.fila
    );
  }
}

// Los errores de sintaxis de siempre, buscados en el texto de la respuesta. El
// analizador avisa que algo esta roto pero no siempre donde ni por que: una
// llave sin cerrar la informa en el primer renglon. Solo se llama cuando ya se
// sabe que la sintaxis esta mal, asi que no puede marcar algo que estaba bien.
//   -> [{ codigo, mensaje, fila }]   fila contada desde 0 dentro de la respuesta
function erroresConocidos(respuesta) {
  // Sin comentarios ni textos entre comillas, que pueden traer cualquier cosa.
  const codigo = respuesta.replace(
    /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g,
    (tramo) => tramo.replace(/[^\n]/g, ' ')
  );
  const filaDe = (indice) => codigo.slice(0, indice).split('\n').length - 1;
  const hallados = [];
  const hallar = (codigoError, mensaje, indice) =>
    hallados.push({ codigo: codigoError, mensaje, fila: filaDe(indice) });

  // Llaves, corchetes y parentesis que no cierran.
  const PARES = { '{': '}', '[': ']', '(': ')' };
  const NOMBRES = {
    '{': ['LLAVE', 'La llave `{`'],
    '[': ['CORCHETE', 'El corchete `[`'],
    '(': ['PARENTESIS', 'El paréntesis `(`'],
  };
  const abiertos = [];
  for (let i = 0; i < codigo.length; i++) {
    const c = codigo[i];
    if (PARES[c]) {
      abiertos.push({ c, i });
    } else if (c === '}' || c === ']' || c === ')') {
      const ultimo = abiertos[abiertos.length - 1];
      if (ultimo && PARES[ultimo.c] === c) {
        abiertos.pop();
      } else if (abiertos.some((a) => PARES[a.c] === c)) {
        // Cierra algo de mas afuera: lo que quedo sin cerrar es lo de adentro.
        break;
      } else {
        const abre = Object.keys(PARES).find((k) => PARES[k] === c);
        hallar('SOBRA_' + NOMBRES[abre][0], `Sobra este \`${c}\`: no hay ningún \`${abre}\` abierto que le corresponda.`, i);
        return hallados;
      }
    }
  }
  if (abiertos.length) {
    const { c, i } = abiertos[abiertos.length - 1];
    hallar('FALTA_' + NOMBRES[c][0], `${NOMBRES[c][1]} que se abre en esta línea no se cierra: falta un \`${PARES[c]}\`.`, i);
    return hallados;
  }

  // Una palabra de C con mayuscula o mal tipeada.
  for (const m of codigo.matchAll(/[A-Za-z_]\w*/g)) {
    const palabra = m[0];
    if (PALABRAS_DE_C.includes(palabra)) continue;
    const enMinuscula = palabra.toLowerCase();
    if (PALABRAS_DE_C.includes(enMinuscula)) {
      hallar('PALABRA_CON_MAYUSCULA', `\`${palabra}\` se escribe \`${enMinuscula}\`: las palabras de C van todas en minúscula.`, m.index);
    } else {
      const parecida = ['struct', 'typedef', 'float', 'double', 'unsigned'].find(
        (p) => distancia(p, enMinuscula) === 1
      );
      if (parecida) hallar('PALABRA_MAL_ESCRITA', `\`${palabra}\` no es una palabra de C. ¿Quiso escribir \`${parecida}\`?`, m.index);
    }
  }
  if (hallados.length) return hallados;

  const TIPO = '(?:char|int|float|double|long|short|unsigned|struct)';
  const FORMAS = [
    [
      new RegExp(`\\bstruct\\s+\\w*\\s*\\(`),
      'PARENTESIS_POR_LLAVES',
      'Los campos de una estructura van entre llaves `{ }`, no entre paréntesis.',
    ],
    [
      new RegExp(`,\\s*${TIPO}\\b`),
      'COMA_POR_PUNTO_Y_COMA',
      'Cada declaración termina con `;`. La coma solo separa varios nombres del mismo tipo: `tipo a, b;`',
    ],
    [
      new RegExp(`\\b${TIPO}\\s*\\[`),
      'CORCHETES_ANTES_DEL_NOMBRE',
      'En C los corchetes van después del nombre, no del tipo: `tipo nombre[cantidad];`',
    ],
    [
      new RegExp(`\\w\\s*\\(\\s*(?!${TIPO}\\b)\\w+\\s+\\w`),
      'FALTA_COMA',
      'Los argumentos de una función se separan con coma: `funcion(a, b);`',
    ],
    [
      /\btypedef\s+\w+\s+struct\b/,
      'TYPEDEF_AL_REVES',
      'En un `typedef` va primero el tipo que ya existe y al final el nombre nuevo: `typedef tipoQueYaExiste nombreNuevo;`',
    ],
    [
      /\bstruct\s+\w*\s*\{[^}]*=/,
      'VALOR_EN_CAMPO',
      'Dentro de una estructura solo se declaran los campos: no se les puede dar un valor ahí. El valor se pone después, en cada variable.',
    ],
  ];
  for (const [forma, codigoError, mensaje] of FORMAS) {
    const m = forma.exec(codigo);
    if (m) hallar(codigoError, mensaje, m.index + m[0].length - 1);
  }
  return hallados;
}

const QUE_FALTA = {
  ';': ['FALTA_PUNTO_Y_COMA', 'Falta un `;`'],
  '}': ['FALTA_LLAVE', 'Falta cerrar una llave con `}`'],
  ']': ['FALTA_CORCHETE', 'Falta cerrar un corchete con `]`'],
  ')': ['FALTA_PARENTESIS', 'Falta cerrar un paréntesis con `)`'],
  identifier: ['FALTA_NOMBRE', 'Falta un nombre'],
  type_identifier: ['FALTA_NOMBRE', 'Falta un nombre'],
  field_identifier: ['FALTA_NOMBRE', 'Falta el nombre del campo'],
};

function informarSintaxis(roto, fuente, error) {
  // Lo que falta, falta al final de lo ultimo que se escribio antes: ahi es
  // donde hay que mirar, no donde arranca lo que sigue.
  let indice = roto.indice;
  if (roto.clase === 'falta') {
    while (indice > 0 && /\s/.test(fuente[indice - 1])) indice--;
    indice = Math.max(indice - 1, 0);
  }
  const fila = fuente.slice(0, indice).split('\n').length - 1;

  if (roto.clase === 'falta') {
    const [codigo, texto] = QUE_FALTA[roto.que] || ['FALTA_ALGO', `Falta \`${roto.que}\``];
    error(codigo, `${texto} al final de esta línea.`, fila);
    return;
  }

  const fragmento = roto.texto.trim().split('\n')[0].slice(0, 40);
  error(
    'NO_SE_ENTIENDE',
    `No se entiende \`${fragmento}\`. Revise que no falte un \`;\`, una llave o un corchete, y que cada palabra esté bien escrita.`,
    fila
  );
}
