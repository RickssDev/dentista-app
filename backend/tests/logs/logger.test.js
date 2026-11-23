// Spec 026, T010: pruebas unitarias del logger JSON propio (ADR 0011).
const logger = require('../../src/utils/logger');
const { ejecutarConContexto } = require('../../src/utils/contexto');

const ENTORNO = { NODE_ENV: process.env.NODE_ENV, LOG_LEVEL: process.env.LOG_LEVEL };

const restaurarEntorno = () => {
  for (const [clave, valor] of Object.entries(ENTORNO)) {
    if (valor === undefined) delete process.env[clave];
    else process.env[clave] = valor;
  }
};

// Lo que el logger escribe en stdout, sin captura (para probar niveles y el piso de producción).
const escribirEnStdout = (fn) => {
  const escrito = [];
  const espia = jest.spyOn(process.stdout, 'write').mockImplementation((texto) => {
    escrito.push(String(texto));
    return true;
  });
  try {
    fn();
  } finally {
    espia.mockRestore();
  }
  return escrito;
};

afterEach(() => {
  restaurarEntorno();
  jest.restoreAllMocks();
});

describe('026 · CA6 formato de la línea', () => {
  test('una línea JSON con timestamp, level, message y context', () => {
    const captura = logger.__capturar();
    logger.info('Mensaje de prueba', { id_cita: 7 });
    captura.terminar();

    expect(captura.lineas).toHaveLength(1);
    const [linea] = captura.lineas;
    expect(new Date(linea.timestamp).toISOString()).toBe(linea.timestamp);
    expect(linea).toMatchObject({ level: 'info', message: 'Mensaje de prueba', context: { id_cita: 7 } });
    expect(linea).not.toHaveProperty('request_id');
    expect(linea).not.toHaveProperty('actor_id');
  });

  test('cada línea cruda es JSON válido en una sola línea terminada en salto', () => {
    const captura = logger.__capturar();
    logger.warn('Con "comillas" y\nsalto', { texto: 'a\nb' });
    captura.terminar();

    expect(captura.crudas).toHaveLength(1);
    const [cruda] = captura.crudas;
    expect(cruda.endsWith('\n')).toBe(true);
    expect(cruda.slice(0, -1)).not.toContain('\n');
    expect(() => JSON.parse(cruda)).not.toThrow();
  });

  test('dentro de una petición lleva request_id y actor_id numérico', () => {
    const req = { user: { id: 12, rol: 'Administrador', correo: 'no-debe-salir@example.test' } };
    const captura = logger.__capturar();
    ejecutarConContexto({ requestId: 'req-prueba-0001', req }, () => logger.info('Dentro'));
    captura.terminar();

    expect(captura.lineas[0]).toMatchObject({ request_id: 'req-prueba-0001', actor_id: 12 });
    expect(JSON.stringify(captura.lineas[0])).not.toContain('no-debe-salir@example.test');
  });

  test('actor_id se lee al escribir: aparece si req.user se asigna después de abrir el contexto', () => {
    const req = {};
    const captura = logger.__capturar();
    ejecutarConContexto({ requestId: 'req-prueba-0002', req }, () => {
      logger.info('Antes');
      req.user = { id: 5, rol: 'Paciente' };
      logger.info('Después');
    });
    captura.terminar();

    expect(captura.lineas[0]).not.toHaveProperty('actor_id');
    expect(captura.lineas[1].actor_id).toBe(5);
  });

  test('dentro de un trabajo lleva job_id', () => {
    const captura = logger.__capturar();
    ejecutarConContexto({ jobId: 'job-prueba-0001' }, () => logger.info('Trabajo'));
    captura.terminar();

    expect(captura.lineas[0].job_id).toBe('job-prueba-0001');
    expect(captura.lineas[0]).not.toHaveProperty('request_id');
  });
});

