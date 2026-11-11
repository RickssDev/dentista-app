# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y
[SemVer](https://semver.org/lang/es/). Lo mantiene `/release`.

## [Unreleased]

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
