const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser
} = require('../controllers/users.controller');

const router = express.Router();

// All user routes require authentication
router.use(requireAuth);

router.get('/', requireRole('admin', 'lab_assistant', 'faculty'), getAllUsers);
router.get('/:id', getUserById);
router.patch('/:id', requireRole('admin', 'lab_assistant'), updateUser);
router.delete('/:id', requireRole('admin', 'lab_assistant'), deactivateUser);

module.exports = router;
