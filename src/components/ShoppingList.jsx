import { useStore } from '../store.jsx'
import { formatWeekLabel, shiftWeekISO, startOfWeekISO, todayISO } from '../lib/dates.js'
import { formatQty } from '../lib/units.js'

function displayText(display) {
  return display
    .map(d => (d.qty == null ? d.unit : `${formatQty(d.qty)} ${d.unit}`.trim()))
    .filter(Boolean)
    .join(' + ')
}

export default function ShoppingListView({ onGoPlanner }) {
  const store = useStore()
  const { shopping, checked, pantry, prefs } = store

  const checkedCount = shopping.categories.reduce(
    (s, cat) => s + cat.items.filter(it => checked[it.key]).length,
    0
  )
  const progress = shopping.totalItems > 0 ? Math.round((checkedCount / shopping.totalItems) * 100) : 0

  function gotoWeek(delta) {
    store.setWeekStart(shiftWeekISO(prefs.weekStart, delta))
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Shopping list</h1>
          <p className="muted">
            Auto-generated from the meal plan for {formatWeekLabel(prefs.weekStart)}
            {shopping.usedRecipes.length > 0 && ` \u00B7 ${shopping.usedRecipes.length} recipe${shopping.usedRecipes.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      <div className="toolbar planner-toolbar">
        <div className="weeknav">
          <button type="button" className="btn ghost sm" onClick={() => gotoWeek(-1)} aria-label="Previous week">{'\u2039'} Prev</button>
          <strong className="week-label">{formatWeekLabel(prefs.weekStart)}</strong>
          <button type="button" className="btn ghost sm" onClick={() => gotoWeek(1)} aria-label="Next week">Next {'\u203A'}</button>
        </div>
        <button type="button" className="btn ghost sm" onClick={() => store.setWeekStart(startOfWeekISO(todayISO()))}>
          This week
        </button>
      </div>

      {shopping.entryCount > 0 && (
        <div className="card shop-controls">
          <div className="shop-progress">
            <div className="progress-track" aria-hidden="true">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="muted small">
              {checkedCount} of {shopping.totalItems} items checked
            </span>
          </div>
          <div className="shop-toggles">
            <label className="check-row inline">
              <input
                type="checkbox"
                checked={prefs.hidePantry}
                onChange={e => store.setPref('hidePantry', e.target.checked)}
              />
              <span>Exclude ingredients already in my pantry</span>
            </label>
            <div className="segmented" role="radiogroup" aria-label="Shopping list measurements">
              <button
                type="button"
                role="radio"
                aria-checked={prefs.listUnitSystem === 'us'}
                className={`seg${prefs.listUnitSystem === 'us' ? ' active' : ''}`}
                onClick={() => store.setPref('listUnitSystem', 'us')}
              >
                US customary
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={prefs.listUnitSystem === 'metric'}
                className={`seg${prefs.listUnitSystem === 'metric' ? ' active' : ''}`}
                onClick={() => store.setPref('listUnitSystem', 'metric')}
              >
                Metric
              </button>
            </div>
            {checkedCount > 0 && (
              <button type="button" className="btn ghost sm" onClick={store.clearChecked}>
                Clear checked
              </button>
            )}
          </div>
        </div>
      )}

      {shopping.skippedRecipes.length > 0 && (
        <p className="muted small">
          Ingredients hidden for {shopping.skippedRecipes.length} planned recipe
          {shopping.skippedRecipes.length === 1 ? '' : 's'} with "Include ingredients in generated shopping lists"
          turned off: {shopping.skippedRecipes.map(r => r.title).join(', ')}.
        </p>
      )}

      {shopping.entryCount === 0 ? (
        <div className="empty-state">
          <p>Nothing is planned for this week yet.</p>
          <p className="muted small">Add recipes to meal slots in the planner and your shopping list builds itself.</p>
          <button type="button" className="btn primary" onClick={onGoPlanner}>Open the planner</button>
        </div>
      ) : shopping.totalItems === 0 && shopping.pantryItems.length > 0 ? (
        <div className="empty-state">
          <p>Every planned ingredient is already in your pantry.</p>
        </div>
      ) : (
        <div className="shopping-groups">
          {shopping.categories.map(cat => (
            <section key={cat.name} className="card shop-category">
              <h2>
                {cat.name}
                <span className="cat-count">{cat.items.length}</span>
              </h2>
              <ul className="shop-items">
                {cat.items.map(item => (
                  <li key={item.key} className={checked[item.key] ? 'shop-item checked' : 'shop-item'}>
                    <label className="shop-check">
                      <input
                        type="checkbox"
                        checked={!!checked[item.key]}
                        onChange={() => store.toggleChecked(item.key)}
                        aria-label={`Check off ${item.name}`}
                      />
                    </label>
                    <div className="shop-item-body">
                      <span className="shop-item-name">{item.name}</span>
                      {item.display.length > 0 && (
                        <span className="shop-item-qty">{displayText(item.display)}</span>
                      )}
                      {item.optional && <span className="chip tiny">optional</span>}
                      {item.notes.length > 0 && (
                        <span className="shop-item-notes muted small">{item.notes.join(', ')}</span>
                      )}
                      <span className="shop-item-recipes muted small">
                        {item.recipes.length <= 3
                          ? item.recipes.join(', ')
                          : `${item.recipes.slice(0, 2).join(', ')} +${item.recipes.length - 2} more`}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn quiet xs"
                      onClick={() => store.togglePantry(item.ingredientKey)}
                      title="Exclude this ingredient as already in your pantry"
                    >
                      In pantry
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {shopping.pantryItems.length > 0 && (
        <section className="card shop-category pantry-section">
          <h2>
            In your pantry (excluded)
            <span className="cat-count">{shopping.pantryItems.length}</span>
          </h2>
          <ul className="pantry-items">
            {shopping.pantryItems.map(item => (
              <li key={item.key}>
                <span>{item.name}</span>
                {item.display.length > 0 && <span className="muted small">{displayText(item.display)}</span>}
                <button
                  type="button"
                  className="btn quiet xs"
                  onClick={() => store.togglePantry(item.ingredientKey)}
                >
                  Remove from pantry
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {shopping.entryCount > 0 && (
        <p className="muted small">
          Planned recipes: {shopping.usedRecipes.map(r => r.title).join(', ')}. The list updates automatically as the
          plan changes.
        </p>
      )}
    </div>
  )
}
