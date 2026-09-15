/**
 * Parseo del HTML de tenisdemesaparatodos.com.
 *
 * Es puro a propósito: sin red y sin base, para poder probarlo con fragmentos fijos y no
 * depender de que el sitio esté arriba. El scrapeo en sí vive en `tmt.ts`.
 *
 * El sitio es Classic ASP de 2005: HTML 4.01 maquetado con tablas anidadas, servido en
 * ISO-8859-1, sin API ni clases de CSS con las que engancharse. Lo único estable es la etiqueta
 * de cada celda ("Divisiones:", "Sede:"), así que sobre eso se parsea.
 *
 * **Nombres de personas que a propósito no se leen**: Organizador y Juez general del Torneo,
 * entrenadores y contacto del Club, y el nombre y el código de cada Jugador del plantel. Son
 * personas reales del circuito y ninguna de las dos cosas que este archivo alimenta —el mapa y
 * el generador— las necesita. Si alguna hiciera falta, se agrega a sabiendas: ver ADR-0004.
 */

/** Las entidades que el sitio realmente usa, más las de escape. No hace falta la tabla entera. */
const ENTIDADES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  aacute: "á",
  eacute: "é",
  iacute: "í",
  oacute: "ó",
  uacute: "ú",
  Aacute: "Á",
  Eacute: "É",
  Iacute: "Í",
  Oacute: "Ó",
  Uacute: "Ú",
  ntilde: "ñ",
  Ntilde: "Ñ",
  uuml: "ü",
  Uuml: "Ü",
  ordm: "º",
  ordf: "ª",
  deg: "°",
  copy: "©",
  middot: "·",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
};

export function desescapar(texto: string): string {
  return texto.replace(/&(#x?[0-9a-fA-F]+|\w+);/g, (todo, cuerpo: string) => {
    if (!cuerpo.startsWith("#")) return ENTIDADES[cuerpo] ?? todo;
    const hexa = cuerpo[1] === "x" || cuerpo[1] === "X";
    const codigo = Number.parseInt(hexa ? cuerpo.slice(2) : cuerpo.slice(1), hexa ? 16 : 10);
    return Number.isFinite(codigo) ? String.fromCodePoint(codigo) : todo;
  });
}

