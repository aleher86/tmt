import type { Metadata, Viewport } from "next";
import { unstable_ViewTransition as ViewTransition, type ReactNode } from "react";

import { Encabezado } from "@/components/cascara/encabezado";
import { EnlacesDeSeccion } from "@/components/cascara/enlaces-de-seccion";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Pique", template: "%s · Pique" },
  description: "Circuito amateur de tenis de mesa de Argentina.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Sin `cover`, `env(safe-area-inset-bottom)` vale 0 y la barra queda debajo del indicador
  // de inicio del iPhone.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR">
      <body>
        <Encabezado />

        {/* Lo único que cambia al navegar entre Secciones, y por eso lo único que se anima. */}
        <ViewTransition default="seccion">
          <main className="lienzo">{children}</main>
        </ViewTransition>

        <EnlacesDeSeccion variante="barra" />
      </body>
    </html>
  );
}
