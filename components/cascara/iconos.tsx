import type { ReactNode } from "react";
import type { SeccionDeLaBarra } from "@/lib/navegacion";

/**
 * Los iconos de la barra, dibujados a mano para no arrastrar una biblioteca entera por cuatro
 * trazos. El `Record` es exhaustivo por tipo: agregar una Sección a la barra sin su icono no
 * compila.
 */
export const ICONOS: Record<SeccionDeLaBarra["href"], ReactNode> = {
  "/torneos": (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  "/clubes": (
    <>
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  "/ranking": (
    <>
      <path d="M5 21V11M12 21V4M19 21v-6" />
    </>
  ),
  "/perfil": (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </>
  ),
};
