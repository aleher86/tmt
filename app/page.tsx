import { getDb } from "@/lib/db";
import { obtenerCircuito } from "@/lib/db/queries/circuito";

// Lee la base en cada visita: no hay nada que prerenderizar en build.
export const dynamic = "force-dynamic";

export default async function Home() {
  const circuito = await obtenerCircuito(getDb());

  return (
    <main style={{ maxWidth: "36rem", margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 0.25rem", fontSize: "2rem" }}>{circuito.nombre}</h1>
      <p style={{ margin: 0, color: "var(--tenue)" }}>
        Circuito amateur de tenis de mesa de Argentina.
      </p>

      <dl
        style={{
          marginTop: "2rem",
          paddingTop: "1.25rem",
          borderTop: "1px solid var(--borde)",
        }}
      >
        <dt style={{ color: "var(--tenue)", fontSize: "0.875rem" }}>
          Divisiones hacia arriba que puede jugar un Jugador
        </dt>
        <dd style={{ margin: "0.25rem 0 0", fontSize: "1.5rem" }}>
          {circuito.divisionesHaciaArriba}
        </dd>
      </dl>

      <p style={{ marginTop: "2rem", color: "var(--tenue)", fontSize: "0.875rem" }}>
        Leído de Postgres con Drizzle. Es el andamiaje: la cáscara de la aplicación llega en #3.
      </p>
    </main>
  );
}
