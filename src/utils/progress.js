import { DAILY_HABITS, DAILY_WATER_GOAL_ML } from '../data/dailyTrackers.js'
import { GYM_DIFFICULTIES, GYM_WORKOUTS, WEEKDAYS, WEEKLY_WORKOUTS } from '../data/workouts.js'
import { INDIAN_MEALS } from '../data/meals.js'
import { readLocalJson, writeLocalJson } from './localStorage.js'

export const REWARDS_STORAGE_KEY = 'fitlife.earned-badges.v1'
export const BADGE_UPDATE_EVENT = 'fitlife:badges-updated'

export const BADGES = [
  { id: 'first-workout', name: 'First Workout', description: 'Complete every exercise in your first workout session.', icon: 'dumbbell' },
  { id: 'hydration-hero', name: 'Hydration Hero', description: 'Reach your daily water goal of 2,000 ml.', icon: 'droplets' },
  { id: 'habit-builder', name: 'Habit Builder', description: 'Complete all daily habits.', icon: 'check' },
  { id: 'workout-champion', name: 'Workout Champion', description: 'Complete five workout sessions.', icon: 'trophy' },
]

function getDayProgress(workoutProgress, mode, weekId, dayId, difficulty = 'Beginner') {
  if (mode === 'home') return workoutProgress.home?.[weekId]?.[dayId] ?? {}

  const gymProgress = workoutProgress.gym ?? {}
  const levelProgress = gymProgress[difficulty]
  if (levelProgress && typeof levelProgress === 'object') return levelProgress[weekId]?.[dayId] ?? {}
  return difficulty === 'Beginner' ? gymProgress[weekId]?.[dayId] ?? {} : {}
}

function getPlansForMode(mode) {
  return mode === 'gym' ? GYM_DIFFICULTIES.map((difficulty) => ({ difficulty, plans: GYM_WORKOUTS[difficulty] })) : [{ plans: WEEKLY_WORKOUTS.home }]
}

export function getCompletedWorkoutSessions(workoutProgress = {}) {
  const completed = []

  for (const mode of ['gym', 'home']) {
    for (const { difficulty, plans } of getPlansForMode(mode)) {
      const progressKey = mode === 'gym' ? workoutProgress.gym?.[difficulty] : workoutProgress.home
      const savedWeekIds = new Set(Object.keys(progressKey ?? {}))
      if (mode === 'gym' && difficulty === 'Beginner') {
        Object.keys(workoutProgress.gym ?? {}).forEach((key) => {
          if (/^\d{4}-\d{2}-\d{2}$/.test(key)) savedWeekIds.add(key)
        })
      }

      for (const weekId of savedWeekIds) {
        for (const [index, day] of WEEKDAYS.entries()) {
          const exercises = plans[index].exercises
          const dayProgress = getDayProgress(workoutProgress, mode, weekId, day.id, difficulty)
          if (exercises.length > 0 && exercises.every(({ id }) => dayProgress[id] === true)) {
            completed.push({ mode, ...(difficulty ? { difficulty } : {}), weekId, dayId: day.id })
          }
        }
      }
    }
  }

  return completed
}

export function getWeekId(date = new Date()) {
  const monday = new Date(date)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return [monday.getFullYear(), String(monday.getMonth() + 1).padStart(2, '0'), String(monday.getDate()).padStart(2, '0')].join('-')
}

export function getWeekDateKeys(weekId) {
  const [year, month, day] = weekId.split('-').map(Number)
  const monday = new Date(year, month - 1, day)
  return WEEKDAYS.map((_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
  })
}

