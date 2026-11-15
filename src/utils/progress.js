import { DAILY_HABITS, DAILY_WATER_GOAL_ML } from '../data/dailyTrackers.js'
import { GYM_DIFFICULTIES, GYM_WORKOUTS, WEEKDAYS, WEEKLY_WORKOUTS } from '../data/workouts.js'
import { normalizeFoodIntake } from '../data/foodIntake.js'
import { readLocalJson, writeLocalJson } from './localStorage.js'

export const REWARDS_STORAGE_KEY = 'fitlife.earned-badges.v1'
export const ACHIEVEMENT_DETAILS_STORAGE_KEY = 'fitlife.achievement-details.v1'
export const VISITED_SECTIONS_STORAGE_KEY = 'fitlife.visited-sections.v1'
export const BADGE_UPDATE_EVENT = 'fitlife:badges-updated'

export const BADGES = [
  { id: 'first-workout', name: 'First Workout', description: 'Complete every exercise in your first workout session.', icon: 'dumbbell' },
  { id: 'hydration-hero', name: 'Hydration Hero', description: 'Reach your daily water goal of 2,000 ml.', icon: 'droplets', legacy: true },
  { id: 'habit-builder', name: 'Habit Builder · Legacy', description: 'Complete all daily habits.', icon: 'check', legacy: true },
  { id: 'workout-champion', name: 'Workout Champion · Legacy', description: 'Complete five workout sessions.', icon: 'trophy', legacy: true },
  { id: 'workout-regular', name: 'Workout Regular', description: 'Complete 5 workouts.', icon: 'dumbbell', target: 5 },
  { id: 'fitness-enthusiast', name: 'Fitness Enthusiast', description: 'Complete 10 workouts.', icon: 'flame', target: 10 },
  { id: 'workout-champion-25', name: 'Workout Champion', description: 'Complete 25 workouts.', icon: 'trophy', target: 25 },
  { id: 'weekly-warrior', name: 'Weekly Warrior', description: 'Complete workouts on 5 different days in one week.', icon: 'calendar', target: 5 },
  { id: 'consistency-king', name: 'Consistency King', description: 'Maintain a 7-day workout streak.', icon: 'flame', target: 7 },
  { id: 'first-healthy-meal', name: 'First Healthy Meal', description: 'Log your first meal as eaten.', icon: 'utensils', target: 1 },
  { id: 'healthy-eating', name: 'Healthy Eating', description: 'Log meals on 5 different days.', icon: 'utensils', target: 5 },
  { id: 'nutrition-explorer', name: 'Nutrition Explorer', description: 'Save 5 different meal plans.', icon: 'leaf', target: 5 },
  { id: 'meal-planner', name: 'Meal Planner', description: 'Create your first diet chart.', icon: 'calendar', target: 1 },
  { id: 'first-glass', name: 'First Glass', description: 'Record your first water intake.', icon: 'droplets', target: 1 },
  { id: 'hydration-habit', name: 'Hydration Habit', description: 'Reach your daily water goal for 3 days.', icon: 'droplets', target: 3 },
  { id: 'hydration-champion', name: 'Hydration Champion', description: 'Reach your daily water goal for 7 days.', icon: 'trophy', target: 7 },
  { id: 'first-step', name: 'First Step', description: 'Complete your first habit.', icon: 'check', target: 1 },
  { id: 'habit-builder-10', name: 'Habit Builder', description: 'Complete 10 habits.', icon: 'check', target: 10 },
  { id: 'consistency-matters', name: 'Consistency Matters', description: 'Maintain a 7-day habit streak.', icon: 'calendar', target: 7 },
  { id: 'progress-tracker', name: 'Progress Tracker', description: 'Record your first progress entry.', icon: 'chart', target: 1 },
  { id: 'getting-started', name: 'Getting Started', description: 'Complete your profile.', icon: 'user', target: 1 },
  { id: 'goal-setter', name: 'Goal Setter', description: 'Set your fitness goal.', icon: 'target', target: 1 },
  { id: 'fitlife-explorer', name: 'FitLife Explorer', description: 'Visit all major FitLife sections.', icon: 'star', target: 9 },
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
  foodIntakeHistory = [],
  workoutProgress = {},
  calorieHistory = [],
  fitnessTrackerRecords = [],
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
  for (const activity of calorieHistory) {
    if (activity && typeof activity.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(activity.date)) {
      dates.add(activity.date)
    }
  }
  for (const record of fitnessTrackerRecords) {
    if (record && typeof record.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
      dates.add(record.date)
    }
  }
  const foodIntake = normalizeFoodIntake(foodIntakeHistory)
  for (const record of foodIntake) dates.add(record.date)

  const workoutRecords = getWorkoutActivityRecords(workoutProgress)
  Object.keys(workoutRecords).forEach((date) => dates.add(date))
  const trackerWorkoutMinutesByDate = new Map()
  for (const record of fitnessTrackerRecords) {
    if (!record || typeof record.date !== 'string' || !Number.isFinite(record.workoutMinutes)) continue
    trackerWorkoutMinutesByDate.set(
      record.date,
      (trackerWorkoutMinutesByDate.get(record.date) ?? 0) + record.workoutMinutes,
    )
  }
  const caloriesByDate = new Map()
  const seenCalorieIds = new Set()
  for (const activity of calorieHistory) {
    if (!activity || typeof activity.date !== 'string') continue
    if (typeof activity.id === 'string') {
      if (seenCalorieIds.has(activity.id)) continue
      seenCalorieIds.add(activity.id)
    }
    const calories = Number.isFinite(activity.caloriesKcal) && activity.caloriesKcal >= 0
      ? activity.caloriesKcal
      : 0
    caloriesByDate.set(activity.date, (caloriesByDate.get(activity.date) ?? 0) + calories)
  }
  const intakeCaloriesByDate = new Map()
  for (const record of foodIntake) {
    if (record.caloriesKcal === null) continue
    intakeCaloriesByDate.set(
      record.date,
      (intakeCaloriesByDate.get(record.date) ?? 0) + record.caloriesKcal,
    )
  }

  return [...dates].sort().map((date) => {
    const waterRecord = waterHistory[date]
    const habitRecord = habitHistory[date]
    const completedHabits = DAILY_HABITS.filter(({ id }) => habitRecord?.data?.[id] === true).length
    const workout = workoutRecords[date] ?? {}

    return {
      date,
      caloriesConsumedKcal: intakeCaloriesByDate.get(date) ?? 0,
      caloriesBurnedKcal: caloriesByDate.get(date) ?? 0,
      waterMl: Number.isFinite(waterRecord?.data?.totalMl) ? waterRecord.data.totalMl : 0,
      completedHabits,
      totalHabits: DAILY_HABITS.length,
      habitPercent: Math.round((completedHabits / DAILY_HABITS.length) * 100),
      workoutPercent: workout.workoutPercent ?? 0,
      completedExercises: workout.completedExercises ?? 0,
      totalExercises: workout.totalExercises ?? 0,
      completedWorkout: workout.completedWorkout ?? false,
      completedSessions: workout.completedSessions ?? 0,
      fitnessTrackerWorkoutMinutes: trackerWorkoutMinutesByDate.has(date)
        ? trackerWorkoutMinutesByDate.get(date)
        : null,
      completedGoals: Number((waterRecord?.data?.totalMl ?? 0) >= DAILY_WATER_GOAL_ML)
        + Number(completedHabits === DAILY_HABITS.length),
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

function isDateKey(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function dateKeyForWorkoutSession(session) {
  if (!session || !isDateKey(session.weekId)) return null
  const dayIndex = WEEKDAYS.findIndex(({ id }) => id === session.dayId)
  if (dayIndex < 0) return null
  return getWeekDateKeys(session.weekId)[dayIndex]
}

function getLongestDateStreak(dateKeys) {
  const sorted = [...new Set(dateKeys.filter(isDateKey))].sort()
  let longest = 0
  let current = 0
  let previous = null
  for (const dateKey of sorted) {
    const date = new Date(`${dateKey}T00:00:00`)
    const previousDate = previous ? new Date(`${previous}T00:00:00`) : null
    const difference = previousDate ? Math.round((date - previousDate) / 86400000) : null
    current = difference === 1 ? current + 1 : 1
    longest = Math.max(longest, current)
    previous = dateKey
  }
  return longest
}

function getDatedDataRecords(history = {}) {
  return Object.values(history).filter((record) => isDatedRecord(record))
}

function hasCompleteProfile(profile, profileSaved) {
  return Boolean(profileSaved && profile
    && typeof profile.name === 'string' && profile.name.trim()
    && Number.isFinite(profile.age)
    && Number.isFinite(profile.height)
    && Number.isFinite(profile.weight)
    && typeof profile.goal === 'string' && profile.goal.trim()
    && typeof profile.fitnessLevel === 'string' && profile.fitnessLevel.trim())
}

export function getAchievementContext({
  workoutProgress = {},
  waterRecord,
  habitRecord,
  waterHistory = {},
  habitHistory = {},
  foodIntake = [],
  dietCharts = [],
  profile = null,
  profileSaved = false,
  visitedSections = [],
  progressRecords = [],
} = {}) {
  const workoutSessions = getCompletedWorkoutSessions(workoutProgress)
  const workoutDates = workoutSessions.map(dateKeyForWorkoutSession).filter(Boolean)
  const workoutDatesByWeek = new Map()
  workoutSessions.forEach((session) => {
    const date = dateKeyForWorkoutSession(session)
    if (!date) return
    const dates = workoutDatesByWeek.get(session.weekId) ?? new Set()
    dates.add(date)
    workoutDatesByWeek.set(session.weekId, dates)
  })
  const weeklyWorkoutDays = Math.max(0, ...[...workoutDatesByWeek.values()].map((dates) => dates.size))

  const waterRecordsByDate = new Map(getDatedDataRecords(waterHistory).map((record) => [record.date, record]))
  if (waterRecord?.date && waterRecord?.data) waterRecordsByDate.set(waterRecord.date, waterRecord)
  const waterRecords = [...waterRecordsByDate.values()]
  const hydrationDates = [...new Set(waterRecords
    .filter(({ data }) => Number(data?.totalMl) >= DAILY_WATER_GOAL_ML)
    .map(({ date }) => date))]
  const waterEntryDates = [...new Set(waterRecords
    .filter(({ data }) => Number(data?.totalMl) > 0)
    .map(({ date }) => date))]

  const habitRecordsByDate = new Map(getDatedDataRecords(habitHistory).map((record) => [record.date, record]))
  if (habitRecord?.date && habitRecord?.data) habitRecordsByDate.set(habitRecord.date, habitRecord)
  const habitRecords = [...habitRecordsByDate.values()]
  const habitCompletionDates = [...new Set(habitRecords
    .filter(({ data }) => DAILY_HABITS.every(({ id }) => data?.[id] === true))
    .map(({ date }) => date))]
  const habitCompletedTotal = habitRecords.reduce((total, record) => (
    total + DAILY_HABITS.filter(({ id }) => record.data?.[id] === true).length
  ), 0)

  const safeFoodIntake = normalizeFoodIntake(foodIntake)
  const mealDates = [...new Set(safeFoodIntake.map(({ date }) => date))]
  const majorSections = ['/', '/workouts', '/nutrition', '/fitness-tracker', '/progress', '/habits', '/rewards', '/membership', '/bmi-profile']
  const visited = new Set(Array.isArray(visitedSections) ? visitedSections : [])
  const legacyEligible = getEligibleBadgeIds({ workoutProgress, waterRecord, habitRecord })
  const eligible = new Set(legacyEligible)
  const activity = {
    completedWorkouts: workoutSessions.length,
    weeklyWorkoutDays,
    workoutStreak: getLongestDateStreak(workoutDates),
    firstHealthyMeal: safeFoodIntake.length,
    healthyEatingDays: mealDates.length,
    savedMealPlans: Array.isArray(dietCharts) ? dietCharts.length : 0,
    hydrationDays: hydrationDates.length,
    waterEntryDays: waterEntryDates.length,
    firstHabit: habitCompletedTotal,
    completedHabits: habitCompletedTotal,
    habitStreak: getLongestDateStreak(habitCompletionDates),
    progressEntries: Array.isArray(progressRecords) ? progressRecords.length : 0,
    completeProfile: Number(hasCompleteProfile(profile, profileSaved)),
    goalSet: Number(Boolean(profileSaved && typeof profile?.goal === 'string' && profile.goal.trim())),
    visitedSections: majorSections.filter((section) => visited.has(section)).length,
  }

  const conditions = {
    'workout-regular': activity.completedWorkouts >= 5,
    'fitness-enthusiast': activity.completedWorkouts >= 10,
    'workout-champion-25': activity.completedWorkouts >= 25,
    'weekly-warrior': activity.weeklyWorkoutDays >= 5,
    'consistency-king': activity.workoutStreak >= 7,
    'first-healthy-meal': activity.firstHealthyMeal >= 1,
    'healthy-eating': activity.healthyEatingDays >= 5,
    'nutrition-explorer': activity.savedMealPlans >= 5,
    'meal-planner': activity.savedMealPlans >= 1,
    'first-glass': activity.waterEntryDays >= 1,
    'hydration-habit': activity.hydrationDays >= 3,
    'hydration-champion': activity.hydrationDays >= 7,
    'first-step': activity.firstHabit >= 1,
    'habit-builder-10': activity.completedHabits >= 10,
    'consistency-matters': activity.habitStreak >= 7,
    'progress-tracker': activity.progressEntries >= 1,
    'getting-started': activity.completeProfile === 1,
    'goal-setter': activity.goalSet === 1,
    'fitlife-explorer': activity.visitedSections >= majorSections.length,
  }
  Object.entries(conditions).forEach(([id, isEligible]) => {
    if (isEligible) eligible.add(id)
  })

  return { activity, eligibleIds: [...eligible] }
}

export function getAchievementProgress({
  workoutProgress = {},
  waterRecord,
  habitRecord,
  waterHistory,
  habitHistory,
  foodIntake,
  dietCharts,
  profile,
  profileSaved,
  visitedSections,
  progressRecords,
} = {}) {
  const { activity } = getAchievementContext({
    workoutProgress,
    waterRecord,
    habitRecord,
    waterHistory,
    habitHistory,
    foodIntake,
    dietCharts,
    profile,
    profileSaved,
    visitedSections,
    progressRecords,
  })
  return {
    'workout-regular': { current: activity.completedWorkouts, target: 5, label: 'workouts' },
    'fitness-enthusiast': { current: activity.completedWorkouts, target: 10, label: 'workouts' },
    'workout-champion-25': { current: activity.completedWorkouts, target: 25, label: 'workouts' },
    'weekly-warrior': { current: activity.weeklyWorkoutDays, target: 5, label: 'days this week' },
    'consistency-king': { current: activity.workoutStreak, target: 7, label: 'day streak' },
    'first-healthy-meal': { current: activity.firstHealthyMeal, target: 1, label: 'meal logged' },
    'healthy-eating': { current: activity.healthyEatingDays, target: 5, label: 'meal days' },
    'nutrition-explorer': { current: activity.savedMealPlans, target: 5, label: 'saved plans' },
    'meal-planner': { current: activity.savedMealPlans, target: 1, label: 'saved chart' },
    'first-glass': { current: activity.waterEntryDays, target: 1, label: 'day recorded' },
    'hydration-habit': { current: activity.hydrationDays, target: 3, label: 'goal days' },
    'hydration-champion': { current: activity.hydrationDays, target: 7, label: 'goal days' },
    'first-step': { current: activity.firstHabit, target: 1, label: 'habit completed' },
    'habit-builder-10': { current: activity.completedHabits, target: 10, label: 'habits completed' },
    'consistency-matters': { current: activity.habitStreak, target: 7, label: 'day streak' },
    'progress-tracker': { current: activity.progressEntries, target: 1, label: 'progress entry' },
    'getting-started': { current: activity.completeProfile, target: 1, label: 'profile complete' },
    'goal-setter': { current: activity.goalSet, target: 1, label: 'goal set' },
    'fitlife-explorer': { current: activity.visitedSections, target: 9, label: 'sections visited' },
  }
}

export function loadEarnedBadgeIds() {
  const saved = readLocalJson(REWARDS_STORAGE_KEY, [])
  return Array.isArray(saved) ? [...new Set(saved.filter((id) => BADGES.some((badge) => badge.id === id)))] : []
}

export function loadAchievementDetails() {
  const saved = readLocalJson(ACHIEVEMENT_DETAILS_STORAGE_KEY, [])
  if (!Array.isArray(saved)) return []
  const ids = new Set()
  return saved.filter((record) => {
    if (!record || typeof record.id !== 'string' || !BADGES.some((badge) => badge.id === record.id) || ids.has(record.id)) return false
    ids.add(record.id)
    return typeof record.unlockedAt === 'string' && Number.isFinite(Date.parse(record.unlockedAt))
  })
}

export function saveNewlyEarnedBadges({
  workoutProgress,
  waterRecord,
  habitRecord,
  waterHistory,
  habitHistory,
  foodIntake,
  dietCharts,
  profile,
  profileSaved,
  visitedSections,
  progressRecords,
} = {}) {
  const existing = loadEarnedBadgeIds()
  const fullContextProvided = [waterHistory, habitHistory, foodIntake, dietCharts, profile, visitedSections, progressRecords, profileSaved]
    .some((value) => value !== undefined)
  const eligible = fullContextProvided
    ? getAchievementContext({
      workoutProgress,
      waterRecord,
      habitRecord,
      waterHistory,
      habitHistory,
      foodIntake,
      dietCharts,
      profile,
      profileSaved,
      visitedSections,
      progressRecords,
    }).eligibleIds
    : getEligibleBadgeIds({ workoutProgress, waterRecord, habitRecord })
  const earned = [...new Set([...existing, ...eligible])]
  const newlyEarned = earned.filter((id) => !existing.includes(id))

  if (earned.length !== existing.length) {
    if (writeLocalJson(REWARDS_STORAGE_KEY, earned)) {
      const details = loadAchievementDetails()
      const nextDetails = [...details, ...newlyEarned.map((id) => ({ id, unlockedAt: new Date().toISOString() }))]
      writeLocalJson(ACHIEVEMENT_DETAILS_STORAGE_KEY, nextDetails)
      window.dispatchEvent(new Event(BADGE_UPDATE_EVENT))
    }
  }

  return earned
}
