import { Activity, Check, Droplets, Flame, Scale, Weight } from 'lucide-react'
import { useAppData } from '../hooks/useAppData.js'
import { DEFAULT_PROFILE } from '../data/profile.js'
import { useDailyRecord } from '../hooks/useDailyRecord.js'
import {
  DAILY_HABITS,
  DAILY_WATER_GOAL_ML,
  HABITS_STORAGE_KEY,
  WATER_STORAGE_KEY,
  createHabitCompletions,
  createWaterIntake,
  isHabitCompletions,
  isWaterIntake,
} from '../data/dailyTrackers.js'
import { calculateBMI, getBMICategory } from '../utils/bmi.js'
import { formatDateKey, formatToday, getTodayKey } from '../utils/date.js'
import { readLocalJsonEntries } from '../utils/localStorage.js'
import { buildDailyProgressRecords, getProgressPeriodSummary, getWeekId, getWorkoutProgress } from '../utils/progress.js'

function ProgressBar({ label, value, detail, icon: Icon, tone = '' }) {
  return (
    <article className="progress-metric-card">
      <div className="progress-metric-top"><span className={`progress-metric-icon ${tone}`}><Icon size={17} /></span><span>{label}</span></div>
      <strong className="progress-metric-value">{value}</strong>
      <p>{detail}</p>
    </article>
  )
}

function WeeklyActivityChart({ activityByDay }) {
  return (
    <section className="panel progress-panel" aria-labelledby="activity-chart-title">
      <div className="progress-panel-heading"><div><h2 id="activity-chart-title">Weekly activity</h2><p>Completed workout days this week · saved workout checkmarks</p></div><span className="progress-panel-icon"><Activity size={17} /></span></div>
      <div className="activity-chart" role="img" aria-label={`Weekly workout activity: ${activityByDay.filter(({ completed }) => completed).length} of 7 days completed`}>
        {activityByDay.map(({ id, shortName, completed }) => <div className={`activity-chart-day${completed ? ' completed' : ''}`} key={id}>
          <div className="activity-chart-column"><span className="activity-chart-bar" style={{ height: completed ? '100%' : '12%' }} /></div>
          <span className="activity-chart-label">{shortName}</span>
        </div>)}
      </div>
      <p className="progress-chart-note">Only current-week workout records are shown. Unchecked days are not counted as completed.</p>
    </section>
  )
}

