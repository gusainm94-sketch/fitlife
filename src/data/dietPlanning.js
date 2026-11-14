import { calculateNutrition } from './ingredients.js'

export const DIET_PREFERENCES_STORAGE_KEY = 'fitlife.diet-preferences.v1'
export const DIET_CHARTS_STORAGE_KEY = 'fitlife.diet-charts.v1'
export const DIET_PRICES_STORAGE_KEY = 'fitlife.diet-prices.v1'

export const COMMON_FOODS = [
  'Rice', 'Roti / atta', 'Dal', 'Paneer', 'Milk', 'Curd', 'Eggs', 'Chicken',
  'Fish', 'Soybean', 'Oats', 'Poha', 'Upma', 'Vegetables', 'Fruits', 'Nuts',
  'Rajma', 'Chickpeas', 'Potatoes', 'Other',
]

export const DIET_SLOTS = [
  { id: 'breakfast', label: 'Breakfast', defaultTime: '08:00' },
  { id: 'morning-snacks', label: 'Mid-Morning Snack', defaultTime: '10:30' },
  { id: 'lunch', label: 'Lunch', defaultTime: '13:00' },
  { id: 'evening-snacks', label: 'Evening Snack', defaultTime: '16:30' },
  { id: 'dinner', label: 'Dinner', defaultTime: '19:30' },
]

const NUTRIENTS = ['caloriesKcal', 'proteinG', 'carbsG', 'fatG']

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function cleanStringList(value, limit = 30) {
  if (!Array.isArray(value)) return []
  return [...new Set(value
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item) => item.trim().slice(0, 70)))].slice(0, limit)
}

export function normalizeDietPreferences(saved, profile = {}) {
  const value = isObject(saved) ? saved : {}
  const selectedFoods = cleanStringList(value.selectedFoods)
  const customFoods = cleanStringList(value.customFoods, 50)
  const mealTimings = isObject(value.mealTimings) ? value.mealTimings : {}
  const budget = value.dailyBudget === null || value.dailyBudget === ''
    ? null
    : Number(value.dailyBudget)

  return {
    selectedFoods: selectedFoods.filter((food) => COMMON_FOODS.includes(food) || customFoods.includes(food)),
    customFoods,
    allergies: typeof value.allergies === 'string' ? value.allergies.slice(0, 500) : '',
    restrictions: typeof value.restrictions === 'string' ? value.restrictions.slice(0, 500) : '',
    dislikes: typeof value.dislikes === 'string' ? value.dislikes.slice(0, 500) : '',
    activityLevel: ['Low', 'Light', 'Moderate', 'High'].includes(value.activityLevel) ? value.activityLevel : '',
    region: typeof value.region === 'string' ? value.region.slice(0, 60) : '',
    dailyBudget: Number.isFinite(budget) && budget >= 0 ? budget : null,
    mealsPerDay: Number.isInteger(value.mealsPerDay) && value.mealsPerDay >= 1 && value.mealsPerDay <= 8
      ? value.mealsPerDay
      : 5,
    mealTimings: Object.fromEntries(DIET_SLOTS.map(({ id, defaultTime }) => [
      id,
      /^\d{2}:\d{2}$/.test(mealTimings[id] ?? '') ? mealTimings[id] : defaultTime,
    ])),
    dietPreference: typeof profile.dietPreference === 'string' ? profile.dietPreference : '',
    fitnessGoal: typeof profile.goal === 'string' ? profile.goal : '',
  }
}

export function normalizeDietPrices(saved) {
  if (!isObject(saved)) return {}
  return Object.fromEntries(Object.entries(saved).filter(([id, price]) => (
    typeof id === 'string' && id.length > 0 && Number.isFinite(price) && price >= 0
  )))
}

export function normalizeDietCharts(saved) {
  if (!Array.isArray(saved)) return []
  const ids = new Set()
  return saved.filter((chart) => {
    if (!isObject(chart)
      || typeof chart.id !== 'string'
      || !chart.id
      || ids.has(chart.id)
      || typeof chart.name !== 'string'
      || !chart.name.trim()
      || typeof chart.savedAt !== 'string'
      || !Number.isFinite(Date.parse(chart.savedAt))
      || !Array.isArray(chart.meals)) return false

    const meals = chart.meals.filter((meal) => (
      isObject(meal)
      && typeof meal.id === 'string'
      && typeof meal.slot === 'string'
      && typeof meal.foodId === 'string'
      && typeof meal.name === 'string'
      && Number.isFinite(meal.quantity)
      && meal.quantity > 0
      && isObject(meal.nutrition)
      && NUTRIENTS.every((key) => (
        meal.nutrition[key] === null
        || (Number.isFinite(meal.nutrition[key]) && meal.nutrition[key] >= 0)
      ))
      && (meal.estimatedCost === null
        || (Number.isFinite(meal.estimatedCost) && meal.estimatedCost >= 0))
    ))
    if (meals.length !== chart.meals.length) return false
    ids.add(chart.id)
    return true
  })
}

