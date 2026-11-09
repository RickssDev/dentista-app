const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({ verifyIdToken: jest.fn() })),
}));
jest.mock('../../src/middlewares/rateLimiters', () => {
  const paso = (_req, _res, next) => next();
  return { limitadorLogin: paso, limitadorRegistro: paso, limitadorCambioContrasena: paso };
});

const db = require('../../src/config/db');
const { createApp } = require('../../src/config/app');
const f = require('../support/fixtures');

const app = createApp();
const REGISTRO = '/api/v1/auth/register';
const LOGIN = '/api/v1/auth/login';

const datosRegistro = (cambios = {}) => ({
  nombre_usuario: f.NOMBRE,
  apellido: f.APELLIDO,
  correo: f.CORREO_NUEVO,
  contrasena: f.CLAVE,
  confirmar_contrasena: f.CLAVE,
  ...cambios,
});

const paciente = (cambios = {}) =>
  db.agregarUsuario({
    correo: f.CORREO_PACIENTE,
    nombre_usuario: f.NOMBRE,
    contrasena: bcrypt.hashSync(f.CLAVE, 4),
    ...cambios,
  });

beforeEach(() => {
  db.reiniciar();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('001 · registro', () => {
  test('001 CA1 · crea un usuario Paciente con la contraseña cifrada', async () => {
    const r = await request(app).post(REGISTRO).send(datosRegistro({ id_rol: 1 }));

    expect(r.status).toBe(201);
    const [usuario] = db.estado.usuarios;
    expect(usuario.correo).toBe(f.CORREO_NUEVO);
    expect(usuario.id_rol).toBe(3);
    expect(usuario.contrasena).not.toBe(f.CLAVE);
    expect(await bcrypt.compare(f.CLAVE, usuario.contrasena)).toBe(true);
  });

  test.each(['nombre_usuario', 'apellido', 'correo', 'contrasena', 'confirmar_contrasena'])(
    '001 CA2 · sin %s responde 400',
    async (campo) => {
      const r = await request(app).post(REGISTRO).send(datosRegistro({ [campo]: '' }));
      expect(r.status).toBe(400);
      expect(db.estado.usuarios).toHaveLength(0);
    },
  );

  test('001 CA2 · con contraseñas distintas responde 400', async () => {
    const r = await request(app).post(REGISTRO).send(datosRegistro({ confirmar_contrasena: 'otra-clave-1' }));
    expect(r.status).toBe(400);
    expect(db.estado.usuarios).toHaveLength(0);
  });

  const servicioEnProduccion = () => {
    const original = { ...process.env };
    process.env.NODE_ENV = 'production';
    process.env.PASSWORD_MIN_LENGTH = '4';
    let servicio;
    jest.isolateModules(() => {
      servicio = require('../../src/modules/auth/auth.service');
    });
    process.env = original;
    return servicio;
  };

  const registrarConClave = (clave) =>
    request(app).post(REGISTRO).send(datosRegistro({ contrasena: clave, confirmar_contrasena: clave }));

  test('001 CA3 · en producción rechaza menos de 8 caracteres aunque se configure menos', async () => {
    await expect(
      servicioEnProduccion().register(datosRegistro({ contrasena: 'corta12', confirmar_contrasena: 'corta12' })),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('001 CA3 · en producción acepta exactamente 8 caracteres', async () => {
    await expect(
      servicioEnProduccion().register(datosRegistro({ contrasena: 'ocho1234', confirmar_contrasena: 'ocho1234' })),
    ).resolves.toMatchObject({ correo: f.CORREO_NUEVO });
  });

  test('001 CA3 · rechaza más de 72 bytes', async () => {
    const r = await registrarConClave('a'.repeat(73));
    expect(r.status).toBe(400);
    expect(db.estado.usuarios).toHaveLength(0);
  });

  test('001 CA3 · cuenta bytes y no caracteres: 37 caracteres de 2 bytes se rechazan', async () => {
    const r = await registrarConClave('ñ'.repeat(37));
    expect(r.status).toBe(400);
    expect(db.estado.usuarios).toHaveLength(0);
  });

  test('001 CA3 · acepta exactamente 72 bytes', async () => {
    const r = await registrarConClave('a'.repeat(72));
    expect(r.status).toBe(201);
  });

  test('001 CA4 · con un correo ya registrado responde 400', async () => {
    paciente({ correo: f.CORREO_NUEVO });
    const r = await request(app).post(REGISTRO).send(datosRegistro());
    expect(r.status).toBe(400);
    expect(db.estado.usuarios).toHaveLength(1);
  });

  test.todo('001 CA10 · las respuestas no revelan si un correo existe (hoy no se cumple)');
});

describe('001 · inicio de sesión', () => {
  test('001 CA5 · con credenciales válidas devuelve sesión', async () => {
    const usuario = paciente();
    const r = await request(app).post(LOGIN).send({ correo: f.CORREO_PACIENTE, contrasena: f.CLAVE });

    expect(r.status).toBe(200);
    const { token, user, tienePerfilPaciente } = r.body.payload;
    expect(jwt.verify(token, process.env.JWT_SECRET)).toMatchObject({ id: usuario.id_usuario, rol: 'Paciente' });
    expect(user).toMatchObject({ id: usuario.id_usuario, correo: f.CORREO_PACIENTE, rol: 'Paciente' });
    expect(tienePerfilPaciente).toBe(false);
  });

  test('001 CA5 · informa cuando el paciente ya tiene perfil', async () => {
    const usuario = paciente();
    db.estado.pacientes.push({ id_paciente: 1, id_usuario: usuario.id_usuario });
    const r = await request(app).post(LOGIN).send({ correo: f.CORREO_PACIENTE, contrasena: f.CLAVE });
    expect(r.body.payload.tienePerfilPaciente).toBe(true);
  });

  test('001 CA6 · con contraseña o correo incorrectos responde 401 con el mismo mensaje', async () => {
    paciente();
    const contrasenaMala = await request(app)
      .post(LOGIN)
      .send({ correo: f.CORREO_PACIENTE, contrasena: 'clave-incorrecta' });
    const correoMalo = await request(app).post(LOGIN).send({ correo: f.CORREO_NUEVO, contrasena: f.CLAVE });

    expect(contrasenaMala.status).toBe(401);
    expect(correoMalo.status).toBe(401);
    expect(contrasenaMala.body.message).toBe(correoMalo.body.message);
    expect(contrasenaMala.body.payload).toBeUndefined();
  });

  test('001 CA6 · una cuenta solo de Google responde 400 e indica que use Google', async () => {
    db.agregarUsuario({ correo: f.CORREO_GOOGLE, nombre_usuario: f.NOMBRE, google_id: f.GOOGLE_SUB });
    const r = await request(app).post(LOGIN).send({ correo: f.CORREO_GOOGLE, contrasena: f.CLAVE });

    expect(r.status).toBe(400);
    expect(r.body.message).toMatch(/Google/);
    expect(r.body.payload).toBeUndefined();
  });

  test.each([
    ['sin contraseña', { correo: f.CORREO_PACIENTE }],
    ['sin correo', { contrasena: f.CLAVE }],
    ['con una contraseña que no es texto', { correo: f.CORREO_PACIENTE, contrasena: 123 }],
  ])('001 CA6 · un login %s responde 401 con el mensaje genérico', async (_caso, cuerpo) => {
    paciente();
    const r = await request(app).post(LOGIN).send(cuerpo);
    expect(r.status).toBe(401);
    expect(r.body.message).toBe('Credenciales inválidas');
  });

  test('001 CA7 · con una cuenta inactiva responde 403', async () => {
    paciente({ estado: 'inactivo' });
    const r = await request(app).post(LOGIN).send({ correo: f.CORREO_PACIENTE, contrasena: f.CLAVE });
    expect(r.status).toBe(403);
    expect(r.body.payload).toBeUndefined();
  });

  test.todo('001 CA9 · tras 10 intentos fallidos se bloquea al cliente real (hoy no se cumple)');
});

test('la base simulada rechaza cualquier SQL que no conoce', async () => {
  await expect(db.pool.query('SELECT 1 FROM tabla_desconocida')).rejects.toThrow('SQL no simulado');
});
