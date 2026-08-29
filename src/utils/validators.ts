/** Iranian 10-digit national code with checksum */
export function validateNationalCode(code: string): boolean {
  if (!/^\d{10}$/.test(code)) return false
  if (new Set(code).size === 1) return false
  const d = code.split('').map(Number)
  const sum = d.slice(0, 9).reduce((acc, n, i) => acc + n * (10 - i), 0)
  const rem = sum % 11
  const check = rem < 2 ? rem : 11 - rem
  return d[9] === check
}

/**
 * Iranian 11-digit company national ID (شناسه ملی شرکت).
 * Only format is checked (11 digits, not all-repeated) — there is no single
 * reliable checksum formula for this field across all company ID series, and
 * the backend itself only enforces length, not a checksum. A too-strict
 * checksum here was rejecting real, valid company IDs.
 */
export function validateNationalId(id: string): boolean {
  if (!/^\d{11}$/.test(id)) return false
  if (new Set(id).size === 1) return false
  return true
}

/** Iranian mobile: exactly 11 digits, starts with 09 */
export function validateMobile(mobile: string): boolean {
  return /^09\d{9}$/.test(mobile)
}

/**
 * Validate a 13-digit bill identifier using the standard algorithm.
 * Digits 1-12 are weighted (right-to-left, weights cycle 2-7).
 * Digit 13 = (rem > 1 ? 11 - rem : 0) where rem = weightedSum % 11.
 */
export function validateBillIdentifier(id: string): boolean {
  if (!/^\d{13}$/.test(id)) return false
  const digits = id.split('').map(Number)
  let weight = 2
  let sum = 0
  for (let i = 11; i >= 0; i--) {
    sum += digits[i] * weight
    weight = weight === 7 ? 2 : weight + 1
  }
  const rem = sum % 11
  const expected = rem > 1 ? 11 - rem : 0
  return digits[12] === expected
}
