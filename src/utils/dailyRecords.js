import { getTodayKey } from './date.js'
import { readLocalJson, writeLocalJson } from './localStorage.js'

export function getDailyHistoryStorageKey(key) {
  return `${key}.history.v1`
}

function isRecord(value, isValidData) {
  return Boolean(value)
    && typeof value.date === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(value.date)
    && isValidData(value.data)
}

export function loadDailyRecord(key, createInitialData, isValidData, date = getTodayKey()) {
  const saved = readLocalJson(key, null)
  const savedHistory = readLocalJson(getDailyHistoryStorageKey(key), {})
  const history = savedHistory && typeof savedHistory === 'object' && !Array.isArray(savedHistory)
    ? { ...savedHistory }
    : {}

  if (isRecord(saved, isValidData)) history[saved.date] = saved
  const historicalRecord = history[date]
  if (isRecord(historicalRecord, isValidData)) return { record: historicalRecord, history }
  if (isRecord(saved, isValidData) && saved.date === date) return { record: saved, history }
  return { record: { date, data: createInitialData() }, history }
}

export function saveDailyRecord(key, record, isValidData) {
  const historyKey = getDailyHistoryStorageKey(key)
  const storedHistory = readLocalJson(historyKey, {})
  const history = storedHistory && typeof storedHistory === 'object' && !Array.isArray(storedHistory)
    ? { ...storedHistory }
    : {}
  const previous = readLocalJson(key, null)

  if (isRecord(previous, isValidData) && previous.date !== record.date && !history[previous.date]) {
    history[previous.date] = previous
  }
  history[record.date] = record

  if (!writeLocalJson(historyKey, history)) return false
  const currentSaved = writeLocalJson(key, record)
  return currentSaved
}
