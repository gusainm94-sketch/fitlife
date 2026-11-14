import { GYM_WORKOUTS, WEEKDAYS, WEEKLY_WORKOUTS } from './workouts.js'
import { getCompletedWorkoutSessions, getWeekDateKeys } from '../utils/progress.js'

export const CALORIE_ACTIVITIES_STORAGE_KEY = 'fitlife.calorie-activities.v1'
export const CALORIE_ACTIVITIES = [
  'Strength Training',
  'Walking',
  'Running',
  'Cycling',
  'Swimming',
  'Yoga',
  'HIIT',
  'Cardio',
  'Home Workouts',
  'Other',
]
export const EXERCISE_INTENSITIES = ['Low', 'Moderate', 'High']

export const ACTIVITY_METS = {
  'Strength Training': { Low: 3.5, Moderate: 5, High: 6 },
  Walking: { Low: 2.5, Moderate: 3.5, High: 4.5 },
  Running: { Low: 6, Moderate: 8.3, High: 11 },
  Cycling: { Low: 4, Moderate: 6.8, High: 10 },
  Swimming: { Low: 4.8, Moderate: 6, High: 9.8 },
  Yoga: { Low: 2, Moderate: 2.5, High: 4 },
  HIIT: { Low: 6, Moderate: 8, High: 10 },
  Cardio: { Low: 3.5, Moderate: 6, High: 8 },
  'Home Workouts': { Low: 3, Moderate: 5, High: 8 },
  Other: { Low: 2, Moderate: 4, High: 7 },
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isValidBodyWeight(weightKg) {
  return Number.isFinite(weightKg) && weightKg >= 30 && weightKg <= 350
}

export function getProfileCalorieWeight(profile) {
  if (profile?.weightConfirmed === false || !isValidBodyWeight(profile?.weight)) return null
  return profile.weight
}

export function createCalorieActivity({
  id,
  activity,
  durationMinutes,
  intensity,
  date,
  weightKg,
  source = 'manual',
  activityName,
}) {
  const savedWeight = isValidBodyWeight(weightKg) ? weightKg : null
  return {
    id,
    activity,
    ...(activityName ? { activityName } : {}),
    durationMinutes,
    intensity,
    date,
    weightKg: savedWeight,
    caloriesKcal: estimateCaloriesBurned({ activity, durationMinutes, intensity, weightKg: savedWeight }),
    source,
  }
}

export function updateCalorieActivityDurationRecord(record, durationMinutes) {
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return null
  return {
    ...record,
    durationMinutes,
    caloriesKcal: estimateCaloriesBurned({
      activity: record.activity,
      durationMinutes,
      intensity: record.intensity,
      weightKg: record.weightKg,
    }),
  }
}

export function estimateCaloriesBurned({ activity, durationMinutes, intensity, weightKg }) {
  if (!Object.hasOwn(ACTIVITY_METS, activity)
    || !EXERCISE_INTENSITIES.includes(intensity)
    || !isValidBodyWeight(weightKg)
    || !Number.isFinite(durationMinutes)
    || durationMinutes <= 0) return null

  const met = ACTIVITY_METS[activity][intensity]
  return Math.round((met * 3.5 * weightKg / 200) * durationMinutes)
}

export function isCalorieActivity(record) {
  const isSmartwatchEntry = record?.source === 'smartwatch'
  return Boolean(record)
    && typeof record.id === 'string'
    && record.id.length > 0
    && CALORIE_ACTIVITIES.includes(record.activity)
    && typeof record.date === 'string'
    && DATE_PATTERN.test(record.date)
    && (record.caloriesKcal === null || (Number.isFinite(record.caloriesKcal) && record.caloriesKcal >= 0))
    && (record.weightKg === null || isValidBodyWeight(record.weightKg))
    && (isSmartwatchEntry
      ? record.durationMinutes === null && record.intensity === null
      : Number.isFinite(record.durationMinutes)
        && record.durationMinutes > 0
        && EXERCISE_INTENSITIES.includes(record.intensity)
        && ['manual', 'workout'].includes(record.source))
    && (record.activityName === undefined || typeof record.activityName === 'string')
}

export function normalizeCalorieActivities(saved) {
  if (!Array.isArray(saved)) return []
  const ids = new Set()
  return saved.filter((record) => {
    if (!isCalorieActivity(record) || ids.has(record.id)) return false
    ids.add(record.id)
    return true
  })
}

export function parseExerciseDuration(duration) {
  if (typeof duration !== 'string') return null
  const match = duration.trim().match(/^(\d+(?:\.\d+)?)\s*(min(?:ute)?s?|sec(?:ond)?s?)$/i)
  if (!match) return null
  const amount = Number(match[1])
  const minutes = /^sec/i.test(match[2]) ? amount / 60 : amount
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null
}

function getWorkoutActivityType(name, mode, category) {
  const activityName = name.toLowerCase()
  if (/walk|march/.test(activityName)) return 'Walking'
  if (/run|sprint/.test(activityName)) return 'Running'
  if (/cycle|cycling|bike/.test(activityName)) return 'Cycling'
  if (/swim/.test(activityName)) return 'Swimming'
  if (/yoga|mobility|stretch/.test(activityName)) return 'Yoga'
  if (/hiit|interval/.test(activityName)) return 'HIIT'
  if (/cardio|conditioning/.test(activityName)) return 'Cardio'
  if (category?.toLowerCase().includes('strength')) return 'Strength Training'
  return mode === 'home' ? 'Home Workouts' : 'Other'
}

export function getCompletedWorkoutCalorieActivities(workoutProgress, weightKg) {
  if (!isValidBodyWeight(weightKg)) return []

  return getCompletedWorkoutSessions(workoutProgress).flatMap((session) => {
    const plans = session.mode === 'gym' ? GYM_WORKOUTS[session.difficulty] : WEEKLY_WORKOUTS[session.mode]
    const dayIndex = WEEKDAYS.findIndex(({ id }) => id === session.dayId)
    const plan = plans?.[dayIndex]
    if (!plan) return []

    const date = getWeekDateKeys(session.weekId)[dayIndex]
    return plan.exercises.flatMap((exercise) => {
      const durationMinutes = parseExerciseDuration(exercise.duration)
      if (durationMinutes === null) return []
      const activity = getWorkoutActivityType(exercise.name, session.mode, plan.category ?? plan.focus)
      const intensity = 'Moderate'
      const id = `workout:${session.mode}:${session.difficulty ?? 'home'}:${session.weekId}:${session.dayId}:${exercise.id}`
      return [{
        id,
        activity,
        activityName: exercise.name,
        durationMinutes,
        intensity,
        date,
        weightKg,
        caloriesKcal: estimateCaloriesBurned({ activity, durationMinutes, intensity, weightKg }),
        source: 'workout',
      }]
    })
  })
}

export function mergeCalorieActivities(existing, additions) {
  const merged = [...normalizeCalorieActivities(existing)]
  const ids = new Set(merged.map(({ id }) => id))
  for (const activity of normalizeCalorieActivities(additions)) {
    if (ids.has(activity.id)) continue
    ids.add(activity.id)
    merged.push(activity)
  }
  return merged
}

export function getCaloriePeriodTotals(records, today) {
  const date = new Date(`${today}T00:00:00`)
  const monthStart = `${today.slice(0, 7)}-01`
  const monday = new Date(date)
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  const weekStart = [
    monday.getFullYear(),
    String(monday.getMonth() + 1).padStart(2, '0'),
    String(monday.getDate()).padStart(2, '0'),
  ].join('-')

  const sumBetween = (start, end) => normalizeCalorieActivities(records)
    .filter(({ date: recordDate }) => recordDate >= start && recordDate <= end)
    .reduce((total, { caloriesKcal }) => total + (caloriesKcal ?? 0), 0)

  return {
    today: sumBetween(today, today),
    week: sumBetween(weekStart, today),
    month: sumBetween(monthStart, today),
  }
}

export function getRecentDailyCalorieTotals(records, today) {
  const endDate = new Date(`${today}T00:00:00`)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(endDate)
    date.setDate(endDate.getDate() - (6 - index))
    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-')
    return {
      date: dateKey,
      calories: normalizeCalorieActivities(records)
        .filter((record) => record.date === dateKey)
        .reduce((total, { caloriesKcal }) => total + (caloriesKcal ?? 0), 0),
    }
  })
}
