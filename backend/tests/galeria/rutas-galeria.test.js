// Spec 029 · /imagenes por HTTP: permisos (TM5), límite sin pasar por el panel (CA8), cuerpos de
// error exactos (A2), la imagen solo del archivo subido (TM6, A1, A17, A20) y logs con request_id y
// sin el título ni el archivo (P14, P15, A13, A21).
const request = require('supertest');

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({ verifyIdToken: jest.fn() })),
}));
jest.mock('../../src/modules/images/images.repository', () => ({
  getImagen: jest.fn(),
  getImagenById: jest.fn(),
  createImagen: jest.fn(),
  crearImagenConLimite: jest.fn(),
  updateImagen: jest.fn(),
  deleteImagen: jest.fn(),
  getImagenesPublicas: jest.fn(),
}));
jest.mock('../../src/utils/borrarArchivo', () => jest.fn());
// Simula multer sin escribir en disco: con la cabecera de prueba llega un archivo subido
jest.mock('../../src/utils/upload', () => ({
  single: () => (req, _res, next) => {
    if (req.headers['x-prueba-archivo']) req.file = { filename: 'subida-q29.jpg' };
    next();
  },
}));

const db = require('../../src/config/db');
const JWTFactory = require('../../src/utils/JWTFactory');
const repo = require('../../src/modules/images/images.repository');
const borrarArchivo = require('../../src/utils/borrarArchivo');
const { createApp } = require('../../src/config/app');
const logger = require('../../src/utils/logger');
const { MENSAJE_GALERIA_LLENA, MENSAJE_GALERIA_OCUPADA } = require('../../src/modules/images/images.limites');

const app = createApp();
const SUBIDA = '/uploads/subida-q29.jpg';
const AJENA = '/uploads/foto-de-perfil-ajena.jpg';
const TITULO = 'TituloCentinelaQ29';
const ROLES = { 1: 'Administrador', 2: 'Asistente', 3: 'Paciente' };

const sesion = (id_rol) => {
  const usuario = db.agregarUsuario({ correo: `rol${id_rol}@example.test`, nombre_usuario: 'Ana', id_rol });
  return `Bearer ${new JWTFactory().createToken({ id: usuario.id_usuario, rol: ROLES[id_rol] })}`;
};

const llena = () => repo.crearImagenConLimite.mockResolvedValue({ creada: false, total: 15 });
const conSitio = () => repo.crearImagenConLimite.mockResolvedValue({ creada: true, id: 115 });

// La línea «Petición atendida» se escribe al terminar la respuesta: se espera un turno
const tras = () => new Promise((resolve) => setImmediate(resolve));

let captura;

beforeEach(() => {
  db.reiniciar();
  jest.resetAllMocks();
  ['log', 'info', 'warn', 'error'].forEach((m) => jest.spyOn(console, m).mockImplementation(() => {}));
  captura = logger.__capturar();
});

afterEach(() => {
  captura.terminar();
  jest.restoreAllMocks();
});

describe('TM5 · permisos de POST /imagenes', () => {
  test('sin token → 401 y no se intenta guardar', async () => {
    const r = await request(app).post('/api/v1/imagenes').send({ titulo: TITULO, visible: '1' });
    expect(r.status).toBe(401);
    expect(repo.crearImagenConLimite).not.toHaveBeenCalled();
  });

  test('Paciente → 403 y no se intenta guardar', async () => {
    const r = await request(app).post('/api/v1/imagenes').set('Authorization', sesion(3))
      .set('x-prueba-archivo', '1').send({ titulo: TITULO, visible: '1' });
    expect(r.status).toBe(403);
    expect(repo.crearImagenConLimite).not.toHaveBeenCalled();
  });
});

describe('CA1 y CA8 · el límite se aplica en el servidor', () => {
  test('CA1: con 14 → 201 con el id en el payload, como hoy', async () => {
    conSitio();
    const r = await request(app).post('/api/v1/imagenes').set('Authorization', sesion(1))
      .set('x-prueba-archivo', '1').send({ titulo: TITULO, visible: '1' });
    expect(r.status).toBe(201);
    expect(r.body.payload).toBe(115);
  });

  test.each([[1], [2]])('CA8: con 15, rol %i → 409 con el cuerpo exacto y la foto subida borrada', async (id_rol) => {
    llena();
    const r = await request(app).post('/api/v1/imagenes').set('Authorization', sesion(id_rol))
      .set('x-prueba-archivo', '1').send({ titulo: TITULO, visible: '1' });
    expect(r.status).toBe(409);
    expect(r.body).toEqual({ success: false, status: 'fail', message: MENSAJE_GALERIA_LLENA });
    expect(borrarArchivo).toHaveBeenCalledWith(SUBIDA);
  });

  test('sin bloqueo → 503 con el cuerpo exacto', async () => {
    repo.crearImagenConLimite.mockResolvedValue({ bloqueo: false });
    const r = await request(app).post('/api/v1/imagenes').set('Authorization', sesion(1))
      .set('x-prueba-archivo', '1').send({ titulo: TITULO, visible: '1' });
    expect(r.status).toBe(503);
    expect(r.body).toEqual({ success: false, status: 'error', message: MENSAJE_GALERIA_OCUPADA });
  });
});

