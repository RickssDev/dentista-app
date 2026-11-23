---
status: inferred
updated: 2026-11-08
---

# Arquitectura de Dentissa

## Resumen
Monorepo de dos paquetes npm independientes, sin workspaces. `backend/` es un monolito modular en
Express 5 (CommonJS), organizado por dominio y con capas routes → controller → service →
repository sobre MySQL con SQL manual. `frontend/` es una SPA en React 19 con Vite, organizada por
tipo de archivo. Las seis páginas públicas se prerenderizan en el build (ADR 0009, spec 022):
`npm run build` hace el build del cliente, un segundo build con `--ssr` y `scripts/prerender.mjs`,
que escribe un HTML por página, `404.html`, `login.html` (el login ya pintado, con `noindex`;
ADR 0010, spec 023), `app.html` (armazón con `noindex` para el resto de rutas privadas),
`robots.txt` y `sitemap.xml`; en el navegador se hidratan. El login, el panel, el portal y
restablecer contraseña se cargan bajo demanda (`lazy()`), y unas guardas del build
(`src/seo/guardas.js`) impiden que su código, servicios externos o datos de sesión acaben en las
páginas públicas. En producción, nginx sirve cada página por su ruta, `login.html` a `/login`,
`app.html` al resto de privadas, un 404 real a lo demás, comprime el texto, guarda en caché un año
los archivos con huella de `/assets/` y hace de proxy hacia la API, lo que deja a ambos en el mismo
origen.

## Diagrama de componentes
```mermaid
flowchart LR
  U[Navegador] --> CF[Cloudflare]
  CF --> Caddy[Caddy TLS]
  Caddy --> Nginx[nginx: SPA + proxy]
  Nginx -->|/api y /uploads| App
  subgraph BE[backend Express 5]
    App[app.js: helmet, cors, json] --> Router[routes/index.js]
    Router --> Mw[verifyToken, authorizeRoles, rateLimiters]
    Mw --> Ctrl[controller] --> Srv[service] --> Repo[repository SQL]
    Srv --> Ext[services: email, whatsapp]
    Cron[reminder.service cada minuto] --> Repo
    Cron --> Ext
  end
  Repo --> DB[(MySQL 8)]
  Ext --> Resend[Resend]
  Ext --> WA[WhatsApp Cloud API]
  Srv --> G[Google OAuth]
  U -.->|Google Sign-In| G
```

## Módulos
| Módulo | Ruta | Responsabilidad | Depende de |
|---|---|---|---|
| auth | `backend/src/modules/auth` | Registro, login, Google, contraseñas | pacientes.repository, email |
| users | `backend/src/modules/users` | CRUD de usuarios y personal; valida campos permitidos y protege al último Administrador activo (spec 021) | utils, auth.service (validación de contraseña) |
| citas | `backend/src/modules/citas` | Citas de paciente y personal | servicios.repository, pacientes.repository, whatsapp |
| pacientes | `backend/src/modules/pacientes` | Perfil del paciente | — |
| historial | `backend/src/modules/historial` | Historial clínico y alta de pacientes | db |
| reportes | `backend/src/modules/reportes` | Reportes y exportación Excel/PDF | exceljs, pdfkit |
| dashboard | `backend/src/modules/dashboard` | Resumen del panel | — |
| servicios | `backend/src/modules/servicios` | Catálogo de servicios | utils/upload |
| promocion | `backend/src/modules/promocion` | Promociones | utils/upload |
| images | `backend/src/modules/images` | Galería | utils/upload |
| comentarios | `backend/src/modules/comentarios` | Reseñas y moderación | citas.repository |
| faqs | `backend/src/modules/faqs` | Preguntas frecuentes | — |
| Transversal | `backend/src/{config,middlewares,utils,services}` | Pool, auth, errores, correo, WhatsApp, cron | — |
| SPA | `frontend/src` | Sitio público (prerenderizado), panel y portal del paciente | API `/api/v1` |
| SEO y prerender | `frontend/src/seo`, `frontend/src/entry-prerender.jsx`, `frontend/scripts/prerender.mjs` | Metadatos por ruta, robots, sitemap, JSON-LD, HTML de las páginas públicas y del login, precargas de la fuente y la foto principal, y guardas del build | `src/data/site.js`, `App.jsx` (`AppRoutes`) |

## Flujo principal
Un paciente agenda una cita: `InicioPaciente` llama a `services/api.js`, que envía el JWT de
`localStorage` a `POST /api/v1/citas/paciente`. Pasa por nginx y `verifyToken`; `citas.controller`
delega en `citas.service`, que valida fecha y traslapes por duración del servicio, y
`citas.repository` inserta con SQL parametrizado. Después se intenta la confirmación por WhatsApp
sin afectar la respuesta. Los errores llegan a `errorHandler` como `AppError`.

## Datos
MySQL 8 con `mysql2/promise` y pool único (`config/db.js`), sin ORM; transacciones manuales en
`auth` e `historial`. **El esquema no está versionado:** se crea y cambia directamente en MySQL
(confirmado por el usuario, 2026-11-08) y `*.sql` está en `.gitignore`. Tablas observadas: `usuarios`,
`roles`, `paciente`, `citas`, `servicio`, `h_clinico`, `promocion`, `comentarios`, `pregunta`,
`imagenes`, `restablecimiento_contrasenas`. Imágenes en disco (`uploads/`, bind mount).
Los campos completos son inferidos de las consultas.

## Integraciones externas
- **Google Sign-In:** `@react-oauth/google` solo en el login, montado cuando la página ya está
  pintada (spec 023); `verifyIdToken` en el servidor.
- **WhatsApp Cloud API** (Graph v25.0): apagada en producción con `WHATSAPP_ENABLED=false` porque
  no se paga plan de mensajería (confirmado por el usuario, 2026-11-08).
