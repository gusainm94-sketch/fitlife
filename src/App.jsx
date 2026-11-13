import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import { useAuth } from './hooks/useAuth.js'
import AppLayout from './layouts/AppLayout.jsx'
import AuthPage from './pages/AuthPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import DietPlannerPage from './pages/DietPlannerPage.jsx'
import BmiProfilePage from './pages/BmiProfilePage.jsx'
import WorkoutPlannerPage from './pages/WorkoutPlannerPage.jsx'
import HabitsPage from './pages/HabitsPage.jsx'
import ProgressPage from './pages/ProgressPage.jsx'
import RewardsPage from './pages/RewardsPage.jsx'
import './App.css'

function RequireAuth() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <AppProvider key={user.id} user={user}><Outlet /></AppProvider>
}

export default function App() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <AuthPage mode="signup" />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/workouts" element={<WorkoutPlannerPage />} />
          <Route path="/nutrition" element={<DietPlannerPage />} />
          <Route path="/bmi-profile" element={<BmiProfilePage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
