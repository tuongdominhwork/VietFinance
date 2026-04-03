import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import miniLogo from '../assets/miniLogo.png'
import authImg from '../assets/auth.png'

const API = 'http://localhost:5001'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Login failed')
        return
      }

      login(data.user, data.token)
      navigate('/')
    } catch {
      setError('Unable to reach server. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* ── Left: form panel ── */}
        <div className="auth-form-panel">
          <img src={miniLogo} alt="VietFinance Bank" className="auth-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />

          <h1 className="auth-heading">Log In</h1>
          <p className="auth-sub">Welcome back! Please enter your details.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="auth-row">
              <label className="auth-remember">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="auth-forgot">Forgot password?</a>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <a href="/register">Sign up</a>
          </p>
        </div>

        {/* ── Right: decorative panel ── */}
        <div className="auth-deco-panel">
          <img src={authImg} alt="" className="auth-deco-img" />
          <div className="auth-deco-overlay">
            <p className="auth-deco-tagline">Designed for the Life You Deserve.</p>
            <p className='auth-deco-text'>Everything you love about VietCredit, amplified. More rewards, more protection, more possibilities.</p>
          </div>
        </div>

      </div>
    </div>
  )
}
