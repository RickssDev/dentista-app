---
version: 1.0.0
ratified: 2026-11-08
last_amended: 2026-11-08
status: draft   # draft hasta que el usuario la apruebe → approved
---

# Constitución de Dentissa

Principios innegociables. Toda spec, plan y tarea debe cumplirlos. `/plan` y `/tasks` incluyen un
**Constitution Check** que evalúa cada principio; un incumplimiento sin justificación bloquea.

## Código previo
El código existente anterior a esta constitución que no cumple un principio **no bloquea** por sí
mismo: queda registrado como deuda en [roadmap.md](roadmap.md) y en las "Observaciones" de cada
spec. Los principios se exigen a todo código **nuevo o modificado**.

## Principios

### P1. Spec antes de implementar
**Regla:** ningún cambio de comportamiento se implementa sin una spec `approved` en `docs/specs/`
o una ficha abierta de un carril en `docs/changes/`.
**Cómo se verifica:** hook de ai-dd, `aidd.py drift` y revisión del PR.
**Por qué:** la clínica opera con datos reales; lo que cambia debe estar acordado antes.

### P2. Tests por feature
**Regla:** todo cambio de comportamiento lleva un test automatizado antes de integrarse. El código
previo se cubre cuando se toca (decisión del usuario, 2026-11-08).
**Cómo se verifica:** CI ejecuta la suite; `/review` cruza cada criterio con su test.
**Por qué:** el repo no tiene tests y cada cambio se valida a mano sobre datos reales.

### P3. Dependencias nuevas con ADR
**Regla:** toda dependencia nueva de producción se registra en un ADR en `docs/adr/`.
**Cómo se verifica:** el hook detecta cambios en `package.json`; `/review` exige el ADR.
**Por qué:** cada dependencia amplía la superficie sobre datos de salud.

### P4. Arquitectura con ADR
**Regla:** toda decisión que contradiga `docs/architecture.md` requiere un ADR.
**Cómo se verifica:** Constitution Check de `/plan` y `/review`.
**Por qué:** evita que la estructura derive sin que nadie lo decida.

### P5. Producción solo con aprobación humana
**Regla:** ningún despliegue a producción sin aprobación humana explícita.
**Cómo se verifica:** `/release` se detiene en la aprobación y la registra.
**Por qué:** producción contiene expedientes clínicos reales.

### P6. Rollback documentado
**Regla:** todo cambio desplegable declara cómo se revierte, incluido su efecto en datos.
**Cómo se verifica:** sección Rollout del plan y `docs/deployment.md`.
**Por qué:** hoy no hay staging; un despliegue fallido impacta directamente a la clínica.

### P7. Migraciones compatibles
**Regla:** todo cambio de esquema es compatible con la versión anterior del código
(expand → migrate → contract) y se aplica desde un archivo versionado, no desde código de la app.
**Cómo se verifica:** `/review` revisa cada migración; test de aplicación sobre una base vacía.
**Por qué:** permite revertir la aplicación sin perder datos.

### P8. Autorización en el servidor
**Regla:** toda autorización se verifica en el backend; ningún endpoint nuevo sin control de acceso
explícito (`verifyToken` y `authorizeRoles`, o declaración de que es público).
**Cómo se verifica:** test de autorización por rol en cada endpoint nuevo o modificado.
**Por qué:** la guarda del frontend no protege los datos.

### P9. Entrada validada y SQL parametrizado
**Regla:** toda entrada externa se valida en el servidor con lista de campos permitidos; las
consultas usan siempre parámetros `?`.
**Cómo se verifica:** test de entrada inválida y búsqueda en `/review` de SQL con interpolación.
**Por qué:** el SQL es manual y no hay un ORM que lo proteja.

### P10. Secretos fuera del repositorio
**Regla:** ningún secreto en código, logs, documentos ni historial de git.
**Cómo se verifica:** `gitleaks` en CI y en `/implement`.
**Por qué:** las claves dan acceso a datos de pacientes y a servicios de pago.

### P11. Sin vulnerabilidades críticas o altas en producción
**Regla:** ninguna vulnerabilidad crítica o alta llega a producción sin excepción aprobada con
fecha de vencimiento en `docs/security.md`.
**Cómo se verifica:** `npm audit --audit-level=high` y `trivy` en CI y en `/release`.
**Por qué:** el sistema trata datos de salud expuestos a internet.

