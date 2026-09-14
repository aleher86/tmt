import type { Metadata } from "next";
import Link from "next/link";

import { Vacio } from "@/components/cascara/vacio";

export const metadata: Metadata = { title: "Ranking" };

export default function RankingPagina() {
  return (
    <Vacio
      titulo="Ranking"
      descripcion="El Ranking único y global de Jugadores por Rating, con la Variación del mes."
      llegaEn="#10"
    >
      {/* Jugadores no está en la barra: se llega desde acá, que es de donde se va a llegar
          cuando el Ranking tenga filas y cada una lleve a su ficha. */}
      <p className="bajada">
        <Link href="/jugadores" prefetch>
          Ver las fichas de Jugador
        </Link>
      </p>
    </Vacio>
  );
}
