/**
 * Las Secciones de la aplicación y a cuál de ellas pertenece cada ruta.
 *
 * No importa Next: la barra inferior y el encabezado la consumen, pero se testea sola.
 */

export type Seccion = {
  readonly titulo: string;
  readonly href: string;
  /** Solo cuatro Secciones entran en la barra inferior; el resto se alcanza desde adentro. */
  readonly enLaBarra: boolean;
};

/**
 * `as const` no es cosmético: mantiene cada `href` como tipo literal, que es lo que
 * `typedRoutes` necesita para verificar contra las rutas que existen de verdad en `app/`.
 */
export const SECCIONES = [
  { titulo: "Inicio", href: "/", enLaBarra: false },
  { titulo: "Torneos", href: "/torneos", enLaBarra: true },
  { titulo: "Clubes", href: "/clubes", enLaBarra: true },
  { titulo: "Ranking", href: "/ranking", enLaBarra: true },
  { titulo: "Jugadores", href: "/jugadores", enLaBarra: false },
  { titulo: "Perfil", href: "/perfil", enLaBarra: true },
] as const satisfies readonly Seccion[];

export type SeccionDeLaBarra = Extract<(typeof SECCIONES)[number], { enLaBarra: true }>;

// El predicado hace que el tipo diga lo mismo que el filtro: acá adentro solo hay las cuatro
// Secciones de la barra. Sin él, TypeScript dejaría pasar Inicio o Jugadores.
export const SECCIONES_DE_LA_BARRA: readonly SeccionDeLaBarra[] = SECCIONES.filter(
  (seccion): seccion is SeccionDeLaBarra => seccion.enLaBarra,
);

/**
 * La Sección a la que pertenece una ruta, o `undefined` si no cuelga de ninguna.
 *
 * Una ficha queda dentro de su Sección: `/clubes/san-lorenzo` es Clubes. Inicio no necesita
 * excepción aunque su `href` sea prefijo de todo: la comparación de prefijo exige la barra
 * siguiente, y ninguna ruta empieza con `//`.
 */
export function seccionActiva(pathname: string): Seccion | undefined {
  return SECCIONES.find(
    (seccion) => seccion.href === pathname || pathname.startsWith(`${seccion.href}/`),
  );
}
