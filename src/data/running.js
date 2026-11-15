export const RUNNING_SESSIONS_STORAGE_KEY = 'fitlife.running-sessions.v1'

const TRACKING_METHODS = ['gps', 'manual']
const MAX_REASONABLE_DISTANCE_KM = 500
const MAX_REASONABLE_DURATION_SECONDS = 24 * 60 * 60

function isFiniteNonNegative(value) {
  return Number.isFinite(value) && value >= 0
}

export function normalizeRunningSession(saved) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return null
  const distanceKm = Number(saved.distanceKm)
  const durationSeconds = Number(saved.durationSeconds)
  const caloriesKcal = saved.caloriesKcal === null || saved.caloriesKcal === undefined
    ? null
    : Number(saved.caloriesKcal)
  if (typeof saved.id !== 'string' || !saved.id
    || typeof saved.startedAt !== 'string' || !Number.isFinite(Date.parse(saved.startedAt))
    || typeof saved.finishedAt !== 'string' || !Number.isFinite(Date.parse(saved.finishedAt))
    || !TRACKING_METHODS.includes(saved.trackingMethod)
    || !isFiniteNonNegative(distanceKm) || distanceKm > MAX_REASONABLE_DISTANCE_KM
    || !Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > MAX_REASONABLE_DURATION_SECONDS
    || !(caloriesKcal === null || isFiniteNonNegative(caloriesKcal))) return null

  return {
    id: saved.id,
    startedAt: saved.startedAt,
    finishedAt: saved.finishedAt,
    distanceKm: Number(distanceKm.toFixed(3)),
    durationSeconds: Math.round(durationSeconds),
    caloriesKcal: caloriesKcal === null ? null : Math.round(caloriesKcal),
    trackingMethod: saved.trackingMethod,
    acceptedPoints: Number.isInteger(saved.acceptedPoints) && saved.acceptedPoints >= 0 ? saved.acceptedPoints : null,
  }
}

export function normalizeRunningSessions(saved) {
  if (!Array.isArray(saved)) return []
  const ids = new Set()
  return saved.map(normalizeRunningSession).filter((session) => {
    if (!session || ids.has(session.id)) return false
    ids.add(session.id)
    return true
  })
}

export function calculateRunningMetrics(distanceKm, durationSeconds) {
  const distance = Number(distanceKm)
  const duration = Number(durationSeconds)
  const paceSecondsPerKm = distance > 0 && duration > 0 ? duration / distance : null
  const averageSpeedKmh = distance > 0 && duration > 0 ? distance / (duration / 3600) : null
  return {
    paceSecondsPerKm: Number.isFinite(paceSecondsPerKm) ? paceSecondsPerKm : null,
    averageSpeedKmh: Number.isFinite(averageSpeedKmh) ? averageSpeedKmh : null,
  }
}

export function estimateRunningCalories(durationSeconds, weightKg) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || !Number.isFinite(weightKg) || weightKg <= 0) return null
  // A moderate running estimate; it is intentionally labelled as an estimate in the UI.
  return Math.round((8.3 * 3.5 * weightKg / 200) * (durationSeconds / 60))
}

export function formatRunningDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(Number(totalSeconds) || 0))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function formatRunningPace(secondsPerKm) {
  if (!Number.isFinite(secondsPerKm) || secondsPerKm <= 0) return '—'
  const minutes = Math.floor(secondsPerKm / 60)
  const seconds = Math.round(secondsPerKm % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')} / km`
}

export function haversineDistanceKm(first, second) {
  if (!first || !second || ![first.latitude, first.longitude, second.latitude, second.longitude].every(Number.isFinite)) return null
  const toRadians = (value) => value * Math.PI / 180
  const earthRadiusKm = 6371
  const latDelta = toRadians(second.latitude - first.latitude)
  const lonDelta = toRadians(second.longitude - first.longitude)
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(toRadians(first.latitude)) * Math.cos(toRadians(second.latitude)) * Math.sin(lonDelta / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
