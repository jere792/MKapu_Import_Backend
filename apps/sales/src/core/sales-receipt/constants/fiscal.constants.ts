/**
 * Constantes fiscales de MKapu Import.
 * Fuente única de verdad para tasas impositivas en el backend.
 * Modificar aquí afecta automáticamente todos los cálculos de ventas,
 * PDF, notas de crédito y cualquier otro módulo que las importe.
 */

/** Tasa de IGV vigente en Perú: 18% */
export const IGV_RATE = 0.18;

/** Factor de conversión precio-con-IGV → precio-sin-IGV */
export const IGV_DIVISOR = 1 + IGV_RATE;

/**
 * Calcula el IGV de un monto base (sin IGV).
 * @param base  monto sin IGV
 */
export function calcularIgv(base: number): number {
  return Number((base * IGV_RATE).toFixed(2));
}

/**
 * Dado un precio sin IGV, devuelve el precio con IGV incluido.
 */
export function precioConIgv(precioBase: number): number {
  return Number((precioBase * IGV_DIVISOR).toFixed(2));
}

/**
 * Dado un precio con IGV incluido, devuelve la base sin IGV.
 */
export function precioSinIgv(precioConIgv: number): number {
  return Number((precioConIgv / IGV_DIVISOR).toFixed(2));
}
