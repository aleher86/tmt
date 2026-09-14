import "../load-env";

import { pathToFileURL } from "node:url";

import { conConexion, type Database } from "../../lib/db/client";
import { circuito } from "../../lib/db/schema";
import { databaseUrl } from "../../lib/db/url";

/**
 * Los parámetros con los que arranca el Circuito. `divisionesHaciaArriba` en 1 es un valor de
 * partida, no un dato conocido de TMT: por eso vive en la base y no en el código.
 */
export const CIRCUITO_INICIAL = {
  id: 1,
  nombre: "Pique",
  divisionesHaciaArriba: 1,
} as const;

/**
 * La semilla manda: si el valor de acá cambia, sembrar lo lleva a la base aunque la fila ya
 * exista. Con `do nothing` una base sembrada hace semanas se quedaría con el valor viejo para
 * siempre, y "levantar y quedar listo" dejaría de ser cierto.
 */
export async function sembrarCircuito(db: Database) {
  await db
    .insert(circuito)
    .values(CIRCUITO_INICIAL)
    .onConflictDoUpdate({
      target: circuito.id,
      set: {
        nombre: CIRCUITO_INICIAL.nombre,
        divisionesHaciaArriba: CIRCUITO_INICIAL.divisionesHaciaArriba,
        actualizadoEn: new Date(),
      },
    });
}

export function sembrarCircuitoEn(url: string) {
  return conConexion(url, sembrarCircuito);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await sembrarCircuitoEn(databaseUrl());
  console.log("  parámetros del Circuito sembrados");
}
