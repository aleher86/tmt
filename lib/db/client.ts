import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Todas las queries van por Drizzle contra la connection string directa. `supabase-js` queda
 * reservado a Auth, Storage y Realtime. Ver ADR-0001.
 */
export function createDb(url: string, opciones: { max?: number } = {}) {
  // `prepare: false` es obligatorio detrás del pooler en modo transacción de Supavisor.
  const client = postgres(url, {
    prepare: false,
    max: opciones.max ?? 10,
    // Los NOTICE de Postgres ("ya existe, salteando") ensucian la salida de cada migración
    // y no dicen nada que el código pueda accionar.
    onnotice: () => {},
  });
  const db = drizzle(client, { schema, casing: "snake_case" });
  return { db, client, cerrar: () => client.end({ timeout: 5 }) };
}

export type Database = ReturnType<typeof createDb>["db"];

/**
 * Abre una conexión de una sola vía, corre `tarea` y la cierra pase lo que pase. Es la forma
 * de los scripts que corren una cosa y se van: migrar, sembrar, preparar la base de tests.
 */
export async function conConexion<T>(
  url: string,
  tarea: (db: Database) => Promise<T>,
): Promise<T> {
  const { db, cerrar } = createDb(url, { max: 1 });
  try {
    return await tarea(db);
  } finally {
    await cerrar();
  }
}
