export const CUSTOM_INGREDIENTS_STORAGE_KEY = 'fitlife.nutrition-custom-ingredients.v1'
export const NUTRITION_RECIPES_STORAGE_KEY = 'fitlife.nutrition-recipes.v1'
export const FOOD_CATEGORIES = [
  'Grains & cereals',
  'Dairy',
  'Protein',
  'Vegetables',
  'Fruits',
  'Additional ingredients',
]
export const NUTRIENT_KEYS = ['caloriesKcal', 'proteinG', 'carbsG', 'fatG', 'fiberG']
export const NUTRIENT_LABELS = {
  caloriesKcal: 'Calories',
  proteinG: 'Protein',
  carbsG: 'Carbohydrates',
  fatG: 'Fat',
  fiberG: 'Fibre',
}

const DATA_SOURCE = 'USDA FoodData Central · SR Legacy · April 2018'
const SOURCE_URL = 'https://fdc.nal.usda.gov/download-datasets.html'
const FDC_RECORD_IDS = {
  'rice-white-raw': '168877',
  'rice-white-cooked': '168935',
  'rice-brown-raw': '169703',
  'rice-brown-cooked': '169704',
  'wheat-flour': '168893',
  'oats-dry': '173904',
  'milk-whole': '171265',
  'milk-lowfat': '170872',
  cheddar: '170899',
  'egg-raw': '171287',
  'chicken-breast-raw': '171077',
  'chicken-breast-cooked': '171477',
  'fish-tilapia-raw': '175176',
  'soybean-raw': '174270',
  'dal-lentils-cooked': '172421',
  'chickpeas-cooked': '173757',
  'kidney-beans-cooked': '173740',
  besan: '174288',
  'potato-raw': '170026',
  'tomato-raw': '170457',
  'onion-raw': '170000',
  'spinach-raw': '168462',
  'broccoli-raw': '170379',
  'carrot-raw': '170393',
  'cauliflower-raw': '169986',
  'peas-raw': '170419',
  'cucumber-raw': '168409',
  'eggplant-raw': '169228',
  'cabbage-raw': '169975',
  'mushrooms-raw': '169251',
  'banana-raw': '173944',
  'apple-raw': '171688',
  'orange-raw': '169097',
  'papaya-raw': '169926',
  'mango-raw': '169910',
  'guava-raw': '173044',
  'pear-raw': '169118',
  almonds: '170567',
  'peanuts-raw': '172430',
  walnuts: '170187',
  'soybean-oil': '171411',
  butter: '173410',
  ghee: '171314',
  coconut: '170169',
  'garlic-raw': '169230',
  'ginger-raw': '169231',
  'lemon-raw': '167746',
  sugar: '169655',
  'turmeric-ground': '172231',
  'cumin-seed': '170923',
}

function sourcedFood(id, name, category, preparation, values, units, labels = {}) {
  return {
    id,
    name,
    category,
    preparation,
    nutrientsPer100g: {
      caloriesKcal: values[0],
      proteinG: values[1],
      carbsG: values[2],
      fatG: values[3],
      fiberG: values[4],
    },
    unitGrams: { g: 1, ...units },
    unitLabels: { g: 'g', ...Object.fromEntries(Object.keys(units).map((unit) => [unit, unit])), ...labels },
    source: {
      name: DATA_SOURCE,
      url: SOURCE_URL,
      recordId: FDC_RECORD_IDS[id],
      recordName: preparation,
    },
  }
}

function unavailableFood(id, name, category, reason) {
  return {
    id,
    name,
    category,
    preparation: 'Nutrition data unavailable',
    nutrientsPer100g: null,
    unitGrams: { g: 1 },
    unitLabels: { g: 'g' },
    unavailableReason: reason,
  }
}

