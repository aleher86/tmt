import {
  Bloque,
  EsqueletoDeSegmento,
  FilasEsqueleto,
  TituloEsqueleto,
} from "@/components/cascara/esqueleto";

/** Torneos: la fila de chips de filtro y el listado. */
export default function TorneosCargando() {
  return (
    <EsqueletoDeSegmento etiqueta="Cargando Torneos">
      <TituloEsqueleto />
      <div className="chips-esqueleto">
        <Bloque ancho="5rem" alto="2rem" />
        <Bloque ancho="6.5rem" alto="2rem" />
        <Bloque ancho="4.5rem" alto="2rem" />
      </div>
      <FilasEsqueleto cantidad={6} />
    </EsqueletoDeSegmento>
  );
}