- **Resend:** correo transaccional.
- **Cloudflare:** delante del sitio (cabecera `Server: cloudflare`, 2026-11-08).
- Google Maps en `/contacto`, solo cuando el visitante pulsa "Ver mapa" (spec 023). Las fuentes
  (`@fontsource-variable`) y las fotos se sirven desde el propio sitio.

## Frontend
- Componentes y organización: `src/{pages,components,services,api,hooks,utils,data,styles}`;
  páginas separadas por rol en `pages/admin` y `pages/paciente`.
- Estado: local con hooks; sin Context, Redux ni Zustand.
- Routing: `BrowserRouter`, con `React.lazy` en las públicas; guarda `PrivateRoute` en `App.jsx`.
- Design tokens / sistema de diseño: [design/system.md](design/system.md).
- Accesibilidad: objetivo WCAG 2.1 AA (constitución P16).
- Cabeceras de seguridad (spec 024): nginx añade, a todo lo que sirve él mismo, una política de
  contenido (CSP), protección contra marcos, `nosniff`, política de referencia, permisos y HSTS,
  desde `frontend/nginx-seguridad.conf`. El archivo se incluye en cada `location` de `nginx.conf`,
  porque un `add_header` dentro de una `location` anula los del `server`. No se incluye en `/api/`
  ni en `/uploads/`: Express ya manda las suyas (helmet).
  - La CSP es una sola para todo el sitio, porque la SPA cambia de página sin recargar. Permite el
    propio sitio, Google Sign-In (`accounts.google.com/gsi/`) y el mapa de Google.
  - **Un servicio externo nuevo** (script, marco, imagen u origen de `VITE_ASSETS_URL`) exige
    añadirlo a `nginx-seguridad.conf` y a `tests/seguridad-cabeceras.test.js`;
    `tests/seguridad-recursos.test.js` falla si el código usa una URL externa que no esté en su
    lista ni en la CSP.
  - Una `location` nueva debe incluir el archivo; lo comprueba `seguridad-cabeceras.test.js`.
- Contenedor del frontend sin root (spec 025): nginx corre como `nginx` (uid 101) en el puerto 80,
  con solo la capacidad `cap_net_bind_service` sobre su binario (`setcap` se instala y se retira en
  la misma capa). El pid está en `/tmp` y `/var/cache/nginx` es de `nginx`; las páginas y la
  configuración siguen siendo de root, de solo lectura para el servicio.
  - Las imágenes base van con etiqueta exacta y digest (`node` y `nginx`). Se suben con `/chore`
    cuando `trivy image` marque una vulnerabilidad alta o crítica; mientras la imagen fijada no
    traiga una corrección, el paquete se actualiza en el build (hoy, `libxml2`).
  - Lo comprueban `tests/imagen-contenedor.test.js` (versiones, `USER`, puerto) y
    `scripts/probar-nginx.mjs` (procesos, escrituras, capacidades, `setcap`, `libxml2`).

## Backend
- Contratos de API: TODO(init): no hay OpenAPI; el contrato es implícito en `routes/` y `normalize.js`.
- Autenticación y autorización: JWT HS256 en `Authorization: Bearer`; `verifyToken` consulta el
  usuario en cada petición; `authorizeRoles` aplica el rol. Roles: Administrador, Asistente, Paciente.
- Observabilidad: solo `console.*`; ver [observability.md](observability.md).
- Seguridad: ver [security.md](security.md).

## Contrato entre capas
- Fuente de verdad: no hay esquema ni tipos compartidos. REST/JSON bajo `/api/v1`, con respuestas
  `{success, message, payload}` adaptadas en `frontend/src/api/normalize.js`.
- Versionado: prefijo `/api/v1`.
- Cómo se regenera: no aplica.

## Pruebas
`npm test` en la raíz ejecuta ambas suites ([ADR 0004](adr/0004-herramientas-de-pruebas.md)). El backend usa Jest y Supertest sobre la API real, con la base de datos simulada en memoria (`backend/tests/support/fake-db.js`): el SQL no se ejecuta. El frontend usa Vitest y Testing Library. La suite se niega a correr contra producción y bloquea la red externa.

## Despliegue
Docker Compose en el servidor, con build en sitio, disparado a mano. Sin CI de despliegue ni
staging. Detalle en [deployment.md](deployment.md).

## Evidencia (solo si status=inferred)
| Afirmación | Archivos | Confianza |
|---|---|---|
| Capas por módulo | `backend/src/modules/*`, `backend/src/routes/index.js` | alta |
| SQL manual sin esquema versionado | `backend/src/modules/*/*.repository.js`, `backend/.gitignore` | alta |
| SPA con proxy nginx y páginas públicas prerenderizadas | `frontend/src/App.jsx`, `frontend/nginx.conf`, ADR 0009 | alta |
| Cloudflare y Caddy delante | respuesta de producción, `backend/Caddyfile` | alta |

## Deuda técnica y riesgos observados
- Módulos que importan el repository de otro (`citas.service` → `servicios.repository`).
- 5 errores de lint previos en el backend y 15 problemas en el frontend.
- `backend/src/middlewares/errorHandler.js` tiene funciones duplicadas y anidadas: funciona, pero
  reasigna `module.exports` al manejar un error.
- Validación manual dispersa en services.
- El cron de recordatorios vive en el proceso web.
- Volumen `uploads` declarado y sin usar en `docker-compose.prod.yml`.
- Código muerto: `components/PrivateRoute.jsx`, `sidebarpaciente.jsx`, `ModalAgendarCita.jsx`.
- Roles escritos como texto literal y `ROL_PACIENTE = 3` fijo en `auth.service.js`.
