import { Activity, Check, Droplets, Scale, Weight } from 'lucide-react'
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
import { formatToday } from '../utils/date.js'
import { getWorkoutProgress } from '../utils/progress.js'

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
  const marker = Math.max(10, Math.min(90, 50 + (weight - 70) * 3))
  return (
    <section className="panel progress-panel weight-progress-panel" aria-labelledby="weight-progress-title">
      <div className="progress-panel-heading"><div><h2 id="weight-progress-title">Weight snapshot</h2><p>{isSampleProfile ? 'Sample profile measurement' : 'Current measurement from your saved profile'}</p></div><span className="progress-panel-icon"><Weight size={17} /></span></div>
      <div className="weight-snapshot"><strong>{weight.toLocaleString(undefined, { maximumFractionDigits: 1 })}</strong><span>kg</span></div>
      <div className="weight-scale" role="img" aria-label={`${isSampleProfile ? 'Sample' : 'Current saved'} weight ${weight} kilograms; no prior weight entries are available`}>
        <span className="weight-scale-marker" style={{ left: `${marker}%` }} />
        <span className="weight-scale-start">Lower</span><span className="weight-scale-end">Higher</span>
      </div>
      <p className="progress-chart-note">A weight history is not available yet. This view uses {isSampleProfile ? 'the sample profile value only' : 'your current saved profile measurement only'}.</p>
    </section>
  )
}

export default function ProgressPage() {
  const { profile, workoutProgress } = useAppData()
  const { data: water } = useDailyRecord(WATER_STORAGE_KEY, createWaterIntake, isWaterIntake)
  const { data: habits } = useDailyRecord(HABITS_STORAGE_KEY, createHabitCompletions, isHabitCompletions)
  const workouts = getWorkoutProgress(workoutProgress)
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
        <ProgressBar label="Weekly workouts" value={`${workouts.completedDays} / ${workouts.plannedDays}`} detail={`${workouts.completedSessions} completed session${workouts.completedSessions === 1 ? '' : 's'} recorded this week`} icon={Check} />
        <ProgressBar label="Daily habits" value={`${habitCount} / ${DAILY_HABITS.length}`} detail={`${habitPercent}% of today's habits completed`} icon={Check} tone="habit" />
        <ProgressBar label="Water intake" value={`${waterPercent}%`} detail={`${water.totalMl.toLocaleString()} of ${DAILY_WATER_GOAL_ML.toLocaleString()} ml today`} icon={Droplets} tone="water" />
      </section>

      <section className="progress-profile-row" aria-label="Current profile measurements">
        <article className="progress-profile-card"><span className="progress-profile-icon"><Scale size={17} /></span><div><small>{isSampleProfile ? 'Sample BMI' : 'Current BMI'}</small><strong>{bmi?.toFixed(1) ?? '—'}</strong></div><span className="progress-profile-tag">{bmiCategory?.label ?? 'Unavailable'}</span></article>
        <article className="progress-profile-card"><span className="progress-profile-icon weight"><Weight size={17} /></span><div><small>{isSampleProfile ? 'Sample weight' : 'Current weight'}</small><strong>{profile.weight.toLocaleString(undefined, { maximumFractionDigits: 1 })} <em>kg</em></strong></div><span className="progress-profile-tag">{isSampleProfile ? 'Sample profile' : 'Saved profile'}</span></article>
      </section>

      <div className="progress-visual-grid">
        <WeeklyActivityChart activityByDay={workouts.activityByDay} />
        <WeightVisualization weight={profile.weight} isSampleProfile={isSampleProfile} />
      </div>
    </div>
  )
}
