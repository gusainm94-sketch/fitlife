export const PROFILE_STORAGE_KEY = 'fitlife.profile.v1'
export const WORKOUT_PROGRESS_STORAGE_KEY = 'fitlife.workouts.v1'

export const DEFAULT_PROFILE = {
  name: 'Alex Kumar',
  age: 28,
  height: 172,
  weight: 70,
  gender: '',
  goal: 'Strength',
  fitnessLevel: 'Beginner',
  dietPreference: '',
  smokingStatus: '',
  smartwatchAvailability: '',
  injuries: '',
  avatar: '',
}

export const FITNESS_GOALS = [
  'Weight Loss',
  'Muscle Gain',
  'Fat Loss',
  'Strength',
  'General Fitness',
  'Endurance',
]

export const DASHBOARD_STATS = [
  { label: 'Calories burned', value: '428', unit: 'kcal', note: '8% above your daily average', trend: 'up' },
  { label: 'Active minutes', value: '42', unit: 'min', note: 'Great pace for today', trend: 'up' },
  { label: 'Steps today', value: '6,240', unit: 'steps', note: '1,760 steps to your goal', trend: 'down' },
  { label: 'Heart rate', value: '72', unit: 'bpm', note: 'Resting · within your range', trend: 'steady' },
]

export const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced']
export const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say']
export const DIET_PREFERENCES = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan']
export const SMOKING_STATUSES = ['Non-Smoker', 'Current Smoker', 'Former Smoker', 'Prefer not to say']
export const SMARTWATCH_OPTIONS = ['Yes', 'No']
export const AVATAR_OPTIONS = [
  { id: 'male', label: 'Male avatar' },
  { id: 'female', label: 'Female avatar' },
  { id: 'neutral', label: 'Neutral avatar' },
]

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

  return {
    name: typeof saved.name === 'string' && saved.name.trim() ? saved.name.trim() : userName,
    age: normalizeOptionalNumber(saved.age, DEFAULT_PROFILE.age, 13, 120),
    height: normalizeOptionalNumber(saved.height, DEFAULT_PROFILE.height, 100, 250),
    weight: normalizeOptionalNumber(saved.weight, DEFAULT_PROFILE.weight, 30, 350),
    gender: normalizeOptionalChoice(saved.gender, GENDER_OPTIONS),
    goal: Object.hasOwn(LEGACY_FITNESS_GOALS, savedGoal) ? LEGACY_FITNESS_GOALS[savedGoal] : savedGoal,
    fitnessLevel: normalizeOptionalChoice(saved.fitnessLevel, FITNESS_LEVELS, DEFAULT_PROFILE.fitnessLevel),
    dietPreference: normalizeOptionalChoice(saved.dietPreference, DIET_PREFERENCES),
    smokingStatus: normalizeOptionalChoice(saved.smokingStatus, SMOKING_STATUSES),
    smartwatchAvailability: normalizeOptionalChoice(saved.smartwatchAvailability, SMARTWATCH_OPTIONS),
    injuries: typeof saved.injuries === 'string' ? saved.injuries.slice(0, 300) : '',
    avatar: normalizeOptionalChoice(saved.avatar, AVATAR_OPTIONS.map(({ id }) => id)),
  }
}