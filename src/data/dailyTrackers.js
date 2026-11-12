export const WATER_STORAGE_KEY = 'fitlife-water-intake'
export const HABITS_STORAGE_KEY = 'fitlife-daily-habits'
export const DAILY_WATER_GOAL_ML = 2000

export const DAILY_HABITS = [
  { id: 'morning-walk', label: 'Morning walk', detail: 'Start the day with a little movement.' },
  { id: 'exercise', label: 'Exercise', detail: 'Make time for movement that feels good.' },
  { id: 'healthy-food', label: 'Eat healthy food', detail: 'Choose nourishing meals and snacks.' },
  { id: 'enough-water', label: 'Drink enough water', detail: 'Keep a glass nearby through the day.' },
  { id: 'sleep-on-time', label: 'Sleep on time', detail: 'Make space for a restful night.' },
]

export function createWaterIntake() {
  return { totalMl: 0, entries: [] }
}

export function isWaterIntake(value) {
  return Boolean(value)
    && Number.isFinite(value.totalMl)
    && value.totalMl >= 0
    && Array.isArray(value.entries)
    && value.entries.every((amount) => Number.isFinite(amount) && amount > 0)
    && value.entries.reduce((total, amount) => total + amount, 0) === value.totalMl
}

export function createHabitCompletions() {
  return Object.fromEntries(DAILY_HABITS.map(({ id }) => [id, false]))
}

export function isHabitCompletions(value) {
  return Boolean(value)
    && DAILY_HABITS.every(({ id }) => typeof value[id] === 'boolean')
}
