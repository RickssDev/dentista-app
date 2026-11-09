---
status: inferred
updated: 2026-11-08
---

# Seguridad de Dentissa

## Referencias
- OWASP Top 10: edición 2025 (la vigente al inicializar; actualizar al cambiar de edición)
- Nivel ASVS objetivo: 2 (decisión del usuario, 2026-11-08)
- Adicionales: ninguno
- Compliance: LFPDPPP y NOM-004-SSA3-2012 (decisión del usuario, 2026-11-08; confirmar alcance con asesoría legal)

## Clasificación de datos
| Dato | Clasificación | Dónde vive | Protección |
|---|---|---|---|
| Historial clínico: diagnóstico, observaciones | restringida | MySQL `h_clinico` | Roles en la API; sin cifrado de aplicación |
| Datos de paciente: dirección, nacimiento, género | restringida | MySQL `paciente` | Roles en la API; sin cifrado de aplicación |
| Nombre, correo, teléfono | confidencial | MySQL `usuarios` | Roles en la API |
| Contraseñas | restringida | MySQL `usuarios` | bcrypt, 10 rondas |
| Token de recuperación | restringida | MySQL `restablecimiento_contrasenas` | Solo hash SHA-256, caduca en 15 min |
| JWT de sesión | restringida | `localStorage` del navegador | Expiración; ver RS2 |
| Citas y motivo | confidencial | MySQL `citas` | Roles en la API |
| Reportes Excel/PDF | confidencial | Generados bajo demanda | Solo personal |
| Imágenes de servicios, galería y usuarios | interna | Disco `uploads/`, público | Sin autenticación |

## Autenticación y autorización
- Mecanismo de autenticación: JWT HS256 (`Authorization: Bearer`), expiración `JWT_EXPIRES_IN` (1 día por defecto); contraseña con bcrypt; Google Sign-In con `verifyIdToken`.
- Modelo de autorización: roles Administrador, Asistente y Paciente. Solo el Administrador debe gestionar usuarios y roles (decisión del usuario, 2026-11-08); hoy no se cumple (RS1).
- Dónde se aplica: middlewares `verifyToken` y `authorizeRoles` por ruta; propiedad del recurso en los services (`obtenerCitaPropia`).

## Superficie de ataque
| Punto de entrada | Tipo | Autenticado | Notas |
|---|---|---|---|
| `POST /auth/*` | HTTP público | no | Limitadores por IP; ver RS4 |
| `GET /servicios/publicos`, `/promociones/publicos`, `/imagenes/publicas`, `/comentarios/publicos`, `/faqs` | HTTP público | no | Solo lectura |
| `GET /uploads/*` | Estático público | no | Ver RS5 |
| `/citas/*`, `/pacientes/*`, `/comentarios` | HTTP | sí | Propiedad verificada en services |
| `/usuarios`, `/historial`, `/reportes`, `/dashboard` y escritura de contenido | HTTP | personal | Ver RS1 |
| Cron de recordatorios | Tarea interna | — | Cada minuto |

## Manejo de secretos
- Dónde se guardan: `backend/.env` y `backend/.env.prod`, ignorados por git. Sin gestor de secretos.
- Rotación: TODO(init): no hay procedimiento definido.

## Herramientas
| Tipo | Herramienta | Comando | Estado | Cuándo corre |
|---|---|---|---|---|
| Secretos | gitleaks | `gitleaks git --no-banner` | en-ci | /implement, CI |
| SAST | — | — | no-aplica (el usuario no lo adoptó, 2026-11-08) | — |
| SCA (dependencias) | npm audit | `npm audit --audit-level=high` en cada paquete | en-ci | /review, /release, CI |
| Contenedores / IaC | trivy | `trivy fs --scanners vuln,misconfig .` | en-ci | /review, /release, CI semanal |
| DAST | — | — | no-aplica (no hay staging) | — |

`helmet` está activo en la API. Las herramientas `en-ci` corren cuando el workflow se integre.

Ninguna herramienta envía código ni metadatos a un servicio no aprobado abajo.

## Permisos del agente
Reglas base en `shared/agent-security.md` del plugin. Específicas de este proyecto:
- Antigüedad mínima de paquetes nuevos: 7 días
- Rutas protegidas adicionales: `backend/docker-compose.prod.yml`, `backend/Dockerfile.prod`, `backend/Caddyfile`, `frontend/nginx.conf`, `frontend/Dockerfile`
- Servicios externos aprobados para enviar código o datos: ninguno
- Dominios de red que el agente necesita: `registry.npmjs.org`

## Excepciones aceptadas
| ID | Hallazgo | Severidad | Motivo | Aprobado por | Vence |
|---|---|---|---|---|---|

## Riesgos conocidos

