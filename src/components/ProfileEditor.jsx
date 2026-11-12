import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { FITNESS_GOALS, FITNESS_LEVELS } from '../data/profile.js'

export default function ProfileEditor({ profile, onSave, onClose }) {
  const dialogRef = useRef(null)
  const [form, setForm] = useState(() => ({
    name: profile.name,
    age: String(profile.age),
    height: String(profile.height),
    weight: String(profile.weight),
    goal: profile.goal,
    fitnessLevel: profile.fitnessLevel,
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
      age: Number(form.age),
      height: Number(form.height),
      weight: Number(form.weight),
      goal: form.goal,
      fitnessLevel: form.fitnessLevel,
    })
  }

  return (
    <div className="profile-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section ref={dialogRef} className="profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-title" onKeyDown={containFocus}>
        <div className="profile-dialog-heading">
          <div><p className="eyebrow">Make it yours</p><h2 id="profile-title">Edit your profile</h2><p>Your details help personalize your FitLife space.</p></div>
          <button className="icon-button" type="button" aria-label="Close profile editor" onClick={onClose}><X size={17} /></button>
        </div>
        <form className="profile-form" onSubmit={handleSubmit}>
          <label className="profile-field profile-field-wide">Name
            <input autoFocus autoComplete="name" name="name" type="text" value={form.name} onChange={updateField} required minLength={2} maxLength={60} placeholder="Your name" />
          </label>
          <label className="profile-field">Age
            <span className="input-with-unit"><input name="age" type="number" value={form.age} onChange={updateField} required min="13" max="120" step="1" /><span>years</span></span>
          </label>
          <label className="profile-field">Height
            <span className="input-with-unit"><input name="height" type="number" value={form.height} onChange={updateField} required min="100" max="250" step="0.1" /><span>cm</span></span>
          </label>
          <label className="profile-field">Weight
            <span className="input-with-unit"><input name="weight" type="number" value={form.weight} onChange={updateField} required min="30" max="350" step="0.1" /><span>kg</span></span>
          </label>
          <label className="profile-field profile-field-wide">Fitness goal
            <select name="goal" value={form.goal} onChange={updateField} required>
              {!FITNESS_GOALS.includes(form.goal) && <option value={form.goal}>{form.goal}</option>}
              {FITNESS_GOALS.map((goal) => <option key={goal} value={goal}>{goal}</option>)}
            </select>
          </label>
          <label className="profile-field profile-field-wide">Fitness level
            <select name="fitnessLevel" value={form.fitnessLevel} onChange={updateField} required>
              {FITNESS_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </label>
          <div className="profile-form-actions profile-field-wide">
            <button className="profile-cancel" type="button" onClick={onClose}>Cancel</button>
            <button className="profile-save" type="submit">Save profile</button>
          </div>
        </form>
      </section>
    </div>
  )
}