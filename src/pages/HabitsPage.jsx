import { Check, Droplets, Footprints, RotateCcw, Sparkles, Utensils, Moon, Dumbbell } from 'lucide-react'
import { formatToday } from '../utils/date.js'
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

const waterAmounts = [250, 500, 750]
const habitIcons = [Footprints, Dumbbell, Utensils, Droplets, Moon]

function WaterTracker() {
  const { data: intake, updateData } = useDailyRecord(WATER_STORAGE_KEY, createWaterIntake, isWaterIntake)
  const progress = Math.min(100, Math.round((intake.totalMl / DAILY_WATER_GOAL_ML) * 100))
  const remaining = Math.max(0, DAILY_WATER_GOAL_ML - intake.totalMl)

  function addWater(amount) {
    updateData((current) => ({
      totalMl: current.totalMl + amount,
      entries: [...current.entries, amount],
    }))
  }

  function undoLastDrink() {
    updateData((current) => {
      const entries = current.entries.slice(0, -1)
      return { totalMl: entries.reduce((total, amount) => total + amount, 0), entries }
    })
  }

  function resetWater() {
    updateData(createWaterIntake())
  }

  return (
    <section className="panel tracker-panel water-tracker-panel" aria-labelledby="water-tracker-heading">
      <div className="tracker-panel-heading">
        <span className="tracker-feature-icon water-feature-icon"><Droplets size={19} /></span>
        <div><p className="eyebrow">A small sip at a time</p><h2 id="water-tracker-heading">Water intake</h2><p>Daily goal · {DAILY_WATER_GOAL_ML.toLocaleString()} ml</p></div>
      </div>
      <div className="water-total-row">
        <div><strong>{intake.totalMl.toLocaleString()}</strong><span> ml consumed</span></div>
        <span className="water-goal-label">{progress}% of goal</span>
      </div>
      <div className="tracker-progress-track" role="progressbar" aria-label="Daily water goal progress" aria-valuemin="0" aria-valuemax={DAILY_WATER_GOAL_ML} aria-valuenow={Math.min(intake.totalMl, DAILY_WATER_GOAL_ML)}>
        <span className="water-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="water-remaining">{remaining > 0 ? `${remaining.toLocaleString()} ml left to reach your goal` : 'Daily water goal reached — nice work!'}</p>
      <div className="water-add-label">Add a drink</div>
      <div className="water-add-buttons">
        {waterAmounts.map((amount) => <button key={amount} className="water-add-button" type="button" onClick={() => addWater(amount)}><Droplets size={15} />{amount} ml</button>)}
      </div>
      <div className="tracker-actions">
        <button className="tracker-secondary-button" type="button" disabled={!intake.entries.length} onClick={undoLastDrink}><RotateCcw size={14} /> Undo last</button>
        <button className="tracker-secondary-button" type="button" disabled={!intake.totalMl} onClick={resetWater}>Reset today</button>
      </div>
    </section>
  )
}

function HabitTracker() {
  const { data: completions, updateData } = useDailyRecord(HABITS_STORAGE_KEY, createHabitCompletions, isHabitCompletions)
  const completedCount = DAILY_HABITS.filter(({ id }) => completions[id]).length
  const completionPercent = Math.round((completedCount / DAILY_HABITS.length) * 100)

  function toggleHabit(id) {
    updateData((current) => ({ ...current, [id]: !current[id] }))
  }

  return (
    <section className="panel tracker-panel habits-tracker-panel" aria-labelledby="habits-tracker-heading">
      <div className="tracker-panel-heading">
        <span className="tracker-feature-icon habit-feature-icon"><Check size={19} /></span>
        <div><p className="eyebrow">Make today your own</p><h2 id="habits-tracker-heading">Daily habits</h2><p>Small routines, steady progress</p></div>
        <span className="habit-percent-badge">{completionPercent}%</span>
      </div>
      <div className="habit-progress-label"><span>{completedCount} of {DAILY_HABITS.length} completed</span><strong>{completionPercent}%</strong></div>
      <div className="tracker-progress-track" role="progressbar" aria-label="Daily habit completion" aria-valuemin="0" aria-valuemax={DAILY_HABITS.length} aria-valuenow={completedCount}>
        <span className="habit-progress-fill" style={{ width: `${completionPercent}%` }} />
      </div>
      <div className="habit-list">
        {DAILY_HABITS.map(({ id, label, detail }, index) => {
          const Icon = habitIcons[index]
          const isComplete = completions[id]
          return (
            <button key={id} className={`habit-row${isComplete ? ' completed' : ''}`} type="button" aria-pressed={isComplete} onClick={() => toggleHabit(id)}>
              <span className="habit-row-icon"><Icon size={16} /></span>
              <span className="habit-row-copy"><strong>{label}</strong><small>{detail}</small></span>
              <span className="habit-check" aria-hidden="true">{isComplete && <Check size={14} />}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default function HabitsPage() {
  return (
    <section className="page-content">
      <div className="tracker-page-heading">
        <div><p className="eyebrow">{formatToday({ year: 'numeric' })}</p><h1>Your daily rhythm</h1><p className="workout-page-subtitle">Track hydration and the everyday habits that help you feel your best.</p></div>
        <span className="date-pill"><Sparkles size={14} /> Progress at your pace</span>
      </div>
      <div className="daily-tracker-grid"><WaterTracker /><HabitTracker /></div>
    </section>
  )
}
