import { useEffect, useRef } from 'react'
import NavBar from '../components/navBar'
import CreditCardSection from '../components/creditCardSection'
import FeaturesSection from '../components/featuresSection'
import AIChatbotSection from '../components/aiChatbotSection'
import PricingSection from '../components/pricingSection'
import heroVid from '../assets/heroVid.mp4'
import heroVidReversed from '../assets/heroVidReversed.mp4'

const LandingPage = () => {
  const fwdRef = useRef(null)
  const revRef = useRef(null)
  const heroRef = useRef(null)

  useEffect(() => {
    const fwd = fwdRef.current
    const rev = revRef.current
    const hero = heroRef.current
    if (!fwd || !rev || !hero) return

    let rafPending = false
    let stopTimer = null
    let lastProgress = 0

    const getProgress = () => {
      const { top, height } = hero.getBoundingClientRect()
      const scrollable = height - window.innerHeight
      return Math.min(Math.max(-top / scrollable, 0), 1)
    }

    const update = () => {
      const progress = getProgress()
      const duration = fwd.duration || 0
      const direction = progress - lastProgress

      if (direction >= 0) {
        // Scrolling down — forward video plays forward
        rev.style.opacity = '0'
        fwd.style.opacity = '1'
        const target = progress * duration
        const diff = target - fwd.currentTime
        if (diff > 0.03) {
          fwd.playbackRate = Math.min(diff * 22, 10)
          if (fwd.paused) fwd.play()
        }
        rev.pause()
      } else {
        // Scrolling up — reversed video plays forward (appears to go backward)
        fwd.style.opacity = '0'
        rev.style.opacity = '1'
        const target = (1 - progress) * duration
        const diff = target - rev.currentTime
        if (diff > 0.03) {
          rev.playbackRate = Math.min(diff * 22, 10)
          if (rev.paused) rev.play()
        }
        fwd.pause()
      }

      lastProgress = progress
      rafPending = false
    }

    const handleScroll = () => {
      if (!rafPending) {
        rafPending = true
        requestAnimationFrame(update)
      }
      clearTimeout(stopTimer)
      stopTimer = setTimeout(() => {
        const progress = getProgress()
        const duration = fwd.duration || 0
        fwd.pause()
        rev.pause()
        fwd.currentTime = progress * duration
        rev.currentTime = (1 - progress) * duration
      }, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(stopTimer)
    }
  }, [])

  return (
    <div>
      <NavBar />

      <section className="hero" ref={heroRef}>
        <div className="hero-sticky">
          <div className="hero-content">
            <h1 className='hero-title'>
              Your Future,<br />
              Our Commitment.
            </h1>
            <p>
              VietFinance Bank is Vietnam's trusted financial partner for
              small and medium enterprises — combining decades of banking
              expertise with cutting-edge AI technology to help businesses
              grow smarter, faster, and stronger.
            </p>
            <button className="btn-get-started">
              <span>Get Started</span>
              <div className="arrow-circle">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
          </div>

          <div className="hero-image">
            <video ref={fwdRef} src={heroVid} muted playsInline preload="auto" />
            <video ref={revRef} src={heroVidReversed} muted playsInline preload="auto" style={{ opacity: 0 }} />
          </div>
        </div>
      </section>

      <CreditCardSection />
      <FeaturesSection />
      <AIChatbotSection />
      <PricingSection />
    </div>
  )
}

export default LandingPage
