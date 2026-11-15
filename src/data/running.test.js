import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateRunningMetrics, estimateRunningCalories, haversineDistanceKm, normalizeRunningSessions } from './running.js'

test('running metrics use safe zero-distance behavior and standard units', () => {
  assert.deepEqual(calculateRunningMetrics(0, 900), { paceSecondsPerKm: null, averageSpeedKmh: null })
  const metrics = calculateRunningMetrics(5, 1500)
  assert.equal(metrics.paceSecondsPerKm, 300)
  assert.equal(metrics.averageSpeedKmh, 12)
})

test('running sessions normalize valid history and reject malformed or duplicate records', () => {
  const session = {
    id: 'run:1',
    startedAt: '2026-11-15T06:00:00.000Z',
    finishedAt: '2026-11-15T06:30:00.000Z',
    distanceKm: 5.1234,
    durationSeconds: 1800,
    caloriesKcal: null,
    trackingMethod: 'manual',
  }
  assert.deepEqual(normalizeRunningSessions([session, session, { ...session, id: '' }]), [{
    ...session,
    distanceKm: 5.123,
    durationSeconds: 1800,
    acceptedPoints: null,
  }])
})

test('GPS distance and calorie estimate are explicitly approximate calculations', () => {
  const distance = haversineDistanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0.01 })
  assert.ok(distance > 1 && distance < 1.2)
  assert.equal(estimateRunningCalories(1800, 70), 305)
  assert.equal(estimateRunningCalories(1800, null), null)
})
