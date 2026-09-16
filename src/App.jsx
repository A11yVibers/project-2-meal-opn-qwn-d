import { useEffect, useMemo, useState } from 'react'
import { SEED_RECIPES } from './csv.js'
import { usePersistentState } from './storage.js'
import { startOfWeekISO, todayISO, weekDatesISO } from './format.js'
import { buildShoppingItems } from './shopping.js'
import { optionsFor } from './components/OptionsMenu.jsx'
import RecipeCatalog from './components/RecipeCatalog.jsx'
import RecipeDetail from './components/RecipeDetail.jsx'
import RecipeForm from './components/RecipeForm.jsx'
import Planner from './components/Planner.jsx'
import ShoppingList from './components/ShoppingList.jsx'

export default function App() {
  const [userRecipes, setUserRecipes] = usePersistentState('userRecipes', [])
  const [mealPlan, setMealPlan] = usePersistentState('mealPlan', {})
  const [checked, setChecked] = usePersistentState('shoppingChecked', [])
  const [pantry, setPantry] = usePersistentState('pantry', [])
  const [allOptions, setAllOptions] = usePersistentState('recipeOptions', {})

  const [weekStart, setWeekStart] = useState(() => startOfWeekISO(todayISO()))
  const [tab, setTab] = useState('recipes')
  const [page, setPage] = useState({ name: 'catalog' })
  const [toast, setToast] = useState(null)

  const allRecipes = useMemo(() => [...SEED_RECIPES, ...userRecipes], [userRecipes])
  const recipeById = useMemo(
    () => Object.fromEntries(allRecipes.map((r) => [r.id, r])),
    [allRecipes],
  )

  const shoppingItems = useMemo(
    () => buildShoppingItems({ mealPlan, weekStart, recipeById, allOptions }),
    [mealPlan, weekStart, recipeById, allOptions],
  )

  const plannedThisWeek = useMemo(() => {
    const days = weekDatesISO(weekStart)
    return days.reduce((n, d) => n + Object.keys(mealPlan[d] || {}).length, 0)
  }, [mealPlan, weekStart])

  const showToast = (message) => setToast({ id: Date.now(), message })

  const assignRecipe = (date, slot, recipeId, time = null) => {
    setMealPlan((prev) => ({
      ...prev,
      [date]: { ...(prev[date] || {}), [slot]: time ? { recipeId, time } : { recipeId } },
    }))
  }

  const removeAssignment = (date, slot) => {
    setMealPlan((prev) => {
      const day = { ...(prev[date] || {}) }
      delete day[slot]
      const next = { ...prev }
      if (Object.keys(day).length === 0) delete next[date]
      else next[date] = day
      return next
    })
  }

  const plannedEntriesFor = (recipeId) => {
    const entries = []
    for (const date of Object.keys(mealPlan).sort()) {
      for (const [slot, entry] of Object.entries(mealPlan[date] || {})) {
        if (entry?.recipeId === recipeId) entries.push({ date, slot, time: entry.time || null })
      }
    }
    return entries
  }

  const handleSaveRecipe = (recipe, { options, addToPlan, plan }) => {
    setUserRecipes((prev) => [...prev, recipe])
    setAllOptions((prev) => ({ ...prev, [recipe.id]: options }))
    if (addToPlan && plan?.date) {
      assignRecipe(plan.date, plan.slot, recipe.id, plan.time)
      setWeekStart(startOfWeekISO(plan.date))
    }
    setPage({ name: 'catalog' })
    setTab('recipes')
    showToast(
      `“${recipe.title}” added to your catalog${addToPlan && plan?.date ? ' and to the meal plan' : ''}.`,
    )
  }

  const openRecipe = (recipeId) => {
    setPage({ name: 'detail', recipeId })
    setTab('recipes')
    window.scrollTo({ top: 0 })
  }

  const detailRecipe = page.name === 'detail' ? recipeById[page.recipeId] : null

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <span className="logo" aria-hidden="true" />
          <div>
            <h1>Meal Planner</h1>
            <p className="subtle">Plan your week, cook what you love, shop in one pass</p>
          </div>
        </div>
        <nav className="tabs" aria-label="Main navigation">
          <button
            type="button"
            className={`tab ${tab === 'recipes' ? 'is-active' : ''}`}
            onClick={() => { setTab('recipes'); setPage({ name: 'catalog' }); window.scrollTo({ top: 0 }) }}
          >
            Recipes
          </button>
          <button type="button" className={`tab ${tab === 'planner' ? 'is-active' : ''}`} onClick={() => setTab('planner')}>
            Meal planner
            {plannedThisWeek > 0 ? <span className="tab-badge">{plannedThisWeek}</span> : null}
          </button>
          <button type="button" className={`tab ${tab === 'shopping' ? 'is-active' : ''}`} onClick={() => setTab('shopping')}>
            Shopping list
            {shoppingItems.length > 0 ? <span className="tab-badge">{shoppingItems.length}</span> : null}
          </button>
        </nav>
      </header>

      <main className="app-main">
        {tab === 'recipes' && page.name === 'catalog' ? (
          <RecipeCatalog
            recipes={allRecipes}
            onOpen={openRecipe}
            onAdd={() => { setPage({ name: 'add' }); window.scrollTo({ top: 0 }) }}
          />
        ) : null}

        {tab === 'recipes' && page.name === 'add' ? (
          <RecipeForm
            initialWeekStart={weekStart}
            onCancel={() => setPage({ name: 'catalog' })}
            onSave={handleSaveRecipe}
          />
        ) : null}

        {tab === 'recipes' && page.name === 'detail' ? (
          detailRecipe ? (
            <RecipeDetail
              key={detailRecipe.id}
              recipe={detailRecipe}
              options={optionsFor(allOptions, detailRecipe.id)}
              onOptionsChange={(next) => setAllOptions((prev) => ({ ...prev, [detailRecipe.id]: next }))}
              onBack={() => setPage({ name: 'catalog' })}
              onAssign={(date, slot, recipeId, time) => {
                assignRecipe(date, slot, recipeId, time)
                showToast(`Planned for ${slot}${time ? ` at ${time}` : ''} — see the meal planner.`)
              }}
              plannedEntries={plannedEntriesFor(detailRecipe.id)}
              initialWeekStart={weekStart}
            />
          ) : (
            <div className="empty-state">
              <p>Recipe not found.</p>
              <button type="button" className="btn btn-outline" onClick={() => setPage({ name: 'catalog' })}>Back to catalog</button>
            </div>
          )
        ) : null}

        {tab === 'planner' ? (
          <Planner
            recipes={allRecipes}
            recipeById={recipeById}
            mealPlan={mealPlan}
            weekStart={weekStart}
            onWeekStart={setWeekStart}
            onAssign={assignRecipe}
            onRemove={removeAssignment}
            onOpenRecipe={openRecipe}
          />
        ) : null}

        {tab === 'shopping' ? (
          <ShoppingList
            recipeById={recipeById}
            mealPlan={mealPlan}
            weekStart={weekStart}
            onWeekStart={setWeekStart}
            allOptions={allOptions}
            checked={checked}
            setChecked={setChecked}
            pantry={pantry}
            setPantry={setPantry}
          />
        ) : null}
      </main>

      <footer className="app-footer">
        <p className="subtle">Recipes, plans, and shopping state are saved locally in your browser.</p>
      </footer>

      {toast ? <Toast key={toast.id} message={toast.message} onDone={() => setToast(null)} /> : null}
    </div>
  )
}

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 4000)
    return () => window.clearTimeout(t)
  }, [message, onDone])
  return (
    <div className="toast" role="status">
      <span>{message}</span>
      <button type="button" className="btn btn-icon btn-sm" aria-label="Dismiss" onClick={onDone}>✕</button>
    </div>
  )
}
