---
spec: 030-acciones-mis-citas
status: approved            # draft | approved (solo el usuario aprueba)
exploration: none
threshold: 80
floor: 3
budget: 3
accepted: none
score: 0
system_version: 1.0.0
created: 2026-11-23
updated: 2026-11-23  # refinado por /analyze A4, A5, A10
---

# Diseño · 030 Reprogramar y cancelar desde «Mis citas»

Hecho con `/design-spec 030` sobre `docs/design/system.md`. Los criterios están en la spec
(«Criterios de diseño»). No hay candidatos: ver Resultado.

## Candidatos

Ninguno: sin ciclo de candidatos (ver Resultado y Decisiones).

## Resultado

**Sin diseño nuevo.** No hay pantalla, sección ni pieza nueva. Las tarjetas de «Mis citas»
(`.cita-card`) ya tienen la zona de acciones `.cita-acciones`, la misma que usa la tarjeta
«Próxima cita» de Inicio. Se compone así:

- **Tarjeta de una cita pendiente futura (CA1):** en `.cita-acciones`, los mismos dos botones de
  Inicio: «Reprogramar» (`.mf-btn .mf-btn-prin`, ícono de calendario) y «Cancelar cita»
  (`.mf-btn .mf-btn-sec`, ícono de cancelar), en ese orden. Se usa la regla actual
  `.cita-acciones .mf-btn`: los dos botones se reparten el ancho de la tarjeta, igual que «Dejar
  comentario» hoy en la misma rejilla. En Inicio, la «Próxima cita» los muestra con ancho automático
  en escritorio; esa diferencia es la de hoy y no cambia.
- **Demás tarjetas (CA2):** sin cambios. Las completadas conservan «Dejar comentario» o
  «Comentario enviado».
- **Formulario (CA3, CA4, CA5):** el mismo `ModalFormulario` de Inicio, con los mismos títulos,
  campos, textos de botones y subtítulo «servicio · fecha · hora» de la cita elegida. Los errores
  salen en su `<p role="alert">`. Los avisos de éxito son el mismo `ModalConfirmacion`.
- **Accesibilidad (CA9):** cada botón conserva su texto visible y añade un nombre accesible con la
  cita: «Reprogramar cita de Limpieza del 03/12/2026 a las 10:00 AM» y «Cancelar cita de
  Limpieza del 03/12/2026 a las 10:00 AM». Al cerrar, el foco vuelve a un control con foco visible: al botón que abrió el
  formulario, o a «Agendar nueva cita» si la tarjeta se quedó sin botones (cita cancelada).

Inicio no cambia (CA7).

El ciclo de candidatos no se hizo porque se reutilizan piezas ya diseñadas, sin composición nueva
(`references/spec-mode.md` §1, «se omite»). K1–K3 se comprueban en la tarea que construye la
pantalla, con tests y con capturas a 390 y 1440 px que revisa el usuario.

| Criterio | Objetivo | Cómo se comprueba | |
|---|---|---|---|
| K1 · Acciones en las pendientes futuras (CA1) | visibles en la tarjeta a 390 y 1440 px, iguales a las de Inicio | test de la pantalla; capturas a ambos anchos | pendiente de `/implement` |
| K2 · Sin regresión (CA2, CA7) | el resto de «Mis citas» y la «Próxima cita» de Inicio iguales que hoy | tests de las dos pantallas; capturas antes y después | pendiente de `/implement` |
| K3 · Accesibilidad (CA9, P16) | nombre accesible con servicio y fecha; teclado; foco devuelto al cerrar | test por rol y nombre; foco tras cerrar; manual con lector de pantalla | pendiente de `/implement` |

## Imágenes de muestra

Ninguna.

## Pantallas

| Pantalla y estado | Ancho menor | Intermedio | Ancho mayor | Criterios |
|---|---|---|---|---|
| Mis citas · con pendientes futuras, pasadas y completadas | captura a 390 en `/implement` | no aplica | captura a 1440 | CA1, CA2 |
| Mis citas · formulario de reprogramar y de cancelar | captura a 390 en `/implement` | no aplica | captura a 1440 | CA3, CA4 |
| Inicio · próxima cita | captura a 390 en `/implement` | no aplica | captura a 1440 | CA7 |

## Componentes

| Componente | Estados que usa | Cambio |
|---|---|---|
| `.cita-card` + `.cita-acciones` | reposo | Ninguno en estilos; gana dos botones en las pendientes futuras |
| `.mf-btn-prin`, `.mf-btn-sec` | reposo, foco, `:disabled` | Ninguno |
| `ModalFormulario`, `ModalConfirmacion` | abierto, enviando, error | Ninguno; se reutilizan los de Inicio |

## Cambios a incorporar al sistema

Ninguno.

## Movimiento

Ninguno.

## Accesibilidad

- Contraste: el de los botones `.mf-btn` del sistema, sin cambios, y por debajo de AA.
  - `.mf-btn-prin`: blanco sobre `#e94b6a` → `#f0708a`, 3.70–2.84:1 (DS4).
  - El rojo de confirmar la cancelación: `#e63946`, 4.17:1 (DS5).
  - El borde de `.mf-btn-sec`: 1.48:1 (DS6).
  - Se reutilizan igual que en Inicio por la excepción P16 que aprobó el usuario (/analyze A18),
    hasta una spec que corrija DS4, DS5 y DS6 en todo el panel. T022 mide y anota los valores.
- Nombre accesible: el texto visible está contenido en el nombre accesible, para que el control
  por voz también funcione (WCAG 2.5.3).
- Foco, con esta secuencia:
  - si el formulario se cierra sin guardar, el foco vuelve al botón que lo abrió;
  - si se guarda, primero sale el aviso de éxito, que toma el foco; al pulsar «Aceptar», el foco
    vuelve al botón «Reprogramar» de esa tarjeta, o a «Agendar nueva cita» si la cita quedó
    cancelada y ya no tiene botones.
  - Los dos destinos tienen el foco visible del sistema (`.mf-btn:focus-visible` y el botón del
    encabezado), sin estilos nuevos.
  - La lógica vive en «Mis citas»; el formulario compartido no cambia el foco de Inicio.
  - Mecanismo: «Mis citas» guarda la referencia del botón que abrió el formulario. Para «Agendar
    nueva cita» busca el botón del encabezado dentro de su propio contenedor, sin cambiar
    `EncabezadoModulo`.
  - Si el botón de la tarjeta ya no existe, o la lista no se pudo volver a cargar, el foco va a
    «Agendar nueva cita».
- Teclado: botones nativos; el formulario cierra con Escape, como hoy.

## Decisiones

| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-23 | diseño | ¿Ciclo de candidatos o sin diseño nuevo? | Sin diseño nuevo: se reutilizan la tarjeta, los botones y el formulario de Inicio | `references/spec-mode.md` §1; spec 030 («sin romper diseños») |
| 2026-11-23 | refinado | Contraste de los botones reutilizados por debajo de AA | Se mantienen iguales que en Inicio con una excepción P16 temporal | usuario · /analyze A18 |
| 2026-11-23 | refinado | Nombre accesible | Incluye la hora | usuario · /analyze A28 |
| 2026-11-23 | refinado | ¿A dónde va el foco si la cita cancelada ya no tiene botones? | A «Agendar nueva cita»: el título de la tarjeta no tiene foco visible y añadirlo sería un estilo nuevo | P16 · /analyze A4, A5 |
