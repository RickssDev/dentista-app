// Contexto por petición y por trabajo programado (spec 026, ADR 0011).
// Guarda el identificador (requestId o jobId) y la referencia a `req`, para que el logger
// los encuentre en cualquier punto de la cadena asíncrona sin pasarlos por parámetro.
const { AsyncLocalStorage } = require('node:async_hooks');

const almacen = new AsyncLocalStorage();

/**
 * Ejecuta `fn` con el contexto dado; todo lo que `fn` dispare (promesas, callbacks) lo hereda.
 * @param {{ requestId?: string, jobId?: string, req?: object }} datos
 * @param {Function} fn
 */
const ejecutarConContexto = (datos, fn) => almacen.run({ ...datos }, fn);

/** Contexto de la ejecución actual, o `undefined` fuera de una petición o trabajo. */
const contextoActual = () => almacen.getStore();

module.exports = { ejecutarConContexto, contextoActual };
