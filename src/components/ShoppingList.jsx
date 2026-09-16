import { useMemo, useState } from 'react'
import { INGREDIENTS, SHOPPING_CATEGORY_ORDER } from '../csv.js'
import { addDaysISO, formatQty, formatWeekRange } from '../format.js'
import { buildShoppingItems } from '../shopping.js'

function pantryLabel(key) {
  if (key.startsWith('name:')) {
    const raw = key.slice(5)
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }
  return INGREDIENTS.find((i) => i.ingredient_id === key)?.ingredient_name || key
}

export default function ShoppingList({
  recipeById, mealPlan, weekStart, onWeekStart, allOptions,
  checked, setChecked, pantry, setPantry,
}) {
  const [excludePantry, setExcludePantry] = useState(true)
  const [pantryOpen, setPantryOpen] = useState(false)

  const { groups, itemCount, checkedCount } = useMemo(() => {
    const items = buildShoppingItems({ mealPlan, weekStart, recipeById, allOptions })

    const catMap = new Map()
    for (const item of items) {
      if (excludePantry && pantry.includes(item.key)) continue
      if (!catMap.has(item.category)) catMap.set(item.category, [])
      catMap.get(item.category).push(item)
    }
    const orderedNames = [...SHOPPING_CATEGORY_ORDER, 'Other']
    const result = orderedNames
      .filter((name) => catMap.has(name))
      .map((name) => ({ name, items: catMap.get(name).sort((a, b) => a.name.localeCompare(b.name)) }))

    let total = 0
    let done = 0
    for (const g of result) {
      for (const it of g.items) {
        total += 1
        if (checked.includes(it.key)) done += 1
      }
    }
    return { groups: result, itemCount: total, checkedCount: done }
  }, [mealPlan, weekStart, recipeById, allOptions, excludePantry, pantry, checked])

  const toggleChecked = (key) => {
    setChecked((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  const addToPantry = (key) => {
    if (!pantry.includes(key)) setPantry((prev) => [...prev, key])
  }

  const removeFromPantry = (key) => {
    setPantry((prev) => prev.filter((k) => k !== key))
  }

  const qtyLabel = (item) => {
    const parts = []
    for (const [unit, u] of item.units) {
      if (u.hasQty) parts.push(`${formatQty(u.qty)}${unit ? ` ${unit}` : ''}`)
      else if (unit) parts.push(unit)
    }
    return parts.join(' + ')
  }

  return (
    <section className="shopping">
      <div className="shopping-head">
        <div>
          <h2>Shopping list</h2>
          <p className="subtle">
            Auto-generated from the meal plan · {formatWeekRange(weekStart)}
            {itemCount > 0 ? ` · ${checkedCount} of ${itemCount} checked` : ''}
          </p>
        </div>
        <div className="week-nav">
          <button type="button" className="btn btn-outline" onClick={() => onWeekStart(addDaysISO(weekStart, -7))}>‹ Prev</button>
          <button type="button" className="btn btn-outline" onClick={() => onWeekStart(addDaysISO(weekStart, 7))}>Next ›</button>
        </div>
      </div>

      <div className="shopping-tools">
        <label className="checkline">
          <input type="checkbox" checked={excludePantry} onChange={(e) => setExcludePantry(e.target.checked)} />
          Exclude ingredients I already have (pantry)
        </label>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setPantryOpen((o) => !o)}>
          My pantry{pantry.length ? ` (${pantry.length})` : ''}
        </button>
        <button type="button" className="btn btn-outline btn-sm" disabled={checkedCount === 0} onClick={() => setChecked([])}>
          Uncheck all
        </button>
      </div>

      {pantryOpen ? (
        <div className="pantry-panel">
          <p className="options-title">Pantry — ingredients you already have</p>
          {pantry.length === 0 ? <p className="subtle">Nothing marked yet. Use “In pantry” on a shopping item to add it here.</p> : null}
          <div className="chip-row">
            {pantry.map((key) => (
              <span key={key} className="pantry-chip">
                {pantryLabel(key)}
                <button type="button" className="btn btn-icon btn-sm" aria-label={`Remove ${pantryLabel(key)} from pantry`} onClick={() => removeFromPantry(key)}>✕</button>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {itemCount === 0 ? (
        <div className="empty-state">
          <p>No ingredients to shop for this week.</p>
          <p className="subtle">Add recipes to the meal planner and the list builds itself. Recipes with “Include ingredients in shopping lists” turned off are skipped.</p>
        </div>
      ) : (
        <div className="shopping-groups">
          {groups.map((group) => (
            <div key={group.name} className="shopping-group">
              <h3>{group.name} <span className="subtle">({group.items.length})</span></h3>
              <ul className="shopping-items">
                {group.items.map((item) => {
                  const isChecked = checked.includes(item.key)
                  const inPantry = pantry.includes(item.key)
                  return (
                    <li key={item.key} className={isChecked ? 'is-checked' : ''}>
                      <label className="shopping-item-main">
                        <input type="checkbox" checked={isChecked} onChange={() => toggleChecked(item.key)} />
                        <span className="shopping-item-text">
                          <strong>{item.name}</strong>
                          {qtyLabel(item) ? <span className="shopping-qty">{qtyLabel(item)}</span> : null}
                          <span className="shopping-sources">
                            {[...item.sources.entries()].map(([title, n]) => `${title}${n > 1 ? ` ×${n}` : ''}`).join(', ')}
                          </span>
                        </span>
                      </label>
                      <button
                        type="button"
                        className={`btn btn-icon btn-sm ${inPantry ? 'btn-on' : ''}`}
                        title={inPantry ? 'In your pantry — click to remove' : 'Mark as already in pantry'}
                        aria-label={`Toggle pantry for ${item.name}`}
                        onClick={() => (inPantry ? removeFromPantry(item.key) : addToPantry(item.key))}
                      >⌂</button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
