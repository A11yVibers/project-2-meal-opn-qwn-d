import recipesCsv from '../project-assets/recipes.csv?raw'
import recipeIngredientsCsv from '../project-assets/recipe_ingredients.csv?raw'
import recipeStepsCsv from '../project-assets/recipe_steps.csv?raw'
import ingredientsCsv from '../project-assets/ingredients.csv?raw'
import unitsCsv from '../project-assets/units.csv?raw'
import cuisinesCsv from '../project-assets/cuisines.csv?raw'
import mealTypesCsv from '../project-assets/meal_types.csv?raw'
import dietaryTagsCsv from '../project-assets/dietary_tags.csv?raw'
import recipeCategoriesCsv from '../project-assets/recipe_categories.csv?raw'

export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1 } else { inQuotes = false }
      } else { field += c }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = ''
    } else if (c !== '\r') {
      field += c
    }
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row) }
  const clean = rows.filter((r) => !(r.length === 1 && r[0].trim() === ''))
  const header = clean[0].map((h) => h.trim())
  return clean.slice(1).map((r) => Object.fromEntries(header.map((h, idx) => [h, (r[idx] ?? '').trim()])))
}

function splitIds(value) {
  return value ? value.split(',').map((s) => s.trim()).filter(Boolean) : []
}

function toBool(value) {
  return String(value).toLowerCase() === 'true'
}

function toNum(value, fallback = 0) {
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : fallback
}

export const CUISINES = parseCsv(cuisinesCsv)
export const MEAL_TYPES = parseCsv(mealTypesCsv)
export const DIETARY_TAGS = parseCsv(dietaryTagsCsv)
export const RECIPE_CATEGORIES = parseCsv(recipeCategoriesCsv)
export const INGREDIENTS = parseCsv(ingredientsCsv)
export const UNITS = parseCsv(unitsCsv).map((u) => u.unit_name)

export const cuisineById = Object.fromEntries(CUISINES.map((c) => [c.cuisine_id, c.cuisine_name]))
export const mealTypeById = Object.fromEntries(MEAL_TYPES.map((m) => [m.meal_type_id, m.meal_type_name]))
export const dietaryTagById = Object.fromEntries(DIETARY_TAGS.map((d) => [d.dietary_tag_id, d.dietary_tag_name]))
export const categoryById = Object.fromEntries(RECIPE_CATEGORIES.map((c) => [c.category_id, c.category_name]))
export const ingredientById = Object.fromEntries(INGREDIENTS.map((i) => [i.ingredient_id, i]))

export const SHOPPING_CATEGORY_ORDER = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices',
]

export function shoppingCategoryFor(ingredientId, ingredientName) {
  if (ingredientId && ingredientById[ingredientId]) return ingredientById[ingredientId].shopping_category
  const match = INGREDIENTS.find((i) => i.ingredient_name.toLowerCase() === String(ingredientName || '').toLowerCase())
  return match ? match.shopping_category : 'Other'
}

export const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack']
export const SLOT_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' }
export const SLOT_MEAL_TYPE = {
  breakfast: MEAL_TYPES.find((m) => m.meal_type_name === 'Breakfast')?.meal_type_id,
  lunch: MEAL_TYPES.find((m) => m.meal_type_name === 'Lunch')?.meal_type_id,
  dinner: MEAL_TYPES.find((m) => m.meal_type_name === 'Dinner')?.meal_type_id,
  snack: MEAL_TYPES.find((m) => m.meal_type_name === 'Snack')?.meal_type_id,
}

const ingredientRows = parseCsv(recipeIngredientsCsv)
const stepRows = parseCsv(recipeStepsCsv)

export const SEED_RECIPES = parseCsv(recipesCsv).map((r) => ({
  id: r.recipe_id,
  title: r.title,
  shortDescription: r.short_description,
  sourceName: r.source_name,
  sourceUrl: r.source_url,
  servings: toNum(r.servings, 1),
  prepMinutes: toNum(r.prep_time_minutes),
  cookMinutes: toNum(r.cook_time_minutes),
  totalMinutes: toNum(r.total_time_minutes, toNum(r.prep_time_minutes) + toNum(r.cook_time_minutes)),
  cuisineId: r.cuisine_id,
  mealTypeId: r.meal_type_id,
  dietaryTagIds: splitIds(r.dietary_tag_ids),
  categoryIds: splitIds(r.category_ids),
  difficulty: r.difficulty_1_to_5 ? toNum(r.difficulty_1_to_5) : null,
  spiceLevel: toNum(r.spice_level_0_to_5),
  accentColor: r.accent_color || '#D97757',
  coverImageUrl: r.cover_image_url || '',
  includeInMealSuggestions: toBool(r.include_in_meal_suggestions),
  isUser: false,
  ingredients: ingredientRows
    .filter((ri) => ri.recipe_id === r.recipe_id)
    .sort((a, b) => toNum(a.display_order) - toNum(b.display_order))
    .map((ri) => ({
      section: ri.section_name || 'Ingredients',
      ingredientId: ri.ingredient_id || null,
      name: ri.ingredient_name,
      qty: ri.quantity ? toNum(ri.quantity) : null,
      unit: ri.unit || '',
      notes: ri.notes || '',
      optional: toBool(ri.optional),
    })),
  steps: stepRows
    .filter((rs) => rs.recipe_id === r.recipe_id)
    .sort((a, b) => toNum(a.step_number) - toNum(b.step_number))
    .map((rs) => ({
      instruction: rs.instruction,
      timerMinutes: toNum(rs.timer_minutes),
    })),
}))
