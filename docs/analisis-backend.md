# TMT — Supabase vs. NestJS + Fastify

## Aclaración previa: no compiten en la misma capa

Conviene separarlo antes de comparar, porque si no la discusión se enreda:

- **Supabase** es *infraestructura*: Postgres administrado + Auth + Storage + Realtime + RLS.
- **NestJS + Fastify** es *un lugar donde poner tu código*: framework HTTP con DI, módulos y guards.

Se pueden combinar (Nest hablándole a Postgres de Supabase). La decisión real que estás
tomando es otra:

> **¿Compro auth, storage y realtime hechos, o los construyo? ¿Y quiero uno o dos deployables?**

Eso es lo que se compara acá.

---

## Qué pide este proyecto en concreto

No es un CRUD, pero tampoco es un banco. Del relevamiento del sitio actual:

| Necesidad | Peso |
|---|---|
| Lectura pública con SEO (rankings, fichas, torneos, clubes) | **Alto** — es el 90% del tráfico y hoy Google los indexa |
| Login y recuperación de clave para ~35 mil jugadores | Alto, pero es trabajo *indiferenciado* |
| Fotos y videos de jugadores, logos de clubes, flyers | Medio — el modelo actual ya tiene "Multimedia" |
| Lógica de dominio real: rating, fixture, cupos, lista de espera | **Alto** — acá sí hay invariantes que romper |
| Concurrencia sobre el último cupo | Alto — dos inscripciones simultáneas, una gana |
| Tiempo real: fixture en vivo, cupos que bajan | Medio-alto |
| Jobs: recálculo de rating, recordatorios, liberar cupos, push | **Alto** |
| Matriz de roles (admin TMT / organizador de liga / delegado de club / juez) | Alto y **anidada**: el juez carga resultados *de su torneo*, el delegado edita *su club* |
| API pública read-only | Medio |
| Volumen | **Bajo.** ~35k jugadores, picos los viernes a la noche. Miles de req/min, no millones |

Ese último renglón condiciona todo lo que sigue.

---

## Opción A — Next.js + Supabase

### A favor

- **Auth resuelto.** Email+password, magic link, OAuth, reset de clave, verificación,
  rate limiting. Son 2-3 semanas de trabajo que no aportan un gramo de diferenciación y que,
  si salen mal, no son un bug: son un incidente de seguridad.
- **Storage resuelto.** Subida, signed URLs, transformación de imágenes. El sitio necesita
  fotos de jugadores y flyers; hoy eso vive tirado en `/imagenes/banners/`.
- **Realtime casi gratis.** Es replicación lógica de Postgres a websockets: el fixture en vivo
  y el contador de cupos salen de suscribirse a una tabla, no de construir un canal.
- **Es Postgres de verdad.** No es un datastore propietario. Drizzle, migraciones, window
  functions para los rankings, `pg_trgm` y `unaccent` para el buscador. **Los datos son
  portables desde el día uno.**
- **`pg_cron` + `pg_net`** cubren los jobs periódicos sin infraestructura extra.
- **Costo cero mientras el proyecto no esté vendido.** Nada menor: esto es trabajo a riesgo.

### En contra

- **RLS es la trampa.** Si dejás que el browser hable directo con Postgres, tu autorización
  vive en políticas SQL. Con la matriz de roles anidada de este proyecto eso se vuelve difícil
  de leer, difícil de testear, y un error ahí es una fuga de datos.
- **Las Edge Functions (Deno, con límite de tiempo) no son el lugar** para recalcular el rating
  de 35 mil jugadores ni para generar fixtures.
- **Acoplamiento en la periferia.** La base es portable, pero la tabla `auth.users`, las URLs
  de Storage y las políticas RLS no se mudan solas.

### Cómo lo usaría (importa más que el "a favor / en contra")

**No** como "browser → RLS → Postgres". Como **Postgres administrado + Auth + Storage +
Realtime**, con **todas las escrituras pasando por código de servidor** en Next.js
(Server Actions / route handlers). RLS queda como segunda línea, deny-by-default.

