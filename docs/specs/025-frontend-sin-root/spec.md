---
id: 025
slug: frontend-sin-root
status: approved
created: 2026-11-22
extends: []
---

# 025 · Servicio del sitio sin privilegios de administrador

## Problema
El servicio que entrega el sitio público y los paneles, y que reenvía las peticiones a la API, corre
con privilegios de administrador del sistema dentro de su entorno aislado. Si alguien aprovechara
una falla de ese servicio, tendría control total del entorno: podría cambiar las páginas que ven
pacientes y personal o la configuración que las protege (spec 024). El escáner de seguridad del
proyecto lo marca como hallazgo alto, aceptado como excepción temporal que vence el 2026-12-31
(review 024, R9). Además, las piezas base con que se construye el servicio no tienen versión fija.
Dos construcciones del mismo código en días distintos pueden dar resultados distintos, y una
versión nueva podría entrar en producción sin revisión.

## Historias de usuario
- Como responsable de la clínica, quiero que el servicio del sitio corra sin privilegios de
  administrador para que una falla de ese servicio no permita alterar lo que ven pacientes y
  personal.
- Como responsable de la clínica, quiero que la protección no cambie nada de lo que hoy funciona
  (páginas, inicio de sesión, paneles, la conexión de entrada y el despliegue) para poder liberarla
  sin riesgo.
- Como responsable de la clínica, quiero que cada construcción use versiones exactas y conocidas de
  sus piezas base para saber qué se despliega y decidir cuándo actualizarlas.

## Criterios de aceptación
- [ ] CA1 · Dado el servicio del sitio en marcha, cuando se consulta con qué identidad corre cada
  uno de sus procesos, entonces ninguno corre como administrador del sistema.
- [ ] CA2 · Dado el servicio sin privilegios, cuando la comprobación automática del servidor web
  recorre sus respuestas (páginas públicas, inicio de sesión, rutas privadas, página no
  encontrada, redirecciones, archivos estáticos y reenvío a la API), entonces códigos de estado,
  contenido y cabeceras de seguridad son los mismos que en v1.5.0.
- [ ] CA3 · Dado el servicio sin privilegios, cuando se recorren en el navegador las páginas
  públicas, el mapa de contacto y el inicio de sesión con Google, entonces todo se muestra igual
  que en v1.5.0 y la consola no registra bloqueos.
- [ ] CA4 · Dado el despliegue de producción, cuando se publica la nueva versión con el
  procedimiento actual, entonces el servicio atiende en el mismo punto de entrada interno y la
  conexión de entrada al sitio funciona sin cambiar su configuración ni la del despliegue del
  servidor.
- [ ] CA5 · Dado el escáner de seguridad del proyecto, cuando se ejecuta sobre el repositorio,
  entonces no reporta que el servicio del sitio corra como administrador ni ningún hallazgo alto o
  crítico nuevo en su construcción.
- [ ] CA6 · Dada la receta de construcción del servicio, cuando se revisa, entonces cada pieza base
  indica una versión exacta. Si alguna queda sin versión o con una genérica ("la última"), la
  comprobación automática del proyecto falla y dice cuál.
- [ ] CA7 (abuso) · Dado un atacante que logra ejecutar órdenes dentro del servicio con la
  identidad del propio servicio, cuando intenta modificar las páginas que entrega o la
  configuración de cabeceras de seguridad, entonces no puede hacerlo por falta de permisos.
- [ ] CA8 · Dado un problema tras desplegar, cuando se aplica el procedimiento de rollback actual
  (volver al commit anterior y reconstruir solo el servicio del sitio), entonces se recupera la
  versión anterior sin pasos nuevos.

## Fuera de alcance
- El servicio de la API: ya corre sin privilegios de administrador.
- Endurecer el despliegue del servidor (sistema de archivos de solo lectura, retirar capacidades,
  límites de recursos): exige cambiar la configuración del despliegue de producción, que tiene
  cambios locales en el servidor.
- Cambiar el punto de entrada interno o la configuración del túnel de entrada.
- Actualizar las piezas base a versiones más nuevas que las que se usan hoy: se fijan las vigentes.
- Actualización automática de versiones (bots que proponen subirlas).
- El entorno de desarrollo local y la maqueta IoT.
- Cualquier cambio en lo que el sitio sirve: páginas, cabeceras, rutas o rendimiento.

## Seguridad y privacidad
- Datos sensibles involucrados: ninguno directo. El servicio entrega páginas y archivos públicos y
  reenvía a la API las peticiones con datos de salud y la sesión, sin guardarlas.
- Quién puede hacer qué: sin cambios de roles ni permisos de la aplicación. Cambia solo la
  identidad con la que corre el servicio dentro de su entorno.
