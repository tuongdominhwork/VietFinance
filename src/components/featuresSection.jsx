import { useEffect, useRef } from 'react'
import aiSupport from '../assets/features/AISupport.png'
import instantCashback from '../assets/features/instanceCashback.png'
import realTimeFraud from '../assets/features/realTimeFraud.png'
import smartSpending from '../assets/features/smartSpending.png'
import zeroFee from '../assets/features/zeroFee.png'

const FEATURES = [
  {
    id: 'ai-support',
    img: aiSupport,
    title: 'AI Support 24/7',
    desc: 'Get instant intelligent assistance any time of day. Our AI-powered support resolves queries in seconds, so you never wait on hold.',
    span: true,
  },
  {
    id: 'cashback',
    img: instantCashback,
    title: 'Instant Cashback',
    desc: 'Earn cashback rewards immediately on every purchase — no waiting, no minimum spend.',
  },
  {
    id: 'fraud',
    img: realTimeFraud,
    title: 'Real Time Fraud Protection',
    desc: 'Advanced AI monitors every transaction and blocks suspicious activity before it impacts you.',
  },
  {
    id: 'spending',
    img: smartSpending,
    title: 'Smart Spending Insights',
    desc: 'Visualise spending patterns with intelligent reports and personalised budgeting suggestions.',
  },
  {
    id: 'zero-fee',
    img: zeroFee,
    title: 'Zero Foreign Transaction Fees',
    desc: 'Send and receive money internationally with no hidden charges or currency conversion markups.',
  },
]

export default function FeaturesSection() {
  const [ai, cashback, fraud, spending, zero] = FEATURES
  const gridRef = useRef(null)

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll('.feat-card')
    if (!cards) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('feat-card--visible')
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
    <section className="feat-section">
      <div className="feat-inner">
        <div className="feat-header">
          <h2 className="feat-heading">More convenient than ever!</h2>
          <p className="feat-sub">Everything you need to manage your finances — smarter, faster, safer.</p>
        </div>

        <div className="feat-grid" ref={gridRef}>
          {/* AI Support — tall card, spans 2 grid rows */}
          <div className="feat-card feat-card--tall">
            <div className="feat-card-text">
              <h3 className="feat-card-title">{ai.title}</h3>
              <p className="feat-card-desc">{ai.desc}</p>
            </div>
            <div className="feat-card-img feat-card-img--tall">
              <img src={ai.img} alt={ai.title} />
            </div>
          </div>

          {/* Instant Cashback */}
          <div className="feat-card">
            <div className="feat-card-text">
              <h3 className="feat-card-title">{cashback.title}</h3>
              <p className="feat-card-desc">{cashback.desc}</p>
            </div>
            <div className="feat-card-img feat-card-img--IC">
              <img src={cashback.img} alt={cashback.title} />
            </div>
          </div>

          {/* Real Time Fraud Protection */}
          <div className="feat-card">
            <div className="feat-card-text">
              <h3 className="feat-card-title">{fraud.title}</h3>
              <p className="feat-card-desc">{fraud.desc}</p>
            </div>
            <div className="feat-card-img feat-card-img--RF">
              <img src={fraud.img} alt={fraud.title} />
            </div>
          </div>

          {/* Smart Spending Insights */}
          <div className="feat-card">
            <div className="feat-card-text">
              <h3 className="feat-card-title">{spending.title}</h3>
              <p className="feat-card-desc">{spending.desc}</p>
            </div>
            <div className="feat-card-img feat-card-img--SS">
              <img src={spending.img} alt={spending.title} />
            </div>
          </div>

          {/* Zero Foreign Transaction Fees */}
          <div className="feat-card">
            <div className="feat-card-text">
              <h3 className="feat-card-title">{zero.title}</h3>
              <p className="feat-card-desc">{zero.desc}</p>
            </div>
            <div className="feat-card-img feat-card-img--ZF">
              <img src={zero.img} alt={zero.title} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
