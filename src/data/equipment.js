export const EQUIPMENT_PREFERENCES_STORAGE_KEY = 'fitlife.equipment.v1'
export const NO_EQUIPMENT = 'no-equipment'

export const EQUIPMENT_OPTIONS = {
  gym: [
    { id: NO_EQUIPMENT, label: 'No Equipment' },
    { id: 'dumbbells', label: 'Dumbbells' },
    { id: 'barbells', label: 'Barbells' },
    { id: 'weight-plates', label: 'Weight Plates' },
    { id: 'bench', label: 'Bench' },
    { id: 'cable-machine', label: 'Cable Machine' },
    { id: 'lat-pulldown-machine', label: 'Lat Pulldown Machine' },
    { id: 'leg-press-machine', label: 'Leg Press Machine' },
    { id: 'smith-machine', label: 'Smith Machine' },
    { id: 'treadmill', label: 'Treadmill' },
    { id: 'exercise-bike', label: 'Exercise Bike' },
    { id: 'rowing-machine', label: 'Rowing Machine' },
    { id: 'kettlebells', label: 'Kettlebells' },
    { id: 'resistance-machines', label: 'Resistance Machines' },
    { id: 'resistance-bands', label: 'Resistance Bands' },
  ],
  home: [
    { id: NO_EQUIPMENT, label: 'No Equipment' },
    { id: 'adjustable-dumbbells', label: 'Adjustable Dumbbells' },
    { id: 'resistance-bands', label: 'Resistance Bands' },
    { id: 'yoga-mat', label: 'Yoga Mat' },
    { id: 'pull-up-bar', label: 'Pull-up Bar' },
    { id: 'skipping-rope', label: 'Skipping Rope' },
    { id: 'bench', label: 'Bench' },
    { id: 'kettlebells', label: 'Kettlebells' },
    { id: 'exercise-cycle', label: 'Exercise Cycle' },
    { id: 'treadmill', label: 'Treadmill' },
  ],
}

const GYM_REQUIREMENTS = {
  'machine-chest-press': [['resistance-machines']],
  'lat-pulldown': [['lat-pulldown-machine']],
  'seated-cable-row': [['cable-machine']],
  'machine-shoulder-press': [['resistance-machines']],
  'leg-press': [['leg-press-machine']],
  'leg-extension': [['resistance-machines']],
  'seated-leg-curl': [['resistance-machines']],
  'leg-curl': [['resistance-machines']],
  'light-treadmill-walk': [['treadmill']],
  'stationary-cycling': [['exercise-bike']],
  'stationary-bike': [['exercise-bike']],
  'rowing-machine': [['rowing-machine']],
  'goblet-squat': [['dumbbells'], ['kettlebells']],
  'dumbbell-romanian-deadlift': [['dumbbells']],
  'incline-treadmill-walk': [['treadmill']],
  elliptical: [['unlisted-elliptical']],
  'barbell-bench-press': [['barbells', 'weight-plates', 'bench']],
  'dumbbell-shoulder-press': [['dumbbells']],
  'barbell-back-squat': [['barbells', 'weight-plates'], ['smith-machine', 'weight-plates']],
  'romanian-deadlift': [['barbells', 'weight-plates']],
  'light-cycling': [['exercise-bike']],
  'barbell-squat': [['barbells', 'weight-plates'], ['smith-machine', 'weight-plates']],
  'bench-press': [['barbells', 'weight-plates', 'bench'], ['smith-machine', 'weight-plates', 'bench']],
  'rowing-intervals': [['rowing-machine']],
  'assault-bike': [['unlisted-assault-bike']],
  'stair-climber': [['unlisted-stair-climber']],
  'battle-ropes': [['unlisted-battle-ropes']],
  'low-intensity-cycling': [['exercise-bike']],
  'deadlift': [['barbells', 'weight-plates']],
  'weighted-pull-ups': [['weight-plates', 'unlisted-pull-up-bar']],
  'barbell-row': [['barbells', 'weight-plates']],
  'overhead-barbell-press': [['barbells', 'weight-plates']],
  'barbell-hip-thrust': [['barbells', 'weight-plates', 'bench']],
  'treadmill-sprint': [['treadmill']],
  'assault-bike-sprint': [['unlisted-assault-bike']],
  'sled-push': [['unlisted-sled']],
}

