# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y
[SemVer](https://semver.org/lang/es/). Lo mantiene `/release`.

## [Unreleased]

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
