import { useNavigate } from 'react-router-dom'
import miniLogo from '../assets/miniLogo.png'
import authImg from '../assets/auth.png'

export default function LoginPage() {
  const navigate = useNavigate()
  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* ── Left: form panel ── */}
        <div className="auth-form-panel">
          <img src={miniLogo} alt="VietFinance Bank" className="auth-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />

          <h1 className="auth-heading">Log In</h1>
          <p className="auth-sub">Welcome back! Please enter your details.</p>

          <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="Enter your email" />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" placeholder="Enter your password" />
            </div>

            <div className="auth-row">
              <label className="auth-remember">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="auth-forgot">Forgot password?</a>
            </div>

            <button type="submit" className="auth-btn-primary">Login</button>
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
