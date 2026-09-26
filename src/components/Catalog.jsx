import { useMemo, useState } from 'react'
import RecipeCard from './RecipeCard.jsx'
import { cuisineById, mealTypeById, dietaryTagById } from '../lib/data.js'

export default function Catalog({ recipes, onOpen, onNew }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return recipes
    return recipes.filter((r) => {
      if (r.title.toLowerCase().includes(q)) return true
      if ((r.shortDescription || '').toLowerCase().includes(q)) return true
      const cuisine = cuisineById.get(r.cuisineId)
      if (cuisine && cuisine.name.toLowerCase().includes(q)) return true
      const mealType = mealTypeById.get(r.mealTypeId)
      if (mealType && mealType.name.toLowerCase().includes(q)) return true
      return (r.dietaryTagIds || []).some((id) => dietaryTagById.get(id)?.name.toLowerCase().includes(q))
    })
  }, [recipes, query])

  return (
    <section className="view">
      <div className="view-head">
        <div>
          <h2>Recipe catalog</h2>
          <p className="muted">{recipes.length} recipe{recipes.length === 1 ? '' : 's'} · seeds from project data plus your own</p>
        </div>
        <div className="view-head-actions">
          <input
            type="search"
            className="input search-input"
            placeholder="Search recipes, cuisines, tags…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search recipes"
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No recipes match “{query}”.</p>
          <button type="button" className="btn btn-primary" onClick={onNew}>+ New recipe</button>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} onOpen={onOpen} />)}
        </div>
      )}
    </section>
  )
}
