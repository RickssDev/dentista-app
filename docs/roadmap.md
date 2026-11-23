---
updated: 2026-11-23
---

# Roadmap

**Etapa actual:** production

## Objetivos
| # | Objetivo | Criterio de éxito | Spec | Estado |
|---|---|---|---|---|
| 1 | Tests y CI | Framework de tests adoptado con ADR; autenticación, citas, perfil del paciente y portada cubiertos en verde; CI ejecuta validación, lint, build y tests en cada PR. Riesgos: RD8.a, RD8.b, RD8.c | [018](specs/018-base-tests-autenticacion/spec.md), 019 y 020 (previstas) | en curso |
| 2 | Permisos del Asistente | Un Asistente recibe 403 en toda ruta de `/usuarios` y nadie puede asignar un rol sin ser Administrador, con tests por rol. Riesgos: RS1.a, RS1.b, RS1.c, RS1.d | ficha 2026-11-09-fix-permisos-asistente (v1.1.0), [021](specs/021-proteccion-cuentas-admin/spec.md) (v1.2.0) | cumplido |
| 3 | Auditoría y logs | Todo evento obligatorio de `docs/observability.md` queda en la tabla de solo anexado; cada petición devuelve `X-Request-Id`; ningún log contiene datos personales. Riesgos: OB1.a, OB1.b, OB1.c, OB1.d, OB1.e, OB1.f, OB2.a, OB2.b, OB2.c, OB3.a, OB3.b | [026](specs/026-logs-seguros-correlacion/spec.md) (liberada en v1.6.0), 027 y 028 (previstas) | en curso |
| 4 | Sitio indexable | Lighthouse SEO 100 en las 6 rutas públicas; cada ruta pública con HTML propio (prerender), título, descripción, canónica y Open Graph únicos; `robots.txt` y `sitemap.xml` válidos; `noindex` en las rutas privadas; 404 real; datos de la clínica para buscadores. Brechas: SE1.a, SE1.b, SE2.a, SE2.b, SE3.a, SE3.b, SE4.a, SE5.a, SE5.b, SE6.a, SE7.a; fuera: SE7.b (sin logo vectorial, pendiente en `docs/seo.md`) | [022](specs/022-sitio-indexable/spec.md) (v1.3.0) | cumplido |

## Próxima etapa
El proyecto ya está en producción. Pasar a una operación estable requiere cerrar los tres objetivos
y las correcciones pendientes de RS1.

## Pendientes y deuda
Detectados por `/init` y aún sin objetivo; el usuario decide cuáles promover.

**Datos y operación** (propuesto y no elegido como objetivo, 2026-11-08)
- RD1 Esquema sin versionar: RD1.a mitigada en v1.1.0; pendientes RD1.b, RD1.c
- RD2 Respaldos: RD2.a mitigada (cron diario desde 2026-11-18); RD2.b (copias cifradas fuera del servidor) y RD2.c (prueba de restauración) pospuestas por decisión del usuario (2026-11-18)
- RS4 Limitadores detrás de varios proxies: RS4.a y RS4.b mitigadas en v1.1.0; pendiente RS4.c
- RD3 Rollback: RD3.a, RD3.b · RD4 Staging: RD4.a · RD5 Health check: RD5.a (además, `/health` no está publicado en el dominio: nginx no lo enruta y la verificación post-deploy de `deployment.md` lo da por público; detectado en v1.5.0) · RD6 Cron: RD6.a · RD7 Variables: RD7.a

**Seguridad**
- RS3 Dependencias vulnerables: mitigado en v1.1.0 (RS3.a, RS3.b)
- RS2 Sesión: RS2.a, RS2.b · RS5 Subidas: RS5.a, RS5.b · ~~RS6 Cabeceras~~: mitigado por [024](specs/024-cabeceras-seguridad/spec.md) en v1.5.0 (RS6.a, RS6.b); el contenedor del frontend sin root y con imágenes fijadas lo resolvió [025](specs/025-frontend-sin-root/spec.md) en v1.7.0; queda AVD-DS-0002 en `backend/Dockerfile` (desarrollo) hasta 2027-03-31
- RS7 Límite general: RS7.a · RS8 Enumeración: RS8.a · RS9 Guarda con rol: RS9.a

