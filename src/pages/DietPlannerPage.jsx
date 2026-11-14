import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, CircleAlert, Flame, Leaf, Plus, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'
import { INDIAN_MEALS, MEAL_CATEGORIES } from '../data/meals.js'
import {
  calculateNutrition,
  CUSTOM_INGREDIENTS_STORAGE_KEY,
  NUTRITION_RECIPES_STORAGE_KEY,
  normalizeCustomIngredients,
  normalizeRecipes,
} from '../data/ingredients.js'
import {
  addFoodIntakeRecord,
  createFoodIntakeRecord,
  FOOD_INTAKE_STORAGE_KEY,
  normalizeFoodIntake,
} from '../data/foodIntake.js'
import { readLocalJson, writeLocalJson } from '../utils/localStorage.js'
import { getTodayKey } from '../utils/date.js'

const FILTERS = [
  { id: 'all', label: 'All meals' },
  { id: 'veg', label: 'Veg' },
  { id: 'non-veg', label: 'Non-Veg' },
]

const getTodayMealStorageKey = () => `fitlife-diet-plan-${getTodayKey()}`

function readMealPlan(storageKey) {
  const saved = readLocalJson(storageKey, {})
  return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}
}

function MealCard({ meal, selected, onToggle }) {
  return (
    <button className={`diet-meal-card${selected ? ' selected' : ''}`} type="button" aria-pressed={selected} onClick={onToggle}>
      <span className={`diet-meal-type-mark ${meal.type}`} aria-hidden="true"><Leaf size={15} /></span>
      <span className="diet-meal-copy">
        <span className="diet-meal-name">{meal.name}</span>
        <span className="diet-meal-description">{meal.description}</span>
        <span className="diet-meal-meta"><span className={`diet-food-label ${meal.type}`}>{meal.type === 'veg' ? 'Veg' : 'Non-Veg'}</span><span><Flame size={13} /> {Number.isFinite(meal.calories) ? `~${meal.calories} kcal` : 'Nutrition unavailable'}</span></span>
      </span>
      <span className={`diet-meal-select${selected ? ' selected' : ''}`} aria-hidden="true">{selected ? <Check size={15} /> : <Plus size={15} />}</span>
    </button>
  )
}

