# TMT — Reconstrucción de tenisdemesaparatodos.com

## Contexto

`tenisdemesaparatodos.com` es el circuito amateur de tenis de mesa más grande de Argentina:
~335 clubes, 330 ligas, 22 regiones, categorías Sub-9 a Maxi-65 y para-tenis de mesa
(clases 1-11). El dominio es riquísimo. **La plataforma que lo sostiene es de 2005.**

No hay contacto con el dueño ni acceso a la base. El objetivo de este trabajo es **construir
un producto nuevo, funcional y demostrable** para presentarlo y ver si hay interés en
reemplazar el sistema actual. Eso condiciona todo: hay que verse real (datos reales,
volumen real) sin depender de una migración que hoy no podemos hacer.

Alcance acordado: v1 completa, incluyendo back-office de organizadores.
Stack acordado: Next.js + Supabase (Postgres) + Drizzle.
Ver `analisis-backend.md` para el porqué de Supabase sobre Neon y sobre un backend NestJS.

---

## Diagnóstico del sitio actual (verificado, no supuesto)

| Hallazgo | Evidencia |
|---|---|
| Classic ASP sobre IIS | header `ASPSESSIONIDAWRTBBQA`, `X-Powered-By: ASP.NET` |
| Charset ISO-8859-1 | acentos rotos en el propio HTML (`Divisi&oacute;n` mezclado con bytes latin-1) |
| HTML 4.01 Transitional, layout en tablas | `292 <table>` anidadas en `clubes.asp` |
| **Sin `<meta viewport>` en ninguna página** | no es responsive; en celular es el desktop escalado |
| **Sin API y sin AJAX** | cero `fetch` / `XHR` / `$.ajax` en todo el sitio; cada filtro es un GET con recarga completa |
| jQuery 1.11.1 (2014) + Bootstrap 4.0.0 cargado pero sin usar | `<head>` de todas las páginas |
| `clubes.asp` sin buscador | 312 KB, ~330 clubes en una página; los únicos `<input>` son los del login |
| `rankingClubes.asp` lento | **5,2 s** de respuesta, 349 KB |
| Mapa con datos incrustados | ~330 llamadas `addMarker(...)` hardcodeadas en el HTML, Leaflet 1.3.1 |
| Filtros dependientes rotos | en `ranking.asp` los selects `fProv` y `fLoc` solo ofrecen "Todas" |
| Selects de 330 opciones | `filtroLiga` en `torneos.asp`, `fClub` en `ranking.asp` |
| Código muerto | popup con fecha de corte de **2015**; TrustLogo de Comodo vía `document.write` |
| El sitio no toca plata (y está bien) | "inscripción online" = anotarse, no pagar. El descuento ($12.000 vs $14.000) es por anticipación; el alias de transferencia lo escribe el organizador como texto libre en "Más info" |
| Sin PWA | sin manifest, sin service worker |

Lo que **sí** hay que respetar, porque es el activo real:

- **Jugador**: código, rating, variación, posición, club, madera/gomas/mano hábil, edad,
  nacionalidad, residencia, multimedia, torneos y partidos jugados, % ganados, podios, head-to-head.
