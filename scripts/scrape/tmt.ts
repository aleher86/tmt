/**
 * Scrapeo one-off de las entidades públicas de tenisdemesaparatodos.com.
 *
 * **Se corre una vez y sale del ciclo de desarrollo.** Su salida queda versionada en
 * `datos/tmt.json` y el generador de `scripts/seed/` lee de ahí: nadie vuelve a pegarle al sitio
 * para levantar el proyecto, y un bloqueo de Cloudflare no frena el trabajo.
 *
 * Baja Clubes con coordenadas, Ligas, Regiones, Asociaciones, las Divisiones del Circuito y los
 * Torneos del año con sus Divisiones, Cupos, horarios y precios. Baja además el Rating y la edad
 * de cada Jugador de cada plantel, **solo** para calibrar distribuciones: ni el nombre ni el
 * código de un Jugador llegan a la salida. Ver ADR-0004.
 *
 *   pnpm scrape                      # el año en curso, completo
 *   pnpm scrape -- --limite=5        # prueba de humo, 5 Clubes y 5 Torneos
 *   pnpm scrape -- --anio=2025 --pausa=2000
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import {
  parsearClubesAdheridos,
  parsearCodigosDeTorneo,
  parsearDivisionesGlobales,
  parsearFichaDeClub,
  parsearFichaDeTorneo,
  parsearMarcadores,
  parsearSelect,
  type FichaDeTorneo,
  type Marcador,
  type Opcion,
} from "./parseo";

const SITIO = "https://www.tenisdemesaparatodos.com";

// Hay Cloudflare adelante: con User-Agent de navegador responde bien, sin él no.
const NAVEGADOR =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function argumento(nombre: string, porDefecto: string): string {
  const prefijo = `--${nombre}=`;
  return process.argv.find((arg) => arg.startsWith(prefijo))?.slice(prefijo.length) ?? porDefecto;
}

const ANIO = Number(argumento("anio", String(new Date().getFullYear())));
const PAUSA = Number(argumento("pausa", "1200"));
const SALIDA = argumento("salida", "datos/tmt.json");
const LIMITE = Number(argumento("limite", "0")) || Number.POSITIVE_INFINITY;

const esperar = (ms: number) => new Promise((listo) => setTimeout(listo, ms));

const fallos: string[] = [];

/**
 * Una petición, a ritmo bajo y decodificando **latin-1**: el sitio es ISO-8859-1 y si se lee como
 * UTF-8 todos los acentos salen rotos.
 */
async function bajar(ruta: string): Promise<string | null> {
  for (let intento = 1; intento <= 3; intento++) {
    await esperar(intento === 1 ? PAUSA : PAUSA * 5 * intento);
    try {
      const respuesta = await fetch(`${SITIO}/${ruta}`, {
        headers: { "User-Agent": NAVEGADOR, "Accept-Language": "es-AR,es;q=0.9" },
        redirect: "follow",
      });
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      return new TextDecoder("latin1").decode(await respuesta.arrayBuffer());
    } catch (error) {
      if (intento === 3) {
        console.warn(`  ! ${ruta}: ${error instanceof Error ? error.message : error}`);
        fallos.push(ruta);
        return null;
      }
    }
  }
  return null;
}

/** Ratings y edades del plantel, cada lista ordenada **por separado**: quedan las distribuciones
 * marginales y se pierde la correspondencia entre una edad y un Rating, que es lo que convertiría
 * la muestra en una ficha. Es todo lo que el generador necesita para calibrar. */
function distribuciones(planteles: { rating: number | null; edad: number | null }[]) {
  const numeros = (elegir: (fila: { rating: number | null; edad: number | null }) => number | null) =>
    planteles
      .map(elegir)
      .filter((valor): valor is number => valor !== null && valor > 0)
      .sort((a, b) => a - b);

  return { rating: numeros((fila) => fila.rating), edad: numeros((fila) => fila.edad) };
}

