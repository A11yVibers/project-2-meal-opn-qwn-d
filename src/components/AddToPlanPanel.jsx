import { useState, useEffect } from 'react'
import { useStore } from '../store.jsx'
import { weekDates, shiftWeekISO, formatWeekLabel, formatDayHeader, dayName, formatShortDate, todayISO, slotKey, formatDateTime } from '../lib/dates.js'
import { PLANNER_SLOTS, slotForMealType } from '../lib/recipes.js'

export default function AddToPlanPanel({ recipe }) {
  const store = useStore()
  const [weekStart, setWeekStart] = useState(store.prefs.weekStart)
  const dates = weekDates(weekStart)
  const [date, setDate] = useState(() => {
    const t = todayISO()
    return weekDates(store.prefs.weekStart).includes(t) ? t : store.prefs.weekStart
  })
  const [slot, setSlot] = useState(slotForMealType(recipe.mealTypeId))
  const [serveTime, setServeTime] = useState('')
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (!dates.includes(date)) setDate(dates[0])
  }, [weekStart])

  const existing = store.mealPlan[slotKey(date, slot)]
  const existingRecipe = existing ? store.recipesById[existing.recipeId] : null

  function changeWeek(delta) {
    const next = shiftWeekISO(weekStart, delta)
    setWeekStart(next)
    const t = todayISO()
    setDate(weekDates(next).includes(t) ? t : next)
  }

  function add() {
    store.assignSlot(date, slot, recipe.id, serveTime)
    if (weekStart !== store.prefs.weekStart) store.setWeekStart(weekStart)
    setMessage(`Added to plan: ${slot} \u00B7 ${formatDateTime(date, serveTime)}`)
  }

  return (
    <div className="plan-panel">
      <div className="weeknav">
        <button type="button" className="btn ghost sm" onClick={() => changeWeek(-1)} aria-label="Previous week">{'\u2039'}</button>
        <strong>{formatWeekLabel(weekStart)}</strong>
        <button type="button" className="btn ghost sm" onClick={() => changeWeek(1)} aria-label="Next week">{'\u203A'}</button>
      </div>

      <p className="field-label">Planned cooking date</p>
      <div className="day-chips" role="radiogroup" aria-label="Planned cooking date">
        {dates.map(d => (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={d === date}
            className={`day-chip${d === date ? ' active' : ''}${d === todayISO() ? ' today' : ''}`}
            onClick={() => setDate(d)}
          >
            <span className="day-chip-name">{dayName(d)}</span>
            <span className="day-chip-date">{formatShortDate(d)}</span>
          </button>
        ))}
      </div>

      <p className="field-label">Planned serving time (meal slot)</p>
      <div className="segmented wide" role="radiogroup" aria-label="Meal slot">
        {PLANNER_SLOTS.map(s => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={s === slot}
            className={`seg${s === slot ? ' active' : ''}`}
            onClick={() => setSlot(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <p className="field-label">Specific date and time (optional)</p>
      <div className="time-row">
        <input
          type="time"
          className="input"
          value={serveTime}
          onChange={e => setServeTime(e.target.value)}
          aria-label="Specific serving time"
        />
        <span className="muted small">{formatDayHeader(date)}{serveTime ? ` at ${formatDateTime(date, serveTime).split(' at ')[1]}` : ''}</span>
      </div>

      {existingRecipe && (
        <p className="warn-note small">
          This slot already has <strong>{existingRecipe.title}</strong> {'\u2014'} adding will replace it.
        </p>
      )}

      <div className="plan-actions">
        <button type="button" className="btn primary" onClick={add}>
          Add to meal plan
        </button>
        {message && <span className="ok-note small">{message}</span>}
      </div>
    </div>
  )
}
