// Logger JSON propio, sin dependencias (spec 026, ADR 0011).
// Una línea por mensaje en stdout con los campos de docs/observability.md → Logs.
// Nunca registra datos personales ni credenciales: los mensajes son literales y los datos van en
// `context`, donde las claves de nombre sensible se reemplazan por "[oculto]".
const { contextoActual } = require('./contexto');

const NIVELES = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };
const PISO_PRODUCCION = 'info';
const PROFUNDIDAD_MAXIMA = 5;
const ELEMENTOS_MAXIMOS = 50;
const TEXTO_MAXIMO = 4096;
const OCULTO = '[oculto]';

// Una clave es sensible si su nombre normalizado contiene alguno de estos términos, o si termina en
// «key» (apikey, X-Device-Key…). Incluye las variantes en español del dominio (/review R4).
const TERMINOS_SENSIBLES = [
  'correo', 'email', 'telefono', 'phone', 'celular', 'movil', 'password', 'pass', 'pwd',
  'contrasena', 'clave', 'token', 'jwt', 'bearer', 'session', 'authorization', 'credential',
  'credencial', 'secret', 'cookie', 'apikey', 'nombre', 'name', 'apellido', 'direccion', 'address',
  'destinatario',
];
// Claves que solo produce resumirError; se comparan tal cual, sin normalizar.
const CLAVES_PERMITIDAS = new Set(['error_name', 'type']);

let captura = null;

// Un error asíncrono de stdout (EPIPE si se cierra el destino) no debe tumbar el proceso (CA12,
// /review R6). Se registra una sola vez aunque el módulo se cargue varias veces (pruebas).
const OYENTE_STDOUT = Symbol.for('dentissa.logger.errorDeStdout');
if (!process.stdout[OYENTE_STDOUT]) {
  process.stdout[OYENTE_STDOUT] = true;
  process.stdout.on('error', () => {});
}

const normalizarClave = (clave) =>
  clave.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[-_\s]/g, '');

const esSensible = (clave) => {
  if (CLAVES_PERMITIDAS.has(clave)) return false;
  const normalizada = normalizarClave(clave);
  return normalizada.endsWith('key') || TERMINOS_SENSIBLES.some((termino) => normalizada.includes(termino));
};

/** Nivel mínimo vigente: el de la captura, o el del entorno con el piso de producción. */
const nivelMinimo = () => {
  if (captura) return captura.nivel;

  const enProduccion = process.env.NODE_ENV === 'production';
  const pedido = process.env.LOG_LEVEL;
  const nivel = Object.hasOwn(NIVELES, pedido) ? pedido : enProduccion ? PISO_PRODUCCION : 'debug';

  // En producción nunca baja de info: debug y silent se ignoran (decisión del usuario, /analyze A21).
  if (enProduccion && NIVELES[nivel] < NIVELES[PISO_PRODUCCION]) return PISO_PRODUCCION;
  if (enProduccion && nivel === 'silent') return PISO_PRODUCCION;
  return nivel;
};

/**
 * Resumen de un error interno para el log. De los errores de MySQL quita el mensaje, que puede
 * llevar el valor duplicado (ER_DUP_ENTRY), y nunca incluye `sql` ni `sqlMessage`.
 */
const resumirError = (error) => {
  if (!(error instanceof Error)) return { error_name: 'Error' };

  const errorName = error.name || 'Error';
  const esDeMySQL = Boolean(error.sqlState || error.sqlMessage);

  if (esDeMySQL) {
    // Primero se quita el mensaje entero, que puede ocupar varias líneas y hasta imitar un marco
    // («\n    at …») con el valor citado; después quedan solo los marcos (/review R1, R18).
    const texto = String(error.stack || '');
    const mensaje = String(error.message || '');
    const inicio = mensaje ? texto.indexOf(mensaje) : -1;
    const resto = inicio >= 0 ? texto.slice(inicio + mensaje.length) : texto;
    const pila = resto.split('\n').filter((linea) => /^\s+at /.test(linea));
    return {
      error_name: errorName,
      code: error.code,
      errno: error.errno,
      stack: [`${errorName}: [mensaje de MySQL omitido]`, ...pila].join('\n'),
    };
  }

  return { error_name: errorName, message: error.message, stack: error.stack };
};

