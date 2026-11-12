import { useCallback, useEffect, useState } from 'react'
import { readLocalJson, writeLocalJson } from '../utils/localStorage.js'
import { getTodayKey } from '../utils/date.js'
import { HABITS_STORAGE_KEY, WATER_STORAGE_KEY } from '../data/dailyTrackers.js'
import { WORKOUT_PROGRESS_STORAGE_KEY } from '../data/profile.js'
import { saveNewlyEarnedBadges } from '../utils/progress.js'

function loadRecord(key, createInitialData, isValidData, date = getTodayKey()) {
  const stored = readLocalJson(key, null)
  if (stored?.date === date && isValidData(stored.data)) return stored
  return { date, data: createInitialData() }
}

export function useDailyRecord(key, createInitialData, isValidData) {
  const [record, setRecord] = useState(() => loadRecord(key, createInitialData, isValidData))

  useEffect(() => {
    writeLocalJson(key, record)
  }, [key, record])

  useEffect(() => {
    if (key !== WATER_STORAGE_KEY && key !== HABITS_STORAGE_KEY) return
    const waterRecord = key === WATER_STORAGE_KEY ? record : readLocalJson(WATER_STORAGE_KEY, null)
    const habitRecord = key === HABITS_STORAGE_KEY ? record : readLocalJson(HABITS_STORAGE_KEY, null)
    const workoutProgress = readLocalJson(WORKOUT_PROGRESS_STORAGE_KEY, {})
    saveNewlyEarnedBadges({ workoutProgress, waterRecord, habitRecord })
  }, [key, record])

  useEffect(() => {
    const refreshForToday = () => {
      const today = getTodayKey()
      setRecord((current) => current.date === today
        ? current
        : loadRecord(key, createInitialData, isValidData, today))
    }
    const timer = window.setInterval(refreshForToday, 30_000)
    document.addEventListener('visibilitychange', refreshForToday)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refreshForToday)
    }
  }, [key, createInitialData, isValidData])

  const updateData = useCallback((update) => {
    setRecord((current) => {
      const today = getTodayKey()
      const currentData = current.date === today ? current.data : createInitialData()
      const data = typeof update === 'function' ? update(currentData) : update
      return { date: today, data }
    })
  }, [createInitialData])

  return { data: record.data, updateData }
}
