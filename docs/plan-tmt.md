# Pique — demo para tenisdemesaparatodos.com

## Qué es esto

**No es la v1 de un producto. Es una demo para conseguir una reunión.**

`tenisdemesaparatodos.com` (TMT) es el circuito amateur de tenis de mesa más grande de
Argentina: ~330 clubes registrados, 329 ligas, 20 regiones, divisiones de Sub-9 a Maxi-65 y
para-tenis de mesa clases 1-11. El dominio es riquísimo. **La plataforma que lo sostiene es de
2005.**

No hay contacto con el dueño ni acceso a la base. El objetivo es construir algo **funcional y
demostrable**, presentarlo, y ver si hay interés en reemplazar el sistema actual. Eso condiciona
todo: tiene que verse real —datos reales, volumen real— sin depender de una migración que hoy no
podemos hacer.

**Corte duro: 4-6 semanas, Fases 0 y 1.** Las fases siguientes se deciden *después* de la
primera reunión, con lo que esa reunión enseñe. Construir el back-office antes de hablar con un
organizador es apostar meses a suposiciones.

**A quién se le muestra**: primero al dueño de TMT, porque tiene los datos y sin datos no hay
producto. Pero la demo se arma de modo que sirva también para el plan B — 330 organizadores de
liga y delegados de club — donde el argumento cambia de *"tu sitio es viejo"* a *"dejá de perder
cupos con gente que no aparece"*.

**Marca y publicación**: marca propia, **Pique**, en un subdominio `.vercel.app` con `noindex` y
un banner permanente de propuesta no oficial. Sin comprar dominio y sin usar el logo de TMT: usar
la marca ajena en algo publicado es lo que convierte "propuesta" en "clon" a los ojos de la
persona que hay que convencer. Antes de publicar nada, un mail corto al dueño avisando que se
está armando una propuesta: si contesta, ganamos acceso y legitimidad; si no, queda como
constancia de buena fe.

El vocabulario del dominio vive en [`CONTEXT.md`](../CONTEXT.md). Las decisiones de arquitectura,
en [`docs/adr/`](./adr/). El análisis que originó la elección de stack, en
[`analisis-backend.md`](./analisis-backend.md) — se deja intacto a propósito: su valor es haber
sido escrito antes de decidir.

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
| `clubes.asp` sin buscador | 312 KB en una página; los únicos `<input>` son los del login |
| `rankingClubes.asp` lento | **5,2 s** de respuesta, 349 KB |
| Mapa con datos incrustados | llamadas `addMarker(...)` hardcodeadas en el HTML, Leaflet 1.3.1 |
| Filtros dependientes rotos | en `ranking.asp` los selects `fProv` y `fLoc` solo ofrecen "Todas" |
| Selects de cientos de opciones | `filtroLiga` en `torneos.asp` (329), `fClub` en `ranking.asp` (333) |
| Código muerto | popup con fecha de corte de **2015**; TrustLogo de Comodo vía `document.write` |
| El sitio no toca plata (y está bien) | "inscripción online" = anotarse, no pagar. El descuento es por anticipación; el alias de transferencia lo escribe el organizador como texto libre en "Más info" |
| Sin PWA | sin manifest, sin service worker |

### Corrección al relevamiento inicial

Tres datos que el plan anterior tenía mal y se verificaron contra el sitio:

- **La Liga no es el Club.** `filtroLiga` tiene 329 opciones y `fClub` 333, pero solo **64
  nombres coinciden**, y de 280 IDs presentes en ambos selects **270 tienen nombre distinto**:
  son espacios de IDs separados. Una Liga es una **serie recurrente de torneos con ediciones
  numeradas** — `torneos.asp?filtroLiga=156` devuelve 119 torneos de "Ciudad Feliz II", del 1°
  (2015) al 120° (2026), todos en el mismo club. Un club puede correr varias ligas en paralelo
  (Alvear tiene 5, Banco Nación 4) y hay ligas cuyo nombre no es de ningún club (`Bar NTE`,
  `Amigos del Ping Pong`).
- **Las regiones son 20, no 22.** Y agrupan Clubes, nunca Ligas. Aparece además un eje
  institucional paralelo que el relevamiento no había visto: **Asociación** (`fAsoc`, 8
  entidades: FeTeMBA, Asoc. Civil Norte, Salteña, Santiagueña, Jujuy, Tucumanos, Balcarce, ZN).
- **El ranking es único y global.** No existe página ni parámetro de ranking por liga;
  `ranking.asp` ni siquiera tiene select de liga. La Liga agrupa torneos, no puntaje.
- **Clubes: 333 registrados, ~132 adheridos activos.** A confirmar al scrapear. Si el mapa son
  132 puntos y no 330, el argumento de volumen cambia y conviene saberlo antes de la reunión.

