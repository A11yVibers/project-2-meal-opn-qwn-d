import { normalizeUnit, canonicalUnit, unitDimension, toBase, displayFromBase, roundQty, unitMatchesSystem } from './units.js'
import { weekDates } from './dates.js'
import { PLANNER_SLOTS, SHOPPING_CATEGORY_ORDER } from './recipes.js'

export function ingredientKeyOf(item) {
  return item.ingredientId ? item.ingredientId : `name:${(item.name || '').trim().toLowerCase()}`
}

function buildDisplayLines(agg, unitSystem) {
  const lines = [...agg.lines.values()]
  const out = []
  const convertible = lines.filter(l => l.dim && l.hasQty)
  const others = lines.filter(l => !(l.dim && l.hasQty))

  if (convertible.length > 0) {
    const dims = [...new Set(convertible.map(l => l.dim))]
    for (const dim of dims) {
      const group = convertible.filter(l => l.dim === dim)
      if (group.length === 1 && unitMatchesSystem(group[0].unit, unitSystem)) {
        out.push({ qty: roundQty(group[0].qtySum), unit: canonicalUnit(group[0].unit) })
      } else {
        const base = group.reduce((s, l) => s + l.base, 0)
        const d = displayFromBase(dim, base, unitSystem)
        out.push({ qty: roundQty(d.qty), unit: d.unit })
      }
    }
  }
  for (const l of others) {
    if (!l.hasQty) {
      out.push({ qty: null, unit: l.unit ? canonicalUnit(l.unit) : 'as needed' })
    } else {
      out.push({ qty: roundQty(l.qtySum), unit: l.unit ? canonicalUnit(l.unit) : '' })
    }
  }
  return out
}

export function buildShoppingList({
  weekStart,
  mealPlan,
  recipesById,
  getOptions,
  ingredientById,
  pantry,
  hidePantry,
  unitSystem,
}) {
  const dateSet = new Set(weekDates(weekStart))
  const entries = []
  for (const [key, entry] of Object.entries(mealPlan || {})) {
    const [date, slot] = key.split('|')
    if (!dateSet.has(date)) continue
    entries.push({ date, slot, ...entry })
  }
  entries.sort((a, b) =>
    a.date === b.date ? PLANNER_SLOTS.indexOf(a.slot) - PLANNER_SLOTS.indexOf(b.slot) : a.date < b.date ? -1 : 1
  )

  const aggregates = new Map()
  const usedRecipes = []
  const skippedRecipes = []
  const seen = new Set()
  const seenSkipped = new Set()

  for (const entry of entries) {
    const recipe = recipesById[entry.recipeId]
    if (!recipe) continue
    if (!seen.has(recipe.id)) {
      seen.add(recipe.id)
      usedRecipes.push({ id: recipe.id, title: recipe.title })
    }
    const options = getOptions(recipe)
    if (!options.includeInShoppingList) {
      if (!seenSkipped.has(recipe.id)) {
        seenSkipped.add(recipe.id)
        skippedRecipes.push({ id: recipe.id, title: recipe.title })
      }
      continue
    }
    for (const section of recipe.sections || []) {
      for (const item of section.items || []) {
        if (!item.name || !item.name.trim()) continue
        const iKey = ingredientKeyOf(item)
        if (!aggregates.has(iKey)) {
          const known = item.ingredientId ? ingredientById[item.ingredientId] : null
          aggregates.set(iKey, {
            ingredientKey: iKey,
            name: known ? known.name : item.name.trim(),
            category: known ? known.category || 'Other' : 'Other',
            lines: new Map(),
            recipes: new Map(),
            notes: new Set(),
            optional: true,
          })
        }
        const agg = aggregates.get(iKey)
        agg.optional = agg.optional && !!item.optional
        if (item.notes) agg.notes.add(item.notes)
        agg.recipes.set(recipe.id, recipe.title)

        const unit = (item.unit || '').trim()
        const uKey = normalizeUnit(unit)
        const qty = item.quantity == null || isNaN(Number(item.quantity)) ? null : Number(item.quantity)
        if (!agg.lines.has(uKey)) {
          agg.lines.set(uKey, { unit, dim: unitDimension(uKey), base: 0, qtySum: 0, hasQty: false })
        }
        const line = agg.lines.get(uKey)
        if (qty != null) {
          line.hasQty = true
          line.qtySum += qty
          if (line.dim) {
            const base = toBase(uKey, qty)
            if (base != null) line.base += base
          }
        }
      }
    }
  }

  const all = []
  for (const agg of aggregates.values()) {
    const display = buildDisplayLines(agg, unitSystem)
    const inPantry = !!pantry[agg.ingredientKey]
    all.push({
      key: `${agg.ingredientKey}::${display.map(d => normalizeUnit(d.unit) || '-').join('+')}`,
      ingredientKey: agg.ingredientKey,
      name: agg.name,
      category: agg.category,
      display,
      notes: [...agg.notes],
      optional: agg.optional,
      recipes: [...agg.recipes.values()],
      inPantry,
    })
  }

  const isVisible = it => !it.inPantry || !hidePantry
  const categories = []
  for (const catName of SHOPPING_CATEGORY_ORDER) {
    const items = all.filter(it => it.category === catName && isVisible(it))
    if (items.length > 0) categories.push({ name: catName, items })
  }
  const knownNames = new Set(SHOPPING_CATEGORY_ORDER)
  const leftover = all.filter(it => !knownNames.has(it.category) && isVisible(it))
  if (leftover.length > 0) categories.push({ name: 'Other', items: leftover })

  const pantryItems = all.filter(it => it.inPantry)
  const visibleItems = all.filter(isVisible)

  return {
    weekStart,
    categories,
    pantryItems,
    visibleItems,
    entryCount: entries.length,
    usedRecipes,
    skippedRecipes,
    totalItems: categories.reduce((s, c) => s + c.items.length, 0),
  }
}
