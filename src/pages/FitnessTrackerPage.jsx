import { useEffect, useRef, useState } from 'react'
import { Activity, CalendarDays, Check, CircleAlert, Clock3, Flame, Footprints, HeartPulse, LocateFixed, Moon, Pause, Pencil, Play, Plus, Save, Square, Trash2, Watch, X } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData.js'
import { getProfileCalorieWeight } from '../data/calories.js'
import { FITNESS_MEASUREMENTS, createFitnessTrackerRecord, getFitnessTrackerDailySummary, getFitnessTrackerHistory, isFitnessTrackerRecord } from '../data/fitnessTracker.js'
import { RUNNING_SESSIONS_STORAGE_KEY, calculateRunningMetrics, estimateRunningCalories, formatRunningDuration, formatRunningPace, haversineDistanceKm, normalizeRunningSessions } from '../data/running.js'
import { formatDateKey, getTodayKey } from '../utils/date.js'
import { readLocalJson, writeLocalJson } from '../utils/localStorage.js'
import './FitnessTracker.css'

const EMPTY_FORM = Object.fromEntries(FITNESS_MEASUREMENTS.map(({ key }) => [key, '']))

function getInputValue(record, key) {
  const value = record[key]
  return value === null ? '' : String(key === 'sleepMinutes' ? value / 60 : value)
}

function displaySleep(minutes) {
  return `${(minutes / 60).toLocaleString(undefined, { maximumFractionDigits: 2 })} hr`
}

function MetricCard({ label, value, unit, icon: Icon }) {
  return (
    <article className="fitness-metric-card">
      <span className="fitness-metric-icon"><Icon size={17} /></span>
      <span className="fitness-metric-label">{label}</span>
      <strong>{value} <small>{unit}</small></strong>
    </article>
  )
}

function HistoryChart({ history }) {
  const chartData = history.filter((day) => day.stepsReadings > 0).slice(-7).map((day) => ({
    ...day,
    label: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(`${day.date}T00:00:00`)),
  }))

  return (
    <section className="panel fitness-chart-panel" aria-labelledby="fitness-chart-title">
      <div className="fitness-panel-heading"><div><h2 id="fitness-chart-title">Recent steps</h2><p>Saved daily totals · last 7 recorded dates</p></div><span className="fitness-panel-icon"><Footprints size={17} /></span></div>
      {chartData.length ? (
        <div className="fitness-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 4" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 9 }} />
              <Tooltip contentStyle={{ border: '1px solid var(--line)', borderRadius: 9, background: 'var(--surface)', color: 'var(--ink)', fontSize: 11 }} labelFormatter={(_, payload) => payload[0] ? formatDateKey(payload[0].payload.date) : ''} formatter={(value) => [`${value.toLocaleString()} steps`, 'Steps']} />
              <Bar dataKey="steps" fill="#43865d" radius={[5, 5, 0, 0]} maxBarSize={34} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : <p className="fitness-empty">Your saved step totals will appear here.</p>}
    </section>
  )
}

