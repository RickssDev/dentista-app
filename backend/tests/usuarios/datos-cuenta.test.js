// Spec 021 · H1: el alta y la edición de cuentas solo aceptan datos válidos.
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
const usuarios = require('../../src/modules/users/user.service');

const CORREO = 'ana@example.test';
const CLAVE = 'clave-segura-1';
const ROLES = { 1: 'Administrador', 2: 'Asistente', 3: 'Paciente' };

const alta = (cambios = {}) => ({
  nombre: 'Ana',
  apellido: 'Pérez',
  correo: CORREO,
  password: CLAVE,
  telefono: '5512345678',
  id_rol: '2',
  ...cambios,
});

// Cuenta guardada de un Asistente (fuera de la regla del último Administrador)
const guardada = (cambios = {}) => ({
  id_usuario: 5,
  nombre_usuario: 'Ana',
  apellido: 'Pérez',
  correo: CORREO,
  telefono: '5512345678',
  imagen: null,
  estado: 'activo',
  rol_id: 2,
  rol_nombre: 'Asistente',
  ...cambios,
});

// Lo que reenvía el panel al editar: todos los campos con valor
const edicionDelPanel = (cambios = {}) => ({
  nombre: 'Ana',
  apellido: 'Pérez',
  correo: CORREO,
  telefono: '5512345678',
  estado: 'activo',
  id_rol: '2',
  ...cambios,
});

const rechaza400 = (promesa) => expect(promesa).rejects.toMatchObject({ statusCode: 400 });

beforeEach(() => {
  jest.resetAllMocks();
  repo.getRolById.mockImplementation(async (id) =>
    ROLES[id] ? { id_rol: Number(id), rol: ROLES[id] } : undefined);
  repo.findOtroUsuarioPorCorreo.mockResolvedValue(undefined);
  repo.createUsuario.mockResolvedValue(7);
  repo.updateUsuario.mockResolvedValue();
  repo.getUsuarioById.mockResolvedValue(guardada());
  repo.conTransaccion.mockImplementation(async (fn) => fn({}));
  repo.bloquearAdministradoresActivos.mockResolvedValue([{ id_usuario: 1 }, { id_usuario: 2 }]);
});

describe('CA1 · los campos que no son de la cuenta se ignoran', () => {
  const ajenos = { google_id: 'g-123', fecha_registro: '2020-01-01', id_usuario: 99, imagen: '/uploads/otro.jpg' };

  test('en el alta', async () => {
    await usuarios.createUsuario(alta(ajenos));
    const [datos] = repo.createUsuario.mock.calls[0];
    expect(datos).not.toHaveProperty('google_id');
    expect(datos).not.toHaveProperty('fecha_registro');
    expect(datos).not.toHaveProperty('id_usuario');
    expect(datos.imagen ?? null).toBeNull();
  });

  test('en la edición', async () => {
    await usuarios.updateUsuario(5, { nombre: 'Ana B', ...ajenos });
    const [, datos] = repo.updateUsuario.mock.calls[0];
    expect(Object.keys(datos)).toEqual(['nombre']);
  });

  test('la imagen solo llega del archivo subido', async () => {
    await usuarios.createUsuario(alta(), '/uploads/subida.jpg');
    expect(repo.createUsuario.mock.calls[0][0].imagen).toBe('/uploads/subida.jpg');
  });
});

describe('CA2 · el alta exige los obligatorios y nombra lo que falta', () => {
  test.each([
    ['nombre', /nombre/],
    ['apellido', /apellido/],
    ['correo', /correo/],
    ['password', /contraseña/],
    ['id_rol', /rol/],
  ])('sin %s → 400 que lo nombra', async (campo, patron) => {
    const datos = alta();
    delete datos[campo];
    await expect(usuarios.createUsuario(datos)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringMatching(patron),
    });
    expect(repo.createUsuario).not.toHaveBeenCalled();
  });
});

describe('CA3 · la contraseña sigue las reglas del registro (001 CA3)', () => {
  test.each([
    ['corta', 'abc'],
    ['de más de 72 bytes', 'ñ'.repeat(37)],
  ])('alta con una contraseña %s → 400', async (_caso, clave) => {
    await rechaza400(usuarios.createUsuario(alta({ password: clave })));
    expect(repo.createUsuario).not.toHaveBeenCalled();
  });

  test('edición con una contraseña corta → 400', async () => {
    await rechaza400(usuarios.updateUsuario(5, { password: 'abc' }));
    expect(repo.updateUsuario).not.toHaveBeenCalled();
  });
});

