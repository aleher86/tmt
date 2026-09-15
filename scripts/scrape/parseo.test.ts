import { expect, test } from "vitest";

import {
  aTexto,
  desescapar,
  parsearClubesAdheridos,
  parsearDivisionDelTorneo,
  parsearDivisionesGlobales,
  parsearFecha,
  parsearFichaDeClub,
  parsearFichaDeTorneo,
  parsearMarcadores,
  parsearSelect,
  distribuciones,
} from "./parseo";

// Los fragmentos son recortes textuales del sitio, ya decodificados de latin-1.

test("las entidades y los acentos del sitio salen enteros, sin caracteres rotos", () => {
  expect(desescapar("Divisi&oacute;n")).toBe("División");
  expect(desescapar("Gonz&aacute;lez")).toBe("González");
  expect(desescapar("A&ntilde;os &amp; m&aacute;s")).toBe("Años & más");
  // El sitio ofusca los mails con entidades numéricas.
  expect(desescapar("&#97;&#64;&#98;")).toBe("a@b");
  // Una entidad que no conocemos se deja como está en vez de desaparecer.
  expect(desescapar("&fake;")).toBe("&fake;");
});

test("dos celdas pegadas no se funden en una sola palabra", () => {
  expect(aTexto("<td>PARQUE CHAS</td><td>Capital Federal</td>")).toBe("PARQUE CHAS Capital Federal");
});

test("las coordenadas del mapa se leen como decimales, sin desofuscar nada", () => {
  const mapa = `
   var lat = -34.796361
   var lon =  -58.386436;
   addMarker(map, lat, lon, 81, "Adrogue Sith Spin", 'Gran Buenos Aires', 'ADROGUE', false, 'clubes')

   var lat = -34.641077
   var lon = -58.481795;
   addMarker(map, lat, lon, 16, "Alvear ", 'Capital Federal', 'PARQUE AVELLANEDA', false, 'clubes')
  `;

  expect(parsearMarcadores(mapa)).toEqual([
    {
      id: 81,
      tipo: "clubes",
      lat: -34.796361,
      lon: -58.386436,
      nombre: "Adrogue Sith Spin",
      provincia: "Gran Buenos Aires",
      localidad: "ADROGUE",
    },
    {
      id: 16,
      tipo: "clubes",
      lat: -34.641077,
      lon: -58.481795,
      nombre: "Alvear",
      provincia: "Capital Federal",
      localidad: "PARQUE AVELLANEDA",
    },
  ]);
});

/**
 * El mapa dibuja Clubes y Asociaciones con la misma función, y los ids se pisan: el marcador 2 es
 * la Asociación Santiagueña y el Club 2 es Lomas del Mirador, a mil kilómetros. Sin separar por
 * tipo, un puñado de Clubes termina con las coordenadas de otra provincia.
 */
test("una Asociación no se confunde con el Club que comparte su id", () => {
  const mapa = `
   var lat = -27.814424
   var lon =  -64.239580;
   addMarker(map, lat, lon, 2, "Asociacion Santiaguena", 'Santiago del Estero', 'SANTIAGO DEL ESTERO', true, 'asociaciones')

   var lat = -34.659000
   var lon = -58.531000;
   addMarker(map, lat, lon, 2, "Lomas del Mirador", 'Gran Buenos Aires', 'LOMAS DEL MIRADOR', false, 'clubes')
  `;

  const clubes = parsearMarcadores(mapa).filter((marcador) => marcador.tipo === "clubes");

  expect(clubes).toHaveLength(1);
  expect(clubes[0]).toMatchObject({ id: 2, nombre: "Lomas del Mirador", lat: -34.659 });
});

// El centrado inicial del mapa usa las mismas variables y no es un Club.
test("el centro del mapa no se confunde con un Club", () => {
  const mapa = `
   var lat = -40.436913;
   var lon = -65.441895;
   map = createMap(lat, lon, 5);
  `;

  expect(parsearMarcadores(mapa)).toEqual([]);
});

