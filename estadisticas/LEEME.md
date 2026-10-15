# Estadisticas de errores

La practica manda, de forma anonima, un registro por cada intento a una hoja de
calculo de Google que es suya. Esto es lo que se envia, y nada mas:

- la serie y la consigna;
- si el intento fue `correcto`, `mejorable` o `incorrecto`;
- los codigos de error (`CICLO_INCOMPLETO`, `ENUM_FALTA`, ...);
- si pidio la solucion;
- un numero al azar, propio de cada navegador, que permite contar alumnos
  distintos y no solo intentos;
- la version del formato.

**Nunca** se envia el codigo que escribe el alumno. No se envia desde
`localhost` ni desde `/pruebas/`.

## Ponerlo en marcha (unos 5 minutos, con su cuenta de Google)

1. Cree una hoja de calculo nueva en Google Drive (por ejemplo "Practica C").
2. Menu **Extensiones > Apps Script**. Borre lo que haya y pegue el contenido de
   `estadisticas/recibir.gs`. Guarde.
3. **Implementar > Nueva implementacion**. Tipo: **Aplicacion web**.
   - Ejecutar como: **Yo**.
   - Quien tiene acceso: **Cualquier usuario**.
   Google pide autorizar el script la primera vez: acepte.
4. Copie la **URL de la aplicacion web** (termina en `/exec`).
5. Pegela en `js/estadisticas.js`, en la constante `DIRECCION`, y publique la
   practica. Desde ese momento aparece el aviso al pie y se envian los datos.

Si despues cambia el script, hay que hacer **Implementar > Administrar
implementaciones > Editar > Nueva version**; la URL se mantiene.

## Ver los resultados

- La hoja **Intentos** recibe una fila por intento.
- En la hoja de calculo, menu **Estadisticas > Actualizar resumen** (aparece al
  recargar la hoja). Arma la hoja **Resumen** con:
  - los errores mas comunes, por **alumnos distintos** y porcentaje de los que
    intentaron esa consigna;
  - por consigna: alumnos, intentos, cuantos la resolvieron y cuantos pidieron
    la solucion.

## Si se llena de basura

La direccion es publica (esta en el codigo de GitHub) y cualquiera podria
mandarle datos. El script descarta lo que no tiene la forma esperada, pero un
envio con la forma correcta entra. Si pasara, se borran las filas de la hoja
**Intentos**, o se crea una implementacion nueva y se cambia la URL.