- **Torneo**: divisiones con horario/mesas/**cupos en vivo**, sede, precio general vs. online,
  marca/estrellas/color/material de la pelotita, juez general, organizador,
  lista de inscriptos con timestamp al segundo.
- **Rankings**: jugadores, clubes, variación mensual. Calendario. Noticias. Interescuelas.

---

## Arquitectura

Un solo repo, una sola app. Sin microservicios, sin API separada para el propio front.

- **Next.js 15 (App Router)** en Vercel. Server Components para todo lo que es lectura
  (rankings, fichas, listados) → HTML rápido y SEO, que hoy el sitio tiene por accidente y
  conviene no perder.
- **Supabase** como Postgres administrado + Auth + Storage + Realtime. Se elige sobre Neon
  porque Neon es solo Postgres y acá hacen falta auth, fotos y tiempo real igual — y porque
  Supabase **se autohospeda de verdad** (Docker Compose / Helm), lo que deja abierta la puerta
  del on-prem sin costo hoy. Neon self-host es experimental y su control plane no es abierto.
- **Drizzle para todas las queries**, por connection string directa (Supavisor para pooling).
  Drizzle sobre Prisma por las queries de ranking: son window functions y agregados, y en
  Drizzle se escriben como SQL sin perder tipado.
  **No se usa PostgREST ni el cliente de datos de `supabase-js`** — `supabase-js` queda
  reservado a Auth, Storage y Realtime. Así la capa de datos es SQL portable: mudarse a otro
  Postgres es cambiar una connection string.
- **Server Actions** para las mutaciones (inscribirse, cargar resultado, alta de torneo).
  Nada de capa REST intermedia para consumo propio.
- **`/api/v1/*` público y read-only** — JSON de torneos, clubes, rankings y fichas.
  Hoy no existe nada parecido; es casi gratis si ya tenés la capa de queries y habilita
  integraciones (asociaciones, pantallas en el club, bots de WhatsApp). Es también un
  argumento de venta concreto.
- **Supabase Auth** con email + contraseña (y recuperación de clave, que hoy existe y es de
  las cosas que más se usan). El código numérico de jugador se conserva como identificador
  público buscable (la gente lo tiene memorizado), pero no como credencial.
- **Supabase Storage** para fotos de jugadores, logos de clubes y flyers de torneos. El modelo
  actual ya contempla "Multimedia" pero los archivos viven sueltos en `/imagenes/`.
- **Regla no negociable: todas las escrituras pasan por código de servidor** (Server Actions /
  route handlers). El browser nunca escribe directo contra Postgres. **RLS queda como segunda
  línea, deny-by-default** — nunca como el modelo de autorización principal: la matriz de roles
  de este proyecto es anidada ("el juez carga resultados *de su torneo*") y expresarla en
  políticas SQL es difícil de testear y fácil de romper sin darse cuenta.
- **Un worker aparte** (Node común, en Railway o Fly) para lo que serverless hace mal:
  recálculo de rating, envío de push y jobs programados. Es lo único que Supabase no cubre
  bien y no justifica meter un framework de backend entero.
- **MapLibre GL + tiles de Protomaps o Carto**, no Google Maps: sin API key, sin factura por
  uso, y los ~330 clubes se sirven como GeoJSON en vez de incrustados en el HTML.
- **PWA con Serwist** (el sucesor mantenido de `next-pwa`).

Estructura:

```
app/
  (public)/  torneos/ clubes/ ranking/ jugadores/ noticias/
  (cuenta)/  mi-perfil/ mis-inscripciones/
  (admin)/   organizador/…
  api/v1/…
lib/    db/schema.ts  db/queries/  rating.ts  fixture.ts  inscripcion.ts  search.ts
worker/               # recálculo de rating, push, jobs programados
scripts/scrape/       # one-off, no va a producción
```

---

## Fases

### Fase 0 — Datos para el demo

Sin acceso a la base, el seed sale de scrapear las `.asp` públicas. Es viable: todas son GET
con URLs limpias (`torneos_ampliar.asp?codigo=`, `jugadores_ficha.asp?codigo=`,
`partidos_xtorneo.asp?codigo=`) y ya verifiqué que responden con User-Agent de navegador.

- Script Node one-off en `scripts/scrape/`. Decodificar **latin-1** al parsear o salen todos
  los acentos rotos.
- Las coordenadas de los clubes se obtienen desde `clubes_mapaTodos.asp` (están ofuscadas
  con un `charCodeAt`, se revierte con el mismo algoritmo que ya está en la página).
- Rate limit bajo y UA de navegador: hay Cloudflare adelante.
- **Anonimizar los nombres de jugadores en el demo.** Son personas reales y el demo va a
  estar publicado. Se conserva estructura, volumen, ratings y distribución; los nombres se
  sintetizan. Clubes, torneos y sedes sí van con datos reales — son entidades públicas.

### Fase 1 — Cara pública

El corazón del pedido: **simplificar la búsqueda**.

- **Un solo buscador global** (⌘K y lupa en mobile) sobre jugadores, clubes, torneos y ligas
  a la vez, con resultados agrupados por tipo. Postgres full-text + `pg_trgm` + `unaccent`:
  "gonzalez" encuentra "González" y "Gonzáles". Hoy hay cuatro buscadores distintos y ninguno
  tolera un acento.
- **Filtros como chips, en la URL, sin recarga**: `?prov=caba&div=5ta&desde=hoy`. La URL
  compartible no es un lujo acá — el circuito se coordina por WhatsApp y hoy no podés pasar
  un link a un resultado filtrado.
- **Adiós a los `<select>` de 330 opciones**: combobox con autocompletado para liga y club.
- **Clubes = mapa + lista sincronizados**, con el filtro que hoy falta por completo:
  distancia real desde tu ubicación, día y horario de práctica, si aceptan principiantes.
- **Torneos**: por defecto los próximos, no el año completo. Filtro por división, región,
  fecha y "tiene cupo".
- **Ficha de jugador y de club** como páginas de verdad: la del club pasa de ser una fila de
  tabla a un mini-sitio (plantel, torneos que organiza, ranking interno, horarios).
- **Ficha del torneo con el costo arriba y claro**: precio general, precio anticipado y hasta
  cuándo rige, con los datos de cobro copiables de un toque. Hoy eso está enterrado como
  texto corrido en "Más info".
- Navegación con `<Link>` prefetch, View Transitions y skeletons por segmento.
  Bottom tab bar en mobile: Torneos / Clubes / Ranking / Perfil.

### Fase 2 — Cuenta e inscripción

- Registro y perfil editable (equipamiento, foto, club).
- **Inscripción online gratuita, sin pasarela de pago.** Cada jugador abona el día del
  torneo, en efectivo o por el medio que tenga el club. La app no cobra ni concilia plata.
- Eso corre el problema de lugar: sin un pago que filtre, **el enemigo es el que se anota y
  no va**. La mecánica que importa pasa a ser:
  - **Confirmación de asistencia**: push la noche anterior — "confirmá o liberamos tu cupo".
    Sin confirmar dentro de la ventana, el lugar pasa al primero de la lista de espera.
  - **Lista de espera con promoción automática** apenas se libera un cupo. Los cupos por
    división ya existen en el modelo actual (`Cupos: 24 / Disponibles: 23`) — falta la mecánica.
  - **Historial de ausencias sin aviso**, visible para el organizador. Sin pago previo es la
    única palanca que queda para desalentar el no-show.
- El estado de pago existe igual, pero como **campo que marca el organizador el día del
  torneo** (pendiente / pagado / exento): le sirve de planilla de caja, no es un cobro.

### Fase 3 — Back-office

- Alta de torneo **clonando el anterior** (hoy se ve claramente que se recarga todo a mano
  cada vez: divisiones, horarios, mesas, precios, marca de pelotita).
- **Datos de cobro como campos, no como texto libre.** Hoy cada organizador reescribe a mano,
  en el campo "Más info", el alias, la fecha límite y la condición del descuento —
  literalmente: *"Inscripción bonificada pagando por transferencia (hasta el Jueves 17 a
  23:59hs). Alias: padua.tdm"*. Pasa a ser estructura:
  - En el **club**, una vez: medios de pago aceptados y datos de cobro (alias / CBU / titular).
  - En el **torneo**, heredados del club y editables: precio general, precio anticipado,
    fecha y hora de corte del anticipado.
  - Al clonar un torneo se arrastran solos. Nadie vuelve a tipear un alias.
  - Beneficio lateral: con la fecha de corte como dato, el recordatorio sale solo
    ("vence el jueves 23:59") y el listado puede filtrar por "todavía con precio anticipado".
- Cupos, lista de espera, confirmaciones y cierre de inscripción.
- Planilla de cobro del día: marcar quién pagó a medida que llegan al club.
- Generación de zonas/fixture y **carga de resultados desde el celular del juez de mesa**,
  con confirmación del jugador. Doble validación = menos errores de carga.
- Recálculo de rating como job en el worker, con historial auditable.
- Roles: admin TMT, organizador de liga, delegado de club, juez.

### Fase 4 — PWA y tiempo real

- Manifest + service worker. Instalable.
- **Offline útil, no decorativo**: el torneo al que estás inscripto, tu perfil y el ranking
  quedan cacheados. En los clubes el 4G anda mal — este es el caso de uso real.
- **Web Push**, que es donde está el mayor salto de valor: "se abrió la inscripción del
  torneo de tu club", "quedan 2 cupos en 5ta", "te toca en la mesa 3", "tu rating cambió".
- **Torneo en vivo con Supabase Realtime**: el fixture y el contador de cupos se actualizan
  solos suscribiéndose a la tabla, sin construir un canal de websockets propio.
  Hoy los resultados aparecen cuando
  alguien los sube después.

---

## Ideas que hoy la web no ofrece

Ordenadas por (valor para el usuario ÷ esfuerzo). Las primeras cinco son las que venden el proyecto.

| # | Idea | Por qué |
|---|---|---|
| 1 | Push: apertura de inscripción, últimos cupos, tu turno, cambio de rating | Es el motivo por el que alguien instala la app y vuelve |
| 2 | Confirmación de asistencia + liberación automática del cupo + lista de espera | Sin pago previo, el no-show es el problema real del organizador |
| 3 | "Dónde jugar hoy": geolocalización + horarios + acepta principiantes + precio | Hoy son 300 clubes en una lista sin filtro |
| 4 | Perfil compartible con imagen OG generada ("subí 112 puntos") | Crecimiento orgánico por WhatsApp e Instagram, gratis |
| 5 | Onboarding para el que nunca jugó: dónde estás → clubes cerca → qué división te toca → primer torneo | Hoy "Cómo Participar" es un muro de texto |
| 6 | Simulador de rating interactivo ("si le ganás a este, quedás en X") | `calculopuntaje.asp` ya existe pero es estático |
| 7 | Gráfico de evolución del rating | Hoy solo se ve el número de hoy y la variación |
| 8 | Head-to-head accesible desde cualquier par de jugadores, con racha e historial | Hoy existe pero escondido detrás de un formulario |
| 9 | Calendario suscribible (.ics / Google Calendar) por club, división o región | Una query, un endpoint |
| 10 | Buscar rival de tu nivel cerca tuyo (rating ± 100) | El dato ya está; nadie lo explota |
| 11 | Circuito para-tenis de mesa de primera clase | Las clases 1-11 ya están en la base, hoy son un filtro escondido |
| 12 | Modo pantalla para TV del club: fixture y próximos partidos | Cae solo del fixture en vivo |
| 13 | API pública documentada | Habilita asociaciones, pantallas y bots; y es argumento de venta |

---

## Compromiso arquitectónico: el dominio no toca el framework

`lib/rating.ts`, `lib/fixture.ts` y `lib/inscripcion.ts` son **TypeScript puro**: sin imports
de Next, de Supabase ni de ningún framework. Reciben datos, devuelven datos, se testean solas.

Es la póliza de seguro de todas las decisiones de stack de arriba. Si mañana el cliente exige
infraestructura propia y hay que mudarse a Supabase autohospedado, a Postgres pelado o a un
backend NestJS, **eso se copia y pega**: se reescribe el transporte y la auth, no el negocio.
La diferencia entre un port de dos semanas y un rewrite.

---

## Verificación

- **Búsqueda**: test sobre `lib/search.ts` — "gonzalez" tiene que traer "González",
  "padua" tiene que traer el club y sus torneos. Es la lógica no trivial del proyecto,
  va con test.
- **Rating**: test de `lib/rating.ts` contra casos reales tomados de fichas del sitio actual
  (jugador con rating conocido + partidos conocidos → variación conocida). Sin esto no hay
  forma de saber si el algoritmo replica al vigente.
- **Cupos**: test de concurrencia — dos inscripciones simultáneas al último cupo, una gana,
  la otra va a lista de espera.
- **PWA / performance**: Lighthouse en `/torneos` y `/clubes` desde móvil. Objetivo
  Performance > 90 y PWA instalable. Referencia a superar: 5,2 s y 349 KB de `rankingClubes.asp`.
- **Demo end-to-end** antes de mostrarlo: buscar un club en el mapa → abrir su torneo →
  inscribirse → confirmar asistencia → verlo en la lista de inscriptos → el organizador lo
  marca como pagado, cierra la inscripción y carga un resultado → el rating se actualiza.

---

## Deliberadamente afuera de la v1

- **Cobro online.** Decisión del negocio: se paga en el club. Si alguna vez se quisiera, el
  punto de enganche ya está: el estado de pago de la inscripción.
- **Apps nativas.** La PWA cubre instalación y push. Se agregan si hay una razón que la PWA
  no cubra, no antes.
- **Sincronización con el sistema viejo.** No hay acceso; si el proyecto avanza, se replantea
  con la base real a la vista.
- **Motor de búsqueda dedicado** (Meilisearch/Typesense). Postgres full-text alcanza y sobra
  para ~35 mil jugadores. Se migra si la búsqueda mide mal, no por las dudas.
- **i18n.** El circuito es argentino. Se agrega cuando alguien lo pida.
