// Identificador por petición (spec 026, OB3; constitución P14).
// Acepta el X-Request-Id del cliente si es válido; si falta o no lo es, genera uno nuevo.
// Lo devuelve en la respuesta y abre el contexto que leen todos los logs de la petición.
const crypto = require('node:crypto');
const { ejecutarConContexto } = require('../utils/contexto');

// Lista blanca: impide inyectar saltos de línea o JSON en los logs, y limita el tamaño (TM1, TM2).
const FORMATO = /^[A-Za-z0-9_-]{8,64}$/;

const esIdValido = (valor) => typeof valor === 'string' && FORMATO.test(valor);

const requestId = (req, res, next) => {
  const recibido = req.get('X-Request-Id');
  const id = esIdValido(recibido) ? recibido : crypto.randomUUID();

  req.id = id;
  res.setHeader('X-Request-Id', id);

  ejecutarConContexto({ requestId: id, req }, next);
};

module.exports = { requestId, esIdValido };
