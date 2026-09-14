import "../load-env";

import { migrate } from "drizzle-orm/postgres-js/migrator";

import { conConexion } from "../../lib/db/client";

const CARPETA_DE_MIGRACIONES = "drizzle";

/**
 * Las migraciones las genera y las aplica Drizzle, no el CLI de Supabase. Ver ADR-0005.
 */
export function migrar(url: string, etiqueta: string) {
  return conConexion(url, async (db) => {
    await migrate(db, { migrationsFolder: CARPETA_DE_MIGRACIONES });
    console.log(`  migraciones aplicadas en ${etiqueta}`);
  });
}
