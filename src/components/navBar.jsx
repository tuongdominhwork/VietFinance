import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import miniLogo from '../assets/miniLogo.png'

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className={`navbar-outer${scrolled ? ' navbar-outer--scrolled' : ''}`}>
      <nav className="navbar">
        <div className="navbar-logo">
          <img src={scrolled ? miniLogo : logo} alt="VietFinance Bank" />
        </div>

        <div className="navbar-links">
          <a href="#">For Personal</a>
          <a href="#">For Business</a>
          <a href="#">Premium</a>
        </div>

        <div className="navbar-actions">
          <button className="btn-online-banking">Online Banking</button>
          <button className="btn-login" onClick={() => navigate('/login')}>Login</button>
        </div>
      </nav>
    </div>
  )
}
