import {
  Bloque,
  EsqueletoDeSegmento,
  FilasEsqueleto,
  TituloEsqueleto,
} from "@/components/cascara/esqueleto";

/** Inicio: la tira de próximos Torneos arriba y las Noticias abajo. */
export default function InicioCargando() {
  return (
    <EsqueletoDeSegmento etiqueta="Cargando Inicio">
      <TituloEsqueleto />
      <div className="tira-esqueleto">
        <Bloque ancho="14rem" alto="7rem" />
        <Bloque ancho="14rem" alto="7rem" />
        <Bloque ancho="14rem" alto="7rem" />
      </div>
      <FilasEsqueleto cantidad={3} />
    </EsqueletoDeSegmento>
  );
}