export function RecordForm({ records, selectedDate, onSave, onDelete, saveError }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [date, setDate] = useState(selectedDate)
  const [editingId, setEditingId] = useState('')
  const [message, setMessage] = useState('')

  const beginEdit = (record) => {
    setEditingId(record.id)
    setDate(record.date)
    setForm(Object.fromEntries(FITNESS_MEASUREMENTS.map(({ key }) => [key, getInputValue(record, key)])))
    setMessage('')
  }

  const reset = () => {
    setEditingId('')
    setForm(EMPTY_FORM)
    setDate(selectedDate)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (FITNESS_MEASUREMENTS.every(({ key }) => form[key] === '')) {
      setMessage('Enter at least one measurement.')
      return
    }
    const record = createFitnessTrackerRecord({
      id: editingId || globalThis.crypto.randomUUID(),
      date,
      ...form,
      sleepMinutes: form.sleepMinutes === '' ? null : Number(form.sleepMinutes) * 60,
    })
    if (!isFitnessTrackerRecord(record)) {
      setMessage('Check the values and enter valid measurements.')
      return
    }
    if (!onSave(record)) {
      setMessage('Unable to save this record. Check browser storage and try again.')
      return
    }
    reset()
    setMessage(editingId ? 'Record updated.' : 'Record saved.')
  }

  const latestRecords = [...records].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <section className="panel fitness-entry-panel" aria-labelledby="fitness-entry-title">
      <div className="fitness-panel-heading"><div><h2 id="fitness-entry-title">{editingId ? 'Edit measurement' : 'Add measurements'}</h2><p>Enter information manually; nothing is read from your device.</p></div><span className="fitness-panel-icon"><Plus size={17} /></span></div>
      <form className="fitness-entry-form" onSubmit={handleSubmit}>
        <label className="fitness-date-field">Record date
          <input type="date" required max={getTodayKey()} value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        {FITNESS_MEASUREMENTS.map(({ key, label, unit, min, max, step }) => (
          <label key={key}>{label}
            <span className="fitness-input-unit">
              <input aria-label={`${label} (${unit})`} type="number" inputMode="decimal" min={min} max={key === 'sleepMinutes' ? 24 : max} step={step} value={form[key]} onChange={(event) => updateForm(key, event.target.value)} placeholder="Optional" />
              <span>{unit}</span>
            </span>
          </label>
        ))}
        {(message || saveError) && <p className="fitness-form-message" role={saveError ? 'alert' : 'status'}>{saveError ? 'Unable to save fitness tracker data. Check browser storage availability.' : message}</p>}
        <div className="fitness-form-actions">
          {editingId && <button className="fitness-secondary-button" type="button" onClick={() => { reset(); setMessage('') }}><X size={14} /> Cancel edit</button>}
          <button className="fitness-primary-button" type="submit"><Plus size={15} /> {editingId ? 'Save changes' : 'Save record'}</button>
        </div>
      </form>

      <div className="fitness-record-list" aria-labelledby="fitness-records-title">
        <h3 id="fitness-records-title">Saved manual entries</h3>
        {latestRecords.length ? latestRecords.map((record) => (
          <article className="fitness-record-row" key={record.id}>
            <div className="fitness-record-main">
              <strong>{formatDateKey(record.date)}</strong>
              <p>{[
                record.steps !== null && `${record.steps.toLocaleString()} steps`,
                record.heartRateBpm !== null && `${record.heartRateBpm} bpm`,
                record.activeMinutes !== null && `${record.activeMinutes} active min`,
                record.sleepMinutes !== null && `${displaySleep(record.sleepMinutes)} sleep`,
                record.workoutMinutes !== null && `${record.workoutMinutes} workout min`,
                record.caloriesKcal !== null && `${record.caloriesKcal.toLocaleString()} kcal`,
              ].filter(Boolean).join(' · ')}</p>
            </div>
            <button type="button" className="fitness-row-button" aria-label={`Edit record from ${formatDateKey(record.date)}`} onClick={() => beginEdit(record)}><Pencil size={14} /></button>
            <button type="button" className="fitness-row-button delete" aria-label={`Delete record from ${formatDateKey(record.date)}`} onClick={() => {
              if (!onDelete(record.id)) setMessage('Unable to delete this record. Check browser storage and try again.')
              else if (editingId === record.id) reset()
            }}><Trash2 size={14} /></button>
          </article>
        )) : <p className="fitness-empty">No measurements saved yet.</p>}
      </div>
    </section>
  )
}

function RunningMetric({ label, value, unit, icon: Icon }) {
  return <article className="running-metric"><span className="running-metric-icon"><Icon size={16} /></span><span>{label}</span><strong>{value} <small>{unit}</small></strong></article>
}

function getElapsedSeconds(session, timestamp = Date.now()) {
  if (!session) return 0
  const end = session.pausedAt ?? timestamp
  return Math.max(0, Math.round((end - session.startedAt - session.pausedDurationMs) / 1000))
}

