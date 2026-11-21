export const PROFILE_STORAGE_KEY = 'fitlife.profile.v1'
export const WORKOUT_PROGRESS_STORAGE_KEY = 'fitlife.workouts.v1'

export const DEFAULT_PROFILE = {
  name: 'Alex Kumar',
  age: null,
  height: null,
  weight: null,
  weightConfirmed: false,
  gender: '',
  goal: '',
  fitnessLevel: '',
  profileSetupComplete: false,
  availableEquipment: [],
  dietPreference: '',
  smokingStatus: '',
  smartwatchAvailability: '',
  injuryAreas: [],
  injuryDescription: '',
  avatar: '',
}

export const FITNESS_GOALS = [
  'Weight Loss',
  'Muscle Gain',
  'Maintain Fitness',
  'General Fitness',
]

export const AVAILABLE_EQUIPMENT = [
  { id: 'no-equipment', label: 'No equipment' },
  { id: 'dumbbells', label: 'Dumbbells' },
  { id: 'resistance-bands', label: 'Resistance bands' },
  { id: 'barbell', label: 'Barbell' },
  { id: 'bench', label: 'Bench' },
  { id: 'pull-up-bar', label: 'Pull-up bar' },
  { id: 'full-gym', label: 'Full gym equipment' },
]

export const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced']
export const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say']
export const DIET_PREFERENCES = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan']
export const SMOKING_STATUSES = ['Non-Smoker', 'Current Smoker', 'Former Smoker', 'Prefer not to say']
export const SMARTWATCH_OPTIONS = [
  'Apple Watch',
  'Wear OS Smartwatch',
  'Fitbit',
  'Garmin',
  'Other',
  'No Smartwatch',
]
export const AVATAR_OPTIONS = [
  { id: 'male', label: 'Male avatar' },
  { id: 'female', label: 'Female avatar' },
  { id: 'neutral', label: 'Neutral avatar' },
]
export const INJURY_AREAS = ['Shoulder', 'Back', 'Knee', 'Ankle', 'Wrist', 'Elbow', 'Neck', 'Other']

const LEGACY_FITNESS_GOALS = {
  'Build strength': 'Strength',
  'Improve fitness': 'General Fitness',
  'Lose weight': 'Weight Loss',
  'Gain weight': 'Muscle Gain',
  'Improve endurance': 'Endurance',
  'Stay active': 'General Fitness',
}

function normalizeOptionalNumber(value, fallback, min, max) {
  if (value === undefined) return fallback
  if (value === null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) && number >= min && number <= max ? number : fallback
}

function normalizeOptionalChoice(value, options, fallback = '') {
  if (value === undefined) return fallback
  return value === '' || value === null || options.includes(value) ? value ?? '' : fallback
}

export function normalizeProfile(saved, userName = DEFAULT_PROFILE.name) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
    return { ...DEFAULT_PROFILE, name: userName }
  }

  const savedGoal = saved.goal === '' || saved.goal === null
    ? ''
    : typeof saved.goal === 'string' && saved.goal.trim()
      ? saved.goal.trim()
      : DEFAULT_PROFILE.goal

  const profile = {
    name: typeof saved.name === 'string' && saved.name.trim() ? saved.name.trim() : userName,
    age: normalizeOptionalNumber(saved.age, DEFAULT_PROFILE.age, 13, 120),
    height: normalizeOptionalNumber(saved.height, DEFAULT_PROFILE.height, 100, 250),
    weight: normalizeOptionalNumber(saved.weight, DEFAULT_PROFILE.weight, 30, 350),
    gender: normalizeOptionalChoice(saved.gender, GENDER_OPTIONS),
    goal: Object.hasOwn(LEGACY_FITNESS_GOALS, savedGoal) ? LEGACY_FITNESS_GOALS[savedGoal] : savedGoal,
    fitnessLevel: normalizeOptionalChoice(saved.fitnessLevel, FITNESS_LEVELS, DEFAULT_PROFILE.fitnessLevel),
    profileSetupComplete: saved.profileSetupComplete === true,
    availableEquipment: Array.isArray(saved.availableEquipment)
      ? [...new Set(saved.availableEquipment.filter((id) => AVAILABLE_EQUIPMENT.some((item) => item.id === id)))]
      : [],
    dietPreference: normalizeOptionalChoice(saved.dietPreference, DIET_PREFERENCES),
    smokingStatus: normalizeOptionalChoice(saved.smokingStatus, SMOKING_STATUSES),
    smartwatchAvailability: normalizeOptionalChoice(
      saved.smartwatchAvailability,
      [...SMARTWATCH_OPTIONS, 'Yes', 'No'],
    ),
    injuryAreas: Array.isArray(saved.injuryAreas)
      ? [...new Set(saved.injuryAreas.filter((area) => INJURY_AREAS.includes(area)))]
      : [],
    injuryDescription: (typeof saved.injuryDescription === 'string'
      ? saved.injuryDescription
      : typeof saved.injuries === 'string' ? saved.injuries : '').slice(0, 300),
    avatar: normalizeOptionalChoice(saved.avatar, AVATAR_OPTIONS.map(({ id }) => id)),
  }
  const isSampleProfile = Object.keys(DEFAULT_PROFILE)
    .filter((key) => key !== 'name' && key !== 'weightConfirmed')
    .every((key) => JSON.stringify(profile[key]) === JSON.stringify(DEFAULT_PROFILE[key]))
  const hasValidSavedWeight = Number.isFinite(Number(saved.weight))
    && Number(saved.weight) >= 30
    && Number(saved.weight) <= 350

  const hasValidSavedHeight = Number.isFinite(Number(saved.height))
    && Number(saved.height) >= 100
    && Number(saved.height) <= 250
  const isLegacySampleProfile = saved.profileSetupComplete !== true
    && saved.weightConfirmed !== true
    && Number(saved.height) === 172
    && Number(saved.weight) === 70
    && Number(saved.age) === 28

  return {
    ...profile,
    height: isLegacySampleProfile ? null : profile.height,
    weight: isLegacySampleProfile ? null : profile.weight,
    age: isLegacySampleProfile ? null : profile.age,
    profileSetupComplete: !isLegacySampleProfile && (profile.profileSetupComplete || (hasValidSavedHeight && hasValidSavedWeight && saved.weightConfirmed !== false)),
    weightConfirmed: !isLegacySampleProfile && hasValidSavedWeight && (typeof saved.weightConfirmed === 'boolean'
      ? saved.weightConfirmed
      : !isSampleProfile),
  }
}
