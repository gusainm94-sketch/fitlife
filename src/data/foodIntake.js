import { NUTRIENT_KEYS } from './ingredients.js'

export const FOOD_INTAKE_STORAGE_KEY = 'fitlife.food-intake.v1'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isFoodIntakeRecord(record) {
  return Boolean(record)
    && typeof record.id === 'string'
    && record.id.length > 0
    && typeof record.recipeId === 'string'
    && typeof record.recipeName === 'string'
    && typeof record.category === 'string'
    && typeof record.date === 'string'
    && DATE_PATTERN.test(record.date)
    && (record.caloriesKcal === null || (Number.isFinite(record.caloriesKcal) && record.caloriesKcal >= 0))
    && record.nutrients
    && typeof record.nutrients === 'object'
    && !Array.isArray(record.nutrients)
    && NUTRIENT_KEYS.every((key) => (
      record.nutrients[key] === null
      || (Number.isFinite(record.nutrients[key]) && record.nutrients[key] >= 0)
    ))
}

export function normalizeFoodIntake(saved) {
  if (!Array.isArray(saved)) return []
  const ids = new Set()
  return saved.filter((record) => {
    if (!isFoodIntakeRecord(record) || ids.has(record.id)) return false
    ids.add(record.id)
    return true
  })
}

export function createFoodIntakeRecord({ recipe, category, date, nutrients }) {
  if (!recipe || typeof recipe.id !== 'string' || typeof recipe.name !== 'string' || !DATE_PATTERN.test(date)) return null
  const safeNutrients = Object.fromEntries(NUTRIENT_KEYS.map((key) => [
    key,
    Number.isFinite(nutrients?.[key]) && nutrients[key] >= 0 ? nutrients[key] : null,
  ]))
  const caloriesKcal = safeNutrients.caloriesKcal
  return {
    id: `food:${date}:${category}:${recipe.id}`,
    recipeId: recipe.id,
    recipeName: recipe.name,
    category,
    date,
    caloriesKcal,
    nutrients: safeNutrients,
  }
}

export function addFoodIntakeRecord(existing, addition) {
  const records = normalizeFoodIntake(existing)
  if (!isFoodIntakeRecord(addition) || records.some(({ id }) => id === addition.id)) return records
  return [...records, addition]
}

export function getFoodIntakeCaloriesForDate(records, date) {
  return normalizeFoodIntake(records)
    .filter((record) => record.date === date)
    .reduce((total, record) => total + (record.caloriesKcal ?? 0), 0)
}
