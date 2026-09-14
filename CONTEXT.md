# TMT

Circuito amateur de tenis de mesa de Argentina. Los clubes organizan torneos en sus propias
sedes; los jugadores se anotan en divisiones y compiten por un rating único y global.

## Language

### El todo

**Circuito**:
El conjunto del sistema: todos los Clubes, Ligas, Torneos y Jugadores bajo un mismo Rating y un
mismo Ranking. Es también donde viven los parámetros globales, como cuántas Divisiones hacia
arriba habilita la Elegibilidad. Nunca es sinónimo de Liga.
_Avoid_: sistema, plataforma

### Personas y entidades

**Jugador**:
Persona con un código numérico público y un rating, afiliada a un Club.
_Avoid_: usuario, socio, atleta

**Club**:
Entidad con sede física y plantel de jugadores, que además organiza torneos en su propio lugar.
_Avoid_: sede, institución

**Organizador**:
Persona responsable de un Torneo. Es siempre una persona con nombre y apellido, nunca el Club.
_Avoid_: club organizador, responsable

**Juez general**:
Persona a cargo del arbitraje de un Torneo.
_Avoid_: árbitro, juez de mesa

### Cómo se agrupan los clubes

**Región**:
Agrupación geográfica de Clubes. Cuelga del Club, nunca de la Liga ni del Torneo.
_Avoid_: zona, área

**Asociación**:
Entidad institucional que agrupa Clubes. Eje paralelo e independiente de la Región: un Club
tiene una Región y puede tener una Asociación, y las dos cosas no se implican.
_Avoid_: federación, entidad madre

### Competencia

**Liga**:
Serie recurrente de Torneos con nombre propio y ediciones numeradas, corrida casi siempre en
un mismo Club. Un Club puede correr varias Ligas en paralelo, y el nombre de una Liga puede no
corresponder a ningún Club. No tiene ranking ni rating propio: solo agrupa Torneos.
_Avoid_: circuito, serie, temporada

**Edición**:
Número de orden de un Torneo dentro de su Liga.
_Avoid_: fecha, jornada

**Torneo**:
Competencia organizada por un Club en su Sede, perteneciente a una Liga, con un conjunto de
Divisiones. Varios Torneos pueden ocurrir el mismo día en Clubes distintos; el Jugador elige uno.
_Avoid_: evento, fecha, competencia

**Sede**:
Lugar físico donde se juega un Torneo, con dirección. Normalmente la del Club organizador.
_Avoid_: local, lugar, cancha

**División**:
Unidad inscribible de un Torneo, definida globalmente por TMT con una banda de rating. El Club
organizador **elige cuáles abre** en su Torneo y les fija cupo y horario de inicio, pero no las
inventa: una misma División significa lo mismo en cualquier Club. Las divisiones etarias
(Sub-9 … Maxi-65) y las clases de para-tenis de mesa (1-11) son Divisiones hermanas de las de
rating, con un requisito de elegibilidad propio.
_Avoid_: categoría, serie, clase

**Elegibilidad**:
Regla que determina en qué Divisiones puede inscribirse un Jugador. Puede jugar la División que
le corresponde por Rating o alguna superior, nunca una inferior. Cuántas Divisiones por encima
se permiten es un parámetro del circuito, configurable globalmente, no una constante.
_Avoid_: habilitación, permiso

**Cupo**:
Cantidad máxima de inscriptos de una División. Se configura por División, nunca por Torneo.
_Avoid_: vacante, plaza

**Inscripción**:
Anotación de un Jugador en una División. Es gratuita y no implica pago: el cobro ocurre fuera
del sistema, el día del torneo. Un Jugador puede tener varias Inscripciones en un mismo Torneo,
en Divisiones distintas.
_Avoid_: registro, anotación

### La aplicación

**Sección**:
Cada una de las partes en las que se divide la aplicación: Inicio, Torneos, Clubes, Ranking,
Jugadores y Perfil. Cuatro de ellas —Torneos, Clubes, Ranking y Perfil— tienen lugar en la barra
inferior del teléfono; a las otras se llega desde adentro. Una ficha pertenece a su Sección:
`/clubes/san-lorenzo` es Clubes. Es un término de navegación, no de dominio: no existe fuera de
la interfaz.
_Avoid_: pestaña, solapa, pantalla

### Puntaje

**Rating**:
Puntaje numérico de un Jugador, que varía con los resultados de sus partidos.
_Avoid_: puntaje, ranking

**Ranking**:
Ordenamiento de Jugadores o de Clubes por Rating en un momento dado. Es **único y global**
para todo el circuito: no existe ranking por Liga. Distinto de Rating: el Rating es el número,
el Ranking es la posición.
_Avoid_: tabla, posiciones

**Variación**:
Diferencia entre el Rating actual de un Jugador y el del último corte mensual. El Rating cambia
apenas se carga un resultado; la Variación se mide siempre contra el corte.
_Avoid_: delta, cambio, evolución
