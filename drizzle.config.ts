import { defineConfig } from "drizzle-kit";
import { databaseUrl } from "./lib/db/url";

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: databaseUrl() },
  // El schema de la app vive en `public`. Los de Supabase (auth, storage) los
  // maneja el CLI y Drizzle no los toca.
  schemaFilter: ["public"],
  casing: "snake_case",
});
