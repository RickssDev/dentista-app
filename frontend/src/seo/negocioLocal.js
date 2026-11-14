// Datos de la clínica para los buscadores, como JSON-LD de tipo Dentist (spec 022, CA7).
// Salen de site.js: lo que se muestra en el sitio y lo que leen los buscadores es lo mismo.
import { CLINIC, HOURS } from "../data/site.js";
import { SITIO } from "./rutas.js";

const DIAS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const NOMBRES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

const indiceDia = (nombre) => {
  const indice = NOMBRES.indexOf(nombre.trim().toLowerCase());
  if (indice === -1) throw new Error(`No se puede interpretar el día del horario: "${nombre}"`);
  return indice;
};

// "Lunes - Viernes" → [Monday … Friday]; "Sábado" → [Saturday]
const diasDe = (texto) => {
  const [desde, hasta = desde] = texto.split("-");
  const inicio = indiceDia(desde);
  const fin = indiceDia(hasta);
  if (fin < inicio) throw new Error(`No se puede interpretar el rango de días del horario: "${texto}"`);
  return DIAS.slice(inicio, fin + 1);
};

// "8:00 AM" → "08:00"
const hora24 = (hora, minutos, periodo) => {
  let h = Number(hora) % 12;
  if (periodo.toUpperCase() === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${minutos}`;
};

const FORMATO_HORARIO = /^(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

// Un horario que no se entiende detiene el build: mejor eso que publicar uno equivocado
export const horarioDeApertura = (horas = HOURS) =>
  horas
    .filter((h) => !h.closed)
    .map(({ day, time }) => {
      const partes = time.trim().match(FORMATO_HORARIO);
      if (!partes) throw new Error(`No se puede interpretar el horario de "${day}": "${time}"`);
      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: diasDe(day),
        opens: hora24(partes[1], partes[2], partes[3]),
        closes: hora24(partes[4], partes[5], partes[6]),
      };
    });

export const generarNegocioLocal = (clinica = CLINIC, horas = HOURS) => ({
  "@context": "https://schema.org",
  "@type": "Dentist",
  name: clinica.name,
  url: `${SITIO}/`,
  image: `${SITIO}/og-dentissa.jpg`,
  telephone: clinica.phone,
  email: clinica.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: clinica.direccion.calle,
    addressLocality: clinica.direccion.ciudad,
    addressRegion: clinica.direccion.estado,
    postalCode: clinica.direccion.codigoPostal,
    addressCountry: clinica.direccion.pais,
  },
  openingHoursSpecification: horarioDeApertura(horas),
  sameAs: Object.values(clinica.social || {}),
});

// Escapa "<" para que ningún dato pueda cerrar la etiqueta <script> (TM3)
export const serializarJsonLd = (datos) => JSON.stringify(datos).replace(/</g, "\\u003c");
