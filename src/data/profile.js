export const PROFILE_STORAGE_KEY = 'fitlife.profile.v1'
export const WORKOUT_PROGRESS_STORAGE_KEY = 'fitlife.workouts.v1'

export const DEFAULT_PROFILE = {
  name: 'Alex Kumar',
  age: 28,
  height: 172,
  weight: 70,
  goal: 'Build strength',
  fitnessLevel: 'Beginner',
}

export const FITNESS_GOALS = [
  'Build strength',
  'Improve fitness',
  'Lose weight',
  'Gain weight',
  'Improve endurance',
  'Stay active',
]

export const DASHBOARD_STATS = [
  { label: 'Calories burned', value: '428', unit: 'kcal', note: '8% above your daily average', trend: 'up' },
  { label: 'Active minutes', value: '42', unit: 'min', note: 'Great pace for today', trend: 'up' },
  { label: 'Steps today', value: '6,240', unit: 'steps', note: '1,760 steps to your goal', trend: 'down' },
  { label: 'Heart rate', value: '72', unit: 'bpm', note: 'Resting · within your range', trend: 'steady' },
]

export const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced']