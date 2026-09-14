import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Parámetros globales del Circuito. Es una tabla de una sola fila.
 *
 * `divisionesHaciaArriba` es el tope de Divisiones por encima de la que le corresponde por
 * Rating en las que un Jugador puede inscribirse. No sabemos cuál es el valor real en TMT, y
 * por eso es un dato y no una constante en el código (ver `CONTEXT.md`, "Elegibilidad").
 *
 * RLS queda habilitada y sin políticas: deny-by-default, como segunda línea. La autorización
 * de verdad vive en el servidor. Ver ADR-0002.
 */
export const circuito = pgTable(
  "circuito",
  {
    id: integer().primaryKey(),
    nombre: text().notNull(),
    divisionesHaciaArriba: integer().notNull(),
    actualizadoEn: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("circuito_fila_unica", sql`${t.id} = 1`)],
).enableRLS();

export type Circuito = typeof circuito.$inferSelect;