const HOME_REQUIREMENTS = {
  'backpack-row': [['unlisted-backpack']],
  yoga: [['yoga-mat']],
}

const BODYWEIGHT = [[]]

const GYM_ALTERNATIVES = {
  'machine-chest-press': [{ name: 'Wall push-up', equipment: BODYWEIGHT }],
  'lat-pulldown': [
    { name: 'Resistance-band row', equipment: [['resistance-bands']] },
    { name: 'Prone W raise', equipment: BODYWEIGHT },
  ],
  'seated-cable-row': [
    { name: 'Resistance-band row', equipment: [['resistance-bands']] },
    { name: 'Prone W raise', equipment: BODYWEIGHT },
  ],
  'machine-shoulder-press': [
    { name: 'Dumbbell shoulder press', equipment: [['dumbbells']] },
    { name: 'Pike push-up', equipment: BODYWEIGHT },
  ],
  'leg-press': [{ name: 'Chair squat', equipment: BODYWEIGHT }],
  'leg-extension': [{ name: 'Reverse lunge', equipment: BODYWEIGHT }],
  'seated-leg-curl': [{ name: 'Glute bridge', equipment: BODYWEIGHT }],
  'leg-curl': [{ name: 'Glute bridge', equipment: BODYWEIGHT }],
  'light-treadmill-walk': [{ name: 'Easy march in place', equipment: BODYWEIGHT }],
  'stationary-cycling': [{ name: 'Low-impact march', equipment: BODYWEIGHT }],
  'stationary-bike': [{ name: 'Low-impact march', equipment: BODYWEIGHT }],
  'rowing-machine': [{ name: 'Low-impact march', equipment: BODYWEIGHT }],
  'goblet-squat': [{ name: 'Bodyweight squat', equipment: BODYWEIGHT }],
  'dumbbell-romanian-deadlift': [{ name: 'Standing hip hinge', equipment: BODYWEIGHT }],
  'incline-treadmill-walk': [{ name: 'Brisk march in place', equipment: BODYWEIGHT }],
  elliptical: [{ name: 'Low-impact march', equipment: BODYWEIGHT }],
  'barbell-bench-press': [{ name: 'Incline push-up', equipment: BODYWEIGHT }],
  'dumbbell-shoulder-press': [{ name: 'Pike push-up', equipment: BODYWEIGHT }],
  'barbell-back-squat': [{ name: 'Bodyweight squat', equipment: BODYWEIGHT }],
  'romanian-deadlift': [{ name: 'Standing hip hinge', equipment: BODYWEIGHT }],
  'light-cycling': [{ name: 'Easy march in place', equipment: BODYWEIGHT }],
  'barbell-squat': [{ name: 'Bodyweight squat', equipment: BODYWEIGHT }],
  'bench-press': [{ name: 'Incline push-up', equipment: BODYWEIGHT }],
  'rowing-intervals': [{ name: 'Low-impact march', equipment: BODYWEIGHT }],
  'assault-bike': [
    { name: 'Stationary bike', equipment: [['exercise-bike']] },
    { name: 'Low-impact march', equipment: BODYWEIGHT },
  ],
  'stair-climber': [{ name: 'Step-up', equipment: [['bench']] }, { name: 'March in place', equipment: BODYWEIGHT }],
  'battle-ropes': [{ name: 'Shadow boxing', equipment: BODYWEIGHT }],
  'low-intensity-cycling': [{ name: 'Easy march in place', equipment: BODYWEIGHT }],
  deadlift: [{ name: 'Standing hip hinge', equipment: BODYWEIGHT }],
  'weighted-pull-ups': [
    { name: 'Lat pulldown', equipment: [['lat-pulldown-machine']] },
    { name: 'Prone reverse snow angel', equipment: BODYWEIGHT },
  ],
  'barbell-row': [
    { name: 'Dumbbell row', equipment: [['dumbbells']] },
    { name: 'Prone W raise', equipment: BODYWEIGHT },
  ],
  'overhead-barbell-press': [{ name: 'Pike push-up', equipment: BODYWEIGHT }],
  'barbell-hip-thrust': [{ name: 'Glute bridge', equipment: BODYWEIGHT }],
  'treadmill-sprint': [{ name: 'High-knee march', equipment: BODYWEIGHT }],
  'assault-bike-sprint': [
    { name: 'Stationary bike intervals', equipment: [['exercise-bike']] },
    { name: 'Fast march in place', equipment: BODYWEIGHT },
  ],
  'sled-push': [{ name: 'Wall push', equipment: BODYWEIGHT }],
}

