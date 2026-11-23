// Spec 026, T013: ningún log contiene datos personales ni credenciales (CA9, CA11;
// TM3, TM5, TM6, TM7, TM11). Cada flujo comprueba primero que sus líneas existen (A3).
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const request = require('supertest');

const mockVerificarGoogle = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({ verifyIdToken: (...args) => mockVerificarGoogle(...args) })),
}));
jest.mock('../../src/middlewares/rateLimiters', () => {
  const paso = (_req, _res, next) => next();
  return { limitadorLogin: paso, limitadorRegistro: paso, limitadorCambioContrasena: paso };
});
jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('node-cron', () => ({ schedule: jest.fn() }));
jest.mock('../../src/modules/citas/citas.repository');
jest.mock('../../src/modules/servicios/servicios.repository');
jest.mock('../../src/modules/pacientes/pacientes.repository');

const axios = require('axios');
const cron = require('node-cron');
const db = require('../../src/config/db');
const JWTFactory = require('../../src/utils/JWTFactory');
const { createApp } = require('../../src/config/app');
const logger = require('../../src/utils/logger');
const citas = require('../../src/modules/citas/citas.service');
const citasRepo = require('../../src/modules/citas/citas.repository');
const serviciosRepo = require('../../src/modules/servicios/servicios.repository');
const pacientesRepo = require('../../src/modules/pacientes/pacientes.repository');
require('../../src/services/reminder.service');

const app = createApp();
const correrCron = cron.schedule.mock.calls[0][1];

// Datos centinela: si alguno aparece en un log, hay una fuga.
const C = {
  telefono: '5512345678',
  correo: 'centinela@example.test',
  nombre: 'Nombre Centinela',
  direccion: 'Calle Centinela 123',
  clave: 'Clave-Centinela-1',
  bearer: 'Bearer centinela-token-whatsapp',
  credencial: 'cred-centinela-google',
  detalleProveedor: 'detalle-centinela-del-proveedor',
};
const PATRON_CENTINELA = /centinela|5512345678/i;

const CITA = {
  id_cita: 41,
  fecha_agendada: '2030-01-02',
  hora: '10:00:00',
  telefono: C.telefono,
  nombre_usuario: C.nombre,
};

const pausa = () => new Promise((resolve) => setImmediate(resolve));

const capturar = async (fn) => {
  const captura = logger.__capturar();
  try {
    await fn();
    await pausa();
  } finally {
    captura.terminar();
  }
  return { lineas: captura.lineas, texto: captura.crudas.join('') };
};

const conMensaje = (lineas, mensaje) => lineas.filter((l) => l.message === mensaje);

const sinCentinelas = (texto, extra = []) => {
  expect(texto).not.toMatch(PATRON_CENTINELA);
  for (const valor of extra) expect(texto).not.toContain(valor);
};

const encenderWhatsApp = () => {
  process.env.WHATSAPP_ENABLED = 'true';
  process.env.WHATSAPP_TOKEN = 'centinela-token-whatsapp';
  process.env.WHATSAPP_PHONE_NUMBER_ID = 'id-ficticio';
};

// Error de axios con todo lo que no debe salir: token, teléfono y respuesta del proveedor.
const errorMeta = () => {
  const err = new Error('Request failed with status code 400');
  err.isAxiosError = true;
  err.config = {
    headers: { Authorization: C.bearer },
    data: JSON.stringify({ to: C.telefono, template: { components: [{ parameters: [{ text: C.nombre }] }] } }),
  };
  err.response = {
    status: 400,
    data: { error: { message: `Número ${C.telefono} inválido (${C.detalleProveedor})`, code: 131026 } },
  };
  return err;
};

const sesion = (rol, datos = {}) => {
  const usuario = db.agregarUsuario({ correo: 'personal@example.test', nombre_usuario: 'Ana', ...datos });
  return { id: usuario.id_usuario, cabecera: `Bearer ${new JWTFactory().createToken({ id: usuario.id_usuario, rol })}` };
};

