import { expect, test } from "vitest";

import { SECCIONES, SECCIONES_DE_LA_BARRA, seccionActiva } from "./navegacion";

test("la barra inferior lleva Torneos, Clubes, Ranking y Perfil, en ese orden", () => {
  expect(SECCIONES_DE_LA_BARRA.map((seccion) => seccion.titulo)).toEqual([
    "Torneos",
    "Clubes",
    "Ranking",
    "Perfil",
  ]);
});

test("Inicio y Jugadores son Secciones, pero no tienen lugar en la barra", () => {
  const fuera = SECCIONES.filter((seccion) => !seccion.enLaBarra).map((s) => s.titulo);

  expect(fuera).toEqual(["Inicio", "Jugadores"]);
});

test("la ruta de una Sección marca activa esa Sección", () => {
  expect(seccionActiva("/clubes")?.titulo).toBe("Clubes");
});

test("la ficha de un Club mantiene activa la Sección Clubes", () => {
  expect(seccionActiva("/clubes/san-lorenzo")?.titulo).toBe("Clubes");
});

// Inicio cuelga de "/", que es prefijo de todo: sin el caso exacto se comería las demás rutas.
test("Inicio queda activa solo en la raíz, no en el resto de las Secciones", () => {
  expect(seccionActiva("/")?.titulo).toBe("Inicio");
  expect(seccionActiva("/torneos")?.titulo).toBe("Torneos");
});

test("una ruta que no cuelga de ninguna Sección no marca ninguna", () => {
  expect(seccionActiva("/mi-torneo")).toBeUndefined();
});
