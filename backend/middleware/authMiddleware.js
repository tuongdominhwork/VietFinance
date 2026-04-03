const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Account not found or deactivated' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Role-based: authorize('admin', 'manager')
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

// Tier-based for AI chatbot access
// admin/manager/employee always pass; customer must match one of the allowed tiers
function authorizeCustomerTier(...tiers) {
  return (req, res, next) => {
    const { role, tier } = req.user;
    if (['admin', 'manager', 'employee'].includes(role)) return next();
    if (role === 'customer' && tiers.includes(tier)) return next();
    return res.status(403).json({
      message: 'Your plan does not have access to this feature',
      required_tiers: tiers,
      your_tier: tier,
    });
  };
}

module.exports = { authenticate, authorize, authorizeCustomerTier };
