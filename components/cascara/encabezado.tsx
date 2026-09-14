import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { getDb } from "@/lib/db";
import { obtenerCircuito } from "@/lib/db/queries/circuito";

import { Bloque } from "./esqueleto";
import { EnlacesDeSeccion } from "./enlaces-de-seccion";

export function Encabezado() {
  return (
    <header className="encabezado">
      {/* En el teléfono la marca es la única puerta a Inicio: la barra lleva las otras. */}
      <Link href="/" prefetch className="marca">
        <Suspense fallback={<Bloque ancho="6ch" alto="1.15rem" />}>
          <NombreDelCircuito />
        </Suspense>
      </Link>

      <EnlacesDeSeccion variante="encabezado" />
    </header>
  );
}

/**
 * El nombre sale de Postgres, no de una constante. `connection()` posterga la lectura hasta que
 * hay un pedido de verdad, así que `next build` no necesita una base a la que conectarse; el
 * `Suspense` de arriba deja que la cáscara se pinte y el nombre llegue por streaming.
 */
async function NombreDelCircuito() {
  await connection();
  const circuito = await obtenerCircuito(getDb());

  return circuito.nombre;
}
