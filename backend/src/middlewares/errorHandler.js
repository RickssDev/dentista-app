/**
 * Convierte errores de JWT a un formato operacional consistente.
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

  return err;
}

/**
 * Middleware global de manejo de errores.
 * - En desarrollo expone stack para depuracion.
 * - En produccion solo expone mensajes operacionales controlados.
 * - Normaliza errores comunes (ej. JWT) para respuestas predecibles.
 *
 * @param {Error & {statusCode?: number, status?: string, isOperational?: boolean}} err
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 * @returns {void}
 */
const errorHandler = (err, _req, res, _next) => {
  const isDev = process.env.NODE_ENV === "development";
  const normalizedError = normalizeJwtError(err);

  const statusCode = normalizedError.statusCode || 500;
  const isOperational = Boolean(normalizedError.isOperational);

  console.error(normalizedError.stack || normalizedError);

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
