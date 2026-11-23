// Spec 026, T016: resumen del error que errorHandler deja para la línea de la petición (A22; TM6, TM11).
const AppError = require('../../src/utils/AppError');
const errorHandler = require('../../src/middlewares/errorHandler');

const CORREO = 'centinela@example.test';

const registro = (err) => {
  const res = {
    locals: {},
    status() {
      return this;
    },
    json() {
      return this;
    },
  };
  errorHandler(err, {}, res, () => {});
  return res.locals.errorRegistro;
};

test('026 · 5xx: nombre, mensaje y pila', () => {
  const r = registro(new TypeError('x no es función'));

  expect(r).toMatchObject({ error_name: 'TypeError', message: 'x no es función' });
  expect(r.stack).toContain('TypeError');
});

test('026 · TM6 ER_DUP_ENTRY: código y número, sin el valor ni el SQL', () => {
  const err = new Error(`Duplicate entry '${CORREO}' for key 'correo'`);
  Object.assign(err, {
    code: 'ER_DUP_ENTRY',
    errno: 1062,
    sqlState: '23000',
    sqlMessage: err.message,
    sql: `INSERT INTO usuarios (correo) VALUES ('${CORREO}')`,
  });
  const r = registro(err);

  expect(r).toMatchObject({ error_name: 'Error', code: 'ER_DUP_ENTRY', errno: 1062 });
  expect(JSON.stringify(r)).not.toMatch(/centinela|INSERT/);
});

test('026 · 4xx operacional: nombre y el mensaje que ya recibe el cliente, sin pila', () => {
  const r = registro(new AppError('Cita no encontrada', 404));

  expect(r).toEqual({ error_name: 'Error', message: 'Cita no encontrada' });
});

test('026 · 4xx normalizado (JWT expirado): nombre y mensaje normalizado, sin pila', () => {
  const err = new Error(`jwt expired ${CORREO}`);
  err.name = 'TokenExpiredError';
  const r = registro(err);

  expect(r).toEqual({ error_name: 'TokenExpiredError', message: 'El token ha expirado. Inicia sesion nuevamente.' });
});

test('026 · TM11 4xx no operacional (JSON mal formado): solo nombre y tipo, sin body ni mensaje', () => {
  const err = new SyntaxError(`Unexpected token 'x', "{"correo":"${CORREO}" x}" is not valid JSON`);
  Object.assign(err, {
    status: 400,
    statusCode: 400,
    expose: true,
    type: 'entity.parse.failed',
    body: `{"correo":"${CORREO}" x}`,
  });
  const r = registro(err);

  expect(r).toEqual({ error_name: 'SyntaxError', type: 'entity.parse.failed' });
});