- Casos de abuso:
  - Como atacante que logra ejecutar órdenes en el servicio del sitio, intento cambiar las páginas o
    quitar las cabeceras de seguridad → se rechaza por falta de permisos (CA7).
  - Como atacante, intento aprovechar una versión base vulnerable que entró sin revisión al
    reconstruir → no ocurre: las versiones son exactas y solo cambian por una actualización
    revisada (CA6), y el escáner las revisa en cada PR y cada semana (CA5).

## Cobertura de riesgos
| Corrección | Alcance | Criterios / motivo y destino |
|---|---|---|
| Excepción AVD-DS-0002 — el servicio del sitio corre como administrador (`docs/security.md`, review 024 R9) | dentro | CA1, CA5, CA7; la excepción se retira al liberar |
| Versiones fijas de las piezas base (sugerencia de la review 024, R9) | dentro | CA6 |

## Auditoría
No aplica: la spec no añade ni cambia acciones de usuarios, accesos a datos, autenticación ni
permisos de la aplicación. Solo cambia la identidad con la que corre el servicio del sitio y las
versiones de su construcción; los eventos de `docs/observability.md` siguen como están.

## Requisitos no funcionales
- Sin cambios visibles ni de rendimiento: Lighthouse en las siete rutas con el mismo resultado que
  en v1.5.0 (Rendimiento −2 como máximo, Prácticas recomendadas y SEO iguales).
- Descubribilidad sin cambios: las rutas indexables y las que no se indexan siguen igual (spec 022,
  `docs/seo.md`).
- El tiempo de construcción del servicio no aumenta de forma apreciable (≤ 20 % más que hoy).

## Preguntas abiertas
Ninguna.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-22 | brecha | ¿Carril ligero (`/chore`) o spec? | Spec: toca seguridad y una ruta protegida (motivo 4 de escalado) | usuario |
| 2026-11-22 | brecha | ¿Puede cambiar el punto de entrada interno del servicio? | No: el túnel de entrada apunta a él y el despliegue del servidor tiene cambios locales; se mantiene (CA4) | usuario (opción A en `/chore`) |
| 2026-11-22 | implícita | Producción solo con aprobación humana y rollback documentado | Se aplican P5 y P6; CA8 | `docs/constitution.md` P5, P6 |
| 2026-11-22 | implícita | Vulnerabilidades altas o críticas bloquean | El escáner de contenedores corre en CI y en `/release` | `docs/constitution.md` P11, `docs/security.md` |
| 2026-11-22 | implícita | La excepción AVD-DS-0002 vence el 2026-12-31 | Liberar antes de esa fecha; al liberar se retira de "Excepciones aceptadas" | `docs/security.md` |
| 2026-11-22 | supuesto | Política para actualizar las versiones fijas | Se suben con `/chore` cuando el escáner (CI semanal o `/release`) marque un hallazgo alto o crítico, o al revisar el roadmap; sin bot automático | agente, para revisión del usuario |
| 2026-11-22 | supuesto | Versiones a fijar | Las que se usan hoy, sin subir ninguna | agente, para revisión del usuario |

## Notas para /plan
- Mencionado por el usuario: imagen del frontend en `frontend/Dockerfile` (`nginx:alpine`, etapa
  de build con `node:22-alpine`), hoy sin `USER`; trivy AVD-DS-0002. El túnel de cloudflared
  apunta a `http://frontend:80`.
- Opción preferida en `/chore` (A): mantener `nginx:alpine` con `USER nginx` y permiso para abrir el
  puerto 80 sin root (`setcap cap_net_bind_service`, con `libcap` instalado y retirado en la misma
  capa); dar escritura al pid y a `/var/cache/nginx`; los archivos del sitio y la configuración
  siguen siendo de root y de solo lectura para `nginx`. Descartada (B): `nginx-unprivileged` en el
  8080, porque obliga a tocar `nginx.conf`, el compose de producción y el túnel.
- Versiones vigentes al 2026-11-22: `nginx` 1.31.9 sobre Alpine 3.24.4 y `node` 22.23.4 sobre
  Alpine 3.24.4. Valorar fijar por etiqueta exacta o por digest.
- Los scripts de `/docker-entrypoint.d/` de la imagen oficial escriben en `/etc/nginx/conf.d`
  (IPv6) y pueden fallar o avisar sin root: comprobarlo.
- `frontend/Dockerfile` está en `security.agent.protected_paths`: solo lo toca una tarea aprobada.
- Pruebas existentes reutilizables: `frontend/scripts/probar-nginx.mjs` (CI), `probar-csp.mjs`,
  `medir-rendimiento.mjs` y `tests/seguridad-cabeceras.test.js` (lee el `Dockerfile`).
