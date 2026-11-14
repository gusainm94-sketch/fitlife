import { useState } from 'react'
import { Activity, CalendarDays, Footprints, HeartPulse, Moon, Pencil, Plus, Trash2, Watch, X } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData.js'
import { FITNESS_MEASUREMENTS, createFitnessTrackerRecord, getFitnessTrackerDailySummary, getFitnessTrackerHistory, isFitnessTrackerRecord } from '../data/fitnessTracker.js'
import { formatDateKey, getTodayKey } from '../utils/date.js'
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

function RecordForm({ records, selectedDate, onSave, saveError }) {
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
              if (!onSave(records.filter(({ id }) => id !== record.id))) setMessage('Unable to delete this record. Check browser storage and try again.')
              else if (editingId === record.id) reset()
            }}><Trash2 size={14} /></button>
          </article>
        )) : <p className="fitness-empty">No measurements saved yet.</p>}
      </div>
    </section>
  )
}

export default function FitnessTrackerPage() {
  const { profile, fitnessTrackerRecords, saveFitnessTrackerRecords, fitnessTrackerStorageError } = useAppData()
  const [selectedDate, setSelectedDate] = useState(getTodayKey)
  const summary = getFitnessTrackerDailySummary(fitnessTrackerRecords, selectedDate)
  const history = getFitnessTrackerHistory(fitnessTrackerRecords)
  const saveRecord = (record) => {
    const next = fitnessTrackerRecords.some(({ id }) => id === record.id)
      ? fitnessTrackerRecords.map((item) => item.id === record.id ? record : item)
      : [...fitnessTrackerRecords, record]
    return saveFitnessTrackerRecords(next)
  }

  return (
    <div className="page-content fitness-page">
      <header className="fitness-page-heading">
        <div><p className="eyebrow">{formatDateKey(selectedDate, { year: 'numeric' })}</p><h1>Fitness tracker</h1><p className="workout-page-subtitle">A manual log of your activity and recovery measurements.</p></div>
        <span className="date-pill"><Watch size={14} /> {profile.smartwatchAvailability || 'Device not selected'}</span>
      </header>
      <p className="fitness-manual-note">Manual entries only. FitLife does not connect to or automatically sync with Apple Watch, Fitbit, Garmin, Wear OS, or other devices. <Link to="/calories">Calories are also included in your calorie history.</Link></p>

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
        <RecordForm key={selectedDate} records={fitnessTrackerRecords} selectedDate={selectedDate} onSave={saveRecord} saveError={fitnessTrackerStorageError} />
        <HistoryChart history={history} />
      </div>
    </div>
  )
}
