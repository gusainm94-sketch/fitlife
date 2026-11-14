export const FITNESS_TRACKER_STORAGE_KEY = 'fitlife.fitness-tracker.v1'

export const FITNESS_MEASUREMENTS = [
  { key: 'steps', label: 'Daily steps', unit: 'steps', min: 0, max: 200000, step: 1 },
  { key: 'heartRateBpm', label: 'Heart rate', unit: 'bpm', min: 20, max: 250, step: 1 },
  { key: 'activeMinutes', label: 'Active minutes', unit: 'min', min: 0, max: 1440, step: 1 },
  { key: 'sleepMinutes', label: 'Sleep duration', unit: 'hours', min: 0, max: 1440, step: 0.25 },
  { key: 'workoutMinutes', label: 'Workout duration', unit: 'min', min: 0, max: 1440, step: 1 },
  { key: 'caloriesKcal', label: 'Calories burned', unit: 'kcal', min: 0, max: 10000, step: 1 },
]

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MEASUREMENT_LIMITS = Object.fromEntries(
  FITNESS_MEASUREMENTS.map(({ key, min, max }) => [key, { min, max }]),
)

export function isValidTrackerDate(date) {
  if (typeof date !== 'string' || !DATE_PATTERN.test(date)) return false
  const [year, month, day] = date.split('-').map(Number)
  const parsed = new Date(year, month - 1, day)
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
}

export function isFitnessTrackerRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)
    || typeof record.id !== 'string' || !record.id
    || !isValidTrackerDate(record.date)) return false

  let hasMeasurement = false
  for (const [key, { min, max }] of Object.entries(MEASUREMENT_LIMITS)) {
    const value = record[key]
    if (value === null) continue
    if (!Number.isFinite(value) || value < min || value > max) return false
    if (key === 'sleepMinutes') {
      if (value % 15 !== 0) return false
    } else if (!Number.isInteger(value)) return false
    hasMeasurement = true
  }
  return hasMeasurement
}

export function normalizeFitnessTrackerRecords(saved) {
  if (!Array.isArray(saved)) return []
  const ids = new Set()
  return saved.filter((record) => {
    if (!isFitnessTrackerRecord(record) || ids.has(record.id)) return false
    ids.add(record.id)
    return true
  })
}

export function removeFitnessTrackerRecord(records, recordId) {
  return normalizeFitnessTrackerRecords(records).filter(({ id }) => id !== recordId)
}

export function createFitnessTrackerRecord({ id, date, ...measurements }) {
  return {
    id,
    date,
    ...Object.fromEntries(FITNESS_MEASUREMENTS.map(({ key }) => [
      key,
      measurements[key] === '' || measurements[key] === undefined || measurements[key] === null
        ? null
        : Number(measurements[key]),
    ])),
  }
}

export function getFitnessTrackerDailySummary(records, date) {
  const dailyRecords = normalizeFitnessTrackerRecords(records).filter((record) => record.date === date)
  const sum = (key) => dailyRecords.reduce((total, record) => total + (record[key] ?? 0), 0)
  const heartRateReadings = dailyRecords
    .map(({ heartRateBpm }) => heartRateBpm)
    .filter((value) => value !== null)
  const countReadings = (key) => dailyRecords.filter((record) => record[key] !== null).length

  return {
    recordCount: dailyRecords.length,
    stepsReadings: countReadings('steps'),
    steps: sum('steps'),
    heartRateReadings: heartRateReadings.length,
    averageHeartRateBpm: heartRateReadings.length
      ? Math.round((heartRateReadings.reduce((total, value) => total + value, 0) / heartRateReadings.length) * 10) / 10
      : null,
    activeMinutesReadings: countReadings('activeMinutes'),
    activeMinutes: sum('activeMinutes'),
    sleepReadings: countReadings('sleepMinutes'),
    sleepMinutes: sum('sleepMinutes'),
    workoutMinutesReadings: countReadings('workoutMinutes'),
    workoutMinutes: sum('workoutMinutes'),
    caloriesReadings: countReadings('caloriesKcal'),
    caloriesKcal: sum('caloriesKcal'),
  }
}

export function getFitnessTrackerCalorieActivities(records) {
  return normalizeFitnessTrackerRecords(records).flatMap((record) => (
    record.caloriesKcal === null
      ? []
      : [{
        id: `fitness-tracker:${record.id}`,
        activity: 'Other',
        activityName: 'Manually entered fitness tracker calories',
        durationMinutes: null,
        intensity: null,
        date: record.date,
        weightKg: null,
        caloriesKcal: record.caloriesKcal,
        source: 'smartwatch',
      }]
  ))
}

export function getFitnessTrackerWorkoutMinutes(records, date) {
  return normalizeFitnessTrackerRecords(records)
    .filter((record) => record.date === date)
    .reduce((total, record) => total + (record.workoutMinutes ?? 0), 0)
}

export function getFitnessTrackerHistory(records) {
  const dates = [...new Set(normalizeFitnessTrackerRecords(records).map(({ date }) => date))].sort()
  return dates.map((date) => ({ date, ...getFitnessTrackerDailySummary(records, date) }))
}
