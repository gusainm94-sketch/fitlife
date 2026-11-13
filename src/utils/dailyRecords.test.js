import assert from 'node:assert/strict'
import test from 'node:test'
import { getDailyHistoryStorageKey, loadDailyRecord, saveDailyRecord } from './dailyRecords.js'
import { SESSION_STORAGE_KEY } from './localStorage.js'

function createStorage(values = {}) {
  const entries = new Map(Object.entries(values))
  return {
    get length() {
      return entries.size
    },
    getItem(key) {
      return entries.get(key) ?? null
    },
    setItem(key, value) {
      entries.set(key, value)
    },
    key(index) {
      return [...entries.keys()][index] ?? null
    },
    entries,
  }
}

const createInitialData = () => ({ waterMl: 0 })
const isValidData = (value) => Boolean(value) && Number.isFinite(value.waterMl) && value.waterMl >= 0

test('daily records persist on refresh and archive the previous date without creating gap records', () => {
  const storage = createStorage({
    [SESSION_STORAGE_KEY]: JSON.stringify({ userId: 'account-a' }),
    'legacy-fitlife-data': 'keep',
  })
  globalThis.window = { localStorage: storage }

  try {
    const first = loadDailyRecord('tracker', createInitialData, isValidData, '2026-11-12')
    assert.deepEqual(first.record, { date: '2026-11-12', data: { waterMl: 0 } })
    const savedFirst = { date: first.record.date, data: { waterMl: 750 } }
    storage.setItem('fitlife.user.account-a.tracker', JSON.stringify(savedFirst))

    const sameDay = loadDailyRecord('tracker', createInitialData, isValidData, '2026-11-12')
    assert.deepEqual(sameDay.record, savedFirst)

    const nextDay = loadDailyRecord('tracker', createInitialData, isValidData, '2026-11-14')
    assert.deepEqual(nextDay.record, { date: '2026-11-14', data: { waterMl: 0 } })
    assert.deepEqual(Object.keys(nextDay.history), ['2026-11-12'])
    assert.equal(saveDailyRecord('tracker', nextDay.record, isValidData), true)
    assert.equal(saveDailyRecord('tracker', nextDay.record, isValidData), true)

    const reopened = loadDailyRecord('tracker', createInitialData, isValidData, '2026-11-14')
    assert.deepEqual(reopened.history['2026-11-12'], savedFirst)
    assert.equal(reopened.history['2026-11-13'], undefined)
    assert.equal(storage.getItem('legacy-fitlife-data'), 'keep')
    assert.ok(storage.getItem(`fitlife.user.account-a.${getDailyHistoryStorageKey('tracker')}`))
  } finally {
    delete globalThis.window
  }
})

test('daily archives remain separated by signed-in account', () => {
  const storage = createStorage({
    [SESSION_STORAGE_KEY]: JSON.stringify({ userId: 'account-a' }),
  })
  globalThis.window = { localStorage: storage }

  try {
    saveDailyRecord('tracker', { date: '2026-11-13', data: { waterMl: 500 } }, isValidData)
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ userId: 'account-b' }))
    const otherAccount = loadDailyRecord('tracker', createInitialData, isValidData, '2026-11-13')
    assert.deepEqual(otherAccount.record, { date: '2026-11-13', data: { waterMl: 0 } })
    assert.deepEqual(otherAccount.history, {})
  } finally {
    delete globalThis.window
  }
})

test('a failed archive write does not replace the current saved record', () => {
  const storage = createStorage({
    [SESSION_STORAGE_KEY]: JSON.stringify({ userId: 'account-a' }),
  })
  globalThis.window = { localStorage: storage }

  try {
    const previous = { date: '2026-11-12', data: { waterMl: 1000 } }
    assert.equal(saveDailyRecord('tracker', previous, isValidData), true)
    const setItem = storage.setItem.bind(storage)
    storage.setItem = (key, value) => {
      if (key.endsWith(getDailyHistoryStorageKey('tracker'))) throw new Error('Storage full')
      setItem(key, value)
    }

    assert.equal(saveDailyRecord('tracker', { date: '2026-11-13', data: { waterMl: 0 } }, isValidData), false)
    assert.deepEqual(
      JSON.parse(storage.getItem('fitlife.user.account-a.tracker')),
      previous,
    )
  } finally {
    delete globalThis.window
  }
})
