import type { ReactNode } from "react";

/**
 * Piezas de los esqueletos de carga. Cada segmento arma el suyo con la forma de lo que va a
 * llegar: el punto de un esqueleto es que la pantalla no salte cuando entran los datos.
 */

/**
 * Envoltorio de todo esqueleto de segmento.
 *
 * Las formas son decorativas y van con `aria-hidden`, pero el estado de carga no: sin el
 * `role="status"` y la etiqueta, quien navega con lector de pantalla se encuentra justo con la
 * pantalla en blanco que el esqueleto viene a evitar.
 */
export function EsqueletoDeSegmento({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-busy="true">
      <span className="solo-lectores">{etiqueta}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

export function Bloque({ ancho, alto = "1rem" }: { ancho: string; alto?: string }) {
  return <span className="esqueleto" style={{ width: ancho, height: alto }} />;
}

/** Una fila de listado: un renglón ancho arriba y uno corto abajo. */
export function FilaEsqueleto({ ancho }: { ancho: string }) {
  return (
    <div className="fila-esqueleto">
      <Bloque ancho={ancho} alto="0.95rem" />
      <Bloque ancho="40%" alto="0.75rem" />
    </div>
  );
}

export function FilasEsqueleto({ cantidad }: { cantidad: number }) {
  // Anchos desparejos: un listado de renglones idénticos se lee como una tabla, no como carga.
  const anchos = ["78%", "62%", "85%", "55%", "70%", "66%"];

  return (
    <div className="lista-esqueleto">
      {Array.from({ length: cantidad }, (_, i) => (
        <FilaEsqueleto key={i} ancho={anchos[i % anchos.length] ?? "70%"} />
      ))}
    </div>
  );
}

/** Encabezado de segmento: el título de la Sección mientras no hay nada más que mostrar. */
export function TituloEsqueleto() {
  return (
    <div className="titulo-esqueleto">
      <Bloque ancho="9rem" alto="1.6rem" />
    </div>
  );
}
