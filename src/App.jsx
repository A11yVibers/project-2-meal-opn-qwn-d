import { useState, useMemo, useCallback, useEffect } from 'react'
import { MealStoreProvider, useStore } from './store.jsx'
import RecipeCatalog from './components/RecipeCatalog.jsx'
import RecipeDetail from './components/RecipeDetail.jsx'
import RecipeForm from './components/RecipeForm.jsx'
import Planner from './components/Planner.jsx'
import ShoppingListView from './components/ShoppingList.jsx'
import { formatDateTime } from './lib/dates.js'

function Shell() {
  const store = useStore()
  const [tab, setTab] = useState('catalog')
  const [detailRecipeId, setDetailRecipeId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    if (!banner) return undefined
    const t = setTimeout(() => setBanner(null), 8000)
    return () => clearTimeout(t)
  }, [banner])

  const openRecipe = useCallback(id => {
    setDetailRecipeId(id)
    setFormOpen(false)
    setTab('catalog')
    window.scrollTo({ top: 0 })
  }, [])

  const openForm = useCallback(() => {
    setFormOpen(true)
    setDetailRecipeId(null)
    setTab('catalog')
    window.scrollTo({ top: 0 })
  }, [])

  const goCatalog = useCallback(() => {
    setFormOpen(false)
    setDetailRecipeId(null)
    setTab('catalog')
  }, [])

  const goTab = useCallback(t => {
    setTab(t)
    if (t !== 'catalog') {
      setFormOpen(false)
      setDetailRecipeId(null)
    }
    window.scrollTo({ top: 0 })
  }, [])

  const handleSaved = useCallback(
    (recipe, planInfo) => {
      setFormOpen(false)
      setDetailRecipeId(null)
      setTab('catalog')
      const lines = [`"${recipe.title}" was added to your recipe catalog.`]
      if (planInfo) {
        lines.push(`Planned: ${planInfo.slot} \u00B7 ${formatDateTime(planInfo.date, planInfo.serveTime)}.`)
      }
      if (planInfo && recipe.options && recipe.options.includeInShoppingList) {
        lines.push('Its ingredients now appear in the shopping list for that week.')
      }
      setBanner({ text: lines.join(' ') })
      window.scrollTo({ top: 0 })
    },
    []
  )

  const shoppingStats = useMemo(() => {
    let total = 0
    let done = 0
    for (const cat of store.shopping.categories) {
      for (const item of cat.items) {
        total += 1
        if (store.checked[item.key]) done += 1
      }
    }
    return { total, done }
  }, [store.shopping, store.checked])

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="brand" onClick={() => goTab('catalog')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') goTab('catalog') }}>
            <span className="brand-mark">M</span>
            <span className="brand-name">Meal Planner</span>
          </div>
          <nav className="main-nav" aria-label="Main">
            <button type="button" className={tab === 'catalog' ? 'nav-btn active' : 'nav-btn'} onClick={() => goTab('catalog')}>
              Recipes
            </button>
            <button type="button" className={tab === 'planner' ? 'nav-btn active' : 'nav-btn'} onClick={() => goTab('planner')}>
              Planner
              {store.plannedCountWeek > 0 && <span className="nav-badge">{store.plannedCountWeek}</span>}
            </button>
            <button type="button" className={tab === 'shopping' ? 'nav-btn active' : 'nav-btn'} onClick={() => goTab('shopping')}>
              Shopping list
              {shoppingStats.total > 0 && (
                <span className="nav-badge">{shoppingStats.total - shoppingStats.done}</span>
              )}
            </button>
          </nav>
        </div>
      </header>

      <main>
        {tab === 'catalog' &&
          (formOpen ? (
            <RecipeForm onSaved={handleSaved} onCancel={goCatalog} />
          ) : detailRecipeId ? (
            <RecipeDetail recipeId={detailRecipeId} onBack={goCatalog} onGoPlanner={() => goTab('planner')} />
          ) : (
            <RecipeCatalog
              onOpenRecipe={openRecipe}
              onAddRecipe={openForm}
              banner={banner}
              onDismissBanner={() => setBanner(null)}
            />
          ))}
        {tab === 'planner' && <Planner onOpenRecipe={openRecipe} />}
        {tab === 'shopping' && <ShoppingListView onGoPlanner={() => goTab('planner')} />}
      </main>

      <footer className="app-footer">
        <span>Seed recipes and lookups load from the project CSV data.</span>
        <span>Your recipes, meal plan, and shopping-list state are saved locally in this browser.</span>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <MealStoreProvider>
      <Shell />
    </MealStoreProvider>
  )
}
