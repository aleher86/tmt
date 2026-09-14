import "./scripts/load-env";

import { prepararBaseDeTests } from "./scripts/dev/base-de-tests";

/** Deja la base de tests lista antes de correr nada. */
export const setup = prepararBaseDeTests;
