const { sequelize } = require('../../config/postgres');
const logger = require('../../config/logger');
const bcrypt = require('bcryptjs');

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
    await seedDemoUsers();
  } catch (error) {
    logger.error('Failed to synchronize SQL models:', error);
  }
};

const seedDemoUsers = async () => {
  const demoUsers = [
    {
      name: 'Arjun Sharma',
      email: 'student@fcrit.ac.in',
      role: 'student',
      rollNumber: '1023456',
      department: 'Computer Engineering',
    },
    {
      name: 'Dr. Smita Dange',
      email: 'faculty@fcrit.ac.in',
      role: 'faculty',
      department: 'Computer Engineering',
    },
    {
      name: 'Lab Assistant Kumar',
      email: 'lab@fcrit.ac.in',
      role: 'lab_assistant',
      department: 'Computer Engineering',
    },
  ];

  try {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash('demo123', salt);

    for (const userData of demoUsers) {
      const [user, created] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: { ...userData, passwordHash },
      });
      if (created) {
        logger.info(`Seeded demo user: ${userData.email} (${userData.role})`);
      }
    }
  } catch (error) {
    logger.error('Failed to seed demo users:', error.message);
  }
};

module.exports = {
  User,
  AuditLog,
  Notification,
  syncModels,
};
