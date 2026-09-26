import { useState } from 'react'
import { PLACEHOLDER_IMAGE, cuisineById, mealTypeById, dietaryTagById, SPICE_LABELS } from '../lib/data.js'
import { formatMinutes } from '../lib/units.js'

export default function RecipeCard({ recipe, onOpen }) {
  const [imgOk, setImgOk] = useState(true)
  const src = recipe.coverImageUrl && imgOk ? recipe.coverImageUrl : PLACEHOLDER_IMAGE
  const cuisine = cuisineById.get(recipe.cuisineId)
  const mealType = mealTypeById.get(recipe.mealTypeId)
  const tags = (recipe.dietaryTagIds || []).map((id) => dietaryTagById.get(id)).filter(Boolean)

  return (
    <article
      className="recipe-card"
      style={{ '--accent': recipe.accentColor }}
      onClick={() => onOpen(recipe.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(recipe.id) } }}
    >
      <div className="card-img">
        <img src={src} alt={recipe.title} loading="lazy" onError={() => setImgOk(false)} />
      </div>
      <div className="card-body">
        <div className="card-title-row">
          <h3>{recipe.title}</h3>
          {recipe.includeInSuggestions && <span className="badge badge-suggest" title="Available in meal-plan suggestions">Suggested</span>}
        </div>
        <div className="card-meta">
          {cuisine && <span>{cuisine.name}</span>}
          {mealType && <span>{mealType.name}</span>}
        </div>
        {recipe.shortDescription && <p className="card-desc">{recipe.shortDescription}</p>}
        <div className="card-badges">
          {recipe.totalMinutes > 0 && <span className="badge">{formatMinutes(recipe.totalMinutes)}</span>}
          <span className="badge">{recipe.servings} servings</span>
          <span className="badge" title={`Spice level: ${SPICE_LABELS[recipe.spiceLevel] || ''}`}>
            {SPICE_LABELS[recipe.spiceLevel] || 'Not spicy'}
          </span>
        </div>
        {tags.length > 0 && (
          <div className="card-tags">
            {tags.slice(0, 3).map((tag) => <span key={tag.id} className="tag">{tag.name}</span>)}
            {tags.length > 3 && <span className="tag">+{tags.length - 3}</span>}
          </div>
        )}
      </div>
    </article>
  )
}
