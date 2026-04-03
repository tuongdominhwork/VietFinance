import { useEffect, useRef, useState } from 'react'
import pricePlanBg from '../assets/pricePlan.png'

const PLANS = [
  {
    id: 'student',
    name: 'VietStudent Plan',
    unitPrice: 'Price $2 unit per month',
    price: '$2',
    features: [
      'SMS Notification',
      'Up to 14% saving rate',
      'Cashback up to 20%',
      'Personal bank assistance',
    ],
    ctaColor: '#0B3C71',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <path d="M12 3L2 8l10 5 10-5-10-5z" stroke="#0B3C71" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M6 10.5v5c0 2.5 2.7 4.5 6 4.5s6-2 6-4.5v-5" stroke="#0B3C71" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M20 8v6" stroke="#0B3C71" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'vip',
    name: 'VietVIP Plan',
    unitPrice: 'Price $12 unit per month',
    price: '$12',
    features: [
      'Up to date news of Stock options',
      'Up to 16% saving rate',
      'Cashback up to 40%',
      'Personal bank assistance + Invest Agent',
    ],
    ctaColor: '#1572D7',
    featured: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <path d="M6 3l-3 5h18l-3-5H6z" stroke="#0B3C71" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M3 8l9 13 9-13" stroke="#0B3C71" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M9 8l3 9 3-9" stroke="#0B3C71" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'premium',
    name: 'VietPremium Plan',
    unitPrice: 'Price $20 unit per month',
    price: '$20',
    features: [
      'Up to date news of Stock options',
      'Up to 16% saving rate',
      'Cashback up to 40%',
      'Personal bank assistance + Invest Agent',
    ],
    ctaColor: '#DBB35F',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <path d="M12 2l2.4 4.8L20 8l-4 3.9.9 5.6L12 15l-4.9 2.5.9-5.6L4 8l5.6-.8L12 2z" stroke="#0B3C71" strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

export default function PricingSection() {
  const sectionRef = useRef(null)
  const cardsRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [billing, setBilling] = useState('monthly')

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

  useEffect(() => {
    const cards = cardsRef.current?.querySelectorAll('.pricing-card')
    if (!cards) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('pricing-card--visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    cards.forEach((card) => observer.observe(card))
    return () => observer.disconnect()
  }, [])

  return (
    <section
      className="pricing-section"
      ref={sectionRef}
      style={{ backgroundImage: `url(${pricePlanBg})` }}
    >
      <div className={`pricing-inner ${visible ? 'pricing-inner--visible' : ''}`}>

        {/* Header */}
        <div className="pricing-header">
          <span className="pricing-label">Premium</span>
          <h2 className="pricing-heading">Exclusive Price Plans</h2>

          {/* Toggle */}
          <div className="pricing-toggle">
            <button
              className={`pricing-toggle-btn ${billing === 'monthly' ? 'pricing-toggle-btn--active' : ''}`}
              onClick={() => setBilling('monthly')}
            >
              Monthly
            </button>
            <span className="pricing-toggle-sep"> / </span>
            <button
              className={`pricing-toggle-btn ${billing === 'yearly' ? 'pricing-toggle-btn--active' : ''}`}
              onClick={() => setBilling('yearly')}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="pricing-cards" ref={cardsRef}>
          {PLANS.map((plan, i) => (
            <div
              key={plan.id}
              className={`pricing-card ${plan.featured ? 'pricing-card--featured' : ''}`}
              style={{ transitionDelay: `${i * 0.15}s` }}
            >
              <div className="pricing-card-icon">{plan.icon}</div>
              <h3 className="pricing-card-name">{plan.name}</h3>
              <p className="pricing-card-unit">{plan.unitPrice}</p>

              <div className="pricing-card-price">
                <span className="pricing-card-amount">{plan.price}</span>
                <span className="pricing-card-period"> / month</span>
              </div>

              <ul className="pricing-card-features">
                {plan.features.map((f) => (
                  <li key={f} className="pricing-card-feature">
                    <span className="pricing-card-bullet" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="pricing-card-cta">
                <button
                  className="pricing-cta-btn"
                  style={{ backgroundColor: plan.ctaColor }}
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
