export const PLANNER_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export const SPICE_LABELS = ['None', 'Mild', 'Medium', 'Spicy', 'Very spicy', 'Extra spicy']

export const SHOPPING_CATEGORY_ORDER = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices',
  'Other',
]

export const defaultOptions = {
  includeInShoppingList: true,
  showNutrition: false,
  allowSubstitutions: false,
  measurements: 'us',
}

export const SUBSTITUTIONS = {
  ING001: ['ING002'],
  ING002: ['ING001'],
  ING008: ['ING030'],
  ING030: ['ING008', 'ING032'],
  ING032: ['ING030'],
  ING010: ['ING035'],
  ING035: ['ING010'],
  ING031: ['ING034'],
  ING034: ['ING031'],
  ING025: ['ING027'],
  ING026: ['ING027'],
  ING027: ['ING026', 'ING025'],
  ING036: ['ING037'],
  ING037: ['ING036'],
  ING038: ['ING021'],
  ING021: ['ING038'],
  ING012: ['ING020'],
  ING020: ['ING012'],
}

export function difficultyLabel(d) {
  if (d == null || isNaN(d)) return null
  if (d <= 2) return 'Easy'
  if (d === 3) return 'Medium'
  return 'Advanced'
}

export function formatMinutes(mins) {
  const n = Number(mins)
  if (!n || isNaN(n) || n <= 0) return '\u2014'
  if (n < 60) return `${n} min`
  const h = Math.floor(n / 60)
  const m = n % 60
  return m ? `${h} hr ${m} min` : `${h} hr`
}

export function slotForMealType(mealTypeId) {
  const map = { MT01: 'Breakfast', MT02: 'Lunch', MT03: 'Dinner', MT04: 'Snack' }
  return map[mealTypeId] || 'Dinner'
}
