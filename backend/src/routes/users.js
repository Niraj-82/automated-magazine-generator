const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  createFaculty,
} = require('../controllers/users.controller');

const router = express.Router();

router.use(requireAuth);

router.get('/', requireRole('admin', 'lab_assistant', 'faculty'), getAllUsers);
router.get('/:id', getUserById);
router.patch('/:id', requireRole('admin', 'lab_assistant'), updateUser);
router.delete('/:id', requireRole('admin', 'lab_assistant'), deactivateUser);

// Improvement 2: Lab assistant creates faculty accounts
router.post('/create-faculty', requireRole('lab_assistant', 'admin'), createFaculty);

module.exports = router;

