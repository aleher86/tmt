import type { Metadata } from "next";

import { Vacio } from "@/components/cascara/vacio";

export const metadata: Metadata = { title: "Perfil" };

export default function PerfilPagina() {
  return (
    <Vacio
      titulo="Perfil"
      descripcion="El Jugador u Organizador con el que se entra a la demo."
      llegaEn="#14"
    />
  );
}
