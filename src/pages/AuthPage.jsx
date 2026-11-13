import { useEffect, useState } from 'react'
import { Activity, Moon, Sun } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { readLocalJson, writeLocalJson } from '../utils/localStorage.js'

const THEME_STORAGE_KEY = 'fitlife.theme'

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup'
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [theme, setTheme] = useState(() => readLocalJson(THEME_STORAGE_KEY, 'light') === 'dark' ? 'dark' : 'light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const result = isSignup
      ? await register({ name, email, password })
      : await login({ email, password })
    if (result.error) {
      setError(result.error)
      return
    }

    const destination = location.state?.from?.pathname ?? '/'
    navigate(destination, { replace: true })
  }

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    writeLocalJson(THEME_STORAGE_KEY, next)
    setTheme(next)
  }

  return (
    <main className="auth-page">
      <header className="auth-topbar">
        <Link className="auth-brand" to={isSignup ? '/signup' : '/login'} aria-label="FitLife">
          <span className="brand-mark"><Activity size={19} strokeWidth={2.2} /></span>
          <span className="brand-name">fit<span>life</span></span>
        </Link>
        <button className="icon-button theme-toggle" type="button" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} aria-pressed={theme === 'dark'} onClick={toggleTheme}>
          {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </header>
      <section className="auth-content">
        <div className="auth-card">
          <div className="auth-card-mark"><Activity size={21} /></div>
          <p className="eyebrow">{isSignup ? 'Start your wellness journey' : 'Welcome back'}</p>
          <h1>{isSignup ? 'Create your account' : 'Log in to FitLife'}</h1>
          <p className="auth-subtitle">{isSignup ? 'Your fitness progress, all in one place.' : 'Pick up right where you left off.'}</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup && (
              <label className="auth-field">Name
                <input autoComplete="name" name="name" type="text" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={60} placeholder="Your name" />
              </label>
            )}
            <label className="auth-field">Email
              <input autoComplete="email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" />
            </label>
            <label className="auth-field">Password
              <input autoComplete={isSignup ? 'new-password' : 'current-password'} name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={isSignup ? 6 : undefined} placeholder={isSignup ? 'At least 6 characters' : 'Your password'} />
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit" type="submit">{isSignup ? 'Create account' : 'Log in'}</button>
          </form>
          <p className="auth-switch">
            {isSignup ? 'Already have an account?' : 'New to FitLife?'}{' '}
            <Link to={isSignup ? '/login' : '/signup'} state={location.state}>{isSignup ? 'Log in' : 'Sign up'}</Link>
          </p>
          <p className="auth-demo-note">Demo account system: account details and fitness data stay in this browser only. This is not production authentication.</p>
        </div>
      </section>
    </main>
  )
}
