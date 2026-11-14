import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DASHBOARD_STATS, normalizeProfile, PROFILE_STORAGE_KEY, WORKOUT_PROGRESS_STORAGE_KEY } from '../data/profile.js'
import { GYM_DIFFICULTIES } from '../data/workouts.js'
import { readLocalJson, writeLocalJson } from '../utils/localStorage.js'
import { saveNewlyEarnedBadges } from '../utils/progress.js'
import AppContext from './appContext.js'

function loadProfile(userName) {
  return normalizeProfile(readLocalJson(PROFILE_STORAGE_KEY, null), userName)
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

export function AppProvider({ children, user }) {
  const [profile, setProfile] = useState(() => loadProfile(user.name))
  const initialProfile = useRef(profile)
  const [profileStorageError, setProfileStorageError] = useState(false)
  const [workoutProgress, setWorkoutProgress] = useState(loadWorkoutProgress)
  const dashboardStats = DASHBOARD_STATS

  useEffect(() => {
    if (profile !== initialProfile.current) return
    if (!writeLocalJson(PROFILE_STORAGE_KEY, profile)) {
      console.error('FitLife could not save profile data. Check browser storage availability.')
    }
  }, [profile])

  useEffect(() => {
    writeLocalJson(WORKOUT_PROGRESS_STORAGE_KEY, workoutProgress)
  }, [workoutProgress])

  useEffect(() => {
    saveNewlyEarnedBadges({ workoutProgress })
  }, [workoutProgress])

  const updateProfile = useCallback((nextProfile) => {
    const updatedProfile = normalizeProfile({ ...profile, ...nextProfile }, user.name)
    if (!writeLocalJson(PROFILE_STORAGE_KEY, updatedProfile)) {
      setProfileStorageError(true)
      return false
    }

    setProfile(updatedProfile)
    setProfileStorageError(false)
    return true
  }, [profile, user.name])

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
    profileStorageError,
    dashboardStats,
    workoutProgress,
    toggleWorkoutExercise,
  }), [profile, updateProfile, profileStorageError, dashboardStats, workoutProgress, toggleWorkoutExercise])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
