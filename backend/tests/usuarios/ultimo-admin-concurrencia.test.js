// Spec 021 · CA10 (abuso): dos degradaciones cruzadas simultáneas nunca dejan cero Administradores.
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
const AppError = require('../../src/utils/AppError');

const ROLES = { 1: 'Administrador', 2: 'Asistente', 3: 'Paciente' };
const CONN = { nombre: 'conexión de la transacción' };

describe('servicio con un repositorio que serializa las transacciones', () => {
  let cuentas;
  const pausa = () => new Promise((resolve) => setImmediate(resolve));

  beforeEach(() => {
    jest.resetAllMocks();
    cuentas = {
      5: { id_usuario: 5, nombre_usuario: 'Ana', apellido: 'A', correo: 'ana@example.test', estado: 'activo', rol_id: 1 },
      6: { id_usuario: 6, nombre_usuario: 'Beto', apellido: 'B', correo: 'beto@example.test', estado: 'activo', rol_id: 1 },
    };
    const conRol = (c) => ({ ...c, rol_nombre: ROLES[c.rol_id] });

    // Las dos peticiones leen la cuenta antes de bloquear: ambas ven dos Administradores
    repo.getUsuarioById.mockImplementation(async (id) => conRol({ ...cuentas[id] }));
    repo.getRolById.mockImplementation(async (id) => (ROLES[id] ? { id_rol: Number(id), rol: ROLES[id] } : undefined));
    repo.findOtroUsuarioPorCorreo.mockResolvedValue(undefined);

    // Como SELECT … FOR UPDATE: una transacción espera a que termine la otra
    let cola = Promise.resolve();
    repo.conTransaccion.mockImplementation((fn) => {
      const turno = cola.then(() => fn(CONN));
      cola = turno.catch(() => {});
      return turno;
    });
    repo.bloquearAdministradoresActivos.mockImplementation(async () => {
      await pausa();
      return Object.values(cuentas)
        .filter((c) => c.rol_id === 1 && c.estado === 'activo')
        .map((c) => ({ id_usuario: c.id_usuario }));
    });
    repo.updateUsuario.mockImplementation(async (id, cambios) => {
      await pausa();
      if (cambios.id_rol !== undefined) cuentas[id].rol_id = cambios.id_rol;
      if (cambios.estado !== undefined) cuentas[id].estado = cambios.estado;
    });
  });

  const administradoresActivos = () =>
    Object.values(cuentas).filter((c) => c.rol_id === 1 && c.estado === 'activo').length;

  test('dos degradaciones cruzadas: solo una pasa y queda un Administrador activo', async () => {
    const resultados = await Promise.allSettled([
      usuarios.updateUsuario(5, { id_rol: '2' }),
      usuarios.updateUsuario(6, { id_rol: '2' }),
    ]);

    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const [rechazo] = resultados.filter((r) => r.status === 'rejected');
    expect(rechazo.reason).toMatchObject({ statusCode: 409 });
    expect(administradoresActivos()).toBe(1);
  });

  test('dos desactivaciones cruzadas: solo una pasa y queda un Administrador activo', async () => {
    const resultados = await Promise.allSettled([
      usuarios.updateUsuario(5, { estado: 'inactivo' }),
      usuarios.updateUsuario(6, { estado: 'inactivo' }),
    ]);

    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(administradoresActivos()).toBe(1);
  });

  test('el bloqueo y la escritura usan la misma conexión de la transacción', async () => {
    await usuarios.updateUsuario(5, { estado: 'inactivo' });
    expect(repo.bloquearAdministradoresActivos).toHaveBeenCalledWith(CONN);
    expect(repo.updateUsuario).toHaveBeenCalledWith(5, { estado: 'inactivo' }, CONN);
  });
});

describe('repositorio real con una conexión falsa propia (sin tests/support/fake-db.js)', () => {
  const real = jest.requireActual('../../src/modules/users/user.repository');

  const origenFalso = () => {
    const eventos = [];
    const conn = {
      query: jest.fn(async (sql) => {
        eventos.push(sql.replace(/\s+/g, ' ').trim());
        return [[{ id_usuario: 1 }, { id_usuario: 2 }]];
      }),
      beginTransaction: async () => { eventos.push('begin'); },
      commit: async () => { eventos.push('commit'); },
      rollback: async () => { eventos.push('rollback'); },
      release: () => { eventos.push('release'); },
    };
    return { eventos, conn, origen: { getConnection: async () => conn } };
  };

  test('bloquea con FOR UPDATE y escribe en la misma conexión, entre begin y commit', async () => {
    const { eventos, conn, origen } = origenFalso();

    await real.conTransaccion(async (c) => {
      expect(c).toBe(conn);
      await real.bloquearAdministradoresActivos(c);
      await real.updateUsuario(5, { estado: 'inactivo' }, c);
    }, origen);

    expect(eventos[0]).toBe('begin');
    expect(eventos[1]).toMatch(/FOR UPDATE/i);
    expect(eventos[1]).toMatch(/Administrador/);
    expect(eventos[1]).toMatch(/activo/);
    expect(eventos[2]).toMatch(/^UPDATE usuarios SET estado = \? WHERE id_usuario = \?$/);
    expect(eventos.slice(3)).toEqual(['commit', 'release']);
  });

  test('ante un 409 deshace la transacción, libera la conexión y propaga el error', async () => {
    const { eventos, origen } = origenFalso();
    const conflicto = new AppError('Debe quedar al menos un Administrador activo', 409);

    await expect(real.conTransaccion(async (c) => {
      await real.bloquearAdministradoresActivos(c);
      throw conflicto;
    }, origen)).rejects.toBe(conflicto);

    expect(eventos[0]).toBe('begin');
    expect(eventos.slice(-2)).toEqual(['rollback', 'release']);
    expect(eventos).not.toContain('commit');
  });

  test('R6 · si el rollback lanza, se propaga el error original (409) y se libera la conexión', async () => {
    const { eventos, conn, origen } = origenFalso();
    conn.rollback = async () => { eventos.push('rollback fallido'); throw new Error('conexión perdida'); };
    const conflicto = new AppError('Debe quedar al menos un Administrador activo', 409);

    await expect(real.conTransaccion(async () => { throw conflicto; }, origen)).rejects.toBe(conflicto);
    expect(eventos.slice(-2)).toEqual(['rollback fallido', 'release']);
  });
});
