import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeProfile, PROFILE_STORAGE_KEY, SMARTWATCH_OPTIONS } from './profile.js'
import { readLocalJson, SESSION_STORAGE_KEY, writeLocalJson } from '../utils/localStorage.js'

function createStorage(values = {}) {
  const entries = new Map(Object.entries(values))
  return {
    getItem(key) {
      return entries.get(key) ?? null
    },
    setItem(key, value) {
      entries.set(key, value)
    },
    entries,
  }
}

test('older profile records receive safe defaults and keep existing measurements', () => {
  const profile = normalizeProfile({
    name: 'Taylor',
    age: 31,
    height: 168,
    weight: 64,
    goal: 'Build strength',
    fitnessLevel: 'Intermediate',
  })

  assert.equal(profile.name, 'Taylor')
  assert.equal(profile.height, 168)
  assert.equal(profile.weight, 64)
  assert.equal(profile.weightConfirmed, true)
  assert.equal(profile.goal, 'Strength')
  assert.equal(profile.fitnessLevel, 'Intermediate')
  assert.equal(profile.gender, '')
  assert.equal(profile.dietPreference, '')
  assert.equal(profile.smokingStatus, '')
  assert.equal(profile.smartwatchAvailability, '')
  assert.deepEqual(profile.injuryAreas, [])
  assert.equal(profile.injuryDescription, '')
  assert.equal(profile.avatar, '')
})

test('optional measurements and sensitive profile details can be left blank', () => {
  const profile = normalizeProfile({
    ...normalizeProfile(null, 'Taylor'),
    age: null,
    height: null,
    weight: null,
    gender: '',
    goal: '',
    fitnessLevel: '',
    dietPreference: '',
    smokingStatus: '',
    smartwatchAvailability: '',
    injuryAreas: [],
    injuryDescription: '',
    avatar: '',
  })

  assert.equal(profile.age, null)
  assert.equal(profile.height, null)
  assert.equal(profile.weight, null)
  assert.equal(profile.weightConfirmed, false)
  assert.equal(profile.gender, '')
  assert.equal(profile.goal, '')
  assert.equal(profile.fitnessLevel, '')
  assert.equal(profile.avatar, '')
})

test('profile choices are validated and injury details are bounded', () => {
  const profile = normalizeProfile({
    gender: 'unknown',
    dietPreference: 'unknown',
    smokingStatus: 'unknown',
    smartwatchAvailability: 'sometimes',
    avatar: 'external-image',
    injuryAreas: ['Shoulder', 'Unknown', 'Knee', 'Shoulder'],
    injuryDescription: 'x'.repeat(350),
  })

  test('profile device selection supports all tracker options and preserves legacy choices', () => {
    assert.deepEqual(SMARTWATCH_OPTIONS, [
      'Apple Watch',
      'Wear OS Smartwatch',
      'Fitbit',
      'Garmin',
      'Other',
      'No Smartwatch',
    ])
    for (const option of SMARTWATCH_OPTIONS) {
      assert.equal(normalizeProfile({ smartwatchAvailability: option }).smartwatchAvailability, option)
    }
    assert.equal(normalizeProfile({ smartwatchAvailability: 'Yes' }).smartwatchAvailability, 'Yes')
    assert.equal(normalizeProfile({ smartwatchAvailability: 'No' }).smartwatchAvailability, 'No')
  })

  assert.equal(profile.gender, '')
  assert.equal(profile.dietPreference, '')
  assert.equal(profile.smokingStatus, '')
  assert.equal(profile.smartwatchAvailability, '')
  assert.equal(profile.avatar, '')
  assert.deepEqual(profile.injuryAreas, ['Shoulder', 'Knee'])
  assert.equal(profile.injuryDescription.length, 300)
})

test('legacy injury notes migrate to the optional description', () => {
  const profile = normalizeProfile({ injuries: 'Old note', injuryAreas: ['Back'] })
  assert.deepEqual(profile.injuryAreas, ['Back'])
  assert.equal(profile.injuryDescription, 'Old note')
})

test('profile records stay isolated per signed-in account and retain avatar choices', () => {
  const storage = createStorage({
    [SESSION_STORAGE_KEY]: JSON.stringify({ userId: 'account-a' }),
  })
  globalThis.window = { localStorage: storage }

  try {
    const profileA = normalizeProfile({
      ...normalizeProfile(null, 'Taylor'),
      avatar: 'female',
      injuryAreas: ['Shoulder'],
      injuryDescription: 'Avoid overhead movement',
    })
    assert.equal(writeLocalJson(PROFILE_STORAGE_KEY, profileA), true)
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ userId: 'account-b' }))
    assert.equal(readLocalJson(PROFILE_STORAGE_KEY, null), null)

    const profileB = normalizeProfile({
      ...normalizeProfile(null, 'Jordan'),
      avatar: 'male',
      injuryAreas: ['Knee'],
      injuryDescription: 'Recent strain',
    })
    assert.equal(writeLocalJson(PROFILE_STORAGE_KEY, profileB), true)
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ userId: 'account-a' }))
    assert.equal(readLocalJson(PROFILE_STORAGE_KEY, null).avatar, 'female')
    assert.deepEqual(readLocalJson(PROFILE_STORAGE_KEY, null).injuryAreas, ['Shoulder'])
    assert.equal(readLocalJson(PROFILE_STORAGE_KEY, null).injuryDescription, 'Avoid overhead movement')
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ userId: 'account-b' }))
    assert.equal(readLocalJson(PROFILE_STORAGE_KEY, null).avatar, 'male')
    assert.deepEqual(readLocalJson(PROFILE_STORAGE_KEY, null).injuryAreas, ['Knee'])
    assert.equal(readLocalJson(PROFILE_STORAGE_KEY, null).injuryDescription, 'Recent strain')
  } finally {
    delete globalThis.window
  }
})
