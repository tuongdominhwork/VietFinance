require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Initialize DB (creates tables if not exist)
require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();

app.use(cors({
  origin: /^http:\/\/localhost:\d+$/,
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`VietFinance API running on http://localhost:${PORT}`);
});
