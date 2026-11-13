import { useState } from 'react'
import { Check, CheckCircle2, Dumbbell, House, RotateCcw, Sparkles, Target, Timer } from 'lucide-react'
import { useAppData } from '../hooks/useAppData.js'
import { GYM_DIFFICULTIES, GYM_WORKOUTS, WEEKDAYS, WEEKLY_WORKOUTS } from '../data/workouts.js'

const getTodayIndex = () => (new Date().getDay() + 6) % 7

function makeWeekDates() {
  const today = new Date()
  const monday = new Date(today)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(today.getDate() - getTodayIndex())
  const weekId = [monday.getFullYear(), String(monday.getMonth() + 1).padStart(2, '0'), String(monday.getDate()).padStart(2, '0')].join('-')

  return WEEKDAYS.map((_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return { dayNumber: date.getDate(), isToday: date.toDateString() === today.toDateString(), weekId }
  })
}

function getDayCompletion(plan, dayProgress = {}) {
  const completed = plan.exercises.filter((item) => dayProgress[item.id]).length
  return { completed, total: plan.exercises.length, isComplete: plan.exercises.length > 0 && completed === plan.exercises.length }
}

function WeekDayButton({ day, date, plan, dayProgress, selected, onSelect }) {
  const completion = getDayCompletion(plan, dayProgress)
  const status = plan.exercises.length === 0
    ? 'Rest'
    : completion.isComplete
      ? 'Done'
      : completion.completed
        ? `${completion.completed}/${completion.total}`
        : `${completion.total} moves`

  return (
    <button className={`workout-day-button${selected ? ' selected' : ''}${date.isToday ? ' is-today' : ''}${completion.isComplete ? ' is-done' : ''}`} type="button" aria-pressed={selected} aria-label={`${day.name}, ${plan.title}${date.isToday ? ', today' : ''}`} onClick={onSelect}>
      <span className="workout-day-name">{day.shortName}</span>
      <strong className="workout-day-number">{date.dayNumber}</strong>
      <span className="workout-day-focus">{plan.focus}</span>
      <span className="workout-day-status">{status}</span>
    </button>
  )
}

function ExerciseCard({ exercise, completed, onToggle, index }) {
  const repText = !exercise.reps
    ? ''
    : /reps?|seconds?|minutes?|metres?|\/(?:side|leg)|hold/i.test(exercise.reps)
      ? exercise.reps
      : `${exercise.reps} reps`
  const setText = exercise.sets === 1 ? '1 set' : `${exercise.sets} sets`
  const prescription = exercise.sets > 0 && repText ? `${setText} · ${repText}` : ''

  return (
    <article className={`exercise-card${completed ? ' completed' : ''}`}>
      <span className="exercise-number">{String(index + 1).padStart(2, '0')}</span>
      <div className="exercise-details">
        <h3>{exercise.name}</h3>
        {exercise.description && <p>{exercise.description}</p>}
        <div className="exercise-meta">
          {prescription && <span><RotateCcw size={13} /> {prescription}</span>}
          {exercise.duration && <span><Timer size={13} /> {exercise.duration}</span>}
        </div>
      </div>
      <button className="exercise-check" type="button" aria-pressed={completed} aria-label={`${completed ? 'Mark incomplete' : 'Mark complete'}: ${exercise.name}`} onClick={onToggle}>
        {completed ? <Check size={17} strokeWidth={2.5} /> : <span />}
      </button>
    </article>
  )
}

function WorkoutProgress({ completed, total }) {
  const percent = total ? Math.round((completed / total) * 100) : 100

  return (
    <div className="workout-progress-block">
      <div className="workout-progress-label"><span><Target size={14} /> Daily progress</span><strong>{total ? `${completed} of ${total} exercises` : 'Rest day'} <b>{percent}%</b></strong></div>
      <div className="workout-progress-track" role="progressbar" aria-label="Daily workout completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div>
    </div>
  )
}

