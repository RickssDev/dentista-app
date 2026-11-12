// Spec 021 · H2: nadie puede eliminar, desactivar ni quitar el rol al último Administrador activo.
jest.mock('../../src/modules/users/user.repository', () => ({
  getUsuarios: jest.fn(),
  getUsuarioById: jest.fn(),
  getRolById: jest.fn(),
  findOtroUsuarioPorCorreo: jest.fn(),
  createUsuario: jest.fn(),
  updateUsuario: jest.fn(),
  deleteUsuario: jest.fn(),
  desactivarUsuario: jest.fn(),
  conTransaccion: jest.fn(),
  bloquearAdministradoresActivos: jest.fn(),
}));
jest.mock('../../src/utils/borrarArchivo', () => jest.fn());

const repo = require('../../src/modules/users/user.repository');
const borrarArchivo = require('../../src/utils/borrarArchivo');
const usuarios = require('../../src/modules/users/user.service');

const ROLES = { 1: 'Administrador', 2: 'Asistente', 3: 'Paciente' };
const CONN = { nombre: 'conexión de la transacción' };
const AVISO = 'Debe quedar al menos un Administrador activo';

const admin = (cambios = {}) => ({
  id_usuario: 5,
  nombre_usuario: 'Ana',
  apellido: 'Pérez',
  correo: 'ana@example.test',
  telefono: '5512345678',
  imagen: '/uploads/ana.jpg',
  estado: 'activo',
  rol_id: 1,
  rol_nombre: 'Administrador',
  ...cambios,
});

// Lo que reenvía el panel al editar a la Administradora: todos los campos con valor
const edicionDelPanel = (cambios = {}) => ({
  nombre: 'Ana',
  apellido: 'Pérez',
  correo: 'ana@example.test',
  telefono: '5512345678',
  estado: 'activo',
  id_rol: '1',
  ...cambios,
});

let eventos;
const conActivos = (...ids) =>
  repo.bloquearAdministradoresActivos.mockResolvedValue(ids.map((id) => ({ id_usuario: id })));

beforeEach(() => {
  jest.resetAllMocks();
  eventos = [];
  repo.getUsuarioById.mockResolvedValue(admin());
  repo.getRolById.mockImplementation(async (id) =>
    ROLES[id] ? { id_rol: Number(id), rol: ROLES[id] } : undefined);
  repo.findOtroUsuarioPorCorreo.mockResolvedValue(undefined);
  repo.updateUsuario.mockResolvedValue();
  repo.deleteUsuario.mockImplementation(async () => { eventos.push('delete'); });
  repo.desactivarUsuario.mockImplementation(async () => { eventos.push('desactivar'); });
  borrarArchivo.mockImplementation(async () => { eventos.push('borrar imagen'); });
  repo.conTransaccion.mockImplementation(async (fn) => {
    eventos.push('begin');
    const resultado = await fn(CONN);
    eventos.push('commit');
    return resultado;
  });
});

const rechaza409 = (promesa) =>
  expect(promesa).rejects.toMatchObject({ statusCode: 409, message: AVISO });

describe('CA7 · el único Administrador activo no se elimina, desactiva ni degrada', () => {
  beforeEach(() => conActivos(5));

  test('eliminarla → 409 y no se borra ni se desactiva', async () => {
    await rechaza409(usuarios.deleteUsuario(5));
    expect(repo.deleteUsuario).not.toHaveBeenCalled();
    expect(repo.desactivarUsuario).not.toHaveBeenCalled();
    expect(borrarArchivo).not.toHaveBeenCalled();
  });

  test('desactivarla → 409 y no se escribe', async () => {
    await rechaza409(usuarios.updateUsuario(5, edicionDelPanel({ estado: 'inactivo' })));
    expect(repo.updateUsuario).not.toHaveBeenCalled();
  });

  test('cambiarle el rol → 409 y no se escribe', async () => {
    await rechaza409(usuarios.updateUsuario(5, edicionDelPanel({ id_rol: '2' })));
    expect(repo.updateUsuario).not.toHaveBeenCalled();
  });

  test('también cuando lo intenta sobre su propia cuenta: la regla no exime a nadie', async () => {
    // El servicio no recibe quién actúa: la regla vale igual para cualquier Administrador
    await rechaza409(usuarios.updateUsuario(5, { estado: 'inactivo' }));
    await rechaza409(usuarios.deleteUsuario(5));
  });

  test('eliminarla cuando tiene información asociada (1451) → 409 sin desactivar', async () => {
    repo.deleteUsuario.mockRejectedValue(Object.assign(new Error('fk'), { errno: 1451 }));
    await rechaza409(usuarios.deleteUsuario(5));
    expect(repo.desactivarUsuario).not.toHaveBeenCalled();
  });
});

