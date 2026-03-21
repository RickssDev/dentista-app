const jwt = require('jsonwebtoken');

class JWTFactory {
	static revokedTokens = new Set();

	constructor(secret = process.env.JWT_SECRET) {
		if (!secret) {
			throw new Error('JWT_SECRET no esta definido en las variables de entorno.');
		}

		this.secret = secret;
	}

	createToken(payload, options = {}) {
		return jwt.sign(payload, this.secret, {expiresIn: '1d', ...options });
	}

	static verifyToken(token, secret = process.env.JWT_SECRET) {
		if (!secret) {
			throw new Error('JWT_SECRET no esta definido en las variables de entorno.');
		}

		if (JWTFactory.revokedTokens.has(token)) {
			const revokedError = new Error('Token invalido o revocado.');
			revokedError.name = 'JsonWebTokenError';
			throw revokedError;
		}

		return jwt.verify(token, secret);
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
