# Specs

Inventario de funcionalidades. Las specs `inferred` documentan lo que el código **hace hoy** y pasan
a `approved` solo con confirmación del usuario (`/specify NNN --edit`).

En una spec inferida, `[x]` significa "un test existente cubre este criterio" y `[ ]`
"comportamiento observado en el código, sin test". El repo no tiene tests, así que hoy ninguno está marcado.
**HOY NO SE CUMPLE** señala el comportamiento deseado que el código no cumple.

| Spec | Nombre | Dominio | Estado | Confianza |
|---|---|---|---|---|
| [001](001-auth-registro-login/spec.md) | Registro e inicio de sesión | Autenticación y usuarios | inferred | alta |
| [002](002-auth-google/spec.md) | Acceso con Google | Autenticación y usuarios | inferred | alta |
| [003](003-auth-contrasenas/spec.md) | Recuperar y cambiar contraseña | Autenticación y usuarios | inferred | alta |
| [004](004-gestion-usuarios/spec.md) | Gestión de usuarios | Autenticación y usuarios | inferred | alta |
| [005](005-portal-paciente-citas/spec.md) | Citas del paciente | Citas y recordatorios | inferred | alta |
| [006](006-gestion-citas-personal/spec.md) | Gestión de citas por el personal | Citas y recordatorios | inferred | alta |
| [007](007-recordatorios-whatsapp/spec.md) | Avisos y recordatorios por WhatsApp | Citas y recordatorios | inferred | alta |
| [008](008-perfil-paciente/spec.md) | Perfil del paciente | Pacientes e historial | inferred | alta |
| [009](009-historial-clinico/spec.md) | Historial clínico | Pacientes e historial | inferred | alta |
| [010](010-reportes-exportables/spec.md) | Reportes exportables | Pacientes e historial | inferred | alta |
| [011](011-dashboard-resumen/spec.md) | Resumen del panel | Pacientes e historial | inferred | alta |
| [012](012-gestion-servicios/spec.md) | Catálogo de servicios | Contenido y sitio público | inferred | alta |
| [013](013-gestion-promociones/spec.md) | Promociones | Contenido y sitio público | inferred | media |
| [014](014-galeria-imagenes/spec.md) | Galería | Contenido y sitio público | inferred | media |
| [015](015-comentarios-testimonios/spec.md) | Reseñas de pacientes | Contenido y sitio público | inferred | alta |
| [016](016-faqs/spec.md) | Preguntas frecuentes | Contenido y sitio público | inferred | alta |
| [017](017-sitio-publico/spec.md) | Sitio público | Contenido y sitio público | inferred | alta |
| [018](018-base-tests-autenticacion/spec.md) | Base de tests, integración continua y autenticación | Calidad | released | — |
| [021](021-proteccion-cuentas-admin/spec.md) | Protección de las cuentas del personal | Usuarios y permisos | released | — |
| [022](022-sitio-indexable/spec.md) | Sitio indexable | Contenido y sitio público | released (v1.3.0) | — |
| [023](023-rendimiento-sitio/spec.md) | Rendimiento del sitio público y el login | Contenido y sitio público | released (v1.4.0) | — |
| [024](024-cabeceras-seguridad/spec.md) | Protecciones del navegador en todo el sitio | Seguridad | released | — |
| [025](025-frontend-sin-root/spec.md) | Servicio del sitio sin privilegios de administrador | Seguridad | approved | — |

Las pantallas de cada feature están en el inventario de vistas de [docs/design/system.md](../design/system.md).
