import { DAILY_HABITS, DAILY_WATER_GOAL_ML } from '../data/dailyTrackers.js'
import { GYM_DIFFICULTIES, GYM_WORKOUTS, WEEKDAYS, WEEKLY_WORKOUTS } from '../data/workouts.js'

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

export function getWorkoutProgress(workoutProgress = {}, date = new Date()) {
  const weekId = getWeekId(date)
  const dayIndex = (date.getDay() + 6) % 7
  const dayId = WEEKDAYS[dayIndex].id
  const plans = ['gym', 'home'].flatMap((mode) => getPlansForMode(mode).map(({ difficulty, plans: modePlans }) => ({
    mode,
    difficulty,
    plan: modePlans[dayIndex],
  })))
  const dailyPercents = plans.map(({ mode, difficulty, plan }) => {
    if (!plan.exercises.length) return null
    const dayProgress = getDayProgress(workoutProgress, mode, weekId, dayId, difficulty)
    return Math.round((plan.exercises.filter(({ id }) => dayProgress[id] === true).length / plan.exercises.length) * 100)
  })
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
    dailyPercent: dailyPercents.some(Number.isFinite) ? Math.max(...dailyPercents.filter(Number.isFinite)) : null,
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
  try {
    const saved = JSON.parse(window.localStorage.getItem(REWARDS_STORAGE_KEY) ?? '[]')
    return Array.isArray(saved) ? [...new Set(saved.filter((id) => BADGES.some((badge) => badge.id === id)))] : []
  } catch {
    return []
  }
}

export function saveNewlyEarnedBadges({ workoutProgress, waterRecord, habitRecord } = {}) {
  const existing = loadEarnedBadgeIds()
  const earned = [...new Set([...existing, ...getEligibleBadgeIds({ workoutProgress, waterRecord, habitRecord })])]

  if (earned.length !== existing.length) {
    try {
      window.localStorage.setItem(REWARDS_STORAGE_KEY, JSON.stringify(earned))
      window.dispatchEvent(new Event(BADGE_UPDATE_EVENT))
    } catch {
      // Keep the app usable when browser storage is unavailable.
    }
  }

  return earned
}