export default function WorkoutPlannerPage() {
  const [mode, setMode] = useState('gym')
  const [selectedDayIndex, setSelectedDayIndex] = useState(getTodayIndex)
  const { profile, workoutProgress, toggleWorkoutExercise } = useAppData()
  const [difficulty, setDifficulty] = useState(profile.fitnessLevel)
  const weekDates = makeWeekDates()
  const weekId = weekDates[0].weekId
  const selectedDay = WEEKDAYS[selectedDayIndex]
  const plans = mode === 'gym' ? GYM_WORKOUTS[difficulty] : WEEKLY_WORKOUTS.home
  const plan = plans[selectedDayIndex]
  const dayProgress = mode === 'gym'
    ? workoutProgress.gym?.[difficulty]?.[weekId]?.[selectedDay.id] ?? {}
    : workoutProgress.home?.[weekId]?.[selectedDay.id] ?? {}
  const completion = getDayCompletion(plan, dayProgress)
  const category = plan.category ?? plan.focus

  return (
    <div className="page-content workout-page">
      <section className="workout-page-heading">
        <div><p className="eyebrow">A plan that moves with you</p><h1>Your workouts</h1><p className="workout-page-subtitle">Build strength at your pace, one session at a time.</p></div>
        <div className="workout-mode-toggle" role="group" aria-label="Choose workout mode">
          <button className={mode === 'gym' ? 'active' : ''} type="button" aria-pressed={mode === 'gym'} onClick={() => setMode('gym')}><Dumbbell size={16} /> Gym mode</button>
          <button className={mode === 'home' ? 'active' : ''} type="button" aria-pressed={mode === 'home'} onClick={() => setMode('home')}><House size={16} /> Home mode</button>
        </div>
      </section>

      {mode === 'gym' && <div className="workout-difficulty-row">
        <span>Gym difficulty</span>
        <div className="workout-difficulty-toggle" role="group" aria-label="Choose gym workout difficulty">
          {GYM_DIFFICULTIES.map((level) => <button key={level} className={difficulty === level ? 'active' : ''} type="button" aria-pressed={difficulty === level} onClick={() => setDifficulty(level)}>{level}</button>)}
        </div>
      </div>}

      <section className="panel workout-week-panel" aria-labelledby="week-heading">
        <div className="workout-section-heading"><div><h2 id="week-heading">Your week</h2><p>Monday to Sunday · choose a day to see the plan</p></div><span className="workout-week-badge"><Sparkles size={13} /> {mode === 'gym' ? `${difficulty} gym plan` : 'Home plan'}</span></div>
        <div className="workout-week-grid">
          {WEEKDAYS.map((day, index) => <WeekDayButton key={day.id} day={day} date={weekDates[index]} plan={plans[index]} dayProgress={mode === 'gym' ? workoutProgress.gym?.[difficulty]?.[weekId]?.[day.id] : workoutProgress.home?.[weekId]?.[day.id]} selected={selectedDayIndex === index} onSelect={() => setSelectedDayIndex(index)} />)}
        </div>
      </section>

      <section className="workout-session panel" aria-labelledby="session-heading">
        <div className="workout-session-heading">
          <div className="workout-session-title"><span className="workout-session-icon">{plan.exercises.length ? <Dumbbell size={19} /> : <CheckCircle2 size={19} />}</span><div><p className="eyebrow">{selectedDay.name}{weekDates[selectedDayIndex].isToday ? ' · Today' : ''}</p><h2 id="session-heading">{plan.title}</h2><p>{mode === 'gym' ? `${difficulty} gym session` : 'At-home session'}</p></div></div>
          {mode === 'gym' && <span className={`workout-category-badge ${category.toLowerCase()}`}>{category} session</span>}
          {plan.exercises.length > 0 && <span className="workout-duration"><Dumbbell size={14} /> {plan.exercises.length} exercises</span>}
        </div>

        <WorkoutProgress completed={completion.completed} total={completion.total} />

        {plan.exercises.length > 0 ? (
          <div className="exercise-list" aria-label={`${plan.title} exercises`}>
            {plan.exercises.map((item, index) => <ExerciseCard key={item.id} exercise={item} index={index} completed={Boolean(dayProgress[item.id])} onToggle={() => toggleWorkoutExercise(mode, weekId, selectedDay.id, item.id, difficulty)} />)}
          </div>
        ) : (
          <div className="rest-day-card"><span><Sparkles size={18} /></span><div><strong>Complete Rest</strong><p>Sunday is your scheduled rest day. Rest and recover before the next week.</p></div></div>
        )}
      </section>

      <section className="panel workout-guidelines" aria-labelledby="guidelines-heading">
        <div className="workout-section-heading"><div><h2 id="guidelines-heading">Training guidelines</h2><p>Keep each session safe, manageable and consistent.</p></div></div>
        <ul>
          <li>Warm up for 5–10 minutes before strength workouts.</li>
          <li>Use manageable weights and prioritize correct exercise technique.</li>
          <li>Beginner: generally rest 60–90 seconds between strength sets.</li>
          <li>Progress gradually by increasing resistance or repetitions when the current workload becomes comfortable.</li>
          <li>Recovery and mobility days should remain low intensity.</li>
          <li>Stop an exercise if you experience sharp pain, dizziness or unusual symptoms.</li>
        </ul>
      </section>
    </div>
  )
}