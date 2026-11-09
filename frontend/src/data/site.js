// Información fija de la clínica. Edita aquí y se actualiza en todo el sitio.

export const CLINIC = {
  name: "Dentissa",
  tagline:
    "Cuidando de tu sonrisa con tecnología avanzada, especialistas dedicados y un ambiente cómodo para toda la familia.",
  address: "Av. Universidad 1200, Colonia Centro, Ciudad de México, CP 03100",
  phone: "+52 55 1234 5678",
  phoneHref: "tel:+525512345678",
  whatsapp: "525512345678", // solo dígitos, con lada de país
  email: "contacto@dentissa.com",
  mapQuery: "Av. Universidad 1200, Ciudad de México, CP 03100",
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
  about: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=900&q=70",
  contact: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=900&q=70",
};

export const whatsappLink = (text = "Hola, me gustaría agendar una cita en Dentissa.") =>
  `https://wa.me/${CLINIC.whatsapp}?text=${encodeURIComponent(text)}`;

export const mapEmbedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(CLINIC.mapQuery)}&z=16&output=embed`;
export const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CLINIC.mapQuery)}`;
