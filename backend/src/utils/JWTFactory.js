const jwt = require('jsonwebtoken');

const ALGORITMO = 'HS256';
const LONGITUD_MINIMA_SECRETO = 32;

const validarSecreto = (secret) => {
	if (!secret) {
		throw new Error('JWT_SECRET no esta definido en las variables de entorno.');
	}

	if (process.env.NODE_ENV === 'production' && secret.length < LONGITUD_MINIMA_SECRETO) {
		throw new Error(
			`JWT_SECRET es demasiado corto: usa al menos ${LONGITUD_MINIMA_SECRETO} caracteres.`
		);
	}

	return secret;
};

class JWTFactory {
	static revokedTokens = new Set();

	constructor(secret = process.env.JWT_SECRET) {
		this.secret = validarSecreto(secret);
	}

	createToken(payload, options = {}) {
		return jwt.sign(payload, this.secret, {
			algorithm: ALGORITMO,
			// Siempre con unidad: 8h, 1d (un número solo se toma como milisegundos)
			expiresIn: process.env.JWT_EXPIRES_IN || '1d',
			...options
		});
	}

	static verifyToken(token, secret = process.env.JWT_SECRET) {
		validarSecreto(secret);

		if (JWTFactory.revokedTokens.has(token)) {
			const revokedError = new Error('Token invalido o revocado.');
			revokedError.name = 'JsonWebTokenError';
			throw revokedError;
		}

		return jwt.verify(token, secret, { algorithms: [ALGORITMO] });
	}

	static decodeToken(token) {
		return jwt.decode(token);
	}

	/**
	 * Invalida un token para que no vuelva a ser aceptado por verifyToken.
	 * Esta invalidacion es en memoria (solo aplica a esta instancia del servidor).
	 * @param {string} token
	 * @returns {boolean}
	 */
	static destroyToken(token) {
		if (!token) {
			return false;
		}

		JWTFactory.revokedTokens.add(token);
		return true;
	}

	/**
	 * Limpia la cookie de sesion usada por el frontend.
	 * @param {import('express').Response} res
	 * @param {string} [cookieName='session-token']
	 * @param {import('express').CookieOptions} [options={}]
	 * @returns {void}
	 */
	static clearSessionCookie(res, cookieName = 'session-token', options = {}) {
		const baseOptions = {
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			path: '/'
		};

		res.clearCookie(cookieName, { ...baseOptions, ...options });
	}
}

module.exports = JWTFactory;