export function calculateDietTotals(meals) {
  return Object.fromEntries(NUTRIENTS.map((key) => [
    key,
    meals.length && meals.every((meal) => Number.isFinite(meal.nutrition?.[key]))
      ? Number(meals.reduce((total, meal) => total + meal.nutrition[key], 0).toFixed(1))
      : null,
  ]))
}

export function splitFoodTerms(value) {
  return typeof value === 'string'
    ? [...new Set(value.split(/[,\n;]/).map((term) => term.trim().toLocaleLowerCase()).filter(Boolean))]
    : []
}

const ANIMAL_FOOD_WORDS = ['milk', 'curd', 'paneer', 'cheese', 'butter', 'ghee', 'egg', 'chicken', 'fish', 'meat', 'whey', 'yogurt']
const FOOD_TERM_ALIASES = {
  nut: ['nut', 'peanut', 'groundnut', 'almond', 'walnut', 'cashew', 'pistachio'],
  nuts: ['nut', 'peanut', 'groundnut', 'almond', 'walnut', 'cashew', 'pistachio'],
  peanut: ['peanut', 'groundnut'],
  peanuts: ['peanut', 'groundnut'],
  dairy: ['milk', 'curd', 'paneer', 'cheese', 'butter', 'ghee', 'whey', 'yogurt'],
  gluten: ['gluten', 'wheat', 'atta', 'roti', 'bread'],
}

function mealText(meal, recipes, customIngredients) {
  const recipe = meal.recipeId ? recipes.find(({ id }) => id === meal.recipeId) : null
  const ingredientNames = recipe
    ? calculateNutrition(recipe.ingredients, customIngredients).rows.map(({ ingredient }) => ingredient?.name ?? '').join(' ')
    : ''
  return `${meal.name} ${meal.description ?? ''} ${ingredientNames}`.toLocaleLowerCase()
}

function containsTerm(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-z])${escaped}s?($|[^a-z])`, 'i').test(text)
}

function containsFoodTerm(text, term) {
  const aliases = FOOD_TERM_ALIASES[term] ?? [term]
  return aliases.some((alias) => containsTerm(text, alias))
}

export function isMealAllowed(meal, preferences, recipes, customIngredients) {
  const text = mealText(meal, recipes, customIngredients)
  const diet = preferences.dietPreference
  if (diet === 'Vegetarian' && meal.type === 'non-veg') return false
  if (diet === 'Eggetarian' && meal.type === 'non-veg'
    && (!containsTerm(text, 'egg') || /chicken|fish|meat/.test(text))) return false
  if (diet === 'Vegan' && meal.type === 'non-veg') return false
  if (diet === 'Vegan' && ANIMAL_FOOD_WORDS.some((word) => containsTerm(text, word))) return false
  return [...splitFoodTerms(preferences.allergies), ...splitFoodTerms(preferences.restrictions), ...splitFoodTerms(preferences.dislikes)]
    .every((term) => !containsFoodTerm(text, term))
}

export function matchingAvailableFoods(meal, preferences, recipes, customIngredients) {
  if (!preferences.selectedFoods.length) return true
  const text = mealText(meal, recipes, customIngredients)
  const synonyms = {
    'Roti / atta': ['roti', 'wheat', 'atta'],
    Vegetables: ['vegetable', 'sabzi', 'spinach', 'tomato', 'onion', 'cucumber'],
    Fruits: ['fruit', 'banana', 'apple', 'mango', 'orange'],
    Nuts: ['nut', 'peanut', 'almond', 'makhana'],
    Other: [],
  }
  return preferences.selectedFoods.some((food) => (
    [food.toLocaleLowerCase(), ...(synonyms[food] ?? [])].some((term) => term && text.includes(term.toLocaleLowerCase()))
  ))
}

export function prioritizeMealsForGoal(meals, goal, recipes, customIngredients) {
  if (!['Weight Loss', 'Fat Loss', 'Muscle Gain'].includes(goal)) return meals
  const caloriesFor = (meal) => {
    if (Number.isFinite(meal.calories)) return meal.calories
    const recipe = meal.recipeId ? recipes.find(({ id }) => id === meal.recipeId) : null
    return recipe ? calculateNutrition(recipe.ingredients, customIngredients).totalNutrition.caloriesKcal : null
  }
  const direction = goal === 'Muscle Gain' ? -1 : 1
  return meals.map((meal, index) => ({ meal, index, calories: caloriesFor(meal) }))
    .sort((left, right) => {
      if (!Number.isFinite(left.calories)) return Number.isFinite(right.calories) ? 1 : left.index - right.index
      if (!Number.isFinite(right.calories)) return -1
      return (left.calories - right.calories) * direction || left.index - right.index
    })
    .map(({ meal }) => meal)
}