describe('026 · CA7 niveles y piso de producción', () => {
  test('en producción debug no sale, ni con LOG_LEVEL=debug', () => {
    process.env.NODE_ENV = 'production';
    process.env.LOG_LEVEL = 'debug';
    const escrito = escribirEnStdout(() => {
      logger.debug('Depuración');
      logger.info('Información');
    });

    expect(escrito).toHaveLength(1);
    expect(JSON.parse(escrito[0]).level).toBe('info');
  });

  test('en producción LOG_LEVEL=silent se ignora: info sigue saliendo (A21)', () => {
    process.env.NODE_ENV = 'production';
    process.env.LOG_LEVEL = 'silent';
    const escrito = escribirEnStdout(() => logger.info('Sigue saliendo'));

    expect(escrito).toHaveLength(1);
  });

  test('en producción sin LOG_LEVEL el nivel es info', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.LOG_LEVEL;
    const escrito = escribirEnStdout(() => {
      logger.debug('No');
      logger.info('Sí');
    });

    expect(escrito.map((l) => JSON.parse(l).message)).toEqual(['Sí']);
  });

  test('en local sin LOG_LEVEL debug sí sale', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.LOG_LEVEL;
    const escrito = escribirEnStdout(() => logger.debug('Depuración local'));

    expect(escrito).toHaveLength(1);
    expect(JSON.parse(escrito[0]).level).toBe('debug');
  });

  test('LOG_LEVEL=warn filtra info y deja warn y error', () => {
    process.env.NODE_ENV = 'development';
    process.env.LOG_LEVEL = 'warn';
    const escrito = escribirEnStdout(() => {
      logger.info('No');
      logger.warn('Sí 1');
      logger.error('Sí 2');
    });

    expect(escrito.map((l) => JSON.parse(l).level)).toEqual(['warn', 'error']);
  });

  test('con LOG_LEVEL=silent fuera de producción no sale nada', () => {
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'silent';
    const escrito = escribirEnStdout(() => logger.error('Nada'));

    expect(escrito).toHaveLength(0);
  });
});

describe('026 · captura (A3, A24)', () => {
  test('captura en debug aunque LOG_LEVEL=silent y aunque sea producción, y no escribe en stdout', () => {
    process.env.NODE_ENV = 'production';
    process.env.LOG_LEVEL = 'silent';
    let captura;
    const escrito = escribirEnStdout(() => {
      captura = logger.__capturar();
      logger.debug('Capturada');
      captura.terminar();
    });

    expect(captura.lineas.map((l) => l.message)).toEqual(['Capturada']);
    expect(escrito).toHaveLength(0);
  });

  test('al terminar la captura se restaura el piso de producción', () => {
    process.env.NODE_ENV = 'production';
    const captura = logger.__capturar();
    captura.terminar();
    const escrito = escribirEnStdout(() => logger.debug('No sale'));

    expect(escrito).toHaveLength(0);
  });

  test('la captura respeta el nivel pedido', () => {
    const captura = logger.__capturar({ nivel: 'warn' });
    logger.info('No');
    logger.warn('Sí');
    captura.terminar();

    expect(captura.lineas.map((l) => l.message)).toEqual(['Sí']);
  });
});

describe('026 · CA10 reemplazo de campos sensibles', () => {
  test('las claves de nombre sensible quedan ocultas a cualquier profundidad', () => {
    const captura = logger.__capturar();
    logger.info('Datos', {
      correo: 'centinela@example.test',
      Email: 'otro@example.test',
      telefono_paciente: '5512345678',
      PASSWORD: 'Clave-Centinela-1',
      'access-token': 'tok-centinela',
      authorization: 'Bearer centinela',
      credential: 'cred-centinela',
      nombre_usuario: 'Nombre Centinela',
      name: 'Otro Centinela',
      direccion: 'Calle Centinela',
      Error_Name: 'no se conserva',
      nivel1: { nivel2: { telefono: '5598765432', id: 3 } },
      lista: [{ correo: 'en-lista@example.test' }],
      id_cita: 9,
      plantilla: 'cita_recordatorio',
      error_name: 'TypeError',
      type: 'entity.parse.failed',
    });
    captura.terminar();

    const { context } = captura.lineas[0];
    for (const clave of [
      'correo', 'Email', 'telefono_paciente', 'PASSWORD', 'access-token', 'authorization',
      'credential', 'nombre_usuario', 'name', 'direccion', 'Error_Name',
    ]) {
      expect(context[clave]).toBe('[oculto]');
    }
    expect(context.nivel1.nivel2).toEqual({ telefono: '[oculto]', id: 3 });
    expect(context.lista).toEqual([{ correo: '[oculto]' }]);
    expect(context).toMatchObject({
      id_cita: 9,
      plantilla: 'cita_recordatorio',
      error_name: 'TypeError',
      type: 'entity.parse.failed',
    });
    expect(captura.crudas.join('')).not.toMatch(/centinela|5512345678|5598765432/i);
  });

  test('un objeto con referencias circulares no rompe la escritura', () => {
    const ciclo = { id: 1 };
    ciclo.yo = ciclo;
    const captura = logger.__capturar();
    expect(() => logger.info('Circular', { ciclo })).not.toThrow();
    captura.terminar();

    expect(captura.lineas).toHaveLength(1);
  });
});

