const express = require('express');
const { body } = require('express-validator');
const { register, login, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['admin', 'manager', 'employee', 'customer'])
    .withMessage('Role must be admin, manager, employee, or customer'),
  body('tier').optional({ nullable: true }),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// POST /api/auth/register
router.post('/register', registerRules, register);

// POST /api/auth/login
router.post('/login', loginRules, login);

// GET /api/auth/me  (protected)
router.get('/me', authenticate, me);

module.exports = router;
