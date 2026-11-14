import assert from 'node:assert/strict'
import test from 'node:test'
import {
  migrateLegacyAccountData,
  readLocalJson,
  writeLocalJson,
  getAccountStorageKey,
  SESSION_STORAGE_KEY,
} from './localStorage.js'
import { EQUIPMENT_PREFERENCES_STORAGE_KEY } from '../data/equipment.js'

function createStorage(values = {}) {
  return {
    ...values,
    getItem(key) {
      return Object.hasOwn(this, key) ? this[key] : null
    },
    setItem(key, value) {
      this[key] = value
    },
  }
}

test('fitness storage keys are account-scoped while the theme remains shared', () => {
  const storage = createStorage({
    [SESSION_STORAGE_KEY]: JSON.stringify({ userId: 'account-a' }),
  })
  globalThis.window = { localStorage: storage }

  try {
    assert.equal(getAccountStorageKey('fitlife.profile.v1'), 'fitlife.user.account-a.fitlife.profile.v1')
    assert.equal(getAccountStorageKey('fitlife.theme'), 'fitlife.theme')
    writeLocalJson('fitlife.profile.v1', { name: 'Taylor' })
    assert.deepEqual(readLocalJson('fitlife.profile.v1', null), { name: 'Taylor' })
    assert.equal(storage['fitlife.profile.v1'], undefined)
  } finally {
    delete globalThis.window
  }
})

test('equipment preferences are isolated between accounts and load again on return', () => {
  const storage = createStorage({
    [SESSION_STORAGE_KEY]: JSON.stringify({ userId: 'account-a' }),
  })
  globalThis.window = { localStorage: storage }

  try {
    writeLocalJson(EQUIPMENT_PREFERENCES_STORAGE_KEY, { gym: ['dumbbells'], home: ['yoga-mat'] })
    storage[SESSION_STORAGE_KEY] = JSON.stringify({ userId: 'account-b' })
    assert.deepEqual(readLocalJson(EQUIPMENT_PREFERENCES_STORAGE_KEY, null), null)
    writeLocalJson(EQUIPMENT_PREFERENCES_STORAGE_KEY, { gym: ['barbells'], home: ['treadmill'] })
    storage[SESSION_STORAGE_KEY] = JSON.stringify({ userId: 'account-a' })
    assert.deepEqual(readLocalJson(EQUIPMENT_PREFERENCES_STORAGE_KEY, null), { gym: ['dumbbells'], home: ['yoga-mat'] })
  } finally {
    delete globalThis.window
  }
})

test('first account migration copies existing fitness data and applies the signup name', () => {
  const storage = createStorage({
    'fitlife.profile.v1': JSON.stringify({ name: 'Old name', weight: 72 }),
    'fitlife.workouts.v1': JSON.stringify({ gym: {}, home: {} }),
    'fitlife-diet-plan-2026-11-13': JSON.stringify({ breakfast: 'poha' }),
    'fitlife.theme': JSON.stringify('dark'),
  })
  globalThis.window = { localStorage: storage }

  try {
    assert.equal(migrateLegacyAccountData('account-a', 'Taylor'), true)
    assert.deepEqual(
      JSON.parse(storage['fitlife.user.account-a.fitlife.profile.v1']),
      { name: 'Taylor', weight: 72 },
    )
    assert.equal(
      storage['fitlife.user.account-a.fitlife-diet-plan-2026-11-13'],
      storage['fitlife-diet-plan-2026-11-13'],
    )
    assert.equal(storage['fitlife.user.account-a.fitlife.theme'], undefined)
  } finally {
    delete globalThis.window
  }
})

test('legacy migration includes tracker, nutrition, membership, and music data without overwriting account values', () => {
  const storage = createStorage({
    'fitlife.calorie-activities.v1': JSON.stringify([{ id: 'legacy-activity' }]),
    'fitlife.diet-charts.v1': JSON.stringify([{ id: 'legacy-chart' }]),
    'fitlife.diet-preferences.v1': JSON.stringify({ mealsPerDay: 4 }),
    'fitlife.diet-prices.v1': JSON.stringify({ 'meal:poha': 20 }),
    'fitlife.music-favorites.v1': JSON.stringify(['playlist-1']),
    'fitlife.nutrition-recipes.v1': JSON.stringify([{ id: 'legacy-recipe' }]),
    'fitlife.membership.v1': JSON.stringify({ plan: 'Premium' }),
    'fitlife.user.account-a.fitlife.diet-charts.v1': JSON.stringify([{ id: 'account-chart' }]),
    'fitlife.user.account-a.fitlife.music-favorites.v1': JSON.stringify(['account-playlist']),
  })
  globalThis.window = { localStorage: storage }

  try {
    assert.equal(migrateLegacyAccountData('account-a', 'Taylor'), true)
    assert.equal(storage['fitlife.user.account-a.fitlife.calorie-activities.v1'], storage['fitlife.calorie-activities.v1'])
    assert.equal(storage['fitlife.user.account-a.fitlife.nutrition-recipes.v1'], storage['fitlife.nutrition-recipes.v1'])
    assert.equal(storage['fitlife.user.account-a.fitlife.diet-preferences.v1'], storage['fitlife.diet-preferences.v1'])
    assert.equal(storage['fitlife.user.account-a.fitlife.diet-prices.v1'], storage['fitlife.diet-prices.v1'])
    assert.equal(storage['fitlife.user.account-a.fitlife.membership.v1'], storage['fitlife.membership.v1'])
    assert.deepEqual(
      JSON.parse(storage['fitlife.user.account-a.fitlife.diet-charts.v1']),
      [{ id: 'account-chart' }],
    )
    assert.deepEqual(
      JSON.parse(storage['fitlife.user.account-a.fitlife.music-favorites.v1']),
      ['account-playlist'],
    )
  } finally {
    delete globalThis.window
  }
})
