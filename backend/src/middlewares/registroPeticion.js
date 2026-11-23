// Una sola línea «Petición atendida» por petición (spec 026, OB4.b; /analyze A1).
// Lleva método, ruta sin parámetros de consulta, estado y duración, y el resumen del error que
// dejó errorHandler. Nunca registra el cuerpo, las cabeceras ni la consulta (TM7).
const logger = require('../utils/logger');
const { contextoActual, ejecutarConContexto } = require('../utils/contexto');

const LONGITUD_MAXIMA_RUTA = 200;

const nivelPara = (ruta, estado) => {
  if (ruta === '/health') return 'debug';
  if (estado >= 500) return 'error';
  if (estado >= 400) return 'warn';
  return 'info';
};

const registroPeticion = (req, res, next) => {
  const inicio = process.hrtime.bigint();
  // Los eventos de `res` pueden dispararse fuera del contexto asíncrono: se guarda al montar.
  const contexto = contextoActual();
  let registrado = false;

  const registrar = () => {
    if (registrado) return;
    registrado = true;

    const ruta = String(req.originalUrl || req.url || '').split('?')[0].slice(0, LONGITUD_MAXIMA_RUTA);
    const status = res.statusCode;
    const datos = {
      method: req.method,
      route: ruta,
      status,
      duration_ms: Number(process.hrtime.bigint() - inicio) / 1e6,
    };
    if (res.locals?.errorRegistro) datos.error = res.locals.errorRegistro;

    const escribir = () => logger[nivelPara(ruta, status)]('Petición atendida', datos);
    if (contexto) ejecutarConContexto(contexto, escribir);
    else escribir();
  };

  res.on('finish', registrar);
  res.on('close', registrar);
  next();
};

module.exports = registroPeticion;
