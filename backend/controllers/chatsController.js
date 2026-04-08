const prisma = require('../config/db');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:e4b';

const SYSTEM_PROMPT = `You are VietFinance AI, a helpful assistant for VietFinance — a Vietnamese banking and financial services platform.
You help customers with banking questions, financial products, account management, and general financial advice relevant to the Vietnamese market.
Be concise, professional, and friendly. Respond in the same language the user writes in (Vietnamese or English).`;

async function callOllama(messages) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.message.content;
}

exports.getSessions = async (req, res) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      sessions: sessions.map(s => ({
        id: s.id,
        title: s.title,
        time: formatRelativeTime(s.updatedAt),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createSession = async (req, res) => {
  const { title } = req.body;
  try {
    const session = await prisma.chatSession.create({
      data: {
        title: title || 'New Chat',
        userId: req.user.id,
        messages: {
          create: [{
            role: 'ai',
            text: "Hello! I'm VietFinance AI. How can I assist you with your banking needs today?",
          }],
        },
      },
      include: { messages: true },
    });

    res.status(201).json({
      session: {
        id: session.id,
        title: session.title,
        time: formatRelativeTime(session.updatedAt),
      },
      messages: session.messages.map(formatMessage),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getMessages = async (req, res) => {
  const sessionId = parseInt(req.params.id);
  if (isNaN(sessionId)) return res.status(400).json({ message: 'Invalid session ID' });

  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: req.user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!session) return res.status(404).json({ message: 'Session not found' });

    res.json({ messages: session.messages.map(formatMessage) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.addMessage = async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const { text } = req.body;

  if (!text || !text.trim()) return res.status(400).json({ message: 'text is required' });

  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: req.user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: { sessionId, role: 'user', text: text.trim() },
    });

    // Auto-title from first user message
    if (session.title === 'New Chat') {
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { title: text.length > 45 ? text.substring(0, 45) + '...' : text.trim() },
      });
    }

    // Build conversation history for Claude (exclude the greeting message)
    const history = session.messages
      .filter(m => !(m.role === 'ai' && session.messages.indexOf(m) === 0))
      .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));
    history.push({ role: 'user', content: text.trim() });

    // Call Ollama
    let aiText;
    try {
      aiText = await callOllama(history);
    } catch (apiErr) {
      console.error('Ollama error:', apiErr.message);
      aiText = `Sorry, I'm unable to respond right now. (${apiErr.message})`;
    }

    // Save AI reply
    const aiMessage = await prisma.chatMessage.create({
      data: { sessionId, role: 'ai', text: aiText },
    });

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    res.status(201).json({
      userMessage: formatMessage(userMessage),
      aiMessage: formatMessage(aiMessage),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteSession = async (req, res) => {
  const sessionId = parseInt(req.params.id);
  if (isNaN(sessionId)) return res.status(400).json({ message: 'Invalid session ID' });

  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: req.user.id },
    });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    await prisma.chatSession.delete({
      where: { id: sessionId },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.renameSession = async (req, res) => {
  const sessionId = parseInt(req.params.id);
  if (isNaN(sessionId)) return res.status(400).json({ message: 'Invalid session ID' });

  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title) return res.status(400).json({ message: 'title is required' });
  if (title.length > 120) return res.status(400).json({ message: 'title must be 120 characters or fewer' });

  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: req.user.id },
    });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const updated = await prisma.chatSession.update({
      where: { id: sessionId },
      data: { title, updatedAt: new Date() },
    });

    res.json({
      session: {
        id: updated.id,
        title: updated.title,
        time: formatRelativeTime(updated.updatedAt),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

function formatMessage(m) {
  return {
    id: m.id,
    role: m.role,
    text: m.text,
    time: new Date(m.createdAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  };
}

function formatRelativeTime(date) {
  const now = new Date();
  const d = new Date(date);
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