export const INGREDIENTS = [
  sourcedFood('rice-white-raw', 'Rice, white (raw)', 'Grains & cereals', 'White, long-grain rice, raw, enriched', [365, 7.13, 79.95, 0.66, 1.3], { cup: 185 }),
  sourcedFood('rice-white-cooked', 'Rice, white (cooked)', 'Grains & cereals', 'White, long-grain rice, cooked, unenriched, with salt', [130, 2.69, 28.17, 0.28, 0.4], { cup: 158 }),
  sourcedFood('rice-brown-raw', 'Rice, brown (raw)', 'Grains & cereals', 'Brown, long-grain rice, raw', [367, 7.54, 76.25, 3.2, 3.6], { cup: 185 }),
  sourcedFood('rice-brown-cooked', 'Rice, brown (cooked)', 'Grains & cereals', 'Brown, long-grain rice, cooked', [123, 2.74, 25.58, 0.97, 1.6], { cup: 202 }),
  sourcedFood('wheat-flour', 'Wheat flour / atta', 'Grains & cereals', 'Whole-grain wheat flour', [340, 13.21, 71.97, 2.5, 10.7], { cup: 120 }),
  sourcedFood('oats-dry', 'Oats (dry)', 'Grains & cereals', 'Regular and quick oats, not fortified, dry', [379, 13.15, 67.7, 6.52, 10.1], { cup: 81 }),
  unavailableFood('poha', 'Poha (flattened rice)', 'Grains & cereals', 'A matching flattened-rice record was not available in the included reference dataset. Add label values as a custom ingredient if known.'),

  sourcedFood('milk-whole', 'Milk, whole', 'Dairy', 'Fluid whole milk, 3.25% milkfat', [61, 3.15, 4.8, 3.25, 0], { cup: 244, tbsp: 15, ml: 244 / 240 }),
  sourcedFood('milk-lowfat', 'Milk, low-fat', 'Dairy', 'Fluid milk, 1% milkfat', [42, 3.37, 4.99, 0.97, 0], { cup: 244, ml: 244 / 240 }),
  unavailableFood('curd', 'Curd (dahi)', 'Dairy', 'The reference dataset does not identify plain Indian curd separately. Yogurt values are not substituted because products can differ.'),
  unavailableFood('paneer', 'Paneer', 'Dairy', 'A matching paneer record was not available in the included reference dataset. Add package values as a custom ingredient if known.'),
  sourcedFood('cheddar', 'Cheese, cheddar', 'Dairy', 'Cheddar cheese, sharp, sliced', [410, 24.25, 2.13, 33.82, 0], { piece: 28 }, { piece: 'slice (1 oz)' }),

  sourcedFood('egg-raw', 'Egg (raw)', 'Protein', 'Whole egg, raw, fresh', [143, 12.56, 0.72, 9.51, 0], { piece: 50 }, { piece: 'large egg' }),
  sourcedFood('chicken-breast-raw', 'Chicken breast (raw)', 'Protein', 'Broiler chicken breast, skinless, boneless, meat only, raw', [120, 22.5, 0, 2.62, 0], { piece: 272 }, { piece: 'breast portion' }),
  sourcedFood('chicken-breast-cooked', 'Chicken breast (cooked)', 'Protein', 'Broiler chicken breast, meat only, cooked, roasted', [165, 31.02, 0, 3.57, 0], { cup: 140, piece: 86 }, { piece: 'breast portion' }),
  sourcedFood('fish-tilapia-raw', 'Fish, tilapia (raw)', 'Protein', 'Tilapia, raw', [96, 20.08, 0, 1.7, 0], { piece: 116 }, { piece: 'fillet' }),
  sourcedFood('soybean-raw', 'Soybean (raw)', 'Protein', 'Mature soybean seeds, raw', [446, 36.49, 30.16, 19.94, 9.3], { cup: 186 }),
  sourcedFood('dal-lentils-cooked', 'Dal / lentils (cooked)', 'Protein', 'Mature lentils, cooked, boiled, without salt', [116, 9.02, 20.13, 0.38, 7.9], { cup: 198, tbsp: 12.3 }),
  sourcedFood('chickpeas-cooked', 'Chickpeas / chana (cooked)', 'Protein', 'Mature chickpeas, cooked, boiled, without salt', [164, 8.86, 27.42, 2.59, 7.6], { cup: 164 }),
  sourcedFood('kidney-beans-cooked', 'Rajma / kidney beans (cooked)', 'Protein', 'Mature kidney beans, cooked, boiled, without salt', [127, 8.67, 22.8, 0.5, 6.4], { cup: 177, tbsp: 11 }),
  sourcedFood('besan', 'Besan / chickpea flour', 'Protein', 'Chickpea flour', [387, 22.39, 57.82, 6.69, 10.8], { cup: 92 }),

  sourcedFood('potato-raw', 'Potato (raw)', 'Vegetables', 'Potato, flesh and skin, raw', [77, 2.05, 17.49, 0.09, 2.1], { cup: 75, piece: 213 }, { piece: 'medium potato' }),
  sourcedFood('tomato-raw', 'Tomato (raw)', 'Vegetables', 'Tomato, red, ripe, raw', [18, 0.88, 3.89, 0.2, 1.2], { cup: 180, piece: 123 }, { piece: 'medium tomato' }),
  sourcedFood('onion-raw', 'Onion (raw)', 'Vegetables', 'Onions, raw', [40, 1.1, 9.34, 0.1, 1.7], { cup: 160, tbsp: 10, piece: 110 }, { piece: 'medium onion' }),
  sourcedFood('spinach-raw', 'Spinach (raw)', 'Vegetables', 'Spinach, raw', [23, 2.86, 3.63, 0.39, 2.2], { cup: 30, piece: 10 }, { piece: 'leaf' }),
  sourcedFood('broccoli-raw', 'Broccoli (raw)', 'Vegetables', 'Broccoli, raw', [34, 2.82, 6.64, 0.37, 2.6], { cup: 91, piece: 31 }, { piece: 'spear' }),
  sourcedFood('carrot-raw', 'Carrot (raw)', 'Vegetables', 'Carrots, raw', [41, 0.93, 9.58, 0.24, 2.8], { cup: 128, piece: 61 }, { piece: 'medium carrot' }),
  sourcedFood('cauliflower-raw', 'Cauliflower (raw)', 'Vegetables', 'Cauliflower, raw', [25, 1.92, 4.97, 0.28, 2], { cup: 107, piece: 13 }, { piece: 'floret' }),
  sourcedFood('peas-raw', 'Green peas (raw)', 'Vegetables', 'Green peas, raw', [81, 5.42, 14.45, 0.4, 5.7], { cup: 145 }),
  sourcedFood('cucumber-raw', 'Cucumber (raw)', 'Vegetables', 'Cucumber with peel, raw', [15, 0.65, 3.63, 0.11, 0.5], { cup: 52 }),
  sourcedFood('eggplant-raw', 'Eggplant / brinjal (raw)', 'Vegetables', 'Eggplant, raw', [25, 0.98, 5.88, 0.18, 3], { cup: 82 }),
  sourcedFood('cabbage-raw', 'Cabbage (raw)', 'Vegetables', 'Cabbage, raw', [25, 1.28, 5.8, 0.1, 2.5], { cup: 89 }),
  sourcedFood('mushrooms-raw', 'Mushrooms (raw)', 'Vegetables', 'White mushrooms, raw', [22, 3.09, 3.26, 0.34, 1], { cup: 70, piece: 18 }, { piece: 'medium mushroom' }),

  sourcedFood('banana-raw', 'Banana (raw)', 'Fruits', 'Bananas, raw', [89, 1.09, 22.84, 0.33, 2.6], { cup: 150, piece: 118 }, { piece: 'medium banana' }),
  sourcedFood('apple-raw', 'Apple (raw, with skin)', 'Fruits', 'Apples, raw, with skin', [52, 0.26, 13.81, 0.17, 2.4], { cup: 125, piece: 182 }, { piece: 'medium apple' }),
  sourcedFood('orange-raw', 'Orange (raw)', 'Fruits', 'Oranges, raw, all commercial varieties', [47, 0.94, 11.75, 0.12, 2.4], { cup: 180, piece: 131 }, { piece: 'medium orange' }),
  sourcedFood('papaya-raw', 'Papaya (raw)', 'Fruits', 'Papayas, raw', [43, 0.47, 10.82, 0.26, 1.7], { cup: 145, piece: 157 }, { piece: 'small papaya' }),
  sourcedFood('mango-raw', 'Mango (raw)', 'Fruits', 'Mangos, raw', [60, 0.82, 14.98, 0.38, 1.6], { cup: 165, piece: 336 }, { piece: 'fruit portion' }),
  sourcedFood('guava-raw', 'Guava (raw)', 'Fruits', 'Guavas, common, raw', [68, 2.55, 14.32, 0.95, 5.4], { cup: 165, piece: 55 }, { piece: 'fruit portion' }),
  sourcedFood('pear-raw', 'Pear (raw)', 'Fruits', 'Pears, raw', [57, 0.36, 15.23, 0.14, 3.1], { cup: 140, piece: 178 }, { piece: 'medium pear' }),

  sourcedFood('almonds', 'Almonds', 'Additional ingredients', 'Almonds, unprepared', [579, 21.15, 21.55, 49.93, 12.5], { cup: 143, piece: 1.23 }, { piece: 'kernel' }),
  sourcedFood('peanuts-raw', 'Peanuts (raw)', 'Additional ingredients', 'Peanuts, all types, raw', [567, 25.8, 16.13, 49.24, 8.5], { cup: 146 }),
  sourcedFood('walnuts', 'Walnuts', 'Additional ingredients', 'English walnuts', [654, 15.23, 13.71, 65.21, 6.7], { cup: 117 }),
  sourcedFood('soybean-oil', 'Cooking oil (soybean oil reference)', 'Additional ingredients', 'Soybean oil, salad or cooking', [884, 0, 0, 100, 0], { cup: 218, tbsp: 13.6, tsp: 4.5, ml: 13.6 / 15 }),
  sourcedFood('butter', 'Butter, salted', 'Additional ingredients', 'Butter, salted', [717, 0.85, 0.06, 81.11, 0], { cup: 227, tbsp: 14.2 }),
  sourcedFood('ghee', 'Ghee', 'Additional ingredients', 'Clarified butter (ghee)', [900, 0, 0, 100, 0], {}),
  sourcedFood('coconut', 'Coconut (raw)', 'Additional ingredients', 'Coconut meat, raw', [354, 3.33, 15.23, 33.49, 9], { cup: 80, piece: 45 }, { piece: 'piece (2 x 2 x 1/2 in)' }),
  sourcedFood('garlic-raw', 'Garlic (raw)', 'Additional ingredients', 'Garlic, raw', [149, 6.36, 33.06, 0.5, 2.1], { cup: 136, tsp: 2.8, piece: 3 }, { piece: 'clove' }),
  sourcedFood('ginger-raw', 'Ginger (raw)', 'Additional ingredients', 'Ginger root, raw', [80, 1.82, 17.77, 0.75, 2], { cup: 24, tsp: 2 }),
  sourcedFood('lemon-raw', 'Lemon (raw)', 'Additional ingredients', 'Lemons, raw, without peel', [29, 1.1, 9.32, 0.3, 2.8], { cup: 212, piece: 58 }, { piece: 'medium lemon' }),
  sourcedFood('sugar', 'Sugar (granulated)', 'Additional ingredients', 'Granulated sugars', [387, 0, 99.98, 0, 0], { cup: 200, tsp: 4.2 }),
  sourcedFood('turmeric-ground', 'Turmeric (ground)', 'Additional ingredients', 'Turmeric, ground', [312, 9.68, 67.14, 3.25, 22.7], { tbsp: 9.4, tsp: 3 }),
  sourcedFood('cumin-seed', 'Cumin seeds', 'Additional ingredients', 'Cumin seed', [375, 17.81, 44.24, 22.27, 10.5], { tbsp: 6, tsp: 2.1 }),
]

