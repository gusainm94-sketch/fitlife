import { useCallback, useEffect, useState } from 'react'
import { getTodayKey } from '../utils/date.js'
import { readLocalJson } from '../utils/localStorage.js'
import { HABITS_STORAGE_KEY, WATER_STORAGE_KEY } from '../data/dailyTrackers.js'
import { WORKOUT_PROGRESS_STORAGE_KEY } from '../data/profile.js'
import { saveNewlyEarnedBadges } from '../utils/progress.js'
import { loadDailyRecord, saveDailyRecord } from '../utils/dailyRecords.js'

export function useDailyRecord(key, createInitialData, isValidData) {
  const [loaded] = useState(() => loadDailyRecord(key, createInitialData, isValidData))
  const [record, setRecord] = useState(loaded.record)
  const [history, setHistory] = useState(loaded.history)

  useEffect(() => {
    if (!saveDailyRecord(key, record, isValidData)) {
      console.error('FitLife could not save daily progress history. Check browser storage availability.')
    }
  }, [key, record, isValidData])

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
      const next = loadDailyRecord(key, createInitialData, isValidData, today)
      setHistory((current) => ({ ...current, ...next.history }))
      setRecord((current) => current.date === today ? current : next.record)
    }
    document.addEventListener('visibilitychange', refreshForToday)
    window.addEventListener('focus', refreshForToday)
    window.addEventListener('pageshow', refreshForToday)
    return () => {
      document.removeEventListener('visibilitychange', refreshForToday)
      window.removeEventListener('focus', refreshForToday)
      window.removeEventListener('pageshow', refreshForToday)
    }
  }, [key, createInitialData, isValidData])

  const updateData = useCallback((update) => {
    const today = getTodayKey()
    if (record.date !== today) {
      const next = loadDailyRecord(key, createInitialData, isValidData, today)
      setHistory((current) => ({ ...current, ...next.history }))
    }
    setRecord((current) => {
      const currentData = current.date === today ? current.data : createInitialData()
      const data = typeof update === 'function' ? update(currentData) : update
      return { date: today, data }
    })
  }, [createInitialData, isValidData, key, record.date])

  return { data: record.data, updateData, history: { ...history, [record.date]: record }, date: record.date }
}