test("un Club repetido en el mapa entra una sola vez", () => {
  const repetido = `
   var lat = -34.6; var lon = -58.4;
   addMarker(map, lat, lon, 7, "Uno", 'Capital Federal', 'BOEDO', false, 'clubes')
   var lat = -34.7; var lon = -58.5;
   addMarker(map, lat, lon, 7, "Uno", 'Capital Federal', 'BOEDO', false, 'clubes')
  `;

  expect(parsearMarcadores(repetido).map((marcador) => marcador.lat)).toEqual([-34.6]);
});

test("los Clubes adheridos salen del listado, sin repetir el que se enlaza dos veces", () => {
  const listado = `
    <a href="clubes_ampliar.asp?codigo=27"><img></a>
    <a href="clubes_ampliar.asp?codigo=27">Nichia Gakuin</a>
    <a href="clubes_ampliar.asp?codigo=10">CEDIMA</a>
  `;

  expect(parsearClubesAdheridos(listado)).toEqual([10, 27]);
});

const FICHA_DE_CLUB = `
<html><head><title>TMT - Tenis de Mesa para Todos - Torneos de ping pong - Nichia Gakuin</title></head>
<body>
<table>
  <tr><td><div align="left">Abr.</div></td><td style="font-size:22px;">NIC</td></tr>
  <tr><td nowrap>Dirección:</td><td><strong>Yatay 261</strong></td></tr>
  <tr><td></td><td>ALMAGRO - Capital Federal</td></tr>
  <tr><td>Mesas:</td><td>6 mesas DONIC WALDNER CLASSIC 25 (ITTF)</td></tr>
  <tr><td>Asociación:</td><td>FeTeMBA</td></tr>
  <tr><td><div align="left">Total de jugadores:</div></td><td><div align="left"><strong>26</strong></div></td></tr>
  <tr><td><div align="left">Edad Promedio:<strong> </strong></div></td><td><div align="left"><strong>35 años</strong></div></td></tr>
</table>
<table>
  <tr><td>#</td><td>Código</td><td>Jugador</td><td>Cat.</td><td>Rating</td><td>Edad</td></tr>
  <tr><td></td></tr>
  <tr><td>1</td><td>550</td><td>Martinez, Federico</td><td></td><td>1896</td><td>37</td></tr>
  <tr><td></td></tr>
  <tr><td>2</td><td>463</td><td>Levisman, Gabriel</td><td></td><td>1872</td><td>53</td></tr>
</table>
</body></html>
`;

test("la ficha de un Club trae sus datos, con la localidad que va sin rótulo abajo de la dirección", () => {
  const club = parsearFichaDeClub(FICHA_DE_CLUB);

  expect(club.nombre).toBe("Nichia Gakuin");
  expect(club.abreviatura).toBe("NIC");
  expect(club.direccion).toBe("Yatay 261");
  expect(club.localidad).toBe("ALMAGRO");
  expect(club.provincia).toBe("Capital Federal");
  expect(club.asociacion).toBe("FeTeMBA");
  expect(club.jugadores).toBe(26);
  expect(club.edadPromedio).toBe(35);
});

// ADR-0004: de la muestra de Jugadores solo se calibran distribuciones. Si un nombre o un código
// se colara hasta acá, terminaría en el archivo versionado.
test("del plantel se guardan Rating y edad, nunca el nombre ni el código del Jugador", () => {
  const { plantel } = parsearFichaDeClub(FICHA_DE_CLUB);

  expect(plantel).toEqual([
    { rating: 1896, edad: 37 },
    { rating: 1872, edad: 53 },
  ]);
  expect(JSON.stringify(plantel)).not.toContain("Martinez");
  expect(JSON.stringify(plantel)).not.toContain("550");
});

