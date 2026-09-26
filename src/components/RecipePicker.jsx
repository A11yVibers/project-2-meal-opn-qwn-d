import { useEffect, useMemo, useState } from 'react'
import { PLACEHOLDER_IMAGE, cuisineById, mealTypeById, PLAN_SLOTS } from '../lib/data.js'
import { formatMinutes } from '../lib/units.js'
import { fmtDayDate } from '../lib/dates.js'

export default function RecipePicker({ dateISO, slotKey, recipes, onClose, onSelect }) {
  const [query, setQuery] = useState('')
  const [suggestedOnly, setSuggestedOnly] = useState(false)
  const slot = PLAN_SLOTS.find((s) => s.key === slotKey)

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = recipes
    if (suggestedOnly) list = list.filter((r) => r.includeInSuggestions)
    if (q) {
      list = list.filter((r) =>
        r.title.toLowerCase().includes(q) ||
        (cuisineById.get(r.cuisineId)?.name || '').toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => {
      const aMatch = a.mealTypeId === slot?.mealTypeId ? 0 : 1
      const bMatch = b.mealTypeId === slot?.mealTypeId ? 0 : 1
      if (aMatch !== bMatch) return aMatch - bMatch
      return a.title.localeCompare(b.title)
    })
  }, [recipes, query, suggestedOnly, slot])

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-label="Choose a recipe" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{slot ? slot.label : 'Meal'} · {fmtDayDate(dateISO)}</h3>
            <p className="muted">Choose a recipe for this slot. Matching meal types are listed first.</p>
          </div>
          <button type="button" className="btn btn-icon" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-controls">
          <input
            type="search"
            className="input"
            placeholder="Search recipes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            aria-label="Search recipes"
          />
          <label className="checkline inline">
            <input type="checkbox" checked={suggestedOnly} onChange={(e) => setSuggestedOnly(e.target.checked)} />
            <span>Suggested only</span>
          </label>
        </div>
        <ul className="picker-list">
          {filtered.map((r) => (
            <li key={r.id}>
              <button type="button" className="picker-item" onClick={() => onSelect(r)}>
                <img src={r.coverImageUrl || PLACEHOLDER_IMAGE} alt="" loading="lazy" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE }} />
                <span className="picker-info">
                  <span className="picker-title">{r.title}</span>
                  <span className="picker-meta">
                    {cuisineById.get(r.cuisineId)?.name} · {mealTypeById.get(r.mealTypeId)?.name}
                    {r.totalMinutes > 0 ? ` · ${formatMinutes(r.totalMinutes)}` : ''}
                  </span>
                </span>
                {r.includeInSuggestions && <span className="badge badge-suggest">Suggested</span>}
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li className="picker-empty muted">No recipes match.</li>}
        </ul>
      </div>
    </div>
  )
}