export function normalizeCustomIngredients(saved) {
  if (!Array.isArray(saved)) return []
  const builtInIds = new Set(INGREDIENTS.map(({ id }) => id))
  const seenIds = new Set()
  return saved.filter((ingredient) => {
    if (!ingredient
      || typeof ingredient.id !== 'string'
      || !ingredient.id.startsWith('custom:')
      || builtInIds.has(ingredient.id)
      || seenIds.has(ingredient.id)
      || typeof ingredient.name !== 'string'
      || !ingredient.name.trim()
      || !FOOD_CATEGORIES.includes(ingredient.category)
      || !ingredient.nutrientsPer100g
      || typeof ingredient.nutrientsPer100g !== 'object'
      || Array.isArray(ingredient.nutrientsPer100g)) return false
    const validNutrients = NUTRIENT_KEYS.every((key) => (
      ingredient.nutrientsPer100g[key] === null
      || (Number.isFinite(ingredient.nutrientsPer100g[key]) && ingredient.nutrientsPer100g[key] >= 0)
    ))
    if (!validNutrients || !ingredient.unitGrams || ingredient.unitGrams.g !== 1) return false
    seenIds.add(ingredient.id)
    return true
  })
}

export function normalizeRecipes(saved) {
  if (!Array.isArray(saved)) return []
  const ids = new Set()
  return saved.filter((recipe) => {
    if (!recipe
      || typeof recipe.id !== 'string'
      || !recipe.id
      || ids.has(recipe.id)
      || typeof recipe.name !== 'string'
      || !recipe.name.trim()
      || !Array.isArray(recipe.ingredients)
      || !recipe.ingredients.length) return false
    const validIngredients = recipe.ingredients.every((item) => (
      item
      && typeof item.ingredientId === 'string'
      && Number.isFinite(item.quantity)
      && item.quantity > 0
      && typeof item.unit === 'string'
    ))
    if (!validIngredients) return false
    ids.add(recipe.id)
    return true
  })
}

