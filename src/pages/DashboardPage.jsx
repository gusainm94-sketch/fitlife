import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, Check, Clock3, Dumbbell, Flame, Footprints, Sparkles, Target, Waves } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData.js'
import { formatToday, getTodayKey } from '../utils/date.js'
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
import { isMembershipExpired } from '../data/membership.js'
import { useMembership } from '../hooks/useMembership.js'
import { readLocalJson, readLocalJsonEntries } from '../utils/localStorage.js'
import { buildDailyProgressRecords, getProgressPeriodSummary, getWeekDateKeys, getWeekId } from '../utils/progress.js'
import { WEEKDAYS } from '../data/workouts.js'
import { getFitnessTrackerDailySummary } from '../data/fitnessTracker.js'
import { FOOD_INTAKE_STORAGE_KEY } from '../data/foodIntake.js'

const statIcons = {
  'Calories consumed': Flame,
  'Calories burned': Activity,
  'Workout completion': Dumbbell,
  'Water intake': Waves,
}

function StatCard({ stat }) {
  const Icon = statIcons[stat.label]
  return (
    <article className="stat-card">
      <div className="stat-top"><span>{stat.label}</span><span className="stat-icon"><Icon size={16} strokeWidth={1.9} /></span></div>
      <div className="stat-value-row"><span className="stat-value">{stat.value}</span><span className="stat-unit">{stat.unit}</span></div>
      <div className="stat-foot">{stat.trend === 'up' ? <ArrowUpRight className="positive" size={13} /> : stat.trend === 'down' ? <ArrowDownRight size={13} /> : <span className="positive">•</span>}<span>{stat.note}</span></div>
    </article>
  )
}