Así te quedás con lo bueno (auth y storage regalados) y evitás lo malo (la autorización del
negocio dispersa en veinte políticas SQL).

---

## Opción B — Next.js + NestJS (Fastify) + Postgres

### A favor

- **Hay dominio real que modelar.** Motor de rating, generación de fixture, asignación de
  cupos con transacciones, promoción de lista de espera. Nest te da módulos, DI y servicios
  testeables. Este proyecto tiene bastante más lógica que un ABM.
- **Autorización como código.** Guards y policies en TypeScript, con tests unitarios. Para la
  regla "el juez solo carga resultados de su torneo" esto es mucho más sano que RLS.
- **Jobs de primera clase.** BullMQ se integra limpio: recálculo de rating, push, recordatorios,
  liberación de cupos. Es exactamente el punto donde Supabase se pone incómodo.
- **La API pública sale sola**, con OpenAPI/Swagger generado de los decoradores.
- **Portabilidad de infraestructura.** Un contenedor corre en cualquier lado. **Y esto pesa
  acá**: si el interesado termina siendo una federación o un municipio, es muy común que
  exijan hosting propio u on-prem. Supabase gestionado ahí es una discusión; un contenedor no.

### En contra

- **Construís la auth vos.** Passport, refresh tokens, reset por mail, verificación, rate
  limiting. Semanas de trabajo indiferenciado y una superficie de error que no querés estrenar.
- **Construís storage, realtime y scheduler** también.
- **Dos deployables.** Dos pipelines, CORS, tipos compartidos, un cliente para el front,
  versionado entre ambos. Para una persona sola es puro peaje.
- **El boilerplate de Nest es real.** Módulos, DTOs, mappers. Rinde con equipo; con un dev
  solo es impuesto.
- **Necesita un proceso vivo** (Railway / Fly / Render / VPS). Más ops, más costo fijo.

### Sobre Fastify puntualmente

Fastify rinde ~2x Express en req/s. **Es irrelevante en este proyecto.** El cuello de botella
va a ser una query de ranking o el recálculo, nunca el parseo HTTP: hablamos de miles de
requests por minuto en el pico de un viernes, no de millones. Si elegís Nest, elegilo por
estructura y portabilidad — no por Fastify. Y tené en cuenta que `@nestjs/platform-fastify`
tiene fricción menor con paquetes del ecosistema que asumen Express, sobre todo en upload de
archivos.

---

## Comparación directa

| | Supabase | NestJS + Fastify |
|---|---|---|
| Auth | Incluido | Lo construís (2-3 semanas) |
| Storage | Incluido | Lo construís |
| Realtime | Incluido | socket.io + fan-out propio |
| Jobs pesados | Flojo (`pg_cron` + worker aparte) | **Fuerte** (BullMQ) |
| Lógica de dominio compleja | Vive en Next.js, sin estructura impuesta | **Fuerte** (módulos, DI, tests) |
| Autorización anidada por rol | Riesgosa en RLS | **Fuerte** (guards testeables) |
| Deployables | 1 | 2 |
| Hosting on-prem / del cliente | Incómodo | **Trivial** |
| Costo hasta vender | **$0** | ~$10-25/mes |
| Costo en producción | ~$25-45/mes | ~$30-60/mes + tu tiempo de ops |
| Semanas hasta un demo presentable | **~4-6** | ~8-10 |
| Rendimiento a este volumen | Sobra | Sobra |

La diferencia de plata es ruido. **La diferencia real son 3-4 semanas tuyas**, todas gastadas
en plomería que el cliente no ve.

---

## Mi opinión

**Para esta etapa: Supabase.** Y no por gusto técnico, sino por la situación: el proyecto no
está vendido, lo hacés a riesgo, y lo que decide si avanza es un demo que se vea real y
completo. Cada semana puesta en escribir un flujo de recuperación de clave es una semana que
no está en el mapa de clubes, el buscador que tolera acentos o el fixture en vivo — que es lo
que efectivamente vende.

Además, contra el plan actual (Neon), Supabase es un **upgrade concreto para esta app**: Neon
te da Postgres y nada más, y acá hacen falta auth, fotos y realtime igual.

