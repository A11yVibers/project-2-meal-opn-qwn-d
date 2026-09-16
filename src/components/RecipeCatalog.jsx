import { useMemo, useState } from 'react'
import { cuisineById, mealTypeById, dietaryTagById, MEAL_TYPES, CUISINES, DIETARY_TAGS, RECIPE_CATEGORIES } from '../csv.js'
import { formatMinutes } from '../format.js'
import Thumb from './Thumb.jsx'

function Card({ recipe, onOpen }) {
  return (
    <button type="button" className="recipe-card" onClick={() => onOpen(recipe.id)} style={{ '--accent': recipe.accentColor }}>
      <span className="card-accent" aria-hidden="true" />
      <Thumb className="card-thumb" src={recipe.coverImageUrl} alt={recipe.title} />
      <span className="card-body">
        <span className="card-title">{recipe.title}</span>
        {recipe.shortDescription ? <span className="card-desc">{recipe.shortDescription}</span> : null}
        <span className="card-meta">
          {recipe.cuisineId && cuisineById[recipe.cuisineId] ? <span className="chip">{cuisineById[recipe.cuisineId]}</span> : null}
          {recipe.mealTypeId && mealTypeById[recipe.mealTypeId] ? <span className="chip">{mealTypeById[recipe.mealTypeId]}</span> : null}
          <span className="chip chip-time">{formatMinutes(recipe.totalMinutes)} total</span>
          <span className="chip chip-serv">{recipe.servings} servings</span>
        </span>
        {recipe.dietaryTagIds?.length ? (
          <span className="card-tags">
            {recipe.dietaryTagIds.slice(0, 3).map((id) => (
              <span key={id} className="tag">{dietaryTagById[id] || id}</span>
            ))}
            {recipe.dietaryTagIds.length > 3 ? <span className="tag">+{recipe.dietaryTagIds.length - 3}</span> : null}
          </span>
        ) : null}
      </span>
      {recipe.isUser ? <span className="badge-user">Your recipe</span> : null}
    </button>
  )
}

export default function RecipeCatalog({ recipes, onOpen, onAdd }) {
  const [query, setQuery] = useState('')
  const [mealFilter, setMealFilter] = useState('')
  const [cuisineFilter, setCuisineFilter] = useState('')
  const [dietFilter, setDietFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return recipes.filter((r) => {
      if (mealFilter && r.mealTypeId !== mealFilter) return false
      if (cuisineFilter && r.cuisineId !== cuisineFilter) return false
      if (dietFilter && !(r.dietaryTagIds || []).includes(dietFilter)) return false
      if (catFilter && !(r.categoryIds || []).includes(catFilter)) return false
      if (q) {
        const hay = `${r.title} ${r.shortDescription || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [recipes, query, mealFilter, cuisineFilter, dietFilter, catFilter])

  return (
    <section className="catalog">
      <div className="catalog-head">
        <div>
          <h2>Recipe catalog</h2>
          <p className="subtle">{recipes.length} recipes · {recipes.filter((r) => r.isUser).length} created by you</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onAdd}>+ Add recipe</button>
      </div>
      <div className="filters">
        <input
          type="search"
          placeholder="Search recipes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search recipes"
        />
        <select value={mealFilter} onChange={(e) => setMealFilter(e.target.value)} aria-label="Filter by meal type">
          <option value="">All meal types</option>
          {MEAL_TYPES.map((m) => <option key={m.meal_type_id} value={m.meal_type_id}>{m.meal_type_name}</option>)}
        </select>
        <select value={cuisineFilter} onChange={(e) => setCuisineFilter(e.target.value)} aria-label="Filter by cuisine">
          <option value="">All cuisines</option>
          {CUISINES.map((c) => <option key={c.cuisine_id} value={c.cuisine_id}>{c.cuisine_name}</option>)}
        </select>
        <select value={dietFilter} onChange={(e) => setDietFilter(e.target.value)} aria-label="Filter by dietary tag">
          <option value="">All diets</option>
          {DIETARY_TAGS.map((d) => <option key={d.dietary_tag_id} value={d.dietary_tag_id}>{d.dietary_tag_name}</option>)}
        </select>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {RECIPE_CATEGORIES.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
        </select>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No recipes match your filters.</p>
          <button type="button" className="btn btn-outline" onClick={() => { setQuery(''); setMealFilter(''); setCuisineFilter(''); setDietFilter(''); setCatFilter('') }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((r) => <Card key={r.id} recipe={r} onOpen={onOpen} />)}
        </div>
      )}
    </section>
  )
}
