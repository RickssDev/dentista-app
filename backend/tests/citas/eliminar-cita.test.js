const request = require('supertest');

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({ verifyIdToken: jest.fn() })),
}));

const db = require('../../src/config/db');
const JWTFactory = require('../../src/utils/JWTFactory');
const { createApp } = require('../../src/config/app');
const f = require('../support/fixtures');

const app = createApp();

const sesion = (rol) => {
  const usuario = db.agregarUsuario({ correo: f.CORREO_PERSONAL, nombre_usuario: f.NOMBRE });
  return `Bearer ${new JWTFactory().createToken({ id: usuario.id_usuario, rol })}`;
};

beforeEach(() => {
  db.reiniciar();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('006 · las citas se cancelan, no se eliminan', () => {
  test.each(['Administrador', 'Asistente'])(
    'DELETE /citas/:id no existe para %s y no borra nada',
    async (rol) => {
      const r = await request(app).delete('/api/v1/citas/1').set('Authorization', sesion(rol));

      expect(r.status).toBe(404);
      // Es el 404 de Express por ruta inexistente, no un "cita no encontrada" del servicio
      expect(r.text).toMatch(/Cannot DELETE/);
      expect(db.sqlRecibido.some((sql) => /DELETE\s+FROM\s+citas/i.test(sql))).toBe(false);
    },
  );
});