function WeightVisualization({ weight, isSampleProfile }) {
  const hasWeight = Number.isFinite(weight)
  const marker = hasWeight ? Math.max(10, Math.min(90, 50 + (weight - 70) * 3)) : null
  return (
    <section className="panel progress-panel weight-progress-panel" aria-labelledby="weight-progress-title">
      <div className="progress-panel-heading"><div><h2 id="weight-progress-title">Weight snapshot</h2><p>{hasWeight ? isSampleProfile ? 'Sample profile measurement' : 'Current measurement from your saved profile' : 'No weight measurement provided'}</p></div><span className="progress-panel-icon"><Weight size={17} /></span></div>
      <div className="weight-snapshot"><strong>{hasWeight ? weight.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—'}</strong>{hasWeight && <span>kg</span>}</div>
      <div className="weight-scale" role="img" aria-label={hasWeight ? `${isSampleProfile ? 'Sample' : 'Current saved'} weight ${weight} kilograms; no prior weight entries are available` : 'No weight measurement is saved'}>
        {marker !== null && <span className="weight-scale-marker" style={{ left: `${marker}%` }} />}
        <span className="weight-scale-start">Lower</span><span className="weight-scale-end">Higher</span>
      </div>
      <p className="progress-chart-note">{hasWeight ? `A weight history is not available yet. This view uses ${isSampleProfile ? 'the sample profile value only' : 'your current saved profile measurement only'}.` : 'Add a weight in Edit profile or the BMI calculator to see a measurement here.'}</p>
    </section>
  )
}

export default function ProgressPage() {
  const { profile, workoutProgress, calorieActivities } = useAppData()
  const { data: water, history: waterHistory } = useDailyRecord(WATER_STORAGE_KEY, createWaterIntake, isWaterIntake)
  const { data: habits, history: habitHistory } = useDailyRecord(HABITS_STORAGE_KEY, createHabitCompletions, isHabitCompletions)
  const workouts = getWorkoutProgress(workoutProgress)
  const todayKey = getTodayKey()
  const progressRecords = buildDailyProgressRecords({
    waterHistory,
    habitHistory,
    mealHistory: readLocalJsonEntries('fitlife-diet-plan-'),
    workoutProgress,
    calorieHistory: calorieActivities,
  })
  const weekStart = getWeekId()
  const monthStart = `${todayKey.slice(0, 7)}-01`
  const weeklySummary = getProgressPeriodSummary(progressRecords, weekStart, todayKey)
  const monthlySummary = getProgressPeriodSummary(progressRecords, monthStart, todayKey)
  const currentRecord = progressRecords.find(({ date }) => date === todayKey)
  const historyRows = [...progressRecords].reverse()
  const habitCount = DAILY_HABITS.filter(({ id }) => habits[id]).length
  const habitPercent = Math.round((habitCount / DAILY_HABITS.length) * 100)
  const waterPercent = Math.min(100, Math.round((water.totalMl / DAILY_WATER_GOAL_ML) * 100))
  const bmi = calculateBMI(profile.height, profile.weight)
  const bmiCategory = getBMICategory(bmi)
  const isSampleProfile = Object.keys(DEFAULT_PROFILE).every((key) => profile[key] === DEFAULT_PROFILE[key])

  return (
    <div className="page-content progress-page">
      <header className="progress-page-heading">
        <div><p className="eyebrow">{formatToday({ year: 'numeric' })}</p><h1>Your progress</h1><p className="workout-page-subtitle">A clear view of the activity and routines you have recorded.</p></div>
        <span className="date-pill"><Activity size={14} /> Based on saved data</span>
      </header>

      <section className="progress-metric-grid" aria-label="Daily and weekly progress">
        <ProgressBar label="Daily workout" value={workouts.dailyPercent === null ? 'Rest day' : `${workouts.dailyPercent}%`} detail={workouts.dailyPercent === null ? 'No workout is planned for today' : 'Best completion across your gym or home plan today'} icon={Activity} />
        <ProgressBar label="Weekly workouts" value={`${workouts.completedDays} / ${workouts.plannedDays}`} detail={`${weeklySummary.completedWorkouts} completed workout${weeklySummary.completedWorkouts === 1 ? '' : 's'} from saved records`} icon={Check} />
        <ProgressBar label="Daily habits" value={`${habitCount} / ${DAILY_HABITS.length}`} detail={`${habitPercent}% of today's habits completed`} icon={Check} tone="habit" />
        <ProgressBar label="Water intake" value={`${waterPercent}%`} detail={`${water.totalMl.toLocaleString()} of ${DAILY_WATER_GOAL_ML.toLocaleString()} ml today`} icon={Droplets} tone="water" />
      </section>

      <section className="progress-metric-grid period-summary-grid" aria-label="Historical progress summaries">
        <ProgressBar label="This week · tracked days" value={weeklySummary.trackedDays} detail={`${weeklySummary.caloriesConsumedKcal.toLocaleString()} estimated meal kcal · ${weeklySummary.averageWaterMl.toLocaleString()} ml average water`} icon={Activity} />
        <ProgressBar label="This month · tracked days" value={monthlySummary.trackedDays} detail={`${monthlySummary.completedWorkouts} completed workouts · ${monthlySummary.averageHabitPercent}% average habit completion`} icon={Flame} />
      </section>

      <section className="progress-profile-row" aria-label="Current profile measurements">
        <article className="progress-profile-card"><span className="progress-profile-icon"><Scale size={17} /></span><div><small>{isSampleProfile ? 'Sample BMI' : 'Current BMI'}</small><strong>{bmi?.toFixed(1) ?? '—'}</strong></div><span className="progress-profile-tag">{bmiCategory?.label ?? 'Unavailable'}</span></article>
        <article className="progress-profile-card"><span className="progress-profile-icon weight"><Weight size={17} /></span><div><small>{isSampleProfile ? 'Sample weight' : 'Current weight'}</small><strong>{profile.weight === null ? 'Not provided' : <>{profile.weight.toLocaleString(undefined, { maximumFractionDigits: 1 })} <em>kg</em></>}</strong></div><span className="progress-profile-tag">{isSampleProfile ? 'Sample profile' : 'Saved profile'}</span></article>
      </section>

      <div className="progress-visual-grid">
        <WeeklyActivityChart activityByDay={workouts.activityByDay} />
        <WeightVisualization weight={profile.weight} isSampleProfile={isSampleProfile} />
      </div>

      <section className="panel progress-history-panel" aria-labelledby="daily-history-title">
        <div className="progress-panel-heading"><div><h2 id="daily-history-title">Daily history</h2><p>Saved days only. No activity is inferred for dates without a record.</p></div><span className="progress-panel-icon"><Activity size={17} /></span></div>
        {historyRows.length ? (
          <div className="progress-history-scroll">
            <table className="progress-history-table">
              <thead><tr><th>Date</th><th>Meal estimate</th><th>Calories burned</th><th>Exercises</th><th>Workout</th><th>Water</th><th>Habits</th><th>Goals</th></tr></thead>
              <tbody>{historyRows.map((row) => (
                <tr key={row.date}>
                  <th scope="row">{formatDateKey(row.date)}</th>
                  <td>{row.caloriesConsumedKcal.toLocaleString()} kcal</td>
                  <td>{row.caloriesBurnedKcal.toLocaleString()} kcal</td>
                  <td>{row.completedExercises}/{row.totalExercises}</td>
                  <td>{row.completedWorkout ? 'Complete' : `${row.workoutPercent}%`}</td>
                  <td>{row.waterMl.toLocaleString()} ml</td>
                  <td>{row.completedHabits}/{row.totalHabits}</td>
                  <td>{row.completedGoals}/2</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="progress-history-empty">Your saved daily records will appear here as you use FitLife.</p>}
        <p className="progress-chart-note">Meal calories are estimates from selected meals. Burned calories include only saved activity estimates; no value is inferred when duration or weight is missing.</p>
        <span className="visually-hidden">{currentRecord ? `Today's recorded meal estimate is ${currentRecord.caloriesConsumedKcal} kcal.` : 'No progress record is saved for today.'}</span>
      </section>
    </div>
  )
}
