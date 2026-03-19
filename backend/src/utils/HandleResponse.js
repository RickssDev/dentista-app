/**
 * Utilidad para estandarizar respuestas exitosas de la API.
 */
class HandleResponse {
	/**
	 * Envia una respuesta HTTP exitosa con formato estandar.
	 *
	 * @param {import('express').Response} res - Objeto response de Express.
	 * @param {number} statusCode - Codigo HTTP de salida (ej. 200, 201).
	 * @param {string} message - Mensaje descriptivo para el cliente.
	 * @returns {import('express').Response} Respuesta JSON enviada.
	 *
	 * @example
	 * // En un controlador:
	 * // return HandleResponse.success(res, 200, 'Usuario actualizado correctamente');
	 */
	static success(res, statusCode, message) {
		return res.status(statusCode).json({
			success: true,
			message
		});
	}

	/**
	 * Envia una respuesta HTTP exitosa con payload adicional.
	 *
	 * @template T
	 * @param {import('express').Response} res - Objeto response de Express.
	 * @param {number} statusCode - Codigo HTTP de salida (ej. 200, 201).
	 * @param {string} message - Mensaje descriptivo para el cliente.
	 * @param {T} payload - Informacion adicional de la respuesta.
	 * @returns {import('express').Response} Respuesta JSON enviada.
	 *
	 * @example
	 * // En un controlador:
	 * // return HandleResponse.successWithPayload(res, 200, 'Usuarios obtenidos', users);
	 */
	static created(res, status = 201, message, payload) {
		return res.status(status).json({
			success: true,
			message,
			payload
		});
	}
}

module.exports = HandleResponse;
