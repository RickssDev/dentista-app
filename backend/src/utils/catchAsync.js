// utils/catchAsync.js

/**
 * Envoltorio (Wrapper) para controladores asíncronos en Express.
 * Atrapa cualquier error (promesa rechazada) dentro de la función y lo pasa
 * automáticamente al middleware global de manejo de errores mediante `next()`.
 * Elimina la necesidad de escribir bloques `try/catch` manuales en cada controlador.
 *
 * @param {Function} fn - La función asíncrona del controlador a envolver. Debe recibir (req, res, next).
 * @returns {Function} Una nueva función de middleware de Express que maneja las promesas.
 *
 * @example
 * // Ejemplo de uso en un Controlador (Ej. Obtener un producto en Ferretería):
 * const catchAsync = require('../../utils/catchAsync');
 * const productService = require('./product.service');
 *
 * exports.getProduct = catchAsync(async (req, res, next) => {
 * // Si el servicio lanza un AppError (ej. Producto no encontrado),
 * // catchAsync lo atrapa y el flujo salta al manejador global de errores.
 * const product = await productService.findById(req.params.id);
 * * res.status(200).json({
 * success: true,
 * data: product
 * });
 * });
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        // Ejecuta la función y, si la promesa es rechazada, pasa el error a next()
        fn(req, res, next).catch(next);
    };
};

module.exports = catchAsync;