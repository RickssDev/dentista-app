---
id: 0002
status: accepted
date: 2026-11-08
---

# ADR 0002 · Backend en Express con MySQL y SQL manual

Registrado a posteriori: documenta una decisión ya presente en el código.

## Contexto
El backend expone una API REST para el sitio, el panel y el portal del paciente, y guarda datos
relacionales (usuarios, citas, historial clínico).

## Decisión
Express 5 en CommonJS, módulos por dominio con capas routes → controller → service → repository,
y MySQL 8 mediante `mysql2/promise` con SQL escrito a mano y parámetros `?`.

## Alternativas consideradas
- ORM (Prisma, Sequelize) — no se conoce un motivo registrado para descartarlo.

## Consecuencias
- Control total de las consultas, sin capa adicional.
- La protección contra inyección depende de la disciplina (constitución P9).
- Sin herramienta de migraciones: el esquema no está versionado (riesgo RD1 en `docs/deployment.md`).
