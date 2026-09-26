import { useState, useMemo } from 'react'
import { useStore } from '../store.jsx'
import Thumb from './Thumb.jsx'
import RecipeOptionsMenu from './RecipeOptionsMenu.jsx'
import IngredientCombobox from './IngredientCombobox.jsx'
import { APPROVED_IMAGES } from '../approved-images.js'
import { defaultOptions, SPICE_LABELS, PLANNER_SLOTS, slotForMealType, formatMinutes } from '../lib/recipes.js'
import { weekDates, shiftWeekISO, formatWeekLabel, dayName, formatShortDate, todayISO, formatDateTime, formatDayHeader } from '../lib/dates.js'

let uidCounter = 0
function uid(prefix) {
  uidCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${uidCounter}`
}

function newItem() {
  return { id: uid('ing'), ingredientId: null, name: '', quantity: null, unit: '', optional: false }
}

function newSection(name, itemCount) {
  return { id: uid('sec'), name, items: Array.from({ length: itemCount }, () => newItem()) }
}

function newStep() {
  return { id: uid('step'), instruction: '', timerMinutes: null }
}

const ACCENT_PRESETS = ['#D97757', '#8A9A5B', '#4C7A8A', '#B0576D', '#7A6AA8', '#C9962E', '#5B8C5A', '#8A6D4C']

export default function RecipeForm({ onSaved, onCancel }) {
  const store = useStore()
  const lk = store.data.lookups

  const [title, setTitle] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [cuisineId, setCuisineId] = useState('')
  const [mealTypeId, setMealTypeId] = useState('')
  const [dietaryTagIds, setDietaryTagIds] = useState([])
  const [categoryIds, setCategoryIds] = useState([])

  const [servings, setServings] = useState(4)
  const [prep, setPrep] = useState(10)
  const [cook, setCook] = useState(20)
  const [spice, setSpice] = useState(1)

  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [accentColor, setAccentColor] = useState('#D97757')

  const [sections, setSections] = useState(() => [newSection('Main', 2)])
  const [steps, setSteps] = useState(() => [newStep()])

  const [suggest, setSuggest] = useState(true)
  const [addToPlan, setAddToPlan] = useState(false)
  const [planWeek, setPlanWeek] = useState(store.prefs.weekStart)
  const [planDate, setPlanDate] = useState(() => {
    const t = todayISO()
    return weekDates(store.prefs.weekStart).includes(t) ? t : store.prefs.weekStart
  })
  const [planSlot, setPlanSlot] = useState('Dinner')
  const [planTime, setPlanTime] = useState('')

  const [options, setOptions] = useState({ ...defaultOptions })
  const [error, setError] = useState(null)

  const approvedImages = useMemo(() => {
    const urls = [APPROVED_IMAGES.placeholder, ...store.data.seedRecipes.map(r => r.coverImageUrl).filter(Boolean)]
    return [...new Set(urls)]
  }, [store.data.seedRecipes])

  const totalTime = (Number(prep) || 0) + (Number(cook) || 0)

  function toggleInList(list, setList, value) {
    setList(prev => (prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]))
  }

  function updateSection(sectionId, patch) {
    setSections(prev => prev.map(s => (s.id === sectionId ? { ...s, ...patch } : s)))
  }

  function removeSection(sectionId) {
    setSections(prev => (prev.length <= 1 ? prev : prev.filter(s => s.id !== sectionId)))
  }

  function addItem(sectionId) {
    setSections(prev => prev.map(s => (s.id === sectionId ? { ...s, items: [...s.items, newItem()] } : s)))
  }

  function updateItem(sectionId, itemId, patch) {
    setSections(prev =>
      prev.map(s =>
        s.id === sectionId ? { ...s, items: s.items.map(it => (it.id === itemId ? { ...it, ...patch } : it)) } : s
      )
    )
  }

  function removeItem(sectionId, itemId) {
    setSections(prev =>
      prev.map(s => (s.id === sectionId ? { ...s, items: s.items.filter(it => it.id !== itemId) } : s))
    )
  }

  function moveItem(sectionId, itemId, dir) {
    setSections(prev =>
      prev.map(s => {
        if (s.id !== sectionId) return s
        const idx = s.items.findIndex(it => it.id === itemId)
        const to = idx + dir
        if (idx < 0 || to < 0 || to >= s.items.length) return s
        const items = [...s.items]
        const [moved] = items.splice(idx, 1)
        items.splice(to, 0, moved)
        return { ...s, items }
      })
    )
  }

  function updateStep(stepId, patch) {
    setSteps(prev => prev.map(s => (s.id === stepId ? { ...s, ...patch } : s)))
  }

  function removeStep(stepId) {
    setSteps(prev => prev.filter(s => s.id !== stepId))
  }

  function moveStep(stepId, dir) {
    setSteps(prev => {
      const idx = prev.findIndex(s => s.id === stepId)
      const to = idx + dir
      if (idx < 0 || to < 0 || to >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(idx, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  function changePlanWeek(delta) {
    const next = shiftWeekISO(planWeek, delta)
    setPlanWeek(next)
    const t = todayISO()
    setPlanDate(weekDates(next).includes(t) ? t : next)
  }

  function pickMealType(id) {
    setMealTypeId(id)
    setPlanSlot(slotForMealType(id))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Please give the recipe a title.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setError(null)

    const cleanSections = sections
      .map(s => ({
        name: (s.name || '').trim() || 'Main',
        items: s.items
          .filter(it => (it.name || '').trim())
          .map(it => ({
            ingredientId: it.ingredientId,
            name: it.name.trim(),
            quantity: it.quantity === '' || it.quantity == null || isNaN(Number(it.quantity)) ? null : Number(it.quantity),
            unit: it.unit || '',
            notes: '',
            optional: !!it.optional,
          })),
      }))
      .filter(s => s.items.length > 0)

    const cleanSteps = steps
      .filter(s => (s.instruction || '').trim())
      .map(s => ({
        instruction: s.instruction.trim(),
        timerMinutes: s.timerMinutes != null && Number(s.timerMinutes) > 0 ? Number(s.timerMinutes) : 0,
      }))

    const recipe = {
      id: uid('user'),
      source: 'user',
      createdAt: new Date().toISOString(),
      title: title.trim(),
      shortDescription: '',
      sourceName: 'Your recipes',
      sourceUrl: sourceUrl.trim(),
      servings: Number(servings) > 0 ? Number(servings) : 1,
      prepTimeMinutes: Number(prep) || 0,
      cookTimeMinutes: Number(cook) || 0,
      totalTimeMinutes: totalTime,
      cuisineId,
      mealTypeId,
      dietaryTagIds,
      categoryIds,
      difficulty: null,
      spiceLevel: Number(spice) || 0,
      accentColor,
      coverImageUrl,
      includeInMealSuggestions: suggest,
      options: { ...options },
      sections: cleanSections,
      steps: cleanSteps,
    }

    store.addUserRecipe(recipe)

    let planInfo = null
    if (addToPlan) {
      store.assignSlot(planDate, planSlot, recipe.id, planTime)
      if (planWeek !== store.prefs.weekStart) store.setWeekStart(planWeek)
      planInfo = { date: planDate, slot: planSlot, serveTime: planTime }
    }

    onSaved(recipe, planInfo)
  }

  return (
    <form className="page recipe-form" onSubmit={handleSubmit}>
      <div className="page-head">
        <div>
          <h1>Add a new recipe</h1>
          <p className="muted">Fill in the sections below. Only the title is required.</p>
        </div>
        <div className="btn-row">
          <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn primary">Save recipe</button>
        </div>
      </div>

      {error && <div className="banner error" role="alert">{error}</div>}

      <section className="card form-section">
        <h2><span className="section-num">1</span> Recipe details</h2>
        <div className="form-grid">
          <label className="field span2">
            <span className="field-label">Recipe title *</span>
            <input
              type="text"
              className="input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Weeknight Miso Noodles"
              required
            />
          </label>
          <label className="field span2">
            <span className="field-label">Source link</span>
            <input
              type="url"
              className="input"
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              placeholder="https://example.com/recipe"
            />
          </label>
          <label className="field">
            <span className="field-label">Cuisine</span>
            <select className="input" value={cuisineId} onChange={e => setCuisineId(e.target.value)}>
              <option value="">Select cuisine{'\u2026'}</option>
              {lk.cuisines.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Primary meal type</span>
            <select className="input" value={mealTypeId} onChange={e => pickMealType(e.target.value)}>
              <option value="">Select meal type{'\u2026'}</option>
              {lk.mealTypes.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          <div className="field span2">
            <span className="field-label">Dietary suitability (select any)</span>
            <div className="chip-row selectable">
              {lk.dietaryTags.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`chip toggle${dietaryTagIds.includes(t.id) ? ' selected' : ''}`}
                  aria-pressed={dietaryTagIds.includes(t.id)}
                  onClick={() => toggleInList(dietaryTagIds, setDietaryTagIds, t.id)}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="field span2">
            <span className="field-label">Recipe categories (select any)</span>
            <div className="chip-row selectable">
              {lk.categories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip toggle${categoryIds.includes(c.id) ? ' selected' : ''}`}
                  aria-pressed={categoryIds.includes(c.id)}
                  onClick={() => toggleInList(categoryIds, setCategoryIds, c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="card form-section">
        <h2><span className="section-num">2</span> Timing and yield</h2>
        <div className="form-grid">
          <div className="field">
            <span className="field-label">Servings</span>
            <div className="stepper">
              <button type="button" className="btn ghost sm" onClick={() => setServings(s => Math.max(1, Number(s) - 1))} aria-label="Decrease servings">{'\u2212'}</button>
              <input
                type="number"
                className="input stepper-input"
                min="1"
                value={servings}
                onChange={e => setServings(Math.max(1, Number(e.target.value) || 1))}
                aria-label="Servings"
              />
              <button type="button" className="btn ghost sm" onClick={() => setServings(s => Number(s) + 1)} aria-label="Increase servings">+</button>
            </div>
          </div>
          <label className="field">
            <span className="field-label">Prep time (minutes)</span>
            <input type="number" className="input" min="0" value={prep} onChange={e => setPrep(e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Cook time (minutes)</span>
            <input type="number" className="input" min="0" value={cook} onChange={e => setCook(e.target.value)} />
          </label>
          <div className="field">
            <span className="field-label">Total time (automatic)</span>
            <div className="total-time">{formatMinutes(totalTime)}</div>
          </div>
          <div className="field span2">
            <span className="field-label">Spice level: <strong>{SPICE_LABELS[Number(spice)] || SPICE_LABELS[0]}</strong></span>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={spice}
              onChange={e => setSpice(e.target.value)}
              aria-label="Spice level"
              className="spice-range"
            />
            <div className="range-scale">
              <span>None</span><span>Mild</span><span>Medium</span><span>Spicy</span><span>Very spicy</span><span>Extra spicy</span>
            </div>
          </div>
        </div>
      </section>

      <section className="card form-section">
        <h2><span className="section-num">3</span> Image and appearance</h2>
        <div className="field">
          <span className="field-label">Cover image (choose from approved images; otherwise the placeholder is used)</span>
          <div className="image-picker">
            <button
              type="button"
              className={`image-tile${coverImageUrl === '' ? ' selected' : ''}`}
              onClick={() => setCoverImageUrl('')}
              aria-pressed={coverImageUrl === ''}
            >
              <span className="image-none">No image (placeholder)</span>
            </button>
            {approvedImages.map(url => (
              <button
                key={url}
                type="button"
                className={`image-tile${coverImageUrl === url ? ' selected' : ''}`}
                onClick={() => setCoverImageUrl(url)}
                aria-pressed={coverImageUrl === url}
                aria-label="Select this cover image"
              >
                <Thumb src={url} alt="Cover option" className="tile-img" />
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="field-label">Recipe card accent color</span>
          <div className="color-picker">
            <input
              type="color"
              value={accentColor}
              onChange={e => setAccentColor(e.target.value)}
              aria-label="Accent color"
            />
            <div className="chip-row">
              {ACCENT_PRESETS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`swatch${accentColor.toLowerCase() === c.toLowerCase() ? ' selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setAccentColor(c)}
                  aria-label={`Accent color ${c}`}
                  aria-pressed={accentColor.toLowerCase() === c.toLowerCase()}
                />
              ))}
            </div>
            <span className="muted small">{accentColor}</span>
          </div>
        </div>
        <div className="card-preview" style={{ '--accent': accentColor }}>
          <div className="card-preview-thumb">
            <Thumb src={coverImageUrl} alt="Preview" className="thumb-img" />
          </div>
          <div className="card-preview-body">
            <strong>{title.trim() || 'Recipe title preview'}</strong>
            <div className="chip-row">
              <span className="chip">{lk.cuisineById[cuisineId] ? lk.cuisineById[cuisineId].name : 'Cuisine'}</span>
              <span className="chip">{formatMinutes(totalTime)} total</span>
              <span className="chip">{servings} servings</span>
            </div>
          </div>
        </div>
      </section>

      <section className="card form-section">
        <h2><span className="section-num">4</span> Ingredients</h2>
        {sections.map(section => (
          <div key={section.id} className="ing-section-edit">
            <div className="ing-section-head">
              <input
                type="text"
                className="input section-name"
                value={section.name}
                placeholder={'Section name (Main, Sauce, Garnish\u2026)'}
                onChange={e => updateSection(section.id, { name: e.target.value })}
                aria-label="Ingredient section name"
              />
              <button
                type="button"
                className="btn quiet sm"
                onClick={() => removeSection(section.id)}
                disabled={sections.length <= 1}
              >
                Remove section
              </button>
            </div>
            {section.items.map((item, idx) => (
              <div key={item.id} className="ing-row">
                <div className="ing-row-main">
                  <IngredientCombobox
                    ingredients={lk.ingredients}
                    value={item.name}
                    onSelect={sel => updateItem(section.id, item.id, sel)}
                  />
                  <input
                    type="number"
                    className="input qty-input"
                    min="0"
                    step="0.25"
                    placeholder="Qty"
                    value={item.quantity ?? ''}
                    onChange={e => updateItem(section.id, item.id, { quantity: e.target.value === '' ? null : e.target.value })}
                    aria-label="Quantity"
                  />
                  <select
                    className="input unit-input"
                    value={item.unit}
                    onChange={e => updateItem(section.id, item.id, { unit: e.target.value })}
                    aria-label="Unit"
                  >
                    <option value="">Unit</option>
                    {lk.units.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <label className="optional-flag">
                    <input
                      type="checkbox"
                      checked={item.optional}
                      onChange={e => updateItem(section.id, item.id, { optional: e.target.checked })}
                    />
                    Optional
                  </label>
                </div>
                <div className="ing-row-actions">
                  <button type="button" className="btn quiet sm" onClick={() => moveItem(section.id, item.id, -1)} disabled={idx === 0} aria-label="Move ingredient up">{'\u2191'}</button>
                  <button type="button" className="btn quiet sm" onClick={() => moveItem(section.id, item.id, 1)} disabled={idx === section.items.length - 1} aria-label="Move ingredient down">{'\u2193'}</button>
                  <button type="button" className="btn quiet sm danger-text" onClick={() => removeItem(section.id, item.id)} aria-label="Remove ingredient">{'\u00D7'}</button>
                </div>
              </div>
            ))}
            <button type="button" className="btn ghost sm" onClick={() => addItem(section.id)}>+ Add ingredient</button>
          </div>
        ))}
        <button type="button" className="btn ghost" onClick={() => setSections(prev => [...prev, newSection('', 1)])}>
          + Add ingredient section
        </button>
      </section>

      <section className="card form-section">
        <h2><span className="section-num">5</span> Method</h2>
        {steps.map((step, idx) => (
          <div key={step.id} className="step-row">
            <span className="step-num">{idx + 1}</span>
            <textarea
              className="input step-input"
              rows="2"
              placeholder={'Describe this step\u2026'}
              value={step.instruction}
              onChange={e => updateStep(step.id, { instruction: e.target.value })}
              aria-label={`Step ${idx + 1} instruction`}
            />
            <label className="timer-field">
              <span className="field-label">Timer (min)</span>
              <input
                type="number"
                className="input timer-input"
                min="0"
                placeholder={'\u2014'}
                value={step.timerMinutes ?? ''}
                onChange={e => updateStep(step.id, { timerMinutes: e.target.value === '' ? null : e.target.value })}
              />
            </label>
            <div className="ing-row-actions">
              <button type="button" className="btn quiet sm" onClick={() => moveStep(step.id, -1)} disabled={idx === 0} aria-label="Move step up">{'\u2191'}</button>
              <button type="button" className="btn quiet sm" onClick={() => moveStep(step.id, 1)} disabled={idx === steps.length - 1} aria-label="Move step down">{'\u2193'}</button>
              <button type="button" className="btn quiet sm danger-text" onClick={() => removeStep(step.id)} aria-label="Remove step">{'\u00D7'}</button>
            </div>
          </div>
        ))}
        <button type="button" className="btn ghost sm" onClick={() => setSteps(prev => [...prev, newStep()])}>+ Add step</button>
      </section>

      <section className="card form-section">
        <h2><span className="section-num">6</span> Meal planning options</h2>
        <label className="check-row">
          <input type="checkbox" checked={suggest} onChange={e => setSuggest(e.target.checked)} />
          <span>Make this recipe available in meal-plan suggestions</span>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={addToPlan} onChange={e => setAddToPlan(e.target.checked)} />
          <span>Add this recipe to my meal plan immediately</span>
        </label>
        {addToPlan && (
          <div className="plan-panel nested">
            <div className="weeknav">
              <button type="button" className="btn ghost sm" onClick={() => changePlanWeek(-1)} aria-label="Previous week">{'\u2039'}</button>
              <strong>{formatWeekLabel(planWeek)}</strong>
              <button type="button" className="btn ghost sm" onClick={() => changePlanWeek(1)} aria-label="Next week">{'\u203A'}</button>
            </div>
            <p className="field-label">Meal-planning week and cooking date</p>
            <div className="day-chips" role="radiogroup" aria-label="Planned cooking date">
              {weekDates(planWeek).map(d => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={d === planDate}
                  className={`day-chip${d === planDate ? ' active' : ''}${d === todayISO() ? ' today' : ''}`}
                  onClick={() => setPlanDate(d)}
                >
                  <span className="day-chip-name">{dayName(d)}</span>
                  <span className="day-chip-date">{formatShortDate(d)}</span>
                </button>
              ))}
            </div>
            <p className="field-label">Planned serving time (meal slot)</p>
            <div className="segmented wide" role="radiogroup" aria-label="Meal slot">
              {PLANNER_SLOTS.map(s => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={s === planSlot}
                  className={`seg${s === planSlot ? ' active' : ''}`}
                  onClick={() => setPlanSlot(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="field-label">Specific date and time (optional)</p>
            <div className="time-row">
              <input type="time" className="input" value={planTime} onChange={e => setPlanTime(e.target.value)} aria-label="Specific serving time" />
              <span className="muted small">{formatDateTime(planDate, planTime) || formatDayHeader(planDate)}</span>
            </div>
          </div>
        )}
      </section>

      <section className="card form-section">
        <h2><span className="section-num">7</span> Recipe options menu</h2>
        <RecipeOptionsMenu
          variant="inline"
          options={options}
          onChange={(k, v) => setOptions(prev => ({ ...prev, [k]: v }))}
        />
      </section>

      <div className="form-footer">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn primary">Save recipe</button>
      </div>
    </form>
  )
}
