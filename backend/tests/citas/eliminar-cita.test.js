jest.mock('../../src/modules/citas/citas.repository');
jest.mock('../../src/modules/servicios/servicios.repository');
jest.mock('../../src/modules/pacientes/pacientes.repository');
jest.mock('../../src/services/whatp.service');

const repo = require('../../src/modules/citas/citas.repository');
const citas = require('../../src/modules/citas/citas.service');

const errorReferenciada = () =>
  Object.assign(new Error('Cannot delete or update a parent row: a foreign key constraint fails'), {
    errno: 1451,
    code: 'ER_ROW_IS_REFERENCED_2',
  });

beforeEach(() => {
  jest.resetAllMocks();
});

describe('006 · eliminar una cita', () => {
  test('una cita sin información asociada se elimina', async () => {
    repo.deleteCita.mockResolvedValue();
    await expect(citas.deleteCita(5)).resolves.toEqual({ message: 'Cita eliminada correctamente' });
  });

  test('una cita con información asociada responde 409 con un mensaje claro', async () => {
    repo.deleteCita.mockRejectedValue(errorReferenciada());
    await expect(citas.deleteCita(5)).rejects.toMatchObject({
      statusCode: 409,
      isOperational: true,
      message: expect.stringMatching(/cancélala/i),
    });
  });

  test('cualquier otro error de la base de datos no se disfraza de 409', async () => {
    const otro = Object.assign(new Error('conexión perdida'), { code: 'PROTOCOL_CONNECTION_LOST' });
    repo.deleteCita.mockRejectedValue(otro);
    await expect(citas.deleteCita(5)).rejects.toBe(otro);
  });
});
