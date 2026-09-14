# Los datos del demo se generan, no se importan

El demo se publica sin acceso a la base de TMT y con datos de personas reales de por medio. En
vez de scrapear e importar las ~35.000 fichas de jugador con sus partidos, se scrapean solo las
entidades públicas —clubes con coordenadas, torneos con sus divisiones, cupos, horarios y
precios, ligas y regiones— más una muestra de ~200 fichas usada **únicamente** para calibrar
distribuciones. Los jugadores y todos sus partidos se generan en `scripts/seed/`.

La razón no es solo legal: 35.000 jugadores generados se ven exactamente igual de convincentes
que 35.000 scrapeados, y el scraping acotado ahorra días de trabajo y de pelea con Cloudflare.
Lo que no se puede fingir —y por eso sí se baja— son las coordenadas reales de los clubes.

## Consequences

- **El orden de generación es parte de la decisión, no un detalle.** Rating objetivo desde la
  distribución real → calendario y partidos simulados → el rating mostrado **emerge** de correr
  `lib/rating.ts` sobre esos partidos. Generar partidos al azar y asignar ratings aparte produce
  fichas que se contradicen entre sí: el % de ganados no cierra, el gráfico de evolución es ruido
  y el head-to-head miente. Cualquiera que abra dos fichas en una reunión lo nota.
- **Los nombres se generan, nunca se toman de lo scrapeado** — ni siquiera barajados entre sí:
  eso sería publicar nombres reales. Que por azar exista un homónimo de una persona real no
  identifica a nadie, porque ni su club, ni su rating, ni sus partidos son los de esa persona.
- **Las fechas se guardan relativas** y se convierten a absolutas al sembrar, para que el demo no
  envejezca y siga mostrando torneos próximos meses después de la reunión.
- No hay ni va a haber un importador desde el sitio viejo en este repo. Si el proyecto avanza y
  aparece la base real, esa es una decisión nueva que se toma con los datos a la vista.
