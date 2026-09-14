# Las View Transitions ponen la app sobre el runtime experimental de React

La cáscara anima el cambio de Sección con la [View Transitions API][vt] a través del componente
`<ViewTransition>` de React, habilitado con `experimental: { viewTransition: true }` en
`next.config.ts`. Ese flag no es cosmético: hace que Next sirva la aplicación con
`app-page-experimental.runtime` y aliase `react` a la copia experimental que trae vendorizada,
en lugar de la estable. Es una decisión sobre qué React corre en producción, no sobre una
animación.

Lo elegimos igual porque la alternativa es peor. Sin `<ViewTransition>`, animar una navegación
del App Router obliga a interceptar el click, empujar la ruta a mano y coordinar `flushSync`
con `document.startViewTransition` para que React commitee adentro de la transición: es código
frágil, pegado a los internos del router, que se rompe en cada actualización de Next y que
además hay que mantener nosotros. El flag mueve exactamente ese problema a Next.

La copia vendorizada exporta `unstable_ViewTransition`, no el `ViewTransition` estable que ya
declara `@types/react` 19.3. El nombre se reconcilia en `types/react-view-transition.d.ts`, que
es una augmentación de cinco líneas y el lugar donde se borra el día que Next deje de aliasar.

[vt]: https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API

## Consequences

- El alcance es el demo local y su publicación en Vercel, no un sistema con SLA. Un runtime
  experimental es un riesgo aceptable ahí y no lo sería en la Fase 2.
- Actualizar Next puede romper el import: el síntoma es `Element type is invalid ... got:
  undefined`, que es `unstable_ViewTransition` habiendo cambiado de nombre. Se arregla en el
  archivo de tipos y en `app/layout.tsx`, en ningún otro lado.
- Volver atrás cuesta poco y toca cuatro lugares: el flag en `next.config.ts`,
  `types/react-view-transition.d.ts`, el `<ViewTransition default="seccion">` de
  `app/layout.tsx` y, en `app/globals.css`, las reglas `::view-transition-old/new(.seccion)`
  con sus `@keyframes seccion-sale` y `seccion-entra`. El nombre `seccion` es un acoplamiento
  por string entre el layout y la hoja de estilos: cambiarlo en un lado y no en el otro no
  rompe nada, simplemente deja de animar. Las transiciones dejan de animarse; la navegación,
  los esqueletos y el prefetch siguen funcionando igual.
- Si la Fase 2 exige React estable, esto es lo primero que se cae, y se cae solo.
