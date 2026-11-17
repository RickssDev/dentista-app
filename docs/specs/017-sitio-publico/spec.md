---
id: 017
slug: sitio-publico
status: inferred
confidence: alta
created: 2026-11-08
extends: []
---

# 017 · Sitio público

## Problema
La clínica se presenta a posibles pacientes y les ofrece vías de contacto. Como spec inferida, atiende los riesgos que cita solo parcialmente: los documenta sin corregirlos.

## Historias de usuario
- Como visitante, quiero conocer la clínica, sus servicios y cómo contactarla.

## Criterios de aceptación
<!-- Spec inferida: [x] = cubierto por un test; [ ] = observado en el código, sin test. -->
- [ ] CA1 · Dado un visitante, entonces accede a `/`, `/nosotros`, `/galeria`, `/contacto`, `/aviso-de-privacidad` y `/terminos-de-servicio` sin sesión.
- [ ] CA2 · Dada la portada, entonces muestra servicios, promociones, testimonios y preguntas desde la API.
- [ ] CA3 · Dado un fallo o una lista vacía, entonces la sección muestra un estado vacío con reintento.
- [ ] CA4 · Dado el formulario de contacto, cuando se envía, entonces abre WhatsApp con el mensaje; no guarda datos.
- [ ] CA5 · Dada una ruta inexistente, entonces muestra "Página no encontrada" con enlace al inicio.
- [x] CA6 · Dada una ruta indexable, entonces tiene título y descripción propios. resuelto por 022 (v1.3.0)

## Fuera de alcance
- Panel y portal del paciente.

## Seguridad y privacidad
- Datos sensibles involucrados: No aplica: el sitio solo muestra contenido público y el formulario no guarda datos.

## Cobertura de riesgos
Esta spec documenta el comportamiento actual y no corrige los riesgos citados.

| Corrección | Alcance | Criterios / motivo y destino |
|---|---|---|
| SE1.a — Prerenderizar o renderizar en servidor las 6 rutas públicas, con ADR | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |
| SE1.b — Título y descripción únicos por ruta indexable | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-08 | brecha | ¿Dentissa o Melissa López N.? | Ambos nombres son intencionales | usuario |

## Evidencia (solo si status=inferred)
- Archivos: `frontend/src/App.jsx`, `frontend/src/pages/{Home,About,Gallery,Contact,Legal}.jsx`, `frontend/src/hooks/usePublicData.js`, `frontend/src/data/site.js`
- Tests: sin tests

## Observaciones (solo si status=inferred)
- El teléfono `+52 55 1234 5678` y otros datos de `frontend/src/data/site.js` parecen de ejemplo; confirmar que sean los reales.
- `frontend/src/api/client.js` declara la clave `"payload, data"` como un solo texto, probable error de tipeo.

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-08 | Spec inferida del código | /init |
| 2026-11-17 | Comportamiento modificado por 022 en v1.3.0 | /release |
