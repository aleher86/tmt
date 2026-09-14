import {
  Bloque,
  EsqueletoDeSegmento,
  FilasEsqueleto,
  TituloEsqueleto,
} from "@/components/cascara/esqueleto";

/** Perfil: la cabecera de la cuenta y sus datos. */
export default function PerfilCargando() {
  return (
    <EsqueletoDeSegmento etiqueta="Cargando Perfil">
      <TituloEsqueleto />
      <div className="tira-esqueleto">
        <Bloque ancho="4rem" alto="4rem" />
        <Bloque ancho="10rem" alto="2.5rem" />
      </div>
      <FilasEsqueleto cantidad={4} />
    </EsqueletoDeSegmento>
  );
}
