const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const VALID_ROLE_TIERS = {
  admin:    [null],
  manager:  [null],
  employee: ['junior', 'senior'],
  customer: ['no_plan', 'student', 'vip', 'premium'],
};

function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, tier: user.tier },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { name, email, password, role, tier } = req.body;

  const allowedTiers = VALID_ROLE_TIERS[role];
  if (!allowedTiers) {
    return res.status(400).json({ message: `Invalid role: ${role}` });
  }
  const normalizedTier = tier || null;
  if (!allowedTiers.includes(normalizedTier)) {
    return res.status(400).json({
      message: `Invalid tier "${tier}" for role "${role}". Allowed: ${allowedTiers.join(', ') || 'none'}`,
    });
  }

  if (await User.findByEmail(email)) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed, role, tier: normalizedTier });

  return res.status(201).json({ token: generateToken(user), user });
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const record = await User.findByEmail(email);

  if (!record || !record.isActive) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, record.password);
  if (!match) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const user = await User.findById(record.id);
  return res.json({ token: generateToken(user), user });
}

function me(req, res) {
  return res.json({ user: req.user });
}

module.exports = { register, login, me };
