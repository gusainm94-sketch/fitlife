import { useMemo, useState } from 'react'
import { AlertCircle, CalendarDays, Check, Clock3, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import {
  calculateNutrition,
  CUSTOM_INGREDIENTS_STORAGE_KEY,
  findIngredient,
  getIngredientGrams,
  NUTRIENT_KEYS,
  NUTRIENT_LABELS,
  NUTRITION_RECIPES_STORAGE_KEY,
  normalizeCustomIngredients,
  normalizeRecipes,
} from '../data/ingredients.js'
import {
  DIET_SLOTS,
  COMMON_FOODS,
  DIET_CHARTS_STORAGE_KEY,
  DIET_PRICES_STORAGE_KEY,
  calculateDietTotals,
  isMealAllowed,
  matchingAvailableFoods,
  normalizeDietCharts,
  normalizeDietPrices,
  prioritizeMealsForGoal,
} from '../data/dietPlanning.js'
import { INDIAN_MEALS } from '../data/meals.js'
import { DIET_PREFERENCES } from '../data/profile.js'
import { readLocalJson, writeLocalJson } from '../utils/localStorage.js'
import { Link } from 'react-router-dom'

function makeFoodOptions(recipes) {
  return [
    ...INDIAN_MEALS.map((meal) => ({ ...meal, foodId: `meal:${meal.id}` })),
    ...recipes.map((recipe) => ({
      id: `recipe:${recipe.id}`,
      foodId: `recipe:${recipe.id}`,
      recipeId: recipe.id,
      name: recipe.name,
      description: `Saved recipe · ${recipe.ingredients.length} ingredients`,
      category: 'recipe',
      type: recipe.type === 'non-veg' ? 'non-veg' : 'veg',
    })),
  ]
}

function scaled(value, quantity) {
  return Number.isFinite(value) ? Number((value * quantity).toFixed(1)) : null
}

function getMealEstimate(food, quantity, recipes, customIngredients, prices) {
  if (food.recipeId) {
    const recipe = recipes.find(({ id }) => id === food.recipeId)
    if (!recipe) return { nutrition: Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, null])), cost: null }
    const totals = calculateNutrition(recipe.ingredients, customIngredients).totalNutrition
    const nutrition = Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, scaled(totals[key], quantity)]))
    const rows = recipe.ingredients.map((item) => {
      const ingredient = findIngredient(item.ingredientId, customIngredients)
      const grams = getIngredientGrams(ingredient, item.quantity, item.unit)
      const unitPrice = prices[item.ingredientId]
      return Number.isFinite(grams) && Number.isFinite(unitPrice)
        ? grams * quantity * unitPrice / 100
        : null
    })
    const cost = rows.length && rows.every(Number.isFinite)
      ? Number(rows.reduce((total, value) => total + value, 0).toFixed(2))
      : null
    return { nutrition, cost }
  }

  const meal = INDIAN_MEALS.find(({ id }) => id === food.id)
  return {
    nutrition: {
      caloriesKcal: scaled(meal?.calories, quantity),
      proteinG: null,
      carbsG: null,
      fatG: null,
      fiberG: null,
    },
    cost: Number.isFinite(prices[food.foodId])
      ? Number((prices[food.foodId] * quantity).toFixed(2))
      : null,
  }
}

function makeChartMeal(food, slot, quantity, recipes, customIngredients, prices, id = window.crypto.randomUUID()) {
  const estimate = getMealEstimate(food, quantity, recipes, customIngredients, prices)
  return {
    id,
    slot,
    foodId: food.foodId,
    name: food.name,
    quantity,
    nutrition: Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, estimate.nutrition[key] ?? null])),
    estimatedCost: estimate.cost,
  }
}

function getIngredientCostRows(meal, recipes, customIngredients, prices) {
  const recipe = recipes.find(({ id }) => `recipe:${id}` === meal.foodId)
  if (!recipe) return []
  return recipe.ingredients.map((item) => {
    const ingredient = findIngredient(item.ingredientId, customIngredients)
    const grams = getIngredientGrams(ingredient, item.quantity, item.unit)
    const pricePer100g = prices[item.ingredientId]
    return {
      name: ingredient?.name ?? item.ingredientId,
      grams: Number.isFinite(grams) ? grams * meal.quantity : null,
      pricePer100g,
      cost: Number.isFinite(grams) && Number.isFinite(pricePer100g)
        ? Number((grams * meal.quantity * pricePer100g / 100).toFixed(2))
        : null,
    }
  })
}

