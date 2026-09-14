import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const raiz = fileURLToPath(new URL(".", import.meta.url));
const alias = { "@": raiz };

export default defineConfig({
  test: {
    projects: [
      // Dominio puro: corre sin base y sin levantar nada. Ver ADR-0003.
      {
        resolve: { alias },
        test: {
          name: "unidad",
          environment: "node",
          include: ["**/*.test.ts", "**/*.test.tsx"],
          exclude: ["**/node_modules/**", "**/*.db.test.ts"],
        },
      },
      // Tests contra Postgres. Van a `pique_test`, nunca a la base de desarrollo.
      {
        resolve: { alias },
        test: {
          name: "base",
          environment: "node",
          include: ["**/*.db.test.ts"],
          exclude: ["**/node_modules/**"],
          globalSetup: ["./vitest.db-setup.ts"],
          // Todos los archivos comparten una sola base: van en un único proceso para
          // que no se pisen entre sí.
          poolOptions: { forks: { singleFork: true } },
        },
      },
    ],
  },
});
