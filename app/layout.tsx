import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Pique",
  description: "Circuito amateur de tenis de mesa de Argentina.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
