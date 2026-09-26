import { useMemo, useState } from 'react'
import OptionsMenu from './OptionsMenu.jsx'
import PlanFields, { defaultPlanDraft } from './PlanFields.jsx'
import {
  PLACEHOLDER_IMAGE, cuisineById, mealTypeById, dietaryTagById, categoryById,
  PLAN_SLOTS, SPICE_LABELS, slotForMealType,
} from '../lib/data.js'
import { convertQuantity, formatQuantity, formatMinutes } from '../lib/units.js'
import { estimateNutrition } from '../lib/nutrition.js'
import { SUBSTITUTIONS } from '../lib/substitutions.js'
import { fmtDayDate, fmtDateTimeLocal } from '../lib/dates.js'

function groupIngredientsBySection(recipe) {
  const order = []
  const groups = new Map()
  for (const entry of recipe.ingredients || []) {
    const section = entry.sectionName || 'Main'
    if (!groups.has(section)) {
      groups.set(section, [])
      order.push(section)
    }
    groups.get(section).push(entry)
  }
  return order.map((section) => ({ section, entries: groups.get(section) }))
}

export default function RecipeDetail({ recipe, options, onOptionsChange, onBack, plan, onAssign, onGoPlanner }) {
  const [imgOk, setImgOk] = useState(true)
  const [planDraft, setPlanDraft] = useState(() => defaultPlanDraft(slotForMealType(recipe.mealTypeId)))
  const [addedNote, setAddedNote] = useState('')

  const src = recipe.coverImageUrl && imgOk ? recipe.coverImageUrl : PLACEHOLDER_IMAGE
  const cuisine = cuisineById.get(recipe.cuisineId)
  const mealType = mealTypeById.get(recipe.mealTypeId)
  const tags = (recipe.dietaryTagIds || []).map((id) => dietaryTagById.get(id)).filter(Boolean)
  const cats = (recipe.categoryIds || []).map((id) => categoryById.get(id)).filter(Boolean)
  const sections = useMemo(() => groupIngredientsBySection(recipe), [recipe])
  const nutrition = useMemo(() => (options.showNutrition ? estimateNutrition(recipe) : null), [options.showNutrition, recipe])

  const plannedInstances = useMemo(() => {
    const out = []
    for (const [dateISO, day] of Object.entries(plan || {})) {
      for (const slot of PLAN_SLOTS) {
        const a = day?.[slot.key]
        if (a && a.recipeId === recipe.id) out.push({ dateISO, slot: slot.label, assignment: a })
      }
    }
    return out.sort((a, b) => a.dateISO.localeCompare(b.dateISO))
  }, [plan, recipe.id])

  function handleAddToPlan() {
    onAssign(planDraft.dayISO, planDraft.slot, recipe.id, {
      serveTime: planDraft.serveTime || null,
      cookDateTime: planDraft.cookDateTime || null,
    })
    const slotLabel = PLAN_SLOTS.find((s) => s.key === planDraft.slot)?.label || planDraft.slot
    setAddedNote(`Added to ${slotLabel} on ${fmtDayDate(planDraft.dayISO)}. It is now in your planner and shopping list.`)
  }

  return (
    <section className="view detail-view">
      <button type="button" className="btn btn-ghost back-link" onClick={onBack}>← All recipes</button>

      <div className="detail-hero" style={{ '--accent': recipe.accentColor }}>
        <div className="hero-img">
          <img src={src} alt={recipe.title} onError={() => setImgOk(false)} />
        </div>
        <div className="hero-body">
          <div className="hero-title-row">
            <h2>{recipe.title}</h2>
            <OptionsMenu options={options} onChange={onOptionsChange} />
          </div>
          {recipe.shortDescription && <p className="hero-desc">{recipe.shortDescription}</p>}
          <div className="card-meta">
            {cuisine && <span>{cuisine.name}</span>}
            {mealType && <span>{mealType.name}</span>}
            {recipe.includeInSuggestions && <span className="badge badge-suggest">In meal-plan suggestions</span>}
          </div>
          <div className="meta-strip">
            <div className="meta-item"><span className="meta-label">Servings</span><span className="meta-value">{recipe.servings}</span></div>
            <div className="meta-item"><span className="meta-label">Prep</span><span className="meta-value">{formatMinutes(recipe.prepMinutes) || '—'}</span></div>
            <div className="meta-item"><span className="meta-label">Cook</span><span className="meta-value">{formatMinutes(recipe.cookMinutes) || '—'}</span></div>
            <div className="meta-item"><span className="meta-label">Total</span><span className="meta-value">{formatMinutes(recipe.totalMinutes) || '—'}</span></div>
            <div className="meta-item">
              <span className="meta-label">Spice</span>
              <span className="meta-value">
                <span className="spice-dots" aria-hidden="true">
                  {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className={i < recipe.spiceLevel ? 'dot dot-on' : 'dot'} />)}
                </span>
                {SPICE_LABELS[recipe.spiceLevel] || 'Not spicy'}
              </span>
            </div>
            {recipe.difficulty != null && (
              <div className="meta-item"><span className="meta-label">Difficulty</span><span className="meta-value">{recipe.difficulty} / 5</span></div>
            )}
          </div>
          {(tags.length > 0 || cats.length > 0) && (
            <div className="card-tags">
              {tags.map((t) => <span key={t.id} className="tag tag-diet">{t.name}</span>)}
              {cats.map((c) => <span key={c.id} className="tag">{c.name}</span>)}
            </div>
          )}
          {recipe.sourceUrl && (
            <p className="source-line">
              Source: {recipe.sourceName ? `${recipe.sourceName} · ` : ''}
              <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">{recipe.sourceUrl.replace(/^https?:\/\//, '').slice(0, 60)}…</a>
            </p>
          )}
          {!recipe.sourceUrl && recipe.sourceName && <p className="source-line">Source: {recipe.sourceName}</p>}
        </div>
      </div>

      {nutrition && (
        <div className="nutrition-panel">
          <h4>Nutrition (estimated per serving)</h4>
          <div className="nutrition-stats">
            <div><strong>{nutrition.kcal}</strong><span>kcal</span></div>
            <div><strong>{nutrition.protein} g</strong><span>protein</span></div>
            <div><strong>{nutrition.carbs} g</strong><span>carbs</span></div>
            <div><strong>{nutrition.fat} g</strong><span>fat</span></div>
          </div>
          <p className="muted tiny">Estimates generated from the ingredient list; not lab-verified.</p>
        </div>
      )}

      <div className="detail-columns">
        <div className="detail-col">
          <h3>Ingredients</h3>
          {sections.length === 0 && <p className="muted">No ingredients listed.</p>}
          {sections.map(({ section, entries }) => (
            <div className="ing-detail-section" key={section}>
              <h4>{section}</h4>
              <ul className="ing-detail-list">
                {entries.map((entry, i) => {
                  const converted = convertQuantity(entry.quantity, entry.unit, options.unitSystem)
                  const sub = options.allowSubstitutions && entry.ingredientId ? SUBSTITUTIONS[entry.ingredientId] : null
                  return (
                    <li key={`${entry.name}-${i}`}>
                      <div className="ing-detail-main">
                        <span className="ing-detail-qty">
                          {converted.quantity != null ? formatQuantity(converted.quantity) : ''}
                          {converted.unit ? ` ${converted.unit}` : ''}
                        </span>
                        <span className="ing-detail-name">
                          {entry.name}
                          {entry.notes && <span className="muted"> · {entry.notes}</span>}
                        </span>
                        {entry.optional && <span className="tag tag-optional">optional</span>}
                      </div>
                      {sub && <div className="ing-sub">Substitution: {sub}</div>}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="detail-col">
          <h3>Method</h3>
          {recipe.steps.length === 0 && <p className="muted">No steps listed.</p>}
          <ol className="steps-list">
            {recipe.steps.map((step, i) => (
              <li key={i}>
                <span className="step-num" aria-hidden="true">{i + 1}</span>
                <div>
                  <p>{step.instruction}</p>
                  {step.timerMinutes != null && step.timerMinutes > 0 && (
                    <span className="timer-pill">Timer · {formatMinutes(step.timerMinutes)}</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="plan-card" style={{ '--accent': recipe.accentColor }}>
        <h3>Add to weekly meal plan</h3>
        {plannedInstances.length > 0 && (
          <ul className="planned-lines">
            {plannedInstances.map((p) => (
              <li key={`${p.dateISO}-${p.slot}`}>
                Planned: <strong>{p.slot}</strong> on {fmtDayDate(p.dateISO)}
                {p.assignment.serveTime && <span className="muted"> · serve {p.assignment.serveTime}</span>}
                {p.assignment.cookDateTime && <span className="muted"> · cook {fmtDateTimeLocal(p.assignment.cookDateTime)}</span>}
              </li>
            ))}
          </ul>
        )}
        <PlanFields value={planDraft} onChange={setPlanDraft} />
        <div className="plan-card-actions">
          <button type="button" className="btn btn-primary" onClick={handleAddToPlan}>Add to meal plan</button>
          <button type="button" className="btn btn-outline" onClick={onGoPlanner}>Open planner</button>
        </div>
        {addedNote && <p className="added-note" role="status">{addedNote}</p>}
      </div>
    </section>
  )
}
