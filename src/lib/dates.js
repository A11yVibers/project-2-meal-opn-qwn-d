export function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO() {
  return toISODate(new Date())
}

export function startOfWeekISO(iso) {
  const d = fromISODate(iso)
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return toISODate(d)
}

export function addDaysISO(iso, n) {
  const d = fromISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

export function weekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i))
}

export function fmtWeekday(iso) {
  return fromISODate(iso).toLocaleDateString(undefined, { weekday: 'short' })
}

export function fmtDateShort(iso) {
  return fromISODate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function fmtDayDate(iso) {
  return fromISODate(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function fmtRange(weekStart) {
  const end = addDaysISO(weekStart, 6)
  const startYear = fromISODate(weekStart).getFullYear()
  const endYear = fromISODate(end).getFullYear()
  const start = fromISODate(weekStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const endStr = fromISODate(end).toLocaleDateString(
    undefined,
    startYear === endYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' },
  )
  return `${start} – ${endStr}`
}

export function fmtDateTimeLocal(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}
