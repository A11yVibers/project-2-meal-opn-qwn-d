import { PLAN_SLOTS } from '../lib/data.js'
import { todayISO, startOfWeekISO, addDaysISO, weekDates, fmtDayDate, fmtRange, fmtDateShort } from '../lib/dates.js'

export function defaultPlanDraft(slotKey = 'dinner') {
  const weekStart = startOfWeekISO(todayISO())
  const today = todayISO()
  const days = weekDates(weekStart)
  return {
    weekStart,
    dayISO: days.includes(today) ? today : days[0],
    slot: slotKey,
    serveTime: slotKey === 'breakfast' ? '08:00' : slotKey === 'lunch' ? '12:30' : slotKey === 'snack' ? '16:00' : '19:00',
    cookDateTime: '',
  }
}

export default function PlanFields({ value, onChange }) {
  const thisWeek = startOfWeekISO(todayISO())
  const weekChoices = [0, 1, 2, 3].map((k) => addDaysISO(thisWeek, k * 7))
  if (!weekChoices.includes(value.weekStart)) weekChoices.push(value.weekStart)
  weekChoices.sort()

  const days = weekDates(value.weekStart)
  const today = todayISO()

  function changeWeek(weekStart) {
    const prevIndex = weekDates(value.weekStart).indexOf(value.dayISO)
    const nextDays = weekDates(weekStart)
    onChange({ ...value, weekStart, dayISO: nextDays[prevIndex >= 0 ? prevIndex : 0] })
  }

  return (
    <div className="field-grid">
      <label className="field">
        <span>Meal-planning week</span>
        <select className="input" value={value.weekStart} onChange={(e) => changeWeek(e.target.value)}>
          {weekChoices.map((ws, i) => {
            const label = ws === thisWeek ? 'This week' : ws === addDaysISO(thisWeek, 7) ? 'Next week' : `Week of ${fmtDateShort(ws)}`
            return <option key={ws} value={ws}>{`${label} · ${fmtRange(ws)}`}</option>
          })}
        </select>
      </label>
      <label className="field">
        <span>Planned cooking date</span>
        <select className="input" value={value.dayISO} onChange={(e) => onChange({ ...value, dayISO: e.target.value })}>
          {days.map((d) => (
            <option key={d} value={d}>{fmtDayDate(d)}{d === today ? ' (today)' : ''}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Planned serving time (meal slot)</span>
        <select className="input" value={value.slot} onChange={(e) => onChange({ ...value, slot: e.target.value })}>
          {PLAN_SLOTS.map((slot) => <option key={slot.key} value={slot.key}>{slot.label}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Serving time of day (optional)</span>
        <input
          type="time"
          className="input"
          value={value.serveTime || ''}
          onChange={(e) => onChange({ ...value, serveTime: e.target.value })}
        />
      </label>
      <label className="field field-wide">
        <span>Planned cook date &amp; time (optional)</span>
        <input
          type="datetime-local"
          className="input"
          value={value.cookDateTime || ''}
          onChange={(e) => onChange({ ...value, cookDateTime: e.target.value })}
        />
      </label>
    </div>
  )
}
