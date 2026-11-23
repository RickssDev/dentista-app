// Spec 026, T001: fija las respuestas actuales de errorHandler antes de reescribirlo (T022).
// Debe pasar antes y después del cambio sin tocarse.
// Se llama al middleware directamente, sin createApp(), para no generar líneas de log.
const AppError = require('../../src/utils/AppError');

const errorHandler = require('../../src/middlewares/errorHandler');

const NODE_ENV_ORIGINAL = process.env.NODE_ENV;

const responder = (err) => {
  const res = {
    statusCode: 200,
    body: undefined,
    locals: {},
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(cuerpo) {
      this.body = cuerpo;
      return this;
    },
  };
  errorHandler(err, {}, res, () => {});
  return res;
};

const conNombre = (nombre, mensaje = 'detalle interno') => {
  const err = new Error(mensaje);
  err.name = nombre;
  return err;
};

beforeEach(() => {
  process.env.NODE_ENV = 'production';
});

afterEach(() => {
  process.env.NODE_ENV = NODE_ENV_ORIGINAL;
  jest.restoreAllMocks();
});

const casos = [
  ['JWT expirado', () => conNombre('TokenExpiredError'), 401, 'fail', 'El token ha expirado. Inicia sesion nuevamente.'],
  ['JWT inválido', () => conNombre('JsonWebTokenError'), 401, 'fail', 'Token invalido.'],
  ['sin token', () => conNombre('MissingAuthorizationError', 'Token requerido'), 401, 'fail', 'Token requerido'],
  ['cuenta desactivada', () => conNombre('AccountDisabledError'), 401, 'fail', 'Tu cuenta está desactivada o ya no existe.'],
  ['falta de identidad', () => conNombre('MissingUserIdentityError'), 401, 'fail', 'Token invalido: falta la identidad o el rol del usuario.'],
  [
    'imagen de más de 6 MB',
    () => Object.assign(new Error('File too large'), { code: 'LIMIT_FILE_SIZE' }),
    400,
    'fail',
    'La imagen supera el tamaño máximo permitido de 6 MB.',
  ],
  ['AppError 404', () => new AppError('Cita no encontrada', 404), 404, 'fail', 'Cita no encontrada'],
  ['error no operacional', () => new Error('fallo interno con detalle'), 500, 'error', 'Error interno del servidor'],
];

describe.each(casos)('026 · errorHandler responde igual: %s', (_nombre, crear, estado, status, mensaje) => {
  test('estado y cuerpo tal como llega al cliente (JSON)', () => {
    const res = responder(crear());
    const cuerpo = JSON.parse(JSON.stringify(res.body));

    expect(res.statusCode).toBe(estado);
    expect(cuerpo).toEqual({ success: false, status, message: mensaje });
    expect(cuerpo).not.toHaveProperty('stack');
  });
});

test('026 · tras varios errores seguidos el caso de 6 MB sigue respondiendo 400', () => {
  responder(new Error('primero'));
  responder(conNombre('TokenExpiredError'));
  const res = responder(Object.assign(new Error('File too large'), { code: 'LIMIT_FILE_SIZE' }));

  expect(res.statusCode).toBe(400);
});
