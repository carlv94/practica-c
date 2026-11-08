// Descarga de los archivos de una consigna. Sin dependencias: un .zip sin
// compresion ("store") se arma a mano, con el CRC32 que pide el formato.

const codificador = new TextEncoder();

const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) c = TABLA_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Pasa los archivos [{ nombre, texto }] a los bytes de un .zip sin comprimir.
export function armarZip(archivos) {
  const partes = [];
  const central = [];
  let desplazamiento = 0;
  const u16 = (v, dv, o) => dv.setUint16(o, v, true);
  const u32 = (v, dv, o) => dv.setUint32(o, v, true);
  for (const { nombre, texto } of archivos) {
    const nom = codificador.encode(nombre);
    const datos = codificador.encode(texto);
    const crc = crc32(datos);
    // Cabecera local (30 bytes) + nombre + datos. Bit 11: nombre en UTF-8.
    const local = new DataView(new ArrayBuffer(30));
    u32(0x04034b50, local, 0);
    u16(20, local, 4);
    u16(0x0800, local, 6);
    u16(0, local, 8);
    u16(0, local, 10);
    u16(0x21, local, 12); // fecha: 1980-01-01
    u32(crc, local, 14);
    u32(datos.length, local, 18);
    u32(datos.length, local, 22);
    u16(nom.length, local, 26);
    u16(0, local, 28);
    partes.push(new Uint8Array(local.buffer), nom, datos);
    // Entrada del directorio central (46 bytes) + nombre.
    const dir = new DataView(new ArrayBuffer(46));
    u32(0x02014b50, dir, 0);
    u16(20, dir, 4);
    u16(20, dir, 6);
    u16(0x0800, dir, 8);
    u16(0, dir, 10);
    u16(0, dir, 12);
    u16(0x21, dir, 14);
    u32(crc, dir, 16);
    u32(datos.length, dir, 20);
    u32(datos.length, dir, 24);
    u16(nom.length, dir, 28);
    u32(desplazamiento, dir, 42);
    central.push(new Uint8Array(dir.buffer), nom);
    desplazamiento += 30 + nom.length + datos.length;
  }
  const tamCentral = central.reduce((s, p) => s + p.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  u32(0x06054b50, fin, 0);
  u16(archivos.length, fin, 8);
  u16(archivos.length, fin, 10);
  u32(tamCentral, fin, 12);
  u32(desplazamiento, fin, 16);
  const todo = [...partes, ...central, new Uint8Array(fin.buffer)];
  const salida = new Uint8Array(todo.reduce((s, p) => s + p.length, 0));
  let o = 0;
  for (const p of todo) {
    salida.set(p, o);
    o += p.length;
  }
  return salida;
}

// El texto que acompana a los archivos: como compilarlos en una PC.
export function leeme(archivos) {
  const nombres = archivos.map((a) => a.nombre);
  const fuentes = nombres.filter((n) => n.endsWith('.c'));
  // Con math.h (sqrt, pow) gcc necesita la biblioteca matematica al final: -lm.
  const matematica = archivos.some((a) => /#include\s*<math\.h>/.test(a.texto || '')) ? ' -lm' : '';
  const lineas = ['Archivos de la práctica de C', ''];
  if (fuentes.length && nombres.includes('main.c')) {
    lineas.push('Para compilar y ejecutar (con gcc instalado), desde esta carpeta:', '');
    lineas.push('  gcc -Wall -o programa ' + fuentes.join(' ') + matematica, '  ./programa', '');
  } else if (fuentes.length) {
    lineas.push('Estos archivos no tienen una función main: escriba un main.c que los use y compile con:', '');
    lineas.push('  gcc -Wall -o programa main.c ' + fuentes.join(' ') + matematica, '');
  }
  lineas.push('El simulador de la página es más permisivo que un compilador real:');
  lineas.push('si gcc muestra advertencias, vale la pena corregirlas.');
  return lineas.join('\r\n') + '\r\n';
}

function guardar(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Un solo archivo se baja tal cual; varios, en un .zip con un LEEME.txt.
export function descargar(nombreBase, archivos) {
  if (archivos.length === 1) {
    guardar(new Blob([archivos[0].texto], { type: 'text/plain;charset=utf-8' }), archivos[0].nombre);
    return;
  }
  const bytes = armarZip([...archivos, { nombre: 'LEEME.txt', texto: leeme(archivos) }]);
  guardar(new Blob([bytes], { type: 'application/zip' }), nombreBase + '.zip');
}
