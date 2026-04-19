// src/config/postgres.js
const { Sequelize } = require('sequelize');
const logger = require('./logger');

const sequelize = new Sequelize({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'magazine_db',
  username: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD,
  dialect: 'postgres',
  logging: (sql) => logger.debug(sql),
  pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
  define: { underscored: true, timestamps: true },
});

async function connectPostgres() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
  } catch (err) {
    logger.warn('⚠️ PostgreSQL connection failed. Running without DB sync.');
  }
}

module.exports = { sequelize, connectPostgres };
