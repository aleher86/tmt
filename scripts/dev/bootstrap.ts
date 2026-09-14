import "../load-env";

import { spawnSync } from "node:child_process";
import { delimiter, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { databaseUrl } from "../../lib/db/url";
import { sembrarCircuitoEn } from "../seed/circuito";
import { migrar } from "./migrar";

const RAIZ = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");

// El CLI de Supabase es dependencia de desarrollo, no una instalación global, así que hay que
// asegurarse de que `node_modules/.bin` esté en el PATH aunque este script se corra a mano y
// no como script de pnpm.
const PATH_CON_BINARIOS_LOCALES = [join(RAIZ, "node_modules", ".bin"), process.env.PATH ?? ""]
  .filter(Boolean)
  .join(delimiter);

function correr(comando: string, args: string[], opciones: { silencioso?: boolean } = {}) {
  const resultado = spawnSync(comando, args, {
    cwd: RAIZ,
    stdio: opciones.silencioso ? "ignore" : "inherit",
    env: { ...process.env, PATH: PATH_CON_BINARIOS_LOCALES },
  });
  if (resultado.error) {
    throw new Error(`No se pudo ejecutar \`${comando}\`: ${resultado.error.message}`);
  }
  return resultado.status ?? 1;
}

function dockerEstaCorriendo() {
  try {
    return correr("docker", ["info"], { silencioso: true }) === 0;
  } catch {
    return false;
  }
}

function stackYaLevantado() {
  return correr("supabase", ["status"], { silencioso: true }) === 0;
}

async function main() {
  if (!dockerEstaCorriendo()) {
    console.error(
      "\nDocker no está corriendo. Es lo único que hace falta tener instalado a nivel máquina.\n",
    );
    process.exit(1);
  }

  if (stackYaLevantado()) {
    console.log("  stack local ya levantado");
  } else {
    const salida = correr("supabase", ["start"]);
    if (salida !== 0) process.exit(salida);
  }

  // Solo la base de desarrollo: la de tests la prepara la propia suite, en su global setup.
  await migrar(databaseUrl(), "desarrollo");
  await sembrarCircuitoEn(databaseUrl());
  console.log("  parámetros del Circuito sembrados\n");
}

await main();
