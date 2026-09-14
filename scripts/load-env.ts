import { config } from "dotenv";

// Next carga `.env.local` solo; los scripts y la suite de tests no, así que lo hacen acá.
// Si el archivo no existe no pasa nada: `lib/db/url.ts` tiene los valores del stack local.
config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });
