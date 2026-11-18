// Páginas públicas que se indexan (spec 022). Esta tabla alimenta el prerender, robots.txt, el
// sitemap y los metadatos al navegar en el cliente. URL canónica y reglas: docs/seo.md.

export const SITIO = "https://sistema.dentissa.app";

// `modulo`: archivo de la página cargada bajo demanda, para enlazar su CSS en el HTML prerenderizado
export const RUTAS_PUBLICAS = [
  {
    ruta: "/",
    titulo: "Dentissa | Odontología Integral",
    descripcion:
      "Odontología integral en Lázaro Cárdenas: odontología general, ortodoncia y estética dental en un solo lugar, con tecnología avanzada y trato cálido.",
  },
  {
    ruta: "/nosotros",
    titulo: "Nosotros | Dentissa Clínica Dental",
    descripcion:
      "Conoce al equipo de Dentissa: especialistas en odontología que te atienden con tecnología moderna, protocolos seguros y trato humano.",
    modulo: "src/pages/About.jsx",
  },
  {
    ruta: "/galeria",
    titulo: "Galería | Dentissa Clínica Dental",
    descripcion:
      "Recorre las instalaciones de Dentissa: consultorios equipados, áreas cómodas y la tecnología con la que cuidamos tu sonrisa.",
    modulo: "src/pages/Gallery.jsx",
  },
  {
    ruta: "/contacto",
    titulo: "Contacto y ubicación | Dentissa Clínica Dental",
    descripcion:
      "Agenda tu cita en Dentissa: escríbenos por WhatsApp, llámanos o visítanos. Atendemos de lunes a sábado en Lázaro Cárdenas, Michoacán.",
    modulo: "src/pages/Contact.jsx",
  },
  {
    ruta: "/aviso-de-privacidad",
    titulo: "Aviso de privacidad | Dentissa",
    descripcion:
      "Aviso de privacidad de Dentissa Clínica Dental: qué datos personales tratamos, para qué los usamos y cómo ejercer tus derechos ARCO.",
    modulo: "src/pages/Legal.jsx",
  },
  {
    ruta: "/terminos-de-servicio",
    titulo: "Términos de servicio | Dentissa",
    descripcion:
      "Términos de servicio de Dentissa Clínica Dental: condiciones para agendar, reprogramar y cancelar citas y para usar este sitio.",
    modulo: "src/pages/Legal.jsx",
  },
];

// Rutas privadas: reciben el armazón de la SPA con noindex y nunca van al sitemap
export const RUTAS_NO_INDEXABLES = ["/login", "/restablecer-contrasena", "/admin", "/paciente"];

// Módulos que no pueden pesar en las páginas públicas: se cargan bajo demanda (spec 023, CA4)
export const MODULOS_PRIVADOS = [
  "src/pages/admin/login.jsx",
  "src/pages/admin/AdminPanel.jsx",
  "src/pages/admin/RestablecerContrasena.jsx",
  "src/pages/paciente/InicioPaciente.jsx",
  "src/pages/paciente/CitasPaciente.jsx",
  "src/pages/paciente/PerfilPaciente.jsx",
  "src/pages/paciente/CompletarPerfil.jsx",
];

// Metadatos fuera de la tabla: los generales son los de index.html; el de la 404 lo usan el
// prerender y la navegación en el cliente
export const TITULO_GENERAL = "Dentissa | Clínica Dental";
export const DESCRIPCION_GENERAL =
  "Odontología integral en Lázaro Cárdenas: odontología general, ortodoncia y estética dental en un solo lugar, con tecnología avanzada y trato cálido.";
export const TITULO_404 = "Página no encontrada | Dentissa";
// Título del login, al cargar (login.html) y al llegar navegando (spec 023)
export const TITULO_LOGIN = "Iniciar sesión | Dentissa";

// URL canónica absoluta, sin barra final salvo la portada
export const canonica = (ruta) => (ruta === "/" ? `${SITIO}/` : `${SITIO}${ruta}`);