export default function DietPlannerPage() {
  const [mealPlan, setMealPlan] = useState(() => {
    const storageKey = getTodayMealStorageKey()
    return { storageKey, selectedMeals: readMealPlan(storageKey) }
  })
  const [filter, setFilter] = useState('all')
  const [recipes] = useState(() => normalizeRecipes(readLocalJson(NUTRITION_RECIPES_STORAGE_KEY, [])))
  const [customIngredients] = useState(() => normalizeCustomIngredients(readLocalJson(CUSTOM_INGREDIENTS_STORAGE_KEY, [])))
  const [foodIntake, setFoodIntake] = useState(() => normalizeFoodIntake(readLocalJson(FOOD_INTAKE_STORAGE_KEY, [])))
  const [logMessages, setLogMessages] = useState({})
  const { selectedMeals } = mealPlan

  useEffect(() => {
    writeLocalJson(mealPlan.storageKey, mealPlan.selectedMeals)
  }, [mealPlan])

  useEffect(() => {
    const refreshForToday = () => {
      const nextStorageKey = getTodayMealStorageKey()
      setMealPlan((current) => current.storageKey === nextStorageKey
        ? current
        : { storageKey: nextStorageKey, selectedMeals: readMealPlan(nextStorageKey) })
    }
    document.addEventListener('visibilitychange', refreshForToday)
    window.addEventListener('focus', refreshForToday)
    window.addEventListener('pageshow', refreshForToday)
    return () => {
      document.removeEventListener('visibilitychange', refreshForToday)
      window.removeEventListener('focus', refreshForToday)
      window.removeEventListener('pageshow', refreshForToday)
    }
  }, [])

  const recipeMeals = useMemo(() => recipes.map((recipe) => {
    const totals = calculateNutrition(recipe.ingredients, customIngredients).totalNutrition
    return {
      id: `recipe:${recipe.id}`,
      recipeId: recipe.id,
      name: recipe.name,
      description: `Saved recipe · ${recipe.ingredients.length} ingredients`,
      calories: totals.caloriesKcal,
      category: 'recipe',
      type: recipe.type === 'non-veg' ? 'non-veg' : 'veg',
      nutrition: totals,
    }
  }), [customIngredients, recipes])

  const selectedMealList = MEAL_CATEGORIES.flatMap((category) => {
    const meals = [...INDIAN_MEALS, ...recipeMeals]
    return meals.filter((meal) => (
      meal.category === category.id || meal.category === 'recipe'
    )).filter((meal) => selectedMeals[category.id] === meal.id).slice(0, 1)
  })
  const calorieTotal = selectedMealList.reduce((total, meal) => total + (meal.calories ?? 0), 0)
  const hasUnknownCalories = selectedMealList.some(({ calories }) => !Number.isFinite(calories))

  function getMealsForCategory(categoryId) {
    return [...INDIAN_MEALS.filter((meal) => meal.category === categoryId), ...recipeMeals]
      .filter((meal) => filter === 'all' || meal.type === filter)
  }

  function toggleMeal(category, meal) {
    setMealPlan((current) => ({
      ...current,
      selectedMeals: {
        ...current.selectedMeals,
        [category]: current.selectedMeals[category] === meal.id ? undefined : meal.id,
      },
    }))
    setLogMessages((current) => ({ ...current, [category]: '' }))
  }

  function clearMissingMeal(category) {
    setMealPlan((current) => {
      const selectedMealsForToday = { ...current.selectedMeals }
      delete selectedMealsForToday[category]
      return { ...current, selectedMeals: selectedMealsForToday }
    })
  }

  function logRecipeMeal(category, recipeMeal) {
    const recipe = recipes.find(({ id }) => id === recipeMeal.recipeId)
    if (!recipe) {
      setLogMessages((current) => ({ ...current, [category]: 'This saved recipe is no longer available.' }))
      return
    }
    const nutrition = calculateNutrition(recipe.ingredients, customIngredients)
    const entry = createFoodIntakeRecord({
      recipe,
      category,
      date: getTodayKey(),
      nutrients: nutrition.totalNutrition,
    })
    if (!entry) {
      setLogMessages((current) => ({ ...current, [category]: 'Unable to create a meal log for this recipe.' }))
      return
    }
    if (foodIntake.some(({ id }) => id === entry.id)) {
      setLogMessages((current) => ({ ...current, [category]: 'This recipe is already logged for this meal today.' }))
      return
    }
    const next = addFoodIntakeRecord(foodIntake, entry)
    if (next.length === foodIntake.length || !writeLocalJson(FOOD_INTAKE_STORAGE_KEY, next)) {
      setLogMessages((current) => ({ ...current, [category]: 'Unable to save this meal log. Check browser storage and try again.' }))
      return
    }
    setFoodIntake(next)
    setLogMessages((current) => ({
      ...current,
      [category]: Number.isFinite(entry.caloriesKcal)
        ? 'Meal logged. Its estimated calories are now included in food intake.'
        : 'Meal logged. Its calorie estimate is unavailable because nutrition data is incomplete.',
    }))
  }

  return (
    <div className="page-content diet-page">
      <section className="diet-page-heading">
        <div>
          <p className="eyebrow">A little more balance, every day</p>
          <h1>Your diet planner</h1>
          <p className="diet-page-subtitle">Pick a meal for each part of your day. Your plan stays saved on this device.</p>
        </div>
        <div className="diet-calorie-summary" aria-live="polite">
          <span className="diet-summary-icon"><Flame size={18} /></span>
          <span><small>{hasUnknownCalories ? 'Some recipe nutrition is unavailable' : 'Estimated planned calories'}</small><strong>{hasUnknownCalories ? '—' : `~${calorieTotal.toLocaleString()}`} <em>kcal</em></strong></span>
        </div>
      </section>

      <section className="diet-planner-toolbar" aria-label="Meal filters and selection summary">
        <div className="diet-filter-group" role="group" aria-label="Filter meals by type">
          {FILTERS.map((option) => <button key={option.id} className={filter === option.id ? 'active' : ''} type="button" aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>{option.id === 'veg' && <Leaf size={14} />}{option.label}</button>)}
        </div>
        <p><Utensils size={14} /> {selectedMealList.length} of {MEAL_CATEGORIES.length} meals selected <Link className="diet-calculator-link" to="/nutrition-calculator">Nutrition calculator <ArrowRight size={12} /></Link></p>
      </section>

      <div className="diet-category-list">
        {MEAL_CATEGORIES.map((category, index) => {
          const meals = getMealsForCategory(category.id)
          const chosenMeal = meals.find((meal) => meal.id === selectedMeals[category.id])
          const hasMissingSelection = selectedMeals[category.id] && !chosenMeal
          const loggedToday = chosenMeal?.recipeId
            ? foodIntake.some(({ id }) => id === `food:${getTodayKey()}:${category.id}:${chosenMeal.recipeId}`)
            : false

          return (
            <section className="panel diet-category-panel" key={category.id} aria-labelledby={`diet-${category.id}`}>
              <div className="diet-category-heading">
                <span className="diet-category-number">0{index + 1}</span>
                <div><h2 id={`diet-${category.id}`}>{category.name}</h2><p>{category.description}</p></div>
                {chosenMeal && <span className="diet-picked-badge"><Check size={12} /> {Number.isFinite(chosenMeal.calories) ? `~${chosenMeal.calories} kcal planned` : 'Nutrition unavailable'}</span>}
              </div>
              <div className="diet-meal-grid">
                {meals.map((meal) => <MealCard key={meal.id} meal={meal} selected={selectedMeals[category.id] === meal.id} onToggle={() => toggleMeal(category.id, meal)} />)}
              </div>
              {hasMissingSelection
                ? <p className="diet-category-hint diet-missing-recipe"><CircleAlert size={13} /> A recipe in this saved plan is no longer available. <button type="button" onClick={() => clearMissingMeal(category.id)}>Remove it from today's plan</button></p>
                : <p className="diet-category-hint">{chosenMeal ? `${chosenMeal.name} added to today's plan` : 'Choose one option for this meal'}</p>}
              {chosenMeal?.recipeId && (
                <div className="diet-recipe-log">
                  <button className="diet-log-button" type="button" disabled={loggedToday} onClick={() => logRecipeMeal(category.id, chosenMeal)}>{loggedToday ? 'Already logged today' : 'Log this meal as eaten'}</button>
                  <p>{logMessages[category.id] || (loggedToday ? 'This meal is already included in logged food intake.' : 'Planning a meal does not log food intake. Use this button only after eating it.')}</p>
                </div>
              )}
            </section>
          )
        })}
      </div>
      <p className="diet-disclaimer">Sample meal calories are approximate estimates for sample portions. Saved recipe calories are based on their ingredient calculator and are added to intake only when explicitly logged as eaten.</p>
    </div>
  )
}
