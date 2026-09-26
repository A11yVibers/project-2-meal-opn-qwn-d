import { useEffect, useRef, useState } from 'react'
import { ingredients as ALL_INGREDIENTS } from '../lib/data.js'

export default function IngredientCombobox({ value, onChange, placeholder = 'Search ingredients…' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value.name || '')
  const boxRef = useRef(null)

  useEffect(() => {
    setQuery(value.name || '')
  }, [value.name])

  useEffect(() => {
    function onPointerDown(event) {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const q = query.trim().toLowerCase()
  const matches = (q ? ALL_INGREDIENTS.filter((i) => i.name.toLowerCase().includes(q)) : ALL_INGREDIENTS).slice(0, 40)

  return (
    <div className="combobox" ref={boxRef}>
      <input
        type="text"
        className="input"
        value={query}
        placeholder={placeholder}
        aria-label="Ingredient"
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          onChange({ ingredientId: null, name: e.target.value })
        }}
        onFocus={() => setOpen(true)}
      />
      {open && matches.length > 0 && (
        <ul className="combobox-list">
          {matches.map((ing) => (
            <li key={ing.id}>
              <button
                type="button"
                className={ing.name.toLowerCase() === q ? 'active' : ''}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange({ ingredientId: ing.id, name: ing.name })
                  setQuery(ing.name)
                  setOpen(false)
                }}
              >
                <span>{ing.name}</span>
                <span className="combobox-cat">{ing.category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
