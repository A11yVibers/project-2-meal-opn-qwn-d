function splitIds(s) {
  return (s || '').split(',').map(x => x.trim()).filter(Boolean)
}

function num(v, fallback = 0) {
  const n = Number(v)
  return isNaN(n) ? fallback : n
}

export function buildLookups(rows) {
  const cuisines = rows.cuisines.map(r => ({ id: r.cuisine_id, name: r.cuisine_name }))
  const dietaryTags = rows.dietaryTags.map(r => ({ id: r.dietary_tag_id, name: r.dietary_tag_name }))
  const mealTypes = rows.mealTypes.map(r => ({ id: r.meal_type_id, name: r.meal_type_name }))
  const categories = rows.recipeCategories.map(r => ({ id: r.category_id, name: r.category_name }))
  const ingredients = rows.ingredients.map(r => ({
    id: r.ingredient_id,
    name: r.ingredient_name,
    category: r.shopping_category || 'Other',
  }))
  const units = rows.units.map(r => r.unit_name).filter(Boolean)

  const byId = arr => Object.fromEntries(arr.map(x => [x.id, x]))
  return {
    cuisines,
    dietaryTags,
    mealTypes,
    categories,
    ingredients,
    units,
    cuisineById: byId(cuisines),
    tagById: byId(dietaryTags),
    mealTypeById: byId(mealTypes),
    categoryById: byId(categories),
    ingredientById: byId(ingredients),
  }
}

export function buildSeedRecipes(recipeRows, ingredientRows, stepRows) {
  return recipeRows.map(r => {
    const ings = ingredientRows
      .filter(x => x.recipe_id === r.recipe_id)
      .sort((a, b) => num(a.display_order) - num(b.display_order))
    const sections = []
    const byName = {}
    for (const x of ings) {
      const name = x.section_name || 'Main'
      if (!byName[name]) {
        byName[name] = { name, items: [] }
        sections.push(byName[name])
      }
      byName[name].items.push({
        ingredientId: x.ingredient_id || null,
        name: x.ingredient_name,
        quantity: x.quantity === '' ? null : num(x.quantity, null),
        unit: x.unit || '',
        notes: x.notes || '',
        optional: String(x.optional).toLowerCase() === 'true',
      })
    }
    const steps = stepRows
      .filter(x => x.recipe_id === r.recipe_id)
      .sort((a, b) => num(a.step_number) - num(b.step_number))
      .map(x => ({ instruction: x.instruction, timerMinutes: num(x.timer_minutes, 0) }))

    const prep = num(r.prep_time_minutes, 0)
    const cook = num(r.cook_time_minutes, 0)
    return {
      id: r.recipe_id,
      source: 'seed',
      title: r.title,
      shortDescription: r.short_description || '',
      sourceName: r.source_name || '',
      sourceUrl: r.source_url || '',
      servings: r.servings === '' ? null : num(r.servings, null),
      prepTimeMinutes: prep,
      cookTimeMinutes: cook,
      totalTimeMinutes: r.total_time_minutes === '' ? prep + cook : num(r.total_time_minutes, prep + cook),
      cuisineId: r.cuisine_id || '',
      mealTypeId: r.meal_type_id || '',
      dietaryTagIds: splitIds(r.dietary_tag_ids),
      categoryIds: splitIds(r.category_ids),
      difficulty: r.difficulty_1_to_5 === '' ? null : num(r.difficulty_1_to_5, null),
      spiceLevel: num(r.spice_level_0_to_5, 0),
      accentColor: r.accent_color || '',
      coverImageUrl: r.cover_image_url || '',
      includeInMealSuggestions: String(r.include_in_meal_suggestions).toLowerCase() === 'true',
      sections,
      steps,
    }
  })
}
