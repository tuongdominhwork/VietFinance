import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import miniLogo from '../assets/miniLogo.png'
import logo from '../assets/logo.png'
import chatBg from '../assets/AIChatBotBackground.png'
import folderClosed from '../assets/folder-closed.png'
import folderOpened from '../assets/folder-opened.png'

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

const CHAT_HISTORY = [
  { id: 1, title: 'Open a savings account', time: 'Today' },
  { id: 2, title: 'Transfer limits overseas', time: 'Today' },
  { id: 3, title: 'Credit card rewards policy', time: 'Yesterday' },
  { id: 4, title: 'Nearest branch location', time: 'Yesterday' },
  { id: 5, title: 'Loan interest rates 2025', time: 'Mon' },
  { id: 6, title: 'ATM withdrawal abroad', time: 'Mon' },
]

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'ai',
    text: 'Hello! I\'m VietFinance AI. How can I assist you with your banking needs today?',
    time: '09:41',
  },
  {
    id: 2,
    role: 'user',
    text: 'What are the current savings account interest rates?',
    time: '09:42',
  },
  {
    id: 3,
    role: 'ai',
    text: 'Our current savings account rates are:\n\n• Standard Savings: 4.2% p.a.\n• Premium Savings: 5.8% p.a. (min. balance 50M VND)\n• Term Deposit (12 months): 7.1% p.a.\n\nWould you like to open a savings account or get more details on any of these options?',
    time: '09:42',
  },
  {
    id: 4,
    role: 'user',
    text: 'Tell me more about the Premium Savings account.',
    time: '09:43',
  },
  {
    id: 5,
    role: 'ai',
    text: 'The Premium Savings account offers:\n\n• 5.8% p.a. interest rate\n• Minimum balance of 50,000,000 VND\n• Free unlimited transfers\n• Dedicated relationship manager\n• Priority customer support\n\nInterest is calculated daily and credited monthly. You can open one online in under 5 minutes!',
    time: '09:43',
  },
]

const FOLDER_TREE = [
  {
    id: 1, name: 'General Knowledge', count: 10, open: true,
    children: [
      {
        id: 2, name: 'Onboarding', count: 3, open: true,
        children: [
          { id: 3, name: 'Subfolder 1', count: 5 },
          { id: 4, name: 'Subfolder 2', count: 2 },
        ],
      },
      { id: 5, name: 'Policies', count: 4 },
      { id: 6, name: 'Training', count: 3 },
    ],
  },
  { id: 7, name: 'Human Resources', count: 8 },
  { id: 8, name: 'Finance', count: 12 },
]

const FOLDER_CARDS = [
  { id: 1, name: 'Onboarding', count: '3 Files' },
  { id: 2, name: 'Policies', count: '4 Files' },
  { id: 3, name: 'Training', count: '3 Files' },
]

const DOC_FILES = [
  { id: 1, name: 'Onboarding',   addedBy: 'test@gmail.com', modified: 'Today at 18:36', size: '1 KB', kind: 'Folder', permission: 'Employee' },
  { id: 2, name: 'Subfolder 1',  addedBy: 'test@gmail.com', modified: 'Today at 18:36', size: '1 KB', kind: 'Folder', permission: 'Admin'    },
  { id: 3, name: 'Subfolder 1',  addedBy: 'test@gmail.com', modified: 'Today at 18:36', size: '1 KB', kind: 'Folder', permission: 'Customer' },
  { id: 4, name: 'Subfolder 1',  addedBy: 'test@gmail.com', modified: 'Today at 18:36', size: '1 KB', kind: 'Folder', permission: 'Admin'    },
]

