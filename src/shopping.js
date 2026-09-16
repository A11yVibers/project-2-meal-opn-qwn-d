import { SLOTS, shoppingCategoryFor } from './csv.js'
import { weekDatesISO } from './format.js'
import { optionsFor } from './components/OptionsMenu.jsx'

export function ingredientKey(ing) {
  return ing.ingredientId || `name:${String(ing.name || '').trim().toLowerCase()}`
}

export function buildShoppingItems({ mealPlan, weekStart, recipeById, allOptions }) {
  const itemMap = new Map()
  for (const date of weekDatesISO(weekStart)) {
    for (const slot of SLOTS) {
      const entry = mealPlan[date]?.[slot]
      if (!entry) continue
      const recipe = recipeById[entry.recipeId]
      if (!recipe) continue
      const opts = optionsFor(allOptions, recipe.id)
      if (!opts.includeInShoppingList) continue
      for (const ing of recipe.ingredients || []) {
        const key = ingredientKey(ing)
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            key,
            name: ing.name,
            category: shoppingCategoryFor(ing.ingredientId, ing.name),
            units: new Map(),
            sources: new Map(),
          })
        }
        const item = itemMap.get(key)
        const unit = ing.unit || ''
        const u = item.units.get(unit) || { qty: 0, hasQty: false }
        if (ing.qty !== null && ing.qty !== undefined && Number.isFinite(Number(ing.qty))) {
          u.qty += Number(ing.qty)
          u.hasQty = true
        }
        item.units.set(unit, u)
        item.sources.set(recipe.title, (item.sources.get(recipe.title) || 0) + 1)
      }
    }
  }
  return [...itemMap.values()]
}
