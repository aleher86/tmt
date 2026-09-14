import "../load-env";

import postgres from "postgres";

import { BASE_DE_TESTS, databaseUrl, testDatabaseUrl } from "../../lib/db/url";
import { sembrarCircuitoEn } from "../seed/circuito";
import { migrar } from "./migrar";

/**
 * La base de tests vive en la misma instancia de Postgres que la de desarrollo, pero es otra
 * base: correr los tests no borra los datos con los que se estaba mirando la interfaz.
 */
async function crearSiFalta() {
  const admin = postgres(databaseUrl(), { prepare: false, max: 1, onnotice: () => {} });
  try {
    const existe = await admin`SELECT 1 FROM pg_database WHERE datname = ${BASE_DE_TESTS}`;
    if (existe.length === 0) {
      // CREATE DATABASE no puede ir dentro de una transacción, de ahí el `unsafe`.
      await admin.unsafe(`CREATE DATABASE "${BASE_DE_TESTS}"`);
      console.log(`  base de tests "${BASE_DE_TESTS}" creada`);
    }
  } finally {
    await admin.end({ timeout: 5 });
  }
}

/** Deja la base de tests existente, migrada y sembrada. Idempotente. */
export async function prepararBaseDeTests() {
  await crearSiFalta();
  await migrar(testDatabaseUrl(), "tests");
  await sembrarCircuitoEn(testDatabaseUrl());
}
