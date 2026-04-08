import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import LandingPage from './pages/landingPage'
import LoginPage from './pages/loginPage'
import RegisterPage from './pages/registerPage'
import AIChatBot from './pages/AIChatBot'

function AnimatedRoutes() {
  const location = useLocation()
  const routeKey = location.pathname.startsWith('/chat') ? '/chat' : location.pathname
  return (
    <div key={routeKey} className="page-transition">
      <Routes location={location}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/chat" element={<AIChatBot />} />
        <Route path="/chat/:sessionId" element={<AIChatBot />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
