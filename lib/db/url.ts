/**
 * De dónde sale la connection string, y por qué el andamiaje no necesita un `.env`.
 *
 * Las credenciales del stack local de Supabase son públicas y fijas: son las mismas en
 * cualquier máquina. Ponerlas como valor por defecto es lo que hace que clonar el repo y
 * correr un solo comando alcance. `.env.local` sigue pisando el valor si hace falta, y en
 * producción no hay valor por defecto: falta `DATABASE_URL`, falla.
 */

const STACK_LOCAL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

/** La base que usa la suite de tests, dentro de la misma instancia que la de desarrollo. */
const BASE_DE_TESTS = "pique_test";

const HOSTS_LOCALES = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url) return url;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Falta DATABASE_URL.");
  }
  return STACK_LOCAL;
}

/**
 * La URL de tests se deriva de la de desarrollo cambiándole el nombre de la base, nunca se
 * configura aparte. Así la suite no puede terminar apuntada a la base con la que se estaba
 * mirando la interfaz, que es el accidente que esto evita.
 *
 * Y además exige que la instancia sea local: la suite crea y siembra su base, y el alcance de
 * todo esto es la aplicación corriendo en local. Publicar es otra cosa y vive aparte.
 */
export function testDatabaseUrl(): string {
  const url = new URL(databaseUrl());
  const baseDeDesarrollo = url.pathname.replace(/^\//, "");

  if (baseDeDesarrollo === BASE_DE_TESTS) {
    throw new Error(
      `DATABASE_URL ya apunta a "${BASE_DE_TESTS}": los tests borrarían su propia base de desarrollo.`,
    );
  }
  if (!HOSTS_LOCALES.has(url.hostname)) {
    throw new Error(
      `DATABASE_URL apunta a "${url.hostname}", que no es local. La suite crea y siembra su ` +
        `propia base y solo corre contra el stack local.`,
    );
  }

  url.pathname = `/${BASE_DE_TESTS}`;
  return url.toString();
}

export { BASE_DE_TESTS };
