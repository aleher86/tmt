import type { ExoticComponent, ViewTransitionProps } from "react";

/**
 * `experimental.viewTransition` hace que Next aliase `react` a la copia experimental que trae
 * vendorizada, y esa copia exporta `unstable_ViewTransition`, no el `ViewTransition` estable
 * que declara `@types/react` 19.3. El tipo es el mismo; el nombre, no.
 *
 * Cuando Next deje de aliasar a la copia experimental, esto se borra y se importa
 * `ViewTransition` directo.
 */
declare module "react" {
  export const unstable_ViewTransition: ExoticComponent<ViewTransitionProps>;
}
