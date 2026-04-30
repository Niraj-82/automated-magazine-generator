// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

const { connectPostgres } = require('./config/postgres');
const { connectMongo } = require('./config/mongo');
const logger = require('./config/logger');

// Route imports
const authRoutes = require('./routes/auth');
const submissionRoutes = require('./routes/submissions');
const userRoutes = require('./routes/users');
const templateRoutes = require('./routes/templates');
const generateRoutes = require('./routes/generate');
const logRoutes = require('./routes/logs');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security middleware ──
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
}));

// ── CORS ──
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting — prevents brute force ──
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Strict limit on auth endpoints
  message: { success: false, error: 'Too many login attempts, please wait 15 minutes.' },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 5,
  message: { success: false, error: 'Upload rate limit exceeded.' },
});

app.use(globalLimiter);

// ── Body parsing ──
app.use(express.json({ limit: '1mb' })); // Limit JSON body size
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Logging (only request metadata — no sensitive data) ──
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
  skip: (req) => req.url.includes('/health'),
}));

// ── Static uploads (served with auth in real deployment) ──
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── API Routes ──
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/notifications', notificationRoutes);

// ── Health check ──
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler — NEVER expose stack traces to client ──
app.use((err, req, res, next) => {
  // Log full error server-side only
  logger.error(`${err.status || 500} — ${err.message} — ${req.originalUrl} — ${req.method} — ${req.ip}`);
  if (err.stack) logger.error(err.stack);

  // Send safe message to client
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: status === 500 ? 'An internal server error occurred.' : err.message,
    // Stack traces are NEVER sent to client
  });
});

// ── Start server ──
async function startServer() {
  try {
    await connectPostgres();
    logger.info('✓ PostgreSQL connected');

    // Sync models and seed demo users
    const { syncModels } = require('./models/sql');
    await syncModels();

    await connectMongo();
    logger.info('✓ MongoDB connected');

    // Seed MongoDB templates
    const { seedTemplates } = require('./models/mongo');
    if (seedTemplates) await seedTemplates();

    app.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
