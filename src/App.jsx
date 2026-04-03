import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import LandingPage from './pages/landingPage'
import LoginPage from './pages/loginPage'
import RegisterPage from './pages/registerPage'
import AIChatBot from './pages/AIChatBot'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <div key={location.key} className="page-transition">
      <Routes location={location}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/chat" element={<AIChatBot />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
