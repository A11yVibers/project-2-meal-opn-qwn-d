import { useMemo, useState } from 'react'
import { SLOT_LABELS, SLOT_MEAL_TYPE, SLOTS, cuisineById, mealTypeById } from '../csv.js'
import { addDaysISO, formatDayNum, formatMinutes, formatWeekRange, formatWeekday, startOfWeekISO, todayISO, weekDatesISO } from '../format.js'
import Thumb from './Thumb.jsx'

function RecipePickerModal({ recipes, slot, date, onPick, onClose }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const { suggested, others } = useMemo(() => {
    const list = recipes.filter((r) => {
      if (!q) return true
      const cuisine = cuisineById[r.cuisineId] || ''
      return `${r.title} ${r.shortDescription || ''} ${cuisine}`.toLowerCase().includes(q)
    })
    const sug = list.filter((r) => r.includeInMealSuggestions && (!slot || !SLOT_MEAL_TYPE[slot] || r.mealTypeId === SLOT_MEAL_TYPE[slot] || q))
    const sugIds = new Set(sug.map((r) => r.id))
    return { suggested: q ? [] : sug, others: list.filter((r) => !sugIds.has(r.id) || q) }
  }, [recipes, q, slot])

  const renderItem = (r) => (
    <button key={r.id} type="button" className="picker-item" onClick={() => onPick(r.id)}>
      <Thumb className="picker-thumb" src={r.coverImageUrl} alt="" />
      <span className="picker-info">
        <span className="picker-title">{r.title}</span>
        <span className="picker-meta">
          {[cuisineById[r.cuisineId], mealTypeById[r.mealTypeId], formatMinutes(r.totalMinutes)].filter(Boolean).join(' · ')}
        </span>
      </span>
    </button>
  )

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Choose a recipe" onClick={onClose}>
      <div className="modal picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>
            Choose a recipe
            <span className="subtle"> · {formatDayNum(date)}, {SLOT_LABELS[slot]}</span>
          </h3>
          <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <input
          type="search"
          autoFocus
          placeholder="Search recipes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search recipes"
        />
        <div className="picker-list">
          {suggested.length > 0 ? (
            <>
              <p className="picker-group">Suggested for {SLOT_LABELS[slot]}</p>
              {suggested.map(renderItem)}
            </>
          ) : null}
          <p className="picker-group">{q ? 'Results' : 'All recipes'}</p>
          {others.map(renderItem)}
          {others.length === 0 && suggested.length === 0 ? <p className="subtle">No recipes found.</p> : null}
        </div>
      </div>
    </div>
  )
}

export default function Planner({ recipes, recipeById, mealPlan, weekStart, onWeekStart, onAssign, onRemove, onOpenRecipe }) {
  const [picking, setPicking] = useState(null)
  const days = weekDatesISO(weekStart)
  const today = todayISO()

  const plannedCount = days.reduce((n, d) => n + Object.keys(mealPlan[d] || {}).length, 0)

  const goToday = () => onWeekStart(startOfWeekISO(todayISO()))

  return (
    <section className="planner">
      <div className="planner-head">
        <div>
          <h2>Weekly meal planner</h2>
          <p className="subtle">{plannedCount} meal{plannedCount === 1 ? '' : 's'} planned · click an empty slot to add a recipe</p>
        </div>
        <div className="week-nav">
          <button type="button" className="btn btn-outline" onClick={() => onWeekStart(addDaysISO(weekStart, -7))}>‹ Prev week</button>
          <button type="button" className="btn btn-outline" onClick={goToday}>Today</button>
          <button type="button" className="btn btn-outline" onClick={() => onWeekStart(addDaysISO(weekStart, 7))}>Next week ›</button>
        </div>
      </div>
      <p className="week-range">{formatWeekRange(weekStart)}</p>

      <div className="planner-scroll">
        <div className="planner-grid" role="grid" aria-label={`Meal plan for ${formatWeekRange(weekStart)}`}>
          <div className="pg-corner" />
          {days.map((d) => (
            <div key={d} className={`pg-day ${d === today ? 'is-today' : ''}`}>
              <span className="pg-weekday">{formatWeekday(d)}</span>
              <span className="pg-date">{formatDayNum(d)}</span>
            </div>
          ))}
          {SLOTS.map((slot) => (
            <div key={slot} className="pg-slotrow">
              <div className="pg-slot-label">{SLOT_LABELS[slot]}</div>
              {days.map((d) => {
                const entry = mealPlan[d]?.[slot]
                const recipe = entry ? recipeById[entry.recipeId] : null
                return (
                  <div key={`${d}-${slot}`} className={`pg-cell ${d === today ? 'is-today' : ''} ${entry && !recipe ? 'is-missing' : ''}`}>
                    {entry && recipe ? (
                      <div className="plan-card" style={{ '--accent': recipe.accentColor }}>
                        <button type="button" className="plan-card-main" onClick={() => onOpenRecipe(recipe.id)} title="Open recipe">
                          <Thumb className="plan-card-thumb" src={recipe.coverImageUrl} alt="" />
                          <span className="plan-card-title">{recipe.title}</span>
                          {entry.time ? <span className="plan-card-time">{entry.time}</span> : null}
                        </button>
                        <span className="plan-card-actions">
                          <button
                            type="button"
                            className="btn btn-icon btn-sm"
                            title="Replace recipe"
                            aria-label={`Replace ${recipe.title}`}
                            onClick={() => setPicking({ date: d, slot })}
                          >⇄</button>
                          <button
                            type="button"
                            className="btn btn-icon btn-sm btn-danger"
                            title="Remove from plan"
                            aria-label={`Remove ${recipe.title}`}
                            onClick={() => onRemove(d, slot)}
                          >✕</button>
                        </span>
                      </div>
                    ) : entry && !recipe ? (
                      <div className="plan-card is-missing">
                        <span className="plan-card-title">Missing recipe</span>
                        <span className="plan-card-actions">
                          <button type="button" className="btn btn-icon btn-sm btn-danger" title="Remove" onClick={() => onRemove(d, slot)}>✕</button>
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="pg-empty"
                        aria-label={`Add recipe to ${SLOT_LABELS[slot]} on ${formatDayNum(d)}`}
                        onClick={() => setPicking({ date: d, slot })}
                      >
                        +
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {picking ? (
        <RecipePickerModal
          recipes={recipes}
          slot={picking.slot}
          date={picking.date}
          onClose={() => setPicking(null)}
          onPick={(recipeId) => {
            onAssign(picking.date, picking.slot, recipeId, mealPlan[picking.date]?.[picking.slot]?.time || null)
            setPicking(null)
          }}
        />
      ) : null}
    </section>
  )
}
