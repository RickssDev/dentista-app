// Detiene la suite antes de ejecutar cualquier prueba si el entorno apunta a datos reales.
// Se usa como globalSetup de Jest y desde el comando único de la raíz.
const HOSTS_LOCALES = ['', 'localhost', '127.0.0.1', '::1'];

module.exports = async () => {
  const { NODE_ENV, DB_HOST = '' } = process.env;

  if (NODE_ENV === 'production') {
    throw new Error('Suite detenida: NODE_ENV=production apunta a datos reales.');
  }

  if (!HOSTS_LOCALES.includes(DB_HOST)) {
    throw new Error('Suite detenida: DB_HOST apunta a un servidor que no es local.');
  }

  // Las pruebas corren en UTC en cualquier máquina, como la CI: así un cálculo de fecha que use la
  // zona del proceso en vez de America/Mexico_City falla también en local (spec 030, /review R12).
  // Los procesos de Jest se crean después y heredan la variable.
  process.env.TZ = 'UTC';
};
