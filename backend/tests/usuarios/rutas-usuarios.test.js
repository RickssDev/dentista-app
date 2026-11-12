// Spec 021 · /usuarios por HTTP: códigos de error, imagen solo del archivo y logs sin datos personales.
const request = require('supertest');

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({ verifyIdToken: jest.fn() })),
}));
jest.mock('../../src/modules/users/user.repository', () => ({
  getUsuarios: jest.fn(),
  getUsuarioById: jest.fn(),
  getRolById: jest.fn(),
  findOtroUsuarioPorCorreo: jest.fn(),
  createUsuario: jest.fn(),
  updateUsuario: jest.fn(),
  deleteUsuario: jest.fn(),
  desactivarUsuario: jest.fn(),
  conTransaccion: jest.fn(),
  bloquearAdministradoresActivos: jest.fn(),
}));
jest.mock('../../src/utils/borrarArchivo', () => jest.fn());
// Simula multer sin escribir en disco: con la cabecera de prueba llega un archivo subido
jest.mock('../../src/utils/upload', () => ({
  single: () => (req, _res, next) => {
    if (req.headers['x-prueba-archivo']) req.file = { filename: 'subida.jpg' };
    next();
  },
}));

const db = require('../../src/config/db');
const JWTFactory = require('../../src/utils/JWTFactory');
const repo = require('../../src/modules/users/user.repository');
const { createApp } = require('../../src/config/app');
const f = require('../support/fixtures');

const app = createApp();
const CORREO = 'ana@example.test';
const CLAVE = 'clave-segura-1';
const ROLES = { 1: 'Administrador', 2: 'Asistente', 3: 'Paciente' };

const sesionAdmin = () => {
  const usuario = db.agregarUsuario({ correo: f.CORREO_PERSONAL, nombre_usuario: f.NOMBRE, id_rol: 1 });
  return `Bearer ${new JWTFactory().createToken({ id: usuario.id_usuario, rol: 'Administrador' })}`;
};

const alta = (cambios = {}) => ({
  nombre: 'Ana', apellido: 'Pérez', correo: CORREO, password: CLAVE, id_rol: '2', ...cambios,
});

let consola;

beforeEach(() => {
  db.reiniciar();
  jest.resetAllMocks();
  repo.getRolById.mockImplementation(async (id) =>
    ROLES[id] ? { id_rol: Number(id), rol: ROLES[id] } : undefined);
  repo.findOtroUsuarioPorCorreo.mockResolvedValue(undefined);
  repo.createUsuario.mockResolvedValue(7);
  repo.updateUsuario.mockResolvedValue();
  repo.getUsuarioById.mockResolvedValue({
    id_usuario: 5, nombre_usuario: 'Ana', apellido: 'Pérez', correo: CORREO,
    telefono: null, imagen: null, estado: 'activo', rol_id: 2, rol_nombre: 'Asistente',
  });
  repo.conTransaccion.mockImplementation(async (fn) => fn({}));
  repo.bloquearAdministradoresActivos.mockResolvedValue([{ id_usuario: 1 }, { id_usuario: 2 }]);
  consola = ['log', 'info', 'warn', 'error'].map((m) => jest.spyOn(console, m).mockImplementation(() => {}));
});

afterEach(() => jest.restoreAllMocks());

const textoDeLogs = () => consola.flatMap((espia) => espia.mock.calls).map((args) =>
  args.map((a) => (a instanceof Error ? `${a.message} ${a.stack}` : JSON.stringify(a))).join(' ')).join('\n');

describe('códigos de error', () => {
  test('POST con un nombre que no es texto → 400 con mensaje', async () => {
    const r = await request(app).post('/api/v1/usuarios').set('Authorization', sesionAdmin())
      .send(alta({ nombre: { a: 1 } }));
    expect(r.status).toBe(400);
    expect(r.body.message).toEqual(expect.any(String));
    expect(repo.createUsuario).not.toHaveBeenCalled();
  });

  test('PUT con un estado inválido → 400 con mensaje', async () => {
    const r = await request(app).put('/api/v1/usuarios/5').set('Authorization', sesionAdmin())
      .send({ estado: 'borrado' });
    expect(r.status).toBe(400);
    expect(r.body.message).toBe('El estado no es válido');
  });
});

