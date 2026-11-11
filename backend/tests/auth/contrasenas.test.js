const bcrypt = require('bcrypt');
const crypto = require('crypto');
const request = require('supertest');

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({ verifyIdToken: jest.fn() })),
}));
jest.mock('../../src/middlewares/rateLimiters', () => {
  const paso = (_req, _res, next) => next();
  return { limitadorLogin: paso, limitadorRegistro: paso, limitadorCambioContrasena: paso };
});

const db = require('../../src/config/db');
const JWTFactory = require('../../src/utils/JWTFactory');
const { createApp } = require('../../src/config/app');
const f = require('../support/fixtures');

const app = createApp();
const OLVIDE = '/api/v1/auth/olvide-contrasena';
const RESTABLECER = '/api/v1/auth/restablecer-contrasena';
const CAMBIAR = '/api/v1/auth/cambiarContrasena';
const TOKEN_VALIDO = 'a'.repeat(64);

let correos;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const conContrasena = (cambios = {}) =>
  db.agregarUsuario({
    correo: f.CORREO_PACIENTE,
    nombre_usuario: f.NOMBRE,
    contrasena: bcrypt.hashSync(f.CLAVE, 4),
    ...cambios,
  });

const restablecer = (cambios = {}) =>
  request(app)
    .post(RESTABLECER)
    .send({
      token: TOKEN_VALIDO,
      nueva_contrasena: f.CLAVE_NUEVA,
      confirmar_contrasena: f.CLAVE_NUEVA,
      ...cambios,
    });

const sqlDeRestablecer = () => db.sqlRecibido.find((s) => s.includes('FROM restablecimiento_contrasenas AS r'));

beforeEach(() => {
  db.reiniciar();
  correos = [];
  process.env.RESEND_API_KEY = 'clave-ficticia';
  // El correo se genera de verdad; este doble lo captura sin salir a la red.
  global.fetch = async (_destino, opciones) => {
    correos.push(JSON.parse(opciones.body));
    return { ok: true, json: async () => ({ id: 'correo-de-prueba' }) };
  };
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.RESEND_API_KEY;
  jest.restoreAllMocks();
});

describe('003 · recuperar contraseña', () => {
  test('003 CA1 · la respuesta es la misma exista o no la cuenta', async () => {
    conContrasena();
    const existe = await request(app).post(OLVIDE).send({ correo: f.CORREO_PACIENTE });
    const noExiste = await request(app).post(OLVIDE).send({ correo: f.CORREO_NUEVO });

    expect(existe.status).toBe(200);
    expect(noExiste.status).toBe(200);
    expect(noExiste.body).toEqual(existe.body);
    expect(correos).toHaveLength(1);
  });

  test('003 CA2 · envía un enlace con token de 32 bytes y guarda solo su hash', async () => {
    const usuario = conContrasena();
    await request(app).post(OLVIDE).send({ correo: f.CORREO_PACIENTE });

    const [correo] = correos;
    expect(correo.to).toEqual([f.CORREO_PACIENTE]);
    const [, token] = correo.text.match(/\/restablecer-contrasena\?token=([a-f0-9]{64})/);
    expect(correo.html).toContain(token);
    expect(db.estado.tokens).toEqual([
      { id_usuario: usuario.id_usuario, token_hash: hashToken(token), expirado: false },
    ]);
    expect(JSON.stringify(db.estado.tokens)).not.toContain(token);
  });

  test('003 CA3 · una cuenta solo de Google recibe enlace a iniciar sesión y no a restablecer', async () => {
    db.agregarUsuario({ correo: f.CORREO_GOOGLE, nombre_usuario: f.NOMBRE, google_id: f.GOOGLE_SUB });
    await request(app).post(OLVIDE).send({ correo: f.CORREO_GOOGLE });

    const [correo] = correos;
    const contenido = `${correo.text}${correo.html}`;
    expect(contenido).toMatch(/\/login/);
    expect(contenido).not.toMatch(/restablecer-contrasena/);
    expect(db.estado.tokens).toHaveLength(0);
  });

  test('003 CA4 · si falla el envío el token se elimina', async () => {
    conContrasena();
    global.fetch = async () => ({ ok: false, status: 500, text: async () => 'error de prueba' });
    const r = await request(app).post(OLVIDE).send({ correo: f.CORREO_PACIENTE });

    expect(r.status).toBe(200);
    expect(db.estado.tokens).toHaveLength(0);
  });

  test('003 CA5 · la solicitud guarda el token con caducidad de 15 minutos', async () => {
    conContrasena();
    await request(app).post(OLVIDE).send({ correo: f.CORREO_PACIENTE });
    const insercion = db.sqlRecibido.find((s) => s.startsWith('INSERT INTO restablecimiento_contrasenas'));
    expect(insercion).toContain('DATE_ADD(NOW(), INTERVAL 15 MINUTE)');
  });

  test('003 CA5 · con un token vigente cambia la contraseña y notifica por correo', async () => {
    const usuario = conContrasena();
    db.agregarToken({ id_usuario: usuario.id_usuario, token_hash: hashToken(TOKEN_VALIDO) });
    const r = await restablecer();

    expect(r.status).toBe(200);
    expect(await bcrypt.compare(f.CLAVE_NUEVA, usuario.contrasena)).toBe(true);
    expect(db.estado.tokens).toHaveLength(0);
    expect(db.transacciones).toEqual(['begin', 'commit', 'release']);
    expect(correos.map((c) => c.to[0])).toEqual([f.CORREO_PACIENTE]);
    expect(sqlDeRestablecer()).toContain('r.fecha_expiracion > NOW()');
  });

  test('003 CA6 · (abuso) un token con formato inválido responde 400', async () => {
    const r = await restablecer({ token: 'no-es-un-token' });
    expect(r.status).toBe(400);
    expect(db.sqlRecibido).toHaveLength(0);
  });

  test('003 CA6 · (abuso) un token inexistente con formato válido responde 400', async () => {
    const usuario = conContrasena();
    const anterior = usuario.contrasena;
    const r = await restablecer();

    expect(r.status).toBe(400);
    expect(usuario.contrasena).toBe(anterior);
    expect(db.transacciones).toEqual(['begin', 'rollback', 'release']);
  });

  test('003 CA6 · (abuso) un token expirado responde 400 y no cambia la contraseña', async () => {
    const usuario = conContrasena();
    const anterior = usuario.contrasena;
    db.agregarToken({ id_usuario: usuario.id_usuario, token_hash: hashToken(TOKEN_VALIDO), expirado: true });
    const r = await restablecer();

    expect(r.status).toBe(400);
    expect(usuario.contrasena).toBe(anterior);
  });

  test('003 CA6 · la consulta exige token vigente, cuenta activa y con contraseña', async () => {
    await restablecer();
    const sql = sqlDeRestablecer();
    expect(sql).toContain('r.token_hash = ?');
    expect(sql).toContain('r.fecha_expiracion > NOW()');
    expect(sql).toContain("u.estado = 'activo'");
    expect(sql).toContain('u.contrasena IS NOT NULL');
  });

  test('003 CA7 · una contraseña nueva igual a la actual responde 400', async () => {
    const usuario = conContrasena();
    db.agregarToken({ id_usuario: usuario.id_usuario, token_hash: hashToken(TOKEN_VALIDO) });
    const r = await restablecer({ nueva_contrasena: f.CLAVE, confirmar_contrasena: f.CLAVE });
    expect(r.status).toBe(400);
    expect(db.transacciones).toEqual(['begin', 'rollback', 'release']);
  });

  test.todo('003 CA9 · tras 5 intentos fallidos se bloquea al cliente real (hoy no se cumple)');
});

