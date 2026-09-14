import type { Metadata } from "next";

import { Vacio } from "@/components/cascara/vacio";

export const metadata: Metadata = { title: "Torneos" };

export default function TorneosPagina() {
  return (
    <Vacio
      titulo="Torneos"
      descripcion="El listado de Torneos próximos, filtrable por División, Región, día y Cupo."
      llegaEn="#7"
    />
  );
}
