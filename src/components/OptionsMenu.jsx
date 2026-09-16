import { useEffect, useRef, useState } from 'react'

export const DEFAULT_OPTIONS = {
  includeInShoppingList: true,
  showNutrition: false,
  allowSubstitutions: false,
  units: 'us',
}

export function optionsFor(allOptions, recipeId) {
  return { ...DEFAULT_OPTIONS, ...(allOptions[recipeId] || {}) }
}

export function ToggleRow({ label, hint, checked, onChange }) {
  return (
    <label className={`opt-row opt-toggle ${checked ? 'is-on' : ''}`}>
      <span className="opt-check" aria-hidden="true">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="box">{checked ? '✓' : ''}</span>
      </span>
      <span className="opt-text">
        <span className="opt-label">{label}</span>
        {hint ? <span className="opt-hint">{hint}</span> : null}
      </span>
    </label>
  )
}

export function RadioRow({ label, selected, onSelect }) {
  return (
    <label className={`opt-row opt-radio ${selected ? 'is-on' : ''}`}>
      <span className="opt-check" aria-hidden="true">
        <input type="radio" checked={selected} onChange={() => onSelect()} />
        <span className="dot" />
      </span>
      <span className="opt-text"><span className="opt-label">{label}</span></span>
    </label>
  )
}

export default function OptionsMenu({ value, onChange, label = 'Recipe options' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const opts = { ...DEFAULT_OPTIONS, ...value }

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const set = (patch) => onChange({ ...opts, ...patch })
  const activeCount =
    (opts.includeInShoppingList ? 1 : 0) + (opts.showNutrition ? 1 : 0) + (opts.allowSubstitutions ? 1 : 0)

  return (
    <div className="options-menu" ref={rootRef}>
      <button
        type="button"
        className={`btn btn-outline options-trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="gear" aria-hidden="true">⚙</span>
        {label}
        <span className="opt-state" title={`${activeCount} options on · ${opts.units === 'metric' ? 'Metric' : 'US'} units`}>
          {opts.units === 'metric' ? 'Metric' : 'US'}
          {activeCount > 0 ? ` · ${activeCount}` : ''}
        </span>
      </button>
      {open ? (
        <div className="options-panel" role="menu">
          <p className="options-title">Recipe options</p>
          <ToggleRow
            label="Include ingredients in shopping lists"
            checked={opts.includeInShoppingList}
            onChange={(v) => set({ includeInShoppingList: v })}
          />
          <ToggleRow
            label="Show nutrition information"
            checked={opts.showNutrition}
            onChange={(v) => set({ showNutrition: v })}
          />
          <ToggleRow
            label="Allow ingredient substitutions"
            checked={opts.allowSubstitutions}
            onChange={(v) => set({ allowSubstitutions: v })}
          />
          <p className="options-title">Measurements</p>
          <RadioRow label="US customary" selected={opts.units === 'us'} onSelect={() => set({ units: 'us' })} />
          <RadioRow label="Metric" selected={opts.units === 'metric'} onSelect={() => set({ units: 'metric' })} />
        </div>
      ) : null}
    </div>
  )
}
