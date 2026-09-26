import { useState, useEffect, useMemo } from 'react'
import { useStore } from '../store.jsx'
import Thumb from './Thumb.jsx'
import { weekDates, shiftWeekISO, formatWeekLabel, dayName, formatShortDate, todayISO, slotKey, formatTime12, startOfWeekISO } from '../lib/dates.js'
import { PLANNER_SLOTS } from '../lib/recipes.js'

function RecipePicker({ date, slot, onClose, onPick }) {
  const store = useStore()
  const [query, setQuery] = useState('')

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const q = query.trim().toLowerCase()
  const matches = useMemo(
    () =>
      store.allRecipes.filter(r => {
        if (!q) return true
        const cuisine = store.data.lookups.cuisineById[r.cuisineId]
        return `${r.title} ${r.shortDescription} ${cuisine ? cuisine.name : ''}`.toLowerCase().includes(q)
      }),
    [store.allRecipes, store.data.lookups, q]
  )

  const suggested = matches
    .filter(r => r.includeInMealSuggestions)
    .sort((a, b) => {
      const am = store.data.lookups.mealTypeById[a.mealTypeId]
      const bm = store.data.lookups.mealTypeById[b.mealTypeId]
      const aMatch = am && am.name === slot ? 0 : 1
      const bMatch = bm && bm.name === slot ? 0 : 1
      return aMatch - bMatch
    })
  const suggestedIds = new Set(suggested.map(r => r.id))
  const others = matches.filter(r => !suggestedIds.has(r.id))

  function RowList({ list }) {
    return list.map(r => (
      <li key={r.id}>
        <button type="button" className="picker-row" onClick={() => onPick(r.id)}>
          <Thumb src={r.coverImageUrl} alt="" className="picker-thumb" />
          <span className="picker-info">
            <strong>{r.title}</strong>
            <span className="muted small">
              {store.data.lookups.cuisineById[r.cuisineId] ? store.data.lookups.cuisineById[r.cuisineId].name : 'Recipe'}
              {' \u00B7 '}
              {store.data.lookups.mealTypeById[r.mealTypeId] ? store.data.lookups.mealTypeById[r.mealTypeId].name : 'Any meal'}
            </span>
          </span>
        </button>
      </li>
    ))
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={`Choose a recipe for ${slot}`} onMouseDown={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>Choose a recipe</h3>
            <p className="muted small">{slot} {'\u00B7'} {dayName(date)}, {formatShortDate(date)}</p>
          </div>
          <button type="button" className="btn quiet sm" onClick={onClose} aria-label="Close">{'\u00D7'}</button>
        </div>
        <input
          type="search"
          className="input"
          placeholder={'Search recipes\u2026'}
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
          aria-label="Search recipes"
        />
        <div className="modal-body">
          {suggested.length > 0 && (
            <>
              <p className="picker-group">Suggested for your plans</p>
              <ul className="picker-list"><RowList list={suggested} /></ul>
            </>
          )}
          {others.length > 0 && (
            <>
              <p className="picker-group">All recipes</p>
              <ul className="picker-list"><RowList list={others} /></ul>
            </>
          )}
          {matches.length === 0 && <p className="muted">No recipes match your search.</p>}
        </div>
      </div>
    </div>
  )
}

export default function Planner({ onOpenRecipe }) {
  const store = useStore()
  const weekStart = store.prefs.weekStart
  const dates = weekDates(weekStart)
  const [picker, setPicker] = useState(null)
  const today = todayISO()

  function gotoWeek(delta) {
    store.setWeekStart(shiftWeekISO(weekStart, delta))
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Weekly meal planner</h1>
          <p className="muted">
            {store.plannedCountWeek} meal{store.plannedCountWeek === 1 ? '' : 's'} planned this week
            {' \u00B7 '} changes save automatically
          </p>
        </div>
      </div>

      <div className="toolbar planner-toolbar">
        <div className="weeknav">
          <button type="button" className="btn ghost sm" onClick={() => gotoWeek(-1)} aria-label="Previous week">{'\u2039'} Prev</button>
          <strong className="week-label">{formatWeekLabel(weekStart)}</strong>
          <button type="button" className="btn ghost sm" onClick={() => gotoWeek(1)} aria-label="Next week">Next {'\u203A'}</button>
        </div>
        <button type="button" className="btn ghost sm" onClick={() => store.setWeekStart(startOfWeekISO(todayISO()))}>
          This week
        </button>
      </div>

      <div className="planner-scroll">
        <div className="planner-grid" role="grid" aria-label="Weekly meal plan">
          <div className="planner-corner" />
          {dates.map(d => (
            <div key={d} className={`day-head${d === today ? ' today' : ''}`}>
              <span className="day-head-name">{dayName(d)}</span>
              <span className="day-head-date">{formatShortDate(d)}</span>
            </div>
          ))}

          {PLANNER_SLOTS.map(slot => (
            <SlotRow key={slot} slot={slot} dates={dates} store={store} onOpenPicker={setPicker} onOpenRecipe={onOpenRecipe} />
          ))}
        </div>
      </div>

      <p className="muted small planner-hint">
        Select an empty slot to choose a recipe. Planned recipes feed the shopping list automatically.
      </p>

      {picker && (
        <RecipePicker
          date={picker.date}
          slot={picker.slot}
          onClose={() => setPicker(null)}
          onPick={recipeId => {
            store.assignSlot(picker.date, picker.slot, recipeId, null)
            setPicker(null)
          }}
        />
      )}
    </div>
  )
}

function SlotRow({ slot, dates, store, onOpenPicker, onOpenRecipe }) {
  const today = todayISO()
  return (
    <>
      <div className="slot-label">{slot}</div>
      {dates.map(d => {
        const key = slotKey(d, slot)
        const entry = store.mealPlan[key]
        const recipe = entry ? store.recipesById[entry.recipeId] : null
        return (
          <div key={key} className={`slot-cell${d === today ? ' today' : ''}`} role="gridcell">
            {entry && recipe ? (
              <div className="plan-card" style={{ '--accent': recipe.accentColor || 'var(--brand)' }}>
                <Thumb src={recipe.coverImageUrl} alt="" className="plan-thumb" />
                <div className="plan-info">
                  <button type="button" className="plan-title" onClick={() => onOpenRecipe(recipe.id)}>
                    {recipe.title}
                  </button>
                  {entry.serveTime && <span className="plan-time">{formatTime12(entry.serveTime)}</span>}
                </div>
                <div className="plan-actions">
                  <button type="button" className="btn quiet xs" onClick={() => onOpenPicker({ date: d, slot })} aria-label={`Replace ${recipe.title}`}>
                    Replace
                  </button>
                  <button
                    type="button"
                    className="btn quiet xs danger-text"
                    onClick={() => store.unassignSlot(d, slot)}
                    aria-label={`Remove ${recipe.title} from ${slot}`}
                  >
                    {'\u00D7'}
                  </button>
                </div>
              </div>
            ) : entry && !recipe ? (
              <div className="plan-card missing">
                <div className="plan-info">
                  <span className="muted small">Unknown recipe</span>
                </div>
                <div className="plan-actions">
                  <button type="button" className="btn quiet xs danger-text" onClick={() => store.unassignSlot(d, slot)}>
                    {'\u00D7'}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="slot-add" onClick={() => onOpenPicker({ date: d, slot })} aria-label={`Add ${slot} for ${dayName(d)} ${formatShortDate(d)}`}>
                <span className="slot-add-plus">+</span>
              </button>
            )}
          </div>
        )
      })}
    </>
  )
}
