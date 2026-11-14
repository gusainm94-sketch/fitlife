import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateNutrition,
  CUSTOM_INGREDIENTS_STORAGE_KEY,
  findIngredient,
  FOOD_CATEGORIES,
  INGREDIENTS,
  NUTRITION_RECIPES_STORAGE_KEY,
  normalizeCustomIngredients,
  normalizeRecipes,
} from './ingredients.js'
import { readLocalJson, SESSION_STORAGE_KEY, writeLocalJson } from '../utils/localStorage.js'

function createStorage(values = {}) {
  const entries = new Map(Object.entries(values))
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
  }
}

test('ingredient catalogue contains sourced food references and distinguishes raw from cooked entries', () => {
  assert.ok(INGREDIENTS.length >= 45)
  assert.deepEqual(new Set(INGREDIENTS.map(({ category }) => category)), new Set(FOOD_CATEGORIES))
  assert.notDeepEqual(
    findIngredient('rice-white-raw').nutrientsPer100g,
    findIngredient('rice-white-cooked').nutrientsPer100g,
  )
  for (const ingredient of INGREDIENTS.filter(({ nutrientsPer100g }) => nutrientsPer100g)) {
    assert.ok(ingredient.source.recordId)
    assert.ok(ingredient.source.recordName)
    assert.equal(ingredient.nutrientsPer100g.caloriesKcal >= 0, true)
  }
  assert.equal(findIngredient('poha').nutrientsPer100g, null)
  assert.equal(findIngredient('paneer').nutrientsPer100g, null)
})

test('household measures and liquid volume convert using ingredient-specific weights', () => {
  const cupOfCookedRice = calculateNutrition([
    { ingredientId: 'rice-white-cooked', quantity: 1, unit: 'cup' },
  ])
  const cupOfCookedDal = calculateNutrition([
    { ingredientId: 'dal-lentils-cooked', quantity: 1, unit: 'cup' },
  ])
  const milk = calculateNutrition([
    { ingredientId: 'milk-whole', quantity: 240, unit: 'ml' },
  ])

  assert.equal(cupOfCookedRice.totalWeightG, 158)
  assert.equal(cupOfCookedRice.totalNutrition.caloriesKcal, 205.4)
  assert.equal(cupOfCookedDal.totalWeightG, 198)
  assert.equal(milk.totalWeightG, 244)
  assert.equal(milk.totalNutrition.caloriesKcal, 148.8)
  assert.equal(calculateNutrition([{ ingredientId: 'potato-raw', quantity: 1, unit: 'piece' }]).totalWeightG, 213)
})

test('multiple ingredients total their individual estimates and unavailable data remains unknown', () => {
  const nutrition = calculateNutrition([
    { ingredientId: 'egg-raw', quantity: 2, unit: 'piece' },
    { ingredientId: 'tomato-raw', quantity: 100, unit: 'g' },
  ])
  const incomplete = calculateNutrition([
    { ingredientId: 'rice-white-cooked', quantity: 100, unit: 'g' },
    { ingredientId: 'paneer', quantity: 100, unit: 'g' },
  ])

  assert.equal(nutrition.totalWeightG, 200)
  assert.equal(nutrition.totalNutrition.caloriesKcal, 161)
  assert.equal(nutrition.rows[0].nutrients.caloriesKcal, 143)
  assert.equal(incomplete.rows[1].nutrients.caloriesKcal, null)
  assert.equal(incomplete.totalNutrition.caloriesKcal, null)
  assert.equal(incomplete.totalNutrition.fiberG, null)
})

test('custom ingredients and saved recipes are validated and isolated by account', () => {
  const custom = {
    id: 'custom:one',
    name: 'Homemade tofu',
    category: 'Protein',
    nutrientsPer100g: { caloriesKcal: 90, proteinG: 10, carbsG: 2, fatG: 5, fiberG: null },
    unitGrams: { g: 1 },
  }
  const recipe = {
    id: 'recipe:one',
    name: 'Tofu bowl',
    ingredients: [{ ingredientId: custom.id, quantity: 150, unit: 'g' }],
  }
  assert.equal(normalizeCustomIngredients([custom, custom]).length, 1)
  assert.equal(normalizeCustomIngredients([{ ...custom, nutrientsPer100g: { caloriesKcal: -1 } }]).length, 0)
  assert.deepEqual(normalizeRecipes([recipe]), [recipe])
  assert.equal(normalizeRecipes([{ ...recipe, ingredients: [] }]).length, 0)
  assert.equal(calculateNutrition(recipe.ingredients, [custom]).totalNutrition.caloriesKcal, 135)

  const previousWindow = globalThis.window
  const storage = createStorage({ [SESSION_STORAGE_KEY]: JSON.stringify({ userId: 'account-a' }) })
  globalThis.window = { localStorage: storage }
  try {
    writeLocalJson(CUSTOM_INGREDIENTS_STORAGE_KEY, [custom])
    writeLocalJson(NUTRITION_RECIPES_STORAGE_KEY, [recipe])
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ userId: 'account-b' }))
    assert.deepEqual(readLocalJson(CUSTOM_INGREDIENTS_STORAGE_KEY, []), [])
    assert.deepEqual(readLocalJson(NUTRITION_RECIPES_STORAGE_KEY, []), [])
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ userId: 'account-a' }))
    assert.deepEqual(readLocalJson(CUSTOM_INGREDIENTS_STORAGE_KEY, []), [custom])
    assert.deepEqual(readLocalJson(NUTRITION_RECIPES_STORAGE_KEY, []), [recipe])
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})