Con dos condiciones que no negociaría:

1. **Las escrituras van por código de servidor, no por RLS desde el browser.** RLS como
   defensa en profundidad, nunca como modelo de autorización principal.
2. **Un worker aparte** (Node común, no hace falta Nest) para recálculo de rating y push.
   Serverless no sirve para trabajos largos, y esto es lo único que Supabase no cubre bien.

**Cuándo cambiaría a Nest**, sin dramatismo:

- Si el cliente exige infraestructura propia. Escenario probable si es federación o municipio.
- Si el back-office crece a producto con varios devs y la falta de estructura empieza a doler.
- Si la lógica de fixture y rating se vuelve el corazón del sistema y querés aislarla del resto.

### La póliza de seguro (esto es lo importante)

La elección se vuelve barata de revertir si **la lógica de dominio no toca el framework**:

```
lib/rating.ts        ← TypeScript puro: entra estado y partidos, sale rating
lib/fixture.ts       ← TypeScript puro: entran inscriptos, sale el cuadro
lib/inscripcion.ts   ← cupos, lista de espera, promoción
```

Sin imports de Next, sin imports de Supabase, sin imports de Nest. Reciben datos, devuelven
datos, y se testean solas. Si algún día hay que mudarse a Nest, **eso se copia y pega**: lo
que se reescribe es el transporte y la auth, no el negocio. Es la diferencia entre un port de
dos semanas y un rewrite.

Es también, casualmente, la razón por la que los tests de `rating.ts` e `inscripcion.ts`
figuran en el plan: son lo único que no se puede rehacer rápido si sale mal.


---

# Anexo — Neon vs. Supabase, y por qué el plan decía Neon

*(verificado en septiembre 2026; son productos que se mueven rápido, revisar antes de decidir)*

## No son el mismo tipo de producto

Esta es la confusión de fondo y conviene despejarla primero:

- **Neon** compite en **cómo se ejecuta Postgres**. Separa storage de compute, y de ahí saca
  scale-to-zero y *branching* copy-on-write: una rama de la base por cada PR, con datos de
  producción, en segundos. Es una idea muy buena. Pero es **solo Postgres**.
- **Supabase** compite en **qué viene alrededor de Postgres**. Es Postgres común (nada de
  arquitectura exótica) más Auth, Storage, Realtime, PostgREST y Studio.

Neon es más avanzado *como base de datos*. Supabase es más completo *como plataforma*.

## Autohospedaje — tu intuición era correcta

| | Neon | Supabase |
|---|---|---|
| Licencia del core | Apache 2.0 | Apache 2.0 / MIT |
| ¿Se puede self-hostear? | **En la práctica, no** | **Sí, en serio** |
| Estado | Marcado **experimental**, no recomendado para producción | Docker Compose documentado + Helm chart para Kubernetes |
| Qué falta | El **control plane** (provisioning, branching, UI) es la pieza que no está abierta | Nada del core; faltan servicios *gestionados* (abajo) |
| Desarrollo local | `Neon Local`, que es un proxy al servicio cloud — no el motor | `supabase start` levanta **todo el stack** en Docker |

**Si el requisito es on-prem, Neon queda descartado.** No es una cuestión de esfuerzo: la
parte que necesitarías es justamente la que no publicaron.

### Qué perdés al autohospedar Supabase

No es gratis. Se va lo *gestionado*, no lo funcional:

- Branching, backups gestionados y **PITR** (point-in-time recovery)
- Métricas avanzadas, analytics, ETL, management API
- Es **un solo proyecto por instancia**: sin organizaciones, sin múltiples proyectos
- Logs & Analytics no vienen en el Docker Compose por defecto (se habilitan con un override
  de Logflare + Vector)
- Para alta disponibilidad, la propia doc recomienda Kubernetes o la nube — no Compose

Y pasás a ser responsable de provisioning, hardening, updates de SO y servicios,
mantenimiento de Postgres, HA, backups, disaster recovery y monitoreo. **Backups y PITR son
los que duelen**: es exactamente lo que no querés estar improvisando con la base de 35 mil
jugadores de un circuito federado.