describe('026 · CA12 un fallo al escribir no se propaga', () => {
  test('un destino que lanza se invoca y la llamada no lanza', () => {
    const alEscribir = jest.fn(() => {
      throw new Error('disco lleno');
    });
    const captura = logger.__capturar({ alEscribir });

    expect(() => logger.error('Con destino roto')).not.toThrow();
    captura.terminar();
    expect(alEscribir).toHaveBeenCalledTimes(1);
  });
});

describe('026 · CA11 y TM4 resumen de errores externos', () => {
  const errorAxios = () => {
    const err = new Error('Request failed with status code 400');
    err.isAxiosError = true;
    err.config = {
      url: 'https://graph.facebook.com/v25.0/123/messages',
      headers: { Authorization: 'Bearer centinela-token-whatsapp' },
      data: JSON.stringify({ to: '5512345678' }),
    };
    err.response = {
      status: 400,
      data: { error: { message: 'Número 5512345678 inválido', code: 131026 } },
    };
    return err;
  };

  test('de un error de axios solo quedan servicio, status y codigo', () => {
    expect(logger.resumirErrorExterno('whatsapp', errorAxios())).toEqual({
      servicio: 'whatsapp',
      status: 400,
      codigo: 131026,
    });
  });

  test('un error sin respuesta del proveedor deja status y codigo en null', () => {
    const err = Object.assign(new Error('socket hang up 5512345678'), { code: 'ECONNRESET' });

    expect(logger.resumirErrorExterno('correo', err)).toEqual({
      servicio: 'correo',
      status: null,
      codigo: 'ECONNRESET',
    });
  });

  test('registrado en una línea, no aparecen el token, el teléfono ni la URL', () => {
    const captura = logger.__capturar();
    logger.error('Aviso de WhatsApp no enviado', logger.resumirErrorExterno('whatsapp', errorAxios()));
    captura.terminar();

    expect(captura.crudas.join('')).not.toMatch(/centinela|5512345678|graph\.facebook/);
  });
});

describe('026 · TM6 resumen de errores internos', () => {
  test('un error de MySQL no deja el valor duplicado ni el SQL', () => {
    const err = new Error("Duplicate entry 'centinela@example.test' for key 'correo'");
    Object.assign(err, {
      code: 'ER_DUP_ENTRY',
      errno: 1062,
      sqlState: '23000',
      sqlMessage: "Duplicate entry 'centinela@example.test' for key 'correo'",
      sql: "INSERT INTO usuarios (correo) VALUES ('centinela@example.test')",
    });

    const resumen = logger.resumirError(err);

    expect(resumen).toMatchObject({ error_name: 'Error', code: 'ER_DUP_ENTRY', errno: 1062 });
    expect(typeof resumen.stack).toBe('string');
    expect(JSON.stringify(resumen)).not.toMatch(/centinela|INSERT/);
  });

  test('un error común conserva nombre, mensaje y pila', () => {
    const resumen = logger.resumirError(new TypeError('x no es función'));

    expect(resumen).toMatchObject({ error_name: 'TypeError', message: 'x no es función' });
    expect(resumen.stack).toContain('TypeError');
  });
});

describe('026 · RNF salida por stdout', () => {
  test('sin captura escribe en process.stdout', () => {
    process.env.NODE_ENV = 'development';
    process.env.LOG_LEVEL = 'info';
    const escrito = escribirEnStdout(() => logger.info('A stdout'));

    expect(escrito).toHaveLength(1);
    expect(JSON.parse(escrito[0]).message).toBe('A stdout');
  });
});
