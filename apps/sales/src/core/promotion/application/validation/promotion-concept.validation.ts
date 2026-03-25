import { TransformFnParams } from 'class-transformer';

export const PROMOTION_CONCEPT_PATTERN = /^[\p{L}\p{N} ]+$/u;
export const PROMOTION_CONCEPT_MESSAGE =
  'El campo concepto solo permite letras, numeros y espacios visibles';

export function normalizePromotionConcept({ value }: TransformFnParams): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.normalize('NFC').trim().replace(/ {2,}/g, ' ');
}
