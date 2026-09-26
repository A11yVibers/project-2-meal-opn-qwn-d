import { useStore } from '../store.jsx'
import Thumb from './Thumb.jsx'
import RecipeOptionsMenu from './RecipeOptionsMenu.jsx'
import AddToPlanPanel from './AddToPlanPanel.jsx'
import { convertForDisplay, formatQty } from '../lib/units.js'
import { formatMinutes, difficultyLabel, SPICE_LABELS, SUBSTITUTIONS, PLANNER_SLOTS } from '../lib/recipes.js'
import { formatDateTime } from '../lib/dates.js'

function IngredientQty({ item, system }) {
  if (item.quantity == null) return null
  const c = convertForDisplay(item.quantity, item.unit, system)
  const text = `${formatQty(c.qty)}${c.unit ? ' ' + c.unit : ''}`
  return <span className="ing-qty">{text}</span>
}

export default function RecipeDetail({ recipeId, onBack, onGoPlanner }) {
  const store = useStore()
  const recipe = store.recipesById[recipeId]

  if (!recipe) {
    return (
      <div className="page">
        <p>Recipe not found.</p>
        <button type="button" className="btn ghost" onClick={onBack}>{'\u2190'} Back to recipes</button>
      </div>
    )
  }

  const lk = store.data.lookups
  const options = store.getOptions(recipe)
  const cuisine = lk.cuisineById[recipe.cuisineId]
  const mealType = lk.mealTypeById[recipe.mealTypeId]
  const tags = recipe.dietaryTagIds.map(id => lk.tagById[id]).filter(Boolean)
  const cats = recipe.categoryIds.map(id => lk.categoryById[id]).filter(Boolean)
  const diff = difficultyLabel(recipe.difficulty)

  const placements = Object.entries(store.mealPlan)
    .filter(([, e]) => e.recipeId === recipe.id)
    .map(([key, e]) => {
      const [date, slot] = key.split('|')
      return { key, date, slot, serveTime: e.serveTime }
    })
    .sort((a, b) =>
      a.date === b.date ? PLANNER_SLOTS.indexOf(a.slot) - PLANNER_SLOTS.indexOf(b.slot) : a.date < b.date ? -1 : 1
    )

  return (
    <div className="page detail-page">
      <div className="detail-topbar">
        <button type="button" className="btn ghost sm" onClick={onBack}>{'\u2190'} Back to recipes</button>
        <RecipeOptionsMenu options={options} onChange={(k, v) => store.setRecipeOption(recipe.id, k, v)} />
      </div>

      <div className="detail-hero" style={{ '--accent': recipe.accentColor || 'var(--brand)' }}>
        <Thumb src={recipe.coverImageUrl} alt={recipe.title} className="hero-img" />
        <div className="hero-overlay">
          <div className="hero-text">
            <div className="chip-row">
              {mealType && <span className="chip light">{mealType.name}</span>}
              {cuisine && <span className="chip light">{cuisine.name}</span>}
              {recipe.source === 'user' && <span className="chip light">Your recipe</span>}
            </div>
            <h1>{recipe.title}</h1>
            {recipe.shortDescription && <p>{recipe.shortDescription}</p>}
          </div>
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <div className="stats-row">
            <div className="stat"><span className="stat-label">Servings</span><span className="stat-value">{recipe.servings ?? '\u2014'}</span></div>
            <div className="stat"><span className="stat-label">Prep</span><span className="stat-value">{formatMinutes(recipe.prepTimeMinutes)}</span></div>
            <div className="stat"><span className="stat-label">Cook</span><span className="stat-value">{formatMinutes(recipe.cookTimeMinutes)}</span></div>
            <div className="stat"><span className="stat-label">Total</span><span className="stat-value">{formatMinutes(recipe.totalTimeMinutes)}</span></div>
            <div className="stat"><span className="stat-label">Spice level</span><span className="stat-value">{SPICE_LABELS[recipe.spiceLevel] || SPICE_LABELS[0]}</span></div>
            {diff && <div className="stat"><span className="stat-label">Difficulty</span><span className="stat-value">{diff}</span></div>}
          </div>

          {options.showNutrition && (
            <section className="card nutrition-card">
              <h2>Nutrition</h2>
              <dl className="nutrition-grid">
                <div><dt>Servings per recipe</dt><dd>{recipe.servings ?? '\u2014'}</dd></div>
                <div><dt>Dietary suitability</dt><dd>{tags.length > 0 ? tags.map(t => t.name).join(', ') : '\u2014'}</dd></div>
                <div><dt>Spice level</dt><dd>{SPICE_LABELS[recipe.spiceLevel] || SPICE_LABELS[0]}</dd></div>
              </dl>
              <p className="muted small">Detailed nutrition facts are not provided in the source recipe data.</p>
            </section>
          )}

          <section className="card">
            <h2>Ingredients</h2>
            {(recipe.sections || []).length === 0 && <p className="muted">No ingredients recorded.</p>}
            {(recipe.sections || []).map(section => (
              <div key={section.name} className="ing-section-view">
                <h3>{section.name}</h3>
                <ul className="ing-list">
                  {section.items.map((item, idx) => {
                    const subs = options.allowSubstitutions
                      ? (SUBSTITUTIONS[item.ingredientId] || []).map(id => lk.ingredientById[id]).filter(Boolean)
                      : []
                    return (
                      <li key={`${item.name}-${idx}`}>
                        <IngredientQty item={item} system={options.measurements} />
                        <span className="ing-name">{item.name}</span>
                        {item.notes && <span className="ing-notes">({item.notes})</span>}
                        {item.optional && <span className="chip tiny">optional</span>}
                        {subs.length > 0 && (
                          <span className="ing-sub">Substitute: {subs.map(s => s.name).join(' or ')}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </section>

          <section className="card">
            <h2>Method</h2>
            {(recipe.steps || []).length === 0 && <p className="muted">No steps recorded.</p>}
            <ol className="step-list">
              {(recipe.steps || []).map((step, i) => (
                <li key={i}>
                  <span className="step-num">{i + 1}</span>
                  <div className="step-body">
                    <p>{step.instruction}</p>
                    {step.timerMinutes > 0 && <span className="chip timer">Timer: {formatMinutes(step.timerMinutes)}</span>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="detail-side">
          <div className="card side-card">
            <h2>About</h2>
            <dl className="meta-list">
              <div><dt>Cuisine</dt><dd>{cuisine ? cuisine.name : '\u2014'}</dd></div>
              <div><dt>Meal type</dt><dd>{mealType ? mealType.name : '\u2014'}</dd></div>
              <div><dt>Categories</dt><dd>{cats.length > 0 ? cats.map(c => c.name).join(', ') : '\u2014'}</dd></div>
              <div><dt>Dietary</dt><dd>{tags.length > 0 ? tags.map(t => t.name).join(', ') : '\u2014'}</dd></div>
              {recipe.sourceName && (
                <div>
                  <dt>Source</dt>
                  <dd>
                    {recipe.sourceUrl ? (
                      <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">{recipe.sourceName}</a>
                    ) : (
                      recipe.sourceName
                    )}
                  </dd>
                </div>
              )}
              {recipe.sourceUrl && !recipe.sourceName && (
                <div>
                  <dt>Source</dt>
                  <dd><a href={recipe.sourceUrl} target="_blank" rel="noreferrer">Original link</a></dd>
                </div>
              )}
            </dl>
          </div>

          <div className="card side-card">
            <h2>In the meal plan</h2>
            {placements.length === 0 ? (
              <p className="muted small">Not planned yet. Use the planner below or open the weekly planner.</p>
            ) : (
              <ul className="placement-list">
                {placements.map(p => (
                  <li key={p.key}>
                    <span>{formatDateTime(p.date, p.serveTime)} {'\u00B7'} {p.slot}</span>
                    <button type="button" className="btn quiet sm" onClick={() => store.removePlannedEntry(p.key)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className="btn ghost sm" onClick={onGoPlanner}>Open weekly planner</button>
          </div>

          <div className="card side-card">
            <h2>Add to a meal slot</h2>
            <AddToPlanPanel recipe={recipe} />
          </div>
        </aside>
      </div>
    </div>
  )
}
