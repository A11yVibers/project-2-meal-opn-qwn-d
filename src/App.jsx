import { useCallback, useMemo, useState } from 'react'
import Catalog from './components/Catalog.jsx'
import RecipeDetail from './components/RecipeDetail.jsx'
import RecipeForm from './components/RecipeForm.jsx'
import Planner from './components/Planner.jsx'
import ShoppingList from './components/ShoppingList.jsx'
import { seedRecipes, PLAN_SLOTS } from './lib/data.js'
import { startOfWeekISO, todayISO, weekDates } from './lib/dates.js'
import { buildShoppingList } from './lib/shopping.js'
import { usePersistentState, STORAGE_KEYS, DEFAULT_OPTIONS } from './store.js'

const NAV_ITEMS = [
  { key: 'catalog', label: 'Recipes' },
  { key: 'planner', label: 'Planner' },
  { key: 'shopping', label: 'Shopping list' },
]

export default function App() {
  const [view, setView] = useState({ name: 'catalog' })
  const [userRecipes, setUserRecipes] = usePersistentState(STORAGE_KEYS.userRecipes, [])
  const [optionsById, setOptionsById] = usePersistentState(STORAGE_KEYS.recipeOptions, {})
  const [plan, setPlan] = usePersistentState(STORAGE_KEYS.plan, {})
  const [shoppingState, setShoppingState] = usePersistentState(STORAGE_KEYS.shopping, {
    checked: {},
    pantry: [],
    excludePantry: true,
  })
  const [weekStart, setWeekStart] = useState(() => startOfWeekISO(todayISO()))

  const recipes = useMemo(() => [...seedRecipes, ...userRecipes], [userRecipes])
  const recipesById = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes])

  const getOptions = useCallback(
    (id) => ({ ...DEFAULT_OPTIONS, ...optionsById[id] }),
    [optionsById],
  )

  const setOptionsFor = useCallback((id, options) => {
    setOptionsById((prev) => ({ ...prev, [id]: options }))
  }, [setOptionsById])

  const assignSlot = useCallback((dateISO, slotKey, recipeId, extra = {}) => {
    setPlan((prev) => ({
      ...prev,
      [dateISO]: {
        ...(prev[dateISO] || {}),
        [slotKey]: {
          recipeId,
          addedAt: Date.now(),
          serveTime: extra.serveTime || null,
          cookDateTime: extra.cookDateTime || null,
        },
      },
    }))
  }, [setPlan])

  const unassignSlot = useCallback((dateISO, slotKey) => {
    setPlan((prev) => {
      const day = { ...(prev[dateISO] || {}) }
      delete day[slotKey]
      return { ...prev, [dateISO]: day }
    })
  }, [setPlan])

  const shoppingList = useMemo(
    () => buildShoppingList({
      weekStart,
      plan,
      recipesById,
      getOptions,
      pantry: shoppingState.pantry,
      excludePantry: shoppingState.excludePantry,
    }),
    [weekStart, plan, recipesById, getOptions, shoppingState.pantry, shoppingState.excludePantry],
  )

  const openShoppingCount = useMemo(() => {
    let count = 0
    for (const group of shoppingList.groups) {
      for (const item of group.items) {
        if (!shoppingState.checked[`${weekStart}|${item.key}`]) count++
      }
    }
    return count
  }, [shoppingList, shoppingState.checked, weekStart])

  const plannedThisWeek = useMemo(() => {
    let count = 0
    for (const d of weekDates(weekStart)) {
      for (const slot of PLAN_SLOTS) {
        if (plan[d]?.[slot.key]) count++
      }
    }
    return count
  }, [plan, weekStart])

  function handleSaveRecipe(recipe, options, planTarget) {
    setUserRecipes((prev) => [...prev, recipe])
    setOptionsById((prev) => ({ ...prev, [recipe.id]: options }))
    if (planTarget) {
      assignSlot(planTarget.dateISO, planTarget.slot, recipe.id, planTarget)
    }
    setView({ name: 'detail', recipeId: recipe.id })
    window.scrollTo({ top: 0 })
  }

  function navigate(next) {
    setView(next)
    window.scrollTo({ top: 0 })
  }

  const detailRecipe = view.name === 'detail' ? recipesById.get(view.recipeId) : null

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <button type="button" className="brand" onClick={() => navigate({ name: 'catalog' })}>
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-name">Mealboard</span>
          </button>
          <nav className="main-nav" aria-label="Main">
            {NAV_ITEMS.map((item) => {
              const active =
                (item.key === 'catalog' && (view.name === 'catalog' || view.name === 'detail' || view.name === 'new')) ||
                (item.key === 'planner' && view.name === 'planner') ||
                (item.key === 'shopping' && view.name === 'shopping')
              return (
                <button
                  type="button"
                  key={item.key}
                  className={`nav-btn${active ? ' nav-on' : ''}`}
                  onClick={() => navigate({ name: item.key })}
                >
                  {item.label}
                  {item.key === 'planner' && plannedThisWeek > 0 && <span className="nav-badge">{plannedThisWeek}</span>}
                  {item.key === 'shopping' && openShoppingCount > 0 && <span className="nav-badge">{openShoppingCount}</span>}
                </button>
              )
            })}
          </nav>
          <button type="button" className="btn btn-primary header-cta" onClick={() => navigate({ name: 'new' })}>+ New recipe</button>
        </div>
      </header>

      <main className="app-main">
        {view.name === 'catalog' && (
          <Catalog
            recipes={recipes}
            onOpen={(id) => navigate({ name: 'detail', recipeId: id })}
            onNew={() => navigate({ name: 'new' })}
          />
        )}

        {view.name === 'detail' && detailRecipe && (
          <RecipeDetail
            recipe={detailRecipe}
            options={getOptions(detailRecipe.id)}
            onOptionsChange={(opts) => setOptionsFor(detailRecipe.id, opts)}
            onBack={() => navigate({ name: 'catalog' })}
            plan={plan}
            onAssign={assignSlot}
            onGoPlanner={() => navigate({ name: 'planner' })}
          />
        )}

        {view.name === 'detail' && !detailRecipe && (
          <div className="view empty-state">
            <p>That recipe could not be found.</p>
            <button type="button" className="btn btn-primary" onClick={() => navigate({ name: 'catalog' })}>Back to catalog</button>
          </div>
        )}

        {view.name === 'new' && (
          <RecipeForm
            onCancel={() => navigate({ name: 'catalog' })}
            onSave={handleSaveRecipe}
          />
        )}

        {view.name === 'planner' && (
          <Planner
            weekStart={weekStart}
            setWeekStart={setWeekStart}
            plan={plan}
            recipesById={recipesById}
            recipes={recipes}
            onAssign={assignSlot}
            onUnassign={unassignSlot}
            onOpenRecipe={(id) => navigate({ name: 'detail', recipeId: id })}
          />
        )}

        {view.name === 'shopping' && (
          <ShoppingList
            weekStart={weekStart}
            setWeekStart={setWeekStart}
            list={shoppingList}
            shoppingState={shoppingState}
            setShoppingState={setShoppingState}
            onGoPlanner={() => navigate({ name: 'planner' })}
          />
        )}
      </main>

      <footer className="app-footer">
        <span>Recipes seeded from project-assets CSVs · your recipes, plan, and list are saved locally in this browser</span>
      </footer>
    </div>
  )
}
