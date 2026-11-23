// Spec 029 · CA1–CA4, TM3, TM6: el servicio de imágenes limita las altas a 15 y borra solo la foto
// subida en la petición cuando un alta se rechaza. El repositorio y el borrado de archivos van
// simulados: aquí se prueba la regla, no el SQL (ver limite-galeria-concurrencia.test.js).
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

const repo = require('../../src/modules/images/images.repository');
const borrarArchivo = require('../../src/utils/borrarArchivo');
const service = require('../../src/modules/images/images.service');
const {
  MAX_IMAGENES_GALERIA,
  MENSAJE_GALERIA_LLENA,
  MENSAJE_GALERIA_OCUPADA,
} = require('../../src/modules/images/images.limites');

const SUBIDA = '/uploads/subida-029.jpg';
const AJENA = '/uploads/foto-de-perfil-ajena.jpg';
const DATOS = { titulo: 'Consultorio', visible: '1' };

// Galería simulada: el repositorio falso cuenta e inserta como lo hará el real
let galeria;
const conImagenes = (n) => {
  galeria = Array.from({ length: n }, (_, i) => ({
    id_imagen: i + 1,
    titulo: `Imagen ${i + 1}`,
    imagen: `/uploads/${i + 1}.jpg`,
    visible: i % 2,
  }));
};

beforeEach(() => {
  jest.resetAllMocks();
  conImagenes(0);
  repo.crearImagenConLimite.mockImplementation(async (datos, max) => {
    if (galeria.length >= max) return { creada: false, total: galeria.length };
    const id = galeria.length + 100;
    galeria.push({ id_imagen: id, ...datos });
    return { creada: true, id };
  });
  repo.getImagenById.mockImplementation(async (id) => galeria.find((g) => g.id_imagen === Number(id)));
  repo.updateImagen.mockResolvedValue();
  repo.deleteImagen.mockImplementation(async (id) => {
    galeria = galeria.filter((g) => g.id_imagen !== Number(id));
  });
});

describe('029 · alta con límite', () => {
  test('CA1: con 14 se crea, devuelve el id y usa la ruta del archivo subido', async () => {
    conImagenes(14);

    const id = await service.createImagen({ ...DATOS }, SUBIDA);

    expect(id).toBe(114);
    expect(galeria).toHaveLength(15);
    expect(repo.crearImagenConLimite).toHaveBeenCalledWith(
      { titulo: 'Consultorio', imagen: SUBIDA, visible: '1' },
      MAX_IMAGENES_GALERIA,
    );
    expect(borrarArchivo).not.toHaveBeenCalled();
  });

  test('CA2: con 15 se rechaza con 409, sigue en 15 y borra solo la foto subida', async () => {
    conImagenes(15);

    await expect(service.createImagen({ ...DATOS }, SUBIDA)).rejects.toMatchObject({
      statusCode: 409,
      message: MENSAJE_GALERIA_LLENA,
    });
    expect(galeria).toHaveLength(15);
    expect(borrarArchivo).toHaveBeenCalledTimes(1);
    expect(borrarArchivo).toHaveBeenCalledWith(SUBIDA);
  });

  test('sin obtener el bloqueo: 503 y la foto subida se borra', async () => {
    repo.crearImagenConLimite.mockResolvedValue({ bloqueo: false });

    await expect(service.createImagen({ ...DATOS }, SUBIDA)).rejects.toMatchObject({
      statusCode: 503,
      message: MENSAJE_GALERIA_OCUPADA,
    });
    expect(borrarArchivo).toHaveBeenCalledWith(SUBIDA);
  });

  test('400 por falta de título: la foto subida se borra (decisión A10)', async () => {
    await expect(service.createImagen({ visible: '1' }, SUBIDA)).rejects.toMatchObject({ statusCode: 400 });
    expect(borrarArchivo).toHaveBeenCalledWith(SUBIDA);
    expect(repo.crearImagenConLimite).not.toHaveBeenCalled();
  });

  test('un error del repositorio también borra la foto subida y se propaga', async () => {
    repo.crearImagenConLimite.mockRejectedValue(new Error('fallo de la base'));

    await expect(service.createImagen({ ...DATOS }, SUBIDA)).rejects.toThrow('fallo de la base');
    expect(borrarArchivo).toHaveBeenCalledWith(SUBIDA);
  });
});

describe('029 · TM6: la ruta de la imagen nunca sale del cuerpo', () => {
  test('con archivo subido, un imagen ajeno en el cuerpo no llega al repositorio', async () => {
    conImagenes(14);

    await service.createImagen({ ...DATOS, imagen: AJENA }, SUBIDA);

    const [datos] = repo.crearImagenConLimite.mock.calls[0];
    expect(datos.imagen).toBe(SUBIDA);
  });

  test('con 15 y un imagen ajeno en el cuerpo, solo se borra la foto subida', async () => {
    conImagenes(15);

    await expect(service.createImagen({ ...DATOS, imagen: AJENA }, SUBIDA)).rejects.toMatchObject({ statusCode: 409 });
    expect(borrarArchivo).toHaveBeenCalledWith(SUBIDA);
    expect(borrarArchivo).not.toHaveBeenCalledWith(AJENA);
  });

  test('sin archivo subido: 400, sin guardar y sin borrar nada, aunque el cuerpo traiga una ruta', async () => {
    await expect(service.createImagen({ ...DATOS, imagen: AJENA }, undefined)).rejects.toMatchObject({ statusCode: 400 });
    expect(repo.crearImagenConLimite).not.toHaveBeenCalled();
    expect(borrarArchivo).not.toHaveBeenCalled();
  });
});

describe('029 · editar y eliminar no pasan por el límite', () => {
  test('CA3: con 15, editar el título guarda sin consultar el límite', async () => {
    conImagenes(15);

    const actualizada = await service.updateImagen(3, { titulo: 'Nuevo título' });

    expect(repo.updateImagen).toHaveBeenCalledWith(3, { titulo: 'Nuevo título' });
    expect(actualizada).toMatchObject({ id_imagen: 3 });
  });

  test('CA4: con 15, tras eliminar una, otra alta pasa', async () => {
    conImagenes(15);

    await service.deleteImagen(1);
    const id = await service.createImagen({ ...DATOS }, SUBIDA);

    expect(id).toBe(114);
    expect(galeria).toHaveLength(15);
  });
});