function ActivityPanel({ records, weekly, monthly }) {
  const weekRecords = new Map(records.map((record) => [record.date, record]))
  const activityData = getWeekDateKeys(getWeekId()).map((dateKey, index) => {
    return {
      day: WEEKDAYS[index].shortName,
      minutes: weekRecords.get(dateKey)?.workoutPercent ?? 0,
    }
  })

  return (
    <section className="panel" aria-labelledby="activity-heading">
      <div className="panel-heading"><div><h2 id="activity-heading">Weekly progress</h2><p>Workout completion from saved exercise checkmarks</p></div><span className="range-select">{weekly.completedWorkouts} workouts</span></div>
      <div className="chart-legend"><span><i className="legend-dot" />Workout completion</span><span>Monthly · {monthly.trackedDays} tracked days</span></div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activityData} margin={{ top: 15, right: 7, left: -20, bottom: 0 }}>
            <defs><linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4c9468" stopOpacity={0.2} /><stop offset="95%" stopColor="#4c9468" stopOpacity={0.01} /></linearGradient></defs>
            <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 4" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 10 }} dy={9} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 9 }} ticks={[0, 25, 50, 75, 100]} domain={[0, 100]} />
            <Tooltip contentStyle={{ border: '1px solid var(--line)', borderRadius: 9, background: 'var(--surface)', color: 'var(--ink)', boxShadow: '0 6px 20px #173c2c12', fontSize: 11 }} formatter={(value) => [`${value}%`, 'Workout']} />
            <Area type="monotone" dataKey="minutes" stroke="#43865d" strokeWidth={2.3} fill="url(#activityFill)" activeDot={{ r: 4, fill: '#43865d', stroke: 'var(--surface)', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function TodayPanel({ today, fitness }) {
  const waterProgress = Math.min(100, Math.round((today.waterMl / DAILY_WATER_GOAL_ML) * 100))
  return (
    <section className="panel" aria-labelledby="today-heading">
      <div className="panel-heading"><div><h2 id="today-heading">Today at a glance</h2><p>A little progress goes a long way</p></div><span className="stat-icon"><Target size={16} /></span></div>
      <div className="today-summary">
        <div className="summary-item"><span className="summary-icon"><Flame size={16} /></span><span className="summary-copy"><strong>Calories consumed</strong><span>Estimated nutrition from explicitly logged recipes</span></span><span className="summary-value">{today.caloriesConsumedKcal.toLocaleString()} kcal</span></div>
        <div className="summary-item"><span className="summary-icon"><Activity size={16} /></span><span className="summary-copy"><strong>Calories burned</strong><span>{fitness.caloriesReadings ? 'Includes manually entered fitness tracker calories' : today.caloriesBurnedKcal ? 'MET-based estimates from your activity log' : 'No activity estimate recorded yet'}</span></span><span className="summary-value">{today.caloriesBurnedKcal.toLocaleString()} kcal</span></div>
        <div className="summary-item"><span className="summary-icon"><Footprints size={16} /></span><span className="summary-copy"><strong>Manual tracker steps</strong><span>Fitness tracker entry for today</span></span><span className="summary-value">{fitness.stepsReadings ? fitness.steps.toLocaleString() : '—'}</span></div>
        <div className="summary-item"><span className="summary-icon"><Activity size={16} /></span><span className="summary-copy"><strong>Manual active minutes</strong><span>Fitness tracker entry for today</span></span><span className="summary-value">{fitness.activeMinutesReadings ? `${fitness.activeMinutes.toLocaleString()} min` : '—'}</span></div>
        <div className="summary-item"><span className="summary-icon"><Dumbbell size={16} /></span><span className="summary-copy"><strong>Today's workout</strong><span>Saved exercise completion</span></span><span className="summary-value">{today.completedWorkout ? 'Complete' : `${today.workoutPercent}%`}</span></div>
        <div className="summary-item"><span className="summary-icon"><Waves size={16} /></span><span className="summary-copy"><strong>Water intake</strong><span>{today.waterMl.toLocaleString()} of {DAILY_WATER_GOAL_ML.toLocaleString()} ml</span></span><span className="summary-value">{waterProgress}%</span></div>
        <div className="summary-item"><span className="summary-icon"><Check size={16} /></span><span className="summary-copy"><strong>Daily habits</strong><span>{today.completedHabits} of {today.totalHabits} completed</span></span><span className="summary-value">{today.habitPercent}%</span></div>
      </div>
      <Link className="text-action" style={{ marginTop: 10 }} to="/calories">Open calorie tracker <ArrowRight size={13} /></Link>
      <Link className="text-action" style={{ marginTop: 8, marginLeft: 7 }} to="/fitness-tracker">Open fitness tracker <ArrowRight size={13} /></Link>
    </section>
  )
}

function WorkoutPanel() {
  return (
    <section className="panel" aria-labelledby="workout-heading">
      <div className="panel-heading"><div><h2 id="workout-heading">Up next</h2><p>Your plan, one day at a time</p></div><span className="stat-icon"><Sparkles size={16} /></span></div>
      <div className="workout-card"><span className="workout-art"><Dumbbell size={25} /></span><span className="workout-info"><small>Tomorrow · 7:00 AM</small><strong>Lower body &amp; mobility</strong><span><Clock3 size={11} /> &nbsp;40 min&nbsp; · &nbsp;5 exercises</span></span><Link className="text-action" aria-label="View workout plan" to="/workouts">View <ArrowRight size={13} /></Link></div>
    </section>
  )
}

function HydrationPanel() {
  const { data: intake } = useDailyRecord(WATER_STORAGE_KEY, createWaterIntake, isWaterIntake)
  const progress = Math.min(100, Math.round((intake.totalMl / DAILY_WATER_GOAL_ML) * 100))

  return (
    <section className="panel" aria-labelledby="hydration-heading">
      <div className="panel-heading"><div><h2 id="hydration-heading">Stay hydrated</h2><p>A refreshing pause for your body</p></div><span className="stat-icon"><Waves size={16} /></span></div>
      <div className="water-card"><span className="water-icon"><Waves size={20} /></span><span className="water-copy"><strong>{intake.totalMl.toLocaleString()} ml</strong><span>{(intake.totalMl / 1000).toFixed(2)} L of {(DAILY_WATER_GOAL_ML / 1000).toFixed(1)} L daily goal</span><span className="water-track"><span style={{ width: `${progress}%` }} /></span></span><span className="water-percent">{progress}%</span></div>
      <Link className="text-action" style={{ marginTop: 12 }} to="/habits">Log water &amp; habits <ArrowRight size={13} /></Link>
    </section>
  )
}

export default function DashboardPage() {
  const { profile, workoutProgress, calorieActivities, fitnessTrackerRecords } = useAppData()
  const { membership } = useMembership()
  const { history: waterHistory } = useDailyRecord(WATER_STORAGE_KEY, createWaterIntake, isWaterIntake)
  const { history: habitHistory } = useDailyRecord(HABITS_STORAGE_KEY, createHabitCompletions, isHabitCompletions)
  const firstName = profile.name.trim().split(/\s+/)[0]
  const progressRecords = buildDailyProgressRecords({
    waterHistory,
    habitHistory,
    mealHistory: readLocalJsonEntries('fitlife-diet-plan-'),
    foodIntakeHistory: readLocalJson(FOOD_INTAKE_STORAGE_KEY, []),
    workoutProgress,
    calorieHistory: calorieActivities,
    fitnessTrackerRecords,
  })
  const fitnessToday = getFitnessTrackerDailySummary(fitnessTrackerRecords, getTodayKey())
  const todayKey = getTodayKey()
  const today = progressRecords.find(({ date }) => date === todayKey) ?? {
    caloriesConsumedKcal: 0,
    caloriesBurnedKcal: 0,
    waterMl: 0,
    completedHabits: 0,
    totalHabits: DAILY_HABITS.length,
    habitPercent: 0,
    workoutPercent: 0,
    completedWorkout: false,
  }
  const mondayKey = getWeekId()
  const monthStartKey = `${todayKey.slice(0, 7)}-01`
  const weekly = getProgressPeriodSummary(progressRecords, mondayKey, todayKey)
  const monthly = getProgressPeriodSummary(progressRecords, monthStartKey, todayKey)
  const dashboardStats = [
    { label: 'Calories consumed', value: today.caloriesConsumedKcal.toLocaleString(), unit: 'kcal', note: 'Estimated from logged meals only', trend: 'steady' },
    { label: 'Calories burned', value: today.caloriesBurnedKcal.toLocaleString(), unit: 'kcal', note: today.caloriesBurnedKcal ? 'MET-based activity estimate' : 'No estimate recorded', trend: 'steady' },
    { label: 'Workout completion', value: `${today.workoutPercent}`, unit: '%', note: today.completedWorkout ? 'Workout completed' : 'Saved exercises today', trend: 'steady' },
    { label: 'Water intake', value: today.waterMl.toLocaleString(), unit: 'ml', note: `Daily goal · ${DAILY_WATER_GOAL_ML.toLocaleString()} ml`, trend: 'steady' },
  ]

  return (
    <div className="page-content">
      <section className="welcome-row"><div><p className="eyebrow">{formatToday({ year: 'numeric' })}</p><h1>Good morning, {firstName} <span>✦</span></h1><p className="welcome-subtitle">Your focus: {profile.goal}. Let’s make today count.</p></div><div className="date-pill"><Sparkles size={14} /> Week · {weekly.completedWorkouts} workouts · Month · {monthly.completedWorkouts} workouts</div></section>
      <section className="stats-grid" aria-label="Today's fitness statistics">{dashboardStats.map((stat) => <StatCard key={stat.label} stat={stat} />)}</section>
      <section className="dashboard-membership panel" aria-label="Current membership">
        <span className="dashboard-membership-icon"><BadgeCheck size={19} /></span>
        <div><p className="eyebrow">Your membership</p><h2>{membership.plan} plan</h2><p>{membership.membershipExpiryDate ? `${isMembershipExpired(membership) ? 'Expired' : 'Access until'} ${new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${membership.membershipExpiryDate}T00:00:00`))}` : 'Basic access with no expiry'}</p></div>
        <Link className="text-action" to="/membership">{membership.plan === 'Free' ? 'Upgrade to Premium' : 'Manage membership'} <ArrowRight size={13} /></Link>
      </section>
      <div className="dashboard-grid"><ActivityPanel records={progressRecords} weekly={weekly} monthly={monthly} /><TodayPanel today={today} fitness={fitnessToday} /></div>
      <div className="lower-grid"><WorkoutPanel /><HydrationPanel /></div>
      <p className="eyebrow" style={{ marginTop: 16, color: '#929b94', letterSpacing: '.2px', textTransform: 'none' }}>Activity calories are estimates; fitness tracker calorie entries are manually entered. FitLife does not measure readings automatically.</p>
    </div>
  )
}