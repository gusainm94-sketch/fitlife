import assert from 'node:assert/strict'
import test from 'node:test'
import { GYM_WORKOUTS, WEEKLY_WORKOUTS } from './workouts.js'
import {
  EQUIPMENT_OPTIONS,
  NO_EQUIPMENT,
  filterWorkoutPlan,
  normalizeEquipmentPreferences,
  toggleEquipmentSelection,
} from './equipment.js'

test('equipment selections are exclusive with No Equipment and can be toggled', () => {
  const selected = toggleEquipmentSelection([NO_EQUIPMENT], 'dumbbells')
  assert.deepEqual(selected, ['dumbbells'])
  assert.deepEqual(toggleEquipmentSelection(selected, 'dumbbells'), [NO_EQUIPMENT])
  assert.deepEqual(toggleEquipmentSelection(selected, NO_EQUIPMENT), [NO_EQUIPMENT])
})

test('equipment preferences discard unknown values and normalize empty selections', () => {
  assert.deepEqual(normalizeEquipmentPreferences({
    gym: ['dumbbells', 'not-an-option', 'dumbbells'],
    home: [],
  }), {
    gym: ['dumbbells'],
    home: [NO_EQUIPMENT],
  })
})

test('gym filtering uses selected equipment and offers a bodyweight alternative', () => {
  const monday = GYM_WORKOUTS.Beginner[0]
  const withoutEquipment = filterWorkoutPlan('gym', monday, [NO_EQUIPMENT])
  assert.deepEqual(withoutEquipment.plan.exercises, [])
  assert.equal(withoutEquipment.alternatives.length, monday.exercises.length)
  assert.ok(withoutEquipment.alternatives.every(({ name }) => name))

  const withEquipment = filterWorkoutPlan('gym', monday, ['resistance-machines', 'lat-pulldown-machine', 'cable-machine'])
  assert.deepEqual(withEquipment.plan.exercises.map(({ name }) => name), [
    'Machine Chest Press',
    'Lat Pulldown',
    'Seated Cable Row',
    'Machine Shoulder Press',
  ])
})

test('home filtering keeps unweighted movements and suggests alternatives for unavailable gear', () => {
  const monday = WEEKLY_WORKOUTS.home[0]
  const withoutEquipment = filterWorkoutPlan('home', monday, [NO_EQUIPMENT])
  assert.ok(withoutEquipment.plan.exercises.every(({ id }) => !id.endsWith('backpack-row')))
  assert.ok(withoutEquipment.alternatives.some(({ name }) => name === 'Prone W raise'))

  const withBands = filterWorkoutPlan('home', monday, ['resistance-bands'])
  assert.ok(withBands.alternatives.some(({ name }) => name === 'Resistance-band row'))

  const saturday = filterWorkoutPlan('home', WEEKLY_WORKOUTS.home[5], [NO_EQUIPMENT])
  assert.ok(!saturday.plan.exercises.some(({ id }) => id.endsWith('-yoga')))
  assert.ok(saturday.alternatives.some(({ name }) => name === 'Gentle mobility flow'))
})

test('gym cardio equipment is filtered instead of shown as bodyweight', () => {
  const friday = GYM_WORKOUTS.Beginner[4]
  const withoutEquipment = filterWorkoutPlan('gym', friday, [NO_EQUIPMENT])
  assert.equal(withoutEquipment.plan.exercises.length, 0)
  assert.equal(withoutEquipment.alternatives.length, friday.exercises.length)

  const withEquipment = filterWorkoutPlan('gym', friday, ['treadmill', 'exercise-bike', 'rowing-machine'])
  assert.deepEqual(withEquipment.plan.exercises.map(({ name }) => name), [
    'Incline Treadmill Walk',
    'Stationary Bike',
    'Rowing Machine',
  ])
})

test('gym weighted pull-ups are hidden when the required pull-up bar is not selectable', () => {
  const monday = filterWorkoutPlan('gym', GYM_WORKOUTS.Advanced[0], ['weight-plates'])
  assert.ok(!monday.plan.exercises.some(({ id }) => id.endsWith('weighted-pull-ups')))
  assert.ok(monday.alternatives.some(({ exercise, name }) => (
    exercise.id.endsWith('weighted-pull-ups') && name === 'Prone reverse snow angel'
  )))

  const withLatPulldown = filterWorkoutPlan('gym', GYM_WORKOUTS.Advanced[0], ['lat-pulldown-machine'])
  assert.ok(withLatPulldown.alternatives.some(({ exercise, name }) => (
    exercise.id.endsWith('weighted-pull-ups') && name === 'Lat pulldown'
  )))
})

test('an exercise bike does not make an assault bike available', () => {
  const friday = filterWorkoutPlan('gym', GYM_WORKOUTS.Advanced[4], ['treadmill', 'exercise-bike'])
  assert.deepEqual(friday.plan.exercises.map(({ name }) => name), ['Treadmill Sprint'])
  assert.ok(friday.alternatives.some(({ name }) => name === 'Stationary bike intervals'))
})

test('every equipment catalog includes the No Equipment choice', () => {
  assert.ok(EQUIPMENT_OPTIONS.gym.some(({ id }) => id === NO_EQUIPMENT))
  assert.ok(EQUIPMENT_OPTIONS.home.some(({ id }) => id === NO_EQUIPMENT))
})

test('all filtered gym and home exercises receive an equipment-compatible alternative', () => {
  const plans = [
    ...Object.values(GYM_WORKOUTS).flat().map((plan) => ['gym', plan]),
    ...WEEKLY_WORKOUTS.home.map((plan) => ['home', plan]),
  ]
  for (const [mode, plan] of plans) {
    const filtered = filterWorkoutPlan(mode, plan, [NO_EQUIPMENT])
    assert.equal(
      filtered.plan.exercises.length + filtered.alternatives.length,
      plan.exercises.length,
      `${mode}: ${plan.title}`,
    )
  }
})