/** HTML a texto plano. Las etiquetas se vuelven espacio para que `<td>a</td><td>b</td>` no pegue. */
export function aTexto(html: string): string {
  return desescapar(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

export type Celda = { html: string; texto: string };

// ponytail: corta en el primer `</td>`, así que una celda con tabla anidada adentro sale trunca.
// Ninguna de las que se leen acá la tiene; si alguna la tuviera, hay que parsear con una pila.
export function celdas(html: string): Celda[] {
  return [...html.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((coincidencia) => {
    const interior = coincidencia[1] ?? "";
    return { html: interior, texto: aTexto(interior) };
  });
}

/**
 * Mapa de etiqueta a la celda que la sigue. Las fichas del sitio son todas del mismo molde:
 * una celda con el rótulo y la de al lado con el valor. El rótulo a veces termina en ":"
 * ("Sede:") y a veces en "." ("Abr."); se exige uno de los dos y que sea corto, para no
 * confundir un párrafo que termina en punto con un rótulo.
 */
export function campos(html: string): Map<string, Celda> {
  const lista = celdas(html);
  const mapa = new Map<string, Celda>();
  lista.forEach((celda, indice) => {
    if (!/[:.]$/.test(celda.texto)) return;
    const etiqueta = celda.texto.slice(0, -1).trim();
    const valor = lista[indice + 1];
    if (!etiqueta || etiqueta.length > 40 || !valor || mapa.has(etiqueta)) return;
    mapa.set(etiqueta, valor);
  });
  return mapa;
}

/** El nombre de la entidad cuelga del `<title>`, después de un prefijo fijo en todo el sitio. */
export function nombreDelTitulo(html: string): string {
  const titulo = aTexto(/<title>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "");
  return titulo.replace(
    /^TMT\s*-\s*Tenis de Mesa para Todos\s*-\s*Torneos de ping pong\s*-\s*/i,
    "",
  );
}

function aNumero(texto: string | undefined | null): number | null {
  const digitos = texto?.replace(/[^\d]/g, "") ?? "";
  return digitos ? Number(digitos) : null;
}

/** Un `<td>` cuyas líneas están separadas por `<br>`, como las Divisiones o los precios. */
function aLineas(html: string): string[] {
  return html
    .split(/<br\s*\/?>/i)
    .map(aTexto)
    .filter((linea) => linea.length > 0);
}

/** El valor sin rótulo que el sitio pone en la fila de abajo (la localidad, bajo la dirección). */
function celdaSiguienteA(lista: Celda[], rotulo: string): string | null {
  const donde = lista.findIndex((celda) => celda.texto === rotulo);
  if (donde < 0) return null;
  return lista.slice(donde + 2).find((celda) => celda.texto.length > 0)?.texto ?? null;
}

// ---------------------------------------------------------------------------
// Clubes
// ---------------------------------------------------------------------------

export type Marcador = {
  id: number;
  /** `clubes` o `asociaciones`: el mapa mezcla las dos cosas y **son espacios de id distintos**. */
  tipo: string;
  lat: number;
  lon: number;
  nombre: string;
  provincia: string;
  localidad: string;
};

/**
 * Las coordenadas salen de `clubes_mapaTodos.asp`, donde el sitio escribe un `var lat` / `var lon`
 * y llama a `addMarker` con el resto. **No están ofuscadas**: son decimales planos. El `charCodeAt`
 * que hay en esa página ofusca direcciones de mail, no coordenadas.
 *
 * El último argumento de `addMarker` dice si el marcador es un Club o una Asociación. Los ids se
 * repiten entre los dos conjuntos —el marcador 2 es la Asociación Santiagueña, y el Club 2 es
 * Lomas del Mirador, a 1.000 km—, así que el tipo es parte de la clave y no un adorno.
 */
export function parsearMarcadores(html: string): Marcador[] {
  const patron =
    /var\s+lat\s*=\s*(-?[\d.]+)\s*;?\s*var\s+lon\s*=\s*(-?[\d.]+)\s*;?\s*addMarker\(\s*map\s*,\s*lat\s*,\s*lon\s*,\s*(\d+)\s*,\s*"([^"]*)"\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*(?:true|false)\s*,\s*'([^']*)'/g;
  const porClave = new Map<string, Marcador>();
  for (const [, lat, lon, id, nombre, provincia, localidad, tipo] of html.matchAll(patron)) {
    const clave = `${tipo}:${id}`;
    // El sitio repite algún marcador; gana el primero.
    if (porClave.has(clave)) continue;
    porClave.set(clave, {
      id: Number(id),
      tipo: tipo ?? "",
      lat: Number(lat),
      lon: Number(lon),
      nombre: desescapar(nombre ?? "").trim(),
      provincia: desescapar(provincia ?? "").trim(),
      localidad: desescapar(localidad ?? "").trim(),
    });
  }
  return [...porClave.values()];
}

/** Los Clubes adheridos son los que `clubes.asp` enlaza; el resto solo figura en el desplegable. */
export function parsearClubesAdheridos(html: string): number[] {
  const ids = [...html.matchAll(/clubes_ampliar\.asp\?codigo=(\d+)/g)].map((m) => Number(m[1]));
  return [...new Set(ids)].sort((a, b) => a - b);
}

export type FichaDeClub = {
  nombre: string;
  abreviatura: string | null;
  direccion: string | null;
  localidad: string | null;
  provincia: string | null;
  horarios: string | null;
  mesas: string | null;
  asociacion: string | null;
  jugadores: number | null;
  edadPromedio: number | null;
  /** Rating y edad de cada Jugador del plantel. Sin código ni nombre: ver ADR-0004. */
  plantel: { rating: number | null; edad: number | null }[];
};

export function parsearFichaDeClub(html: string): FichaDeClub {
  const lista = celdas(html);
  const campo = campos(html);
  const texto = (etiqueta: string) => campo.get(etiqueta)?.texto || null;
  const lineas = (etiqueta: string) => {
    const celda = campo.get(etiqueta);
    return celda ? aLineas(celda.html).join("\n") : null;
  };

  // "ALMAGRO - Capital Federal" va en la fila de abajo de la dirección, sin rótulo propio.
  const [localidad, provincia] =
    celdaSiguienteA(lista, "Dirección:")
      ?.split(" - ")
      .map((parte) => parte.trim()) ?? [];

  return {
    nombre: nombreDelTitulo(html),
    abreviatura: texto("Abr"),
    direccion: texto("Dirección"),
    localidad: localidad ?? null,
    provincia: provincia ?? null,
    horarios: lineas("Horarios"),
    mesas: texto("Mesas"),
    asociacion: texto("Asociación"),
    jugadores: aNumero(texto("Total de jugadores")),
    edadPromedio: aNumero(texto("Edad Promedio")),
    plantel: parsearPlantel(html),
  };
}

/**
 * El plantel se lee por posición de columna, guiándose por el encabezado. Se quedan **solo**
 * rating y edad: el código y el nombre del Jugador no se copian ni acá ni a la salida (ADR-0004).
 */
function parsearPlantel(html: string): { rating: number | null; edad: number | null }[] {
  const filas = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) =>
    celdas(m[1] ?? "").map((celda) => celda.texto),
  );
  const encabezado = filas.findIndex(
    (fila) => fila.includes("Rating") && fila.includes("Edad") && fila.includes("Jugador"),
  );
  if (encabezado < 0) return [];

  const columnas = filas[encabezado] ?? [];
  const donde = { rating: columnas.indexOf("Rating"), edad: columnas.indexOf("Edad") };
  const plantel: { rating: number | null; edad: number | null }[] = [];
  for (const fila of filas.slice(encabezado + 1)) {
    // Entre Jugador y Jugador el sitio intercala filas separadoras de una sola celda vacía.
    if (fila.length !== columnas.length) continue;
    const rating = aNumero(fila[donde.rating]);
    const edad = aNumero(fila[donde.edad]);
    if (rating === null && edad === null) continue;
    plantel.push({ rating, edad });
  }
  return plantel;
}

