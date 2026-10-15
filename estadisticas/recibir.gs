// Recibe los intentos que manda la practica (js/estadisticas.js) y los guarda
// en la hoja "Intentos" de la hoja de calculo a la que esta atado este script.
// Pasos para ponerlo en marcha: estadisticas/LEEME.md.
//
// Nunca llega el codigo que escribio el alumno, y el identificador es un
// numero al azar de cada navegador: no dice quien es.

const HOJA_INTENTOS = 'Intentos';
const HOJA_RESUMEN = 'Resumen';
const ENCABEZADO = ['fecha', 'anonimo', 'serie', 'consigna', 'resultado', 'conAyuda', 'codigos', 'version'];
const RESULTADOS = ['correcto', 'mejorable', 'incorrecto'];
const ID = /^[a-z0-9-]{1,80}$/;
const CODIGO = /^[A-Z0-9_]{1,60}$/;

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (
      typeof d.anonimo !== 'string' || !ID.test(d.anonimo) ||
      typeof d.serie !== 'string' || !ID.test(d.serie) ||
      typeof d.consigna !== 'string' || !ID.test(d.consigna) ||
      RESULTADOS.indexOf(d.resultado) < 0 ||
      !Array.isArray(d.codigos) || d.codigos.length > 40 ||
      !d.codigos.every((c) => typeof c === 'string' && CODIGO.test(c))
    ) {
      return respuesta('descartado');
    }
    const hoja = hojaDe(HOJA_INTENTOS, ENCABEZADO);
    hoja.appendRow([
      new Date(),
      d.anonimo,
      d.serie,
      d.consigna,
      d.resultado,
      d.conAyuda === true,
      d.codigos.join(' '),
      Number(d.version) || 0,
    ]);
    return respuesta('ok');
  } catch (err) {
    return respuesta('error');
  }
}

function respuesta(texto) {
  return ContentService.createTextOutput(texto);
}

function hojaDe(nombre, encabezado) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(nombre);
  if (!hoja) {
    hoja = libro.insertSheet(nombre);
    if (encabezado) hoja.appendRow(encabezado);
  }
  return hoja;
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Estadisticas').addItem('Actualizar resumen', 'actualizarResumen').addToUi();
}

// Una fila por consigna y por codigo de error: cuantos alumnos distintos lo
// cometieron, sobre cuantos intentaron la consigna. Los mas comunes arriba.
function actualizarResumen() {
  const filas = hojaDe(HOJA_INTENTOS, ENCABEZADO).getDataRange().getValues().slice(1);
  const consignas = {};
  for (const [, anonimo, serie, consigna, resultado, conAyuda, codigos] of filas) {
    const clave = serie + '/' + consigna;
    if (!consignas[clave]) {
      consignas[clave] = {
        serie, consigna, intentos: 0, alumnos: new Set(), resolvieron: new Set(), ayuda: new Set(), errores: {},
      };
    }
    const c = consignas[clave];
    c.intentos++;
    c.alumnos.add(anonimo);
    if (resultado !== 'incorrecto') c.resolvieron.add(anonimo);
    if (conAyuda === true) c.ayuda.add(anonimo);
    for (const codigo of String(codigos).split(' ').filter(Boolean)) {
      if (!c.errores[codigo]) c.errores[codigo] = { intentos: 0, alumnos: new Set() };
      const e = c.errores[codigo];
      e.intentos++;
      e.alumnos.add(anonimo);
    }
  }

  const porConsigna = [['serie', 'consigna', 'alumnos', 'intentos', 'resolvieron', 'pidieron solucion']];
  const porError = [['serie', 'consigna', 'codigo', 'alumnos', 'de los que la intentaron', '% alumnos', 'intentos']];
  const ordenadas = Object.values(consignas).sort((a, b) => b.alumnos.size - a.alumnos.size);
  for (const c of ordenadas) {
    porConsigna.push([c.serie, c.consigna, c.alumnos.size, c.intentos, c.resolvieron.size, c.ayuda.size]);
    for (const [codigo, e] of Object.entries(c.errores)) {
      porError.push([c.serie, c.consigna, codigo, e.alumnos.size, c.alumnos.size, e.alumnos.size / c.alumnos.size, e.intentos]);
    }
  }
  const cuerpo = porError.slice(1).sort((a, b) => b[3] - a[3] || b[6] - a[6]);

  const hoja = hojaDe(HOJA_RESUMEN);
  hoja.clear();
  hoja.getRange(1, 1).setValue('Errores mas comunes (por alumnos distintos)').setFontWeight('bold');
  hoja.getRange(2, 1, 1, porError[0].length).setValues([porError[0]]).setFontWeight('bold');
  if (cuerpo.length) {
    hoja.getRange(3, 1, cuerpo.length, porError[0].length).setValues(cuerpo);
    hoja.getRange(3, 6, cuerpo.length, 1).setNumberFormat('0%');
  }
  const desde = cuerpo.length + 5;
  hoja.getRange(desde, 1).setValue('Consignas (por alumnos distintos)').setFontWeight('bold');
  hoja.getRange(desde + 1, 1, porConsigna.length, porConsigna[0].length).setValues(porConsigna);
  hoja.getRange(desde + 1, 1, 1, porConsigna[0].length).setFontWeight('bold');
}
