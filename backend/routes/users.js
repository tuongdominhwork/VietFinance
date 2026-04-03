const express = require('express');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/users — admin and manager only
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  const { role, tier } = req.query;
  const users = await User.list({ role, tier });
  res.json({ users });
});

module.exports = router;
