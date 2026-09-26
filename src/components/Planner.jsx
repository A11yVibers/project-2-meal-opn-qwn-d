import { useState } from 'react'
import RecipePicker from './RecipePicker.jsx'
import { PLAN_SLOTS, PLACEHOLDER_IMAGE } from '../lib/data.js'
import { weekDates, addDaysISO, todayISO, startOfWeekISO, fmtWeekday, fmtDateShort, fmtRange, fmtDateTimeLocal } from '../lib/dates.js'

export default function Planner({ weekStart, setWeekStart, plan, recipesById, recipes, onAssign, onUnassign, onOpenRecipe }) {
  const [picker, setPicker] = useState(null)
  const days = weekDates(weekStart)
  const today = todayISO()

  let plannedCount = 0
  for (const d of days) {
    for (const slot of PLAN_SLOTS) {
      if (plan[d]?.[slot.key]) plannedCount++
    }
  }

  return (
    <section className="view">
      <div className="view-head">
        <div>
          <h2>Weekly meal planner</h2>
          <p className="muted">{plannedCount} meal{plannedCount === 1 ? '' : 's'} planned this week · saved in your browser</p>
        </div>
        <div className="week-nav">
          <button type="button" className="btn btn-outline btn-icon" aria-label="Previous week" onClick={() => setWeekStart(addDaysISO(weekStart, -7))}>←</button>
          <button type="button" className="btn btn-outline" onClick={() => setWeekStart(startOfWeekISO(todayISO()))}>This week</button>
          <span className="week-range" aria-live="polite">{fmtRange(weekStart)}</span>
          <button type="button" className="btn btn-outline btn-icon" aria-label="Next week" onClick={() => setWeekStart(addDaysISO(weekStart, 7))}>→</button>
        </div>
      </div>

      <div className="planner-scroll">
        <div className="planner-grid" role="grid" aria-label={`Meal plan for ${fmtRange(weekStart)}`}>
          <div className="planner-corner" />
          {days.map((d) => (
            <div key={d} className={`planner-day-head${d === today ? ' is-today' : ''}`}>
              <span className="day-name">{fmtWeekday(d)}</span>
              <span className="day-date">{fmtDateShort(d)}</span>
            </div>
          ))}
          {PLAN_SLOTS.map((slot) => (
            <SlotRow
              key={slot.key}
              slot={slot}
              days={days}
              plan={plan}
              recipesById={recipesById}
              onOpenPicker={(dateISO) => setPicker({ dateISO, slotKey: slot.key })}
              onUnassign={onUnassign}
              onOpenRecipe={onOpenRecipe}
            />
          ))}
        </div>
      </div>

      {picker && (
        <RecipePicker
          dateISO={picker.dateISO}
          slotKey={picker.slotKey}
          recipes={recipes}
          onClose={() => setPicker(null)}
          onSelect={(recipe) => {
            onAssign(picker.dateISO, picker.slotKey, recipe.id, {})
            setPicker(null)
          }}
        />
      )}
    </section>
  )
}

function SlotRow({ slot, days, plan, recipesById, onOpenPicker, onUnassign, onOpenRecipe }) {
  return (
    <>
      <div className="planner-slot-label">{slot.label}</div>
      {days.map((d) => {
        const assignment = plan[d]?.[slot.key]
        const recipe = assignment ? recipesById.get(assignment.recipeId) : null
        return (
          <div key={d} className="planner-cell">
            {assignment && recipe ? (
              <div className="slot-recipe" style={{ '--accent': recipe.accentColor }}>
                <img
                  src={recipe.coverImageUrl || PLACEHOLDER_IMAGE}
                  alt=""
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE }}
                />
                <button type="button" className="slot-title" onClick={() => onOpenRecipe(recipe.id)} title="Open recipe">
                  {recipe.title}
                </button>
                {(assignment.serveTime || assignment.cookDateTime) && (
                  <div className="slot-times">
                    {assignment.serveTime && <span>Serve {assignment.serveTime}</span>}
                    {assignment.cookDateTime && <span>Cook {fmtDateTimeLocal(assignment.cookDateTime)}</span>}
                  </div>
                )}
                <div className="slot-actions">
                  <button type="button" className="btn btn-icon btn-sm" title="Replace recipe" aria-label={`Replace ${recipe.title}`} onClick={() => onOpenPicker(d)}>↻</button>
                  <button type="button" className="btn btn-icon btn-sm btn-danger" title="Remove from plan" aria-label={`Remove ${recipe.title}`} onClick={() => onUnassign(d, slot.key)}>✕</button>
                </div>
              </div>
            ) : (
              <button type="button" className="slot-add" onClick={() => onOpenPicker(d)} aria-label={`Add ${slot.label} recipe on ${d}`}>
                + Add
              </button>
            )}
          </div>
        )
      })}
    </>
  )
}
