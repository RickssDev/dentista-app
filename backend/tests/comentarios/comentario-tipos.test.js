jest.mock('../../src/modules/comentarios/comen.repository');
jest.mock('../../src/modules/citas/citas.repository');

const comentarioRepo = require('../../src/modules/comentarios/comen.repository');
const citaRepo = require('../../src/modules/citas/citas.repository');
const comentarios = require('../../src/modules/comentarios/comen.service');

const USUARIO = { id: 7 };

const resena = (cambios = {}) => ({ comentario: 'Muy buena atención', calificacion: 5, id_cita: 40, ...cambios });

beforeEach(() => {
  jest.resetAllMocks();
  citaRepo.getCitaConUsuario.mockResolvedValue({ id_cita: 40, estado: 'completada', id_usuario: 7 });
  comentarioRepo.getComentarioByCita.mockResolvedValue(null);
  comentarioRepo.createComentario.mockResolvedValue(3);
});

describe('015 · una reseña con datos mal formados responde 400', () => {
  test.each([
    ['comentario', { texto: 'hola' }],
    ['calificacion', 'abc'],
    ['calificacion', 4.5],
    ['calificacion', [5]],
    ['id_cita', { id: 40 }],
    ['id_cita', 'cuarenta'],
  ])('%s = %j', async (campo, valor) => {
    await expect(comentarios.createComentario(resena({ [campo]: valor }), USUARIO))
      .rejects.toMatchObject({ statusCode: 400 });
    expect(comentarioRepo.createComentario).not.toHaveBeenCalled();
  });

  test('una reseña válida se guarda con números', async () => {
    await expect(comentarios.createComentario(resena({ calificacion: '4', id_cita: '40' }), USUARIO))
      .resolves.toEqual({ id: 3 });
    expect(comentarioRepo.createComentario).toHaveBeenCalledWith(
      expect.objectContaining({ calificacion: 4, id_cita: 40 }),
    );
  });

  test('015 CA3 · la cita de otro paciente sigue respondiendo 403', async () => {
    citaRepo.getCitaConUsuario.mockResolvedValue({ id_cita: 40, estado: 'completada', id_usuario: 99 });
    await expect(comentarios.createComentario(resena(), USUARIO)).rejects.toMatchObject({ statusCode: 403 });
  });
});
