import assert from 'node:assert/strict'
import test from 'node:test'
import {
  addFoodIntakeRecord,
  createFoodIntakeRecord,
  getFoodIntakeCaloriesForDate,
  normalizeFoodIntake,
} from './foodIntake.js'

const nutrients = { caloriesKcal: 250, proteinG: 12, carbsG: 30, fatG: 8, fiberG: 5 }
const recipe = { id: 'recipe:meal', name: 'Lentil bowl' }

test('food intake is created only as an explicit record and duplicate logs are ignored', () => {
  const record = createFoodIntakeRecord({ recipe, category: 'lunch', date: '2026-11-14', nutrients })
  const firstSave = addFoodIntakeRecord([], record)
  const duplicateSave = addFoodIntakeRecord(firstSave, record)

  assert.equal(firstSave.length, 1)
  assert.equal(duplicateSave.length, 1)
  assert.equal(record.caloriesKcal, 250)
  assert.equal(createFoodIntakeRecord({ recipe, category: 'lunch', date: 'invalid', nutrients }), null)
})

test('food intake totals count valid logged values once and leave unavailable calories out', () => {
  const record = createFoodIntakeRecord({ recipe, category: 'lunch', date: '2026-11-14', nutrients })
  const unknown = createFoodIntakeRecord({
    recipe: { id: 'recipe:unknown', name: 'Unmeasured recipe' },
    category: 'dinner',
    date: '2026-11-14',
    nutrients: { caloriesKcal: null, proteinG: null, carbsG: null, fatG: null, fiberG: null },
  })

  assert.equal(getFoodIntakeCaloriesForDate([record, record, unknown], '2026-11-14'), 250)
  assert.equal(normalizeFoodIntake([{ ...record, caloriesKcal: -5 }]).length, 0)
  assert.equal(getFoodIntakeCaloriesForDate([record], '2026-11-13'), 0)
})
