import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Clock3, Dumbbell, Flame, Footprints, HeartPulse, Sparkles, Target, Trophy, Waves } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData.js'
import { formatToday } from '../utils/date.js'
import { useDailyRecord } from '../hooks/useDailyRecord.js'
import { DAILY_WATER_GOAL_ML, WATER_STORAGE_KEY, createWaterIntake, isWaterIntake } from '../data/dailyTrackers.js'

const activityData = [
  { day: 'Fri', minutes: 32 }, { day: 'Sat', minutes: 48 }, { day: 'Sun', minutes: 25 },
  { day: 'Mon', minutes: 57 }, { day: 'Tue', minutes: 38 }, { day: 'Wed', minutes: 66 }, { day: 'Thu', minutes: 42 },
]

const statIcons = {
  'Calories burned': Flame,
  'Active minutes': Activity,
  'Steps today': Footprints,
  'Heart rate': HeartPulse,
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

function ActivityPanel() {
  return (
    <section className="panel" aria-labelledby="activity-heading">
      <div className="panel-heading"><div><h2 id="activity-heading">Activity overview</h2><p>Your movement through the week</p></div><span className="range-select">Past 7 days</span></div>
      <div className="chart-legend"><span><i className="legend-dot" />Active minutes</span><span>Daily goal · 45 min</span></div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activityData} margin={{ top: 15, right: 7, left: -20, bottom: 0 }}>
            <defs><linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4c9468" stopOpacity={0.2} /><stop offset="95%" stopColor="#4c9468" stopOpacity={0.01} /></linearGradient></defs>
            <CartesianGrid vertical={false} stroke="#eef1ee" strokeDasharray="3 4" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#929b94', fontSize: 10 }} dy={9} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a0a8a2', fontSize: 9 }} ticks={[0, 20, 40, 60, 80]} />
            <Tooltip contentStyle={{ border: '1px solid #e9eee9', borderRadius: 9, boxShadow: '0 6px 20px #173c2c12', fontSize: 11 }} formatter={(value) => [`${value} min`, 'Active']} />
            <Area type="monotone" dataKey="minutes" stroke="#43865d" strokeWidth={2.3} fill="url(#activityFill)" activeDot={{ r: 4, fill: '#43865d', stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function TodayPanel() {
  const { data: intake } = useDailyRecord(WATER_STORAGE_KEY, createWaterIntake, isWaterIntake)
  const waterProgress = Math.min(100, Math.round((intake.totalMl / DAILY_WATER_GOAL_ML) * 100))

  return (
    <section className="panel" aria-labelledby="today-heading">
      <div className="panel-heading"><div><h2 id="today-heading">Today at a glance</h2><p>A little progress goes a long way</p></div><span className="stat-icon"><Target size={16} /></span></div>
      <div className="today-summary">
        <div className="summary-item"><span className="summary-icon"><Dumbbell size={16} /></span><span className="summary-copy"><strong>Strength session</strong><span>Upper body · 35 min</span></span><span className="summary-value">Done</span></div>
        <div className="summary-item"><span className="summary-icon"><Waves size={16} /></span><span className="summary-copy"><strong>Water intake</strong><span>{intake.totalMl.toLocaleString()} of {DAILY_WATER_GOAL_ML.toLocaleString()} ml</span></span><span className="summary-value">{waterProgress}%</span></div>
        <div className="summary-item"><span className="summary-icon"><Trophy size={16} /></span><span className="summary-copy"><strong>Weekly streak</strong><span>Keep showing up</span></span><span className="summary-value">4 days</span></div>
      </div>
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
  const { profile, dashboardStats } = useAppData()
  const firstName = profile.name.trim().split(/\s+/)[0]

  return (
    <div className="page-content">
      <section className="welcome-row"><div><p className="eyebrow">{formatToday({ year: 'numeric' })}</p><h1>Good morning, {firstName} <span>✦</span></h1><p className="welcome-subtitle">Your focus: {profile.goal}. Let’s make today count.</p></div><div className="date-pill"><Sparkles size={14} /> Your week, your pace</div></section>
      <section className="stats-grid" aria-label="Today's fitness statistics">{dashboardStats.map((stat) => <StatCard key={stat.label} stat={stat} />)}</section>
      <div className="dashboard-grid"><ActivityPanel /><TodayPanel /></div>
      <div className="lower-grid"><WorkoutPanel /><HydrationPanel /></div>
      <p className="eyebrow" style={{ marginTop: 16, color: '#929b94', letterSpacing: '.2px', textTransform: 'none' }}>Dashboard preview · activity metrics are illustrative, not recorded activity</p>
    </div>
  )
}