**Observabilidad**
- ~~OB4 Logger~~: mitigado por [026](specs/026-logs-seguros-correlacion/spec.md) en v1.6.0 (OB4.a, OB4.b; también OB2 y OB3) · OB5 Alertas: OB5.a, OB5.b · OB6 Avisos apagados: OB6.a mitigada en v1.1.0

**SEO**
- SE1 a SE7: promovidas al objetivo 4 (Sitio indexable), decisión del usuario 2026-11-12; mitigadas en v1.3.0 salvo SE7.b (sin logo vectorial).
- Cloudflare guarda `robots.txt` y `sitemap.xml` 4 h (`max-age=14400`): tras un despliegue sirve la versión anterior. Propuesta: `/fix` con `Cache-Control` corto en nginx para esos archivos (hallado al liberar v1.3.0).
- ~~`frontend/Dockerfile` no declaraba `ARG VITE_GOOGLE_CLIENT_ID`~~: resuelto en v1.4.0 (ficha 2026-11-17-fix-dockerfile-google-client-id); el servidor ya no necesita el cambio local del `Dockerfile`.
- ~~Rendimiento de la portada~~: resuelto por [023](specs/023-rendimiento-sitio/spec.md) en v1.4.0 (Lighthouse móvil local: 100 en galería, contacto, aviso y términos; 97 en portada y nosotros; 99 en login).

**Deuda de la spec 025** (aceptada en /review, ronda 1)
- 025/R3 El `sed` del `Dockerfile` del frontend no comprueba que quitó `user` y movió `pid`.
- 025/R4 `apk upgrade libxml2` sin versión en el build; la línea sobra cuando la imagen fijada de nginx traiga 2.13.9-r3 o superior (retirar con `/chore`).
- 025/R5 El test de `USER` de `imagen-contenedor.test.js` debe exigir `nginx` y rechazar `$` y el grupo root.
- 025/R6 `fileURLToPath` en `imagen-contenedor.test.js` (la ruta con espacios se rompe).
- 025/R7 Reescribir el parser del `Dockerfile` de `imagen-contenedor.test.js` como bucle explícito, con un caso de prueba.
- 025/R8 Capa propia y comentario claro para `libxml2` en el `Dockerfile`.
- 025/R9 Partir la línea larga de `enContenedor` en `probar-nginx.mjs`.
- 025/R10 La regla de ruta protegida de `tasks.md` de la 025 no menciona T026.
- 025/R11 Al subir las imágenes con `/chore`, comprobar que la etiqueta corresponde al digest (`docker buildx imagetools inspect`).
- 025/R12 Endurecer el servicio frontend del compose de producción (`cap_drop`, `read_only`, tmpfs) **sin** `no-new-privileges`, que anularía la capacidad del puerto 80.
- 025/R13 Quitar `BACKEND_HOST` y `BACKEND_PORT` del compose de producción (sin efecto; con templates, `20-envsubst` no podría escribir sin root).
- AVD-DS-0002 en `backend/Dockerfile` (imagen de desarrollo): excepción hasta 2027-03-31; `/chore` con `USER node`.
- Causa probable de 024/R15: el Chrome de la pasada anterior de `probar-csp.mjs` aún ocupa el puerto 9343 cuando arranca la siguiente (visto en la spec 025, T022); `/fix` que espere a liberar el puerto o use uno libre.

**Deuda de la spec 026** (aceptada en /review, rondas 1 y 2)
- 026/R14 `/health` se registra en `debug` (decisión del plan); alinear el texto de CA8 en la próxima spec que lo toque.
- 026/R16 `server.js` sin manejadores de `unhandledRejection` ni `uncaughtException` que pasen por el logger (previo).
- 026/R17 Regla de no interpolar datos del usuario en los mensajes de `AppError`, o enmascarar valores en el `message` de los 4xx operacionales.
- 026/R19 `resumirError` conserva `message` y `stack` de los errores de red de la base (host y puerto) en «Recordatorio no marcado» y «Aviso de WhatsApp no preparado».
- 026/R21 `redactar` sin tratamiento de `Map` y `Set`, sin tope de claves por objeto y sin recorte del `Error` anidado.
- `dotenv` imprime al arrancar una línea que no es JSON («injecting env»); se silencia con su opción `quiet` (`/chore`).

