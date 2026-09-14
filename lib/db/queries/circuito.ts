import { eq } from "drizzle-orm";

import type { Database } from "../client";
import { circuito, type Circuito } from "../schema";

/** `circuito` es una tabla de una sola fila, con `id = 1` garantizado por un CHECK. */
const FILA_UNICA = 1;

export async function obtenerCircuito(db: Database): Promise<Circuito> {
  const [fila] = await db.select().from(circuito).where(eq(circuito.id, FILA_UNICA)).limit(1);
  if (!fila) {
    throw new Error("No hay parámetros de circuito en la base. ¿Falta sembrar? `pnpm db:seed`");
  }
  return fila;
}
