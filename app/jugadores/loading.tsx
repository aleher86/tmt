import {
  Bloque,
  EsqueletoDeSegmento,
  FilasEsqueleto,
  TituloEsqueleto,
} from "@/components/cascara/esqueleto";

/** Jugadores: el buscador y los resultados. */
export default function JugadoresCargando() {
  return (
    <EsqueletoDeSegmento etiqueta="Cargando Jugadores">
      <TituloEsqueleto />
      <Bloque ancho="100%" alto="2.5rem" />
      <FilasEsqueleto cantidad={6} />
    </EsqueletoDeSegmento>
  );
}