function RunningTracker({ profile }) {
  const [sessions, setSessions] = useState(() => normalizeRunningSessions(readLocalJson(RUNNING_SESSIONS_STORAGE_KEY, [])))
  const [session, setSession] = useState(null)
  const [now, setNow] = useState(0)
  const [gpsStatus, setGpsStatus] = useState('idle')
  const [gpsMessage, setGpsMessage] = useState('GPS starts only after you choose Start GPS run.')
  const [finishPending, setFinishPending] = useState(false)
  const [summary, setSummary] = useState(null)
  const [manualForm, setManualForm] = useState({ distanceKm: '', minutes: '', seconds: '' })
  const [manualMessage, setManualMessage] = useState('')
  const watchRef = useRef(null)
  const weightKg = getProfileCalorieWeight(profile)
  const sessionStatus = session?.status

  const stopGpsWatch = () => {
    if (watchRef.current !== null && globalThis.navigator?.geolocation) globalThis.navigator.geolocation.clearWatch(watchRef.current)
    watchRef.current = null
  }

  const onPosition = (position) => {
    if (!position?.coords) return
    const { latitude, longitude, accuracy } = position.coords
    if (![latitude, longitude, accuracy].every(Number.isFinite) || accuracy > 100) {
      setGpsStatus('inaccurate')
      setGpsMessage('GPS signal is too inaccurate right now. Keep the app in the foreground and move to a clearer area.')
      return
    }
    setSession((current) => {
      if (!current || current.status !== 'running' || current.trackingMethod !== 'gps') return current
      const point = { latitude, longitude, timestamp: position.timestamp || Date.now() }
      const segment = current.lastPoint ? haversineDistanceKm(current.lastPoint, point) : 0
      if (current.lastPoint && (!Number.isFinite(segment) || segment < 0.003 || segment > 1)) return current
      setGpsStatus('active')
      setGpsMessage(`GPS active · accuracy ±${Math.round(accuracy)} m`)
      return {
        ...current,
        distanceKm: current.distanceKm + (segment || 0),
        lastPoint: point,
        acceptedPoints: current.acceptedPoints + 1,
      }
    })
  }

  const onPositionError = (error) => {
    if (error?.code === 1) {
      setGpsStatus('denied')
      setGpsMessage('Location permission was denied. You can finish with the GPS distance collected so far or use manual tracking below.')
    } else {
      setGpsStatus('signal-lost')
      setGpsMessage('GPS signal is temporarily unavailable. The timer can continue, but distance will update only when valid points return.')
    }
  }

  const startGpsWatch = () => {
    if (!globalThis.navigator?.geolocation) {
      setGpsStatus('unavailable')
      setGpsMessage('This browser does not provide Geolocation. Use manual tracking below.')
      return false
    }
    stopGpsWatch()
    watchRef.current = globalThis.navigator.geolocation.watchPosition(onPosition, onPositionError, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 })
    return true
  }

  useEffect(() => {
    if (sessionStatus !== 'running') return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(timer)
  }, [sessionStatus])

  useEffect(() => () => {
    if (watchRef.current !== null && globalThis.navigator?.geolocation) globalThis.navigator.geolocation.clearWatch(watchRef.current)
    watchRef.current = null
  }, [])

  const appendSession = (nextSession) => {
    const next = normalizeRunningSessions([...sessions, nextSession])
    if (next.length !== sessions.length + 1 || !writeLocalJson(RUNNING_SESSIONS_STORAGE_KEY, next)) return false
    setSessions(next)
    return true
  }

  const startGpsSession = () => {
    if (session) return
    const startedAt = Date.now()
    setSession({ id: `run:${globalThis.crypto.randomUUID()}`, startedAt, status: 'running', trackingMethod: 'gps', pausedAt: null, pausedDurationMs: 0, distanceKm: 0, acceptedPoints: 0, lastPoint: null })
    setSummary(null)
    setGpsStatus('requesting')
    setGpsMessage('Requesting location permission. FitLife uses location only during this active run.')
    startGpsWatch()
  }

  const pauseSession = () => {
    if (!session || session.status !== 'running') return
    stopGpsWatch()
    setSession((current) => current ? { ...current, status: 'paused', pausedAt: Date.now() } : current)
    setGpsStatus('paused')
    setGpsMessage('Run paused. GPS collection is stopped until you resume.')
  }

  const resumeSession = () => {
    if (!session || session.status !== 'paused') return
    const resumedAt = Date.now()
    setSession((current) => current ? { ...current, status: 'running', pausedAt: null, pausedDurationMs: current.pausedDurationMs + (resumedAt - current.pausedAt) } : current)
    setGpsStatus('requesting')
    setGpsMessage('GPS is active again while the run is in the foreground.')
    startGpsWatch()
  }

  const finishSession = () => {
    if (!session) return
    stopGpsWatch()
    const finishedAt = Date.now()
    const durationSeconds = getElapsedSeconds(session, finishedAt)
    const caloriesKcal = estimateRunningCalories(durationSeconds, weightKg)
    setSummary({
      id: session.id,
      startedAt: new Date(session.startedAt).toISOString(),
      finishedAt: new Date(finishedAt).toISOString(),
      distanceKm: Number(session.distanceKm.toFixed(3)),
      durationSeconds,
      caloriesKcal,
      trackingMethod: session.trackingMethod,
      acceptedPoints: session.acceptedPoints,
    })
    setSession(null)
    setFinishPending(false)
    setGpsStatus('idle')
    setGpsMessage('GPS stopped. No location is collected outside an active run.')
  }

  const saveSummary = () => {
    if (!summary) return
    if (!appendSession(summary)) {
      setManualMessage('Unable to save this run. Check browser storage and try again.')
      return
    }
    setSummary(null)
    setManualMessage('Run saved to your account history.')
  }

  const saveManualRun = (event) => {
    event.preventDefault()
    const distanceKm = Number(manualForm.distanceKm)
    const durationSeconds = Number(manualForm.minutes || 0) * 60 + Number(manualForm.seconds || 0)
    if (!Number.isFinite(distanceKm) || distanceKm <= 0 || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      setManualMessage('Enter a distance and a duration greater than zero.')
      return
    }
    const finishedAt = new Date()
    const startedAt = new Date(finishedAt.getTime() - durationSeconds * 1000)
    const manualSession = {
      id: `run:${globalThis.crypto.randomUUID()}`,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      distanceKm: Number(distanceKm.toFixed(3)),
      durationSeconds,
      caloriesKcal: estimateRunningCalories(durationSeconds, weightKg),
      trackingMethod: 'manual',
      acceptedPoints: null,
    }
    if (!appendSession(manualSession)) {
      setManualMessage('Unable to save this run. Check browser storage and try again.')
      return
    }
    setManualForm({ distanceKm: '', minutes: '', seconds: '' })
    setManualMessage('Manual run saved. It is clearly marked separately from GPS sessions.')
  }

  const elapsedSeconds = getElapsedSeconds(session, now)
  const totals = sessions.reduce((total, item) => ({
    distanceKm: total.distanceKm + item.distanceKm,
    durationSeconds: total.durationSeconds + item.durationSeconds,
    caloriesKcal: total.caloriesKcal + (item.caloriesKcal ?? 0),
  }), { distanceKm: 0, durationSeconds: 0, caloriesKcal: 0 })
  const metrics = calculateRunningMetrics(totals.distanceKm, totals.durationSeconds)
  const liveMetrics = calculateRunningMetrics(session?.distanceKm ?? 0, elapsedSeconds)

  return (
    <section className="running-tracker" aria-labelledby="running-tracker-title">
      <div className="running-heading"><div><p className="eyebrow">New · foreground tracking</p><h2 id="running-tracker-title">Running tracker</h2><p>Track a run with browser GPS or record it manually when location is unavailable.</p></div><span className={`running-status ${gpsStatus}`}><LocateFixed size={14} /> {gpsStatus === 'active' ? 'GPS active' : gpsStatus === 'paused' ? 'Paused' : gpsStatus === 'denied' ? 'GPS denied' : gpsStatus === 'unavailable' ? 'GPS unavailable' : 'Ready'}</span></div>
      <div className="running-overview-grid" aria-label="Running totals">
        <RunningMetric label="Distance" value={totals.distanceKm.toFixed(2)} unit="km" icon={Footprints} />
        <RunningMetric label="Duration" value={formatRunningDuration(totals.durationSeconds)} unit="total" icon={Clock3} />
        <RunningMetric label="Average pace" value={formatRunningPace(metrics.paceSecondsPerKm).replace(' / km', '')} unit="/ km" icon={Activity} />
        <RunningMetric label="Average speed" value={metrics.averageSpeedKmh ? metrics.averageSpeedKmh.toFixed(1) : '—'} unit="km/h" icon={Activity} />
        <RunningMetric label="Estimated calories" value={totals.caloriesKcal ? totals.caloriesKcal.toLocaleString() : '—'} unit="kcal" icon={Flame} />
      </div>
      <div className="running-session-panel">
        <div className="running-live-card">
          <div className="running-live-label"><span>Current session</span><strong>{session ? (session.status === 'paused' ? 'Paused' : 'In progress') : summary ? 'Ready to save' : 'Not started'}</strong></div>
          <div className="running-live-time">{formatRunningDuration(session ? elapsedSeconds : summary?.durationSeconds ?? 0)}</div>
          <div className="running-live-stats"><span>{(session?.distanceKm ?? summary?.distanceKm ?? 0).toFixed(2)} km</span><span>{formatRunningPace(session ? liveMetrics.paceSecondsPerKm : summary ? calculateRunningMetrics(summary.distanceKm, summary.durationSeconds).paceSecondsPerKm : null)}</span></div>
          {!session && !summary && <div className="running-start-actions"><button className="running-primary-button" type="button" onClick={startGpsSession}><LocateFixed size={16} /> Start GPS run</button></div>}
          {session && <div className="running-control-row">{session.status === 'running' ? <button className="running-secondary-button" type="button" onClick={pauseSession}><Pause size={16} /> Pause</button> : <button className="running-primary-button" type="button" onClick={resumeSession}><Play size={16} /> Resume</button>}<button className="running-finish-button" type="button" onClick={() => setFinishPending(true)}><Square size={15} /> Finish run</button></div>}
          {finishPending && <div className="running-confirm" role="alert"><strong>Finish this run?</strong><span>Your current GPS distance and active duration will be shown for review before saving.</span><div><button className="running-secondary-button" type="button" onClick={() => setFinishPending(false)}>Keep running</button><button className="running-finish-button" type="button" onClick={finishSession}><Check size={15} /> Finish</button></div></div>}
          {summary && <div className="running-summary" role="status"><strong>Session summary</strong><span>{summary.trackingMethod === 'gps' ? 'GPS tracked' : 'Manually recorded'} · {summary.distanceKm.toFixed(2)} km · {formatRunningDuration(summary.durationSeconds)} · {summary.caloriesKcal === null ? 'kcal estimate unavailable' : `~${summary.caloriesKcal} kcal estimate`}</span><div><button className="running-secondary-button" type="button" onClick={() => setSummary(null)}>Discard summary</button><button className="running-primary-button" type="button" onClick={saveSummary}><Save size={15} /> Save run</button></div></div>}
        </div>
        <div className="running-gps-note"><div className="running-note-heading"><LocateFixed size={15} /><strong>GPS status</strong></div><p>{gpsMessage}</p><p className="running-limitations">Browser GPS generally requires HTTPS or localhost. Tracking may pause or become unreliable when the browser is backgrounded, the phone is locked, or the operating system suspends the page. FitLife does not provide native background tracking.</p></div>
      </div>
      <form className="running-manual-form" onSubmit={saveManualRun}>
        <div><div className="running-note-heading"><Pencil size={15} /><strong>Manual run</strong></div><p>Use this when GPS is unavailable or denied. The saved record will be labelled manually recorded.</p></div>
        <label>Distance (km)<input type="number" min="0.01" max="500" step="0.01" value={manualForm.distanceKm} onChange={(event) => setManualForm((current) => ({ ...current, distanceKm: event.target.value }))} required /></label>
        <label>Minutes<input type="number" min="0" max="1440" step="1" value={manualForm.minutes} onChange={(event) => setManualForm((current) => ({ ...current, minutes: event.target.value }))} required /></label>
        <label>Seconds<input type="number" min="0" max="59" step="1" value={manualForm.seconds} onChange={(event) => setManualForm((current) => ({ ...current, seconds: event.target.value }))} required /></label>
        <button className="running-secondary-button" type="submit"><Save size={15} /> Save manual run</button>
        {manualMessage && <p className="running-form-message" role="status">{manualMessage}</p>}
      </form>
      <section className="running-history" aria-labelledby="running-history-title"><div className="running-history-heading"><div><h3 id="running-history-title">Running history</h3><p>Completed sessions stay saved to this signed-in account.</p></div><span>{sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}</span></div>{sessions.length ? <div className="running-history-list">{[...sessions].reverse().map((item) => <article className="running-history-row" key={item.id}><div><strong>{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.finishedAt))}</strong><p>{item.trackingMethod === 'gps' ? 'GPS tracked' : 'Manually recorded'}{item.trackingMethod === 'gps' && item.acceptedPoints !== null ? ` · ${item.acceptedPoints} accepted points` : ''}</p></div><span><b>{item.distanceKm.toFixed(2)} km</b>{formatRunningDuration(item.durationSeconds)} · {formatRunningPace(calculateRunningMetrics(item.distanceKm, item.durationSeconds).paceSecondsPerKm)} · {item.caloriesKcal === null ? 'kcal estimate unavailable' : `~${item.caloriesKcal} kcal estimate`}</span></article>)}</div> : <p className="running-empty">No completed runs yet. Start GPS or save a manual run to build your history.</p>}</section>
      {weightKg === null && <p className="running-calorie-note"><CircleAlert size={14} /> Calorie values are shown only when a confirmed profile weight is available; otherwise the session remains valid and the estimate is unavailable.</p>}
    </section>
  )
}

