const { resumirError } = require("../utils/logger");

/**
 * Convierte errores de JWT, de identidad y de subida a un formato operacional consistente.
 * @param {Error} err
 * @returns {Error}
 */
function normalizeJwtError(err) {
  if (err.name === "TokenExpiredError") {
    return {
      ...err,
      statusCode: 401,
      status: "fail",
      isOperational: true,
      message: "El token ha expirado. Inicia sesion nuevamente.",
    };
  }

  if (err.name === "JsonWebTokenError") {
    return {
      ...err,
      statusCode: 401,
      status: "fail",
      isOperational: true,
      message: "Token invalido.",
    };
  }

  if (err.name === "MissingAuthorizationError") {
    return {
      ...err,
      statusCode: 401,
      status: "fail",
      isOperational: true,
      message: "Token requerido",
    };
  }

  if (
    err.name === "MissingUserIdentityError" ||
    /falta la identidad|falta.*id|falta.*rol/i.test(err.message || "")
  ) {
    return {
      ...err,
      statusCode: 401,
      status: "fail",
      isOperational: true,
      message: "Token invalido: falta la identidad o el rol del usuario.",
    };
  }

  if (err.name === "AccountDisabledError") {
    return {
      ...err,
      statusCode: 401,
      status: "fail",
      isOperational: true,
      message: "Tu cuenta está desactivada o ya no existe.",
    };
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return {
      ...err,
      statusCode: 400,
      status: "fail",
      isOperational: true,
      message: "La imagen supera el tamaño máximo permitido de 6 MB.",
    };
  }

  return err;
}

/**
 * Resumen del error para la línea «Petición atendida» (spec 026). Nunca lleva el cuerpo de la
 * petición ni el mensaje original de un error de cliente que no es nuestro: un JSON mal formado
 * trae el cuerpo crudo en `body` y un fragmento en `message` (TM11).
 */
function resumenParaRegistro(err, normalizedError, statusCode, isOperational) {
  if (statusCode >= 500) return resumirError(err);

  const errorName = normalizedError.name || err.name || "Error";

  if (isOperational) {
    return { error_name: errorName, message: normalizedError.message };
  }

  const resumen = { error_name: errorName };
  if (typeof err.type === "string") resumen.type = err.type;
  return resumen;
}

/**
 * Middleware global de manejo de errores.
 * - En desarrollo expone stack para depuracion.
 * - En produccion solo expone mensajes operacionales controlados.
 * - Normaliza errores comunes (ej. JWT) para respuestas predecibles.
 * - No escribe en el log: deja el resumen en `res.locals.errorRegistro` y lo registra
 *   `registroPeticion` dentro de su única línea por petición (spec 026, /analyze A1).
 *
 * @param {Error & {statusCode?: number, status?: string, isOperational?: boolean}} err
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 * @returns {void}
 */
// eslint-disable-next-line no-unused-vars -- Express reconoce el manejador de errores por sus 4 parámetros.
const errorHandler = (err, _req, res, _next) => {
  const isDev = process.env.NODE_ENV === "development";
  const normalizedError = normalizeJwtError(err);

  const statusCode = normalizedError.statusCode || 500;
  const isOperational = Boolean(normalizedError.isOperational);

  if (res.locals) {
    res.locals.errorRegistro = resumenParaRegistro(err, normalizedError, statusCode, isOperational);
  }

  res.status(statusCode).json({
    success: false,
    status:
      normalizedError.status ||
      (String(statusCode).startsWith("4") ? "fail" : "error"),
    message:
      isDev || isOperational
        ? normalizedError.message
        : "Error interno del servidor",
    stack: isDev ? normalizedError.stack : undefined,
  });
};

module.exports = errorHandler;