test("las Divisiones globales traen su banda de Rating, abierta arriba en la primera y abajo en la última", () => {
  const catalogo = `
    <tr><td>División</td><td>Descripción</td><td>Nivel técnico aproximado</td><td>Rating</td></tr>
    <tr><td>PRIMERA</td><td>Jugadores de elite</td><td>Son algunos de los mejores.</td><td>2100</td></tr>
    <tr><td>SEGUNDA</td><td>Jugadores expertos</td><td>Altamente experimentados.</td><td>2099 1800</td></tr>
    <tr><td>OCTAVA</td><td>Jugadores debutantes</td><td>Primeras experiencias.</td><td>979</td></tr>
  `;

  expect(parsearDivisionesGlobales(catalogo).map((d) => [d.nombre, d.ratingDesde, d.ratingHasta])).toEqual([
    ["PRIMERA", 2100, null],
    ["SEGUNDA", 1800, 2099],
    ["OCTAVA", null, 979],
  ]);
});

test("un select deja afuera el rótulo y el 'Todas' que el sitio mete como opción", () => {
  const select = `
    <select name="fReg">
      <option value="todos">REGION</option>
      <option value="todos">Todas</option>
      <option value="3">Zona Norte Conurbano</option>
      <option value="7">Regi&oacute;n NEA</option>
    </select>
  `;

  expect(parsearSelect(select, "fReg")).toEqual([
    { id: "3", nombre: "Zona Norte Conurbano" },
    { id: "7", nombre: "Región NEA" },
  ]);
});

test("el sitio escribe 'setiembre' y 'septiembre', y las dos dan la misma fecha", () => {
  expect(parsearFecha("Lunes, 14 de Setiembre de 2026")).toBe("2026-09-14");
  expect(parsearFecha("Lunes, 14 de septiembre de 2026")).toBe("2026-09-14");
  expect(parsearFecha("Domingo, 3 de marzo de 2024")).toBe("2024-03-03");
  expect(parsearFecha("sin fecha")).toBeNull();
});

test("una línea de División del Torneo da nombre, horario, mesas y Cupo", () => {
  expect(parsearDivisionDelTorneo("6ta división : 3 sets, final 5 sets - 19:30 hs. 3 mesas (Cupos: 18).")).toEqual({
    nombre: "6ta división",
    formato: "3 sets, final 5 sets",
    hora: "19:30",
    mesas: 3,
    cupo: 18,
  });
});

// La celda de Divisiones comparte lugar con carteles sueltos sobre la inscripción.
test("un cartel que no es una División no se cuela como una", () => {
  expect(parsearDivisionDelTorneo("Inscripción online")).toBeNull();
  expect(parsearDivisionDelTorneo("Inscripción on-line finalizada - Comunicate con el organizador")).toBeNull();
});

const FICHA_DE_TORNEO = `
<html><head><title>TMT - Tenis de Mesa para Todos - Torneos de ping pong - 9&ordm; Torneo "La Casita Bar Ping Pong"</title></head>
<body>
<a href="torneos.asp?filtroLiga=383">Ver historial de torneos de esta liga</a>
<a href="clubes_ampliar.asp?codigo=230">La Casita del BPP</a>
<div>Lunes, 14 de Setiembre de 2026</div>
<table>
  <tr><td nowrap><strong>Divisiones:</strong></td>
      <td><strong>8va divisi&oacute;n : 3 sets - 14:30 hs. 3 mesas (Cupos: 18).<br>
                  6ta divisi&oacute;n : 3 sets - 15:00 hs. 3 mesas (Cupos: 24).<br></strong>
          <div>Inscripci&oacute;n online</div></td></tr>
  <tr><td nowrap><strong>Sede:</strong></td><td>La Casita del BPP</td></tr>
  <tr><td></td><td>Llerena 2847 - PARQUE CHAS - Capital Federal</td></tr>
  <tr><td nowrap><strong>Inscripci&oacute;n:</strong></td>
      <td>$14000.- inscripcion general por categoria<br>$11000.- para jugadores del club</td></tr>
  <tr><td nowrap><strong>Juez general:</strong></td><td>Myriam Morales</td></tr>
  <tr><td nowrap><strong>Organizador:</strong></td><td>Maria Ana Repetto</td></tr>
</table>
</body></html>
`;