export default function FitnessTrackerPage() {
  const { profile, fitnessTrackerRecords } = useAppData()
  const [selectedDate, setSelectedDate] = useState(getTodayKey)
  const summary = getFitnessTrackerDailySummary(fitnessTrackerRecords, selectedDate)
  const history = getFitnessTrackerHistory(fitnessTrackerRecords)

  return (
    <div className="page-content fitness-page">
      <header className="fitness-page-heading">
        <div><p className="eyebrow">{formatDateKey(selectedDate, { year: 'numeric' })}</p><h1>Fitness tracker</h1><p className="workout-page-subtitle">A manual log of your activity and recovery measurements.</p></div>
        <span className="date-pill"><Watch size={14} /> {profile.smartwatchAvailability || 'Device not selected'}</span>
      </header>
      <p className="fitness-manual-note">Manual entries only. FitLife does not connect to or automatically sync with Apple Watch, Fitbit, Garmin, Wear OS, or other devices. <Link to="/calories">Calories are also included in your calorie history.</Link></p>

      <RunningTracker profile={profile} />

      <section className="panel fitness-date-panel" aria-label="View a date">
        <label><CalendarDays size={15} /> View date <input type="date" max={getTodayKey()} value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label>
        <span>{summary.recordCount} saved entr{summary.recordCount === 1 ? 'y' : 'ies'} for this date</span>
      </section>

      <section className="fitness-metric-grid" aria-label={`Fitness measurements for ${formatDateKey(selectedDate)}`}>
        <MetricCard label="Daily steps" value={summary.stepsReadings ? summary.steps.toLocaleString() : '—'} unit={summary.stepsReadings ? 'steps' : 'no entry'} icon={Footprints} />
        <MetricCard label="Average heart rate" value={summary.averageHeartRateBpm ?? '—'} unit={summary.averageHeartRateBpm === null ? 'no readings' : 'bpm'} icon={HeartPulse} />
        <MetricCard label="Active minutes" value={summary.activeMinutesReadings ? summary.activeMinutes.toLocaleString() : '—'} unit={summary.activeMinutesReadings ? 'min' : 'no entry'} icon={Activity} />
        <MetricCard label="Sleep duration" value={summary.sleepReadings ? displaySleep(summary.sleepMinutes) : '—'} unit={summary.sleepReadings ? '' : 'no entry'} icon={Moon} />
        <MetricCard label="Workout duration" value={summary.workoutMinutesReadings ? summary.workoutMinutes.toLocaleString() : '—'} unit={summary.workoutMinutesReadings ? 'min' : 'no entry'} icon={Activity} />
        <MetricCard label="Calories burned" value={summary.caloriesReadings ? summary.caloriesKcal.toLocaleString() : '—'} unit={summary.caloriesReadings ? 'kcal' : 'no entry'} icon={Activity} />
      </section>

      <div className="fitness-content-grid">
        <HistoryChart history={history} />
      </div>
    </div>
  )
}
