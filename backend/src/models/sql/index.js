const { sequelize } = require('../../config/postgres');
const logger = require('../../config/logger');

const User = require('./User.model');
const AuditLog = require('./AuditLog.model');
const Notification = require('./Notification.model');

// Define associations
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

const syncModels = async () => {
  try {
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('SQL models synchronized successfully.');
  } catch (error) {
    logger.error('Failed to synchronize SQL models:', error);
  }
};

module.exports = {
  User,
  AuditLog,
  Notification,
  syncModels,
};
