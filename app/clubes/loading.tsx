import {
  Bloque,
  EsqueletoDeSegmento,
  FilasEsqueleto,
  TituloEsqueleto,
} from "@/components/cascara/esqueleto";

/** Clubes: el mapa arriba y la lista sincronizada abajo. */
export default function ClubesCargando() {
  return (
    <EsqueletoDeSegmento etiqueta="Cargando Clubes">
      <TituloEsqueleto />
      <Bloque ancho="100%" alto="12rem" />
      <FilasEsqueleto cantidad={5} />
    </EsqueletoDeSegmento>
  );
}
