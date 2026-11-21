import { useState } from 'react'
import { Activity, Flame, Pencil, Plus, Scale, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData.js'
import { CALORIE_ACTIVITIES, createCalorieActivity, estimateCaloriesBurned, EXERCISE_INTENSITIES, getCaloriePeriodTotals, getProfileCalorieWeight, getRecentDailyCalorieTotals } from '../data/calories.js'
import { formatDateKey, getTodayKey } from '../utils/date.js'
import { FOOD_INTAKE_STORAGE_KEY, getFoodIntakeCaloriesForDate, normalizeFoodIntake } from '../data/foodIntake.js'
import { readLocalJson, writeLocalJson } from '../utils/localStorage.js'
import './CaloriesTracker.css'

function SummaryCard({ label, value, detail, icon: Icon }) {
  return <article className="calorie-summary-card"><span className="calorie-summary-icon"><Icon size={17} /></span><span className="calorie-summary-label">{label}</span><strong>{value.toLocaleString()} <small>kcal</small></strong><span className="calorie-summary-detail">{detail}</span></article>
}

function ActivityForm({ profile, onAdd, saveError }) {
  const [activity, setActivity] = useState(CALORIE_ACTIVITIES[0])
  const [duration, setDuration] = useState('')
  const [intensity, setIntensity] = useState('Moderate')
  const [date, setDate] = useState(getTodayKey)
  const [message, setMessage] = useState('')
  const weightKg = getProfileCalorieWeight(profile)
  const estimate = weightKg === null ? null : estimateCaloriesBurned({ activity, durationMinutes: Number(duration), intensity, weightKg })
  const submit = (event) => {
    event.preventDefault()
    const record = createCalorieActivity({ id: `manual:${globalThis.crypto.randomUUID()}`, activity, durationMinutes: Number(duration), intensity, date, weightKg })
    if (!onAdd(record)) { setMessage('Unable to save this activity. Check browser storage and try again.'); return }
    setDuration(''); setMessage('Activity saved.')
  }
  return <section className="panel calorie-form-panel" aria-labelledby="calorie-form-title">
    <div className="calorie-panel-heading"><div><h2 id="calorie-form-title">Log an activity</h2><p>Calories are estimated from type, duration, intensity, and your current profile weight.</p></div><span className="calorie-panel-icon"><Plus size={17} /></span></div>
    <form className="calorie-form" onSubmit={submit}>
      <label>Activity<select value={activity} onChange={(event) => setActivity(event.target.value)}>{CALORIE_ACTIVITIES.map((option) => <option key={option}>{option}</option>)}</select></label>
      <label>Duration<span className="calorie-input-unit"><input type="number" min="1" max="1440" required value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="30" /><span>minutes</span></span></label>
      <label>Intensity<select value={intensity} onChange={(event) => setIntensity(event.target.value)}>{EXERCISE_INTENSITIES.map((option) => <option key={option}>{option}</option>)}</select></label>
      <label>Date<input type="date" value={date} max={getTodayKey()} required onChange={(event) => setDate(event.target.value)} /></label>
      <div className="calorie-estimate-preview" aria-live="polite"><Flame size={16} />{estimate === null ? <span>{weightKg === null ? <>Add a confirmed weight in your <Link to="/bmi-profile">profile</Link> first.</> : 'Enter a duration to preview the estimate.'}</span> : <span>Estimated calories burned: <strong>≈ {estimate} kcal</strong></span>}</div>
      {(message || saveError) && <p className="calorie-form-message" role="alert">{saveError ? 'Unable to save calorie activity history.' : message}</p>}
      <button className="calorie-primary-button" type="submit"><Plus size={15} /> Save activity</button>
    </form>
    <p className="calorie-method-note">MET-based values are estimates, not exact measurements.</p>
  </section>
}

function WeeklySummary({ records, today }) {
  const days = getRecentDailyCalorieTotals(records, today)
  const maxCalories = Math.max(1, ...days.map(({ calories }) => calories))
  return <section className="panel calorie-week-panel" aria-labelledby="calorie-week-title"><div className="calorie-panel-heading"><div><h2 id="calorie-week-title">Calories by day</h2><p>Estimated calories burned · last 7 days</p></div><span className="calorie-panel-icon"><Activity size={17} /></span></div><div className="calorie-week-chart" role="img" aria-label="Estimated calories burned for the last seven days">{days.map(({ date, calories }) => <div className="calorie-week-day" key={date} aria-label={`${formatDateKey(date)}: ${calories} estimated kcal`}><strong>{calories || ''}</strong><div className="calorie-week-track"><span style={{ height: `${calories ? Math.max(5, calories / maxCalories * 100) : 0}%` }} /></div><span>{new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(`${date}T00:00:00`))}</span></div>)}</div></section>
}

