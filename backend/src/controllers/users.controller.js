const { Op } = require('sequelize');
const { User, AuditLog } = require('../models/sql');

const getAllUsers = async (req, res) => {
  try {
    const { search, role, department, page = 1, limit = 10 } = req.query;
    
    let whereClause = {};
    
    if (search) {
      // Use Op.iLike, zero string concatenation as per rules
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
      pagination: {
        total: count,
        page: parseInt(page, 10),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error retrieving users' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error retrieving user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, role, rollNumber, department } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (rollNumber !== undefined) updates.rollNumber = rollNumber;
    if (department !== undefined) updates.department = department;

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

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Soft delete ONLY - set isActive to false
    await user.update({ isActive: false });

    await AuditLog.logAction('USER_DEACTIVATE', req.user.id, { targetUserId: user.id }, req.ip);

    res.status(200).json({ success: true, data: user, message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error deactivating user' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser
};
