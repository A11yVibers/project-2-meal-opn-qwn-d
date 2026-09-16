import { ingredientById, shoppingCategoryFor } from './csv.js'

const KCAL_PER_UNIT = {
  'Produce': 50,
  'Meat & seafood': 400,
  'Dairy & eggs': 300,
  'Grains & pantry': 400,
  'Oils & condiments': 800,
  'Canned & jarred': 150,
  'Spices': 20,
  'Other': 120,
}

const MACRO_SPLIT = {
  'Produce': [0.1, 0.8, 0.1],
  'Meat & seafood': [0.6, 0.0, 0.4],
  'Dairy & eggs': [0.3, 0.2, 0.5],
  'Grains & pantry': [0.15, 0.7, 0.15],
  'Oils & condiments': [0.0, 0.3, 0.7],
  'Canned & jarred': [0.15, 0.6, 0.25],
  'Spices': [0.1, 0.8, 0.1],
  'Other': [0.2, 0.5, 0.3],
}

const UNIT_FACTOR = {
  g: 1 / 240, kg: 1000 / 240, oz: 28.3495 / 240, lb: 453.592 / 240,
  ml: 1 / 240, l: 1000 / 240, tsp: 5 / 240, tbsp: 15 / 240, cup: 1,
  piece: 0.5, clove: 0.05, can: 1.5, package: 2, pinch: 0.01, 'to taste': 0.02,
}

export function estimateNutrition(recipe) {
  let kcal = 0
  for (const ing of recipe.ingredients || []) {
    const category = shoppingCategoryFor(ing.ingredientId, ing.name)
    const factor = UNIT_FACTOR[String(ing.unit || '').toLowerCase()] ?? 0.4
    const qty = Number(ing.qty) || 0
    kcal += qty * factor * (KCAL_PER_UNIT[category] ?? 120)
  }
  const servings = Math.max(1, Number(recipe.servings) || 1)
  const perServing = kcal / servings
  let protein = 0
  let carbs = 0
  let fat = 0
  for (const ing of recipe.ingredients || []) {
    const category = shoppingCategoryFor(ing.ingredientId, ing.name)
    const factor = UNIT_FACTOR[String(ing.unit || '').toLowerCase()] ?? 0.4
    const share = ((Number(ing.qty) || 0) * factor * (KCAL_PER_UNIT[category] ?? 120)) / servings
    const [p, c, f] = MACRO_SPLIT[category] ?? MACRO_SPLIT.Other
    protein += (share * p) / 4
    carbs += (share * c) / 4
    fat += (share * f) / 9
  }
  return {
    kcalPerServing: Math.round(perServing),
    proteinG: Math.round(protein),
    carbsG: Math.round(carbs),
    fatG: Math.round(fat),
  }
}

export const SUBSTITUTIONS = {
  ING001: ['ING002'],
  ING002: ['ING001'],
  ING003: ['ING004', 'ING001'],
  ING004: ['ING003'],
  ING007: ['ING010'],
  ING008: ['ING030'],
  ING009: ['ING007'],
  ING010: ['ING035', 'ING007'],
  ING021: ['ING038'],
  ING025: ['ING027'],
  ING026: ['ING027', 'ING025'],
  ING027: ['ING026'],
  ING031: ['ING034'],
  ING035: ['ING010'],
  ING036: ['ING037'],
  ING037: ['ING036'],
  ING038: ['ING021'],
}

export function substitutionsFor(ingredientId) {
  const ids = SUBSTITUTIONS[ingredientId]
  if (!ids) return []
  return ids.map((id) => ingredientById[id]?.ingredient_name).filter(Boolean)
}
