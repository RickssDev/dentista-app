---
id: 0010
status: proposed
date: 2026-11-17
---

# ADR 0010 · Fuente autoalojada y login prerenderizado para el rendimiento

Amplía [ADR 0009](0009-prerender-rutas-publicas.md) (prerender de las rutas públicas).

## Contexto
La spec 023 pide Lighthouse móvil 100 en cinco páginas (login incluido) y ≥ 95 en portada y
contacto. Hay dos cosas que el código actual no permite:
- El texto depende de Google Fonts: una hoja de estilos externa que bloquea el render y dos
  orígenes más que resolver.
- `/login` recibe el armazón vacío (`app.html`) y su contenido principal no aparece hasta que corre
  toda la aplicación (LCP 4,4 s).

## Decisión
1. **Plus Jakarta Sans autoalojada** con `@fontsource-variable/plus-jakarta-sans`, igual que Jost,
   que ya se sirve con `@fontsource-variable/jost`. Verificación (`shared/agent-security.md` §2,
   2026-11-17):
   - existe en npm desde 2023-05-21; versión 5.3.0, publicada hace más de dos semanas;
   - mismos mantenedores que `@fontsource-variable/jost` (jwr1, lotusdevshack) y repositorio
     `fontsource/font-files`;
   - licencia OFL-1.1;
   - sin scripts de instalación.

   Solo trae archivos de fuente y CSS.
2. **El login se prerenderiza** en `dist/login.html` con el mismo mecanismo del ADR 0009. Lleva
   `noindex` y no lleva canónica, Open Graph, JSON-LD ni entrada en el sitemap. nginx sirve
   `/login` con ese archivo y el resto de rutas privadas sigue con `app.html`. El inicio de sesión
   con Google se monta solo dentro del login.

## Alternativas consideradas
- Descargar a mano los `woff2` de Google Fonts a `public/`: sin dependencia, pero sin versiones ni
  `unicode-range` por subconjunto, y distinto de cómo se sirve Jost.
- Seguir con Google Fonts con `preconnect`: mantiene la hoja externa que bloquea y no cumple CA8.
- Login solo con división de código: mejora, pero se queda en torno a 90–95 (decisión del usuario,
  2026-11-17: prerenderizarlo).

## Consecuencias
- Una dependencia de producción más, sin código ejecutable.
- `login.jsx` no puede usar `window`, `document` ni `localStorage` al pintar (hoy ya no lo hace).
- `frontend/nginx.conf` gana una ubicación exacta para `/login`.
- El prerender genera un archivo más, y su guarda comprueba que no lleve canónica ni entre en el
  sitemap.
