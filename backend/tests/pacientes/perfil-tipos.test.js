jest.mock('../../src/modules/pacientes/pacientes.repository');

const repo = require('../../src/modules/pacientes/pacientes.repository');
const pacientes = require('../../src/modules/pacientes/pacientes.service');

const ID_USUARIO = 7;
const TELEFONO = '5512345678';

const perfilNuevo = (cambios = {}) => ({
  telefono: TELEFONO,
  direccion: 'Calle 1',
  fecha_nacimiento: '1990-05-10',
  genero: 'femenino',
  ...cambios,
});

const perfilEditado = (cambios = {}) => ({
  telefono: TELEFONO,
  direccion: 'Calle 2',
  genero: 'otro',
  ...cambios,
});

beforeEach(() => {
  jest.resetAllMocks();
  repo.findByUserId.mockResolvedValue(null);
  repo.create.mockImplementation(async (datos) => ({ id_paciente: 1, ...datos }));
  repo.findPerfilByUserId.mockResolvedValue({ telefono: TELEFONO });
});

describe('008 · crear el perfil con datos mal formados responde 400', () => {
  test.each([
    ['direccion', { calle: 'x' }],
    ['direccion', 'x'.repeat(401)],
    ['fecha_nacimiento', '1990-02-31'],
    ['fecha_nacimiento', ['1990-05-10']],
    ['genero', 'desconocido'],
    ['genero', ['femenino']],
  ])('%s = %j', async (campo, valor) => {
    await expect(pacientes.createPaciente(perfilNuevo({ [campo]: valor }), ID_USUARIO))
      .rejects.toMatchObject({ statusCode: 400 });
    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.updateTelefono).not.toHaveBeenCalled();
  });

  test('con datos válidos se crea', async () => {
    await pacientes.createPaciente(perfilNuevo(), ID_USUARIO);
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ genero: 'femenino' }));
  });
});

describe('008 · editar el perfil', () => {
  test.each([
    ['telefono', { numero: TELEFONO }],
    ['telefono', '123'],
    ['direccion', ['Calle 2']],
    ['genero', 'desconocido'],
  ])('con %s = %j responde 400 y no guarda', async (campo, valor) => {
    await expect(pacientes.updatePerfil(ID_USUARIO, perfilEditado({ [campo]: valor })))
      .rejects.toMatchObject({ statusCode: 400 });
    expect(repo.updatePerfilByUserId).not.toHaveBeenCalled();
  });

  test('el género vacío de "Seleccionar..." se guarda como sin género (null)', async () => {
    await pacientes.updatePerfil(ID_USUARIO, perfilEditado({ genero: '' }));
    expect(repo.updatePerfilByUserId).toHaveBeenCalledWith(
      ID_USUARIO,
      expect.objectContaining({ genero: null, telefono: TELEFONO }),
    );
  });

  test('con datos válidos guarda el teléfono solo con dígitos', async () => {
    await pacientes.updatePerfil(ID_USUARIO, perfilEditado({ telefono: '55 1234 5678' }));
    expect(repo.updatePerfilByUserId).toHaveBeenCalledWith(
      ID_USUARIO,
      { telefono: TELEFONO, direccion: 'Calle 2', genero: 'otro' },
    );
  });
});
