import { getTodayKey } from '../utils/date.js'

export const MEMBERSHIP_STORAGE_KEY = 'fitlife.membership.v1'

export const PARTNER_DEMO_CODES = {
  'FITLIFE-1M': 1,
  'FITLIFE-3M': 3,
  'FITLIFE-6M': 6,
}

const plans = ['Free', 'Partner', 'Premium']

export function addMonthsToDate(dateString, months) {
  const [year, month, day] = dateString.split('-').map(Number)
  const targetMonth = new Date(Date.UTC(year, month - 1 + months, 1))
  const targetYear = targetMonth.getUTCFullYear()
  const targetMonthNumber = targetMonth.getUTCMonth()
  const lastDay = new Date(Date.UTC(targetYear, targetMonthNumber + 1, 0)).getUTCDate()
  const targetDay = Math.min(day, lastDay)
  return `${targetYear}-${String(targetMonthNumber + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`
}

export function createDefaultMembership(startDate = getTodayKey()) {
  return {
    plan: 'Free',
    membershipStartDate: startDate,
    membershipExpiryDate: null,
    partnerActivationStatus: 'not_activated',
    redeemedPartnerCodes: [],
  }
}

export function isMembershipExpired(membership, today = getTodayKey()) {
  return Boolean(membership.membershipExpiryDate && membership.membershipExpiryDate < today)
}

export function normalizeMembership(saved, today = getTodayKey()) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved) || !plans.includes(saved.plan)) {
    return createDefaultMembership(today)
  }

  const membershipStartDate = /^\d{4}-\d{2}-\d{2}$/.test(saved.membershipStartDate)
    ? saved.membershipStartDate
    : today
  const membershipExpiryDate = /^\d{4}-\d{2}-\d{2}$/.test(saved.membershipExpiryDate)
    ? saved.membershipExpiryDate
    : null
  const redeemedPartnerCodes = Array.isArray(saved.redeemedPartnerCodes)
    ? saved.redeemedPartnerCodes.filter((code) => Object.hasOwn(PARTNER_DEMO_CODES, code))
    : []
  const expired = membershipExpiryDate && membershipExpiryDate < today && saved.plan !== 'Free'

  return {
    plan: expired ? 'Free' : saved.plan,
    membershipStartDate,
    membershipExpiryDate,
    partnerActivationStatus: expired && saved.plan === 'Partner'
      ? 'expired'
      : saved.partnerActivationStatus === 'active' || saved.partnerActivationStatus === 'expired'
        || saved.partnerActivationStatus === 'superseded'
        ? saved.partnerActivationStatus
        : 'not_activated',
    redeemedPartnerCodes,
  }
}

export function redeemPartnerCode(membership, code, today = getTodayKey()) {
  const normalizedCode = typeof code === 'string' ? code.trim().toUpperCase() : ''
  const durationMonths = PARTNER_DEMO_CODES[normalizedCode]
  if (!durationMonths) return { error: 'That demo code is not recognized. Check the code and try again.' }
  if (membership.redeemedPartnerCodes.includes(normalizedCode)) {
    return { error: 'This demo code has already been redeemed on this account.' }
  }

  const nextMembership = {
    ...membership,
    plan: 'Partner',
    membershipStartDate: today,
    membershipExpiryDate: addMonthsToDate(today, durationMonths),
    partnerActivationStatus: 'active',
    redeemedPartnerCodes: [...membership.redeemedPartnerCodes, normalizedCode],
  }
  return { membership: nextMembership, durationMonths }
}

export function startPremiumMembership(membership, months, today = getTodayKey()) {
  if (months !== 1 && months !== 6) return null
  return {
    ...membership,
    plan: 'Premium',
    membershipStartDate: today,
    membershipExpiryDate: addMonthsToDate(today, months),
    partnerActivationStatus: membership.partnerActivationStatus === 'not_activated'
      ? 'not_activated'
      : 'superseded',
  }
}
