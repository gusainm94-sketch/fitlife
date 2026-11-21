import { useMemo, useState } from 'react'
import { Calculator, CircleAlert, Info } from 'lucide-react'
import { useAppData } from '../hooks/useAppData.js'

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', factor: 1.2 },
  { id: 'light', label: 'Lightly active', factor: 1.375 },
  { id: 'moderate', label: 'Moderately active', factor: 1.55 },
  { id: 'high', label: 'Very active', factor: 1.725 },
  { id: 'athlete', label: 'Extra active', factor: 1.9 },
]

const GOAL_ADJUSTMENTS = {
  'Weight Loss': -300,
  'Muscle Gain': 250,
  'Maintain Fitness': 0,
  'General Fitness': 0,
}

function numberOrNull(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

function format(value, suffix = '') {
  return value === null ? 'Not set' : `${Math.round(value).toLocaleString()}${suffix}`
}

export default function NutritionCalculatorPage() {
  const { profile } = useAppData()
  const [form, setForm] = useState(() => ({
    height: profile.height == null ? '' : String(profile.height),
    weight: profile.weight == null ? '' : String(profile.weight),
    age: profile.age == null ? '' : String(profile.age),
    gender: profile.gender || '',
    activity: profile.fitnessLevel === 'Advanced' ? 'high' : profile.fitnessLevel === 'Intermediate' ? 'moderate' : 'light',
    goal: profile.goal || 'General Fitness',
  }))

  const values = useMemo(() => {
    const height = numberOrNull(form.height)
    const weight = numberOrNull(form.weight)
    const age = numberOrNull(form.age)
    if (!height || !weight || !age) return { bmi: null, bmr: null, maintenance: null, target: null }
    const bmr = 10 * weight + 6.25 * height - 5 * age + (form.gender === 'Male' ? 5 : form.gender === 'Female' ? -161 : -78)
    const activity = ACTIVITY_LEVELS.find(({ id }) => id === form.activity) ?? ACTIVITY_LEVELS[1]
    const maintenance = bmr * activity.factor
    return { bmi: weight / ((height / 100) ** 2), bmr, maintenance, target: maintenance + (GOAL_ADJUSTMENTS[form.goal] ?? 0) }
  }, [form])

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  return (
    <div className="page-content nutrition-calculator-page">
      <header className="nutrition-page-heading">
        <div><p className="eyebrow">Personal estimates</p><h1>Nutrition Calculator</h1><p className="workout-page-subtitle">Calculate BMI, BMR, maintenance calories, and a goal-based daily target.</p></div>
        <span className="date-pill"><Calculator size={14} /> Profile connected</span>
      </header>

      <section className="nutrition-calculator-notice" aria-label="Estimate notice"><CircleAlert size={17} /><p><strong>These results are estimates, not medical advice.</strong> Your saved profile fills the calculator automatically, and you can temporarily change any value without changing your profile.</p></section>

      <div className="nutrition-calculator-grid">
        <section className="panel nutrition-calculator-form-panel" aria-labelledby="nutrition-input-title">
          <div className="nutrition-panel-heading"><div><h2 id="nutrition-input-title">Your calculation inputs</h2><p>Temporary changes are used for this calculation only.</p></div><span className="nutrition-panel-icon"><Calculator size={17} /></span></div>
          <div className="nutrition-calculator-form">
            <label>Height<input name="height" type="number" min="100" max="250" step="0.1" value={form.height} onChange={update} placeholder="cm" /><small>cm</small></label>
            <label>Weight<input name="weight" type="number" min="30" max="350" step="0.1" value={form.weight} onChange={update} placeholder="kg" /><small>kg</small></label>
            <label>Age<input name="age" type="number" min="13" max="120" step="1" value={form.age} onChange={update} placeholder="years" /><small>years</small></label>
            <label>Gender<select name="gender" value={form.gender} onChange={update}><option value="">Not specified</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option></select></label>
            <label>Activity level<select name="activity" value={form.activity} onChange={update}>{ACTIVITY_LEVELS.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}</select></label>
            <label>Fitness goal<select name="goal" value={form.goal} onChange={update}>{Object.keys(GOAL_ADJUSTMENTS).map((goal) => <option key={goal}>{goal}</option>)}</select></label>
          </div>
          <p className="nutrition-calculator-profile-note"><Info size={13} /> Editing these fields does not update your saved profile.</p>
        </section>

        <section className="panel nutrition-results-panel" aria-labelledby="nutrition-results-title" aria-live="polite">
          <div className="nutrition-panel-heading"><div><h2 id="nutrition-results-title">Your results</h2><p>Approximate daily values based on the inputs above.</p></div></div>
          <dl className="nutrition-result-list">
            <div><dt>BMI</dt><dd>{values.bmi === null ? 'Not set' : values.bmi.toFixed(1)}</dd></div>
            <div><dt>BMR</dt><dd>{format(values.bmr, ' kcal/day')}</dd></div>
            <div><dt>Estimated maintenance calories</dt><dd>{format(values.maintenance, ' kcal/day')}</dd></div>
            <div className="highlight"><dt>Goal calorie target</dt><dd>{format(values.target, ' kcal/day')}</dd></div>
          </dl>
          {values.target !== null && <p className="nutrition-goal-note">{form.goal === 'Weight Loss' ? 'A modest calorie reduction is applied for weight loss.' : form.goal === 'Muscle Gain' ? 'A modest calorie increase is applied for muscle gain.' : 'Your target stays close to estimated maintenance for this goal.'}</p>}
          <p className="nutrition-method-note">BMR uses the Mifflin–St Jeor equation. Maintenance uses the selected activity factor. Actual needs vary with health, training, and daily movement.</p>
        </section>
      </div>
    </div>
  )
}
