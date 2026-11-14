import assert from 'node:assert/strict'
import test from 'node:test'
import { SESSION_STORAGE_KEY, readLocalJson, writeLocalJson } from '../utils/localStorage.js'
import {
  ACTIVITY_METS,
  CALORIE_ACTIVITIES_STORAGE_KEY,
  createCalorieActivity,
  estimateCaloriesBurned,
  getCaloriePeriodTotals,
  getCompletedWorkoutCalorieActivities,
  getProfileCalorieWeight,
  getRecentDailyCalorieTotals,
  isCalorieActivity,
  mergeCalorieActivities,
  parseExerciseDuration,
  updateCalorieActivityDurationRecord,
} from './calories.js'
import { WEEKLY_WORKOUTS } from './workouts.js'

function createStorage(values = {}) {
  const entries = new Map(Object.entries(values))
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    entries,
  }
}

test('MET estimates respond to activity, duration, intensity, and weight', () => {
  const walking = estimateCaloriesBurned({
    activity: 'Walking',
    durationMinutes: 30,
    intensity: 'Moderate',
    weightKg: 70,
  })
  const running = estimateCaloriesBurned({
    activity: 'Running',
    durationMinutes: 30,
    intensity: 'Moderate',
    weightKg: 70,
  })

  assert.equal(walking, Math.round(ACTIVITY_METS.Walking.Moderate * 3.5 * 70 / 200 * 30))
  assert.ok(running > walking)
  assert.ok(estimateCaloriesBurned({ activity: 'Walking', durationMinutes: 60, intensity: 'Moderate', weightKg: 70 }) > walking)
  assert.ok(estimateCaloriesBurned({ activity: 'Walking', durationMinutes: 30, intensity: 'High', weightKg: 70 }) > walking)
  assert.ok(estimateCaloriesBurned({ activity: 'Walking', durationMinutes: 30, intensity: 'Moderate', weightKg: 90 }) > walking)
})

test('invalid or missing weight, duration, activity, and intensity never produce a calorie value', () => {
  for (const weightKg of [null, 0, 29, 351, Number.NaN]) {
    assert.equal(estimateCaloriesBurned({ activity: 'Walking', durationMinutes: 30, intensity: 'Moderate', weightKg }), null)
  }
  assert.equal(estimateCaloriesBurned({ activity: 'Walking', durationMinutes: 0, intensity: 'Moderate', weightKg: 70 }), null)
  assert.equal(estimateCaloriesBurned({ activity: 'Unknown', durationMinutes: 30, intensity: 'Moderate', weightKg: 70 }), null)
  assert.equal(estimateCaloriesBurned({ activity: 'Walking', durationMinutes: 30, intensity: 'Extreme', weightKg: 70 }), null)
})

test('sample profile weight is not used until the user confirms a profile measurement', () => {
  assert.equal(getProfileCalorieWeight({ weight: 70, weightConfirmed: false }), null)
  assert.equal(getProfileCalorieWeight({ weight: 70, weightConfirmed: true }), 70)
  assert.equal(getProfileCalorieWeight({ weight: null, weightConfirmed: true }), null)
})

test('manual entries keep activity data without fabricating an estimate for missing weight', () => {
  const missingWeight = createCalorieActivity({
    id: 'manual:no-weight',
    activity: 'Yoga',
    durationMinutes: 30,
    intensity: 'Low',
    date: '2026-11-14',
    weightKg: null,
  })
  const estimated = createCalorieActivity({
    ...missingWeight,
    id: 'manual:with-weight',
    weightKg: 70,
  })
  const edited = updateCalorieActivityDurationRecord(estimated, 60)

  assert.equal(missingWeight.caloriesKcal, null)
  assert.equal(missingWeight.weightKg, null)
  assert.equal(isCalorieActivity(missingWeight), true)
  assert.ok(estimated.caloriesKcal > 0)
  assert.ok(edited.caloriesKcal > estimated.caloriesKcal)
  assert.equal(updateCalorieActivityDurationRecord(estimated, 0), null)
})

test('timed durations parse only when unambiguous', () => {
  assert.equal(parseExerciseDuration('20 min'), 20)
  assert.equal(parseExerciseDuration('30 seconds'), 0.5)
  assert.equal(parseExerciseDuration('10–15 min'), null)
  assert.equal(parseExerciseDuration(''), null)
})

