import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import DietPlannerPage from './pages/DietPlannerPage.jsx'
import BmiProfilePage from './pages/BmiProfilePage.jsx'
import WorkoutPlannerPage from './pages/WorkoutPlannerPage.jsx'
import HabitsPage from './pages/HabitsPage.jsx'
import ProgressPage from './pages/ProgressPage.jsx'
import RewardsPage from './pages/RewardsPage.jsx'
import './App.css'

export default function App() {
  return (
    <Routes>
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
    </Routes>
  )
}
