import type { Metadata } from "next";

import { Vacio } from "@/components/cascara/vacio";

export const metadata: Metadata = { title: "Clubes" };

export default function ClubesPagina() {
  return (
    <Vacio
      titulo="Clubes"
      descripcion="El mapa y la lista de Clubes, sincronizados y ordenados por distancia."
      llegaEn="#8"
    />
  );
}