const HOME_ALTERNATIVES = {
  'backpack-row': [
    { name: 'Resistance-band row', equipment: [['resistance-bands']] },
    { name: 'Dumbbell row', equipment: [['adjustable-dumbbells']] },
    { name: 'Kettlebell row', equipment: [['kettlebells']] },
    { name: 'Prone W raise', equipment: BODYWEIGHT },
  ],
  yoga: [{ name: 'Gentle mobility flow', equipment: BODYWEIGHT }],
  'home-treadmill-walk': [{ name: 'Easy neighborhood walk', equipment: BODYWEIGHT }],
  'exercise-cycle': [{ name: 'Low-impact march', equipment: BODYWEIGHT }],
}

export const EQUIPMENT_ALTERNATIVE_NAMES = [...new Set(
  [...Object.values(GYM_ALTERNATIVES), ...Object.values(HOME_ALTERNATIVES)]
    .flat()
    .map(({ name }) => name),
)]

export function normalizeEquipmentPreferences(saved) {
  const preferences = {}
  for (const mode of ['gym', 'home']) {
    const allowed = new Set(EQUIPMENT_OPTIONS[mode].map(({ id }) => id))
    const values = Array.isArray(saved?.[mode]) ? saved[mode].filter((id) => allowed.has(id)) : []
    preferences[mode] = !values.length || values.includes(NO_EQUIPMENT)
      ? [NO_EQUIPMENT]
      : [...new Set(values)]
  }
  return preferences
}

export function toggleEquipmentSelection(selected, equipmentId) {
  if (equipmentId === NO_EQUIPMENT) return [NO_EQUIPMENT]
  const withoutNoEquipment = selected.filter((id) => id !== NO_EQUIPMENT)
  const next = withoutNoEquipment.includes(equipmentId)
    ? withoutNoEquipment.filter((id) => id !== equipmentId)
    : [...withoutNoEquipment, equipmentId]
  return next.length ? next : [NO_EQUIPMENT]
}

function getExerciseKey(mode, exercise) {
  return mode === 'gym'
    ? exercise.id.replace(/^(beginner|intermediate|advanced)-[a-z]+-/, '')
    : exercise.id.replace(/^home-[a-z]+-/, '')
}

function requirementsFor(mode, exercise) {
  const exerciseKey = getExerciseKey(mode, exercise)
  const requirements = mode === 'gym' ? GYM_REQUIREMENTS : HOME_REQUIREMENTS
  return Object.hasOwn(requirements, exerciseKey) ? requirements[exerciseKey] : BODYWEIGHT
}

function meetsRequirements(requirements, selected) {
  if (selected.includes(NO_EQUIPMENT)) return requirements.some((option) => option.length === 0)
  return requirements.some((option) => option.every((id) => selected.includes(id)))
}

export function isExerciseAvailable(mode, exercise, selected) {
  return meetsRequirements(requirementsFor(mode, exercise), selected)
}

function getAlternative(mode, exercise, selected) {
  const alternatives = (mode === 'gym' ? GYM_ALTERNATIVES : HOME_ALTERNATIVES)[getExerciseKey(mode, exercise)] ?? []
  return alternatives.find((alternative) => meetsRequirements(alternative.equipment, selected))
    ?? alternatives.find((alternative) => meetsRequirements(alternative.equipment, [NO_EQUIPMENT]))
    ?? null
}

export function filterWorkoutPlan(mode, plan, selected) {
  const exercises = []
  const alternatives = []
  for (const exercise of plan.exercises) {
    if (isExerciseAvailable(mode, exercise, selected)) {
      exercises.push(exercise)
    } else {
      const alternative = getAlternative(mode, exercise, selected)
      if (alternative) alternatives.push({ exercise, ...alternative })
    }
  }
  return { plan: { ...plan, exercises }, alternatives }
}
