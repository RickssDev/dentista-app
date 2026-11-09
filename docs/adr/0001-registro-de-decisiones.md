---
id: 0001
status: accepted
date: 2026-11-08
---

# ADR 0001 · Registrar decisiones arquitectónicas mediante ADRs

## Contexto
El proyecto no tiene registro de por qué se tomaron sus decisiones técnicas, y a partir de ahora
las dependencias nuevas y los cambios de arquitectura deben justificarse (constitución P3 y P4).

## Decisión
Cada decisión arquitectónica se registra en `docs/adr/NNNN-<slug>.md` con la plantilla de
`docs/templates/adr.md`. Un ADR aceptado no se reescribe: otro lo reemplaza.

## Alternativas consideradas
- Descripciones de PR — se pierden y no se pueden consultar por tema.
- Comentarios en el código — no recogen alternativas ni consecuencias.

## Consecuencias
- Cada decisión queda localizable y con su motivo.
- Añade un paso breve al cambiar dependencias o arquitectura.