let correos;
const fetchExitoso = () => {
  global.fetch = jest.fn(async (_url, opciones) => {
    correos.push(JSON.parse(opciones.body));
    return { ok: true, json: async () => ({ id: 'id-proveedor-prueba' }) };
  });
};
const fetchFallido = () => {
  global.fetch = jest.fn(async () => ({
    ok: false,
    status: 422,
    text: async () => JSON.stringify({ name: 'validation_error', message: `Destinatario ${C.correo} inválido` }),
    json: async () => ({ name: 'validation_error', message: `Destinatario ${C.correo} inválido` }),
  }));
};

const ENTORNO = { NODE_ENV: process.env.NODE_ENV, APP_URL: process.env.APP_URL };

beforeEach(() => {
  db.reiniciar();
  jest.clearAllMocks();
  correos = [];
  encenderWhatsApp();
  process.env.RESEND_API_KEY = 'clave-ficticia';
  process.env.APP_URL = 'https://sistema.example.test';
  axios.post.mockResolvedValue({ data: { messages: [{ id: 'wamid.prueba' }], contacts: [{ wa_id: C.telefono }] } });
  citasRepo.findCitaExistente.mockResolvedValue(null);
  citasRepo.createCita.mockResolvedValue(CITA.id_cita);
  citasRepo.getPacienteWhatsApp.mockResolvedValue(CITA);
  citasRepo.getCitaById.mockResolvedValue({ id_servicio: 1, estado: 'pendiente', fecha_agendada: '2030-01-02', hora: '10:00' });
  citasRepo.getCitasDelDia.mockResolvedValue([]);
  citasRepo.getDatosWhatsAppCita.mockResolvedValue(CITA);
  citasRepo.getCitasParaRecordatorio.mockResolvedValue([CITA]);
  serviciosRepo.getServicioById.mockResolvedValue({ nombre_servicio: 'Limpieza', duracion: '01:00' });
  pacientesRepo.findByUserId.mockResolvedValue({ id_paciente: 3 });
});