export function findIngredient(ingredientId, customIngredients = []) {
  return INGREDIENTS.find(({ id }) => id === ingredientId)
    ?? customIngredients.find(({ id }) => id === ingredientId)
    ?? null
}

export function getIngredientGrams(ingredient, quantity, unit) {
  if (!ingredient || !Number.isFinite(quantity) || quantity < 0) return null
  const gramsPerUnit = ingredient.unitGrams?.[unit]
  return Number.isFinite(gramsPerUnit) && gramsPerUnit > 0 ? quantity * gramsPerUnit : null
}

function rounded(value) {
  return Number(value.toFixed(1))
}

export function calculateNutrition(items, customIngredients = []) {
  const rows = items.map((item) => {
    const ingredient = findIngredient(item.ingredientId, customIngredients)
    const grams = getIngredientGrams(ingredient, item.quantity, item.unit)
    const nutrients = Object.fromEntries(NUTRIENT_KEYS.map((key) => {
      const per100g = ingredient?.nutrientsPer100g?.[key]
      return [key, Number.isFinite(per100g) && Number.isFinite(grams)
        ? rounded((per100g * grams) / 100)
        : null]
    }))
    return { ...item, ingredient, grams, nutrients }
  })
  const totalNutrition = Object.fromEntries(NUTRIENT_KEYS.map((key) => {
    if (rows.some(({ nutrients }) => !Number.isFinite(nutrients[key]))) return [key, null]
    return [key, rounded(rows.reduce((total, { nutrients }) => total + nutrients[key], 0))]
  }))
  const totalWeightG = rows.every(({ grams }) => Number.isFinite(grams))
    ? rounded(rows.reduce((total, { grams }) => total + grams, 0))
    : null
  return { rows, totalNutrition, totalWeightG }
}
