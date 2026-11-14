import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import {
  AVATAR_OPTIONS,
  DIET_PREFERENCES,
  FITNESS_GOALS,
  FITNESS_LEVELS,
  GENDER_OPTIONS,
  SMARTWATCH_OPTIONS,
  SMOKING_STATUSES,
} from '../data/profile.js'
import ProfileAvatar from './ProfileAvatar.jsx'

export default function ProfileEditor({ profile, onSave, onClose, saveError = false }) {
  const dialogRef = useRef(null)
  const [form, setForm] = useState(() => ({
    name: profile.name,
    age: profile.age == null ? '' : String(profile.age),
    height: profile.height == null ? '' : String(profile.height),
    weight: profile.weight == null ? '' : String(profile.weight),
    gender: profile.gender,
    goal: profile.goal,
    fitnessLevel: profile.fitnessLevel,
    dietPreference: profile.dietPreference,
    smokingStatus: profile.smokingStatus,
    smartwatchAvailability: profile.smartwatchAvailability,
    injuries: profile.injuries,
    avatar: profile.avatar,
  }))

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const containFocus = (event) => {
    if (event.key !== 'Tab') return
    const focusable = dialogRef.current?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')
    if (!focusable?.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const focusIsOutside = !dialogRef.current.contains(document.activeElement)

    if (event.shiftKey && (document.activeElement === first || focusIsOutside)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (document.activeElement === last || focusIsOutside)) {
      event.preventDefault()
      first.focus()
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSave({
      name: form.name.trim(),
      age: form.age === '' ? null : Number(form.age),
      height: form.height === '' ? null : Number(form.height),
      weight: form.weight === '' ? null : Number(form.weight),
      gender: form.gender,
      goal: form.goal,
      fitnessLevel: form.fitnessLevel,
      dietPreference: form.dietPreference,
      smokingStatus: form.smokingStatus,
      smartwatchAvailability: form.smartwatchAvailability,
      injuries: form.injuries.trim(),
      avatar: form.avatar,
    })
  }

  return (
    <div className="profile-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section ref={dialogRef} className="profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-title" onKeyDown={containFocus}>
        <div className="profile-dialog-heading">
          <div><p className="eyebrow">Make it yours</p><h2 id="profile-title">Edit your profile</h2><p>Your details help personalize your FitLife space.</p><p className="profile-privacy-note">Optional health details stay in this browser on this account. Share only what you’re comfortable recording.</p></div>
          <button className="icon-button" type="button" aria-label="Close profile editor" onClick={onClose}><X size={17} /></button>
        </div>
        <form className="profile-form" onSubmit={handleSubmit}>
          <h3 className="profile-section-heading profile-field-wide">Personal details</h3>
          <label className="profile-field profile-field-wide">Name
            <input autoFocus autoComplete="name" name="name" type="text" value={form.name} onChange={updateField} required minLength={2} maxLength={60} placeholder="Your name" />
          </label>
          <label className="profile-field"><span className="profile-label-row">Age <span className="profile-optional-label">Optional</span></span>
            <span className="input-with-unit"><input name="age" type="number" inputMode="numeric" value={form.age} onChange={updateField} min="13" max="120" step="1" /><span>years</span></span>
          </label>
          <label className="profile-field"><span className="profile-label-row">Gender <span className="profile-optional-label">Optional</span></span>
            <select name="gender" value={form.gender} onChange={updateField}>
              <option value="">Not specified</option>
              {GENDER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <fieldset className="profile-avatar-field profile-field-wide">
            <legend>Profile avatar <span className="profile-optional-label">Optional</span></legend>
            <div className="profile-avatar-options" role="group" aria-label="Choose a profile avatar">
              <button className={`profile-avatar-option${form.avatar === '' ? ' selected' : ''}`} type="button" aria-pressed={form.avatar === ''} onClick={() => setForm((current) => ({ ...current, avatar: '' }))}>
                <ProfileAvatar avatar="" size={44} />
                <span>Default</span>
              </button>
              {AVATAR_OPTIONS.map(({ id, label }) => (
                <button className={`profile-avatar-option${form.avatar === id ? ' selected' : ''}`} key={id} type="button" aria-label={label} aria-pressed={form.avatar === id} onClick={() => setForm((current) => ({ ...current, avatar: id }))}>
                  <ProfileAvatar avatar={id} size={44} />
                  <span>{label.replace(' avatar', '')}</span>
                </button>
              ))}
            </div>
            <small className="profile-field-hint">Your avatar is independent of your gender selection.</small>
          </fieldset>

          <h3 className="profile-section-heading profile-field-wide">Body measurements</h3>
          <label className="profile-field"><span className="profile-label-row">Height <span className="profile-optional-label">Optional</span></span>
            <span className="input-with-unit"><input name="height" type="number" inputMode="decimal" value={form.height} onChange={updateField} min="100" max="250" step="0.1" /><span>cm</span></span>
          </label>
          <label className="profile-field"><span className="profile-label-row">Weight <span className="profile-optional-label">Optional</span></span>
            <span className="input-with-unit"><input name="weight" type="number" inputMode="decimal" value={form.weight} onChange={updateField} min="30" max="350" step="0.1" /><span>kg</span></span>
          </label>

          <h3 className="profile-section-heading profile-field-wide">Fitness and nutrition</h3>
          <label className="profile-field"><span className="profile-label-row">Fitness goal <span className="profile-optional-label">Optional</span></span>
            <select name="goal" value={form.goal} onChange={updateField}>
              <option value="">Not specified</option>
              {!FITNESS_GOALS.includes(form.goal) && form.goal && <option value={form.goal}>{form.goal}</option>}
              {FITNESS_GOALS.map((goal) => <option key={goal} value={goal}>{goal}</option>)}
            </select>
          </label>
          <label className="profile-field"><span className="profile-label-row">Fitness experience <span className="profile-optional-label">Optional</span></span>
            <select name="fitnessLevel" value={form.fitnessLevel} onChange={updateField}>
              <option value="">Not specified</option>
              {FITNESS_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </label>
          <label className="profile-field"><span className="profile-label-row">Diet preference <span className="profile-optional-label">Optional</span></span>
            <select name="dietPreference" value={form.dietPreference} onChange={updateField}>
              <option value="">Not specified</option>
              {DIET_PREFERENCES.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <h3 className="profile-section-heading profile-field-wide">Lifestyle, health, and devices</h3>
          <label className="profile-field"><span className="profile-label-row">Smoking status <span className="profile-optional-label">Optional</span></span>
            <select name="smokingStatus" value={form.smokingStatus} onChange={updateField}>
              <option value="">Not specified</option>
              {SMOKING_STATUSES.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="profile-field"><span className="profile-label-row">Smartwatch available? <span className="profile-optional-label">Optional</span></span>
            <select name="smartwatchAvailability" value={form.smartwatchAvailability} onChange={updateField}>
              <option value="">Not specified</option>
              {SMARTWATCH_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="profile-field profile-field-wide"><span className="profile-label-row">Injuries or physical limitations <span className="profile-optional-label">Optional</span></span>
            <textarea name="injuries" value={form.injuries} onChange={updateField} maxLength={300} rows={3} placeholder="Share only what you’re comfortable recording." />
          </label>
          {saveError && <p className="profile-save-error profile-field-wide" role="alert">Unable to save your profile. Check browser storage availability and try again.</p>}
          <div className="profile-form-actions profile-field-wide">
            <button className="profile-cancel" type="button" onClick={onClose}>Cancel</button>
            <button className="profile-save" type="submit">Save profile</button>
          </div>
        </form>
      </section>
    </div>
  )
}