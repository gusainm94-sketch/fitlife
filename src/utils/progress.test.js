import assert from 'node:assert/strict'
import test from 'node:test'
import { DAILY_HABITS } from '../data/dailyTrackers.js'
import { GYM_DIFFICULTIES, GYM_WORKOUTS, WEEKDAYS, WEEKLY_WORKOUTS } from '../data/workouts.js'
import {
  BADGE_UPDATE_EVENT,
  REWARDS_STORAGE_KEY,
  buildDailyProgressRecords,
  getBadgeEligibility,
  getCompletedWorkoutSessions,
  getEligibleBadgeIds,
  getProgressPeriodSummary,
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

test('daily and period history uses saved dates and meal estimates without filling gaps', () => {
  const monday = new Date(2026, 10, 9)
  const weekId = getWeekId(monday)
  const workouts = {}
  completeOneWorkout(workouts, 'gym', weekId, 0)
  const waterHistory = {
    '2026-11-10': { date: '2026-11-10', data: { totalMl: 1250 } },
  }
  const habitHistory = {
    '2026-11-10': { date: '2026-11-10', data: { 'morning-walk': true, exercise: true } },
  }
  const records = buildDailyProgressRecords({
    waterHistory,
    habitHistory,
    mealHistory: {
      '2026-11-09': { breakfast: 'poha', lunch: 'rajma-chawal' },
      '2026-11-12': { dinner: 'dal-khichdi' },
    },
    workoutProgress: workouts,
  })

  assert.deepEqual(records.map(({ date }) => date), ['2026-11-09', '2026-11-10', '2026-11-12'])
  assert.equal(records[0].caloriesConsumedKcal, 800)
  assert.equal(records[0].completedWorkout, true)
  assert.equal(records[0].workoutPercent, 100)
  assert.equal(records[0].completedExercises, 4)
  assert.equal(records[1].waterMl, 1250)
  assert.equal(records[1].completedHabits, 2)

  const summary = getProgressPeriodSummary(records, '2026-11-09', '2026-11-12')
  assert.deepEqual(summary, {
    trackedDays: 3,
    caloriesConsumedKcal: 1230,
    caloriesBurnedKcal: 0,
    completedWorkouts: 1,
    completedExercises: 4,
    averageWaterMl: 417,
    averageHabitPercent: 13,
  })
})

test('gym levels keep the six-day split, complete rest day, and unique exercise progress', () => {
  const expectedCategories = ['Upper Body', 'Lower Body', 'Recovery', 'Full Body', 'Conditioning', 'Mobility', 'Rest']
  const allExerciseIds = new Set()

  for (const level of GYM_DIFFICULTIES) {
    const plans = GYM_WORKOUTS[level]
    assert.deepEqual(plans.map(({ focus }) => focus), expectedCategories)
    assert.equal(plans[6].title, 'Complete Rest')
    assert.equal(plans[6].exercises.length, 0)
    assert.ok(plans.slice(0, 6).every(({ exercises }) => exercises.length === 4))

    for (const plan of plans) {
      for (const item of plan.exercises) {
        assert.equal(allExerciseIds.has(item.id), false)
        allExerciseIds.add(item.id)
      }
    }
  }

  assert.deepEqual(
    GYM_WORKOUTS.Beginner[0].exercises.map(({ name, sets, reps }) => [name, sets, reps]),
    [
      ['Machine Chest Press', 3, '10–12 reps'],
      ['Lat Pulldown', 3, '10–12 reps'],
      ['Seated Cable Row', 3, '10–12 reps'],
      ['Machine Shoulder Press', 2, '10–12 reps'],
    ],
  )
  assert.deepEqual(
    GYM_WORKOUTS.Intermediate[4].exercises.map(({ name, sets, reps }) => [name, sets, reps]),
    [
      ['Rowing Intervals', 5, '1 minute'],
      ['Assault Bike', 5, '1 minute'],
      ['Stair Climber', 1, '10–15 minutes'],
      ['Battle Ropes', 4, '30 seconds'],
    ],
  )
  assert.deepEqual(
    GYM_WORKOUTS.Advanced[4].exercises.map(({ name, sets, reps }) => [name, sets, reps]),
    [
      ['Treadmill Sprint', 6, '20–30 seconds'],
      ['Assault Bike Sprint', 6, '20–30 seconds'],
      ['Sled Push', 5, '20–30 metres'],
      ['Battle Ropes', 5, '30 seconds'],
    ],
  )
})

test('gym completion stays separate by difficulty and counts unique weekly days', () => {
  const monday = new Date(2026, 10, 9)
  const weekId = getWeekId(monday)
  const workoutProgress = { gym: {}, home: {} }

  for (const level of ['Beginner', 'Advanced']) {
    workoutProgress.gym[level] = {
      [weekId]: {
        monday: Object.fromEntries(GYM_WORKOUTS[level][0].exercises.map(({ id }) => [id, true])),
      },
    }
  }

  const metrics = getWorkoutProgress(workoutProgress, monday)
  assert.equal(getCompletedWorkoutSessions(workoutProgress).length, 2)
  assert.equal(metrics.completedSessions, 2)
  assert.equal(metrics.completedDays, 1)
  assert.equal(metrics.plannedDays, 6)
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