describe('TM6 · la ruta de la imagen solo sale del archivo subido', () => {
  test('alta sin archivo con imagen ajena en el cuerpo → 400 y esa ruta no se borra ni se guarda', async () => {
    llena();
    const r = await request(app).post('/api/v1/imagenes').set('Authorization', sesion(1))
      .send({ titulo: TITULO, visible: '1', imagen: AJENA });
    expect(r.status).toBe(400);
    expect(repo.crearImagenConLimite).not.toHaveBeenCalled();
    expect(borrarArchivo).not.toHaveBeenCalledWith(AJENA);
  });

  test('alta sin archivo ni título y con imagen ajena → 400 y esa ruta no se borra', async () => {
    const r = await request(app).post('/api/v1/imagenes').set('Authorization', sesion(1))
      .send({ visible: '1', imagen: AJENA });
    expect(r.status).toBe(400);
    expect(borrarArchivo).not.toHaveBeenCalledWith(AJENA);
  });

  test('alta con archivo e imagen ajena en el cuerpo, con 14 → 201 y se guarda la ruta del archivo', async () => {
    conSitio();
    const r = await request(app).post('/api/v1/imagenes').set('Authorization', sesion(1))
      .set('x-prueba-archivo', '1').send({ titulo: TITULO, visible: '1', imagen: AJENA });
    expect(r.status).toBe(201);
    expect(repo.crearImagenConLimite.mock.calls[0][0].imagen).toBe(SUBIDA);
  });

  test('alta con archivo e imagen ajena en el cuerpo, con 15 → 409 y solo se borra la foto subida', async () => {
    llena();
    const r = await request(app).post('/api/v1/imagenes').set('Authorization', sesion(1))
      .set('x-prueba-archivo', '1').send({ titulo: TITULO, visible: '1', imagen: AJENA });
    expect(r.status).toBe(409);
    expect(borrarArchivo).toHaveBeenCalledWith(SUBIDA);
    expect(borrarArchivo).not.toHaveBeenCalledWith(AJENA);
  });

  test('A17: PUT sin archivo con un título nuevo e imagen ajena → 200, se guarda el título y no la ruta', async () => {
    repo.getImagenById.mockResolvedValue({ id_imagen: 3, titulo: 'Antes', imagen: '/uploads/3.jpg', visible: 1 });
    repo.updateImagen.mockResolvedValue();
    const r = await request(app).put('/api/v1/imagenes/3').set('Authorization', sesion(2))
      .send({ titulo: 'Después', imagen: AJENA });
    expect(r.status).toBe(200);
    const [, cambios] = repo.updateImagen.mock.calls[0];
    expect(cambios.titulo).toBe('Después');
    expect(cambios.imagen).toBeUndefined();
    expect(borrarArchivo).not.toHaveBeenCalled();
  });
});

describe('R1, R2 · PUT /imagenes/:id con la galería llena', () => {
  const ANTERIOR = '/uploads/3.jpg';

  beforeEach(() => {
    repo.getImagenById.mockResolvedValue({ id_imagen: 3, titulo: 'Antes', imagen: ANTERIOR, visible: 1 });
    repo.updateImagen.mockResolvedValue();
  });

  test('P8: sin token → 401 y no se actualiza nada', async () => {
    const r = await request(app).put('/api/v1/imagenes/3').send({ titulo: 'Después' });
    expect(r.status).toBe(401);
    expect(repo.updateImagen).not.toHaveBeenCalled();
  });

  test('P8: Paciente → 403 y no se actualiza nada', async () => {
    const r = await request(app).put('/api/v1/imagenes/3').set('Authorization', sesion(3))
      .send({ titulo: 'Después' });
    expect(r.status).toBe(403);
    expect(repo.updateImagen).not.toHaveBeenCalled();
  });

  test('CA3: reemplazar la foto con 15 guarda la subida, borra la anterior y nunca la ajena', async () => {
    const r = await request(app).put('/api/v1/imagenes/3').set('Authorization', sesion(2))
      .set('x-prueba-archivo', '1').send({ imagen: AJENA });
    expect(r.status).toBe(200);
    const [, cambios] = repo.updateImagen.mock.calls[0];
    expect(cambios.imagen).toBe(SUBIDA);
    expect(borrarArchivo).toHaveBeenCalledWith(ANTERIOR);
    expect(borrarArchivo).not.toHaveBeenCalledWith(AJENA);
    expect(repo.crearImagenConLimite).not.toHaveBeenCalled();
  });

  test('CA3: cambiar solo la visibilidad con 15 se guarda', async () => {
    const r = await request(app).put('/api/v1/imagenes/3').set('Authorization', sesion(1))
      .send({ visible: '0' });
    expect(r.status).toBe(200);
    const [, cambios] = repo.updateImagen.mock.calls[0];
    expect(cambios).toEqual({ visible: '0' });
    expect(repo.crearImagenConLimite).not.toHaveBeenCalled();
  });
});

describe('P14 y P15 · logs del 409', () => {
  test('la línea «Petición atendida» lleva el request_id de la respuesta y ningún log trae el título ni el archivo', async () => {
    llena();
    const r = await request(app).post('/api/v1/imagenes').set('Authorization', sesion(1))
      .set('x-prueba-archivo', '1').send({ titulo: TITULO, visible: '1' });
    await tras();

    const requestId = r.headers['x-request-id'];
    expect(requestId).toEqual(expect.any(String));
    const atendida = captura.lineas.filter((l) => l.message === 'Petición atendida');
    expect(atendida).toHaveLength(1);
    expect(atendida[0]).toMatchObject({ request_id: requestId, context: { status: 409 } });
    const texto = captura.crudas.join('');
    expect(texto).not.toContain(TITULO);
    expect(texto).not.toContain('subida-q29');
  });
});
