import { useMemo, useState } from 'react'
import { Activity, Check, Info, Save, Scale, Target, UserRound } from 'lucide-react'
import { useAppData } from '../hooks/useAppData.js'
import ProfileAvatar from '../components/ProfileAvatar.jsx'
import { calculateBMI, getBMICategory } from '../utils/bmi.js'

const HEIGHT_MIN = 100
const HEIGHT_MAX = 250
const WEIGHT_MIN = 30
const WEIGHT_MAX = 350

function getInputError(value, label, min, max, unit) {
  if (value.trim() === '') return `Enter your ${label.toLowerCase()}.`
  const number = Number(value)
  if (!Number.isFinite(number) || number < min || number > max) {
    return `Use a value from ${min} to ${max} ${unit}.`
  }
  return ''
}

export default function BmiProfilePage() {
  const { profile, updateProfile, profileStorageError } = useAppData()
  const [draft, setDraft] = useState(null)
  const [savedNotice, setSavedNotice] = useState(false)
  const injuryAreas = Array.isArray(profile.injuryAreas) ? profile.injuryAreas : []
  const injuryDescription = typeof profile.injuryDescription === 'string' ? profile.injuryDescription : ''

  const profileChanged = draft && (draft.profileHeight !== profile.height || draft.profileWeight !== profile.weight)
  const height = !draft || profileChanged ? String(profile.height ?? '') : draft.height
  const weight = !draft || profileChanged ? String(profile.weight ?? '') : draft.weight

  const heightError = getInputError(height, 'height', HEIGHT_MIN, HEIGHT_MAX, 'cm')
  const weightError = getInputError(weight, 'weight', WEIGHT_MIN, WEIGHT_MAX, 'kg')
  const bmi = useMemo(() => heightError || weightError ? null : calculateBMI(height, weight), [height, heightError, weight, weightError])
  const category = getBMICategory(bmi)
  const isDirty = (height === '' ? profile.height !== null : Number(height) !== profile.height)
    || (weight === '' ? profile.weight !== null : Number(weight) !== profile.weight)
  const markerPosition = bmi === null ? null : Math.max(0, Math.min(100, ((bmi - 15) / 25) * 100))

  const updateMeasurements = () => {
    updateProfile({ ...profile, height: Number(height), weight: Number(weight) })
    setDraft(null)
    setSavedNotice(true)
  }

  const handleMeasurementChange = (field) => (event) => {
    const value = event.target.value
    setDraft((current) => {
      const currentMatchesProfile = current && current.profileHeight === profile.height && current.profileWeight === profile.weight
      return {
        profileHeight: profile.height,
        profileWeight: profile.weight,
        height: field === 'height' ? value : currentMatchesProfile ? current.height : String(profile.height ?? ''),
        weight: field === 'weight' ? value : currentMatchesProfile ? current.weight : String(profile.weight ?? ''),
      }
    })
    setSavedNotice(false)
  }

  return (
    <div className="page-content bmi-page">
      <header className="bmi-page-heading">
        <div>
          <p className="eyebrow">Your personal snapshot</p>
          <h1>BMI &amp; fitness profile</h1>
          <p className="bmi-page-subtitle">A simple view of your measurements and fitness preferences.</p>
        </div>
        <span className="bmi-heading-mark" aria-hidden="true"><Activity size={19} /></span>
      </header>

      <div className="bmi-page-grid">
        <section className="panel bmi-calculator-panel" aria-labelledby="bmi-calculator-title">
          <div className="bmi-section-heading">
            <span className="bmi-section-icon"><Scale size={17} /></span>
            <div><h2 id="bmi-calculator-title">BMI calculator</h2><p>Update your measurements to see your current estimate.</p></div>
          </div>

          <div className="bmi-input-grid">
            <label className="bmi-field" htmlFor="bmi-height">Height
              <span className="bmi-input-wrap"><input id="bmi-height" type="number" inputMode="decimal" min={HEIGHT_MIN} max={HEIGHT_MAX} step="0.1" required value={height} onChange={handleMeasurementChange('height')} aria-invalid={Boolean(heightError)} aria-describedby="bmi-height-hint bmi-height-error" /><span>cm</span></span>
              <small id="bmi-height-hint">From {HEIGHT_MIN} to {HEIGHT_MAX} cm</small>
              {heightError && <small className="bmi-field-error" id="bmi-height-error" role="alert">{heightError}</small>}
            </label>
            <label className="bmi-field" htmlFor="bmi-weight">Weight
              <span className="bmi-input-wrap"><input id="bmi-weight" type="number" inputMode="decimal" min={WEIGHT_MIN} max={WEIGHT_MAX} step="0.1" required value={weight} onChange={handleMeasurementChange('weight')} aria-invalid={Boolean(weightError)} aria-describedby="bmi-weight-hint bmi-weight-error" /><span>kg</span></span>
              <small id="bmi-weight-hint">From {WEIGHT_MIN} to {WEIGHT_MAX} kg</small>
              {weightError && <small className="bmi-field-error" id="bmi-weight-error" role="alert">{weightError}</small>}
            </label>
          </div>

          <div className={`bmi-result${category ? ` ${category.key}` : ''}`} aria-live="polite">
            <div><span className="bmi-result-label">Your BMI</span><strong>{bmi === null ? '—' : bmi.toFixed(1)}</strong></div>
            <span className="bmi-category-badge">{category?.label ?? 'Add valid measurements'}</span>
          </div>

          <div className="bmi-range-block">
            <div className="bmi-range-heading"><strong>BMI range</strong><span>General adult reference</span></div>
            <div className="bmi-range-visual" role="img" aria-label={category ? `BMI ${bmi.toFixed(1)}, ${category.label}` : 'BMI range indicator; enter valid measurements to show your position'}>
              {markerPosition !== null && <span className="bmi-range-marker" style={{ left: `${markerPosition}%` }} />}
              <span className="bmi-range-segment underweight" />
              <span className="bmi-range-segment normal" />
              <span className="bmi-range-segment overweight" />
              <span className="bmi-range-segment obese" />
            </div>
            <div className="bmi-range-labels"><span>&lt;18.5</span><span>18.5–24.9</span><span>25–29.9</span><span>30+</span></div>
            <div className="bmi-range-legend"><span><i className="underweight" />Underweight</span><span><i className="normal" />Normal</span><span><i className="overweight" />Overweight</span><span><i className="obese" />Obese</span></div>
          </div>

          <div className="bmi-save-row">
            <p>{savedNotice ? <><Check size={14} /> Measurements saved to your profile.</> : isDirty ? 'Your changes are only used for this calculation until saved.' : profile.height === null || profile.weight === null ? 'Add valid measurements to calculate BMI.' : 'Using the height and weight saved in your profile.'}</p>
            {profileStorageError && <span className="bmi-field-error" role="alert">Unable to save your profile. Check browser storage availability and try again.</span>}
            <button type="button" className="bmi-save-button" onClick={updateMeasurements} disabled={!isDirty || Boolean(heightError || weightError)}><Save size={14} /> Update saved profile</button>
          </div>
          <p className="bmi-disclaimer"><Info size={13} /> BMI is a general screening measure and does not account for every individual factor. It is not a medical diagnosis.</p>
        </section>

        <aside className="panel fitness-profile-panel" aria-labelledby="fitness-profile-title">
          <div className="bmi-section-heading">
            <span className="bmi-section-icon"><UserRound size={17} /></span>
            <div><h2 id="fitness-profile-title">Fitness profile</h2><p>Your preferences, at a glance.</p></div>
          </div>
          <div className="fitness-profile-identity">
            <ProfileAvatar avatar={profile.avatar} size={48} />
            <div><small>Profile</small><strong>{profile.name}</strong></div>
          </div>
          <div className="fitness-profile-item">
            <span className="fitness-profile-icon"><UserRound size={16} /></span>
            <div><small>Age and gender</small><strong>{profile.age ?? 'Not provided'}{profile.age !== null ? ' years' : ''} · {profile.gender || 'Not provided'}</strong></div>
          </div>
          <div className="fitness-profile-item">
            <span className="fitness-profile-icon"><Target size={16} /></span>
            <div><small>Fitness goal</small><strong>{profile.goal || 'Not provided'}</strong></div>
          </div>
          <div className="fitness-profile-item">
            <span className="fitness-profile-icon"><Activity size={16} /></span>
            <div><small>Fitness experience</small><strong>{profile.fitnessLevel || 'Not provided'}</strong></div>
          </div>
          <div className="fitness-profile-item">
            <span className="fitness-profile-icon"><Activity size={16} /></span>
            <div><small>Diet preference</small><strong>{profile.dietPreference || 'Not provided'}</strong></div>
          </div>
          <div className="fitness-profile-item">
            <span className="fitness-profile-icon"><Activity size={16} /></span>
            <div><small>Smoking status</small><strong>{profile.smokingStatus || 'Not provided'}</strong></div>
          </div>
          <div className="fitness-profile-item">
            <span className="fitness-profile-icon"><Activity size={16} /></span>
            <div><small>Smartwatch available</small><strong>{profile.smartwatchAvailability || 'Not provided'}</strong></div>
          </div>
          {(injuryAreas.length > 0 || injuryDescription) && <div className="fitness-profile-item fitness-profile-limitations"><div><small>Injuries or physical limitations</small><strong>{injuryAreas.join(', ') || 'Not specified'}{injuryDescription ? ` · ${injuryDescription}` : ''}</strong></div></div>}
          <p className="fitness-profile-hint">To update your details or avatar, use Edit profile in the navigation.</p>
        </aside>
      </div>
    </div>
  )
}