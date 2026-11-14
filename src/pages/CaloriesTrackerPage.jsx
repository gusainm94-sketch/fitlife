import { useState } from 'react'
import { Activity, Flame, Pencil, Plus, Scale, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData.js'
import {
  ACTIVITY_METS,
  CALORIE_ACTIVITIES,
  createCalorieActivity,
  estimateCaloriesBurned,
  EXERCISE_INTENSITIES,
  getCaloriePeriodTotals,
  getProfileCalorieWeight,
  getRecentDailyCalorieTotals,
} from '../data/calories.js'
import { formatDateKey, getTodayKey } from '../utils/date.js'
import { FOOD_INTAKE_STORAGE_KEY, getFoodIntakeCaloriesForDate, normalizeFoodIntake } from '../data/foodIntake.js'
import { readLocalJson } from '../utils/localStorage.js'
import './CaloriesTracker.css'

function createActivityId() {
  return `manual:${globalThis.crypto.randomUUID()}`
}

function SummaryCard({ label, value, detail, icon: Icon }) {
  return (
    <article className="calorie-summary-card">
      <span className="calorie-summary-icon"><Icon size={17} /></span>
      <span className="calorie-summary-label">{label}</span>
      <strong>{value.toLocaleString()} <small>kcal</small></strong>
      <span className="calorie-summary-detail">{detail}</span>
    </article>
  )
}

function ActivityForm({ profile, onAdd, saveError }) {
  const [activity, setActivity] = useState(CALORIE_ACTIVITIES[0])
  const [duration, setDuration] = useState('')
  const [intensity, setIntensity] = useState('Moderate')
  const [date, setDate] = useState(getTodayKey)
  const [message, setMessage] = useState('')
  const weightKg = getProfileCalorieWeight(profile)
  const durationMinutes = Number(duration)
  const estimate = weightKg === null
    ? null
    : estimateCaloriesBurned({ activity, durationMinutes, intensity, weightKg })

  const handleSubmit = (event) => {
    event.preventDefault()
    const record = createCalorieActivity({
      id: createActivityId(),
      activity,
      durationMinutes,
      intensity,
      date,
      weightKg,
    })
    if (!onAdd(record)) {
      setMessage('Unable to save this activity. Check browser storage and try again.')
      return
    }
    setDuration('')
    setMessage('Activity saved.')
  }

  return (
    <section className="panel calorie-form-panel" aria-labelledby="calorie-form-title">
      <div className="calorie-panel-heading"><div><h2 id="calorie-form-title">Log an activity</h2><p>Choose an activity and record how long you did it.</p></div><span className="calorie-panel-icon"><Plus size={17} /></span></div>
      <form className="calorie-form" onSubmit={handleSubmit}>
        <label>Exercise type
          <select value={activity} onChange={(event) => setActivity(event.target.value)}>
            {CALORIE_ACTIVITIES.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>Duration
          <span className="calorie-input-unit"><input type="number" min="1" max="1440" step="1" required value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="30" /><span>minutes</span></span>
        </label>
        <label>Intensity
          <select value={intensity} onChange={(event) => setIntensity(event.target.value)}>
            {EXERCISE_INTENSITIES.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>Date
          <input type="date" value={date} max={getTodayKey()} required onChange={(event) => setDate(event.target.value)} />
        </label>
        <div className="calorie-estimate-preview" aria-live="polite">
          <Flame size={16} />
          {estimate === null
            ? <span>{weightKg === null ? <>Confirm a valid weight in your <Link to="/bmi-profile">profile</Link> to estimate calories.</> : 'Enter a duration to preview the estimate.'}</span>
            : <span>Estimated burn: <strong>about {estimate.toLocaleString()} kcal</strong></span>}
        </div>
        {(message || saveError) && <p className="calorie-form-message" role={saveError ? 'alert' : 'status'}>{saveError ? 'Unable to save calorie activity history. Check browser storage availability.' : message}</p>}
        <button className="calorie-primary-button" type="submit"><Plus size={15} /> Save activity</button>
      </form>
      <p className="calorie-method-note">Estimates use MET values, your profile weight, duration, and selected intensity. They are not measurements.</p>
      <details className="calorie-met-details">
        <summary>Calculation method and MET estimates</summary>
        <p>Estimated kcal = MET × 3.5 × weight (kg) ÷ 200 × duration (minutes). Values below are approximate activity METs by intensity.</p>
        <div className="calorie-met-table-wrap">
          <table className="calorie-met-table">
            <thead><tr><th scope="col">Activity</th>{EXERCISE_INTENSITIES.map((level) => <th scope="col" key={level}>{level}</th>)}</tr></thead>
            <tbody>{Object.entries(ACTIVITY_METS).map(([name, values]) => (
              <tr key={name}><th scope="row">{name}</th>{EXERCISE_INTENSITIES.map((level) => <td key={level}>{values[level]} MET</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      </details>
    </section>
  )
}

function WeeklySummary({ records, today }) {
  const days = getRecentDailyCalorieTotals(records, today)
  const maxCalories = Math.max(1, ...days.map(({ calories }) => calories))
  return (
    <section className="panel calorie-week-panel" aria-labelledby="calorie-week-title">
      <div className="calorie-panel-heading"><div><h2 id="calorie-week-title">Recent activity</h2><p>Recorded calories by day · last 7 days</p></div><span className="calorie-panel-icon"><Activity size={17} /></span></div>
      <div className="calorie-week-chart" role="img" aria-label="Recorded calories burned for each of the last seven days">
        {days.map(({ date, calories }) => (
          <div className="calorie-week-day" key={date} aria-label={`${formatDateKey(date)}: ${calories} estimated kcal`}>
            <strong>{calories || ''}</strong>
            <div className="calorie-week-track"><span style={{ height: `${calories ? Math.max(5, (calories / maxCalories) * 100) : 0}%` }} /></div>
            <span>{new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(`${date}T00:00:00`))}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function ActivityHistory({ activities, onUpdateDuration }) {
  const [editingId, setEditingId] = useState('')
  const [editDuration, setEditDuration] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const sortedActivities = [...activities].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))

  const saveDuration = (event, id) => {
    event.preventDefault()
    if (!onUpdateDuration(id, Number(editDuration))) {
      setSaveMessage('Unable to update duration. Check browser storage and try again.')
      return
    }
    setEditingId('')
    setSaveMessage('')
  }

  return (
    <section className="panel calorie-history-panel" aria-labelledby="calorie-history-title">
      <div className="calorie-panel-heading"><div><h2 id="calorie-history-title">Activity history</h2><p>Saved activity estimates, newest first.</p></div><span className="calorie-panel-icon"><Scale size={17} /></span></div>
      {saveMessage && <p className="calorie-form-message" role="alert">{saveMessage}</p>}
      {sortedActivities.length ? (
        <div className="calorie-history-list">
          {sortedActivities.map((record) => (
            <article className="calorie-history-row" key={record.id}>
              <span className="calorie-history-icon"><Activity size={16} /></span>
              <div className="calorie-history-main">
                <div className="calorie-history-title"><strong>{record.activityName || record.activity}</strong><span className={`calorie-source-badge ${record.source}`}>{record.source === 'workout' ? 'Workout' : record.source === 'smartwatch' ? 'Manual tracker' : 'Manual'}</span></div>
                <p>{record.source === 'smartwatch' ? `Fitness tracker entry · ${formatDateKey(record.date)}` : `${record.activityName ? `${record.activity} · ` : ''}${formatDateKey(record.date)} · ${record.intensity} intensity`}</p>
                {editingId === record.id ? (
                  <form className="calorie-duration-edit" onSubmit={(event) => saveDuration(event, record.id)}>
                    <label>Duration in minutes<input aria-label={`Duration for ${record.activityName || record.activity}`} type="number" min="1" max="1440" step="1" required value={editDuration} onChange={(event) => setEditDuration(event.target.value)} /></label>
                    <button className="calorie-small-button" type="submit">Save</button>
                    <button className="calorie-small-button secondary" type="button" onClick={() => setEditingId('')}>Cancel</button>
                  </form>
                ) : record.durationMinutes !== null && <span className="calorie-history-duration">{record.durationMinutes} min</span>}
              </div>
              <div className="calorie-history-result">
                <strong>{record.caloriesKcal === null ? '—' : `${record.source === 'smartwatch' ? '' : '~'}${record.caloriesKcal.toLocaleString()}`}</strong>
                <span>{record.caloriesKcal === null ? 'Weight needed' : record.source === 'smartwatch' ? 'manual kcal' : 'estimated kcal'}</span>
              </div>
              {editingId !== record.id && record.source !== 'smartwatch' && <button className="calorie-edit-button" type="button" aria-label={`Edit duration for ${record.activityName || record.activity}`} onClick={() => { setEditDuration(String(record.durationMinutes)); setEditingId(record.id) }}><Pencil size={14} /></button>}
            </article>
          ))}
        </div>
      ) : <p className="calorie-history-empty">No activities yet. Log one above, or complete a timed workout activity.</p>}
      <p className="calorie-method-note">Workout-generated entries use Moderate intensity because workout plans do not store intensity. They are created only for explicitly timed activities and do not estimate untimed workout segments.</p>
    </section>
  )
}

function FoodIntakeSummary({ today }) {
  const entries = normalizeFoodIntake(readLocalJson(FOOD_INTAKE_STORAGE_KEY, []))
    .filter((record) => record.date === today)
    .sort((a, b) => a.id.localeCompare(b.id))
  const totalCalories = getFoodIntakeCaloriesForDate(entries, today)

  return (
    <section className="panel calorie-intake-panel" aria-labelledby="food-intake-title">
      <div className="calorie-panel-heading">
        <div><h2 id="food-intake-title">Logged food intake</h2><p>Recipe estimates recorded only after you explicitly log a meal.</p></div>
        <span className="calorie-panel-icon"><Utensils size={17} /></span>
      </div>
      <div className="calorie-intake-total"><strong>{totalCalories.toLocaleString()} <small>estimated kcal</small></strong><span>Today · {entries.length} logged meal{entries.length === 1 ? '' : 's'}</span></div>
      {entries.length ? (
        <div className="calorie-history-list">
          {entries.map((record) => (
            <article className="calorie-history-row" key={record.id}>
              <span className="calorie-history-icon"><Utensils size={16} /></span>
              <div className="calorie-history-main"><strong>{record.recipeName}</strong><p>{record.category} · explicitly logged as eaten</p></div>
              <div className="calorie-history-result"><strong>{record.caloriesKcal === null ? '—' : `~${record.caloriesKcal.toLocaleString()}`}</strong><span>{record.caloriesKcal === null ? 'Estimate unavailable' : 'estimated kcal'}</span></div>
            </article>
          ))}
        </div>
      ) : <p className="calorie-history-empty">No recipes logged today. Planned meals and calculator totals are not counted as eaten.</p>}
      <Link className="text-action" to="/nutrition">Open Diet Planner</Link>
    </section>
  )
}

export default function CaloriesTrackerPage() {
  const { profile, calorieActivities, addCalorieActivity, updateCalorieActivityDuration, calorieStorageError } = useAppData()
  const today = getTodayKey()
  const totals = getCaloriePeriodTotals(calorieActivities, today)

  return (
    <div className="page-content calorie-page">
      <header className="calorie-page-heading">
        <div><p className="eyebrow">{formatDateKey(today, { year: 'numeric' })}</p><h1>Calories burned</h1><p className="workout-page-subtitle">Track activity and view MET-based calorie estimates.</p></div>
        <span className="date-pill"><Flame size={14} /> Estimates + manual entries</span>
      </header>

      <section className="calorie-summary-grid" aria-label="Estimated calories burned">
        <SummaryCard label="Today" value={totals.today} detail="Recorded today" icon={Flame} />
        <SummaryCard label="This week" value={totals.week} detail="Monday to today" icon={Activity} />
        <SummaryCard label="This month" value={totals.month} detail="Month to date" icon={Scale} />
      </section>

      <div className="calorie-content-grid">
        <ActivityForm profile={profile} onAdd={addCalorieActivity} saveError={calorieStorageError} />
        <WeeklySummary records={calorieActivities} today={today} />
      </div>
      <ActivityHistory activities={calorieActivities} onUpdateDuration={updateCalorieActivityDuration} />
      <FoodIntakeSummary today={today} />
    </div>
  )
}
