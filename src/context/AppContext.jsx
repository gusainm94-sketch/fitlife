import { useCallback, useEffect, useMemo, useState } from 'react'
import { DASHBOARD_STATS, DEFAULT_PROFILE, FITNESS_LEVELS, PROFILE_STORAGE_KEY, WORKOUT_PROGRESS_STORAGE_KEY } from '../data/profile.js'
import { GYM_DIFFICULTIES } from '../data/workouts.js'
import { readLocalJson, writeLocalJson } from '../utils/localStorage.js'
import { saveNewlyEarnedBadges } from '../utils/progress.js'
import AppContext from './appContext.js'

function loadProfile() {
  const saved = readLocalJson(PROFILE_STORAGE_KEY, null)
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return DEFAULT_PROFILE

  return {
    name: typeof saved.name === 'string' && saved.name.trim() ? saved.name.trim() : DEFAULT_PROFILE.name,
    age: Number.isFinite(Number(saved.age)) ? Number(saved.age) : DEFAULT_PROFILE.age,
    height: Number.isFinite(Number(saved.height)) ? Number(saved.height) : DEFAULT_PROFILE.height,
    weight: Number.isFinite(Number(saved.weight)) ? Number(saved.weight) : DEFAULT_PROFILE.weight,
    goal: typeof saved.goal === 'string' && saved.goal ? saved.goal : DEFAULT_PROFILE.goal,
    fitnessLevel: FITNESS_LEVELS.includes(saved.fitnessLevel) ? saved.fitnessLevel : DEFAULT_PROFILE.fitnessLevel,
  }
}

function loadWorkoutProgress() {
  const saved = readLocalJson(WORKOUT_PROGRESS_STORAGE_KEY, {})
  const emptyProgress = { gym: Object.fromEntries(GYM_DIFFICULTIES.map((level) => [level, {}])), home: {} }
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return emptyProgress

  const loadWeeks = (savedWeeks) => {
    const weeks = {}
    if (!savedWeeks || typeof savedWeeks !== 'object' || Array.isArray(savedWeeks)) return weeks

    for (const [week, savedDays] of Object.entries(savedWeeks)) {
      if (!savedDays || typeof savedDays !== 'object' || Array.isArray(savedDays)) continue
      weeks[week] = Object.fromEntries(Object.entries(savedDays).map(([day, exercises]) => [
        day,
        exercises && typeof exercises === 'object' && !Array.isArray(exercises)
          ? Object.fromEntries(Object.entries(exercises).filter(([, completed]) => completed === true))
          : {},
      ]))
    }
    return weeks
  }
  const savedGym = saved.gym && typeof saved.gym === 'object' && !Array.isArray(saved.gym) ? saved.gym : {}
  const hasDifficultyData = GYM_DIFFICULTIES.some((level) => Object.hasOwn(savedGym, level))

  return {
    gym: Object.fromEntries(GYM_DIFFICULTIES.map((level) => [
      level,
      loadWeeks(hasDifficultyData ? savedGym[level] : level === 'Beginner' ? savedGym : {}),
    ])),
    home: loadWeeks(saved.home),
  }
}

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(loadProfile)
  const [workoutProgress, setWorkoutProgress] = useState(loadWorkoutProgress)
  const dashboardStats = DASHBOARD_STATS

  useEffect(() => {
    writeLocalJson(PROFILE_STORAGE_KEY, profile)
  }, [profile])

  useEffect(() => {
    writeLocalJson(WORKOUT_PROGRESS_STORAGE_KEY, workoutProgress)
  }, [workoutProgress])

  useEffect(() => {
    saveNewlyEarnedBadges({ workoutProgress })
  }, [workoutProgress])

  const updateProfile = useCallback((nextProfile) => {
    setProfile({
      name: nextProfile.name.trim(),
      age: Number(nextProfile.age),
      height: Number(nextProfile.height),
      weight: Number(nextProfile.weight),
      goal: nextProfile.goal,
      fitnessLevel: FITNESS_LEVELS.includes(nextProfile.fitnessLevel) ? nextProfile.fitnessLevel : DEFAULT_PROFILE.fitnessLevel,
    })
  }, [])

  const toggleWorkoutExercise = useCallback((mode, week, day, exerciseId, difficulty = 'Beginner') => {
    setWorkoutProgress((current) => {
      const progressKey = mode === 'gym' ? difficulty : mode
      const currentWeeks = current[mode]?.[progressKey] ?? {}
      const currentWeek = currentWeeks[week] ?? {}
      const currentDay = currentWeek[day] ?? {}
      const nextWeeks = {
        ...currentWeeks,
        [week]: {
          ...currentWeek,
          [day]: { ...currentDay, [exerciseId]: !currentDay[exerciseId] },
        },
      }

      if (mode === 'gym') {
        return {
          ...current,
          gym: { ...current.gym, [progressKey]: nextWeeks },
        }
      }

      return {
        ...current,
        [mode]: nextWeeks,
      }
    })
  }, [])

  const value = useMemo(() => ({
    profile,
    updateProfile,
    dashboardStats,
    workoutProgress,
    toggleWorkoutExercise,
  }), [profile, updateProfile, dashboardStats, workoutProgress, toggleWorkoutExercise])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