export function getWorkoutProgress(workoutProgress = {}, date = new Date()) {
  const weekId = getWeekId(date)
  const dayIndex = (date.getDay() + 6) % 7
  const dayId = WEEKDAYS[dayIndex].id
  const plans = ['gym', 'home'].flatMap((mode) => getPlansForMode(mode).map(({ difficulty, plans: modePlans }) => ({
    mode,
    difficulty,
    plan: modePlans[dayIndex],
  })))
  const dailyProgresses = plans.map(({ mode, difficulty, plan }) => {
    if (!plan.exercises.length) return null
    const dayProgress = getDayProgress(workoutProgress, mode, weekId, dayId, difficulty)
    const completedExercises = plan.exercises.filter(({ id }) => dayProgress[id] === true).length
    return {
      dailyPercent: Math.round((completedExercises / plan.exercises.length) * 100),
      completedExercises,
      totalExercises: plan.exercises.length,
    }
  }).filter(Boolean)
  const bestDailyProgress = dailyProgresses.reduce((best, progress) => (
    !best || progress.dailyPercent > best.dailyPercent ? progress : best
  ), null)
  const completedDays = WEEKDAYS.reduce((total, day, index) => {
    const hasCompletedWorkout = ['gym', 'home'].some((mode) => getPlansForMode(mode).some(({ difficulty, plans: modePlans }) => {
      const exercises = modePlans[index].exercises
      const dayProgress = getDayProgress(workoutProgress, mode, weekId, day.id, difficulty)
      return exercises.length > 0 && exercises.every(({ id }) => dayProgress[id] === true)
    }))
    return total + Number(hasCompletedWorkout)
  }, 0)
  const completedInWeek = getCompletedWorkoutSessions(workoutProgress).filter(({ weekId: savedWeek }) => savedWeek === weekId).length

  return {
    dailyPercent: bestDailyProgress?.dailyPercent ?? null,
    completedExercises: bestDailyProgress?.completedExercises ?? 0,
    totalExercises: bestDailyProgress?.totalExercises ?? 0,
    completedDays,
    plannedDays: WEEKLY_WORKOUTS.gym.filter(({ exercises }) => exercises.length > 0).length,
    completedSessions: completedInWeek,
    weekId,
    activityByDay: WEEKDAYS.map((day, index) => ({
      ...day,
      completed: ['gym', 'home'].some((mode) => getPlansForMode(mode).some(({ difficulty, plans: modePlans }) => {
        const exercises = modePlans[index].exercises
        const dayProgress = getDayProgress(workoutProgress, mode, weekId, day.id, difficulty)
        return exercises.length > 0 && exercises.every(({ id }) => dayProgress[id] === true)
      })),
    })),
  }
}

export function getWorkoutActivityRecords(workoutProgress = {}) {
  const savedWeekIds = new Set()
  const completedSessions = getCompletedWorkoutSessions(workoutProgress)
  for (const weekId of Object.keys(workoutProgress.home ?? {})) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(weekId)) savedWeekIds.add(weekId)
  }
  for (const difficulty of GYM_DIFFICULTIES) {
    for (const weekId of Object.keys(workoutProgress.gym?.[difficulty] ?? {})) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(weekId)) savedWeekIds.add(weekId)
    }
  }
  for (const weekId of Object.keys(workoutProgress.gym ?? {})) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(weekId)) savedWeekIds.add(weekId)
  }

  const records = {}
  for (const weekId of savedWeekIds) {
    const [year, month, day] = weekId.split('-').map(Number)
    const monday = new Date(year, month - 1, day)
    for (const [index, weekday] of WEEKDAYS.entries()) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      const dateKey = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
      const hasExercises = ['gym', 'home'].some((mode) => getPlansForMode(mode).some(({ difficulty }) => (
        Object.values(getDayProgress(workoutProgress, mode, weekId, weekday.id, difficulty)).some((completed) => completed === true)
      )))
      if (!hasExercises) continue

      const completedOnDate = completedSessions.filter((session) => session.weekId === weekId && session.dayId === weekday.id).length
      const dailyProgress = getWorkoutProgress(workoutProgress, date)
      records[dateKey] = {
        workoutPercent: dailyProgress.dailyPercent ?? 0,
        completedExercises: dailyProgress.completedExercises,
        totalExercises: dailyProgress.totalExercises,
        completedWorkout: completedOnDate > 0,
        completedSessions: completedOnDate,
      }
    }
  }
  return records
}

function isDatedRecord(record) {
  return Boolean(record)
    && typeof record.date === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(record.date)
    && record.data !== null
    && typeof record.data === 'object'
}