## Estado de Neon como producto

- **Databricks lo compró en mayo de 2025** (~USD 1.000 millones). Sigue operando como producto
  standalone y el motor sigue siendo Apache 2.0.
- Post-adquisición **bajó precios fuerte**: storage de ~$1,75 a ~$0,35 por GB-mes, compute
  entre 15% y 25% menos, y se eliminó el mínimo mensual de $5.
- Free tier permanente: 0,5 GB y 100 compute-hours por proyecto por mes.
- El tier Scale sumó SOC 2 Tipo 2 y elegibilidad HIPAA.

No es una señal de alarma, pero sí es un dato: es un producto dentro de una empresa más
grande con su propia agenda, y su norte es el ecosistema de datos de Databricks.

## Por qué el plan decía Neon (y por qué estaba incompleto)

Respuesta honesta: elegiste "Next.js + Postgres" y yo fui al emparejamiento por defecto para
Vercel. El criterio fue:

- **Scale-to-zero** → costo cero real en un demo que nadie visita todavía
- **Branching** → una base por preview deploy, muy cómodo
- Es el Postgres serverless que menos fricción tiene al lado de Next.js

Ese criterio responde bien a *"necesito Postgres barato al lado de Next"*. **Es el criterio
equivocado para este proyecto**, por dos cosas que no pesé:

1. **Auth, fotos y realtime hacen falta igual.** Con Neon los construís o los contratás
   aparte. Supabase los trae. Es la mitad del argumento del análisis principal.
2. **No consideré soberanía de datos.** Con un cliente municipal o una federación, que
   exijan infraestructura propia es un escenario concreto, no paranoia. Supabase mantiene esa
   puerta abierta **sin costo hoy**; Neon la cierra.

Ese segundo punto es el que cambia la decisión: no es que Supabase se autohospede *hoy*, es
que **te da la opción gratis** por si algún día hace falta.

## Drizzle: es ortogonal, no hay que revisarlo

Drizzle no depende de esta decisión. Es un query builder que habla SQL contra cualquier
Postgres: Neon, Supabase, o uno tuyo en un VPS. Lo elegí por tres razones que siguen valiendo:

- **Las queries de ranking son window functions y agregados.** En Drizzle escribís algo muy
  cercano a SQL y conservás el tipado. En Prisma terminás en `$queryRaw` y perdés el tipado
  justo donde más lo necesitás.
- **Más liviano en serverless**, sin engine binario, mejores cold starts.
- **Es la pieza menos acoplada del stack.** Migrar de Neon a Supabase a Postgres propio es
  cambiar una connection string; las queries no se enteran.

Ese último punto es lo que hace que toda esta decisión sea barata de revertir. Drizzle es,
junto con mantener el dominio sin framework, la otra mitad de la póliza de seguro.

## Cómo lo combinaría

**Supabase + Drizzle**, con una división clara:

- **Drizzle para todas las queries**, conectando por la connection string directa (vía
  Supavisor para el pooling). No uso PostgREST ni el cliente de datos de `supabase-js`.
- **`supabase-js` solo para Auth, Storage y Realtime.**

Resultado: la capa de datos es SQL portable, te llevás auth/storage/realtime regalados, y si
un día hay que ir a on-prem las queries no cambian — solo se reemplaza el pedazo de auth.

## Y una tercera opción que no hay que olvidar

Si el cliente exige on-prem y no querés operar ocho contenedores de Supabase: **Postgres
pelado** en su infraestructura, más la app. Perdés auth/storage/realtime otra vez, pero para
ese momento ya vas a saber si de verdad los necesitás y cuánto valen. Es la salida más
simple, y conviene tenerla en el bolsillo antes que descubrirla tarde.

## Para el demo, igual: nada de autohospedar

Supabase cloud, free tier. El autohospedaje es una pregunta para el día en que haya un cliente
que lo pida. Lo único que importa hoy es no cerrarse esa puerta — y esa es, resumida, la razón
para cambiar Neon por Supabase en el plan.
