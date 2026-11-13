import { useEffect, useState } from 'react'
import { Check, Flame, Leaf, Plus, Utensils } from 'lucide-react'
import { INDIAN_MEALS, MEAL_CATEGORIES } from '../data/meals.js'
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
        <span className="diet-meal-meta"><span className={`diet-food-label ${meal.type}`}>{meal.type === 'veg' ? 'Veg' : 'Non-Veg'}</span><span><Flame size={13} /> {meal.calories} kcal</span></span>
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

  const selectedMealList = INDIAN_MEALS.filter((meal) => selectedMeals[meal.category] === meal.id)
  const calorieTotal = selectedMealList.reduce((total, meal) => total + meal.calories, 0)

  function toggleMeal(meal) {
    setMealPlan((current) => ({
      ...current,
      selectedMeals: {
        ...current.selectedMeals,
        [meal.category]: current.selectedMeals[meal.category] === meal.id ? undefined : meal.id,
      },
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
          <span><small>Estimated daily total</small><strong>{calorieTotal.toLocaleString()} <em>kcal</em></strong></span>
        </div>
      </section>

      <section className="diet-planner-toolbar" aria-label="Meal filters and selection summary">
        <div className="diet-filter-group" role="group" aria-label="Filter meals by type">
          {FILTERS.map((option) => <button key={option.id} className={filter === option.id ? 'active' : ''} type="button" aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>{option.id === 'veg' && <Leaf size={14} />}{option.label}</button>)}
        </div>
        <p><Utensils size={14} /> {selectedMealList.length} of {MEAL_CATEGORIES.length} meals selected</p>
      </section>

      <div className="diet-category-list">
        {MEAL_CATEGORIES.map((category, index) => {
          const meals = INDIAN_MEALS.filter((meal) => meal.category === category.id && (filter === 'all' || meal.type === filter))
          const chosenMeal = INDIAN_MEALS.find((meal) => meal.id === selectedMeals[category.id])

          return (
            <section className="panel diet-category-panel" key={category.id} aria-labelledby={`diet-${category.id}`}>
              <div className="diet-category-heading">
                <span className="diet-category-number">0{index + 1}</span>
                <div><h2 id={`diet-${category.id}`}>{category.name}</h2><p>{category.description}</p></div>
                {chosenMeal && <span className="diet-picked-badge"><Check size={12} /> {chosenMeal.calories} kcal planned</span>}
              </div>
              <div className="diet-meal-grid">
                {meals.map((meal) => <MealCard key={meal.id} meal={meal} selected={selectedMeals[category.id] === meal.id} onToggle={() => toggleMeal(meal)} />)}
              </div>
              <p className="diet-category-hint">{chosenMeal ? `${chosenMeal.name} added to today's plan` : 'Choose one option for this meal'}</p>
            </section>
          )
        })}
      </div>
      <p className="diet-disclaimer">Calorie values are approximate estimates for sample portions and are provided for general reference.</p>
    </div>
  )
}