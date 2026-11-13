import assert from 'node:assert/strict'
import test from 'node:test'
import {
  addMonthsToDate,
  createDefaultMembership,
  isMembershipExpired,
  MEMBERSHIP_STORAGE_KEY,
  normalizeMembership,
  redeemPartnerCode,
  startPremiumMembership,
} from './membership.js'
import { readLocalJson, writeLocalJson, SESSION_STORAGE_KEY } from '../utils/localStorage.js'

test('membership dates add calendar months and clamp to the end of shorter months', () => {
  assert.equal(addMonthsToDate('2026-01-31', 1), '2026-02-28')
  assert.equal(addMonthsToDate('2026-11-13', 6), '2027-05-13')
})

test('partner demo codes activate the specified duration and cannot be reused', () => {
  const redeemed = redeemPartnerCode(createDefaultMembership('2026-11-13'), ' fitlife-3m ', '2026-11-13')
  assert.equal(redeemed.membership.plan, 'Partner')
  assert.equal(redeemed.membership.membershipExpiryDate, '2027-02-13')
  assert.equal(redeemed.membership.partnerActivationStatus, 'active')
  assert.match(redeemPartnerCode(redeemed.membership, 'FITLIFE-3M').error, /already been redeemed/)
  assert.match(redeemPartnerCode(redeemed.membership, 'unknown').error, /not recognized/)
})

test('premium demo durations and expired memberships are normalized', () => {
  const premium = startPremiumMembership(createDefaultMembership(), 6, '2026-11-13')
  assert.equal(premium.plan, 'Premium')
  assert.equal(premium.membershipExpiryDate, '2027-05-13')
  assert.equal(startPremiumMembership(premium, 3), null)
  assert.equal(normalizeMembership({ ...premium, membershipExpiryDate: '2026-11-12' }, '2026-11-13').plan, 'Free')
  assert.equal(isMembershipExpired({ membershipExpiryDate: '2026-11-12' }, '2026-11-13'), true)
  assert.equal(isMembershipExpired({ membershipExpiryDate: '2026-11-13' }, '2026-11-13'), false)
})

test('Premium replaces an active partner plan without reporting the code as active', () => {
  const partner = redeemPartnerCode(createDefaultMembership(), 'FITLIFE-1M', '2026-11-13').membership
  const premium = startPremiumMembership(partner, 1, '2026-11-13')
  assert.equal(premium.plan, 'Premium')
  assert.equal(premium.partnerActivationStatus, 'superseded')
  assert.equal(premium.membershipExpiryDate, '2026-12-13')
})

test('membership records stay separate for each signed-in account', () => {
  const storage = {
    [SESSION_STORAGE_KEY]: JSON.stringify({ userId: 'account-a' }),
    getItem(key) { return Object.hasOwn(this, key) ? this[key] : null },
    setItem(key, value) { this[key] = value },
  }
  globalThis.window = { localStorage: storage }

  try {
    const accountAMembership = { ...createDefaultMembership('2026-11-13'), plan: 'Premium' }
    assert.equal(writeLocalJson(MEMBERSHIP_STORAGE_KEY, accountAMembership), true)
    storage[SESSION_STORAGE_KEY] = JSON.stringify({ userId: 'account-b' })
    assert.deepEqual(readLocalJson(MEMBERSHIP_STORAGE_KEY, null), null)
    assert.equal(writeLocalJson(MEMBERSHIP_STORAGE_KEY, createDefaultMembership('2026-11-13')), true)
    storage[SESSION_STORAGE_KEY] = JSON.stringify({ userId: 'account-a' })
    assert.deepEqual(readLocalJson(MEMBERSHIP_STORAGE_KEY, null), accountAMembership)
  } finally {
    delete globalThis.window
  }
})