afterEach(() => {
  process.env.WHATSAPP_ENABLED = 'false';
  delete process.env.WHATSAPP_TOKEN;
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  delete process.env.RESEND_API_KEY;
  for (const [clave, valor] of Object.entries(ENTORNO)) {
    if (valor === undefined) delete process.env[clave];
    else process.env[clave] = valor;
  }
  delete global.fetch;
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------- WhatsApp (TM3, TM4)
const avisos = [
  ['confirmación (personal, createCita)', 'appointment_confirmation_1',
    () => citas.createCita({ id_paciente: 3, fecha_agendada: '2030-01-02', hora: '10:00', id_servicio: 1 })],
  ['confirmación (paciente, createCitaPaciente)', 'appointment_confirmation_1',
    () => citas.createCitaPaciente(7, { fecha_agendada: '2030-01-02', hora: '10:00', id_servicio: 1 })],
  ['reprogramación', 'reprogramada_cita',
    () => citas.updateCita(CITA.id_cita, { fecha_agendada: '2030-01-02', hora: '11:00', motivo: 'cambio' })],
  ['cancelación', 'cancelada_cita', () => citas.cancelarCita(CITA.id_cita, 'motivo')],
  ['recordatorio', 'cita_recordatorio', () => correrCron()],
];

describe.each(avisos)('026 · CA9 aviso de WhatsApp de %s', (_nombre, plantilla, accion) => {
  test('con éxito: línea con id_cita y plantilla, sin datos del paciente', async () => {
    const { lineas, texto } = await capturar(accion);
    const enviados = conMensaje(lineas, 'Aviso de WhatsApp enviado');

    expect(axios.post).toHaveBeenCalled();
    expect(enviados.length).toBeGreaterThan(0);
    expect(enviados[0].context).toMatchObject({ id_cita: CITA.id_cita, plantilla });
    sinCentinelas(texto);
  });

  test('con error del proveedor: línea con servicio, status y codigo, sin token ni respuesta', async () => {
    axios.post.mockRejectedValue(errorMeta());
    const { lineas, texto } = await capturar(accion);
    const fallidos = conMensaje(lineas, 'Aviso de WhatsApp no enviado');

    expect(fallidos.length).toBeGreaterThan(0);
    expect(fallidos[0].level).toBe('error');
    expect(fallidos[0].context).toMatchObject({
      id_cita: CITA.id_cita,
      plantilla,
      servicio: 'whatsapp',
      status: 400,
      codigo: 131026,
    });
    sinCentinelas(texto, ['wamid', 'graph.facebook']);
  });
});

// ---------------------------------------------------------------- Correo (TM5)
const TOKEN_RESTABLECER = 'b'.repeat(64);
const hash = (t) => crypto.createHash('sha256').update(t).digest('hex');

const correosFlujo = [
  ['recuperación', 'recuperacion', () => {
    db.agregarUsuario({ correo: C.correo, nombre_usuario: C.nombre, contrasena: bcrypt.hashSync(C.clave, 4) });
    return request(app).post('/api/v1/auth/olvide-contrasena').send({ correo: C.correo });
  }],
  ['cuenta de Google', 'cuenta_google', () => {
    db.agregarUsuario({ correo: C.correo, nombre_usuario: C.nombre, google_id: 'sub-centinela' });
    return request(app).post('/api/v1/auth/olvide-contrasena').send({ correo: C.correo });
  }],
  ['contraseña actualizada', 'contrasena_actualizada', () => {
    const u = db.agregarUsuario({ correo: C.correo, nombre_usuario: C.nombre, contrasena: bcrypt.hashSync('anterior-1', 4) });
    db.agregarToken({ id_usuario: u.id_usuario, token_hash: hash(TOKEN_RESTABLECER) });
    return request(app).post('/api/v1/auth/restablecer-contrasena').send({
      token: TOKEN_RESTABLECER,
      nueva_contrasena: C.clave,
      confirmar_contrasena: C.clave,
    });
  }],
];

describe.each(['development', 'production'])('026 · CA9 y CA11 correos con NODE_ENV=%s', (entorno) => {
  describe.each(correosFlujo)('correo de %s', (_nombre, tipo, accion) => {
    test('enviado: tipo e id del proveedor, sin destinatario, nombre, enlace ni token', async () => {
      fetchExitoso();
      const { lineas, texto } = await capturar(async () => {
        process.env.NODE_ENV = entorno;
        await accion();
      });
      const enviados = conMensaje(lineas, 'Correo enviado');

      expect(correos).toHaveLength(1);
      expect(enviados).toHaveLength(1);
      expect(enviados[0].context).toMatchObject({ tipo, id_proveedor: 'id-proveedor-prueba' });
      const enlaces = correos[0].text.match(/token=[0-9a-f]+/g) || [];
      sinCentinelas(texto, [...enlaces, TOKEN_RESTABLECER, 'restablecer-contrasena?', 'Para:']);
    });

    test('no enviado: servicio, status y codigo, sin el cuerpo de la respuesta del proveedor', async () => {
      fetchFallido();
      const { lineas, texto } = await capturar(async () => {
        process.env.NODE_ENV = entorno;
        await accion();
      });
      const fallidos = conMensaje(lineas, 'Correo no enviado');

      expect(global.fetch).toHaveBeenCalled();
      expect(fallidos).toHaveLength(1);
      expect(fallidos[0].level).toBe('error');
      expect(fallidos[0].context).toMatchObject({ tipo, servicio: 'correo', status: 422, codigo: 'validation_error' });
      sinCentinelas(texto, [TOKEN_RESTABLECER, 'Resend respondió', 'Destinatario']);
    });
  });
});

// ---------------------------------------------------------------- Autenticación
describe('026 · CA9 autenticación', () => {
  test.each(['development', 'production'])('verificación de Google fallida (%s) sin la credencial', async (entorno) => {
    mockVerificarGoogle.mockRejectedValue(new Error(`Wrong recipient, payload audience != ${C.credencial}`));
    const { lineas, texto } = await capturar(async () => {
      process.env.NODE_ENV = entorno;
      await request(app).post('/api/v1/auth/google/login').send({ credential: C.credencial });
    });
    const fallidas = conMensaje(lineas, 'Verificación de Google fallida');

    expect(fallidas).toHaveLength(1);
    expect(fallidas[0].context).toMatchObject({ servicio: 'google' });
    sinCentinelas(texto);
  });

  test('login fallido sin correo ni contraseña', async () => {
    db.agregarUsuario({ correo: C.correo, nombre_usuario: C.nombre, contrasena: bcrypt.hashSync('otra-clave-1', 4) });
    const { lineas, texto } = await capturar(() =>
      request(app).post('/api/v1/auth/login').send({ correo: C.correo, contrasena: C.clave }),
    );

    expect(conMensaje(lineas, 'Petición atendida')).toHaveLength(1);
    expect(conMensaje(lineas, 'Petición atendida')[0].context.status).toBe(401);
    sinCentinelas(texto);
  });
});

// ---------------------------------------------------------------- Errores de la petición (TM6, TM7, TM11)
describe('026 · CA9 errores con cuerpo centinela', () => {
  test('4xx de validación: sin el cuerpo de la petición', async () => {
    const { lineas, texto } = await capturar(() =>
      request(app).post('/api/v1/auth/register').send({
        nombre_usuario: C.nombre,
        apellido: C.direccion,
        correo: 'no-es-correo-centinela',
        contrasena: C.clave,
        confirmar_contrasena: 'otra',
      }),
    );
    const [linea] = conMensaje(lineas, 'Petición atendida');

    expect(linea.context.status).toBe(400);
    expect(linea.level).toBe('warn');
    sinCentinelas(texto);
  });

  test('5xx por ER_DUP_ENTRY de MySQL: sin el valor duplicado ni el SQL', async () => {
    const dup = new Error(`Duplicate entry '${C.correo}' for key 'correo'`);
    Object.assign(dup, {
      code: 'ER_DUP_ENTRY',
      errno: 1062,
      sqlState: '23000',
      sqlMessage: dup.message,
      sql: `INSERT INTO citas (motivo) VALUES ('${C.direccion}')`,
    });
    citasRepo.createCita.mockRejectedValue(dup);
    const { cabecera } = sesion('Administrador', { id_rol: 1 });

    const { lineas, texto } = await capturar(() =>
      request(app)
        .post('/api/v1/citas')
        .set('Authorization', cabecera)
        .send({ id_paciente: 3, fecha_agendada: '2030-01-02', hora: '10:00', id_servicio: 1, motivo: C.direccion }),
    );
    const [linea] = conMensaje(lineas, 'Petición atendida');

    expect(linea.context.status).toBe(500);
    expect(linea.context.error).toMatchObject({ code: 'ER_DUP_ENTRY', errno: 1062 });
    sinCentinelas(texto, ['INSERT INTO']);
  });

  test('JSON mal formado: solo nombre y tipo del error, sin el cuerpo ni su fragmento (TM11)', async () => {
    const { lineas, texto } = await capturar(() =>
      request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send(`{"correo":"${C.correo}" "contrasena":"${C.clave}"}`),
    );
    const [linea] = conMensaje(lineas, 'Petición atendida');

    expect(linea.context.status).toBe(400);
    expect(linea.context.error).toEqual({ error_name: 'SyntaxError', type: 'entity.parse.failed' });
    sinCentinelas(texto);
  });
});
