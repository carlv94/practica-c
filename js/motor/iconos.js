// Los iconos de los botones del reproductor y de sus paneles. Se dibujan como imagen (SVG) y no con caracteres de la tipografia: asi se ven
// igual de gruesos en todos los celulares y toman el color del texto del boton. Cada uno es un dibujo en un cuadro de 24 x 24.
export const ICONOS = {
  avanzar: '<path d="M3 4l9 8-9 8zM12 4l9 8-9 8z"/>',
  pausa: '<rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/>',
  detener: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  seguir: '<path d="M7 4l13 8-13 8z"/>',
  repetir: '<path d="M20 12a8 8 0 1 1-2.6-5.9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M20 3.5V9h-5.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  ampliar: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  cerrar: '<path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
  paradaAnterior: '<circle cx="17" cy="12" r="4.5"/><path d="M11 5l-8 7 8 7z"/>',
  paradaSiguiente: '<circle cx="7" cy="12" r="4.5"/><path d="M13 5l8 7-8 7z"/>',
  casoBase: '<path d="M12 3v11M6.5 9.5L12 15l5.5-5.5M5 20h14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  // un engranaje: un aro con ocho dientes
  engranaje:
    '<circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="3.4"/><path d="M12 2.5v3.5M12 18v3.5M2.5 12H6M18 12h3.5M5.3 5.3l2.5 2.5M16.2 16.2l2.5 2.5M5.3 18.7l2.5-2.5M16.2 7.8l2.5-2.5" fill="none" stroke="currentColor" stroke-width="3.6"/>',
  // la "i" de informacion dentro de un circulo
  info: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M12 11v6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><circle cx="12" cy="7.4" r="1.7"/>',
  menos: '<path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  mas: '<path d="M5 12h14M12 5v14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  // dos flechas en diagonal que se alejan: agrandar una ventana
  expandir: '<path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
};

// El SVG de un icono, como texto (para ponerlo con innerHTML).
export const iconoSvg = (nombre) => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">${ICONOS[nombre]}</svg>`;
