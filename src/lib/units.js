const WEIGHT_G = { g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237 }
const VOLUME_ML = { ml: 1, l: 1000, tsp: 4.92892159375, tbsp: 14.78676478125, cup: 236.5882365 }

export const METRIC_UNITS = new Set(['g', 'kg', 'ml', 'l'])
export const US_UNITS = new Set(['oz', 'lb', 'tsp', 'tbsp', 'cup'])

export function normalizeUnit(unit) {
  return (unit || '').trim().toLowerCase()
}

export function canonicalUnit(unit) {
  const u = (unit || '').trim()
  if (normalizeUnit(u) === 'l') return 'L'
  return u
}

export function unitDimension(unit) {
  const u = normalizeUnit(unit)
  if (u in WEIGHT_G) return 'weight'
  if (u in VOLUME_ML) return 'volume'
  return null
}

export function toBase(unit, qty) {
  const u = normalizeUnit(unit)
  if (u in WEIGHT_G) return qty * WEIGHT_G[u]
  if (u in VOLUME_ML) return qty * VOLUME_ML[u]
  return null
}

export function roundQty(n) {
  return Math.round(n * 100) / 100
}

export function formatQty(n) {
  if (n == null || isNaN(n)) return ''
  return String(roundQty(n))
}

export function displayFromBase(dim, base, system) {
  if (dim === 'weight') {
    if (system === 'metric') {
      return base >= 1000 ? { qty: base / 1000, unit: 'kg' } : { qty: base, unit: 'g' }
    }
    const oz = base / WEIGHT_G.oz
    return oz >= 16 ? { qty: oz / 16, unit: 'lb' } : { qty: oz, unit: 'oz' }
  }
  if (dim === 'volume') {
    if (system === 'metric') {
      return base >= 1000 ? { qty: base / 1000, unit: 'L' } : { qty: base, unit: 'ml' }
    }
    if (base < VOLUME_ML.tbsp) return { qty: base / VOLUME_ML.tsp, unit: 'tsp' }
    if (base < VOLUME_ML.cup / 4) return { qty: base / VOLUME_ML.tbsp, unit: 'tbsp' }
    return { qty: base / VOLUME_ML.cup, unit: 'cup' }
  }
  return { qty: base, unit: '' }
}

export function unitMatchesSystem(unit, system) {
  const u = normalizeUnit(unit)
  return system === 'metric' ? METRIC_UNITS.has(u) : US_UNITS.has(u)
}

export function convertForDisplay(qty, unit, system) {
  if (qty == null || isNaN(qty)) return { qty, unit: canonicalUnit(unit) }
  const dim = unitDimension(unit)
  if (!dim) return { qty, unit: canonicalUnit(unit) }
  if (unitMatchesSystem(unit, system)) return { qty, unit: canonicalUnit(unit) }
  const base = toBase(unit, qty)
  const d = displayFromBase(dim, base, system)
  return { qty: roundQty(d.qty), unit: d.unit }
}
