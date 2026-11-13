import assert from 'node:assert/strict'
import test from 'node:test'
import {
  migrateLegacyAccountData,
  readLocalJson,
  writeLocalJson,
  getAccountStorageKey,
  SESSION_STORAGE_KEY,
} from './localStorage.js'

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
