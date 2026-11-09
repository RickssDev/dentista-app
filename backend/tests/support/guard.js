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
};
