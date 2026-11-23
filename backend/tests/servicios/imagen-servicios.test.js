// Ficha 2026-11-23-fix-imagen-servicios: la imagen de un servicio solo sale del archivo subido en la
// petición (nunca de una ruta del cuerpo) y, si el alta o la edición fallan, esa foto se borra.
const request = require('supertest');

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({ verifyIdToken: jest.fn() })),
}));
jest.mock('../../src/modules/servicios/servicios.repository', () => ({
  getServicioByName: jest.fn(),
  getServicios: jest.fn(),
  getServicioById: jest.fn(),
  createServicio: jest.fn(),
  updateServicio: jest.fn(),
  deleteServicio: jest.fn(),
  getServiciosPublicos: jest.fn(),
  desactivarServicio: jest.fn(),
}));
jest.mock('../../src/utils/borrarArchivo', () => jest.fn());
// Simula multer sin escribir en disco: con la cabecera de prueba llega un archivo subido
jest.mock('../../src/utils/upload', () => ({
  single: () => (req, _res, next) => {
    if (req.headers['x-prueba-archivo']) req.file = { filename: 'subida-servicio.jpg' };
    next();
  },
}));

const db = require('../../src/config/db');
const JWTFactory = require('../../src/utils/JWTFactory');
const repo = require('../../src/modules/servicios/servicios.repository');
const borrarArchivo = require('../../src/utils/borrarArchivo');
const { createApp } = require('../../src/config/app');

const app = createApp();
const SUBIDA = '/uploads/subida-servicio.jpg';
const AJENA = '/uploads/foto-de-perfil-ajena.jpg';
const ANTERIOR = '/uploads/servicio-3.jpg';
const SERVICIO = { nombre: 'Limpieza', descripcion: 'Limpieza dental', duracion: '30' };

const sesion = () => {
  const usuario = db.agregarUsuario({ correo: 'admin@example.test', nombre_usuario: 'Ana', id_rol: 1 });
  return `Bearer ${new JWTFactory().createToken({ id: usuario.id_usuario, rol: 'Administrador' })}`;
};

beforeEach(() => {
  db.reiniciar();
  jest.resetAllMocks();
  ['log', 'info', 'warn', 'error'].forEach((m) => jest.spyOn(console, m).mockImplementation(() => {}));
  repo.getServicioByName.mockResolvedValue(undefined);
  repo.createServicio.mockResolvedValue(21);
  repo.getServicioById.mockResolvedValue({
    id_servicio: 3, nombre_servicio: 'Antes', descripcion: 'd', duracion: 30, estado: 'activo', imagen: ANTERIOR,
  });
  repo.updateServicio.mockResolvedValue();
});

afterEach(() => jest.restoreAllMocks());

describe('la imagen solo sale del archivo subido', () => {
  test('alta sin archivo con imagen ajena en el cuerpo: no se guarda esa ruta', async () => {
    const r = await request(app).post('/api/v1/servicios').set('Authorization', sesion())
      .send({ ...SERVICIO, imagen: AJENA });
    expect(r.status).toBe(201);
    expect(repo.createServicio.mock.calls[0][0].imagen ?? null).toBeNull();
  });

  test('alta con archivo e imagen ajena en el cuerpo: se guarda la ruta del archivo', async () => {
    const r = await request(app).post('/api/v1/servicios').set('Authorization', sesion())
      .set('x-prueba-archivo', '1').send({ ...SERVICIO, imagen: AJENA });
    expect(r.status).toBe(201);
    expect(repo.createServicio.mock.calls[0][0].imagen).toBe(SUBIDA);
  });

  test('edición sin archivo con imagen ajena: no se guarda esa ruta ni se borra la anterior', async () => {
    const r = await request(app).put('/api/v1/servicios/3').set('Authorization', sesion())
      .send({ nombre: 'Después', imagen: AJENA });
    expect(r.status).toBe(200);
    expect(repo.updateServicio.mock.calls[0][1].imagen).toBeUndefined();
    expect(borrarArchivo).not.toHaveBeenCalled();
  });

  test('edición con archivo: se guarda la subida y se borra la anterior, nunca la ajena', async () => {
    const r = await request(app).put('/api/v1/servicios/3').set('Authorization', sesion())
      .set('x-prueba-archivo', '1').send({ imagen: AJENA });
    expect(r.status).toBe(200);
    expect(repo.updateServicio.mock.calls[0][1].imagen).toBe(SUBIDA);
    expect(borrarArchivo).toHaveBeenCalledWith(ANTERIOR);
    expect(borrarArchivo).not.toHaveBeenCalledWith(AJENA);
  });
});

describe('si el alta o la edición fallan, la foto subida no queda huérfana', () => {
  test('alta con campos faltantes (400): se borra la foto subida', async () => {
    const r = await request(app).post('/api/v1/servicios').set('Authorization', sesion())
      .set('x-prueba-archivo', '1').send({ nombre: 'Sin descripción' });
    expect(r.status).toBe(400);
    expect(borrarArchivo).toHaveBeenCalledWith(SUBIDA);
  });

  test('alta con nombre repetido (400): se borra la foto subida', async () => {
    repo.getServicioByName.mockResolvedValue({ id_servicio: 9 });
    const r = await request(app).post('/api/v1/servicios').set('Authorization', sesion())
      .set('x-prueba-archivo', '1').send(SERVICIO);
    expect(r.status).toBe(400);
    expect(borrarArchivo).toHaveBeenCalledWith(SUBIDA);
  });

  test('edición de un servicio inexistente (404): se borra la foto subida', async () => {
    repo.getServicioById.mockResolvedValue(undefined);
    const r = await request(app).put('/api/v1/servicios/99').set('Authorization', sesion())
      .set('x-prueba-archivo', '1').send({ nombre: 'Después' });
    expect(r.status).toBe(404);
    expect(borrarArchivo).toHaveBeenCalledWith(SUBIDA);
  });

  test('error del repositorio al editar: se borra la foto subida y no la anterior', async () => {
    repo.updateServicio.mockRejectedValue(new Error('fallo de la base'));
    const r = await request(app).put('/api/v1/servicios/3').set('Authorization', sesion())
      .set('x-prueba-archivo', '1').send({ nombre: 'Después' });
    expect(r.status).toBe(500);
    expect(borrarArchivo).toHaveBeenCalledWith(SUBIDA);
    expect(borrarArchivo).not.toHaveBeenCalledWith(ANTERIOR);
  });

  test('sin archivo, un fallo no borra nada aunque el cuerpo traiga una ruta', async () => {
    const r = await request(app).post('/api/v1/servicios').set('Authorization', sesion())
      .send({ nombre: 'Sin descripción', imagen: AJENA });
    expect(r.status).toBe(400);
    expect(borrarArchivo).not.toHaveBeenCalled();
  });
});
