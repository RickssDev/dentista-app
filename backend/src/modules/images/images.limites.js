// Límite de la galería (spec 029). El frontend repite el número en src/utils/limitesGaleria.js y
// un test exige que coincidan.
const MAX_IMAGENES_GALERIA = 15;

const MENSAJE_GALERIA_LLENA =
  'La galería admite como máximo 15 imágenes. Elimina una para agregar otra.';

const MENSAJE_GALERIA_OCUPADA = 'La galería está ocupada. Intenta de nuevo.';

module.exports = {
  MAX_IMAGENES_GALERIA,
  MENSAJE_GALERIA_LLENA,
  MENSAJE_GALERIA_OCUPADA,
};
