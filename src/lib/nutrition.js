import { ingredientById } from './data.js'

const PER_100G_BY_CATEGORY = {
  'Meat & seafood': { kcal: 170, protein: 24, carbs: 0, fat: 7 },
  'Dairy & eggs': { kcal: 180, protein: 11, carbs: 5, fat: 13 },
  Produce: { kcal: 28, protein: 1.4, carbs: 6, fat: 0.3 },
  'Grains & pantry': { kcal: 360, protein: 11, carbs: 75, fat: 2.5 },
  'Oils & condiments': { kcal: 500, protein: 0, carbs: 25, fat: 22 },
  'Canned & jarred': { kcal: 110, protein: 6, carbs: 18, fat: 2 },
  Spices: { kcal: 300, protein: 10, carbs: 52, fat: 9 },
}

const INGREDIENT_OVERRIDES = {
  ING006: { kcal: 155, protein: 13, carbs: 1.1, fat: 11 },
  ING007: { kcal: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  ING008: { kcal: 717, protein: 0.9, carbs: 0.1, fat: 81 },
  ING009: { kcal: 431, protein: 38, carbs: 4, fat: 29 },
  ING010: { kcal: 340, protein: 2.8, carbs: 2.8, fat: 36 },
  ING025: { kcal: 365, protein: 7, carbs: 80, fat: 0.7 },
  ING026: { kcal: 371, protein: 13, carbs: 75, fat: 1.5 },
  ING030: { kcal: 884, protein: 0, carbs: 0, fat: 100 },
  ING032: { kcal: 884, protein: 0, carbs: 0, fat: 100 },
  ING033: { kcal: 304, protein: 0.3, carbs: 82, fat: 0 },
  ING035: { kcal: 230, protein: 2.3, carbs: 6, fat: 24 },
  ING036: { kcal: 164, protein: 9, carbs: 27, fat: 2.6 },
  ING044: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
}

const GRAMS_PER_UNIT = {
  g: 1,
  kg: 1000,
  oz: 28.35,
  lb: 453.6,
  ml: 1,
  L: 1000,
  tsp: 4.5,
  tbsp: 13.5,
  cup: 200,
  piece: 100,
  clove: 5,
  can: 400,
  package: 300,
  pinch: 0.4,
  'to taste': 2,
}

const PIECE_GRAMS = {
  ING006: 50,
  ING011: 120,
  ING020: 15,
  ING021: 100,
  ING022: 60,
  ING024: 150,
}

const DEFAULT_PROFILE = { kcal: 120, protein: 6, carbs: 15, fat: 4 }

function profileFor(ingredientId) {
  if (ingredientId && INGREDIENT_OVERRIDES[ingredientId]) return INGREDIENT_OVERRIDES[ingredientId]
  const ing = (ingredientId && ingredientById.get(ingredientId)) || null
  const category = ing ? ing.category : null
  return (category && PER_100G_BY_CATEGORY[category]) || DEFAULT_PROFILE
}

function gramsFor(entry) {
  const qty = entry.quantity == null ? 1 : entry.quantity
  if (entry.unit === 'piece' && entry.ingredientId && PIECE_GRAMS[entry.ingredientId]) {
    return qty * PIECE_GRAMS[entry.ingredientId]
  }
  const perUnit = GRAMS_PER_UNIT[entry.unit] ?? 100
  return qty * perUnit
}

export function estimateNutrition(recipe) {
  const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  for (const entry of recipe.ingredients || []) {
    const profile = profileFor(entry.ingredientId)
    const grams = gramsFor(entry)
    const scale = grams / 100
    totals.kcal += profile.kcal * scale
    totals.protein += profile.protein * scale
    totals.carbs += profile.carbs * scale
    totals.fat += profile.fat * scale
  }
  const servings = Math.max(1, recipe.servings || 1)
  return {
    kcal: Math.round(totals.kcal / servings),
    protein: Math.round(totals.protein / servings),
    carbs: Math.round(totals.carbs / servings),
    fat: Math.round(totals.fat / servings),
  }
}
