import { useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Calculator, ChevronDown, CircleAlert, Flame, Pencil, Plus, Save, Trash2, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  calculateNutrition,
  CUSTOM_INGREDIENTS_STORAGE_KEY,
  FOOD_CATEGORIES,
  INGREDIENTS,
  NUTRITION_RECIPES_STORAGE_KEY,
  NUTRIENT_KEYS,
  NUTRIENT_LABELS,
  normalizeCustomIngredients,
  normalizeRecipes,
} from '../data/ingredients.js'
import { readLocalJson, writeLocalJson } from '../utils/localStorage.js'

function formatNutrient(value, key) {
  if (!Number.isFinite(value)) return 'Unavailable'
  return `~${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${key === 'caloriesKcal' ? 'kcal' : 'g'}`
}

function NutrientSummary({ nutrition }) {
  return (
    <dl className="nutrition-total-grid">
      {NUTRIENT_KEYS.map((key) => (
        <div className="nutrition-total-card" key={key}>
          <dt>{NUTRIENT_LABELS[key]}</dt>
          <dd>{formatNutrient(nutrition.totalNutrition[key], key)}</dd>
        </div>
      ))}
    </dl>
  )
}

function CustomIngredientForm({ onAdd, message }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState(FOOD_CATEGORIES[0])
  const [nutrients, setNutrients] = useState({ caloriesKcal: '', proteinG: '', carbsG: '', fatG: '', fiberG: '' })
  const [sourceNote, setSourceNote] = useState('')

  function submit(event) {
    event.preventDefault()
    const parsedNutrients = Object.fromEntries(NUTRIENT_KEYS.map((key) => [
      key,
      nutrients[key] === '' ? null : Number(nutrients[key]),
    ]))
    if (Object.values(parsedNutrients).some((value) => value !== null && (!Number.isFinite(value) || value < 0))) return
    const added = onAdd({
      id: `custom:${window.crypto.randomUUID()}`,
      name: name.trim(),
      category,
      preparation: 'Custom ingredient · values per 100 g',
      nutrientsPer100g: parsedNutrients,
      unitGrams: { g: 1 },
      unitLabels: { g: 'g' },
      source: { name: sourceNote.trim() ? `User-provided · ${sourceNote.trim()}` : 'User-provided values' },
      ...(Object.values(parsedNutrients).some((value) => value === null)
        ? { unavailableReason: 'Some values were left blank.' }
        : {}),
    })
    if (added) {
      setName('')
      setNutrients({ caloriesKcal: '', proteinG: '', carbsG: '', fatG: '', fiberG: '' })
      setSourceNote('')
    }
  }

  return (
    <details className="panel nutrition-custom-panel">
      <summary><span><Plus size={16} /> Add a custom ingredient</span><ChevronDown size={16} /></summary>
      <p>Enter values from a reliable label or source, per 100 g. Leave a value blank if it is unknown; blank values will remain unavailable in recipe totals.</p>
      <form className="nutrition-custom-form" onSubmit={submit}>
        <label className="nutrition-field">Ingredient name<input required maxLength={70} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. homemade paneer" /></label>
        <label className="nutrition-field">Category<select value={category} onChange={(event) => setCategory(event.target.value)}>{FOOD_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
        {NUTRIENT_KEYS.map((key) => (
          <label className="nutrition-field" key={key}>{NUTRIENT_LABELS[key]} per 100 g
            <input type="number" min="0" step="any" value={nutrients[key]} onChange={(event) => setNutrients((current) => ({ ...current, [key]: event.target.value }))} placeholder="Optional" />
          </label>
        ))}
        <label className="nutrition-field nutrition-field-wide">Source note (optional)<input maxLength={120} value={sourceNote} onChange={(event) => setSourceNote(event.target.value)} placeholder="e.g. package label, brand and date" /></label>
        <button className="nutrition-primary-button" type="submit"><Plus size={15} /> Save custom ingredient</button>
        {message && <p className="nutrition-message" role="alert">{message}</p>}
      </form>
    </details>
  )
}

export default function NutritionCalculatorPage() {
  const [customIngredients, setCustomIngredients] = useState(() => (
    normalizeCustomIngredients(readLocalJson(CUSTOM_INGREDIENTS_STORAGE_KEY, []))
  ))
  const [recipes, setRecipes] = useState(() => normalizeRecipes(readLocalJson(NUTRITION_RECIPES_STORAGE_KEY, [])))
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [recipeName, setRecipeName] = useState('')
  const [recipeType, setRecipeType] = useState('veg')
  const [editingRecipeId, setEditingRecipeId] = useState('')
  const [message, setMessage] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [storageError, setStorageError] = useState('')
  const ingredients = useMemo(() => [...INGREDIENTS, ...customIngredients], [customIngredients])
  const nutrition = useMemo(() => calculateNutrition(items, customIngredients), [items, customIngredients])
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const searchResults = normalizedSearch
    ? ingredients.filter((ingredient) => (
      ingredient.name.toLocaleLowerCase().includes(normalizedSearch)
      || ingredient.category.toLocaleLowerCase().includes(normalizedSearch)
    )).slice(0, 10)
    : []

  function updateStoredValue(key, value, setValue, errorText) {
    if (!writeLocalJson(key, value)) {
      setStorageError(errorText)
      return false
    }
    setValue(value)
    setStorageError('')
    return true
  }

  function addIngredient(ingredient) {
    const availableUnit = Object.keys(ingredient.unitGrams)[0] ?? 'g'
    setItems((current) => [
      ...current,
      {
        rowId: window.crypto.randomUUID(),
        ingredientId: ingredient.id,
        quantity: 100,
        unit: availableUnit,
      },
    ])
    setSearch('')
    setMessage('')
  }

  function updateItem(rowId, patch) {
    setItems((current) => current.map((item) => item.rowId === rowId ? { ...item, ...patch } : item))
  }

  function addCustomIngredient(ingredient) {
    if (ingredients.some(({ name }) => name.trim().toLocaleLowerCase() === ingredient.name.toLocaleLowerCase())) {
      setCustomMessage('An ingredient with this name is already in your list.')
      return false
    }
    const next = [...customIngredients, ingredient]
    if (!updateStoredValue(
      CUSTOM_INGREDIENTS_STORAGE_KEY,
      next,
      setCustomIngredients,
      'Unable to save this custom ingredient. Check browser storage and try again.',
    )) return false
    setCustomMessage('')
    return true
  }

  function saveRecipe(event) {
    event.preventDefault()
    if (!items.length) {
      setMessage('Add at least one ingredient before saving a recipe.')
      return
    }
    const invalidQuantity = items.some(({ quantity }) => !Number.isFinite(quantity) || quantity <= 0)
    if (invalidQuantity) {
      setMessage('Enter a quantity greater than zero for every ingredient.')
      return
    }
    const recipe = {
      id: editingRecipeId || `recipe:${window.crypto.randomUUID()}`,
      name: recipeName.trim(),
      type: recipeType,
      ingredients: items.map(({ ingredientId, quantity, unit }) => ({ ingredientId, quantity, unit })),
      updatedAt: new Date().toISOString(),
    }
    if (!recipe.name) {
      setMessage('Enter a name for your recipe.')
      return
    }
    const next = editingRecipeId
      ? recipes.map((saved) => saved.id === editingRecipeId ? { ...saved, ...recipe } : saved)
      : [...recipes, recipe]
    if (!updateStoredValue(
      NUTRITION_RECIPES_STORAGE_KEY,
      next,
      setRecipes,
      'Unable to save recipes. Check browser storage and try again.',
    )) return
    setEditingRecipeId(recipe.id)
    setRecipeName(recipe.name)
    setRecipeType(recipe.type ?? 'veg')
    setMessage('Recipe saved to this account.')
  }

  function editRecipe(recipe) {
    setEditingRecipeId(recipe.id)
    setRecipeName(recipe.name)
    setRecipeType(recipe.type ?? 'veg')
    setItems(recipe.ingredients.map((item) => ({ ...item, rowId: window.crypto.randomUUID() })))
    setMessage(`Editing ${recipe.name}.`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startNewRecipe() {
    setEditingRecipeId('')
    setRecipeName('')
    setRecipeType('veg')
    setItems([])
    setMessage('')
  }

  function deleteRecipe(recipeId) {
    const next = recipes.filter(({ id }) => id !== recipeId)
    if (!updateStoredValue(
      NUTRITION_RECIPES_STORAGE_KEY,
      next,
      setRecipes,
      'Unable to delete this recipe. Check browser storage and try again.',
    )) return
    if (editingRecipeId === recipeId) startNewRecipe()
    setMessage('Recipe deleted.')
  }

  function loadRecipe(recipe) {
    setEditingRecipeId(recipe.id)
    setRecipeName(recipe.name)
    setRecipeType(recipe.type ?? 'veg')
    setItems(recipe.ingredients.map((item) => ({ ...item, rowId: window.crypto.randomUUID() })))
    setMessage(`${recipe.name} loaded.`)
  }

  const incompleteRows = nutrition.rows.filter(({ ingredient }) => (
    ingredient && NUTRIENT_KEYS.some((key) => !Number.isFinite(ingredient.nutrientsPer100g?.[key]))
  ))

  return (
    <div className="page-content nutrition-page">
      <header className="nutrition-page-heading">
        <div>
          <p className="eyebrow">Build a recipe, one ingredient at a time</p>
          <h1>Nutrition calculator</h1>
          <p className="workout-page-subtitle">Estimate nutrition from ingredient quantities, then save recipes to use in your meal plan.</p>
        </div>
        <Link className="nutrition-link-button" to="/nutrition"><Utensils size={15} /> Open Diet Planner <ArrowRight size={14} /></Link>
      </header>

      <section className="nutrition-source-note" aria-label="Nutrition estimate notice">
        <CircleAlert size={17} />
        <p><strong>All results are estimates.</strong> Reference values are per 100 g from the USDA FoodData Central SR Legacy dataset (April 2018); amounts are scaled by weight. Household and piece weights are reference estimates, and brands, recipes, and cooking methods vary. Unavailable data is not treated as zero.</p>
      </section>

      <section className="panel nutrition-builder-panel" aria-labelledby="nutrition-builder-title">
        <div className="nutrition-panel-heading">
          <div><h2 id="nutrition-builder-title">Recipe ingredients</h2><p>Search and select ingredients; adjust quantity and supported units.</p></div>
          <span className="nutrition-panel-icon"><Calculator size={17} /></span>
        </div>
        <label className="nutrition-field nutrition-search-field">Search ingredients
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try rice, paneer, spinach..." autoComplete="off" />
        </label>
        {search && (
          <div className="nutrition-search-results" role="list" aria-label="Ingredient search results">
            {searchResults.length ? searchResults.map((ingredient) => (
              <button type="button" className="nutrition-search-result" key={ingredient.id} onClick={() => addIngredient(ingredient)}>
                <span><strong>{ingredient.name}</strong><small>{ingredient.category} · {ingredient.preparation}</small></span><Plus size={16} />
              </button>
            )) : <p>No matches. Add it below as a custom ingredient.</p>}
          </div>
        )}

        {items.length ? (
          <div className="nutrition-ingredient-list">
            {nutrition.rows.map(({ rowId, ingredient, grams, nutrients: rowNutrition }, index) => {
              if (!ingredient) return null
              const unitOptions = Object.keys(ingredient.unitGrams)
              return (
                <article className="nutrition-ingredient-row" key={rowId}>
                  <div className="nutrition-ingredient-heading">
                    <span className="nutrition-ingredient-index">{String(index + 1).padStart(2, '0')}</span>
                    <div><strong>{ingredient.name}</strong><small>{ingredient.preparation}</small></div>
                    <button className="nutrition-icon-button remove" type="button" aria-label={`Remove ${ingredient.name}`} onClick={() => setItems((current) => current.filter((item) => item.rowId !== rowId))}><Trash2 size={15} /></button>
                  </div>
                  <div className="nutrition-quantity-controls">
                    <label className="nutrition-field">Quantity
                      <input type="number" min="0.1" step="any" value={items.find((item) => item.rowId === rowId)?.quantity ?? ''} onChange={(event) => updateItem(rowId, { quantity: event.target.value === '' ? '' : Number(event.target.value) })} />
                    </label>
                    <label className="nutrition-field">Unit
                      <select value={items.find((item) => item.rowId === rowId)?.unit ?? 'g'} onChange={(event) => updateItem(rowId, { unit: event.target.value })}>
                        {unitOptions.map((unit) => <option value={unit} key={unit}>{ingredient.unitLabels?.[unit] ?? unit}</option>)}
                      </select>
                    </label>
                    <span className="nutrition-weight-hint">{Number.isFinite(grams) ? `≈ ${grams.toLocaleString(undefined, { maximumFractionDigits: 1 })} g` : 'Enter a valid quantity'}</span>
                  </div>
                  {ingredient.source?.url && ingredient.source.recordId ? (
                    <p className="nutrition-ingredient-source"><a href={ingredient.source.url} target="_blank" rel="noreferrer">{ingredient.source.name}</a> · FDC #{ingredient.source.recordId}</p>
                  ) : (
                    <p className="nutrition-ingredient-source">{ingredient.source?.name ?? 'Custom ingredient; values entered by you.'}</p>
                  )}
                  {NUTRIENT_KEYS.some((key) => !Number.isFinite(ingredient.nutrientsPer100g?.[key])) && (
                    <p className="nutrition-unavailable-note"><CircleAlert size={14} /> {ingredient.unavailableReason ?? 'One or more nutrient values were not provided.'}</p>
                  )}
                  <dl className="nutrition-row-values">
                    {NUTRIENT_KEYS.map((key) => <div key={key}><dt>{NUTRIENT_LABELS[key]}</dt><dd>{formatNutrient(rowNutrition[key], key)}</dd></div>)}
                  </dl>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="nutrition-empty-state"><span><BookOpen size={20} /></span><strong>No ingredients yet</strong><p>Search above to add your first ingredient to the calculator.</p></div>
        )}

        <section className="nutrition-totals" aria-labelledby="nutrition-total-title" aria-live="polite">
          <div className="nutrition-total-heading"><div><h3 id="nutrition-total-title">Recipe total</h3><p>{nutrition.totalWeightG === null ? 'Ingredient mass unavailable' : `Approx. total ingredient weight · ${nutrition.totalWeightG.toLocaleString(undefined, { maximumFractionDigits: 1 })} g`}</p></div><Flame size={17} /></div>
          <NutrientSummary nutrition={nutrition} />
          {incompleteRows.length > 0 && <p className="nutrition-incomplete-note">One or more nutrient values are missing. Totals for affected nutrients remain unavailable rather than being counted as zero.</p>}
        </section>
      </section>

      <CustomIngredientForm onAdd={addCustomIngredient} message={customMessage || storageError} />

      <section className="panel nutrition-recipe-save-panel" aria-labelledby="nutrition-save-title">
        <div className="nutrition-panel-heading">
          <div><h2 id="nutrition-save-title">{editingRecipeId ? 'Edit saved recipe' : 'Save this recipe'}</h2><p>Recipes and custom ingredients are stored separately for each signed-in account on this device.</p></div>
          <span className="nutrition-panel-icon"><Save size={17} /></span>
        </div>
        <form className="nutrition-save-form" onSubmit={saveRecipe}>
          <label className="nutrition-field">Recipe name<input required maxLength={80} value={recipeName} onChange={(event) => setRecipeName(event.target.value)} placeholder="e.g. Weeknight dal bowl" /></label>
          <label className="nutrition-field">Meal type<select value={recipeType} onChange={(event) => setRecipeType(event.target.value)}><option value="veg">Veg</option><option value="non-veg">Non-Veg</option></select></label>
          <div className="nutrition-save-actions">
            {editingRecipeId && <button className="nutrition-secondary-button" type="button" onClick={startNewRecipe}>New recipe</button>}
            <button className="nutrition-primary-button" type="submit"><Save size={15} /> {editingRecipeId ? 'Update recipe' : 'Save recipe'}</button>
          </div>
          {(message || storageError) && <p className={`nutrition-message${storageError ? ' error' : ''}`} role={storageError ? 'alert' : 'status'}>{storageError || message}</p>}
        </form>
      </section>

      <section className="panel nutrition-saved-panel" aria-labelledby="nutrition-saved-title">
        <div className="nutrition-panel-heading"><div><h2 id="nutrition-saved-title">Saved recipes</h2><p>Open a recipe to review or edit its ingredients.</p></div><span className="nutrition-panel-icon"><BookOpen size={17} /></span></div>
        {recipes.length ? (
          <div className="nutrition-saved-list">
            {recipes.map((recipe) => {
              const savedNutrition = calculateNutrition(recipe.ingredients, customIngredients)
              return (
                <article className="nutrition-saved-recipe" key={recipe.id}>
                  <div><strong>{recipe.name}</strong><p>{recipe.ingredients.length} ingredients · {formatNutrient(savedNutrition.totalNutrition.caloriesKcal, 'caloriesKcal')}</p></div>
                  <div className="nutrition-saved-actions">
                    <button className="nutrition-small-button" type="button" onClick={() => loadRecipe(recipe)}>Load</button>
                    <button className="nutrition-icon-button" type="button" aria-label={`Edit ${recipe.name}`} onClick={() => editRecipe(recipe)}><Pencil size={14} /></button>
                    <button className="nutrition-icon-button remove" type="button" aria-label={`Delete ${recipe.name}`} onClick={() => deleteRecipe(recipe.id)}><Trash2 size={14} /></button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : <p className="nutrition-empty-saved">No recipes saved yet. Add ingredients above and save your first recipe.</p>}
        <p className="nutrition-disclaimer"><CircleAlert size={13} /> FoodData Central values describe reference foods and are not exact values for a specific brand or prepared dish.</p>
      </section>
    </div>
  )
}
