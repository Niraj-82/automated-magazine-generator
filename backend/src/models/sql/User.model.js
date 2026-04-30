const logger = require('../../config/logger');
const { sequelize } = require('../../config/postgres');
const { DataTypes } = require('sequelize');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    set(val) {
      if (val) this.setDataValue('email', val.toLowerCase());
    },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'student',
    validate: {
      isIn: [['student', 'faculty', 'lab_assistant', 'admin']],
    },
  },
  rollNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isStudentRollNumber(value) {
        if (this.role === 'student') {
          if (!value || !/^\d{7}$/.test(value)) {
            throw new Error('Student roll number must be exactly 7 digits');
          }
        }
      }
    }
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeValidate: (user) => {
      if (user.role !== 'student') {
        user.rollNumber = null;
      }
    }
  }
});

User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values.passwordHash;
  return values;
};

module.exports = User;