describe('CA1 · la imagen solo llega del archivo subido', () => {
  test('una imagen en el cuerpo, sin archivo, no llega al repositorio', async () => {
    const r = await request(app).post('/api/v1/usuarios').set('Authorization', sesionAdmin())
      .send(alta({ imagen: '/uploads/de-otra-cuenta.jpg' }));
    expect(r.status).toBe(201);
    expect(repo.createUsuario.mock.calls[0][0].imagen ?? null).toBeNull();
  });

  test('con archivo subido llega /uploads/<archivo>', async () => {
    const r = await request(app).post('/api/v1/usuarios').set('Authorization', sesionAdmin())
      .set('x-prueba-archivo', '1').send(alta({ imagen: '/uploads/de-otra-cuenta.jpg' }));
    expect(r.status).toBe(201);
    expect(repo.createUsuario.mock.calls[0][0].imagen).toBe('/uploads/subida.jpg');
  });
});

describe('P15 · los rechazos no dejan el correo ni la contraseña en los logs', () => {
  test('correo de otra cuenta (400)', async () => {
    repo.findOtroUsuarioPorCorreo.mockResolvedValue({ id_usuario: 9 });
    const r = await request(app).post('/api/v1/usuarios').set('Authorization', sesionAdmin()).send(alta());
    expect(r.status).toBe(400);
    expect(textoDeLogs()).not.toContain(CORREO);
    expect(textoDeLogs()).not.toContain(CLAVE);
  });

  test('índice único 1062 en carrera (400)', async () => {
    repo.createUsuario.mockRejectedValue(Object.assign(
      new Error(`Duplicate entry '${CORREO}' for key 'correo'`), { errno: 1062, code: 'ER_DUP_ENTRY' },
    ));
    const r = await request(app).post('/api/v1/usuarios').set('Authorization', sesionAdmin()).send(alta());
    expect(r.status).toBe(400);
    expect(r.body.message).not.toContain(CORREO);
    expect(textoDeLogs()).not.toContain(CORREO);
    expect(textoDeLogs()).not.toContain(CLAVE);
  });

  test('último Administrador (409)', async () => {
    repo.getUsuarioById.mockResolvedValue({
      id_usuario: 5, nombre_usuario: 'Ana', apellido: 'Pérez', correo: CORREO,
      telefono: null, imagen: null, estado: 'activo', rol_id: 1, rol_nombre: 'Administrador',
    });
    repo.bloquearAdministradoresActivos.mockResolvedValue([{ id_usuario: 5 }]);
    const r = await request(app).put('/api/v1/usuarios/5').set('Authorization', sesionAdmin())
      .send({ estado: 'inactivo', password: CLAVE });
    expect(r.status).toBe(409);
    expect(textoDeLogs()).not.toContain(CORREO);
    expect(textoDeLogs()).not.toContain(CLAVE);
  });
});

describe('R1 · el id de la ruta debe ser un entero positivo', () => {
  test.each([
    ['put', '/api/v1/usuarios/5abc'],
    ['delete', '/api/v1/usuarios/5abc'],
    ['put', '/api/v1/usuarios/0'],
    ['delete', '/api/v1/usuarios/0'],
  ])('%s %s → 400 sin leer ni escribir la cuenta', async (metodo, ruta) => {
    const r = await request(app)[metodo](ruta).set('Authorization', sesionAdmin()).send({ estado: 'inactivo' });
    expect(r.status).toBe(400);
    expect(r.body.message).toBe('ID de usuario inválido');
    expect(repo.getUsuarioById).not.toHaveBeenCalled();
    expect(repo.updateUsuario).not.toHaveBeenCalled();
    expect(repo.deleteUsuario).not.toHaveBeenCalled();
    expect(repo.desactivarUsuario).not.toHaveBeenCalled();
  });
});

describe('R4 · la imagen subida no queda huérfana si se rechaza la petición', () => {
  const borrarArchivo = require('../../src/utils/borrarArchivo');

  test('alta rechazada (400) con archivo subido → se borra la imagen', async () => {
    const r = await request(app).post('/api/v1/usuarios').set('Authorization', sesionAdmin())
      .set('x-prueba-archivo', '1').send(alta({ nombre: { a: 1 } }));
    expect(r.status).toBe(400);
    expect(borrarArchivo).toHaveBeenCalledWith('/uploads/subida.jpg');
  });

  test('alta válida con archivo subido → la imagen no se borra', async () => {
    const r = await request(app).post('/api/v1/usuarios').set('Authorization', sesionAdmin())
      .set('x-prueba-archivo', '1').send(alta());
    expect(r.status).toBe(201);
    expect(borrarArchivo).not.toHaveBeenCalled();
  });
});
