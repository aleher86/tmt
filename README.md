# Pique

Demo funcional del circuito amateur de tenis de mesa de Argentina. No es la v1 de un producto:
es el artefacto que consigue la reunión. El alcance real está en [`docs/plan-tmt.md`](docs/plan-tmt.md).

## Arranque

Lo único que hace falta a nivel máquina es **Docker corriendo** y **Node 22**. El CLI de
Supabase viene como dependencia del proyecto.

```sh
corepack enable   # una sola vez: habilita pnpm
pnpm install
pnpm dev          # levanta el stack local, migra, siembra y arranca la app
```

La app queda en <http://localhost:3000> y Supabase Studio en <http://localhost:54323>.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Todo lo anterior de una. Es el único comando que hace falta saberse. |
| `pnpm test` | Suite completa. Los tests de base van a `pique_test`, no a la de desarrollo. |
| `pnpm typecheck` | `tsc --noEmit`. |
| `pnpm db:generate` | Genera una migración a partir de `lib/db/schema.ts`. |
| `pnpm db:migrate` | Aplica las migraciones a las dos bases. |
| `pnpm db:seed` | Vuelve a sembrar. |
| `pnpm db:start` / `pnpm db:stop` | Levanta y apaga el stack local por separado. |

## Cómo está armado

- **Next 15 (App Router)**, Server Components para todo lo que es lectura.
- **Supabase local** para Postgres, Auth y Storage. La config vive versionada en
  [`supabase/config.toml`](supabase/config.toml) y deja afuera Realtime, Edge Runtime,
  analítica y PostgREST: la Fase 1 no los usa y el de analítica es el que más memoria consume.
- **Drizzle** para todas las queries y también para las migraciones, en `drizzle/`. El CLI de
  Supabase no aplica migraciones (`[db.migrations] enabled = false`): hay un solo sistema y es
  el mismo que define el schema.
- **Dos bases en la misma instancia de Postgres**: `postgres` para desarrollo y `pique_test`
  para la suite. La URL de tests se deriva de la de desarrollo en
  [`lib/db/url.ts`](lib/db/url.ts), no se configura aparte, así la suite no puede terminar
  apuntada a la base con la que se estaba mirando la interfaz.

## Contexto

- Vocabulario del dominio: [`CONTEXT.md`](CONTEXT.md)
- Decisiones de arquitectura: [`docs/adr/`](docs/adr/)
- Plan completo y diagnóstico del sitio actual: [`docs/plan-tmt.md`](docs/plan-tmt.md)
