// Bloquea la red externa. Cada intento se registra y hace fallar el archivo donde ocurre,
// aunque el código bajo prueba capture el error.
const net = require('net');

const HOSTS_LOCALES = ['127.0.0.1', 'localhost', '::1', '::ffff:127.0.0.1'];
const salidas = [];
const conectar = net.Socket.prototype.connect;

net.Socket.prototype.connect = function connect(...argumentos) {
  const primero = argumentos[0];
  const opciones = Array.isArray(primero) ? primero[0] : primero;
  const host = typeof opciones === 'object' ? opciones.host || '127.0.0.1' : argumentos[1] || '127.0.0.1';
  const esSocketLocal = typeof opciones === 'object' && opciones.path;

  if (!esSocketLocal && !HOSTS_LOCALES.includes(host)) {
    salidas.push(host);
    throw new Error(`Red externa bloqueada: ${host}`);
  }

  return conectar.apply(this, argumentos);
};

const fetchBloqueado = async (destino) => {
  salidas.push(String(destino));
  throw new Error(`Red externa bloqueada: ${destino}`);
};

beforeEach(() => {
  global.fetch = fetchBloqueado;
});

afterEach(() => {
  const intentos = salidas.splice(0);
  if (intentos.length > 0) {
    throw new Error(`Intento de salida externa: ${intentos.join(', ')}`);
  }
});
