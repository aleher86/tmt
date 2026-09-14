# Drizzle es el dueño de las migraciones; el CLI de Supabase no las aplica

Las migraciones se generan desde `lib/db/schema.ts` con `drizzle-kit`, viven en `drizzle/` y se
aplican con el migrador de Drizzle. En `supabase/config.toml` queda `[db.migrations] enabled =
false` y `supabase/migrations/` no existe.

La razón es que hay dos herramientas que saben aplicar migraciones y tener las dos activas
significa que cada archivo se aplica dos veces o ninguna, según cuál corrió primero: el CLI de
Supabase aplica `supabase/migrations/` al arrancar el stack, pero no escribe en la tabla de
control de Drizzle, así que el migrador de Drizzle después intenta correr lo mismo de nuevo.
Elegimos Drizzle porque es la herramienta que ya define el schema —una sola fuente, un solo
lenguaje— y porque aplicar migraciones contra una connection string es lo mismo en local, en la
base de tests y en la nube, sin depender del CLI.

## Consequences

- La base de tests se migra con el mismo código que la de desarrollo: es una llamada más al
  migrador con otra URL. Ver `scripts/dev/base-de-tests.ts`.
- `supabase db reset` vacía la base pero ya no la reconstruye: lo que la reconstruye es
  `pnpm db:migrate`, que es lo que `pnpm dev` corre igual en cada arranque.
- Como en [ADR-0002](./0002-escrituras-por-servidor.md), un lector que venga de la documentación
  de Supabase va a buscar `supabase/migrations/` y no encontrarlo. No falta: está en `drizzle/`.
