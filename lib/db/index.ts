import { createDb, type Database } from "./client";
import { databaseUrl } from "./url";

// En desarrollo Next recarga los módulos en cada cambio; sin esto cada recarga abriría un pool
// nuevo contra Postgres hasta agotarle las conexiones. En producción el módulo se evalúa una
// sola vez, pero cachear igual es lo que garantiza que haya un pool y no uno por llamada.
const cacheGlobal = globalThis as typeof globalThis & { __piqueDb?: Database };

/**
 * El pool se abre la primera vez que alguien pide la base, no al importar este módulo: así
 * `next build` puede recolectar las páginas sin que exista una base a la que conectarse.
 */
export function getDb(): Database {
  cacheGlobal.__piqueDb ??= createDb(databaseUrl()).db;
  return cacheGlobal.__piqueDb;
}

export type { Database };
