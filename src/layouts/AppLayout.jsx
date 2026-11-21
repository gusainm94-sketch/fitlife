import { Activity, Bell, CalendarDays, ChartNoAxesCombined, CircleUserRound, Calculator, Droplets, Dumbbell, Flame, House, LogOut, MoreHorizontal, Moon, Sun, Watch, X } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData.js'
import { useAuth } from '../hooks/useAuth.js'
import ProfileAvatar from '../components/ProfileAvatar.jsx'
import ProfileEditor from '../components/ProfileEditor.jsx'
import { formatToday } from '../utils/date.js'
import { readLocalJson, writeLocalJson } from '../utils/localStorage.js'
import { useMembership } from '../hooks/useMembership.js'
import { VISITED_SECTIONS_STORAGE_KEY } from '../utils/progress.js'

const THEME_STORAGE_KEY = 'fitlife.theme'

const navigationGroups = [
  {
    label: 'Start',
    items: [
      { label: 'Overview', path: '/', icon: House },
      { label: 'Workouts', path: '/workouts', icon: Dumbbell },
    ],
  },
  {
    label: 'Nourish',
    items: [
      { label: 'Nutrition Calculator', path: '/nutrition-calculator', icon: Calculator },
    ],
  },
  {
    label: 'Track',
    items: [
      { label: 'Calories', path: '/calories', icon: Flame },
      { label: 'Fitness tracker', path: '/fitness-tracker', icon: Watch },
      { label: 'Progress', path: '/progress', icon: ChartNoAxesCombined },
      { label: 'Water Intake', path: '/habits', icon: Droplets },
    ],
  },
  {
    label: 'More',
    items: [
      { label: 'BMI & profile', path: '/bmi-profile', icon: CircleUserRound },
    ],
  },
]

const navigation = navigationGroups.flatMap(({ items }) => items)
const primaryNavigation = [
  navigationGroups[0].items[0],
  navigationGroups[0].items[1],
  navigationGroups[1].items[0],
  navigationGroups[2].items[2],
]
const moreNavigation = navigation.filter(({ path }) => !primaryNavigation.some((item) => item.path === path))

const currentTitle = (pathname) => navigation.find((item) => item.path === pathname)?.label ?? 'Overview'

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><Activity size={19} strokeWidth={2.2} /></span>
}

