const jwt = require('jsonwebtoken');
const { User } = require('../models/sql');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch fresh user
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'User no longer exists' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ success: false, error: 'User account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied: insufficient permissions' });
    }

    next();
  };
};

const requireOwnership = (resourceUserId, reqUser) => {
  // Check if the user is an admin or the owner of the resource
  if (reqUser.role === 'admin' || reqUser.id === resourceUserId) {
    return true;
  }
  return false;
};

module.exports = {
  requireAuth,
  requireRole,
  requireOwnership
};
