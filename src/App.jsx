import { Component, lazy, Suspense } from 'react'
import { Activity, CircleAlert, RefreshCw } from 'lucide-react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import { useAuth } from './hooks/useAuth.js'
import AppLayout from './layouts/AppLayout.jsx'
import { MembershipProvider } from './context/MembershipContext.jsx'
import './App.css'

const AuthPage = lazy(() => import('./pages/AuthPage.jsx'))
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const DietPlannerPage = lazy(() => import('./pages/DietPlannerPage.jsx'))
const BmiProfilePage = lazy(() => import('./pages/BmiProfilePage.jsx'))
const WorkoutPlannerPage = lazy(() => import('./pages/WorkoutPlannerPage.jsx'))
const HabitsPage = lazy(() => import('./pages/HabitsPage.jsx'))
const ProgressPage = lazy(() => import('./pages/ProgressPage.jsx'))
const RewardsPage = lazy(() => import('./pages/RewardsPage.jsx'))
const MembershipPage = lazy(() => import('./pages/MembershipPage.jsx'))
const CaloriesTrackerPage = lazy(() => import('./pages/CaloriesTrackerPage.jsx'))
const MusicPage = lazy(() => import('./pages/MusicPage.jsx'))
const FitnessTrackerPage = lazy(() => import('./pages/FitnessTrackerPage.jsx'))
const NutritionCalculatorPage = lazy(() => import('./pages/NutritionCalculatorPage.jsx'))

function RequireAuth() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return (
    <AppProvider key={user.id} user={user}>
      <MembershipProvider userId={user.id}><Outlet /></MembershipProvider>
    </AppProvider>
  )
}

class RouteErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('FitLife route failed to render.', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <main className="route-error" role="alert">
        <span className="route-error-icon"><CircleAlert size={22} /></span>
        <p className="eyebrow">Something needs another try</p>
        <h1>This FitLife screen could not load.</h1>
        <p>Nothing was changed in your saved data. Reload the screen or return to your dashboard.</p>
        <div className="route-error-actions"><button className="primary-button" type="button" onClick={() => window.location.reload()}><RefreshCw size={15} /> Reload screen</button><a className="secondary-button" href="/">Back to dashboard</a></div>
      </main>
    )
  }
}

function RouteLoading() {
  return <main className="route-loading" role="status" aria-live="polite"><span className="route-loading-mark"><Activity size={21} /></span><span>Loading FitLife…</span></main>
}

export default function App() {
  const { user } = useAuth()
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" />} />
          <Route path="/signup" element={user ? <Navigate to="/" replace /> : <AuthPage mode="signup" />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="/workouts" element={<WorkoutPlannerPage />} />
              <Route path="/nutrition" element={<DietPlannerPage />} />
              <Route path="/nutrition-calculator" element={<NutritionCalculatorPage />} />
              <Route path="/bmi-profile" element={<BmiProfilePage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/calories" element={<CaloriesTrackerPage />} />
              <Route path="/fitness-tracker" element={<FitnessTrackerPage />} />
              <Route path="/music" element={<MusicPage />} />
              <Route path="/habits" element={<HabitsPage />} />
              <Route path="/rewards" element={<RewardsPage />} />
              <Route path="/membership" element={<MembershipPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  )
}
