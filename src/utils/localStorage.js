export const ACCOUNTS_STORAGE_KEY = 'fitlife.accounts.v1'
export const SESSION_STORAGE_KEY = 'fitlife.session.v1'

export function getAccountStorageKey(key) {
  if (key === 'fitlife.theme') return key
  try {
    const session = JSON.parse(window.localStorage.getItem(SESSION_STORAGE_KEY) ?? 'null')
    return session?.userId ? `fitlife.user.${session.userId}.${key}` : key
  } catch {
    return key
  }
}

export function readLocalJson(key, fallback) {
  try {
    const stored = window.localStorage.getItem(getAccountStorageKey(key))
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

export function writeLocalJson(key, value) {
  try {
    window.localStorage.setItem(getAccountStorageKey(key), JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function readLocalJsonEntries(prefix) {
  const scopedPrefix = getAccountStorageKey(prefix)
  const entries = {}
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (!key || !key.startsWith(scopedPrefix)) continue
      const stored = window.localStorage.getItem(key)
      if (!stored) continue
      try {
        entries[key.slice(scopedPrefix.length)] = JSON.parse(stored)
      } catch {
        continue
      }
    }
  } catch {
    return entries
  }
  return entries
}

export function migrateLegacyAccountData(userId, name) {
  const legacyPrefixes = [
    'fitlife.profile.v1',
    'fitlife.workouts.v1',
    'fitlife.calorie-activities.v1',
    'fitlife.equipment.v1',
    'fitlife.fitness-tracker.v1',
    'fitlife.food-intake.v1',
    'fitlife.diet-preferences.v1',
    'fitlife.diet-charts.v1',
    'fitlife.diet-prices.v1',
    'fitlife.nutrition-custom-ingredients.v1',
    'fitlife.nutrition-recipes.v1',
    'fitlife.membership.v1',
    'fitlife.music-favorites.v1',
    'fitlife-water-intake',
    'fitlife-daily-habits',
    'fitlife.earned-badges.v1',
    'fitlife-diet-plan-',
  ]

  try {
    const keys = Object.keys(window.localStorage)
    for (const key of keys) {
      if (!legacyPrefixes.some((prefix) => key === prefix || key.startsWith(prefix))) continue
      const accountKey = `fitlife.user.${userId}.${key}`
      if (window.localStorage.getItem(accountKey) !== null) continue
      let value = window.localStorage.getItem(key)
      if (key === 'fitlife.profile.v1' && value) {
        const profile = JSON.parse(value)
        if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
          value = JSON.stringify({ ...profile, name })
        }
      }
      if (value !== null) window.localStorage.setItem(accountKey, value)
    }
  } catch {
    return false
  }
  return true
}