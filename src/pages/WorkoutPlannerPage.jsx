import { useEffect, useState } from 'react'
import { Check, CheckCircle2, Dumbbell, ExternalLink, House, Play, RotateCcw, Search, Sparkles, Target, Timer, TriangleAlert } from 'lucide-react'
import { useAppData } from '../hooks/useAppData.js'
import { DEFAULT_PROFILE } from '../data/profile.js'
import { GYM_DIFFICULTIES, GYM_WORKOUTS, WEEKDAYS, WEEKLY_WORKOUTS } from '../data/workouts.js'
import { EQUIPMENT_OPTIONS, NO_EQUIPMENT, filterWorkoutPlan, toggleEquipmentSelection } from '../data/equipment.js'
import { getExerciseSafetyWarnings, getPotentialExerciseAlternatives } from '../data/exerciseSafety.js'
import { EXERCISE_VIDEO_LIBRARY, getExerciseVideoUrl } from '../data/exerciseVideos.js'

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

function WeekDayButton({ day, date, plan, hasScheduledWorkout, dayProgress, selected, onSelect }) {
  const completion = getDayCompletion(plan, dayProgress)
  const status = plan.exercises.length === 0
    ? hasScheduledWorkout ? '0 available' : 'Rest'
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

function ExerciseCard({ exercise, completed, onToggle, index, safetyWarnings, safetyAlternatives }) {
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
        <a className="exercise-video-link" href={getExerciseVideoUrl(exercise.name)} target="_blank" rel="noopener noreferrer">
          <Play size={13} /> Watch demonstration <ExternalLink size={12} />
        </a>
        {safetyWarnings.length > 0 && <aside className="exercise-safety-warning" aria-label={`Caution for ${exercise.name}`}>
          <strong><TriangleAlert size={14} /> Caution to review · {safetyWarnings.map(({ area }) => area).join(', ')}</strong>
          <ul>{safetyWarnings.map(({ area, reason }) => <li key={area}>{reason}</li>)}</ul>
          {safetyAlternatives.length > 0
            ? <p>Possible options to discuss with a qualified professional (not a safety clearance): {safetyAlternatives.map(({ name }) => name).join(' · ')}.</p>
            : <p>FitLife cannot determine an alternative for this limitation and your selected equipment.</p>}
        </aside>}
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

const VIDEO_FILTERS = [
  { id: 'all', label: 'All exercises' },
  { id: 'gym', label: 'Gym' },
  { id: 'home', label: 'Home' },
  { id: 'alternative', label: 'Equipment alternatives' },
]

function ExerciseVideoLibrary() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const exercises = EXERCISE_VIDEO_LIBRARY.filter((exercise) => (
    (filter === 'all' || exercise.sources.includes(filter))
    && (!normalizedSearch || `${exercise.name} ${exercise.description}`.toLocaleLowerCase().includes(normalizedSearch))
  ))

  return (
    <details className="panel exercise-video-library">
      <summary>
        <span><strong>Exercise video library</strong><small>{EXERCISE_VIDEO_LIBRARY.length} exercises · Gym, home and equipment alternatives</small></span>
        <span className="exercise-video-library-action">Browse demonstrations</span>
      </summary>
      <div className="exercise-video-library-content">
        <div className="exercise-video-toolbar">
          <div className="exercise-video-filters" role="group" aria-label="Filter exercise videos">
            {VIDEO_FILTERS.map(({ id, label }) => (
              <button key={id} className={filter === id ? 'active' : ''} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
            ))}
          </div>
          <label className="exercise-video-search">
            <Search size={15} />
            <span>Search</span>
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search exercises" />
          </label>
        </div>
        {exercises.length ? (
          <div className="exercise-video-grid">
            {exercises.map((exercise) => (
              <article className="exercise-video-card" key={exercise.id}>
                <div className="exercise-video-art" aria-hidden="true"><Play size={22} /></div>
                <div className="exercise-video-copy">
                  <div className="exercise-video-tags">{exercise.sources.map((source) => <span key={source}>{source === 'alternative' ? 'Equipment alternative' : `${source} workout`}</span>)}</div>
                  <h3>{exercise.name}</h3>
                  <p>{exercise.description}</p>
                  <a className="exercise-video-link" href={exercise.videoUrl} target="_blank" rel="noopener noreferrer">
                    <Play size={13} /> Watch video on YouTube <ExternalLink size={12} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="exercise-video-empty">No exercises match your search.</p>}
        <p className="exercise-video-note">Links open YouTube search results so you can choose a suitable demonstration. Videos are not embedded or autoplayed.</p>
      </div>
    </details>
  )
}

function WorkoutProgress({ completed, total, hasScheduledWorkout }) {
  const percent = total ? Math.round((completed / total) * 100) : hasScheduledWorkout ? 0 : 100

  return (
    <div className="workout-progress-block">
      <div className="workout-progress-label"><span><Target size={14} /> Daily progress</span><strong>{total ? `${completed} of ${total} exercises` : hasScheduledWorkout ? 'No matching exercises' : 'Rest day'} <b>{percent}%</b></strong></div>
      <div className="workout-progress-track" role="progressbar" aria-label="Daily workout completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div>
    </div>
  )
}

function EquipmentSelector({ mode, selected, onToggle, saveError }) {
  const availableCount = selected.includes(NO_EQUIPMENT) ? 0 : selected.length

  return (
    <details className="workout-equipment-panel panel">
      <summary>
        <span><strong>Equipment available</strong><small>{availableCount ? `${availableCount} selected` : 'No equipment selected'} · Select what you have to tailor your plan</small></span>
        <span className="workout-equipment-summary-action">{selected.includes(NO_EQUIPMENT) ? 'No Equipment' : 'Update selection'}</span>
      </summary>
      <div className="workout-equipment-content">
        <div className="workout-equipment-heading"><div><h2>{mode === 'gym' ? 'Gym equipment' : 'Home equipment'}</h2><p>Exercises that need equipment you do not select will be hidden. You can change this anytime.</p></div></div>
        <div className="workout-equipment-grid" role="group" aria-label={`Select ${mode} equipment`}>
          {EQUIPMENT_OPTIONS[mode].map(({ id, label }) => {
            const isSelected = selected.includes(id)
            return (
              <button key={id} className={`workout-equipment-option${isSelected ? ' selected' : ''}`} type="button" aria-pressed={isSelected} onClick={() => onToggle(id)}>
                <span className="workout-equipment-check" aria-hidden="true">{isSelected ? <Check size={14} /> : null}</span>
                <span>{label}</span>
              </button>
            )
          })}
        </div>
        {saveError && <p className="workout-equipment-error" role="alert">Unable to save equipment preferences. Check browser storage and try again.</p>}
      </div>
    </details>
  )
}

export default function WorkoutPlannerPage() {
  const [mode, setMode] = useState('gym')
  const [selectedDayIndex, setSelectedDayIndex] = useState(getTodayIndex)
  const { profile, equipmentPreferences, updateEquipmentPreferences, equipmentStorageError, workoutProgress, toggleWorkoutExercise } = useAppData()
  const injuryAreas = Array.isArray(profile.injuryAreas) ? profile.injuryAreas : []
  const injuryDescription = typeof profile.injuryDescription === 'string' ? profile.injuryDescription : ''
  const safetyAreas = injuryAreas.length ? injuryAreas : injuryDescription.trim() ? ['Other'] : []
  const [difficulty, setDifficulty] = useState(profile.fitnessLevel || DEFAULT_PROFILE.fitnessLevel)
  useEffect(() => {
    const refreshSelectedDay = () => setSelectedDayIndex(getTodayIndex())
    document.addEventListener('visibilitychange', refreshSelectedDay)
    window.addEventListener('focus', refreshSelectedDay)
    window.addEventListener('pageshow', refreshSelectedDay)
    return () => {
      document.removeEventListener('visibilitychange', refreshSelectedDay)
      window.removeEventListener('focus', refreshSelectedDay)
      window.removeEventListener('pageshow', refreshSelectedDay)
    }
  }, [])
  const weekDates = makeWeekDates()
  const weekId = weekDates[0].weekId
  const selectedDay = WEEKDAYS[selectedDayIndex]
  const originalPlans = mode === 'gym' ? GYM_WORKOUTS[difficulty] : WEEKLY_WORKOUTS.home
  const selectedEquipment = equipmentPreferences[mode]
  const dayPlans = originalPlans.map((originalPlan) => filterWorkoutPlan(mode, originalPlan, selectedEquipment))
  const safetyCatalog = mode === 'gym'
    ? Object.values(GYM_WORKOUTS).flatMap((plansForLevel) => plansForLevel.flatMap(({ exercises }) => exercises))
    : WEEKLY_WORKOUTS.home.flatMap(({ exercises }) => exercises)
  const plans = dayPlans.map(({ plan: filteredPlan }) => filteredPlan)
  const plan = plans[selectedDayIndex]
  const alternatives = dayPlans[selectedDayIndex].alternatives
  const hasScheduledWorkout = originalPlans[selectedDayIndex].exercises.length > 0
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

      <EquipmentSelector
        mode={mode}
        selected={selectedEquipment}
        saveError={equipmentStorageError}
        onToggle={(equipmentId) => updateEquipmentPreferences({
          ...equipmentPreferences,
          [mode]: toggleEquipmentSelection(selectedEquipment, equipmentId),
        })}
      />

      {mode === 'gym' && <div className="workout-difficulty-row">
        <span>Gym difficulty</span>
        <div className="workout-difficulty-toggle" role="group" aria-label="Choose gym workout difficulty">
          {GYM_DIFFICULTIES.map((level) => <button key={level} className={difficulty === level ? 'active' : ''} type="button" aria-pressed={difficulty === level} onClick={() => setDifficulty(level)}>{level}</button>)}
        </div>
      </div>}

      <section className="panel workout-week-panel" aria-labelledby="week-heading">
        <div className="workout-section-heading"><div><h2 id="week-heading">Your week</h2><p>Monday to Sunday · choose a day to see the plan</p></div><span className="workout-week-badge"><Sparkles size={13} /> {mode === 'gym' ? `${difficulty} gym plan` : 'Home plan'}</span></div>
        <div className="workout-week-grid">
          {WEEKDAYS.map((day, index) => <WeekDayButton key={day.id} day={day} date={weekDates[index]} plan={plans[index]} hasScheduledWorkout={originalPlans[index].exercises.length > 0} dayProgress={mode === 'gym' ? workoutProgress.gym?.[difficulty]?.[weekId]?.[day.id] : workoutProgress.home?.[weekId]?.[day.id]} selected={selectedDayIndex === index} onSelect={() => setSelectedDayIndex(index)} />)}
        </div>
      </section>

      <section className="workout-session panel" aria-labelledby="session-heading">
        <div className="workout-session-heading">
          <div className="workout-session-title"><span className="workout-session-icon">{plan.exercises.length ? <Dumbbell size={19} /> : <CheckCircle2 size={19} />}</span><div><p className="eyebrow">{selectedDay.name}{weekDates[selectedDayIndex].isToday ? ' · Today' : ''}</p><h2 id="session-heading">{plan.title}</h2><p>{mode === 'gym' ? `${difficulty} gym session` : 'At-home session'}</p></div></div>
          {mode === 'gym' && <span className={`workout-category-badge ${category.toLowerCase()}`}>{category} session</span>}
          {plan.exercises.length > 0 && <span className="workout-duration"><Dumbbell size={14} /> {plan.exercises.length} exercises</span>}
        </div>

        <WorkoutProgress completed={completion.completed} total={completion.total} hasScheduledWorkout={hasScheduledWorkout} />

        {plan.exercises.length > 0 ? (
          <div className="exercise-list" aria-label={`${plan.title} exercises`}>
            {plan.exercises.map((item, index) => {
              const safetyWarnings = getExerciseSafetyWarnings(item, safetyAreas)
              const safetyAlternatives = safetyWarnings.length
                ? getPotentialExerciseAlternatives(mode, item, safetyAreas, selectedEquipment, safetyCatalog)
                : []
              return <ExerciseCard key={item.id} exercise={item} index={index} completed={Boolean(dayProgress[item.id])} onToggle={() => toggleWorkoutExercise(mode, weekId, selectedDay.id, item.id, difficulty)} safetyWarnings={safetyWarnings} safetyAlternatives={safetyAlternatives} />
            })}
          </div>
        ) : (
          hasScheduledWorkout
            ? <div className="rest-day-card"><span><Sparkles size={18} /></span><div><strong>No matching exercises</strong><p>Choose more equipment above, or try one of the alternatives below.</p></div></div>
            : <div className="rest-day-card"><span><Sparkles size={18} /></span><div><strong>Complete Rest</strong><p>Sunday is your scheduled rest day. Rest and recover before the next week.</p></div></div>
        )}
        {alternatives.length > 0 && <section className="workout-alternatives" aria-label="Alternative exercises">
          <div className="workout-alternatives-heading"><h3>Suitable alternatives</h3><p>Suggestions that match your current equipment selection. These do not change your saved plan.</p></div>
          <ul>{alternatives.map(({ exercise, name }) => <li key={exercise.id}><span>{exercise.name}</span><b aria-hidden="true">→</b><strong>{name}</strong><a className="exercise-video-link" href={getExerciseVideoUrl(name)} target="_blank" rel="noopener noreferrer" aria-label={`Watch a demonstration of ${name}`}><Play size={12} /> Watch</a></li>)}</ul>
        </section>}
      </section>

      <ExerciseVideoLibrary />

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

      <aside className="workout-medical-disclaimer" aria-label="Medical disclaimer">
        <TriangleAlert size={17} />
        <div><strong>Exercise safety information</strong><p>FitLife provides general fitness information, not medical advice. It does not diagnose injuries or prescribe rehabilitation. Consult a qualified healthcare professional when necessary. Stop exercising if you experience sharp pain, dizziness, or unusual symptoms.</p><small>A missing warning does not mean an exercise is medically safe or suitable for you.</small></div>
      </aside>
    </div>
  )
}