/**
 * Resumen de un error de un servicio externo (WhatsApp, correo, Google): solo el servicio, el estado
 * HTTP y el código de error del proveedor. Nunca `config`, `request`, `data` ni su mensaje.
 */
const resumirErrorExterno = (servicio, error) => {
  const status = error?.response?.status ?? error?.status ?? null;
  const codigo = error?.response?.data?.error?.code ?? error?.codigo ?? error?.code ?? null;
  return { servicio, status: typeof status === 'number' ? status : null, codigo };
};

// `enCamino` guarda solo los objetos de la rama actual: un objeto repetido en ramas hermanas sale
// completo, y solo un ciclo real se marca como circular (/review R7).
const redactar = (valor, profundidad = 0, enCamino = new WeakSet()) => {
  if (typeof valor === 'bigint') return valor.toString();
  if (typeof valor === 'string') {
    return valor.length > TEXTO_MAXIMO ? `${valor.slice(0, TEXTO_MAXIMO)}…` : valor;
  }
  if (valor === null || typeof valor !== 'object') return valor;
  if (valor instanceof Error) return resumirError(valor);
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor.toISOString();
  if (ArrayBuffer.isView(valor) || valor instanceof ArrayBuffer) return `[binario ${valor.byteLength} bytes]`;
  if (enCamino.has(valor)) return '[circular]';
  if (profundidad >= PROFUNDIDAD_MAXIMA) return '[profundo]';

  enCamino.add(valor);
  try {
    if (Array.isArray(valor)) {
      const limpio = valor.slice(0, ELEMENTOS_MAXIMOS).map((v) => redactar(v, profundidad + 1, enCamino));
      if (valor.length > ELEMENTOS_MAXIMOS) limpio.push(`[+${valor.length - ELEMENTOS_MAXIMOS}]`);
      return limpio;
    }

    const limpio = {};
    for (const [clave, v] of Object.entries(valor)) {
      limpio[clave] = esSensible(clave) ? OCULTO : redactar(v, profundidad + 1, enCamino);
    }
    return limpio;
  } finally {
    enCamino.delete(valor);
  }
};

const escribir = (level, message, context) => {
  try {
    if (NIVELES[level] < NIVELES[nivelMinimo()]) return;

    const linea = { timestamp: new Date().toISOString(), level, message: String(message) };
    const ctx = contextoActual();
    if (ctx?.requestId) linea.request_id = ctx.requestId;
    if (ctx?.jobId) linea.job_id = ctx.jobId;
    const actor = ctx?.req?.user?.id;
    if (actor !== undefined && actor !== null) linea.actor_id = actor;
    if (context !== undefined) linea.context = redactar(context);

    const texto = `${JSON.stringify(linea)}\n`;

    if (captura) {
      captura.crudas.push(texto);
      captura.lineas.push(JSON.parse(texto));
      if (captura.alEscribir) captura.alEscribir(texto);
      return;
    }

    process.stdout.write(texto);
  } catch {
    // Un fallo al registrar nunca cambia la respuesta ni interrumpe el flujo (CA12).
  }
};

/**
 * Solo para pruebas: desvía las líneas a memoria con el nivel dado, sin importar LOG_LEVEL ni el
 * piso de producción. `terminar()` restaura la salida normal.
 */
const __capturar = ({ nivel = 'debug', alEscribir } = {}) => {
  const anterior = captura;
  const nueva = {
    nivel,
    alEscribir,
    lineas: [],
    crudas: [],
    terminar: () => {
      if (captura === nueva) captura = anterior;
    },
  };
  captura = nueva;
  return nueva;
};

module.exports = {
  debug: (message, context) => escribir('debug', message, context),
  info: (message, context) => escribir('info', message, context),
  warn: (message, context) => escribir('warn', message, context),
  error: (message, context) => escribir('error', message, context),
  resumirError,
  resumirErrorExterno,
  __capturar,
};