// ---------------------------------------------------------------------------
// Catálogos: Regiones, Asociaciones, Ligas, Divisiones
// ---------------------------------------------------------------------------

export type Opcion = { id: string; nombre: string };

/** Las opciones de un `<select>`, salteando los "Todos" y el rótulo que el sitio mete adentro. */
export function parsearSelect(html: string, nombre: string): Opcion[] {
  const patron = new RegExp(`<select[^>]*name=["']?${nombre}["']?[^>]*>([\\s\\S]*?)</select>`, "i");
  const cuerpo = patron.exec(html)?.[1];
  if (!cuerpo) return [];

  const opciones: Opcion[] = [];
  const porOpcion = /<option[^>]*value=["']?([^"'>]*)["']?[^>]*>([^<]*)/gi;
  for (const [, valor, etiqueta] of cuerpo.matchAll(porOpcion)) {
    const id = (valor ?? "").trim();
    if (!id || /^(todos|todas)$/i.test(id)) continue;
    opciones.push({
      id,
      nombre: desescapar(etiqueta ?? "")
        .replace(/\s+/g, " ")
        .trim(),
    });
  }
  return opciones;
}

export type DivisionGlobal = {
  nombre: string;
  nivel: string;
  descripcion: string;
  ratingDesde: number | null;
  ratingHasta: number | null;
};

/**
 * Las 8 Divisiones de rating con su banda, de `divisiones.asp`. La celda de rating trae
 * "hasta desde"; la primera solo trae el piso y la última solo el techo, porque están abiertas.
 */
export function parsearDivisionesGlobales(html: string): DivisionGlobal[] {
  const filas = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((m) => celdas(m[1] ?? "").map((celda) => celda.texto))
    .filter((fila) => fila.length === 4 && /^[A-ZÁÉÍÓÚÑ]{4,}$/.test(fila[0] ?? ""));

  return filas.map((fila, indice) => {
    const numeros = (fila[3] ?? "").match(/\d+/g)?.map(Number) ?? [];
    const [primero, segundo] = numeros;
    const abierta = numeros.length < 2;
    const esLaPrimera = indice === 0;
    return {
      nombre: fila[0] ?? "",
      nivel: fila[1] ?? "",
      descripcion: fila[2] ?? "",
      ratingDesde: abierta ? (esLaPrimera ? (primero ?? null) : null) : (segundo ?? null),
      ratingHasta: abierta ? (esLaPrimera ? null : (primero ?? null)) : (primero ?? null),
    };
  });
}

// ---------------------------------------------------------------------------
// Torneos
// ---------------------------------------------------------------------------

