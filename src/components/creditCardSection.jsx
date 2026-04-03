import creditCards from '../assets/credit-cards.png'

const NAV_ITEMS = [
  {
    label: 'Cashback 30%',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M7 17L17 7M7 7h4M7 7v4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="16" cy="16" r="2" stroke="white" strokeWidth="2"/>
        <circle cx="8" cy="8" r="2" stroke="white" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    label: 'No commission',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <polyline points="3,17 8,12 13,15 21,7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="17,7 21,7 21,11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: 'No fee',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L15.5 8.5H22L17 13L19 20L12 16L5 20L7 13L2 8.5H8.5L12 2Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: 'About card',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="3" stroke="white" strokeWidth="2"/>
        <path d="M2 10h20" stroke="white" strokeWidth="2"/>
        <path d="M6 15h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Help',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2"/>
        <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export default function CreditCardSection() {
  return (
    <section className="cc-section">
      <div className="cc-inner">
        <h2 className="cc-heading">Credit card VietCredit</h2>
        <p className="cc-sub">Your Everyday Card for Extraordinary Moments</p>
        <button className="btn-new-card">New card</button>

        <div className="cc-display">
          <img src={creditCards} className="cc-cards-img" alt="VietCredit cards" />
        </div>

        <nav className="cc-feature-nav">
          {NAV_ITEMS.map((item) => (
            <button key={item.label} className="cc-feature-item">
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </section>
  )
}
