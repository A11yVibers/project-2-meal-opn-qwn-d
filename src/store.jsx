import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { PROJECT_DATA } from './lib/data.js'
import { loadJSON, saveJSON } from './lib/storage.js'
import { startOfWeekISO, todayISO, slotKey, weekDates } from './lib/dates.js'
import { buildShoppingList } from './lib/shopping.js'
import { defaultOptions } from './lib/recipes.js'

const K = {
  userRecipes: 'mealplanner:v1:userRecipes',
  optionOverrides: 'mealplanner:v1:optionOverrides',
  mealPlan: 'mealplanner:v1:mealPlan',
  checked: 'mealplanner:v1:checked',
  pantry: 'mealplanner:v1:pantry',
  prefs: 'mealplanner:v1:prefs',
}

function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => loadJSON(key, initial))
  useEffect(() => {
    saveJSON(key, value)
  }, [key, value])
  return [value, setValue]
}

const StoreContext = createContext(null)

export function MealStoreProvider({ children }) {
  const data = PROJECT_DATA
  const [userRecipes, setUserRecipes] = usePersistentState(K.userRecipes, [])
  const [optionOverrides, setOptionOverrides] = usePersistentState(K.optionOverrides, {})
  const [mealPlan, setMealPlan] = usePersistentState(K.mealPlan, {})
  const [checked, setChecked] = usePersistentState(K.checked, {})
  const [pantry, setPantry] = usePersistentState(K.pantry, {})
  const [prefs, setPrefs] = usePersistentState(K.prefs, {
    hidePantry: true,
    listUnitSystem: 'us',
    weekStart: startOfWeekISO(todayISO()),
  })

  const allRecipes = useMemo(() => [...data.seedRecipes, ...userRecipes], [data, userRecipes])
  const recipesById = useMemo(
    () => Object.fromEntries(allRecipes.map(r => [r.id, r])),
    [allRecipes]
  )

  const getOptions = useCallback(
    recipe => {
      if (!recipe) return { ...defaultOptions }
      if (recipe.source === 'user') return { ...defaultOptions, ...(recipe.options || {}) }
      return { ...defaultOptions, ...(optionOverrides[recipe.id] || {}) }
    },
    [optionOverrides]
  )

  const setRecipeOption = useCallback(
    (recipeId, key, value) => {
      const recipe = recipesById[recipeId]
      if (!recipe) return
      if (recipe.source === 'user') {
        setUserRecipes(prev =>
          prev.map(r =>
            r.id === recipeId
              ? { ...r, options: { ...defaultOptions, ...(r.options || {}), [key]: value } }
              : r
          )
        )
      } else {
        setOptionOverrides(prev => ({
          ...prev,
          [recipeId]: { ...defaultOptions, ...(prev[recipeId] || {}), [key]: value },
        }))
      }
    },
    [recipesById, setUserRecipes, setOptionOverrides]
  )

  const addUserRecipe = useCallback(
    recipe => {
      setUserRecipes(prev => [...prev, recipe])
    },
    [setUserRecipes]
  )

  const assignSlot = useCallback(
    (date, slot, recipeId, serveTime) => {
      setMealPlan(prev => ({
        ...prev,
        [slotKey(date, slot)]: {
          recipeId,
          serveTime: serveTime || null,
          addedAt: new Date().toISOString(),
        },
      }))
    },
    [setMealPlan]
  )

  const unassignSlot = useCallback(
    (date, slot) => {
      setMealPlan(prev => {
        const next = { ...prev }
        delete next[slotKey(date, slot)]
        return next
      })
    },
    [setMealPlan]
  )

  const removePlannedEntry = useCallback(
    key => {
      setMealPlan(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    },
    [setMealPlan]
  )

  const setWeekStart = useCallback(
    iso => {
      setPrefs(prev => ({ ...prev, weekStart: iso }))
    },
    [setPrefs]
  )

  const setPref = useCallback(
    (key, value) => {
      setPrefs(prev => ({ ...prev, [key]: value }))
    },
    [setPrefs]
  )

  const toggleChecked = useCallback(
    key => {
      setChecked(prev => {
        const next = { ...prev }
        if (next[key]) delete next[key]
        else next[key] = true
        return next
      })
    },
    [setChecked]
  )

  const clearChecked = useCallback(() => setChecked({}), [setChecked])

  const togglePantry = useCallback(
    key => {
      setPantry(prev => {
        const next = { ...prev }
        if (next[key]) delete next[key]
        else next[key] = true
        return next
      })
    },
    [setPantry]
  )

  const shopping = useMemo(
    () =>
      buildShoppingList({
        weekStart: prefs.weekStart,
        mealPlan,
        recipesById,
        getOptions,
        ingredientById: data.lookups.ingredientById,
        pantry,
        hidePantry: prefs.hidePantry,
        unitSystem: prefs.listUnitSystem,
      }),
    [prefs.weekStart, prefs.hidePantry, prefs.listUnitSystem, mealPlan, recipesById, getOptions, data, pantry]
  )

  const plannedCountWeek = useMemo(() => {
    const dates = new Set(weekDates(prefs.weekStart))
    return Object.keys(mealPlan).filter(k => dates.has(k.split('|')[0])).length
  }, [mealPlan, prefs.weekStart])

  const value = useMemo(
    () => ({
      data,
      userRecipes,
      allRecipes,
      recipesById,
      getOptions,
      setRecipeOption,
      addUserRecipe,
      mealPlan,
      assignSlot,
      unassignSlot,
      removePlannedEntry,
      checked,
      toggleChecked,
      clearChecked,
      pantry,
      togglePantry,
      prefs,
      setPref,
      setWeekStart,
      shopping,
      plannedCountWeek,
    }),
    [
      data,
      userRecipes,
      allRecipes,
      recipesById,
      getOptions,
      setRecipeOption,
      addUserRecipe,
      mealPlan,
      assignSlot,
      unassignSlot,
      removePlannedEntry,
      checked,
      toggleChecked,
      clearChecked,
      pantry,
      togglePantry,
      prefs,
      setPref,
      setWeekStart,
      shopping,
      plannedCountWeek,
    ]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within MealStoreProvider')
  return ctx
}
