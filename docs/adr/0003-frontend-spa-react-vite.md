---
id: 0003
status: accepted
date: 2026-11-08
---

# ADR 0003 · Frontend como SPA en React con Vite

Registrado a posteriori: documenta una decisión ya presente en el código.

## Contexto
Un solo frontend atiende el sitio público, el panel del personal y el portal del paciente.

## Decisión
SPA en React 19 con Vite 7 y React Router 7 en modo `BrowserRouter`, servida como archivos
estáticos por nginx. CSS propio por pantalla, sin librería de componentes.

## Alternativas consideradas
- Meta-framework con renderizado en servidor (Next, Remix) — no se conoce un motivo registrado para descartarlo.

## Consecuencias
- Despliegue sencillo como estáticos.
- Todas las rutas comparten el mismo HTML, lo que limita el SEO (brecha SE1 en `docs/seo.md`).
  Prerenderizar las rutas públicas requerirá su propio ADR.
