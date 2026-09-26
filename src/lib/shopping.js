import { SHOPPING_CATEGORIES, PLAN_SLOTS, ingredientByName } from './data.js'
import { weekDates } from './dates.js'
import { convertQuantity } from './units.js'

export function buildShoppingList({ weekStart, plan, recipesById, getOptions, pantry, excludePantry }) {
  const dates = weekDates(weekStart)
  const items = new Map()
  const excluded = new Map()
  const plannedRecipeIds = []

  for (const date of dates) {
    const day = plan[date]
    if (!day) continue
    for (const slot of PLAN_SLOTS) {
      const assignment = day[slot.key]
      if (!assignment) continue
      const recipe = recipesById.get(assignment.recipeId)
      if (!recipe) continue
      plannedRecipeIds.push(recipe.id)
      const options = getOptions(recipe.id)
      if (!options.includeInShoppingList) continue
      for (const entry of recipe.ingredients || []) {
        const name = (entry.name || '').trim()
        if (!name) continue
        const lower = name.toLowerCase()
        const inPantry = pantry.includes(lower)
        if (excludePantry && inPantry) {
          if (!excluded.has(lower)) excluded.set(lower, { name, recipes: new Set() })
          excluded.get(lower).recipes.add(recipe.title)
          continue
        }
        const converted = convertQuantity(entry.quantity, entry.unit, options.unitSystem)
        const key = `${lower}|${converted.unit || ''}`
        if (!items.has(key)) {
          const csvIng = ingredientByName.get(lower)
          items.set(key, {
            key,
            name,
            unit: converted.unit || '',
            quantity: 0,
            hasQuantity: false,
            notes: new Set(),
            optional: true,
            recipes: new Set(),
            inPantry,
            category: csvIng ? csvIng.category : 'Other',
          })
        }
        const item = items.get(key)
        if (converted.quantity != null && Number.isFinite(converted.quantity)) {
          item.quantity += converted.quantity
          item.hasQuantity = true
        }
        if (entry.notes) item.notes.add(entry.notes)
        item.optional = item.optional && Boolean(entry.optional)
        item.recipes.add(recipe.title)
      }
    }
  }

  const groups = []
  for (const category of SHOPPING_CATEGORIES) {
    const categoryItems = [...items.values()]
      .filter((item) => item.category === category)
      .map((item) => ({
        ...item,
        notes: [...item.notes].join(', '),
        recipes: [...item.recipes],
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
    if (categoryItems.length > 0) groups.push({ category, items: categoryItems })
  }

  const excludedItems = [...excluded.values()]
    .map((item) => ({ ...item, recipes: [...item.recipes] }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    groups,
    excludedItems,
    plannedRecipeIds,
    totalItems: [...items.values()].length,
  }
}