**Deuda de la spec 024** (aceptada en /review, rondas 1 y 2)
- 024/R3 Extraer a `frontend/scripts/lib/` el cliente CDP y los helpers repetidos de los scripts de medición y comprobación.
- 024/R4 Unificar la ruta de Chrome (`CHROME_PATH` y búsqueda) en `probar-csp.mjs`.
- 024/R5 `probar-csp.mjs`: un solo fallo si no se crea el marco y limpieza de servidor, `ws` y perfil en `finally`.
- 024/R6 Cabeceras de seguridad en las 502/503/504 que genera nginx en `/api/` y `/uploads/`.
- 024/R7 Restringir `frame-src https://www.google.com` a la ruta del mapa.
- 024/R8 Guarda de recursos por directiva y por `origin` en `seguridad-recursos.test.js`.
- 024/R10 `seguridad-recursos.test.js` sin respaldo del plan, nombre del test de `blob:` y `getImageUrl` importada.
- 024/R11 El parser de `location` debe rechazar bloques anidados en `seguridad-cabeceras.test.js`.
- 024/R12 Abuso de `fetch` o `img` en `probar-csp.mjs`; el script es una verificación manual por versión.
- 024/R13 Imágenes con URL absoluta de otro dominio: 0 en producción antes de v1.5.0 (comprobado por el usuario); una nueva dejaría de verse con la CSP.
- 024/R14 Comentario del HSTS frente a helmet (`includeSubDomains` en `/api/`).
- 024/R15 Fallo intermitente sin reproducir de `probar-csp.mjs` (1 de 12); investigar si se repite.
- 024/R16 La comprobación del mapa en `probar-csp.mjs` debe mirar el documento del marco, no solo que exista el `iframe`.
- El marcador `sin-imagen.svg` de `getImageUrl` no se pinta en ninguna pantalla (las listas muestran la inicial o su respaldo); valorar quitarlo con `/refactor`.

**Deuda de la spec 022** (aceptada en /review, ronda 1)
- 022/R12 `/index.html`, `/<ruta>/index.html` y `/app.html` responden 200 (la canónica evita el duplicado).
- 022/R13 Las rutas con mayúsculas (`/Nosotros`) dan 404; documentarlo o redirigirlas.
- 022/R14 La prueba de hidratación no usa el árbol raíz de `main.jsx`.
- 022/R17 Salto a h3 en el footer, logo sin `width`/`height`, `theme-color` fuera de los tokens y `vite.svg` publicado.
- 022/R18 Lógica de `estilosNuevos` repetida y estilos distintos entre los scripts de `frontend/scripts`.
- 022/R21 `probar-nginx.mjs` sin mensaje propio con el puerto ocupado.
- ~~022/R22~~ resuelto por 024 en v1.5.0. Sin cabeceras de seguridad en nginx; `add_header` en la ubicación privada anula las del server (ver RS6).
- 022/R23 Accesibilidad previa: foco al navegar en la SPA, texto del loader y `aria-hidden` del skeleton.

**Deuda de la spec 023** (aceptada en /review, rondas 1 y 2)
- 023/R13 Las páginas públicas `lazy` no pasan por `cargarPagina` (sin recarga ante un chunk viejo).
- 023/R14 Mover `cargarPagina` de `App.jsx` a `src/utils/` (hoy con `eslint-disable`).
- ~~023/R24~~ resuelto por 024 en v1.5.0. Cabeceras de seguridad (CSP, `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`) en nginx; ver RS6 y 022/R22.
- 023/R25 `login.html` sin `<main>` y con dos `h1` (registro e inicio).
- 023/R26 El respaldo de `Suspense` ("Cargando página...") sin `role="status"`.
- 023/R27 Esqueleto de la galería sin `aria-busy` (ver 022/R23).
- 023/R28 "Cómo llegar" abre otra pestaña sin avisarlo.
- 023/R29 "Ver mapa" usa `--bg` como color de texto; falta un token de texto sobre acción principal.
- 023/R30 Robustez de `medir-rendimiento.mjs` y `capturas.mjs` (comillas en `--chrome-flags`, `catch` mudo, espera sin límite, puerto CDP fijo).
- 023/R32 La guarda de hosts prohibidos solo revisa el HTML, no el CSS ni el JS de `dist/assets`.
- 023/R33 `cierreEstatico` da por hecho la clave `index.html` del manifiesto.
- 023/R34 `login.html` hereda la descripción de la portada.
- 023/R36 CA1 y CA2 (Lighthouse) solo se miden a mano; propuesta: presupuesto de bytes por ruta en el build.
- 023/R39 El anillo del mapa también aparece al hacer clic con el ratón (`:focus-within`).
- 023/R40 El job "Seguridad (solo cambios del PR)" no lee las excepciones de `docs/security.md`: sigue en rojo con picomatch (`/chore` del workflow).

