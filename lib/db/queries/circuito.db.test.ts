import { afterAll, beforeAll, expect, test } from "vitest";

import { createDb, type Database } from "../client";
import { testDatabaseUrl } from "../url";
import { CIRCUITO_INICIAL } from "../../../scripts/seed/circuito";
import { obtenerCircuito } from "./circuito";

let db: Database;
let cerrar: () => Promise<void>;

beforeAll(() => {
  ({ db, cerrar } = createDb(testDatabaseUrl(), { max: 1 }));
});

afterAll(async () => {
  await cerrar();
});

test("lee los parámetros del circuito de la base", async () => {
  const leido = await obtenerCircuito(db);

  expect(leido.nombre).toBe(CIRCUITO_INICIAL.nombre);
  expect(leido.divisionesHaciaArriba).toBe(CIRCUITO_INICIAL.divisionesHaciaArriba);
});

test("la suite apunta a una base distinta de la de desarrollo", () => {
  expect(new URL(testDatabaseUrl()).pathname).toBe("/pique_test");
});
