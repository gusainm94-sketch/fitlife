import { useCallback, useState } from 'react'
import AuthContext from './authContext.js'
import { ACCOUNTS_STORAGE_KEY, migrateLegacyAccountData, SESSION_STORAGE_KEY } from '../utils/localStorage.js'

function loadAuthenticatedUser() {
  try {
    const accounts = JSON.parse(window.localStorage.getItem(ACCOUNTS_STORAGE_KEY) ?? '[]')
    const session = JSON.parse(window.localStorage.getItem(SESSION_STORAGE_KEY) ?? 'null')
    if (!Array.isArray(accounts) || !session?.userId) return null
    const account = accounts.find(({ id }) => id === session.userId)
    return account ? { id: account.id, name: account.name, email: account.email } : null
  } catch {
    return null
  }
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password)
  const digest = await window.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadAuthenticatedUser)

  const register = useCallback(async ({ name, email, password }) => {
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedName = name.trim()
    if (!normalizedName || !normalizedEmail || !password) return { error: 'Please complete every field.' }

    try {
      const accounts = JSON.parse(window.localStorage.getItem(ACCOUNTS_STORAGE_KEY) ?? '[]')
      if (!Array.isArray(accounts)) return { error: 'Unable to read saved accounts. Please check browser storage.' }
      if (accounts.some((account) => account.email === normalizedEmail)) {
        return { error: 'An account with this email already exists. Please log in.' }
      }

      const id = window.crypto.randomUUID()
      const account = { id, name: normalizedName, email: normalizedEmail, passwordHash: await hashPassword(password) }
      if (accounts.length === 0 && !migrateLegacyAccountData(id, normalizedName)) {
        return { error: 'Unable to migrate your saved fitness data. Please check browser storage.' }
      }
      window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify([...accounts, account]))
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ userId: id }))
      const authenticatedUser = { id, name: normalizedName, email: normalizedEmail }
      setUser(authenticatedUser)
      return { user: authenticatedUser }
    } catch {
      return { error: 'Unable to save your account. Please check browser storage and try again.' }
    }
  }, [])

  const login = useCallback(async ({ email, password }) => {
    try {
      const accounts = JSON.parse(window.localStorage.getItem(ACCOUNTS_STORAGE_KEY) ?? '[]')
      const account = Array.isArray(accounts)
        ? accounts.find((item) => item.email === email.trim().toLowerCase())
        : null
      if (!account || account.passwordHash !== await hashPassword(password)) {
        return { error: 'Email or password is incorrect.' }
      }

      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ userId: account.id }))
      const authenticatedUser = { id: account.id, name: account.name, email: account.email }
      setUser(authenticatedUser)
      return { user: authenticatedUser }
    } catch {
      return { error: 'Unable to log in. Please check browser storage and try again.' }
    }
  }, [])

  const logout = useCallback(() => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, register, login, logout }}>{children}</AuthContext.Provider>
}
