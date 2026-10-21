import { ASSETS_URL } from "./config";

/** Devuelve el primer valor no vacío entre varias llaves posibles (soporta "a.b") */
function pick(obj, keys) {
  for (const key of keys) {
    const value = key.split(".").reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

export function resolveImage(value) {
  if (!value || typeof value !== "string") return undefined;
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) return value;
  return `${ASSETS_URL}/${value.replace(/^\/+/, "")}`;
}

const IMG_KEYS = ["imagen", "imagen_url", "imagenUrl", "url_imagen", "url", "foto", "image", "img", "ruta", "path"];
const id = (o, i) => pick(o, ["id", "_id", "id_servicio", "id_promocion", "id_comentario", "id_faq", "id_imagen"]) ?? i;

export const normalizeServicio = (o, i) => ({
  id: id(o, i),
  nombre: pick(o, ["nombre", "titulo", "name", "servicio"]) ?? "Servicio",
  descripcion: pick(o, ["descripcion", "description", "detalle", "resumen"]) ?? "",
  imagen: resolveImage(pick(o, IMG_KEYS)),
  precio: pick(o, ["precio", "costo", "price"]),
  duracion: pick(o, ["duracion", "duracion_minutos", "tiempo"]),
});

export const normalizePromocion = (o, i) => ({
  id: id(o, i),
  titulo: pick(o, ["titulo", "nombre", "title"]) ?? "Promoción",
  descripcion: pick(o, ["descripcion", "description", "detalle"]) ?? "",
  descuento: pick(o, ["descuento", "porcentaje", "porcentaje_descuento", "discount"]),
  precio: pick(o, ["precio_promocion", "precio", "precio_final"]),
  vigencia: pick(o, ["fecha_fin", "vigencia", "fechaFin", "fin", "valido_hasta"]),
  imagen: resolveImage(pick(o, IMG_KEYS)),
});

export const normalizeComentario = (o, i) => {
  const texto = pick(o, ["comentario", "contenido", "texto", "mensaje", "descripcion", "opinion"]);
  if (!texto) return null;
  const rating = Number(pick(o, ["calificacion", "rating", "estrellas", "puntuacion"]));
  return {
    id: id(o, i),
    autor: pick(o, ["nombre", "nombre_paciente", "autor", "usuario", "paciente.nombre", "usuario.nombre", "cliente"]) ?? "Paciente",
    texto,
    rating: Number.isFinite(rating) && rating > 0 ? Math.min(5, Math.round(rating)) : 5,
    fecha: pick(o, ["fecha", "created_at", "createdAt", "fecha_creacion"]),
  };
};

export const normalizeFaq = (o, i) => {
  const pregunta = pick(o, ["pregunta", "question", "titulo"]);
  const respuesta = pick(o, ["respuesta", "answer", "descripcion"]);
  return pregunta && respuesta ? { id: id(o, i), pregunta, respuesta } : null;
};

export const normalizeImagen = (o, i) => {
  const url = resolveImage(pick(o, IMG_KEYS));
  if (!url) return null;
  return {
    id: id(o, i),
    url,
    titulo: pick(o, ["titulo", "nombre", "title", "alt"]) ?? "",
    descripcion: pick(o, ["descripcion", "description"]) ?? "",
    categoria: pick(o, ["categoria", "category", "tipo", "seccion"]) ?? "",
  };
};

export const normalizeCertificacion = (o, i) => ({
  id: id(o, i),
  nombre: pick(o, ["nombre", "titulo", "title"]) ?? "Certificación",
  institucion: pick(o, ["institucion", "emisor", "organizacion", "entidad"]) ?? "",
  anio: pick(o, ["anio", "año", "year", "fecha"]),
  imagen: resolveImage(pick(o, IMG_KEYS)),
});

export function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}

export function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

export const normalizar = (texto = "") =>
  texto
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