### RS1 · Alta — El Asistente puede administrar cuentas y roles (A01 Broken Access Control)
Las rutas `/usuarios` admiten a Asistente, y `createUsuario` y `updateUsuario` reciben el cuerpo
completo, incluidos `id_rol` y `password`. Un Asistente puede crear Administradores, cambiar roles
y restablecer la contraseña de cualquier cuenta. Debe ser exclusivo del Administrador (decisión del usuario, 2026-11-08). Atendido por el objetivo 1 de [roadmap](roadmap.md).

Correcciones:
- RS1.a Restringir las rutas de `/usuarios` al rol Administrador — estado: pendiente
- RS1.b Limitar con lista de campos permitidos lo que aceptan alta y edición — estado: pendiente
- RS1.c Impedir que se elimine o degrade al último Administrador — estado: pendiente
- RS1.d Cubrir con tests de autorización cada rol y ruta — estado: pendiente

### RS2 · Media — Sesión en `localStorage` sin revocación (A07 Authentication Failures)
El JWT se guarda en `localStorage`, expuesto ante un XSS, y sigue válido hasta caducar: no hay
logout en el servidor. `verifyToken` sí rechaza cuentas inactivas.

Correcciones:
- RS2.a Mover la sesión a cookie HttpOnly o reducir la vida del token con renovación — estado: pendiente
- RS2.b Revocar sesiones en el servidor al cerrar sesión y al cambiar contraseña — estado: pendiente

### RS3 · Alta — Dependencias con vulnerabilidades conocidas (A03 Software Supply Chain Failures)
`npm audit` (2026-11-08): backend 1 crítica, 10 altas, 3 moderadas; frontend 10 altas, 2
moderadas, 2 bajas. Hay corrección disponible para todas las críticas y altas. Bloquea `/release` (P11).

Correcciones:
- RS3.a Actualizar las dependencias del backend hasta cero críticas y altas — estado: pendiente
- RS3.b Actualizar las dependencias del frontend hasta cero críticas y altas — estado: pendiente

### RS4 · Alta — Los limitadores no identifican al cliente real (A07 Authentication Failures)
`TRUST_PROXY=1` (confirmado por el usuario, 2026-11-08), pero delante de Express hay más de un
proxy (Cloudflare, Caddy, nginx). `req.ip` no es el cliente: los límites de login se comparten
entre usuarios o no frenan a un atacante. Además viven en memoria y se reinician con el proceso.

Correcciones:
- RS4.a Fijar `TRUST_PROXY` según la cadena real o tomar la IP de una cabecera confiable — estado: pendiente
- RS4.b Comprobar con un test que `req.ip` es el cliente detrás de la cadena — estado: pendiente
- RS4.c Persistir los contadores en un almacén compartido — estado: pendiente

### RS5 · Media — Subida de archivos confía en el cliente (A06 Insecure Design)
`upload.js` valida el `mimetype` que declara el cliente y conserva la extensión original; los
archivos se sirven en el mismo origen. Solo el personal puede subirlos.

Correcciones:
- RS5.a Validar el contenido real y una lista de extensiones permitidas — estado: pendiente
- RS5.b Servir `/uploads` con `X-Content-Type-Options: nosniff` y sin contenido activo — estado: pendiente

### RS6 · Media — HTML sin cabeceras de seguridad (A02 Security Misconfiguration)
Las respuestas de producción no incluyen CSP, HSTS, `X-Frame-Options` ni
`X-Content-Type-Options` (comprobado el 2026-11-08). `helmet` solo cubre la API.

Correcciones:
- RS6.a Añadir las cabeceras en nginx o Caddy — estado: pendiente
- RS6.b Definir una CSP compatible con Google Sign-In y las fuentes — estado: pendiente

### RS7 · Media — Sin límite de peticiones general (A06 Insecure Design)
Solo las rutas de autenticación tienen limitador.

Correcciones:
- RS7.a Añadir un limitador general en la API — estado: pendiente

### RS8 · Media — Enumeración de cuentas (A07 Authentication Failures)
Registro, login y Google revelan si un correo existe ("El correo ya está registrado", "Esta cuenta
usa Google", 404 en Google login). La recuperación de contraseña sí responde de forma genérica.

Correcciones:
- RS8.a Unificar las respuestas o limitar lo que revelan — estado: pendiente

### RS9 · Baja — Guarda del frontend sin rol (A01 Broken Access Control)
`PrivateRoute` solo comprueba que exista un token: un paciente puede abrir el panel vacío. La API
rechaza sus peticiones.

Correcciones:
- RS9.a Comprobar el rol en la guarda del frontend — estado: pendiente

## Por confirmar
- Cifrado en reposo del disco de MySQL y de los respaldos — depende del servidor.
- Longitud y aleatoriedad reales de `JWT_SECRET` — depende de `.env.prod`.
- Política de retención y derechos ARCO sobre datos personales: el código no la implementa — confirmar requisitos con asesoría legal.
- Rotación de secretos — sin procedimiento conocido.
