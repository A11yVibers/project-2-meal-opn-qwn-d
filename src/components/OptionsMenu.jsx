import { useEffect, useRef, useState } from 'react'

const TOGGLES = [
  { key: 'includeInShoppingList', label: 'Include ingredients in generated shopping lists' },
  { key: 'showNutrition', label: 'Show nutrition information' },
  { key: 'allowSubstitutions', label: 'Allow ingredient substitutions' },
]

const UNIT_SYSTEMS = [
  { key: 'us', label: 'US customary measurements' },
  { key: 'metric', label: 'Metric measurements' },
]

function OptionsPanel({ options, onChange }) {
  return (
    <div className="options-panel" role="menu">
      <p className="options-heading">Options</p>
      {TOGGLES.map((toggle) => (
        <button
          type="button"
          key={toggle.key}
          role="menuitemcheckbox"
          aria-checked={Boolean(options[toggle.key])}
          className={`option-row${options[toggle.key] ? ' selected' : ''}`}
          onClick={() => onChange({ ...options, [toggle.key]: !options[toggle.key] })}
        >
          <span className="option-check" aria-hidden="true">{options[toggle.key] ? '✓' : ''}</span>
          <span>{toggle.label}</span>
        </button>
      ))}
      <p className="options-heading">Measurement system</p>
      {UNIT_SYSTEMS.map((system) => (
        <button
          type="button"
          key={system.key}
          role="menuitemradio"
          aria-checked={options.unitSystem === system.key}
          className={`option-row${options.unitSystem === system.key ? ' selected' : ''}`}
          onClick={() => onChange({ ...options, unitSystem: system.key })}
        >
          <span className="option-check" aria-hidden="true">{options.unitSystem === system.key ? '✓' : ''}</span>
          <span>{system.label}</span>
        </button>
      ))}
    </div>
  )
}

export default function OptionsMenu({ options, onChange, variant = 'dropdown', label = 'Recipe options' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (variant === 'panel') {
    return <OptionsPanel options={options} onChange={onChange} />
  }

  return (
    <div className="options-menu" ref={ref}>
      <button
        type="button"
        className="btn btn-outline options-menu-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {label} <span className="caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="options-dropdown">
          <OptionsPanel options={options} onChange={onChange} />
        </div>
      )}
    </div>
  )
}
