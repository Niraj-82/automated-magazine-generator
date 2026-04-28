const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, AuditLog } = require('../models/sql');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

// ── 5H: Account lockout — in-memory map (resets on server restart) ──
// Map<email, { count: number, lockUntil: number | null }>
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function checkLockout(email) {
  const entry = loginAttempts.get(email);
  if (!entry) return null;
  if (entry.lockUntil && Date.now() < entry.lockUntil) {
    const remaining = Math.ceil((entry.lockUntil - Date.now()) / 60000);
    return remaining;
  }
  return null;
}

function recordFailure(email) {
  const entry = loginAttempts.get(email) || { count: 0, lockUntil: null };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockUntil = Date.now() + LOCKOUT_MS;
  }
  loginAttempts.set(email, entry);
  return entry.count;
}

function clearAttempts(email) {
  loginAttempts.delete(email);
}

const register = async (req, res) => {
  try {
    const { name, email, password, role, rollNumber, department } = req.body;

    // Self-registration is for students only
    const requestedRole = role || 'student';
    if (requestedRole !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Faculty accounts must be created by an administrator.'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ where: { email: email.toLowerCase() } });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Hash password (exactly 12 rounds as per spec)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'student',
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
    const normalEmail = (email || '').toLowerCase();

    // 5H: Check lockout
    const lockedMinutes = checkLockout(normalEmail);
    if (lockedMinutes !== null) {
      return res.status(429).json({
        success: false,
        error: `Account temporarily locked. Try again in ${lockedMinutes} minute(s).`
      });
    }

    const user = await User.findOne({ where: { email: normalEmail } });
    const invalidMessage = 'Invalid email or password.';

    if (!user) {
      const count = recordFailure(normalEmail);
      await AuditLog.logAction('USER_LOGIN', null, { email: normalEmail, status: 'failed_not_found', attempts: count }, req.ip);
      return res.status(401).json({ success: false, error: invalidMessage });
    }

    if (!user.isActive) {
      await AuditLog.logAction('USER_LOGIN', user.id, { status: 'failed_inactive' }, req.ip);
      return res.status(403).json({ success: false, error: 'Account has been deactivated.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      const count = recordFailure(normalEmail);
      await AuditLog.logAction('USER_LOGIN', user.id, { status: 'failed_wrong_password', attempts: count }, req.ip);
      if (count >= MAX_ATTEMPTS) {
        return res.status(429).json({ success: false, error: `Account temporarily locked. Try again in 15 minute(s).` });
      }
      return res.status(401).json({ success: false, error: invalidMessage });
    }

    // Successful login — clear lockout
    clearAttempts(normalEmail);
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
  res.status(200).json({ success: true, data: { user: req.user } });
};

const logout = async (req, res) => {
  try {
    await AuditLog.logAction('USER_LOGOUT', req.user.id, null, req.ip);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error during logout' });
  }
};

module.exports = { register, login, verifyToken, logout };
