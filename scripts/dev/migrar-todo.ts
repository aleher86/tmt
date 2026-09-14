import "../load-env";

import { databaseUrl } from "../../lib/db/url";
import { prepararBaseDeTests } from "./base-de-tests";
import { migrar } from "./migrar";

// `pnpm db:migrate`: las dos bases de la instancia local, la de desarrollo y la de tests.
await migrar(databaseUrl(), "desarrollo");
await prepararBaseDeTests();
