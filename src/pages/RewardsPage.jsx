import { useEffect, useSyncExternalStore } from 'react'
import { Check, Droplets, Dumbbell, LockKeyhole, Trophy } from 'lucide-react'
import { useAppData } from '../hooks/useAppData.js'
import { useDailyRecord } from '../hooks/useDailyRecord.js'
import {
  HABITS_STORAGE_KEY,
  WATER_STORAGE_KEY,
  createHabitCompletions,
  createWaterIntake,
  isHabitCompletions,
  isWaterIntake,
} from '../data/dailyTrackers.js'
import { formatToday } from '../utils/date.js'
import {
  BADGE_UPDATE_EVENT,
  BADGES,
  REWARDS_STORAGE_KEY,
  getEligibleBadgeIds,
  loadEarnedBadgeIds,
  saveNewlyEarnedBadges,
} from '../utils/progress.js'

const badgeIcons = { check: Check, droplets: Droplets, dumbbell: Dumbbell, trophy: Trophy }

function subscribeToBadgeChanges(onChange) {
  window.addEventListener(BADGE_UPDATE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(BADGE_UPDATE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

function getBadgeSnapshot() {
  try {
    return window.localStorage.getItem(REWARDS_STORAGE_KEY) ?? '[]'
  } catch {
    return '[]'
  }
}

export default function RewardsPage() {
  const { workoutProgress } = useAppData()
  const { data: water } = useDailyRecord(WATER_STORAGE_KEY, createWaterIntake, isWaterIntake)
  const { data: habits } = useDailyRecord(HABITS_STORAGE_KEY, createHabitCompletions, isHabitCompletions)
  const earnedSnapshot = useSyncExternalStore(subscribeToBadgeChanges, getBadgeSnapshot, () => '[]')
  const earnedIds = earnedSnapshot ? loadEarnedBadgeIds() : []
  const eligibleIds = getEligibleBadgeIds({
    workoutProgress,
    waterRecord: { data: water },
    habitRecord: { data: habits },
  })

  useEffect(() => {
    saveNewlyEarnedBadges({
      workoutProgress,
      waterRecord: { data: water },
      habitRecord: { data: habits },
    })
  }, [workoutProgress, water, habits])

  const earnedCount = BADGES.filter(({ id }) => earnedIds.includes(id)).length

  return (
    <div className="page-content rewards-page">
      <header className="progress-page-heading">
        <div><p className="eyebrow">{formatToday({ year: 'numeric' })}</p><h1>Rewards &amp; achievements</h1><p className="workout-page-subtitle">Celebrate milestones earned from your saved activity.</p></div>
        <span className="date-pill"><Trophy size={14} /> {earnedCount} of {BADGES.length} earned</span>
      </header>

      <section className="panel rewards-intro" aria-label="Achievement progress">
        <span className="rewards-intro-icon"><Trophy size={21} /></span>
        <div><strong>Every step counts</strong><p>Badges unlock automatically when your saved workout, hydration or habit records meet the goal.</p></div>
      </section>

      <section className="badge-grid" aria-label="Achievement badges">
        {BADGES.map((badge) => {
          const isEarned = earnedIds.includes(badge.id)
          const isEligible = eligibleIds.includes(badge.id)
          const Icon = badgeIcons[badge.icon]
          return (
            <article className={`panel achievement-card${isEarned ? ' earned' : ' locked'}`} key={badge.id}>
              <div className="achievement-card-top"><span className="achievement-icon"><Icon size={20} /></span><span className={`achievement-status${isEarned ? ' earned' : ''}`}>{isEarned ? <><Check size={12} /> Earned</> : <><LockKeyhole size={11} /> Locked</>}</span></div>
              <h2>{badge.name}</h2>
              <p>{badge.description}</p>
              {isEligible && !isEarned && <span className="achievement-pending">Unlocking from your saved progress…</span>}
            </article>
          )
        })}
      </section>
      <p className="rewards-storage-note">Earned badges stay saved on this device. Existing progress is used; no historical activity is added.</p>
    </div>
  )
}
