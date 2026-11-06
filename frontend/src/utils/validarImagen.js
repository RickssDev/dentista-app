
export const MAX_IMAGEN_BYTES = 6 * 1024 * 1024;

export const formatearPeso = (bytes) =>
  `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

export const validarImagen = (archivo) => {
  if (!archivo) return "";

  if (!archivo.type.startsWith("image/")) {
    return "Selecciona un archivo de imagen válido.";
  }

  if (archivo.size > MAX_IMAGEN_BYTES) {
    return `La imagen pesa ${formatearPeso(archivo.size)}. El máximo permitido es 6 MB. Selecciona otra imagen.`;
  }

  return "";
};