Lo que **sí** hay que respetar, porque es el activo real:

- **Jugador**: código, rating, variación, posición, club, madera/gomas/mano hábil, edad,
  nacionalidad, residencia, multimedia, torneos y partidos jugados, % ganados, podios,
  head-to-head.
- **Torneo**: divisiones con horario/mesas/**cupos en vivo**, sede, precio general vs. online,
  marca/estrellas/color/material de la pelotita, juez general, organizador, lista de inscriptos
  con timestamp al segundo.
- **Rankings**: jugadores, clubes, variación mensual. Calendario. Noticias. Interescuelas.

---

## Arquitectura

Un solo repo, una sola app. Sin microservicios, sin API separada para el propio front.
Las tres decisiones estructurales están en ADRs: [0001](./adr/0001-supabase-y-drizzle.md)
(Supabase + Drizzle), [0002](./adr/0002-escrituras-por-servidor.md) (escrituras por servidor,
RLS como segunda línea), [0003](./adr/0003-dominio-sin-framework.md) (el dominio no toca el
framework).

- **Next.js 15 (App Router)** en Vercel. Server Components para todo lo que es lectura →
  HTML rápido y SEO, que hoy el sitio tiene por accidente y conviene no perder.
- **Supabase** como Postgres administrado + Auth + Storage. En la Fase 1, Storage se usa desde el
  día uno (escudos de club, fotos) y Auth se usa **de verdad** para las cuentas demo: sesión real
  con usuarios sembrados y un botón "entrar como…", no una cookie falsa. Cuesta casi lo mismo y
  evita escribir dos veces el chequeo de permisos.
- **Drizzle para todas las queries**, por connection string directa vía Supavisor.
- **Server Actions** para las mutaciones. Nada de capa REST intermedia para consumo propio.
- **MapLibre GL + tiles de Protomaps o Carto**, no Google Maps: sin API key, sin factura por uso,
  y los clubes se sirven como GeoJSON en vez de incrustados en el HTML.
- Realtime, worker de jobs, API pública y PWA: **no entran en la Fase 1**. Ver "Después de la
  reunión".

### El rating: no tenemos el algoritmo

De una ficha se ve el rating y la variación, no la fórmula: ni el K, ni si hay bonus por
diferencia de sets, ni qué pasa con un debutante, ni si decae por inactividad, ni cómo se tratan
los walkovers. Deducirlo desde datos scrapeados es un proyecto de investigación propio con riesgo
real de no cerrar.

**Decisión**: `lib/rating.ts` implementa un **ELO estándar parametrizable**, con todos los
parámetros en un único objeto, declarado como motor de ejemplo. Los números no van a coincidir
con los del sitio y está bien: se recalibra cuando exista la fórmula real. El mismo motor genera
los datos del demo y los sigue actualizando en vivo.

**Cadencia**: el Rating se actualiza **apenas se carga un resultado**, más un **snapshot mensual**
guardado. Eso da las dos cosas que el sitio ya tiene y no queremos perder: el número vivo y la
Variación mensual, con el ranking de clubes por mes.

Estructura:

```
app/
  (public)/  torneos/ clubes/ ranking/ jugadores/
  (cuenta)/  entrar-como/
  (admin)/   organizador/mi-torneo/
lib/    db/schema.ts  db/queries/  rating.ts  search.ts  elegibilidad.ts
scripts/scrape/       # one-off, no va a producción
scripts/seed/         # generador de datos sintéticos
```

---

## Fase 0 — Datos para el demo

Como los nombres y los resultados se sintetizan (ver abajo), scrapear 35.000 fichas y sus
partidos no tiene sentido: se tirarían. Lo irremplazable son las entidades públicas reales.

**Se scrapea**:

- Clubes con **coordenadas** — es el único dato que no se puede fingir y es el momento "wow" de
  la demo. Las coordenadas salen de `clubes_mapaTodos.asp`, ofuscadas con un `charCodeAt` que se
  revierte con el mismo algoritmo que ya está en la página.
- Torneos con sus divisiones, cupos, horarios de inicio y precios. La ficha real es
  `torneos_ampliarJugado.asp?codigo=<n>` (`torneos_ampliar.asp` redirige 302).
- Ligas con su nombre y su club habitual, y regiones.
- Una **muestra de ~200 fichas de jugador**, solo para calibrar la distribución de ratings,
  edades y tamaño de plantel. No se publica ni un dato de esa muestra.

**Cómo**: script Node one-off en `scripts/scrape/`, decodificando **latin-1** al parsear o salen
todos los acentos rotos. Rate limit bajo y User-Agent de navegador: hay Cloudflare adelante,
aunque responde bien con UA de navegador.

**Se genera** (`scripts/seed/`), en este orden, que es lo que garantiza que nada se contradiga:

1. Cada jugador recibe un rating objetivo tomado de la distribución de la muestra real.
2. Se simula su calendario de torneos y sus partidos.
3. El rating que se muestra **emerge** de correr el motor ELO sobre esos partidos.

Así la ficha, el gráfico de evolución, el % de ganados y el head-to-head cierran entre sí.
Cualquiera que abra dos fichas en la reunión lo va a notar si no cierran.

Nombres argentinos plausibles generados. **Nunca nombres tomados de lo scrapeado**, ni siquiera
barajados: eso sería publicar nombres reales. Que por azar exista un "Juan González" que también
existe en la vida real no identifica a nadie, porque ni el club, ni el rating, ni los partidos de
ese jugador son los de la persona real.

**Las fechas se guardan relativas** y se convierten a absolutas al sembrar. El reset nocturno
vuelve a correr el offset, así el demo nunca abre en "Próximos torneos: ninguno" — que sería
estar muerto antes de la primera pantalla, meses después de la reunión.

**Reset nocturno**: el seed pesado (clubes, jugadores, partidos, ratings, torneos históricos)
corre **una sola vez**. El reset toca únicamente las tablas mutables — inscripciones, estado de
pago, confirmaciones — y aplica el corrimiento de fechas.

---

## Fase 1 — La cara pública

El corazón del pedido: **simplificar la búsqueda**.

### Entra

- **Un solo buscador global** (⌘K y lupa en mobile) sobre Jugadores, Clubes, Torneos y Ligas,
  con resultados agrupados por tipo. Postgres full-text + `pg_trgm` + `unaccent`: "gonzalez"
  encuentra "González". El **código numérico del jugador matchea exacto y primero**, porque la
  gente lo tiene memorizado; después prefijo, después similitud por trigramas. Dentro de
  jugadores, desempate por rating descendente. El resultado de Liga navega al listado de torneos
  filtrado. Hoy hay cuatro buscadores distintos y ninguno tolera un acento.
- **Filtros como chips, en la URL, sin recarga**: `?prov=caba&div=5ta&desde=hoy`. La URL
  compartible no es un lujo acá — el circuito se coordina por WhatsApp y hoy no podés pasar un
  link a un resultado filtrado.
- **Adiós a los `<select>` de cientos de opciones**: combobox con autocompletado para liga y club.
- **Clubes = mapa + lista sincronizados**, con el filtro que hoy falta por completo: distancia
  real, día y horario de práctica, si aceptan principiantes. Sin permiso de ubicación: centrado
  en CABA, lista alfabética, y **"usar mi ubicación" como botón visible arriba**, no como un modal
  del navegador que la gente rechaza por reflejo. Los clubes sin coordenadas van en la lista,
  marcados, fuera del mapa.
- **Torneos**: por defecto los próximos, no el año completo. Filtro por división, región, fecha y
  "tiene cupo". Ficha con el **costo arriba y claro** —precio general, precio anticipado y hasta
  cuándo rige— con los datos de cobro copiables de un toque. Hoy eso está enterrado como texto
  corrido en "Más info".
- **Ranking de jugadores** con gráfico de evolución.
- **Ficha de jugador** con head-to-head accesible, y **ficha de club** como mini-sitio: plantel,
  torneos que organiza, horarios.
- **Mobile de verdad**: bottom tab bar (Torneos / Clubes / Ranking / Perfil), `<Link>` prefetch,
  View Transitions, skeletons por segmento.
- **Una sola pantalla de organizador**, accesible desde la cuenta demo: `mi-torneo` con lista de
  inscriptos, cupos por división y **marcar pagado — con escritura real**. Sin alta de torneo, sin
  clonado, sin fixture. Es lo único de la demo que le habla al público (b): si al tocar "pagado"
  no pasa nada, no vendiste nada. Es además el flujo que prueba que la arquitectura de escrituras
  por servidor de [ADR-0002](./adr/0002-escrituras-por-servidor.md) funciona.

### No entra

Registro abierto, alta de torneo, clonado, fixture, Web Push, tiempo real, PWA instalable.

### Si hay que recortar

El primero en caer es el gráfico de evolución del rating. El último es el mapa de clubes.

---

## Verificación

- **Buscador** — test sobre `lib/search.ts`: "gonzalez" trae "González"; "padua" trae el club y
  sus torneos; un código numérico exacto va primero. Es la lógica no trivial del proyecto.
- **Motor de rating** — test de **invariantes**, no de valores: suma cero entre los dos
  jugadores, simetría, monotonía respecto de la diferencia de rating, un jugador que gana todo
  sube y no oscila. Los invariantes valen más que un golden test acá, justamente porque no
  conocemos los números correctos: lo que se puede afirmar es que el motor se comporta como un
  rating, y eso alcanza para que el generador produzca datos coherentes.
- **Elegibilidad** — test de `lib/elegibilidad.ts`: se puede subir, no bajar, y el tope de
  divisiones hacia arriba respeta el parámetro configurado.
- **Performance** — Lighthouse en `/torneos` y `/clubes` desde móvil. Objetivo Performance > 90.
  Referencia a superar: **5,2 s y 349 KB** de `rankingClubes.asp`.
- **Demo end-to-end** antes de mostrarlo: buscar un club en el mapa → abrir su torneo → ver cupos
  y precio → entrar como organizador → marcar un pago → verlo reflejado.

El test de concurrencia sobre el último cupo se mueve a la Fase 2, junto con la inscripción real.

---

## Después de la reunión

No se planifica en detalle hasta tener feedback. El orden probable, si el proyecto avanza:

**Cuenta e inscripción.** Registro y perfil editable. Inscripción online gratuita, sin pasarela:
se paga en el club. Eso corre el problema de lugar — sin un pago que filtre, **el enemigo es el
que se anota y no va**. Lo que importa pasa a ser: confirmación de asistencia por push la noche
anterior, lista de espera con promoción automática al liberarse un cupo, e historial de ausencias
sin aviso visible para el organizador. El estado de pago existe igual, pero como campo que marca
el organizador el día del torneo: le sirve de planilla de caja, no es un cobro.

**Back-office.** Alta de torneo clonando el anterior. **Datos de cobro como campos, no como texto
libre**: hoy cada organizador reescribe a mano el alias, la fecha límite y la condición del
descuento en "Más info" — literalmente *"Inscripción bonificada pagando por transferencia (hasta
el Jueves 17 a 23:59hs). Alias: padua.tdm"*. Pasa a ser estructura: en el Club una vez los medios
y datos de cobro; en el Torneo heredados y editables. Al clonar se arrastran solos. Con la fecha
de corte como dato, el recordatorio sale solo. Más: cupos y cierre de inscripción, planilla de
cobro del día, generación de fixture, carga de resultados desde el celular del juez con
confirmación del jugador, recálculo de rating auditable, y la matriz de roles (admin TMT,
organizador de liga, delegado de club, juez).

**PWA y tiempo real.** Manifest y service worker. Offline útil, no decorativo: el torneo al que
estás inscripto, tu perfil y el ranking cacheados — en los clubes el 4G anda mal, ese es el caso
real. Web Push, que es donde está el mayor salto de valor. Torneo en vivo con Supabase Realtime.
Un **worker aparte** (Node común, Railway o Fly) para lo que serverless hace mal: recálculo de
rating, push y jobs programados.

**Ideas que hoy la web no ofrece**, ordenadas por valor ÷ esfuerzo: perfil compartible con imagen
OG generada ("subí 112 puntos"), onboarding para el que nunca jugó, simulador de rating
interactivo, calendario suscribible `.ics`, buscar rival de tu nivel cerca tuyo, circuito
para-tenis de mesa de primera clase, modo pantalla para el TV del club, y **API pública
documentada** — que habilita asociaciones, pantallas y bots, y es un argumento de venta concreto.

---

## Deliberadamente afuera

- **Cobro online.** Decisión del negocio: se paga en el club. Si alguna vez se quisiera, el punto
  de enganche ya está: el estado de pago de la inscripción.
- **Apps nativas.** La PWA cubre instalación y push.
- **Sincronización con el sistema viejo.** No hay acceso; si el proyecto avanza, se replantea con
  la base real a la vista.
- **Motor de búsqueda dedicado** (Meilisearch/Typesense). Postgres full-text alcanza y sobra para
  ~35 mil jugadores. Se migra si la búsqueda mide mal, no por las dudas.
- **i18n.** El circuito es argentino.
- **Asociación en la UI.** El concepto queda registrado en `CONTEXT.md` para no perderlo, pero no
  se construye: una asociación como FeTeMBA es interlocutor para la API pública, que es Fase 4.

---

## Lo que no sabemos, y está bien

Tres incógnitas, las tres parametrizadas o pendientes de confirmar al scrapear. Ninguna bloquea:

1. **La fórmula de rating vigente.** Mitigada con un ELO parametrizable declarado como ejemplo.
2. **Cuántas divisiones hacia arriba puede subir un jugador.** No sabemos si un octava puede
   jugar quinta. Es un **parámetro configurable global**, no una constante en el código.
3. **Cuántos clubes tiene realmente el mapa**: 333 registrados vs. ~132 adheridos activos. Se
   confirma al scrapear, antes de prometer volumen en una reunión.
