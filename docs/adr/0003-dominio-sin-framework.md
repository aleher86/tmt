# La lógica de dominio no importa el framework

`lib/rating.ts`, `lib/fixture.ts` y `lib/inscripcion.ts` son TypeScript puro: sin imports de
Next, de Supabase ni de ningún framework. Reciben datos, devuelven datos, se testean solas.

Es la póliza de seguro de ADR-0001. Si el cliente exige infraestructura propia y hay que mudarse
a Supabase autohospedado, a Postgres pelado o a un backend NestJS, **eso se copia y pega**: se
reescribe el transporte y la auth, no el negocio. Es la diferencia entre un port de dos semanas
y un rewrite.

## Consequences

Los tests de estos módulos no son opcionales: son lo único que no se puede rehacer rápido si
sale mal, y son lo que hace verificable que el acoplamiento no se coló.
