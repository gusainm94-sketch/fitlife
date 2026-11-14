import { isExerciseAvailable } from './equipment.js'
import { INJURY_AREAS } from './profile.js'

const AREA_RULES = [
  {
    area: 'Shoulder',
    pattern: /bench|press|push.?up|dip|row|pull.?up|rope|shoulder|plank|bird.?dog|yoga/i,
    reason: 'This movement uses the shoulder for pressing, pulling, overhead motion, or body support.',
  },
  {
    area: 'Back',
    pattern: /deadlift|romanian|hinge|row|squat|plank|dead.?bug|bird.?dog|thoracic|yoga/i,
    reason: 'This movement can involve trunk loading, bracing, or a bent-over position.',
  },
  {
    area: 'Knee',
    pattern: /squat|lunge|leg-|step|stair|treadmill|sprint|walk|march|cycl|bike|calf|rowing|elliptical|yoga/i,
    reason: 'This movement involves repeated knee bending, weight-bearing, or lower-body impact.',
  },
  {
    area: 'Ankle',
    pattern: /squat|lunge|step|stair|treadmill|sprint|walk|march|cycl|bike|calf|rowing|elliptical|yoga/i,
    reason: 'This movement involves ankle motion, balance, weight-bearing, or lower-body impact.',
  },
  {
    area: 'Wrist',
    pattern: /push.?up|plank|row|press|pull.?up|dip|rope|yoga|bird.?dog/i,
    reason: 'This movement may load the wrist through gripping or weight-bearing.',
  },
  {
    area: 'Elbow',
    pattern: /press|push.?up|row|pull.?up|dip|curl|rope|chest|bench/i,
    reason: 'This movement uses the elbow repeatedly for pushing, pulling, or gripping.',
  },
  {
    area: 'Neck',
    pattern: /overhead|shoulder|row|plank|yoga|thoracic|mobility|rope|pull.?up|press/i,
    reason: 'This movement may involve upper-body loading or neck and shoulder positioning.',
  },
]

const ALTERNATIVE_KEYS = {
  Shoulder: ['light-treadmill-walk', 'stationary-cycling', 'low-intensity-cycling', 'walk'],
  Back: ['light-treadmill-walk', 'stationary-cycling', 'walk'],
  Knee: ['seated-cable-row', 'machine-chest-press', 'barbell-bench-press'],
  Ankle: ['seated-cable-row', 'machine-chest-press', 'barbell-bench-press'],
  Wrist: ['light-treadmill-walk', 'stationary-cycling', 'low-intensity-cycling', 'walk'],
  Elbow: ['light-treadmill-walk', 'stationary-cycling', 'low-intensity-cycling', 'walk'],
  Neck: ['light-treadmill-walk', 'stationary-cycling', 'walk'],
}

function exerciseKey(mode, exercise) {
  return mode === 'gym'
    ? exercise.id.replace(/^(beginner|intermediate|advanced)-[a-z]+-/, '')
    : exercise.id.replace(/^home-[a-z]+-/, '')
}

export function getExerciseSafetyWarnings(exercise, selectedAreas = []) {
  const areas = new Set(selectedAreas.filter((area) => INJURY_AREAS.includes(area)))
  if (areas.has('Other')) {
    return [{
      area: 'Other',
      reason: 'FitLife cannot assess an unspecified limitation. Review this movement with a qualified healthcare professional.',
    }]
  }

  const key = exercise.id.replace(/^(beginner|intermediate|advanced)-[a-z]+-|^home-[a-z]+-/, '')
  return AREA_RULES
    .filter(({ area, pattern }) => areas.has(area) && pattern.test(`${key} ${exercise.name}`))
    .map(({ area, reason }) => ({ area, reason }))
}

export function getPotentialExerciseAlternatives(mode, exercise, selectedAreas, selectedEquipment, catalog) {
  const originalKey = exerciseKey(mode, exercise)
  const candidateKeys = new Set(selectedAreas.flatMap((area) => ALTERNATIVE_KEYS[area] ?? []))
  const alternatives = []
  const seen = new Set()

  for (const candidate of catalog) {
    const key = exerciseKey(mode, candidate)
    if (!candidateKeys.has(key) || key === originalKey || seen.has(key)) continue
    if (!isExerciseAvailable(mode, candidate, selectedEquipment)) continue
    if (getExerciseSafetyWarnings(candidate, selectedAreas).length) continue
    seen.add(key)
    alternatives.push(candidate)
    if (alternatives.length === 2) break
  }
  return alternatives
}