describe('CA4 · el correo debe ser válido y libre', () => {
  test('alta con un correo sin formato → 400', async () => {
    await rechaza400(usuarios.createUsuario(alta({ correo: 'ana@' })));
  });

  test('alta con el correo de otra cuenta → 400 sin datos de esa cuenta', async () => {
    repo.findOtroUsuarioPorCorreo.mockResolvedValue({ id_usuario: 9, nombre_usuario: 'Beto', rol: 'Asistente' });
    const error = await usuarios.createUsuario(alta()).catch((e) => e);
    expect(error).toMatchObject({ statusCode: 400, message: 'El correo ya está registrado' });
    expect(error.message).not.toMatch(/Beto|9|Asistente/);
    expect(repo.createUsuario).not.toHaveBeenCalled();
  });

  test('si la carrera llega al índice único (1062) → 400 sin el correo en el mensaje', async () => {
    repo.createUsuario.mockRejectedValue(Object.assign(
      new Error(`Duplicate entry '${CORREO}' for key 'correo'`),
      { errno: 1062, code: 'ER_DUP_ENTRY' },
    ));
    const error = await usuarios.createUsuario(alta()).catch((e) => e);
    expect(error).toMatchObject({ statusCode: 400, message: 'El correo ya está registrado' });
    expect(error.message).not.toContain(CORREO);
  });

  test('cuenta con correo guardado inválido: cambiar solo el teléfono se guarda', async () => {
    repo.getUsuarioById.mockResolvedValue(guardada({ correo: 'correo-viejo' }));
    await usuarios.updateUsuario(5, edicionDelPanel({ correo: 'correo-viejo', telefono: '5599999999' }));
    expect(repo.updateUsuario).toHaveBeenCalled();
  });

  test('cuenta con correo guardado inválido: cambiarlo a otro inválido → 400', async () => {
    repo.getUsuarioById.mockResolvedValue(guardada({ correo: 'correo-viejo' }));
    await rechaza400(usuarios.updateUsuario(5, edicionDelPanel({ correo: 'otro-malo' })));
    expect(repo.updateUsuario).not.toHaveBeenCalled();
  });
});

describe('CA5 · el rol y el estado solo toman valores que existen', () => {
  test.each([['inexistente', '9'], ['no entero', 'abc'], ['decimal', '1.5']])(
    'rol %s → 400', async (_caso, idRol) => {
      await expect(usuarios.createUsuario(alta({ id_rol: idRol })))
        .rejects.toMatchObject({ statusCode: 400, message: 'El rol no es válido' });
    },
  );

  test("id_rol en texto numérico ('1', como lo envía el panel) → se acepta", async () => {
    await usuarios.createUsuario(alta({ id_rol: '1' }));
    expect(repo.createUsuario.mock.calls[0][0].id_rol).toBe(1);
  });

  test('estado fuera de activo/inactivo en la edición → 400', async () => {
    await expect(usuarios.updateUsuario(5, { estado: 'borrado' }))
      .rejects.toMatchObject({ statusCode: 400, message: 'El estado no es válido' });
  });
});

describe('CA6 (abuso) · tipos y largos se rechazan con 400, nunca 500', () => {
  test.each([
    ['nombre', { a: 1 }],
    ['apellido', ['x']],
    ['correo', 12345],
    ['telefono', { numero: 1 }],
    ['password', ['clave-segura-1']],
  ])('alta con %s = %j → 400', async (campo, valor) => {
    await rechaza400(usuarios.createUsuario(alta({ [campo]: valor })));
    expect(repo.createUsuario).not.toHaveBeenCalled();
  });

  test('edición con un nombre que no es texto → 400', async () => {
    await rechaza400(usuarios.updateUsuario(5, { nombre: { a: 1 } }));
  });

  const correoDeLargo = (n) => `${'a'.repeat(n - '@example.test'.length)}@example.test`;

  test.each([
    ['nombre', 'a'.repeat(55), 'a'.repeat(56)],
    ['apellido', 'a'.repeat(55), 'a'.repeat(56)],
    ['correo', correoDeLargo(100), correoDeLargo(101)],
    ['telefono', '1'.repeat(20), '1'.repeat(21)],
  ])('%s en el máximo se acepta y en máximo + 1 → 400', async (campo, maximo, excedido) => {
    await usuarios.createUsuario(alta({ [campo]: maximo }));
    expect(repo.createUsuario).toHaveBeenCalledTimes(1);
    await rechaza400(usuarios.createUsuario(alta({ [campo]: excedido })));
    expect(repo.createUsuario).toHaveBeenCalledTimes(1);
  });
});
