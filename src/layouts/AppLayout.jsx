import { Activity, Bell, CalendarDays, ChartNoAxesCombined, CreditCard, Droplets, Dumbbell, Flame, House, Leaf, LogOut, Moon, Pencil, Scale, Sun, Trophy } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData.js'
import { useAuth } from '../hooks/useAuth.js'
import ProfileAvatar from '../components/ProfileAvatar.jsx'
import ProfileEditor from '../components/ProfileEditor.jsx'
import { formatToday } from '../utils/date.js'
import { readLocalJson, writeLocalJson } from '../utils/localStorage.js'
import { useMembership } from '../hooks/useMembership.js'

const THEME_STORAGE_KEY = 'fitlife.theme'

const navigation = [
  { label: 'Overview', path: '/', icon: House },
  { label: 'Workouts', path: '/workouts', icon: Dumbbell },
  { label: 'Calories', path: '/calories', icon: Flame },
  { label: 'Nutrition', path: '/nutrition', icon: Leaf },
  { label: 'BMI & profile', path: '/bmi-profile', icon: Scale },
  { label: 'Progress', path: '/progress', icon: ChartNoAxesCombined },
  { label: 'Water & habits', path: '/habits', icon: Droplets },
  { label: 'Rewards', path: '/rewards', icon: Trophy },
  { label: 'Membership', path: '/membership', icon: CreditCard },
]

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
  const [profileSaveError, setProfileSaveError] = useState(false)
  const [, refreshCalendarDate] = useState(0)
  const profileTriggerRef = useRef(null)
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    writeLocalJson(THEME_STORAGE_KEY, theme)
  }, [theme])

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

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <NavLink className="brand" to="/" aria-label="FitLife overview"><BrandMark /><span className="brand-name">fit<span>life</span></span></NavLink>
        <p className="nav-section-label">Your space</p>
        <nav className="side-nav">
          {navigation.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><Icon size={17} strokeWidth={1.8} /><span>{label}</span></NavLink>)}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-tip"><div className="tip-icon"><Flame size={16} /></div><strong>Keep your rhythm</strong><p>Consistency is built one small choice at a time.</p></div>
        <div className="user-mini"><ProfileAvatar avatar={profile.avatar} size={34} className="user-avatar" /><span className="user-mini-copy"><strong>{profile.name}</strong><small>{membership.plan} membership</small></span><button className="profile-edit-button" type="button" aria-label="Edit profile" title="Edit profile" onClick={openProfileEditor}><Pencil size={14} /></button></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <NavLink className="mobile-brand" to="/" aria-label="FitLife overview"><BrandMark />fitlife</NavLink>
          <div className="breadcrumb">Workspace <span aria-hidden="true"> / </span> <strong>{currentTitle(pathname)}</strong></div>
          <div className="topbar-actions"><span className="date-label"><CalendarDays size={14} /> {formatToday()}</span><button className="icon-button theme-toggle" type="button" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} aria-pressed={theme === 'dark'} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}</button><span className="icon-button" aria-hidden="true"><Bell size={16} /></span><button className="icon-button profile-topbar-button" type="button" aria-label="Edit profile" title="Edit profile" onClick={openProfileEditor}><Pencil size={15} /></button><button className="logout-button" type="button" onClick={handleLogout}><LogOut size={15} /><span>Log out</span></button></div>
        </header>
        <Outlet />
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={18} strokeWidth={1.8} /><span>{label === 'Water & habits' ? 'Habits' : label === 'BMI & profile' ? 'BMI' : label === 'Membership' ? 'Plan' : label}</span></NavLink>)}
      </nav>
      {isProfileEditorOpen && <ProfileEditor profile={profile} onSave={saveProfile} onClose={closeProfileEditor} saveError={profileSaveError || profileStorageError} />}
    </div>
  )
}