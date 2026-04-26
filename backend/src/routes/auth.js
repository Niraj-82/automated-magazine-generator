const express = require('express');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validate');
const { register, login, verifyToken, logout } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  handleValidationErrors,
  register
);

router.post(
  '/login',
  [
    body('email').trim().notEmpty().withMessage('Email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidationErrors,
  login
);

router.get('/verify', requireAuth, verifyToken);

router.post('/logout', requireAuth, logout);

module.exports = router;
