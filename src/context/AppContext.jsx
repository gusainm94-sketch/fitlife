import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DASHBOARD_STATS, normalizeProfile, PROFILE_STORAGE_KEY, WORKOUT_PROGRESS_STORAGE_KEY } from '../data/profile.js'
import { GYM_DIFFICULTIES } from '../data/workouts.js'
import { EQUIPMENT_PREFERENCES_STORAGE_KEY, normalizeEquipmentPreferences } from '../data/equipment.js'
import {
  CALORIE_ACTIVITIES_STORAGE_KEY,
  getCompletedWorkoutCalorieActivities,
  getProfileCalorieWeight,
  isCalorieActivity,
  mergeCalorieActivities,
  normalizeCalorieActivities,
  updateCalorieActivityDurationRecord,
} from '../data/calories.js'
import {
  FITNESS_TRACKER_STORAGE_KEY,
  getFitnessTrackerCalorieActivities,
  normalizeFitnessTrackerRecords,
} from '../data/fitnessTracker.js'
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
  const [savedCalorieActivities, setSavedCalorieActivities] = useState(() => (
    normalizeCalorieActivities(readLocalJson(CALORIE_ACTIVITIES_STORAGE_KEY, []))
  ))
  const [calorieStorageError, setCalorieStorageError] = useState(false)
  const [fitnessTrackerRecords, setFitnessTrackerRecords] = useState(() => (
    normalizeFitnessTrackerRecords(readLocalJson(FITNESS_TRACKER_STORAGE_KEY, []))
  ))
  const [fitnessTrackerStorageError, setFitnessTrackerStorageError] = useState(false)
  const [equipmentPreferences, setEquipmentPreferences] = useState(() => (
    normalizeEquipmentPreferences(readLocalJson(EQUIPMENT_PREFERENCES_STORAGE_KEY, null))
  ))
  const [equipmentStorageError, setEquipmentStorageError] = useState(false)
  const dashboardStats = DASHBOARD_STATS
  const baseCalorieActivities = useMemo(() => mergeCalorieActivities(
    savedCalorieActivities,
    getCompletedWorkoutCalorieActivities(workoutProgress, getProfileCalorieWeight(profile)),
  ), [profile, savedCalorieActivities, workoutProgress])
  const calorieActivities = useMemo(() => mergeCalorieActivities(
    baseCalorieActivities,
    getFitnessTrackerCalorieActivities(fitnessTrackerRecords),
  ), [baseCalorieActivities, fitnessTrackerRecords])

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

  useEffect(() => {
    if (baseCalorieActivities.length === savedCalorieActivities.length) return
    if (!writeLocalJson(CALORIE_ACTIVITIES_STORAGE_KEY, baseCalorieActivities)) {
      console.error('FitLife could not save calorie activity history. Check browser storage availability.')
    }
  }, [baseCalorieActivities, savedCalorieActivities.length])

  const addCalorieActivity = useCallback((activity) => {
    if (!isCalorieActivity(activity)) return false
    const next = mergeCalorieActivities(baseCalorieActivities, [activity])
    if (next.length === baseCalorieActivities.length) return false
    if (!writeLocalJson(CALORIE_ACTIVITIES_STORAGE_KEY, next)) {
      setCalorieStorageError(true)
      return false
    }
    setSavedCalorieActivities(next)
    setCalorieStorageError(false)
    return true
  }, [baseCalorieActivities])

  const updateCalorieActivityDuration = useCallback((id, durationMinutes) => {
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return false
    const current = baseCalorieActivities.find((activity) => activity.id === id)
    if (!current) return false
    const updated = updateCalorieActivityDurationRecord(current, durationMinutes)
    const next = baseCalorieActivities.map((activity) => activity.id === id ? updated : activity)
    if (!writeLocalJson(CALORIE_ACTIVITIES_STORAGE_KEY, next)) {
      setCalorieStorageError(true)
      return false
    }
    setSavedCalorieActivities(next)
    setCalorieStorageError(false)
    return true
  }, [baseCalorieActivities])

  const saveFitnessTrackerRecords = useCallback((records) => {
    const next = normalizeFitnessTrackerRecords(records)
    if (!writeLocalJson(FITNESS_TRACKER_STORAGE_KEY, next)) {
      setFitnessTrackerStorageError(true)
      return false
    }
    setFitnessTrackerRecords(next)
    setFitnessTrackerStorageError(false)
    return true
  }, [])

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

  const updateEquipmentPreferences = useCallback((nextPreferences) => {
    const normalized = normalizeEquipmentPreferences(nextPreferences)
    if (!writeLocalJson(EQUIPMENT_PREFERENCES_STORAGE_KEY, normalized)) {
      setEquipmentStorageError(true)
      return false
    }

    setEquipmentPreferences(normalized)
    setEquipmentStorageError(false)
    return true
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
    profileStorageError,
    dashboardStats,
    equipmentPreferences,
    updateEquipmentPreferences,
    equipmentStorageError,
    workoutProgress,
    toggleWorkoutExercise,
    calorieActivities,
    addCalorieActivity,
    updateCalorieActivityDuration,
    calorieStorageError,
    fitnessTrackerRecords,
    saveFitnessTrackerRecords,
    fitnessTrackerStorageError,
  }), [profile, updateProfile, profileStorageError, dashboardStats, equipmentPreferences, updateEquipmentPreferences, equipmentStorageError, workoutProgress, toggleWorkoutExercise, calorieActivities, addCalorieActivity, updateCalorieActivityDuration, calorieStorageError, fitnessTrackerRecords, saveFitnessTrackerRecords, fitnessTrackerStorageError])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