export default function AppLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { profile, updateProfile, profileStorageError } = useAppData()
  const { membership } = useMembership()
  const [theme, setTheme] = useState(() => readLocalJson(THEME_STORAGE_KEY, 'light') === 'dark' ? 'dark' : 'light')
  const [isProfileEditorOpen, setProfileEditorOpen] = useState(false)
  const [isMobileMoreOpen, setMobileMoreOpen] = useState(false)
  const [profileSaveError, setProfileSaveError] = useState(false)
  const [, refreshCalendarDate] = useState(0)
  const profileTriggerRef = useRef(null)
  const mobileMoreTriggerRef = useRef(null)
  const mobileMorePanelRef = useRef(null)
  const mobileMoreWasOpenRef = useRef(false)
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    writeLocalJson(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    const visited = readLocalJson(VISITED_SECTIONS_STORAGE_KEY, [])
    if (!Array.isArray(visited) || visited.includes(pathname)) return
    writeLocalJson(VISITED_SECTIONS_STORAGE_KEY, [...visited, pathname])
  }, [pathname])

  useEffect(() => {
    const refresh = () => refreshCalendarDate((current) => current + 1)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('pageshow', refresh)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('pageshow', refresh)
    }
  }, [])
  useEffect(() => {
    if (!isMobileMoreOpen) {
      if (mobileMoreWasOpenRef.current) {
        mobileMoreTriggerRef.current?.focus()
        mobileMoreWasOpenRef.current = false
      }
      return undefined
    }
    mobileMoreWasOpenRef.current = true
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileMoreOpen(false)
      }
    }
    const focusFirstControl = window.requestAnimationFrame(() => mobileMorePanelRef.current?.querySelector('a, button')?.focus())
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.cancelAnimationFrame(focusFirstControl)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isMobileMoreOpen])
  const openProfileEditor = useCallback((event) => {
    profileTriggerRef.current = event.currentTarget
    setProfileSaveError(false)
    setProfileEditorOpen(true)
  }, [])
  const closeProfileEditor = useCallback(() => {
    setProfileEditorOpen(false)
    window.requestAnimationFrame(() => profileTriggerRef.current?.focus())
  }, [])
  const saveProfile = useCallback((nextProfile) => {
    if (!updateProfile(nextProfile)) {
      setProfileSaveError(true)
      return
    }
    closeProfileEditor()
  }, [closeProfileEditor, updateProfile])
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const renderNavLink = ({ label, path, icon: Icon }, onNavigate) => (
    <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={onNavigate}>
      <Icon size={17} strokeWidth={1.8} />
      <span>{label}</span>
    </NavLink>
  )

  const renderMobileNavLink = ({ label, path, icon: Icon }, onNavigate) => (
    <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => isActive ? 'active' : ''} onClick={onNavigate}>
      <Icon size={18} strokeWidth={1.8} />
      <span>{label === 'Water & habits' ? 'Habits' : label === 'BMI & profile' ? 'Profile' : label === 'Fitness tracker' ? 'Tracker' : label}</span>
    </NavLink>
  )

  const closeMobileMore = () => {
    setMobileMoreOpen(false)
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className="sidebar" aria-label="Main navigation">
        <NavLink className="brand" to="/" aria-label="FitLife overview"><BrandMark /><span className="brand-name">fit<span>life</span></span></NavLink>
        <nav className="side-nav">
          {navigationGroups.map(({ label, items }) => <section className="nav-group" key={label} aria-labelledby={`nav-group-${label.toLowerCase()}`}>
            <p className="nav-group-label" id={`nav-group-${label.toLowerCase()}`}>{label}</p>
            <div className="nav-group-links">{items.map((item) => renderNavLink(item))}</div>
          </section>)}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-tip"><div className="tip-icon"><Flame size={16} /></div><strong>Keep your rhythm</strong><p>Consistency is built one small choice at a time.</p></div>
        <div className="user-mini"><ProfileAvatar avatar={profile.avatar} size={34} className="user-avatar" /><span className="user-mini-copy"><strong>{profile.name}</strong><small>{membership.plan} membership</small></span><button className="profile-edit-button" type="button" aria-label="Edit profile" title="Edit profile" onClick={openProfileEditor}><CircleUserRound size={15} /></button></div>
      </aside>

      <main id="main-content" className="main-area">
        <header className="topbar">
          <NavLink className="mobile-brand" to="/" aria-label="FitLife overview"><BrandMark />fitlife</NavLink>
          <div className="breadcrumb">Workspace <span aria-hidden="true"> / </span> <strong>{currentTitle(pathname)}</strong></div>
          <div className="topbar-actions"><span className="date-label"><CalendarDays size={14} /> {formatToday()}</span><button className="icon-button theme-toggle" type="button" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} aria-pressed={theme === 'dark'} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}</button><span className="icon-status" aria-label="Notifications" title="Notifications are not available in this demo"><Bell size={16} /></span><button className="icon-button profile-topbar-button" type="button" aria-label="Edit profile" title="Edit profile" onClick={openProfileEditor}><CircleUserRound size={16} /></button><button className="logout-button" type="button" onClick={handleLogout}><LogOut size={15} /><span>Log out</span></button></div>
        </header>
        <Outlet />
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {primaryNavigation.map((item) => renderMobileNavLink(item, closeMobileMore))}
        <button ref={mobileMoreTriggerRef} className={`mobile-more-trigger${moreNavigation.some(({ path }) => path === pathname) ? ' active' : ''}`} type="button" aria-expanded={isMobileMoreOpen} aria-controls="mobile-more-menu" onClick={() => setMobileMoreOpen((current) => !current)}>
          <MoreHorizontal size={18} strokeWidth={1.8} />
          <span>More</span>
        </button>
      </nav>
      {isMobileMoreOpen && <div className="mobile-more-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeMobileMore() }}>
        <section ref={mobileMorePanelRef} id="mobile-more-menu" className="mobile-more-panel" role="dialog" aria-modal="true" aria-labelledby="mobile-more-title">
          <div className="mobile-more-heading"><div><p className="eyebrow">Explore FitLife</p><h2 id="mobile-more-title">More tools</h2></div><button className="icon-button" type="button" aria-label="Close more tools" onClick={closeMobileMore}><X size={17} /></button></div>
          <nav className="mobile-more-links" aria-label="More FitLife tools">{moreNavigation.map((item) => renderMobileNavLink(item, closeMobileMore))}</nav>
        </section>
      </div>}
      {isProfileEditorOpen && <ProfileEditor profile={profile} onSave={saveProfile} onClose={closeProfileEditor} saveError={profileSaveError || profileStorageError} />}
    </div>
  )
}