export function buildDailyProgressRecords({
  waterHistory = {},
  habitHistory = {},
  mealHistory = {},
  workoutProgress = {},
} = {}) {
  const dates = new Set()
  for (const history of [waterHistory, habitHistory]) {
    for (const record of Object.values(history)) {
      if (isDatedRecord(record)) dates.add(record.date)
    }
  }
  for (const date of Object.keys(mealHistory)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) dates.add(date)
  }

  const workoutRecords = getWorkoutActivityRecords(workoutProgress)
  Object.keys(workoutRecords).forEach((date) => dates.add(date))
  const mealById = new Map(INDIAN_MEALS.map((meal) => [meal.id, meal]))

  return [...dates].sort().map((date) => {
    const waterRecord = waterHistory[date]
    const habitRecord = habitHistory[date]
    const meals = mealHistory[date] && typeof mealHistory[date] === 'object' ? mealHistory[date] : {}
    const mealsConsumed = Object.values(meals).reduce((total, mealId) => total + (mealById.get(mealId)?.calories ?? 0), 0)
    const completedHabits = DAILY_HABITS.filter(({ id }) => habitRecord?.data?.[id] === true).length
    const workout = workoutRecords[date] ?? {}

    return {
      date,
      caloriesConsumedKcal: mealsConsumed,
      caloriesBurnedKcal: 0,
      waterMl: Number.isFinite(waterRecord?.data?.totalMl) ? waterRecord.data.totalMl : 0,
      completedHabits,
      totalHabits: DAILY_HABITS.length,
      habitPercent: Math.round((completedHabits / DAILY_HABITS.length) * 100),
      workoutPercent: workout.workoutPercent ?? 0,
      completedExercises: workout.completedExercises ?? 0,
      totalExercises: workout.totalExercises ?? 0,
      completedWorkout: workout.completedWorkout ?? false,
      completedSessions: workout.completedSessions ?? 0,
      completedGoals: Number((waterRecord?.data?.totalMl ?? 0) >= DAILY_WATER_GOAL_ML)
        + Number(completedHabits === DAILY_HABITS.length),
      meals,
    }
  })
}

export function getProgressPeriodSummary(records, startDate, endDate) {
  const periodRecords = records.filter(({ date }) => date >= startDate && date <= endDate)
  const total = (selector) => periodRecords.reduce((sum, record) => sum + selector(record), 0)
  return {
    trackedDays: periodRecords.length,
    caloriesConsumedKcal: total(({ caloriesConsumedKcal }) => caloriesConsumedKcal),
    caloriesBurnedKcal: total(({ caloriesBurnedKcal }) => caloriesBurnedKcal),
    completedWorkouts: total(({ completedWorkout }) => Number(completedWorkout)),
    completedExercises: total(({ completedExercises }) => completedExercises),
    averageWaterMl: periodRecords.length ? Math.round(total(({ waterMl }) => waterMl) / periodRecords.length) : 0,
    averageHabitPercent: periodRecords.length ? Math.round(total(({ habitPercent }) => habitPercent) / periodRecords.length) : 0,
  }
}

export function getBadgeEligibility({ completedWorkouts = 0, waterMl = 0, completedHabitCount = 0, habitCount = DAILY_HABITS.length } = {}) {
  return {
    'first-workout': completedWorkouts >= 1,
    'hydration-hero': waterMl >= DAILY_WATER_GOAL_ML,
    'habit-builder': habitCount > 0 && completedHabitCount >= habitCount,
    'workout-champion': completedWorkouts >= 5,
  }
}

export function getEligibleBadgeIds({ workoutProgress = {}, waterRecord, habitRecord } = {}) {
  const completedHabitCount = DAILY_HABITS.filter(({ id }) => habitRecord?.data?.[id] === true).length
  const eligible = getBadgeEligibility({
    completedWorkouts: getCompletedWorkoutSessions(workoutProgress).length,
    waterMl: waterRecord?.data?.totalMl ?? 0,
    completedHabitCount,
  })
  return BADGES.filter(({ id }) => eligible[id]).map(({ id }) => id)
}

export function loadEarnedBadgeIds() {
  const saved = readLocalJson(REWARDS_STORAGE_KEY, [])
  return Array.isArray(saved) ? [...new Set(saved.filter((id) => BADGES.some((badge) => badge.id === id)))] : []
}

export function saveNewlyEarnedBadges({ workoutProgress, waterRecord, habitRecord } = {}) {
  const existing = loadEarnedBadgeIds()
  const earned = [...new Set([...existing, ...getEligibleBadgeIds({ workoutProgress, waterRecord, habitRecord })])]

  if (earned.length !== existing.length) {
    if (writeLocalJson(REWARDS_STORAGE_KEY, earned)) {
      window.dispatchEvent(new Event(BADGE_UPDATE_EVENT))
    }
  }

  return earned
}
