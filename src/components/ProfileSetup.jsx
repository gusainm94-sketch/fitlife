import { useState } from 'react'
import { Activity, Check, Dumbbell } from 'lucide-react'
import { useAppData } from '../hooks/useAppData.js'
import { AVAILABLE_EQUIPMENT, FITNESS_GOALS, FITNESS_LEVELS, GENDER_OPTIONS } from '../data/profile.js'
import { NO_EQUIPMENT, EQUIPMENT_OPTIONS } from '../data/equipment.js'

const equipmentToPreferences = (selected) => {
  if (selected.includes('full-gym')) {
    return {
      gym: EQUIPMENT_OPTIONS.gym.map(({ id }) => id).filter((id) => id !== NO_EQUIPMENT),
      home: EQUIPMENT_OPTIONS.home.map(({ id }) => id).filter((id) => id !== NO_EQUIPMENT),
    }
  }
  const gym = []
  const home = []
  if (selected.includes('dumbbells')) { gym.push('dumbbells'); home.push('adjustable-dumbbells') }
  if (selected.includes('resistance-bands')) { gym.push('resistance-bands'); home.push('resistance-bands') }
  if (selected.includes('barbell')) { gym.push('barbells', 'weight-plates') }
  if (selected.includes('bench')) { gym.push('bench'); home.push('bench') }
  if (selected.includes('pull-up-bar')) home.push('pull-up-bar')
  return {
    gym: gym.length ? gym : [NO_EQUIPMENT],
    home: home.length ? home : [NO_EQUIPMENT],
  }
}

export default function ProfileSetup() {
  const { updateProfile, updateEquipmentPreferences, profileStorageError } = useAppData()
  const [form, setForm] = useState({
    height: '',
    weight: '',
    age: '',
    gender: '',
    fitnessLevel: '',
    goal: '',
    equipment: ['no-equipment'],
  })
  const [error, setError] = useState('')

  const update = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const toggleEquipment = (id) => {
    setForm((current) => {
      if (id === 'no-equipment') return { ...current, equipment: ['no-equipment'] }
      const next = current.equipment.filter((item) => item !== 'no-equipment')
      const selected = next.includes(id) ? next.filter((item) => item !== id) : [...next, id]
      return { ...current, equipment: selected.length ? selected : ['no-equipment'] }
    })
  }

  const submit = (event) => {
    event.preventDefault()
    const height = Number(form.height)
    const weight = Number(form.weight)
    if (!Number.isFinite(height) || height < 100 || height > 250 || !Number.isFinite(weight) || weight < 30 || weight > 350) {
      setError('Enter a valid height and weight to continue.')
      return
    }
    const equipment = form.equipment.includes('no-equipment') ? [] : form.equipment
    if (!updateProfile({
      height,
      weight,
      weightConfirmed: true,
      age: form.age === '' ? null : Number(form.age),
      gender: form.gender,
      fitnessLevel: form.fitnessLevel,
      goal: form.goal,
      availableEquipment: equipment,
      profileSetupComplete: true,
    })) {
      setError('Unable to save your profile. Check browser storage and try again.')
      return
    }
    if (!updateEquipmentPreferences(equipmentToPreferences(form.equipment))) {
      setError('Your profile was saved, but equipment preferences could not be saved.')
      return
    }
    setError('')
  }

  return (
    <main className="profile-setup-page">
      <section className="profile-setup-card" aria-labelledby="profile-setup-title">
        <div className="auth-card-mark"><Activity size={21} /></div>
        <p className="eyebrow">Welcome to FitLife</p>
        <h1 id="profile-setup-title">Make your plan personal</h1>
        <p className="auth-subtitle">Tell us a little about yourself so workouts and calorie estimates fit you. Height and weight are required; everything else can be updated later.</p>
        <form className="profile-setup-form" onSubmit={submit}>
          <div className="profile-setup-grid">
            <label>Height <span className="profile-required-label">Required</span><span className="input-with-unit"><input name="height" type="number" min="100" max="250" step="0.1" value={form.height} onChange={update} required placeholder="e.g. 170" /><span>cm</span></span></label>
            <label>Current weight <span className="profile-required-label">Required</span><span className="input-with-unit"><input name="weight" type="number" min="30" max="350" step="0.1" value={form.weight} onChange={update} required placeholder="e.g. 68" /><span>kg</span></span></label>
            <label>Age <span className="profile-optional-label">Optional</span><input name="age" type="number" min="13" max="120" step="1" value={form.age} onChange={update} placeholder="Your age" /></label>
            <label>Gender <span className="profile-optional-label">Optional</span><select name="gender" value={form.gender} onChange={update}><option value="">Not specified</option>{GENDER_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>Fitness level <span className="profile-optional-label">Optional</span><select name="fitnessLevel" value={form.fitnessLevel} onChange={update}><option value="">Not specified</option>{FITNESS_LEVELS.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>Primary fitness goal <span className="profile-optional-label">Optional</span><select name="goal" value={form.goal} onChange={update}><option value="">Not specified</option>{FITNESS_GOALS.map((option) => <option key={option}>{option}</option>)}</select></label>
          </div>
          <fieldset className="profile-setup-equipment">
            <legend><Dumbbell size={15} /> Available equipment <span className="profile-optional-label">Optional</span></legend>
            <div className="profile-setup-equipment-grid">{AVAILABLE_EQUIPMENT.map(({ id, label }) => {
              const selected = form.equipment.includes(id)
              return <button key={id} className={selected ? 'selected' : ''} type="button" aria-pressed={selected} onClick={() => toggleEquipment(id)}><span>{selected ? <Check size={14} /> : null}</span>{label}</button>
            })}</div>
            <small>Your workout plan will automatically suggest safer equipment-free alternatives when needed.</small>
          </fieldset>
          {(error || profileStorageError) && <p className="profile-save-error" role="alert">{error || 'Unable to save your profile. Check browser storage availability and try again.'}</p>}
          <button className="auth-submit" type="submit">Continue to FitLife</button>
        </form>
        <p className="profile-setup-note">Your information stays in this browser on your FitLife account. All calorie and nutrition results are estimates, not medical advice.</p>
      </section>
    </main>
  )
}
