import assert from 'node:assert/strict'
import test from 'node:test'
import { SESSION_STORAGE_KEY, readLocalJson, writeLocalJson } from '../utils/localStorage.js'
import {
  FITNESS_TRACKER_STORAGE_KEY,
  createFitnessTrackerRecord,
  getFitnessTrackerCalorieActivities,
  getFitnessTrackerDailySummary,
  getFitnessTrackerHistory,
  getFitnessTrackerWorkoutMinutes,
  isFitnessTrackerRecord,
  normalizeFitnessTrackerRecords,
} from './fitnessTracker.js'

function createStorage(values = {}) {
  const entries = new Map(Object.entries(values))
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
  }
}

test('fitness records validate non-negative measurements and allow historical dates', () => {
  const record = createFitnessTrackerRecord({
    id: 'one',
    date: '2026-11-13',
    steps: '1200',
    heartRateBpm: '72',
    activeMinutes: '30',
    sleepMinutes: 450,
    workoutMinutes: '25',
    caloriesKcal: '210',
  })

  assert.equal(isFitnessTrackerRecord(record), true)
  assert.equal(isFitnessTrackerRecord({ ...record, steps: -1 }), false)
  assert.equal(isFitnessTrackerRecord({ ...record, heartRateBpm: 300 }), false)
  assert.equal(isFitnessTrackerRecord({ ...record, date: '2026-02-30' }), false)
  assert.equal(isFitnessTrackerRecord({ id: 'empty', date: '2026-11-13', steps: null }), false)
  assert.equal(normalizeFitnessTrackerRecords([record, record]).length, 1)
})

test('daily summaries total movement, average recorded heart rate, and preserve manual calories', () => {
  const records = [
    createFitnessTrackerRecord({ id: 'a', date: '2026-11-13', steps: 1000, heartRateBpm: 70, workoutMinutes: 20, caloriesKcal: 125 }),
    createFitnessTrackerRecord({ id: 'b', date: '2026-11-13', steps: 500, heartRateBpm: 80, activeMinutes: 35, sleepMinutes: 420, caloriesKcal: 75 }),
    createFitnessTrackerRecord({ id: 'c', date: '2026-11-12', steps: 900, heartRateBpm: null }),
  ]
  const summary = getFitnessTrackerDailySummary(records, '2026-11-13')

  assert.deepEqual(summary, {
    recordCount: 2,
    stepsReadings: 2,
    steps: 1500,
    heartRateReadings: 2,
    averageHeartRateBpm: 75,
    activeMinutesReadings: 1,
    activeMinutes: 35,
    sleepReadings: 1,
    sleepMinutes: 420,
    workoutMinutesReadings: 1,
    workoutMinutes: 20,
    caloriesReadings: 2,
    caloriesKcal: 200,
  })
  assert.equal(getFitnessTrackerWorkoutMinutes(records, '2026-11-13'), 20)
  assert.deepEqual(getFitnessTrackerHistory(records).map(({ date }) => date), ['2026-11-12', '2026-11-13'])

  const calorieEntries = getFitnessTrackerCalorieActivities(records)
  assert.deepEqual(calorieEntries.map(({ id, caloriesKcal, source }) => [id, caloriesKcal, source]), [
    ['fitness-tracker:a', 125, 'smartwatch'],
    ['fitness-tracker:b', 75, 'smartwatch'],
  ])
})

test('fitness records persist separately per signed-in account', () => {
  const storage = createStorage({ [SESSION_STORAGE_KEY]: JSON.stringify({ userId: 'account-a' }) })
  globalThis.window = { localStorage: storage }
  const record = createFitnessTrackerRecord({ id: 'account-a-entry', date: '2026-11-13', steps: 1234 })

  try {
    assert.equal(writeLocalJson(FITNESS_TRACKER_STORAGE_KEY, [record]), true)
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ userId: 'account-b' }))
    assert.deepEqual(readLocalJson(FITNESS_TRACKER_STORAGE_KEY, []), [])
    assert.equal(writeLocalJson(FITNESS_TRACKER_STORAGE_KEY, []), true)
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ userId: 'account-a' }))
    assert.deepEqual(readLocalJson(FITNESS_TRACKER_STORAGE_KEY, []), [record])
  } finally {
    delete globalThis.window
  }
})
