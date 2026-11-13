// Las partes de la biblioteca estandar que no tocan la memoria: dar formato a
// printf y leer el texto de entrada de scanf.

import { ErrorDelMotor } from './errores.js';

const CONVERSION = /%([-+ 0#]*)(\d+|\*)?(?:\.(\d+))?(hh|h|ll|l|z|L)?([diouxXcsfeEgGp%])/g;

function conExponente(numero, decimales, mayuscula) {
  let texto = numero.toExponential(decimales);
  texto = texto.replace(/e([+-])(\d)$/, 'e$10$2');
  return mayuscula ? texto.toUpperCase() : texto;
}

function dePrecisionGeneral(numero, precision, mayuscula) {
  const p = precision === 0 ? 1 : precision;
  if (numero === 0) return '0';
  const exponente = Math.floor(Math.log10(Math.abs(numero)));
  let texto;
  if (exponente < -4 || exponente >= p) {
    texto = conExponente(numero, p - 1, mayuscula).replace(/\.?0+(e|E)/, '$1');
  } else {
    texto = numero.toFixed(Math.max(0, p - 1 - exponente));
    if (texto.includes('.')) texto = texto.replace(/\.?0+$/, '');
  }
  return texto;
}

function rellenar(texto, ancho, izquierda, ceros) {
  if (!ancho || texto.length >= ancho) return texto;
  if (izquierda) return texto + ' '.repeat(ancho - texto.length);
  if (ceros) {
    const signo = /^[+-]/.test(texto) ? texto[0] : '';
    const sin = signo ? texto.slice(1) : texto;
    return signo + '0'.repeat(ancho - texto.length) + sin;
  }
  return ' '.repeat(ancho - texto.length) + texto;
}

const sinSigno = (valor, bytes) => {
  const v = Math.trunc(valor);
  if (v >= 0) return v;
  return bytes >= 8 ? v + 2 ** 64 : v + 2 ** (8 * bytes);
};

// El texto que escribe printf. "args" son valores { t, v }; "ayudas" resuelve lo
// que necesita la memoria: cadenaDe(puntero) y direccionDe(puntero).
export function formatear(formato, args, ayudas) {
  let k = 0;
  const siguiente = (conv) => {
    if (k >= args.length) throw new ErrorDelMotor('SIN_VERIFICAR', `printf tiene mas conversiones que valores (falta uno para %${conv})`);
    return args[k++];
  };
  return formato.replace(CONVERSION, (todo, banderas, anchoTexto, precisionTexto, largo, conv) => {
    if (conv === '%') return '%';
    let ancho = anchoTexto === '*' ? Number(siguiente('*').v) : anchoTexto ? Number(anchoTexto) : 0;
    const precision = precisionTexto != null ? Number(precisionTexto) : null;
    const izquierda = banderas.includes('-') || ancho < 0;
    if (ancho < 0) ancho = -ancho;
    const conSigno = banderas.includes('+') ? '+' : banderas.includes(' ') ? ' ' : '';
    const ceros = banderas.includes('0') && !izquierda;
    const arg = siguiente(conv);
    const tipo = arg.t;
    const distinto = (que) => new ErrorDelMotor('FORMATO_DISTINTO', `%${conv} no corresponde a ${que}`, null, { conv, que });
    let texto;
    switch (conv) {
      case 'd':
      case 'i':
        if (tipo.k !== 'int') throw distinto(tipo.k === 'float' ? 'un valor decimal' : 'una direccion');
        texto = (arg.v < 0 ? '-' : conSigno) + String(Math.abs(arg.v));
        break;
      case 'u':
        if (tipo.k !== 'int') throw distinto(tipo.k === 'float' ? 'un valor decimal' : 'una direccion');
        texto = String(sinSigno(arg.v, tipo.bytes));
        break;
      case 'x':
      case 'X':
      case 'o': {
        if (tipo.k !== 'int') throw distinto(tipo.k === 'float' ? 'un valor decimal' : 'una direccion');
        const n = sinSigno(arg.v, tipo.bytes);
        texto = n.toString(conv === 'o' ? 8 : 16);
        if (conv === 'X') texto = texto.toUpperCase();
        break;
      }
      case 'c':
        if (tipo.k !== 'int') throw distinto('algo que no es una letra');
        texto = String.fromCharCode(arg.v & 255);
        break;
      case 's':
        if (tipo.k !== 'ptr') throw distinto('algo que no es un texto');
        texto = ayudas.cadenaDe(arg.v);
        if (precision != null) texto = texto.slice(0, precision);
        break;
      case 'f':
      case 'e':
      case 'E':
      case 'g':
      case 'G': {
        if (tipo.k !== 'float') throw distinto(tipo.k === 'int' ? 'un entero' : 'una direccion');
        const p = precision ?? 6;
        const numero = arg.v;
        const cuerpo = !Number.isFinite(numero)
          ? Number.isNaN(numero) ? 'nan' : 'inf'
          : conv === 'f'
            ? Math.abs(numero).toFixed(p)
            : conv === 'e' || conv === 'E'
              ? conExponente(Math.abs(numero), p, conv === 'E')
              : dePrecisionGeneral(Math.abs(numero), p, conv === 'G');
        texto = (numero < 0 || Object.is(numero, -0) ? '-' : conSigno) + cuerpo;
        break;
      }
      case 'p':
        if (tipo.k !== 'ptr') throw distinto('algo que no es una direccion');
        texto = arg.v === null ? '(nil)' : '0x' + ayudas.direccionDe(arg.v).toString(16);
        break;
      default:
        texto = todo;
    }
    return rellenar(texto, ancho, izquierda, ceros && conv !== 's' && conv !== 'c');
  });
}

// Lo que scanf lee: un texto del que se va tomando.
export class Entrada {
  constructor(texto) {
    this.texto = texto || '';
    this.pos = 0;
  }

  get agotada() {
    return this.pos >= this.texto.length;
  }

  saltarBlancos() {
    while (this.pos < this.texto.length && /\s/.test(this.texto[this.pos])) this.pos++;
  }

  // La siguiente palabra (hasta un blanco), de a lo sumo "ancho" letras.
  palabra(ancho = Infinity) {
    this.saltarBlancos();
    const inicio = this.pos;
    while (this.pos < this.texto.length && !/\s/.test(this.texto[this.pos]) && this.pos - inicio < ancho) this.pos++;
    return this.texto.slice(inicio, this.pos);
  }

  caracter() {
    if (this.agotada) return null;
    return this.texto[this.pos++];
  }

  // Lee un numero entero o decimal del comienzo, sin pasar de lo que sea parte de uno.
  numero(decimal) {
    this.saltarBlancos();
    const resto = this.texto.slice(this.pos);
    const m = (decimal ? /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/ : /^[+-]?\d+/).exec(resto);
    if (!m) return null;
    this.pos += m[0].length;
    return Number(m[0]);
  }

  // Un caracter que tiene que estar tal cual (lo que va escrito en el formato).
  coincide(c) {
    if (this.texto[this.pos] === c) {
      this.pos++;
      return true;
    }
    return false;
  }
}

// El formato de scanf, en piezas: { blanco } | { literal } | { conv, ancho, ignorar, largo }.
export function piezasDeScanf(formato) {
  const piezas = [];
  const re = /(\s+)|%(\*)?(\d+)?(hh|h|ll|l|L)?([diuxXcsfeEgG%])|([^%\s])/g;
  let m;
  while ((m = re.exec(formato))) {
    if (m[1]) piezas.push({ blanco: true });
    else if (m[5] === '%') piezas.push({ literal: '%' });
    else if (m[5]) piezas.push({ conv: m[5], ancho: m[3] ? Number(m[3]) : Infinity, ignorar: Boolean(m[2]), largo: m[4] || '' });
    else piezas.push({ literal: m[6] });
  }
  return piezas;
}
