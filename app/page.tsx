import { Vacio } from "@/components/cascara/vacio";

/**
 * Inicio: el resumen de arranque —los Torneos de las fechas que vienen y las Noticias del
 * circuito—, como el `inicio.asp` del sitio actual. Acá es solo la ruta: el contenido necesita
 * los Torneos de #7 y un término `Noticia` que todavía no existe en `CONTEXT.md`.
 */
export default function InicioPagina() {
  return (
    <Vacio
      titulo="Pique"
      descripcion="Los Torneos que se vienen y las novedades del Circuito, de un vistazo."
      llegaEn="#20"
    />
  );
}
