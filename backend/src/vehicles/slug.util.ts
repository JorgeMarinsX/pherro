// Vehicle slug generation. Stable, immutable post-create.
// Format: <kebab-make>-<kebab-model>-<year>-<6-char-suffix>

const SUFFIX_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function kebab(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function randomSuffix(len = 6): string {
  let out = ''
  for (let i = 0; i < len; i++) {
    out += SUFFIX_ALPHABET[Math.floor(Math.random() * SUFFIX_ALPHABET.length)]
  }
  return out
}

export function buildVehicleSlug(make: string, model: string, year: number): string {
  return `${kebab(make)}-${kebab(model)}-${year}-${randomSuffix()}`
}
