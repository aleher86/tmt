# Supabase como plataforma, Drizzle para todas las queries

El proyecto necesita Postgres, auth, fotos y tiempo real, y lo construye una sola persona a
riesgo, sin cliente y sin presupuesto. Elegimos **Supabase** —Postgres administrado más Auth,
Storage y Realtime— en vez de Neon (que es solo Postgres, y habría que sumarle auth y storage
igual) y en vez de un backend NestJS propio (que son 3-4 semanas de plomería indiferenciada que
el cliente no ve). Todas las queries se escriben con **Drizzle** contra la connection string
directa vía Supavisor: no usamos PostgREST ni el cliente de datos de `supabase-js`, que queda
reservado a Auth, Storage y Realtime.

## Considered Options

- **Neon**: mejor motor (branching, scale-to-zero), pero self-host marcado como experimental y
  con el control plane cerrado. Si algún día un municipio o una federación exige infraestructura
  propia, esa puerta queda cerrada. Supabase se autohospeda de verdad (Docker Compose, Helm).
- **NestJS + Fastify**: mejor para lógica de dominio y autorización anidada, y trivial de llevar
  on-prem. Se descarta por costo de tiempo, no por calidad. Es la opción a la que migrar si el
  cliente exige hosting propio o si el back-office crece a producto con varios devs.

## Consequences

La capa de datos queda portable: mudarse a otro Postgres es cambiar una connection string. Lo
que **no** se muda solo es la periferia — `auth.users`, las URLs de Storage y las políticas RLS.
Ver `docs/analisis-backend.md` para el análisis completo que originó esta decisión.
