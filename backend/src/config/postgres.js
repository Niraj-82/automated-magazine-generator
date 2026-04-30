// src/config/postgres.js
const { Sequelize } = require('sequelize');
const path = require('path');
const logger = require('./logger');

let sequelize;

// Try PostgreSQL first, fall back to SQLite if unavailable
if (process.env.USE_SQLITE === 'true' || !process.env.PG_PASSWORD) {
  // SQLite fallback — works without any external database service
  const dbPath = path.join(__dirname, '..', '..', 'data', 'magazine.sqlite');
  const fs = require('fs');
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: (sql) => logger.debug(sql),
    define: { underscored: true, timestamps: true },
  });
  logger.info(`Using SQLite database at: ${dbPath}`);
} else {
  sequelize = new Sequelize({
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
}

async function connectPostgres() {
  try {
    await sequelize.authenticate();
    logger.info(`✓ SQL database connected (${sequelize.getDialect()})`);
  } catch (err) {
    // If PostgreSQL fails, try falling back to SQLite
    if (sequelize.getDialect() === 'postgres') {
      logger.warn('⚠️ PostgreSQL unavailable, falling back to SQLite...');
      const dbPath = path.join(__dirname, '..', '..', 'data', 'magazine.sqlite');
      const fs = require('fs');
      const dataDir = path.dirname(dbPath);
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

      sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        logging: (sql) => logger.debug(sql),
        define: { underscored: true, timestamps: true },
      });
      
      // Re-initialize models with new sequelize instance
      try {
        await sequelize.authenticate();
        logger.info(`✓ SQLite fallback connected: ${dbPath}`);
      } catch (sqliteErr) {
        logger.error('Both PostgreSQL and SQLite failed:', sqliteErr.message);
      }
    } else {
      logger.error('SQLite connection failed:', err.message);
    }
  }
}

module.exports = { sequelize, connectPostgres, getSequelize: () => sequelize };