function ActivityHistory({ activities, onUpdateDuration }) {
  const [editingId, setEditingId] = useState('')
  const [duration, setDuration] = useState('')
  const sorted = [...activities].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
  return <section className="panel calorie-history-panel" aria-labelledby="calorie-history-title"><div className="calorie-panel-heading"><div><h2 id="calorie-history-title">Burned calorie history</h2><p>Workout completions and manually logged activities.</p></div><span className="calorie-panel-icon"><Scale size={17} /></span></div>{sorted.length ? <div className="calorie-history-list">{sorted.map((record) => <article className="calorie-history-row" key={record.id}><span className="calorie-history-icon"><Activity size={16} /></span><div className="calorie-history-main"><div className="calorie-history-title"><strong>{record.activityName || record.activity}</strong><span className={`calorie-source-badge ${record.source}`}>{record.source === 'workout' ? 'Workout' : 'Manual'}</span></div><p>{formatDateKey(record.date)} · {record.intensity} intensity{record.durationMinutes ? ` · ${record.durationMinutes} min` : ''}</p>{editingId === record.id && <form className="calorie-duration-edit" onSubmit={(event) => { event.preventDefault(); onUpdateDuration(record.id, Number(duration)); setEditingId('') }}><input type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} /><button className="calorie-small-button" type="submit">Save</button></form>}</div><div className="calorie-history-result"><strong>{record.caloriesKcal === null ? '—' : `≈ ${record.caloriesKcal}`}</strong><span>{record.caloriesKcal === null ? 'Weight needed' : 'estimated kcal'}</span></div>{record.source !== 'workout' && <button className="calorie-edit-button" type="button" aria-label={`Edit duration for ${record.activityName || record.activity}`} onClick={() => { setEditingId(record.id); setDuration(String(record.durationMinutes)) }}><Pencil size={14} /></button>}</article>)}</div> : <p className="calorie-history-empty">Complete a workout or log an activity to build your history.</p>}<p className="calorie-method-note">Each workout exercise has one unique completion record, so refreshing or revisiting the page cannot count it twice.</p></section>
}

function FoodIntakeSummary({ today, entries, onAdd }) {
  const [calories, setCalories] = useState('')
  const [label, setLabel] = useState('')
  const todayEntries = entries.filter((record) => record.date === today)
  const totalCalories = getFoodIntakeCaloriesForDate(todayEntries, today)
  const submit = (event) => {
    event.preventDefault()
    const value = Number(calories)
    if (!Number.isFinite(value) || value <= 0) return
    onAdd({ id: `food:manual:${today}:${globalThis.crypto.randomUUID()}`, recipeId: `manual:${today}`, recipeName: label.trim() || 'Logged calories', category: 'Manual calorie entry', date: today, caloriesKcal: Math.round(value), nutrients: { caloriesKcal: Math.round(value), proteinG: null, carbsG: null, fatG: null, fiberG: null } })
    setCalories(''); setLabel('')
  }
  return <section className="panel calorie-intake-panel" aria-labelledby="food-intake-title"><div className="calorie-panel-heading"><div><h2 id="food-intake-title">Calories consumed</h2><p>Only calories you explicitly log are included.</p></div><span className="calorie-panel-icon"><Utensils size={17} /></span></div><div className="calorie-intake-total"><strong>{totalCalories.toLocaleString()} <small>kcal</small></strong><span>Today · {todayEntries.length} entr{todayEntries.length === 1 ? 'y' : 'ies'}</span></div><form className="calorie-consumed-form" onSubmit={submit}><label>Note<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Breakfast, lunch…" /></label><label>Calories<input type="number" min="1" required value={calories} onChange={(event) => setCalories(event.target.value)} placeholder="500" /></label><button className="calorie-small-button" type="submit"><Plus size={13} /> Log</button></form>{todayEntries.length ? <div className="calorie-history-list">{todayEntries.map((record) => <article className="calorie-history-row" key={record.id}><span className="calorie-history-icon"><Utensils size={16} /></span><div className="calorie-history-main"><strong>{record.recipeName}</strong><p>{record.category} · explicitly logged</p></div><div className="calorie-history-result"><strong>{record.caloriesKcal === null ? '—' : `≈ ${record.caloriesKcal}`}</strong><span>estimated kcal</span></div></article>)}</div> : <p className="calorie-history-empty">No consumed calories logged today.</p>}</section>
}

export default function CaloriesTrackerPage() {
  const { profile, calorieActivities, addCalorieActivity, updateCalorieActivityDuration, calorieStorageError } = useAppData()
  const today = getTodayKey()
  const totals = getCaloriePeriodTotals(calorieActivities, today)
  const [foodEntries, setFoodEntries] = useState(() => normalizeFoodIntake(readLocalJson(FOOD_INTAKE_STORAGE_KEY, [])))
  const consumed = getFoodIntakeCaloriesForDate(foodEntries, today)
  const saveFoodEntry = (entry) => { const next = [...foodEntries, entry]; if (writeLocalJson(FOOD_INTAKE_STORAGE_KEY, next)) setFoodEntries(next) }
  return <div className="page-content calorie-page"><header className="calorie-page-heading"><div><p className="eyebrow">{formatDateKey(today, { year: 'numeric' })}</p><h1>Calories</h1><p className="workout-page-subtitle">Track consumed calories separately from estimated burned calories.</p></div><span className="date-pill"><Flame size={14} /> Estimates + logs</span></header><section className="calorie-summary-grid" aria-label="Today's calorie summary"><SummaryCard label="Calories consumed" value={consumed} detail="Explicitly logged today" icon={Utensils} /><SummaryCard label="Calories burned" value={totals.today} detail="Workout + activities" icon={Flame} /><SummaryCard label="Net calories" value={consumed - totals.today} detail="Consumed − burned" icon={Scale} /></section><div className="calorie-content-grid"><ActivityForm profile={profile} onAdd={addCalorieActivity} saveError={calorieStorageError} /><WeeklySummary records={calorieActivities} today={today} /></div><ActivityHistory activities={calorieActivities} onUpdateDuration={updateCalorieActivityDuration} /><FoodIntakeSummary today={today} entries={foodEntries} onAdd={saveFoodEntry} /></div>
}
