// Los tipos de C que sigue el motor, como datos:
//
//   { k: 'int', nombre, bytes, sinSigno }    char, short, int, long (y sus unsigned)
//   { k: 'float', nombre, bytes }            float, double
//   { k: 'ptr', a }                          puntero a un tipo "a"
//   { k: 'arr', de, n }                      arreglo de "n" elementos de tipo "de"
//   { k: 'struct', nombre, campos, esUnion } campos: [{ nombre, tipo }] (null mientras se declara)
//   { k: 'void' }
//
// Lo que ocupa cada tipo es el de una maquina de uso comun: char 1, short 2,
// int y float 4, long y double 8, un puntero 8; una estructura, con sus campos
// alineados como lo hace un compilador.

export const VOID = { k: 'void', nombre: 'void', bytes: 1 };
export const CHAR = { k: 'int', nombre: 'char', bytes: 1, sinSigno: false, esChar: true };
export const INT = { k: 'int', nombre: 'int', bytes: 4, sinSigno: false };
export const LONG = { k: 'int', nombre: 'long', bytes: 8, sinSigno: false };
export const FLOAT = { k: 'float', nombre: 'float', bytes: 4 };
export const DOUBLE = { k: 'float', nombre: 'double', bytes: 8 };

export const puntero = (a) => ({ k: 'ptr', a, bytes: 8 });
export const arreglo = (de, n) => ({ k: 'arr', de, n });
export const nuevaEstructura = (nombre, esUnion = false) => ({ k: 'struct', nombre, campos: null, esUnion });

export const esEntero = (t) => t.k === 'int';
export const esNumero = (t) => t.k === 'int' || t.k === 'float';
export const esPuntero = (t) => t.k === 'ptr';

// El tipo de unas palabras como "unsigned long" o "short".
export function tipoDePalabras(texto) {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const tiene = (p) => palabras.includes(p);
  const sinSigno = tiene('unsigned');
  if (tiene('double')) return DOUBLE;
  if (tiene('float')) return FLOAT;
  if (tiene('void')) return VOID;
  if (tiene('char')) return sinSigno ? { ...CHAR, nombre: 'unsigned char', sinSigno: true } : CHAR;
  if (tiene('short')) return { k: 'int', nombre: sinSigno ? 'unsigned short' : 'short', bytes: 2, sinSigno };
  if (tiene('long')) return { k: 'int', nombre: sinSigno ? 'unsigned long' : 'long', bytes: 8, sinSigno };
  if (sinSigno) return { ...INT, nombre: 'unsigned int', sinSigno: true };
  return INT;
}

export function alineacion(t) {
  switch (t.k) {
    case 'arr':
      return alineacion(t.de);
    case 'struct':
      return Math.max(1, ...(t.campos || []).map((c) => alineacion(c.tipo)));
    default:
      return t.bytes || 1;
  }
}

export function tamano(t) {
  switch (t.k) {
    case 'arr':
      return tamano(t.de) * t.n;
    case 'struct': {
      if (t._tam != null) return t._tam;
      const al = alineacion(t);
      let fin = 0;
      for (const c of t.campos || []) {
        const a = alineacion(c.tipo);
        const inicio = t.esUnion ? 0 : Math.ceil(fin / a) * a;
        fin = t.esUnion ? Math.max(fin, tamano(c.tipo)) : inicio + tamano(c.tipo);
      }
      t._tam = Math.max(1, Math.ceil(fin / al) * al);
      return t._tam;
    }
    default:
      return t.bytes || 1;
  }
}

// Como se escribe un tipo: "int", "TNodo *", "int [5]".
export function textoDeTipo(t) {
  switch (t.k) {
    case 'ptr':
      return textoDeTipo(t.a) + (t.a.k === 'ptr' ? '*' : ' *');
    case 'arr':
      return `${textoDeTipo(t.de)} [${t.n ?? ''}]`;
    case 'struct':
      return t.alias || (t.nombre ? `struct ${t.nombre}` : 'struct');
    default:
      return t.nombre;
  }
}

export const mismoTipo = (a, b) => {
  if (a === b) return true;
  if (a.k !== b.k) return false;
  if (a.k === 'ptr') return mismoTipo(a.a, b.a);
  if (a.k === 'arr') return a.n === b.n && mismoTipo(a.de, b.de);
  if (a.k === 'struct') return false;
  return a.bytes === b.bytes && a.sinSigno === b.sinSigno && a.nombre === b.nombre;
};
