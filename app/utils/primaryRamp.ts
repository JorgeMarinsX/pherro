// Generates a Tailwind-style 50–950 ramp from a single brand hex (the 600
// step), tinting toward white and shading toward black. Approximation of a
// hand-tuned ramp — good enough for tenant-picked colors.
const TINTS: [step: string, whiteMix: number][] = [
  ['50', 0.95],
  ['100', 0.9],
  ['200', 0.8],
  ['300', 0.65],
  ['400', 0.45],
  ['500', 0.25],
]
const SHADES: [step: string, blackMix: number][] = [
  ['700', 0.15],
  ['800', 0.3],
  ['900', 0.45],
  ['950', 0.65],
]

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1]!, 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

const toHex = (rgb: number[]) =>
  `#${rgb.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`

const mix = (rgb: number[], target: number, p: number) =>
  rgb.map(c => c + (target - c) * p)

export function primaryRampCss(hex: string): string | null {
  const rgb = parseHex(hex)
  if (!rgb) return null
  const vars = [
    ...TINTS.map(([step, p]) => `--color-primary-${step}: ${toHex(mix(rgb, 255, p))};`),
    `--color-primary-600: ${toHex(rgb)};`,
    ...SHADES.map(([step, p]) => `--color-primary-${step}: ${toHex(mix(rgb, 0, p))};`),
    `--ui-primary: ${toHex(rgb)};`,
  ]
  return `:root { ${vars.join(' ')} }`
}
