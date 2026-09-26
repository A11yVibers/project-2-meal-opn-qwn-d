import { useMemo, useRef, useState } from 'react'
import OptionsMenu from './OptionsMenu.jsx'
import IngredientCombobox from './IngredientCombobox.jsx'
import PlanFields, { defaultPlanDraft } from './PlanFields.jsx'
import {
  cuisines, mealTypes, dietaryTags, categories, units,
  PLACEHOLDER_IMAGE, ACCENT_SWATCHES, SPICE_LABELS, approvedGallery, slotForMealType,
} from '../lib/data.js'
import { DEFAULT_OPTIONS, newRecipeId } from '../store.js'

const SECTION_SUGGESTIONS = ['Main', 'Sauce', 'Garnish', 'Vegetables', 'Seasoning', 'Marinade', 'Dressing', 'Topping']

let rowSeq = 0
const nextRowKey = () => `row-${++rowSeq}`

function ingredientRow(sectionName = 'Main') {
  return {
    key: nextRowKey(),
    sectionName,
    ingredientId: null,
    name: '',
    quantity: '1',
    unit: 'cup',
    notes: '',
    optional: false,
  }
}

function stepRow() {
  return { key: nextRowKey(), instruction: '', timerMinutes: '' }
}

export default function RecipeForm({ onCancel, onSave }) {
  const [form, setForm] = useState({
    title: '',
    shortDescription: '',
    sourceName: '',
    sourceUrl: '',
    cuisineId: cuisines[0]?.id || '',
    mealTypeId: 'MT03',
    dietaryTagIds: [],
    categoryIds: [],
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 20,
    spiceLevel: 1,
    coverImageUrl: '',
    accentColor: ACCENT_SWATCHES[0],
    ingredients: [ingredientRow('Main')],
    steps: [stepRow()],
    includeInSuggestions: true,
    options: { ...DEFAULT_OPTIONS },
    addToPlan: false,
    plan: defaultPlanDraft('dinner'),
  })
  const [error, setError] = useState('')
  const [imgOk, setImgOk] = useState(true)
  const topRef = useRef(null)

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const totalMinutes = useMemo(
    () => (Number(form.prepMinutes) || 0) + (Number(form.cookMinutes) || 0),
    [form.prepMinutes, form.cookMinutes],
  )

  const sectionOrder = useMemo(() => {
    const order = []
    for (const row of form.ingredients) {
      if (!order.includes(row.sectionName)) order.push(row.sectionName)
    }
    return order
  }, [form.ingredients])

  const sectionDatalist = useMemo(() => {
    const names = new Set(SECTION_SUGGESTIONS)
    for (const row of form.ingredients) if (row.sectionName.trim()) names.add(row.sectionName.trim())
    return [...names]
  }, [form.ingredients])

  function updateRow(key, patch) {
    setForm((f) => ({ ...f, ingredients: f.ingredients.map((r) => (r.key === key ? { ...r, ...patch } : r)) }))
  }

  function removeRow(key) {
    setForm((f) => ({ ...f, ingredients: f.ingredients.filter((r) => r.key !== key) }))
  }

  function addRowToSection(sectionName) {
    setForm((f) => {
      const lastIndex = f.ingredients.map((r) => r.sectionName).lastIndexOf(sectionName)
      const rows = [...f.ingredients]
      rows.splice(lastIndex + 1, 0, ingredientRow(sectionName))
      return { ...f, ingredients: rows }
    })
  }

  function addSection() {
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, ingredientRow('')] }))
  }

  function moveRow(key, direction) {
    setForm((f) => {
      const index = f.ingredients.findIndex((r) => r.key === key)
      if (index < 0) return f
      const row = f.ingredients[index]
      let target = index + direction
      while (target >= 0 && target < f.ingredients.length && f.ingredients[target].sectionName !== row.sectionName) {
        target += direction
      }
      if (target < 0 || target >= f.ingredients.length) return f
      const rows = [...f.ingredients]
      ;[rows[index], rows[target]] = [rows[target], rows[index]]
      return { ...f, ingredients: rows }
    })
  }

  function updateStep(key, patch) {
    setForm((f) => ({ ...f, steps: f.steps.map((s) => (s.key === key ? { ...s, ...patch } : s)) }))
  }

  function removeStep(key) {
    setForm((f) => ({ ...f, steps: f.steps.filter((s) => s.key !== key) }))
  }

  function moveStep(key, direction) {
    setForm((f) => {
      const index = f.steps.findIndex((s) => s.key === key)
      const target = index + direction
      if (index < 0 || target < 0 || target >= f.steps.length) return f
      const steps = [...f.steps]
      ;[steps[index], steps[target]] = [steps[target], steps[index]]
      return { ...f, steps }
    })
  }

  function toggleListField(field, id) {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(id) ? f[field].filter((x) => x !== id) : [...f[field], id],
    }))
  }

  function changeMealType(mealTypeId) {
    setForm((f) => ({ ...f, mealTypeId, plan: { ...f.plan, slot: slotForMealType(mealTypeId) } }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const title = form.title.trim()
    if (!title) {
      setError('Please give the recipe a title.')
      topRef.current?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    setError('')
    const prep = Math.max(0, Number(form.prepMinutes) || 0)
    const cook = Math.max(0, Number(form.cookMinutes) || 0)
    const recipe = {
      id: newRecipeId(),
      isUser: true,
      createdAt: new Date().toISOString(),
      title,
      shortDescription: form.shortDescription.trim(),
      sourceName: form.sourceName.trim(),
      sourceUrl: form.sourceUrl.trim(),
      servings: Math.max(1, Number(form.servings) || 1),
      prepMinutes: prep,
      cookMinutes: cook,
      totalMinutes: prep + cook,
      cuisineId: form.cuisineId,
      mealTypeId: form.mealTypeId,
      dietaryTagIds: [...form.dietaryTagIds],
      categoryIds: [...form.categoryIds],
      difficulty: null,
      spiceLevel: Number(form.spiceLevel) || 0,
      accentColor: form.accentColor,
      coverImageUrl: form.coverImageUrl.trim(),
      includeInSuggestions: form.includeInSuggestions,
      ingredients: form.ingredients
        .filter((r) => r.name.trim())
        .map((r) => ({
          sectionName: r.sectionName.trim() || 'Main',
          ingredientId: r.ingredientId,
          name: r.name.trim(),
          quantity: r.quantity === '' || r.quantity == null ? null : Number(r.quantity),
          unit: r.unit,
          notes: r.notes.trim(),
          optional: r.optional,
        })),
      steps: form.steps
        .filter((s) => s.instruction.trim())
        .map((s) => ({
          instruction: s.instruction.trim(),
          timerMinutes: s.timerMinutes === '' || s.timerMinutes == null ? null : Math.max(0, Number(s.timerMinutes) || 0) || null,
        })),
    }
    const planTarget = form.addToPlan
      ? {
          dateISO: form.plan.dayISO,
          slot: form.plan.slot,
          serveTime: form.plan.serveTime || null,
          cookDateTime: form.plan.cookDateTime || null,
        }
      : null
    onSave(recipe, { ...form.options }, planTarget)
  }

  const previewSrc = form.coverImageUrl.trim() && imgOk ? form.coverImageUrl.trim() : PLACEHOLDER_IMAGE

  return (
    <form className="view recipe-form" onSubmit={handleSubmit} ref={topRef}>
      <div className="view-head">
        <div>
          <h2>New recipe</h2>
          <p className="muted">Fill in the sections below, then save. It will appear in your catalog immediately.</p>
        </div>
        <div className="view-head-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save recipe</button>
        </div>
      </div>

      {error && <div className="form-error" role="alert">{error}</div>}

      <section className="form-section">
        <h3>Recipe details</h3>
        <div className="field-grid">
          <label className="field field-wide">
            <span>Recipe title *</span>
            <input className="input" type="text" value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Miso Butter Noodles" required />
          </label>
          <label className="field field-wide">
            <span>Short description</span>
            <textarea className="input" rows={2} value={form.shortDescription} onChange={(e) => set({ shortDescription: e.target.value })} placeholder="One or two lines shown on the recipe card" />
          </label>
          <label className="field">
            <span>Source name</span>
            <input className="input" type="text" value={form.sourceName} onChange={(e) => set({ sourceName: e.target.value })} placeholder="e.g. Family kitchen" />
          </label>
          <label className="field">
            <span>Source link</span>
            <input className="input" type="url" value={form.sourceUrl} onChange={(e) => set({ sourceUrl: e.target.value })} placeholder="https://…" />
          </label>
          <label className="field">
            <span>Cuisine</span>
            <select className="input" value={form.cuisineId} onChange={(e) => set({ cuisineId: e.target.value })}>
              {cuisines.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Primary meal type</span>
            <select className="input" value={form.mealTypeId} onChange={(e) => changeMealType(e.target.value)}>
              {mealTypes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <fieldset className="field field-wide chip-fieldset">
            <legend>Dietary suitability (select any)</legend>
            <div className="chip-group">
              {dietaryTags.map((tag) => (
                <label key={tag.id} className={`chip${form.dietaryTagIds.includes(tag.id) ? ' chip-on' : ''}`}>
                  <input type="checkbox" checked={form.dietaryTagIds.includes(tag.id)} onChange={() => toggleListField('dietaryTagIds', tag.id)} />
                  {tag.name}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="field field-wide chip-fieldset">
            <legend>Recipe categories (select any)</legend>
            <div className="chip-group">
              {categories.map((cat) => (
                <label key={cat.id} className={`chip${form.categoryIds.includes(cat.id) ? ' chip-on' : ''}`}>
                  <input type="checkbox" checked={form.categoryIds.includes(cat.id)} onChange={() => toggleListField('categoryIds', cat.id)} />
                  {cat.name}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <section className="form-section">
        <h3>Timing &amp; yield</h3>
        <div className="field-grid">
          <div className="field">
            <span>Servings</span>
            <div className="stepper">
              <button type="button" className="btn btn-square" aria-label="Fewer servings" onClick={() => set({ servings: Math.max(1, (Number(form.servings) || 1) - 1) })}>−</button>
              <input
                className="input stepper-value"
                type="number"
                min="1"
                value={form.servings}
                onChange={(e) => set({ servings: Math.max(1, Number(e.target.value) || 1) })}
                aria-label="Servings"
              />
              <button type="button" className="btn btn-square" aria-label="More servings" onClick={() => set({ servings: (Number(form.servings) || 1) + 1 })}>+</button>
            </div>
          </div>
          <label className="field">
            <span>Prep time (minutes)</span>
            <input className="input" type="number" min="0" value={form.prepMinutes} onChange={(e) => set({ prepMinutes: e.target.value })} />
          </label>
          <label className="field">
            <span>Cook time (minutes)</span>
            <input className="input" type="number" min="0" value={form.cookMinutes} onChange={(e) => set({ cookMinutes: e.target.value })} />
          </label>
          <div className="field">
            <span>Total time (automatic)</span>
            <div className="input total-time" aria-live="polite">
              {totalMinutes > 0 ? `${totalMinutes} min` : '—'}
            </div>
          </div>
          <div className="field field-wide">
            <span>Spice level</span>
            <div className="spice-control" role="radiogroup" aria-label="Spice level">
              {SPICE_LABELS.map((label, level) => (
                <button
                  type="button"
                  key={label}
                  role="radio"
                  aria-checked={form.spiceLevel === level}
                  className={`spice-seg${form.spiceLevel === level ? ' spice-on' : ''}`}
                  style={{ '--spice-i': level }}
                  onClick={() => set({ spiceLevel: level })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="form-section">
        <h3>Image &amp; appearance</h3>
        <div className="image-form">
          <div className="image-preview" style={{ '--accent': form.accentColor }}>
            <img src={previewSrc} alt="Cover preview" onError={() => setImgOk(false)} onLoad={() => setImgOk(true)} />
          </div>
          <div className="image-fields">
            <label className="field field-wide">
              <span>Cover image upload (remote URL)</span>
              <input
                className="input"
                type="url"
                value={form.coverImageUrl}
                onChange={(e) => { set({ coverImageUrl: e.target.value }); setImgOk(true) }}
                placeholder="Paste an image URL, or pick an approved image below"
              />
            </label>
            <div className="field field-wide">
              <span>Approved images</span>
              <div className="image-gallery">
                {approvedGallery.map((url) => (
                  <button
                    type="button"
                    key={url}
                    className={`gallery-thumb${form.coverImageUrl === url ? ' gallery-on' : ''}`}
                    title={url}
                    onClick={() => { set({ coverImageUrl: url }); setImgOk(true) }}
                  >
                    <img src={url} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
            <div className="field field-wide">
              <span>Recipe card accent color</span>
              <div className="accent-row">
                {ACCENT_SWATCHES.map((color) => (
                  <button
                    type="button"
                    key={color}
                    className={`swatch${form.accentColor.toLowerCase() === color.toLowerCase() ? ' swatch-on' : ''}`}
                    style={{ background: color }}
                    aria-label={`Accent ${color}`}
                    onClick={() => set({ accentColor: color })}
                  />
                ))}
                <input type="color" value={form.accentColor} onChange={(e) => set({ accentColor: e.target.value })} aria-label="Custom accent color" />
                <span className="muted accent-value">{form.accentColor}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="form-section">
        <h3>Ingredients</h3>
        <datalist id="section-names">
          {sectionDatalist.map((name) => <option key={name} value={name} />)}
        </datalist>
        {sectionOrder.map((sectionName) => {
          const rows = form.ingredients.filter((r) => r.sectionName === sectionName)
          return (
            <div className="ing-section" key={sectionName || '(new)'}>
              <div className="ing-section-head">
                <strong>{sectionName.trim() ? sectionName : 'New section — name it below'}</strong>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => addRowToSection(sectionName)}>+ Add ingredient</button>
              </div>
              {rows.map((row) => {
                const sectionRows = rows
                const posInSection = sectionRows.findIndex((r) => r.key === row.key)
                return (
                  <div className="ing-row" key={row.key}>
                    <input
                      className="input ing-section-name"
                      type="text"
                      list="section-names"
                      value={row.sectionName}
                      placeholder="Section"
                      aria-label="Section name"
                      onChange={(e) => updateRow(row.key, { sectionName: e.target.value })}
                    />
                    <div className="ing-combo">
                      <IngredientCombobox
                        value={{ ingredientId: row.ingredientId, name: row.name }}
                        onChange={(sel) => updateRow(row.key, sel)}
                      />
                    </div>
                    <input
                      className="input ing-qty"
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.quantity}
                      placeholder="Qty"
                      aria-label="Quantity"
                      onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                    />
                    <select className="input ing-unit" value={row.unit} aria-label="Unit" onChange={(e) => updateRow(row.key, { unit: e.target.value })}>
                      <option value="">no unit</option>
                      {units.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
                    </select>
                    <input
                      className="input ing-notes"
                      type="text"
                      value={row.notes}
                      placeholder="Notes (e.g. minced)"
                      aria-label="Notes"
                      onChange={(e) => updateRow(row.key, { notes: e.target.value })}
                    />
                    <label className="ing-optional">
                      <input type="checkbox" checked={row.optional} onChange={(e) => updateRow(row.key, { optional: e.target.checked })} />
                      Optional
                    </label>
                    <div className="row-actions">
                      <button type="button" className="btn btn-icon" title="Move up" aria-label="Move ingredient up" disabled={posInSection === 0} onClick={() => moveRow(row.key, -1)}>↑</button>
                      <button type="button" className="btn btn-icon" title="Move down" aria-label="Move ingredient down" disabled={posInSection === sectionRows.length - 1} onClick={() => moveRow(row.key, 1)}>↓</button>
                      <button type="button" className="btn btn-icon btn-danger" title="Remove ingredient" aria-label="Remove ingredient" onClick={() => removeRow(row.key)}>✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
        <div className="form-actions-row">
          <button type="button" className="btn btn-outline" onClick={addSection}>+ Add ingredient section</button>
        </div>
      </section>

      <section className="form-section">
        <h3>Method</h3>
        <ol className="step-editor-list">
          {form.steps.map((step, index) => (
            <li className="step-editor-row" key={step.key}>
              <span className="step-num" aria-hidden="true">{index + 1}</span>
              <textarea
                className="input"
                rows={2}
                value={step.instruction}
                placeholder="Describe this step…"
                aria-label={`Step ${index + 1} instruction`}
                onChange={(e) => updateStep(step.key, { instruction: e.target.value })}
              />
              <div className="step-timer">
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={step.timerMinutes}
                  placeholder="Timer"
                  aria-label={`Step ${index + 1} timer in minutes`}
                  onChange={(e) => updateStep(step.key, { timerMinutes: e.target.value })}
                />
                <span className="muted">min</span>
              </div>
              <div className="row-actions">
                <button type="button" className="btn btn-icon" title="Move up" aria-label="Move step up" disabled={index === 0} onClick={() => moveStep(step.key, -1)}>↑</button>
                <button type="button" className="btn btn-icon" title="Move down" aria-label="Move step down" disabled={index === form.steps.length - 1} onClick={() => moveStep(step.key, 1)}>↓</button>
                <button type="button" className="btn btn-icon btn-danger" title="Remove step" aria-label="Remove step" onClick={() => removeStep(step.key)}>✕</button>
              </div>
            </li>
          ))}
        </ol>
        <div className="form-actions-row">
          <button type="button" className="btn btn-outline" onClick={() => setForm((f) => ({ ...f, steps: [...f.steps, stepRow()] }))}>+ Add step</button>
        </div>
      </section>

      <section className="form-section">
        <h3>Meal planning</h3>
        <label className="checkline">
          <input type="checkbox" checked={form.includeInSuggestions} onChange={(e) => set({ includeInSuggestions: e.target.checked })} />
          <span>Make this recipe available in meal-plan suggestions</span>
        </label>
        <label className="checkline">
          <input
            type="checkbox"
            checked={form.addToPlan}
            onChange={(e) => set({
              addToPlan: e.target.checked,
              plan: e.target.checked ? { ...form.plan, slot: slotForMealType(form.mealTypeId) } : form.plan,
            })}
          />
          <span>Add this recipe to my meal plan right away</span>
        </label>
        {form.addToPlan && (
          <div className="plan-fields-wrap">
            <PlanFields value={form.plan} onChange={(plan) => set({ plan })} />
          </div>
        )}
      </section>

      <section className="form-section">
        <h3>Recipe options menu</h3>
        <p className="muted section-note">These options are saved with the recipe and can be changed later from the recipe page.</p>
        <OptionsMenu options={form.options} onChange={(options) => set({ options })} variant="panel" />
      </section>

      <div className="form-footer">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">Save recipe</button>
      </div>
    </form>
  )
}