**Diseño**
- Deuda DS1 a DS12 en `docs/design/system.md`; prioritarias: DS1 (dos rosas de marca) y DS4 (contraste del botón principal).

**Funcional, por confirmar con el usuario**
- Datos de la clínica en `frontend/src/data/site.js`: ciudad y estado reales desde 2026-11-18 (Lázaro Cárdenas, Michoacán); faltan calle, código postal, teléfono y horario (spec 017). El teléfono provisional usa la lada 55 de Ciudad de México.

**Hallado al liberar v1.1.0**
- La API aún acepta citas fuera de horario si se llama directamente: resuelto en v1.1.1 (nadie agenda fuera de horario).
- Cambiar contraseña con valores que no son texto responde 500: resuelto en v1.1.1.
- Trivy (DS002): `backend/Dockerfile` (desarrollo) y `frontend/Dockerfile` corren como root.

**Hallado al liberar v1.1.1**
- `npm audit`: 2 vulnerabilidades moderadas en producción (`uuid` < 11.1.1 vía `exceljs`) y moderadas en Jest (solo desarrollo); sin altas ni críticas.
- El registro no normaliza el correo (sin `trim` ni minúsculas), a diferencia de la recuperación (ficha 2026-11-10-fix-registro-campos-no-texto).
- Una fecha de cita con formato ISO completo recibe el mensaje "fuera del horario de atención" en lugar de uno de formato (ficha 2026-11-11-fix-horario-cita-personal).
- `db.js` no usa `dateStrings`: las columnas `DATE` llegan como `Date`; revisar otros usos que comparen fechas como texto.

**Deuda de la spec 018** (aceptada en /review)
- 018/R11 Trivy se ejecutó al liberar v1.1.0 sin vulnerabilidades altas: resuelto.
- 018/R12 Enlazar cada dependencia de producción registrada con su ADR.
- 018/R13 Ampliar la prueba de permisos del workflow.
- 018/R14 Indicar que la antigüedad de versiones es control de proceso.
- 018/R15 Anotar `minimatch` en el ADR 0004.
- 018/R16 Restaurar solo las variables tocadas en la prueba de 001 CA3.
- 018/R17 Reubicar la prueba del doble y simplificar aserciones.
- 018/R18 Ampliar las pruebas de 003 CA1 y CA3.
- 018/R19 Precisar la prueba de red del frontend.
- 018/R20 Exigir el paso de gitleaks en el workflow.
- 018/R21 `axios` corregido en v1.1.0; su prueba existe: resuelto.
- 018/R22 Anclar el patrón del paso de lint del backend en la prueba de CA10.

**Deuda de la spec 021** (aceptada en /review, ronda 1)
- 021/R8 Carrera con tres peticiones simultáneas: releer la cuenta con `FOR UPDATE` dentro de la transacción.
- 021/R9 Mover `validarContrasena` a `src/utils/` y quitar la dependencia `users` → `auth.service`.
- 021/R10 Extraer la fábrica de mocks del repositorio de usuarios a `tests/support/`.
- 021/R11 Probar "sobre su propia cuenta" por HTTP con el JWT de la cuenta.
- 021/R12 La aserción de lista sin recargar al eliminar es de regresión.
- 021/R14 Foco de los modales: restaurarlo al cerrar y atraparlo dentro (previo).
- 021/R15 Escape cierra dos modales apilados (previo).
- 021/R16 Anuncio repetido del error, error asociado al campo y confirmación de eliminar abierta hasta la respuesta (previo).
- 021/R17 Documentar que `mensaje` de `ModalConfirmacion` debe ser texto.
- 021/R18 Extensiones de las subidas: ya en RS5.a/RS5.b.
- 021/R19 Test de integración del bloqueo contra una BD de pruebas.
- 021/R20 `aria-describedby` solo con mensaje no vacío.

**Calidad**
- 15 problemas de lint previos en el frontend y 2 errores previos en el backend (`faqs.service.js`, `images.service.js`; los de `errorHandler.js` se resolvieron en la spec 026).
- Lint de estilos que exige el principio P20 de la constitución.
- Aprobar `docs/constitution.md`, que sigue en `draft`.
