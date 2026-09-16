import { useMemo, useState } from 'react'
import { cuisineById, mealTypeById, dietaryTagById, categoryById, SLOTS, SLOT_LABELS, SLOT_MEAL_TYPE } from '../csv.js'
import {
  formatMinutes, formatQtyUnit, SPICE_LABELS, startOfWeekISO, todayISO,
  addDaysISO, formatWeekRange, formatDayShort,
} from '../format.js'
import { estimateNutrition, substitutionsFor } from '../nutrition.js'
import OptionsMenu from './OptionsMenu.jsx'
import Thumb from './Thumb.jsx'

function weekChoices(weekStart) {
  const list = []
  for (let offset = -2; offset <= 8; offset += 1) {
    const ws = addDaysISO(weekStart, offset * 7)
    let label = `Week of ${formatWeekRange(ws).split('–')[0].trim()}`
    if (ws === weekStart) label += ' (shown in planner)'
    if (ws === startOfWeekISO(todayISO())) label += ' · this week'
    list.push({ value: ws, label })
  }
  return list
}

export default function RecipeDetail({ recipe, options, onOptionsChange, onBack, onAssign, plannedEntries, initialWeekStart }) {
  const [servings, setServings] = useState(recipe.servings || 1)
  const [planOpen, setPlanOpen] = useState(false)
  const [planWeek, setPlanWeek] = useState(initialWeekStart)
  const [planDate, setPlanDate] = useState(initialWeekStart)
  const [planSlot, setPlanSlot] = useState(
    () => SLOTS.find((s) => SLOT_MEAL_TYPE[s] && SLOT_MEAL_TYPE[s] === recipe.mealTypeId) || 'dinner',
  )
  const [planTime, setPlanTime] = useState('')

  const scale = servings / Math.max(1, recipe.servings || 1)
  const nutrition = useMemo(() => (options.showNutrition ? estimateNutrition(recipe) : null), [options.showNutrition, recipe])

  const sections = useMemo(() => {
    const order = []
    const map = new Map()
    for (const ing of recipe.ingredients || []) {
      const key = ing.section || 'Ingredients'
      if (!map.has(key)) { map.set(key, []); order.push(key) }
      map.get(key).push(ing)
    }
    return order.map((name) => ({ name, items: map.get(name) }))
  }, [recipe])

  const setWeek = (ws) => {
    setPlanWeek(ws)
    setPlanDate(ws)
  }

  const submitPlan = () => {
    if (!planDate) return
    onAssign(planDate, planSlot, recipe.id, planTime || null)
    setPlanOpen(false)
    setPlanTime('')
  }

  return (
    <section className="detail" style={{ '--accent': recipe.accentColor }}>
      <button type="button" className="btn btn-ghost back-link" onClick={onBack}>← Back to catalog</button>

      <div className="detail-hero">
        <Thumb className="hero-img" src={recipe.coverImageUrl} alt={recipe.title} />
        <div className="hero-info">
          <h2>{recipe.title}</h2>
          {recipe.shortDescription ? <p className="hero-desc">{recipe.shortDescription}</p> : null}
          <div className="hero-chips">
            {recipe.cuisineId && cuisineById[recipe.cuisineId] ? <span className="chip">{cuisineById[recipe.cuisineId]}</span> : null}
            {recipe.mealTypeId && mealTypeById[recipe.mealTypeId] ? <span className="chip">{mealTypeById[recipe.mealTypeId]}</span> : null}
            {recipe.dietaryTagIds?.map((id) => <span key={id} className="tag">{dietaryTagById[id] || id}</span>)}
          </div>
          {recipe.sourceName || recipe.sourceUrl ? (
            <p className="hero-source">
              Source:{' '}
              {recipe.sourceUrl
                ? <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">{recipe.sourceName || recipe.sourceUrl}</a>
                : <span>{recipe.sourceName}</span>}
            </p>
          ) : null}
          <div className="detail-actions">
            <button type="button" className="btn btn-primary" onClick={() => setPlanOpen((o) => !o)}>
              {planOpen ? 'Close planner' : 'Add to meal plan'}
            </button>
            <OptionsMenu value={options} onChange={onOptionsChange} />
          </div>
          {plannedEntries.length > 0 ? (
            <div className="planned-chips">
              <span className="planned-label">Planned:</span>
              {plannedEntries.map((p) => (
                <span key={`${p.date}-${p.slot}`} className="chip chip-planned">{formatDayShort(p.date)} · {SLOT_LABELS[p.slot]}{p.time ? ` · ${p.time}` : ''}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {planOpen ? (
        <div className="plan-popover">
          <div className="plan-fields">
            <label>
              <span>Meal-planning week</span>
              <select value={planWeek} onChange={(e) => setWeek(e.target.value)}>
                {weekChoices(initialWeekStart).map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </label>
            <label>
              <span>Cooking date</span>
              <input
                type="date"
                value={planDate}
                min={planWeek}
                max={addDaysISO(planWeek, 6)}
                onChange={(e) => e.target.value && setPlanDate(e.target.value)}
              />
            </label>
            <label>
              <span>Serving time slot</span>
              <select value={planSlot} onChange={(e) => setPlanSlot(e.target.value)}>
                {SLOTS.map((s) => <option key={s} value={s}>{SLOT_LABELS[s]}</option>)}
              </select>
            </label>
            <label>
              <span>Time (optional)</span>
              <input type="time" value={planTime} onChange={(e) => setPlanTime(e.target.value)} />
            </label>
          </div>
          <div className="plan-popover-actions">
            <button type="button" className="btn btn-primary" onClick={submitPlan} disabled={!planDate}>Add to plan</button>
          </div>
        </div>
      ) : null}

      <div className="facts">
        <div className="fact">
          <span className="fact-label">Servings</span>
          <span className="servings-stepper">
            <button type="button" onClick={() => setServings((s) => Math.max(1, s - 1))} aria-label="Fewer servings">−</button>
            <strong>{servings}</strong>
            <button type="button" onClick={() => setServings((s) => Math.min(99, s + 1))} aria-label="More servings">+</button>
          </span>
        </div>
        <div className="fact"><span className="fact-label">Prep</span><strong>{formatMinutes(recipe.prepMinutes)}</strong></div>
        <div className="fact"><span className="fact-label">Cook</span><strong>{formatMinutes(recipe.cookMinutes)}</strong></div>
        <div className="fact"><span className="fact-label">Total</span><strong>{formatMinutes(recipe.totalMinutes)}</strong></div>
        <div className="fact">
          <span className="fact-label">Spice level</span>
          <strong>{SPICE_LABELS[recipe.spiceLevel] || '—'}</strong>
          <span className="spice-dots" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => <span key={i} className={i < recipe.spiceLevel ? 'dot on' : 'dot'} />)}
          </span>
        </div>
        {recipe.difficulty ? <div className="fact"><span className="fact-label">Difficulty</span><strong>{recipe.difficulty} / 5</strong></div> : null}
        {recipe.categoryIds?.length ? (
          <div className="fact fact-wide">
            <span className="fact-label">Categories</span>
            <span className="card-tags">{recipe.categoryIds.map((id) => <span key={id} className="tag">{categoryById[id] || id}</span>)}</span>
          </div>
        ) : null}
      </div>

      {nutrition ? (
        <div className="nutrition-panel">
          <h3>Nutrition <span className="subtle">(rough estimate, per serving)</span></h3>
          <div className="nutrition-grid">
            <div><strong>{nutrition.kcalPerServing}</strong><span>kcal</span></div>
            <div><strong>{nutrition.proteinG} g</strong><span>protein</span></div>
            <div><strong>{nutrition.carbsG} g</strong><span>carbs</span></div>
            <div><strong>{nutrition.fatG} g</strong><span>fat</span></div>
          </div>
        </div>
      ) : null}

      <div className="detail-columns">
        <div className="detail-col">
          <h3>Ingredients {scale !== 1 ? <span className="subtle">(scaled to {servings} servings)</span> : null}</h3>
          {sections.length === 0 ? <p className="subtle">No ingredients listed.</p> : null}
          {sections.map((sec) => (
            <div key={sec.name} className="ing-section">
              <h4>{sec.name}</h4>
              <ul className="ing-list">
                {sec.items.map((ing, idx) => {
                  const subs = options.allowSubstitutions ? substitutionsFor(ing.ingredientId) : []
                  return (
                    <li key={`${sec.name}-${idx}`}>
                      <span className="ing-qty">{ing.qty !== null && ing.qty !== undefined ? formatQtyUnit(ing.qty * scale, ing.unit, options.units) : formatQtyUnit(null, ing.unit, options.units)}</span>
                      <span className="ing-name">
                        {ing.name}
                        {ing.notes ? <span className="subtle"> · {ing.notes}</span> : null}
                        {ing.optional ? <span className="opt-badge">optional</span> : null}
                        {subs.length ? <span className="sub-hint">Substitute: {subs.join(' or ')}</span> : null}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="detail-col">
          <h3>Method</h3>
          {(!recipe.steps || recipe.steps.length === 0) ? <p className="subtle">No steps listed.</p> : null}
          <ol className="steps-list">
            {(recipe.steps || []).map((step, idx) => (
              <li key={idx}>
                <span className="step-num">{idx + 1}</span>
                <div>
                  <p>{step.instruction}</p>
                  {step.timerMinutes > 0 ? <span className="timer-badge">Timer · {formatMinutes(step.timerMinutes)}</span> : null}
                </div>
              </li>
            ))}
          </ol>
          <p className="subtle step-total">
            Active timer minutes: {formatMinutes((recipe.steps || []).reduce((sum, s) => sum + (Number(s.timerMinutes) || 0), 0))}
          </p>
        </div>
      </div>

      <p className="subtle week-hint">Tip: the planner is currently showing {formatWeekRange(initialWeekStart)}.</p>
    </section>
  )
}
