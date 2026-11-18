---
lane: chore
status: released
released: v1.4.1 (2026-11-18)
base: d2efd91
relates: []
covers: []
escalated_to: null
---

# Chore: respaldo diario programado en el servidor

## Problema
El riesgo RD2 (`docs/deployment.md`) seguía con RD2.a "en curso": el script de respaldo existía
desde v1.1.0, pero nadie lo ejecutaba de forma automática. Un olvido significaba perder citas,
expedientes y fotos.

## Cambio
- En el servidor (lo hizo el usuario el 2026-11-18): una ejecución manual de
  `backend/scripts/respaldo.sh` y una entrada en su crontab, a las 3:00 todos los días, con salida a
  `~/dentista-respaldo.log`.
- `docs/deployment.md`: la sección "Respaldos" describe la tarea programada y cómo revisarla; RD2.a
  queda mitigada y RD2.b y RD2.c, pospuestas.
- `docs/roadmap.md`: el estado de RD2.
- Sin código de la app ni del script: `backups/` ya estaba en `backend/.gitignore`.

## Escalado
Solo documentación y una tarea programada en el servidor que usa el script ya liberado. Sin
contratos, datos nuevos, dependencias ni rutas protegidas.

## Verificación
- Usuario, en el servidor (2026-11-18): `respaldo.sh` imprime `Respaldo terminado:
  backups/mysql-20261118-181337.sql.gz`; el volcado se lee con `zcat` y tiene 12 `CREATE TABLE`;
  `crontab -l` muestra la línea una sola vez.
- Pendiente: confirmar la primera ejecución automática con `tail ~/dentista-respaldo.log` (2026-11-19).
- `aidd.py validate` sin errores. Sin código: no aplican suite, SAST ni SCA. Review ligera de chore no requerida.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-18 | brecha | ¿Copias cifradas fuera del servidor (RD2.b) y prueba de restauración (RD2.c)? | Por ahora no; solo el cron de RD2.a. Se retoman más adelante | usuario |
| 2026-11-18 | implícita | Hora y retención | 3:00 diario y 14 días, los valores del script y de la propuesta de `deployment.md` | `docs/deployment.md` |