export function parsearCodigosDeTorneo(html: string): number[] {
  const ids = [...html.matchAll(/torneos_ampliar(?:Jugado)?\.asp\?codigo=(\d+)/g)].map((m) =>
    Number(m[1]),
  );
  return [...new Set(ids)].sort((a, b) => a - b);
}

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** "Lunes, 14 de Setiembre de 2026" a "2026-09-14". El sitio escribe "setiembre" y "septiembre". */
export function parsearFecha(texto: string): string | null {
  const partes = /(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+de\s+(\d{4})/i.exec(texto);
  if (!partes) return null;
  const mes = (partes[2] ?? "").toLowerCase().replace(/^setiembre$/, "septiembre");
  const indice = MESES.indexOf(mes);
  if (indice < 0) return null;
  const dia = (partes[1] ?? "").padStart(2, "0");
  return `${partes[3]}-${String(indice + 1).padStart(2, "0")}-${dia}`;
}

export type DivisionDelTorneo = {
  nombre: string;
  formato: string | null;
  hora: string | null;
  mesas: number | null;
  cupo: number | null;
};

/** "6ta división : 3 sets, final 5 sets - 19:30 hs. 3 mesas (Cupos: 18)." */
export function parsearDivisionDelTorneo(linea: string): DivisionDelTorneo | null {
  const hora = /(\d{1,2}:\d{2})\s*hs/i.exec(linea);
  if (!hora) return null; // "Inscripción online" y demás carteles que comparten la celda

  const [antes = "", despues = ""] = linea.split(/\s-\s(?=\d{1,2}:\d{2}\s*hs)/);
  const [nombre = antes, ...formato] = antes.split(/\s*:\s*/);
  return {
    nombre: nombre.trim(),
    formato: formato.join(": ").trim() || null,
    hora: hora[1] ?? null,
    mesas: aNumero(/(\d+)\s*mesas?/i.exec(despues)?.[1]),
    cupo: aNumero(/cupos?\s*:\s*(\d+)/i.exec(despues)?.[1]),
  };
}

export type Precio = { monto: number | null; texto: string };

export type FichaDeTorneo = {
  codigo: number;
  nombre: string;
  edicion: number | null;
  ligaId: number | null;
  fecha: string | null;
  sede: string | null;
  direccion: string | null;
  mesas: string | null;
  pelotitas: string | null;
  informacionAdicional: string | null;
  precios: Precio[];
  divisiones: DivisionDelTorneo[];
  /** `false` cuando la ficha es la variante "jugado": el Torneo ya pasó y perdió Cupos y precios. */
  conCupos: boolean;
};

export function parsearFichaDeTorneo(codigo: number, html: string): FichaDeTorneo {
  const lista = celdas(html);
  const campo = campos(html);
  const texto = (etiqueta: string) => campo.get(etiqueta)?.texto || null;
  const nombre = nombreDelTitulo(html);

  // La celda cambia de rótulo entre la ficha viva ("Divisiones:") y la "jugado" ("Categorías:").
  const celdaDivisiones = campo.get("Divisiones") ?? campo.get("Categorías");
  const divisiones = celdaDivisiones
    ? aLineas(celdaDivisiones.html)
        .map(parsearDivisionDelTorneo)
        .filter((division): division is DivisionDelTorneo => division !== null)
    : [];

  const celdaPrecios = campo.get("Inscripción");
  const precios = celdaPrecios
    ? aLineas(celdaPrecios.html).map((linea) => ({
        monto: aNumero(/\$\s*([\d.]+)/.exec(linea)?.[1]),
        texto: linea,
      }))
    : [];

  return {
    codigo,
    nombre,
    edicion: aNumero(/^(\d+)\s*[°ºª]/.exec(nombre)?.[1]),
    ligaId: aNumero(/torneos\.asp\?filtroLiga=(\d+)/.exec(html)?.[1]),
    fecha: parsearFecha(aTexto(html.replace(/<[^>]*>/g, "\n"))),
    sede: texto("Sede"),
    direccion: celdaSiguienteA(lista, "Sede:"),
    mesas: texto("Mesas"),
    pelotitas: campo.get("Pelotitas") ? aLineas(campo.get("Pelotitas")!.html).join(", ") : null,
    informacionAdicional: texto("Información adicional sobre los acceso"),
    precios,
    divisiones,
    conCupos: divisiones.some((division) => division.cupo !== null),
  };
}
