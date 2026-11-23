// Spec 029 · CA7 (abuso), TM1, TM4, P9: dos altas simultáneas nunca pasan de 15, y el bloqueo con
// nombre se toma, se usa y se suelta en la misma conexión, también cuando algo falla.
// Dos piezas: el servicio con un repositorio falso que serializa como el bloqueo, y el repositorio
// real con un pool falso cuyo getConnection() devuelve una conexión falsa (A11).

describe('029 · servicio: dos altas simultáneas con 14', () => {
  let repo;
  let service;
  let galeria;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../src/modules/images/images.repository', () => ({
      crearImagenConLimite: jest.fn(),
      getImagenById: jest.fn(),
      updateImagen: jest.fn(),
      deleteImagen: jest.fn(),
    }));
    jest.doMock('../../src/utils/borrarArchivo', () => jest.fn());
    repo = require('../../src/modules/images/images.repository');
    service = require('../../src/modules/images/images.service');

    galeria = Array.from({ length: 14 }, (_, i) => ({ id_imagen: i + 1 }));
    const pausa = () => new Promise((resolve) => setImmediate(resolve));

    // Como GET_LOCK: una alta espera a que termine la otra antes de contar
    let cola = Promise.resolve();
    repo.crearImagenConLimite.mockImplementation((datos, max) => {
      const turno = cola.then(async () => {
        const total = galeria.length;
        await pausa();
        if (total >= max) return { creada: false, total };
        await pausa();
        galeria.push({ id_imagen: galeria.length + 1, ...datos });
        return { creada: true, id: galeria.length };
      });
      cola = turno.catch(() => {});
      return turno;
    });
  });

  afterEach(() => {
    jest.dontMock('../../src/modules/images/images.repository');
    jest.dontMock('../../src/utils/borrarArchivo');
  });

  test('CA7: una se crea, la otra recibe 409 y la galería queda en 15', async () => {
    const resultados = await Promise.allSettled([
      service.createImagen({ titulo: 'A', visible: '1' }, '/uploads/a.jpg'),
      service.createImagen({ titulo: 'B', visible: '1' }, '/uploads/b.jpg'),
    ]);

    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const [rechazo] = resultados.filter((r) => r.status === 'rejected');
    expect(rechazo.reason.statusCode).toBe(409);
    expect(galeria).toHaveLength(15);
  });
});

describe('029 · repositorio: crearImagenConLimite', () => {
  const repo = require('../../src/modules/images/images.repository');
  const MARCAS = { titulo: 'TituloMarcaQ29', imagen: '/uploads/marca-q29.jpg', visible: '1' };

  // Conexión falsa: responde a las cuatro consultas del alta y registra todo en orden
  const conexionFalsa = ({ bloqueo = 1, total = 14, fallaInsert = false, fallaRelease = false } = {}) => {
    const llamadas = [];
    const conn = {
      llamadas,
      release: jest.fn(() => llamadas.push({ sql: 'release()' })),
      destroy: jest.fn(() => llamadas.push({ sql: 'destroy()' })),
      query: jest.fn(async (sql, params = []) => {
        llamadas.push({ sql, params });
        if (/GET_LOCK/i.test(sql)) return [[{ bloqueo }]];
        if (/COUNT\(\*\)/i.test(sql)) return [[{ total }]];
        if (/INSERT INTO imagenes/i.test(sql)) {
          if (fallaInsert) throw new Error('fallo del INSERT');
          return [{ insertId: 77 }];
        }
        if (/RELEASE_LOCK/i.test(sql)) {
          if (fallaRelease) throw new Error('fallo del RELEASE_LOCK');
          return [[{ soltado: 1 }]];
        }
        throw new Error(`SQL no simulado: ${sql}`);
      }),
    };
    const pool = { getConnection: jest.fn(async () => conn) };
    return { conn, pool };
  };

  const orden = (conn) => conn.llamadas.map(({ sql }) => {
    if (/GET_LOCK/i.test(sql)) return 'GET_LOCK';
    if (/COUNT\(\*\)/i.test(sql)) return 'COUNT';
    if (/INSERT/i.test(sql)) return 'INSERT';
    if (/RELEASE_LOCK/i.test(sql)) return 'RELEASE_LOCK';
    return sql;
  });

  test('TM1: GET_LOCK → COUNT → INSERT → RELEASE_LOCK en la misma conexión, y release() al final', async () => {
    const { conn, pool } = conexionFalsa({ total: 14 });

    const resultado = await repo.crearImagenConLimite(MARCAS, 15, pool);

    expect(resultado).toEqual({ creada: true, id: 77 });
    expect(pool.getConnection).toHaveBeenCalledTimes(1);
    expect(orden(conn)).toEqual(['GET_LOCK', 'COUNT', 'INSERT', 'RELEASE_LOCK', 'release()']);
    expect(conn.destroy).not.toHaveBeenCalled();
  });

  test('CA2: con 15 no hay INSERT, se suelta el bloqueo y devuelve creada: false', async () => {
    const { conn, pool } = conexionFalsa({ total: 15 });

    const resultado = await repo.crearImagenConLimite(MARCAS, 15, pool);

    expect(resultado).toEqual({ creada: false, total: 15 });
    expect(orden(conn)).toEqual(['GET_LOCK', 'COUNT', 'RELEASE_LOCK', 'release()']);
  });

  test('TM4: si el INSERT lanza, igual se suelta el bloqueo, se libera la conexión y el error sube', async () => {
    const { conn, pool } = conexionFalsa({ fallaInsert: true });

    await expect(repo.crearImagenConLimite(MARCAS, 15, pool)).rejects.toThrow('fallo del INSERT');
    expect(orden(conn)).toEqual(['GET_LOCK', 'COUNT', 'INSERT', 'RELEASE_LOCK', 'release()']);
  });

  test.each([[0], [null]])('TM4: GET_LOCK devuelve %p → sin bloqueo, sin COUNT, y la conexión se libera', async (bloqueo) => {
    const { conn, pool } = conexionFalsa({ bloqueo });

    const resultado = await repo.crearImagenConLimite(MARCAS, 15, pool);

    expect(resultado).toEqual({ bloqueo: false });
    expect(orden(conn)).toEqual(['GET_LOCK', 'release()']);
  });

  test('TM4 (A18): si RELEASE_LOCK lanza tras un INSERT correcto, el alta vale y la conexión se cierra', async () => {
    const { conn, pool } = conexionFalsa({ fallaRelease: true });

    const resultado = await repo.crearImagenConLimite(MARCAS, 15, pool);

    expect(resultado).toEqual({ creada: true, id: 77 });
    expect(conn.destroy).toHaveBeenCalledTimes(1);
    expect(conn.release).not.toHaveBeenCalled();
  });

  test('P9: los valores van solo en los parámetros, nunca en el texto del SQL', async () => {
    const { conn, pool } = conexionFalsa({ total: 3 });

    await repo.crearImagenConLimite(MARCAS, 15, pool);

    const insert = conn.llamadas.find(({ sql }) => /INSERT/i.test(sql));
    for (const valor of [MARCAS.titulo, MARCAS.imagen]) {
      expect(insert.sql).not.toContain(valor);
      expect(insert.params).toContain(valor);
    }
    const bloqueo = conn.llamadas.find(({ sql }) => /GET_LOCK/i.test(sql));
    expect(bloqueo.sql).not.toContain('dentissa_galeria_alta');
    expect(bloqueo.params).toContain('dentissa_galeria_alta');
    for (const { sql } of conn.llamadas) expect(sql).not.toMatch(/\$\{/);
  });
});
