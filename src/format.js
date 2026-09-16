export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromISODate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function todayISO() {
  return toISODate(new Date())
}

export function addDaysISO(iso, days) {
  const d = fromISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function startOfWeekISO(iso) {
  const d = fromISODate(iso)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return toISODate(d)
}

export function weekDatesISO(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i))
}

export function formatDayShort(iso) {
  return fromISODate(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatWeekday(iso) {
  return fromISODate(iso).toLocaleDateString(undefined, { weekday: 'short' })
}

export function formatDayNum(iso) {
  return fromISODate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function formatWeekRange(weekStart) {
  const end = addDaysISO(weekStart, 6)
  const a = fromISODate(weekStart)
  const b = fromISODate(end)
  const opts = { month: 'short', day: 'numeric' }
  return `${a.toLocaleDateString(undefined, opts)} – ${b.toLocaleDateString(undefined, { ...opts, year: 'numeric' })}`
}

export function formatMinutes(mins) {
  const n = Math.round(Number(mins) || 0)
  if (n <= 0) return '—'
  if (n < 60) return `${n} min`
  const h = Math.floor(n / 60)
  const m = n % 60
  return m ? `${h} hr ${m} min` : `${h} hr`
}

const FRACTIONS = { 0.25: '¼', 0.5: '½', 0.75: '¾', 0.33: '⅓', 0.67: '⅔', 0.125: '⅛' }

export function formatQty(qty) {
  const n = Number(qty)
  if (!Number.isFinite(n)) return ''
  if (n === 0) return '0'
  const rounded = Math.round(n * 100) / 100
  const whole = Math.floor(rounded)
  const frac = Math.round((rounded - whole) * 100) / 100
  const fracStr = FRACTIONS[frac]
  if (fracStr) return whole > 0 ? `${whole}${fracStr}` : fracStr
  return String(rounded)
}

const METRIC_VOLUME = { cup: 240, tbsp: 15, tsp: 5 }

export function convertQuantity(qty, unit, system) {
  const n = Number(qty)
  const u = String(unit || '').trim()
  if (!Number.isFinite(n) || !u) return { qty: n, unit: u }
  const lu = u.toLowerCase()
  const round = (v) => {
    if (v >= 100) return Math.round(v)
    if (v >= 10) return Math.round(v * 10) / 10
    return Math.round(v * 100) / 100
  }
  if (system === 'metric') {
    if (METRIC_VOLUME[lu]) return { qty: round(n * METRIC_VOLUME[lu]), unit: 'ml' }
    if (lu === 'oz') return { qty: round(n * 28.3495), unit: 'g' }
    if (lu === 'lb') return { qty: n * 453.592 >= 1000 ? round((n * 453.592) / 1000) : round(n * 453.592), unit: n * 453.592 >= 1000 ? 'kg' : 'g' }
    return { qty: n, unit: u }
  }
  if (lu === 'g') return n >= 453.592 ? { qty: round(n / 453.592), unit: 'lb' } : { qty: round(n / 28.3495), unit: 'oz' }
  if (lu === 'kg') return { qty: round((n * 1000) / 453.592), unit: 'lb' }
  if (lu === 'ml') {
    if (n >= 60) return { qty: round(n / 240), unit: 'cup' }
    if (n >= 10) return { qty: round(n / 15), unit: 'tbsp' }
    return { qty: round(n / 5), unit: 'tsp' }
  }
  if (lu === 'l') return { qty: round((n * 1000) / 240), unit: 'cup' }
  return { qty: n, unit: u }
}

export function formatQtyUnit(qty, unit, system) {
  if (unit === 'to taste' || unit === 'pinch') return unit
  if (qty === null || qty === undefined || qty === '') return unit || ''
  const converted = convertQuantity(qty, unit, system || 'us')
  const q = formatQty(converted.qty)
  return converted.unit ? `${q} ${converted.unit}` : q
}

export const SPICE_LABELS = ['Not spicy', 'Mild', 'Medium', 'Hot', 'Very spicy', 'Fiery']
