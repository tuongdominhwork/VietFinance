import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import aiChatBot from '../assets/aiChatbot/AIChatBot.png'

export default function AIChatbotSection() {
  const sectionRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="ai-section" ref={sectionRef}>
      <div className="ai-inner">

        {/* Left: heading + description + CTA */}
        <div className={`ai-left ${visible ? 'ai-left--visible' : ''}`}>
          <h2 className="ai-heading">
            Always On,<br />Always Ready.
          </h2>
          <p className="ai-sub">
            Powered by advanced AI, our chatbot understands your needs instantly
            and delivers accurate, personalized answers in seconds. No waiting.
            No hold music. Just intelligent support whenever you need it most.
          </p>
          <button className="btn-try-now" onClick={() => navigate('/chat')}>
            <span>Try now</span>
            <div className="arrow-circle arrow-circle--dark">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="#0B3C71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        </div>

        {/* Right: AI chatbot image */}
        <div className={`ai-right ${visible ? 'ai-right--visible' : ''}`}>
          <img src={aiChatBot} alt="VietFinance AI Chatbot" className="ai-laptop-img" />
        </div>

      </div>
    </section>
  )
}
