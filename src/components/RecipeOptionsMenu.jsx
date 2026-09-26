import { useState, useEffect, useRef } from 'react'

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`switch-row${checked ? ' on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-track">
        <span className="switch-knob" />
      </span>
      <span className="switch-label">{label}</span>
    </button>
  )
}

export default function RecipeOptionsMenu({ options, onChange, variant = 'popover' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open || variant === 'inline') return undefined
    const onDown = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = e => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, variant])

  const panel = (
    <div className="options-panel">
      <p className="options-heading">Recipe options</p>
      <Switch
        checked={!!options.includeInShoppingList}
        onChange={v => onChange('includeInShoppingList', v)}
        label="Include ingredients in generated shopping lists"
      />
      <Switch
        checked={!!options.showNutrition}
        onChange={v => onChange('showNutrition', v)}
        label="Show nutrition information"
      />
      <Switch
        checked={!!options.allowSubstitutions}
        onChange={v => onChange('allowSubstitutions', v)}
        label="Allow ingredient substitutions"
      />
      <div className="options-divider" />
      <p className="options-subheading">Measurements</p>
      <div className="segmented" role="radiogroup" aria-label="Measurement system">
        <button
          type="button"
          role="radio"
          aria-checked={options.measurements === 'us'}
          className={`seg${options.measurements === 'us' ? ' active' : ''}`}
          onClick={() => onChange('measurements', 'us')}
        >
          US customary
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={options.measurements === 'metric'}
          className={`seg${options.measurements === 'metric' ? ' active' : ''}`}
          onClick={() => onChange('measurements', 'metric')}
        >
          Metric
        </button>
      </div>
    </div>
  )

  if (variant === 'inline') {
    return <div className="options-inline">{panel}</div>
  }

  return (
    <div className="options-popover" ref={ref}>
      <button
        type="button"
        className={`btn ghost sm${open ? ' active' : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        Recipe options <span className={`caret${open ? ' up' : ''}`}>{'\u25BE'}</span>
      </button>
      {open && panel}
    </div>
  )
}
