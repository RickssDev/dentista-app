// Ficha 2026-11-23-fix-foto-huerfana-promociones: si el alta o la edición de una promoción fallan,
// la foto subida en esa petición no queda en disco sin uso; nunca se borra la que ya referencia la base.
const request = require('supertest');

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({ verifyIdToken: jest.fn() })),
}));
jest.mock('../../src/modules/promocion/promo.repository', () => ({
  createPromocion: jest.fn(),
  getPromocion: jest.fn(),
  getPromocionById: jest.fn(),
  updatePromocion: jest.fn(),
  deletePromocion: jest.fn(),
  getPromocionPublicos: jest.fn(),
}));
jest.mock('../../src/utils/borrarArchivo', () => jest.fn());
// Simula multer sin escribir en disco: con la cabecera de prueba llega un archivo subido
jest.mock('../../src/utils/upload', () => ({
  single: () => (req, _res, next) => {
    if (req.headers['x-prueba-archivo']) req.file = { filename: 'subida-promo.jpg' };
    next();
  },
}));

const db = require('../../src/config/db');
const JWTFactory = require('../../src/utils/JWTFactory');
const repo = require('../../src/modules/promocion/promo.repository');
const borrarArchivo = require('../../src/utils/borrarArchivo');
const { createApp } = require('../../src/config/app');

const app = createApp();
const SUBIDA = '/uploads/subida-promo.jpg';
const ANTERIOR = '/uploads/promo-4.jpg';
const PROMO = {
  id_servicio: '1', nombre_promocion: 'Dos por uno', descripcion: 'd', fecha_inicio: '2026-12-01', fecha_fin: '2026-12-31',
};

const sesion = () => {
  const usuario = db.agregarUsuario({ correo: 'admin@example.test', nombre_usuario: 'Ana', id_rol: 1 });
  return `Bearer ${new JWTFactory().createToken({ id: usuario.id_usuario, rol: 'Administrador' })}`;
};

beforeEach(() => {
  db.reiniciar();
  jest.resetAllMocks();
  ['log', 'info', 'warn', 'error'].forEach((m) => jest.spyOn(console, m).mockImplementation(() => {}));
  repo.createPromocion.mockResolvedValue(8);
  repo.getPromocionById.mockResolvedValue({ id_promocion: 4, nombre_promocion: 'Antes', imagen: ANTERIOR, estado: 'activo' });
  repo.updatePromocion.mockResolvedValue();
});

afterEach(() => jest.restoreAllMocks());

describe('si el alta o la edición fallan, la foto subida no queda huérfana', () => {
  test('alta con campos faltantes (400): se borra la foto subida', async () => {
    const r = await request(app).post('/api/v1/promociones').set('Authorization', sesion())
      .set('x-prueba-archivo', '1').send({ nombre_promocion: 'Sin fechas' });
    expect(r.status).toBe(400);
    expect(borrarArchivo).toHaveBeenCalledWith(SUBIDA);
  });

  test('error del repositorio en el alta: se borra la foto subida', async () => {
    repo.createPromocion.mockRejectedValue(new Error('fallo de la base'));
    const r = await request(app).post('/api/v1/promociones').set('Authorization', sesion())
      .set('x-prueba-archivo', '1').send(PROMO);
    expect(r.status).toBe(500);
    expect(borrarArchivo).toHaveBeenCalledWith(SUBIDA);
  });

  test('edición de una promoción inexistente (404): se borra la foto subida', async () => {
    repo.getPromocionById.mockResolvedValue(undefined);
    const r = await request(app).put('/api/v1/promociones/99').set('Authorization', sesion())
      .set('x-prueba-archivo', '1').send({ nombre_promocion: 'Después' });
    expect(r.status).toBe(404);
    expect(borrarArchivo).toHaveBeenCalledWith(SUBIDA);
  });

  test('edición con estado inválido (400): se borra la foto subida y no la anterior', async () => {
    const r = await request(app).put('/api/v1/promociones/4').set('Authorization', sesion())
      .set('x-prueba-archivo', '1').send({ estado: 'borrado' });
    expect(r.status).toBe(400);
    expect(borrarArchivo).toHaveBeenCalledWith(SUBIDA);
    expect(borrarArchivo).not.toHaveBeenCalledWith(ANTERIOR);
  });

  test('error del repositorio al editar: se borra la foto subida y no la anterior', async () => {
    repo.updatePromocion.mockRejectedValue(new Error('fallo de la base'));
    const r = await request(app).put('/api/v1/promociones/4').set('Authorization', sesion())
      .set('x-prueba-archivo', '1').send({ nombre_promocion: 'Después' });
    expect(r.status).toBe(500);
    expect(borrarArchivo).toHaveBeenCalledWith(SUBIDA);
    expect(borrarArchivo).not.toHaveBeenCalledWith(ANTERIOR);
  });
});

describe('lo que ya funcionaba sigue igual', () => {
  test('edición con archivo correcta: se guarda la subida y se borra la anterior', async () => {
    const r = await request(app).put('/api/v1/promociones/4').set('Authorization', sesion())
      .set('x-prueba-archivo', '1').send({ imagen: '/uploads/ajena.jpg' });
    expect(r.status).toBe(200);
    expect(repo.updatePromocion.mock.calls[0][1].imagen).toBe(SUBIDA);
    expect(borrarArchivo).toHaveBeenCalledWith(ANTERIOR);
    expect(borrarArchivo).not.toHaveBeenCalledWith(SUBIDA);
  });

  test('sin archivo, un fallo no borra nada', async () => {
    const r = await request(app).post('/api/v1/promociones').set('Authorization', sesion())
      .send({ nombre_promocion: 'Sin fechas', imagen: '/uploads/ajena.jpg' });
    expect(r.status).toBe(400);
    expect(borrarArchivo).not.toHaveBeenCalled();
  });
});