describe('003 · cambiar contraseña', () => {
  const sesion = (usuario) =>
    `Bearer ${new JWTFactory().createToken({ id: usuario.id_usuario, rol: 'Paciente' })}`;

  const cambiar = (usuario, cambios = {}) =>
    request(app)
      .put(CAMBIAR)
      .set('Authorization', sesion(usuario))
      .send({
        contrasena_actual: f.CLAVE,
        nueva_contrasena: f.CLAVE_NUEVA,
        confirmar_contrasena: f.CLAVE_NUEVA,
        ...cambios,
      });

  test('003 CA8 · con la contraseña actual correcta se actualiza', async () => {
    const usuario = conContrasena();
    const r = await cambiar(usuario);

    expect(r.status).toBe(200);
    expect(await bcrypt.compare(f.CLAVE_NUEVA, usuario.contrasena)).toBe(true);
  });

  test('003 CA8 · con la contraseña actual incorrecta no se actualiza', async () => {
    const usuario = conContrasena();
    const anterior = usuario.contrasena;
    const r = await cambiar(usuario, { contrasena_actual: 'clave-incorrecta' });

    expect(r.status).toBe(400);
    expect(usuario.contrasena).toBe(anterior);
  });

  test('003 CA8 · sin sesión responde 401', async () => {
    const r = await request(app).put(CAMBIAR).send({});
    expect(r.status).toBe(401);
  });

  test.each([
    ['un número', 12345678],
    ['un objeto', { valor: 'x' }],
    ['una lista', ['x']],
  ])('003 CA8 · una contraseña actual que es %s responde 400 y no se actualiza', async (_caso, valor) => {
    const usuario = conContrasena();
    const anterior = usuario.contrasena;
    const r = await cambiar(usuario, { contrasena_actual: valor });

    expect(r.status).toBe(400);
    expect(usuario.contrasena).toBe(anterior);
  });

  test('003 CA7 · al cambiarla, una contraseña igual a la actual responde 400', async () => {
    const usuario = conContrasena();
    const r = await cambiar(usuario, { nueva_contrasena: f.CLAVE, confirmar_contrasena: f.CLAVE });
    expect(r.status).toBe(400);
  });

  test.todo('003 CA10 · cambiar la contraseña invalida las sesiones abiertas (hoy no se cumple)');
});
