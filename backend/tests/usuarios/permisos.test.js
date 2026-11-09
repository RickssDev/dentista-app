const request = require('supertest');

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({ verifyIdToken: jest.fn() })),
}));
jest.mock('../../src/modules/users/user.service', () => ({
  getUsuarios: jest.fn().mockResolvedValue([]),
  getUsuarioById: jest.fn().mockResolvedValue({ id: 1 }),
  createUsuario: jest.fn().mockResolvedValue({ id: 1 }),
  updateUsuario: jest.fn().mockResolvedValue({ id: 1 }),
  deleteUsuario: jest.fn().mockResolvedValue({ desactivado: false, message: 'Usuario eliminado' }),
}));

const db = require('../../src/config/db');
const JWTFactory = require('../../src/utils/JWTFactory');
const servicio = require('../../src/modules/users/user.service');
const { createApp } = require('../../src/config/app');
const f = require('../support/fixtures');

const app = createApp();
const RUTAS = [
  ['get', '/api/v1/usuarios'],
  ['get', '/api/v1/usuarios/1'],
  ['post', '/api/v1/usuarios'],
  ['put', '/api/v1/usuarios/1'],
  ['delete', '/api/v1/usuarios/1'],
];

const sesion = (rol) => {
  const usuario = db.agregarUsuario({ correo: f.CORREO_PERSONAL, nombre_usuario: f.NOMBRE });
  return `Bearer ${new JWTFactory().createToken({ id: usuario.id_usuario, rol })}`;
};

beforeEach(() => {
  db.reiniciar();
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe.each(RUTAS)('%s %s', (metodo, ruta) => {
  test.each(['Asistente', 'Paciente'])('004 CA7 · (abuso) %s recibe 403 y no se ejecuta nada', async (rol) => {
    const r = await request(app)[metodo](ruta).set('Authorization', sesion(rol));

    expect(r.status).toBe(403);
    for (const accion of Object.values(servicio)) {
      expect(accion).not.toHaveBeenCalled();
    }
  });

  test('004 CA1 · Administrador accede', async () => {
    const r = await request(app)[metodo](ruta).set('Authorization', sesion('Administrador'));
    expect(r.status).toBeLessThan(300);
  });

  test('004 CA6 · sin sesión responde 401', async () => {
    const r = await request(app)[metodo](ruta);
    expect(r.status).toBe(401);
  });
});