### P12. Modelo de amenazas en datos sensibles
**Regla:** toda feature que toca datos sensibles, autenticación o permisos incluye modelo de
amenazas en su plan.
**Cómo se verifica:** sección "Modelo de amenazas" del plan, comprobada por `/analyze` y `/review`.
**Por qué:** exigencia del nivel ASVS 2 adoptado.

### P13. Auditoría de datos sensibles
**Regla:** logins (también fallidos), accesos denegados, lecturas y cambios de historial clínico y
datos de pacientes, cambios de roles, acciones administrativas y exportaciones se registran con
actor, acción, recurso, resultado y fecha, en almacenamiento de solo anexado.
**Cómo se verifica:** test que comprueba el evento emitido en cada flujo que toca estos datos.
**Por qué:** LFPDPPP y NOM-004; hoy no queda rastro de quién consultó un expediente.

### P14. Correlación por petición
**Regla:** cada petición lleva `X-Request-Id`, presente en sus logs y en la respuesta.
**Cómo se verifica:** test de integración sobre la cabecera y `/release` en la verificación post-deploy.
**Por qué:** sin él no se puede reconstruir un incidente.

### P15. Logs sin datos sensibles
**Regla:** ningún log contiene datos personales, de salud, credenciales ni tokens; nivel `info` por
defecto en producción.
**Cómo se verifica:** test del redactor de logs y revisión de cada llamada de log en `/review`.
**Por qué:** los logs no tienen el control de acceso del expediente.

### P16. Accesibilidad WCAG 2.1 AA
**Regla:** toda pantalla nueva o modificada cumple WCAG 2.1 AA: contraste ≥ 4.5:1 en texto,
≥ 3:1 en bordes de control, foco visible y uso por teclado.
**Cómo se verifica:** `/design-spec` y `/review` miden contraste y foco en navegador.
**Por qué:** los pacientes incluyen adultos mayores y personas con baja visión.

### P17. Sin lógica de negocio en las vistas
**Regla:** las reglas de negocio viven en los services del backend; los componentes solo presentan
datos y validan formato.
**Cómo se verifica:** revisión en `/review`.
**Por qué:** las reglas duplicadas en la vista se pueden saltar llamando a la API.

### P18. Metadatos por ruta indexable
**Regla:** cada ruta indexable tiene título y descripción únicos y una sola canónica absoluta
construida desde `seo.site_url`.
**Cómo se verifica:** test sobre el HTML generado de cada ruta de `docs/seo.md`.
**Por qué:** hoy todas las rutas comparten el mismo HTML.

### P19. Noindex fuera de lo público
**Regla:** las rutas privadas, el inicio de sesión, la 404 y todo entorno que no sea producción
llevan `noindex` y quedan fuera del sitemap.
**Cómo se verifica:** test sobre el HTML generado y `/seo verify` en producción.
**Por qué:** el panel y el portal del paciente no deben aparecer en buscadores.

### P20. La interfaz usa solo el sistema de diseño
**Regla:** colores, tipografía, espaciados, radios, sombras y duraciones salen de los tokens de
[docs/design/system.md](design/system.md); ningún valor literal en estilos o componentes de
pantallas nuevas o modificadas. Un valor nuevo se añade primero al sistema.
**Cómo se verifica:** TODO(init): añadir un lint de estilos que falle con literales de color (Objetivo 1 del roadmap); mientras tanto, `/review`.
**Por qué:** hoy conviven dos rosas de marca y cientos de valores fijos.

## Restricciones
- Datos personales y de salud bajo LFPDPPP (México) y expediente clínico bajo NOM-004-SSA3-2012
  (decisión del usuario, 2026-11-08). Confirmar alcance con la asesoría legal de la clínica.
- Nivel objetivo OWASP ASVS 2 (decisión del usuario, 2026-11-08).
- Solo Administrador gestiona usuarios y roles (decisión del usuario, 2026-11-08).
- Zona horaria de negocio: `America/Mexico_City`.

## Definición de terminado
- [ ] Los tests pasan.
- [ ] El lint está limpio en los archivos tocados.
- [ ] Spec, arquitectura y CHANGELOG reflejan el cambio.
- [ ] Una persona revisó el PR.

## Gobierno
- Cambiar esta constitución requiere subir `version` (SemVer: MAJOR elimina o redefine un
  principio, MINOR añade uno, PATCH aclara redacción) y registrar la enmienda abajo.
- Ante conflicto, la constitución prevalece sobre specs, planes y `AGENTS.md`.

## Enmiendas
| Versión | Fecha | Cambio | Motivo |
|---|---|---|---|
| 1.0.0 | 2026-11-08 | Versión inicial | /init |