function formatEstimate(value, unit) {
  return Number.isFinite(value) ? `~${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}` : 'Unavailable'
}

function formatRupees(value) {
  return Number.isFinite(value) ? `~₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : 'Set food prices'
}

function PreferencesPanel({ profile, preferences, onUpdatePreferences, onUpdateProfile }) {
  const [customFood, setCustomFood] = useState('')
  const [editingFood, setEditingFood] = useState('')
  const [editFoodName, setEditFoodName] = useState('')
  const [message, setMessage] = useState('')

  function commit(next) {
    const normalized = normalizeDietPreferences(next, profile)
    if (!onUpdatePreferences(normalized)) {
      setMessage('Unable to save diet preferences. Check browser storage and try again.')
      return false
    }
    setMessage('')
    return true
  }

  function updateField(event) {
    const { name, value } = event.target
    let updatedValue = value
    if (name === 'dailyBudget') {
      updatedValue = value === '' ? null : Number(value)
      if (updatedValue !== null && (!Number.isFinite(updatedValue) || updatedValue < 0)) return
    }
    if (name === 'mealsPerDay') updatedValue = Number(value)
    commit({ ...preferences, [name]: updatedValue })
  }

  function toggleFood(food) {
    const selectedFoods = preferences.selectedFoods.includes(food)
      ? preferences.selectedFoods.filter((item) => item !== food)
      : [...preferences.selectedFoods, food]
    commit({ ...preferences, selectedFoods })
  }

  function addCustomFood(event) {
    event.preventDefault()
    const name = customFood.trim()
    if (!name) return
    if ([...COMMON_FOODS, ...preferences.customFoods].some((food) => food.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setMessage('That food is already listed.')
      return
    }
    if (commit({
      ...preferences,
      customFoods: [...preferences.customFoods, name],
      selectedFoods: [...preferences.selectedFoods, name],
    })) setCustomFood('')
  }

  function saveCustomFoodEdit(event) {
    event.preventDefault()
    const name = editFoodName.trim()
    if (!name) return
    const duplicate = [...COMMON_FOODS, ...preferences.customFoods.filter((food) => food !== editingFood)]
      .some((food) => food.toLocaleLowerCase() === name.toLocaleLowerCase())
    if (duplicate) {
      setMessage('Another food already uses that name.')
      return
    }
    if (commit({
      ...preferences,
      customFoods: preferences.customFoods.map((food) => food === editingFood ? name : food),
      selectedFoods: preferences.selectedFoods.map((food) => food === editingFood ? name : food),
    })) {
      setEditingFood('')
      setEditFoodName('')
    }
  }

  function updateDietPreference(event) {
    if (!onUpdateProfile({ dietPreference: event.target.value })) {
      setMessage('Unable to update your profile. Check browser storage and try again.')
      return
    }
    setMessage('')
  }

  return (
    <details className="panel diet-settings-panel">
      <summary><span><Check size={16} /> Preferences &amp; available foods</span><span className="diet-settings-summary">Profile goals and diet choice stay in your profile</span></summary>
      <div className="diet-settings-content">
        <p className="diet-profile-summary">
          {profile.age == null ? 'Age not provided' : `${profile.age} years`}
          {' · '}{profile.height == null ? 'Height not provided' : `${profile.height} cm`}
          {' · '}{profile.weight == null ? 'Weight not provided' : `${profile.weight} kg`}
          {' · Gender: '}{profile.gender || 'Not specified'}
          {' · Goal: '}{profile.goal || 'Not specified'}
          {' · Experience: '}{profile.fitnessLevel || 'Not specified'}
        </p>
        <div className="diet-settings-grid">
          <label className="nutrition-field">Diet preference
            <select value={profile.dietPreference} onChange={updateDietPreference}>
              <option value="">Not specified</option>
              {DIET_PREFERENCES.map((diet) => <option key={diet}>{diet}</option>)}
            </select>
          </label>
          <label className="nutrition-field">Activity level
            <select name="activityLevel" value={preferences.activityLevel} onChange={updateField}>
              <option value="">Not specified</option>
              {['Low', 'Light', 'Moderate', 'High'].map((level) => <option key={level}>{level}</option>)}
            </select>
          </label>
          <label className="nutrition-field">Meals per day
            <select name="mealsPerDay" value={preferences.mealsPerDay} onChange={updateField}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => <option key={count} value={count}>{count}</option>)}
            </select>
          </label>
          <label className="nutrition-field">Daily food budget (₹, optional)
            <input name="dailyBudget" type="number" min="0" step="1" value={preferences.dailyBudget ?? ''} onChange={updateField} placeholder="Not set" />
          </label>
          <label className="nutrition-field">Indian region (optional)
            <input name="region" maxLength="60" value={preferences.region} onChange={updateField} placeholder="e.g. North, South, East" />
          </label>
          {DIET_SLOTS.map(({ id, label, defaultTime }) => (
            <label className="nutrition-field" key={id}>{label} time
              <input type="time" value={preferences.mealTimings[id] ?? defaultTime} onChange={(event) => commit({ ...preferences, mealTimings: { ...preferences.mealTimings, [id]: event.target.value } })} />
            </label>
          ))}
          <label className="nutrition-field diet-settings-wide">Food allergies (comma separated)
            <input value={preferences.allergies} maxLength="500" onChange={(event) => commit({ ...preferences, allergies: event.target.value })} placeholder="Only list allergies you wish to record" />
          </label>
          <label className="nutrition-field diet-settings-wide">Food restrictions (comma separated)
            <input value={preferences.restrictions} maxLength="500" onChange={(event) => commit({ ...preferences, restrictions: event.target.value })} placeholder="e.g. gluten, no added sugar" />
          </label>
          <label className="nutrition-field diet-settings-wide">Foods you dislike (comma separated)
            <input value={preferences.dislikes} maxLength="500" onChange={(event) => commit({ ...preferences, dislikes: event.target.value })} placeholder="e.g. bitter gourd" />
          </label>
        </div>
        <fieldset className="diet-food-picker">
          <legend>Foods you regularly have available</legend>
          <div className="diet-food-chip-list">
            {[...COMMON_FOODS, ...preferences.customFoods].map((food) => (
              <span className="diet-food-chip-wrap" key={food}>
                <button className={`diet-food-chip${preferences.selectedFoods.includes(food) ? ' selected' : ''}`} type="button" aria-pressed={preferences.selectedFoods.includes(food)} onClick={() => toggleFood(food)}>{food}</button>
                {preferences.customFoods.includes(food) && <>
                  <button className="diet-food-remove" type="button" aria-label={`Edit ${food}`} onClick={() => { setEditingFood(food); setEditFoodName(food) }}><Pencil size={12} /></button>
                  <button className="diet-food-remove" type="button" aria-label={`Remove ${food}`} onClick={() => commit({ ...preferences, customFoods: preferences.customFoods.filter((item) => item !== food), selectedFoods: preferences.selectedFoods.filter((item) => item !== food) })}><Trash2 size={12} /></button>
                </>}
              </span>
            ))}
          </div>
          {editingFood && (
            <form className="diet-edit-food-form" onSubmit={saveCustomFoodEdit}>
              <label className="nutrition-field">Edit available food<input autoFocus maxLength="70" value={editFoodName} onChange={(event) => setEditFoodName(event.target.value)} /></label>
              <button type="submit" className="nutrition-primary-button" aria-label="Save food name"><Check size={14} /> Save</button>
              <button type="button" className="nutrition-secondary-button" aria-label="Cancel food edit" onClick={() => setEditingFood('')}><X size={14} /></button>
            </form>
          )}
          <form className="diet-add-food-form" onSubmit={addCustomFood}>
            <label className="nutrition-field">Add another available food<input value={customFood} maxLength="70" onChange={(event) => setCustomFood(event.target.value)} placeholder="Food name" /></label>
            <button type="submit" className="nutrition-primary-button"><Plus size={14} /> Add food</button>
          </form>
        </fieldset>
        <p className="diet-settings-note"><AlertCircle size={14} /> Suggestions avoid recorded allergies, restrictions, and dislikes when identifiable in a meal name or saved recipe. Check ingredients and labels yourself; this is not medical or allergy verification.</p>
        {message && <p className="nutrition-message error" role="alert">{message}</p>}
      </div>
    </details>
  )
}

export default function DietPlanningTools({ profile, preferences, onUpdatePreferences, onUpdateProfile }) {
  const [recipes] = useState(() => normalizeRecipes(readLocalJson(NUTRITION_RECIPES_STORAGE_KEY, [])))
  const [customIngredients] = useState(() => normalizeCustomIngredients(readLocalJson(CUSTOM_INGREDIENTS_STORAGE_KEY, [])))
  const [charts, setCharts] = useState(() => normalizeDietCharts(readLocalJson(DIET_CHARTS_STORAGE_KEY, [])))
  const [prices, setPrices] = useState(() => normalizeDietPrices(readLocalJson(DIET_PRICES_STORAGE_KEY, {})))
  const [draft, setDraft] = useState([])
  const [chartName, setChartName] = useState('')
  const [editingChartId, setEditingChartId] = useState('')
  const [storageError, setStorageError] = useState('')
  const [notice, setNotice] = useState('')
  const foods = useMemo(() => makeFoodOptions(recipes), [recipes])
  const totals = calculateDietTotals(draft)
  const estimatedDailyCost = draft.every((meal) => Number.isFinite(meal.estimatedCost))
    ? Number(draft.reduce((sum, meal) => sum + meal.estimatedCost, 0).toFixed(2))
    : null
  const ingredientsInRecipes = useMemo(() => {
    const usedIds = new Set(recipes.flatMap((recipe) => recipe.ingredients.map(({ ingredientId }) => ingredientId)))
    return [...new Set(usedIds)].map((id) => findIngredient(id, customIngredients)).filter(Boolean)
  }, [customIngredients, recipes])
  const usedSampleFoods = useMemo(() => {
    const usedIds = new Set(draft.filter((meal) => meal.foodId.startsWith('meal:')).map((meal) => meal.foodId))
    return foods.filter((food) => usedIds.has(food.foodId))
  }, [draft, foods])

  function savePrice(foodId, value) {
    const next = { ...prices }
    if (value === '') delete next[foodId]
    else {
      const numericPrice = Number(value)
      if (!Number.isFinite(numericPrice) || numericPrice < 0) return
      next[foodId] = numericPrice
    }
    if (!writeLocalJson(DIET_PRICES_STORAGE_KEY, next)) {
      setStorageError('Unable to save estimated food prices. Check browser storage and try again.')
      return
    }
    setPrices(next)
    setDraft((current) => current.map((meal) => {
      const food = foods.find(({ foodId: id }) => id === meal.foodId)
      return food ? makeChartMeal(food, meal.slot, meal.quantity, recipes, customIngredients, next, meal.id) : meal
    }))
    setStorageError('')
  }

  function getEligibleFoods(slot, useAvailableFoods = true) {
    const allowed = foods.filter((food) => isMealAllowed(food, preferences, recipes, customIngredients))
    const categories = slot === 'breakfast'
      ? ['breakfast', 'recipe']
      : slot === 'morning-snacks'
        ? ['morning-snacks', 'breakfast', 'recipe']
        : slot === 'lunch'
          ? ['lunch', 'recipe']
          : slot === 'evening-snacks'
            ? ['evening-snacks', 'recipe']
            : ['dinner', 'recipe']
    const slotFoods = allowed.filter((food) => categories.includes(food.category))
    if (!useAvailableFoods || !preferences.selectedFoods.length) {
      return prioritizeMealsForGoal(slotFoods, preferences.fitnessGoal, recipes, customIngredients)
    }
    const matched = slotFoods.filter((food) => matchingAvailableFoods(food, preferences, recipes, customIngredients))
    return prioritizeMealsForGoal(matched.length ? [...matched, ...slotFoods.filter((food) => !matched.includes(food))] : slotFoods, preferences.fitnessGoal, recipes, customIngredients)
  }

  function generateChart() {
    const nextDraft = DIET_SLOTS.map(({ id }) => {
      const options = getEligibleFoods(id)
      const recommendation = options[0]
      return recommendation ? makeChartMeal(recommendation, id, 1, recipes, customIngredients, prices) : null
    }).filter(Boolean)
    setDraft(nextDraft)
    setChartName(profile.goal ? `${profile.goal} meal chart` : 'My daily meal chart')
    setEditingChartId('')
    setNotice(nextDraft.length ? 'A chart draft is ready. Review foods, portions, and estimates before saving.' : 'No meals match these preferences yet. Review your filters or add a saved recipe.')
  }

  function updateMeal(mealId, patch) {
    setDraft((current) => current.map((meal) => {
      if (meal.id !== mealId) return meal
      const food = foods.find(({ foodId }) => foodId === (patch.foodId ?? meal.foodId))
      const quantity = patch.quantity ?? meal.quantity
      return food
        ? makeChartMeal(food, meal.slot, quantity, recipes, customIngredients, prices, meal.id)
        : { ...meal, ...patch }
    }))
  }

  function addMeal(slot) {
    const food = getEligibleFoods(slot)[0]
    if (!food) {
      setNotice('No matching meal is available. Adjust your filters or save a recipe in the nutrition calculator.')
      return
    }
    setDraft((current) => [...current, makeChartMeal(food, slot, 1, recipes, customIngredients, prices)])
    setNotice('')
  }

  function removeMeal(mealId) {
    setDraft((current) => current.filter(({ id }) => id !== mealId))
  }

  function saveChart(event) {
    event.preventDefault()
    if (!draft.length) {
      setNotice('Add at least one meal before saving a chart.')
      return
    }
    const chart = {
      id: `diet-chart:${window.crypto.randomUUID()}`,
      name: chartName.trim() || 'Daily meal chart',
      savedAt: new Date().toISOString(),
      meals: draft,
    }
    const next = [chart, ...charts]
    if (!writeLocalJson(DIET_CHARTS_STORAGE_KEY, next)) {
      setStorageError('Unable to save your diet chart. Check browser storage and try again.')
      return
    }
    setCharts(next)
    setEditingChartId('')
    setNotice(editingChartId ? 'Edited chart saved as a new version; the original history is preserved.' : 'Diet chart saved to this account.')
    setStorageError('')
  }

  function editChart(chart) {
    setChartName(`Edited: ${chart.name}`)
    setEditingChartId(chart.id)
    setDraft(chart.meals.map((meal) => {
      const food = foods.find(({ foodId }) => foodId === meal.foodId)
      return food
        ? makeChartMeal(food, meal.slot, meal.quantity, recipes, customIngredients, prices, meal.id)
        : meal
    }))
    setNotice('Edit this chart and save it as a new version to preserve the original.')
  }

  const formatSavedDate = (date) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(date))

  return (
    <>
      <PreferencesPanel profile={profile} preferences={preferences} onUpdatePreferences={onUpdatePreferences} onUpdateProfile={onUpdateProfile} />
      <section className="panel diet-chart-panel" aria-labelledby="diet-chart-title">
        <div className="nutrition-panel-heading">
          <div><h2 id="diet-chart-title">Personalized diet chart &amp; cost estimate</h2><p>Build from saved recipes or sample Indian meal suggestions; all values are estimates.</p></div>
          <CalendarDays size={18} />
        </div>
        <div className="diet-chart-intro">
          <p>Goal: <strong>{profile.goal || 'Not specified'}</strong> · Diet: <strong>{profile.dietPreference || 'Not specified'}</strong> · Preferred meals: <strong>{preferences.mealsPerDay}</strong> · Budget: <strong>{preferences.dailyBudget == null ? 'Not set' : `₹${preferences.dailyBudget}/day`}</strong></p>
          <button className="nutrition-primary-button" type="button" onClick={generateChart}><Plus size={14} /> Generate chart draft</button>
        </div>
        {draft.length > 0 && (
          <form className="diet-chart-editor" onSubmit={saveChart}>
            <label className="nutrition-field">Chart name<input required maxLength="80" value={chartName} onChange={(event) => setChartName(event.target.value)} /></label>
            <div className="diet-chart-meal-list">
              {draft.map((meal) => {
                const slot = DIET_SLOTS.find(({ id }) => id === meal.slot)
                const options = getEligibleFoods(meal.slot, false)
                const savedMissing = !options.some(({ foodId }) => foodId === meal.foodId)
                const ingredientCosts = getIngredientCostRows(meal, recipes, customIngredients, prices)
                const lowerCostAlternatives = Number.isFinite(meal.estimatedCost)
                  ? options.map((food) => ({
                    food,
                    cost: getMealEstimate(food, meal.quantity, recipes, customIngredients, prices).cost,
                  })).filter(({ food, cost }) => food.foodId !== meal.foodId
                    && Number.isFinite(cost)
                    && cost < meal.estimatedCost)
                  : []
                return (
                  <article className="diet-chart-meal" key={meal.id}>
                    <div className="diet-chart-meal-heading">
                      <div><span><Clock3 size={13} /> {slot?.label ?? meal.slot}</span><strong>{meal.name}</strong></div>
                      <button className="nutrition-icon-button remove" type="button" aria-label={`Remove ${meal.name}`} onClick={() => removeMeal(meal.id)}><Trash2 size={15} /></button>
                    </div>
                    <div className="diet-chart-controls">
                      <label className="nutrition-field">Food / saved recipe
                        <select value={meal.foodId} onChange={(event) => updateMeal(meal.id, { foodId: event.target.value })}>
                          {savedMissing && <option value={meal.foodId}>{meal.name} (saved snapshot)</option>}
                          {options.map((food) => <option key={food.foodId} value={food.foodId}>{food.name}</option>)}
                        </select>
                      </label>
                      <label className="nutrition-field">Quantity (servings)
                        <input type="number" min="0.25" max="20" step="0.25" value={meal.quantity} onChange={(event) => {
                          const quantity = Number(event.target.value)
                          if (Number.isFinite(quantity) && quantity > 0 && quantity <= 20) updateMeal(meal.id, { quantity })
                        }} />
                      </label>
                    </div>
                    <dl className="diet-chart-nutrients">
                      {NUTRIENT_KEYS.slice(0, 4).map((key) => <div key={key}><dt>{NUTRIENT_LABELS[key]}</dt><dd>{formatEstimate(meal.nutrition[key], key === 'caloriesKcal' ? 'kcal' : 'g')}</dd></div>)}
                    </dl>
                    <p className="diet-chart-cost">Estimated cost per serving: {formatRupees(Number.isFinite(meal.estimatedCost) ? meal.estimatedCost / meal.quantity : null)} · Cost per meal: {formatRupees(meal.estimatedCost)}</p>
                    {ingredientCosts.length > 0 && (
                      <ul className="diet-ingredient-cost-list" aria-label={`Ingredient cost estimates for ${meal.name}`}>
                        {ingredientCosts.map((item, index) => (
                          <li key={`${meal.id}-${item.name}-${index}`}>
                            <span>{item.name} · {Number.isFinite(item.grams) ? `${item.grams.toLocaleString(undefined, { maximumFractionDigits: 1 })} g` : 'quantity unavailable'}</span>
                            <span>{formatRupees(item.pricePer100g)} / 100 g · {formatRupees(item.cost)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {lowerCostAlternatives.length > 0 && <p className="diet-affordable-alternatives">Lower estimated cost alternatives: {lowerCostAlternatives.map(({ food }) => food.name).join(', ')}. Nutritional values are not changed.</p>}
                  </article>
                )
              })}
            </div>
            <div className="diet-add-meal-actions">{DIET_SLOTS.map(({ id, label }) => <button key={id} type="button" className="nutrition-secondary-button" onClick={() => addMeal(id)}><Plus size={13} /> Add {label}</button>)}</div>
            <section className="diet-chart-totals" aria-live="polite">
              <h3>Daily estimate</h3>
              <dl className="diet-chart-nutrients">
                {NUTRIENT_KEYS.slice(0, 4).map((key) => <div key={key}><dt>{NUTRIENT_LABELS[key]}</dt><dd>{formatEstimate(totals[key], key === 'caloriesKcal' ? 'kcal' : 'g')}</dd></div>)}
              </dl>
              <p>Daily cost: <strong>{formatRupees(estimatedDailyCost)}</strong>
                {Number.isFinite(estimatedDailyCost) && <> · Weekly: <strong>~₹{(estimatedDailyCost * 7).toFixed(2)}</strong> · Monthly (30 days): <strong>~₹{(estimatedDailyCost * 30).toFixed(2)}</strong></>}
              </p>
              {Number.isFinite(estimatedDailyCost) && preferences.dailyBudget !== null && (
                <p>{estimatedDailyCost <= preferences.dailyBudget
                  ? `Within budget · ₹${(preferences.dailyBudget - estimatedDailyCost).toFixed(2)} remaining`
                  : `Over budget by ₹${(estimatedDailyCost - preferences.dailyBudget).toFixed(2)}. Consider reviewing portions or food choices; nutrition values are not reduced.`}</p>
              )}
              {draft.some((meal) => !Number.isFinite(meal.estimatedCost)) && <p>Some item prices are unset, so the full daily cost and budget comparison are unavailable.</p>}
            </section>
            <button type="submit" className="nutrition-primary-button"><Save size={14} /> Save chart{editingChartId ? ' as new version' : ''}</button>
          </form>
        )}
        {notice && <p className="nutrition-message" role="status">{notice}</p>}
        {storageError && <p className="nutrition-message error" role="alert">{storageError}</p>}
        <details className="diet-prices-details">
          <summary>Estimated food prices (₹ per 100 g; entered by you)</summary>
          <p>Enter indicative estimates from your own source; FitLife does not provide live market prices. A recipe’s cost is calculated from its ingredient weights and the prices entered here.</p>
          {ingredientsInRecipes.length ? (
            <div className="diet-price-list">
              {ingredientsInRecipes.map((ingredient) => (
                <label key={ingredient.id}>{ingredient.name}
                  <span><span>₹ / 100 g</span><input type="number" min="0" step="0.01" value={prices[ingredient.id] ?? ''} onChange={(event) => savePrice(ingredient.id, event.target.value)} placeholder="Not set" /></span>
                </label>
              ))}
            </div>
          ) : <p>No saved recipe ingredients to price yet. Build a recipe in the <Link to="/nutrition-calculator">Nutrition calculator</Link>.</p>}
          {usedSampleFoods.length > 0 && (
            <>
              <p>For sample meal suggestions without ingredient quantities, enter your own estimated price per serving.</p>
              <div className="diet-price-list">
                {usedSampleFoods.map((food) => (
                  <label key={food.foodId}>{food.name}
                    <span><span>₹ / serving</span><input type="number" min="0" step="0.01" value={prices[food.foodId] ?? ''} onChange={(event) => savePrice(food.foodId, event.target.value)} placeholder="Not set" /></span>
                  </label>
                ))}
              </div>
            </>
          )}
        </details>
        <p className="diet-estimate-disclaimer"><AlertCircle size={14} /> Nutrition figures are estimates from saved recipe ingredients where available; sample meal entries may have calories only. Missing values and unset prices remain unavailable, not zero. This is not a medical diet or a guarantee of results.</p>
      </section>

      <section className="panel diet-history-panel" aria-labelledby="diet-history-title">
        <div className="nutrition-panel-heading"><div><h2 id="diet-history-title">Saved diet chart history</h2><p>Saved versions retain their original nutrient and cost estimates.</p></div><CalendarDays size={17} /></div>
        {charts.length ? (
          <div className="diet-history-list">
            {charts.map((chart) => {
              const chartTotals = calculateDietTotals(chart.meals)
              const cost = chart.meals.every((meal) => Number.isFinite(meal.estimatedCost))
                ? chart.meals.reduce((sum, meal) => sum + meal.estimatedCost, 0)
                : null
              return (
                <article className="diet-history-row" key={chart.id}>
                  <div><strong>{chart.name}</strong><p>{formatSavedDate(chart.savedAt)} · {chart.meals.length} meals · {formatEstimate(chartTotals.caloriesKcal, 'kcal')} · {formatRupees(cost)}</p></div>
                  <button type="button" className="nutrition-small-button" onClick={() => editChart(chart)}>Edit copy</button>
                </article>
              )
            })}
          </div>
        ) : <p className="diet-history-empty">No saved charts yet. Generate and save a chart to keep a dated copy.</p>}
      </section>
    </>
  )
}
