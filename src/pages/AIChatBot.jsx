/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
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

function findFolderInTree(tree, id) {
  for (const node of tree) {
    if (node.id === id) return node
    if (node.children) {
      const found = findFolderInTree(node.children, id)
      if (found) return found
    }
  }
  return null
}

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

  // Chat state
  const [chatSessions, setChatSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [historyMenu, setHistoryMenu] = useState({ open: false, x: 0, y: 0, sessionId: null })
  const [renamingSessionId, setRenamingSessionId] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  // Documents state
  const [folderTree, setFolderTree] = useState([])
  const [selectedFolderId, setSelectedFolderId] = useState(null)
  const [folderContents, setFolderContents] = useState({ folder: null, subfolders: [], documents: [] })
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [docsLoading, setDocsLoading] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [docsMode, setDocsMode] = useState('folders') // 'folders' | 'tags'
  const [selectedPermTags, setSelectedPermTags] = useState([])
  const [docSearchQuery, setDocSearchQuery] = useState('')
  const [docSearchLoading, setDocSearchLoading] = useState(false)
  const [docSearchError, setDocSearchError] = useState('')
  const [docSearchResults, setDocSearchResults] = useState([])

  const messagesEndRef = useRef(null)
  const navigate = useNavigate()
  const { sessionId: routeSessionId } = useParams()
  const { user, logout } = useAuth()

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?'
  const sidebarPinned = historyMenu.open || renamingSessionId !== null

  // ── Fetch chat sessions ──────────────────────────────────
  const fetchChatSessions = useCallback(async () => {
    try {
      const data = await api.get('/chats')
      setChatSessions(data.sessions)
    } catch (err) {
      console.error('Failed to load chat sessions:', err)
    }
  }, [])

  useEffect(() => {
    fetchChatSessions()
  }, [fetchChatSessions])

  // ── Sync active session from URL ─────────────────────────
  useEffect(() => {
    if (!routeSessionId) return
    const parsed = Number.parseInt(routeSessionId, 10)
    if (Number.isNaN(parsed)) {
      navigate('/chat', { replace: true })
      return
    }
    setActiveSessionId(parsed)
    setActiveNav('chat')
  }, [routeSessionId, navigate])

  // ── Fetch messages for active session ────────────────────
  useEffect(() => {
    if (!activeSessionId) return
    setChatLoading(true)
    api.get(`/chats/${activeSessionId}/messages`)
      .then(data => setMessages(data.messages))
      .catch(err => console.error('Failed to load messages:', err))
      .finally(() => setChatLoading(false))
  }, [activeSessionId])

  // ── Fetch folder tree ────────────────────────────────────
  useEffect(() => {
    if (activeNav !== 'documents' || folderTree.length > 0) return
    api.get('/documents/folders')
      .then(data => {
        setFolderTree(data.folders)
        if (data.folders.length > 0 && selectedFolderId === null) {
          setSelectedFolderId(data.folders[0].id)
        }
      })
      .catch(err => console.error('Failed to load folder tree:', err))
  }, [activeNav]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch folder contents ─────────────────────────────────
  useEffect(() => {
    if (!selectedFolderId) return
    setDocsLoading(true)
    setSelectedCardId(null)
    setPreviewDoc(null)
    api.get(`/documents/folders/${selectedFolderId}`)
      .then(data => setFolderContents(data))
      .catch(err => console.error('Failed to load folder contents:', err))
      .finally(() => setDocsLoading(false))
  }, [selectedFolderId])

  // ── Semantic search (documents) ──────────────────────────
  useEffect(() => {
    if (activeNav !== 'documents') return

    const q = docSearchQuery.trim()
    if (!q) {
      setDocSearchLoading(false)
      setDocSearchError('')
      setDocSearchResults([])
      return
    }

    let cancelled = false
    setDocSearchLoading(true)
    setDocSearchError('')

    const t = setTimeout(() => {
      api.get(`/documents/search?q=${encodeURIComponent(q)}&topK=20`)
        .then(data => {
          if (cancelled) return
          setDocSearchResults(Array.isArray(data?.results) ? data.results : [])
        })
        .catch(err => {
          if (cancelled) return
          setDocSearchError(err?.message || 'Search failed')
          setDocSearchResults([])
        })
        .finally(() => {
          if (cancelled) return
          setDocSearchLoading(false)
        })
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [docSearchQuery, activeNav])

  // ── Scroll to bottom on new messages ────────────────────
  useEffect(() => {
    if (activeNav === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeNav])

  // ── Close history context menu ──────────────────────────
  useEffect(() => {
    if (!historyMenu.open) return
    function onGlobalDown() {
      setHistoryMenu(m => (m.open ? { ...m, open: false } : m))
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setHistoryMenu(m => (m.open ? { ...m, open: false } : m))
      }
    }
    window.addEventListener('mousedown', onGlobalDown)
    window.addEventListener('scroll', onGlobalDown, true)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onGlobalDown)
      window.removeEventListener('scroll', onGlobalDown, true)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [historyMenu.open])

  function handleSettingsClick() {
    logout()
    navigate('/')
  }

  async function handleNewChat() {
    try {
      const data = await api.post('/chats', {})
      setActiveSessionId(data.session.id)
      setMessages(data.messages)
      setChatSessions(prev => [data.session, ...prev])
      setActiveNav('chat')
      navigate(`/chat/${data.session.id}`)
    } catch (err) {
      console.error('Failed to create chat session:', err)
    }
  }

  async function handleSelectChat(sessionId) {
    setActiveSessionId(sessionId)
    setActiveNav('chat')
    navigate(`/chat/${sessionId}`)
  }

  async function handleDeleteChat(sessionId) {
    try {
      await api.delete(`/chats/${sessionId}`)
      setHistoryMenu(m => (m.open ? { ...m, open: false } : m))
      await fetchChatSessions()

      if (activeSessionId === sessionId) {
        setActiveSessionId(null)
        setMessages([])
        setActiveNav('home')
        navigate('/chat')
      }
    } catch (err) {
      console.error('Failed to delete chat session:', err)
    }
  }

  async function handleCommitRename(sessionId, nextTitle) {
    const title = (nextTitle ?? '').trim()
    if (!title) {
      setRenamingSessionId(null)
      setRenameValue('')
      return
    }
    try {
      await api.patch(`/chats/${sessionId}`, { title })
      setRenamingSessionId(null)
      setRenameValue('')
      fetchChatSessions()
    } catch (err) {
      console.error('Failed to rename chat session:', err)
    }
  }

  async function handleSend() {
    if (!input.trim()) return

    // If no active session, create one first
    let sessionId = activeSessionId
    if (!sessionId) {
      try {
        const data = await api.post('/chats', {})
        sessionId = data.session.id
        setActiveSessionId(sessionId)
        setMessages(data.messages)
        setChatSessions(prev => [data.session, ...prev])
        setActiveNav('chat')
        navigate(`/chat/${sessionId}`)
      } catch (err) {
        console.error('Failed to create session:', err)
        return
      }
    }

    const text = input.trim()
    setInput('')

    // Show user message immediately
    const tempUserMsg = { id: `temp-${Date.now()}`, role: 'user', text, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) }
    setMessages(prev => [...prev, tempUserMsg])
    setAiLoading(true)

    try {
      const data = await api.post(`/chats/${sessionId}/messages`, { text })
      setMessages(prev => {
        const without = prev.filter(m => m.id !== tempUserMsg.id)
        const alreadyHasUser = without.some(m => String(m.id) === String(data.userMessage.id))
        return alreadyHasUser
          ? [...without, data.aiMessage]
          : [...without, data.userMessage, data.aiMessage]
      })
      fetchChatSessions()
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setAiLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const trimmedDocSearchQuery = docSearchQuery.trim()
  const hasDocSearch = trimmedDocSearchQuery.length > 0
  const currentFolderName = hasDocSearch
    ? 'Search results'
    : selectedFolderId
      ? (findFolderInTree(folderTree, selectedFolderId)?.name ?? 'Documents')
      : 'Documents'

  const normalizedSelectedPermTags = selectedPermTags.map(t => t.toLowerCase())
  const visibleDocuments = (docsMode === 'tags' && normalizedSelectedPermTags.length > 0)
    ? folderContents.documents.filter(d => normalizedSelectedPermTags.includes(String(d.permission).toLowerCase()))
    : folderContents.documents

  return (
    <div className="chatbot-root">
      {/* ── Left Sidebar ── */}
      <aside className={`chatbot-sidebar${sidebarPinned ? ' chatbot-sidebar--pinned' : ''}`}>
        {/* Logo */}
        <button
          className="chatbot-sidebar-top"
          onClick={() => {
            setActiveNav('home')
            setActiveSessionId(null)
            setMessages([])
            navigate('/chat')
          }}
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
            onClick={() => {
              setActiveNav('home')
              setActiveSessionId(null)
              setMessages([])
              navigate('/chat')
            }}
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

        {/* Chat history list */}
        <div className="chatbot-sidebar-history">
          <div className="chatbot-sidebar-history-label">RECENT CHATS</div>
          {chatSessions.map(chat => (
            <button
              key={chat.id}
              className={`chatbot-history-item ${activeSessionId === chat.id ? 'chatbot-history-item--active' : ''}`}
              onClick={() => handleSelectChat(chat.id)}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setHistoryMenu({ open: true, x: e.clientX, y: e.clientY, sessionId: chat.id })
              }}
            >
              <span className="chatbot-history-dot" />
              <span className="chatbot-history-title" style={{ minWidth: 0, flex: 1 }}>
                {renamingSessionId === chat.id ? (
                  <input
                    value={renameValue}
                    autoFocus
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleCommitRename(chat.id, renameValue)
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault()
                        setRenamingSessionId(null)
                        setRenameValue('')
                      }
                    }}
                    onBlur={() => handleCommitRename(chat.id, renameValue)}
                    style={{
                      width: '100%',
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                      padding: '6px 8px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.22)',
                      outline: 'none',
                      background: 'rgba(255,255,255,0.10)',
                      color: 'white',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  />
                ) : (
                  chat.title
                )}
              </span>
              <span className="chatbot-history-time">{chat.time}</span>
            </button>
          ))}

          <button className="chatbot-new-chat-btn" onClick={handleNewChat}>
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
      {historyMenu.open && (
        <div
          role="menu"
          aria-label="Chat options"
          style={{
            position: 'fixed',
            top: historyMenu.y,
            left: historyMenu.x,
            zIndex: 9999,
            background: '#0B3C71',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 10,
            padding: 6,
            minWidth: 160,
            boxShadow: '0 18px 50px rgba(0,0,0,0.35)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            style={{
              width: '100%',
              textAlign: 'left',
              background: 'transparent',
              border: 0,
              color: 'white',
              padding: '10px 10px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
            onClick={() => {
              const id = historyMenu.sessionId
              if (!id) return
              const current = chatSessions.find(s => s.id === id)
              setRenamingSessionId(id)
              setRenameValue(current?.title ?? '')
              setHistoryMenu(m => (m.open ? { ...m, open: false } : m))
            }}
          >
            Rename
          </button>
          <button
            type="button"
            role="menuitem"
            style={{
              width: '100%',
              textAlign: 'left',
              background: 'transparent',
              border: 0,
              color: 'white',
              padding: '10px 10px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
            onClick={() => {
              if (!historyMenu.sessionId) return
              handleDeleteChat(historyMenu.sessionId)
            }}
          >
            Delete
          </button>
        </div>
      )}
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
              <div className="doc-search-wrap">
                <svg viewBox="0 0 20 20" fill="none" width="15" height="15" className="doc-search-icon">
                  <circle cx="8.5" cy="8.5" r="5.5" stroke="#9CA3AF" strokeWidth="1.6"/>
                  <path d="M13 13l3.5 3.5" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                <input
                  className="doc-search-input"
                  placeholder="Semantic search documents..."
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                />
              </div>

              <div className="doc-tabs">
                <button
                  className={`doc-tab ${docsMode === 'folders' ? 'doc-tab--active' : ''}`}
                  onClick={() => setDocsMode('folders')}
                  type="button"
                >
                  Folders
                </button>
                <button
                  className={`doc-tab ${docsMode === 'tags' ? 'doc-tab--active' : ''}`}
                  onClick={() => setDocsMode('tags')}
                  type="button"
                >
                  Tags
                </button>
              </div>

              <div className="doc-tree">
                {folderTree.length === 0 ? (
                  <div style={{ padding: '12px', color: '#9CA3AF', fontSize: '13px' }}>Loading...</div>
                ) : (
                  folderTree.map(node => (
                    <TreeItem key={node.id} node={node} selectedId={selectedFolderId} onSelect={setSelectedFolderId} />
                  ))
                )}
              </div>
            </div>

            {/* Right panel */}
            <div className="doc-right-panel">
              {/* Breadcrumb */}
              <div className="doc-breadcrumb">
                {previewDoc ? (
                  <>
                    <button className="doc-bc-nav" onClick={() => setPreviewDoc(null)} title="Back to files">
                      <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <div className="doc-bc-sep" />
                    <span className="doc-bc-current" style={{ cursor: 'pointer', textDecoration: 'underline', opacity: 0.7 }} onClick={() => setPreviewDoc(null)}>{currentFolderName}</span>
                    <span style={{ margin: '0 6px', opacity: 0.4 }}>/</span>
                    <span className="doc-bc-current">{previewDoc.name}</span>
                  </>
                ) : (
                  <>
                    <button className="doc-bc-nav">
                      <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button className="doc-bc-nav">
                      <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <div className="doc-bc-sep" />
                    <span className="doc-bc-current">{currentFolderName}</span>
                    <button className="doc-bc-dropdown">
                      <svg viewBox="0 0 16 16" fill="none" width="12" height="12"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </>
                )}
              </div>

              {previewDoc ? (
                <div className="doc-preview-panel">
                  <div className="doc-preview-meta">
                    <span className={`doc-permission doc-permission--${previewDoc.permission.toLowerCase()}`}>{previewDoc.permission}</span>
                    <span className="doc-preview-detail">{previewDoc.kind}</span>
                    <span className="doc-preview-detail">{previewDoc.size}</span>
                    <span className="doc-preview-detail">{previewDoc.modified}</span>
                    {previewDoc.fileUrl && (
                      <a href={previewDoc.fileUrl} download={previewDoc.name} className="doc-preview-download">
                        <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                          <path d="M10 3v10M6 9l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                        Download
                      </a>
                    )}
                  </div>
                  {previewDoc.fileUrl ? (
                    <iframe
                      src={previewDoc.fileUrl}
                      title={previewDoc.name}
                      className="doc-preview-iframe"
                    />
                  ) : (
                    <div style={{ padding: '32px', color: '#9CA3AF', textAlign: 'center' }}>No file available for preview.</div>
                  )}
                </div>
              ) : hasDocSearch ? (
                <div className="doc-section">
                  <h3 className="doc-section-title">Search results</h3>
                  <div style={{ marginTop: -6, marginBottom: 12, color: '#9CA3AF', fontSize: 13 }}>
                    Showing top matches for “{trimmedDocSearchQuery}”.
                  </div>

                  {docSearchLoading ? (
                    <div style={{ padding: '16px', color: '#9CA3AF', fontSize: '13px' }}>Searching...</div>
                  ) : docSearchError ? (
                    <div style={{ padding: '16px', color: '#FCA5A5', fontSize: '13px' }}>{docSearchError}</div>
                  ) : docSearchResults.length === 0 ? (
                    <div style={{ padding: '16px', color: '#9CA3AF', fontSize: '13px' }}>
                      No results found. If you recently added documents, index them first by running
                      <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
                        {' '}node backend/scripts/indexDocuments.js
                      </span>
                      .
                    </div>
                  ) : (
                    <div className="doc-table-wrap">
                      <table className="doc-table doc-table--search">
                        <thead>
                          <tr>
                            <th><input type="checkbox" /></th>
                            <th>Name</th>
                            <th>Score</th>
                            <th>Added By</th>
                            <th>Date Modified</th>
                            <th>Size</th>
                            <th>Kind</th>
                            <th>Permission</th>
                          </tr>
                        </thead>
                        <tbody>
                          {docSearchResults.map(r => {
                            const d = r.document
                            const highlight = r.highlights?.[0]?.text
                            const preview = typeof highlight === 'string'
                              ? (highlight.length > 160 ? `${highlight.slice(0, 160)}…` : highlight)
                              : null
                            return (
                              <tr key={d.id} onClick={() => setPreviewDoc(d)} style={{ cursor: 'pointer' }}>
                                <td onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                                <td>
                                  <div className="doc-file-name">
                                    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" style={{ flexShrink: 0 }}>
                                      <path d="M4 2h8l4 4v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" fill="#6B7280" opacity="0.7"/>
                                      <path d="M12 2v4h4" stroke="white" strokeWidth="1.2"/>
                                    </svg>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                                      {preview && (
                                        <div style={{ marginTop: 3, color: '#9CA3AF', fontSize: 12, lineHeight: 1.35 }}>
                                          {preview}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td style={{ fontVariantNumeric: 'tabular-nums' }}>{Number(r.score ?? 0).toFixed(2)}</td>
                                <td>{d.addedBy}</td>
                                <td>{d.modified}</td>
                                <td>{d.size}</td>
                                <td>{d.kind}</td>
                                <td>
                                  <span className={`doc-permission doc-permission--${d.permission.toLowerCase()}`}>{d.permission}</span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : docsLoading ? (
                <div style={{ padding: '32px', color: '#9CA3AF', textAlign: 'center' }}>Loading...</div>
              ) : (
                <>
                  {/* Folders section */}
                  {folderContents.subfolders.length > 0 && (
                    <div className="doc-section">
                      <h3 className="doc-section-title">Folders</h3>
                      <div className="doc-folder-grid">
                        {folderContents.subfolders.map(f => (
                          <FolderCard
                            key={f.id}
                            folder={f}
                            selected={selectedCardId === f.id}
                            onClick={() => { setSelectedCardId(f.id); setSelectedFolderId(f.id) }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Files table */}
                  <div className="doc-section">
                    <h3 className="doc-section-title">Files</h3>
                    {docsMode === 'tags' && (
                      <div className="doc-tags-filter">
                        <div className="doc-tags-filter-label">Filter by permission</div>
                        <div className="doc-tags-chips">
                          {['Admin', 'Manager', 'Employee', 'Customer'].map(tag => {
                            const active = selectedPermTags.includes(tag)
                            return (
                              <button
                                key={tag}
                                type="button"
                                className={`doc-tag-chip ${active ? 'doc-tag-chip--active' : ''}`}
                                onClick={() => {
                                  setSelectedPermTags(prev => (
                                    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                  ))
                                }}
                              >
                                {tag}
                              </button>
                            )
                          })}
                          <button
                            type="button"
                            className="doc-tag-clear"
                            onClick={() => setSelectedPermTags([])}
                            disabled={selectedPermTags.length === 0}
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}
                    {visibleDocuments.length === 0 ? (
                      <div style={{ padding: '16px', color: '#9CA3AF', fontSize: '13px' }}>No files in this folder.</div>
                    ) : (
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
                            {visibleDocuments.map(f => (
                              <tr key={f.id} onClick={() => setPreviewDoc(f)} style={{ cursor: 'pointer' }}>
                                <td onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                                <td>
                                  <div className="doc-file-name">
                                    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" style={{ flexShrink: 0 }}>
                                      <path d="M4 2h8l4 4v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" fill="#6B7280" opacity="0.7"/>
                                      <path d="M12 2v4h4" stroke="white" strokeWidth="1.2"/>
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
                    )}
                  </div>
                </>
              )}
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
              <button className="chatbot-toolbar-btn chatbot-toolbar-btn--dark" onClick={handleNewChat}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
                </svg>
                <span> New chat</span>
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="chatbot-messages">
            {chatLoading ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>Loading messages...</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
                Select a chat or start a new one.
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`chatbot-message chatbot-message--${msg.role}`}>
                  {msg.role === 'ai' && (
                    <div className="chatbot-message-avatar">
                      <img src={miniLogo} alt="AI" />
                    </div>
                  )}
                  <div className="chatbot-message-content">
                    <div className="chatbot-message-bubble">
                      {msg.text.split('\n').map((line, i, arr) => (
                        <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                      ))}
                    </div>
                    <div className="chatbot-message-time">{msg.time}</div>
                  </div>
                </div>
              ))
            )}
            {aiLoading && (
              <div className="chatbot-message chatbot-message--ai">
                <div className="chatbot-message-avatar">
                  <img src={miniLogo} alt="AI" />
                </div>
                <div className="chatbot-message-content">
                  <div className="chatbot-message-bubble chatbot-typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
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
                <button className="chatbot-send-btn" aria-label="Send" onClick={handleSend} disabled={aiLoading}>
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
            <button className="chatbot-toolbar-btn chatbot-toolbar-btn--dark" onClick={handleNewChat}>
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
