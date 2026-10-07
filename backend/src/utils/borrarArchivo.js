const fs = require('fs/promises');
const path = require('path');

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

const borrarArchivo = async (ruta) => {
  if (!ruta || typeof ruta !== 'string') return;

  // Acepta "/uploads/x.jpg", "uploads/x.jpg" y "uploads\x.jpg"
  const relativa = ruta.replace(/\\/g, '/').replace(/^\/+/, '');

  if (!relativa.startsWith('uploads/')) return;

  const fullPath = path.join(process.cwd(), relativa);

  // Evita salirse de la carpeta de uploads
  if (!fullPath.startsWith(UPLOADS_DIR + path.sep)) return;

  try {
    await fs.unlink(fullPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('No se pudo borrar el archivo:', error);
    }
  }
};

module.exports = borrarArchivo;