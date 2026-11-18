// Información fija de la clínica. Edita aquí y se actualiza en todo el sitio.

// Dirección por partes, para los buscadores (spec 022). Ciudad y estado confirmados por el usuario
// (2026-11-18); calle y código postal pendientes: vacíos, no se muestran ni se publican
const DIRECCION = {
  calle: "",
  ciudad: "Lázaro Cárdenas",
  estado: "Michoacán",
  codigoPostal: "",
  pais: "MX",
};

// "Calle, Ciudad, Estado, CP 00000" con las partes que existan
const direccionCompleta = ({ calle, ciudad, estado, codigoPostal }) =>
  [calle, ciudad, estado, codigoPostal && `CP ${codigoPostal}`].filter(Boolean).join(", ");

export const CLINIC = {
  name: "Dentissa",
  tagline:
    "Cuidando de tu sonrisa con tecnología avanzada, especialistas dedicados y un ambiente cómodo para toda la familia.",
  direccion: DIRECCION,
  address: direccionCompleta(DIRECCION),
  phone: "+52 55 1234 5678",
  phoneHref: "tel:+525512345678",
  whatsapp: "525512345678", // solo dígitos, con lada de país
  email: "contacto@dentissa.com",
  mapQuery: direccionCompleta(DIRECCION),
  social: {
    facebook: "https://facebook.com/dentissa",
    instagram: "https://instagram.com/dentissa",
  },
};

export const HOURS = [
  { day: "Lunes - Viernes", time: "8:00 AM - 4:00 PM" },
  { day: "Sábado", time: "8:00 AM - 2:00 PM" },
  { day: "Domingo", time: "Cerrado", closed: true },
];

export const NAV_LINKS = [
  { to: "/", label: "Inicio", footer: "Inicio" },
  { to: "/nosotros", label: "Nosotros", footer: "Acerca de Nosotros" },
  { to: "/galeria", label: "Galería", footer: "Galería de Fotos" },
  { to: "/contacto", label: "Contacto", footer: "Contacto y Ubicación" },
];

export const VALUES = [
  { icon: "heart", title: "Trato humano", text: "Te escuchamos y explicamos cada paso para que te sientas tranquilo." },
  { icon: "shield", title: "Seguridad", text: "Protocolos de esterilización rigurosos y materiales certificados." },
  { icon: "sparkle", title: "Innovación", text: "Equipos digitales que hacen los tratamientos más precisos y cómodos." },
  { icon: "users", title: "Para toda la familia", text: "Atención para niños, adultos y adultos mayores en un mismo lugar." },
];

// Reemplaza con tu equipo real. "foto" es opcional: sin foto se muestran iniciales.
export const TEAM = [
  { name: "Dra. Mariana López", role: "Directora · Odontología General", foto: "" },
  { name: "Dr. Andrés Ramírez", role: "Ortodoncista", foto: "" },
  { name: "Dra. Sofía Hernández", role: "Estética Dental", foto: "" },
  { name: "Dr. Luis Castillo", role: "Endodoncista", foto: "" },
];

export const STATS = [
  { value: "+10", label: "Años de experiencia" },
  { value: "+5k", label: "Pacientes atendidos" },
  { value: "4", label: "Especialidades" },
];

export const IMAGES = {
  hero: "/images/hero-dentissa.webp",
  // Foto de nosotros: banco de imágenes (licencia Unsplash), alojada en el sitio en WebP (spec 023)
  about: "/images/nosotros-900.webp",
  aboutSrcSet: "/images/nosotros-600.webp 600w, /images/nosotros-900.webp 900w, /images/nosotros-1200.webp 1200w",
};

export const whatsappLink = (text = "Hola, me gustaría agendar una cita en Dentissa.") =>
  `https://wa.me/${CLINIC.whatsapp}?text=${encodeURIComponent(text)}`;

export const mapEmbedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(CLINIC.mapQuery)}&z=16&output=embed`;
export const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CLINIC.mapQuery)}`;
