import { useMemo, useState } from 'react'
import { ingredients as ALL_INGREDIENTS } from '../lib/data.js'
import { addDaysISO, fmtRange } from '../lib/dates.js'
import { formatQuantity } from '../lib/units.js'

const CATEGORY_ORDER = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices',
  'Other',
]

export default function ShoppingList({
  weekStart, setWeekStart, list, shoppingState, setShoppingState, onGoPlanner,
}) {
  const [pantryOpen, setPantryOpen] = useState(false)
  const [pantryQuery, setPantryQuery] = useState('')
  const { checked, pantry, excludePantry } = shoppingState

  const checkedKey = (item) => `${weekStart}|${item.key}`
  const allItems = useMemo(() => list.groups.flatMap((g) => g.items), [list])
  const checkedCount = allItems.filter((item) => checked[checkedKey(item)]).length

  function toggleItem(item) {
    setShoppingState((prev) => {
      const key = checkedKey(item)
      const next = { ...prev.checked }
      if (next[key]) delete next[key]
      else next[key] = true
      return { ...prev, checked: next }
    })
  }

  function togglePantry(name) {
    const lower = name.toLowerCase()
    setShoppingState((prev) => ({
      ...prev,
      pantry: prev.pantry.includes(lower) ? prev.pantry.filter((n) => n !== lower) : [...prev.pantry, lower],
    }))
  }

  function clearChecked() {
    setShoppingState((prev) => {
      const next = {}
      for (const [k, v] of Object.entries(prev.checked)) {
        if (!k.startsWith(`${weekStart}|`)) next[k] = v
      }
      return { ...prev, checked: next }
    })
  }

  const pantryGroups = useMemo(() => {
    const q = pantryQuery.trim().toLowerCase()
    const filtered = q ? ALL_INGREDIENTS.filter((i) => i.name.toLowerCase().includes(q)) : ALL_INGREDIENTS
    const map = new Map()
    for (const ing of filtered) {
      if (!map.has(ing.category)) map.set(ing.category, [])
      map.get(ing.category).push(ing)
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({ category: c, items: map.get(c) }))
  }, [pantryQuery])

  return (
    <section className="view">
      <div className="view-head">
        <div>
          <h2>Shopping list</h2>
          <p className="muted">
            Auto-generated from {list.plannedRecipeIds.length} planned meal{list.plannedRecipeIds.length === 1 ? '' : 's'} · week of {fmtRange(weekStart)}
          </p>
        </div>
        <div className="week-nav">
          <button type="button" className="btn btn-outline btn-icon" aria-label="Previous week" onClick={() => setWeekStart(addDaysISO(weekStart, -7))}>←</button>
          <span className="week-range">{fmtRange(weekStart)}</span>
          <button type="button" className="btn btn-outline btn-icon" aria-label="Next week" onClick={() => setWeekStart(addDaysISO(weekStart, 7))}>→</button>
        </div>
      </div>

      <div className="shopping-layout">
        <div className="shopping-main">
          {list.totalItems === 0 ? (
            <div className="empty-state">
              <p>Nothing to shop for this week yet.</p>
              <p className="muted">Add recipes to the meal plan and their ingredients will appear here automatically.</p>
              <button type="button" className="btn btn-primary" onClick={onGoPlanner}>Open the planner</button>
            </div>
          ) : (
            <>
              <div className="shopping-toolbar">
                <div className="progress-wrap" title={`${checkedCount} of ${allItems.length} checked`}>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${allItems.length ? (checkedCount / allItems.length) * 100 : 0}%` }} /></div>
                  <span className="muted">{checkedCount} / {allItems.length} checked</span>
                </div>
                <label className="checkline inline switch-line">
                  <input
                    type="checkbox"
                    checked={excludePantry}
                    onChange={(e) => setShoppingState((prev) => ({ ...prev, excludePantry: e.target.checked }))}
                  />
                  <span>Exclude pantry items</span>
                </label>
                {checkedCount > 0 && <button type="button" className="btn btn-outline btn-sm" onClick={clearChecked}>Clear checked</button>}
              </div>

              {list.groups.map((group) => (
                <div className="shopping-group" key={group.category}>
                  <h4>{group.category} <span className="muted count">({group.items.length})</span></h4>
                  <ul className="shopping-items">
                    {group.items.map((item) => {
                      const isChecked = Boolean(checked[checkedKey(item)])
                      return (
                        <li key={item.key} className={isChecked ? 'checked' : ''}>
                          <label className="item-main">
                            <input type="checkbox" checked={isChecked} onChange={() => toggleItem(item)} />
                            <span className="item-name">{item.name}</span>
                          </label>
                          <span className="item-qty">
                            {item.hasQuantity ? formatQuantity(Math.round(item.quantity * 100) / 100) : ''}
                            {item.unit ? ` ${item.unit}` : ''}
                          </span>
                          {item.optional && <span className="tag tag-optional">optional</span>}
                          <span className="item-src">
                            {item.notes && <span className="muted">{item.notes} · </span>}
                            {item.recipes.join(', ')}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}

              {excludePantry && list.excludedItems.length > 0 && (
                <div className="shopping-group excluded-group">
                  <h4>Skipped — already in your pantry <span className="muted count">({list.excludedItems.length})</span></h4>
                  <p className="muted tiny">{list.excludedItems.map((i) => i.name).join(', ')}</p>
                </div>
              )}
            </>
          )}
        </div>

        <aside className="pantry-panel">
          <button type="button" className="pantry-toggle" aria-expanded={pantryOpen} onClick={() => setPantryOpen((o) => !o)}>
            <strong>My pantry</strong>
            <span className="muted">{pantry.length} item{pantry.length === 1 ? '' : 's'}</span>
            <span className="caret" aria-hidden="true">{pantryOpen ? '▴' : '▾'}</span>
          </button>
          {pantryOpen && (
            <div className="pantry-body">
              <p className="muted tiny">Mark what you already have at home. With “Exclude pantry items” on, these are left off the list.</p>
              <input
                type="search"
                className="input"
                placeholder="Find an ingredient…"
                value={pantryQuery}
                onChange={(e) => setPantryQuery(e.target.value)}
                aria-label="Search pantry ingredients"
              />
              <div className="pantry-groups">
                {pantryGroups.map((group) => (
                  <div key={group.category}>
                    <h5>{group.category}</h5>
                    <ul className="pantry-items">
                      {group.items.map((ing) => (
                        <li key={ing.id}>
                          <label>
                            <input type="checkbox" checked={pantry.includes(ing.name.toLowerCase())} onChange={() => togglePantry(ing.name)} />
                            <span>{ing.name}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
