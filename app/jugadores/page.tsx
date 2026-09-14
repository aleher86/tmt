import type { Metadata } from "next";

import { Vacio } from "@/components/cascara/vacio";

export const metadata: Metadata = { title: "Jugadores" };

export default function JugadoresPagina() {
  return (
    <Vacio
      titulo="Jugadores"
      descripcion="Las fichas de Jugador y el head-to-head entre cualquier par."
      llegaEn="#11"
    />
  );
}
