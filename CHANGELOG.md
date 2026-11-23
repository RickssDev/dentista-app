# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y
[SemVer](https://semver.org/lang/es/). Lo mantiene `/release`.

## [Unreleased]

## [1.6.0] - 2026-11-23
### Security
- Los registros técnicos del servidor ya no guardan teléfonos, correos, nombres, contraseñas, tokens ni enlaces de recuperación de contraseña, tampoco cuando falla un envío por WhatsApp o por correo ni cuando falla la base de datos (spec 026).

### Changed
- Cada respuesta del servidor lleva un identificador de petición (`X-Request-Id`), y todos los registros de esa petición, y de cada ejecución de los recordatorios, lo llevan también. Así, ante un error que reporte alguien, se pueden encontrar todos sus registros (spec 026).
- Los registros del servidor son una línea JSON por mensaje, con nivel, fecha y quién hizo la petición, y cada petición deja una sola línea con su resultado y su duración (spec 026).

## [1.5.0] - 2026-11-22
### Security
- El navegador protege a quien visita el sitio: solo ejecuta el código del propio sitio y el inicio de sesión de Google, no deja mostrar el sitio dentro de páginas ajenas (evita que engañen a alguien para pulsar donde no quiere) y siempre usa la conexión segura (spec 024).

## [1.4.1] - 2026-11-18
### Changed
- La clínica aparece en Lázaro Cárdenas, Michoacán, en contacto, el pie de página, el aviso de privacidad, el mapa y los datos que leen los buscadores; se retiró la dirección de ejemplo de Ciudad de México (chore 2026-11-18-chore-ubicacion-y-titulo).
- La portada se presenta en buscadores y al compartir como "Dentissa | Odontología Integral", con una descripción nueva (chore 2026-11-18-chore-ubicacion-y-titulo).

## [1.4.0] - 2026-11-17
### Changed
- Las páginas públicas y el inicio de sesión se muestran antes en el celular: la foto y el texto principales aparecen sin esperar a que cargue toda la aplicación, y la página no salta mientras termina de cargar (spec 023).
- En contacto, el mapa se carga al pulsar "Ver mapa"; mientras tanto se ven la dirección y el botón "Cómo llegar" (spec 023).
- El botón de Google del inicio de sesión aparece cuando la página ya está lista, y el resto del sitio no carga nada de Google (spec 023).
- La galería avisa a los lectores de pantalla cuando no puede cargar o aún no tiene fotos, y al reintentar no se pierde el foco (spec 023).

### Fixed
- El botón "Continuar con Google" funciona en cualquier instalación nueva del sitio, no solo en la actual (fix 2026-11-17-fix-dockerfile-google-client-id).

## [1.3.0] - 2026-11-13
### Added
- Las páginas públicas (inicio, nosotros, galería, contacto, aviso de privacidad y términos) llegan a los buscadores con su contenido, título y descripción propios, aunque el buscador no ejecute JavaScript (spec 022).
- La portada indica a los buscadores el nombre, la dirección, el teléfono y el horario de la clínica, y el sitio publica su mapa y las instrucciones para buscadores (spec 022).
- Al compartir un enlace del sitio se ve una vista previa con la imagen y el texto de la página, y el sitio tiene íconos para navegadores y teléfonos (spec 022).

### Changed
- Una dirección que no existe muestra "Página no encontrada" y el título de la pestaña lo indica; las direcciones con barra final llevan a la misma página sin la barra (spec 022).
- El inicio de sesión, el restablecimiento de contraseña y los paneles quedan fuera de los buscadores (spec 022).

## [1.2.0] - 2026-11-12
### Added
- La clínica nunca se queda sin quien gestione el sistema: no se puede eliminar, desactivar ni quitar el rol al último Administrador activo, aunque lo intente él mismo o dos Administradores lo hagan al mismo tiempo (spec 021).

### Changed
- Al crear o editar una cuenta desde el panel, los datos inválidos (rol o estado que no existen, correo mal escrito o ya usado por otra cuenta, contraseña fuera de las reglas del registro) reciben un aviso claro en lugar de un error; las cuentas antiguas se siguen pudiendo editar (spec 021).
- El aviso de "No se pudo eliminar" muestra el motivo real, y los mensajes de los diálogos de confirmación del panel se anuncian a los lectores de pantalla (spec 021).

### Security
- Las cuentas solo aceptan sus propios campos: el resto de lo enviado se ignora y la foto solo puede llegar como archivo subido (spec 021).

## [1.1.1] - 2026-11-11
### Fixed
- Nadie puede agendar ni reprogramar citas fuera del horario de atención (lunes a viernes de 8:00 a 16:00, sábado de 8:00 a 14:00, domingo cerrado), ni pacientes ni personal, aunque se llame directamente al sistema (fix 2026-11-10-horario-cita-paciente, fix 2026-11-11-horario-cita-personal).
- Reprogramar una cita cambiando solo la hora ya detecta si la fecha está en el pasado (fix 2026-11-11-horario-cita-personal).
- En "Mi perfil", dejar el género en "Seleccionar..." ya no produce un error al guardar (fix 2026-11-10-tipos-entrada-paciente).
- Datos con formato inválido en el registro, el cambio de contraseña, el perfil del paciente, las reseñas y las citas reciben un aviso claro en lugar de un error del servidor (fix 2026-11-10-registro-campos-no-texto, fix 2026-11-10-cambiar-contrasena-tipos, fix 2026-11-10-tipos-entrada-paciente).

### Removed
- Las citas ya no se pueden eliminar; solo se cancelan, lo que conserva su historial. La opción no se usaba en la web (fix 2026-11-10-retirar-eliminar-cita).

## [1.1.0] - 2026-11-09
### Added
- Flujo de desarrollo guiado por specs (ai-dd): constitución, arquitectura, specs inferidas y validación en PR.
- Pruebas automatizadas de autenticación, comando único `npm test` y su ejecución en cada PR (spec 018).

### Fixed
- Iniciar sesión sin contraseña ya no produce un error del servidor (fix 2026-11-09-login-sin-contrasena).
- Subir un archivo que no es imagen indica el motivo en lugar de un error del servidor (fix 2026-11-09-subida-no-imagen).
- Los avisos por WhatsApp vuelven a enviarse cuando están activados (fix 2026-11-09-whatsapp-axios).
- Solo el Administrador gestiona usuarios y roles (fix 2026-11-09-permisos-asistente).
- Con WhatsApp desactivado, las citas ya no se marcan como recordadas (fix 2026-11-09-recordatorios-apagado).
- El agendado y el sitio usan el horario de la clínica: lunes a viernes de 8:00 a 16:00, sábado de 8:00 a 14:00 y domingo cerrado (fix 2026-11-09-horario-sitio).

### Security
- Actualización de dependencias con vulnerabilidades críticas y altas conocidas en backend y frontend (chore 2026-11-09-dependencias-vulnerables).
- Los límites de intentos de inicio de sesión identifican al cliente real detrás del túnel (chore 2026-11-09-trust-proxy).
