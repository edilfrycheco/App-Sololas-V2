/**
 * Validadores específicos de República Dominicana.
 *
 * Cubre los formatos que la app usa en formularios de personas y facturación:
 * - Cédula RD (11 dígitos con dígito verificador, algoritmo Luhn modificado)
 * - RNC (9 dígitos con dígito verificador)
 * - Teléfono RD (códigos 809 / 829 / 849 + 7 dígitos)
 */

const CEDULA_REGEX = /^\d{11}$/;
const RNC_REGEX = /^\d{9}$/;
const PHONE_REGEX = /^\(?(809|829|849)\)?[-\s.]?\d{3}[-\s.]?\d{4}$/;

/** Algoritmo de validación de cédula RD (Luhn modificado, multiplicadores 1,2,1,2…). */
export function isValidCedula(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  if (!CEDULA_REGEX.test(digits)) return false;

  const multipliers = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let product = Number(digits[i]) * multipliers[i];
    if (product >= 10) product = Math.floor(product / 10) + (product % 10);
    sum += product;
  }
  const expected = (10 - (sum % 10)) % 10;
  return expected === Number(digits[10]);
}

/** Validación básica de RNC (9 dígitos). */
export function isValidRnc(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  return RNC_REGEX.test(digits);
}

/** Acepta cédula (11) o RNC (9). */
export function isValidCedulaOrRnc(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11) return isValidCedula(digits);
  if (digits.length === 9) return isValidRnc(digits);
  return false;
}

/** Teléfono RD: 809 / 829 / 849 + 7 dígitos. */
export function isValidRdPhone(input: string): boolean {
  return PHONE_REGEX.test(input.trim());
}

/** Normaliza una cédula/RNC quitando espacios, guiones y puntos. */
export function normalizeCedulaRnc(input: string): string {
  return input.replace(/\D/g, "");
}

/** Formatea una cédula como `001-1234567-8` (formato canónico DGII). */
export function formatCedula(input: string): string {
  const digits = normalizeCedulaRnc(input);
  if (digits.length !== 11) return input;
  return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
}

/** Formatea un RNC como `1-23-45678-9`. */
export function formatRnc(input: string): string {
  const digits = normalizeCedulaRnc(input);
  if (digits.length !== 9) return input;
  return `${digits.slice(0, 1)}-${digits.slice(1, 3)}-${digits.slice(3, 8)}-${digits.slice(8)}`;
}

/** Formatea un teléfono RD como `(809) 123-4567`. */
export function formatRdPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length !== 10) return input;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
