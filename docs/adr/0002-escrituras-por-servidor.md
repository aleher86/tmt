# Todas las escrituras pasan por código de servidor; RLS es la segunda línea

El browser nunca escribe directo contra Postgres. Toda mutación pasa por Server Actions o route
handlers de Next.js, donde la autorización se expresa en TypeScript y se testea. **RLS queda
habilitado y deny-by-default como defensa en profundidad, nunca como el modelo de autorización
principal.**

La razón es la forma de la matriz de roles de este proyecto: es anidada. "El juez carga
resultados *de su torneo*", "el delegado edita *su club*". Expresar eso en políticas SQL es
difícil de leer, difícil de testear, y un error ahí no es un bug: es una fuga de datos.

## Consequences

Es una decisión explícita de **no** usar Supabase como la mayoría de los proyectos lo usa. Un
lector que venga de la documentación de Supabase va a ver RLS deny-by-default y asumir que falta
escribir las políticas. No faltan: la autorización vive en el servidor a propósito.
