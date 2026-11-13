import { useCallback, useMemo, useState } from 'react'
import { createDefaultMembership, MEMBERSHIP_STORAGE_KEY, normalizeMembership, redeemPartnerCode, startPremiumMembership } from '../data/membership.js'
import { readLocalJson, writeLocalJson } from '../utils/localStorage.js'
import MembershipContext from './membershipContext.js'

function loadMembership() {
  const membership = normalizeMembership(readLocalJson(MEMBERSHIP_STORAGE_KEY, null))
  return { membership, storageError: !writeLocalJson(MEMBERSHIP_STORAGE_KEY, membership) }
}

export function MembershipProvider({ children, userId }) {
  const [initialState] = useState(loadMembership)
  const [membership, setMembership] = useState(initialState.membership)
  const [storageError, setStorageError] = useState(initialState.storageError)

  const commitMembership = useCallback((nextMembership) => {
    if (!writeLocalJson(MEMBERSHIP_STORAGE_KEY, nextMembership)) {
      setStorageError(true)
      return false
    }
    setMembership(nextMembership)
    setStorageError(false)
    return true
  }, [])

  const redeemCode = useCallback((code) => {
    const result = redeemPartnerCode(membership, code)
    if (!result.membership) return result
    return commitMembership(result.membership) ? result : { error: 'Unable to save membership. Please check browser storage and try again.' }
  }, [commitMembership, membership])

  const activatePremium = useCallback((months) => {
    const nextMembership = startPremiumMembership(membership, months)
    if (!nextMembership) return { error: 'Choose one of the available demo durations.' }
    if (!commitMembership(nextMembership)) return { error: 'Unable to save membership. Please check browser storage and try again.' }
    return { membership: nextMembership }
  }, [commitMembership, membership])

  const value = useMemo(() => ({
    membership: membership ?? createDefaultMembership(),
    redeemCode,
    activatePremium,
    storageError,
  }), [membership, redeemCode, activatePremium, storageError])

  return <MembershipContext.Provider value={value}>{userId && children}</MembershipContext.Provider>
}
