import { useState } from 'react'
import miniLogo from '../assets/miniLogo.png'
import chatBg from '../assets/AIChatBotBackground.png'

const SUGGESTIONS = [
  {
    text: 'How do I open a new bank account?',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
        <rect x="2" y="5" width="20" height="14" rx="3" stroke="#0B3C71" strokeWidth="1.8"/>
        <path d="M2 10h20" stroke="#0B3C71" strokeWidth="1.8"/>
        <path d="M6 15h4" stroke="#0B3C71" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    text: 'What is the saving rate of this month?',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
        <path d="M3 17l5-5 4 4 5-6 4 3" stroke="#0B3C71" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    text: 'Where is the closest ATM to me?',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
        <circle cx="12" cy="10" r="3" stroke="#0B3C71" strokeWidth="1.8"/>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#0B3C71" strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    text: 'What is the opening hours during weekend days?',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
        <path d="M12 2v6l3 3" stroke="#0B3C71" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="12" cy="12" r="9" stroke="#0B3C71" strokeWidth="1.8"/>
      </svg>
    ),
  },
]

export default function AIChatBot() {
  const [input, setInput] = useState('')
  const [activeNav, setActiveNav] = useState('home')

  return (
    <div className="chatbot-root">
      {/* ── Left Sidebar ── */}
      <aside className="chatbot-sidebar">
        <div className="chatbot-sidebar-logo">
          <img src={miniLogo} alt="VietFinance" />
        </div>
        <nav className="chatbot-sidebar-nav">
          <button
            className={`chatbot-nav-btn ${activeNav === 'home' ? 'chatbot-nav-btn--active' : ''}`}
            onClick={() => setActiveNav('home')}
            aria-label="Home"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className={`chatbot-nav-btn ${activeNav === 'chat' ? 'chatbot-nav-btn--active' : ''}`}
            onClick={() => setActiveNav('chat')}
            aria-label="Chat history"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
              <path d="M4 6h16M4 10h16M4 14h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            className={`chatbot-nav-btn ${activeNav === 'wallet' ? 'chatbot-nav-btn--active' : ''}`}
            onClick={() => setActiveNav('wallet')}
            aria-label="Wallet"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
              <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M16 13a1 1 0 110 2 1 1 0 010-2z" fill="currentColor"/>
              <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8"/>
            </svg>
          </button>
        </nav>
      </aside>

      {/* ── Main Area ── */}
      <main
        className="chatbot-main"
        style={{ backgroundImage: `url(${chatBg})` }}
      >
        {/* Top-right toolbar */}
        <div className="chatbot-toolbar">
          <button className="chatbot-toolbar-btn chatbot-toolbar-btn--light">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
              <circle cx="11" cy="11" r="7" stroke="#0B3C71" strokeWidth="2"/>
              <path d="M16.5 16.5L21 21" stroke="#0B3C71" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span> Searching documents</span>
          </button>
          <button className="chatbot-toolbar-btn chatbot-toolbar-btn--dark">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
            </svg>
            <span> New chat</span>
          </button>
        </div>

        {/* Center welcome content */}
        <div className="chatbot-welcome">
          <img src={miniLogo} alt="VietFinance AI" className="chatbot-welcome-logo" />
          <p className="chatbot-welcome-sub">Welcome to VietFinance AI</p>
          <h1 className="chatbot-welcome-heading">
            How can I <span className="chatbot-welcome-gold">help?</span>
          </h1>
        </div>

        {/* Input + suggestions */}
        <div className="chatbot-input-area">
          <div className="chatbot-input-box">
            <textarea
              className="chatbot-textarea"
              placeholder="What is the policy for withdraw money?..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={1}
            />
            <div className="chatbot-input-footer">
              <div className="chatbot-input-icons">
                {/* File attach */}
                <button className="chatbot-icon-btn" aria-label="Attach file">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#6B7280" strokeWidth="1.8" strokeLinejoin="round"/>
                    <path d="M14 2v6h6" stroke="#6B7280" strokeWidth="1.8" strokeLinejoin="round"/>
                  </svg>
                </button>
                {/* Image/media */}
                <button className="chatbot-icon-btn" aria-label="Attach image">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="#6B7280" strokeWidth="1.8"/>
                    <circle cx="8.5" cy="8.5" r="1.5" stroke="#6B7280" strokeWidth="1.8"/>
                    <path d="M21 15l-5-5L5 21" stroke="#6B7280" strokeWidth="1.8" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <button className="chatbot-send-btn" aria-label="Send">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                  <path d="M12 19V5M5 12l7-7 7 7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="chatbot-suggestions-label">GET STARTED WITH AN EXAMPLE BELOW</div>
          <div className="chatbot-suggestions">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                className="chatbot-suggestion-card"
                onClick={() => setInput(s.text)}
              >
                <span className="chatbot-suggestion-text">{s.text}</span>
                <span className="chatbot-suggestion-icon">{s.icon}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
