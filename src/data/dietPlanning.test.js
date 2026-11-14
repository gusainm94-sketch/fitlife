import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateDietTotals,
  isMealAllowed,
  normalizeDietCharts,
  normalizeDietPreferences,
  normalizeDietPrices,
  prioritizeMealsForGoal,
  splitFoodTerms,
} from './dietPlanning.js'

test('diet preferences keep only valid values and retain profile-owned goal and diet choice', () => {
  const preferences = normalizeDietPreferences({
    selectedFoods: ['Rice', 'Homemade tofu', 'Rice'],
    customFoods: ['Homemade tofu'],
    dailyBudget: '350',
    mealsPerDay: 4,
    mealTimings: { breakfast: '07:15', lunch: 'bad' },
    activityLevel: 'Moderate',
  }, { goal: 'General Fitness', dietPreference: 'Vegan' })

  assert.deepEqual(preferences.selectedFoods, ['Rice', 'Homemade tofu'])
  assert.equal(preferences.dailyBudget, 350)
  assert.equal(preferences.mealTimings.breakfast, '07:15')
  assert.equal(preferences.mealTimings.lunch, '13:00')
  assert.equal(preferences.fitnessGoal, 'General Fitness')
  assert.equal(preferences.dietPreference, 'Vegan')
})

test('diet estimates leave incomplete nutrient totals unavailable and normalize user prices', () => {
  const meals = [
    { nutrition: { caloriesKcal: 200, proteinG: 10, carbsG: 30, fatG: 5 } },
    { nutrition: { caloriesKcal: 100, proteinG: null, carbsG: 20, fatG: 2 } },
  ]

  assert.deepEqual(calculateDietTotals(meals), {
    caloriesKcal: 300,
    proteinG: null,
    carbsG: 50,
    fatG: 7,
  })
  assert.deepEqual(normalizeDietPrices({ 'recipe:a': 45, bad: -1, invalid: '30' }), { 'recipe:a': 45 })
})

test('saved charts reject malformed meal records without altering valid history', () => {
  const chart = {
    id: 'chart-1',
    name: 'Weekday plan',
    savedAt: '2026-11-14T00:00:00.000Z',
    meals: [{
      id: 'meal-1',
      slot: 'breakfast',
      foodId: 'recipe:1',
      name: 'Oats bowl',
      quantity: 1,
      nutrition: { caloriesKcal: 250, proteinG: 12, carbsG: 38, fatG: 6 },
      estimatedCost: null,
    }],
  }

  assert.deepEqual(normalizeDietCharts([chart, { ...chart, id: 'invalid', meals: [{ ...chart.meals[0], quantity: 0 }] }]), [chart])
  assert.deepEqual(splitFoodTerms('  peanuts, dairy\nwheat; peanuts '), ['peanuts', 'dairy', 'wheat'])
})

test('meal safety filters avoid substring false positives and exclude declared allergens', () => {
  const recipe = { id: 'eggplant-recipe', ingredients: [{ ingredientId: 'eggplant-raw', quantity: 100, unit: 'g' }] }
  const veganMeal = { name: 'Eggplant bowl', description: 'With vegetables', recipeId: recipe.id, type: 'veg' }
  const preferences = { dietPreference: 'Vegan', allergies: '', restrictions: '', dislikes: '' }

  assert.equal(isMealAllowed(veganMeal, preferences, [recipe], []), true)
  assert.equal(isMealAllowed(
    { ...veganMeal, description: 'Includes peanuts' },
    { ...preferences, allergies: 'peanuts' },
    [recipe],
    [],
  ), false)
  assert.equal(isMealAllowed(
    { ...veganMeal, type: 'non-veg' },
    preferences,
    [recipe],
    [],
  ), false)
})

test('goal-aware ordering uses available sample calories without creating a calorie target', () => {
  const meals = [
    { name: 'Higher estimate', calories: 500, type: 'veg' },
    { name: 'Unavailable estimate', calories: null, type: 'veg' },
    { name: 'Lower estimate', calories: 200, type: 'veg' },
  ]

  assert.deepEqual(prioritizeMealsForGoal(meals, 'Weight Loss', [], []), [meals[2], meals[0], meals[1]])
  assert.deepEqual(prioritizeMealsForGoal(meals, 'General Fitness', [], []), meals)
})
