/** Tipo discriminado para resultados de Server Actions. */
export type ActionResult =
  | { success: true; id?: string }
  | { success: false; error: string }