test('completed workouts generate estimates only for explicitly timed activities and deduplicate by workout identity', () => {
  const weekId = '2026-11-09'
  const plan = WEEKLY_WORKOUTS.home[2]
  const workoutProgress = {
    home: {
      [weekId]: {
        wednesday: Object.fromEntries(plan.exercises.map(({ id }) => [id, true])),
      },
    },
  }
  const first = getCompletedWorkoutCalorieActivities(workoutProgress, 70)
  const repeated = getCompletedWorkoutCalorieActivities(workoutProgress, 70)
  const merged = mergeCalorieActivities(first, repeated)

  assert.deepEqual(first.map(({ activity, durationMinutes, date }) => [activity, durationMinutes, date]), [
    ['Walking', 20, '2026-11-11'],
    ['Yoga', 10, '2026-11-11'],
  ])
  assert.ok(first.every((record) => record.source === 'workout' && isCalorieActivity(record)))
  assert.equal(merged.length, first.length)
  assert.deepEqual(getCompletedWorkoutCalorieActivities(workoutProgress, null), [])
})

test('daily, weekly, monthly, and recent totals use saved estimates without inventing missing values', () => {
  const activities = [
    { id: 'a', activity: 'Walking', durationMinutes: 20, intensity: 'Low', date: '2026-11-09', caloriesKcal: 100, weightKg: 70, source: 'manual' },
    { id: 'a', activity: 'Walking', durationMinutes: 20, intensity: 'Low', date: '2026-11-09', caloriesKcal: 100, weightKg: 70, source: 'manual' },
    { id: 'b', activity: 'Yoga', durationMinutes: 20, intensity: 'Moderate', date: '2026-11-11', caloriesKcal: 130, weightKg: 70, source: 'manual' },
    { id: 'c', activity: 'Other', durationMinutes: 15, intensity: 'Low', date: '2026-11-02', caloriesKcal: 170, weightKg: 70, source: 'manual' },
    { id: 'd', activity: 'Running', durationMinutes: 15, intensity: 'High', date: '2026-10-28', caloriesKcal: 99, weightKg: 70, source: 'manual' },
    { id: 'e', activity: 'Walking', durationMinutes: 10, intensity: 'Moderate', date: '2026-11-11', caloriesKcal: null, weightKg: null, source: 'manual' },
  ]

  assert.deepEqual(getCaloriePeriodTotals(activities, '2026-11-11'), { today: 130, week: 230, month: 400 })
  assert.deepEqual(getRecentDailyCalorieTotals(activities, '2026-11-11').map(({ calories }) => calories), [0, 0, 0, 0, 100, 0, 130])
})

test('fitness tracker calorie entries integrate as manual values without becoming workout estimates', () => {
  const trackerEntry = {
    id: 'fitness-tracker:entry',
    activity: 'Other',
    activityName: 'Manually entered fitness tracker calories',
    durationMinutes: null,
    intensity: null,
    date: '2026-11-11',
    weightKg: null,
    caloriesKcal: 175,
    source: 'smartwatch',
  }

  assert.equal(isCalorieActivity(trackerEntry), true)
  assert.equal(isCalorieActivity({ ...trackerEntry, caloriesKcal: -1 }), false)
  const merged = mergeCalorieActivities([trackerEntry], [trackerEntry])
  assert.equal(merged.length, 1)
  assert.deepEqual(getCaloriePeriodTotals(merged, '2026-11-11'), { today: 175, week: 175, month: 175 })
})

test('activity records persist across dates and remain scoped to the signed-in account', () => {
  const storage = createStorage({ [SESSION_STORAGE_KEY]: JSON.stringify({ userId: 'account-a' }) })
  globalThis.window = { localStorage: storage }
  const oldActivity = {
    id: 'manual:historic',
    activity: 'Walking',
    durationMinutes: 25,
    intensity: 'Moderate',
    date: '2026-01-03',
    weightKg: 70,
    caloriesKcal: 150,
    source: 'manual',
  }

  try {
    assert.equal(writeLocalJson(CALORIE_ACTIVITIES_STORAGE_KEY, [oldActivity]), true)
    storage.entries.set(SESSION_STORAGE_KEY, JSON.stringify({ userId: 'account-b' }))
    assert.deepEqual(readLocalJson(CALORIE_ACTIVITIES_STORAGE_KEY, []), [])
    assert.equal(writeLocalJson(CALORIE_ACTIVITIES_STORAGE_KEY, []), true)
    storage.entries.set(SESSION_STORAGE_KEY, JSON.stringify({ userId: 'account-a' }))
    assert.deepEqual(readLocalJson(CALORIE_ACTIVITIES_STORAGE_KEY, []), [oldActivity])
  } finally {
    delete globalThis.window
  }
})
