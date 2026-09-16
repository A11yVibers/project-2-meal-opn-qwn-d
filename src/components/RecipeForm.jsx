import { useMemo, useRef, useState } from 'react'
import { CUISINES, MEAL_TYPES, DIETARY_TAGS, RECIPE_CATEGORIES, INGREDIENTS, UNITS, SLOTS, SLOT_LABELS } from '../csv.js'
import { addDaysISO, formatMinutes, formatWeekRange, SPICE_LABELS, startOfWeekISO, todayISO } from '../format.js'
import { DEFAULT_OPTIONS, RadioRow, ToggleRow } from './OptionsMenu.jsx'
import Thumb from './Thumb.jsx'

let uidCounter = 0
function uid(prefix) {
  uidCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${uidCounter}`
}

const ACCENT_PRESETS = ['#D97757', '#8A9A5B', '#4F7CAC', '#B4552D', '#7C5C9E', '#C2A14B', '#3E7C6F', '#A65D7B']

function emptyItem() {
  return { key: uid('ing'), ingredientId: null, name: '', qty: '', unit: '', notes: '', optional: false }
}

function emptySection(name = '') {
  return { key: uid('sec'), name, items: [emptyItem()] }
}

function emptyStep() {
  return { key: uid('step'), instruction: '', timer: '' }
}

function move(list, index, dir) {
  const target = index + dir
  if (target < 0 || target >= list.length) return list
  const next = [...list]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  return next
}

function IngredientCombobox({ item, onPatch }) {
  const [open, setOpen] = useState(false)
  const matches = useMemo(() => {
    const q = item.name.trim().toLowerCase()
    if (!q) return INGREDIENTS.slice(0, 10)
    return INGREDIENTS.filter((i) => i.ingredient_name.toLowerCase().includes(q)).slice(0, 10)
  }, [item.name])

  return (
    <span className="combobox">
      <input
        type="text"
        value={item.name}
        placeholder="Search ingredients…"
        aria-label="Ingredient name"
        onChange={(e) => { onPatch({ name: e.target.value, ingredientId: null }); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
      />
      {open && matches.length > 0 ? (
        <span className="combobox-list">
          {matches.map((m) => (
            <button
              key={m.ingredient_id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                onPatch({ name: m.ingredient_name, ingredientId: m.ingredient_id })
                setOpen(false)
              }}
            >
              {m.ingredient_name}
              <em>{m.shopping_category}</em>
            </button>
          ))}
        </span>
      ) : null}
    </span>
  )
}

function ChipToggle({ label, active, onClick }) {
  return (
    <button type="button" className={`chip-toggle ${active ? 'is-on' : ''}`} aria-pressed={active} onClick={onClick}>
      {active ? '✓ ' : ''}{label}
    </button>
  )
}

export default function RecipeForm({ initialWeekStart, onCancel, onSave }) {
  const [title, setTitle] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [cuisineId, setCuisineId] = useState('')
  const [mealTypeId, setMealTypeId] = useState('')
  const [dietaryTagIds, setDietaryTagIds] = useState([])
  const [categoryIds, setCategoryIds] = useState([])

  const [servings, setServings] = useState(4)
  const [prep, setPrep] = useState('')
  const [cook, setCook] = useState('')
  const [spiceLevel, setSpiceLevel] = useState(1)

  const [imageDataUrl, setImageDataUrl] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [accentColor, setAccentColor] = useState(ACCENT_PRESETS[0])
  const fileRef = useRef(null)

  const [sections, setSections] = useState([emptySection('Main')])
  const [steps, setSteps] = useState([emptyStep()])

  const [includeInSuggestions, setIncludeInSuggestions] = useState(true)
  const [addToPlan, setAddToPlan] = useState(false)
  const [planWeek, setPlanWeek] = useState(initialWeekStart)
  const [planDate, setPlanDate] = useState(initialWeekStart)
  const [planSlot, setPlanSlot] = useState('dinner')
  const [planTime, setPlanTime] = useState('')

  const [options, setOptions] = useState(DEFAULT_OPTIONS)
  const [error, setError] = useState('')

  const totalMinutes = (Number(prep) || 0) + (Number(cook) || 0)

  const weekChoices = useMemo(() => {
    const list = []
    for (let offset = -2; offset <= 8; offset += 1) {
      const ws = addDaysISO(startOfWeekISO(todayISO()), offset * 7)
      let label = `Week of ${formatWeekRange(ws).split('–')[0].trim()}`
      if (ws === startOfWeekISO(todayISO())) label += ' · this week'
      list.push({ value: ws, label })
    }
    return list
  }, [])

  const toggleIn = (list, value, setter) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  const patchItem = (secIdx, itemIdx, patch) => {
    setSections((prev) => prev.map((sec, si) => (
      si === secIdx
        ? { ...sec, items: sec.items.map((it, ii) => (ii === itemIdx ? { ...it, ...patch } : it)) }
        : sec
    )))
  }

  const onFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImageDataUrl(String(reader.result))
    reader.readAsDataURL(file)
  }

  const submit = (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Please give the recipe a title.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const ingredients = []
    sections.forEach((sec) => {
      sec.items.forEach((it) => {
        if (!it.name.trim() && it.qty === '') return
        ingredients.push({
          section: sec.name.trim() || 'Ingredients',
          ingredientId: it.ingredientId,
          name: it.name.trim() || 'Unspecified ingredient',
          qty: it.qty === '' ? null : Number(it.qty),
          unit: it.unit,
          notes: it.notes.trim(),
          optional: it.optional,
        })
      })
    })
    const recipeSteps = steps
      .filter((s) => s.instruction.trim())
      .map((s) => ({ instruction: s.instruction.trim(), timerMinutes: Number(s.timer) || 0 }))

    const recipe = {
      id: uid('u'),
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      sourceName: '',
      sourceUrl: sourceUrl.trim(),
      servings: Math.max(1, Number(servings) || 1),
      prepMinutes: Number(prep) || 0,
      cookMinutes: Number(cook) || 0,
      totalMinutes,
      cuisineId: cuisineId || null,
      mealTypeId: mealTypeId || null,
      dietaryTagIds,
      categoryIds,
      difficulty: null,
      spiceLevel: Number(spiceLevel) || 0,
      accentColor,
      coverImageUrl: imageDataUrl || imageUrl.trim(),
      includeInMealSuggestions: includeInSuggestions,
      isUser: true,
      ingredients,
      steps: recipeSteps,
    }
    onSave(recipe, {
      options,
      addToPlan: addToPlan && !!planDate,
      plan: { date: planDate, slot: planSlot, time: planTime || null },
    })
  }

  return (
    <form className="recipe-form" onSubmit={submit} style={{ '--accent': accentColor }}>
      <div className="form-head">
        <h2>Add a new recipe</h2>
        <div className="form-head-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save recipe</button>
        </div>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <fieldset className="form-section">
        <legend>1 · Recipe details</legend>
        <div className="form-grid">
          <label className="span-2">
            <span>Recipe title *</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weeknight miso noodles" required />
          </label>
          <label className="span-2">
            <span>Short description</span>
            <textarea rows={2} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="One or two lines shown on the recipe card" />
          </label>
          <label className="span-2">
            <span>Source link</span>
            <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" />
          </label>
          <label>
            <span>Cuisine</span>
            <select value={cuisineId} onChange={(e) => setCuisineId(e.target.value)}>
              <option value="">Select cuisine…</option>
              {CUISINES.map((c) => <option key={c.cuisine_id} value={c.cuisine_id}>{c.cuisine_name}</option>)}
            </select>
          </label>
          <label>
            <span>Primary meal type</span>
            <select value={mealTypeId} onChange={(e) => setMealTypeId(e.target.value)}>
              <option value="">Select meal type…</option>
              {MEAL_TYPES.map((m) => <option key={m.meal_type_id} value={m.meal_type_id}>{m.meal_type_name}</option>)}
            </select>
          </label>
          <div className="span-2">
            <span className="field-label">Dietary suitability (select all that apply)</span>
            <div className="chip-row">
              {DIETARY_TAGS.map((d) => (
                <ChipToggle
                  key={d.dietary_tag_id}
                  label={d.dietary_tag_name}
                  active={dietaryTagIds.includes(d.dietary_tag_id)}
                  onClick={() => toggleIn(dietaryTagIds, d.dietary_tag_id, setDietaryTagIds)}
                />
              ))}
            </div>
          </div>
          <div className="span-2">
            <span className="field-label">Recipe categories (select any)</span>
            <div className="chip-row">
              {RECIPE_CATEGORIES.map((c) => (
                <ChipToggle
                  key={c.category_id}
                  label={c.category_name}
                  active={categoryIds.includes(c.category_id)}
                  onClick={() => toggleIn(categoryIds, c.category_id, setCategoryIds)}
                />
              ))}
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>2 · Timing and yield</legend>
        <div className="form-grid">
          <label>
            <span>Servings</span>
            <span className="servings-stepper">
              <button type="button" onClick={() => setServings((s) => Math.max(1, s - 1))} aria-label="Fewer servings">−</button>
              <strong>{servings}</strong>
              <button type="button" onClick={() => setServings((s) => Math.min(99, s + 1))} aria-label="More servings">+</button>
            </span>
          </label>
          <label>
            <span>Prep time (minutes)</span>
            <input type="number" min="0" value={prep} onChange={(e) => setPrep(e.target.value)} placeholder="15" />
          </label>
          <label>
            <span>Cook time (minutes)</span>
            <input type="number" min="0" value={cook} onChange={(e) => setCook(e.target.value)} placeholder="25" />
          </label>
          <div className="field-readonly">
            <span>Total time (automatic)</span>
            <strong>{formatMinutes(totalMinutes)}</strong>
          </div>
          <label className="span-2">
            <span>Spice level: <strong>{SPICE_LABELS[Number(spiceLevel)]}</strong> <span className="subtle">({spiceLevel} / 5)</span></span>
            <input type="range" min="0" max="5" step="1" value={spiceLevel} onChange={(e) => setSpiceLevel(Number(e.target.value))} />
            <span className="range-ends"><span>Mild</span><span>Very spicy</span></span>
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>3 · Image and appearance</legend>
        <div className="form-grid">
          <div className="span-2 image-row">
            <div className="image-upload">
              <span className="field-label">Cover image upload</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <p className="subtle">Stored only in this browser. Or paste a remote image URL:</p>
              <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…/photo.jpg" disabled={!!imageDataUrl} />
              {imageDataUrl ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setImageDataUrl(null); if (fileRef.current) fileRef.current.value = '' }}>
                  Remove uploaded image
                </button>
              ) : null}
            </div>
            <div className="image-preview">
              <span className="field-label">Preview</span>
              <Thumb className="preview-thumb" src={imageDataUrl || imageUrl} alt="Cover preview" />
            </div>
          </div>
          <div className="span-2">
            <span className="field-label">Recipe card accent color</span>
            <div className="accent-row">
              <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} aria-label="Accent color" />
              {ACCENT_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`swatch ${accentColor.toLowerCase() === c.toLowerCase() ? 'is-on' : ''}`}
                  style={{ background: c }}
                  aria-label={`Use ${c}`}
                  onClick={() => setAccentColor(c)}
                />
              ))}
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>4 · Ingredients</legend>
        {sections.map((sec, secIdx) => (
          <div key={sec.key} className="ing-edit-section">
            <div className="ing-section-head">
              <input
                type="text"
                className="section-name"
                value={sec.name}
                placeholder="Section name (e.g. Main, Sauce, Garnish)"
                aria-label="Ingredient section name"
                onChange={(e) => setSections((prev) => prev.map((s, i) => (i === secIdx ? { ...s, name: e.target.value } : s)))}
              />
              <span className="row-actions">
                <button type="button" className="btn btn-icon" title="Move section up" disabled={secIdx === 0} onClick={() => setSections((prev) => move(prev, secIdx, -1))}>↑</button>
                <button type="button" className="btn btn-icon" title="Move section down" disabled={secIdx === sections.length - 1} onClick={() => setSections((prev) => move(prev, secIdx, 1))}>↓</button>
                <button
                  type="button"
                  className="btn btn-icon btn-danger"
                  title="Remove section"
                  onClick={() => setSections((prev) => prev.filter((_, i) => i !== secIdx))}
                >✕</button>
              </span>
            </div>
            {sec.items.map((item, itemIdx) => (
              <div key={item.key} className="ing-edit-row">
                <IngredientCombobox item={item} onPatch={(patch) => patchItem(secIdx, itemIdx, patch)} />
                <input
                  type="text"
                  inputMode="decimal"
                  className="qty-input"
                  value={item.qty}
                  placeholder="Qty"
                  aria-label="Quantity"
                  onChange={(e) => patchItem(secIdx, itemIdx, { qty: e.target.value })}
                />
                <select
                  className="unit-input"
                  value={item.unit}
                  aria-label="Unit"
                  onChange={(e) => patchItem(secIdx, itemIdx, { unit: e.target.value })}
                >
                  <option value="">Unit…</option>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <input
                  type="text"
                  className="notes-input"
                  value={item.notes}
                  placeholder="Notes (e.g. minced)"
                  aria-label="Ingredient notes"
                  onChange={(e) => patchItem(secIdx, itemIdx, { notes: e.target.value })}
                />
                <label className="optional-check">
                  <input
                    type="checkbox"
                    checked={item.optional}
                    onChange={(e) => patchItem(secIdx, itemIdx, { optional: e.target.checked })}
                  />
                  Optional
                </label>
                <span className="row-actions">
                  <button
                    type="button"
                    className="btn btn-icon"
                    title="Move ingredient up"
                    disabled={itemIdx === 0}
                    onClick={() => setSections((prev) => prev.map((s, i) => (i === secIdx ? { ...s, items: move(s.items, itemIdx, -1) } : s)))}
                  >↑</button>
                  <button
                    type="button"
                    className="btn btn-icon"
                    title="Move ingredient down"
                    disabled={itemIdx === sec.items.length - 1}
                    onClick={() => setSections((prev) => prev.map((s, i) => (i === secIdx ? { ...s, items: move(s.items, itemIdx, 1) } : s)))}
                  >↓</button>
                  <button
                    type="button"
                    className="btn btn-icon btn-danger"
                    title="Remove ingredient"
                    onClick={() => setSections((prev) => prev.map((s, i) => (i === secIdx ? { ...s, items: s.items.filter((_, ii) => ii !== itemIdx) } : s)))}
                  >✕</button>
                </span>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setSections((prev) => prev.map((s, i) => (i === secIdx ? { ...s, items: [...s.items, emptyItem()] } : s)))}
            >
              + Add ingredient to “{sec.name.trim() || 'this section'}”
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-outline" onClick={() => setSections((prev) => [...prev, emptySection('')])}>
          + Add ingredient section
        </button>
      </fieldset>

      <fieldset className="form-section">
        <legend>5 · Method</legend>
        {steps.map((step, idx) => (
          <div key={step.key} className="step-edit-row">
            <span className="step-num">{idx + 1}</span>
            <textarea
              rows={2}
              value={step.instruction}
              placeholder="Describe this step…"
              aria-label={`Step ${idx + 1} instruction`}
              onChange={(e) => setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, instruction: e.target.value } : s)))}
            />
            <label className="timer-field">
              <span>Timer (min)</span>
              <input
                type="number"
                min="0"
                value={step.timer}
                placeholder="—"
                onChange={(e) => setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, timer: e.target.value } : s)))}
              />
            </label>
            <span className="row-actions">
              <button type="button" className="btn btn-icon" title="Move step up" disabled={idx === 0} onClick={() => setSteps((prev) => move(prev, idx, -1))}>↑</button>
              <button type="button" className="btn btn-icon" title="Move step down" disabled={idx === steps.length - 1} onClick={() => setSteps((prev) => move(prev, idx, 1))}>↓</button>
              <button type="button" className="btn btn-icon btn-danger" title="Remove step" onClick={() => setSteps((prev) => prev.filter((_, i) => i !== idx))}>✕</button>
            </span>
          </div>
        ))}
        <button type="button" className="btn btn-outline" onClick={() => setSteps((prev) => [...prev, emptyStep()])}>+ Add step</button>
      </fieldset>

      <fieldset className="form-section">
        <legend>6 · Meal-planning options</legend>
        <label className="checkline">
          <input type="checkbox" checked={includeInSuggestions} onChange={(e) => setIncludeInSuggestions(e.target.checked)} />
          Make this recipe available in meal-plan suggestions
        </label>
        <label className="checkline">
          <input type="checkbox" checked={addToPlan} onChange={(e) => setAddToPlan(e.target.checked)} />
          Add this recipe to the meal plan immediately
        </label>
        {addToPlan ? (
          <div className="plan-fields">
            <label>
              <span>Meal-planning week</span>
              <select
                value={planWeek}
                onChange={(e) => { setPlanWeek(e.target.value); setPlanDate(e.target.value) }}
              >
                {weekChoices.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </label>
            <label>
              <span>Planned cooking date</span>
              <input
                type="date"
                value={planDate}
                min={planWeek}
                max={addDaysISO(planWeek, 6)}
                onChange={(e) => e.target.value && setPlanDate(e.target.value)}
              />
            </label>
            <label>
              <span>Planned serving time slot</span>
              <select value={planSlot} onChange={(e) => setPlanSlot(e.target.value)}>
                {SLOTS.map((s) => <option key={s} value={s}>{SLOT_LABELS[s]}</option>)}
              </select>
            </label>
            <label>
              <span>Date &amp; time (optional)</span>
              <input type="time" value={planTime} onChange={(e) => setPlanTime(e.target.value)} />
            </label>
          </div>
        ) : null}
      </fieldset>

      <fieldset className="form-section">
        <legend>7 · Recipe options menu</legend>
        <p className="subtle">Defaults for this recipe — adjustable any time from the recipe page.</p>
        <div className="options-panel options-inline">
          <ToggleRow
            label="Include ingredients in generated shopping lists"
            checked={options.includeInShoppingList}
            onChange={(v) => setOptions((o) => ({ ...o, includeInShoppingList: v }))}
          />
          <ToggleRow
            label="Show nutrition information"
            checked={options.showNutrition}
            onChange={(v) => setOptions((o) => ({ ...o, showNutrition: v }))}
          />
          <ToggleRow
            label="Allow ingredient substitutions"
            checked={options.allowSubstitutions}
            onChange={(v) => setOptions((o) => ({ ...o, allowSubstitutions: v }))}
          />
          <p className="options-title">Measurements (choose one)</p>
          <RadioRow label="US customary measurements" selected={options.units === 'us'} onSelect={() => setOptions((o) => ({ ...o, units: 'us' }))} />
          <RadioRow label="Metric measurements" selected={options.units === 'metric'} onSelect={() => setOptions((o) => ({ ...o, units: 'metric' }))} />
        </div>
      </fieldset>

      <div className="form-foot">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">Save recipe</button>
      </div>
    </form>
  )
}
