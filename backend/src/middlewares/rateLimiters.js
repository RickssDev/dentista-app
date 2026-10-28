const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');

/*
  Límites en memoria, por IP. Se reinician al reiniciar el servidor.
  Solo con NODE_ENV=development los límites se relajan para poder probar;
  en cualquier otro caso (incluido NODE_ENV sin definir) aplican los estrictos.
*/
const enDesarrollo = process.env.NODE_ENV === 'development';

const crearLimitador = ({ minutos, maxProduccion, maxDesarrollo, mensaje, soloFallidos = false }) =>
	rateLimit({
		windowMs: minutos * 60 * 1000,
		limit: enDesarrollo ? maxDesarrollo : maxProduccion,
		standardHeaders: true,
		legacyHeaders: false,
		// Con soloFallidos, las respuestas exitosas no cuentan (solo 4xx y 5xx)
		skipSuccessfulRequests: soloFallidos,
		// Pasa por el errorHandler para responder con el mismo formato de siempre
		handler: (_req, _res, next) => next(new AppError(mensaje, 429))
	});

// Iniciar sesión (correo y Google): 10 intentos fallidos cada 15 minutos
exports.limitadorLogin = crearLimitador({
	minutos: 15,
	maxProduccion: 10,
	maxDesarrollo: 5,
	soloFallidos: true,
	mensaje: 'Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo.'
});

// Crear cuenta (correo y Google): 10 solicitudes por hora
exports.limitadorRegistro = crearLimitador({
	minutos: 60,
	maxProduccion: 10,
	maxDesarrollo: 100,
	mensaje: 'Demasiados registros desde esta conexión. Inténtalo de nuevo más tarde.'
});

// Cambiar contraseña: 5 intentos fallidos cada 15 minutos
exports.limitadorCambioContrasena = crearLimitador({
	minutos: 15,
	maxProduccion: 5,
	maxDesarrollo: 100,
	soloFallidos: true,
	mensaje: 'Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo.'
});