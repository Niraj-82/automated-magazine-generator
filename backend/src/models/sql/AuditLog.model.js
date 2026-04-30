const logger = require('../../config/logger');
const { sequelize } = require('../../config/postgres');
const { DataTypes } = require('sequelize');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true, // Allow null for system actions
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [[
        'USER_REGISTER', 'USER_LOGIN', 'USER_LOGOUT', 'USER_UPDATE', 'USER_DEACTIVATE',
        'SUBMISSION_CREATE', 'SUBMISSION_UPDATE', 'SUBMISSION_DELETE', 'SUBMISSION_STATUS_CHANGE',
        'SUBMISSION_TEMPLATE_OVERRIDE', 'MAGAZINE_GENERATE',
        'TEMPLATE_CREATE', 'TEMPLATE_UPDATE', 'TEMPLATE_DELETE',
        'PDF_GENERATE', 'PDF_DOWNLOAD', 'SYSTEM_ERROR'
      ]],
    },
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false, // Immutable, only createdAt
});

// Prevent updates and deletes on this model to make it immutable
AuditLog.beforeUpdate(() => {
  throw new Error('Audit logs are immutable');
});
AuditLog.beforeDestroy(() => {
  throw new Error('Audit logs are immutable');
});

AuditLog.logAction = async function (action, userId = null, details = null, ipAddress = null) {
  try {
    await this.create({
      action,
      userId,
      details,
      ipAddress,
    });
  } catch (error) {
    // Never throws, just log to the file system logger
    logger.error('Failed to write audit log:', error);
  }
};

module.exports = AuditLog;
