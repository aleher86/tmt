import {
  EsqueletoDeSegmento,
  FilasEsqueleto,
  TituloEsqueleto,
} from "@/components/cascara/esqueleto";

/** Ranking: puro listado largo, sin nada arriba que lo interrumpa. */
export default function RankingCargando() {
  return (
    <EsqueletoDeSegmento etiqueta="Cargando Ranking">
      <TituloEsqueleto />
      <FilasEsqueleto cantidad={10} />
    </EsqueletoDeSegmento>
  );
}
