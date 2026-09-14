import type { ReactNode } from "react";

/**
 * Una Sección todavía sin contenido. La cáscara se recorre entera antes que las rebanadas que
 * la llenan, así que cada pantalla dice qué va a haber acá y cuál es el ticket que lo trae.
 */
export function Vacio({
  titulo,
  descripcion,
  llegaEn,
  children,
}: {
  titulo: string;
  descripcion: string;
  llegaEn: string;
  children?: ReactNode;
}) {
  return (
    <>
      <h1 className="titulo-seccion">{titulo}</h1>
      <p className="bajada">{descripcion}</p>
      {children}
      <p className="pendiente">Llega en {llegaEn}.</p>
    </>
  );
}
