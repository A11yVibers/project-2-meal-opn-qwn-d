import { useState, useMemo } from 'react'
import { useStore } from '../store.jsx'
import Thumb from './Thumb.jsx'
import { formatMinutes, SPICE_LABELS, difficultyLabel } from '../lib/recipes.js'

function RecipeCard({ recipe, onOpen }) {
  const store = useStore()
  const lk = store.data.lookups
  const cuisine = lk.cuisineById[recipe.cuisineId]
  const mealType = lk.mealTypeById[recipe.mealTypeId]
  const tags = recipe.dietaryTagIds.map(id => lk.tagById[id]).filter(Boolean)
  const diff = difficultyLabel(recipe.difficulty)

  return (
    <article
      className="recipe-card"
      style={{ '--accent': recipe.accentColor || 'var(--brand)' }}
      onClick={() => onOpen(recipe.id)}
      onKeyDown={e => {
        if (e.key === 'Enter') onOpen(recipe.id)
      }}
      tabIndex={0}
      role="button"
      aria-label={`Open recipe ${recipe.title}`}
    >
      <div className="card-thumb">
        <Thumb src={recipe.coverImageUrl} alt={recipe.title} className="thumb-img" />
        {mealType && <span className="card-meal">{mealType.name}</span>}
      </div>
      <div className="card-body">
        <div className="card-title-row">
          <h3>{recipe.title}</h3>
          {recipe.source === 'user' && <span className="badge">Yours</span>}
        </div>
        {recipe.shortDescription && <p className="card-desc">{recipe.shortDescription}</p>}
        <div className="chip-row">
          {cuisine && <span className="chip">{cuisine.name}</span>}
          <span className="chip">{formatMinutes(recipe.totalTimeMinutes)} total</span>
          {recipe.servings != null && <span className="chip">{recipe.servings} servings</span>}
          {recipe.spiceLevel > 0 && <span className="chip">{SPICE_LABELS[recipe.spiceLevel]}</span>}
          {diff && <span className="chip">{diff}</span>}
        </div>
        {tags.length > 0 && (
          <div className="chip-row tags">
            {tags.slice(0, 3).map(t => (
              <span key={t.id} className="chip tag">{t.name}</span>
            ))}
            {tags.length > 3 && <span className="chip tag">+{tags.length - 3}</span>}
          </div>
        )}
      </div>
      <div className="card-foot">
        {recipe.includeInMealSuggestions ? (
          <span className="suggest-flag">In meal suggestions</span>
        ) : (
          <span className="muted small">Not in suggestions</span>
        )}
        <span className="open-hint">View recipe {'\u2192'}</span>
      </div>
    </article>
  )
}

export default function RecipeCatalog({ onOpenRecipe, onAddRecipe, banner, onDismissBanner }) {
  const store = useStore()
  const lk = store.data.lookups
  const [query, setQuery] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [mealType, setMealType] = useState('')
  const [category, setCategory] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return store.allRecipes.filter(r => {
      if (q && !(`${r.title} ${r.shortDescription}`.toLowerCase().includes(q))) return false
      if (cuisine && r.cuisineId !== cuisine) return false
      if (mealType && r.mealTypeId !== mealType) return false
      if (category && !(r.categoryIds || []).includes(category)) return false
      return true
    })
  }, [store.allRecipes, query, cuisine, mealType, category])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Recipe catalog</h1>
          <p className="muted">
            {store.allRecipes.length} recipes ({store.data.seedRecipes.length} seeded from CSV
            {store.userRecipes.length > 0 && `, ${store.userRecipes.length} created by you`})
          </p>
        </div>
        <button type="button" className="btn primary" onClick={onAddRecipe}>+ Add recipe</button>
      </div>

      {banner && (
        <div className="banner" role="status">
          <div>{banner.text}</div>
          <button type="button" className="btn quiet sm" onClick={onDismissBanner} aria-label="Dismiss">{'\u00D7'}</button>
        </div>
      )}

      <div className="toolbar">
        <input
          type="search"
          className="input grow"
          placeholder={'Search recipes\u2026'}
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search recipes"
        />
        <select className="input" value={cuisine} onChange={e => setCuisine(e.target.value)} aria-label="Filter by cuisine">
          <option value="">All cuisines</option>
          {lk.cuisines.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select className="input" value={mealType} onChange={e => setMealType(e.target.value)} aria-label="Filter by meal type">
          <option value="">All meal types</option>
          {lk.mealTypes.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <select className="input" value={category} onChange={e => setCategory(e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {lk.categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No recipes match your filters.</p>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setQuery('')
              setCuisine('')
              setMealType('')
              setCategory('')
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="catalog-grid">
          {filtered.map(r => (
            <RecipeCard key={r.id} recipe={r} onOpen={onOpenRecipe} />
          ))}
        </div>
      )}
    </div>
  )
}
