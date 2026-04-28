const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, AuditLog, Notification } = require('../models/sql');

const getAllUsers = async (req, res) => {
  try {
    const { search, role, department, page = 1, limit = 10 } = req.query;
    let whereClause = {};
    if (search) {
      whereClause = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { rollNumber: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }
    if (role) whereClause.role = role;
    if (department) whereClause.department = department;

    const offset = (page - 1) * limit;
    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page, 10), pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error retrieving users' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error retrieving user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, role, rollNumber, department, isActive } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (rollNumber !== undefined) updates.rollNumber = rollNumber;
    if (department !== undefined) updates.department = department;
    if (isActive !== undefined) updates.isActive = isActive;

    await user.update(updates);
    await AuditLog.logAction('USER_UPDATE', req.user.id, { targetUserId: user.id, updates }, req.ip);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error updating user' });
  }
};

const deactivateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    await user.update({ isActive: false });
    await AuditLog.logAction('USER_DEACTIVATE', req.user.id, { targetUserId: user.id }, req.ip);
    res.status(200).json({ success: true, data: user, message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error deactivating user' });
  }
};

// Improvement 2: Admin-only faculty account creation
const createFaculty = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({ success: false, error: 'Name, email, password and department are required.' });
    }

    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const faculty = await User.create({
      name, email, passwordHash,
      role: 'faculty',
      department,
    });

    await AuditLog.logAction('USER_REGISTER', req.user.id, { email: faculty.email, role: 'faculty', createdBy: req.user.id }, req.ip);

    // Welcome notification
    try {
      await Notification.create({
        userId: faculty.id,
        type: 'info',
        title: 'Welcome to Tech Odyssey',
        message: `Your faculty account has been created. You can now review student submissions.`,
      });
    } catch (_e) { /* non-critical */ }

    return res.status(201).json({ success: true, data: faculty });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server error creating faculty account.' });
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deactivateUser, createFaculty };

