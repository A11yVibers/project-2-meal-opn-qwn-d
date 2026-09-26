import { useState, useEffect, useRef } from 'react'

export default function IngredientCombobox({ ingredients, value, onSelect, placeholder }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value || '')
  const [highlight, setHighlight] = useState(0)
  const boxRef = useRef(null)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    if (!open) return undefined
    const onDown = e => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        commit(query)
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  })

  const q = query.trim().toLowerCase()
  const filtered = (q ? ingredients.filter(i => i.name.toLowerCase().includes(q)) : ingredients).slice(0, 8)

  function commit(text) {
    const name = (text || '').trim()
    const match = ingredients.find(i => i.name.toLowerCase() === name.toLowerCase())
    onSelect({ ingredientId: match ? match.id : null, name })
  }

  function pick(item) {
    onSelect({ ingredientId: item.id, name: item.name })
    setQuery(item.name)
    setOpen(false)
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setHighlight(h => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      if (open && filtered[highlight]) {
        e.preventDefault()
        pick(filtered[highlight])
      } else {
        commit(query)
        setOpen(false)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="combobox" ref={boxRef}>
      <input
        type="text"
        className="input"
        value={query}
        placeholder={placeholder || 'Search ingredients\u2026'}
        onChange={e => {
          setQuery(e.target.value)
          setHighlight(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(query)}
        aria-label="Ingredient"
      />
      {open && filtered.length > 0 && (
        <ul className="combobox-list" role="listbox">
          {filtered.map((item, i) => (
            <li
              key={item.id}
              role="option"
              aria-selected={i === highlight}
              className={i === highlight ? 'highlight' : ''}
              onMouseDown={e => {
                e.preventDefault()
                pick(item)
              }}
              onMouseEnter={() => setHighlight(i)}
            >
              <span>{item.name}</span>
              <span className="combobox-cat">{item.category}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