function TreeItem({ node, depth = 0, selectedId, onSelect }) {
  const [open, setOpen] = useState(node.open ?? false)
  const hasChildren = node.children && node.children.length > 0
  return (
    <div>
      <button
        className={`doc-tree-item${selectedId === node.id ? ' doc-tree-item--active' : ''}`}
        style={{ paddingLeft: 12 + depth * 16 }}
        onClick={() => { onSelect(node.id); if (hasChildren) setOpen(o => !o) }}
      >
        {hasChildren ? (
          <span className={`doc-tree-arrow${open ? ' doc-tree-arrow--open' : ''}`}>
            <svg viewBox="0 0 8 8" width="8" height="8" fill="currentColor"><path d="M2 1l4 3-4 3V1z"/></svg>
          </span>
        ) : <span className="doc-tree-arrow-spacer" />}
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none" style={{ flexShrink: 0 }}>
          <path d="M2 5a2 2 0 012-2h3l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" fill="#DBB35F" opacity="0.9"/>
        </svg>
        <span className="doc-tree-name">{node.name}</span>
        <span className="doc-tree-count">{node.count}</span>
      </button>
      {open && hasChildren && node.children.map(child => (
        <TreeItem key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  )
}

function FolderCard({ folder, selected, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      className={`doc-folder-card${selected ? ' doc-folder-card--selected' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div className="doc-folder-card-img">
        <img
          src={hovered ? folderOpened : folderClosed}
          alt={folder.name}
          className="doc-folder-img"
          style={{ transform: hovered ? 'translateY(-4px) scale(1.04)' : 'translateY(0) scale(1)' }}
        />
      </div>
      <div className="doc-folder-card-info">
        <span className="doc-folder-card-name">{folder.name}</span>
        <span className="doc-folder-card-count">{folder.count}</span>
      </div>
    </button>
  )
}

export default function AIChatBot() {
  const [input, setInput] = useState('')
  const [activeNav, setActiveNav] = useState('home')
  const [activeChatId, setActiveChatId] = useState(1)
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [selectedFolderId, setSelectedFolderId] = useState(1)
  const [selectedCardId, setSelectedCardId] = useState(null)
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?'

  function handleSettingsClick() {
    logout()
    navigate('/')
  }

  useEffect(() => {
    if (activeNav === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeNav])

  function handleSend() {
    if (!input.trim()) return
    const newMsg = {
      id: messages.length + 1,
      role: 'user',
      text: input.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    }
    setMessages(prev => [...prev, newMsg])
    setInput('')

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: prev.length + 1,
          role: 'ai',
          text: 'Thank you for your question. Our team is looking into this for you. Is there anything else I can help you with?',
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        },
      ])
    }, 1000)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chatbot-root">
      {/* ── Left Sidebar ── */}
      <aside className="chatbot-sidebar">
        {/* Logo */}
        <button
          className="chatbot-sidebar-top"
          onClick={() => setActiveNav('home')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div className="chatbot-sidebar-logo-mini">
            <img src={miniLogo} alt="VietFinance" />
          </div>
          <div className="chatbot-sidebar-logo-full">
            <img src={logo} alt="VietFinance" />
          </div>
        </button>

        {/* Nav */}
        <nav className="chatbot-sidebar-nav">
          <button
            className={`chatbot-nav-btn ${activeNav === 'home' ? 'chatbot-nav-btn--active' : ''}`}
            onClick={() => setActiveNav('home')}
            aria-label="Home"
          >
            <span className="chatbot-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="chatbot-nav-label">Home</span>
          </button>

          <button
            className={`chatbot-nav-btn ${activeNav === 'chat' ? 'chatbot-nav-btn--active' : ''}`}
            onClick={() => setActiveNav('chat')}
            aria-label="Chat history"
          >
            <span className="chatbot-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                <path d="M4 6h16M4 10h16M4 14h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </span>
            <span className="chatbot-nav-label">Chat History</span>
          </button>

          <button
            className={`chatbot-nav-btn ${activeNav === 'documents' ? 'chatbot-nav-btn--active' : ''}`}
            onClick={() => setActiveNav('documents')}
            aria-label="Documents"
          >
            <span className="chatbot-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </span>
            <span className="chatbot-nav-label">Documents</span>
          </button>
        </nav>

        {/* Chat history list — only visible when expanded */}
        <div className="chatbot-sidebar-history">
          <div className="chatbot-sidebar-history-label">RECENT CHATS</div>
          {CHAT_HISTORY.map(chat => (
            <button
              key={chat.id}
              className={`chatbot-history-item ${activeChatId === chat.id ? 'chatbot-history-item--active' : ''}`}
              onClick={() => { setActiveChatId(chat.id); setActiveNav('chat') }}
            >
              <span className="chatbot-history-dot" />
              <span className="chatbot-history-title">{chat.title}</span>
              <span className="chatbot-history-time">{chat.time}</span>
            </button>
          ))}

          <button
            className="chatbot-new-chat-btn"
            onClick={() => setActiveNav('chat')}
          >
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>New Chat</span>
          </button>
        </div>

        {/* ── Sidebar Bottom ── */}
        <div className="chatbot-sidebar-bottom">
          <button className="chatbot-nav-btn" onClick={handleSettingsClick} aria-label="Settings">
            <span className="chatbot-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
            </span>
            <span className="chatbot-nav-label">Setting</span>
          </button>

          <div className="chatbot-sidebar-user">
            <div className="chatbot-user-avatar">{userInitial}</div>
            <span className="chatbot-nav-label chatbot-user-name">{user?.name ?? 'Guest'}</span>
          </div>
        </div>
      </aside>

      {/* ── Main Area ── */}
      {activeNav === 'documents' ? (
        <main className="chatbot-main chatbot-main--documents">
          {/* Header */}
          <div className="doc-header">
            <h2 className="doc-heading">Browse Documents</h2>
            <button className="doc-upload-btn">
              <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
                <path d="M10 3v10M6 7l4-4 4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 15h14" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Upload
            </button>
          </div>

          <div className="doc-body">
            {/* Left panel — folder tree */}
            <div className="doc-left-panel">
              {/* Search */}
              <div className="doc-search-wrap">
                <svg viewBox="0 0 20 20" fill="none" width="15" height="15" className="doc-search-icon">
                  <circle cx="8.5" cy="8.5" r="5.5" stroke="#9CA3AF" strokeWidth="1.6"/>
                  <path d="M13 13l3.5 3.5" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                <input className="doc-search-input" placeholder="Search folders..." />
              </div>

              {/* Tabs */}
              <div className="doc-tabs">
                <button className="doc-tab doc-tab--active">Folders</button>
                <button className="doc-tab">Tags</button>
              </div>

              {/* Tree */}
              <div className="doc-tree">
                {FOLDER_TREE.map(node => (
                  <TreeItem key={node.id} node={node} selectedId={selectedFolderId} onSelect={setSelectedFolderId} />
                ))}
              </div>
            </div>

            {/* Right panel — folder cards + files table */}
            <div className="doc-right-panel">
              {/* Breadcrumb */}
              <div className="doc-breadcrumb">
                <button className="doc-bc-nav">
                  <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button className="doc-bc-nav">
                  <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <div className="doc-bc-sep" />
                <span className="doc-bc-current">General Knowledge</span>
                <button className="doc-bc-dropdown">
                  <svg viewBox="0 0 16 16" fill="none" width="12" height="12"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>

              {/* Folders section */}
              <div className="doc-section">
                <h3 className="doc-section-title">Folders</h3>
                <div className="doc-folder-grid">
                  {FOLDER_CARDS.map(f => (
                    <FolderCard
                      key={f.id}
                      folder={f}
                      selected={selectedCardId === f.id}
                      onClick={() => setSelectedCardId(f.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Files table */}
              <div className="doc-section">
                <h3 className="doc-section-title">Files</h3>
                <div className="doc-table-wrap">
                  <table className="doc-table">
                    <thead>
                      <tr>
                        <th><input type="checkbox" /></th>
                        <th>Name</th>
                        <th>Added By</th>
                        <th>Date Modified</th>
                        <th>Size</th>
                        <th>Kind</th>
                        <th>Permission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DOC_FILES.map(f => (
                        <tr key={f.id}>
                          <td><input type="checkbox" /></td>
                          <td>
                            <div className="doc-file-name">
                              <svg viewBox="0 0 20 20" width="15" height="15" fill="none" style={{ flexShrink: 0 }}>
                                <path d="M2 5a2 2 0 012-2h3l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" fill="#DBB35F" opacity="0.85"/>
                              </svg>
                              {f.name}
                            </div>
                          </td>
                          <td>{f.addedBy}</td>
                          <td>{f.modified}</td>
                          <td>{f.size}</td>
                          <td>{f.kind}</td>
                          <td>
                            <span className={`doc-permission doc-permission--${f.permission.toLowerCase()}`}>{f.permission}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : activeNav === 'chat' ? (
        <main className="chatbot-main chatbot-main--chat">
          {/* Chat header */}
          <div className="chatbot-chat-header">
            <div className="chatbot-chat-header-left">
              <div className="chatbot-chat-avatar">
                <img src={miniLogo} alt="AI" />
              </div>
              <div>
                <div className="chatbot-chat-title">VietFinance AI</div>
                <div className="chatbot-chat-status">
                  <span className="chatbot-status-dot" />
                  Online
                </div>
              </div>
            </div>
            <div className="chatbot-toolbar">
              <button className="chatbot-toolbar-btn chatbot-toolbar-btn--light">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                  <circle cx="11" cy="11" r="7" stroke="#0B3C71" strokeWidth="2"/>
                  <path d="M16.5 16.5L21 21" stroke="#0B3C71" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span> Searching documents</span>
              </button>
              <button className="chatbot-toolbar-btn chatbot-toolbar-btn--dark" onClick={() => setMessages([])}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
                </svg>
                <span> New chat</span>
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="chatbot-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`chatbot-message chatbot-message--${msg.role}`}>
                {msg.role === 'ai' && (
                  <div className="chatbot-message-avatar">
                    <img src={miniLogo} alt="AI" />
                  </div>
                )}
                <div className="chatbot-message-content">
                  <div className="chatbot-message-bubble">
                    {msg.text.split('\n').map((line, i) => (
                      <span key={i}>{line}{i < msg.text.split('\n').length - 1 && <br />}</span>
                    ))}
                  </div>
                  <div className="chatbot-message-time">{msg.time}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input box */}
          <div className="chatbot-input-area chatbot-input-area--chat">
            <div className="chatbot-input-box">
              <textarea
                className="chatbot-textarea"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <div className="chatbot-input-footer">
                <div className="chatbot-input-icons">
                  <button className="chatbot-icon-btn" aria-label="Attach file">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#6B7280" strokeWidth="1.8" strokeLinejoin="round"/>
                      <path d="M14 2v6h6" stroke="#6B7280" strokeWidth="1.8" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button className="chatbot-icon-btn" aria-label="Attach image">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#6B7280" strokeWidth="1.8"/>
                      <circle cx="8.5" cy="8.5" r="1.5" stroke="#6B7280" strokeWidth="1.8"/>
                      <path d="M21 15l-5-5L5 21" stroke="#6B7280" strokeWidth="1.8" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                <button className="chatbot-send-btn" aria-label="Send" onClick={handleSend}>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                    <path d="M12 19V5M5 12l7-7 7 7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </main>
      ) : (
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
            <button className="chatbot-toolbar-btn chatbot-toolbar-btn--dark" onClick={() => setActiveNav('chat')}>
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
                  <button className="chatbot-icon-btn" aria-label="Attach file">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#6B7280" strokeWidth="1.8" strokeLinejoin="round"/>
                      <path d="M14 2v6h6" stroke="#6B7280" strokeWidth="1.8" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button className="chatbot-icon-btn" aria-label="Attach image">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#6B7280" strokeWidth="1.8"/>
                      <circle cx="8.5" cy="8.5" r="1.5" stroke="#6B7280" strokeWidth="1.8"/>
                      <path d="M21 15l-5-5L5 21" stroke="#6B7280" strokeWidth="1.8" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                <button className="chatbot-send-btn" aria-label="Send" onClick={() => setActiveNav('chat')}>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                    <path d="M12 19V5M5 12l7-7 7 7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="chatbot-suggestions-label">GET STARTED WITH AN EXAMPLE BELOW</div>
            <div className="chatbot-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="chatbot-suggestion-card"
                  onClick={() => { setInput(s.text); setActiveNav('chat') }}
                >
                  <span className="chatbot-suggestion-text">{s.text}</span>
                  <span className="chatbot-suggestion-icon">{s.icon}</span>
                </button>
              ))}
            </div>
          </div>
        </main>
      )}
    </div>
  )
}
