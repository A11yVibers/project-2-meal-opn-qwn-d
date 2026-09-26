import { useEffect, useState } from 'react'

export const STORAGE_KEYS = {
  userRecipes: 'mealplanner.userRecipes.v1',
  recipeOptions: 'mealplanner.recipeOptions.v1',
  plan: 'mealplanner.plan.v1',
  shopping: 'mealplanner.shopping.v1',
}

export const DEFAULT_OPTIONS = Object.freeze({
  includeInShoppingList: true,
  showNutrition: false,
  allowSubstitutions: true,
  unitSystem: 'us',
})

export function usePersistentState(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw != null) return JSON.parse(raw)
    } catch {
      // fall through to initial value
    }
    return initial
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // storage may be unavailable; state still works in-memory
    }
  }, [key, state])
  return [state, setState]
}

export function newRecipeId() {
  return `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
