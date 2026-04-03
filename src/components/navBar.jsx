import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png'
import miniLogo from '../assets/miniLogo.png'

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function handleUserButton() {
    logout()
    navigate('/')
  }

  return (
    <div className={`navbar-outer${scrolled ? ' navbar-outer--scrolled' : ''}`}>
      <nav className="navbar">
        <button
          className="navbar-logo"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <img src={scrolled ? miniLogo : logo} alt="VietFinance Bank" />
        </button>

        <div className="navbar-links">
          <a href="#">For Personal</a>
          <a href="#">For Business</a>
          <a href="#">Premium</a>
        </div>

        <div className="navbar-actions">
          <button className="btn-online-banking">Online Banking</button>
          {user ? (
            <button className="btn-login" onClick={handleUserButton}>
              {user.name}
            </button>
          ) : (
            <button className="btn-login" onClick={() => navigate('/login')}>
              Login
            </button>
          )}
        </div>
      </nav>
    </div>
  )
}
