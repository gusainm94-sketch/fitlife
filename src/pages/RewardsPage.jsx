import { useEffect, useSyncExternalStore } from 'react'
import { CalendarDays, ChartNoAxesCombined, Check, Droplets, Dumbbell, Flame, Leaf, LockKeyhole, Star, Target, Trophy, UserRound, Utensils } from 'lucide-react'
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
import { DIET_CHARTS_STORAGE_KEY, normalizeDietCharts } from '../data/dietPlanning.js'
import { FOOD_INTAKE_STORAGE_KEY, normalizeFoodIntake } from '../data/foodIntake.js'
import { PROFILE_STORAGE_KEY } from '../data/profile.js'
import { getDailyHistoryStorageKey } from '../utils/dailyRecords.js'
import { formatToday } from '../utils/date.js'
import { getAccountStorageKey, readLocalJson, readLocalJsonEntries } from '../utils/localStorage.js'
import {
  BADGE_UPDATE_EVENT,
  BADGES,
  REWARDS_STORAGE_KEY,
  buildDailyProgressRecords,
  getAchievementContext,
  getAchievementProgress,
  getEligibleBadgeIds,
  loadAchievementDetails,
  loadEarnedBadgeIds,
  saveNewlyEarnedBadges,
  VISITED_SECTIONS_STORAGE_KEY,
} from '../utils/progress.js'

const badgeIcons = { check: Check, droplets: Droplets, dumbbell: Dumbbell, trophy: Trophy, flame: Flame, calendar: CalendarDays, leaf: Leaf, utensils: Utensils, chart: ChartNoAxesCombined, user: UserRound, target: Target, star: Star }

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
    return window.localStorage.getItem(getAccountStorageKey(REWARDS_STORAGE_KEY)) ?? '[]'
  } catch {
    return '[]'
  }
}

export default function RewardsPage() {
  const { profile, workoutProgress } = useAppData()
  const { data: water } = useDailyRecord(WATER_STORAGE_KEY, createWaterIntake, isWaterIntake)
  const { data: habits } = useDailyRecord(HABITS_STORAGE_KEY, createHabitCompletions, isHabitCompletions)
  const earnedSnapshot = useSyncExternalStore(subscribeToBadgeChanges, getBadgeSnapshot, () => '[]')
  const earnedIds = earnedSnapshot ? loadEarnedBadgeIds() : []
  const waterHistory = readLocalJson(getDailyHistoryStorageKey(WATER_STORAGE_KEY), {})
  const habitHistory = readLocalJson(getDailyHistoryStorageKey(HABITS_STORAGE_KEY), {})
  const foodIntake = normalizeFoodIntake(readLocalJson(FOOD_INTAKE_STORAGE_KEY, []))
  const dietCharts = normalizeDietCharts(readLocalJson(DIET_CHARTS_STORAGE_KEY, []))
  const visitedSections = readLocalJson(VISITED_SECTIONS_STORAGE_KEY, [])
  const progressRecords = buildDailyProgressRecords({ waterHistory, habitHistory, mealHistory: readLocalJsonEntries('fitlife-diet-plan-'), foodIntakeHistory: foodIntake, workoutProgress })
  const achievementContext = {
    workoutProgress,
    waterRecord: { data: water },
    habitRecord: { data: habits },
    waterHistory,
    habitHistory,
    foodIntake,
    dietCharts,
    profile,
    profileSaved: Boolean(readLocalJson(PROFILE_STORAGE_KEY, null)),
    visitedSections,
    progressRecords,
  }
  const legacyEligibleIds = getEligibleBadgeIds(achievementContext)
  const fullEligibleIds = getAchievementContext(achievementContext).eligibleIds
  const eligibleIds = [...new Set([...legacyEligibleIds, ...fullEligibleIds])]
  const progressById = getAchievementProgress(achievementContext)
  const detailsById = new Map(loadAchievementDetails().map((record) => [record.id, record]))

  useEffect(() => {
    saveNewlyEarnedBadges({
      workoutProgress,
      waterRecord: { data: water },
      habitRecord: { data: habits },
      waterHistory,
      habitHistory,
      foodIntake,
      dietCharts,
      profile,
      profileSaved: Boolean(readLocalJson(PROFILE_STORAGE_KEY, null)),
      visitedSections,
      progressRecords,
    })
  }, [workoutProgress, water, habits, waterHistory, habitHistory, foodIntake, dietCharts, profile, visitedSections, progressRecords])

  const visibleBadges = BADGES.filter((badge) => !badge.legacy || earnedIds.includes(badge.id))
  const earnedCount = visibleBadges.filter(({ id }) => earnedIds.includes(id)).length

  return (
    <div className="page-content rewards-page">
      <header className="progress-page-heading">
        <div><p className="eyebrow">{formatToday({ year: 'numeric' })}</p><h1>Rewards &amp; achievements</h1><p className="workout-page-subtitle">Celebrate milestones earned from your saved activity.</p></div>
        <span className="date-pill"><Trophy size={14} /> {earnedCount} of {visibleBadges.length} earned</span>
      </header>
      <section className="panel rewards-intro" aria-label="Achievement progress">
        <span className="rewards-intro-icon"><Trophy size={21} /></span>
        <div><strong>Every step counts</strong><p>Achievements unlock only from saved activity. Locked cards show honest progress toward the condition.</p></div>
      </section>
      <section className="badge-grid" aria-label="Achievement badges">
        {visibleBadges.map((badge) => {
          const isEarned = earnedIds.includes(badge.id)
          const isEligible = eligibleIds.includes(badge.id)
          const Icon = badgeIcons[badge.icon] ?? Trophy
          const progress = progressById[badge.id]
          const unlockDate = detailsById.get(badge.id)?.unlockedAt
          return (
            <article className={`panel achievement-card${isEarned ? ' earned' : ' locked'}`} key={badge.id}>
              <div className="achievement-card-top"><span className="achievement-icon"><Icon size={20} /></span><span className={`achievement-status${isEarned ? ' earned' : ''}`}>{isEarned ? <><Check size={12} /> Earned</> : <><LockKeyhole size={11} /> Locked</>}</span></div>
              <h2>{badge.name}</h2>
              <p>{badge.description}</p>
              {isEarned ? <span className="achievement-date">{unlockDate ? `Unlocked ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(unlockDate))}` : 'Unlocked earlier · date not recorded'}</span> : progress && <span className="achievement-progress" role="status">{Math.min(progress.current, progress.target)} / {progress.target} {progress.label}</span>}
              {isEligible && !isEarned && <span className="achievement-pending">Ready to unlock from saved progress</span>}
            </article>
          )
        })}
      </section>
      <p className="rewards-storage-note">Earned achievements stay saved to this account on this device. Existing activity is used; no history is invented or added.</p>
    </div>
  )
}
