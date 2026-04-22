// utils/AppError.js

/**
 * @class AppError
 * @extends Error
 * @description Clase personalizada para el manejo centralizado de errores operativos en la API.
 * Inyecta el código de estado HTTP y formatea la respuesta para el manejador global.
 * * @example
 * // Ejemplo de uso en un Servicio (Ej. Validación de stock en Ferretería):
 * const AppError = require('../../utils/AppError');
 * * if (stock < quantity) {
 * throw new AppError('Stock insuficiente para realizar la venta', 400);
 * }
 * * @example
 * // Ejemplo de uso para un recurso no encontrado:
 * if (!product) {
 * throw new AppError('El martillo solicitado no existe', 404);
 * }
 */
class AppError extends Error {
  /**
   * Crea una instancia de AppError.
   * * @param {string} message - El mensaje de error amigable que verá el cliente (Frontend).
   * @param {number} statusCode - El código de estado HTTP (ej. 400, 401, 403, 404, 500).
   */
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    
    // Si el error es 4xx (Error del cliente), el status es 'fail'.
    // Si el error es 5xx (Error del servidor), el status es 'error'.
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    // Bandera para identificar que es un error operativo (controlado por nosotros)
    // y no un bug de programación inesperado (ej. sintaxis o fallos de la librería).
    this.isOperational = true;

    // Evita que esta misma clase (AppError) aparezca en el stack trace, 
    // mostrando directamente dónde se originó el error en el controlador o servicio.
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;