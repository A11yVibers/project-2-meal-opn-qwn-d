import { parseCsv } from './csv.js'
import { APPROVED_IMAGES } from '../approved-images.js'
import recipesCsv from '../../project-assets/recipes.csv?raw'
import recipeIngredientsCsv from '../../project-assets/recipe_ingredients.csv?raw'
import recipeStepsCsv from '../../project-assets/recipe_steps.csv?raw'
import ingredientsCsv from '../../project-assets/ingredients.csv?raw'
import unitsCsv from '../../project-assets/units.csv?raw'
import cuisinesCsv from '../../project-assets/cuisines.csv?raw'
import mealTypesCsv from '../../project-assets/meal_types.csv?raw'
import dietaryTagsCsv from '../../project-assets/dietary_tags.csv?raw'
import recipeCategoriesCsv from '../../project-assets/recipe_categories.csv?raw'

export const PLACEHOLDER_IMAGE = APPROVED_IMAGES.placeholder

function splitList(value) {
  return value ? value.split(',').map((s) => s.trim()).filter(Boolean) : []
}

function toBool(value) {
  return String(value).toLowerCase() === 'true'
}

function toNum(value) {
  if (value === '' || value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export const cuisines = parseCsv(cuisinesCsv).map((r) => ({ id: r.cuisine_id, name: r.cuisine_name }))
export const mealTypes = parseCsv(mealTypesCsv).map((r) => ({ id: r.meal_type_id, name: r.meal_type_name }))
export const dietaryTags = parseCsv(dietaryTagsCsv).map((r) => ({ id: r.dietary_tag_id, name: r.dietary_tag_name }))
export const categories = parseCsv(recipeCategoriesCsv).map((r) => ({ id: r.category_id, name: r.category_name }))
export const units = parseCsv(unitsCsv).map((r) => ({ id: r.unit_id, name: r.unit_name }))
export const ingredients = parseCsv(ingredientsCsv).map((r) => ({
  id: r.ingredient_id,
  name: r.ingredient_name,
  category: r.shopping_category,
}))

export const cuisineById = new Map(cuisines.map((c) => [c.id, c]))
export const mealTypeById = new Map(mealTypes.map((m) => [m.id, m]))
export const dietaryTagById = new Map(dietaryTags.map((t) => [t.id, t]))
export const categoryById = new Map(categories.map((c) => [c.id, c]))
export const ingredientById = new Map(ingredients.map((i) => [i.id, i]))
export const ingredientByName = new Map(ingredients.map((i) => [i.name.toLowerCase(), i]))

export const SHOPPING_CATEGORIES = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices',
  'Other',
]

const SLOT_MEAL_TYPE_IDS = ['MT01', 'MT02', 'MT03', 'MT04']
export const PLAN_SLOTS = SLOT_MEAL_TYPE_IDS.map((id) => {
  const mt = mealTypeById.get(id)
  return { key: mt.name.toLowerCase(), mealTypeId: id, label: mt.name }
})

export function slotForMealType(mealTypeId) {
  const slot = PLAN_SLOTS.find((s) => s.mealTypeId === mealTypeId)
  return slot ? slot.key : 'dinner'
}

export const SPICE_LABELS = ['Not spicy', 'Mild', 'Medium', 'Spicy', 'Very spicy', 'Extra hot']

export const ACCENT_SWATCHES = [
  '#D97757',
  '#8A9A5B',
  '#3B82C4',
  '#C2703D',
  '#7C6BAF',
  '#2F8F83',
  '#B5577F',
  '#5B8C5A',
]

const ingredientRows = parseCsv(recipeIngredientsCsv)
const stepRows = parseCsv(recipeStepsCsv)

export const seedRecipes = parseCsv(recipesCsv).map((r) => ({
  id: r.recipe_id,
  isUser: false,
  title: r.title,
  shortDescription: r.short_description,
  sourceName: r.source_name,
  sourceUrl: r.source_url,
  servings: toNum(r.servings) ?? 4,
  prepMinutes: toNum(r.prep_time_minutes) ?? 0,
  cookMinutes: toNum(r.cook_time_minutes) ?? 0,
  totalMinutes: toNum(r.total_time_minutes) ?? 0,
  cuisineId: r.cuisine_id,
  mealTypeId: r.meal_type_id,
  dietaryTagIds: splitList(r.dietary_tag_ids),
  categoryIds: splitList(r.category_ids),
  difficulty: toNum(r.difficulty_1_to_5),
  spiceLevel: toNum(r.spice_level_0_to_5) ?? 0,
  accentColor: r.accent_color || '#D97757',
  coverImageUrl: r.cover_image_url,
  includeInSuggestions: toBool(r.include_in_meal_suggestions),
  ingredients: ingredientRows
    .filter((row) => row.recipe_id === r.recipe_id)
    .sort((a, b) => Number(a.display_order) - Number(b.display_order))
    .map((row) => ({
      sectionName: row.section_name || 'Main',
      ingredientId: row.ingredient_id || null,
      name: row.ingredient_name,
      quantity: toNum(row.quantity),
      unit: row.unit,
      notes: row.notes,
      optional: toBool(row.optional),
    })),
  steps: stepRows
    .filter((row) => row.recipe_id === r.recipe_id)
    .sort((a, b) => Number(a.step_number) - Number(b.step_number))
    .map((row) => ({
      instruction: row.instruction,
      timerMinutes: toNum(row.timer_minutes) || null,
    })),
}))

const gallery = new Set(Object.values(APPROVED_IMAGES))
for (const r of seedRecipes) if (r.coverImageUrl) gallery.add(r.coverImageUrl)
export const approvedGallery = [...gallery]
