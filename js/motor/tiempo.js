// El reloj de las animaciones del reproductor: lo que se espera (los temporizadores), lo que se mide (en cuantos
// milisegundos va una animacion que se calcula cuadro a cuadro) y lo que ya esta en marcha (las animaciones del navegador)
// se pueden detener y seguir todo junto. Mientras esta detenido, "ahora" no avanza y los temporizadores no corren.
//
//   tiempo.esperar(funcion, ms)   como setTimeout, pero se detiene con el reloj; devuelve algo para cancelar
//   tiempo.cancelar(espera)       como clearTimeout (acepta null)
//   tiempo.ahora(cuadro)          como performance.now(), sin contar lo que estuvo detenido ("cuadro": la hora que da
//                                 requestAnimationFrame, si se la tiene)
//   tiempo.pausar() / continuar() / pausado
//   tiempo.alCambiar(funcion)     avisa a "funcion(pausado)" cuando se detiene o sigue; devuelve como dejar de avisar
class Tiempo {
  constructor() {
    this.desfase = 0; // lo que estuvo detenido, para restarlo
    this.desde = null; // cuando se detuvo (null: corriendo)
    this.esperas = new Set();
    this.oyentes = [];
  }

  get pausado() {
    return this.desde !== null;
  }

  ahora(cuadro = performance.now()) {
    return (this.desde !== null ? this.desde : cuadro) - this.desfase;
  }

  armar(espera) {
    espera.armada = performance.now();
    espera.id = setTimeout(() => {
      this.esperas.delete(espera);
      espera.id = null;
      espera.funcion();
    }, espera.restante);
  }

  esperar(funcion, ms) {
    const espera = { funcion, restante: Math.max(0, Number(ms) || 0), id: null, armada: 0 };
    this.esperas.add(espera);
    if (!this.pausado) this.armar(espera);
    return espera;
  }

  cancelar(espera) {
    if (!espera || typeof espera !== 'object') return;
    clearTimeout(espera.id);
    espera.id = null;
    this.esperas.delete(espera);
  }

  pausar() {
    if (this.pausado) return;
    const ahora = performance.now();
    this.desde = ahora;
    for (const espera of this.esperas) {
      clearTimeout(espera.id);
      espera.id = null;
      espera.restante = Math.max(0, espera.restante - (ahora - espera.armada));
    }
    this.avisar();
  }

  continuar() {
    if (!this.pausado) return;
    this.desfase += performance.now() - this.desde;
    this.desde = null;
    for (const espera of [...this.esperas]) this.armar(espera);
    this.avisar();
  }

  avisar() {
    for (const f of [...this.oyentes]) f(this.pausado);
  }

  alCambiar(funcion) {
    this.oyentes.push(funcion);
    return () => {
      this.oyentes = this.oyentes.filter((f) => f !== funcion);
    };
  }
}

export const tiempo = new Tiempo();
