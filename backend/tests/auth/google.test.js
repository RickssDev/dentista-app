const jwt = require('jsonwebtoken');
const request = require('supertest');

const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({ verifyIdToken: (...args) => mockVerifyIdToken(...args) })),
}));
jest.mock('../../src/middlewares/rateLimiters', () => {
  const paso = (_req, _res, next) => next();
  return { limitadorLogin: paso, limitadorRegistro: paso, limitadorCambioContrasena: paso };
});

const db = require('../../src/config/db');
const { createApp } = require('../../src/config/app');
const f = require('../support/fixtures');

const app = createApp();
const REGISTRO = '/api/v1/auth/google/register';
const LOGIN = '/api/v1/auth/google/login';
const CUERPO = { credential: f.CREDENCIAL_GOOGLE };

const googleResponde = (cambios = {}) => {
  mockVerifyIdToken.mockResolvedValue({
    getPayload: () => ({
      sub: f.GOOGLE_SUB,
      email: f.CORREO_GOOGLE,
      email_verified: true,
      given_name: f.NOMBRE,
      family_name: f.APELLIDO,
      ...cambios,
    }),
  });
};

beforeEach(() => {
  db.reiniciar();
  mockVerifyIdToken.mockReset();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('002 CA1 · una credencial que no verifica responde 401', async () => {
  mockVerifyIdToken.mockRejectedValue(new Error('credencial inválida'));
  const r = await request(app).post(LOGIN).send(CUERPO);
  expect(r.status).toBe(401);
});

test('002 CA1 · la credencial se verifica contra GOOGLE_CLIENT_ID', async () => {
  googleResponde();
  db.agregarUsuario({ correo: f.CORREO_GOOGLE, google_id: f.GOOGLE_SUB, nombre_usuario: f.NOMBRE });
  await request(app).post(LOGIN).send(CUERPO);
  expect(mockVerifyIdToken).toHaveBeenCalledWith({
    idToken: f.CREDENCIAL_GOOGLE,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
});

test('002 CA2 · una cuenta con correo no verificado responde 401', async () => {
  googleResponde({ email_verified: false });
  const r = await request(app).post(REGISTRO).send(CUERPO);
  expect(r.status).toBe(401);
  expect(db.estado.usuarios).toHaveLength(0);
});

test('002 CA3 · un correo nuevo crea un Paciente sin contraseña', async () => {
  googleResponde();
  const r = await request(app).post(REGISTRO).send(CUERPO);

  expect(r.status).toBe(201);
  expect(db.estado.usuarios[0]).toMatchObject({
    correo: f.CORREO_GOOGLE,
    google_id: f.GOOGLE_SUB,
    id_rol: 3,
    contrasena: null,
  });
});

test('002 CA4 · un correo ya registrado responde 400', async () => {
  googleResponde();
  db.agregarUsuario({ correo: f.CORREO_GOOGLE, nombre_usuario: f.NOMBRE });
  const r = await request(app).post(REGISTRO).send(CUERPO);
  expect(r.status).toBe(400);
  expect(db.estado.usuarios).toHaveLength(1);
});

test('002 CA5 · una cuenta sin google_id se vincula y devuelve la sesión', async () => {
  googleResponde();
  const usuario = db.agregarUsuario({ correo: f.CORREO_GOOGLE, nombre_usuario: f.NOMBRE });
  const r = await request(app).post(LOGIN).send(CUERPO);

  expect(r.status).toBe(200);
  expect(usuario.google_id).toBe(f.GOOGLE_SUB);
  expect(jwt.verify(r.body.payload.token, process.env.JWT_SECRET)).toMatchObject({ id: usuario.id_usuario });
});

test('002 CA6 · (abuso) una cuenta vinculada a otro google_id responde 401', async () => {
  googleResponde();
  const usuario = db.agregarUsuario({
    correo: f.CORREO_GOOGLE,
    google_id: f.GOOGLE_SUB_OTRO,
    nombre_usuario: f.NOMBRE,
  });
  const r = await request(app).post(LOGIN).send(CUERPO);

  expect(r.status).toBe(401);
  expect(r.body.payload).toBeUndefined();
  expect(usuario.google_id).toBe(f.GOOGLE_SUB_OTRO);
});

test('002 CA7 · una cuenta inactiva responde 403', async () => {
  googleResponde();
  db.agregarUsuario({
    correo: f.CORREO_GOOGLE,
    google_id: f.GOOGLE_SUB,
    nombre_usuario: f.NOMBRE,
    estado: 'inactivo',
  });
  const r = await request(app).post(LOGIN).send(CUERPO);
  expect(r.status).toBe(403);
  expect(r.body.payload).toBeUndefined();
});

test.todo('002 CA8 · el login no revela si un correo existe (hoy no se cumple)');
