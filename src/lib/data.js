import cuisinesCsv from '../../project-assets/cuisines.csv?raw'
import dietaryTagsCsv from '../../project-assets/dietary_tags.csv?raw'
import ingredientsCsv from '../../project-assets/ingredients.csv?raw'
import mealTypesCsv from '../../project-assets/meal_types.csv?raw'
import recipeCategoriesCsv from '../../project-assets/recipe_categories.csv?raw'
import recipeIngredientsCsv from '../../project-assets/recipe_ingredients.csv?raw'
import recipeStepsCsv from '../../project-assets/recipe_steps.csv?raw'
import recipesCsv from '../../project-assets/recipes.csv?raw'
import unitsCsv from '../../project-assets/units.csv?raw'
import { csvToObjects } from './csvParse.js'
import { buildLookups, buildSeedRecipes } from './seed.js'

function buildProjectData() {
  const lookups = buildLookups({
    cuisines: csvToObjects(cuisinesCsv),
    dietaryTags: csvToObjects(dietaryTagsCsv),
    mealTypes: csvToObjects(mealTypesCsv),
    recipeCategories: csvToObjects(recipeCategoriesCsv),
    ingredients: csvToObjects(ingredientsCsv),
    units: csvToObjects(unitsCsv),
  })
  const seedRecipes = buildSeedRecipes(
    csvToObjects(recipesCsv),
    csvToObjects(recipeIngredientsCsv),
    csvToObjects(recipeStepsCsv)
  )
  return Object.freeze({ lookups, seedRecipes })
}

export const PROJECT_DATA = buildProjectData()