describe('CA8 · con otro Administrador activo, todo se permite como hoy', () => {
  beforeEach(() => conActivos(5, 6));

  test('eliminarla usa la conexión de la transacción y borra la imagen tras el commit', async () => {
    await expect(usuarios.deleteUsuario(5)).resolves.toMatchObject({ desactivado: false });
    expect(repo.deleteUsuario).toHaveBeenCalledWith(5, CONN);
    expect(eventos).toEqual(['begin', 'delete', 'commit', 'borrar imagen']);
  });

  test('desactivarla se permite y escribe con la conexión de la transacción', async () => {
    await usuarios.updateUsuario(5, edicionDelPanel({ estado: 'inactivo' }));
    expect(repo.updateUsuario).toHaveBeenCalledWith(5, { estado: 'inactivo' }, CONN);
  });

  test('cambiarle el rol se permite', async () => {
    await usuarios.updateUsuario(5, edicionDelPanel({ id_rol: '2' }));
    expect(repo.updateUsuario).toHaveBeenCalledWith(5, { id_rol: 2 }, CONN);
  });

  test('eliminarla con información asociada (1451) la desactiva con la conexión de la transacción', async () => {
    repo.deleteUsuario.mockRejectedValue(Object.assign(new Error('fk'), { errno: 1451 }));
    await expect(usuarios.deleteUsuario(5)).resolves.toMatchObject({ desactivado: true });
    expect(repo.desactivarUsuario).toHaveBeenCalledWith(5, CONN);
    expect(borrarArchivo).not.toHaveBeenCalled();
  });
});

describe('CA9 · editar otros datos de la única y reactivar se permite', () => {
  beforeEach(() => conActivos(5));

  test('editar su nombre o su contraseña se guarda', async () => {
    await usuarios.updateUsuario(5, { nombre: 'Ana María', password: 'clave-segura-2' });
    expect(repo.updateUsuario).toHaveBeenCalled();
  });

  test("editarla con el payload exacto del panel (id_rol '1', estado 'activo') se guarda", async () => {
    await usuarios.updateUsuario(5, edicionDelPanel({ telefono: '5599999999' }));
    expect(repo.updateUsuario).toHaveBeenCalledWith(5, { telefono: '5599999999' });
  });

  test('reactivar a un Administrador inactivo se permite', async () => {
    repo.getUsuarioById.mockResolvedValue(admin({ id_usuario: 7, estado: 'inactivo' }));
    await usuarios.updateUsuario(7, edicionDelPanel({ estado: 'activo' }));
    expect(repo.updateUsuario).toHaveBeenCalledWith(7, { estado: 'activo' });
  });
});

describe('R7 · casos del único Administrador', () => {
  beforeEach(() => conActivos(5));

  test('editar su imagen se guarda sin transacción', async () => {
    await usuarios.updateUsuario(5, edicionDelPanel(), '/uploads/nueva.jpg');
    expect(repo.updateUsuario).toHaveBeenCalledWith(5, { imagen: '/uploads/nueva.jpg' });
    expect(repo.conTransaccion).not.toHaveBeenCalled();
  });

  test('desactivarla y cambiarle el rol en el mismo PUT → 409 sin escribir', async () => {
    await rechaza409(usuarios.updateUsuario(5, edicionDelPanel({ estado: 'inactivo', id_rol: '2' })));
    expect(repo.updateUsuario).not.toHaveBeenCalled();
  });
});
