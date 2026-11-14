import { lazy, Suspense } from 'react'
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

export default function App() {
  const { user } = useAuth()
  return (
    <Suspense fallback={<div className="route-loading" role="status">Loading FitLife...</div>}>
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
  )
}