async function scrapear() {
  console.log(`Scrapeando ${SITIO} — Torneos de ${ANIO}, ${PAUSA} ms entre peticiones\n`);

  const listado = await bajar("clubes.asp");
  const mapa = await bajar("clubes_mapaTodos.asp");
  const ranking = await bajar("ranking.asp");
  const catalogoDeDivisiones = await bajar("divisiones.asp");
  const calendario = await bajar(`torneos.asp?ver=${ANIO}`);
  // `ver=<año>` lista **solo los Torneos ya jugados**. Los próximos viven en otra lista, y son
  // justamente los únicos que conservan Cupos y precios: sin esto el archivo sale sin ninguno.
  const proximos = await bajar("torneos.asp?prox=1");

  if (!listado || !mapa || !ranking || !catalogoDeDivisiones || !calendario || !proximos) {
    throw new Error("No se pudo bajar alguna de las páginas índice; sin eso no tiene sentido seguir");
  }

  const adheridos = parsearClubesAdheridos(listado);
  // El mapa dibuja Clubes y Asociaciones juntos, con ids que se pisan entre sí. Acá van Clubes.
  const marcadores = parsearMarcadores(mapa).filter((marcador) => marcador.tipo === "clubes");
  const porId = new Map<number, Marcador>(marcadores.map((marcador) => [marcador.id, marcador]));

  const regiones = parsearSelect(ranking, "fReg");
  const asociaciones = parsearSelect(ranking, "fAsoc");
  const clubesDelRanking = parsearSelect(ranking, "fClub");
  const divisiones = parsearDivisionesGlobales(catalogoDeDivisiones);
  const ligas = parsearSelect(calendario, "filtroLiga");
  const codigosProximos = parsearCodigosDeTorneo(proximos);
  const codigosDeTorneo = [
    ...new Set([...parsearCodigosDeTorneo(calendario), ...codigosProximos]),
  ].sort((a, b) => a - b);

  console.log(`  ${adheridos.length} Clubes adheridos, ${marcadores.length} en el mapa`);
  console.log(`  ${regiones.length} Regiones, ${asociaciones.length} Asociaciones, ${ligas.length} Ligas`);
  console.log(
    `  ${divisiones.length} Divisiones, ${codigosDeTorneo.length} Torneos` +
      ` (${ANIO} jugados + ${codigosProximos.length} próximos)\n`,
  );

  // La unión: el mapa tiene Clubes que el listado no enlaza, y el listado tiene alguno sin
  // coordenadas. Los códigos son del mismo espacio, así que la ficha se puede pedir para todos.
  const deAdheridos = new Set(adheridos);
  const todos = [...new Set([...adheridos, ...marcadores.map((m) => m.id)])].sort((a, b) => a - b);
  const aBajar = todos.slice(0, LIMITE);

  const clubes = [];
  const planteles = [];
  for (const [indice, id] of aBajar.entries()) {
    const html = await bajar(`clubes_ampliar.asp?codigo=${id}`);
    if (!html) continue;

    const ficha = parsearFichaDeClub(html);
    const marcador = porId.get(id);
    planteles.push(...ficha.plantel);

    const { plantel, ...datos } = ficha;
    clubes.push({
      id,
      ...datos,
      localidad: datos.localidad ?? marcador?.localidad ?? null,
      provincia: datos.provincia ?? marcador?.provincia ?? null,
      lat: marcador?.lat ?? null,
      lon: marcador?.lon ?? null,
      adherido: deAdheridos.has(id),
    });

    if ((indice + 1) % 25 === 0 || indice + 1 === aBajar.length) {
      console.log(`  Clubes ${indice + 1}/${aBajar.length}`);
    }
  }

  console.log("");
  const torneos: FichaDeTorneo[] = [];
  const codigos = codigosDeTorneo.slice(0, LIMITE);
  for (const [indice, codigo] of codigos.entries()) {
    // Los Torneos ya jugados redirigen a `torneos_ampliarJugado.asp`, que conserva horarios pero
    // pierde Cupos y precios. Los próximos responden la ficha viva, que es la que los tiene.
    const html = await bajar(`torneos_ampliar.asp?codigo=${codigo}`);
    if (html) torneos.push(parsearFichaDeTorneo(codigo, html));

    if ((indice + 1) % 25 === 0 || indice + 1 === codigos.length) {
      console.log(`  Torneos ${indice + 1}/${codigos.length}`);
    }
  }

  const muestra = distribuciones(planteles);
  const salida = {
    generadoEn: new Date().toISOString(),
    fuente: SITIO,
    anioDeTorneos: ANIO,
    conteos: {
      clubesAdheridos: adheridos.length,
      clubesEnElMapa: marcadores.length,
      clubesConFicha: clubes.length,
      clubesEnElDesplegableDeRanking: clubesDelRanking.length,
      clubesConCoordenadas: clubes.filter((club) => club.lat !== null).length,
      regiones: regiones.length,
      asociaciones: asociaciones.length,
      ligas: ligas.length,
      torneos: torneos.length,
      torneosConCupos: torneos.filter((torneo) => torneo.conCupos).length,
      jugadoresDeLaMuestra: muestra.rating.length,
    },
    regiones,
    asociaciones,
    divisiones,
    ligas,
    clubes,
    torneos,
    /** Solo distribuciones. Sin nombres, sin códigos, sin correspondencia entre las dos listas. */
    muestra,
    fallos,
  } satisfies Record<string, unknown> & { regiones: Opcion[] };

  await mkdir(dirname(SALIDA), { recursive: true });
  await writeFile(SALIDA, `${JSON.stringify(salida, null, 2)}\n`, "utf8");

  console.log(`\n${SALIDA} escrito`);
  console.table(salida.conteos);
  if (fallos.length > 0) console.warn(`\n${fallos.length} páginas no se pudieron bajar:`, fallos);
}

await scrapear();