test("la ficha de un Torneo trae Liga, Edición, fecha, sede, Divisiones con Cupo y precios", () => {
  const torneo = parsearFichaDeTorneo(10776, FICHA_DE_TORNEO);

  expect(torneo.edicion).toBe(9);
  expect(torneo.ligaId).toBe(383);
  expect(torneo.clubId).toBe(230);
  expect(torneo.fecha).toBe("2026-09-14");
  expect(torneo.sede).toBe("La Casita del BPP");
  expect(torneo.direccion).toBe("Llerena 2847 - PARQUE CHAS - Capital Federal");
  expect(torneo.divisiones).toEqual([
    { nombre: "8va división", formato: "3 sets", hora: "14:30", mesas: 3, cupo: 18 },
    { nombre: "6ta división", formato: "3 sets", hora: "15:00", mesas: 3, cupo: 24 },
  ]);
  expect(torneo.precios).toEqual([
    { monto: 14000, texto: "$14000.- inscripcion general por categoria" },
    { monto: 11000, texto: "$11000.- para jugadores del club" },
  ]);
  expect(torneo.conCupos).toBe(true);
});

/**
 * Organizador, Juez general y entrenadores son personas reales del circuito, y nada de lo que
 * este archivo alimenta las necesita. Que no estén es una decisión, no un olvido.
 */
test("ni el Organizador ni el Juez general de un Torneo llegan a la salida", () => {
  const torneo = parsearFichaDeTorneo(10776, FICHA_DE_TORNEO);

  expect(JSON.stringify(torneo)).not.toContain("Maria Ana Repetto");
  expect(JSON.stringify(torneo)).not.toContain("Myriam Morales");
});

/**
 * La variante "jugado" es la de un Torneo que ya pasó: conserva las Divisiones y sus horarios,
 * pierde Cupos y precios, y **las separa con " | " en vez de `<br>`**. Partir solo por `<br>`
 * dejaba a cada Torneo jugado con una sola División: 527 de 548 del archivo.
 */
test("la ficha de un Torneo ya jugado separa sus Divisiones con barras, no con <br>", () => {
  const jugado = `
    <html><head><title>TMT - Tenis de Mesa para Todos - Torneos de ping pong - 5&ordm; Torneo "Ciudad Feliz"</title></head>
    <body><div>Domingo, 3 de marzo de 2024</div>
    <table><tr><td><strong>Categor&iacute;as:</strong></td>
      <td><strong>3RA DIVISI&Oacute;N   - 10:00 hs. | 4TA DIVISI&Oacute;N   - 13:00 hs. | 5TA DIVISI&Oacute;N   - 16:00 hs. | </strong></td></tr></table>
    </body></html>
  `;

  const torneo = parsearFichaDeTorneo(9420, jugado);

  expect(torneo.conCupos).toBe(false);
  expect(torneo.divisiones.map((division) => [division.nombre, division.hora])).toEqual([
    ["3RA DIVISIÓN", "10:00"],
    ["4TA DIVISIÓN", "13:00"],
    ["5TA DIVISIÓN", "16:00"],
  ]);
});

// ADR-0004: las listas se ordenan por separado justamente para que no se pueda reconstruir a
// nadie. Si se ordenaran juntas, cada par (rating, edad) seguiría siendo una ficha.
test("las distribuciones salen ordenadas por separado, sin conservar quién es quién", () => {
  const muestra = distribuciones(
    [
      { rating: 1800, edad: 20 },
      { rating: 900, edad: 60 },
      { rating: 1400, edad: 40 },
    ],
    [26, 5, 111],
  );

  expect(muestra.rating).toEqual([900, 1400, 1800]);
  expect(muestra.edad).toEqual([20, 40, 60]);
  expect(muestra.plantel).toEqual([5, 26, 111]);
});

test("las distribuciones descartan lo que el sitio no publica", () => {
  const muestra = distribuciones([{ rating: null, edad: 30 }, { rating: 1200, edad: null }], [null, 0, 12]);

  expect(muestra.rating).toEqual([1200]);
  expect(muestra.edad).toEqual([30]);
  expect(muestra.plantel).toEqual([12]);
});
