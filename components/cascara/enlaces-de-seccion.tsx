"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SECCIONES_DE_LA_BARRA, seccionActiva } from "@/lib/navegacion";

import { ICONOS } from "./iconos";

/**
 * Los enlaces entre Secciones, en sus dos presentaciones: la barra inferior del teléfono y la
 * fila del encabezado en pantallas anchas. Es un solo componente porque es una sola lista: que
 * las dos se dibujen distinto no las hace dos navegaciones.
 *
 * `prefetch` explícito: sin él Next solo se trae el esqueleto de una ruta dinámica, y el punto
 * de la barra es que cambiar de Sección se sienta instantáneo.
 */
export function EnlacesDeSeccion({ variante }: { variante: "barra" | "encabezado" }) {
  const activa = seccionActiva(usePathname());
  const esBarra = variante === "barra";

  return (
    <nav className={esBarra ? "barra" : "nav-ancha"} aria-label="Secciones">
      {SECCIONES_DE_LA_BARRA.map((seccion) => {
        const esActiva = seccion.href === activa?.href;

        return (
          <Link
            key={seccion.href}
            href={seccion.href}
            prefetch
            className="enlace-seccion"
            aria-current={esActiva ? "page" : undefined}
          >
            {esBarra ? (
              <svg viewBox="0 0 24 24" aria-hidden="true" className="icono-seccion">
                {ICONOS[seccion.href]}
              </svg>
            ) : null}
            {seccion.titulo}
          </Link>
        );
      })}
    </nav>
  );
}
