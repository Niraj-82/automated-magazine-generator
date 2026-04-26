const { AuditLog, User } = require('../models/sql');

const getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, action, userId } = req.query;
    
    const whereClause = {};
    if (action) whereClause.action = action;
    if (userId) whereClause.userId = userId;

    const offset = (page - 1) * limit;

    const { count, rows } = await AuditLog.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
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
    res.status(500).json({ success: false, error: 'Server error retrieving logs' });
  }
};

module.exports = {
  getLogs
};
