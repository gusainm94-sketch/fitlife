import assert from 'node:assert/strict'
import test from 'node:test'
import { getExerciseSafetyWarnings, getPotentialExerciseAlternatives } from './exerciseSafety.js'
import { NO_EQUIPMENT } from './equipment.js'
import { GYM_WORKOUTS, WEEKLY_WORKOUTS } from './workouts.js'

test('exercise warnings describe movements that may load selected areas', () => {
  const cases = [
    ['Shoulder', GYM_WORKOUTS.Intermediate[0].exercises[0]],
    ['Back', GYM_WORKOUTS.Advanced[3].exercises[1]],
    ['Knee', GYM_WORKOUTS.Beginner[3].exercises[0]],
    ['Ankle', GYM_WORKOUTS.Beginner[1].exercises[3]],
    ['Wrist', WEEKLY_WORKOUTS.home[0].exercises[0]],
    ['Elbow', GYM_WORKOUTS.Beginner[0].exercises[0]],
    ['Neck', GYM_WORKOUTS.Beginner[5].exercises[3]],
  ]

  for (const [area, exercise] of cases) {
    assert.equal(getExerciseSafetyWarnings(exercise, [area])[0]?.area, area)
  }
  assert.deepEqual(getExerciseSafetyWarnings(cases[0][1], ['Shoulder', 'Wrist']).map(({ area }) => area), ['Shoulder', 'Wrist'])
  assert.deepEqual(getExerciseSafetyWarnings(cases[0][1], []), [])
})

test('Other limitations prompt review without implying exercise safety', () => {
  const exercise = WEEKLY_WORKOUTS.home[0].exercises[0]
  const warnings = getExerciseSafetyWarnings(exercise, ['Other'])

  assert.equal(warnings.length, 1)
  assert.match(warnings[0].reason, /cannot assess an unspecified limitation/)
})

test('possible alternatives respect workout mode and selected equipment', () => {
  const gymExercise = GYM_WORKOUTS.Beginner[0].exercises[0]
  const gymCatalog = Object.values(GYM_WORKOUTS).flatMap((plans) => plans.flatMap(({ exercises }) => exercises))
  const gymAlternatives = getPotentialExerciseAlternatives('gym', gymExercise, ['Shoulder'], ['treadmill'], gymCatalog)

  assert.deepEqual(gymAlternatives.map(({ name }) => name), ['Light Treadmill Walk'])
  assert.deepEqual(
    getPotentialExerciseAlternatives('gym', gymExercise, ['Shoulder'], [NO_EQUIPMENT], gymCatalog),
    [],
  )

  const homeExercise = WEEKLY_WORKOUTS.home[0].exercises[1]
  const homeCatalog = WEEKLY_WORKOUTS.home.flatMap(({ exercises }) => exercises)
  const homeAlternatives = getPotentialExerciseAlternatives('home', homeExercise, ['Shoulder'], [NO_EQUIPMENT], homeCatalog)
  assert.deepEqual(homeAlternatives.map(({ name }) => name), ['Easy neighborhood walk'])
})
