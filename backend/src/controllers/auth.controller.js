const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, AuditLog } = require('../models/sql');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password, role, rollNumber, department } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ where: { email: email.toLowerCase() } });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Hash password (exactly 12 rounds as per spec)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || 'student',
      rollNumber,
      department
    });

    await AuditLog.logAction('USER_REGISTER', user.id, { email: user.email }, req.ip);

    res.status(201).json({
      success: true,
      data: {
        token: generateToken(user.id),
        user
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    // Use identical error message for wrong email or password
    const invalidMessage = 'Invalid email or password.';

    if (!user) {
      await AuditLog.logAction('USER_LOGIN', null, { email, status: 'failed_not_found' }, req.ip);
      return res.status(401).json({ success: false, error: invalidMessage });
    }

    if (!user.isActive) {
      await AuditLog.logAction('USER_LOGIN', user.id, { status: 'failed_inactive' }, req.ip);
      return res.status(403).json({ success: false, error: 'Account has been deactivated.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      await AuditLog.logAction('USER_LOGIN', user.id, { status: 'failed_wrong_password' }, req.ip);
      return res.status(401).json({ success: false, error: invalidMessage });
    }

    user.lastLogin = new Date();
    await user.save();

    await AuditLog.logAction('USER_LOGIN', user.id, { status: 'success' }, req.ip);

    res.status(200).json({
      success: true,
      data: {
        token: generateToken(user.id),
        user
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
};

const verifyToken = async (req, res) => {
  // auth middleware already verifies the token and sets req.user
  res.status(200).json({
    success: true,
    data: {
      user: req.user
    }
  });
};

const logout = async (req, res) => {
  try {
    // Client is responsible for deleting the token, but we log the action
    await AuditLog.logAction('USER_LOGOUT', req.user.id, null, req.ip);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error during logout' });
  }
};

module.exports = {
  register,
  login,
  verifyToken,
  logout
};
