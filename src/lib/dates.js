const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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
  const d = fromISODate(iso || todayISO())
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return toISODate(d)
}

export function addDaysISO(iso, n) {
  const d = fromISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

export function shiftWeekISO(weekStart, n) {
  return addDaysISO(weekStart, n * 7)
}

export function weekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i))
}

export function dayName(iso) {
  return DAY_NAMES[fromISODate(iso).getDay()]
}

export function formatShortDate(iso) {
  const d = fromISODate(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function formatDayHeader(iso) {
  return `${dayName(iso)}, ${formatShortDate(iso)}`
}

export function formatWeekLabel(weekStart) {
  const end = addDaysISO(weekStart, 6)
  const a = fromISODate(weekStart)
  const b = fromISODate(end)
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) {
    return `${MONTHS[a.getMonth()]} ${a.getDate()}\u2013${b.getDate()}, ${b.getFullYear()}`
  }
  if (a.getFullYear() === b.getFullYear()) {
    return `${MONTHS[a.getMonth()]} ${a.getDate()} \u2013 ${MONTHS[b.getMonth()]} ${b.getDate()}, ${b.getFullYear()}`
  }
  return `${MONTHS[a.getMonth()]} ${a.getDate()}, ${a.getFullYear()} \u2013 ${MONTHS[b.getMonth()]} ${b.getDate()}, ${b.getFullYear()}`
}

export function slotKey(date, slot) {
  return `${date}|${slot}`
}

export function formatTime12(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  if (isNaN(h)) return ''
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr}:${String(m || 0).padStart(2, '0')} ${ampm}`
}

export function formatDateTime(dateISO, hhmm) {
  const t = formatTime12(hhmm)
  return t ? `${formatDayHeader(dateISO)} at ${t}` : formatDayHeader(dateISO)
}
