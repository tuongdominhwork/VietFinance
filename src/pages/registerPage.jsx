import miniLogo from '../assets/miniLogo.png'
import authImg from '../assets/auth.png'

export default function RegisterPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* ── Left: form panel ── */}
        <div className="auth-form-panel">
          <img src={miniLogo} alt="VietFinance Bank" className="auth-logo" />

          <h1 className="auth-heading">Register</h1>
          <p className="auth-sub">Create your account to get started.</p>

          <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
            <div className="auth-field">
              <label htmlFor="name">Full Name</label>
              <input id="name" type="text" placeholder="Enter your full name" />
            </div>

            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="Enter your email" />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" placeholder="Enter your password" />
            </div>

            <button type="submit" className="auth-btn-primary">Create Account</button>
          </form>

          <p className="auth-switch">
            Already have an account? <a href="/login">Log in</a>
          </p>
        </div>

        {/* ── Right: decorative panel ── */}
        <div className="auth-deco-panel">
          <img src={authImg} alt="" className="auth-deco-img" />
          <div className="auth-deco-overlay">
            <p className="auth-deco-tagline">Designed for the Life You Deserve.</p>
            <p className="auth-deco-text">Everything you love about VietCredit, amplified. More rewards, more protection, more possibilities.</p>
          </div>
        </div>

      </div>
    </div>
  )
}
