const METRIC_CONVERSIONS = {
  oz: { unit: 'g', factor: 28.3495 },
  lb: { unit: 'g', factor: 453.592 },
  cup: { unit: 'ml', factor: 240 },
  tbsp: { unit: 'ml', factor: 15 },
  tsp: { unit: 'ml', factor: 5 },
}

const US_CONVERSIONS = {
  g: { unit: 'oz', factor: 1 / 28.3495 },
  kg: { unit: 'lb', factor: 2.20462 },
}

function roundQuantity(q) {
  if (q >= 100) return Math.round(q)
  if (q >= 10) return Math.round(q * 10) / 10
  return Math.round(q * 100) / 100
}

export function convertQuantity(qty, unit, system) {
  if (qty == null || !unit) return { quantity: qty, unit }
  const map = system === 'metric' ? METRIC_CONVERSIONS : US_CONVERSIONS
  const conv = map[unit]
  if (!conv) return { quantity: qty, unit }
  let q = roundQuantity(qty * conv.factor)
  let u = conv.unit
  if (system === 'metric') {
    if (u === 'g' && q >= 1000) { q = roundQuantity(q / 1000); u = 'kg' }
    if (u === 'ml' && q >= 1000) { q = roundQuantity(q / 1000); u = 'L' }
  }
  return { quantity: q, unit: u }
}

const FRACTIONS = [
  [0.25, '¼'],
  [1 / 3, '⅓'],
  [0.5, '½'],
  [2 / 3, '⅔'],
  [0.75, '¾'],
]

export function formatQuantity(qty) {
  if (qty == null || Number.isNaN(qty)) return ''
  const q = Math.floor(qty + 0.02) + (qty - Math.floor(qty + 0.02))
  const whole = Math.floor(q)
  const frac = q - whole
  if (frac < 0.03) return String(whole)
  let best = null
  let bestDelta = 0.05
  for (const [value, glyph] of FRACTIONS) {
    const delta = Math.abs(frac - value)
    if (delta < bestDelta) { bestDelta = delta; best = glyph }
  }
  if (best == null) return String(Math.round(qty * 100) / 100)
  return whole > 0 ? `${whole}${best}` : best
}

export function formatMinutes(mins) {
  if (mins == null) return ''
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`
}
