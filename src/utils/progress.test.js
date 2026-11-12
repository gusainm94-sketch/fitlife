import assert from 'node:assert/strict'
import test from 'node:test'
import { DAILY_HABITS } from '../data/dailyTrackers.js'
import { WEEKDAYS, WEEKLY_WORKOUTS } from '../data/workouts.js'
import {
  BADGE_UPDATE_EVENT,
  REWARDS_STORAGE_KEY,
  getBadgeEligibility,
  getCompletedWorkoutSessions,
  getEligibleBadgeIds,
  getWeekId,
  getWorkoutProgress,
  loadEarnedBadgeIds,
  saveNewlyEarnedBadges,
} from './progress.js'

function completeOneWorkout(workoutProgress, mode, weekId, dayIndex) {
  const dayId = WEEKDAYS[dayIndex].id
  workoutProgress[mode] ??= {}
  workoutProgress[mode][weekId] ??= {}
  workoutProgress[mode][weekId][dayId] = Object.fromEntries(
    WEEKLY_WORKOUTS[mode][dayIndex].exercises.map(({ id }) => [id, true]),
  )
}

test('current-week metrics reflect only fully completed saved workout days', () => {
  const monday = new Date(2026, 10, 9)
  const weekId = getWeekId(monday)
  const saved = {}
  completeOneWorkout(saved, 'gym', weekId, 0)

  const metrics = getWorkoutProgress(saved, monday)
  assert.equal(metrics.dailyPercent, 100)
  assert.equal(metrics.completedDays, 1)
  assert.equal(metrics.plannedDays, 6)
  assert.equal(metrics.completedSessions, 1)
  assert.equal(metrics.activityByDay[0].completed, true)
  assert.equal(metrics.activityByDay[1].completed, false)
  assert.equal(getCompletedWorkoutSessions(saved).length, 1)
})

test('partial workouts do not count as completed sessions', () => {
  const weekId = getWeekId(new Date(2026, 10, 9))
  const saved = { gym: { [weekId]: { monday: { [WEEKLY_WORKOUTS.gym[0].exercises[0].id]: true } } } }
  assert.equal(getCompletedWorkoutSessions(saved).length, 0)
  assert.equal(getWorkoutProgress(saved, new Date(2026, 10, 9)).dailyPercent, 25)
})

test('rest days are not represented as failed workout completion', () => {
  const sunday = new Date(2026, 10, 15)
  assert.equal(getWorkoutProgress({}, sunday).dailyPercent, null)
})

test('badge thresholds unlock only when their stated conditions are met', () => {
  assert.deepEqual(getBadgeEligibility({ completedWorkouts: 0, waterMl: 1999, completedHabitCount: 4 }), {
    'first-workout': false,
    'hydration-hero': false,
    'habit-builder': false,
    'workout-champion': false,
  })
  assert.deepEqual(getBadgeEligibility({ completedWorkouts: 5, waterMl: 2000, completedHabitCount: 5 }), {
    'first-workout': true,
    'hydration-hero': true,
    'habit-builder': true,
    'workout-champion': true,
  })
})

test('eligible badges use saved workout, water and habit values', () => {
  const weekId = getWeekId(new Date(2026, 10, 9))
  const workoutProgress = {}
  for (let day = 0; day < 5; day += 1) completeOneWorkout(workoutProgress, 'gym', weekId, day)
  const waterRecord = { data: { totalMl: 2000 } }
  const habitRecord = { data: Object.fromEntries(DAILY_HABITS.map(({ id }) => [id, true])) }
  assert.deepEqual(getEligibleBadgeIds({ workoutProgress, waterRecord, habitRecord }), [
    'first-workout', 'hydration-hero', 'habit-builder', 'workout-champion',
  ])
})

test('earned badges persist in local storage and are not duplicated', () => {
  const stored = new Map()
  const events = []
  globalThis.window = {
    localStorage: {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => stored.set(key, value),
    },
    dispatchEvent: (event) => events.push(event.type),
  }
  try {
    const progress = {}
    const weekId = getWeekId(new Date(2026, 10, 9))
    completeOneWorkout(progress, 'gym', weekId, 0)
    saveNewlyEarnedBadges({ workoutProgress: progress })
    saveNewlyEarnedBadges({ workoutProgress: progress })

    assert.deepEqual(loadEarnedBadgeIds(), ['first-workout'])
    assert.deepEqual(JSON.parse(stored.get(REWARDS_STORAGE_KEY)), ['first-workout'])
    assert.deepEqual(events, [BADGE_UPDATE_EVENT])
  } finally {
    delete globalThis.window
  }
})
